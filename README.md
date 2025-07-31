# Git Secrets Playground - Git情報漏洩シミュレーター

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/git-secrets-playground?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/git-secrets-playground?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/git-secrets-playground)
![GitHub license](https://img.shields.io/github/license/ipusiron/git-secrets-playground)

**Day031 - 生成AIで作るセキュリティツール100**

「`.git`ディレクトリーが外部に公開されたとき、何が漏れるのか？」

**Git Secrets Playground** はその疑似体験を通じて、Gitリポジトリの構造とセキュリティリスクを学ぶ教育用シミュレーターです。

---

## 🧪 主な機能

| モード | 機能概要 |
|--------|-----------|
| 🗂️ **構造ビューアー** | `.git/`配下のファイル・ディレクトリーと漏洩リスクを可視化<br>📁 展開/折りたたみ機能、📋 ハッシュ値コピー、📊 統計情報表示 |
| 🔍 **オブジェクト復元** | SHA-1ハッシュからGitオブジェクト（blob/tree/commit）を復元体験<br>📄 サンプルボタン、🔧 手動入力、💡 教育情報表示 |
| 🚨 **リーク検査** | `.git`ディレクトリー公開時の攻撃手順をシミュレーション<br>⚡ 速度調整（1x/2x/4x）、⏸️ 一時停止/再開、⏭️ スキップ機能 |
| ⚖️ **構造比較** | 異なる環境での`.git`構造を並べて比較・分析<br>📋 プリセット比較、📊 リスク分析表、💡 推奨事項表示 |
| 🚩 **CTFヒント** | CTF競技でのGit漏洩問題解法テクニック集<br>🔍 調査手順、🛠️ ツール紹介、🎯 出題パターン解説 |

### 🆕 追加機能

- **❓ ヘルプシステム**: 全機能の詳細説明とFAQを含む包括的ヘルプモーダル
- **📊 プログレスバー**: リーク検査の進行状況をリアルタイム表示（アニメーション付き）
- **🎮 インタラクティブUI**: ツールチップ、トースト通知、アコーディオン表示
- **📱 レスポンシブ対応**: モバイル・タブレットでも最適表示

---

## 🖥️ デモページ

👉 [https://ipusiron.github.io/git-secrets-playground/](https://ipusiron.github.io/git-secrets-playground/)

---

## 📸 スクリーンショット

>![ダミー](assets/screenshot.png)
>
>*ダミー*

---

## 📁 フォルダー構成

```
git-secrets-playground/
├── index.html
├── style.css
├── script.js
├── data/
│ └── sample_git_structure.json
├── assets/
│ └── (アイコンや図解画像など)
└── README.md
```

---

## 📋 詳細機能説明

### 🗂️ 構造ビューアー
- **ツリー表示**: `.git`ディレクトリーの階層構造を視覚的に表示
- **リスクレベル表示**: 各ファイルのセキュリティリスク（HIGH/MEDIUM/LOW）を色分け
- **展開/折りたたみ**: フォルダーをクリックして内容の表示・非表示切り替え
- **ハッシュ値コピー**: ハッシュファイルをクリックしてクリップボードにコピー
- **ツールチップ**: ファイル名にホバーして詳細情報を表示
- **統計情報**: リスクレベル別の要素数とファイル・フォルダー数を集計表示

### 🔍 オブジェクト復元（シミュレーション）
- **サンプルボタン**: 4種類のハッシュ値（空ファイル、テキスト、機密設定、Docker）を一発入力
- **手動入力**: 40文字のSHA-1ハッシュを直接入力して復元
- **復元結果表示**: オブジェクトタイプ、サイズ、内容を詳細表示
- **教育情報**: zlibによる圧縮やGitオブジェクトの仕組みを解説

### 🚨 リーク検査（シミュレーション）
- **URL入力**: 検査対象URLの設定（プリセットボタンも利用可能）
- **検査オプション**: `.git/HEAD`、`config`、`logs/HEAD`、`refs/`、`objects/`を選択可能
- **速度調整**: 1x（標準）、2x（高速）、4x（超高速）から選択
- **制御機能**: 
  - ⏸️ **一時停止/再開**: スキャン途中での停止・再開
  - ⏭️ **スキップ**: 結果をすぐに表示
  - 📊 **プログレスバー**: 進行状況をリアルタイム表示
- **結果表示**: 発見された脆弱性の詳細分析とリスクサマリー

### ⚖️ 構造比較
- **プリセット比較**: 
  - 🛡️ セキュアな設定 vs ⚠️ 危険な設定
  - 🔒 プライベートリポジトリ vs パブリックリポジトリ  
  - 🔧 開発環境 vs 本番環境
- **並列表示**: 2つの構造を左右に並べて視覚的に比較
- **比較分析表**: リスクレベル別の要素数を数値で比較
- **推奨事項**: セキュリティ向上のための具体的なアドバイス

### 🚩 CTFヒント
- **基本調査手順**: `.git`ディレクトリー発見から情報収集までの手順
- **便利ツール**: GitHacker、git-dumper、Wayback Machineの使い方
- **出題パターン**: 
  - 🔑 削除されたフラグファイル
  - 🌿 別ブランチのフラグ
  - 📝 コミットメッセージのヒント
  - 🗂️ 設定ファイルの機密情報
- **実践テクニック**: コマンドライン操作のコツとベストプラクティス

### ❓ ヘルプシステム
- **包括的ドキュメント**: 全機能の詳細説明とFAQ
- **スクロール対応**: 長いコンテンツに対応した縦スクロール機能
- **複数の閉じ方**: ✕ボタン、ESCキー、オーバーレイクリック
- **レスポンシブ対応**: デスクトップ・モバイル両方に最適化

## 📚 学べること

- `.git/`ディレクトリーの内部構造と各ファイルの役割
- Gitオブジェクト（blob / tree / commit）の仕組みと復元方法
- 公開サーバーに`.git`が残っていた場合の具体的な被害シナリオ
- CTF競技で頻出するGit漏洩問題の典型的な解法パターン
- セキュリティ対策の実装方法（予防・検出・事後対応）

---

## 🛠️ 技術仕様

### 📋 実装技術
- **フロントエンド**: HTML5 + CSS3 + Vanilla JavaScript（ES6+）
- **アーキテクチャ**: 完全クライアントサイド実行（サーバー不要）
- **データ形式**: JSON（`.git`構造データ）
- **UI/UX**: レスポンシブデザイン、モーダル、プログレスバー
- **アニメーション**: CSS Transitions & Keyframes

### 🎨 UI/UX機能
- **タブベースナビゲーション**: 5つのメイン機能をタブで切り替え
- **インタラクティブ要素**: 
  - ツールチップ（ホバー情報表示）
  - トースト通知（操作フィードバック）
  - アコーディオン（展開/折りたたみ）
  - プログレスバー（アニメーション付き）
- **レスポンシブ対応**: デスクトップ・タブレット・モバイル最適化
- **アクセシビリティ**: キーボード操作対応（ESCキーなど）

### 🔧 主要機能実装
- **ツリー表示**: 再帰的DOM生成による階層構造表示
- **リスク分析**: 各ファイルに対するセキュリティリスク評価
- **速度制御**: 非同期処理での動的遅延調整（1x/2x/4x）
- **状態管理**: スキャン状態の管理（idle/running/paused/skipped）
- **データ処理**: JSON解析による動的コンテンツ生成

### 📱 対応環境
- **ブラウザ**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **デバイス**: デスクトップ、タブレット、スマートフォン
- **解像度**: 320px〜4K対応
- **JavaScript**: ES6+対応ブラウザ

---

## 🔒 Gitセキュリティベストプラクティス

### 🛡️ 予防対策

**1. .gitディレクトリーの公開防止**
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

**2. 機密情報のコミット防止**
```bash
# .gitignoreに機密ファイルを追加
echo "*.env" >> .gitignore
echo "config/secrets.yml" >> .gitignore
echo "*.key" >> .gitignore
echo ".env.*" >> .gitignore

# git-secretsツールを使用
git secrets --install
git secrets --register-aws
```

**3. pre-commitフックの活用**
```bash
# 機密情報検出用フック設定
pip install pre-commit
echo "repos:" > .pre-commit-config.yaml
echo "  - repo: https://github.com/Yelp/detect-secrets" >> .pre-commit-config.yaml
echo "    hooks:" >> .pre-commit-config.yaml
echo "      - id: detect-secrets" >> .pre-commit-config.yaml
```

### 🚨 事後対応

**1. すでにコミットしてしまった機密情報の削除**
```bash
# git filter-branchで履歴から完全削除
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch secret-file.txt' \
--prune-empty --tag-name-filter cat -- --all

# または、BFG Repo-Cleanerを使用
java -jar bfg.jar --delete-files secret-file.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

**2. リモートリポジトリの強制更新**
```bash
# 全ブランチを強制プッシュ
git push origin --force --all
git push origin --force --tags
```

### 📋 定期チェック項目

- [ ] Webサーバーで`.git`ディレクトリーへのアクセスが拒否されている
- [ ] .gitignoreが適切に設定されている
- [ ] 機密情報検出ツールが導入されている
- [ ] 開発者への`.git`漏洩リスク教育が実施されている
- [ ] 本番環境に`.git`ディレクトリーが存在しない

### 🔍 `.git/logs/HEAD`ファイルについて

`.git/logs/HEAD`はGit内部でコミット履歴の移動（HEADの変遷）を記録するログファイルです。

以下の内容を含みます：
- HEADの移動履歴（checkout・commit・rebase・resetなど）
- 各移動時の前のコミットハッシュ → 新しいコミットハッシュ
- 実行者の名前・メールアドレス・日時・アクション内容

公開されていれば、過去の変更履歴や削除されたフラグを完全復元される可能性があります。

| 状況                  | 影響度                       |
| ------------------- | ------------------------- |
| `.git/HEAD` 公開      | 中リスク（構成が漏れる）              |
| `.git/logs/HEAD` 公開 | **高リスク**（過去の秘密情報まで復元されうる） |

### 🕵️ 検出方法（Google Dork例）

```
site:example.com inurl:.git
site:example.com filetype:git
intitle:"Index of" .git
inurl:.git/HEAD
inurl:.git/config
"[core]" "repositoryformatversion" site:example.com
```

**注意**: これらのDorkは教育目的でのみ使用し、無断でのスキャンは絶対に行わないでください。

---

## 関連リソース（私が関与しているもの）

### 自作ツール

- [Dork Watcher](https://ipusiron.github.io/dork-watcher/)
    - `site:example.com inurl:.git`というDorkに対応。

### Walkthrough

- [GitRoot:1 攻略 Walkthrough【VulnHub編】](https://akademeia.info/?p=27143)

---

## 🚀 使用方法

### 📦 セットアップ

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/ipusiron/git-secrets-playground.git
   cd git-secrets-playground
   ```

2. **ローカルサーバーの起動**
   ```bash
   # Python 3の場合
   python3 -m http.server 8000
   
   # Python 2の場合
   python -m SimpleHTTPServer 8000
   
   # Node.jsの場合
   npx http-server -p 8000
   ```

3. **ブラウザでアクセス**
   ```
   http://localhost:8000
   ```

### 🎮 基本操作

1. **❓ ヘルプボタン**: ツール名右側の❓ボタンで全機能の詳細説明を表示
2. **タブ切り替え**: 上部のタブボタンで5つの機能を切り替え
3. **📁 構造ビューアー**: フォルダーをクリックして展開/折りたたみ
4. **🚨 リーク検査**: URL入力後、速度を選択してスキャン実行
5. **⚖️ 構造比較**: プリセットボタンで異なる環境を比較

### 💡 よくある質問

**Q: CORSエラーで構造ビューアーが表示されません**  
A: ローカルサーバーを起動してください。ファイルを直接開くとCORSエラーが発生します。

**Q: リーク検査で実際にWebサイトにアクセスしますか？**  
A: いいえ。完全にシミュレーションです。実際の外部アクセスは一切行いません。

**Q: スマートフォンでも使用できますか？**  
A: はい。レスポンシブデザインによりモバイルデバイスでも最適表示されます。

**Q: ヘルプボタンが反応しません**  
A: ブラウザのコンソール（F12）を確認してJavaScriptエラーがないかチェックしてください。

---

## ⚠️ 免責事項

本ツールは**教育目的**で提供されています。  
実際のWebサイトに対して`.git`ディレクトリーへのアクセスを試みるなど、**無断での検査・利用は絶対におやめください**。

---

## 📄 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)をご覧ください。

---

## 🛠 このツールについて

本ツールは、「生成AIで作るセキュリティツール100」プロジェクトの一環として開発されました。
このプロジェクトでは、AIの支援を活用しながら、セキュリティに関連するさまざまなツールを100日間にわたり制作・公開していく取り組みを行っています。

プロジェクトの詳細や他のツールについては、以下のページをご覧ください。

🔗 [https://akademeia.info/?page_id=42163](https://akademeia.info/?page_id=42163)
