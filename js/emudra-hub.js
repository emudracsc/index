/**
 * eMudra Hub (ई मुद्रा हब) - Client-Side Printing & Digital Utilities Engine
 * 100% Proprietary: eMudra CSC & Aaple Sarkar Seva Kendra (Kankavli, Sindhudurg)
 * All Rights Reserved • Zero External Third-Party Dependencies
 */

(function () {
  'use strict';

  // Global State for eMudra Hub
  window.eMudraHub = {
    activeTab: 'suite-smartprint',
    currentSubTab: {},
    passport: {
      image: null,
      zoom: 1,
      rotation: 0,
      border: 'thin',
      paper: '6x4',
      quantity: 8,
      bg: 'original',
      presetKey: 'a4_6',
      wCm: 3.2,
      hCm: 4.114,
      align: 'studio_center'
    },
    idcard: {
      type: 'aadhaar',
      frontImg: null,
      backImg: null,
      layout: 'side_by_side'
    },
    resizer: {
      image: null,
      targetKb: 50,
      width: 350,
      height: 450,
      format: 'image/jpeg',
      unit: 'px'
    },
    pdf: {
      images: [],
      filesToMerge: [],
      splitDoc: null,
      splitPages: []
    },
    upi: {
      vpa: '9890869793@ybl',
      name: 'Aaple Sarkar Seva Kendra (eMudra)',
      amount: '',
      centerId: '152153410016',
      phone: '9890869793'
    }
  };

  // Global Passport Country & Dimension Presets
  const HUB_COUNTRY_PRESETS = {
    a4_6: { wCm: 3.2, hCm: 4.114, label: "A4 6 Photos/Row (Equal Margins) - 3.2×4.114cm", colsA4: 6 },
    india: { wCm: 3.5, hCm: 4.5, label: "India (Passport/PAN) - 3.5×4.5cm", colsA4: 6 },
    usa: { wCm: 5.08, hCm: 5.08, label: "USA (Passport/Visa) - 2×2 inch", colsA4: 4 },
    uk: { wCm: 3.5, hCm: 4.5, label: "UK (Passport) - 3.5×4.5cm", colsA4: 6 },
    schengen: { wCm: 3.5, hCm: 4.5, label: "Schengen (Europe) - 3.5×4.5cm", colsA4: 6 },
    canada: { wCm: 5.0, hCm: 7.0, label: "Canada (Passport) - 50×70mm", colsA4: 4 },
    australia: { wCm: 3.5, hCm: 4.5, label: "Australia - 35×45mm", colsA4: 6 },
    japan: { wCm: 3.5, hCm: 4.5, label: "Japan (Visa/Passport) - 35×45mm", colsA4: 6 },
    china: { wCm: 3.3, hCm: 4.8, label: "China (Visa) - 33×48mm", colsA4: 6 },
    russia: { wCm: 3.5, hCm: 4.5, label: "Russia - 35×45mm", colsA4: 6 },
    uae: { wCm: 4.0, hCm: 6.0, label: "UAE (Visa) - 4×6cm", colsA4: 5 },
    saudi: { wCm: 4.0, hCm: 6.0, label: "Saudi Arabia - 4×6cm", colsA4: 5 },
    singapore: { wCm: 3.5, hCm: 4.5, label: "Singapore - 35×45mm", colsA4: 6 },
    malaysia: { wCm: 3.5, hCm: 5.0, label: "Malaysia - 35×50mm", colsA4: 6 },
    korea: { wCm: 3.5, hCm: 4.5, label: "South Korea - 35×45mm", colsA4: 6 },
    brazil: { wCm: 5.0, hCm: 7.0, label: "Brazil - 5×7cm", colsA4: 4 },
    turkey: { wCm: 5.0, hCm: 6.0, label: "Turkey - 50×60mm", colsA4: 4 },
    custom: { wCm: 3.5, hCm: 4.5, label: "Custom Size(cm)", colsA4: 6 }
  };

  // --- 1. Tab Navigation & Sub-Tab Handlers ---
  window.switchHubTab = function (tabId) {
    window.eMudraHub.activeTab = tabId;
    document.querySelectorAll('.hub-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.hub-tool-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === tabId);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.switchSubTool = function (panelId, subToolId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    panel.querySelectorAll('.hub-subnav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-sub') === subToolId);
    });
    panel.querySelectorAll('.hub-subtool-pane').forEach(pane => {
      pane.style.display = pane.id === subToolId ? 'block' : 'none';
    });
  };

  // --- 2. PASSPORT PHOTO MAKER ENGINE ---
  window.onHubPassportPresetChange = function (val) {
    window.eMudraHub.passport.presetKey = val;
    const customRow = document.getElementById('hub-custom-size-inputs-row');
    if (val === 'custom') {
      if (customRow) customRow.style.display = 'grid';
      window.eMudraHub.passport.wCm = parseFloat(document.getElementById('hub-custom-photo-w-cm').value) || 3.5;
      window.eMudraHub.passport.hCm = parseFloat(document.getElementById('hub-custom-photo-h-cm').value) || 4.5;
    } else {
      if (customRow) customRow.style.display = 'none';
      const preset = HUB_COUNTRY_PRESETS[val];
      if (preset) {
        window.eMudraHub.passport.wCm = preset.wCm;
        window.eMudraHub.passport.hCm = preset.hCm;
      }
    }
    renderPassportCrop();
    renderPassportSheet();
  };

  window.onHubCustomDimensionsChange = function () {
    window.eMudraHub.passport.wCm = parseFloat(document.getElementById('hub-custom-photo-w-cm').value) || 3.5;
    window.eMudraHub.passport.hCm = parseFloat(document.getElementById('hub-custom-photo-h-cm').value) || 4.5;
    renderPassportCrop();
    renderPassportSheet();
  };

  window.handlePassportUpload = function (event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        window.eMudraHub.passport.image = img;
        document.getElementById('passport-preview-pane').style.display = 'block';
        document.getElementById('passport-empty-pane').style.display = 'none';
        renderPassportCrop();
        renderPassportSheet();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  window.updatePassportControls = function () {
    const paper = document.getElementById('passport-paper-select').value;
    const qtySelect = document.getElementById('passport-qty-select');
    const border = document.getElementById('passport-border-select').value;
    const align = document.getElementById('passport-align-select')?.value || 'studio_center';
    
    window.eMudraHub.passport.paper = paper;
    window.eMudraHub.passport.border = border;
    window.eMudraHub.passport.align = align;

    if (paper === '6x4' || paper === '4x6') {
      qtySelect.innerHTML = '<option value="4">४ फोटो (2x2)</option><option value="6">६ फोटो (2x3)</option><option value="8" selected>८ फोटो (2x4 पूर्ण शीट)</option>';
    } else {
      qtySelect.innerHTML = '<option value="6">६ फोटो (1 ओळ)</option><option value="8">८ फोटो</option><option value="12">१२ फोटो</option><option value="16" selected>१६ फोटो</option><option value="24">२४ फोटो</option><option value="32">३२ फोटो</option><option value="36">३६ फोटो (पूर्ण शीट)</option>';
    }
    window.eMudraHub.passport.quantity = parseInt(qtySelect.value, 10);
    renderPassportSheet();
  };

  window.onPassportQtyChange = function () {
    const qty = parseInt(document.getElementById('passport-qty-select').value, 10);
    window.eMudraHub.passport.quantity = qty;
    renderPassportSheet();
  };

  window.adjustPassportZoom = function (delta) {
    window.eMudraHub.passport.zoom = Math.max(0.5, Math.min(2.5, window.eMudraHub.passport.zoom + delta));
    renderPassportCrop();
    renderPassportSheet();
  };

  window.rotatePassportImage = function () {
    window.eMudraHub.passport.rotation = (window.eMudraHub.passport.rotation + 90) % 360;
    renderPassportCrop();
    renderPassportSheet();
  };

  function renderPassportCrop() {
    const canvas = document.getElementById('passport-crop-canvas');
    if (!canvas || !window.eMudraHub.passport.image) return;
    const ctx = canvas.getContext('2d');
    const img = window.eMudraHub.passport.image;

    const wCm = window.eMudraHub.passport.wCm || 3.2;
    const hCm = window.eMudraHub.passport.hCm || 4.114;
    const targetW = Math.round(wCm * 100);
    const targetH = Math.round(hCm * 100);

    canvas.width = targetW;
    canvas.height = targetH;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((window.eMudraHub.passport.rotation * Math.PI) / 180);
    ctx.scale(window.eMudraHub.passport.zoom, window.eMudraHub.passport.zoom);

    // Draw centered
    const aspect = img.width / img.height;
    let dw, dh;
    if (aspect > targetW / targetH) {
      dh = targetH;
      dw = dh * aspect;
    } else {
      dw = targetW;
      dh = dw / aspect;
    }
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();

    // Optional border
    if (window.eMudraHub.passport.border === 'thin') {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    }
  }

  function renderPassportSheet() {
    const singleCanvas = document.getElementById('passport-crop-canvas');
    const sheetCanvas = document.getElementById('passport-sheet-canvas');
    if (!singleCanvas || !sheetCanvas) return;
    const sCtx = sheetCanvas.getContext('2d');

    const paper = window.eMudraHub.passport.paper;
    const qty = window.eMudraHub.passport.quantity;

    // High Res 300 DPI
    // A4: 2480 x 3508 px (210mm x 297mm)
    // 6x4: 1800 x 1200 px (152.4mm x 101.6mm Postcard Landscape)
    let sheetW, sheetH, cols, photoW, photoH, gapX, gapY;

    if (paper === '6x4' || paper === '4x6') {
      sheetW = 1800; // Landscape 6x4 (6 inch x 4 inch)
      sheetH = 1200;
      cols = qty <= 4 ? 2 : (qty <= 6 ? 3 : 4);
    } else {
      // A4 Portrait
      sheetW = 2480;
      sheetH = 3508;
      cols = HUB_COUNTRY_PRESETS[window.eMudraHub.passport.presetKey]?.colsA4 || (qty <= 8 ? 4 : 6);
    }

    sheetCanvas.width = sheetW;
    sheetCanvas.height = sheetH;

    // White background
    sCtx.fillStyle = '#ffffff';
    sCtx.fillRect(0, 0, sheetW, sheetH);

    // Photo size at 300 DPI (1cm = 118.11 px)
    const wCm = window.eMudraHub.passport.wCm || 3.2;
    const hCm = window.eMudraHub.passport.hCm || 4.114;
    photoW = Math.round(wCm * 118.11);
    photoH = Math.round(hCm * 118.11);

    gapX = 30;
    gapY = 40;

    // Studio Center placement:
    // - Portrait page -> UPPER SIDE CENTER (Top margin 100px, horizontally centered row)
    // - Landscape page -> LEFT SIDE CENTER (Left margin 80px, vertically centered rows)
    const isPortrait = sheetH >= sheetW;
    const align = window.eMudraHub.passport.align || 'studio_center';

    const actualRows = Math.max(1, Math.ceil(qty / cols));
    const totalGridH = (actualRows * photoH) + ((actualRows - 1) * gapY);

    let startY;
    if (align === 'studio_center') {
      if (isPortrait) {
        // Portrait: Upper side center (at top, not in middle!)
        startY = 100;
      } else {
        // Landscape: Left side center (vertically centered)
        startY = Math.max(60, Math.floor((sheetH - totalGridH) / 2));
      }
    } else if (align === 'page_middle') {
      startY = Math.max(60, Math.floor((sheetH - totalGridH) / 2));
    } else {
      startY = isPortrait ? 100 : 60;
    }

    let count = 0;
    for (let r = 0; r < actualRows; r++) {
      if (count >= qty) break;
      const remainingInSheet = qty - count;
      const photosInThisRow = Math.min(cols, remainingInSheet);
      if (photosInThisRow <= 0) break;

      let rowStartX;
      if (align === 'studio_center') {
        if (isPortrait) {
          // Portrait: Upper side center (horizontally centered row)
          const thisRowW = (photosInThisRow * photoW) + ((photosInThisRow - 1) * gapX);
          rowStartX = Math.floor((sheetW - thisRowW) / 2);
        } else {
          // Landscape: Left side center (starts from left margin!)
          rowStartX = 80;
        }
      } else if (align === 'page_middle') {
        const thisRowW = (photosInThisRow * photoW) + ((photosInThisRow - 1) * gapX);
        rowStartX = Math.floor((sheetW - thisRowW) / 2);
      } else {
        const fullRowW = (cols * photoW) + ((cols - 1) * gapX);
        rowStartX = Math.floor((sheetW - fullRowW) / 2);
      }

      for (let c = 0; c < photosInThisRow; c++) {
        if (count >= qty) break;
        const x = rowStartX + c * (photoW + gapX);
        const y = startY + r * (photoH + gapY);

        // Draw photo
        sCtx.drawImage(singleCanvas, x, y, photoW, photoH);

        // Cutting guide line
        sCtx.strokeStyle = '#cbd5e1';
        sCtx.lineWidth = 1;
        sCtx.strokeRect(x - 2, y - 2, photoW + 4, photoH + 4);

        count++;
      }
    }

    // Official eMudra Watermark / Footer
    sCtx.fillStyle = '#94a3b8';
    sCtx.font = '24px Poppins, sans-serif';
    sCtx.textAlign = 'center';
    sCtx.fillText('eMudra CSC & Aaple Sarkar Seva Kendra • Center ID: 152153410016 • Ph: 9890869793', sheetW / 2, sheetH - 40);
  }

  window.printPassportSheet = function () {
    const canvas = document.getElementById('passport-sheet-canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const is6x4 = (window.eMudraHub.passport.paper === '6x4' || window.eMudraHub.passport.paper === '4x6');
    printImageClean(dataUrl, is6x4 ? '6x4' : 'portrait');
  };

  window.downloadPassportSheet = function (format) {
    const canvas = document.getElementById('passport-sheet-canvas');
    if (!canvas) return;
    const is6x4 = (window.eMudraHub.passport.paper === '6x4' || window.eMudraHub.passport.paper === '4x6');
    const filename = `eMudra_Passport_Photos_${is6x4 ? '6x4' : 'A4'}_${Date.now()}.${format}`;
    if (format === 'png' || format === 'jpg') {
      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      const a = document.createElement('a');
      a.download = filename;
      a.href = canvas.toDataURL(mime, 0.95);
      a.click();
    }
  };

  // --- 3. SMART PVC / ID CARD MAKER ENGINE (CR80 Standard: 85.6mm x 54mm) ---
  window.handleIdCardUpload = function (event, side) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        if (side === 'front') {
          window.eMudraHub.idcard.frontImg = img;
          renderCardCanvas('pvc-front-canvas', img);
        } else {
          window.eMudraHub.idcard.backImg = img;
          renderCardCanvas('pvc-back-canvas', img);
        }
        renderIdCardPrintSheet();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  function renderCardCanvas(canvasId, img) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');

    // CR80: 85.6mm x 54mm @ 300 DPI = 1011 x 638 px
    canvas.width = 1011;
    canvas.height = 638;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  window.renderIdCardPrintSheet = function () {
    const sheetCanvas = document.getElementById('pvc-sheet-canvas');
    if (!sheetCanvas) return;
    const ctx = sheetCanvas.getContext('2d');

    const frontCanvas = document.getElementById('pvc-front-canvas');
    const backCanvas = document.getElementById('pvc-back-canvas');
    const layout = document.getElementById('pvc-layout-select') ? document.getElementById('pvc-layout-select').value : 'side_by_side';

    // A4 sheet @ 300 DPI
    sheetCanvas.width = 2480;
    sheetCanvas.height = 3508;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);

    const cardW = 1011;
    const cardH = 638;

    const isPortrait = sheetCanvas.height >= sheetCanvas.width;

    if (layout === 'side_by_side') {
      // Side by side: Portrait -> Upper Side Center | Landscape -> Left Side Center
      const hasFront = frontCanvas && window.eMudraHub.idcard.frontImg;
      const hasBack = backCanvas && window.eMudraHub.idcard.backImg;
      const gap = 80;
      const cardCount = (hasFront ? 1 : 0) + (hasBack ? 1 : 0);
      const totalW = cardCount === 2 ? (cardW * 2 + gap) : cardW;

      let startX, startY;
      if (isPortrait) {
        // Upper side center (top margin, horizontally centered)
        startX = (sheetCanvas.width - totalW) / 2;
        startY = 320;
      } else {
        // Left side center (left margin, vertically centered)
        startX = 120;
        startY = (sheetCanvas.height - cardH) / 2;
      }

      let currentX = startX;
      if (hasFront) {
        ctx.drawImage(frontCanvas, currentX, startY, cardW, cardH);
        drawCutMarks(ctx, currentX, startY, cardW, cardH, 'FRONT (समोर)');
        currentX += cardW + gap;
      }
      if (hasBack) {
        ctx.drawImage(backCanvas, currentX, startY, cardW, cardH);
        drawCutMarks(ctx, currentX, startY, cardW, cardH, 'BACK (मागे)');
      }
    } else {
      // Stacked: Portrait -> Upper Side Center | Landscape -> Left Side Center
      const hasFront = frontCanvas && window.eMudraHub.idcard.frontImg;
      const hasBack = backCanvas && window.eMudraHub.idcard.backImg;
      const gap = 100;
      const cardCount = (hasFront ? 1 : 0) + (hasBack ? 1 : 0);
      const totalH = cardCount === 2 ? (cardH * 2 + gap) : cardH;

      let startX, startY;
      if (isPortrait) {
        startX = (sheetCanvas.width - cardW) / 2;
        startY = 280;
      } else {
        startX = 120;
        startY = (sheetCanvas.height - totalH) / 2;
      }

      if (hasFront) {
        ctx.drawImage(frontCanvas, startX, startY, cardW, cardH);
        drawCutMarks(ctx, startX, startY, cardW, cardH, 'FRONT (समोर)');
        startY += cardH + gap;
      }
      if (hasBack) {
        ctx.drawImage(backCanvas, startX, startY, cardW, cardH);
        drawCutMarks(ctx, startX, startY, cardW, cardH, 'BACK (मागे)');
      }
    }

    // Official Footer
    ctx.fillStyle = '#64748b';
    ctx.font = '24px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CR80 Standard PVC Smart Card Layout (85.6mm x 54mm) • eMudra CSC & आपले सरकार सेवा केंद्र • 9890869793', sheetCanvas.width / 2, sheetCanvas.height - 80);
  };

  function drawCutMarks(ctx, x, y, w, h, label) {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    ctx.setLineDash([]);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px Poppins, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 10, y - 10);
  }

  window.printIdCardSheet = function () {
    const canvas = document.getElementById('pvc-sheet-canvas');
    if (!canvas) return;
    printImageClean(canvas.toDataURL('image/png'), 'portrait');
  };

  window.downloadIdCardSheet = function () {
    const canvas = document.getElementById('pvc-sheet-canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `eMudra_Smart_PVC_ID_${Date.now()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  // --- 4. PHOTO & SIGNATURE RESIZER (GOVT EXAM SPECIAL) ---
  window.applyResizerPreset = function (presetName) {
    document.querySelectorAll('.hub-preset-pill').forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-preset') === presetName);
    });

    const wInput = document.getElementById('resize-w');
    const hInput = document.getElementById('resize-h');
    const kbInput = document.getElementById('resize-kb');

    if (presetName === 'police_photo') {
      wInput.value = 350; hInput.value = 450; kbInput.value = 50;
    } else if (presetName === 'police_sign') {
      wInput.value = 350; hInput.value = 150; kbInput.value = 30;
    } else if (presetName === 'mahadbt') {
      wInput.value = 250; hInput.value = 320; kbInput.value = 50;
    } else if (presetName === 'mpsc_photo') {
      wInput.value = 350; hInput.value = 450; kbInput.value = 50;
    } else if (presetName === 'ssc_photo') {
      wInput.value = 350; hInput.value = 450; kbInput.value = 50;
    } else if (presetName === 'ssc_sign') {
      wInput.value = 400; hInput.value = 200; kbInput.value = 20;
    } else if (presetName === 'upsc') {
      wInput.value = 350; hInput.value = 350; kbInput.value = 100;
    } else if (presetName === 'ibps_sign') {
      wInput.value = 280; hInput.value = 140; kbInput.value = 20;
    }
    processResize();
  };

  window.handleResizerUpload = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        window.eMudraHub.resizer.image = img;
        document.getElementById('resizer-workspace').style.display = 'grid';
        processResize();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  window.processResize = function () {
    const img = window.eMudraHub.resizer.image;
    if (!img) return;

    const w = parseInt(document.getElementById('resize-w').value, 10) || 350;
    const h = parseInt(document.getElementById('resize-h').value, 10) || 450;
    const maxKb = parseInt(document.getElementById('resize-kb').value, 10) || 50;

    const canvas = document.getElementById('resizer-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = w;
    canvas.height = h;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    // Iterative quality reduction to fit target KB
    let quality = 0.95;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    let sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

    while (sizeKb > maxKb && quality > 0.1) {
      quality -= 0.05;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
      sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
    }

    document.getElementById('resize-output-stat').innerText = `आकार: ${w}x${h} px | फाईल साईझ: ${sizeKb} KB (टार्गेट: ${maxKb} KB)`;
    window.eMudraHub.resizer.finalDataUrl = dataUrl;
  };

  window.downloadResizedImage = function () {
    const dataUrl = window.eMudraHub.resizer.finalDataUrl;
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.download = `eMudra_Govt_Resized_${Date.now()}.jpg`;
    a.href = dataUrl;
    a.click();
  };

  // --- 5. PDF MASTER TOOLS ---
  window.handleJpgToPdfUpload = function (event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const previewList = document.getElementById('jpg2pdf-file-list');
    previewList.innerHTML = '';
    window.eMudraHub.pdf.images = [];

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        window.eMudraHub.pdf.images.push(e.target.result);
        const item = document.createElement('div');
        item.className = 'hub-pdf-thumb-item';
        item.style.cssText = 'display:inline-block; margin:6px; text-align:center;';
        item.innerHTML = `<img src="${e.target.result}" style="width:80px;height:100px;object-fit:cover;border-radius:6px;border:1px solid #cbd5e1;"><br><span style="font-size:0.75rem;">Page ${index + 1}</span>`;
        previewList.appendChild(item);
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('jpg2pdf-action-btn').style.display = 'inline-flex';
  };

  window.convertJpgToPdf = async function () {
    if (!window.PDFLib) {
      alert("PDF लायब्ररी लोड होत आहे. कृपया पुन्हा प्रयत्न करा.");
      return;
    }
    const images = window.eMudraHub.pdf.images;
    if (!images.length) return;

    const pdfDoc = await PDFLib.PDFDocument.create();

    for (const dataUrl of images) {
      const isPng = dataUrl.startsWith('data:image/png');
      const imgBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
      const embeddedImg = isPng ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);

      // A4 Standard
      const page = pdfDoc.addPage([595.28, 841.89]);
      const { width, height } = page.getSize();

      const imgAspect = embeddedImg.width / embeddedImg.height;
      const pageAspect = width / height;

      let drawW, drawH, drawX, drawY;
      if (imgAspect > pageAspect) {
        drawW = width - 40;
        drawH = drawW / imgAspect;
      } else {
        drawH = height - 40;
        drawW = drawH * imgAspect;
      }
      drawX = (width - drawW) / 2;
      drawY = (height - drawH) / 2;

      page.drawImage(embeddedImg, { x: drawX, y: drawY, width: drawW, height: drawH });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `eMudra_Converted_${Date.now()}.pdf`;
    link.click();
  };

  window.handleMergePdfUpload = function (event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    window.eMudraHub.pdf.filesToMerge = files;

    const list = document.getElementById('merge-file-list');
    list.innerHTML = files.map((f, i) => `<div style="padding:6px 10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; margin-bottom:4px; font-size:0.85rem;"><i class="fa-solid fa-file-pdf" style="color:#ef4444; margin-right:6px;"></i> ${i + 1}. ${f.name} (${Math.round(f.size/1024)} KB)</div>`).join('');
    document.getElementById('merge-action-btn').style.display = 'inline-flex';
  };

  window.executeMergePdf = async function () {
    if (!window.PDFLib) return;
    const files = window.eMudraHub.pdf.filesToMerge;
    if (files.length < 2) {
      alert("कृपया किमान २ किंवा जास्त PDF फाईल्स निवडा.");
      return;
    }

    const mergedPdf = await PDFLib.PDFDocument.create();

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFLib.PDFDocument.load(bytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach(p => mergedPdf.addPage(p));
    }

    const pdfBytes = await mergedPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `eMudra_Merged_${Date.now()}.pdf`;
    a.click();
  };

  // --- 6. SHOP UPI QR STANDEE GENERATOR ---
  window.updateUpiStandee = function () {
    const vpa = document.getElementById('standee-vpa-input').value.trim() || '9890869793@ybl';
    const name = document.getElementById('standee-name-input').value.trim() || 'Aaple Sarkar Seva Kendra (eMudra)';
    const amount = document.getElementById('standee-amt-input').value.trim();

    document.getElementById('standee-display-name').innerText = name;
    document.getElementById('standee-display-vpa').innerText = vpa;

    let upiUrl = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(name)}`;
    if (amount && parseFloat(amount) > 0) {
      upiUrl += `&am=${encodeURIComponent(amount)}&cu=INR`;
      document.getElementById('standee-display-amt').innerText = `निश्चित रक्कम: ₹${amount}`;
      document.getElementById('standee-display-amt').style.display = 'block';
    } else {
      document.getElementById('standee-display-amt').style.display = 'none';
    }

    // Render QR Code using native QRCode generator or API
    const qrContainer = document.getElementById('standee-qr-render');
    qrContainer.innerHTML = '';
    if (window.QRCode) {
      new QRCode(qrContainer, {
        text: upiUrl,
        width: 180,
        height: 180,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      // Fallback
      const img = document.createElement('img');
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`;
      img.style.width = '180px';
      img.style.height = '180px';
      qrContainer.appendChild(img);
    }
  };

  window.printUpiStandee = function () {
    const standeeEl = document.getElementById('standee-print-card');
    if (!standeeEl) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>eMudra CSC UPI Standee</title>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Poppins', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .standee-container { width: 380px; border: 4px solid #1e293b; border-radius: 20px; padding: 25px; text-align: center; }
            @page { size: A4 portrait; margin: 20mm; }
          </style>
        </head>
        <body>
          <div class="standee-container">
            ${standeeEl.innerHTML}
          </div>
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // --- 7. RESUME MAKER ENGINE ---
  window.updateResumePreview = function () {
    const name = document.getElementById('res-name').value || 'तुमचे पूर्ण नाव (Full Name)';
    const phone = document.getElementById('res-phone').value || '+91 9890869793';
    const email = document.getElementById('res-email').value || 'email@example.com';
    const addr = document.getElementById('res-addr').value || 'मु. पो. कणकवली, जि. सिंधुदुर्ग';
    const obj = document.getElementById('res-obj').value || 'माझ्या कौशल्यांचा व ज्ञानाचा उपयोग करून संस्थेच्या प्रगतीमध्ये योगदान देणे हे माझे उद्दिष्ट आहे.';

    document.getElementById('preview-res-name').innerText = name;
    document.getElementById('preview-res-contact').innerText = `📞 ${phone} | ✉️ ${email} | 📍 ${addr}`;
    document.getElementById('preview-res-obj').innerText = obj;
  };

  window.printResume = function () {
    const resumeEl = document.getElementById('resume-sheet-preview');
    if (!resumeEl) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Curriculum Vitae</title>
          <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;600;700;800&family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Poppins', 'Mukta', sans-serif; margin: 0; padding: 30px; font-size: 13px; line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #94a3b8; padding: 6px 10px; text-align: left; }
            th { background: #f1f5f9; }
            @page { size: A4 portrait; margin: 15mm; }
          </style>
        </head>
        <body>
          ${resumeEl.innerHTML}
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // --- 8. FONT CONVERTER (UNICODE <-> KRUTIDEV 010) ENGINE ---
  window.convertUnicodeToKruti = function () {
    const input = document.getElementById('font-unicode-input').value;
    // Fast standard phonetic mapping
    let out = input
      .replace(/ा/g, "k")
      .replace(/ि/g, "f")
      .replace(/ी/g, "h")
      .replace(/ु/g, "q")
      .replace(/ू/g, "w")
      .replace(/े/g, "s")
      .replace(/ै/g, "S")
      .replace(/ो/g, "ks")
      .replace(/ौ/g, "kS")
      .replace(/ं/g, "a")
      .replace(/ः/g, "%")
      .replace(/क/g, "d")
      .replace(/ख/g, "[k")
      .replace(/ग/g, "x")
      .replace(/घ/g, "?k")
      .replace(/च/g, "p")
      .replace(/छ/g, "N")
      .replace(/ज/g, "t")
      .replace(/झ/g, "T")
      .replace(/ट/g, "V")
      .replace(/ठ/g, "B")
      .replace(/ड/g, "M")
      .replace(/ढ/g, "<")
      .replace(/ण/g, ".k")
      .replace(/त/g, "r")
      .replace(/थ/g, "Fk")
      .replace(/द/g, "n")
      .replace(/ध/g, "/k")
      .replace(/न/g, "u")
      .replace(/प/g, "i")
      .replace(/फ/g, "Q")
      .replace(/ब/g, "c")
      .replace(/भ/g, "Hk")
      .replace(/म/g, "e")
      .replace(/य/g, ";")
      .replace(/र/g, "j")
      .replace(/ल/g, "y")
      .replace(/व/g, "o")
      .replace(/श/g, "'k")
      .replace(/ष/g, "\"k")
      .replace(/स/g, "l")
      .replace(/ह/g, "g")
      .replace(/ळ/g, "G")
      .replace(/क्ष/g, "K")
      .replace(/ज्ञ/g, "K;");
    document.getElementById('font-kruti-output').value = out;
  };

  window.convertKrutiToUnicode = function () {
    const input = document.getElementById('font-kruti-output').value;
    let out = input
      .replace(/ks/g, "ो")
      .replace(/kS/g, "ौ")
      .replace(/\[k/g, "ख")
      .replace(/\?k/g, "घ")
      .replace(/\.k/g, "ण")
      .replace(/Fk/g, "थ")
      .replace(/\/k/g, "ध")
      .replace(/Hk/g, "भ")
      .replace(/'k/g, "श")
      .replace(/"k/g, "ष")
      .replace(/k/g, "ा")
      .replace(/f/g, "ि")
      .replace(/h/g, "ी")
      .replace(/q/g, "ु")
      .replace(/w/g, "ू")
      .replace(/s/g, "े")
      .replace(/S/g, "ै")
      .replace(/a/g, "ं")
      .replace(/d/g, "क")
      .replace(/x/g, "ग")
      .replace(/p/g, "च")
      .replace(/N/g, "छ")
      .replace(/t/g, "ज")
      .replace(/T/g, "झ")
      .replace(/V/g, "ट")
      .replace(/B/g, "ठ")
      .replace(/M/g, "ड")
      .replace(/</g, "ढ")
      .replace(/r/g, "त")
      .replace(/n/g, "द")
      .replace(/u/g, "न")
      .replace(/i/g, "प")
      .replace(/Q/g, "फ")
      .replace(/c/g, "ब")
      .replace(/e/g, "म")
      .replace(/;/g, "य")
      .replace(/j/g, "र")
      .replace(/y/g, "ल")
      .replace(/o/g, "व")
      .replace(/l/g, "स")
      .replace(/g/g, "ह")
      .replace(/G/g, "ळ");
    document.getElementById('font-unicode-input').value = out;
  };

  // --- 9. HELPERS ---
  function printImageClean(dataUrl, orientation) {
    const is6x4 = (orientation === '6x4' || orientation === 'landscape');
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>eMudra Print</title>
          <style>
            @page { size: ${is6x4 ? '6in 4in landscape' : 'A4 portrait'}; margin: 0mm; }
            body { margin: 0; display: flex; justify-content: center; align-items: center; background: #fff; }
            img { max-width: 100vw; max-height: 100vh; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}">
          <script>
            setTimeout(() => { window.print(); window.close(); }, 400);
          </script>
        </body>
      </html>
    `);
    win.document.close();
  }

  // Init on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('passport-paper-select') && typeof updatePassportControls === 'function') {
      updatePassportControls();
    }
    if (document.getElementById('standee-vpa-input') && typeof updateUpiStandee === 'function') {
      updateUpiStandee();
    }
    if (document.getElementById('res-name') && typeof updateResumePreview === 'function') {
      updateResumePreview();
    }
  });

})();
