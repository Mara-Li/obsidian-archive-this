import i18next from "i18next";
import { type App, PluginSettingTab, Setting } from "obsidian";
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

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

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
	}
}
