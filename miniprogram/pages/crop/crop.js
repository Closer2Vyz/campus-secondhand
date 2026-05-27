var that; // 页面引用
var canvas, ctx, img; // 不存 data 里，直接存变量

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
    that = this;
    if (options && options.path) {
      var path = decodeURIComponent(options.path);
      that.setData({ imagePath: path });
      that.initCanvas();
    } else {
      wx.showToast({ title: '图片路径缺失', icon: 'none' });
    }
  },

  initCanvas: function() {
    var query = wx.createSelectorQuery();
    query.select('#cropCanvas').fields({ node: true, size: true }).exec(function(res) {
      canvas = res[0].node;
      ctx = canvas.getContext('2d');
      var dpr = wx.getSystemInfoSync().pixelRatio;
      var width = res[0].width;
      var height = res[0].height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      var cropSize = Math.min(width, height) * 0.7;
      that.setData({ canvasWidth: width, canvasHeight: height, cropSize: cropSize });

      img = canvas.createImage();
      img.src = that.data.imagePath;
      img.onload = function() {
        var scale = Math.min(width / img.width, height / img.height) * 0.8;
        var imgW = img.width * scale;
        var imgH = img.height * scale;
        that.setData({
          imgX: (width - imgW) / 2,
          imgY: (height - imgH) / 2,
          imgW: imgW,
          imgH: imgH,
          loaded: true,
        });
        that.drawImage();
      };
    });
  },

  drawImage: function() {
    if (!ctx || !img) return;
    var data = that.data;
    var width = data.canvasWidth;
    var height = data.canvasHeight;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, width, height);

    var cs = data.cropSize;
    var cx = (width - cs) / 2;
    var cy = (height - cs) / 2;
    ctx.clearRect(cx, cy, cs, cs);

    ctx.save();
    ctx.beginPath();
    ctx.rect(cx, cy, cs, cs);
    ctx.clip();
    ctx.drawImage(img, data.imgX, data.imgY, data.imgW, data.imgH);
    ctx.restore();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.strokeRect(cx, cy, cs, cs);
  },

  onTouchStart: function(e) {
    var touch = e.touches[0];
    that.setData({
      startX: touch.clientX,
      startY: touch.clientY,
      startImgX: that.data.imgX,
      startImgY: that.data.imgY,
    });
  },

  onTouchMove: function(e) {
    var touch = e.touches[0];
    var dx = touch.clientX - that.data.startX;
    var dy = touch.clientY - that.data.startY;
    that.setData({
      imgX: that.data.startImgX + dx,
      imgY: that.data.startImgY + dy,
    });
    that.drawImage();
  },

  onCancel: function() {
    wx.navigateBack();
  },

  onConfirm: function() {
    var data = that.data;
    var cs = data.cropSize;
    var cx = (data.canvasWidth - cs) / 2;
    var cy = (data.canvasHeight - cs) / 2;
    var dpr = wx.getSystemInfoSync().pixelRatio;

    wx.canvasToTempFilePath({
      canvas: canvas,
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
