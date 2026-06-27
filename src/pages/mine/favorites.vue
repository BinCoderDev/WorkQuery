<template>
  <view class="container">
    <view class="filter-tabs">
      <text :class="{ active: filter === 'all' }" @click="filter = 'all'">全部</text>
      <text :class="{ active: filter === 'question' }" @click="filter = 'question'">题目</text>
      <text :class="{ active: filter === 'knowledge' }" @click="filter = 'knowledge'">知识点</text>
      <text class="manage-btn" @click="manageMode = !manageMode">{{ manageMode ? '完成' : '管理' }}</text>
    </view>

    <view v-if="filteredList.length === 0" class="empty">
      <text class="empty-icon">📌</text>
      <text class="empty-text">还没有收藏哦</text>
    </view>

    <view v-for="item in filteredList" :key="`${item.itemType}_${item.itemId}`" class="fav-item" @click="manageMode ? toggleSelect(item.itemId) : goItem(item)">
      <view v-if="manageMode" class="cb">
        <text :class="selectedIds.includes(item.itemId) ? 'checked' : ''">{{ selectedIds.includes(item.itemId) ? '☑' : '☐' }}</text>
      </view>
      <view class="item-content">
        <text class="item-type-tag" :class="item.itemType">{{ item.itemType === 'question' ? '题目' : '知识点' }}</text>
        <text class="item-title">{{ item.preview || item.itemId }}</text>
      </view>
      <text v-if="!manageMode" class="swipe-hint" @click.stop="removeOne(item)">✕</text>
    </view>

    <view v-if="manageMode && selectedIds.length > 0" class="batch-bar">
      <button class="batch-btn" @click="batchRemove">取消收藏(已选{{ selectedIds.length }}项)</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const filter = ref('all')
const manageMode = ref(false)
const selectedIds = ref([])

onMounted(() => userStore.fetchUserData())

const filteredList = computed(() => {
  if (filter.value === 'all') return userStore.favorites
  return userStore.favorites.filter(f => f.itemType === filter.value)
})

function toggleSelect(id) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

function goItem(f) {
  if (f.itemType === 'knowledge') uni.navigateTo({ url: `/pages/reference/detail?knowledgeId=${f.itemId}` })
  else uni.navigateTo({ url: `/pages/study/answer?mode=wrongReview&bankId=excel` })
}

async function removeOne(item) {
  await userStore.toggleFavorite(item.itemId, item.itemType, item.preview)
  uni.showToast({ title: '已取消', icon: 'none' })
}

async function batchRemove() {
  uni.showModal({
    title: '确认取消',
    content: `取消 ${selectedIds.value.length} 项收藏？`,
    success: async (res) => {
      if (res.confirm) {
        await userStore.batchRemoveFavorites(selectedIds.value)
        selectedIds.value = []
        manageMode.value = false
        uni.showToast({ title: '已取消', icon: 'success' })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.container { padding: 24rpx; padding-bottom: 140rpx; }
.filter-tabs { display: flex; gap: 24rpx; padding: 16rpx 0 24rpx; font-size: 26rpx; color: var(--text-secondary); align-items: center; }
.filter-tabs .active { color: var(--color-primary); font-weight: 600; }
.manage-btn { margin-left: auto; color: var(--color-primary); font-size: 24rpx; }
.empty { text-align: center; padding: 120rpx 0; }
.empty-icon { font-size: 64rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: var(--text-hint); }
.fav-item { display: flex; align-items: center; padding: 24rpx; background: var(--bg-card); border-radius: 12rpx; margin-bottom: 16rpx; box-shadow: var(--shadow-sm); gap: 16rpx; }
.cb { font-size: 36rpx; color: var(--text-hint); }
.cb .checked { color: var(--color-primary); }
.item-content { flex: 1; }
.item-type-tag { display: inline-block; font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx; margin-bottom: 6rpx; background: #e8f0fe; color: var(--color-primary); }
.item-title { display: block; font-size: 28rpx; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.swipe-hint { font-size: 28rpx; color: var(--text-hint); padding: 12rpx; }
.batch-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 24rpx; background: var(--bg-card); border-top: 1rpx solid var(--border-color); }
.batch-btn { background: var(--color-danger); color: #fff; border-radius: 12rpx; font-size: 28rpx; }
</style>
