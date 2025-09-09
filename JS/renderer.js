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
          // 同步到 URL
          syncPathToUrl();
          
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
          // 同步到 URL
          syncPathToUrl();
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

function showLoading() {
  document.getElementById("loading").classList.remove("hide");
}

function hideLoading() {
  document.getElementById("loading").classList.add("hide");
}