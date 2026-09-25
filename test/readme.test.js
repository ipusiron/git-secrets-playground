'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { SAMPLE_OBJECTS } = require('../js/git-data');
const { blobHeader, objectPath } = require('../js/git-core');
const core = require('../js/git-core');
const scenario = require('../js/scenario-data');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const documents = ['README.md', 'README.en.md'];
const headings = [
  ['🌐 デモページ', '🌐 Demo'], ['📸 スクリーンショット', '📸 Screenshots'],
  ['✨ 機能', '✨ Features'], ['📖 使い方', '📖 Usage'],
  ['🔬 仕様と既知解答', '🔬 Specification and Known Answers'],
  ['🔒 Gitセキュリティベストプラクティス', '🔒 Git Security Best Practices'],
  ['📚 学べること', '📚 What You Can Learn'], ['🔗 関連リソース', '🔗 Related Resources'],
  ['🔒 このツールのセキュリティ', '🔒 Security of This Tool'], ['⚠️ 免責事項', '⚠️ Disclaimer'],
  ['🧪 テスト', '🧪 Tests'], ['📁 ディレクトリー構造', '📁 Directory Structure'],
  ['💻 動作環境', '💻 Requirements'], ['📄 ライセンス', '📄 License'],
  ['🛠️ このツールについて', '🛠️ About This Tool']
];

function filesAt(dir = '') {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true })
    .filter(entry => !['.git', '.claude'].includes(entry.name))
    .flatMap(entry => {
      const file = path.posix.join(dir, entry.name);
      return entry.isDirectory() ? filesAt(file) : [file];
    }).sort();
}

for (const [language, file] of documents.entries()) {
  const source = read(file);
  test(`${file}: four known answers agree with data and independent SHA-1`, () => {
    const section = source.split('## 🔬 ')[1].split('\n## ')[0];
    const rows = [...section.matchAll(/^\|[^\n]+\| `([a-f0-9]{40})` \| (\d+) \| `([^`]+)` \|$/gm)];
    assert.equal(rows.length, 4);
    rows.forEach((row, index) => {
      const sample = SAMPLE_OBJECTS[index];
      const bytes = Buffer.from(sample.content, 'utf8');
      const hash = crypto.createHash('sha1').update(blobHeader(bytes.length)).update(bytes).digest('hex');
      assert.equal(row[1], hash);
      assert.equal(row[1], sample.hash);
      assert.equal(Number(row[2]), bytes.length);
      assert.equal(Number(row[2]), sample.size);
      assert.equal(row[3], objectPath(hash));
    });
  });
  test(`${file}: exact section mapping and language link`, () => {
    assert.deepEqual([...source.matchAll(/^## (.+)$/gm)].map(m => m[1]), headings.map(row => row[language]));
    assert.ok(source.includes(language ? '日本語: [README.md](README.md)' : 'English: [README.en.md](README.en.md)'));
    assert.doesNotMatch(source, /フラグを完全復元される|全ての検査/);
  });
  test(`${file}: complete tree with aligned comments`, () => {
    const tree = source.split('## 📁 ')[1].match(/```\n([\s\S]+?)\n```/)[1].split('\n');
    const columns = tree.map(line => line.indexOf('#'));
    assert.ok(columns.every(column => column > 0 && column === columns[0]));
    assert.ok(tree.every(line => /# \S/.test(line)));
    assert.match(tree[0], /^git-secrets-playground\//);
    const parents = [];
    const listed = [];
    for (const line of tree.slice(1)) {
      const match = line.match(/^([│ ]*)(?:├──|└──) ([^#]+?)\s+#/);
      assert.ok(match, line);
      const depth = match[1].length / 4;
      const name = match[2].trim();
      parents.length = depth;
      if (name.endsWith('/')) parents[depth] = name.slice(0, -1);
      else listed.push([...parents, name].join('/'));
    }
    assert.deepEqual(listed.sort(), filesAt());
  });
  test(`${file}: exactly five real PNG references with accurate captions`, () => {
    const images = [...source.matchAll(/!\[[^\]]*\]\((assets\/[^)]+\.png)\)/g)].map(m => m[1]);
    assert.deepEqual(images, ['assets/screenshot.png', 'assets/screenshot2.png', 'assets/screenshot3.png',
      'assets/screenshot4.png', 'assets/screenshot5.png']);
    assert.deepEqual(images.slice().sort(), filesAt('assets').filter(name => name.endsWith('.png')));
    for (const image of images) {
      const png = fs.readFileSync(path.join(root, image));
      assert.equal(png.subarray(1, 4).toString(), 'PNG');
      assert.equal(png.readUInt32BE(16), 1280);
      assert.ok([1000, 1200].includes(png.readUInt32BE(20)));
      assert.ok(png.length <= 300 * 1024);
      assert.ok(source.includes(png.length.toLocaleString('en-US')));
    }
  });
  test(`${file}: seven scenario objects match actual decompression and hashes`, async () => {
    const section = source.split(language ? '### Investigation Data' : '### 履歴の調査のデータ')[1].split('\n### ')[0];
    const rows = [...section.matchAll(/^\| `([a-f0-9]{40})` \| (blob|tree|commit) \| (\d+) \| `([^`]+)` \|$/gm)];
    assert.equal(rows.length, 7);
    assert.deepEqual(rows.map(row => row[1]).sort(), Object.keys(scenario.objects).sort());
    for (const row of rows) {
      const obj = await core.openLoose(row[1], core.hexToBytes(scenario.objects[row[1]]));
      assert.equal(obj.matches, true);
      assert.equal(row[2], obj.type);
      assert.equal(Number(row[3]), obj.size);
      const summary = obj.type === 'commit' ? core.parseCommit(obj.body).message : obj.type === 'tree' ?
        core.parseTree(obj.body).map(entry => entry.name).join(', ') : new TextDecoder().decode(obj.body).split('\n')[0];
      assert.equal(row[4], summary);
      assert.ok(read('CLAUDE.md').includes('| ' + row[1] + ' | ' + row[2] + ' | ' + row[3] + ' | ' + summary + ' |'));
      assert.ok(read('index.html').includes('<td>' + row[1] + '</td><td>' + row[2] + '</td><td>' + row[3] + '</td>'));
    }
    assert.ok(source.includes(scenario.answer.password));
    assert.ok(source.includes(scenario.answer.apiKey));
    assert.ok(source.includes(language ? 'six tabs' : '6つのタブ'));
  });
}

test('original three screenshots are unchanged from the first release', () => {
  for (const file of ['assets/screenshot.png', 'assets/screenshot2.png', 'assets/screenshot3.png']) {
    const old = execFileSync('git', ['show', '5246c0b:' + file], { cwd: root, maxBuffer: 1024 * 1024 });
    assert.deepEqual(fs.readFileSync(path.join(root, file)), old);
  }
});

test('Japanese README metadata preserves HEAD identity and block lists', () => {
  const current = read('README.md').match(/^<!--[\s\S]*?-->/)[0];
  const previous = execFileSync('git', ['show', 'HEAD:README.md'], { cwd: root, encoding: 'utf8' });
  for (const key of ['id', 'slug', 'repo_url', 'demo_url', 'hub']) {
    const pattern = new RegExp(`^${key}: (.+)$`, 'm');
    assert.equal(current.match(pattern)[1], previous.match(pattern)[1]);
  }
  assert.match(current, /^id: day031$/m);
  assert.match(current, /^hub: true$/m);
  for (const key of ['tags', 'category_ja', 'category_en']) {
    assert.match(current, new RegExp(`^${key}:\\r?\\n  - \\S`, 'm'));
  }
  assert.equal(fs.readdirSync(path.join(root, 'test')).filter(name => name.endsWith('.test.js')).length, 6);
});
