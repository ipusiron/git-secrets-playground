'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

const sources = ['style.css', 'index.html', ...['js', 'test'].flatMap(dir =>
  fs.readdirSync(path.join(root, dir)).filter(file => file.endsWith('.js')).map(file => `${dir}/${file}`))];
for (const file of sources) {
  test(`readable new source: ${file}`, () => {
    const lines = fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/);
    const maximum = file === 'index.html' ? 250 : 160;
    lines.forEach((line, index) => assert.ok([...line].length <= maximum, `${file}:${index + 1}`));
  });
}

for (const [file, minimum] of [
  ['style.css', 1200], ['index.html', 300], ['js/app.js', 1000], ['js/git-core.js', 30], ['js/git-data.js', 80], ['js/i18n.js', 300]
]) {
  test(`source line floor: ${file}`, () => {
    assert.ok(fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/).length >= minimum);
  });
}
