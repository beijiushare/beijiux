// 全局状态
let currentPath = [];
// 基础 Giscus 链接模板
const baseGiscusUrl = "https://giscus.app/zh-CN/widget?origin=http%3A%2F%2F127.0.0.1%3A5500%2F&session=149fe82e2daee83dcc51ad25y5OeLQ%2Bz%2FL5yVVME5wK2IqQB3Q2d5qFVGddUtS%2FyouBsyyuroZeW7dZZWCOglt9R8uPc7k%2FBdIVAx22xwMlsQT0%2B3uTPNzZfWCEitbs2tWpy5Xj3kC66G8PiNH0%3D&theme=preferred_color_scheme&reactionsEnabled=1&emitMetadata=0&inputPosition=top&repo=beijiushare%2Fbeijiux&repoId=R_kgDOOkuBRg&category=&categoryId=undefined&strict=0&description=&backLink=http%3A%2F%2F127.0.0.1%3A5500%2F&number=";

// 存储当前的 term
let currentGiscusTerm = "5";

// 直接定义content.json的数据，无需通过fetch加载
const contentData = {
  "index": "0.md",
  "1_日常": {
    "index": "1_0.md",
    "1_下载工具": {
      "index": "1_1.md",
      "dataFile": "datadetail/1_1.json"
    },
    "2_解压缩": {
      "dataFile": "datadetail/1_2.json"
    }
  },
  "2_办公": {},
  "3_娱乐": {},
  "4_杂项": {
    "index": "4_0.md",
    "1_公众号推荐": {
      "index": "4_1.md"
    }
  },
  "5_本站特供": {
    "index": "5_0.md",
    "1_浏览器扩展": {
      "dataFile": "datadetail/5_1.json"
    },
    "2_脚本": {
    }
  }
};

// 工具函数：递归加载 JSON 数据（修改版，只加载子数据文件）
// 在文件末尾（giscusButton事件监听器之后）添加以下代码

// 预加载的数据缓存
const preloadedDataCache = new Map();

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

// 修改initialize函数，使用智能预加载
async function initialize() {
  showLoading();
  try {
    // 直接使用contentData，不再通过fetch加载
    displayCatalog(contentData, document.getElementById("catalog"));
    updatePath();
    // 初始化完成后智能预加载所有datadetail中的JSON文件
    smartPreloadData();
  } finally {
    hideLoading();
  }
}

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
function showLoading() {
  document.getElementById("loading").classList.remove("hide");
}

function hideLoading() {
  document.getElementById("loading").classList.add("hide");
}

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
      }).catch(() => {
        displayCatalog(currentData, document.getElementById("catalog"));
        hideLoading();
      });
    } else {
      displayCatalog(currentData, document.getElementById("catalog"));
      hideLoading();
    }
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

function displayCatalog(data, parentElement) {
  parentElement.innerHTML = "";
  const markdownContent = document.getElementById("markdown-content");
  markdownContent.innerHTML = "";

  if (Object.keys(data).length === 0) {
    parentElement.innerHTML =
      '<li class="empty-message">暂无内容（数据加载失败或目录为空）</li>';
    return;
  }

  // 处理层级描述（index.md）
  if (data.index) {
    const indexPath = `doc/${data.index.replace(/^\.\//, "")}`;
    fetch(indexPath)
      .then((res) => res.text())
      .then((text) => {
        markdownContent.innerHTML = marked.parse(text);
        // 提取 data-term 并更新 Giscus iframe
        const termMatch = text.match(/<!--\s*data-term="(\d+)"\s*-->/);
        const term = termMatch ? termMatch[1] : "5";
        updateGiscusIframe(term);
      })
      .catch((error) => {
        console.error("加载描述文件失败，路径:", indexPath, "错误:", error);
        markdownContent.innerHTML = `<div>加载描述失败（路径: ${indexPath}，错误已记录控制台）</div>`;
      });
  } else {
    markdownContent.innerHTML = "<div>本页面暂无描述</div>";
    // 若没有描述文件，设置默认的评论区
    updateGiscusIframe("5");
  }

  // 渲染目录列表
  try {
    for (const key in data) {
      if (key === "index") continue;

      const li = document.createElement("li");
      const value = data[key];

      const isMdFile =
        typeof value === "string" && value.toLowerCase().endsWith(".md");
      const isFinalLevel = value && value.flag === "1";
      const fileIcon =
        isFinalLevel || isMdFile
          ? "📄"
          : typeof value === "object" && value !== null
          ? "📁"
          : "📄";
      li.innerHTML = `<span class="file-icon">${fileIcon}</span>${key}`;

      if (isFinalLevel) {
        // 最后一个层级，弹出包含链接按钮的弹窗
        li.className = "file";
        li.addEventListener("click", () => {
          const modal = document.createElement("div");
          modal.className = "custom-modal";

          const modalContent = document.createElement("div");
          modalContent.className = "modal-content";

          // 遍历除 flag 外的其他属性作为链接
          for (const linkKey in value) {
            if (linkKey === "flag") continue;
            const linkBtn = document.createElement("button");
            linkBtn.className = "modal-link-btn";
            linkBtn.textContent = linkKey;
            linkBtn.addEventListener("click", () => {
              if (linkKey === "MixFile") {
                // 复制 MixFile 链接
                navigator.clipboard
                  .writeText(value[linkKey])
                  .then(() => {
                    showCopyNotice();
                    modal.remove(); // 点击后关闭弹窗
                  })
                  .catch((err) => {
                    console.error("复制链接失败:", err);
                    window.open(value[linkKey], "_blank");
                    modal.remove();
                  });
              } else {
                window.open(value[linkKey], "_blank");
                modal.remove(); // 点击后关闭弹窗
              }
            });
            modalContent.appendChild(linkBtn);
          }

          // 创建关闭按钮
          const closeBtn = document.createElement("button");
          closeBtn.className = "modal-close-btn";
          closeBtn.textContent = "×";
          closeBtn.addEventListener("click", () => {
            modal.remove();
          });
          modalContent.appendChild(closeBtn);

          modal.appendChild(modalContent);
          document.body.appendChild(modal);
        });
      } else if (isMdFile) {
        // Markdown 文件处理
        li.className = "file";
        li.addEventListener("click", () => {
          currentPath = [key];
          updatePath();
          const mdFullPath = `doc/${value}`;
          fetch(mdFullPath)
            .then((res) => res.text())
            .then((text) => {
              markdownContent.innerHTML = marked.parse(text);
              const termMatch = text.match(/<!--\s*data-term="(\d+)"\s*-->/);
              const term = termMatch ? termMatch[1] : "5";
              updateGiscusIframe(term);
            })
            .catch((err) => {
              markdownContent.innerHTML = `<div>文件加载失败：${mdFullPath}</div>`;
            });
        });
      } else if (typeof value === "object" && value !== null) {
        // 文件夹处理
        li.addEventListener("click", () => {
          currentPath.push(key);
          updatePath();
          navigateToPath();
        });
      } else {
        // 普通文件处理
        li.className = "file";
        li.addEventListener("click", () => window.open(value, "_blank"));
      }
      parentElement.appendChild(li);
    }
  } catch (error) {
    console.error("目录渲染错误:", error);
    parentElement.innerHTML =
      '<li class="empty-message">目录渲染失败，请刷新页面</li>';
  }
}

async function initialize() {
  showLoading();
  try {
    // 直接使用contentData，不再通过fetch加载
    displayCatalog(contentData, document.getElementById("catalog"));
    updatePath();
    // 初始化完成后预加载datadetail中的JSON文件
    preloadDataDetailFiles();
  } finally {
    hideLoading();
  }
}
initialize();

// 获取按钮元素
const giscusButton = document.getElementById("giscus-button");

// 为按钮添加点击事件监听器
giscusButton.addEventListener("click", () => {
  const giscusUrl = baseGiscusUrl + currentGiscusTerm;
  // 跳转到新页面
  window.open(giscusUrl, "_blank");
});