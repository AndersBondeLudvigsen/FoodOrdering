// clearDb.js
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

async function clear() {
  try {
    console.log('⏳ Truncating menu_items (and cascaded tables)…');
    // This will also truncate any tables with FKs pointing to menu_items
    await pool.query(`
      TRUNCATE TABLE menu_items
      RESTART IDENTITY
      CASCADE;
    `);
    console.log('✅ menu_items cleared.');
  } catch (err) {
    console.error('❌ Error clearing database:', err);
  } finally {
    await pool.end();
  }
}

clear();
