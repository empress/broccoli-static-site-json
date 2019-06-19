const BroccoliMergeTrees = require('broccoli-merge-trees');
const BroccoliFunnel = require('broccoli-funnel');
const { mv } = require('broccoli-stew');
const TableOfContents = require('./lib/table-of-contents');
const MarkdownToJsonApi = require('./lib/markdown-to-json');
const CollateJsonApiBlobs = require('./lib/serialize-json-blobs');


module.exports = function StaticSiteJson(folder, options = {}) {
  const cleanMarkdownFunnel = new BroccoliFunnel(folder, {
    include: ['**/*.md', '**/*.markdown'],
  });
  const pagesTree = new TableOfContents([folder], options);
  const jsonTree = new MarkdownToJsonApi(cleanMarkdownFunnel, options);
  const jsonApiTree = new CollateJsonApiBlobs(jsonTree, options);
  const compiledTrees = new BroccoliMergeTrees([jsonApiTree, pagesTree]);
  return mv(compiledTrees, (options.contentFolder || 'content'));
};
