const { Serializer } = require('jsonapi-serializer');
const yaml = require('js-yaml');
const { join } = require('path');
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


class TableOfContentsExtractor {
  constructor(inputPath, outputPath) {
    this.folder = inputPath;
    this.outputFile = outputPath;
  }


  build() {
    // build pages file
    let pages;
    if (existsSync(join(this.folder, 'pages.yml'))) {
      pages = yaml.safeLoad(readFileSync(join(this.folder, 'pages.yml'), 'utf8'));
    } else if (existsSync(join(this.folder, 'pages.json'))) {
      // eslint-disable-next-line
      pages = require(join(this.folder, 'pages.json'));
    }

    if (pages) {
      // add the parent id to each subpage
      subpageUrls(null, null, pages);

      writeFileSync(this.outputFile, JSON.stringify(TableOfContentsSerializer.serialize(pages)));
    }
  }
}

module.exports = TableOfContentsExtractor;
