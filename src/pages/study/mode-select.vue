<template>
  <view class="container">
    <text class="bank-name">{{ bankName }}</text>
    <text class="bank-count">共 {{ totalCount }} 题</text>

    <view class="mode-buttons">
      <view class="mode-btn sequential" @click="startStudy('sequential')">
        <text class="btn-title">📖 顺序练习</text>
        <text class="btn-desc">按题库顺序逐题练习，记录进度</text>
        <text class="btn-hint" v-if="progress.completedCount > 0">
          已完成 {{ progress.completedCount }} 题，继续练习
        </text>
      </view>
      <view class="mode-btn random" @click="startStudy('random')">
        <text class="btn-title">🎲 随机刷题</text>
        <text class="btn-desc">随机出题，碎片化巩固练习</text>
      </view>
    </view>

    <view v-if="progress.completedCount > 0 && progress.completedCount >= totalCount" class="complete-hint">
      <text>你已经完成本题库全部练习 🎉</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useBanksStore } from '@/stores/banks'
import { useUserStore } from '@/stores/user'

const banksStore = useBanksStore()
const userStore = useUserStore()

const bankId = ref('')
const bankName = ref('')
const totalCount = ref(0)
const progress = ref({ completedCount: 0 })

onLoad((options) => {
  bankId.value = options.bankId || ''
  const bank = banksStore.getBank(bankId.value)
  if (bank) {
    bankName.value = bank.bankName
    totalCount.value = bank.totalQuestions
  }
  progress.value = userStore.getProgress(bankId.value)
})

const startStudy = (mode) => {
  uni.navigateTo({
    url: `/pages/study/answer?bankId=${bankId.value}&mode=${mode}`
  })
}
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64rpx 48rpx;
}
.bank-name { font-size: 40rpx; font-weight: 700; color: var(--text-primary); }
.bank-count { font-size: 26rpx; color: var(--text-secondary); margin-top: 8rpx; margin-bottom: 56rpx; }
.mode-buttons { width: 100%; display: flex; flex-direction: column; gap: 28rpx; }
.mode-btn {
  padding: 36rpx 40rpx;
  border-radius: 16rpx;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
}
.mode-btn:active { transform: scale(0.98); }
.btn-title { display: block; font-size: 34rpx; font-weight: 600; color: var(--text-primary); }
.btn-desc { display: block; font-size: 24rpx; color: var(--text-hint); margin-top: 8rpx; }
.btn-hint {
  display: block;
  margin-top: 12rpx;
  padding: 8rpx 16rpx;
  background: #e8f4fd;
  color: var(--color-primary);
  font-size: 24rpx;
  border-radius: 8rpx;
  text-align: center;
}
.complete-hint {
  margin-top: 48rpx;
  padding: 24rpx;
  background: #f0f9f0;
  border-radius: 12rpx;
  text-align: center;
  font-size: 26rpx;
  color: var(--color-success);
}
</style>
