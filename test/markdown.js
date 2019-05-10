/**
 * Ensures that you can configure showdown before requiring the plugin
 */

const showdown = require('showdown');
const { createBuilder, createTempDir } = require('broccoli-test-helper');
const { expect } = require('chai');

const StaticSiteJson = require('../index');

describe('basic tests', function () {
  it('should throw an error if no folder is passed in');

  it('should build JSON files using the folder name', function () {
    return createTempDir()
      .then((input) => {
        showdown.setOption('tables', true);
        const subject = new StaticSiteJson(input.path());
        const output = createBuilder(subject);
        const content = `
  # Hello world
  | Column |
  |--------|
  | row    |
`;
        input.write({
          'index.md': content,
        });

        return output.build()
          .then(() => {
            const folderOutput = output.read();
            const indexJSON = JSON.parse(folderOutput.content['index.json']);
            const expectedContent = `<h1 id="helloworld">Hello world</h1>
<table>
<thead>
<tr>
<th>Column</th>
</tr>
</thead>
<tbody>
<tr>
<td>row</td>
</tr>
</tbody>
</table>`;
            expect(indexJSON.data.attributes.html).to.eq(expectedContent);
          })
          .then(() => {
            showdown.setOption('tables', false);
            return Promise.all([
              output.dispose(),
              input.dispose(),
            ]);
          });
      });
  });
});
