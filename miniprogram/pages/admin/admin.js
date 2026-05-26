Page({
  data: {
    annTitle: '',
    annContent: '',
    bannerIndex: 0,
  },

  onTitleInput: function(e) { this.setData({ annTitle: e.detail.value }); },
  onContentInput: function(e) { this.setData({ annContent: e.detail.value }); },
  onBannerIndexChange: function(e) { this.setData({ bannerIndex: e.detail.value }); },

  onPostAnnouncement: function() {
    var that = this;
    var title = this.data.annTitle.trim();
    var content = this.data.annContent.trim();
    if (!title || !content) {
      wx.showToast({ title: '请填写标题和内容', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '发布中...' });
    wx.cloud.callFunction({
      name: 'admin',
      data: { action: 'postAnnouncement', data: { title, content } },
      success: function(res) {
        wx.hideLoading();
        if (res.result.code === 0) {
          that.setData({ annTitle: '', annContent: '' });
          wx.showToast({ title: '公告已发布', icon: 'success' });
        } else {
          wx.showToast({ title: res.result.message || '发布失败', icon: 'none' });
        }
      },
      fail: function() {
        wx.hideLoading();
        wx.showToast({ title: '网络异常', icon: 'none' });
      },
    });
  },

  onUpdateBanner: function() {
    var that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: function(res) {
        wx.showLoading({ title: '上传中...' });
        wx.cloud.uploadFile({
          cloudPath: 'banners/' + Date.now() + '.jpg',
          filePath: res.tempFilePaths[0],
          success: function(uploadRes) {
            wx.cloud.callFunction({
              name: 'admin',
              data: { action: 'updateBanner', data: { fileID: uploadRes.fileID, index: that.data.bannerIndex } },
              success: function(cfRes) {
                wx.hideLoading();
                wx.showToast({ title: '广告图已更新', icon: 'success' });
              },
              fail: function() {
                wx.hideLoading();
                wx.showToast({ title: '更新失败', icon: 'none' });
              },
            });
          },
          fail: function() {
            wx.hideLoading();
            wx.showToast({ title: '上传失败', icon: 'none' });
          },
        });
      },
    });
  },

  onUpdateQR: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: function(res) {
        wx.showLoading({ title: '上传中...' });
        wx.cloud.uploadFile({
          cloudPath: 'qrcode.jpg',
          filePath: res.tempFilePaths[0],
          success: function(uploadRes) {
            wx.cloud.callFunction({
              name: 'admin',
              data: { action: 'updateQR', data: { fileID: uploadRes.fileID } },
              success: function(cfRes) {
                wx.hideLoading();
                wx.showToast({ title: '二维码已更新', icon: 'success' });
              },
              fail: function() {
                wx.hideLoading();
                wx.showToast({ title: '更新失败', icon: 'none' });
              },
            });
          },
          fail: function() {
            wx.hideLoading();
            wx.showToast({ title: '上传失败', icon: 'none' });
          },
        });
      },
    });
  },
});
