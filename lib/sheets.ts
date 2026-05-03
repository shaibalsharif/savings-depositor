import { google } from "googleapis";

export type SheetName = "Payments" | "Expenses" | "Investments" | "Revenue_Losses" | "Config" | "Members";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getAuth() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error("Missing Google Sheets credentials in environment variables");
  }

  const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });

  return auth;
}

function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

const getSpreadsheetId = () => process.env.GOOGLE_SHEET_ID;

export async function appendRow(sheetName: SheetName, rowData: any[]): Promise<number> {
  const spreadsheetId = getSpreadsheetId();
  if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID is missing");
  const sheets = getSheets();

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:A`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [rowData],
    },
  });

  const updatedRange = response.data.updates?.updatedRange;
  if (!updatedRange) throw new Error("Failed to get updated range from Sheets API");
  
  const match = updatedRange.match(/!?[a-zA-Z]+(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  
  throw new Error("Failed to parse row index from Sheets API response");
}

export async function updateRow(sheetName: SheetName, rowIndex: number, rowData: any[]): Promise<void> {
  const spreadsheetId = getSpreadsheetId();
  if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID is missing");
  const sheets = getSheets();

  const maxCol = String.fromCharCode(65 + rowData.length - 1);
  const range = `${sheetName}!A${rowIndex}:${maxCol}${rowIndex}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [rowData],
    },
  });
}

export async function markVoided(sheetName: SheetName, rowIndex: number): Promise<void> {
  const spreadsheetId = getSpreadsheetId();
  if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID is missing");
  const sheets = getSheets();

  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  });

  const headers = headerResponse.data.values?.[0] || [];
  const voidedColIndex = headers.findIndex((h) => h.toLowerCase() === 'voided');

  if (voidedColIndex === -1) {
    throw new Error(`'Voided' column not found in sheet ${sheetName}`);
  }

  const colLetter = String.fromCharCode(65 + voidedColIndex);
  const range = `${sheetName}!${colLetter}${rowIndex}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["TRUE"]],
    },
  });
}

export async function readSheet(sheetName: SheetName): Promise<Record<string, string>[]> {
  const spreadsheetId = getSpreadsheetId();
  if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID is missing");
  const sheets = getSheets();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) return [];

  const headers = rows[0];
  const data = rows.slice(1);

  return data.map((row: any[]) => {
    const obj: Record<string, string> = {};
    headers.forEach((header: string, index: number) => {
      obj[header] = row[index] || "";
    });
    return obj;
  });
}

export async function clearRowRange(sheetName: SheetName, rowIndex: number, numCols: number = 8): Promise<void> {
  const spreadsheetId = getSpreadsheetId();
  if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID is missing");
  const sheets = getSheets();

  const maxCol = String.fromCharCode(65 + numCols - 1);
  const range = `${sheetName}!A${rowIndex}:${maxCol}${rowIndex}`;

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range,
  });
}
