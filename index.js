const Plugin = require('broccoli-plugin');
const walkSync = require('walk-sync');
const yamlFront = require('yaml-front-matter');
const { Serializer } = require('jsonapi-serializer');
const yaml = require('js-yaml');
const mkdirp = require('mkdirp');
const assign = require('lodash.assign');

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

const ContentSerializer = new Serializer('content', {
  id: 'path',
  attributes: [
    '__content',
    'title',
  ],
  keyForAttribute(attr) {
    switch (attr) {
      case '__content':
        return 'content';
      default:
        return attr;
    }
  },
});

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

class BroccoliStaticSiteJson extends Plugin {
  constructor(folder, options) {
    // tell broccoli which "nodes" we're watching
    super([folder], options);

    this.options = assign({}, {
      folder,
      contentFolder: 'content',
    }, options);

    Plugin.call(this, [folder], {
      annotation: options.annotation,
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
    const paths = walkSync(this.inputPaths);

    const mdFiles = paths.filter(path => extname(path) === '.md');

    const fileData = mdFiles.map(path => ({
      path,
      content: readFileSync(join(this.options.folder, path)),
    })).map(file => assign({}, {
      path: file.path,
    }, yamlFront.loadFront(file.content)));

    if (!existsSync(join(this.outputPath, this.options.contentFolder))) {
      mkdirp.sync(join(this.outputPath, this.options.contentFolder));
    }

    fileData.forEach((file) => {
      const directory = dirname(join(this.outputPath, this.options.contentFolder, file.path));
      if (!existsSync(directory)) {
        mkdirp.sync(dirname(join(this.outputPath, this.options.contentFolder, file.path)));
      }

      const serialized = ContentSerializer.serialize(file);

      writeFileSync(join(this.outputPath, this.options.contentFolder, `${join(dirname(file.path), basename(file.path, '.md'))}.json`), JSON.stringify(serialized));
    });
  }
}

module.exports = BroccoliStaticSiteJson;
