import dedent from "dedent";
import i18next from "i18next";
import {
	type App,
	Component,
	MarkdownRenderer,
	PluginSettingTab,
	Setting,
	setTooltip,
} from "obsidian";
import { FolderSuggester } from "./folder_suggester";
import type { ArchiveThisSettings } from "./interfaces";
import type ArchiveThis from "./main";
import { RefArchiveThisModal } from "./refTransform";

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
		mdSettings.setClass("markdown-rendered");
		const component = new Component();
		component.load();
		const markdown = dedent(i18next.t("settings.overridePaths.info"));
		await MarkdownRenderer.render(this.app, markdown, mdSettings.infoEl, "", component);

		new Setting(containerEl)
			.setName(i18next.t("settings.overridePaths.fm"))
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
			.setName(i18next.t("settings.overridePaths.folderNote.title"))
			.setDesc(i18next.t("settings.overridePaths.folderNote.desc"))
			.addToggle((toggle) =>
				toggle.setValue(this.settings.useFolderNote.enable).onChange(async (val) => {
					this.settings.useFolderNote.enable = val;
					await this.plugin.saveSettings();
					await this.display();
				})
			);

		if (this.settings.useFolderNote.enable) {
			new Setting(containerEl)
				.setName(i18next.t("settings.overridePaths.folderNote.behavior.title"))
				.setDesc(i18next.t("settings.overridePaths.folderNote.behavior.desc"))
				.addDropdown((dropdown) =>
					dropdown
						.addOption(
							"inside",
							i18next.t("settings.overridePaths.folderNote.behavior.inside")
						)
						.addOption(
							"outside",
							i18next.t("settings.overridePaths.folderNote.behavior.outside")
						)
						.addOption(
							"named",
							i18next.t("settings.overridePaths.folderNote.behavior.named")
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
					.setName(i18next.t("settings.overridePaths.folderNote.named.title"))
					.setDesc(i18next.t("settings.overridePaths.folderNote.named.desc"))
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

		const sett = new Setting(containerEl).setName(
			i18next.t("settings.overridePaths.dateFormat.title")
		);
		sett.descEl.addClass("markdown-rendered");
		await MarkdownRenderer.render(
			this.app,
			dedent(i18next.t("settings.overridePaths.dateFormat.desc")),
			sett.descEl,
			"",
			component
		);

		new Setting(containerEl)
			.setName(i18next.t("settings.overridePaths.dateFormat.input.title"))
			.setDesc(i18next.t("settings.overridePaths.dateFormat.input.desc"))
			.setClass("padding")
			.addText((text) =>
				text
					.setValue(this.settings.date.input)
					.setPlaceholder("YYYY-MM-DD")
					.onChange(async (val) => {
						this.settings.date.input = val.trim();
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName(i18next.t("settings.overridePaths.dateFormat.output.title"))
			.setClass("padding")
			.addText((text) =>
				text
					.setValue(this.settings.date.output)
					.setPlaceholder("YYYY-MM-DD")
					.onChange(async (val) => {
						this.settings.date.output = val.trim();
						await this.plugin.saveSettings();
					})
			);

		//add button plus
		new Setting(containerEl)
			.addButton((btn) =>
				btn
					.setButtonText(i18next.t("settings.overridePaths.add"))
					.setCta()
					.onClick(() => {
						this.settings.overridePaths.push({
							sourcePath: "",
							archivePath: "",
							regexFlags: "g",
						});
						this.display();
					})
			)
			.addButton((btn) =>
				btn
					.setButtonText("Open reference")
					.onClick(() => new RefArchiveThisModal(this.app).open())
			);

		this.settings.overridePaths.forEach((overridePath, index) => {
			new Setting(containerEl)
				.setNoInfo()
				.addExtraButton((btn) =>
					btn
						.setTooltip(i18next.t("settings.overridePaths.delete"))
						.setIcon("trash")
						.onClick(async () => {
							this.settings.overridePaths.splice(index, 1);
							await this.plugin.saveSettings();
							await this.display();
						})
				)
				.addExtraButton((btn) =>
					btn
						.setTooltip(i18next.t("settings.overridePaths.moveUp"))
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
						.setTooltip(i18next.t("settings.overridePaths.moveDown"))
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
						.setPlaceholder(i18next.t("settings.overridePaths.sourcePath"))
						.setValue(overridePath.sourcePath)
						.onChange(async (val) => {
							this.settings.overridePaths[index].sourcePath = val.trim();
							await this.plugin.saveSettings();
						});
					text.inputEl.addClass("width-100");
					setTooltip(text.inputEl, i18next.t("settings.overridePaths.sourcePath"), {
						placement: "bottom",
						delay: 0,
					});
				})
				.addText((text) => {
					text
						.setPlaceholder(i18next.t("settings.overridePaths.outputPath"))
						.setValue(overridePath.archivePath)
						.onChange(async (val) => {
							this.settings.overridePaths[index].archivePath = val.trim();
							await this.plugin.saveSettings();
						});
					text.inputEl.addClass("width-100");
					setTooltip(text.inputEl, i18next.t("settings.overridePaths.outputPath"), {
						placement: "bottom",
						delay: 0,
					});
				})
				.addText((text) => {
					text
						.setPlaceholder(i18next.t("settings.overridePaths.regexFlags"))
						.setValue(overridePath.regexFlags).inputEl.onblur = async () => {
						const value = text.getValue();
						const valid = this.verifyValidFlags(value);
						if (!valid) {
							text.inputEl.addClass("error");
							this.plugin.noticeError(i18next.t("settings.overridePaths.invalidFlags"));
						} else {
							text.inputEl.removeClass("error");
							this.settings.overridePaths[index].regexFlags = value.trim();
							await this.plugin.saveSettings();
						}
					};
					text.inputEl.addClass("width-25");
					setTooltip(text.inputEl, i18next.t("settings.overridePaths.regexFlags"), {
						placement: "bottom",
						delay: 0,
					});
				});
		});
		component.unload();
	}

	private verifyValidFlags(value: string) {
		//can be gimsuy, gmi, but not gmii
		if (!value.length) return true;
		const ValidFlags = new Set(["d", "g", "i", "m", "s", "u", "v", "y"]);
		const seen = new Set<string>();
		for (const f of value) {
			if (!ValidFlags.has(f) || seen.has(f)) {
				return false;
			}
			seen.add(f);
		}
		return true;
	}
}
