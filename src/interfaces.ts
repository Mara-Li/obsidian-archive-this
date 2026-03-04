export interface ArchiveThisSettings {
	archiveFolder: string;
	deleteWhenEmpty: {
		inSource: boolean;
		inArchive: boolean;
	};
	overridePaths: OverridePath[];
	originalPathFrontmatterKey: string;
}

export type OverridePath = {
	sourcePath: string;
	archivePath: string;
	regex: boolean;
};

export const DEFAULT_SETTINGS: ArchiveThisSettings = {
	archiveFolder: "",
	deleteWhenEmpty: {
		inSource: false,
		inArchive: false,
	},
	overridePaths: [],
	originalPathFrontmatterKey: "original_path",
};
