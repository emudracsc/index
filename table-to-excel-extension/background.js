/**
 * Universal Table Copy & Excel Exporter - Background Service Worker
 * Handles context menu (right-click) interactions
 */

chrome.runtime.onInstalled.addListener(() => {
  // Setup Right-click Context Menus
  chrome.contextMenus.create({
    id: "table_copy_root",
    title: "📋 टेबल कॉपी करा (Copy Table to Excel)",
    contexts: ["all"]
  });

  chrome.contextMenus.create({
    id: "table_export_xlsx",
    title: "📊 एक्सेल डाऊनलोड करा (.xlsx)",
    contexts: ["all"]
  });

  chrome.contextMenus.create({
    id: "table_export_csv",
    title: "📄 CSV डाऊनलोड करा (.csv)",
    contexts: ["all"]
  });

  chrome.contextMenus.create({
    id: "table_autocheck",
    title: "⚡ एक्सेल नुसार चेकबॉक्स भरा (Auto Checkbox)",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;

  chrome.tabs.sendMessage(tab.id, {
    action: "contextMenuClick",
    menuId: info.menuItemId
  }).catch((err) => {
    console.warn("Could not send contextMenuClick message:", err);
  });
});
