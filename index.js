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
      collationFileName: 'all.json',
      pageSize: 10,
    }, options);

    const unsupportedContentTypes = _.difference(this.options.contentTypes, supportedContentTypes);

    if (unsupportedContentTypes.length) {
      throw new Error(`Unknown content type: ${unsupportedContentTypes[0]}`);
    }

    if (options && options.collate && options.collections) {
      throw new Error('Defining `collections` and `collate` is not supported. Please just use `collate`');
    } else if (options && options.collections) {
      // eslint-disable-next-line no-console
      console.warn('Using `collection` is deprecated. Please use collate and collationFileName instead.');

      if (options.collections.length > 1) {
        // eslint-disable-next-line no-console
        console.warn('Multiple collections will be removed in the next major release.');
      }
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

      if (this.options.collate) {
        const collectionFileData = readMarkdownFolder(folder, this.options);

        if (this.options.paginate) {
          const contentPages = _.chain(collectionFileData)
            .tap((items) => {
              if (this.options.paginateSortFunction) {
                return items.sort(this.options.paginateSortFunction);
              }
              return items;
            })
            .chunk(this.options.pageSize)
            .value();

          contentPages.forEach((pageData, index) => {
            const serializedPageData = this.contentSerializer.serialize(pageData);
            let fileName;

            const fileNameMatch = this.options.collationFileName.match(/(.*)\.json$/);

            if (fileNameMatch) {
              fileName = `${fileNameMatch[1]}-${index}.json`;

              serializedPageData.links = {
                first: `/${this.options.contentFolder}/${fileNameMatch[1]}-0.json`,
                last: `/${this.options.contentFolder}/${fileNameMatch[1]}-${contentPages.length - 1}.json`,
                prev: index === 0 ? null : `/${this.options.contentFolder}/${fileNameMatch[1]}-${index - 1}.json`,
                next: index === contentPages.length - 1 ? null : `/${this.options.contentFolder}/${fileNameMatch[1]}-${index + 1}.json`,
              };
            } else {
              fileName = `${this.options.collationFileName}-${index}`;

              serializedPageData.links = {
                first: `/${this.options.contentFolder}/${fileNameMatch[1]}-0`,
                last: `/${this.options.contentFolder}/${fileNameMatch[1]}-${contentPages.length - 1}`,
                prev: index === 0 ? null : `/${this.options.contentFolder}/${fileNameMatch[1]}-${index - 1}`,
                next: index === contentPages.length - 1 ? null : `/${this.options.contentFolder}/${fileNameMatch[1]}-${index + 1}`,
              };
            }

            writeFileSync(
              join(this.outputPath, this.options.contentFolder, fileName),
              JSON.stringify(serializedPageData)
            );

            // also write the default collection name for the first page
            if (index === 0) {
              writeFileSync(
                join(this.outputPath, this.options.contentFolder, this.options.collationFileName),
                JSON.stringify(serializedPageData)
              );
            }
          });
        } else {
          writeFileSync(
            join(this.outputPath, this.options.contentFolder, this.options.collationFileName),
            JSON.stringify(this.contentSerializer.serialize(collectionFileData))
          );
        }
      }

      // TODO: deprecated - delete on next major release
      if (this.options.collections) {
        if (this.options.paginate) {
          throw new Error('Pagination is not supported with multiple collections. Please use `collate` if you want pagination.');
        }

        this.options.collections.forEach((collection) => {
          if (collection.src) {
            // eslint-disable-next-line no-console
            console.error(`Collection with output ${collection.output}. Using 'collection.src' is deprecated. We now just use the input folder directly.`);
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
