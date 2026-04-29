import "dotenv/config";
import { db } from "../db/client";
import { personalInfo, payments, depositAllocations, expenses, investments, revenueLosses } from "../db/schema";
import fs from "fs";
import { eq } from "drizzle-orm";

async function main() {
  const raw = fs.readFileSync("full_data.json", "utf-8");
  const data = JSON.parse(raw);

  console.log("Loading members from DB...");
  const allMembers = await db.select().from(personalInfo);
  
  // Create a naive name matching map (case insensitive, trimmed)
  const nameMap = new Map();
  for (const m of allMembers) {
    nameMap.set(m.name.trim().toLowerCase(), m.userId);
    const firstWord = m.name.split(' ')[0].toLowerCase();
    nameMap.set(firstWord, m.userId);
    if (m.name.includes('Shaibal')) nameMap.set('m.a sharif shaibal', m.userId);
    if (m.name.includes('Himel')) nameMap.set('muhaiminul mohsin himel', m.userId);
    if (m.name.includes('Nayeem')) nameMap.set('mehedi hasan nayeem', m.userId);
    if (m.name.includes('Limon')) nameMap.set('lokman limon', m.userId);
    if (m.name.includes('Rabbi')) nameMap.set('nazmul hasan rabbi', m.userId);
    if (m.name.includes('Chowdhury')) nameMap.set('shahanul ahmed chy.', m.userId);
    if (m.name.includes('Nahid')) nameMap.set('md. nahid hasan', m.userId);
    if (m.name === 'Arman Mahmud') nameMap.set('arman', m.userId);
    if (m.name === 'Md. Arman Hossain') nameMap.set('arman (josh)', m.userId);
  }

  console.log("Clearing old records to prevent duplicates...");
  await db.delete(revenueLosses);
  await db.delete(investments);
  await db.delete(expenses);
  await db.delete(depositAllocations);
  await db.delete(payments);

  // 1. Deposits
  console.log(`Importing ${data.deposits.length} deposits...`);
  const paymentsToInsert = [];
  const allocationsToInsert = [];
  
  for (const d of data.deposits) {
    const rawName = d['Member Name'].trim().toLowerCase();
    let memberId = nameMap.get(rawName);

    if (!memberId) {
      console.warn(`Creating missing legacy profile for "${d['Member Name']}"...`);
      memberId = `kp_legacy_${Math.random().toString(36).substr(2, 9)}`;
      try {
        await db.insert(personalInfo).values({
          userId: memberId,
          name: d['Member Name'],
          nameBn: '',
          father: '',
          dob: '2000-01-01',
          profession: '',
          religion: '',
          presentAddress: '',
          permanentAddress: '',
          mobile: '00000000000',
          nidNumber: '0000000000',
          nidFront: '',
          nidBack: '',
          signature: '',
          position: 'member'
        });
      } catch (err: any) {
        console.error(`Failed to create legacy profile for "${d['Member Name']}":`, err.message);
      }
      nameMap.set(rawName, memberId);
    }

    paymentsToInsert.push({
      paymentId: d['Payment ID'],
      memberId: memberId,
      amountReceived: d['Amount Received'].toString(),
      paymentDate: d['Date'],
      note: d['Note'],
      voided: false,
      syncStatus: 'synced',
      createdBy: 'system'
    });

    allocationsToInsert.push({
      allocId: `alloc_${Math.random().toString(36).substr(2, 9)}`,
      paymentId: d['Payment ID'],
      memberId: memberId,
      forMonth: d['Month Allocated'],
      amountAllocated: d['Amount Received'].toString()
    });
  }

  if (paymentsToInsert.length > 0) {
    await db.insert(payments).values(paymentsToInsert);
  }
  if (allocationsToInsert.length > 0) {
    await db.insert(depositAllocations).values(allocationsToInsert);
  }

  // 2. Expenses
  console.log(`Importing ${data.expenses.length} expenses...`);
  const expensesToInsert = [];
  for (const e of data.expenses) {
    let dateStr = e['Date'];
    if (dateStr === '206-03-047') dateStr = '2026-03-04'; 
    expensesToInsert.push({
      entryId: e['Expense ID'],
      expenseDate: dateStr,
      category: e['Category'],
      description: e['Description'],
      amount: e['Amount'].toString(),
      voided: false,
      syncStatus: 'synced',
      recordedBy: 'system'
    });
  }
  if (expensesToInsert.length > 0) {
    await db.insert(expenses).values(expensesToInsert);
  }

  // 3. Investments
  console.log(`Importing ${data.investments.length} investments...`);
  const investmentsToInsert = [];
  for (const inv of data.investments) {
    investmentsToInsert.push({
      entryId: inv['Investment ID'],
      investDate: inv['Date'],
      recipient: inv['Recipient'],
      principal: inv['Principal'].toString(),
      expectedReturnDate: inv['Expected Return'],
      status: 'active',
      syncStatus: 'synced',
      recordedBy: 'system'
    });
  }
  if (investmentsToInsert.length > 0) {
    await db.insert(investments).values(investmentsToInsert);
  }

  // 4. Revenue
  console.log(`Importing ${data.revenue.length} revenue records...`);
  const revenueToInsert = [];
  for (const r of data.revenue) {
    revenueToInsert.push({
      entryId: r['Entry ID'],
      eventDate: r['Date'],
      sourceType: r['Type (Income/Loss)'] as any,
      description: r['Description'],
      amount: r['Amount'].toString(),
      voided: false,
      syncStatus: 'synced',
      recordedBy: 'system'
    });
  }
  if (revenueToInsert.length > 0) {
    await db.insert(revenueLosses).values(revenueToInsert);
  }

  console.log("✅ Import completed successfully!");
}

main().catch(console.error);
