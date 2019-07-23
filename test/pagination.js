const Funnel = require('broccoli-funnel');
const { createBuilder, createTempDir } = require('broccoli-test-helper');
const { expect } = require('chai');

const StaticSiteJson = require('../index');

let output;
let input;

describe.skip('pagination', () => {
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

  it('should allow you to specify page size with pagination', async () => {
    const mdFiles = new Funnel(input.path(), { destDir: 'face' });

    const subject = new StaticSiteJson(mdFiles, {
      type: 'page',
      collate: true,
      paginate: true,
      pageSize: 2,
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

    expect(allData).to.have.length(2);
    expect(folderOutput.content).to.have.property('all.json');
    expect(folderOutput.content).to.have.property('all-0.json');
    expect(folderOutput.content).to.have.property('all-1.json');

    expect(folderOutput.content['all.json']).to.deep.equal(folderOutput.content['all-0.json']);
    expect(JSON.parse(folderOutput.content['all.json']).data).to.have.length(2);
  });

  it('should automatically paginate 10 files when pagination is turned on', async () => {
    const mdFiles = new Funnel(input.path(), { destDir: 'face' });

    const subject = new StaticSiteJson(mdFiles, {
      type: 'page',
      collate: true,
      paginate: true,
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
      '1.md': `---
title: duplicate
---
# don't write duplicate content`,
      '2.md': `---
title: duplicate
---
# don't write duplicate content`,
      '3.md': `---
title: duplicate
---
# don't write duplicate content`,
      '4.md': `---
title: duplicate
---
# don't write duplicate content`,
      '5.md': `---
title: duplicate
---
# don't write duplicate content`,
      '6.md': `---
title: duplicate
---
# don't write duplicate content`,
      '7.md': `---
title: duplicate
---
# don't write duplicate content`,
      '8.md': `---
title: duplicate
---
# don't write duplicate content`,
      '9.md': `---
title: duplicate
---
# don't write duplicate content`,
    });

    await output.build();

    const folderOutput = output.read();

    expect(JSON.parse(folderOutput.content['all-0.json']).data).to.have.length(10);
    expect(JSON.parse(folderOutput.content['all-1.json']).data).to.have.length(2);
  });

  it('should setup pagination links correctly', async () => {
    const mdFiles = new Funnel(input.path(), { destDir: 'face' });

    const subject = new StaticSiteJson(mdFiles, {
      type: 'page',
      collate: true,
      paginate: true,
      pageSize: 3,
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
      '1.md': `---
title: duplicate
---
# don't write duplicate content`,
      '2.md': `---
title: duplicate
---
# don't write duplicate content`,
      '3.md': `---
title: duplicate
---
# don't write duplicate content`,
      '4.md': `---
title: duplicate
---
# don't write duplicate content`,
      '5.md': `---
title: duplicate
---
# don't write duplicate content`,
      '6.md': `---
title: duplicate
---
# don't write duplicate content`,
      '7.md': `---
title: duplicate
---
# don't write duplicate content`,
      '8.md': `---
title: duplicate
---
# don't write duplicate content`,
      '9.md': `---
title: duplicate
---
# don't write duplicate content`,
    });

    await output.build();

    const folderOutput = output.read();
    const pageOne = JSON.parse(folderOutput.content['all-0.json']);
    const pageFour = JSON.parse(folderOutput.content['all-3.json']);

    expect(pageOne.data).to.have.length(3);
    expect(pageOne.links).to.deep.equal({
      first: '/content/all-0.json',
      last: '/content/all-3.json',
      prev: null,
      next: '/content/all-1.json',
    });

    expect(pageFour.data).to.have.length(3);
    expect(pageFour.links).to.deep.equal({
      first: '/content/all-0.json',
      last: '/content/all-3.json',
      prev: '/content/all-2.json',
      next: null,
    });
  });

  it('should prefix pagination links with the right contentFolder', async () => {
    const mdFiles = new Funnel(input.path(), { destDir: 'face' });

    const subject = new StaticSiteJson(mdFiles, {
      type: 'page',
      collate: true,
      paginate: true,
      pageSize: 3,
      contentFolder: 'facey-face',
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
      '1.md': `---
title: duplicate
---
# don't write duplicate content`,
      '2.md': `---
title: duplicate
---
# don't write duplicate content`,
      '3.md': `---
title: duplicate
---
# don't write duplicate content`,
      '4.md': `---
title: duplicate
---
# don't write duplicate content`,
      '5.md': `---
title: duplicate
---
# don't write duplicate content`,
      '6.md': `---
title: duplicate
---
# don't write duplicate content`,
      '7.md': `---
title: duplicate
---
# don't write duplicate content`,
      '8.md': `---
title: duplicate
---
# don't write duplicate content`,
      '9.md': `---
title: duplicate
---
# don't write duplicate content`,
    });

    await output.build();

    const folderOutput = output.read();

    const pageOne = JSON.parse(folderOutput['facey-face']['all-0.json']);
    const pageFour = JSON.parse(folderOutput['facey-face']['all-3.json']);

    expect(pageOne.data).to.have.length(3);
    expect(pageOne.links).to.deep.equal({
      first: '/facey-face/all-0.json',
      last: '/facey-face/all-3.json',
      prev: null,
      next: '/facey-face/all-1.json',
    });

    expect(pageFour.data).to.have.length(3);
    expect(pageFour.links).to.deep.equal({
      first: '/facey-face/all-0.json',
      last: '/facey-face/all-3.json',
      prev: '/facey-face/all-2.json',
      next: null,
    });
  });
});
