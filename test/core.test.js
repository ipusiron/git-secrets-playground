'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const vm = require('node:vm');
const core = require('../js/git-core.js');
const { GIT_STRUCTURE, SAMPLE_OBJECTS } = require('../js/git-data.js');
const expected = [
  ['e69de29bb2d1d6434b8b29ae775ad8c2e48c5391', 0],
  ['557db03de997c86a4a028e1ebd3a1ceb225be238', 12],
  ['3bb8dc0bbcd57a209018a4aa1c6d07db2edc75dd', 169],
  ['df799688ee42b4d33e495ffa1a78469753c7dde9', 263]
];

for (const [index, [hash, size]] of expected.entries()) {
  test(`sample ${index + 1}: real Git blob hash, size, path`, () => {
    const obj = SAMPLE_OBJECTS[index];
    assert.equal(obj.hash, hash);
    assert.equal(obj.type, 'blob');
    assert.equal(obj.size, size);
    assert.equal(Buffer.byteLength(obj.content, 'utf8'), size);
    const digest = createHash('sha1').update(core.blobHeader(size)).update(obj.content).digest('hex');
    assert.equal(digest, hash);
    assert.equal(core.objectPath(hash), `.git/objects/${hash.slice(0, 2)}/${hash.slice(2)}`);
  });
}

test('sample content is byte-identical to the original source', () => {
  const original = execFileSync('git', ['show', 'bbecd38:script.js'], { encoding: 'utf8' });
  const source = original.slice(original.indexOf('const sampleObjects = {'),
    original.indexOf("document.getElementById('recover-object')"));
  const old = vm.runInNewContext(source + '\nObject.values(sampleObjects)');
  assert.deepEqual(SAMPLE_OBJECTS.map(obj => obj.content), Array.from(old, obj => obj.content));
});

test('tree object files match sample objects exactly', () => {
  const objects = GIT_STRUCTURE.children.find(node => node.name === 'objects');
  const paths = objects.children.flatMap(dir => (dir.children || []).map(file => `.git/objects/${dir.name}/${file.name}`));
  assert.equal(SAMPLE_OBJECTS.length, 4);
  assert.deepEqual(paths.sort(), SAMPLE_OBJECTS.map(obj => core.objectPath(obj.hash)).sort());
});

test('tree statistics remain unchanged', () => {
  assert.deepEqual(core.treeStats(GIT_STRUCTURE), { high: 10, medium: 7, low: 3, files: 19, folders: 18 });
});

test('blob header and empty tree known answers', () => {
  assert.equal(Buffer.from(core.blobHeader(12)).toString('hex'), '626c6f6220313200');
  assert.equal(createHash('sha1').update('tree 0\0').digest('hex'), '4b825dc642cb6eb9a060e54bf8d69288fbee4904');
});

for (const [input, valid] of [
  [expected[0][0], true], ['  E69DE29BB2D1D6434B8B29AE775AD8C2E48C5391 ', true],
  ['e69de29b', false], ['g69de29bb2d1d6434b8b29ae775ad8c2e48c5391', false], ['', false]
]) {
  test(`hash validation ${JSON.stringify(input)}`, () => assert.equal(core.isValidHash(input), valid));
}

test('normalization trims and lowercases', () => {
  assert.equal(core.normalizeHash(' ABC '), 'abc');
});

for (const [input, valid] of [
  ['https://example.com/', true], ['http://localhost:8000', true], ['example.com', false],
  ['ftp://example.com', false], ['javascript:alert(1)', false], ['https://', false], [' https://target.test/.git/ ', true]
]) {
  test(`URL validation ${input}`, () => assert.equal(core.isHttpUrl(input), valid));
}
