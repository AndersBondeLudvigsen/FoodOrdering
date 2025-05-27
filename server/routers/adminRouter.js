import bcrypt from 'bcrypt';
import { Router }       from 'express';
import { query }        from '../database/connection.js';

import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.get('/menu-items', async (req, res) => {
    try {
      const { rows } = await query(`
        SELECT
          mi.id,
          mi.name,
          mi.price,
          mi.category,
          mi.image_url,
          mi.available,
          COALESCE(
            json_agg(i.name) FILTER (WHERE i.name IS NOT NULL),
            '[]'
          ) AS ingredients
        FROM menu_items mi
        LEFT JOIN menu_item_ingredients mii
          ON mi.id = mii.menu_item_id
        LEFT JOIN ingredients i
          ON mii.ingredient_id = i.id
        GROUP BY mi.id
        ORDER BY mi.name
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ message: "Server error fetching menu items" });
    }
  }
);

router.post('/menu-items', async (req, res) => {
    const {
      name,
      price,
      category = null,
      image_url = null,
      available = true,
      ingredients = []
    } = req.body;

    if (!name || typeof price !== 'number') {
      return res.status(400).json({ message: 'Name and numeric price are required' });
    }

    try {
      const { rows: miRows } = await query(
        `INSERT INTO menu_items (name, price, category, image_url, available)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING id`,
        [name, price, category, image_url, available]
      );
      const menuItemId = miRows[0].id;

      for (const ingName of ingredients) {
        await query(
          `INSERT INTO ingredients (name)
           VALUES ($1)
           ON CONFLICT (name) DO NOTHING`,
          [ingName]
        );
        const { rows: ingRows } = await query(
          `SELECT id FROM ingredients WHERE name = $1`,
          [ingName]
        );
        const ingredientId = ingRows[0].id;

        await query(
          `INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id)
           VALUES ($1,$2)`,
          [menuItemId, ingredientId]
        );
      }

      res.status(201).json({ menuItemId });
    } catch (err) {
      res.status(500).json({ message: 'Server error creating menu item' });
    }
  }
);

router.patch('/menu-items/:id', async (req, res) => {
    const itemId = Number(req.params.id);
    const {
      name,
      price,
      category = null,
      image_url = null,
      available = true,
      ingredients = []
    } = req.body;

    try {
      await query(
        `UPDATE menu_items
           SET name=$1, price=$2, category=$3, image_url=$4, available=$5
         WHERE id=$6`,
        [name, price, category, image_url, available, itemId]
      );

      await query(
        `DELETE FROM menu_item_ingredients
         WHERE menu_item_id = $1`,
        [itemId]
      );

      for (const ingName of ingredients) {
        await query(
          `INSERT INTO ingredients (name)
           VALUES ($1)
           ON CONFLICT (name) DO NOTHING`,
          [ingName]
        );
        const { rows: ingRows } = await query(
          `SELECT id FROM ingredients WHERE name=$1`,
          [ingName]
        );
        const ingredientId = ingRows[0].id;

        await query(
          `INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id)
           VALUES ($1,$2)`,
          [itemId, ingredientId]
        );
      }

      res.json({ message: 'Updated' });
    } catch (err) {
      res.status(500).json({ message: 'Server error updating menu item' });
    }
  }
);

router.delete('/menu-items/:id', async (req, res) => {
    const itemId = Number(req.params.id);
    try {
      await query(
        `DELETE FROM menu_items WHERE id = $1`,
        [itemId]
      );
      res.json({ message: 'Deleted' });
    } catch (err) {
      res.status(500).json({ message: 'Server error deleting menu item' });
    }
  }
);


router.get('/users', async (req, res) => {
    try {
      const { rows } = await query(`
        SELECT id, username, email, role
        FROM users
        ORDER BY username
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ message: 'Server error fetching users' });
    }
  }
);

router.patch('/users/:id', async (req, res) => {
    const userId = Number(req.params.id);
    const { username, email, role, password } = req.body;

    if (role && !['customer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const sets = [];
    const values = [];
    let idx = 1;

    if (username) {
      sets.push(`username = $${idx++}`);
      values.push(username);
    }

    if (email) {
      sets.push(`email = $${idx++}`);
      values.push(email);
    }

    if (role) {
      sets.push(`role = $${idx++}`);
      values.push(role);
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      sets.push(`password = $${idx++}`);
      values.push(hash);
    }

    if (sets.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const sql = `
      UPDATE users
         SET ${sets.join(', ')}
       WHERE id = $${idx}
       RETURNING id, username, email, role
    `;
    values.push(userId);

    try {
      const result = await query(sql, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505' && err.constraint === 'users_email_key') {
        return res.status(400).json({ message: 'Email already in use' });
      }
      return res.status(500).json({ message: 'Server error updating user' });
    }
  }
);

export default router;
