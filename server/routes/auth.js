const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const https = require('https');
const crypto = require('crypto');
const config = require('../config');
const { getDB } = require('../db');
const authMiddleware = require('../middleware/auth');

// 头像上传配置
const avatarStorage = multer.diskStorage({
  destination: path.join(__dirname, '..', config.upload.dir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `avatar_${uuidv4()}${ext}`);
  },
});
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式'));
    }
  },
});

/**
 * POST /api/auth/login
 * 微信登录：用 code 换取 openid（开发阶段支持模拟登录）
 * Body: { code: "xxx" }  或  { mockOpenid: "test001", nickname: "测试用户" }
 */
router.post('/login', (req, res) => {
  const { code, mockOpenid, nickname } = req.body;
  let openid;

  if (mockOpenid) {
    // 开发/演示模式：模拟登录
    openid = mockOpenid;
  } else if (code) {
    // 如果配置了真实 AppSecret，调微信接口
    if (config.wx && config.wx.secret && config.wx.secret !== '你的AppSecret') {
      var url = 'https://api.weixin.qq.com/sns/jscode2session?appid=' + config.wx.appid + '&secret=' + config.wx.secret + '&js_code=' + code + '&grant_type=authorization_code';
      try {
        var wxRes = JSON.parse(require('child_process').execSync('curl -s "' + url + '"').toString());
        if (wxRes.openid) {
          openid = wxRes.openid;
        } else {
          return res.json({ code: 400, message: '微信登录失败: ' + (wxRes.errmsg || '未知错误') });
        }
      } catch (e) {
        return res.json({ code: 500, message: '微信登录请求失败' });
      }
    } else {
      // 开发阶段用 code 作为 openid 前缀
      openid = 'dev_' + code;
    }
  } else {
    return res.json({ code: 400, message: '缺少登录凭证' });
  }

  const db = getDB();

  // 查找或创建用户
  let user = db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);
  if (!user) {
    const info = db.prepare(
      'INSERT INTO users (openid, nickname) VALUES (?, ?)'
    ).run(openid, nickname || '用户_' + openid.slice(-4));
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  }

  // 生成 JWT
  const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });

  res.json({
    code: 0,
    data: {
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        campus: user.campus,
      },
    },
  });
});

/**
 * GET /api/auth/me
 * 获取当前登录用户信息
 */
router.get('/me', authMiddleware, (req, res) => {
  const db = getDB();
  const user = db.prepare('SELECT id, nickname, avatar, phone, campus, createdAt FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.json({ code: 404, message: '用户不存在' });
  res.json({ code: 0, data: user });
});

/**
 * PUT /api/auth/profile
 * 更新个人资料（手机号、校区）
 */
router.put('/profile', authMiddleware, (req, res) => {
  const { phone, campus, nickname } = req.body;
  const db = getDB();
  const updates = [];
  const params = [];

  if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
  if (campus !== undefined) { updates.push('campus = ?'); params.push(campus); }
  if (nickname !== undefined) { updates.push('nickname = ?'); params.push(nickname); }

  if (updates.length === 0) {
    return res.json({ code: 400, message: '没有需要更新的字段' });
  }

  params.push(req.userId);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const user = db.prepare('SELECT id, nickname, avatar, phone, campus, createdAt FROM users WHERE id = ?').get(req.userId);
  res.json({ code: 0, data: user });
});

/**
 * POST /api/auth/avatar
 * 上传头像
 */
router.post('/avatar', authMiddleware, uploadAvatar.single('avatar'), (req, res) => {
  if (!req.file) return res.json({ code: 400, message: '请选择图片' });

  const avatarPath = '/uploads/' + req.file.filename;
  const db = getDB();
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatarPath, req.userId);

  res.json({ code: 0, data: { avatar: avatarPath }, message: '头像已更新' });
});

/**
 * POST /api/auth/register
 * 账号密码注册
 */
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || password.length < 3) {
    return res.json({ code: 400, message: '用户名和密码不符合要求' });
  }
  const db = getDB();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.json({ code: 400, message: '用户名已存在' });

  const hashed = crypto.createHash('sha256').update(password).digest('hex');
  const info = db.prepare(
    'INSERT INTO users (openid, nickname, username, password) VALUES (?, ?, ?, ?)'
  ).run('web_' + username, username, username, hashed);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });

  res.json({
    code: 0, data: {
      token,
      user: { id: user.id, nickname: user.nickname, avatar: user.avatar || '', phone: user.phone || '', campus: user.campus || '' },
    }, message: '注册成功',
  });
});

/**
 * POST /api/auth/login-password
 * 账号密码登录
 */
router.post('/login-password', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ code: 400, message: '请输入用户名和密码' });

  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.json({ code: 400, message: '用户名或密码错误' });

  const hashed = crypto.createHash('sha256').update(password).digest('hex');
  if (user.password !== hashed) return res.json({ code: 400, message: '用户名或密码错误' });

  const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });

  res.json({
    code: 0, data: {
      token,
      user: { id: user.id, nickname: user.nickname, avatar: user.avatar || '', phone: user.phone || '', campus: user.campus || '' },
    },
  });
});

module.exports = router;
