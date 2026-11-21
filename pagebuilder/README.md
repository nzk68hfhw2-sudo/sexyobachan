# 個人ページ(個人ページビルダー)

Gravity のゲーム機能で公開する、プロフィール・ブログ・日記の個人ページを作って見せ合う Web アプリです。

- 公開されるファイル: `public/`(`index.html` `game.js` `source.txt` `_headers`)
- サーバー: `netlify/functions/api.mjs` と `lib/app.mjs`(保存先は Netlify Blobs)
- Gravity 用ローダー: `deliver/loader_prompt.txt`
- しくみの説明: `public/source.txt`

## テスト

```
cd pagebuilder
npm install
npm test
```

サーバーのテスト(49件)と、iPhone サイズの画面を別サイトから読み込んだ状態で操作するテスト(35件)が動きます。

## 手元でためす

```
npm run dev
```

表示された URL を開きます。管理者 `punpun2005` を登録するときの合言葉は `test-admin-code` です(手元だけ)。

## Netlify の設定

| 名前 | 中身 |
|---|---|
| `ADMIN_SETUP_CODE` | 管理者 ID を登録するときに必要な合言葉(自分で決める。必須) |
| `ADMIN_ID` | 管理者の ID。書かなければ `punpun2005` |
