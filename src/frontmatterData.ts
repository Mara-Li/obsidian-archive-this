import { App, TAbstractFile, TFile, TFolder, type FrontMatterCache } from "obsidian";
import type { ArchiveThisSettings } from "./interfaces";
import { getFolderNote } from "./findFolderNote";

function getFrontmatterData(app: App, file: TFile) {
	return app.metadataCache.getFileCache(file)?.frontmatter;
}

async function setOriginalPathInFm(app: App, file: TFile, frontmatterKey: string) {
	if (!frontmatterKey.length) throw new Error("Frontmatter key is empty");
	app.fileManager.processFrontMatter(file, (fm) => {
		fm[frontmatterKey] = file.path;
	})
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
function getRightFm(sourceFile: TAbstractFile, app: App, settings: ArchiveThisSettings) {
	if (sourceFile instanceof TFile) return getFrontmatterData(app, sourceFile);
	if (sourceFile instanceof TFolder) {
		const folderNote = getFolderNote(sourceFile, settings);
		if (!folderNote) return null;
		return getFrontmatterData(app, folderNote);
	}
}

/**
 * When archiving with some overridePaths, we need to store somewhere the original path. The most convenient is to use a frontmatter key.
 * @param {TAbstractFile} sourceFile file/folder to archive
 * @param {App} app Obsidian 
 * @param {ArchiveThisSettings} settings plugin settings
 */
function setFmAtTheRightPlace(sourceFile: TAbstractFile, app: App, settings: ArchiveThisSettings) {
	const frontmatterKey = settings.originalPathFrontmatterKey;
	if (sourceFile instanceof TFile) return setOriginalPathInFm(app, sourceFile, frontmatterKey);
	const folderNote = getFolderNote(sourceFile as TFolder, settings);
	if (!folderNote) return; //no folder note, so we can't set the fm
	return setOriginalPathInFm(app, folderNote, frontmatterKey);
	
}

/**
 * Used in the restoration process if we have some overridePath set
 * @param {TAbstractFile} sourceFile  the file or folder we want to restore
 * @param {App} app Obsidian app 
 * @param {ArchiveThisSettings} settings plugin settings
 * @returns {string | null} the original path of the file or folder
 */
function getOriginalPath(sourceFile: TAbstractFile, app: App, settings: ArchiveThisSettings): string | null {
	const frontmatterKey = settings.originalPathFrontmatterKey;
	if (!frontmatterKey.length) throw new Error("Frontmatter key is empty");
	if (sourceFile instanceof TFile) {
		const fm = getFrontmatterData(app, sourceFile);
		//if no fm set => return the path of the file
		return fm?.[frontmatterKey] ?? sourceFile.path;
	}
	const folderNote = getFolderNote(sourceFile as TFolder, settings);
	if (!folderNote) return sourceFile.path;
	const fm = getFrontmatterData(app, folderNote);
	return fm?.[frontmatterKey] ?? sourceFile.path;
}

