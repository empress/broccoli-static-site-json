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

describe('references or relationships', function () {
  beforeEach(async function () {
    input = await createTempDir();
  });

  afterEach(async function () {
    try {
      await input.dispose();
    } finally {
      // do nothing
    }

    if (output) {
      await output.dispose();
    }
  });

  it('should not include relationship for tag if the frontmatter is included but no options passed', async function () {
    const result = await buildSingleFile(`---
tag: face
---
# Hello world`);

    expect(result).not.have.property('relationships');
  });

  it('should include title if the frontmatter is included and title is in attributes', async function () {
    const result = await buildSingleFile(`---
tag: face
---
# Hello world`, {
      references: ['tag'],
    });

    expect(result).have.property('relationships');
    expect(result.relationships.tag.data).have.property('id', 'face');
    expect(result.relationships.tag.data).have.property('type', 'tags');
  });

  it('should allow you to customize the type of relationship', async function () {
    const result = await buildSingleFile(`---
tag: face
profile: face.jpg
foo: bar
---
# Hello world`, {
      references: ['tag', { name: 'profile', type: 'images' }, { name: 'foo', type: 'notfoos' }],
    });

    expect(result).have.property('relationships');
    expect(result.relationships.tag.data).have.property('id', 'face');
    expect(result.relationships.tag.data).have.property('type', 'tags');
    expect(result.relationships.profile.data).have.property('id', 'face.jpg');
    expect(result.relationships.profile.data).have.property('type', 'images');
    expect(result.relationships.foo.data).have.property('id', 'bar');
    expect(result.relationships.foo.data).have.property('type', 'notfoos');
  });
});
