// 智能预加载函数 - 递归遍历contentData，自动找出所有dataFile
function smartPreloadData() {
  // 收集所有需要预加载的dataFile路径
  const dataFilesToPreload = [];
  
  // 递归遍历函数
  function collectDataFiles(obj) {
    if (!obj || typeof obj !== 'object') return;
    
    // 检查当前对象是否有dataFile属性
    if (obj.dataFile) {
      dataFilesToPreload.push(obj.dataFile);
    }
    
    // 递归遍历所有子属性
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && key !== 'dataFile' && key !== 'index') {
        collectDataFiles(obj[key]);
      }
    }
  }
  
  // 从根数据开始收集
  collectDataFiles(contentData);
  
  // 批量预加载所有收集到的文件，但不阻塞UI
  dataFilesToPreload.forEach((filePath, index) => {
    // 低优先级加载，不影响当前页面性能
    setTimeout(() => {
      fetch(`data/${filePath}`)
        .then(response => {
          if (response.ok) return response.json();
          throw new Error(`预加载 ${filePath} 失败`);
        })
        .then(data => {
          // 将预加载的数据存入缓存
          preloadedDataCache.set(filePath, data);
          console.log(`预加载完成: ${filePath}`);
        })
        .catch(error => {
          console.warn(`预加载 ${filePath} 时出错:`, error);
          // 预加载失败不影响用户体验，只是后续访问会正常加载
        });
    }, 100 * index); // 错开加载时间，避免同时发起多个请求
  });
}

// 修改loadData函数，优先使用预加载的缓存数据
async function loadData(filePath) {
  try {
    // 提取相对路径（去掉data/前缀）用于缓存查找
    const relativePath = filePath.replace(/^data\//, '');
    
    // 检查是否有预加载的缓存数据
    if (preloadedDataCache.has(relativePath)) {
      console.log(`使用预加载缓存: ${filePath}`);
      const cachedData = preloadedDataCache.get(relativePath);
      // 返回深拷贝，避免缓存数据被修改
      return JSON.parse(JSON.stringify(cachedData));
    }
    
    // 没有缓存时正常加载
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`${filePath} 加载失败`);
    const data = await response.json();

    // 递归处理对象，加载子 JSON 文件
    async function processObject(obj) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key) && obj[key].dataFile) {
          const subData = await loadData(`data/${obj[key].dataFile}`);
          obj[key] = { ...obj[key], ...subData };
          delete obj[key].dataFile;
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          await processObject(obj[key]);
        }
      }
      return obj;
    }

    return processObject(data);
  } catch (error) {
    console.error("加载 JSON 文件时出错:", error);
    return {};
  }
}