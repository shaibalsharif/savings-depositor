const XLSX = require('xlsx');

try {
  const wb = XLSX.readFile('Project 13 Payment, Investment , Expense & Balance (2).xlsx');
  
  wb.SheetNames.forEach(sheetName => {
    if (sheetName.includes('Payment')) {
      const sheet = wb.Sheets[sheetName];
      const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (raw.length > 0) {
        console.log(`\nSheet: ${sheetName}`);
        console.log('Headers:', Object.values(raw[0]));
        
        let count = 0;
        const members = [];
        for (let i=1; i<raw.length; i++) {
          const name = raw[i]['__EMPTY'];
          if (name && name !== 'Name' && !name.includes('Total') && !name.includes('Due')) {
            count++;
            members.push(name);
          }
        }
        console.log(`Found ${count} members:`, members.join(', '));
      }
    }
  });
} catch (e) { console.error(e); }
