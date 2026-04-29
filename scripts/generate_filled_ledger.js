const XLSX = require('xlsx');
const fs = require('fs');

function parseDate(str) {
  if (!str) return '';
  const parts = str.split('.');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD.MM.YYYY to YYYY-MM-DD
  }
  return str;
}

function generateId(prefix) {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

try {
  const workbook = XLSX.readFile('Project 13 Payment, Investment , Expense & Balance (2).xlsx');
  
  // 1. Deposits
  const deposits = [];
  const addDeposits = (sheetName, yearMap) => {
    const sheet = workbook.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    if (raw.length < 2) return;
    
    // Row 0 has the actual month headers
    const headerRow = raw[0];
    
    // Keys like "__EMPTY", "__EMPTY_1"
    const keys = Object.keys(headerRow);
    
    for (let r = 1; r < raw.length; r++) {
      const row = raw[r];
      if (!row) continue;
      
      const memberName = row['__EMPTY'];
      if (!memberName || memberName === 'Name' || memberName.includes('Total') || memberName.includes('Due')) continue;
      
      for (const key of keys) {
        const monthHeader = headerRow[key];
        if (!monthHeader || String(monthHeader).includes('Due') || String(monthHeader).includes('Total') || monthHeader === 'Name' || monthHeader === 'ID') continue;
        
        const amount = row[key];
        if (amount && Number(amount) > 0) {
          const parsedMonth = yearMap(monthHeader);
          if (parsedMonth) {
            deposits.push({
              'Payment ID': generateId('pay'),
              'Date': `${parsedMonth}-05`,
              'Member Name': memberName.trim(),
              'Amount Received': Number(amount),
              'Month Allocated': parsedMonth,
              'Note': 'Imported from legacy Excel',
              'Sync Status': 'synced'
            });
          }
        }
      }
    }
  };

  const map2025 = (m) => {
    const map = { "May'25": "2025-05", "June'25": "2025-06", "July'25": "2025-07", "Aug'25": "2025-08", "Sept'25": "2025-09", "Oct'25": "2025-10", "Nov'25": "2025-11", "Dec'25": "2025-12" };
    return map[m];
  };
  const map2026 = (m) => {
    const map = { "Jan'26": "2026-01", "Feb'26": "2026-02", "Mar'26": "2026-03", "Apr'26": "2026-04", "May'26": "2026-05", "June'26": "2026-06", "July'26": "2026-07", "Aug'26": "2026-08", "Sept'26": "2026-09", "Oct'26": "2026-10", "Nov'26": "2026-11", "Dec'26": "2026-12" };
    return map[m];
  };

  addDeposits("Payment till Dec25", map2025);
  addDeposits("Payment from January26", map2026);

  // 2. Finance
  const financeSheet = workbook.Sheets['Investment, Exp. & Income'];
  const financeRaw = XLSX.utils.sheet_to_json(financeSheet, { header: 1 });
  
  const investments = [];
  const expenses = [];
  const revenue = [];

  for (let r = 1; r < financeRaw.length; r++) {
    const row = financeRaw[r];
    if (!row) continue;

    // Investment: cols 0, 1, 2
    if (row[0] && row[1] && row[2] && row[0] !== 'Date') {
      investments.push({
        'Investment ID': generateId('inv'),
        'Date': parseDate(row[0]),
        'Recipient': row[1],
        'Principal': Number(row[2]),
        'Expected Return': '2026-06-01', // placeholder
        'Sync Status': 'synced'
      });
    }

    // Expense: cols 4, 5, 6
    if (row[4] && row[5] && row[6] && row[4] !== 'Date') {
      expenses.push({
        'Expense ID': generateId('exp'),
        'Date': parseDate(row[4]),
        'Category': 'Other', // default
        'Description': row[5],
        'Amount': Number(row[6]),
        'Sync Status': 'synced'
      });
    }

    // Income: cols 8, 9, 10
    if (row[8] && row[9] && row[10] && row[8] !== 'Date') {
      revenue.push({
        'Entry ID': generateId('rev'),
        'Date': parseDate(row[8]),
        'Type (Income/Loss)': row[9].toLowerCase().includes('bank') ? 'bank_profit' : 'profit',
        'Description': row[9],
        'Amount': Number(row[10]),
        'Sync Status': 'synced'
      });
    }
  }

  // Create new workbook
  const newWb = XLSX.utils.book_new();
  
  XLSX.utils.book_append_sheet(newWb, XLSX.utils.json_to_sheet(deposits), "App_Deposits");
  XLSX.utils.book_append_sheet(newWb, XLSX.utils.json_to_sheet(expenses), "App_Expenses");
  XLSX.utils.book_append_sheet(newWb, XLSX.utils.json_to_sheet(investments), "App_Investments");
  XLSX.utils.book_append_sheet(newWb, XLSX.utils.json_to_sheet(revenue), "App_Revenue");

  XLSX.writeFile(newWb, 'Project_13_Organized_Ledger_Filled.xlsx');
  
  fs.writeFileSync('full_data.json', JSON.stringify({
    deposits: deposits,
    totalDeposits: deposits.length,
    expenses,
    investments,
    revenue
  }, null, 2));

  console.log("Successfully generated Project_13_Organized_Ledger_Filled.xlsx");
  console.log(`Deposits: ${deposits.length}, Expenses: ${expenses.length}, Investments: ${investments.length}, Revenue: ${revenue.length}`);

} catch (err) {
  console.error(err);
}
