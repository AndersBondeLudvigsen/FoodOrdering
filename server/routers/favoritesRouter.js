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
          mi.available, 
          COALESCE(
            json_agg(i.name) FILTER (WHERE i.id IS NOT NULL),
            '[]'
          ) AS ingredients 
        FROM menu_items mi
        JOIN favorites f
          ON mi.id = f.menu_item_id
        LEFT JOIN menu_item_ingredients mii 
          ON mii.menu_item_id = mi.id
        LEFT JOIN ingredients i
          ON i.id = mii.ingredient_id
        WHERE f.user_id = $1
        GROUP BY mi.id 
        ORDER BY mi.name`,
      [userId]
    );
    res.send(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to fetch favorites' });
  }
});

router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { menuItemId } = req.body;
    if (!menuItemId) {
      return res.status(400).send({ error: 'menuItemId is required' });
    }
    await query(
      `INSERT INTO favorites (user_id, menu_item_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, menuItemId]
    );
    res.status(201).send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to add favorite' });
  }
});

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
    res.status(500).send({ error: 'Failed to remove favorite' });
  }
});

export default router;
