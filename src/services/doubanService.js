const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
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
  const url = `${API_BASE_URL}/user/${uid}/interests?type=${type}&status=${status}&count=${count}&start=${start}`;
  
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
    const filteredData = {
      name: data.title || '',
      image: data.pic?.normal || '',
      rating: data.rating?.value || 0
    };
    
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
 * 过滤内容数据，只保留需要的字段
 * @param {Array} items - 内容数据数组
 * @returns {Array} 过滤后的数据数组
 */
function filterItemData(items) {
  return items.map(item => {
    const filteredItem = {
      name: item.subject?.title || '',
      markTime: item.create_time || '',
      comment: item.comment || '',
      rating: item.rating?.value || 0,
      image: item.subject?.pic?.normal || ''
    };
    return filteredItem;
  });
}

/**
 * 获取用户所有类型的收藏数据
 * @param {string} uid - 用户ID
 * @returns {Object} 返回用户所有类型的收藏数据
 */
async function getUserAllData(uid) {
  try {
    // 获取电影数据
    const movies = await getAllUserInterests(uid, 'movie', 'done');
    // 获取电视剧数据（在豆瓣中电视剧也是movie类型）
    const tvShows = movies.filter(item => 
      item.subject && item.subject.card_subtitle && 
      (item.subject.card_subtitle.includes('电视剧') || 
       item.subject.genres && item.subject.genres.includes('电视剧')));
    // 获取书籍数据
    const books = await getAllUserInterests(uid, 'book', 'done');
    
    // 过滤电影数据
    const filteredMovies = filterItemData(
      movies.filter(item => 
        item.subject && item.subject.card_subtitle && 
        !item.subject.card_subtitle.includes('电视剧') && 
        (!item.subject.genres || !item.subject.genres.includes('电视剧')))
    );
    
    // 过滤电视剧数据
    const filteredTvShows = filterItemData(tvShows);
    
    // 过滤书籍数据
    const filteredBooks = filterItemData(books);
    
    const result = {
      uid,
      stats: {
        movies: filteredMovies.length,
        tvShows: filteredTvShows.length,
        books: filteredBooks.length
      },
      data: {
        movies: filteredMovies,
        tvShows: filteredTvShows,
        books: filteredBooks
      }
    };
    
    // 保存整合数据
    saveData(`${uid}_all_data.json`, result);
    
    return result;
  } catch (error) {
    console.error(`获取用户${uid}的所有数据失败:`, error);
    throw error;
  }
}

/**
 * 检查并从本地获取用户数据，如果不存在则从API获取
 * @param {string} uid - 用户ID
 * @returns {Promise<Object>} 返回用户数据
 */
async function getUserData(uid) {
  const fileName = `${uid}_all_data.json`;
  const localData = loadData(fileName);
  
  if (localData) {
    console.log(`从本地加载用户${uid}数据`);
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
  filterItemData
}; 