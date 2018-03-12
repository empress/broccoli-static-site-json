const Plugin = require('broccoli-plugin');
const walkSync = require('walk-sync');
const yamlFront = require('yaml-front-matter');
const { Serializer } = require('jsonapi-serializer');
const yaml = require('js-yaml');
const mkdirp = require('mkdirp');
const assign = require('lodash.assign');
const _ = require('lodash');
const showdown = require('showdown');
const dasherize = require('dasherize');

const converter = new showdown.Converter();

const {
  existsSync,
  readFileSync,
  writeFileSync,
} = require('fs');

const {
  basename,
  dirname,
  extname,
  join,
} = require('path');

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

function readMarkdownFolder(src, options) {
  // build the tree of MD files
  const paths = walkSync(src);

  const mdFiles = paths.filter(path => extname(path) === '.md');

  return mdFiles
    .map(path => ({
      path,
      content: readFileSync(join(options.folder, path)),
    }))
    .map(file => assign({}, {
      path: file.path,
      id: file.path.replace(/.md$/, ''),
    }, yamlFront.loadFront(file.content)))
    .map(file => assign(file, {
      html: converter.makeHtml(file.__content),
    }));
}

class BroccoliStaticSiteJson extends Plugin {
  constructor(folder, options) {
    // tell broccoli which "nodes" we're watching
    super([folder], options);

    this.options = assign({}, {
      folder,
      contentFolder: 'content',
    }, options);

    const serializerOptions = {
      attributes: _.union([
        '__content',
        'html',
        'title'], this.options.attributes),
      keyForAttribute(attr) {
        switch (attr) {
          case '__content':
            return 'content';
          default:
            return dasherize(_.camelCase(attr));
        }
      },
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

    if (existsSync(join(this.options.folder, 'pages.yml'))) {
      pages = yaml.safeLoad(readFileSync(join(this.options.folder, 'pages.yml'), 'utf8'));
    } else if (existsSync(join(this.options.folder, 'pages.json'))) {
      // eslint-disable-next-line
      pages = require(join(this.options.folder, 'pages.json'));
    }

    if (pages) {
      // add the parent id to each subpage
      subpageUrls(null, null, pages);

      writeFileSync(join(this.outputPath, this.options.contentFolder, 'pages.json'), JSON.stringify(TableOfContentsSerializer.serialize(pages)));
    }

    // build the tree of MD files
    const fileData = readMarkdownFolder(this.options.folder, this.options);

    if (!existsSync(join(this.outputPath, this.options.contentFolder))) {
      mkdirp.sync(join(this.outputPath, this.options.contentFolder));
    }

    fileData.forEach((file) => {
      const directory = dirname(join(this.outputPath, this.options.contentFolder, file.path));
      if (!existsSync(directory)) {
        mkdirp.sync(dirname(join(this.outputPath, this.options.contentFolder, file.path)));
      }

      const serialized = this.contentSerializer.serialize(file);

      writeFileSync(join(this.outputPath, this.options.contentFolder, `${join(dirname(file.path), basename(file.path, '.md'))}.json`), JSON.stringify(serialized));
    });

    if (this.options.collections) {
      this.options.collections.forEach((collection) => {
        const collectionFileData = readMarkdownFolder(collection.src, this.options);

        writeFileSync(
          join(this.outputPath, this.options.contentFolder, collection.output),
          JSON.stringify(this.contentSerializer.serialize(collectionFileData))
        );
      });
    }
  }
}

module.exports = BroccoliStaticSiteJson;
