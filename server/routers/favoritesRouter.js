// server/routes/favorites.js
import express from 'express';
import { query } from '../database/connection.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT
          mi.id,
          mi.name,
          mi.price,
          mi.image_url,
          mi.category,
          mi.available, -- ADDED THIS LINE
          COALESCE(
            json_agg(i.name) FILTER (WHERE i.id IS NOT NULL),
            '[]'
          ) AS ingredients -- AND ADDED THIS BLOCK
        FROM menu_items mi
        JOIN favorites f
          ON mi.id = f.menu_item_id
        LEFT JOIN menu_item_ingredients mii -- Need to LEFT JOIN ingredients
          ON mii.menu_item_id = mi.id
        LEFT JOIN ingredients i
          ON i.id = mii.ingredient_id
        WHERE f.user_id = $1
        GROUP BY mi.id -- Need to GROUP BY since we are aggregating
        ORDER BY mi.name`,
      [userId]
    );
    res.send(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

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

// 3) Remove (unstar) a menu item - This endpoint is correct and needs no changes
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
