var api = require('../../utils/api');
var util = require('../../utils/util');

Page({
  data: {
    darkMode: false,
    order: {},
    serverURL: '',
    isBuyer: false,
    isSeller: false,
    statusIcon: '',
    statusTitle: '',
    statusDesc: '',
    showRating: false,
    ratingScore: 5,
    ratingContent: '',
  },

  onLoad: function(options) {
    var dark = wx.getStorageSync('darkMode');
    this.setData({ darkMode: !!dark });
    if (options.id) {
      this.loadOrder(options.id);
    }
  },

  loadOrder: function(id) {
    var that = this;

    Promise.all([
      api.getMyOrders(),
      api.getSoldOrders(),
    ]).then(function(results) {
      var myOrders = results[0].list;
      var soldOrders = results[1].list;

      var order = null;
      for (var i = 0; i < myOrders.length; i++) {
        if (myOrders[i].id == id) { order = myOrders[i]; break; }
      }
      if (!order) {
        for (var i = 0; i < soldOrders.length; i++) {
          if (soldOrders[i].id == id) { order = soldOrders[i]; break; }
        }
      }

      if (!order) {
        wx.showToast({ title: '订单不存在', icon: 'none' });
        return;
      }

      var app = getApp();
      var userId = (app && app.globalData && app.globalData.userInfo) ? app.globalData.userInfo.id : null;

      var statusIcon = order.status === 'pending' ? '⏳' : order.status === 'completed' ? '✅' : '❌';
      var statusTitle = order.status === 'pending' ? '等待自提' : order.status === 'completed' ? '交易完成' : '已取消';
      var statusDesc = order.status === 'pending' ? '请联系卖家，按时到约定地点自提' : order.status === 'completed' ? '感谢使用校内好物圈' : '订单已取消';

      that.setData({
        order: order,
        isBuyer: order.buyerId === userId,
        isSeller: order.sellerId === userId,
        statusIcon: statusIcon,
        statusTitle: statusTitle,
        statusDesc: statusDesc,
      });
    }).catch(function(err) {
      wx.showToast({ title: err || '加载失败', icon: 'none' });
    });
  },

  onConfirmPickup: function() {
    var that = this;
    wx.showModal({
      title: '确认自提',
      content: '对方已取走？确认完成',
      success: function(res) {
        if (res.confirm) {
          api.confirmPickup(that.data.order.id).then(function() {
            wx.showToast({ title: '交易完成！', icon: 'success' });
            that.loadOrder(that.data.order.id);
          }).catch(function(err) {
            wx.showToast({ title: err, icon: 'none' });
          });
        }
      },
    });
  },

  onCancelOrder: function() {
    var that = this;
    wx.showModal({
      title: '取消订单',
      content: '下单超过30分钟将无法取消',
      success: function(res) {
        if (res.confirm) {
          api.cancelOrder(that.data.order.id).then(function() {
            wx.showToast({ title: '已取消', icon: 'success' });
            that.loadOrder(that.data.order.id);
          }).catch(function(err) {
            wx.showToast({ title: err, icon: 'none' });
          });
        }
      },
    });
  },

  onRate: function() {
    this.setData({ showRating: true, ratingScore: 5, ratingContent: '' });
  },

  onRatingScore: function(e) {
    this.setData({ ratingScore: parseInt(e.currentTarget.dataset.score) || 5 });
  },

  onRatingInput: function(e) {
    this.setData({ ratingContent: e.detail.value });
  },

  onSubmitRating: function() {
    var that = this;
    api.submitRating(this.data.order.id, this.data.ratingScore, this.data.ratingContent).then(function() {
      that.setData({ showRating: false });
      wx.showToast({ title: '评价成功', icon: 'success' });
    }).catch(function(err) {
      wx.showToast({ title: err || '评价失败', icon: 'none' });
    });
  },

  onCancelRating: function() {
    this.setData({ showRating: false });
  },

  formatPrice: function(p) { return util.formatPrice(p); },
  formatTime: function(t) { return util.formatTime(t); },
});
