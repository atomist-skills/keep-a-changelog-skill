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

import { CommandHandler } from "@atomist/skill/lib/handler";
import { slackSuccessMessage } from "@atomist/skill/lib/messages";
import { linkedRepository } from "@atomist/skill/lib/repository";
import { codeLine } from "@atomist/slack-messages";
import { closeChangelog } from "../changelog/closeChangelog";
import { ChangelogConfiguration } from "../configuration";

export const handler: CommandHandler<ChangelogConfiguration> = async ctx => {

    await ctx.audit.log("Checking configuration");
    const cfgs = ctx.configuration;
    const params = await ctx.parameters.prompt<{ configuration: string; version: string }>({
        configuration: {
            description: "Please select a Skill configuration",
            type: { kind: "single", options: cfgs.map(c => ({ value: c.name, description: c.name })) },
        },
        version: {
            description: "Version to release in changelog",
        },
    });
    await ctx.audit.log(`Configuration to invoke '${params.configuration}'`);

    await ctx.audit.log("Obtaining linked repository");
    const repository = await linkedRepository(ctx);
    if (!repository) {
        return {
            code: 1,
            reason: `No linked repository found`,
        };
    }

    await ctx.audit.log(`Closing changelog section for version '${params.version}'`);
    const result = await closeChangelog({
            owner: repository.owner,
            name: repository.repo,
            branch: repository.branch,
            url: `https://github.com/${repository.owner}/${repository.repo}`,
            apiUrl: repository.apiUrl,
        },
        params.version,
        ctx,
        ctx.configuration.find(c => c.name === params.configuration)?.parameters);

    if (result.code === 0 && result.visibility !== "hidden") {
        await ctx.message.respond(slackSuccessMessage(
            "Changelog",
            `Successfully closed changelog section for version ${codeLine(params.version)}`,
            ctx));
    }

    return result;
};
