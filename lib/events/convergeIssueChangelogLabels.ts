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
	EventHandler,
	github,
	handleError,
	repository,
	secret,
	status,
} from "@atomist/skill";

import { ConvergeIssueChangelogLabelsSubscription } from "../typings/types";
import { upsertChangelogLabels } from "./convergePullRequestChangelogLabels";

export const handler: EventHandler<ConvergeIssueChangelogLabelsSubscription> =
	async ctx => {
		const repo = ctx.data.Issue[0].repo;
		const { owner, name } = repo;
		const credential = await ctx.credential.resolve(
			secret.gitHubAppToken({ owner, repo: name }),
		);

		const api = github.api(
			repository.gitHub({ owner, repo: name, credential }),
		);
		await handleError(
			async () => await upsertChangelogLabels({ api, owner, repo: name }),
		);
		return status.success(`Converged changelog labels`).hidden();
	};
