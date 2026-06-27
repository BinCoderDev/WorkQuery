<template>
  <view class="container">
    <view class="search-bar">
      <text class="s-icon">🔍</text>
      <input class="s-input" v-model="keyword" placeholder="搜索 Excel函数、Python语法…" focus @input="onSearch" />
      <text class="s-clear" v-if="keyword" @click="clear">✕</text>
    </view>

    <view v-if="searching" class="status">搜索中…</view>
    <view v-else-if="keyword && results.length === 0" class="status">未找到「{{ keyword }}」相关内容</view>
    <view v-else-if="!keyword" class="status">输入关键词开始搜索</view>

    <view v-for="r in results" :key="`${r.type}_${r.id}`" class="result-item" @click="goItem(r)">
      <text class="r-type" :class="r.type">{{ r.type === 'question' ? '题目' : '知识点' }}</text>
      <text class="r-title"><rich-text :nodes="highlight(r.title)"></rich-text></text>
      <text class="r-preview" v-if="r.preview">{{ r.preview }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const keyword = ref('')
const results = ref([])
const searching = ref(false)
let timer = null

function onSearch() {
  clearTimeout(timer)
  if (!keyword.value.trim()) { results.value = []; return }
  timer = setTimeout(fetchResults, 300)
}

async function fetchResults() {
  searching.value = true
  try {
    if (typeof wx !== 'undefined' && wx.cloud) {
      const res = await wx.cloud.callFunction({ name: 'search', data: { keyword: keyword.value, limit: 20 } })
      if (res.result?.code === 0) results.value = res.result.data || []
    } else {
      results.value = [{ type: 'knowledge', id: 'k1', title: 'VLOOKUP 函数', preview: '垂直查找函数' }].filter(r => r.title.includes(keyword.value))
    }
  } catch (e) { console.error(e) }
  finally { searching.value = false }
}

function highlight(text) {
  if (!keyword.value || !text) return text
  const escaped = keyword.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<span style="color:#007AFF;font-weight:600;">$1</span>')
}

function clear() { keyword.value = ''; results.value = [] }

function goItem(r) {
  if (r.type === 'knowledge') {
    uni.navigateTo({ url: `/pages/reference/detail?knowledgeId=${r.id}` })
  } else {
    const bankId = r.id.split('_')[0]
    uni.navigateTo({ url: `/pages/study/answer?mode=related&bankId=${bankId}&questionIds=${r.id}` })
  }
}
</script>

<style lang="scss" scoped>
.container { padding: 24rpx; }
.search-bar { display: flex; align-items: center; background: var(--bg-card); border-radius: 40rpx; padding: 8rpx 24rpx; box-shadow: var(--shadow-sm); }
.s-icon { font-size: 32rpx; margin-right: 12rpx; }
.s-input { flex: 1; height: 72rpx; font-size: 28rpx; }
.s-clear { font-size: 28rpx; color: var(--text-hint); padding: 8rpx; }
.status { text-align: center; padding: 80rpx 0; color: var(--text-hint); font-size: 28rpx; }
.result-item { padding: 20rpx 0; border-bottom: 1rpx solid var(--border-color); }
.r-type { display: inline-block; font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx; margin-right: 12rpx; background: #e8f0fe; color: var(--color-primary); }
.r-title { font-size: 28rpx; color: var(--text-primary); }
.r-preview { display: block; font-size: 24rpx; color: var(--text-hint); margin-top: 6rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
