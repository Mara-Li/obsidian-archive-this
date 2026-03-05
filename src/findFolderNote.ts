import { TFolder, TFile } from "obsidian";
import type { ArchiveThisSettings } from "./interfaces";

export function getFolderNote( folder: TFolder, settings: ArchiveThisSettings): TFile | null {
	if (!settings.useFolderNote.enable) return null;
	switch(settings.useFolderNote.mode) {
		case "inside":
			return getFolderNoteInside(folder);
		case "outside":
			return getFolderNoteOutside(folder);
		case "named":
			return getNamedFolderNote(folder, settings);
		default:
			return null;
	}
}

function getFolderNoteInside(folder: TFolder): TFile | null {
	if (folder.children.length === 0) return null; //no folder note
	const folderNote = folder.children.find((child) => child instanceof TFile && child.name === `${folder.name}.md`);
	return folderNote instanceof TFile ? folderNote : null;
}

function getFolderNoteOutside(folder: TFolder): TFile | null {
	const parentFolder = folder.parent;
	if (!parentFolder) return null; //no parent, so no outside folder note
	const folderNote = parentFolder.children.find((child) => child instanceof TFile && child.name === `${folder.name}.md`);
	return folderNote instanceof TFile ? folderNote : null;
}

function getNamedFolderNote(folder: TFolder, settings: ArchiveThisSettings): TFile | null {
	if (folder.children.length === 0) return null; //no folder note
	const folderNote = folder.children.find((child) => child instanceof TFile && child.name === settings.useFolderNote.name);
	return folderNote instanceof TFile ? folderNote : null;
}