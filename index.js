const _ = require('lodash');
const { Serializer } = require('jsonapi-serializer');
const mkdirp = require('mkdirp');
const Plugin = require('broccoli-plugin');
const yaml = require('js-yaml');
const { dirname, join } = require('path');
const {
  existsSync,
  readFileSync,
  writeFileSync,
} = require('fs');

const readMarkdownFolder = require('./lib/readMarkdownFolder');

const TableOfContentsSerializer = new Serializer('page', {
  id: 'url',
  attributes: [
    'title',
    'pages',
    'skip_toc',
  ],
  keyForAttribute: 'cammelcase',
});

function subpageUrls(parentUrl, currentPage, childPages) {
  if (currentPage && parentUrl) {
    // eslint-disable-next-line no-param-reassign
    currentPage.url = `${parentUrl}/${currentPage.url}`;
  }

  if (childPages) {
    childPages.forEach((page) => {
      subpageUrls(currentPage ? currentPage.url : null, page, page.pages);
    });
  }
}

const supportedContentTypes = ['content', 'html', 'description'];

class BroccoliStaticSiteJson extends Plugin {
  constructor(folder, options) {
    // tell broccoli which "nodes" we're watching
    super([folder], options);

    this.options = _.assign({}, {
      contentFolder: 'content',
      contentTypes: ['html', 'content'],
    }, options);

    const unsupportedContentTypes = _.difference(this.options.contentTypes, supportedContentTypes);

    if (unsupportedContentTypes.length) {
      throw new Error(`Unknown content type: ${unsupportedContentTypes[0]}`);
    }

    const serializerOptions = {
      attributes: _.union(
        this.options.contentTypes,
        ['title'],
        this.options.attributes
      ),
      keyForAttribute: 'camelCase',
    };

    if (this.options.references) {
      this.options.references.forEach((reference) => {
        serializerOptions[reference] = { ref: true };
      });

      serializerOptions.attributes = _.union(serializerOptions.attributes, this.options.references);
    }

    this.contentSerializer = new Serializer(this.options.type || folder, serializerOptions);

    Plugin.call(this, [folder], {
      annotation: this.options.annotation,
    });
  }

  build() {
    // build content folder if it doesnt exist
    if (!existsSync(join(this.outputPath, this.options.contentFolder))) {
      mkdirp.sync(join(this.outputPath, this.options.contentFolder));
    }

    // build pages file
    let pages;

    this.inputPaths.forEach((folder) => {
      if (existsSync(join(folder, 'pages.yml'))) {
        pages = yaml.safeLoad(readFileSync(join(folder, 'pages.yml'), 'utf8'));
      } else if (existsSync(join(folder, 'pages.json'))) {
        // eslint-disable-next-line
        pages = require(join(folder, 'pages.json'));
      }

      if (pages) {
        // add the parent id to each subpage
        subpageUrls(null, null, pages);

        writeFileSync(join(this.outputPath, this.options.contentFolder, 'pages.json'), JSON.stringify(TableOfContentsSerializer.serialize(pages)));
      }

      // build the tree of MD files
      const fileData = readMarkdownFolder(folder, this.options);

      if (!existsSync(join(this.outputPath, this.options.contentFolder))) {
        mkdirp.sync(join(this.outputPath, this.options.contentFolder));
      }

      fileData.forEach((file) => {
        const directory = dirname(join(this.outputPath, this.options.contentFolder, file.path));
        if (!existsSync(directory)) {
          mkdirp.sync(dirname(join(this.outputPath, this.options.contentFolder, file.path)));
        }

        const serialized = this.contentSerializer.serialize(file);

        writeFileSync(join(this.outputPath, this.options.contentFolder, `${file.id.toString()}.json`), JSON.stringify(serialized));
      });

      if (this.options.collections) {
        this.options.collections.forEach((collection) => {
          if (collection.src) {
            // eslint-disable-next-line no-console
            console.warn(`Collection with output ${collection.output}. Using 'collection.src' is deprecated. We now just use the input folder directly.`);
          }
          const collectionFileData = readMarkdownFolder(collection.src || folder, this.options);

          writeFileSync(
            join(this.outputPath, this.options.contentFolder, collection.output),
            JSON.stringify(this.contentSerializer.serialize(collectionFileData))
          );
        });
      }
    });
  }
}

module.exports = BroccoliStaticSiteJson;
