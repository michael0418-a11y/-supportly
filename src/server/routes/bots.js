const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../auth');
const db = require('../db');
const router = express.Router();

// Plan limits
const PLAN_LIMITS = {
  free: { bots: 1, docsPerBot: 5, chatsPerMonth: 50 },
  pro: { bots: 5, docsPerBot: 50, chatsPerMonth: 5000 },
  business: { bots: 20, docsPerBot: 200, chatsPerMonth: -1 }, // -1 = unlimited
};

// Create a new bot/widget
router.post('/', authMiddleware, (req, res) => {
  const { name, welcomeMessage, primaryColor } = req.body;
  if (!name) return res.status(400).json({ error: 'Bot name is required' });

  const user = db.findOne('users', { id: req.user.id });
  const userBots = db.findMany('bots', { ownerId: req.user.id });
  const limit = PLAN_LIMITS[user.plan || 'free'].bots;

  if (userBots.length >= limit) {
    return res.status(403).json({
      error: `Free plan allows ${limit} bot(s). Upgrade to create more.`,
      upgrade: true,
    });
  }

  const bot = {
    id: uuidv4(),
    ownerId: req.user.id,
    name,
    welcomeMessage: welcomeMessage || "Hi! How can I help you today?",
    primaryColor: primaryColor || '#0099ff',
    apiKey: `sk_${uuidv4().replace(/-/g, '')}`,
    chatsThisMonth: 0,
    createdAt: new Date().toISOString(),
  };

  db.insertOne('bots', bot);
  res.json(bot);
});

// List user's bots
router.get('/', authMiddleware, (req, res) => {
  const bots = db.findMany('bots', { ownerId: req.user.id });
  res.json(bots);
});

// Get single bot
router.get('/:id', authMiddleware, (req, res) => {
  const bot = db.findOne('bots', { id: req.params.id, ownerId: req.user.id });
  if (!bot) return res.status(404).json({ error: 'Bot not found' });
  res.json(bot);
});

// Update bot settings
router.put('/:id', authMiddleware, (req, res) => {
  const { name, welcomeMessage, primaryColor } = req.body;
  const updated = db.updateOne(
    'bots',
    { id: req.params.id, ownerId: req.user.id },
    { ...(name && { name }), ...(welcomeMessage && { welcomeMessage }), ...(primaryColor && { primaryColor }) }
  );
  if (!updated) return res.status(404).json({ error: 'Bot not found' });
  res.json(updated);
});

// Delete bot
router.delete('/:id', authMiddleware, (req, res) => {
  const deleted = db.deleteOne('bots', { id: req.params.id, ownerId: req.user.id });
  if (!deleted) return res.status(404).json({ error: 'Bot not found' });
  // Also delete associated docs
  const docs = db.findMany('docs', { botId: req.params.id });
  docs.forEach((doc) => db.deleteOne('docs', { id: doc.id }));
  res.json({ success: true });
});

module.exports = router;
