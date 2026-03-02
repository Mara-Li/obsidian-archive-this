export interface ArchiveThisSettings {
	archiveFolder: string;
	deleteWhenEmpty: {
		inSource: boolean;
		inArchive: boolean;
	}
}

export const DEFAULT_SETTINGS: ArchiveThisSettings = {
	archiveFolder: "",
	deleteWhenEmpty: {
		inSource: false,
		inArchive: false,
	}
}