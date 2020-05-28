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

import {
    ParameterType,
    skill,
} from "@atomist/skill/lib/skill";

export const Skill = skill({

    runtime: {
        memory: 1024,
        timeout: 60,
    },

    resourceProviders: {
        github: {
            typeName: "GitHubAppResourceProvider",
            description: "GitHub",
            minRequired: 1,
        },
        slack: {
            typeName: "SlackResourceProvider",
            description: "Slack",
            minRequired: 0,
        }
    },

    parameters: {
        file: {
            type: ParameterType.String,
            displayName: "Name of changelog file",
            description: "Relative path to the changelog file inside the repository (defaults to `CHANGELOG.md`)",
            placeHolder: "CHANGELOG.md",
            required: false,
        },
        mapAdded: {
            type: ParameterType.StringArray,
            displayName: "Map commits to Added",
            description: "Regular expressions to match against commit message to map into the _Added_ category",
            required: false,
        },
        mapChanged: {
            type: ParameterType.StringArray,
            displayName: "Map commits to Change",
            description: "Regular expressions to match against commit message to map into the _Changed_ category",
            required: false,
        },
        mapDeprecated: {
            type: ParameterType.StringArray,
            displayName: "Map commits to Deprecated",
            description: "Regular expressions to match against commit message to map into the _Deprecated_ category",
            required: false,
        },
        mapRemoved: {
            type: ParameterType.StringArray,
            displayName: "Map commits to Removed",
            description: "Regular expressions to match against commit message to map into the _Removed_ category",
            required: false,
        },
        mapFixed: {
            type: ParameterType.StringArray,
            displayName: "Map commits to Fixed",
            description: "Regular expressions to match against commit message to map into the _Fixed_ category",
            required: false,
        },
        mapSecurity: {
            type: ParameterType.StringArray,
            displayName: "Map commits to Security",
            description: "Regular expressions to match against commit message to map into the _Security_ category",
            required: false,
        },
        mapBreaking: {
            type: ParameterType.StringArray,
            displayName: "Map commits to Breaking",
            description: "Regular expressions to match against commit message to add BREAKING label to changelog entry",
            required: false,
        },
        repos: {
            type: ParameterType.RepoFilter,
            displayName: "Which repositories",
            description: "",
            required: false,
        },
    },

    subscriptions: [
        "file://graphql/subscription/*.graphql",
    ],

});
