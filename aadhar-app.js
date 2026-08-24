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
  operatorName: 'प्रशांत सावंत',
  stationId: 'STN-786',
  contactPhone: '02367-232014',
  centerAddress: 'ई-मुद्रा डिजिटल सेवा केंद्र परिसर',
  receiptFooter: 'ई-मुद्रा आधार सेवा केंद्रास भेट दिल्याबद्दल धन्यवाद! शासकीय नियमांनुसार सेवा दिली जाईल.',
  rates: {
    demo: 50,
    bio: 100,
    doc: 50,
    print: 50,
    pvc: 50,
    other: 30
  }
};

// User's Configured Firebase Credentials
const defaultFirebaseConfig = {
  apiKey: "AIzaSyCBhMsM4u52M1JyGVq251SKaRHfBgShZN0",
  authDomain: "e-mudra-aadhar-center.firebaseapp.com",
  projectId: "e-mudra-aadhar-center",
  storageBucket: "e-mudra-aadhar-center.firebasestorage.app",
  messagingSenderId: "406353384933",
  appId: "1:406353384933:web:9171612d42f815620b8b0c",
  measurementId: "G-EW41L6H64S"
};

// =============================================================================
// 2. INITIALIZATION
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
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

// Live Clock & Date in Marathi Format
function startLiveClock() {
  function update() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('mr-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
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

  if (entryDate && !entryDate.value) entryDate.value = todayStr;
  if (entryTime && !entryTime.value) entryTime.value = timeStr;
  if (expDate && !expDate.value) expDate.value = todayStr;
  if (repDate && !repDate.value) repDate.value = todayStr;

  calculateNextTokenNo();
}

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// =============================================================================
// 3. CLEAN DATA STORAGE (ZERO DEMO DATA - ABSOLUTE CLEAN SLATE)
// =============================================================================
function initSeedDataIfEmpty() {
  try {
    // 1. Purge all demo records from localStorage
    let transactions = getStoredTransactions();
    const demoKeywords = ['गणेश', 'सुनीता', 'आदित्य', 'प्रकाश', 'डेमो', 'Sample', 'Demo', 'Parab', 'Rane', 'Sawant'];
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
      if (!e.description) return false;
      return !e.description.includes('लॅमिनेशन पाऊच') && !e.description.includes('डेमो') && !e.description.includes('Sample');
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
    return data ? JSON.parse(data) : [];
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

function getKendraSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? Object.assign({}, defaultSettings, JSON.parse(data)) : defaultSettings;
  } catch (e) {
    return defaultSettings;
  }
}

function saveKendraSettings(event) {
  if (event) event.preventDefault();
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

  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  loadKendraSettings();
  playSound('success');
  alert('✅ केंद्राची माहिती व सेवा दर यशस्वीरित्या जतन केले!');
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
  const date = document.getElementById('exp-date').value;
  const category = document.getElementById('exp-category').value;
  const amount = parseFloat(document.getElementById('exp-amount').value) || 0;
  const paymentMode = document.getElementById('exp-payment-mode').value;
  const description = document.getElementById('exp-description').value.trim();

  if (amount <= 0 || !description) {
    alert('कृपया खर्चाची योग्य रक्कम आणि तपशील भरा.');
    return;
  }

  const expRecord = {
    id: 'EXP-' + Date.now(),
    date,
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
  alert('✅ दैनिक खर्च नोंद यशस्वीपणे सेव्ह झाली!');
}

function deleteExpense(expId) {
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

function updateMetricsDashboard() {
  const transactions = getStoredTransactions();
  const expenses = getStoredExpenses();
  const today = getTodayDateString();

  const todayTx = transactions.filter(t => t.date === today);
  const todayExp = expenses.filter(e => e.date === today);

  let totalIncome = 0;
  let cashIncome = 0;
  let upiIncome = 0;
  let cashCount = 0;
  let upiCount = 0;

  todayTx.forEach(t => {
    totalIncome += Number(t.totalAmount || 0);
    if (t.paymentMode.includes('रोख') || t.paymentMode.includes('Cash')) {
      cashIncome += Number(t.totalAmount || 0);
      cashCount++;
    } else if (t.paymentMode.includes('युपीआय') || t.paymentMode.includes('UPI')) {
      upiIncome += Number(t.totalAmount || 0);
      upiCount++;
    }
  });

  let totalExpenses = 0;
  todayExp.forEach(e => {
    totalExpenses += Number(e.amount || 0);
  });

  // Net Cash in Drawer = Cash Income - Expenses (if cash paid)
  let netBalance = (cashIncome + upiIncome) - totalExpenses;
  let drawerCash = Math.max(0, cashIncome - totalExpenses);

  // Top Metrics
  const elTotal = document.getElementById('metric-today-total');
  if (elTotal) elTotal.textContent = totalIncome.toLocaleString('en-IN');
  const elTotalLabel = document.getElementById('metric-today-count-label');
  if (elTotalLabel) elTotalLabel.textContent = `${todayTx.length} व्यवहार आज`;

  const elCash = document.getElementById('metric-today-cash');
  if (elCash) elCash.textContent = cashIncome.toLocaleString('en-IN');
  const elCashCount = document.getElementById('metric-today-cash-count');
  if (elCashCount) elCashCount.textContent = `${cashCount} रोख नोंदी`;

  const elUpi = document.getElementById('metric-today-upi');
  if (elUpi) elUpi.textContent = upiIncome.toLocaleString('en-IN');
  const elUpiCount = document.getElementById('metric-today-upi-count');
  if (elUpiCount) elUpiCount.textContent = `${upiCount} UPI नोंदी`;

  const elExp = document.getElementById('metric-today-expense');
  if (elExp) elExp.textContent = totalExpenses.toLocaleString('en-IN');
  const elExpCount = document.getElementById('metric-today-expense-count');
  if (elExpCount) elExpCount.textContent = `${todayExp.length} खर्च नोंदी`;

  const elBal = document.getElementById('metric-today-balance');
  if (elBal) elBal.textContent = netBalance.toLocaleString('en-IN');

  const elCust = document.getElementById('metric-today-customers');
  if (elCust) elCust.textContent = todayTx.length;

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
  const todayTx = transactions.filter(t => t.date === today).slice(0, 5);

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
          <small><i class="far fa-clock"></i> ${t.time} • ${escapeHtml(t.serviceName)}</small>
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

  const filtered = transactions.filter(t => {
    // 1. Search Query
    if (query) {
      const matchName = (t.customerName || '').toLowerCase().includes(query);
      const matchMobile = (t.mobile || '').includes(query);
      const matchAadhaar = (t.aadhaarEid || '').toLowerCase().includes(query);
      const matchToken = (t.tokenNo || '').toLowerCase().includes(query);
      if (!matchName && !matchMobile && !matchAadhaar && !matchToken) return false;
    }

    // 2. Date Filter
    if (datePreset === 'today') {
      if (t.date !== today) return false;
    } else if (datePreset === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;
      if (t.date !== yestStr) return false;
    } else if (datePreset === 'this-week') {
      const txDate = new Date(t.date);
      const diffTime = Math.abs(now - txDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 7) return false;
    } else if (datePreset === 'this-month') {
      const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      if (!t.date.startsWith(currentMonthPrefix)) return false;
    } else if (datePreset === 'custom') {
      const from = document.getElementById('custom-date-from')?.value;
      const to = document.getElementById('custom-date-to')?.value;
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
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
          <span>${t.date}</span>
          <small class="text-muted">${t.time}</small>
        </div>
      </td>
      <td>
        <strong class="customer-name">${escapeHtml(t.customerName)}</strong>
        <small class="text-muted d-block">${escapeHtml(t.genderAge || '')}</small>
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
          <button class="btn-icon edit" title="संपादित करा" onclick="editTransactionRecord('${t.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon delete" title="हटवा (Admin PIN Required)" onclick="requestDeleteTransaction('${t.id}')">
            <i class="fas fa-trash"></i>
          </button>
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
      <td>${e.date}</td>
      <td><strong>${escapeHtml(e.category)}</strong></td>
      <td>${escapeHtml(e.description)}</td>
      <td style="text-align: right;"><strong class="text-crimson font-lg">₹${e.amount}</strong></td>
      <td><span class="badge badge-secondary">${escapeHtml(e.paymentMode)}</span></td>
      <td style="text-align: center;">
        <button class="btn-icon delete" title="हटवा (Admin PIN Required)" onclick="requestDeleteExpense('${e.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// =============================================================================
// 11. DAY-END REPORT & TALEBAND (ताळेबंद)
// =============================================================================
function generateDailyReport() {
  const repDateInput = document.getElementById('report-date-select');
  const targetDate = repDateInput?.value || getTodayDateString();

  const settings = getKendraSettings();
  const transactions = getStoredTransactions().filter(t => t.date === targetDate);
  const expenses = getStoredExpenses().filter(e => e.date === targetDate);

  // Headers
  const dateEl = document.getElementById('rep-date-text');
  if (dateEl) dateEl.textContent = targetDate;
  const kEl = document.getElementById('rep-kendra-name');
  if (kEl) kEl.textContent = settings.kendraName;
  const opEl = document.getElementById('rep-operator-name');
  if (opEl) opEl.textContent = settings.operatorName;
  const stnEl = document.getElementById('rep-station-id');
  if (stnEl) stnEl.textContent = settings.stationId;

  // Services aggregation
  const serviceCounts = {};
  let grossIncome = 0;
  let cashTotal = 0;
  let upiTotal = 0;
  let pendingTotal = 0;

  transactions.forEach(t => {
    const sName = t.serviceName || 'इतर सेवा';
    if (!serviceCounts[sName]) serviceCounts[sName] = { count: 0, revenue: 0 };
    serviceCounts[sName].count += 1;
    serviceCounts[sName].revenue += Number(t.totalAmount || 0);

    grossIncome += Number(t.totalAmount || 0);
    if (t.paymentMode.includes('रोख') || t.paymentMode.includes('Cash')) cashTotal += Number(t.totalAmount || 0);
    else if (t.paymentMode.includes('युपीआय') || t.paymentMode.includes('UPI')) upiTotal += Number(t.totalAmount || 0);
    else if (t.paymentMode.includes('उधारी') || t.paymentMode.includes('Pending')) pendingTotal += Number(t.totalAmount || 0);
  });

  // Render Service Breakdown
  const servTbody = document.getElementById('rep-services-breakdown-tbody');
  if (servTbody) {
    const keys = Object.keys(serviceCounts);
    if (keys.length === 0) {
      servTbody.innerHTML = `<tr><td colspan="3" class="text-center py-2 text-muted">या तारखेला कोणतीही जमा नाही.</td></tr>`;
    } else {
      servTbody.innerHTML = keys.map(k => `
        <tr>
          <td>${escapeHtml(k)}</td>
          <td class="text-center">${serviceCounts[k].count}</td>
          <td class="text-right">₹${serviceCounts[k].revenue.toLocaleString('en-IN')}</td>
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
  const expTbody = document.getElementById('rep-expenses-breakdown-tbody');
  if (expTbody) {
    if (expenses.length === 0) {
      expTbody.innerHTML = `<tr><td colspan="3" class="text-center py-2 text-muted">या तारखेला कोणताही खर्च नोंदवलेला नाही.</td></tr>`;
    } else {
      expTbody.innerHTML = expenses.map(e => {
        totalExpense += Number(e.amount || 0);
        return `
          <tr>
            <td>${escapeHtml(e.category)}</td>
            <td>${escapeHtml(e.description)}</td>
            <td class="text-right text-crimson">₹${Number(e.amount).toLocaleString('en-IN')}</td>
          </tr>
        `;
      }).join('');
    }
  }

  const elRepExp = document.getElementById('rep-total-expense');
  if (elRepExp) elRepExp.textContent = totalExpense.toLocaleString('en-IN');

  // Net Balance
  const netProfit = grossIncome - totalExpense;
  const drawerCash = Math.max(0, cashTotal - totalExpense);

  const elFinalGross = document.getElementById('rep-final-gross');
  if (elFinalGross) elFinalGross.textContent = grossIncome.toLocaleString('en-IN');
  const elFinalExp = document.getElementById('rep-final-expense');
  if (elFinalExp) elFinalExp.textContent = totalExpense.toLocaleString('en-IN');
  const elFinalNet = document.getElementById('rep-final-net');
  if (elFinalNet) elFinalNet.textContent = netProfit.toLocaleString('en-IN');
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
  document.getElementById('rec-datetime').textContent = `${record.date} ${record.time}`;
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
    `दिनांक: ${r.date} ${r.time}\n` +
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
  if (lbl) lbl.textContent = `तारीख फिल्टर: ${preset.toUpperCase()} (${new Date().toLocaleDateString('mr-IN')})`;
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

async function processZipFile(zipBlob, password) {
  if (typeof zip === 'undefined') {
    showZipStatusAlert('❌ Zip.js लायब्ररी लोड झालेली नाही. इंटरनेट कनेक्शन तपासा.', 'error');
    return;
  }

  const reader = new zip.ZipReader(new zip.BlobReader(zipBlob), {
    password: password || undefined
  });

  const entries = await reader.getEntries();
  if (!entries || entries.length === 0) {
    showZipStatusAlert('⚠️ या ZIP फाईलमध्ये कोणतीही फाईल सापडली नाही.', 'warning');
    await reader.close();
    return;
  }

  // Find CSV or text entry inside the zip
  let targetEntry = entries.find(e => !e.directory && (e.filename.toLowerCase().endsWith('.csv') || e.filename.toLowerCase().endsWith('.txt')));
  if (!targetEntry) {
    // If no .csv, take the first non-directory file
    targetEntry = entries.find(e => !e.directory);
  }

  if (!targetEntry) {
    showZipStatusAlert('⚠️ ZIP फाईलमध्ये कोणताही रिपोर्ट (.csv) सापडला नाही.', 'warning');
    await reader.close();
    return;
  }

  showZipStatusAlert(`📂 सापडलेली फाईल: <strong>${escapeHtml(targetEntry.filename)}</strong>. डेटा वाचत आहे...`, 'info');

  let csvContent = '';
  try {
    csvContent = await targetEntry.getData(new zip.TextWriter('utf-8'));
  } catch (pwdErr) {
    console.error('Password error reading zip entry:', pwdErr);
    throw new Error('चुकीचा पासवर्ड किंवा पासवर्ड आवश्यक आहे');
  }

  await reader.close();
  parseAndPreviewCSV(csvContent, targetEntry.filename);
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
    // Find keys ignoring case & special chars
    const getVal = (...keys) => {
      for (let k of keys) {
        for (let rowKey in row) {
          if (rowKey.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')) {
            return String(row[rowKey] || '').trim();
          }
        }
      }
      return '';
    };

    const name = getVal('residentname', 'name', 'customername', 'citizenname', 'resident', 'नाव') || `नागरिक #${idx + 1}`;
    const eid = getVal('eid', 'enrolmentid', 'enrolmentno', 'aadhaarno', 'uid', 'packetid', 'आधार');
    const rawDate = getVal('date', 'createddate', 'transactiondate', 'txdate', 'दिनांक') || todayStr;
    const time = getVal('time', 'createdtime', 'txtime', 'वेळ') || '10:00';
    const rawService = getVal('servicetype', 'service', 'updatetype', 'action', 'type', 'प्रकार') || '';
    const rawFee = getVal('fee', 'amount', 'feecharged', 'charge', 'totalfee', 'रक्कम');
    const mobile = getVal('mobile', 'phone', 'contact', 'mobilenumber', 'मोबाईल') || '9876543210';
    const gender = getVal('gender', 'genderage', 'sex') || 'वयस्क (Adult)';

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

    // Determine Service Name & Standard UIDAI Rate
    let finalService = 'डेमोग्राफिक अपडेट (नाव/पत्ता/DOB/मोबाईल)';
    let fee = 50;
    const servLower = (rawService + ' ' + rawFee).toLowerCase();

    if (servLower.includes('bio') || servLower.includes('बायो') || servLower.includes('photo') || servLower.includes('finger')) {
      finalService = 'बायोमेट्रिक अपडेट (फोटो + फिंगरप्रिंट + डोळे)';
      fee = 100;
    } else if (servLower.includes('doc') || servLower.includes('डॉक्युमेंट') || servLower.includes('poi') || servLower.includes('poa')) {
      finalService = 'डॉक्युमेंट अपडेट (POI / POA पुरावे)';
      fee = 50;
    } else if (servLower.includes('new') || servLower.includes('नवीन') || servLower.includes('fresh')) {
      finalService = 'नवीन आधार नोंदणी (New Enrollment)';
      fee = 0;
    } else if (servLower.includes('mbu') || servLower.includes('mandatory') || servLower.includes('अनिवार्य') || servLower.includes('5') && servLower.includes('15')) {
      finalService = 'अनिवार्य बायोमेट्रिक अपडेट (५ व १५ वर्षे)';
      fee = 0;
    } else if (servLower.includes('print') || servLower.includes('प्रिंट') || servLower.includes('laminat')) {
      finalService = 'आधार कलर प्रिंट + लॅमिनेशन';
      fee = 50;
    } else if (servLower.includes('pvc') || servLower.includes('पीव्हीसी')) {
      finalService = 'आधार पीव्हीसी कार्ड (PVC Card)';
      fee = 50;
    }

    if (rawFee && !isNaN(parseFloat(rawFee))) {
      fee = parseFloat(rawFee);
    }

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

  if (countBadge) countBadge.textContent = `${records.length} नोंदी`;
  if (statCount) statCount.textContent = records.length;
  if (statAmount) statAmount.textContent = `₹${totalAmount}`;
  if (statDates) statDates.textContent = dateRangeStr;

  if (tbody) {
    tbody.innerHTML = records.slice(0, 10).map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(r.date)} ${escapeHtml(r.time)}</td>
        <td><strong>${escapeHtml(r.customerName)}</strong><br/><span class="text-xs text-muted">EID: ${escapeHtml(r.aadhaarEid)}</span></td>
        <td><span class="badge-tag gold text-xs">${escapeHtml(r.serviceName)}</span></td>
        <td style="text-align: right; font-weight: bold; color: #fbbf24;">₹${r.totalAmount}</td>
      </tr>
    `).join('');

    if (records.length > 10) {
      tbody.innerHTML += `
        <tr>
          <td colspan="5" class="text-center text-muted text-xs py-2">
            ... आणि आणखी ${records.length - 10} नोंदी समाविष्ट आहेत.
          </td>
        </tr>
      `;
    }
  }

  showZipStatusAlert(`✅ <strong>${records.length} नोंदी</strong> यशस्वीरित्या वाचल्या आहेत (एकूण शुल्क: ₹${totalAmount}). कृपया खालील तपशील तपासून "सर्व नोंदी जोडा" बटण दाबा.`, 'success');

  if (previewCard) previewCard.style.display = 'block';
  playSound('success');
}

async function confirmAndImportParsedRecords() {
  if (!parsedReportTransactions || parsedReportTransactions.length === 0) {
    alert('कोणत्याही नोंदी उपलब्ध नाहीत.');
    return;
  }

  const btnConfirm = event ? event.target : null;
  if (btnConfirm) {
    btnConfirm.disabled = true;
    btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> सेव्ह व सिंक होत आहे...';
  }

  const currentList = getStoredTransactions();
  const combined = [...parsedReportTransactions, ...currentList];
  
  // Sort descending by timestamp
  combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  saveStoredTransactions(combined);

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

  refreshAllDataViews();
  playSound('success');
  alert(`🎉 अभिनंदन! UIDAI रिपोर्टमधील ${parsedReportTransactions.length} नोंदी दैनिक नोंदवहीत व Firebase वर यशस्वीरित्या सेव्ह झाल्या आहेत!`);

  closeModal('zip-import-modal');
  openTab('register-tab');
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

  const alertBox = document.getElementById('main-zip-alert');
  if (alertBox) {
    alertBox.style.display = 'none';
    alertBox.innerHTML = '';
  }

  const previewCard = document.getElementById('main-zip-preview');
  if (previewCard) previewCard.style.display = 'none';

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
  if (typeof zip === 'undefined') {
    showMainZipAlert('❌ Zip.js लायब्ररी लोड झालेली नाही. इंटरनेट कनेक्शन तपासा.', 'error');
    return;
  }

  const reader = new zip.ZipReader(new zip.BlobReader(zipBlob), {
    password: password || undefined
  });

  const entries = await reader.getEntries();
  if (!entries || entries.length === 0) {
    showMainZipAlert('⚠️ या ZIP फाईलमध्ये कोणतीही फाईल सापडली नाही.', 'warning');
    await reader.close();
    return;
  }

  let targetEntry = entries.find(e => !e.directory && (e.filename.toLowerCase().endsWith('.csv') || e.filename.toLowerCase().endsWith('.txt')));
  if (!targetEntry) {
    targetEntry = entries.find(e => !e.directory);
  }

  if (!targetEntry) {
    showMainZipAlert('⚠️ ZIP फाईलमध्ये कोणताही रिपोर्ट (.csv) सापडला नाही.', 'warning');
    await reader.close();
    return;
  }

  showMainZipAlert(`📂 सापडलेली फाईल: <strong>${escapeHtml(targetEntry.filename)}</strong>. डेटा वाचत आहे...`, 'info');

  let csvContent = '';
  try {
    csvContent = await targetEntry.getData(new zip.TextWriter('utf-8'));
  } catch (pwdErr) {
    console.error('Password error reading zip entry:', pwdErr);
    throw new Error('चुकीचा पासवर्ड किंवा पासवर्ड आवश्यक आहे');
  }

  await reader.close();
  parseAndPreviewMainCSV(csvContent, targetEntry.filename);
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

  rows.forEach((row, idx) => {
    const getVal = (...keys) => {
      for (let k of keys) {
        for (let rowKey in row) {
          if (rowKey.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')) {
            return String(row[rowKey] || '').trim();
          }
        }
      }
      return '';
    };

    const name = getVal('residentname', 'name', 'customername', 'citizenname', 'resident', 'नाव') || `नागरिक #${idx + 1}`;
    const eid = getVal('eid', 'enrolmentid', 'enrolmentno', 'aadhaarno', 'uid', 'packetid', 'आधार');
    const rawDate = getVal('date', 'createddate', 'transactiondate', 'txdate', 'दिनांक') || todayStr;
    const time = getVal('time', 'createdtime', 'txtime', 'वेळ') || '10:00';
    const rawService = getVal('servicetype', 'service', 'updatetype', 'action', 'type', 'प्रकार') || '';
    const rawFee = getVal('fee', 'amount', 'feecharged', 'charge', 'totalfee', 'रक्कम');
    const mobile = getVal('mobile', 'phone', 'contact', 'mobilenumber', 'मोबाईल') || '9876543210';
    const gender = getVal('gender', 'genderage', 'sex') || 'वयस्क (Adult)';

    let normalizedDate = todayStr;
    if (rawDate) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        normalizedDate = rawDate;
      } else if (/^\d{2}[-\/]\d{2}[-\/]\d{4}$/.test(rawDate)) {
        const parts = rawDate.split(/[-\/]/);
        normalizedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    let finalService = 'डेमोग्राफिक अपडेट (नाव/पत्ता/DOB/मोबाईल)';
    let fee = 50;
    const servLower = (rawService + ' ' + rawFee).toLowerCase();

    if (servLower.includes('bio') || servLower.includes('बायो') || servLower.includes('photo') || servLower.includes('finger')) {
      finalService = 'बायोमेट्रिक अपडेट (फोटो + फिंगरप्रिंट + डोळे)';
      fee = 100;
    } else if (servLower.includes('doc') || servLower.includes('डॉक्युमेंट') || servLower.includes('poi') || servLower.includes('poa')) {
      finalService = 'डॉक्युमेंट अपडेट (POI / POA पुरावे)';
      fee = 50;
    } else if (servLower.includes('new') || servLower.includes('नवीन') || servLower.includes('fresh')) {
      finalService = 'नवीन आधार नोंदणी (New Enrollment)';
      fee = 0;
    } else if (servLower.includes('mbu') || servLower.includes('mandatory') || servLower.includes('अनिवार्य') || servLower.includes('5') && servLower.includes('15')) {
      finalService = 'अनिवार्य बायोमेट्रिक अपडेट (५ व १५ वर्षे)';
      fee = 0;
    } else if (servLower.includes('print') || servLower.includes('प्रिंट') || servLower.includes('laminat')) {
      finalService = 'आधार कलर प्रिंट + लॅमिनेशन';
      fee = 50;
    } else if (servLower.includes('pvc') || servLower.includes('पीव्हीसी')) {
      finalService = 'आधार पीव्हीसी कार्ड (PVC Card)';
      fee = 50;
    }

    if (rawFee && !isNaN(parseFloat(rawFee))) {
      fee = parseFloat(rawFee);
    }

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
  const minDate = dates[0] || '--';
  const maxDate = dates[dates.length - 1] || '--';
  const dateRangeStr = minDate === maxDate ? minDate : `${minDate} ते ${maxDate}`;

  if (countBadge) countBadge.textContent = `${records.length} नोंदी`;
  if (statCount) statCount.textContent = records.length;
  if (statAmount) statAmount.textContent = `₹${totalAmount}`;
  if (statDates) statDates.textContent = dateRangeStr;

  if (tbody) {
    tbody.innerHTML = records.slice(0, 10).map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(r.date)} ${escapeHtml(r.time)}</td>
        <td><strong>${escapeHtml(r.customerName)}</strong><br/><span class="text-xs text-muted">EID: ${escapeHtml(r.aadhaarEid)}</span></td>
        <td><span class="badge-tag gold text-xs">${escapeHtml(r.serviceName)}</span></td>
        <td style="text-align: right; font-weight: bold; color: #fbbf24;">₹${r.totalAmount}</td>
      </tr>
    `).join('');

    if (records.length > 10) {
      tbody.innerHTML += `
        <tr>
          <td colspan="5" class="text-center text-muted text-xs py-2">
            ... आणि आणखी ${records.length - 10} नोंदी समाविष्ट आहेत.
          </td>
        </tr>
      `;
    }
  }

  showMainZipAlert(`✅ <strong>${records.length} नोंदी</strong> यशस्वीरित्या वाचल्या आहेत (एकूण शुल्क: ₹${totalAmount}). खालील हिरवे बटण दाबून सेव्ह करा.`, 'success');

  if (previewCard) previewCard.style.display = 'block';
  playSound('success');
}

async function confirmMainImportedRecords() {
  if (!mainParsedReportTransactions || mainParsedReportTransactions.length === 0) {
    alert('कोणत्याही नोंदी उपलब्ध नाहीत.');
    return;
  }

  const btnConfirm = document.getElementById('main-btn-save-cloud');
  if (btnConfirm) {
    btnConfirm.disabled = true;
    btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> सेव्ह व सिंक होत आहे...';
  }

  const currentList = getStoredTransactions();
  const combined = [...mainParsedReportTransactions, ...currentList];
  combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  saveStoredTransactions(combined);

  // Sync to Firebase Cloud Firestore
  if (isFirebaseConnected && db) {
    for (let tx of mainParsedReportTransactions) {
      try {
        await db.collection('aadhaar_transactions').doc(tx.id).set(tx);
        tx.syncedToFirebase = true;
      } catch (e) {
        console.error('Error syncing imported record to Firebase:', e);
      }
    }
    saveStoredTransactions(combined);
  }

  refreshAllDataViews();
  playSound('success');
  alert(`🎉 अभिनंदन! UIDAI रिपोर्टमधील ${mainParsedReportTransactions.length} नोंदी दैनिक नोंदवहीत व Firebase वर यशस्वीरित्या सेव्ह झाल्या आहेत!`);

  resetMainUploadForm();
  openTab('register-tab');
}

function showMainZipAlert(msg, type = 'info') {
  const box = document.getElementById('main-zip-alert');
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

