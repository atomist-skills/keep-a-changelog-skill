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

import { CommandHandler, repository, slack } from "@atomist/skill";
import { codeLine } from "@atomist/slack-messages";
import { addChangelogEntryForClosedIssue, addChangelogEntryForCommit } from "../changelog/changelog";
import { ChangelogConfiguration } from "../configuration";
import {
    CommitByShaQuery,
    CommitByShaQueryVariables,
    IssueByNumberQuery,
    IssueByNumberQueryVariables,
    PullRequestByNumberQuery,
    PullRequestByNumberQueryVariables,
} from "../typings/types";

export const handler: CommandHandler<ChangelogConfiguration> = async ctx => {
    await ctx.audit.log("Checking configuration");
    const cfgs = ctx.configuration;
    const params = await ctx.parameters.prompt<{
        configuration: string;
        sha: string;
        issue: string;
        pr: string;
        category: string;
    }>({
        configuration: {
            description: "Please select a Skill configuration",
            type: { kind: "single", options: cfgs.map(c => ({ value: c.name, description: c.name })) },
        },
        sha: {
            description: "SHA of commit to add to changelog",
            required: false,
        },
        issue: {
            description: "Number of issue to add to changelog",
            required: false,
        },
        pr: {
            description: "Number of pull request to add to changelog",
            required: false,
        },
        category: {
            description: "Category to add entry to",
            required: true,
            type: {
                kind: "single",
                options: [
                    {
                        description: "Added",
                        value: "added",
                    },
                    {
                        description: "Changed",
                        value: "changed",
                    },
                    {
                        description: "Deprecated",
                        value: "deprecated",
                    },
                    {
                        description: "Removed",
                        value: "removed",
                    },
                    {
                        description: "Fixed",
                        value: "fixed",
                    },
                    {
                        description: "Security",
                        value: "security",
                    },
                ],
            },
        },
    });
    await ctx.audit.log(`Configuration to invoke '${params.configuration}'`);
    const cfg = cfgs.find(c => c.name === params.configuration);

    await ctx.audit.log("Obtaining linked repository");
    const repo = await repository.linkedRepository(ctx);
    if (!repo) {
        return {
            code: 1,
            reason: `No linked repository found`,
        };
    }

    let result;
    if (params.sha) {
        const commit = await ctx.graphql.query<CommitByShaQuery, CommitByShaQueryVariables>("commitBySha.graphql", {
            owner: repo.owner,
            repo: repo.repo,
            sha: params.sha,
        });
        if (commit.Commit?.[0]?.sha) {
            commit.Commit[0].message = `${commit.Commit[0].message ? commit.Commit[0].message : ""}\n\n[changelog:${
                params.category
            }]`;
            result = await addChangelogEntryForCommit(
                { branch: undefined, commits: commit.Commit, repo: commit.Commit[0].repo },
                ctx,
                cfg.parameters,
            );
            if (result.code === 0 && result.visibility !== "hidden") {
                await ctx.message.respond(
                    slack.successMessage(
                        "Changelog",
                        `Successfully added commit ${codeLine(params.sha.slice(0, 7))} to changelog`,
                        ctx,
                    ),
                );
            }
        }
    }
    if (params.issue) {
        const issue = await ctx.graphql.query<IssueByNumberQuery, IssueByNumberQueryVariables>(
            "issueByNumber.graphql",
            {
                owner: repo.owner,
                repo: repo.repo,
                number: +params.issue,
            },
        );
        if (issue.Issue?.[0]?.number) {
            issue.Issue[0].labels = [{ name: `changelog:${params.category}` }];
            result = await addChangelogEntryForClosedIssue({ Issue: issue.Issue }, ctx, cfg.parameters);
            if (result.code === 0 && result.visibility !== "hidden") {
                await ctx.message.respond(
                    slack.successMessage(
                        "Changelog",
                        `Successfully added issue ${codeLine(params.issue)} to changelog`,
                        ctx,
                    ),
                );
            }
        }
    }
    if (params.pr) {
        const pr = await ctx.graphql.query<PullRequestByNumberQuery, PullRequestByNumberQueryVariables>(
            "pullRequestByNumber.graphql",
            {
                owner: repo.owner,
                repo: repo.repo,
                number: +params.issue,
            },
        );
        if (pr.PullRequest?.[0]?.number) {
            pr.PullRequest[0].labels = [{ name: `changelog:${params.category}` }];
            result = await addChangelogEntryForClosedIssue({ PullRequest: pr.PullRequest }, ctx, cfg.parameters);
            if (result.code === 0 && result.visibility !== "hidden") {
                await ctx.message.respond(
                    slack.successMessage(
                        "Changelog",
                        `Successfully added pull request ${codeLine(params.issue)} to changelog`,
                        ctx,
                    ),
                );
            }
        }
    }

    return result;
};
