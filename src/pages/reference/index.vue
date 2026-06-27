<template>
  <view class="container">
    <view class="search-bar" hover-class="search-bar-hover" @tap="goSearch">
      <text class="search-icon">🔍</text>
      <text class="search-placeholder">搜索 Excel函数、Python语法…</text>
    </view>
    <view class="category-list">
      <view v-if="loading" class="loading">加载中…</view>
      <view v-else-if="error" class="error">
        <text>{{ error }}</text><button @click="fetch">重试</button>
      </view>
      <view v-for="cat in categories" :key="cat.categoryId" class="cat-card" @click="goList(cat)">
        <text class="cat-icon">{{ cat.icon || '📘' }}</text>
        <view class="cat-info">
          <text class="cat-name">{{ cat.categoryName }}</text>
          <text class="cat-count">{{ cat.count || 0 }} 个知识点</text>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const categories = ref([])
const loading = ref(false)
const error = ref('')

onMounted(() => fetch())

async function fetch() {
  loading.value = true; error.value = ''
  try {
    if (typeof wx !== 'undefined' && wx.cloud) {
      const res = await wx.cloud.callFunction({ name: 'getKnowledgeCategories' })
      if (res.result?.code === 0) categories.value = res.result.data || []
    } else {
      categories.value = [
        { categoryId: 'excel', categoryName: 'Excel函数', count: 45 },
        { categoryId: 'python', categoryName: 'Python基础', count: 40 }
      ]
    }
  } catch (e) { error.value = e.message || '加载失败' }
  finally { loading.value = false }
}

const goSearch = () => uni.navigateTo({ url: '/pages/reference/search' })
const goList = (cat) => uni.navigateTo({ url: `/pages/reference/list?categoryId=${cat.categoryId}` })
</script>

<style lang="scss" scoped>
.container { padding: 24rpx; }
.search-bar { display: flex; align-items: center; padding: 20rpx 24rpx; background: var(--bg-card); border-radius: 40rpx; box-shadow: var(--shadow-sm); margin-bottom: 32rpx; }
.search-bar-hover { opacity: 0.7; }
.search-icon { font-size: 32rpx; margin-right: 16rpx; }
.search-placeholder { font-size: 28rpx; color: var(--text-hint); }
.loading, .error { text-align: center; padding: 80rpx; color: var(--text-hint); font-size: 28rpx; }
.cat-card { display: flex; align-items: center; padding: 28rpx; margin-bottom: 20rpx; background: var(--bg-card); border-radius: 16rpx; box-shadow: var(--shadow-sm); }
.cat-card:active { transform: scale(0.98); }
.cat-icon { font-size: 48rpx; margin-right: 20rpx; }
.cat-info { flex: 1; }
.cat-name { display: block; font-size: 30rpx; font-weight: 600; color: var(--text-primary); }
.cat-count { font-size: 24rpx; color: var(--text-hint); margin-top: 4rpx; }
.arrow { font-size: 36rpx; color: var(--text-hint); }
</style>
