/**
 * Excel Auto Checkbox Filler - Popup Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const pageTitleEl = document.getElementById('pageTitle');
  const tableCountEl = document.getElementById('tableCount');
  const scanStatusEl = document.getElementById('scanStatus');
  const tableListEl = document.getElementById('tableList');
  const loadingStateEl = document.getElementById('loadingState');
  const emptyStateEl = document.getElementById('emptyState');
  const btnOpenModal = document.getElementById('btnOpenModal');
  const btnRefresh = document.getElementById('btnRefresh');
  const btnRetry = document.getElementById('btnRetry');

  let currentTabId = null;
  let detectedTables = [];

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

  async function scanActiveTab() {
    loadingStateEl.style.display = 'flex';
    emptyStateEl.style.display = 'none';
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

      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://'))) {
        showEmptyState('ब्राउझरच्या अंतर्गत सिस्टम पानांवर (about:) एक्स्टेंशन चालत नाही. कृपया वेब पेजवर वापरा.');
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

        if (detectedTables.length === 0) {
          emptyStateEl.style.display = 'flex';
          scanStatusEl.textContent = '० टेबल';
        } else {
          emptyStateEl.style.display = 'none';
          scanStatusEl.textContent = `${detectedTables.length} टेबल सापडले`;
          renderTableCards(detectedTables);
        }
      });
    } catch (err) {
      console.error('Scan error:', err);
      showEmptyState('स्कॅन त्रुटी: ' + (err.message || err));
    }
  }

  function showEmptyState(msg) {
    loadingStateEl.style.display = 'none';
    emptyStateEl.style.display = 'flex';
    if (msg) emptyStateEl.querySelector('p').textContent = msg;
    scanStatusEl.textContent = '० टेबल';
    tableCountEl.textContent = '0';
  }

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
            <span class="pill pill-green">${tbl.rows} ओळी</span>
            <span class="pill">${tbl.cols} कॉलम्स</span>
          </div>
        </div>
        <div class="preview-text" title="${escapeHtml(previewStr)}">${escapeHtml(previewStr)}</div>
        <div class="card-actions">
          <button class="btn btn-primary-sm btn-autocheck-card" data-index="${tbl.index}">
            ⚡ ऑटो चेकबॉक्स टूल उघडा
          </button>
          <button class="btn btn-outline-sm btn-focus" data-index="${tbl.index}" title="पेजवर हे टेबल हायलाइट करा">
            🎯
          </button>
        </div>
      `;

      card.querySelector('.btn-autocheck-card').addEventListener('click', () => {
        if (currentTabId == null) return;
        chrome.tabs.sendMessage(currentTabId, { action: 'openAutoCheckbox', index: tbl.index }, () => {
          window.close();
        });
      });

      card.querySelector('.btn-focus').addEventListener('click', () => {
        if (currentTabId == null) return;
        chrome.tabs.sendMessage(currentTabId, { action: 'highlightTable', index: tbl.index });
      });

      tableListEl.appendChild(card);
    });
  }

  // Hero Launch Button
  btnOpenModal.addEventListener('click', () => {
    if (currentTabId == null) return;
    chrome.tabs.sendMessage(currentTabId, { action: 'openAutoCheckbox', index: 0 }, () => {
      window.close();
    });
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

  // Floating Bar Global Toggle
  const btnToggleBar = document.getElementById('btnToggleFloatingBar');
  if (btnToggleBar) {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ showBars: true }, (items) => {
        let isShown = items.showBars !== false;
        updateToggleBtn(isShown);

        btnToggleBar.addEventListener('click', () => {
          isShown = !isShown;
          chrome.storage.local.set({ showBars: isShown });
          updateToggleBtn(isShown);
          if (currentTabId) {
            chrome.tabs.sendMessage(currentTabId, { action: 'toggleBars', show: isShown });
          }
        });
      });
    }

    function updateToggleBtn(shown) {
      if (shown) {
        btnToggleBar.textContent = 'चालू (ON)';
        btnToggleBar.style.background = '#dcfce7';
        btnToggleBar.style.color = '#15803d';
        btnToggleBar.style.borderColor = '#86efac';
      } else {
        btnToggleBar.textContent = 'बंद (OFF)';
        btnToggleBar.style.background = '#fee2e2';
        btnToggleBar.style.color = '#b91c1c';
        btnToggleBar.style.borderColor = '#fca5a5';
      }
    }
  }

  scanActiveTab();
});
