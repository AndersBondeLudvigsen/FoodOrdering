// server/routes/favorites.js
import express from 'express';
import { query }        from '../database/connection.js';

const router = express.Router();

// 1) Get all favorites for the logged‐in user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT mi.id, mi.name, mi.price, mi.image_url, mi.category
       FROM menu_items mi
       JOIN favorites f ON mi.id = f.menu_item_id
       WHERE f.user_id = $1`,
      [userId]
    );
    res.send(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// 2) Add (star) a menu item
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { menuItemId } = req.body;
    if (!menuItemId) {
      return res.status(400).json({ error: 'menuItemId is required' });
    }
    await query(
      `INSERT INTO favorites (user_id, menu_item_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, menuItemId]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// 3) Remove (unstar) a menu item
router.delete('/:menuItemId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { menuItemId } = req.params;
    await query(
      `DELETE FROM favorites
       WHERE user_id = $1 AND menu_item_id = $2`,
      [userId, menuItemId]
    );
    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

export default router;
