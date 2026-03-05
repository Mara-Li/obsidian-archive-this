import i18next from "i18next";
import { type App, Component, MarkdownRenderer, PluginSettingTab, Setting } from "obsidian";
import { FolderSuggester } from "./folder_suggester";
import type { ArchiveThisSettings } from "./interfaces";
import type ArchiveThis from "./main";
import dedent from "dedent";

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

		containerEl.addClass("archive-this")

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

		const mdSettings = new Setting(containerEl)
		mdSettings.setClass("md-info")
		const component = new Component();
		component.load();
		const markdown = dedent`
		> [!info]
		> Il est possible de remplacer le chemin de destinations dans l'archive via l'utilisation de clé de propriétés, via la syntaxe \`{{maclé}}\`.
		> En cas d'absence de la clé, le chemin par défaut sera utilisé. 
		> Il est cependant possible de fixer une valeur par défaut via la syntaxe \`{{maclé|valeur par défaut}}\`.
		 
		L'utilisation des regex est totalement possible (ainsi que les remplacement via \`$1\` par exemple) en activant le toggle regex.
		
		A noter que les transformations sont faites dans l'ordre de la liste.`
		await MarkdownRenderer.render(this.app, markdown, mdSettings.infoEl, "", component);
		component.unload();

		new Setting(containerEl)
		.setName("Frontmatter key for original path")
		.addText((text) =>
			text.setValue(this.settings.originalPathFrontmatterKey)
				.setPlaceholder("original_path")
				.onChange(async (val) => {
					this.settings.originalPathFrontmatterKey = val.trim();
					await this.plugin.saveSettings();
				})
		);

		//add button plus
		new Setting(containerEl)
			.addButton((btn) =>
				btn.setButtonText("Add override path").setCta().onClick(() => {
					this.settings.overridePaths.push({
						sourcePath: "",
						archivePath: "",
						regex: false,
					});
					this.display();
				}
			)
		);

		this.settings.overridePaths.forEach((overridePath, index) => {
			const setting = new Setting(containerEl)
				.setNoInfo()
				.addExtraButton((btn) =>
					btn.setTooltip("Delete override path").setIcon("trash").onClick(async () => {
						this.settings.overridePaths.splice(index, 1);
						await this.plugin.saveSettings();
						this.display();
					}))
				.addExtraButton((btn) =>
					btn.setTooltip("Move up").setIcon("arrow-up").onClick(async () => {
						if (index === 0) return;
						const temp = this.settings.overridePaths[index - 1];
						this.settings.overridePaths[index - 1] = this.settings.overridePaths[index];
						this.settings.overridePaths[index] = temp;
						await this.plugin.saveSettings();
						this.display();
					})
				)
				.addExtraButton((btn) =>
					btn.setTooltip("Move down").setIcon("arrow-down").onClick(async () => {
						if (index === this.settings.overridePaths.length - 1) return;
						const temp = this.settings.overridePaths[index + 1];
						this.settings.overridePaths[index + 1] = this.settings.overridePaths[index];
						this.settings.overridePaths[index] = temp;
						await this.plugin.saveSettings();
						this.display();
					})
				)
				.addText((text) =>{
					text.setPlaceholder("Source path")
						.setValue(overridePath.sourcePath)
						.onChange(async (val) => {
							this.settings.overridePaths[index].sourcePath = val.trim();
							await this.plugin.saveSettings();
						})
					text.inputEl.addClass("width-100");
					})
				.addText((text) =>{
					text.setPlaceholder("Archive path")
						.setValue(overridePath.archivePath)
						.onChange(async (val) => {
							this.settings.overridePaths[index].archivePath = val.trim();
							await this.plugin.saveSettings();
						})
					text.inputEl.addClass("width-100")}
				)
			//set a simili button that mimic toggle on the click with a check or a cross depending to the state of the regex
			setting.addExtraButton((btn) =>{
				btn.setTooltip(this.settings.overridePaths[index].regex ? "Regex enabled" : "Regex disabled")
				.setIcon(overridePath.regex ? "regex" : "cross").onClick(async () => {
					this.settings.overridePaths[index].regex = !this.settings.overridePaths[index].regex;
					await this.plugin.saveSettings();
					this.display();
				})
			})
	})
}
}
