# Broccoli Static Site JSON

Simple [Broccoli](https://github.com/broccolijs/broccoli) plugin that parses collections of markdown files and exposes
them as JSON in the output tree, under the specified paths.

It is used for the official [Ember guides](https://github.com/ember-learn/guides-source).

## Example Usage
```js
const StaticSiteJson = require('broccoli-static-site-json');

const jsonTree = new StaticSiteJson(
  'markdowns', {
    contentFolder: 'content'
    collections: [
      {
        src: 'guides',
        output: 'guides.json',
      }
    ],
    attributes: ['title', 'subtitle', 'index'],
  }
);
```

## Reference
### `new StaticSiteJson(folder, options)`
For the given `folder` (and all its sub-directories) it will look for all markdown
(`.md`) files and add them in the output tree after converting them in a JSON
resource, following [JSON:API](http://jsonapi.org/) spec.
It also supports [front matter](https://jekyllrb.com/docs/frontmatter/)
style of parameters which are also exposed as attributes in the same JSON.

* `folder`: A path to a directory, either absolute, or relative to the
  working directory (typically the directory containing `Brocfile.js`).

* `options`
  * `contentFolder`: The output folder, which will also be part of the
  path that will be used to retrieve the JSON resources.
  * `collections`: Collections is a convenient way of placing multiple
  markdown files (found under the same folder) in the same resource,
  effectively a collection of resources.
    * `src`: The folder of the markdown files intended for the same collection
    * `output`: The output sub-folder of the collection in the output tree,
    under the `contentFolder`.
  * `attributes`: The attributes found in the [front matter](https://jekyllrb.com/docs/frontmatter/) of the markdowns.
  By default, the plugin exposes the content of the markdown under `content` attribute
  and a `title`, placed in the [front matter](https://jekyllrb.com/docs/frontmatter/).

By default the plugin also looks for a `pages.yrml` (with a `url`, `title`, `skip_toc`
and a `pages` recursive object) that exposes it as a TOC under `pages.json` file inside
the specified `contentFolder`.
