const PersistentFilter = require('broccoli-persistent-filter');
const yamlFront = require('yaml-front-matter');
const showdown = require('showdown');
const _ = require('lodash');
const h2p = require('html2plaintext');
const { Serializer } = require('jsonapi-serializer');

const supportedContentTypes = ['content', 'html', 'description'];

class MarkDownToJsonApi extends PersistentFilter {
  constructor(folder, options) {
    super(folder, options);
    this.extensions = ['md', 'markdown'];
    this.targetExtension = 'json';
    this.options = {
      contentTypes: ['html', 'content'],
      type: 'content',
      attributes: [],
      references: [],
      ...options,
    };

    const unsupportedContentTypes = _.difference(this.options.contentTypes, supportedContentTypes);

    if (unsupportedContentTypes.length) {
      throw new Error(`Unknown content type: ${unsupportedContentTypes[0]}`);
    }

    this.converter = new showdown.Converter();

    // build serialiser for jsonapi
    const serializerOptions = {
      attributes: _.union(
        this.options.contentTypes,
        this.options.attributes,
        this.options.references,
      ),
      keyForAttribute: 'camelCase',
    };

    this.options.references.forEach((reference) => {
      serializerOptions[reference] = { ref: true };
    });

    this.serializer = new Serializer(this.options.type, serializerOptions);
  }

  processString(content, relativePath) {
    const front = yamlFront.loadFront(content);
    const markdown = front.__content.trim();

    const baseProperties = {
      path: relativePath,
      id: relativePath.replace(/\.(md|markdown)$/, ''),
      content: markdown,
      html: this.converter.makeHtml(markdown),
    };

    const resultHash = { ...baseProperties, ...front };

    if (!resultHash.description && _.includes(this.options.contentTypes, 'description')) {
      const description = _.truncate(h2p(resultHash.html), {
        length: 260,
        separator: /,?\.* +/,
      });

      resultHash.description = description;
    }

    return JSON.stringify(this.serializer.serialize(resultHash));
  }

  // eslint-disable-next-line class-methods-use-this
  getDestFilePath(relativePath) {
    if (relativePath.endsWith('.md') || relativePath.endsWith('.markdown')) {
      return `${relativePath.replace(/.(md|markdown)$/, '')}.json`;
    }
    return null;
  }
}

module.exports = MarkDownToJsonApi;
