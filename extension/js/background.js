// AI 提示词管理器的后台脚本

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({
      openPanelOnActionClick: true,
    })
    .catch((error) => {
      console.error("无法配置侧边栏行为:", error);
    });
});

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({
      tabId: tab.id,
    });
  } catch (error) {
    console.error("无法打开侧边栏:", error);
    chrome.action.openPopup();
  }
});

// 键盘快捷键
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-prompt-manager") {
    chrome.action.openPopup();
  }
});
