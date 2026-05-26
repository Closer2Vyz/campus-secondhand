#!/usr/bin/env node
/**
 * 管理工具
 * 用法: node scripts/admin.js <command> [args]
 *
 * 命令:
 *   announce "标题" "内容"    — 发布新公告
 *   qr /path/to/图片          — 更新反馈群二维码
 *   restart                   — 重启后端服务
 */
const { execSync } = require('child_process');
const path = require('path');

const cmd = process.argv[2];

switch (cmd) {
  case 'announce':
    require('./announce.js');
    break;

  case 'qr':
    require('./update-qr.js');
    break;

  case 'restart':
    console.log('🔄 杀掉旧进程...');
    try { execSync('kill $(lsof -ti:3000) 2>/dev/null', { stdio: 'ignore' }); } catch (e) {}
    console.log('🚀 启动新进程...');
    const child = require('child_process').spawn('node', [path.join(__dirname, '..', 'server', 'app.js')], {
      cwd: path.join(__dirname, '..', 'server'),
      stdio: 'inherit',
      detached: true,
    });
    child.unref();
    setTimeout(() => console.log('✅ 已重启'), 1000);
    break;

  default:
    console.log(`
📦 校内二手集市 - 管理工具

  用法:
    node scripts/admin.js announce "标题" "内容"   发布公告
    node scripts/admin.js qr /path/to/图片         更新二维码
    node scripts/admin.js restart                   重启后端
`);
    break;
}
