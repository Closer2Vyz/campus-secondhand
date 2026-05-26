#!/usr/bin/env node
/**
 * 发布公告
 * 用法: node scripts/announce.js "标题" "内容"
 * 例子: node scripts/announce.js "系统维护通知" "今晚2点-4点系统维护"
 */
const path = require('path');
const modulePath = path.join(__dirname, '..', 'server', 'node_modules');
const Database = require(modulePath + '/better-sqlite3');
const db = new Database(path.join(__dirname, '..', 'server', 'data.db'));

const title = process.argv[2];
const content = process.argv[3];

if (!title || !content) {
  console.log('❌ 用法: node scripts/announce.js "标题" "内容"');
  process.exit(1);
}

db.prepare('INSERT INTO announcements (title, content) VALUES (?, ?)').run(title, content);
console.log(`✅ 公告已发布: ${title}`);
db.close();
