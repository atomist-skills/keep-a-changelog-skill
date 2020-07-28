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
	Category,
	parameter,
	ParameterType,
	ParameterVisibility,
	resourceProvider,
	skill,
} from "@atomist/skill";
import { ChangelogConfiguration } from "./lib/configuration";

export const Skill = skill<ChangelogConfiguration>({
	name: "keep-a-changelog-skill",
	namespace: "atomist",
	displayName: "Keep a Changelog",
	author: "Atomist",
	license: "Apache-2.0",
	homepageUrl: "https://github.com/atomist-skills/keep-a-changelog-skill",
	repositoryUrl:
		"https://github.com/atomist-skills/keep-a-changelog-skill.git",
	iconUrl: "file://docs/images/icon.svg",
	categories: [Category.ProjectManagement],

	runtime: {
		memory: 1024,
		timeout: 60,
	},

	resourceProviders: {
		github: resourceProvider.gitHub({ minRequired: 1 }),
		slack: resourceProvider.chat({ minRequired: 0 }),
	},

	parameters: {
		file: {
			type: ParameterType.String,
			displayName: "Name of changelog file",
			description:
				"Relative path to the changelog file inside the repository (defaults to `CHANGELOG.md`)",
			placeHolder: "CHANGELOG.md",
			required: false,
		},
		addAuthor: {
			type: ParameterType.Boolean,
			displayName: "Include users in changelog",
			description:
				"Add names of commit authors and users that close issues to changelog",
			required: false,
		},
		addChangelogToRelease: {
			type: ParameterType.Boolean,
			displayName: "Add changelog to GitHub release",
			description:
				"When a changelog section gets closed, the changelog contents of the release will be added to a corresponding GitHub release",
			required: false,
		},
		mapAdded: {
			type: ParameterType.StringArray,
			displayName: "Map commits to Added",
			description:
				"Regular expressions to match against commit message to map into the _Added_ category",
			required: false,
			visibility: ParameterVisibility.Hidden,
		},
		mapChanged: {
			type: ParameterType.StringArray,
			displayName: "Map commits to Change",
			description:
				"Regular expressions to match against commit message to map into the _Changed_ category",
			required: false,
			visibility: ParameterVisibility.Hidden,
		},
		mapDeprecated: {
			type: ParameterType.StringArray,
			displayName: "Map commits to Deprecated",
			description:
				"Regular expressions to match against commit message to map into the _Deprecated_ category",
			required: false,
			visibility: ParameterVisibility.Hidden,
		},
		mapRemoved: {
			type: ParameterType.StringArray,
			displayName: "Map commits to Removed",
			description:
				"Regular expressions to match against commit message to map into the _Removed_ category",
			required: false,
			visibility: ParameterVisibility.Hidden,
		},
		mapFixed: {
			type: ParameterType.StringArray,
			displayName: "Map commits to Fixed",
			description:
				"Regular expressions to match against commit message to map into the _Fixed_ category",
			required: false,
			visibility: ParameterVisibility.Hidden,
		},
		mapSecurity: {
			type: ParameterType.StringArray,
			displayName: "Map commits to Security",
			description:
				"Regular expressions to match against commit message to map into the _Security_ category",
			required: false,
			visibility: ParameterVisibility.Hidden,
		},
		mapBreaking: {
			type: ParameterType.StringArray,
			displayName: "Map commits to Breaking",
			description:
				"Regular expressions to match against commit message to add BREAKING label to changelog entry",
			required: false,
			visibility: ParameterVisibility.Hidden,
		},
		repos: parameter.repoFilter(),
	},

	commands: [
		{
			name: "closeChangelog",
			displayName: "Close Changelog Section",
			description:
				"Closes the unreleased section of a changelog with a new release",
			pattern: /^close changelog.*$/,
		},
		{
			name: "addToChangelog",
			displayName: "Add to Changelog",
			description:
				"Adds a commit, issue or pull request to the changelog",
			pattern: /^add to changelog.*$/,
		},
	],

	subscriptions: ["file://graphql/subscription/*.graphql"],
});
