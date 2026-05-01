const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env', override: false });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const pRes = await pool.query("SELECT payment_id, sheets_row_index FROM payments WHERE payment_id = 'pay_y8ysqqb8k';");
    console.log(pRes.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
