import dedent from "dedent";
import i18next from "i18next";
import { type App, Component, MarkdownRenderer, Modal } from "obsidian";

export class RefArchiveThisModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	private markdown() {
		return dedent(i18next.t("refs"));
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.addClasses(["archive-this", "markdown-rendered"]);
		this.setTitle("Archive This - References");
		const component = new Component();
		component.load();

		await MarkdownRenderer.render(this.app, this.markdown(), contentEl, "", component);
		component.unload();
	}
}
