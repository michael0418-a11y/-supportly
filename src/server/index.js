require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// Stripe webhook needs raw body — must be before express.json()
app.use('/api/webhook', require('./routes/webhook'));

app.use(express.json());

// Serve static files (dashboard + widget)
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use('/widget', express.static(path.join(__dirname, '..', 'widget')));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bots', require('./routes/bots'));
app.use('/api/docs', require('./routes/docs'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/billing', require('./routes/stripe'));

// Catch-all for SPA routing (Express 5 syntax)
app.get('/{*splat}', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/widget')) {
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Supportly running at http://localhost:${PORT}`);
  console.log(`Widget URL: http://localhost:${PORT}/widget/supportly.js`);
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_key_here') {
    console.log('Note: No OpenAI key set — using keyword matching (add OPENAI_API_KEY to .env for AI)');
  }
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_your')) {
    console.log('Note: No Stripe key set — payments in demo mode (add STRIPE_SECRET_KEY to .env)');
  }
});
