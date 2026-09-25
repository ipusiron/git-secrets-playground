// --- セキュリティ関数: HTMLエスケープ ---
/**
 * XSS攻撃を防ぐためにユーザー入力をHTMLエスケープする
 * @param {string} text - エスケープする文字列
 * @returns {string} エスケープされた文字列
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// --- タブ切り替え処理 ---
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    const targetTab = button.getAttribute('data-tab');

    // ボタンの active 状態切り替え
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    button.classList.add('active');

    // セクションの表示切り替え
    document.querySelectorAll('.tab-content').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(targetTab).classList.add('active');
  });
});

// --- Git構造ビューアー ---
async function loadGitStructure() {
  try {
    const data = GIT_STRUCTURE;
    
    // 統計情報を生成・表示
    const stats = generateStatistics(data);
    const statsContainer = document.getElementById('statistics-panel');
    if (statsContainer) {
      statsContainer.innerHTML = renderStatistics(stats);
    }
    
    const container = document.getElementById('git-tree');
    if (!container) {
      console.error('Container #git-tree not found!');
      return;
    }
    container.innerHTML = renderTree(data);
  } catch (error) {
    console.error('Failed to load Git structure:', error);
    const container = document.getElementById('git-tree');
    if (container) {
      container.innerHTML = `<div style="color: #ff4444;">
        <p>⚠️ Git構造の読み込みに失敗しました。</p>
        <p>ローカルサーバーを起動してください：</p>
        <pre style="background: #333; padding: 10px; border-radius: 4px;">
# Python 3の場合
python3 -m http.server 8000

# Python 2の場合
python -m SimpleHTTPServer 8000

# Node.jsの場合
npx http-server -p 8000</pre>
        <p>その後、<a href="http://localhost:8000" style="color: #4488ff;">http://localhost:8000</a> にアクセスしてください。</p>
      </div>`;
    }
  }
}

function renderTree(node, level = 0, isLast = true, prefix = '', parentHash = '') {
  let riskColor = '';
  let riskIcon = '';
  
  if (node.risk === 'high') {
    riskColor = 'background: rgba(255, 255, 255, 0.9); color: #ff3333; border: 1px solid #ff3333; font-weight: bold;';
    riskIcon = '💥';
  } else if (node.risk === 'medium') {
    riskColor = 'background: rgba(255, 255, 255, 0.9); color: #ff8800; border: 1px solid #ff8800; font-weight: bold;';
    riskIcon = '💣';
  } else if (node.risk === 'low') {
    riskColor = 'background: rgba(255, 255, 255, 0.9); color: #22aa22; border: 1px solid #22aa22; font-weight: bold;';
    riskIcon = '⚠️';
  }
  
  const riskBadge = node.risk ? `<span style="${riskColor} font-size: 0.8em; padding: 1px 4px; border-radius: 3px; margin-left: 4px;"> ${riskIcon} [${node.risk.toUpperCase()} RISK]</span>` : '';
  
  // ツリーの枝を作成
  let branch = '';
  if (level > 0) {
    branch = prefix + (isLast ? '└── ' : '├── ');
  }
  
  // ユニークIDを生成
  const nodeId = 'node-' + Math.random().toString(36).substr(2, 9);
  
  // ハッシュファイルかどうかを判定してクリック可能にする
  const isHashFile = node.name.match(/^[0-9a-f]{38}$/);
  const isHashFolder = node.name.match(/^[0-9a-f]{2}$/);
  
  let nameElement;
  let currentHash = parentHash;
  let icon = node.type === 'folder' ? '📁' : '📄';
  
  if (isHashFile && parentHash) {
    // 38文字のハッシュファイルをクリック可能にする
    const fullHash = parentHash + node.name;
    const hashId = 'hash-' + Math.random().toString(36).substr(2, 9);
    const tooltipText = `「${parentHash}」と「${node.name}」を連結した40文字がハッシュ値になります。クリックでコピー: ${fullHash}`;
    nameElement = `<span class="hash-clickable" id="${hashId}" onclick="copyHashWithPosition('${fullHash}', '${hashId}')" title="${tooltipText}">${node.name}</span>`;
  } else if (isHashFolder) {
    // 2文字のハッシュフォルダの場合、親ハッシュとして記録
    currentHash = node.name;
    const detailedTooltip = getDetailedTooltip(node.name, node.risk);
    if (node.children && node.children.length > 0) {
      // 子要素があるフォルダーには展開/折りたたみ機能を追加
      icon = `<span class="folder-toggle" onclick="toggleFolder('${nodeId}')" style="cursor: pointer;">📁 <span id="${nodeId}-icon" class="toggle-icon">▼</span></span>`;
      nameElement = `<span class="file-tooltip" title="${detailedTooltip.replace(/"/g, '&quot;')}">${node.name}</span>`;
    } else {
      nameElement = `<span class="file-tooltip" title="${detailedTooltip.replace(/"/g, '&quot;')}">${node.name}</span>`;
    }
  } else {
    // 通常のファイル・フォルダーにツールチップを追加
    const detailedTooltip = getDetailedTooltip(node.name, node.risk);
    if (node.type === 'folder' && node.children && node.children.length > 0) {
      // 子要素があるフォルダーには展開/折りたたみ機能を追加
      icon = `<span class="folder-toggle" onclick="toggleFolder('${nodeId}')" style="cursor: pointer;">📁 <span id="${nodeId}-icon" class="toggle-icon">▼</span></span>`;
      nameElement = `<span class="file-tooltip" title="${detailedTooltip.replace(/"/g, '&quot;')}">${node.name}</span>`;
    } else {
      nameElement = `<span class="file-tooltip" title="${detailedTooltip.replace(/"/g, '&quot;')}">${node.name}</span>`;
    }
  }
  
  let html = `<div class="tree-node">`;
  html += `<div style="white-space: pre; font-family: monospace;">`;
  html += `<span style="color: #888;">${branch}</span>${icon} ${nameElement}${riskBadge}`;
  
  // リスク説明を追加
  if (node.risk) {
    const descPrefix = prefix + (isLast ? '    ' : '│   ');
    html += `\n<span style="color: #888;">${descPrefix}</span><span style="font-size: 0.85em; color: #999;">${getRiskDescription(node.name)}</span>`;
  }
  
  html += `</div>`;
  
  if (node.children && node.children.length > 0) {
    html += `<div id="${nodeId}-children" class="folder-children">`;
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    node.children.forEach((child, index) => {
      const isChildLast = index === node.children.length - 1;
      html += renderTree(child, level + 1, isChildLast, childPrefix, currentHash);
    });
    html += `</div>`;
  }
  
  html += `</div>`;
  
  return html;
}


// IDベースでハッシュをクリップボードにコピーする関数
async function copyHashWithPosition(hash, elementId) {
  try {
    await navigator.clipboard.writeText(hash);
    showCopyFeedbackAtElement(
      '✅ ハッシュをコピーしました: ' + hash.substring(0, 8) + '...\n「オブジェクト復元」タブで貼り付けてみてください。',
      elementId
    );
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = hash;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showCopyFeedbackAtElement(
      '✅ ハッシュをコピーしました: ' + hash.substring(0, 8) + '...\n「オブジェクト復元」タブで貼り付けてみてください。',
      elementId
    );
  }
}

// IDベースでトースト表示位置を決定する新しい関数
function showCopyFeedbackAtElement(message, elementId) {
  // 既存のトーストを削除
  const existingToast = document.querySelector('.copy-toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const targetElement = document.getElementById(elementId);
  if (!targetElement) {
    console.error('Target element not found:', elementId);
    // フォールバック: 右上に表示
    showCopyFeedbackFallback(message);
    return;
  }
  
  const feedback = document.createElement('div');
  feedback.className = 'copy-toast';
  
  // Git treeコンテナ内での相対位置を取得
  const gitTreeContainer = document.getElementById('git-tree');
  const containerRect = gitTreeContainer.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();
  
  // コンテナ基準での相対位置を計算
  const relativeTop = targetRect.top - containerRect.top + targetRect.height + 10;
  const relativeLeft = targetRect.left - containerRect.left;
  
  console.log('Toast positioning:', {
    targetRect,
    containerRect,
    relativeTop,
    relativeLeft,
    elementId
  });
  
  // 絶対位置での表示位置を計算
  let finalTop = targetRect.bottom + 10;
  let finalLeft = targetRect.left;
  
  // 画面外に出ないように調整
  const toastWidth = 300;
  const toastHeight = 80;
  
  if (finalLeft + toastWidth > window.innerWidth) {
    finalLeft = window.innerWidth - toastWidth - 20;
  }
  if (finalLeft < 20) {
    finalLeft = 20;
  }
  if (finalTop + toastHeight > window.innerHeight) {
    finalTop = targetRect.top - toastHeight - 10;
  }
  
  feedback.style.cssText = `
    position: fixed;
    top: ${finalTop}px;
    left: ${finalLeft}px;
    background: #28a745;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.4;
    max-width: ${toastWidth}px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease-out;
    white-space: pre-line;
    pointer-events: none;
  `;
  
  feedback.textContent = message;
  document.body.appendChild(feedback);
  
  // フェードイン
  setTimeout(() => {
    feedback.style.opacity = '1';
    feedback.style.transform = 'translateY(0)';
  }, 100);
  
  // 4秒後にフェードアウトして削除
  setTimeout(() => {
    feedback.style.opacity = '0';
    feedback.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      if (document.body.contains(feedback)) {
        document.body.removeChild(feedback);
      }
    }, 300);
  }, 4000);
}

// フォールバック用のトースト表示関数
function showCopyFeedbackFallback(message) {
  const feedback = document.createElement('div');
  feedback.className = 'copy-toast';
  
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #28a745;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.4;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease-out;
    white-space: pre-line;
  `;
  
  feedback.textContent = message;
  document.body.appendChild(feedback);
  
  // フェードイン
  setTimeout(() => {
    feedback.style.opacity = '1';
    feedback.style.transform = 'translateY(0)';
  }, 100);
  
  // 4秒後にフェードアウトして削除
  setTimeout(() => {
    feedback.style.opacity = '0';
    feedback.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      if (document.body.contains(feedback)) {
        document.body.removeChild(feedback);
      }
    }, 300);
  }, 4000);
}

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

// 統計情報を生成する関数
function generateStatistics(node, stats = { high: 0, medium: 0, low: 0, files: 0, folders: 0 }) {
  if (node.type === 'file') {
    stats.files++;
  } else if (node.type === 'folder') {
    stats.folders++;
  }
  
  if (node.risk === 'high') {
    stats.high++;
  } else if (node.risk === 'medium') {
    stats.medium++;
  } else if (node.risk === 'low') {
    stats.low++;
  }
  
  if (node.children) {
    node.children.forEach(child => generateStatistics(child, stats));
  }
  
  return stats;
}

// 統計情報パネルをレンダリングする関数
function renderStatistics(stats) {
  const total = stats.files + stats.folders;
  const totalRisk = stats.high + stats.medium + stats.low;
  
  return `
    <div class="statistics-panel">
      <h3>📊 構造統計情報</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${total}</div>
          <div class="stat-label">総アイテム数</div>
          <div class="stat-detail">${stats.folders} フォルダー, ${stats.files} ファイル</div>
        </div>
        <div class="stat-item risk-high">
          <div class="stat-value">${stats.high} 💥</div>
          <div class="stat-label">HIGH RISK</div>
          <div class="stat-detail">機密性の高い要素</div>
        </div>
        <div class="stat-item risk-medium">
          <div class="stat-value">${stats.medium} 💣</div>
          <div class="stat-label">MEDIUM RISK</div>
          <div class="stat-detail">注意が必要な要素</div>
        </div>
        <div class="stat-item risk-low">
          <div class="stat-value">${stats.low} ⚠️</div>
          <div class="stat-label">LOW RISK</div>
          <div class="stat-detail">軽微なリスク要素</div>
        </div>
      </div>
      <div class="risk-summary">
        <strong>リスクレベル分析:</strong> ${totalRisk}個の要素にセキュリティリスクが検出されました
      </div>
    </div>
  `;
}

// ページ読み込み時に構造を表示
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadGitStructure);
} else {
  // DOMContentLoaded has already fired
  loadGitStructure();
}

// フォールバック: window.onloadでも実行
window.addEventListener('load', () => {
  const container = document.getElementById('git-tree');
  if (container && container.innerHTML.trim() === '') {
    console.log('Fallback: Loading Git structure on window.load');
    loadGitStructure();
  }
});

// --- Gitオブジェクト復元処理 ---
const sampleDescriptions = [
  '.gitkeepファイルなどの空ファイル',
  'サンプルテキストファイル',
  '機密情報を含む設定ファイル（⚠️ 本番環境では危険）',
  'Dockerコンテナ設定ファイル'
];
const sampleObjects = Object.fromEntries(SAMPLE_OBJECTS.map((obj, index) => [
  obj.hash, { ...obj, description: sampleDescriptions[index] }
]));

document.getElementById('recover-object').addEventListener('click', () => {
  const hash = document.getElementById('object-hash').value.trim();
  const output = document.getElementById('object-output');

  if (!hash.match(/^[0-9a-f]{40}$/)) {
    output.innerHTML = '<span style="color: #ff4444;">⚠️ 正しいSHA-1形式のハッシュを入力してください（40文字の16進数）</span>';
    return;
  }

  // シミュレーション: サンプルデータから復元
  const obj = sampleObjects[hash];
  
  if (!obj) {
    output.innerHTML = `<div style="font-family: monospace;">
<span style="color: #ff9944;">オブジェクトが見つかりません: ${hash}</span>

<span style="color: #666;">試しに以下のハッシュを入力してみてください:</span>
• e69de29bb2d1d6434b8b29ae775ad8c2e48c5391 (空のblob)
• 557db03de997c86a4a028e1ebd3a1ceb225be238 (Hello Worldを含むblob)
• 3bb8dc0bbcd57a209018a4aa1c6d07db2edc75dd (機密情報を含む設定ファイルのblob)
• df799688ee42b4d33e495ffa1a78469753c7dde9 (Dockerfileのblob)
</div>`;
    return;
  }

  let result = `<div style="font-family: monospace;">`;
  result += `<span style="color: #44ff44;">✓ オブジェクトを復元しました</span>\n\n`;
  result += `<span style="color: #ff9944;">SHA-1:</span> ${hash}\n`;
  result += `<span style="color: #ff9944;">Type:</span> ${obj.type}\n`;
  result += `<span style="color: #ff9944;">Size:</span> ${obj.size} bytes\n`;
  
  // 説明がある場合は表示
  if (obj.description) {
    result += `<span style="color: #ff9944;">Description:</span> ${obj.description}\n`;
  }
  
  result += `\n<span style="color: #ff9944;">Content:</span>\n`;
  result += `<div style="background: #333; padding: 10px; margin-top: 5px; border-radius: 4px; border-left: 3px solid #ff9944;">`;
  
  if (obj.type === 'blob') {
    if (obj.content) {
      // 機密情報が含まれている場合の警告
      if (obj.description && obj.description.includes('機密')) {
        result += `<div style="color: #ff6b6b; font-weight: bold; margin-bottom: 8px;">⚠️ WARNING: 機密情報が検出されました</div>`;
      }
      result += obj.content;
    } else {
      result += '<span style="color: #888;">(empty file)</span>';
    }
  } else if (obj.type === 'tree') {
    result += `<span style="color: #69db7c;">ディレクトリー一覧:</span>\n\n`;
    obj.entries.forEach(entry => {
      result += `${entry.mode} ${entry.type} ${entry.hash.substring(0, 7)}... ${entry.name}\n`;
    });
  } else if (obj.type === 'commit') {
    result += `<span style="color: #69db7c;">Commit information:</span>\n\n`;
    result += `Tree: ${obj.tree}\n`;
    result += `Parent: ${obj.parent || '(none)'}\n`;
    result += `Author: ${obj.author}\n`;
    result += `Committer: ${obj.committer}\n`;
    result += `\nMessage:\n${obj.message}`;
  }
  
  result += `</div>`;
  result += `\n\n<div style="color: #9cdcfe; background: rgba(156, 220, 254, 0.1); padding: 8px 12px; border-radius: 4px; border-left: 3px solid #9cdcfe; margin-top: 10px;">💡 このオブジェクトは通常、zlibで圧縮されて.git/objects/に保存されています</div>`;
  
  // セキュリティの教育的メッセージ
  if (obj.description && obj.description.includes('機密')) {
    result += `\n<div style="background: #4a1e1e; border: 1px solid #ff6b6b; padding: 8px; margin-top: 10px; border-radius: 4px;">`;
    result += `<span style="color: #ff6b6b; font-weight: bold;">🚨 セキュリティリスク:</span><br>`;
    result += `このようなファイルが.gitに残っていると、攻撃者に機密情報が漏洩する可能性があります。`;
    result += `</div>`;
  }
  
  result += `</div>`;
  
  // アコーディオン形式の実際の復元方法を別セクションとして追加
  result += `\n\n<div style="margin-top: 20px; border: 1px solid #555; border-radius: 6px; overflow: hidden;">`;
  result += `<div class="accordion-header" onclick="toggleAccordion('method-details')" style="background: #3a3a3a; padding: 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">`;
  result += `<span style="color: #4fc3f7; font-weight: bold;">🔧 実際のGitオブジェクト復元方法</span>`;
  result += `<span id="method-details-icon" style="color: #4fc3f7; font-size: 16px;">▼</span>`;
  result += `</div>`;
  result += `<div id="method-details" class="accordion-content" style="display: none; background: #2a2a2a; padding: 15px;">`;
  
  result += `<div style="color: #ccc; margin-bottom: 15px;">攻撃者が実際に.gitが公開されたサイトでオブジェクトを復元する手順：</div>`;
  
  // 1. ファイル取得
  result += `<div style="margin: 12px 0;"><span style="color: #ff9944; font-weight: bold;">1. オブジェクトファイルの取得</span></div>`;
  result += `<div style="background: #1a1a1a; padding: 10px; border-radius: 4px; font-family: monospace; margin-left: 15px; margin-bottom: 10px;">`;
  result += `<span style="color: #69db7c;"># HTTPSでオブジェクトファイルを取得</span>\n`;
  result += `curl -s https://target.com/.git/objects/${hash.substring(0,2)}/${hash.substring(2)} -o object_file\n\n`;
  result += `<span style="color: #69db7c;"># またはwgetを使用</span>\n`;
  result += `wget https://target.com/.git/objects/${hash.substring(0,2)}/${hash.substring(2)} -O object_file`;
  result += `</div>`;
  
  // 2. 解凍
  result += `<div style="margin: 12px 0;"><span style="color: #ff9944; font-weight: bold;">2. zlibで圧縮されたオブジェクトを解凍</span></div>`;
  result += `<div style="background: #1a1a1a; padding: 10px; border-radius: 4px; font-family: monospace; margin-left: 15px; margin-bottom: 10px;">`;
  result += `<span style="color: #69db7c;"># Pythonでzlib解凍</span>\n`;
  result += `python3 -c "import zlib; print(zlib.decompress(open('object_file', 'rb').read()).decode('utf-8', errors='ignore'))"\n\n`;
  result += `<span style="color: #69db7c;"># Rubyでzlib解凍</span>\n`;
  result += `ruby -e "require 'zlib'; puts Zlib.inflate(File.binread('object_file'))"\n\n`;
  result += `<span style="color: #69db7c;"># openssl（バイナリデータの場合）</span>\n`;
  result += `openssl zlib -d -in object_file`;
  result += `</div>`;
  
  // 3. Gitコマンド
  result += `<div style="margin: 12px 0;"><span style="color: #ff9944; font-weight: bold;">3. Gitコマンドを使用（.gitディレクトリー内で）</span></div>`;
  result += `<div style="background: #1a1a1a; padding: 10px; border-radius: 4px; font-family: monospace; margin-left: 15px; margin-bottom: 10px;">`;
  result += `<span style="color: #69db7c;"># git cat-fileでオブジェクト内容を表示</span>\n`;
  result += `git cat-file -p ${hash}\n\n`;
  result += `<span style="color: #69db7c;"># オブジェクトタイプを確認</span>\n`;
  result += `git cat-file -t ${hash}\n\n`;
  result += `<span style="color: #69db7c;"># オブジェクトサイズを確認</span>\n`;
  result += `git cat-file -s ${hash}`;
  result += `</div>`;
  
  // 4. 自動化ツール
  result += `<div style="margin: 12px 0;"><span style="color: #ff9944; font-weight: bold;">4. 自動化ツール</span></div>`;
  result += `<div style="background: #1a1a1a; padding: 10px; border-radius: 4px; font-family: monospace; margin-left: 15px; margin-bottom: 15px;">`;
  result += `<span style="color: #69db7c;"># GitHackツール</span>\n`;
  result += `python3 GitHack.py https://target.com/.git/\n\n`;
  result += `<span style="color: #69db7c;"># git-dumperツール</span>\n`;
  result += `git-dumper https://target.com/.git/ output_dir\n\n`;
  result += `<span style="color: #69db7c;"># dvcsripperツール</span>\n`;
  result += `./rip-git.pl -v -u https://target.com/.git/`;
  result += `</div>`;
  
  result += `<div style="background: #4a1e1e; border: 1px solid #ff6b6b; padding: 10px; border-radius: 4px;">`;
  result += `<span style="color: #ff6b6b; font-weight: bold;">⚠️ 重要な注意事項</span><br><br>`;
  result += `• これらのコマンドは<strong>教育目的のみ</strong>で提供されています<br>`;
  result += `• 実際のWebサイトに対して無断で実行することは<strong>法的に問題</strong>となる可能性があります<br>`;
  result += `• 許可されたテスト環境やCTF、自分の環境でのみ使用してください<br>`;
  result += `• 脆弱性テストを行う際は、必ず事前に書面での許可を得てください`;
  result += `</div>`;
  
  result += `</div></div>`;
  
  output.innerHTML = result;
});

// サンプルハッシュを入力フィールドに設定する関数
function setSampleHash(hash) {
  const input = document.getElementById('object-hash');
  input.value = hash;
  
  // 入力フィールドにフォーカスを当てて視覚的フィードバック
  input.focus();
  input.select();
  
  // 簡単なアニメーション効果
  input.style.background = '#e8f5e8';
  setTimeout(() => {
    input.style.background = '';
  }, 500);
  
  // 自動実行はしない - ユーザーが手動で復元ボタンを押すまで待つ
}

// フォルダの展開/折りたたみ機能
function toggleFolder(nodeId) {
  const childrenElement = document.getElementById(nodeId + '-children');
  const iconElement = document.getElementById(nodeId + '-icon');
  
  if (!childrenElement || !iconElement) {
    console.error('Folder elements not found:', nodeId);
    return;
  }
  
  const isVisible = childrenElement.style.display !== 'none';
  
  if (isVisible) {
    // 折りたたみ
    childrenElement.style.maxHeight = childrenElement.scrollHeight + 'px';
    childrenElement.style.transition = 'max-height 0.3s ease-out, opacity 0.3s ease-out';
    
    setTimeout(() => {
      childrenElement.style.maxHeight = '0';
      childrenElement.style.opacity = '0';
    }, 10);
    
    setTimeout(() => {
      childrenElement.style.display = 'none';
      childrenElement.style.maxHeight = '';
      childrenElement.style.opacity = '';
      childrenElement.style.transition = '';
    }, 320);
    
    iconElement.textContent = '▶';
    iconElement.style.transform = 'rotate(-90deg)';
  } else {
    // 展開
    childrenElement.style.display = 'block';
    childrenElement.style.maxHeight = '0';
    childrenElement.style.opacity = '0';
    childrenElement.style.transition = 'max-height 0.3s ease-out, opacity 0.3s ease-out';
    
    setTimeout(() => {
      childrenElement.style.maxHeight = childrenElement.scrollHeight + 'px';
      childrenElement.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
      childrenElement.style.maxHeight = '';
      childrenElement.style.opacity = '';
      childrenElement.style.transition = '';
    }, 320);
    
    iconElement.textContent = '▼';
    iconElement.style.transform = 'rotate(0deg)';
  }
}

// ハッシュ入力フィールドをクリアする関数
function clearHashInput() {
  const input = document.getElementById('object-hash');
  const output = document.getElementById('object-output');
  
  input.value = '';
  output.innerHTML = '';
  input.focus();
  
  // 視覚的フィードバック
  input.style.background = '#ffe6e6';
  setTimeout(() => {
    input.style.background = '';
  }, 300);
}

// クリアボタンのイベントリスナーを設定
document.addEventListener('DOMContentLoaded', () => {
  const clearButton = document.getElementById('clear-hash');
  if (clearButton) {
    clearButton.addEventListener('click', clearHashInput);
  }
});

// アコーディオンの開閉機能
function toggleAccordion(id) {
  const content = document.getElementById(id);
  const icon = document.getElementById(id + '-icon');
  
  if (content.style.display === 'none' || content.style.display === '') {
    content.style.display = 'block';
    icon.textContent = '▲';
    // スムーズなアニメーション効果
    content.style.maxHeight = '0';
    content.style.overflow = 'hidden';
    content.style.transition = 'max-height 0.3s ease-out';
    setTimeout(() => {
      content.style.maxHeight = content.scrollHeight + 'px';
    }, 10);
  } else {
    content.style.maxHeight = '0';
    icon.textContent = '▼';
    setTimeout(() => {
      content.style.display = 'none';
      content.style.maxHeight = '';
    }, 300);
  }
}

// --- リーク検査処理（シミュレーション） ---

// プリセットURLボタンの処理とスキャンボタン制御
document.addEventListener('DOMContentLoaded', () => {
  const presetUrlButtons = document.querySelectorAll('.preset-url-btn');
  const urlInput = document.getElementById('target-url');
  const scanButton = document.getElementById('simulate-leak');
  
  // スキャン状態管理
  let scanState = 'idle'; // 'idle', 'running', 'paused'
  let currentScanProcess = null;
  let pausedStepIndex = 0;
  let currentSteps = [];
  
  // スキャンボタンの状態を更新する関数
  function updateScanButtonState() {
    const url = urlInput.value.trim();
    const isValidUrl = url.startsWith('http://') || url.startsWith('https://');
    
    console.log(`ボタン状態更新: URL="${url}", Valid=${isValidUrl}, State=${scanState}`); // デバッグ用
    
    if (scanState === 'idle') {
      if (isValidUrl) {
        scanButton.disabled = false;
        scanButton.innerHTML = '🚨 スキャン開始';
        scanButton.style.opacity = '1';
        scanButton.style.cursor = 'pointer';
        scanButton.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
        console.log('スキャンボタン: 有効化'); // デバッグ用
      } else {
        scanButton.disabled = true;
        scanButton.innerHTML = '🚨 スキャン開始';
        scanButton.style.opacity = '0.5';
        scanButton.style.cursor = 'not-allowed';
        scanButton.style.background = 'linear-gradient(135deg, #6c757d, #5a6268)';
        console.log('スキャンボタン: 無効化'); // デバッグ用
      }
    } else if (scanState === 'running') {
      scanButton.disabled = false;
      scanButton.innerHTML = '⏸️ 一時停止';
      scanButton.style.opacity = '1';
      scanButton.style.cursor = 'pointer';
      scanButton.style.background = 'linear-gradient(135deg, #ffc107, #e0a800)';
      console.log('スキャンボタン: 一時停止モード'); // デバッグ用
    } else if (scanState === 'paused') {
      scanButton.disabled = false;
      scanButton.innerHTML = '▶️ 再開';
      scanButton.style.opacity = '1';
      scanButton.style.cursor = 'pointer';
      scanButton.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
      console.log('スキャンボタン: 再開モード'); // デバッグ用
    }
  }
  
  // スキャン状態を変更する関数
  function setScanState(newState) {
    scanState = newState;
    updateScanButtonState();
  }
  
  // 現在のスキャンプロセスを保存する関数
  function setScanProcess(process) {
    currentScanProcess = process;
  }
  
  // 初期状態でボタンを無効化
  updateScanButtonState();
  
  // URL入力フィールドの変更を監視
  urlInput.addEventListener('input', () => {
    console.log('URL input changed:', urlInput.value); // デバッグ用
    updateScanButtonState();
  });
  urlInput.addEventListener('paste', () => {
    // ペースト後に少し遅延して状態更新
    setTimeout(() => {
      console.log('URL pasted:', urlInput.value); // デバッグ用
      updateScanButtonState();
    }, 10);
  });
  
  // スピード選択の変更を監視してデバッグ情報を表示
  document.addEventListener('change', (e) => {
    if (e.target.name === 'scan-speed') {
      console.log('スピード変更:', e.target.value + 'x');
      
      // 視覚的フィードバックを追加
      const speedLabel = e.target.nextElementSibling;
      if (speedLabel) {
        speedLabel.style.transform = 'scale(1.05)';
        speedLabel.style.color = '#007bff';
        setTimeout(() => {
          speedLabel.style.transform = '';
          speedLabel.style.color = '';
        }, 200);
      }
    }
  });
  
  // プリセットボタンのクリック処理
  presetUrlButtons.forEach(button => {
    button.addEventListener('click', () => {
      const url = button.getAttribute('data-url');
      urlInput.value = url;
      
      // スキャンボタンの状態を更新
      updateScanButtonState();
      
      // 視覚的フィードバック
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = '';
      }, 150);
    });
  });
  
  // グローバルスコープに関数を追加
  window.setScanState = setScanState;
  window.getScanState = () => scanState;
  window.setPausedStepIndex = (index) => { pausedStepIndex = index; };
  window.getPausedStepIndex = () => pausedStepIndex;
  window.setCurrentSteps = (steps) => { currentSteps = steps; };
  window.getCurrentSteps = () => currentSteps;
  
  // 新しいボタンのイベントリスナーを追加
  const skipButton = document.getElementById('skip-scan');
  const pauseButton = document.getElementById('pause-scan');
  const resumeButton = document.getElementById('resume-scan');
  
  // スキップボタン
  if (skipButton) {
    skipButton.addEventListener('click', () => {
      skipScan();
    });
  }
  
  // 一時停止ボタン
  if (pauseButton) {
    pauseButton.addEventListener('click', () => {
      pauseScan();
      pauseButton.style.display = 'none';
      resumeButton.style.display = 'inline-block';
    });
  }
  
  // 再開ボタン
  if (resumeButton) {
    resumeButton.addEventListener('click', async () => {
      const result = document.getElementById('leak-result');
      await resumeScan(result);
      resumeButton.style.display = 'none';
      pauseButton.style.display = 'inline-block';
    });
  }
  
  // ヘルプモーダルのイベントリスナー
  const helpButton = document.getElementById('help-button');
  const helpModal = document.getElementById('help-modal');
  const closeHelpModal = document.getElementById('close-help-modal');
  
  console.log('ヘルプボタン要素:', helpButton); // デバッグ用
  console.log('ヘルプモーダル要素:', helpModal); // デバッグ用
  
  // ヘルプボタンクリック
  if (helpButton && helpModal) {
    console.log('ヘルプボタンイベントリスナー設定完了'); // デバッグ用
    
    // クリックイベントを追加
    helpButton.addEventListener('click', (e) => {
      console.log('ヘルプボタンがクリックされました'); // デバッグ用
      e.preventDefault();
      e.stopPropagation();
      helpModal.style.display = 'flex';
      document.body.style.overflow = 'hidden'; // スクロール無効化
    });
    
    // 代替のイベントも追加（念のため）
    helpButton.addEventListener('mousedown', (e) => {
      console.log('ヘルプボタンがマウスダウンされました'); // デバッグ用
    });
    
    // テスト用: 3秒後に自動でモーダルを開いてテスト
    setTimeout(() => {
      console.log('テスト: 3秒後にモーダルを自動表示');
      if (helpModal.style.display !== 'flex') {
        // helpModal.style.display = 'flex';
        // document.body.style.overflow = 'hidden';
        console.log('テスト用自動表示は無効化されています');
      }
    }, 3000);
    
  } else {
    console.error('ヘルプボタンまたはモーダルが見つかりません', { helpButton, helpModal }); // デバッグ用
  }
  
  // モーダル閉じるボタン
  if (closeHelpModal && helpModal) {
    console.log('モーダル閉じるボタンイベントリスナー設定完了'); // デバッグ用
    closeHelpModal.addEventListener('click', (e) => {
      console.log('モーダル閉じるボタンがクリックされました'); // デバッグ用
      e.preventDefault();
      e.stopPropagation();
      helpModal.style.display = 'none';
      document.body.style.overflow = 'auto'; // スクロール復元
    });
  }
  
  // オーバーレイクリックで閉じる
  if (helpModal) {
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) {
        console.log('オーバーレイクリックでモーダルを閉じます'); // デバッグ用
        helpModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // スクロール復元
      }
    });
  }
  
  // ESCキーで閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && helpModal && helpModal.style.display === 'flex') {
      console.log('ESCキーでモーダルを閉じます'); // デバッグ用
      helpModal.style.display = 'none';
      document.body.style.overflow = 'auto'; // スクロール復元
    }
  });
});

document.getElementById('simulate-leak').addEventListener('click', async () => {
  const url = document.getElementById('target-url').value.trim();
  const result = document.getElementById('leak-result');
  const scanButton = document.getElementById('simulate-leak');
  const currentState = window.getScanState();

  // 状態に応じて処理を分岐
  if (currentState === 'idle') {
    // 新しいスキャンを開始
    await startNewScan(url, result);
  } else if (currentState === 'running') {
    // スキャンを一時停止
    pauseScan();
  } else if (currentState === 'paused') {
    // スキャンを再開
    await resumeScan(result);
  }
});

// 新しいスキャンを開始する関数
async function startNewScan(url, result) {
  // ボタンが無効化されている場合は処理を停止
  const scanButton = document.getElementById('simulate-leak');
  const pauseButton = document.getElementById('pause-scan');
  const resumeButton = document.getElementById('resume-scan');
  
  // コントロールボタンの初期状態を設定
  if (pauseButton) pauseButton.style.display = 'inline-block';
  if (resumeButton) resumeButton.style.display = 'none';
  
  if (scanButton.disabled && window.getScanState() === 'idle') {
    result.innerHTML = `
      <div class="error-message">
        <h3>⚠️ エラー</h3>
        <p>有効なURLを入力してください（http/httpsで始まる）</p>
        <p>例: https://example.com</p>
        <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #007bff;">
          <strong>💡 ヒント:</strong> プリセットURLボタンを使うか、完全なURLを入力してください
        </div>
      </div>
    `;
    return;
  }

  if (!url.startsWith('http')) {
    result.innerHTML = `
      <div class="error-message">
        <h3>⚠️ エラー</h3>
        <p>有効なURLを入力してください（http/httpsで始まる）</p>
        <p>例: https://example.com</p>
      </div>
    `;
    return;
  }

  // スキャン開始
  window.setScanState('running');
  window.setPausedStepIndex(0);
  
  // 選択されたチェックボックスを確認
  const checkOptions = {
    head: document.getElementById('check-head').checked,
    config: document.getElementById('check-config').checked,
    logs: document.getElementById('check-logs').checked,
    refs: document.getElementById('check-refs').checked,
    objects: document.getElementById('check-objects').checked
  };

  // 動的にステップを生成
  // XSS対策: URLをHTMLエスケープ
  const escapedUrl = escapeHtml(url);

  const steps = [
    { icon: '🎯', text: `対象URL: <code>${escapedUrl}</code>`, delay: 0, type: 'info' }
  ];

  let stepDelay = 500;

  if (checkOptions.head) {
    steps.push(
      { icon: '📡', text: `<code>${escapedUrl}/.git/HEAD</code> にアクセスを試行...`, delay: stepDelay, type: 'scan' },
      { icon: '✅', text: 'HEADファイルを取得: <code>ref: refs/heads/main</code>', delay: stepDelay + 500, type: 'success' }
    );
    stepDelay += 1000;
  }

  if (checkOptions.config) {
    steps.push(
      { icon: '📡', text: `<code>${escapedUrl}/.git/config</code> をスキャン...`, delay: stepDelay, type: 'scan' },
      { icon: '🔍', text: 'リポジトリ設定を発見: リモートURL、ユーザー情報を取得', delay: stepDelay + 500, type: 'info' }
    );
    stepDelay += 1000;
  }

  if (checkOptions.logs) {
    steps.push(
      { icon: '📡', text: `<code>${escapedUrl}/.git/logs/HEAD</code> をスキャン...`, delay: stepDelay, type: 'scan' },
      { icon: '📜', text: 'コミット履歴ログを発見: 過去のハッシュ値を特定', delay: stepDelay + 500, type: 'warning' }
    );
    stepDelay += 1000;
  }

  if (checkOptions.refs) {
    steps.push(
      { icon: '📡', text: `<code>${escapedUrl}/.git/refs/</code> をスキャン...`, delay: stepDelay, type: 'scan' },
      { icon: '🌿', text: 'ブランチ情報を発見: main, develop, feature/secrets', delay: stepDelay + 500, type: 'info' }
    );
    stepDelay += 1000;
  }

  if (checkOptions.objects) {
    steps.push(
      { icon: '📡', text: `<code>${escapedUrl}/.git/objects/</code> をスキャン...`, delay: stepDelay, type: 'scan' },
      { icon: '📦', text: 'オブジェクトファイルを発見: コミット・ツリー・blobを復元中...', delay: stepDelay + 500, type: 'warning' },
      { icon: '💾', text: '機密ファイルを復元: .env, config.yaml, private.key', delay: stepDelay + 1000, type: 'danger' }
    );
    stepDelay += 1500;
  }

  steps.push(
    { icon: '🚨', text: '<strong style="color: #dc3545;">警告: リポジトリ全体の復元が完了しました！</strong>', delay: stepDelay + 500, type: 'danger' }
  );

  // ステップを保存
  window.setCurrentSteps(steps);
  
  // プログレスバーを表示・初期化
  showProgressBar(steps.length);
  
  result.innerHTML = '<div id="leak-steps" class="scan-progress"></div>';
  await executeScanSteps(steps, 0, checkOptions);
}

// スキャンステップを実行する関数
async function executeScanSteps(steps, startIndex, checkOptions) {
  const stepsContainer = document.getElementById('leak-steps');
  
  // スキップ状態をチェック
  if (window.getScanState() === 'skipped') {
    await showAllStepsInstantly(steps, stepsContainer, checkOptions);
    return;
  }
  
  // 選択された速度を取得
  const speedRadio = document.querySelector('input[name="scan-speed"]:checked');
  const speedMultiplier = speedRadio ? parseFloat(speedRadio.value) : 1;
  const baseDelay = Math.max(100, 800 / speedMultiplier); // より大きな基本遅延と最小値を設定
  const fadeDelay = Math.max(20, 100 / speedMultiplier); // フェードイン遅延も速度に応じて調整
  
  console.log(`スキャン速度: ${speedMultiplier}x, 遅延: ${baseDelay}ms`); // デバッグ用
  
  for (let i = startIndex; i < steps.length; i++) {
    // 停止状態をチェック
    if (window.getScanState() === 'paused') {
      window.setPausedStepIndex(i);
      updateProgressBar(i, steps.length, steps[i].text, true); // 一時停止状態
      return;
    }
    
    // スキップ状態をチェック
    if (window.getScanState() === 'skipped') {
      await showAllStepsInstantly(steps, stepsContainer, checkOptions);
      return;
    }
    
    const step = steps[i];
    
    // プログレスバーを更新
    updateProgressBar(i + 1, steps.length, step.text, false); // i+1で正確な進捗を表示
    
    // ステップ間の遅延（最初のステップ以外）
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, baseDelay));
    }
    
    const stepDiv = document.createElement('div');
    stepDiv.className = `scan-step scan-step-${step.type}`;
    const transitionDuration = Math.max(0.2, 0.5 / speedMultiplier); // トランジション時間も速度に応じて調整
    stepDiv.style.cssText = `opacity: 0; transition: opacity ${transitionDuration}s; margin: 8px 0; padding: 10px; border-radius: 6px;`;
    stepDiv.innerHTML = `<span class="step-icon">${step.icon}</span> <span class="step-text">${step.text}</span>`;
    
    // ステップタイプに応じた背景色
    const bgColors = {
      info: 'background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border-left: 4px solid #2196f3;',
      scan: 'background: linear-gradient(135deg, #fff3e0, #ffe0b2); border-left: 4px solid #ff9800;',
      success: 'background: linear-gradient(135deg, #e8f5e8, #c8e6c9); border-left: 4px solid #4caf50;',
      warning: 'background: linear-gradient(135deg, #fff3cd, #ffeaa7); border-left: 4px solid #ffc107;',
      danger: 'background: linear-gradient(135deg, #f8d7da, #f5c6cb); border-left: 4px solid #dc3545;'
    };
    stepDiv.style.cssText += bgColors[step.type] || bgColors.info;
    
    stepsContainer.appendChild(stepDiv);
    
    // フェードイン（速度に応じて調整）
    setTimeout(() => {
      stepDiv.style.opacity = '1';
    }, fadeDelay);
  }
  
  // 全ステップ完了後、サマリーを表示
  if (window.getScanState() === 'running') {
    updateProgressBar(steps.length, steps.length, 'スキャン完了', false);
    await showScanSummary(checkOptions);
    hideProgressBar();
    window.setScanState('idle');
  }
}

// スキャンを一時停止する関数
function pauseScan() {
  window.setScanState('paused');
}

// スキャンを再開する関数
async function resumeScan(result) {
  window.setScanState('running');
  const steps = window.getCurrentSteps();
  const startIndex = window.getPausedStepIndex();
  
  // チェックボックスの状態を再取得
  const checkOptions = {
    head: document.getElementById('check-head').checked,
    config: document.getElementById('check-config').checked,
    logs: document.getElementById('check-logs').checked,
    refs: document.getElementById('check-refs').checked,
    objects: document.getElementById('check-objects').checked
  };
  
  await executeScanSteps(steps, startIndex, checkOptions);
}

// スキャンサマリーを表示する関数
async function showScanSummary(checkOptions) {
  const result = document.getElementById('leak-result');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const risksFound = [];
  const risksCount = Object.values(checkOptions).filter(Boolean).length;
  
  if (checkOptions.head) risksFound.push('HEADファイル露出');
  if (checkOptions.config) risksFound.push('設定ファイル漏洩');
  if (checkOptions.logs) risksFound.push('履歴ログ露出');
  if (checkOptions.refs) risksFound.push('ブランチ情報漏洩');
  if (checkOptions.objects) risksFound.push('機密ファイル復元');

  result.innerHTML += `
    <div class="scan-summary">
      <h3>🚨 スキャン結果サマリー</h3>
      <div class="risk-summary-grid">
        <div class="risk-stat">
          <div class="risk-number">${risksCount}</div>
          <div class="risk-label">脆弱性項目</div>
        </div>
        <div class="risk-stat">
          <div class="risk-number">${risksFound.length}</div>
          <div class="risk-label">検出された問題</div>
        </div>
        <div class="risk-stat">
          <div class="risk-number">HIGH</div>
          <div class="risk-label">リスクレベル</div>
        </div>
      </div>
      
      <div class="found-risks">
        <h4>🔍 発見された脆弱性:</h4>
        <ul>
          ${risksFound.map(risk => `<li>${risk}</li>`).join('')}
        </ul>
      </div>
      
      <div class="impact-analysis">
        <h4>💥 影響範囲:</h4>
        <div class="impact-items">
          <div class="impact-item">📋 ソースコード全体の漏洩</div>
          <div class="impact-item">🔑 機密情報（APIキー、パスワード）の暴露</div>
          <div class="impact-item">👥 開発者の個人情報露出</div>
          <div class="impact-item">🕰️ 削除済みファイルの復元</div>
          <div class="impact-item">🌿 全ブランチ・タグ情報の取得</div>
        </div>
      </div>
      
      <div class="recommendation">
        <h4>🛡️ 対策推奨事項:</h4>
        <ol>
          <li>Webサーバーで<code>/.git</code>ディレクトリーへのアクセスを即座に拒否</li>
          <li>本番環境から<code>.git</code>ディレクトリーを完全削除</li>
          <li>漏洩した機密情報（APIキー等）の無効化・再生成</li>
          <li>git filter-branchによる機密情報の履歴からの完全削除</li>
          <li>定期的なセキュリティスキャンの実施</li>
        </ol>
      </div>
      
      <div class="simulation-notice">
        <p><strong>📝 注意:</strong> これは教育用シミュレーションです。実際のWebサイトへのアクセスは行われていません。</p>
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <button onclick="resetScan()" style="background: linear-gradient(135deg, #6c757d, #5a6268); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
          🔄 新しいスキャンを開始
        </button>
      </div>
    </div>
  `;
}

// スキャンをリセットする関数
function resetScan() {
  window.setScanState('idle');
  window.setPausedStepIndex(0);
  window.setCurrentSteps([]);
  
  const result = document.getElementById('leak-result');
  result.innerHTML = `
    <div class="initial-message">
      <h3>💡 使用方法</h3>
      <p>上記にURLを入力して「スキャン開始」ボタンを押すと、.gitディレクトリーの漏洩検査をシミュレーションします。</p>
      <div class="warning-box">
        <strong>⚠️ 重要な注意:</strong>
        <p>これは教育用シミュレーターです。実際のWebサイトへのアクセスは行いません。</p>
        <p>実際のサイトに対して無断でこのような検査を行うことは<strong>絶対におやめください</strong>。</p>
      </div>
    </div>
  `;
}

// --- 構造比較機能 ---

// 比較用のプリセットデータ
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

// 比較用ツリーレンダリング関数（差分表示付き）
function renderComparisonTree(node, otherNode, level = 0, isLast = true, prefix = '', parentHash = '') {
  let riskColor = '';
  let riskIcon = '';
  let diffClass = '';
  
  // 差分の判定
  if (!otherNode) {
    diffClass = 'diff-removed'; // 左側にしか存在しない
  } else if (!node) {
    diffClass = 'diff-added'; // 右側にしか存在しない
  } else if (node.risk !== otherNode.risk) {
    diffClass = 'diff-changed'; // リスクレベルが異なる
  } else {
    diffClass = 'diff-same'; // 同じ
  }
  
  if (node && node.risk === 'high') {
    riskColor = 'background: rgba(255, 255, 255, 0.9); color: #ff3333; border: 1px solid #ff3333; font-weight: bold;';
    riskIcon = '💥';
  } else if (node && node.risk === 'medium') {
    riskColor = 'background: rgba(255, 255, 255, 0.9); color: #ff8800; border: 1px solid #ff8800; font-weight: bold;';
    riskIcon = '💣';
  } else if (node && node.risk === 'low') {
    riskColor = 'background: rgba(255, 255, 255, 0.9); color: #22aa22; border: 1px solid #22aa22; font-weight: bold;';
    riskIcon = '⚠️';
  }
  
  const riskBadge = (node && node.risk) ? `<span style="${riskColor} font-size: 0.8em; padding: 1px 4px; border-radius: 3px; margin-left: 4px;"> ${riskIcon} [${node.risk.toUpperCase()}]</span>` : '';
  
  // ツリーの枝を作成
  let branch = '';
  if (level > 0) {
    branch = prefix + (isLast ? '└── ' : '├── ');
  }
  
  const currentNode = node || { name: otherNode.name, type: otherNode.type };
  const icon = currentNode.type === 'folder' ? '📁' : '📄';
  
  // 差分表示用のマーカー
  let diffMarker = '';
  if (diffClass === 'diff-added') {
    diffMarker = '<span style="color: #28a745; font-weight: bold;">+ </span>';
  } else if (diffClass === 'diff-removed') {
    diffMarker = '<span style="color: #dc3545; font-weight: bold;">- </span>';
  } else if (diffClass === 'diff-changed') {
    diffMarker = '<span style="color: #ffc107; font-weight: bold;">! </span>';
  }
  
  let result = `${branch}${diffMarker}${icon} ${currentNode.name}${riskBadge}\n`;
  
  // 子要素の処理
  if (currentNode.children && currentNode.children.length > 0) {
    const nextPrefix = prefix + (isLast ? '    ' : '│   ');
    currentNode.children.forEach((child, index) => {
      const isLastChild = index === currentNode.children.length - 1;
      const otherChild = otherNode && otherNode.children ? 
        otherNode.children.find(c => c.name === child.name) : null;
      result += renderComparisonTree(child, otherChild, level + 1, isLastChild, nextPrefix, parentHash);
    });
  }
  
  return result;
}

// 比較統計を生成
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

// 比較レポートをレンダリング
function renderComparisonReport(stats, leftTitle, rightTitle) {
  const { left, right } = stats;
  
  let recommendation = '';
  const totalLeftRisk = left.high + left.medium + left.low;
  const totalRightRisk = right.high + right.medium + right.low;
  
  if (totalLeftRisk < totalRightRisk) {
    recommendation = `${leftTitle} の方がセキュリティリスクが低く、より安全です。`;
  } else if (totalLeftRisk > totalRightRisk) {
    recommendation = `${rightTitle} の方がセキュリティリスクが低く、より安全です。`;
  } else {
    recommendation = '両方の構造のセキュリティリスクレベルは同等です。';
  }
  
  return `
    <h3>📊 比較分析表</h3>
    <div class="comparison-table-container">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>項目</th>
            <th>${leftTitle}</th>
            <th>${rightTitle}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>💥 高リスク要素</strong></td>
            <td class="risk-cell ${left.high > right.high ? 'higher-risk' : left.high < right.high ? 'lower-risk' : ''}">${left.high}個</td>
            <td class="risk-cell ${right.high > left.high ? 'higher-risk' : right.high < left.high ? 'lower-risk' : ''}">${right.high}個</td>
          </tr>
          <tr>
            <td><strong>💣 中リスク要素</strong></td>
            <td class="risk-cell ${left.medium > right.medium ? 'higher-risk' : left.medium < right.medium ? 'lower-risk' : ''}">${left.medium}個</td>
            <td class="risk-cell ${right.medium > left.medium ? 'higher-risk' : right.medium < left.medium ? 'lower-risk' : ''}">${right.medium}個</td>
          </tr>
          <tr>
            <td><strong>⚠️ 低リスク要素</strong></td>
            <td class="risk-cell ${left.low > right.low ? 'higher-risk' : left.low < right.low ? 'lower-risk' : ''}">${left.low}個</td>
            <td class="risk-cell ${right.low > left.low ? 'higher-risk' : right.low < left.low ? 'lower-risk' : ''}">${right.low}個</td>
          </tr>
          <tr class="summary-row">
            <td><strong>🎯 総リスク要素</strong></td>
            <td class="risk-cell total ${totalLeftRisk > totalRightRisk ? 'higher-risk' : totalLeftRisk < totalRightRisk ? 'lower-risk' : ''}">${totalLeftRisk}個</td>
            <td class="risk-cell total ${totalRightRisk > totalLeftRisk ? 'higher-risk' : totalRightRisk < totalLeftRisk ? 'lower-risk' : ''}">${totalRightRisk}個</td>
          </tr>
          <tr>
            <td><strong>📄 ファイル数</strong></td>
            <td class="count-cell">${left.files}個</td>
            <td class="count-cell">${right.files}個</td>
          </tr>
          <tr>
            <td><strong>📁 フォルダー数</strong></td>
            <td class="count-cell">${left.folders}個</td>
            <td class="count-cell">${right.folders}個</td>
          </tr>
          <tr class="summary-row">
            <td><strong>📊 総アイテム数</strong></td>
            <td class="count-cell total">${left.files + left.folders}個</td>
            <td class="count-cell total">${right.files + right.folders}個</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="recommendation">
      <h4>💡 推奨事項</h4>
      <p>${recommendation}</p>
      <p>セキュリティを向上させるには:</p>
      <ul>
        <li>.gitディレクトリーのWeb公開を防ぐ</li>
        <li>機密情報を含むファイルの履歴からの完全削除</li>
        <li>適切な.gitignore設定の実装</li>
        <li>定期的なセキュリティスキャンの実行</li>
      </ul>
    </div>
  `;
}

// 各プリセットの説明
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

// プリセット比較を実行
function loadPresetComparison(presetKey) {
  const preset = comparisonPresets[presetKey];
  const description = presetDescriptions[presetKey];
  
  if (!preset || !description) {
    console.error('Preset not found:', presetKey);
    return;
  }
  
  // タイトルを更新
  document.getElementById('left-title').innerHTML = `${preset.left.title}<br><small style="font-size: 0.8em; color: #6c757d; font-weight: normal;">${description.leftDesc}</small>`;
  document.getElementById('right-title').innerHTML = `${preset.right.title}<br><small style="font-size: 0.8em; color: #6c757d; font-weight: normal;">${description.rightDesc}</small>`;
  
  // ツリーを描画
  const leftTree = document.getElementById('left-tree');
  const rightTree = document.getElementById('right-tree');
  
  leftTree.innerHTML = renderComparisonTree(preset.left.data, preset.right.data);
  rightTree.innerHTML = renderComparisonTree(preset.right.data, preset.left.data);
  
  // 比較レポートを生成
  const stats = generateComparisonStats(preset.left.data, preset.right.data);
  const reportContainer = document.getElementById('comparison-report');
  reportContainer.innerHTML = `
    <div class="comparison-description">
      <h3>📝 比較の概要</h3>
      <p>${description.description}</p>
    </div>
    ${renderComparisonReport(stats, preset.left.title, preset.right.title)}
  `;
}

// プリセットボタンのイベントリスナーを設定
document.addEventListener('DOMContentLoaded', () => {
  const presetButtons = document.querySelectorAll('.preset-button');
  presetButtons.forEach(button => {
    button.addEventListener('click', () => {
      const preset = button.getAttribute('data-preset');
      loadPresetComparison(preset);
      
      // ボタンの視覚的フィードバック
      presetButtons.forEach(btn => btn.style.transform = '');
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = '';
      }, 150);
    });
  });
});

// --- プログレスバー制御関数 ---

// プログレスバーを表示・初期化する関数
function showProgressBar(totalSteps) {
  const container = document.getElementById('scan-progress-container');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const progressPercentage = document.getElementById('progress-percentage');
  const currentStep = document.getElementById('current-step');
  const stepCounter = document.getElementById('step-counter');
  
  // コンテナを表示
  container.style.display = 'block';
  
  // 初期状態にリセット
  progressBar.style.width = '0%';
  progressText.textContent = 'スキャン開始...';
  progressPercentage.textContent = '0%';
  currentStep.textContent = '準備中';
  stepCounter.textContent = `0 / ${totalSteps}`;
  
  // アニメーション開始
  progressBar.style.animationPlayState = 'running';
}

// プログレスバーを更新する関数
function updateProgressBar(currentStep, totalSteps, stepText, isPaused) {
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const progressPercentage = document.getElementById('progress-percentage');
  const currentStepElement = document.getElementById('current-step');
  const stepCounter = document.getElementById('step-counter');
  
  // 進行率を計算
  const percentage = Math.round((currentStep / totalSteps) * 100);
  
  // プログレスバーの幅を更新
  progressBar.style.width = `${percentage}%`;
  
  // パーセンテージ表示を更新
  progressPercentage.textContent = `${percentage}%`;
  
  // ステップカウンターを更新
  stepCounter.textContent = `${currentStep} / ${totalSteps}`;
  
  // ステップテキストからHTMLタグを除去して表示
  const cleanText = stepText.replace(/<[^>]*>/g, '');
  currentStepElement.textContent = cleanText;
  
  // 一時停止状態の処理
  if (isPaused) {
    progressText.textContent = '⏸️ 一時停止中...';
    progressBar.style.animationPlayState = 'paused';
    progressBar.style.opacity = '0.7';
  } else {
    progressText.textContent = currentStep === totalSteps ? 'スキャン完了' : 'スキャン中...';
    progressBar.style.animationPlayState = 'running';
    progressBar.style.opacity = '1';
  }
  
  // 完了時の特別な処理
  if (currentStep === totalSteps && !isPaused) {
    progressText.textContent = '✅ スキャン完了';
    currentStepElement.textContent = '全ての検査が完了しました';
    progressBar.style.animationPlayState = 'paused';
  }
}

// プログレスバーを非表示にする関数
function hideProgressBar() {
  const container = document.getElementById('scan-progress-container');
  
  // フェードアウトアニメーション
  container.style.transition = 'opacity 0.5s ease-out';
  container.style.opacity = '0';
  
  // 完全に非表示にする
  setTimeout(() => {
    container.style.display = 'none';
    container.style.opacity = '1'; // 次回表示時のためにリセット
    container.style.transition = '';
  }, 500);
}

// 全ステップを瞬時に表示する関数（スキップ用）
async function showAllStepsInstantly(steps, stepsContainer, checkOptions) {
  // プログレスバーを100%に設定
  updateProgressBar(steps.length, steps.length, 'スキャン完了', false);
  
  // 全ステップを瞬時に表示
  steps.forEach((step, index) => {
    const stepDiv = document.createElement('div');
    stepDiv.className = `scan-step scan-step-${step.type}`;
    stepDiv.style.cssText = 'opacity: 1; margin: 8px 0; padding: 10px; border-radius: 6px;';
    stepDiv.innerHTML = `<span class="step-icon">${step.icon}</span> <span class="step-text">${step.text}</span>`;
    
    // ステップタイプに応じた背景色
    const bgColors = {
      info: 'background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border-left: 4px solid #2196f3;',
      scan: 'background: linear-gradient(135deg, #fff3e0, #ffe0b2); border-left: 4px solid #ff9800;',
      success: 'background: linear-gradient(135deg, #e8f5e8, #c8e6c9); border-left: 4px solid #4caf50;',
      warning: 'background: linear-gradient(135deg, #fff3cd, #ffeaa7); border-left: 4px solid #ffc107;',
      danger: 'background: linear-gradient(135deg, #f8d7da, #f5c6cb); border-left: 4px solid #dc3545;'
    };
    stepDiv.style.cssText += bgColors[step.type] || bgColors.info;
    
    stepsContainer.appendChild(stepDiv);
  });
  
  // サマリーを表示
  await showScanSummary(checkOptions);
  hideProgressBar();
  window.setScanState('idle');
}

// スキップボタンの処理
function skipScan() {
  window.setScanState('skipped');
}
