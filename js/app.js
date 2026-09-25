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
    toggle.setAttribute('aria-label', `${node.name}を開閉`);
    row.append(toggle);
  } else {
    row.append(element('span', node.type === 'folder' ? '📁 ' : '📄 '));
  }

  const isHashFile = /^[0-9a-f]{38}$/.test(node.name) && parentHash;
  if (isHashFile) {
    const hash = parentHash + node.name;
    const copy = button(node.name, () => copyHash(hash), 'hash-clickable');
    copy.title = `先頭2桁とファイル名を連結した40文字のハッシュをコピー: ${hash}`;
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
  const success = `✅ ハッシュをコピーしました: ${hash.slice(0, 8)}… オブジェクト復元タブに貼り付けられます。`;
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
    showToast(copied ? success : 'コピーできませんでした。ハッシュを選択してコピーしてください。', !copied);
  }
}

function generateStatistics(node) {
  return GitCore.treeStats(node);
}

function renderStatistics(stats) {
  const panel = element('div', '', 'statistics-panel');
  panel.append(element('h3', '📊 構造統計情報'));
  const grid = element('div', '', 'stats-grid');
  const rows = [
    [stats.files + stats.folders, '総アイテム数', `${stats.folders} フォルダー, ${stats.files} ファイル`, ''],
    [stats.high, 'HIGH RISK', '機密性の高い要素', 'risk-high'],
    [stats.medium, 'MEDIUM RISK', '注意が必要な要素', 'risk-medium'],
    [stats.low, 'LOW RISK', '軽微なリスク要素', 'risk-low']
  ];
  rows.forEach(([count, label, detail, className]) => {
    const item = element('div', '', `stat-item ${className}`);
    item.append(element('div', String(count), 'stat-value'));
    item.append(element('div', label, 'stat-label'));
    item.append(element('div', detail, 'stat-detail'));
    grid.append(item);
  });
  panel.append(grid);
  panel.append(element('div', `リスクレベル分析: ${stats.high + stats.medium + stats.low}個の要素にリスクがあります`, 'risk-summary'));
  return panel;
}

function loadGitStructure() {
  byId('statistics-panel').replaceChildren(renderStatistics(GitCore.treeStats(GIT_STRUCTURE)));
  byId('git-tree').replaceChildren(renderTree(GIT_STRUCTURE));
}

const sampleDescriptions = [
  '.gitkeepファイルなどの空ファイル',
  'サンプルテキストファイル',
  '機密情報を含む設定ファイル（⚠️ 本番環境では危険）',
  'Dockerコンテナ設定ファイル'
];
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
  const header = button('🔧 実際のGitオブジェクト復元方法', () => toggleAccordion('method-details'), 'accordion-header');
  const detail = element('div', '', 'accordion-content');
  detail.id = 'method-details';
  detail.hidden = true;
  header.setAttribute('aria-expanded', 'false');
  header.setAttribute('aria-controls', detail.id);
  detail.append(element('p', '次は許可されたテスト環境でのみ使うコマンドの例です。ここでは実行しません。'));
  const sections = [
    ['1. オブジェクトファイルの取得',
      `curl -s https://target.com/${GitCore.objectPath(hash)} -o object_file\n` +
      `wget https://target.com/${GitCore.objectPath(hash)} -O object_file`],
    ['2. zlibで圧縮されたオブジェクトを解凍',
      `python3 -c "import zlib; print(zlib.decompress(open('object_file', 'rb').read()).decode('utf-8', errors='ignore'))"\n` +
      `ruby -e "require 'zlib'; puts Zlib.inflate(File.binread('object_file'))"\nopenssl zlib -d -in object_file`],
    ['3. Gitコマンドを使用', `git cat-file -p ${hash}\ngit cat-file -t ${hash}\ngit cat-file -s ${hash}`],
    ['4. 自動化ツール', 'python3 GitHack.py https://target.com/.git/\n' +
      'git-dumper https://target.com/.git/ output_dir\n./rip-git.pl -v -u https://target.com/.git/']
  ];
  sections.forEach(([title, code]) => {
    detail.append(element('h4', title), element('pre', code));
  });
  detail.append(element('p', '⚠️ 教育目的のみ。自分の環境、CTF、事前に許可されたテスト環境でのみ使用してください。', 'warning-box'));
  wrapper.append(header, detail);
  return wrapper;
}

function renderRecovery() {
  const output = byId('object-output');
  output.replaceChildren();
  if (recoveredHash === null) return;
  const hash = recoveredHash;
  if (!GitCore.isValidHash(hash)) {
    output.append(element('p', '⚠️ 正しいSHA-1形式のハッシュを入力してください（40文字の16進数）', 'error-message'));
    return;
  }
  const index = SAMPLE_OBJECTS.findIndex(obj => obj.hash === hash);
  if (index === -1) {
    output.append(element('p', `オブジェクトが見つかりません: ${hash}`, 'error-message'));
    output.append(element('p', '以下のサンプルハッシュを入力してください。'));
    const hints = ['空のblob', 'Hello Worldを含むblob', '機密情報を含む設定ファイルのblob', 'Dockerfileのblob'];
    output.append(list(SAMPLE_OBJECTS.map((obj, i) => `${obj.hash} (${hints[i]})`)));
    return;
  }
  const obj = SAMPLE_OBJECTS[index];
  output.append(element('h3', '✓ オブジェクトを復元しました', 'recovery-success'));
  const metadata = element('dl', '', 'object-metadata');
  const fields = [
    ['SHA-1', obj.hash], ['Type', obj.type], ['Size', `${obj.size} bytes`],
    ['Description', sampleDescriptions[index]], ['Path', GitCore.objectPath(obj.hash)]
  ];
  fields.forEach(([label, value]) => {
    metadata.append(element('dt', label), element('dd', value));
  });
  output.append(metadata, element('h4', 'Content'));
  if (index === 2) output.append(element('p', '⚠️ WARNING: 機密情報が検出されました', 'error-message'));
  output.append(element('pre', obj.content || '(empty file)', 'object-content'));
  output.append(element('p', '💡 オブジェクトは通常zlibで圧縮され、.git/objects/に保存されます。', 'simulation-notice'));
  if (index === 2) {
    output.append(element('p', 'このようなファイルが.gitに残っていると、機密情報が漏洩する可能性があります。', 'warning-box'));
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
  const title = heading.textContent;
  const content = element('div');
  content.id = 'ctf-details-' + index;
  while (heading.nextSibling) content.append(heading.nextSibling);
  const control = button(title, () => toggleAccordion(content.id), 'ctf-accordion');
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

const scanFindings = {
  head: ['.git/HEAD', '✅', 'HEADファイルを取得: ref: refs/heads/main', 'success', 'HEADファイル露出'],
  config: ['.git/config', '🔍', 'リポジトリ設定を発見: リモートURL、ユーザー情報を取得', 'info', '設定ファイル漏洩'],
  logs: ['.git/logs/HEAD', '📜', 'コミット履歴ログを発見: 過去のハッシュ値を特定', 'warning', '履歴ログ露出'],
  refs: ['.git/refs/', '🌿', 'ブランチ情報を発見: main, develop, feature/secrets', 'info', 'ブランチ情報漏洩'],
  objects: ['.git/objects/', '📦', 'オブジェクトファイルを発見: コミット・ツリー・blobを復元中...', 'warning', '機密ファイル復元']
};

function makeScanSteps() {
  const steps = [{ icon: '🎯', text: `対象URL: ${scan.url}`, type: 'info' }];
  Object.entries(scanFindings).forEach(([key, finding]) => {
    if (!scan.options[key]) return;
    steps.push({ icon: '📡', text: `${scan.url.replace(/\/$/, '')}/${finding[0]} をスキャン...`, type: 'scan' });
    steps.push({ icon: finding[1], text: finding[2], type: finding[3] });
    if (key === 'objects') {
      steps.push({ icon: '💾', text: '機密ファイルを復元: .env, config.yaml, private.key', type: 'danger' });
    }
  });
  steps.push({ icon: '🚨', text: '警告: リポジトリ全体の復元が完了しました', type: 'danger' });
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
  summary.append(element('h3', '🚨 スキャン結果サマリー'));
  const risks = Object.keys(scanFindings).filter(key => scan.options[key]).map(key => scanFindings[key][4]);
  const grid = element('div', '', 'risk-summary-grid');
  [[risks.length, '脆弱性項目'], [risks.length, '検出された問題'], ['HIGH', 'リスクレベル']].forEach(([count, title]) => {
    const item = element('div', '', 'risk-stat');
    item.append(element('div', String(count), 'risk-number'), element('div', title, 'risk-label'));
    grid.append(item);
  });
  summary.append(grid, element('h4', '🔍 発見された脆弱性'), list(risks));
  summary.append(element('h4', '💥 影響範囲'));
  summary.append(list([
    '📋 ソースコード全体の漏洩',
    '🔑 機密情報（APIキー、パスワード）の暴露',
    '👥 開発者の個人情報露出',
    '🕰️ 削除済みファイルの復元',
    '🌿 全ブランチ・タグ情報の取得'
  ]));
  summary.append(element('h4', '🛡️ 対策推奨事項'));
  summary.append(list([
    'Webサーバーで/.gitディレクトリーへのアクセスを即座に拒否',
    '本番環境から.gitディレクトリーを完全削除',
    '漏洩した機密情報（APIキー等）の無効化・再生成',
    'git filter-branchによる機密情報の履歴からの完全削除',
    '定期的なセキュリティスキャンの実施'
  ], true));
  summary.append(element('p', '📝 これは教育用シミュレーションです。実際のWebサイトへのアクセスは行われていません。', 'simulation-notice'));
  const reset = button('🔄 新しいスキャンを開始', resetScan);
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
  control.textContent = running ? '⏸️ 一時停止' : paused ? '▶️ 再開' : '🚨 スキャン開始';
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
    initial.append(element('h3', '💡 使用方法'));
    initial.append(element('p', 'URLを入力してスキャン開始を押すと、.gitディレクトリーの漏洩検査をシミュレーションします。'));
    initial.append(element('p', 'これは教育用シミュレーターです。実際のWebサイトへのアクセスは行いません。', 'warning-box'));
    output.append(initial);
    return;
  }
  const progress = byId('progress-bar');
  progress.max = scan.steps.length;
  progress.value = scan.index;
  byId('progress-percentage').textContent = `${Math.round(scan.index / scan.steps.length * 100)}%`;
  byId('step-counter').textContent = `${scan.index} / ${scan.steps.length}`;
  byId('progress-text').textContent = scan.state === 'paused' ? '⏸️ 一時停止中...' :
    scan.index === scan.steps.length ? '✅ スキャン完了' : 'スキャン中...';
  byId('current-step').textContent = scan.index === scan.steps.length ? 'すべての検査が完了しました' : scan.steps[scan.index - 1].text;
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
    'HEAD': '現在のブランチ情報を含む。攻撃者はここから最新のコミットハッシュを取得可能',
    'config': 'リモートリポジトリURL、ユーザー情報などを含む可能性',
    'objects': 'すべてのコミット、ファイル内容、ツリー構造が圧縮保存されている',
    'refs': 'ブランチやタグの参照情報',
    'index': 'ステージングエリアの情報、ファイルのメタデータ',
    'logs': 'リファレンスの更新履歴、過去のコミット情報',
    'packed-refs': 'パックされたリファレンス情報',
    'description': 'リポジトリの説明（GitWebなどで使用）',
    'exclude': 'リポジトリ固有の無視パターン'
  };

  // ファイル名からキーを探す
  for (const [key, desc] of Object.entries(risks)) {
    if (name.includes(key)) {
      return desc;
    }
  }

  // オブジェクトファイルの場合（フォルダ名が2文字の16進数、またはファイル名が38文字の16進数）
  if (name.match(/^[0-9a-f]{2}$/) || name.match(/^[0-9a-f]{38}$/)) {
    return 'Gitオブジェクト（blob/tree/commit）が圧縮保存されている';
  }

  return '機密情報を含む可能性があります';
}

// 詳細なツールチップ情報を取得する関数
function getDetailedTooltip(name, risk) {
  const detailedInfo = {
    'HEAD': {
      description: '現在チェックアウトされているブランチへの参照',
      content: '例: ref: refs/heads/main',
      attackVector: '• 最新コミットハッシュの特定\n• ブランチ構造の把握\n• 開発フローの推測',
      countermeasures: '• .gitディレクトリーの公開禁止\n• Webサーバー設定の見直し'
    },
    'config': {
      description: 'Gitリポジトリの設定情報',
      content: '• リモートURL\n• ユーザー名・メールアドレス\n• ブランチ設定',
      attackVector: '• 内部サーバー情報の漏洩\n• 開発者情報の特定\n• 認証情報の発見',
      countermeasures: '• 機密情報の外部化\n• 環境変数の使用\n• .gitignoreの適切な設定'
    },
    'index': {
      description: 'ステージングエリアの状態を保存',
      content: '• ステージされたファイル一覧\n• ファイルのメタデータ\n• ハッシュ値',
      attackVector: '• 未コミットファイルの発見\n• 削除されたファイルの復元\n• 開発中コードの漏洩',
      countermeasures: '• 機密ファイルのステージング回避\n• 定期的なクリーンアップ'
    },
    'objects': {
      description: 'すべてのGitオブジェクトを格納',
      content: '• blob: ファイル内容\n• tree: ディレクトリー構造\n• commit: コミット情報',
      attackVector: '• 全ファイル履歴の復元\n• 削除されたファイルの取得\n• 機密情報の発見',
      countermeasures: '• git filter-branchでの履歴改変\n• 新リポジトリでの再作成'
    },
    'refs': {
      description: 'ブランチとタグの参照情報',
      content: '• heads/: ローカルブランチ\n• remotes/: リモートブランチ\n• tags/: タグ',
      attackVector: '• ブランチ構造の把握\n• 開発戦略の推測\n• 隠しブランチの発見',
      countermeasures: '• ブランチ命名規則の見直し\n• 不要ブランチの削除'
    },
    'logs': {
      description: 'リファレンスの変更履歴',
      content: '• HEAD移動の履歴\n• ブランチ切り替え記録\n• コミット・リセット履歴',
      attackVector: '• 過去の作業内容の把握\n• 削除されたコミットの発見\n• 開発者の行動パターン分析',
      countermeasures: '• ログの定期的なクリア\n• プライベート情報の除外'
    }
  };

  // ファイル名からキーを探す
  for (const [key, info] of Object.entries(detailedInfo)) {
    if (name.includes(key)) {
      return `📋 ${info.description}

💾 内容:
${info.content}

⚠️ 攻撃ベクター:
${info.attackVector}

🛡️ 対策:
${info.countermeasures}`;
    }
  }

  // オブジェクトファイルの場合
  if (name.match(/^[0-9a-f]{2}$/) || name.match(/^[0-9a-f]{38}$/)) {
    return `📦 Gitオブジェクト

💾 内容:
zlibで圧縮されたバイナリデータ
• blob: ファイルの実際の内容
• tree: ディレクトリー構造
• commit: コミット情報

⚠️ 攻撃ベクター:
• ファイル内容の完全復元
• 機密データの取得
• 削除されたファイルの復活

🛡️ 対策:
• git filter-branchでの機密データ除去
• 新しいリポジトリでの再構築`;
  }

  // デフォルト
  return `⚠️ 潜在的なセキュリティリスク

この要素には機密情報が含まれている可能性があります。
.gitディレクトリーが公開されると、意図しない情報漏洩につながる恐れがあります。`;
}


const comparisonPresets = {
  'secure-vs-insecure': {
    left: {
      title: '🛡️ セキュアな設定',
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
      title: '⚠️ 危険な設定',
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
      title: '🔒 プライベートリポジトリ',
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
      title: '🌐 パブリックリポジトリ',
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
      title: '🔧 開発環境',
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
      title: '🚀 本番環境',
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


const presetDescriptions = {
  'secure-vs-insecure': {
    description: 'セキュリティ対策を適用した設定と、脆弱性のある危険な設定を比較します。セキュアな設定では適切な.gitignoreやhooksが設定され、機密情報の露出が最小限に抑えられています。',
    leftDesc: 'セキュリティベストプラクティスに従った設定',
    rightDesc: '多数の機密ファイルや履歴が露出した危険な状態'
  },
  'private-vs-public': {
    description: 'プライベートリポジトリとパブリックリポジトリの同じ内容における、セキュリティリスクの違いを比較します。同じ構造でも公開状態によってリスクレベルが大きく変わることを示しています。',
    leftDesc: '外部からアクセス不可能なプライベート状態',
    rightDesc: '全世界に公開されたパブリック状態'
  },
  'dev-vs-prod': {
    description: '開発環境と本番環境の.git設定を比較します。開発環境では多くのブランチや実験的なコードが含まれる一方、本番環境では厳格な管理が求められ、露出した場合の影響も深刻です。',
    leftDesc: '開発・テスト用の柔軟な設定',
    rightDesc: '本番運用での厳重管理が必要な重要データ'
  }
};


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
  panel.append(element('h3', '📊 比較分析表'));
  const scroller = element('div', '', 'comparison-table-container');
  const table = element('table', '', 'comparison-table');
  const head = element('thead');
  const headings = element('tr');
  ['項目', leftTitle, rightTitle].forEach(label => headings.append(element('th', label)));
  head.append(headings);
  const body = element('tbody');
  const leftTotal = stats.left.high + stats.left.medium + stats.left.low;
  const rightTotal = stats.right.high + stats.right.medium + stats.right.low;
  const rows = [
    ['💥 高リスク要素', stats.left.high, stats.right.high],
    ['💣 中リスク要素', stats.left.medium, stats.right.medium],
    ['⚠️ 低リスク要素', stats.left.low, stats.right.low],
    ['🎯 総リスク要素', leftTotal, rightTotal],
    ['📄 ファイル数', stats.left.files, stats.right.files],
    ['📁 フォルダー数', stats.left.folders, stats.right.folders],
    ['📊 総アイテム数', stats.left.files + stats.left.folders, stats.right.files + stats.right.folders]
  ];
  rows.forEach(([label, left, right], index) => {
    const row = element('tr');
    row.append(element('td', label));
    const leftClass = index < 4 && left !== right ? left > right ? 'higher-risk' : 'lower-risk' : '';
    const rightClass = index < 4 && left !== right ? right > left ? 'higher-risk' : 'lower-risk' : '';
    row.append(element('td', `${left}個`, leftClass), element('td', `${right}個`, rightClass));
    body.append(row);
  });
  table.append(head, body);
  scroller.append(table);
  panel.append(scroller);
  const recommendation = element('div', '', 'recommendation');
  recommendation.append(element('h4', '💡 推奨事項'));
  const message = leftTotal === rightTotal ? '両方の構造のセキュリティリスクレベルは同等です。' :
    `${leftTotal < rightTotal ? leftTitle : rightTitle} の方がセキュリティリスクが低く、より安全です。`;
  recommendation.append(element('p', message));
  recommendation.append(element('p', 'セキュリティを向上させるには'));
  recommendation.append(list([
    '.gitディレクトリーのWeb公開を防ぐ',
    '機密情報を含むファイルの履歴からの完全削除',
    '適切な.gitignore設定の実装',
    '定期的なセキュリティスキャンの実行'
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
  intro.append(element('h3', '📝 比較の概要'), element('p', description.description));
  report.replaceChildren(intro, renderComparisonReport(
    generateComparisonStats(preset.left.data, preset.right.data), preset.left.title, preset.right.title
  ));
}

document.querySelectorAll('.preset-button').forEach(control => {
  control.addEventListener('click', () => loadPresetComparison(control.dataset.preset));
});

loadGitStructure();
renderScan();
