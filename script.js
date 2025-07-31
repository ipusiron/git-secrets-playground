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
    const response = await fetch('data/sample_git_structure.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
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

function renderTree(node, level = 0, isLast = true, prefix = '') {
  const icon = node.type === 'folder' ? '📁' : '📄';
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
  
  let html = `<div style="white-space: pre; font-family: monospace;">`;
  html += `<span style="color: #888;">${branch}</span>${icon} <span>${node.name}</span>${riskBadge}`;
  
  // リスク説明を追加
  if (node.risk) {
    const descPrefix = prefix + (isLast ? '    ' : '│   ');
    html += `\n<span style="color: #888;">${descPrefix}</span><span style="font-size: 0.85em; color: #999;">${getRiskDescription(node.name)}</span>`;
  }
  
  html += `</div>`;
  
  if (node.children) {
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    node.children.forEach((child, index) => {
      const isChildLast = index === node.children.length - 1;
      html += renderTree(child, level + 1, isChildLast, childPrefix);
    });
  }
  
  return html;
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
const sampleObjects = {
  // Blob object (file content)
  'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391': {
    type: 'blob',
    size: 0,
    content: ''
  },
  '557db03de997c86a4a028e1ebd3a1ceb225be238': {
    type: 'blob', 
    size: 12,
    content: 'Hello World\n'
  },
  // Tree object
  '4b825dc642cb6eb9a060e54bf8d69288fbee4904': {
    type: 'tree',
    entries: [
      { mode: '100644', type: 'blob', hash: 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391', name: 'README.md' },
      { mode: '100644', type: 'blob', hash: '557db03de997c86a4a028e1ebd3a1ceb225be238', name: 'hello.txt' }
    ]
  },
  // Commit object
  '89e6c98cbe0ffaa2f1ce9e8c19ca7ee4ad51eb42': {
    type: 'commit',
    tree: '4b825dc642cb6eb9a060e54bf8d69288fbee4904',
    parent: null,
    author: 'John Doe <john@example.com> 1638360000 +0900',
    committer: 'John Doe <john@example.com> 1638360000 +0900',
    message: 'Initial commit'
  }
};

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
• 4b825dc642cb6eb9a060e54bf8d69288fbee4904 (treeオブジェクト)
• 89e6c98cbe0ffaa2f1ce9e8c19ca7ee4ad51eb42 (commitオブジェクト)
</div>`;
    return;
  }

  let result = `<div style="font-family: monospace;">`;
  result += `<span style="color: #44ff44;">✓ オブジェクトを復元しました</span>\n\n`;
  result += `<span style="color: #ff9944;">SHA-1:</span> ${hash}\n`;
  result += `<span style="color: #ff9944;">Type:</span> ${obj.type}\n`;
  
  if (obj.type === 'blob') {
    result += `<span style="color: #ff9944;">Size:</span> ${obj.size} bytes\n\n`;
    result += `<span style="color: #ff9944;">Content:</span>\n`;
    result += `<div style="background: #333; padding: 10px; margin-top: 5px; border-radius: 4px;">`;
    result += obj.content || '(empty file)';
    result += `</div>`;
  } else if (obj.type === 'tree') {
    result += `\n<span style="color: #ff9944;">Entries:</span>\n`;
    obj.entries.forEach(entry => {
      result += `  ${entry.mode} ${entry.type} ${entry.hash.substring(0, 7)}... ${entry.name}\n`;
    });
  } else if (obj.type === 'commit') {
    result += `<span style="color: #ff9944;">Tree:</span> ${obj.tree}\n`;
    result += `<span style="color: #ff9944;">Parent:</span> ${obj.parent || '(none)'}\n`;
    result += `<span style="color: #ff9944;">Author:</span> ${obj.author}\n`;
    result += `<span style="color: #ff9944;">Committer:</span> ${obj.committer}\n`;
    result += `\n<span style="color: #ff9944;">Message:</span>\n${obj.message}\n`;
  }
  
  result += `\n<span style="color: #666;">※ これはシミュレーションです。実際のGitオブジェクトはzlib圧縮されています。</span>`;
  result += `</div>`;
  
  output.innerHTML = result;
});

// --- リーク検査処理（シミュレーション） ---
document.getElementById('simulate-leak').addEventListener('click', async () => {
  const url = document.getElementById('target-url').value.trim();
  const result = document.getElementById('leak-result');

  if (!url.startsWith('http')) {
    result.innerHTML = '<span style="color: #ff4444;">⚠️ 有効なURLを入力してください（http/httpsで始まる）</span>';
    return;
  }

  // アニメーション付きのステップ表示
  const steps = [
    { icon: '🔍', text: `対象URL: <code>${url}</code>`, delay: 0 },
    { icon: '📡', text: `<code>${url}/.git/HEAD</code> にアクセスを試行...`, delay: 500 },
    { icon: '✅', text: 'HEADファイルを取得: <code>ref: refs/heads/main</code>', delay: 1000 },
    { icon: '🔗', text: '<code>.git/refs/heads/main</code> から最新コミットハッシュを取得', delay: 1500 },
    { icon: '📦', text: 'コミットハッシュ: <code>a3f5c8b9d2e1...</code>', delay: 2000 },
    { icon: '🌳', text: '<code>.git/objects/a3/f5c8b9d2e1...</code> からコミットオブジェクトを復元', delay: 2500 },
    { icon: '📂', text: 'ツリーオブジェクトを解析してファイル一覧を取得', delay: 3000 },
    { icon: '💾', text: '各ファイルのblobオブジェクトを復元', delay: 3500 },
    { icon: '⚠️', text: '<strong style="color: #ff4444;">警告: リポジトリ全体の復元が可能な状態です！</strong>', delay: 4000 }
  ];

  result.innerHTML = '<div id="leak-steps"></div>';
  const stepsContainer = document.getElementById('leak-steps');
  
  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, step.delay));
    const stepDiv = document.createElement('div');
    stepDiv.style.cssText = 'opacity: 0; transition: opacity 0.5s; margin: 8px 0;';
    stepDiv.innerHTML = `${step.icon} ${step.text}`;
    stepsContainer.appendChild(stepDiv);
    
    // フェードイン
    setTimeout(() => {
      stepDiv.style.opacity = '1';
    }, 50);
  }
  
  // 最終結果
  setTimeout(() => {
    result.innerHTML += `
      <div style="background: #422; border: 1px solid #844; padding: 15px; margin-top: 20px; border-radius: 4px;">
        <h4 style="color: #ff4444; margin-top: 0;">🚨 セキュリティリスクの概要</h4>
        <ul style="margin: 10px 0;">
          <li>機密情報（APIキー、パスワードなど）の漏洩</li>
          <li>過去のコミット履歴からの情報収集</li>
          <li>削除したファイルの復元</li>
          <li>開発者情報（メールアドレス等）の露出</li>
        </ul>
        <p style="margin-bottom: 0; color: #ccc; font-size: 0.9em;">
          ※ この動作はすべてシミュレーションであり、実際のアクセスは行われていません。
        </p>
      </div>
    `;
  }, 4500);
});
