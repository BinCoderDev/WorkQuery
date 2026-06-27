# WorkQuery — 职场技能速查刷题小程序

轻量化职场技能学习工具，**刷题巩固 + 即查即用**，覆盖 Excel / Python / MySQL / Java 四大技能方向。

<p align="center">
  <img src="https://img.shields.io/badge/uni--app-3.x-007AFF?logo=vue.js" alt="uni-app">
  <img src="https://img.shields.io/badge/Vue-3.4-4FC08D?logo=vue.js" alt="Vue 3">
  <img src="https://img.shields.io/badge/Pinia-2.x-FFD700" alt="Pinia">
  <img src="https://img.shields.io/badge/微信云开发-NoSQL-07C160?logo=wechat" alt="微信云开发">
</p>

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端框架** | uni-app 3.x (Vue 3 Composition API) | 一套代码编译为微信小程序 |
| **状态管理** | Pinia 2.x | Vue 3 官方推荐 |
| **样式** | SCSS + CSS 变量 | 深浅色主题切换 |
| **后端** | 微信云函数 (Node.js 18) | 免运维 Serverless |
| **数据库** | 微信云数据库 (NoSQL 文档型) | 类 MongoDB，JSON 文档存储 |
| **认证** | 微信 OpenID 静默获取 | 免注册免登录 |

---

## 核心功能

### 📝 刷题模块
- **4 大题库**：Excel / Python / MySQL / Java，每个 200 题，从易到难
- **双模式**：顺序练习（记录进度）/ 随机刷题（碎片巩固）
- **即时判题**：点击即判，绿对红错，自动展开解析
- **错题本**：自动收录，分类筛选，重做巩固
- **收藏夹**：题目和知识点均可收藏，批量管理
- **滑动切题**：Swiper 手势滑动
- **代码高亮**：语法高亮 + 一键复制

### 🔍 速查手册
- **知识分类**：4 个类别共 36 个知识点，按场景分组
- **全局搜索**：模糊匹配题目 + 知识点，关键词高亮
- **知识点详情**：定义 / 语法 / 参数表 / 示例代码
- **关联刷题**：知识点一键跳转对应题目

### 👤 我的
- **数据概览**：累计刷题 / 错题 / 收藏
- **深色模式**：跟随系统 / 浅色 / 深色 三态切换
- **云端同步**：进度 + 错题 + 收藏云端存储
- **离线降级**：断网缓存，恢复后自动同步

---

## 项目结构

```
src/
├── App.vue                      # 根组件：主题系统
├── pages/
│   ├── banks/index.vue          # 题库Tab：4 类别卡片
│   ├── study/
│   │   ├── mode-select.vue      # 模式选择
│   │   └── answer.vue           # 答题引擎
│   ├── reference/
│   │   ├── index.vue            # 速查Tab
│   │   ├── list.vue             # 知识点列表
│   │   ├── detail.vue           # 知识点详情
│   │   └── search.vue           # 全局搜索
│   └── mine/
│       ├── index.vue            # 我的Tab
│       ├── wrong-questions.vue  # 错题本
│       └── favorites.vue        # 收藏夹
└── stores/
    ├── settings.js              # 主题 + 广告
    ├── banks.js                 # 题库 + 缓存
    └── user.js                  # 错题/收藏/进度 + 云同步

cloudfunctions/                  # 微信云函数
├── getBanks/                    # 题库列表
├── getQuestions/                # 题目分页
├── search/                      # 全局搜索
├── syncWrongQuestions/          # 错题同步
├── syncFavorites/               # 收藏同步
├── syncProgress/                # 进度同步
└── import*/                     # 数据导入

data/
├── banks/                       # 题库种子数据
└── knowledge/                   # 知识点种子数据
```

---

## 数据库

| 集合 | 说明 | 关键字段 |
|------|------|---------|
| `banks` | 题库元信息 | `bankId`, `bankName`, `totalQuestions` |
| `questions` | 题目 (800条) | `questionId`, `bankId`, `question`, `options[]`, `correctIndex`, `explanation`, `orderIndex` |
| `knowledge_items` | 知识点 (36条) | `knowledgeId`, `categoryId`, `title`, `definition`, `syntax`, `examples[]`, `relatedQuestionIds[]` |
| `user_wrong_questions` | 用户错题 | `_openid`, `questionId`, `errorCount` |
| `user_favorites` | 用户收藏 | `_openid`, `itemId`, `itemType` |
| `user_progress` | 刷题进度 | `_openid`, `bankId`, `currentIndex` |

---

## 本地开发

```bash
npm install
npm run dev:mp-weixin
# 微信开发者工具导入 dist/dev/mp-weixin
```

## 部署

1. 微信开发者工具 → 云开发 → 创建环境
2. 修改 `src/App.vue` 中云环境 ID
3. 修改 `src/manifest.json` 中 AppID
4. 逐个部署 `cloudfunctions/` 下的云函数
5. 运行 `importBanks` / `importExcel` 等导入云函数初始化数据

## License

MIT
