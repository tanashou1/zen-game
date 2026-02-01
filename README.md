# zen-game
ブラウザゲームです。typescript, reactで作ります
github pagesでこうかいします。

ドッジボールのゲームです。
ボールが飛んでくるので、タップでボールを止めます。
ボールを止めたあとにスワイプで、相手にボールを投げられます。
フィールドは上下に分かれていて、上が相手コート、下が自分のコートです。

## 開発方法 (Development)

### セットアップ (Setup)
```bash
npm install
```

### 開発サーバー起動 (Start Dev Server)
```bash
npm run dev
```

### ビルド (Build)
```bash
npm run build
```

### プレビュー (Preview)
```bash
npm run preview
```

## デプロイ (Deployment)

mainブランチにマージすると、GitHub Actionsが自動的にGitHub Pagesにデプロイします。
