const express = require('express');
const db = require('../db');
const router = express.Router();

// Stripe sends raw body for webhook verification
router.post('/', express.raw({ type: 'application/json' }), (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).send('Webhooks not configured');
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { userId, plan } = session.metadata;
      if (userId && plan) {
        db.updateOne('users', { id: userId }, {
          plan,
          stripeSubscriptionId: session.subscription,
          planUpdatedAt: new Date().toISOString(),
        });
        console.log(`User ${userId} upgraded to ${plan}`);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      // Find user by stripe customer ID
      const users = db.findMany('users', {});
      const user = users.find((u) => u.stripeCustomerId === subscription.customer);
      if (user) {
        const status = subscription.status;
        if (status === 'active') {
          // Plan is active
          console.log(`Subscription active for user ${user.id}`);
        } else if (status === 'canceled' || status === 'unpaid') {
          db.updateOne('users', { id: user.id }, { plan: 'free', planUpdatedAt: new Date().toISOString() });
          console.log(`User ${user.id} downgraded to free`);
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const users = db.findMany('users', {});
      const user = users.find((u) => u.stripeCustomerId === subscription.customer);
      if (user) {
        db.updateOne('users', { id: user.id }, { plan: 'free', planUpdatedAt: new Date().toISOString() });
        console.log(`User ${user.id} subscription cancelled, downgraded to free`);
      }
      break;
    }

    default:
      // Unhandled event type
      break;
  }

  res.json({ received: true });
});

module.exports = router;
