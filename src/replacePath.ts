import moment from "moment";
import {
	type DateFormat,
	type FileStats,
	type KeyNameInPath,
	type OverridePath,
	ValidTransformation,
} from "./interfaces";
import "uniformize";
import slugify from "slugify";

export function parseKeys(replacement: string): Map<string, KeyNameInPath | undefined> {
	const regex = /{{(?<key>.*?)(\|(?<default>.*?))?(:(?<transform>.*))?}}/gm;
	const keys: Map<string, KeyNameInPath | undefined> = new Map();
	let match;
	// biome-ignore lint/suspicious/noAssignInExpressions: it is the best way to get all matches with regex.exec in a loop
	while ((match = regex.exec(replacement)) !== null) {
		const groups = match.groups;
		if (groups) {
			let transform;
			if (groups.transform) {
				const [type, from, to] = groups.transform.split("/");
				transform = {
					type: type as ValidTransformation,
					remplacement: { from, to },
				};
			}
			keys.set(groups.key, {
				default: groups.default,
				transform,
			});
		}
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
	if (Array.isArray(frontmatterKey)) return frontmatterKey.join("/");
	return undefined;
}

function transformKey(key: string, transformation?: KeyNameInPath) {
	if (!transformation?.transform) return key;
	switch (transformation.transform.type) {
		case ValidTransformation.SlugifyStrict:
			return slugify(key, {
				strict: true,
				replacement: transformation.transform.remplacement?.from,
				lower: true,
			});
		case ValidTransformation.Slugify:
			return slugify(key, {
				strict: false,
				replacement: transformation.transform.remplacement?.from,
				lower: false,
			});
		case ValidTransformation.Lowercase:
			return replaceTheTransform(key.toLowerCase(), transformation.transform);
		case ValidTransformation.NoAccent:
			return replaceTheTransform(key.removeAccents(), transformation.transform);
		case ValidTransformation.Normalize:
			return replaceTheTransform(key.normalize(), transformation.transform);
		case ValidTransformation.Capitalize:
			return replaceTheTransform(key.capitalize(true), transformation.transform);
		case ValidTransformation.Uppercase:
			return replaceTheTransform(key.toUpperCase(), transformation.transform);
	}
}

function replaceTheTransform(value: string, transformate: KeyNameInPath["transform"]) {
	if (transformate?.remplacement) {
		return value.replaceAll(transformate.remplacement.from, transformate.remplacement.to);
	}
	return value;
}

function replaceKeys(
	replacement: string,
	keys: Map<string, KeyNameInPath | undefined>,
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
			value = stats.size != null ? stats.size.toString() : defaultValue?.default;
		else value = frontmatterKey(frontmatter?.[key], dateFormat) ?? defaultValue?.default;
		if (!value) return; //we should skip invalid path
		result = result.replaceAll(
			new RegExp(`{{${key}(\\|.*?)?(:(.*?))?}}`, "g"),
			transformKey(value, defaultValue)
		);
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
	if (path.regexFlags.length) {
		const sourceRegex = new RegExp(path.sourcePath, path.regexFlags);
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
