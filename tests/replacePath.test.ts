import { describe, expect, test } from "bun:test";
import type { OverridePath } from "../src/interfaces";
import { replacePath } from "../src/replacePath";


describe("replacePath", () => {
	const overrides: OverridePath[] = [
		{
			sourcePath: "folder1/folder2",
			archivePath: "{{key1|default1}}",
			regex: false
		},
		{
			sourcePath: "inbox/(.*?)/file.md",
			archivePath: "journal/{{date}}/file.md",
			regex: true
		},
		{
			sourcePath: "folder3/folder4/filename.md",
			archivePath: "EX1/filename.md",
			regex: false,
		},
		{
			sourcePath: "folder7/folder8/filename.md",
			archivePath: "folder7/folder8/rename.md",
			regex: false,
		}
	]
	test("should replace path with frontmatter key", () => {
		const archivePath = replacePath("inbox/2023-01-01/file.md", overrides, { date: "2023-01-01" });
		expect(archivePath).toBe("journal/2023-01-01/file.md");
	})
	test("Should return original path if no frontmatter", () => {
		const archivePath = replacePath("inbox/2023-01-01/file.md", overrides);
		expect(archivePath).toBe("inbox/2023-01-01/file.md");
	})
	test("Should simply change the path", () => {
		const archivePath = replacePath("folder3/folder4/filename.md", overrides);
		expect(archivePath).toBe("EX1/filename.md");
	})
	test("Should rename", () => {
		const archivePath = replacePath("folder7/folder8/filename.md", overrides);
		expect(archivePath).toBe("folder7/folder8/rename.md");
	})
})