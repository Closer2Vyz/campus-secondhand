const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();
const ordersCol = db.collection('orders');
const itemsCol = db.collection('items');

exports.main = async (event) => {
  const { action, data } = event;
  const { OPENID } = cloud.getWXContext();
  const getUser = async () => {
    const r = await db.collection('users').where({ openid: OPENID }).get();
    return r.data[0];
  };

  switch (action) {
    case 'createOrder': {
      const user = await getUser();
      if (!user) return { code: 401, message: '请先登录' };
      const { itemId, pickupTime, pickupLocation, contactPhone } = data;
      const item = await itemsCol.doc(itemId).get();
      if (!item.data) return { code: 404, message: '商品不存在' };
      if (item.data.sellerId === user._id) return { code: 400, message: '不能买自己的商品' };
      const res = await ordersCol.add({
        data: { itemId, buyerId: user._id, sellerId: item.data.sellerId, itemPrice: item.data.price, serviceFee: 0, totalPrice: item.data.price, pickupTime, pickupLocation: pickupLocation || '', contactPhone: contactPhone || '', status: 'pending', itemContact: item.data.contact || '', createdAt: db.serverDate() },
      });
      return { code: 0, data: { id: res._id, itemContact: item.data.contact || '' }, message: '下单成功' };
    }

    case 'getMyOrders': {
      const user = await getUser();
      if (!user) return { code: 401 };
      const res = await ordersCol.where({ buyerId: user._id }).orderBy('createdAt', 'desc').get();
      const list = [];
      for (const o of res.data) {
        const item = await itemsCol.doc(o.itemId).get();
        list.push({ ...o, id: o._id, itemTitle: item.data ? item.data.title : '', itemImages: item.data ? (item.data.images || []) : [], itemContact: item.data ? (item.data.contact || '') : '' });
      }
      return { code: 0, data: { list } };
    }

    case 'getSoldOrders': {
      const user = await getUser();
      if (!user) return { code: 401 };
      const res = await ordersCol.where({ sellerId: user._id }).orderBy('createdAt', 'desc').get();
      const list = [];
      for (const o of res.data) {
        const item = await itemsCol.doc(o.itemId).get();
        const buyer = await db.collection('users').doc(o.buyerId).get();
        list.push({ ...o, id: o._id, itemTitle: item.data ? item.data.title : '', itemImages: item.data ? (item.data.images || []) : [], buyerName: buyer.data ? buyer.data.nickname : '' });
      }
      return { code: 0, data: { list } };
    }

    case 'confirmPickup': {
      const user = await getUser();
      if (!user) return { code: 401 };
      const { id } = data;
      const order = await ordersCol.doc(id).get();
      if (!order.data || order.data.sellerId !== user._id) return { code: 403 };
      await ordersCol.doc(id).update({ data: { status: 'completed', completedAt: db.serverDate() } });
      return { code: 0, message: '交易完成' };
    }

    case 'cancelOrder': {
      const user = await getUser();
      if (!user) return { code: 401 };
      const { id } = data;
      const order = await ordersCol.doc(id).get();
      if (!order.data || order.data.buyerId !== user._id) return { code: 403 };
      await ordersCol.doc(id).update({ data: { status: 'cancelled' } });
      return { code: 0, message: '已取消' };
    }

    default:
      return { code: 400, message: '未知操作' };
  }
};
