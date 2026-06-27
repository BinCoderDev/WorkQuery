"use strict";
const common_vendor = require("../common/vendor.js");
const stores_settings = require("./settings.js");
const state = common_vendor.reactive({ current: "light" });
function useTheme() {
  const settingsStore = stores_settings.useSettingsStore();
  function refresh() {
    state.current = settingsStore.getEffectiveTheme();
    common_vendor.index.setNavigationBarColor({
      frontColor: state.current === "dark" ? "#ffffff" : "#000000",
      backgroundColor: state.current === "dark" ? "#1A1A1A" : "#FFFFFF"
    });
    common_vendor.index.setBackgroundColor({
      backgroundColor: state.current === "dark" ? "#1A1A1A" : "#F5F5F5",
      backgroundColorTop: state.current === "dark" ? "#1A1A1A" : "#F5F5F5",
      backgroundColorBottom: state.current === "dark" ? "#1A1A1A" : "#F5F5F5"
    });
  }
  function setDark(mode) {
    settingsStore.setDarkMode(mode);
    refresh();
  }
  refresh();
  return {
    theme: state,
    isDark: () => state.current === "dark",
    refresh,
    setDark
  };
}
exports.useTheme = useTheme;
