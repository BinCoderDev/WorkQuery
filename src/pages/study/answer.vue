<template>
  <view class="container">
    <!-- 顶部进度栏 -->
    <view class="top-bar">
      <text class="q-progress">第 {{ currentIndex + 1 }}/{{ totalCount }} 题</text>
      <view class="fav-icon" @click="toggleFav">
        <text>{{ isFav ? '★' : '☆' }}</text>
      </view>
    </view>

    <!-- 题目滑动区 -->
    <swiper
      class="q-swiper"
      :current="currentIndex"
      :duration="250"
      @change="onSwipe"
    >
      <swiper-item v-for="(q, i) in questions" :key="q.questionId || i">
        <view class="q-scroll">
          <!-- 题干 -->
          <view class="q-body">
            <text class="q-text">{{ q.question }}</text>
          </view>

          <!-- 代码块（题干中） -->
          <view v-for="cb in q.codeBlocks" :key="cb.caption" class="code-block">
            <view class="code-header">
              <text class="code-lang">{{ cb.language }}</text>
              <text class="code-copy" @click.stop="copyCode(cb.code)">复制</text>
            </view>
            <rich-text :nodes="cb.codeHtml || cb.code" class="code-content"></rich-text>
          </view>

          <!-- 选项 -->
          <view class="options">
            <view
              v-for="(opt, j) in q.options"
              :key="j"
              class="opt-item"
              :class="getOptClass(i, j)"
              @click="selectOpt(i, j)"
            >
              <text class="opt-letter">{{ letters[j] }}</text>
              <text class="opt-text">{{ opt }}</text>
            </view>
          </view>

          <!-- 解析（答后展开） -->
          <view v-if="isAnswered(i)" class="explanation">
            <view class="exp-header">
              <text class="exp-tag">{{ isCorrect(i) ? '✓ 回答正确' : '✗ 回答错误' }}</text>
            </view>
            <text class="exp-text">{{ q.explanation }}</text>
            <!-- 解析中的代码块 -->
            <view v-for="cb in q.explanationCodeBlocks" :key="cb.caption" class="code-block exp-code">
              <view class="code-header">
                <text class="code-lang">{{ cb.language }}</text>
                <text class="code-copy" @click.stop="copyCode(cb.code)">复制</text>
              </view>
              <rich-text :nodes="cb.codeHtml || cb.code" class="code-content"></rich-text>
            </view>
            <!-- 关联知识点标签 -->
            <view v-if="q.knowledgeIds && q.knowledgeIds.length > 0" class="knowledge-tags">
              <text
                v-for="kid in q.knowledgeIds"
                :key="kid"
                class="ktag"
                @click="goKnowledge(kid)"
              >📘 相关知识点</text>
            </view>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <button class="bn-btn prev" :disabled="currentIndex === 0" @click="goPrev">上一题</button>
      <text class="bn-indicator">{{ currentIndex + 1 }} / {{ totalCount }}</text>
      <button class="bn-btn next" @click="goNext">
        {{ isLast ? '完成' : '下一题' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { useSettingsStore } from '@/stores/settings'

const userStore = useUserStore()
const settingsStore = useSettingsStore()

const letters = ['A', 'B', 'C', 'D', 'E', 'F']
const bankId = ref('')
const mode = ref('sequential')
const currentIndex = ref(0)
const totalCount = ref(0)
const questions = ref([])
const answeredMap = ref({})     // { [index]: selectedOptionIndex }
const favMap = ref({})          // { [questionId]: boolean }
const adCounter = ref(0)
let interstitialAd = null

const isLast = computed(() => currentIndex.value >= totalCount.value - 1)
const isFav = computed(() => {
  const q = questions.value[currentIndex.value]
  return q ? !!favMap.value[q.questionId] : false
})

const targetIds = ref([])        // 指定显示的题目ID列表（来自知识点关联）

onLoad((options) => {
  bankId.value = options.bankId || ''
  mode.value = options.mode || 'sequential'
  if (options.questionIds) targetIds.value = options.questionIds.split(',')
  else if (options.questionId) targetIds.value = [options.questionId]
  loadAdCounter()
  loadQuestions()
  userStore.fetchUserData()
})

async function loadQuestions() {
  let loaded = false

  // 尝试云函数（5秒超时）
  try {
    if (typeof wx !== 'undefined' && wx.cloud) {
      const res = await callCloudWithTimeout('getQuestions', { bankId: bankId.value, pageIndex: 0, pageSize: 100 }, 5000)
      if (res.result?.code === 0 && res.result.data?.questions?.length > 0) {
        questions.value = res.result.data.questions
        loaded = true
      }
    }
  } catch (e) {
    console.warn('云函数 getQuestions 不可用，使用模拟数据:', e.message)
  }

  // 降级：模拟数据
  if (!loaded) {
    questions.value = generateMockQuestions()
  }

  if (mode.value === 'random') shuffle(questions.value)
  totalCount.value = questions.value.length

  // 恢复进度
  const progress = userStore.getProgress(bankId.value)
  if (mode.value === 'sequential' && progress.currentIndex > 0) {
    currentIndex.value = Math.min(progress.currentIndex, Math.max(0, totalCount.value - 1))
  }

  // 恢复收藏状态
  for (const f of userStore.favorites) {
    if (f.itemType === 'question') favMap.value[f.itemId] = true
  }

  // 从知识点/错题来的：只显示指定题目
  if (targetIds.value.length > 0) {
    questions.value = questions.value.filter(q => targetIds.value.includes(q.questionId))
    currentIndex.value = 0
    totalCount.value = questions.value.length
  }
}

// 带超时的云函数调用
function callCloudWithTimeout(name, data, timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('云函数超时')), timeout)
    wx.cloud.callFunction({ name, data }).then(res => {
      clearTimeout(timer)
      resolve(res)
    }).catch(err => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

// --- 判题 ---
function getOptClass(qIndex, optIndex) {
  const answered = answeredMap.value[qIndex]
  if (answered === undefined) return ''
  const correct = questions.value[qIndex]?.correctIndex
  if (optIndex === correct) return 'correct'
  if (optIndex === answered && answered !== correct) return 'wrong'
  return 'locked'
}

function isAnswered(qIndex) { return answeredMap.value[qIndex] !== undefined }
function isCorrect(qIndex) { return answeredMap.value[qIndex] === questions.value[qIndex]?.correctIndex }

function selectOpt(qIndex, optIndex) {
  if (answeredMap.value[qIndex] !== undefined) return // 已锁定
  answeredMap.value[qIndex] = optIndex

  // 错题自动收录
  if (optIndex !== questions.value[qIndex].correctIndex) {
    const q = questions.value[qIndex]
    userStore.addWrongQuestion(q.questionId, bankId.value, q.question.substring(0, 80))
  }

  // 更新广告计数器
  adCounter.value++
  if (adCounter.value % 10 === 0) {
    showInterstitialAd()
  }
  uni.setStorageSync('adCounter', adCounter.value)
}

// --- 导航 ---
function goPrev() { if (currentIndex.value > 0) currentIndex.value-- }
function goNext() {
  if (isLast.value) {
    if (mode.value === 'sequential') {
      uni.showModal({
        title: '🎉 恭喜完成！',
        content: '你已完成了本题库全部练习。',
        confirmText: '重新刷题',
        cancelText: '返回题库',
        success: (res) => {
          if (res.confirm) { currentIndex.value = 0; answeredMap.value = {} }
          else { uni.switchTab({ url: '/pages/banks/index' }) }
        }
      })
    } else {
      // 随机模式循环
      currentIndex.value = 0
    }
  } else {
    currentIndex.value++
  }
  saveProgress()
}

function onSwipe(e) {
  currentIndex.value = e.detail.current
  saveProgress()
}

// --- 进度保存 ---
function saveProgress() {
  userStore.saveProgress(bankId.value, {
    mode: mode.value,
    currentIndex: currentIndex.value,
    completedCount: Object.keys(answeredMap.value).length
  })
}

// --- 收藏 ---
function toggleFav() {
  const q = questions.value[currentIndex.value]
  if (!q) return
  favMap.value[q.questionId] = !favMap.value[q.questionId]
  userStore.toggleFavorite(q.questionId, 'question', q.question.substring(0, 40))
  uni.showToast({ title: favMap.value[q.questionId] ? '已收藏' : '已取消', icon: 'none' })
}

// --- 复制 ---
function copyCode(code) {
  uni.setClipboardData({ data: code, success: () => uni.showToast({ title: '已复制', icon: 'success' }) })
}

// --- 跳转知识点 ---
function goKnowledge(knowledgeId) {
  uni.navigateTo({ url: `/pages/reference/detail?knowledgeId=${knowledgeId}` })
}

// --- 广告 ---
function showInterstitialAd() {
  if (!settingsStore.adEnabled) return
  try {
    if (typeof wx !== 'undefined' && wx.createInterstitialAd) {
      if (!interstitialAd) {
        interstitialAd = wx.createInterstitialAd({ adUnitId: '请填写你的插屏广告单元ID' })
      }
      interstitialAd.show().catch(() => {})
    }
  } catch (e) { /* 静默降级 */ }
}

function loadAdCounter() {
  try { adCounter.value = uni.getStorageSync('adCounter') || 0 } catch (e) { adCounter.value = 0 }
}

// --- 工具函数 ---
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

function generateMockQuestions() {
  const questions = [
    { question: '在Excel中，以下哪个函数用于在表格首列中垂直查找数据？', options: ['HLOOKUP', 'VLOOKUP', 'LOOKUP', 'XLOOKUP'], correctIndex: 1, explanation: 'VLOOKUP（Vertical Lookup）用于在表格首列中垂直查找指定值，返回该行中指定列的值。' },
    { question: 'VLOOKUP第四个参数设为FALSE表示什么？', options: ['近似匹配', '模糊查找', '精确匹配', '不区分大小写'], correctIndex: 2, explanation: 'VLOOKUP第四个参数为FALSE（或0）表示精确匹配。TRUE表示近似匹配。' },
    { question: 'SUMIF函数的作用是什么？', options: ['无条件求和', '对满足条件的单元格求和', '查找数据', '计数'], correctIndex: 1, explanation: 'SUMIF根据指定条件对满足条件的单元格求和。' },
    { question: 'IF函数的正确语法是什么？', options: ['IF(条件,假值,真值)', 'IF(值,条件,返回值)', 'IF(条件,真值,假值)', 'IF(返回值,条件,真值)'], correctIndex: 2, explanation: 'IF(条件, 条件为真时的值, 条件为假时的值)。' },
    { question: '以下哪个函数用于统计包含数字的单元格个数？', options: ['COUNTA', 'COUNT', 'COUNTIF', 'COUNTBLANK'], correctIndex: 1, explanation: 'COUNT统计数字个数。COUNTA统计非空，COUNTIF按条件，COUNTBLANK统计空单元格。' },
    { question: '在Excel中，符号$A$1表示什么类型的引用？', options: ['相对引用', '混合引用', '绝对引用', '循环引用'], correctIndex: 2, explanation: '$A$1是绝对引用，复制公式时行列都不会变。' },
    { question: 'COUNTIF函数的作用是什么？', options: ['统计所有单元格', '按条件统计个数', '统计空单元格', '按条件求和'], correctIndex: 1, explanation: 'COUNTIF统计满足条件的单元格个数。' },
    { question: 'CONCATENATE函数的功能是什么？', options: ['格式化文本', '合并字符串', '截取文本', '去除空格'], correctIndex: 1, explanation: 'CONCATENATE（或&）用于合并多个文本字符串。' },
    { question: 'AVERAGE函数计算的是什么？', options: ['最大值', '最小值', '总和', '算术平均值'], correctIndex: 3, explanation: 'AVERAGE计算算术平均值。' },
    { question: '若A1=5,B1=3,=IF(A1>B1,"大于","不大于")的结果？', options: ['5', '3', '大于', '不大于'], correctIndex: 2, explanation: '5>3条件为真，返回"大于"。' },
    { question: 'SUMIFS和SUMIF的主要区别？', options: ['可多个条件', '只能求和', '速度更快', '没区别'], correctIndex: 0, explanation: 'SUMIFS支持多个条件求和，SUMIF只支持单一条件。' },
    { question: '哪个可以在A1中显示今天的日期？', options: ['=NOW()', '=TODAY()', '=DATE()', '=DAY()'], correctIndex: 1, explanation: 'TODAY()返回当前日期。NOW()带时间。' },
    { question: 'LEFT函数的作用？', options: ['从右侧截取', '删除空格', '从左侧截取字符', '转大写'], correctIndex: 2, explanation: 'LEFT从文本左侧截取指定数量字符。' },
    { question: '数据透视表的主要功能？', options: ['美化表格', '汇总分析数据', '创建图表', '保护工作表'], correctIndex: 1, explanation: '数据透视表快速分类汇总和交叉分析大量数据。' },
    { question: '如何将A列和B列合并到C列（空格分隔）？', options: ['C1=A1+B1', 'C1=A1&" "&B1', 'C1=MERGE(A1,B1)', 'C1=COMBINE(A1,B1)'], correctIndex: 1, explanation: '用&连接文本，空格用引号包裹。' },
    { question: '固定引用B列（列不变行可变）的写法？', options: ['B1', '$B$1', '$B1', 'B$1'], correctIndex: 2, explanation: '$B1列绝对引用（固定），行相对引用（可变）。' },
    { question: 'ROUND函数的作用？', options: ['向上取整', '向下取整', '四舍五入', '去小数'], correctIndex: 2, explanation: 'ROUND四舍五入到指定小数位。' },
    { question: '条件格式的功能是什么？', options: ['加粗文本', '根据条件设样式', '限制输入', '保护单元格'], correctIndex: 1, explanation: '条件格式根据值自动应用颜色等格式。' },
    { question: 'VLOOKUP查找值必须在查找区域的哪列？', options: ['任意列', '最后一列', '第一列', '中间列'], correctIndex: 2, explanation: '查找值必须在表格区域第一列。' },
    { question: '哪个快捷键在Excel中插入当前日期？', options: ['Ctrl+C', 'Ctrl+;', 'Ctrl+D', 'Ctrl+T'], correctIndex: 1, explanation: 'Ctrl+;插入静态当前日期。' },
    { question: 'INDEX+MATCH相比VLOOKUP的优势？', options: ['更快', '可从右向左查', '更简单', '无需排序'], correctIndex: 1, explanation: 'INDEX+MATCH可从右向左查找。' },
    { question: 'TRIM函数的作用？', options: ['识别文本', '去除多余空格', '转大写', '格式化'], correctIndex: 1, explanation: 'TRIM去除首尾和中间多余空格。' },
    { question: '=SUM(A1:A10, C1:C10)计算什么？', options: ['A1到C10总和', 'A1:A10总和', 'A1:A10+C1:C10总和', '差集'], correctIndex: 2, explanation: 'SUM可接受多个区域参数，逗号分隔。' },
    { question: 'LEN函数的作用？', options: ['截取文本', '返回字符数', '查找位置', '替换文本'], correctIndex: 1, explanation: 'LEN返回字符串字符个数。' },
    { question: '关于数据验证哪个正确？', options: ['防公式错', '限制输入类型范围', '等于密码保护', '只限数字'], correctIndex: 1, explanation: '数据验证可限制整数、小数、日期、列表等。' },
    { question: '哪个公式计算A1:A10大于60的平均值？', options: ['=AVERAGEIF(A1:A10,">60")', '=AVERAGE(A1:A10,">60")', '=SUMIF/COUNT', '=MEANIF'], correctIndex: 0, explanation: 'AVERAGEIF按条件计算平均值。' },
    { question: '合并单元格后数据会怎样？', options: ['全部保留', '保留拼接', '只留左上角', '全部清空'], correctIndex: 2, explanation: '只保留左上角单元格数据，其他删除。' },
    { question: 'MAX和LARGE的区别？', options: ['没区别', 'LARGE可返回第N大', 'MAX限数字', 'LARGE返回最大'], correctIndex: 1, explanation: 'LARGE(array,k)返回第k大值。' },
    { question: '混和引用的正确示例？', options: ['=A1+B1', '=$A$1+$B$1', '=$A1+B$1', '=##A1+##B1'], correctIndex: 2, explanation: '$A1列固定行可变，B$1行固定列可变。' },
    { question: '哪个快捷键选中整张工作表？', options: ['Ctrl+A', 'Ctrl+S', 'Ctrl+Z', 'Ctrl+X'], correctIndex: 0, explanation: 'Ctrl+A选中全部。按两次选中整张表。' }
  ]
  return questions.map((q, i) => ({
    questionId: `mock_q${i}`,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    knowledgeIds: []
  }))
}
</script>

<style lang="scss" scoped>
.container { display: flex; flex-direction: column; height: 100vh; background: var(--bg-primary); page { height: 100%; } }

/* 顶部栏 */
.top-bar { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 32rpx; background: var(--bg-card); border-bottom: 1rpx solid var(--border-color); flex-shrink: 0; }
.q-progress { font-size: 28rpx; color: var(--text-secondary); }
.fav-icon { font-size: 44rpx; color: var(--color-warning); padding: 8rpx; }

/* 滑动区域 */
.q-swiper { flex: 1; height: 0; min-height: 0; }
.q-scroll { box-sizing: border-box; padding: 32rpx; padding-bottom: 60rpx; }

/* 题干 */
.q-body { margin-bottom: 24rpx; }
.q-text { font-size: 32rpx; color: var(--text-primary); line-height: 1.8; }

/* 代码块 */
.code-block { margin: 16rpx 0; background: #1e1e1e; border-radius: 12rpx; overflow: hidden; }
.code-header { display: flex; justify-content: space-between; padding: 12rpx 20rpx; background: #333; }
.code-lang { font-size: 22rpx; color: #aaa; text-transform: uppercase; }
.code-copy { font-size: 22rpx; color: #6cf; }
.code-content { padding: 12rpx 20rpx 16rpx; font-size: 24rpx; color: #d4d4d4; }

/* 选项 */
.options { display: flex; flex-direction: column; gap: 16rpx; margin: 24rpx 0; }
.opt-item {
  display: flex; align-items: center;
  padding: 22rpx 28rpx;
  border: 2rpx solid var(--border-color);
  border-radius: 14rpx;
  background: var(--bg-card);
  transition: all 0.25s ease;
}
.opt-letter { font-size: 28rpx; font-weight: 700; color: var(--text-hint); margin-right: 16rpx; min-width: 40rpx; }
.opt-text { font-size: 30rpx; color: var(--text-primary); flex: 1; }

.opt-item.correct { background: #e6f9f0; border-color: var(--color-success); }
.opt-item.correct .opt-text, .opt-item.correct .opt-letter { color: #0a8a3a; }
.opt-item.wrong { background: #fff0f0; border-color: var(--color-danger); }
.opt-item.wrong .opt-text, .opt-item.wrong .opt-letter { color: #d32f2f; }
.opt-item.locked { opacity: 0.45; pointer-events: none; }

/* 解析 */
.explanation {
  margin-top: 28rpx;
  padding: 28rpx;
  background: var(--bg-card);
  border-radius: 14rpx;
  border-left: 6rpx solid var(--color-primary);
  animation: slideIn 0.3s ease;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-16rpx); }
  to { opacity: 1; transform: translateY(0); }
}
.exp-header { margin-bottom: 12rpx; }
.exp-tag { font-size: 26rpx; font-weight: 600; }
.explanation .correct .exp-tag { color: var(--color-success); }
.exp-text { font-size: 28rpx; color: var(--text-secondary); line-height: 1.7; }
.exp-code { margin-top: 16rpx; }

.knowledge-tags { margin-top: 20rpx; display: flex; gap: 16rpx; flex-wrap: wrap; }
.ktag { font-size: 24rpx; color: var(--color-primary); background: #e8f4fd; padding: 8rpx 20rpx; border-radius: 20rpx; }

/* 底部操作栏 */
.bottom-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20rpx 28rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: var(--bg-card);
  border-top: 1rpx solid var(--border-color);
}
.bn-btn {
  min-width: 180rpx; height: 76rpx; line-height: 76rpx;
  font-size: 28rpx; border-radius: 38rpx; border: none;
  background: var(--color-primary); color: #fff; text-align: center;
}
.bn-btn.prev { background: var(--bg-card); color: var(--text-secondary); border: 2rpx solid var(--border-color); }
.bn-btn[disabled] { opacity: 0.35; }
.bn-indicator { font-size: 26rpx; color: var(--text-hint); }
</style>
