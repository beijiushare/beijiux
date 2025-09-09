/*
 * 历史记录管理器
 * 负责管理用户的浏览历史记录，包括存储、读取、显示和导航功能
 */

// 历史记录相关配置
const HISTORY_CONFIG = {
    // 历史记录在cookie中的键名
    COOKIE_NAME: 'beijiux_history',
    // 历史记录最大条目数
    MAX_HISTORY_ITEMS: 50,
    // Cookie过期时间（天）
    COOKIE_EXPIRE_DAYS: 30
};

/**
 * 从Cookie中读取历史记录
 * @returns {Array} 历史记录数组
 */
function getHistoryFromCookie() {
    try {
        const cookie = document.cookie.split(';').find(c => c.trim().startsWith(`${HISTORY_CONFIG.COOKIE_NAME}=`));
        if (cookie) {
            const encodedHistory = cookie.split('=')[1];
            const history = JSON.parse(decodeURIComponent(encodedHistory));
            return Array.isArray(history) ? history : [];
        }
    } catch (error) {
        console.error('读取历史记录失败:', error);
    }
    return [];
}

/**
 * 将历史记录保存到Cookie
 * @param {Array} history - 历史记录数组
 */
function saveHistoryToCookie(history) {
    try {
        const encodedHistory = encodeURIComponent(JSON.stringify(history));
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + HISTORY_CONFIG.COOKIE_EXPIRE_DAYS);
        document.cookie = `${HISTORY_CONFIG.COOKIE_NAME}=${encodedHistory}; expires=${expiryDate.toUTCString()}; path=/`;
    } catch (error) {
        console.error('保存历史记录失败:', error);
    }
}

/**
 * 添加一条记录到历史记录
 * @param {Array} path - 当前路径数组
 * @param {string} title - 显示标题
 */
function addToHistory(path, title) {
    try {
        const history = getHistoryFromCookie();
        const timestamp = new Date().getTime();
        const newRecord = {
            path: [...path], // 深拷贝路径数组
            title: title || formatPathTitle(path),
            timestamp: timestamp,
            // 生成对应的URL编号
            urlNumber: getUrlNumberForPath(path)
        };
        
        // 检查是否已存在相同路径的记录，如果有则移除
        const existingIndex = history.findIndex(item => arraysEqual(item.path, path));
        if (existingIndex !== -1) {
            history.splice(existingIndex, 1);
        }
        
        // 添加新记录到开头
        history.unshift(newRecord);
        
        // 限制历史记录数量
        if (history.length > HISTORY_CONFIG.MAX_HISTORY_ITEMS) {
            history.splice(HISTORY_CONFIG.MAX_HISTORY_ITEMS);
        }
        
        // 保存到Cookie
        saveHistoryToCookie(history);
    } catch (error) {
        console.error('添加历史记录失败:', error);
    }
}

/**
 * 获取路径对应的URL编号
 * @param {Array} path - 路径数组
 * @returns {number|null} URL编号或null
 */
function getUrlNumberForPath(path) {
    try {
        // 查找当前路径对应的数字编号
        for (const [number, storedPath] of numberToPathMap.entries()) {
            if (arraysEqual(storedPath, path)) {
                return number;
            }
        }
        // 如果没有完全匹配，尝试查找部分匹配
        let closestNumber = null;
        let closestDepth = -1;
        
        for (const [number, storedPath] of numberToPathMap.entries()) {
            // 检查已知路径是否是当前路径的前缀
            let isPrefix = true;
            for (let i = 0; i < storedPath.length; i++) {
                if (i >= path.length || storedPath[i] !== path[i]) {
                    isPrefix = false;
                    break;
                }
            }
            
            if (isPrefix && storedPath.length > closestDepth) {
                closestDepth = storedPath.length;
                closestNumber = number;
            }
        }
        
        return closestNumber;
    } catch (error) {
        console.error('获取URL编号失败:', error);
        return null;
    }
}

/**
 * 格式化路径为标题
 * @param {Array} path - 路径数组
 * @returns {string} 格式化后的标题
 */
function formatPathTitle(path) {
    if (!path || path.length === 0) {
        return '根目录';
    }
    // 按照用户要求，使用第一层级名/第二层级名的格式
    if (path.length >= 2) {
        return `${path[0]}/${path[1]}`;
    }
    return path[0];
}

/**
 * 在新标签页中显示历史记录页面
 */
function showHistoryPage() {
    try {
        const history = getHistoryFromCookie();
        
        // 创建一个新的HTML页面内容
        const htmlContent = generateHistoryPageHTML(history);
        
        // 创建一个Blob对象
        const blob = new Blob([htmlContent], { type: 'text/html' });
        
        // 创建URL
        const url = URL.createObjectURL(blob);
        
        // 在新标签页打开
        const newTab = window.open(url, '_blank');
        
        // 延迟清理URL对象，给页面足够的加载时间
        setTimeout(() => {
            try {
                URL.revokeObjectURL(url);
            } catch (e) {
                console.log('URL已经被清理或无法清理:', e);
            }
        }, 5000); // 5秒后再清理，给页面足够时间加载
    } catch (error) {
        console.error('显示历史记录失败:', error);
        alert('显示历史记录失败，请稍后再试。');
    }
}

/**
 * 生成历史记录页面的HTML内容
 * @param {Array} history - 历史记录数组
 * @returns {string} HTML内容
 */
function generateHistoryPageHTML(history) {
    // 按时间倒序排列（最新的在前）
    const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);
    
    // 获取当前网站的基础URL，用于构建绝对路径
    const baseUrl = window.location.origin + window.location.pathname;
    
    // 生成历史记录列表HTML
    let historyItemsHTML = '';
    
    if (!history || history.length === 0) {
        historyItemsHTML = '<li class="history-empty">暂无历史记录</li>';
    } else {
        sortedHistory.forEach(record => {
            const timestamp = formatTimestamp(record.timestamp);
            
            // 如果有URL编号，直接使用编号作为锚点，不添加path参数
            if (record.urlNumber) {
                const fullUrl = `${baseUrl}#${record.urlNumber}`;
                historyItemsHTML += `
                    <li class="history-item">
                        <a href="${fullUrl}" target="_blank" class="history-link">${record.title}</a>
                        <span class="history-time">${timestamp}</span>
                    </li>
                `;
            } else {
                // 没有URL编号的情况，使用path参数
                const pathParam = encodeURIComponent(JSON.stringify(record.path));
                const fullUrl = `${baseUrl}?path=${pathParam}`;
                historyItemsHTML += `
                    <li class="history-item">
                        <a href="${fullUrl}" target="_blank" class="history-link">${record.title}</a>
                        <span class="history-time">${timestamp}</span>
                    </li>
                `;
            }
        });
    }
    
    // 完整的HTML页面
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>浏览历史 - BeijiuX 资源库</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }
        h1 {
            color: #1a73e8;
            margin: 0 0 20px 0;
        }
        .legal-links {
            margin-bottom: 20px;
            font-size: 14px;
        }
        .legal-links a {
            color: #007bff;
            text-decoration: none;
            margin-right: 20px;
        }
        .legal-links a:hover {
            text-decoration: underline;
        }
        .history-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .history-item {
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .history-item:last-child {
            border-bottom: none;
        }
        .history-link {
            color: #1a73e8;
            text-decoration: none;
            font-size: 16px;
            flex: 1;
        }
        .history-link:hover {
            text-decoration: underline;
        }
        .history-time {
            color: #6c757d;
            font-size: 14px;
            margin-left: 20px;
            white-space: nowrap;
        }
        .history-empty {
            color: #95a5a6;
            text-align: center;
            padding: 40px 0;
            font-style: italic;
        }
        .no-history {
            text-align: center;
            color: #6c757d;
            padding: 40px 0;
        }
        /* 模态框样式 */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .modal-content {
            background: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .modal-header h2 {
            margin: 0;
            color: #333;
        }
        .close-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .close-btn:hover {
            color: #333;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>浏览历史</h1>
        <div class="legal-links">
            <a href="#" id="user-agreement-link">用户协议</a>
            <a href="#" id="about-cookie-link">了解cookie</a>
        </div>
        <ul class="history-list">
            ${historyItemsHTML}
        </ul>
    </div>

    <!-- 用户协议模态框 -->
    <div id="user-agreement-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>用户协议</h2>
                <button class="close-btn" onclick="closeModal('user-agreement-modal')">×</button>
            </div>
            <div class="modal-body">
                <h3>中文</h3>
                <p>欢迎使用BeijiuX资源库。在使用本网站前，请您仔细阅读以下用户协议内容。</p>
                <p>本网站不会主动搜集、上传任何用户信息，也不会使用任何非必要的权限。</p>
                <p>本网站仅在本地存储浏览历史记录，这些记录不会被上传到服务器或分享给任何第三方。</p>
                <p>您可以随时清除浏览器的Cookie来删除所有本地存储的历史记录。</p>
                <p>使用本网站即表示您同意上述条款。如有任何问题或建议，请随时联系我们。</p>
                
                <h3>English</h3>
                <p>Welcome to BeijiuX Resource Library. Please read the following user agreement carefully before using this website.</p>
                <p>This website does not actively collect or upload any user information, nor does it use any unnecessary permissions.</p>
                <p>This website only stores browsing history locally, and these records will not be uploaded to servers or shared with any third parties.</p>
                <p>You can clear your browser's cookies at any time to delete all locally stored history records.</p>
                <p>Using this website indicates that you agree to the above terms. If you have any questions or suggestions, please feel free to contact us.</p>
            </div>
        </div>
    </div>

    <!-- 了解Cookie模态框 -->
    <div id="about-cookie-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>了解Cookie</h2>
                <button class="close-btn" onclick="closeModal('about-cookie-modal')">×</button>
            </div>
            <div class="modal-body">
                <p><strong>什么是Cookie？</strong></p>
                <p>Cookie是一种小型文本文件，网站可以将其存储在您的计算机或移动设备上。它可以帮助网站记住您的访问偏好和行为。</p>
                
                <p><strong>本网站如何使用Cookie？</strong></p>
                <p>本网站默认使用Cookie存储您的浏览历史记录，这些记录仅存储在您的本地设备上，不会被本网站或其他人员知晓。</p>
                <p>我们使用Cookie的目的是为了提供更便捷的浏览体验，让您能够快速访问之前浏览过的内容。</p>
                
                <p><strong>Cookie的隐私和安全</strong></p>
                <p>由于Cookie仅存储在您的本地设备上，因此您可以随时通过浏览器设置来管理或删除Cookie。请注意，如果您清除Cookie，将会丢失此前所有的浏览历史记录。</p>
                
                <p><strong>如何管理Cookie？</strong></p>
                <p>大多数网络浏览器默认接受Cookie，但您通常可以修改浏览器设置来拒绝Cookie。具体操作方法请参考您使用的浏览器的帮助文档。</p>
            </div>
        </div>
    </div>

    <script>
        // 打开模态框
        function openModal(modalId) {
            const modal = document.getElementById(modalId);
            modal.style.display = 'flex';
        }
        
        // 关闭模态框
        function closeModal(modalId) {
            const modal = document.getElementById(modalId);
            modal.style.display = 'none';
        }
        
        // 为链接添加点击事件
        document.getElementById('user-agreement-link').addEventListener('click', function(e) {
            e.preventDefault();
            openModal('user-agreement-modal');
        });
        
        document.getElementById('about-cookie-link').addEventListener('click', function(e) {
            e.preventDefault();
            openModal('about-cookie-modal');
        });
        
        // 点击模态框外部关闭模态框
        window.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });
    </script>
</body>
</html>
    `;
}

/**
 * 格式化时间戳
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化后的时间字符串
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // 如果是今天
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // 如果是昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // 如果是今年
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
    
    // 其他情况显示完整日期
    return date.toLocaleDateString('zh-CN');
}

/**
 * 初始化历史记录功能
 */
function initializeHistoryManager() {
    // 创建历史记录按钮
    createHistoryButton();
}

/**
 * 创建历史记录按钮（右上角小写H按钮）
 */
function createHistoryButton() {
    // 检查是否已存在历史记录按钮
    if (document.getElementById('history-button')) {
        return;
    }
    
    // 创建历史记录按钮
    const historyButton = document.createElement('button');
    historyButton.id = 'history-button';
    historyButton.className = 'history-button';
    historyButton.textContent = 'h';
    historyButton.title = '浏览历史';
    
    // 添加点击事件
    historyButton.addEventListener('click', showHistoryPage);
    
    // 添加到页面右上角
    document.body.appendChild(historyButton);
}

// 等待DOM加载完成后初始化历史记录管理器
document.addEventListener('DOMContentLoaded', initializeHistoryManager);

// 导出函数供其他模块使用
// 注意：在浏览器环境中，如果需要模块化，可能需要使用 ES6 模块