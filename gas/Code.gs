/**
 * ビジネス会計検定2級 デイリー演習 — 毎朝08:00にLINEへ「今日の問題」リンクを配信
 * LINE Messaging API（プッシュメッセージ）を使用。
 *
 * 【事前準備】
 * 1. LINE Developers でプロバイダー＋Messaging APIチャネルを作成
 *    （FP3級と別配信にするなら別チャネル。同じチャネルを使い回してもよい）
 * 2. 「Messaging API設定」→ チャネルアクセストークン（長期）を発行 → LINE_TOKEN へ
 * 3. 「チャネル基本設定」→ Your user ID を USER_ID へ（自分あてに送るため）
 * 4. 作ったLINE公式アカウントを、自分のLINEで友だち追加しておく
 * 5. QUIZ_URL に GitHub Pages で公開した「2級アプリ」のURLを入れる
 * 6. プロジェクトの設定 → タイムゾーンを Asia/Tokyo にする
 * 7. pushDailyQuiz を手動実行して届くか確認 → OKなら createDailyTrigger を1回実行
 */

const LINE_TOKEN = 'ここにチャネルアクセストークン';
const USER_ID    = 'ここにYour user ID（Uから始まる文字列）';
const QUIZ_URL   = 'https://ユーザー名.github.io/リポジトリ名/'; // 2級アプリの公開URL

function pushDailyQuiz() {
  const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'M月d日');
  const message =
    'おはようございます☀️\n' +
    today + ' のビジネス会計検定2級 40問です。\n' +
    '9章からランダム出題、朝の1回でサクッと。\n\n' +
    '▶ ' + QUIZ_URL;
  const res = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + LINE_TOKEN },
    payload: JSON.stringify({ to: USER_ID, messages: [{ type: 'text', text: message }] }),
    muteHttpExceptions: true,
  });
  Logger.log(res.getResponseCode() + ' ' + res.getContentText());
}

function createDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (tr) {
    if (tr.getHandlerFunction() === 'pushDailyQuiz') ScriptApp.deleteTrigger(tr);
  });
  ScriptApp.newTrigger('pushDailyQuiz').timeBased().everyDays(1).atHour(8).create();
  Logger.log('毎日8時台の配信トリガーを作成しました。');
}
