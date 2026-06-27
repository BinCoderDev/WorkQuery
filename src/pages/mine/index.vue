<template>
  <view class="container">
    <!-- 用户信息区 -->
    <view class="profile-section" v-if="userStore.isLoggedIn">
      <button
        class="avatar-btn"
        open-type="chooseAvatar"
        @chooseavatar="onChooseAvatar"
      >
        <image
          v-if="userStore.userInfo.avatarUrl"
          class="avatar"
          :src="userStore.userInfo.avatarUrl"
          mode="aspectFill"
        />
        <view v-else class="avatar avatar-placeholder">
          <text class="avatar-placeholder-icon">👤</text>
        </view>
      </button>
      <view class="profile-info">
        <input
          class="nickname-input"
          type="nickname"
          :value="userStore.userInfo.nickName"
          placeholder="点击设置昵称"
          @input="onNicknameInput"
          @blur="onNicknameBlur"
        />
        <text class="profile-hint">点击头像和昵称进行设置</text>
      </view>
    </view>

    <!-- 未登录提示 -->
    <view class="profile-section profile-login-prompt" v-else>
      <view class="avatar avatar-placeholder">
        <text class="avatar-placeholder-icon">👤</text>
      </view>
      <view class="profile-info">
        <text class="profile-login-title">未登录</text>
        <text class="profile-hint">登录后可同步刷题数据</text>
      </view>
      <button class="profile-login-btn" @click="goLogin">登录</button>
    </view>

    <!-- 数据概览 -->
    <view class="stats-row">
      <view class="stat-item">
        <text class="stat-num">{{ userStore.totalAnswered }}</text>
        <text class="stat-label">累计刷题</text>
      </view>
      <view class="stat-item">
        <text class="stat-num wrong">{{ userStore.wrongCount }}</text>
        <text class="stat-label">错题数</text>
      </view>
      <view class="stat-item">
        <text class="stat-num fav">{{ userStore.favCount }}</text>
        <text class="stat-label">收藏数</text>
      </view>
    </view>

    <!-- 功能入口 -->
    <view class="menu-section">
      <view class="menu-card" @click="goWrong">
        <text class="card-icon">📝</text>
        <text class="card-title">错题本</text>
        <text class="card-count wrong-num">{{ userStore.wrongCount }} 道</text>
      </view>
      <view class="menu-card" @click="goFavorites">
        <text class="card-icon">⭐</text>
        <text class="card-title">我的收藏</text>
        <text class="card-count fav-num">{{ userStore.favCount }} 项</text>
      </view>
    </view>

    <!-- 设置 -->
    <view class="settings-section">
      <view class="setting-item">
        <text class="setting-label">深色模式</text>
        <view class="radio-group">
          <text :class="{ active: darkMode === 'auto' }" @click="switchDark('auto')">跟随系统</text>
          <text :class="{ active: darkMode === 'light' }" @click="switchDark('light')">浅色</text>
          <text :class="{ active: darkMode === 'dark' }" @click="switchDark('dark')">深色</text>
        </view>
      </view>
      <view class="setting-item">
        <text class="setting-label">展示广告</text>
        <switch :checked="settingsStore.adEnabled" @change="settingsStore.setAdEnabled($event.detail.value)" color="#007AFF" />
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="bottom-actions">
      <button class="clear-btn" @click="clearData">清空所有本地数据</button>
      <button class="about-btn" @click="showAbout">关于我们</button>
    </view>

    <!-- 广告 -->
    <view class="ad-placeholder" v-if="settingsStore.adEnabled">广告位</view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useSettingsStore } from '@/stores/settings'
import { useTheme } from '@/stores/theme'

const userStore = useUserStore()
const settingsStore = useSettingsStore()
const { setDark } = useTheme()
const darkMode = ref('auto')

onMounted(() => {
  darkMode.value = settingsStore.darkMode
})

function switchDark(mode) {
  darkMode.value = mode
  setDark(mode)
}

// --- 用户资料授权 ---
function onChooseAvatar(e) {
  const avatarUrl = e.detail?.avatarUrl
  if (avatarUrl) {
    userStore.updateProfile(userStore.userInfo.nickName, avatarUrl)
    uni.showToast({ title: '头像已更新', icon: 'success' })
  }
}

function onNicknameInput(e) {
  const nickName = e.detail?.value
  if (nickName && nickName.trim()) {
    userStore.updateProfile(nickName.trim(), userStore.userInfo.avatarUrl)
  }
}

function onNicknameBlur(e) {
  const nickName = e.detail?.value
  if (nickName && nickName.trim()) {
    userStore.updateProfile(nickName.trim(), userStore.userInfo.avatarUrl)
  }
}

function goLogin() {
  uni.reLaunch({ url: '/pages/index/index' })
}

const goWrong = () => uni.navigateTo({ url: '/pages/mine/wrong-questions' })
const goFavorites = () => uni.navigateTo({ url: '/pages/mine/favorites' })
const showAbout = () => uni.showToast({ title: 'WorkQuery v1.0.0', icon: 'none' })

function clearData() {
  uni.showModal({
    title: '确认清空',
    content: '清空后所有刷题进度、错题、收藏将被永久清除，不可恢复。确认清空？',
    success: async (res) => {
      if (res.confirm) {
        try { uni.clearStorageSync(); userStore.clearAll(); uni.showToast({ title: '已清空', icon: 'success' }) }
        catch (e) { uni.showToast({ title: '清空失败', icon: 'error' }) }
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.container { padding: 24rpx; padding-bottom: 200rpx; }

/* 用户信息区 */
.profile-section {
  display: flex;
  align-items: center;
  padding: 36rpx 32rpx;
  background: var(--bg-card);
  border-radius: 16rpx;
  box-shadow: var(--shadow-sm);
  margin-bottom: 32rpx;
}

.avatar-btn {
  width: 120rpx;
  height: 120rpx;
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  line-height: 1;
  flex-shrink: 0;
}
.avatar-btn::after { border: none; }

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: var(--border-color);
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-placeholder-icon {
  font-size: 56rpx;
  line-height: 1;
}

.profile-info {
  flex: 1;
  margin-left: 28rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.nickname-input {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--text-primary);
  height: 50rpx;
  line-height: 50rpx;
}

.profile-hint {
  font-size: 24rpx;
  color: var(--text-hint);
  margin-top: 8rpx;
}

/* 未登录提示 */
.profile-login-prompt {
  position: relative;
}

.profile-login-title {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4rpx;
}

.profile-login-btn {
  position: absolute;
  right: 32rpx;
  top: 50%;
  transform: translateY(-50%);
  height: 60rpx;
  line-height: 60rpx;
  padding: 0 32rpx;
  background: var(--color-primary);
  color: #FFFFFF;
  font-size: 26rpx;
  border-radius: 30rpx;
  border: none;
}

.profile-login-btn::after { border: none; }

.stats-row { display: flex; justify-content: space-around; padding: 40rpx 0; background: var(--bg-card); border-radius: 16rpx; box-shadow: var(--shadow-sm); margin-bottom: 32rpx; }
.stat-item { text-align: center; }
.stat-num { display: block; font-size: 48rpx; font-weight: 700; color: var(--text-primary); }
.stat-num.wrong { color: var(--color-danger); }
.stat-num.fav { color: var(--color-warning); }
.stat-label { font-size: 24rpx; color: var(--text-hint); }
.menu-section { display: flex; gap: 24rpx; margin-bottom: 32rpx; }
.menu-card { flex: 1; padding: 32rpx; background: var(--bg-card); border-radius: 16rpx; box-shadow: var(--shadow-sm); text-align: center; }
.menu-card:active { transform: scale(0.98); }
.card-icon { font-size: 48rpx; display: block; margin-bottom: 12rpx; }
.card-title { font-size: 28rpx; color: var(--text-primary); font-weight: 600; }
.card-count { display: block; font-size: 24rpx; margin-top: 4rpx; }
.wrong-num { color: var(--color-danger); }
.fav-num { color: var(--color-warning); }
.settings-section { background: var(--bg-card); border-radius: 16rpx; box-shadow: var(--shadow-sm); padding: 24rpx; margin-bottom: 32rpx; }
.setting-item { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; }
.setting-label { font-size: 28rpx; color: var(--text-primary); }
.radio-group { display: flex; gap: 12rpx; font-size: 24rpx; color: var(--text-hint); }
.radio-group .active { color: var(--color-primary); font-weight: 600; }
.bottom-actions { display: flex; flex-direction: column; gap: 12rpx; }
.clear-btn { background: none; color: var(--color-danger); font-size: 28rpx; }
.about-btn { background: none; color: var(--text-hint); font-size: 26rpx; }
.ad-placeholder { position: fixed; bottom: 0; left: 0; right: 0; height: 100rpx; background: var(--bg-card); text-align: center; line-height: 100rpx; color: var(--text-hint); font-size: 24rpx; }
</style>
