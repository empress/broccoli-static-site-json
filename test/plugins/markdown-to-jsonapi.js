/* eslint-disable no-useless-escape */

const { createBuilder, createTempDir } = require('broccoli-test-helper');
const { expect } = require('chai');
const MarkDownToJsonApi = require('../../lib/markdown-to-jsonapi');

describe('markdown-to-jsonapi', function () {
  let input;
  let output;

  beforeEach(async function () {
    input = await createTempDir();
  });

  afterEach(async function () {
    await input.dispose();
    await output.dispose();
  });

  it('should build', async function () {
    const subject = new MarkDownToJsonApi(input.path(), {
      type: 'things',
    });
    output = createBuilder(subject);

    // INITIAL
    input.write({
      'something.md': '#hello',
      lib: {
        'b.markdown': '##goodbye',
      },
    });

    await output.build();

    expect(output.read()).to.deep.equal({
      'something.json': '{"data":{"type":"things","id":"something","attributes":{"html":"<h1 id=\\\"hello\\\">hello</h1>","content":"#hello"}}}',
      lib: {
        'b.json': '{"data":{"type":"things","id":"lib/b","attributes":{"html":"<h2 id=\\\"goodbye\\\">goodbye</h2>","content":"##goodbye"}}}',
      },
    });

    expect(output.changes()).to.deep.equal({
      'something.json': 'create',
      'lib/': 'mkdir',
      'lib/b.json': 'create',
    });

    // UPDATE
    input.write({
      'something.md': '**AA!**', // change
      lib: null, // rmdir
    });
    await output.build();

    expect(output.read()).to.deep.equal({
      'something.json': '{"data":{"type":"things","id":"something","attributes":{"html":"<p><strong>AA!</strong></p>","content":"**AA!**"}}}',
    });

    expect(output.changes()).to.deep.equal({
      'lib/b.json': 'unlink',
      'lib/': 'rmdir',
      'something.json': 'change',
    });

    // NOOP
    await output.build();

    expect(output.changes()).to.deep.equal({});
  });
});
