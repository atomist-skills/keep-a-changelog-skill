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

import { Contextual, HandlerStatus, secret, repository, git, github } from "@atomist/skill";
import * as fs from "fs-extra";
import { ChangelogConfiguration, DefaultFileName } from "../configuration";
import { readChangelog } from "./changelog";
import * as parseChangelog from "./changelogParser";

export async function closeChangelog(
    repo: { owner: string; name: string; apiUrl: string; url: string; branch: string },
    version: string,
    ctx: Contextual<any, any>,
    cfg: ChangelogConfiguration,
): Promise<HandlerStatus> {
    const credential = await ctx.credential.resolve(
        secret.gitHubAppToken({
            owner: repo.owner,
            repo: repo.name,
            apiUrl: repo.apiUrl,
        }),
    );
    const project = await ctx.project.clone(
        repository.gitHub({
            owner: repo.owner,
            repo: repo.name,
            credential,
        }),
    );

    const changelogPath = project.path(cfg?.file || DefaultFileName);

    await project.spawn("git", ["pull", "origin", repo.branch]);

    if (!(await fs.pathExists(changelogPath))) {
        return {
            code: 0,
            visibility: "hidden",
            reason: `No ${changelogPath} found in project`,
        };
    }

    try {
        const changelog = (await fs.readFile(changelogPath)).toString();
        const newChangelog = changelogAddRelease(changelog, version);
        if (newChangelog === changelog) {
            return {
                code: 0,
                visibility: "hidden",
                reason: `No changes to ${changelogPath} found in project`,
            };
        }
        await fs.writeFile(changelogPath, newChangelog);
    } catch (e) {
        console.error(`Failed to update changelog for release ${version}: ${e.message}`);
        return {
            code: 1,
            reason: `Failed to update ${changelogPath} for release ${version}`,
        };
    }
    await git.commit(
        project,
        `Changelog: add release ${version}

[atomist:generated]`,
    );
    await git.push(project);

    if (cfg?.addChangelogToRelease !== false) {
        const changelog = await readChangelog(changelogPath);
        const body = findVersionBody(version, changelog);
        if (body) {
            const api = github.api(project.id);
            try {
                const release = (
                    await api.repos.getReleaseByTag({
                        owner: project.id.owner,
                        repo: project.id.repo,
                        tag: version,
                    })
                ).data;
                if (!(release.body || "").includes(body)) {
                    const existingBody = release.body ? `${release.body.trim()}\n\n` : "";
                    await api.repos.updateRelease({
                        owner: project.id.owner,
                        repo: project.id.repo,
                        release_id: release.id,
                        body: `${existingBody}${body.trim()}`,
                    });
                }
            } catch (e) {
                // Release not found to update
            }
        }
    }

    return {
        code: 0,
        reason: `Updated changelog in [${repo.owner}/${repo.name}](${repo.url}) for release ${version}`,
    };
}

/** Find body of changelog version matching tag. */
export function findVersionBody(tag: string, changelog?: parseChangelog.Changelog): string | undefined {
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
    const monthDay = now.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" }).replace("/", "-");
    return `${year}-${monthDay}`;
}

/**
 * Modify changelog text to add release.
 *
 * @param changelog original changelog content
 * @param version release version
 * @return new changelog content
 */
export function changelogAddRelease(changelog: string, version: string): string {
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
