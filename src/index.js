const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const apiRoutes = require('./routes/api');

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
          <p>可选参数: <code>?refresh=true</code> 强制获取最新数据</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <span class="url">/api/users/:uid/stats</span></p>
          <p>获取用户统计数据</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <span class="url">/api/users/:uid/movies</span></p>
          <p>获取用户看过的电影</p>
          <p>可选参数: <code>?status=done|doing|mark</code> 按状态过滤，<code>?refresh=true</code> 强制刷新</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <span class="url">/api/users/:uid/tvshows</span></p>
          <p>获取用户看过的电视剧</p>
          <p>可选参数: <code>?status=done|doing|mark</code> 按状态过滤，<code>?refresh=true</code> 强制刷新</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> <span class="url">/api/users/:uid/books</span></p>
          <p>获取用户读过的书籍</p>
          <p>可选参数: <code>?status=done|doing|mark</code> 按状态过滤，<code>?refresh=true</code> 强制刷新</p>
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
        
        <h2>状态说明</h2>
        <p><strong>done:</strong> 已观看（影视）/ 已阅读（书籍）</p>
        <p><strong>doing:</strong> 正在观看（影视）/ 正在阅读（书籍）</p>
        <p><strong>mark:</strong> 想看（影视）/ 想读（书籍）</p>
      </body>
    </html>
  `);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
}); 