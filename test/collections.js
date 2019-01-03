const { createBuilder, createTempDir } = require('broccoli-test-helper');
const { expect } = require('chai');

const StaticSiteJson = require('../index');

let output;
let input;

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
  });

  afterEach(async () => {
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
      collections: [{
        src: `${input.path()}/content`,
        output: 'all.json',
      }],
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
      collections: [{
        src: `${input.path()}/content`,
        output: 'all.json',
      }],
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

  it('should allow you to define a collection and for the specified content folder to be exported as an single JSONAPI array response');
  it('should allow you to define multiple collections in the one StaticSiteJson definition');
  it('should use the type definition of the StaticSiteJson in the collection');
});
