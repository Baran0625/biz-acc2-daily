/**
 * ビジネス会計検定2級 記録の保存先（Googleスプレッドシート）Web API
 * -------------------------------------------------------------
 * doPost : 1日分の結果を upsert（同じ日付があれば上書き、なければ追加＝1日1行）
 * doGet  : 全記録を JSONP（?callback=xxx）または JSON で返す
 *          ?mode=stats を付けると、全記録のrowsを集計した [{id,shown}] を返す
 *          （出題ソフト優先ロジックのための出題回数統計。shown=0の問題は含まれない）
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
  const mode = e && e.parameter && e.parameter.mode;
  const body = JSON.stringify(mode === 'stats' ? collectStats_(values) : collectRecords_(values));
  const cb = e && e.parameter && e.parameter.callback;
  if (cb) {
    return ContentService.createTextOutput(cb + '(' + body + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function collectRecords_(values) {
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
  return out;
}

// 全記録のrowsを走査し、問題ID別の出題回数を集計する（ソフト優先出題の重み計算に使用）
function collectStats_(values) {
  const counts = {};
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (!r[0]) continue;
    const rows = safeParse_(r[6], []);
    rows.forEach(function (row) {
      if (!row || !row.id) return;
      counts[row.id] = (counts[row.id] || 0) + 1;
    });
  }
  return Object.keys(counts).map(function (id) { return { id: id, shown: counts[id] }; });
}

function safeParse_(s, dflt) { try { return JSON.parse(s); } catch (err) { return dflt; } }
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
