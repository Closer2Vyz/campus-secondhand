const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();
const _ = db.command;

// ⚠️ 你的 openid：第一次登录后去 云开发控制台→数据库→users 集合里查
const ADMIN_OPENID = '';

exports.main = async (event) => {
  const { action, data } = event;
  const { OPENID } = cloud.getWXContext();

  // 管理员检查
  function isAdmin() {
    return ADMIN_OPENID && OPENID === ADMIN_OPENID;
  }

  switch (action) {

    case 'checkAdmin': {
      return { code: 0, data: { isAdmin: isAdmin() } };
    }

    case 'postAnnouncement': {
      if (!isAdmin()) return { code: 403, message: '无权操作' };
      const { title, content } = data;
      if (!title || !content) return { code: 400, message: '请填写标题和内容' };
      await db.collection('announcements').add({
        data: { title, content, createdAt: db.serverDate() },
      });
      return { code: 0, message: '公告已发布' };
    }

    case 'updateBanner': {
      if (!isAdmin()) return { code: 403, message: '无权操作' };
      const { fileID } = data;
      if (!fileID) return { code: 400, message: '请上传图片' };
      // 存在全局配置集合，轮播图索引0-2
      const configCol = db.collection('config');
      const existing = await configCol.where({ key: 'banners' }).get();
      if (existing.data.length > 0) {
        const banners = existing.data[0].value || [];
        const idx = data.index || 0;
        banners[idx] = fileID;
        await configCol.doc(existing.data[0]._id).update({ data: { value: banners } });
      } else {
        const banners = [fileID, '', ''];
        await configCol.add({ data: { key: 'banners', value: banners } });
      }
      return { code: 0, message: '广告图已更新' };
    }

    case 'updateQR': {
      if (!isAdmin()) return { code: 403, message: '无权操作' };
      const { fileID } = data;
      if (!fileID) return { code: 400, message: '请上传图片' };
      const configCol = db.collection('config');
      const existing = await configCol.where({ key: 'qrCode' }).get();
      if (existing.data.length > 0) {
        await configCol.doc(existing.data[0]._id).update({ data: { value: fileID } });
      } else {
        await configCol.add({ data: { key: 'qrCode', value: fileID } });
      }
      return { code: 0, message: '二维码已更新' };
    }

    default:
      return { code: 400, message: '未知操作' };
  }
};
