"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const authStep = common_vendor.ref(0);
    const loggingIn = common_vendor.ref(false);
    const tempAvatar = common_vendor.ref("");
    const tempNickName = common_vendor.ref("");
    async function handleLogin() {
      loggingIn.value = true;
      try {
        await userStore.login();
        if (userStore.isLoggedIn) {
          authStep.value = 1;
          if (userStore.userInfo.avatarUrl) {
            tempAvatar.value = userStore.userInfo.avatarUrl;
          }
          if (userStore.userInfo.nickName) {
            tempNickName.value = userStore.userInfo.nickName;
          }
        } else {
          common_vendor.index.showToast({ title: "登录失败，请重试", icon: "error" });
        }
      } catch (e) {
        console.error("Login error:", e);
        common_vendor.index.showToast({ title: "登录失败，请重试", icon: "error" });
      } finally {
        loggingIn.value = false;
      }
    }
    function onChooseAvatar(e) {
      var _a;
      const url = (_a = e.detail) == null ? void 0 : _a.avatarUrl;
      if (url) {
        tempAvatar.value = url;
      }
    }
    function onNicknameInput(e) {
      var _a;
      const val = (_a = e.detail) == null ? void 0 : _a.value;
      if (val !== void 0) {
        tempNickName.value = val;
      }
    }
    function onNicknameConfirm(e) {
      var _a;
      const val = (_a = e.detail) == null ? void 0 : _a.value;
      if (val) {
        tempNickName.value = val;
      }
    }
    async function handleEnterApp() {
      if (tempAvatar.value || tempNickName.value) {
        await userStore.updateProfile(tempNickName.value, tempAvatar.value);
      }
      common_vendor.index.setStorageSync("auth_completed", true);
      authStep.value = 2;
      setTimeout(() => {
        common_vendor.index.switchTab({ url: "/pages/banks/index" });
      }, 800);
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: authStep.value === 0
      }, authStep.value === 0 ? {
        b: common_vendor.o(handleLogin, "f2"),
        c: loggingIn.value
      } : {}, {
        d: authStep.value === 1
      }, authStep.value === 1 ? common_vendor.e({
        e: tempAvatar.value
      }, tempAvatar.value ? {
        f: tempAvatar.value
      } : {}, {
        g: common_vendor.o(onChooseAvatar, "e0"),
        h: tempNickName.value,
        i: common_vendor.o(onNicknameInput, "54"),
        j: common_vendor.o(onNicknameConfirm, "c7"),
        k: common_vendor.o(handleEnterApp, "eb"),
        l: common_vendor.o(handleEnterApp, "22")
      }) : {}, {
        m: authStep.value === 2
      }, authStep.value === 2 ? {} : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-83a5a03c"]]);
wx.createPage(MiniProgramPage);
