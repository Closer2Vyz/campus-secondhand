/**
 * 平台配置
 */
module.exports = {
  // 服务端口
  port: 3000,

  // JWT 密钥
  jwtSecret: 'campus-secondhand-jwt-secret-2025',

  // 微信小程序配置（去 mp.weixin.qq.com → 开发管理 → 开发设置 获取）
  wx: {
    appid: 'wxd0d9102504a858c0',
    secret: 'c7263e64e5fe07c0c4613a19591057b5',
  },

  // 图片上传配置
  upload: {
    dir: 'uploads',
    maxCount: 6,           // 每件商品最多 6 张图
    maxSize: 5 * 1024 * 1024, // 单张 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },

  // 分页
  pageSize: 20,

  // 商品分类
  categories: ['全部', '教材', '数码', '生活', '体育', '其他', '虚拟物品'],
};
