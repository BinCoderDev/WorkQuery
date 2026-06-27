"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "search",
  setup(__props) {
    const keyword = common_vendor.ref("");
    const results = common_vendor.ref([]);
    const searching = common_vendor.ref(false);
    let timer = null;
    function onSearch() {
      clearTimeout(timer);
      if (!keyword.value.trim()) {
        results.value = [];
        return;
      }
      timer = setTimeout(fetchResults, 300);
    }
    async function fetchResults() {
      var _a;
      searching.value = true;
      try {
        if (typeof common_vendor.wx$1 !== "undefined" && common_vendor.wx$1.cloud) {
          const res = await common_vendor.wx$1.cloud.callFunction({ name: "search", data: { keyword: keyword.value, limit: 20 } });
          if (((_a = res.result) == null ? void 0 : _a.code) === 0)
            results.value = res.result.data || [];
        } else {
          results.value = [{ type: "knowledge", id: "k1", title: "VLOOKUP 函数", preview: "垂直查找函数" }].filter((r) => r.title.includes(keyword.value));
        }
      } catch (e) {
        console.error(e);
      } finally {
        searching.value = false;
      }
    }
    function highlight(text) {
      if (!keyword.value || !text)
        return text;
      const escaped = keyword.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return text.replace(new RegExp(`(${escaped})`, "gi"), '<span style="color:#007AFF;font-weight:600;">$1</span>');
    }
    function clear() {
      keyword.value = "";
      results.value = [];
    }
    function goItem(r) {
      if (r.type === "knowledge") {
        common_vendor.index.navigateTo({ url: `/pages/reference/detail?knowledgeId=${r.id}` });
      } else {
        const bankId = r.id.split("_")[0];
        common_vendor.index.navigateTo({ url: `/pages/study/answer?mode=related&bankId=${bankId}&questionIds=${r.id}` });
      }
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o([($event) => keyword.value = $event.detail.value, onSearch], "bf"),
        b: keyword.value,
        c: keyword.value
      }, keyword.value ? {
        d: common_vendor.o(clear, "bc")
      } : {}, {
        e: searching.value
      }, searching.value ? {} : keyword.value && results.value.length === 0 ? {
        g: common_vendor.t(keyword.value)
      } : !keyword.value ? {} : {}, {
        f: keyword.value && results.value.length === 0,
        h: !keyword.value,
        i: common_vendor.f(results.value, (r, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(r.type === "question" ? "题目" : "知识点"),
            b: common_vendor.n(r.type),
            c: highlight(r.title),
            d: r.preview
          }, r.preview ? {
            e: common_vendor.t(r.preview)
          } : {}, {
            f: `${r.type}_${r.id}`,
            g: common_vendor.o(($event) => goItem(r), `${r.type}_${r.id}`)
          });
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-3c139173"]]);
wx.createPage(MiniProgramPage);
