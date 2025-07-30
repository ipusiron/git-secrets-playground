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

// --- Gitオブジェクト復元処理（ダミー） ---
document.getElementById('recover-object').addEventListener('click', () => {
  const hash = document.getElementById('object-hash').value.trim();
  const output = document.getElementById('object-output');

  if (!hash.match(/^[0-9a-f]{40}$/)) {
    output.textContent = '⚠️ 正しいSHA-1形式のハッシュを入力してください。';
    return;
  }

  // 仮の出力（実際はZlib展開＋Git objectパースを実装）
  output.textContent =
    `復元対象のGitオブジェクト：\n${hash}\n\n（※ 後日、blob/tree/commit に応じて解釈・表示されます）`;
});

// --- リーク検査処理（シミュレーション） ---
document.getElementById('simulate-leak').addEventListener('click', () => {
  const url = document.getElementById('target-url').value.trim();
  const result = document.getElementById('leak-result');

  if (!url.startsWith('http')) {
    result.innerHTML = '⚠️ 有効なURLを入力してください（http/httpsで始まる）';
    return;
  }

  // ダミーのシミュレーション結果（アニメーションは後日）
  result.innerHTML = `
    <p>🔍 入力されたURL：<code>${url}</code></p>
    <ul>
      <li>✔️ .git/HEAD にアクセス可能と仮定</li>
      <li>➡️ HEAD → refs/heads/main にリダイレクト</li>
      <li>📄 対応する commit オブジェクトを objects/ にて探索</li>
      <li>💥 結果：<strong>リポジトリ構成の再構築が可能な状態！</strong></li>
    </ul>
    <p style="color:red;">※ この動作はすべてシミュレーションであり、実際のアクセスは行われていません。</p>
  `;
});
