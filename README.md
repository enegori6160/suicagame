# Office Orbit Merge

会社テーマのオリジナル落下合体パズルです。ルール構造は「同種接触で合体・1段階昇進」を採用しつつ、UI/アート/演出は独自デザインで実装しています。

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## 画面構成

- `/` : タイトル・操作説明・開始導線
- `/play` : ゲーム画面（Pixi Canvas + Matter.js）
- `/credits` : 使用ライブラリ表記
- `/api/health` : `{ ok: true }` を返す Route Handler

## 操作方法

### PC
- マウス移動: 落下前ピースの左右位置調整
- クリック: 落下
- スペース: 落下

### スマホ
- 左右ドラッグ: 落下前ピースの左右位置調整
- タップ: 落下

## 高DPI対応方針

- Pixi `Application.init` の `resolution` を `devicePixelRatio` に設定
- `autoDensity: true` でCSSピクセルと実ピクセルの密度差を吸収
- Pixi `Text` の `resolution` にも `devicePixelRatio` を設定
- Canvasの表示サイズ（CSS）と内部解像度（renderer）を明示してRetinaのぼけを低減

## 実装ポイント

- `src/game/config.ts` に進化ツリー・半径・物理係数・スプライト・スコアを集約
- Matter Bodies と Pixi Sprites を分離し、フレームごとに同期
- Matter `collisionStart / collisionActive / collisionEnd` を購読
- 同一ペアの多重合体を `mergeLocks`（ペアID + 時間窓）でデバウンス
- 危険ライン越えが一定時間継続でゲームオーバー

## オリジナル方針

- 会社テーマのバッジ/文具モチーフで構成
- 既存作品の画像・フォント・UI配置を模倣しない
- 画像は `public/assets/*.svg` のプレースホルダ。差し替えやすい構成

## 今後の改善案

- 役職ごとの専用SE（紙/スタンプ/承認音）
- コンボ演出、パーティクル、画面シェイク
- 難易度プリセット（重力・出現テーブル）
- スコアランキングAPI（オンライン）
- チュートリアルとアクセシビリティ改善（色覚対応）
