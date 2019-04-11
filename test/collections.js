const Funnel = require('broccoli-funnel');
const sinon = require('sinon');

const { createBuilder, createTempDir } = require('broccoli-test-helper');
const { expect } = require('chai');

const StaticSiteJson = require('../index');

let output;
let input;
let warnSpy;

async function buildFiles(files, options) {
  input.write({
    content: files,
  });

  const subject = new StaticSiteJson(`${input.path()}/content`, options);
  output = createBuilder(subject);

  await output.build();

  const folderOutput = output.read();

  const outputFiles = {};

  Object.keys(folderOutput.content).forEach((file) => {
    outputFiles[file] = JSON.parse(folderOutput.content[file]).data;
  });

  return outputFiles;
}

describe('collections', () => {
  beforeEach(async () => {
    input = await createTempDir();
    warnSpy = sinon.spy(console, 'warn');
  });

  afterEach(async () => {
    // eslint-disable-next-line no-console
    console.warn.restore();
    try {
      await input.dispose();
    } finally {
      // do nothing
    }

    if (output) {
      await output.dispose();
    }
  });

  it('should have the same ids for collection objects as it does for individual objects', async () => {
    const files = await buildFiles({
      'index.md': `---
title: a lovely title
---
# Hello world`,
      'project.md': `---
title: a less lovely title
---
# Goodbye world`,
      'double-word.md': `---
title: more words
---
# When one word is not enough`,
    }, {
      collate: true,
    });

    expect(files['index.json']).to.have.property('id', 'index');
    expect(files['project.json']).to.have.property('id', 'project');
    expect(files['double-word.json']).to.have.property('id', 'double-word');

    // each of the above files should exist in the all.json
    expect(files['all.json'].find(obj => obj.id === 'index')).to.be.ok;
    expect(files['all.json'].find(obj => obj.id === 'project')).to.be.ok;
    expect(files['all.json'].find(obj => obj.id === 'double-word')).to.be.ok;
  });

  it('should name the files the same as the id if the id is specified', async () => {
    const files = await buildFiles({
      'index.md': `---
title: a lovely title
id: 1
---
# Hello world`,
      'project.md': `---
title: a less lovely title
id: 2
---
# Goodbye world`,
      'double-word.md': `---
title: more words
id: 3
---
# When one word is not enough`,
    }, {
      collate: true,
    });

    expect(files).to.have.property('1.json');

    expect(files['1.json']).to.have.property('id', '1');
    expect(files['2.json']).to.have.property('id', '2');
    expect(files['3.json']).to.have.property('id', '3');

    // each of the above files should exist in the all.json
    expect(files['all.json'].find(obj => obj.id === '1')).to.be.ok;
    expect(files['all.json'].find(obj => obj.id === '2')).to.be.ok;
    expect(files['all.json'].find(obj => obj.id === '3')).to.be.ok;
  });

  it('tell you that that the collections attribute is deprecated', async () => {
    const subject = new StaticSiteJson(input.path(), {
      type: 'page',
      collections: [{
        output: 'all.json',
      }],
    });

    output = createBuilder(subject);

    input.write({
      'index.md': `---
title: a lovely title
---
# Hello world`,
    });

    await output.build();

    // assert that it was called with the correct value
    expect(warnSpy.getCall(0).args[0]).to.eql('Using `collection` is deprecated. Please use collate and collationFileName instead.');
  });

  it('will warn you that that multiple collections will not be supported in the next version', async () => {
    const subject = new StaticSiteJson(input.path(), {
      type: 'page',
      collections: [{
        output: 'all.json',
      }, {
        output: 'another.json',
      }],
    });

    output = createBuilder(subject);

    input.write({
      'index.md': `---
title: a lovely title
---
# Hello world`,
    });

    await output.build();

    // assert that it was called with the correct value
    expect(warnSpy.getCall(0).args[0]).to.eql('Using `collection` is deprecated. Please use collate and collationFileName instead.');
    expect(warnSpy.getCall(1).args[0]).to.eql('Multiple collections will be removed in the next major release.');
  });

  it('should allow you to define a collection and for the specified content folder to be exported as an single JSONAPI array response', async () => {
    const subject = new StaticSiteJson(input.path(), {
      type: 'page',
      collate: true,
    });

    output = createBuilder(subject);

    input.write({
      'index.md': `---
title: a lovely title
---
# Hello world`,
      'project.md': `---
title: a less lovely title
---
# Goodbye world`,
      'double-word.md': `---
title: more words
---
# When one word is not enough`,
    });

    await output.build();

    const folderOutput = output.read();

    expect(JSON.parse(folderOutput.content['all.json']).data).to.deep.include({
      type: 'pages',
      id: 'double-word',
      attributes: {
        html: '<h1 id="whenonewordisnotenough">When one word is not enough</h1>',
        content: '# When one word is not enough',
        title: 'more words',
      },
    });
    expect(JSON.parse(folderOutput.content['all.json']).data).to.deep.include({
      type: 'pages',
      id: 'index',
      attributes: {
        html: '<h1 id="helloworld">Hello world</h1>',
        content: '# Hello world',
        title: 'a lovely title',
      },
    });
    expect(JSON.parse(folderOutput.content['all.json']).data).to.deep.include({
      type: 'pages',
      id: 'project',
      attributes: {
        html: '<h1 id="goodbyeworld">Goodbye world</h1>',
        content: '# Goodbye world',
        title: 'a less lovely title',
      },
    });
  });

  it('should work if a broccoli plugin is passed in instead of a folder', async () => {
    const mdFiles = new Funnel(input.path(), { destDir: 'face' });

    const subject = new StaticSiteJson(mdFiles, {
      type: 'page',
      collate: true,
    });

    output = createBuilder(subject);

    input.write({
      'index.md': `---
title: a lovely title
---
# Hello world`,
      'project.md': `---
title: a less lovely title
---
# Goodbye world`,
      'double-word.md': `---
title: more words
---
# When one word is not enough`,
    });

    await output.build();

    const folderOutput = output.read();

    const allData = JSON.parse(folderOutput.content['all.json']).data;

    ['double-word', 'index', 'project'].forEach((id) => {
      const allObject = allData.find(obj => obj.id.endsWith(id));

      expect(allObject).to.be.ok;

      const individualObject = JSON.parse(folderOutput.content.face[`${id}.json`]);

      expect(allObject).to.deep.equal(individualObject.data);
    });
  });

  it('should use the type definition of the StaticSiteJson in the collection');
});
