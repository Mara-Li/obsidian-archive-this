import i18next from "i18next";
import {
	Notice,
	normalizePath,
	Plugin,
	type TAbstractFile,
	TFile,
	TFolder,
} from "obsidian";
import { resources, translationLanguage } from "./i18n";
import { type ArchiveThisSettings, DEFAULT_SETTINGS } from "./interfaces";
import { ArchiveThisSettingTab } from "./settings";

export default class ArchiveThis extends Plugin {
	settings!: ArchiveThisSettings;

	noticeError(message: string) {
		const notice = new Notice(message);
		notice.containerEl.addClasses(["archive-this", "error"]);
	}

	noticeSuccess(message: string) {
		const notice = new Notice(message);
		notice.containerEl.addClasses(["archive-this", "success"]);
	}

	noticeWarning(message: string) {
		const notice = new Notice(message);
		notice.containerEl.addClasses(["archive-this", "warning"]);
	}

	getBasename(file: TAbstractFile) {
		if (file instanceof TFolder) return file.name;
		return (file as TFile).basename;
	}

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
				if (!this.settings.archiveFolder.length) return; //if no archive folder, do not add the menu
				if (!this.isInArchive(file)) {
					menu.addItem((item) => {
						item
							.setIcon("archive")
							.setTitle(i18next.t("cmd.archive"))
							.onClick(async () => {
								const success = await this.moveToArchive(file);
								if (!success)
									this.noticeError(
										i18next.t("archive.error.one", { file: this.getBasename(file) })
									);
								else
									this.noticeSuccess(
										i18next.t("archive.success.one", { file: this.getBasename(file) })
									);
							});
					});
				} else {
					menu.addItem((item) => {
						item
							.setIcon("archive-restore")
							.setTitle(i18next.t("cmd.restore"))
							.onClick(async () => {
								const res = await this.restoreFromArchive(file);
								if (!res)
									this.noticeError(
										i18next.t("restore.error.one", { file: this.getBasename(file) })
									);
								else
									this.noticeSuccess(
										i18next.t("restore.success.one", { file: this.getBasename(file) })
									);
							});
					});
				}
			})
		);

		this.registerEvent(
			this.app.workspace.on("files-menu", (menu, files) => {
				if (!this.settings.archiveFolder.length) return; //if no archive folder, do not add the menu
				const areAllTheyNotInArchive = this.areAllTheyNotInArchive(files);
				if (areAllTheyNotInArchive) {
					menu.addItem((item) => {
						item
							.setIcon("archive")
							.setTitle(i18next.t("cmd.archiveAll"))
							.onClick(async () => {
								const res = await this.moveTheyInArchive(files);
								this.archiveCheck(files, res);
							});
					});
				} else if (this.areAllTheyInArchive(files)) {
					menu.addItem((item) => {
						item
							.setIcon("archive-restore")
							.setTitle(i18next.t("cmd.restoreAll"))
							.onClick(async () => {
								const res = await this.restoreTheyFromArchive(files);
								this.restoreCheck(files, res);
							});
					});
				} else {
					//some are in and some are out
					menu.addItem((item) => {
						item
							.setIcon("package")
							.setTitle(i18next.t("cmd.swap"))
							.onClick(async () => await this.swapFile(files));
					});
				}
			})
		);
	}

	archiveCheck(files: TAbstractFile[], res: boolean[]) {
		const file = files.map((f) => this.getBasename(f)).join(", ");
		if (res.every((r) => r))
			this.noticeSuccess(
				i18next.t("archive.success.all", {
					count: files.length,
					file,
				})
			);
		else if (res.every((r) => !r))
			this.noticeError(
				i18next.t("archive.error.all", {
					count: files.length,
					file,
				})
			);
		else {
			const nbInError = res.filter((r) => !r).length;
			const nbInSuccess = res.filter((r) => r).length;
			const msg = `${i18next.t("archive.success.all", { count: nbInSuccess, file })}\n${i18next.t("archive.error.all", { count: nbInError, file })}`;
			this.noticeWarning(msg);
		}
	}

	restoreCheck(files: TAbstractFile[], res: boolean[]) {
		if (res.every((r) => r))
			this.noticeSuccess(
				i18next.t("restore.success.all", {
					count: files.length,
					file: files.map((f) => this.getBasename(f)).join(", "),
				})
			);
		else if (res.every((r) => !r))
			this.noticeError(i18next.t("restore.error.all", { count: files.length }));
		else {
			const nbInError = res.filter((r) => !r).length;
			const nbInSuccess = res.filter((r) => r).length;
			const msg = `${i18next.t("restore.success.all", { count: nbInSuccess })}\n${i18next.t("restore.error.all", { count: nbInError })}`;
			this.noticeWarning(msg);
		}
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

	async checkSwapFile(files: TAbstractFile[], res: boolean[]) {
		const file = files.map((f) => this.getBasename(f)).join(", ");
		const nbInError = res.filter((r) => !r).length;
		const nbInSuccess = res.filter((r) => r).length;
		if (nbInError === 0)
			this.noticeSuccess(
				i18next.t("swap.success.all", {
					count: files.length,
					file,
				})
			);
		else if (nbInSuccess === 0)
			this.noticeError(
				i18next.t("swap.error.all", {
					count: files.length,
					file,
				})
			);
		else {
			const msg = `${i18next.t("swap.success.all", { count: nbInSuccess, file })}\n${i18next.t("swap.error.all", { count: nbInError, file })}`;
			this.noticeWarning(msg);
		}
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
		const newPath = this.getRestorationDefaultPath(file);
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
	 * @param source {TAbstractFile}
	 * @param newPath {string}
	 */
	private async moveFileAndCreateFolder(source: TAbstractFile, newPath: string) {
		const dirName = this.getDirName(newPath);
		
		// Handle existing destination
		if (await this.app.vault.exists(newPath)) {
			const newPathTF = this.app.vault.getAbstractFileByPath(newPath);
			
			// File → File: overwrite by deleting the old one
			if (newPathTF instanceof TFile && source instanceof TFile) {
				await this.app.fileManager.trashFile(newPathTF);
			}
			// Folder → Folder: merge recursively
			else if (newPathTF instanceof TFolder && source instanceof TFolder) {
				await this.mergeFolders(source, newPathTF);
				return; // Exit early since merge handles everything
			}
		}
		
		// Ensure parent directory exists
		if (!(await this.app.vault.exists(dirName))) {
			await this.app.vault.createFolder(dirName);
		}
		
		// Move the file/folder
		await this.app.fileManager.renameFile(source, newPath);
	}

	/**
	 * Recursively merge source folder into destination folder
	 * @param source {TFolder} Source folder to merge from
	 * @param destination {TFolder} Destination folder to merge into
	 */
	private async mergeFolders(source: TFolder, destination: TFolder) {
		// Important: renaming children mutates source.children, so we iterate on a snapshot.
		const sourceChildren = [...source.children];

		for (const child of sourceChildren) {
			const destinationPath = normalizePath(`${destination.path}/${child.name}`);
			await this.moveFileAndCreateFolder(child, destinationPath);
		}

		// Remove the source folder when it has been fully merged.
		const sourceFolder = this.app.vault.getFolderByPath(source.path);
		if (sourceFolder && sourceFolder.children.length === 0) {
			await this.app.fileManager.trashFile(sourceFolder);
		}
	}

	private async moveToArchive(file: TAbstractFile) {
		const oldParent = file.parent;
		const newPath = this.getArchiveDefaultPath(file);
		try {
			await this.moveFileAndCreateFolder(file, newPath);
			if (this.settings.deleteWhenEmpty.inSource) await this.deleteWhenEmpty(oldParent);
			return true; //success
		} catch (e) {
			console.warn(e);
			return false; //failed
		}
	}

	getArchiveDefaultPath(file: TAbstractFile): string {
		const rootArchive = normalizePath(this.settings.archiveFolder);
		return normalizePath(`${rootArchive}/${file.path}`);
	}

	getRestorationDefaultPath(file: TAbstractFile): string {
		return normalizePath(
			file.path.replace(normalizePath(this.settings.archiveFolder), "").trim()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
	onunload() {
		console.log(`[${this.manifest.name}] Unloaded`);
	}
}
