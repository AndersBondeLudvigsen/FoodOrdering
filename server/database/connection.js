import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('FATAL ERROR: Missing DATABASE_URL environment variable');
  process.exit(1);
}

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

// Test the connection immediately
(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Postgres connected at', res.rows[0].now);
  } catch (err) {
    console.error('❌ Postgres connection error:', err);
    process.exit(1);
  }
})();

// Export query helper and the pool
export const query = (text, params) => pool.query(text, params);
export default pool;
