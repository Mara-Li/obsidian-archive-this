import moment from "moment";
import type { DateFormat, FileStats, OverridePath } from "./interfaces";

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

function convertDate(value: string, format: DateFormat): string | undefined {
	const date = moment(value, format.input);
	if (date.isValid()) return date.format(format.output);
	return value;
}

/**
 * We should only use the frontmatter key if is is a stringify value
 * @param frontmatterKey
 * @param format
 */
export function frontmatterKey(frontmatterKey: unknown, format: DateFormat) {
	if (frontmatterKey == null) return undefined;
	if (typeof frontmatterKey === "string")
		return frontmatterKey.length ? convertDate(frontmatterKey, format) : undefined;
	if (typeof frontmatterKey === "number") return frontmatterKey.toString();
	if (typeof frontmatterKey === "boolean") return frontmatterKey ? "true" : "false";
	return undefined;
}

function replaceKeys(
	replacement: string,
	keys: Map<string, string | undefined>,
	stats?: FileStats,
	frontmatter?: Record<string, any>,
	dateFormat: DateFormat = { input: "YYYY-MM-DD", output: "YYYY-MM-DD" }
): string {
	let result = replacement;
	keys.forEach((defaultValue, key) => {
		let value;
		if (key === "ctime" && stats) value = moment(stats.ctime).format(dateFormat.output);
		else if (key === "mtime" && stats)
			value = moment(stats.mtime).format(dateFormat.output);
		else if (key === "size" && stats)
			value = stats.size != null ? stats.size.toString() : defaultValue;
		else value = frontmatterKey(frontmatter?.[key], dateFormat) ?? defaultValue;
		if (!value) return; //we should skip invalid path
		result = result.replaceAll(new RegExp(`{{${key}(\\|.*?)?}}`, "g"), value);
	});
	return result;
}

/**
 * Retourne le chemin de destination dans l'archive en fonction du chemin source et du chemin de remplacement configuré.
 * @param sourcePath
 * @param path {OverridePath} Le chemin configuré
 * @param fileStats
 * @param frontmatter
 * @param dateFormat
 */
function sourceToReplacement(
	sourcePath: string,
	path: OverridePath,
	fileStats?: FileStats,
	frontmatter?: Record<string, unknown>,
	dateFormat: DateFormat = { input: "YYYY-MM-DD", output: "YYYY-MM-DD" }
): string {
	const keys = parseKeys(path.archivePath);
	const replacePath = replaceKeys(
		path.archivePath,
		keys,
		fileStats,
		frontmatter,
		dateFormat
	);
	if (path.regex) {
		const sourceRegex = new RegExp(path.sourcePath, "g");
		return sourcePath.replace(sourceRegex, replacePath);
	}
	return sourcePath.replaceAll(path.sourcePath, replacePath);
}

/**
 * Replace all in the path
 * @param sourcePath The path to replace, it is based on the default created path, so Archives folder is already set.
 * @param overridePaths The list of path overrides to apply
 * @param fileStats
 * @param frontmatter
 * @param dateFormat
 * @return The path to use for the archive, if no override is applied or they are errors, it returns the sourcePath
 */
export function replacePath(
	sourcePath: string,
	overridePaths: OverridePath[],
	fileStats?: FileStats,
	frontmatter?: Record<string, unknown>,
	dateFormat: DateFormat = { input: "YYYY-MM-DD", output: "YYYY-MM-DD" }
): string {
	let result = sourcePath;
	overridePaths.forEach((path) => {
		result = sourceToReplacement(result, path, fileStats, frontmatter, dateFormat);
	});
	if (!result.match(/{{.*?}}/) || !result.length) return result;
	return sourcePath;
}
