Page({
  data: {
    imagePath: '',
    canvasWidth: 0,
    canvasHeight: 0,
    cropSize: 300,
    imgX: 0,
    imgY: 0,
    imgW: 0,
    imgH: 0,
    startX: 0,
    startY: 0,
    startImgX: 0,
    startImgY: 0,
    loaded: false,
  },

  onLoad: function(options) {
    if (options && options.path) {
      var path = decodeURIComponent(options.path);
      this.setData({ imagePath: path });
      this.initCanvas();
    } else {
      wx.showToast({ title: '图片路径缺失', icon: 'none' });
    }
  },

  initCanvas: function() {
    var that = this;
    var query = wx.createSelectorQuery();
    query.select('#cropCanvas').fields({ node: true, size: true }).exec(function(res) {
      var canvas = res[0].node;
      var ctx = canvas.getContext('2d');
      var dpr = wx.getSystemInfoSync().pixelRatio;
      var width = res[0].width;
      var height = res[0].height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      var cropSize = Math.min(width, height) * 0.7;
      that.setData({ canvasWidth: width, canvasHeight: height, cropSize: cropSize });

      // 加载图片
      var img = canvas.createImage();
      img.src = that.data.imagePath;
      img.onload = function() {
        // 计算初始位置（居中、最大适配）
        var scale = Math.min(width / img.width, height / img.height) * 0.8;
        var imgW = img.width * scale;
        var imgH = img.height * scale;
        var imgX = (width - imgW) / 2;
        var imgY = (height - imgH) / 2;

        that.setData({
          imgX: imgX, imgY: imgY, imgW: imgW, imgH: imgH,
          loaded: true,
          img: img,
          ctx: ctx,
          canvas: canvas,
        });

        that.drawImage();
      };
    });
  },

  drawImage: function() {
    var data = this.data;
    if (!data.ctx || !data.img) return;
    var ctx = data.ctx;
    var width = data.canvasWidth;
    var height = data.canvasHeight;

    ctx.clearRect(0, 0, width, height);
    // 画半透明背景
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, width, height);

    // 裁剪区域挖空
    var cs = data.cropSize;
    var cx = (width - cs) / 2;
    var cy = (height - cs) / 2;
    ctx.clearRect(cx, cy, cs, cs);

    // 画图片
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx, cy, cs, cs);
    ctx.clip();
    ctx.drawImage(data.img, data.imgX, data.imgY, data.imgW, data.imgH);
    ctx.restore();

    // 画边框
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.strokeRect(cx, cy, cs, cs);
  },

  onTouchStart: function(e) {
    var touch = e.touches[0];
    this.setData({
      startX: touch.clientX,
      startY: touch.clientY,
      startImgX: this.data.imgX,
      startImgY: this.data.imgY,
    });
  },

  onTouchMove: function(e) {
    var touch = e.touches[0];
    var dx = touch.clientX - this.data.startX;
    var dy = touch.clientY - this.data.startY;
    this.setData({
      imgX: this.data.startImgX + dx,
      imgY: this.data.startImgY + dy,
    });
    this.drawImage();
  },

  onCancel: function() {
    wx.navigateBack();
  },

  onConfirm: function() {
    var that = this;
    var data = this.data;
    var cs = data.cropSize;
    var cx = (data.canvasWidth - cs) / 2;
    var cy = (data.canvasHeight - cs) / 2;
    var dpr = wx.getSystemInfoSync().pixelRatio;

    wx.canvasToTempFilePath({
      canvas: data.canvas,
      x: cx * dpr,
      y: cy * dpr,
      width: cs * dpr,
      height: cs * dpr,
      destWidth: cs * 2,
      destHeight: cs * 2,
      fileType: 'jpg',
      quality: 0.9,
      success: function(res) {
        var pages = getCurrentPages();
        var prevPage = pages[pages.length - 2];
        if (prevPage) {
          prevPage.addCroppedImage(res.tempFilePath);
        }
        wx.navigateBack();
      },
      fail: function(err) {
        console.error('crop fail', err);
        wx.showToast({ title: '裁剪失败', icon: 'none' });
      },
    });
  },
});
