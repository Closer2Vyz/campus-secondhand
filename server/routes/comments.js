const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const authMiddleware = require('../middleware/auth');

/**
 * GET /api/comments/:itemId
 * 获取商品评论列表
 */
router.get('/:itemId', (req, res) => {
  const db = getDB();
  const comments = db.prepare(
    `SELECT c.id, c.content, c.createdAt, u.nickname as userName, u.avatar as userAvatar
     FROM comments c
     JOIN users u ON c.userId = u.id
     WHERE c.itemId = ?
     ORDER BY c.createdAt ASC`
  ).all(req.params.itemId);

  res.json({ code: 0, data: { list: comments } });
});

/**
 * POST /api/comments/:itemId
 * 发表评论（需登录）
 */
router.post('/:itemId', authMiddleware, (req, res) => {
  const { content } = req.body;
  if (!content || content.trim().length === 0) {
    return res.json({ code: 400, message: '请输入评论内容' });
  }

  const db = getDB();
  const info = db.prepare(
    'INSERT INTO comments (itemId, userId, content) VALUES (?, ?, ?)'
  ).run(req.params.itemId, req.userId, content.trim());

  const comment = db.prepare(
    `SELECT c.id, c.content, c.createdAt, u.nickname as userName, u.avatar as userAvatar
     FROM comments c
     JOIN users u ON c.userId = u.id
     WHERE c.id = ?`
  ).get(info.lastInsertRowid);

  res.json({ code: 0, data: comment, message: '评论成功' });
});

module.exports = router;
