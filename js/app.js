/**
 * eMudra CSC Portal & Web Application Engine
 * Main Interactive Application Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  // Always trigger Welcome Modal first
  try { initWelcomeModal(); } catch (e) { console.error("Error in initWelcomeModal:", e); }
  try { initClock(); } catch (e) { console.error("Error in initClock:", e); }
  try { initAccessibility(); } catch (e) { console.error("Error in initAccessibility:", e); }
  try { initNavigation(); } catch (e) { console.error("Error in initNavigation:", e); }
  try { renderServicesCatalog(); } catch (e) { console.error("Error in renderServicesCatalog:", e); }
  try { initServiceFilters(); } catch (e) { console.error("Error in initServiceFilters:", e); }
  try { initDocsCalculator(); } catch (e) { console.error("Error in initDocsCalculator:", e); }
  try { initApplicationForm(); } catch (e) { console.error("Error in initApplicationForm:", e); }
  try { initTracker(); } catch (e) { console.error("Error in initTracker:", e); }
  try { initTokenBooking(); } catch (e) { console.error("Error in initTokenBooking:", e); }
  try { initAdminDashboard(); } catch (e) { console.error("Error in initAdminDashboard:", e); }
  try { initAdminServiceManager(); } catch (e) { console.error("Error in initAdminServiceManager:", e); }
  try { initAdminSoftwareManager(); } catch (e) { console.error("Error in initAdminSoftwareManager:", e); }
  try { initAdminLinkManager(); } catch (e) { console.error("Error in initAdminLinkManager:", e); }
  try { renderCitizenCharterTable(); } catch (e) { console.error("Error in renderCitizenCharterTable:", e); }
  try { initCharterSearch(); } catch (e) { console.error("Error in initCharterSearch:", e); }
  try { renderAdminSoftwaresTable(); } catch (e) { console.error("Error in renderAdminSoftwaresTable:", e); }
  try { renderAdminLinksTable(); } catch (e) { console.error("Error in renderAdminLinksTable:", e); }
  try { initWhatsAppDirect(); } catch (e) { console.error("Error in initWhatsAppDirect:", e); }

  // Listen for language changes to re-render dynamic content
  window.addEventListener("languageChanged", () => {
    try {
      renderServicesCatalog();
      populateServiceDropdowns();
      updateDocsCalculator(document.getElementById("docs-service-select")?.value);
      renderCitizenCharterTable();
      renderAdminServicesTable();
      renderAdminSoftwaresTable();
      renderAdminLinksTable();
    } catch (e) {
      console.error("Error on languageChanged:", e);
    }
  });
});

/**
 * Live Date & Time Clock
 */
function initClock() {
  const timeElem = document.getElementById("live-time-display");
  if (!timeElem) return;

  function update() {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    };
    const locale = CURRENT_LANG === "mr" ? "mr-IN" : "en-IN";
    timeElem.innerHTML = `<i class="fa-regular fa-clock"></i> ${now.toLocaleDateString(locale, options)}`;
  }
  update();
  setInterval(update, 1000);
}

/**
 * Accessibility Controls: Font Resizing & Contrast Toggle
 */
function initAccessibility() {
  let currentFontSize = 16;
  const root = document.documentElement;

  document.getElementById("font-increase")?.addEventListener("click", () => {
    if (currentFontSize < 20) {
      currentFontSize += 1.5;
      root.style.setProperty("--base-font-size", `${currentFontSize}px`);
    }
  });

  document.getElementById("font-reset")?.addEventListener("click", () => {
    currentFontSize = 16;
    root.style.setProperty("--base-font-size", "16px");
  });

  document.getElementById("font-decrease")?.addEventListener("click", () => {
    if (currentFontSize > 13) {
      currentFontSize -= 1.5;
      root.style.setProperty("--base-font-size", `${currentFontSize}px`);
    }
  });

  document.getElementById("contrast-toggle")?.addEventListener("click", () => {
    document.body.classList.toggle("high-contrast");
    const isHigh = document.body.classList.contains("high-contrast");
    showToast(isHigh ? "हाय कॉन्ट्रास्ट मोड सुरू केला." : "सामान्य मोड सुरू केला.", "info");
  });

  // Initialize Dark Mode Toggle
  initDarkMode();

  document.getElementById("lang-toggle-btn")?.addEventListener("click", () => {
    const nextLang = CURRENT_LANG === "mr" ? "en" : "mr";
    setLanguage(nextLang);
    showToast(nextLang === "mr" ? "भाषा मराठीमध्ये बदलली." : "Language changed to English.", "success");
  });
}

/**
 * Dark Mode Theme Controller with persistence & smooth UI feedback
 */
function initDarkMode() {
  const toggleBtn = document.getElementById("dark-mode-toggle");
  const savedTheme = localStorage.getItem("emudra_theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    applyTheme("dark", false);
  } else {
    applyTheme("light", false);
  }

  toggleBtn?.addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark-mode");
    const nextTheme = isDark ? "light" : "dark";
    applyTheme(nextTheme, true);
  });

  window.addEventListener("languageChanged", () => {
    updateDarkModeBtnUi(document.body.classList.contains("dark-mode"));
  });
}

function applyTheme(theme, showNotice = false) {
  const isDark = theme === "dark";
  if (isDark) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
  localStorage.setItem("emudra_theme", theme);
  updateDarkModeBtnUi(isDark);

  if (showNotice) {
    const isMr = CURRENT_LANG === "mr";
    const msg = isDark 
      ? (isMr ? "🌙 डार्क मोड सुरू केला." : "🌙 Dark Mode activated.") 
      : (isMr ? "☀️ लाईट मोड सुरू केला." : "☀️ Light Mode activated.");
    showToast(msg, "info");
  }
}

function updateDarkModeBtnUi(isDark) {
  const icon = document.getElementById("dark-mode-icon");
  const text = document.getElementById("dark-mode-text");
  const btn = document.getElementById("dark-mode-toggle");
  const isMr = CURRENT_LANG === "mr";

  if (icon) {
    icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
    icon.style.color = isDark ? "#facc15" : "#fde047";
  }
  if (text) {
    text.textContent = isDark 
      ? (isMr ? "लाईट मोड" : "Light Mode") 
      : (isMr ? "डार्क मोड" : "Dark Mode");
  }
  if (btn) {
    btn.title = isDark 
      ? (isMr ? "लाईट मोडवर स्विच करा" : "Switch to Light Mode") 
      : (isMr ? "डार्क मोडवर स्विच करा" : "Switch to Dark Mode");
  }
}

/**
 * Mobile Navigation & Smooth Scroll
 */
function initNavigation() {
  const menuBtn = document.getElementById("mobile-menu-toggle");
  const navLinks = document.getElementById("main-nav-links");

  menuBtn?.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });

  // Close nav on item click
  document.querySelectorAll(".nav-item a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks?.classList.remove("show");
    });
  });

  // App Tabs Switching
  const tabButtons = document.querySelectorAll(".app-tab-btn");
  const tabPanels = document.querySelectorAll(".app-tab-panel");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      tabPanels.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab-target");
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });
}

/**
 * Switch Web App Tab programmatically
 */
function switchTab(tabId) {
  const btn = document.querySelector(`.app-tab-btn[data-tab-target="${tabId}"]`);
  if (btn) btn.click();
  const webAppSec = document.getElementById("interactive-app");
  if (webAppSec) webAppSec.scrollIntoView({ behavior: "smooth" });
}

/**
 * Render Services Grid
 */
function renderServicesCatalog(filterCategory = "all", searchQuery = "") {
  const grid = document.getElementById("services-grid-container");
  if (!grid) return;

  grid.innerHTML = "";

  const isMr = CURRENT_LANG === "mr";
  const filtered = SERVICES_DATA.filter(service => {
    const matchCat = filterCategory === "all" || service.category === filterCategory;
    const title = isMr ? service.title_mr : service.title_en;
    const desc = isMr ? service.desc_mr : service.desc_en;
    const matchSearch = !searchQuery || 
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;">
        <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; color: #94a3b8; margin-bottom: 1rem;"></i>
        <h3 style="color: var(--primary-navy);">${isMr ? "कोणतीही सेवा सापडली नाही." : "No services found."}</h3>
        <p style="color: var(--text-muted);">${isMr ? "कृपया वेगळा शब्द शोधून पहा किंवा श्रेणी बदला." : "Please try different keywords or category."}</p>
      </div>
    `;
    return;
  }

  filtered.forEach(service => {
    const card = document.createElement("div");
    card.className = `service-card ${service.category}`;
    
    const title = isMr ? service.title_mr : service.title_en;
    const desc = isMr ? service.desc_mr : service.desc_en;
    const timeline = isMr ? service.timeline_mr : service.timeline_en;

    card.innerHTML = `
      ${service.popular ? `<div class="card-badge-popular"><i class="fa-solid fa-star"></i> ${isMr ? "लोकप्रिय" : "Popular"}</div>` : ""}
      <div>
        <div class="service-card-header">
          <div class="service-icon-box">
            <i class="${service.icon}"></i>
          </div>
          <div>
            <h3 class="service-card-title">${title}</h3>
          </div>
        </div>
        <p class="service-card-desc">${desc}</p>
        <div class="service-meta-box">
          <div class="meta-item">
            <div class="meta-label">${t("time_label")}</div>
            <div class="meta-val"><i class="fa-regular fa-clock"></i> ${timeline}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">${t("fee_label")}</div>
            <div class="meta-val price">₹${service.total_fee.toFixed(2)}</div>
          </div>
        </div>
      </div>
      <div class="service-card-actions">
        <button class="btn-card-doc" onclick="openDocsModal('${service.id}')">
          <i class="fa-solid fa-list-check"></i> ${t("btn_view_docs")}
        </button>
        <button class="btn-card-apply" onclick="startApplyForService('${service.id}')">
          <i class="fa-solid fa-file-pen"></i> ${t("btn_apply_this")}
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

/**
 * Filter & Search handlers for Services Catalog
 */
function initServiceFilters() {
  const catButtons = document.querySelectorAll(".cat-btn");
  let currentCat = "all";

  catButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      catButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCat = btn.getAttribute("data-category");
      const searchVal = document.getElementById("services-search-input")?.value || "";
      renderServicesCatalog(currentCat, searchVal);
    });
  });

  const searchInput = document.getElementById("services-search-input");
  searchInput?.addEventListener("input", (e) => {
    renderServicesCatalog(currentCat, e.target.value);
  });
}

/**
 * Document Checklist & Fee Calculator Tab
 */
function initDocsCalculator() {
  populateServiceDropdowns();

  const docSelect = document.getElementById("docs-service-select");
  docSelect?.addEventListener("change", (e) => {
    updateDocsCalculator(e.target.value);
  });

  if (docSelect && SERVICES_DATA.length > 0) {
    updateDocsCalculator(SERVICES_DATA[0].id);
  }
}

function populateServiceDropdowns() {
  const isMr = CURRENT_LANG === "mr";
  const select1 = document.getElementById("docs-service-select");
  const select2 = document.getElementById("app-service-select");
  const select3 = document.getElementById("token-service-select");

  const optionsHtml = SERVICES_DATA.map(s => {
    const title = isMr ? s.title_mr : s.title_en;
    return `<option value="${s.id}">${title}</option>`;
  }).join("");

  if (select1) select1.innerHTML = optionsHtml;
  if (select2) select2.innerHTML = `<option value="">${isMr ? "-- सेवा निवडा --" : "-- Select Service --"}</option>` + optionsHtml;
  if (select3) select3.innerHTML = `<option value="">${isMr ? "-- सेवेचे कारण निवडा --" : "-- Select Purpose --"}</option>` + optionsHtml;
}

/**
 * Helper to render categorized and grouped documents checklist HTML
 */
function renderDocumentsListHtml(documents, isMr) {
  if (!documents || documents.length === 0) {
    return `<div style="color: var(--text-muted); font-size: 0.88rem;">${isMr ? "कोणतेही विशेष कागदपत्र आवश्यक नाही." : "No specific documents required."}</div>`;
  }

  let currentGroup = null;
  let html = "";

  documents.forEach(doc => {
    if (doc.group && doc.group !== currentGroup) {
      currentGroup = doc.group;
      html += `
        <div class="doc-group-header">
          <i class="fa-solid fa-folder-tree"></i>
          <span>${currentGroup}</span>
        </div>
      `;
    }

    const name = isMr ? doc.name_mr : doc.name_en;
    const badgeText = doc.required 
      ? (isMr ? 'अनिवार्य' : 'Mandatory') 
      : (isMr ? 'पर्यायी' : 'Optional');

    html += `
      <div class="doc-check-row">
        <div class="doc-name">
          <i class="fa-solid ${doc.required ? 'fa-circle-check text-success' : 'fa-circle-dot'}" style="color: ${doc.required ? '#16a34a' : '#94a3b8'};"></i>
          <span>${name}</span>
        </div>
        <div>
          <span class="${doc.required ? 'doc-badge-req' : 'doc-badge-opt'}">
            ${badgeText}
          </span>
        </div>
      </div>
    `;
  });

  return html;
}

/**
 * Helper to render detailed fee breakdown table rows
 */
function renderFeeBreakdownRows(service, isMr) {
  if (service.fee_breakdown) {
    const fb = service.fee_breakdown;
    return `
      <tr>
        <td><i class="fa-solid fa-landmark" style="color: var(--primary-navy);"></i> ${isMr ? 'शासकीय शुल्क (Fixed Government Fee)' : 'Fixed Govt Fee'}</td>
        <td style="text-align: right; font-weight: 700; font-family: var(--font-sans);">₹${fb.govt_fee.toFixed(2)}</td>
      </tr>
      <tr>
        <td><i class="fa-solid fa-file-invoice" style="color: #0284c7;"></i> ${isMr ? 'छापील अर्ज फॉर्म + ऑफलाइन अर्ज भरणे (Offline Form Filling)' : 'Application Form & Offline Filling'}</td>
        <td style="text-align: right; font-weight: 700; font-family: var(--font-sans);">₹${fb.form_fee.toFixed(2)}</td>
      </tr>
      <tr>
        <td><i class="fa-solid fa-print" style="color: #d97706;"></i> ${isMr ? 'दस्तऐवज स्कॅनिंग खर्च (Document Scanning Cost)' : 'Scanning & Upload Cost'}</td>
        <td style="text-align: right; font-weight: 700; font-family: var(--font-sans);">₹${fb.scanning_fee.toFixed(2)}</td>
      </tr>
      <tr>
        <td><i class="fa-solid fa-keyboard" style="color: #7c3aed;"></i> ${isMr ? 'अर्ज पुनर्लेखन व ऑनलाइन फाईलिंग (Online Filing & Writing)' : 'Writing & Online Filing'}</td>
        <td style="text-align: right; font-weight: 700; font-family: var(--font-sans);">₹${fb.filing_fee.toFixed(2)}</td>
      </tr>
      <tr>
        <td><i class="fa-solid fa-id-card-clip" style="color: #059669;"></i> ${isMr ? 'प्रमाणपत्र लॅमिनेशन (Certificate Lamination)' : 'Certificate Lamination'}</td>
        <td style="text-align: right; font-weight: 700; font-family: var(--font-sans);">₹${(fb.lamination_fee || 30.00).toFixed(2)}</td>
      </tr>
      <tr class="total-row">
        <td><i class="fa-solid fa-circle-check" style="color: #16a34a;"></i> <strong>${isMr ? 'एकूण देय शुल्क (Total Amount)' : 'Total Payable Amount'}</strong></td>
        <td style="text-align: right; font-weight: 800; font-size: 1.15rem; color: #15803d; font-family: var(--font-sans);">₹${fb.total.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="2" style="font-size: 0.8rem; color: #64748b; padding-top: 10px;">
          <i class="fa-solid fa-clock"></i> ${isMr ? 'अपेक्षित वितरण कालावधी:' : 'Expected Timeline:'} <strong>${isMr ? service.timeline_mr : service.timeline_en}</strong>
        </td>
      </tr>
    `;
  }

  return `
    <tr>
      <td>${isMr ? 'शासकीय शुल्क (Government Fee)' : 'Government Fee'}</td>
      <td style="text-align: right; font-weight: 700; font-family: var(--font-sans);">₹${service.govt_fee.toFixed(2)}</td>
    </tr>
    <tr>
      <td>${isMr ? 'सीएससी / पोर्टल साहाय्य शुल्क (CSC Service Charge)' : 'CSC / Portal Service Charge'}</td>
      <td style="text-align: right; font-weight: 700; font-family: var(--font-sans);">₹${service.csc_fee.toFixed(2)}</td>
    </tr>
    <tr class="total-row">
      <td><strong>${isMr ? 'एकूण देय रक्कम (Total Payable Amount)' : 'Total Amount'}</strong></td>
      <td style="text-align: right; font-weight: 800; font-size: 1.15rem; color: #15803d; font-family: var(--font-sans);">₹${service.total_fee.toFixed(2)}</td>
    </tr>
    <tr>
      <td colspan="2" style="font-size: 0.8rem; color: #64748b; padding-top: 10px;">
        <i class="fa-solid fa-clock"></i> ${isMr ? 'अपेक्षित वितरण कालावधी:' : 'Expected Timeline:'} <strong>${isMr ? service.timeline_mr : service.timeline_en}</strong>
      </td>
    </tr>
  `;
}

function updateDocsCalculator(serviceId) {
  const service = SERVICES_DATA.find(s => s.id === serviceId);
  if (!service) return;

  const isMr = CURRENT_LANG === "mr";
  const listContainer = document.getElementById("docs-items-container");
  const feeTableBody = document.getElementById("fee-breakdown-tbody");

  if (listContainer) {
    listContainer.innerHTML = renderDocumentsListHtml(service.documents, isMr);
  }

  if (feeTableBody) {
    feeTableBody.innerHTML = renderFeeBreakdownRows(service, isMr);
  }
}

/**
 * Open Document Checklist Modal
 */
function openDocsModal(serviceId) {
  const service = SERVICES_DATA.find(s => s.id === serviceId);
  if (!service) return;

  const isMr = CURRENT_LANG === "mr";
  const modal = document.getElementById("docs-info-modal");
  const titleElem = document.getElementById("docs-modal-title");
  const bodyElem = document.getElementById("docs-modal-body");

  if (titleElem) titleElem.textContent = isMr ? service.title_mr : service.title_en;
  if (bodyElem) {
    const feeBreakdownSummary = service.fee_breakdown ? `
      <div style="background: #f8fafc; padding: 0.85rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 1rem;">
        <div style="font-size: 0.85rem; font-weight: 700; color: var(--primary-navy); margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.4rem;">
          <i class="fa-solid fa-receipt text-primary"></i> ${isMr ? 'अधिकृत शुल्क विवरण (Fee Breakdown):' : 'Official Fee Breakdown:'}
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.4rem; font-size: 0.78rem; color: #475569;">
          <div style="background: #ffffff; padding: 4px 8px; border-radius: 4px; border: 1px solid #edf2f7;">शासकीय शुल्क: <strong>₹${service.fee_breakdown.govt_fee.toFixed(2)}</strong></div>
          <div style="background: #ffffff; padding: 4px 8px; border-radius: 4px; border: 1px solid #edf2f7;">अर्ज फॉर्म+ऑफलाइन: <strong>₹${service.fee_breakdown.form_fee.toFixed(2)}</strong></div>
          <div style="background: #ffffff; padding: 4px 8px; border-radius: 4px; border: 1px solid #edf2f7;">स्कॅनिंग खर्च: <strong>₹${service.fee_breakdown.scanning_fee.toFixed(2)}</strong></div>
          <div style="background: #ffffff; padding: 4px 8px; border-radius: 4px; border: 1px solid #edf2f7;">ऑनलाइन फाईलिंग: <strong>₹${service.fee_breakdown.filing_fee.toFixed(2)}</strong></div>
          <div style="background: #ffffff; padding: 4px 8px; border-radius: 4px; border: 1px solid #edf2f7;">लॅमिनेशन: <strong>₹${(service.fee_breakdown.lamination_fee || 30.00).toFixed(2)}</strong></div>
        </div>
      </div>
    ` : '';

    bodyElem.innerHTML = `
      <div style="margin-bottom: 0.75rem;">
        <p style="color: var(--text-muted); font-size: 0.92rem;">${isMr ? service.desc_mr : service.desc_en}</p>
      </div>
      ${feeBreakdownSummary}
      <h4 style="font-size: 1rem; color: var(--primary-navy); margin-bottom: 0.75rem;">
        <i class="fa-solid fa-list-check" style="color: var(--saffron-orange);"></i> ${isMr ? 'आवश्यक कागदपत्रे व पुरावे सूची:' : 'Required Documents Checklist:'}
      </h4>
      <div class="doc-items-list" style="margin-bottom: 1.25rem; max-height: 55vh; overflow-y: auto; padding-right: 4px;">
        ${renderDocumentsListHtml(service.documents, isMr)}
      </div>
      <div style="background: #f1f5f9; padding: 1rem; border-radius: 8px; border: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <div style="font-size: 0.8rem; color: #64748b;">${isMr ? 'एकूण देय शुल्क (Total Applicable Charges):' : 'Total Charges:'}</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: #15803d; font-family: var(--font-sans);">₹${service.total_fee.toFixed(2)}</div>
        </div>
        <button class="btn-form-submit" onclick="closeModal('docs-info-modal'); startApplyForService('${service.id}');">
          <i class="fa-solid fa-file-pen"></i> ${isMr ? 'या सेवेसाठी अर्ज करा' : 'Apply For This Service'}
        </button>
      </div>
    `;
  }

  if (modal) {
    modal.style.display = "flex";
    modal.classList.add("active");
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("active");
    // If no other modal is active, restore scrolling
    if (!document.querySelector(".modal-overlay.active, .welcome-modal-overlay.active")) {
      document.body.style.overflow = "";
    }
  }
}

/**
 * In-Page High-Definition Document Preview Popup Modal (Lightbox)
 * Shows image / PDF directly in a clean modal popup without opening new tabs.
 */
function openDocumentViewer(docUrl, docName = "दस्तऐवज", docFormat = "img") {
  const modal = document.getElementById("doc-viewer-modal");
  const titleElem = document.getElementById("doc-viewer-title");
  const metaElem = document.getElementById("doc-viewer-meta");
  const bodyElem = document.getElementById("doc-viewer-body");
  const iconElem = document.getElementById("doc-viewer-icon");
  const downloadBtn = document.getElementById("doc-btn-download");
  const printBtn = document.getElementById("doc-btn-print");
  const isMr = CURRENT_LANG === "mr";

  if (!modal || !bodyElem) return;

  const isPdf = docFormat?.toLowerCase() === "pdf" || docUrl.includes(".pdf") || docUrl.startsWith("data:application/pdf");

  if (titleElem) titleElem.textContent = docName;
  if (metaElem) metaElem.textContent = `${isMr ? 'स्वरूप' : 'Format'}: ${(docFormat || (isPdf ? 'PDF' : 'JPG')).toUpperCase()} • ${isMr ? 'अधिकृत दस्तऐवज' : 'Official Document'}`;
  if (iconElem) {
    iconElem.className = isPdf ? "fa-solid fa-file-pdf text-primary" : "fa-solid fa-file-image text-primary";
  }

  // Setup Action Buttons
  if (downloadBtn) {
    downloadBtn.onclick = () => {
      const a = document.createElement("a");
      a.href = docUrl;
      a.download = `${docName}.${isPdf ? 'pdf' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(isMr ? "दस्तऐवज डाउनलोड सुरू झाले!" : "Download started!", "info");
    };
  }

  if (printBtn) {
    printBtn.onclick = () => {
      if (isPdf) {
        const iframe = document.querySelector(".doc-viewer-iframe");
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.print();
        } else {
          window.print();
        }
      } else {
        const printWin = window.open("", "_blank");
        if (printWin) {
          printWin.document.write(`<html><head><title>${docName}</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;"><img src="${docUrl}" style="max-width:100%;max-height:100vh;" onload="window.print();window.close();" /></body></html>`);
          printWin.document.close();
        }
      }
    };
  }

  if (isPdf) {
    bodyElem.innerHTML = `
      <div class="doc-viewer-pdf-container">
        <iframe src="${docUrl}#toolbar=0" class="doc-viewer-iframe" title="${docName}"></iframe>
      </div>
    `;
  } else {
    bodyElem.innerHTML = `
      <div class="doc-viewer-img-container">
        <img src="${docUrl}" alt="${docName}" class="doc-viewer-img" />
      </div>
    `;
  }

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

/**
 * Welcome Banner Popup Modal Controller
 * Auto-triggers when the user opens the website
 */
function initWelcomeModal() {
  const modal = document.getElementById("welcome-banner-modal");
  if (!modal) return;

  // Auto show on site open with a slight 350ms delay for smooth appearance
  setTimeout(() => {
    openWelcomeModal();
  }, 350);

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      closeWelcomeModal();
    }
  });

  // Close when clicking directly on overlay backdrop
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeWelcomeModal();
    }
  });
}

function openWelcomeModal() {
  const modal = document.getElementById("welcome-banner-modal");
  if (!modal) return;
  modal.style.display = "flex";
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeWelcomeModal() {
  const modal = document.getElementById("welcome-banner-modal");
  if (!modal) return;
  modal.style.display = "none";
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

window.openWelcomeModal = openWelcomeModal;
window.closeWelcomeModal = closeWelcomeModal;
window.handleWelcomeAction = handleWelcomeAction;

function handleWelcomeAction(action) {
  closeWelcomeModal();
  if (action === "services") {
    const servicesSection = document.getElementById("services");
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: "smooth" });
    }
  } else if (action === "apply") {
    switchTab("tab-apply-form");
  }
}

/**
 * Jump to Application Form with service preselected
 */
function startApplyForService(serviceId) {
  switchTab("tab-apply-form");
  const select = document.getElementById("app-service-select");
  if (select) {
    select.value = serviceId;
  }
}

// Global store for uploaded documents in current form session
let uploadedApplicationDocs = {
  aadhaar: null,
  ration: null,
  income: null
};

/**
 * Interactive Multi-Step Application Form Submission & Cloudinary Document Uploads
 */
function initApplicationForm() {
  const form = document.getElementById("citizen-application-form");
  if (!form) return;

  // Auto-format Aadhaar Input (XXXX-XXXX-XXXX)
  const aadhaarInput = document.getElementById("app-aadhaar");
  aadhaarInput?.addEventListener("input", (e) => {
    let val = e.target.value.replace(/\D/g, "").substring(0, 12);
    let formatted = val.match(/.{1,4}/g)?.join("-") || val;
    e.target.value = formatted;
  });

  // Setup Cloudinary Document Upload Listeners
  initDocumentUploads();

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const serviceSelect = document.getElementById("app-service-select");
    const serviceId = serviceSelect.value;
    if (!serviceId) {
      showToast(CURRENT_LANG === "mr" ? "कृपया अर्ज करावयाची सेवा निवडा." : "Please select a service.", "error");
      serviceSelect.focus();
      return;
    }

    const serviceObj = SERVICES_DATA.find(s => s.id === serviceId);
    const applicantName = document.getElementById("app-name").value.trim();
    const fatherName = document.getElementById("app-father").value.trim();
    const gender = document.getElementById("app-gender").value;
    const dob = document.getElementById("app-dob").value;
    const mobile = document.getElementById("app-mobile").value.trim();
    const email = document.getElementById("app-email")?.value.trim() || "";
    const aadhaar = document.getElementById("app-aadhaar").value.trim();
    const address = document.getElementById("app-address").value.trim();
    const taluka = document.getElementById("app-taluka").value.trim();
    const district = document.getElementById("app-district").value.trim();
    const pincode = document.getElementById("app-pincode").value.trim();
    const income = document.getElementById("app-income")?.value.trim() || "0";
    const purpose = document.getElementById("app-purpose").value.trim();

    if (mobile.length < 10) {
      showToast(CURRENT_LANG === "mr" ? "कृपया वैध १० अंकी मोबाईल नंबर टाका." : "Please enter valid 10 digit mobile number.", "error");
      return;
    }

    const newApp = saveApplication({
      serviceId,
      serviceName_mr: serviceObj ? serviceObj.title_mr : "नागरिक सेवा",
      serviceName_en: serviceObj ? serviceObj.title_en : "Citizen Service",
      applicantName,
      fatherName,
      gender,
      dob,
      mobile,
      email,
      aadhaar,
      address,
      taluka,
      district,
      pincode,
      income,
      purpose,
      totalFee: serviceObj ? serviceObj.total_fee : 50.00,
      feeBreakdown: serviceObj ? serviceObj.fee_breakdown : null,
      documents: { ...uploadedApplicationDocs }
    });

    // ☁️ Supabase मध्ये save करा
    if (typeof DB !== "undefined" && DB.saveApplication) {
      DB.saveApplication({
        appId:       newApp.id,
        serviceId:   serviceId,
        serviceName: serviceObj ? serviceObj.title_mr : "नागरिक सेवा",
        fullName:    applicantName,
        mobile:      mobile,
        aadhaar:     aadhaar,
        email:       email,
        address:     address + ", " + taluka + ", " + district,
        purpose:     purpose,
        docs:        Object.values(uploadedApplicationDocs).filter(d => d !== null)
      }).then(ok => {
        if (ok) console.log("✅ Supabase: Application saved");
      }).catch(err => console.warn("Supabase save failed:", err));
    }

    showToast(CURRENT_LANG === "mr" ? `✅ अर्ज यशस्वीरित्या सादर केला! अर्ज क्र: ${newApp.id}` : `✅ Application submitted! ID: ${newApp.id}`, "success");
    form.reset();
    resetDocumentUploadCards();

    // Show Printable Receipt Modal
    showReceiptModal(newApp);
  });
}

/**
 * Setup Real-time Cloudinary Upload Listeners for Document Inputs
 */
function initDocumentUploads() {
  const docInputs = [
    { id: "doc-file-aadhaar", type: "aadhaar", label_mr: "आधार कार्ड प्रत", label_en: "Aadhaar Card" },
    { id: "doc-file-ration", type: "ration", label_mr: "रेशन कार्ड / LC", label_en: "Ration Card / LC" },
    { id: "doc-file-income", type: "income", label_mr: "उत्पन्न पुरावा / ७-१२", label_en: "Income Proof / 7-12" }
  ];

  docInputs.forEach(item => {
    const input = document.getElementById(item.id);
    const card = document.getElementById(`upload-card-${item.type}`);
    const statusChip = document.getElementById(`status-${item.type}`);
    const track = document.getElementById(`progress-track-${item.type}`);
    const fill = document.getElementById(`progress-fill-${item.type}`);
    const preview = document.getElementById(`preview-${item.type}`);

    input?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate max file size (10 MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast(CURRENT_LANG === "mr" ? "कृपया १० MB पेक्षा कमी आकाराची फाईल निवडा." : "File size must be under 10MB.", "error");
        input.value = "";
        return;
      }

      // UI uploading state
      if (statusChip) {
        statusChip.textContent = CURRENT_LANG === "mr" ? "⏳ अपलोड होत आहे..." : "⏳ Uploading...";
        statusChip.className = "upload-status-chip uploading";
      }
      if (track) track.style.display = "block";
      if (fill) fill.style.width = "15%";

      try {
        const result = await uploadToCloudinary(file, (percent) => {
          if (fill) fill.style.width = `${percent}%`;
        });

        // Store result in memory
        uploadedApplicationDocs[item.type] = {
          name: CURRENT_LANG === "mr" ? item.label_mr : item.label_en,
          url: result.url,
          format: result.format || file.name.split('.').pop(),
          size: result.bytes,
          fileName: file.name
        };

        // UI success state
        if (card) card.classList.add("uploaded");
        if (statusChip) {
          statusChip.textContent = CURRENT_LANG === "mr" ? "✅ अपलोड पूर्ण" : "✅ Uploaded";
          statusChip.className = "upload-status-chip success";
        }
        if (fill) fill.style.width = "100%";
        if (preview) {
          const origText = result.originalSize > 1024 * 1024 
            ? `${(result.originalSize / (1024 * 1024)).toFixed(1)} MB` 
            : `${(result.originalSize / 1024).toFixed(0)} KB`;
          const compText = `${(result.compressedSize / 1024).toFixed(0)} KB`;

          const sizeBadge = result.wasCompressed
            ? `<div class="doc-compress-pill"><i class="fa-solid fa-compress"></i> ${CURRENT_LANG === "mr" ? 'कॉम्प्रेस केले:' : 'Compressed:'} <strong>${origText} ➜ ${compText}</strong> <span style="color:#16a34a;">(${result.savedPercent || 0}% बचत)</span></div>`
            : `<div class="doc-compress-pill"><i class="fa-solid fa-circle-check"></i> ${CURRENT_LANG === "mr" ? 'आकार:' : 'Size:'} <strong>${compText}</strong> (< 500 KB)</div>`;

          preview.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px;">
              <button type="button" class="btn-doc-preview-inline" onclick="openDocumentViewer('${result.url}', '${item.label_mr}', '${result.format}')">
                <i class="fa-solid fa-eye"></i> 
                ${CURRENT_LANG === "mr" ? 'पॉपअपमध्ये पहा' : 'View in Popup'} (${(result.format || 'doc').toUpperCase()})
              </button>
              ${sizeBadge}
            </div>
          `;
        }

        const compNotice = result.wasCompressed 
          ? ` (${(result.originalSize / 1024).toFixed(0)} KB ➜ ${(result.compressedSize / 1024).toFixed(0)} KB)` 
          : '';
        showToast(CURRENT_LANG === "mr" ? `✅ ${item.label_mr} सेव्ह झाले!${compNotice}` : `✅ ${item.label_en} saved!`, "success");
      } catch (err) {
        console.error("Cloudinary upload failed", err);
        if (statusChip) {
          statusChip.textContent = CURRENT_LANG === "mr" ? "❌ अयशस्वी (पुन्हा प्रयत्न करा)" : "❌ Failed (Retry)";
          statusChip.className = "upload-status-chip";
        }
        if (fill) fill.style.width = "0%";
        showToast(CURRENT_LANG === "mr" ? "कागदपत्र अपलोड करण्यात त्रुटी आली. कृपया पुन्हा प्रयत्न करा." : "Document upload failed. Please try again.", "error");
      }
    });
  });
}

function resetDocumentUploadCards() {
  uploadedApplicationDocs = { aadhaar: null, ration: null, income: null };
  ['aadhaar', 'ration', 'income'].forEach(type => {
    const card = document.getElementById(`upload-card-${type}`);
    const statusChip = document.getElementById(`status-${type}`);
    const track = document.getElementById(`progress-track-${type}`);
    const fill = document.getElementById(`progress-fill-${type}`);
    const preview = document.getElementById(`preview-${type}`);

    if (card) card.classList.remove("uploaded");
    if (statusChip) {
      statusChip.textContent = CURRENT_LANG === "mr" ? "प्रत निवडा" : "Choose File";
      statusChip.className = "upload-status-chip";
    }
    if (track) track.style.display = "none";
    if (fill) fill.style.width = "0%";
    if (preview) preview.innerHTML = "";
  });
}

/**
 * Generate QR Code on Canvas
 */
function generateQrOnCanvas(canvasId, text) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Simple clean mock QR representation for instant offline crisp render
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000000";

  // Border & Finder Patterns
  const size = canvas.width;
  ctx.fillRect(10, 10, 30, 30);
  ctx.clearRect(15, 15, 20, 20);
  ctx.fillRect(20, 20, 10, 10);

  ctx.fillRect(size - 40, 10, 30, 30);
  ctx.clearRect(size - 35, 15, 20, 20);
  ctx.fillRect(size - 30, 20, 10, 10);

  ctx.fillRect(10, size - 40, 30, 30);
  ctx.clearRect(15, size - 35, 20, 20);
  ctx.fillRect(20, size - 30, 10, 10);

  // Matrix dots representation
  for (let x = 12; x < size - 12; x += 8) {
    for (let y = 12; y < size - 12; y += 8) {
      if ((x < 45 && y < 45) || (x > size - 45 && y < 45) || (x < 45 && y > size - 45)) continue;
      if (Math.random() > 0.45) {
        ctx.fillRect(x, y, 5, 5);
      }
    }
  }
}

/**
 * Display Official Acknowledgment Receipt Modal & prepare printable area
 */
function showReceiptModal(app) {
  const isMr = CURRENT_LANG === "mr";
  const modal = document.getElementById("receipt-modal");
  const container = document.getElementById("receipt-modal-content");
  const printArea = document.getElementById("printable-receipt-area");

  const receiptHtml = `
    <div class="receipt-official-box">
      <div class="receipt-header">
        <div style="display: inline-block; width: 50px; height: 50px; border-radius: 50%; border: 2px solid #000; line-height: 46px; font-size: 24px; font-weight: 800; margin-bottom: 5px;">
          🏛️
        </div>
        <h2>महाराष्ट्र शासन • उपविभागीय अधिकारी कार्यालय</h2>
        <h3>ई-मुद्रा सीएससी व आपले सरकार केंद्र (अधिकृत पोच पावती)</h3>
        <p>Center ID: ${CENTER_INFO.cscId} | Contact: ${CENTER_INFO.phone} | Address: ${CENTER_INFO.address_mr}</p>
      </div>

      <div class="receipt-meta-grid">
        <div class="item">
          <strong>अर्ज क्रमांक (Application ID):</strong>
          <span style="font-family: var(--font-sans); font-weight: 800;">${app.id}</span>
        </div>
        <div class="item">
          <strong>अर्ज तारीख (Date of Application):</strong>
          <span>${app.date}</span>
        </div>
        <div class="item">
          <strong>अर्जदाराचे नाव (Applicant Name):</strong>
          <span>${app.applicantName}</span>
        </div>
        <div class="item">
          <strong>मोबाईल क्र. (Mobile):</strong>
          <span style="font-family: var(--font-sans);">${app.mobile}</span>
        </div>
        <div class="item">
          <strong>आधार क्र. (Aadhaar No):</strong>
          <span style="font-family: var(--font-sans);">${app.aadhaar || 'उपलब्ध नाही'}</span>
        </div>
        <div class="item">
          <strong>पत्ता व तालुका:</strong>
          <span>${app.address}, ${app.taluka}</span>
        </div>
      </div>

      <table class="receipt-table">
        <thead>
          <tr>
            <th>अ.क्र.</th>
            <th>तपशील (Applied Service & Fee Breakdown)</th>
            <th>प्रयोजन (Purpose)</th>
            <th style="text-align: right;">भरलेले शुल्क (Paid Amount)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>१</td>
            <td>
              <strong>${isMr ? app.serviceName_mr : app.serviceName_en}</strong>
              ${app.feeBreakdown ? `
                <div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4;">
                  • शासकीय शुल्क: <strong>₹${app.feeBreakdown.govt_fee.toFixed(2)}</strong> | • अर्ज फॉर्म + ऑफलाइन: <strong>₹${app.feeBreakdown.form_fee.toFixed(2)}</strong><br>
                  • स्कॅनिंग: <strong>₹${app.feeBreakdown.scanning_fee.toFixed(2)}</strong> | • ऑनलाइन फाईलिंग: <strong>₹${app.feeBreakdown.filing_fee.toFixed(2)}</strong> | • लॅमिनेशन: <strong>₹${(app.feeBreakdown.lamination_fee || 30.00).toFixed(2)}</strong>
                </div>
              ` : ''}
            </td>
            <td>${app.purpose}</td>
            <td style="text-align: right; font-weight: 700; font-family: var(--font-sans);">₹${app.totalFee.toFixed(2)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="background: #f8fafc; font-weight: 800;">
            <td colspan="3" style="text-align: right; font-size: 13px;">एकूण भरलेली रक्कम (Total Amount Paid):</td>
            <td style="text-align: right; font-size: 15px; color: #15803d; font-family: var(--font-sans);">₹${app.totalFee.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      ${app.documents && Object.values(app.documents).some(d => d !== null) ? `
        <div style="background: #f8fafc; padding: 10px 12px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 20px; font-size: 12px;">
          <div style="font-weight: 700; color: var(--primary-navy); margin-bottom: 6px; display: flex; align-items: center; gap: 5px;">
            <i class="fa-solid fa-cloud-arrow-up" style="color: var(--saffron-orange);"></i>
            <span>${isMr ? 'जोडलेले क्लाउड दस्तऐवज (Cloud Documents):' : 'Uploaded Cloud Documents:'}</span>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${Object.entries(app.documents).filter(([_, doc]) => doc && doc.url).map(([_, doc]) => `
              <button type="button" class="btn-doc-chip" onclick="openDocumentViewer('${doc.url}', '${doc.name || 'दस्तऐवज'}', '${doc.format}')">
                <i class="fa-solid ${doc.format === 'pdf' ? 'fa-file-pdf' : 'fa-file-image'}" style="color: ${doc.format === 'pdf' ? '#dc2626' : '#2563eb'};"></i>
                <span>${doc.name || 'दस्तऐवज'}</span>
                <i class="fa-solid fa-eye" style="font-size: 10px; margin-left: 2px;"></i>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div style="background: #f0fdf4; padding: 10px; border-radius: 6px; border: 1px solid #bbf7d0; margin-bottom: 20px; font-size: 13px;">
        <strong>सद्यस्थिती:</strong> <span class="status-badge-chip status-${app.status}">${isMr ? app.status_mr : app.status_en}</span>
        <br><span style="color: #475569;">${app.remarks || 'कागदपत्रे तपासणी प्रक्रिया सुरू आहे.'}</span>
      </div>

      <div class="receipt-footer-row">
        <div class="qr-barcode-box">
          <canvas id="receipt-qr-canvas" width="90" height="90"></canvas>
          <div style="font-size: 8pt; margin-top: 4px; font-family: var(--font-sans);">${app.id}</div>
        </div>
        <div class="sign-seal-box">
          <p>अधिकृत डिजिटल स्वाक्षरी व शिक्का</p>
          <p style="color: #134074; margin-top: 15px;">[ VLE KIOSK OPERATOR ]</p>
          <p style="font-size: 8pt; color: #555;">${CENTER_INFO.vleName_mr}</p>
        </div>
      </div>

      <div class="receipt-note">
        टीप: ही अधिकृत डिजिटल संगणकीय पोच पावती आहे. अर्जाची स्थिती तपासण्यासाठी वर दिलेला अर्ज क्रमांक (Application ID) किंवा मोबाईल नंबर वापरावा.
      </div>
    </div>
  `;

  if (container) container.innerHTML = receiptHtml;
  if (printArea) printArea.innerHTML = receiptHtml;

  generateQrOnCanvas("receipt-qr-canvas", `https://emudracsc.in/track?id=${app.id}`);
  modal?.classList.add("active");
}

function printReceipt() {
  window.print();
}

/**
 * Status Tracker Module
 */
function initTracker() {
  const searchBtn = document.getElementById("tracker-search-btn");
  const input = document.getElementById("tracker-search-input");

  function performSearch() {
    const query = input?.value.trim();
    if (!query) {
      showToast(CURRENT_LANG === "mr" ? "कृपया अर्ज क्रमांक किंवा मोबाईल नंबर टाका." : "Please enter application ID or mobile.", "error");
      return;
    }

    const app = getApplicationByIdOrMobile(query);
    const resultContainer = document.getElementById("tracker-result-container");
    if (!resultContainer) return;

    const isMr = CURRENT_LANG === "mr";

    if (!app) {
      resultContainer.innerHTML = `
        <div style="text-align: center; padding: 2.5rem; background: #fff; border-radius: 12px; border: 1px solid #fee2e2;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.2rem; color: #ef4444; margin-bottom: 0.75rem;"></i>
          <h3 style="color: #991b1b;">${isMr ? 'नोंद सापडली नाही!' : 'No Application Found!'}</h3>
          <p style="color: #64748b; font-size: 0.9rem; margin-top: 0.25rem;">${isMr ? 'कृपया योग्य अर्ज क्रमांक (उदा. EMU-2026-1001) किंवा १० अंकी मोबाईल नंबर तपासा.' : 'Please check your Application ID or mobile number.'}</p>
        </div>
      `;
      resultContainer.style.display = "block";
      return;
    }

    // Determine Timeline Active Steps
    // Stages: 1=submitted, 2=verified, 3=processing, 4=completed
    const statusOrder = { submitted: 1, verified: 2, processing: 3, completed: 4, rejected: 2 };
    const curStage = statusOrder[app.status] || 1;

    resultContainer.innerHTML = `
      <div class="tracking-result-card">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <span style="font-size: 0.8rem; color: #64748b; font-weight: 600;">${isMr ? 'अर्ज क्रमांक' : 'Application ID'}:</span>
            <h3 style="color: var(--primary-navy); font-size: 1.35rem; font-family: var(--font-sans);">${app.id}</h3>
          </div>
          <div>
            <span class="status-badge-chip status-${app.status}" style="font-size: 0.9rem; padding: 6px 14px;">
              ${isMr ? app.status_mr : app.status_en}
            </span>
          </div>
        </div>

        <div class="timeline-container">
          <div class="timeline-step ${curStage >= 1 ? (curStage > 1 ? 'completed' : 'active') : ''}">
            <div class="step-circle"><i class="fa-solid ${curStage > 1 ? 'fa-check' : 'fa-file-lines'}"></i></div>
            <div class="step-label">${isMr ? '१. अर्ज प्राप्त' : '1. Submitted'}</div>
          </div>
          <div class="timeline-step ${curStage >= 2 ? (curStage > 2 ? 'completed' : 'active') : ''}">
            <div class="step-circle"><i class="fa-solid ${curStage > 2 ? 'fa-check' : 'fa-user-check'}"></i></div>
            <div class="step-label">${isMr ? '२. कागदपत्र पडताळणी' : '2. Verification'}</div>
          </div>
          <div class="timeline-step ${curStage >= 3 ? (curStage > 3 ? 'completed' : 'active') : ''}">
            <div class="step-circle"><i class="fa-solid ${curStage > 3 ? 'fa-check' : 'fa-gears'}"></i></div>
            <div class="step-label">${isMr ? '३. अधिकारी स्तरावर प्रक्रिया' : '3. Processing'}</div>
          </div>
          <div class="timeline-step ${curStage >= 4 ? 'completed' : ''}">
            <div class="step-circle"><i class="fa-solid fa-stamp"></i></div>
            <div class="step-label">${isMr ? '४. मंजूर / प्रमाणपत्र तयार' : '4. Approved'}</div>
          </div>
        </div>

        <div class="track-details-grid">
          <div class="detail-item">
            <div class="lbl">${isMr ? 'अर्जदाराचे नाव:' : 'Applicant Name:'}</div>
            <div class="val">${app.applicantName}</div>
          </div>
          <div class="detail-item">
            <div class="lbl">${isMr ? 'सेवा:' : 'Service:'}</div>
            <div class="val">${isMr ? app.serviceName_mr : app.serviceName_en}</div>
          </div>
          <div class="detail-item">
            <div class="lbl">${isMr ? 'अर्ज सादर तारीख:' : 'Applied Date:'}</div>
            <div class="val">${app.date}</div>
          </div>
          <div class="detail-item">
            <div class="lbl">${isMr ? 'मोबाईल नंबर:' : 'Mobile Number:'}</div>
            <div class="val" style="font-family: var(--font-sans);">${app.mobile}</div>
          </div>
          <div class="detail-item" style="grid-column: span 2;">
            <div class="lbl">${isMr ? 'अधिकारी शेरा / सद्यस्थिती टीप:' : 'Officer Remarks:'}</div>
            <div class="val" style="color: #1e40af;">${app.remarks || (isMr ? 'सदर अर्जाची तपासणी सुरू आहे.' : 'Application is currently under review.')}</div>
          </div>
          ${app.documents && Object.values(app.documents).some(d => d !== null) ? `
            <div class="detail-item" style="grid-column: span 2;">
              <div class="lbl">${isMr ? 'जोडलेले अधिकृत दस्तऐवज:' : 'Attached Documents:'}</div>
              <div class="val" style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
                ${Object.entries(app.documents).filter(([_, doc]) => doc && doc.url).map(([_, doc]) => `
                  <button type="button" class="btn-doc-chip" onclick="openDocumentViewer('${doc.url}', '${doc.name || 'दस्तऐवज'}', '${doc.format}')">
                    <i class="fa-solid ${doc.format === 'pdf' ? 'fa-file-pdf' : 'fa-file-image'}" style="color: ${doc.format === 'pdf' ? '#dc2626' : '#2563eb'};"></i>
                    <span>${doc.name || 'दस्तऐवज'}</span>
                    <i class="fa-solid fa-eye" style="font-size: 10px; margin-left: 2px;"></i>
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <div style="display: flex; gap: 1rem; justify-content: flex-end; flex-wrap: wrap;">
          <button class="btn-card-doc" onclick='showReceiptModal(${JSON.stringify(app)})'>
            <i class="fa-solid fa-print"></i> ${isMr ? 'पोच पावती पहा / प्रिंट करा' : 'Print Acknowledgment Slip'}
          </button>
          ${app.status === 'completed' ? `
            <button class="btn-card-apply" onclick="downloadMockCertificate('${app.id}', '${app.applicantName}', '${isMr ? app.serviceName_mr : app.serviceName_en}')">
              <i class="fa-solid fa-download"></i> ${isMr ? 'डिजिटल प्रमाणपत्र डाऊनलोड' : 'Download Certificate'}
            </button>
          ` : ''}
        </div>
      </div>
    `;
    resultContainer.style.display = "block";
  }

  searchBtn?.addEventListener("click", performSearch);
  input?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") performSearch();
  });
}

/**
 * Mock Certificate Download Trigger
 */
function downloadMockCertificate(appId, name, serviceName) {
  const isMr = CURRENT_LANG === "mr";
  const modal = document.getElementById("docs-info-modal");
  const titleElem = document.getElementById("docs-modal-title");
  const bodyElem = document.getElementById("docs-modal-body");

  if (titleElem) titleElem.textContent = isMr ? "डिजिटल स्वाक्षरीत प्रमाणपत्र" : "Digitally Signed Certificate";
  if (bodyElem) {
    bodyElem.innerHTML = `
      <div style="border: 4px double #0b2545; padding: 25px; background: #fffdfa; text-align: center; border-radius: 8px;">
        <div style="font-size: 28px; margin-bottom: 5px;">🏛️</div>
        <h3 style="color: #0b2545; font-size: 1.3rem; margin-bottom: 4px;">महाराष्ट्र शासन • महसूल विभाग</h3>
        <h4 style="color: #d85c00; font-size: 1.1rem; margin-bottom: 12px;">उपविभागीय अधिकारी कार्यालय</h4>
        <div style="background: #eef4f8; padding: 8px; font-weight: 700; color: #134074; margin-bottom: 15px; border-radius: 4px;">
          ${serviceName}
        </div>
        <p style="font-size: 0.95rem; line-height: 1.8; color: #333333; text-align: justify; margin-bottom: 20px;">
          प्रमाणित करण्यात येते की, <strong>${name}</strong> यांचा अर्ज क्रमांक <strong>${appId}</strong> अन्वये सादर केलेल्या सर्व पुराव्यांची तपासणी पूर्ण झाली असून, सक्षम प्राधिकाऱ्यांच्या आदेशानुसार हे डिजिटल प्रमाणपत्र अधिकृतपणे निर्गमित करण्यात येत आहे.
        </p>
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
          <div style="text-align: left; font-size: 0.8rem; color: #555;">
            <div>प्रमाणपत्र क्र.: MAHA/SDO/2026/89412</div>
            <div>दिनांक: ${new Date().toLocaleDateString('mr-IN')}</div>
            <div>Digitally Signed by SDO Officer</div>
          </div>
          <div style="text-align: center; color: #16a34a; font-weight: 700; font-size: 0.85rem;">
            <i class="fa-solid fa-circle-check" style="font-size: 1.5rem;"></i>
            <div>Valid Digital Signature</div>
          </div>
        </div>
      </div>
      <div style="margin-top: 15px; text-align: right;">
        <button class="btn-form-submit" onclick="window.print()">
          <i class="fa-solid fa-print"></i> ${isMr ? 'प्रमाणपत्र प्रिंट करा' : 'Print Certificate'}
        </button>
      </div>
    `;
  }
  modal?.classList.add("active");
}

/**
 * Token / Appointment Booking
 */
function initTokenBooking() {
  const form = document.getElementById("token-booking-form");
  const dateInput = document.getElementById("token-date");
  if (dateInput) {
    // Set minimum date as today
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("token-name").value.trim();
    const mobile = document.getElementById("token-mobile").value.trim();
    const serviceSelect = document.getElementById("token-service-select");
    const serviceName = serviceSelect.options[serviceSelect.selectedIndex]?.text || "नागरिक सेवा";
    const date = document.getElementById("token-date").value;
    const slot = document.getElementById("token-slot").value;

    const token = saveToken({
      name,
      mobile,
      service: serviceName,
      date,
      slot
    });

    // ☁️ Supabase मध्ये token save करा
    if (typeof DB !== "undefined" && DB.saveTokenBooking) {
      DB.saveTokenBooking({
        tokenId:     token.tokenNo,
        service:     serviceName,
        fullName:    name,
        mobile:      mobile,
        bookingDate: date,
        timeSlot:    slot,
        notes:       ""
      }).then(ok => {
        if (ok) console.log("✅ Supabase: Token saved");
      }).catch(err => console.warn("Supabase token save failed:", err));
    }

    const isMr = CURRENT_LANG === "mr";
    showToast(isMr ? `✅ टोकन यशस्वीरित्या बुक झाले! टोकन क्र.: ${token.tokenNo}` : `✅ Token booked! No: ${token.tokenNo}`, "success");
    form.reset();

    // Show Token Slip in Modal
    showTokenSlipModal(token);
  });
}

function showTokenSlipModal(token) {
  const isMr = CURRENT_LANG === "mr";
  const modal = document.getElementById("docs-info-modal");
  const titleElem = document.getElementById("docs-modal-title");
  const bodyElem = document.getElementById("docs-modal-body");

  if (titleElem) titleElem.textContent = isMr ? "केंद्राचे अधिकृत टोकन" : "Center Appointment Token";
  if (bodyElem) {
    bodyElem.innerHTML = `
      <div style="border: 2px dashed #0b2545; padding: 20px; border-radius: 10px; background: #fff8eb; text-align: center;">
        <div style="font-size: 0.85rem; color: #b45309; font-weight: 700;">${CENTER_INFO.centerName_mr}</div>
        <div style="font-size: 2.2rem; font-weight: 800; color: #0b2545; font-family: var(--font-sans); margin: 8px 0;">
          ${token.tokenNo}
        </div>
        <div style="font-size: 0.9rem; color: #16a34a; font-weight: 700; margin-bottom: 15px;">
          <i class="fa-solid fa-calendar-check"></i> ${token.date} | ${token.slot}
        </div>
        <div style="text-align: left; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 0.88rem; display: flex; flex-direction: column; gap: 4px;">
          <div><strong>नाव:</strong> ${token.name}</div>
          <div><strong>मोबाईल:</strong> ${token.mobile}</div>
          <div><strong>सेवा:</strong> ${token.service}</div>
          <div><strong>पत्ता:</strong> ${CENTER_INFO.address_mr}</div>
        </div>
        <div style="margin-top: 15px; font-size: 0.8rem; color: #64748b;">
          कृपया वेळेच्या १० मिनिटे अगोदर मूळ कागदपत्रांसह केंद्रावर उपस्थित राहावे.
        </div>
      </div>
      <div style="margin-top: 15px; display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn-form-submit" onclick="window.print()">
          <i class="fa-solid fa-print"></i> ${isMr ? 'टोकन प्रिंट करा' : 'Print Token'}
        </button>
      </div>
    `;
  }
  modal?.classList.add("active");
}

/**
 * VLE / Officer Admin Dashboard
 */
function initAdminDashboard() {
  const loginForm = document.getElementById("admin-login-form");
  const dashSection = document.getElementById("admin-dashboard-panel");
  const loginModal = document.getElementById("admin-login-modal");

  loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const pin = document.getElementById("admin-pin-input").value;
    if (pin === "1234" || pin === "admin") {
      closeModal("admin-login-modal");
      renderAdminDashboard();
      switchTab("tab-admin");
      showToast(CURRENT_LANG === "mr" ? "अधिकारी लॉगिन यशस्वी!" : "Officer Login Successful!", "success");
    } else {
      showToast(CURRENT_LANG === "mr" ? "चुकीचा सुरक्षा पिन. (Default: 1234)" : "Invalid Security PIN. (Default: 1234)", "error");
    }
  });

  document.getElementById("btn-export-csv")?.addEventListener("click", exportApplicationsToCsv);
}

function openAdminLogin() {
  const modal = document.getElementById("admin-login-modal");
  if (modal) {
    modal.style.display = "flex";
    modal.classList.add("active");
  }
}

window.openAdminLogin = openAdminLogin;

/**
 * Switch Admin Sub-Navigation Tabs
 */
function switchAdminSubTab(subTabId) {
  const buttons = document.querySelectorAll(".admin-subtab-btn");
  const contents = document.querySelectorAll(".admin-subtab-content");

  buttons.forEach(btn => btn.classList.remove("active"));
  contents.forEach(content => content.classList.remove("active"));

  const activeBtn = document.getElementById(`btn-subtab-${subTabId}`);
  const activeContent = document.getElementById(`admin-subtab-${subTabId}`);

  if (activeBtn) activeBtn.classList.add("active");
  if (activeContent) activeContent.classList.add("active");

  if (subTabId === "manage-services") {
    renderAdminServicesTable();
  } else if (subTabId === "apps") {
    renderAdminDashboard();
  } else if (subTabId === "manage-softwares") {
    renderAdminSoftwaresTable();
  } else if (subTabId === "manage-links") {
    renderAdminLinksTable();
  }
}

/**
 * Initialize Admin Service Manager Form & Live Fee Calculator
 */
function initAdminServiceManager() {
  // 1. Live Fee Calculator on inputs
  const feeInputs = document.querySelectorAll(".fee-calc-input");
  feeInputs.forEach(input => {
    input.addEventListener("input", updateAdminFeeDisplay);
  });

  function updateAdminFeeDisplay() {
    const govt = parseFloat(document.getElementById("fee-govt")?.value) || 0;
    const form = parseFloat(document.getElementById("fee-form")?.value) || 0;
    const scan = parseFloat(document.getElementById("fee-scan")?.value) || 0;
    const filing = parseFloat(document.getElementById("fee-filing")?.value) || 0;
    const lamination = parseFloat(document.getElementById("fee-lamination")?.value) || 0;

    const total = govt + form + scan + filing + lamination;
    const display = document.getElementById("fee-total-display");
    if (display) display.textContent = `₹${total.toFixed(2)}`;
    return { govt, form, scan, filing, lamination, total };
  }

  // 2. Submit New Service Form
  const form = document.getElementById("admin-new-service-form");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const editId = document.getElementById("service-edit-id")?.value;
    const category = document.getElementById("new-service-category")?.value;
    const icon = document.getElementById("new-service-icon")?.value;
    const title_mr = document.getElementById("new-service-title-mr")?.value.trim();
    const title_en = document.getElementById("new-service-title-en")?.value.trim();
    const desc_mr = document.getElementById("new-service-desc-mr")?.value.trim();
    const timeline_mr = document.getElementById("new-service-timeline")?.value.trim();
    const authority_mr = document.getElementById("new-service-authority")?.value.trim();
    const appeal_mr = document.getElementById("new-service-appeal")?.value.trim();
    const popular = document.getElementById("new-service-popular")?.checked || false;
    const docsRaw = document.getElementById("new-service-docs")?.value.trim();

    if (!title_mr || !title_en || !desc_mr || !timeline_mr) {
      showToast("कृपया सर्व आवश्यक माहिती भरा.", "error");
      return;
    }

    const fees = updateAdminFeeDisplay();

    // Parse Documents Text into Structured Objects
    const lines = docsRaw.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    let currentGroup = "आवश्यक कागदपत्रे";
    const documents = [];

    lines.forEach(line => {
      // If header / group line (e.g. "१) ओळखीचा पुरावा:" or starts with number or colon)
      if (line.endsWith(":") || /^[०-९0-9]+[\).\-]/.test(line)) {
        currentGroup = line.replace(/[:]/g, "").trim();
      } else {
        const cleanName = line.replace(/^[•\-\*\>]\s*/, "").trim();
        const isReq = cleanName.includes("(अनिवार्य)") || cleanName.includes("(Required)") || !cleanName.includes("पर्यायी");
        documents.push({
          group: currentGroup,
          name_mr: cleanName.replace(/\(अनिवार्य\)|\(पर्यायी\)/g, "").trim(),
          name_en: cleanName.replace(/\(अनिवार्य\)|\(पर्यायी\)/g, "").trim(),
          required: isReq
        });
      }
    });

    const newService = {
      id: editId || `service-${Date.now()}`,
      category,
      icon,
      title_mr,
      title_en,
      desc_mr,
      desc_en: desc_mr,
      timeline_mr,
      timeline_en: timeline_mr,
      govt_fee: fees.govt,
      csc_fee: fees.total - fees.govt,
      total_fee: fees.total,
      popular,
      isCustom: true,
      authority_mr: authority_mr || "तहसीलदार / नायब तहसीलदार",
      appeal_mr: appeal_mr || "उपविभागीय अधिकारी (SDO)",
      fee_breakdown: {
        govt_fee: fees.govt,
        form_fee: fees.form,
        scanning_fee: fees.scan,
        filing_fee: fees.filing,
        lamination_fee: fees.lamination,
        total: fees.total
      },
      documents: documents.length > 0 ? documents : [
        { group: "ओळखीचा पुरावा", name_mr: "आधार कार्ड", name_en: "Aadhaar Card", required: true },
        { group: "पत्त्याचा पुरावा", name_mr: "रेशन कार्ड / वीज बिल", name_en: "Ration Card / Bill", required: true }
      ]
    };

    const saved = saveCustomService(newService);
    if (saved) {
      refreshAllPortalServices();
      resetNewServiceForm();
      switchAdminSubTab("manage-services");
      showToast(CURRENT_LANG === "mr" ? `🎉 नवीन सेवा "${title_mr}" संपूर्ण पोर्टलवर समाविष्ट झाली!` : `🎉 Service "${title_en}" saved across portal!`, "success");
    } else {
      showToast("सेवा जतन करण्यात त्रुटी आली.", "error");
    }
  });
}

function resetNewServiceForm() {
  const form = document.getElementById("admin-new-service-form");
  if (form) form.reset();
  const editId = document.getElementById("service-edit-id");
  if (editId) editId.value = "";
  const saveLabel = document.getElementById("btn-save-service-label");
  if (saveLabel) saveLabel.textContent = "नवीन सेवा संपूर्ण पोर्टलवर सेव्ह करा";
  const display = document.getElementById("fee-total-display");
  if (display) display.textContent = "₹200.00";
}

/**
 * Render Manage Services Table in Admin Panel
 */
function renderAdminServicesTable() {
  const tbody = document.getElementById("admin-services-tbody");
  const badge = document.getElementById("admin-services-badge");
  if (badge) badge.textContent = SERVICES_DATA.length;
  if (!tbody) return;

  const isMr = CURRENT_LANG === "mr";
  const catNames = {
    revenue: isMr ? "महसूल दाखले" : "Revenue",
    emudra: isMr ? "ई-मुद्रा DSC" : "eMudra DSC",
    schemes: isMr ? "शासकीय योजना" : "Schemes",
    citizen: isMr ? "नागरिक सेवा" : "Citizen"
  };

  tbody.innerHTML = SERVICES_DATA.map((s, idx) => {
    const isCustom = s.isCustom || s.id.startsWith("service-") || s.id.startsWith("custom-");
    return `
      <tr>
        <td style="font-weight: 700; font-family: var(--font-sans);">${idx + 1}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="${s.icon}" style="color: var(--saffron-orange); font-size: 1.1rem;"></i>
            <div>
              <strong>${isMr ? s.title_mr : s.title_en}</strong>
              <div style="font-size: 11px; color: #64748b;">${s.id}</div>
            </div>
          </div>
        </td>
        <td><span class="category-tag-chip cat-${s.category}">${catNames[s.category] || s.category}</span></td>
        <td><i class="fa-regular fa-clock"></i> ${isMr ? s.timeline_mr : s.timeline_en}</td>
        <td style="font-weight: 700; font-family: var(--font-sans); color: #15803d;">₹${s.total_fee.toFixed(2)}</td>
        <td>
          <span class="service-type-badge ${isCustom ? 'custom' : 'default'}">
            ${isCustom ? (isMr ? 'सानुकूल (Custom)' : 'Custom') : (isMr ? 'मानक (Built-in)' : 'Default')}
          </span>
        </td>
        <td style="text-align: center;">
          <div style="display: inline-flex; gap: 4px;">
            <button class="admin-action-btn" onclick="editService('${s.id}')" title="संपादित करा">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="admin-action-btn delete-btn" onclick="handleDeleteService('${s.id}')" title="हटवा" style="color: #dc2626;">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

/**
 * Edit an Existing Service
 */
function editService(serviceId) {
  const service = SERVICES_DATA.find(s => s.id === serviceId);
  if (!service) return;

  switchAdminSubTab("add-service");

  document.getElementById("service-edit-id").value = service.id;
  document.getElementById("new-service-category").value = service.category || "revenue";
  document.getElementById("new-service-icon").value = service.icon || "fa-solid fa-file-invoice-dollar";
  document.getElementById("new-service-title-mr").value = service.title_mr || "";
  document.getElementById("new-service-title-en").value = service.title_en || "";
  document.getElementById("new-service-desc-mr").value = service.desc_mr || "";
  document.getElementById("new-service-timeline").value = service.timeline_mr || "७ ते १५ दिवस";
  document.getElementById("new-service-authority").value = service.authority_mr || "तहसीलदार / नायब तहसीलदार";
  document.getElementById("new-service-appeal").value = service.appeal_mr || "उपविभागीय अधिकारी (SDO)";
  document.getElementById("new-service-popular").checked = !!service.popular;

  if (service.fee_breakdown) {
    document.getElementById("fee-govt").value = service.fee_breakdown.govt_fee || 69;
    document.getElementById("fee-form").value = service.fee_breakdown.form_fee || 30;
    document.getElementById("fee-scan").value = service.fee_breakdown.scanning_fee || 30;
    document.getElementById("fee-filing").value = service.fee_breakdown.filing_fee || 41;
    document.getElementById("fee-lamination").value = service.fee_breakdown.lamination_fee || 30;
    document.getElementById("fee-total-display").textContent = `₹${service.fee_breakdown.total.toFixed(2)}`;
  }

  // Format documents into text lines
  if (service.documents && service.documents.length > 0) {
    let docText = "";
    let currentGroup = "";
    service.documents.forEach(d => {
      if (d.group && d.group !== currentGroup) {
        currentGroup = d.group;
        docText += `\n${currentGroup}:\n`;
      }
      docText += `• ${d.name_mr}${d.required ? ' (अनिवार्य)' : ' (पर्यायी)'}\n`;
    });
    document.getElementById("new-service-docs").value = docText.trim();
  }

  const saveLabel = document.getElementById("btn-save-service-label");
  if (saveLabel) saveLabel.textContent = "बदल सेव्ह करा (Update Service)";

  showToast(`"${service.title_mr}" संपादनासाठी उघडली आहे.`, "info");
}

function handleDeleteService(serviceId) {
  const service = SERVICES_DATA.find(s => s.id === serviceId);
  const name = service ? service.title_mr : serviceId;
  const isMr = CURRENT_LANG === "mr";

  if (confirm(isMr ? `तुम्हाला "${name}" ही सेवा पोर्टलवरून काढून टाकायची आहे का?` : `Are you sure you want to remove "${name}"?`)) {
    deleteServiceById(serviceId);
    refreshAllPortalServices();
    showToast(isMr ? `"${name}" सेवा यशस्वीरित्या काढण्यात आली.` : `Service removed successfully.`, "success");
  }
}

function handleResetAllServices() {
  const isMr = CURRENT_LANG === "mr";
  if (confirm(isMr ? "सर्व सानुकूल सेवा काढून मूळ २६ सेवा पूर्ववत करायच्या आहेत का?" : "Reset all services to default built-in list?")) {
    resetServicesToDefault();
    refreshAllPortalServices();
    showToast(isMr ? "सर्व सेवा मूळ स्थितीत रिसेट झाल्या!" : "Services reset to defaults!", "success");
  }
}

/**
 * Render Citizen Charter SLA Table dynamically from SERVICES_DATA
 */
function renderCitizenCharterTable(searchQuery = "") {
  const tbody = document.getElementById("charter-table-tbody");
  if (!tbody) return;

  const isMr = CURRENT_LANG === "mr";
  const catNames = {
    revenue: isMr ? "महसूल व दाखले" : "Revenue",
    emudra: isMr ? "ई-मुद्रा DSC" : "eMudra DSC",
    schemes: isMr ? "शेतकरी योजना" : "Schemes",
    citizen: isMr ? "नागरिक सेवा" : "Citizen"
  };

  const filtered = SERVICES_DATA.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const title = (isMr ? s.title_mr : s.title_en).toLowerCase();
    const auth = (s.authority_mr || "").toLowerCase();
    return title.includes(q) || auth.includes(q);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 2rem;">कोणतीही सेवा सापडली नाही.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((s, idx) => {
    return `
      <tr>
        <td style="font-weight: 700; font-family: var(--font-sans);">${idx + 1}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="${s.icon}" style="color: var(--saffron-orange);"></i>
            <strong>${isMr ? s.title_mr : s.title_en}</strong>
          </div>
        </td>
        <td><span class="category-tag-chip cat-${s.category}">${catNames[s.category] || s.category}</span></td>
        <td><i class="fa-regular fa-clock" style="color: #0284c7;"></i> <strong>${isMr ? s.timeline_mr : s.timeline_en}</strong></td>
        <td>${s.authority_mr || (s.category === 'revenue' ? 'तहसीलदार / नायब तहसीलदार' : 'केंद्राचे अधिकृत संचालक')}</td>
        <td>${s.appeal_mr || (s.category === 'revenue' ? 'उपविभागीय अधिकारी (SDO)' : 'जिल्हा व्यवस्थापक / प्राधिकारी')}</td>
        <td style="text-align: right; font-weight: 700; font-family: var(--font-sans); color: #15803d;">₹${s.total_fee.toFixed(2)}</td>
      </tr>
    `;
  }).join("");
}

function initCharterSearch() {
  const input = document.getElementById("charter-search-input");
  input?.addEventListener("input", (e) => {
    renderCitizenCharterTable(e.target.value.trim());
  });
}

/**
 * Universal Refresh Engine: Re-renders all modules across the entire portal
 */
function refreshAllPortalServices() {
  reloadServicesData();
  renderServicesCatalog();
  populateServiceDropdowns();
  
  const docSelect = document.getElementById("docs-service-select");
  if (docSelect && SERVICES_DATA.length > 0) {
    updateDocsCalculator(docSelect.value || SERVICES_DATA[0].id);
  }
  
  renderAdminDashboard();
  renderAdminServicesTable();
  renderCitizenCharterTable();

  const appsBadge = document.getElementById("admin-apps-badge");
  if (appsBadge) appsBadge.textContent = getAllApplications().length;
}

function renderAdminDashboard() {
  const isMr = CURRENT_LANG === "mr";
  const tbody = document.getElementById("admin-apps-tbody");

  // Show loading state
  if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> ${isMr ? 'डेटा लोड होत आहे...' : 'Loading from Supabase...'}</td></tr>`;

  // Try Supabase first, fallback to localStorage
  const loadAndRender = async (apps) => {
    const total      = apps.length;
    const pending    = apps.filter(a => a.status === "pending" || a.status === "submitted" || a.status === "verified").length;
    const processing = apps.filter(a => a.status === "processing").length;
    const completed  = apps.filter(a => a.status === "completed").length;

    const totalElem = document.getElementById("stat-total-apps");
    const pendElem  = document.getElementById("stat-pending-apps");
    const procElem  = document.getElementById("stat-proc-apps");
    const compElem  = document.getElementById("stat-comp-apps");
    const appsBadge = document.getElementById("admin-apps-badge");
    const srvBadge  = document.getElementById("admin-services-badge");

    if (totalElem) totalElem.textContent = total;
    if (pendElem)  pendElem.textContent  = pending;
    if (procElem)  procElem.textContent  = processing;
    if (compElem)  compElem.textContent  = completed;
    if (appsBadge) appsBadge.textContent = total;
    if (srvBadge)  srvBadge.textContent  = SERVICES_DATA.length;

    if (!tbody) return;

    if (apps.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#94a3b8;"><i class="fa-solid fa-folder-open"></i><br>${isMr ? 'कोणतेही अर्ज आढळले नाहीत.' : 'No applications found.'}</td></tr>`;
      return;
    }

    tbody.innerHTML = apps.map(app => {
      // Support both Supabase format (fullName) and localStorage format (applicantName)
      const name      = app.fullName      || app.applicantName || "-";
      const svcName   = app.serviceName   || (isMr ? app.serviceName_mr : app.serviceName_en) || "-";
      const date      = app.submittedAt   ? new Date(app.submittedAt).toLocaleDateString("mr-IN") : (app.date || "-");
      const mob       = app.mobile        || "-";
      const appId     = app.appId         || app.id || "-";
      const status    = app.status        || "pending";
      const statusLabel = { pending:"प्रलंबित", submitted:"सादर केला", verified:"पडताळणी", processing:"प्रक्रिया", completed:"पूर्ण", rejected:"नाकारलेला" };

      return `
        <tr>
          <td style="font-weight:700;font-family:var(--font-sans);color:var(--primary-navy);">${appId}</td>
          <td><strong>${name}</strong></td>
          <td>${svcName}</td>
          <td style="font-family:var(--font-sans);">${date}</td>
          <td style="font-family:var(--font-sans);">${mob}</td>
          <td><span class="status-badge-chip status-${status}">${isMr ? (statusLabel[status] || status) : status}</span></td>
          <td>
            <button class="admin-action-btn" onclick="updateAppStatusFromAdmin('${appId}')" title="${isMr ? 'स्थिती बदला' : 'Update Status'}">
              <i class="fa-solid fa-pen-to-square"></i> ${isMr ? 'स्थिती' : 'Status'}
            </button>
          </td>
        </tr>
      `;
    }).join("");
  };

  if (typeof DB !== "undefined" && DB.loadApplications) {
    DB.loadApplications().then(apps => {
      loadAndRender(apps);
    }).catch(err => {
      console.warn("Supabase load failed, using localStorage:", err);
      loadAndRender(getAllApplications());
    });
  } else {
    loadAndRender(getAllApplications());
  }
}

function updateAppStatusFromAdmin(appId) {
  const isMr = CURRENT_LANG === "mr";
  const statuses = ["pending", "verified", "processing", "completed", "rejected"];
  const labels   = isMr
    ? ["प्रलंबित", "पडताळणी पूर्ण", "प्रक्रिया सुरू", "मंजूर / पूर्ण", "नाकारलेला"]
    : ["Pending", "Verified", "Processing", "Completed", "Rejected"];

  const choice = prompt(
    (isMr ? `अर्ज ${appId} ची नवीन स्थिती निवडा:\n` : `Select new status for ${appId}:\n`) +
    statuses.map((s, i) => `${i + 1}. ${labels[i]}`).join("\n")
  );
  if (!choice) return;
  const idx = parseInt(choice) - 1;
  if (idx < 0 || idx >= statuses.length) return;

  const newStatus = statuses[idx];

  // Update in Supabase
  if (typeof DB !== "undefined" && DB.updateApplicationStatus) {
    DB.updateApplicationStatus(appId, newStatus).then(() => {
      showToast(isMr ? `✅ स्थिती "${labels[idx]}" मध्ये बदलली!` : `✅ Status updated to "${labels[idx]}"`, "success");
      renderAdminDashboard();
    });
  } else {
    // localStorage fallback
    updateApplicationStatus(appId, newStatus);
    showToast(isMr ? `✅ स्थिती "${labels[idx]}" मध्ये बदलली!` : `✅ Status updated`, "success");
    renderAdminDashboard();
  }
}

function openStatusUpdateModal(appId) {
  const app = getAllApplications().find(a => a.id === appId);
  if (!app) return;

  const isMr = CURRENT_LANG === "mr";
  const modal = document.getElementById("docs-info-modal");
  const titleElem = document.getElementById("docs-modal-title");
  const bodyElem = document.getElementById("docs-modal-body");

  if (titleElem) titleElem.textContent = isMr ? `अर्जाची स्थिती बदला - ${app.id}` : `Update Status - ${app.id}`;
  if (bodyElem) {
    bodyElem.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div>
          <strong>अर्जदार:</strong> ${app.applicantName} | <strong>सेवा:</strong> ${isMr ? app.serviceName_mr : app.serviceName_en}
        </div>
        ${app.documents && Object.values(app.documents).some(d => d !== null) ? `
          <div style="background: #f0fdf4; padding: 8px 12px; border-radius: 6px; border: 1px solid #bbf7d0;">
            <strong style="font-size: 12px; color: #166534;"><i class="fa-solid fa-cloud-arrow-up"></i> अपलोड केलेले दस्तऐवज (तपासा):</strong>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 5px;">
              ${Object.entries(app.documents).filter(([_, doc]) => doc && doc.url).map(([_, doc]) => `
                <button type="button" class="admin-doc-btn" onclick="openDocumentViewer('${doc.url}', '${doc.name || 'दस्तऐवज'}', '${doc.format}')">
                  <i class="fa-solid ${doc.format === 'pdf' ? 'fa-file-pdf' : 'fa-file-image'}"></i> ${doc.name} 👁️
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
        <div class="form-group">
          <label>नवीन स्थिती निवडा *</label>
          <select id="update-status-select" class="form-control">
            <option value="submitted" ${app.status === 'submitted' ? 'selected' : ''}>अर्ज प्राप्त झाला (Submitted)</option>
            <option value="verified" ${app.status === 'verified' ? 'selected' : ''}>कागदपत्रे पडताळणी पूर्ण (Documents Verified)</option>
            <option value="processing" ${app.status === 'processing' ? 'selected' : ''}>अधिकारी स्तरावर प्रक्रिया सुरू (In Processing)</option>
            <option value="completed" ${app.status === 'completed' ? 'selected' : ''}>मंजूर व प्रमाणपत्र तयार (Approved & Ready)</option>
            <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>त्रुटी / अर्ज नामंजूर (Rejected / Defective)</option>
          </select>
        </div>
        <div class="form-group">
          <label>अधिकारी टीप / शेरा (Remarks)</label>
          <textarea id="update-remarks-input" class="form-control" rows="3">${app.remarks || ''}</textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
          <button class="btn-form-reset" onclick="closeModal('docs-info-modal')">रद्द करा</button>
          <button class="btn-form-submit" onclick="saveStatusUpdate('${app.id}')">
            <i class="fa-solid fa-save"></i> स्थिती अपडेट करा
          </button>
        </div>
      </div>
    `;
  }
  modal?.classList.add("active");
}

function saveStatusUpdate(appId) {
  const newStatus = document.getElementById("update-status-select")?.value;
  const remarks = document.getElementById("update-remarks-input")?.value.trim();

  updateApplicationStatus(appId, newStatus, remarks);
  closeModal("docs-info-modal");
  renderAdminDashboard();
  showToast(CURRENT_LANG === "mr" ? `अर्ज क्र. ${appId} ची स्थिती यशस्वीरित्या अपडेट केली!` : `Application ${appId} status updated!`, "success");
}

function exportApplicationsToCsv() {
  const apps = getAllApplications();
  if (apps.length === 0) {
    showToast("कोणतीही माहिती उपलब्ध नाही.", "error");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "App ID,Applicant Name,Service,Mobile,Aadhaar,Date,Status,Fee,Taluka\n";

  apps.forEach(a => {
    const row = [
      a.id,
      `"${a.applicantName}"`,
      `"${a.serviceName_mr}"`,
      a.mobile,
      a.aadhaar || "",
      a.date,
      a.status,
      a.totalFee,
      `"${a.taluka}"`
    ].join(",");
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `emudra_csc_applications_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Direct WhatsApp Link Launcher with prefilled query
 */
function initWhatsAppDirect() {
  const defaultMsgMr = "नमस्कार, मला ई-मुद्रा सीएससी केंद्रावरील शासकीय सेवांबद्दल / अर्जाबद्दल अधिक माहिती हवी आहे.";
  const encoded = encodeURIComponent(defaultMsgMr);
  const waUrl = `https://wa.me/${CENTER_INFO.whatsapp}?text=${encoded}`;

  document.querySelectorAll(".btn-whatsapp-direct, .floating-whatsapp").forEach(btn => {
    btn.setAttribute("href", waUrl);
    btn.setAttribute("target", "_blank");
  });
}

/**
 * Toast Notification System
 */
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container") || createToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const icon = type === "success" ? "fa-circle-check" : type === "error" ? "fa-circle-exclamation" : "fa-circle-info";
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function createToastContainer() {
  const c = document.createElement("div");
  c.id = "toast-container";
  c.className = "toast-container";
  document.body.appendChild(c);
  return c;
}

/**
 * Useful Official & Government Links Modal Engine
 */
let isUsefulLinksSearchInit = false;

function openUsefulLinksModal() {
  const modal = document.getElementById("useful-links-modal");
  if (modal) {
    modal.style.display = "flex";
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
  try {
    renderUsefulLinksGrid();
    initUsefulLinksSearch();
  } catch (err) {
    console.error("Error opening useful links modal:", err);
  }
}

function renderUsefulLinksGrid(searchQuery = "") {
  const container = document.getElementById("useful-links-container");
  if (!container) return;

  const isMr = typeof CURRENT_LANG !== "undefined" && CURRENT_LANG === "mr";
  const q = (searchQuery && typeof searchQuery === "string") ? searchQuery.toLowerCase().trim() : "";

  let linksArr = [];
  if (typeof IMPORTANT_LINKS !== "undefined" && Array.isArray(IMPORTANT_LINKS) && IMPORTANT_LINKS.length > 0) {
    linksArr = IMPORTANT_LINKS;
  } else if (typeof DEFAULT_IMPORTANT_LINKS !== "undefined" && Array.isArray(DEFAULT_IMPORTANT_LINKS)) {
    linksArr = DEFAULT_IMPORTANT_LINKS;
  }

  const filtered = linksArr.filter(item => {
    if (!item) return false;
    if (!q) return true;
    const title = (isMr ? (item.title_mr || item.title_en) : (item.title_en || item.title_mr)) || "";
    const desc = (isMr ? (item.desc_mr || item.desc_en) : (item.desc_en || item.desc_mr)) || "";
    const cat = (item.category || "").toLowerCase();
    return title.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || cat.includes(q);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2.5rem; color: #94a3b8;">
        <i class="fa-solid fa-link-slash" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
        <div>${isMr ? 'कोणतीही लिंक सापडली नाही.' : 'No links found.'}</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const title = (isMr ? item.title_mr : item.title_en) || item.title_mr || "शासकीय लिंक";
    const desc = (isMr ? item.desc_mr : item.desc_en) || "";
    const url = item.url || "#";
    const icon = item.icon || "fa-solid fa-link";
    const category = item.category || "शासकीय सेवा";
    const actionLabel = item.isInternal 
      ? (isMr ? 'नवीन टॅबमध्ये उघडा' : 'Open in New Tab')
      : (isMr ? 'अधिकृत पोर्टल उघडा' : 'Open Portal');
      
    return `
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="useful-link-card" title="${title}">
        <div>
          <div class="useful-link-card-top">
            <div class="useful-link-icon-box">
              <i class="${icon}"></i>
            </div>
            <div>
              <div class="useful-link-cat">${category}</div>
              <h4 class="useful-link-title">${title}</h4>
            </div>
          </div>
          <p class="useful-link-desc">${desc}</p>
        </div>
        <div class="useful-link-action">
          <span>${actionLabel}</span>
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </div>
      </a>
    `;
  }).join("");
}

function initUsefulLinksSearch() {
  if (isUsefulLinksSearchInit) return;
  const searchInput = document.getElementById("useful-links-search");
  searchInput?.addEventListener("input", (e) => {
    renderUsefulLinksGrid(e.target.value.trim());
  });
  isUsefulLinksSearchInit = true;
}

// Global scope exports for inline onclick triggers
window.openUsefulLinksModal = openUsefulLinksModal;
window.openSoftwareModal = openSoftwareModal;
window.openWelcomeModal = openWelcomeModal;
window.closeWelcomeModal = closeWelcomeModal;
window.openAdminLogin = openAdminLogin;
window.closeModal = closeModal;
window.switchTab = switchTab;
window.switchAdminSubTab = switchAdminSubTab;

/**
 * Useful Softwares & Drivers Modal Controller
 */
let currentSoftwareCategory = "all";

function openSoftwareModal() {
  const modal = document.getElementById("software-modal");
  if (modal) {
    modal.style.display = "flex";
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
  try {
    currentSoftwareCategory = "all";
    renderSoftwareGrid();
    initSoftwareModalFilters();
  } catch (err) {
    console.error("Error opening software modal:", err);
  }
}

function initSoftwareModalFilters() {
  const searchInput = document.getElementById("software-search-input");
  searchInput?.addEventListener("input", (e) => {
    renderSoftwareGrid(e.target.value.trim(), currentSoftwareCategory);
  });

  const catBtns = document.querySelectorAll("#software-cat-filter .soft-cat-btn");
  catBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      catBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentSoftwareCategory = btn.getAttribute("data-cat");
      renderSoftwareGrid(searchInput?.value.trim() || "", currentSoftwareCategory);
    });
  });
}

function renderSoftwareGrid(searchQuery = "", category = "all") {
  const container = document.getElementById("software-grid-container");
  if (!container) return;

  const isMr = typeof CURRENT_LANG !== "undefined" && CURRENT_LANG === "mr";
  const q = (searchQuery && typeof searchQuery === "string") ? searchQuery.toLowerCase().trim() : "";

  let softArr = [];
  if (typeof SOFTWARES_DATA !== "undefined" && Array.isArray(SOFTWARES_DATA) && SOFTWARES_DATA.length > 0) {
    softArr = SOFTWARES_DATA;
  } else if (typeof DEFAULT_SOFTWARES_DATA !== "undefined" && Array.isArray(DEFAULT_SOFTWARES_DATA)) {
    softArr = DEFAULT_SOFTWARES_DATA;
  }

  const filtered = softArr.filter(item => {
    if (!item) return false;
    const matchCat = (category === "all" || item.category === category);
    if (!matchCat) return false;
    if (!q) return true;
    const name = (isMr ? (item.name_mr || item.name_en) : (item.name_en || item.name_mr)) || "";
    const desc = (isMr ? (item.desc_mr || item.desc_en) : (item.desc_en || item.desc_mr)) || "";
    const cat = (item.category_mr || "").toLowerCase();
    return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || cat.includes(q);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2.5rem; color: #94a3b8;">
        <i class="fa-solid fa-box-open" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
        <div>${isMr ? 'कोणतेही सॉफ्टवेअर आढळले नाही.' : 'No software found.'}</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const name = isMr ? item.name_mr : item.name_en;
    const desc = isMr ? item.desc_mr : item.desc_en;
    const catLabel = isMr ? (item.category_mr || item.category) : (item.category_en || item.category);

    // Determine clean filename with extension for download (.exe/.zip/.rar/.msi/.pdf)
    let downloadFileName = item.fileName || item.originalFilename;
    if (!downloadFileName) {
      const ext = item.format || (item.downloadUrl.split('.').pop().split(/[?#]/)[0]) || "exe";
      const cleanBase = (item.name_en || item.name_mr || "setup").replace(/[^a-zA-Z0-9_-]/g, "_");
      downloadFileName = `${cleanBase}.${ext}`;
    }

    let finalDownloadUrl = item.downloadUrl;
    if (finalDownloadUrl && finalDownloadUrl.includes("cloudinary.com") && finalDownloadUrl.includes("/upload/")) {
      if (!finalDownloadUrl.includes("fl_attachment")) {
        const safeName = downloadFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        finalDownloadUrl = finalDownloadUrl.replace("/upload/", `/upload/fl_attachment:${encodeURIComponent(safeName)}/`);
      }
    }

    return `
      <div class="software-card">
        <div>
          <div class="software-card-top">
            <div class="software-icon-box">
              <i class="${item.icon || 'fa-solid fa-box-archive'}"></i>
            </div>
            <div>
              <h4 class="software-name">${name}</h4>
              <div class="software-meta-pills">
                <span class="soft-badge-pill cat">${catLabel}</span>
                <span class="soft-badge-pill">${item.version || 'v1.0'}</span>
                <span class="soft-badge-pill os">${item.os || 'Windows'}</span>
              </div>
            </div>
          </div>
          <p class="software-desc">${desc}</p>
        </div>
        <div class="software-card-footer">
          <span style="font-size: 0.76rem; color: #64748b; font-weight: 600;">
            <i class="fa-solid fa-file-code"></i> ${item.size || 'सेटअप'}
          </span>
          <a href="${finalDownloadUrl}" download="${downloadFileName}" onclick="triggerSoftwareDirectDownload(event, '${encodeURIComponent(finalDownloadUrl)}', '${encodeURIComponent(downloadFileName)}')" target="_blank" rel="noopener" class="btn-soft-download" title="${name} डाउनलोड करा">
            <i class="fa-solid fa-download"></i> <span>${isMr ? 'सेटअप डाऊनलोड' : 'Download Setup'}</span>
          </a>
        </div>
      </div>
    `;
  }).join("");
}

/**
 * Triggers clean direct download preserving the exact software file name and extension (.exe / .zip / .rar / etc.)
 */
function triggerSoftwareDirectDownload(e, encodedUrl, encodedFileName) {
  const url = decodeURIComponent(encodedUrl);
  const fileName = decodeURIComponent(encodedFileName);

  let downloadUrl = url;
  if (downloadUrl && downloadUrl.includes("cloudinary.com") && downloadUrl.includes("/upload/")) {
    if (!downloadUrl.includes("fl_attachment")) {
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      downloadUrl = downloadUrl.replace("/upload/", `/upload/fl_attachment:${encodeURIComponent(safeName)}/`);
    }
  }

  // If local DataURL or external link
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.setAttribute("download", fileName);
  link.setAttribute("target", "_blank");
  link.setAttribute("rel", "noopener");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (e) {
    e.preventDefault();
  }
}

/**
 * Admin Software Manager Functions
 */
function toggleAdminSoftwareForm(show) {
  const container = document.getElementById("admin-software-form-container");
  const form = document.getElementById("admin-software-form");
  if (!container) return;

  if (typeof show === "boolean") {
    container.style.display = show ? "block" : "none";
  } else {
    container.style.display = container.style.display === "none" ? "block" : "none";
  }

  if (container.style.display === "block") {
    container.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else {
    form?.reset();
    const editIdInput = document.getElementById("soft-edit-id");
    if (editIdInput) editIdInput.value = "";
    const heading = document.getElementById("soft-form-heading");
    if (heading) heading.textContent = "➕ नवीन सॉफ्टवेअर / ड्रायव्हर सेटअप जोडा";
  }
}

function initAdminSoftwareManager() {
  const form = document.getElementById("admin-software-form");
  const fileInput = document.getElementById("soft-file-upload");
  const uploadStatus = document.getElementById("soft-upload-status");

  let currentUploadedFileName = "";
  let currentUploadedFormat = "";

  // File Upload listener to auto-upload directly to Cloudinary Secure Cloud Storage
  fileInput?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    currentUploadedFileName = file.name;
    currentUploadedFormat = (file.name || "").split('.').pop().toLowerCase();

    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    
    const nameInputMr = document.getElementById("soft-name-mr");
    const nameInputEn = document.getElementById("soft-name-en");
    const versionInput = document.getElementById("soft-version");
    const urlInput = document.getElementById("soft-download-url");
    const progressContainer = document.getElementById("soft-upload-progress-container");
    const progressBar = document.getElementById("soft-upload-progress-bar");

    if (nameInputMr && !nameInputMr.value) nameInputMr.value = cleanName;
    if (nameInputEn && !nameInputEn.value) nameInputEn.value = cleanName;
    if (versionInput && !versionInput.value) versionInput.value = `v1.0 • ${sizeMB} MB`;

    if (progressContainer) progressContainer.style.display = "block";
    if (progressBar) progressBar.style.width = "0%";
    if (uploadStatus) {
      uploadStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Cloudinary क्लाउडवर अपलोड सुरू आहे... (०%)`;
    }

    try {
      const res = await uploadSoftwareToCloudinary(file, (percent) => {
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (uploadStatus) {
          uploadStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Cloudinary अपलोड: ${percent}% (${sizeMB} MB)`;
        }
      });

      if (progressBar) progressBar.style.width = "100%";
      if (urlInput) urlInput.value = res.url;

      if (res.isCloud) {
        if (uploadStatus) {
          uploadStatus.innerHTML = `<i class="fa-solid fa-cloud-arrow-up" style="color: #10b981;"></i> Cloudinary वर सुरक्षित अपलोड झाले! (${sizeMB} MB)`;
        }
        showToast(`🎉 "${file.name}" Cloudinary सुरक्षित क्लाउड स्टोरेजवर अपलोड झाले!`, "success");
      } else {
        if (uploadStatus) {
          uploadStatus.innerHTML = `<i class="fa-solid fa-check" style="color: #10b981;"></i> फाइल यशस्वी जोडली (${sizeMB} MB)`;
        }
        showToast(`फाइल "${file.name}" यशस्वीरित्या तयार झाली.`, "info");
      }
    } catch (err) {
      console.error("Upload error:", err);
      if (uploadStatus) {
        uploadStatus.innerHTML = `<span style="color: #ef4444;">अपलोड त्रुटी</span>`;
      }
      showToast("फाइल अपलोड करताना त्रुटी आली.", "error");
    }
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const editId = document.getElementById("soft-edit-id")?.value;
    const name_mr = document.getElementById("soft-name-mr")?.value.trim();
    const name_en = document.getElementById("soft-name-en")?.value.trim();
    const category = document.getElementById("soft-category")?.value;
    const version = document.getElementById("soft-version")?.value.trim();
    const os = document.getElementById("soft-os")?.value.trim();
    const icon = document.getElementById("soft-icon")?.value;
    let downloadUrl = document.getElementById("soft-download-url")?.value.trim();
    const desc_mr = document.getElementById("soft-desc-mr")?.value.trim();

    if (!name_mr || !name_en || !downloadUrl) {
      showToast("कृपया सर्व आवश्यक माहिती भरा.", "error");
      return;
    }

    const catLabels = {
      biometric: { mr: "बायोमेट्रिक ड्रायव्हर", en: "Biometric Driver" },
      dsc: { mr: "डिजिटल सिग्नेचर (DSC)", en: "Digital Signature (DSC)" },
      system: { mr: "सिस्टीम सॉफ्टवेअर", en: "System Software" },
      utility: { mr: "उपयुक्त टूल", en: "Utility Tool" }
    };

    const finalFileName = currentUploadedFileName || (name_en.replace(/[^a-zA-Z0-9_-]/g, "_") + "." + (currentUploadedFormat || "exe"));
    const safeFileName = finalFileName.replace(/[^a-zA-Z0-9._-]/g, "_");

    // Guarantee Cloudinary download includes attachment filename header
    if (downloadUrl.includes("cloudinary.com") && downloadUrl.includes("/upload/") && !downloadUrl.includes("fl_attachment")) {
      downloadUrl = downloadUrl.replace("/upload/", `/upload/fl_attachment:${encodeURIComponent(safeFileName)}/`);
    }

    const newSoft = {
      id: editId || `soft-${Date.now()}`,
      name_mr,
      name_en,
      category,
      category_mr: catLabels[category]?.mr || category,
      category_en: catLabels[category]?.en || category,
      version: version || "v1.0",
      size: version.includes("MB") ? version : `${version}`,
      icon: icon || "fa-solid fa-box-archive",
      os: os || "Windows 10 / 11",
      downloadUrl,
      fileName: finalFileName,
      originalFilename: finalFileName,
      format: currentUploadedFormat || "exe",
      desc_mr,
      desc_en: desc_mr,
      isCustom: true
    };

    const saved = saveCustomSoftware(newSoft);
    if (saved) {
      renderAdminSoftwaresTable();
      renderSoftwareGrid();
      toggleAdminSoftwareForm(false);
      showToast(CURRENT_LANG === "mr" ? `🎉 "${name_mr}" सॉफ्टवेअर पोर्टलवर सेव्ह झाले!` : `🎉 Software "${name_en}" saved!`, "success");
    } else {
      showToast("सॉफ्टवेअर जतन करण्यात त्रुटी आली.", "error");
    }
  });
}

function renderAdminSoftwaresTable() {
  const tbody = document.getElementById("admin-softwares-tbody");
  const badge = document.getElementById("admin-softwares-badge");
  if (badge) badge.textContent = SOFTWARES_DATA.length;
  if (!tbody) return;

  const isMr = CURRENT_LANG === "mr";

  if (SOFTWARES_DATA.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #94a3b8;">कोणतेही सॉफ्टवेअर उपलब्ध नाही.</td></tr>`;
    return;
  }

  tbody.innerHTML = SOFTWARES_DATA.map((s, idx) => {
    const name = isMr ? s.name_mr : s.name_en;
    const cat = isMr ? (s.category_mr || s.category) : (s.category_en || s.category);
    return `
      <tr>
        <td style="font-weight: 700; color: #94a3b8;">${idx + 1}</td>
        <td><i class="${s.icon || 'fa-solid fa-box-archive'}" style="color: #0284c7; font-size: 1.15rem;"></i></td>
        <td>
          <strong>${name}</strong>
          <div style="font-size: 0.75rem; color: #64748b;">${s.os || 'Windows'}</div>
        </td>
        <td><span class="service-cat-pill">${cat}</span></td>
        <td><strong>${s.version || '-'}</strong> <span style="color: #64748b; font-size: 0.76rem;">(${s.size || ''})</span></td>
        <td>
          <a href="${s.downloadUrl}" target="_blank" rel="noopener" style="font-size: 0.78rem; color: #0284c7; text-decoration: underline;" title="${s.downloadUrl}">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> लिंक तपासा
          </a>
        </td>
        <td style="text-align: center;">
          <div style="display: inline-flex; gap: 4px;">
            <button class="admin-action-btn" onclick="editSoftware('${s.id}')" title="संपादित करा">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="admin-action-btn delete-btn" onclick="handleDeleteSoftware('${s.id}')" title="हटवा" style="color: #dc2626;">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function editSoftware(softId) {
  const soft = SOFTWARES_DATA.find(s => s.id === softId);
  if (!soft) return;

  toggleAdminSoftwareForm(true);

  document.getElementById("soft-edit-id").value = soft.id;
  document.getElementById("soft-name-mr").value = soft.name_mr || "";
  document.getElementById("soft-name-en").value = soft.name_en || "";
  document.getElementById("soft-category").value = soft.category || "biometric";
  document.getElementById("soft-version").value = soft.version || "";
  document.getElementById("soft-os").value = soft.os || "Windows 10 / 11";
  document.getElementById("soft-icon").value = soft.icon || "fa-solid fa-box-archive";
  document.getElementById("soft-download-url").value = soft.downloadUrl || "";
  document.getElementById("soft-desc-mr").value = soft.desc_mr || "";

  document.getElementById("soft-form-heading").textContent = `✏️ "${soft.name_mr}" संपादित करा`;

  showToast(`"${soft.name_mr}" संपादनासाठी उघडले आहे.`, "info");
}

function handleDeleteSoftware(softId) {
  const soft = SOFTWARES_DATA.find(s => s.id === softId);
  const name = soft ? soft.name_mr : softId;
  const isMr = CURRENT_LANG === "mr";

  if (confirm(isMr ? `तुम्हाला "${name}" हे सॉफ्टवेअर सेटअप काढून टाकायचे आहे का?` : `Remove "${name}" software?`)) {
    deleteSoftwareById(softId);
    renderAdminSoftwaresTable();
    renderSoftwareGrid();
    showToast(isMr ? `"${name}" सॉफ्टवेअर काढण्यात आले.` : `Software removed.`, "success");
  }
}

/**
 * Admin Useful Links & HTML Tools Manager
 */
function toggleAdminLinkForm(show) {
  const container = document.getElementById("admin-link-form-container");
  const form = document.getElementById("admin-link-form");
  if (!container) return;

  if (typeof show === "boolean") {
    container.style.display = show ? "block" : "none";
  } else {
    container.style.display = container.style.display === "none" ? "block" : "none";
  }

  if (container.style.display === "block") {
    container.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else {
    form?.reset();
    const editId = document.getElementById("link-edit-id");
    if (editId) editId.value = "";
    const heading = document.getElementById("link-form-heading");
    if (heading) heading.textContent = "➕ नवीन लिंक किंवा HTML पेज जोडा";
  }
}

function initAdminLinkManager() {
  const form = document.getElementById("admin-link-form");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const editId = document.getElementById("link-edit-id")?.value;
    const title_mr = document.getElementById("link-title-mr")?.value.trim();
    const title_en = document.getElementById("link-title-en")?.value.trim();
    const category = document.getElementById("link-category")?.value;
    const icon = document.getElementById("link-icon")?.value;
    const url = document.getElementById("link-url")?.value.trim();
    const desc_mr = document.getElementById("link-desc-mr")?.value.trim();

    if (!title_mr || !title_en || !url) {
      showToast("कृपया सर्व आवश्यक माहिती भरा.", "error");
      return;
    }

    const isInternal = url.endsWith(".html") || !url.startsWith("http");

    const newLink = {
      id: editId || `link-${Date.now()}`,
      title_mr,
      title_en,
      category,
      icon: icon || "fa-solid fa-link",
      url,
      desc_mr,
      desc_en: desc_mr,
      isInternal,
      isCustom: true
    };

    const saved = saveCustomLink(newLink);
    if (saved) {
      renderAdminLinksTable();
      renderUsefulLinksGrid();
      toggleAdminLinkForm(false);
      showToast(CURRENT_LANG === "mr" ? `🎉 "${title_mr}" लिंक पोर्टलवर समाविष्ट झाली!` : `🎉 Link "${title_en}" saved!`, "success");
    } else {
      showToast("लिंक जतन करण्यात त्रुटी आली.", "error");
    }
  });
}

function renderAdminLinksTable() {
  const tbody = document.getElementById("admin-links-tbody");
  const badge = document.getElementById("admin-links-badge");
  if (badge) badge.textContent = IMPORTANT_LINKS.length;
  if (!tbody) return;

  const isMr = CURRENT_LANG === "mr";

  if (IMPORTANT_LINKS.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #94a3b8;">कोणतीही लिंक उपलब्ध नाही.</td></tr>`;
    return;
  }

  tbody.innerHTML = IMPORTANT_LINKS.map((l, idx) => {
    const title = isMr ? l.title_mr : l.title_en;
    return `
      <tr>
        <td style="font-weight: 700; color: #94a3b8;">${idx + 1}</td>
        <td><i class="${l.icon || 'fa-solid fa-link'}" style="color: var(--saffron-orange); font-size: 1.15rem;"></i></td>
        <td>
          <strong>${title}</strong>
          <div style="font-size: 0.75rem; color: #64748b;">${l.desc_mr || ''}</div>
        </td>
        <td><span class="service-cat-pill">${l.category || 'इतर'}</span></td>
        <td>
          <a href="${l.url}" target="_blank" rel="noopener" style="font-size: 0.78rem; color: #0284c7; text-decoration: underline;" title="${l.url}">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> ${l.url}
          </a>
        </td>
        <td style="text-align: center;">
          <div style="display: inline-flex; gap: 4px;">
            <button class="admin-action-btn" onclick="editLink('${l.id}')" title="संपादित करा">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="admin-action-btn delete-btn" onclick="handleDeleteLink('${l.id}')" title="हटवा" style="color: #dc2626;">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function editLink(linkId) {
  const link = IMPORTANT_LINKS.find(l => l.id === linkId);
  if (!link) return;

  toggleAdminLinkForm(true);

  document.getElementById("link-edit-id").value = link.id;
  document.getElementById("link-title-mr").value = link.title_mr || "";
  document.getElementById("link-title-en").value = link.title_en || "";
  document.getElementById("link-category").value = link.category || "अधिकृत शासकीय टूल्स व दाखले";
  document.getElementById("link-icon").value = link.icon || "fa-solid fa-link";
  document.getElementById("link-url").value = link.url || "";
  document.getElementById("link-desc-mr").value = link.desc_mr || "";

  document.getElementById("link-form-heading").textContent = `✏️ "${link.title_mr}" संपादित करा`;

  showToast(`"${link.title_mr}" संपादनासाठी उघडली आहे.`, "info");
}

function handleDeleteLink(linkId) {
  const link = IMPORTANT_LINKS.find(l => l.id === linkId);
  const name = link ? link.title_mr : linkId;
  const isMr = CURRENT_LANG === "mr";

  if (confirm(isMr ? `तुम्हाला "${name}" ही लिंक काढून टाकायची आहे का?` : `Remove "${name}" link?`)) {
    deleteLinkById(linkId);
    renderAdminLinksTable();
    renderUsefulLinksGrid();
    showToast(isMr ? `"${name}" लिंक काढण्यात आली.` : `Link removed.`, "success");
  }
}

/* ============================================================
   GLOBAL WINDOW EXPORTS - Script-level for onclick compatibility
   ============================================================ */
window.openWelcomeModal = function() {
  var m = document.getElementById('welcome-banner-modal');
  if (!m) { console.error('welcome-banner-modal not found'); return; }
  m.style.setProperty('display', 'flex', 'important');
  m.style.setProperty('visibility', 'visible', 'important');
  m.style.setProperty('opacity', '1', 'important');
  m.classList.add('active');
  document.body.style.overflow = 'hidden';
};
window.closeWelcomeModal = function() {
  var m = document.getElementById('welcome-banner-modal');
  if (!m) return;
  m.style.setProperty('display', 'none', 'important');
  m.classList.remove('active');
  document.body.style.overflow = '';
};
window.handleWelcomeAction = function(action) {
  window.closeWelcomeModal();
  if (action === 'services') { var s = document.getElementById('services'); if (s) s.scrollIntoView({ behavior: 'smooth' }); }
  else if (action === 'apply') { switchTab('tab-apply-form'); }
};
window.openUsefulLinksModal = function() {
  var m = document.getElementById('useful-links-modal');
  if (!m) { console.error('useful-links-modal not found'); return; }
  m.style.setProperty('display', 'flex', 'important');
  m.style.setProperty('visibility', 'visible', 'important');
  m.style.setProperty('opacity', '1', 'important');
  m.classList.add('active');
  document.body.style.overflow = 'hidden';
  try { renderUsefulLinksGrid(); initUsefulLinksSearch(); } catch(e) { console.error(e); }
};
window.openSoftwareModal = function() {
  var m = document.getElementById('software-modal');
  if (!m) { console.error('software-modal not found'); return; }
  m.style.setProperty('display', 'flex', 'important');
  m.style.setProperty('visibility', 'visible', 'important');
  m.style.setProperty('opacity', '1', 'important');
  m.classList.add('active');
  document.body.style.overflow = 'hidden';
  try { currentSoftwareCategory = 'all'; renderSoftwareGrid(); initSoftwareModalFilters(); } catch(e) { console.error(e); }
};
window.openAdminLogin = function() {
  var m = document.getElementById('admin-login-modal');
  if (!m) { console.error('admin-login-modal not found'); return; }
  m.style.setProperty('display', 'flex', 'important');
  m.style.setProperty('visibility', 'visible', 'important');
  m.style.setProperty('opacity', '1', 'important');
  m.classList.add('active');
  document.body.style.overflow = 'hidden';
};
window.closeModal = function(modalId) {
  var m = document.getElementById(modalId);
  if (!m) return;
  m.style.setProperty('display', 'none', 'important');
  m.classList.remove('active');
  var anyActive = document.querySelector('.modal-overlay.active, .welcome-modal-overlay.active');
  if (!anyActive) document.body.style.overflow = '';
};
window.switchTab = switchTab;
window.switchAdminSubTab = switchAdminSubTab;
window.startApplyForService = startApplyForService;
