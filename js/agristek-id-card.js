/**
 * AgriStack Farmer ID Card Studio Pro
 * Advanced Generator with Precision A4 Upper-Center Print Engine
 * (c) e-Mudra CSC & Aaple Sarkar Seva Kendra
 */

// Default State
const cardState = {
  theme: 'green',
  topMargin: 15, // mm
  cardGap: 6,    // mm
  showCutMarks: true,
  
  // Official Logo & Branding State
  showOfficialLogo: true,
  showNationalEmblem: true,
  showMaharashtraSeal: true,
  showWatermark: true,
  logoStyle: 'capsule', // 'capsule' or 'transparent'
  
  // Personal Info
  farmerNameMr: 'सखाराम नामदेव पाटील',
  farmerNameEn: 'SAKHARAM NAMDEO PATIL',
  farmerId: 'MH-268-2026-098412',
  aadhaarRef: 'XXXX XXXX 8745',
  mobile: '9823456789',
  dob: '15/06/1974',
  gender: 'पुरुष / MALE',
  photoUrl: '', // Base64 or default

  // Land Info
  district: 'सिंधुदुर्ग (Sindhudurg)',
  taluka: 'कणकवली (Kankavli)',
  village: 'कणकवली (Kankavli)',
  pincode: '416602',
  khataNo: '452',
  gatNo: '142/1',
  totalArea: '१ हेक्टर ४२ आर (1.42 Ha)',
  holdingType: 'वर्ग-१ (स्वमालकी)',
  
  // CSC & VLE Info (Optional)
  cscRegId: '152153410016',
  vleName: 'महेश गजानन सुतार',
  issueDate: new Date().toLocaleDateString('mr-IN'),

  // Multi-land holdings (Survey / Gat, 8-A Khata No, Area)
  landRecords: [
    { village: 'कणकवली', gat: '142/1', khata: '452', area: '0.62 हे.आर.' },
    { village: 'कणकवली', gat: '145/3', khata: '452', area: '0.45 हे.आर.' },
    { village: 'वरवडे', gat: '88/2', khata: '119', area: '0.35 हे.आर.' }
  ]
};

// Default high-contrast farmer sample portrait (SVG data URL)
const DEFAULT_FARMER_AVATAR = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 200" width="160" height="200">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="pheta" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="50%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#c2410c"/>
    </linearGradient>
    <linearGradient id="skin" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fba86b"/>
    </linearGradient>
  </defs>
  <rect width="160" height="200" fill="url(#bg)"/>
  <!-- Body / Kurta -->
  <path d="M 20 200 L 20 165 C 20 145, 55 135, 80 135 C 105 135, 140 145, 140 165 L 140 200 Z" fill="#ffffff"/>
  <path d="M 75 135 L 75 175 M 85 135 L 85 175" stroke="#cbd5e1" stroke-width="1.5"/>
  <!-- Neck -->
  <rect x="68" y="112" width="24" height="26" rx="4" fill="url(#skin)"/>
  <!-- Head -->
  <ellipse cx="80" cy="85" rx="30" ry="36" fill="url(#skin)"/>
  <!-- Traditional Maharashtra Pheta / Turban -->
  <path d="M 45 75 C 45 42, 60 30, 80 30 C 100 30, 118 42, 118 75 C 118 68, 110 52, 80 50 C 52 52, 45 68, 45 75 Z" fill="url(#pheta)"/>
  <path d="M 42 66 Q 80 48 120 62 Q 80 40 42 66" fill="#f59e0b"/>
  <path d="M 45 72 Q 80 54 118 70 Q 80 46 45 72" fill="#d97706"/>
  <!-- Pheta Tail (फाटा) -->
  <path d="M 112 55 L 126 50 L 132 90 L 122 88 Z" fill="url(#pheta)"/>
  <!-- Ears -->
  <ellipse cx="48" cy="86" rx="6" ry="10" fill="url(#skin)"/>
  <ellipse cx="112" cy="86" rx="6" ry="10" fill="url(#skin)"/>
  <!-- Eyebrows -->
  <path d="M 58 75 Q 67 71 74 74" stroke="#451a03" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M 86 74 Q 93 71 102 75" stroke="#451a03" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Eyes -->
  <ellipse cx="66" cy="81" rx="4" ry="2.5" fill="#1e293b"/>
  <ellipse cx="94" cy="81" rx="4" ry="2.5" fill="#1e293b"/>
  <!-- Tilak (गंध) -->
  <rect x="78" y="65" width="4" height="12" rx="1.5" fill="#ea580c"/>
  <!-- Nose -->
  <path d="M 80 78 L 78 92 L 84 92" stroke="#ea580c" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <!-- Moustache (मिशा) -->
  <path d="M 64 100 Q 80 94 96 100 Q 88 106 80 99 Q 72 106 64 100" fill="#292524"/>
  <!-- Lips -->
  <path d="M 72 106 Q 80 110 88 106" stroke="#9a3412" stroke-width="1.8" fill="none" stroke-linecap="round"/>
</svg>
`);

// DOM Elements
let qrCodeInstanceFront = null;
let qrCodeInstanceA4 = null;
let qrCodeInstanceFlip = null;

document.addEventListener('DOMContentLoaded', () => {
  cardState.photoUrl = DEFAULT_FARMER_AVATAR;
  initFormInputs();
  initThemeControls();
  initLayoutSliders();
  initOfficialBrandingControls();
  initViewTabs();
  initPhotoUpload();
  initLandRecordsList();
  renderAllCards();
});

// Setup Form Inputs & Event Listeners
function initFormInputs() {
  const mapping = [
    { id: 'inputFarmerNameMr', prop: 'farmerNameMr' },
    { id: 'inputFarmerNameEn', prop: 'farmerNameEn' },
    { id: 'inputFarmerId', prop: 'farmerId' },
    { id: 'inputAadhaarRef', prop: 'aadhaarRef' },
    { id: 'inputMobile', prop: 'mobile' },
    { id: 'inputDob', prop: 'dob' },
    { id: 'inputGender', prop: 'gender' },
    { id: 'inputDistrict', prop: 'district' },
    { id: 'inputTaluka', prop: 'taluka' },
    { id: 'inputVillage', prop: 'village' },
    { id: 'inputPincode', prop: 'pincode' },
    { id: 'inputKhataNo', prop: 'khataNo' },
    { id: 'inputTotalArea', prop: 'totalArea' },
    { id: 'inputHoldingType', prop: 'holdingType' },
    { id: 'inputCscRegId', prop: 'cscRegId' },
    { id: 'inputVleName', prop: 'vleName' }
  ];

  mapping.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) {
      el.value = cardState[item.prop] || '';
      el.addEventListener('input', (e) => {
        cardState[item.prop] = e.target.value;
        renderAllCards();
      });
    }
  });

  // Editor Sub-tabs (Personal / Land / CSC)
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetPane = document.getElementById(btn.dataset.tab);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

// Themes & Layout Controls
function initThemeControls() {
  const chips = document.querySelectorAll('.theme-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      cardState.theme = chip.dataset.theme;
      document.body.setAttribute('data-theme', cardState.theme);
      renderAllCards();
    });
  });
}

function initLayoutSliders() {
  // Top Margin Slider (Default 15mm for Upper Center Placement)
  const marginSlider = document.getElementById('sliderTopMargin');
  const marginVal = document.getElementById('valTopMargin');
  if (marginSlider) {
    marginSlider.value = cardState.topMargin;
    marginSlider.addEventListener('input', (e) => {
      cardState.topMargin = parseInt(e.target.value, 10);
      if (marginVal) marginVal.textContent = cardState.topMargin + ' mm';
      applyA4LayoutSettings();
    });
  }

  // Card Gap Slider (Default 6mm)
  const gapSlider = document.getElementById('sliderCardGap');
  const gapVal = document.getElementById('valCardGap');
  if (gapSlider) {
    gapSlider.value = cardState.cardGap;
    gapSlider.addEventListener('input', (e) => {
      cardState.cardGap = parseInt(e.target.value, 10);
      if (gapVal) gapVal.textContent = cardState.cardGap + ' mm';
      applyA4LayoutSettings();
    });
  }

  // Cut marks checkbox
  const cutMarksChk = document.getElementById('chkCutMarks');
  if (cutMarksChk) {
    cutMarksChk.checked = cardState.showCutMarks;
    cutMarksChk.addEventListener('change', (e) => {
      cardState.showCutMarks = e.target.checked;
      applyA4LayoutSettings();
    });
  }
}

// Official Logo & Branding Listeners
function initOfficialBrandingControls() {
  const chkOfficial = document.getElementById('chkOfficialLogo');
  if (chkOfficial) {
    chkOfficial.checked = cardState.showOfficialLogo;
    chkOfficial.addEventListener('change', (e) => {
      cardState.showOfficialLogo = e.target.checked;
      renderAllCards();
    });
  }

  const chkEmblem = document.getElementById('chkNationalEmblem');
  if (chkEmblem) {
    chkEmblem.checked = cardState.showNationalEmblem;
    chkEmblem.addEventListener('change', (e) => {
      cardState.showNationalEmblem = e.target.checked;
      renderAllCards();
    });
  }

  const chkFarmer = document.getElementById('chkFarmerEmblem');
  if (chkFarmer) {
    chkFarmer.checked = cardState.showMaharashtraSeal;
    chkFarmer.addEventListener('change', (e) => {
      cardState.showMaharashtraSeal = e.target.checked;
      renderAllCards();
    });
  }

  const chkWatermark = document.getElementById('chkWatermark');
  if (chkWatermark) {
    chkWatermark.checked = cardState.showWatermark;
    chkWatermark.addEventListener('change', (e) => {
      cardState.showWatermark = e.target.checked;
      renderAllCards();
    });
  }

  const selLogoStyle = document.getElementById('selLogoStyle');
  if (selLogoStyle) {
    selLogoStyle.value = cardState.logoStyle;
    selLogoStyle.addEventListener('change', (e) => {
      cardState.logoStyle = e.target.value;
      renderAllCards();
    });
  }
}

function applyA4LayoutSettings() {
  // Apply to screen mockup
  const mockup = document.querySelector('.a4-paper-mockup');
  const ruler = document.querySelector('.a4-top-ruler-indicator');
  const cardsRow = document.querySelector('.a4-cards-pair-row');
  const printSheet = document.getElementById('printable-a4-sheet');
  const printRow = printSheet ? printSheet.querySelector('.a4-cards-pair-row') : null;

  if (mockup) {
    mockup.style.paddingTop = cardState.topMargin + 'mm';
  }
  if (ruler) {
    ruler.style.height = cardState.topMargin + 'mm';
    ruler.textContent = `शीर्ष अंतर: ${cardState.topMargin} mm (Upper Margin)`;
  }
  if (cardsRow) {
    cardsRow.style.gap = cardState.cardGap + 'mm';
  }

  // Apply to actual print sheet
  if (printSheet) {
    printSheet.style.paddingTop = cardState.topMargin + 'mm';
  }
  if (printRow) {
    printRow.style.gap = cardState.cardGap + 'mm';
  }

  // Cut marks
  document.querySelectorAll('.a4-fold-guideline').forEach(el => {
    el.style.display = cardState.showCutMarks ? 'flex' : 'none';
  });
}

// View Tabs: Dual Cards / 3D Flip / A4 Sheet Simulation
function initViewTabs() {
  const viewBtns = document.querySelectorAll('.view-tab-btn');
  const viewSections = {
    'view-dual': document.getElementById('sectionViewDual'),
    'view-flip': document.getElementById('sectionViewFlip'),
    'view-a4': document.getElementById('sectionViewA4')
  };

  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.view;

      Object.keys(viewSections).forEach(k => {
        if (viewSections[k]) viewSections[k].style.display = (k === target) ? 'flex' : 'none';
      });

      if (target === 'view-flip') {
        renderFlipCard();
      }
    });
  });

  // Flip trigger button
  const flipBtn = document.getElementById('btnFlipCard');
  if (flipBtn) {
    flipBtn.addEventListener('click', () => {
      const cardInner = document.getElementById('flipCardInner');
      if (cardInner) cardInner.classList.toggle('flipped');
    });
  }
}

// Photo Upload & Avatar
function initPhotoUpload() {
  const fileInput = document.getElementById('farmerPhotoInput');
  const previewThumb = document.getElementById('photoPreviewThumb');

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          cardState.photoUrl = event.target.result;
          if (previewThumb) previewThumb.src = cardState.photoUrl;
          renderAllCards();
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

function useSamplePhoto() {
  cardState.photoUrl = DEFAULT_FARMER_AVATAR;
  const thumb = document.getElementById('photoPreviewThumb');
  if (thumb) thumb.src = DEFAULT_FARMER_AVATAR;
  renderAllCards();
}

// Land Records Repeater (Multi Gat)
function initLandRecordsList() {
  renderLandRecordsEditor();
}

function renderLandRecordsEditor() {
  const container = document.getElementById('landRowsContainer');
  if (!container) return;

  container.innerHTML = '';
  cardState.landRecords.forEach((record, index) => {
    const row = document.createElement('div');
    row.className = 'land-row-item';
    row.innerHTML = `
      <input type="text" class="form-control" placeholder="गाव" value="${record.village || ''}" onchange="updateLandRow(${index}, 'village', this.value)" style="font-size:0.75rem; padding:4px 6px;">
      <input type="text" class="form-control font-mono" placeholder="सर्व्हे/गट क्र." value="${record.gat || ''}" onchange="updateLandRow(${index}, 'gat', this.value)" style="font-size:0.75rem; padding:4px 6px;">
      <input type="text" class="form-control font-mono" placeholder="८-अ खाते क्र." value="${record.khata || ''}" onchange="updateLandRow(${index}, 'khata', this.value)" style="font-size:0.75rem; padding:4px 6px;">
      <input type="text" class="form-control" placeholder="क्षेत्र (हे.आर.)" value="${record.area || ''}" onchange="updateLandRow(${index}, 'area', this.value)" style="font-size:0.75rem; padding:4px 6px;">
      <button class="btn-icon-del" onclick="deleteLandRow(${index})" title="हटवा"><i class="fa-solid fa-trash-can"></i></button>
    `;
    container.appendChild(row);
  });
}

function addLandRow() {
  cardState.landRecords.push({
    village: cardState.village || 'कणकवली',
    gat: '',
    khata: cardState.khataNo || '452',
    area: ''
  });
  renderLandRecordsEditor();
  renderAllCards();
}

function deleteLandRow(index) {
  if (cardState.landRecords.length > 1) {
    cardState.landRecords.splice(index, 1);
    renderLandRecordsEditor();
    renderAllCards();
  } else {
    alert('किमान १ गट नोंद असणे आवश्यक आहे.');
  }
}

function updateLandRow(index, field, value) {
  if (cardState.landRecords[index]) {
    cardState.landRecords[index][field] = value;
    renderAllCards();
  }
}

// Generate HTML Markup for FRONT SIDE
function generateFrontCardHtml(uniqueIdSuffix) {
  const photoSrc = cardState.photoUrl || DEFAULT_FARMER_AVATAR;

  // Emblems HTML: National Lion Capital of Ashoka + Farmer Emblem (Replacing Maharashtra Seal per request)
  let emblemHtml = '';
  if (cardState.showNationalEmblem) {
    emblemHtml += `<img src="images/emblem_of_india_white.png" class="emblem-india" alt="National Emblem of India" title="भारत सरकार" onerror="this.src='images/emblem_of_india.png'">`;
  }
  if (cardState.showMaharashtraSeal) {
    emblemHtml += `<img src="images/farmer_official_logo.png" class="emblem-farmer" alt="AgriStack शेतकरी बोधचिन्ह" title="ॲग्रीस्टॅक शेतकरी बोधचिन्ह">`;
  }

  // Official AgriStack Logo HTML
  let logoHtml = '';
  if (cardState.showOfficialLogo) {
    const isTransparent = cardState.logoStyle === 'transparent';
    const logoSrc = isTransparent ? 'images/agristack_official_logo.png' : 'images/mhfr_logo.png';
    const capsuleClass = isTransparent ? 'official-agristack-pill transparent-mode' : 'official-agristack-pill';
    logoHtml = `
      <div class="${capsuleClass}" title="महाराष्ट्र ॲग्रीस्टॅक अधिकृत लोगो (Official AgriStack Logo)">
        <img src="${logoSrc}" alt="AgriStack Official Logo" onerror="this.src='images/mhfr_logo.png'">
      </div>
    `;
  }

  // Security Watermark
  const watermarkHtml = cardState.showWatermark ? `
    <div class="card-body-watermark">
      <img src="images/mhfr_logo.png" alt="">
    </div>
  ` : '';

  // CSC VLE text (Optional)
  const vleText = (cardState.cscRegId && cardState.cscRegId.trim()) 
    ? `<span>नोंदणी केंद्र: <strong>${cardState.cscRegId}</strong></span>` 
    : `<span>अधिकृत डिजिटल शेतकरी ओळखपत्र</span>`;

  return `
    <div class="agristack-pvc-card card-front" id="cardFront_${uniqueIdSuffix}">
      <!-- Header -->
      <div class="card-header-bar">
        <div class="header-emblem-cluster">
          ${emblemHtml}
        </div>
        <div class="header-text-block">
          <div class="header-main-gov">भारत सरकार • कृषी व शेतकरी कल्याण मंत्रालय</div>
          <div class="header-sub-dept">महाराष्ट्र शासन • कृषी व महसूल विभाग</div>
          <div class="header-card-title">ॲग्रीस्टॅक शेतकरी ओळखपत्र (KISAN ID)</div>
        </div>
        <div class="header-logo-right">
          ${logoHtml}
        </div>
      </div>

      <!-- Tricolor Ribbon -->
      <div class="card-micro-tricolor"></div>

      <!-- Card Body -->
      <div class="card-front-body">
        ${watermarkHtml}

        <!-- Photo Column (AGRI round seal removed per user request) -->
        <div class="card-photo-col">
          <img src="${photoSrc}" class="card-farmer-photo" alt="Farmer Photo">
          <div class="card-verified-chip">
            <i class="fa-solid fa-circle-check"></i> प्रमाणित शेतकरी
          </div>
        </div>

        <!-- Details Column (Full width, right QR blank box removed) -->
        <div class="card-details-col">
          <!-- Farmer ID Banner -->
          <div class="card-id-banner">
            <span class="card-id-label">शेतकरी ओळख क्र. (FARMER ID):</span>
            <span class="card-id-val">${cardState.farmerId || 'MH-268-2026-000000'}</span>
          </div>

          <!-- Names -->
          <div class="farmer-name-marathi">${cardState.farmerNameMr || 'शेतकऱ्याचे नाव'}</div>
          <div class="farmer-name-english">${cardState.farmerNameEn || 'FARMER NAME'}</div>

          <!-- Info Grid -->
          <div class="info-grid-compact">
            <div class="info-item">
              <span class="info-label">जन्म / वय:</span>
              <span class="info-value">${cardState.dob || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">लिंग:</span>
              <span class="info-value">${cardState.gender || 'पुरुष'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">मोबाईल:</span>
              <span class="info-value">${cardState.mobile || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">आधार संदर्भ:</span>
              <span class="info-value">${cardState.aadhaarRef || 'XXXXXXXX1234'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">गाव:</span>
              <span class="info-value">${cardState.village || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">तालुका:</span>
              <span class="info-value">${cardState.taluka || '-'}</span>
            </div>
          </div>

          <!-- Primary Land Summary Badge: ONLY Khata No & Total Area (Gat No removed per request) -->
          <div class="primary-land-badge">
            <div class="land-badge-item">
              <span class="land-badge-lbl">खाते क्रमांक:</span>
              <span class="land-badge-val">${cardState.khataNo || '-'}</span>
            </div>
            <div class="land-badge-divider">|</div>
            <div class="land-badge-item">
              <span class="land-badge-lbl">एकूण क्षेत्र:</span>
              <span class="land-badge-val">${cardState.totalArea || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Front Security Footer -->
      <div class="card-front-footer">
        <div class="footer-left-brand">
          <i class="fa-solid fa-shield-halved" style="color:#16a34a; font-size:4.2pt;"></i>
          <span>डिजिटल ॲग्रीकल्चर मिशन (DIGITAL AGRI MISSION)</span>
        </div>
        <div class="footer-right-vle">
          ${vleText}
        </div>
      </div>
    </div>
  `;
}

// Generate HTML Markup for BACK SIDE
function generateBackCardHtml(uniqueIdSuffix) {
  // Render land records with 8-A and Area (up to 7 rows cleanly since barcode & schemes are removed)
  const rows = cardState.landRecords.slice(0, 7).map(r => `
    <tr>
      <td>${r.village || cardState.village || '-'}</td>
      <td><strong>${r.gat || '-'}</strong></td>
      <td>${r.khata || cardState.khataNo || '-'}</td>
      <td><strong>${r.area || '-'}</strong></td>
    </tr>
  `).join('');

  const watermarkBackHtml = cardState.showWatermark ? `
    <div class="card-back-watermark">
      <img src="images/farmer_official_logo.png" alt="">
    </div>
  ` : '';

  const backLogoHtml = cardState.showOfficialLogo ? `
    <div class="back-logo-pill" title="AgriStack Official Logo">
      <img src="images/mhfr_logo.png" alt="AgriStack">
    </div>
  ` : '';

  // Optional CSC Center display on back bottom
  const backCscHtml = (cardState.cscRegId && cardState.cscRegId.trim())
    ? `<div class="back-csc-pill"><i class="fa-solid fa-building-flag"></i> नोंदणी केंद्र: <strong>${cardState.cscRegId}</strong></div>`
    : `<div class="back-csc-pill"><i class="fa-solid fa-shield-halved"></i> भारत सरकार डिजिटल कृषी नोंदणी</div>`;

  return `
    <div class="agristack-pvc-card card-back" id="cardBack_${uniqueIdSuffix}">
      <!-- Back Header -->
      <div class="back-header-bar">
        <div class="back-title">
          <img src="images/farmer_official_logo.png" class="back-header-seal" alt="Logo">
          <span>शेतजमीन धारणा तपशील (८-अ व सर्व्हे नोंदी)</span>
        </div>
        <div class="back-header-right">
          <span class="back-dist-label">जिल्हा: ${cardState.district || '-'}</span>
          ${backLogoHtml}
        </div>
      </div>

      <div class="card-micro-tricolor"></div>

      <!-- Back Body -->
      <div class="card-back-body">
        ${watermarkBackHtml}

        <!-- Land Holdings Mini Table with Village, Survey/Gat, 8-A Khata, and Area -->
        <div class="land-table-container">
          <table class="land-mini-table">
            <thead>
              <tr>
                <th style="width: 25%;">गाव</th>
                <th style="width: 27%;">सर्व्हे / गट क्र.</th>
                <th style="width: 24%;">८-अ खाते क्र.</th>
                <th style="width: 24%;">क्षेत्र (हे.आर.)</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
            <tfoot>
              <tr class="table-total-row">
                <td colspan="2">एकूण सर्व्हे नोंदी: <strong>${cardState.landRecords.length}</strong></td>
                <td colspan="2">एकूण क्षेत्र: <strong>${cardState.totalArea || '-'}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Spacious Bottom Verification & Stamp Row (Barcode & Nominee removed) -->
        <div class="back-bottom-summary">
          <div class="back-bottom-left-info">
            ${backCscHtml}
            <div class="back-farmer-ref">
              <span>शेतकरी ओळख: <strong>${cardState.farmerId || '-'}</strong></span>
            </div>
          </div>
          <div class="back-seal-box">
            <div class="back-sign-line"></div>
            <span class="stamp-sign-label">अधिकृत स्वाक्षरी</span>
          </div>
        </div>
      </div>

      <!-- Back Terms / Disclaimer -->
      <div class="back-card-footer">
        हे ओळखपत्र भारत सरकारच्या ॲग्रीस्टॅक पोर्टलशी जोडलेले असून पीक कर्ज, अनुदान व शासकीय योजनांसाठी ग्राह्य आहे.
      </div>
    </div>
  `;
}

// Master Render Function
function renderAllCards() {
  // 1. Dual Cards View (Screen)
  const dualFrontContainer = document.getElementById('dualFrontContainer');
  const dualBackContainer = document.getElementById('dualBackContainer');
  if (dualFrontContainer) dualFrontContainer.innerHTML = generateFrontCardHtml('dual');
  if (dualBackContainer) dualBackContainer.innerHTML = generateBackCardHtml('dual');

  // 2. A4 Sheet Mockup (Screen)
  const a4PairContainer = document.getElementById('a4CardsPairContainer');
  if (a4PairContainer) {
    a4PairContainer.innerHTML = `
      ${generateFrontCardHtml('a4')}
      <div class="a4-fold-guideline">
        <span class="a4-scissors-tag">✂</span>
      </div>
      ${generateBackCardHtml('a4')}
    `;
  }

  // 3. Print Sheet (#printable-a4-sheet for Browser Print)
  const printableSheet = document.getElementById('printable-a4-sheet');
  if (printableSheet) {
    printableSheet.innerHTML = `
      <div class="a4-cards-pair-row" style="gap: ${cardState.cardGap}mm;">
        ${generateFrontCardHtml('print')}
        <div class="a4-fold-guideline">
          <span class="a4-scissors-tag">✂</span>
        </div>
        ${generateBackCardHtml('print')}
      </div>
      <div class="a4-instructions-banner">
        <strong>कापून दुमडा व लॅमिनेट करा (Cut, Fold & Laminate):</strong> मध्यभागी कात्रीच्या चिन्हावर कापून दोन्ही बाजू समोरासमोर चिकटवा आणि लॅमिनेशन करा किंवा PVC कार्ड ट्रे मध्ये प्रिंट करा.
      </div>
    `;
  }

  // Generate QR codes and Barcodes for all rendered cards
  setTimeout(() => {
    generateQRCodes();
    generateBarcodes();
    applyA4LayoutSettings();
  }, 50);
}

// Render 3D Flip Card
function renderFlipCard() {
  const frontFace = document.getElementById('flipFrontFace');
  const backFace = document.getElementById('flipBackFace');
  if (frontFace) frontFace.innerHTML = generateFrontCardHtml('flip');
  if (backFace) backFace.innerHTML = generateBackCardHtml('flip');

  setTimeout(() => {
    generateQRForBox('qrContainer_flip');
    generateBarcodeForBox('barcode_flip');
  }, 50);
}

// QR Code Generator
function generateQRCodes() {
  generateQRForBox('qrContainer_dual');
  generateQRForBox('qrContainer_a4');
  generateQRForBox('qrContainer_print');
}

function generateQRForBox(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const qrPayload = JSON.stringify({
    fid: cardState.farmerId,
    name: cardState.farmerNameMr,
    vil: cardState.village,
    dist: cardState.district,
    gat: cardState.gatNo,
    area: cardState.totalArea,
    auth: "AgriStack Digital Agriculture Mission"
  });

  try {
    new QRCode(container, {
      text: qrPayload,
      width: 52,
      height: 52,
      colorDark: "#0f172a",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  } catch (err) {
    console.warn('QR code generation error:', err);
  }
}

// Barcode Generator
function generateBarcodes() {
  generateBarcodeForBox('barcode_dual');
  generateBarcodeForBox('barcode_a4');
  generateBarcodeForBox('barcode_print');
}

function generateBarcodeForBox(svgId) {
  const el = document.getElementById(svgId);
  if (!el || typeof JsBarcode === 'undefined') return;

  try {
    JsBarcode(el, cardState.farmerId || 'MH-268-2026-098412', {
      format: "CODE128",
      width: 1.1,
      height: 20,
      displayValue: false,
      margin: 0,
      lineColor: "#0f172a"
    });
  } catch (e) {
    console.warn('Barcode error:', e);
  }
}

// Demo Data Filler (1-Click Fill)
function fillSampleDemoData() {
  cardState.farmerNameMr = 'सखाराम नामदेव पाटील';
  cardState.farmerNameEn = 'SAKHARAM NAMDEO PATIL';
  cardState.farmerId = 'MH-268-2026-098412';
  cardState.aadhaarRef = 'XXXX XXXX 8745';
  cardState.mobile = '9823456789';
  cardState.dob = '15/06/1974';
  cardState.gender = 'पुरुष / MALE';
  cardState.district = 'सिंधुदुर्ग (Sindhudurg)';
  cardState.taluka = 'कणकवली (Kankavli)';
  cardState.village = 'कणकवली (Kankavli)';
  cardState.pincode = '416602';
  cardState.khataNo = '452';
  cardState.totalArea = '१ हेक्टर ४२ आर (1.42 Ha)';
  cardState.holdingType = 'वर्ग-१ (स्वमालकी)';
  cardState.cscRegId = '152153410016';
  cardState.vleName = 'महेश गजानन सुतार';
  cardState.photoUrl = DEFAULT_FARMER_AVATAR;

  cardState.landRecords = [
    { village: 'कणकवली', gat: '142/1', khata: '452', area: '0.62 हे.आर.' },
    { village: 'कणकवली', gat: '145/3', khata: '452', area: '0.45 हे.आर.' },
    { village: 'वरवडे', gat: '88/2', khata: '119', area: '0.35 हे.आर.' }
  ];

  initFormInputs();
  renderLandRecordsEditor();
  renderAllCards();
}

// Reset Form
function resetCardForm() {
  if (confirm('सर्व माहिती रिकामी करायची आहे का?')) {
    cardState.farmerNameMr = '';
    cardState.farmerNameEn = '';
    cardState.farmerId = 'AGRI-MH-' + Math.floor(100000 + Math.random() * 900000);
    cardState.aadhaarRef = '';
    cardState.mobile = '';
    cardState.dob = '';
    cardState.village = '';
    cardState.khataNo = '';
    cardState.totalArea = '';
    cardState.cscRegId = '';
    cardState.vleName = '';
    cardState.photoUrl = DEFAULT_FARMER_AVATAR;
    cardState.landRecords = [
      { village: '', gat: '', khata: '', area: '' }
    ];

    initFormInputs();
    renderLandRecordsEditor();
    renderAllCards();
  }
}

// Direct A4 Print (Top-Center Aligned)
function triggerA4Print() {
  renderAllCards();
  setTimeout(() => {
    window.print();
  }, 200);
}

// High-Resolution A4 PDF Download (jsPDF + html2canvas)
async function downloadA4Pdf() {
  const btn = document.getElementById('btnDownloadPdf');
  const originalText = btn ? btn.innerHTML : '';
  if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> PDF तयार होत आहे...';

  try {
    // We capture the #printable-a4-sheet element
    const printSheet = document.getElementById('printable-a4-sheet');
    if (!printSheet) throw new Error('Print sheet not found');

    // Make visible temporarily for capture
    printSheet.style.display = 'flex';
    printSheet.style.position = 'fixed';
    printSheet.style.top = '0';
    printSheet.style.left = '0';
    printSheet.style.zIndex = '99999';

    const canvas = await html2canvas(printSheet, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    // Reset styles
    printSheet.style.display = '';
    printSheet.style.position = '';
    printSheet.style.zIndex = '';

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    
    // A4 dimensions: 210 x 297 mm
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    
    const fileName = `AgriStack_Card_${cardState.farmerId || 'Farmer'}.pdf`;
    pdf.save(fileName);
  } catch (err) {
    console.error('PDF Generation failed:', err);
    alert('PDF तयार करताना त्रुटी आली. कृपया थेट "A4 प्रिंट" पर्यायाने Save as PDF करा.');
  } finally {
    if (btn) btn.innerHTML = originalText;
  }
}

// Download Front Card as PNG (300 DPI for PVC Printers)
async function downloadFrontPng() {
  const card = document.getElementById('cardFront_dual');
  if (!card) return;
  const canvas = await html2canvas(card, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
  const link = document.createElement('a');
  link.download = `AgriStack_Front_${cardState.farmerId || 'ID'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// Download Back Card as PNG
async function downloadBackPng() {
  const card = document.getElementById('cardBack_dual');
  if (!card) return;
  const canvas = await html2canvas(card, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
  const link = document.createElement('a');
  link.download = `AgriStack_Back_${cardState.farmerId || 'ID'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// Save to Local History
function saveCardToHistory() {
  try {
    const list = JSON.parse(localStorage.getItem('agristack_history') || '[]');
    const record = {
      id: cardState.farmerId,
      name: cardState.farmerNameMr,
      village: cardState.village,
      gat: cardState.gatNo,
      time: new Date().toLocaleString('mr-IN'),
      state: cardState
    };
    list.unshift(record);
    if (list.length > 30) list.pop();
    localStorage.setItem('agristack_history', JSON.stringify(list));
    alert(`शेतकरी ओळखपत्र (${cardState.farmerNameMr}) स्थानिक इतिहासामध्ये सुरक्षित जतन केले आहे!`);
  } catch (e) {
    console.warn(e);
  }
}
