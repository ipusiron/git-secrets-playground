'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('strict CSP, referrer and scripting fallback', () => {
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  assert.equal(csp, "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; " +
    "object-src 'none'; base-uri 'none'; form-action 'none'");
  assert.doesNotMatch(csp, /unsafe-inline|frame-ancestors/);
  assert.match(html, /name="referrer" content="no-referrer"/);
  assert.match(html, /<noscript\b[^>]*>/);
});

test('markup has no inline execution or presentation', () => {
  assert.doesNotMatch(html, /\sstyle\s*=/i);
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
});

test('classic scripts use safe DOM APIs and embedded data', () => {
  for (const file of fs.readdirSync(path.join(root, 'js'))) {
    const source = fs.readFileSync(path.join(root, 'js', file), 'utf8');
    assert.doesNotMatch(source, /innerHTML|insertAdjacentHTML|outerHTML\s*=|\.style\.|console\.log|fetch\(|onclick/, file);
  }
});

test('tabs, modal, labels, links and button types are accessible', () => {
  assert.match(html, /role="tablist"/);
  assert.equal((html.match(/role="tab"/g) || []).length, 5);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 5);
  assert.equal((html.match(/aria-selected="(?:true|false)"/g) || []).length, 5);
  assert.match(html, /role="dialog"[^>]*aria-labelledby="help-title"/);
  for (const match of html.matchAll(/<button\b[^>]*>/g)) assert.match(match[0], /type="button"/);
  for (const match of html.matchAll(/<label[^>]*for="([^"]+)"/g)) {
    assert.ok(html.includes(`id="${match[1]}"`), match[1]);
  }
  for (const match of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    assert.match(match[0], /rel="noopener noreferrer"/);
  }
});
