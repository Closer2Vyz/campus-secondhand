const modulePath = require('path').join(__dirname, '..', 'server', 'node_modules');
const Database = require(modulePath + '/better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'data.db'));

try { db.exec("ALTER TABLE users ADD COLUMN username TEXT DEFAULT ''"); console.log('✅ 已添加 username 列'); } catch(e) { console.log('ℹ️', e.message); }
try { db.exec("ALTER TABLE users ADD COLUMN password TEXT DEFAULT ''"); console.log('✅ 已添加 password 列'); } catch(e) { console.log('ℹ️', e.message); }

console.log('📊 用户数:', db.prepare('SELECT COUNT(*) as c FROM users').get().c);
db.close();
