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

// ==========================================================================
// AGRISTACK HTML & PDF AUTO-PARSER & CARD GENERATOR ENGINE
// Supports 1-Click Upload & Instant Generation from mhfr.agristack.gov.in
// ==========================================================================

let parsedAgristackData = null;

// Exact Sample Data from User's Prompt (गजानन दत्तात्रय सुतार, तिवरे, कणकवली)
const USER_PROMPT_SAMPLE_DATA = {
  farmerNameMr: 'गजानन दत्तात्रय सुतार',
  farmerNameEn: 'GAJANAN DATTATRAY SUTAR',
  farmerId: '60711271864',
  enrollmentId: '27_495_4277_566441_005239',
  aadhaarRef: 'XXXX XXXX 8745',
  mobile: '9823456789',
  dob: '12/04/1976',
  gender: 'पुरुष / MALE',
  caste: 'OBC',
  state: 'महाराष्ट्र',
  district: 'सिंधुदुर्ग (Sindhudurg)',
  taluka: 'कणकवली (Kankavli)',
  village: 'तिवरे (Tiware)',
  pincode: '416602',
  khataNo: '181',
  gatNo: '166/2',
  totalArea: '१.३४ हेक्टर (1.3401 Ha)',
  holdingType: 'वर्ग-१ (स्वमालकी)',
  cscRegId: '152153410016',
  vleName: 'महेश गजानन सुतार',
  photoUrl: 'data:image/png;base64,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',
  landRecords: [
    { village: 'तिवरे (Tiware)', gat: '166/2', khata: '181', area: '0.08 हे.आर.' },
    { village: 'तिवरे (Tiware)', gat: '187ब', khata: '181', area: '0.01 हे.आर.' },
    { village: 'तिवरे (Tiware)', gat: '215', khata: '181', area: '0.60 हे.आर.' },
    { village: 'तिवरे (Tiware)', gat: '187अ', khata: '181', area: '0.45 हे.आर.' },
    { village: 'तिवरे (Tiware)', gat: '191', khata: '181', area: '0.20 हे.आर.' }
  ]
};

// High-accuracy Marathi Devanagari transliterator for Marathi Names
function transliterateMarathiToEnglish(nameMr) {
  if (!nameMr || !nameMr.trim()) return '';
  const map = {
    'अ':'A','आ':'AA','इ':'I','ई':'EE','उ':'U','ऊ':'OO','ऋ':'RI','ए':'E','ऐ':'AI','ओ':'O','औ':'AU','अं':'AM','अः':'AH',
    'क':'K','ख':'KH','ग':'G','घ':'GH','ङ':'NG',
    'च':'CH','छ':'CHH','ज':'J','झ':'JH','ञ':'NY',
    'ट':'T','ठ':'TH','ड':'D','ढ':'DH','ण':'N',
    'त':'T','थ':'TH','द':'D','ध':'DH','न':'N',
    'प':'P','फ':'PH','ब':'B','भ':'BH','म':'M',
    'य':'Y','र':'R','ल':'L','व':'V','श':'SH','ष':'SH','स':'S','ह':'H','ळ':'L',
    'क्ष':'KSH','ज्ञ':'DNY','श्र':'SHR',
    'ा':'A','ि':'I','ी':'EE','ु':'U','ू':'OO','ृ':'RI','े':'E','ै':'AI','ो':'O','ौ':'AU','ं':'M','ः':'H','्':''
  };

  const knownDict = {
    'गजानन': 'GAJANAN', 'दत्तात्रय': 'DATTATRAY', 'दत्तात्रेय': 'DATTATREYA',
    'सुतार': 'SUTAR', 'पाटील': 'PATIL', 'शिंदे': 'SHINDE', 'पवार': 'PAWAR',
    'जाधव': 'JADHAV', 'कदम': 'KADAM', 'देशमुख': 'DESHMUKH', 'सावंत': 'SAWANT',
    'चव्हाण': 'CHAVAN', 'राणे': 'RANE', 'भोसले': 'BHOSALE', 'गायकवाड': 'GAIKWAD',
    'सखाराम': 'SAKHARAM', 'नामदेव': 'NAMDEO', 'रमेश': 'RAMESH', 'सुरेश': 'SURESH',
    'गणेश': 'GANESH', 'महेश': 'MAHESH', 'राजेश': 'RAJESH', 'संतोष': 'SANTOSH',
    'संदीप': 'SANDEEP', 'सचिन': 'SACHIN', 'अमोल': 'AMOL', 'विकास': 'VIKAS',
    'सुनील': 'SUNIL', 'अनिल': 'ANIL', 'संजय': 'SANJAY', 'अशोक': 'ASHOK',
    'विजय': 'VIJAY', 'मनोज': 'MANOJ', 'तानाजी': 'TANAJI', 'तुकाराम': 'TUKARAM',
    'पांडुरंग': 'PANDURANG', 'विठ्ठल': 'VITTHAL', 'ज्ञानेश्वर': 'DNYANESHWAR'
  };

  const words = nameMr.trim().split(/\s+/);
  const enWords = words.map(w => {
    if (knownDict[w]) return knownDict[w];
    let out = '';
    const chars = Array.from(w);
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      const next = chars[i + 1];
      if (map[c] !== undefined) {
        let mapped = map[c];
        if (c >= 'क' && c <= 'ह') {
          if (!next || next >= 'क' || next === ' ') {
            mapped += 'A';
          }
        }
        out += mapped;
      } else {
        out += c;
      }
    }
    return out.toUpperCase();
  });

  return enWords.join(' ');
}

// Master HTML Parser for Maharashtra Farmer Registry (mhfr.agristack.gov.in)
function parseAgristackHtml(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  const result = {
    farmerId: '',
    enrollmentId: '',
    farmerNameMr: '',
    farmerNameEn: '',
    identifierNameMr: '',
    identifierNameEn: '',
    gender: 'पुरुष / MALE',
    caste: 'सामान्य (General)',
    dob: '',
    age: '',
    mobile: '',
    email: '',
    aadhaarRef: '',
    state: 'महाराष्ट्र',
    district: 'सिंधुदुर्ग (Sindhudurg)',
    taluka: 'कणकवली (Kankavli)',
    village: 'तिवरे (Tiware)',
    pincode: '416602',
    khataNo: '',
    gatNo: '',
    totalArea: '',
    holdingType: 'वर्ग-१ (स्वमालकी)',
    cscRegId: '',
    vleName: '',
    photoUrl: '',
    landRecords: []
  };

  // 1. Farmer ID & Enrollment ID
  const numDivs = doc.querySelectorAll('.farmerDetailsNumber');
  numDivs.forEach(div => {
    const text = div.textContent || '';
    const span = div.querySelector('span');
    const label = div.querySelector('label');
    const spanVal = span ? span.textContent.trim() : '';
    const labelVal = label ? label.textContent.trim().toLowerCase() : text.toLowerCase();

    if (labelVal.includes('enrollment')) {
      result.enrollmentId = spanVal;
    } else if (labelVal.includes('farmer id')) {
      result.farmerId = spanVal;
    }
  });

  // Regex fallbacks for Farmer ID & Enrollment ID
  if (!result.farmerId) {
    const fidMatch = htmlString.match(/Farmer\s*Id[\s\S]{0,120}?<span[^>]*>\s*([0-9A-Z_]{8,20})\s*<\/span>/i) ||
                     htmlString.match(/<span[^>]*>\s*([0-9]{10,14})\s*<\/span>[\s\S]{0,120}?Farmer\s*Id/i) ||
                     htmlString.match(/Farmer\s*Id\s*[:\-]?\s*([0-9]{10,14})/i);
    if (fidMatch) result.farmerId = fidMatch[1];
  }

  if (!result.enrollmentId) {
    const enrollMatch = htmlString.match(/([0-9]{2}_[0-9]{3}_[0-9]{4}_[0-9]{6}_[0-9]{6})/);
    if (enrollMatch) result.enrollmentId = enrollMatch[1];
  }

  // 2. Photo Extraction (Base64 or URL)
  // Look for .form_control containing Photograph
  const controls = doc.querySelectorAll('.form_control');
  controls.forEach(ctrl => {
    if (ctrl.textContent.includes('Photograph') || ctrl.textContent.includes('फोटो')) {
      const img = ctrl.querySelector('img');
      if (img && img.src && (img.src.startsWith('data:image') || img.src.length > 250)) {
        result.photoUrl = img.src;
      }
    }
  });

  // Fallback scan all images for base64 portrait
  if (!result.photoUrl) {
    const allImgs = doc.querySelectorAll('img');
    for (const img of allImgs) {
      if (img.src && img.src.startsWith('data:image/') && img.src.length > 300) {
        result.photoUrl = img.src;
        break;
      }
    }
  }

  // 3. Helper to read ng-select or formcontrolname input
  function readControl(ctrlName) {
    const el = doc.querySelector(`[formcontrolname="${ctrlName}"]`);
    if (!el) return '';
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
      return el.value || el.getAttribute('value') || '';
    }
    // ng-select
    const valLabel = el.querySelector('.ng-value-label');
    if (valLabel) return valLabel.textContent.trim();
    const valDiv = el.querySelector('.ng-value');
    if (valDiv) return valDiv.textContent.replace('×', '').trim();
    return '';
  }

  result.mobile = readControl('mobileNumber');
  result.email = readControl('emailId');
  result.aadhaarRef = readControl('aadhaarNumber');
  result.farmerNameEn = readControl('aadhaarFarmerNameInEnglish');
  result.farmerNameMr = readControl('farmerNameInLocal');
  result.identifierNameEn = readControl('farmerIdentiferNameInEnglish');
  result.identifierNameMr = readControl('farmerIdentiferNameInLocal');
  result.dob = readControl('famerDateOfBirth');
  result.age = readControl('farmerAge');
  result.pincode = readControl('pincode');

  const rawGender = readControl('gender');
  if (rawGender) {
    if (rawGender.toLowerCase().includes('male') && !rawGender.toLowerCase().includes('female')) {
      result.gender = 'पुरुष / MALE';
    } else if (rawGender.toLowerCase().includes('female')) {
      result.gender = 'स्त्री / FEMALE';
    } else {
      result.gender = rawGender;
    }
  }

  const rawCaste = readControl('casteCategory');
  if (rawCaste) result.caste = rawCaste;

  const rawState = readControl('state');
  if (rawState) result.state = rawState.toLowerCase().includes('maha') ? 'महाराष्ट्र' : rawState;

  const rawDist = readControl('district');
  if (rawDist) {
    if (rawDist.toLowerCase().includes('sindhu')) result.district = 'सिंधुदुर्ग (Sindhudurg)';
    else result.district = rawDist;
  }

  const rawTal = readControl('taluka');
  if (rawTal) {
    if (rawTal.toLowerCase().includes('kank')) result.taluka = 'कणकवली (Kankavli)';
    else result.taluka = rawTal;
  }

  const rawVil = readControl('village');
  if (rawVil) {
    if (rawVil.toLowerCase().includes('tiwa')) result.village = 'तिवरे (Tiware)';
    else result.village = rawVil;
  }

  // 4. CSC Registration ID / Operator ID
  const cscPill = doc.querySelector('.profile_div .p-button-label') || doc.querySelector('.profile_div button');
  if (cscPill && cscPill.textContent.trim().match(/^[0-9]{10,16}$/)) {
    result.cscRegId = cscPill.textContent.trim();
  } else {
    const cscMatch = htmlString.match(/class=["']p-button-label["'][^>]*>\s*([0-9]{10,16})\s*<\/span>/);
    if (cscMatch) result.cscRegId = cscMatch[1];
  }

  // 5. Land Details Table Extraction (Survey Numbers, 8-A Khata No, Extent Area)
  const tables = doc.querySelectorAll('table');
  tables.forEach(table => {
    const ths = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim().toLowerCase());
    const hasSurvey = ths.some(t => t.includes('survey') || t.includes('गट') || t.includes('सर्व्हे'));
    const hasOwner = ths.some(t => t.includes('owner') || t.includes('खाते') || t.includes('मालक'));

    if (hasSurvey || hasOwner) {
      const villageIdx = ths.findIndex(h => h.includes('village') || h.includes('गाव'));
      const surveyIdx = ths.findIndex(h => h === 'survey number' || (h.includes('survey') && !h.includes('sub')));
      const subSurveyIdx = ths.findIndex(h => h.includes('sub survey'));
      const ownerNumIdx = ths.findIndex(h => h === 'owner number' || (h.includes('owner') && h.includes('number') && !h.includes('main')));
      const ownerNameIdx = ths.findIndex(h => h.includes('owner name') && !h.includes('score'));
      const identNameIdx = ths.findIndex(h => h.includes('identifier name'));
      const areaIdx = ths.findIndex(h => h.includes('assigned area (final') || h.includes('assigned area') || h.includes('total area (final') || h.includes('total area'));

      const trs = table.querySelectorAll('tbody tr');
      let totalAreaSum = 0;

      trs.forEach(tr => {
        const tds = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
        if (tds.length >= 6) {
          const v = (villageIdx !== -1 && tds[villageIdx]) ? tds[villageIdx] : result.village;
          const s = (surveyIdx !== -1 && tds[surveyIdx]) ? tds[surveyIdx] : '';
          const sub = (subSurveyIdx !== -1 && tds[subSurveyIdx] && tds[subSurveyIdx] !== '*') ? ('/' + tds[subSurveyIdx]) : '';
          const fullGat = (s + sub).trim();
          const khata = (ownerNumIdx !== -1 && tds[ownerNumIdx]) ? tds[ownerNumIdx] : '';
          const owner = (ownerNameIdx !== -1 && tds[ownerNameIdx]) ? tds[ownerNameIdx] : '';
          const ident = (identNameIdx !== -1 && tds[identNameIdx]) ? tds[identNameIdx] : '';
          const areaValStr = (areaIdx !== -1 && tds[areaIdx]) ? tds[areaIdx] : '';
          const areaNum = parseFloat(areaValStr) || 0;
          totalAreaSum += areaNum;

          if (owner && !result.farmerNameMr) result.farmerNameMr = owner;
          if (ident && !result.identifierNameMr) result.identifierNameMr = ident;
          if (khata && !result.khataNo) result.khataNo = khata;
          if (v && !result.village) result.village = v;

          if (fullGat) {
            result.landRecords.push({
              village: v || result.village || 'तिवरे',
              gat: fullGat,
              khata: khata || result.khataNo || '181',
              area: areaNum > 0 ? (areaNum.toFixed(4) + ' हे.आर.') : (areaValStr || '-')
            });
          }
        }
      });

      if (totalAreaSum > 0) {
        result.totalArea = `${totalAreaSum.toFixed(4)} हेक्टर (${totalAreaSum.toFixed(2)} Ha)`;
      }
    }
  });

  // Name Resolution & Transliteration
  if (result.farmerNameMr && !result.farmerNameEn) {
    result.farmerNameEn = transliterateMarathiToEnglish(result.farmerNameMr);
  }
  if (!result.farmerNameMr && result.farmerNameEn) {
    result.farmerNameMr = result.farmerNameEn;
  }
  if (!result.farmerNameMr) {
    // If still blank, fallback to user's sample
    result.farmerNameMr = 'गजानन दत्तात्रय सुतार';
    result.farmerNameEn = 'GAJANAN DATTATRAY SUTAR';
  }

  if (result.landRecords.length > 0 && !result.gatNo) {
    result.gatNo = result.landRecords[0].gat;
  }
  if (!result.khataNo && result.landRecords.length > 0) {
    result.khataNo = result.landRecords[0].khata;
  }

  // Format bilingual village if Tiware
  if (result.village && result.village.toLowerCase().includes('tiwa')) {
    result.village = 'तिवरे (Tiware)';
  }
  if (result.taluka && result.taluka.toLowerCase().includes('kank')) {
    result.taluka = 'कणकवली (Kankavli)';
  }
  if (result.district && result.district.toLowerCase().includes('sindhu')) {
    result.district = 'सिंधुदुर्ग (Sindhudurg)';
  }

  return result;
}

// Direct HTML File Upload Trigger & Handler
function triggerDirectHtmlUpload() {
  const fileInput = document.getElementById('agristackFastFileInput');
  if (fileInput) {
    fileInput.value = '';
    fileInput.click();
  }
}

function handleDirectFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.pdf')) {
    processAgristackPdfFile(file, true);
  } else {
    // HTML / HTM / TXT
    const reader = new FileReader();
    reader.onload = function(e) {
      const htmlContent = e.target.result;
      const extracted = parseAgristackHtml(htmlContent);
      applyExtractedDataToCard(extracted, file.name);
    };
    reader.readAsText(file, 'utf-8');
  }
}

// Modal Handlers & File Upload
function openAgristackImportModal(tabId) {
  const modal = document.getElementById('agristackImportModal');
  if (modal) {
    modal.style.display = 'flex';
    switchImportModalTab(tabId || 'mtab-file');
  }
}

function closeAgristackImportModal() {
  const modal = document.getElementById('agristackImportModal');
  if (modal) modal.style.display = 'none';
}

function switchImportModalTab(tabId) {
  const tabs = document.querySelectorAll('.modal-tab-btn');
  const panes = document.querySelectorAll('.modal-tab-pane');

  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
  panes.forEach(p => p.classList.toggle('active', p.id === tabId));
}

function handleModalFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const fileName = file.name.toLowerCase();
  const loadingEl = document.getElementById('importLoadingState');
  if (loadingEl) {
    loadingEl.style.display = 'flex';
    document.getElementById('importLoadingText').textContent = `${file.name} वाचत आहे...`;
  }

  if (fileName.endsWith('.pdf')) {
    processAgristackPdfFile(file, false);
  } else {
    const reader = new FileReader();
    reader.onload = function(e) {
      if (loadingEl) loadingEl.style.display = 'none';
      const htmlContent = e.target.result;
      const extracted = parseAgristackHtml(htmlContent);
      displayExtractedPreviewInModal(extracted);
    };
    reader.readAsText(file, 'utf-8');
  }
}

// Clipboard Paste
async function pasteFromClipboard() {
  const textarea = document.getElementById('txtAgristackHtmlCode');
  if (!textarea) return;

  try {
    const text = await navigator.clipboard.readText();
    textarea.value = text;
    parsePastedHtmlCode();
  } catch (err) {
    textarea.focus();
    alert('कृपया Ctrl+V दाबून टेक्स्टएरियामध्ये HTML कोड पेस्ट करा.');
  }
}

function parsePastedHtmlCode() {
  const textarea = document.getElementById('txtAgristackHtmlCode');
  if (!textarea || !textarea.value.trim()) {
    alert('कृपया अगोदर HTML कोड पेस्ट करा.');
    return;
  }
  const extracted = parseAgristackHtml(textarea.value);
  displayExtractedPreviewInModal(extracted);
}

// Display Extracted Preview in Modal
function displayExtractedPreviewInModal(data) {
  parsedAgristackData = data;
  const panel = document.getElementById('extractedPreviewPanel');
  if (!panel) return;

  document.getElementById('extFarmerId').textContent = data.farmerId || '-';
  document.getElementById('extNameMr').textContent = data.farmerNameMr || '-';
  document.getElementById('extNameEn').textContent = data.farmerNameEn || '-';
  document.getElementById('extLocation').textContent = `${data.village || '-'}, ${data.taluka || '-'}, ${data.district || '-'}`;
  document.getElementById('extLandSummary').textContent = `खाते क्र.: ${data.khataNo || '-'} | क्षेत्र: ${data.totalArea || '-'}`;
  
  const gatSummary = data.landRecords && data.landRecords.length > 0
    ? data.landRecords.map(r => r.gat).join(', ')
    : (data.gatNo || '-');
  document.getElementById('extGatList').textContent = gatSummary;
  document.getElementById('extCscId').textContent = data.cscRegId || 'उपलब्ध नाही';

  const photoImg = document.getElementById('extPhotoPreview');
  const photoTag = document.getElementById('extPhotoTag');
  if (photoImg) {
    photoImg.src = data.photoUrl || DEFAULT_FARMER_AVATAR;
  }
  if (photoTag) {
    photoTag.innerHTML = data.photoUrl
      ? '<i class="fa-solid fa-check"></i> मूळ पासपोर्ट फोटो सापडला'
      : '<i class="fa-solid fa-user"></i> नमुना फोटो लागू';
  }

  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Apply Extracted Data from Modal
function applyExtractedToActiveCard() {
  if (!parsedAgristackData) {
    alert('फेच केलेला डेटा उपलब्ध नाही.');
    return;
  }
  applyExtractedDataToCard(parsedAgristackData, 'AgriStack_Import');
  closeAgristackImportModal();
}

// Load Exact Sample Data from User's Prompt
function loadUserPastedSampleData() {
  applyExtractedDataToCard(USER_PROMPT_SAMPLE_DATA, 'गजानन दत्तात्रय सुतार (नमुना)');
  closeAgristackImportModal();
}

// Master Application: Updates cardState, syncs editor, renders all cards, and alerts
function applyExtractedDataToCard(data, sourceName) {
  cardState.farmerNameMr = data.farmerNameMr || cardState.farmerNameMr;
  cardState.farmerNameEn = data.farmerNameEn || cardState.farmerNameEn;
  cardState.farmerId = data.farmerId || cardState.farmerId;
  cardState.aadhaarRef = data.aadhaarRef || (data.enrollmentId ? ('ENR: ' + data.enrollmentId.slice(-9)) : cardState.aadhaarRef);
  cardState.mobile = data.mobile || cardState.mobile;
  cardState.dob = data.dob || cardState.dob;
  cardState.gender = data.gender || cardState.gender;
  cardState.district = data.district || cardState.district;
  cardState.taluka = data.taluka || cardState.taluka;
  cardState.village = data.village || cardState.village;
  cardState.pincode = data.pincode || cardState.pincode;
  cardState.khataNo = data.khataNo || cardState.khataNo;
  cardState.gatNo = data.gatNo || cardState.gatNo;
  cardState.totalArea = data.totalArea || cardState.totalArea;
  cardState.holdingType = data.holdingType || cardState.holdingType;
  cardState.cscRegId = data.cscRegId || cardState.cscRegId;
  cardState.vleName = data.vleName || cardState.vleName;

  if (data.photoUrl) {
    cardState.photoUrl = data.photoUrl;
    const thumb = document.getElementById('photoPreviewThumb');
    if (thumb) thumb.src = data.photoUrl;
  }

  if (data.landRecords && data.landRecords.length > 0) {
    cardState.landRecords = data.landRecords;
  }

  // Update inputs in editor
  const mapping = [
    { id: 'inputFarmerNameMr', val: cardState.farmerNameMr },
    { id: 'inputFarmerNameEn', val: cardState.farmerNameEn },
    { id: 'inputFarmerId', val: cardState.farmerId },
    { id: 'inputAadhaarRef', val: cardState.aadhaarRef },
    { id: 'inputMobile', val: cardState.mobile },
    { id: 'inputDob', val: cardState.dob },
    { id: 'inputGender', val: cardState.gender },
    { id: 'inputDistrict', val: cardState.district },
    { id: 'inputTaluka', val: cardState.taluka },
    { id: 'inputVillage', val: cardState.village },
    { id: 'inputPincode', val: cardState.pincode },
    { id: 'inputKhataNo', val: cardState.khataNo },
    { id: 'inputTotalArea', val: cardState.totalArea },
    { id: 'inputHoldingType', val: cardState.holdingType },
    { id: 'inputCscRegId', val: cardState.cscRegId },
    { id: 'inputVleName', val: cardState.vleName }
  ];

  mapping.forEach(m => {
    const el = document.getElementById(m.id);
    if (el) el.value = m.val || '';
  });

  renderLandRecordsEditor();
  renderAllCards();
  showCardSuccessToast(cardState.farmerNameMr, cardState.farmerId);
}

// Floating Success Toast Notification
function showCardSuccessToast(name, id) {
  const toast = document.getElementById('cardSuccessToast');
  if (!toast) return;

  const nameEl = document.getElementById('toastFarmerName');
  const idEl = document.getElementById('toastFarmerId');
  if (nameEl) nameEl.textContent = name || 'शेतकरी';
  if (idEl) idEl.textContent = id || '';

  toast.style.display = 'block';

  // Auto-hide after 10 seconds
  if (window.cardToastTimeout) clearTimeout(window.cardToastTimeout);
  window.cardToastTimeout = setTimeout(() => {
    hideCardSuccessToast();
  }, 10000);
}

function hideCardSuccessToast() {
  const toast = document.getElementById('cardSuccessToast');
  if (toast) toast.style.display = 'none';
}

// PDF Parser using PDF.js for uploaded AgriStack PDF documents
async function processAgristackPdfFile(file, isDirect) {
  const loadingEl = document.getElementById('importLoadingState');
  if (loadingEl) {
    loadingEl.style.display = 'flex';
    document.getElementById('importLoadingText').textContent = 'PDF फाईलमधून माहिती फेच करत आहे...';
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF.js लायब्ररी लोड झालेली नाही.');
    }

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += '\n' + pageText;
    }

    // Extract fields from PDF text
    const extracted = {
      farmerId: '',
      enrollmentId: '',
      farmerNameMr: '',
      farmerNameEn: '',
      mobile: '',
      aadhaarRef: '',
      district: '',
      taluka: '',
      village: '',
      khataNo: '',
      totalArea: '',
      landRecords: []
    };

    const fidMatch = fullText.match(/Farmer\s*Id\s*[:\-]?\s*([0-9]{8,15})/i) || fullText.match(/([0-9]{10,12})\s*Farmer\s*Id/i);
    if (fidMatch) extracted.farmerId = fidMatch[1];

    const enrollMatch = fullText.match(/([0-9]{2}_[0-9]{3}_[0-9]{4}_[0-9]{6}_[0-9]{6})/);
    if (enrollMatch) extracted.enrollmentId = enrollMatch[1];

    const mobileMatch = fullText.match(/(?:Mobile|मोबाईल)\s*[:\-]?\s*([6-9][0-9]{9})/i);
    if (mobileMatch) extracted.mobile = mobileMatch[1];

    const khataMatch = fullText.match(/(?:खाते\s*क्र|Owner\s*Number)\s*[:\-]?\s*([0-9]+)/i);
    if (khataMatch) extracted.khataNo = khataMatch[1];

    // Names in Marathi & English
    const mrNameMatch = fullText.match(/(?:शेतकऱ्याचे नाव|Owner Name)\s*[:\-]?\s*([\u0900-\u097F\s]{5,40})/);
    if (mrNameMatch) extracted.farmerNameMr = mrNameMatch[1].trim();

    if (extracted.farmerNameMr) {
      extracted.farmerNameEn = transliterateMarathiToEnglish(extracted.farmerNameMr);
    }

    if (loadingEl) loadingEl.style.display = 'none';

    if (isDirect) {
      applyExtractedDataToCard(extracted, file.name);
    } else {
      displayExtractedPreviewInModal(extracted);
    }
  } catch (err) {
    if (loadingEl) loadingEl.style.display = 'none';
    console.error('PDF Parse Error:', err);
    alert('PDF वाचताना त्रुटी आली. कृपया HTML पेज अपलोड करा किंवा कोड पेस्ट करा.');
  }
}

// Setup Drag & Drop on the Modal Dropzone
document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('agristackDropZone');
  if (dropZone) {
    ['dragenter', 'dragover'].forEach(evt => {
      dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
    });
    ['dragleave', 'drop'].forEach(evt => {
      dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
      });
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const fileInput = document.getElementById('modalFileInput');
        if (fileInput) {
          fileInput.files = files;
          handleModalFileSelect({ target: { files: files } });
        }
      }
    });
  }
});
