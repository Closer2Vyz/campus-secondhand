# 🏫 校内二手交易小程序

面向校内学生的 C2C 二手交易平台。卖家上架闲置物品，买家下单并预约自提时间，平台抽取服务费。

## 功能

| 角色 | 功能 |
|------|------|
| 👤 买家 | 浏览商品、分类筛选、搜索、下单选择自提时间、查看订单 |
| 📦 卖家 | 发布商品（标题/描述/图片/分类/价格）、下架、查看订单 |
| 💰 平台 | 收取服务费（默认 5%，买家承担） |

## 项目结构

```
campus-secondhand/
├── server/                    # 后端 API
│   ├── app.js                 # Express 入口
│   ├── config.js              # 配置（端口/费率/分类）
│   ├── db.js                  # SQLite 数据库初始化
│   ├── package.json
│   ├── middleware/
│   │   └── auth.js            # JWT 认证中间件
│   └── routes/
│       ├── auth.js            # 微信登录 / 模拟登录
│       ├── items.js           # 商品 CRUD
│       └── orders.js          # 订单 + 自提
├── miniprogram/               # 微信小程序
│   ├── app.json / app.js / app.wxss
│   ├── assets/                # 占位图片
│   ├── utils/
│   │   ├── api.js             # 请求封装
│   │   ├── config.js          # API 地址
│   │   └── util.js            # 工具函数
│   └── pages/
│       ├── index/             # 首页 - 商品列表
│       ├── item/              # 商品详情 + 下单
│       ├── publish/           # 发布商品
│       ├── my-items/          # 我的发布
│       ├── my-orders/         # 我的订单
│       ├── order-detail/      # 订单详情
│       └── profile/           # 个人中心
└── README.md
```

## 快速启动

### 1. 启动后端

```bash
cd campus-secondhand/server
npm install
node app.js
```

服务在 **http://localhost:3000** 启动，数据库自动创建。

### 2. 打开小程序

用 **微信开发者工具** 打开 `campus-secondhand/miniprogram/` 目录。

### 3. 配置 API 地址

修改 `miniprogram/utils/config.js`：

```js
// 电脑上预览用 localhost
baseURL: 'http://localhost:3000'

// 手机预览改为电脑局域网 IP
baseURL: 'http://192.168.x.x:3000'
```

> ⚠️ 微信开发者工具 → 详情 → 本地设置 → 勾选"不校验合法域名"

### 4. 登录方式

- **开发阶段**：个人中心 → 点击"开发模式模拟登录" → 输入学号即可
- **正式部署**：配置小程序 AppID/Secret 后启用微信一键登录

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| GET | /api/items | 商品列表（分页/分类/搜索） |
| GET | /api/items/:id | 商品详情 |
| POST | /api/items | 发布商品 |
| PUT | /api/items/:id | 编辑商品 |
| DELETE | /api/items/:id | 下架商品 |
| POST | /api/orders | 下单 |
| GET | /api/orders/my | 我买到的 |
| GET | /api/orders/sold | 我卖出的 |
| PUT | /api/orders/:id/pickup | 确认自提 |
| PUT | /api/orders/:id/cancel | 取消订单 |

## 费用说明

- 默认服务费率：**5%**（买家额外支付）
- 例：商品标价 ¥100 → 买家实付 ¥105
- 费率在 `server/config.js` 中修改 `serviceFeeRate` 字段

## 部署建议

| 环境 | 建议 |
|------|------|
| 开发 | 本地运行，手机和电脑连同一 WiFi |
| 校内 | 申请学校服务器或云服务器轻量应用（1核2G） |
| 图片存储 | 校内用本地文件系统；上量后改用 OSS |
| 支付 | 当面支付，暂不接入微信支付 |
| 小程序发布 | 需微信小程序 AppID + 备案域名 |
