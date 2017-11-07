const Plugin = require('broccoli-plugin');
const { extname, join, dirname } = require('path');
const walkSync = require('walk-sync');
const yamlFront = require('yaml-front-matter');
const { Serializer } = require('jsonapi-serializer');
const yaml = require('js-yaml');
const {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} = require('fs');

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
    this.options = {
      folder,
      contentFolder: 'content',
      ...options,
    };
    Plugin.call(this, [folder], {
      annotation: options.annotation,
    });
  }

  build() {
    // build content folder if it doesnt exist
    if (!existsSync(join(this.outputPath, this.options.contentFolder))) {
      mkdirSync(join(this.outputPath, this.options.contentFolder));
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
    })).map(file => ({
      path: file.path,
      ...yamlFront.loadFront(file.content),
    }));

    if (!existsSync(join(this.outputPath, this.options.contentFolder))) {
      mkdirSync(join(this.outputPath, this.options.contentFolder));
    }

    fileData.forEach((file) => {
      const directory = dirname(join(this.outputPath, this.options.contentFolder, file.path));
      if (!existsSync(directory)) {
        mkdirSync(dirname(join(this.outputPath, this.options.contentFolder, file.path)));
      }

      const serialized = ContentSerializer.serialize(file);

      writeFileSync(join(this.outputPath, this.options.contentFolder, `${file.path}.json`), JSON.stringify(serialized));
    });
  }
}

module.exports = BroccoliStaticSiteJson;
