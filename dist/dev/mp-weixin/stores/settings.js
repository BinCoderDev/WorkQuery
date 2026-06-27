"use strict";
const common_vendor = require("../common/vendor.js");
const useSettingsStore = common_vendor.defineStore("settings", () => {
  const darkMode = common_vendor.ref("auto");
  const adEnabled = common_vendor.ref(true);
  function loadFromStorage() {
    try {
      const saved = common_vendor.index.getStorageSync("settings");
      if (saved) {
        if (saved.darkMode)
          darkMode.value = saved.darkMode;
        if (saved.adEnabled !== void 0)
          adEnabled.value = saved.adEnabled;
      }
    } catch (e) {
      console.warn("读取设置失败，使用默认值");
    }
  }
  function persist() {
    common_vendor.index.setStorageSync("settings", {
      darkMode: darkMode.value,
      adEnabled: adEnabled.value
    });
  }
  common_vendor.watch([darkMode, adEnabled], persist, { deep: false });
  function getEffectiveTheme() {
    if (darkMode.value === "auto") {
      try {
        const sysInfo = common_vendor.index.getSystemInfoSync();
        return sysInfo.theme || "light";
      } catch (e) {
        return "light";
      }
    }
    return darkMode.value;
  }
  function setDarkMode(mode) {
    darkMode.value = mode;
  }
  function setAdEnabled(enabled) {
    adEnabled.value = enabled;
  }
  loadFromStorage();
  return {
    darkMode,
    adEnabled,
    loadFromStorage,
    getEffectiveTheme,
    setDarkMode,
    setAdEnabled
  };
});
exports.useSettingsStore = useSettingsStore;
