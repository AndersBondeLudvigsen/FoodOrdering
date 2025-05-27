import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('FATAL ERROR: Missing DATABASE_URL environment variable');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
  } catch (err) {
    process.exit(1);
  }
})();

export const query = (text, params) => pool.query(text, params);
export default pool;
