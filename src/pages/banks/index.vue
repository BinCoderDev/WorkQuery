<template>
  <view class="container">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="app-name">WorkQuery</text>
      <text class="slogan">刷题巩固，即查即用</text>
    </view>

    <!-- 加载骨架屏 -->
    <view v-if="banksStore.loading && banksStore.banks.length === 0" class="skeleton-list">
      <view v-for="i in 2" :key="i" class="skeleton-card">
        <view class="sk-icon"></view>
        <view class="sk-line sk-title"></view>
        <view class="sk-line sk-desc"></view>
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else-if="banksStore.error && banksStore.banks.length === 0" class="error-state">
      <text class="error-icon">😵</text>
      <text class="error-text">{{ banksStore.error }}</text>
      <button class="retry-btn" @click="fetchBanks">点击重试</button>
    </view>

    <!-- 题库卡片列表 -->
    <view v-else class="bank-list">
      <view
        v-for="bank in banksStore.banks"
        :key="bank.bankId"
        class="bank-card"
        :class="{ disabled: !bank.isActive || bank.totalQuestions === 0 }"
        @click="goBank(bank)"
      >
        <view class="card-header">
          <text class="bank-icon">{{ bank.bankIcon }}</text>
          <view class="card-info">
            <text class="bank-name">{{ bank.bankName }}</text>
            <text class="bank-count">共 {{ bank.totalQuestions }} 题</text>
          </view>
          <text class="arrow">›</text>
        </view>
        <text class="bank-desc">{{ bank.bankDescription }}</text>
        <!-- 进度条 -->
        <view v-if="getProgress(bank.bankId).completedCount > 0" class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent(bank.bankId) + '%' }"></view>
        </view>
        <text v-if="getProgress(bank.bankId).completedCount > 0" class="progress-text">
          已完成 {{ getProgress(bank.bankId).completedCount }}/{{ bank.totalQuestions }} 题
        </text>
      </view>
    </view>

    <!-- 底部广告位 -->
    <view class="ad-placeholder" v-if="settingsStore.adEnabled">广告位</view>
  </view>
</template>

<script setup>
import { onMounted } from 'vue'
import { useBanksStore } from '@/stores/banks'
import { useUserStore } from '@/stores/user'
import { useSettingsStore } from '@/stores/settings'

const banksStore = useBanksStore()
const userStore = useUserStore()
const settingsStore = useSettingsStore()

onMounted(() => {
  fetchBanks()
})

async function fetchBanks() {
  await banksStore.fetchBanks()
}

function getProgress(bankId) {
  return userStore.getProgress(bankId)
}

function progressPercent(bankId) {
  const bank = banksStore.getBank(bankId)
  if (!bank || bank.totalQuestions === 0) return 0
  return Math.min(100, Math.round(getProgress(bankId).completedCount / bank.totalQuestions * 100))
}

function goBank(bank) {
  if (!bank.isActive || bank.totalQuestions === 0) {
    uni.showToast({ title: '题目正在准备中', icon: 'none' })
    return
  }
  uni.navigateTo({ url: `/pages/study/mode-select?bankId=${bank.bankId}` })
}
</script>

<style lang="scss" scoped>
.container {
  padding: 24rpx;
  padding-bottom: 160rpx;
}

.page-header {
  padding: 32rpx 0;
  text-align: center;
}
.app-name {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: var(--color-primary);
}
.slogan {
  display: block;
  font-size: 26rpx;
  color: var(--text-secondary);
  margin-top: 8rpx;
}

/* 骨架屏 */
.skeleton-card {
  padding: 32rpx;
  margin-bottom: 24rpx;
  background: var(--bg-card);
  border-radius: 16rpx;
}
.sk-icon { width: 64rpx; height: 64rpx; background: #e0e0e0; border-radius: 12rpx; margin-bottom: 16rpx; }
.sk-line { height: 24rpx; background: #e0e0e0; border-radius: 6rpx; margin-bottom: 12rpx; }
.sk-title { width: 60%; }
.sk-desc { width: 90%; }

/* 错误状态 */
.error-state {
  text-align: center;
  padding: 120rpx 48rpx;
}
.error-icon { font-size: 80rpx; display: block; margin-bottom: 24rpx; }
.error-text { font-size: 28rpx; color: var(--text-secondary); margin-bottom: 32rpx; }
.retry-btn { background: var(--color-primary); color: #fff; border-radius: 40rpx; font-size: 28rpx; padding: 16rpx 64rpx; }

/* 题库卡片 */
.bank-card {
  padding: 32rpx;
  margin-bottom: 24rpx;
  background: var(--bg-card);
  border-radius: 16rpx;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s;
}
.bank-card:active { transform: scale(0.98); }
.bank-card.disabled { opacity: 0.5; }
.card-header { display: flex; align-items: center; }
.bank-icon { font-size: 48rpx; margin-right: 20rpx; }
.card-info { flex: 1; }
.bank-name { display: block; font-size: 32rpx; font-weight: 600; color: var(--text-primary); }
.bank-count { font-size: 24rpx; color: var(--text-hint); margin-top: 4rpx; }
.arrow { font-size: 36rpx; color: var(--text-hint); }
.bank-desc { display: block; font-size: 26rpx; color: var(--text-secondary); margin-top: 16rpx; }

/* 进度条 */
.progress-bar { height: 8rpx; background: #e8e8e8; border-radius: 4rpx; margin-top: 20rpx; overflow: hidden; }
.progress-fill { height: 100%; background: var(--color-primary); border-radius: 4rpx; transition: width 0.5s; }
.progress-text { display: block; font-size: 22rpx; color: var(--color-primary); margin-top: 8rpx; }

/* 广告 */
.ad-placeholder {
  position: fixed; bottom: 0; left: 0; right: 0;
  height: 100rpx; background: var(--bg-card);
  text-align: center; line-height: 100rpx;
  color: var(--text-hint); font-size: 24rpx;
}
</style>
