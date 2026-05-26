var api = require('../../utils/api');
var util = require('../../utils/util');

Page({
  data: {
    items: [],
    banners: [
      { image: '/assets/icons/banner1.png' },
      { image: '/assets/icons/banner2.png' },
      { image: '/assets/icons/banner3.png' },
    ],
    categories: ['全部', '教材', '数码', '生活', '体育', '其他', '虚拟物品'],
    catIcons: ['🛍️', '📚', '📱', '🧥', '⚽', '🎲', '💻'],
    catColors: ['#e8f5e9', '#e8f5e9', '#e3f2fd', '#fff3e0', '#fce4ec', '#f3e5f5', '#e0f7fa'],
    activeCategory: '全部',
    page: 1,
    hasMore: false,
    loading: false,
    loadError: false,
    serverURL: '',
    itemThumbs: [], // wx.downloadFile 下载后的本地图片路径
    announcement: null,
    showAnnouncement: false,
    darkMode: false,
    keyword: '',
    sortBy: 'time_desc',
    showSearch: false,
  },

  onLoad: function() {
    this.loadItems();
    this.loadAnnouncement();
  },

  onShow: function() {
    var dark = wx.getStorageSync('darkMode');
    this.setData({ darkMode: !!dark });
  },

  // 把原始 API 数据转成页面需要的格式（不用 ... 展开）
  formatItem: function(item) {
    return {
      id: item.id,
      sellerId: item.sellerId,
      title: item.title,
      description: item.description,
      price: item.price,
      images: item.images || [],
      category: item.category,
      status: item.status,
      createdAt: item.createdAt,
      sellerName: item.sellerName,
      priceText: util.formatPrice(item.price),
      timeText: this.fmtTime(item.createdAt),
    };
  },

  loadItems: function() {
    if (this.data.loading) return;
    var that = this;
    this.setData({ loading: true, loadError: false });

    var category = this.data.activeCategory === '全部' ? '' : this.data.activeCategory;
    api.getItems({ page: this.data.page, category, keyword: this.data.keyword, sort: this.data.sortBy }).then(function(res) {
      var rawList = res.list || [];
      var list = [];
      for (var i = 0; i < rawList.length; i++) {
        list.push(that.formatItem(rawList[i]));
      }

      // 云存储 fileID 直接使用
      var thumbs = [];
      for (var i = 0; i < list.length; i++) {
        thumbs.push(list[i].images[0] || '');
      }
      that.setData({
        items: list,
        hasMore: res.page < res.totalPages,
        loading: false,
        loadError: false,
        itemThumbs: thumbs,
      });
    }).catch(function() {
      that.setData({ loading: false, loadError: true });
      if (that.data.items.length === 0) {
        wx.showToast({ title: '加载失败，下拉重试', icon: 'none' });
      }
    });
  },

  onSearchInput: function(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch: function() {
    this.setData({ page: 1, items: [], showSearch: false }, function() {
      this.loadItems();
    });
  },

  onClearSearch: function() {
    this.setData({ keyword: '', page: 1, items: [] }, function() {
      this.loadItems();
    });
  },

  onSortChange: function(e) {
    var sort = e.currentTarget.dataset.sort;
    if (sort === this.data.sortBy) return;
    this.setData({ sortBy: sort, page: 1, items: [] }, function() {
      this.loadItems();
    });
  },

  onCategoryTap: function(e) {
    var category = e.currentTarget.dataset.category;
    if (category === this.data.activeCategory) return;
    var that = this;
    this.setData({ activeCategory: category, page: 1, items: [] }, function() {
      that.loadItems();
    });
  },

  onItemTap: function(e) {
    var id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: '/pages/item/item?id=' + id });
  },

  onPullDownRefresh: function() {
    var that = this;
    this.setData({ page: 1, items: [] }, function() {
      that.loadItems();
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom: function() {
    if (this.data.hasMore && !this.data.loading) {
      var that = this;
      this.setData({ page: this.data.page + 1 }, function() {
        that.loadMore();
      });
    }
  },

  loadMore: function() {
    var that = this;
    this.setData({ loading: true });

    var category = this.data.activeCategory === '全部' ? '' : this.data.activeCategory;
    api.getItems({ page: this.data.page, category, keyword: this.data.keyword, sort: this.data.sortBy }).then(function(res) {
      var rawList = res.list || [];
      var list = [];
      for (var i = 0; i < rawList.length; i++) {
        list.push(that.formatItem(rawList[i]));
      }

      var startIdx = that.data.items.length;
      var thumbs = that.data.itemThumbs;
      for (var i = 0; i < list.length; i++) {
        thumbs.push(list[i].images[0] || '');
      }
      that.setData({
        items: that.data.items.concat(list),
        itemThumbs: thumbs,
        hasMore: res.page < res.totalPages,
        loading: false,
      });
    }).catch(function() {
      that.setData({ loading: false });
      wx.showToast({ title: '加载更多失败', icon: 'none' });
    });
  },

  loadAnnouncement: function() {
    var that = this;
    api.getLatestAnnouncement().then(function(ann) {
      if (ann) {
        that.setData({ announcement: ann, showAnnouncement: true });
      }
    }).catch(function() {});
  },

  onShowAnnouncement: function() {
    var that = this;
    if (this.data.announcement) {
      this.setData({ showAnnouncement: true });
    } else {
      api.getLatestAnnouncement().then(function(ann) {
        if (ann) that.setData({ announcement: ann, showAnnouncement: true });
        else wx.showToast({ title: '暂无公告', icon: 'none' });
      }).catch(function() {
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
    }
  },

  onCloseAnnouncement: function() {
    var ann = this.data.announcement;
    if (ann) {
      wx.setStorageSync('lastReadAnnouncementId', ann.id);
    }
    this.setData({ showAnnouncement: false });
  },

  fmtTime: function(time) {
    if (!time) return '';
    try {
      // iOS 不支持 "2026-05-26 10:58:41" 带空格的格式，转成 ISO
      var d = new Date(time.replace(' ', 'T'));
      var now = new Date();
      var diff = now - d;
      if (diff < 3600000) return '刚刚';
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
      return Math.floor(diff / 86400000) + '天前';
    } catch (e) {
      return '';
    }
  },
});
