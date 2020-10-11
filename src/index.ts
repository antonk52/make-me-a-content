import {promises as fs} from "fs";
import {extname} from "path";
import {createHash} from "crypto";
import escapeStringRegexp from "escape-string-regexp";

function getMd5Hash(input: string) {
	return createHash("md5").update(input).digest("hex");
}
function regex(strs: TemplateStringsArray, ...values: Array<string>): RegExp {
	let pattern = "";

	for (let i = 0; i < strs.length; i++) {
		const str = strs.raw[i];
		pattern += str;
		if (i === strs.length - 1) {
			continue;
		}

		const value = values[i];
		pattern += escapeStringRegexp(value);
	}

	return new RegExp(pattern);
}

type Comment = {
	start: string;
	end: string;
};

const jsLikeComments: Comment = {
	start: "/* ",
	end: " */",
};
const htmlComments: Comment = {
	start: "<!-- ",
	end: " -->",
};
const defaultComments: Record<string, Comment> = {
	".js": jsLikeComments,
	".jsx": jsLikeComments,
	".ts": jsLikeComments,
	".tsx": jsLikeComments,

	".css": jsLikeComments,
	".scss": jsLikeComments,
	".saas": jsLikeComments,
	".less": jsLikeComments,
	".stylus": jsLikeComments,

	".html": htmlComments,
	".md": htmlComments,
};

type MmacOptions = {
	/**
     * section id
     * @default "main"
     */
	id?: string;
	/**
     * script to update the content
     */
	updateScript: string;
	/**
     * path to the file
     */
	filepath: string;
	/**
     * to be placed between the comments
     */
	lines: Array<string>;
	/**
     * to be placed in start comment
     */
	hash?: string;
	/**
     * add new exensions or overwride existsing
     */
	comments?: Record<string, Comment>;
	/**
     * transform new file content
     */
	transform?: (newFileContent: string) => string;
};

export async function mmac(
	{
		id = "main",
		updateScript,
		filepath,
		lines = [],
		hash = getMd5Hash(lines.join("\n")),
		comments = {},
		transform = (x) => x,
	}: MmacOptions,
) {
	if (lines.length === 0) {
		throw new Error(`No content provided for file "${filepath}"`);
	}

	if (!updateScript) {
		throw new Error(`No update script provided for file "${filepath}"`);
	}

	const ext = extname(filepath);
	const commentStyle = {...defaultComments, ...comments}[ext];

	if (commentStyle === undefined) {
		throw new Error(`Unknown extension "${ext}"`);
	}

	const oldContent = await fs.readFile(filepath).then((b: Buffer) =>
		b.toString()
	).catch((e: Error) => {
		throw new Error(`Could not read file "${e}"`);
	});

	const oldContentLines = oldContent.split("\n");

	const RE = {
		start: regex`^${commentStyle.start}GENERATED_START\(id:${id};`,
		end: regex`^${commentStyle.start}GENERATED_END\(id:${id}\)${commentStyle.end}`,
	};

	const mark = {
		start: `${commentStyle.start}GENERATED_START(id:${id};hash:${hash}) This is generated content, do not modify by hand, to regenerate run "${updateScript}"${commentStyle.end}`,
		end: `${commentStyle.start}GENERATED_END(id:${id})${commentStyle.end}`,
		startIndex: oldContentLines.findIndex((line: string) => RE.start.test(line)),
		endIndex: oldContentLines.findIndex((line: string) => RE.end.test(line)),
	};

	if (mark.startIndex === -1) {
		throw new Error(
			`Could not find start content comment in file "${filepath}"`,
		);
	}

	if (mark.endIndex === -1) {
		throw new Error(`Could not find end content comment in file "${filepath}"`);
	}

	if (mark.startIndex > mark.endIndex) {
		throw new Error(
			`End comment is located before content start comment in file "${filepath}"`,
		);
	}

	const newContentLines = [
		...oldContentLines.slice(0, mark.startIndex),
		mark.start,
		...lines,
		mark.end,
		...oldContentLines.slice(mark.endIndex + 1),
	];

	await fs.writeFile(filepath, transform(newContentLines.join("\n")));
}
