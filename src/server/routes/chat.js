const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { generateAIReply } = require('../ai');
const router = express.Router();

// This is the PUBLIC endpoint the widget calls — no auth needed, uses bot API key
router.post('/:apiKey', async (req, res) => {
  const { message, sessionId } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  // Find bot by API key
  const bot = db.findOne('bots', { apiKey: req.params.apiKey });
  if (!bot) return res.status(404).json({ error: 'Invalid API key' });

  // Check chat limits
  const owner = db.findOne('users', { id: bot.ownerId });
  const plan = owner?.plan || 'free';
  const limits = { free: 50, pro: 5000, business: -1 };
  const limit = limits[plan];

  if (limit !== -1 && bot.chatsThisMonth >= limit) {
    return res.json({
      reply: "I'm sorry, this support chat has reached its monthly limit. Please contact us directly.",
      limitReached: true,
    });
  }

  // Get bot's knowledge base
  const docs = db.findMany('docs', { botId: bot.id });
  const knowledge = docs.map((d) => `## ${d.title}\n${d.content}`).join('\n\n');

  // Get recent chat history for this session
  const sid = sessionId || uuidv4();
  const history = db.findMany('chats', { botId: bot.id, sessionId: sid })
    .slice(-6)
    .map((c) => [
      { isUser: true, text: c.message },
      { isUser: false, text: c.reply },
    ])
    .flat();

  // Try AI first, fall back to keyword matching
  let reply = await generateAIReply(message, knowledge, bot.welcomeMessage, history);
  if (!reply) {
    reply = keywordReply(message, knowledge, bot.welcomeMessage);
  }

  // Increment chat count
  db.updateOne('bots', { id: bot.id }, { chatsThisMonth: bot.chatsThisMonth + 1 });

  // Log the conversation
  const chatLog = {
    id: uuidv4(),
    botId: bot.id,
    sessionId: sid,
    message,
    reply,
    createdAt: new Date().toISOString(),
  };
  db.insertOne('chats', chatLog);

  res.json({ reply, sessionId: chatLog.sessionId });
});

// Get chat history for a bot (dashboard)
const { authMiddleware } = require('../auth');
router.get('/history/:botId', authMiddleware, (req, res) => {
  const bot = db.findOne('bots', { id: req.params.botId, ownerId: req.user.id });
  if (!bot) return res.status(404).json({ error: 'Bot not found' });

  const chats = db.findMany('chats', { botId: req.params.botId });
  const sessions = {};
  chats.forEach((chat) => {
    if (!sessions[chat.sessionId]) sessions[chat.sessionId] = [];
    sessions[chat.sessionId].push(chat);
  });

  res.json({ total: chats.length, sessions });
});

// Keyword-based fallback when no AI API key is configured
function keywordReply(message, knowledge, welcomeMessage) {
  const lower = message.toLowerCase().trim();

  if (/^(hi|hello|hey|sup|yo|good\s*(morning|afternoon|evening))$/i.test(lower)) {
    return welcomeMessage;
  }

  if (knowledge) {
    const words = lower.split(/\s+/).filter((w) => w.length > 2);
    const sections = knowledge.split('## ').filter(Boolean);

    let bestMatch = null;
    let bestScore = 0;

    for (const section of sections) {
      const sectionLower = section.toLowerCase();
      let score = 0;
      for (const word of words) {
        if (sectionLower.includes(word)) score++;
      }
      if (sectionLower.includes(lower)) score += 5;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = section;
      }
    }

    if (bestMatch && bestScore >= 1) {
      const lines = bestMatch.split('\n');
      const content = lines.slice(1).join('\n').trim();
      return content || bestMatch.trim();
    }
  }

  const fallbacks = [
    "I don't have specific information about that yet. Would you like me to connect you with a human agent?",
    "That's a great question! Let me get a team member to help you with that.",
    "I'm still learning about that topic. Could you try rephrasing, or would you prefer to speak with our support team?",
  ];

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

module.exports = router;
