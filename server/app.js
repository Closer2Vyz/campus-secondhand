const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { getDB, initDB } = require('./db');

// 路由
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const orderRoutes = require('./routes/orders');
const announcementRoutes = require('./routes/announcements');
const favoriteRoutes = require('./routes/favorites');
const commentRoutes = require('./routes/comments');
const ratingRoutes = require('./routes/ratings');
const subscribeRoutes = require('./routes/subscribe');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件：上传的图片 + 前端页面
var uploadDir = path.isAbsolute(config.upload.dir) ? config.upload.dir : path.join(__dirname, config.upload.dir);
app.use('/uploads', express.static(uploadDir));
app.use(express.static(path.join(__dirname, 'public')));

// 前端页面入口
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/subscribe', subscribeRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok', time: new Date().toISOString() });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.json({ code: 400, message: '图片太大，单张不能超过 5MB' });
  }
  if (err.message && err.message.includes('不支持的文件格式')) {
    return res.json({ code: 400, message: err.message });
  }

  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

// 先初始化数据库，再启动服务
initDB().then(() => {
  app.listen(config.port, '0.0.0.0', () => {
  console.log(`🏫 校内二手交易平台 API 已启动`);
  console.log(`   http://0.0.0.0:${config.port}  (局域网: http://192.168.1.103:${config.port})`);
  console.log(`   当前免费使用中`);
  console.log(`   数据库: ${path.join(__dirname, 'data.db')}`);
  });
}).catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});
