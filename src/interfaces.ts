export interface ArchiveThisSettings {
	archiveFolder: string;
	deleteWhenEmpty: {
		inSource: boolean;
		inArchive: boolean;
	};
	overridePaths: OverridePath[];
	originalPathFrontmatterKey: string;
	/**
	 * Allow to use the folder note when the archived file is a TFolder (it will get the frontmatter and add/use the original_path key)
	 */
	useFolderNote: {
		enable: boolean;
		/**
		 * Type of the folder note used:
		 * - **Inside**: Will use the same name of the parent folder : `Folder/Folder.md`
		 * - **Outside**: Will use the same name of the folder but outside, in the parent: Folder is `parent/folder` and folderNote: `parent/folder.md`
		 * - **Named**: Inside of the folder that should have the folder note, but with another name than the folder: `Folder/index.md`
		 */
		mode: "inside" | "outside" | "named";
		/**
		 * Name used in the named note mode (should have the extension of the file, ex: `index.md` or `folder_note.md`)
		 */
		name: string;
	};
	date: {
		output: string;
		input: string;
	};
}

export type OverridePath = {
	sourcePath: string;
	archivePath: string;
	/**
	 * @deprecated
	 * use regexFlags instead
	 */
	regex?: boolean;
	regexFlags: string;
};

export const DEFAULT_SETTINGS: ArchiveThisSettings = {
	archiveFolder: "",
	deleteWhenEmpty: {
		inSource: false,
		inArchive: false,
	},
	overridePaths: [],
	originalPathFrontmatterKey: "original_path",
	useFolderNote: {
		enable: false,
		mode: "inside",
		name: "index.md",
	},
	date: {
		output: "YYYY-MM-DD",
		input: "YYYY-MM-DD",
	},
};

export type FileStats = {
	ctime: number;
	mtime: number;
	size: number;
};

export type DateFormat = ArchiveThisSettings["date"];

export enum ValidTransformation {
	/**
	 * Lowercase and strip special characters
	 */
	SlugifyStrict = "slugify_strict",
	/**
	 * Slugify but not strict
	 *
	 */
	Slugify = "slugify",
	/**
	 * Lowercase
	 */
	Lowercase = "lowercase",
	/**
	 * transform accent to their normal counterpart
	 */
	NoAccent = "no_accent",
	/**
	 * no accent + lowercase
	 */
	Normalize = "normalize",
	/**
	 * Capitalize the first letter of a string
	 */
	Capitalize = "capitalize",
	/**
	 * Uppercase all the string
	 */
	Uppercase = "uppercase",
	/**
	 * No changement, but allow direct transform
	 */
	Transform = "transform"
}

export type KeyNameInPath = {
	default?: string;
	transform?: {
		type: ValidTransformation;
		remplacement?: {
			from: string;
			to: string;
		};
	};
};
