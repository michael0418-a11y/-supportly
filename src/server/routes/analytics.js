const express = require('express');
const { authMiddleware } = require('../auth');
const db = require('../db');
const router = express.Router();

router.get('/:botId', authMiddleware, (req, res) => {
  const bot = db.findOne('bots', { id: req.params.botId, ownerId: req.user.id });
  if (!bot) return res.status(404).json({ error: 'Bot not found' });

  const chats = db.findMany('chats', { botId: req.params.botId });

  // Basic analytics
  const sessions = new Set(chats.map((c) => c.sessionId));
  const today = new Date().toISOString().slice(0, 10);
  const todayChats = chats.filter((c) => c.createdAt.startsWith(today));

  // Messages per day (last 7 days)
  const dailyCounts = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyCounts[key] = chats.filter((c) => c.createdAt.startsWith(key)).length;
  }

  res.json({
    totalMessages: chats.length,
    totalSessions: sessions.size,
    todayMessages: todayChats.length,
    chatsUsed: bot.chatsThisMonth,
    dailyCounts,
  });
});

module.exports = router;
