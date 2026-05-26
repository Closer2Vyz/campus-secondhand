/**
 * 云开发 API 封装
 * 所有接口改为调用云函数
 */

function call(functionName, action, data) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: functionName,
      data: { action, data },
      success: (res) => {
        if (res.result.code === 0) {
          resolve(res.result.data);
        } else {
          reject(res.result.message || '请求失败');
        }
      },
      fail: (err) => {
        reject('网络异常');
      },
    });
  });
}

module.exports = {
  // 认证
  login() {
    return call('login', 'login');
  },
  getProfile() {
    return call('misc', 'getProfile');
  },
  updateProfile(data) {
    return call('misc', 'updateProfile', data);
  },

  // 商品
  getItems(params) {
    return call('items', 'getItems', params);
  },
  getItemDetail(id) {
    return call('items', 'getItemDetail', { id });
  },
  publishItem(data) {
    return call('items', 'createItem', data);
  },
  getMyItems(status) {
    return call('items', 'getMyItems', { status });
  },
  deleteItem(id) {
    return call('items', 'deleteItem', { id });
  },

  // 订单
  createOrder(data) {
    return call('orders', 'createOrder', data);
  },
  getMyOrders() {
    return call('orders', 'getMyOrders');
  },
  getSoldOrders() {
    return call('orders', 'getSoldOrders');
  },
  confirmPickup(orderId) {
    return call('orders', 'confirmPickup', { id: orderId });
  },
  cancelOrder(orderId) {
    return call('orders', 'cancelOrder', { id: orderId });
  },

  // 评论
  getComments(itemId) {
    return call('misc', 'getComments', { itemId });
  },
  postComment(itemId, content) {
    return call('misc', 'postComment', { itemId, content });
  },

  // 收藏
  toggleFavorite(itemId) {
    return call('misc', 'toggleFavorite', { itemId });
  },
  checkFavorite(itemId) {
    return call('misc', 'checkFavorite', { itemId });
  },
  getMyFavorites() {
    return call('misc', 'getMyFavorites');
  },

  // 评价
  getSellerInfo(sellerId) {
    return call('misc', 'getSellerInfo', { sellerId });
  },
  submitRating(orderId, score, content) {
    return call('misc', 'submitRating', { orderId, score, content });
  },

  // 公告
  getLatestAnnouncement() {
    return call('misc', 'getLatestAnnouncement');
  },

  // 订阅
  subscribe(templateId) {
    return call('misc', 'subscribe', { templateId });
  },

  // 上传文件到云存储
  uploadFile(filePath) {
    return new Promise((resolve, reject) => {
      wx.cloud.uploadFile({
        cloudPath: 'uploads/' + Date.now() + '.jpg',
        filePath,
        success: (res) => resolve({ fileID: res.fileID }),
        fail: () => reject('上传失败'),
      });
    });
  },
};
