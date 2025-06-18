import { Router }       from 'express';

import { query }        from '../database/connection.js';

import { getIO }        from '../utils/socketIo.js';   

const router = Router();



router.get('/', async (req, res) => {
  const userId = req.user.id;
  try {
    const { rows } = await query(
      `
      SELECT
        o.id,
        o.status,
        o.created_at,
        json_agg(
          json_build_object(
            'menuItemId', oi.menu_item_id,
            'quantity',   oi.quantity
          )
        ) AS items
      FROM orders o
      JOIN order_items oi
        ON oi.order_id = o.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      `,
      [userId]
    );

    return res.send(rows);
  } catch (err) {
    return res.status(500).send({ message: 'Server error loading orders' });
  }
});


router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).send({ message: 'Cart is empty' });
  }

  try {
    const { rows } = await query(
      `INSERT INTO orders (user_id)
       VALUES ($1)
       RETURNING id, created_at`,
      [userId]
    );
    const orderId   = rows[0].id;
    const createdAt = rows[0].created_at;

    for (const { id: menuItemId, quantity } of items) {
      await query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity)
         VALUES ($1, $2, $3)`,
        [orderId, menuItemId, quantity]
      );
    }

    getIO().emit('new-order', { orderId, createdAt, items, userId });

    return res.status(201).send({ orderId, createdAt });
  } catch (err) {
    return res.status(500).send({ message: 'Server error creating order' });
  }
});


export default router;
