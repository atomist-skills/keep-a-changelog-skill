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

import { CommandHandler, log, prompt, repository, slack } from "@atomist/skill";

import { closeChangelog } from "../changelog/closeChangelog";
import { ChangelogConfiguration } from "../configuration";

export const handler: CommandHandler<ChangelogConfiguration> = async ctx => {
	const params = await prompt.configurationWithParameters<
		{ version: string },
		ChangelogConfiguration
	>(ctx, {
		version: {
			description: "Version to release in changelog",
		},
	});

	log.info("Obtaining linked repository");
	const repo = await repository.linkedRepository(ctx);
	if (!repo) {
		return {
			code: 1,
			reason: `No linked repository found`,
		};
	}

	log.info(`Closing changelog section for version '${params.version}'`);
	const result = await closeChangelog(
		{
			owner: repo.owner,
			name: repo.repo,
			branch: repo.branch,
			url: `https://github.com/${repo.owner}/${repo.repo}`,
			apiUrl: repo.apiUrl,
			channels: [ctx.trigger.source?.slack?.channel?.name],
		},
		params.version,
		ctx,
		ctx.configuration.find(c => c.name === params.configuration.name)
			?.parameters,
		true,
	);

	if (result.code === 0 && result.visibility !== "hidden") {
		await ctx.message.respond(
			slack.successMessage(
				"Changelog",
				`Successfully closed changelog section for version ${slack.codeLine(
					params.version,
				)}`,
				ctx,
			),
		);
	}

	return result;
};
