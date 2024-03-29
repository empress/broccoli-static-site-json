# Changelog

## Release (2024-02-07)

broccoli-static-site-json 5.0.0 (major)

#### :boom: Breaking Change
* `broccoli-static-site-json`
  * [#75](https://github.com/empress/broccoli-static-site-json/pull/75) drop support for node < 16 ([@mansona](https://github.com/mansona))

#### :rocket: Enhancement
* `broccoli-static-site-json`
  * [#76](https://github.com/empress/broccoli-static-site-json/pull/76) update showdown and jsdom ([@mansona](https://github.com/mansona))

#### :house: Internal
* `broccoli-static-site-json`
  * [#73](https://github.com/empress/broccoli-static-site-json/pull/73) start using release-plan ([@mansona](https://github.com/mansona))

#### Committers: 1
- Chris Manson ([@mansona](https://github.com/mansona))

v4.5.0 / 2023-06-30
==================
* don't find headers in code blocks for the on-this-page #71 from @mansona
* Support toc yaml #64 from @mansona

v4.4.1 / 2021-09-25
==================
* add documentation for `toc` content type #63 from @mansona

v4.4.0 / 2021-09-25
==================
* [FEATURE] Add Markdown Headers to JSON:API output #60 from @mansona
* Update dependencies #62 from @mansona
* Add Mocha test linting #61 from @mansona
* simplify markdown-to-jsonapi test #59 from @mansona
* remove changelog preview and update scripts #58 from @mansona
* move from travis to github actions #57 from @mansona
* Update README.md #56 from @MelSumner

v4.3.0 / 2021-03-05
==================
  * Stop erroring with missing folder #53 from @mansona

4.2.1 / 2020-05-27
==================

  * Update docs to include new custom type relationship #45 from @jaredgalanis

4.2.0 / 2020-05-22
==================

  * Adds support for custom relationship types #42 from @jaredgalanis
  * Fix typo in the README #41 from @Turbo87

4.1.0 / 2020-01-09
==================

  * Updating all dependencies #39 from @mansona

4.0.0 / 2020-01-08
==================
  * turn off collation functionality if it is not configured from @mansona
  * Simplify refactor by removing some functionality #31 from @mansona
  * Refactor codebase to be comprised of many smaller broccoli plugins #32 from @billybonks
  * Remove support for node 6 and 8
  * Remove deprecations from 3.x releases

4.0.0-1 / 2020-01-08
==================
  * turn off collation functionality if it is not configured from @mansona

4.0.0-0 / 2020-01-08
==================

  * Simplify refactor by removing some functionality #31 from @mansona
  * Refactor codebase to be comprised of many smaller broccoli plugins #32 from @billybonks
  * Remove support for node 6 and 8
  * Remove deprecations from 3.x releases

3.4.0 / 2019-12-21
==================

  * Add `is_heading` parameter to ToC items from @pzuraq

3.3.2 / 2019-06-13
==================

  * bumping dependencies
  * Merge pull request #28 from @mansona
  * Simplify the Ember App instructions

3.3.1 / 2019-05-10
==================

  * Allowing showdown to use global configuration correctly #27 from @billybonks
  * Adding testing in Windows #26 from @mansona
  * Add full docs on how to use this effectively with Ember #25 from @MelSumner
  * Adding an extra test for collate functionality #24 from @MelSumner

3.3.0 / 2019-04-11
==================

  * Implementing Pagination #21 from @mansona
  * deprecating `collections` in favour of `collate` #21 from @mansona

3.2.1 / 2019-04-03
==================

  * fixing newline prefix on content attribute from @mansona
  * fixing readme rendering #22 from @efx

3.2.0 / 2019-02-19
==================

  * deprecating collections.src #20 from @mansona
  * adding tests for collections
  * adding test for broccoli plugin as an input
  * documentation: adding docs for `type` attribute

3.1.0 / 2019-02-05
==================

  * properly supporting input nodes instead of just "folders" #19 from @mansona
  * fix example usage #18 from @efx

3.0.0 / 2019-01-03
==================

Breaking change:
  * [Bugfix] fixing issue where generated file name is not the id
    * While this is really a bugfix relase, the side-effect of the release will be a change to the location of some of the files. As this file location constitutes some people's **public APIs** it requires this to be a Major Version bump
