const https = require('https');
const fs = require('fs');
const path = require('path');

const API = 'https://campus-secondhand-production-023e.up.railway.app';
const SRC = path.join(__dirname, 'index.html');
const DEST = path.join(__dirname, '..', 'server', 'public', 'index.html');

// 最简单的单页Web版 - 用移动端适配
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>校内好物圈</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Helvetica Neue',sans-serif;background:#f5f5f5;color:#333;max-width:480px;margin:0 auto;min-height:100vh}
/* 通用组件 */
.page{display:none;padding-bottom:70px}
.page.active{display:block}
.header{background:linear-gradient(135deg,#07c160,#05a34e);color:#fff;padding:50px 16px 14px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
.header h1{font-size:18px;font-weight:600}
.header-btn{color:#fff;font-size:14px;cursor:pointer;padding:4px 8px}
.header-btn:active{opacity:.7}
.tabbar{position:fixed;bottom:0;left:0;right:0;max-width:480px;margin:0 auto;background:#fff;display:flex;border-top:1px solid #eee;z-index:100;padding-bottom:env(safe-area-inset-bottom)}
.tab-item{flex:1;text-align:center;padding:8px 0 6px;font-size:11px;color:#999;cursor:pointer;transition:color .2s}
.tab-item.active{color:#07c160}
.tab-icon{font-size:22px;display:block;margin-bottom:2px}
/* 搜索 */
.s-bar{display:flex;padding:10px 12px;gap:8px;background:#fff;border-bottom:1px solid #f0f0f0}
.s-wrap{flex:1;display:flex;background:#f5f5f5;border-radius:20px;padding:0 12px;align-items:center}
.s-wrap .icon{font-size:16px;margin-right:6px}
.s-wrap input{flex:1;height:36px;border:none;outline:none;font-size:14px;background:transparent;color:#333}
.s-btn{background:#07c160;color:#fff;border:none;border-radius:20px;padding:0 20px;font-size:14px;cursor:pointer;font-weight:500}
/* 分类 */
.cats{display:flex;padding:10px 12px;gap:8px;overflow-x:auto;background:#fff;border-bottom:1px solid #f0f0f0}
.cat{padding:6px 16px;border-radius:20px;font-size:13px;background:#f5f5f5;white-space:nowrap;cursor:pointer;transition:all .2s}
.cat.active{background:#e8f5e9;color:#07c160;font-weight:500}
/* 排序 */
.sort-row{display:flex;padding:8px 12px;gap:8px;background:#fff;border-bottom:1px solid #f0f0f0}
.sort-btn{padding:4px 12px;border-radius:12px;font-size:12px;border:1px solid #eee;background:#fff;cursor:pointer;color:#999}
.sort-btn.active{color:#07c160;border-color:#07c160;background:#e8f5e9}
/* 商品列表 - 两列 */
.grid{display:flex;flex-wrap:wrap;padding:6px;gap:6px}
.card{width:calc(50% - 3px);background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.04);cursor:pointer;transition:transform .15s}
.card:active{transform:scale(.98)}
.card-img{width:100%;height:170px;background:#f0f0f0;object-fit:cover;display:block}
.card-info{padding:10px 12px 14px}
.card-title{font-size:14px;font-weight:500;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.4;color:#333}
.card-price{font-size:16px;color:#f60;font-weight:700;margin-top:6px;display:block}
.card-meta{font-size:11px;color:#bbb;margin-top:4px;display:flex;justify-content:space-between}
.card-author{font-size:11px;color:#bbb}
/* 详情 */
.detail-img{width:100%;height:300px;background:#f0f0f0;object-fit:cover;display:block}
.detail-body{padding:16px}
.detail-title{font-size:20px;font-weight:700;color:#222}
.detail-price{font-size:28px;color:#f60;font-weight:800;margin:10px 0}
.detail-tags{display:flex;gap:8px;margin-bottom:16px}
.detail-tag{padding:3px 12px;border-radius:12px;font-size:12px;background:#e8f5e9;color:#07c160}
.detail-section{background:#fff;border-radius:12px;padding:16px;margin-bottom:10px}
.detail-section-title{font-size:14px;font-weight:600;margin-bottom:8px;color:#333}
.detail-text{font-size:14px;color:#555;line-height:1.8}
.detail-seller{display:flex;align-items:center;gap:12px;padding:12px 0}
.detail-avatar{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#07c160,#05a34e);display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:600;flex-shrink:0}
.detail-name{font-size:15px;font-weight:600;color:#333}
.detail-contact{font-size:13px;color:#07c160;margin-top:2px}
/* 底部操作栏 */
.action-bar{position:fixed;bottom:50px;left:0;right:0;max-width:480px;margin:0 auto;background:rgba(255,255,255,.97);display:flex;align-items:center;justify-content:space-between;padding:10px 16px;padding-bottom:calc(10px + env(safe-area-inset-bottom));border-top:1px solid rgba(0,0,0,.05);z-index:50}
.action-price{font-size:22px;color:#f60;font-weight:800}
.action-btn{background:linear-gradient(135deg,#07c160,#05a34e);color:#fff;border:none;border-radius:25px;padding:10px 36px;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(7,193,96,.3)}
.action-btn:active{opacity:.9}
/* 表单卡片 */
.form-card{background:#fff;border-radius:12px;padding:20px;margin:12px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.form-group{margin-bottom:16px}
.form-group:last-child{margin-bottom:0}
.form-label{font-size:13px;color:#666;margin-bottom:6px;display:block;font-weight:500}
.form-input,.form-select{width:100%;padding:12px 14px;font-size:14px;border:1px solid #e8e8e8;border-radius:10px;outline:none;background:#fafafa;transition:all .2s;box-sizing:border-box;color:#333;font-family:inherit}
.form-input:focus,.form-select:focus{border-color:#07c160;background:#fff;box-shadow:0 0 0 3px rgba(7,193,96,.08)}
.form-textarea{resize:none;height:100px}
/* 头像上传 */
.avatar-upload{width:80px;height:80px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:28px;color:#bbb;cursor:pointer;overflow:hidden;margin:0 auto 16px;border:2px dashed #ddd}
.avatar-upload img{width:100%;height:100%;object-fit:cover}
/* 按钮 */
.btn{display:block;width:100%;padding:13px 0;font-size:15px;font-weight:600;border:none;border-radius:25px;cursor:pointer;text-align:center;transition:opacity .2s}
.btn:active{opacity:.85}
.btn-primary{background:linear-gradient(135deg,#07c160,#05a34e);color:#fff}
.btn-secondary{background:#f0f0f0;color:#666}
.btn-danger{background:#fee;color:#e55}
.btn-block{margin-top:12px}
/* 弹窗 */
.modal{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.45);z-index:200;align-items:flex-end;justify-content:center}
.modal.active{display:flex}
.modal-inner{background:#fff;border-radius:20px 20px 0 0;width:100%;max-width:480px;padding:28px 20px;padding-bottom:calc(28px + env(safe-area-inset-bottom));max-height:80vh;overflow-y:auto}
.modal-title{font-size:18px;font-weight:700;text-align:center;margin-bottom:20px;color:#222}
/* 空状态 */
.empty{padding:80px 0;text-align:center;color:#bbb;font-size:14px;width:100%}
.empty-icon{font-size:48px;display:block;margin-bottom:12px}
/* 加载 */
.loading{padding:40px;text-align:center;color:#bbb;font-size:14px;width:100%}
.spinner{display:inline-block;width:24px;height:24px;border:3px solid #e0e0e0;border-top-color:#07c160;border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
/* Toast */
.toast{position:fixed;top:45%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.78);color:#fff;padding:12px 28px;border-radius:12px;font-size:14px;z-index:999;display:none;pointer-events:none;text-align:center;max-width:80%;line-height:1.6}
/* 个人中心 */
.profile-header{background:linear-gradient(135deg,#07c160,#05a34e);padding:30px 0;text-align:center;color:#fff}
.profile-avatar{width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:600;margin:0 auto 10px;border:3px solid rgba(255,255,255,.3)}
.profile-name{font-size:20px;font-weight:600}
.profile-campus{font-size:13px;opacity:.8;margin-top:4px}
.profile-menu{background:#fff;border-radius:12px;margin:12px;overflow:hidden}
.profile-item{display:flex;align-items:center;padding:16px;border-bottom:1px solid #f5f5f5;cursor:pointer}
.profile-item:last-child{border-bottom:none}
.profile-item:active{background:#f9f9f9}
.menu-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;margin-right:12px}
.menu-icon.green{background:#e8f5e9}
.menu-icon.orange{background:#fff3e0}
.menu-icon.blue{background:#e3f2fd}
.menu-icon.purple{background:#f3e5f5}
.menu-text{font-size:14px;font-weight:500;color:#333}
.menu-desc{font-size:12px;color:#bbb;margin-top:2px}
.menu-arrow{margin-left:auto;color:#ccc;font-size:18px}
/* 评论区 */
.comment{padding:12px 0;border-bottom:1px solid #f0f0f0}
.comment:last-child{border-bottom:none}
.comment-header{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.comment-name{font-size:13px;font-weight:500;color:#333}
.comment-time{font-size:11px;color:#bbb;margin-left:auto}
.comment-text{font-size:14px;color:#555;line-height:1.6;padding-left:0}
.comment-input-row{display:flex;gap:8px;margin-top:12px}
.comment-input{flex:1;border:1px solid #eee;border-radius:20px;padding:8px 14px;font-size:13px;outline:none;background:#fafafa}
.comment-send{background:#07c160;color:#fff;border:none;border-radius:20px;padding:8px 20px;font-size:13px;cursor:pointer}
/* 订单列表 */
.order-item{display:flex;padding:12px 0;border-bottom:1px solid #f5f5f5;cursor:pointer}
.order-item:last-child{border-bottom:none}
.order-img{width:60px;height:60px;border-radius:8px;background:#f0f0f0;object-fit:cover;flex-shrink:0}
.order-info{flex:1;margin-left:12px}
.order-title{font-size:14px;font-weight:500;color:#333}
.order-price{font-size:14px;color:#f60;font-weight:600;margin-top:4px}
.order-status{font-size:12px;color:#999;margin-top:2px}
/* 我的发布列表 */
.my-item{display:flex;padding:12px 0;border-bottom:1px solid #f0f0f0}
.my-item:last-child{border-bottom:none}
.my-img{width:60px;height:60px;border-radius:8px;background:#f0f0f0;object-fit:cover;flex-shrink:0}
.my-info{flex:1;margin:0 12px}
.my-title{font-size:14px;font-weight:500;color:#333}
.my-price{font-size:14px;color:#f60;font-weight:600;margin-top:4px}
.my-status{font-size:11px;padding:2px 8px;border-radius:8px;display:inline-block;margin-top:4px}
.my-status.active{background:#e8f5e9;color:#07c160}
.my-status.sold{background:#fff3e0;color:#f60}
.my-status.inactive{background:#f5f5f5;color:#999}
.my-actions{display:flex;flex-direction:column;gap:6px;justify-content:center}
.my-btn{padding:6px 14px;font-size:12px;border:none;border-radius:15px;cursor:pointer;font-weight:500}
.my-btn.sold{background:#07c160;color:#fff}
.my-btn.del{background:#fff0f0;color:#e55}
</style>
</head>
<body>
<div id="toast" class="toast"></div>
<div id="loadingToast" class="toast" style="background:transparent"><div class="spinner"></div></div>

<!-- 首页 -->
<div id="page-home" class="page active">
  <div class="header"><h1>校内好物圈</h1><span class="header-btn" id="noticeBtn">📢</span></div>
  <div class="s-bar"><div class="s-wrap"><span class="icon">🔍</span><input id="searchInput" placeholder="搜索好物" onkeydown="if(event.key==='Enter')doSearch()"/></div><button class="s-btn" onclick="doSearch()">搜索</button></div>
  <div class="cats" id="catBar"></div>
  <div class="sort-row" id="sortBar"><span class="sort-btn active" data-sort="time_desc">最新</span><span class="sort-btn" data-sort="price_asc">心意↑</span><span class="sort-btn" data-sort="price_desc">心意↓</span></div>
  <div class="grid" id="itemGrid"></div>
  <div id="loadMore" class="loading" onclick="loadItems()">点击加载更多</div>
</div>

<!-- 详情 -->
<div id="page-detail" class="page">
  <div class="header"><span class="header-btn" onclick="goHome()">←</span><h1>详情</h1><span></span></div>
  <div id="detailBody"></div>
</div>

<!-- 发布 -->
<div id="page-publish" class="page">
  <div class="header"><span class="header-btn" onclick="goHome()">←</span><h1>添加好物</h1><span></span></div>
  <div class="form-card">
    <div class="form-group"><label class="form-label">📝 标题</label><input class="form-input" id="pubTitle" placeholder="输入标题" /></div>
    <div class="form-group"><label class="form-label">🏷️ 分类</label><select class="form-select" id="pubCat"><option value="">请选择</option><option>教材</option><option>数码</option><option>生活</option><option>体育</option><option>其他</option><option>虚拟物品</option></select></div>
    <div class="form-group"><label class="form-label">🍞 心意</label><input class="form-input" id="pubPrice" placeholder="0.00" type="number" step="0.01" /></div>
    <div class="form-group"><label class="form-label">📞 联系方式</label><input class="form-input" id="pubContact" placeholder="微信号或手机号" /></div>
    <div class="form-group"><label class="form-label">📄 描述</label><textarea class="form-input form-textarea" id="pubDesc" placeholder="描述好物情况"></textarea></div>
    <button class="btn btn-primary" onclick="doPublish()">添加好物</button>
  </div>
</div>

<!-- 个人中心 -->
<div id="page-profile" class="page">
  <div class="profile-header"><div class="profile-avatar" id="profileAvatar">?</div><div class="profile-name" id="profileName">未登录</div><div class="profile-campus" id="profileCampus"></div></div>
  <div id="profileBody"></div>
</div>

<!-- 联系弹窗 -->
<div class="modal" id="contactModal"><div class="modal-inner">
  <div class="modal-title">📦 联系信息</div>
  <div class="form-group"><label class="form-label">📅 日期</label><input class="form-input" id="conDate" type="date" /></div>
  <div class="form-group"><label class="form-label">⏰ 时间</label><input class="form-input" id="conTime" type="time" /></div>
  <div class="form-group"><label class="form-label">📍 地点</label><input class="form-input" id="conLoc" placeholder="如图书馆、食堂" /></div>
  <div class="form-group"><label class="form-label">📞 你的手机号</label><input class="form-input" id="conPhone" placeholder="方便对方联系你" type="tel" /></div>
  <div style="background:#f8f8f8;border-radius:10px;padding:12px;margin-bottom:16px;display:flex;justify-content:space-between;font-size:14px"><span>心意</span><span id="conPrice" style="font-weight:700;color:#f60"></span></div>
  <button class="btn btn-primary" onclick="submitContact()">去联系</button>
  <button class="btn btn-secondary btn-block" onclick="closeModal('contactModal')">取消</button>
</div></div>

<!-- 公告弹窗 -->
<div class="modal" id="noticeModal"><div class="modal-inner">
  <div class="modal-title">📢 公告</div>
  <div id="noticeContent" style="font-size:14px;line-height:1.8;color:#555;white-space:pre-wrap;margin-bottom:16px"></div>
  <button class="btn btn-primary" onclick="closeModal('noticeModal')">知道了</button>
</div></div>

<!-- 登录弹窗 -->
<div class="modal" id="loginModal"><div class="modal-inner">
  <div class="modal-title">👤 登录</div>
  <div class="form-group"><label class="form-label">昵称</label><input class="form-input" id="loginName" placeholder="输入昵称" value="用户" /></div>
  <button class="btn btn-primary" onclick="doLogin()">登录</button>
</div></div>

<div class="tabbar">
  <div class="tab-item active" onclick="showPage('home')"><span class="tab-icon">🏠</span>首页</div>
  <div class="tab-item" onclick="showPage('publish')"><span class="tab-icon">➕</span>添加</div>
  <div class="tab-item" onclick="showPage('profile')"><span class="tab-icon">👤</span>我的</div>
</div>

<script>
const API = '';
let token=localStorage.getItem('token')||'', user=JSON.parse(localStorage.getItem('user')||'{}'), curItem=null, page=1, sortBy='time_desc', kw='', cat='';
const cats=['全部','教材','数码','生活','体育','其他','虚拟物品'];

function t(m){const e=document.getElementById('toast');e.textContent=m;e.style.display='block';setTimeout(()=>e.style.display='none',2500)}
function loading(b){document.getElementById('loadingToast').style.display=b?'block':'none'}
function showPage(n){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));const el=document.getElementById('page-'+n);if(el)el.classList.add('active');document.querySelectorAll('.tab-item').forEach((e,i)=>e.classList.toggle('active',n==='home'&&i===0||n==='publish'&&i===1||n==='profile'&&i===2))}
function openModal(id){document.getElementById(id).classList.add('active')}
function closeModal(id){document.getElementById(id).classList.remove('active')}
function goHome(){showPage('home')}

function api(m,p,d,a){
  var o={method:m,headers:{'Content-Type':'application/json'}};
  if(d&&m!=='GET')o.body=JSON.stringify(d);
  if(a&&token)o.headers['Authorization']='Bearer '+token;
  var u=API+'/api'+p;
  if(d&&m==='GET')u+='?'+new URLSearchParams(Object.fromEntries(Object.entries(d).filter(([_,v])=>v!==undefined&&v!==null&&v!=='')));
  return fetch(u,o).then(r=>r.json());
}

// 分类栏
var catEl=document.getElementById('catBar');
cats.forEach((c,i)=>{var el=document.createElement('span');el.className='cat'+(i===0?' active':'');el.textContent=c;el.onclick=()=>{catEl.querySelectorAll('.cat').forEach(e=>e.classList.remove('active'));el.classList.add('active');cat=c==='全部'?'':c;page=1;loadItems()};catEl.appendChild(el)});

// 排序
document.getElementById('sortBar').addEventListener('click',function(e){
  if(e.target.dataset.sort){sortBy=e.target.dataset.sort;document.querySelectorAll('.sort-btn').forEach(b=>b.classList.remove('active'));e.target.classList.add('active');page=1;loadItems()}
});

function doSearch(){kw=document.getElementById('searchInput').value;page=1;loadItems()}
document.getElementById('searchInput').addEventListener('input',function(){kw=this.value});

function loadItems(){
  loading(true);
  api('GET','/items',{page,category:cat,keyword:kw,sort:sortBy}).then(r=>{
    loading(false);
    if(r.code!==0)return;
    var grid=document.getElementById('itemGrid');
    if(page===1)grid.innerHTML='';
    (r.data.list||[]).forEach(item=>{
      var img=item.images&&item.images[0]?API+item.images[0]:'';
      var div=document.createElement('div');div.className='card';
      div.innerHTML='<img class="card-img" src="'+img+'" onerror="this.style.display=\'none\'" /><div class="card-info"><div class="card-title">'+esc(item.title)+'</div><span class="card-price">🍞'+item.price.toFixed(2)+'</span><div class="card-meta"><span>'+item.category+'</span><span class="card-author">'+esc(item.sellerName||'')+'</span></div></div>';
      div.onclick=()=>loadDetail(item.id);
      grid.appendChild(div);
    });
    if(r.data.list.length===0&&page===1)grid.innerHTML='<div class="empty"><span class="empty-icon">📭</span>暂无好物</div>';
    document.getElementById('loadMore').textContent=r.data.page<r.data.totalPages?'点击加载更多':'';
  });
}

function esc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML}

function loadDetail(id){
  showPage('detail');
  document.getElementById('detailBody').innerHTML='<div class="loading"><div class="spinner"></div></div>';
  api('GET','/items/'+id).then(r=>{
    if(r.code!==0){t('加载失败');return}
    var item=r.data;curItem=item;
    var img=item.images&&item.images[0]?API+item.images[0]:'';
    var h='';
    if(img)h+='<img class="detail-img" src="'+img+'" onerror="this.style.display=\'none\'" />';
    h+='<div class="detail-body">';
    h+='<div class="detail-title">'+esc(item.title)+'</div>';
    h+='<div class="detail-price">🍞'+item.price.toFixed(2)+'</div>';
    h+='<div class="detail-tags"><span class="detail-tag">'+item.category+'</span></div>';
    h+='</div>';
    h+='<div class="detail-section"><div class="detail-section-title">📝 描述</div><div class="detail-text">'+(item.description||'暂无描述')+'</div></div>';
    h+='<div class="detail-section"><div class="detail-seller"><div class="detail-avatar">'+(item.sellerName?item.sellerName[0]:'?')+'</div><div><div class="detail-name">'+esc(item.sellerName||'匿名')+'</div></div></div></div>';
    
    // 评论区
    api('GET','/comments/'+item.id).then(r2=>{
      if(r2.code===0&&r2.data.list.length>0){
        h+='<div class="detail-section"><div class="detail-section-title">💬 评论 ('+r2.data.list.length+')</div>';
        r2.data.list.forEach(c=>{h+='<div class="comment"><div class="comment-header"><span class="comment-name">'+esc(c.userName)+'</span><span class="comment-time">'+fmtTime(c.createdAt)+'</span></div><div class="comment-text">'+esc(c.content)+'</div></div>'});
        h+='</div>';
      }
      document.getElementById('detailBody').innerHTML=h;
    }).catch(()=>{document.getElementById('detailBody').innerHTML=h;});
    
    // 底部操作栏 - 放在页面外
    var footer=document.createElement('div');footer.className='action-bar';
    footer.innerHTML='<span class="action-price">🍞'+item.price.toFixed(2)+'</span><button class="action-btn" onclick="openContact()">联系对方</button>';
    document.getElementById('detailBody').appendChild(footer);
  });
}

function openContact(){
  if(!token){t('请先登录');openModal('loginModal');return}
  if(!curItem)return;
  document.getElementById('conPrice').textContent='🍞'+curItem.price.toFixed(2);
  document.getElementById('conDate').value='';document.getElementById('conTime').value='';
  document.getElementById('conLoc').value='';document.getElementById('conPhone').value='';
  openModal('contactModal');
}

function submitContact(){
  var d=document.getElementById('conDate').value,tm=document.getElementById('conTime').value;
  if(!d||!tm){t('请选择时间');return}
  api('POST','/orders',{itemId:curItem.id,pickupTime:d+' '+tm,pickupLocation:document.getElementById('conLoc').value,contactPhone:document.getElementById('conPhone').value},true).then(r=>{
    closeModal('contactModal');
    if(r.code===0){t('已通知对方');if(r.data&&r.data.itemContact)t('联系方式：'+r.data.itemContact)}
    else t(r.message||'失败');
  });
}

function doPublish(){
  if(!token){t('请先登录');openModal('loginModal');return}
  var title=document.getElementById('pubTitle').value.trim();
  var cat=document.getElementById('pubCat').value;
  var price=parseFloat(document.getElementById('pubPrice').value);
  var contact=document.getElementById('pubContact').value.trim();
  var desc=document.getElementById('pubDesc').value.trim();
  if(!title){t('请输入标题');return}
  if(!price||price<=0){t('请输入心意');return}
  if(!cat){t('请选择分类');return}
  loading(true);
  api('POST','/items',{title,category:cat,price,contact,description:desc},true).then(r=>{
    loading(false);
    if(r.code===0){
      t('添加成功！');
      document.getElementById('pubTitle').value='';document.getElementById('pubPrice').value='';
      document.getElementById('pubContact').value='';document.getElementById('pubDesc').value='';
      showPage('home');loadItems();
    }else t(r.message||'失败');
  });
}

function doLogin(){
  var name=document.getElementById('loginName').value.trim()||'用户';
  api('POST','/auth/login',{mockOpenid:'web_'+Date.now(),nickname:name}).then(r=>{
    if(r.code===0){
      token=r.data.token;user=r.data.user;
      localStorage.setItem('token',token);localStorage.setItem('user',JSON.stringify(user));
      closeModal('loginModal');t('登录成功');loadProfile();loadItems();
    }else t(r.message||'登录失败');
  });
}

function loadProfile(){
  if(!token){
    document.getElementById('profileAvatar').textContent='?';
    document.getElementById('profileName').textContent='未登录';
    document.getElementById('profileCampus').textContent='';
    document.getElementById('profileBody').innerHTML='<div class="form-card"><button class="btn btn-primary" onclick="openModal(\'loginModal\')">登录</button></div>';
    return;
  }
  document.getElementById('profileAvatar').textContent=(user.nickname||'?')[0];
  document.getElementById('profileName').textContent=user.nickname||'用户';
  document.getElementById('profileCampus').textContent=user.campus?'📍 '+user.campus:'';
  
  var h='<div class="profile-menu">';
  h+='<div class="profile-item" onclick="loadMyItems()"><div class="menu-icon green">📦</div><div><div class="menu-text">我的好物</div><div class="menu-desc">查看和管理你添加的好物</div></div><span class="menu-arrow">›</span></div>';
  h+='<div class="profile-item" onclick="t(\'功能开发中，请使用小程序\')"><div class="menu-icon orange">📋</div><div><div class="menu-text">我的记录</div><div class="menu-desc">查看联系记录</div></div><span class="menu-arrow">›</span></div>';
  h+='</div>';
  h+='<div class="form-card"><button class="btn btn-secondary" onclick="logout()">退出登录</button></div>';
  document.getElementById('profileBody').innerHTML=h;
}

function logout(){
  localStorage.clear();token='';user={};t('已退出');loadProfile();
}

function loadMyItems(){
  if(!token){t('请先登录');return}
  showPage('detail');
  document.getElementById('detailBody').innerHTML='<div class="loading"><div class="spinner"></div></div>';
  api('GET','/items/my',{status:'active'},true).then(r=>{
    if(r.code!==0){t('加载失败');return}
    var h='<div style="padding:16px"><div style="font-size:16px;font-weight:600;margin-bottom:12px">📦 我的好物</div>';
    if(r.data.list.length===0)h+='<div class="empty"><span class="empty-icon">📭</span>暂无好物</div>';
    else r.data.list.forEach(item=>{
      h+='<div class="my-item"><div><img class="my-img" src="'+(item.images&&item.images[0]?API+item.images[0]:'')+'" onerror="this.style.display=\'none\'" /></div><div class="my-info"><div class="my-title">'+esc(item.title)+'</div><div class="my-price">🍞'+item.price.toFixed(2)+'</div><span class="my-status '+item.status+'">'+itemStatus(item.status)+'</span></div><div class="my-actions"><button class="my-btn sold" onclick="markSold(\''+item._id+'\')">已完成</button><button class="my-btn del" onclick="delItem(\''+item._id+'\')">🗑删除</button></div></div>';
    });
    h+='</div>';
    document.getElementById('detailBody').innerHTML=h;
  });
}

function itemStatus(s){return{active:'展示中',sold:'已完成',inactive:'已隐藏'}[s]||s}

function markSold(id){
  if(!confirm('确认已完成？'))return;
  loading(true);
  api('PUT','/items/'+id,{status:'sold'},true).then(r=>{loading(false);t(r.message||'完成');loadMyItems()});
}

function delItem(id){
  if(!confirm('确定删除？不可恢复'))return;
  loading(true);
  api('DELETE','/items/'+id,null,true).then(r=>{loading(false);t(r.message||'已删除');loadMyItems()});
}

// 公告
document.getElementById('noticeBtn').onclick=()=>{
  api('GET','/announcements/latest').then(r=>{
    if(r.code===0&&r.data){
      document.getElementById('noticeContent').textContent=r.data.title+'\n\n'+r.data.content;
      openModal('noticeModal');
    }else t('暂无公告');
  });
};

function fmtTime(t){if(!t)return'';try{var d=new Date(t.replace(' ','T'));return Math.floor((Date.now()-d)/3600000)+'小时前'}catch(e){}return''}

// 初始化
loadItems();
if(!token)setTimeout(()=>openModal('loginModal'),500);
else loadProfile();
</script>
</body>
</html>`;

fs.writeFileSync(DEST, html);
console.log('✅ Web版已生成: ' + DEST);
console.log('   大小: ' + (html.length / 1024).toFixed(1) + 'KB');
