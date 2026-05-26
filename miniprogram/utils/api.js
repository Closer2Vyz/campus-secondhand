const CONFIG = require('./config');

/**
 * 封装 wx.request 为 Promise
 * 自动携带 token
 * 注意：getApp() 放入函数内调用，避免 lazyCodeLoading 下模块加载时序问题
 */
function request(method, path, data) {
  var app = getApp();
  var token = (app && app.globalData && app.globalData.token) || wx.getStorageSync('token') || '';

  return new Promise((resolve, reject) => {
    wx.request({
      url: CONFIG.baseURL + path,
      method: method,
      data: data,
      timeout: 5000,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? 'Bearer ' + token : '',
      },
      success(res) {
        if (res.statusCode === 200) {
          if (res.data.code === 0) {
            resolve(res.data.data);
          } else {
            // token 过期
            if (res.data.code === 401) {
              wx.removeStorageSync('token');
              wx.removeStorageSync('userInfo');
              app.globalData.token = '';
              app.globalData.userInfo = null;
              wx.navigateTo({ url: '/pages/profile/profile' });
              wx.showToast({ title: '请重新登录', icon: 'none' });
            }
            reject(res.data.message || '请求失败');
          }
        } else {
          reject(`请求异常 (${res.statusCode})`);
        }
      },
      fail(err) {
        reject('网络异常，请检查网络连接');
      },
    });
  });
}

module.exports = {
  // 认证
  login(code, mockOpenid, nickname) {
    return request('POST', '/api/auth/login', { code, mockOpenid, nickname });
  },
  getProfile() {
    return request('GET', '/api/auth/me');
  },
  updateProfile(data) {
    return request('PUT', '/api/auth/profile', data);
  },
  uploadAvatar(filePath) {
    var app = getApp();
    var token = (app && app.globalData && app.globalData.token) || wx.getStorageSync('token') || '';
    return new Promise(function(resolve, reject) {
      wx.uploadFile({
        url: CONFIG.baseURL + '/api/auth/avatar',
        filePath: filePath,
        name: 'avatar',
        header: { 'Authorization': 'Bearer ' + token },
        success: function(res) {
          try {
            var data = JSON.parse(res.data);
            if (data.code === 0) resolve(data.data);
            else reject(data.message);
          } catch (e) { reject('上传失败'); }
        },
        fail: function() { reject('网络异常'); },
      });
    });
  },

  // 商品
  getItems(params) {
    return request('GET', '/api/items?' + objToQuery(params));
  },
  getItemDetail(id) {
    return request('GET', `/api/items/${id}`);
  },
  publishItem(data) {
    return request('POST', '/api/items', data);
  },
  getMyItems(status) {
    let query = status ? `?status=${status}` : '';
    return request('GET', `/api/items/my${query}`);
  },
  deleteItem(id) {
    return request('DELETE', `/api/items/${id}`);
  },

  // 评价
  getSellerInfo(sellerId) {
    return request('GET', `/api/ratings/seller/${sellerId}/info`);
  },
  submitRating(orderId, score, content) {
    return request('POST', '/api/ratings', { orderId, score, content });
  },

  // 订阅
  subscribe(templateId) {
    return request('POST', '/api/subscribe', { templateId });
  },

  // 评论
  getComments(itemId) {
    return request('GET', `/api/comments/${itemId}`);
  },
  postComment(itemId, content) {
    return request('POST', `/api/comments/${itemId}`, { content });
  },

  // 收藏
  toggleFavorite(itemId) {
    return request('POST', '/api/favorites/toggle', { itemId });
  },
  checkFavorite(itemId) {
    return request('GET', `/api/favorites/check/${itemId}`);
  },
  getMyFavorites() {
    return request('GET', '/api/favorites/my');
  },

  // 公告
  getLatestAnnouncement() {
    return request('GET', '/api/announcements/latest');
  },

  // 订单
  createOrder(data) {
    return request('POST', '/api/orders', data);
  },
  getMyOrders(status) {
    let query = status ? `?status=${status}` : '';
    return request('GET', `/api/orders/my${query}`);
  },
  getSoldOrders(status) {
    let query = status ? `?status=${status}` : '';
    return request('GET', `/api/orders/sold${query}`);
  },
  confirmPickup(orderId) {
    return request('PUT', `/api/orders/${orderId}/pickup`);
  },
  cancelOrder(orderId) {
    return request('PUT', `/api/orders/${orderId}/cancel`);
  },
};

function objToQuery(obj) {
  return Object.entries(obj)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
}
