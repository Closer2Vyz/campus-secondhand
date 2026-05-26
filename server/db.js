const Database = require('better-sqlite3');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || __dirname;
const DB_PATH = path.join(DATA_DIR, 'data.db');

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openid TEXT UNIQUE NOT NULL,
      nickname TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      campus TEXT DEFAULT '',
      createdAt DATETIME DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sellerId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL CHECK(price > 0),
      images TEXT DEFAULT '[]',
      category TEXT DEFAULT '其他',
      status TEXT DEFAULT 'active' CHECK(status IN ('active','sold','inactive')),
      stock INTEGER DEFAULT 1,
      contact TEXT DEFAULT '',
      createdAt DATETIME DEFAULT (datetime('now','localtime')),
      updatedAt DATETIME DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (sellerId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemId INTEGER NOT NULL,
      buyerId INTEGER NOT NULL,
      sellerId INTEGER NOT NULL,
      itemPrice REAL NOT NULL,
      serviceFee REAL NOT NULL,
      totalPrice REAL NOT NULL,
      pickupTime TEXT NOT NULL,
      pickupLocation TEXT DEFAULT '',
      contactPhone TEXT DEFAULT '',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','completed','cancelled')),
      createdAt DATETIME DEFAULT (datetime('now','localtime')),
      completedAt DATETIME,
      FOREIGN KEY (itemId) REFERENCES items(id),
      FOREIGN KEY (buyerId) REFERENCES users(id),
      FOREIGN KEY (sellerId) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
    CREATE INDEX IF NOT EXISTS idx_items_seller ON items(sellerId);
    CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyerId);
    CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(sellerId);

    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER NOT NULL UNIQUE,
      sellerId INTEGER NOT NULL,
      buyerId INTEGER NOT NULL,
      score INTEGER NOT NULL CHECK(score >= 1 AND score <= 5),
      content TEXT DEFAULT '',
      createdAt DATETIME DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (orderId) REFERENCES orders(id),
      FOREIGN KEY (sellerId) REFERENCES users(id),
      FOREIGN KEY (buyerId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      templateId TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      content TEXT NOT NULL,
      createdAt DATETIME DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (itemId) REFERENCES items(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      itemId INTEGER NOT NULL,
      createdAt DATETIME DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (itemId) REFERENCES items(id),
      UNIQUE(userId, itemId)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt DATETIME DEFAULT (datetime('now','localtime'))
    );
  `);
}

module.exports = { getDB };
