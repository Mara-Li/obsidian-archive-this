import { type App, TFile, TFolder } from "obsidian";
import { getFrontmatterData } from "./frontmatterData";
import type { ArchiveThisSettings } from "./interfaces";
import { replacePath } from "./replacePath";

export function getFolderNote(
	folder: TFolder,
	settings: ArchiveThisSettings,
	nameToFind?: string
): TFile | null {
	if (!settings.useFolderNote.enable) return null;
	switch (settings.useFolderNote.mode) {
		case "inside":
			return getFolderNoteInside(folder, nameToFind);
		case "outside":
			return getFolderNoteOutside(folder, nameToFind);
		case "named":
			return getNamedFolderNote(folder, settings);
		default:
			return null;
	}
}

function getFolderNoteInside(folder: TFolder, nameToFind?: string): TFile | null {
	if (folder.children.length === 0) return null; //no folder note
	const folderNote = folder.children.find(
		(child) => child instanceof TFile && child.basename === (nameToFind ?? folder.name)
	);
	return folderNote instanceof TFile ? folderNote : null;
}

function getFolderNoteOutside(folder: TFolder, nameToFind?: string): TFile | null {
	const parentFolder = folder.parent;
	if (!parentFolder) return null; //no parent, so no outside folder note
	const folderNote = parentFolder.children.find(
		(child) => child instanceof TFile && child.basename === (nameToFind ?? folder.name)
	);
	return folderNote instanceof TFile ? folderNote : null;
}

function getNamedFolderNote(
	folder: TFolder,
	settings: ArchiveThisSettings
): TFile | null {
	if (folder.children.length === 0) return null; //no folder note
	const folderNote = folder.children.find(
		(child) => child instanceof TFile && child.name === settings.useFolderNote.name
	);
	return folderNote instanceof TFile ? folderNote : null;
}

export async function renameFolderNote(
	newPath: string,
	oldPath: string,
	app: App,
	settings: ArchiveThisSettings,
	restore?: boolean
) {
	const newTFile = app.vault.getAbstractFileByPath(newPath);
	if (newTFile instanceof TFolder) {
		//get the foldernote in the new folder
		const nameToFind = oldPath.split("/").pop();
		if (!nameToFind) return;
		const folderNote = getFolderNote(newTFile, settings, nameToFind);
		if (!folderNote) return;
		if (restore) {
			if (["inside", "outside"].includes(settings.useFolderNote.mode)) {
				const newPathF = `${newTFile.path.replace(folderNote.name, "")}/${newTFile.name}.${folderNote.extension}`;
				await app.fileManager.renameFile(folderNote, newPathF);
			}
		} else {
			//archiving
			const newPathF = replacePath(
				folderNote.path,
				settings.overridePaths,
				folderNote.stat,
				getFrontmatterData(app, folderNote),
				settings.date
			);
			if (newPathF === folderNote.path) return; //no change, so we skip the rename to avoid errors
			await app.fileManager.renameFile(folderNote, newPathF);
		}
	}
}
