#!/usr/bin/env node

import arg from "arg";
import {checkUnstaged} from ".";

function mmacCli() {
	const {
		"--help": showHelp = false,
		"--update-script": updateScript,
		"--vcs": vcs = "git",
	} = arg({
		"--help": Boolean,
		"--update-script": String,
		"--vcs": String,
	});

	if (showHelp) {
		process.stdout.write(
			[
				"mmac-check is helper from make-me-a-content package, it is meant to be run",
				"after content is generating to validate that there are no unstaged files.",
				"",
				"Example:",
				'mmac-check --updateScript="npm run generate-docs"',
				"",
				"",
				"Supported flags:",
				"--help\t\t\tShows help",
				"",
				"--update-script\t\tThe script to regenerate the content locally",
				"",
				'--vcs\t\t\tUsed to specify VCS. Default value is "git"',
				'\t\t\tSupported values are "git" | "svn" | "mercurial",',
				"",
			].join("\n"),
		);
		process.exit(0);
	}

	if (!updateScript) {
		process.stderr.write("No --update-script was provided\n");
		process.exit(1);
	}

	if (vcs !== "git" && vcs !== "svn" && vcs !== "mercurial") {
		process.stderr.write(
			[
				`The supported --vcs values include "git", "svn" or "mercurial".`,
				`Unexpected value provided "${vcs}"\n`,
			].join("\n"),
		);
		process.exit(1);
	}

	const modifiedFiles = checkUnstaged({vcs});

	if (modifiedFiles.length) {
		process.stderr.write(
			`There are unstaged changes, run "${updateScript}" locally and commit the changes. Unstaged files:\n\n${modifiedFiles.map((
				f,
			) => `- ${f}`).join("\n")}\n`,
		);

		process.exit(1);
	} else {
		process.exit(0);
	}
}

try {
	mmacCli();
} catch (e) {
	process.stderr.write(`${e}`);
	process.exit(1);
}
