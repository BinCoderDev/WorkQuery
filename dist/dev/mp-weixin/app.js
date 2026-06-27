"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const stores_user = require("./stores/user.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/banks/index.js";
  "./pages/study/mode-select.js";
  "./pages/study/answer.js";
  "./pages/reference/index.js";
  "./pages/reference/list.js";
  "./pages/reference/detail.js";
  "./pages/reference/search.js";
  "./pages/mine/index.js";
  "./pages/mine/wrong-questions.js";
  "./pages/mine/favorites.js";
}
const _sfc_main = {
  globalData: { theme: "light", openid: "", isLoggedIn: false },
  async onLaunch() {
    console.log("WorkQuery App Launch");
    this.initCloud();
    this.applySavedTheme();
    const hasAuth = common_vendor.index.getStorageSync("auth_completed");
    if (hasAuth) {
      const userStore = stores_user.useUserStore();
      await userStore.login();
      this.globalData.openid = userStore.openid;
      this.globalData.isLoggedIn = userStore.isLoggedIn;
    } else {
      this.globalData.needAuth = true;
    }
    if (typeof common_vendor.wx$1 !== "undefined" && common_vendor.wx$1.onThemeChange) {
      common_vendor.wx$1.onThemeChange((res) => {
        const settings = common_vendor.index.getStorageSync("settings") || {};
        if (settings.darkMode === "auto") {
          this.switchTheme(res.theme);
        }
      });
    }
  },
  onShow() {
    this.applySavedTheme();
    if (this.globalData.needAuth) {
      this.globalData.needAuth = false;
      common_vendor.index.reLaunch({ url: "/pages/index/index" });
    }
  },
  methods: {
    initCloud() {
      try {
        if (typeof common_vendor.wx$1 !== "undefined" && common_vendor.wx$1.cloud) {
          const envId = "cloud1-d2gbvh9lgc51d1733";
          common_vendor.wx$1.cloud.init({
            env: envId,
            traceUser: true
          });
          console.log("Cloud environment initialized, env:", envId);
        }
      } catch (e) {
        console.error("Cloud init failed:", e);
      }
    },
    applySavedTheme() {
      try {
        const settings = common_vendor.index.getStorageSync("settings") || {};
        const mode = settings.darkMode || "auto";
        let theme = "light";
        if (mode === "dark")
          theme = "dark";
        else if (mode === "auto") {
          try {
            const sys = common_vendor.index.getSystemInfoSync();
            theme = sys.theme || "light";
          } catch (e) {
          }
        }
        this.switchTheme(theme);
      } catch (e) {
      }
    },
    switchTheme(theme) {
      this.globalData.theme = theme;
      const isDark = theme === "dark";
      common_vendor.index.setNavigationBarColor({
        frontColor: isDark ? "#ffffff" : "#000000",
        backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF"
      });
      common_vendor.index.setBackgroundColor({
        backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
        backgroundColorTop: isDark ? "#1A1A1A" : "#F5F5F5",
        backgroundColorBottom: isDark ? "#1A1A1A" : "#F5F5F5"
      });
      try {
        common_vendor.wx$1.setPageStyle({
          style: isDark ? "--bg-primary:#1A1A1A;--bg-card:#2C2C2C;--text-primary:#E5E5E5;--text-secondary:#AAAAAA;--text-hint:#777777;--border-color:#3A3A3A;--shadow-sm:0 2rpx 8rpx rgba(0,0,0,0.3);--shadow-md:0 4rpx 16rpx rgba(0,0,0,0.4);" : "--bg-primary:#F5F5F5;--bg-card:#FFFFFF;--text-primary:#1A1A1A;--text-secondary:#666666;--text-hint:#999999;--border-color:#E5E5E5;--shadow-sm:0 2rpx 8rpx rgba(0,0,0,0.06);--shadow-md:0 4rpx 16rpx rgba(0,0,0,0.1);"
        });
      } catch (e) {
        console.warn("setPageStyle not supported in this WeChat version");
      }
    }
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  const pinia = common_vendor.createPinia();
  app.use(pinia);
  return { app, pinia };
}
createApp().app.mount("#app");
exports.createApp = createApp;
