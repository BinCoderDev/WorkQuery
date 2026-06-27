<script>
import { useUserStore } from '@/stores/user'

export default {
  globalData: { theme: 'light', openid: '', isLoggedIn: false },

  async onLaunch() {
    console.log('WorkQuery App Launch')

    // 1. 初始化微信云开发
    this.initCloud()

    // 2. 应用主题
    this.applySavedTheme()

    // 3. 检查是否需要引导登录
    const hasAuth = uni.getStorageSync('auth_completed')

    if (hasAuth) {
      // 已授权过：静默登录（不弹出授权页）
      const userStore = useUserStore()
      await userStore.login()
      this.globalData.openid = userStore.openid
      this.globalData.isLoggedIn = userStore.isLoggedIn
    } else {
      // 首次使用：跳转到登录授权页面
      // 注意：onLaunch 时 pages 尚未渲染，需要通过 onShow 或延迟跳转
      this.globalData.needAuth = true
    }

    // 监听系统主题变化
    if (typeof wx !== 'undefined' && wx.onThemeChange) {
      wx.onThemeChange((res) => {
        const settings = uni.getStorageSync('settings') || {}
        if (settings.darkMode === 'auto') {
          this.switchTheme(res.theme)
        }
      })
    }
  },

  onShow() {
    this.applySavedTheme()

    // 首次启动 → 跳转到登录授权页
    if (this.globalData.needAuth) {
      this.globalData.needAuth = false
      uni.reLaunch({ url: '/pages/index/index' })
    }
  },

  methods: {
    initCloud() {
      try {
        if (typeof wx !== 'undefined' && wx.cloud) {
          // 云开发环境 ID：请替换为你的实际环境 ID
          // 在微信开发者工具 → 云开发 → 设置 → 环境设置 中查看
          const envId = 'cloud1-d2gbvh9lgc51d1733' // TODO: 替换为实际环境ID，如 'cloud1-xxxxxxxx'
          wx.cloud.init({
            env: envId,
            traceUser: true
          })
          console.log('Cloud environment initialized, env:', envId)
        }
      } catch (e) {
        console.error('Cloud init failed:', e)
      }
    },

    applySavedTheme() {
      try {
        const settings = uni.getStorageSync('settings') || {}
        const mode = settings.darkMode || 'auto'
        let theme = 'light'
        if (mode === 'dark') theme = 'dark'
        else if (mode === 'auto') {
          try {
            const sys = uni.getSystemInfoSync()
            theme = sys.theme || 'light'
          } catch (e) {}
        }
        this.switchTheme(theme)
      } catch (e) {}
    },

    switchTheme(theme) {
      this.globalData.theme = theme
      const isDark = theme === 'dark'
      // 导航栏
      uni.setNavigationBarColor({
        frontColor: isDark ? '#ffffff' : '#000000',
        backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF'
      })
      // 页面背景
      uni.setBackgroundColor({
        backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
        backgroundColorTop: isDark ? '#1A1A1A' : '#F5F5F5',
        backgroundColorBottom: isDark ? '#1A1A1A' : '#F5F5F5'
      })
      // CSS 变量注入到 page 元素
      try {
        wx.setPageStyle({
          style: isDark
            ? '--bg-primary:#1A1A1A;--bg-card:#2C2C2C;--text-primary:#E5E5E5;--text-secondary:#AAAAAA;--text-hint:#777777;--border-color:#3A3A3A;--shadow-sm:0 2rpx 8rpx rgba(0,0,0,0.3);--shadow-md:0 4rpx 16rpx rgba(0,0,0,0.4);'
            : '--bg-primary:#F5F5F5;--bg-card:#FFFFFF;--text-primary:#1A1A1A;--text-secondary:#666666;--text-hint:#999999;--border-color:#E5E5E5;--shadow-sm:0 2rpx 8rpx rgba(0,0,0,0.06);--shadow-md:0 4rpx 16rpx rgba(0,0,0,0.1);'
        })
      } catch (e) {
        console.warn('setPageStyle not supported in this WeChat version')
      }
    }
  }
}
</script>

<style lang="scss">
/* 全局 CSS 变量 — 浅色主题（默认） */
page {
  min-height: 100vh;
  overflow-y: auto;
  --bg-primary: #F5F5F5;
  --bg-card: #FFFFFF;
  --text-primary: #1A1A1A;
  --text-secondary: #666666;
  --text-hint: #999999;
  --border-color: #E5E5E5;
  --color-primary: #007AFF;
  --color-success: #07C160;
  --color-danger: #FA5151;
  --color-warning: #FFC300;
  --shadow-sm: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);

  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
  font-size: 28rpx;
  line-height: 1.6;
}

</style>
