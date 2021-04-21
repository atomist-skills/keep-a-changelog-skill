# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/atomist-skills/changelog-skill/compare/1.5.3...HEAD)

## [1.5.3](https://github.com/atomist-skills/changelog-skill/compare/1.5.2...1.5.3) - 2021-04-21

### Changed

-   Update to new logging. [f03c934](https://github.com/atomist-skills/keep-a-changelog-skill/commit/f03c9344fdbad0285a8374faae0fab12a38fab49)

## [1.5.2](https://github.com/atomist-skills/changelog-skill/compare/1.5.1...1.5.2) - 2021-02-19

### Fixed

-   Clone all commits from push + 1. [d1d3c12](https://github.com/atomist-skills/keep-a-changelog-skill/commit/d1d3c122e0a522fa47550398d6500a4e033ffa6b)

## [1.5.1](https://github.com/atomist-skills/changelog-skill/compare/1.5.0...1.5.1) - 2021-02-19

### Changed

-   Retain non-changelog commits in push. [#165](https://github.com/atomist-skills/keep-a-changelog-skill/issues/165)

### Fixed

-   Clone with depth 2 to make sure that we can get the file diff. [9cb1c93](https://github.com/atomist-skills/keep-a-changelog-skill/commit/9cb1c935c22f3aa00516536703aa1aedaf3224db)

## [1.5.0](https://github.com/atomist-skills/changelog-skill/compare/1.4.1...1.5.0) - 2021-02-08

### Added

-   Add created as valid release action. [c5d12fe](https://github.com/atomist-skills/keep-a-changelog-skill/commit/c5d12fed72cc92d6e431ca143a5e557d7f16d7c1)

### Changed

-   Leverage git persistChanges in @atomist/skill. [#141](https://github.com/atomist-skills/keep-a-changelog-skill/issues/141)
-   Close release on released. [fb1862a](https://github.com/atomist-skills/keep-a-changelog-skill/commit/fb1862a9c6dc2ee7e045a0e72c0723c4e43dd75c)
-   Update issue query. [#156](https://github.com/atomist-skills/keep-a-changelog-skill/issues/156)

### Fixed

-   Prevent updates to changelog file to self-trigger. [82c179b](https://github.com/atomist-skills/keep-a-changelog-skill/commit/82c179bc8e2b6312f2c0d7ab790a9e885de8e1ca)

## [1.4.1](https://github.com/atomist-skills/changelog-skill/compare/1.4.0...1.4.1) - 2020-12-07

### Fixed

-   Do not create entries when releases are deleted. [#83](https://github.com/atomist-skills/keep-a-changelog-skill/issues/83)
-   Wrap label convergence in error handler. [f321735](https://github.com/atomist-skills/keep-a-changelog-skill/commit/f3217356fe4db9ca6af1c0d8ca41c279b54e516b)

## [1.4.0](https://github.com/atomist-skills/changelog-skill/compare/1.3.0...1.4.0) - 2020-11-24

### Added

-   Add release announcement. [d45b8b8](https://github.com/atomist-skills/keep-a-changelog-skill/commit/d45b8b8103d6aa6e858e1797af2a6c023a04ce93)

## [1.3.0](https://github.com/atomist-skills/changelog-skill/compare/1.2.0...1.3.0) - 2020-11-17

### Changed

-   Update skill icon. [1db56c5](https://github.com/atomist-skills/keep-a-changelog-skill/commit/1db56c54ff33462ecebe0376ffa2c68df89b94a7)
-   Use type generation from @atomist/skill. [c7e75bf](https://github.com/atomist-skills/keep-a-changelog-skill/commit/c7e75bfb6f4730e1ddbe31f49285965bb3e79ba2)

### Fixed

-   Fix package dependencies. [2d6a3ae](https://github.com/atomist-skills/keep-a-changelog-skill/commit/2d6a3ae2a186f33be70dbde20a52de66d2654922)

## [1.2.0](https://github.com/atomist-skills/changelog-skill/compare/1.1.8...1.2.0) - 2020-10-16

### Changed

-   Update skill category. [cacdd52](https://github.com/atomist-skills/keep-a-changelog-skill/commit/cacdd52e490c0424d7f50cc4c858e95a79891a2d)

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
