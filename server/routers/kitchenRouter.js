import { Router } from "express";
import { query }  from "../database/connection.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

/**
 * GET /kitchen/orders
 * Returns all orders with status = 'pending', including their items
 */
router.get("/orders", authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `
      SELECT
        o.id,
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
      WHERE o.status = 'pending'
      GROUP BY o.id
      ORDER BY o.created_at DESC
      `
    );

    return res.json(rows);
  } catch (err) {
    console.error("Error loading pending orders:", err);
    return res.status(500).json({ message: "Server error loading pending orders" });
  }
});

export default router;
