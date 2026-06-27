import { reactive } from 'vue'
import { useSettingsStore } from './settings'

/**
 * 全局主题管理器 — 所有页面通过它获取和响应主题变化
 */
const state = reactive({ current: 'light' })

export function useTheme() {
  const settingsStore = useSettingsStore()

  function refresh() {
    state.current = settingsStore.getEffectiveTheme()
    // 更新导航栏
    uni.setNavigationBarColor({
      frontColor: state.current === 'dark' ? '#ffffff' : '#000000',
      backgroundColor: state.current === 'dark' ? '#1A1A1A' : '#FFFFFF'
    })
    // 更新页面背景
    uni.setBackgroundColor({
      backgroundColor: state.current === 'dark' ? '#1A1A1A' : '#F5F5F5',
      backgroundColorTop: state.current === 'dark' ? '#1A1A1A' : '#F5F5F5',
      backgroundColorBottom: state.current === 'dark' ? '#1A1A1A' : '#F5F5F5'
    })
  }

  function setDark(mode) {
    settingsStore.setDarkMode(mode)
    refresh()
  }

  // 初始化
  refresh()

  return {
    theme: state,
    isDark: () => state.current === 'dark',
    refresh,
    setDark
  }
}
