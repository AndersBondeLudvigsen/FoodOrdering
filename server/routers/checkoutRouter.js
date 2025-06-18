import { Router } from 'express';
import Stripe from 'stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  const line_items = items.map(({ id, name, price, quantity }) => ({
    price_data: {
      currency: 'dkk',
      product_data: { name },
      unit_amount: Math.round(price * 100), 
    },
    quantity,
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/orders?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/basket`,
      metadata: {
        userId: req.user.id
      }
    });
    res.send({ url: session.url });
  } catch (err) {
    res.status(500).send({ message: 'Could not create checkout session' });
  }
});

export default router;
