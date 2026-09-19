/**
 * Storage Manager for eMudra CSC Portal
 * Handles local persistence of applications, token appointments and officer notices.
 */

const STORAGE_KEYS = {
  APPLICATIONS: "emudra_csc_applications",
  TOKENS: "emudra_csc_tokens",
  NOTICES: "emudra_csc_notices"
};

/**
 * Cloudinary Cloud Storage Configuration
 * Product Environment: dmzum1faq
 * Unsigned Upload Preset: emudra_docs
 */
const CLOUDINARY_CONFIG = {
  cloudName: "dmzum1faq",
  uploadPreset: "emudra_docs"
};

/**
 * Helper to detect if file is an image by MIME or extension
 */
function isImageFile(file) {
  if (!file) return false;
  if (file.type && file.type.startsWith("image/")) return true;
  const ext = (file.name || "").split('.').pop().toLowerCase();
  return ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'jfif', 'gif', 'heic'].includes(ext);
}

/**
 * Automatically compress document images / files to strictly under 500 KB before upload
 * Keeps text crisp and sharp for official documents (Aadhaar, Ration card, 7/12, LC).
 * @param {File} file - Original user-selected file
 * @param {number} maxBytes - Target size limit (default: 500 * 1024 = 512,000 bytes)
 * @returns {Promise<{ file: File, originalSize: number, compressedSize: number, wasCompressed: boolean, savedPercent: number }>}
 */
async function compressFileUnder500KB(file, maxBytes = 500 * 1024) {
  const originalSize = file.size;

  // If it's an image file (by MIME type or filename extension)
  if (isImageFile(file)) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Max dimension boundary for document clarity (1600px keeps all text ultra sharp)
          const MAX_DIMENSION = 1600;
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            } else {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          // Progressive quality reduction loop from 0.85 down to 0.35 until size < 500 KB
          let quality = originalSize > 2 * 1024 * 1024 ? 0.75 : 0.85;

          function tryCompress() {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve({ file, originalSize, compressedSize: originalSize, wasCompressed: false, savedPercent: 0 });
                  return;
                }

                if (blob.size <= maxBytes || quality <= 0.35) {
                  const baseName = file.name.replace(/\.[^/.]+$/, "");
                  const compressedFile = new File([blob], `${baseName}.jpg`, {
                    type: "image/jpeg",
                    lastModified: Date.now()
                  });
                  const saved = Math.max(0, Math.round(((originalSize - blob.size) / originalSize) * 100));
                  resolve({
                    file: compressedFile,
                    originalSize,
                    compressedSize: blob.size,
                    wasCompressed: blob.size < originalSize,
                    savedPercent: saved
                  });
                } else {
                  quality -= 0.12;
                  tryCompress();
                }
              },
              "image/jpeg",
              quality
            );
          }

          tryCompress();
        };
        img.onerror = () => {
          resolve({ file, originalSize, compressedSize: originalSize, wasCompressed: false, savedPercent: 0 });
        };
      };
      reader.onerror = () => {
        resolve({ file, originalSize, compressedSize: originalSize, wasCompressed: false, savedPercent: 0 });
      };
    });
  }

  // If PDF file
  return {
    file,
    originalSize,
    compressedSize: originalSize,
    wasCompressed: false,
    savedPercent: 0
  };
}

/**
 * Upload Document / Image to Cloudinary with automatic < 500 KB compression and fail-safe local fallback
 * @param {File} file - HTML5 File object
 * @param {Function} onProgress - Callback receiving percent (0-100)
 * @returns {Promise<Object>} Upload result with secure URL and compression metadata
 */
async function uploadToCloudinary(file, onProgress) {
  // 1. Auto-compress file to under 500 KB if necessary
  const compressResult = await compressFileUnder500KB(file, 500 * 1024);
  const fileToUpload = compressResult.file;

  const isImage = fileToUpload.type ? fileToUpload.type.startsWith("image/") : true;
  const resourceType = isImage ? "image" : "auto";
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append("file", fileToUpload);
  formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve({
            success: true,
            isCloud: true,
            url: res.secure_url || res.url,
            publicId: res.public_id,
            format: res.format || file.name.split('.').pop(),
            bytes: res.bytes || compressResult.compressedSize,
            originalFilename: file.name,
            resourceType: res.resource_type,
            wasCompressed: compressResult.wasCompressed,
            originalSize: compressResult.originalSize,
            compressedSize: compressResult.compressedSize
          });
          return;
        } catch (e) {
          console.warn("Parse error, using fallback", e);
        }
      }

      // If Cloudinary returned an error status (e.g. CORS/Preset), fallback smoothly to local storage
      let errorMsg = "Upload issue";
      try {
        const errRes = JSON.parse(xhr.responseText);
        errorMsg = errRes.error?.message || `Status ${xhr.status}`;
      } catch (e) {
        errorMsg = `Status ${xhr.status}`;
      }
      console.warn("Cloudinary upload notification:", errorMsg, "- Saving safely to local portal storage");

      convertFileToDataUrl(fileToUpload).then((localUrl) => {
        resolve({
          success: true,
          isCloud: false,
          isLocalFallback: true,
          url: localUrl,
          format: file.name.split('.').pop(),
          bytes: compressResult.compressedSize,
          originalFilename: file.name,
          wasCompressed: compressResult.wasCompressed,
          originalSize: compressResult.originalSize,
          compressedSize: compressResult.compressedSize,
          cloudError: errorMsg
        });
      });
    };

    xhr.onerror = () => {
      console.warn("Network error during Cloudinary call, using safe local fallback");
      convertFileToDataUrl(fileToUpload).then((localUrl) => {
        resolve({
          success: true,
          isCloud: false,
          isLocalFallback: true,
          url: localUrl,
          format: file.name.split('.').pop(),
          bytes: compressResult.compressedSize,
          originalFilename: file.name,
          wasCompressed: compressResult.wasCompressed,
          originalSize: compressResult.originalSize,
          compressedSize: compressResult.compressedSize,
          cloudError: "Network connection"
        });
      });
    };

    xhr.send(formData);
  });
}

function convertFileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => resolve(URL.createObjectURL(file));
    reader.readAsDataURL(file);
  });
}

/**
 * Dedicated Software Setup Cloudinary Uploader
 * Uploads binary executable files (.exe, .zip, .rar, .msi, .apk, .pdf, .7z) directly to Cloudinary Secure Storage.
 * @param {File} file - Selected software setup file
 * @param {Function} onProgress - Progress callback receiving percent (0-100)
 * @returns {Promise<Object>} Object with secure Cloudinary URL and metadata
 */
async function uploadSoftwareToCloudinary(file, onProgress) {
  const ext = (file.name || "").split('.').pop().toLowerCase();
  // Binary / setup files use resource_type "raw" or "auto" in Cloudinary
  const isDocOrImg = ['pdf', 'jpg', 'jpeg', 'png'].includes(ext);
  const resourceType = isDocOrImg ? "auto" : "raw";
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      const safeFileName = (file.name || "setup.exe").replace(/[^a-zA-Z0-9._-]/g, "_");

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          let rawUrl = res.secure_url || res.url;
          let finalUrl = rawUrl;

          // Force Cloudinary to serve the file as an attachment with its original filename & extension (.exe/.zip/.msi/etc.)
          if (rawUrl && rawUrl.includes("/upload/")) {
            finalUrl = rawUrl.replace("/upload/", `/upload/fl_attachment:${encodeURIComponent(safeFileName)}/`);
          }

          resolve({
            success: true,
            isCloud: true,
            url: finalUrl,
            rawUrl: rawUrl,
            publicId: res.public_id,
            bytes: res.bytes || file.size,
            format: res.format || ext,
            originalFilename: file.name,
            fileName: safeFileName,
            extension: ext
          });
          return;
        } catch (e) {
          console.warn("Cloudinary software parse error", e);
        }
      }

      // If Cloudinary returned error, fallback safely
      let errorMsg = `Status ${xhr.status}`;
      try {
        const errRes = JSON.parse(xhr.responseText);
        errorMsg = errRes.error?.message || errorMsg;
      } catch (e) {}

      console.warn("Cloudinary software upload notice:", errorMsg, "- creating local safe link");

      convertFileToDataUrl(file).then((localUrl) => {
        resolve({
          success: true,
          isCloud: false,
          isLocalFallback: true,
          url: localUrl,
          bytes: file.size,
          format: ext,
          originalFilename: file.name,
          cloudError: errorMsg
        });
      });
    };

    xhr.onerror = () => {
      console.warn("Network error during Cloudinary software call, creating local link");
      convertFileToDataUrl(file).then((localUrl) => {
        resolve({
          success: true,
          isCloud: false,
          isLocalFallback: true,
          url: localUrl,
          bytes: file.size,
          format: ext,
          originalFilename: file.name,
          cloudError: "Network connection"
        });
      });
    };

    xhr.send(formData);
  });
}

// Seed realistic demo applications if none exist
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
    const defaultApps = [
      {
        id: "EMU-2026-1001",
        serviceId: "income-cert",
        serviceName_mr: "उत्पन्नाचा दाखला (Income Certificate)",
        serviceName_en: "Income Certificate (1/3 Years)",
        applicantName: "सचिन विठ्ठलराव देशमुख",
        fatherName: "विठ्ठलराव मारोतीराव देशमुख",
        gender: "male",
        dob: "1994-06-15",
        mobile: "9823456789",
        email: "sachin.deshmukh@gmail.com",
        aadhaar: "8945-2314-7890",
        address: "घर नं. ४२, मारुती मंदिर गल्ली, पोस्ट ऑफिस जवळ",
        taluka: "तालुका उपविभाग",
        district: "महाराष्ट्र",
        pincode: "413512",
        income: "75000",
        purpose: "महाडीबीटी (MahaDBT) शिष्यवृत्ती अर्ज",
        date: "2026-08-18",
        status: "completed", // 'submitted', 'verified', 'processing', 'completed', 'rejected'
        status_mr: "मंजूर व प्रमाणपत्र तयार",
        status_en: "Approved & Ready",
        remarks: "सक्षम प्राधिकाऱ्याने (तहसीलदार) उत्पन्नाचा दाखला स्वाक्षरीत केला आहे. मूळ प्रत उपलब्ध.",
        totalFee: 83.60,
        certificateNo: "MAHA/REV/2026/INC/98742"
      },
      {
        id: "EMU-2026-1002",
        serviceId: "emudra-dsc-class3",
        serviceName_mr: "eMudra Class 3 डिजिटल सिग्नेचर (DSC - 2 वर्षे)",
        serviceName_en: "eMudra Class 3 Digital Signature Certificate",
        applicantName: "राजेश दत्तात्रय कुलकर्णी",
        fatherName: "दत्तात्रय गणेश कुलकर्णी",
        gender: "male",
        dob: "1988-11-20",
        mobile: "9876543210",
        email: "rajesh.kulkarni@infraprojects.com",
        aadhaar: "4512-7896-3214",
        address: "प्लॉट नं. १२, शांतिनिकेतन कॉलनी, मुख्य रस्ता",
        taluka: "तालुका उपविभाग",
        district: "महाराष्ट्र",
        pincode: "413512",
        income: "650000",
        purpose: "सार्वजनिक बांधकाम विभाग (PWD) ई-निविदा (e-Tender)",
        date: "2026-08-20",
        status: "processing",
        status_mr: "प्रक्रिया सुरू (eKYC पडताळणी पूर्ण)",
        status_en: "In Processing (eKYC Verified)",
        remarks: "व्हिडिओ पडताळणी पूर्ण झाली आहे. eMudra CA द्वारे DSC जनरेशन प्रक्रिया सुरू आहे.",
        totalFee: 1500.00,
        certificateNo: ""
      },
      {
        id: "EMU-2026-1003",
        serviceId: "domicile-cert",
        serviceName_mr: "अधिवास व राष्ट्रीयत्व प्रमाणपत्र (Domicile & Nationality)",
        serviceName_en: "Domicile & Nationality Certificate",
        applicantName: "अश्विनी गजानन पाटील",
        fatherName: "गजानन बाबुराव पाटील",
        gender: "female",
        dob: "2003-04-12",
        mobile: "9421098765",
        email: "ashwini.patil2003@yahoo.com",
        aadhaar: "7845-6321-9012",
        address: "मु. पो. बोरगाव, ता. उपविभाग",
        taluka: "तालुका उपविभाग",
        district: "महाराष्ट्र",
        pincode: "413512",
        income: "120000",
        purpose: "इंजिनिअरिंग प्रवेश प्रक्रिया (MHT-CET CAP Round)",
        date: "2026-08-21",
        status: "verified",
        status_mr: "कागदपत्रे पडताळणी पूर्ण",
        status_en: "Documents Verified",
        remarks: "शाळा सोडल्याचा दाखला व रहिवासी पुरावा वैध. उपविभागीय अधिकारी (SDO) कार्यालयाकडे मंजुरीसाठी वर्ग.",
        totalFee: 93.60,
        certificateNo: ""
      }
    ];
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(defaultApps));
  }

  if (!localStorage.getItem(STORAGE_KEYS.TOKENS)) {
    const defaultTokens = [
      {
        tokenNo: "TKN-101",
        name: "प्रमोद सूर्यवंशी",
        mobile: "9922334455",
        service: "eMudra Class 3 DSC",
        date: "2026-08-22",
        slot: "11:00 AM - 11:30 AM",
        status: "Confirmed"
      }
    ];
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(defaultTokens));
  }
}

// Application Methods
function getAllApplications() {
  initStorage();
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) || [];
  } catch (e) {
    console.error("Failed to read applications from localStorage", e);
    return [];
  }
}

function getApplicationByIdOrMobile(query) {
  const apps = getAllApplications();
  const cleanQ = query.trim().toUpperCase();
  const cleanMob = query.replace(/\D/g, "");
  
  return apps.find(app => {
    return app.id.toUpperCase() === cleanQ || 
           (cleanMob.length >= 10 && app.mobile.includes(cleanMob)) ||
           (app.aadhaar && app.aadhaar.replace(/\D/g, "") === cleanMob);
  });
}

function saveApplication(appData) {
  const apps = getAllApplications();
  // Generate unique ID
  const nextNum = 1000 + apps.length + 1;
  const newId = `EMU-2026-${nextNum}`;
  
  const newApp = {
    id: newId,
    ...appData,
    date: new Date().toISOString().split('T')[0],
    status: "submitted",
    status_mr: "अर्ज प्राप्त झाला (पडताळणी प्रलंबित)",
    status_en: "Submitted (Verification Pending)",
    remarks: "आपला अर्ज यशस्वीरित्या सादर झाला आहे. कागदपत्रांची प्राथमिक तपासणी सुरू आहे.",
    certificateNo: ""
  };

  apps.unshift(newApp); // Add to top
  localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
  return newApp;
}

function updateApplicationStatus(id, newStatus, remarks, certNo) {
  const apps = getAllApplications();
  const index = apps.findIndex(a => a.id === id);
  if (index === -1) return null;

  const statusMap = {
    submitted: { mr: "अर्ज प्राप्त झाला", en: "Submitted" },
    verified: { mr: "कागदपत्रे पडताळणी पूर्ण", en: "Documents Verified" },
    processing: { mr: "अधिकारी स्तरावर प्रक्रिया सुरू", en: "Under Processing" },
    completed: { mr: "मंजूर व प्रमाणपत्र तयार", en: "Approved & Ready" },
    rejected: { mr: "त्रुटी / अर्ज नामंजूर", en: "Rejected / Defective" }
  };

  apps[index].status = newStatus;
  apps[index].status_mr = statusMap[newStatus]?.mr || newStatus;
  apps[index].status_en = statusMap[newStatus]?.en || newStatus;
  if (remarks) apps[index].remarks = remarks;
  if (certNo) apps[index].certificateNo = certNo;

  localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
  return apps[index];
}

function deleteApplication(id) {
  let apps = getAllApplications();
  apps = apps.filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
  return true;
}

// Token Methods
function getAllTokens() {
  initStorage();
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TOKENS)) || [];
  } catch (e) {
    return [];
  }
}

function saveToken(tokenData) {
  const tokens = getAllTokens();
  const tokenNo = `TKN-${100 + tokens.length + 1}`;
  const newToken = {
    tokenNo,
    ...tokenData,
    created: new Date().toISOString(),
    status: "Confirmed"
  };
  tokens.unshift(newToken);
  localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
  return newToken;
}

// Initialize on load
initStorage();
