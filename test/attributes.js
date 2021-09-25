const { createBuilder, createTempDir } = require('broccoli-test-helper');
const { expect } = require('chai');

const StaticSiteJson = require('../index');

let output;
let input;

async function buildSingleFile(fileContents, options) {
  input.write({
    'index.md': fileContents,
  });

  const subject = new StaticSiteJson(input.path(), options);
  output = createBuilder(subject);

  await output.build();

  const folderOutput = output.read();
  const indexJSON = JSON.parse(folderOutput.content['index.json']);
  return indexJSON.data;
}

describe('JSONAPI attributes', () => {
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

  it('should not include title if the frontmatter is included but no options passed', async () => {
    const result = await buildSingleFile(`---
title: a lovely title
---
# Hello world`);

    expect(result.attributes).not.have.property('title', 'a lovely title');
    expect(result.attributes).have.property('content', '# Hello world');
  });

  it('should include title if the frontmatter is included and title is in attributes', async () => {
    const result = await buildSingleFile(`---
title: a lovely title
---
# Hello world`, {
      attributes: ['title'],
    });

    expect(result.attributes).have.property('title', 'a lovely title');
    expect(result.attributes).have.property('content', '# Hello world');
  });

  it('should not inlude any extra frontmatter that is not defined in attributes', async () => {
    const result = await buildSingleFile(`---
unknown: some unknown frontmatter
---
# Hello world`);

    expect(result.attributes).to.not.have.property('unknown');
  });

  it('should allow you to specify attributes and for them to be included in the output', async () => {
    const result = await buildSingleFile(`---
known: some frontmatter
---
# Hello world`, {
      attributes: ['known'],
    });

    expect(result.attributes).to.have.property('known', 'some frontmatter');
  });

  it('should make the frontmatter description take precedent if attribute description is specified', async () => {
    const result = await buildSingleFile(`---
description: use me instead
---
# Hello world`, {
      attributes: ['description'],
    });

    expect(result.attributes).to.have.property('description', 'use me instead');
  });

  it('should make the frontmatter description take precedent if contentType description is specified', async () => {
    const result = await buildSingleFile(`---
description: use me instead
---
# Hello world`, {
      contentTypes: ['description'],
    });

    expect(result.attributes).to.have.property('description', 'use me instead');
  });

  it('should only include html and content with basic config', async () => {
    const result = await buildSingleFile('# Hello world');

    expect(result.attributes).have.keys(['html', 'content']);
  });

  it('should not include html if it is not in the content types', async () => {
    const result = await buildSingleFile('# Hello world', {
      contentTypes: ['content'],
    });

    expect(result.attributes).have.keys(['content']);
  });

  it('should not include markdown if it is not in the content types', async () => {
    const result = await buildSingleFile('# Hello world', {
      contentTypes: ['html'],
    });

    expect(result.attributes).have.keys(['html']);
  });

  it('should include description if it is defined in config', async () => {
    const result = await buildSingleFile('# Hello world', {
      contentTypes: ['html', 'content', 'description'],
    });

    expect(result.attributes).have.keys(['html', 'content', 'description']);
  });

  it('should limit description to 260 characters', async () => {
    const result = await buildSingleFile(`# Hello world

This is where I write my really long essay to the world. I will start off bing **super** important and then _slow down_ to a stop.

## Second point

I really like programming. I could do this all day long without ever stooopping, no matter how long the word limit is`, {
      contentTypes: ['html', 'content', 'description'],
    });

    expect(result.attributes.description).to.have.lengthOf.at.most(260);
  });

  it('should end the description with ... when the content is limited', async () => {
    const result = await buildSingleFile(`# Hello world

This is where I write my really long essay to the world. I will start off bing **super** important and then _slow down_ to a stop.

## Second point

I really like programming. I could do this all day long without ever stooopping, no matter how long the word limit is`, {
      contentTypes: ['html', 'content', 'description'],
    });

    expect(result.attributes.description).to.match(/\.\.\.$/);
  });

  it('should not end the description with ... when the content is not limited', async () => {
    const result = await buildSingleFile(`# Hello world

This is where I write my really long essay to the world. I will start off bing **super** important and then _slow down_ to a stop.
`, {
      contentTypes: ['html', 'content', 'description'],
    });

    expect(result.attributes.description).to.not.match(/\.\.\.$/);
  });

  it('should throw an error if there is an unknown content type', async () => {
    let error;

    try {
      await buildSingleFile('# Hello world', {
        contentTypes: ['html', 'content', 'faceyFace'],
      });
    } catch (err) {
      error = err;
    }

    expect(error, 'Build did not error').to.be.ok;
    expect(error.message).to.equal('Unknown content type: faceyFace');
  });

  it.only('should include page table of contents if included in contentTypes', async () => {
    const result = await buildSingleFile(`# Hello world

This is the first part

## Second point

I really like programming.

### Second part sub point

more info about programming

## Third part

how about now

### Sub point
more stuff


#### Sub sub point

even more stuff

##### Sub sub sub point

you're being silly now

`, {
      contentTypes: ['toc'],
    });

    expect(result.attributes.toc).to.deep.equal([
      { text: 'Hello world', depth: '1', id: 'helloworld' },
      { text: 'Second point', depth: '2', id: 'secondpoint' },
      {
        text: 'Second part sub point',
        depth: '3',
        id: 'secondpartsubpoint',
      },
      { text: 'Third part', depth: '2', id: 'thirdpart' },
      { text: 'Sub point', depth: '3', id: 'subpoint' },
      { text: 'Sub sub point', depth: '4', id: 'subsubpoint' },
      { text: 'Sub sub sub point', depth: '5', id: 'subsubsubpoint' },
    ]);
  });
});
