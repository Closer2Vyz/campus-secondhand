const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();
const users = db.collection('users');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 查找或创建用户
  let user = await users.where({ openid }).get();
  if (user.data.length === 0) {
    const res = await users.add({
      data: {
        openid,
        nickname: '用户_' + openid.slice(-4),
        avatar: '',
        phone: '',
        campus: '',
        createdAt: db.serverDate(),
      },
    });
    user = await users.doc(res._id).get();
    user = user.data;
  } else {
    user = user.data[0];
  }

  return {
    code: 0,
    data: {
      token: openid, // 用 openid 做简易 token
      user: {
        id: user._id,
        nickname: user.nickname,
        avatar: user.avatar || '',
        phone: user.phone || '',
        campus: user.campus || '',
      },
    },
  };
};
