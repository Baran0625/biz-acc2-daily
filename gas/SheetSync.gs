/**
 * ビジネス会計検定2級 記録の保存先（Googleスプレッドシート）Web API
 * -------------------------------------------------------------
 * doPost : 1日分の結果を upsert（同じ日付があれば上書き、なければ追加＝1日1行）
 * doGet  : 全記録を JSONP（?callback=xxx）または JSON で返す
 *
 * 【セットアップ】
 * 1. 新しいGoogleスプレッドシートを作成（FP3級とは別のシートにする）
 *    URL: https://docs.google.com/spreadsheets/d/【この部分がID】/edit
 *    → その【ID】を下の SHEET_ID に貼る
 * 2. このファイルを gas/Code.gs と同じGASプロジェクトに追加してOK
 * 3. デプロイ → 新しいデプロイ → 種類「ウェブアプリ」
 *      次のユーザーとして実行: 自分
 *      アクセスできるユーザー: 全員
 * 4. 発行された /exec のURLを、アプリの sync.js の SYNC_URL に貼る
 */

const SHEET_ID = 'ここにスプレッドシートのID';
const SHEET_NAME = 'records';

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['dateKey', 'ts', 'score', 'total', 'pct', 'bySection', 'rows']);
  }
  return sh;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sh = getSheet_();
    const values = sh.getDataRange().getValues(); // 1行目はヘッダー
    const row = [
      data.dateKey, data.ts, data.score, data.total, data.pct,
      JSON.stringify(data.bySection || {}), JSON.stringify(data.rows || [])
    ];
    let foundRow = -1;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]) === String(data.dateKey)) { foundRow = i + 1; break; }
    }
    if (foundRow > 0) sh.getRange(foundRow, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  const sh = getSheet_();
  const values = sh.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (!r[0]) continue;
    out.push({
      dateKey: String(r[0]),
      ts: Number(r[1]) || 0,
      score: Number(r[2]) || 0,
      total: Number(r[3]) || 0,
      pct: Number(r[4]) || 0,
      bySection: safeParse_(r[5], {}),
      rows: safeParse_(r[6], [])
    });
  }
  const body = JSON.stringify(out);
  const cb = e && e.parameter && e.parameter.callback;
  if (cb) {
    return ContentService.createTextOutput(cb + '(' + body + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function safeParse_(s, dflt) { try { return JSON.parse(s); } catch (err) { return dflt; } }
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
