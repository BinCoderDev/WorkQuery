"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_user = require("../../stores/user.js");
const stores_settings = require("../../stores/settings.js");
const _sfc_main = {
  __name: "answer",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const settingsStore = stores_settings.useSettingsStore();
    const letters = ["A", "B", "C", "D", "E", "F"];
    const bankId = common_vendor.ref("");
    const mode = common_vendor.ref("sequential");
    const currentIndex = common_vendor.ref(0);
    const totalCount = common_vendor.ref(0);
    const questions = common_vendor.ref([]);
    const answeredMap = common_vendor.ref({});
    const favMap = common_vendor.ref({});
    const adCounter = common_vendor.ref(0);
    let interstitialAd = null;
    const isLast = common_vendor.computed(() => currentIndex.value >= totalCount.value - 1);
    const isFav = common_vendor.computed(() => {
      const q = questions.value[currentIndex.value];
      return q ? !!favMap.value[q.questionId] : false;
    });
    const targetIds = common_vendor.ref([]);
    common_vendor.onLoad((options) => {
      bankId.value = options.bankId || "";
      mode.value = options.mode || "sequential";
      if (options.questionIds)
        targetIds.value = options.questionIds.split(",");
      else if (options.questionId)
        targetIds.value = [options.questionId];
      loadAdCounter();
      loadQuestions();
      userStore.fetchUserData();
    });
    async function loadQuestions() {
      var _a, _b, _c;
      let loaded = false;
      try {
        if (typeof common_vendor.wx$1 !== "undefined" && common_vendor.wx$1.cloud) {
          const res = await callCloudWithTimeout("getQuestions", { bankId: bankId.value, pageIndex: 0, pageSize: 100 }, 5e3);
          if (((_a = res.result) == null ? void 0 : _a.code) === 0 && ((_c = (_b = res.result.data) == null ? void 0 : _b.questions) == null ? void 0 : _c.length) > 0) {
            questions.value = res.result.data.questions;
            loaded = true;
          }
        }
      } catch (e) {
        console.warn("云函数 getQuestions 不可用，使用模拟数据:", e.message);
      }
      if (!loaded) {
        questions.value = generateMockQuestions();
      }
      if (mode.value === "random")
        shuffle(questions.value);
      totalCount.value = questions.value.length;
      const progress = userStore.getProgress(bankId.value);
      if (mode.value === "sequential" && progress.currentIndex > 0) {
        currentIndex.value = Math.min(progress.currentIndex, Math.max(0, totalCount.value - 1));
      }
      for (const f of userStore.favorites) {
        if (f.itemType === "question")
          favMap.value[f.itemId] = true;
      }
      if (targetIds.value.length > 0) {
        questions.value = questions.value.filter((q) => targetIds.value.includes(q.questionId));
        currentIndex.value = 0;
        totalCount.value = questions.value.length;
      }
    }
    function callCloudWithTimeout(name, data, timeout) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("云函数超时")), timeout);
        common_vendor.wx$1.cloud.callFunction({ name, data }).then((res) => {
          clearTimeout(timer);
          resolve(res);
        }).catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
      });
    }
    function getOptClass(qIndex, optIndex) {
      var _a;
      const answered = answeredMap.value[qIndex];
      if (answered === void 0)
        return "";
      const correct = (_a = questions.value[qIndex]) == null ? void 0 : _a.correctIndex;
      if (optIndex === correct)
        return "correct";
      if (optIndex === answered && answered !== correct)
        return "wrong";
      return "locked";
    }
    function isAnswered(qIndex) {
      return answeredMap.value[qIndex] !== void 0;
    }
    function isCorrect(qIndex) {
      var _a;
      return answeredMap.value[qIndex] === ((_a = questions.value[qIndex]) == null ? void 0 : _a.correctIndex);
    }
    function selectOpt(qIndex, optIndex) {
      if (answeredMap.value[qIndex] !== void 0)
        return;
      answeredMap.value[qIndex] = optIndex;
      if (optIndex !== questions.value[qIndex].correctIndex) {
        const q = questions.value[qIndex];
        userStore.addWrongQuestion(q.questionId, bankId.value, q.question.substring(0, 80));
      }
      adCounter.value++;
      if (adCounter.value % 10 === 0) {
        showInterstitialAd();
      }
      common_vendor.index.setStorageSync("adCounter", adCounter.value);
    }
    function goPrev() {
      if (currentIndex.value > 0)
        currentIndex.value--;
    }
    function goNext() {
      if (isLast.value) {
        if (mode.value === "sequential") {
          common_vendor.index.showModal({
            title: "🎉 恭喜完成！",
            content: "你已完成了本题库全部练习。",
            confirmText: "重新刷题",
            cancelText: "返回题库",
            success: (res) => {
              if (res.confirm) {
                currentIndex.value = 0;
                answeredMap.value = {};
              } else {
                common_vendor.index.switchTab({ url: "/pages/banks/index" });
              }
            }
          });
        } else {
          currentIndex.value = 0;
        }
      } else {
        currentIndex.value++;
      }
      saveProgress();
    }
    function onSwipe(e) {
      currentIndex.value = e.detail.current;
      saveProgress();
    }
    function saveProgress() {
      userStore.saveProgress(bankId.value, {
        mode: mode.value,
        currentIndex: currentIndex.value,
        completedCount: Object.keys(answeredMap.value).length
      });
    }
    function toggleFav() {
      const q = questions.value[currentIndex.value];
      if (!q)
        return;
      favMap.value[q.questionId] = !favMap.value[q.questionId];
      userStore.toggleFavorite(q.questionId, "question", q.question.substring(0, 40));
      common_vendor.index.showToast({ title: favMap.value[q.questionId] ? "已收藏" : "已取消", icon: "none" });
    }
    function copyCode(code) {
      common_vendor.index.setClipboardData({ data: code, success: () => common_vendor.index.showToast({ title: "已复制", icon: "success" }) });
    }
    function goKnowledge(knowledgeId) {
      common_vendor.index.navigateTo({ url: `/pages/reference/detail?knowledgeId=${knowledgeId}` });
    }
    function showInterstitialAd() {
      if (!settingsStore.adEnabled)
        return;
      try {
        if (typeof common_vendor.wx$1 !== "undefined" && common_vendor.wx$1.createInterstitialAd) {
          if (!interstitialAd) {
            interstitialAd = common_vendor.wx$1.createInterstitialAd({ adUnitId: "请填写你的插屏广告单元ID" });
          }
          interstitialAd.show().catch(() => {
          });
        }
      } catch (e) {
      }
    }
    function loadAdCounter() {
      try {
        adCounter.value = common_vendor.index.getStorageSync("adCounter") || 0;
      } catch (e) {
        adCounter.value = 0;
      }
    }
    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    function generateMockQuestions() {
      const questions2 = [
        { question: "在Excel中，以下哪个函数用于在表格首列中垂直查找数据？", options: ["HLOOKUP", "VLOOKUP", "LOOKUP", "XLOOKUP"], correctIndex: 1, explanation: "VLOOKUP（Vertical Lookup）用于在表格首列中垂直查找指定值，返回该行中指定列的值。" },
        { question: "VLOOKUP第四个参数设为FALSE表示什么？", options: ["近似匹配", "模糊查找", "精确匹配", "不区分大小写"], correctIndex: 2, explanation: "VLOOKUP第四个参数为FALSE（或0）表示精确匹配。TRUE表示近似匹配。" },
        { question: "SUMIF函数的作用是什么？", options: ["无条件求和", "对满足条件的单元格求和", "查找数据", "计数"], correctIndex: 1, explanation: "SUMIF根据指定条件对满足条件的单元格求和。" },
        { question: "IF函数的正确语法是什么？", options: ["IF(条件,假值,真值)", "IF(值,条件,返回值)", "IF(条件,真值,假值)", "IF(返回值,条件,真值)"], correctIndex: 2, explanation: "IF(条件, 条件为真时的值, 条件为假时的值)。" },
        { question: "以下哪个函数用于统计包含数字的单元格个数？", options: ["COUNTA", "COUNT", "COUNTIF", "COUNTBLANK"], correctIndex: 1, explanation: "COUNT统计数字个数。COUNTA统计非空，COUNTIF按条件，COUNTBLANK统计空单元格。" },
        { question: "在Excel中，符号$A$1表示什么类型的引用？", options: ["相对引用", "混合引用", "绝对引用", "循环引用"], correctIndex: 2, explanation: "$A$1是绝对引用，复制公式时行列都不会变。" },
        { question: "COUNTIF函数的作用是什么？", options: ["统计所有单元格", "按条件统计个数", "统计空单元格", "按条件求和"], correctIndex: 1, explanation: "COUNTIF统计满足条件的单元格个数。" },
        { question: "CONCATENATE函数的功能是什么？", options: ["格式化文本", "合并字符串", "截取文本", "去除空格"], correctIndex: 1, explanation: "CONCATENATE（或&）用于合并多个文本字符串。" },
        { question: "AVERAGE函数计算的是什么？", options: ["最大值", "最小值", "总和", "算术平均值"], correctIndex: 3, explanation: "AVERAGE计算算术平均值。" },
        { question: '若A1=5,B1=3,=IF(A1>B1,"大于","不大于")的结果？', options: ["5", "3", "大于", "不大于"], correctIndex: 2, explanation: '5>3条件为真，返回"大于"。' },
        { question: "SUMIFS和SUMIF的主要区别？", options: ["可多个条件", "只能求和", "速度更快", "没区别"], correctIndex: 0, explanation: "SUMIFS支持多个条件求和，SUMIF只支持单一条件。" },
        { question: "哪个可以在A1中显示今天的日期？", options: ["=NOW()", "=TODAY()", "=DATE()", "=DAY()"], correctIndex: 1, explanation: "TODAY()返回当前日期。NOW()带时间。" },
        { question: "LEFT函数的作用？", options: ["从右侧截取", "删除空格", "从左侧截取字符", "转大写"], correctIndex: 2, explanation: "LEFT从文本左侧截取指定数量字符。" },
        { question: "数据透视表的主要功能？", options: ["美化表格", "汇总分析数据", "创建图表", "保护工作表"], correctIndex: 1, explanation: "数据透视表快速分类汇总和交叉分析大量数据。" },
        { question: "如何将A列和B列合并到C列（空格分隔）？", options: ["C1=A1+B1", 'C1=A1&" "&B1', "C1=MERGE(A1,B1)", "C1=COMBINE(A1,B1)"], correctIndex: 1, explanation: "用&连接文本，空格用引号包裹。" },
        { question: "固定引用B列（列不变行可变）的写法？", options: ["B1", "$B$1", "$B1", "B$1"], correctIndex: 2, explanation: "$B1列绝对引用（固定），行相对引用（可变）。" },
        { question: "ROUND函数的作用？", options: ["向上取整", "向下取整", "四舍五入", "去小数"], correctIndex: 2, explanation: "ROUND四舍五入到指定小数位。" },
        { question: "条件格式的功能是什么？", options: ["加粗文本", "根据条件设样式", "限制输入", "保护单元格"], correctIndex: 1, explanation: "条件格式根据值自动应用颜色等格式。" },
        { question: "VLOOKUP查找值必须在查找区域的哪列？", options: ["任意列", "最后一列", "第一列", "中间列"], correctIndex: 2, explanation: "查找值必须在表格区域第一列。" },
        { question: "哪个快捷键在Excel中插入当前日期？", options: ["Ctrl+C", "Ctrl+;", "Ctrl+D", "Ctrl+T"], correctIndex: 1, explanation: "Ctrl+;插入静态当前日期。" },
        { question: "INDEX+MATCH相比VLOOKUP的优势？", options: ["更快", "可从右向左查", "更简单", "无需排序"], correctIndex: 1, explanation: "INDEX+MATCH可从右向左查找。" },
        { question: "TRIM函数的作用？", options: ["识别文本", "去除多余空格", "转大写", "格式化"], correctIndex: 1, explanation: "TRIM去除首尾和中间多余空格。" },
        { question: "=SUM(A1:A10, C1:C10)计算什么？", options: ["A1到C10总和", "A1:A10总和", "A1:A10+C1:C10总和", "差集"], correctIndex: 2, explanation: "SUM可接受多个区域参数，逗号分隔。" },
        { question: "LEN函数的作用？", options: ["截取文本", "返回字符数", "查找位置", "替换文本"], correctIndex: 1, explanation: "LEN返回字符串字符个数。" },
        { question: "关于数据验证哪个正确？", options: ["防公式错", "限制输入类型范围", "等于密码保护", "只限数字"], correctIndex: 1, explanation: "数据验证可限制整数、小数、日期、列表等。" },
        { question: "哪个公式计算A1:A10大于60的平均值？", options: ['=AVERAGEIF(A1:A10,">60")', '=AVERAGE(A1:A10,">60")', "=SUMIF/COUNT", "=MEANIF"], correctIndex: 0, explanation: "AVERAGEIF按条件计算平均值。" },
        { question: "合并单元格后数据会怎样？", options: ["全部保留", "保留拼接", "只留左上角", "全部清空"], correctIndex: 2, explanation: "只保留左上角单元格数据，其他删除。" },
        { question: "MAX和LARGE的区别？", options: ["没区别", "LARGE可返回第N大", "MAX限数字", "LARGE返回最大"], correctIndex: 1, explanation: "LARGE(array,k)返回第k大值。" },
        { question: "混和引用的正确示例？", options: ["=A1+B1", "=$A$1+$B$1", "=$A1+B$1", "=##A1+##B1"], correctIndex: 2, explanation: "$A1列固定行可变，B$1行固定列可变。" },
        { question: "哪个快捷键选中整张工作表？", options: ["Ctrl+A", "Ctrl+S", "Ctrl+Z", "Ctrl+X"], correctIndex: 0, explanation: "Ctrl+A选中全部。按两次选中整张表。" }
      ];
      return questions2.map((q, i) => ({
        questionId: `mock_q${i}`,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        knowledgeIds: []
      }));
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(currentIndex.value + 1),
        b: common_vendor.t(totalCount.value),
        c: common_vendor.t(isFav.value ? "★" : "☆"),
        d: common_vendor.o(toggleFav, "12"),
        e: common_vendor.f(questions.value, (q, i, i0) => {
          return common_vendor.e({
            a: common_vendor.t(q.question),
            b: common_vendor.f(q.codeBlocks, (cb, k1, i1) => {
              return {
                a: common_vendor.t(cb.language),
                b: common_vendor.o(($event) => copyCode(cb.code), cb.caption),
                c: cb.codeHtml || cb.code,
                d: cb.caption
              };
            }),
            c: common_vendor.f(q.options, (opt, j, i1) => {
              return {
                a: common_vendor.t(letters[j]),
                b: common_vendor.t(opt),
                c: j,
                d: common_vendor.n(getOptClass(i, j)),
                e: common_vendor.o(($event) => selectOpt(i, j), j)
              };
            }),
            d: isAnswered(i)
          }, isAnswered(i) ? common_vendor.e({
            e: common_vendor.t(isCorrect(i) ? "✓ 回答正确" : "✗ 回答错误"),
            f: common_vendor.t(q.explanation),
            g: common_vendor.f(q.explanationCodeBlocks, (cb, k1, i1) => {
              return {
                a: common_vendor.t(cb.language),
                b: common_vendor.o(($event) => copyCode(cb.code), cb.caption),
                c: cb.codeHtml || cb.code,
                d: cb.caption
              };
            }),
            h: q.knowledgeIds && q.knowledgeIds.length > 0
          }, q.knowledgeIds && q.knowledgeIds.length > 0 ? {
            i: common_vendor.f(q.knowledgeIds, (kid, k1, i1) => {
              return {
                a: kid,
                b: common_vendor.o(($event) => goKnowledge(kid), kid)
              };
            })
          } : {}) : {}, {
            j: q.questionId || i
          });
        }),
        f: currentIndex.value,
        g: common_vendor.o(onSwipe, "d1"),
        h: currentIndex.value === 0,
        i: common_vendor.o(goPrev, "a5"),
        j: common_vendor.t(currentIndex.value + 1),
        k: common_vendor.t(totalCount.value),
        l: common_vendor.t(isLast.value ? "完成" : "下一题"),
        m: common_vendor.o(goNext, "c2")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-39c3016b"]]);
wx.createPage(MiniProgramPage);
