# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/atomist-skills/changelog-skill/tree/HEAD)

### Added

-   Add changelog to GitHub release. [#10](https://github.com/atomist-skills/changelog-skill/issues/10)

### Changed

-   Close release on Release events. [d8f4aec](https://github.com/atomist-skills/changelog-skill/commit/d8f4aec3d4ca704a30ed4e94b1af5781307a2e71)
-   Changelog updates shouldn't be added for PRs that haven't merged. [#2](https://github.com/atomist-skills/changelog-skill/issues/2)

### Fixed

-   Don't add closed PRs to changelog. [dc5b172](https://github.com/atomist-skills/changelog-skill/commit/dc5b172bf6e1bd9bfeaf088c2baeb6ff425f0572)
-   Prevent release bodies to be updated multiple times. [ba4b9b8](https://github.com/atomist-skills/changelog-skill/commit/ba4b9b8b6a0ff63e24a78fa3c95742228d9db9cd)
