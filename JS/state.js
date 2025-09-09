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

// 预加载的数据缓存
const preloadedDataCache = new Map();