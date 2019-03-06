# Broccoli Static Site JSON

A Simple [Broccoli](https://github.com/broccolijs/broccoli) plugin that parses collections of markdown
files and exposes them as [JSON:API](http://jsonapi.org/) documents in the output tree, under the
specified paths. It also supports the use of
[front-matter](https://www.npmjs.com/package/front-matter) to define meta-data for each markdown
file.

It is used for the following official Ember Documentation projects:
- [Ember Guides App](https://github.com/ember-learn/guides-app)
- [Ember Deprecations App](https://github.com/ember-learn/deprecation-app)

## Basic Usage

`const jsonTree = new StaticSiteJson(folder)`

The most basic use, of this Broccoli plugin, is to generate a tree of JSON files from a folder filled
with markdown files. The most common usage would be to call `StaticSiteJson` on a `content` folder
like this: `const contentJsonTree = new StaticSiteJson('content')`.

Important notes about default behaviour:
- The name of the folder will be the default `type` for the JSON:API document.
- The type will automatically be pluralized, so if you use the above `content` folder the type will
be `contents`.
- Using front-matter you can define the `ID` or the `Title` attribute of the content. Any other
attributes must be defined in configuration.

By default the plugin also looks for a `pages.yml` that exposes it as a JSON:API document named
`pages.json` in the output path. As the name suggests, this JSON file is quite useful to build a
Table of Contents in the consuming application.

## How to integrate into an Ember app

The simplest way to integrate this into your Ember Application is to create the `StaticSiteJson` tree
and merge it into your Ember app tree as follows:

```javascript
'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const BroccoliMergeTrees = require('broccoli-merge-trees');
const StaticSiteJson = require('broccoli-static-site-json');

module.exports = function(defaults) {
  let app = new EmberApp(defaults, {
    // Add options here
  });

  let contentsJson = new StaticSiteJson('content');

  return new BroccoliMergeTrees([app.toTree(), contentsJson]);
};
```

To see a more in-depth implementation using an in-repo addon check out the [Ember Guides
App](https://github.com/ember-learn/guides-app).

## Using with Ember Fastboot and Prember

[Prember](https://github.com/ef4/prember) allows you to pre-render any list of URLs into static HTML files at build time using [Ember Fastboot](https://www.ember-fastboot.com/). Prember is recommended if you are trying to deploy an Ember-based static site using `broccoli-static-site-json`.

If you would like to use `broccoli-static-site-json` with Prember you must make sure that your static json tree is available to the Ember app at build time. The only way to do this is to build the `broccoli-static-site-json` tree in an **Ember Addon** and make sure it is exposed via the `treeForPublic()` hook of that addon. The quickest and easiest way to start working with an Ember addon would be to create an in-repo addon. To create an in-repo addon first run

```bash
ember generate in-repo-addon your-addon-name
```

It will create a new directory `lib/your-addon-name` with two files: `index.json` and `package.json`.

You should update the `index.json` file and add your `broccoli-static-site-json` implementation, then you should expose the resulting tree using the `treeForPublic` hook. You can see an example of how to do this below:

```javascript
'use strict';

const StaticSiteJson = require('broccoli-static-site-json');

const contentsJson = new StaticSiteJson('content');

module.exports = {
  name: require('./package').name,

  isDevelopingAddon() {
    return true;
  },

  treeForPublic() {
    return contentsJson;
  }
};
```

## Detailed documentation

### Attributes

By default this plugin assumes the only attribute available on the front-matter is `title`. You
can configure what attributes you want exposed in the JSON:API output by simply adding the
`attributes` config value as follows:

```javascript
const jsonTree = new StaticSiteJson('content', {
  attributes: ['title', 'subtitle', 'index'],
});
```

### Type

By default this plugin will use the name of the folder that you're building as the _JSON:API type_ for example if you had the following configuration:

```javascript
const jsonTree = new StaticSiteJson('author');
```

it would load the markdown in the folder `author` and each JSON:API document would have a type of `authors`.

If you want to specify the type directly you can in the options:

```javascript
const jsonTree = new StaticSiteJson('really-strange_placeToPut_some_FILES', {
  type: 'author'
});
```

**Note:** just like the folder example the type will be automatically pluralised.

### Collections

Collections are a convenient way of placing multiple markdown files (found under the same folder) in
a single JSON:API document. This can be used when wanting to retrieve multiple documents at any one
time (`findAll`).

```javascript
new StaticSiteJson(`content`, {
  collections: [{
    output: `allContent.json`,
  }]
})
```

* `options`
  * `output`: The output file name of the collection JSON:API document.

### Relationships

One of the things that differentiates this Broccoli Plugin from some of the other approaches of
accessing Markdown, from an Ember application, is that because we are generating JSON:API compatible
JSON files we are able to make use of real relationships.

To define a relationship you just need to provide a `references` configuration to the `StaticSiteJson`
options, which works in the same way as attributes. The only difference is that front-matter value
for a reference is added to the relationships definition of the JSON:API document.

```javascript
const jsonTree = new StaticSiteJson('content', {
  references: ['author'],
});
```

### Content types

By default this plugin ouputs the Markdown in two formats: the original contents of the Markdown
file, under the `content` attribute, and an HTML version of the file under the attribute `html`. If you
do not need the original Markdown in production then you can remove it from the output by
specifying the content types:

```javascript
const jsonTree = new StaticSiteJson('content', {
  contentTypes: ['html'],
});
```

#### Available content types

- `content` - _default_
  - Contains the full contents of the Markdown file
- `html` - _default_
  - Contains a simple html representation of the Markdown file
- `description` - _optional_
  - Contains the first 260 characters of the content of the file
