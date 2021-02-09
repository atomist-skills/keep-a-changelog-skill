/*
 * Copyright © 2021 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
	Contextual,
	git,
	HandlerStatus,
	project,
	repository,
	secret,
	status,
} from "@atomist/skill";
import { CommitEditor } from "@atomist/skill/lib/git";
import * as fs from "fs-extra";
import * as _ from "lodash";
import { promisify } from "util";

import { ChangelogConfiguration, DefaultFileName } from "../configuration";
import {
	ClosedIssueWithChangelogLabelSubscription,
	ClosedPullRequestWithChangelogLabelSubscription,
	PushWithChangelogLabelSubscription,
} from "../typings/types";
import * as parseChangelog from "./changelogParser";
import { ChangelogLabels } from "./labels";

export const ChangelogTemplate = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [0.0.0]
`;

export interface ChangelogEntry {
	category?: string; // "added" | "changed" | "deprecated" | "removed" | "fixed" | "security";
	authors?: Array<{ login: string; name?: string; email?: string }>;
	title: string;
	label: string;
	url: string;
	qualifiers: string[];
}

/**
 * Add entry to changelog for closed issue or pull request
 */
export async function addChangelogEntryForClosedIssue(
	data:
		| ClosedIssueWithChangelogLabelSubscription
		| ClosedPullRequestWithChangelogLabelSubscription,
	ctx: Contextual<any, any>,
	cfg: ChangelogConfiguration,
): Promise<HandlerStatus> {
	let issue:
		| ClosedIssueWithChangelogLabelSubscription["Issue"][number]
		| ClosedPullRequestWithChangelogLabelSubscription["PullRequest"][number];
	const authors: ChangelogEntry["authors"] = [];
	if ((data as ClosedIssueWithChangelogLabelSubscription).Issue) {
		const i = (data as ClosedIssueWithChangelogLabelSubscription).Issue[0];
		authors.push({
			login: i.closedBy.login,
			name: i.closedBy.name,
			email: i.closedBy.emails?.[0]?.address,
		});
		issue = i;
	} else if (
		(data as ClosedPullRequestWithChangelogLabelSubscription).PullRequest
	) {
		const p = (data as ClosedPullRequestWithChangelogLabelSubscription)
			.PullRequest[0];
		authors.push(
			..._.uniqBy(
				p.commits.map(c => ({
					login: c.author.login,
					name: c.author.name,
					email: c.author.emails?.[0]?.address,
				})),
				"login",
			),
		);
		issue = p;
	}

	const url = `https://github.com/${issue.repo.owner}/${issue.repo.name}/issues/${issue.number}`;
	const categories = issue.labels
		.filter(l => l.name.startsWith("changelog:"))
		.map(l => l.name.split(":")[1]);
	const qualifiers = issue.labels.some(
		l => l.name.toLocaleLowerCase() === "breaking",
	)
		? ["breaking"]
		: [];
	const entry: ChangelogEntry = {
		title: issue.title,
		label: `#${issue.number.toString()}`,
		url,
		qualifiers,
		authors,
	};
	const allEntries = categories.map(category => ({ ...entry, category }));

	const credential = await ctx.credential.resolve(
		secret.gitHubAppToken({
			owner: issue.repo.owner,
			repo: issue.repo.name,
			apiUrl: issue.repo.org.provider.apiUrl,
		}),
	);
	const p = await ctx.project.clone(
		repository.gitHub({
			owner: issue.repo.owner,
			repo: issue.repo.name,
			credential,
		}),
	);
	const changelogFile = cfg.file || DefaultFileName;
	const slugLink = `[${issue.repo.owner}/${issue.repo.name}](${issue.repo.url})`;
	const changelogPath = p.path(changelogFile);
	const newEntries = await filterChangelogEntries(allEntries, changelogPath);
	if (newEntries.length < 1) {
		return status
			.success(
				`All ${changelogFile} entries already exist in ${slugLink}`,
			)
			.hidden();
	}

	const author = newEntries
		.find(e => e.authors.some(a => a.login))
		.authors.find(a => a.login);

	await git.persistChanges({
		project: p,
		branch: issue.repo.defaultBranch,
		editors: [changelogEditor(p, newEntries, cfg)],
		author,
	});

	return status.success(`Updated ${changelogFile} in ${slugLink}`);
}

/**
 * Add entry to changelog for commits
 * @param {PushWithChangelogLabel.Push} commit
 * @param {string} token
 * @returns {Promise<HandlerResult>}
 */
export async function addChangelogEntryForCommit(
	push: PushWithChangelogLabelSubscription["Push"][number],
	ctx: Contextual<any, any>,
	cfg: ChangelogConfiguration,
): Promise<HandlerStatus> {
	if (push.branch !== push.repo.defaultBranch) {
		return status.success("Ignoring pushes to non-default branch").hidden();
	}

	const commitEntries: ChangelogEntry[] = [];
	for (const commit of push.commits) {
		const categories: string[] = [];
		const qualifiers: string[] = [];
		ChangelogLabels.forEach(l => {
			if (commit.message.toLowerCase().includes(`[changelog:${l}]`)) {
				categories.push(l);
			}
		});
		if (cfg.mapAdded?.some(m => commit.message.match(m))) {
			categories.push("added");
		}
		if (cfg.mapChanged?.some(m => commit.message.match(m))) {
			categories.push("changed");
		}
		if (cfg.mapDeprecated?.some(m => commit.message.match(m))) {
			categories.push("deprecated");
		}
		if (cfg.mapRemoved?.some(m => commit.message.match(m))) {
			categories.push("removed");
		}
		if (cfg.mapFixed?.some(m => commit.message.match(m))) {
			categories.push("fixed");
		}
		if (cfg.mapSecurity?.some(m => commit.message.match(m))) {
			categories.push("security");
		}
		if (cfg.mapBreaking?.some(m => commit.message.match(m))) {
			qualifiers.push("breaking");
		}

		const entry: ChangelogEntry = {
			title: commit.message
				.split("\n")[0]
				.replace(/\[changelog:.*?\]/g, "")
				.trim(),
			label: commit.sha.slice(0, 7),
			url: commit.url,
			authors: [
				{
					login: commit.author.login,
					name: commit.author.name,
					email: commit.author.emails?.[0]?.address,
				},
			],
			qualifiers,
		};
		commitEntries.push(
			...categories.map(category => ({ ...entry, category })),
		);
	}

	const changelogFile = cfg.file || DefaultFileName;
	const slugLink = `[${push.repo.owner}/${push.repo.name}](${push.repo.url})`;
	if (commitEntries.length < 1) {
		return status
			.success(`No updates to ${changelogFile} in ${slugLink}`)
			.hidden();
	}

	const credential = await ctx.credential.resolve(
		secret.gitHubAppToken({
			owner: push.repo.owner,
			repo: push.repo.name,
			apiUrl: push.repo.org.provider.apiUrl,
		}),
	);
	const p = await ctx.project.clone(
		repository.gitHub({
			owner: push.repo.owner,
			repo: push.repo.name,
			branch: push.branch,
			credential,
		}),
	);
	const changelogPath = p.path(changelogFile);

	const changelogCommits: string[] = [];
	for (const commit of push.commits) {
		try {
			const diffResult = await p.exec("git", [
				"diff",
				"--name-only",
				`${commit.sha}~1...${commit.sha}`,
			]);
			const diffOut = diffResult.stdout;
			const diffFiles = diffOut
				.split("\n")
				.map(f => f.trim())
				.filter(f => f?.length > 0);
			if (diffFiles.length === 1 && diffFiles.includes(changelogFile)) {
				changelogCommits.push(commit.sha);
			}
		} catch (e) {
			// ignore
		}
	}
	const validEntries = removeEntriesByCommits(
		commitEntries,
		changelogCommits,
	);

	const newEntries = await filterChangelogEntries(
		validEntries,
		changelogPath,
	);
	if (newEntries.length < 1) {
		return status
			.success(
				`All ${changelogFile} entries already exist in ${slugLink}`,
			)
			.hidden();
	}

	const author = newEntries
		.find(e => e.authors.some(a => a.login))
		.authors.find(a => a.login);

	await git.persistChanges({
		project: p,
		branch: push.branch,
		editors: [changelogEditor(p, newEntries, cfg)],
		author,
	});
	await ctx.audit.log(
		`Added changelog entries: ${newEntries.map(e => e.title).join(", ")}`,
	);
	return status.success(`Updated ${changelogFile} in ${slugLink}`);
}

/**
 * Remove changelog entries by commit SHA. The commit SHA is matched
 * against the changelog entry label.
 *
 * @param entries changelog entries to filter
 * @param shas array of commit SHAs to filter out
 * @return changelog entries that do not have labels that match any of the commit SHAs
 */
export function removeEntriesByCommits(
	entries: ChangelogEntry[],
	shas: string[],
): ChangelogEntry[] {
	if (!shas || shas.length < 1) {
		return entries;
	}
	return entries.filter(e => {
		const shaRegExp = new RegExp(`^${e.label}`);
		return !shas.some(s => shaRegExp.exec(s));
	});
}

/**
 * Filter out changelog entries whose URL is already in changelog. If
 * changelog file does not exist or is not readable, all entries are
 * returned.
 */
export async function filterChangelogEntries(
	entries: ChangelogEntry[],
	changelogPath: string,
): Promise<ChangelogEntry[]> {
	try {
		const content = await fs.readFile(changelogPath, "utf8");
		return entries.filter(e => !RegExp(`\\b${e.url}\\b`).test(content));
	} catch (e) {
		return entries;
	}
}

/**
 * Return an editor function suitable for git.persistChanges.
 */
const changelogEditor = (
	proj: project.Project,
	entries: ChangelogEntry[],
	cfg: ChangelogConfiguration,
): CommitEditor => async () => {
	if (!entries || entries.length < 1) {
		return undefined;
	}
	await updateChangelog(proj, entries, cfg);
	const message = [
		`Add changelog entr${entries.length > 1 ? "ies" : "y"}`,
		"",
	];
	for (const entry of entries) {
		message.push(`-   ${entry.label} to ${entry.category}`);
	}
	message.push("", "[atomist:generated]");
	return message.join("\n");
};

/**
 * Add `entries` to changelog that are not already present. Return
 * added entries.
 */
async function updateChangelog(
	p: project.Project,
	entries: ChangelogEntry[],
	cfg: ChangelogConfiguration,
): Promise<void> {
	const changelogPath = p.path(cfg.file || DefaultFileName);
	const aEntries = cfg.addAuthor
		? entries
		: entries.map(e => ({ ...e, authors: [] }));
	await updateAndWriteChangelog(p, aEntries, changelogPath);
	return;
}

/**
 * Add each entry to changelog, if an entry with the same URL does not
 * already exist.
 */
async function updateAndWriteChangelog(
	p: project.Project,
	entries: ChangelogEntry[],
	changelogPath: string,
): Promise<void> {
	if (!entries || entries.length < 1) {
		return;
	}
	let changelog = await readChangelog(changelogPath);
	for (const entry of entries) {
		changelog = addEntryToChangelog(entry, changelog, p);
	}
	return writeChangelog(changelog, changelogPath);
}

/**
 * Read and parse the project changelog.  If the changelog has
 * reference links, this function will rewrite the file with inline
 * links.  If the project does not have a changelog, one will be
 * added.
 *
 * @param p project with changelog file, or not
 * @return an object representing the parsed changelog
 */
export async function readChangelog(
	changelogPath: string,
): Promise<parseChangelog.Changelog> {
	if (!(await fs.pathExists(changelogPath))) {
		await fs.writeFile(changelogPath, ChangelogTemplate);
	}

	// Inline links as we would otherwise lose them
	const remark = require("remark"); // eslint-disable-line @typescript-eslint/no-var-requires
	const links = require("remark-inline-links"); // eslint-disable-line @typescript-eslint/no-var-requires
	const pr = promisify(remark().use(links).process);

	const inlined = await pr(await fs.readFile(changelogPath));
	await fs.writeFile(changelogPath, inlined.contents);

	return parseChangelog(changelogPath);
}

export function addEntryToChangelog(
	entry: ChangelogEntry,
	cl: parseChangelog.Changelog,
	p: project.Project,
): any {
	const version = readUnreleasedVersion(cl, p);

	// Add the entry to the correct section
	const category = _.upperFirst(entry.category || "changed");
	const qualifiers = (entry.qualifiers || [])
		.map(q => `**${q.toLocaleUpperCase()}**`)
		.join(" ");
	const title = entry.title.endsWith(".") ? entry.title : `${entry.title}.`;
	const prefix = qualifiers && qualifiers.length > 0 ? `${qualifiers} ` : "";
	const line = `-   ${prefix}${_.upperFirst(title)} [${entry.label}](${
		entry.url
	})${
		entry.authors?.length > 0
			? ` by ${entry.authors
					.map(a => `[@${a.login}](https://github.com/${a.login})`)
					.join(", ")}`
			: ""
	}`;
	if (version.parsed[category]) {
		version.parsed[category].push(line);
	} else {
		version.parsed[category] = [line];
	}

	return cl;
}

/**
 * Convert changelog object back to a string.
 *
 * @param changelog parsed changelog object
 * @return markdown formatted changelog file contents
 */
export function changelogToString(changelog: parseChangelog.Changelog): string {
	let content = `# ${changelog.title}`;
	if (changelog.description) {
		content = `${content}

${changelog.description}`;
	}

	(changelog.versions || [])
		.filter((v: any) => v.version !== "0.0.0")
		.forEach((v: any) => {
			content += `

## ${v.title}`;

			const keys = Object.keys(v.parsed)
				.filter(k => k !== "_")
				.sort(
					(k1, k2) =>
						ChangelogLabels.indexOf(k1.toLocaleLowerCase()) -
						ChangelogLabels.indexOf(k2.toLocaleLowerCase()),
				);

			for (const category of keys) {
				content += `

### ${category}

${v.parsed[category].join("\n")}`;
			}
		});

	return content + "\n";
}

/**
 * Write changelog back out to the CHANGELOG.md file
 */
export async function writeChangelog(
	changelog: parseChangelog.Changelog,
	changelogPath: string,
): Promise<void> {
	const content = changelogToString(changelog);
	return fs.writeFile(changelogPath, content);
}

function readUnreleasedVersion(
	cl: parseChangelog.Changelog,
	p: project.Project,
): parseChangelog.Changelog["versions"][number] {
	let version: parseChangelog.Changelog["versions"][number];
	// Get Unreleased section or create if not already available
	if (
		cl &&
		cl.versions &&
		cl.versions.length > 0 &&
		// This github.com version is really odd, not sure what the parser thinks here
		(!cl.versions[0].version || cl.versions[0].version === "github.com")
	) {
		version = cl.versions[0];
	} else {
		version = {
			title: `[Unreleased](https://github.com/${p.id.owner}/${
				p.id.repo
			}/${
				cl.versions &&
				cl.versions.filter((v: any) => v.version !== "0.0.0").length > 0
					? `compare/${cl.versions[0].version}...HEAD`
					: "tree/HEAD"
			})`,
			body: "",
			parsed: {},
		};
		cl.versions = [version, ...cl.versions];
	}
	return version;
}
