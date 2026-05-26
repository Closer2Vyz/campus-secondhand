const express = require('express');
const router = express.Router();
const config = require('../config');
const { getDB } = require('../db');
const authMiddleware = require('../middleware/auth');

/**
 * POST /api/orders
 * 创建订单（买家下单）
 * Body: { itemId, pickupTime, pickupLocation, contactPhone }
 */
router.post('/', authMiddleware, (req, res) => {
  const { itemId, pickupTime, pickupLocation, contactPhone } = req.body;
  const db = getDB();

  // 校验商品
  const item = db.prepare("SELECT * FROM items WHERE id = ? AND status = 'active'").get(itemId);
  if (!item) {
    return res.json({ code: 400, message: '商品不存在或已下架' });
  }
  if (item.sellerId === req.userId) {
    return res.json({ code: 400, message: '不能购买自己的商品' });
  }

  if (!pickupTime) {
    return res.json({ code: 400, message: '请选择自提时间' });
  }

  // 计算费用（当前免费）
  const itemPrice = item.price;
  const serviceFee = 0;
  const totalPrice = itemPrice;

  const info = db.prepare(
    `INSERT INTO orders (itemId, buyerId, sellerId, itemPrice, serviceFee, totalPrice, pickupTime, pickupLocation, contactPhone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(itemId, req.userId, item.sellerId, itemPrice, serviceFee, totalPrice, pickupTime, pickupLocation || '', contactPhone || '');

  var order = db.prepare('SELECT * FROM orders WHERE id = ?').get(info.lastInsertRowid);
  var itemContact = db.prepare('SELECT contact FROM items WHERE id = ?').get(itemId);
  order.itemContact = itemContact ? (itemContact.contact || '') : '';

  res.json({ code: 0, data: order, message: '下单成功！' });
});

/**
 * GET /api/orders/my
 * 我的订单（买家视角）
 */
router.get('/my', authMiddleware, (req, res) => {
  const db = getDB();
  const status = req.query.status; // 可选筛选

  let where = 'o.buyerId = ?';
  const params = [req.userId];

  if (status) {
    where += ' AND o.status = ?';
    params.push(status);
  }

  const orders = db.prepare(
    `SELECT o.*, i.title as itemTitle, i.images as itemImages, i.price as itemPrice, i.contact as itemContact,
            u.nickname as sellerName, u.phone as sellerPhone
     FROM orders o
     JOIN items i ON o.itemId = i.id
     JOIN users u ON o.sellerId = u.id
     WHERE ${where}
     ORDER BY o.createdAt DESC`
  ).all(...params);

  const list = orders.map(o => ({
    ...o,
    itemImages: safeParseJSON(o.itemImages, []),
  }));

  res.json({ code: 0, data: { list } });
});

/**
 * GET /api/orders/sold
 * 我卖出的（卖家视角）
 */
router.get('/sold', authMiddleware, (req, res) => {
  const db = getDB();
  const status = req.query.status;

  let where = 'o.sellerId = ?';
  const params = [req.userId];

  if (status) {
    where += ' AND o.status = ?';
    params.push(status);
  }

  const orders = db.prepare(
    `SELECT o.*, i.title as itemTitle, i.images as itemImages, i.contact as itemContact,
            u.nickname as buyerName, u.phone as buyerPhone
     FROM orders o
     JOIN items i ON o.itemId = i.id
     JOIN users u ON o.buyerId = u.id
     WHERE ${where}
     ORDER BY o.createdAt DESC`
  ).all(...params);

  const list = orders.map(o => ({
    ...o,
    itemImages: safeParseJSON(o.itemImages, []),
  }));

  res.json({ code: 0, data: { list } });
});

/**
 * PUT /api/orders/:id/pickup
 * 确认已自提（卖家操作）
 */
router.put('/:id/pickup', authMiddleware, (req, res) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

  if (!order) return res.json({ code: 404, message: '订单不存在' });
  if (order.sellerId !== req.userId) return res.json({ code: 403, message: '只有卖家可以确认自提' });
  if (order.status !== 'pending') return res.json({ code: 400, message: '订单状态不正确' });

  db.prepare(
    "UPDATE orders SET status = 'completed', completedAt = datetime('now','localtime') WHERE id = ?"
  ).run(req.params.id);

  res.json({ code: 0, message: '已确认自提，交易完成！' });
});

/**
 * PUT /api/orders/:id/cancel
 * 取消订单（买家操作，30分钟内可取消）
 */
router.put('/:id/cancel', authMiddleware, (req, res) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

  if (!order) return res.json({ code: 404, message: '订单不存在' });
  if (order.buyerId !== req.userId) return res.json({ code: 403, message: '只有买家可以取消订单' });
  if (order.status !== 'pending') return res.json({ code: 400, message: '订单已处理，无法取消' });

  // 检查是否超过 30 分钟
  const createdAt = new Date(order.createdAt + 'Z');
  const now = new Date();
  const diffMs = now - createdAt;
  if (diffMs > 30 * 60 * 1000) {
    return res.json({ code: 400, message: '下单超过30分钟，无法取消，请联系卖家' });
  }

  db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(req.params.id);

  res.json({ code: 0, message: '订单已取消' });
});

function safeParseJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

module.exports = router;
