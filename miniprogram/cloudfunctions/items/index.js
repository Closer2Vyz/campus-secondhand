const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();
const _ = db.command;
const itemsCol = db.collection('items');
const ordersCol = db.collection('orders');

exports.main = async (event, context) => {
  const { action, data } = event;
  const { OPENID } = cloud.getWXContext();

  switch (action) {

    case 'getItems': {
      const { page = 1, category, keyword, sort = 'time_desc' } = data || {};
      const limit = 20;
      const offset = (page - 1) * limit;
      let where = { status: 'active' };
      if (category && category !== '全部') where.category = category;
      if (keyword) {
        where.title = db.RegExp({ regexp: keyword, options: 'i' });
      }
      let orderBy = { createdAt: -1 };
      if (sort === 'price_asc') orderBy = { price: 1 };
      if (sort === 'price_desc') orderBy = { price: -1 };

      const count = await itemsCol.where(where).count();
      const res = await itemsCol.where(where).orderBy(Object.keys(orderBy)[0], Object.values(orderBy)[0] > 0 ? 'asc' : 'desc').skip(offset).limit(limit).get();

      // 获取卖家昵称
      const list = [];
      for (const item of res.data) {
        const seller = await db.collection('users').doc(item.sellerId).get();
        list.push({
          id: item._id,
          sellerId: item.sellerId,
          title: item.title,
          description: item.description,
          price: item.price,
          images: item.images || [],
          category: item.category,
          status: item.status,
          createdAt: item.createdAt,
          sellerName: seller.data ? seller.data.nickname : '匿名',
          stock: item.stock || 1,
          contact: '',
        });
      }

      return { code: 0, data: { list, total: count.total, page, totalPages: Math.ceil(count.total / limit) } };
    }

    case 'getItemDetail': {
      const { id } = data;
      const res = await itemsCol.doc(id).get();
      if (!res.data) return { code: 404, message: '商品不存在' };
      const item = res.data;
      const seller = await db.collection('users').doc(item.sellerId).get();
      const soldCount = await ordersCol.where({ itemId: id, status: 'completed' }).count();
      return {
        code: 0,
        data: {
          ...item,
          id: item._id,
          sellerName: seller.data ? seller.data.nickname : '匿名',
          sellerAvatar: seller.data ? seller.data.avatar : '',
          sellerCampus: seller.data ? seller.data.campus : '',
          soldCount: soldCount.total,
          contact: '',
          images: item.images || [],
        },
      };
    }

    case 'createItem': {
      const { title, description, price, category, stock, contact, images } = data;
      const userRes = await db.collection('users').where({ openid: OPENID }).get();
      if (userRes.data.length === 0) return { code: 401, message: '请先登录' };
      const sellerId = userRes.data[0]._id;
      const res = await itemsCol.add({
        data: {
          sellerId,
          title, description, price: Number(price),
          images: images || [],
          category: category || '其他',
          status: 'active',
          stock: stock || 1,
          contact: contact || '',
          createdAt: db.serverDate(),
          updatedAt: db.serverDate(),
        },
      });
      return { code: 0, data: { id: res._id }, message: '发布成功' };
    }

    case 'getMyItems': {
      const userRes = await db.collection('users').where({ openid: OPENID }).get();
      if (userRes.data.length === 0) return { code: 401, message: '请先登录' };
      const { status } = data || {};
      let where = { sellerId: userRes.data[0]._id };
      if (status) where.status = status;
      const res = await itemsCol.where(where).orderBy('createdAt', 'desc').get();
      return { code: 0, data: { list: res.data.map(i => ({ ...i, id: i._id })) } };
    }

    case 'deleteItem': {
      const { id } = data;
      const userRes = await db.collection('users').where({ openid: OPENID }).get();
      if (userRes.data.length === 0) return { code: 401, message: '请先登录' };
      const item = await itemsCol.doc(id).get();
      if (!item.data) return { code: 404, message: '商品不存在' };
      if (item.data.sellerId !== userRes.data[0]._id) return { code: 403, message: '无权操作' };
      await itemsCol.doc(id).remove();
      return { code: 0, message: '已删除' };
    }

    case 'updateStatus': {
      const { id, status } = data;
      const userRes = await db.collection('users').where({ openid: OPENID }).get();
      if (userRes.data.length === 0) return { code: 401, message: '请先登录' };
      const item = await itemsCol.doc(id).get();
      if (!item.data) return { code: 404, message: '商品不存在' };
      if (item.data.sellerId !== userRes.data[0]._id) return { code: 403, message: '无权操作' };
      await itemsCol.doc(id).update({ data: { status, updatedAt: db.serverDate() } });
      return { code: 0, message: '已更新' };
    }

    default:
      return { code: 400, message: '未知操作' };
  }
};
