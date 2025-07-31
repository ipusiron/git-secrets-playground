# Git Secrets Playground - Git情報漏洩シミュレーター

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/git-secrets-playground?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/git-secrets-playground?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/git-secrets-playground)
![GitHub license](https://img.shields.io/github/license/ipusiron/git-secrets-playground)

**Day031 - 生成AIで作るセキュリティツール100**

「`.git`ディレクトリーが外部に公開されたとき、何が漏れるのか？」

**Git Secrets Playground** はその疑似体験を通じて、Gitリポジトリの構造とセキュリティリスクを学ぶ教育用シミュレーターです。

本ツールは、以下のような目的で設計されています。

- `.git`ディレクトリー構造の可視化
- Gitオブジェクト（blob / tree / commit）の内容復元体験
- `.git`公開による情報漏洩リスクのシミュレーション
- CTFなどで頻出するGit漏洩系問題への予習・復習

※すべて**クライアントサイドで完結**する安全なシミュレーションです。実際に外部へアクセスしたり、悪用したりすることはありません。

---

## 🧪 主な機能

| モード | 機能概要 |
|--------|-----------|
| 🗂️ 構造ビューアー | `.git/`配下の代表的なファイル・ディレクトリーと、その役割・漏洩リスクを可視化 |
| 🧩 オブジェクト復元 | `objects/`ディレクトリー内の Gitオブジェクト（ハッシュ）を復元して表示 |
| 🚨 リーク検査 | `.git/HEAD` などが公開されている場合のリスクを再現的にシミュレーション（※実アクセスなし） |

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

## 📚 学べること

- `.git/`ディレクトリーの内部構造
- Gitオブジェクト（blob / tree / commit）の役割と復元方法
- 公開サーバーに`.git`が残っていた場合の被害シナリオ
- CTFなどで使われる`.git`リーク問題の典型手法

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
