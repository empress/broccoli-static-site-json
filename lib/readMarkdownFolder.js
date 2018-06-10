const showdown = require('showdown');
const walkSync = require('walk-sync');
const yamlFront = require('yaml-front-matter');
const h2p = require('html2plaintext');
const _ = require('lodash');

const {
  extname,
  join,
} = require('path');
const {
  readFileSync,
  statSync,
} = require('fs');

const converter = new showdown.Converter();

module.exports = function readMarkdownFolder(src, options) {
  // build the tree of MD files
  const paths = walkSync(src);

  const mdFiles = paths.filter(path => extname(path) === '.md');

  return mdFiles
    .map((path) => {
      const filePath = join(options.folder, path);
      const content = readFileSync(filePath);
      const { birthtime, mtime } = statSync(filePath);
      return {
        birthtime,
        content,
        mtime,
        path,
      };
    })
    .map((file) => {
      const front = yamlFront.loadFront(file.content);
      const { birthtime, mtime, path } = file;

      return _.assign({}, {
        birthtime,
        mtime,
        path,
        id: path.replace(/.md$/, ''),
        content: front.__content,
      }, front);
    })
    .map(file => _.assign(file, {
      html: converter.makeHtml(file.content),
    }))
    .map((file) => {
      // existing description takes precedent
      // only build description if it has been defined in content types
      if (file.description || !options.contentTypes.includes('description')) {
        return file;
      }

      const description = _.truncate(h2p(file.html), {
        length: 260,
        separator: /,?\.* +/,
      });
      return _.assign(file, {
        description,
      });
    });
};
