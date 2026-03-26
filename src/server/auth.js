const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '30d' });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = verifyToken(header.slice(7));
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

async function register(email, password, name) {
  const existing = db.findOne('users', { email });
  if (existing) throw new Error('Email already registered');

  const hash = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    email,
    name,
    password: hash,
    plan: 'free',
    createdAt: new Date().toISOString(),
  };

  db.insertOne('users', user);
  const token = generateToken(user);
  const { password: _, ...safeUser } = user;
  return { user: safeUser, token };
}

async function login(email, password) {
  const user = db.findOne('users', { email });
  if (!user) throw new Error('Invalid credentials');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials');

  const token = generateToken(user);
  const { password: _, ...safeUser } = user;
  return { user: safeUser, token };
}

module.exports = { authMiddleware, register, login, verifyToken };
