const api = require('../../utils/api');

Page({
  data: {
    title: '',
    description: '',
    price: '',
    category: '',
    images: [],
    categories: ['教材', '数码', '生活', '体育', '其他', '虚拟物品'],
    stock: 1,
    contact: '',
    submitting: false,
    darkMode: false,
    descCount: '0/500',
  },

  onShow: function() {
    var dark = wx.getStorageSync('darkMode');
    this.setData({ darkMode: !!dark });
    var app = getApp();
    if (!app || !app.globalData || !app.globalData.token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
    }
  },

  onTitleInput: function(e) {
    this.setData({ title: e.detail.value });
  },

  onDescInput: function(e) {
    this.setData({ description: e.detail.value, descCount: e.detail.value.length + '/500' });
  },

  onPriceInput: function(e) {
    this.setData({ price: e.detail.value });
  },

  onStockInput: function(e) {
    var val = parseInt(e.detail.value) || 1;
    if (val < 1) val = 1;
    if (val > 999) val = 999;
    this.setData({ stock: val });
  },

  onContactInput: function(e) {
    this.setData({ contact: e.detail.value });
  },

  onCategoryChange: function(e) {
    this.setData({ category: this.data.categories[e.detail.value] });
  },

  onChooseImage: function() {
    var remain = 6 - this.data.images.length;
    var that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        // 跳转到裁剪页
        wx.navigateTo({
          url: '/pages/crop/crop?path=' + encodeURIComponent(res.tempFilePaths[0]),
        });
      },
      fail: function(err) {
        console.warn('chooseImage fail', err);
        wx.showToast({ title: '选择图片失败，请检查权限', icon: 'none' });
      },
    });
  },

  // 接收裁剪后的图片
  addCroppedImage: function(tempPath) {
    var list = this.data.images;
    list.push(tempPath);
    this.setData({ images: list });
  },

  onRemoveImage: function(e) {
    var index = e.currentTarget.dataset.index;
    var images = this.data.images.filter(function(_, i) { return i !== index; });
    this.setData({ images: images });
  },

  onPublish: function() {
    var that = this;
    var title = this.data.title;
    var description = this.data.description;
    var price = this.data.price;
    var category = this.data.category;
    var contact = this.data.contact;
    var stock = this.data.stock;
    var images = this.data.images;

    if (!title.trim()) {
      wx.showToast({ title: '请输入商品标题', icon: 'none' });
      return;
    }
    if (!price || isNaN(price) || Number(price) <= 0) {
      wx.showToast({ title: '请输入有效价格', icon: 'none' });
      return;
    }
    if (!category) {
      wx.showToast({ title: '请选择分类', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    function onSuccess() {
      wx.showToast({ title: '发布成功！', icon: 'success' });
      that.setData({
        title: '', description: '', price: '', category: '', contact: '', stock: 1,
        images: [], submitting: false, descCount: '0/500',
      });
    }

    function onError(err) {
      wx.showToast({ title: err || '发布失败', icon: 'none' });
      that.setData({ submitting: false });
    }

    if (images.length > 0) {
      this.uploadWithImages(onSuccess, onError);
    } else {
      api.publishItem({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        category: category,
        contact: contact.trim(),
        stock: stock,
      }).then(onSuccess).catch(onError);
    }
  },

  uploadWithImages: function(onSuccess, onError) {
    var that = this;
    var title = this.data.title;
    var description = this.data.description;
    var price = this.data.price;
    var category = this.data.category;
    var contact = this.data.contact;
    var stock = this.data.stock;
    var images = this.data.images;
    var app = getApp();
    var token = (app && app.globalData && app.globalData.token) || '';
    var CONFIG = require('../../utils/config');
    var uploadUrl = CONFIG.baseURL + '/api/items';

    wx.uploadFile({
      url: uploadUrl,
      filePath: images[0],
      name: 'images',
      formData: {
        title: title.trim(),
        description: description.trim(),
        price: String(Number(price)),
        category: category,
        contact: contact.trim(),
        stock: String(stock),
      },
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        try {
          var data = JSON.parse(res.data);
          if (data.code === 0) {
            if (images.length <= 1) {
              onSuccess();
              return;
            }
            var uploaded = 0;
            for (var i = 1; i < images.length; i++) {
              (function(idx) {
                wx.uploadFile({
                  url: CONFIG.baseURL + '/api/items/' + data.data.id,
                  filePath: images[idx],
                  name: 'images',
                  formData: { existingImages: JSON.stringify([]) },
                  header: { 'Authorization': 'Bearer ' + token },
                  success: function() {
                    uploaded++;
                    if (uploaded >= images.length - 1) onSuccess();
                  },
                  fail: function() { onError('图片上传失败'); },
                });
              })(i);
            }
          } else {
            onError(data.message);
          }
        } catch (e) {
          onError('上传失败');
        }
      },
      fail: function() { onError('上传失败'); },
    });
  },
});