'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { dictionaries, i18n } = require('../js/i18n.js');
const { SAMPLE_OBJECTS } = require('../js/git-data.js');
const root = path.join(__dirname, '..');
const japanese = new RegExp('[' + String.fromCodePoint(0x3040) + '-' + String.fromCodePoint(0x30ff) +
  String.fromCodePoint(0x4e00) + '-' + String.fromCodePoint(0x9fff) +
  String.fromCodePoint(0xff01) + '-' + String.fromCodePoint(0xff60) + ']');

test('dictionaries have matching keys, nonempty text and matching placeholders', () => {
  assert.deepEqual(Object.keys(dictionaries.ja).sort(), Object.keys(dictionaries.en).sort());
  for (const key of Object.keys(dictionaries.ja)) {
    assert.ok(dictionaries.ja[key].trim() && dictionaries.en[key].trim(), key);
    const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
    assert.deepEqual(placeholders(dictionaries.ja[key]), placeholders(dictionaries.en[key]), key);
    assert.doesNotMatch(dictionaries.en[key], japanese, key);
  }
  SAMPLE_OBJECTS.forEach(obj => assert.ok(dictionaries.ja[obj.descriptionKey]));
});

test('all JS and static HTML translation keys exist', () => {
  const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const keys = [...app.matchAll(/i18n\.t\('([^']+)'/g), ...html.matchAll(/data-i18n(?:-[\w-]+)?="([^"]+)"/g)];
  keys.forEach(m => assert.ok(dictionaries.ja[m[1]], m[1]));
});

test('Japanese literals live only in the dictionaries, excluding comments', () => {
  const tokens = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g;
  for (const file of fs.readdirSync(path.join(root, 'js')).filter(name => name !== 'i18n.js')) {
    const source = fs.readFileSync(path.join(root, 'js', file), 'utf8');
    const code = source.replace(tokens, token => token.startsWith('//') || token.startsWith('/*') ? '' : token);
    assert.doesNotMatch(code, japanese, file);
  }
});

test('unknown-hash hints describe only the four blob samples', () => {
  for (const lang of ['ja', 'en']) {
    for (let index = 25; index <= 28; index++) {
      const hint = dictionaries[lang]['app.' + index];
      assert.match(hint, /blob/i);
      assert.doesNotMatch(hint, /tree|commit/i);
    }
  }
  assert.equal(i18n.t('app.138', { p0: 4 }), '4個');
});
