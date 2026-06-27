"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = {
  __name: "favorites",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const filter = common_vendor.ref("all");
    const manageMode = common_vendor.ref(false);
    const selectedIds = common_vendor.ref([]);
    common_vendor.onMounted(() => userStore.fetchUserData());
    const filteredList = common_vendor.computed(() => {
      if (filter.value === "all")
        return userStore.favorites;
      return userStore.favorites.filter((f) => f.itemType === filter.value);
    });
    function toggleSelect(id) {
      const idx = selectedIds.value.indexOf(id);
      if (idx >= 0)
        selectedIds.value.splice(idx, 1);
      else
        selectedIds.value.push(id);
    }
    function goItem(f) {
      if (f.itemType === "knowledge")
        common_vendor.index.navigateTo({ url: `/pages/reference/detail?knowledgeId=${f.itemId}` });
      else
        common_vendor.index.navigateTo({ url: `/pages/study/answer?mode=wrongReview&bankId=excel` });
    }
    async function removeOne(item) {
      await userStore.toggleFavorite(item.itemId, item.itemType, item.preview);
      common_vendor.index.showToast({ title: "已取消", icon: "none" });
    }
    async function batchRemove() {
      common_vendor.index.showModal({
        title: "确认取消",
        content: `取消 ${selectedIds.value.length} 项收藏？`,
        success: async (res) => {
          if (res.confirm) {
            await userStore.batchRemoveFavorites(selectedIds.value);
            selectedIds.value = [];
            manageMode.value = false;
            common_vendor.index.showToast({ title: "已取消", icon: "success" });
          }
        }
      });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: filter.value === "all" ? 1 : "",
        b: common_vendor.o(($event) => filter.value = "all", "c6"),
        c: filter.value === "question" ? 1 : "",
        d: common_vendor.o(($event) => filter.value = "question", "31"),
        e: filter.value === "knowledge" ? 1 : "",
        f: common_vendor.o(($event) => filter.value = "knowledge", "29"),
        g: common_vendor.t(manageMode.value ? "完成" : "管理"),
        h: common_vendor.o(($event) => manageMode.value = !manageMode.value, "9e"),
        i: filteredList.value.length === 0
      }, filteredList.value.length === 0 ? {} : {}, {
        j: common_vendor.f(filteredList.value, (item, k0, i0) => {
          return common_vendor.e(manageMode.value ? {
            a: common_vendor.t(selectedIds.value.includes(item.itemId) ? "☑" : "☐"),
            b: common_vendor.n(selectedIds.value.includes(item.itemId) ? "checked" : "")
          } : {}, {
            c: common_vendor.t(item.itemType === "question" ? "题目" : "知识点"),
            d: common_vendor.n(item.itemType),
            e: common_vendor.t(item.preview || item.itemId)
          }, !manageMode.value ? {
            f: common_vendor.o(($event) => removeOne(item), `${item.itemType}_${item.itemId}`)
          } : {}, {
            g: `${item.itemType}_${item.itemId}`,
            h: common_vendor.o(($event) => manageMode.value ? toggleSelect(item.itemId) : goItem(item), `${item.itemType}_${item.itemId}`)
          });
        }),
        k: manageMode.value,
        l: !manageMode.value,
        m: manageMode.value && selectedIds.value.length > 0
      }, manageMode.value && selectedIds.value.length > 0 ? {
        n: common_vendor.t(selectedIds.value.length),
        o: common_vendor.o(batchRemove, "a5")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ba0ad4ce"]]);
wx.createPage(MiniProgramPage);
