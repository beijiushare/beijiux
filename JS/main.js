// 使用requestAnimationFrame确保渲染优先
function initialize() {
    // 先显示loading
    showLoading();
    
    // 初始化路径映射
    initializePathMapping();
    
    // 使用requestAnimationFrame确保浏览器先完成当前帧的渲染
    requestAnimationFrame(() => {
        try {
            // 直接使用contentData，不再通过fetch加载
            displayCatalog(contentData, document.getElementById("catalog"));
            updatePath();
            
            // 使用setTimeout延迟预加载，让页面先渲染完成
            setTimeout(() => {
                smartPreloadData();
            }, 300);
        } catch (error) {
            console.error("初始化错误:", error);
        } finally {
            // 使用requestAnimationFrame确保在渲染完成后再隐藏loading
            requestAnimationFrame(() => {
                hideLoading();
            });
        }
    });
}

// 使用DOMContentLoaded确保DOM完全解析后再初始化
document.addEventListener('DOMContentLoaded', initialize);

// 获取按钮元素
const giscusButton = document.getElementById("giscus-button");

// 为按钮添加点击事件监听器
giscusButton.addEventListener("click", () => {
  const giscusUrl = baseGiscusUrl + currentGiscusTerm;
  // 跳转到新页面
  window.open(giscusUrl, "_blank");
});