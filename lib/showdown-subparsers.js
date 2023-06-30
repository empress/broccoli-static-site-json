/* eslint-disable */
module.exports = function(showdown) {
  /**
   * This is a copy and paste of the exact subparser from showdown with one *very* subtle change.
   * We need code blocks to work when they have "stuff" following the language definition 
   * e.g. ```html some-stuff-here
   * 
   * This doesn't work by default so we had to update the regex from: 
   * 
   * /(?:^|\n)(?: {0,3})(```+|~~~+)(?: *)([^\s`~]*)\n([\s\S]*?)\n(?: {0,3})\1/g
   * 
   * to 
   * 
   * /(?:^|\n)(?: {0,3})(```+|~~~+)(?: *)([^\s`~]*).*\n([\s\S]*?)\n(?: {0,3})\1/g
   * 
   * if you look carefully we have added an extra .* just after the middle there.
   * 
   * If you're thinking this all looks like gobbledegook then you are correct. If this 
   * doesn't work then https://regex101.com/ is your friend. Put the regex that you want 
   * to debug in there and some examples of a markdown file and just keep change things
   * until it starts working 🤷‍♀️
   * 
   */
  showdown.subParser('githubCodeBlocks', function (text, options, globals) {
    'use strict';
  
    // early exit if option is not enabled
    if (!options.ghCodeBlocks) {
      return text;
    }
  
    text = globals.converter._dispatch('githubCodeBlocks.before', text, options, globals);
  
    text += '¨0';
  
    text = text.replace(/(?:^|\n)(?: {0,3})(```+|~~~+)(?: *)([^\s`~]*).*\n([\s\S]*?)\n(?: {0,3})\1/g, function (wholeMatch, delim, language, codeblock) {
      var end = (options.omitExtraWLInCodeBlocks) ? '' : '\n';
  
      // First parse the github code block
      codeblock = showdown.subParser('encodeCode')(codeblock, options, globals);
      codeblock = showdown.subParser('detab')(codeblock, options, globals);
      codeblock = codeblock.replace(/^\n+/g, ''); // trim leading newlines
      codeblock = codeblock.replace(/\n+$/g, ''); // trim trailing whitespace
  
      codeblock = '<pre><code' + (language ? ' class="' + language + ' language-' + language + '"' : '') + '>' + codeblock + end + '</code></pre>';
  
      codeblock = showdown.subParser('hashBlock')(codeblock, options, globals);
  
      // Since GHCodeblocks can be false positives, we need to
      // store the primitive text and the parsed text in a global var,
      // and then return a token
      return '\n\n¨G' + (globals.ghCodeBlocks.push({text: wholeMatch, codeblock: codeblock}) - 1) + 'G\n\n';
    });
  
    // attacklab: strip sentinel
    text = text.replace(/¨0/, '');
  
    return globals.converter._dispatch('githubCodeBlocks.after', text, options, globals);
  });
}