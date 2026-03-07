import { describe, expect, test } from "bun:test";
import {
	type FileStats,
	type OverridePath,
	ValidTransformation,
} from "../src/interfaces";
// noinspection ES6PreferShortImport
import { parseKeys, replaceKeys, replacePath } from "../src/utils/replacePath";

describe("replacePath", () => {
	const overrides: OverridePath[] = [
		{
			sourcePath: "folder1/folder2",
			archivePath: "{{key1|default1}}",
			regexFlags: "g",
		},
		{
			sourcePath: "inbox/(.*?)/file.md",
			archivePath: "journal/{{date}}/file.md",
			regexFlags: "g",
		},
		{
			sourcePath: "folder3/folder4/filename.md",
			archivePath: "EX1/filename.md",
			regexFlags: "g",
		},
		{
			sourcePath: "folder7/folder8/filename.md",
			archivePath: "folder7/folder8/rename.md",
			regexFlags: "g",
		},
	];
	const fileStat: FileStats = {
		ctime: 1770881897539,
		mtime: 1771579645604,
		size: 3298,
	};
	test("should replace path with frontmatter key", () => {
		const archivePath = replacePath("inbox/2023-01-01/file.md", overrides, fileStat, {
			date: "2023-01-01",
		});
		expect(archivePath).toBe("journal/2023-01-01/file.md");
	});
	test("Should return original path if no frontmatter", () => {
		const archivePath = replacePath("inbox/2023-01-01/file.md", overrides, fileStat);
		expect(archivePath).toBe("inbox/2023-01-01/file.md");
	});
	test("Should simply change the path", () => {
		const archivePath = replacePath("folder3/folder4/filename.md", overrides, fileStat);
		expect(archivePath).toBe("EX1/filename.md");
	});
	test("Should rename", () => {
		const archivePath = replacePath("folder7/folder8/filename.md", overrides, fileStat);
		expect(archivePath).toBe("folder7/folder8/rename.md");
	});
	describe("Transform the frontmatter found", () => {
		test("Should transform the frontmatter key using slugify", () => {
			const archivePath = replacePath("inbox/2023-01-01/file.md", overrides, fileStat, {
				date: "2023-01-01",
			});
			expect(archivePath).toBe("journal/2023-01-01/file.md");
		});
		test("Should transform the frontmatter key using lowercase", () => {
			const archivePath = replacePath("inbox/2023-01-01/file.md", overrides, fileStat, {
				date: "2023-01-01",
			});
			expect(archivePath).toBe("journal/2023-01-01/file.md");
		});
		test("Should transform the frontmatter key using uppercase", () => {
			const archivePath = replacePath("inbox/2023-01-01/file.md", overrides, fileStat, {
				date: "2023-01-01",
			});
			expect(archivePath).toBe("journal/2023-01-01/file.md");
		});
		test("Should transform the frontmatter key using capitalize", () => {
			const archivePath = replacePath("inbox/2023-01-01/file.md", overrides, fileStat, {
				date: "2023-01-01",
			});
			expect(archivePath).toBe("journal/2023-01-01/file.md");
		});
	});
});

describe("Parse the frontmatter to get the transform", () => {
	//use parseKeys
	test("{{key1|default1}}", () => {
		const parse = parseKeys("{{key1|default1}}");
		expect(parse.has("key1")).toBe(true);
		expect(parse.get("key1")?.default).toBe("default1");
	});
	test("Slugify strict", () => {
		const parse = parseKeys("{{key1|default1:slugify_strict}}");
		expect(parse.has("key1")).toBe(true);
		expect(parse.get("key1")?.transform?.type).toBe(ValidTransformation.SlugifyStrict);
	});
	test("slugify+replacement", () => {
		const parse = parseKeys("{{key1|default1:slugify_strict/-}}");
		expect(parse.has("key1")).toBe(true);
		expect(parse.get("key1")?.transform?.type).toBe(ValidTransformation.SlugifyStrict);
		expect(parse.get("key1")?.transform?.remplacement?.from).toBe("-");
	});
	test("Lower + default + replacement", () => {
		const parse = parseKeys("{{key1|default1:lowercase/ /-}}");
		expect(parse.has("key1")).toBe(true);
		expect(parse.get("key1")?.transform?.type).toBe(ValidTransformation.Lowercase);
		expect(parse.get("key1")?.transform?.remplacement?.from).toBe(" ");
		expect(parse.get("key1")?.transform?.remplacement?.to).toBe("-");
	});
});

describe("Correct transformation of the frontmatter key", () => {
	const frontmatter: Record<string, unknown> = {
		title: "Value with spaces",
		description: "Another value",
		path: ["Item 1", "Item 2"],
		object: {
			nestedKey: "Nested Value",
		},
		transform: "Value*to*transform",
		specialPath: "path/with/special/characters",
	};
	test("Slugify strict transformation", () => {
		const transform = parseKeys("{{title|default:slugify_strict}}").get(
			"title"
		)?.transform;
		expect(transform).toBeDefined();
		const transformedValue = replaceKeys(
			"{{title|default:slugify_strict}}",
			new Map([["title", { transform }]]),
			undefined,
			frontmatter
		);
		expect(transformedValue).toBe("value-with-spaces");
	});
	test("Strict with from & to replacement", () => {
		const transform = parseKeys("{{title|default:slugify_strict/_}}").get(
			"title"
		)?.transform;
		expect(transform).toBeDefined();
		const transformedValue = replaceKeys(
			"{{title|default:slugify_strict/_}}",
			new Map([["title", { transform }]]),
			undefined,
			frontmatter
		);
		expect(transformedValue).toBe("value_with_spaces");
	});
	test("{{transform:transform/*/_}}", () => {
		const transform = parseKeys("{{transform:transform/*/_}}").get(
			"transform"
		)?.transform;
		expect(transform).toBeDefined();
		const transformedValue = replaceKeys(
			"{{transform:transform/*/_}}",
			new Map([["transform", { transform }]]),
			undefined,
			frontmatter
		);
		expect(transformedValue).toBe("Value_to_transform");
	});
	test("{{specialPath:transform/// /}}", () => {
		//should throw an error
		expect(() => parseKeys("{{specialPath:transform/// /}}")).toThrowError(
			/Invalid transform format:/
		);
	});
});
