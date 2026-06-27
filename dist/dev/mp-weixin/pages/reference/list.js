"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "list",
  setup(__props) {
    const categoryId = common_vendor.ref("");
    const sortBy = common_vendor.ref("usageFrequency");
    const groups = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    common_vendor.onLoad((options) => {
      categoryId.value = options.categoryId || "";
      fetch();
    });
    async function sort(field) {
      sortBy.value = field;
      fetch();
    }
    async function fetch() {
      var _a;
      loading.value = true;
      try {
        if (typeof common_vendor.wx$1 !== "undefined" && common_vendor.wx$1.cloud) {
          const res = await common_vendor.wx$1.cloud.callFunction({ name: "getKnowledgeItems", data: { categoryId: categoryId.value, sortBy: sortBy.value } });
          if (((_a = res.result) == null ? void 0 : _a.code) === 0)
            groups.value = res.result.data || [];
        } else {
          groups.value = [{ group: "查找与引用", items: [{ knowledgeId: "k1", title: "VLOOKUP", definition: "垂直查找函数" }] }];
        }
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }
    const goDetail = (item) => common_vendor.index.navigateTo({ url: `/pages/reference/detail?knowledgeId=${item.knowledgeId}` });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: sortBy.value === "usageFrequency" ? 1 : "",
        b: common_vendor.o(($event) => sort("usageFrequency"), "b6"),
        c: sortBy.value === "title" ? 1 : "",
        d: common_vendor.o(($event) => sort("title"), "8b"),
        e: loading.value
      }, loading.value ? {} : groups.value.length === 0 ? {} : {}, {
        f: groups.value.length === 0,
        g: common_vendor.f(groups.value, (grp, k0, i0) => {
          return {
            a: common_vendor.t(grp.group),
            b: common_vendor.f(grp.items, (item, k1, i1) => {
              return {
                a: common_vendor.t(item.title),
                b: common_vendor.t(item.definition ? item.definition.substring(0, 60) + "…" : ""),
                c: item.knowledgeId,
                d: common_vendor.o(($event) => goDetail(item), item.knowledgeId)
              };
            }),
            c: grp.group
          };
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-2f117fcf"]]);
wx.createPage(MiniProgramPage);
