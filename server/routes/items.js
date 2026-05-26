const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { getDB } = require('../db');
const authMiddleware = require('../middleware/auth');

// 图片上传配置
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', config.upload.dir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxSize },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式，请上传 JPG/PNG/WebP'));
    }
  },
});

/**
 * GET /api/items
 * 商品列表（分页、分类筛选、关键词搜索）
 * Query: page, category, keyword
 */
router.get('/', (req, res) => {
  const db = getDB();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const category = req.query.category || '全部';
  const keyword = req.query.keyword || '';
  const sort = req.query.sort || 'time_desc';
  const limit = config.pageSize;
  const offset = (page - 1) * limit;

  let where = "i.status = 'active'";
  const params = [];

  if (category && category !== '全部') {
    where += ' AND i.category = ?';
    params.push(category);
  }
  if (keyword) {
    where += ' AND (i.title LIKE ? OR i.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  var orderBy = 'i.createdAt DESC';
  if (sort === 'price_asc') orderBy = 'i.price ASC';
  if (sort === 'price_desc') orderBy = 'i.price DESC';

  const countRow = db.prepare(
    `SELECT COUNT(*) as total FROM items i WHERE ${where}`
  ).get(...params);

  const items = db.prepare(
    `SELECT i.*, u.nickname as sellerName, u.avatar as sellerAvatar
     FROM items i
     JOIN users u ON i.sellerId = u.id
     WHERE ${where}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  // 解析 images JSON
  const list = items.map(item => ({
    ...item,
    images: safeParseJSON(item.images, []),
  }));

  res.json({
    code: 0,
    data: {
      list,
      total: countRow.total,
      page,
      totalPages: Math.ceil(countRow.total / limit),
    },
  });
});

/**
 * GET /api/items/my
 * 我发布的商品（需登录）
 * Query: status (active/sold/inactive)
 */
router.get('/my', authMiddleware, (req, res) => {
  const db = getDB();
  const status = req.query.status;
  let where = 'sellerId = ?';
  const params = [req.userId];

  if (status) {
    where += ' AND status = ?';
    params.push(status);
  }

  const items = db.prepare(
    `SELECT * FROM items WHERE ${where} ORDER BY createdAt DESC`
  ).all(...params);

  const list = items.map(item => ({
    ...item,
    images: safeParseJSON(item.images, []),
  }));

  res.json({ code: 0, data: { list } });
});

/**
 * GET /api/items/:id
 * 商品详情
 */
router.get('/:id', (req, res) => {
  const db = getDB();
  const item = db.prepare(
    `SELECT i.*, u.nickname as sellerName, u.avatar as sellerAvatar, u.campus as sellerCampus
     FROM items i
     JOIN users u ON i.sellerId = u.id
     WHERE i.id = ?`
  ).get(req.params.id);

  if (!item) return res.json({ code: 404, message: '商品不存在' });

  item.images = safeParseJSON(item.images, []);

  // 销量 = 已完成订单数
  const soldCount = db.prepare(
    "SELECT COUNT(*) as c FROM orders WHERE itemId = ? AND status = 'completed'"
  ).get(item.id);
  item.soldCount = soldCount ? soldCount.c : 0;

  // 隐藏联系方式，只对下单后的买家展示
  item.contact = '';

  res.json({ code: 0, data: item });
});

/**
 * POST /api/items
 * 发布商品（需登录）
 */
router.post('/', authMiddleware, upload.array('images', config.upload.maxCount), (req, res) => {
  const { title, description, price, category, stock, contact } = req.body;

  // 校验
  if (!title || title.trim().length === 0) {
    return res.json({ code: 400, message: '请输入商品标题' });
  }
  if (!price || isNaN(price) || Number(price) <= 0) {
    return res.json({ code: 400, message: '请输入有效价格' });
  }

  var itemStock = parseInt(stock) || 1;
  if (itemStock < 1) itemStock = 1;
  if (itemStock > 999) itemStock = 999;

  const images = (req.files || []).map(f => `/uploads/${f.filename}`);

  const db = getDB();
  const info = db.prepare(
    `INSERT INTO items (sellerId, title, description, price, images, category, stock, contact)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(req.userId, title.trim(), (description || '').trim(), Number(price), JSON.stringify(images), category || '其他', itemStock, (contact || '').trim());

  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(info.lastInsertRowid);
  item.images = safeParseJSON(item.images, []);

  res.json({ code: 0, data: item, message: '发布成功' });
});

/**
 * PUT /api/items/:id
 * 编辑商品（仅卖家）
 */
router.put('/:id', authMiddleware, upload.array('images', config.upload.maxCount), (req, res) => {
  const db = getDB();
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);

  if (!item) return res.json({ code: 404, message: '商品不存在' });
  if (item.sellerId !== req.userId) return res.json({ code: 403, message: '无权操作' });
  if (item.status === 'sold') return res.json({ code: 400, message: '商品已售，不可编辑' });

  const { title, description, price, category, existingImages } = req.body;
  const newImages = (req.files || []).map(f => `/uploads/${f.filename}`);

  // 保留已有的图片 + 新上传的
  let finalImages = [];
  if (existingImages) {
    try {
      finalImages = JSON.parse(existingImages);
    } catch { /* ignore */ }
  }
  finalImages = [...finalImages, ...newImages];

  db.prepare(
    `UPDATE items SET title = ?, description = ?, price = ?, images = ?, category = ?, updatedAt = datetime('now','localtime')
     WHERE id = ?`
  ).run(
    title || item.title,
    (description !== undefined ? description : item.description),
    price ? Number(price) : item.price,
    JSON.stringify(finalImages),
    category || item.category,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  updated.images = safeParseJSON(updated.images, []);

  res.json({ code: 0, data: updated });
});

/**
 * DELETE /api/items/:id
 * 下架商品（仅卖家）
 */
router.delete('/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);

  if (!item) return res.json({ code: 404, message: '商品不存在' });
  if (item.sellerId !== req.userId) return res.json({ code: 403, message: '无权操作' });

  db.prepare("UPDATE items SET status = 'sold', updatedAt = datetime('now','localtime') WHERE id = ?").run(req.params.id);

  res.json({ code: 0, message: '已下架' });
});

/**
 * GET /api/items/:id/orders
 * 查看某商品的订单状态（卖家用）
 */
router.get('/:id/orders', authMiddleware, (req, res) => {
  const db = getDB();
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!item) return res.json({ code: 404, message: '商品不存在' });

  const orders = db.prepare(
    `SELECT o.*, u.nickname as buyerName, u.avatar as buyerAvatar
     FROM orders o
     JOIN users u ON o.buyerId = u.id
     WHERE o.itemId = ?`
  ).all(req.params.id);

  res.json({ code: 0, data: { list: orders } });
});

function safeParseJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

module.exports = router;
