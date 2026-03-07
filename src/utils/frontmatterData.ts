import {
	type App,
	type FrontMatterCache,
	type TAbstractFile,
	TFile,
	TFolder,
} from "obsidian";
import type { ArchiveThisSettings } from "../interfaces";
import { getFolderNote } from "./findFolderNote";

export function getFrontmatterData(app: App, file: TFile) {
	return app.metadataCache.getFileCache(file)?.frontmatter;
}

async function setOriginalPathInFm(app: App, file: TFile, frontmatterKey: string) {
	if (!frontmatterKey.length) throw new Error("Frontmatter key is empty");
	await app.fileManager.processFrontMatter(file, (fm) => {
		fm[frontmatterKey] = file.path;
	});
}

/**
 * Get the frontmatter.
 * For a file, it will get the default frontmatter
 * For a folder, it will check for a folder note (depending on the settings) and get the frontmatter of this note. If no folder note is found, it will return null
 * @param {TAbstractFile} sourceFile the file or folder we move
 * @param {App} app Obsidian
 * @param {ArchiveThisSettings} settings
 * @returns {FrontMatterCache | null} the frontmatter of the file or the folder note, or null if no folder note is found for a folder
 */
export function getFrontmatterForArchive(
	sourceFile: TAbstractFile,
	app: App,
	settings: ArchiveThisSettings
): FrontMatterCache | undefined {
	if (sourceFile instanceof TFile) return getFrontmatterData(app, sourceFile);
	if (sourceFile instanceof TFolder) {
		const folderNote = getFolderNote(sourceFile, settings);
		if (!folderNote) return;
		return getFrontmatterData(app, folderNote);
	}
}

/**
 * When archiving with some overridePaths, we need to store somewhere the original path. The most convenient is to use a frontmatter key.
 * @param {TAbstractFile} sourceFile file/folder to archive
 * @param {App} app Obsidian
 * @param {ArchiveThisSettings} settings plugin settings
 */
export async function setOriginalPath(
	sourceFile: TAbstractFile,
	app: App,
	settings: ArchiveThisSettings
) {
	const frontmatterKey = settings.originalPathFrontmatterKey;
	if (sourceFile instanceof TFile) {
		await setOriginalPathInFm(app, sourceFile, frontmatterKey);
		return;
	}
	const folderNote = getFolderNote(sourceFile as TFolder, settings);
	if (!folderNote) return; //no folder note, so we can't set the fm
	await setOriginalPathInFm(app, folderNote, frontmatterKey);
}

/**
 * Used in the restoration process if we have some overridePath set
 * @param {TAbstractFile} sourceFile  the file or folder we want to restore
 * @param {App} app Obsidian app
 * @param {ArchiveThisSettings} settings plugin settings
 * @returns {string | null} the original path of the file or folder
 */
export function getOriginalPathForRestore(
	sourceFile: TAbstractFile,
	app: App,
	settings: ArchiveThisSettings
): string | undefined {
	const pathFrontmatterKey = settings.originalPathFrontmatterKey;
	if (!pathFrontmatterKey.length) throw new Error("Frontmatter key is empty");
	if (sourceFile instanceof TFile) {
		const fm = getFrontmatterData(app, sourceFile);
		//if no fm set => return the path of the file
		return fm?.[pathFrontmatterKey];
	}
	const folderNote = getFolderNote(sourceFile as TFolder, settings);
	if (!folderNote) return;
	const fm = getFrontmatterData(app, folderNote);
	// Don't convert the original_path to date, just get it as-is
	const originalPath = fm?.[pathFrontmatterKey];
	if (!originalPath || typeof originalPath !== "string") return;
	const key = originalPath;
	if (!key) return;

	// For outside mode, the original_path is the path of the folder note (with extension)
	// We need to extract the folder path by removing the extension
	// Example: "truc/machin/machin2.md" → folder is "truc/machin/machin2"
	if (settings.useFolderNote.mode === "outside" && key.match(/\.(.*?)$/))
		// Remove the extension to get the folder path
		return key.replace(/\.[^.]+$/, "");

	// For inside/named modes, if the key has an extension, remove the last part (filename)
	if (key.match(/\.(.*?)$/)) {
		const splittedKey = key.split("/");
		splittedKey.pop();
		return splittedKey.join("/");
	}

	return key;
}
