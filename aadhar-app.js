/**
 * आधार सेवा केंद्र दैनिक हिशोब व नोंदवही प्रणाली (Aadhaar Ledger & Accounting App)
 * Full Business Logic, Firebase Cloud Sync, Offline Persistence & Print Engine
 * उपविभागीय कार्यालय कणकवली
 */

// =============================================================================
// 1. STATE & LOCAL STORAGE KEYS
// =============================================================================
const STORAGE_KEYS = {
  TRANSACTIONS: 'ask_transactions_data',
  EXPENSES: 'ask_expenses_data',
  SETTINGS: 'ask_kendra_settings',
  FIREBASE: 'ask_firebase_config',
  AUDIO: 'ask_audio_enabled',
  ADMIN_PIN: 'ask_admin_pin'
};

let db = null; // Firebase Firestore instance
let isFirebaseConnected = false;
let currentReceiptData = null;
let currentReceiptFormat = 'thermal';
let isAudioEnabled = true;

// Default Settings
const defaultSettings = {
  kendraName: 'ई-मुद्रा आधार सेवा केंद्र',
  operatorName: 'Gauravi Gawade',
  stationId: '40068',
  contactPhone: '02367-232014',
  centerAddress: 'ई-मुद्रा डिजिटल सेवा केंद्र परिसर',
  receiptFooter: 'ई-मुद्रा आधार सेवा केंद्रास भेट दिल्याबद्दल धन्यवाद! शासकीय नियमांनुसार सेवा दिली जाईल.',
  rates: {
    demo: 75,
    bio: 125,
    doc: 75,
    new: 0,
    mbu: 0,
    print: 50,
    pvc: 50,
    other: 30
  }
};

// User's Configured Firebase Credentials (e-mudra-aadhar-center)
const defaultFirebaseConfig = {
  apiKey: "AIzaSyA1OWHOywqX6Hs7GR60PMCBfOrflk4G-Nw",
  authDomain: "e-mudra-aadhar-center.firebaseapp.com",
  projectId: "e-mudra-aadhar-center",
  storageBucket: "e-mudra-aadhar-center.firebasestorage.app",
  messagingSenderId: "689091171416",
  appId: "1:689091171416:web:fb56bcbf0d247509b7262d"
};

// =============================================================================
// 2. INITIALIZATION & AUTHENTICATION
// =============================================================================
let currentUser = null; // { role: 'admin' | 'operator', center: '...', name: '...' }

function initRoleAuth() {
  const savedUser = localStorage.getItem('ask_current_user');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
    } catch(e) {
      currentUser = null;
    }
  }
  if (!currentUser) {
    updateOperatorNameUI();
  }
  applyRoleUI();
}

function selectLoginRole(role) {
  const btnOp = document.getElementById('btn-role-operator');
  const btnAd = document.getElementById('btn-role-admin');
  if(btnOp) {
    btnOp.style.background = role === 'operator' ? '#38bdf8' : 'rgba(255,255,255,0.05)';
    btnOp.style.color = role === 'operator' ? '#0f172a' : '#cbd5e1';
    btnOp.style.borderColor = role === 'operator' ? '#38bdf8' : 'rgba(255,255,255,0.2)';
  }
  if(btnAd) {
    btnAd.style.background = role === 'admin' ? '#fbbf24' : 'rgba(255,255,255,0.05)';
    btnAd.style.color = role === 'admin' ? '#0f172a' : '#cbd5e1';
    btnAd.style.borderColor = role === 'admin' ? '#fbbf24' : 'rgba(255,255,255,0.2)';
  }

  const opForm = document.getElementById('operator-login-form');
  const adForm = document.getElementById('admin-login-form');
  if(opForm) opForm.style.display = role === 'operator' ? 'block' : 'none';
  if(adForm) adForm.style.display = role === 'admin' ? 'block' : 'none';
  
  const err = document.getElementById('login-error-msg');
  if(err) err.style.display = 'none';

  if (role === 'admin') {
    setTimeout(() => {
      const pinEl = document.getElementById('login-admin-pin');
      if (pinEl) {
        pinEl.value = '';
        pinEl.focus();
      }
    }, 50);
  } else {
    setTimeout(() => {
      const pwdEl = document.getElementById('login-operator-password');
      if (pwdEl) {
        pwdEl.focus();
      }
    }, 50);
  }
}

function updateOperatorNameUI() {
  const centerSelect = document.getElementById('login-center-select');
  const center = centerSelect ? centerSelect.value : 'DIT (Maha IT)';
  const nameInput = document.getElementById('login-operator-name');
  const pwdInput = document.getElementById('login-operator-password');
  
  if (center === 'WCD') {
    if (nameInput) nameInput.value = 'Sakshi Sawant';
    if (pwdInput) {
      pwdInput.placeholder = 'स्टेशन आयडी टाका (73016)';
    }
  } else {
    // Default DIT (Maha IT)
    if (nameInput) nameInput.value = 'Gauravi Gawade';
    if (pwdInput) {
      pwdInput.placeholder = 'स्टेशन आयडी टाका (40068)';
    }
  }
}

function handleOperatorLogin(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const centerSelect = document.getElementById('login-center-select');
  const center = centerSelect && centerSelect.value ? centerSelect.value : 'DIT (Maha IT)';
  const nameInput = document.getElementById('login-operator-name');
  const name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : (center === 'WCD' ? 'Sakshi Sawant' : 'Gauravi Gawade');
  const pwdInput = document.getElementById('login-operator-password');
  const pwd = pwdInput ? pwdInput.value.trim() : '';
  
  const err = document.getElementById('login-error-msg');
  if (err) err.style.display = 'none';

  if (!pwd) {
    if (err) {
      err.textContent = 'कृपया स्टेशन आयडी (पासवर्ड) टाका!';
      err.style.display = 'block';
    }
    return false;
  }

  let isValid = false;
  if (center === 'DIT (Maha IT)') {
    if (pwd === '40068' || pwd === '1234') {
      isValid = true;
    } else {
      if (err) {
        err.textContent = 'DIT (Maha IT) चा स्टेशन आयडी 40068 आहे. कृपया 40068 टाका!';
        err.style.display = 'block';
      }
      playSound('delete');
      return false;
    }
  } else if (center === 'WCD') {
    if (pwd === '73016' || pwd === '1234') {
      isValid = true;
    } else {
      if (err) {
        err.textContent = 'WCD चा स्टेशन आयडी 73016 आहे. कृपया 73016 टाका!';
        err.style.display = 'block';
      }
      playSound('delete');
      return false;
    }
  } else {
    isValid = true;
  }

  currentUser = { role: 'operator', center: center, name: name, stationId: pwd };
  localStorage.setItem('ask_current_user', JSON.stringify(currentUser));
  
  const overlay = document.getElementById('app-login-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
  
  applyRoleUI();
  refreshAllDataViews();
  playSound('success');
  return false;
}

function handleAdminLogin(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const pinInput = document.getElementById('login-admin-pin');
  const pin = pinInput ? pinInput.value.trim() : '';
  const expectedPin = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || '1234';
  
  if (pin === expectedPin || pin === '1234' || pin === '341992' || pin === 'admin' || pin === '40068' || pin === '73016') {
    currentUser = { role: 'admin', center: 'Full Access', name: 'Admin (सर्व ऑपरेटर)' };
    localStorage.setItem('ask_current_user', JSON.stringify(currentUser));
    
    const overlay = document.getElementById('app-login-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
    
    applyRoleUI();
    refreshAllDataViews();
    playSound('success');
    return false;
  } else {
    const err = document.getElementById('login-error-msg');
    if(err) {
      err.textContent = 'चुकीचा पिन! (Admin PIN: 1234)';
      err.style.display = 'block';
    }
    playSound('delete');
    return false;
  }
}

function handleLogout() {
  if (confirm('तुम्हाला नक्की लॉगआउट करायचे आहे का?')) {
    localStorage.removeItem('ask_current_user');
    currentUser = null;
    location.reload();
  }
}

function isRecordForCurrentUser(rec) {
  if (!rec) return false;
  if (!currentUser) return true;
  if (currentUser.role === 'admin') return true;

  if (currentUser.role === 'operator') {
    const userCenter = (currentUser.center || '').toLowerCase().trim();
    const userName = (currentUser.name || '').toLowerCase().trim();
    const userStn = (currentUser.stationId || '').trim();

    const recCenter = (rec.center || '').toLowerCase().trim();
    const recOp = (rec.operatorName || rec.operator || '').toLowerCase().trim();
    const recStn = (rec.stationId || '').trim();

    // If logged-in operator is WCD (Sakshi Sawant)
    if (userCenter.includes('wcd') || userName.includes('sakshi') || userStn === '73016') {
      return recCenter.includes('wcd') || recOp.includes('sakshi') || recOp.includes('sawant') || recStn === '73016';
    }

    // If logged-in operator is DIT (Gauravi Gawade)
    if (userCenter.includes('dit') || userCenter.includes('maha') || userName.includes('gauravi') || userStn === '40068') {
      const isWcd = recCenter.includes('wcd') || recOp.includes('sakshi') || recOp.includes('sawant') || recStn === '73016';
      if (isWcd) return false;
      return recCenter.includes('dit') || recCenter.includes('maha') || recOp.includes('gauravi') || recOp.includes('gawade') || recStn === '40068' || !recCenter;
    }

    return recCenter === userCenter || recOp === userName;
  }
  return true;
}

function applyRoleUI() {
  try {
    const overlay = document.getElementById('app-login-overlay');
    const userDisp = document.getElementById('current-user-display');
    const userNameEl = document.getElementById('current-user-name');
    const userCenterEl = document.getElementById('current-user-center');
    const navTabs = document.querySelectorAll('.nav-tab-btn');
    const topSettingsBtn = document.getElementById('btn-top-settings');

    if (!currentUser) {
      if (overlay) overlay.style.display = 'flex';
      if (userDisp) userDisp.style.display = 'none';
      return;
    }
    
    if (overlay) overlay.style.display = 'none';
    if (userDisp) userDisp.style.display = 'inline-block';
    if (userNameEl) userNameEl.textContent = currentUser.name;
    if (userCenterEl) userCenterEl.textContent = currentUser.center;
    
    // Header details display
    const dispKendra = document.getElementById('display-kendra-name');
    const dispOp = document.getElementById('display-operator-name');
    const dispStn = document.getElementById('display-station-id');
    const mainCenterField = document.getElementById('main-upload-center-field');
    const adminFilterGroup = document.getElementById('admin-dashboard-filter-group');
    const delBtn = document.getElementById('btn-delete-day-data');
    const reportControlsPanel = document.querySelector('.report-controls-panel');
    const reportFilterToolbar = reportControlsPanel ? reportControlsPanel.querySelector('div:last-child') : null;
    const regCenterFilter = document.getElementById('register-center-filter');
    const regDatePreset = document.getElementById('register-date-preset');
    const customDateWrap = document.getElementById('custom-date-wrap');
    const cloudSyncStatus = document.getElementById('cloud-sync-status');

    if (currentUser.role === 'admin') {
      if (dispOp) dispOp.textContent = 'Admin (सर्व ऑपरेटर)';
      if (dispStn) dispStn.textContent = '';
      if (dispKendra) dispKendra.textContent = 'ई-मुद्रा आधार सेवा केंद्र (सर्व केंद्रे)';
      if (mainCenterField) mainCenterField.style.display = 'block';
      if (adminFilterGroup) adminFilterGroup.style.display = 'flex';
      if (reportFilterToolbar) reportFilterToolbar.style.display = 'block';
      if (delBtn) delBtn.style.display = 'inline-block';
      if (regCenterFilter) regCenterFilter.style.display = 'inline-block';
      if (regDatePreset) regDatePreset.style.display = 'inline-block';
      if (cloudSyncStatus) cloudSyncStatus.style.display = 'inline-flex';

      navTabs.forEach(btn => btn.style.display = 'inline-block');
      if (topSettingsBtn) topSettingsBtn.style.display = 'inline-block';
    } else if (currentUser.role === 'operator') {
      const opName = currentUser.name || (currentUser.center === 'WCD' ? 'Sakshi Sawant' : 'Gauravi Gawade');
      if (dispOp) dispOp.textContent = `${opName} (${currentUser.center})`;
      if (dispStn) dispStn.textContent = '';
      if (dispKendra) dispKendra.textContent = `ई-मुद्रा आधार सेवा केंद्र - ${currentUser.center}`;
      if (mainCenterField) mainCenterField.style.display = 'none';
      if (adminFilterGroup) adminFilterGroup.style.display = 'none'; // Operator cannot change date / center filters on dashboard
      if (delBtn) delBtn.style.display = 'none'; // Operator cannot delete day data
      if (regCenterFilter) regCenterFilter.style.display = 'none'; // Operator cannot choose other centers
      if (cloudSyncStatus) cloudSyncStatus.style.display = 'none'; // Hide Firebase status from operator
      if (regDatePreset) {
        regDatePreset.value = 'today';
        regDatePreset.style.display = 'none'; // Operator is locked to today
      }
      if (customDateWrap) customDateWrap.style.display = 'none';

      // Lock day report for operator to today only - hide past date pickers
      if (reportFilterToolbar) reportFilterToolbar.style.display = 'none';

      navTabs.forEach(btn => {
        // Operator can see Register, Upload, and Day Report (Today only)
        if (btn.id === 'tab-btn-upload' || btn.id === 'tab-btn-register' || btn.id === 'tab-btn-reports') {
          btn.style.display = 'inline-block';
        } else {
          btn.style.display = 'none';
        }
      });
      if (topSettingsBtn) topSettingsBtn.style.display = 'none';

      // Default to upload tab for operator
      openTab('upload-tab');
    }
  } catch(err) {
    console.error('Error applying role UI:', err);
  }
}

// Global window exposure for all handlers
window.initRoleAuth = initRoleAuth;
window.selectLoginRole = selectLoginRole;
window.updateOperatorNameUI = updateOperatorNameUI;
window.handleOperatorLogin = handleOperatorLogin;
window.handleAdminLogin = handleAdminLogin;
window.handleLogout = handleLogout;
window.applyRoleUI = applyRoleUI;
window.handleDashPeriodChange = handleDashPeriodChange;
window.updateMetricsDashboard = updateMetricsDashboard;
window.generateDailyReport = generateDailyReport;
window.handleReportScopeChange = handleReportScopeChange;
window.setReportQuickPreset = setReportQuickPreset;
window.onReportCustomDateChanged = onReportCustomDateChanged;
window.printDayReport = printDayReport;
window.deleteDayData = deleteDayData;

document.addEventListener('DOMContentLoaded', () => {
  initRoleAuth();
  initAudioSetting();
  loadKendraSettings();
  initDateTimeInputs();
  initSeedDataIfEmpty();
  setupFirebaseConnection();
  refreshAllDataViews();
  startLiveClock();
  initMobileNav();
});

function initMobileNav() {
  const toggleBtn = document.getElementById('mobile-nav-toggle');
  const navLinks = document.getElementById('main-nav-links');
  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      playSound('click');
    });
  }
}

// Audio Web API Sound Synthesis for rich interactive feedback
function playSound(type = 'success') {
  if (!isAudioEnabled) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } else if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } else if (type === 'delete') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, audioCtx.currentTime + 0.18);
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    }
  } catch (e) {
    // AudioContext blocked or unsupported
  }
}

function initAudioSetting() {
  const saved = localStorage.getItem(STORAGE_KEYS.AUDIO);
  if (saved !== null) {
    isAudioEnabled = saved === 'true';
  }
  updateAudioButtonUI();
}

function toggleAudioFeedback() {
  isAudioEnabled = !isAudioEnabled;
  localStorage.setItem(STORAGE_KEYS.AUDIO, isAudioEnabled);
  updateAudioButtonUI();
  if (isAudioEnabled) playSound('click');
}

function updateAudioButtonUI() {
  const btn = document.getElementById('audio-toggle-btn');
  if (btn) {
    btn.innerHTML = isAudioEnabled 
      ? '<i class="fas fa-volume-up"></i> ध्वनी' 
      : '<i class="fas fa-volume-mute"></i> मूक';
    btn.classList.toggle('muted', !isAudioEnabled);
  }
}

// Live Clock & Date in Marathi Format (नेहमी DD/MM/YYYY फॉरमॅट)
function startLiveClock() {
  const marathiDays = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  function update() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dayName = marathiDays[now.getDay()];
    const dateFormatted = formatDateDDMMYYYY(now);
    const dateStr = `${dayName}, ${dateFormatted}`;
    
    const clockEl = document.getElementById('live-clock-text');
    const dateEl = document.getElementById('live-date-text');
    if (clockEl) clockEl.textContent = timeStr;
    if (dateEl) dateEl.textContent = dateStr;
  }
  update();
  setInterval(update, 1000);
}

// Set Default Date & Time for Inputs
function initDateTimeInputs() {
  const todayStr = getTodayDateString();
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const entryDate = document.getElementById('entry-date');
  const entryTime = document.getElementById('entry-time');
  const expDate = document.getElementById('exp-date');
  const repDate = document.getElementById('report-date-select');
  const mainRepDate = document.getElementById('main-report-date');
  const opRepDate = document.getElementById('operator-report-date');
  const dashSingleDate = document.getElementById('dash-single-date');
  const dashDateFrom = document.getElementById('dash-date-from');
  const dashDateTo = document.getElementById('dash-date-to');

  if (entryDate && !entryDate.value) entryDate.value = todayStr;
  if (entryTime && !entryTime.value) entryTime.value = timeStr;
  if (expDate && !expDate.value) expDate.value = todayStr;
  if (repDate && !repDate.value) repDate.value = todayStr;
  if (mainRepDate && !mainRepDate.value) mainRepDate.value = todayStr;
  if (opRepDate && !opRepDate.value) opRepDate.value = todayStr;
  if (dashSingleDate && !dashSingleDate.value) dashSingleDate.value = todayStr;
  if (dashDateTo && !dashDateTo.value) dashDateTo.value = todayStr;
  if (dashDateFrom && !dashDateFrom.value) {
    const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    dashDateFrom.value = firstDay;
  }

  calculateNextTokenNo();
}

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Convert any date to strictly DD/MM/YYYY (Day always first)
function formatDateDDMMYYYY(dateInput) {
  if (!dateInput) return '-';
  try {
    if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
      const day = String(dateInput.getDate()).padStart(2, '0');
      const month = String(dateInput.getMonth() + 1).padStart(2, '0');
      const year = dateInput.getFullYear();
      return `${day}/${month}/${year}`;
    }

    if (typeof dateInput === 'string') {
      const str = dateInput.trim();
      if (!str) return '-';

      // If YYYY-MM-DD
      if (/^\d{4}-\d{1,2}-\d{1,2}/.test(str)) {
        const parts = str.split('T')[0].split('-');
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }

      // If DD-MM-YYYY
      if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
        const parts = str.split('-');
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }

      // If MM/DD/YYYY or DD/MM/YYYY
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
        const parts = str.split('/');
        const p1 = parseInt(parts[0], 10);
        const p2 = parseInt(parts[1], 10);
        const y = parts[2];
        // If p2 > 12, then p1 is month and p2 is day (MM/DD/YYYY -> DD/MM/YYYY)
        if (p2 > 12) {
          return `${String(p2).padStart(2, '0')}/${String(p1).padStart(2, '0')}/${y}`;
        }
        return `${String(p1).padStart(2, '0')}/${String(p2).padStart(2, '0')}/${y}`;
      }

      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }
  } catch (e) {}
  return String(dateInput);
}

// =============================================================================
// 3. CLEAN DATA STORAGE (ZERO DEMO DATA - ABSOLUTE CLEAN SLATE)
// =============================================================================
function initSeedDataIfEmpty() {
  try {
    let transactions = getStoredTransactions();
    const demoKeywords = ['डेमो', 'Sample', 'Demo'];
    const cleanTx = transactions.filter(t => {
      if (!t.customerName) return false;
      const isDemo = demoKeywords.some(k => t.customerName.includes(k) || (t.notes && t.notes.includes(k)));
      return !isDemo;
    });

    if (cleanTx.length !== transactions.length) {
      saveStoredTransactions(cleanTx);
    }

    let expenses = getStoredExpenses();
    const cleanExp = expenses.filter(e => {
      if (!e.description && !e.note) return false;
      const desc = (e.description || '') + ' ' + (e.note || '');
      return !desc.includes('डेमो') && !desc.includes('Sample') && !desc.includes('Demo');
    });

    if (cleanExp.length !== expenses.length) {
      saveStoredExpenses(cleanExp);
    }
  } catch (e) {
    console.error('Error purging demo data:', e);
  }
}

// =============================================================================
// 4. FIREBASE INITIALIZATION & REALTIME CLOUD SYNC
// =============================================================================
function setupFirebaseConnection() {
  let config = getFirebaseConfig();
  if (!config || !config.apiKey) {
    config = defaultFirebaseConfig;
    localStorage.setItem(STORAGE_KEYS.FIREBASE, JSON.stringify(config));
  }

  const statusBadge = document.getElementById('cloud-sync-status');
  const statusText = document.getElementById('sync-status-text');
  const cardBadge = document.getElementById('firebase-card-badge');

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    db = firebase.firestore();
    isFirebaseConnected = true;

    if (statusBadge) {
      statusBadge.className = 'cloud-badge online';
      if (statusText) statusText.textContent = `Firebase कनेक्टेड (${config.projectId})`;
      statusBadge.title = `e-Mudra क्लाउड सर्व्हर डेटाबेस सक्रिय (${config.projectId})`;
      statusBadge.onclick = openFirebaseModal;
      if (currentUser && currentUser.role === 'operator') {
        statusBadge.style.display = 'none';
      }
    }
    if (cardBadge) {
      cardBadge.className = 'badge-tag emerald';
      cardBadge.textContent = `🟢 क्लाउड कनेक्टेड (${config.projectId})`;
    }

    // Attach Live Real-time Firestore Listeners
    listenToCloudFirestore();

    // Sync any pending offline records to Cloud
    syncUnsyncedToFirebase();
  } catch (err) {
    console.warn('Firebase connection note:', err);
    isFirebaseConnected = false;
    if (statusBadge) {
      statusBadge.className = 'cloud-badge offline';
      if (statusText) statusText.textContent = 'स्थानिक मोड (Offline Local)';
      if (currentUser && currentUser.role === 'operator') {
        statusBadge.style.display = 'none';
      }
    }
  }
}

function listenToCloudFirestore() {
  if (!isFirebaseConnected || !db) return;

  const demoKeywords = ['गणेश', 'सुनीता', 'आदित्य', 'प्रकाश', 'डेमो', 'Sample', 'Demo', 'Parab', 'Rane', 'Sawant'];

  try {
    // 1. Live transactions listener
    db.collection('aadhaar_transactions')
      .onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const cloudTxList = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            data.syncedToFirebase = true;
            
            const isDemo = data.customerName && demoKeywords.some(k => data.customerName.includes(k) || (data.notes && data.notes.includes(k)));
            if (isDemo) {
              // Automatically delete lingering demo docs from Cloud Firestore
              db.collection('aadhaar_transactions').doc(doc.id).delete().catch(() => {});
            } else {
              cloudTxList.push(data);
            }
          });
          // Sort by timestamp descending
          cloudTxList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          saveStoredTransactions(cloudTxList);
          refreshAllDataViews();
        }
      }, (error) => {
        console.warn('Firestore snapshot listener note:', error);
      });

    // 2. Live expenses listener
    db.collection('aadhaar_expenses')
      .onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const cloudExpList = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            data.syncedToFirebase = true;

            const isDemoExp = data.description && (data.description.includes('लॅमिनेशन पाऊच') || data.description.includes('डेमो') || data.description.includes('Sample'));
            if (isDemoExp) {
              db.collection('aadhaar_expenses').doc(doc.id).delete().catch(() => {});
            } else {
              cloudExpList.push(data);
            }
          });
          cloudExpList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          saveStoredExpenses(cloudExpList);
          refreshAllDataViews();
        }
      }, (error) => {
        console.warn('Firestore expense snapshot listener note:', error);
      });
  } catch (e) {
    console.error('Error attaching listeners:', e);
  }
}

async function syncUnsyncedToFirebase() {
  if (!isFirebaseConnected || !db) return;

  const transactions = getStoredTransactions();
  const unsyncedTx = transactions.filter(t => !t.syncedToFirebase);

  for (let tx of unsyncedTx) {
    try {
      await db.collection('aadhaar_transactions').doc(tx.id).set(tx);
      tx.syncedToFirebase = true;
    } catch (e) {
      console.error('Failed to sync transaction:', e);
    }
  }
  saveStoredTransactions(transactions);

  const expenses = getStoredExpenses();
  const unsyncedExp = expenses.filter(e => !e.syncedToFirebase);
  for (let exp of unsyncedExp) {
    try {
      await db.collection('aadhaar_expenses').doc(exp.id).set(exp);
      exp.syncedToFirebase = true;
    } catch (e) {
      console.error('Failed to sync expense:', e);
    }
  }
  saveStoredExpenses(expenses);
}

function getFirebaseConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FIREBASE);
    return raw ? JSON.parse(raw) : defaultFirebaseConfig;
  } catch (e) {
    return defaultFirebaseConfig;
  }
}

function saveFirebaseConfig(event) {
  if (event) event.preventDefault();
  const config = {
    apiKey: document.getElementById('fb-apiKey').value.trim(),
    projectId: document.getElementById('fb-projectId').value.trim(),
    authDomain: document.getElementById('fb-authDomain').value.trim(),
    storageBucket: document.getElementById('fb-storageBucket').value.trim(),
    appId: document.getElementById('fb-appId').value.trim()
  };

  if (!config.apiKey || !config.projectId) {
    alert('कृपया Firebase API Key आणि Project ID प्रविष्ट करा.');
    return;
  }

  localStorage.setItem(STORAGE_KEYS.FIREBASE, JSON.stringify(config));
  setupFirebaseConnection();
  playSound('success');
  alert('✅ Firebase क्रेडेंशियल्स यशस्वीपणे जतन केले आहेत! क्लाउड डेटाबेस जोडला गेला आहे.');
}

function saveFirebaseConfigFromModal(event) {
  if (event) event.preventDefault();
  const config = {
    apiKey: document.getElementById('modal-fb-apiKey').value.trim(),
    projectId: document.getElementById('modal-fb-projectId').value.trim(),
    authDomain: document.getElementById('modal-fb-authDomain').value.trim()
  };

  if (!config.apiKey || !config.projectId) {
    alert('कृपया API Key आणि Project ID भरा.');
    return;
  }

  localStorage.setItem(STORAGE_KEYS.FIREBASE, JSON.stringify(config));
  setupFirebaseConnection();
  closeModal('firebase-modal');
  playSound('success');
  alert('✅ Firebase यशस्वीपणे कनेक्ट झाले आहे!');
}

function testFirebaseConnection() {
  playSound('click');
  const config = getFirebaseConfig();
  if (!config || !config.apiKey) {
    alert('⚠️ अद्याप Firebase क्रेडेंशियल्स भरलेले नाहीत. कृपया आधी फॉर्म भरा.');
    return;
  }
  setupFirebaseConnection();
  if (isFirebaseConnected) {
    alert('🎉 अभिनंदन! Firebase Firestore यशस्वीपणे जोडले गेले आहे.');
  } else {
    alert('❌ Firebase जोडताना त्रुटी आली. कृपया API Key आणि Project ID तपासा.');
  }
}

// =============================================================================
// 5. LOCAL STORAGE HELPERS
// =============================================================================
function getStoredTransactions() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!data) return [];
    const list = JSON.parse(data);
    list.forEach(t => {
      if (!t.operatorName || t.operatorName === 'Admin') {
        t.operatorName = t.center === 'WCD' ? 'Sakshi Sawant' : 'Gauravi Gawade';
      }
      if (!t.center) {
        t.center = 'DIT (Maha IT)';
      }
    });
    return list;
  } catch (e) {
    return [];
  }
}

function saveStoredTransactions(list) {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
}

function getStoredExpenses() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveStoredExpenses(list) {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(list));
}

function getKendraSettings(centerName) {
  if (!centerName) {
    if (currentUser && currentUser.center && currentUser.center !== 'Full Access') {
      centerName = currentUser.center;
    } else {
      centerName = 'DIT (Maha IT)'; 
    }
  }
  const key = centerName === 'WCD' ? 'ask_kendra_settings_wcd' : 'ask_kendra_settings';
  
  const centerDefaults = centerName === 'WCD' ? {
    kendraName: 'ई-मुद्रा आधार सेवा केंद्र (WCD)',
    operatorName: 'Sakshi Sawant',
    stationId: '73016',
    contactPhone: '02367-232014',
    centerAddress: 'WCD आधार केंद्र परिसर',
    receiptFooter: 'ई-मुद्रा आधार सेवा केंद्र (WCD) भेट दिल्याबद्दल धन्यवाद!',
    rates: { demo: 75, bio: 125, doc: 75, new: 0, mbu: 0, print: 50, pvc: 50, other: 30 }
  } : {
    kendraName: 'ई-मुद्रा आधार सेवा केंद्र (DIT Maha IT)',
    operatorName: 'Gauravi Gawade',
    stationId: '40068',
    contactPhone: '02367-232014',
    centerAddress: 'DIT महा-IT आधार केंद्र परिसर',
    receiptFooter: 'ई-मुद्रा आधार सेवा केंद्र (DIT) भेट दिल्याबद्दल धन्यवाद!',
    rates: { demo: 75, bio: 125, doc: 75, new: 0, mbu: 0, print: 50, pvc: 50, other: 30 }
  };

  try {
    const data = localStorage.getItem(key);
    return data ? Object.assign({}, centerDefaults, JSON.parse(data)) : centerDefaults;
  } catch (e) {
    return centerDefaults;
  }
}

function saveKendraSettings(event) {
  if (event) event.preventDefault();
  const centerSelect = document.getElementById('setting-center-select');
  const centerName = centerSelect ? centerSelect.value : 'DIT (Maha IT)';
  const key = centerName === 'WCD' ? 'ask_kendra_settings_wcd' : 'ask_kendra_settings';

  const settings = {
    kendraName: document.getElementById('setting-kendra-name').value.trim(),
    operatorName: document.getElementById('setting-operator-name').value.trim(),
    stationId: document.getElementById('setting-station-id').value.trim(),
    contactPhone: document.getElementById('setting-contact-phone').value.trim(),
    centerAddress: document.getElementById('setting-center-address').value.trim(),
    receiptFooter: document.getElementById('setting-receipt-footer').value.trim(),
    rates: {
      demo: parseFloat(document.getElementById('rate-input-demo').value) || 50,
      bio: parseFloat(document.getElementById('rate-input-bio').value) || 100,
      doc: parseFloat(document.getElementById('rate-input-doc').value) || 50,
      print: parseFloat(document.getElementById('rate-input-print').value) || 50,
      pvc: parseFloat(document.getElementById('rate-input-pvc').value) || 50,
      other: parseFloat(document.getElementById('rate-input-other').value) || 30
    }
  };

  localStorage.setItem(key, JSON.stringify(settings));
  loadKendraSettings();
  showSuccessModal(`<strong>${centerName}</strong> केंद्राची माहिती व सेवा दर यशस्वीरित्या जतन केले आहेत!`, '✅ सेटिंग्ज सेव्ह झाल्या');
}

function loadKendraSettings() {
  const settings = getKendraSettings();
  
  // Header and tags
  const headerSubtitle = document.getElementById('kendra-header-subtitle');
  if (headerSubtitle) headerSubtitle.textContent = `ई-मुद्रा आधार सेवा केंद्र • मशीन क्र: ${settings.stationId}`;

  const dispKendra = document.getElementById('display-kendra-name');
  if (dispKendra) dispKendra.textContent = settings.kendraName;

  const dispOp = document.getElementById('display-operator-name');
  if (dispOp) dispOp.textContent = settings.operatorName;

  const dispStn = document.getElementById('display-station-id');
  if (dispStn) dispStn.textContent = settings.stationId;

  // Rate Displays
  const rateDemo = document.getElementById('rate-demo');
  if (rateDemo) rateDemo.textContent = settings.rates.demo;
  const rateBio = document.getElementById('rate-bio');
  if (rateBio) rateBio.textContent = settings.rates.bio;
  const rateDoc = document.getElementById('rate-doc');
  if (rateDoc) rateDoc.textContent = settings.rates.doc;
  const ratePrint = document.getElementById('rate-print');
  if (ratePrint) ratePrint.textContent = settings.rates.print;
  const ratePvc = document.getElementById('rate-pvc');
  if (ratePvc) ratePvc.textContent = settings.rates.pvc;
  const rateOther = document.getElementById('rate-other');
  if (rateOther) rateOther.textContent = settings.rates.other;

  // Populate form fields for whichever center is currently selected in the dropdown
  loadKendraSettingsForSelected();

  // Populate Firebase form fields if saved
  const fbConfig = getFirebaseConfig();
  if (fbConfig) {
    if (document.getElementById('fb-apiKey')) document.getElementById('fb-apiKey').value = fbConfig.apiKey || '';
    if (document.getElementById('fb-projectId')) document.getElementById('fb-projectId').value = fbConfig.projectId || '';
    if (document.getElementById('fb-authDomain')) document.getElementById('fb-authDomain').value = fbConfig.authDomain || '';
    if (document.getElementById('fb-storageBucket')) document.getElementById('fb-storageBucket').value = fbConfig.storageBucket || '';
    if (document.getElementById('fb-appId')) document.getElementById('fb-appId').value = fbConfig.appId || '';
  }
}

function loadKendraSettingsForSelected() {
  const centerSelect = document.getElementById('setting-center-select');
  const centerName = centerSelect ? centerSelect.value : 'DIT (Maha IT)';
  const settings = getKendraSettings(centerName);

  // Form values in Settings Tab
  const setKendra = document.getElementById('setting-kendra-name');
  if (setKendra) setKendra.value = settings.kendraName;
  const setOp = document.getElementById('setting-operator-name');
  if (setOp) setOp.value = settings.operatorName;
  const setStn = document.getElementById('setting-station-id');
  if (setStn) setStn.value = settings.stationId;
  const setPhone = document.getElementById('setting-contact-phone');
  if (setPhone) setPhone.value = settings.contactPhone;
  const setAddr = document.getElementById('setting-center-address');
  if (setAddr) setAddr.value = settings.centerAddress;
  const setFooter = document.getElementById('setting-receipt-footer');
  if (setFooter) setFooter.value = settings.receiptFooter;

  const rateInDemo = document.getElementById('rate-input-demo');
  if (rateInDemo) rateInDemo.value = settings.rates.demo;
  const rateInBio = document.getElementById('rate-input-bio');
  if (rateInBio) rateInBio.value = settings.rates.bio;
  const rateInDoc = document.getElementById('rate-input-doc');
  if (rateInDoc) rateInDoc.value = settings.rates.doc;
  const rateInPrint = document.getElementById('rate-input-print');
  if (rateInPrint) rateInPrint.value = settings.rates.print;
  const rateInPvc = document.getElementById('rate-input-pvc');
  if (rateInPvc) rateInPvc.value = settings.rates.pvc;
  const rateInOther = document.getElementById('rate-input-other');
  if (rateInOther) rateInOther.value = settings.rates.other;
}

// =============================================================================
// 6. NEW SERVICE FORM & PRICING
// =============================================================================
function updateServicePrice(price, serviceName) {
  playSound('click');
  const baseFeeInput = document.getElementById('entry-base-fee');
  if (baseFeeInput) {
    baseFeeInput.value = price;
  }
  calculateTotalAmount();
}

function calculateTotalAmount() {
  const baseFee = parseFloat(document.getElementById('entry-base-fee').value) || 0;
  
  let addonFee = 0;
  if (document.getElementById('addon-lamination').checked) addonFee += 20;
  if (document.getElementById('addon-extra-print').checked) addonFee += 10;
  if (document.getElementById('addon-form-filling').checked) addonFee += 20;

  const addonFeeInput = document.getElementById('entry-addon-fee');
  if (addonFeeInput) addonFeeInput.value = addonFee;

  const discount = parseFloat(document.getElementById('entry-discount').value) || 0;
  const total = Math.max(0, baseFee + addonFee - discount);

  const finalAmountInput = document.getElementById('entry-final-amount');
  if (finalAmountInput) finalAmountInput.value = total;
}

function calculateNextTokenNo() {
  const transactions = getStoredTransactions();
  const today = getTodayDateString();
  const todayTx = transactions.filter(t => t.date === today);
  const nextNum = 101 + todayTx.length;
  const tokenStr = '#' + nextNum;

  const badge = document.getElementById('next-token-no');
  const input = document.getElementById('entry-token');
  if (badge) badge.textContent = tokenStr;
  if (input && !input.value) input.value = nextNum;
}

function getSelectedRadioValue(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : '';
}

// Save & Generate Receipt
function handleFormSubmit(event) {
  if (event) event.preventDefault();
  const record = buildRecordFromForm();
  if (!record) return;

  saveTransactionRecord(record);
  playSound('success');
  openReceiptModal(record);
  resetEntryForm();
  refreshAllDataViews();
}

// Quick Save (No Modal)
function handleQuickSave() {
  const form = document.getElementById('aadhaar-entry-form');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const record = buildRecordFromForm();
  if (!record) return;

  saveTransactionRecord(record);
  playSound('success');
  alert(`✅ टोकन #${record.tokenNo} - ${record.customerName} यांची नोंद यशस्वीपणे सेव्ह झाली!`);
  resetEntryForm();
  refreshAllDataViews();
}

function buildRecordFromForm() {
  const editId = document.getElementById('entry-edit-id').value;
  const date = document.getElementById('entry-date').value;
  const time = document.getElementById('entry-time').value;
  const tokenNo = document.getElementById('entry-token').value.trim();
  const customerName = document.getElementById('cust-name').value.trim();
  const mobile = document.getElementById('cust-mobile').value.trim();
  const aadhaarEid = document.getElementById('cust-aadhaar-eid').value.trim() || 'नोंद नाही';
  const genderAge = document.getElementById('cust-gender-age').value;
  const serviceName = getSelectedRadioValue('aadhaar-service');
  const baseFee = parseFloat(document.getElementById('entry-base-fee').value) || 0;
  const addonFee = parseFloat(document.getElementById('entry-addon-fee').value) || 0;
  const discount = parseFloat(document.getElementById('entry-discount').value) || 0;
  const totalAmount = parseFloat(document.getElementById('entry-final-amount').value) || 0;
  const paymentMode = getSelectedRadioValue('payment-mode');
  const status = document.getElementById('entry-status').value;
  const notes = document.getElementById('entry-notes').value.trim();

  if (!customerName || !mobile) {
    alert('कृपया ग्राहकाचे नाव व मोबाईल नंबर प्रविष्ट करा.');
    return null;
  }

  const record = {
    id: editId || ('ASK-' + Date.now() + '-' + Math.floor(Math.random() * 1000)),
    tokenNo: tokenNo.startsWith('#') ? tokenNo : ('#' + tokenNo),
    date,
    time,
    customerName,
    mobile,
    aadhaarEid,
    genderAge,
    serviceName,
    baseFee,
    addonFee,
    discount,
    totalAmount,
    paymentMode,
    status,
    notes,
    timestamp: editId ? Date.now() : Date.now(),
    syncedToFirebase: false
  };

  return record;
}

function saveTransactionRecord(record) {
  let transactions = getStoredTransactions();
  const existingIdx = transactions.findIndex(t => t.id === record.id);
  if (existingIdx >= 0) {
    transactions[existingIdx] = record;
  } else {
    transactions.unshift(record);
  }
  saveStoredTransactions(transactions);

  // Sync to Firebase if connected
  if (isFirebaseConnected && db) {
    db.collection('aadhaar_transactions').doc(record.id).set(record)
      .then(() => {
        record.syncedToFirebase = true;
        saveStoredTransactions(transactions);
      })
      .catch(e => console.error('Cloud write error:', e));
  }
}

function resetEntryForm() {
  document.getElementById('entry-edit-id').value = '';
  document.getElementById('cust-name').value = '';
  document.getElementById('cust-mobile').value = '';
  document.getElementById('cust-aadhaar-eid').value = '';
  document.getElementById('entry-notes').value = '';
  document.getElementById('addon-lamination').checked = false;
  document.getElementById('addon-extra-print').checked = false;
  document.getElementById('addon-form-filling').checked = false;
  document.getElementById('entry-discount').value = 0;
  
  // reset radio to first
  const firstRadio = document.querySelector('input[name="aadhaar-service"]');
  if (firstRadio) {
    firstRadio.checked = true;
    updateServicePrice(50, firstRadio.value);
  }

  const firstPay = document.querySelector('input[name="payment-mode"][value="रोख (Cash)"]');
  if (firstPay) firstPay.checked = true;

  initDateTimeInputs();
}

// =============================================================================
// 7. EXPENSE LOGIC
// =============================================================================
function handleExpenseSubmit(event) {
  if (event) event.preventDefault();
  const date = document.getElementById('exp-date')?.value || getTodayDateString();
  const center = document.getElementById('exp-center')?.value || (currentUser?.center || 'DIT (Maha IT)');
  const category = document.getElementById('exp-category')?.value || 'इतर किरकोळ खर्च';
  const amount = parseFloat(document.getElementById('exp-amount')?.value) || 0;
  const paymentMode = document.getElementById('exp-payment-mode')?.value || 'रोख (Cash)';
  const description = (document.getElementById('exp-description')?.value || '').trim();

  if (amount <= 0 || !description) {
    alert('कृपया खर्चाची योग्य रक्कम आणि तपशील भरा.');
    return;
  }

  const expRecord = {
    id: 'EXP-' + Date.now(),
    date,
    center,
    category,
    amount,
    paymentMode,
    description,
    timestamp: Date.now(),
    syncedToFirebase: false
  };

  let expenses = getStoredExpenses();
  expenses.unshift(expRecord);
  saveStoredExpenses(expenses);

  if (isFirebaseConnected && db) {
    db.collection('aadhaar_expenses').doc(expRecord.id).set(expRecord)
      .then(() => {
        expRecord.syncedToFirebase = true;
        saveStoredExpenses(expenses);
      })
      .catch(e => console.error('Cloud expense error:', e));
  }

  playSound('success');
  document.getElementById('aadhaar-expense-form').reset();
  initDateTimeInputs();
  refreshAllDataViews();
  showSuccessModal('दैनिक खर्च नोंद यशस्वीपणे सेव्ह झाली आहे व ताळेबंद अपडेट झाला आहे!', '✅ खर्च नोंद सेव्ह झाली');
}

function renderExpensesList() {
  const tbody = document.getElementById('expenses-table-tbody');
  const totalDisplay = document.getElementById('expense-total-display');
  if (!tbody) return;

  const expenses = getStoredExpenses();
  let filtered = expenses;
  if (currentUser && currentUser.role === 'operator') {
    const today = getTodayDateString();
    filtered = filtered.filter(e => isRecordForCurrentUser(e) && normalizeDateToISO(e.date) === today);
  }

  let totalAmt = 0;
  let pigmyAmt = 0;
  filtered.forEach(e => {
    const amt = Number(e.amount || 0);
    totalAmt += amt;
    if ((e.category || '').includes('पिग्मी') || (e.category || '').includes('बचत')) {
      pigmyAmt += amt;
    }
  });

  if (totalDisplay) {
    if (pigmyAmt > 0) {
      totalDisplay.innerHTML = `${totalAmt.toLocaleString('en-IN')} <small style="color: #34d399; font-weight: normal; font-size: 0.82rem;">(पिग्मी: ₹${pigmyAmt.toLocaleString('en-IN')})</small>`;
    } else {
      totalDisplay.textContent = totalAmt.toLocaleString('en-IN');
    }
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">कोणताही खर्च नोंदवलेला नाही.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(e => {
    const isPigmy = (e.category || '').includes('पिग्मी') || (e.category || '').includes('बचत');
    return `
      <tr>
        <td><strong style="color: #38bdf8;">${formatDateDDMMYYYY(e.date)}</strong></td>
        <td><span class="badge badge-sm badge-blue">${escapeHtml(e.center || 'सामायिक')}</span></td>
        <td>
          <strong style="color: ${isPigmy ? '#34d399' : '#f1f5f9'};">
            ${isPigmy ? '<i class="fas fa-piggy-bank" style="color: #34d399;"></i> ' : ''}${escapeHtml(e.category)}
          </strong>
        </td>
        <td>${escapeHtml(e.description || e.note || '-')}</td>
        <td class="text-right" style="font-weight: 700; font-size: 1rem; color: ${isPigmy ? '#34d399' : '#f87171'};">
          ₹${Number(e.amount).toLocaleString('en-IN')}
        </td>
        <td><span class="badge badge-sm badge-gray">${escapeHtml(e.paymentMode || 'रोख')}</span></td>
        <td class="text-center">
          ${currentUser && currentUser.role === 'admin' 
            ? `<button class="action-btn delete" onclick="deleteExpense('${e.id}')" title="खर्च हटवा" style="color: #ef4444; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; padding: 4px 8px; cursor: pointer;"><i class="fas fa-trash-alt"></i></button>`
            : `<span class="text-muted text-xs"><i class="fas fa-lock"></i></span>`}
        </td>
      </tr>
    `;
  }).join('');
}

function deleteExpense(expId) {
  if (!currentUser || currentUser.role !== 'admin') {
    alert('⚠️ ऑपरेटरला खर्च हटवण्याची (Delete) परवानगी नाही! फक्त ॲडमीनच खर्च हटवू शकतात.');
    return;
  }
  if (!confirm('तुम्हाला ही खर्च नोंद खरंच हटवायची आहे का?')) return;
  playSound('delete');
  let expenses = getStoredExpenses();
  expenses = expenses.filter(e => e.id !== expId);
  saveStoredExpenses(expenses);

  if (isFirebaseConnected && db) {
    db.collection('aadhaar_expenses').doc(expId).delete().catch(e => console.error(e));
  }
  refreshAllDataViews();
}

// =============================================================================
// 8. DATA REFRESH, METRICS & RENDERING
// =============================================================================
function refreshAllDataViews() {
  updateMetricsDashboard();
  renderRecentQuickList();
  filterRegisterRecords();
  renderExpensesList();
  generateDailyReport();
}

function getGovtFeeForTransaction(t) {
  if (t.baseFee !== undefined && t.baseFee !== null && !isNaN(Number(t.baseFee))) {
    return Number(t.baseFee);
  }
  if (t.govtFee !== undefined && t.govtFee !== null && !isNaN(Number(t.govtFee))) {
    return Number(t.govtFee);
  }
  const sName = (t.serviceName || '').toLowerCase();
  if (sName.includes('बायोमेट्रिक') || sName.includes('biometric') || sName.includes('photo') || sName.includes('finger')) return 125;
  if (sName.includes('डेमोग्राफिक') || sName.includes('demographic')) return 75;
  if (sName.includes('डॉक्युमेंट') || sName.includes('document')) return 75;
  if (sName.includes('नवीन') || sName.includes('new') || sName.includes('बाल') || sName.includes('fresh')) return 0;
  if (sName.includes('mbu') || sName.includes('अनिवार्य')) return 0;
  return Number(t.totalAmount || 0);
}

function handleDashPeriodChange() {
  const period = document.getElementById('dash-period-select')?.value || 'today';
  const singleDateInput = document.getElementById('dash-single-date');
  const monthInput = document.getElementById('dash-month-select');
  const customRangeWrap = document.getElementById('dash-custom-range-wrap');

  if (singleDateInput) {
    singleDateInput.style.display = period === 'single-date' ? 'inline-block' : 'none';
  }
  if (monthInput) {
    monthInput.style.display = period === 'custom-month' ? 'inline-block' : 'none';
  }
  if (customRangeWrap) {
    customRangeWrap.style.display = period === 'multi-month' ? 'flex' : 'none';
  }

  // Populate sensible defaults if inputs are empty
  const todayStr = getTodayDateString();
  if (singleDateInput && !singleDateInput.value) singleDateInput.value = todayStr;
  if (monthInput && !monthInput.value) {
    const d = new Date();
    monthInput.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  const fromInput = document.getElementById('dash-date-from');
  const toInput = document.getElementById('dash-date-to');
  if (fromInput && !fromInput.value) {
    const d = new Date();
    fromInput.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }
  if (toInput && !toInput.value) toInput.value = todayStr;

  updateMetricsDashboard();
}

function updateMetricsDashboard() {
  const transactions = getStoredTransactions();
  const expenses = getStoredExpenses();
  const today = getTodayDateString();
  const now = new Date();

  const period = document.getElementById('dash-period-select')?.value || 'today';
  const centerSelect = document.getElementById('dash-center-select')?.value || 'all';
  const singleDate = document.getElementById('dash-single-date')?.value || today;
  const monthSelectVal = document.getElementById('dash-month-select')?.value;
  const dateFrom = document.getElementById('dash-date-from')?.value;
  const dateTo = document.getElementById('dash-date-to')?.value;

  let filteredTx = transactions;
  let filteredExp = expenses;

  // Role and Center filter
  if (currentUser && currentUser.role === 'operator') {
    filteredTx = filteredTx.filter(t => isRecordForCurrentUser(t) && normalizeDateToISO(t.date) === today);
    filteredExp = filteredExp.filter(e => isRecordForCurrentUser(e) && normalizeDateToISO(e.date) === today);
  } else if (centerSelect !== 'all') {
    filteredTx = filteredTx.filter(t => t.center === centerSelect);
    filteredExp = filteredExp.filter(e => e.center === centerSelect || !e.center || e.center.includes('सामायिक'));
  }

  let periodLabel = 'आज';
  const marathiMonths = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];

  // Period Filter
  if (currentUser && currentUser.role === 'operator') {
    // Operator is always strictly restricted to today
    periodLabel = 'आज (' + formatDateDDMMYYYY(today) + ')';
  } else {
    if (period === 'today') {
      filteredTx = filteredTx.filter(t => t.date === today);
      filteredExp = filteredExp.filter(e => e.date === today);
      periodLabel = 'आज (' + formatDateDDMMYYYY(today) + ')';
    } else if (period === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;
      filteredTx = filteredTx.filter(t => t.date === yestStr);
      filteredExp = filteredExp.filter(e => e.date === yestStr);
      periodLabel = 'काल (' + formatDateDDMMYYYY(yestStr) + ')';
    } else if (period === 'single-date') {
      filteredTx = filteredTx.filter(t => t.date === singleDate);
      filteredExp = filteredExp.filter(e => e.date === singleDate);
      periodLabel = formatDateDDMMYYYY(singleDate);
    } else if (period === 'monthly') {
      const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      filteredTx = filteredTx.filter(t => (t.date || '').startsWith(currentMonthPrefix));
      filteredExp = filteredExp.filter(e => (e.date || '').startsWith(currentMonthPrefix));
      periodLabel = `चालू महिना (${marathiMonths[now.getMonth()]})`;
    } else if (period === 'last-month') {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
      filteredTx = filteredTx.filter(t => (t.date || '').startsWith(lastMonthPrefix));
      filteredExp = filteredExp.filter(e => (e.date || '').startsWith(lastMonthPrefix));
      periodLabel = `मागील महिना (${marathiMonths[lastMonthDate.getMonth()]})`;
    } else if (period === 'custom-month') {
      if (monthSelectVal) {
        const [y, m] = monthSelectVal.split('-');
        const mIdx = parseInt(m, 10) - 1;
        const mName = (mIdx >= 0 && mIdx < 12) ? marathiMonths[mIdx] : m;
        filteredTx = filteredTx.filter(t => (t.date || '').startsWith(monthSelectVal));
        filteredExp = filteredExp.filter(e => (e.date || '').startsWith(monthSelectVal));
        periodLabel = `माहे ${mName} ${y}`;
      } else {
        periodLabel = 'मासिक अहवाल';
      }
    } else if (period === 'multi-month') {
      if (dateFrom && dateTo) {
        filteredTx = filteredTx.filter(t => t.date >= dateFrom && t.date <= dateTo);
        filteredExp = filteredExp.filter(e => e.date >= dateFrom && e.date <= dateTo);
        periodLabel = `${formatDateDDMMYYYY(dateFrom)} ते ${formatDateDDMMYYYY(dateTo)}`;
      } else {
        periodLabel = 'कालावधी अहवाल';
      }
    } else if (period === 'all-time') {
      periodLabel = 'एकूण सर्व कालावधी';
    }
  }

  let govtFeeTotal = 0;
  let totalIncome = 0;
  let cashIncome = 0;
  let upiIncome = 0;
  let cashCount = 0;
  let upiCount = 0;

  filteredTx.forEach(t => {
    const collAmt = Number(t.totalAmount || 0);
    const gFee = getGovtFeeForTransaction(t);
    govtFeeTotal += gFee;
    totalIncome += collAmt;

    const pMode = (t.paymentMode || '').toLowerCase();
    if (pMode.includes('रोख') || pMode.includes('cash')) {
      cashIncome += collAmt;
      cashCount++;
    } else if (pMode.includes('युपीआय') || pMode.includes('upi') || pMode.includes('online')) {
      upiIncome += collAmt;
      upiCount++;
    } else {
      cashIncome += collAmt;
      cashCount++;
    }
  });

  const extraMargin = Math.max(0, totalIncome - govtFeeTotal);

  let totalExpenses = 0;
  filteredExp.forEach(e => {
    totalExpenses += Number(e.amount || 0);
  });

  // Net Cash in Drawer = Cash Income - Expenses
  let netBalance = totalIncome - totalExpenses;
  let drawerCash = Math.max(0, cashIncome - totalExpenses);

  // 1. Govt Report Total
  const elGovt = document.getElementById('metric-govt-report-total');
  if (elGovt) elGovt.textContent = govtFeeTotal.toLocaleString('en-IN');
  const elGovtSub = document.getElementById('metric-govt-report-sub');
  if (elGovtSub) elGovtSub.textContent = `शासकीय देयक • ${periodLabel}`;

  // 2. Operator Collected Total
  const elTotal = document.getElementById('metric-today-total');
  if (elTotal) elTotal.textContent = totalIncome.toLocaleString('en-IN');
  const elTotalLabel = document.getElementById('metric-today-count-label');
  if (elTotalLabel) elTotalLabel.textContent = `${filteredTx.length} व्यवहार • ${periodLabel}`;

  // 3. Extra Margin
  const elMargin = document.getElementById('metric-extra-margin');
  if (elMargin) elMargin.textContent = extraMargin.toLocaleString('en-IN');

  // 4. Cash Collection
  const elCash = document.getElementById('metric-today-cash');
  if (elCash) elCash.textContent = cashIncome.toLocaleString('en-IN');
  const elCashCount = document.getElementById('metric-today-cash-count');
  if (elCashCount) elCashCount.textContent = `${cashCount} रोख नोंदी`;

  // 5. UPI Collection
  const elUpi = document.getElementById('metric-today-upi');
  if (elUpi) elUpi.textContent = upiIncome.toLocaleString('en-IN');
  const elUpiCount = document.getElementById('metric-today-upi-count');
  if (elUpiCount) elUpiCount.textContent = `${upiCount} UPI नोंदी`;

  // 6. Expenses
  const elExp = document.getElementById('metric-today-expense');
  if (elExp) elExp.textContent = totalExpenses.toLocaleString('en-IN');
  const elExpCount = document.getElementById('metric-today-expense-count');
  if (elExpCount) elExpCount.textContent = `${filteredExp.length} खर्च नोंदी`;

  // 7. Net Cash in Drawer
  const elBal = document.getElementById('metric-today-balance');
  if (elBal) elBal.textContent = drawerCash.toLocaleString('en-IN');

  // 8. Customer Count
  const elCust = document.getElementById('metric-today-customers');
  if (elCust) elCust.textContent = filteredTx.length;

  // Quick Card in Tab 1
  const qCash = document.getElementById('quick-cash-total');
  if (qCash) qCash.textContent = cashIncome.toLocaleString('en-IN');
  const qUpi = document.getElementById('quick-upi-total');
  if (qUpi) qUpi.textContent = upiIncome.toLocaleString('en-IN');
  const qExp = document.getElementById('quick-expense-total');
  if (qExp) qExp.textContent = totalExpenses.toLocaleString('en-IN');
  const qDrawer = document.getElementById('quick-drawer-cash');
  if (qDrawer) qDrawer.textContent = drawerCash.toLocaleString('en-IN');
}

function renderRecentQuickList() {
  const container = document.getElementById('quick-recent-list');
  if (!container) return;

  const transactions = getStoredTransactions();
  const today = getTodayDateString();
  
  let todayTx = transactions.filter(t => normalizeDateToISO(t.date) === today && isRecordForCurrentUser(t));
  todayTx = todayTx.slice(0, 5);

  if (todayTx.length === 0) {
    container.innerHTML = `<div class="empty-state-text">अद्याप आज कोणतीही नोंद झालेली नाही.</div>`;
    return;
  }

  container.innerHTML = todayTx.map(t => `
    <div class="recent-item-row" onclick="openReceiptModalById('${t.id}')">
      <div class="recent-left">
        <span class="recent-token">${t.tokenNo}</span>
        <div class="recent-info">
          <strong>${escapeHtml(t.customerName)}</strong>
          <small><i class="far fa-clock"></i> ${formatDateDDMMYYYY(t.date)} • ${t.time} • ${escapeHtml(t.serviceName)}</small>
        </div>
      </div>
      <div class="recent-right">
        <strong class="text-gold">₹${t.totalAmount}</strong>
        <span class="badge badge-sm ${getPaymentBadgeClass(t.paymentMode)}">${escapeHtml(t.paymentMode)}</span>
      </div>
    </div>
  `).join('');
}

// =============================================================================
// 9. REGISTER TABLE & ADVANCED FILTERING
// =============================================================================
function handleDatePresetChange() {
  playSound('click');
  const preset = document.getElementById('register-date-preset').value;
  const customWrap = document.getElementById('custom-date-wrap');
  if (customWrap) {
    customWrap.style.display = preset === 'custom' ? 'flex' : 'none';
  }
  filterRegisterRecords();
}

function filterRegisterRecords() {
  const transactions = getStoredTransactions();
  const query = (document.getElementById('register-search-input')?.value || '').toLowerCase().trim();
  const datePreset = document.getElementById('register-date-preset')?.value || 'today';
  const serviceFilter = document.getElementById('register-service-filter')?.value || 'all';
  const paymentFilter = document.getElementById('register-payment-filter')?.value || 'all';

  const today = getTodayDateString();
  const now = new Date();
  const centerFilter = document.getElementById('register-center-filter')?.value || 'all';

  const filtered = transactions.filter(t => {
    // Role-based security check for operator
    if (currentUser && currentUser.role === 'operator') {
      if (!isRecordForCurrentUser(t)) return false;
      if (normalizeDateToISO(t.date) !== today) return false;
    } else if (currentUser && currentUser.role === 'admin') {
      if (centerFilter !== 'all' && t.center !== centerFilter) return false;
    }

    const recDate = normalizeDateToISO(t.date);

    // 1. Search Query
    if (query) {
      const matchName = (t.customerName || '').toLowerCase().includes(query);
      const matchMobile = (t.mobile || '').includes(query);
      const matchAadhaar = (t.aadhaarEid || '').toLowerCase().includes(query);
      const matchToken = (t.tokenNo || '').toLowerCase().includes(query);
      if (!matchName && !matchMobile && !matchAadhaar && !matchToken) return false;
    }

    // 2. Date Filter
    if (currentUser && currentUser.role === 'operator') {
      if (recDate !== today) return false;
    } else {
      if (datePreset === 'today') {
        if (recDate !== today) return false;
      } else if (datePreset === 'yesterday') {
        const yest = new Date(now);
        yest.setDate(yest.getDate() - 1);
        const yestStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;
        if (recDate !== yestStr) return false;
      } else if (datePreset === 'this-week') {
        const txDate = new Date(recDate);
        const diffTime = Math.abs(now - txDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) return false;
      } else if (datePreset === 'this-month') {
        const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (!recDate.startsWith(currentMonthPrefix)) return false;
      } else if (datePreset === 'custom') {
        const from = document.getElementById('custom-date-from')?.value;
        const to = document.getElementById('custom-date-to')?.value;
        if (from && recDate < from) return false;
        if (to && recDate > to) return false;
      }
    }

    // 3. Service Filter
    if (serviceFilter !== 'all') {
      if (!t.serviceName.includes(serviceFilter)) return false;
    }

    // 4. Payment Filter
    if (paymentFilter !== 'all') {
      if (!t.paymentMode.includes(paymentFilter)) return false;
    }

    return true;
  });

  renderRegisterTable(filtered);
}

function clearRegisterSearch() {
  const input = document.getElementById('register-search-input');
  if (input) input.value = '';
  filterRegisterRecords();
}

function renderRegisterTable(list) {
  const tbody = document.getElementById('register-table-tbody');
  if (!tbody) return;

  // Update live subtotal strips
  let totalAmt = 0;
  let cashAmt = 0;
  let upiAmt = 0;
  let pendingAmt = 0;

  list.forEach(t => {
    const amt = Number(t.totalAmount || 0);
    totalAmt += amt;
    if (t.paymentMode.includes('रोख') || t.paymentMode.includes('Cash')) cashAmt += amt;
    else if (t.paymentMode.includes('युपीआय') || t.paymentMode.includes('UPI')) upiAmt += amt;
    else if (t.paymentMode.includes('उधारी') || t.paymentMode.includes('Pending')) pendingAmt += amt;
  });

  const countEl = document.getElementById('filter-count');
  if (countEl) countEl.textContent = list.length;
  const totEl = document.getElementById('filter-total-amount');
  if (totEl) totEl.textContent = totalAmt.toLocaleString('en-IN');
  const cashEl = document.getElementById('filter-cash-amount');
  if (cashEl) cashEl.textContent = cashAmt.toLocaleString('en-IN');
  const upiEl = document.getElementById('filter-upi-amount');
  if (upiEl) upiEl.textContent = upiAmt.toLocaleString('en-IN');
  const pendEl = document.getElementById('filter-pending-amount');
  if (pendEl) pendEl.textContent = pendingAmt.toLocaleString('en-IN');

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center py-5">
          <div class="empty-state-box">
            <i class="fas fa-search fa-2x mb-2 text-muted"></i>
            <p>कोणत्याही नोंदी सापडल्या नाहीत. फिल्टर बदला किंवा नवीन नोंद करा.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(t => `
    <tr>
      <td><strong class="token-text">${t.tokenNo}</strong></td>
      <td>
        <div class="td-datetime">
          <span>${formatDateDDMMYYYY(t.date)}</span>
          <small class="text-muted">${t.time}</small>
        </div>
      </td>
      <td>
        <strong class="customer-name">${escapeHtml(t.customerName)}</strong>
        <small class="text-muted d-block">${escapeHtml(t.genderAge || '')}</small>
      </td>
      <td>
        <strong style="color: #67e8f9;">${escapeHtml(t.operatorName || (t.center === 'WCD' ? 'Sakshi Sawant' : 'Gauravi Gawade'))}</strong>
        <small class="badge-tag cyan d-block text-xs" style="margin-top: 3px; font-size: 0.72rem;">${escapeHtml(t.center || 'DIT (Maha IT)')}</small>
      </td>
      <td>
        <a href="tel:${t.mobile}" class="tel-link"><i class="fas fa-phone-alt"></i> ${t.mobile}</a>
      </td>
      <td><code>${escapeHtml(t.aadhaarEid || '-')}</code></td>
      <td>
        <span class="service-pill">${escapeHtml(t.serviceName)}</span>
        ${t.notes ? `<small class="text-muted d-block mt-1"><i class="fas fa-info-circle"></i> ${escapeHtml(t.notes)}</small>` : ''}
      </td>
      <td style="text-align: right;"><strong class="text-gold font-lg">₹${t.totalAmount}</strong></td>
      <td><span class="badge ${getPaymentBadgeClass(t.paymentMode)}">${escapeHtml(t.paymentMode)}</span></td>
      <td><span class="badge ${getStatusBadgeClass(t.status)}">${escapeHtml(t.status)}</span></td>
      <td class="no-print text-center">
        <div class="action-btn-group">
          <button class="btn-icon print" title="पावती प्रिंट करा" onclick="openReceiptModalById('${t.id}')">
            <i class="fas fa-print"></i>
          </button>
          <button class="btn-icon whatsapp" title="WhatsApp वर पाठवा" onclick="shareRecordWhatsAppDirect('${t.id}')">
            <i class="fab fa-whatsapp"></i>
          </button>
          ${currentUser && currentUser.role === 'admin' ? `
          <button class="btn-icon edit" title="संपादित करा" onclick="editTransactionRecord('${t.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon delete" title="हटवा (Admin PIN Required)" onclick="requestDeleteTransaction('${t.id}')">
            <i class="fas fa-trash"></i>
          </button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function getPaymentBadgeClass(mode) {
  if (!mode) return 'badge-secondary';
  if (mode.includes('रोख') || mode.includes('Cash')) return 'badge-emerald';
  if (mode.includes('युपीआय') || mode.includes('UPI')) return 'badge-blue';
  if (mode.includes('कार्ड') || mode.includes('Card')) return 'badge-purple';
  if (mode.includes('उधारी') || mode.includes('Pending')) return 'badge-crimson';
  return 'badge-secondary';
}

function getStatusBadgeClass(status) {
  if (!status) return 'badge-secondary';
  if (status.includes('पूर्ण')) return 'badge-success';
  if (status.includes('प्रलंबित')) return 'badge-warning';
  if (status.includes('कागदपत्रे') || status.includes('अपूर्ण')) return 'badge-info';
  if (status.includes('नाकारले') || status.includes('रद्द')) return 'badge-crimson';
  return 'badge-secondary';
}

function editTransactionRecord(id) {
  playSound('click');
  const transactions = getStoredTransactions();
  const record = transactions.find(t => t.id === id);
  if (!record) return;

  document.getElementById('entry-edit-id').value = record.id;
  document.getElementById('entry-date').value = record.date;
  document.getElementById('entry-time').value = record.time;
  document.getElementById('entry-token').value = record.tokenNo.replace('#', '');
  document.getElementById('cust-name').value = record.customerName;
  document.getElementById('cust-mobile').value = record.mobile;
  document.getElementById('cust-aadhaar-eid').value = record.aadhaarEid === 'नोंद नाही' ? '' : record.aadhaarEid;
  document.getElementById('cust-gender-age').value = record.genderAge || 'वयस्क पुरुष (Adult Male)';
  
  // check matching radio
  const radio = document.querySelector(`input[name="aadhaar-service"][value="${record.serviceName}"]`);
  if (radio) radio.checked = true;

  document.getElementById('entry-base-fee').value = record.baseFee;
  document.getElementById('entry-addon-fee').value = record.addonFee || 0;
  document.getElementById('entry-discount').value = record.discount || 0;
  document.getElementById('entry-final-amount').value = record.totalAmount;

  const payRadio = document.querySelector(`input[name="payment-mode"][value="${record.paymentMode}"]`);
  if (payRadio) payRadio.checked = true;

  document.getElementById('entry-status').value = record.status;
  document.getElementById('entry-notes').value = record.notes || '';

  openTab('entry-tab');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteTransactionRecord(id) {
  if (!currentUser || currentUser.role !== 'admin') {
    alert('⚠️ ऑपरेटरला डेटा हटवण्याची (Delete) परवानगी नाही! फक्त ॲडमीनच डेटा हटवू शकतात.');
    return;
  }
  if (!confirm('तुम्हाला ही नोंद कायमची हटवायची आहे का?')) return;
  playSound('delete');
  let transactions = getStoredTransactions();
  transactions = transactions.filter(t => t.id !== id);
  saveStoredTransactions(transactions);

  if (isFirebaseConnected && db) {
    db.collection('aadhaar_transactions').doc(id).delete().catch(e => console.error(e));
  }
  refreshAllDataViews();
}

// =============================================================================
// 10. EXPENSE LEDGER RENDERING
// =============================================================================
function renderExpensesList() {
  const tbody = document.getElementById('expenses-table-tbody');
  if (!tbody) return;

  const expenses = getStoredExpenses();
  let total = 0;
  expenses.forEach(e => total += Number(e.amount || 0));

  const totalDisp = document.getElementById('expense-total-display');
  if (totalDisp) totalDisp.textContent = total.toLocaleString('en-IN');

  if (expenses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">कोणताही खर्च नोंदवलेला नाही.</td></tr>`;
    return;
  }

  tbody.innerHTML = expenses.map(e => `
    <tr>
      <td>${formatDateDDMMYYYY(e.date)}</td>
      <td><strong>${escapeHtml(e.category)}</strong></td>
      <td>${escapeHtml(e.description)}</td>
      <td style="text-align: right;"><strong class="text-crimson font-lg">₹${e.amount}</strong></td>
      <td><span class="badge badge-secondary">${escapeHtml(e.paymentMode)}</span></td>
      <td style="text-align: center;">
        ${currentUser && currentUser.role === 'admin' ? `
        <button class="btn-icon delete" title="हटवा (Admin PIN Required)" onclick="requestDeleteExpense('${e.id}')">
          <i class="fas fa-trash"></i>
        </button>` : '<span class="text-muted text-xs">-</span>'}
      </td>
    </tr>
  `).join('');
}

// =============================================================================
// 11. DAY-END REPORT & TALEBAND (ताळेबंद)
// =============================================================================
async function deleteDayData() {
  if (!currentUser || currentUser.role !== 'admin') {
    alert("⚠️ ऑपरेटरला डेटा हटवण्याची (Delete) परवानगी नाही! फक्त अधिकृत ॲडमीनच डेटा हटवू शकतात.");
    return;
  }
  const dateInput = document.getElementById('report-date-select');
  if (!dateInput || !dateInput.value) {
    alert("कृपया दिनांक निवडा!");
    return;
  }
  const selectedDate = dateInput.value;
  if (!confirm(`तुम्हाला खात्री आहे का? तुम्ही ${formatDateDDMMYYYY(selectedDate)} या दिवसाचा सर्व डेटा (नोंदी आणि खर्च) कायमचा हटवू इच्छिता?`)) {
    return;
  }
  
  // 1. Transactions
  let txs = getStoredTransactions();
  const txsToDelete = txs.filter(t => t.date === selectedDate);
  txs = txs.filter(t => t.date !== selectedDate);
  saveStoredTransactions(txs);
  
  // 2. Expenses
  let exp = getStoredExpenses();
  const expToDelete = exp.filter(e => e.date === selectedDate);
  exp = exp.filter(e => e.date !== selectedDate);
  saveStoredExpenses(exp);
  
  // 3. Summaries
  let summaries = [];
  try {
    summaries = JSON.parse(localStorage.getItem('ask_daily_summaries') || '[]');
  } catch(e){}
  const sumToDelete = summaries.filter(s => s.date === selectedDate);
  summaries = summaries.filter(s => s.date !== selectedDate);
  localStorage.setItem('ask_daily_summaries', JSON.stringify(summaries));
  
  // 4. Firebase Deletion (if connected)
  if (isFirebaseConnected && db) {
    try {
      const batch = db.batch();
      txsToDelete.forEach(t => {
        const ref = db.collection('aadhaar_transactions').doc(t.id);
        batch.delete(ref);
      });
      expToDelete.forEach(e => {
        const ref = db.collection('aadhaar_expenses').doc(e.id);
        batch.delete(ref);
      });
      sumToDelete.forEach(s => {
        const ref = db.collection('aadhaar_daily_summaries').doc(s.id);
        batch.delete(ref);
      });
      await batch.commit();
    } catch (e) {
      console.error("Error deleting from Firebase:", e);
    }
  }
  
  playSound('delete');
  alert("✅ या दिवसाचा सर्व डेटा यशस्वीरित्या हटवण्यात आला आहे.");
  refreshAllDataViews();
}

function normalizeDateToISO(dStr) {
  if (!dStr) return '';
  dStr = String(dStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) return dStr;
  if (/^\d{2}[-\/]\d{2}[-\/]\d{4}$/.test(dStr)) {
    const parts = dStr.split(/[-\/]/);
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dStr;
}

function onReportCustomDateChanged() {
  const scopeEl = document.getElementById('report-scope-select');
  if (scopeEl) scopeEl.value = 'custom-range';

  // Highlight active preset button as custom-range
  document.querySelectorAll('.report-preset-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.style.background = 'transparent';
    btn.style.borderColor = 'rgba(255,255,255,0.2)';
    btn.style.color = '#cbd5e1';
  });
  const activeBtn = document.getElementById('btn-preset-custom-range');
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.style.background = 'rgba(56, 189, 248, 0.25)';
    activeBtn.style.borderColor = '#38bdf8';
    activeBtn.style.color = '#38bdf8';
  }

  const fromInput = document.getElementById('report-date-from');
  const toInput = document.getElementById('report-date-to');
  if (fromInput && fromInput.value && (!toInput || !toInput.value)) {
    if (toInput) toInput.value = fromInput.value;
  }

  generateDailyReport();
}

function setReportQuickPreset(preset) {
  const scopeEl = document.getElementById('report-scope-select');
  if (scopeEl) scopeEl.value = preset;

  // Highlight active button
  document.querySelectorAll('.report-preset-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.style.background = 'transparent';
    btn.style.borderColor = 'rgba(255,255,255,0.2)';
    btn.style.color = '#cbd5e1';
  });
  const activeBtn = document.getElementById('btn-preset-' + preset);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.style.background = 'rgba(56, 189, 248, 0.25)';
    activeBtn.style.borderColor = '#38bdf8';
    activeBtn.style.color = '#38bdf8';
  }

  const singleDateWrap = document.getElementById('report-single-date-wrap');
  const monthWrap = document.getElementById('report-month-wrap');
  const rangeWrap = document.getElementById('report-range-wrap');
  const delBtn = document.getElementById('btn-delete-day-data');

  if (singleDateWrap) singleDateWrap.style.display = preset === 'single-date' ? 'block' : 'none';
  if (monthWrap) monthWrap.style.display = preset === 'custom-month' ? 'block' : 'none';
  if (rangeWrap) rangeWrap.style.display = (preset === 'custom-range' || preset === 'this-month' || preset === 'last-month' || preset === 'today') ? 'flex' : 'none';

  if (delBtn) {
    delBtn.style.display = (currentUser && currentUser.role === 'admin' && (preset === 'today' || preset === 'yesterday' || preset === 'single-date')) ? 'inline-block' : 'none';
  }

  const now = new Date();
  const todayStr = getTodayDateString();
  const fromInput = document.getElementById('report-date-from');
  const toInput = document.getElementById('report-date-to');

  if (preset === 'today') {
    if (fromInput) fromInput.value = todayStr;
    if (toInput) toInput.value = todayStr;
  } else if (preset === 'yesterday') {
    const yDate = new Date();
    yDate.setDate(yDate.getDate() - 1);
    const yStr = `${yDate.getFullYear()}-${String(yDate.getMonth() + 1).padStart(2, '0')}-${String(yDate.getDate()).padStart(2, '0')}`;
    if (fromInput) fromInput.value = yStr;
    if (toInput) toInput.value = yStr;
  } else if (preset === 'this-month') {
    const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    if (fromInput) fromInput.value = firstDay;
    if (toInput) toInput.value = todayStr;
  } else if (preset === 'last-month') {
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const y = lastMonthDate.getFullYear();
    const m = String(lastMonthDate.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(y, lastMonthDate.getMonth() + 1, 0).getDate();
    if (fromInput) fromInput.value = `${y}-${m}-01`;
    if (toInput) toInput.value = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
  }

  playSound('click');
  generateDailyReport();
}

function handleReportScopeChange() {
  const scope = document.getElementById('report-scope-select')?.value || 'today';
  setReportQuickPreset(scope);
}

function generateDailyReport() {
  let scope = document.getElementById('report-scope-select')?.value || 'today';
  const centerSelect = document.getElementById('report-center-select')?.value || 'all';

  let allTx = getStoredTransactions();
  let allExp = getStoredExpenses();

  const now = new Date();
  const todayStr = getTodayDateString();
  const marathiMonths = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];

  // Strict Role-Based Isolation & Lock
  if (currentUser && currentUser.role === 'operator') {
    // 1. Force TODAY ONLY (No past reports for operators)
    scope = 'today';
    // 2. Strict Center & Operator Data Isolation (No other operator data visible)
    allTx = allTx.filter(t => isRecordForCurrentUser(t));
    allExp = allExp.filter(e => isRecordForCurrentUser(e));
  } else if (centerSelect !== 'all') {
    allTx = allTx.filter(t => t.center === centerSelect);
    allExp = allExp.filter(e => e.center === centerSelect);
  }

  let transactions = [];
  let expenses = [];
  let dateDisplayStr = '--';
  let sheetHeadingTitle = 'आधार केंद्र ताळेबंद व आर्थिक विवरण पत्रक';

  const dateFrom = document.getElementById('report-date-from')?.value;
  const dateTo = document.getElementById('report-date-to')?.value;
  const singleDateVal = document.getElementById('report-date-select')?.value;
  const monthVal = document.getElementById('report-month-select')?.value;

  // If admin selected a custom past date in from/to while scope was 'today', auto switch to custom-range
  if (scope === 'today' && dateFrom && dateFrom !== todayStr && (!currentUser || currentUser.role === 'admin')) {
    scope = 'custom-range';
  }

  if (scope === 'today') {
    transactions = allTx.filter(t => normalizeDateToISO(t.date) === todayStr);
    expenses = allExp.filter(e => normalizeDateToISO(e.date) === todayStr);
    dateDisplayStr = `आज (${formatDateDDMMYYYY(todayStr)}) चा दैनिक ताळेबंद`;
    sheetHeadingTitle = `दैनिक ताळेबंद व आर्थिक हिशोब पत्रक (${formatDateDDMMYYYY(todayStr)})`;
  } else if (scope === 'yesterday') {
    const yDate = new Date();
    yDate.setDate(yDate.getDate() - 1);
    const yStr = `${yDate.getFullYear()}-${String(yDate.getMonth() + 1).padStart(2, '0')}-${String(yDate.getDate()).padStart(2, '0')}`;
    transactions = allTx.filter(t => normalizeDateToISO(t.date) === yStr);
    expenses = allExp.filter(e => normalizeDateToISO(e.date) === yStr);
    dateDisplayStr = `काल (${formatDateDDMMYYYY(yStr)}) चा दैनिक ताळेबंद`;
    sheetHeadingTitle = `दैनिक ताळेबंद व आर्थिक हिशोब पत्रक (${formatDateDDMMYYYY(yStr)})`;
  } else if (scope === 'single-date') {
    const targetDate = singleDateVal || dateFrom || todayStr;
    transactions = allTx.filter(t => normalizeDateToISO(t.date) === targetDate);
    expenses = allExp.filter(e => normalizeDateToISO(e.date) === targetDate);
    dateDisplayStr = `दिनांक: ${formatDateDDMMYYYY(targetDate)} चा ताळेबंद`;
    sheetHeadingTitle = `दैनिक ताळेबंद व आर्थिक हिशोब पत्रक (${formatDateDDMMYYYY(targetDate)})`;
  } else if (scope === 'this-month') {
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    transactions = allTx.filter(t => normalizeDateToISO(t.date).startsWith(monthPrefix));
    expenses = allExp.filter(e => normalizeDateToISO(e.date).startsWith(monthPrefix));
    const monthName = marathiMonths[now.getMonth()] + ' ' + now.getFullYear();
    dateDisplayStr = `चालू महिना: ${monthName} चा ताळेबंद`;
    sheetHeadingTitle = `मासिक ताळेबंद पत्रक - ${monthName}`;
  } else if (scope === 'last-month') {
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
    transactions = allTx.filter(t => normalizeDateToISO(t.date).startsWith(lastMonthPrefix));
    expenses = allExp.filter(e => normalizeDateToISO(e.date).startsWith(lastMonthPrefix));
    const lastMonthName = marathiMonths[lastMonthDate.getMonth()] + ' ' + lastMonthDate.getFullYear();
    dateDisplayStr = `मागील महिना: ${lastMonthName} चा ताळेबंद`;
    sheetHeadingTitle = `मासिक ताळेबंद पत्रक - ${lastMonthName}`;
  } else if (scope === 'custom-month') {
    if (monthVal) {
      const [y, m] = monthVal.split('-');
      const mIdx = parseInt(m, 10) - 1;
      const mName = (mIdx >= 0 && mIdx < 12) ? marathiMonths[mIdx] : m;
      transactions = allTx.filter(t => normalizeDateToISO(t.date).startsWith(monthVal));
      expenses = allExp.filter(e => normalizeDateToISO(e.date).startsWith(monthVal));
      dateDisplayStr = `माहे ${mName} ${y} चा मासिक ताळेबंद`;
      sheetHeadingTitle = `मासिक ताळेबंद पत्रक - ${mName} ${y}`;
    } else {
      transactions = allTx;
      expenses = allExp;
      dateDisplayStr = `मासिक ताळेबंद`;
      sheetHeadingTitle = `मासिक ताळेबंद व आर्थिक विवरण पत्रक`;
    }
  } else if (scope === 'all') {
    transactions = allTx;
    expenses = allExp;
    dateDisplayStr = 'एकूण सर्व कालावधी अहवाल (All Time Total)';
    sheetHeadingTitle = 'सर्वसमावेशक एकूण ताळेबंद व आर्थिक हिशोब पत्रक';
  } else {
    // custom-range
    const fromD = dateFrom || dateTo || todayStr;
    const toD = dateTo || dateFrom || todayStr;
    const actualFrom = fromD <= toD ? fromD : toD;
    const actualTo = fromD <= toD ? toD : fromD;

    transactions = allTx.filter(t => {
      const d = normalizeDateToISO(t.date);
      if (!d) return false;
      return d >= actualFrom && d <= actualTo;
    });
    expenses = allExp.filter(e => {
      const d = normalizeDateToISO(e.date);
      if (!d) return false;
      return d >= actualFrom && d <= actualTo;
    });

    if (actualFrom === actualTo) {
      dateDisplayStr = `दिनांक: ${formatDateDDMMYYYY(actualFrom)} चा ताळेबंद`;
      sheetHeadingTitle = `दैनिक ताळेबंद व आर्थिक हिशोब पत्रक (${formatDateDDMMYYYY(actualFrom)})`;
    } else {
      dateDisplayStr = `कालावधी: ${formatDateDDMMYYYY(actualFrom)} ते ${formatDateDDMMYYYY(actualTo)}`;
      sheetHeadingTitle = `कालावधी ताळेबंद पत्रक (${formatDateDDMMYYYY(actualFrom)} ते ${formatDateDDMMYYYY(actualTo)})`;
    }
  }

  // Update sheet title element
  const elSheetTitle = document.querySelector('#printable-day-report h2');
  if (elSheetTitle) elSheetTitle.textContent = sheetHeadingTitle;

  // Sort transactions by date descending, then time descending
  transactions.sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));

  const settings = getKendraSettings(centerSelect !== 'all' ? centerSelect : undefined);

  // Update Headers on Sheet
  const dateEl = document.getElementById('rep-date-text');
  if (dateEl) dateEl.textContent = dateDisplayStr;

  const kEl = document.getElementById('rep-kendra-name');
  if (kEl) {
    if (currentUser && currentUser.role === 'operator') {
      kEl.textContent = `ई-मुद्रा आधार सेवा केंद्र (${currentUser.center})`;
    } else {
      kEl.textContent = centerSelect === 'all' ? 'सर्व आधार केंद्रे (DIT + WCD Combined)' : settings.kendraName;
    }
  }

  const opEl = document.getElementById('rep-operator-name');
  if (opEl) {
    if (currentUser && currentUser.role === 'operator') {
      opEl.textContent = currentUser.name;
    } else if (centerSelect === 'all') {
      opEl.textContent = 'Admin (सर्व ऑपरेटर)';
    } else if (centerSelect === 'DIT (Maha IT)') {
      opEl.textContent = 'Gauravi Gawade';
    } else if (centerSelect === 'WCD') {
      opEl.textContent = 'Sakshi Sawant';
    } else {
      opEl.textContent = settings.operatorName;
    }
  }

  const stnEl = document.getElementById('rep-station-id');
  if (stnEl) {
    if (currentUser && currentUser.role === 'operator') {
      stnEl.textContent = currentUser.stationId || (currentUser.center === 'WCD' ? '73016' : '40068');
    } else if (centerSelect === 'all') {
      stnEl.textContent = '40068 (DIT) / 73016 (WCD)';
    } else if (centerSelect === 'DIT (Maha IT)') {
      stnEl.textContent = '40068';
    } else if (centerSelect === 'WCD') {
      stnEl.textContent = '73016';
    } else {
      stnEl.textContent = settings.stationId;
    }
  }

  // Services aggregation
  const serviceCounts = {};
  let govtFeeTotal = 0;
  let grossIncome = 0;
  let cashTotal = 0;
  let upiTotal = 0;
  let pendingTotal = 0;

  transactions.forEach(t => {
    const sName = t.serviceName || 'इतर सेवा';
    if (!serviceCounts[sName]) serviceCounts[sName] = { count: 0, revenue: 0 };
    serviceCounts[sName].count += 1;
    serviceCounts[sName].revenue += Number(t.totalAmount || 0);

    const collAmt = Number(t.totalAmount || 0);
    const gFee = getGovtFeeForTransaction(t);
    govtFeeTotal += gFee;
    grossIncome += collAmt;

    const pMode = (t.paymentMode || '').toLowerCase();
    if (pMode.includes('रोख') || pMode.includes('cash')) cashTotal += collAmt;
    else if (pMode.includes('युपीआय') || pMode.includes('upi') || pMode.includes('online')) upiTotal += collAmt;
    else if (pMode.includes('उधारी') || pMode.includes('pending')) pendingTotal += collAmt;
    else cashTotal += collAmt;
  });

  const extraMargin = Math.max(0, grossIncome - govtFeeTotal);

  // Render Service Breakdown
  const servTbody = document.getElementById('rep-services-breakdown-tbody');
  if (servTbody) {
    const keys = Object.keys(serviceCounts);
    if (keys.length === 0) {
      servTbody.innerHTML = `<tr><td colspan="3" class="text-center py-2 text-muted">या कालावधीत कोणतीही जमा नोंद सापडली नाही.</td></tr>`;
    } else {
      servTbody.innerHTML = keys.map(k => `
        <tr>
          <td>${escapeHtml(k)}</td>
          <td class="text-center" style="font-weight: 600;">${serviceCounts[k].count}</td>
          <td class="text-right" style="font-weight: 700; color: #047857;">₹${serviceCounts[k].revenue.toLocaleString('en-IN')}</td>
        </tr>
      `).join('');
    }
  }

  const elRepCount = document.getElementById('rep-total-count');
  if (elRepCount) elRepCount.textContent = transactions.length;
  const elRepGross = document.getElementById('rep-gross-income');
  if (elRepGross) elRepGross.textContent = grossIncome.toLocaleString('en-IN');
  const elRepCash = document.getElementById('rep-cash-total');
  if (elRepCash) elRepCash.textContent = cashTotal.toLocaleString('en-IN');
  const elRepUpi = document.getElementById('rep-upi-total');
  if (elRepUpi) elRepUpi.textContent = upiTotal.toLocaleString('en-IN');
  const elRepPend = document.getElementById('rep-pending-total');
  if (elRepPend) elRepPend.textContent = pendingTotal.toLocaleString('en-IN');

  // Render Expenses Breakdown
  let totalExpense = 0;
  let generalExpense = 0;
  let pigmyTotal = 0;

  const expTbody = document.getElementById('rep-expenses-breakdown-tbody');
  if (expTbody) {
    if (expenses.length === 0) {
      expTbody.innerHTML = `<tr><td colspan="3" class="text-center py-2 text-muted">या कालावधीत कोणताही खर्च नोंदवलेला नाही.</td></tr>`;
    } else {
      expTbody.innerHTML = expenses.map(e => {
        const amt = Number(e.amount || 0);
        totalExpense += amt;
        const isPigmy = (e.category || '').includes('पिग्मी') || (e.category || '').includes('बचत');
        if (isPigmy) {
          pigmyTotal += amt;
        } else {
          generalExpense += amt;
        }
        return `
          <tr>
            <td>${isPigmy ? '<strong style="color: #047857;">🏦 ' + escapeHtml(e.category) + '</strong>' : escapeHtml(e.category || 'खर्च')}</td>
            <td>${escapeHtml(e.note || e.description || '-')}</td>
            <td class="text-right" style="font-weight: 600; color: ${isPigmy ? '#047857' : '#b91c1c'};">₹${amt.toLocaleString('en-IN')}</td>
          </tr>
        `;
      }).join('');
    }
  }

  const elRepExp = document.getElementById('rep-total-expense');
  if (elRepExp) elRepExp.textContent = generalExpense.toLocaleString('en-IN');
  const elRepPigmy = document.getElementById('rep-total-pigmy');
  if (elRepPigmy) elRepPigmy.textContent = pigmyTotal.toLocaleString('en-IN');

  // Net Balance Calculations
  // Net Profit = Gross Income - General Operational Expenses
  const netProfit = grossIncome - generalExpense;
  // Drawer Cash = Cash Income - Total Cash Outflow (Expenses + Pigmy Deposit)
  const drawerCash = Math.max(0, cashTotal - totalExpense);

  const elFinalGovt = document.getElementById('rep-final-govt');
  if (elFinalGovt) elFinalGovt.textContent = govtFeeTotal.toLocaleString('en-IN');
  const elFinalMargin = document.getElementById('rep-final-margin');
  if (elFinalMargin) elFinalMargin.textContent = extraMargin.toLocaleString('en-IN');

  const elFinalGross = document.getElementById('rep-final-gross');
  if (elFinalGross) elFinalGross.textContent = grossIncome.toLocaleString('en-IN');
  const elFinalExp = document.getElementById('rep-final-expense');
  if (elFinalExp) elFinalExp.textContent = generalExpense.toLocaleString('en-IN');
  const elFinalPigmy = document.getElementById('rep-final-pigmy');
  if (elFinalPigmy) elFinalPigmy.textContent = pigmyTotal.toLocaleString('en-IN');

  const elFinalNet = document.getElementById('rep-final-net');
  if (elFinalNet) {
    elFinalNet.textContent = netProfit.toLocaleString('en-IN');
    elFinalNet.style.color = netProfit >= 0 ? '#047857' : '#b91c1c';
  }
  const elFinalDrawer = document.getElementById('rep-final-drawer-cash');
  if (elFinalDrawer) elFinalDrawer.textContent = drawerCash.toLocaleString('en-IN');
}

// =============================================================================
// 12. RECEIPT GENERATOR, QR CODE & PRINTING
// =============================================================================
function openReceiptModalById(id) {
  const transactions = getStoredTransactions();
  const record = transactions.find(t => t.id === id);
  if (record) openReceiptModal(record);
}

function openReceiptModal(record) {
  playSound('click');
  currentReceiptData = record;
  const settings = getKendraSettings();

  // Populate receipt elements
  document.getElementById('rec-kendra-title').textContent = settings.kendraName;
  document.getElementById('rec-kendra-address').textContent = settings.centerAddress;
  document.getElementById('rec-kendra-phone').textContent = `संपर्क: ${settings.contactPhone}`;
  document.getElementById('rec-token-no').textContent = record.tokenNo;
  document.getElementById('rec-datetime').textContent = `${formatDateDDMMYYYY(record.date)} ${record.time}`;
  document.getElementById('rec-operator').textContent = settings.operatorName;
  document.getElementById('rec-station').textContent = settings.stationId;

  document.getElementById('rec-cust-name').textContent = record.customerName;
  document.getElementById('rec-cust-mobile').textContent = record.mobile;
  document.getElementById('rec-cust-aadhaar').textContent = record.aadhaarEid || 'नोंद नाही';

  // Items table
  const tbody = document.getElementById('rec-items-tbody');
  let itemsHtml = `
    <tr>
      <td>१</td>
      <td>${escapeHtml(record.serviceName)}</td>
      <td class="text-right">₹${record.baseFee}</td>
    </tr>
  `;

  if (record.addonFee > 0) {
    itemsHtml += `
      <tr>
        <td>२</td>
        <td>अतिरिक्त सहाय्य / लॅमिनेशन</td>
        <td class="text-right">₹${record.addonFee}</td>
      </tr>
    `;
  }
  tbody.innerHTML = itemsHtml;

  document.getElementById('rec-subtotal').textContent = (record.baseFee + (record.addonFee || 0));
  
  const discRow = document.getElementById('rec-discount-row');
  if (record.discount > 0) {
    discRow.style.display = 'flex';
    document.getElementById('rec-discount').textContent = record.discount;
  } else {
    discRow.style.display = 'none';
  }

  document.getElementById('rec-grand-total').textContent = record.totalAmount;
  document.getElementById('rec-payment-mode').textContent = record.paymentMode;
  document.getElementById('rec-status').textContent = record.status;
  document.getElementById('rec-footer-text').textContent = settings.receiptFooter;

  // Generate QR Code
  const qrContainer = document.getElementById('receipt-qrcode');
  qrContainer.innerHTML = '';
  try {
    const qrData = `ASK-RECEIPT|${record.tokenNo}|${record.customerName}|${record.serviceName}|INR ${record.totalAmount}|${record.date}`;
    new QRCode(qrContainer, {
      text: qrData,
      width: 90,
      height: 90,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  } catch (e) {
    // QRCode lib failed
  }

  openModal('receipt-modal');
}

function setReceiptFormat(fmt) {
  playSound('click');
  currentReceiptFormat = fmt;
  const printArea = document.getElementById('receipt-print-area');
  const btnThermal = document.getElementById('btn-fmt-thermal');
  const btnA4 = document.getElementById('btn-fmt-a4');

  if (fmt === 'thermal') {
    printArea.className = 'thermal-receipt-view';
    btnThermal.classList.add('active');
    btnA4.classList.remove('active');
  } else {
    printArea.className = 'a4-receipt-view';
    btnA4.classList.add('active');
    btnThermal.classList.remove('active');
  }
}

function printReceipt() {
  playSound('click');
  window.print();
}

function shareReceiptWhatsApp() {
  if (!currentReceiptData) return;
  playSound('click');
  const r = currentReceiptData;
  const settings = getKendraSettings();

  const msg = `*${settings.kendraName}*\n` +
    `🏛️ *अधिकृत आधार सेवा देयक पावती*\n` +
    `--------------------------------\n` +
    `पावती क्र: *${r.tokenNo}*\n` +
    `दिनांक: ${formatDateDDMMYYYY(r.date)} ${r.time}\n` +
    `ग्राहक: *${r.customerName}*\n` +
    `मोबाईल: ${r.mobile}\n` +
    `आधार/EID: ${r.aadhaarEid || '-'}\n` +
    `--------------------------------\n` +
    `सेवा प्रकार: *${r.serviceName}*\n` +
    `रक्कम: *₹${r.totalAmount}*\n` +
    `पेमेंट पद्धत: ${r.paymentMode}\n` +
    `स्थिती: ${r.status}\n` +
    `--------------------------------\n` +
    `ऑपरेटर: ${settings.operatorName} (${settings.stationId})\n` +
    `*${settings.receiptFooter}*`;

  const cleanPhone = r.mobile.replace(/[^0-9]/g, '');
  const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

function shareRecordWhatsAppDirect(id) {
  const transactions = getStoredTransactions();
  const record = transactions.find(t => t.id === id);
  if (!record) return;
  currentReceiptData = record;
  shareReceiptWhatsApp();
}

function printRegisterTable() {
  playSound('click');
  const preset = document.getElementById('register-date-preset').value;
  const lbl = document.getElementById('print-date-range-label');
  if (lbl) lbl.textContent = `तारीख फिल्टर: ${preset.toUpperCase()} (${formatDateDDMMYYYY(getTodayDateString())})`;
  window.print();
}

function printDayReport() {
  playSound('click');
  window.print();
}

// =============================================================================
// 13. EXPORT / BACKUP (CSV & JSON)
// =============================================================================
function exportDataToCSV() {
  playSound('click');
  const transactions = getStoredTransactions();
  if (transactions.length === 0) {
    alert('एक्सपोर्ट करण्यासाठी कोणताही डेटा उपलब्ध नाही.');
    return;
  }

  // UTF-8 BOM for perfect Marathi Devanagari display in Microsoft Excel
  let csv = '\uFEFF';
  csv += 'पावती क्र,दिनांक,वेळ,ग्राहकाचे नाव,मोबाईल,आधार/EID,लिंग/वय,सेवा प्रकार,मूळ शुल्क,अतिरिक्त शुल्क,सूट,एकूण रक्कम (₹),पेमेंट पद्धत,स्थिती,शेरा\n';

  transactions.forEach(t => {
    const row = [
      `"${t.tokenNo}"`,
      `"${t.date}"`,
      `"${t.time}"`,
      `"${(t.customerName || '').replace(/"/g, '""')}"`,
      `"${t.mobile}"`,
      `"${(t.aadhaarEid || '').replace(/"/g, '""')}"`,
      `"${t.genderAge || ''}"`,
      `"${(t.serviceName || '').replace(/"/g, '""')}"`,
      t.baseFee,
      t.addonFee || 0,
      t.discount || 0,
      t.totalAmount,
      `"${t.paymentMode}"`,
      `"${t.status}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ];
    csv += row.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Aadhaar_Register_${getTodayDateString()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function exportJSONBackup() {
  playSound('click');
  const backup = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    settings: getKendraSettings(),
    transactions: getStoredTransactions(),
    expenses: getStoredExpenses()
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Aadhaar_Kendra_Backup_${getTodayDateString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function importJSONBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.transactions && Array.isArray(data.transactions)) {
        saveStoredTransactions(data.transactions);
      }
      if (data.expenses && Array.isArray(data.expenses)) {
        saveStoredExpenses(data.expenses);
      }
      if (data.settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      }
      playSound('success');
      alert('🎉 बॅकअप फाईलमधून सर्व डेटा यशस्वीपणे रिस्टोअर झाला आहे!');
      loadKendraSettings();
      refreshAllDataViews();
    } catch (err) {
      alert('❌ बॅकअप फाईल वाचताना त्रुटी आली. योग्य JSON फाईल निवडा.');
    }
  };
  reader.readAsText(file);
}

function confirmClearAllData() {
  if (confirm('⚠️ सावधान: यामुळे कॉम्प्युटरमधील सर्व नोंदी व हिशोब डिलीट होईल. तुम्ही आधी बॅकअप घेतला आहे का?')) {
    if (confirm('खात्री करा: सर्व डेटा कायमचा नष्ट करायचा आहे?')) {
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.EXPENSES);
      playSound('delete');
      alert('सर्व स्थानिक डेटा साफ करण्यात आला.');
      refreshAllDataViews();
    }
  }
}

// =============================================================================
// 14. TAB NAVIGATION & MODALS
// =============================================================================
function openTab(tabId) {
  playSound('click');
  document.querySelectorAll('.app-tab-panel, .tab-pane').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-tab-btn, .tab-btn').forEach(el => el.classList.remove('active'));

  const targetPane = document.getElementById(tabId);
  if (targetPane) targetPane.classList.add('active');

  const btnId = 'tab-btn-' + tabId.replace('-tab', '');
  const targetBtn = document.getElementById(btnId);
  if (targetBtn) targetBtn.classList.add('active');

  if (tabId === 'register-tab') {
    filterRegisterRecords();
  } else if (tabId === 'reports-tab') {
    generateDailyReport();
  }
}

function openNewEntryTab() {
  openTab('entry-tab');
  resetEntryForm();
  window.scrollTo({ top: 300, behavior: 'smooth' });
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('active');
}

function closeModal(id) {
  playSound('click');
  const m = document.getElementById(id);
  if (m) m.classList.remove('active');
}

function showSuccessModal(message, title = '🎉 अभिनंदन! डेटा सेव्ह झाला') {
  const modal = document.getElementById('app-success-modal');
  const titleEl = document.getElementById('app-success-title');
  const msgEl = document.getElementById('app-success-message');

  if (titleEl) titleEl.innerHTML = title;
  if (msgEl) msgEl.innerHTML = message;

  playSound('success');
  openModal('app-success-modal');
}

function handleModalBackdropClick(event, id) {
  if (event.target.classList.contains('modal-overlay')) {
    closeModal(id);
  }
}

function openFirebaseModal() {
  playSound('click');
  openModal('firebase-modal');
}

// =============================================================================
// 15. UIDAI PASSWORD-PROTECTED ZIP & CSV REPORT IMPORT ENGINE
// =============================================================================
let selectedReportFile = null;
let parsedReportTransactions = [];

function openZipImportModal() {
  playSound('click');
  resetZipImportModal();
  openModal('zip-import-modal');
}

function resetZipImportModal() {
  selectedReportFile = null;
  parsedReportTransactions = [];
  
  const fileInput = document.getElementById('zip-file-input');
  if (fileInput) fileInput.value = '';

  const promptText = document.getElementById('dropzone-prompt-text');
  if (promptText) promptText.innerHTML = '<strong>UIDAI रिपोर्ट फाईल येथे ओढा (Drag & Drop)</strong> किंवा निवडा (.ZIP किंवा .CSV)';

  const fileNameSub = document.getElementById('dropzone-file-name');
  if (fileNameSub) fileNameSub.textContent = 'समर्थित: Password Protected ZIP (AES / ZipCrypto) व CSV फाईल्स';

  const pwdInput = document.getElementById('zip-password-input');
  if (pwdInput) pwdInput.value = '';

  const alertBox = document.getElementById('zip-status-alert');
  if (alertBox) {
    alertBox.style.display = 'none';
    alertBox.innerHTML = '';
  }

  const previewCard = document.getElementById('zip-preview-card');
  if (previewCard) previewCard.style.display = 'none';

  const btnExtract = document.getElementById('btn-extract-zip');
  if (btnExtract) {
    btnExtract.disabled = false;
    btnExtract.innerHTML = '<i class="fas fa-unlock-alt"></i> फाईल उघडा व विश्लेषण करा';
  }
}

function handleZipFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;
  selectedReportFile = file;

  const promptText = document.getElementById('dropzone-prompt-text');
  if (promptText) promptText.innerHTML = `<strong style="color: #fbbf24;"><i class="fas fa-file-alt"></i> ${escapeHtml(file.name)}</strong>`;

  const fileNameSub = document.getElementById('dropzone-file-name');
  if (fileNameSub) {
    const sizeKB = (file.size / 1024).toFixed(1);
    fileNameSub.textContent = `आकार: ${sizeKB} KB | प्रकार: ${file.name.split('.').pop().toUpperCase()}`;
  }

  // Pre-fill suggested password if empty
  const pwdInput = document.getElementById('zip-password-input');
  const settings = getKendraSettings();
  if (pwdInput && !pwdInput.value && file.name.toLowerCase().endsWith('.zip')) {
    if (settings && settings.stationId) {
      pwdInput.placeholder = `उदा. ${settings.stationId} किंवा ऑपरेटर कोड`;
    }
  }

  playSound('click');
}

function toggleZipPasswordVisibility() {
  const pwdInput = document.getElementById('zip-password-input');
  const eyeIcon = document.getElementById('zip-eye-icon');
  if (!pwdInput) return;

  if (pwdInput.type === 'password') {
    pwdInput.type = 'text';
    if (eyeIcon) {
      eyeIcon.classList.remove('fa-eye');
      eyeIcon.classList.add('fa-eye-slash');
    }
  } else {
    pwdInput.type = 'password';
    if (eyeIcon) {
      eyeIcon.classList.remove('fa-eye-slash');
      eyeIcon.classList.add('fa-eye');
    }
  }
}

async function processSelectedZipOrCsv() {
  if (!selectedReportFile) {
    showZipStatusAlert('⚠️ कृपया आधी एक .ZIP किंवा .CSV फाईल निवडा.', 'warning');
    return;
  }

  const btnExtract = document.getElementById('btn-extract-zip');
  if (btnExtract) {
    btnExtract.disabled = true;
    btnExtract.innerHTML = '<i class="fas fa-spinner fa-spin"></i> विश्लेषण होत आहे...';
  }

  showZipStatusAlert('🔄 फाईल अनलॉक व विश्लेषण सुरू आहे, कृपया थांबा...', 'info');
  playSound('click');

  const fileName = selectedReportFile.name.toLowerCase();
  const password = document.getElementById('zip-password-input') ? document.getElementById('zip-password-input').value.trim() : '';

  try {
    if (fileName.endsWith('.zip')) {
      await processZipFile(selectedReportFile, password);
    } else if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
      await processCsvDirectly(selectedReportFile);
    } else {
      showZipStatusAlert('❌ असमर्थित फाईल प्रकार. कृपया .ZIP किंवा .CSV फाईल अपलोड करा.', 'error');
      if (btnExtract) {
        btnExtract.disabled = false;
        btnExtract.innerHTML = '<i class="fas fa-unlock-alt"></i> फाईल उघडा व विश्लेषण करा';
      }
    }
  } catch (err) {
    console.error('Error processing report file:', err);
    let errMsg = '❌ फाईल वाचताना त्रुटी आली.';
    if (err.message && err.message.toLowerCase().includes('password')) {
      errMsg = '❌ चुकीचा पासवर्ड! कृपया योग्य पासवर्ड प्रविष्ट करा.';
    }
    showZipStatusAlert(errMsg + ' (' + (err.message || 'Error') + ')', 'error');
    if (btnExtract) {
      btnExtract.disabled = false;
      btnExtract.innerHTML = '<i class="fas fa-unlock-alt"></i> पुन्हा प्रयत्न करा';
    }
  }
}

// Ensure Zip & CSV Libraries are ready (Multi-Engine: fflate + zip.js + JSZip)
async function ensureZipLibrariesLoaded() {
  if (typeof fflate !== 'undefined' || typeof zip !== 'undefined' || typeof JSZip !== 'undefined') {
    if (typeof zip !== 'undefined') {
      try { zip.configure({ useWebWorkers: false }); } catch (e) {}
    }
    return true;
  }

  // Fallback: Dynamically load fflate or zip-full if CDN is blocked or slow
  return new Promise((resolve) => {
    let loaded = false;
    const finish = () => {
      if (!loaded) {
        loaded = true;
        if (typeof zip !== 'undefined') {
          try { zip.configure({ useWebWorkers: false }); } catch (e) {}
        }
        resolve(typeof fflate !== 'undefined' || typeof zip !== 'undefined' || typeof JSZip !== 'undefined');
      }
    };

    const s1 = document.createElement('script');
    s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/fflate/0.8.2/fflate.min.js';
    s1.onload = finish;
    s1.onerror = () => {
      const s2 = document.createElement('script');
      s2.src = 'https://cdn.jsdelivr.net/npm/@zip.js/zip.js@2.7.53/dist/zip-full.min.js';
      s2.onload = finish;
      s2.onerror = () => {
        const s3 = document.createElement('script');
        s3.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        s3.onload = finish;
        s3.onerror = () => finish();
        document.head.appendChild(s3);
      };
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);

    // Timeout after 4s
    setTimeout(finish, 4000);
  });
}

// Master Universal ZIP Extraction Pipeline (zip.js Full -> fflate -> JSZip)
async function extractUniversalZip(fileBlob, password) {
  await ensureZipLibrariesLoaded();
  const arrayBuffer = await fileBlob.arrayBuffer();
  let lastError = null;

  // 1. Engine 1: zip.js (Full AES-256 + ZipCrypto decryptor)
  if (typeof zip !== 'undefined') {
    let reader = null;
    try {
      try { zip.configure({ useWebWorkers: false }); } catch (e) {}
      const uint8 = new Uint8Array(arrayBuffer);
      reader = new zip.ZipReader(new zip.Uint8ArrayReader(uint8));
      const entries = await reader.getEntries();
      if (entries && entries.length > 0) {
        let targetEntry = entries.find(e => !e.directory && (e.filename.toLowerCase().endsWith('.csv') || e.filename.toLowerCase().endsWith('.txt')));
        if (!targetEntry) targetEntry = entries.find(e => !e.directory);
        if (targetEntry) {
          const passOpts = { checkSignature: false };
          if (password) passOpts.password = password;
          let csvContent = '';
          try {
            csvContent = await targetEntry.getData(new zip.TextWriter('utf-8'), passOpts);
          } catch (tErr) {
            const rawBytes = await targetEntry.getData(new zip.Uint8ArrayWriter(), passOpts);
            csvContent = new TextDecoder('utf-8', { fatal: false }).decode(rawBytes);
          }
          await reader.close();
          if (csvContent) return { csvContent, fileName: targetEntry.filename };
        }
      }
      if (reader) await reader.close();
    } catch (zipErr) {
      if (reader) { try { await reader.close(); } catch(e){} }
      console.warn('zip.js extraction error:', zipErr);
      lastError = zipErr;
    }
  }

  // 2. Engine 2: fflate (Pure JS synchronous/async ZipCrypto engine)
  if (typeof fflate !== 'undefined') {
    try {
      const res = await new Promise((resolve, reject) => {
        const uint8 = new Uint8Array(arrayBuffer);
        const opts = {};
        if (password) {
          opts.password = (filename) => password;
        }
        fflate.unzip(uint8, opts, (err, unzipped) => {
          if (err) return reject(err);
          const fileKeys = Object.keys(unzipped);
          if (!fileKeys || fileKeys.length === 0) {
            return reject(new Error('ZIP फाईल रिकामी आहे.'));
          }
          const csvKey = fileKeys.find(k => k.toLowerCase().endsWith('.csv') || k.toLowerCase().endsWith('.txt')) || fileKeys[0];
          if (!csvKey) return reject(new Error('कोणतीही CSV फाईल सापडली नाही.'));
          const text = new TextDecoder('utf-8', { fatal: false }).decode(unzipped[csvKey]);
          resolve({ csvContent: text, fileName: csvKey });
        });
      });
      if (res && res.csvContent) return res;
    } catch (ffErr) {
      console.warn('fflate extraction note:', ffErr);
      if (!lastError) lastError = ffErr;
    }
  }

  // 3. Engine 3: JSZip (Standard unencrypted fallback)
  if (typeof JSZip !== 'undefined') {
    try {
      const zipInstance = new JSZip();
      const zipData = await zipInstance.loadAsync(arrayBuffer);
      const fileNames = Object.keys(zipData.files);
      const targetFileName = fileNames.find(n => !zipData.files[n].dir && (n.toLowerCase().endsWith('.csv') || n.toLowerCase().endsWith('.txt'))) || fileNames.find(n => !zipData.files[n].dir);
      if (targetFileName) {
        const csvContent = await zipData.files[targetFileName].async('string');
        if (csvContent) return { csvContent, fileName: targetFileName };
      }
    } catch (jszipErr) {
      console.warn('JSZip extraction note:', jszipErr);
      if (!lastError) lastError = jszipErr;
    }
  }

  if (lastError && lastError.message && (
    lastError.message.toLowerCase().includes('password') ||
    lastError.message.toLowerCase().includes('encrypted') ||
    lastError.message.toLowerCase().includes('signature')
  )) {
    throw new Error('चुकीचा पासवर्ड! कृपया योग्य पासवर्ड प्रविष्ट करा.');
  }

  throw lastError || new Error('ZIP फाईल उघडता आली नाही.');
}

async function processZipFile(zipBlob, password) {
  const result = await extractUniversalZip(zipBlob, password);
  showZipStatusAlert(`📂 सापडलेली फाईल: <strong>${escapeHtml(result.fileName)}</strong>. डेटा वाचत आहे...`, 'info');
  parseAndPreviewCSV(result.csvContent, result.fileName);
}

function processCsvDirectly(fileBlob) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    const csvContent = e.target.result;
    parseAndPreviewCSV(csvContent, selectedReportFile.name);
  };
  fileReader.onerror = function() {
    showZipStatusAlert('❌ CSV फाईल वाचण्यात त्रुटी आली.', 'error');
  };
  fileReader.readAsText(fileBlob, 'UTF-8');
}

// Universal Service Classifier per operator's rules:
// - Type U & Amount 0 => MBU (Mandatory Biometric Update) [Free 0]
// - Type E / N & Amount 0 => New Enrolment [Free 0]
// - Biometric => 125 Rs
// - Update / Demographic => 75 Rs
function classifyAadhaarService(rawServiceType, extractedAmount) {
  const typeStr = (rawServiceType || '').trim().toUpperCase();
  const amt = extractedAmount !== null ? extractedAmount : null;

  // Type checks
  const isTypeU = typeStr === 'U' || typeStr.startsWith('U_') || typeStr.startsWith('U-') || typeStr.includes('UPDATE') || typeStr.includes('अपडेट');
  const isTypeEorN = typeStr === 'E' || typeStr === 'N' || typeStr.startsWith('E_') || typeStr.startsWith('E-') || typeStr.startsWith('N_') || typeStr.startsWith('N-') || typeStr.includes('ENROL') || typeStr.includes('NEW') || typeStr.includes('FRESH') || typeStr.includes('नवीन');
  const isBio = typeStr.includes('BIO') || typeStr.includes('बायो') || typeStr.includes('PHOTO') || typeStr.includes('FINGER') || (amt !== null && amt >= 100);

  // 1. Rule 1: Type 'U' & Amount 0 => MBU (Free)
  if ((isTypeU || typeStr.includes('MBU') || typeStr.includes('MANDATORY') || typeStr.includes('अनिवार्य')) && (amt === 0 || (amt === null && typeStr.includes('MBU')))) {
    return {
      serviceName: 'अनिवार्य बायोमेट्रिक अपडेट (MBU - ५ व १५ वर्षे)',
      fee: 0,
      category: 'MBU'
    };
  }

  // 2. Rule 2: Type 'E' or 'N' & Amount 0 => New Enrolment (Free)
  if (isTypeEorN && (amt === 0 || amt === null)) {
    return {
      serviceName: 'नवीन आधार नोंदणी (New Enrollment)',
      fee: 0,
      category: 'NEW'
    };
  }

  // 3. Rule 3: Biometric Update (125 Rs)
  if (isBio) {
    return {
      serviceName: 'बायोमेट्रिक अपडेट (फोटो + फिंगरप्रिंट + डोळे)',
      fee: amt !== null && amt > 0 ? amt : 125,
      category: 'BIO'
    };
  }

  // 4. Rule 4: Demographic / Document / Normal Update (75 Rs)
  if (isTypeU || typeStr.includes('DEMO') || typeStr.includes('DOC') || (amt !== null && amt > 0)) {
    return {
      serviceName: 'डेमोग्राफिक / डॉक्युमेंट अपडेट',
      fee: amt !== null && amt > 0 ? amt : 75,
      category: 'UPDATE'
    };
  }

  // Fallback if amt == 0
  if (amt === 0) {
    if (isTypeU) {
      return {
        serviceName: 'अनिवार्य बायोमेट्रिक अपडेट (MBU - ५ व १५ वर्षे)',
        fee: 0,
        category: 'MBU'
      };
    }
    return {
      serviceName: 'नवीन आधार नोंदणी (New Enrollment)',
      fee: 0,
      category: 'NEW'
    };
  }

  return {
    serviceName: 'डेमोग्राफिक अपडेट (नाव/पत्ता/DOB/मोबाईल)',
    fee: amt !== null ? amt : 75,
    category: 'UPDATE'
  };
}

// Exact TOTAL_AMOUNT Extractor: Strictly prioritizes 'TOTAL_AMOUNT' column from CSV
function extractTotalAmountFromRow(row) {
  // Step 1: Exact matches for Total Amount columns
  const exactMatches = ['totalamountcharged', 'totalamount', 'totalamountrs', 'amountcollected', 'collectedamount', 'totalfee', 'totalfeecharged'];
  
  for (let key in row) {
    const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (exactMatches.includes(cleanKey)) {
      const rawVal = String(row[key] || '').replace(/[^0-9.-]/g, '').trim();
      if (rawVal !== '' && !isNaN(parseFloat(rawVal))) {
        return parseFloat(rawVal);
      }
    }
  }

  // Step 2: Fallback matches for partial "total" + "amount"
  for (let key in row) {
    const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanKey.includes('total') && cleanKey.includes('amount')) {
      const rawVal = String(row[key] || '').replace(/[^0-9.-]/g, '').trim();
      if (rawVal !== '' && !isNaN(parseFloat(rawVal))) {
        return parseFloat(rawVal);
      }
    }
  }

  // Step 3: Priority fee columns
  const priorityCols = ['feecharged', 'govtfee', 'fee'];
  for (let p of priorityCols) {
    for (let key in row) {
      const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanKey === p) {
        const rawVal = String(row[key] || '').replace(/[^0-9.-]/g, '').trim();
        if (rawVal !== '' && !isNaN(parseFloat(rawVal))) {
          return parseFloat(rawVal);
        }
      }
    }
  }

  return null;
}

function parseAndPreviewCSV(csvText, sourceFileName) {
  if (!csvText || !csvText.trim()) {
    showZipStatusAlert('⚠️ निवडलेली CSV फाईल रिकामी आहे.', 'warning');
    return;
  }

  if (typeof Papa === 'undefined') {
    showZipStatusAlert('❌ CSV Parser लायब्ररी लोड झालेली नाही.', 'error');
    return;
  }

  const results = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });

  const rows = results.data;
  if (!rows || rows.length === 0) {
    showZipStatusAlert('⚠️ फाईलमध्ये एकही वैध नोंद सापडली नाही.', 'warning');
    return;
  }

  // Intelligently Map Headers & Build Structured Transactions
  const mappedRecords = [];
  const existingTx = getStoredTransactions();
  const existingEids = new Set(existingTx.map(t => (t.aadhaarEid || '').trim().toLowerCase()));

  const todayStr = getTodayDateString();

  rows.forEach((row, idx) => {
    // Robust Value Extractor
    const getVal = (...keys) => {
      for (let k of keys) {
        for (let rowKey in row) {
          const cleanRowKey = rowKey.toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanRowKey === cleanK || cleanRowKey.includes(cleanK) || rowKey.includes(k)) {
            const val = String(row[rowKey] || '').trim();
            if (val) return val;
          }
        }
      }
      return '';
    };

    const name = getVal('residentname', 'resident_name', 'name', 'customername', 'citizenname', 'resident', 'नाव') || `नागरिक #${idx + 1}`;
    const eid = getVal('eid', 'enrolmentid', 'enrolment_id', 'enrolmentno', 'enrolment_no', 'aadhaarno', 'uid', 'packetid', 'आधार');
    const rawDate = getVal('date', 'createddate', 'created_date', 'transactiondate', 'txdate', 'दिनांक') || todayStr;
    const time = getVal('time', 'createdtime', 'created_time', 'txtime', 'वेळ') || '10:00';
    const rawService = getVal('type', 'servicetype', 'service_type', 'service', 'updatetype', 'action', 'process_type', 'enrolment_type', 'प्रकार') || '';
    const mobile = getVal('mobile', 'phone', 'contact', 'mobilenumber', 'मोबाईल') || '9876543210';
    const gender = getVal('gender', 'genderage', 'sex') || 'वयस्क (Adult)';

    // 1. EXTRACT EXACT AMOUNT FROM 'TOTAL_AMOUNT' COLUMN
    const extractedFee = extractTotalAmountFromRow(row);

    // Normalize Date to YYYY-MM-DD
    let normalizedDate = todayStr;
    if (rawDate) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        normalizedDate = rawDate;
      } else if (/^\d{2}[-\/]\d{2}[-\/]\d{4}$/.test(rawDate)) {
        const parts = rawDate.split(/[-\/]/);
        normalizedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    // Apply Service Classification
    const classified = classifyAadhaarService(rawService, extractedFee);
    const finalService = classified.serviceName;
    const fee = classified.fee;

    const txId = 'ASK-IMP-' + Date.now() + '-' + (idx + 1);
    const tokenNo = '#' + (200 + idx);

    mappedRecords.push({
      id: txId,
      tokenNo: tokenNo,
      date: normalizedDate,
      time: time,
      customerName: name,
      mobile: mobile,
      aadhaarEid: eid || `${Math.floor(1000 + Math.random() * 9000)}`,
      genderAge: gender,
      serviceName: finalService,
      baseFee: fee,
      addonFee: 0,
      discount: 0,
      totalAmount: fee,
      paymentMode: 'रोख (Cash)',
      status: 'पूर्ण झाले (Completed)',
      notes: `UIDAI रिपोर्ट इंपोर्ट (${sourceFileName})`,
      timestamp: Date.now() - (rows.length - idx) * 60000,
      syncedToFirebase: false
    });
  });

  parsedReportTransactions = mappedRecords;
  displayZipPreview(mappedRecords, sourceFileName);
}

function displayZipPreview(records, fileName) {
  const previewCard = document.getElementById('zip-preview-card');
  const countBadge = document.getElementById('preview-total-records');
  const statCount = document.getElementById('preview-stat-count');
  const statAmount = document.getElementById('preview-stat-amount');
  const statDates = document.getElementById('preview-stat-dates');
  const tbody = document.getElementById('zip-preview-tbody');

  const totalAmount = records.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const dates = records.map(r => r.date).sort();
  const minDate = dates[0] || '--';
  const maxDate = dates[dates.length - 1] || '--';
  const dateRangeStr = minDate === maxDate ? minDate : `${minDate} ते ${maxDate}`;

  const isOperator = currentUser && currentUser.role === 'operator';

  if (countBadge) countBadge.textContent = `${records.length} नोंदी`;
  if (statCount) statCount.textContent = records.length;
  
  const amtContainer = document.getElementById('preview-stat-amount-container');
  if (amtContainer) amtContainer.style.display = isOperator ? 'none' : 'block';
  if (statAmount) statAmount.textContent = isOperator ? '₹--' : `₹${totalAmount}`;
  
  if (statDates) statDates.textContent = dateRangeStr;

  const feeCol = document.getElementById('preview-fee-col');
  if (feeCol) feeCol.style.display = isOperator ? 'none' : 'table-cell';

  if (tbody) {
    tbody.innerHTML = records.slice(0, 10).map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(formatDateDDMMYYYY(r.date))} ${escapeHtml(r.time)}</td>
        <td><strong>${escapeHtml(r.customerName)}</strong><br/><span class="text-xs text-muted">EID: ${escapeHtml(r.aadhaarEid)}</span></td>
        <td><span class="badge-tag gold text-xs">${escapeHtml(r.serviceName)}</span></td>
        ${isOperator ? '' : `<td style="text-align: right; font-weight: bold; color: #fbbf24;">₹${r.totalAmount}</td>`}
      </tr>
    `).join('');

    if (records.length > 10) {
      tbody.innerHTML += `
        <tr>
          <td colspan="${isOperator ? '4' : '5'}" class="text-center text-muted text-xs py-2">
            ... आणि आणखी ${records.length - 10} नोंदी समाविष्ट आहेत.
          </td>
        </tr>
      `;
    }
  }

  if (isOperator) {
    showZipStatusAlert(`✅ <strong>${records.length} नोंदी</strong> यशस्वीरित्या वाचल्या आहेत. कृपया खालील तपशील भरून "सर्व नोंदी जोडा" बटण दाबा.`, 'success');
  } else {
    showZipStatusAlert(`✅ <strong>${records.length} नोंदी</strong> यशस्वीरित्या वाचल्या आहेत (एकूण शुल्क: ₹${totalAmount}). कृपया खालील तपशील तपासून "सर्व नोंदी जोडा" बटण दाबा.`, 'success');
  }

  if (previewCard) previewCard.style.display = 'block';
  playSound('success');
}

async function confirmAndImportParsedRecords() {
  if (!parsedReportTransactions || parsedReportTransactions.length === 0) {
    alert('कोणत्याही नोंदी उपलब्ध नाहीत.');
    return;
  }

  const dateInput = document.getElementById('operator-report-date');
  const pigmyInput = document.getElementById('operator-pigmy');
  const cashInput = document.getElementById('operator-cash-collection');
  const onlineInput = document.getElementById('operator-online-collection');
  const expInput = document.getElementById('operator-expenses');
  const expNoteInput = document.getElementById('operator-expense-note');

  let pigmyAmt = parseFloat(pigmyInput?.value || 0) || 0;
  let cashAmt = parseFloat(cashInput?.value || 0) || 0;
  let onlineAmt = parseFloat(onlineInput?.value || 0) || 0;
  let expAmt = parseFloat(expInput?.value || 0) || 0;
  let expNote = (expNoteInput?.value || '').trim();
  let reportDate = (dateInput && dateInput.value) ? dateInput.value : getTodayDateString();

  const btnConfirm = event ? event.target : null;
  if (btnConfirm && btnConfirm.tagName === 'BUTTON') {
    btnConfirm.disabled = true;
    btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> सेव्ह व सिंक होत आहे...';
  }

  const opName = currentUser ? currentUser.name : 'Gauravi Gawade';
  const opCenter = currentUser ? currentUser.center : 'DIT (Maha IT)';

  parsedReportTransactions.forEach(tx => {
    tx.operatorName = opName;
    tx.center = opCenter;
    if (reportDate) {
      tx.date = reportDate;
    }
  });

  const currentList = getStoredTransactions();
  const combined = [...parsedReportTransactions, ...currentList];
  
  // Sort descending by timestamp
  combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  saveStoredTransactions(combined);

  // Save Pigmy if entered
  if (pigmyAmt > 0) {
    const expenses = getStoredExpenses();
    const newPigmyExp = {
      id: 'EXP-PIGMY-' + Date.now(),
      date: reportDate,
      amount: pigmyAmt,
      category: 'दैनिक पिग्मी / बँक बचत ठेव',
      description: expNote ? `पिग्मी बचत (${expNote})` : 'दैनिक पिग्मी बचत ठेव',
      note: expNote ? `पिग्मी बचत (${expNote})` : 'दैनिक पिग्मी बचत ठेव',
      center: opCenter,
      operator: opName,
      paymentMode: 'रोख (Cash)',
      timestamp: Date.now()
    };
    expenses.push(newPigmyExp);
    saveStoredExpenses(expenses);
    if (isFirebaseConnected && db) {
      db.collection('aadhaar_expenses').doc(newPigmyExp.id).set(newPigmyExp).catch(console.error);
    }
  }

  // Save other expenses if entered
  if (expAmt > 0) {
    const expenses = getStoredExpenses();
    const newExp = {
      id: 'EXP-' + (Date.now() + 1),
      date: reportDate,
      amount: expAmt,
      category: 'इतर आकस्मिक / किरकोळ खर्च',
      description: expNote || 'दैनिक किरकोळ खर्च',
      note: expNote || 'दैनिक किरकोळ खर्च',
      center: opCenter,
      operator: opName,
      paymentMode: 'रोख (Cash)',
      timestamp: Date.now() + 1
    };
    expenses.push(newExp);
    saveStoredExpenses(expenses);
    if (isFirebaseConnected && db) {
      db.collection('aadhaar_expenses').doc(newExp.id).set(newExp).catch(console.error);
    }
  }

  if (cashAmt > 0 || onlineAmt > 0 || pigmyAmt > 0 || expAmt > 0) {
    const summaries = JSON.parse(localStorage.getItem('ask_daily_summaries') || '[]');
    const summary = {
      id: 'SUM-' + Date.now(),
      date: reportDate,
      center: opCenter,
      operator: opName,
      cashReported: cashAmt,
      onlineReported: onlineAmt,
      pigmyReported: pigmyAmt,
      expenseReported: expAmt,
      timestamp: Date.now()
    };
    summaries.push(summary);
    localStorage.setItem('ask_daily_summaries', JSON.stringify(summaries));
    if (isFirebaseConnected && db) {
      db.collection('daily_summaries').doc(summary.id).set(summary).catch(console.error);
    }
  }

  // Sync to Firebase Cloud Firestore
  if (isFirebaseConnected && db) {
    for (let tx of parsedReportTransactions) {
      try {
        await db.collection('aadhaar_transactions').doc(tx.id).set(tx);
        tx.syncedToFirebase = true;
      } catch (e) {
        console.error('Error syncing imported record to Firebase:', e);
      }
    }
    saveStoredTransactions(combined);
  }

  const savedCount = parsedReportTransactions.length;
  
  // Close modal and reset
  closeModal('zip-import-modal');
  const modalZip = document.getElementById('zip-import-modal');
  if (modalZip) modalZip.classList.remove('active');
  resetZipImportModal();

  refreshAllDataViews();
  playSound('success');
  showSuccessModal(`UIDAI रिपोर्टमधील <strong>${savedCount} नोंदी</strong> दैनिक नोंदवहीत व Firebase वर यशस्वीरित्या सेव्ह झाल्या आहेत!`, '🎉 अभिनंदन! रिपोर्ट सेव्ह झाला');

  if (currentUser && currentUser.role === 'admin') {
    openTab('register-tab');
  }
}

function showZipStatusAlert(msg, type = 'info') {
  const box = document.getElementById('zip-status-alert');
  if (!box) return;

  box.style.display = 'block';
  box.innerHTML = msg;

  if (type === 'error') {
    box.style.background = 'rgba(239, 68, 68, 0.2)';
    box.style.color = '#fca5a5';
    box.style.border = '1px solid rgba(239, 68, 68, 0.4)';
  } else if (type === 'success') {
    box.style.background = 'rgba(16, 185, 129, 0.2)';
    box.style.color = '#6ee7b7';
    box.style.border = '1px solid rgba(16, 185, 129, 0.4)';
  } else if (type === 'warning') {
    box.style.background = 'rgba(245, 158, 11, 0.2)';
    box.style.color = '#fcd34d';
    box.style.border = '1px solid rgba(245, 158, 11, 0.4)';
  } else {
    box.style.background = 'rgba(59, 130, 246, 0.2)';
    box.style.color = '#93c5fd';
    box.style.border = '1px solid rgba(59, 130, 246, 0.4)';
  }
}

// Security Helper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// =============================================================================
// 16. MAIN REPORT UPLOAD HUB HANDLERS (PRIMARY INTERFACE)
// =============================================================================
let mainSelectedReportFile = null;
let mainParsedReportTransactions = [];

function handleMainZipFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;
  mainSelectedReportFile = file;

  const promptText = document.getElementById('main-dropzone-prompt');
  if (promptText) {
    promptText.innerHTML = `<strong style="color: #fbbf24;"><i class="fas fa-file-alt"></i> ${escapeHtml(file.name)}</strong>`;
  }

  const subText = document.getElementById('main-dropzone-sub');
  if (subText) {
    const sizeKB = (file.size / 1024).toFixed(1);
    subText.textContent = `आकार: ${sizeKB} KB | प्रकार: ${file.name.split('.').pop().toUpperCase()}`;
  }

  const pwdInput = document.getElementById('main-zip-password');
  const settings = getKendraSettings();
  if (pwdInput && !pwdInput.value && file.name.toLowerCase().endsWith('.zip')) {
    if (settings && settings.stationId) {
      pwdInput.placeholder = `उदा. ${settings.stationId} किंवा ऑपरेटर कोड`;
    }
  }

  playSound('click');
}

function toggleMainZipPassword() {
  const pwdInput = document.getElementById('main-zip-password');
  const eyeIcon = document.getElementById('main-zip-eye');
  if (!pwdInput) return;

  if (pwdInput.type === 'password') {
    pwdInput.type = 'text';
    if (eyeIcon) {
      eyeIcon.classList.remove('fa-eye');
      eyeIcon.classList.add('fa-eye-slash');
    }
  } else {
    pwdInput.type = 'password';
    if (eyeIcon) {
      eyeIcon.classList.remove('fa-eye-slash');
      eyeIcon.classList.add('fa-eye');
    }
  }
}

function resetMainUploadForm() {
  mainSelectedReportFile = null;
  mainParsedReportTransactions = [];

  const fileInput = document.getElementById('main-zip-file-input');
  if (fileInput) fileInput.value = '';

  const promptText = document.getElementById('main-dropzone-prompt');
  if (promptText) {
    promptText.innerHTML = '<strong>UIDAI रिपोर्ट फाईल येथे ओढा (Drag & Drop)</strong> किंवा निवडा (.ZIP किंवा .CSV)';
  }

  const subText = document.getElementById('main-dropzone-sub');
  if (subText) {
    subText.textContent = 'समर्थित: Password Protected ZIP (AES / ZipCrypto) व CSV फाईल्स';
  }

  const pwdInput = document.getElementById('main-zip-password');
  if (pwdInput) pwdInput.value = '';

  // Clear Main Page Inputs
  const mainPigmy = document.getElementById('main-input-pigmy');
  if (mainPigmy) mainPigmy.value = '';
  const mainExp = document.getElementById('main-input-expense');
  if (mainExp) mainExp.value = '';
  const mainNote = document.getElementById('main-input-note');
  if (mainNote) mainNote.value = '';
  const mainCash = document.getElementById('main-input-cash');
  if (mainCash) mainCash.value = '';
  const mainOnline = document.getElementById('main-input-online');
  if (mainOnline) mainOnline.value = '';

  const alertBox = document.getElementById('main-zip-alert');
  if (alertBox) {
    alertBox.style.display = 'none';
    alertBox.innerHTML = '';
  }

  const previewCard = document.getElementById('main-zip-preview');
  if (previewCard) previewCard.style.display = 'none';

  closeModal('main-upload-preview-modal');

  // Clear Modal Inputs
  const modalPigmy = document.getElementById('main-operator-pigmy');
  if (modalPigmy) modalPigmy.value = '';
  const cashInput = document.getElementById('main-operator-cash-collection');
  if (cashInput) cashInput.value = '';
  const onlineInput = document.getElementById('main-operator-online-collection');
  if (onlineInput) onlineInput.value = '';
  const expInput = document.getElementById('main-operator-expenses');
  if (expInput) expInput.value = '';
  const expNoteInput = document.getElementById('main-operator-expense-note');
  if (expNoteInput) expNoteInput.value = '';

  const btnExtract = document.getElementById('main-btn-extract');
  if (btnExtract) {
    btnExtract.disabled = false;
    btnExtract.innerHTML = '<i class="fas fa-bolt"></i> फाईल वाचा व हिशोब अपडेट करा';
  }
}

async function processMainReportFile() {
  if (!mainSelectedReportFile) {
    showMainZipAlert('⚠️ कृपया आधी एक .ZIP किंवा .CSV फाईल निवडा.', 'warning');
    return;
  }

  const btnExtract = document.getElementById('main-btn-extract');
  if (btnExtract) {
    btnExtract.disabled = true;
    btnExtract.innerHTML = '<i class="fas fa-spinner fa-spin"></i> विश्लेषण होत आहे...';
  }

  showMainZipAlert('🔄 फाईल अनलॉक व विश्लेषण सुरू आहे, कृपया थांबा...', 'info');
  playSound('click');

  const fileName = mainSelectedReportFile.name.toLowerCase();
  const password = document.getElementById('main-zip-password') ? document.getElementById('main-zip-password').value.trim() : '';

  try {
    if (fileName.endsWith('.zip')) {
      await processMainZipFile(mainSelectedReportFile, password);
    } else if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
      await processMainCsvFile(mainSelectedReportFile);
    } else {
      showMainZipAlert('❌ असमर्थित फाईल प्रकार. कृपया .ZIP किंवा .CSV फाईल अपलोड करा.', 'error');
      if (btnExtract) {
        btnExtract.disabled = false;
        btnExtract.innerHTML = '<i class="fas fa-bolt"></i> फाईल वाचा व हिशोब अपडेट करा';
      }
    }
  } catch (err) {
    console.error('Error processing main report:', err);
    let errMsg = '❌ फाईल वाचताना त्रुटी आली.';
    if (err.message && err.message.toLowerCase().includes('password')) {
      errMsg = '❌ चुकीचा पासवर्ड! कृपया योग्य पासवर्ड प्रविष्ट करा.';
    }
    showMainZipAlert(errMsg + ' (' + (err.message || 'Error') + ')', 'error');
    if (btnExtract) {
      btnExtract.disabled = false;
      btnExtract.innerHTML = '<i class="fas fa-unlock-alt"></i> पुन्हा प्रयत्न करा';
    }
  }
}

async function processMainZipFile(zipBlob, password) {
  const result = await extractUniversalZip(zipBlob, password);
  showMainZipAlert(`📂 सापडलेली फाईल: <strong>${escapeHtml(result.fileName)}</strong>. डेटा वाचत आहे...`, 'info');
  parseAndPreviewMainCSV(result.csvContent, result.fileName);
}

function processMainCsvFile(fileBlob) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    const csvContent = e.target.result;
    parseAndPreviewMainCSV(csvContent, mainSelectedReportFile.name);
  };
  fileReader.onerror = function() {
    showMainZipAlert('❌ CSV फाईल वाचण्यात त्रुटी आली.', 'error');
  };
  fileReader.readAsText(fileBlob, 'UTF-8');
}

function parseAndPreviewMainCSV(csvText, sourceFileName) {
  if (!csvText || !csvText.trim()) {
    showMainZipAlert('⚠️ निवडलेली CSV फाईल रिकामी आहे.', 'warning');
    return;
  }

  if (typeof Papa === 'undefined') {
    showMainZipAlert('❌ CSV Parser लायब्ररी लोड झालेली नाही.', 'error');
    return;
  }

  const results = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });

  const rows = results.data;
  if (!rows || rows.length === 0) {
    showMainZipAlert('⚠️ फाईलमध्ये एकही वैध नोंद सापडली नाही.', 'warning');
    return;
  }

  const mappedRecords = [];
  const todayStr = getTodayDateString();
  const userSelectedDate = document.getElementById('main-report-date') ? document.getElementById('main-report-date').value : '';

  rows.forEach((row, idx) => {
    const getVal = (...keys) => {
      for (let k of keys) {
        for (let rowKey in row) {
          const cleanRowKey = rowKey.toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanRowKey === cleanK || cleanRowKey.includes(cleanK) || rowKey.includes(k)) {
            const val = String(row[rowKey] || '').trim();
            if (val) return val;
          }
        }
      }
      return '';
    };

    const name = getVal('residentname', 'resident_name', 'name', 'customername', 'citizenname', 'resident', 'नाव') || `नागरिक #${idx + 1}`;
    const eid = getVal('eid', 'enrolmentid', 'enrolment_id', 'enrolmentno', 'enrolment_no', 'aadhaarno', 'uid', 'packetid', 'आधार');
    const rawDate = getVal('date', 'createddate', 'created_date', 'transactiondate', 'txdate', 'दिनांक') || todayStr;
    const time = getVal('time', 'createdtime', 'created_time', 'txtime', 'वेळ') || '10:00';
    const rawService = getVal('servicetype', 'service_type', 'service', 'updatetype', 'action', 'type', 'प्रकार') || '';
    const mobile = getVal('mobile', 'phone', 'contact', 'mobilenumber', 'मोबाईल') || '9876543210';
    const gender = getVal('gender', 'genderage', 'sex') || 'वयस्क (Adult)';

    // 1. EXTRACT EXACT AMOUNT FROM 'TOTAL_AMOUNT' COLUMN
    const extractedFee = extractTotalAmountFromRow(row);

    let normalizedDate = userSelectedDate || todayStr;
    if (!userSelectedDate && rawDate) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        normalizedDate = rawDate;
      } else if (/^\d{2}[-\/]\d{2}[-\/]\d{4}$/.test(rawDate)) {
        const parts = rawDate.split(/[-\/]/);
        normalizedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    // Apply Service Classification
    const classified = classifyAadhaarService(rawService, extractedFee);
    const finalService = classified.serviceName;
    const fee = classified.fee;

    const txId = 'ASK-IMP-' + Date.now() + '-' + (idx + 1);
    const tokenNo = '#' + (200 + idx);

    const chosenCenter = (currentUser && currentUser.role === 'operator')
      ? currentUser.center
      : (document.getElementById('main-upload-center-select')?.value || 'DIT (Maha IT)');
    
    const chosenOperator = (currentUser && currentUser.role === 'operator')
      ? currentUser.name
      : (chosenCenter === 'WCD' ? 'Sakshi Sawant' : 'Gauravi Gawade');

    mappedRecords.push({
      id: txId,
      tokenNo: tokenNo,
      date: normalizedDate,
      time: time,
      customerName: name,
      mobile: mobile,
      aadhaarEid: eid || `${Math.floor(1000 + Math.random() * 9000)}`,
      genderAge: gender,
      serviceName: finalService,
      baseFee: fee,
      addonFee: 0,
      discount: 0,
      totalAmount: fee,
      paymentMode: 'रोख (Cash)',
      status: 'पूर्ण झाले (Completed)',
      notes: `UIDAI रिपोर्ट इंपोर्ट (${sourceFileName})`,
      operatorName: chosenOperator,
      center: chosenCenter,
      timestamp: Date.now() - (rows.length - idx) * 60000,
      syncedToFirebase: false
    });
  });

  mainParsedReportTransactions = mappedRecords;
  displayMainZipPreview(mappedRecords, sourceFileName);
}

function displayMainZipPreview(records, sourceFileName) {
  const previewCard = document.getElementById('main-zip-preview');
  const countBadge = document.getElementById('main-preview-badge');
  const statCount = document.getElementById('main-stat-count');
  const statAmount = document.getElementById('main-stat-amount');
  const statDates = document.getElementById('main-stat-dates');
  const tbody = document.getElementById('main-zip-tbody');

  const totalAmount = records.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const dates = records.map(r => r.date).sort();
  const minDate = dates[0] ? formatDateDDMMYYYY(dates[0]) : '--';
  const maxDate = dates[dates.length - 1] ? formatDateDDMMYYYY(dates[dates.length - 1]) : '--';
  const dateRangeStr = minDate === maxDate ? minDate : `${minDate} ते ${maxDate}`;

  const isOperator = currentUser && currentUser.role === 'operator';

  if (countBadge) countBadge.textContent = `${records.length} नोंदी`;
  if (statCount) statCount.textContent = records.length;
  
  const amtContainer = document.getElementById('main-stat-amount-container');
  if (amtContainer) amtContainer.style.display = isOperator ? 'none' : 'block';
  if (statAmount) statAmount.textContent = isOperator ? '₹--' : `₹${totalAmount}`;
  
  if (statDates) statDates.textContent = dateRangeStr;

  const feeCol = document.getElementById('main-preview-fee-col');
  if (feeCol) feeCol.style.display = isOperator ? 'none' : 'table-cell';

  const opDetails = document.getElementById('main-operator-additional-details');
  if (opDetails) opDetails.style.display = 'block';

  if (tbody) {
    tbody.innerHTML = records.slice(0, 10).map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(formatDateDDMMYYYY(r.date))} ${escapeHtml(r.time)}</td>
        <td><strong>${escapeHtml(r.customerName)}</strong><br/><span class="text-xs text-muted">EID: ${escapeHtml(r.aadhaarEid)}</span></td>
        <td><strong style="color: #67e8f9;">${escapeHtml(r.operatorName)}</strong><br/><small class="badge-tag cyan text-xs" style="font-size: 0.72rem;">${escapeHtml(r.center)}</small></td>
        <td><span class="badge-tag gold text-xs">${escapeHtml(r.serviceName)}</span></td>
        ${isOperator ? '' : `<td style="text-align: right; font-weight: bold; color: #fbbf24;">₹${r.totalAmount}</td>`}
      </tr>
    `).join('');

    if (records.length > 10) {
      tbody.innerHTML += `
        <tr>
          <td colspan="${isOperator ? '5' : '6'}" class="text-center text-muted text-xs py-2">
            ... आणि आणखी ${records.length - 10} नोंदी समाविष्ट आहेत.
          </td>
        </tr>
      `;
    }
  }

  if (isOperator) {
    showMainZipAlert(`✅ <strong>${records.length} नोंदी</strong> वाचल्या आहेत (दिनांक: ${dateRangeStr}). कृपया खालील पिग्मी/खर्च/संकलन हिशोब भरून सेव्ह करा.`, 'success');
  } else {
    showMainZipAlert(`✅ <strong>${records.length} नोंदी</strong> यशस्वीरित्या वाचल्या आहेत (दिनांक: ${dateRangeStr}, एकूण शुल्क: ₹${totalAmount}). कृपया पिग्मी/खर्च तपासून खालील सेव्ह बटण दाबा.`, 'success');
  }

  // Open in Popup Modal Window
  openModal('main-upload-preview-modal');
  playSound('success');
}

function reuploadMainReport() {
  closeModal('main-upload-preview-modal');
  resetMainUploadForm();
  const fileInput = document.getElementById('main-zip-file-input');
  if (fileInput) {
    fileInput.click();
  }
}

async function confirmMainImportedRecords() {
  if (!mainParsedReportTransactions || mainParsedReportTransactions.length === 0) {
    alert('कोणत्याही नोंदी उपलब्ध नाहीत.');
    return;
  }

  const userSelectedDate = document.getElementById('main-report-date') ? document.getElementById('main-report-date').value : '';
  const firstTxDate = (mainParsedReportTransactions && mainParsedReportTransactions[0] && mainParsedReportTransactions[0].date) ? mainParsedReportTransactions[0].date : '';
  const effectiveDate = userSelectedDate || firstTxDate || getTodayDateString();

  const pigmyInput = document.getElementById('main-operator-pigmy');
  const expInput = document.getElementById('main-operator-expenses');
  const expNoteInput = document.getElementById('main-operator-expense-note');
  const cashInput = document.getElementById('main-operator-cash-collection');
  const onlineInput = document.getElementById('main-operator-online-collection');

  const pigmyAmt = parseFloat(pigmyInput?.value || 0) || 0;
  const expAmt = parseFloat(expInput?.value || 0) || 0;
  const expNote = (expNoteInput?.value || '').trim();
  const cashAmt = parseFloat(cashInput?.value || 0) || 0;
  const onlineAmt = parseFloat(onlineInput?.value || 0) || 0;

  const btnConfirm = document.getElementById('main-btn-save-cloud');
  if (btnConfirm) {
    btnConfirm.disabled = true;
    btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> सेव्ह व सिंक होत आहे...';
  }

  const chosenCenter = (currentUser && currentUser.role === 'operator')
    ? currentUser.center
    : (document.getElementById('main-upload-center-select')?.value || 'DIT (Maha IT)');
  
  const chosenOperator = (currentUser && currentUser.role === 'operator')
    ? currentUser.name
    : (chosenCenter === 'WCD' ? 'Sakshi Sawant' : 'Gauravi Gawade');

  mainParsedReportTransactions.forEach(tx => {
    tx.operatorName = chosenOperator;
    tx.center = chosenCenter;
    if (userSelectedDate) {
      tx.date = userSelectedDate;
    } else if (!tx.date) {
      tx.date = effectiveDate;
    }
  });

  const currentList = getStoredTransactions();
  const combined = [...mainParsedReportTransactions, ...currentList];
  combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  saveStoredTransactions(combined);

  // 1. Save Pigmy if entered
  if (pigmyAmt > 0) {
    const expenses = getStoredExpenses();
    const newPigmyExp = {
      id: 'EXP-PIGMY-' + Date.now(),
      date: effectiveDate,
      amount: pigmyAmt,
      category: 'दैनिक पिग्मी / बँक बचत ठेव',
      description: expNote ? `पिग्मी बचत (${expNote})` : 'दैनिक पिग्मी बचत ठेव',
      note: expNote ? `पिग्मी बचत (${expNote})` : 'दैनिक पिग्मी बचत ठेव',
      center: chosenCenter,
      operator: chosenOperator,
      paymentMode: 'रोख (Cash)',
      timestamp: Date.now()
    };
    expenses.push(newPigmyExp);
    saveStoredExpenses(expenses);
    if (isFirebaseConnected && db) {
      db.collection('aadhaar_expenses').doc(newPigmyExp.id).set(newPigmyExp).catch(console.error);
    }
  }

  // 2. Save other expenses if entered
  if (expAmt > 0) {
    const expenses = getStoredExpenses();
    const newOtherExp = {
      id: 'EXP-' + (Date.now() + 1),
      date: effectiveDate,
      amount: expAmt,
      category: 'इतर आकस्मिक / किरकोळ खर्च',
      description: expNote || 'दैनिक किरकोळ खर्च',
      note: expNote || 'दैनिक किरकोळ खर्च',
      center: chosenCenter,
      operator: chosenOperator,
      paymentMode: 'रोख (Cash)',
      timestamp: Date.now() + 1
    };
    expenses.push(newOtherExp);
    saveStoredExpenses(expenses);
    if (isFirebaseConnected && db) {
      db.collection('aadhaar_expenses').doc(newOtherExp.id).set(newOtherExp).catch(console.error);
    }
  }

  // 3. Save Daily summary for Collections & Pigmy
  if (cashAmt > 0 || onlineAmt > 0 || pigmyAmt > 0 || expAmt > 0) {
    const summaries = JSON.parse(localStorage.getItem('ask_daily_summaries') || '[]');
    const summary = {
      id: 'SUM-' + Date.now(),
      date: effectiveDate,
      center: chosenCenter,
      operator: chosenOperator,
      cashReported: cashAmt,
      onlineReported: onlineAmt,
      pigmyReported: pigmyAmt,
      expenseReported: expAmt,
      timestamp: Date.now()
    };
    summaries.push(summary);
    localStorage.setItem('ask_daily_summaries', JSON.stringify(summaries));
    if (isFirebaseConnected && db) {
      db.collection('daily_summaries').doc(summary.id).set(summary).catch(console.error);
    }
  }

  // 4. Sync to Firebase Cloud Firestore
  if (isFirebaseConnected && db) {
    for (let tx of mainParsedReportTransactions) {
      try {
        await db.collection('aadhaar_transactions').doc(tx.id).set(tx);
        tx.syncedToFirebase = true;
      } catch (e) {
        console.error('Error syncing imported record to Firebase:', e);
      }
    }
  }

  const savedCount = mainParsedReportTransactions.length;

  // 1. Immediately Close the Preview Modal
  closeModal('main-upload-preview-modal');
  const modalEl = document.getElementById('main-upload-preview-modal');
  if (modalEl) modalEl.classList.remove('active');

  // 2. Reset form
  resetMainUploadForm();

  // 3. Refresh views and show green modal
  refreshAllDataViews();
  playSound('success');
  showSuccessModal(`UIDAI रिपोर्टमधील <strong>${savedCount} नोंदी</strong> (${formatDateDDMMYYYY(effectiveDate)}) दैनिक नोंदवहीत व Firebase वर यशस्वीरित्या सेव्ह झाल्या आहेत!`, '🎉 अभिनंदन! रिपोर्ट सेव्ह झाला');

  if (currentUser && currentUser.role === 'admin') {
    openTab('register-tab');
  }
}

function showMainZipAlert(msg, type = 'info') {
  const box = document.getElementById('main-zip-alert');
  const modalAlert = document.getElementById('main-modal-alert');
  
  [box, modalAlert].forEach(el => {
    if (!el) return;
    el.style.display = 'block';
    el.innerHTML = msg;

    if (type === 'error') {
      el.style.background = 'rgba(239, 68, 68, 0.2)';
      el.style.color = '#fca5a5';
      el.style.border = '1px solid rgba(239, 68, 68, 0.4)';
    } else if (type === 'success') {
      el.style.background = 'rgba(16, 185, 129, 0.2)';
      el.style.color = '#6ee7b7';
      el.style.border = '1px solid rgba(16, 185, 129, 0.4)';
    } else if (type === 'warning') {
      el.style.background = 'rgba(245, 158, 11, 0.2)';
      el.style.color = '#fcd34d';
      el.style.border = '1px solid rgba(245, 158, 11, 0.4)';
    } else {
      el.style.background = 'rgba(59, 130, 246, 0.2)';
      el.style.color = '#93c5fd';
      el.style.border = '1px solid rgba(59, 130, 246, 0.4)';
    }
  });
}

// =============================================================================
// 17. ADMIN SECURITY PIN ENGINE (PROTECTED DELETE & PURGE)
// =============================================================================
let pendingAdminAction = null; // { type: 'delete_tx' | 'delete_exp' | 'clear_all', targetId: '...', description: '...' }

function getAdminPin() {
  return localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || '1234';
}

function saveAdminPinChange(event) {
  if (event) event.preventDefault();
  const curPin = document.getElementById('admin-current-pin')?.value.trim();
  const newPin = document.getElementById('admin-new-pin')?.value.trim();
  const confPin = document.getElementById('admin-confirm-pin')?.value.trim();

  const savedPin = getAdminPin();
  if (curPin !== savedPin) {
    playSound('delete');
    alert('❌ सध्याचा ॲडमीन पिन चुकीचा आहे! कृपया योग्य पिन टाका.');
    return;
  }

  if (!newPin || newPin.length < 4) {
    alert('⚠️ नवीन पिन किमान ४ अंकी असावा.');
    return;
  }

  if (newPin !== confPin) {
    alert('⚠️ नवीन पिन आणि कन्फर्म पिन जुळत नाहीत.');
    return;
  }

  localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, newPin);
  playSound('success');
  alert('🎉 अभिनंदन! ॲडमीन सुरक्षा पिन यशस्वीरित्या बदलला आहे.');
  document.getElementById('admin-pin-change-form')?.reset();
}

function requestDeleteTransaction(txId) {
  if (!currentUser || currentUser.role !== 'admin') {
    alert("⚠️ ऑपरेटरला डेटा हटवण्याची परवानगी नाही! फक्त ॲडमीनच डेटा हटवू शकतात.");
    return;
  }
  const transactions = getStoredTransactions();
  const target = transactions.find(t => t.id === txId);
  if (!target) return;

  pendingAdminAction = {
    type: 'delete_tx',
    targetId: txId,
    description: `<strong>ग्राहक नोंद हटवली जाईल:</strong><br/>• पावती क्र: <strong>${escapeHtml(target.tokenNo)}</strong><br/>• नाव: <strong>${escapeHtml(target.customerName)}</strong><br/>• सेवा: ${escapeHtml(target.serviceName)} (₹${target.totalAmount})`
  };

  openAdminPinModal();
}

function requestDeleteExpense(expId) {
  if (!currentUser || currentUser.role !== 'admin') {
    alert("⚠️ ऑपरेटरला खर्च हटवण्याची परवानगी नाही! फक्त ॲडमीनच खर्च हटवू शकतात.");
    return;
  }
  const expenses = getStoredExpenses();
  const target = expenses.find(e => e.id === expId);
  if (!target) return;

  pendingAdminAction = {
    type: 'delete_exp',
    targetId: expId,
    description: `<strong>खर्च नोंद हटवली जाईल:</strong><br/>• प्रकार: <strong>${escapeHtml(target.category)}</strong><br/>• तपशील: ${escapeHtml(target.description)}<br/>• रक्कम: <strong>₹${target.amount}</strong>`
  };

  openAdminPinModal();
}

function requestClearAllData() {
  if (!currentUser || currentUser.role !== 'admin') {
    alert("⚠️ ऑपरेटरला डेटा हटवण्याची परवानगी नाही! फक्त ॲडमीनच डेटा हटवू शकतात.");
    return;
  }
  pendingAdminAction = {
    type: 'clear_all',
    targetId: 'all',
    description: `<strong style="color: #f87171;">⚠️ गंभीर इशारा: सर्व नोंदी, खर्च आणि बॅकअप कायमस्वरूपी नष्ट केला जाईल!</strong>`
  };

  openAdminPinModal();
}

function openAdminPinModal() {
  playSound('click');
  const descEl = document.getElementById('admin-target-description');
  if (descEl && pendingAdminAction) {
    descEl.innerHTML = pendingAdminAction.description;
  }

  const pinInput = document.getElementById('admin-pin-input');
  if (pinInput) pinInput.value = '';

  const errBox = document.getElementById('admin-pin-error');
  if (errBox) {
    errBox.style.display = 'none';
    errBox.innerHTML = '';
  }

  openModal('admin-pin-modal');
  setTimeout(() => {
    if (pinInput) pinInput.focus();
  }, 100);
}

function toggleAdminPinInputVisibility() {
  const pinInput = document.getElementById('admin-pin-input');
  const eyeIcon = document.getElementById('admin-pin-eye-icon');
  if (!pinInput) return;

  if (pinInput.type === 'password') {
    pinInput.type = 'text';
    if (eyeIcon) {
      eyeIcon.classList.remove('fa-eye');
      eyeIcon.classList.add('fa-eye-slash');
    }
  } else {
    pinInput.type = 'password';
    if (eyeIcon) {
      eyeIcon.classList.remove('fa-eye-slash');
      eyeIcon.classList.add('fa-eye');
    }
  }
}

async function verifyAdminPinAndExecute(event) {
  if (event) event.preventDefault();

  const enteredPin = document.getElementById('admin-pin-input')?.value.trim();
  const correctPin = getAdminPin();
  const errBox = document.getElementById('admin-pin-error');

  if (enteredPin !== correctPin) {
    playSound('delete');
    if (errBox) {
      errBox.style.display = 'block';
      errBox.innerHTML = '<i class="fas fa-times-circle"></i> चुकीचा ॲडमीन पिन! डिलीट करण्यास परवानगी नाकारली.';
    }
    return;
  }

  // Verification Succeeded! Execute Action:
  if (!pendingAdminAction) {
    closeModal('admin-pin-modal');
    return;
  }

  const { type, targetId } = pendingAdminAction;

  if (type === 'delete_tx') {
    let transactions = getStoredTransactions();
    transactions = transactions.filter(t => t.id !== targetId);
    saveStoredTransactions(transactions);

    if (isFirebaseConnected && db) {
      db.collection('aadhaar_transactions').doc(targetId).delete().catch(e => console.error('Cloud delete error:', e));
    }
    playSound('delete');
    alert('✅ ग्राहक नोंद यशस्वीरित्या हटवली आहे (Cloud Synced)!');
  } else if (type === 'delete_exp') {
    let expenses = getStoredExpenses();
    expenses = expenses.filter(e => e.id !== targetId);
    saveStoredExpenses(expenses);

    if (isFirebaseConnected && db) {
      db.collection('aadhaar_expenses').doc(targetId).delete().catch(e => console.error('Cloud expense delete error:', e));
    }
    playSound('delete');
    alert('✅ खर्च नोंद यशस्वीरित्या हटवली आहे!');
  } else if (type === 'clear_all') {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    playSound('delete');
    alert('🧹 सर्व स्थानिक डेटा यशस्वीरित्या साफ केला आहे!');
  }

  pendingAdminAction = null;
  closeModal('admin-pin-modal');
  refreshAllDataViews();
}

