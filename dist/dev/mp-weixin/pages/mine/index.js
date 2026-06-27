"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_user = require("../../stores/user.js");
const stores_settings = require("../../stores/settings.js");
const stores_theme = require("../../stores/theme.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const settingsStore = stores_settings.useSettingsStore();
    const { setDark } = stores_theme.useTheme();
    const darkMode = common_vendor.ref("auto");
    common_vendor.onMounted(() => {
      darkMode.value = settingsStore.darkMode;
    });
    function switchDark(mode) {
      darkMode.value = mode;
      setDark(mode);
    }
    function onChooseAvatar(e) {
      var _a;
      const avatarUrl = (_a = e.detail) == null ? void 0 : _a.avatarUrl;
      if (avatarUrl) {
        userStore.updateProfile(userStore.userInfo.nickName, avatarUrl);
        common_vendor.index.showToast({ title: "头像已更新", icon: "success" });
      }
    }
    function onNicknameInput(e) {
      var _a;
      const nickName = (_a = e.detail) == null ? void 0 : _a.value;
      if (nickName && nickName.trim()) {
        userStore.updateProfile(nickName.trim(), userStore.userInfo.avatarUrl);
      }
    }
    function onNicknameBlur(e) {
      var _a;
      const nickName = (_a = e.detail) == null ? void 0 : _a.value;
      if (nickName && nickName.trim()) {
        userStore.updateProfile(nickName.trim(), userStore.userInfo.avatarUrl);
      }
    }
    function goLogin() {
      common_vendor.index.reLaunch({ url: "/pages/index/index" });
    }
    const goWrong = () => common_vendor.index.navigateTo({ url: "/pages/mine/wrong-questions" });
    const goFavorites = () => common_vendor.index.navigateTo({ url: "/pages/mine/favorites" });
    const showAbout = () => common_vendor.index.showToast({ title: "WorkQuery v1.0.0", icon: "none" });
    function clearData() {
      common_vendor.index.showModal({
        title: "确认清空",
        content: "清空后所有刷题进度、错题、收藏将被永久清除，不可恢复。确认清空？",
        success: async (res) => {
          if (res.confirm) {
            try {
              common_vendor.index.clearStorageSync();
              userStore.clearAll();
              common_vendor.index.showToast({ title: "已清空", icon: "success" });
            } catch (e) {
              common_vendor.index.showToast({ title: "清空失败", icon: "error" });
            }
          }
        }
      });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(userStore).isLoggedIn
      }, common_vendor.unref(userStore).isLoggedIn ? common_vendor.e({
        b: common_vendor.unref(userStore).userInfo.avatarUrl
      }, common_vendor.unref(userStore).userInfo.avatarUrl ? {
        c: common_vendor.unref(userStore).userInfo.avatarUrl
      } : {}, {
        d: common_vendor.o(onChooseAvatar, "82"),
        e: common_vendor.unref(userStore).userInfo.nickName,
        f: common_vendor.o(onNicknameInput, "99"),
        g: common_vendor.o(onNicknameBlur, "c3")
      }) : {
        h: common_vendor.o(goLogin, "fa")
      }, {
        i: common_vendor.t(common_vendor.unref(userStore).totalAnswered),
        j: common_vendor.t(common_vendor.unref(userStore).wrongCount),
        k: common_vendor.t(common_vendor.unref(userStore).favCount),
        l: common_vendor.t(common_vendor.unref(userStore).wrongCount),
        m: common_vendor.o(goWrong, "f0"),
        n: common_vendor.t(common_vendor.unref(userStore).favCount),
        o: common_vendor.o(goFavorites, "b3"),
        p: darkMode.value === "auto" ? 1 : "",
        q: common_vendor.o(($event) => switchDark("auto"), "18"),
        r: darkMode.value === "light" ? 1 : "",
        s: common_vendor.o(($event) => switchDark("light"), "53"),
        t: darkMode.value === "dark" ? 1 : "",
        v: common_vendor.o(($event) => switchDark("dark"), "28"),
        w: common_vendor.unref(settingsStore).adEnabled,
        x: common_vendor.o(($event) => common_vendor.unref(settingsStore).setAdEnabled($event.detail.value), "80"),
        y: common_vendor.o(clearData, "d2"),
        z: common_vendor.o(showAbout, "e0"),
        A: common_vendor.unref(settingsStore).adEnabled
      }, common_vendor.unref(settingsStore).adEnabled ? {} : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-9023ef44"]]);
wx.createPage(MiniProgramPage);
