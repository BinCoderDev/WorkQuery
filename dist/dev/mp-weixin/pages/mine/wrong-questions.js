"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = {
  __name: "wrong-questions",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const filter = common_vendor.ref("all");
    common_vendor.onMounted(() => userStore.fetchUserData());
    const bankList = common_vendor.computed(() => [...new Set(userStore.wrongQuestions.map((w) => w.bankId))]);
    const filteredList = common_vendor.computed(() => {
      if (filter.value === "all")
        return userStore.wrongQuestions;
      return userStore.wrongQuestions.filter((w) => w.bankId === filter.value);
    });
    function bankLabel(b) {
      return b === "excel" ? "Excel" : b === "python" ? "Python" : b;
    }
    async function clearAll() {
      common_vendor.index.showModal({
        title: "清空错题本",
        content: filter.value === "all" ? "确认清空全部错题？" : `确认清空 ${bankLabel(filter.value)} 错题？`,
        success: async (res) => {
          if (res.confirm) {
            await userStore.clearWrongQuestions(filter.value === "all" ? null : filter.value);
            common_vendor.index.showToast({ title: "已清空", icon: "success" });
          }
        }
      });
    }
    function redoWrong(item) {
      common_vendor.index.navigateTo({ url: `/pages/study/answer?mode=wrongReview&bankId=${item.bankId}` });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: filter.value === "all" ? 1 : "",
        b: common_vendor.o(($event) => filter.value = "all", "c6"),
        c: common_vendor.f(bankList.value, (b, k0, i0) => {
          return {
            a: common_vendor.t(bankLabel(b)),
            b,
            c: filter.value === b ? 1 : "",
            d: common_vendor.o(($event) => filter.value = b, b)
          };
        }),
        d: common_vendor.o(clearAll, "c9"),
        e: filteredList.value.length === 0
      }, filteredList.value.length === 0 ? {} : {}, {
        f: common_vendor.f(filteredList.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.questionPreview),
            b: common_vendor.t(item.errorCount),
            c: item.questionId,
            d: common_vendor.o(($event) => redoWrong(item), item.questionId)
          };
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-dafb905f"]]);
wx.createPage(MiniProgramPage);
