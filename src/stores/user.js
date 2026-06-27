import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 用户数据 Store
 * 管理错题本、收藏夹、刷题进度
 * 数据以云数据库为主，本地缓存为降级备份
 */
export const useUserStore = defineStore('user', () => {
  // --- 登录状态 ---
  const openid = ref('')
  const isLoggedIn = ref(false)
  const userInfo = ref({ nickName: '', avatarUrl: '' })
  const loginLoading = ref(false)

  // --- 业务数据 ---
  const wrongQuestions = ref([])     // 错题列表
  const favorites = ref([])         // 收藏列表
  const progress = ref({})          // 进度: { [bankId]: { mode, currentIndex, completedCount, updatedAt } }
  const syncPending = ref(false)    // 是否有待同步的离线操作

  // --- 计算属性 ---
  const wrongCount = computed(() => wrongQuestions.value.length)
  const favCount = computed(() => favorites.value.length)
  const totalAnswered = computed(() => {
    return Object.values(progress.value).reduce((sum, p) => sum + (p.completedCount || 0), 0)
  })

  // --- 登录 ---
  async function login() {
    if (typeof wx === 'undefined') return

    loginLoading.value = true
    try {
      // 静默登录：wx.login() 获取 code，云函数交换 openid
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        })
      })

      if (!loginRes.code) {
        console.warn('wx.login 未返回 code')
        return
      }

      // 调用 auth 云函数获取 openid 和用户资料
      if (typeof wx.cloud !== 'undefined') {
        try {
          const { result } = await wx.cloud.callFunction({
            name: 'auth',
            data: { action: 'login' }
          })

          if (result?.code === 0 && result.data) {
            openid.value = result.data.openid
            isLoggedIn.value = true

            if (result.data.profile) {
              userInfo.value = {
                nickName: result.data.profile.nickName || '',
                avatarUrl: result.data.profile.avatarUrl || ''
              }
            }

            console.log('Login success, openid:', openid.value)

            // 登录成功后拉取用户数据
            await fetchUserData()
          } else {
            // auth 云函数返回异常，但 wx.login 已成功
            // openid 会在后续云函数调用中自动获取（通过 cloud.getWXContext()）
            console.warn('auth.login 返回异常，使用降级登录:', result)
            isLoggedIn.value = true
            loadOfflineCache()
          }
        } catch (e) {
          // auth 云函数不可用，但其他云函数仍可正常工作
          // 降级：标记已登录，使用本地缓存
          console.warn('auth 云函数调用失败，降级登录:', e)
          isLoggedIn.value = true
          loadOfflineCache()
        }
      } else {
        // 非微信环境，标记已登录（开发模式）
        isLoggedIn.value = true
      }
    } catch (e) {
      console.error('Login failed:', e)
    } finally {
      loginLoading.value = false
    }
  }

  // --- 同步用户资料 ---
  async function updateProfile(nickName, avatarUrl) {
    userInfo.value = { nickName: nickName || '', avatarUrl: avatarUrl || '' }

    if (typeof wx === 'undefined' || !wx.cloud) return
    try {
      await wx.cloud.callFunction({
        name: 'auth',
        data: {
          action: 'syncProfile',
          nickName: userInfo.value.nickName,
          avatarUrl: userInfo.value.avatarUrl
        }
      })
      console.log('Profile synced to cloud')
    } catch (e) {
      console.warn('Profile sync failed:', e)
    }
  }

  // --- 错题操作 ---
  async function addWrongQuestion(questionId, bankId, questionPreview) {
    const existing = wrongQuestions.value.find(w => w.questionId === questionId)
    if (existing) {
      existing.errorCount += 1
      existing.updatedAt = Date.now()
    } else {
      wrongQuestions.value.push({ questionId, bankId, errorCount: 1, questionPreview, addedAt: Date.now(), updatedAt: Date.now() })
    }
    await syncWrongToCloud('add', { questionId, bankId, questionPreview })
  }

  async function removeWrongQuestion(questionId) {
    wrongQuestions.value = wrongQuestions.value.filter(w => w.questionId !== questionId)
    await syncWrongToCloud('remove', { questionId })
  }

  async function clearWrongQuestions(bankId) {
    if (bankId) {
      wrongQuestions.value = wrongQuestions.value.filter(w => w.bankId !== bankId)
    } else {
      wrongQuestions.value = []
    }
    await syncWrongToCloud('clear', { bankId })
  }

  // --- 收藏操作 ---
  async function toggleFavorite(itemId, itemType, preview) {
    const idx = favorites.value.findIndex(f => f.itemId === itemId && f.itemType === itemType)
    if (idx >= 0) {
      favorites.value.splice(idx, 1)
      await syncFavToCloud('remove', { itemId, itemType })
      return false // 已取消收藏
    } else {
      favorites.value.push({ itemId, itemType, preview, addedAt: Date.now() })
      await syncFavToCloud('add', { itemId, itemType, preview })
      return true // 已收藏
    }
  }

  function isFavorited(itemId, itemType) {
    return favorites.value.some(f => f.itemId === itemId && f.itemType === itemType)
  }

  async function batchRemoveFavorites(ids) {
    favorites.value = favorites.value.filter(f => !ids.includes(f.itemId))
    await syncFavToCloud('batchRemove', { ids })
  }

  // --- 进度操作 ---
  function getProgress(bankId) {
    return progress.value[bankId] || { mode: 'sequential', currentIndex: 0, completedCount: 0 }
  }

  async function saveProgress(bankId, data) {
    progress.value[bankId] = { ...getProgress(bankId), ...data, updatedAt: Date.now() }
    await syncProgressToCloud('save', { bankId, ...progress.value[bankId] })
  }

  // --- 云同步（内核 — 网络失败时降级到本地 + 标记 dirty）---
  async function syncWrongToCloud(action, data) {
    if (typeof wx === 'undefined' || !wx.cloud) return
    try {
      await wx.cloud.callFunction({ name: 'syncWrongQuestions', data: { action, ...data } })
    } catch (e) {
      console.warn('错题同步失败，标记为待同步', e)
      syncPending.value = true
      cacheOffline('wrongQuestions', wrongQuestions.value)
    }
  }

  async function syncFavToCloud(action, data) {
    if (typeof wx === 'undefined' || !wx.cloud) return
    try {
      await wx.cloud.callFunction({ name: 'syncFavorites', data: { action, ...data } })
    } catch (e) {
      console.warn('收藏同步失败，标记为待同步', e)
      syncPending.value = true
      cacheOffline('favorites', favorites.value)
    }
  }

  async function syncProgressToCloud(action, data) {
    if (typeof wx === 'undefined' || !wx.cloud) return
    try {
      await wx.cloud.callFunction({ name: 'syncProgress', data: { action, ...data } })
    } catch (e) {
      console.warn('进度同步失败，标记为待同步', e)
      syncPending.value = true
      cacheOffline('progress', progress.value)
    }
  }

  function cacheOffline(key, data) {
    try {
      const cache = uni.getStorageSync('offlineCache') || {}
      cache[key] = data
      cache.lastSyncAt = Date.now()
      uni.setStorageSync('offlineCache', cache)
    } catch (e) { /* ignore */ }
  }

  // --- 从云端拉取用户数据 ---
  async function fetchUserData() {
    if (typeof wx === 'undefined' || !wx.cloud) return
    try {
      const [wrongRes, favRes, progRes] = await Promise.all([
        wx.cloud.callFunction({ name: 'syncWrongQuestions', data: { action: 'list' } }),
        wx.cloud.callFunction({ name: 'syncFavorites', data: { action: 'list' } }),
        wx.cloud.callFunction({ name: 'syncProgress', data: { action: 'get' } })
      ])
      if (wrongRes.result?.code === 0) wrongQuestions.value = wrongRes.result.data || []
      if (favRes.result?.code === 0) favorites.value = favRes.result.data || []
      if (progRes.result?.code === 0) progress.value = progRes.result.data || {}
    } catch (e) {
      console.warn('拉取用户数据失败，使用本地缓存', e)
      loadOfflineCache()
    }
  }

  function loadOfflineCache() {
    try {
      const cache = uni.getStorageSync('offlineCache') || {}
      if (cache.wrongQuestions) wrongQuestions.value = cache.wrongQuestions
      if (cache.favorites) favorites.value = cache.favorites
      if (cache.progress) progress.value = cache.progress
    } catch (e) { /* ignore */ }
  }

  // --- 清空所有数据 ---
  function clearAll() {
    wrongQuestions.value = []
    favorites.value = []
    progress.value = {}
    try { uni.removeStorageSync('offlineCache') } catch (e) { /* ignore */ }
  }

  return {
    // 登录
    openid, isLoggedIn, userInfo, loginLoading,
    login, updateProfile,
    // 业务数据
    wrongQuestions, favorites, progress, syncPending,
    wrongCount, favCount, totalAnswered,
    addWrongQuestion, removeWrongQuestion, clearWrongQuestions,
    toggleFavorite, isFavorited, batchRemoveFavorites,
    getProgress, saveProgress,
    fetchUserData, clearAll
  }
})
