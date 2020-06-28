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

import { EventHandler } from "@atomist/skill";
import { ClosedPullRequestWithChangelogLabelSubscription } from "../typings/types";
import { addChangelogEntryForClosedIssue } from "../changelog/changelog";

export const handler: EventHandler<ClosedPullRequestWithChangelogLabelSubscription> = async ctx => {
    if (ctx.data.PullRequest[0].merged) {
        return addChangelogEntryForClosedIssue(ctx.data, ctx, ctx.configuration[0].parameters);
    } else {
        return {
            visibility: "hidden",
            code: 0,
            reason: "Pull request closed but not merged. Ignoring...",
        };
    }
};
