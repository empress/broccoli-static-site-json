const BroccoliMergeTrees = require('broccoli-merge-trees');
const BroccoliFunnel = require('broccoli-funnel');
const { mv } = require('broccoli-stew');
const TableOfContents = require('./lib/table-of-contents');
// const CollateJsonApiBlobs = require('./lib/collate-and-paginate');
const MarkdownToJsonApi = require('./lib/markdown-to-jsonapi');


module.exports = function StaticSiteJson(folder, options = {}) {
  const cleanMarkdownFunnel = new BroccoliFunnel(folder, {
    include: ['**/*.md', '**/*.markdown'],
  });
  const pagesTree = new TableOfContents([folder], options);
  const jsonApiTree = new MarkdownToJsonApi(cleanMarkdownFunnel, options);
  // TODO finish implementing collation tree
  // const collationTree = new CollateJsonApiBlobs(jsonTree, options);
  const compiledTrees = new BroccoliMergeTrees([jsonApiTree, pagesTree]);
  return mv(compiledTrees, (options.contentFolder || 'content'));
};
