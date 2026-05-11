import { readSheet } from "../lib/sheets";

async function checkHeaders() {
  try {
    const rows = await readSheet("Payments");
    if (rows.length > 0) {
      console.log("Headers found:", Object.keys(rows[0]));
    } else {
      console.log("Sheet is empty.");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

checkHeaders().then(() => process.exit(0));
