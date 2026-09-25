'use strict';

// All visible content is created as nodes; user input is never parsed as markup.
function element(tag, text = '', className = '') {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

function button(text, action, className = '') {
  const node = element('button', text, className);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

function byId(id) {
  return document.getElementById(id);
}

function list(items, ordered = false) {
  const node = element(ordered ? 'ol' : 'ul');
  items.forEach(text => node.append(element('li', text)));
  return node;
}

// Keep tabs and input values in place when rendering their contents.
document.querySelectorAll('.tab-button').forEach(control => {
  control.addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach(tab => {
      tab.classList.toggle('active', tab === control);
      tab.setAttribute('aria-selected', String(tab === control));
      tab.tabIndex = tab === control ? 0 : -1;
    });
    document.querySelectorAll('.tab-content').forEach(panel => {
      panel.classList.toggle('active', panel.id === control.dataset.tab);
    });
  });
});

document.querySelector('.tab-nav').addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const tabs = [...document.querySelectorAll('.tab-button')];
  const current = tabs.indexOf(document.activeElement);
  if (current < 0) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 :
    (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  tabs[next].click();
  tabs[next].focus();
});

const collapsedFolders = new Set();

function riskBadge(risk) {
  const icons = { high: '💥', medium: '💣', low: '⚠️' };
  return element('span', `${icons[risk]} [${risk.toUpperCase()} RISK]`, `risk-badge risk-${risk}`);
}

function renderTree(node, path = '.git', prefix = '', isLast = true, parentHash = '') {
  const wrapper = element('div', '', 'tree-node');
  const row = element('div', '', 'tree-row');
  const branch = path === '.git' ? '' : prefix + (isLast ? '└── ' : '├── ');
  row.append(element('span', branch, 'tree-branch'));
  const children = element('div', '', 'folder-children');
  children.id = 'folder-' + path.replace(/[^a-zA-Z0-9-]/g, '-');
  children.hidden = collapsedFolders.has(path);

  if (node.children && node.children.length) {
    const toggle = button(children.hidden ? '📁 ▶' : '📁 ▼', () => {
      children.hidden = !children.hidden;
      if (children.hidden) collapsedFolders.add(path);
      else collapsedFolders.delete(path);
      toggle.textContent = children.hidden ? '📁 ▶' : '📁 ▼';
      toggle.setAttribute('aria-expanded', String(!children.hidden));
    }, 'folder-toggle');
    toggle.dataset.folder = path;
    toggle.setAttribute('aria-expanded', String(!children.hidden));
    toggle.setAttribute('aria-controls', children.id);
    toggle.setAttribute('aria-label', i18n.t('app.0', { p0: node.name }));
    row.append(toggle);
  } else {
    row.append(element('span', node.type === 'folder' ? '📁 ' : '📄 '));
  }

  const isHashFile = /^[0-9a-f]{38}$/.test(node.name) && parentHash;
  if (isHashFile) {
    const hash = parentHash + node.name;
    const copy = button(node.name, () => copyHash(hash), 'hash-clickable');
    copy.title = i18n.t('app.1', { p0: hash });
    row.append(copy);
  } else {
    const name = element('span', node.name, 'file-tooltip');
    name.title = getDetailedTooltip(node.name, node.risk);
    row.append(name);
  }

  if (node.risk) {
    row.append(riskBadge(node.risk));
    const description = element('div', getRiskDescription(node.name), 'tree-description');
    row.append(description);
  }
  wrapper.append(row);

  if (node.children) {
    const nextPrefix = prefix + (isLast ? '    ' : '│   ');
    const currentHash = /^[0-9a-f]{2}$/.test(node.name) ? node.name : parentHash;
    node.children.forEach((child, index) => {
      children.append(renderTree(child, `${path}/${child.name}`, nextPrefix, index === node.children.length - 1, currentHash));
    });
    wrapper.append(children);
  }
  return wrapper;
}

let toastTimer;
function showToast(text, failed = false) {
  clearTimeout(toastTimer);
  let toast = byId('copy-feedback');
  if (!toast) {
    toast = element('div', '', 'copy-toast');
    toast.id = 'copy-feedback';
    toast.setAttribute('aria-live', 'polite');
    document.body.append(toast);
  }
  toast.classList.toggle('toast-error', failed);
  toast.textContent = text;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4000);
}

async function copyHash(hash) {
  const success = i18n.t('app.2', { p0: hash.slice(0, 8) });
  try {
    await navigator.clipboard.writeText(hash);
    showToast(success);
  } catch {
    const input = element('textarea', '', 'clipboard-fallback');
    const focused = document.activeElement;
    input.value = hash;
    document.body.append(input);
    input.select();
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }
    input.remove();
    if (focused) focused.focus();
    showToast(copied ? success : i18n.t('app.3'), !copied);
  }
}

function generateStatistics(node) {
  return GitCore.treeStats(node);
}

function renderStatistics(stats) {
  const panel = element('div', '', 'statistics-panel');
  panel.append(element('h3', i18n.t('app.4')));
  const grid = element('div', '', 'stats-grid');
  const rows = [
    [stats.files + stats.folders, i18n.t('app.5'), i18n.t('app.6', { p0: stats.folders, p1: stats.files }), ''],
    [stats.high, 'HIGH RISK', i18n.t('app.7'), 'risk-high'],
    [stats.medium, 'MEDIUM RISK', i18n.t('app.8'), 'risk-medium'],
    [stats.low, 'LOW RISK', i18n.t('app.9'), 'risk-low']
  ];
  rows.forEach(([count, label, detail, className]) => {
    const item = element('div', '', `stat-item ${className}`);
    item.append(element('div', String(count), 'stat-value'));
    item.append(element('div', label, 'stat-label'));
    item.append(element('div', detail, 'stat-detail'));
    grid.append(item);
  });
  panel.append(grid);
  panel.append(element('div', i18n.t('app.10', { p0: stats.high + stats.medium + stats.low }), 'risk-summary'));
  return panel;
}

function loadGitStructure() {
  byId('statistics-panel').replaceChildren(renderStatistics(GitCore.treeStats(GIT_STRUCTURE)));
  byId('git-tree').replaceChildren(renderTree(GIT_STRUCTURE));
}

function getSampleDescriptions() {
  return [
  i18n.t('app.11'),
  i18n.t('app.12'),
  i18n.t('app.13'),
  i18n.t('app.14')
];
}
let sampleDescriptions = getSampleDescriptions();

let recoveredHash = null;

function toggleAccordion(id) {
  const content = byId(id);
  content.hidden = !content.hidden;
  const icon = byId(id + '-icon');
  if (icon) icon.textContent = content.hidden ? '▼' : '▲';
  document.querySelectorAll(`[aria-controls="${id}"]`).forEach(control => {
    control.setAttribute('aria-expanded', String(!content.hidden));
  });
}

function recoveryMethods(hash) {
  const wrapper = element('div', '', 'recovery-methods');
  const header = button(i18n.t('app.15'), () => toggleAccordion('method-details'), 'accordion-header');
  const detail = element('div', '', 'accordion-content');
  detail.id = 'method-details';
  detail.hidden = true;
  header.setAttribute('aria-expanded', 'false');
  header.setAttribute('aria-controls', detail.id);
  detail.append(element('p', i18n.t('app.16')));
  const sections = [
    [i18n.t('app.17'),
      `curl -s https://target.com/${GitCore.objectPath(hash)} -o object_file\n` +
      `wget https://target.com/${GitCore.objectPath(hash)} -O object_file`],
    [i18n.t('app.18'),
      `python3 -c "import zlib; print(zlib.decompress(open('object_file', 'rb').read()).decode('utf-8', errors='ignore'))"\n` +
      `ruby -e "require 'zlib'; puts Zlib.inflate(File.binread('object_file'))"\nopenssl zlib -d -in object_file`],
    [i18n.t('app.19'), `git cat-file -p ${hash}\ngit cat-file -t ${hash}\ngit cat-file -s ${hash}`],
    [i18n.t('app.20'), 'python3 GitHack.py https://target.com/.git/\n' +
      'git-dumper https://target.com/.git/ output_dir\n./rip-git.pl -v -u https://target.com/.git/']
  ];
  sections.forEach(([title, code]) => {
    detail.append(element('h4', title), element('pre', code));
  });
  detail.append(element('p', i18n.t('app.21'), 'warning-box'));
  wrapper.append(header, detail);
  return wrapper;
}

function renderRecovery() {
  const output = byId('object-output');
  output.replaceChildren();
  if (recoveredHash === null) return;
  const hash = recoveredHash;
  if (!GitCore.isValidHash(hash)) {
    output.append(element('p', i18n.t('app.22'), 'error-message'));
    return;
  }
  const index = SAMPLE_OBJECTS.findIndex(obj => obj.hash === hash);
  if (index === -1) {
    output.append(element('p', i18n.t('app.23', { p0: hash }), 'error-message'));
    output.append(element('p', i18n.t('app.24')));
    const hints = [i18n.t('app.25'), i18n.t('app.26'), i18n.t('app.27'), i18n.t('app.28')];
    output.append(list(SAMPLE_OBJECTS.map((obj, i) => `${obj.hash} (${hints[i]})`)));
    return;
  }
  const obj = SAMPLE_OBJECTS[index];
  output.append(element('h3', i18n.t('app.29'), 'recovery-success'));
  const metadata = element('dl', '', 'object-metadata');
  const fields = [
    ['SHA-1', obj.hash], ['Type', obj.type], ['Size', `${obj.size} bytes`],
    ['Description', sampleDescriptions[index]], ['Path', GitCore.objectPath(obj.hash)]
  ];
  fields.forEach(([label, value]) => {
    metadata.append(element('dt', label), element('dd', value));
  });
  output.append(metadata, element('h4', 'Content'));
  if (index === 2) output.append(element('p', i18n.t('app.30'), 'error-message'));
  output.append(element('pre', obj.content || '(empty file)', 'object-content'));
  output.append(element('p', i18n.t('app.31'), 'simulation-notice'));
  if (index === 2) {
    output.append(element('p', i18n.t('app.32'), 'warning-box'));
  }
  output.append(recoveryMethods(hash));
}

document.querySelectorAll('.sample-button').forEach(control => {
  control.addEventListener('click', () => {
    byId('object-hash').value = control.dataset.hash;
    byId('object-hash').focus();
    byId('object-hash').select();
  });
});

byId('recover-object').addEventListener('click', () => {
  recoveredHash = GitCore.normalizeHash(byId('object-hash').value);
  renderRecovery();
});

byId('clear-hash').addEventListener('click', () => {
  byId('object-hash').value = '';
  recoveredHash = null;
  renderRecovery();
  byId('object-hash').focus();
});

document.querySelectorAll('[data-accordion]').forEach(control => {
  control.addEventListener('click', () => toggleAccordion(control.dataset.accordion));
});

byId('help-button').addEventListener('click', () => {
  byId('help-modal').hidden = false;
  document.body.classList.add('modal-open');
  byId('close-help-modal').focus();
});

function closeHelp() {
  byId('help-modal').hidden = true;
  document.body.classList.remove('modal-open');
  byId('help-button').focus();
}

byId('close-help-modal').addEventListener('click', closeHelp);
byId('help-modal').addEventListener('click', event => {
  if (event.target === byId('help-modal')) closeHelp();
});
document.addEventListener('keydown', event => {
  if (byId('help-modal').hidden) return;
  if (event.key === 'Escape') closeHelp();
  if (event.key !== 'Tab') return;
  const controls = [...byId('help-modal').querySelectorAll('button, a[href], input, [tabindex="0"]')]
    .filter(control => control.getClientRects().length && !control.disabled);
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

// CTF reference sections remain expanded initially, and support keyboard folding.
document.querySelectorAll('.ctf-category').forEach((category, index) => {
  const heading = category.querySelector('h3');
  if (!heading) return;
  const content = element('div');
  content.id = 'ctf-details-' + index;
  while (heading.nextSibling) content.append(heading.nextSibling);
  const control = button('', () => toggleAccordion(content.id), 'ctf-accordion');
  control.append(...heading.childNodes);
  control.setAttribute('aria-controls', content.id);
  control.setAttribute('aria-expanded', 'true');
  heading.replaceChildren(control);
  category.append(content);
});

// The scan is a local animation over fixed educational steps, never a request.
// A single timer and state enum prevent stale resumes and repeated summaries.
const scan = {
  state: 'idle',
  url: '',
  options: {},
  steps: [],
  index: 0,
  timer: null
};

function getScanFindings() {
  return {
  head: ['.git/HEAD', '✅', i18n.t('app.33'), 'success', i18n.t('app.34')],
  config: ['.git/config', '🔍', i18n.t('app.35'), 'info', i18n.t('app.36')],
  logs: ['.git/logs/HEAD', '📜', i18n.t('app.37'), 'warning', i18n.t('app.38')],
  refs: ['.git/refs/', '🌿', i18n.t('app.39'), 'info', i18n.t('app.40')],
  objects: ['.git/objects/', '📦', i18n.t('app.41'), 'warning', i18n.t('app.42')]
};
}
let scanFindings = getScanFindings();


function makeScanSteps() {
  const steps = [{ icon: '🎯', text: i18n.t('app.43', { p0: scan.url }), type: 'info' }];
  Object.entries(scanFindings).forEach(([key, finding]) => {
    if (!scan.options[key]) return;
    steps.push({ icon: '📡', text: i18n.t('app.44', { p0: scan.url.replace(/\/$/, ''), p1: finding[0] }), type: 'scan' });
    steps.push({ icon: finding[1], text: finding[2], type: finding[3] });
    if (key === 'objects') {
      steps.push({ icon: '💾', text: i18n.t('app.45'), type: 'danger' });
    }
  });
  steps.push({ icon: '🚨', text: i18n.t('app.46'), type: 'danger' });
  return steps;
}

function stopScanTimer() {
  clearTimeout(scan.timer);
  scan.timer = null;
}

function scheduleScan() {
  stopScanTimer();
  if (scan.state !== 'running') return;
  const radio = document.querySelector('input[name="scan-speed"]:checked');
  const speed = Number(radio.value);
  scan.timer = setTimeout(() => {
    if (scan.state !== 'running') return;
    scan.index++;
    if (scan.index >= scan.steps.length) scan.state = 'completed';
    renderScan();
    scheduleScan();
  }, 800 / speed);
}

function startNewScan() {
  const url = byId('target-url').value.trim();
  if (!GitCore.isHttpUrl(url)) return;
  stopScanTimer();
  scan.url = url;
  scan.options = Object.fromEntries(Object.keys(scanFindings).map(key => [key, byId('check-' + key).checked]));
  scan.steps = makeScanSteps();
  scan.index = 1;
  scan.state = 'running';
  renderScan();
  scheduleScan();
}

function pauseScan() {
  if (scan.state !== 'running') return;
  stopScanTimer();
  scan.state = 'paused';
  renderScan();
}

function resumeScan() {
  if (scan.state !== 'paused') return;
  scan.state = 'running';
  renderScan();
  scheduleScan();
}

function skipScan() {
  if (!['running', 'paused'].includes(scan.state)) return;
  stopScanTimer();
  scan.index = scan.steps.length;
  scan.state = 'skipped';
  renderScan();
}

function resetScan() {
  stopScanTimer();
  scan.state = 'idle';
  scan.steps = [];
  scan.index = 0;
  renderScan();
}

function renderScanSummary() {
  const summary = element('div', '', 'scan-summary');
  summary.append(element('h3', i18n.t('app.47')));
  const risks = Object.keys(scanFindings).filter(key => scan.options[key]).map(key => scanFindings[key][4]);
  const grid = element('div', '', 'risk-summary-grid');
  [[risks.length, i18n.t('app.48')], [risks.length, i18n.t('app.49')], ['HIGH', i18n.t('app.50')]].forEach(([count, title]) => {
    const item = element('div', '', 'risk-stat');
    item.append(element('div', String(count), 'risk-number'), element('div', title, 'risk-label'));
    grid.append(item);
  });
  summary.append(grid, element('h4', i18n.t('app.51')), list(risks));
  summary.append(element('h4', i18n.t('app.52')));
  summary.append(list([
    i18n.t('app.53'),
    i18n.t('app.54'),
    i18n.t('app.55'),
    i18n.t('app.56'),
    i18n.t('app.57')
  ]));
  summary.append(element('h4', i18n.t('app.58')));
  summary.append(list([
    i18n.t('app.59'),
    i18n.t('app.60'),
    i18n.t('app.61'),
    i18n.t('app.62'),
    i18n.t('app.63')
  ], true));
  summary.append(element('p', i18n.t('app.64'), 'simulation-notice'));
  const reset = button(i18n.t('app.65'), resetScan);
  reset.id = 'reset-scan';
  summary.append(reset);
  return summary;
}

function updateScanControls() {
  const running = scan.state === 'running';
  const paused = scan.state === 'paused';
  const active = running || paused;
  const control = byId('simulate-leak');
  control.disabled = !active && !GitCore.isHttpUrl(byId('target-url').value);
  control.textContent = running ? i18n.t('app.66') : paused ? i18n.t('app.67') : i18n.t('app.68');
  control.dataset.state = scan.state;
  byId('pause-scan').hidden = !running;
  byId('resume-scan').hidden = !paused;
  byId('skip-scan').hidden = !active;
  byId('scan-progress-container').hidden = scan.state === 'idle';
  Object.keys(scanFindings).forEach(key => { byId('check-' + key).disabled = active; });
  byId('target-url').disabled = active;
  document.querySelectorAll('.preset-url-btn').forEach(control => { control.disabled = active; });
}

function renderScan() {
  updateScanControls();
  const output = byId('leak-result');
  output.replaceChildren();
  if (scan.state === 'idle') {
    const initial = element('div', '', 'initial-message');
    initial.append(element('h3', i18n.t('app.69')));
    initial.append(element('p', i18n.t('app.70')));
    initial.append(element('p', i18n.t('app.71'), 'warning-box'));
    output.append(initial);
    return;
  }
  const progress = byId('progress-bar');
  progress.max = scan.steps.length;
  progress.value = scan.index;
  byId('progress-percentage').textContent = `${Math.round(scan.index / scan.steps.length * 100)}%`;
  byId('step-counter').textContent = `${scan.index} / ${scan.steps.length}`;
  byId('progress-text').textContent = scan.state === 'paused' ? i18n.t('app.72') :
    scan.index === scan.steps.length ? i18n.t('app.73') : i18n.t('app.74');
  byId('current-step').textContent = scan.index === scan.steps.length ? i18n.t('app.75') : scan.steps[scan.index - 1].text;
  const steps = element('div', '', 'scan-progress');
  steps.id = 'leak-steps';
  scan.steps.slice(0, scan.index).forEach(step => {
    const row = element('div', '', `scan-step scan-step-${step.type}`);
    row.append(element('span', step.icon, 'step-icon'), element('span', step.text, 'step-text'));
    steps.append(row);
  });
  output.append(steps);
  if (['completed', 'skipped'].includes(scan.state)) output.append(renderScanSummary());
}

byId('target-url').addEventListener('input', updateScanControls);
document.querySelectorAll('.preset-url-btn').forEach(control => {
  control.addEventListener('click', () => {
    byId('target-url').value = control.dataset.url;
    updateScanControls();
  });
});
byId('simulate-leak').addEventListener('click', () => {
  if (scan.state === 'running') pauseScan();
  else if (scan.state === 'paused') resumeScan();
  else startNewScan();
});
byId('pause-scan').addEventListener('click', pauseScan);
byId('resume-scan').addEventListener('click', resumeScan);
byId('skip-scan').addEventListener('click', skipScan);
document.querySelectorAll('input[name="scan-speed"]').forEach(control => {
  control.addEventListener('change', scheduleScan);
});



function getRiskDescription(name) {
  const risks = {
    'HEAD': i18n.t('app.76'),
    'config': i18n.t('app.77'),
    'objects': i18n.t('app.78'),
    'refs': i18n.t('app.79'),
    'index': i18n.t('app.80'),
    'logs': i18n.t('app.81'),
    'packed-refs': i18n.t('app.82'),
    'description': i18n.t('app.83'),
    'exclude': i18n.t('app.84')
  };

  // ファイル名からキーを探す
  for (const [key, desc] of Object.entries(risks)) {
    if (name.includes(key)) {
      return desc;
    }
  }

  // オブジェクトファイルの場合（フォルダ名が2文字の16進数、またはファイル名が38文字の16進数）
  if (name.match(/^[0-9a-f]{2}$/) || name.match(/^[0-9a-f]{38}$/)) {
    return i18n.t('app.85');
  }

  return i18n.t('app.86');
}

// 詳細なツールチップ情報を取得する関数
function getDetailedTooltip(name, risk) {
  const detailedInfo = {
    'HEAD': {
      description: i18n.t('app.87'),
      content: i18n.t('app.88'),
      attackVector: i18n.t('app.89'),
      countermeasures: i18n.t('app.90')
    },
    'config': {
      description: i18n.t('app.91'),
      content: i18n.t('app.92'),
      attackVector: i18n.t('app.93'),
      countermeasures: i18n.t('app.94')
    },
    'index': {
      description: i18n.t('app.95'),
      content: i18n.t('app.96'),
      attackVector: i18n.t('app.97'),
      countermeasures: i18n.t('app.98')
    },
    'objects': {
      description: i18n.t('app.99'),
      content: i18n.t('app.100'),
      attackVector: i18n.t('app.101'),
      countermeasures: i18n.t('app.102')
    },
    'refs': {
      description: i18n.t('app.103'),
      content: i18n.t('app.104'),
      attackVector: i18n.t('app.105'),
      countermeasures: i18n.t('app.106')
    },
    'logs': {
      description: i18n.t('app.107'),
      content: i18n.t('app.108'),
      attackVector: i18n.t('app.109'),
      countermeasures: i18n.t('app.110')
    }
  };

  // ファイル名からキーを探す
  for (const [key, info] of Object.entries(detailedInfo)) {
    if (name.includes(key)) {
      return i18n.t('app.111', { p0: info.description, p1: info.content, p2: info.attackVector, p3: info.countermeasures });
    }
  }

  // オブジェクトファイルの場合
  if (name.match(/^[0-9a-f]{2}$/) || name.match(/^[0-9a-f]{38}$/)) {
    return i18n.t('app.112');
  }

  // デフォルト
  return i18n.t('app.113');
}


function getComparisonPresets() {
  return {
  'secure-vs-insecure': {
    left: {
      title: i18n.t('app.114'),
      data: {
        "name": ".git",
        "type": "folder",
        "children": [
          { "name": "HEAD", "type": "file", "risk": "low" },
          { "name": "config", "type": "file", "risk": "low" },
          { "name": "description", "type": "file", "risk": "low" },
          { "name": "index", "type": "file", "risk": "medium" },
          {
            "name": "objects",
            "type": "folder",
            "risk": "medium",
            "children": [
              { "name": "info", "type": "folder" },
              { "name": "pack", "type": "folder" }
            ]
          },
          {
            "name": "refs",
            "type": "folder",
            "risk": "low",
            "children": [
              {
                "name": "heads",
                "type": "folder",
                "children": [
                  { "name": "main", "type": "file", "risk": "low" }
                ]
              }
            ]
          },
          {
            "name": "hooks",
            "type": "folder",
            "children": [
              { "name": "pre-commit", "type": "file", "risk": "low" },
              { "name": "pre-push", "type": "file", "risk": "low" }
            ]
          }
        ]
      }
    },
    right: {
      title: i18n.t('app.115'),
      data: {
        "name": ".git",
        "type": "folder",
        "children": [
          { "name": "HEAD", "type": "file", "risk": "high" },
          { "name": "config", "type": "file", "risk": "high" },
          { "name": "description", "type": "file", "risk": "low" },
          { "name": "index", "type": "file", "risk": "high" },
          { "name": "packed-refs", "type": "file", "risk": "high" },
          {
            "name": "objects",
            "type": "folder",
            "risk": "high",
            "children": [
              { "name": "info", "type": "folder" },
              { "name": "pack", "type": "folder" },
              {
                "name": "e6",
                "type": "folder",
                "children": [
                  { "name": "9de29bb2d1d6434b8b29ae775ad8c2e48c5391", "type": "file", "risk": "high" }
                ]
              },
              {
                "name": "4b",
                "type": "folder",
                "children": [
                  { "name": "825dc642cb6eb9a060e54bf8d69288fbee4904", "type": "file", "risk": "high" }
                ]
              }
            ]
          },
          {
            "name": "refs",
            "type": "folder",
            "risk": "high",
            "children": [
              {
                "name": "heads",
                "type": "folder",
                "children": [
                  { "name": "main", "type": "file", "risk": "high" },
                  { "name": "develop", "type": "file", "risk": "high" }
                ]
              },
              {
                "name": "remotes",
                "type": "folder",
                "children": [
                  {
                    "name": "origin",
                    "type": "folder",
                    "children": [
                      { "name": "main", "type": "file", "risk": "high" }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "name": "logs",
            "type": "folder",
            "risk": "high",
            "children": [
              { "name": "HEAD", "type": "file", "risk": "high" },
              {
                "name": "refs",
                "type": "folder",
                "children": [
                  {
                    "name": "heads",
                    "type": "folder",
                    "children": [
                      { "name": "main", "type": "file", "risk": "high" }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  },
  'private-vs-public': {
    left: {
      title: i18n.t('app.116'),
      data: {
        "name": ".git",
        "type": "folder",
        "children": [
          { "name": "HEAD", "type": "file" },
          { "name": "config", "type": "file" },
          { "name": "index", "type": "file" },
          {
            "name": "objects",
            "type": "folder",
            "children": [
              { "name": "info", "type": "folder" },
              { "name": "pack", "type": "folder" },
              {
                "name": "4b",
                "type": "folder",
                "children": [
                  { "name": "825dc642cb6eb9a060e54bf8d69288fbee4904", "type": "file" }
                ]
              }
            ]
          },
          {
            "name": "refs",
            "type": "folder",
            "children": [
              {
                "name": "heads",
                "type": "folder",
                "children": [
                  { "name": "main", "type": "file" },
                  { "name": "feature/secret-keys", "type": "file" }
                ]
              }
            ]
          }
        ]
      }
    },
    right: {
      title: i18n.t('app.117'),
      data: {
        "name": ".git",
        "type": "folder",
        "children": [
          { "name": "HEAD", "type": "file", "risk": "high" },
          { "name": "config", "type": "file", "risk": "high" },
          { "name": "index", "type": "file", "risk": "high" },
          {
            "name": "objects",
            "type": "folder",
            "risk": "high",
            "children": [
              { "name": "info", "type": "folder" },
              { "name": "pack", "type": "folder" },
              {
                "name": "4b",
                "type": "folder",
                "children": [
                  { "name": "825dc642cb6eb9a060e54bf8d69288fbee4904", "type": "file", "risk": "high" }
                ]
              }
            ]
          },
          {
            "name": "refs",
            "type": "folder",
            "risk": "high",
            "children": [
              {
                "name": "heads",
                "type": "folder",
                "children": [
                  { "name": "main", "type": "file", "risk": "high" },
                  { "name": "feature/secret-keys", "type": "file", "risk": "high" }
                ]
              }
            ]
          }
        ]
      }
    }
  },
  'dev-vs-prod': {
    left: {
      title: i18n.t('app.118'),
      data: {
        "name": ".git",
        "type": "folder",
        "children": [
          { "name": "HEAD", "type": "file", "risk": "medium" },
          { "name": "config", "type": "file", "risk": "medium" },
          { "name": "index", "type": "file", "risk": "medium" },
          {
            "name": "objects",
            "type": "folder",
            "risk": "medium",
            "children": [
              { "name": "info", "type": "folder" },
              { "name": "pack", "type": "folder" },
              {
                "name": "e6",
                "type": "folder",
                "children": [
                  { "name": "9de29bb2d1d6434b8b29ae775ad8c2e48c5391", "type": "file", "risk": "medium" }
                ]
              }
            ]
          },
          {
            "name": "refs",
            "type": "folder",
            "risk": "medium",
            "children": [
              {
                "name": "heads",
                "type": "folder",
                "children": [
                  { "name": "main", "type": "file", "risk": "medium" },
                  { "name": "develop", "type": "file", "risk": "medium" },
                  { "name": "feature/test", "type": "file", "risk": "low" }
                ]
              }
            ]
          },
          {
            "name": "logs",
            "type": "folder",
            "risk": "low",
            "children": [
              { "name": "HEAD", "type": "file", "risk": "low" }
            ]
          }
        ]
      }
    },
    right: {
      title: i18n.t('app.119'),
      data: {
        "name": ".git",
        "type": "folder",
        "children": [
          { "name": "HEAD", "type": "file", "risk": "high" },
          { "name": "config", "type": "file", "risk": "high" },
          { "name": "index", "type": "file", "risk": "high" },
          { "name": "packed-refs", "type": "file", "risk": "high" },
          {
            "name": "objects",
            "type": "folder",
            "risk": "high",
            "children": [
              { "name": "info", "type": "folder" },
              { "name": "pack", "type": "folder" },
              {
                "name": "e6",
                "type": "folder",
                "children": [
                  { "name": "9de29bb2d1d6434b8b29ae775ad8c2e48c5391", "type": "file", "risk": "high" }
                ]
              },
              {
                "name": "4b",
                "type": "folder",
                "children": [
                  { "name": "825dc642cb6eb9a060e54bf8d69288fbee4904", "type": "file", "risk": "high" }
                ]
              }
            ]
          },
          {
            "name": "refs",
            "type": "folder",
            "risk": "high",
            "children": [
              {
                "name": "heads",
                "type": "folder",
                "children": [
                  { "name": "main", "type": "file", "risk": "high" }
                ]
              },
              {
                "name": "remotes",
                "type": "folder",
                "children": [
                  {
                    "name": "origin",
                    "type": "folder",
                    "children": [
                      { "name": "main", "type": "file", "risk": "high" }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  }
};
}
let comparisonPresets = getComparisonPresets();



function generateComparisonStats(leftData, rightData) {
  const leftStats = generateStatistics(leftData);
  const rightStats = generateStatistics(rightData);

  return {
    left: leftStats,
    right: rightStats,
    diff: {
      high: rightStats.high - leftStats.high,
      medium: rightStats.medium - leftStats.medium,
      low: rightStats.low - leftStats.low,
      files: rightStats.files - leftStats.files,
      folders: rightStats.folders - leftStats.folders
    }
  };
}


function getPresetDescriptions() {
  return {
  'secure-vs-insecure': {
    description: i18n.t('app.120'),
    leftDesc: i18n.t('app.121'),
    rightDesc: i18n.t('app.122')
  },
  'private-vs-public': {
    description: i18n.t('app.123'),
    leftDesc: i18n.t('app.124'),
    rightDesc: i18n.t('app.125')
  },
  'dev-vs-prod': {
    description: i18n.t('app.126'),
    leftDesc: i18n.t('app.127'),
    rightDesc: i18n.t('app.128')
  }
};
}
let presetDescriptions = getPresetDescriptions();



let activePreset = null;

function renderComparisonTree(node, otherNode, prefix = '', isLast = true, depth = 0) {
  const wrapper = element('div', '', 'comparison-node');
  const changed = otherNode && node.risk !== otherNode.risk;
  const diffClass = !otherNode ? 'diff-removed' : changed ? 'diff-changed' : 'diff-same';
  const row = element('div', '', `comparison-tree-row ${diffClass}`);
  const branch = depth ? prefix + (isLast ? '└── ' : '├── ') : '';
  const marker = !otherNode ? '- ' : changed ? '! ' : '';
  row.append(element('span', branch + marker));
  row.append(element('span', `${node.type === 'folder' ? '📁' : '📄'} ${node.name}`));
  if (node.risk) row.append(riskBadge(node.risk));
  wrapper.append(row);
  const nextPrefix = prefix + (isLast ? '    ' : '│   ');
  (node.children || []).forEach((child, index) => {
    const otherChild = otherNode && (otherNode.children || []).find(item => item.name === child.name);
    wrapper.append(renderComparisonTree(child, otherChild, nextPrefix, index === node.children.length - 1, depth + 1));
  });
  return wrapper;
}

function renderComparisonReport(stats, leftTitle, rightTitle) {
  const panel = element('div');
  panel.append(element('h3', i18n.t('app.129')));
  const scroller = element('div', '', 'comparison-table-container');
  const table = element('table', '', 'comparison-table');
  const head = element('thead');
  const headings = element('tr');
  [i18n.t('app.130'), leftTitle, rightTitle].forEach(label => headings.append(element('th', label)));
  head.append(headings);
  const body = element('tbody');
  const leftTotal = stats.left.high + stats.left.medium + stats.left.low;
  const rightTotal = stats.right.high + stats.right.medium + stats.right.low;
  const rows = [
    [i18n.t('app.131'), stats.left.high, stats.right.high],
    [i18n.t('app.132'), stats.left.medium, stats.right.medium],
    [i18n.t('app.133'), stats.left.low, stats.right.low],
    [i18n.t('app.134'), leftTotal, rightTotal],
    [i18n.t('app.135'), stats.left.files, stats.right.files],
    [i18n.t('app.136'), stats.left.folders, stats.right.folders],
    [i18n.t('app.137'), stats.left.files + stats.left.folders, stats.right.files + stats.right.folders]
  ];
  rows.forEach(([label, left, right], index) => {
    const row = element('tr');
    row.append(element('td', label));
    const leftClass = index < 4 && left !== right ? left > right ? 'higher-risk' : 'lower-risk' : '';
    const rightClass = index < 4 && left !== right ? right > left ? 'higher-risk' : 'lower-risk' : '';
    row.append(element('td', i18n.t('app.138', { p0: left }), leftClass), element('td', i18n.t('app.139', { p0: right }), rightClass));
    body.append(row);
  });
  table.append(head, body);
  scroller.append(table);
  panel.append(scroller);
  const recommendation = element('div', '', 'recommendation');
  recommendation.append(element('h4', i18n.t('app.140')));
  const message = leftTotal === rightTotal ? i18n.t('app.141') :
    i18n.t('app.142', { p0: leftTotal < rightTotal ? leftTitle : rightTitle });
  recommendation.append(element('p', message));
  recommendation.append(element('p', i18n.t('app.143')));
  recommendation.append(list([
    i18n.t('app.144'),
    i18n.t('app.145'),
    i18n.t('app.146'),
    i18n.t('app.147')
  ]));
  panel.append(recommendation);
  return panel;
}

function loadPresetComparison(presetKey) {
  const preset = comparisonPresets[presetKey];
  if (!preset) return;
  activePreset = presetKey;
  const description = presetDescriptions[presetKey];
  ['left', 'right'].forEach(side => {
    byId(side + '-title').replaceChildren(
      element('span', preset[side].title),
      element('br'),
      element('small', description[side + 'Desc'], 'comparison-description')
    );
    const otherSide = side === 'left' ? 'right' : 'left';
    byId(side + '-tree').replaceChildren(renderComparisonTree(preset[side].data, preset[otherSide].data));
  });
  const report = byId('comparison-report');
  const intro = element('div', '', 'comparison-description');
  intro.append(element('h3', i18n.t('app.148')), element('p', description.description));
  report.replaceChildren(intro, renderComparisonReport(
    generateComparisonStats(preset.left.data, preset.right.data), preset.left.title, preset.right.title
  ));
}

document.querySelectorAll('.preset-button').forEach(control => {
  control.addEventListener('click', () => loadPresetComparison(control.dataset.preset));
});

loadGitStructure();
renderScan();


byId('language-button').addEventListener('click', () => {
  i18n.setLanguage(i18n.language === 'ja' ? 'en' : 'ja');
});

i18n.onChange(() => {
  const methodWasOpen = byId('method-details') && !byId('method-details').hidden;
  sampleDescriptions = getSampleDescriptions();
  scanFindings = getScanFindings();
  comparisonPresets = getComparisonPresets();
  presetDescriptions = getPresetDescriptions();
  loadGitStructure();
  renderRecovery();
  if (methodWasOpen && byId('method-details')) toggleAccordion('method-details');
  if (scan.steps.length) scan.steps = makeScanSteps();
  renderScan();
  if (activePreset) loadPresetComparison(activePreset);
  const toast = byId('copy-feedback');
  if (toast) toast.textContent = i18n.translateRendered(toast.textContent);
});
