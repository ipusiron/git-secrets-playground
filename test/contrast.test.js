'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8');
const vars = Object.fromEntries([...css.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6});/gi)].map(m => [m[1], m[2]]));

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

for (const [foreground, background] of [
  ['risk-high', 'white'], ['risk-medium', 'white'], ['risk-low', 'white'], ['muted', 'white'],
  ['primary', 'footer-bg'], ['white', 'primary'], ['secondary', 'code-bg'], ['secondary', 'footer-bg'],
  ['secondary', 'notice-bg'], ['secondary', 'light-bg'], ['error', 'white'],
  ['white', 'success'], ['white', 'teal'], ['pink', 'light-bg']
]) {
  test(`contrast ${foreground}/${background} >= 4.5`, () => {
    const a = luminance(vars[foreground]);
    const b = luminance(vars[background]);
    assert.ok((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5);
  });
}
