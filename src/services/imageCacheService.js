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

  // 检查文件是否存在且有效（文件大小大于0）
  if (fs.existsSync(filePath)) {
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > 0) {
        console.log(`图片已缓存: ${fileName}`);
        return `/cache/images/${fileName}`;
      } else {
        // 文件存在但大小为0，删除并重新下载
        console.log(`发现损坏的缓存文件，正在重新下载: ${fileName}`);
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.log(`缓存文件状态检查失败，正在重新下载: ${fileName}`);
      // 如果文件状态检查失败，尝试删除文件（如果存在）
      try {
        fs.unlinkSync(filePath);
      } catch (deleteError) {
        // 忽略删除错误
      }
    }
  }

  try {
    console.log(`开始下载图片: ${imageUrl}`);

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://douban.com'
      },
      timeout: 15000 // 增加到15秒超时
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.buffer();

    if (buffer.length === 0) {
      throw new Error('下载的文件为空');
    }

    fs.writeFileSync(filePath, buffer);

    // 验证文件是否写入成功
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      throw new Error('文件写入后大小为0');
    }

    console.log(`图片缓存成功: ${fileName} (${(stats.size / 1024).toFixed(2)} KB)`);
    return `/cache/images/${fileName}`;
  } catch (error) {
    console.error(`下载图片失败 ${imageUrl}:`);
    console.error(`  错误类型: ${error.name}`);
    console.error(`  错误信息: ${error.message}`);

    // 如果文件已创建但有问题，删除它
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`已删除损坏的文件: ${fileName}`);
      } catch (deleteError) {
        console.error(`删除损坏文件失败: ${deleteError.message}`);
      }
    }

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
 * 清理缓存（手动清理指定文件或全部文件）
 * @param {Array<string>} fileNames - 要删除的文件名数组，如果为空则不删除任何文件
 */
function cleanCache(fileNames = []) {
  try {
    if (!fileNames || fileNames.length === 0) {
      console.log('图片缓存已设置为永不过期，不会自动清理任何文件');
      return;
    }

    let deletedCount = 0;

    for (const fileName of fileNames) {
      const filePath = path.join(CACHE_DIR, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`手动删除缓存文件: ${fileName}`);
      }
    }

    console.log(`手动清理缓存完成，删除了 ${deletedCount} 个文件`);
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
      cacheDir: CACHE_DIR,
      cachePolicy: '永不过期 - 图片将永久保存直到手动删除'
    };
  } catch (error) {
    console.error('获取缓存统计失败:', error);
    return {
      fileCount: 0,
      totalSize: 0,
      totalSizeMB: '0.00',
      cacheDir: CACHE_DIR,
      cachePolicy: '永不过期 - 图片将永久保存直到手动删除'
    };
  }
}

/**
 * 获取所有缓存文件的详细信息
 * @returns {Array} 缓存文件信息数组
 */
function getAllCacheFiles() {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    
    const fileList = files.map(fileName => {
      const filePath = path.join(CACHE_DIR, fileName);
      const stats = fs.statSync(filePath);
      return {
        fileName,
        size: stats.size,
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        isValid: stats.size > 0
      };
    });
    
    // 按修改时间排序，最新的在前
    fileList.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
    
    return fileList;
  } catch (error) {
    console.error('获取缓存文件列表失败:', error);
    return [];
  }
}

/**
 * 验证并修复图片缓存路径
 * @param {string} imagePath - 图片路径（可能是缓存路径或原始URL）
 * @param {string} originalUrl - 原始图片URL（用于重新缓存）
 * @returns {Promise<string>} 返回有效的图片路径
 */
async function validateAndFixImagePath(imagePath, originalUrl) {
  // 如果是缓存路径，检查文件是否存在
  if (imagePath && imagePath.startsWith('/cache/images/')) {
    const fileName = path.basename(imagePath);
    const filePath = path.join(CACHE_DIR, fileName);

    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > 0) {
          console.log(`缓存文件有效: ${fileName}`);
          return imagePath; // 缓存文件有效
        } else {
          console.log(`缓存文件大小为0，删除并重新下载: ${fileName}`);
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.log(`缓存文件状态检查失败: ${fileName}`, error.message);
      }
    }

    // 缓存文件不存在或无效，尝试重新缓存
    if (originalUrl) {
      console.log(`缓存文件丢失，正在重新缓存: ${fileName} <- ${originalUrl}`);
      const newCachedPath = await downloadAndCacheImage(originalUrl);
      if (newCachedPath) {
        console.log(`重新缓存成功: ${fileName}`);
        return newCachedPath;
      } else {
        console.log(`重新缓存失败，使用原始URL: ${originalUrl}`);
        return originalUrl;
      }
    } else {
      console.log(`没有原始URL，无法修复缓存: ${fileName}`);
      return imagePath; // 没有原始URL，返回原路径（虽然可能无效）
    }
  }

  // 如果是原始URL，尝试缓存
  if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
    console.log(`尝试缓存原始URL: ${imagePath}`);
    const cachedPath = await downloadAndCacheImage(imagePath);
    return cachedPath || imagePath;
  }

  return imagePath;
}

/**
 * 处理包含图片的数据，添加缓存图片路径
 * @param {Array|Object} data - 包含图片的数据
 * @param {boolean} validateCache - 是否验证现有缓存，默认false
 * @returns {Promise<Array|Object>} 处理后的数据，包含原始URL和缓存URL
 */
async function processImagesInData(data, validateCache = false) {
  if (!data) return data;

  // 收集所有图片URL和现有路径
  const imageInfo = new Map(); // URL -> {currentPath, originalUrl}

  const collectUrls = (items) => {
    if (Array.isArray(items)) {
      items.forEach(item => {
        if (item.image) {
          // 尝试从现有数据中提取原始URL
          const originalUrl = item.originalImage ||
            (item.image.startsWith('http') ? item.image : null);

          if (validateCache) {
            console.log(`收集图片信息: ${item.name || 'Unknown'}`);
            console.log(`  当前路径: ${item.image}`);
            console.log(`  原始URL: ${originalUrl || 'None'}`);
          }

          imageInfo.set(item.image, {
            currentPath: item.image,
            originalUrl: originalUrl,
            itemName: item.name || 'Unknown'
          });
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

  // 处理图片缓存
  const pathToNewPath = new Map();

  if (validateCache) {
    // 验证并修复现有缓存
    console.log(`开始验证 ${imageInfo.size} 个图片的缓存...`);
    let processedCount = 0;

    for (const [currentPath, info] of imageInfo) {
      processedCount++;
      console.log(`[${processedCount}/${imageInfo.size}] 验证: ${info.itemName}`);

      const validPath = await validateAndFixImagePath(info.currentPath, info.originalUrl);
      pathToNewPath.set(currentPath, validPath);

      // 添加小延迟避免请求过快
      if (processedCount % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`缓存验证完成，处理了 ${processedCount} 个图片`);
  } else {
    // 批量缓存新图片
    const urlsToCache = Array.from(imageInfo.values())
      .map(info => info.originalUrl || info.currentPath)
      .filter(url => url && (url.startsWith('http://') || url.startsWith('https://')));

    const urlToLocalPath = await batchCacheImages(urlsToCache);

    for (const [currentPath, info] of imageInfo) {
      const originalUrl = info.originalUrl || info.currentPath;
      pathToNewPath.set(currentPath, urlToLocalPath[originalUrl] || currentPath);
    }
  }

  // 更新数据
  const updateImages = (items) => {
    if (Array.isArray(items)) {
      return items.map(item => {
        if (item.image && pathToNewPath.has(item.image)) {
          const newPath = pathToNewPath.get(item.image);
          return {
            ...item,
            image: newPath,
            // 确保始终保留原始URL
            originalImage: item.originalImage || (item.image.startsWith('http') ? item.image : null),
            // 如果成功缓存，添加缓存路径字段
            cachedImage: newPath && newPath.startsWith('/cache/images/') ? newPath : null
          };
        }
        return {
          ...item,
          // 确保原始URL字段存在
          originalImage: item.originalImage || (item.image && item.image.startsWith('http') ? item.image : null)
        };
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
  getAllCacheFiles,
  processImagesInData,
  validateAndFixImagePath,
  generateFileName,
  CACHE_DIR
}; 