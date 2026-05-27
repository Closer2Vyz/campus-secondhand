// API 地址（部署时改为 Railway 域名）
const API = 'https://campus-secondhand-production-023e.up.railway.app';
let TOKEN = localStorage.getItem('token') || '';
let USER = JSON.parse(localStorage.getItem('user') || '{}');
let CURRENT_ITEM = null;
let CURRENT_PAGE = 1;
let CURRENT_SORT = 'time_desc';
let CURRENT_CAT = '';
let CURRENT_KEYWORD = '';

function $(id) { return document.getElementById(id); }
function toast(msg) { var t=$('toast'); t.textContent=msg; t.style.display='block'; setTimeout(()=>t.style.display='none',2000); }
function showPage(name) { document.querySelectorAll('.page').forEach(p=>p.classList.remove('active')); var el=$('page-'+name); if(el) el.classList.add('active'); document.querySelectorAll('.tab-item').forEach((t,i)=>{ t.classList.toggle('active', (name==='home'&&i===0)||(name==='publish'&&i===1)||(name==='profile'&&i===2)); }); }
function modal(id, show) { var m=$(id); if(m) m.classList.toggle('active', show); }
function el(tag, attrs, children) { var e=document.createElement(tag); if(attrs) for(var k in attrs) e[k]=attrs[k]; if(children) e.innerHTML=children; return e; }

function api(method, path, data, auth) {
  var opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (data && method!=='GET') opts.body = JSON.stringify(data);
  if (auth && TOKEN) opts.headers['Authorization'] = 'Bearer ' + TOKEN;
  var url = API + path;
  if (data && method==='GET') url += '?' + new URLSearchParams(data);
  return fetch(url, opts).then(r=>r.json());
}

// ===== 登录 =====
function doLogin() {
  if (TOKEN) { showPage('profile'); loadProfile(); return; }
  var name = prompt('输入昵称（或直接确定）') || '同学';
  api('POST','/api/auth/login',{mockOpenid:'web_'+Date.now(),nickname:name}).then(r=>{
    if(r.code===0){ TOKEN=r.data.token; USER=r.data.user; localStorage.setItem('token',TOKEN); localStorage.setItem('user',JSON.stringify(USER));
      toast('登录成功'); showPage('home'); loadItems(); loadProfile(); $( 'loginNotice').innerHTML=''; }
    else toast(r.message||'登录失败');
  });
}

// ===== 首页 =====
function initHome() {
  var cats = ['全部','教材','数码','生活','体育','其他','虚拟物品'];
  var catIcons = ['🛍️','📚','📱','🧥','⚽','🎲','💻'];
  var elCats = $('cats');
  cats.forEach((c,i)=>{
    var sp = document.createElement('span');
    sp.className = 'cat' + (i===0?' active':'');
    sp.textContent = catIcons[i] + ' ' + c;
    sp.onclick = function(){
      elCats.querySelectorAll('.cat').forEach(e=>e.classList.remove('active'));
      this.classList.add('active');
      CURRENT_CAT = c==='全部'?'':c;
      CURRENT_PAGE = 1;
      loadItems();
    };
    elCats.appendChild(sp);
  });

  // 搜索
  $('searchInput').addEventListener('keydown', function(e){ if(e.key==='Enter') doSearch(); });
  $('searchBtn').onclick = doSearch;

  // 无限滚动
  var list = $('itemList');
  window.addEventListener('scroll', function(){
    if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
      if ($('loadMore').style.display !== 'none') loadMore();
    }
  });
}

function doSearch() { CURRENT_KEYWORD = $('searchInput').value; CURRENT_PAGE = 1; loadItems(); }

function setSort(s) {
  CURRENT_SORT = s;
  document.querySelectorAll('.sort-btn').forEach(e=>e.classList.remove('active'));
  event.target.classList.add('active');
  CURRENT_PAGE = 1;
  loadItems();
}

function loadItems() {
  $('loadMore').style.display = 'none';
  if (CURRENT_PAGE === 1) $('itemList').innerHTML = '<div class="loading">加载中...</div>';
  api('GET','/api/items',{page:CURRENT_PAGE,category:CURRENT_CAT,keyword:CURRENT_KEYWORD,sort:CURRENT_SORT}).then(r=>{
    if(r.code!==0) return;
    var list = r.data.list;
    if (CURRENT_PAGE === 1) $('itemList').innerHTML = '';
    if (!list || list.length===0) { if(CURRENT_PAGE===1) $('itemList').innerHTML='<div class="empty">暂无好物</div>'; return; }
    list.forEach(function(item){
      var img = item.images && item.images[0] ? API+item.images[0] : '';
      var card = document.createElement('div'); card.className='card-item';
      card.innerHTML = '<img class="card-item-img" src="'+img+'" onerror="this.style.display=\'none\'"><div class="card-item-body"><div class="card-item-title">'+item.title+'</div><div class="card-item-price">🍞'+Number(item.price).toFixed(2)+'</div><div class="card-item-meta">'+item.category+'</div></div>';
      card.onclick = function(){ loadDetail(item.id); };
      $('itemList').appendChild(card);
    });
    if (r.data.page < r.data.totalPages) { CURRENT_PAGE++; $('loadMore').style.display='block'; }
  });
}
function loadMore() { $('loadMore').textContent='加载中...'; loadItems(); }

// ===== 详情 =====
function loadDetail(id) {
  showPage('detail');
  $('detailContent').innerHTML = '<div class="loading">加载中...</div>';
  api('GET','/api/items/'+id).then(r=>{
    if(r.code!==0||!r.data){ $('detailContent').innerHTML='<div class="empty">加载失败</div>'; return; }
    var item=r.data; CURRENT_ITEM=item;
    var imgs = item.images&&item.images.length>0 ? '<img class="detail-img" src="'+API+item.images[0]+'">' : '';
    var contact = item.contact ? '<div class="seller-contact">📞 '+item.contact+'</div>' : '';
    var html = imgs;
    html += '<div class="card"><div style="font-size:18px;font-weight:700">'+item.title+'</div><div style="font-size:24px;color:#f60;font-weight:800;margin:8px 0">🍞'+Number(item.price).toFixed(2)+'</div><div><span style="font-size:12px;color:#07c160;background:#e8f5e9;padding:2px 10px;border-radius:10px">'+item.category+'</span></div></div>';
    html += '<div class="card"><div style="font-size:14px;font-weight:600;margin-bottom:8px">📝 描述</div><div style="font-size:14px;color:#555;line-height:1.8">'+(item.description||'暂无')+'</div></div>';
    html += '<div class="card"><div class="seller-row"><div class="avatar avatar-sm">'+(item.sellerName?item.sellerName[0]:'?')+'</div><div class="seller-info"><div class="seller-name">'+item.sellerName+'</div>'+contact+'</div></div></div>';
    
    // 评论
    html += '<div class="card"><div class="card-title">💬 评论</div><div id="commentsWrap"></div></div>';
    
    $('detailContent').innerHTML = html;
    $('detailBottom').innerHTML = '<div class="price">🍞'+Number(item.price).toFixed(2)+'</div><button class="btn btn-primary btn-small" onclick="openContact()">联系对方</button>';
    $('detailBottom').style.display = 'flex';

    // 加载评论
    if (item.id) {
      api('GET','/api/comments/'+item.id).then(r2=>{
        var cw = $('commentsWrap');
        if(r2.code===0&&r2.data&&r2.data.list){
          var ch = '';
          r2.data.list.forEach(function(c){ ch+='<div class="comment"><div class="comment-header"><span class="comment-name">'+c.userName+'</span><span class="comment-time">'+c.createdAt+'</span></div><div class="comment-text">'+c.content+'</div></div>'; });
          cw.innerHTML = ch || '<div style="text-align:center;color:#bbb;padding:12px;font-size:13px">暂无评论</div>';
        }
      });
    }
  });
}

// ===== 联系 =====
function openContact() {
  $('conPrice').textContent = CURRENT_ITEM ? '🍞'+Number(CURRENT_ITEM.price).toFixed(2) : '';
  $('conDate').value=''; $('conTime').value=''; $('conLoc').value=''; $('conPhone').value='';
  modal('contactModal',1);
}
function submitContact() {
  var d=$('conDate').value, t=$('conTime').value, loc=$('conLoc').value, phone=$('conPhone').value;
  if(!d||!t){toast('请选时间');return;}
  api('POST','/api/orders',{itemId:CURRENT_ITEM.id,pickupTime:d+' '+t,pickupLocation:loc,contactPhone:phone},1).then(r=>{
    modal('contactModal',0);
    if(r.code===0){ var c=r.data&&r.data.itemContact; toast(c?'对方联系方式: '+c:'已通知对方'); }
    else toast(r.message||'失败');
  });
}

// ===== 发布 =====
function publish() {
  if(!TOKEN){doLogin();return;}
  var title=$('pubTitle').value.trim(), cat=$('pubCat').value, price=parseFloat($('pubPrice').value), contact=$('pubContact').value.trim(), desc=$('pubDesc').value.trim();
  if(!title){toast('请输入标题');return;}
  if(!price||price<=0){toast('请输入心意');return;}
  if(!cat){toast('请选分类');return;}
  api('POST','/api/items',{title,category:cat,price,contact,description:desc},1).then(r=>{
    if(r.code===0){toast('添加成功！');$('pubTitle').value='';$('pubPrice').value='';$('pubContact').value='';$('pubDesc').value='';$('pubCat').value='';showPage('home');loadItems();}
    else toast(r.message||'失败');
  });
}

// ===== 个人中心 =====
function loadProfile() {
  var el=$('profileContent');
  if(!TOKEN){el.innerHTML='<div class="card" style="text-align:center;padding:40px"><button class="btn btn-primary" onclick="doLogin()">登录</button></div>';return;}
  var html='<div class="card" style="text-align:center;padding:24px"><div class="avatar" style="margin:0 auto 12px">'+(USER.nickname?USER.nickname[0]:'?')+'</div><div style="font-size:18px;font-weight:600">'+USER.nickname+'</div></div>';
  html+='<div class="card"><div class="menu-item" onclick="window.location.href=\''+API+'/api/items/my?token='+TOKEN+'\'"><div class="menu-icon" style="background:#e8f5e9">📦</div><div class="menu-text">我的好物</div><span class="menu-arrow">›</span></div><div class="menu-item" onclick="loadNotice()"><div class="menu-icon" style="background:#fff7e6">📢</div><div class="menu-text">公告</div><span class="menu-arrow">›</span></div></div>';
  html+='<div class="card"><div class="menu-item" onclick="logout()"><div class="menu-icon" style="background:#fff0f0">🚪</div><div class="menu-text" style="color:#ff4d4f">退出登录</div></div></div>';
  el.innerHTML=html;
}

function logout() {
  if(confirm('确定退出？')){localStorage.clear();TOKEN='';USER={};toast('已退出');showPage('home');loadItems();loadProfile();}
}

// ===== 公告 =====
function loadNotice() {
  api('GET','/api/announcements/latest').then(r=>{
    if(r.code===0&&r.data){$('noticeTitle').textContent=r.data.title;$('noticeBody').textContent=r.data.content;modal('noticeModal',1);}
    else toast('暂无公告');
  });
}

// ===== 初始化 =====
function loadBanners() {
  api('GET','/api/items',{page:1,category:''}).then(function(){});
  var banners = ['📢 广告位招租','📢 广告位招租','📢 广告位招租'];
  var html = '<div style="display:flex;gap:8px;padding:0 8px;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:8px">';
  banners.forEach(function(b){
    html += '<div style="min-width:100%;height:120px;background:linear-gradient(135deg,#07c160,#05a34e);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:600;letter-spacing:2px">'+b+'</div>';
  });
  html += '</div>';
  $('bannerArea').innerHTML = html;
}

window.onload = function() {
  initHome();
  loadBanners();
  loadItems();
  loadProfile();
  
  // 自动登录
  if(!TOKEN){
    $('loginNotice').innerHTML = '<div class="card" style="text-align:center;padding:24px"><div style="font-size:16px;margin-bottom:12px">欢迎使用校内好物圈</div><button class="btn btn-primary" onclick="doLogin()" style="max-width:200px;margin:0 auto">开始使用</button></div>';
  }
};
