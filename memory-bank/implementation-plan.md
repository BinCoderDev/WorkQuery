# 实施计划

> 基于 [design-document.md](./design-document.md) 和 [tech-stack.md](./tech-stack.md) 生成。
> 每一步无代码、小而具体、有序、可独立验证。
> 假定用户是每步的测试把关人。

---

## 第 0 阶段：环境搭建

### 步骤 0.1 — 创建 uni-app 项目并关联微信云开发

**任务：**
1. 使用 HBuilderX 或 Vue CLI 创建 uni-app 项目（Vue 3 模板），项目名 `workquery`
2. 在微信开发者工具中创建对应的小程序项目（AppID 需已开通云开发）
3. 在 uni-app 项目中配置 `manifest.json`，填写微信小程序 AppID
4. 在 `App.vue` 的 `onLaunch` 中调用 `wx.cloud.init({ env: '你的云环境ID' })`
5. 确保项目目录中有 `cloudfunctions/` 目录（存放云函数）

**验证方式：**
- uni-app 项目在 HBuilderX 中可成功编译并运行到微信开发者工具
- 微信开发者工具控制台输出云开发初始化成功日志
- 可在微信开发者工具"云开发"面板中看到云数据库、云存储、云函数入口

---

### 步骤 0.2 — 建立前端目录结构与路由

**任务：**
1. 按设计文档的页面路由架构建立 `pages/` 目录结构：
   - `pages/banks/index`（题库首页）
   - `pages/study/mode-select`（模式选择）
   - `pages/study/answer`（答题页）
   - `pages/reference/index`（速查首页）
   - `pages/reference/list`（知识点列表）
   - `pages/reference/detail`（知识点详情）
   - `pages/reference/search`（全局搜索）
   - `pages/mine/index`（我的首页）
   - `pages/mine/wrong-questions`（错题本）
   - `pages/mine/favorites`（收藏夹）
2. 在 `pages.json` 中配置 tabBar（题库/速查/我的，使用 uni-icons 图标）
3. 配置全局 `App.vue` 引入 uni-ui 样式
4. 安装并配置 Pinia（在 `main.js` 中 `app.use(createPinia())`）

**验证方式：**
- 小程序底部 Tab 栏正常显示 3 个 tab 图标和文字
- 点击每个 tab 可切换到对应空白页面
- 页面标题正确显示

---

### 步骤 0.3 — 创建 Pinia Store 骨架

**任务：**
1. 创建 `stores/` 目录
2. 创建 `stores/settings.js`：管理 `darkMode`、`adEnabled`，读写本地 Storage
3. 创建 `stores/banks.js`：管理题库列表（从云函数获取）
4. 创建 `stores/user.js`：管理用户错题、收藏、进度（从云函数同步）
5. 每个 store 用 Composition API 风格（`defineStore` + `setup` 函数）

**验证方式：**
- 在小程序任意页面 `onShow` 中调用 `settingsStore.darkMode`，控制台输出当前值
- 调用 `settingsStore.toggleDarkMode('dark')`，确认值变更并持久化到 `wx.Storage`

---

## 第 1 阶段：云数据库与云函数

### 步骤 1.1 — 设计并创建云数据库集合

**任务：**
1. 在微信云开发控制台创建以下集合：
   - `banks`
   - `questions`
   - `knowledge_items`
   - `user_wrong_questions`
   - `user_favorites`
   - `user_progress`
2. 为每个集合设置权限：
   - 内容集合（banks, questions, knowledge_items）：所有用户可读，仅管理员可写
   - 用户数据集合（user_wrong_questions, user_favorites, user_progress）：仅创建者可读写
3. 为关键查询字段创建索引：
   - `questions`: `bankId` + `orderIndex`
   - `knowledge_items`: `categoryId` + `usageFrequency`
   - `user_wrong_questions`: `_openid` + `questionId`
   - `user_favorites`: `_openid` + `itemType`

**验证方式：**
- 云开发控制台可见 6 个集合
- 在控制台中对 `banks` 手动插入一条测试数据，查询成功返回

---

### 步骤 1.2 — 实现云函数 `getBanks`

**任务：**
1. 在 `cloudfunctions/getBanks/` 创建云函数（Node.js）
2. 查询 `banks` 集合中所有 `isActive: true` 的文档，按 `order` 升序排列
3. 返回 `{ code: 0, data: banksArray }`
4. 部署并测试

**验证方式：**
- 在微信开发者工具云函数面板中点击"测试"，传入 `{}`，返回题库列表 JSON
- 如果 banks 集合中有测试数据，返回包含该数据

---

### 步骤 1.3 — 实现云函数 `getQuestions`

**任务：**
1. 创建云函数 `getQuestions`
2. 接收参数 `{ bankId, pageIndex: 0, pageSize: 20 }`
3. 从 `questions` 集合按 `bankId` 筛选，按 `orderIndex` 排序，支持分页
4. 返回 `{ code: 0, data: { questions: [], total: N, hasMore: bool } }`
5. 部署并测试

**验证方式：**
- 在云函数测试面板传入 `{ bankId: "excel" }`，返回分页结果
- 传入 `{ bankId: "not_exist" }` 返回空数组

---

### 步骤 1.4 — 实现云函数 `getKnowledge*` 系列

**任务：**
1. 创建云函数 `getKnowledgeCategories`：聚合查询所有 `categoryId` 和 `categoryName`，返回分类列表
2. 创建云函数 `getKnowledgeItems`：按 `categoryId` 筛选知识点，支持 `sortBy` 参数（`usageFrequency` | `title`）
3. 创建云函数 `getKnowledgeDetail`：按 `knowledgeId` 查询单条知识点详情
4. 部署并测试

**验证方式：**
- 测试 `getKnowledgeCategories` 返回分类列表
- 测试 `getKnowledgeItems` 传入 `{ categoryId: "excel" }` 返回对应知识点
- 测试 `getKnowledgeDetail` 传入 `{ knowledgeId: "excel_know_005" }` 返回单条详情

---

### 步骤 1.5 — 实现云函数 `search`

**任务：**
1. 创建云函数 `search`
2. 接收参数 `{ keyword, limit: 20 }`
3. 搜索策略：用云数据库正则匹配分别搜索 `questions` 的 `question` 字段和 `knowledge_items` 的 `title`、`tags`
4. 合并结果并按匹配度排序（标题完全匹配 > 标题部分匹配 > 标签匹配 > 正文匹配）
5. 每条结果返回 `{ type: 'question'|'knowledge', id, title, preview }`
6. 部署并测试

**验证方式：**
- 传入 `{ keyword: "VLOOKUP" }` 返回包含该关键词的题目/知识点
- 传入 `{ keyword: "不存在的关键词xyz" }` 返回空数组

---

### 步骤 1.6 — 实现用户数据云函数系列

**任务：**
1. 创建 `syncWrongQuestions` 云函数：支持 `action` 参数（`add` | `remove` | `list` | `clear`）
   - `add`: 按 `_openid + questionId` upsert 错题记录，错误次数 +1
   - `remove`: 删除指定错题
   - `list`: 分页返回当前用户的错题列表（按 bankId 分组）
   - `clear`: 清空当前用户的全部错题
2. 创建 `syncFavorites` 云函数：支持 `action` 参数（`add` | `remove` | `list` | `batchRemove`）
   - `add`: 插入收藏记录
   - `remove`: 删除指定收藏
   - `list`: 返回当前用户收藏，支持 `itemType` 筛选
   - `batchRemove`: 批量删除指定 itemId 列表
3. 创建 `syncProgress` 云函数：支持 `save` | `get`
   - `save`: 按 `_openid + bankId` upsert 进度
   - `get`: 返回当前用户所有题库进度
4. 部署并测试

**验证方式：**
- 调用 `syncWrongQuestions` 的 `add` action，在云数据库控制台确认新增记录包含 `_openid`
- 调用 `list` 返回已添加的错题
- 测试 `remove` 后确认记录被删除

---

## 第 2 阶段：题库首页与答题核心（前端）

### 步骤 2.1 — 实现题库首页 (`pages/banks/index`)

**任务：**
1. 页面 `onLoad` 时调用 `getBanks` 云函数获取题库列表
2. 用 uni-ui `<uni-card>` 或自写卡片组件渲染题库卡片
3. 每张卡片展示：题库图标(emoji)、名称、题量、简介
4. 卡片点击跳转至 `pages/study/mode-select?bankId=xxx`
5. 加载中展示骨架屏（uni-ui `<uni-skeleton>`）
6. 加载失败展示"加载失败"+ 重试按钮
7. 底部预留 Banner 广告位（先用占位 View）

**验证方式：**
- 页面可正确显示云数据库中的题库卡片
- 点击卡片跳转到模式选择页，URL 参数正确
- 断网场景下展示错误状态和重试按钮

---

### 步骤 2.2 — 实现模式选择页 (`pages/study/mode-select`)

**任务：**
1. 接收 `bankId` 参数
2. 展示题库名称、总题数
3. 两个 uni-ui `<uni-card>` 式按钮：「顺序练习」「随机刷题」
4. 顺序练习按钮下方：调用 `syncProgress.get` 检查进度，有进度时显示「已完成 X 题，继续练习」
5. 点击按钮跳转 `pages/study/answer?bankId=xxx&mode=sequential|random`
6. 无进度时从第 1 题开始（currentIndex = 0）

**验证方式：**
- 页面正确展示题库信息
- 有历史进度时显示进度提示文字
- 点击不同模式按钮跳转 URL 参数正确

---

### 步骤 2.3 — 实现答题页核心逻辑 (`pages/study/answer`) 第 1 部分：题目渲染

**任务：**
1. 接收参数 `bankId`, `mode`
2. 调用 `getQuestions` 云函数获取题目列表（顺序模式获取全部，随机模式打乱前 50 题）
3. 使用 `<swiper>` + `<swiper-item>` 组件渲染题目卡片（支持左右滑动）
4. 每一页展示：题号/总数、题干、4 个选项按钮、收藏按钮
5. 选项为未点击状态（灰色边框）
6. 如果题干中有 `codeBlocks`，用 `<rich-text>` 渲染 `codeHtml`
7. 顶部栏显示返回按钮 + "第 X/N 题" + 收藏按钮(☆/★)
8. 滑动时更新当前题号和选项状态

**验证方式：**
- 题目正确渲染，4 个选项可点击
- 代码块语法高亮正确显示
- 左右滑动可在题目间切换
- 题号正确更新

---

### 步骤 2.4 — 实现答题页核心逻辑 第 2 部分：判题与解析

**任务：**
1. 点击选项后：判定正确/错误
   - 正确选项背景变绿（`#07C160`，0.3s 过渡动画）
   - 错误选项背景变红（`#FA5151`），正确选项同时变绿
2. 判题后选项锁定，不可再次点击同一题的选项
3. 判定后 300ms 自动展开答案解析区（使用 uni-app `animation` API 或 CSS transition 下滑）
4. 解析区展示：文字解析 + 代码块（rich-text）+ 关联知识点标签（可点击跳转详情）
5. 错题自动调用 `syncWrongQuestions.add` 同步至云数据库
6. 广告计数器 +1，每 10 题触发一次插屏广告（调用 `wx.createInterstitialAd`）
7. 底部「上一题」「下一题」按钮
   - 第 1 题时「上一题」置灰
   - 最后一题时「下一题」变为「完成」（顺序模式）

**验证方式：**
- 选对选项变绿，解析展开
- 选错选项变红、正确变绿，解析展开
- 判定后不可再次点击选项
- 错题在云数据库中出现（确认 `user_wrong_questions` 集合）
- 关联知识点标签可点击跳转
- 答题 10 次后出现插屏广告

---

### 步骤 2.5 — 实现答题页核心逻辑 第 3 部分：进度与完成

**任务：**
1. 每次切换题目时调用 `syncProgress.save` 保存当前进度
2. 顺序模式最后一题点击「完成」后弹出模态框「🎉 恭喜完成！」，两个按钮：
   - 「重新刷题」→ 进度重置（currentIndex=0），重新获取题目
   - 「返回题库」→ `navigateBack` 回到题库首页
3. 随机模式「下一题」永远不显示「完成」，可无限刷题
4. 收藏按钮切换：调用 `syncFavorites.add/remove`，图标即时切换 ☆↔★

**验证方式：**
- 刷到一半退出，再次进入顺序练习可恢复上次进度
- 顺序模式全部答完弹出完成提示
- 随机模式可无限刷题
- 收藏状态在云数据库和 UI 上正确同步

---

## 第 3 阶段：速查手册

### 步骤 3.1 — 实现速查首页 (`pages/reference/index`)

**任务：**
1. 顶部搜索框：样式为圆角输入框 + 搜索图标，placeholder "搜索 Excel函数、Python语法…"
2. 点击搜索框 → 跳转到 `pages/reference/search`
3. 下方分类卡片列表：调用 `getKnowledgeCategories` 云函数获取分类
4. 卡片样式与题库首页统一，点击跳转 `pages/reference/list?categoryId=xxx`
5. 加载中展示骨架屏

**验证方式：**
- 分类卡片正确展示
- 点击搜索框跳转搜索页
- 点击分类卡片跳转知识点列表页

---

### 步骤 3.2 — 实现知识点列表页 (`pages/reference/list`)

**任务：**
1. 接收参数 `categoryId`
2. 调用 `getKnowledgeItems` 获取知识点列表
3. 右侧排序切换按钮：「使用频率」「字母顺序」，选择后重新请求排序数据
4. 知识点按 `group` 字段分组展示，每组有标题行
5. 每组下的知识点显示：标题 + 一行摘要（超出截断）
6. 点击条目跳转 `pages/reference/detail?knowledgeId=xxx`

**验证方式：**
- 列表正确按分组展示
- 切换排序方式后列表重新排列
- 点击条目跳转到详情页

---

### 步骤 3.3 — 实现知识点详情页 (`pages/reference/detail`)

**任务：**
1. 接收参数 `knowledgeId`
2. 调用 `getKnowledgeDetail` 获取详情
3. 页面内容：标题、语法定义（等宽字体灰底框）、使用说明、参数表（uni-app `<table>` 或 grid 布局）、示例（含 rich-text 代码块 + 复制按钮）
4. 复制按钮：`wx.setClipboardData` → toast "已复制"
5. 右上角收藏按钮：调用 `syncFavorites.add/remove`
6. 关联题目标签：可点击跳转到对应题目答题页（通过 questionId 定位）
7. 底部 Banner 广告位

**验证方式：**
- 知识点详情全部内容正确展示
- 代码块复制功能可用
- 收藏按钮状态正确
- 关联题目标签点击跳转正确

---

### 步骤 3.4 — 实现全局搜索页 (`pages/reference/search`)

**任务：**
1. 页面 onLoad 时自动聚焦搜索框，键盘弹起
2. 输入字符 ≥1 触发搜索，防抖 300ms
3. 调用 `search` 云函数，展示结果列表
4. 结果项展示：类型标签（题目/知识点）、标题、摘要，关键词高亮
5. 结果为空时展示"未找到相关内容"空状态
6. 点击结果跳转到对应的题目答题页或知识点详情页

**验证方式：**
- 输入关键词后展示搜索结果
- 关键词在结果中高亮
- 空结果展示提示
- 点击结果正确跳转

---

## 第 4 阶段：我的页面

### 步骤 4.1 — 实现"我的"首页 (`pages/mine/index`)

**任务：**
1. 顶部数据概览区（三列横排）：累计刷题数、错题数、收藏数
   - 数据从 `syncProgress.get`、`syncWrongQuestions.list`、`syncFavorites.list` 汇总
2. 功能入口区：「错题本」卡片（红色图标 + 错题数量）、「我的收藏」卡片（黄色图标 + 收藏总数）
3. 设置区：
   - 深色模式：三选一 radio（跟随系统 / 浅色 / 深色），切换即时生效
   - 广告开关：`<switch>` 组件，默认开
4. 底部操作：「清空所有本地数据」红字按钮、「关于我们」
5. 最底部 Banner 广告位

**验证方式：**
- 数据概览数字正确（与实际刷题/错题/收藏一致）
- 深色模式切换后全局主题即时变化
- 广告开关关闭后，各页面广告位不展示

---

### 步骤 4.2 — 实现错题本 (`pages/mine/wrong-questions`)

**任务：**
1. 顶部分类 tabs：全部 | Excel | Python（从错题列表中动态生成）
2. 列表展示错题：题干预览（截断2行）、错误次数标签（红色）、题库标签
3. 点击跳转答题页：`pages/study/answer?mode=wrongReview&questionId=xxx`
4. 错题重做模式（`mode=wrongReview`）下：
   - 答对后底部弹出操作条：「移出错题本」「保留巩固」
5. 左滑删除：调用 `syncWrongQuestions.remove`
6. 顶部右侧「清空」按钮：二次确认弹窗后调用 `syncWrongQuestions.clear`

**验证方式：**
- 错题列表正确按分类展示
- 点击进入重做模式，答题逻辑与正常一致
- 答对后可移出错题本并即时从列表消失
- 清空功能二次确认后生效

---

### 步骤 4.3 — 实现收藏夹 (`pages/mine/favorites`)

**任务：**
1. 顶部分类 tabs：全部 | 题目 | 知识点
2. 题目类型：展示题干预览，点击跳转对应题目
3. 知识点类型：展示标题+摘要，点击跳转知识点详情
4. 左滑取消收藏
5. 右上角「管理」→ 多选模式 → 底部「取消收藏(已选N项)」

**验证方式：**
- 分类筛选正确
- 取消收藏即时生效
- 批量管理模式可用

---

## 第 5 阶段：离线缓存与兜底

### 步骤 5.1 — 实现离线降级策略

**任务：**
1. 在所有云函数调用外层包裹 try-catch + 网络状态检测
2. 云函数失败时：尝试读取 `offlineCache` 本地存储
3. 错题/收藏写入失败时：先写 `offlineCache`，标记 `_dirty: true`
4. `App.onShow` 时检查 `offlineCache` 中 dirty 数据，网络可用时批量提交云函数
5. 题目数据做一层本地缓存：成功获取后存入 `offlineCache.lastQuestions[bankId]`，离线时直接读取

**验证方式：**
- 断开网络后刷题，错题/收藏仍可操作（存本地）
- 恢复网络后，App 切前台 → 自动同步 → 云数据库中出现离线期间的操作
- 断网后打开题库页，展示缓存的题库列表 + "离线"提示

---

## 第 6 阶段：深色模式完整适配

### 步骤 6.1 — 实现深色模式 CSS 变量体系

**任务：**
1. 在 `App.vue` 或全局样式文件中定义 CSS 变量：
   - `--bg-primary`（主背景色）
   - `--bg-card`（卡片背景色）
   - `--text-primary`（主文字色）
   - `--text-secondary`（次要文字色）
   - `--border-color`（边框色）
   - `--color-success`（正确绿色）
   - `--color-danger`（错误红色）
2. 定义 `.theme-light` 和 `.theme-dark` 两套变量值
3. 在 App 根节点根据 `settingsStore.darkMode` 动态切换 class
4. 所有页面使用 CSS 变量而非硬编码颜色
5. 监听系统主题变化事件（`wx.onThemeChange`），在 `auto` 模式下跟随切换

**验证方式：**
- 手动切换深色/浅色，所有已实现页面颜色正确变化
- 设为"跟随系统"后，切换手机系统深色模式，小程序跟随变化
- 文字在任何主题下保持可读（对比度 ≥4.5:1）

---

## 第 7 阶段：导入种子数据

### 步骤 7.1 — 编写内容导入脚本

**任务：**
1. 在 `scripts/` 目录创建 `import-questions.js` 脚本（Node.js）
2. 脚本读取本地 JSON 源文件 → 批量写入云数据库 `banks`、`questions` 集合
3. 本地 JSON 源文件放在 `data/banks/excel.json` 和 `data/banks/python.json`
4. 脚本调用微信云开发的 HTTP API 或通过云函数内部操作
5. 每条 question 预先用 highlight.js 编译 `codeHtml` 字段

**验证方式：**
- 运行脚本后，云数据库 `banks` 集合有 2 条记录
- 云数据库 `questions` 集合有 100-200 条 Excel 题 + 100-200 条 Python 题
- 题目中的 `codeHtml` 字段不为空，在答题页可正确渲染

---

### 步骤 7.2 — 导入知识点种子数据

**任务：**
1. 创建 `scripts/import-knowledge.js`
2. 源文件 `data/knowledge/excel.json` 和 `data/knowledge/python.json`
3. 写入云数据库 `knowledge_items` 集合
4. 确保 `relatedQuestionIds` 字段与 `questions` 中的 `questionId` 对应

**验证方式：**
- 云数据库 `knowledge_items` 集合有 30-50 条 Excel 知识点 + 30-50 条 Python 知识点
- 知识点详情页可正确展示参数表和示例代码

---

## 第 8 阶段：广告接入与收尾

### 步骤 8.1 — 接入微信流量主广告

**任务：**
1. 在需要展示广告的页面引入微信广告组件：
   - Banner 广告：题库首页底部、速查详情底部、我的页面底部
   - 插屏广告：答题页每 10 题触发
2. 广告展示受 `settings.adEnabled` 控制（关闭时不创建广告实例）
3. 广告加载失败静默降级（不展示占位）
4. 插屏广告在用户关闭广告后再进行下一题操作

**验证方式：**
- 广告位在对应页面底部正常展示
- 关闭广告开关后，所有广告消失
- 答题 10 题后出现插屏广告，关闭后可继续答题
- 广告加载失败不影响核心功能

---

### 步骤 8.2 — 端到端真机测试

**任务：**
1. 在 iOS 和 Android 真机上各完成一次完整的用户旅程：
   - 打开小程序 → 浏览题库 → 顺序刷 15 题 → 查看错题本 → 重做错题
   - 速查 → 搜索 → 浏览知识点 → 收藏
   - 切换深色模式 → 验证所有页面
2. 测试离线场景：飞行模式下刷题 → 恢复网络 → 验证同步
3. 验证所有 40 条验收标准（见 design-document.md）

**验证方式：**
- 所有 AC-01 ~ AC-40 通过
- 无崩溃、无白屏、无卡顿
- 首屏加载 ≤2 秒

---

### 步骤 8.3 — 提交微信审核并发布

**任务：**
1. 确保小程序主包体积 ≤2MB（分包配置如需）
2. 在微信开发者工具中上传代码
3. 微信公众平台填写小程序信息、类目、功能页面
4. 提交审核

**验证方式：**
- 上传成功，版本管理可见
- 审核通过，小程序可被搜索和访问
