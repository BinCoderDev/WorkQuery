<template>
  <view class="container">
    <view class="sort-bar">
      <text :class="{ active: sortBy === 'usageFrequency' }" @click="sort('usageFrequency')">使用频率</text>
      <text :class="{ active: sortBy === 'title' }" @click="sort('title')">字母顺序</text>
    </view>
    <view v-if="loading" class="loading">加载中…</view>
    <view v-else-if="groups.length === 0" class="empty">暂无知识点</view>
    <view v-for="grp in groups" :key="grp.group" class="group">
      <text class="group-title">{{ grp.group }}</text>
      <view v-for="item in grp.items" :key="item.knowledgeId" class="item" @click="goDetail(item)">
        <text class="item-title">{{ item.title }}</text>
        <text class="item-preview">{{ item.definition ? item.definition.substring(0, 60) + '…' : '' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const categoryId = ref('')
const sortBy = ref('usageFrequency')
const groups = ref([])
const loading = ref(false)

onLoad((options) => { categoryId.value = options.categoryId || ''; fetch() })

async function sort(field) { sortBy.value = field; fetch() }

async function fetch() {
  loading.value = true
  try {
    if (typeof wx !== 'undefined' && wx.cloud) {
      const res = await wx.cloud.callFunction({ name: 'getKnowledgeItems', data: { categoryId: categoryId.value, sortBy: sortBy.value } })
      if (res.result?.code === 0) groups.value = res.result.data || []
    } else {
      groups.value = [{ group: '查找与引用', items: [{ knowledgeId: 'k1', title: 'VLOOKUP', definition: '垂直查找函数' }] }]
    }
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const goDetail = (item) => uni.navigateTo({ url: `/pages/reference/detail?knowledgeId=${item.knowledgeId}` })
</script>

<style lang="scss" scoped>
.container { padding: 24rpx; }
.sort-bar { display: flex; gap: 32rpx; padding: 16rpx 0 24rpx; font-size: 26rpx; color: var(--text-secondary); }
.sort-bar .active { color: var(--color-primary); font-weight: 600; }
.loading, .empty { text-align: center; padding: 80rpx; color: var(--text-hint); }
.group { margin-bottom: 32rpx; }
.group-title { font-size: 26rpx; font-weight: 600; color: var(--text-secondary); padding: 8rpx 0 16rpx; display: block; }
.item { padding: 20rpx 24rpx; margin-bottom: 12rpx; background: var(--bg-card); border-radius: 12rpx; box-shadow: var(--shadow-sm); }
.item-title { display: block; font-size: 28rpx; color: var(--text-primary); font-weight: 500; }
.item-preview { display: block; font-size: 24rpx; color: var(--text-hint); margin-top: 4rpx; }
</style>
