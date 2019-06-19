const PersistentFilter = require('broccoli-persistent-filter');
const yamlFront = require('yaml-front-matter');
const showdown = require('showdown');
const _ = require('lodash');
const h2p = require('html2plaintext');

let currentId = null;
class MarkDownToJsonApi extends PersistentFilter {
  constructor(folder, options) {
    super(folder, options);
    this.extensions = ['md', 'markdown'];
    this.targetExtension = 'json';
    this.options = options;
    this.converter = new showdown.Converter();
  }

  processString(content, relativePath) {
    const front = yamlFront.loadFront(content);
    const markdown = front.__content.trim();
    const baseProperties = {
      path: relativePath,
      id: relativePath.replace(/.md$/, ''),
      content: markdown,
      html: this.converter.makeHtml(markdown),
    };

    const resultHash = { ...baseProperties, ...front };
    if (!resultHash.description && (this.options.contentTypes || []).includes('description')) {
      const description = _.truncate(h2p(resultHash.html), {
        length: 260,
        separator: /,?\.* +/,
      });
      resultHash.description = description;
    }

    // dirty hack, funnel works serialy so should be safe
    // https://github.com/broccolijs/broccoli-filter/blob/8ec98ed974119c7e7da19db76f37a78e0642b077/index.js#L63
    currentId = resultHash.id;
    return JSON.stringify(resultHash);
  }

  // eslint-disable-next-line class-methods-use-this
  getDestFilePath(relativePath) {
    if (relativePath.endsWith('.md') || relativePath.endsWith('.markdown')) {
      return `${currentId}.json`;
    }
    return null;
  }
}

module.exports = MarkDownToJsonApi;
