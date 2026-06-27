"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const categories = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const error = common_vendor.ref("");
    common_vendor.onMounted(() => fetch());
    async function fetch() {
      var _a;
      loading.value = true;
      error.value = "";
      try {
        if (typeof common_vendor.wx$1 !== "undefined" && common_vendor.wx$1.cloud) {
          const res = await common_vendor.wx$1.cloud.callFunction({ name: "getKnowledgeCategories" });
          if (((_a = res.result) == null ? void 0 : _a.code) === 0)
            categories.value = res.result.data || [];
        } else {
          categories.value = [
            { categoryId: "excel", categoryName: "Excel函数", count: 45 },
            { categoryId: "python", categoryName: "Python基础", count: 40 }
          ];
        }
      } catch (e) {
        error.value = e.message || "加载失败";
      } finally {
        loading.value = false;
      }
    }
    const goSearch = () => common_vendor.index.navigateTo({ url: "/pages/reference/search" });
    const goList = (cat) => common_vendor.index.navigateTo({ url: `/pages/reference/list?categoryId=${cat.categoryId}` });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(goSearch, "3f"),
        b: loading.value
      }, loading.value ? {} : error.value ? {
        d: common_vendor.t(error.value),
        e: common_vendor.o(fetch, "8a")
      } : {}, {
        c: error.value,
        f: common_vendor.f(categories.value, (cat, k0, i0) => {
          return {
            a: common_vendor.t(cat.icon || "📘"),
            b: common_vendor.t(cat.categoryName),
            c: common_vendor.t(cat.count || 0),
            d: cat.categoryId,
            e: common_vendor.o(($event) => goList(cat), cat.categoryId)
          };
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1c341d8b"]]);
wx.createPage(MiniProgramPage);
