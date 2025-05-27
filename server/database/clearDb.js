import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

async function clearAll() {
  try {
    await pool.query(`
      TRUNCATE TABLE
        order_items,
        orders,
        menu_item_ingredients,
        menu_items,
        ingredients,
        users
      RESTART IDENTITY
      CASCADE;
    `);
  } catch (err) {
  } finally {
    await pool.end();
  }
}

clearAll();
