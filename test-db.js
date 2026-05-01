const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env', override: false });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query("SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 5;");
    console.log("Last 5 sync logs:");
    console.log(JSON.stringify(res.rows, null, 2));

    const pRes = await pool.query("SELECT payment_id, amount_received, for_month, note FROM payments ORDER BY updated_at DESC LIMIT 5;");
    console.log("\nLast 5 updated payments:");
    console.log(JSON.stringify(pRes.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
