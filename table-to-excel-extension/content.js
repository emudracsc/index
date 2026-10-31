/**
 * Universal Table Copy & Excel Exporter - Content Script
 * 1-Click Copy (Ctrl+V into Excel) & 1-Click Download (.xlsx / .csv) for ANY HTML Table
 */

(function () {
  'use strict';

  let showFloatingBars = true;
  let pickerActive = false;
  let lastRightClickedTable = null;
  const processedTables = new WeakSet();

  // Load preferences
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get({ showBars: true }, function (items) {
      showFloatingBars = items.showBars !== false;
      refreshBarsVisibility();
    });
  }

  /**
   * Track right-clicked table for Context Menu action
   */
  document.addEventListener('contextmenu', (e) => {
    const table = findClosestTable(e.target);
    if (table) {
      lastRightClickedTable = table;
    }
  }, true);

  /**
   * Superpower: Alt + Click anywhere on a table to instantly copy it!
   */
  document.addEventListener('click', (e) => {
    if (e.altKey) {
      const table = findClosestTable(e.target);
      if (table) {
        e.preventDefault();
        e.stopPropagation();
        copyTableToClipboard(table);
      }
    }
  }, true);

  /**
   * Find closest table (standard table or ARIA table/grid)
   */
  function findClosestTable(el) {
    if (!el) return null;
    return el.closest('table, [role="table"], [role="grid"]');
  }

  /**
   * Validate if element is a usable table
   */
  function isValidTable(table) {
    if (!table) return false;
    const style = window.getComputedStyle(table);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    // Check rows count
    const rows = table.rows || table.querySelectorAll('tr, [role="row"]');
    if (!rows || rows.length < 1) return false;
    return true;
  }
  const isTableValid = isValidTable;

  /**
   * Get all tables on current web page
   */
  function getAllTables() {
    const standard = Array.from(document.querySelectorAll('table'));
    const ariaTables = Array.from(document.querySelectorAll('[role="table"], [role="grid"]'));
    const combined = [...new Set([...standard, ...ariaTables])];
    return combined.filter(isValidTable);
  }

  /**
   * Extract title / heading of a table
   */
  function getTableTitle(table, index) {
    if (table.getAttribute('data-t2e-title')) return table.getAttribute('data-t2e-title');
    const caption = table.querySelector('caption');
    if (caption && caption.textContent.trim()) return caption.textContent.trim();

    let prev = table.previousElementSibling;
    let attempts = 0;
    while (prev && attempts < 3) {
      if (/^H[1-6]$/i.test(prev.tagName) && prev.textContent.trim()) {
        return prev.textContent.trim();
      }
      const headingInside = prev.querySelector && prev.querySelector('h1, h2, h3, h4, h5');
      if (headingInside && headingInside.textContent.trim()) {
        return headingInside.textContent.trim();
      }
      prev = prev.previousElementSibling;
      attempts++;
    }

    const container = table.closest('.pg, .card, .paper, section, article, div[id]');
    if (container) {
      const h = container.querySelector('h1, h2, h3, h4');
      if (h && h.textContent.trim()) return h.textContent.trim();
      if (container.id) return 'Table (' + container.id + ')';
    }

    const firstTh = table.querySelector('th, [role="columnheader"]');
    if (firstTh && firstTh.textContent.trim()) {
      return 'Table: ' + firstTh.textContent.trim().slice(0, 30);
    }

    return 'Table ' + (index + 1);
  }

  /**
   * Clean text inside cell (supports nested inputs, selects, and text nodes)
   */
  function getCleanCellText(cell) {
    if (!cell) return '';
    const clone = cell.cloneNode(true);
    const unwanted = clone.querySelectorAll('script, style, .t2e-floating-bar, .t2e-toast, .no, [style*="display:none"], [style*="display: none"]');
    unwanted.forEach(el => el.remove());

    let text = clone.innerText || clone.textContent || '';
    text = text.replace(/\u00a0/g, ' ').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();

    if (!text) {
      const input = cell.querySelector('input:not([type="checkbox"]):not([type="radio"]), select, textarea');
      if (input && input.value !== undefined) {
        text = String(input.value).trim();
      }
    }
    return text;
  }

  /**
   * High-Fidelity 2D matrix parser with rowspan & colspan support
   */
  function parseTableMatrix(table) {
    const isStandard = table instanceof HTMLTableElement;
    const rows = isStandard ? Array.from(table.rows) : Array.from(table.querySelectorAll('tr, [role="row"]'));
    const matrix = [];
    const merges = [];
    const colWidths = [];
    const occupied = [];

    rows.forEach((row, rowIndex) => {
      const rowStyle = window.getComputedStyle(row);
      if (rowStyle.display === 'none' || row.classList.contains('no')) return;

      if (!matrix[rowIndex]) matrix[rowIndex] = [];
      if (!occupied[rowIndex]) occupied[rowIndex] = [];

      let colIndex = 0;
      const cells = isStandard ? Array.from(row.cells) : Array.from(row.querySelectorAll('td, th, [role="cell"], [role="columnheader"]'));

      cells.forEach(cell => {
        if (cell.classList.contains('no') || cell.classList.contains('t2e-floating-bar')) return;

        while (occupied[rowIndex][colIndex]) {
          colIndex++;
        }

        const rowspan = parseInt(cell.getAttribute('rowspan'), 10) || 1;
        const colspan = parseInt(cell.getAttribute('colspan'), 10) || 1;
        const text = getCleanCellText(cell);

        let val;
        let cellType = 's';
        const isPhone = /^[6-9]\d{9}$/.test(text) || /^0\d{9,11}$/.test(text) || /^\+91\d{10}$/.test(text);
        const isNumeric = !isPhone && /^-?\d+(\.\d+)?$/.test(text);

        if (isNumeric) {
          val = Number(text);
          cellType = 'n';
        } else {
          val = text;
          cellType = 's';
        }

        matrix[rowIndex][colIndex] = { v: val, t: cellType };

        const len = String(text).length;
        if (!colWidths[colIndex] || colWidths[colIndex] < len) {
          colWidths[colIndex] = Math.min(Math.max(len, 8), 50);
        }

        if (rowspan > 1 || colspan > 1) {
          merges.push({
            s: { r: rowIndex, c: colIndex },
            e: { r: rowIndex + rowspan - 1, c: colIndex + colspan - 1 }
          });
          for (let r = 0; r < rowspan; r++) {
            const targetR = rowIndex + r;
            if (!occupied[targetR]) occupied[targetR] = [];
            if (!matrix[targetR]) matrix[targetR] = [];
            for (let c = 0; c < colspan; c++) {
              const targetC = colIndex + c;
              occupied[targetR][targetC] = true;
              if (r !== 0 || c !== 0) {
                matrix[targetR][targetC] = { v: '', t: 's' };
              }
            }
          }
        } else {
          occupied[rowIndex][colIndex] = true;
        }

        colIndex++;
      });
    });

    return {
      matrix: matrix.filter(r => r && r.length > 0),
      merges,
      colWidths: colWidths.map(w => ({ wch: (w || 10) + 2 }))
    };
  }

  /**
   * Superpower: 1-Click Copy to Clipboard (Dual-Format: HTML Table + TSV Text)
   * This ensures 100% perfect paste into Excel, Google Sheets, Word, and Notepad!
   */
  async function copyTableToClipboard(table) {
    try {
      const parsed = parseTableMatrix(table);
      const matrix = parsed.matrix;
      if (!matrix || !matrix.length) {
        showToast('टेबल रिकामे आहे किंवा डेटा सापडला नाही.', 'error');
        return;
      }

      // 1. Generate clean HTML Table for Excel
      let html = '<table border="1" style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;">\n';
      matrix.forEach((row, rIdx) => {
        html += '  <tr>\n';
        row.forEach(cell => {
          const val = cell && cell.v !== undefined ? cell.v : '';
          const tag = rIdx === 0 ? 'th' : 'td';
          const bg = rIdx === 0 ? 'background-color:#dfe7f3;font-weight:bold;' : '';
          html += `    <${tag} style="border:1px solid #999;padding:4px 8px;${bg}">${escapeXml(String(val))}</${tag}>\n`;
        });
        html += '  </tr>\n';
      });
      html += '</table>';

      // 2. Generate clean TSV for plain text paste
      const tsvLines = matrix.map(row => {
        return (row || []).map(cell => {
          const val = cell && cell.v !== undefined ? String(cell.v) : '';
          return val.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
        }).join('\t');
      });
      const tsv = tsvLines.join('\n');

      // 3. Dual-Format Clipboard Write
      let writeSuccess = false;
      if (navigator.clipboard && navigator.clipboard.write) {
        try {
          const htmlBlob = new Blob([html], { type: 'text/html' });
          const textBlob = new Blob([tsv], { type: 'text/plain' });
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': htmlBlob,
              'text/plain': textBlob
            })
          ]);
          writeSuccess = true;
        } catch (clipErr) {
          console.warn('ClipboardItem failed, falling back to writeText:', clipErr);
        }
      }

      // Fallback
      if (!writeSuccess) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(tsv);
          writeSuccess = true;
        } else {
          // Legacy execCommand fallback
          const ta = document.createElement('textarea');
          ta.value = tsv;
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
          writeSuccess = true;
        }
      }

      highlightTableBriefly(table);
      showToast('✔ टेबल १-क्लिकमध्ये कॉपी झाले! Excel मध्ये थेट Ctrl+V दाबा.');
    } catch (err) {
      console.error('Copy table failed:', err);
      showToast('कॉपी करताना एरर: ' + (err.message || err), 'error');
    }
  }

  /**
   * Export Table to Excel (.xlsx)
   */
  function exportTableToXlsx(table, customTitle) {
    try {
      if (typeof XLSX === 'undefined') {
        showToast('SheetJS लोड होत आहे, कृपया २ सेकंद थांबा...', 'error');
        return;
      }
      const title = customTitle || getTableTitle(table, 0);
      const parsed = parseTableMatrix(table);
      const ws = createWorksheetFromMatrix(parsed);
      const wb = XLSX.utils.book_new();
      const sheetName = sanitizeSheetName(title, 'Table_Data');
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const today = new Date().toISOString().slice(0, 10);
      const filename = `${sanitizeFileName(title)}_${today}.xlsx`;

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      triggerDownload(blob, filename);
      highlightTableBriefly(table);
      showToast(`✔ Excel फाईल डाऊनलोड झाली: ${filename}`);
    } catch (err) {
      console.error('Export Excel failed:', err);
      showToast('एक्सेल एक्सपोर्ट एरर: ' + (err.message || err), 'error');
    }
  }

  /**
   * Export Table to CSV with UTF-8 BOM
   */
  function exportTableToCsv(table, customTitle) {
    try {
      const title = customTitle || getTableTitle(table, 0);
      const parsed = parseTableMatrix(table);
      const matrix = parsed.matrix;

      const csvLines = matrix.map(row => {
        return (row || []).map(cell => {
          const val = cell && cell.v !== undefined ? String(cell.v) : '';
          return `"${val.replace(/"/g, '""')}"`;
        }).join(',');
      });

      const bom = '\uFEFF';
      const csvContent = bom + csvLines.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const today = new Date().toISOString().slice(0, 10);
      const filename = `${sanitizeFileName(title)}_${today}.csv`;
      triggerDownload(blob, filename);
      highlightTableBriefly(table);
      showToast(`✔ CSV फाईल डाऊनलोड झाली: ${filename}`);
    } catch (err) {
      console.error('Export CSV failed:', err);
      showToast('CSV एरर: ' + (err.message || err), 'error');
    }
  }

  /**
   * Helper to download JSON array as Excel (.xlsx) file
   */
  function downloadJsonAsXlsx(dataList, defaultFilename, sheetName = 'Data') {
    if (!dataList || dataList.length === 0) {
      showToast('डाऊनलोड करण्यासाठी डेटा उपलब्ध नाही.', 'warn');
      return;
    }
    try {
      if (typeof XLSX === 'undefined') {
        showToast('SheetJS लायब्ररी लोड झालेली नाही.', 'error');
        return;
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataList);

      // Auto calculate column widths
      const colWidths = [];
      const keys = Object.keys(dataList[0] || {});
      keys.forEach(k => {
        let maxLen = String(k).length;
        for (let i = 0; i < Math.min(dataList.length, 60); i++) {
          const v = dataList[i][k];
          if (v !== undefined && v !== null) {
            const len = String(v).length;
            if (len > maxLen) maxLen = len;
          }
        }
        colWidths.push({ wch: Math.min(Math.max(maxLen + 3, 10), 40) });
      });
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, String(sheetName).slice(0, 31));
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      triggerDownload(blob, defaultFilename);
      showToast(`✔ Excel फाईल डाउनलोड झाली: ${defaultFilename}`);
    } catch (err) {
      console.error('XLSX export error:', err);
      showToast('एक्सेल डाऊनलोड करताना त्रुटी: ' + err.message, 'error');
    }
  }

  /**
   * Helper to download multi-sheet Excel workbook
   */
  function downloadCompleteWorkbook(sheetsDict, defaultFilename) {
    try {
      if (typeof XLSX === 'undefined') {
        showToast('SheetJS लायब्ररी लोड झालेली नाही.', 'error');
        return;
      }
      const wb = XLSX.utils.book_new();
      let appended = 0;
      Object.keys(sheetsDict).forEach(sheetTitle => {
        const rows = sheetsDict[sheetTitle];
        if (rows && rows.length > 0) {
          const ws = XLSX.utils.json_to_sheet(rows);
          const colWidths = [];
          const keys = Object.keys(rows[0] || {});
          keys.forEach(k => {
            let maxLen = String(k).length;
            for (let i = 0; i < Math.min(rows.length, 40); i++) {
              const v = rows[i][k];
              if (v !== undefined && v !== null) {
                const len = String(v).length;
                if (len > maxLen) maxLen = len;
              }
            }
            colWidths.push({ wch: Math.min(Math.max(maxLen + 3, 10), 38) });
          });
          ws['!cols'] = colWidths;
          XLSX.utils.book_append_sheet(wb, ws, String(sheetTitle).slice(0, 31));
          appended++;
        }
      });

      if (!appended) {
        showToast('डाऊनलोड करण्यासाठी डेटा उपलब्ध नाही.', 'warn');
        return;
      }

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      triggerDownload(blob, defaultFilename);
      showToast(`✔ संपूर्ण ऑडिट एक्सेल डाऊनलोड झाली: ${defaultFilename}`);
    } catch (err) {
      console.error('Full report export error:', err);
      showToast('ऑडिट डाऊनलोड त्रुटी: ' + err.message, 'error');
    }
  }

  /**
   * Export all tables into one Excel workbook (multi-sheet)
   */
  function exportAllTablesCombined(tables) {
    try {
      if (typeof XLSX === 'undefined') {
        showToast('SheetJS लायब्ररी लोड झालेली नाही.', 'error');
        return;
      }
      const eligible = tables || getAllTables();
      if (!eligible.length) {
        showToast('या पेजवर कोणतेही टेबल सापडले नाही.', 'error');
        return;
      }

      const wb = XLSX.utils.book_new();
      const usedNames = new Set();

      eligible.forEach((tbl, idx) => {
        const rawTitle = getTableTitle(tbl, idx);
        let baseSheet = sanitizeSheetName(rawTitle, `Table_${idx + 1}`);
        let sheetName = baseSheet;
        let counter = 1;
        while (usedNames.has(sheetName.toLowerCase())) {
          sheetName = baseSheet.slice(0, 27) + `_${counter}`;
          counter++;
        }
        usedNames.add(sheetName.toLowerCase());

        const parsed = parseTableMatrix(tbl);
        const ws = createWorksheetFromMatrix(parsed);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      const pageTitle = sanitizeFileName(document.title || 'Page_Tables');
      const today = new Date().toISOString().slice(0, 10);
      const filename = `${pageTitle}_All_Tables_${today}.xlsx`;

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      triggerDownload(blob, filename);
      showToast(`✔ सर्व ${eligible.length} टेबल्स एकाच फाईलमध्ये डाऊनलोड झाली!`);
    } catch (err) {
      console.error('Export all failed:', err);
      showToast('सर्व टेबल्स एक्सपोर्ट एरर: ' + (err.message || err), 'error');
    }
  }

  /**
   * Helper to convert parsed matrix to SheetJS Worksheet
   */
  function createWorksheetFromMatrix(parsed) {
    const ws = {};
    const R = parsed.matrix.length;
    let maxC = 0;

    for (let r = 0; r < R; r++) {
      const row = parsed.matrix[r] || [];
      if (row.length > maxC) maxC = row.length;
      for (let c = 0; c < row.length; c++) {
        const item = row[c];
        if (!item || item.v === undefined || item.v === null) continue;
        const cellRef = XLSX.utils.encode_cell({ r, c });
        ws[cellRef] = {
          v: item.v,
          t: item.t || 's'
        };
      }
    }

    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(0, R - 1), c: Math.max(0, maxC - 1) } });
    if (parsed.merges && parsed.merges.length > 0) ws['!merges'] = parsed.merges;
    if (parsed.colWidths && parsed.colWidths.length > 0) ws['!cols'] = parsed.colWidths;
    return ws;
  }

  /**
   * Attach floating 1-click action bar above each table
   */
  function attachFloatingBar(table, index) {
    if (processedTables.has(table)) return;
    processedTables.add(table);

    const parent = table.parentElement;
    if (parent && window.getComputedStyle(parent).position === 'static') {
      parent.classList.add('t2e-table-relative');
    }

    const bar = document.createElement('div');
    bar.className = 't2e-floating-bar';
    bar.setAttribute('data-t2e-index', index);
    if (!showFloatingBars) {
      bar.style.display = 'none';
    }

    bar.innerHTML = `
      <div class="t2e-bar-drag" title="⠿ येथे दाबून धरून हा बार कुठेही हलवा (Drag anywhere)">⠿</div>
      <button class="t2e-btn-copy-instant" title="१-क्लिकमध्ये टेबल कॉपी करा (Excel मध्ये पेस्ट करण्यासाठी Ctrl+V)">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
        <span>१-क्लिक कॉपी</span>
      </button>
      <button class="t2e-btn-sec t2e-btn-excel" title="Excel फाईल डाऊनलोड करा (.xlsx)">
        📊 Excel
      </button>
      <button class="t2e-btn-sec t2e-btn-csv" title="CSV फाईल डाऊनलोड करा (.csv)">
        📄 CSV
      </button>
      <button class="t2e-btn-sec t2e-btn-autocheck" title="एक्सेल फाईल अपलोड करून चेकबॉक्स आपोआप सिलेक्ट/अनसिलेक्ट करा">
        ⚡ ऑटो चेकबॉक्स
      </button>
      <button class="t2e-bar-close" title="हा फ्लोटिंग बार बंद करा / काढून टाका (Remove)">✕</button>
    `;

    // Click handlers
    const dragHandle = bar.querySelector('.t2e-bar-drag');
    const copyBtn = bar.querySelector('.t2e-btn-copy-instant');
    const xlsxBtn = bar.querySelector('.t2e-btn-excel');
    const csvBtn = bar.querySelector('.t2e-btn-csv');
    const autoChkBtn = bar.querySelector('.t2e-btn-autocheck');
    const closeBtn = bar.querySelector('.t2e-bar-close');

    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyTableToClipboard(table);
    });

    xlsxBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportTableToXlsx(table);
    });

    csvBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportTableToCsv(table);
    });

    autoChkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openAutoCheckboxModal(table);
    });

    // ✕ Remove / Dismiss Floating Bar
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      bar.style.transition = 'opacity 0.2s, transform 0.2s';
      bar.style.opacity = '0';
      bar.style.transform = 'scale(0.85)';
      setTimeout(() => bar.remove(), 200);
      showToast('फ्लोटिंग बार पानावरील टेबलवरून काढला गेला.', 'info');
    });

    // ⠿ Smooth Draggable bar
    let isBarDragging = false;
    let bStartX = 0, bStartY = 0;
    let bInitLeft = 0, bInitTop = 0;

    dragHandle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      isBarDragging = true;
      bStartX = e.clientX;
      bStartY = e.clientY;

      const rect = bar.getBoundingClientRect();
      bInitLeft = rect.left;
      bInitTop = rect.top;

      bar.style.position = 'fixed';
      bar.style.right = 'auto';
      bar.style.top = `${bInitTop}px`;
      bar.style.left = `${bInitLeft}px`;
      bar.style.zIndex = '10000035';
      bar.classList.add('t2e-bar-dragging');

      document.body.style.userSelect = 'none';

      try {
        dragHandle.setPointerCapture(e.pointerId);
      } catch (err) {}

      e.preventDefault();
      e.stopPropagation();
    });

    dragHandle.addEventListener('pointermove', (e) => {
      if (!isBarDragging) return;
      const dx = e.clientX - bStartX;
      const dy = e.clientY - bStartY;

      const barW = bar.offsetWidth || 340;
      const maxL = Math.max(10, window.innerWidth - barW - 10);
      const maxT = Math.max(10, window.innerHeight - 40);

      bar.style.left = `${Math.min(Math.max(10, bInitLeft + dx), maxL)}px`;
      bar.style.top = `${Math.min(Math.max(10, bInitTop + dy), maxT)}px`;
      e.preventDefault();
    });

    const endBarDrag = (e) => {
      if (!isBarDragging) return;
      isBarDragging = false;
      bar.classList.remove('t2e-bar-dragging');
      document.body.style.userSelect = '';
      try {
        if (e && e.pointerId) dragHandle.releasePointerCapture(e.pointerId);
      } catch (err) {}
    };

    dragHandle.addEventListener('pointerup', endBarDrag);
    dragHandle.addEventListener('pointercancel', endBarDrag);

    if (table.parentNode) {
      table.parentNode.insertBefore(bar, table);
    }
  }

  function initTables() {
    const tables = getAllTables();
    tables.forEach((t, i) => attachFloatingBar(t, i));
  }

  function refreshBarsVisibility() {
    document.querySelectorAll('.t2e-floating-bar').forEach(b => {
      b.style.display = showFloatingBars ? 'inline-flex' : 'none';
    });
  }

  /**
   * Superpower: Interactive Table Picker Mode
   */
  function startTablePicker() {
    if (pickerActive) return;
    pickerActive = true;

    // Create top picker banner
    const banner = document.createElement('div');
    banner.className = 't2e-picker-banner';
    banner.innerHTML = `
      <span>🎯 ज्या टेबलचा डेटा हवा आहे त्यावर क्लिक करा</span>
      <button id="t2eCancelPicker">रद्द करा (Esc)</button>
    `;
    document.body.appendChild(banner);

    document.body.style.cursor = 'crosshair';

    const onHover = (e) => {
      const table = findClosestTable(e.target);
      document.querySelectorAll('.t2e-table-hovered').forEach(el => el.classList.remove('t2e-table-hovered'));
      if (table) table.classList.add('t2e-table-hovered');
    };

    const onClick = (e) => {
      const table = findClosestTable(e.target);
      if (table) {
        e.preventDefault();
        e.stopPropagation();
        stopPicker();
        copyTableToClipboard(table);
      }
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') stopPicker();
    };

    function stopPicker() {
      pickerActive = false;
      document.body.style.cursor = '';
      banner.remove();
      document.querySelectorAll('.t2e-table-hovered').forEach(el => el.classList.remove('t2e-table-hovered'));
      document.removeEventListener('mousemove', onHover, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
    }

    banner.querySelector('#t2eCancelPicker').addEventListener('click', stopPicker);
    document.addEventListener('mousemove', onHover, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
  }

  function highlightTableBriefly(table) {
    if (!table) return;
    table.classList.add('t2e-highlighted-table');
    setTimeout(() => table.classList.remove('t2e-highlighted-table'), 2200);
  }

  function showToast(message, type = 'success') {
    const existing = document.querySelector('.t2e-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `t2e-toast t2e-toast-${type}`;
    toast.innerHTML = `<span>📋</span> <span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(14px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 1500);
  }

  function sanitizeFileName(name) {
    return (name || 'Table').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').slice(0, 50);
  }

  function sanitizeSheetName(name, fallback = 'Sheet1') {
    return (name || fallback).replace(/[\\/:*?[\]]/g, '').trim().slice(0, 31) || fallback;
  }

  function escapeXml(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
    }[c]));
  }

  /* ==========================================================================
     ⚡ Auto Checkbox Automation Engine & UI Modal
     ========================================================================== */

  let activeAcModal = null;
  let lastUndoState = null;

  /**
   * Safe HTML / XML escaper to prevent ReferenceError and XSS in log rendering
   */
  function escapeXml(unsafe) {
    if (unsafe === undefined || unsafe === null) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Normalize key for matching (trim, lowercase, strip .0, convert Devanagari digits, remove zero-width chars)
   */
  function normalizeKey(val) {
    if (val === undefined || val === null) return '';
    let str = String(val).trim().toLowerCase();
    // Convert Devanagari/Marathi digits (०-९ -> 0-9) so Marathi & English numbers match
    str = str.replace(/[०-९]/g, d => '०१२३४५६७८९'.indexOf(d));
    // Excel numbers often turn 101 into 101.0 if parsed as float
    if (/^\d+\.0$/.test(str)) {
      str = str.replace(/\.0$/, '');
    }
    // Remove invisible characters & unicode spaces
    str = str.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\u00a0/g, ' ').trim();
    return str;
  }

  /**
   * Strip leading zeros for numeric fallback matching (e.g. '00123' <-> '123')
   */
  function stripLeadingZeros(str) {
    if (!str) return '';
    if (/^0+[0-9]+$/.test(str)) {
      return str.replace(/^0+/, '');
    }
    return str;
  }

  /**
   * Canonical key without formatting zeros or safe separators
   * Handles English & Marathi (Devanagari) properly without stripping Indian language text or survey numbers!
   */
  function canonicalKey(str) {
    if (!str) return '';
    let s = String(str).toLowerCase().trim();
    if (!s || s === '-' || s === '--' || s === 'na' || s === 'n/a') return '';
    // Normalize multiple spaces
    s = s.replace(/\s+/g, ' ');
    // Strip leading zeros between letter prefix and number (e.g. mh-frm-008122 -> mh-frm-8122, fm-09021 -> fm-9021)
    s = s.replace(/^([a-z\u0900-\u097F\-_]+)0+([1-9][0-9]*)$/i, '$1$2');
    // Strip pure leading zeros: 008122 -> 8122
    if (/^0+[1-9][0-9]*$/.test(s)) {
      s = s.replace(/^0+/, '');
    }
    return s;
  }

  /**
   * Extract header text and structure for a table
   */
  function getTableColumnInfo(table) {
    if (!table) return { headers: [], bodyRows: [], checkboxCols: [] };
    const isStandard = table instanceof HTMLTableElement;
    const allRows = isStandard ? Array.from(table.rows) : Array.from(table.querySelectorAll('tr, [role="row"]'));
    if (!allRows.length) return { headers: [], bodyRows: [], checkboxCols: [] };

    // Find the best header row (the thead row with the most th/td cells, not just the first one)
    let headerRow = null;
    const theadRows = table.querySelectorAll('thead tr');
    if (theadRows.length > 0) {
      let maxTh = -1;
      theadRows.forEach(tr => {
        const thCount = tr.querySelectorAll('th, td, [role="columnheader"]').length;
        if (thCount > maxTh) {
          maxTh = thCount;
          headerRow = tr;
        }
      });
    }

    let bodyRows = [];
    if (table.tBodies && table.tBodies.length > 0) {
      Array.from(table.tBodies).forEach(tb => {
        const rows = Array.from(tb.rows || tb.children).filter(el => el.tagName === 'TR' || el.getAttribute('role') === 'row');
        bodyRows.push(...rows);
      });
    } else {
      if (!headerRow) {
        for (let i = 0; i < allRows.length; i++) {
          if (allRows[i].querySelector('th, [role="columnheader"]')) {
            headerRow = allRows[i];
            bodyRows = allRows.slice(i + 1);
            break;
          }
        }
      } else {
        bodyRows = allRows.filter(r => r !== headerRow && !r.closest('thead'));
      }
    }

    if (!headerRow) {
      headerRow = allRows[0];
      if (!bodyRows.length) bodyRows = allRows.slice(1);
    }

    // Filter out hidden/floating bar rows, thead/tfoot rows, and rows without td data cells
    bodyRows = bodyRows.filter(r => {
      if (r === headerRow || r.closest('thead') || r.closest('tfoot')) return false;
      const s = window.getComputedStyle(r);
      if (s.display === 'none' || r.classList.contains('no') || r.classList.contains('t2e-floating-bar')) return false;
      const tdCount = r.querySelectorAll('td, [role="cell"]').length;
      return tdCount > 0;
    });

    const headerCells = headerRow ? Array.from(headerRow.querySelectorAll('th, td, [role="columnheader"], [role="cell"]')) : [];
    const headers = headerCells.map((c, idx) => {
      const txt = getCleanCellText(c);
      return {
        colIndex: idx,
        name: txt || `कॉलम ${idx + 1}`
      };
    });

    // Detect checkbox targets in body rows and map to actual column index
    const checkboxMap = new Map();
    bodyRows.slice(0, 20).forEach(row => {
      const rowCells = Array.from(row.cells || row.children).filter(c => c.tagName === 'TD' || c.tagName === 'TH' || c.getAttribute('role') === 'cell');
      const chks = row.querySelectorAll('input[type="checkbox"], [role="checkbox"]');
      chks.forEach((chk, chkIdx) => {
        if (!checkboxMap.has(chkIdx)) {
          const cell = chk.closest('td, th, [role="cell"]');
          let colName = '';
          let colIdx = -1;
          if (cell) {
            colIdx = rowCells.indexOf(cell);
            if (colIdx >= 0 && headers[colIdx]) colName = headers[colIdx].name;
          }
          checkboxMap.set(chkIdx, {
            chkIdx,
            colIdx,
            label: colName ? `चेकबॉक्स ${chkIdx + 1} (${colName} - कॉलम ${colIdx + 1})` : `चेकबॉक्स ${chkIdx + 1}`,
            count: 1
          });
        } else {
          checkboxMap.get(chkIdx).count++;
        }
      });
    });

    const checkboxCols = Array.from(checkboxMap.values());

    return {
      headers,
      bodyRows,
      checkboxCols
    };
  }

  /**
   * Helper to interpret Excel status value
   */
  function interpretStatusValue(val) {
    if (val === undefined || val === null) return null;
    const str = String(val).trim().toLowerCase();
    if (str === '') return null;

    const truthy = [
      '1', 'true', 'yes', 'y', 'check', 'checked', 'select', 'selected',
      'हजर', 'मंजूर', 'होय', 'स्वीकृत', 'पास', 'pass', 'ok', 'done',
      'present', 'approved', 'approve', 'accept', 'accepted', 'verified', 'v', 'attended'
    ];

    const falsy = [
      '0', 'false', 'no', 'n', 'uncheck', 'unchecked', 'deselect', 'deselected',
      'गैरहजर', 'नामंजूर', 'नाही', 'अस्वीकृत', 'नापास', 'fail', 'failed', 'not ok',
      'pending', 'absent', 'rejected', 'reject', 'x', 'not attended'
    ];

    if (truthy.includes(str)) return true;
    if (falsy.includes(str)) return false;

    if (!isNaN(Number(str))) {
      return Number(str) > 0;
    }

    return null;
  }

  /**
   * Safely set checkbox checked state and trigger full event lifecycle in Firefox & Chrome
   * Prevents click bouncing/inverting and ensures 100% accurate portal response
   */
  function applyCheckboxChange(checkbox, shouldBeChecked) {
    if (!checkbox) return false;
    const isAria = checkbox.getAttribute && checkbox.getAttribute('role') === 'checkbox';
    const pageWin = (typeof window !== 'undefined' && window.wrappedJSObject) ? window.wrappedJSObject : window;
    const rawEl = checkbox.wrappedJSObject || checkbox;

    // 1. ARIA checkbox
    if (isAria) {
      const currentChecked = (checkbox.getAttribute('aria-checked') === 'true');
      if (currentChecked === !!shouldBeChecked) return false;
      checkbox.setAttribute('aria-checked', shouldBeChecked ? 'true' : 'false');
      if (rawEl.setAttribute) rawEl.setAttribute('aria-checked', shouldBeChecked ? 'true' : 'false');
      if (shouldBeChecked) {
        checkbox.classList.add('checked', 'active');
        if (rawEl.classList) rawEl.classList.add('checked', 'active');
      } else {
        checkbox.classList.remove('checked', 'active');
        if (rawEl.classList) rawEl.classList.remove('checked', 'active');
      }
      try { rawEl.click(); } catch(e) { try { checkbox.click(); } catch(e2) {} }
      return true;
    }

    // 2. Standard <input type="checkbox">
    const currentChecked = !!(rawEl.checked !== undefined ? rawEl.checked : checkbox.checked);
    if (currentChecked === !!shouldBeChecked) {
      return false; // Already in desired state
    }

    // Reset React internal tracker so React registers the change
    if (rawEl._valueTracker) {
      try { rawEl._valueTracker.setValue(!shouldBeChecked); } catch (e) {}
    }

    // Set value directly using native prototype descriptor setter first
    try {
      const win = checkbox.ownerDocument?.defaultView || pageWin || window;
      const proto = win.HTMLInputElement?.prototype || window.HTMLInputElement?.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'checked')?.set;
      if (nativeSetter) {
        try { nativeSetter.call(rawEl, shouldBeChecked); } catch (e) {}
        try { nativeSetter.call(checkbox, shouldBeChecked); } catch (e) {}
      }
    } catch (e) {}

    rawEl.checked = shouldBeChecked;
    checkbox.checked = shouldBeChecked;

    if (shouldBeChecked) {
      checkbox.setAttribute('checked', 'checked');
      if (rawEl.setAttribute) rawEl.setAttribute('checked', 'checked');
    } else {
      checkbox.removeAttribute('checked');
      if (rawEl.removeAttribute) rawEl.removeAttribute('checked');
    }

    // Fallback: if native setter did not flip the state, trigger click
    if (!!rawEl.checked !== !!shouldBeChecked) {
      try {
        rawEl.click();
      } catch (e) {
        try { checkbox.click(); } catch (e2) {}
      }
    }

    // 5. Ensure visual state is 100% synchronized
    checkbox.checked = shouldBeChecked;
    rawEl.checked = shouldBeChecked;

    // 6. Dispatch 'input' and 'change' events to page window
    ['input', 'change'].forEach(evtName => {
      try {
        const evt = new Event(evtName, { bubbles: true, cancelable: true });
        rawEl.dispatchEvent(evt);
        if (rawEl !== checkbox) checkbox.dispatchEvent(evt);
      } catch (e) {}
    });

    // 7. Fire jQuery change if portal uses jQuery
    try {
      if (pageWin.jQuery) {
        pageWin.jQuery(rawEl).trigger('change');
      }
    } catch (e) {}

    return true;
  }

  /**
   * Open the Interactive Auto Checkbox Modal
   */
  function openAutoCheckboxModal(targetTable) {
    if (activeAcModal) {
      activeAcModal.remove();
      activeAcModal = null;
    }

    const allTables = getAllTables();
    let currentTable = targetTable || allTables[0];
    if (!currentTable) {
      showToast('या वेब पानावर टेबल आढळले नाही.', 'error');
      return;
    }

    currentTable.scrollIntoView({ behavior: 'smooth', block: 'center' });
    highlightTableBriefly(currentTable);

    let parsedExcelData = null;
    let excelHeaders = [];
    let isExecuting = false;

    const modal = document.createElement('div');
    modal.className = 't2e-ac-modal';
    activeAcModal = modal;

    modal.innerHTML = `
      <div class="t2e-ac-drag-handle" title="इथे दाबून पॉपअप स्क्रीनवर कुठेही हलवा (Click & Drag to move anywhere)">
        <span class="t2e-drag-icon">⋮⋮</span>
        <span>⠿ येथे धरून पॉपअप स्क्रीनवर कुठेही ड्रॅग करा (Drag to Move) ⠿</span>
        <span class="t2e-drag-icon">⋮⋮</span>
      </div>
      <div class="t2e-ac-header">
        <div class="t2e-ac-header-title">
          <div class="t2e-ac-badge-icon">⚡</div>
          <div class="t2e-ac-title-text">
            <h3>एक्सेल ऑटो चेकबॉक्स सिलेक्टर <span style="font-size:11px;font-weight:400;color:#93c5fd;">(Auto Checkbox)</span></h3>
            <p>एक्सेल अपलोड करून टेबलमधील चेकबॉक्स आपोआप सिलेक्ट / अनसिलेक्ट करा</p>
          </div>
        </div>
        <div class="t2e-ac-header-controls">
          <button class="t2e-ac-hdr-btn t2e-ac-min" title="लहान करा / मोठे करा">−</button>
          <button class="t2e-ac-hdr-btn t2e-ac-close" title="बंद करा">✕</button>
        </div>
      </div>

      <div class="t2e-ac-body">
        <div class="t2e-ac-card" style="padding: 10px 14px; background: #f8fafc;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <label class="t2e-form-label" style="margin: 0; white-space: nowrap;">🎯 लक्ष्य टेबल (Target Table):</label>
            <select id="t2eTargetTableSelect" class="t2e-form-select" style="padding: 5px 8px; font-weight: 600;">
              ${allTables.map((t, i) => `
                <option value="${i}" ${t === currentTable ? 'selected' : ''}>
                  ${getTableTitle(t, i)} (${t.rows ? t.rows.length : '?'} ओळी)
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="t2e-ac-card">
          <div class="t2e-ac-card-title">
            <span class="t2e-ac-step-num">१</span>
            <span>एक्सेल किंवा CSV फाईल अपलोड करा (Upload Excel/CSV)</span>
          </div>

          <div class="t2e-dropzone" id="t2eDropzone">
            <input type="file" class="t2e-file-input" id="t2eFileInput" accept=".xlsx, .xls, .csv">
            <div class="t2e-dropzone-icon">📊</div>
            <div class="t2e-dropzone-text">एक्सेल फाईल येथे ड्रॅग करा किंवा फाईल निवडण्यासाठी क्लिक करा</div>
            <div class="t2e-dropzone-sub">.xlsx, .xls किंवा .csv फाईल्सना सपोर्ट (Offline & Secure)</div>
          </div>

          <div class="t2e-file-info" id="t2eFileInfo" style="display: none;">
            <div class="t2e-file-info-left">
              <span>📄</span>
              <span id="t2eFileName">data.xlsx</span>
              <span id="t2eRowCount" class="pill pill-green" style="font-size: 11px; padding: 2px 8px;">० ओळी</span>
            </div>
            <div id="t2eSheetSelectorContainer" style="display: none; align-items: center; gap: 6px;">
              <span style="font-size: 11px;">शीट:</span>
              <select id="t2eSheetSelect" class="t2e-form-select" style="padding: 2px 6px; width: auto; font-size: 11px;"></select>
            </div>
          </div>
        </div>

        <div class="t2e-ac-card" id="t2eStep2Card" style="display: none;">
          <div class="t2e-ac-card-title">
            <span class="t2e-ac-step-num">२</span>
            <span>कॉलम्स मॅच करा (Match Columns by ID / Name)</span>
          </div>

          <!-- Matching Mode Toggle (Single vs Dual Key) -->
          <div style="background: #f1f5f9; padding: 7px 12px; border-radius: 8px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; border: 1px solid #e2e8f0;">
            <span style="font-weight: 700; font-size: 11px; color: #334155;">🎯 मॅचिंग पद्धत:</span>
            <div style="display: flex; gap: 14px; font-size: 11px;">
              <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: 600;">
                <input type="radio" name="t2eKeyMode" value="single" id="t2eKeyModeSingle"> सिंगल कॉलम
              </label>
              <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: 700; color: #15803d;">
                <input type="radio" name="t2eKeyMode" value="dual" id="t2eKeyModeDual" checked> 🌾 दुहेरी कॉलम (Farmer ID + Farm ID)
              </label>
            </div>
          </div>

          <!-- Key 1 (Primary Key - e.g. Farmer ID) -->
          <div class="t2e-grid-2" id="t2eKey1Row">
            <div class="t2e-form-group">
              <label class="t2e-form-label" for="t2eExcelKeySelect" id="t2eExcelKey1Label">
                📊 एक्सेल: Farmer ID कॉलम:
              </label>
              <select id="t2eExcelKeySelect" class="t2e-form-select"></select>
            </div>

            <div class="t2e-form-group">
              <label class="t2e-form-label" for="t2eWebKeySelect" id="t2eWebKey1Label">
                🌐 वेबपेज: Farmer ID कॉलम:
              </label>
              <select id="t2eWebKeySelect" class="t2e-form-select"></select>
            </div>
          </div>

          <!-- Key 2 (Secondary Key - e.g. Farm ID) -->
          <div class="t2e-grid-2" id="t2eKey2Row" style="margin-top: 2px;">
            <div class="t2e-form-group">
              <label class="t2e-form-label" for="t2eExcelKey2Select">
                📊 एक्सेल: Farm ID कॉलम:
              </label>
              <select id="t2eExcelKey2Select" class="t2e-form-select"></select>
            </div>

            <div class="t2e-form-group">
              <label class="t2e-form-label" for="t2eWebKey2Select">
                🌐 वेबपेज: Farm ID कॉलम:
              </label>
              <select id="t2eWebKey2Select" class="t2e-form-select"></select>
            </div>
          </div>

          <div class="t2e-form-group" id="t2eTargetCheckboxContainer" style="margin-top: 6px;">
            <label class="t2e-form-label" for="t2eTargetCheckboxSelect">
              ☑️ पानावरील कोणता चेकबॉक्स भरायचा?
            </label>
            <select id="t2eTargetCheckboxSelect" class="t2e-form-select"></select>
          </div>

          <!-- Feature: Verify / Preview Matching Data -->
          <div style="margin-top: 10px; background: #f0fdf4; border: 1.5px solid #22c55e; border-radius: 8px; padding: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
              <div>
                <strong style="color: #166534; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                  <span>🔍</span> <span>एक्सेल मॅचिंग डेटा तपासणी (Match Verification)</span>
                </strong>
                <p style="margin: 2px 0 0; font-size: 11px; color: #15803d;">चेकबॉक्स भरण्यापूर्वी कोणता डेटा मॅच झाला आहे हे येथे तपासा</p>
              </div>
              <button type="button" id="t2eBtnPreviewMatch" class="t2e-btn-secondary" style="background: #16a34a; color: #ffffff; border: none; font-weight: 700; padding: 7px 14px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 12px; box-shadow: 0 2px 6px rgba(22, 163, 74, 0.3);">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                <span>मॅच होणारा डेटा तपासा</span>
              </button>
            </div>

            <!-- 3 Stat Tiles -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 8px; text-align: center;">
              <div style="background: #ffffff; padding: 6px; border-radius: 6px; border: 1.5px solid #86efac;">
                <div style="font-size: 10px; color: #166534; font-weight: 700;">✓ मॅच होणाऱ्या (Tick होतील)</div>
                <div style="font-size: 18px; font-weight: 800; color: #15803d;" id="t2ePrevMatchedCount">०</div>
              </div>
              <div style="background: #ffffff; padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1;">
                <div style="font-size: 10px; color: #475569; font-weight: 600;">⚪ मॅच नसलेल्या (तसेच राहतील)</div>
                <div style="font-size: 18px; font-weight: 800; color: #64748b;" id="t2ePrevUnmatchedCount">०</div>
              </div>
              <div style="background: #ffffff; padding: 6px; border-radius: 6px; border: 1px solid #fed7aa;">
                <div style="font-size: 10px; color: #9a3412; font-weight: 600;">⚠️ वेबवर नसलेले Excel</div>
                <div style="font-size: 18px; font-weight: 800; color: #ea580c;" id="t2ePrevMissingCount">०</div>
              </div>
            </div>

            <!-- Detailed Preview Box (Toggleable/Expandable) -->
            <div class="t2e-match-preview-card" id="t2eMatchPreviewCard" style="display: none; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; margin-top: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                <div style="display: flex; gap: 4px;" id="t2ePrevTabs">
                  <button type="button" class="t2e-prev-tab active" data-tab="matched" style="font-size: 11px; padding: 4px 8px; border-radius: 4px; border: 1px solid #16a34a; background: #16a34a; color: #fff; cursor: pointer; font-weight: 700;">
                    ✓ मॅच झालेला डेटा (<span id="t2eTabMatchedCount">०</span>)
                  </button>
                  <button type="button" class="t2e-prev-tab" data-tab="unmatched" style="font-size: 11px; padding: 4px 8px; border-radius: 4px; border: 1px solid #cbd5e1; background: #f8fafc; color: #475569; cursor: pointer;">
                    ⚪ मॅच नसलेला डेटा (<span id="t2eTabUnmatchedCount">०</span>)
                  </button>
                  <button type="button" class="t2e-prev-tab" data-tab="missing" style="font-size: 11px; padding: 4px 8px; border-radius: 4px; border: 1px solid #fed7aa; background: #fff7ed; color: #c2410c; cursor: pointer;">
                    ⚠️ वेबवर नसलेला Excel (<span id="t2eTabMissingCount">०</span>)
                  </button>
                </div>
                <input type="text" id="t2ePrevSearchInput" placeholder="🔎 आयडी / नाव शोधा..." style="font-size: 11px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; width: 140px;">
              </div>

              <div style="max-height: 190px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 4px; background: #fff;">
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                  <thead style="background: #f8fafc; position: sticky; top: 0; z-index: 1;">
                    <tr id="t2ePrevTableHeaderRow">
                      <th style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: left;">#</th>
                      <th style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: left;">Farmer ID</th>
                      <th style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: left;">Farm ID</th>
                      <th style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: left;">शेतकरी नाव / डेटा</th>
                      <th style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">अपेक्षित क्रिया</th>
                    </tr>
                  </thead>
                  <tbody id="t2ePrevTableBody"></tbody>
                </table>
              </div>

              <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                <span style="font-size: 11px; color: #64748b;" id="t2ePrevShowingCount">दाखवत आहे: सर्व नोंदी</span>
                <div style="display: flex; gap: 6px;">
                  <button type="button" id="t2eBtnDownloadMatchedPrev" class="t2e-btn-secondary" style="font-size: 11px; padding: 4px 10px; cursor: pointer; color: #166534; font-weight: 700; background: #dcfce7; border: 1px solid #86efac;">
                    📥 मॅच झालेला डेटा (.xlsx) डाऊनलोड
                  </button>
                  <button type="button" id="t2eBtnClosePreview" class="t2e-btn-secondary" style="padding: 4px 10px; font-size: 11px; cursor: pointer;">
                    ✕ लपवा
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="t2e-ac-card" id="t2eStep3Card" style="display: none;">
          <div class="t2e-ac-card-title">
            <span class="t2e-ac-step-num">३</span>
            <span>चेकबॉक्स कसा भरायचा? (Action Mode)</span>
          </div>

          <div class="t2e-radio-group">
            <label class="t2e-radio-option t2e-active">
              <input type="radio" name="t2eActionMode" value="checkMatchedUncheckOthers" checked>
              <div class="t2e-radio-content">
                <strong>🎯 १. फक्त Excel मध्ये मॅच होणारे Check (✓) करा आणि मॅच नसलेले Uncheck (✗) करा (शिफारस - १००% अचूक)</strong>
                <span>एक्सेल फाईलमध्ये ज्यांचा Farmer ID + Farm ID मॅच होईल <b>फक्त तेच Check</b> होतील. बाकीचे सर्व आपोआप <b>Uncheck</b> होतील.</span>
              </div>
            </label>

            <label class="t2e-radio-option">
              <input type="radio" name="t2eActionMode" value="onlyCheckMatched">
              <div class="t2e-radio-content">
                <strong>✓ २. फक्त Excel मधील मॅच नोंदी Check करा (इतर चेकबॉक्स जसे आहेत तसेच ठेवा)</strong>
                <span>फक्त मॅच होणारे Check होतील. आधीपासून टिक असलेले इतर चेकबॉक्स तसेच राहतील (बदल नाही).</span>
              </div>
            </label>

            <label class="t2e-radio-option">
              <input type="radio" name="t2eActionMode" value="statusCol">
              <div class="t2e-radio-content">
                <strong>📊 ३. Excel मधील स्टेटस / रिस्पॉन्स कॉलम नुसार (1=Check, 0=Uncheck)</strong>
                <span>एक्सेल कॉलममध्ये 1/Yes/मंजूर असल्यास <b>Check</b> आणि 0/No असल्यास <b>Uncheck</b> होईल.</span>
              </div>
            </label>

            <div id="t2eStatusColContainer" style="display: none; margin: 4px 0 6px 26px;">
              <div class="t2e-grid-2">
                <div>
                  <label class="t2e-form-label" style="font-size: 11px;">एक्सेल मधील स्टेटस कॉलम:</label>
                  <select id="t2eStatusColSelect" class="t2e-form-select"></select>
                </div>
                <div>
                  <label class="t2e-form-label" style="font-size: 11px;">एक्सेलमध्ये रिकामे (Blank) असल्यास:</label>
                  <select id="t2eBlankActionSelect" class="t2e-form-select">
                    <option value="skip" selected>काहीही करू नका (जसे आहे तसेच ठेवा)</option>
                    <option value="uncheck">Uncheck करा</option>
                  </select>
                </div>
              </div>
            </div>

            <label class="t2e-radio-option">
              <input type="radio" name="t2eActionMode" value="uncheckAllFound">
              <div class="t2e-radio-content">
                <strong>✗ ४. फक्त Excel मधील मॅच होणाऱ्या नोंदी Uncheck (Deselect) करा</strong>
                <span>एक्सेल फाईलमध्ये असणाऱ्या सर्व नोंदींचे चेकबॉक्स अनटिक होतील (बाकीचे सर्व तसेच राहतील).</span>
              </div>
            </label>
          </div>

          <div style="margin-top: 12px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 10px;">
            <label class="t2e-form-label" style="margin: 0; font-size: 11px;">⚙️ प्रक्रियेचा वेग (Speed):</label>
            <select id="t2eSpeedSelect" class="t2e-form-select" style="width: auto; padding: 4px 8px; font-size: 11px;">
              <option value="0">⚡ सुपरफास्ट (Instant - एका क्षणात)</option>
              <option value="40">🚀 वेगवान (४० ms / ओळ)</option>
              <option value="80" selected>🛡️ सुरक्षित (८० ms / ओळ - सर्व्हर रिस्पॉन्ससाठी शिफारस)</option>
              <option value="150">⏳ सावकाश (१५० ms / ओळ - स्लो सर्व्हरसाठी)</option>
            </select>
          </div>
        </div>

        <div class="t2e-ac-card" id="t2eStep4Card" style="display: none;">
          <!-- ⚡ Instant 1-Click All Matching Checkbox Button -->
          <button id="t2eBtnInstantBatchCheck" class="t2e-btn-primary-action" style="background: linear-gradient(135deg, #059669, #10b981); box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4); margin-bottom: 8px; font-size: 13px; padding: 11px 14px; width: 100%; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; color: #ffffff; cursor: pointer; border: none;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>
            <span>⚡ सरसकट एका क्लिकवर सर्व मॅचिंग टिक करा (Instant 1-Click All)</span>
          </button>

          <!-- Quick Blanket Actions Grid: सरसकट सर्व टिक / अनटिक -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
            <button id="t2eBtnCheckAllTable" type="button" class="t2e-btn-secondary" style="background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; font-weight: 700; padding: 7px 8px; display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 11px; border-radius: 6px; cursor: pointer;">
              <span>☑️</span>
              <span>सरसकट सर्व टिक करा (All Tick)</span>
            </button>
            <button id="t2eBtnUncheckAllTable" type="button" class="t2e-btn-secondary" style="background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; font-weight: 700; padding: 7px 8px; display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 11px; border-radius: 6px; cursor: pointer;">
              <span>⬜</span>
              <span>सरसकट सर्व अनटिक करा (All Untick)</span>
            </button>
          </div>

          <!-- Secondary Step-by-Step with Delay Animation Button -->
          <button id="t2eBtnStartAutoCheck" class="t2e-btn-secondary" style="width: 100%; border: 1px dashed #94a3b8; font-size: 11px; padding: 7px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 6px; background: #f8fafc; border-radius: 6px; cursor: pointer;">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.05.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.01-4.09l-2.45-1.45C16.29 18.06 14.28 19 12 19z"/></svg>
            <span>🚀 ॲनिमेशनसह स्टेप-बाय-स्टेप भरा (Step-by-Step Auto Fill)</span>
          </button>

          <div class="t2e-progress-container" id="t2eProgressContainer">
            <div class="t2e-progress-labels">
              <span id="t2eProgressText">प्रगती: ० / ० (०%)</span>
              <span id="t2eProgressPercent">०%</span>
            </div>
            <div class="t2e-progress-track">
              <div class="t2e-progress-fill" id="t2eProgressFill"></div>
            </div>
          </div>

          <div class="t2e-metrics-grid" id="t2eMetricsGrid" style="display: none;">
            <div class="t2e-metric-pill t2e-pill-total">
              <div class="t2e-metric-num" id="t2eMetricTotal">०</div>
              <div class="t2e-metric-lbl">टेबल ओळी</div>
            </div>
            <div class="t2e-metric-pill t2e-pill-success">
              <div class="t2e-metric-num" id="t2eMetricChecked">०</div>
              <div class="t2e-metric-lbl">Checked (✓)</div>
            </div>
            <div class="t2e-metric-pill t2e-pill-uncheck">
              <div class="t2e-metric-num" id="t2eMetricUnchecked">०</div>
              <div class="t2e-metric-lbl">Unchecked (✗)</div>
            </div>
            <div class="t2e-metric-pill t2e-pill-warn">
              <div class="t2e-metric-num" id="t2eMetricUnmatched">०</div>
              <div class="t2e-metric-lbl">न सापडलेले / त्रुटी</div>
            </div>
          </div>

          <!-- Dedicated Export Section for Unticked & Error Data -->
          <div class="t2e-export-section" id="t2eExportSection" style="display: none;">
            <div class="t2e-export-header">
              <span style="font-size:12px; font-weight:700; color:#1e293b;">📥 निकाल आणि डाऊनलोड पर्याय (Export):</span>
              <span class="t2e-export-badge" id="t2eUntickedBadge">० टिक न झालेले</span>
            </div>

            <!-- Primary Export Actions Grid: Ticked & Unticked -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
              <button id="t2eBtnDownloadTickedXlsx" class="t2e-btn-download-primary" style="background: linear-gradient(135deg, #16a34a, #15803d); border-color: #15803d;" title="ज्यांचे चेकबॉक्स टिक झाले आहेत अशा सर्व ओळींची एक्सेल फाईल डाऊनलोड करा">
                <span style="font-size: 16px;">✓</span>
                <div style="text-align: left; line-height: 1.2; flex: 1;">
                  <strong style="font-size: 11px; display: block;">मॅच / टिक झालेला डेटा (.xlsx)</strong>
                  <span style="font-size: 10px; opacity: 0.95;" id="t2eTickedSubtitle">० ओळी</span>
                </div>
              </button>

              <button id="t2eBtnDownloadUntickedXlsx" class="t2e-btn-download-primary" style="background: linear-gradient(135deg, #dc2626, #b91c1c); border-color: #b91c1c;" title="ज्यांचे चेकबॉक्स टिक झाले नाहीत अशा सर्व ओळींची एक्सेल फाईल डाऊनलोड करा">
                <span style="font-size: 16px;">✗</span>
                <div style="text-align: left; line-height: 1.2; flex: 1;">
                  <strong style="font-size: 11px; display: block;">टिक न झालेला डेटा (.xlsx)</strong>
                  <span style="font-size: 10px; opacity: 0.95;" id="t2eUntickedSubtitle">० ओळी</span>
                </div>
              </button>
            </div>

            <!-- Secondary Actions Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 4px;">
              <button id="t2eBtnDownloadMissingExcel" class="t2e-btn-download-outline" title="एक्सेलमध्ये असूनही वेबपेजवर न सापडलेल्या नोंदींची फाईल">
                <span>⚠️</span>
                <span>वेबवर न सापडलेले (<span id="t2eMissingCount">०</span>)</span>
              </button>
              <button id="t2eBtnDownloadFullReportXlsx" class="t2e-btn-download-outline" title="सर्व ओळींचा स्टेटससहित संपूर्ण एक्सेल रिपोर्ट">
                <span>📊</span>
                <span>कम्प्लीट ऑडिट (.xlsx)</span>
              </button>
            </div>
          </div>

          <!-- Log Box with Category Filters -->
          <div class="t2e-log-box-wrapper" id="t2eLogBoxWrapper" style="display: none; margin-top: 10px;">
            <div class="t2e-log-filters">
              <button class="t2e-filter-btn active" data-filter="all">सर्व (<span id="t2eFilterCountAll">०</span>)</button>
              <button class="t2e-filter-btn" data-filter="unticked" style="color:#b91c1c;">✗ टिक न झालेले (<span id="t2eFilterCountUnticked">०</span>)</button>
              <button class="t2e-filter-btn" data-filter="checked" style="color:#15803d;">✓ टिक झालेले (<span id="t2eFilterCountChecked">०</span>)</button>
              <button class="t2e-filter-btn" data-filter="error" style="color:#c2410c;">⚠️ त्रुटी / न सापडलेले (<span id="t2eFilterCountError">०</span>)</button>
            </div>

            <div class="t2e-log-box" id="t2eLogBox" style="display: block;">
              <table class="t2e-log-table">
                <thead>
                  <tr>
                    <th style="width: 30px;">#</th>
                    <th>की (Key/ID)</th>
                    <th>एक्सेल व्हॅल्यू</th>
                    <th>कृती (Action)</th>
                  </tr>
                </thead>
                <tbody id="t2eLogTbody"></tbody>
              </table>
            </div>
          </div>

          <div class="t2e-btn-row" id="t2ePostActionsRow" style="display: none; margin-top: 10px;">
            <button id="t2eBtnUndo" class="t2e-btn-secondary" title="सर्व चेकबॉक्स आधीसारखे पूर्ववत करा">
              ↺ पूर्ववत करा (Undo)
            </button>
            <button id="t2eBtnExportAudit" class="t2e-btn-secondary" title="ऑडिट रिपोर्ट CSV डाऊनलोड करा">
              📄 ऑडिट CSV
            </button>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(modal);

    setupModalDrag(modal);

    const minBtn = modal.querySelector('.t2e-ac-min');
    const closeBtn = modal.querySelector('.t2e-ac-close');
    const bodyEl = modal.querySelector('.t2e-ac-body');

    closeBtn.addEventListener('click', () => {
      modal.remove();
      activeAcModal = null;
    });

    let isMinimized = false;
    minBtn.addEventListener('click', () => {
      isMinimized = !isMinimized;
      bodyEl.style.display = isMinimized ? 'none' : 'flex';
      minBtn.textContent = isMinimized ? '+' : '−';
      modal.style.height = isMinimized ? 'auto' : '';
    });

    const targetTableSelect = modal.querySelector('#t2eTargetTableSelect');
    const dropzone = modal.querySelector('#t2eDropzone');
    const fileInput = modal.querySelector('#t2eFileInput');
    const fileInfo = modal.querySelector('#t2eFileInfo');
    const fileNameEl = modal.querySelector('#t2eFileName');
    const rowCountEl = modal.querySelector('#t2eRowCount');
    const sheetSelectContainer = modal.querySelector('#t2eSheetSelectorContainer');
    const sheetSelect = modal.querySelector('#t2eSheetSelect');

    const step2Card = modal.querySelector('#t2eStep2Card');
    const keyModeRadios = modal.querySelectorAll('input[name="t2eKeyMode"]');
    const key1Row = modal.querySelector('#t2eKey1Row');
    const key2Row = modal.querySelector('#t2eKey2Row');
    const excelKeySelect = modal.querySelector('#t2eExcelKeySelect');
    const webKeySelect = modal.querySelector('#t2eWebKeySelect');
    const excelKey2Select = modal.querySelector('#t2eExcelKey2Select');
    const webKey2Select = modal.querySelector('#t2eWebKey2Select');
    const excelKey1Label = modal.querySelector('#t2eExcelKey1Label');
    const webKey1Label = modal.querySelector('#t2eWebKey1Label');
    const targetCheckboxSelect = modal.querySelector('#t2eTargetCheckboxSelect');
    const btnPreviewMatch = modal.querySelector('#t2eBtnPreviewMatch');
    const matchPreviewCard = modal.querySelector('#t2eMatchPreviewCard');
    const btnClosePreview = modal.querySelector('#t2eBtnClosePreview');
    const btnDownloadMatchedPrev = modal.querySelector('#t2eBtnDownloadMatchedPrev');

    function updateMatchPreviewLive() {
      if (parsedExcelData && parsedExcelData.length > 0) {
        previewMatchingData(true);
      }
    }

    keyModeRadios.forEach(r => {
      r.addEventListener('change', () => {
        const isDual = (modal.querySelector('input[name="t2eKeyMode"]:checked')?.value || 'dual') === 'dual';
        key2Row.style.display = isDual ? 'grid' : 'none';
        if (isDual) {
          excelKey1Label.textContent = '📊 एक्सेल: १ ला मॅचिंग कॉलम (Key 1):';
          webKey1Label.textContent = '🌐 वेबपेज: १ ला मॅचिंग कॉलम:';
        } else {
          excelKey1Label.textContent = '📊 एक्सेल मधील मॅचिंग आयडी / कॉलम:';
          webKey1Label.textContent = '🌐 वेबपेज टेबल मधील मॅचिंग कॉलम:';
        }
        updateMatchPreviewLive();
      });
    });

    [excelKeySelect, webKeySelect, excelKey2Select, webKey2Select].forEach(sel => {
      if (sel) {
        sel.addEventListener('change', updateMatchPreviewLive);
      }
    });

    const prevSearchInput = modal.querySelector('#t2ePrevSearchInput');
    const prevTabs = modal.querySelectorAll('.t2e-prev-tab');

    if (btnPreviewMatch) {
      btnPreviewMatch.addEventListener('click', () => {
        previewMatchingData(false);
        if (matchPreviewCard) matchPreviewCard.style.display = 'block';
      });
    }

    if (btnClosePreview) {
      btnClosePreview.addEventListener('click', () => {
        if (matchPreviewCard) matchPreviewCard.style.display = 'none';
      });
    }

    if (btnDownloadMatchedPrev) {
      btnDownloadMatchedPrev.addEventListener('click', () => {
        downloadMatchedPreviewData();
      });
    }

    if (prevTabs.length) {
      prevTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          prevTabs.forEach(t => {
            t.classList.remove('active');
            t.style.background = '#f8fafc';
            t.style.color = '#475569';
            t.style.fontWeight = 'normal';
          });
          tab.classList.add('active');
          const tType = tab.getAttribute('data-tab');
          tab.style.background = tType === 'matched' ? '#16a34a' : (tType === 'missing' ? '#ea580c' : '#64748b');
          tab.style.color = '#ffffff';
          tab.style.fontWeight = '700';
          activePreviewTab = tType;
          renderPreviewRows();
        });
      });
    }

    if (prevSearchInput) {
      prevSearchInput.addEventListener('input', () => {
        renderPreviewRows();
      });
    }

    const step3Card = modal.querySelector('#t2eStep3Card');
    const statusColContainer = modal.querySelector('#t2eStatusColContainer');
    const statusColSelect = modal.querySelector('#t2eStatusColSelect');

    modal.querySelectorAll('input[name="t2eActionMode"]').forEach(radio => {
      radio.addEventListener('change', () => {
        modal.querySelectorAll('.t2e-radio-option').forEach(l => l.classList.remove('t2e-active'));
        radio.closest('.t2e-radio-option').classList.add('t2e-active');
        if (radio.value === 'statusCol') {
          statusColContainer.style.display = 'block';
        } else {
          statusColContainer.style.display = 'none';
        }
      });
    });

    const step4Card = modal.querySelector('#t2eStep4Card');
    const btnInstantBatchCheck = modal.querySelector('#t2eBtnInstantBatchCheck');
    const btnCheckAllTable = modal.querySelector('#t2eBtnCheckAllTable');
    const btnUncheckAllTable = modal.querySelector('#t2eBtnUncheckAllTable');
    const btnStartAutoCheck = modal.querySelector('#t2eBtnStartAutoCheck');
    const progressContainer = modal.querySelector('#t2eProgressContainer');
    const progressText = modal.querySelector('#t2eProgressText');
    const progressPercent = modal.querySelector('#t2eProgressPercent');
    const progressFill = modal.querySelector('#t2eProgressFill');

    const metricsGrid = modal.querySelector('#t2eMetricsGrid');
    const metricTotal = modal.querySelector('#t2eMetricTotal');
    const metricChecked = modal.querySelector('#t2eMetricChecked');
    const metricUnchecked = modal.querySelector('#t2eMetricUnchecked');
    const metricUnmatched = modal.querySelector('#t2eMetricUnmatched');

    const exportSection = modal.querySelector('#t2eExportSection');
    const untickedBadge = modal.querySelector('#t2eUntickedBadge');
    const untickedSubtitle = modal.querySelector('#t2eUntickedSubtitle');
    const btnDownloadTickedXlsx = modal.querySelector('#t2eBtnDownloadTickedXlsx');
    const tickedSubtitle = modal.querySelector('#t2eTickedSubtitle');
    const btnDownloadUntickedXlsx = modal.querySelector('#t2eBtnDownloadUntickedXlsx');
    const btnDownloadMissingExcel = modal.querySelector('#t2eBtnDownloadMissingExcel');
    const missingCountEl = modal.querySelector('#t2eMissingCount');
    const btnDownloadFullReportXlsx = modal.querySelector('#t2eBtnDownloadFullReportXlsx');
    const logBoxWrapper = modal.querySelector('#t2eLogBoxWrapper');
    const filterBtns = modal.querySelectorAll('.t2e-filter-btn');
    const filterCountAll = modal.querySelector('#t2eFilterCountAll');
    const filterCountUnticked = modal.querySelector('#t2eFilterCountUnticked');
    const filterCountChecked = modal.querySelector('#t2eFilterCountChecked');
    const filterCountError = modal.querySelector('#t2eFilterCountError');

    const logBox = modal.querySelector('#t2eLogBox');
    const logTbody = modal.querySelector('#t2eLogTbody');
    const postActionsRow = modal.querySelector('#t2ePostActionsRow');
    const btnUndo = modal.querySelector('#t2eBtnUndo');
    const btnExportAudit = modal.querySelector('#t2eBtnExportAudit');

    let currentAuditRows = [];
    let currentUntickedRows = [];
    let currentTickedRows = [];
    let currentMissingExcelRows = [];
    let currentAllProcessedRows = [];
    let currentLogItems = [];

    targetTableSelect.addEventListener('change', () => {
      const idx = parseInt(targetTableSelect.value, 10);
      currentTable = allTables[idx] || currentTable;
      currentTable.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightTableBriefly(currentTable);
      populateWebColumnOptions();
    });

    function populateWebColumnOptions() {
      const info = getTableColumnInfo(currentTable);
      webKeySelect.innerHTML = '';
      webKey2Select.innerHTML = '';
      info.headers.forEach(h => {
        const opt1 = document.createElement('option');
        opt1.value = h.colIndex;
        opt1.textContent = `${h.name} (कॉलम ${h.colIndex + 1})`;
        webKeySelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = h.colIndex;
        opt2.textContent = `${h.name} (कॉलम ${h.colIndex + 1})`;
        webKey2Select.appendChild(opt2);
      });

      targetCheckboxSelect.innerHTML = '';
      if (info.checkboxCols.length === 0) {
        const opt = document.createElement('option');
        opt.value = 0;
        opt.setAttribute('data-col-idx', -1);
        opt.textContent = 'आपोआप शोधलेला चेकबॉक्स (१ ला इनपुट)';
        targetCheckboxSelect.appendChild(opt);
      } else {
        info.checkboxCols.forEach(chk => {
          const opt = document.createElement('option');
          opt.value = chk.chkIdx;
          opt.setAttribute('data-col-idx', chk.colIdx);
          opt.textContent = chk.label;
          targetCheckboxSelect.appendChild(opt);
        });
      }

      smartAutoMapColumns();
    }

    populateWebColumnOptions();


    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('t2e-dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('t2e-dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        handleExcelFile(files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        handleExcelFile(fileInput.files[0]);
      }
    });

    // Also allow dropping Excel file anywhere onto the modal window
    modal.addEventListener('dragover', (e) => {
      if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault();
        dropzone.classList.add('t2e-dragover');
      }
    });

    modal.addEventListener('dragleave', (e) => {
      if (!modal.contains(e.relatedTarget)) {
        dropzone.classList.remove('t2e-dragover');
      }
    });

    modal.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('t2e-dragover');
        handleExcelFile(e.dataTransfer.files[0]);
      }
    });

    function handleExcelFile(file) {
      if (!file) return;
      if (typeof XLSX === 'undefined') {
        showToast('SheetJS लायब्ररी लोड झालेली नाही. कृपया पान रिफ्रेश करा.', 'error');
        return;
      }

      fileNameEl.textContent = file.name;
      fileInfo.style.display = 'flex';
      rowCountEl.textContent = 'वाचत आहे...';

      function processWorkbook(workbook) {
        if (!workbook || !workbook.SheetNames || !workbook.SheetNames.length) {
          showToast('एक्सेल फाईलमध्ये शीट सापडले नाही.', 'error');
          return;
        }

        if (workbook.SheetNames.length > 1) {
          sheetSelectContainer.style.display = 'flex';
          sheetSelect.innerHTML = '';
          workbook.SheetNames.forEach(sName => {
            const opt = document.createElement('option');
            opt.value = sName;
            opt.textContent = sName;
            sheetSelect.appendChild(opt);
          });
          sheetSelect.onchange = () => loadSheetData(workbook, sheetSelect.value);
        } else {
          sheetSelectContainer.style.display = 'none';
        }

        loadSheetData(workbook, workbook.SheetNames[0]);
      }

      // Safe multi-strategy reader for Firefox & Chrome (bypasses Firefox XrayVision "Permission denied to access property constructor")
      function readWithDataUrl() {
        const r1 = new FileReader();
        r1.onload = function (e1) {
          try {
            const str = e1.target && e1.target.result;
            if (typeof str === 'string') {
              const b64 = str.indexOf(',') >= 0 ? str.split(',')[1] : str;
              const wb = XLSX.read(b64, { type: 'base64', cellDates: true });
              processWorkbook(wb);
              return;
            }
            readWithBinaryString();
          } catch (err1) {
            console.warn('DataURL/base64 read failed, trying binary string:', err1);
            readWithBinaryString();
          }
        };
        r1.onerror = () => readWithBinaryString();
        try {
          r1.readAsDataURL(file);
        } catch (e) {
          readWithBinaryString();
        }
      }

      function readWithBinaryString() {
        if (typeof FileReader.prototype.readAsBinaryString === 'function') {
          const r2 = new FileReader();
          r2.onload = function (e2) {
            try {
              const bin = e2.target && e2.target.result;
              const wb = XLSX.read(bin, { type: 'binary', cellDates: true });
              processWorkbook(wb);
            } catch (err2) {
              console.warn('BinaryString read failed, trying text:', err2);
              readWithText();
            }
          };
          r2.onerror = () => readWithText();
          try {
            r2.readAsBinaryString(file);
          } catch (e) {
            readWithText();
          }
        } else {
          readWithText();
        }
      }

      function readWithText() {
        const r3 = new FileReader();
        r3.onload = function (e3) {
          try {
            const txt = e3.target && e3.target.result;
            const wb = XLSX.read(txt, { type: 'string', cellDates: true });
            processWorkbook(wb);
          } catch (err3) {
            console.error('All Excel reading strategies failed:', err3);
            showToast('एक्सेल वाचताना त्रुटी: ' + (err3.message || err3), 'error');
          }
        };
        r3.onerror = function (e) {
          console.error('FileReader error:', e);
          showToast('एक्सेल फाईल वाचता आली नाही.', 'error');
        };
        try {
          r3.readAsText(file);
        } catch (e) {
          showToast('एक्सेल वाचताना त्रुटी: ' + (e.message || e), 'error');
        }
      }

      readWithDataUrl();
    }

    function loadSheetData(workbook, sheetName) {
      const ws = workbook.Sheets[sheetName];
      if (!ws) return;

      const rawJson = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!rawJson || rawJson.length === 0) {
        rowCountEl.textContent = '० ओळी (शीट रिकामे आहे)';
        return;
      }

      parsedExcelData = rawJson;
      rowCountEl.textContent = `${parsedExcelData.length} ओळी सापडल्या`;

      const headerSet = new Set();
      parsedExcelData.slice(0, 10).forEach(r => {
        Object.keys(r).forEach(k => headerSet.add(k));
      });
      excelHeaders = Array.from(headerSet);

      excelKeySelect.innerHTML = '';
      excelKey2Select.innerHTML = '';
      statusColSelect.innerHTML = '';

      excelHeaders.forEach(col => {
        const opt1 = document.createElement('option');
        opt1.value = col;
        opt1.textContent = col;
        excelKeySelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = col;
        opt2.textContent = col;
        excelKey2Select.appendChild(opt2);

        const opt3 = document.createElement('option');
        opt3.value = col;
        opt3.textContent = col;
        statusColSelect.appendChild(opt3);
      });

      step2Card.style.display = 'block';
      step3Card.style.display = 'block';
      step4Card.style.display = 'block';

      smartAutoMapColumns();
    }

    let lastPreviewMatchedList = [];
    let lastPreviewUnmatchedList = [];
    let lastPreviewMissingList = [];
    let activePreviewTab = 'matched';

    function renderPreviewRows() {
      const previewTableBody = modal.querySelector('#t2ePrevTableBody');
      const showingCountEl = modal.querySelector('#t2ePrevShowingCount');
      const prevSearchInput = modal.querySelector('#t2ePrevSearchInput');
      const searchTerm = prevSearchInput ? prevSearchInput.value.trim().toLowerCase() : '';

      if (!previewTableBody) return;
      previewTableBody.innerHTML = '';

      let sourceList = [];
      if (activePreviewTab === 'matched') sourceList = lastPreviewMatchedList;
      else if (activePreviewTab === 'unmatched') sourceList = lastPreviewUnmatchedList;
      else if (activePreviewTab === 'missing') sourceList = lastPreviewMissingList;

      const filtered = sourceList.filter(item => {
        if (!searchTerm) return true;
        const text = `${item.srNo} ${item.key1 || ''} ${item.key2 || ''} ${item.name || ''} ${JSON.stringify(item.rowData || {})}`.toLowerCase();
        return text.includes(searchTerm);
      });

      if (showingCountEl) {
        showingCountEl.textContent = `दाखवत आहे: ${filtered.length} / ${sourceList.length} नोंदी`;
      }

      if (filtered.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="5" style="text-align: center; color: #64748b; padding: 12px;">कोणतीही नोंद आढळली नाही</td>`;
        previewTableBody.appendChild(tr);
        return;
      }

      filtered.slice(0, 100).forEach(item => {
        const tr = document.createElement('tr');
        tr.style.background = item.isMatched ? '#f0fdf4' : (item.isMissing ? '#fff7ed' : '#ffffff');
        tr.style.borderBottom = '1px solid #f1f5f9';

        let badge = '';
        if (item.isMatched) {
          badge = '<span style="background: #dcfce7; color: #166534; padding: 2px 7px; border-radius: 4px; font-weight: 700; font-size: 10px; display: inline-block;">✓ मॅच (Tick होईल)</span>';
        } else if (item.isMissing) {
          badge = '<span style="background: #ffedd5; color: #9a3412; padding: 2px 7px; border-radius: 4px; font-weight: 700; font-size: 10px; display: inline-block;">⚠️ वेबवर नाही</span>';
        } else {
          badge = '<span style="background: #f1f5f9; color: #64748b; padding: 2px 7px; border-radius: 4px; font-size: 10px; display: inline-block;">— तसेच राहील (बदल नाही)</span>';
        }

        tr.innerHTML = `
          <td style="padding: 5px 6px; font-weight: 600;">${item.srNo}</td>
          <td style="padding: 5px 6px; font-family: monospace; color: ${item.isMatched ? '#15803d' : '#334155'}; font-weight: 700;">${item.key1 || '—'}</td>
          <td style="padding: 5px 6px; font-family: monospace; color: ${item.isMatched ? '#15803d' : '#334155'}; font-weight: 600;">${item.key2 || '—'}</td>
          <td style="padding: 5px 6px; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name || '—'}</td>
          <td style="padding: 5px 6px; text-align: center;">${badge}</td>
        `;
        previewTableBody.appendChild(tr);
      });
    }

    function previewMatchingData(silent) {
      if (!parsedExcelData || !parsedExcelData.length) {
        if (!silent) showToast('कृपया आधी एक्सेल फाईल निवडा.', 'warning');
        return;
      }

      const isDualKey = (modal.querySelector('input[name="t2eKeyMode"]:checked')?.value || 'dual') === 'dual';
      const excelKeyCol1 = excelKeySelect ? excelKeySelect.value : '';
      const excelKeyCol2 = isDualKey ? (excelKey2Select ? excelKey2Select.value : '') : null;
      const webColIdx1 = webKeySelect ? parseInt(webKeySelect.value, 10) : NaN;
      const webColIdx2 = isDualKey ? (webKey2Select ? parseInt(webKey2Select.value, 10) : NaN) : null;

      if (!excelKeyCol1 || isNaN(webColIdx1)) {
        if (!silent) showToast('मॅचिंग कॉलम निवडलेले नाहीत.', 'warning');
        return;
      }

      const excelMap = new Map();
      const excelStrippedMap = new Map();
      const excelCanonMap = new Map();
      const matchedExcelIndices = new Set();

      parsedExcelData.forEach((row, eIdx) => {
        const item = { row, index: eIdx };
        if (isDualKey && excelKeyCol2) {
          const k1 = normalizeKey(row[excelKeyCol1]);
          const k2 = normalizeKey(row[excelKeyCol2]);
          if (k1 && k2) {
            excelMap.set(`${k1}___${k2}`, item);
            excelStrippedMap.set(`${stripLeadingZeros(k1)}___${stripLeadingZeros(k2)}`, item);
            excelCanonMap.set(`${canonicalKey(k1)}___${canonicalKey(k2)}`, item);
          }
        } else {
          const normKey = normalizeKey(row[excelKeyCol1]);
          if (normKey) {
            excelMap.set(normKey, item);
            excelStrippedMap.set(stripLeadingZeros(normKey), item);
            excelCanonMap.set(canonicalKey(normKey), item);
          }
        }
      });

      const tableInfo = getTableColumnInfo(currentTable);
      const bodyRows = tableInfo.bodyRows;
      if (!bodyRows.length) {
        if (!silent) showToast('टेबलमध्ये डेटाच्या ओळी सापडल्या नाहीत.', 'error');
        return;
      }

      const allWebHeaders = (tableInfo.headers && tableInfo.headers.length > 0)
        ? tableInfo.headers.map((h, i) => (h && h.name) ? h.name : `कॉलम_${i + 1}`)
        : [];

      let matchedList = [];
      let unmatchedList = [];

      bodyRows.forEach((row, rIdx) => {
        const cells = Array.from(row.querySelectorAll('td, th, [role="cell"]'));
        const rowData = {};
        cells.forEach((c, idx) => {
          const colHeader = allWebHeaders[idx] || `कॉलम_${idx + 1}`;
          rowData[colHeader] = getCleanCellText(c);
        });

        let normWebKey = '';
        let strippedWebKey = '';
        let canonWebKey = '';
        let display1 = '';
        let display2 = '';
        let displayName = '';

        if (isDualKey && webColIdx2 !== null && !isNaN(webColIdx2)) {
          const cell1 = (cells && webColIdx1 >= 0 && webColIdx1 < cells.length) ? cells[webColIdx1] : null;
          const cell2 = (cells && webColIdx2 >= 0 && webColIdx2 < cells.length) ? cells[webColIdx2] : null;
          display1 = cell1 ? getCleanCellText(cell1) : '';
          display2 = cell2 ? getCleanCellText(cell2) : '';
          const k1 = normalizeKey(display1);
          const k2 = normalizeKey(display2);
          normWebKey = (k1 && k2) ? `${k1}___${k2}` : '';
          strippedWebKey = (k1 && k2) ? `${stripLeadingZeros(k1)}___${stripLeadingZeros(k2)}` : '';
          canonWebKey = (k1 && k2) ? `${canonicalKey(k1)}___${canonicalKey(k2)}` : '';
        } else {
          const cell1 = (cells && webColIdx1 >= 0 && webColIdx1 < cells.length) ? cells[webColIdx1] : null;
          display1 = cell1 ? getCleanCellText(cell1) : '';
          normWebKey = normalizeKey(display1);
          strippedWebKey = stripLeadingZeros(normWebKey);
          canonWebKey = canonicalKey(normWebKey);
        }

        // Find farmer name or general text from cells for nice preview
        cells.forEach(c => {
          const t = getCleanCellText(c);
          if (t && t !== display1 && t !== display2 && isNaN(Number(t)) && !t.startsWith('FM-') && !t.startsWith('MH-') && !displayName) {
            displayName = t;
          }
        });

        const matchedItem = (normWebKey ? excelMap.get(normWebKey) : null) ||
          (strippedWebKey ? excelStrippedMap.get(strippedWebKey) : null) ||
          (canonWebKey ? excelCanonMap.get(canonWebKey) : null);

        const isMatched = !!matchedItem;
        if (matchedItem) matchedExcelIndices.add(matchedItem.index);

        const rowObj = {
          srNo: rIdx + 1,
          key1: display1,
          key2: display2,
          name: displayName,
          isMatched,
          isMissing: false,
          rowData,
          excelRow: matchedItem ? matchedItem.row : null
        };

        if (isMatched) {
          matchedList.push(rowObj);
        } else {
          unmatchedList.push(rowObj);
        }
      });

      lastPreviewMatchedList = matchedList;
      lastPreviewUnmatchedList = unmatchedList;

      // Excel records missing on the webpage
      const missingList = [];
      parsedExcelData.forEach((row, eIdx) => {
        if (!matchedExcelIndices.has(eIdx)) {
          let k1 = row[excelKeyCol1] || '';
          let k2 = (isDualKey && excelKeyCol2) ? row[excelKeyCol2] : '';
          let name = '';
          Object.keys(row).forEach(k => {
            const v = String(row[k] || '');
            if (v && v !== k1 && v !== k2 && isNaN(Number(v)) && !name) {
              name = v;
            }
          });
          missingList.push({
            srNo: eIdx + 1,
            key1: k1,
            key2: k2,
            name: name || 'एक्सेल नोंद',
            isMatched: false,
            isMissing: true,
            rowData: row
          });
        }
      });
      lastPreviewMissingList = missingList;

      const pMatchEl = modal.querySelector('#t2ePrevMatchedCount');
      const pUnmatchEl = modal.querySelector('#t2ePrevUnmatchedCount');
      const pMissEl = modal.querySelector('#t2ePrevMissingCount');
      const tMatchEl = modal.querySelector('#t2eTabMatchedCount');
      const tUnmatchEl = modal.querySelector('#t2eTabUnmatchedCount');
      const tMissEl = modal.querySelector('#t2eTabMissingCount');

      if (pMatchEl) pMatchEl.textContent = `${matchedList.length}`;
      if (pUnmatchEl) pUnmatchEl.textContent = `${unmatchedList.length}`;
      if (pMissEl) pMissEl.textContent = `${missingList.length}`;

      if (tMatchEl) tMatchEl.textContent = `${matchedList.length}`;
      if (tUnmatchEl) tUnmatchEl.textContent = `${unmatchedList.length}`;
      if (tMissEl) tMissEl.textContent = `${missingList.length}`;

      renderPreviewRows();

      if (matchPreviewCard && !silent) {
        matchPreviewCard.style.display = 'block';
      }
      if (!silent) {
        showToast(`🔍 तपासणी पूर्ण: ${matchedList.length} ओळी मॅच झाल्या (या टिक होतील)!`, 'success');
      }
    }

    function downloadMatchedPreviewData() {
      if (!lastPreviewMatchedList || !lastPreviewMatchedList.length) {
        showToast('कोणताही मॅच झालेला डेटा उपलब्ध नाही.', 'warning');
        return;
      }
      const exportData = lastPreviewMatchedList.map(item => {
        const out = { 'वेबपेज_ओळ_क्रमांक': item.srNo, 'Farmer ID': item.key1, 'Farm ID': item.key2, 'नाव': item.name };
        if (item.rowData) {
          Object.assign(out, item.rowData);
        }
        return out;
      });
      downloadJsonAsXlsx(exportData, 'फक्त_मॅच_झालेला_डेटा');
    }

    function smartAutoMapColumns() {
      if (!excelHeaders.length) return;

      const webOptions = Array.from(webKeySelect.options);
      const farmerKeywords = ['farmer id', 'farmer_id', 'farmerid', 'farmer', 'शेतकरी आयडी', 'शेतकरी क्रमांक', 'शेतकरी कोड', 'खाते क्रमांक', 'अर्जदार', 'नोंदणी क्रमांक'];
      const farmKeywords = ['farm id', 'farm_id', 'farmid', 'फार्म आयडी', 'फार्म क्रमांक', 'गट क्रमांक', 'गट क्र', 'सर्व्हे क्र', 'पिक कोड', 'farm'];

      // Check if table has Farmer ID and Farm ID
      let webFarmerOpt = null;
      let webFarmOpt = null;

      webOptions.forEach(opt => {
        const t = opt.textContent.toLowerCase();
        if (farmerKeywords.some(k => t.includes(k)) && !t.includes('name') && !t.includes('नाव')) {
          if (!webFarmerOpt) webFarmerOpt = opt;
        } else if (farmKeywords.some(k => t.includes(k)) && !t.includes('area') && !t.includes('क्षेत्र') && !t.includes('farmer')) {
          if (!webFarmOpt) webFarmOpt = opt;
        }
      });

      let excelFarmerCol = null;
      let excelFarmCol = null;

      excelHeaders.forEach(col => {
        const c = col.toLowerCase();
        if (farmerKeywords.some(k => c.includes(k)) && !c.includes('name') && !c.includes('नाव')) {
          if (!excelFarmerCol) excelFarmerCol = col;
        } else if (farmKeywords.some(k => c.includes(k)) && !c.includes('area') && !c.includes('क्षेत्र') && !c.includes('farmer')) {
          if (!excelFarmCol) excelFarmCol = col;
        }
      });

      // If both Farmer ID and Farm ID exist in web or excel, activate Dual Key!
      if ((webFarmerOpt && webFarmOpt) || (excelFarmerCol && excelFarmCol)) {
        const dualRadio = modal.querySelector('#t2eKeyModeDual');
        if (dualRadio) {
          dualRadio.checked = true;
          key2Row.style.display = 'grid';
          excelKey1Label.textContent = '📊 एक्सेल: Farmer ID कॉलम:';
          webKey1Label.textContent = '🌐 वेबपेज: Farmer ID कॉलम:';
        }

        if (webFarmerOpt) webKeySelect.value = webFarmerOpt.value;
        if (webFarmOpt) webKey2Select.value = webFarmOpt.value;

        if (excelFarmerCol) excelKeySelect.value = excelFarmerCol;
        if (excelFarmCol) excelKey2Select.value = excelFarmCol;

        // Auto-select Mode 1 (100% Strict Match Mode): "फक्त Excel मध्ये मॅच होणारे Check करा आणि मॅच नसलेले Uncheck करा"
        const modeStrictRadio = modal.querySelector('input[name="t2eActionMode"][value="checkMatchedUncheckOthers"]');
        if (modeStrictRadio) {
          modeStrictRadio.checked = true;
          modal.querySelectorAll('.t2e-radio-option').forEach(l => l.classList.remove('t2e-active'));
          modeStrictRadio.closest('.t2e-radio-option').classList.add('t2e-active');
          statusColContainer.style.display = 'none';
        }

        // Auto-detect target checkbox if there's an 'affected' or '33%' or 'action' column
        const chkOptions = Array.from(targetCheckboxSelect.options);
        const affectedChk = chkOptions.find(o => {
          const t = o.textContent.toLowerCase();
          return t.includes('affected') || t.includes('33%') || t.includes('नुकसान') ||
                 t.includes('हजर') || t.includes('उपस्थित') || t.includes('मंजूर') ||
                 t.includes('पात्र') || t.includes('status') || t.includes('action');
        });
        if (affectedChk) {
          targetCheckboxSelect.value = affectedChk.value;
        }

        // Run preview automatically!
        setTimeout(() => {
          previewMatchingData(true);
        }, 150);
      } else {
        // Fallback single key
        const singleRadio = modal.querySelector('#t2eKeyModeSingle');
        if (singleRadio) {
          singleRadio.checked = true;
          key2Row.style.display = 'none';
          excelKey1Label.textContent = '📊 एक्सेल मधील आयडी / की कॉलम:';
          webKey1Label.textContent = '🌐 वेबपेज टेबल मधील मॅचिंग कॉलम:';
        }

        const keyKeywords = ['id', 'epic', 'application', 'token', 'क्रमांक', 'नाव', 'name', 'number', 'no', 'sr', 'अनुक्रमांक', 'form'];
        let bestExcelKey = excelHeaders[0];

        for (const col of excelHeaders) {
          const lower = col.toLowerCase();
          if (keyKeywords.some(k => lower.includes(k))) {
            bestExcelKey = col;
            break;
          }
        }
        excelKeySelect.value = bestExcelKey;

        let matchedWebOpt = webOptions[0];
        const lowerExcelKey = bestExcelKey.toLowerCase();
        for (const opt of webOptions) {
          const lowerOpt = opt.textContent.toLowerCase();
          if (lowerOpt.includes(lowerExcelKey) || lowerExcelKey.includes(opt.textContent.toLowerCase())) {
            matchedWebOpt = opt;
            break;
          }
        }
        if (matchedWebOpt) webKeySelect.value = matchedWebOpt.value;

        const statusKeywords = ['status', 'response', 'action', 'हजर', 'मंजूर', 'check', 'select', 'state', 'उपस्थिती', 'निकाल', 'result'];
        for (const col of excelHeaders) {
          const lower = col.toLowerCase();
          if (statusKeywords.some(k => lower.includes(k))) {
            statusColSelect.value = col;
            break;
          }
        }

        const modeStrictRadio = modal.querySelector('input[name="t2eActionMode"][value="checkMatchedUncheckOthers"]');
        if (modeStrictRadio) {
          modeStrictRadio.checked = true;
          modal.querySelectorAll('.t2e-radio-option').forEach(l => l.classList.remove('t2e-active'));
          modeStrictRadio.closest('.t2e-radio-option').classList.add('t2e-active');
          statusColContainer.style.display = 'none';
        }

        const chkOptions = Array.from(targetCheckboxSelect.options);
        const affectedChk = chkOptions.find(o => {
          const t = o.textContent.toLowerCase();
          return t.includes('affected') || t.includes('33%') || t.includes('नुकसान') ||
                 t.includes('हजर') || t.includes('उपस्थित') || t.includes('मंजूर') ||
                 t.includes('पात्र') || t.includes('status') || t.includes('action');
        });
        if (affectedChk) {
          targetCheckboxSelect.value = affectedChk.value;
        }

        setTimeout(() => {
          previewMatchingData(true);
        }, 150);
      }
    }

    async function executeAutoCheck(options = { isInstant: false }) {
      if (isExecuting) return;
      if (!parsedExcelData || !parsedExcelData.length) {
        showToast('कृपया प्रथम एक्सेल फाईल अपलोड करा.', 'error');
        return;
      }

      const isInstant = !!options.isInstant;

      try {
        const isDualKey = (modal.querySelector('input[name="t2eKeyMode"]:checked')?.value || 'dual') === 'dual';
        const excelKeyCol1 = excelKeySelect ? excelKeySelect.value : '';
        const excelKeyCol2 = isDualKey ? (excelKey2Select ? excelKey2Select.value : '') : null;
        const webColIdx1 = webKeySelect ? parseInt(webKeySelect.value, 10) : NaN;
        const webColIdx2 = isDualKey ? (webKey2Select ? parseInt(webKey2Select.value, 10) : NaN) : null;
        const targetChkIdx = targetCheckboxSelect ? (parseInt(targetCheckboxSelect.value, 10) || 0) : 0;
        const actionMode = modal.querySelector('input[name="t2eActionMode"]:checked')?.value || 'onlyCheckMatched';
        const statusCol = statusColSelect ? statusColSelect.value : '';
        const speedMs = isInstant ? 0 : (parseInt(modal.querySelector('#t2eSpeedSelect')?.value, 10) || 80);

        if (!excelKeyCol1 || isNaN(webColIdx1)) {
          showToast('कृपया प्रथम मॅचिंग कॉलम (उदा. Farmer ID) निवडा.', 'warning');
          return;
        }

        if (isDualKey && (!excelKeyCol2 || isNaN(webColIdx2))) {
          showToast('दुहेरी कॉलम पद्धतीसाठी Farm ID कॉलम देखील निवडा.', 'warning');
          return;
        }

        // Table verification & re-detection if needed
        if (!currentTable || currentTable.isConnected === false) {
          const freshTables = getAllTables();
          const selIdx = parseInt(targetTableSelect?.value, 10);
          if (!isNaN(selIdx) && freshTables[selIdx]) {
            currentTable = freshTables[selIdx];
          } else if (freshTables.length > 0) {
            currentTable = freshTables[0];
          } else {
            showToast('वेबपेजवर टेबल सापडले नाही.', 'error');
            return;
          }
        }

        const tableInfo = getTableColumnInfo(currentTable);
        const bodyRows = tableInfo.bodyRows;

        if (!bodyRows.length) {
          showToast('टेबलमध्ये डेटाच्या ओळी सापडल्या नाहीत.', 'error');
          return;
        }

        isExecuting = true;
        if (btnInstantBatchCheck) {
          btnInstantBatchCheck.disabled = true;
          btnInstantBatchCheck.innerHTML = `<span>⚡ सर्व मॅचिंग सरसकट टिक करत आहे...</span>`;
        }
        if (btnStartAutoCheck) {
          btnStartAutoCheck.disabled = true;
          btnStartAutoCheck.innerHTML = `<span>⏳ प्रक्रिया सुरू आहे...</span>`;
        }

        progressContainer.style.display = 'flex';
        metricsGrid.style.display = 'grid';
        exportSection.style.display = 'none';
        logBoxWrapper.style.display = 'block';
        postActionsRow.style.display = 'none';
        logTbody.innerHTML = '';

        currentAuditRows = [];
        currentUntickedRows = [];
        currentTickedRows = [];
        currentMissingExcelRows = [];
        currentAllProcessedRows = [];
        currentLogItems = [];

        const excelMap = new Map();
        const excelStrippedMap = new Map();
        const excelCanonMap = new Map();
        const matchedExcelIndices = new Set();

        parsedExcelData.forEach((row, eIdx) => {
          const item = { row, index: eIdx };
          if (isDualKey && excelKeyCol2) {
            const k1 = normalizeKey(row[excelKeyCol1]);
            const k2 = normalizeKey(row[excelKeyCol2]);
            if (k1 && k2) {
              const normKey = `${k1}___${k2}`;
              const stripped = `${stripLeadingZeros(k1)}___${stripLeadingZeros(k2)}`;
              const canon = `${canonicalKey(k1)}___${canonicalKey(k2)}`;
              if (!excelMap.has(normKey)) excelMap.set(normKey, item);
              if (!excelStrippedMap.has(stripped)) excelStrippedMap.set(stripped, item);
              if (!excelCanonMap.has(canon)) excelCanonMap.set(canon, item);
            }
          } else {
            const rawKey = row[excelKeyCol1];
            const normKey = normalizeKey(rawKey);
            if (normKey) {
              if (!excelMap.has(normKey)) excelMap.set(normKey, item);
              const stripped = stripLeadingZeros(normKey);
              if (!excelStrippedMap.has(stripped)) {
                excelStrippedMap.set(stripped, item);
              }
              const canon = canonicalKey(normKey);
              if (!excelCanonMap.has(canon)) {
                excelCanonMap.set(canon, item);
              }
            }
          }
        });

        let countChecked = 0;
        let countUnchecked = 0;
        let countUnmatched = 0;
        let countErrors = 0;
        const undoStack = [];

        metricTotal.textContent = bodyRows.length;
        metricChecked.textContent = '०';
        metricUnchecked.textContent = '०';
        metricUnmatched.textContent = '०';

        const allWebHeaders = (tableInfo.headers && tableInfo.headers.length > 0)
          ? tableInfo.headers.map((h, i) => (h && h.name) ? h.name : `कॉलम_${i + 1}`)
          : [];

        const selectedChkOpt = targetCheckboxSelect ? targetCheckboxSelect.selectedOptions[0] : null;
        const targetChkColIdx = selectedChkOpt ? parseInt(selectedChkOpt.getAttribute('data-col-idx'), 10) : -1;
        const preferredChkIdx = selectedChkOpt ? (parseInt(selectedChkOpt.value, 10) || 0) : targetChkIdx;

        for (let rIdx = 0; rIdx < bodyRows.length; rIdx++) {
          try {
            const row = bodyRows[rIdx];
            if (!row || !row.isConnected) continue;
            const cells = Array.from(row.querySelectorAll('td, th, [role="cell"]'));
            
            const rowData = {};
            cells.forEach((c, idx) => {
              const colHeader = allWebHeaders[idx] || `कॉलम_${idx + 1}`;
              rowData[colHeader] = getCleanCellText(c);
            });

            let normWebKey = '';
            let strippedWebKey = '';
            let canonWebKey = '';
            let displayKey = '';
            let raw1 = '';
            let raw2 = '';
            let k1 = '';
            let k2 = '';

            if (isDualKey && webColIdx2 !== null && !isNaN(webColIdx2)) {
              const cell1 = (cells && webColIdx1 >= 0 && webColIdx1 < cells.length) ? cells[webColIdx1] : null;
              const cell2 = (cells && webColIdx2 >= 0 && webColIdx2 < cells.length) ? cells[webColIdx2] : null;
              raw1 = cell1 ? getCleanCellText(cell1) : '';
              raw2 = cell2 ? getCleanCellText(cell2) : '';
              k1 = normalizeKey(raw1);
              k2 = normalizeKey(raw2);
              normWebKey = (k1 && k2) ? `${k1}___${k2}` : '';
              strippedWebKey = (k1 && k2) ? `${stripLeadingZeros(k1)}___${stripLeadingZeros(k2)}` : '';
              canonWebKey = (k1 && k2) ? `${canonicalKey(k1)}___${canonicalKey(k2)}` : '';
              displayKey = `${raw1} | ${raw2}`;
            } else {
              const keyCell = (cells && webColIdx1 >= 0 && webColIdx1 < cells.length) ? cells[webColIdx1] : null;
              raw1 = keyCell ? getCleanCellText(keyCell) : '';
              displayKey = raw1;
              normWebKey = normalizeKey(displayKey);
              strippedWebKey = stripLeadingZeros(normWebKey);
              canonWebKey = canonicalKey(normWebKey);
              k1 = normWebKey;
            }

            const matchedExcelItem = (normWebKey ? excelMap.get(normWebKey) : null) ||
              (strippedWebKey ? excelStrippedMap.get(strippedWebKey) : null) ||
              (canonWebKey ? excelCanonMap.get(canonWebKey) : null);

            const matchedExcelRow = matchedExcelItem ? matchedExcelItem.row : null;
            if (matchedExcelItem) {
              matchedExcelIndices.add(matchedExcelItem.index);
            }

            let targetChk = null;
            if (!isNaN(targetChkColIdx) && targetChkColIdx >= 0 && cells[targetChkColIdx]) {
              targetChk = cells[targetChkColIdx].querySelector('input[type="checkbox"], [role="checkbox"]');
            }
            if (!targetChk) {
              const chkList = row.querySelectorAll('input[type="checkbox"], [role="checkbox"]');
              targetChk = chkList[preferredChkIdx] || chkList[0];
            }

            let targetAction = null;
            let excelStatusVal = '';
            let rowCategory = 'unticked'; // 'checked' | 'unticked' | 'error'
            let rowReason = '';
            let logActionBadge = '';

            if (matchedExcelRow) {
              if (actionMode === 'checkMatchedUncheckOthers' || actionMode === 'onlyCheckMatched' || actionMode === 'checkAllFound') {
                targetAction = true;
                excelStatusVal = 'मॅच झाले (Found)';
                rowReason = 'एक्सेल नुसार मॅच झाले - Check (✓) केले';
              } else if (actionMode === 'statusCol') {
                excelStatusVal = matchedExcelRow[statusCol];
                const boolVal = interpretStatusValue(excelStatusVal);
                if (boolVal === true) {
                  targetAction = true;
                  rowReason = 'एक्सेल स्टेटस (1/Yes/मंजूर) नुसार Check केले';
                } else if (boolVal === false) {
                  targetAction = false;
                  rowReason = 'एक्सेल स्टेटस (0/No/नामंजूर) नुसार Uncheck केले';
                } else {
                  const blankAction = modal.querySelector('#t2eBlankActionSelect')?.value || 'skip';
                  if (blankAction === 'uncheck') {
                    targetAction = false;
                    rowReason = 'एक्सेलमध्ये रिकामे असल्यामुळे Uncheck केले';
                  } else {
                    targetAction = null;
                    rowReason = 'एक्सेलमध्ये रिकामे (तसेच ठेवले - बदल केला नाही)';
                  }
                }
              } else if (actionMode === 'uncheckAllFound') {
                targetAction = false;
                excelStatusVal = 'मॅच झाले (Found)';
                rowReason = 'एक्सेलमध्ये सापडल्यामुळे Uncheck केले';
              }
            } else {
              countUnmatched++;
              excelStatusVal = 'एक्सेलमध्ये नाही (Not Found)';
              if (actionMode === 'checkMatchedUncheckOthers') {
                targetAction = false;
                rowReason = 'एक्सेल फाईलमध्ये ही नोंद नाही - आपोआप Uncheck (✗) केले';
              } else {
                targetAction = null;
                rowReason = 'एक्सेल फाईलमध्ये ही नोंद नाही (तसेच ठेवले - कोणताही बदल नाही)';
              }
            }

            let actionResult = 'बदल नाही';

            if (!targetChk) {
              countErrors++;
              rowCategory = 'error';
              rowReason = 'या ओळीत कोणताही चेकबॉक्स आढळला नाही (No Checkbox Found)';
              actionResult = 'त्रुटी (चेकबॉक्स नाही)';
              logActionBadge = `<span class="t2e-badge-err">⚠️ एरर</span>`;
            } else if (targetChk.disabled) {
              countErrors++;
              rowCategory = 'error';
              rowReason = 'चेकबॉक्स डिसेबल / लॉक केलेला आहे (Disabled Checkbox)';
              actionResult = 'त्रुटी (चेकबॉक्स लॉक)';
              logActionBadge = `<span class="t2e-badge-err">⚠️ लॉक</span>`;
            } else if (targetAction !== null) {
              const oldChecked = !!targetChk.checked;
              applyCheckboxChange(targetChk, targetAction);
              undoStack.push({ checkbox: targetChk, wasChecked: oldChecked });

              if (targetAction === true) {
                countChecked++;
                rowCategory = 'checked';
                rowReason = 'एक्सेल नुसार यशस्वीरित्या Checked (टिक) केले';
                actionResult = 'Checked (✓)';
                logActionBadge = `<span class="t2e-badge-chk">✓ Checked</span>`;
                row.classList.add('t2e-row-checked');
                setTimeout(() => row.classList.remove('t2e-row-checked'), 1400);
              } else {
                countUnchecked++;
                rowCategory = 'unticked';
                if (!rowReason) rowReason = 'चेकबॉक्स अनटिक (Unchecked) केला';
                actionResult = 'Unchecked (✗)';
                logActionBadge = `<span class="t2e-badge-unchk">✗ Unchecked</span>`;
                row.classList.add('t2e-row-unchecked');
                setTimeout(() => row.classList.remove('t2e-row-unchecked'), 1400);
              }
            } else {
              // targetAction === null
              if (targetChk.checked) {
                countChecked++;
                rowCategory = 'checked';
                rowReason = 'आधीपासून Checked होते (बदल केला नाही)';
                actionResult = 'Checked (अपरिवर्तित)';
                logActionBadge = `<span class="t2e-badge-chk">✓ Checked</span>`;
              } else {
                countUnchecked++;
                rowCategory = 'unticked';
                if (!rowReason) rowReason = 'आधीपासून Unchecked होते (बदल केला नाही)';
                actionResult = 'Unchecked (अपरिवर्तित)';
                logActionBadge = !matchedExcelRow
                  ? `<span class="t2e-badge-miss">न सापडलेले</span>`
                  : `<span style="color:#64748b;">वगळले</span>`;
              }
            }

            const exportRecord = {
              'अनुक्रमांक (Sr.No)': rIdx + 1,
              'चेकबॉक्स स्थिती (Status)': rowCategory === 'checked' ? 'Checked (✓)' : (rowCategory === 'error' ? 'Error (⚠️)' : 'Unchecked (✗)'),
              'तपशील / कारण (Reason)': rowReason,
              ...rowData
            };

            currentAllProcessedRows.push(exportRecord);

            if (rowCategory === 'checked') {
              currentTickedRows.push(exportRecord);
            } else {
              currentUntickedRows.push(exportRecord);
            }

            currentAuditRows.push({
              sr: rIdx + 1,
              key: displayKey,
              excelValue: String(excelStatusVal || ''),
              action: actionResult,
              status: matchedExcelRow ? 'Matched' : 'Unmatched'
            });

            currentLogItems.push({
              sr: rIdx + 1,
              key: displayKey,
              excelValue: String(excelStatusVal || ''),
              actionBadge: logActionBadge,
              category: rowCategory
            });

            if (rIdx < 60 && !isInstant) {
              const tr = document.createElement('tr');
              tr.innerHTML = `
                <td>${rIdx + 1}</td>
                <td style="font-weight:600;">${escapeXml(displayKey)}</td>
                <td>${escapeXml(String(excelStatusVal))}</td>
                <td>${logActionBadge}</td>
              `;
              logTbody.appendChild(tr);
              logBox.scrollTop = logBox.scrollHeight;
            }

            if (!isInstant) {
              const percent = Math.round(((rIdx + 1) / bodyRows.length) * 100);
              progressFill.style.width = `${percent}%`;
              progressPercent.textContent = `${percent}%`;
              progressText.textContent = `प्रगती: ${rIdx + 1} / ${bodyRows.length} (${percent}%)`;

              metricChecked.textContent = countChecked;
              metricUnchecked.textContent = countUnchecked;
              metricUnmatched.textContent = countUnmatched + countErrors;

              if (speedMs > 0) {
                await new Promise(res => setTimeout(res, speedMs));
              }
            }
          } catch (rowErr) {
            console.warn(`Error processing row ${rIdx + 1}:`, rowErr);
            countErrors++;
          }
        }

        // Final UI updates for all modes (including instant)
        progressFill.style.width = '100%';
        progressPercent.textContent = '100%';
        progressText.textContent = `प्रगती: ${bodyRows.length} / ${bodyRows.length} (100%)`;
        metricChecked.textContent = countChecked;
        metricUnchecked.textContent = countUnchecked;
        metricUnmatched.textContent = countUnmatched + countErrors;

        // Collect Excel records not found on web page
        currentMissingExcelRows = [];
        parsedExcelData.forEach((excelRow, eIdx) => {
          if (!matchedExcelIndices.has(eIdx)) {
            currentMissingExcelRows.push({
              'एक्सेल ओळ क्र.': eIdx + 2,
              'त्रुटी / स्थिती': 'वेबपेज टेबलवर ही नोंद सापडली नाही (Missing on Page)',
              ...excelRow
            });
          }
        });

        isExecuting = false;
        lastUndoState = undoStack;

        if (btnInstantBatchCheck) {
          btnInstantBatchCheck.disabled = false;
          btnInstantBatchCheck.innerHTML = `<span>✔ सरसकट १-क्लिक पूर्ण झाले!</span>`;
          setTimeout(() => {
            btnInstantBatchCheck.innerHTML = `
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>
              <span>⚡ सरसकट एका क्लिकवर सर्व मॅचिंग टिक करा (Instant 1-Click All)</span>
            `;
          }, 3000);
        }

        if (btnStartAutoCheck) {
          btnStartAutoCheck.disabled = false;
          btnStartAutoCheck.innerHTML = `<span>✔ प्रक्रिया यशस्वीरित्या पूर्ण झाली!</span>`;
          setTimeout(() => {
            btnStartAutoCheck.innerHTML = `
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.05.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.01-4.09l-2.45-1.45C16.29 18.06 14.28 19 12 19z"/></svg>
              <span>🚀 ॲनिमेशनसह स्टेप-बाय-स्टेप भरा (Step-by-Step Auto Fill)</span>
            `;
          }, 3000);
        }

        // Show Export section and update counts
        exportSection.style.display = 'block';
        postActionsRow.style.display = 'flex';
        untickedBadge.textContent = `${currentUntickedRows.length} टिक न झालेले`;
        if (tickedSubtitle) {
          tickedSubtitle.textContent = `${currentTickedRows.length} ओळींचे चेकबॉक्स टिक झाले (डाऊनलोड करा)`;
        }
        untickedSubtitle.textContent = currentUntickedRows.length > 0
          ? `${currentUntickedRows.length} ओळींचे चेकबॉक्स अनटिक / एरर आहेत (डाऊनलोड करा)`
          : `सर्व ओळी टिक झाल्या आहेत!`;
        missingCountEl.textContent = currentMissingExcelRows.length;

        filterCountAll.textContent = bodyRows.length;
        filterCountUnticked.textContent = currentUntickedRows.length;
        filterCountChecked.textContent = currentTickedRows.length;
        filterCountError.textContent = countUnmatched + countErrors;

        renderFilteredLogs('all');
        const modeMsg = isInstant ? 'सरसकट एका क्लिकवर' : 'प्रक्रिया';
        showToast(`✔ ${modeMsg} पूर्ण! Checked: ${countChecked} | Unchecked: ${countUnchecked} | न सापडलेले: ${countUnmatched}`);
      } catch (err) {
        console.error('Error executing auto check:', err);
        isExecuting = false;
        if (btnInstantBatchCheck) {
          btnInstantBatchCheck.disabled = false;
          btnInstantBatchCheck.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>
            <span>⚡ सरसकट एका क्लिकवर सर्व मॅचिंग टिक करा (Instant 1-Click All)</span>
          `;
        }
        if (btnStartAutoCheck) {
          btnStartAutoCheck.disabled = false;
          btnStartAutoCheck.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.05.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.01-4.09l-2.45-1.45C16.29 18.06 14.28 19 12 19z"/></svg>
            <span>🚀 ॲनिमेशनसह स्टेप-बाय-स्टेप भरा (Step-by-Step Auto Fill)</span>
          `;
        }
        showToast('प्रक्रिया सुरू करताना त्रुटी आली: ' + (err.message || err), 'error');
      }
    }

    if (btnInstantBatchCheck) {
      btnInstantBatchCheck.addEventListener('click', () => {
        executeAutoCheck({ isInstant: true });
      });
    }

    if (btnStartAutoCheck) {
      btnStartAutoCheck.addEventListener('click', () => {
        executeAutoCheck({ isInstant: false });
      });
    }

    // Blanket Table Actions: सरसकट सर्व टिक करा / सरसकट सर्व अनटिक करा
    function applyBlanketTableAction(shouldCheck) {
      if (!currentTable || !currentTable.isConnected) {
        showToast('वेबपेजवर टेबल सापडले नाही.', 'error');
        return;
      }
      const tableInfo = getTableColumnInfo(currentTable);
      const rows = tableInfo.bodyRows;
      if (!rows.length) {
        showToast('टेबलमध्ये डेटाच्या ओळी सापडल्या नाहीत.', 'error');
        return;
      }

      const selectedChkOpt = targetCheckboxSelect ? targetCheckboxSelect.selectedOptions[0] : null;
      const targetChkColIdx = selectedChkOpt ? parseInt(selectedChkOpt.getAttribute('data-col-idx'), 10) : -1;
      const targetChkIdx = selectedChkOpt ? (parseInt(selectedChkOpt.value, 10) || 0) : 0;

      let count = 0;
      const undoStack = [];
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td, th, [role="cell"]'));
        let targetChk = null;
        if (!isNaN(targetChkColIdx) && targetChkColIdx >= 0 && cells[targetChkColIdx]) {
          targetChk = cells[targetChkColIdx].querySelector('input[type="checkbox"], [role="checkbox"]');
        }
        if (!targetChk) {
          const chkList = row.querySelectorAll('input[type="checkbox"], [role="checkbox"]');
          targetChk = chkList[targetChkIdx] || chkList[0];
        }
        if (targetChk && !targetChk.disabled) {
          const oldVal = !!targetChk.checked;
          applyCheckboxChange(targetChk, shouldCheck);
          undoStack.push({ checkbox: targetChk, wasChecked: oldVal });
          count++;
          if (shouldCheck) {
            row.classList.add('t2e-row-checked');
            setTimeout(() => row.classList.remove('t2e-row-checked'), 1400);
          } else {
            row.classList.add('t2e-row-unchecked');
            setTimeout(() => row.classList.remove('t2e-row-unchecked'), 1400);
          }
        }
      });

      lastUndoState = undoStack;
      postActionsRow.style.display = 'flex';
      const actionName = shouldCheck ? 'टिक (Checked)' : 'अनटिक (Unchecked)';
      showToast(`✔ टेबलमधील सर्व ${count} चेकबॉक्स सरसकट ${actionName} केले!`, 'success');
    }

    if (btnCheckAllTable) {
      btnCheckAllTable.addEventListener('click', () => applyBlanketTableAction(true));
    }
    if (btnUncheckAllTable) {
      btnUncheckAllTable.addEventListener('click', () => applyBlanketTableAction(false));
    }

    function renderFilteredLogs(filter) {
      logTbody.innerHTML = '';
      const filtered = currentLogItems.filter(item => {
        if (filter === 'all') return true;
        if (filter === 'unticked') return item.category === 'unticked';
        if (filter === 'checked') return item.category === 'checked';
        if (filter === 'error') return item.category === 'error' || item.excelValue.includes('नाही');
        return true;
      });

      const displayItems = filtered.slice(0, 100);
      displayItems.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.sr}</td>
          <td style="font-weight:600;">${escapeXml(item.key)}</td>
          <td>${escapeXml(item.excelValue)}</td>
          <td>${item.actionBadge}</td>
        `;
        logTbody.appendChild(tr);
      });

      if (filtered.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="4" style="text-align:center;color:#64748b;padding:12px;">या फिल्टरमध्ये नोंदी आढळल्या नाहीत</td>`;
        logTbody.appendChild(tr);
      }
    }

    filterBtns.forEach(btn => {
      btn.onclick = () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        renderFilteredLogs(filter);
      };
    });

    // 0. Download Ticked / Matched Rows as Excel (.xlsx)
    if (btnDownloadTickedXlsx) {
      btnDownloadTickedXlsx.onclick = () => {
        if (!currentTickedRows.length) {
          showToast('कोणतीही नोंद टिक झालेली नाही.', 'info');
          return;
        }
        const title = sanitizeFileName(document.title || 'Table');
        const today = new Date().toISOString().slice(0, 10);
        downloadJsonAsXlsx(currentTickedRows, `${title}_Ticked_Matched_Rows_${today}.xlsx`, 'Ticked_Data');
      };
    }

    // 1. Download Unticked Rows as Excel (.xlsx)
    btnDownloadUntickedXlsx.onclick = () => {
      if (!currentUntickedRows.length) {
        showToast('सर्व ओळी टिक झालेल्या आहेत! एकही ओळ अनटिक राहिलेली नाही.', 'info');
        return;
      }
      const title = sanitizeFileName(document.title || 'Table');
      const today = new Date().toISOString().slice(0, 10);
      downloadJsonAsXlsx(currentUntickedRows, `${title}_Unticked_Rows_${today}.xlsx`, 'Unticked_Data');
    };

    // 2. Download Missing Excel Rows as Excel (.xlsx)
    btnDownloadMissingExcel.onclick = () => {
      if (!currentMissingExcelRows.length) {
        showToast('अभिनंदन! एक्सेल मधील सर्व नोंदी वेबपेज टेबलवर अचूक सापडल्या.', 'info');
        return;
      }
      const title = sanitizeFileName(document.title || 'Table');
      const today = new Date().toISOString().slice(0, 10);
      downloadJsonAsXlsx(currentMissingExcelRows, `${title}_Missing_In_Webpage_${today}.xlsx`, 'Missing_In_Web');
    };

    // 3. Download Full Audit Report (.xlsx)
    btnDownloadFullReportXlsx.onclick = () => {
      const title = sanitizeFileName(document.title || 'Table');
      const today = new Date().toISOString().slice(0, 10);
      const sheets = {
        'टिक न झालेले': currentUntickedRows,
        'टिक झालेले': currentTickedRows,
        'वेबवर न सापडलेले': currentMissingExcelRows,
        'सर्व ओळी': currentAllProcessedRows
      };
      downloadCompleteWorkbook(sheets, `${title}_Complete_Audit_Report_${today}.xlsx`);
    };

    btnUndo.addEventListener('click', () => {
      if (!lastUndoState || !lastUndoState.length) {
        showToast('पूर्ववत करण्यासाठी डेटा नाही.', 'error');
        return;
      }
      let reverted = 0;
      lastUndoState.forEach(item => {
        if (item.checkbox) {
          applyCheckboxChange(item.checkbox, item.wasChecked);
          reverted++;
        }
      });
      showToast(`↺ ${reverted} चेकबॉक्स पूर्ववत (Undo) केले गेले.`);
      lastUndoState = null;
      btnUndo.disabled = true;
    });

    btnExportAudit.addEventListener('click', () => {
      if (!currentAuditRows.length) return;
      const headers = ['अनुक्रमांक', 'की / आयडी (Key)', 'एक्सेल स्टेटस व्हॅल्यू (Excel Value)', 'कृती (Action)', 'मॅच स्टेटस (Status)'];
      const csvLines = [headers.join(',')];

      currentAuditRows.forEach(r => {
        csvLines.push([
          r.sr,
          `"${String(r.key).replace(/"/g, '""')}"`,
          `"${String(r.excelValue).replace(/"/g, '""')}"`,
          `"${String(r.action).replace(/"/g, '""')}"`,
          `"${String(r.status).replace(/"/g, '""')}"`
        ].join(','));
      });

      const bom = '\uFEFF';
      const blob = new Blob([bom + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const today = new Date().toISOString().slice(0, 10);
      triggerDownload(blob, `AutoCheckbox_AuditReport_${today}.csv`);
    });
  }

  function setupModalDrag(modal) {
    const dragTargets = modal.querySelectorAll('.t2e-ac-header, .t2e-ac-drag-handle');
    if (!dragTargets.length) return;

    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    dragTargets.forEach(target => {
      target.addEventListener('pointerdown', (e) => {
        // Left click only
        if (e.button !== 0) return;
        // Do not drag when clicking control buttons, dropdowns, inputs
        if (e.target.closest('button, select, input, a, .t2e-ac-hdr-btn')) return;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = modal.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        // Switch to absolute fixed pixels from right/top CSS
        modal.style.right = 'auto';
        modal.style.bottom = 'auto';
        modal.style.left = `${initialLeft}px`;
        modal.style.top = `${initialTop}px`;
        modal.style.margin = '0';
        modal.classList.add('t2e-is-dragging');

        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        document.body.style.cursor = 'grabbing';

        try {
          target.setPointerCapture(e.pointerId);
        } catch (err) {}

        e.preventDefault();
        e.stopPropagation();
      });

      target.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const modalW = modal.offsetWidth || 580;
        const maxL = Math.max(10, window.innerWidth - modalW - 10);
        const maxT = Math.max(10, window.innerHeight - 50);

        const newL = Math.min(Math.max(10, initialLeft + dx), maxL);
        const newT = Math.min(Math.max(10, initialTop + dy), maxT);

        modal.style.left = `${newL}px`;
        modal.style.top = `${newT}px`;
        e.preventDefault();
      });

      const endDrag = (e) => {
        if (!isDragging) return;
        isDragging = false;
        modal.classList.remove('t2e-is-dragging');
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        document.body.style.cursor = '';

        try {
          if (e && e.pointerId) target.releasePointerCapture(e.pointerId);
        } catch (err) {}
      };

      target.addEventListener('pointerup', endDrag);
      target.addEventListener('pointercancel', endDrag);
    });

    // Window safety catch
    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        modal.classList.remove('t2e-is-dragging');
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        document.body.style.cursor = '';
      }
    });
  }

  // Observe DOM for dynamic tables
  const observer = new MutationObserver(() => initTables());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTables);
  } else {
    initTables();
  }

  // Listen for Extension Messages
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const tables = getAllTables();

    // Context Menu Trigger
    if (request.action === 'contextMenuClick') {
      const targetTable = lastRightClickedTable || tables[0];
      if (!targetTable) {
        showToast('कोणतेही टेबल सापडले नाही.', 'error');
        sendResponse({ success: false });
        return true;
      }
      if (request.menuId === 'table_copy_root') copyTableToClipboard(targetTable);
      else if (request.menuId === 'table_export_xlsx') exportTableToXlsx(targetTable);
      else if (request.menuId === 'table_export_csv') exportTableToCsv(targetTable);
      else if (request.menuId === 'table_autocheck') openAutoCheckboxModal(targetTable);
      sendResponse({ success: true });
      return true;
    }

    if (request.action === 'openAutoCheckbox') {
      const targetTable = tables[request.index !== undefined ? request.index : 0] || tables[0];
      if (targetTable) {
        openAutoCheckboxModal(targetTable);
      }
      sendResponse({ success: true });
      return true;
    }

    if (request.action === 'scanTables') {
      const list = tables.map((tbl, idx) => {
        const title = getTableTitle(tbl, idx);
        const rowsCount = tbl.rows ? tbl.rows.length : tbl.querySelectorAll('tr, [role="row"]').length;
        const firstRow = tbl.rows && tbl.rows[0] ? tbl.rows[0].cells : tbl.querySelectorAll('th, td');
        const colsCount = firstRow ? firstRow.length : 0;
        const previewHeaders = firstRow ? Array.from(firstRow).slice(0, 4).map(c => getCleanCellText(c)) : [];

        return {
          index: idx,
          title,
          rows: rowsCount,
          cols: colsCount,
          previewHeaders
        };
      });

      sendResponse({
        tables: list,
        pageTitle: document.title,
        url: window.location.href,
        barsVisible: showFloatingBars
      });
      return true;
    }

    if (request.action === 'copyTable') {
      const tbl = tables[request.index];
      if (tbl) copyTableToClipboard(tbl);
      sendResponse({ success: true });
      return true;
    }

    if (request.action === 'exportTable') {
      const tbl = tables[request.index];
      if (tbl) {
        if (request.format === 'csv') exportTableToCsv(tbl);
        else exportTableToXlsx(tbl);
      }
      sendResponse({ success: true });
      return true;
    }

    if (request.action === 'exportAll') {
      exportAllTablesCombined(tables);
      sendResponse({ success: true, count: tables.length });
      return true;
    }

    if (request.action === 'startPicker') {
      startTablePicker();
      sendResponse({ success: true });
      return true;
    }

    if (request.action === 'highlightTable') {
      const tbl = tables[request.index];
      if (tbl) {
        tbl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        highlightTableBriefly(tbl);
      }
      sendResponse({ success: true });
      return true;
    }

    if (request.action === 'toggleBars') {
      showFloatingBars = !!request.show;
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ showBars: showFloatingBars });
      }
      refreshBarsVisibility();
      sendResponse({ success: true, visible: showFloatingBars });
      return true;
    }
  });

})();
