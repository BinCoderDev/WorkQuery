<template>
  <view class="container">
    <view v-if="loading" class="loading">加载中…</view>
    <view v-else-if="!item" class="error">知识点不存在</view>
    <template v-else>
      <view class="detail-header">
        <text class="title">{{ item.title }}</text>
        <text class="fav-icon" @click="toggleFav">{{ isFav ? '★' : '☆' }}</text>
      </view>

      <view class="syntax-box" v-if="item.syntax">
        <text class="s-label">语法</text>
        <text class="s-code">{{ item.syntax }}</text>
      </view>

      <view class="section" v-if="item.definition">
        <text class="sec-title">说明</text>
        <text class="sec-text">{{ item.definition }}</text>
      </view>

      <view class="section" v-if="item.parameters && item.parameters.length > 0">
        <text class="sec-title">参数</text>
        <view class="param-table">
          <view v-for="p in item.parameters" :key="p.name" class="param-row">
            <text class="p-name">{{ p.name }}</text>
            <text class="p-type">{{ p.type }}</text>
            <text class="p-desc">{{ p.desc }}</text>
          </view>
        </view>
      </view>

      <view class="section" v-if="item.examples && item.examples.length > 0">
        <text class="sec-title">示例</text>
        <view v-for="(ex, idx) in item.examples" :key="idx" class="example">
          <text class="ex-title">{{ ex.title }}</text>
          <text class="ex-desc">{{ ex.description }}</text>
          <view class="code-block">
            <view class="cb-header">
              <text class="cb-lang">代码</text>
              <text class="cb-copy" @click="copyCode(ex.code)">复制</text>
            </view>
            <rich-text :nodes="ex.codeHtml || ex.code" class="cb-content"></rich-text>
          </view>
        </view>
      </view>

      <!-- 关联题目入口 -->
      <view v-if="item.relatedQuestionIds && item.relatedQuestionIds.length > 0" class="related">
        <text class="sec-title">关联题目</text>
        <view class="tag" @click="goQuestion(item.relatedQuestionIds[0])">
          去刷题 ({{ item.relatedQuestionIds.length }}道)
        </view>
      </view>

      <!-- 广告 -->
      <view class="ad-placeholder" v-if="settingsStore.adEnabled">广告位</view>
    </template>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { useSettingsStore } from '@/stores/settings'

const userStore = useUserStore()
const settingsStore = useSettingsStore()

const knowledgeId = ref('')
const item = ref(null)
const loading = ref(true)

const isFav = computed(() => item.value ? userStore.isFavorited(item.value.knowledgeId, 'knowledge') : false)

onLoad((options) => { knowledgeId.value = options.knowledgeId || ''; fetch() })

async function fetch() {
  loading.value = true
  try {
    if (typeof wx !== 'undefined' && wx.cloud) {
      const res = await wx.cloud.callFunction({ name: 'getKnowledgeDetail', data: { knowledgeId: knowledgeId.value } })
      if (res.result?.code === 0) item.value = res.result.data
    } else {
      item.value = { knowledgeId: 'k1', title: 'VLOOKUP', syntax: 'VLOOKUP(...)', definition: '垂直查找函数', parameters: [{ name: 'lookup_value', type: 'any', desc: '要查找的值' }], examples: [{ title: '示例', description: '查找姓名', code: '=VLOOKUP(E2, A2:B10, 2, FALSE)' }] }
    }
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function toggleFav() {
  if (!item.value) return
  userStore.toggleFavorite(item.value.knowledgeId, 'knowledge', item.value.title)
  uni.showToast({ title: isFav.value ? '已取消' : '已收藏', icon: 'none' })
}

function copyCode(code) { uni.setClipboardData({ data: code, success: () => uni.showToast({ title: '已复制', icon: 'success' }) }) }
function goQuestion(qid) {
  const ids = item.value.relatedQuestionIds
  // 从 questionId 提取 bankId: excel_xxx → excel
  const prefix = ids[0].split('_')[0]
  uni.navigateTo({ url: `/pages/study/answer?mode=related&bankId=${prefix}&questionIds=${ids.join(',')}` })
}
</script>

<style lang="scss" scoped>
.container { padding: 32rpx; padding-bottom: 200rpx; }
.loading, .error { text-align: center; padding: 120rpx; color: var(--text-hint); font-size: 28rpx; }
.detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28rpx; }
.title { font-size: 38rpx; font-weight: 700; color: var(--text-primary); flex: 1; }
.fav-icon { font-size: 44rpx; color: var(--color-warning); padding: 8rpx; }
.syntax-box { padding: 24rpx; background: #f5f5f5; border-radius: 12rpx; margin-bottom: 28rpx; border-left: 6rpx solid var(--color-primary); }
.s-label { font-size: 22rpx; color: var(--text-hint); display: block; margin-bottom: 6rpx; }
.s-code { font-size: 26rpx; font-family: monospace; color: var(--text-primary); }
.section { margin-bottom: 28rpx; }
.sec-title { font-size: 30rpx; font-weight: 600; color: var(--text-primary); margin-bottom: 12rpx; display: block; }
.sec-text { font-size: 28rpx; color: var(--text-secondary); line-height: 1.8; }
.param-row { display: flex; padding: 12rpx 0; border-bottom: 1rpx solid var(--border-color); font-size: 26rpx; gap: 16rpx; }
.p-name { color: var(--text-primary); font-weight: 500; min-width: 140rpx; }
.p-type { color: var(--color-primary); font-size: 22rpx; min-width: 80rpx; }
.p-desc { color: var(--text-secondary); flex: 1; }
.example { margin-bottom: 24rpx; padding: 24rpx; background: var(--bg-card); border-radius: 12rpx; }
.ex-title { font-size: 28rpx; font-weight: 600; color: var(--text-primary); display: block; }
.ex-desc { font-size: 26rpx; color: var(--text-secondary); margin: 8rpx 0 16rpx; display: block; }
.code-block { margin-top: 12rpx; background: #1e1e1e; border-radius: 12rpx; overflow: auto; max-width: 100%; }
.cb-header { display: flex; justify-content: space-between; padding: 10rpx 20rpx; background: #333; }
.cb-lang { font-size: 22rpx; color: #aaa; }
.cb-copy { font-size: 22rpx; color: #6cf; }
.cb-content { padding: 12rpx 20rpx 16rpx; font-size: 24rpx; color: #d4d4d4; white-space: pre; display: inline-block; min-width: 100%; box-sizing: border-box; }
.related { margin-top: 28rpx; }
.tags { display: flex; gap: 16rpx; flex-wrap: wrap; }
.tag { font-size: 24rpx; color: var(--color-primary); background: #e8f4fd; padding: 8rpx 20rpx; border-radius: 20rpx; }
.ad-placeholder { position: fixed; bottom: 0; left: 0; right: 0; height: 100rpx; background: var(--bg-card); text-align: center; line-height: 100rpx; color: var(--text-hint); font-size: 24rpx; }
</style>
