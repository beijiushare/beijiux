// 功能函数：更新路径导航
function updatePath() {
    const pathElement = document.getElementById("path");
    pathElement.innerHTML = "";

    // 根目录按钮
    const home = document.createElement("span");
    home.className = "home";
    home.textContent = "根目录";
    home.addEventListener("click", () => {
        currentPath = [];
        updatePath();
        navigateToPath();
        // 同步到 URL
        syncPathToUrl();
    });
    pathElement.appendChild(home);

    if (currentPath.length === 0) return;

    // 路径分隔符
    pathElement.appendChild(document.createTextNode(" > "));

    // 路径分段
    let tempPath = [];
    currentPath.forEach((segment, index) => {
        tempPath.push(segment);
        const span = document.createElement("span");
        span.className = "path-segment";
        span.textContent = segment;

        // 非末级路径可点击返回
        if (index < currentPath.length - 1) {
            span.addEventListener("click", () => {
                currentPath = currentPath.slice(0, index + 1);
                updatePath();
                navigateToPath();
                // 同步到 URL
                syncPathToUrl();
            });
        } else {
            span.style.fontWeight = "bold";
            span.style.color = "#333";
        }

        pathElement.appendChild(span);
        if (index < currentPath.length - 1) {
            const separator = document.createElement("span");
            separator.className = "path-separator";
            separator.textContent = ">";
            pathElement.appendChild(separator);
        }
    });
}

// 功能函数：导航到目标路径
function navigateToPath() {
    showLoading();
    // 直接使用contentData，不再通过fetch加载
    let currentData = contentData;
    try {
        for (const segment of currentPath) {
            currentData = currentData[segment];
        }
        
        // 如果当前数据有dataFile属性，需要加载子数据文件
        if (currentData && currentData.dataFile) {
            loadData(`data/${currentData.dataFile}`).then(subData => {
                const mergedData = { ...currentData, ...subData };
                delete mergedData.dataFile;
                displayCatalog(mergedData, document.getElementById("catalog"));
                hideLoading();
                
                // 导航完成后添加历史记录
                if (typeof addToHistory === 'function') {
                    addToHistory(currentPath);
                }
            }).catch(() => {
                displayCatalog(currentData, document.getElementById("catalog"));
                hideLoading();
                
                // 导航完成后添加历史记录
                if (typeof addToHistory === 'function') {
                    addToHistory(currentPath);
                }
            });
        } else {
            displayCatalog(currentData, document.getElementById("catalog"));
            hideLoading();
            
            // 导航完成后添加历史记录
            if (typeof addToHistory === 'function') {
                addToHistory(currentPath);
            }
        }
        
        // 同步路径到 URL
        syncPathToUrl();
    } catch (error) {
        console.error("路径导航错误:", error);
        displayCatalog({}, document.getElementById("catalog"));
        hideLoading();
    }
}

// 动态更新 Giscus iframe 的 src
function updateGiscusIframe(term) {
    currentGiscusTerm = term;
}

// 新增：显示复制提示
function showCopyNotice() {
    const notice = document.getElementById("copy-notice");
    notice.classList.remove("hidden");
    setTimeout(() => {
        notice.classList.add("hidden");
    }, 5000);
}