/*
 * Copyright © 2020 Atomist, Inc.
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
	HandlerStatus,
	git,
	project,
	repository,
	secret,
	Contextual,
	status,
	toArray,
} from "@atomist/skill";
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
		| ClosedIssueWithChangelogLabelSubscription["Issue"][0]
		| ClosedPullRequestWithChangelogLabelSubscription["PullRequest"][0];
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
	if (await updateChangelog(p, categories, entry, cfg || {})) {
		await git.push(p);
	}
	return status.success(
		`Updated CHANGELOG.md in [${issue.repo.owner}/${issue.repo.name}](${issue.repo.url})`,
	);
}

/**
 * Add entry to changelog for commits
 * @param {PushWithChangelogLabel.Push} commit
 * @param {string} token
 * @returns {Promise<HandlerResult>}
 */
export async function addChangelogEntryForCommit(
	push: PushWithChangelogLabelSubscription["Push"][0],
	ctx: Contextual<any, any>,
	cfg: ChangelogConfiguration,
): Promise<HandlerStatus> {
	if (push.branch !== push.repo.defaultBranch) {
		return status.success("Ignoring pushes to non-default branch").hidden();
	}

	const entries: Array<{ entry: ChangelogEntry; categories: string[] }> = [];
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
				.replace(/\[changelog:.*\]/g, "")
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

		if (categories.length > 0) {
			entries.push({ entry, categories });
		}
	}

	if (entries.length > 0) {
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
				credential,
			}),
		);
		const results = [];
		for (const entry of entries) {
			results.push(
				await updateChangelog(
					p,
					entry.categories,
					entry.entry,
					toArray(ctx.configuration)?.[0]?.parameters || {},
				),
			);
		}
		if (results.some(r => !!r)) {
			await git.push(p);
		}
		return status.success(
			`Updated ${cfg.file || DefaultFileName} in [${push.repo.owner}/${
				push.repo.name
			}](${push.repo.url})`,
		);
	} else {
		return status
			.success(
				`No updates to ${cfg.file || DefaultFileName} in [${
					push.repo.owner
				}/${push.repo.name}](${push.repo.url})`,
			)
			.hidden();
	}
}

async function updateChangelog(
	p: project.Project,
	categories: string[],
	entry: ChangelogEntry,
	cfg: ChangelogConfiguration,
): Promise<boolean> {
	const changelogPath = p.path(cfg.file || DefaultFileName);
	const authors = entry.authors || [];
	if (!cfg.addAuthor) {
		entry.authors = [];
	}
	if (await fs.pathExists(changelogPath)) {
		// If changelog exists make sure it doesn't already contain the label
		const content = (await fs.readFile(changelogPath)).toString();
		if (!content.includes(entry.url)) {
			await updateAndWriteChangelog(p, categories, entry, changelogPath);
		}
	} else {
		await updateAndWriteChangelog(p, categories, entry, changelogPath);
	}

	if (!(await git.status(p)).isClean) {
		let options = {};
		if (authors.length > 0) {
			options = {
				name: authors[0].name,
				email: authors[0].email,
			};
		}
		await git.commit(
			p,
			`Changelog: ${entry.label} to ${categories.join(", ")}

[atomist:generated]`,
			options,
		);
		return true;
	}
	return false;
}

async function updateAndWriteChangelog(
	p: project.Project,
	categories: string[],
	entry: ChangelogEntry,
	changelogPath: string,
): Promise<any> {
	let changelog = await readChangelog(changelogPath);
	for (const category of categories) {
		changelog = addEntryToChangelog(
			{
				...entry,
				category,
			},
			changelog,
			p,
		);
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
	cl: any, // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
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
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function changelogToString(changelog: any): string {
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
	changelog: any, // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
	changelogPath: string,
): Promise<void> {
	const content = changelogToString(changelog);
	return fs.writeFile(changelogPath, content);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function readUnreleasedVersion(cl: any, p: project.Project): any {
	let version;
	// Get Unreleased section or create if not already available
	if (
		cl &&
		cl.versions &&
		cl.versions.length > 0 &&
		// This github.com version is really odd. Not sure what the parser thinks here
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
			parsed: {},
		};
		cl.versions = [version, ...cl.versions];
	}
	return version;
}
