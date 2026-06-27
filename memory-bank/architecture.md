# 架构地图

> 当前项目文件清单与关键文件职责。最后更新：2026-06-27（新增 auth 云函数 + 用户登录认证）

## 项目结构

```
WorkQuery/
├── memory-bank/                 # 项目记忆库（长期事实来源）
│   ├── design-document.md       # 产品设计文档（范围、旅程、数据模型、40AC）
│   ├── tech-stack.md            # 技术栈（uni-app + 微信云开发）
│   ├── implementation-plan.md   # 28步实施计划
│   ├── progress.md              # 进度日志（执行记录）
│   └── architecture.md          # 本文件
│
├── src/                         # uni-app 前端源码
│   ├── App.vue                  # 根组件：云开发 init + CSS 变量主题
│   ├── main.js                  # 入口：Vue 3 + Pinia
│   ├── manifest.json            # 微信小程序配置 + cloudfunctionRoot
│   ├── pages.json               # 路由 + tabBar（3 Tab）
│   ├── uni.scss                 # SCSS 全局变量
│   ├── pages/
│   │   ├── banks/index.vue      # 题库Tab：卡片列表 + 进度条
│   │   ├── study/
│   │   │   ├── mode-select.vue  # 刷题模式选择（顺序/随机）
│   │   │   └── answer.vue       # 答题引擎：swiper + 判题 + 同步
│   │   ├── reference/
│   │   │   ├── index.vue        # 速查Tab：分类卡片 + 搜索入口
│   │   │   ├── list.vue         # 知识点分组列表 + 排序
│   │   │   ├── detail.vue       # 知识点详情 + 代码高亮复制
│   │   │   └── search.vue       # 全局模糊搜索 + 关键词高亮
│   │   └── mine/
│   │       ├── index.vue        # 我的Tab：数据概览 + 设置
│   │       ├── wrong-questions.vue  # 错题本：分类 + 重做
│   │       └── favorites.vue    # 收藏夹：分类 + 批量管理
│   ├── stores/
│   │   ├── settings.js          # Pinia: 深色模式 + 广告开关
│   │   ├── banks.js             # Pinia: 题库列表 + 30s缓存
│   │   └── user.js              # Pinia: 错题/收藏/进度 + 云同步
│   └── static/                  # 静态资源（tabBar图标等）
│
├── cloudfunctions/              # 微信云函数
│   ├── auth/                    # 用户认证（登录 + 资料同步）
│   ├── getBanks/                # 获取题库列表
│   ├── getQuestions/            # 获取题目（分页）
│   ├── getKnowledgeCategories/  # 获取速查分类
│   ├── getKnowledgeItems/       # 获取知识点列表
│   ├── getKnowledgeDetail/      # 获取知识点详情
│   ├── search/                  # 全局搜索
│   ├── syncWrongQuestions/      # 错题同步（add/remove/list/clear）
│   ├── syncFavorites/           # 收藏同步（add/remove/list/batchRemove）
│   └── syncProgress/            # 进度同步（save/get）
│
├── data/                        # 种子数据模板
│   ├── banks/excel.json         # Excel 题库模板
│   ├── banks/python.json        # Python 题库模板
│   ├── knowledge/excel.json     # Excel 知识点模板
│   └── knowledge/python.json    # Python 知识点模板
│
├── scripts/
│   └── import-data.js           # 数据导入脚本
│
├── PRD文档.md                   # 原始 PRD
├── CLAUDE.md                    # Agent 指令
├── package.json                 # uni-app 依赖
├── vite.config.js               # Vite 构建
└── index.html                   # H5 入口
```

## 关键文件职责

| 文件 | 职责 | 依赖 |
|------|------|------|
| `src/App.vue` | 云开发初始化（`wx.cloud.init`）、全局主题 CSS 变量、静默登录认证 | auth |
| `src/stores/settings.js` | 深色模式三态 + 广告开关，自动持久化 wx.Storage | - |
| `src/stores/user.js` | 用户认证登录（`wx.login` + auth 云函数）、用户资料同步、错题/收藏/进度 CRUD，云同步 + 离线缓存降级 | auth, syncWrongQuestions, syncFavorites, syncProgress |
| `src/stores/banks.js` | 题库列表获取（云函数 + 30s 缓存），无云环境模拟数据降级 | getBanks |
| `src/pages/study/answer.vue` | 答题引擎核心：swiper 滑动、即时判题、解析动画、错题同步、广告计数 | getQuestions, syncWrongQuestions, syncFavorites, syncProgress |
| `cloudfunctions/auth/` | 用户认证：静默登录返回 openid、同步用户资料（昵称/头像）到 users 集合 | users |
| `cloudfunctions/getQuestions/` | 按 bankId 分页查询题目集合 | questions |
| `cloudfunctions/search/` | 正则模糊匹配题目和知识点，按匹配度排序 | questions, knowledge_items |
| `cloudfunctions/syncWrongQuestions/` | 错题数据 upsert/remove/list/clear，按 _openid 隔离 | user_wrong_questions |
| `data/banks/*.json` | 题库和知识点内容模板，待人工填充后通过 import-data.js 导入 | - |
