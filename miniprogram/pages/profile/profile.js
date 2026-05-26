var api = require('../../utils/api');

Page({
  data: {
    isLoggedIn: false,
    userInfo: {},
    showMockLogin: false,
    showFeedback: false,
    showEditModal: false,
    editNickname: '',
    editCampus: '',
    editAvatar: '',
    mockId: '',
    avatarChar: 'U',
    serverURL: '',
  },

  onShow: function() {
    var app = getApp();
    var token = (app && app.globalData && app.globalData.token) || wx.getStorageSync('token');
    var userInfo = (app && app.globalData && app.globalData.userInfo) || wx.getStorageSync('userInfo');

    if (token && userInfo) {
      this.setData({
        isLoggedIn: true,
        userInfo: userInfo,
        avatarChar: (userInfo.nickname || 'U').substring(0, 1),
      });
    } else {
      this.setData({ isLoggedIn: false });
    }
  },

  toggleMock: function() {
    this.setData({ showMockLogin: !this.data.showMockLogin });
  },

  onMockIdInput: function(e) {
    this.setData({ mockId: e.detail.value });
  },

  onLogin: function() {
    var that = this;
    wx.showLoading({ title: '登录中...' });
    api.login().then(function(data) {
      wx.hideLoading();
      var app = getApp();
      if (!app || !app.globalData) return;
      app.globalData.token = data.token;
      app.globalData.userInfo = data.user;
      wx.setStorageSync('token', data.token);
      wx.setStorageSync('userInfo', data.user);
      that.setData({
        isLoggedIn: true,
        userInfo: data.user,
        avatarChar: (data.user.nickname || 'U').substring(0, 1),
      });
      wx.showToast({ title: '登录成功', icon: 'success' });
    }).catch(function(err) {
      wx.hideLoading();
      wx.showToast({ title: err || '登录失败', icon: 'none' });
    });
  },

  onMockLogin: function() {
    if (!this.data.mockId.trim()) {
      wx.showToast({ title: '请输入学号', icon: 'none' });
      return;
    }
    this.doLogin('', this.data.mockId.trim());
  },

  doLogin: function(code, mockOpenid) {
    var that = this;
    api.login().then(function(data) {
      var app = getApp();
      if (!app || !app.globalData) return;
      app.globalData.token = data.token;
      app.globalData.userInfo = data.user;
      wx.setStorageSync('token', data.token);
      wx.setStorageSync('userInfo', data.user);

      that.setData({
        isLoggedIn: true,
        userInfo: data.user,
        avatarChar: (data.user.nickname || 'U').substring(0, 1),
      });

      wx.showToast({ title: '登录成功', icon: 'success' });
    }).catch(function(err) {
      wx.showToast({ title: err || '登录失败', icon: 'none' });
    });
  },

  onShowFeedback: function() {
    this.setData({ showFeedback: true });
  },

  onCloseFeedback: function() {
    this.setData({ showFeedback: false });
  },

  goToFavorites: function() {
    wx.navigateTo({ url: '/pages/my-items/my-items?tab=favorites' });
  },

  goToMyItems: function() {
    wx.navigateTo({ url: '/pages/my-items/my-items' });
  },

  goToMyOrders: function() {
    wx.navigateTo({ url: '/pages/my-orders/my-orders' });
  },

  goToEditProfile: function() {
    var userInfo = this.data.userInfo;
    this.setData({
      editNickname: userInfo.nickname || '',
      editCampus: userInfo.campus || '',
      editAvatar: userInfo.avatar || '',
      showEditModal: true,
    });
  },

  onEditNicknameInput: function(e) {
    this.setData({ editNickname: e.detail.value });
  },

  onEditCampusInput: function(e) {
    this.setData({ editCampus: e.detail.value });
  },

  onEditAvatar: function() {
    var that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        wx.showLoading({ title: '上传中...' });
        api.uploadFile(res.tempFilePaths[0]).then(function(data) {
          wx.hideLoading();
          var app = getApp();
          if (app && app.globalData && app.globalData.userInfo) {
            app.globalData.userInfo.avatar = data.fileID;
          }
          that.setData({ editAvatar: data.fileID });
          api.updateProfile({ avatar: data.fileID });
          that.loadUserInfo();
          wx.showToast({ title: '头像已更新', icon: 'success' });
        }).catch(function(err) {
          wx.hideLoading();
          wx.showToast({ title: err || '上传失败', icon: 'none' });
        });
      },
    });
  },

  onSaveProfile: function() {
    var that = this;
    var data = {};
    if (this.data.editNickname.trim()) data.nickname = this.data.editNickname.trim();
    if (this.data.editCampus.trim()) data.campus = this.data.editCampus.trim();

    if (Object.keys(data).length === 0) {
      this.setData({ showEditModal: false });
      return;
    }

    api.updateProfile(data).then(function(user) {
      var app = getApp();
      if (app && app.globalData) app.globalData.userInfo = user;
      wx.setStorageSync('userInfo', user);
      that.setData({ userInfo: user, showEditModal: false });
      wx.showToast({ title: '已保存', icon: 'success' });
    }).catch(function(err) {
      wx.showToast({ title: err || '保存失败', icon: 'none' });
    });
  },

  loadUserInfo: function() {
    var that = this;
    api.getProfile().then(function(user) {
      var app = getApp();
      if (app && app.globalData) app.globalData.userInfo = user;
      wx.setStorageSync('userInfo', user);
      that.setData({ userInfo: user });
    }).catch(function() {});
  },

  onCancelEdit: function() {
    this.setData({ showEditModal: false });
  },

  onLogout: function() {
    var that = this;
    wx.showModal({
      title: '退出登录',
      content: '确定退出？',
      success: function(res) {
        if (res.confirm) {
          var app = getApp();
          if (app && app.globalData) {
            app.globalData.token = '';
            app.globalData.userInfo = null;
          }
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          that.setData({ isLoggedIn: false, userInfo: {} });
        }
      },
    });
  },
});
