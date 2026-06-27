import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

/**
 * 用户设置 Store
 * 管理 darkMode（三态）和 adEnabled（广告开关）
 * 变更时自动持久化到 wx.Storage
 */
export const useSettingsStore = defineStore('settings', () => {
  // --- 状态 ---
  const darkMode = ref('auto')    // 'auto' | 'light' | 'dark'
  const adEnabled = ref(true)

  // --- 初始化：从本地存储恢复 ---
  function loadFromStorage() {
    try {
      const saved = uni.getStorageSync('settings')
      if (saved) {
        if (saved.darkMode) darkMode.value = saved.darkMode
        if (saved.adEnabled !== undefined) adEnabled.value = saved.adEnabled
      }
    } catch (e) {
      console.warn('读取设置失败，使用默认值')
    }
  }

  // --- 持久化 ---
  function persist() {
    uni.setStorageSync('settings', {
      darkMode: darkMode.value,
      adEnabled: adEnabled.value
    })
  }

  // 监听变更自动写入 Storage
  watch([darkMode, adEnabled], persist, { deep: false })

  // --- 获取当前生效的主题 ---
  function getEffectiveTheme() {
    if (darkMode.value === 'auto') {
      try {
        const sysInfo = uni.getSystemInfoSync()
        return sysInfo.theme || 'light'
      } catch (e) {
        return 'light'
      }
    }
    return darkMode.value
  }

  // --- 设置深色模式 ---
  function setDarkMode(mode) {
    darkMode.value = mode
  }

  // --- 切换广告 ---
  function setAdEnabled(enabled) {
    adEnabled.value = enabled
  }

  // 启动时加载
  loadFromStorage()

  return {
    darkMode,
    adEnabled,
    loadFromStorage,
    getEffectiveTheme,
    setDarkMode,
    setAdEnabled
  }
})
