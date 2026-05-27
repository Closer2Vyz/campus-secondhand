/**
 * 工具函数
 */

// 格式化时间 (iOS 兼容)
function formatTime(dateStr) {
  if (!dateStr) return '';
  // iOS 不支持 "2026-05-26 10:58:41" 空格格式
  var d = new Date(dateStr.replace(' ', 'T'));
  var month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hour}:${min}`;
}

// 格式化价格
function formatPrice(price) {
  return '🍞' + Number(price).toFixed(2);
}

// 订单状态中文
function orderStatusText(status) {
  const map = {
    pending: '待自提',
    completed: '已完成',
    cancelled: '已取消',
  };
  return map[status] || status;
}

// 商品状态中文
function itemStatusText(status) {
  const map = {
    active: '在售',
    sold: '已售',
    inactive: '已下架',
  };
  return map[status] || status;
}

module.exports = {
  formatTime,
  formatPrice,
  orderStatusText,
  itemStatusText,
};
