"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_banks = require("../../stores/banks.js");
const stores_user = require("../../stores/user.js");
const stores_settings = require("../../stores/settings.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const banksStore = stores_banks.useBanksStore();
    const userStore = stores_user.useUserStore();
    const settingsStore = stores_settings.useSettingsStore();
    common_vendor.onMounted(() => {
      fetchBanks();
    });
    async function fetchBanks() {
      await banksStore.fetchBanks();
    }
    function getProgress(bankId) {
      return userStore.getProgress(bankId);
    }
    function progressPercent(bankId) {
      const bank = banksStore.getBank(bankId);
      if (!bank || bank.totalQuestions === 0)
        return 0;
      return Math.min(100, Math.round(getProgress(bankId).completedCount / bank.totalQuestions * 100));
    }
    function goBank(bank) {
      if (!bank.isActive || bank.totalQuestions === 0) {
        common_vendor.index.showToast({ title: "题目正在准备中", icon: "none" });
        return;
      }
      common_vendor.index.navigateTo({ url: `/pages/study/mode-select?bankId=${bank.bankId}` });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(banksStore).loading && common_vendor.unref(banksStore).banks.length === 0
      }, common_vendor.unref(banksStore).loading && common_vendor.unref(banksStore).banks.length === 0 ? {
        b: common_vendor.f(2, (i, k0, i0) => {
          return {
            a: i
          };
        })
      } : common_vendor.unref(banksStore).error && common_vendor.unref(banksStore).banks.length === 0 ? {
        d: common_vendor.t(common_vendor.unref(banksStore).error),
        e: common_vendor.o(fetchBanks, "b0")
      } : {
        f: common_vendor.f(common_vendor.unref(banksStore).banks, (bank, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(bank.bankIcon),
            b: common_vendor.t(bank.bankName),
            c: common_vendor.t(bank.totalQuestions),
            d: common_vendor.t(bank.bankDescription),
            e: getProgress(bank.bankId).completedCount > 0
          }, getProgress(bank.bankId).completedCount > 0 ? {
            f: progressPercent(bank.bankId) + "%"
          } : {}, {
            g: getProgress(bank.bankId).completedCount > 0
          }, getProgress(bank.bankId).completedCount > 0 ? {
            h: common_vendor.t(getProgress(bank.bankId).completedCount),
            i: common_vendor.t(bank.totalQuestions)
          } : {}, {
            j: bank.bankId,
            k: !bank.isActive || bank.totalQuestions === 0 ? 1 : "",
            l: common_vendor.o(($event) => goBank(bank), bank.bankId)
          });
        })
      }, {
        c: common_vendor.unref(banksStore).error && common_vendor.unref(banksStore).banks.length === 0,
        g: common_vendor.unref(settingsStore).adEnabled
      }, common_vendor.unref(settingsStore).adEnabled ? {} : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f1e3db7f"]]);
wx.createPage(MiniProgramPage);
