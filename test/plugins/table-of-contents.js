/* eslint-disable no-useless-escape */

const { createBuilder, createTempDir } = require('broccoli-test-helper');
const { expect } = require('chai');
const StaticSiteJson = require('../../index');

describe('table-of-contents', function () {
  let input;
  let output;

  beforeEach(async function () {
    input = await createTempDir();
  });

  afterEach(async function () {
    await input.dispose();
    await output.dispose();
  });

  it('should build pages.yml', async function () {
    const subject = new StaticSiteJson(input.path());
    output = createBuilder(subject);

    // INITIAL
    input.write({
      'pages.yml': `- title: "Getting Started"
  url: 'getting-started'
  pages:
    - title: "How To Use The Guides"
      url: "intro"`,
    });

    await output.build();

    expect(output.read()).to.deep.equal({
      content: {
        'pages.json': '{"data":[{"type":"pages","id":"getting-started","attributes":{"title":"Getting Started","pages":[{"title":"How To Use The Guides","url":"getting-started/intro"}]}}]}',
      },
    });

    expect(output.changes()).to.deep.equal({
      'content/': 'mkdir',
      'content/pages.json': 'create',
    });

    // UPDATE
    input.write({
      'pages.yml': `- title: "Tutorial"
  url: 'tutorial'
  pages:
    - title: "Creating Your App"
      url: "ember-cli"`, // change
    });
    await output.build();

    expect(output.read()).to.deep.equal({
      content: {
        'pages.json': '{"data":[{"type":"pages","id":"tutorial","attributes":{"title":"Tutorial","pages":[{"title":"Creating Your App","url":"tutorial/ember-cli"}]}}]}',
      },
    });

    expect(output.changes()).to.deep.equal({
      'content/pages.json': 'change',
    });

    // NOOP
    await output.build();

    expect(output.changes()).to.deep.equal({});
  });

  it('should build toc.yml', async function () {
    const subject = new StaticSiteJson(input.path());
    output = createBuilder(subject);

    // INITIAL
    input.write({
      'toc.yml': `- title: "Getting Started"
  url: 'getting-started'
  pages:
    - title: "How To Use The Guides"
      url: "intro"`,
    });

    await output.build();

    expect(output.read()).to.deep.equal({
      content: {
        'toc.json': '{"data":[{"type":"pages","id":"getting-started","attributes":{"title":"Getting Started","pages":[{"title":"How To Use The Guides","url":"getting-started/intro"}]}}]}',
      },
    });

    expect(output.changes()).to.deep.equal({
      'content/': 'mkdir',
      'content/toc.json': 'create',
    });
  });

  it('should build toc.yaml', async function () {
    const subject = new StaticSiteJson(input.path());
    output = createBuilder(subject);

    // INITIAL
    input.write({
      'toc.yaml': `- title: "Getting Started"
  url: 'getting-started'
  pages:
    - title: "How To Use The Guides"
      url: "intro"`,
    });

    await output.build();

    expect(output.read()).to.deep.equal({
      content: {
        'toc.json': '{"data":[{"type":"pages","id":"getting-started","attributes":{"title":"Getting Started","pages":[{"title":"How To Use The Guides","url":"getting-started/intro"}]}}]}',
      },
    });

    expect(output.changes()).to.deep.equal({
      'content/': 'mkdir',
      'content/toc.json': 'create',
    });
  });
});
