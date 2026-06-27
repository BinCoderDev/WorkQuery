<template>
  <view class="container">
    <view class="filter-tabs">
      <text :class="{ active: filter === 'all' }" @click="filter = 'all'">全部</text>
      <text v-for="b in bankList" :key="b" :class="{ active: filter === b }" @click="filter = b">{{ bankLabel(b) }}</text>
      <text class="clear-btn" @click="clearAll">清空</text>
    </view>
    <view v-if="filteredList.length === 0" class="empty">
      <text class="empty-icon">🎉</text>
      <text class="empty-text">暂无错题</text>
    </view>
    <view v-for="item in filteredList" :key="item.questionId" class="item" @click="redoWrong(item)">
      <text class="item-preview">{{ item.questionPreview }}</text>
      <text class="item-count">错 {{ item.errorCount }} 次</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const filter = ref('all')

onMounted(() => userStore.fetchUserData())

const bankList = computed(() => [...new Set(userStore.wrongQuestions.map(w => w.bankId))])

const filteredList = computed(() => {
  if (filter.value === 'all') return userStore.wrongQuestions
  return userStore.wrongQuestions.filter(w => w.bankId === filter.value)
})

function bankLabel(b) { return b === 'excel' ? 'Excel' : b === 'python' ? 'Python' : b }

async function clearAll() {
  uni.showModal({
    title: '清空错题本',
    content: filter.value === 'all' ? '确认清空全部错题？' : `确认清空 ${bankLabel(filter.value)} 错题？`,
    success: async (res) => {
      if (res.confirm) {
        await userStore.clearWrongQuestions(filter.value === 'all' ? null : filter.value)
        uni.showToast({ title: '已清空', icon: 'success' })
      }
    }
  })
}

function redoWrong(item) {
  uni.navigateTo({ url: `/pages/study/answer?mode=wrongReview&bankId=${item.bankId}` })
}
</script>

<style lang="scss" scoped>
.container { padding: 24rpx; }
.filter-tabs { display: flex; gap: 24rpx; padding: 16rpx 0 24rpx; font-size: 26rpx; color: var(--text-secondary); align-items: center; }
.filter-tabs .active { color: var(--color-primary); font-weight: 600; }
.clear-btn { margin-left: auto; color: var(--color-danger); }
.empty { text-align: center; padding: 120rpx 0; }
.empty-icon { font-size: 64rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: var(--text-hint); }
.item { display: flex; justify-content: space-between; align-items: center; padding: 24rpx; background: var(--bg-card); border-radius: 12rpx; margin-bottom: 16rpx; box-shadow: var(--shadow-sm); }
.item-preview { font-size: 28rpx; color: var(--text-primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-count { font-size: 24rpx; color: var(--color-danger); margin-left: 16rpx; padding: 4rpx 12rpx; background: #fff0f0; border-radius: 8rpx; }
</style>
