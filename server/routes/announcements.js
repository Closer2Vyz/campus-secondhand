const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

/**
 * GET /api/announcements/latest
 * 获取最新一条公告
 */
router.get('/latest', (req, res) => {
  const db = getDB();
  const announcement = db.prepare(
    'SELECT id, title, content, createdAt FROM announcements ORDER BY id DESC LIMIT 1'
  ).get();

  res.json({
    code: 0,
    data: announcement || null,
  });
});

module.exports = router;
