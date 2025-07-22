const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const imageCacheService = require('./imageCacheService');
const dataPath = path.join(__dirname, '../data');

// 确保数据目录存在
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// API配置
const API_BASE_URL = 'https://fatesinger.com/dbapi';
const headers = {
  'Referer': 'https://m.douban.com',
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/12.0 Mobile/15A372 Safari/604.1'
};

/**
 * 获取用户收藏内容
 * @param {string} uid - 豆瓣用户ID
 * @param {string} type - 内容类型 (movie, book, music)
 * @param {string} status - 收藏状态 (done, doing, mark)
 * @param {number} start - 分页起始位置
 * @param {number} count - 每页数量
 * @returns {Promise<Object>} 返回用户收藏内容
 */
async function getUserInterests(uid, type = 'movie', status = 'done', start = 0, count = 50) {
  console.log(`[DEBUG] 获取用户收藏 - UID: ${uid}, Type: ${type}, Status: ${status}`);
  const url = `${API_BASE_URL}/user/${uid}/interests?type=${type}&status=${status}&count=${count}&start=${start}`;
  console.log(`[DEBUG] 请求URL: ${url}`);
  
  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 保存数据到本地文件
    const fileName = `${uid}_${type}_${status}_${start}.json`;
    saveData(fileName, data);
    
    return data;
  } catch (error) {
    console.error(`获取用户${uid}的${type}收藏失败:`, error);
    throw error;
  }
}

/**
 * 获取所有用户收藏内容（自动处理分页）
 * @param {string} uid - 豆瓣用户ID
 * @param {string} type - 内容类型 (movie, book, music)
 * @param {string} status - 收藏状态 (done, doing, mark)
 * @returns {Promise<Array>} 返回所有收藏内容的数组
 */
async function getAllUserInterests(uid, type = 'movie', status = 'done') {
  let allInterests = [];
  let start = 0;
  const count = 50;
  let hasMore = true;
  
  try {
    while (hasMore) {
      const data = await getUserInterests(uid, type, status, start, count);
      
      if (data.interests && data.interests.length > 0) {
        allInterests = allInterests.concat(data.interests);
        start += count;
        
        // 检查是否还有更多数据
        hasMore = start < data.total;
      } else {
        hasMore = false;
      }
    }
    
    // 保存完整数据到本地文件
    const fileName = `${uid}_${type}_${status}_all.json`;
    saveData(fileName, { total: allInterests.length, interests: allInterests });
    
    return allInterests;
  } catch (error) {
    console.error(`获取用户${uid}的所有${type}收藏失败:`, error);
    throw error;
  }
}

/**
 * 获取内容详情
 * @param {string} type - 内容类型 (movie, book, music)
 * @param {string} id - 内容ID
 * @returns {Promise<Object>} 返回内容详情
 */
async function getItemDetail(type, id) {
  const url = `${API_BASE_URL}/${type}/${id}?ck=xgtY&for_mobile=1`;
  
  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 过滤数据，只保留需要的字段
    const originalImageUrl = data.pic?.normal || '';
    const filteredData = {
      name: data.title || '',
      image: originalImageUrl,
      originalImage: originalImageUrl, // 保留原始URL
      rating: data.rating?.value || 0
    };
    
    // 处理图片缓存
    if (filteredData.image) {
      const cachedImage = await imageCacheService.downloadAndCacheImage(filteredData.image);
      if (cachedImage) {
        filteredData.image = cachedImage;
        filteredData.cachedImage = cachedImage;
      }
      // 如果缓存失败，image字段保持原始URL，originalImage字段确保原始URL不丢失
    }
    
    // 保存数据到本地文件
    const fileName = `${type}_${id}_detail.json`;
    saveData(fileName, filteredData);
    
    return filteredData;
  } catch (error) {
    console.error(`获取${type} ${id}详情失败:`, error);
    throw error;
  }
}

/**
 * 保存数据到本地文件
 * @param {string} fileName - 文件名
 * @param {Object} data - 要保存的数据
 */
function saveData(fileName, data) {
  const filePath = path.join(dataPath, fileName);
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`数据已保存到: ${filePath}`);
  } catch (error) {
    console.error('保存数据失败:', error);
  }
}

/**
 * 从本地文件读取数据
 * @param {string} fileName - 文件名
 * @returns {Object|null} 返回读取的数据或null
 */
function loadData(fileName) {
  const filePath = path.join(dataPath, fileName);
  
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('读取数据失败:', error);
    return null;
  }
}

/**
 * 获取所有已保存的用户数据
 * @returns {Array} 返回已保存的所有用户数据
 */
function getAllSavedUsers() {
  try {
    const files = fs.readdirSync(dataPath);
    const users = new Set();
    
    for (const file of files) {
      if (file.includes('_all.json')) {
        const uid = file.split('_')[0];
        if (uid) users.add(uid);
      }
    }
    
    return Array.from(users);
  } catch (error) {
    console.error('获取已保存用户数据失败:', error);
    return [];
  }
}

/**
 * 将豆瓣状态转换为中文状态
 * @param {string} status - 豆瓣状态 (done, doing, mark)
 * @param {string} type - 内容类型 (movie, tvshow, book)
 * @returns {string} 中文状态
 */
function getStatusText(status, type = 'movie') {
  const statusMaps = {
    movie: {
      'done': '已观看',
      'doing': '正在观看',
      'mark': '想看'
    },
    tvshow: {
      'done': '已观看',
      'doing': '正在观看',
      'mark': '想看'
    },
    book: {
      'done': '已阅读',
      'doing': '正在阅读',
      'mark': '想读'
    }
  };
  
  const statusMap = statusMaps[type] || statusMaps.movie;
  return statusMap[status] || '未知状态';
}

/**
 * 过滤内容数据，只保留需要的字段
 * @param {Array} items - 内容数据数组
 * @param {string} status - 当前数据的状态
 * @param {string} type - 内容类型 (movie, tvshow, book)
 * @returns {Array} 过滤后的数据数组
 */
function filterItemData(items, status = 'done', type = 'movie') {
  return items.map(item => {
    const originalImageUrl = item.subject?.pic?.normal || '';
    const filteredItem = {
      name: item.subject?.title || '',
      markTime: item.create_time || '',
      comment: item.comment || '',
      rating: item.rating?.value || 0,
      image: originalImageUrl, // 先保存原始URL，后续会被缓存处理替换
      originalImage: originalImageUrl, // 始终保留原始URL
      status: getStatusText(status, type)
    };
    return filteredItem;
  });
}

/**
 * 删除指定用户的所有数据文件
 * @param {string} uid - 用户ID
 */
function deleteUserData(uid) {
  try {
    const files = fs.readdirSync(dataPath);
    const userFiles = files.filter(file => file.startsWith(`${uid}_`));
    
    let deleteCount = 0;
    for (const file of userFiles) {
      const filePath = path.join(dataPath, file);
      fs.unlinkSync(filePath);
      deleteCount++;
    }
    
    console.log(`已删除用户 ${uid} 的 ${deleteCount} 个数据文件`);
  } catch (error) {
    console.error(`删除用户 ${uid} 数据文件失败:`, error);
  }
}

/**
 * 获取用户所有类型的收藏数据
 * @param {string} uid - 用户ID
 * @returns {Object} 返回用户所有类型的收藏数据
 */
async function getUserAllData(uid) {
  try {
    // 删除旧数据
    console.log(`开始获取用户 ${uid} 的最新数据，正在删除旧数据...`);
    deleteUserData(uid);
    
    // 获取所有状态的电影数据
    const moviesDone = await getAllUserInterests(uid, 'movie', 'done');
    const moviesDoing = await getAllUserInterests(uid, 'movie', 'doing');
    const moviesMark = await getAllUserInterests(uid, 'movie', 'mark');
    
    // 合并所有电影数据
    const allMovies = [
      ...moviesDone.map(item => ({ ...item, status: 'done' })),
      ...moviesDoing.map(item => ({ ...item, status: 'doing' })),
      ...moviesMark.map(item => ({ ...item, status: 'mark' }))
    ];
    
    // 获取电视剧数据（在豆瓣中电视剧也是movie类型）
    const tvShows = allMovies.filter(item => 
      item.subject && item.subject.card_subtitle && 
      (item.subject.card_subtitle.includes('电视剧') || 
       item.subject.genres && item.subject.genres.includes('电视剧')));
    
    // 获取所有状态的书籍数据
    const booksDone = await getAllUserInterests(uid, 'book', 'done');
    const booksDoing = await getAllUserInterests(uid, 'book', 'doing');
    const booksMark = await getAllUserInterests(uid, 'book', 'mark');
    
    // 合并所有书籍数据
    const allBooks = [
      ...booksDone.map(item => ({ ...item, status: 'done' })),
      ...booksDoing.map(item => ({ ...item, status: 'doing' })),
      ...booksMark.map(item => ({ ...item, status: 'mark' }))
    ];
    
    // 过滤电影数据（排除电视剧）
    const pureMovies = allMovies.filter(item => 
      item.subject && item.subject.card_subtitle && 
      !item.subject.card_subtitle.includes('电视剧') && 
      (!item.subject.genres || !item.subject.genres.includes('电视剧')));
    
    // 按状态分别过滤数据
    const filteredMovies = [];
    const filteredTvShows = [];
    const filteredBooks = [];
    
    // 处理电影数据
    ['done', 'doing', 'mark'].forEach(status => {
      const moviesOfStatus = pureMovies.filter(item => item.status === status);
      filteredMovies.push(...filterItemData(moviesOfStatus, status, 'movie'));
    });
    
    // 处理电视剧数据
    ['done', 'doing', 'mark'].forEach(status => {
      const tvShowsOfStatus = tvShows.filter(item => item.status === status);
      filteredTvShows.push(...filterItemData(tvShowsOfStatus, status, 'tvshow'));
    });
    
    // 处理书籍数据
    ['done', 'doing', 'mark'].forEach(status => {
      const booksOfStatus = allBooks.filter(item => item.status === status);
      filteredBooks.push(...filterItemData(booksOfStatus, status, 'book'));
    });
    
    const result = {
      uid,
      stats: {
        movies: filteredMovies.length,
        tvShows: filteredTvShows.length,
        books: filteredBooks.length,
        moviesByStatus: {
          done: filteredMovies.filter(m => m.status === '已观看').length,
          doing: filteredMovies.filter(m => m.status === '正在观看').length,
          mark: filteredMovies.filter(m => m.status === '想看').length
        },
        tvShowsByStatus: {
          done: filteredTvShows.filter(t => t.status === '已观看').length,
          doing: filteredTvShows.filter(t => t.status === '正在观看').length,
          mark: filteredTvShows.filter(t => t.status === '想看').length
        },
        booksByStatus: {
          done: filteredBooks.filter(b => b.status === '已阅读').length,
          doing: filteredBooks.filter(b => b.status === '正在阅读').length,
          mark: filteredBooks.filter(b => b.status === '想读').length
        }
      },
      data: {
        movies: filteredMovies,
        tvShows: filteredTvShows,
        books: filteredBooks
      }
    };
    
    // 处理所有图片缓存
    console.log('开始处理图片缓存...');
    const processedResult = await imageCacheService.processImagesInData(result);
    
    // 保存整合数据
    saveData(`${uid}_all_data.json`, processedResult);
    
    return processedResult;
  } catch (error) {
    console.error(`获取用户${uid}的所有数据失败:`, error);
    throw error;
  }
}

/**
 * 检查并从本地获取用户数据，如果不存在则从API获取
 * @param {string} uid - 用户ID
 * @param {boolean} validateCache - 是否验证图片缓存，默认true
 * @returns {Promise<Object>} 返回用户数据
 */
async function getUserData(uid, validateCache = true) {
  const fileName = `${uid}_all_data.json`;
  const localData = loadData(fileName);
  
  if (localData) {
    console.log(`从本地加载用户${uid}数据`);
    
    if (validateCache) {
      console.log(`验证用户${uid}的图片缓存...`);
      // 验证并修复图片缓存
      const validatedData = await imageCacheService.processImagesInData(localData, true);
      
      // 如果数据有变化，保存更新后的数据
      if (JSON.stringify(validatedData) !== JSON.stringify(localData)) {
        console.log(`用户${uid}的图片缓存已更新，保存新数据`);
        saveData(fileName, validatedData);
      }
      
      return validatedData;
    }
    
    return localData;
  }
  
  console.log(`从API获取用户${uid}数据`);
  return await getUserAllData(uid);
}

module.exports = {
  getUserInterests,
  getAllUserInterests,
  getItemDetail,
  saveData,
  loadData,
  getAllSavedUsers,
  getUserAllData,
  getUserData,
  filterItemData,
  getStatusText,
  deleteUserData
}; 