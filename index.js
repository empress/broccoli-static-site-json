const BroccoliMergeTrees = require('broccoli-merge-trees');
const BroccoliFunnel = require('broccoli-funnel');
const { mv } = require('broccoli-stew');
const TableOfContents = require('./lib/table-of-contents');
const CollateJsonApiBlobs = require('./lib/collate-and-paginate');
const MarkdownToJsonApi = require('./lib/markdown-to-jsonapi');


module.exports = function StaticSiteJson(folder, options = {}) {
  const cleanMarkdownFunnel = new BroccoliFunnel(folder, {
    include: ['**/*.md', '**/*.markdown'],
  });
  const tocFunnel = new BroccoliFunnel(folder, {
    include: ['**/pages.yml', '**/pages.json'],
  });
  const pagesTree = new TableOfContents(tocFunnel, options);
  const jsonApiTree = new MarkdownToJsonApi(cleanMarkdownFunnel, options);

  // the default content folder is "content" and this tree needs to know
  // about contentFolder for pagination links
  const collationTree = new CollateJsonApiBlobs(jsonApiTree, {
    contentFolder: 'content',
    ...options,
  });
  const compiledTrees = new BroccoliMergeTrees([jsonApiTree, pagesTree, collationTree]);
  return mv(compiledTrees, (options.contentFolder || 'content'));
};
