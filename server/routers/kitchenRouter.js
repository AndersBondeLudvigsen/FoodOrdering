import { Router } from 'express';
import { query }  from '../database/connection.js';
import { getIO }  from '../middleware/socketIo.js';

const router = Router();


router.get('/', async (req, res) => {
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
      WHERE o.status IN ('pending','in making','ready')
      GROUP BY o.id
      ORDER BY o.created_at DESC
      `
    );

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Server error loading pending orders' });
  }
});


router.patch('/:id/status', async (req, res) => {
  const orderId = Number(req.params.id);
  const { status } = req.body;
  const valid = ['pending', 'in making', 'ready'];
  if (!valid.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const { rows } = await query(
      `UPDATE orders
         SET status = $1
       WHERE id = $2
       RETURNING id, status, created_at, user_id`,
      [status, orderId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const order = rows[0];

    const { rows: items } = await query(
      `SELECT menu_item_id AS "menuItemId", quantity
         FROM order_items
        WHERE order_id = $1`,
      [orderId]
    );

    const io = getIO();
    io.emit('order-status-update', { orderId, status, userId: order.user_id });
    io.to(`user_${order.user_id}`).emit('your-order-status', { orderId, status });
    

    return res.json({ orderId, status });
  } catch (err) {
    return res.status(500).json({ message: 'Server error updating order status' });
  }
});

router.patch('/:id/cancel', async (req, res) => {
  const orderId = Number(req.params.id);
  try {
    const { rows } = await query(
      `UPDATE orders
         SET status = 'cancelled'
       WHERE id = $1
       RETURNING id, status, user_id`,
      [orderId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const { status, user_id: userId } = rows[0];

    const io = getIO();
    io.emit('order-status-update', { orderId, status, userId });
    io.to(`user_${userId}`).emit('your-order-status', { orderId, status });

    return res.json({ orderId, status });
  } catch (err) {
    return res.status(500).json({ message: 'Server error cancelling order' });
  }
});


router.patch('/menu-items/:id/availability', async (req, res) => {
  const itemId    = Number(req.params.id);
  const { available } = req.body; 

  if (typeof available !== 'boolean') {
    return res.status(400).json({ message: 'available must be boolean' });
  }

  try {
    const { rows } = await query(
      `UPDATE menu_items
         SET available = $1
       WHERE id = $2
       RETURNING id, available`,
      [available, itemId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    const updated = rows[0];

    const io = getIO();
    io.emit('menu-item-updated', {
      id:        updated.id,
      available: updated.available
    });

    return res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
