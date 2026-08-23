/**
 * eMudra CSC Services Data Repository
 * Comprehensive data for Revenue, eMudra, Banking, Agricultural and Citizen services
 * Updated with exact Government Fee: ₹69 (Fixed) + Application Form: ₹20 + Scanning: ₹30 + Writing & Online Filing: ₹81 = Total ₹200.
 */

const DEFAULT_SERVICES_DATA = [
  // ==========================================
  // १. महसूल व दाखले विभाग (Revenue & Certificate Services)
  // ==========================================
  
  // 1. उत्पन्न दाखला
  {
    id: "income-cert",
    category: "revenue",
    icon: "fa-solid fa-file-invoice-dollar",
    title_mr: "उत्पन्नाचा दाखला (Income Certificate)",
    title_en: "Income Certificate (1/3 Years)",
    desc_mr: "तहसीलदार कार्यालयाकडून मिळणारा १ किंवा ३ वर्षांचा अधिकृत उत्पन्नाचा दाखला.",
    desc_en: "Official 1 or 3 years Income Certificate issued by Tahsildar Office.",
    timeline_mr: "३ ते ७ दिवस",
    timeline_en: "3 to 7 Days",
    govt_fee: 69.00,
    csc_fee: 131.00,
    total_fee: 200.00,
    popular: true,
    fee_breakdown: {
      govt_fee: 69.00,
      form_fee: 30.00,
      scanning_fee: 30.00,
      filing_fee: 41.00,
      lamination_fee: 30.00,
      total: 200.00
    },
    documents: [
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "आधार कार्ड", name_en: "Aadhaar Card", required: true },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "मतदार ओळखपत्र", name_en: "Voter ID Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "वाहन चालक अनुज्ञप्ती (ड्रायव्हिंग लायसन्स)", name_en: "Driving License", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "पॅन कार्ड", name_en: "PAN Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "पारपत्र (पासपोर्ट)", name_en: "Passport", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "मनरेगा जॉब कार्ड", name_en: "MNREGA Job Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "निमशासकीय ओळखपत्र", name_en: "Semi-Govt ID Card", required: false },
      
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "आधार कार्ड", name_en: "Aadhaar Card", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "मतदार ओळखपत्र", name_en: "Voter ID Card", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "वाहन चालक अनुज्ञप्ती", name_en: "Driving License", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "शिधापत्रिका (रेशन कार्ड)", name_en: "Ration Card", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "वीज देयक (लाईट बिल)", name_en: "Electricity Bill", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "७/१२ आणि ८ अ चा उतारा", name_en: "7/12 & 8-A Extract", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "मालमत्ता कर पावती / घरपट्टी", name_en: "Property Tax Receipt", required: false },
      
      { group: "उत्पन्नाचा पुरावा (कोणतेही - १)", name_mr: "अर्जदार जमीन मालक असल्यास ७/१२ आणि ८-अ चा उतारा व तलाठी अहवाल", name_en: "7/12, 8-A Extract & Talathi Report (if land owner)", required: true },
      { group: "उत्पन्नाचा पुरावा (कोणतेही - १)", name_mr: "ग्राम महसूल अधिकारी (तलाठी) यांचा अहवाल", name_en: "Village Revenue Officer (Talathi) Report", required: false },
      { group: "उत्पन्नाचा पुरावा (कोणतेही - १)", name_mr: "वेतन मिळत असल्यास फॉर्म नं १६ (Form 16)", name_en: "Salary Slip / Form 16 (for salaried)", required: false },
      { group: "उत्पन्नाचा पुरावा (कोणतेही - १)", name_mr: "आयकर विवरण पत्र (IT Return)", name_en: "Income Tax Return (ITR)", required: false },
      { group: "उत्पन्नाचा पुरावा (कोणतेही - १)", name_mr: "निवृत्ती वेतन धारकांकरिता बँकेचे प्रमाणपत्र", name_en: "Bank Pension Certificate (for pensioners)", required: false }
    ]
  },

  // 2. रहीवासी प्रमाणपत्र
  {
    id: "residence-cert",
    category: "revenue",
    icon: "fa-solid fa-house-chimney-user",
    title_mr: "रहीवासी प्रमाणपत्र (Residence Certificate)",
    title_en: "Residence Certificate",
    desc_mr: "स्थानिक रहिवासी असल्याबाबतचा महसूल विभागाचा अधिकृत दाखला.",
    desc_en: "Official Proof of Residence Certificate issued by Revenue Authority.",
    timeline_mr: "७ ते १५ दिवस",
    timeline_en: "7 to 15 Days",
    govt_fee: 69.00,
    csc_fee: 131.00,
    total_fee: 200.00,
    popular: true,
    fee_breakdown: {
      govt_fee: 69.00,
      form_fee: 30.00,
      scanning_fee: 30.00,
      filing_fee: 41.00,
      lamination_fee: 30.00,
      total: 200.00
    },
    documents: [
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "आधार कार्ड", name_en: "Aadhaar Card", required: true },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "वाहन चालक अनुज्ञप्ती", name_en: "Driving License", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "मतदार ओळखपत्र", name_en: "Voter ID Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "मनरेगा जॉब कार्ड", name_en: "MNREGA Job Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "निमशासकीय ओळखपत्र", name_en: "Semi-Govt ID Card", required: false },
      
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "आधार कार्ड", name_en: "Aadhaar Card", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "वाहन चालक अनुज्ञप्ती", name_en: "Driving License", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "मतदार ओळखपत्र", name_en: "Voter ID Card", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "मालमत्ता कर पावती", name_en: "Property Tax Receipt", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "पाणीपट्टी पावती", name_en: "Water Bill Receipt", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "वीज देयक", name_en: "Electricity Bill", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "भाडे पावती", name_en: "Rent Receipt", required: false },
      
      { group: "वयाचा पुरावा (कोणतेही - १)", name_mr: "जन्माचा दाखला", name_en: "Birth Certificate", required: false },
      { group: "वयाचा पुरावा (कोणतेही - १)", name_mr: "शाळा सोडल्याचे प्रमाणपत्र (LC/TC)", name_en: "School Leaving Certificate", required: false },
      { group: "वयाचा पुरावा (कोणतेही - १)", name_mr: "प्राथमिक शाळेच्या प्रवेशाचा उतारा", name_en: "Primary School Admission Extract", required: false },
      
      { group: "१५ वर्षापासूनचे वास्तव्य सिद्ध करण्यासाठी कागदपत्रे (किमान १)", name_mr: "७/१२ आणि ८ अ चा उतारा", name_en: "7/12 & 8-A Extract", required: false },
      { group: "१५ वर्षापासूनचे वास्तव्य सिद्ध करण्यासाठी कागदपत्रे (किमान १)", name_mr: "भाडेपावती", name_en: "Rent Receipt", required: false },
      { group: "१५ वर्षापासूनचे वास्तव्य सिद्ध करण्यासाठी कागदपत्रे (किमान १)", name_mr: "शिधापत्रिका (रेशन कार्ड)", name_en: "Ration Card", required: false },
      { group: "१५ वर्षापासूनचे वास्तव्य सिद्ध करण्यासाठी कागदपत्रे (किमान १)", name_mr: "मालमत्ता करपावती", name_en: "Property Tax Receipt", required: false },
      { group: "१५ वर्षापासूनचे वास्तव्य सिद्ध करण्यासाठी कागदपत्रे (किमान १)", name_mr: "वीज देयक", name_en: "Electricity Bill", required: false },
      { group: "१५ वर्षापासूनचे वास्तव्य सिद्ध करण्यासाठी कागदपत्रे (किमान १)", name_mr: "मतदार यादीचा उतारा", name_en: "Voter List Extract", required: false },
      { group: "१५ वर्षापासूनचे वास्तव्य सिद्ध करण्यासाठी कागदपत्रे (किमान १)", name_mr: "वडिलांचे/पतीचे अधिवास प्रमाणपत्र", name_en: "Father's / Husband's Domicile Certificate", required: false },
      { group: "१५ वर्षापासूनचे वास्तव्य सिद्ध करण्यासाठी कागदपत्रे (किमान १)", name_mr: "विवाह प्रमाणपत्र (लागू असल्यास)", name_en: "Marriage Certificate (if applicable)", required: false }
    ]
  },

  // 3. जातीचा दाखला
  {
    id: "caste-cert",
    category: "revenue",
    icon: "fa-solid fa-id-badge",
    title_mr: "जातीचा दाखला (Caste Certificate)",
    title_en: "Caste Certificate (SC/ST/OBC/VJNT/SBC/SEBC)",
    desc_mr: "उपविभागीय अधिकारी (SDO) कार्यालयाकडून जारी होणारे अधिकृत जात प्रमाणपत्र.",
    desc_en: "Official Caste Certificate issued by Sub-Divisional Officer (SDO) Office.",
    timeline_mr: "१५ ते ३० दिवस",
    timeline_en: "15 to 30 Days",
    govt_fee: 69.00,
    csc_fee: 131.00,
    total_fee: 200.00,
    popular: true,
    fee_breakdown: {
      govt_fee: 69.00,
      form_fee: 30.00,
      scanning_fee: 30.00,
      filing_fee: 41.00,
      lamination_fee: 30.00,
      total: 200.00
    },
    documents: [
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "पासपोर्ट", name_en: "Passport", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "आधार कार्ड", name_en: "Aadhaar Card", required: true },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "पॅनकार्ड", name_en: "PAN Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "मतदार ओळखपत्र", name_en: "Voter ID Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "वाहनचालक परवाना", name_en: "Driving License", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "मनरेगा जॉब कार्ड", name_en: "MNREGA Job Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "निमशासकीय ओळखपत्र", name_en: "Semi-Govt ID Card", required: false },
      
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "वीज बिल", name_en: "Electricity Bill", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "भाडे पावती", name_en: "Rent Receipt", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "पाणीपट्टी पावती", name_en: "Water Bill Receipt", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "शिधापत्रिका", name_en: "Ration Card", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "मालमत्ता नोंदणी उतारा", name_en: "Property Registration Extract", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "सातबारा आणि आठ अ उतारा", name_en: "7/12 & 8-A Extract", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "मालमत्ता कर पावती", name_en: "Property Tax Receipt", required: false },
      
      { group: "अनिवार्य कागदपत्रे", name_mr: "स्वयंघोषणापत्र", name_en: "Self Declaration Form", required: true },
      { group: "अनिवार्य कागदपत्रे", name_mr: "जातीचा पुरावा (मूळ दाखला किंवा महसुली नोंद)", name_en: "Proof of Caste", required: true },
      { group: "अनिवार्य कागदपत्रे", name_mr: "जन्म नोंदवहीतील पुरावा (गाव नमुना १४ / जन्म दाखला)", name_en: "Birth Register Extract / Gaon Namuna 14", required: true },
      { group: "अनिवार्य कागदपत्रे", name_mr: "महसुली पुरावा (खरेदीखत / ७/१२ / फेरफार)", name_en: "Revenue Proof (Sale Deed / 7/12 / Ferfar)", required: true },
      { group: "अनिवार्य कागदपत्रे", name_mr: "वडील किंवा आजोबांचा शाळा सोडल्याचा दाखला (जातीची नोंद असलेला)", name_en: "Father's / Grandfather's School LC with Caste", required: true },
      { group: "अनिवार्य कागदपत्रे", name_mr: "शासकीय सेवा पुस्तकातील नोंदी (लागू असल्यास)", name_en: "Govt Service Book Caste Entries", required: false },
      { group: "अनिवार्य कागदपत्रे", name_mr: "नातेवाईकांचे जात पडताळणी प्रमाणपत्र (Caste Validity)", name_en: "Relative's Caste Validity Certificate", required: false }
    ]
  },

  // 4. वय अधिवास दाखला
  {
    id: "domicile-cert",
    category: "revenue",
    icon: "fa-solid fa-location-dot",
    title_mr: "वय व अधिवास दाखला (Age & Domicile Certificate)",
    title_en: "Age & Domicile Certificate",
    desc_mr: "महाराष्ट्र राज्यातील १५ वर्षांचे वास्तव्य व भारतीय नागरिकत्वाचा अधिकृत दाखला.",
    desc_en: "Official Age, Nationality and Domicile Certificate.",
    timeline_mr: "७ ते १५ दिवस",
    timeline_en: "7 to 15 Days",
    govt_fee: 69.00,
    csc_fee: 131.00,
    total_fee: 200.00,
    popular: true,
    fee_breakdown: {
      govt_fee: 69.00,
      form_fee: 30.00,
      scanning_fee: 30.00,
      filing_fee: 41.00,
      lamination_fee: 30.00,
      total: 200.00
    },
    documents: [
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "आधार कार्ड", name_en: "Aadhaar Card", required: true },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "वाहन चालक अनुज्ञप्ती", name_en: "Driving License", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "मतदार ओळखपत्र", name_en: "Voter ID Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "मनरेगा जॉब कार्ड", name_en: "MNREGA Job Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "पॅन कार्ड", name_en: "PAN Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "निमशासकीय ओळखपत्र", name_en: "Semi-Govt ID Card", required: false },
      
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "आधार कार्ड", name_en: "Aadhaar Card", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "वाहन चालक अनुज्ञप्ती", name_en: "Driving License", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "शिधापत्रिका", name_en: "Ration Card", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "मालमत्ता कर पावती", name_en: "Property Tax Receipt", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "पाणीपट्टी पावती", name_en: "Water Bill Receipt", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "वीज देयक", name_en: "Electricity Bill", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "मतदार ओळखपत्र", name_en: "Voter ID Card", required: false },
      
      { group: "१५ वर्षापासूनचे वास्तव्य सिद्ध करण्यासाठी कागदपत्रे (कोणतेही - १)", name_mr: "वडिलांचे/पतीचे अधिवास प्रमाणपत्र", name_en: "Father's / Husband's Domicile Certificate", required: false },
      { group: "१५ वर्षापासूनचे वास्तव्य सिद्ध करण्यासाठी कागदपत्रे (कोणतेही - १)", name_mr: "विवाह प्रमाणपत्र (लागू असल्यास)", name_en: "Marriage Certificate (if applicable)", required: false },
      { group: "१५ वर्षापासूनचे वास्तव्य सिद्ध करण्यासाठी कागदपत्रे (कोणतेही - १)", name_mr: "७/१२ आणि ८ अ चा उतारा", name_en: "7/12 & 8-A Extract", required: false },
      { group: "१५ वर्षापासूनचे वास्तव्य सिद्ध करण्यासाठी कागदपत्रे (कोणतेही - १)", name_mr: "भाडेपावती", name_en: "Rent Receipt", required: false },
      { group: "१५ वर्षापासूनचे वास्तव्य सिद्ध करण्यासाठी कागदपत्रे (कोणतेही - १)", name_mr: "शिधापत्रिका", name_en: "Ration Card", required: false },
      { group: "१५ वर्षापासूनचे वास्तव्य सिद्ध करण्यासाठी कागदपत्रे (कोणतेही - १)", name_mr: "मालमत्ता करपावती", name_en: "Property Tax Receipt", required: false },
      { group: "१५ वर्षापासूनचे वास्तव्य सिद्ध करण्यासाठी कागदपत्रे (कोणतेही - १)", name_mr: "वीज देयक", name_en: "Electricity Bill", required: false },
      { group: "१५ वर्षापासूनचे वास्तव्य सिद्ध करण्यासाठी कागदपत्रे (कोणतेही - १)", name_mr: "मतदार ओळखपत्र", name_en: "Voter ID Card", required: false },
      
      { group: "वयाचा पुरावा (कोणतेही - १)", name_mr: "जन्माचा दाखला", name_en: "Birth Certificate", required: false },
      { group: "वयाचा पुरावा (कोणतेही - १)", name_mr: "शाळा सोडल्याचे प्रमाणपत्र (LC)", name_en: "School Leaving Certificate", required: false },
      { group: "वयाचा पुरावा (कोणतेही - १)", name_mr: "प्राथमिक शाळेच्या प्रवेशाचा उतारा", name_en: "Primary School Admission Extract", required: false }
    ]
  },

  // 5. नॉन क्रिमिलेअर दाखला
  {
    id: "non-creamy-layer",
    category: "revenue",
    icon: "fa-solid fa-certificate",
    title_mr: "नॉन क्रिमिलेअर दाखला (Non-Creamy Layer - NCL)",
    title_en: "Non-Creamy Layer Certificate (OBC/VJNT/SBC/SEBC)",
    desc_mr: "मागील ३ वर्षांच्या उत्पन्नावर आधारित उन्नत व प्रगत गटात मोडत नसल्याचा दाखला.",
    desc_en: "Certificate certifying non-belonging to creamy layer based on last 3 years income.",
    timeline_mr: "७ ते १५ दिवस",
    timeline_en: "7 to 15 Days",
    govt_fee: 69.00,
    csc_fee: 131.00,
    total_fee: 200.00,
    popular: true,
    fee_breakdown: {
      govt_fee: 69.00,
      form_fee: 30.00,
      scanning_fee: 30.00,
      filing_fee: 41.00,
      lamination_fee: 30.00,
      total: 200.00
    },
    documents: [
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "पासपोर्ट", name_en: "Passport", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "आधार कार्ड", name_en: "Aadhaar Card", required: true },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "पॅनकार्ड", name_en: "PAN Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "मतदार ओळखपत्र", name_en: "Voter ID Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "वाहनचालक परवाना", name_en: "Driving License", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "मनरेगा जॉब कार्ड", name_en: "MNREGA Job Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "निमशासकीय ओळखपत्र", name_en: "Semi-Govt ID Card", required: false },
      
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "वीज बिल", name_en: "Electricity Bill", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "भाडे पावती", name_en: "Rent Receipt", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "पाणीपट्टी पावती", name_en: "Water Bill Receipt", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "शिधापत्रिका", name_en: "Ration Card", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "मालमत्ता नोंदणी उतारा", name_en: "Property Registration Extract", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "सातबारा आणि आठ अ उतारा", name_en: "7/12 & 8-A Extract", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "मालमत्ता कर पावती", name_en: "Property Tax Receipt", required: false },
      
      { group: "अनिवार्य कागदपत्रे", name_mr: "स्वयंघोषणापत्र (Self Declaration)", name_en: "Self Declaration Form", required: true },
      { group: "अनिवार्य कागदपत्रे", name_mr: "मागील ३ वर्षांचा उत्पन्नाचा दाखला (Tahsildar Income Proof)", name_en: "Last 3 Years Income Certificate", required: true },
      { group: "अनिवार्य कागदपत्रे", name_mr: "जात प्रमाणपत्र (Caste Certificate)", name_en: "Caste Certificate", required: true }
    ]
  },

  // 6. केंद्र सरकार EWS प्रमाणपत्र
  {
    id: "ews-central-cert",
    category: "revenue",
    icon: "fa-solid fa-stamp",
    title_mr: "केंद्र सरकार EWS प्रमाणपत्र (Central Govt EWS)",
    title_en: "Central Government EWS Certificate (10% Reservation)",
    desc_mr: "केंद्रीय नोकऱ्या व शैक्षणिक संस्थांमधील १०% EWS आरक्षणासाठी अधिकृत प्रमाणपत्र.",
    desc_en: "Official Central Govt 10% EWS Reservation Certificate for Jobs & Admissions.",
    timeline_mr: "१५ ते २१ दिवस",
    timeline_en: "15 to 21 Days",
    govt_fee: 69.00,
    csc_fee: 131.00,
    total_fee: 200.00,
    popular: true,
    fee_breakdown: {
      govt_fee: 69.00,
      form_fee: 30.00,
      scanning_fee: 30.00,
      filing_fee: 41.00,
      lamination_fee: 30.00,
      total: 200.00
    },
    documents: [
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "पारपत्र (पासपोर्ट)", name_en: "Passport", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "पॅनकार्ड", name_en: "PAN Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "आधार कार्ड", name_en: "Aadhaar Card", required: true },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "मतदार ओळखपत्र", name_en: "Voter ID Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "रोजगार हमी जॉब कार्ड", name_en: "EGS Job Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "निमशासकीय ओळखपत्र", name_en: "Semi-Govt ID Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "वाहनचालक परवाना", name_en: "Driving License", required: false },
      
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "वीज बिल", name_en: "Electricity Bill", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "भाडे पावती", name_en: "Rent Receipt", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "शिधापत्रिका", name_en: "Ration Card", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "दूरध्वनी देयक (Telephone Bill)", name_en: "Telephone Bill", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "पाणीपट्टी पावती", name_en: "Water Bill Receipt", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "मालमत्ता करपावती", name_en: "Property Tax Receipt", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "सातबारा आणि आठ अ उतारा", name_en: "7/12 & 8-A Extract", required: false },
      
      { group: "इतर दस्तऐवज (कोणतेही एक)", name_mr: "प्रतिज्ञापत्र (Affidavit)", name_en: "Affidavit", required: false },
      { group: "इतर दस्तऐवज (कोणतेही एक)", name_mr: "जन्म दाखला", name_en: "Birth Certificate", required: false },
      { group: "इतर दस्तऐवज (कोणतेही एक)", name_mr: "शाळा सोडल्याचा दाखला (LC)", name_en: "School Leaving Certificate", required: false },
      { group: "इतर दस्तऐवज (कोणतेही एक)", name_mr: "जात प्रमाणपत्र (Caste Certificate)", name_en: "Caste Certificate", required: false },
      { group: "इतर दस्तऐवज (कोणतेही एक)", name_mr: "लग्न प्रमाणपत्र (Marriage Certificate)", name_en: "Marriage Certificate", required: false },
      
      { group: "अनिवार्य कागदपत्रे", name_mr: "उत्पन्नाचा दाखला (वार्षिक मर्यादा ₹८ लाखांच्या आत)", name_en: "Income Certificate (Below 8 Lakhs)", required: true }
    ]
  },

  // 7. ३०% महिला आरक्षण दाखला
  {
    id: "women-reservation-cert",
    category: "revenue",
    icon: "fa-solid fa-person-dress",
    title_mr: "३०% महिला आरक्षण दाखला (30% Women Reservation)",
    title_en: "30% Women Reservation Certificate",
    desc_mr: "शासकीय व निमशासकीय नोकऱ्यांमध्ये ३०% समांतर महिला आरक्षणासाठी दाखला.",
    desc_en: "Official 30% Parallel Women Reservation Certificate for Maharashtra Govt Jobs.",
    timeline_mr: "७ ते १५ दिवस",
    timeline_en: "7 to 15 Days",
    govt_fee: 69.00,
    csc_fee: 131.00,
    total_fee: 200.00,
    popular: true,
    fee_breakdown: {
      govt_fee: 69.00,
      form_fee: 30.00,
      scanning_fee: 30.00,
      filing_fee: 41.00,
      lamination_fee: 30.00,
      total: 200.00
    },
    documents: [
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "१. दाखलाधारकाचा शाळा सोडलेला दाखला किंवा बोनाफाईड", name_en: "1. Applicant's School Leaving Certificate or Bonafide", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "२. रेशनकार्ड (Ration Card)", name_en: "2. Ration Card", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "३. घरपत्रक उतारा (ग्रामसेवक सहीचा)", name_en: "3. Gram Panchayat House Property Extract (Gharpatrak)", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "४. आधारकार्ड (दाखलाधारक व अर्जदार)", name_en: "4. Aadhaar Card (Applicant & Guardian/Husband)", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "५. पो.पाटील दाखला (Police Patil Certificate)", name_en: "5. Police Patil Certificate", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "६. स्वयंघोषणापत्र (Self Declaration)", name_en: "6. Self Declaration Form", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "७. तीन वर्षाचा उत्पन्न दाखला (3 Years Income Certificate)", name_en: "7. Last 3 Years Tahsildar Income Certificate", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "८. अर्जदाराचा पासपोर्ट फोटो", name_en: "8. Applicant Passport Size Photograph", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "९. विहित नमुन्यातील छापील अर्ज", name_en: "9. Prescribed Application Form", required: true }
    ]
  },

  // 8. ज्येष्ठ नागरिक दाखला
  {
    id: "senior-citizen-cert",
    category: "revenue",
    icon: "fa-solid fa-person-cane",
    title_mr: "ज्येष्ठ नागरिक दाखला (Senior Citizen Certificate)",
    title_en: "Senior Citizen Certificate & ID Card",
    desc_mr: "६० वर्षे व त्यापुढील नागरिकांसाठी शासकीय योजना व सवलतींचे ओळखपत्र व प्रमाणपत्र.",
    desc_en: "Senior Citizen Certificate for Government Concessions & Healthcare Schemes.",
    timeline_mr: "३ ते ५ दिवस",
    timeline_en: "3 to 5 Days",
    govt_fee: 69.00,
    csc_fee: 131.00,
    total_fee: 200.00,
    popular: false,
    fee_breakdown: {
      govt_fee: 69.00,
      form_fee: 30.00,
      scanning_fee: 30.00,
      filing_fee: 41.00,
      lamination_fee: 30.00,
      total: 200.00
    },
    documents: [
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "आधार कार्ड", name_en: "Aadhaar Card", required: true },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "मतदार ओळखपत्र", name_en: "Voter ID Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "पॅन कार्ड", name_en: "PAN Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "वाहन चालक अनुज्ञप्ती", name_en: "Driving License", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "पासपोर्ट", name_en: "Passport", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "जॉब कार्ड (मनरेगा)", name_en: "Job Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "आर एस बी वाय कार्ड (RSBY Card)", name_en: "RSBY Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही - १)", name_mr: "निमशासकीय ओळखपत्र", name_en: "Semi-Govt ID Card", required: false },
      
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "आधार कार्ड", name_en: "Aadhaar Card", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "मतदार यादीचा उतारा", name_en: "Voter List Extract", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "पॅन कार्ड", name_en: "PAN Card", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "वाहन चालक अनुज्ञप्ती", name_en: "Driving License", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "मालमत्ता कर पावती", name_en: "Property Tax Receipt", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "शिधापत्रिका", name_en: "Ration Card", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "वीज देयक", name_en: "Electricity Bill", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "दूरध्वनी देयक", name_en: "Telephone Bill", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "पाणीपट्टी पावती", name_en: "Water Bill Receipt", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "७/१२ आणि ८ अ चा उतारा", name_en: "7/12 & 8-A Extract", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही - १)", name_mr: "मालमत्ता नोंदणी उतारा", name_en: "Property Registration Extract", required: false },
      
      { group: "वयाचा पुरावा (कोणतेही - १)", name_mr: "आधार कार्ड", name_en: "Aadhaar Card", required: false },
      { group: "वयाचा पुरावा (कोणतेही - १)", name_mr: "शाळा सोडल्याचे प्रमाणपत्र (LC)", name_en: "School Leaving Certificate", required: false },
      { group: "वयाचा पुरावा (कोणतेही - १)", name_mr: "जन्माचा दाखला", name_en: "Birth Certificate", required: false },
      { group: "वयाचा पुरावा (कोणतेही - १)", name_mr: "वैद्यकीय प्रमाणपत्र (Civil Surgeon Certificate)", name_en: "Government Medical Age Certificate", required: false }
    ]
  },

  // 9. डोंगरी दाखला
  {
    id: "dongari-cert",
    category: "revenue",
    icon: "fa-solid fa-mountain",
    title_mr: "डोंगरी दाखला (Hill Area Certificate)",
    title_en: "Hill Area (Dongari) Certificate",
    desc_mr: "शासकीय आणि सामाजिक शिक्षण फायद्यासाठी तालुक्यातील रहिवासी असल्याचा डोंगरी दाखला.",
    desc_en: "Official Hill Area (Dongari) Resident Certificate for Education & Employment Benefits.",
    timeline_mr: "७ ते १५ दिवस",
    timeline_en: "7 to 15 Days",
    govt_fee: 69.00,
    csc_fee: 131.00,
    total_fee: 200.00,
    popular: true,
    fee_breakdown: {
      govt_fee: 69.00,
      form_fee: 30.00,
      scanning_fee: 30.00,
      filing_fee: 41.00,
      lamination_fee: 30.00,
      total: 200.00
    },
    documents: [
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "पासपोर्ट", name_en: "Passport", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "आधार कार्ड", name_en: "Aadhaar Card", required: true },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "पॅनकार्ड", name_en: "PAN Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "मतदार ओळखपत्र", name_en: "Voter ID Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "वाहनचालक परवाना", name_en: "Driving License", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "मनरेगा जॉब कार्ड", name_en: "MNREGA Job Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "निमशासकीय ओळखपत्र", name_en: "Semi-Govt ID Card", required: false },
      
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "वीज बिल", name_en: "Electricity Bill", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "भाडे पावती", name_en: "Rent Receipt", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "पाणीपट्टी पावती", name_en: "Water Bill Receipt", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "शिधापत्रिका", name_en: "Ration Card", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "मालमत्ता नोंदणी उतारा", name_en: "Property Registration Extract", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "सातबारा आणि आठ अ उतारा", name_en: "7/12 & 8-A Extract", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "मालमत्ता कर पावती", name_en: "Property Tax Receipt", required: false },
      
      { group: "वयाचा पुरावा (कोणतेही एक)", name_mr: "जन्म दाखला", name_en: "Birth Certificate", required: false },
      { group: "वयाचा पुरावा (कोणतेही एक)", name_mr: "शाळा सोडल्याचा दाखला (LC)", name_en: "School Leaving Certificate", required: false },
      { group: "वयाचा पुरावा (कोणतेही एक)", name_mr: "बोनाफाईड (Bonafide Certificate)", name_en: "Bonafide Certificate", required: false },
      
      { group: "अनिवार्य कागदपत्रे", name_mr: "स्वयंघोषणापत्र (Self Declaration)", name_en: "Self Declaration Form", required: true },
      
      { group: "इतर कागदपत्रे (कोणतेही एक)", name_mr: "मूळ विचारपत्रिका", name_en: "Original Vicharpatrika", required: false },
      { group: "इतर कागदपत्रे (कोणतेही एक)", name_mr: "शाळा सोडल्याचा दाखला (तालुक्यातील शाळेचा)", name_en: "School LC from Taluka School", required: false },
      { group: "इतर कागदपत्रे (कोणतेही एक)", name_mr: "वय व अधिवास प्रमाणपत्र", name_en: "Age & Domicile Certificate", required: false }
    ]
  },

  // 10. वारस दाखला (गिरणी कामगार)
  {
    id: "waras-girni-cert",
    category: "revenue",
    icon: "fa-solid fa-users-rays",
    title_mr: "वारस दाखला (गिरणी कामगार) (Heir Certificate)",
    title_en: "Heir Certificate for Mill Workers",
    desc_mr: "गिरणी कामगारांच्या वारसांसाठी म्हाडा व शासकीय हक्कासाठीचा वारस दाखला.",
    desc_en: "Official Heirship Certificate for Mill Worker Successors (MHADA/Govt Schemes).",
    timeline_mr: "१५ ते ३० दिवस",
    timeline_en: "15 to 30 Days",
    govt_fee: 69.00,
    csc_fee: 131.00,
    total_fee: 200.00,
    popular: false,
    fee_breakdown: {
      govt_fee: 69.00,
      form_fee: 30.00,
      scanning_fee: 30.00,
      filing_fee: 41.00,
      lamination_fee: 30.00,
      total: 200.00
    },
    documents: [
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "१. गिरणी कामगार असलेबाबतचे पुरावे (सर्व्हिस कार्ड/पेन्शन/तिकीट)", name_en: "1. Mill Worker Employment Proof (Service Card/Ticket)", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "२. म्हाडाचे पत्र (खोली मिळाल असलेबाबतचे / MHADA Letter)", name_en: "2. MHADA Allotment / Eligibility Letter", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "३. ७/१२ व ८ अ व फेरफार उतारा", name_en: "3. 7/12, 8-A & Ferfar Extract", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "४. रेशनकार्ड (Ration Card)", name_en: "4. Ration Card", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "५. घरपत्रक उतारा (ग्रामसेवक सहीचा)", name_en: "5. Gram Panchayat House Property Extract (Gharpatrak)", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "६. वंशावळ बाबतचे प्रतिज्ञापत्र (Genealogy Affidavit)", name_en: "6. Genealogy / Vanshaval Affidavit", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "७. क उतारा (Ka Utara)", name_en: "7. K Extract", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "८. पो. पाटील रहिवाशी दाखला", name_en: "8. Police Patil Residence Certificate", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "९. स्वयंघोषणापत्र (Self Declaration)", name_en: "9. Self Declaration Form", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "१०. आधारकार्ड (सर्व वारसांचे)", name_en: "10. Aadhaar Card (All Heirs)", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "११. तलाठी अहवाल (Talathi Report)", name_en: "11. Talathi Inquiry Report", required: true }
    ]
  },

  // 11. डिजिटल स्वाक्षरीत ७/१२, ८-अ व फेरफार उतारा
  {
    id: "land-records",
    category: "revenue",
    icon: "fa-solid fa-map-location-dot",
    title_mr: "डिजिटल स्वाक्षरीत ७/१२, ८-अ व फेरफार उतारा",
    title_en: "Digitally Signed 7/12, 8-A & Ferfar (Mahabhulekh)",
    desc_mr: "शासकीय कामांसाठी ग्राह्य असणारा QR कोड व डिजिटल स्वाक्षरीयुक्त जमीन उतारा.",
    desc_en: "Official digitally signed 7/12, 8-A and mutation extract for all legal purposes.",
    timeline_mr: "तात्काळ (१० मिनिटे)",
    timeline_en: "Instant (10 Minutes)",
    govt_fee: 15.00,
    csc_fee: 25.00,
    total_fee: 40.00,
    popular: true,
    fee_breakdown: {
      govt_fee: 15.00,
      form_fee: 0.00,
      scanning_fee: 0.00,
      filing_fee: 25.00,
      total: 40.00
    },
    documents: [
      { group: "आवश्यक तपशील", name_mr: "गाव, तालुका, जिल्हा व गट नंबर / सर्व्हे नंबर", name_en: "Village, Taluka, District & Gat/Survey Number", required: true },
      { group: "आवश्यक तपशील", name_mr: "खातेदाराचे नाव किंवा खाते नंबर", name_en: "Khatedar Name or Account Number", required: false }
    ]
  },

  // ==========================================
  // २. शेतकरी व कृषी योजना (Farmer & Welfare Schemes)
  // ==========================================

  // 12. अल्पभूधारक दाखला
  {
    id: "alpabhudharak-cert",
    category: "schemes",
    icon: "fa-solid fa-tractor",
    title_mr: "अल्पभूधारक दाखला (Small Landholder Certificate)",
    title_en: "Small Marginal Farmer Certificate (Alpabhudharak)",
    desc_mr: "२ हेक्टरपर्यंत शेतजमीन असणाऱ्या शेतकऱ्यांसाठी शासकीय योजनांचा अल्पभूधारक दाखला.",
    desc_en: "Certificate for Marginal & Small Landholding Farmers (up to 2 Hectares).",
    timeline_mr: "५ ते १० दिवस",
    timeline_en: "5 to 10 Days",
    govt_fee: 69.00,
    csc_fee: 131.00,
    total_fee: 200.00,
    popular: true,
    fee_breakdown: {
      govt_fee: 69.00,
      form_fee: 30.00,
      scanning_fee: 30.00,
      filing_fee: 41.00,
      lamination_fee: 30.00,
      total: 200.00
    },
    documents: [
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "१. मंडळ अधिकारी दाखला / अहवाल", name_en: "1. Circle Officer (Mandal Adhikari) Report", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "२. सातबारा उतारा (नवीन ७/१२)", name_en: "2. 7/12 Land Record Extract", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "३. आठ अ उतारा (८-अ)", name_en: "3. 8-A Holding Khata Extract", required: true },
      { group: "ओळखीचा पुरावा (कोणताही एक)", name_mr: "१. पासपोर्ट", name_en: "1. Passport", required: false },
      { group: "ओळखीचा पुरावा (कोणताही एक)", name_mr: "२. आधार कार्ड", name_en: "2. Aadhaar Card", required: true },
      { group: "ओळखीचा पुरावा (कोणताही एक)", name_mr: "३. मतदार ओळखपत्र", name_en: "3. Voter ID Card", required: false },
      { group: "ओळखीचा पुरावा (कोणताही एक)", name_mr: "४. वाहनचालक परवाना इतर", name_en: "4. Driving License / Other ID", required: false }
    ]
  },

  // 13. भूमीहीन शेतकरी दाखला
  {
    id: "landless-farmer-cert",
    category: "schemes",
    icon: "fa-solid fa-seedling",
    title_mr: "भूमीहीन शेतकरी दाखला (Landless Farmer Certificate)",
    title_en: "Landless Farmer Certificate",
    desc_mr: "स्वतःच्या नावावर कोणतीही शेतजमीन नसल्याबाबत तहसीलदारांचा अधिकृत दाखला.",
    desc_en: "Official Certificate certifying landless agricultural status.",
    timeline_mr: "७ ते १५ दिवस",
    timeline_en: "7 to 15 Days",
    govt_fee: 69.00,
    csc_fee: 131.00,
    total_fee: 200.00,
    popular: false,
    fee_breakdown: {
      govt_fee: 69.00,
      form_fee: 30.00,
      scanning_fee: 30.00,
      filing_fee: 41.00,
      lamination_fee: 30.00,
      total: 200.00
    },
    documents: [
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "पासपोर्ट", name_en: "Passport", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "आधार कार्ड", name_en: "Aadhaar Card", required: true },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "पॅनकार्ड", name_en: "PAN Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "मतदार ओळखपत्र", name_en: "Voter ID Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "वाहनचालक परवाना", name_en: "Driving License", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "मनरेगा जॉब कार्ड", name_en: "MNREGA Job Card", required: false },
      { group: "ओळखीचा पुरावा (कोणतेही एक)", name_mr: "निमशासकीय ओळखपत्र", name_en: "Semi-Govt ID Card", required: false },
      
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "वीज बिल", name_en: "Electricity Bill", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "भाडे पावती", name_en: "Rent Receipt", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "पाणीपट्टी पावती", name_en: "Water Bill Receipt", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "शिधापत्रिका", name_en: "Ration Card", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "मालमत्ता नोंदणी उतारा", name_en: "Property Registration Extract", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "सातबारा आणि आठ अ उतारा", name_en: "7/12 & 8-A Extract", required: false },
      { group: "पत्त्याचा पुरावा (कोणतेही एक)", name_mr: "मालमत्ता कर पावती", name_en: "Property Tax Receipt", required: false },
      
      { group: "अनिवार्य कागदपत्रे", name_mr: "संबंधित जागेचा सातबारा आणि आठ अ उतारा", name_en: "Relevant Land 7/12 & 8-A Extract", required: true },
      { group: "अनिवार्य कागदपत्रे", name_mr: "मंडळ अधिकारी अहवाल", name_en: "Circle Officer (Mandal Adhikari) Report", required: true }
    ]
  },

  // 14. PM किसान व नमो शेतकरी योजना
  {
    id: "pm-kisan-namo",
    category: "schemes",
    icon: "fa-solid fa-wheat-awn",
    title_mr: "PM किसान व नमो शेतकरी योजना eKYC / नवीन नोंदणी",
    title_en: "PM Kisan & Namo Shetkari Yojana Registration / eKYC",
    desc_mr: "वार्षिक ₹१२,००० सन्मान निधीसाठी बायोमेट्रिक eKYC, जमीन सिडिंग व नवीन नोंदणी.",
    desc_en: "Biometric eKYC, land-linking, and registration for annual ₹12,000 farmer benefit.",
    timeline_mr: "तात्काळ (eKYC)",
    timeline_en: "Instant eKYC",
    govt_fee: 15.00,
    csc_fee: 35.00,
    total_fee: 50.00,
    popular: true,
    documents: [
      { group: "आवश्यक कागदपत्रे", name_mr: "आधार कार्ड व बँक पासबूक (DBT ॲक्टिव्हेटेड)", name_en: "Aadhaar Card & Bank Passbook (DBT Active)", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "नवीन नोंदणीसाठी ७/१२ व ८-अ उतारा", name_en: "7/12 & 8-A Extract for New Registration", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "मोबाईल नंबर (OTP साठी)", name_en: "Mobile Number for OTP", required: true }
    ]
  },

  // 15. प्रधानमंत्री पीक विमा योजना
  {
    id: "pik-vima",
    category: "schemes",
    icon: "fa-solid fa-shield-halved",
    title_mr: "प्रधानमंत्री पीक विमा योजना (१ रुपयात पीक विमा)",
    title_en: "Pradhan Mantri Fasal Bima Yojana (₹1 Crop Insurance)",
    desc_mr: "खरीप व रब्बी हंगामातील पिकांचे नैसर्गिक आपत्तीपासून संरक्षणासाठी ऑनलाइन विमा अर्ज.",
    desc_en: "Online Crop Insurance application for Kharif & Rabi season under ₹1 scheme.",
    timeline_mr: "तात्काळ पावती",
    timeline_en: "Instant Receipt",
    govt_fee: 1.00,
    csc_fee: 49.00,
    total_fee: 50.00,
    popular: true,
    documents: [
      { group: "आवश्यक कागदपत्रे", name_mr: "७/१२ व ८-अ उतारा (ई-पीक पाहणी नोंद असलेला)", name_en: "7/12 & 8-A with E-Pik Pahani Entry", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "आधार कार्ड व बँक पासबूक", name_en: "Aadhaar Card & Bank Passbook", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "पिक पेरणी स्वयंघोषणापत्र", name_en: "Sowing Self Declaration", required: true }
    ]
  },

  // 16. मुख्यमंत्री माझी लाडकी बहीण योजना
  {
    id: "ladki-bahin-yojana",
    category: "schemes",
    icon: "fa-solid fa-heart",
    title_mr: "मुख्यमंत्री माझी लाडकी बहीण योजना अर्ज",
    title_en: "Mukhyamantri Majhi Ladki Bahin Yojana Registration",
    desc_mr: "महाराष्ट्र शासनाची पात्र महिलांसाठी मासिक ₹१,५०० आर्थिक सहाय्य योजना.",
    desc_en: "Maharashtra government scheme offering ₹1,500/month financial aid to eligible women.",
    timeline_mr: "२ ते ३ दिवस",
    timeline_en: "2 to 3 Days",
    govt_fee: 0.00,
    csc_fee: 50.00,
    total_fee: 50.00,
    popular: true,
    documents: [
      { group: "आवश्यक कागदपत्रे", name_mr: "महिला अर्जदाराचे आधार कार्ड (Aadhaar Card)", name_en: "Aadhaar Card of Female Applicant", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "अधिवास दाखला / १५ वर्षे जुने रेशन कार्ड / मतदान कार्ड / TC", name_en: "Domicile / 15-Yr Old Ration Card / Voter ID", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "उत्पन्न दाखला (२.५ लाखांपर्यंत) किंवा पिवळे/केशरी रेशन कार्ड", name_en: "Income Proof (Up to 2.5L) or Yellow/Orange Ration Card", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "आधार लिंक बँक खाते पासबूक", name_en: "Aadhaar-Linked Bank Account Passbook", required: true }
    ]
  },

  // 17. संजय गांधी निराधार व श्रावणबाळ योजना
  {
    id: "sanjay-gandhi-niradhar",
    category: "schemes",
    icon: "fa-solid fa-hand-holding-heart",
    title_mr: "संजय गांधी निराधार व श्रावणबाळ योजना",
    title_en: "Sanjay Gandhi Niradhar & Shravanbal Pension Scheme",
    desc_mr: "निराधार, दिव्यांग, विधवा व ज्येष्ठ नागरिकांना दरमहा शासकीय पेन्शन योजना.",
    desc_en: "Monthly government pension scheme for destitute, disabled, widows & senior citizens.",
    timeline_mr: "१५ ते ३० दिवस",
    timeline_en: "15 to 30 Days",
    govt_fee: 0.00,
    csc_fee: 80.00,
    total_fee: 80.00,
    popular: false,
    documents: [
      { group: "आवश्यक कागदपत्रे", name_mr: "आधार कार्ड व रहिवासी दाखला", name_en: "Aadhaar Card & Domicile Proof", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "तहसीलदार उत्पन्न दाखला (वार्षिक मर्यादा ₹२१,००० किंवा ₹५०,०००)", name_en: "Tahsildar Income Certificate", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "वयाचा दाखला / दिव्यांग प्रमाणपत्र / पतीचा मृत्यू दाखला (लागू असल्यास)", name_en: "Age / Disability / Death Certificate (as applicable)", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "बँक पासबूक झेरॉक्स व पासपोर्ट फोटो", name_en: "Bank Passbook & Passport Photos", required: true }
    ]
  },

  // ==========================================
  // ३. नागरिक सेवा व रेशनकार्ड (Citizen & Ration Card Services)
  // ==========================================

  // 18. रेशनकार्ड नाव दाखल
  {
    id: "ration-card-add-member",
    category: "citizen",
    icon: "fa-solid fa-user-plus",
    title_mr: "रेशनकार्ड नाव दाखल (Ration Card Member Addition)",
    title_en: "Ration Card - Add New Member Name",
    desc_mr: "नवीन जन्मलेले बाळ किंवा लग्न झालेल्या सुनेचे नाव रेशन कार्डमध्ये समाविष्ट करणे.",
    desc_en: "Addition of new child, spouse or family member in existing Ration Card.",
    timeline_mr: "१५ ते ३० दिवस",
    timeline_en: "15 to 30 Days",
    govt_fee: 69.00,
    csc_fee: 131.00,
    total_fee: 200.00,
    popular: true,
    fee_breakdown: {
      govt_fee: 69.00,
      form_fee: 30.00,
      scanning_fee: 30.00,
      filing_fee: 41.00,
      lamination_fee: 30.00,
      total: 200.00
    },
    documents: [
      { group: "सामान्य कागदपत्रे", name_mr: "१. विहित नमुन्यातील छापील अर्ज", name_en: "1. Prescribed Application Form", required: true },
      { group: "वय वर्ष १ ते ६ असेल तर", name_mr: "१. बालकाचे आधारकार्ड", name_en: "1. Child's Aadhaar Card", required: true },
      { group: "वय वर्ष १ ते ६ असेल तर", name_mr: "२. जन्माचा दाखला (Birth Certificate)", name_en: "2. Birth Certificate", required: true },
      { group: "वय वर्ष ६ ते १२ असेल तर", name_mr: "१. आधारकार्ड", name_en: "1. Aadhaar Card", required: true },
      { group: "वय वर्ष ६ ते १२ असेल तर", name_mr: "२. शाळेचा बोनाफाईड दाखला (Bonafide)", name_en: "2. School Bonafide Certificate", required: true },
      { group: "विवाहित स्त्री असल्यास", name_mr: "१. राजपत्र (Gazette) किंवा विवाह नोंदणी दाखला", name_en: "1. Gazette or Marriage Registration Certificate", required: true },
      { group: "विवाहित स्त्री असल्यास", name_mr: "२. माहेरच्या रेशन कार्डवरून नाव कमी केल्याचा दाखला", name_en: "2. Name Deletion Certificate from Parent's Ration Card", required: true },
      { group: "विवाहित स्त्री असल्यास", name_mr: "३. पो.पाटील दाखला (दोन्ही गावची सही एक असावयास)", name_en: "3. Police Patil Certificate (Joint verification)", required: true },
      { group: "सर्व सदस्यांचे ओळख पुरावे", name_mr: "५. रेशनकार्डवरील नाव असलेल्या सर्व व्यक्तींची आधारकार्ड", name_en: "5. Aadhaar Cards of all existing members in Ration Card", required: true },
      { group: "सर्व सदस्यांचे ओळख पुरावे", name_mr: "६. रेशनकार्डवरील नाव असलेल्या सर्व व्यक्तींची पॅनकार्ड किंवा मतदान ओळखपत्र", name_en: "6. PAN Card or Voter ID of all existing members", required: true }
    ]
  },

  // 19. रेशनकार्डवर नाव कमी
  {
    id: "ration-card-delete-member",
    category: "citizen",
    icon: "fa-solid fa-user-minus",
    title_mr: "रेशनकार्डवर नाव कमी (Ration Card Member Deletion)",
    title_en: "Ration Card - Delete Member Name",
    desc_mr: "मयत व्यक्तीचे नाव कमी करणे किंवा लग्न झालेल्या मुलीचे नाव रेशन कार्डमधून वगळणे.",
    desc_en: "Deletion of member name from Ration Card due to marriage, death or relocation.",
    timeline_mr: "१५ ते ३० दिवस",
    timeline_en: "15 to 30 Days",
    govt_fee: 69.00,
    csc_fee: 131.00,
    total_fee: 200.00,
    popular: false,
    fee_breakdown: {
      govt_fee: 69.00,
      form_fee: 30.00,
      scanning_fee: 30.00,
      filing_fee: 41.00,
      lamination_fee: 30.00,
      total: 200.00
    },
    documents: [
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "१. विहित नमुन्यातील छापील अर्ज", name_en: "1. Prescribed Application Form", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "२. मयत असल्यास मयत दाखला (Death Certificate)", name_en: "2. Death Certificate (if deceased)", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "३. विवाहित व अन्य कारणाने नाव कमी असल्यास तसे कारण अर्जात लिहिणे", name_en: "3. Reason Statement in Application (for marriage/shifting)", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "४. रेशनकार्डवरील नाव असलेल्या सर्व व्यक्तींची आधारकार्ड", name_en: "4. Aadhaar Cards of all members on Ration Card", required: true },
      { group: "आवश्यक कागदपत्रे सूची", name_mr: "५. रेशनकार्डवरील नाव असलेल्या सर्व व्यक्तींची पॅनकार्ड किंवा मतदान ओळखपत्र", name_en: "5. PAN Card or Voter ID of all existing members", required: true }
    ]
  },

  // 20. नवीन मतदार नोंदणी व दुरुस्ती
  {
    id: "voter-id-service",
    category: "citizen",
    icon: "fa-solid fa-square-check",
    title_mr: "नवीन मतदार नोंदणी व दुरुस्ती (Voter ID Form 6/8)",
    title_en: "New Voter Registration & Correction (Form 6 & 8)",
    desc_mr: "१८ वर्षे पूर्ण झालेल्या नागरिकांसाठी नवीन मतदार कार्ड व नाव/पत्ता बदल.",
    desc_en: "New Voter ID registration, constituency shift, and detail correction on ECINET.",
    timeline_mr: "१५ ते ३० दिवस",
    timeline_en: "15 to 30 Days",
    govt_fee: 0.00,
    csc_fee: 50.00,
    total_fee: 50.00,
    popular: true,
    documents: [
      { group: "आवश्यक कागदपत्रे", name_mr: "आधार कार्ड किंवा पॅन कार्ड (वयाचा पुरावा)", name_en: "Aadhaar Card / PAN Card (Age Proof)", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "रहिवासी पुरावा (लाईट बिल / रेशन कार्ड)", name_en: "Address Proof (Electricity Bill / Ration Card)", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "१ पासपोर्ट साईझ रंगीत फोटो", name_en: "1 Passport Size Photo", required: true }
    ]
  },

  // 21. उद्यम आधार (MSME Business Registration)
  {
    id: "udyam-msme-reg",
    category: "citizen",
    icon: "fa-solid fa-briefcase",
    title_mr: "उद्यम आधार (MSME Business Registration)",
    title_en: "Udyam MSME Registration Certificate",
    desc_mr: "लहान, मध्यम व सूक्ष्म व्यापारी/उद्योजकांसाठी अधिकृत केंद्र शासन मान्यता प्रमाणपत्र.",
    desc_en: "Official Government of India MSME Certificate for business loans and subsidies.",
    timeline_mr: "१ ते २ दिवस",
    timeline_en: "1 to 2 Days",
    govt_fee: 0.00,
    csc_fee: 150.00,
    total_fee: 150.00,
    popular: true,
    documents: [
      { group: "आवश्यक कागदपत्रे", name_mr: "व्यवसाय मालकाचे आधार कार्ड (मोबाईल लिंक)", name_en: "Owner's Aadhaar Card (Mobile linked)", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "पॅन कार्ड व बँकेचे तपशील (IFSC व खाते क्रमांक)", name_en: "PAN Card & Bank Details", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "व्यवसायाचे नाव, पत्ता व कामाचे स्वरूप", name_en: "Business Name, Address & Activity Type", required: true }
    ]
  },

  // 22. पासपोर्ट सेवा
  {
    id: "passport-seva",
    category: "citizen",
    icon: "fa-solid fa-passport",
    title_mr: "पासपोर्ट सेवा (नवीन पासपोर्ट / नूतनीकरण अपॉइंटमेंट)",
    title_en: "Passport Seva (New / Renewal Online Appointment)",
    desc_mr: "विदेश मंत्रालयाकडील भारतीय पासपोर्टचा ऑनलाइन अर्ज, फी भरणे व PSK स्लॉट बुकिंग.",
    desc_en: "Online Indian Passport application filing, govt fee payment and PSK appointment booking.",
    timeline_mr: "१५ ते २५ दिवस",
    timeline_en: "15 to 25 Days",
    govt_fee: 1500.00,
    csc_fee: 250.00,
    total_fee: 1750.00,
    popular: true,
    documents: [
      { group: "आवश्यक कागदपत्रे", name_mr: "आधार कार्ड (Aadhaar Card)", name_en: "Aadhaar Card", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "१० वी किंवा १२ वी बोर्ड सर्टिफिकेट (Non-ECR साठी)", name_en: "10th/12th Passing Certificate (for Non-ECR)", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "पॅन कार्ड / बँक पासबूक / लाईट बिल", name_en: "PAN Card / Bank Passbook / Light Bill", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "जन्म दाखला किंवा शाळा सोडल्याचा दाखला (TC)", name_en: "Birth Certificate or School LC", required: true }
    ]
  },

  // ==========================================
  // ४. ई-मुद्रा व डिजिटल स्वाक्षरी सेवा (eMudra & DSC Services)
  // ==========================================

  // 23. eMudra Class 3 डिजिटल सिग्नेचर
  {
    id: "emudra-dsc-class3",
    category: "emudra",
    icon: "fa-solid fa-key",
    title_mr: "eMudra Class 3 डिजिटल सिग्नेचर (DSC - 2 वर्षे)",
    title_en: "eMudra Class 3 Digital Signature Certificate (DSC - 2 Years)",
    desc_mr: "ई-निविदा (e-Tendering), ICEGATE, MCA/ROC, GST, Income Tax साठी आवश्यक DSC व हायपरसिक्युरिटी टोकन.",
    desc_en: "Class 3 Signing & Encryption DSC with USB Crypto Token for Tenders, GST & MCA.",
    timeline_mr: "३० मिनिटे (Instant eKYC)",
    timeline_en: "30 Minutes (Instant eKYC)",
    govt_fee: 1200.00,
    csc_fee: 300.00,
    total_fee: 1500.00,
    popular: true,
    documents: [
      { group: "आवश्यक कागदपत्रे", name_mr: "आधार कार्ड (मोबाईल लिंक असणे आवश्यक)", name_en: "Aadhaar Card (Mobile linked)", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "पॅन कार्ड (स्पष्ट प्रत)", name_en: "Original PAN Card copy", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "ईमेल आयडी व मोबाईल नंबर", name_en: "Active Email & Mobile Number", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "लाइव्ह व्हिडिओ व्हेरिफिकेशन (केंद्रावर प्रत्यक्ष)", name_en: "Live Video Verification at Center", required: true }
    ]
  },

  // 24. eMudra DSC कॉम्बो + USB हायपरसिक्युरिटी टोकन
  {
    id: "emudra-combo-token",
    category: "emudra",
    icon: "fa-solid fa-usb",
    title_mr: "eMudra DSC कॉम्बो + USB हायपरसिक्युरिटी टोकन",
    title_en: "eMudra Combo DSC (Sign + Encrypt) with USB Token",
    desc_mr: "शासकीय कंत्राटदार, ग्रामसेवक, मुख्याध्यापक, आर्किटेक्ट व कंपन्यांसाठी कम्प्लीट कॉम्बो किट.",
    desc_en: "Complete Signing + Encryption DSC Kit with FIPS certified USB Token.",
    timeline_mr: "१ तास",
    timeline_en: "1 Hour",
    govt_fee: 1600.00,
    csc_fee: 400.00,
    total_fee: 2000.00,
    popular: true,
    documents: [
      { group: "आवश्यक कागदपत्रे", name_mr: "आधार कार्ड व पॅन कार्ड", name_en: "Aadhaar & PAN Card", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "संस्था/कंपनी नोंदणी प्रमाणपत्र (लागू असल्यास)", name_en: "Company/Entity Reg Certificate (if Org DSC)", required: false },
      { group: "आवश्यक कागदपत्रे", name_mr: "अधिकृतता पत्र (Authorization Letter for Org)", name_en: "Authorization Letter (if applicable)", required: false }
    ]
  },

  // 25. पॅन कार्ड सेवा
  {
    id: "pan-new-correction",
    category: "emudra",
    icon: "fa-solid fa-address-card",
    title_mr: "पॅन कार्ड सेवा (नवीन / दुरुस्ती / हरवलेले पॅन)",
    title_en: "PAN Card Services (New / Correction / Duplicate)",
    desc_mr: "NSDL / UTI द्वारे नवीन पॅन कार्ड काढणे किंवा नाव, जन्मतारीख दुरुस्ती करणे.",
    desc_en: "New PAN Card registration, photo/signature update, address & DOB correction.",
    timeline_mr: "३ ते १० दिवस",
    timeline_en: "3 to 10 Days",
    govt_fee: 107.00,
    csc_fee: 93.00,
    total_fee: 200.00,
    popular: true,
    documents: [
      { group: "आवश्यक कागदपत्रे", name_mr: "आधार कार्ड (नाव व जन्मतारीख जुळणारे)", name_en: "Aadhaar Card", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "२ पासपोर्ट साईझ रंगीत फोटो", name_en: "2 Passport Size Color Photos", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "दुरुस्ती असल्यास जुने पॅन कार्ड झेरॉक्स", name_en: "Old PAN Card copy (for correction)", required: false }
    ]
  },

  // 26. आधार PVC स्मार्ट कार्ड व ॲड्रेस अपडेट
  {
    id: "aadhaar-pvc-update",
    category: "emudra",
    icon: "fa-solid fa-fingerprint",
    title_mr: "आधार PVC स्मार्ट कार्ड व ॲड्रेस अपडेट",
    title_en: "Aadhaar PVC Smart Card & Online Address Update",
    desc_mr: "UIDAI अधिकृत सुरक्षित QR कोड असलेले वॉटरप्रूफ PVC स्मार्ट कार्ड प्रिंट.",
    desc_en: "Official UIDAI Waterproof PVC Smart Card with Hologram and Microtext.",
    timeline_mr: "७ ते १० दिवस (होम डिलिव्हरी)",
    timeline_en: "7 to 10 Days (Home Delivery)",
    govt_fee: 50.00,
    csc_fee: 50.00,
    total_fee: 100.00,
    popular: true,
    documents: [
      { group: "आवश्यक कागदपत्रे", name_mr: "आधार नंबर किंवा व्हर्च्युअल आयडी (VID)", name_en: "Aadhaar Number / VID", required: true },
      { group: "आवश्यक कागदपत्रे", name_mr: "आधार लिंक मोबाईल नंबर (OTP पडताळणी)", name_en: "Registered Mobile Number for OTP", required: true }
    ]
  }
];

// Dynamic Services Engine (Loads default + custom added services from localStorage)
function loadCombinedServices() {
  try {
    const custom = JSON.parse(localStorage.getItem("emudra_csc_custom_services") || "[]");
    const deletedIds = JSON.parse(localStorage.getItem("emudra_csc_deleted_service_ids") || "[]");
    
    // Filter out deleted defaults
    const activeDefaults = DEFAULT_SERVICES_DATA.filter(s => !deletedIds.includes(s.id));
    
    // Merge custom added services at top + active defaults
    return [...custom, ...activeDefaults];
  } catch (e) {
    console.error("Error loading combined services:", e);
    return [...DEFAULT_SERVICES_DATA];
  }
}

// Global active services reference
let SERVICES_DATA = loadCombinedServices();

function reloadServicesData() {
  SERVICES_DATA = loadCombinedServices();
  return SERVICES_DATA;
}

function saveCustomService(service) {
  try {
    const custom = JSON.parse(localStorage.getItem("emudra_csc_custom_services") || "[]");
    const existingIndex = custom.findIndex(s => s.id === service.id);
    if (existingIndex >= 0) {
      custom[existingIndex] = service;
    } else {
      custom.unshift(service);
    }
    localStorage.setItem("emudra_csc_custom_services", JSON.stringify(custom));
    
    // If it was previously in deleted IDs list, remove it from deleted
    let deletedIds = JSON.parse(localStorage.getItem("emudra_csc_deleted_service_ids") || "[]");
    deletedIds = deletedIds.filter(id => id !== service.id);
    localStorage.setItem("emudra_csc_deleted_service_ids", JSON.stringify(deletedIds));

    reloadServicesData();
    return true;
  } catch (e) {
    console.error("Error saving custom service:", e);
    return false;
  }
}

function deleteServiceById(serviceId) {
  try {
    let custom = JSON.parse(localStorage.getItem("emudra_csc_custom_services") || "[]");
    custom = custom.filter(s => s.id !== serviceId);
    localStorage.setItem("emudra_csc_custom_services", JSON.stringify(custom));

    // If it was a default service, mark it deleted
    let deletedIds = JSON.parse(localStorage.getItem("emudra_csc_deleted_service_ids") || "[]");
    if (!deletedIds.includes(serviceId)) {
      deletedIds.push(serviceId);
      localStorage.setItem("emudra_csc_deleted_service_ids", JSON.stringify(deletedIds));
    }

    reloadServicesData();
    return true;
  } catch (e) {
    console.error("Error deleting service:", e);
    return false;
  }
}

function resetServicesToDefault() {
  try {
    localStorage.removeItem("emudra_csc_custom_services");
    localStorage.removeItem("emudra_csc_deleted_service_ids");
    reloadServicesData();
    return true;
  } catch (e) {
    console.error("Error resetting services:", e);
    return false;
  }
}

// Officer & Center Info (कणकवली केंद्र माहिती)
const CENTER_INFO = {
  centerName_mr: "ई-मुद्रा सीएससी व आपले सरकार सेवा केंद्र",
  centerName_en: "eMudra CSC & Aaple Sarkar Seva Kendra",
  subDivision_mr: "उपविभागीय अधिकारी कार्यालय परिक्षेत्र • कणकवली (सिंधुदुर्ग)",
  subDivision_en: "Sub-Divisional Officer Jurisdiction Area • Kankavli (Sindhudurg)",
  cscId: "152153410016",
  vleName_mr: "अधिकृत संचालक • आपले सरकार सेवा केंद्र",
  vleName_en: "Authorized VLE Operator • Aaple Sarkar Center",
  officerDesignation_mr: "उपविभागीय दंडाधिकारी व सेतू सुविधा साहाय्यक कक्ष",
  officerDesignation_en: "Sub-Divisional Magistrate & Setu Suvidha Desk",
  phone: "+91 98908 69793",
  whatsapp: "919890869793",
  tollFree: "1800 120 8040",
  email: "helpdesk@emudracsc.in",
  address_mr: "घर नं. ४६५, तिवरे, धनाचीवाडी, तालुका - कणकवली, जि. सिंधुदुर्ग, महाराष्ट्र - ४१६६०१",
  address_en: "House No 465, Tiware, Dhanachiwadi, Taluka-Kankavli, Dist-Sindhudurg, Maharashtra, Pin-416601",
  timing_mr: "सोमवार ते शनिवार: सकाळी ०९:०० ते संध्याकाळी ०८:०० (रविवार: सकाळी १०:०० ते दुपारी ०२:००)",
  timing_en: "Monday to Saturday: 09:00 AM to 08:00 PM (Sunday: 10:00 AM to 02:00 PM)"
};

// Official HTML Pages, Forms & Useful Document Tools
const DEFAULT_IMPORTANT_LINKS = [
  {
    id: "link-pratigya",
    category: "अधिकृत शासकीय टूल्स व दाखले",
    icon: "fa-solid fa-ticket-simple",
    title_mr: "🎟️ प्रतिज्ञा पत्र टोकन जनरेटर",
    title_en: "Pratigya Patra Token Generator",
    desc_mr: "प्रतिज्ञा पत्र गोल टोकन्स (A4 वर २० टोकन्स) त्वरित जनरेट व प्रिंट करा.",
    desc_en: "Printable Round Tokens generator with custom date & range.",
    url: "pratigya-patra.html",
    isInternal: true
  },
  {
    id: "link-income-certificate",
    category: "अधिकृत शासकीय टूल्स व दाखले",
    icon: "fa-solid fa-file-invoice-dollar",
    title_mr: "💰 उत्पन्नाचा दाखला फॉर्म फिलर (Income Certificate)",
    title_en: "Income Certificate Form Filler & PDF Generator",
    desc_mr: "१ किंवा ३ वर्षांचे उत्पन्नाचे स्वयंघोषणापत्र व अर्ज भरा, फोटो जोडा व थेट A4 PDF / प्रिंट करा.",
    desc_en: "1-Year & 3-Year Income Certificate self-declaration filler with instant A4 PDF print.",
    url: "income-certificate.html",
    isInternal: true
  },
  {
    id: "link-affidavit",
    category: "अधिकृत शासकीय टूल्स व दाखले",
    icon: "fa-solid fa-gem",
    title_mr: "💎 संमतीपत्र Affidivate Print",
    title_en: "Consent Deed & Affidavit Print Studio",
    desc_mr: "व्यक्तीचे नाव, फोटो क्रॉप, कॅमेरा कॅप्चर व A4 संमतीपत्र प्रिंट स्टुडिओ.",
    desc_en: "Print Studio Pro with Camera, Cropper, Photo Slider & A4 Print.",
    url: "affidavit-print.html",
    isInternal: true
  },
  {
    id: "link-pikpera",
    category: "शेतकरी व महसूल योजना",
    icon: "fa-solid fa-wheat-awn",
    title_mr: "🌾 पीकपेरा खरीप (Pikpera)",
    title_en: "Pikpera Self-Declaration Form",
    desc_mr: "खरीप हंगाम पीक पेरा नोंदणी व स्वयंघोषणापत्र थेट तयार व A4 प्रिंट करा.",
    desc_en: "Kharif crop declaration certificate with 1-click A4 print.",
    url: "Pikpera.html",
    isInternal: true
  },
  {
    id: "link-mahabocw-self",
    category: "कामगार कल्याण योजना (BOCW)",
    icon: "fa-solid fa-file-contract",
    title_mr: "📄 बांधकाम कामगार संमत्तीपत्र (MahaBOCW)",
    title_en: "MahaBOCW Self-Declaration Form",
    desc_mr: "बांधकाम कामगार अधिकृत स्वघोषणापत्र ऑनलाइन फॉर्म व A4 प्रिंट.",
    desc_en: "Construction worker self-declaration form with direct print.",
    url: "mahabocw.html",
    isInternal: true
  },
  {
    id: "link-gramsevak-90",
    category: "कामगार कल्याण योजना (BOCW)",
    icon: "fa-solid fa-person-digging",
    title_mr: "⛏️ बांधकाम कामगार ९० दिवस प्रमाणपत्र (ग्रामसेवक)",
    title_en: "Construction Worker 90-Day Certificate (Gramsevak)",
    desc_mr: "ग्रामसेवक / मनरेगा ९० दिवस काम केल्याचे अधिकृत प्रमाणपत्र जनरेटर व प्रिंट.",
    desc_en: "Official 90-day construction labor certificate generator.",
    url: "gramsevak90.html",
    isInternal: true
  },
  {
    id: "link-mahabocw-gram",
    category: "कामगार कल्याण योजना (BOCW)",
    icon: "fa-solid fa-helmet-safety",
    title_mr: "👷 MahaBOCW कामगार ९० दिवस प्रमाणपत्र",
    title_en: "MahaBOCW 90-Day Labor Certificate",
    desc_mr: "महाराष्ट्र इमारत व इतर बांधकाम कामगार ९० दिवस प्रमाणपत्र जनरेटर.",
    desc_en: "Maharashtra BOCW board 90-day work proof certificate.",
    url: "mahabocwgramsevak.html",
    isInternal: true
  },
  {
    id: "link-main-setu-server",
    category: "सेतू व शासकीय सर्व्हर",
    icon: "fa-solid fa-server",
    title_mr: "🖥️ मेन सेतू सर्व्हर (Main Setu Server)",
    title_en: "Main Setu Server Web App",
    desc_mr: "अधिकृत मुख्य सेतू सर्व्हर वेब ॲप्लिकेशन लिंक.",
    desc_en: "Official Main Setu Server Web Application Portal.",
    url: "https://script.google.com/macros/s/AKfycbxB1OZRgrwFzv626rfAH_5pRHyZ6n5t8fTZe7jId6dQUv-66ckJ1ewKvUAfa9GGH3yd/exec",
    isInternal: false
  },
  {
    id: "link-old-server",
    category: "सेतू व शासकीय सर्व्हर",
    icon: "fa-solid fa-database",
    title_mr: "🗄️ ओल्ड सर्व्हर लिंक (Old Server)",
    title_en: "Old Setu Server Portal",
    desc_mr: "मागील रेकॉर्ड्स व संदर्भासाठी ओल्ड सर्व्हर वेब ॲप्लिकेशन लिंक.",
    desc_en: "Setu Old Server Web Application Portal for previous records.",
    url: "https://script.google.com/macros/s/AKfycbzuX5jHIVLw5uHThJ3vGmZvPV7rldexEtgx1XsQGdNO-_l2w1cxTG9sK1FlkdLrm9Ma/exec",
    isInternal: false
  },
  {
    id: "link-aero",
    category: "निवडणूक व मतदार सेवा",
    icon: "fa-solid fa-check-to-slot",
    title_mr: "🗳️ AERO REPORT (Voter Digitization)",
    title_en: "Voter Digitization Report - AERO Sync",
    desc_mr: "मतदार डिजिटायझेशन रिपोर्ट, एक्सेल शीट आयात व डेटा रिपोर्ट मॅनेजर.",
    desc_en: "Voter digitization Excel import & analytics reporting engine.",
    url: "aero.html",
    isInternal: true
  },
  {
    id: "link-aadhaar-certificate",
    category: "आधार व UIDAI सेवा",
    icon: "fa-solid fa-id-card",
    title_mr: "🆔 आधार पत्ता प्रमाणपत्र (Aadhaar Certificate Filler)",
    title_en: "UIDAI Aadhaar Enrolment / Address Certificate Form Filler",
    desc_mr: "अधिकृत UIDAI फॉरमॅटमध्ये कॅपिटल बॉक्ससह पत्ता प्रमाणपत्र फॉर्म भरा व थेट A4 प्रिंट करा.",
    desc_en: "Official UIDAI Certificate for Enrolment / Update with Capital Box Auto-Fill & A4 Print.",
    url: "aadhaar-certificate.html",
    isInternal: true
  },
  {
    id: "link-myaadhaar",
    category: "आधार व UIDAI सेवा",
    icon: "fa-solid fa-globe",
    title_mr: "🌐 myAadhaar अधिकृत पोर्टल (UIDAI Portal)",
    title_en: "Official myAadhaar Portal - UIDAI",
    desc_mr: "आधार डाउनलोड, पीव्हीसी कार्ड ऑर्डर, पत्ता अपडेट आणि बायोमेट्रिक लॉक/अनलॉक अधिकृत पोर्टल.",
    desc_en: "Download Aadhaar, Order PVC Card, Address Update & Online Services.",
    url: "https://myaadhaar.uidai.gov.in/",
    isInternal: false
  },
  {
    id: "link-aadhaar-status",
    category: "आधार व UIDAI सेवा",
    icon: "fa-solid fa-magnifying-glass-location",
    title_mr: "🔍 आधार अपडेट/नोंदणी स्थिती तपासा (Check Status)",
    title_en: "Check Aadhaar Enrolment / Update Status",
    desc_mr: "SRN / URN किंवा एनरोलमेंट आयडी (EID) टाकून आधार अपडेटची सद्यस्थिती तपासा.",
    desc_en: "Check current status of Aadhaar enrolment or address update request.",
    url: "https://myaadhaar.uidai.gov.in/CheckAadhaarStatus",
    isInternal: false
  },
  {
    id: "link-aadhaar-bank-seeding",
    category: "आधार व UIDAI सेवा",
    icon: "fa-solid fa-building-columns",
    title_mr: "🏦 आधार बँक खात्याशी लिंकिंग स्थिती (Bank Seeding)",
    title_en: "Check Aadhaar Bank Account Seeding Status",
    desc_mr: "शासकीय योजना, लाडकी बहीण, PM किसान व DBT लाभासाठी बँक लिंकिंग तपासा.",
    desc_en: "Check NPCI & Aadhaar Bank account seeding status for DBT benefits.",
    url: "https://myaadhaar.uidai.gov.in/bank-seeding-status",
    isInternal: false
  }
];

const LINKS_STORAGE_KEY = "emudra_csc_custom_links";

function loadCombinedLinks() {
  try {
    const raw = localStorage.getItem(LINKS_STORAGE_KEY);
    if (!raw) return [...DEFAULT_IMPORTANT_LINKS];
    const customList = JSON.parse(raw);
    if (!Array.isArray(customList)) return [...DEFAULT_IMPORTANT_LINKS];

    const defaults = [...DEFAULT_IMPORTANT_LINKS];
    const merged = [...defaults];

    customList.forEach(custom => {
      const idx = merged.findIndex(l => l.id === custom.id);
      if (idx >= 0) {
        merged[idx] = custom;
      } else {
        merged.push(custom);
      }
    });

    return merged;
  } catch (err) {
    console.error("Error loading links from storage:", err);
    return [...DEFAULT_IMPORTANT_LINKS];
  }
}

let IMPORTANT_LINKS = loadCombinedLinks();

function saveCustomLink(linkObj) {
  try {
    const raw = localStorage.getItem(LINKS_STORAGE_KEY);
    let customList = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(customList)) customList = [];

    if (!linkObj.id) {
      linkObj.id = "custom_link_" + Date.now();
      linkObj.isCustom = true;
    }

    const idx = customList.findIndex(l => l.id === linkObj.id);
    if (idx >= 0) {
      customList[idx] = linkObj;
    } else {
      customList.push(linkObj);
    }

    localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(customList));
    reloadLinksData();
    return linkObj;
  } catch (err) {
    console.error("Error saving link:", err);
    return null;
  }
}

function deleteLinkById(linkId) {
  try {
    const raw = localStorage.getItem(LINKS_STORAGE_KEY);
    let customList = raw ? JSON.parse(raw) : [];
    if (Array.isArray(customList)) {
      customList = customList.filter(l => l.id !== linkId);
      localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(customList));
    }
    IMPORTANT_LINKS = IMPORTANT_LINKS.filter(l => l.id !== linkId);
    reloadLinksData();
    return true;
  } catch (err) {
    console.error("Error deleting link:", err);
    return false;
  }
}

function resetLinksToDefault() {
  localStorage.removeItem(LINKS_STORAGE_KEY);
  reloadLinksData();
}

function reloadLinksData() {
  IMPORTANT_LINKS = loadCombinedLinks();
}

// ==========================================================================
// Useful Softwares & Setup Files Data Model (Admin Managed)
// ==========================================================================
const DEFAULT_SOFTWARES_DATA = [
  {
    id: "soft-morpho-rd",
    name_mr: "Morpho MSO 1300 E2/E3 RD Service (All-in-One)",
    name_en: "Morpho MSO 1300 RD Service Driver",
    category: "biometric",
    category_mr: "बायोमेट्रिक ड्रायव्हर",
    category_en: "Biometric Driver",
    version: "v2.0.1.47",
    size: "24.5 MB",
    icon: "fa-solid fa-fingerprint",
    os: "Windows 10 / 11 (32/64 bit)",
    downloadUrl: "https://rdserviceonline.com/",
    desc_mr: "आपले सरकार, महा-ई-सेवा, eKYC व PM किसान बायोमेट्रिक प्रमाणीकरणासाठी अधिकृत मॉर्फो सेटअप ड्रायव्हर.",
    desc_en: "Official Morpho driver for Aadhaar authentication, Aaple Sarkar, MahaOnline and PM Kisan eKYC.",
    isDefault: true
  },
  {
    id: "soft-mantra-rd",
    name_mr: "Mantra MFS100 RD Service & Driver Setup",
    name_en: "Mantra MFS100 RD Service Setup",
    category: "biometric",
    category_mr: "बायोमेट्रिक ड्रायव्हर",
    category_en: "Biometric Driver",
    version: "v1.0.8",
    size: "18.2 MB",
    icon: "fa-solid fa-hand-point-up",
    os: "Windows 7 / 8 / 10 / 11",
    downloadUrl: "https://download.mantratecapp.com/",
    desc_mr: "मंत्रा MFS100 फिंगरप्रिंट स्कॅनरसाठी संपूर्ण RD सर्विस, ड्रायव्हर व क्लायंट टूल पॅकेज.",
    desc_en: "Complete RD service and driver setup for Mantra MFS100 scanner on government portals.",
    isDefault: true
  },
  {
    id: "soft-emudra-dsc",
    name_mr: "eMudra / ePass2003 Auto DSC Token Driver",
    name_en: "ePass2003 & WatchData DSC Token Driver",
    category: "dsc",
    category_mr: "डिजिटल सिग्नेचर (DSC)",
    category_en: "Digital Signature (DSC)",
    version: "v4.0.2",
    size: "12.8 MB",
    icon: "fa-solid fa-signature",
    os: "Windows 10 / 11 (64-bit)",
    downloadUrl: "https://www.emudhra.com/download-repository",
    desc_mr: "Class 3 डिजिटल सिग्नेचर USB टोकन ओळखण्यासाठी व महा-टेंडरवर स्वाक्षरीसाठी आवश्यक ड्रायव्हर.",
    desc_en: "Official driver software for eMudra Class 3 USB Crypto Token and e-Tendering portals.",
    isDefault: true
  },
  {
    id: "soft-java-jre",
    name_mr: "Java JRE 8 (32-bit & 64-bit) for MahaOnline",
    name_en: "Java JRE 8 for MahaOnline & Land Records",
    category: "system",
    category_mr: "सिस्टीम सॉफ्टवेअर",
    category_en: "System Software",
    version: "8u381",
    size: "78.4 MB",
    icon: "fa-brands fa-java",
    os: "Windows 10 / 11",
    downloadUrl: "https://www.java.com/en/download/",
    desc_mr: "आपले सरकार पोर्टलवर ७/१२ डिजिटल स्वाक्षरी व महसूल दाखले प्रिंटिंग सुरळीत चालण्यासाठी जावा रनटाइम.",
    desc_en: "Essential Java runtime environment for digital signing of 7/12 extracts on MahaOnline.",
    isDefault: true
  },
  {
    id: "soft-anydesk",
    name_mr: "AnyDesk Remote Desktop Support Tool",
    name_en: "AnyDesk Remote Support Utility",
    category: "utility",
    category_mr: "उपयुक्त टूल",
    category_en: "Utility Tool",
    version: "v8.0.8",
    size: "4.8 MB",
    icon: "fa-solid fa-display",
    os: "Windows / Mac / Linux",
    downloadUrl: "https://anydesk.com/en/downloads/windows",
    desc_mr: "तांत्रिक अडचणीच्या वेळी केंद्राला तात्काळ ऑनलाइन रिमोट साहाय्य देण्यासाठी हलके सॉफ्टवेअर.",
    desc_en: "Fast remote desktop tool for instant technical help and remote support.",
    isDefault: true
  },
  {
    id: "soft-pdf-compressor",
    name_mr: "CSC PDF & Image Batch Compressor",
    name_en: "CSC PDF & Image Compressor Tool",
    category: "utility",
    category_mr: "उपयुक्त टूल",
    category_en: "Utility Tool",
    version: "v2.4",
    size: "15.0 MB",
    icon: "fa-solid fa-file-zipper",
    os: "Windows 10 / 11",
    downloadUrl: "https://www.ilovepdf.com/desktop",
    desc_mr: "सर्व शासकीय अर्जांसाठी कागदपत्रे व फोटो १०० ते ५०० KB मध्ये कॉम्प्रेस व मर्ज करण्याचे टूल.",
    desc_en: "Offline PDF and image optimization tool to compress documents under required limits.",
    isDefault: true
  }
];

const SOFTWARES_STORAGE_KEY = "emudra_csc_custom_softwares";

function loadCombinedSoftwares() {
  try {
    const raw = localStorage.getItem(SOFTWARES_STORAGE_KEY);
    if (!raw) return [...DEFAULT_SOFTWARES_DATA];
    const customList = JSON.parse(raw);
    if (!Array.isArray(customList)) return [...DEFAULT_SOFTWARES_DATA];

    const defaults = [...DEFAULT_SOFTWARES_DATA];
    const merged = [...defaults];

    customList.forEach(custom => {
      const idx = merged.findIndex(s => s.id === custom.id);
      if (idx >= 0) {
        merged[idx] = custom;
      } else {
        merged.push(custom);
      }
    });

    return merged;
  } catch (err) {
    console.error("Error loading softwares from storage:", err);
    return [...DEFAULT_SOFTWARES_DATA];
  }
}

let SOFTWARES_DATA = loadCombinedSoftwares();

function saveCustomSoftware(softObj) {
  try {
    const raw = localStorage.getItem(SOFTWARES_STORAGE_KEY);
    let customList = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(customList)) customList = [];

    if (!softObj.id) {
      softObj.id = "custom_soft_" + Date.now();
      softObj.isCustom = true;
    }

    const idx = customList.findIndex(s => s.id === softObj.id);
    if (idx >= 0) {
      customList[idx] = softObj;
    } else {
      customList.push(softObj);
    }

    localStorage.setItem(SOFTWARES_STORAGE_KEY, JSON.stringify(customList));
    reloadSoftwaresData();
    return softObj;
  } catch (err) {
    console.error("Error saving software:", err);
    return null;
  }
}

function deleteSoftwareById(softId) {
  try {
    const raw = localStorage.getItem(SOFTWARES_STORAGE_KEY);
    let customList = raw ? JSON.parse(raw) : [];
    if (Array.isArray(customList)) {
      customList = customList.filter(s => s.id !== softId);
      localStorage.setItem(SOFTWARES_STORAGE_KEY, JSON.stringify(customList));
    }
    // Also if default, we mark it hidden or filter
    SOFTWARES_DATA = SOFTWARES_DATA.filter(s => s.id !== softId);
    reloadSoftwaresData();
    return true;
  } catch (err) {
    console.error("Error deleting software:", err);
    return false;
  }
}

function resetSoftwaresToDefault() {
  localStorage.removeItem(SOFTWARES_STORAGE_KEY);
  reloadSoftwaresData();
}

function reloadSoftwaresData() {
  SOFTWARES_DATA = loadCombinedSoftwares();
}
