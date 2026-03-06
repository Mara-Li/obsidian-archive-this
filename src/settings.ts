import dedent from "dedent";
import i18next from "i18next";
import {
	type App,
	Component,
	MarkdownRenderer,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { FolderSuggester } from "./folder_suggester";
import type { ArchiveThisSettings } from "./interfaces";
import type ArchiveThis from "./main";

export class ArchiveThisSettingTab extends PluginSettingTab {
	plugin: ArchiveThis;
	settings: ArchiveThisSettings;

	constructor(app: App, plugin: ArchiveThis) {
		super(app, plugin);
		this.plugin = plugin;
		this.settings = plugin.settings;
	}

	async display(): Promise<void> {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.addClass("archive-this");

		new Setting(containerEl).setName(i18next.t("settings.folder")).addSearch((cb) => {
			cb.setPlaceholder(i18next.t("settings.folderPlaceholder")).setValue(
				this.settings.archiveFolder
			);
			new FolderSuggester(cb.inputEl, this.app, async (result) => {
				this.settings.archiveFolder = result.trim();
				await this.plugin.saveSettings();
			});
		});

		new Setting(containerEl).setHeading().setName(i18next.t("settings.empty.title"));
		new Setting(containerEl)
			.setName(i18next.t("settings.empty.inSource.title"))
			.setDesc(i18next.t("settings.empty.inSource.desc"))
			.addToggle((toggle) =>
				toggle.setValue(this.settings.deleteWhenEmpty.inSource).onChange(async (val) => {
					this.settings.deleteWhenEmpty.inSource = val;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(i18next.t("settings.empty.inArchive.title"))
			.setDesc(i18next.t("settings.empty.inArchive.desc"))
			.addToggle((toggle) =>
				toggle.setValue(this.settings.deleteWhenEmpty.inArchive).onChange(async (val) => {
					this.settings.deleteWhenEmpty.inArchive = val;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setHeading()
			.setName(i18next.t("settings.overridePaths.title"))
			.setDesc(i18next.t("settings.overridePaths.desc"));

		const mdSettings = new Setting(containerEl);
		mdSettings.setClass("md-info");
		const component = new Component();
		component.load();
		const markdown = dedent`
		> [!info]
		> Il est possible de remplacer le chemin de destinations dans l'archive via l'utilisation de clé de propriétés, via la syntaxe \`{{maclé}}\`.
		> En cas d'absence de la clé, le chemin par défaut sera utilisé.
		> Il est cependant possible de fixer une valeur par défaut via la syntaxe \`{{maclé|valeur par défaut}}\`.
		
		L'utilisation des regex est totalement possible (ainsi que les remplacement via \`$1\` par exemple) en activant le toggle regex.
		
		A noter que les transformations sont faites dans l'ordre de la liste.
		
		Il est possible d'utiliser les clés spéciales \`{{ctime}}\`, \`{{mtime}}\` et \`{{size}}\` qui se basent sur les stats du fichier/folder note source. Le format de ces clés est en ISO, mais il est possible de les formater via le champ "Date format" plus bas.
		`;
		await MarkdownRenderer.render(this.app, markdown, mdSettings.infoEl, "", component);
		component.unload();

		new Setting(containerEl)
			.setName("Frontmatter key for original path")
			.addText((text) =>
				text
					.setValue(this.settings.originalPathFrontmatterKey)
					.setPlaceholder("original_path")
					.onChange(async (val) => {
						this.settings.originalPathFrontmatterKey = val.trim();
						await this.plugin.saveSettings();
					})
			);

		//Folder note settings
		new Setting(containerEl)
			.setName("Folder note settings")
			.setDesc(
				"Si la source est un dossier, alors le remplacement de chemin se basera sur une folder note pour sauvegarder le chemin original ainsi que les remplacements qui utilisent des clés de propriétés. Si cette fonction est désactivée, alors il n'y aura pas de remplacement de chemin sur les dossiers."
			)
			.addToggle((toggle) =>
				toggle.setValue(this.settings.useFolderNote.enable).onChange(async (val) => {
					this.settings.useFolderNote.enable = val;
					await this.plugin.saveSettings();
					await this.display();
				})
			);

		if (this.settings.useFolderNote.enable) {
			new Setting(containerEl)
				.setName("Folder note behavior")
				.setDesc(
					"Une folder note peut se trouver à la racine du dossier source, à son extérieur ou à l'intérieur avec un nom spécifique (index.md par exemple). "
				)
				.addDropdown((dropdown) =>
					dropdown
						.addOption("inside", "Inside the source folder")
						.addOption("outside", "Outside the source folder")
						.addOption(
							"named",
							"Inside the source folder with a specific name (index.md)"
						)
						.setValue(this.settings.useFolderNote.mode)
						.onChange(async (val) => {
							const oldMode = this.settings.useFolderNote.mode;
							this.settings.useFolderNote.mode = val as "inside" | "outside" | "named";
							await this.plugin.saveSettings();
							if (val === "named" || (oldMode === "named" && oldMode !== val))
								await this.display();
						})
				);

			if (this.settings.useFolderNote.mode === "named") {
				new Setting(containerEl)
					.setName("Folder note name")
					.setDesc(
						"Le nom du fichier de la folder note à l'intérieur du dossier source. Par défaut index.md"
					)
					.addText((text) =>
						text
							.setValue(this.settings.useFolderNote.name)
							.setPlaceholder("index.md")
							.onChange(async (val) => {
								this.settings.useFolderNote.name = val.trim();
								await this.plugin.saveSettings();
							})
					);
			}
		}

		new Setting(containerEl)
			.setName("Date format")
			.setDesc(
				"Vous pouvez, parfois, utiliser des dates dans les chemins, que ce soit via l'utilisation des clés spéciales comme ctime, mtime ou via une propriété. Utilisez le format moment ici pour définir le format résultat en chemin. Par défaut YYYY-MM-DD."
			);
		new Setting(containerEl).setName("Input format").addText((text) =>
			text
				.setValue(this.settings.date.input)
				.setPlaceholder("YYYY-MM-DD")
				.onChange(async (val) => {
					this.settings.date.input = val.trim();
					await this.plugin.saveSettings();
				})
		);
		new Setting(containerEl).setName("Output format").addText((text) =>
			text
				.setValue(this.settings.date.output)
				.setPlaceholder("YYYY-MM-DD")
				.onChange(async (val) => {
					this.settings.date.output = val.trim();
					await this.plugin.saveSettings();
				})
		);

		//add button plus
		new Setting(containerEl).addButton((btn) =>
			btn
				.setButtonText("Add override path")
				.setCta()
				.onClick(() => {
					this.settings.overridePaths.push({
						sourcePath: "",
						archivePath: "",
						regexFlags: "g"
					});
					this.display();
				})
		);

		this.settings.overridePaths.forEach((overridePath, index) => {
			const setting = new Setting(containerEl)
				.setNoInfo()
				.addExtraButton((btn) =>
					btn
						.setTooltip("Delete override path")
						.setIcon("trash")
						.onClick(async () => {
							this.settings.overridePaths.splice(index, 1);
							await this.plugin.saveSettings();
							await this.display();
						})
				)
				.addExtraButton((btn) =>
					btn
						.setTooltip("Move up")
						.setIcon("arrow-up")
						.onClick(async () => {
							if (index === 0) return;
							const temp = this.settings.overridePaths[index - 1];
							this.settings.overridePaths[index - 1] = this.settings.overridePaths[index];
							this.settings.overridePaths[index] = temp;
							await this.plugin.saveSettings();
							await this.display();
						})
				)
				.addExtraButton((btn) =>
					btn
						.setTooltip("Move down")
						.setIcon("arrow-down")
						.onClick(async () => {
							if (index === this.settings.overridePaths.length - 1) return;
							const temp = this.settings.overridePaths[index + 1];
							this.settings.overridePaths[index + 1] = this.settings.overridePaths[index];
							this.settings.overridePaths[index] = temp;
							await this.plugin.saveSettings();
							await this.display();
						})
				)
				.addText((text) => {
					text
						.setPlaceholder("Source path")
						.setValue(overridePath.sourcePath)
						.onChange(async (val) => {
							this.settings.overridePaths[index].sourcePath = val.trim();
							await this.plugin.saveSettings();
						});
					text.inputEl.addClass("width-100");
				})
				.addText((text) => {
					text
						.setPlaceholder("Archive path")
						.setValue(overridePath.archivePath)
						.onChange(async (val) => {
							this.settings.overridePaths[index].archivePath = val.trim();
							await this.plugin.saveSettings();
						});
					text.inputEl.addClass("width-100");
				})
				.addText((text) => {
					text.setPlaceholder("g")
						.setValue(overridePath.regexFlags)
						.inputEl.onblur = async () => {
							const value = text.getValue();
							const valid = this.verifyValidFlags(value);
							if (!valid) {
								text.inputEl.addClass("error")
								this.plugin.noticeError("Invalid flags")
							}
							else {
								text.inputEl.removeClass("error");
								this.settings.overridePaths[index].regexFlags = value.trim();
								await this.plugin.saveSettings();
							}
						}
				})
		});
	}

	private verifyValidFlags(value: string) {
		//can be gimsuy, gmi, but not gmii
		if (!value.length) return true
		const VALID_FLAGS = new Set(['d', 'g', 'i', 'm', 's', 'u', 'v', 'y']);
		const seen = new Set<string>();
		for (const f of value) {
			if (!VALID_FLAGS.has(f) || seen.has(f)) {
				return false;
			}
			seen.add(f);
		}
		return true;
	}
}
