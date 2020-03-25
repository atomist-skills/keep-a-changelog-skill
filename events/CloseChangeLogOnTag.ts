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

import { EventHandler } from "@atomist/skill/lib/handler";
import { gitHubComRepository } from "@atomist/skill/lib/project";
import { gitHubAppToken } from "@atomist/skill/lib/secrets";
import { CloseChangeLogOnTagSubscription } from "./types";

export const handler: EventHandler<CloseChangeLogOnTagSubscription> = async ctx => {
    const tag = ctx.data.Tag[0];
    const version = tag.name;
    const versionRelease = releaseVersion(version);
    const branch = tag.commit.repo.defaultBranch;
    const remote = "origin";
    const changelogPath = "CHANGELOG.md";

    const credential = await ctx.credential.resolve(gitHubAppToken({
        owner: tag.commit.repo.owner,
        repo: tag.commit.repo.name,
        apiUrl: tag.commit.repo.org.provider.apiUrl,
    }));
    const project = await ctx.project.clone(gitHubComRepository({
        owner: tag.commit.repo.owner,
        repo: tag.commit.repo.name,
        credential,
    }));

    await project.spawn("git", ["pull", remote, branch]);

    if (!(await project.hasFile(changelogPath))) {
        return {
            code: 0,
            visibility: "hidden",
            reason: `No ${changelogPath} found in project`,
        };
    }

    try {
        const changelogFile = await project.getFile(changelogPath);
        const changelog = await changelogFile.getContent();
        const newChangelog = changelogAddRelease(changelog, versionRelease);
        if (newChangelog === changelog) {
            return {
                code: 0,
                visibility: "hidden",
                reason: `No changes to ${changelogPath} found in project`,
            };
        }
        await changelogFile.setContent(newChangelog);
    } catch (e) {
        console.error(`Failed to update changelog for release ${versionRelease}: ${e.message}`);
        return {
            code: 1,
            reason: `Failed to update ${changelogPath} for release ${versionRelease}`,
        };
    }
    await project.setUserConfig("Atomist Bot", "bot@atomist.com");
    await project.commit(`Changelog: add release ${versionRelease}

[atomist:generated]`);
    await project.push();

    return {
        code: 0,
        reason: `Updated changelog in [${tag.commit.repo.owner}/${tag.commit.repo.name}](${tag.commit.repo.url}) for release ${versionRelease}`,
    };
};

function releaseVersion(version: string): string {
    return version.replace(/-.*/, "");
}

/**
 * Return today's date in a format that does not suck.
 *
 * @return today's date in YYYY-MM-DD format
 */
export function formatDate(date?: Date): string {
    const now = (date) ? date : new Date();
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
    return changelog.replace(/^\[Unreleased\]:\s*(http.*\/compare)\/(\d+\.\d+\.\d+(?:-\S+)?)\.{3}HEAD/m,
        `[Unreleased]: \$1/${version}...HEAD

## [${version}][] - ${date}

[${version}]: \$1/\$2...${version}`)
        .replace(/^##\s*\[Unreleased\]\((http.*\/compare)\/(\d+\.\d+\.\d+(?:-\S+)?)\.{3}HEAD\)/m,
            `## [Unreleased](\$1/${version}...HEAD)

## [${version}](\$1/\$2...${version}) - ${date}`)
        .replace(/^##\s*\[Unreleased\]\((http.*)\/tree\/HEAD\)/m,
            `## [Unreleased](\$1/compare/${version}...HEAD)

## [${version}](\$1/tree/${version}) - ${date}`);
}
