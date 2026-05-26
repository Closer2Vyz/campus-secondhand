const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const authMiddleware = require('../middleware/auth');
const config = require('../config');

/**
 * POST /api/subscribe
 * 保存用户订阅记录
 */
router.post('/', authMiddleware, (req, res) => {
  const { templateId } = req.body;
  if (!templateId) return res.json({ code: 400, message: '缺少模板ID' });

  const db = getDB();
  db.prepare(
    'INSERT INTO subscriptions (userId, templateId) VALUES (?, ?)'
  ).run(req.userId, templateId);

  res.json({ code: 0, message: '订阅成功' });
});

module.exports = router;
