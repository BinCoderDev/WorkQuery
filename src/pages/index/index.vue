<template>
  <view class="login-container">
    <!-- 顶部装饰 -->
    <view class="header-area">
      <view class="logo-icon">💼</view>
      <text class="app-name">WorkQuery</text>
      <text class="app-desc">职场技能 · 速查刷题</text>
    </view>

    <!-- 功能介绍 -->
    <view class="features">
      <view class="feature-item">
        <text class="feature-icon">📚</text>
        <text class="feature-text">海量题库 · 顺序/随机刷题</text>
      </view>
      <view class="feature-item">
        <text class="feature-icon">🔍</text>
        <text class="feature-text">知识速查 · 即查即用</text>
      </view>
      <view class="feature-item">
        <text class="feature-icon">☁️</text>
        <text class="feature-text">云端同步 · 数据不丢失</text>
      </view>
    </view>

    <!-- 登录/授权区域 -->
    <view class="auth-area">
      <!-- 阶段 1：登录按钮 -->
      <view v-if="authStep === 0" class="auth-step">
        <button class="login-btn" @click="handleLogin" :loading="loggingIn">
          <text class="login-btn-icon">👤</text>
          <text class="login-btn-text">微信授权登录</text>
        </button>
        <text class="auth-hint">
          授权后将自动同步您的刷题进度、错题和收藏
        </text>
        <text class="auth-hint-sub">
          仅获取您的微信标识（openid），不获取社交信息
        </text>
      </view>

      <!-- 阶段 2：完善资料 -->
      <view v-if="authStep === 1" class="auth-step">
        <text class="step-title">完善个人资料</text>

        <!-- 头像 -->
        <view class="profile-edit">
          <button
            class="avatar-pick-btn"
            open-type="chooseAvatar"
            @chooseavatar="onChooseAvatar"
          >
            <image
              v-if="tempAvatar"
              class="avatar-preview"
              :src="tempAvatar"
              mode="aspectFill"
            />
            <view v-else class="avatar-preview avatar-empty">
              <text class="empty-icon">📷</text>
            </view>
            <text class="avatar-hint">点击设置头像</text>
          </button>
        </view>

        <!-- 昵称 -->
        <view class="nickname-edit">
          <input
            class="nickname-field"
            type="nickname"
            :value="tempNickName"
            placeholder="点击获取微信昵称"
            @input="onNicknameInput"
            @confirm="onNicknameConfirm"
          />
          <text class="nickname-hint">点击上方输入框，选择「微信昵称」即可自动填入</text>
        </view>

        <button class="enter-btn" @click="handleEnterApp">
          进入小程序
        </button>
        <text class="skip-link" @click="handleEnterApp">暂不设置，直接进入</text>
      </view>

      <!-- 阶段 3：完成 -->
      <view v-if="authStep === 2" class="auth-step">
        <view class="success-icon">✅</view>
        <text class="success-text">登录成功</text>
        <text class="success-sub">即将进入首页…</text>
      </view>
    </view>

    <!-- 底部 -->
    <view class="footer">
      <text class="footer-text">登录即表示同意《用户协议》和《隐私政策》</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const authStep = ref(0)      // 0=登录按钮, 1=完善资料, 2=成功
const loggingIn = ref(false)
const tempAvatar = ref('')
const tempNickName = ref('')

// --- 微信登录 ---
async function handleLogin() {
  loggingIn.value = true
  try {
    await userStore.login()

    if (userStore.isLoggedIn) {
      // 登录成功，进入资料完善阶段
      authStep.value = 1

      // 预填已有的资料
      if (userStore.userInfo.avatarUrl) {
        tempAvatar.value = userStore.userInfo.avatarUrl
      }
      if (userStore.userInfo.nickName) {
        tempNickName.value = userStore.userInfo.nickName
      }
    } else {
      uni.showToast({ title: '登录失败，请重试', icon: 'error' })
    }
  } catch (e) {
    console.error('Login error:', e)
    uni.showToast({ title: '登录失败，请重试', icon: 'error' })
  } finally {
    loggingIn.value = false
  }
}

// --- 头像选择 ---
function onChooseAvatar(e) {
  const url = e.detail?.avatarUrl
  if (url) {
    tempAvatar.value = url
  }
}

// --- 昵称输入 ---
function onNicknameInput(e) {
  const val = e.detail?.value
  if (val !== undefined) {
    tempNickName.value = val
  }
}

function onNicknameConfirm(e) {
  const val = e.detail?.value
  if (val) {
    tempNickName.value = val
  }
}

// --- 进入小程序 ---
async function handleEnterApp() {
  // 保存用户资料
  if (tempAvatar.value || tempNickName.value) {
    await userStore.updateProfile(tempNickName.value, tempAvatar.value)
  }

  // 标记已完成登录引导
  uni.setStorageSync('auth_completed', true)

  // 跳转到 Tab 首页
  authStep.value = 2
  setTimeout(() => {
    uni.switchTab({ url: '/pages/banks/index' })
  }, 800)
}
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 80rpx 48rpx 60rpx;
  background: var(--bg-primary);
}

/* 顶部 */
.header-area {
  text-align: center;
  margin-bottom: 64rpx;
}

.logo-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 24rpx;
}

.app-name {
  display: block;
  font-size: 52rpx;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 12rpx;
}

.app-desc {
  display: block;
  font-size: 28rpx;
  color: var(--text-secondary);
}

/* 功能介绍 */
.features {
  width: 100%;
  background: var(--bg-card);
  border-radius: 16rpx;
  padding: 32rpx 28rpx;
  margin-bottom: 60rpx;
  box-shadow: var(--shadow-sm);
}

.feature-item {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
}

.feature-item + .feature-item {
  border-top: 1rpx solid var(--border-color);
}

.feature-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.feature-text {
  font-size: 28rpx;
  color: var(--text-primary);
}

/* 授权区域 */
.auth-area {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.auth-step {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #07C160, #06AD56);
  border-radius: 50rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28rpx;
  box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.3);
}

.login-btn::after { border: none; }

.login-btn-icon {
  font-size: 40rpx;
  margin-right: 12rpx;
}

.login-btn-text {
  font-size: 34rpx;
  font-weight: 600;
  color: #FFFFFF;
}

.auth-hint {
  font-size: 24rpx;
  color: var(--text-hint);
  text-align: center;
  line-height: 1.6;
}

.auth-hint-sub {
  font-size: 22rpx;
  color: var(--text-hint);
  opacity: 0.6;
  text-align: center;
  margin-top: 8rpx;
}

/* 资料完善 */
.step-title {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 48rpx;
}

.profile-edit {
  margin-bottom: 36rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-pick-btn {
  width: auto;
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  line-height: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-pick-btn::after { border: none; }

.avatar-preview {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: var(--border-color);
  margin-bottom: 16rpx;
}

.avatar-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx dashed var(--border-color);
  background: transparent;
}

.empty-icon {
  font-size: 56rpx;
}

.avatar-hint {
  font-size: 26rpx;
  color: var(--color-primary);
}

.nickname-edit {
  width: 100%;
  margin-bottom: 48rpx;
}

.nickname-field {
  width: 100%;
  height: 88rpx;
  background: var(--bg-card);
  border: 2rpx solid var(--border-color);
  border-radius: 16rpx;
  padding: 0 28rpx;
  font-size: 32rpx;
  color: var(--text-primary);
  text-align: center;
  box-sizing: border-box;
}

.nickname-hint {
  display: block;
  font-size: 22rpx;
  color: var(--text-hint);
  text-align: center;
  margin-top: 12rpx;
}

.enter-btn {
  width: 100%;
  height: 88rpx;
  background: var(--color-primary);
  border-radius: 44rpx;
  border: none;
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.enter-btn::after { border: none; }

.skip-link {
  font-size: 26rpx;
  color: var(--text-hint);
  text-decoration: underline;
}

/* 成功 */
.success-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.success-text {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8rpx;
}

.success-sub {
  font-size: 26rpx;
  color: var(--text-hint);
}

/* 底部 */
.footer {
  margin-top: 40rpx;
}

.footer-text {
  font-size: 22rpx;
  color: var(--text-hint);
  opacity: 0.5;
}
</style>
