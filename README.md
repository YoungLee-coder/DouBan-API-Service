# 豆瓣用户数据服务

基于非官方豆瓣API的Node.js服务，用于获取豆瓣用户已看电影、电视剧和已读书籍数据。

## 功能特点

- 获取豆瓣用户看过的电影和电视剧
- 获取豆瓣用户读过的书籍
- 提供RESTful API接口进行数据查询
- 使用本地文件存储数据，无需数据库
- 自动区分电影和电视剧内容

## 安装与运行

### 前置要求

- Node.js 14.x 或更高版本
- npm 6.x 或更高版本

### 安装步骤

1. 克隆或下载本仓库
2. 进入项目目录
```
cd douban-api-service
```
3. 安装依赖
```
npm install
```
4. 启动服务
```
npm start
```

服务器将在 http://localhost:3000 上运行

## API 接口

### 获取所有已保存的用户
- **GET** `/api/users`

### 获取指定用户的所有数据
- **GET** `/api/users/:uid`
  - `:uid` - 豆瓣用户ID
  - 可选查询参数：`?refresh=true` - 强制从API获取最新数据

### 获取用户统计数据
- **GET** `/api/users/:uid/stats`
  - `:uid` - 豆瓣用户ID

### 获取用户看过的电影
- **GET** `/api/users/:uid/movies`
  - `:uid` - 豆瓣用户ID
  - 可选查询参数：`?status=done|doing|mark` - 按状态过滤，`?refresh=true` - 强制刷新

### 获取用户看过的电视剧
- **GET** `/api/users/:uid/tvshows`
  - `:uid` - 豆瓣用户ID
  - 可选查询参数：`?status=done|doing|mark` - 按状态过滤，`?refresh=true` - 强制刷新

### 获取用户读过的书籍
- **GET** `/api/users/:uid/books`
  - `:uid` - 豆瓣用户ID
  - 可选查询参数：`?status=done|doing|mark` - 按状态过滤，`?refresh=true` - 强制刷新

### 获取特定内容的详情
- **GET** `/api/items/:type/:id`
  - `:type` - 内容类型，如 movie、book
  - `:id` - 内容ID

### 强制从API获取最新数据
- **POST** `/api/fetch/:uid`
  - `:uid` - 豆瓣用户ID
- **GET** `/api/fetch/:uid`
  - `:uid` - 豆瓣用户ID
  - 使用GET方法强制获取最新数据，便于浏览器直接访问

## 使用示例

获取用户"ahbei"的所有看过的电影:
```
GET http://localhost:3000/api/users/ahbei/movies
```

获取电影详情:
```
GET http://localhost:3000/api/items/movie/26683723
```

强制获取用户"ahbei"的最新数据:
```
GET http://localhost:3000/api/fetch/ahbei
```

或者在获取用户数据时使用refresh参数:
```
GET http://localhost:3000/api/users/ahbei?refresh=true
```

获取用户"ahbei"正在观看的电影:
```
GET http://localhost:3000/api/users/ahbei/movies?status=doing
```

获取用户"ahbei"想看的电影:
```
GET http://localhost:3000/api/users/ahbei/movies?status=mark
```

## 状态说明

- **done**: 已观看（影视）/ 已阅读（书籍）
- **doing**: 正在观看（影视）/ 正在阅读（书籍）
- **mark**: 想看（影视）/ 想读（书籍）

## 数据存储

所有获取的数据会保存在 `src/data` 目录下，以JSON文件形式存储。文件命名遵循以下格式：

- 用户所有数据: `{uid}_all_data.json`
- 用户单类型数据: `{uid}_{type}_{status}_all.json`
- 内容详情: `{type}_{id}_detail.json`

## 注意事项

- 此服务使用的是非官方豆瓣API，仅供学习研究使用
- 请控制请求频率，避免过多请求导致API限制
- 数据仅做个人学习研究用途，请勿用于商业用途

## 技术栈

- Node.js
- Express.js
- node-fetch
- 文件系统存储 