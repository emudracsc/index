/**
 * Supabase Database Integration - eMudra CSC Portal
 */

const SUPABASE_URL  = "https://vaaaqvwenxjrroroitlh.supabase.co";
const SUPABASE_ANON = "sb_publishable_PIdPgy6voOiw70vk_YVQ4g_egoPLq0T";

async function sbFetch(table, options) {
  options = options || {};
  var method   = options.method   || "GET";
  var filter   = options.filter   || "";
  var body     = options.body     || null;
  var upsert   = options.upsert   || false;

  var queryParts = [];
  if (filter) queryParts.push(filter);
  if (upsert) {
    if (table === "applications" && !filter.includes("on_conflict")) {
      queryParts.push("on_conflict=app_id");
    } else if (!filter.includes("on_conflict")) {
      queryParts.push("on_conflict=id");
    }
  }

  var queryString = queryParts.length > 0 ? "?" + queryParts.join("&") : "";
  var url = SUPABASE_URL + "/rest/v1/" + table + queryString;
  var headers = {
    "apikey":        SUPABASE_ANON,
    "Authorization": "Bearer " + SUPABASE_ANON,
    "Content-Type":  "application/json",
    "Prefer":        upsert ? "resolution=merge-duplicates,return=representation" : "return=representation"
  };

  try {
    var res = await fetch(url, {
      method:  method,
      headers: headers,
      body:    body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      var err = await res.text();
      console.error("Supabase " + method + " " + table + " error:", err);
      return null;
    }
    var text = await res.text();
    return text ? JSON.parse(text) : [];
  } catch (e) {
    console.error("Supabase fetch failed:", e);
    return null;
  }
}

var DB = {

  saveApplication: async function(appData) {
    var row = {
      app_id:       appData.appId        || "",
      service_id:   appData.serviceId    || "",
      service_name: appData.serviceName  || "",
      full_name:    appData.fullName      || "",
      mobile:       appData.mobile        || "",
      aadhaar:      appData.aadhaar       || "",
      email:        appData.email         || "",
      address:      appData.address       || "",
      purpose:      appData.purpose       || "",
      docs:         appData.docs          || [],
      status:       "pending"
    };
    var result = await sbFetch("applications", { method: "POST", body: row, upsert: true });
    var existing = JSON.parse(localStorage.getItem("emudra_csc_applications") || "[]");
    var idx = existing.findIndex(function(a) { return a.appId === appData.appId; });
    if (idx >= 0) existing[idx] = appData; else existing.push(appData);
    localStorage.setItem("emudra_csc_applications", JSON.stringify(existing));
    return result !== null;
  },

  loadApplications: async function() {
    var rows = await sbFetch("applications", { filter: "order=submitted_at.desc" });
    if (!rows || rows.length === 0) {
      var cscApps = JSON.parse(localStorage.getItem("emudra_csc_applications") || "[]");
      var formApps = JSON.parse(localStorage.getItem("emudra_form_history") || "[]");
      formApps.forEach(function(f) {
        var found = cscApps.some(function(c) { return (c.appId || c.id) === f.appId; });
        if (!found) {
          cscApps.push({
            appId: f.appId,
            id: f.appId,
            serviceId: f.formType,
            serviceName: f.formTitle,
            fullName: f.applicantName,
            applicantName: f.applicantName,
            mobile: f.mobile,
            aadhaar: f.aadhaar,
            email: f.email || "",
            address: f.address || "",
            purpose: f.purpose || "",
            docs: f.formData || {},
            status: f.status || "printed",
            submittedAt: f.timestamp || new Date().toISOString(),
            date: f.timestamp ? f.timestamp.split("T")[0] : new Date().toISOString().split("T")[0],
            isFormHistory: true
          });
        }
      });
      return cscApps;
    }
    return rows.map(function(r) {
      return {
        appId:       r.app_id,
        id:          r.app_id,
        serviceId:   r.service_id,
        serviceName: r.service_name,
        fullName:    r.full_name,
        applicantName: r.full_name,
        mobile:      r.mobile,
        aadhaar:     r.aadhaar,
        email:       r.email,
        address:     r.address,
        purpose:     r.purpose,
        docs:        r.docs || [],
        status:      r.status,
        submittedAt: r.submitted_at,
        date:        r.submitted_at ? r.submitted_at.split("T")[0] : new Date().toISOString().split("T")[0]
      };
    });
  },

  updateApplicationStatus: async function(appId, status) {
    await sbFetch("applications", {
      method: "PATCH",
      filter: "app_id=eq." + appId,
      body:   { status: status, updated_at: new Date().toISOString() }
    });
    var existing = JSON.parse(localStorage.getItem("emudra_csc_applications") || "[]");
    var idx = existing.findIndex(function(a) { return a.appId === appId; });
    if (idx >= 0) existing[idx].status = status;
    localStorage.setItem("emudra_csc_applications", JSON.stringify(existing));
  },

  deleteApplication: async function(appId) {
    await sbFetch("applications", { method: "DELETE", filter: "app_id=eq." + appId });
    var existing = JSON.parse(localStorage.getItem("emudra_csc_applications") || "[]");
    localStorage.setItem("emudra_csc_applications",
      JSON.stringify(existing.filter(function(a) { return a.appId !== appId; })));
  },

  saveTokenBooking: async function(booking) {
    var row = {
      token_id:     booking.tokenId      || "",
      service:      booking.service      || "",
      full_name:    booking.fullName     || "",
      mobile:       booking.mobile       || "",
      booking_date: booking.bookingDate  || "",
      time_slot:    booking.timeSlot     || "",
      notes:        booking.notes        || "",
      status:       "confirmed"
    };
    var result = await sbFetch("token_bookings", { method: "POST", body: row, upsert: true });
    var existing = JSON.parse(localStorage.getItem("emudra_csc_tokens") || "[]");
    existing.push(booking);
    localStorage.setItem("emudra_csc_tokens", JSON.stringify(existing));
    return result !== null;
  },

  loadTokenBookings: async function() {
    var rows = await sbFetch("token_bookings", { filter: "order=created_at.desc" });
    if (!rows || rows.length === 0) {
      return JSON.parse(localStorage.getItem("emudra_csc_tokens") || "[]");
    }
    return rows.map(function(r) {
      return {
        tokenId:     r.token_id,
        service:     r.service,
        fullName:    r.full_name,
        mobile:      r.mobile,
        bookingDate: r.booking_date,
        timeSlot:    r.time_slot,
        notes:       r.notes,
        status:      r.status,
        createdAt:   r.created_at
      };
    });
  },

  deleteTokenBooking: async function(tokenId) {
    await sbFetch("token_bookings", { method: "DELETE", filter: "token_id=eq." + tokenId });
    var existing = JSON.parse(localStorage.getItem("emudra_csc_tokens") || "[]");
    localStorage.setItem("emudra_csc_tokens",
      JSON.stringify(existing.filter(function(t) { return t.tokenId !== tokenId; })));
  },

  saveSoftware: async function(soft) {
    var row = {
      id:                soft.id,
      name_mr:           soft.name_mr           || "",
      name_en:           soft.name_en           || "",
      category:          soft.category          || "",
      category_mr:       soft.category_mr       || "",
      version:           soft.version           || "",
      size:              soft.size              || "",
      icon:              soft.icon              || "fa-solid fa-box-archive",
      os:                soft.os                || "Windows",
      download_url:      soft.downloadUrl       || "",
      file_name:         soft.fileName          || "",
      original_filename: soft.originalFilename  || "",
      format:            soft.format            || "exe",
      desc_mr:           soft.desc_mr           || "",
      desc_en:           soft.desc_en           || "",
      is_custom:         true
    };
    await sbFetch("custom_softwares", { method: "POST", body: row, upsert: true });
    if (typeof saveCustomSoftware === "function") saveCustomSoftware(soft);
  },

  loadCustomSoftwares: async function() {
    var rows = await sbFetch("custom_softwares");
    if (!rows) return [];
    return rows.map(function(r) {
      return {
        id: r.id, name_mr: r.name_mr, name_en: r.name_en,
        category: r.category, category_mr: r.category_mr,
        version: r.version, size: r.size, icon: r.icon, os: r.os,
        downloadUrl: r.download_url, fileName: r.file_name,
        originalFilename: r.original_filename, format: r.format,
        desc_mr: r.desc_mr, desc_en: r.desc_en, isCustom: true
      };
    });
  },

  deleteSoftware: async function(id) {
    await sbFetch("custom_softwares", { method: "DELETE", filter: "id=eq." + id });
    if (typeof deleteSoftwareById === "function") deleteSoftwareById(id);
  },

  saveLink: async function(link) {
    var row = {
      id:          link.id,
      title_mr:    link.title_mr  || "",
      title_en:    link.title_en  || "",
      desc_mr:     link.desc_mr   || "",
      desc_en:     link.desc_en   || "",
      url:         link.url       || "",
      icon:        link.icon      || "fa-solid fa-link",
      category:    link.category  || "शासकीय सेवा",
      is_internal: !!link.isInternal,
      is_custom:   true
    };
    await sbFetch("custom_links", { method: "POST", body: row, upsert: true });
    if (typeof saveCustomLink === "function") saveCustomLink(link);
  },

  loadCustomLinks: async function() {
    var rows = await sbFetch("custom_links");
    if (!rows) return [];
    return rows.map(function(r) {
      return {
        id: r.id, title_mr: r.title_mr, title_en: r.title_en,
        desc_mr: r.desc_mr, desc_en: r.desc_en,
        url: r.url, icon: r.icon, category: r.category,
        isInternal: r.is_internal, isCustom: true
      };
    });
  },

  deleteLink: async function(id) {
    await sbFetch("custom_links", { method: "DELETE", filter: "id=eq." + id });
    if (typeof deleteLinkById === "function") deleteLinkById(id);
  },

  // 📑 Save Form Applications History (Aadhaar, Income, Varas Ferfar, etc.)
  saveFormHistory: async function(formRecord) {
    if (!formRecord.appId) {
      formRecord.appId = (formRecord.prefix || "APP") + "-" + Date.now().toString().slice(-6);
    }
    if (!formRecord.timestamp) {
      formRecord.timestamp = new Date().toISOString();
    }
    if (!formRecord.dateFormatted) {
      formRecord.dateFormatted = new Date().toLocaleString("mr-IN");
    }

    // 1. Sync to LocalStorage (emudra_form_history)
    var storageKey = "emudra_form_history";
    var localList = JSON.parse(localStorage.getItem(storageKey) || "[]");
    var existingIndex = localList.findIndex(function(item) { return item.appId === formRecord.appId; });
    if (existingIndex >= 0) {
      localList[existingIndex] = formRecord;
    } else {
      localList.unshift(formRecord);
    }
    localStorage.setItem(storageKey, JSON.stringify(localList));

    // Also sync into emudra_csc_applications so both admin views see it immediately!
    var cscList = JSON.parse(localStorage.getItem("emudra_csc_applications") || "[]");
    var cscIdx = cscList.findIndex(function(item) { return (item.appId || item.id) === formRecord.appId; });
    var cscRecord = {
      appId: formRecord.appId,
      id: formRecord.appId,
      serviceId: formRecord.formType || "form_fill",
      serviceName: formRecord.formTitle || "ऑनलाइन फॉर्म",
      serviceName_mr: formRecord.formTitle || "ऑनलाइन फॉर्म",
      serviceName_en: formRecord.formTitle || "Online Form",
      fullName: formRecord.applicantName || "",
      applicantName: formRecord.applicantName || "",
      mobile: formRecord.mobile || "",
      aadhaar: formRecord.aadhaar || "",
      email: formRecord.email || "",
      address: formRecord.address || "",
      purpose: formRecord.purpose || "",
      date: formRecord.timestamp ? formRecord.timestamp.split("T")[0] : new Date().toISOString().split("T")[0],
      submittedAt: formRecord.timestamp || new Date().toISOString(),
      docs: formRecord.formData || {},
      status: formRecord.status || "printed",
      status_mr: "प्रिंट / सेव्ह",
      status_en: "Saved / Printed",
      isFormHistory: true
    };
    if (cscIdx >= 0) {
      cscList[cscIdx] = cscRecord;
    } else {
      cscList.unshift(cscRecord);
    }
    localStorage.setItem("emudra_csc_applications", JSON.stringify(cscList));

    // 2. Try Supabase cloud sync with on_conflict
    try {
      var row = {
        app_id: formRecord.appId,
        service_id: formRecord.formType || "form_fill",
        service_name: formRecord.formTitle || "ऑनलाइन फॉर्म",
        full_name: formRecord.applicantName || "",
        mobile: formRecord.mobile || "",
        aadhaar: formRecord.aadhaar || "",
        email: formRecord.email || "",
        address: formRecord.address || "",
        purpose: formRecord.purpose || "",
        docs: formRecord.formData || {}, // Store filled inputs as JSON
        status: formRecord.status || "printed"
      };
      await sbFetch("applications", { method: "POST", body: row, upsert: true, filter: "on_conflict=app_id" });
    } catch (err) {
      console.warn("Supabase cloud sync failed, saved in local history:", err);
    }

    return formRecord;
  },

  getFormHistory: async function() {
    var storageKey = "emudra_form_history";
    var localList = JSON.parse(localStorage.getItem(storageKey) || "[]");

    try {
      var rows = await sbFetch("applications", { filter: "order=submitted_at.desc" });
      if (rows && rows.length > 0) {
        rows.forEach(function(r) {
          var existsIdx = localList.findIndex(function(l) { return l.appId === r.app_id; });
          var item = {
            appId: r.app_id,
            formType: r.service_id,
            formTitle: r.service_name,
            applicantName: r.full_name,
            mobile: r.mobile,
            aadhaar: r.aadhaar,
            email: r.email,
            address: r.address,
            purpose: r.purpose,
            formData: r.docs || {},
            timestamp: r.submitted_at,
            dateFormatted: new Date(r.submitted_at).toLocaleString("mr-IN"),
            status: r.status
          };
          if (existsIdx >= 0) {
            localList[existsIdx] = item;
          } else {
            localList.push(item);
          }
        });
        localStorage.setItem(storageKey, JSON.stringify(localList));
      }
    } catch (e) {
      console.warn("Could not fetch remote form history, using local:", e);
    }

    localList.sort(function(a, b) {
      var tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      var tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tB - tA;
    });

    return localList;
  },

  getFormById: async function(appId) {
    var storageKey = "emudra_form_history";
    var localList = JSON.parse(localStorage.getItem(storageKey) || "[]");
    var found = localList.find(function(item) { return item.appId === appId; });
    if (found) return found;

    try {
      var rows = await sbFetch("applications", { filter: "app_id=eq." + appId });
      if (rows && rows.length > 0) {
        var r = rows[0];
        return {
          appId: r.app_id,
          formType: r.service_id,
          formTitle: r.service_name,
          applicantName: r.full_name,
          mobile: r.mobile,
          aadhaar: r.aadhaar,
          email: r.email,
          address: r.address,
          purpose: r.purpose,
          formData: r.docs || {},
          timestamp: r.submitted_at,
          dateFormatted: new Date(r.submitted_at).toLocaleString("mr-IN"),
          status: r.status
        };
      }
    } catch (e) {
      console.warn("Error fetching form by id:", e);
    }
    return null;
  },

  deleteFormRecord: async function(appId) {
    var storageKey = "emudra_form_history";
    var localList = JSON.parse(localStorage.getItem(storageKey) || "[]");
    localList = localList.filter(function(item) { return item.appId !== appId; });
    localStorage.setItem(storageKey, JSON.stringify(localList));

    try {
      await sbFetch("applications", { method: "DELETE", filter: "app_id=eq." + appId });
    } catch (e) {
      console.warn("Error deleting form record from cloud:", e);
    }
    return true;
  }
};

async function syncSupabaseToLocal() {
  try {
    var dbSofts = await DB.loadCustomSoftwares();
    if (dbSofts.length > 0) {
      var softStore = JSON.parse(localStorage.getItem("emudra_csc_softwares") || "[]");
      dbSofts.forEach(function(s) {
        var idx = softStore.findIndex(function(e) { return e.id === s.id; });
        if (idx >= 0) softStore[idx] = s; else softStore.push(s);
      });
      localStorage.setItem("emudra_csc_softwares", JSON.stringify(softStore));
      if (typeof reloadSoftwaresData === "function") reloadSoftwaresData();
    }

    var dbLinks = await DB.loadCustomLinks();
    if (dbLinks.length > 0) {
      var linkStore = JSON.parse(localStorage.getItem("emudra_csc_custom_links") || "[]");
      dbLinks.forEach(function(l) {
        var idx = linkStore.findIndex(function(e) { return e.id === l.id; });
        if (idx >= 0) linkStore[idx] = l; else linkStore.push(l);
      });
      localStorage.setItem("emudra_csc_custom_links", JSON.stringify(linkStore));
      if (typeof reloadLinksData === "function") reloadLinksData();
    }

    console.log("Supabase sync complete.");
  } catch (e) {
    console.warn("Supabase sync failed, using localStorage:", e);
  }
}

window.addEventListener("load", function() {
  setTimeout(syncSupabaseToLocal, 1000);
});

window.DB = DB;
