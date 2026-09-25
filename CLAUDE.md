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

- index.html: six tabs, accessible help dialog, strict meta CSP, translation bindings
- style.css: responsive light theme, contrast variables, reduced-motion support
- js/git-core.js: pure validation plus real SHA-1, zlib compression/decompression, and object parsing
- js/scenario-data.js: SCENARIO with three text files and seven real Git loose objects
- js/git-data.js: GIT_STRUCTURE and SAMPLE_OBJECTS
- js/i18n.js: Japanese/English dictionaries, language selection, DOM text and attribute bindings
- js/app.js: safe DOM rendering, tab and keyboard handling, scan state, comparison, and help

Scripts are classic scripts rather than ES modules so local file:// use needs no fetch or server. Core and data expose conditional CommonJS exports for Node tests.

## Features and State

1. Structure Viewer: 37 entries, 19 files, 18 folders; HIGH 10, MEDIUM 7, LOW 3. Folder state and hash copying.
2. Object Recovery: four fixed blob samples verified by actual hashing; real content hashing and loose-object decompression.
3. Leak Inspector: local simulation with 1x/2x/4x, pause/resume, immediate skip while paused, and reset.
4. Structure Compare: secure/insecure, private/public, and development/production presets.
5. History Investigation: HEAD → refs → commit → parent → tree → config.yml blob, with real decompression and SHA-1 verification.
6. CTF Hints: expandable educational command examples.

The new core exports hexToBytes, bytesToHex, deflate, inflate, sha1Hex, encodeObject, hashObject,
parseObject, parseCommit, parseTree, openLoose, and webCryptoAvailable. Hashing and zlib functions
return promises. Preserve the supplied reference functions and exact error messages.

SCENARIO is output from real Git with fixed author/timestamps: do not manually modify the
compressed bytes or regenerate them with different metadata. Seven object hashes, sizes, and
contents must agree with the README tables and tests. Fictional exercise answers are
Tr0ub4dor-3 and DEMO-KEY-NOT-REAL-7f3a9c; never replace them with realistic credentials.

Web APIs required: crypto.subtle (secure context), CompressionStream, DecompressionStream.
Use modern browsers on https, file://, or localhost. Missing APIs display a notice and disable
new operations without breaking original tabs. No polyfills or dependencies.

Calculation limits: 64 KiB UTF-8 including an optionally appended newline (default on);
128 KiB hexadecimal characters after removing whitespace. Error messages are translated.
Validate user-supplied tree framing before the unchanged reference parseTree function.
No arbitrary repository retrieval, network scanning, pack support, or dark theme.

Investigation state is memory-only: opened file, retrieved paths, hints, answer. Switching
languages preserves these, all inputs, decoded content, and calculation results.

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

## Investigation Known Answers

| Hash | Type | Size | Content summary |
|---|---|---|---|
| 053b492e8d60d6e8b50152bb2dbbf62b44d5b1ca | blob | 66 | # Demo App |
| 863230c82209c78e1ba0e7a61304f5197f00a77e | commit | 173 | Add app config |
| 8b056784a6207580608f107a09abadaf5f6c2af1 | blob | 93 | database: |
| 8cc967668c1a14b8f82064478caf03defd7cfd34 | tree | 75 | README.md, config.yml |
| b4719a20b17d401cc15d2321f34768f860aa8755 | blob | 104 | database: |
| d75f7af7e09183ce60c816274fa5e8d9e15e1fb7 | commit | 233 | Remove secrets from config |
| e9c014bf835507e6cc16b14ec2926f589480d847 | tree | 75 | README.md, config.yml |

Initial commit: 2026-04-01 10:00:00 +0900; current commit: 2026-04-02 09:30:00 +0900.
Use each recorded timezone offset, never the browser's local timezone.

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

Keep README.md, README.en.md, this guide, help, UI, and tests consistent. Both READMEs retain
matching 15 sections and reference five screenshots. Preserve the original three images;
only screenshot4.png (Japanese deleted config) and screenshot5.png (English real calculation)
are new. Preserve Japanese README metadata structure and existing source readability.
