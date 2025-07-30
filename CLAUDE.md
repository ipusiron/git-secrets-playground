# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Git Secrets Playground is an educational web application that demonstrates Git repository structure and security risks associated with exposed `.git` directories. It's part of the "100 Security Tools Created with Generative AI" project (Day 031).

## Development Commands

### Running the Application
```bash
# Open index.html directly in a browser - no build process required
# Alternatively, use a simple HTTP server:
python3 -m http.server 8000
# Then visit http://localhost:8000
```

### Deployment
The application is deployed via GitHub Pages at: https://ipusiron.github.io/git-secrets-playground/

## Architecture

This is a client-side only web application with no build process or dependencies:

### File Structure
- `index.html` - Main application structure with three tabs (Structure Viewer, Object Recovery, Leak Inspector)
- `script.js` - Handles tab switching and simulation logic
- `style.css` - Responsive design with dark theme
- `data/sample_git_structure.json` - Sample Git directory structure for visualization

### Key Implementation Areas

1. **Structure Viewer Tab**: Currently needs implementation to parse and display the tree structure from `sample_git_structure.json`

2. **Object Recovery Tab**: Placeholder implementation - needs:
   - SHA-1 hash validation
   - Simulated Git object parsing (blob/tree/commit)
   - Display logic for different object types

3. **Leak Inspector Tab**: Basic simulation exists, shows the attack chain when `.git/HEAD` is exposed

### Development Patterns
- Event-driven architecture with tab switching
- No external dependencies or frameworks
- All processing happens client-side
- Educational focus - all features are simulations, no actual Git operations

## Important Notes

- This is an educational tool - emphasize security awareness and responsible use
- All demonstrations are simulations without actual network requests
- The application should work entirely offline once loaded
- Maintain the simple, dependency-free architecture when adding features