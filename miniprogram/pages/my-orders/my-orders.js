var api = require('../../utils/api');
var CONFIG = require('../../utils/config');
var util = require('../../utils/util');

Page({
  data: {
    orders: [],
    activeTab: 'buy',
    darkMode: false,
    serverURL: CONFIG.baseURL,
  },

  onShow: function() {
    var dark = wx.getStorageSync('darkMode');
    this.setData({ darkMode: !!dark });
    this.loadOrders();
  },

  switchTab: function(e) {
    var tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;
    var that = this;
    // 卖家切换到"我卖出的"时，请求订阅新订单通知
    if (tab === 'sell') {
      wx.requestSubscribeMessage({
        tmplIds: ['6Swwz0hqtQRiZUEGThli_ciP-g_qqtZD0FsrgbZehgc'],
        success: function(res) {
          if (res['6Swwz0hqtQRiZUEGThli_ciP-g_qqtZD0FsrgbZehgc'] === 'accept') {
            api.subscribe('6Swwz0hqtQRiZUEGThli_ciP-g_qqtZD0FsrgbZehgc');
          }
        },
        fail: function() {},
      });
    }
    this.setData({ activeTab: tab }, function() {
      that.loadOrders();
    });
  },

  loadOrders: function() {
    var that = this;
    var tab = this.data.activeTab;
    var promise = tab === 'buy' ? api.getMyOrders() : api.getSoldOrders();

    promise.then(function(res) {
      that.setData({ orders: res.list });
    }).catch(function(err) {
      console.error(err);
    });
  },

  onOrderTap: function(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + id });
  },

  formatPrice: function(p) { return util.formatPrice(p); },
  formatTime: function(t) { return util.formatTime(t); },
  orderStatusText: function(s) { return util.orderStatusText(s); },
});
