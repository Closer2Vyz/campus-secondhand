var api = require('../../utils/api');
var CONFIG = require('../../utils/config');
var util = require('../../utils/util');

Page({
  data: {
    pageLoaded: false,
    loadFailed: false,
    hasImages: false,
    localImages: [],
    itemId: 0,
    stockText: '',
    darkMode: false,
    item: {},
    serverURL: CONFIG.baseURL,
    priceText: '',
    timeText: '',
    descText: '',
    sellerChar: '?',
    isFavorited: false,
    comments: [],
    commentText: '',
    showContactModal: false,
    sellerContact: '',
    showOrderModal: false,
    pickupDate: '',
    pickupTime: '',
    pickupLocation: '',
    contactPhone: '',
  },

  onLoad: function(options) {
    var dark = wx.getStorageSync('darkMode');
    this.setData({ darkMode: !!dark });
    var id = options && options.id;
    this.setData({ itemId: id || 0 });
    if (id) {
      this.loadItem(id);
    } else {
      this.setData({ pageLoaded: true, loadFailed: true });
      wx.showToast({ title: '商品ID缺失', icon: 'none' });
    }
  },

  loadItem: function(id) {
    var that = this;
    this.setData({ pageLoaded: false, loadFailed: false });

    api.getItemDetail(id).then(function(item) {
      if (!item) {
        that.setData({ loadFailed: true, pageLoaded: true });
        return;
      }

      // 检查是否已收藏
      var app = getApp();
      if (app && app.globalData && app.globalData.token) {
        api.checkFavorite(item.id).then(function(res) {
          if (res.favorited) that.setData({ isFavorited: true });
        }).catch(function() {});
      }

      // 预下载商品图片到手机本地（真机调试图片不走代理，需 wx.downloadFile）
      var localImages = [];
      var images = item.images || [];
      var loaded = 0;

      // 加载评论
      that.loadComments(id);

      function setPageData() {
        that.setData({
          item: item,
          pageLoaded: true,
          loadFailed: false,
          hasImages: localImages.length > 0,
          localImages: localImages,
          sellerChar: (item.sellerName || '?').substring(0, 1),
          priceText: '¥' + Number(item.price).toFixed(2),
          timeText: util.formatTime(item.createdAt),
          descText: item.description || '',
          stockText: that.getStockText(item),
        });
      }

      if (images.length === 0) {
        setPageData();
        return;
      }

      for (var i = 0; i < images.length; i++) {
        (function(idx) {
          wx.downloadFile({
            url: CONFIG.baseURL + images[idx],
            success: function(res) {
              localImages[idx] = res.tempFilePath;
              loaded++;
              if (loaded >= images.length) setPageData();
            },
            fail: function() {
              localImages[idx] = CONFIG.baseURL + images[idx];
              loaded++;
              if (loaded >= images.length) setPageData();
            },
          });
        })(i);
      }
    }).catch(function() {
      that.setData({ loadFailed: true, pageLoaded: true });
    });
  },

  onBuy: function() {
    var app = getApp();
    if (!app || !app.globalData || !app.globalData.token) {
      wx.switchTab({ url: '/pages/profile/profile' });
      return;
    }
    this.setData({ showOrderModal: true });
  },

  onDateChange: function(e) {
    this.setData({ pickupDate: e.detail.value });
  },

  onTimeChange: function(e) {
    this.setData({ pickupTime: e.detail.value });
  },

  onLocationInput: function(e) {
    this.setData({ pickupLocation: e.detail.value });
  },

  onPhoneInput: function(e) {
    this.setData({ contactPhone: e.detail.value });
  },

  onSubmitOrder: function() {
    var that = this;
    var d = this.data.pickupDate;
    var t = this.data.pickupTime;
    var loc = this.data.pickupLocation;
    var phone = this.data.contactPhone;
    var item = this.data.item;

    if (!d || !t) {
      wx.showToast({ title: '请选择自提时间', icon: 'none' });
      return;
    }

    // 请求订阅
    wx.requestSubscribeMessage({
      tmplIds: ['6Swwz0hqtQRiZUEGThli_ciP-g_qqtZD0FsrgbZehgc'],
      success: function(res) {
        if (res['6Swwz0hqtQRiZUEGThli_ciP-g_qqtZD0FsrgbZehgc'] === 'accept') {
          api.subscribe('6Swwz0hqtQRiZUEGThli_ciP-g_qqtZD0FsrgbZehgc');
        }
      },
      fail: function() {},
    });

    api.createOrder({
      itemId: item.id,
      pickupTime: d + ' ' + t,
      pickupLocation: loc,
      contactPhone: phone,
    }).then(function(order) {
      var contact = order.itemContact || (item.contact || '');
      that.setData({
        showOrderModal: false,
        showContactModal: true,
        sellerContact: contact || (item.sellerName || '卖家') + ' —— 等待卖家联系你',
      });
    }).catch(function(err) {
      wx.showToast({ title: err || '下单失败', icon: 'none' });
    });
  },

  loadComments: function(itemId) {
    var that = this;
    api.getComments(itemId).then(function(res) {
      that.setData({ comments: res.list || [] });
    }).catch(function() {});
  },

  onCommentInput: function(e) {
    this.setData({ commentText: e.detail.value });
  },

  onPostComment: function() {
    var that = this;
    var text = this.data.commentText.trim();
    if (!text) {
      wx.showToast({ title: '请输入评论', icon: 'none' });
      return;
    }
    var app = getApp();
    if (!app || !app.globalData || !app.globalData.token) {
      wx.switchTab({ url: '/pages/profile/profile' });
      return;
    }
    api.postComment(this.data.item.id, text).then(function(comment) {
      var list = that.data.comments;
      list.push(comment);
      that.setData({ comments: list, commentText: '' });
      wx.showToast({ title: '评论成功', icon: 'success' });
    }).catch(function(err) {
      wx.showToast({ title: err || '评论失败', icon: 'none' });
    });
  },

  onGoToSeller: function() {
    var sellerId = this.data.item.sellerId;
    if (sellerId) {
      wx.navigateTo({ url: '/pages/seller/seller?id=' + sellerId });
    }
  },

  onToggleFavorite: function() {
    var that = this;
    var app = getApp();
    if (!app || !app.globalData || !app.globalData.token) {
      wx.switchTab({ url: '/pages/profile/profile' });
      return;
    }
    api.toggleFavorite(this.data.item.id).then(function(res) {
      that.setData({ isFavorited: res.favorited });
      wx.showToast({ title: res.favorited ? '❤️ 已收藏' : '已取消收藏', icon: 'success' });
    }).catch(function(err) {
      wx.showToast({ title: err || '操作失败', icon: 'none' });
    });
  },

  onPreviewImage: function(e) {
    var urls = [];
    var images = this.data.item.images || [];
    for (var i = 0; i < images.length; i++) {
      urls.push(this.data.serverURL + images[i]);
    }
    var idx = e.currentTarget.dataset.index || 0;
    wx.previewImage({ current: urls[idx], urls: urls });
  },

  getStockText: function(item) {
    var stock = item.stock || 1;
    if (stock <= 1) return '';
    var sold = item.soldCount || 0;
    return '已售 ' + sold + ' · 库存 ' + stock;
  },

  onCloseContact: function() {
    this.setData({ showContactModal: false });
  },

  onCopyContact: function() {
    wx.setClipboardData({
      data: this.data.sellerContact,
      success: function() { wx.showToast({ title: '已复制', icon: 'success' }); },
    });
  },

  onCancelOrder: function() {
    this.setData({ showOrderModal: false });
  },
});