/**
 * Universal Table Copy & Excel Exporter - Popup Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const pageTitleEl = document.getElementById('pageTitle');
  const tableCountEl = document.getElementById('tableCount');
  const scanStatusEl = document.getElementById('scanStatus');
  const tableListEl = document.getElementById('tableList');
  const loadingStateEl = document.getElementById('loadingState');
  const emptyStateEl = document.getElementById('emptyState');
  const btnExportAll = document.getElementById('btnExportAll');
  const btnStartPicker = document.getElementById('btnStartPicker');
  const btnRefresh = document.getElementById('btnRefresh');
  const btnRetry = document.getElementById('btnRetry');
  const toggleBars = document.getElementById('toggleBars');

  let currentTabId = null;
  let detectedTables = [];

  /**
   * Ensure content scripts and styles are injected
   */
  async function ensureInjected(tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    } catch (e) {
      try {
        await chrome.scripting.insertCSS({
          target: { tabId },
          files: ['content.css']
        });
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['lib/xlsx.full.min.js', 'content.js']
        });
      } catch (injectErr) {
        console.warn('Script injection warning:', injectErr);
      }
    }
  }

  /**
   * Scan active tab for tables
   */
  async function scanActiveTab() {
    loadingStateEl.style.display = 'flex';
    emptyStateEl.style.display = 'none';
    btnExportAll.disabled = true;
    scanStatusEl.textContent = 'स्कॅन होत आहे...';

    document.querySelectorAll('.table-card').forEach(c => c.remove());

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        showEmptyState('सक्रिय टॅब सापडला नाही.');
        return;
      }

      currentTabId = tab.id;
      pageTitleEl.textContent = tab.title || tab.url || 'Web Page';
      pageTitleEl.title = tab.url || '';

      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('chrome-extension://'))) {
        showEmptyState('ब्राउझरच्या सिस्टम पानांवर (chrome://) एक्स्टेंशन चालत नाही.');
        return;
      }

      await ensureInjected(currentTabId);

      chrome.tabs.sendMessage(currentTabId, { action: 'scanTables' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          showEmptyState('पानावरील टेबल्स शोधता आले नाहीत. कृपया पान रिफ्रेश करा.');
          return;
        }

        loadingStateEl.style.display = 'none';
        detectedTables = response.tables || [];
        tableCountEl.textContent = detectedTables.length;

        if (response.barsVisible !== undefined) {
          toggleBars.checked = response.barsVisible;
        }

        if (detectedTables.length === 0) {
          emptyStateEl.style.display = 'flex';
          scanStatusEl.textContent = '० टेबल';
          btnExportAll.disabled = true;
        } else {
          emptyStateEl.style.display = 'none';
          scanStatusEl.textContent = `${detectedTables.length} टेबल सापडले`;
          btnExportAll.disabled = false;
          renderTableCards(detectedTables);
        }
      });
    } catch (err) {
      console.error('Scan error:', err);
      showEmptyState('स्कॅन करताना एरर: ' + (err.message || err));
    }
  }

  function showEmptyState(msg) {
    loadingStateEl.style.display = 'none';
    emptyStateEl.style.display = 'flex';
    if (msg) emptyStateEl.querySelector('p').textContent = msg;
    scanStatusEl.textContent = '० टेबल';
    tableCountEl.textContent = '0';
    btnExportAll.disabled = true;
  }

  /**
   * Render table cards in popup
   */
  function renderTableCards(tables) {
    tables.forEach((tbl) => {
      const card = document.createElement('div');
      card.className = 'table-card';

      const previewStr = tbl.previewHeaders && tbl.previewHeaders.length > 0
        ? tbl.previewHeaders.join(' | ')
        : 'कॉलम्स: ' + tbl.cols;

      card.innerHTML = `
        <div class="card-top">
          <div class="card-title">${escapeHtml(tbl.title)}</div>
          <div class="badges-group">
            <span class="pill pill-green">${tbl.rows} ओळी (Rows)</span>
            <span class="pill">${tbl.cols} कॉलम्स</span>
          </div>
        </div>
        <div class="preview-text" title="${escapeHtml(previewStr)}">${escapeHtml(previewStr)}</div>
        <div class="card-actions">
          <button class="btn btn-copy-card btn-sm btn-copy" data-index="${tbl.index}">
            <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            १-क्लिक कॉपी
          </button>
          <button class="btn btn-outline btn-sm btn-export-xlsx" data-index="${tbl.index}">
            📊 Excel (.xlsx)
          </button>
          <button class="btn btn-outline btn-sm btn-export-csv" data-index="${tbl.index}">
            📄 CSV
          </button>
          <button class="btn btn-outline btn-sm btn-icon-only btn-focus" data-index="${tbl.index}" title="पेजवर हे टेबल हायलाइट करा">
            🎯
          </button>
        </div>
      `;

      // 1-Click Copy
      const copyBtn = card.querySelector('.btn-copy');
      copyBtn.addEventListener('click', () => {
        if (currentTabId == null) return;
        chrome.tabs.sendMessage(currentTabId, { action: 'copyTable', index: tbl.index });
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `<span>✔ कॉपी झाले!</span>`;
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
        }, 1800);
      });

      // Export XLSX
      card.querySelector('.btn-export-xlsx').addEventListener('click', () => {
        if (currentTabId == null) return;
        chrome.tabs.sendMessage(currentTabId, { action: 'exportTable', index: tbl.index, format: 'xlsx' });
      });

      // Export CSV
      card.querySelector('.btn-export-csv').addEventListener('click', () => {
        if (currentTabId == null) return;
        chrome.tabs.sendMessage(currentTabId, { action: 'exportTable', index: tbl.index, format: 'csv' });
      });

      // Focus
      card.querySelector('.btn-focus').addEventListener('click', () => {
        if (currentTabId == null) return;
        chrome.tabs.sendMessage(currentTabId, { action: 'highlightTable', index: tbl.index });
      });

      tableListEl.appendChild(card);
    });
  }

  // Pick Table Mode (closes popup and lets user click table on page)
  btnStartPicker.addEventListener('click', () => {
    if (currentTabId == null) return;
    chrome.tabs.sendMessage(currentTabId, { action: 'startPicker' }, () => {
      window.close(); // Close popup so user can click on page immediately
    });
  });

  // Export All
  btnExportAll.addEventListener('click', () => {
    if (currentTabId == null) return;
    btnExportAll.disabled = true;
    btnExportAll.innerHTML = `<span>⏳ एक्सपोर्ट होत आहे...</span>`;
    chrome.tabs.sendMessage(currentTabId, { action: 'exportAll' }, () => {
      btnExportAll.disabled = false;
      btnExportAll.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14v-4H8l4-4 4 4h-3v4h-1z"/></svg>
        <span>सर्व टेबल्स (.xlsx)</span>
      `;
    });
  });

  // Toggle On-page floating bars
  toggleBars.addEventListener('change', () => {
    if (currentTabId == null) return;
    chrome.tabs.sendMessage(currentTabId, { action: 'toggleBars', show: toggleBars.checked });
  });

  btnRefresh.addEventListener('click', scanActiveTab);
  btnRetry.addEventListener('click', scanActiveTab);

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  scanActiveTab();
});
