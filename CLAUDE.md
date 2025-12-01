# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Git Secrets Playground is an educational web application that demonstrates Git repository structure and security risks associated with exposed `.git` directories. It's part of the "100 Security Tools Created with Generative AI" project (Day 031).

## Development Commands

### Running the Application
```bash
# IMPORTANT: Must use a local server due to fetch() for JSON data
python3 -m http.server 8000
# or
npx http-server -p 8000
# Then visit http://localhost:8000
```

Opening `index.html` directly will cause CORS errors when loading `sample_git_structure.json`.

### Deployment
GitHub Pages: https://ipusiron.github.io/git-secrets-playground/

## Architecture

Client-side only web application with zero dependencies (pure HTML/CSS/JavaScript ES6+).

### Core Files
- `index.html` - UI structure with 5 tabs + help modal
- `script.js` - All application logic (~700 lines)
- `style.css` - Responsive dark theme with animations
- `data/sample_git_structure.json` - Tree data with risk levels per file

### Tab Features (All Implemented)

1. **Structure Viewer** - Renders `.git` directory tree from JSON with:
   - Collapsible folders (`toggleFolder()`)
   - Risk level badges (HIGH/MEDIUM/LOW)
   - Hash file click-to-copy with toast notifications
   - Statistics panel

2. **Object Recovery** - Simulates Git object lookup:
   - 4 hardcoded sample hashes that return mock object data
   - SHA-1 validation (40 hex chars)
   - Other hashes show educational "not found" message

3. **Leak Inspector** - Attack chain simulation:
   - Configurable scan options and speed (1x/2x/4x)
   - Pause/resume/skip controls
   - Progress bar with step-by-step animation
   - No actual network requests

4. **Structure Compare** - Side-by-side `.git` comparison:
   - 3 presets (secure vs insecure, private vs public, dev vs prod)
   - Risk analysis table and recommendations

5. **CTF Hints** - Static reference for CTF Git challenges

### Key Patterns
- `escapeHtml()` for XSS prevention on user input
- Async state management for scan simulation (`scanState` object)
- Recursive DOM generation for tree rendering
- Accordion toggle pattern for collapsible sections

## Security Considerations

- Content Security Policy set in `<meta>` tag
- User inputs are HTML-escaped before DOM insertion
- All features are simulations - no external requests
- Educational tool - emphasize responsible disclosure when discussing real vulnerabilities