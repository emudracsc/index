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
   * Clean text inside cell
   */
  function getCleanCellText(cell) {
    if (!cell) return '';
    const clone = cell.cloneNode(true);
    const unwanted = clone.querySelectorAll('script, style, .t2e-floating-bar, .t2e-toast, .no, [style*="display:none"], [style*="display: none"]');
    unwanted.forEach(el => el.remove());

    let text = clone.innerText || clone.textContent || '';
    return text.replace(/\u00a0/g, ' ').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
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
      <button class="t2e-btn-copy-instant" title="१-क्लिकमध्ये टेबल कॉपी करा (Excel मध्ये पेस्ट करण्यासाठी Ctrl+V)">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
        <span>१-क्लिक कॉपी (Copy)</span>
      </button>
      <button class="t2e-btn-sec t2e-btn-excel" title="Excel फाईल डाऊनलोड करा (.xlsx)">
        📊 Excel (.xlsx)
      </button>
      <button class="t2e-btn-sec" title="CSV फाईल डाऊनलोड करा (.csv)">
        📄 CSV
      </button>
    `;

    // Click handlers
    const copyBtn = bar.querySelector('.t2e-btn-copy-instant');
    const xlsxBtn = bar.querySelector('.t2e-btn-excel');
    const csvBtn = bar.querySelectorAll('.t2e-btn-sec')[1];

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
    return str.replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
    }[c]));
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
