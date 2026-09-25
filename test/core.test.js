'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const vm = require('node:vm');
const core = require('../js/git-core.js');
const { GIT_STRUCTURE, SAMPLE_OBJECTS } = require('../js/git-data.js');
const scenario = require('../js/scenario-data.js');
const utf8 = text => new TextEncoder().encode(text);
const decode = bytes => new TextDecoder().decode(bytes);
const knownObjects = [
  ['053b492e8d60d6e8b50152bb2dbbf62b44d5b1ca', 'blob', 66, 81],
  ['863230c82209c78e1ba0e7a61304f5197f00a77e', 'commit', 173, 129],
  ['8b056784a6207580608f107a09abadaf5f6c2af1', 'blob', 93, 104],
  ['8cc967668c1a14b8f82064478caf03defd7cfd34', 'tree', 75, 88],
  ['b4719a20b17d401cc15d2321f34768f860aa8755', 'blob', 104, 117],
  ['d75f7af7e09183ce60c816274fa5e8d9e15e1fb7', 'commit', 233, 168],
  ['e9c014bf835507e6cc16b14ec2926f589480d847', 'tree', 75, 87],
];
for (const [hash, type, size, compressedSize] of knownObjects) {
  test('scenario object ' + hash, async () => {
    const compressed = core.hexToBytes(scenario.objects[hash]);
    const obj = await core.openLoose(hash, compressed);
    assert.equal(compressed.length, compressedSize);
    assert.equal(obj.type, type);
    assert.equal(obj.size, size);
    assert.equal(obj.hash, hash);
    assert.equal(obj.matches, true);
    assert.equal(core.objectPath(hash), '.git/objects/' + hash.slice(0, 2) + '/' + hash.slice(2));
  });
}
test('all scenario contents match the supplied known answers', async () => {
  assert.equal(decode((await core.openLoose('053b492e8d60d6e8b50152bb2dbbf62b44d5b1ca',
    core.hexToBytes(scenario.objects['053b492e8d60d6e8b50152bb2dbbf62b44d5b1ca']))).body),
    "# Demo App\n\nA tiny sample project for the Git Secrets Playground.\n");
  {
    const obj = await core.openLoose('863230c82209c78e1ba0e7a61304f5197f00a77e', core.hexToBytes(scenario.objects['863230c82209c78e1ba0e7a61304f5197f00a77e']));
    assert.deepEqual(core.parseCommit(obj.body), {
      tree: '8cc967668c1a14b8f82064478caf03defd7cfd34', parents: [],
      author: "Dev Example <dev@example.com> 1775005200 +0900", committer: "Dev Example <dev@example.com> 1775005200 +0900",
      message: "Add app config"
    });
  }
  assert.equal(decode((await core.openLoose('8b056784a6207580608f107a09abadaf5f6c2af1',
    core.hexToBytes(scenario.objects['8b056784a6207580608f107a09abadaf5f6c2af1']))).body),
    "database:\n  host: db.example.test\n  user: app\n  password: ${DB_PASSWORD}\napi_key: ${API_KEY}\n");
  {
    const obj = await core.openLoose('8cc967668c1a14b8f82064478caf03defd7cfd34', core.hexToBytes(scenario.objects['8cc967668c1a14b8f82064478caf03defd7cfd34']));
    assert.deepEqual(core.parseTree(obj.body), [
      { mode: '100644', type: 'blob', name: 'README.md', hash: '053b492e8d60d6e8b50152bb2dbbf62b44d5b1ca' },
      { mode: '100644', type: 'blob', name: 'config.yml', hash: 'b4719a20b17d401cc15d2321f34768f860aa8755' },
    ]);
  }
  assert.equal(decode((await core.openLoose('b4719a20b17d401cc15d2321f34768f860aa8755',
    core.hexToBytes(scenario.objects['b4719a20b17d401cc15d2321f34768f860aa8755']))).body),
    "database:\n  host: db.example.test\n  user: app\n  password: Tr0ub4dor-3\napi_key: DEMO-KEY-NOT-REAL-7f3a9c\n");
  {
    const obj = await core.openLoose('d75f7af7e09183ce60c816274fa5e8d9e15e1fb7', core.hexToBytes(scenario.objects['d75f7af7e09183ce60c816274fa5e8d9e15e1fb7']));
    assert.deepEqual(core.parseCommit(obj.body), {
      tree: 'e9c014bf835507e6cc16b14ec2926f589480d847', parents: ["863230c82209c78e1ba0e7a61304f5197f00a77e"],
      author: "Dev Example <dev@example.com> 1775089800 +0900", committer: "Dev Example <dev@example.com> 1775089800 +0900",
      message: "Remove secrets from config"
    });
  }
  {
    const obj = await core.openLoose('e9c014bf835507e6cc16b14ec2926f589480d847', core.hexToBytes(scenario.objects['e9c014bf835507e6cc16b14ec2926f589480d847']));
    assert.deepEqual(core.parseTree(obj.body), [
      { mode: '100644', type: 'blob', name: 'README.md', hash: '053b492e8d60d6e8b50152bb2dbbf62b44d5b1ca' },
      { mode: '100644', type: 'blob', name: 'config.yml', hash: '8b056784a6207580608f107a09abadaf5f6c2af1' },
    ]);
  }
});
test('HEAD to parent tree to deleted config follows the real graph', async () => {
  assert.equal(Object.keys(scenario.objects).length, 7);
  const ref = '.git/' + scenario.files['.git/HEAD'].trim().slice(5);
  const open = hash => core.openLoose(hash, core.hexToBytes(scenario.objects[hash]));
  const current = core.parseCommit((await open(scenario.files[ref].trim())).body);
  const parent = core.parseCommit((await open(current.parents[0])).body);
  const oldTree = core.parseTree((await open(parent.tree)).body);
  const oldConfig = await open(oldTree.find(entry => entry.name === 'config.yml').hash);
  assert.ok(decode(oldConfig.body).includes(scenario.answer.password));
  assert.ok(decode(oldConfig.body).includes(scenario.answer.apiKey));
  const newTree = core.parseTree((await open(current.tree)).body);
  const newConfig = await open(newTree.find(entry => entry.name === 'config.yml').hash);
  assert.ok(!decode(newConfig.body).includes(scenario.answer.password));
});

test('real hashing and headers match A-5 and original samples', async () => {
  assert.equal(await core.hashObject('blob', utf8('Hello World\n')), '557db03de997c86a4a028e1ebd3a1ceb225be238');
  assert.equal(await core.hashObject('blob', utf8('')), 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391');
  assert.equal(await core.hashObject('tree', utf8('')), '4b825dc642cb6eb9a060e54bf8d69288fbee4904');
  assert.equal(decode(await core.inflate(await core.deflate(utf8('Hello World\n')))), 'Hello World\n');
  assert.equal(core.bytesToHex(core.encodeObject('blob', utf8('Hello World\n')).slice(0, 8)), '626c6f6220313200');
  for (const obj of SAMPLE_OBJECTS) assert.equal(await core.hashObject('blob', utf8(obj.content)), obj.hash);
  assert.equal(core.webCryptoAvailable(), true);
});

test('reference errors stay exact', async () => {
  assert.throws(() => core.hexToBytes('zz'), { message: 'notHex' });
  assert.throws(() => core.parseObject(utf8('blob 5')), { message: 'noHeader' });
  assert.throws(() => core.parseObject(utf8('blobx 1\0a')), { message: 'badHeader' });
  assert.throws(() => core.parseObject(utf8('blob 9\0abc')), { message: 'sizeMismatch' });
  await assert.rejects(core.inflate(core.hexToBytes('00112233')), { message: 'badZlib' });
  assert.deepEqual(core.hexToBytes(' A0\n ff '), new Uint8Array([160, 255]));
});

test('100 seeded byte arrays round trip through zlib', async () => {
  let seed = 0x3102;
  const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
  for (let n = 0; n < 100; n++) {
    const input = Uint8Array.from({ length: n === 0 ? 0 : next() % 2001 }, () => next() & 255);
    assert.deepEqual(await core.inflate(await core.deflate(input)), input);
    const raw = core.encodeObject('blob', input);
    assert.equal(decode(raw.slice(0, raw.indexOf(0))), 'blob ' + input.length);
    assert.deepEqual(core.parseObject(raw).body, input);
  }
});

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
