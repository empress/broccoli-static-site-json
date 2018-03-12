/**
 * These tests are just basic to test that things are *mostly*
 * working on all versions of NodeJS. All other tests in this
 * repo will be making use of async await so will be disabled
 * on older versions of Node.
 */

const { createBuilder, createTempDir } = require('broccoli-test-helper');
const { expect } = require('chai');

const StaticSiteJson = require('../index');

describe('basic tests', function () {
  it('should throw an error if no folder is passed in');

  it('should build JSON files using the folder name', function () {
    return createTempDir()
      .then((input) => {
        const subject = new StaticSiteJson(input.path());
        const output = createBuilder(subject);

        input.write({
          'index.md': '# Hello world',
        });

        return output.build()
          .then(() => {
            const folderOutput = output.read();

            expect(folderOutput).to.have.property('content');
            expect(folderOutput.content).to.have.property('index.json');
            const indexJSON = JSON.parse(folderOutput.content['index.json']);

            expect(indexJSON.data).to.deep.include({
              id: 'index',
              attributes: {
                content: '# Hello world',
                html: '<h1 id="helloworld">Hello world</h1>',
              },
            });
          })
          .finally(() => {
            return Promise.all([
              output.dispose(),
              input.dispose(),
            ]);
          });
      });
  });
});
