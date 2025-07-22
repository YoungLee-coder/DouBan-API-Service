const express = require('express');
const router = express.Router();
const doubanService = require('../services/doubanService');
const imageCacheService = require('../services/imageCacheService');

/**
 * @route GET /api/users
 * @desc 获取所有已保存的用户
 */
router.get('/users', (req, res) => {
  try {
    const users = doubanService.getAllSavedUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/users/:uid
 * @desc 获取指定用户的所有数据
<<<<<<< HEAD
 * @query refresh - 可选参数，设置为true时强制从API获取最新数据（会先删除旧数据）
 * @query validateCache - 可选参数，设置为false时跳过图片缓存验证（默认为true）
=======
 * @query refresh - 可选参数，设置为true时强制从API获取最新数据
>>>>>>> parent of 022a20b (更新README、API路由和服务层，添加删除用户数据的功能，优化强制获取最新数据的说明，确保在获取新数据前删除旧数据)
 */
router.get('/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { refresh, validateCache } = req.query;
    
    console.log(`[DEBUG] 路由接收到的参数 - UID: ${uid}, Refresh: ${refresh}, ValidateCache: ${validateCache}`);
    
    // 如果设置了refresh=true，强制从API获取最新数据
    if (refresh === 'true') {
      const data = await doubanService.getUserAllData(uid);
      res.json({ success: true, data, message: '已获取最新数据' });
    } else {
      const shouldValidateCache = validateCache !== 'false';
      const data = await doubanService.getUserData(uid, shouldValidateCache);
      res.json({ success: true, data });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/users/:uid/stats
 * @desc 获取用户统计数据
 */
router.get('/users/:uid/stats', async (req, res) => {
  try {
    const { uid } = req.params;
    const userData = await doubanService.getUserData(uid);
    res.json({ success: true, data: userData.stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/users/:uid/movies
 * @desc 获取用户看过的电影
 * @query status - 可选参数，按状态过滤: done(已观看), doing(正在观看), mark(想看)
 * @query validateCache - 可选参数，设置为false时跳过图片缓存验证（默认为true）
 */
router.get('/users/:uid/movies', async (req, res) => {
  try {
    const { uid } = req.params;
    const { status, refresh, validateCache } = req.query;
    
    // 如果设置了refresh=true，强制从API获取最新数据
    const userData = refresh === 'true' ? 
      await doubanService.getUserAllData(uid) : 
      await doubanService.getUserData(uid, validateCache !== 'false');
    
    let movies = userData.data.movies;
    
    // 如果指定了状态，进行过滤
    if (status) {
      const statusMap = {
        'done': '已观看',
        'doing': '正在观看',
        'mark': '想看'
      };
      const targetStatus = statusMap[status];
      if (targetStatus) {
        movies = movies.filter(movie => movie.status === targetStatus);
      }
    }
    
    res.json({ success: true, data: movies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/users/:uid/tvshows
 * @desc 获取用户看过的电视剧
 * @query status - 可选参数，按状态过滤: done(已观看), doing(正在观看), mark(想看)
 * @query validateCache - 可选参数，设置为false时跳过图片缓存验证（默认为true）
 */
router.get('/users/:uid/tvshows', async (req, res) => {
  try {
    const { uid } = req.params;
    const { status, refresh, validateCache } = req.query;
    
    // 如果设置了refresh=true，强制从API获取最新数据
    const userData = refresh === 'true' ? 
      await doubanService.getUserAllData(uid) : 
      await doubanService.getUserData(uid, validateCache !== 'false');
    
    let tvShows = userData.data.tvShows;
    
    // 如果指定了状态，进行过滤
    if (status) {
      const statusMap = {
        'done': '已观看',
        'doing': '正在观看',
        'mark': '想看'
      };
      const targetStatus = statusMap[status];
      if (targetStatus) {
        tvShows = tvShows.filter(tvShow => tvShow.status === targetStatus);
      }
    }
    
    res.json({ success: true, data: tvShows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/users/:uid/books
 * @desc 获取用户读过的书籍
 * @query status - 可选参数，按状态过滤: done(已阅读), doing(正在阅读), mark(想读)
 * @query validateCache - 可选参数，设置为false时跳过图片缓存验证（默认为true）
 */
router.get('/users/:uid/books', async (req, res) => {
  try {
    const { uid } = req.params;
    const { status, refresh, validateCache } = req.query;
    
    // 如果设置了refresh=true，强制从API获取最新数据
    const userData = refresh === 'true' ? 
      await doubanService.getUserAllData(uid) : 
      await doubanService.getUserData(uid, validateCache !== 'false');
    
    let books = userData.data.books;
    
    // 如果指定了状态，进行过滤
    if (status) {
      const statusMap = {
        'done': '已阅读',
        'doing': '正在阅读',
        'mark': '想读'
      };
      const targetStatus = statusMap[status];
      if (targetStatus) {
        books = books.filter(book => book.status === targetStatus);
      }
    }
    
    res.json({ success: true, data: books });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/items/:type/:id
 * @desc 获取特定内容的详情
 */
router.get('/items/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const data = await doubanService.getItemDetail(type, id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route POST /api/fetch/:uid
 * @desc 强制从API获取最新数据
 */
router.post('/fetch/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const data = await doubanService.getUserAllData(uid);
    res.json({ success: true, message: `已成功获取用户 ${uid} 的最新数据`, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/fetch/:uid
 * @desc 使用GET方法强制从API获取最新数据
 */
router.get('/fetch/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const data = await doubanService.getUserAllData(uid);
    res.json({ success: true, message: `已成功获取用户 ${uid} 的最新数据`, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/cache/stats
 * @desc 获取图片缓存统计信息
 */
router.get('/cache/stats', (req, res) => {
  try {
    const stats = imageCacheService.getCacheStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/cache/files
 * @desc 获取所有缓存文件列表
 */
router.get('/cache/files', (req, res) => {
  try {
    const fileList = imageCacheService.getAllCacheFiles();
    
    res.json({ 
      success: true, 
      data: {
        totalFiles: fileList.length,
        files: fileList,
        cacheDir: imageCacheService.CACHE_DIR,
        cachePolicy: '永不过期 - 图片将永久保存直到手动删除',
        note: '使用POST /api/cache/clean 接口并提供fileNames数组可手动删除指定文件'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route POST /api/cache/clean
 * @desc 手动清理指定的缓存图片文件
 * @body fileNames - 要删除的文件名数组，如果为空则不删除任何文件
 */
router.post('/cache/clean', (req, res) => {
  try {
    const { fileNames = [] } = req.body;
    
    if (!Array.isArray(fileNames) || fileNames.length === 0) {
      return res.json({ 
        success: true, 
        message: '图片缓存已设置为永不过期，需要指定要删除的文件名数组才能手动清理',
        example: { fileNames: ['abc123.jpg', 'def456.png'] }
      });
    }
    
    imageCacheService.cleanCache(fileNames);
    res.json({ 
      success: true, 
      message: `已手动删除 ${fileNames.length} 个指定的缓存文件`,
      deletedFiles: fileNames
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/cache/clean
 * @desc 获取缓存清理说明（图片缓存已设置为永不过期）
 */
router.get('/cache/clean', (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: '图片缓存已设置为永不过期，不会自动清理任何文件',
      info: '如需手动清理特定文件，请使用POST方法并提供fileNames数组参数',
      example: {
        method: 'POST',
        url: '/api/cache/clean',
        body: { fileNames: ['abc123.jpg', 'def456.png'] }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route POST /api/cache/repair/:uid
 * @desc 修复指定用户的图片缓存
 */
router.post('/cache/repair/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    // 强制验证并修复用户的图片缓存
    const data = await doubanService.getUserData(uid, true);
    
    res.json({ 
      success: true, 
      message: `已修复用户 ${uid} 的图片缓存`,
      data 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/cache/repair/:uid
 * @desc 使用GET方法修复指定用户的图片缓存
 */
router.get('/cache/repair/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    // 强制验证并修复用户的图片缓存
    const data = await doubanService.getUserData(uid, true);
    
    res.json({ 
      success: true, 
      message: `已修复用户 ${uid} 的图片缓存`,
      data 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/cache/debug/:uid
 * @desc 调试用户的图片缓存状态
 */
router.get('/cache/debug/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const doubanService = require('../services/doubanService');
    const imageCacheService = require('../services/imageCacheService');
    
    // 读取用户数据但不验证缓存
    const userData = await doubanService.getUserData(uid, false);
    
    // 收集图片信息
    const imageInfo = [];
    const collectImages = (items) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (item.image) {
            const fileName = item.image.startsWith('/cache/images/') ? 
              path.basename(item.image) : null;
            const filePath = fileName ? 
              path.join(imageCacheService.CACHE_DIR, fileName) : null;
            
            imageInfo.push({
              name: item.name || 'Unknown',
              currentPath: item.image,
              originalUrl: item.originalImage || null,
              fileName: fileName,
              fileExists: filePath ? require('fs').existsSync(filePath) : false,
              fileSize: filePath && require('fs').existsSync(filePath) ? 
                require('fs').statSync(filePath).size : 0
            });
          }
        });
      }
    };
    
    if (userData.data) {
      if (userData.data.movies) collectImages(userData.data.movies);
      if (userData.data.tvShows) collectImages(userData.data.tvShows);
      if (userData.data.books) collectImages(userData.data.books);
    }
    
    // 统计信息
    const stats = {
      totalImages: imageInfo.length,
      cacheImages: imageInfo.filter(img => img.currentPath.startsWith('/cache/images/')).length,
      existingFiles: imageInfo.filter(img => img.fileExists).length,
      missingFiles: imageInfo.filter(img => img.currentPath.startsWith('/cache/images/') && !img.fileExists).length,
      emptyFiles: imageInfo.filter(img => img.fileExists && img.fileSize === 0).length,
      hasOriginalUrl: imageInfo.filter(img => img.originalUrl).length
    };
    
    res.json({
      success: true,
      uid,
      stats,
      cacheDir: imageCacheService.CACHE_DIR,
      sampleImages: imageInfo.slice(0, 10), // 前10个图片的详细信息
      missingImages: imageInfo.filter(img => img.currentPath.startsWith('/cache/images/') && !img.fileExists).slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 