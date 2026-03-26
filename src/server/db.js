const fs = require('fs');
const path = require('path');

// Simple JSON file database (swap for PostgreSQL/MongoDB in production)
// Use Railway volume mount if available, otherwise local data/ directory
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getCollection(name) {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveCollection(name, data) {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function findOne(collection, query) {
  const data = getCollection(collection);
  return data.find((item) =>
    Object.entries(query).every(([key, val]) => item[key] === val)
  );
}

function findMany(collection, query = {}) {
  const data = getCollection(collection);
  if (Object.keys(query).length === 0) return data;
  return data.filter((item) =>
    Object.entries(query).every(([key, val]) => item[key] === val)
  );
}

function insertOne(collection, doc) {
  const data = getCollection(collection);
  data.push(doc);
  saveCollection(collection, data);
  return doc;
}

function updateOne(collection, query, updates) {
  const data = getCollection(collection);
  const index = data.findIndex((item) =>
    Object.entries(query).every(([key, val]) => item[key] === val)
  );
  if (index === -1) return null;
  data[index] = { ...data[index], ...updates };
  saveCollection(collection, data);
  return data[index];
}

function deleteOne(collection, query) {
  const data = getCollection(collection);
  const index = data.findIndex((item) =>
    Object.entries(query).every(([key, val]) => item[key] === val)
  );
  if (index === -1) return false;
  data.splice(index, 1);
  saveCollection(collection, data);
  return true;
}

module.exports = { findOne, findMany, insertOne, updateOne, deleteOne, getCollection };
