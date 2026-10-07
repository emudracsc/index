/**
 * AgriStack Farmer ID Card Studio Pro
 * Advanced Generator with Precision A4 Upper-Center Print Engine
 * (c) e-Mudra CSC & Aaple Sarkar Seva Kendra
 */

// Default Blank State (Clean - No dummy / sample data)
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
  
  // Personal Info (Clean / Empty by default)
  farmerNameMr: '',
  farmerNameEn: '',
  farmerId: '',
  aadhaarRef: '',
  mobile: '',
  dob: '',
  gender: '',
  photoUrl: '', // blank by default

  // Land Info (Clean / Empty by default)
  district: '',
  taluka: '',
  village: '',
  pincode: '',
  khataNo: '',
  gatNo: '',
  totalArea: '',
  holdingType: '',
  
  // CSC & VLE Info (Optional)
  cscRegId: '',
  vleName: '',
  issueDate: new Date().toLocaleDateString('mr-IN'),

  // Multi-land holdings (Empty by default)
  landRecords: []
};

// Default clean neutral silhouette for photo placeholder
const DEFAULT_BLANK_PHOTO = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 200" width="160" height="200">
  <rect width="160" height="200" fill="#e2e8f0"/>
  <circle cx="80" cy="72" r="32" fill="#94a3b8"/>
  <path d="M 28 180 C 28 132, 54 122, 80 122 C 106 122, 132 132, 132 180 Z" fill="#94a3b8"/>
  <text x="80" y="190" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#64748b" font-weight="bold">PHOTO</text>
</svg>
`);
const DEFAULT_FARMER_AVATAR = DEFAULT_BLANK_PHOTO;

// DOM Elements
let qrCodeInstanceFront = null;
let qrCodeInstanceA4 = null;
let qrCodeInstanceFlip = null;

document.addEventListener('DOMContentLoaded', () => {
  cardState.photoUrl = '';
  const thumb = document.getElementById('photoPreviewThumb');
  if (thumb) thumb.src = DEFAULT_BLANK_PHOTO;
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
  cardState.photoUrl = '';
  const thumb = document.getElementById('photoPreviewThumb');
  if (thumb) thumb.src = DEFAULT_BLANK_PHOTO;
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
  if (!cardState.landRecords || cardState.landRecords.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:12px 8px; color:#64748b; font-size:0.75rem; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:6px;">
        कोणतीही नोंद नाही. नवीन नोंद जोडण्यासाठी "नवीन गट नोंद जोडा" दाबा किंवा HTML फाईल अपलोड करा.
      </div>
    `;
    return;
  }

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
  if (!cardState.landRecords) cardState.landRecords = [];
  cardState.landRecords.push({
    village: cardState.village || '',
    gat: '',
    khata: cardState.khataNo || '',
    area: ''
  });
  renderLandRecordsEditor();
  renderAllCards();
}

function deleteLandRow(index) {
  if (cardState.landRecords && cardState.landRecords.length > 0) {
    cardState.landRecords.splice(index, 1);
    renderLandRecordsEditor();
    renderAllCards();
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
    : `<span>केवळ माहितीसाठी</span>`;

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
            <span class="card-id-val">${cardState.farmerId || '—'}</span>
          </div>

          <!-- Names -->
          <div class="farmer-name-marathi">${cardState.farmerNameMr || '—'}</div>
          <div class="farmer-name-english">${cardState.farmerNameEn || '—'}</div>

          <!-- Info Grid -->
          <div class="info-grid-compact">
            <div class="info-item">
              <span class="info-label">जन्म / वय:</span>
              <span class="info-value">${cardState.dob || '—'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">लिंग:</span>
              <span class="info-value">${cardState.gender || '—'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">मोबाईल:</span>
              <span class="info-value">${cardState.mobile || '—'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">आधार क्र.:</span>
              <span class="info-value">${cardState.aadhaarRef || '—'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">गाव:</span>
              <span class="info-value">${cardState.village || '—'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">तालुका:</span>
              <span class="info-value">${cardState.taluka || '—'}</span>
            </div>
          </div>

          <!-- Primary Land Summary Badge: ONLY Khata No & Total Area (Gat No removed per request) -->
          <div class="primary-land-badge">
            <div class="land-badge-item">
              <span class="land-badge-lbl">खाते क्रमांक:</span>
              <span class="land-badge-val">${cardState.khataNo || '—'}</span>
            </div>
            <div class="land-badge-divider">|</div>
            <div class="land-badge-item">
              <span class="land-badge-lbl">एकूण क्षेत्र:</span>
              <span class="land-badge-val">${cardState.totalArea || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Front Security Footer -->
      <div class="card-front-footer">
        <div class="footer-left-brand">
          <i class="fa-solid fa-triangle-exclamation" style="color:#d97706; font-size:4.2pt;"></i>
          <span>शासकीय वापरासाठी अधिकृत नाही • फक्त माहितीसाठी वैध</span>
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
  // Render land records with 8-A and Area
  let rows = '';
  if (cardState.landRecords && cardState.landRecords.length > 0) {
    rows = cardState.landRecords.slice(0, 7).map(r => `
      <tr>
        <td>${r.village || cardState.village || '—'}</td>
        <td><strong>${r.gat || '—'}</strong></td>
        <td>${r.khata || cardState.khataNo || '—'}</td>
        <td><strong>${r.area || '—'}</strong></td>
      </tr>
    `).join('');
  } else {
    rows = `
      <tr>
        <td colspan="4" style="text-align: center; color: #94a3b8; padding: 20px 8px; font-size: 0.72rem;">
          कोणतीही नोंद उपलब्ध नाही (HTML अपलोड करा किंवा नोंद जोडा)
        </td>
      </tr>
    `;
  }

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
    : `<div class="back-csc-pill"><i class="fa-solid fa-circle-info"></i> शेतकरी माहिती संदर्भ पत्र</div>`;

  const recCount = cardState.landRecords ? cardState.landRecords.length : 0;
  const totArea = cardState.totalArea || (recCount > 0 ? '-' : '—');

  return `
    <div class="agristack-pvc-card card-back" id="cardBack_${uniqueIdSuffix}">
      <!-- Back Header -->
      <div class="back-header-bar">
        <div class="back-title">
          <img src="images/farmer_official_logo.png" class="back-header-seal" alt="Logo">
          <span>शेतजमीन धारणा तपशील (८-अ व सर्व्हे नोंदी)</span>
        </div>
        <div class="back-header-right">
          <span class="back-dist-label">जिल्हा: ${cardState.district || '—'}</span>
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
                <td colspan="2">एकूण सर्व्हे नोंदी: <strong>${recCount}</strong></td>
                <td colspan="2">एकूण क्षेत्र: <strong>${totArea}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Spacious Bottom Verification & Stamp Row (Barcode & Nominee removed) -->
        <div class="back-bottom-summary">
          <div class="back-bottom-left-info">
            ${backCscHtml}
            <div class="back-farmer-ref">
              <span>शेतकरी ओळख: <strong>${cardState.farmerId || '—'}</strong></span>
            </div>
          </div>
          <div class="back-seal-box">
            <div class="back-sign-line"></div>
            <span class="stamp-sign-label">स्वाक्षरी</span>
          </div>
        </div>
      </div>

      <!-- Back Terms / Disclaimer -->
      <div class="back-card-footer">
        <strong>सूचना:</strong> हे अधिकृत ओळखपत्र नाही किंवा शासकीय वापरासाठी अधिकृत नाही. हे कार्ड फक्त शेतकऱ्याच्या माहितीसाठी वैध राहील.
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
    const codeVal = (cardState.farmerId && cardState.farmerId.trim()) ? cardState.farmerId.trim() : '000000000000';
    JsBarcode(el, codeVal, {
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

// Reset Form (Clear all data to blank)
function resetCardForm() {
  if (confirm('सर्व माहिती रिकामी करायची आहे का?')) {
    cardState.farmerNameMr = '';
    cardState.farmerNameEn = '';
    cardState.farmerId = '';
    cardState.aadhaarRef = '';
    cardState.mobile = '';
    cardState.dob = '';
    cardState.gender = '';
    cardState.district = '';
    cardState.taluka = '';
    cardState.village = '';
    cardState.pincode = '';
    cardState.khataNo = '';
    cardState.gatNo = '';
    cardState.totalArea = '';
    cardState.holdingType = '';
    cardState.cscRegId = '';
    cardState.vleName = '';
    cardState.photoUrl = '';
    cardState.landRecords = [];

    const thumb = document.getElementById('photoPreviewThumb');
    if (thumb) thumb.src = DEFAULT_BLANK_PHOTO;

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

// Clean extracted name string: strip trailing glued labels, collapse whitespaces, keep exact spelling as-is
function cleanExtractedName(str) {
  if (!str) return '';
  const stopKeywords = [
    /\s+(?:Farmer\s*Id|Enrollment\s*Id|Father|Husband|Identifier|Gender|DOB|Date\s*of\s*Birth|Age|Mobile|Aadhaar|Aadhar|Address|State|District|Taluka|Village|Pincode|Pin|Survey|Gat|Khata|Total\s*Area|Assigned\s*Area|Status|Photo|Reg|CSC|VLE).*/i,
    /\s+(?:शेतकरी\s*आयडी|नोंदणी\s*क्रमांक|वडील|पती|नाते|लिंग|जन्मतारीख|वय|मोबाईल|आधार|पत्ता|राज्य|जिल्हा|तालुका|गाव|पिन|पिनकोड|गट|सर्व्हे|खाते|क्षेत्र|स्थिती|फोटो|नोंद).*/i
  ];
  let cleaned = str.trim();
  for (const re of stopKeywords) {
    cleaned = cleaned.replace(re, '').trim();
  }
  // Remove bounding colons, hyphens, quotes, slashes, asterisks
  cleaned = cleaned.replace(/^[:\-\s\.\,\*\/]+|[:\-\s\.\,\*\/]+$/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

// Universal high-accuracy Aadhaar Number extractor (supports Masked, Bullets, Full 12 digits, Bilingual labels)
function extractAadhaarNumber(text) {
  if (!text) return '';
  let rawAadhaar = '';

  // 1. Explicit Label Match: handles bilingual labels with slashes/parentheses, colons, dashes
  // Examples: "Aadhaar Number / आधार क्रमांक : XXXX XXXX 1234", "Aadhaar No. (आधार क्र.): •••• •••• 1234"
  const labelRegex = /(?:Aadhaar|Aadhar|आधार|UIDAI|UID)\s*(?:(?:\/|\(|\b)[^\n\:]{0,50})?[:\-]?\s*([Xx\*\.\u2022•×\d]{4}[\s\-]?[Xx\*\.\u2022•×\d]{4}[\s\-]?[0-9]{4}|[Xx\*\.\u2022•×]{8}[\s\-]?[0-9]{4}|[0-9]{12})/i;
  const m1 = text.match(labelRegex);
  if (m1) {
    rawAadhaar = m1[1].trim();
  }

  // 2. Standalone masked Aadhaar anywhere in text (XXXX XXXX 1234 or •••• •••• 1234 or ********1234)
  if (!rawAadhaar) {
    const standaloneMasked = text.match(/\b([Xx\*\.\u2022•×]{4}[\s\-]?[Xx\*\.\u2022•×]{4}[\s\-]?[0-9]{4})\b/i) ||
                             text.match(/([Xx\*\.\u2022•×]{8}[\s\-]?[0-9]{4})/i);
    if (standaloneMasked) {
      rawAadhaar = standaloneMasked[1].trim();
    }
  }

  // 3. Standalone 12-digit formatted (1234 5678 9012 or 1234-5678-9012)
  if (!rawAadhaar) {
    const standalone12Formatted = text.match(/\b([0-9]{4}[\s\-][0-9]{4}[\s\-][0-9]{4})\b/);
    if (standalone12Formatted) {
      rawAadhaar = standalone12Formatted[1].trim();
    }
  }

  // 4. Standalone 12 digits near Aadhaar/UID keyword
  if (!rawAadhaar) {
    const near12 = text.match(/(?:Aadhaar|Aadhar|आधार|UID)[\s\S]{0,120}?\b([0-9]{12})\b/i);
    if (near12) {
      rawAadhaar = near12[1].trim();
    }
  }

  // 5. Last 4 digits match if full mask is omitted
  if (!rawAadhaar) {
    const last4 = text.match(/(?:Aadhaar|Aadhar|आधार)\s*(?:[^\n\:]{0,40})?(?:ending\s*with|last\s*4\s*digits?|शेवटचे\s*४\s*अंक|शेवटचे\s*4\s*अंक)?\s*[:\-]?\s*(?:[Xx\*\.\u2022•×]{4,8}\s*)?([0-9]{4})\b/i);
    if (last4 && last4[1]) {
      rawAadhaar = `XXXX XXXX ${last4[1]}`;
    }
  }

  if (rawAadhaar) {
    // Normalize unicode mask characters to 'X'
    let norm = rawAadhaar.replace(/[\u2022•×\*\.]/g, 'X');
    const cleanDigitsOrX = norm.replace(/[\s\-]/g, '');
    if (cleanDigitsOrX.length === 12) {
      return `${cleanDigitsOrX.slice(0, 4)} ${cleanDigitsOrX.slice(4, 8)} ${cleanDigitsOrX.slice(8, 12)}`;
    }
    return norm;
  }
  return '';
}

// Marathi Devanagari transliterator for Marathi Names (used ONLY as emergency fallback if English is absent from file)
function transliterateMarathiToEnglish(nameMr) {
  if (!nameMr || !nameMr.trim()) return '';
  const map = {
    'अ':'A','आ':'AA','इ':'I','ई':'I','उ':'U','ऊ':'U','ऋ':'RI','ए':'E','ऐ':'AI','ओ':'O','औ':'AU','अं':'AM','अः':'AH',
    'क':'K','ख':'KH','ग':'G','घ':'GH','ङ':'NG',
    'च':'CH','छ':'CHH','ज':'J','झ':'JH','ञ':'NY',
    'ट':'T','ठ':'TH','ड':'D','ढ':'DH','ण':'N',
    'त':'T','थ':'TH','द':'D','ध':'DH','न':'N',
    'प':'P','फ':'PH','ब':'B','भ':'BH','म':'M',
    'य':'Y','र':'R','ल':'L','व':'V','श':'SH','ष':'SH','स':'S','ह':'H','ळ':'L',
    'क्ष':'KSH','ज्ञ':'DNY','श्र':'SHR',
    'ा':'A','ि':'I','ी':'I','ु':'U','ू':'U','ृ':'RI','े':'E','ै':'AI','ो':'O','ौ':'AU','ं':'N','ः':'H','्':''
  };

  const knownDict = {
    'गजानन': 'GAJANAN', 'दत्तात्रय': 'DATTATRAY', 'दत्तात्रेय': 'DATTATREYA',
    'सुतार': 'SUTAR', 'पाटील': 'PATIL', 'शिंदे': 'SHINDE', 'पवार': 'PAWAR',
    'जाधव': 'JADHAV', 'कदम': 'KADAM', 'देशमुख': 'DESHMUKH', 'सावंत': 'SAWANT',
    'चव्हाण': 'CHAVAN', 'राणे': 'RANE', 'भोसले': 'BHOSALE', 'गायकवाड': 'GAIKWAD',
    'सखाराम': 'SAKHARAM', 'नामदेव': 'NAMDEV', 'रमेश': 'RAMESH', 'सुरेश': 'SURESH',
    'गणेश': 'GANESH', 'महेश': 'MAHESH', 'राजेश': 'RAJESH', 'संतोष': 'SANTOSH',
    'संदीप': 'SANDIP', 'सचिन': 'SACHIN', 'अमोल': 'AMOL', 'विकास': 'VIKAS',
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
    district: '',
    taluka: '',
    village: '',
    pincode: '',
    khataNo: '',
    gatNo: '',
    totalArea: '',
    holdingType: 'वर्ग-१ (स्वमालकी)',
    cscRegId: '',
    vleName: '',
    photoUrl: '',
    landRecords: []
  };

  // Helper to read value from an element or input (supports Angular ng-reflect-model, value, etc.)
  function readElementValue(el) {
    if (!el) return '';
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
      const val = el.getAttribute('ng-reflect-model') ||
                  el.value ||
                  el.getAttribute('value') ||
                  el.getAttribute('ng-reflect-value') ||
                  el.getAttribute('data-value') ||
                  el.defaultValue ||
                  '';
      if (val && typeof val === 'string' && val.trim()) return val.trim();
    }
    const valLabel = el.querySelector('.ng-value-label, .p-dropdown-label');
    if (valLabel && valLabel.textContent.trim()) return valLabel.textContent.trim();
    const valDiv = el.querySelector('.ng-value');
    if (valDiv && valDiv.textContent.trim()) return valDiv.textContent.replace('×', '').trim();

    const childInp = el.querySelector('input, select');
    if (childInp) {
      const childVal = readElementValue(childInp);
      if (childVal) return childVal;
    }
    return (el.textContent || '').trim();
  }

  // Multi-key control reader
  function readControlMulti(keys) {
    for (const key of keys) {
      const el = doc.querySelector(`[formcontrolname="${key}"], [name="${key}"], #${key}`);
      if (el) {
        const val = readElementValue(el);
        if (val) return val;
      }
    }
    return '';
  }

  // Find value in DOM adjacent to label texts
  function findValueNearLabels(labelTexts, requirePattern) {
    const elements = doc.querySelectorAll('label, th, td, dt, span, div.form_control, div.form-group, div.col, p');
    for (const el of elements) {
      const txt = (el.textContent || '').trim().toLowerCase();
      const matchesLabel = labelTexts.some(lt => txt.includes(lt.toLowerCase()));
      if (matchesLabel) {
        // Child input
        const inp = el.querySelector('input');
        if (inp) {
          const v = readElementValue(inp);
          if (v && (!requirePattern || requirePattern.test(v))) return v;
        }
        // Next sibling
        let next = el.nextElementSibling;
        if (next) {
          const v = readElementValue(next);
          if (v && (!requirePattern || requirePattern.test(v))) return v;
        }
        // Parent's next sibling
        if (el.parentElement && el.parentElement.nextElementSibling) {
          const v = readElementValue(el.parentElement.nextElementSibling);
          if (v && (!requirePattern || requirePattern.test(v))) return v;
        }
      }
    }
    return '';
  }

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

  if (!result.farmerId) {
    result.farmerId = readControlMulti(['farmerId', 'farmer_id', 'farmerIdentificationNumber']);
  }
  if (!result.farmerId) {
    const fidMatch = htmlString.match(/Farmer\s*Id[\s\S]{0,120}?<span[^>]*>\s*([0-9A-Z_]{8,20})\s*<\/span>/i) ||
                     htmlString.match(/<span[^>]*>\s*([0-9]{10,14})\s*<\/span>[\s\S]{0,120}?Farmer\s*Id/i) ||
                     htmlString.match(/Farmer\s*Id\s*[:\-]?\s*([0-9]{10,14})/i);
    if (fidMatch) result.farmerId = fidMatch[1];
  }

  if (!result.enrollmentId) {
    result.enrollmentId = readControlMulti(['enrollmentId', 'enrollment_id', 'farmerEnrollmentId']);
  }
  if (!result.enrollmentId) {
    const enrollMatch = htmlString.match(/([0-9]{2}_[0-9]{3}_[0-9]{4}_[0-9]{6}_[0-9]{6})/);
    if (enrollMatch) result.enrollmentId = enrollMatch[1];
  }

  // 2. Photo Extraction (Base64 or URL)
  const controls = doc.querySelectorAll('.form_control');
  controls.forEach(ctrl => {
    if (ctrl.textContent.includes('Photograph') || ctrl.textContent.includes('फोटो')) {
      const img = ctrl.querySelector('img');
      if (img && img.src && (img.src.startsWith('data:image') || img.src.length > 250)) {
        result.photoUrl = img.src;
      }
    }
  });

  if (!result.photoUrl) {
    const allImgs = doc.querySelectorAll('img');
    for (const img of allImgs) {
      if (img.src && img.src.startsWith('data:image/') && img.src.length > 300) {
        result.photoUrl = img.src;
        break;
      }
    }
  }

  // 3. Multi-source Aadhaar Extraction
  let rawAadhaar = readControlMulti(['aadhaarNumber', 'aadhaar', 'aadharNumber', 'aadharNo', 'aadhaarNo']);
  if (!rawAadhaar) {
    const aadhInput = doc.querySelector('input[formcontrolname="aadhaarNumber"], input[formcontrolname*="aadhaar"], input[id*="aadhaar"], input[placeholder*="Aadhaar"]');
    if (aadhInput) {
      rawAadhaar = readElementValue(aadhInput);
    }
  }
  if (!rawAadhaar) {
    const labels = doc.querySelectorAll('label, th, td, span, div.form_control');
    for (const lbl of labels) {
      const txt = (lbl.textContent || '').trim();
      if ((txt.includes('Aadhaar Number') || txt.includes('Aadhar Number') || txt.includes('आधार क्रमांक') || txt.includes('आधार क्र')) && !txt.toLowerCase().includes('as per')) {
        const inp = lbl.querySelector('input') || (lbl.nextElementSibling && lbl.nextElementSibling.querySelector('input')) || (lbl.parentElement ? lbl.parentElement.querySelector('input') : null);
        if (inp) {
          const v = readElementValue(inp);
          if (v) {
            rawAadhaar = v;
            break;
          }
        }
        const textValMatch = (lbl.parentElement ? lbl.parentElement.textContent : txt).match(/([0-9Xx\*\.\u2022•×]{4}[\s\-]?[0-9Xx\*\.\u2022•×]{4}[\s\-]?[0-9]{4}|[0-9]{12}|[Xx\*\.\u2022•×]{8}[\s\-]?[0-9]{4})/);
        if (textValMatch) {
          rawAadhaar = textValMatch[1];
          break;
        }
      }
    }
  }
  if (!rawAadhaar) {
    rawAadhaar = extractAadhaarNumber(htmlString);
  } else {
    rawAadhaar = extractAadhaarNumber(rawAadhaar) || rawAadhaar;
  }
  result.aadhaarRef = rawAadhaar;

  // ==========================================
  // 4. FARMER NAME EXTRACTION (EXACT AS-IS PRESERVATION)
  // ==========================================
  const enControlKeys = [
    'aadhaarFarmerNameInEnglish',
    'farmerNameInEnglish',
    'farmerNameEnglish',
    'farmerNameEn',
    'aadhaarFarmerName',
    'farmerNameAsPerAadhaar',
    'aadhaarName',
    'nameInEnglish',
    'nameAsPerAadhaar',
    'farmer_name_en',
    'farmer_name_english',
    'farmerName',
    'name'
  ];
  result.farmerNameEn = readControlMulti(enControlKeys);

  // If farmerName was read from a generic key like 'farmerName' or 'name', verify it's English
  if (result.farmerNameEn && !/[A-Za-z]{2,}/.test(result.farmerNameEn)) {
    // If it has Devanagari instead, treat it as Marathi name
    if (/[\u0900-\u097F]{2,}/.test(result.farmerNameEn) && !result.farmerNameMr) {
      result.farmerNameMr = result.farmerNameEn;
    }
    result.farmerNameEn = '';
  }

  // Label search in DOM for English Name
  if (!result.farmerNameEn) {
    const enLabelVal = findValueNearLabels(
      ['Farmer Name (as per Aadhaar)', 'Name as per Aadhaar', 'Farmer Name (English)', 'Farmer Name in English', 'Name (English)'],
      /[A-Za-z]{2,}/
    );
    if (enLabelVal) result.farmerNameEn = enLabelVal;
  }

  // Regex fallback in htmlString for English Name
  if (!result.farmerNameEn) {
    const enRegexPatterns = [
      /formcontrolname=["'](?:aadhaarFarmerNameInEnglish|farmerNameInEnglish|farmerNameEnglish|farmerNameEn|farmerNameAsPerAadhaar|aadhaarName)["'][^>]*?(?:ng-reflect-model|ng-reflect-value|value)=["']([^"']+)["']/i,
      /(?:ng-reflect-model|ng-reflect-value|value)=["']([^"']+)["'][^>]*?formcontrolname=["'](?:aadhaarFarmerNameInEnglish|farmerNameInEnglish|farmerNameEnglish|farmerNameEn|farmerNameAsPerAadhaar|aadhaarName)["']/i,
      /(?:Farmer\s*Name\s*(?:as\s*per\s*Aadhaar|\(as\s*per\s*Aadhaar\)|\(English\)|\(In\s*English\)|in\s*English)?|Name\s*as\s*per\s*Aadhaar|Name\s*\(English\))[\s\S]{0,180}?(?:(?:ng-reflect-model|ng-reflect-value|value)=["']([A-Za-z\s\.\'\-]{3,60})["']|<(?:span|div|p|td|strong|b)[^>]*>([A-Za-z\s\.\'\-]{3,60})<\/(?:span|div|p|td|strong|b)>)/i
    ];
    for (const re of enRegexPatterns) {
      const m = htmlString.match(re);
      if (m) {
        const val = cleanExtractedName(m[1] || m[2]);
        if (val && /[A-Za-z]{2,}/.test(val)) {
          result.farmerNameEn = val;
          break;
        }
      }
    }
  }

  // Marathi Name Extraction
  const mrControlKeys = [
    'farmerNameInLocal',
    'farmerNameLocal',
    'farmerNameInMarathi',
    'farmerNameMarathi',
    'farmerNameMr',
    'farmer_name_local',
    'farmer_name_mr',
    'localFarmerName'
  ];
  result.farmerNameMr = readControlMulti(mrControlKeys);

  // Label search in DOM for Marathi Name
  if (!result.farmerNameMr) {
    const mrLabelVal = findValueNearLabels(
      ['शेतकऱ्याचे नाव (स्थानिक)', 'शेतकऱ्याचे नाव (मराठी)', 'स्थानिक भाषेतील नाव', 'स्थानिक नाव', 'शेतकऱ्याचे नाव', 'आधार प्रमाणे नाव', 'खातेदाराचे नाव', 'मालकाचे नाव'],
      /[\u0900-\u097F]{2,}/
    );
    if (mrLabelVal) result.farmerNameMr = mrLabelVal;
  }

  // Regex fallback in htmlString for Marathi Name
  if (!result.farmerNameMr) {
    const mrRegexPatterns = [
      /formcontrolname=["'](?:farmerNameInLocal|farmerNameLocal|farmerNameInMarathi|farmerNameMarathi|farmerNameMr|localFarmerName)["'][^>]*?(?:ng-reflect-model|ng-reflect-value|value)=["']([^"']+)["']/i,
      /(?:ng-reflect-model|ng-reflect-value|value)=["']([\u0900-\u097F\s\.\'\-]{3,60})["'][^>]*?formcontrolname=["'](?:farmerNameInLocal|farmerNameLocal|farmerNameInMarathi|farmerNameMarathi|farmerNameMr|localFarmerName)["']/i,
      /(?:शेतकऱ्याचे\s*नाव\s*(?:\(स्थानिक\)|\(मराठी\)|\(आधार\s*प्रमाणे\))?|स्थानिक\s*भाषेतील\s*नाव|स्थानिक\s*नाव|खातेदाराचे\s*नाव|मालकाचे\s*नाव|Farmer\s*Name\s*\(Local\))[\s\S]{0,180}?(?:(?:ng-reflect-model|ng-reflect-value|value)=["']([\u0900-\u097F\s\.\'\-]{3,60})["']|<(?:span|div|p|td|strong|b)[^>]*>([\u0900-\u097F\s\.\'\-]{3,60})<\/(?:span|div|p|td|strong|b)>)/i
    ];
    for (const re of mrRegexPatterns) {
      const m = htmlString.match(re);
      if (m) {
        const val = cleanExtractedName(m[1] || m[2]);
        if (val && /[\u0900-\u097F]{2,}/.test(val)) {
          result.farmerNameMr = val;
          break;
        }
      }
    }
  }

  // 5. Other Personal & Contact Info
  result.identifierNameEn = readControlMulti(['farmerIdentiferNameInEnglish', 'identifierNameInEnglish', 'fatherNameInEnglish']);
  result.identifierNameMr = readControlMulti(['farmerIdentiferNameInLocal', 'identifierNameInLocal', 'fatherNameInLocal']);
  result.dob = readControlMulti(['famerDateOfBirth', 'farmerDob', 'dateOfBirth', 'dob']);
  result.age = readControlMulti(['farmerAge', 'age']);
  result.mobile = readControlMulti(['mobileNumber', 'mobile', 'phone']);
  result.email = readControlMulti(['emailId', 'email']);
  result.pincode = readControlMulti(['pincode', 'pinCode', 'pin']);

  const rawGender = readControlMulti(['gender', 'farmerGender']);
  if (rawGender) {
    if (rawGender.toLowerCase().includes('male') && !rawGender.toLowerCase().includes('female')) {
      result.gender = 'पुरुष / MALE';
    } else if (rawGender.toLowerCase().includes('female')) {
      result.gender = 'स्त्री / FEMALE';
    } else {
      result.gender = rawGender;
    }
  }

  const rawCaste = readControlMulti(['casteCategory', 'caste']);
  if (rawCaste) result.caste = rawCaste;

  const rawState = readControlMulti(['state', 'stateName']);
  if (rawState) result.state = rawState.toLowerCase().includes('maha') ? 'महाराष्ट्र' : rawState;

  const rawDist = readControlMulti(['district', 'districtName']);
  if (rawDist) result.district = rawDist.trim();

  const rawTal = readControlMulti(['taluka', 'talukaName', 'tahsil']);
  if (rawTal) result.taluka = rawTal.trim();

  const rawVil = readControlMulti(['village', 'villageName']);
  if (rawVil) result.village = rawVil.trim();

  // 6. CSC Registration ID / Operator ID
  const cscPill = doc.querySelector('.profile_div .p-button-label') || doc.querySelector('.profile_div button');
  if (cscPill && cscPill.textContent.trim().match(/^[0-9]{10,16}$/)) {
    result.cscRegId = cscPill.textContent.trim();
  } else {
    const cscMatch = htmlString.match(/class=["']p-button-label["'][^>]*>\s*([0-9]{10,16})\s*<\/span>/);
    if (cscMatch) result.cscRegId = cscMatch[1];
  }

  // 7. Land Details Table Extraction (Survey Numbers, 8-A Khata No, Extent Area)
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

          if (owner && !result.farmerNameMr) result.farmerNameMr = cleanExtractedName(owner);
          if (ident && !result.identifierNameMr) result.identifierNameMr = cleanExtractedName(ident);
          if (khata && !result.khataNo) result.khataNo = khata;
          if (v && !result.village) result.village = v;

          if (fullGat) {
            result.landRecords.push({
              village: v || result.village || '',
              gat: fullGat,
              khata: khata || result.khataNo || '',
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

  // Final Name Cleaning & Preservation (DO NOT ALTER SPELLING)
  if (result.farmerNameEn) {
    result.farmerNameEn = cleanExtractedName(result.farmerNameEn);
  }
  if (result.farmerNameMr) {
    result.farmerNameMr = cleanExtractedName(result.farmerNameMr);
  }

  // Only if English is completely absent from the file, transliterate from Marathi
  if (result.farmerNameMr && !result.farmerNameEn) {
    result.farmerNameEn = transliterateMarathiToEnglish(result.farmerNameMr);
  }
  // Only if Marathi is completely absent from the file, use English
  if (!result.farmerNameMr && result.farmerNameEn) {
    result.farmerNameMr = result.farmerNameEn;
  }

  if (result.landRecords.length > 0 && !result.gatNo) {
    result.gatNo = result.landRecords[0].gat;
  }
  if (!result.khataNo && result.landRecords.length > 0) {
    result.khataNo = result.landRecords[0].khata;
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
  const extAadh = document.getElementById('extAadhaar');
  if (extAadh) extAadh.textContent = data.aadhaarRef || '-';
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

function loadUserPastedSampleData() {
  closeAgristackImportModal();
}

// Master Application: Updates cardState, syncs editor, renders all cards, and alerts
function applyExtractedDataToCard(data, sourceName) {
  cardState.farmerNameMr = data.farmerNameMr || cardState.farmerNameMr;
  cardState.farmerNameEn = data.farmerNameEn || cardState.farmerNameEn;
  cardState.farmerId = data.farmerId || cardState.farmerId;
  cardState.aadhaarRef = data.aadhaarRef || cardState.aadhaarRef;
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

// PDF Parser using PDF.js & Tesseract.js for uploaded AgriStack PDF documents
async function processAgristackPdfFile(file, isDirect) {
  const modal = document.getElementById('agristackImportModal');
  const loadingEl = document.getElementById('importLoadingState');
  const loadingText = document.getElementById('importLoadingText');

  if (isDirect && modal) {
    modal.style.display = 'flex';
    switchImportModalTab('mtab-file');
  }

  if (loadingEl) {
    loadingEl.style.display = 'flex';
    if (loadingText) loadingText.textContent = 'PDF फाईलमधून माहिती फेच करत आहे...';
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF.js लायब्ररी लोड झालेली नाही.');
    }

    let pdf;
    try {
      pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    } catch (e) {
      pdf = await pdfjsLib.getDocument({ data: arrayBuffer, disableWorker: true }).promise;
    }

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
      dob: '',
      gender: '',
      district: '',
      taluka: '',
      village: '',
      pincode: '',
      khataNo: '',
      gatNo: '',
      totalArea: '',
      photoUrl: '',
      landRecords: []
    };

    // Pre-populate enrollment ID from filename if present
    const fileEnrollMatch = file.name.match(/([0-9]{2}_[0-9]{3}_[0-9]{4}_[0-9]{6}_[0-9]{6})/);
    if (fileEnrollMatch) {
      extracted.enrollmentId = fileEnrollMatch[1];
    }

    // IF PDF IS IMAGE-BASED (Canvas/Scan export with little to no selectable text)
    if (!fullText || fullText.trim().length <= 30) {
      if (loadingText) {
        loadingText.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> PDF इमेज स्वरूपात आहे. AI द्वारे मजकूर व मूळ फोटो फेच करत आहे...';
      }

      // Render Page 1 to canvas at high resolution (scale 2.0)
      let canvas1 = null;
      if (pdf.numPages >= 1) {
        const page1 = await pdf.getPage(1);
        const viewport1 = page1.getViewport({ scale: 2.0 });
        canvas1 = document.createElement('canvas');
        canvas1.width = viewport1.width;
        canvas1.height = viewport1.height;
        const ctx1 = canvas1.getContext('2d');
        await page1.render({ canvasContext: ctx1, viewport: viewport1 }).promise;

        // Crop Farmer Photograph from Page 1 (Top-Right)
        try {
          const photoX = Math.round(canvas1.width * 0.892);
          const photoY = Math.round(canvas1.height * 0.175);
          const photoW = Math.round(canvas1.width * 0.082);
          const photoH = Math.round(canvas1.height * 0.133);

          const photoCanvas = document.createElement('canvas');
          photoCanvas.width = photoW;
          photoCanvas.height = photoH;
          const pctx = photoCanvas.getContext('2d');
          pctx.drawImage(canvas1, photoX, photoY, photoW, photoH, 0, 0, photoW, photoH);
          extracted.photoUrl = photoCanvas.toDataURL('image/png');
        } catch (cropErr) {
          console.warn('Photo crop error:', cropErr);
        }
      }

      // Render Page 2 to canvas at scale 2.0 (if present)
      let canvas2 = null;
      if (pdf.numPages >= 2) {
        const page2 = await pdf.getPage(2);
        const viewport2 = page2.getViewport({ scale: 2.0 });
        canvas2 = document.createElement('canvas');
        canvas2.width = viewport2.width;
        canvas2.height = viewport2.height;
        const ctx2 = canvas2.getContext('2d');
        await page2.render({ canvasContext: ctx2, viewport: viewport2 }).promise;
      }

      // Run Tesseract.js OCR in-browser if available
      if (typeof Tesseract !== 'undefined') {
        try {
          if (loadingText) loadingText.textContent = 'AI OCR: पान १ मधील शेतकरी तपशील वाचत आहे...';
          const worker = await Tesseract.createWorker(['eng', 'mar']);
          const ret1 = await worker.recognize(canvas1);
          fullText = (ret1 && ret1.data && ret1.data.text) ? ret1.data.text : '';

          if (canvas2) {
            if (loadingText) loadingText.textContent = 'AI OCR: पान २ मधील शेतजमीन व गाव वाचत आहे...';
            const ret2 = await worker.recognize(canvas2);
            if (ret2 && ret2.data && ret2.data.text) {
              fullText += '\n' + ret2.data.text;
            }
          }
          await worker.terminate();
        } catch (ocrErr) {
          console.warn('In-browser OCR error:', ocrErr);
        }
      }
    }

    // Now extract all fields from fullText
    const fidMatch = fullText.match(/Farmer\s*Id\s*[:\-\s_u\.]*([0-9A-Z_]{8,20})/i) ||
                     fullText.match(/([0-9]{10,12})\s*Farmer\s*Id/i) ||
                     fullText.match(/\b([0-9]{11})\b/);
    if (fidMatch) extracted.farmerId = fidMatch[1];

    extracted.aadhaarRef = extractAadhaarNumber(fullText);

    const enrollMatch = fullText.match(/([0-9]{2}[\_\.\s][0-9]{3}[\_\.\s][0-9]{4}[\_\.\s][0-9]{6}[\_\.\s][0-9]{6})/);
    if (enrollMatch) {
      extracted.enrollmentId = enrollMatch[1].replace(/[\.\s]/g, '_');
    }

    const mobileMatch = fullText.match(/(?:Mobile\s*(?:Number)?|मोबाईल)\s*[:\-]?\s*([6-9][0-9]{9})/i);
    if (mobileMatch) extracted.mobile = mobileMatch[1];

    const dobMatch = fullText.match(/(?:DOB|Date\s*of\s*Birth|जन्मतारीख)\s*[:\-]?\s*([0-9]{2}[\/\-][0-9]{2}[\/\-][0-9]{4})/i);
    if (dobMatch) extracted.dob = dobMatch[1];

    const genderMatch = fullText.match(/(?:Gender|लिंग)\s*[:\-]?\s*(पुरुष|स्त्री|MALE|FEMALE)/i);
    if (genderMatch) {
      const g = genderMatch[1].toUpperCase();
      extracted.gender = (g.includes('MALE') || g.includes('पुरुष')) ? 'पुरुष / MALE' : 'स्त्री / FEMALE';
    }

    // Location: Land Table or Text
    const tableLocMatch = fullText.match(/MAHARAS[A-Z\s]*\|\s*([A-Za-z\s\u0900-\u097F]+?)\s*\|\s*([A-Za-z\s\u0900-\u097F]+?)\s*\|\s*([A-Za-z\s\u0900-\u097F]+?)\s*\|/i) ||
                          fullText.match(/\|\s*([A-Z\s]{4,20})\s*\|\s*([A-Za-z\u0900-\u097F\s]{3,25})\s*\|\s*([A-Za-z\u0900-\u097F\s]{3,25})\s*\|\s*[0-9]+/);
    if (tableLocMatch) {
      extracted.district = cleanExtractedName(tableLocMatch[1]);
      extracted.taluka = cleanExtractedName(tableLocMatch[2]);
      extracted.village = cleanExtractedName(tableLocMatch[3]);
    } else {
      const distMatch = fullText.match(/(?:District|जिल्हा)\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s\(\)]+?)(?=\s+(?:Sub\s*District|Taluka|तालुका|Village|गाव|Pin|पिन|$))/i);
      if (distMatch) extracted.district = cleanExtractedName(distMatch[1]);

      const talMatch = fullText.match(/(?:Sub\s*District|Taluka|तालुका)\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s\(\)]+?)(?=\s+(?:Village|गाव|District|जिल्हा|Pin|पिन|$))/i);
      if (talMatch) extracted.taluka = cleanExtractedName(talMatch[1]);

      const vilMatch = fullText.match(/(?:Village|गाव)\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s\(\)]+?)(?=\s+(?:S\s*No|Taluka|तालुका|District|जिल्हा|Pin|पिन|$))/i);
      if (vilMatch) extracted.village = cleanExtractedName(vilMatch[1]);
    }

    // Village fallback from Address
    if (!extracted.village) {
      const addrMatch = fullText.match(/Address\s*In\s*(?:English|Local\s*Language)\s*[:\-]?\s*([A-Za-z\u0900-\u097F0-9\s\,\.\-]+?)(?=\s+(?:Address|Farmer\s*type|$))/i);
      if (addrMatch) {
        const parts = addrMatch[1].split(/[,/]/);
        if (parts.length > 1) {
          extracted.village = cleanExtractedName(parts[parts.length - 1]);
        }
      }
    }

    const pinMatch = fullText.match(/(?:Pincode|Pin\s*Code|पिन\s*कोड|पिन)\s*[:\-]?\s*([0-9]{6})/i);
    if (pinMatch) extracted.pincode = pinMatch[1];

    const khataMatch = fullText.match(/(?:खाते\s*(?:क्र\.?|क्रमांक|नंबर)?|Khata\s*(?:No\.?|Number)?|Owner\s*Number)\s*[:\-]?\s*([0-9]+)/i);
    if (khataMatch) extracted.khataNo = khataMatch[1];

    // Gat numbers & areas
    const gatList = [];
    const lines = fullText.split('\n');
    let areaSum = 0;
    for (const line of lines) {
      const gatRowMatch = line.match(/\|\s*([0-9]+(?:\s*[अ-हA-Za-z])?)\s*\|\s*[\*0-9]/);
      if (gatRowMatch) {
        gatList.push(gatRowMatch[1].trim());
      }
      const areaMatch = line.match(/\|\s*([0-9]+\.[0-9]{4,6})\s*\|/);
      if (areaMatch) {
        areaSum += parseFloat(areaMatch[1]);
      }
    }
    if (gatList.length > 0) {
      extracted.gatNo = [...new Set(gatList)].join(', ');
    } else {
      const gatMatch = fullText.match(/(?:Survey\s*(?:No\.?|Number)|Gat\s*(?:No\.?|Number)|गट\s*(?:क्र\.?|क्रमांक)|सर्व्हे\s*(?:क्र\.?|क्रमांक))\s*[:\-]?\s*([0-9\/\sA-Za-z\u0900-\u097F]+?)(?=\s+(?:Khata|खाते|Area|क्षेत्र|$))/i);
      if (gatMatch) extracted.gatNo = cleanExtractedName(gatMatch[1]);
    }

    if (areaSum > 0) {
      extracted.totalArea = `${areaSum.toFixed(4)} हेक्टर`;
    } else {
      const areaMatch = fullText.match(/(?:Total\s*Area|Assigned\s*Area|एकूण\s*क्षेत्र)\s*[:\-]?\s*([0-9\.\s]+(?:\s*हेक्टर|\s*हे\.आर\.|\s*Ha)?)/i);
      if (areaMatch) extracted.totalArea = cleanExtractedName(areaMatch[1]);
    }

    // Exact English Name from PDF
    const enPatterns = [
      /(?:Farmer\s*Name\s*(?:as\s*per\s*Aadhaar|as\s*per\s*Aadhar|\(as\s*per\s*Aadhaar\)|\(as\s*per\s*Aadhar\)|\(English\)|\(In\s*English\)|in\s*English)|Name\s*as\s*per\s*Aadhaar|Name\s*as\s*per\s*Aadhar|Name\s*\(English\))\s*[:\-_]?\s*([A-Za-z\s\.\'\-]{3,60}?)(?=\s+(?:Farmer['’]?s\s*Name|Farmer|Gender|Caste|Identifier|$))/i,
      /(?:Farmer['’]?s\s*Name|Name\s*of\s*Farmer|Farmer\s*Name)\s*[:\-_]?\s*([A-Za-z\s\.\'\-]{3,60}?)(?=\s+(?:Gender|Caste|Identifier|$))/i,
      /(?:Beneficiary\s*Name|Applicant\s*Name|Owner\s*Name)\s*[:\-_]?\s*([A-Za-z\s\.\'\-]{3,60})/i,
      /\bName\s*[:\-_]?\s*([A-Za-z\s\.\'\-]{3,60})/i
    ];

    for (const pat of enPatterns) {
      const m = fullText.match(pat);
      if (m) {
        const val = cleanExtractedName(m[1]);
        if (val && /[A-Za-z]{2,}/.test(val)) {
          extracted.farmerNameEn = val;
          break;
        }
      }
    }

    // Exact Marathi Name from PDF
    const mrPatterns = [
      /(?:Farmer['’]?s\s*Name\s*(?:in\s*Local\s*Language|\(Local\s*Language\)|\(Local\)|\(In\s*Local\)|in\s*Local)|Name\s*\(Local\))\s*[:\-_]?\s*([\u0900-\u097F\s\.\'\-]{3,60}?)(?=\s+(?:Gender|Date|Age|लिंग|जन्म|$))/i,
      /(?:शेतकऱ्याचे\s*नाव\s*(?:\(स्थानिक\)|\(मराठी\)|\(स्थानिक\s*भाषेत\)|\(आधार\s*प्रमाणे\))?|स्थानिक\s*भाषेतील\s*(?:शेतकऱ्याचे\s*)?नाव|स्थानिक\s*नाव|आधार\s*प्रमाणे\s*नाव|खातेदाराचे\s*नाव|मालकाचे\s*नाव|भोगवटादाराचे\s*नाव|अर्जदाराचे\s*नाव)\s*[:\-_]?\s*([\u0900-\u097F\s\.\'\-]{3,60}?)(?=\s+(?:Gender|Date|Age|लिंग|जन्म|$))/i,
      /(?:Owner\s*Name|Farmer\s*Name)\s*[:\-_]?\s*([\u0900-\u097F\s\.\'\-]{3,60})/i,
      /\bनाव\s*[:\-_]?\s*([\u0900-\u097F\s\.\'\-]{3,60})/
    ];

    for (const pat of mrPatterns) {
      const m = fullText.match(pat);
      if (m) {
        const val = cleanExtractedName(m[1]);
        if (val && /[\u0900-\u097F]{2,}/.test(val)) {
          extracted.farmerNameMr = val;
          break;
        }
      }
    }

    // Preserve exact names
    if (extracted.farmerNameEn) extracted.farmerNameEn = cleanExtractedName(extracted.farmerNameEn);
    if (extracted.farmerNameMr) extracted.farmerNameMr = cleanExtractedName(extracted.farmerNameMr);

    if (extracted.farmerNameMr && !extracted.farmerNameEn) {
      extracted.farmerNameEn = transliterateMarathiToEnglish(extracted.farmerNameMr);
    }
    if (!extracted.farmerNameMr && extracted.farmerNameEn) {
      extracted.farmerNameMr = extracted.farmerNameEn;
    }

    if (loadingEl) loadingEl.style.display = 'none';

    if (isDirect) {
      applyExtractedDataToCard(extracted, file.name);
      if (modal) modal.style.display = 'none';
    } else {
      displayExtractedPreviewInModal(extracted);
    }
  } catch (err) {
    if (loadingEl) loadingEl.style.display = 'none';
    console.error('PDF Parse Error:', err);
    alert('PDF वाचताना त्रुटी आली. कृपया HTML पेज अपलोड करा किंवा कोड पेस्ट करा: ' + (err.message || ''));
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
