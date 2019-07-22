const { Serializer } = require('jsonapi-serializer');
const _ = require('lodash');

module.exports = function constructSerializer(configuration, folder) {
  const options = _.assign({}, {
    contentFolder: 'content',
    contentTypes: ['html', 'content'],
    collationFileName: 'all.json',
    pageSize: 10,
  }, configuration);

  const supportedContentTypes = ['content', 'html', 'description'];
  const unsupportedContentTypes = _.difference(options.contentTypes, supportedContentTypes);

  if (unsupportedContentTypes.length) {
    throw new Error(`Unknown content type: ${unsupportedContentTypes[0]}`);
  }

  const serializerOptions = {
    attributes: _.union(
      options.contentTypes,
      ['title'],
      options.attributes,
    ),
    keyForAttribute: 'camelCase',
  };

  if (options.references) {
    options.references.forEach((reference) => {
      serializerOptions[reference] = { ref: true };
    });

    serializerOptions.attributes = _.union(serializerOptions.attributes, options.references);
  }
  return new Serializer(options.type || folder, serializerOptions);
};
