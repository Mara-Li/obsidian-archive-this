import i18next from "i18next";
import {
	Notice,
	normalizePath,
	Plugin,
	type TAbstractFile,
	TFile,
	TFolder,
} from "obsidian";
import { renameFolderNote } from "./findFolderNote";
import {
	getFrontmatterForArchive,
	getOriginalPathForRestore,
	setOriginalPath,
} from "./frontmatterData";
import { resources, translationLanguage } from "./i18n";
import { type ArchiveThisSettings, DEFAULT_SETTINGS } from "./interfaces";
import { replacePath } from "./replacePath";
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
	 * Restore the outside folder note from the archive before moving the folder itself
	 * @param folder {TFolder} The folder being restored
	 * @param newFolderPath {string} The new path where the folder will be moved
	 */
	private async restoreOutsideFolderNote(folder: TFolder, newFolderPath: string) {
		const parentFolder = folder.parent;
		if (!parentFolder) return;

		// Find the folder note outside the folder (in the archive parent directory)
		const folderNote = parentFolder.children.find(
			(child) => child instanceof TFile && child.basename === folder.name
		);

		if (!folderNote || !(folderNote instanceof TFile)) return;

		// Calculate the new path for the folder note
		// If the folder goes to "path/folder", the note goes to "path/folder.md"
		const newFolderNotePath = `${newFolderPath}.${folderNote.extension}`;

		// Move the folder note
		await this.moveFileAndCreateFolder(folderNote, newFolderNotePath);
	}

	/**
	 * @credit [gOATiful](https://github.com/gOATiful/para-shortcuts)
	 * @source [para-shortcuts/restoreFromArchive](https://github.com/gOATiful/para-shortcuts/blob/6da18dd1da9fa6ceec5e8aa9a844510d355b72f5/src/main.ts#L148)
	 * @param file
	 * @returns
	 */
	private async restoreFromArchive(file: TAbstractFile) {
		const oldParent = file.parent;
		const oldPath = file.path;
		const newPath = this.getRestorePath(file);
		try {
			// Handle outside folder note before moving the folder
			if (
				file instanceof TFolder &&
				this.settings.useFolderNote.enable &&
				this.settings.useFolderNote.mode === "outside"
			) {
				await this.restoreOutsideFolderNote(file, newPath);
			}

			await this.moveFileAndCreateFolder(file, newPath);
			if (this.settings.deleteWhenEmpty.inArchive) await this.deleteWhenEmpty(oldParent);
			if (this.settings.overridePaths.length)
				await renameFolderNote(newPath, oldPath, this.app, this.settings, true);
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
			//root
			return this.app.vault.getRoot().path;
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
				console.warn("Merging folders:", source.path, "→", newPath);
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

	/**
	 * Move the outside folder note to the archive before moving the folder itself
	 * @param folder {TFolder} The folder being archived
	 * @param newFolderPath {string} The new path where the folder will be moved
	 */
	private async moveOutsideFolderNote(folder: TFolder, newFolderPath: string) {
		const parentFolder = folder.parent;
		if (!parentFolder) return;

		// Find the folder note outside the folder (in the parent directory)
		const folderNote = parentFolder.children.find(
			(child) => child instanceof TFile && child.basename === folder.name
		);

		if (!folderNote || !(folderNote instanceof TFile)) return;

		// Calculate the new path for the folder note
		// If the folder goes to "archive/path/folder", the note goes to "archive/path/folder.md"
		const newFolderNotePath = `${newFolderPath}.${folderNote.extension}`;

		// Move the folder note
		await this.moveFileAndCreateFolder(folderNote, newFolderNotePath);
	}

	private async moveToArchive(file: TAbstractFile) {
		const oldParent = file.parent;
		const oldPath = file.path;
		const newPath = this.getArchivePath(file);
		try {
			if (this.settings.overridePaths.length)
				await setOriginalPath(file, this.app, this.settings);

			// Handle outside folder note before moving the folder
			if (
				file instanceof TFolder &&
				this.settings.useFolderNote.enable &&
				this.settings.useFolderNote.mode === "outside"
			) {
				await this.moveOutsideFolderNote(file, newPath);
			}

			await this.moveFileAndCreateFolder(file, newPath);
			if (this.settings.deleteWhenEmpty.inSource) await this.deleteWhenEmpty(oldParent);
			if (this.settings.overridePaths.length)
				await renameFolderNote(newPath, oldPath, this.app, this.settings);

			return true; //success
		} catch (e) {
			console.warn(e);
			return false; //failed
		}
	}

	private getArchivePath(file: TAbstractFile): string {
		const rootArchive = normalizePath(this.settings.archiveFolder);
		const defaultPath = normalizePath(`${rootArchive}/${file.path}`);
		if (!this.settings.overridePaths.length) return defaultPath;
		const fm = getFrontmatterForArchive(file, this.app, this.settings);
		return replacePath(defaultPath, this.settings.overridePaths, fm);
	}

	private getRestorePath(file: TAbstractFile): string {
		const defaultPath = normalizePath(
			file.path.replace(this.settings.archiveFolder, "").trim()
		);
		if (!this.settings.overridePaths.length) return defaultPath;
		const fm = getOriginalPathForRestore(file, this.app, this.settings);
		return fm ?? defaultPath;
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
	onunload() {
		console.log(`[${this.manifest.name}] Unloaded`);
	}
}
