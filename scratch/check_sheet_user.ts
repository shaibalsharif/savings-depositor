import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { google } from "googleapis";

async function run() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const email = "Teletalkagami01521@gmail.com";

  console.log(`Searching for email ${email} in Google Sheets...`);
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Members!A:Z",
  });

  const rows = response.data.values;
  if (!rows) {
    console.log("No data found in sheet.");
    return;
  }

  const matches = rows.filter(row => row.some(cell => cell.toLowerCase() === email.toLowerCase()));
  console.log("Found matches in Sheets:", JSON.stringify(matches, null, 2));
}

run().catch(console.error);
