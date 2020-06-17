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
import { closeChangelog } from "../changelog/closeChangelog";
import { ChangelogConfiguration } from "../configuration";
import { CloseChangeLogOnReleaseSubscription } from "../typings/types";

export const handler: EventHandler<CloseChangeLogOnReleaseSubscription, ChangelogConfiguration> = async ctx => {
    const release = ctx.data.Release[0];
    const tag = release.tag;
    const version = tag.name;

    return closeChangelog(
        {
            owner: tag.commit.repo.owner,
            name: tag.commit.repo.name,
            apiUrl: tag.commit.repo.org.provider.apiUrl,
            url: tag.commit.repo.url,
            branch: tag.commit.repo.defaultBranch,
        },
        version,
        ctx,
        ctx.configuration?.[0]?.parameters,
    );
};
