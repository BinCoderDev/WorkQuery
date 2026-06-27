"use strict";
const common_vendor = require("../common/vendor.js");
const useUserStore = common_vendor.defineStore("user", () => {
  const openid = common_vendor.ref("");
  const isLoggedIn = common_vendor.ref(false);
  const userInfo = common_vendor.ref({ nickName: "", avatarUrl: "" });
  const loginLoading = common_vendor.ref(false);
  const wrongQuestions = common_vendor.ref([]);
  const favorites = common_vendor.ref([]);
  const progress = common_vendor.ref({});
  const syncPending = common_vendor.ref(false);
  const wrongCount = common_vendor.computed(() => wrongQuestions.value.length);
  const favCount = common_vendor.computed(() => favorites.value.length);
  const totalAnswered = common_vendor.computed(() => {
    return Object.values(progress.value).reduce((sum, p) => sum + (p.completedCount || 0), 0);
  });
  async function login() {
    if (typeof common_vendor.wx$1 === "undefined")
      return;
    loginLoading.value = true;
    try {
      const loginRes = await new Promise((resolve, reject) => {
        common_vendor.wx$1.login({
          success: resolve,
          fail: reject
        });
      });
      if (!loginRes.code) {
        console.warn("wx.login 未返回 code");
        return;
      }
      if (typeof common_vendor.wx$1.cloud !== "undefined") {
        try {
          const { result } = await common_vendor.wx$1.cloud.callFunction({
            name: "auth",
            data: { action: "login" }
          });
          if ((result == null ? void 0 : result.code) === 0 && result.data) {
            openid.value = result.data.openid;
            isLoggedIn.value = true;
            if (result.data.profile) {
              userInfo.value = {
                nickName: result.data.profile.nickName || "",
                avatarUrl: result.data.profile.avatarUrl || ""
              };
            }
            console.log("Login success, openid:", openid.value);
            await fetchUserData();
          } else {
            console.warn("auth.login 返回异常，使用降级登录:", result);
            isLoggedIn.value = true;
            loadOfflineCache();
          }
        } catch (e) {
          console.warn("auth 云函数调用失败，降级登录:", e);
          isLoggedIn.value = true;
          loadOfflineCache();
        }
      } else {
        isLoggedIn.value = true;
      }
    } catch (e) {
      console.error("Login failed:", e);
    } finally {
      loginLoading.value = false;
    }
  }
  async function updateProfile(nickName, avatarUrl) {
    userInfo.value = { nickName: nickName || "", avatarUrl: avatarUrl || "" };
    if (typeof common_vendor.wx$1 === "undefined" || !common_vendor.wx$1.cloud)
      return;
    try {
      await common_vendor.wx$1.cloud.callFunction({
        name: "auth",
        data: {
          action: "syncProfile",
          nickName: userInfo.value.nickName,
          avatarUrl: userInfo.value.avatarUrl
        }
      });
      console.log("Profile synced to cloud");
    } catch (e) {
      console.warn("Profile sync failed:", e);
    }
  }
  async function addWrongQuestion(questionId, bankId, questionPreview) {
    const existing = wrongQuestions.value.find((w) => w.questionId === questionId);
    if (existing) {
      existing.errorCount += 1;
      existing.updatedAt = Date.now();
    } else {
      wrongQuestions.value.push({ questionId, bankId, errorCount: 1, questionPreview, addedAt: Date.now(), updatedAt: Date.now() });
    }
    await syncWrongToCloud("add", { questionId, bankId, questionPreview });
  }
  async function removeWrongQuestion(questionId) {
    wrongQuestions.value = wrongQuestions.value.filter((w) => w.questionId !== questionId);
    await syncWrongToCloud("remove", { questionId });
  }
  async function clearWrongQuestions(bankId) {
    if (bankId) {
      wrongQuestions.value = wrongQuestions.value.filter((w) => w.bankId !== bankId);
    } else {
      wrongQuestions.value = [];
    }
    await syncWrongToCloud("clear", { bankId });
  }
  async function toggleFavorite(itemId, itemType, preview) {
    const idx = favorites.value.findIndex((f) => f.itemId === itemId && f.itemType === itemType);
    if (idx >= 0) {
      favorites.value.splice(idx, 1);
      await syncFavToCloud("remove", { itemId, itemType });
      return false;
    } else {
      favorites.value.push({ itemId, itemType, preview, addedAt: Date.now() });
      await syncFavToCloud("add", { itemId, itemType, preview });
      return true;
    }
  }
  function isFavorited(itemId, itemType) {
    return favorites.value.some((f) => f.itemId === itemId && f.itemType === itemType);
  }
  async function batchRemoveFavorites(ids) {
    favorites.value = favorites.value.filter((f) => !ids.includes(f.itemId));
    await syncFavToCloud("batchRemove", { ids });
  }
  function getProgress(bankId) {
    return progress.value[bankId] || { mode: "sequential", currentIndex: 0, completedCount: 0 };
  }
  async function saveProgress(bankId, data) {
    progress.value[bankId] = { ...getProgress(bankId), ...data, updatedAt: Date.now() };
    await syncProgressToCloud("save", { bankId, ...progress.value[bankId] });
  }
  async function syncWrongToCloud(action, data) {
    if (typeof common_vendor.wx$1 === "undefined" || !common_vendor.wx$1.cloud)
      return;
    try {
      await common_vendor.wx$1.cloud.callFunction({ name: "syncWrongQuestions", data: { action, ...data } });
    } catch (e) {
      console.warn("错题同步失败，标记为待同步", e);
      syncPending.value = true;
      cacheOffline("wrongQuestions", wrongQuestions.value);
    }
  }
  async function syncFavToCloud(action, data) {
    if (typeof common_vendor.wx$1 === "undefined" || !common_vendor.wx$1.cloud)
      return;
    try {
      await common_vendor.wx$1.cloud.callFunction({ name: "syncFavorites", data: { action, ...data } });
    } catch (e) {
      console.warn("收藏同步失败，标记为待同步", e);
      syncPending.value = true;
      cacheOffline("favorites", favorites.value);
    }
  }
  async function syncProgressToCloud(action, data) {
    if (typeof common_vendor.wx$1 === "undefined" || !common_vendor.wx$1.cloud)
      return;
    try {
      await common_vendor.wx$1.cloud.callFunction({ name: "syncProgress", data: { action, ...data } });
    } catch (e) {
      console.warn("进度同步失败，标记为待同步", e);
      syncPending.value = true;
      cacheOffline("progress", progress.value);
    }
  }
  function cacheOffline(key, data) {
    try {
      const cache = common_vendor.index.getStorageSync("offlineCache") || {};
      cache[key] = data;
      cache.lastSyncAt = Date.now();
      common_vendor.index.setStorageSync("offlineCache", cache);
    } catch (e) {
    }
  }
  async function fetchUserData() {
    var _a, _b, _c;
    if (typeof common_vendor.wx$1 === "undefined" || !common_vendor.wx$1.cloud)
      return;
    try {
      const [wrongRes, favRes, progRes] = await Promise.all([
        common_vendor.wx$1.cloud.callFunction({ name: "syncWrongQuestions", data: { action: "list" } }),
        common_vendor.wx$1.cloud.callFunction({ name: "syncFavorites", data: { action: "list" } }),
        common_vendor.wx$1.cloud.callFunction({ name: "syncProgress", data: { action: "get" } })
      ]);
      if (((_a = wrongRes.result) == null ? void 0 : _a.code) === 0)
        wrongQuestions.value = wrongRes.result.data || [];
      if (((_b = favRes.result) == null ? void 0 : _b.code) === 0)
        favorites.value = favRes.result.data || [];
      if (((_c = progRes.result) == null ? void 0 : _c.code) === 0)
        progress.value = progRes.result.data || {};
    } catch (e) {
      console.warn("拉取用户数据失败，使用本地缓存", e);
      loadOfflineCache();
    }
  }
  function loadOfflineCache() {
    try {
      const cache = common_vendor.index.getStorageSync("offlineCache") || {};
      if (cache.wrongQuestions)
        wrongQuestions.value = cache.wrongQuestions;
      if (cache.favorites)
        favorites.value = cache.favorites;
      if (cache.progress)
        progress.value = cache.progress;
    } catch (e) {
    }
  }
  function clearAll() {
    wrongQuestions.value = [];
    favorites.value = [];
    progress.value = {};
    try {
      common_vendor.index.removeStorageSync("offlineCache");
    } catch (e) {
    }
  }
  return {
    // 登录
    openid,
    isLoggedIn,
    userInfo,
    loginLoading,
    login,
    updateProfile,
    // 业务数据
    wrongQuestions,
    favorites,
    progress,
    syncPending,
    wrongCount,
    favCount,
    totalAnswered,
    addWrongQuestion,
    removeWrongQuestion,
    clearWrongQuestions,
    toggleFavorite,
    isFavorited,
    batchRemoveFavorites,
    getProgress,
    saveProgress,
    fetchUserData,
    clearAll
  };
});
exports.useUserStore = useUserStore;
