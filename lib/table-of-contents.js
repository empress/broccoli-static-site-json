const { Serializer } = require('jsonapi-serializer');
const yaml = require('js-yaml');
const { join } = require('path');
const Plugin = require('broccoli-plugin');
const {
  existsSync,
  readFileSync,
  writeFileSync,
} = require('fs');

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

class TableOfContentsExtractor extends Plugin {
  build() {
    this.inputPaths.forEach((folder) => {
      let pages;
      if (existsSync(join(folder, 'pages.yml'))) {
        pages = yaml.safeLoad(readFileSync(join(folder, 'pages.yml'), 'utf8'));
      } else if (existsSync(join(folder, 'pages.json'))) {
        // eslint-disable-next-line
        pages = require(join(folder, 'pages.json'));
      }
      if (pages) {
        // add the parent id to each subpage
        subpageUrls(null, null, pages);

        writeFileSync(join(this.outputPath, 'pages.json'), JSON.stringify(TableOfContentsSerializer.serialize(pages)));
      }
    });
  }
}

module.exports = TableOfContentsExtractor;
