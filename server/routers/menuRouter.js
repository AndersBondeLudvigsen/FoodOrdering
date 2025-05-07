// src/routes/menuRouter.js
import { Router } from 'express';
import { query }  from '../database/connection.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT
        id,
        name,
        ingredients,    -- array of text
        price,
        available,
        category,
        image_url       -- thumbnail URL
      FROM menu_items
      ORDER BY id
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error loading menu:', err);
    res.status(500).json({ message: 'Server error loading menu' });
  }
});

export default router;
