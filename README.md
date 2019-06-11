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

We use an in-repo addon to give ourselves the flexibility to add prember & fastboot later.

[Prember](https://github.com/ef4/prember) allows you to pre-render any list of URLs into static HTML files at build time using [Ember Fastboot](https://www.ember-fastboot.com/). Prember is recommended if you are trying to deploy an Ember-based static site using `broccoli-static-site-json`.

### Step 1

Generate the in-repo addon:

```bash
ember generate in-repo-addon content-generator
```

It will create a new directory `lib/content-generator` with two files: `index.json` and `package.json`.

### Step 2

Update the `index.js` file and add your `broccoli-static-site-json` implementation, then expose the resulting tree using the `treeForPublic` hook.

#### Example

```javascript
'use strict';

const StaticSiteJson = require('broccoli-static-site-json');

const contentsJson = new StaticSiteJson('content', {
  contentFolder: 'contents',
  collate: true,
});

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

**Note:** we need to add the `contentFolder: 'contents'` config because ember-data expects the folder name to be pluralised and broccoli-static-site-json does not do this by default.

### Step 3

Then in your Ember application, generate an application adapter:

```bash
ember generate adapter application
```

and update the contents to match the following example:

```javascript
import DS from 'ember-data';

export default DS.JSONAPIAdapter.extend({
  urlForFindAll(modelName) {
    const path = this.pathForType(modelName);
    return `/${path}/all.json`;
  },

  urlForFindRecord(id, modelName) {
    const path = this.pathForType(modelName);
    return `/${path}/${id}.json`;
  }
});
```

### Step 4

Now we need to generate a Model so that we can request the data in a route: 

```bash
ember generate model content
```

This `content` name matches the example we used above when using the `StaticSiteJson()` broccoli plugin.

No you are able to query your data in an Ember Route: 

```javascript
import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    return this.store.findAll('content');
  }
});
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

### Collate
If you want to have the ability to query all of your content at once you can do
that by **collating** content together in a collection. This will place all of
your markdown files into a single JSON:API document and can be used for
`findAll` queries. To turn on collation you just need to set the `collate`
attribute to `true`

```javascript
new StaticSiteJson(`content`, {
  collate: true,
})
```

* `collate`: Boolean - Default: false

### CollationFileName

If you have turned on collation by default BroccoliStaticSiteJson will  output
the collated documents with the file name `all.json`. If you want to be able to
edit this default output file you can set the `collationFileName`.

```javascript
new StaticSiteJson(`content`, {
  collate: true,
  collationFileName: 'articles.json'
})
```

* `collationFileName`: String - Default: `all.json`

### paginate

In most cases when you're using BroccoliStaticSiteJson you probably will not be
dealing with collections that are too large. But in some cases, for example a
blog, you want to be able to deal with collections of an arbitrary length and it
would be useful to paginate your collated collections. To enable pagination you
set `paginate` to be true in your options:

```javascript
new StaticSiteJson(`content`, {
  collate: true,
  paginate: true,
})
```

**Note:** `paginate` will do nothing if you haven't set `collate` to true.

This will produce a series of files in your output tree:

```
content/all.json
content/all-0.json
content/all-1.json
content/all-2.json
content/all-3.json
...
```

Each of these files makes use of the [JSON:API spec's pagination
meta](https://jsonapi.org/format/#fetching-pagination) and will have links
entries for `first`, `last`, `next`, and `prev` as appropriate.

**Note:** the contents of `content/all.json` and `content/all-0.json` are
**exactly** the same. This is provided for simplicity and backwards
compatibility when querying paginated collections.

### pageSize

By default, if you have turned on pagination, BroccoliStaticSiteJson will use a
page size of 10 entries per file. If you want to change the page size then you
can set the `pageSize` in the options:

```javascript
new StaticSiteJson(`content`, {
  collate: true,
  paginate: true,
  pageSize: 20,
})
```

Note: `pageSize` will do nothing if `paginate` is missing or set to false.

### paginateSortFunction

When paginating the order of the items in each page becomes very important, and
will be highly dependent on your specific use case. For example, if you are
using BroccoliStaticSiteJson for a blogging platform you will most likely want
to order the posts by date and from latest to oldest.

For this reason you can define a `paginateSortFunction()` that will be passed as
a compareFunction into
[Array.sort()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort).
The full list of items will be sorted before they are chunked into pages. Here
is a simplified example taken from what is used in
[empress-blog](https://github.com/empress/empress-blog) to sort posts by date:

```javascript
const contentTree = new StaticSiteJson('content', {
  attributes: ['date'], // this is simplified for the example
  collate: true,
  paginate: true,
  paginateSortFunction(a, b) {
    return b.date - a.date;
  }
});
```

**Note:** you can only sort based on attributes that have been defined in your
`attributes` parameter. `id` is always available and is the name of the file
by default.

Note: `paginateSortFunction()` does nothing if `paginate` is not true;

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


### Markdown rendering configuration

This plugin uses showdown to render markdown. right now we only support,
global configuration of showdown, please see https://github.com/showdownjs/showdown#options
for more details.
