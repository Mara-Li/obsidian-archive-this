import type { OverridePath } from "./interfaces";

function parseKeys(replacement: string): Map<string, string | undefined> {
	const regex = /{{(?<key>.*?)(\|(?<default>.*?))?}}/gm;
	const keys: Map<string, string | undefined> = new Map();
	let match;
	// biome-ignore lint/suspicious/noAssignInExpressions: it is the best way to get all matches with regex.exec in a loop
	while ((match = regex.exec(replacement)) !== null) {
		keys.set(match.groups!.key, match.groups!.default);
	}
	return keys;
}

/**
 * We should only use the frontmatter key if is is a stringify value
 * @param frontmatterKey
 */
function frontmatterKey(frontmatterKey: unknown) {
	if (typeof frontmatterKey === "string") return frontmatterKey;
	if (typeof frontmatterKey === "number") return frontmatterKey.toString();
	if (typeof frontmatterKey === "boolean") return frontmatterKey ? "true" : "false";
	return undefined;
}

function replaceKeys(
	replacement: string,
	keys: Map<string, string | undefined>,
	frontmatter?: Record<string, any>
): string {
	let result = replacement;
	keys.forEach((defaultValue, key) => {
		const value = frontmatterKey(frontmatter?.[key]) ?? defaultValue;
		if (!value) return; //we should skip invalid path
		result = result.replace(new RegExp(`{{${key}(\\|.*?)?}}`, "g"), value);
	});
	return result;
}

/**
 * Retourne le chemin de destination dans l'archive en fonction du chemin source et du chemin de remplacement configuré.
 * @param sourcePath
 * @param path {OverridePath} Le chemin configuré
 * @param frontmatter
 */
function sourceToReplacement(
	sourcePath: string,
	path: OverridePath,
	frontmatter?: Record<string, unknown>
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
 * @param sourcePath The path to replace, it is based on the default created path, so Archives folder is already set.
 * @param overridePaths The list of path overrides to apply
 * @param frontmatter
 * @return The path to use for the archive, if no override is applied or they are errors, it returns the sourcePath
 */
export function replacePath(
	sourcePath: string,
	overridePaths: OverridePath[],
	frontmatter?: Record<string, unknown>
): string {
	let result = sourcePath;
	overridePaths.forEach((path) => {
		result = sourceToReplacement(result, path, frontmatter);
	});
	if (!result.match(/{{.*?}}/)) return result;
	return sourcePath;
}
