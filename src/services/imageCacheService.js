const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 图片缓存目录
const CACHE_DIR = path.join(__dirname, '../data/images');

// 确保缓存目录存在
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * 从URL生成文件名（使用MD5哈希避免文件名冲突）
 * @param {string} url - 图片URL
 * @returns {string} 生成的文件名
 */
function generateFileName(url) {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  const ext = getExtensionFromUrl(url);
  return `${hash}${ext}`;
}

/**
 * 从URL获取文件扩展名
 * @param {string} url - 图片URL
 * @returns {string} 文件扩展名
 */
function getExtensionFromUrl(url) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  const ext = path.extname(pathname);
  
  // 如果没有扩展名或者不是常见的图片格式，默认使用.jpg
  const validExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  if (!ext || !validExts.includes(ext.toLowerCase())) {
    return '.jpg';
  }
  
  return ext.toLowerCase();
}

/**
 * 下载并缓存图片
 * @param {string} imageUrl - 图片URL
 * @returns {Promise<string>} 返回本地缓存的文件路径
 */
async function downloadAndCacheImage(imageUrl) {
  if (!imageUrl) {
    return null;
  }

  const fileName = generateFileName(imageUrl);
  const filePath = path.join(CACHE_DIR, fileName);

  // 如果文件已存在，直接返回缓存路径
  if (fs.existsSync(filePath)) {
    console.log(`图片已缓存: ${fileName}`);
    return `/cache/images/${fileName}`;
  }

  try {
    console.log(`开始下载图片: ${imageUrl}`);
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://douban.com'
      },
      timeout: 10000 // 10秒超时
    });

    if (!response.ok) {
      throw new Error(`下载失败: ${response.statusText}`);
    }

    const buffer = await response.buffer();
    fs.writeFileSync(filePath, buffer);
    
    console.log(`图片缓存成功: ${fileName}`);
    return `/cache/images/${fileName}`;
  } catch (error) {
    console.error(`下载图片失败 ${imageUrl}:`, error);
    return null;
  }
}

/**
 * 批量缓存图片
 * @param {Array<string>} imageUrls - 图片URL数组
 * @returns {Promise<Object>} 返回URL到本地路径的映射
 */
async function batchCacheImages(imageUrls) {
  const validUrls = imageUrls.filter(url => url && url.trim());
  const results = {};

  // 并发下载，但限制并发数量避免过载
  const concurrency = 5;
  const chunks = [];
  
  for (let i = 0; i < validUrls.length; i += concurrency) {
    chunks.push(validUrls.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (url) => {
      const localPath = await downloadAndCacheImage(url);
      results[url] = localPath;
    });

    await Promise.all(promises);
  }

  return results;
}

/**
 * 清理缓存（删除超过指定天数的文件）
 * @param {number} days - 保留天数，默认365天（1年）
 */
function cleanCache(days = 365) {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(CACHE_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < cutoffTime) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    console.log(`清理缓存完成，删除了 ${deletedCount} 个文件`);
  } catch (error) {
    console.error('清理缓存失败:', error);
  }
}

/**
 * 获取缓存统计信息
 * @returns {Object} 缓存统计信息
 */
function getCacheStats() {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(CACHE_DIR, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    }

    return {
      fileCount: files.length,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      cacheDir: CACHE_DIR
    };
  } catch (error) {
    console.error('获取缓存统计失败:', error);
    return {
      fileCount: 0,
      totalSize: 0,
      totalSizeMB: '0.00',
      cacheDir: CACHE_DIR
    };
  }
}

/**
 * 处理包含图片的数据，添加缓存图片路径
 * @param {Array|Object} data - 包含图片的数据
 * @returns {Promise<Array|Object>} 处理后的数据，包含原始URL和缓存URL
 */
async function processImagesInData(data) {
  if (!data) return data;

  // 收集所有图片URL
  const imageUrls = new Set();
  
  const collectUrls = (items) => {
    if (Array.isArray(items)) {
      items.forEach(item => {
        if (item.image) {
          imageUrls.add(item.image);
        }
      });
    } else if (typeof items === 'object' && items !== null) {
      Object.values(items).forEach(value => {
        if (Array.isArray(value)) {
          collectUrls(value);
        } else if (typeof value === 'object' && value !== null) {
          collectUrls(value);
        }
      });
    }
  };

  if (Array.isArray(data)) {
    collectUrls(data);
  } else if (data.data) {
    collectUrls(data.data);
  } else {
    collectUrls(data);
  }

  // 批量缓存图片
  const urlToLocalPath = await batchCacheImages(Array.from(imageUrls));

  // 更新数据，只提供一个图片路径（优先使用缓存路径，失败则使用原路径）
  const updateImages = (items) => {
    if (Array.isArray(items)) {
      return items.map(item => {
        if (item.image) {
          // 如果成功缓存则使用本地地址，否则使用豆瓣原地址
          return {
            ...item,
            image: urlToLocalPath[item.image] || item.image,
          };
        }
        return item;
      });
    } else if (typeof items === 'object' && items !== null) {
      const updated = { ...items };
      Object.keys(updated).forEach(key => {
        if (Array.isArray(updated[key])) {
          updated[key] = updateImages(updated[key]);
        } else if (typeof updated[key] === 'object' && updated[key] !== null) {
          updated[key] = updateImages(updated[key]);
        }
      });
      return updated;
    }
    return items;
  };

  if (Array.isArray(data)) {
    return updateImages(data);
  } else if (data.data) {
    return {
      ...data,
      data: updateImages(data.data)
    };
  } else {
    return updateImages(data);
  }
}

module.exports = {
  downloadAndCacheImage,
  batchCacheImages,
  cleanCache,
  getCacheStats,
  processImagesInData,
  generateFileName,
  CACHE_DIR
}; 