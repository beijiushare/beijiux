// 数字编号到路径的映射表
let numberToPathMap = new Map();

/**
 * 递归遍历 contentData 生成数字到路径的映射
 * @param {Object} data - 当前层级的数据对象
 * @param {Array} currentPath - 当前路径数组
 * @param {number} parentNumber - 父层级的数字编号
 */
function generateNumberToPathMapping(data = contentData, currentPath = [], parentNumber = 0) {
    numberToPathMap.clear(); // 清空现有映射
    
    // 给根目录分配编号 0
    numberToPathMap.set(0, []);
    
    // 开始递归遍历
    traverseDataStructure(data, currentPath, parentNumber);
}

/**
 * 递归遍历数据结构，生成映射
 * @param {Object} data - 当前层级的数据对象
 * @param {Array} currentPath - 当前路径数组
 * @param {number} parentNumber - 父层级的数字编号
 */
function traverseDataStructure(data, currentPath, parentNumber) {
    if (!data || typeof data !== 'object') return;
    
    // 遍历当前层级的所有键
    let index = 1;
    for (const key in data) {
        // 跳过 index 和 dataFile 属性
        if (key === 'index' || key === 'dataFile') continue;
        
        const childData = data[key];
        const childPath = [...currentPath, key];
        
        // 生成当前节点的编号
        const nodeNumber = parentNumber * 10 + index;
        
        // 将当前节点的路径添加到映射表
        numberToPathMap.set(nodeNumber, childPath);
        
        // 如果是对象且不是最终层级，继续递归遍历
        if (typeof childData === 'object' && childData !== null && childData.flag !== '1') {
            traverseDataStructure(childData, childPath, nodeNumber);
        }
        
        index++;
    }
}

/**
 * 解析 URL hash，获取数字编号并导航到对应路径
 */
function parseUrlHash() {
    const hash = window.location.hash;
    if (hash) {
        // 尝试提取纯数字编号
        const numberMatch = hash.match(/^#(\d+)$/);
        if (numberMatch && numberMatch[1]) {
            const number = parseInt(numberMatch[1], 10);
            
            // 检查数字是否在映射表中
            if (numberToPathMap.has(number)) {
                const path = numberToPathMap.get(number);
                currentPath = path;
                updatePath();
                navigateToPath();
                
                // 强制同步URL，确保显示正确的编号
                syncPathToUrl();
                return true;
            }
        }
    }
    return false;
}

/**
 * 将当前路径同步到 URL hash
 */
// 将当前路径同步到 URL hash
function syncPathToUrl() {
    console.log("尝试同步路径到URL，当前路径:", currentPath);
    
    // 查找当前路径对应的数字编号
    for (const [number, path] of numberToPathMap.entries()) {
        if (arraysEqual(path, currentPath)) {
            console.log("找到匹配的编号: ", number, "，更新URL hash");
            // 使用replaceState避免页面滚动
            window.history.replaceState(null, null, `#${number}`);
            return;
        }
    }
    
    // 如果没有找到匹配的路径，根据情况设置hash或清空hash
    if (currentPath.length === 0) {
        console.log("当前是根路径，设置hash为0");
        window.history.replaceState(null, null, "#0");
    } else {
        console.log("没有找到完全匹配的路径，尝试查找部分匹配或清空hash");
        // 尝试查找部分匹配（当前路径是某个已知路径的子路径）
        let closestNumber = null;
        let closestDepth = -1;
        
        for (const [number, path] of numberToPathMap.entries()) {
            // 检查当前路径是否以已知路径开头
            let isPrefix = true;
            for (let i = 0; i < path.length; i++) {
                if (i >= currentPath.length || path[i] !== currentPath[i]) {
                    isPrefix = false;
                    break;
                }
            }
            
            if (isPrefix && path.length > closestDepth) {
                closestDepth = path.length;
                closestNumber = number;
            }
        }
        
        if (closestNumber !== null) {
            console.log("找到部分匹配的编号: ", closestNumber);
            window.history.replaceState(null, null, `#${closestNumber}`);
        } else {
            console.log("没有找到任何匹配，清空hash");
            window.history.replaceState(null, null, "#");
        }
    }
}

/**
 * 比较两个数组是否相等
 * @param {Array} arr1 - 第一个数组
 * @param {Array} arr2 - 第二个数组
 * @returns {boolean} - 数组是否相等
 */
function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}

/**
 * 初始化路径映射
 */
function initializePathMapping() {
    // 生成数字到路径的映射
    generateNumberToPathMapping();
    
    console.log("生成的映射表:", Array.from(numberToPathMap.entries()));
    
    // 监听 hash 变化
    window.addEventListener('hashchange', parseUrlHash);
    
    // 初始化时尝试解析 URL hash
    parseUrlHash();
}

// 导出函数供其他模块使用
// 注意：在浏览器环境中，如果需要模块化，可能需要使用 ES6 模块