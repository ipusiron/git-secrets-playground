# CLAUDE.md

This file provides guidance to Claude Code and other coding agents working in this repository.

## Project Overview

Git Secrets Playground is a dependency-free educational simulator of exposed Git directories, part of Day031 of "100 Security Tools Created with Generative AI". It never connects to scan targets.

## Development Commands

Open index.html directly through file://, or run:

```bash
python -m http.server 8000
npm test
```

No npm install or build step is needed. Tests use Node 22. CI runs on push and pull_request with full Git history, because sample contents are checked against commit bbecd38.

GitHub Pages: https://ipusiron.github.io/git-secrets-playground/

## Architecture

- index.html: five tabs, accessible help dialog, strict meta CSP, translation bindings
- style.css: responsive light theme, contrast variables, reduced-motion support
- js/git-core.js: pure hash validation, object paths, blob headers, tree statistics, and URL validation
- js/git-data.js: GIT_STRUCTURE and SAMPLE_OBJECTS
- js/i18n.js: Japanese/English dictionaries, language selection, DOM text and attribute bindings
- js/app.js: safe DOM rendering, tab and keyboard handling, scan state, comparison, and help

Scripts are classic scripts rather than ES modules so local file:// use needs no fetch or server. Core and data expose conditional CommonJS exports for Node tests.

## Features and State

1. Structure Viewer: 37 entries, 19 files, 18 folders; HIGH 10, MEDIUM 7, LOW 3. Folder state and hash copying.
2. Object Recovery: lookup of four fixed blob samples, never arbitrary objects or actual decompression.
3. Leak Inspector: local simulation with 1x/2x/4x, pause/resume, immediate skip while paused, and reset.
4. Structure Compare: secure/insecure, private/public, and development/production presets.
5. CTF Hints: expandable educational command examples.

Scan state is idle/running/paused/completed/skipped with one timer. Language switching preserves the active tab, folders, recovery result, scan progress/result, and comparison.

## Samples and Known Answers

The hashes are real Git blob hashes calculated from the unchanged sample content. Tests independently recompute SHA-1 using node:crypto over blobHeader(UTF-8 size) plus content.

| Sample | Hash | Bytes |
|---|---|---|
| Empty file | e69de29bb2d1d6434b8b29ae775ad8c2e48c5391 | 0 |
| Hello World with newline | 557db03de997c86a4a028e1ebd3a1ceb225be238 | 12 |
| Sensitive configuration | 3bb8dc0bbcd57a209018a4aa1c6d07db2edc75dd | 169 |
| Dockerfile | df799688ee42b4d33e495ffa1a78469753c7dde9 | 263 |

Loose objects are stored at .git/objects/<first 2 characters>/<remaining 38 characters>. The empty tree hash is 4b825dc642cb6eb9a060e54bf8d69288fbee4904; it is not the configuration blob. Never change sample contents or expected values to make tests pass.

## Internationalization

All interface text, tooltips, errors, help, CTF explanations, and sample descriptions belong in js/i18n.js. Both dictionaries must have identical nonempty keys and matching placeholders. Do not add Japanese literals to other JS files, except comments and the explicitly untranslated sample contents and command examples.

Use data-i18n for static text and data-i18n-title, data-i18n-aria-label, and data-i18n-placeholder for attributes. Include hidden content. Update document title and html lang.

Priority: ?lang=ja|en, then localStorage key gitsecrets-language, then navigator.language (ja prefix means Japanese). Wrap storage reads and writes in try/catch. No other data is stored.

## Security and Accessibility

Use createElement, textContent, append, and replaceChildren. No innerHTML, insertAdjacentHTML, outerHTML assignment, inline handlers, style attributes, JS .style assignments, console.log, fetch, external fonts, APIs, CDNs, or dependencies.

Keep the exact meta CSP:

```text
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'none'
```

Do not add unsafe-inline or frame-ancestors to meta CSP. Keep no-referrer, bilingual noscript, button types, external link rel attributes, tab roles and roving focus, and dialog focus containment/restoration.

Verify HTTP and file://, both languages, widths 1280/768/390/320 (mobile contexts for 390/320), centered h1, 44px targets, text contrast at least 4.5:1, no horizontal page overflow, blocked storage, and keyboard-only operation.

## Tests and Documentation

Six Node test files:

- core.test.js: reference functions, SHA-1, unchanged sample bytes, object paths, statistics, URL validation
- i18n.test.js: dictionary parity, values/placeholders, used keys, Japanese literal restrictions, blob-only hints
- html.test.js: CSP, safe DOM restrictions, ARIA, labels, links, and buttons
- contrast.test.js: CSS variable contrast pairs
- format.test.js: source line count floors and maximum line lengths
- readme.test.js: known-answer tables, YAML metadata, complete commented tree, matching headings, image references

Keep README.md, README.en.md, this guide, help, UI, and tests consistent. The two READMEs have matching 15 sections and reference exactly three screenshots. Preserve the Japanese README metadata and existing source readability.
