"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_user = require("../../stores/user.js");
const stores_settings = require("../../stores/settings.js");
const _sfc_main = {
  __name: "detail",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const settingsStore = stores_settings.useSettingsStore();
    const knowledgeId = common_vendor.ref("");
    const item = common_vendor.ref(null);
    const loading = common_vendor.ref(true);
    const isFav = common_vendor.computed(() => item.value ? userStore.isFavorited(item.value.knowledgeId, "knowledge") : false);
    common_vendor.onLoad((options) => {
      knowledgeId.value = options.knowledgeId || "";
      fetch();
    });
    async function fetch() {
      var _a;
      loading.value = true;
      try {
        if (typeof common_vendor.wx$1 !== "undefined" && common_vendor.wx$1.cloud) {
          const res = await common_vendor.wx$1.cloud.callFunction({ name: "getKnowledgeDetail", data: { knowledgeId: knowledgeId.value } });
          if (((_a = res.result) == null ? void 0 : _a.code) === 0)
            item.value = res.result.data;
        } else {
          item.value = { knowledgeId: "k1", title: "VLOOKUP", syntax: "VLOOKUP(...)", definition: "垂直查找函数", parameters: [{ name: "lookup_value", type: "any", desc: "要查找的值" }], examples: [{ title: "示例", description: "查找姓名", code: "=VLOOKUP(E2, A2:B10, 2, FALSE)" }] };
        }
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }
    function toggleFav() {
      if (!item.value)
        return;
      userStore.toggleFavorite(item.value.knowledgeId, "knowledge", item.value.title);
      common_vendor.index.showToast({ title: isFav.value ? "已取消" : "已收藏", icon: "none" });
    }
    function copyCode(code) {
      common_vendor.index.setClipboardData({ data: code, success: () => common_vendor.index.showToast({ title: "已复制", icon: "success" }) });
    }
    function goQuestion(qid) {
      const ids = item.value.relatedQuestionIds;
      const prefix = ids[0].split("_")[0];
      common_vendor.index.navigateTo({ url: `/pages/study/answer?mode=related&bankId=${prefix}&questionIds=${ids.join(",")}` });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: loading.value
      }, loading.value ? {} : !item.value ? {} : common_vendor.e({
        c: common_vendor.t(item.value.title),
        d: common_vendor.t(isFav.value ? "★" : "☆"),
        e: common_vendor.o(toggleFav, "97"),
        f: item.value.syntax
      }, item.value.syntax ? {
        g: common_vendor.t(item.value.syntax)
      } : {}, {
        h: item.value.definition
      }, item.value.definition ? {
        i: common_vendor.t(item.value.definition)
      } : {}, {
        j: item.value.parameters && item.value.parameters.length > 0
      }, item.value.parameters && item.value.parameters.length > 0 ? {
        k: common_vendor.f(item.value.parameters, (p, k0, i0) => {
          return {
            a: common_vendor.t(p.name),
            b: common_vendor.t(p.type),
            c: common_vendor.t(p.desc),
            d: p.name
          };
        })
      } : {}, {
        l: item.value.examples && item.value.examples.length > 0
      }, item.value.examples && item.value.examples.length > 0 ? {
        m: common_vendor.f(item.value.examples, (ex, idx, i0) => {
          return {
            a: common_vendor.t(ex.title),
            b: common_vendor.t(ex.description),
            c: common_vendor.o(($event) => copyCode(ex.code), idx),
            d: ex.codeHtml || ex.code,
            e: idx
          };
        })
      } : {}, {
        n: item.value.relatedQuestionIds && item.value.relatedQuestionIds.length > 0
      }, item.value.relatedQuestionIds && item.value.relatedQuestionIds.length > 0 ? {
        o: common_vendor.t(item.value.relatedQuestionIds.length),
        p: common_vendor.o(($event) => goQuestion(item.value.relatedQuestionIds[0]), "02")
      } : {}, {
        q: common_vendor.unref(settingsStore).adEnabled
      }, common_vendor.unref(settingsStore).adEnabled ? {} : {}), {
        b: !item.value
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f770353a"]]);
wx.createPage(MiniProgramPage);
