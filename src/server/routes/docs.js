const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../auth');
const db = require('../db');
const router = express.Router();

// Add a knowledge doc to a bot (FAQ, product info, etc.)
router.post('/:botId', authMiddleware, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const bot = db.findOne('bots', { id: req.params.botId, ownerId: req.user.id });
  if (!bot) return res.status(404).json({ error: 'Bot not found' });

  const doc = {
    id: uuidv4(),
    botId: req.params.botId,
    title,
    content,
    createdAt: new Date().toISOString(),
  };

  db.insertOne('docs', doc);
  res.json(doc);
});

// List docs for a bot
router.get('/:botId', authMiddleware, (req, res) => {
  const bot = db.findOne('bots', { id: req.params.botId, ownerId: req.user.id });
  if (!bot) return res.status(404).json({ error: 'Bot not found' });

  const docs = db.findMany('docs', { botId: req.params.botId });
  res.json(docs);
});

// Delete a doc
router.delete('/:botId/:docId', authMiddleware, (req, res) => {
  const bot = db.findOne('bots', { id: req.params.botId, ownerId: req.user.id });
  if (!bot) return res.status(404).json({ error: 'Bot not found' });

  const deleted = db.deleteOne('docs', { id: req.params.docId, botId: req.params.botId });
  if (!deleted) return res.status(404).json({ error: 'Doc not found' });
  res.json({ success: true });
});

module.exports = router;
