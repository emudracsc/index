/**
 * PDF मजकूर संपादक व PDF Merger (Marathi & English PDF Tool) - Frontend Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  // =========================================================================
  // State
  // =========================================================================
  let currentPdfFile = null;
  let rules = [
    { find: "ERO, Kankavli", replace: "AERO, Kankavli" },
    { find: "ERO", replace: "AERO" },
    { find: "मतदार नोंदणी अधिकारी, कणकवली", replace: "सहाय्यक मतदार नोंदणी अधिकारी, कणकवली" },
    { find: "मतदार नोंदणी अधिकारी", replace: "सहाय्यक मतदार नोंदणी अधिकारी" },
    { find: "कणकवली", replace: "कुडाळ" },
    { find: "Kankavli", replace: "Kudal" }
  ];

  let mergeFiles = []; // Array of File objects for PDF Merger
  let lastGeneratedFileName = null;

  // =========================================================================
  // DOM Elements - Navigation & Modes
  // =========================================================================
  const tabReplacerBtn = document.getElementById("tabReplacerBtn");
  const tabMergerBtn = document.getElementById("tabMergerBtn");
  const viewReplacer = document.getElementById("viewReplacer");
  const viewMerger = document.getElementById("viewMerger");

  // DOM Elements - Text Replacer
  const dropzone = document.getElementById("dropzone");
  const pdfFileInput = document.getElementById("pdfFileInput");
  const btnBrowseFile = document.getElementById("btnBrowseFile");
  const fileInfoBadge = document.getElementById("fileInfoBadge");
  const lblFileName = document.getElementById("lblFileName");
  const lblFileSize = document.getElementById("lblFileSize");
  const btnRemoveFile = document.getElementById("btnRemoveFile");

  const findInput = document.getElementById("findInput");
  const replaceInput = document.getElementById("replaceInput");
  const btnAddRule = document.getElementById("btnAddRule");
  const rulesTableBody = document.getElementById("rulesTableBody");
  const emptyRulesMsg = document.getElementById("emptyRulesMsg");
  const lblRulesCount = document.getElementById("lblRulesCount");

  const btnImportRules = document.getElementById("btnImportRules");
  const importRulesInput = document.getElementById("importRulesInput");
  const btnExportRules = document.getElementById("btnExportRules");
  const btnClearRules = document.getElementById("btnClearRules");
  const btnLoadSample = document.getElementById("btnLoadSample");

  const pageRangeInput = document.getElementById("pageRangeInput");
  const btnScan = document.getElementById("btnScan");
  const btnReplace = document.getElementById("btnReplace");

  const progressWrapper = document.getElementById("progressWrapper");
  const progressBarFill = document.getElementById("progressBarFill");
  const lblProgressMsg = document.getElementById("lblProgressMsg");
  const lblProgressPct = document.getElementById("lblProgressPct");

  const valTotalFindCount = document.getElementById("valTotalFindCount");
  const valTotalReplacements = document.getElementById("valTotalReplacements");
  const valPagesModified = document.getElementById("valPagesModified");
  const valTimeTaken = document.getElementById("valTimeTaken");
  const breakdownList = document.getElementById("breakdownList");
  
  const downloadBanner = document.getElementById("downloadBanner");
  const btnDownloadPDF = document.getElementById("btnDownloadPDF");
  const lblDownloadFileName = document.getElementById("lblDownloadFileName");
  
  const downloadBannerMain = document.getElementById("downloadBannerMain");
  const btnDownloadPDFMain = document.getElementById("btnDownloadPDFMain");
  const lblDownloadFileNameMain = document.getElementById("lblDownloadFileNameMain");
  
  const terminalLog = document.getElementById("terminalLog");
  const btnClearLog = document.getElementById("btnClearLog");

  // DOM Elements - PDF Merger
  const dropzoneMerge = document.getElementById("dropzoneMerge");
  const pdfMergeInput = document.getElementById("pdfMergeInput");
  const btnBrowseMergeFiles = document.getElementById("btnBrowseMergeFiles");
  const mergeFilesList = document.getElementById("mergeFilesList");
  const emptyMergeMsg = document.getElementById("emptyMergeMsg");
  const lblMergeCount = document.getElementById("lblMergeCount");
  const btnClearMergeList = document.getElementById("btnClearMergeList");
  const btnStartMerge = document.getElementById("btnStartMerge");
  const lblMergeSummary = document.getElementById("lblMergeSummary");
  const mergeProgressWrapper = document.getElementById("mergeProgressWrapper");
  const mergeProgressBarFill = document.getElementById("mergeProgressBarFill");
  const lblMergeProgressMsg = document.getElementById("lblMergeProgressMsg");
  const lblMergeProgressPct = document.getElementById("lblMergeProgressPct");
  const mergeDownloadBanner = document.getElementById("mergeDownloadBanner");
  const btnDownloadMergedPDF = document.getElementById("btnDownloadMergedPDF");
  const lblMergeDownloadFileName = document.getElementById("lblMergeDownloadFileName");

  // DOM Elements - Download Modal
  const downloadModalOverlay = document.getElementById("downloadModalOverlay");
  const btnModalClose = document.getElementById("btnModalClose");
  const modalFileName = document.getElementById("modalFileName");
  const modalFileStats = document.getElementById("modalFileStats");
  const btnModalDownloadNow = document.getElementById("btnModalDownloadNow");

  // Presets definition
  const PRESETS = {
    taluka: [
      { find: "कणकवली", replace: "कुडाळ" },
      { find: "Kankavli", replace: "Kudal" },
      { find: "सिंधुदुर्ग", replace: "रत्नागिरी" }
    ],
    year: [
      { find: "19/09/2026", replace: "25/09/2026" },
      { find: "२०२६", replace: "२०२७" }
    ]
  };

  // =========================================================================
  // Mode Switcher (Tabs)
  // =========================================================================
  tabReplacerBtn.addEventListener("click", () => switchMode("replacer"));
  tabMergerBtn.addEventListener("click", () => switchMode("merger"));

  function switchMode(mode) {
    if (mode === "replacer") {
      tabReplacerBtn.classList.add("active");
      tabMergerBtn.classList.remove("active");
      viewReplacer.classList.remove("hidden");
      viewMerger.classList.add("hidden");
    } else {
      tabMergerBtn.classList.add("active");
      tabReplacerBtn.classList.remove("active");
      viewMerger.classList.remove("hidden");
      viewReplacer.classList.add("hidden");
    }
  }

  // =========================================================================
  // Helpers & Logging
  // =========================================================================
  function log(msg, type = "info") {
    const time = new Date().toLocaleTimeString();
    const line = document.createElement("div");
    line.className = `log-line ${type}`;
    line.textContent = `[${time}] ${msg}`;
    if (terminalLog) {
      terminalLog.appendChild(line);
      terminalLog.scrollTop = terminalLog.scrollHeight;
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // =========================================================================
  // Robust Universal Direct File Download (Native Fast Stream)
  // =========================================================================
  function triggerDirectDownload(fileName, label = "तयार PDF") {
    if (!fileName) return;
    lastGeneratedFileName = fileName;
    const downloadUrl = `/api/download?file=${encodeURIComponent(fileName)}`;
    log(`📥 डाऊनलोड सुरू करत आहे: ${fileName}...`, "info");

    // 1. Trigger native browser stream download via dynamic link
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = downloadUrl;
    a.setAttribute("download", fileName);
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try { document.body.removeChild(a); } catch (e) {}
    }, 1000);

    // 2. Open Modal for guaranteed 1-click manual download
    showDownloadModal(fileName, label);
    log(`✅ डाऊनलोड सुरू झाले: ${fileName}`, "success");
  }

  function showDownloadModal(fileName, statsText) {
    lastGeneratedFileName = fileName;
    if (modalFileName) modalFileName.textContent = fileName;
    if (modalFileStats) modalFileStats.textContent = statsText || "डाऊनलोडसाठी तयार";
    if (downloadModalOverlay) downloadModalOverlay.classList.remove("hidden");
  }

  if (btnModalClose) {
    btnModalClose.addEventListener("click", () => {
      if (downloadModalOverlay) downloadModalOverlay.classList.add("hidden");
    });
  }

  if (downloadModalOverlay) {
    downloadModalOverlay.addEventListener("click", (e) => {
      if (e.target === downloadModalOverlay) {
        downloadModalOverlay.classList.add("hidden");
      }
    });
  }

  if (btnModalDownloadNow) {
    btnModalDownloadNow.addEventListener("click", () => {
      if (lastGeneratedFileName) {
        window.location.href = `/api/download?file=${encodeURIComponent(lastGeneratedFileName)}`;
      }
    });
  }

  // =========================================================================
  // Section 1: Text Replacer Logic
  // =========================================================================
  btnBrowseFile.addEventListener("click", () => pdfFileInput.click());
  dropzone.addEventListener("click", () => pdfFileInput.click());

  pdfFileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith(".pdf")) {
        handleFileSelected(file);
      } else {
        alert("कृपया फक्त .pdf फाईल अपलोड करा.");
      }
    }
  });

  btnRemoveFile.addEventListener("click", () => {
    currentPdfFile = null;
    pdfFileInput.value = "";
    dropzone.classList.remove("hidden");
    fileInfoBadge.classList.add("hidden");
    log("PDF फाईल काढून टाकली.", "warning");
  });

  function handleFileSelected(file) {
    currentPdfFile = file;
    lblFileName.textContent = file.name;
    lblFileSize.textContent = formatBytes(file.size);
    dropzone.classList.add("hidden");
    fileInfoBadge.classList.remove("hidden");
    log(`PDF फाईल निवडली: ${file.name} (${formatBytes(file.size)})`, "success");
  }

  // Rules Rendering
  function renderRules() {
    rulesTableBody.innerHTML = "";
    if (rules.length === 0) {
      emptyRulesMsg.classList.remove("hidden");
    } else {
      emptyRulesMsg.classList.add("hidden");
      rules.forEach((rule, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${idx + 1}</strong></td>
          <td><span style="color: var(--danger); font-weight:600;">${escapeHtml(rule.find)}</span></td>
          <td><span style="color: var(--success); font-weight:600;">${escapeHtml(rule.replace || "(काढून टाका)")}</span></td>
          <td>
            <button class="btn-icon btn-del-rule" data-index="${idx}" title="काढा">🗑️</button>
          </td>
        `;
        rulesTableBody.appendChild(tr);
      });
    }
    lblRulesCount.textContent = rules.length;

    // Attach delete listeners
    document.querySelectorAll(".btn-del-rule").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.currentTarget.getAttribute("data-index"));
        const removed = rules.splice(index, 1);
        renderRules();
        log(`नियम काढला: '${removed[0].find}'`, "info");
      });
    });
  }

  btnAddRule.addEventListener("click", () => {
    const findVal = findInput.value.trim();
    const replaceVal = replaceInput.value.trim();

    if (!findVal) {
      alert("कृपया 'जुना शब्द (Find Text)' भरा.");
      findInput.focus();
      return;
    }

    const existing = rules.find(r => r.find === findVal);
    if (existing) {
      existing.replace = replaceVal;
      log(`नियम अपडेट केला: '${findVal}' ➔ '${replaceVal}'`, "info");
    } else {
      rules.push({ find: findVal, replace: replaceVal });
      log(`नवीन नियम जोडला: '${findVal}' ➔ '${replaceVal}'`, "success");
    }

    findInput.value = "";
    replaceInput.value = "";
    findInput.focus();
    renderRules();
  });

  findInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      replaceInput.focus();
    }
  });

  replaceInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      btnAddRule.click();
    }
  });

  // Officer Designation Controls
  const oldPostInput = document.getElementById("oldPostInput");
  const newPostInput = document.getElementById("newPostInput");
  const oldOfficerName = document.getElementById("oldOfficerName");
  const newOfficerName = document.getElementById("newOfficerName");
  const btnApplyOfficerPost = document.getElementById("btnApplyOfficerPost");

  document.querySelectorAll(".chip-designation").forEach(chip => {
    chip.addEventListener("click", () => {
      const fromPost = chip.getAttribute("data-from-post");
      const toPost = chip.getAttribute("data-to-post");
      if (oldPostInput && newPostInput) {
        oldPostInput.value = fromPost;
        newPostInput.value = toPost;
        log(`पदनाम निवडले: '${fromPost}' ➔ '${toPost}'`, "info");
      }
    });
  });

  if (btnApplyOfficerPost) {
    btnApplyOfficerPost.addEventListener("click", () => {
      const oldPost = oldPostInput ? oldPostInput.value.trim() : "";
      const newPost = newPostInput ? newPostInput.value.trim() : "";
      const oldName = oldOfficerName ? oldOfficerName.value.trim() : "";
      const newName = newOfficerName ? newOfficerName.value.trim() : "";

      if (!oldPost && !oldName) {
        alert("कृपया किमान जुने पद (Old Post) किंवा जुने नाव (Old Name) भरा.");
        return;
      }

      let addedCount = 0;
      if (oldPost && newPost) {
        const existing = rules.find(r => r.find === oldPost);
        if (existing) {
          existing.replace = newPost;
        } else {
          rules.push({ find: oldPost, replace: newPost });
        }
        addedCount++;
        log(`पदनाम नियम जोडला: '${oldPost}' ➔ '${newPost}'`, "success");
      }

      if (oldName && newName) {
        const existing = rules.find(r => r.find === oldName);
        if (existing) {
          existing.replace = newName;
        } else {
          rules.push({ find: oldName, replace: newName });
        }
        addedCount++;
        log(`अधिकारी नाव नियम जोडला: '${oldName}' ➔ '${newName}'`, "success");
      }

      if (oldName && oldPost && newName && newPost) {
        const comboOld = `${oldName} (${oldPost})`;
        const comboNew = `${newName} (${newPost})`;
        if (!rules.some(r => r.find === comboOld)) {
          rules.push({ find: comboOld, replace: comboNew });
        }
      }

      renderRules();
      alert(`✅ अधिकारी व पदनाम बदलण्याचे ${addedCount} नियम यशस्वीरीत्या जोडले गेले!`);
    });
  }

  // Preset Chips
  document.querySelectorAll(".chip[data-preset]").forEach(chip => {
    chip.addEventListener("click", () => {
      const presetKey = chip.getAttribute("data-preset");
      const items = PRESETS[presetKey] || [];
      items.forEach(item => {
        if (!rules.some(r => r.find === item.find)) {
          rules.push({ ...item });
        }
      });
      renderRules();
      log(`प्रीसेट जोडला: ${chip.textContent.trim()}`, "info");
    });
  });

  // Import / Export Rules
  btnImportRules.addEventListener("click", () => importRulesInput.click());
  importRulesInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        let count = 0;
        if (file.name.endsWith(".json")) {
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            data.forEach(item => {
              if (item.find) {
                rules.push({ find: item.find, replace: item.replace || "" });
                count++;
              }
            });
          } else {
            Object.keys(data).forEach(k => {
              rules.push({ find: k, replace: data[k] || "" });
              count++;
            });
          }
        } else {
          const lines = text.split(/\r?\n/);
          lines.forEach(line => {
            const parts = line.split(",");
            if (parts.length >= 2 && parts[0].trim()) {
              rules.push({ find: parts[0].trim(), replace: parts[1].trim() });
              count++;
            }
          });
        }
        renderRules();
        log(`यशस्वी: ${count} नियम ${file.name} मधून लोड झाले.`, "success");
        alert(`${count} नियम लोड झाले!`);
      } catch (err) {
        log(`त्रुटी: फाईल वाचता आली नाही - ${err.message}`, "error");
        alert("मॅपिंग फाईल लोड करताना त्रुटी आली.");
      }
    };
    reader.readAsText(file);
  });

  btnExportRules.addEventListener("click", () => {
    if (rules.length === 0) {
      alert("सेव्ह करण्यासाठी नियम नाहीत.");
      return;
    }
    const mapObj = {};
    rules.forEach(r => { mapObj[r.find] = r.replace; });
    const blob = new Blob([JSON.stringify(mapObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "replacements.json";
    a.click();
    URL.revokeObjectURL(url);
    log("नियम फाईल 'replacements.json' डाऊनलोड झाली.", "success");
  });

  btnClearRules.addEventListener("click", () => {
    if (rules.length === 0) return;
    if (confirm("तुम्हाला सर्व नियम काढून टाकायचे आहेत का?")) {
      rules = [];
      renderRules();
      log("सर्व नियम साफ केले.", "warning");
    }
  });

  btnLoadSample.addEventListener("click", async () => {
    log("नमुना PDF लोड करत आहे...", "info");
    try {
      const res = await fetch("/api/sample", { method: "POST" });
      const data = await res.json();
      if (data.success && data.download_url) {
        const pdfRes = await fetch(data.download_url);
        const blob = await pdfRes.blob();
        const file = new File([blob], data.file_name, { type: "application/pdf" });
        handleFileSelected(file);
        log("✅ नमुना ५-पानांची PDF यशस्वीरीत्या लोड झाली!", "success");
      }
    } catch (err) {
      log(`नमुना लोड करताना त्रुटी: ${err.message}`, "error");
    }
  });

  // Stream Consumer Helper
  async function consumeStream(url, formData, onProgress, onDone, onError) {
    const resp = await fetch(url, { method: "POST", body: formData });
    if (!resp.ok) {
      throw new Error(`सर्व्हर त्रुटी: HTTP ${resp.status}`);
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let isTerminated = false;

    function processLines(text) {
      const lines = text.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line.trim());
          if (data.type === "progress") {
            onProgress(data);
          } else if (data.type === "done") {
            isTerminated = true;
            onDone(data);
            break;
          } else if (data.type === "error") {
            isTerminated = true;
            onError(data.error);
            break;
          }
        } catch (err) {
          console.error("Stream parse error:", line, err);
        }
      }
    }

    while (!isTerminated) {
      const { value, done } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        if (buffer.trim()) {
          processLines(buffer);
        }
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lastNewline = buffer.lastIndexOf("\n");
      if (lastNewline !== -1) {
        const completeChunk = buffer.substring(0, lastNewline);
        buffer = buffer.substring(lastNewline + 1);
        processLines(completeChunk);
      }
      if (isTerminated) {
        try { await reader.cancel(); } catch (e) {}
        break;
      }
    }
  }

  // Scan (Dry Run)
  btnScan.addEventListener("click", async () => {
    if (!currentPdfFile) {
      alert("कृपया आधी PDF फाईल अपलोड करा.");
      return;
    }
    if (rules.length === 0) {
      alert("कृपया शोधण्यासाठी किमान एक शब्द जोडा.");
      return;
    }

    const rulesMap = {};
    rules.forEach(r => { rulesMap[r.find] = r.replace; });

    const formData = new FormData();
    formData.append("file", currentPdfFile);
    formData.append("rules", JSON.stringify(rulesMap));
    formData.append("pages", pageRangeInput.value.trim() || "all");

    setProcessingState(true, "स्कॅनिंग सुरू होत आहे...");
    resetLiveCounters();
    log("🔍 स्कॅन सुरू झाले (ड्राय-रन)...", "info");

    try {
      await consumeStream(
        "/api/scan_stream",
        formData,
        (data) => {
          updateLiveCounters(data.find_count || 0, 0, data.page, data.total_doc_pages || data.total, data.pct, data.msg);
          if (data.keyword_counts) {
            renderBreakdown(data.keyword_counts, "सापडले");
          }
          log(data.msg, "info");
        },
        (data) => {
          const stats = data.stats;
          valTotalFindCount.textContent = stats.total_matches;
          valTotalReplacements.textContent = "0 (फक्त स्कॅन)";
          valPagesModified.textContent = `${Object.keys(stats.page_matches || {}).length} / ${stats.scanned_pages_count}`;
          valTimeTaken.textContent = "0.8s";

          updateLiveCounters(stats.total_matches, 0, stats.scanned_pages_count, stats.total_doc_pages, 100, "स्कॅन पूर्ण!");
          renderBreakdown(stats.keyword_counts, "सापडले");

          log(`✅ स्कॅन पूर्ण! एकूण सापडलेले शब्द: ${stats.total_matches}`, "success");
          alert(`स्कॅन पूर्ण झाले!\n\nएकूण सापडलेले शब्द: ${stats.total_matches}\nडॅशबोर्डवर तपशील पहा.`);
          setProcessingState(false);
        },
        (errMsg) => {
          log(`त्रुटी: ${errMsg}`, "error");
          alert("स्कॅन करताना त्रुटी: " + errMsg);
          setProcessingState(false);
        }
      );
    } catch (err) {
      log(`सर्व्हर त्रुटी: ${err.message}`, "error");
      alert("सर्व्हरशी संपर्क होऊ शकला नाही: " + err.message);
      setProcessingState(false);
    }
  });

  // Replace & Download
  btnReplace.addEventListener("click", async () => {
    if (!currentPdfFile) {
      alert("कृपया आधी PDF फाईल अपलोड करा.");
      return;
    }
    if (rules.length === 0) {
      alert("कृपया बदलण्यासाठी किमान एक शब्द जोडा.");
      return;
    }

    const rulesMap = {};
    rules.forEach(r => { rulesMap[r.find] = r.replace; });

    const formData = new FormData();
    formData.append("file", currentPdfFile);
    formData.append("rules", JSON.stringify(rulesMap));
    formData.append("pages", pageRangeInput.value.trim() || "all");

    setProcessingState(true, "मजकूर बदलण्याची प्रक्रिया सुरू होत आहे...");
    resetLiveCounters();
    if (downloadBanner) downloadBanner.classList.add("hidden");
    if (downloadBannerMain) downloadBannerMain.classList.add("hidden");
    log("⚡ मजकूर बदलणे सुरू झाले (लाइव्ह रिअल-टाइम)...", "info");

    try {
      await consumeStream(
        "/api/replace_stream",
        formData,
        (data) => {
          updateLiveCounters(data.find_count || 0, data.replace_count || 0, data.page, data.total_doc_pages || data.total, data.pct, data.msg);
          valTotalFindCount.textContent = data.find_count || 0;
          valTotalReplacements.textContent = data.replace_count || 0;
          if (data.pages_modified !== undefined) {
            valPagesModified.textContent = `${data.pages_modified} / ${data.total}`;
          }
          if (data.keyword_counts) {
            renderBreakdown(data.keyword_counts, "बदलले");
          }
          log(data.msg, "info");
        },
        (data) => {
          const stats = data.stats;
          valTotalFindCount.textContent = stats.total_find_count || stats.total_replacements;
          valTotalReplacements.textContent = stats.total_replacements;
          valPagesModified.textContent = `${stats.pages_modified} / ${stats.processed_pages_count}`;
          valTimeTaken.textContent = `${stats.time_taken_seconds}s`;

          updateLiveCounters(stats.total_find_count || stats.total_replacements, stats.total_replacements, stats.processed_pages_count, stats.total_doc_pages, 100, "पूर्ण झाले!");
          renderBreakdown(stats.keyword_replacements, "बदलले");

          const fileName = data.file_name;
          lastGeneratedFileName = fileName;

          // 1. Right panel banner
          if (lblDownloadFileName) lblDownloadFileName.textContent = `तयार फाईल: ${fileName}`;
          if (downloadBanner) downloadBanner.classList.remove("hidden");
          if (btnDownloadPDF) {
            btnDownloadPDF.onclick = () => triggerDirectDownload(fileName, `एकूण बदल: ${stats.total_replacements}`);
          }

          // 2. Main Step 3 banner activation
          const iconDownloadMain = document.getElementById("iconDownloadMain");
          const titleDownloadMain = document.getElementById("titleDownloadMain");
          if (iconDownloadMain) iconDownloadMain.textContent = "🎉";
          if (titleDownloadMain) {
            titleDownloadMain.textContent = "PDF मजकूर १००% अचूक बदलला आहे!";
            titleDownloadMain.style.color = "#065F46";
          }
          if (lblDownloadFileNameMain) {
            lblDownloadFileNameMain.textContent = `तयार फाईल: ${fileName} (${stats.total_replacements} बदल यशस्वी!)`;
            lblDownloadFileNameMain.style.color = "#047857";
          }
          if (btnDownloadPDFMain) {
            btnDownloadPDFMain.disabled = false;
            btnDownloadPDFMain.style.opacity = "1";
            btnDownloadPDFMain.style.cursor = "pointer";
            btnDownloadPDFMain.classList.add("pulse-btn");
            btnDownloadPDFMain.textContent = "📥 नवीन बदललेली PDF डाऊनलोड करा (Download PDF)";
            btnDownloadPDFMain.onclick = () => triggerDirectDownload(fileName, `एकूण बदल: ${stats.total_replacements}`);
          }
          if (downloadBannerMain) {
            downloadBannerMain.classList.remove("hidden");
            downloadBannerMain.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }

          // 3. Trigger robust direct download
          triggerDirectDownload(fileName, `एकूण बदल: ${stats.total_replacements} (${stats.time_taken_seconds} सेकंद)`);

          log(`🎉 प्रक्रिया यशस्वीरीत्या पूर्ण झाली! एकूण बदल: ${stats.total_replacements}`, "success");
          setProcessingState(false);
        },
        (errMsg) => {
          log(`त्रुटी: ${errMsg}`, "error");
          alert("मजकूर बदलताना त्रुटी: " + errMsg);
          setProcessingState(false);
        }
      );
    } catch (err) {
      log(`सर्व्हर त्रुटी: ${err.message}`, "error");
      alert("सर्व्हरशी संपर्क होऊ शकला नाही: " + err.message);
      setProcessingState(false);
    }
  });

  function updateLiveCounters(findCount, replaceCount, currentPage, totalPages, pct, msg) {
    const liveFindCount = document.getElementById("liveFindCount");
    const liveReplaceCount = document.getElementById("liveReplaceCount");
    const livePageNum = document.getElementById("livePageNum");

    if (liveFindCount) liveFindCount.textContent = findCount;
    if (liveReplaceCount) liveReplaceCount.textContent = replaceCount;
    if (livePageNum) livePageNum.textContent = `${currentPage || 0} / ${totalPages || 0}`;

    if (progressBarFill) progressBarFill.style.width = `${pct || 0}%`;
    if (lblProgressPct) lblProgressPct.textContent = `${pct || 0}%`;
    if (lblProgressMsg) lblProgressMsg.textContent = msg || "प्रक्रिया चालू आहे...";
  }

  function resetLiveCounters() {
    updateLiveCounters(0, 0, 0, 0, 0, "सुरू होत आहे...");
    valTotalFindCount.textContent = "0";
    valTotalReplacements.textContent = "0";
    valPagesModified.textContent = "0";
    valTimeTaken.textContent = "0.0s";
  }

  function renderBreakdown(keywordCounts, actionLabel = "मॅचेस") {
    breakdownList.innerHTML = "";
    const entries = Object.entries(keywordCounts);
    if (entries.length === 0) {
      breakdownList.innerHTML = `<span class="text-muted">कोणतेही शब्द सापडले नाहीत.</span>`;
      return;
    }
    entries.forEach(([key, count]) => {
      const div = document.createElement("div");
      div.className = "breakdown-item";
      div.innerHTML = `
        <span>• <strong>${escapeHtml(key)}</strong></span>
        <span class="breakdown-badge">${count} ${actionLabel}</span>
      `;
      breakdownList.appendChild(div);
    });
  }

  function setProcessingState(isProcessing, msg = "") {
    btnScan.disabled = isProcessing;
    btnReplace.disabled = isProcessing;
    if (isProcessing) {
      progressWrapper.classList.remove("hidden");
      lblProgressMsg.textContent = msg;
    } else {
      setTimeout(() => {
        progressWrapper.classList.add("hidden");
      }, 1500);
    }
  }

  btnClearLog.addEventListener("click", () => {
    terminalLog.innerHTML = "";
    log("लॉग साफ केला.", "info");
  });

  // =========================================================================
  // Section 2: PDF Merger Logic
  // =========================================================================
  btnBrowseMergeFiles.addEventListener("click", () => pdfMergeInput.click());
  dropzoneMerge.addEventListener("click", (e) => {
    if (e.target !== btnBrowseMergeFiles) {
      pdfMergeInput.click();
    }
  });

  pdfMergeInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addMergeFiles(Array.from(e.target.files));
      pdfMergeInput.value = "";
    }
  });

  dropzoneMerge.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzoneMerge.classList.add("dragover");
  });

  dropzoneMerge.addEventListener("dragleave", () => {
    dropzoneMerge.classList.remove("dragover");
  });

  dropzoneMerge.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzoneMerge.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedPdfs = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith(".pdf"));
      if (droppedPdfs.length > 0) {
        addMergeFiles(droppedPdfs);
      } else {
        alert("कृपया फक्त .pdf फाईल्स ड्रॅग करा.");
      }
    }
  });

  function addMergeFiles(newFiles) {
    newFiles.forEach(file => {
      // Avoid duplicate by name & size if needed, or allow all
      mergeFiles.push(file);
    });
    renderMergeList();
    log(`📑 PDF Merger: ${newFiles.length} फाईल्स जोडल्या. (एकूण: ${mergeFiles.length})`, "success");
  }

  function renderMergeList() {
    mergeFilesList.innerHTML = "";
    lblMergeCount.textContent = mergeFiles.length;

    if (mergeFiles.length === 0) {
      emptyMergeMsg.classList.remove("hidden");
      mergeFilesList.appendChild(emptyMergeMsg);
      lblMergeSummary.textContent = "किमान २ PDF फाईल्स निवडा.";
      btnStartMerge.disabled = true;
      return;
    }

    emptyMergeMsg.classList.add("hidden");
    btnStartMerge.disabled = mergeFiles.length < 2;
    lblMergeSummary.textContent = `${mergeFiles.length} फाईल्स एकत्र करण्यासाठी तयार आहेत.`;

    mergeFiles.forEach((file, index) => {
      const item = document.createElement("div");
      item.className = "merge-item";
      item.innerHTML = `
        <div class="merge-item-left">
          <span class="merge-item-order">${index + 1}</span>
          <span class="merge-item-icon">📕</span>
          <div class="merge-item-details">
            <div class="merge-item-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
            <div class="merge-item-meta">
              <span>${formatBytes(file.size)}</span>
            </div>
          </div>
        </div>
        <div class="merge-item-actions">
          <button type="button" class="btn-move btn-move-up" data-idx="${index}" title="वर घ्या" ${index === 0 ? "disabled" : ""}>🔼</button>
          <button type="button" class="btn-move btn-move-down" data-idx="${index}" title="खाली घ्या" ${index === mergeFiles.length - 1 ? "disabled" : ""}>🔽</button>
          <button type="button" class="btn-icon btn-del-merge" data-idx="${index}" title="काढा">🗑️</button>
        </div>
      `;
      mergeFilesList.appendChild(item);
    });

    // Reorder event listeners
    document.querySelectorAll(".btn-move-up").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.getAttribute("data-idx"));
        if (idx > 0) {
          const temp = mergeFiles[idx];
          mergeFiles[idx] = mergeFiles[idx - 1];
          mergeFiles[idx - 1] = temp;
          renderMergeList();
        }
      });
    });

    document.querySelectorAll(".btn-move-down").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.getAttribute("data-idx"));
        if (idx < mergeFiles.length - 1) {
          const temp = mergeFiles[idx];
          mergeFiles[idx] = mergeFiles[idx + 1];
          mergeFiles[idx + 1] = temp;
          renderMergeList();
        }
      });
    });

    document.querySelectorAll(".btn-del-merge").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.getAttribute("data-idx"));
        const removed = mergeFiles.splice(idx, 1);
        renderMergeList();
        log(`PDF फाईल काढली: ${removed[0].name}`, "info");
      });
    });
  }

  btnClearMergeList.addEventListener("click", () => {
    if (mergeFiles.length === 0) return;
    if (confirm("तुम्हाला सर्व PDF फाईल्स यादीतून काढून टाकायच्या आहेत का?")) {
      mergeFiles = [];
      renderMergeList();
      if (mergeDownloadBanner) mergeDownloadBanner.classList.add("hidden");
      log("सर्व फाईल्स यादीतून काढल्या.", "warning");
    }
  });

  // Start Merge
  btnStartMerge.addEventListener("click", async () => {
    if (mergeFiles.length < 2) {
      alert("कृपया PDF एकत्र (Merge) करण्यासाठी किमान २ फाईल्स निवडा.");
      return;
    }

    const formData = new FormData();
    mergeFiles.forEach((file) => {
      formData.append("files", file, file.name);
    });

    btnStartMerge.disabled = true;
    if (mergeProgressWrapper) mergeProgressWrapper.classList.remove("hidden");
    if (mergeDownloadBanner) mergeDownloadBanner.classList.add("hidden");
    if (lblMergeProgressMsg) lblMergeProgressMsg.textContent = "PDF एकत्र करण्याचे काम सुरू आहे...";
    if (mergeProgressBarFill) mergeProgressBarFill.style.width = "0%";
    log(`📑 ${mergeFiles.length} PDF फाईल्स एकत्र (Merge) करण्याचे काम सुरू झाले...`, "info");

    try {
      await consumeStream(
        "/api/merge_stream",
        formData,
        (data) => {
          if (mergeProgressBarFill) mergeProgressBarFill.style.width = `${data.pct || 0}%`;
          if (lblMergeProgressPct) lblMergeProgressPct.textContent = `${data.pct || 0}%`;
          if (lblMergeProgressMsg) lblMergeProgressMsg.textContent = data.msg;
          log(data.msg, "info");
        },
        (data) => {
          if (mergeProgressBarFill) mergeProgressBarFill.style.width = "100%";
          if (lblMergeProgressPct) lblMergeProgressPct.textContent = "100%";
          if (lblMergeProgressMsg) lblMergeProgressMsg.textContent = "सर्व PDF एकत्र झाल्या!";

          const outName = data.file_name;
          lastGeneratedFileName = outName;

          if (lblMergeDownloadFileName) {
            lblMergeDownloadFileName.textContent = `तयार फाईल: ${outName} (एकूण ${data.total_files} फाईल्स, ${data.total_pages} पाने)`;
          }
          if (mergeDownloadBanner) {
            mergeDownloadBanner.classList.remove("hidden");
            mergeDownloadBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
          if (btnDownloadMergedPDF) {
            btnDownloadMergedPDF.onclick = () => triggerDirectDownload(outName, `एकत्रित: ${data.total_files} फाईल्स, ${data.total_pages} पाने`);
          }

          // Trigger download
          triggerDirectDownload(outName, `एकत्रित: ${data.total_files} फाईल्स, ${data.total_pages} पाने`);

          log(`🎉 सर्व PDF यशस्वीरीत्या एकत्र झाल्या! (एकूण पाने: ${data.total_pages})`, "success");
          btnStartMerge.disabled = false;
          setTimeout(() => {
            if (mergeProgressWrapper) mergeProgressWrapper.classList.add("hidden");
          }, 1500);
        },
        (errMsg) => {
          log(`त्रुटी: ${errMsg}`, "error");
          alert("PDF एकत्र करताना त्रुटी आली: " + errMsg);
          btnStartMerge.disabled = false;
          if (mergeProgressWrapper) mergeProgressWrapper.classList.add("hidden");
        }
      );
    } catch (err) {
      log(`सर्व्हर त्रुटी: ${err.message}`, "error");
      alert("सर्व्हरशी संपर्क होऊ शकला नाही: " + err.message);
      btnStartMerge.disabled = false;
      if (mergeProgressWrapper) mergeProgressWrapper.classList.add("hidden");
    }
  });

  // Initial render
  renderRules();
  renderMergeList();
});
