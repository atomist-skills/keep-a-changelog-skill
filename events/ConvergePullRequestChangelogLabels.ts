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
import { gitHubAppToken } from "@atomist/skill/lib/secrets";
import * as github from "@octokit/rest";
import { ChangelogLabels } from "./changelog/labels";
import {
    apiUrl,
    gitHub,
} from "./github";
import { ConvergePullRequestChangelogLabelsSubscription } from "./types";

export const handler: EventHandler<ConvergePullRequestChangelogLabelsSubscription> = async ctx => {
    const repo = ctx.data.PullRequest[0].repo;
    const { owner, name } = repo;
    const credentials = await ctx.credential.resolve(gitHubAppToken({ owner, repo: name }));

    const api = gitHub(credentials.token, apiUrl(repo));
    await upsertChangelogLabels({ api, owner, repo: name });
    return {
        code: 0,
        visibility: "hidden",
        reason: `Converged changelog labels`,
    };
};

/**
 * Information needed to check and create a label.
 */
export interface UpsertChangelogLabelsInfo {
    /** @octokit/rest API to use to query and create label. */
    api: github;
    /** Name of repository in which to create label */
    repo: string;
    /** Owner of repository in which to create label */
    owner: string;
}

export async function upsertChangelogLabels(info: UpsertChangelogLabelsInfo): Promise<void> {
    const labels: UpsertLabelInfo[] = ChangelogLabels.map(l => ({
        api: info.api,
        owner: info.owner,
        repo: info.repo,
        name: `changelog:${l}`,
        color: "C5DB71",
    }));
    labels.push({
        api: info.api,
        owner: info.owner,
        repo: info.repo,
        name: "breaking",
        color: "B60205",
    });
    await Promise.all(labels.map(upsertLabel));
}

/**
 * Information needed to check and create a label.
 */
interface UpsertLabelInfo extends UpsertChangelogLabelsInfo {
    /** Name of label to upsert */
    name: string;
    /** Color of label */
    color: string;
}

/**
 * Create a label if it does not exist.
 *
 * @param info label details
 */
async function upsertLabel(info: UpsertLabelInfo): Promise<void> {
    try {
        await info.api.issues.getLabel({
            name: info.name,
            repo: info.repo,
            owner: info.owner,
        });
    } catch (err) {
        await info.api.issues.createLabel({
            owner: info.owner,
            repo: info.repo,
            name: info.name,
            color: info.color,
        });
    }

}
