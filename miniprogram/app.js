App({
  globalData: {
    userInfo: null,
    token: ''
  },

  onLaunch() {
    // 读取本地 token
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
    }
  }
});
