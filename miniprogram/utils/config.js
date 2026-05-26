/**
 * API 配置
 *
 * 模拟器 → http://localhost:3000
 * 真机调试 → 改为电脑当前局域网 IP（可在终端输入 ifconfig | grep inet 查看）
 * 预览/生产 → 改为已备案的 HTTPS 域名
 */
const CONFIG = {
  baseURL: 'https://campus-secondhand-production-023e.up.railway.app',
};

module.exports = CONFIG;
