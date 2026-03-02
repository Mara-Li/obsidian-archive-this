import i18next from "i18next";
import { normalizePath, Plugin, type TAbstractFile, type TFolder } from "obsidian";
import { resources, translationLanguage } from "./i18n";
import { type ArchiveThisSettings, DEFAULT_SETTINGS } from "./interfaces";
import { ArchiveThisSettingTab } from "./settings";

export default class ArchiveThis extends Plugin {
	settings!: ArchiveThisSettings;
	async onload() {
		console.log(`[${this.manifest.name}] Loaded`);
		await this.loadSettings();

		//load i18next
		await i18next.init({
			lng: translationLanguage,
			fallbackLng: "en",
			resources,
			returnNull: false,
			returnEmptyString: false,
			showSupportNotice: false,
		});
		this.addSettingTab(new ArchiveThisSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (!this.isInArchive(file)) {
					menu.addItem((item) => {
						item
							.setIcon("archive")
							.setTitle(i18next.t("cmd.archive"))
							.onClick(async () => this.moveToArchive(file));
					});
				} else {
					menu.addItem((item) => {
						item
							.setIcon("archive-restore")
							.setTitle(i18next.t("cmd.restore"))
							.onClick(async () => this.restoreFromArchive(file));
					});
				}
			})
		);

		this.registerEvent(
			this.app.workspace.on("files-menu", (menu, files) => {
				const areAllTheyNotInArchive = this.areAllTheyNotInArchive(files);
				if (areAllTheyNotInArchive) {
					menu.addItem((item) => {
						item
							.setIcon("archive")
							.setTitle(i18next.t("cmd.archiveAll"))
							.onClick(async () => this.moveTheyInArchive(files));
					});
				} else if (this.areAllTheyInArchive(files)) {
					menu.addItem((item) => {
						item
							.setIcon("archive-restore")
							.setTitle(i18next.t("cmd.restoreAll"))
							.onClick(async () => this.restoreTheyFromArchive(files));
					});
				} else {
					//some are in and some are out
					menu.addItem((item) => {
						item
							.setIcon("package")
							.setTitle(i18next.t("cmd.swap"))
							.onClick(async () => this.swapFile(files));
					});
				}
			})
		);
	}

	/**
	 * Move in or out depending of the emplacement of the file
	 * @param files {TAbstractFile[]}
	 */
	async swapFile(files: TAbstractFile[]) {
		return await Promise.all(
			files.map((file) => {
				if (this.isInArchive(file)) return this.restoreFromArchive(file);
				else return this.moveToArchive(file);
			})
		);
	}

	/**
	 * Move all files in the archives
	 * @param files {TAbstractFile[]} files or folder to move
	 */
	async moveTheyInArchive(files: TAbstractFile[]) {
		//use promise, it is better
		return await Promise.all(files.map((file) => this.moveToArchive(file)));
	}

	async restoreTheyFromArchive(files: TAbstractFile[]) {
		return await Promise.all(files.map((file) => this.restoreFromArchive(file)));
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<ArchiveThisSettings>
		);
	}

	private isInArchive(file: TAbstractFile) {
		return file.path.startsWith(normalizePath(this.settings.archiveFolder));
	}

	private areAllTheyInArchive(files: TAbstractFile[]) {
		return files.every((file) => this.isInArchive(file));
	}

	private areAllTheyNotInArchive(files: TAbstractFile[]) {
		return files.every((file) => !this.isInArchive(file));
	}

	/**
	 * @Credit [gOATiful](https://github.com/gOATiful/para-shortcuts)
	 * @source [para-shortcuts/deleteFolderIfEmpty](https://github.com/gOATiful/para-shortcuts/blob/6da18dd1da9fa6ceec5e8aa9a844510d355b72f5/src/main.ts#L365)
	 * @param folder
	 * @returns
	 */
	private async deleteWhenEmpty(folder: TFolder | null): Promise<void> {
		if (!folder) return;
		folder = this.app.vault.getFolderByPath(folder.path);
		if (!folder) return;
		if (folder.path === this.settings.archiveFolder) return; //do not delete empty archive
		if (folder.children.length === 0) {
			const folderToDelete = folder.parent;
			await this.app.vault.delete(folder);
			return this.deleteWhenEmpty(folderToDelete);
		}
	}

	/**
	 * @credit [gOATiful](https://github.com/gOATiful/para-shortcuts)
	 * @source [para-shortcuts/restoreFromArchive](https://github.com/gOATiful/para-shortcuts/blob/6da18dd1da9fa6ceec5e8aa9a844510d355b72f5/src/main.ts#L148)
	 * @param file
	 * @returns
	 */
	private async restoreFromArchive(file: TAbstractFile) {
		const oldParent = file.parent;
		const newPath = normalizePath(
			file.path.replace(normalizePath(this.settings.archiveFolder), "").trim()
		);
		try {
			await this.moveFileAndCreateFolder(file, newPath);
			if (this.settings.deleteWhenEmpty.inArchive) await this.deleteWhenEmpty(oldParent);
			return true;
		} catch (e) {
			console.warn(e);
			return false;
		}
	}

	/**
	 * @author [gOATiful](https://github.com/gOATiful/para-shortcuts)
	 * @source [para-shortcuts/getDirName](https://github.com/gOATiful/para-shortcuts/blob/6da18dd1da9fa6ceec5e8aa9a844510d355b72f5/src/main.ts#L343)
	 * @param path {string}
	 * @returns string
	 */
	private getDirName(path: string): string {
		if (path.endsWith("/")) {
			// is already a path return
			return path;
		}
		const lastSlashIdx = path.lastIndexOf("/");
		if (lastSlashIdx === -1) {
			// no slashes found
			throw new Error("DirectoryNotFound");
		}
		return normalizePath(path.slice(0, lastSlashIdx));
	}

	/**
	 * @author [gOATiful](https://github.com/gOATiful/para-shortcuts)
	 * @credit [para-shortcuts/moveFileAndCreateFolder](https://github.com/gOATiful/para-shortcuts/blob/6da18dd1da9fa6ceec5e8aa9a844510d355b72f5/src/main.ts#L274)
	 * @param file {TAbstractFile}
	 * @param newPath {string}
	 */
	private async moveFileAndCreateFolder(file: TAbstractFile, newPath: string) {
		const dirName = this.getDirName(newPath);
		if (await this.app.vault.exists(dirName, false)) {
			await this.app.fileManager.renameFile(file, newPath);
		} else {
			await this.app.vault.createFolder(dirName);
			await this.app.fileManager.renameFile(file, newPath);
		}
	}

	private async moveToArchive(file: TAbstractFile) {
		const oldParent = file.parent;
		const rootArchive = normalizePath(this.settings.archiveFolder);
		const newPath = normalizePath(`${rootArchive}/${file.path}`);
		try {
			await this.moveFileAndCreateFolder(file, newPath);
			if (this.settings.deleteWhenEmpty.inSource) await this.deleteWhenEmpty(oldParent);
			return true; //success
		} catch (e) {
			console.warn(e);
			return false; //failed
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
	onunload() {
		console.log(`[${this.manifest.name}] Unloaded`);
	}
}
