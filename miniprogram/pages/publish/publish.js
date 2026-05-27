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
      setTimeout(function() {
        wx.switchTab({ url: '/pages/profile/profile' });
      }, 1000);
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
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        // 直接添加图片（裁剪在真机上有兼容问题，暂时跳过）
        that.setData({
          images: that.data.images.concat(res.tempFilePaths),
        });
      },
      fail: function(err) {
        console.warn('chooseImage fail', err);
        wx.showToast({ title: '选择图片失败，请检查权限', icon: 'none' });
      },
    });
  },



  onRemoveImage: function(e) {
    var index = e.currentTarget.dataset.index;
    var images = this.data.images.filter(function(_, i) { return i !== index; });
    this.setData({ images: images });
  },

  onPublish: function() {
    var that = this;
    var app = getApp();
    if (!app || !app.globalData || !app.globalData.token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.switchTab({ url: '/pages/profile/profile' });
      return;
    }

    var title = this.data.title;
    var description = this.data.description;
    var price = this.data.price;
    var category = this.data.category;
    var contact = this.data.contact;
    var stock = this.data.stock;
    var images = this.data.images;

    if (!title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
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
    var images = this.data.images;
    var uploaded = 0;
    var fileIds = [];

    // 逐张上传到云存储
    function uploadNext(i) {
      if (i >= images.length) {
        // 全部上传完成，提交数据
        api.publishItem({
          title: that.data.title.trim(),
          description: that.data.description.trim(),
          price: Number(that.data.price),
          category: that.data.category,
          contact: that.data.contact.trim(),
          stock: that.data.stock,
          images: fileIds,
        }).then(onSuccess).catch(onError);
        return;
      }
      api.uploadFile(images[i]).then(function(res) {
        fileIds.push(res.fileID);
        uploadNext(i + 1);
      }).catch(function() {
        onError('图片上传失败');
      });
    }
    uploadNext(0);
  },
});