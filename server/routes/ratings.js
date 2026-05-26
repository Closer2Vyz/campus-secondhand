const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const authMiddleware = require('../middleware/auth');

/**
 * GET /api/ratings/seller/:sellerId
 * 获取卖家评分和评价列表
 */
router.get('/seller/:sellerId', (req, res) => {
  const db = getDB();
  const sellerId = req.params.sellerId;

  // 评分统计
  const stats = db.prepare(
    `SELECT COUNT(*) as count, ROUND(AVG(score), 1) as avgScore
     FROM ratings WHERE sellerId = ?`
  ).get(sellerId);

  // 评价列表
  const list = db.prepare(
    `SELECT r.score, r.content, r.createdAt, u.nickname as buyerName
     FROM ratings r
     JOIN users u ON r.buyerId = u.id
     WHERE r.sellerId = ?
     ORDER BY r.createdAt DESC`
  ).all(sellerId);

  res.json({
    code: 0,
    data: {
      total: stats.count || 0,
      avgScore: stats.avgScore || 0,
      list: list,
    },
  });
});

/**
 * POST /api/ratings
 * 提交评价（买家对已完成的订单评价）
 */
router.post('/', authMiddleware, (req, res) => {
  const { orderId, score, content } = req.body;

  if (!orderId || !score || score < 1 || score > 5) {
    return res.json({ code: 400, message: '请给出有效评分(1-5)' });
  }

  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

  if (!order) return res.json({ code: 404, message: '订单不存在' });
  if (order.buyerId !== req.userId) return res.json({ code: 403, message: '只有买家可以评价' });
  if (order.status !== 'completed') return res.json({ code: 400, message: '只能评价已完成的订单' });

  // 检查是否已评价
  const existing = db.prepare('SELECT id FROM ratings WHERE orderId = ?').get(orderId);
  if (existing) return res.json({ code: 400, message: '已评价过' });

  db.prepare(
    'INSERT INTO ratings (orderId, sellerId, buyerId, score, content) VALUES (?, ?, ?, ?, ?)'
  ).run(orderId, order.sellerId, req.userId, score, (content || '').trim());

  res.json({ code: 0, message: '评价成功' });
});

/**
 * GET /api/ratings/seller/:sellerId/info
 * 获取卖家主页信息（基本信息 + 在售数量 + 评分）
 */
router.get('/seller/:sellerId/info', (req, res) => {
  const db = getDB();
  const user = db.prepare(
    'SELECT id, nickname, avatar, campus, createdAt FROM users WHERE id = ?'
  ).get(req.params.sellerId);

  if (!user) return res.json({ code: 404, message: '用户不存在' });

  const itemCount = db.prepare(
    "SELECT COUNT(*) as c FROM items WHERE sellerId = ? AND status = 'active'"
  ).get(req.params.sellerId);

  const ratingStats = db.prepare(
    `SELECT COUNT(*) as count, ROUND(AVG(score), 1) as avgScore
     FROM ratings WHERE sellerId = ?`
  ).get(req.params.sellerId);

  const items = db.prepare(
    `SELECT id, title, price, images, createdAt
     FROM items WHERE sellerId = ? AND status = 'active'
     ORDER BY createdAt DESC LIMIT 20`
  ).all(req.params.sellerId);

  res.json({
    code: 0,
    data: {
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        campus: user.campus,
        createdAt: user.createdAt,
      },
      itemCount: itemCount.c,
      ratingCount: ratingStats.count || 0,
      avgScore: ratingStats.avgScore || 0,
      items: items.map(item => ({
        ...item,
        images: safeParseJSON(item.images, []),
      })),
    },
  });
});

function safeParseJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

module.exports = router;
