const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || __dirname;
const DB_PATH = path.join(DATA_DIR, 'data.db');

let _db = null;

// 兼容 better-sqlite3 API 的包装器
function wrapDB(sqlDb) {
  return {
    prepare: function(sql) {
      return new Stmt(sql, sqlDb);
    },
    exec: function(sql) { sqlDb.run(sql); },
    pragma: function() {},
    close: function() {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(DB_PATH, Buffer.from(sqlDb.export()));
      } catch(e) {}
    },
  };
}

class Stmt {
  constructor(sql, sqlDb) {
    this.sql = sql;
    this.db = sqlDb;
    this.lastInsertRowid = 0;
  }

  run(...params) {
    try {
      // 替换 datetime() 函数（sql.js 不支持）
      var sql = this.sql.replace(/datetime\s*\([^)]+\)/gi, "'" + new Date().toISOString().slice(0, 19).replace('T', ' ') + "'");
      this.db.run(sql, params);
      // 获取 lastInsertRowid
      var r = this.db.exec('SELECT last_insert_rowid() as id');
      if (r.length > 0 && r[0].values.length > 0) {
        this.lastInsertRowid = r[0].values[0][0];
      }
      return { lastInsertRowid: this.lastInsertRowid };
    } catch(e) {
      console.error('SQL run error:', e.message, this.sql);
      return { lastInsertRowid: 0 };
    }
  }

  _exec(sql, params) {
    // sql.js 的 exec 不支持参数，手动替换
    var i = 0;
    var s = sql.replace(/\?/g, function() {
      var val = params[i++];
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return val;
      return "'" + String(val).replace(/'/g, "''") + "'";
    });
    try {
      return this.db.exec(s);
    } catch(e) {
      console.error('SQL error:', e.message, s);
      return [];
    }
  }

  get(...params) {
    var rows = this._exec(this.sql, params);
    if (rows.length === 0 || rows[0].values.length === 0) return null;
    var row = {};
    rows[0].columns.forEach(function(c, i) { row[c] = rows[0].values[0][i]; });
    return row;
  }

  all(...params) {
    var rows = this._exec(this.sql, params);
    if (rows.length === 0) return [];
    var result = [];
    rows[0].values.forEach(function(vals) {
      var row = {};
      rows[0].columns.forEach(function(c, i) { row[c] = vals[i]; });
      result.push(row);
    });
    return result;
  }
}

function getDB() {
  if (_db) return _db;
  throw new Error('DB not initialized');
}

async function initDB() {
  var initSqlJs = require('sql.js');
  var SQL = await initSqlJs({
    locateFile: function(file) {
      return path.join(__dirname, 'node_modules', 'sql.js', 'dist', file);
    }
  });

  var sqlDb;
  try {
    var buffer = fs.readFileSync(DB_PATH);
    sqlDb = new SQL.Database(buffer);
  } catch (e) {
    sqlDb = new SQL.Database();
  }

  sqlDb.run('PRAGMA journal_mode=WAL');
  sqlDb.run('PRAGMA foreign_keys=ON');

  // 建表（sql.js 不支持 datetime() 函数作为默认值，改用 TEXT）
  var tables = [
    'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, openid TEXT UNIQUE NOT NULL, nickname TEXT DEFAULT "", avatar TEXT DEFAULT "", phone TEXT DEFAULT "", campus TEXT DEFAULT "", username TEXT DEFAULT "", password TEXT DEFAULT "", createdAt TEXT)',
    'CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, sellerId INTEGER NOT NULL, title TEXT NOT NULL, description TEXT DEFAULT "", price REAL NOT NULL, images TEXT DEFAULT "[]", category TEXT DEFAULT "其他", status TEXT DEFAULT "active", stock INTEGER DEFAULT 1, contact TEXT DEFAULT "", createdAt TEXT, updatedAt TEXT)',
    'CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, itemId INTEGER NOT NULL, buyerId INTEGER NOT NULL, sellerId INTEGER NOT NULL, itemPrice REAL NOT NULL, serviceFee REAL NOT NULL, totalPrice REAL NOT NULL, pickupTime TEXT NOT NULL, pickupLocation TEXT DEFAULT "", contactPhone TEXT DEFAULT "", status TEXT DEFAULT "pending", createdAt TEXT, completedAt TEXT)',
    'CREATE TABLE IF NOT EXISTS ratings (id INTEGER PRIMARY KEY AUTOINCREMENT, orderId INTEGER NOT NULL UNIQUE, sellerId INTEGER NOT NULL, buyerId INTEGER NOT NULL, score INTEGER NOT NULL, content TEXT DEFAULT "", createdAt TEXT)',
    'CREATE TABLE IF NOT EXISTS subscriptions (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, templateId TEXT NOT NULL, status TEXT DEFAULT "active", createdAt TEXT)',
    'CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, itemId INTEGER NOT NULL, userId INTEGER NOT NULL, content TEXT NOT NULL, createdAt TEXT)',
    'CREATE TABLE IF NOT EXISTS favorites (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, itemId INTEGER NOT NULL, createdAt TEXT)',
    'CREATE TABLE IF NOT EXISTS announcements (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, content TEXT NOT NULL, createdAt TEXT)',
  ];
  tables.forEach(function(t) { sqlDb.run(t); });

  // 迁移：添加新列
  try { sqlDb.run("ALTER TABLE users ADD COLUMN username TEXT DEFAULT ''"); } catch(e) {}
  try { sqlDb.run("ALTER TABLE users ADD COLUMN password TEXT DEFAULT ''"); } catch(e) {}

  _db = wrapDB(sqlDb);

  // 定期保存
  setInterval(function() {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DB_PATH, Buffer.from(sqlDb.export()));
    } catch(e) {}
  }, 5000);

  return _db;
}

module.exports = { getDB, initDB };