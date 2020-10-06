# What it's useful for

With this skill you can automatically keep a changelog file in your repository up to date by using labels on GitHub
issues and pull requests as well as keywords in commit messages.

The changelog file follows the [Keep A Changelog](https://keepachangelog.com) conventions.

As a reference, this [`CHANGELOG.md`](https://github.com/atomist-skills/keep-a-changelog-skill/blob/master/CHANGELOG.md)
file is managed by this skill. Querying for the [list of issues and pull requests](https://github.com/atomist-skills/keep-a-changelog-skill/issues?q=-no%3Alabels)
demonstrates how we use labels to maintain the changelog.

Applying the `changelog:added` label to an issue or pull request will add a corresponding entry to the _Added_ section
of the changelog when the issue or pull request gets closed. _Keep A Changelog_ suggests the following categories of
entries which this skill supports via corresponding labels or commit markers:

-   `Added` for new features. (label: `changelog:added`, commit marker: `[changelog:added]`)
-   `Changed` for changes in existing functionality. (label: `changelog:changed`, commit marker: `[changelog:changed]`)
-   `Deprecated` for soon-to-be removed features. (label: `changelog:deprecated`, commit marker: `[changelog:deprecated]`)
-   `Removed` for now removed features. (label: `changelog:removed`, commit marker: `[changelog:removed]`)
-   `Fixed` for any bug fixes. (label: `changelog:fixed`, commit marker: `[changelog:fixed]`)
-   `Security` in case of vulnerabilities. (label: `changelog:security`, commit marker: `[changelog:security]`)

To mark an issue or pull request for one or more of those categories, apply the matching `changelog:*` labels to it.
Once this skill is enabled, the corresponding labels will be available on the selected repositories automatically.

Additionally, you can embed markers in your commit message to add a commit to the changelog. For example adding
`[changelog:removed]` to your commit message will add the commit to the changelog in the _Removed_ category:

```shell script
$ git commit -m "Remove build script
>
> [changelog:removed]"
[master 90d2ad2] Remove build script
 1 file changed, 1 insertion(+)
```

The changelog entries are added when issues get closed, pull requests get merged, or a commit is being pushed.
Those entries are kept in the _Unreleased_ section of the changelog until a GitHub Release is created.
The release will close the section in the changelog by adding the name of the release to it.

Optionally the skill will append the changelog to the body of the GitHub release.

Besides GitHub Releases, a changelog section can be closed by running a command from chat. In a channel that is linked
to one or more repositories, run the following command:

```shell script
> @atomist close changelog
```

# Before you get started

Connect and configure these integrations:

1. **GitHub**
2. **Slack or Microsoft Teams**

The **GitHub** integration must be configured in order to use this skill. At least one repository must be selected.
The **Slack** or **Microsoft Teams** integration is optional but can be useful to run commands to close changelog
sections.
