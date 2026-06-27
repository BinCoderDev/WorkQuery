"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_banks = require("../../stores/banks.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = {
  __name: "mode-select",
  setup(__props) {
    const banksStore = stores_banks.useBanksStore();
    const userStore = stores_user.useUserStore();
    const bankId = common_vendor.ref("");
    const bankName = common_vendor.ref("");
    const totalCount = common_vendor.ref(0);
    const progress = common_vendor.ref({ completedCount: 0 });
    common_vendor.onLoad((options) => {
      bankId.value = options.bankId || "";
      const bank = banksStore.getBank(bankId.value);
      if (bank) {
        bankName.value = bank.bankName;
        totalCount.value = bank.totalQuestions;
      }
      progress.value = userStore.getProgress(bankId.value);
    });
    const startStudy = (mode) => {
      common_vendor.index.navigateTo({
        url: `/pages/study/answer?bankId=${bankId.value}&mode=${mode}`
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(bankName.value),
        b: common_vendor.t(totalCount.value),
        c: progress.value.completedCount > 0
      }, progress.value.completedCount > 0 ? {
        d: common_vendor.t(progress.value.completedCount)
      } : {}, {
        e: common_vendor.o(($event) => startStudy("sequential"), "82"),
        f: common_vendor.o(($event) => startStudy("random"), "77"),
        g: progress.value.completedCount > 0 && progress.value.completedCount >= totalCount.value
      }, progress.value.completedCount > 0 && progress.value.completedCount >= totalCount.value ? {} : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-fbad3b57"]]);
wx.createPage(MiniProgramPage);
