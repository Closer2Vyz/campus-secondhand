#!/usr/bin/env node
/**
 * 更新反馈群二维码
 * 用法: node scripts/update-qr.js /path/to/新二维码.jpg
 */
const fs = require('fs');
const path = require('path');

// 如果没有传参，尝试从剪贴板/默认路径取
const src = process.argv[2];
const dest = path.join(__dirname, '..', 'miniprogram', 'assets', 'qr-feedback.png');

if (!src) {
  console.log('❌ 用法: node scripts/update-qr.js /path/to/二维码图片');
  process.exit(1);
}

if (!fs.existsSync(src)) {
  console.log('❌ 文件不存在:', src);
  process.exit(1);
}

fs.copyFileSync(src, dest);
console.log(`✅ 二维码已更新: ${dest}`);
console.log(`   大小: ${(fs.statSync(dest).size / 1024).toFixed(1)}KB`);
