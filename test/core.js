const Funnel = require('broccoli-funnel');
const { createBuilder, createTempDir } = require('broccoli-test-helper');
const { expect } = require('chai');

const StaticSiteJson = require('../index');

describe('core functionality', function () {
  it('should throw an error if no folder is passed in');

  it('should build JSON files using the folder name', async function () {
    const input = await createTempDir();

    const subject = new StaticSiteJson(input.path());
    const output = createBuilder(subject);

    input.write({
      'index.md': '# Hello world',
    });

    await output.build();

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

    await output.dispose();
    await input.dispose();
  });

  it('should ignore non .md files', async () => {
    const input = await createTempDir();

    const subject = new StaticSiteJson(input.path());
    const output = createBuilder(subject);

    input.write({
      'index.md': '# Hello world',
      'something.txt': 'Ignore me',
    });

    await output.build();

    const folderOutput = output.read();

    expect(folderOutput.content).to.have.property('index.json');
    expect(Object.keys(folderOutput.content)).to.have.length(1);

    await output.dispose();
    await input.dispose();
  });

  it('should work recursively', async () => {
    const input = await createTempDir();

    const subject = new StaticSiteJson(input.path());
    const output = createBuilder(subject);

    input.write({
      'index.md': '# Hello world',
      sub: {
        'index.md': '# Hello sub world',
      },
    });

    await output.build();

    const folderOutput = output.read();

    expect(folderOutput.content).to.have.property('index.json');
    expect(folderOutput.content.sub).to.have.property('index.json');

    expect(JSON.parse(folderOutput.content.sub['index.json']).data).to.deep.include({
      id: 'sub/index',
      attributes: {
        content: '# Hello sub world',
        html: '<h1 id="hellosubworld">Hello sub world</h1>',
      },
    });

    await output.dispose();
    await input.dispose();
  });

  it('should work with a broccoli plugin as an input', async () => {
    const input = await createTempDir();

    const mdFiles = new Funnel(input.path());

    const subject = new StaticSiteJson(mdFiles);
    const output = createBuilder(subject);

    input.write({
      'index.md': '# Hello world',
      sub: {
        'index.md': '# Hello sub world',
      },
    });

    await output.build();

    const folderOutput = output.read();

    expect(folderOutput.content).to.have.property('index.json');
    expect(folderOutput.content.sub).to.have.property('index.json');

    expect(JSON.parse(folderOutput.content.sub['index.json']).data).to.deep.include({
      id: 'sub/index',
      attributes: {
        content: '# Hello sub world',
        html: '<h1 id="hellosubworld">Hello sub world</h1>',
      },
    });

    await output.dispose();
    await input.dispose();
  });

  it('should allow you to specify the destination directoy with contentFolder', async () => {
    const input = await createTempDir();

    const subject = new StaticSiteJson(input.path(), {
      contentFolder: 'dest',
    });
    const output = createBuilder(subject);

    input.write({
      'index.md': '# Hello world',
    });

    await output.build();

    const folderOutput = output.read();

    expect(folderOutput.dest).to.have.property('index.json');

    await output.dispose();
    await input.dispose();
  });

  it('should allow you to override the JSON:API type', async () => {
    const input = await createTempDir();

    const subject = new StaticSiteJson(input.path(), {
      type: 'face',
    });
    const output = createBuilder(subject);

    input.write({
      'index.md': '# Hello world',
    });

    await output.build();

    const folderOutput = output.read();

    expect(folderOutput.content).to.have.property('index.json');

    expect(JSON.parse(folderOutput.content['index.json']).data).to.deep.include({
      id: 'index',
      type: 'faces',
      attributes: {
        content: '# Hello world',
        html: '<h1 id="helloworld">Hello world</h1>',
      },
    });

    await output.dispose();
    await input.dispose();
  });

  it('should read pages.yaml and produce the TOC pages.json file', async () => {
    const input = await createTempDir();

    const subject = new StaticSiteJson(input.path(), {
      type: 'face',
    });
    const output = createBuilder(subject);

    input.write({
      'index.md': '# Hello world',
      'pages.yml': `
- title: "Introduction"
  url: 'toc-heading-introduction'
  is_heading: true

- title: "Guides and Tutorials"
  url: 'index'
  skip_toc: true
  pages:
    - title: "Ember.js Guides"
      url: ""

- title: "Getting Started"
  url: 'getting-started'
  pages:
    - title: "Quick Start"
      url: "quick-start"
    - title: "Installing Ember"
      url: "index"

- title: "Tutorial"
  url: 'tutorial'
  pages:
    - title: "Creating Your App"
      url: "ember-cli"`,
    });

    await output.build();

    const folderOutput = output.read();

    expect(folderOutput.content).to.have.property('index.json');

    expect(JSON.parse(folderOutput.content['pages.json']).data).to.deep.include({
      type: 'pages',
      id: 'toc-heading-introduction',
      attributes: {
        title: 'Introduction',
        'is-heading': true,
      },
    });

    expect(JSON.parse(folderOutput.content['pages.json']).data).to.deep.include({
      type: 'pages',
      id: 'index',
      attributes: {
        title: 'Guides and Tutorials',
        pages: [{
          title: 'Ember.js Guides',
          url: 'index/',
        }],
        'skip-toc': true,
      },
    });

    expect(JSON.parse(folderOutput.content['pages.json']).data).to.deep.include({
      type: 'pages',
      id: 'getting-started',
      attributes: {
        title: 'Getting Started',
        pages: [{
          title: 'Quick Start',
          url: 'getting-started/quick-start',
        }, {
          title: 'Installing Ember',
          url: 'getting-started/index',
        }],
      },
    });

    await output.dispose();
    await input.dispose();
  });
});
