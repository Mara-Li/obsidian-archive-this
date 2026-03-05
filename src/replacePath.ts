import { normalizePath, type FrontMatterCache } from "obsidian";
import type { OverridePath } from "./interfaces";

function parseKeys(replacement: string): Map<string, string | undefined> {
	const regex = /{{(?<key>.*?)(\|(?<default>.*?))?}}/gm;
	const keys: Map<string, string | undefined> = new Map();
	let match;
	while ((match = regex.exec(replacement)) !== null) {
		keys.set(match.groups!.key, match.groups!.default);
	}
	return keys;
}

function replaceKeys(
	replacement: string,
	keys: Map<string, string | undefined>,
	frontmatter?: FrontMatterCache
): string {
	let result = replacement;
	keys.forEach((defaultValue, key) => {
		const value = frontmatter?.[key] ?? defaultValue;
		if (!value) return; //we should skip invalid path
		result = result.replace(new RegExp(`{{${key}(\\|.*?)?}}`, "g"), value);
	});
	return result;
}

/**
 * Retourne le chemin de destination dans l'archive en fonction du chemin source et du chemin de remplacement configuré.
 * @param path {OverridePath} Le chemin configuré
 */
function sourceToReplacement(
	sourcePath: string,
	path: OverridePath,
	frontmatter?: FrontMatterCache
): string {
	const keys = parseKeys(path.archivePath);
	const replacePath = replaceKeys(path.archivePath, keys, frontmatter);
	if (path.regex) {
		const sourceRegex = new RegExp(path.sourcePath);
		return sourcePath.replace(sourceRegex, replacePath);
	}
	return sourcePath.replace(path.sourcePath, replacePath);
}

/**
 * Replace all in the path
 */
export function replacePath(
	sourcePath: string,
	defaultPath: string,
	overridePaths: OverridePath[],
	frontmatter?: FrontMatterCache
): string {
	let result = sourcePath;
	overridePaths.forEach((path) => {
		result = sourceToReplacement(result, path, frontmatter);
	});
	if (!result.match(/{{.*?}}/)) return normalizePath(result);
	return defaultPath;
}
