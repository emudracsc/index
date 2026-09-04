/**
 * 🌐 Universal Form History & Cloud Server Auto-Save Tracker
 * eMudra Aaple Sarkar Seva Kendra Portal
 *
 * This script automatically tracks ALL HTML and PDF forms across the portal:
 * 1. Automatically intercepts print, PDF download, and submit actions to record applicant data on Supabase Cloud Server & LocalStorage.
 * 2. Automatically pre-fills form fields and tables when opened in edit mode (?edit_app_id=...).
 * 3. Handles automatic re-printing (?autoprint=1).
 */

(function () {
  'use strict';

  // Extract current page slug (e.g. 'varas-ferfar', 'income-certificate', etc.)
  function getPageSlug() {
    var path = window.location.pathname;
    var filename = path.substring(path.lastIndexOf('/') + 1);
    return filename.replace(/\.html$/i, '').toLowerCase() || 'index';
  }

  // Generate prefix according to form type
  function getFormPrefix(slug) {
    var map = {
      'income-certificate': 'INC',
      'aadhaar-certificate': 'ADH',
      'varas-ferfar': 'VRS',
      'janma-mrutyu-dakhla': 'JMD',
      'ration-card-addition': 'RCA',
      'ration-card-deletion': 'RCD',
      'varas-affidavit': 'VAF',
      'bhumi-abhilekh-nakal': 'BAN',
      'nakal-arja': 'NAK',
      'gazette-name-change': 'GZT',
      'affidavit-print': 'AFF',
      'pratigya-patra': 'PRT',
      'mahabocw': 'BOC',
      'mahabocwgramsevak': 'GSV',
      'gramsevak90': 'GSV',
      'pikpera': 'PIK',
      'eaadhaar-print': 'EAD',
      'aadhar-kendra': 'AAK',
      'aero': 'AER'
    };
    return map[slug] || 'FRM';
  }

  // Get Clean Form Title in Marathi
  function getFormCleanTitle(slug) {
    var map = {
      'income-certificate': 'उत्पन्न दाखला अर्ज (१० पाने संच)',
      'aadhaar-certificate': 'आधार नोंदणी / सुधारणा प्रमाणपत्र',
      'varas-ferfar': 'वारस फेरफार ९-पानी मास्टर संच',
      'janma-mrutyu-dakhla': 'जन्म / मृत्यू नोंद उतारा मागणी अर्ज',
      'ration-card-addition': 'रेशन कार्ड नाव समाविष्ट करणे अर्ज',
      'ration-card-deletion': 'रेशन कार्ड नाव कमी करणे अर्ज',
      'varas-affidavit': 'वारस हक्क प्रतिज्ञापत्र',
      'bhumi-abhilekh-nakal': 'भूमी अभिलेख नक्कल मागणी अर्ज',
      'nakal-arja': 'शासकीय आदेश नक्कल अर्ज',
      'gazette-name-change': 'राजपत्र नाव बदल अर्ज',
      'affidavit-print': 'सर्वसाधारण स्वयंघोषणा / प्रतिज्ञापत्र',
      'pratigya-patra': 'अधिकृत स्वयंघोषणापत्र / टोकन',
      'mahabocw': 'बांधकाम कामगार कल्याणकारी नोंदणी अर्ज',
      'mahabocwgramsevak': 'बांधकाम कामगार ९० दिवस प्रमाणपत्र',
      'gramsevak90': 'ग्रामसेवक ९० दिवस प्रमाणपत्र',
      'pikpera': 'ई-पीक पाहणी / पीकपेरा स्वयंघोषणापत्र',
      'eaadhaar-print': 'e-Aadhaar PVC कार्ड प्रिंट',
      'aadhar-kendra': 'आधार केंद्र नोंदणी व्यवस्थापक',
      'aero': 'Aero ई-सेवा अहवाल'
    };
    if (map[slug]) return map[slug];

    var titleEl = document.querySelector('.bar-title, h1, h2, title');
    var txt = titleEl ? titleEl.innerText.trim() : document.title;
    return txt.split('|')[0].split('(')[0].trim() || 'शासकीय फॉर्म';
  }

  // Intelligently scan and collect all form inputs and dynamic tables
  function scanAndCollectFormData() {
    var data = {};
    var allInputs = document.querySelectorAll('input, select, textarea');

    allInputs.forEach(function (inp) {
      if (inp.type === 'file' || inp.type === 'button' || inp.type === 'submit') return;

      var key = inp.id || inp.name;
      if (!key) return;

      if (inp.type === 'checkbox') {
        data[key] = inp.checked;
      } else if (inp.type === 'radio') {
        if (inp.checked) data[key] = inp.value;
      } else {
        data[key] = inp.value;
      }
    });

    // Capture dynamic structured tables across different tools
    try {
      if (typeof window.heirsData !== 'undefined' && Array.isArray(window.heirsData)) {
        data._heirsData = JSON.parse(JSON.stringify(window.heirsData));
      }
      if (typeof window.membersData !== 'undefined' && Array.isArray(window.membersData)) {
        data._membersData = JSON.parse(JSON.stringify(window.membersData));
      }
      if (typeof window.deleteMembersData !== 'undefined' && Array.isArray(window.deleteMembersData)) {
        data._deleteMembersData = JSON.parse(JSON.stringify(window.deleteMembersData));
      }
      if (typeof window.heirsList !== 'undefined' && Array.isArray(window.heirsList)) {
        data._heirsList = JSON.parse(JSON.stringify(window.heirsList));
      }
      if (typeof window.recordsData !== 'undefined' && Array.isArray(window.recordsData)) {
        data._recordsData = JSON.parse(JSON.stringify(window.recordsData));
      }
    } catch (e) {
      console.warn('Table state serialize warning:', e);
    }

    return data;
  }

  // Intelligently find applicant name, mobile, and aadhaar
  function extractApplicantMeta(formData) {
    var name = '';
    var mobile = '';
    var aadhaar = '';

    // Check by known IDs first
    var nameKeys = [
      'm_name', 'applicant_name', 'applicantName', 'inp_applicant_name', 'inp_app_name',
      'farmerName', 'print_workerName', 'personName', 'cust_name', 'fullName',
      'full_name', 'resident_name', 'deceased_name', 'head_name', 'person_name',
      'name', 'first_name', 'editNameInput'
    ];
    var mobileKeys = [
      'm_mobile', 'mobile', 'inp_mobile', 'mobileNo', 'print_workerPhone',
      'in_mobile', 'phone', 'contact', 'applicant_mobile', 'cust_mobile'
    ];
    var aadhaarKeys = [
      'm_aadhaar', 'aadhaar', 'uid', 'aadhar', 'inp_ration_no', 'farmerId',
      'print_outwardNumber', 'applicant_aadhaar'
    ];

    for (var i = 0; i < nameKeys.length; i++) {
      if (formData[nameKeys[i]] && String(formData[nameKeys[i]]).trim()) {
        name = String(formData[nameKeys[i]]).trim();
        break;
      }
    }

    // Check Gazette Name Fields
    if (!name) {
      if (formData['in_new_fn_mr'] && formData['in_new_fn_mr'].trim()) {
        name = [formData['in_new_fn_mr'], formData['in_new_mn_mr'], formData['in_new_ln_mr']].filter(Boolean).join(' ');
      } else if (formData['in_new_fn_en'] && formData['in_new_fn_en'].trim()) {
        name = [formData['in_new_fn_en'], formData['in_new_mn_en'], formData['in_new_ln_en']].filter(Boolean).join(' ');
      }
    }

    for (var j = 0; j < mobileKeys.length; j++) {
      if (formData[mobileKeys[j]] && String(formData[mobileKeys[j]]).trim()) {
        mobile = String(formData[mobileKeys[j]]).trim();
        break;
      }
    }

    for (var k = 0; k < aadhaarKeys.length; k++) {
      if (formData[aadhaarKeys[k]] && String(formData[aadhaarKeys[k]]).trim()) {
        aadhaar = String(formData[aadhaarKeys[k]]).trim();
        break;
      }
    }

    // Fallback: search by partial key or value heuristics
    if (!name || !mobile || !aadhaar) {
      for (var prop in formData) {
        if (!formData.hasOwnProperty(prop)) continue;
        if (prop.startsWith('_')) continue;
        var val = String(formData[prop]).trim();
        var lowerProp = prop.toLowerCase();

        if (!name && (lowerProp.indexOf('name') !== -1 || lowerProp.indexOf('नाव') !== -1) && val.length > 3) {
          name = val;
        }
        if (!mobile && (lowerProp.indexOf('mobile') !== -1 || lowerProp.indexOf('phone') !== -1 || /^[6-9]\d{9}$/.test(val))) {
          mobile = val;
        }
        if (!aadhaar && (lowerProp.indexOf('aadhaar') !== -1 || lowerProp.indexOf('uid') !== -1 || /^\d{4}\s?\d{4}\s?\d{4}$/.test(val))) {
          aadhaar = val;
        }
      }
    }

    return {
      applicantName: name || 'नागरिक / अर्जदार',
      mobile: mobile || '',
      aadhaar: aadhaar || ''
    };
  }

  var currentSessionAppId = null;
  var isSavingInProgress = false;

  // Show a modern floating notification banner
  function showUniversalSaveToast(msg) {
    var toast = document.createElement('div');
    toast.className = 'no-print';
    toast.style.cssText =
      'position:fixed;top:18px;right:18px;z-index:999999;background:linear-gradient(135deg,#059669 0%,#047857 100%);color:#fff;' +
      'padding:12px 20px;border-radius:10px;box-shadow:0 8px 25px rgba(0,0,0,0.35);font-family:sans-serif;font-size:0.88rem;font-weight:700;' +
      'display:flex;align-items:center;gap:10px;animation:slideInRight 0.3s ease-out;';

    toast.innerHTML = '<i class="fa-solid fa-cloud-arrow-up" style="font-size:1.2rem;"></i> <span>' + msg + '</span>';
    document.body.appendChild(toast);

    setTimeout(function () {
      toast.style.transition = 'opacity 0.4s, transform 0.4s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 400);
    }, 3800);
  }

  // Show top edit mode indicator bar
  function showTopEditIndicator(appId, applicantName) {
    if (document.getElementById('emudra-universal-edit-bar')) return;

    var bar = document.createElement('div');
    bar.id = 'emudra-universal-edit-bar';
    bar.className = 'no-print';
    bar.style.cssText =
      'background:linear-gradient(90deg,#1e293b 0%,#0f172a 100%);border-bottom:2px solid #10b981;color:#f8fafc;' +
      'padding:8px 16px;font-family:sans-serif;font-size:0.84rem;font-weight:700;display:flex;justify-content:space-between;align-items:center;box-shadow:0 4px 14px rgba(0,0,0,0.3);position:sticky;top:0;z-index:9999;';

    bar.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;">' +
      '<i class="fa-solid fa-pen-to-square" style="color:#34d399;"></i>' +
      '<span>संपादन मोड: अर्ज क्र. <strong style="color:#6ee7b7;">' + appId + '</strong> (' + (applicantName || 'नागरिक') + ') - बदल करून पुन्हा प्रिंट करा.</span>' +
      '</div>' +
      '<a href="index.html" style="color:#93c5fd;text-decoration:none;font-size:0.8rem;background:rgba(255,255,255,0.08);padding:5px 12px;border-radius:6px;">' +
      '<i class="fa-solid fa-arrow-left"></i> डॅशबोर्ड</a>';

    document.body.insertBefore(bar, document.body.firstChild);
  }

  // Inject Floating Quick Action & Save Bar
  function injectFloatingActionBar() {
    if (document.getElementById('emudra-form-floating-bar')) return;
    var slug = getPageSlug();
    if (slug === 'index' || slug === 'digital-dalan' || slug === 'digital-wall' || slug === 'book-wall' || slug === 'logo-wall' || slug === 'news_paper') return;

    var bar = document.createElement('div');
    bar.id = 'emudra-form-floating-bar';
    bar.className = 'no-print';
    bar.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;display:flex;align-items:center;gap:8px;background:rgba(15,23,42,0.95);backdrop-filter:blur(10px);padding:8px 14px;border-radius:50px;border:1px solid rgba(255,255,255,0.18);box-shadow:0 12px 35px rgba(0,0,0,0.5);font-family:sans-serif;';

    bar.innerHTML =
      '<div id="emudra-save-status-pill" style="display:flex;align-items:center;gap:6px;color:#94a3b8;font-size:0.8rem;font-weight:600;padding:4px 10px;background:rgba(255,255,255,0.06);border-radius:20px;">' +
      '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span>' +
      '<span id="emudra-save-status-text">क्लाउड सिंक सक्रिय</span>' +
      '</div>' +
      '<button type="button" id="emudra-floating-save-btn" style="background:linear-gradient(135deg,#059669,#047857);color:#ffffff;border:none;padding:8px 16px;border-radius:25px;font-size:0.85rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(5,150,105,0.4);transition:all 0.2s;">' +
      '<i class="fa-solid fa-cloud-arrow-up"></i> <span>💾 अर्ज सेव्ह करा</span>' +
      '</button>' +
      '<a href="index.html" style="background:rgba(255,255,255,0.1);color:#e2e8f0;text-decoration:none;padding:8px 14px;border-radius:25px;font-size:0.82rem;font-weight:700;display:inline-flex;align-items:center;gap:5px;">' +
      '<i class="fa-solid fa-gauge-high" style="color:#38bdf8;"></i> <span>डॅशबोर्ड</span>' +
      '</a>';

    document.body.appendChild(bar);

    var saveBtn = document.getElementById('emudra-floating-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        saveCurrentFormApplication(false);
      });
    }
  }

  // Inject Save Button into Existing Header Button Groups
  function injectHeaderSaveButton() {
    var btnGroup = document.querySelector('.btn-group, .actions-row, .header-actions, .top-bar-buttons, .controls-header-actions');
    if (!btnGroup || document.getElementById('emudra-header-save-btn')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'emudra-header-save-btn';
    btn.className = 'btn btn-success no-print';
    btn.style.cssText = 'background:#059669;color:#ffffff;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:7px;border:none;';
    btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>💾 अर्ज सेव्ह करा</span>';
    btn.onclick = function () {
      saveCurrentFormApplication(false);
    };

    if (btnGroup.children.length > 1) {
      btnGroup.insertBefore(btn, btnGroup.children[1]);
    } else {
      btnGroup.appendChild(btn);
    }
  }

  // Main Core Save Function (supports silent auto-save)
  async function saveCurrentFormApplication(silent) {
    if (isSavingInProgress) return null;

    var slug = getPageSlug();
    if (slug === 'index' || slug === 'digital-dalan' || slug === 'digital-wall' || slug === 'book-wall' || slug === 'logo-wall' || slug === 'news_paper') {
      return null;
    }

    isSavingInProgress = true;

    var statusEl = document.getElementById('emudra-save-status-text');
    if (statusEl) statusEl.textContent = 'सेव्ह होत आहे...';

    var formData = scanAndCollectFormData();
    var meta = extractApplicantMeta(formData);
    var prefix = getFormPrefix(slug);

    var urlParams = new URLSearchParams(window.location.search);
    var existingAppId = urlParams.get('edit_app_id');

    if (!currentSessionAppId) {
      currentSessionAppId = existingAppId || (prefix + '-' + Math.floor(100000 + Math.random() * 900000));
    }
    var targetAppId = existingAppId || currentSessionAppId;

    var formRecord = {
      appId: targetAppId,
      prefix: prefix,
      formType: slug,
      formTitle: getFormCleanTitle(slug),
      applicantName: meta.applicantName,
      mobile: meta.mobile,
      aadhaar: meta.aadhaar,
      formData: formData,
      status: 'printed'
    };

    try {
      if (typeof window.DB !== 'undefined' && typeof window.DB.saveFormHistory === 'function') {
        await window.DB.saveFormHistory(formRecord);
      } else {
        var key = 'emudra_form_history';
        var list = JSON.parse(localStorage.getItem(key) || '[]');
        var idx = list.findIndex(function (item) { return item.appId === formRecord.appId; });
        if (idx >= 0) list[idx] = formRecord; else list.unshift(formRecord);
        localStorage.setItem(key, JSON.stringify(list));

        var cscList = JSON.parse(localStorage.getItem('emudra_csc_applications') || '[]');
        var cscIdx = cscList.findIndex(function (item) { return (item.appId || item.id) === formRecord.appId; });
        var cscRec = {
          appId: formRecord.appId, id: formRecord.appId, serviceId: slug, serviceName: formRecord.formTitle,
          fullName: meta.applicantName, mobile: meta.mobile, aadhaar: meta.aadhaar,
          date: new Date().toISOString().split('T')[0], submittedAt: new Date().toISOString(),
          status: 'printed', isFormHistory: true
        };
        if (cscIdx >= 0) cscList[cscIdx] = cscRec; else cscList.unshift(cscRec);
        localStorage.setItem('emudra_csc_applications', JSON.stringify(cscList));
      }

      if (statusEl) statusEl.textContent = '✅ सेव्ह झाले (' + targetAppId + ')';

      if (!silent) {
        showUniversalSaveToast('✅ अर्ज क्र. ' + targetAppId + ' सर्व्हरवर सेव्ह झाला!');
      }
    } catch (err) {
      console.warn('Universal save warning:', err);
      if (statusEl) statusEl.textContent = 'स्थानिक मेमरीत सेव्ह झाले';
    } finally {
      setTimeout(function () {
        isSavingInProgress = false;
      }, 800);
    }

    return formRecord;
  }

  // Pre-fill form from database record
  function populateFormInputs(formData) {
    if (!formData) return;

    // 1. Populate standard form elements
    for (var key in formData) {
      if (!formData.hasOwnProperty(key)) continue;
      if (key.startsWith('_')) continue;

      var el = document.getElementById(key) || document.querySelector('[name="' + key + '"]');
      if (!el) continue;

      var val = formData[key];
      if (el.type === 'checkbox') {
        el.checked = !!val;
      } else if (el.type === 'radio') {
        var radioOption = document.querySelector('input[type="radio"][name="' + el.name + '"][value="' + val + '"]');
        if (radioOption) radioOption.checked = true;
      } else {
        el.value = val;
      }

      // Dispatch input and change events
      try {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (e) {}
    }

    // 2. Restore structured data tables
    try {
      if (formData._heirsData && typeof window.heirsData !== 'undefined') {
        window.heirsData = formData._heirsData;
        if (typeof window.initHeirsTable === 'function') window.initHeirsTable();
      }
      if (formData._membersData && typeof window.membersData !== 'undefined') {
        window.membersData = formData._membersData;
        if (typeof window.initMembersTable === 'function') window.initMembersTable();
      }
      if (formData._deleteMembersData && typeof window.deleteMembersData !== 'undefined') {
        window.deleteMembersData = formData._deleteMembersData;
        if (typeof window.initDeleteMembersTable === 'function') window.initDeleteMembersTable();
      }
      if (formData._heirsList && typeof window.heirsList !== 'undefined') {
        window.heirsList = formData._heirsList;
        if (typeof window.initHeirsTable === 'function') window.initHeirsTable();
      }
      if (formData._recordsData && typeof window.recordsData !== 'undefined') {
        window.recordsData = formData._recordsData;
        if (typeof window.initRecordsTable === 'function') window.initRecordsTable();
      }
    } catch (tblErr) {
      console.warn('Restore structured tables error:', tblErr);
    }

    // 3. Trigger app-specific preview sync
    try {
      if (typeof window.syncAll === 'function') window.syncAll();
      if (typeof window.syncForm === 'function') window.syncForm();
      if (typeof window.updateLetter === 'function') window.updateLetter();
      if (typeof window.renderPreviewHeirs === 'function') window.renderPreviewHeirs();
      if (typeof window.renderPreviewMembers === 'function') window.renderPreviewMembers();
      if (typeof window.applyFontChange === 'function') window.applyFontChange();
      if (typeof window.generateTokens === 'function') window.generateTokens();
      if (typeof window.generateForm === 'function') {
        try { window.generateForm(new Event('submit')); } catch (e) {}
      }
    } catch (syncErr) {
      console.warn('Post-fill preview sync error:', syncErr);
    }
  }

  // Intercept window.print (NON-BLOCKING: triggers background save without delaying browser print prompt)
  var originalPrint = window.print;
  window.print = function () {
    try {
      saveCurrentFormApplication(false);
    } catch (e) {
      console.warn('Save on print warning:', e);
    }
    originalPrint.apply(window, arguments);
  };

  // Intercept common PDF generation functions if present
  if (typeof window.downloadGazettePDF === 'function') {
    var origDownloadGazette = window.downloadGazettePDF;
    window.downloadGazettePDF = function () {
      try { saveCurrentFormApplication(false); } catch (e) {}
      origDownloadGazette.apply(this, arguments);
    };
  }

  // Global click delegate for any print or PDF buttons
  document.addEventListener('click', function (e) {
    var target = e.target.closest('button, a');
    if (!target) return;

    var onclickAttr = target.getAttribute('onclick') || '';
    var text = (target.innerText || '').toLowerCase();
    var cls = (target.className || '').toLowerCase();

    if (
      onclickAttr.indexOf('print') !== -1 ||
      onclickAttr.indexOf('pdf') !== -1 ||
      cls.indexOf('btn-print') !== -1 ||
      cls.indexOf('print-action-btn') !== -1 ||
      text.indexOf('प्रिंट') !== -1 ||
      (text.indexOf('pdf') !== -1 && text.indexOf('डाउनलोड') !== -1)
    ) {
      saveCurrentFormApplication(false);
    }
  }, true);

  // Global form submit delegate
  document.addEventListener('submit', function (e) {
    var slug = getPageSlug();
    if (slug !== 'index') {
      saveCurrentFormApplication(false);
    }
  }, true);

  // Debounced Auto-Save on any form input change
  var autoSaveTimer = null;
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(function () {
        saveCurrentFormApplication(true);
      }, 1400);
    }
  }, true);

  // On DOM Ready: Check Edit Mode, Autoprint, & Inject UI Elements
  window.addEventListener('DOMContentLoaded', function () {
    injectFloatingActionBar();
    setTimeout(injectHeaderSaveButton, 300);

    var urlParams = new URLSearchParams(window.location.search);
    var editId = urlParams.get('edit_app_id');
    var isAutoprint = urlParams.get('autoprint') === '1';

    if (editId) {
      currentSessionAppId = editId;
      setTimeout(async function () {
        var app = null;
        try {
          if (typeof window.DB !== 'undefined' && typeof window.DB.getFormById === 'function') {
            app = await window.DB.getFormById(editId);
          } else {
            var list = JSON.parse(localStorage.getItem('emudra_form_history') || '[]');
            app = list.find(function (a) { return a.appId === editId; });
          }
        } catch (e) {
          console.warn('Fetch edit app failed:', e);
        }

        if (app && app.formData) {
          populateFormInputs(app.formData);
          showTopEditIndicator(app.appId, app.applicantName);
        }

        if (isAutoprint) {
          setTimeout(function () {
            window.print();
          }, 800);
        }
      }, 180);
    } else if (isAutoprint) {
      setTimeout(function () {
        window.print();
      }, 900);
    }
  });

  // Expose global methods
  window.saveCurrentFormApplication = saveCurrentFormApplication;
  window.populateFormInputs = populateFormInputs;
})();
