const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { action, data } = event;
  const { OPENID } = cloud.getWXContext();
  const getUser = async () => {
    const r = await db.collection('users').where({ openid: OPENID }).get();
    return r.data[0];
  };

  switch (action) {
    // === 评论 ===
    case 'getComments': {
      const res = await db.collection('comments').where({ itemId: data.itemId }).orderBy('createdAt', 'asc').get();
      const list = [];
      for (const c of res.data) {
        const u = await db.collection('users').doc(c.userId).get();
        list.push({ id: c._id, content: c.content, createdAt: c.createdAt, userName: u.data ? u.data.nickname : '匿名' });
      }
      return { code: 0, data: { list } };
    }
    case 'postComment': {
      const user = await getUser();
      if (!user) return { code: 401 };
      const res = await db.collection('comments').add({
        data: { itemId: data.itemId, userId: user._id, content: data.content, createdAt: db.serverDate() },
      });
      return { code: 0, data: { id: res._id, content: data.content, createdAt: new Date(), userName: user.nickname }, message: '评论成功' };
    }

    // === 收藏 ===
    case 'toggleFavorite': {
      const user = await getUser();
      if (!user) return { code: 401 };
      const existing = await db.collection('favorites').where({ userId: user._id, itemId: data.itemId }).get();
      if (existing.data.length > 0) {
        await db.collection('favorites').doc(existing.data[0]._id).remove();
        return { code: 0, data: { favorited: false }, message: '已取消收藏' };
      } else {
        await db.collection('favorites').add({ data: { userId: user._id, itemId: data.itemId, createdAt: db.serverDate() } });
        return { code: 0, data: { favorited: true }, message: '已收藏' };
      }
    }
    case 'checkFavorite': {
      const user = await getUser();
      if (!user) return { code: 0, data: { favorited: false } };
      const existing = await db.collection('favorites').where({ userId: user._id, itemId: data.itemId }).get();
      return { code: 0, data: { favorited: existing.data.length > 0 } };
    }
    case 'getMyFavorites': {
      const user = await getUser();
      if (!user) return { code: 401, data: { list: [] } };
      const favs = await db.collection('favorites').where({ userId: user._id }).orderBy('createdAt', 'desc').get();
      const list = [];
      for (const f of favs.data) {
        try {
          const item = await db.collection('items').doc(f.itemId).get();
          if (item.data) list.push({ ...item.data, id: item.data._id });
        } catch (e) {}
      }
      return { code: 0, data: { list } };
    }

    // === 评价 ===
    case 'getSellerInfo': {
      const sId = data.sellerId;
      const user = await db.collection('users').doc(sId).get();
      if (!user.data) return { code: 404 };
      const itemCount = await db.collection('items').where({ sellerId: sId, status: 'active' }).count();
      const ratings = await db.collection('ratings').where({ sellerId: sId }).get();
      const items = await db.collection('items').where({ sellerId: sId, status: 'active' }).orderBy('createdAt', 'desc').limit(20).get();
      let totalScore = 0;
      ratings.data.forEach(r => totalScore += r.score);
      return {
        code: 0, data: {
          user: { id: user.data._id, nickname: user.data.nickname, avatar: user.data.avatar, campus: user.data.campus },
          itemCount: itemCount.total, ratingCount: ratings.data.length, avgScore: ratings.data.length > 0 ? (totalScore / ratings.data.length).toFixed(1) : 0,
          items: items.data.map(i => ({ ...i, id: i._id, images: i.images || [] })),
        },
      };
    }
    case 'submitRating': {
      const user = await getUser();
      if (!user) return { code: 401 };
      const order = await db.collection('orders').doc(data.orderId).get();
      if (!order.data || order.data.buyerId !== user._id) return { code: 403 };
      await db.collection('ratings').add({
        data: { orderId: data.orderId, sellerId: order.data.sellerId, buyerId: user._id, score: data.score, content: data.content || '', createdAt: db.serverDate() },
      });
      return { code: 0, message: '评价成功' };
    }

    // === 公告 ===
    case 'getLatestAnnouncement': {
      const res = await db.collection('announcements').orderBy('id', 'desc').limit(1).get();
      return { code: 0, data: res.data[0] || null };
    }

    // === 用户 ===
    case 'getProfile': {
      const user = await getUser();
      if (!user) return { code: 401 };
      return { code: 0, data: { id: user._id, nickname: user.nickname, avatar: user.avatar, phone: user.phone, campus: user.campus } };
    }
    case 'updateProfile': {
      const user = await getUser();
      if (!user) return { code: 401 };
      const update = {};
      if (data.nickname) update.nickname = data.nickname;
      if (data.campus !== undefined) update.campus = data.campus;
      if (data.avatar !== undefined) update.avatar = data.avatar;
      await db.collection('users').doc(user._id).update({ data: update });
      const updated = await db.collection('users').doc(user._id).get();
      return { code: 0, data: { id: updated.data._id, nickname: updated.data.nickname, avatar: updated.data.avatar, phone: updated.data.phone, campus: updated.data.campus } };
    }

    default:
      return { code: 400, message: '未知操作' };
  }
};
