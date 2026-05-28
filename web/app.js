const API = '';
let T = localStorage.getItem('token') || '';
let U = JSON.parse(localStorage.getItem('user') || '{}');
let CI = null, CP = 1, CS = 'time_desc', CC = '', CK = '', CUID = null;

const $ = id => document.getElementById(id);
const toast = m => { const t=$('toast'); t.textContent=m; t.style.display='block'; setTimeout(()=>t.style.display='none',2000); };
const showPage = n => { document.querySelectorAll('.page').forEach(p=>p.classList.remove('active')); const e=$(n); if(e) e.classList.add('active'); document.querySelectorAll('.tab-item').forEach((t,i)=>{t.classList.toggle('active',(n==='home'&&i===0)||(n==='publish'&&i===1)||(n==='profile'&&i===2));}); };
const modal = (id,show) => { const m=$(id); if(m) m.classList.toggle('active',show); };
const api = (method,path,data,auth) => fetch(API+path, {method,headers:{'Content-Type':'application/json',...(auth&&T?{Authorization:'Bearer '+T}:{})},body:data&&method!=='GET'?JSON.stringify(data):undefined}).then(r=>r.json());
const apiGet = (path,auth) => api('GET',path,null,auth);
const apiPost = (path,data,auth) => api('POST',path,data,auth);

// ===== 登录注册 =====
function showLogin() {
  $('home-content').style.display='none';
  $('login-area').innerHTML='<div class="card"><div class="card-title" style="text-align:center">登录</div><div class="form-group"><label class="form-label">用户名</label><input class="form-input" id="loginU"></div><div class="form-group"><label class="form-label">密码</label><input class="form-input" id="loginP" type="password"></div><button class="btn btn-primary" onclick="login()">登录</button><div style="text-align:center;margin-top:10px;font-size:13px;color:#666">没有账号？<a href="javascript:showReg()" style="color:#07c160">注册</a></div></div>';
}
function showReg() {
  $('login-area').innerHTML='<div class="card"><div class="card-title" style="text-align:center">注册</div><div class="form-group"><label class="form-label">用户名</label><input class="form-input" id="regU"></div><div class="form-group"><label class="form-label">密码</label><input class="form-input" id="regP" type="password"></div><div class="form-group"><label class="form-label">确认密码</label><input class="form-input" id="regP2" type="password"></div><button class="btn btn-primary" onclick="reg()">注册</button><div style="text-align:center;margin-top:10px;font-size:13px;color:#666">已有账号？<a href="javascript:showLogin()" style="color:#07c160">登录</a></div></div>';
}
function reg() {
  const u=$('regU').value.trim(),p=$('regP').value,p2=$('regP2').value;
  if(!u||p.length<3||p!==p2){toast('检查输入');return;}
  apiPost('/api/auth/register',{username:u,password:p}).then(r=>{if(r.code===0){T=r.data.token;U=r.data.user;localStorage.setItem('token',T);localStorage.setItem('user',JSON.stringify(U));$('home-content').style.display='';$('login-area').innerHTML='';showPage('home');loadItems();loadProfile();toast('注册成功');}else toast(r.message);});
}
function login() {
  const u=$('loginU').value.trim(),p=$('loginP').value;
  if(!u||!p){toast('输入用户名和密码');return;}
  apiPost('/api/auth/login-password',{username:u,password:p}).then(r=>{if(r.code===0){T=r.data.token;U=r.data.user;localStorage.setItem('token',T);localStorage.setItem('user',JSON.stringify(U));$('home-content').style.display='';$('login-area').innerHTML='';showPage('home');loadItems();loadProfile();toast('登录成功');}else toast(r.message);});
}

// ===== 首页 =====
function initHome() {
  const cats=['全部','教材','数码','生活','体育','其他','虚拟物品'],icons=['🛍️','📚','📱','🧥','⚽','🎲','💻'];
  const el=$('cats');
  cats.forEach((c,i)=>{const s=document.createElement('span');s.className='cat'+(i===0?' active':'');s.innerHTML=icons[i]+' '+c;s.onclick=function(){el.querySelectorAll('.cat').forEach(e=>e.classList.remove('active'));this.classList.add('active');CC=c==='全部'?'':c;CP=1;loadItems();};el.appendChild(s);});
  $('searchBtn').onclick=()=>{CK=$('searchInput').value;CP=1;loadItems();};
  $('searchInput').onkeydown=e=>{if(e.key==='Enter')$('searchBtn').click()};
  loadItems();loadBanners();loadNotice();
}
function loadBanners() {
  $('banner-area').innerHTML='<div class="banner"><div class="banner-item">📢 广告位</div><div class="banner-item banner-item-2">📢 广告位</div><div class="banner-item banner-item-3">📢 广告位</div></div>';
}
function setSort(s){CS=s;document.querySelectorAll('.sort-btn').forEach(e=>e.classList.remove('active'));event.target.classList.add('active');CP=1;loadItems();}
function loadItems() {
  if(CP===1)$('item-grid').innerHTML='<div class="loading">加载中...</div>';
  apiGet('/api/items?'+new URLSearchParams({page:CP,category:CC,keyword:CK,sort:CS})).then(r=>{
    if(r.code!==0)return;
    if(CP===1)$('item-grid').innerHTML='';
    const list=r.data.list||[];
    if(list.length===0&&CP===1){$('item-grid').innerHTML='<div class="empty">暂无好物</div>';return;}
    list.forEach(item=>{
      const d=document.createElement('div');d.className='item-card';
      d.innerHTML='<img class="item-img" src="'+(item.images&&item.images[0]?API+item.images[0]:'')+'" onerror="this.style.display=\'none\'"><div class="item-body"><div class="item-title">'+item.title+'</div><div class="item-price">🍞'+Number(item.price).toFixed(2)+'</div><div class="item-meta">'+item.category+'</div></div>';
      d.onclick=()=>loadDetail(item.id);
      $('item-grid').appendChild(d);
    });
    if(r.data.page<r.data.totalPages){CP++;$('load-more').style.display='block';}else $('load-more').style.display='none';
  });
}

// ===== 详情 =====
function loadDetail(id) {
  showPage('detail');$('detail-content').innerHTML='<div class="loading">加载中...</div>';
  apiGet('/api/items/'+id).then(r=>{
    if(r.code!==0||!r.data){$('detail-content').innerHTML='<div class="empty">加载失败</div>';return;}
    CI=r.data;const i=r.data;
    let h='';
    if(i.images&&i.images[0])h+='<img class="detail-img" src="'+API+i.images[0]+'">';
    h+='<div class="card"><div style="font-size:17px;font-weight:700">'+i.title+'</div><div style="font-size:22px;color:#f60;font-weight:800;margin:6px 0">🍞'+Number(i.price).toFixed(2)+'</div><div><span style="font-size:12px;color:#07c160;background:#e8f5e9;padding:2px 10px;border-radius:10px">'+i.category+'</span></div></div>';
    h+='<div class="card"><div style="font-size:13px;font-weight:600;margin-bottom:6px">📝描述</div><div style="font-size:13px;color:#555;line-height:1.7">'+(i.description||'暂无')+'</div></div>';
    h+='<div class="card"><div class="avatar-row" onclick="showSeller('+i.sellerId+')"><div class="avatar avatar-sm">'+(i.sellerName?i.sellerName[0]:'?')+'</div><div><div class="seller-name">'+i.sellerName+'</div></div><span style="margin-left:auto;color:#999;font-size:12px">›</span></div></div>';
    h+='<div class="card"><div class="card-title">💬评论</div><div id="comments-area"></div></div>';
    $('detail-content').innerHTML=h;
    $('detail-bottom').innerHTML='<div class="detail-price">🍞'+Number(i.price).toFixed(2)+'</div><button class="btn btn-primary btn-small" onclick="openContact()">联系对方</button>';
    $('detail-bottom').style.display='flex';
    if(i.id)apiGet('/api/comments/'+i.id).then(r2=>{const ca=$('comments-area');if(r2.code===0&&r2.data){ca.innerHTML=(r2.data.list||[]).map(c=>'<div class="comment"><div class="comment-header"><span class="comment-name">'+c.userName+'</span><span class="comment-time">'+c.createdAt+'</span></div><div class="comment-text">'+c.content+'</div></div>').join('')||'<div style="color:#bbb;text-align:center;padding:10px;font-size:12px">暂无评论</div>';}});
  });
}
function showSeller(id){CUID=id;loadSellerInfo();showPage('seller');}
function openContact(){if(!T){showLogin();return;}$('conPrice').textContent=CI?'🍞'+Number(CI.price).toFixed(2):'';$('conDate').value='';$('conTime').value='';$('conLoc').value='';$('conPhone').value='';modal('contactModal',1);}
function submitContact(){
  const d=$('conDate').value,t=$('conTime').value,loc=$('conLoc').value,phone=$('conPhone').value;
  if(!d||!t){toast('请选时间');return;}
  apiPost('/api/orders',{itemId:CI.id,pickupTime:d+' '+t,pickupLocation:loc,contactPhone:phone},1).then(r=>{modal('contactModal',0);if(r.code===0)toast('对方联系方式: '+(r.data&&r.data.itemContact||'已通知'));else toast(r.message||'失败');});
}

// ===== 卖家 =====
function loadSellerInfo(){if(!CUID)return;$('seller-area').innerHTML='<div class="loading">加载中...</div>';showPage('seller');$('seller-bottom').style.display='none';
  apiGet('/api/ratings/seller/'+CUID+'/info').then(r=>{
    if(r.code!==0)return;$('seller-bottom').style.display='none';
    const d=r.data;const u=d.user;const score=Number(d.avgScore||0);const full=Math.floor(score);const stars='★'.repeat(full)+'☆'.repeat(5-full);
    let h='<div style="background:linear-gradient(135deg,#07c160,#05a34e);padding:40px 0 30px;text-align:center;color:#fff"><div class="avatar" style="margin:0 auto 10px;width:56px;height:56px;font-size:24px">'+(u.nickname?u.nickname[0]:'?')+'</div><div style="font-size:18px;font-weight:600">'+u.nickname+'</div><div style="font-size:13px;margin-top:6px">'+stars+' <span style="font-size:12px">'+d.ratingCount+'条评价</span></div></div>';
    h+='<div class="card" style="margin-top:0"><div class="card-title">在售 ('+d.items.length+')</div><div class="grid">';
    d.items.forEach(i=>{h+='<div class="item-card" onclick="loadDetail('+(i.id||i._id)+')"><img class="item-img" src="'+(i.images&&i.images[0]?API+i.images[0]:'')+'" onerror="this.style.display=\'none\'"><div class="item-body"><div class="item-title">'+i.title+'</div><div class="item-price">🍞'+Number(i.price).toFixed(2)+'</div></div></div>';});
    h+='</div></div>';
    if(d.items.length===0)h+='<div class="empty">暂无在售</div>';
    $('seller-area').innerHTML=h;
  });
}

// ===== 发布 =====
function publish(){
  if(!T){showLogin();return;}
  const title=$('pubTitle').value.trim(),cat=$('pubCat').value,price=parseFloat($('pubPrice').value),contact=$('pubContact').value.trim(),desc=$('pubDesc').value.trim();
  if(!title||!price||!cat){toast('请填写完整信息');return;}
  apiPost('/api/items',{title,category:cat,price,contact,description:desc},1).then(r=>{if(r.code===0){toast('成功！');$('pubTitle').value='';$('pubPrice').value='';$('pubContact').value='';$('pubDesc').value='';$('pubCat').value='';showPage('home');loadItems();}else toast(r.message);});
}

// ===== 个人中心 =====
function loadProfile() {
  const el=$('profile-area');
  if(!T){el.innerHTML='<div class="card" style="text-align:center;padding:30px"><button class="btn btn-primary" onclick="showLogin()">登录</button></div>';return;}
  let h='<div class="card" style="text-align:center;padding:16px"><div class="avatar" style="margin:0 auto 8px">'+(U.nickname?U.nickname[0]:'?')+'</div><div style="font-size:16px;font-weight:600">'+U.nickname+'</div></div>';
  h+='<div class="card"><div class="menu-item" onclick="loadMyItems()"><div class="menu-icon" style="background:#e8f5e9">📦</div><div class="menu-text">我的好物</div><span class="menu-arrow">›</span></div><div class="menu-item" onclick="loadMyOrders()"><div class="menu-icon" style="background:#fff7e6">📋</div><div class="menu-text">我的记录</div><span class="menu-arrow">›</span></div><div class="menu-item" onclick="loadFavs()"><div class="menu-icon" style="background:#fce4ec">❤️</div><div class="menu-text">收藏</div><span class="menu-arrow">›</span></div></div>';
  h+='<div class="card"><div class="menu-item" onclick="showLogin()"><div class="menu-icon" style="background:#e3f2fd">🔄</div><div class="menu-text">切换账号</div></div><div class="menu-item" onclick="logout()"><div class="menu-icon" style="background:#fff0f0">🚪</div><div class="menu-text" style="color:#ff4d4f">退出</div></div></div>';
  el.innerHTML=h;
}
function loadMyItems() {
  showPage('profile');
  $('profile-area').innerHTML='<div class="loading">加载中...</div>';
  apiGet('/api/items/my',1).then(r=>{
    if(r.code!==0)return;
    const items=r.data.list||[];
    let h='<div class="tabs" style="margin-bottom:10px"><div class="tab-btn active" onclick="loadMyItems()">全部</div></div>';
    if(items.length===0)h+='<div class="empty">暂无好物</div>';
    items.forEach(i=>{
      h+='<div class="list-item"><img class="list-item-img" src="'+(i.images&&i.images[0]?API+i.images[0]:'')+'" onerror="this.style.display=\'none\'"><div class="list-item-body"><div class="list-item-title">'+i.title+'</div><div class="list-item-sub">🍞'+Number(i.price).toFixed(2)+'</div><span class="tag tag-'+i.status+'">'+(i.status==='active'?'展示中':i.status==='sold'?'已完成':'已隐藏')+'</span></div></div>';
    });
    $('profile-area').innerHTML=h;
  });
}
function loadMyOrders() {
  showPage('profile');
  $('profile-area').innerHTML='<div class="loading">加载中...</div>';
  Promise.all([apiGet('/api/orders/my',1),apiGet('/api/orders/sold',1)]).then(([buy,sell])=>{
    const buys=(buy.data&&buy.data.list)||[],sells=(sell.data&&sell.data.list)||[];
    let h='<div class="card"><div class="card-title">📋我买到的 ('+buys.length+')</div>';
    if(buys.length===0)h+='<div style="color:#bbb;text-align:center;padding:10px;font-size:12px">无</div>';
    buys.forEach(o=>{h+='<div class="list-item"><div class="list-item-body"><div class="list-item-title">'+o.itemTitle+'</div><div class="list-item-sub">'+o.pickupTime+' <span class="tag tag-'+o.status+'">'+(o.status==='pending'?'待确认':o.status==='completed'?'已完成':'已取消')+'</span></div></div></div>';});
    h+='</div><div class="card"><div class="card-title">📋联系我的 ('+sells.length+')</div>';
    if(sells.length===0)h+='<div style="color:#bbb;text-align:center;padding:10px;font-size:12px">无</div>';
    sells.forEach(o=>{h+='<div class="list-item"><div class="list-item-body"><div class="list-item-title">'+o.itemTitle+'</div><div class="list-item-sub">'+o.pickupTime+' <span class="tag tag-'+o.status+'">'+(o.status==='pending'?'待确认':o.status==='completed'?'已完成':'已取消')+'</span></div></div></div>';});
    h+='</div>';
    $('profile-area').innerHTML=h;
  });
}
function loadFavs() {
  showPage('profile');
  $('profile-area').innerHTML='<div class="loading">加载中...</div>';
  apiGet('/api/favorites/my',1).then(r=>{
    if(r.code!==0)return;
    const items=r.data.list||[];
    let h='<div class="card"><div class="card-title">❤️收藏 ('+items.length+')</div>';
    if(items.length===0)h+='<div class="empty">暂无收藏</div>';
    items.forEach(i=>{h+='<div class="list-item" onclick="loadDetail('+(i.id||i._id)+')"><img class="list-item-img" src="'+(i.images&&i.images[0]?API+i.images[0]:'')+'" onerror="this.style.display=\'none\'"><div class="list-item-body"><div class="list-item-title">'+i.title+'</div><div class="list-item-sub">🍞'+Number(i.price).toFixed(2)+'</div></div></div>';});
    h+='</div>';
    $('profile-area').innerHTML=h;
  });
}
function logout(){if(confirm('退出？')){localStorage.clear();T='';U={};showPage('home');showLogin();loadItems();}}

// ===== 公告 =====
function loadNotice(){apiGet('/api/announcements/latest').then(r=>{if(r.code===0&&r.data){$('noticeTitle').textContent=r.data.title;$('noticeBody').textContent=r.data.content;modal('noticeModal',1);}});}

// ===== 初始化 =====
window.onload=function(){
  initHome();loadProfile();
  if(T){$('home-content').style.display='';$('login-area').innerHTML='';}else showLogin();
};
