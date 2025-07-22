const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const apiRoutes = require('./routes/api');
const imageCacheService = require('./services/imageCacheService');

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 确保数据目录存在
const dataPath = path.join(__dirname, 'data');
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// 静态文件服务 - 提供缓存的图片
app.use('/cache/images', express.static(path.join(__dirname, 'data/images')));

// API 路由
app.use('/api', apiRoutes);

// 首页路由
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>豆瓣用户数据服务</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
          }
          h1 {
            color: #007722;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
          }
          h2 {
            color: #007722;
            margin-top: 30px;
          }
          code {
            background: #f4f4f4;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: monospace;
          }
          pre {
            background: #f4f4f4;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
          }
          .endpoint {
            margin-bottom: 20px;
          }
          .method {
            font-weight: bold;
            color: #e74c3c;
          }
          .url {
            color: #2980b9;
          }
        </style>
      </head>
      <body>
        <h1>豆瓣用户数据服务</h1>
        <p>这是一个获取豆瓣用户已看电影、电视剧和已读书籍数据的服务。</p>
        <p>所有获取的数据都经过过滤，只保留以下信息：名字、标记时间、用户评论、用户评分和图片链接。</p>
        
        <h2>API 接口</h2>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <span class="url">/api/users</span></p>
          <p>获取所有已保存的用户列表</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <span class="url">/api/users/:uid</span></p>
          <p>获取指定用户的所有数据</p>
          <p>可选参数: <code>?refresh=true</code> 强制获取最新数据，<code>?validateCache=false</code> 跳过图片缓存验证</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <span class="url">/api/users/:uid/stats</span></p>
          <p>获取用户统计数据</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <span class="url">/api/users/:uid/movies</span></p>
          <p>获取用户看过的电影</p>
          <p>可选参数: <code>?status=done|doing|mark</code> 按状态过滤，<code>?refresh=true</code> 强制刷新，<code>?validateCache=false</code> 跳过图片缓存验证</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <span class="url">/api/users/:uid/tvshows</span></p>
          <p>获取用户看过的电视剧</p>
          <p>可选参数: <code>?status=done|doing|mark</code> 按状态过滤，<code>?refresh=true</code> 强制刷新，<code>?validateCache=false</code> 跳过图片缓存验证</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <span class="url">/api/users/:uid/books</span></p>
          <p>获取用户读过的书籍</p>
          <p>可选参数: <code>?status=done|doing|mark</code> 按状态过滤，<code>?refresh=true</code> 强制刷新，<code>?validateCache=false</code> 跳过图片缓存验证</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <span class="url">/api/items/:type/:id</span></p>
          <p>获取特定内容的详情 (只包含名字、评分和图片)</p>
          <p>类型(type): movie, book, music</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">POST</span> <span class="url">/api/fetch/:uid</span></p>
          <p>强制从豆瓣API获取最新数据</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <span class="url">/api/fetch/:uid</span></p>
          <p>使用GET方法强制从豆瓣API获取最新数据（便于浏览器直接访问）</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <span class="url">/api/cache/stats</span></p>
          <p>获取图片缓存统计信息</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">POST</span> <span class="url">/api/cache/clean</span></p>
          <p>清理过期的缓存图片（默认保留30天）</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <span class="url">/api/cache/repair/:uid</span></p>
          <p>修复指定用户的图片缓存（重新下载丢失的图片）</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">POST</span> <span class="url">/api/cache/repair/:uid</span></p>
          <p>修复指定用户的图片缓存（重新下载丢失的图片）</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <span class="url">/api/cache/debug/:uid</span></p>
          <p>调试用户的图片缓存状态，查看缓存统计和问题</p>
        </div>
        
        <h2>使用示例</h2>
        <p>获取用户 "ahbei" 的所有看过的电影:</p>
        <pre>GET http://localhost:${PORT}/api/users/ahbei/movies</pre>
        
        <p>获取用户 "ahbei" 正在观看的电影:</p>
        <pre>GET http://localhost:${PORT}/api/users/ahbei/movies?status=doing</pre>
        
        <p>获取用户 "ahbei" 想看的电影:</p>
        <pre>GET http://localhost:${PORT}/api/users/ahbei/movies?status=mark</pre>
        
        <p>获取电影详情:</p>
        <pre>GET http://localhost:${PORT}/api/items/movie/26683723</pre>
        
        <p>强制获取用户 "ahbei" 的最新数据:</p>
        <pre>GET http://localhost:${PORT}/api/fetch/ahbei</pre>
        
        <p>或者在获取用户数据时附加refresh参数:</p>
        <pre>GET http://localhost:${PORT}/api/users/ahbei?refresh=true</pre>
        
        <p>修复用户 "ahbei" 的图片缓存（重新下载丢失的图片）:</p>
        <pre>GET http://localhost:${PORT}/api/cache/repair/ahbei</pre>
        
        <p>跳过图片缓存验证以提高响应速度:</p>
        <pre>GET http://localhost:${PORT}/api/users/ahbei?validateCache=false</pre>
        
        <p>调试用户的图片缓存状态:</p>
        <pre>GET http://localhost:${PORT}/api/cache/debug/ahbei</pre>
        
        <h2>状态说明</h2>
        <p><strong>done:</strong> 已观看（影视）/ 已阅读（书籍）</p>
        <p><strong>doing:</strong> 正在观看（影视）/ 正在阅读（书籍）</p>
        <p><strong>mark:</strong> 想看（影视）/ 想读（书籍）</p>
        
        <h2>图片缓存功能</h2>
        <p>本服务自动缓存豆瓣的图片封面到本地，提高访问速度并减少对豆瓣服务器的请求。</p>
        <p><strong>智能缓存修复:</strong> 系统会自动检测丢失的缓存图片并重新下载，确保图片始终可用。</p>
        <p><strong>缓存验证:</strong> 默认情况下，每次获取数据时都会验证图片缓存的有效性。如需提高响应速度，可使用 <code>?validateCache=false</code> 参数跳过验证。</p>
        <p><strong>缓存修复:</strong> 使用 <code>/api/cache/repair/:uid</code> 接口可以手动修复指定用户的图片缓存。</p>
        <p>API返回的数据中的图片字段：</p>
        <p><strong>image:</strong> 优先使用本地缓存地址，如果缓存失败或丢失则自动重新下载或使用原始地址</p>
        <p>缓存的图片通过 <code>/cache/images/</code> 路径访问</p>
      </body>
    </html>
  `);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  
  // 启动时清理过期缓存（保留30天）
  setTimeout(() => {
    imageCacheService.cleanCache(30);
  }, 5000); // 5秒后执行，避免阻塞启动
  
  // 每天定时清理缓存
  setInterval(() => {
    imageCacheService.cleanCache(30);
  }, 24 * 60 * 60 * 1000); // 24小时
}); 