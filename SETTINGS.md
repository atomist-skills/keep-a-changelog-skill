# How to configure

1. **Configure the name of the changelog file**

    ![Changelog name](docs/images/changelog-name.png)

    The default name of the changelog file in the repository is `CHANGELOG.md`
    in the root of the project. Use this setting to change the name and path.

2. **Add user names to changelog entries**

    Decide if you want to mention GitHub user names for committers and issue
    resolvers to be added to changelog entries.

3. **Determine repository scope**

    ![Repository filter](docs/images/repo-filter.png)

    By default, this skill will be enabled for all repositories in all
    organizations you have connected.

    To restrict the organizations or specific repositories on which the skill
    will run, you can explicitly choose organization(s) and repositories.

# How to keep a changelog

1. **Configure skill, set changelog file path**

2. **Add `changelog:*` labels to issues or pull requests or include changelog
   markers in your commits**

3. **Close issues or merge pull requests marked with `changelog:*` labels**

4. **Create a GitHub release to close a release in the changelog. Alternatively
   run `@atomist close changelog` from chat.**

5. **Enjoy not having to manually maintain a changelog file!**

To create feature requests or bug reports, create an
[issue in the repository for this skill](https://github.com/atomist-skills/keep-a-changlog-skill/issues).
See the [code](https://github.com/atomist-skills/keep-a-changlog-skill) for the
skill.
