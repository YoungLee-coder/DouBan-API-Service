const express = require('express');
const router = express.Router();
const doubanService = require('../services/doubanService');

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
 * @query refresh - 可选参数，设置为true时强制从API获取最新数据
 */
router.get('/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { refresh } = req.query;
    
    // 如果设置了refresh=true，强制从API获取最新数据
    if (refresh === 'true') {
      const data = await doubanService.getUserAllData(uid);
      res.json({ success: true, data, message: '已获取最新数据' });
    } else {
      const data = await doubanService.getUserData(uid);
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
 */
router.get('/users/:uid/movies', async (req, res) => {
  try {
    const { uid } = req.params;
    const { status, refresh } = req.query;
    
    // 如果设置了refresh=true，强制从API获取最新数据
    const userData = refresh === 'true' ? 
      await doubanService.getUserAllData(uid) : 
      await doubanService.getUserData(uid);
    
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
 */
router.get('/users/:uid/tvshows', async (req, res) => {
  try {
    const { uid } = req.params;
    const { status, refresh } = req.query;
    
    // 如果设置了refresh=true，强制从API获取最新数据
    const userData = refresh === 'true' ? 
      await doubanService.getUserAllData(uid) : 
      await doubanService.getUserData(uid);
    
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
 */
router.get('/users/:uid/books', async (req, res) => {
  try {
    const { uid } = req.params;
    const { status, refresh } = req.query;
    
    // 如果设置了refresh=true，强制从API获取最新数据
    const userData = refresh === 'true' ? 
      await doubanService.getUserAllData(uid) : 
      await doubanService.getUserData(uid);
    
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

module.exports = router; 