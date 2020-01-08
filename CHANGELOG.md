
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
