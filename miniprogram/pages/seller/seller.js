var api = require('../../utils/api');
var CONFIG = require('../../utils/config');
var util = require('../../utils/util');

Page({
  data: {
    sellerId: 0,
    seller: {},
    items: [],
    pageLoaded: false,
    starsText: '☆☆☆☆☆',
    ratingText: '暂无评价',
    avatarChar: '?',
    avatarUrl: '',
    hasAvatar: false,
    joinedText: '',
  },

  onLoad: function(options) {
    var id = options && options.id;
    if (id) {
      this.setData({ sellerId: id });
      this.loadSeller(id);
    } else {
      wx.showToast({ title: '卖家ID缺失', icon: 'none' });
    }
  },

  loadSeller: function(id) {
    var that = this;
    api.getSellerInfo(id).then(function(data) {
      var user = data.user;
      var score = data.avgScore || 0;
      var full = Math.floor(score);
      var empty = 5 - full;

      var itemList = [];
      for (var i = 0; i < data.items.length; i++) {
        var item = data.items[i];
        itemList.push({
          id: item.id,
          title: item.title,
          priceText: util.formatPrice(item.price),
          firstImage: item.images && item.images.length > 0 ? CONFIG.baseURL + item.images[0] : '/assets/placeholder.png',
        });
      }

      var stars = '';
      for (var s = 0; s < full; s++) stars += '★';
      for (var s = 0; s < empty; s++) stars += '☆';

      that.setData({
        seller: {
          id: user.id,
          nickname: user.nickname || '匿名用户',
          avatar: user.avatar || '',
          campus: user.campus ? '📍 ' + user.campus : '',
        },
        items: itemList,
        pageLoaded: true,
        avatarChar: (user.nickname || '?').substring(0, 1),
        avatarUrl: user.avatar ? CONFIG.baseURL + user.avatar : '',
        hasAvatar: !!user.avatar,
        starsText: stars,
        ratingText: data.ratingCount + '条评价 · ' + score + '分',
        joinedText: that.fmtTime(user.createdAt),
      });
    }).catch(function() {
      that.setData({ pageLoaded: true });
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  onItemTap: function(e) {
    var id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: '/pages/item/item?id=' + id });
  },

  fmtTime: function(t) {
    if (!t) return '';
    try {
      var d = new Date(t.replace(' ', 'T'));
      var now = new Date();
      var diff = now - d;
      if (diff < 86400000) return '今天注册';
      return Math.floor(diff / 86400000) + '天前注册';
    } catch (e) { return ''; }
  },
});
