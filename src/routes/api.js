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
 * @query refresh - 可选参数，设置为true时强制从API获取最新数据（会先删除旧数据）
 * @query validateCache - 可选参数，设置为false时跳过图片缓存验证（默认为true）
 */
router.get('/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { refresh, validateCache } = req.query;
    
    console.log(`[DEBUG] 路由接收到的参数 - UID: ${uid}, Refresh: ${refresh}, ValidateCache: ${validateCache}`);
    
    // 如果设置了refresh=true，强制从API获取最新数据
    if (refresh === 'true') {
      const data = await doubanService.getUserAllData(uid);
      res.json({ success: true, data, message: '已删除旧数据并获取最新数据' });
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
 * @route DELETE /api/users/:uid
 * @desc 删除指定用户的所有数据文件
 */
router.delete('/users/:uid', (req, res) => {
  try {
    const { uid } = req.params;
    doubanService.deleteUserData(uid);
    res.json({ success: true, message: `已删除用户 ${uid} 的所有数据文件` });
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
 * @route POST /api/cache/clean
 * @desc 清理过期的缓存图片
 * @body days - 可选参数，保留天数，默认30天
 */
router.post('/cache/clean', (req, res) => {
  try {
    const { days = 30 } = req.body;
    imageCacheService.cleanCache(Number(days));
    res.json({ success: true, message: `已清理超过 ${days} 天的缓存图片` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/cache/clean
 * @desc 使用GET方法清理过期的缓存图片（默认30天）
 */
router.get('/cache/clean', (req, res) => {
  try {
    const { days = 30 } = req.query;
    imageCacheService.cleanCache(Number(days));
    res.json({ success: true, message: `已清理超过 ${days} 天的缓存图片` });
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