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
	Contextual,
	git,
	github,
	HandlerStatus,
	repository,
	secret,
	slack,
	status,
} from "@atomist/skill";
import { RestEndpointMethodTypes } from "@octokit/rest";
import * as fs from "fs-extra";

import { ChangelogConfiguration, DefaultFileName } from "../configuration";
import { readChangelog } from "./changelog";
import * as parseChangelog from "./changelogParser";

export async function closeChangelog(
	repo: {
		owner: string;
		name: string;
		apiUrl: string;
		url: string;
		branch: string;
		channels: string[];
	},
	version: string,
	ctx: Contextual<any, any>,
	cfg: ChangelogConfiguration,
	command = false,
): Promise<HandlerStatus> {
	const credential = await ctx.credential.resolve(
		secret.gitHubAppToken({
			owner: repo.owner,
			repo: repo.name,
			apiUrl: repo.apiUrl,
		}),
	);

	const id = repository.gitHub({
		owner: repo.owner,
		repo: repo.name,
		credential,
	});
	const api = github.api(id);
	const repoSlug = `${repo.owner}/${repo.name}`;

	let release: RestEndpointMethodTypes["repos"]["getReleaseByTag"]["response"]["data"];
	try {
		release = (
			await api.repos.getReleaseByTag({
				owner: id.owner,
				repo: id.repo,
				tag: version,
			})
		).data;
		if (release.draft || release.prerelease) {
			return status
				.success(
					`Ignore draft or prerelease ${version} release of ${repoSlug}`,
				)
				.hidden();
		}
	} catch (e) {
		if (!command) {
			return status.failure(
				`Failed to get release ${version} that triggered skill: ${e.message}`,
			);
		}
	}

	const project = await ctx.project.clone(id);

	const changelogFile = cfg?.file || DefaultFileName;
	const changelogPath = project.path(changelogFile);

	await project.spawn("git", ["pull", "origin", repo.branch]);

	if (!(await fs.pathExists(changelogPath))) {
		console.log(`${changelogPath} does not exist`);
		return status
			.success(`No ${changelogFile} found in ${repoSlug}`)
			.hidden();
	}

	try {
		let changelogChanged = false;
		await git.persistChanges({
			project,
			branch: repo.branch,
			editors: [
				async () => {
					const changelog = await fs.readFile(changelogPath, "utf8");
					const newChangelog = changelogAddRelease(
						changelog,
						version,
					);
					if (newChangelog === changelog) {
						return undefined;
					}
					changelogChanged = true;
					await fs.writeFile(changelogPath, newChangelog);
					return `Changelog: add release ${version}

[atomist:generated] [atomist-skill:${ctx.skill.namespace}/${ctx.skill.name}]`;
				},
			],
		});
		if (changelogChanged === false) {
			return status.success(
				`No changes to ${changelogFile} in ${repoSlug}`,
			);
		}
	} catch (e) {
		const reason = `Failed to update changelog in ${repoSlug} for release ${version} in ${repoSlug}`;
		console.error(`${reason}: ${e.message}`);
		return status.failure(reason);
	}

	const changelog = await readChangelog(changelogPath);
	const body = findVersionBody(version, changelog);

	if (cfg?.addChangelogToRelease !== false) {
		if (body && release) {
			if (!(release.body || "").includes(body)) {
				const existingBody = release.body
					? `${release.body.trim()}\n\n`
					: "";
				await api.repos.updateRelease({
					owner: project.id.owner,
					repo: project.id.repo,
					release_id: release.id,
					body: `${existingBody}${body.trim()}`,
				});
			}
		}
	}

	if (cfg?.announce && body && release) {
		const channels = [];
		if (cfg?.announceChannel?.length !== 0) {
			channels.push(...cfg.announceChannel.map(c => c.channelName));
		} else {
			channels.push(...repo.channels);
		}
		if (!(release.body || "").includes(body) && channels.length > 0) {
			const existingBody = release.body
				? `${release.body.trim()}\n\n`
				: "";
			const message = slack.infoMessage(
				release.name,
				`${existingBody}${slack.githubToSlack(body)}`,
				ctx,
				{
					author_link: release.html_url,
					footer: slack.url(repo.url, `${repo.owner}/${repo.name}`),
					footer_icon:
						"https://images.atomist.com/rug/github_grey.png",
				},
			);
			message.text = `${slack.url(
				release.author.html_url,
				`@${release.author.login}`,
			)} created new release in ${slack.url(
				repo.url,
				`${repo.owner}/${repo.name}`,
			)}`;
			await ctx.message.send(
				message,
				{ channels },
				{ id: `${repo.owner}/${repo.name}#${release.id}` },
			);
		}
	}

	return status.success(
		`Updated changelog in [${repo.owner}/${repo.name}](${repo.url}) for release ${version}`,
	);
}

/** Find body of changelog version matching tag. */
export function findVersionBody(
	tag: string,
	changelog?: parseChangelog.Changelog,
): string | undefined {
	const tagRegExp = new RegExp(`^\\[${tag}\\]`);
	return changelog?.versions?.find(v => tagRegExp.test(v.title))?.body.trim();
}

/**
 * Return today's date in a format that does not suck.
 *
 * @return today's date in YYYY-MM-DD format
 */
export function formatDate(date?: Date): string {
	const now = date ? date : new Date();
	const year = now.getFullYear();
	const monthDay = now
		.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" })
		.replace("/", "-");
	return `${year}-${monthDay}`;
}

/**
 * Modify changelog text to add release.
 *
 * @param changelog original changelog content
 * @param version release version
 * @return new changelog content
 */
export function changelogAddRelease(
	changelog: string,
	version: string,
): string {
	const releaseRegExp = new RegExp(`^## \\[${version}\\]`, "m");
	if (releaseRegExp.test(changelog)) {
		return changelog;
	}
	const date = formatDate();
	return changelog
		.replace(
			/^\[Unreleased\]:\s*(http.*\/compare)\/(\S+)\.{3}HEAD/m,
			`[Unreleased]: $1/${version}...HEAD

## [${version}][] - ${date}

[${version}]: $1/$2...${version}`,
		)
		.replace(
			/^##\s*\[Unreleased\]\((http.*\/compare)\/(\S+)\.{3}HEAD\)/m,
			`## [Unreleased]($1/${version}...HEAD)

## [${version}]($1/$2...${version}) - ${date}`,
		)
		.replace(
			/^##\s*\[Unreleased\]\((http.*)\/tree\/HEAD\)/m,
			`## [Unreleased]($1/compare/${version}...HEAD)

## [${version}]($1/tree/${version}) - ${date}`,
		);
}
