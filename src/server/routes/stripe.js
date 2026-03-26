const express = require('express');
const { authMiddleware } = require('../auth');
const db = require('../db');
const router = express.Router();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_your')) {
    return null;
  }
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// Create a Stripe Checkout session for subscription
router.post('/checkout', authMiddleware, async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({
      error: 'Payments not configured yet. Add STRIPE_SECRET_KEY to .env',
      demo: true,
    });
  }

  const { plan } = req.body;
  if (!['pro', 'business'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan. Choose "pro" or "business".' });
  }

  const priceId = plan === 'pro'
    ? process.env.STRIPE_PRO_PRICE_ID
    : process.env.STRIPE_BIZ_PRICE_ID;

  if (!priceId) {
    return res.status(503).json({ error: `STRIPE_${plan.toUpperCase()}_PRICE_ID not set in .env` });
  }

  const user = db.findOne('users', { id: req.user.id });

  try {
    // Create or reuse Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      db.updateOne('users', { id: user.id }, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.BASE_URL || 'http://localhost:3000'}?payment=success`,
      cancel_url: `${process.env.BASE_URL || 'http://localhost:3000'}?payment=cancelled`,
      metadata: { userId: user.id, plan },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Get billing portal link (manage subscription)
router.post('/portal', authMiddleware, async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'Payments not configured' });

  const user = db.findOne('users', { id: req.user.id });
  if (!user.stripeCustomerId) {
    return res.status(400).json({ error: 'No active subscription' });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: process.env.BASE_URL || 'http://localhost:3000',
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe portal error:', err.message);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Get current plan info
router.get('/plan', authMiddleware, (req, res) => {
  const user = db.findOne('users', { id: req.user.id });
  res.json({
    plan: user.plan || 'free',
    stripeCustomerId: user.stripeCustomerId || null,
  });
});

module.exports = router;
