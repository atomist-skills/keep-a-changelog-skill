# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/atomist-skills/changelog-skill/compare/1.1.8...HEAD)

## [1.1.8](https://github.com/atomist-skills/changelog-skill/compare/1.1.7...1.1.8) - 2020-10-14

### Changed

-   Add repo slug to status messages. [#63](https://github.com/atomist-skills/keep-a-changelog-skill/issues/63)
-   Use skill name from context. [c5eef0e](https://github.com/atomist-skills/keep-a-changelog-skill/commit/c5eef0eedf84c1a5489bcedb4a1c5f3faba3b93b)
-   Remove single dispatch. [ac879b7](https://github.com/atomist-skills/keep-a-changelog-skill/commit/ac879b774bf4267338da29ad6b2631c3d5abca45)

## [1.1.7](https://github.com/atomist-skills/changelog-skill/compare/1.1.6...1.1.7) - 2020-09-22

### Added

-   Do not close changelog for prereleases or draft releases. [#57](https://github.com/atomist-skills/keep-a-changelog-skill/issues/57)

### Fixed

-   Use pr parameter when querying for a pr. [dacbcd7](https://github.com/atomist-skills/keep-a-changelog-skill/commit/dacbcd724003e29f2c85d9662780fa791379def2)

## [1.1.6](https://github.com/atomist-skills/changelog-skill/compare/1.1.5...1.1.6) - 2020-07-28

### Changed

-   Update category. [#25](https://github.com/atomist-skills/keep-a-changelog-skill/issues/25)

## [1.1.5](https://github.com/atomist-skills/changelog-skill/compare/1.1.4...1.1.5) - 2020-06-29

### Added

-   Add command to add entry to change log. [#21](https://github.com/atomist-skills/keep-a-changelog-skill/issues/21)

### Changed

-   Move to skill.ts. [0b79cf0](https://github.com/atomist-skills/keep-a-changelog-skill/commit/0b79cf0deabf4484f8da6e8a7176c1a4b5d61945)
-   Update description. [fb2b34a](https://github.com/atomist-skills/keep-a-changelog-skill/commit/fb2b34a81675ed853584fe55bcf778ba2c817e53)

### Fixed

-   Add changelog on branch or not at all. [#22](https://github.com/atomist-skills/keep-a-changelog-skill/issues/22)

## [1.1.4](https://github.com/atomist-skills/changelog-skill/compare/1.1.3...1.1.4) - 2020-06-18

### Fixed

-   Fix error when version not found. [67f968b](https://github.com/atomist-skills/keep-a-changelog-skill/commit/67f968b4a719f32c097c36c98b33fde543793c63)

## [1.1.3](https://github.com/atomist-skills/changelog-skill/compare/1.1.2...1.1.3) - 2020-06-18

### Added

-   Converge label descriptions. [e0c1aee](https://github.com/atomist-skills/keep-a-changelog-skill/commit/e0c1aeee005a30aad93496d8d8b0cb21c1325cb4)

### Fixed

-   Flexible release tag. [#20](https://github.com/atomist-skills/keep-a-changelog-skill/issues/20)

## [1.1.2](https://github.com/atomist-skills/changelog-skill/compare/1.1.1...1.1.2) - 2020-06-11

### Fixed

-   Fix invalid access to commit authors. [5f3987](https://github.com/atomist-skills/keep-a-changelog-skill/commit/5f3987c13f930df4f8272c647f1efd2ea0f7826f)

## [1.1.1](https://github.com/atomist-skills/changelog-skill/compare/1.1.0...1.1.1) - 2020-06-11

### Fixed

-   Preserve commit author information. [24b9088](https://github.com/atomist-skills/keep-a-changelog-skill/commit/24b9088c84ea15c149b7ede8ec0454a24564cb2b)

## [1.1.0](https://github.com/atomist-skills/changelog-skill/compare/1.0.3...1.1.0) - 2020-06-11

### Added

-   Add names to changelog entries. [65d9fc5](https://github.com/atomist-skills/keep-a-changelog-skill/commit/65d9fc52f1d9b2e537f959001351006f222bb44c)
-   Set git name and email before committing changelog entries. [87e72c7](https://github.com/atomist-skills/keep-a-changelog-skill/commit/87e72c789e5cf3ce939e9696998641b5660fdb7f)

## [1.0.3](https://github.com/atomist-skills/changelog-skill/compare/1.0.2...1.0.3) - 2020-06-07

## [1.0.2](https://github.com/atomist-skills/changelog-skill/compare/1.0.1...1.0.2) - 2020-06-06

### Added

-   Add link to example CHANGELOG.md file to README. [a793f8d](https://github.com/atomist-skills/keep-a-changelog-skill/commit/a793f8d49048e73963dc39ac848dfe6b22c3b486)

## [1.0.1](https://github.com/atomist-skills/changelog-skill/compare/1.0.0...1.0.1) - 2020-06-05

### Changed

-   Fix categories on skill. [#11](https://github.com/atomist-skills/keep-a-changelog-skill/issues/11)

## [1.0.0](https://github.com/atomist-skills/changelog-skill/tree/1.0.0) - 2020-06-04

### Added

-   Add changelog to GitHub release. [#10](https://github.com/atomist-skills/changelog-skill/issues/10)
-   Add command to close section. [#8](https://github.com/atomist-skills/keep-a-changelog-skill/issues/8)

### Changed

-   Close release on Release events. [d8f4aec](https://github.com/atomist-skills/changelog-skill/commit/d8f4aec3d4ca704a30ed4e94b1af5781307a2e71)
-   Changelog updates shouldn't be added for PRs that haven't merged. [#2](https://github.com/atomist-skills/changelog-skill/issues/2)

### Fixed

-   Don't add closed PRs to changelog. [dc5b172](https://github.com/atomist-skills/changelog-skill/commit/dc5b172bf6e1bd9bfeaf088c2baeb6ff425f0572)
-   Prevent release bodies to be updated multiple times. [ba4b9b8](https://github.com/atomist-skills/changelog-skill/commit/ba4b9b8b6a0ff63e24a78fa3c95742228d9db9cd)
