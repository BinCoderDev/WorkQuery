# 职场技能速查刷题小程序 — 设计文档

> 文档状态：草稿 | 基于 [PRD文档.md](../PRD%E6%96%87%E6%A1%A3.md) 及 2026-06-27 技术决策澄清生成

## 一、范围与非目标

### 1.1 MVP 范围（本次交付）

| 模块 | 内容 |
|------|------|
| 账号 | 免登录，零授权 |
| 题库 Tab | 垂类卡片导航 → 模式选择（顺序/随机） → 答题页 |
| 答题引擎 | 单选题即时判题、解析展开、错题自动收录、收藏、左右滑切换、代码块高亮+复制 |
| 速查 Tab | 分类导航 → 知识点列表 → 知识点详情；全局模糊搜索 |
| 我的 Tab | 错题本（重做/移除）、收藏夹（分类筛选/取消）、数据概览、清空数据、深色模式开关 |
| 广告 | Banner（题库首页/速查详情/我的）、插屏（每10题触发一次） |
| 内容 | Excel 函数（100-200题 + 30-50知识点）、Python 基础（100-200题 + 30-50知识点） |
| 深色模式 | 手动切换开关，三态：跟随系统 / 浅色 / 深色 |

### 1.2 明确非目标（MVP 不做）

- 账号注册/登录/手机号授权
- 多选题、判断题、填空题
- 交卷、倒计时、分数排行、排行榜
- 激励视频广告
- 后端服务/云函数/用户数据上报
- 题库在线更新（内容随包发版）
- 社交分享、评论、社区功能
- 多语言
- iOS/Android 原生差异功能

---

## 二、用户旅程

### 2.1 首次使用 → 完成第一次刷题

```
打开小程序
  → 底部Tab默认「题库」页，看到 Excel / Python 两张卡片
  → 点击「Excel函数题库」
  → 进入模式选择页：看到「顺序练习」「随机刷题」两个按钮
  → 点击「顺序练习」
  → 进入答题页：第1题展示，题干 + 4个选项
  → 点击选项 B → 正确，选项变绿，答案解析展开（含代码块）
  → 点击「下一题」→ 第2题
  → 点击选项 C → 错误，C变红，正确选项A变绿，解析展开
  → 该题自动加入错题本
  → …答完10题后，触发插屏广告（用户可关闭）
  → 继续刷到第30题，退出小程序
  → 再次打开，进入题库→顺序练习，提示「已完成30题，继续练习」
  → 点击继续，从第31题开始
```

### 2.2 碎片化速查流程

```
打开小程序
  → 切换到「速查」Tab
  → 看到分类卡片：Excel函数、Python基础
  → 点击「Excel函数」
  → 看到按场景分组的二级知识点列表
  → 点击「VLOOKUP函数」
  → 知识点详情页：定义、语法、参数说明、2个实战示例（含可复制代码块）
  → 点击右上角收藏按钮 → 收藏成功
  → 点击底部代码块的「复制」→ toast "已复制"
  → 返回，在顶部搜索框输入 "求和"
  → 即时展示匹配结果，关键词高亮
  → 点击结果进入对应知识点
```

### 2.3 错题复习流程

```
Tab切换到「我的」
  → 看到数据概览：累计刷题 85 | 错题 12 | 收藏 8
  → 点击「错题本」卡片
  → 默认展示全部错题，按题库分类折叠
  → 展开「Excel」，看到 8 条错题
  → 点击第1条 → 进入错题重做模式（与正常答题逻辑一致）
  → 选对 → 弹出选项：「移出错题本」/「保留巩固」
  → 选择「移出」→ 该题从错题本移除
```

---

## 三、功能行为详述

### 3.1 页面路由架构

```
tabBar（底部常驻）:
  ├── pages/banks/index          # 题库Tab首页
  ├── pages/reference/index       # 速查Tab首页
  └── pages/mine/index            # 我的Tab首页

非Tab页面:
  ├── pages/study/mode-select     # 刷题模式选择（接收 bankId）
  ├── pages/study/answer          # 答题页（接收 bankId, mode）
  ├── pages/reference/list        # 知识点列表（接收 categoryId）
  ├── pages/reference/detail      # 知识点详情（接收 knowledgeId）
  ├── pages/reference/search      # 全局搜索页
  ├── pages/mine/wrong-questions  # 错题本
  ├── pages/mine/favorites        # 收藏夹
  └── pages/mine/about            # 关于我们
```

### 3.2 题库Tab → 答题流程

#### 3.2.1 题库首页 (`pages/banks/index`)

- 顶部：产品名称「WorkQuery」+ Slogan「刷题巩固，即查即用」
- 中部：题库卡片列表（动态渲染，从题库注册表读取）
  - 每卡片：技能图标(emoji占位)、题库名称、题目总量、"100+题目"
  - 卡片下方：进度条 + "已完成 X/总数"（仅顺序模式有进度时显示）
- 底部：Banner 广告位（距底部安全区 ≥20rpx）

#### 3.2.2 模式选择页 (`pages/study/mode-select`)

- 接收参数：`bankId`
- 展示题库名称、总题数
- 两个主按钮：「顺序练习」「随机刷题」
- 顺序练习按钮下方：若有历史进度则显示「已完成 X 题，继续练习」
- 点击后直接跳转答题页，带上 mode 参数

#### 3.2.3 答题页 (`pages/study/answer`)

- 接收参数：`bankId`, `mode`（`sequential` | `random`）
- 页面结构（自上而下）：
  1. 顶部栏：返回按钮 + 当前题号/总题数 + 收藏按钮(☆/★)
  2. 题干区域：文字 + 可选代码块（高亮渲染）
  3. 选项区域：4个选项纵向排列，每个占一行
  4. 解析区域：答后展开，包含文字解析 + 可选代码块 + 关联知识点标签（可点击跳转）
  5. 底部操作栏：「上一题」「下一题」按钮 + 进度点指示器

**答题交互详细规则：**
- 用户点击选项 → 立即判定
  - 正确：该选项背景变绿(#07C160)，0.3s 过渡动画
  - 错误：该选项背景变红(#FA5151)，正确选项背景变绿
- 判定后 300ms 自动展开答案解析区（向下滑出动画）
- 判定后该道题的选项锁定，不可再次点击
- 错题自动写入本地错题本：`{questionId, errorCount: +1, addedAt, bankId}`
- 已答过的题再次进入时选项不锁定（错题重做场景除外）
- 左右滑动切换题目（`swiper` 组件，禁止 `circular` 循环）
- 顺序模式：全部答完后弹出模态框「🎉 恭喜完成！」，提供「重新刷题」「返回题库」按钮
- 随机模式：无"完成"概念，可无限随机刷题

**插屏广告触发规则：**
- 计数器 `adCounter` 在本地存储，每答 1 题 +1
- `adCounter % 10 === 0` 时触发插屏广告
- 用户可立即关闭广告（微信插屏广告自带关闭按钮）
- 顺序模式重置时 `adCounter` 不清零

#### 3.2.4 代码块渲染规则

- 题目 JSON 中 `codeBlocks` 字段为数组，每个元素：`{ language, code, caption }`
- 渲染时：语言标签（如"Excel公式"）在左上角，复制按钮在右上角
- 点击复制 → `wx.setClipboardData` → 成功 toast "已复制到剪贴板"
- 高亮方案：在数据准备脚本中对代码片段预编译为高亮 HTML，存入 JSON 的 `codeHtml` 字段；小程序端用 `rich-text` 组件直接渲染
- 支持语言：`excel`（Excel公式）、`python`、`shell`（Linux命令）

### 3.3 速查Tab → 搜索流程

#### 3.3.1 速查首页 (`pages/reference/index`)

- 顶部：搜索框（`<input>` + 搜索图标），placeholder "搜索 Excel函数、Python语法…"
- 搜索框获得焦点时：跳转到搜索页 `pages/reference/search`（不在本页做即时搜索）
- 下方：分类卡片（与题库Tab复用相同卡片样式）
- 点击分类卡片 → 跳转知识点列表页

#### 3.3.2 知识点列表 (`pages/reference/list`)

- 接收参数：`categoryId`
- 顶部栏：分类名称 + 返回按钮
- 右侧排序切换：使用频率 / 字母顺序
- 列表：按场景/功能分组（如"查找与引用函数"、"文本处理函数"）
  - 每组有标题行
  - 每个知识点：标题 + 一行摘要（最多两行截断）

#### 3.3.3 知识点详情 (`pages/reference/detail`)

- 接收参数：`knowledgeId`
- 内容结构（自上而下）：
  1. 知识点名称（大标题）
  2. 语法定义（等宽字体灰色背景框）
  3. 使用说明（富文本）
  4. 各参数说明（表格：参数名 | 类型 | 说明）
  5. 实战示例 1~2 个（每个含：标题、描述、代码块）
  6. 关联题目标签（可点击跳转至对应题目答题页）
- 右上角：收藏按钮 ☆/★
- 底部：Banner 广告位

#### 3.3.4 全局搜索 (`pages/reference/search`)

- 搜索框自动聚焦，键盘弹起
- 输入字符 ≥1 即触发搜索（防抖 300ms）
- 搜索范围：知识点的 `title`、`content`、`tags` 字段
- 结果列表：每条结果展示标题 + 摘要（匹配关键词高亮）
- 结果为空时：展示"未找到相关内容"空状态
- 结果排序：按匹配度降序（标题完全匹配 > 标题部分匹配 > 标签匹配 > 正文匹配）
- 点击结果 → 跳转对应知识点详情页

### 3.4 我的Tab

#### 3.4.1 我的首页 (`pages/mine/index`)

- 顶部数据概览区（三列横排）：
  - 累计刷题数 | 错题数 | 收藏数
- 功能入口区：
  - 「错题本」卡片：红色图标 + 错题数量
  - 「我的收藏」卡片：黄色图标 + 收藏总数
- 设置区：
  - 深色模式：三选一 radio（跟随系统 / 浅色 / 深色），切换即时生效
  - 广告设置：是否展示广告的开关（默认开）—— 注意：关闭后 Banner/插屏 均不展示
- 底部操作区：
  - 「清空所有本地数据」按钮（红色文字），二次确认弹窗
  - 「关于我们」→ 跳转 about 页面
- 最底部：Banner 广告位

#### 3.4.2 错题本 (`pages/mine/wrong-questions`)

- 顶部：分类筛选 tabs（全部 | Excel | Python）
- 列表：每行显示 题干预览（截断2行）、错误次数标签、题库标签
- 左滑单元格：显示红色「删除」按钮（确认后从错题本移除）
- 点击 → 进入错题重做模式（复用 `pages/study/answer`，传入 `mode=wrongReview&questionId=xxx`）
  - 答对后底部弹出操作条：「移出错题本」「保留巩固」
- 顶部右侧：「清空」按钮 → 二次确认后清空当前分类/全部错题

#### 3.4.3 收藏夹 (`pages/mine/favorites`)

- 顶部：分类筛选 tabs（全部 | 题目 | 知识点）
- 题目类型收藏：展示题干预览，点击跳转答题页对应题目
- 知识点类型收藏：展示标题+摘要，点击跳转知识点详情
- 左滑取消收藏（即时生效，带动画移除）
- 支持批量管理：右上角「管理」按钮 → 列表进入多选模式 → 底部「取消收藏(已选N项)」

#### 3.4.4 清空数据

- 点击后弹窗：「清空后所有刷题进度、错题、收藏将被永久清除，不可恢复。确认清空？」
- 确认后执行：`wx.clearStorageSync()` → 重新初始化默认设置项 → toast "已清空"
- 不清除广告设置和深色模式设置（回到默认值）

### 3.5 深色模式

- 设置存储键：`settings.darkMode`，可选值 `'auto'` | `'light'` | `'dark'`
- `'auto'`：通过 `wx.getSystemInfoSync().theme` 检测系统主题，跟随变化（监听 `onThemeChange`）
- `'light'` / `'dark'`：强制使用对应主题，忽略系统设置
- 主题切换时：通过 CSS 变量（`--bg-color`, `--text-color` 等）+ `app.globalData.theme` 全局驱动
- 所有页面在 `onShow` 时检查当前主题并应用对应样式类

---

## 四、边界情况与异常处理

### 4.1 数据边界

| 场景 | 处理方式 |
|------|----------|
| 云函数调用失败（获取题库/题目） | 展示本地缓存数据（如有）；无缓存时展示"加载失败"+重试按钮 |
| 某题库题目数为 0 | 卡片置灰，点击后 toast "题目正在准备中" |
| 错题本为空 | 展示"暂无错题 🎉"空状态插画 |
| 收藏夹为空 | 展示"还没有收藏哦"空状态，引导去刷题/速查 |
| 搜索无结果 | "未找到「xxx」相关内容"，建议换关键词 |
| 顺序模式已完成全部题目 | 弹出"恭喜完成"模态框，提供"重新刷题"和"返回题库" |
| 云数据库返回空集合 | 展示对应空状态，不报错 |

### 4.2 存储与网络边界

| 场景 | 处理方式 |
|------|----------|
| 网络断开 | 刷题/错题/收藏降级到本地缓存操作，网络恢复后自动同步到云数据库 |
| 云函数超时（>3秒） | 展示骨架屏/loading 状态，超时后显示"网络开小差"重试提示 |
| 云数据库写入失败 | 先写入本地缓存，标记 `_dirty: true`，下次 onShow 时重试同步 |
| 本地存储读取异常 | 所有 `getStorageSync` 包裹 try-catch，失败时使用默认值 |
| 首次启动无任何缓存 | 所有页面默认展示初始状态，云端数据加载完成后刷新 |

### 4.3 交互边界

| 场景 | 处理方式 |
|------|----------|
| 答题页快速连续点击选项 | 选项判题后即锁定，不可二次点击同一题的选项 |
| 答题页刷到最后一题点"下一题" | 顺序模式弹出完成提示；随机模式循环到随机题目 |
| 答题页在第一题点"上一题" | 按钮置灰不可点击 |
| 小程序切后台再回来 | 保留当前页面状态；答题页进度不丢失 |
| 深色模式即时切换 | 页面即时重绘，不闪烁 |

### 4.4 兼容性边界

| 场景 | 处理方式 |
|------|----------|
| 微信低版本不支持某 API | 所有关键 API 做能力检测（`wx.canIUse`），不支持时降级 |
| 旧版 iOS Safari 渲染 | 使用 uni-ui 组件样式 + `rpx` 自适应 |
| Safe Area（刘海屏） | 底部安全区用 `env(safe-area-inset-bottom)` 处理 |

---

## 五、数据模型

### 5.1 云数据库集合设计

| 集合名 | 说明 | 读写频率 | 关键索引 |
|--------|------|---------|---------|
| `banks` | 题库元信息 | 读多写少 | `bankId` |
| `questions` | 题目 | 读多写少 | `bankId`, `knowledgeIds` |
| `knowledge_items` | 知识点 | 读多写少 | `categoryId`, `tags` |
| `user_wrong_questions` | 用户错题本 | 读写均衡 | `_openid`, `questionId` |
| `user_favorites` | 用户收藏 | 读写均衡 | `_openid`, `itemId`, `itemType` |
| `user_progress` | 用户刷题进度 | 写多读少 | `_openid`, `bankId` |

> 每个用户相关的集合（wrong_questions, favorites, progress）文档均带 `_openid` 字段，云函数查询时按当前用户的 openid 过滤，实现数据隔离。

### 5.2 banks 集合文档结构

```jsonc
// 集合: banks  |  每个题库一条文档
{
  "_id": "auto_generated",
  "bankId": "excel",
  "bankName": "Excel函数题库",
  "bankIcon": "📊",
  "bankDescription": "覆盖VLOOKUP、IF、SUMIF等常用函数与数据处理技巧",
  "totalQuestions": 150,
  "order": 1,                       // 排序权重
  "isActive": true                  // 是否上线
}
```

### 5.3 questions 集合文档结构

```jsonc
// 集合: questions  |  每道题一条独立文档
{
  "_id": "auto_generated",
  "questionId": "excel_001",        // 逻辑ID，用于关联
  "bankId": "excel",
  "question": "在Excel中，以下哪个函数用于垂直查找？",
  "options": ["A. HLOOKUP", "B. VLOOKUP", "C. INDEX", "D. MATCH"],
  "correctIndex": 1,
  "explanation": "VLOOKUP（Vertical Lookup）用于在表格首列中垂直查找指定值，并返回该行中指定列的值。",
  "codeBlocks": [
    {
      "language": "excel",
      "caption": "VLOOKUP 基本语法",
      "code": "=VLOOKUP(查找值, 表格区域, 列序号, [匹配类型])",
      "codeHtml": "<pre class=\"excel-hl\"><span class=\"kw\">=VLOOKUP</span>(查找值, 表格区域, 列序号, [匹配类型])</pre>"
    }
  ],
  "knowledgeIds": ["excel_know_005"],
  "difficulty": 1,
  "orderIndex": 1                   // 顺序练习的排序依据
}
```

### 5.4 knowledge_items 集合文档结构

```jsonc
// 集合: knowledge_items  |  每个知识点一条独立文档
{
  "_id": "auto_generated",
  "knowledgeId": "excel_know_005",
  "categoryId": "excel",
  "categoryName": "Excel函数",
  "title": "VLOOKUP 函数",
  "group": "查找与引用",
  "definition": "VLOOKUP 是 Excel 中最常用的查找函数，用于在表格的首列中垂直查找指定值。",
  "syntax": "VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])",
  "parameters": [
    {"name": "lookup_value", "type": "any", "desc": "要查找的值"},
    {"name": "table_array", "type": "range", "desc": "包含查找数据的表格区域"},
    {"name": "col_index_num", "type": "number", "desc": "返回值所在的列号"},
    {"name": "range_lookup", "type": "boolean", "desc": "TRUE=近似匹配，FALSE=精确匹配。默认TRUE"}
  ],
  "examples": [
    {
      "title": "根据员工ID查找姓名",
      "description": "在A2:B10区域中，根据E2单元格的员工ID查找对应姓名",
      "code": "=VLOOKUP(E2, A2:B10, 2, FALSE)",
      "codeHtml": "<pre class=\"excel-hl\"><span class=\"kw\">=VLOOKUP</span>(E2, A2:B10, 2, FALSE)</pre>"
    }
  ],
  "tags": ["查找", "函数", "常用", "数据匹配"],
  "relatedQuestionIds": ["excel_001"],
  "usageFrequency": 95
}
```

### 5.5 用户数据集合文档结构

```jsonc
// 集合: user_wrong_questions  |  每条记录按 _openid 隔离
{
  "_openid": "oxxx...",             // 自动写入，用户不可见
  "questionId": "excel_001",
  "bankId": "excel",
  "errorCount": 3,
  "questionPreview": "在Excel中，以下哪个函数用于垂直查找？",
  "addedAt": 1719494400000,
  "updatedAt": 1719494500000
}

// 集合: user_favorites  |  每条记录按 _openid 隔离
{
  "_openid": "oxxx...",
  "itemId": "excel_001",            // questionId 或 knowledgeId
  "itemType": "question",           // "question" | "knowledge"
  "preview": "在Excel中，以下哪个函数用于垂直查找？", // 列表展示用
  "addedAt": 1719494400000
}

// 集合: user_progress  |  每个题库一条记录
{
  "_openid": "oxxx...",
  "bankId": "excel",
  "mode": "sequential",
  "currentIndex": 30,
  "completedCount": 30,
  "updatedAt": 1719494400000
}
```

### 5.6 本地存储（wx.Storage）

```jsonc
// 仅存储用户设置和临时状态；核心数据以云数据库为准
{
  // 用户设置 —— 键: "settings"
  "settings": {
    "darkMode": "auto",              // "auto" | "light" | "dark"
    "adEnabled": true
  },

  // 广告计数器 —— 键: "adCounter"
  "adCounter": 0,

  // 本地缓存（网络断开时降级使用）—— 键: "offlineCache"
  "offlineCache": {
    "lastSyncAt": 1719494500000,     // 最后同步时间
    "wrongQuestions": { /* 结构与云数据库一致 */ },
    "favorites": { /* 结构一致 */ }
  }
}
```
```

---

## 六、验收标准

### 6.1 题库与答题

- [ ] AC-01: 题库首页正确展示全部已注册题库卡片（卡片含图标、名称、题量、简介）
- [ ] AC-02: 点击卡片进入模式选择页，展示「顺序练习」「随机刷题」两个按钮
- [ ] AC-03: 有历史进度时，顺序练习按钮下方正确显示「已完成X题，继续练习」
- [ ] AC-04: 进入答题页后，题干、4选项正确渲染
- [ ] AC-05: 点击正确选项 → 该选项变绿，解析区展开
- [ ] AC-06: 点击错误选项 → 该选项变红，正确选项变绿，解析区展开
- [ ] AC-07: 判定后选项锁定，不可再次点击
- [ ] AC-08: 错题自动同步至云数据库错题本，网络断开时先存本地缓存后重试
- [ ] AC-09: 「上一题」「下一题」按钮正常工作，边界正确处理
- [ ] AC-10: 左右滑动可切换题目
- [ ] AC-11: 收藏按钮可切换状态，收藏/取消收藏即时生效
- [ ] AC-12: 代码块正确渲染语法高亮，复制按钮可一键复制
- [ ] AC-13: 顺序模式全部答完弹出完成提示
- [ ] AC-14: 随机模式可无限刷题
- [ ] AC-15: 每10题触发一次插屏广告（用户可关闭）
- [ ] AC-16: 解析区关联知识点标签可点击跳转至知识点详情

### 6.2 速查手册

- [ ] AC-17: 速查首页正确展示全部分类卡片
- [ ] AC-18: 点击分类进入知识点列表，正确按场景分组展示
- [ ] AC-19: 知识点列表支持按使用频率/字母顺序排序
- [ ] AC-20: 知识点详情页完整展示：定义、语法、参数表、示例、代码块
- [ ] AC-21: 知识点详情页代码块可高亮渲染和复制
- [ ] AC-22: 全局搜索支持 ≥1 字符模糊匹配，结果高亮关键词
- [ ] AC-23: 搜索结果按匹配度排序，空结果展示提示
- [ ] AC-24: 知识点详情页收藏按钮正常工作

### 6.3 我的页面

- [ ] AC-25: "我的"首页正确展示累计刷题数、错题数、收藏数
- [ ] AC-26: 错题本按题库分类展示，可点击进入重做模式
- [ ] AC-27: 错题重做答对后可选择移出或保留
- [ ] AC-28: 错题本支持左滑删除和清空
- [ ] AC-29: 收藏夹按题目/知识点分类筛选
- [ ] AC-30: 收藏夹支持左滑取消收藏和批量管理
- [ ] AC-31: 深色模式三态切换即时生效（跟随系统/浅色/深色）
- [ ] AC-32: 广告开关生效（关闭后所有广告位不展示）
- [ ] AC-33: 清空所有数据二次确认后生效，不可恢复

### 6.4 非功能性验收

- [ ] AC-34: 小程序主包体积 ≤2MB
- [ ] AC-35: 首屏加载时间 ≤2秒（4G网络）
- [ ] AC-36: 题目切换响应 ≤300ms
- [ ] AC-37: 搜索响应 ≤800ms（云函数 + 云数据库全文检索）
- [ ] AC-38: 深色模式三态下文字始终可读
- [ ] AC-39: 免登录，无任何授权弹窗
- [ ] AC-40: iOS/Android 主流机型切题流畅无卡顿

---

## 七、全局状态流

```
App启动
  → app.onLaunch:
    1. 初始化云开发环境 (wx.cloud.init)
    2. 读取 settings (darkMode, adEnabled) → 写入 globalData
    3. 调用 getBanks 云函数 → 写入 globalData.banks
    4. 网络可用时：从云数据库拉取用户错题/收藏/进度 → 更新本地缓存
    5. 网络不可用时：尝试读取本地离线缓存
  → app.globalData: { theme, adEnabled, banks }

题库Tab onShow:
  → 从 globalData.banks 或调用 getBanks 云函数获取题库列表 → 渲染卡片
  → 如果云函数失败：展示最后一次成功获取的缓存数据 + 顶部"刷新"提示

答题页 onLoad:
  → 调用 getQuestions 云函数 (bankId + 分页) → 获取题目列表
  → 读取 user_progress → 恢复上次进度

用户切换深色模式:
  → 我的页面: 点击 → 更新 settings → wx.setStorageSync('settings', ...) → 更新 app.globalData.theme
  → 所有页面 onShow 响应 theme 变化 → 即时重绘

错题/收藏同步策略:
  → 在线: 操作直接写云数据库 → 成功后更新本地缓存
  → 离线: 操作写本地缓存，标记 dirty → 下次 onShow 或网络恢复时批量提交至云数据库
  → 冲突: 云数据库时间戳为准，本地缓存为降级副本

广告展示:
  → 页面 onShow: 读取 settings.adEnabled
  → 为 true: 创建广告组件实例 → 展示
  → 为 false: 跳过广告渲染
```
