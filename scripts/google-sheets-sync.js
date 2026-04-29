/**
 * Google Apps Script — Paste this into your Google Sheet's Apps Script editor.
 * Extensions → Apps Script → Replace contents → Save → Add onEdit trigger.
 *
 * SETUP:
 * 1. Replace WEBHOOK_URL with your Vercel production URL.
 * 2. In Apps Script: Project Settings → Script Properties
 *    → Add property: WEBHOOK_SECRET = <your WEBHOOK_SECRET value from .env.local>
 * 3. Go to Triggers (clock icon) → Add Trigger:
 *    - Function: onEdit
 *    - Event source: From spreadsheet
 *    - Event type: On edit
 */

var WEBHOOK_URL = "https://YOUR_APP.vercel.app/api/sheets-webhook";

// Column headers for each monitored sheet (must match exactly what's in the sheet)
var SHEET_HEADERS = {
  "Payments": ["Payment ID", "Member ID", "Amount", "Date", "Note", "Voided"],
  "Expenses": ["Entry ID", "Date", "Category", "Description", "Amount", "Linked Inv", "Voided"],
  "Investments": ["Entry ID", "Date", "Recipient", "Principal", "Exp Return", "Act Return", "Status", "Note"],
  "Revenue_Losses": ["Entry ID", "Date", "Source Type", "Description", "Amount", "Linked Inv", "Voided"],
};

function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  var sheetName = sheet.getName();

  // Only sync rows in monitored sheets
  if (!SHEET_HEADERS[sheetName]) return;

  var row = e.range.getRow();
  if (row <= 1) return; // Skip header row

  var headers = SHEET_HEADERS[sheetName];
  var numCols = headers.length;

  // Read the full row data
  var rowValues = sheet.getRange(row, 1, 1, numCols).getValues()[0];

  // Map to an object using the defined headers
  var payload = {};
  headers.forEach(function(header, i) {
    payload[header] = rowValues[i] !== undefined ? String(rowValues[i]) : "";
  });

  // Skip rows with no primary ID (empty first cell = blank/template row)
  if (!payload[headers[0]]) return;

  // Get secret from Script Properties (safer than hardcoding)
  var secret = PropertiesService.getScriptProperties().getProperty("WEBHOOK_SECRET");

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-webhook-secret": secret,
    },
    payload: JSON.stringify({
      sheet: sheetName,
      row: row,
      data: payload,
    }),
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    var code = response.getResponseCode();
    var body = response.getContentText();

    if (code === 200) {
      Logger.log("✅ Synced row " + row + " in " + sheetName);
    } else if (code === 422) {
      // Validation error — show a toast in the sheet UI so the manager knows
      var parsed = JSON.parse(body);
      SpreadsheetApp.getActiveSpreadsheet().toast(
        "⚠️ Row " + row + " not synced: " + (parsed.details || "Validation error"),
        "Sync Warning",
        10
      );
      Logger.log("❌ Validation error on row " + row + ": " + body);
    } else {
      Logger.log("❌ Webhook error " + code + " on row " + row + ": " + body);
    }
  } catch (err) {
    Logger.log("❌ Network error: " + err.message);
  }
}
