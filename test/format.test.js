'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

for (const file of ['js/git-core.js', 'js/git-data.js', 'test/core.test.js', 'test/format.test.js']) {
  test(`readable new source: ${file}`, () => {
    const lines = fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => assert.ok([...line].length <= 160, `${file}:${index + 1}`));
  });
}

for (const [file, minimum] of [
  ['style.css', 1200], ['index.html', 300], ['script.js', 1000], ['js/git-core.js', 30], ['js/git-data.js', 80]
]) {
  test(`source line floor: ${file}`, () => {
    assert.ok(fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/).length >= minimum);
  });
}
