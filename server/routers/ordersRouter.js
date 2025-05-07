// src/routes/orders.js
import { Router } from 'express';
import { query }  from '../database/connection.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

/**
 * POST /orders
 * Body: { items: [{ id, quantity }, ...] }
 * Creates an order and its items in sequence.
 */
router.post('/', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  try {
    // 1) Insert into orders
    const orderRes = await query(
      `INSERT INTO orders (user_id)
       VALUES ($1)
       RETURNING id, created_at`,
      [userId]
    );
    const orderId = orderRes.rows[0].id;
    const createdAt = orderRes.rows[0].created_at;

    // 2) Insert each order_item (note: no transaction)
    for (const { id: menuItemId, quantity } of items) {
      await query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity)
         VALUES ($1, $2, $3)`,
        [orderId, menuItemId, quantity]
      );
    }

    return res.status(201).json({ orderId, createdAt });
  } catch (err) {
    console.error('Error creating order:', err);
    return res.status(500).json({ message: 'Server error creating order' });
  }
});

/**
 * GET /orders
 * Returns all orders for the current user, each with its items.
 */
router.get('/', authenticate, async (req, res) => {
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

    return res.json(rows);
  } catch (err) {
    console.error('Error loading orders:', err);
    return res.status(500).json({ message: 'Server error loading orders' });
  }
});

export default router;
