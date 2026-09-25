日本語: [README.md](README.md)

# Git Secrets Playground - Git Information Leak Simulator

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/git-secrets-playground?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/git-secrets-playground?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/git-secrets-playground)
![GitHub license](https://img.shields.io/github/license/ipusiron/git-secrets-playground)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/git-secrets-playground/)

**Day031 - 100 Security Tools Created with Generative AI**

What leaks when a `.git` directory is publicly accessible?

**Git Secrets Playground** is an educational simulator for exploring Git repository structure and exposure risks. All five tabs work locally through file://, with Japanese and English interfaces.

---

## 🌐 Demo

👉 [https://ipusiron.github.io/git-secrets-playground/](https://ipusiron.github.io/git-secrets-playground/)

---

## 📸 Screenshots

![Structure Viewer](assets/screenshot.png)

*Japanese structure statistics and risk-colored tree entries (1280×1000, 114,140 bytes).*

![Sensitive configuration recovery](assets/screenshot2.png)

*Japanese configuration recovery showing hash 3bb8dc0b…, size 169 bytes, and content (1280×1000, 92,900 bytes).*

![Leak scan results in English](assets/screenshot3.png)

*English leak scan results after skipping to completion (1280×1000, 234,199 bytes).*

---

## ✨ Features

### 🗂️ Structure Viewer

- Tree view of the internal `.git` directory hierarchy
- HIGH, MEDIUM, and LOW risk labels with distinct colors
- Expandable and collapsible folders
- Clickable object hashes with clipboard feedback
- File tooltips explaining their roles and risks
- Statistics for risk levels, files, and folders

### 🔍 Object Recovery (simulation)

- Four sample buttons: empty file, text, sensitive configuration, and Dockerfile
- Manual entry of a 40-digit SHA-1 hash; only the four known blobs can be recovered
- Results showing object type, size, path, description, and content
- Educational explanations of zlib compression and Git objects

### 🚨 Leak Inspector (simulation)

- Target URL input and preset buttons
- Options for `.git/HEAD`, `config`, `logs/HEAD`, `refs/`, and `objects/`
- Speeds of 1x, 2x, and 4x
- Pause, resume, skip, and reset controls; skipping also works while paused
- A progress indicator and simulated step-by-step findings
- Vulnerability details, impact summary, and suggested responses

### ⚖️ Structure Compare

- Three presets: secure vs. insecure, private vs. public, and development vs. production
- Side-by-side directory structures
- A comparison table of risk counts
- Recommendations explaining the differences

### 🚩 CTF Hints

- Investigation steps from discovering `.git` to gathering information
- References to GitHacker, git-dumper, and the Wayback Machine
- Patterns involving deleted flags, other branches, commit messages, and configuration secrets
- Practical command-line examples in expandable sections

### ❓ Help

- Detailed documentation and frequently asked questions
- Scrollable help content for desktop and mobile
- Close button, Escape key, and background-click dismissal

### 🌐 Language and keyboard support

- Header language switch preserving the active tab, expanded folders, recovered object, scan state, and comparison
- Language selection priority: `?lang=ja|en`, saved preference, then browser language
- Arrow keys, Home, and End for tabs; Tab with Enter or Space for other controls
- Focus containment in help and return to the opener after Escape
- Touch targets of at least 44px, 320px-wide layouts, and reduced-motion support

---

## 📖 Usage

### 📦 Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/ipusiron/git-secrets-playground.git
   cd git-secrets-playground
   ```

2. **Open directly or serve over HTTP**

   Open `index.html` in a browser (file:// is supported). For HTTP, run the following and visit `http://localhost:8000`.

   ```bash
   python -m http.server 8000
   ```

### 🎮 Basic operations

1. Use the help button to the right of the title for detailed explanations.
2. Select one of the five tabs.
3. Expand or collapse folders in Structure Viewer.
4. Enter a URL and choose a speed in Leak Inspector.
5. Select presets in Structure Compare.

### 💡 Frequently asked questions

**Q: Do I need a local server?**

A: No. Tree data is included in JavaScript, so all five tabs work over file://.

**Q: Does the leak scan access a real website?**

A: No. It is entirely simulated and never connects to the entered target.

**Q: Can I use a smartphone?**

A: Yes. The interface includes responsive layouts for mobile screens.

**Q: What if the help button does not respond?**

A: Check the browser console for JavaScript errors.

---

## 🔬 Specification and Known Answers

A Git blob hash is the SHA-1 of the byte sequence `blob <byte count>\0<content>`, using the UTF-8 content size. For example, `blobHeader(12)` is `626c6f6220313200` in hexadecimal. Loose objects use the first two hash characters as the directory and the remaining 38 as the filename.

| Description | Hash | Size (bytes) | Path |
|---|---|---|---|
| Empty file (such as .gitkeep) | `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` | 0 | `.git/objects/e6/9de29bb2d1d6434b8b29ae775ad8c2e48c5391` |
| Text file (Hello World and newline) | `557db03de997c86a4a028e1ebd3a1ceb225be238` | 12 | `.git/objects/55/7db03de997c86a4a028e1ebd3a1ceb225be238` |
| Configuration containing sensitive information | `3bb8dc0bbcd57a209018a4aa1c6d07db2edc75dd` | 169 | `.git/objects/3b/b8dc0bbcd57a209018a4aa1c6d07db2edc75dd` |
| Dockerfile | `df799688ee42b4d33e495ffa1a78469753c7dde9` | 263 | `.git/objects/df/799688ee42b4d33e495ffa1a78469753c7dde9` |

The previous configuration sample incorrectly used the empty-tree hash `4b825dc642cb6eb9a060e54bf8d69288fbee4904` and a size of 156 bytes. The Dockerfile's old hash `89e6c98cbe0ffaa2f1ce9e8c19ca7ee4ad51eb42` and size of 298 bytes were also incorrect; both samples now use the values recomputed from their content in the table above. The empty-tree hash itself is valid as the SHA-1 of `tree 0\0`.

The tree contains 37 entries: 19 files and 18 folders, with 10 HIGH, 7 MEDIUM, and 3 LOW risk entries. The sample content has not changed.

Recovery is a lookup of four fixed blob samples. The browser does not calculate real SHA-1 hashes, decompress zlib data, or recover arbitrary repositories, and the scan never connects to the supplied URL. Tests independently recompute the values using Node's crypto module.

---

## 🔒 Git Security Best Practices

### 🛡️ Prevention

**1. Prevent public access to .git**

```apache
# Apache (.htaccess)
<DirectoryMatch "^/.*/\.git/">
    Require all denied
</DirectoryMatch>

# Nginx
location ~ /\.git {
    deny all;
    return 403;
}
```

**2. Prevent committing sensitive files**

```bash
# Add sensitive files to .gitignore
echo "*.env" >> .gitignore
echo "config/secrets.yml" >> .gitignore
echo "*.key" >> .gitignore
echo ".env.*" >> .gitignore

# Configure git-secrets
git secrets --install
git secrets --register-aws
```

**3. Use pre-commit hooks**

```bash
# Example sensitive-data detection hook configuration
pip install pre-commit
echo "repos:" > .pre-commit-config.yaml
echo "  - repo: https://github.com/Yelp/detect-secrets" >> .pre-commit-config.yaml
echo "    hooks:" >> .pre-commit-config.yaml
echo "      - id: detect-secrets" >> .pre-commit-config.yaml
```

### 🚨 Incident response

First revoke and replace exposed credentials and assess the impact. Run the history-changing examples below only on repositories you administer, after backing up and coordinating with collaborators. Changing history cannot retrieve information that has already leaked.

**1. Remove committed secrets from history**

```bash
# Remove a file from history with git filter-branch
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch secret-file.txt' \
--prune-empty --tag-name-filter cat -- --all

# Alternatively, use BFG Repo-Cleaner
java -jar bfg.jar --delete-files secret-file.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

**2. Update the remote repository**

```bash
# Force-update branches and tags after coordination
git push origin --force --all
git push origin --force --tags
```

### 📋 Regular checks

- [ ] Web server access to `.git` is denied
- [ ] Appropriate `.gitignore` rules are in place
- [ ] Sensitive-data detection tools are configured
- [ ] Developers understand Git exposure risks
- [ ] Production deployments contain no `.git` directory

### 🔍 About .git/logs/HEAD

`.git/logs/HEAD` records movements of HEAD inside Git.

Its contents include:

- HEAD transitions such as checkout, commit, rebase, and reset
- The previous and new commit hashes
- The actor's name, email address, time, and action

If exposed, it can help recover past history and deleted flags.

| Exposed path | Impact |
|---|---|
| `.git/HEAD` | Medium risk: repository configuration information |
| `.git/logs/HEAD` | High risk: past secrets may be recoverable |

### 🕵️ Detection examples (Google Dorks)

```text
site:example.com inurl:.git
site:example.com filetype:git
intitle:"Index of" .git
inurl:.git/HEAD
inurl:.git/config
"[core]" "repositoryformatversion" site:example.com
```

Use these examples only for authorized educational work. Never scan a site without permission.

---

## 📚 What You Can Learn

- The internal structure of `.git/` and the role of its files
- Git blob, tree, and commit objects and recovery concepts
- Consequences of leaving `.git` on a public server
- Typical Git-related CTF challenge patterns
- Prevention, detection, and incident response measures

---

## 🔗 Related Resources

### Tools by the author

- [Dork Watcher](https://ipusiron.github.io/dork-watcher/)
  - Supports the `site:example.com inurl:.git` query

### Walkthrough

- [GitRoot:1 Walkthrough (VulnHub, Japanese)](https://akademeia.info/?p=27143)

---

## 🔒 Security of This Tool

The interface uses DOM APIs and `textContent`, with no HTML-string insertion, inline handlers, or style attributes. The meta CSP is:

```text
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'none'
```

There are no external APIs, CDNs, fonts, or package dependencies. The app makes no requests to external hosts; reference links are opened only when the user chooses them. The only localStorage key is `gitsecrets-language`, and all features remain usable if storage access is blocked. README badges are external images displayed by GitHub, not app requests.

---

## ⚠️ Disclaimer

This tool is provided for educational purposes. Do not access a real website's `.git` directory, inspect it, or otherwise use these techniques without authorization.

---

## 🧪 Tests

```bash
npm test
```

No package installation is required. GitHub Actions runs the suite on Node 22 for both push and pull_request.

| File | Checks |
|---|---|
| core.test.js | Real blob SHA-1, UTF-8 size, path, statistics, and URL validation |
| i18n.test.js | Dictionary keys, empty values, used keys, and Japanese literals |
| html.test.js | CSP, ARIA, labels, external links, and forbidden APIs |
| contrast.test.js | Text contrast of at least 4.5:1 for specified colors |
| format.test.js | Minimum line counts and maximum line lengths |
| readme.test.js | Known answers, YAML, file tree, headings, and image references |

Sample contents are also compared with the source at the original commit `bbecd38`. Fetch that history before testing a shallow clone.

---

## 📁 Directory Structure

```
git-secrets-playground/           # Project root
├── .github/                      # GitHub configuration
│   └── workflows/                # GitHub Actions workflows
│       └── test.yml              # Run npm test on Node 22 for push and pull_request
├── .gitignore                    # Exclude .claude/ from Git
├── .nojekyll                     # Disable Jekyll on GitHub Pages
├── CLAUDE.md                     # Development guide: architecture, rules, and tests
├── LICENSE                       # MIT license
├── README.md                     # Japanese usage, specification, known answers, and tests
├── README.en.md                  # English README with matching sections
├── package.json                  # Dependency-free npm test (node --test)
├── index.html                    # Five tabs, help, and meta CSP
├── style.css                     # Color variables, responsive layout, and animation
├── assets/                       # README images
│   ├── screenshot.png            # Structure statistics and risk colors
│   ├── screenshot2.png           # Sensitive configuration sample recovery
│   └── screenshot3.png           # Leak scan results in English
├── js/                           # Classic scripts compatible with file://
│   ├── git-core.js               # Pure hash, path, statistics, and URL functions
│   ├── git-data.js               # .git structure and samples with verified hashes
│   ├── app.js                    # Five tabs, scan state, comparison, and help
│   └── i18n.js                   # Japanese/English dictionaries, help, CTF hints, and switching
└── test/                         # Automated tests using node --test
    ├── core.test.js              # Core, data, and sample SHA-1 recomputation
    ├── i18n.test.js              # Dictionary keys and untranslated Japanese literals
    ├── html.test.js              # Static CSP, ARIA, and DOM API checks
    ├── contrast.test.js          # Color contrast of at least 4.5:1
    ├── format.test.js            # Line length and count checks against minification
    └── readme.test.js            # Known answers, YAML, tree, headings, and images
```

---

## 💻 Requirements

Use a current Chrome, Edge, Firefox, or Safari with JavaScript enabled. Both file:// and local HTTP are supported, without a build step or server-side logic. Automated tests use Node 22; browser verification uses the existing Python Playwright and Chromium installation.

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---

## 🛠️ About This Tool

This tool is part of the **100 Security Tools Created with Generative AI** project. The project uses AI assistance to create and publish security-related tools over 100 days.

For project details and other tools, see:

🔗 [https://akademeia.info/?page_id=42163](https://akademeia.info/?page_id=42163)
