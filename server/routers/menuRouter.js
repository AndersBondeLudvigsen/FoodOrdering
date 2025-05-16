// src/routes/menuRouter.js
import { Router } from 'express';
import { query }  from '../database/connection.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await query(`
              SELECT
              mi.id,
              mi.name,
              mi.price,
              mi.available,
              mi.category,
              mi.image_url,
              -- aggregate the ingredient names into a JSON array
              COALESCE(
               json_agg(i.name) FILTER (WHERE i.id IS NOT NULL),
                '[]'
              ) AS ingredients
            FROM menu_items mi
            LEFT JOIN menu_item_ingredients mii
              ON mii.menu_item_id = mi.id
            LEFT JOIN ingredients i
              ON i.id = mii.ingredient_id
            GROUP BY mi.id
            ORDER BY mi.id
          `);
    res.json(rows);
  } catch (err) {
    console.error('Error loading menu:', err);
    res.status(500).json({ message: 'Server error loading menu' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const { rows } = await query(
      `SELECT
         mi.id,
         mi.name,
         mi.price,
         mi.category,
         mi.image_url,
         mi.available,
         COALESCE(
           (SELECT json_agg(i.name)
              FROM menu_item_ingredients mii
              JOIN ingredients i ON i.id = mii.ingredient_id
             WHERE mii.menu_item_id = mi.id),
           '[]'
         ) AS ingredients
       FROM menu_items mi
       WHERE mi.id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching menu item:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
export default router;
