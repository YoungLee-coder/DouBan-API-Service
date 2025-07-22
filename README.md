# 豆瓣用户数据服务

基于非官方豆瓣API的Node.js服务，用于获取豆瓣用户已看电影、电视剧和已读书籍数据。

## 功能特点

- 获取豆瓣用户看过的电影和电视剧
- 获取豆瓣用户读过的书籍
- 提供RESTful API接口进行数据查询
- 使用本地文件存储数据，无需数据库
- 自动区分电影和电视剧内容
- **自动图片缓存**: 智能缓存豆瓣图片封面到本地，提高访问速度
- **图片管理**: 提供缓存统计和清理功能

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

### 图片缓存管理
- **GET** `/api/cache/stats`
  - 获取图片缓存统计信息
- **POST** `/api/cache/clean`
  - 清理过期的缓存图片
  - 请求体：`{"days": 30}` - 保留天数，默认30天
- **GET** `/api/cache/clean?days=30`
  - 使用GET方法清理过期缓存图片

### 访问缓存图片
- **GET** `/cache/images/:filename`
  - 直接访问缓存的图片文件

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

查看缓存统计:
```
GET http://localhost:3000/api/cache/stats
```

清理30天前的缓存:
```
POST http://localhost:3000/api/cache/clean
Content-Type: application/json

{"days": 30}
```

或使用GET方法:
```
GET http://localhost:3000/api/cache/clean?days=30
```

## 状态说明

- **done**: 已观看（影视）/ 已阅读（书籍）
- **doing**: 正在观看（影视）/ 正在阅读（书籍）
- **mark**: 想看（影视）/ 想读（书籍）

## 图片缓存功能

### 缓存机制

1. **自动缓存**: 当获取用户数据时，系统会自动下载所有图片并保存到本地
2. **智能命名**: 使用MD5哈希为图片生成唯一文件名，避免重复下载
3. **格式支持**: 支持 jpg, jpeg, png, gif, webp 等常见图片格式
4. **并发控制**: 限制并发下载数量为5个，避免对服务器造成过大压力
5. **错误处理**: 如果图片下载失败，会保留原始豆瓣链接

### API响应说明

API返回的数据包含以下字段：

```json
{
  "name": "电影名称",
  "image": "/cache/images/abc123def456.jpg",  // 如果缓存失败则使用豆瓣原地址
  "markTime": "2023-01-01",
  "comment": "用户评论",
  "rating": 8.5,
  "status": "已观看"
}
```

#### 图片字段说明

- `image`: 智能选择的图片地址
  - 如果成功缓存，则为本地缓存路径（如 `/cache/images/abc123def456.jpg`）
  - 如果缓存失败，则为豆瓣原始地址（如 `https://img1.doubanio.com/...`）

### 自动清理机制

系统会自动执行以下清理任务：

1. **启动时清理**: 服务器启动5秒后自动清理超过30天的缓存文件
2. **定时清理**: 每24小时自动清理一次过期缓存

### 缓存配置

可以通过修改 `src/services/imageCacheService.js` 中的常量来调整：

- `concurrency`: 并发下载数量（默认5）
- `timeout`: 下载超时时间（默认10秒）
- 清理间隔等参数可在 `src/index.js` 中调整

## 数据存储

所有获取的数据会保存在 `src/data` 目录下，以JSON文件形式存储。文件命名遵循以下格式：

- 用户所有数据: `{uid}_all_data.json`
- 用户单类型数据: `{uid}_{type}_{status}_all.json`
- 内容详情: `{type}_{id}_detail.json`

### 图片缓存存储

缓存的图片存储在 `src/data/images/` 目录下，通过 `/cache/images/` 路径访问。图片文件名使用MD5哈希生成，确保唯一性。

## 注意事项

- 此服务使用的是非官方豆瓣API，仅供学习研究使用
- 请控制请求频率，避免过多请求导致API限制
- 数据仅做个人学习研究用途，请勿用于商业用途
- 首次获取用户数据时，由于需要下载图片，响应时间可能较长
- 缓存目录会随着使用逐渐增大，建议定期清理
- 如果豆瓣图片链接失效，会保留原始链接但本地缓存可能失败
- 网络不稳定时可能导致部分图片缓存失败，这不影响数据获取

## 技术栈

- Node.js
- Express.js
- node-fetch
- 文件系统存储 