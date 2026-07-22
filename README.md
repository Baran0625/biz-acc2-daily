# ビジネス会計検定2級 デイリー演習

毎朝LINEへ「今日の問題」リンクが届き、全9章からランダム40問（4択／5択）を解いて、
答え合わせ・正答率・章別成績・履歴を確認できる自分用の学習ツール。FP3級デイリー演習と同じ構成。

- 問題は毎日ランダム出題（同じ日は同じ／日が変わると入れ替わる、日付シード方式）
- 40問は全問プールから抽選（章の問題数に応じて自然に重み付け）
- 記録はブラウザに保存（`localStorage`）。任意でスプレッドシート同期も可
- 全部無料：GitHub Pages（公開）＋ LINE Messaging API（配信）＋ GAS（毎朝の起動）

## 出題形式（2級公式問題集に準拠）

すべて択一。`questions.js` のスキーマ冒頭コメント参照。

- 4択　(a) 正誤組合せ：2文（①②）の正誤を「正正／正誤／誤正／誤誤」から選ぶ
- 4択　(b) 空欄組合せ：空欄（①）（②）に入る語句の組合せを選ぶ
- 5択　(c) 個数：5文（①〜⑤）のうち正しいものの個数を選ぶ
- 5択　(d) 数値：計算結果として正しい数値を選ぶ

## 構成

```
biz-acc2-daily/
├── index.html      アプリ本体（UIとロジック）。基本さわらない
├── questions.js    問題バンク。← ここを育てる（目標245問）
├── sync.js         スプレッドシート同期（任意。SYNC_URLを入れると有効）
├── gas/Code.gs     毎朝LINE配信するGASスクリプト
├── gas/SheetSync.gs 記録の保存先WebAPI（任意）
├── .github/workflows/daily-line.yml  （任意）GASの代わりにGitHubで配信する場合
└── README.md
```

## セットアップ

### 1. アプリを公開（GitHub Pages）
FP3級とは別リポジトリ（例: `biz-acc2-daily`）として push し、
Settings › Pages › Deploy from a branch → `main` / `/ (root)`。
数分後 `https://<ユーザー名>.github.io/biz-acc2-daily/` で開ける。
ローカル確認は VS Code の Live Server 推奨（直接ダブルクリックだと questions.js 読込に失敗することあり）。

### 2. LINEの準備
LINE Developers で Messaging APIチャネルを作成し、チャネルアクセストークン（長期）と
Your user ID（U始まり）を控える。作成した公式アカウントを自分のLINEで友だち追加。
（FP3級と同じチャネルを使い回してもOK。分けたい場合のみ新規作成）

> LINE Notify は2025年3月末で終了済みのため、Messaging API を使います。
> 無料枠は月200通。自分1人あてに1日1通なら十分収まります。

### 3. 毎朝の配信をセット（GAS）
1. [script.google.com](https://script.google.com/) で新規プロジェクト
2. `gas/Code.gs` を貼り、`LINE_TOKEN` / `USER_ID` / `QUIZ_URL`（2級アプリのURL）を記入
3. プロジェクト設定でタイムゾーンを Asia/Tokyo に
4. `pushDailyQuiz` を手動実行 → LINEに届けばOK
5. `createDailyTrigger` を1回実行 → 毎朝8時台に自動配信

GitHubだけで完結させたい場合は `.github/workflows/daily-line.yml`（cron）でも可（GASと排他、どちらか一方）。

### 4. 記録をスプレッドシートに同期（任意）
`gas/SheetSync.gs` をウェブアプリとしてデプロイ（実行:自分／アクセス:全員）し、
発行された `/exec` のURLを `sync.js` の `SYNC_URL` に貼る。
※ FP3級とは別のスプレッドシートにすること（記録が混ざらない）。

## 問題を増やす

`questions.js` の `window.QUESTIONS` を目標245問（章別：制度10・財表25・BS20・PL35・
包括利益15・純資産変動20・CF40・注記25・分析55）まで育てる。app側（index.html）は触らない。

### Claude Code に任せる場合のプロンプト例

```
questions.js を編集して、ビジネス会計検定2級の問題を目標数まで増やしてください。

制約:
- 既存スキーマ（id / section / q / options / answer / exp）に厳密に従う
- 全問を択一にする。4択（正誤組合せ／空欄組合せ）と5択（個数／数値）を混在させ、公式問題集の形式に合わせる
- options は4つ または 5つ。answer は0始まりの添字
- 正誤組合せは options を ["①正 ②正","①正 ②誤","①誤 ②正","①誤 ②誤"] とし、q に①②の2文を \n で入れる
- 個数問題は q に①〜⑤の5文を \n で入れ、options を ["1つ".."5つ"]（0の可能性があれば "0" を含める）にする
- 数値問題は資料を q に、選択肢に数値を5つ置く。計算が一意に定まるようにする
- 章別の目標数：制度10 / 財表25 / BS20 / PL35 / 包括利益15 / 純資産変動20 / CF40 / 注記25 / 分析55
- 数値・定義は公式基準で正しいものだけ。あいまいな論点は入れない。既存問題と重複させない
- app側（index.html）は変更しない

編集後、章別の件数と、4択/5択の内訳を数えて報告してください。
```

## 注意
数値（各種比率の定義・会計基準）は改訂され得ます。試験直前は最新年度の公式教材で確認してください。
