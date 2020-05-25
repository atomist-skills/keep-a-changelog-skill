import {
    ParameterType,
    skill,
} from "@atomist/skill/lib/skill";

export const Skill = skill({

    runtime: {
        memory: 1024,
        timeout: 60,
    },

    parameters: {
        file: {
            type: ParameterType.String,
            displayName: "Name of changelog file",
            description: "Relative path to the changelog file inside the repository (defaults to `CHANGELOG.md`)",
            placeHolder: "CHANGELOG.md",
            required: false,
        },
        repos: {
            type: ParameterType.RepoFilter,
            displayName: "Which repositories",
            required: false,
        },
    },

    subscriptions: [
        "file://graphql/subscription/*.graphql",
    ],

});
