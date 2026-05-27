var api = require('../../utils/api');
var util = require('../../utils/util');

Page({
  data: {
    items: [],
    darkMode: false,
    activeTab: 'active',
    serverURL: '',
  },

  onLoad: function(options) {
    if (options && options.tab === 'favorites') {
      this.setData({ activeTab: 'favorites' });
    }
  },

  onShow: function() {
    var dark = wx.getStorageSync('darkMode');
    this.setData({ darkMode: !!dark });
    this.loadItems();
  },

  switchTab: function(e) {
    var tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;
    var that = this;
    this.setData({ activeTab: tab }, function() {
      that.loadItems();
    });
  },

  loadItems: function() {
    var that = this;
    var tab = this.data.activeTab;
    if (tab === 'favorites') {
      api.getMyFavorites().then(function(res) {
        that.setData({ items: res.list });
      }).catch(function(err) {
        console.error(err);
      });
    } else {
      api.getMyItems(tab).then(function(res) {
        that.setData({ items: res.list });
      }).catch(function(err) {
        console.error(err);
      });
    }
  },

  onDeleteItem: function(e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除记录',
      content: '确定删除？不可恢复',
      success: function(res) {
        if (res.confirm) {
          api.deleteItem(id).then(function() {
            wx.showToast({ title: '已删除', icon: 'success' });
            that.loadItems();
          }).catch(function(err) {
            wx.showToast({ title: err || '删除失败', icon: 'none' });
          });
        }
      },
    });
  },

  onSoldIt: function(e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '标记已售',
      content: '确认已完成？',
      success: function(res) {
        if (res.confirm) {
          api.deleteItem(id).then(function() {
            wx.showToast({ title: '已标记', icon: 'success' });
            that.loadItems();
          }).catch(function(err) {
            wx.showToast({ title: err, icon: 'none' });
          });
        }
      },
    });
  },

  formatPrice: function(p) { return util.formatPrice(p); },
  itemStatusText: function(s) { return util.itemStatusText(s); },
});
