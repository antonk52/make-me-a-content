import {mmac} from "..";
import fs from "fs";
// rome-ignore resolver/unknownExport
import prettier from "prettier";

const readFile = (fs.promises.readFile as jest.Mock);
const writeFile = (fs.promises.writeFile as jest.Mock<
	Promise<void>,
	[string, Buffer | string]
>);

jest.mock(
	"fs",
	() => {
		const fs = jest.requireActual("fs");

		return {
			// need the original fs functions, otherwise prettier throws
			...fs,
			promises: {
				readFile: jest.fn(),
				writeFile: jest.fn(),
			},
		};
	},
);

beforeEach(() => {
	(fs.promises.writeFile as jest.Mock).mockClear();
	(fs.promises.readFile as jest.Mock).mockClear();
});

describe(
	"default options",
	() => {
		it(
			"works out of the box",
			async () => {
				readFile.mockResolvedValueOnce(
					[
						"import fs from 'fs'",
						"/* GENERATED_START(id:main;hash) */",
						"/* GENERATED_END(id:main) */",
						"fs.writeFileSync(foo, bar)",
					].join("\n"),
				);
				const result = await mmac({
					lines: ["import foo from 'some-funky-path'"],
					updateScript: "npm run update-things",
					filepath: "foo.js",
				});

				expect(result).toEqual(undefined);
				expect(writeFile.mock.calls.length).toEqual(1);
				expect(writeFile.mock.calls[0]).toEqual([
					"foo.js",
					[
						"import fs from 'fs'",
						'/* GENERATED_START(id:main;hash:e6e22a15632945dec62b6320b7e05ff4) This is generated content, do not modify by hand, to regenerate run "npm run update-things" */',
						"import foo from 'some-funky-path'",
						"/* GENERATED_END(id:main) */",
						"fs.writeFileSync(foo, bar)",
					].join("\n"),
				]);
			},
		);

		it(
			"changes the hash & the order of lines",
			async () => {
				readFile.mockResolvedValueOnce(
					[
						"import fs from 'fs'",
						'/* GENERATED_START(id:main;hash:90ab6b4b41e0055ca8b40d0a73613d30) This is generated content, do not modify by hand, to regenerate run "npm run update-things" */',
						"import foo from 'foo'",
						"import bar from 'bar'",
						"/* GENERATED_END(id:main) */",
						"fs.writeFileSync(foo, bar)",
					].join("\n"),
				);
				const result = await mmac({
					lines: ["import bar from 'bar'", "import foo from 'foo'"],
					updateScript: "npm run update-things",
					filepath: "foo.js",
				});

				expect(result).toEqual(undefined);
				expect(writeFile.mock.calls.length).toEqual(1);
				expect(writeFile.mock.calls[0]).toEqual([
					"foo.js",
					[
						"import fs from 'fs'",
						'/* GENERATED_START(id:main;hash:aa227e375fd70e501bbc75ce42454336) This is generated content, do not modify by hand, to regenerate run "npm run update-things" */',
						"import bar from 'bar'",
						"import foo from 'foo'",
						"/* GENERATED_END(id:main) */",
						"fs.writeFileSync(foo, bar)",
					].join("\n"),
				]);
			},
		);

		it(
			"throws for empty lines provided",
			async () => {
				const args = {
					lines: [],
					updateScript: "npm run update-things",
					filepath: "foo.js",
				};
				expect(() => mmac(args)).rejects.toThrowError(
					'No content provided for file "foo.js"',
				);
			},
		);

		it(
			"throws no lines property provided",
			async () => {
				const args = {
					updateScript: "npm run update-things",
					filepath: "foo.js",
				};
				// @ts-expect-error
				const res = await mmac(args).catch((e) => e.message);
				expect(res).toBe('No content provided for file "foo.js"');
			},
		);

		it(
			"throws no updateScript provided",
			async () => {
				const args = {
					lines: ["content"],
					filepath: "foo.js",
				};

				// @ts-expect-error
				const res = await mmac(args).catch((e) => e.message);

				expect(res).toBe('No update script provided for file "foo.js"');
			},
		);

		it(
			"throws for unknown extension",
			async () => {
				const args = {
					lines: ["content"],
					filepath: "foo.bar",
					updateScript: "npm run update",
				};

				const res = await mmac(args).catch((e) => e.message);

				expect(res).toBe('Unknown extension ".bar"');
			},
		);

		it(
			"throws when cannot read files",
			async () => {
				const args = {
					lines: ["content"],
					filepath: "foo.js",
					updateScript: "npm run update",
				};

				readFile.mockImplementationOnce(() => Promise.reject("foo.js"));

				const res = await mmac(args).catch((e) => e.message);

				expect(res).toBe('Could not read file "foo.js"');
			},
		);

		it(
			"throws when cannot find start content comment",
			async () => {
				const args = {
					lines: ["content"],
					filepath: "foo.js",
					updateScript: "npm run update",
				};

				readFile.mockImplementationOnce(() =>
					Promise.resolve(
						["import foo from 'foo'", "console.log(foo)"].join("\n"),
					)
				);

				const res = await mmac(args).catch((e) => e.message);

				expect(res).toBe(
					'Could not find start content comment in file "foo.js"',
				);
			},
		);

		it(
			"throws when cannot find end content comment",
			async () => {
				const args = {
					lines: ["content"],
					filepath: "foo.js",
					updateScript: "npm run update",
				};

				readFile.mockImplementationOnce(() =>
					Promise.resolve(
						[
							"import foo from 'foo'",
							"console.log(foo)",
							"/* GENERATED_START(id:main;hash) */",
						].join("\n"),
					)
				);

				const res = await mmac(args).catch((e) => e.message);

				expect(res).toBe('Could not find end content comment in file "foo.js"');
			},
		);

		it(
			"throws when cannot find end content comment",
			async () => {
				const args = {
					lines: ["content"],
					filepath: "foo.js",
					updateScript: "npm run update",
				};

				readFile.mockImplementationOnce(() =>
					Promise.resolve(
						[
							"import foo from 'foo'",
							"console.log(foo)",
							"/* GENERATED_END(id:main) */",
							"/* GENERATED_START(id:main;hash) */",
						].join("\n"),
					)
				);

				const res = await mmac(args).catch((e) => e.message);

				expect(res).toBe(
					'End comment is located before content start comment in file "foo.js"',
				);
			},
		);
	},
);

describe(
	"custom options",
	() => {
		it(
			'provide a custom "id"',
			async () => {
				readFile.mockResolvedValueOnce(
					[
						"import fs from 'fs'",
						"/* GENERATED_START(id:main;hash) */",
						"/* GENERATED_END(id:main) */",
						"fs.writeFileSync(foo, bar)",
						"/* GENERATED_START(id:custom;hash) */",
						"/* GENERATED_END(id:custom) */",
					].join("\n"),
				);
				const result = await mmac({
					lines: ["console.log('hi there')"],
					updateScript: "npm run update-things",
					filepath: "foo.js",
					id: "custom",
				});

				expect(result).toEqual(undefined);
				expect(writeFile.mock.calls.length).toEqual(1);
				expect(writeFile.mock.calls[0]).toEqual([
					"foo.js",
					[
						"import fs from 'fs'",
						"/* GENERATED_START(id:main;hash) */",
						"/* GENERATED_END(id:main) */",
						"fs.writeFileSync(foo, bar)",
						'/* GENERATED_START(id:custom;hash:11154291bb36353ca2c5a853b3599578) This is generated content, do not modify by hand, to regenerate run "npm run update-things" */',
						"console.log('hi there')",
						"/* GENERATED_END(id:custom) */",
					].join("\n"),
				]);
			},
		);

		it(
			'provide a custom "hash"',
			async () => {
				readFile.mockResolvedValueOnce(
					[
						"import fs from 'fs'",
						"/* GENERATED_START(id:main;hash) */",
						"/* GENERATED_END(id:main) */",
						"fs.writeFileSync(foo, bar)",
					].join("\n"),
				);
				const result = await mmac({
					lines: ["console.log('hi there')"],
					updateScript: "npm run update-things",
					filepath: "foo.js",
					hash: "custom-hash",
				});

				expect(result).toEqual(undefined);
				expect(writeFile.mock.calls.length).toEqual(1);
				expect(writeFile.mock.calls[0]).toEqual([
					"foo.js",
					[
						"import fs from 'fs'",
						'/* GENERATED_START(id:main;hash:custom-hash) This is generated content, do not modify by hand, to regenerate run "npm run update-things" */',
						"console.log('hi there')",
						"/* GENERATED_END(id:main) */",
						"fs.writeFileSync(foo, bar)",
					].join("\n"),
				]);
			},
		);

		it(
			"overwride comments",
			async () => {
				readFile.mockResolvedValueOnce(
					[
						"import fs from 'fs'",
						"// GENERATED_START(id:main;hash)",
						"// GENERATED_END(id:main)",
						"fs.writeFileSync(foo, bar)",
					].join("\n"),
				);
				const result = await mmac({
					lines: ["console.log('hi there')"],
					updateScript: "npm run update-things",
					filepath: "foo.js",
					hash: "custom-hash",
					comments: {
						".js": {
							start: "// ",
							end: "",
						},
					},
				});

				expect(result).toEqual(undefined);
				expect(writeFile.mock.calls.length).toEqual(1);
				expect(writeFile.mock.calls[0]).toEqual([
					"foo.js",
					[
						"import fs from 'fs'",
						'// GENERATED_START(id:main;hash:custom-hash) This is generated content, do not modify by hand, to regenerate run "npm run update-things"',
						"console.log('hi there')",
						"// GENERATED_END(id:main)",
						"fs.writeFileSync(foo, bar)",
					].join("\n"),
				]);
			},
		);

		it(
			"overwride comments",
			async () => {
				readFile.mockResolvedValueOnce(
					[
						"require'nvim'",
						"-- GENERATED_START(id:main;hash)",
						"-- GENERATED_END(id:main)",
						"require'mod'",
					].join("\n"),
				);
				const result = await mmac({
					lines: ["require'mmac'"],
					updateScript: "npm run update-things",
					filepath: "foo.lua",
					hash: "custom-hash",
					comments: {
						".lua": {
							start: "-- ",
							end: "",
						},
					},
				});

				expect(result).toEqual(undefined);
				expect(writeFile.mock.calls.length).toEqual(1);
				expect(writeFile.mock.calls[0]).toEqual([
					"foo.lua",
					[
						"require'nvim'",
						'-- GENERATED_START(id:main;hash:custom-hash) This is generated content, do not modify by hand, to regenerate run "npm run update-things"',
						"require'mmac'",
						"-- GENERATED_END(id:main)",
						"require'mod'",
					].join("\n"),
				]);
			},
		);

		it(
			"transform end file",
			async () => {
				readFile.mockResolvedValueOnce(
					[
						"import fs from 'fs'",
						"/* GENERATED_START(id:main;hash) */",
						"/* GENERATED_END(id:main) */",
						"fs.writeFileSync(foo, bar)",
					].join("\n"),
				);

				const result = await mmac({
					lines: ["console.log('hi there')"],
					updateScript: "npm run update-things",
					filepath: "foo.js",
					hash: "custom-hash",
					transform: (src: string) =>
						prettier.format(src, {parser: "typescript"})
					,
				});

				expect(result).toEqual(undefined);
				expect(writeFile.mock.calls.length).toEqual(1);
				expect(writeFile.mock.calls[0]).toEqual([
					"foo.js",
					[
						'import fs from "fs";',
						'/* GENERATED_START(id:main;hash:custom-hash) This is generated content, do not modify by hand, to regenerate run "npm run update-things" */',
						'console.log("hi there");',
						"/* GENERATED_END(id:main) */",
						"fs.writeFileSync(foo, bar);",
						"",
					].join("\n"),
				]);
			},
		);
	},
);
