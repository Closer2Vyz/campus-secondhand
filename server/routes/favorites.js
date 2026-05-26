const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const authMiddleware = require('../middleware/auth');

/**
 * POST /api/favorites/toggle
 * 切换收藏状态
 */
router.post('/toggle', authMiddleware, (req, res) => {
  const { itemId } = req.body;
  if (!itemId) return res.json({ code: 400, message: '缺少商品ID' });

  const db = getDB();
  const existing = db.prepare(
    'SELECT id FROM favorites WHERE userId = ? AND itemId = ?'
  ).get(req.userId, itemId);

  if (existing) {
    db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
    res.json({ code: 0, data: { favorited: false }, message: '已取消收藏' });
  } else {
    db.prepare('INSERT INTO favorites (userId, itemId) VALUES (?, ?)').run(req.userId, itemId);
    res.json({ code: 0, data: { favorited: true }, message: '已收藏' });
  }
});

/**
 * GET /api/favorites/check/:itemId
 * 检查是否已收藏
 */
router.get('/check/:itemId', authMiddleware, (req, res) => {
  const db = getDB();
  const existing = db.prepare(
    'SELECT id FROM favorites WHERE userId = ? AND itemId = ?'
  ).get(req.userId, req.params.itemId);

  res.json({ code: 0, data: { favorited: !!existing } });
});

/**
 * GET /api/favorites/my
 * 我的收藏列表
 */
router.get('/my', authMiddleware, (req, res) => {
  const db = getDB();
  const items = db.prepare(
    `SELECT i.*, u.nickname as sellerName, f.createdAt as favoritedAt
     FROM favorites f
     JOIN items i ON f.itemId = i.id
     JOIN users u ON i.sellerId = u.id
     WHERE f.userId = ?
     ORDER BY f.createdAt DESC`
  ).all(req.userId);

  const list = items.map(item => ({
    ...item,
    images: safeParseJSON(item.images, []),
  }));

  res.json({ code: 0, data: { list } });
});

function safeParseJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

module.exports = router;
