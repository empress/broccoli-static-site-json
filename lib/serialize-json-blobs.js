const Plugin = require('broccoli-plugin');
const {
  readFileSync,
  writeFileSync,
  mkdirSync,
} = require('fs');
const walkSync = require('walk-sync');
const { join } = require('path');
const _ = require('lodash');
const constructSerializer = require('./construct-serializer');

function preparePages(blobs, pageSize, pageSortFunction) {
  return _.chain(blobs)
    .tap((items) => {
      if (pageSortFunction) {
        return items.sort(pageSortFunction);
      }
      return items;
    })
    .chunk(pageSize)
    .value();
}

class SerializeJsonBlobs extends Plugin {
  constructor(inputNode, options = {}) {
    super([inputNode], options);
    this.options = _.assign({}, {
      contentFolder: 'content',
      contentTypes: ['html', 'content'],
      collationFileName: 'all.json',
      pageSize: 10,
    }, options);
    this.contentSerializer = constructSerializer(options);
  }

  build() {
    let blobs = [];
    this.inputPaths.forEach((inputPath) => {
      const paths = walkSync(inputPath);
      const folderConents = [];
      paths.forEach((path) => {
        if (path.endsWith('/')) {
          mkdirSync(join(this.outputPath, path));
          return;
        }
        const fileContent = readFileSync(join(inputPath, path)).toString();
        const deserializedFile = JSON.parse(fileContent);
        folderConents.push(deserializedFile);
        const jsonApiBlob = this.contentSerializer.serialize(deserializedFile);
        writeFileSync(join(this.outputPath, path), JSON.stringify(jsonApiBlob));
      });
      blobs = [...blobs, ...folderConents];
    });

    if (this.options.collate) {
      if (this.options.paginate) {
        const contentPages = preparePages(
          blobs,
          this.options.pageSize,
          this.options.paginateSortFunction,
        );
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
            join(this.outputPath, fileName),
            JSON.stringify(serializedPageData),
          );

          // also write the default collection name for the first page
          if (index === 0) {
            writeFileSync(
              join(this.outputPath, this.options.collationFileName),
              JSON.stringify(serializedPageData),
            );
          }
        });
      } else {
        const collection = this.contentSerializer.serialize(blobs);
        const outputFile = join(this.outputPath, this.options.collationFileName);
        writeFileSync(outputFile, JSON.stringify(collection));
      }
    }
  }
}

module.exports = SerializeJsonBlobs;
