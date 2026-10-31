/**
 * Excel Auto Checkbox Filler - Background Service Worker
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "auto_checkbox_root",
    title: "⚡ एक्सेल नुसार चेकबॉक्स भरा (Auto Checkbox)",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;

  chrome.tabs.sendMessage(tab.id, {
    action: "openAutoCheckbox",
    menuId: info.menuItemId
  }).catch((err) => {
    console.warn("Could not send context menu message:", err);
  });
});
