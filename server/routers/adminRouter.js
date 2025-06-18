import bcrypt from 'bcrypt';
import { Router } from 'express';
import { query } from '../database/connection.js';

const router = Router();


router.get('/users', async (req, res) => {
    try {
        const { rows } = await query(`
            SELECT id, username, email, role
            FROM users
            ORDER BY username
        `);
        res.send(rows);
    } catch (err) {
        console.error('Admin GET /users error:', err);
        res.status(500).send({ message: 'Server error fetching users' });
    }
});




router.get('/sales', async (req, res) => {
    try {
        //  Daily sales totals (last 30 days)
        const { rows: dailyRows } = await query(`
            SELECT
                date_trunc('day', o.created_at) AS day,
                SUM(mi.price * oi.quantity)::NUMERIC(10,2) AS total_sales
            FROM orders o
            JOIN order_items oi
                ON oi.order_id = o.id
            JOIN menu_items mi
                ON mi.id = oi.menu_item_id
            WHERE o.created_at >= NOW() - INTERVAL '30 days'
              AND o.status != 'cancelled'
            GROUP BY date_trunc('day', o.created_at)
            ORDER BY day;
        `);

        // Top 5 selling items (by total quantity) in last 30 days
        const { rows: topItemsRows } = await query(`
            SELECT
                mi.id,
                mi.name,
                SUM(oi.quantity) AS total_quantity
            FROM order_items oi
            JOIN orders o
                ON o.id = oi.order_id
            JOIN menu_items mi
                ON mi.id = oi.menu_item_id
            WHERE o.created_at >= NOW() - INTERVAL '30 days'
              AND o.status != 'cancelled'
            GROUP BY mi.id, mi.name
            ORDER BY SUM(oi.quantity) DESC
            LIMIT 5;
        `);

        //  Peak hours (count of orders by hour of day) for last week
        const { rows: hourlyRows } = await query(`
            SELECT
                extract(hour from o.created_at) AS hour,
                COUNT(*) AS order_count
            FROM orders o
            WHERE o.created_at >= NOW() - INTERVAL '7 days'
              AND o.status != 'cancelled'
            GROUP BY extract(hour from o.created_at)
            ORDER BY hour;
        `);

        return res.send({
            daily: dailyRows,       
            topItems: topItemsRows, 
            hourly: hourlyRows     
        });
    } catch (err) {
        console.error('Admin GET /sales error:', err);
        res.status(500).send({ message: 'Server error fetching sales data' });
    }
});

router.get('/sales/item-by-name', async (req, res) => {
    const itemName = req.query.name; 
    if (!itemName) {
        return res.status(400).send({ message: 'Menu item name is required.' });
    }

    try {
        const { rows: itemRows } = await query(
            `SELECT id FROM menu_items WHERE name ILIKE $1`,
            [itemName]
        );

        if (itemRows.length === 0) {
            return res.status(404).send({ message: 'Menu item not found.' });
        }

        const itemId = itemRows[0].id;
        const { rows: dailyItemSales } = await query(`
            SELECT
                COALESCE(SUM(oi.quantity), 0)::INT AS total_quantity_sold,
                COALESCE(SUM(mi.price * oi.quantity), 0.00)::NUMERIC(10,2) AS total_revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN menu_items mi ON mi.id = oi.menu_item_id
            WHERE oi.menu_item_id = $1
            AND o.created_at >= date_trunc('day', NOW())
            AND o.status != 'cancelled';
        `, [itemId]);

        const { rows: weeklyItemSales } = await query(`
            SELECT
                COALESCE(SUM(oi.quantity), 0)::INT AS total_quantity_sold,
                COALESCE(SUM(mi.price * oi.quantity), 0.00)::NUMERIC(10,2) AS total_revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN menu_items mi ON mi.id = oi.menu_item_id
            WHERE oi.menu_item_id = $1
            AND o.created_at >= date_trunc('week', NOW())
            AND o.status != 'cancelled';
        `, [itemId]);

        const { rows: monthlyItemSales } = await query(`
            SELECT
                COALESCE(SUM(oi.quantity), 0)::INT AS total_quantity_sold,
                COALESCE(SUM(mi.price * oi.quantity), 0.00)::NUMERIC(10,2) AS total_revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN menu_items mi ON mi.id = oi.menu_item_id
            WHERE oi.menu_item_id = $1
            AND o.created_at >= date_trunc('month', NOW())
            AND o.status != 'cancelled';
        `, [itemId]);

        const { rows: allTimeItemSales } = await query(`
            SELECT
                COALESCE(SUM(oi.quantity), 0)::INT AS total_quantity_sold,
                COALESCE(SUM(mi.price * oi.quantity), 0.00)::NUMERIC(10,2) AS total_revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN menu_items mi ON mi.id = oi.menu_item_id
            WHERE oi.menu_item_id = $1
            AND o.status != 'cancelled';
        `, [itemId]);

        res.send({
            itemName: itemName,
            id: itemId,
            today: dailyItemSales[0],
            thisWeek: weeklyItemSales[0],
            thisMonth: monthlyItemSales[0],
            allTime: allTimeItemSales[0]
        });

    } catch (err) {
        console.error('Admin GET /sales/item-by-name error:', err);
        res.status(500).send({ message: 'Server error fetching item sales data.' });
    }
});



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
      return res.status(400).send({ message: 'Name and numeric price are required' });
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

      res.status(201).send({ menuItemId });
    } catch (err) {
      console.error('Admin POST /menu-items error:', err);
      res.status(500).send({ message: 'Server error creating menu item' });
    }
});

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

    if (typeof name !== 'string' || name.trim() === '' || typeof price !== 'number') {
        return res.status(400).send({ message: 'Name (string) and Price (number) are required fields for update.' });
    }

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

      res.send({ message: 'Menu item updated successfully.' });
    } catch (err) {
      console.error('Admin PATCH /menu-items/:id error:', err);
      res.status(500).send({ message: 'Server error updating menu item' });
    }
});


router.patch('/users/:id', async (req, res) => {
    const userId = Number(req.params.id);
    const { username, email, role, password } = req.body;

    if (role && !['customer', 'admin'].includes(role)) {
      return res.status(400).send({ message: 'Invalid role' });
    }

    const sets = [];
    const values = [];
    let idx = 1;

    if (username !== undefined) {
      sets.push(`username = $${idx++}`);
      values.push(username);
    }

    if (email !== undefined) {
      sets.push(`email = $${idx++}`);
      values.push(email);
    }

    if (role !== undefined) {
      sets.push(`role = $${idx++}`);
      values.push(role);
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      sets.push(`password = $${idx++}`);
      values.push(hash);
    }

    if (sets.length === 0) {
      return res.status(400).send({ message: 'No fields to update' });
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
        return res.status(404).send({ message: 'User not found' });
      }

      return res.send(result.rows[0]);
    } catch (err) {
      console.error('Admin PATCH /users/:id error:', err);
      if (err.code === '23505' && err.constraint === 'users_email_key') {
        return res.status(400).send({ message: 'Email already in use' });
      }
      return res.status(500).send({ message: 'Server error updating user' });
    }
});



router.delete('/menu-items/:id', async (req, res) => {
    const itemId = Number(req.params.id);
    try {
      const result = await query( 
        `DELETE FROM menu_items WHERE id = $1 RETURNING id`,
        [itemId]
      );
      if (result.rowCount === 0) {
        return res.status(404).send({ message: 'Menu item not found.' });
      }
      res.send({ message: 'Menu item deleted successfully.' });
    } catch (err) {
      console.error('Admin DELETE /menu-items/:id error:', err);
      res.status(500).send({ message: 'Server error deleting menu item' });
    }
});



export default router;