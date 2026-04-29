const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('Project 13 Payment, Investment , Expense & Balance (2).xlsx');
  
  console.log('--- Raw Data Sheets ---');
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\nSheet: ${sheetName}`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    console.log(data.slice(0, 3)); // show first 3 rows
  });

  const ledger = XLSX.readFile('Project_13_Organized_Ledger.xlsx');
  console.log('\n--- Organized Ledger Sheets ---');
  ledger.SheetNames.forEach(sheetName => {
    console.log(`\nSheet: ${sheetName}`);
    const sheet = ledger.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log("Headers:", data[0]); // show headers
  });

} catch (err) {
  console.error('Error reading excel files:', err);
}
