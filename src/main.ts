import i18next from "i18next";
import { Plugin } from "obsidian";
import { resources, translationLanguage } from "./i18n";

export default class ArchiveThis extends Plugin {
	async onload() {
		console.log(`[${this.manifest.name}] Loaded`);

		//load i18next
		await i18next.init({
			lng: translationLanguage,
			fallbackLng: "en",
			resources,
			returnNull: false,
			returnEmptyString: false,
		});
	}

	onunload() {
		console.log(`[${this.manifest.name}] Unloaded`);
	}
}
