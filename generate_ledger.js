const xlsx = require('xlsx');

// Helper to format Date string to something standard if possible, else keep original
function parseDate(d) {
  if (!d) return "";
  return String(d).trim();
}

function generateId(prefix, index) {
  return prefix + "-" + String(index).padStart(4, '0');
}

async function main() {
  const wb = xlsx.readFile('Project 13 Payment, Investment , Expense & Balance (1).xlsx');
  
  // 1. Process Deposits
  const appDeposits = [
    ["Payment ID", "Date", "Member Name", "Amount Received", "Month Allocated", "Note", "Sync Status"]
  ];
  let depositCounter = 1;

  // Read till Dec 25
  let ws1 = wb.Sheets["Payment till Dec25"];
  if (ws1) {
    const data1 = xlsx.utils.sheet_to_json(ws1, {header: 1});
    if (data1.length >= 2) {
      const headers = data1[1]; // ['ID', 'Name', "Jan'24", ...]
      for (let r = 2; r < data1.length; r++) {
        const row = data1[r];
        if (!row || !row[1]) continue;
        const memberName = row[1];
        
        for (let c = 2; c < headers.length; c++) {
          const month = headers[c];
          const amount = row[c];
          if (amount && !isNaN(Number(amount))) {
            appDeposits.push([
              generateId("PAY", depositCounter++),
              "2025-01-01", // Placeholder date since matrix lacks exact payment dates
              memberName,
              amount,
              month,
              "Migrated from matrix",
              "SYNCED"
            ]);
          }
        }
      }
    }
  }

  // Read from Jan 26
  let ws2 = wb.Sheets["Payment from January26"];
  if (ws2) {
    const data2 = xlsx.utils.sheet_to_json(ws2, {header: 1});
    if (data2.length >= 2) {
      const headers = data2[1]; 
      for (let r = 2; r < data2.length; r++) {
        const row = data2[r];
        if (!row || !row[1]) continue;
        const memberName = row[1];
        
        for (let c = 2; c < headers.length; c++) {
          const month = headers[c];
          const amount = row[c];
          // skip 'Total Amount Paid', 'Total Due' etc
          if (month && !month.toLowerCase().includes('total') && amount && !isNaN(Number(amount))) {
            appDeposits.push([
              generateId("PAY", depositCounter++),
              "2026-01-01", // Placeholder
              memberName,
              amount,
              month,
              "Migrated from matrix",
              "SYNCED"
            ]);
          }
        }
      }
    }
  }

  // 2. Process Investments, Expenses, Revenue
  const appInvestments = [["Investment ID", "Date", "Recipient", "Principal", "Expected Return", "Sync Status"]];
  const appExpenses = [["Expense ID", "Date", "Category", "Description", "Amount", "Sync Status"]];
  const appRevenue = [["Entry ID", "Date", "Type (Income/Loss)", "Description", "Amount", "Sync Status"]];

  let invCounter = 1;
  let expCounter = 1;
  let revCounter = 1;

  let ws3 = wb.Sheets["Investment, Exp. & Income"];
  if (ws3) {
    const data3 = xlsx.utils.sheet_to_json(ws3, {header: 1});
    for (let r = 2; r < data3.length; r++) {
      const row = data3[r] || [];
      
      // Investments: col 0, 1, 2
      if (row[0] || row[1] || row[2]) {
        appInvestments.push([
          generateId("INV", invCounter++),
          parseDate(row[0]),
          row[1] || "",
          row[2] || 0,
          "", // Expected return missing in sheet
          "SYNCED"
        ]);
      }
      
      // Expenses: col 4, 5, 6
      if (row[4] || row[5] || row[6]) {
        appExpenses.push([
          generateId("EXP", expCounter++),
          parseDate(row[4]),
          "Other", // Category missing
          row[5] || "",
          row[6] || 0,
          "SYNCED"
        ]);
      }

      // Income: col 8, 9, 10
      if (row[8] || row[9] || row[10]) {
        appRevenue.push([
          generateId("REV", revCounter++),
          parseDate(row[8]),
          "Income",
          row[9] || "",
          row[10] || 0,
          "SYNCED"
        ]);
      }
    }
  }

  // README Sheet
  const readme = [
    ["Instructions for the new Ledger format"],
    [""],
    ["1. Enter all new data into the 'App_...' sheets as flat lists."],
    ["2. Do not use merged cells or matrix structures in these sheets."],
    ["3. The 'Sync Status' column will be used by the App script to track what is synced."],
    ["4. To recreate your old matrix view, create a new sheet called 'Dashboard' and use a Pivot Table:"],
    ["   - Rows: Member Name"],
    ["   - Columns: Month Allocated"],
    ["   - Values: Amount Received (SUM)"],
    ["   This will automatically generate the exact matrix you had before, completely dynamically."]
  ];

  // Create new workbook
  const newWb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(newWb, xlsx.utils.aoa_to_sheet(readme), "README_Instructions");
  xlsx.utils.book_append_sheet(newWb, xlsx.utils.aoa_to_sheet(appDeposits), "App_Deposits");
  xlsx.utils.book_append_sheet(newWb, xlsx.utils.aoa_to_sheet(appExpenses), "App_Expenses");
  xlsx.utils.book_append_sheet(newWb, xlsx.utils.aoa_to_sheet(appInvestments), "App_Investments");
  xlsx.utils.book_append_sheet(newWb, xlsx.utils.aoa_to_sheet(appRevenue), "App_Revenue");

  xlsx.writeFile(newWb, "Project_13_Organized_Ledger.xlsx");
  console.log("Successfully created Project_13_Organized_Ledger.xlsx");
}

main().catch(console.error);
