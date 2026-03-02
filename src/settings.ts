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

		new Setting(containerEl).setName("Archive folder").addSearch((cb) => {
			cb.setPlaceholder("Archives").setValue(this.settings.archiveFolder);
			new FolderSuggester(cb.inputEl, this.app, async (result) => {
				this.settings.archiveFolder = result.trim();
				await this.plugin.saveSettings();
			});
		});

		new Setting(containerEl).setHeading().setName("Delete folder when empty");
		new Setting(containerEl)
			.setName("In source")
			.setDesc(
				"When moving file(s) or folder(s) in archive, delete the root when it is empty"
			)
			.addToggle((toggle) =>
				toggle.setValue(this.settings.deleteWhenEmpty.inSource).onChange(async (val) => {
					this.settings.deleteWhenEmpty.inSource = val;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("In Archive")
			.setDesc(
				"When moving file(s) or folder(s) out of archive, delete the root when it is empty. Note: The archive folder won't be deleted even if empty."
			)
			.addToggle((toggle) =>
				toggle.setValue(this.settings.deleteWhenEmpty.inArchive).onChange(async (val) => {
					this.settings.deleteWhenEmpty.inArchive = val;
					await this.plugin.saveSettings();
				})
			);
	}
}
