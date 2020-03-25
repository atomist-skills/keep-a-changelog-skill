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
import { upsertChangelogLabels } from "./ConvergePullRequestChangelogLabels";
import {
    apiUrl,
    gitHub,
} from "./github";
import { ConvergeIssueChangelogLabelsSubscription } from "./types";

export const handler: EventHandler<ConvergeIssueChangelogLabelsSubscription> = async ctx => {
    const repo = ctx.data.Issue[0].repo;
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
