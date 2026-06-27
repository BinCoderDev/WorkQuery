import { defineStore } from 'pinia'
import { ref } from 'vue'

// 带超时的云函数调用
function callCloud(name, data = {}, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('云函数超时')), timeout)
    wx.cloud.callFunction({ name, data }).then(res => {
      clearTimeout(timer)
      resolve(res)
    }).catch(err => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

// 模拟数据
const MOCK_BANKS = [
  { bankId: 'excel', bankName: 'Excel函数题库', bankIcon: '📊', bankDescription: '覆盖VLOOKUP、IF、SUMIF等常用函数与数据处理技巧', totalQuestions: 30, order: 1, isActive: true },
  { bankId: 'python', bankName: 'Python基础题库', bankIcon: '🐍', bankDescription: '覆盖基础语法、数据类型、常用方法等入门知识点', totalQuestions: 30, order: 2, isActive: true }
]

export const useBanksStore = defineStore('banks', () => {
  const banks = ref([])
  const loading = ref(false)
  const error = ref('')
  const lastFetchAt = ref(0)
  let cloudReady = false

  function ensureCloud() {
    if (!cloudReady && typeof wx !== 'undefined' && wx.cloud) {
      try { wx.cloud.init({ env: 'cloud1-d2gbvh9lgc51d1733', traceUser: true }) } catch (e) {}
      cloudReady = true
    }
  }

  async function fetchBanks() {
    if (Date.now() - lastFetchAt.value < 30000 && banks.value.length > 0) {
      return banks.value
    }

    loading.value = true
    error.value = ''
    ensureCloud()

    // 先尝试云函数，5秒超时 → 失败则用模拟数据
    try {
      if (typeof wx !== 'undefined' && wx.cloud) {
        const res = await callCloud('getBanks', {}, 5000)
        if (res.result && res.result.code === 0 && res.result.data && res.result.data.length > 0) {
          banks.value = res.result.data
          lastFetchAt.value = Date.now()
          loading.value = false
          return banks.value
        }
      }
    } catch (e) {
      console.warn('云函数 getBanks 不可用，使用模拟数据:', e.message)
    }

    // 降级：使用模拟数据
    banks.value = MOCK_BANKS
    lastFetchAt.value = Date.now()
    loading.value = false
    return banks.value
  }

  function getBank(bankId) {
    return banks.value.find(b => b.bankId === bankId) || null
  }

  return { banks, loading, error, fetchBanks, getBank }
})
