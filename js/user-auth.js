/**
 * 👤 eMudra Citizen User Authentication & "माझे भरलेले अर्ज" (My Applications) Manager
 * Enables citizen/operator login, automatic form binding, history inspection, editing, and anytime re-printing.
 */

(function () {
  'use strict';

  var SESSION_KEY = 'emudra_citizen_user';
  var USERS_KEY = 'emudra_registered_users';
  var SUPABASE_URL = "https://vaaaqvwenxjrroroitlh.supabase.co";
  var SUPABASE_ANON = "sb_publishable_PIdPgy6voOiw70vk_YVQ4g_egoPLq0T";

  // Dedicated direct cloud fetch with fallback to sbFetch
  async function cloudDbFetch(table, options) {
    if (typeof window.sbFetch === 'function') {
      try {
        var r = await window.sbFetch(table, options);
        if (r !== null) return r;
      } catch (e) {
        console.warn('sbFetch wrapper note, trying direct:', e);
      }
    }

    options = options || {};
    var method = options.method || 'GET';
    var filter = options.filter || '';
    var body = options.body || null;
    var upsert = options.upsert || false;

    var queryParts = [];
    if (filter) queryParts.push(filter);
    if (upsert) {
      if (table === 'applications' && !filter.includes('on_conflict')) {
        queryParts.push('on_conflict=app_id');
      } else if (!filter.includes('on_conflict')) {
        queryParts.push('on_conflict=id');
      }
    }

    var queryString = queryParts.length > 0 ? '?' + queryParts.join('&') : '';
    var url = SUPABASE_URL + '/rest/v1/' + table + queryString;
    var headers = {
      'apikey': SUPABASE_ANON,
      'Authorization': 'Bearer ' + SUPABASE_ANON,
      'Content-Type': 'application/json',
      'Prefer': upsert ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
    };

    try {
      var res = await fetch(url, {
        method: method,
        headers: headers,
        body: body ? JSON.stringify(body) : undefined
      });
      if (!res.ok) {
        var errText = await res.text();
        console.warn('Cloud DB ' + method + ' ' + table + ' note:', errText);
        return null;
      }
      var text = await res.text();
      return text ? JSON.parse(text) : [];
    } catch (err) {
      console.warn('Cloud DB fetch failed:', err);
      return null;
    }
  }

  // Helper: Normalize 10-digit mobile number
  function cleanMobile(m) {
    if (!m) return '';
    var digits = String(m).replace(/\D/g, '');
    if (digits.length > 10 && digits.startsWith('91')) {
      digits = digits.slice(2);
    }
    return digits.slice(-10);
  }

  var UserAuth = {
    // Get currently logged-in user
    getCurrentUser: function () {
      try {
        var user = localStorage.getItem(SESSION_KEY);
        return user ? JSON.parse(user) : null;
      } catch (e) {
        return null;
      }
    },

    // Get all registered users from local cache
    getRegisteredUsers: function () {
      try {
        return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      } catch (e) {
        return [];
      }
    },

    // Save user permanently to Supabase server
    saveUserToServer: async function (user) {
      if (!user || !user.mobile) return false;
      var cleanMob = cleanMobile(user.mobile);
      var userRow = {
        app_id: 'USER-' + cleanMob,
        service_id: 'citizen_user',
        service_name: 'नोंदणीकृत नागरिक वापरकर्ता',
        full_name: user.name || '',
        mobile: cleanMob,
        email: user.email || '',
        purpose: user.pin || '',
        docs: {
          id: user.id || ('CIT-' + cleanMob),
          name: user.name,
          mobile: cleanMob,
          pin: user.pin,
          email: user.email || '',
          registeredAt: user.registeredAt || new Date().toISOString(),
          role: 'citizen'
        },
        status: 'active'
      };

      var saved = false;
      try {
        var res = await cloudDbFetch('applications', {
          method: 'POST',
          body: userRow,
          upsert: true,
          filter: 'on_conflict=app_id'
        });
        if (res && res.length > 0) {
          saved = true;
        }
      } catch (e) {
        console.warn('User server save note:', e);
      }

      // Also attempt citizen_users table in case schema was created
      try {
        await cloudDbFetch('citizen_users', {
          method: 'POST',
          body: {
            user_id: user.id || ('CIT-' + cleanMob),
            full_name: user.name,
            mobile: cleanMob,
            pin: user.pin,
            email: user.email || '',
            registered_at: user.registeredAt || new Date().toISOString()
          },
          upsert: true
        });
      } catch (e) {}

      return saved;
    },

    // Fetch user account from Supabase server by 10-digit mobile
    fetchUserFromServer: async function (mobileInput) {
      var mobile = cleanMobile(mobileInput);
      if (!mobile || mobile.length !== 10) return null;

      try {
        // 1. Primary check in applications table (guaranteed server persistence)
        var rows = await cloudDbFetch('applications', {
          filter: 'service_id=eq.citizen_user&mobile=eq.' + mobile
        });
        if (rows && rows.length > 0) {
          var r = rows[0];
          return {
            id: (r.docs && r.docs.id) || r.app_id || ('CIT-' + mobile),
            name: r.full_name || (r.docs && r.docs.name) || '',
            mobile: r.mobile || mobile,
            pin: (r.docs && r.docs.pin) || r.purpose || '',
            email: r.email || (r.docs && r.docs.email) || '',
            registeredAt: (r.docs && r.docs.registeredAt) || r.submitted_at || new Date().toISOString()
          };
        }

        // 2. Secondary check in citizen_users table
        var cuRows = await cloudDbFetch('citizen_users', { filter: 'mobile=eq.' + mobile });
        if (cuRows && cuRows.length > 0) {
          var cr = cuRows[0];
          return {
            id: cr.user_id || ('CIT-' + (cr.id || mobile)),
            name: cr.full_name || '',
            mobile: cr.mobile || mobile,
            pin: cr.pin || '',
            email: cr.email || '',
            registeredAt: cr.registered_at || new Date().toISOString()
          };
        }
      } catch (err) {
        console.warn('fetchUserFromServer error:', err);
      }

      return null;
    },

    // Sync all registered users from server and migrate any local-only users
    syncUsersFromServer: async function () {
      try {
        var rows = await cloudDbFetch('applications', {
          filter: 'service_id=eq.citizen_user'
        });

        var localUsers = UserAuth.getRegisteredUsers();
        var userMap = {};

        // Populate from local cache first
        localUsers.forEach(function (u) {
          var m = cleanMobile(u.mobile);
          if (m && m.length === 10) {
            userMap[m] = u;
          }
        });

        // Merge records from cloud server
        if (rows && rows.length > 0) {
          rows.forEach(function (r) {
            var m = cleanMobile(r.mobile);
            if (!m || m.length !== 10) return;
            var serverUser = {
              id: (r.docs && r.docs.id) || r.app_id,
              name: r.full_name || (r.docs && r.docs.name) || '',
              mobile: m,
              pin: (r.docs && r.docs.pin) || r.purpose || '',
              email: r.email || (r.docs && r.docs.email) || '',
              registeredAt: (r.docs && r.docs.registeredAt) || r.submitted_at || new Date().toISOString()
            };
            userMap[m] = serverUser;
          });
        }

        var mergedList = Object.values(userMap);
        localStorage.setItem(USERS_KEY, JSON.stringify(mergedList));

        // Auto-upload any local users that don't exist on server yet (backward compatibility migration)
        var serverMobiles = new Set((rows || []).map(function (r) { return cleanMobile(r.mobile); }));
        for (var i = 0; i < localUsers.length; i++) {
          var lu = localUsers[i];
          var lm = cleanMobile(lu.mobile);
          if (lm && lm.length === 10 && !serverMobiles.has(lm)) {
            UserAuth.saveUserToServer(lu);
          }
        }
      } catch (err) {
        console.warn('syncUsersFromServer note:', err);
      }
    },

    // Register a new citizen/operator
    register: async function (userData) {
      var mobile = cleanMobile(userData.mobile);
      var name = (userData.name || '').trim();
      var pin = (userData.pin || '').trim();

      if (!name || name.length < 2) {
        return { success: false, message: 'कृपया आपले पूर्ण नाव प्रविष्ट करा.' };
      }
      if (!mobile || mobile.length !== 10) {
        return { success: false, message: 'कृपया वैध १० अंकी मोबाईल नंबर टाका.' };
      }
      if (!pin || pin.length < 4) {
        return { success: false, message: 'किमान ४ अंकी सुरक्षा पिन (PIN) तयार करा.' };
      }

      // Check local cache
      var users = UserAuth.getRegisteredUsers();
      var existing = users.find(function (u) { return cleanMobile(u.mobile) === mobile; });

      // Check server to prevent duplicate account
      if (!existing) {
        var serverUser = await UserAuth.fetchUserFromServer(mobile);
        if (serverUser) {
          existing = serverUser;
          users.push(serverUser);
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }
      }

      if (existing) {
        return { success: false, message: 'या मोबाईल नंबरवर (' + mobile + ') आधीच खाते नोंदणीकृत आहे. कृपया लॉगिन करा.' };
      }

      var newUser = {
        id: 'CIT-' + Date.now().toString().slice(-6),
        name: name,
        mobile: mobile,
        pin: pin,
        email: (userData.email || '').trim(),
        registeredAt: new Date().toISOString()
      };

      // 1. Save permanently to Supabase cloud server
      await UserAuth.saveUserToServer(newUser);

      // 2. Save into local cache
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      // 3. Set active session
      localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
      UserAuth.updateHeaderUI();
      return { success: true, user: newUser };
    },

    // Login citizen/operator
    login: async function (mobileInput, pinInput) {
      var mobile = cleanMobile(mobileInput);
      var pin = (pinInput || '').trim();

      if (!mobile || mobile.length !== 10) {
        return { success: false, message: 'कृपया वैध १० अंकी मोबाईल नंबर टाका.' };
      }
      if (!pin) {
        return { success: false, message: 'कृपया आपला पिन (PIN) प्रविष्ट करा.' };
      }

      var users = UserAuth.getRegisteredUsers();
      var user = users.find(function (u) { return cleanMobile(u.mobile) === mobile; });

      // Always fetch fresh from server if not found locally OR if PIN mismatch (in case PIN was changed)
      if (!user || user.pin !== pin) {
        var serverUser = await UserAuth.fetchUserFromServer(mobile);
        if (serverUser) {
          user = serverUser;
          var idx = users.findIndex(function (u) { return cleanMobile(u.mobile) === mobile; });
          if (idx >= 0) {
            users[idx] = serverUser;
          } else {
            users.push(serverUser);
          }
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }
      }

      if (!user) {
        return { success: false, message: 'हा मोबाईल नंबर नोंदणीकृत नाही. कृपया प्रथम "नवीन नोंदणी करा".' };
      }

      if (user.pin !== pin) {
        return { success: false, message: 'चुकीचा पिन! कृपया बरोबर पिन टाका.' };
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      UserAuth.updateHeaderUI();
      return { success: true, user: user };
    },

    // Logout
    logout: function () {
      localStorage.removeItem(SESSION_KEY);
      UserAuth.updateHeaderUI();
      if (typeof showToast === 'function') {
        showToast('लॉगआउट झाले.', 'info');
      }
      var modal = document.getElementById('emudra-my-apps-modal');
      if (modal) modal.style.display = 'none';

      var path = window.location.pathname;
      var slug = path.substring(path.lastIndexOf('/') + 1).replace(/\.html$/i, '').toLowerCase() || 'index';
      var isFormPage = slug !== 'index' && slug !== 'aadhar-kendra' && slug !== 'digital-dalan' && slug !== 'digital-wall' && slug !== 'book-wall' && slug !== 'logo-wall' && slug !== 'news_paper';

      if (isFormPage) {
        UserAuth.enforceMandatoryFormLogin();
      }
    },

    // Fetch all applications for current user (combines local and cloud)
    getUserApplications: async function (targetMobile) {
      var mobile = cleanMobile(targetMobile || (UserAuth.getCurrentUser() ? UserAuth.getCurrentUser().mobile : ''));
      if (!mobile) return [];

      var allApps = [];

      // 1. Fetch from LocalStorage
      try {
        var localList = JSON.parse(localStorage.getItem('emudra_form_history') || '[]');
        localList.forEach(function (app) {
          var appMob = cleanMobile(app.userMobile || app.mobile || (app.formData ? app.formData.in_mobile || app.formData.mobile : ''));
          if (appMob === mobile) {
            allApps.push(app);
          }
        });
      } catch (e) {}

      // 2. Fetch from DB if available
      try {
        if (typeof window.DB !== 'undefined' && typeof window.DB.getFormHistory === 'function') {
          var dbApps = await window.DB.getFormHistory();
          dbApps.forEach(function (dbApp) {
            var dbMob = cleanMobile(dbApp.userMobile || dbApp.mobile || (dbApp.formData ? dbApp.formData.in_mobile || dbApp.formData.mobile : ''));
            if (dbMob === mobile) {
              var exists = allApps.some(function (a) { return a.appId === dbApp.appId; });
              if (!exists) allApps.push(dbApp);
            }
          });
        }
      } catch (e) {}

      // Sort newest first
      allApps.sort(function (a, b) {
        var tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        var tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tB - tA;
      });

      return allApps;
    },

    // Update Header Buttons across pages
    updateHeaderUI: function () {
      var user = UserAuth.getCurrentUser();

      // Find or create container in header
      var containers = document.querySelectorAll('.citizen-auth-slot, #citizen-auth-slot, .nav-actions, .header-actions, .top-navbar .nav-actions');

      containers.forEach(function (container) {
        var existingSlot = container.querySelector('.citizen-auth-widget');
        if (!existingSlot) {
          existingSlot = document.createElement('div');
          existingSlot.className = 'citizen-auth-widget no-print';
          existingSlot.style.cssText = 'display:inline-flex;align-items:center;gap:6px;';
          container.insertBefore(existingSlot, container.firstChild);
        }

        if (user) {
          var firstName = (user.name || '').trim().split(' ')[0] || 'वापरकर्ता';
          var safeMobile = user.mobile || '';

          existingSlot.innerHTML =
            '<div class="citizen-user-dropdown-wrap" style="position:relative;display:inline-block;">' +
            '<button type="button" onclick="UserAuth.toggleUserDropdown(this, event)" class="citizen-profile-btn" title="वापरकर्ता मेनू उघडा" style="background:linear-gradient(135deg,#065f46,#047857);border:1.5px solid #34d399;border-radius:8px;color:#ffffff;font-weight:700;font-size:0.82rem;padding:0.4rem 0.75rem;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(5,150,105,0.3);transition:all 0.2s;" onmouseover="this.style.transform=\'translateY(-1px)\'" onmouseout="this.style.transform=\'translateY(0)\'">' +
            '<i class="fa-solid fa-circle-user" style="color:#a7f3d0;font-size:0.95rem;"></i>' +
            '<span>' + firstName + '</span>' +
            '<i class="fa-solid fa-chevron-down" style="font-size:0.68rem;opacity:0.85;margin-left:2px;"></i>' +
            '</button>' +

            // Dropdown Menu
            '<div class="citizen-profile-dropdown" style="display:none;position:absolute;right:0;top:calc(100% + 6px);background:#0f172a;border:1px solid rgba(255,255,255,0.15);border-radius:12px;min-width:200px;box-shadow:0 12px 30px rgba(0,0,0,0.65);z-index:999999;overflow:hidden;padding:6px;font-family:inherit;">' +
            
            // Header Info
            '<div style="padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:4px;">' +
            '<div style="font-size:0.85rem;font-weight:700;color:#f8fafc;display:flex;align-items:center;gap:6px;">' +
            '<i class="fa-solid fa-user-check" style="color:#34d399;font-size:0.85rem;"></i> <span>' + user.name + '</span>' +
            '</div>' +
            (safeMobile ? '<div style="font-size:0.75rem;color:#94a3b8;margin-top:2px;padding-left:18px;">📱 ' + safeMobile + '</div>' : '') +
            '</div>' +

            // "माझे भरलेले अर्ज" Option
            '<button type="button" onclick="UserAuth.openMyApplicationsModal();UserAuth.closeUserDropdown();" style="width:100%;display:flex;align-items:center;gap:10px;padding:8px 10px;background:transparent;border:none;color:#e2e8f0;font-size:0.84rem;font-weight:600;border-radius:8px;cursor:pointer;text-align:left;transition:background 0.2s;" onmouseover="this.style.background=\'rgba(56,189,248,0.15)\';this.style.color=\'#38bdf8\';" onmouseout="this.style.background=\'transparent\';this.style.color=\'#e2e8f0\';">' +
            '<i class="fa-solid fa-folder-open" style="color:#38bdf8;font-size:0.95rem;width:18px;text-align:center;"></i>' +
            '<span>माझे भरलेले अर्ज</span>' +
            '</button>' +

            // "लॉगआउट" Option
            '<button type="button" onclick="UserAuth.logout();UserAuth.closeUserDropdown();" style="width:100%;display:flex;align-items:center;gap:10px;padding:8px 10px;background:transparent;border:none;color:#fca5a5;font-size:0.84rem;font-weight:600;border-radius:8px;cursor:pointer;text-align:left;transition:background 0.2s;margin-top:2px;" onmouseover="this.style.background=\'rgba(239,68,68,0.15)\';this.style.color=\'#ef4444\';" onmouseout="this.style.background=\'transparent\';this.style.color=\'#fca5a5\';">' +
            '<i class="fa-solid fa-right-from-bracket" style="color:#ef4444;font-size:0.95rem;width:18px;text-align:center;"></i>' +
            '<span>लॉगआउट करा</span>' +
            '</button>' +

            '</div>' +
            '</div>';
        } else {
          existingSlot.innerHTML =
            '<button type="button" onclick="UserAuth.openLoginModal()" class="nav-citizen-btn" title="नागरिक / वापरकर्ता लॉगिन" style="background:linear-gradient(135deg,#0284c7,#0369a1);border:1.5px solid rgba(255,255,255,0.25);color:#ffffff;font-weight:700;font-size:0.84rem;padding:0.42rem 0.85rem;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;text-decoration:none;box-shadow:0 3px 10px rgba(2,132,199,0.28);transition:all 0.2s;" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 5px 14px rgba(2,132,199,0.45)\'" onmouseout="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 3px 10px rgba(2,132,199,0.28)\'">' +
            '<i class="fa-solid fa-user-circle" style="font-size:0.95rem;"></i> <span>नागरिक लॉगिन</span>' +
            '</button>';
        }
      });
    },

    toggleUserDropdown: function (btn, e) {
      if (e) e.stopPropagation();
      var wrap = btn ? btn.closest('.citizen-user-dropdown-wrap') : null;
      if (!wrap) return;
      var menu = wrap.querySelector('.citizen-profile-dropdown');
      if (!menu) return;
      var isOpen = menu.style.display === 'block';
      UserAuth.closeUserDropdown();
      if (!isOpen) {
        menu.style.display = 'block';
      }
    },

    closeUserDropdown: function () {
      document.querySelectorAll('.citizen-profile-dropdown').forEach(function (m) {
        m.style.display = 'none';
      });
    },

    // Open Login / Register Modal
    openLoginModal: function (initialTab) {
      var modal = document.getElementById('emudra-citizen-auth-modal');
      if (!modal) {
        UserAuth.createAuthModals();
        modal = document.getElementById('emudra-citizen-auth-modal');
      }
      if (modal) {
        modal.style.display = 'flex';
        UserAuth.switchAuthTab(initialTab || 'login');
      }
    },

    closeLoginModal: function () {
      var modal = document.getElementById('emudra-citizen-auth-modal');
      if (modal) modal.style.display = 'none';
    },

    switchAuthTab: function (tab) {
      var loginTabBtn = document.getElementById('auth-tab-login');
      var regTabBtn = document.getElementById('auth-tab-register');
      var loginSec = document.getElementById('auth-section-login');
      var regSec = document.getElementById('auth-section-register');
      var msgBox = document.getElementById('auth-error-msg');
      if (msgBox) msgBox.style.display = 'none';

      if (tab === 'login') {
        if (loginTabBtn) loginTabBtn.className = 'auth-tab active';
        if (regTabBtn) regTabBtn.className = 'auth-tab';
        if (loginSec) loginSec.style.display = 'block';
        if (regSec) regSec.style.display = 'none';
      } else {
        if (loginTabBtn) loginTabBtn.className = 'auth-tab';
        if (regTabBtn) regTabBtn.className = 'auth-tab active';
        if (loginSec) loginSec.style.display = 'none';
        if (regSec) regSec.style.display = 'block';
      }
    },

    // Open "माझे भरलेले अर्ज" (My Applications) Modal
    openMyApplicationsModal: async function () {
      var user = UserAuth.getCurrentUser();
      if (!user) {
        UserAuth.openLoginModal('login');
        return;
      }

      var modal = document.getElementById('emudra-my-apps-modal');
      if (!modal) {
        UserAuth.createAuthModals();
        modal = document.getElementById('emudra-my-apps-modal');
      }

      if (modal) {
        modal.style.display = 'flex';
        document.getElementById('my-apps-user-name').textContent = user.name;
        document.getElementById('my-apps-user-mobile').textContent = user.mobile;
        await UserAuth.renderApplicationsList();
      }
    },

    closeMyApplicationsModal: function () {
      var modal = document.getElementById('emudra-my-apps-modal');
      if (modal) modal.style.display = 'none';
    },

    // Render list of applications inside My Applications Modal
    renderApplicationsList: async function (searchFilter) {
      var listContainer = document.getElementById('my-apps-list-content');
      if (!listContainer) return;

      listContainer.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;"><i class="fa-solid fa-spinner fa-spin" style="font-size:1.8rem;color:#38bdf8;"></i><p style="margin-top:10px;">आपले अर्ज लोड होत आहेत...</p></div>';

      var user = UserAuth.getCurrentUser();
      if (!user) return;

      var apps = await UserAuth.getUserApplications(user.mobile);

      // Search filter if provided
      if (searchFilter) {
        var query = searchFilter.toLowerCase().trim();
        apps = apps.filter(function (app) {
          return (
            (app.appId && app.appId.toLowerCase().includes(query)) ||
            (app.formTitle && app.formTitle.toLowerCase().includes(query)) ||
            (app.applicantName && app.applicantName.toLowerCase().includes(query))
          );
        });
      }

      var countEl = document.getElementById('my-apps-count');
      if (countEl) countEl.textContent = apps.length;

      if (!apps || apps.length === 0) {
        listContainer.innerHTML =
          '<div style="text-align:center;padding:45px 20px;color:#94a3b8;">' +
          '<div style="font-size:3rem;margin-bottom:12px;color:#475569;"><i class="fa-regular fa-folder-open"></i></div>' +
          '<h3 style="color:#e2e8f0;font-size:1.15rem;margin-bottom:6px;">कोणताही भरलेला अर्ज सापडला नाही</h3>' +
          '<p style="font-size:0.88rem;max-width:420px;margin:0 auto 16px auto;line-height:1.5;">तुम्ही जेव्हा पोर्टलवरील कोणताही फॉर्म भरून थेट प्रिंट किंवा सेव्ह कराल, तेव्हा तो आपोआप तुमच्या या लॉगिन खात्यामध्ये जतन केला जाईल.</p>' +
          '<a href="index.html" style="display:inline-flex;align-items:center;gap:6px;background:#0284c7;color:#fff;text-decoration:none;padding:8px 18px;border-radius:8px;font-weight:700;font-size:0.85rem;">' +
          '<i class="fa-solid fa-file-circle-plus"></i> नवीन फॉर्म भरा' +
          '</a>' +
          '</div>';
        return;
      }

      var html = '<div style="display:flex;flex-direction:column;gap:12px;">';

      apps.forEach(function (app) {
        var editUrl = (app.formType || 'gazette-name-change') + '.html?edit_app_id=' + encodeURIComponent(app.appId);
        var printUrl = editUrl + '&autoprint=1';
        var dateDisplay = app.dateFormatted || (app.timestamp ? new Date(app.timestamp).toLocaleString('mr-IN') : 'सद्यकालीन');

        html +=
          '<div style="background:rgba(30,41,59,0.7);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;transition:all 0.2s;" onmouseover="this.style.borderColor=\'#38bdf8\'" onmouseout="this.style.borderColor=\'rgba(255,255,255,0.1)\'">' +
          
          // Left Info
          '<div style="display:flex;align-items:flex-start;gap:14px;">' +
          '<div style="background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.3);width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#38bdf8;font-size:1.3rem;flex-shrink:0;">' +
          '<i class="fa-solid fa-file-lines"></i>' +
          '</div>' +
          '<div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;">' +
          '<span style="background:rgba(16,185,129,0.2);color:#34d399;font-size:0.75rem;font-weight:800;padding:2px 8px;border-radius:6px;border:1px solid rgba(16,185,129,0.4);">' + app.appId + '</span>' +
          '<span style="color:#ffffff;font-size:1rem;font-weight:700;">' + (app.formTitle || 'शासकीय अर्ज') + '</span>' +
          '</div>' +
          '<div style="color:#cbd5e1;font-size:0.86rem;margin-bottom:4px;">' +
          '<span><i class="fa-solid fa-user" style="color:#94a3b8;font-size:0.8rem;"></i> <strong>' + (app.applicantName || 'अर्जदार') + '</strong></span>' +
          (app.mobile ? ' <span style="color:#64748b;">|</span> <i class="fa-solid fa-phone" style="color:#94a3b8;font-size:0.78rem;"></i> ' + app.mobile : '') +
          '</div>' +
          '<div style="color:#94a3b8;font-size:0.76rem;">' +
          '<i class="fa-regular fa-clock"></i> ' + dateDisplay + ' • <span style="color:#10b981;">✅ सेव्ह / प्रिंट</span>' +
          '</div>' +
          '</div>' +
          '</div>' +

          // Right Action Buttons
          '<div style="display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
          
          // Edit Button (बदल करा)
          '<a href="' + editUrl + '" class="btn-app-action" style="background:linear-gradient(135deg,#0284c7,#0369a1);color:#fff;text-decoration:none;padding:7px 13px;border-radius:8px;font-size:0.82rem;font-weight:700;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(2,132,199,0.3);">' +
          '<i class="fa-solid fa-pen-to-square"></i> बदल करा' +
          '</a>' +

          // Re-Print Button (पुन्हा प्रिंट करा)
          '<a href="' + printUrl + '" class="btn-app-action" style="background:linear-gradient(135deg,#059669,#047857);color:#fff;text-decoration:none;padding:7px 13px;border-radius:8px;font-size:0.82rem;font-weight:700;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(5,150,105,0.3);">' +
          '<i class="fa-solid fa-print"></i> पुन्हा प्रिंट' +
          '</a>' +

          '</div>' +

          '</div>';
      });

      html += '</div>';
      listContainer.innerHTML = html;
    },

    deleteApp: async function (appId) {
      if (!confirm('तुम्हाला खरोखर हा अर्ज (' + appId + ') हटवायचा आहे का?')) return;
      try {
        if (typeof window.DB !== 'undefined' && typeof window.DB.deleteFormRecord === 'function') {
          await window.DB.deleteFormRecord(appId);
        } else {
          var list = JSON.parse(localStorage.getItem('emudra_form_history') || '[]');
          list = list.filter(function (a) { return a.appId !== appId; });
          localStorage.setItem('emudra_form_history', JSON.stringify(list));
        }
        UserAuth.renderApplicationsList();
        if (typeof showToast === 'function') showToast('अर्ज हटवला गेला.', 'info');
      } catch (e) {
        console.warn('Delete app failed:', e);
      }
    },

    // Enforce Mandatory Citizen Login on Form Pages
    enforceMandatoryFormLogin: function () {
      var path = window.location.pathname;
      var slug = path.substring(path.lastIndexOf('/') + 1).replace(/\.html$/i, '').toLowerCase() || 'index';
      var isFormPage = slug !== 'index' && slug !== 'aadhar-kendra' && slug !== 'digital-dalan' && slug !== 'digital-wall' && slug !== 'book-wall' && slug !== 'logo-wall' && slug !== 'news_paper';

      if (!isFormPage) return true;

      var user = UserAuth.getCurrentUser();
      var isAdmin = sessionStorage.getItem('emudra_admin_auth') === 'true';
      if (user || isAdmin) {
        var existingGate = document.getElementById('emudra-mandatory-gate');
        if (existingGate) existingGate.remove();
        return true;
      }

      // If gate already exists on screen, return
      if (document.getElementById('emudra-mandatory-gate')) return false;

      var gate = document.createElement('div');
      gate.id = 'emudra-mandatory-gate';
      gate.className = 'no-print';
      gate.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.95);backdrop-filter:blur(12px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:inherit;';

      gate.innerHTML =
        '<div style="background:#1e293b;border:1.5px solid rgba(56,189,248,0.45);border-radius:18px;max-width:480px;width:100%;padding:32px 24px;text-align:center;box-shadow:0 25px 60px rgba(0,0,0,0.8);color:#fff;animation:authPopIn 0.3s ease-out;">' +
        '<div style="width:68px;height:68px;background:linear-gradient(135deg,rgba(56,189,248,0.2),rgba(59,130,246,0.2));border:1.5px solid rgba(56,189,248,0.5);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px auto;color:#38bdf8;font-size:1.9rem;">' +
        '<i class="fa-solid fa-user-lock"></i>' +
        '</div>' +
        '<h2 style="font-size:1.35rem;font-weight:800;color:#f8fafc;margin:0 0 8px 0;">नागरिक लॉगिन अनिवार्य आहे</h2>' +
        '<div style="background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.3);border-radius:10px;padding:6px 12px;display:inline-block;margin-bottom:14px;color:#38bdf8;font-size:0.82rem;font-weight:700;">' +
        '<i class="fa-solid fa-shield-halved"></i> शासकीय सेवा नियम व अर्ज सुरक्षा' +
        '</div>' +
        '<p style="color:#cbd5e1;font-size:0.92rem;line-height:1.6;margin:0 0 24px 0;">' +
        'हा शासकीय अर्ज भरण्यासाठी, सेव्ह करण्यासाठी व प्रिंट करण्यासाठी प्रथम आपले <strong>नाव व १० अंकी मोबाईल नंबर</strong> टाकून <strong>नागरिक लॉगिन</strong> करणे अनिवार्य आहे. आपण नवीन असाल तर २ सेकंदात मोफत नवीन नोंदणी करू शकता.' +
        '</p>' +
        '<div style="display:flex;flex-direction:column;gap:12px;">' +
        '<button type="button" onclick="UserAuth.openLoginModal()" style="background:linear-gradient(135deg,#0284c7,#0369a1);border:none;color:#fff;padding:12px 18px;border-radius:10px;font-weight:800;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 15px rgba(2,132,199,0.4);transition:all 0.2s;">' +
        '<i class="fa-solid fa-right-to-bracket"></i> नागरिक लॉगिन / नवीन नोंदणी' +
        '</button>' +
        '<a href="index.html" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#cbd5e1;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600;font-size:0.88rem;display:flex;align-items:center;justify-content:center;gap:8px;">' +
        '<i class="fa-solid fa-house"></i> मुख्य पृष्ठावर परत जा' +
        '</a>' +
        '</div>' +
        '</div>';

      document.body.appendChild(gate);
      return false;
    },

    // Inject Auth & Dashboard Modals Markup
    createAuthModals: function () {
      if (document.getElementById('emudra-citizen-auth-modal')) return;

      var styleEl = document.createElement('style');
      styleEl.textContent = `
        .auth-modal-overlay {
          position: fixed; inset: 0; background: rgba(10, 15, 29, 0.85); backdrop-filter: blur(8px);
          z-index: 999999; display: none; align-items: center; justify-content: center; padding: 15px; font-family: 'Poppins', 'Mukta', sans-serif;
        }
        .auth-modal-card {
          background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6); width: 100%; max-width: 440px; overflow: hidden; color: #fff;
          animation: authPopIn 0.25s ease-out;
        }
        .auth-tabs-row {
          display: flex; background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .auth-tab {
          flex: 1; padding: 12px; text-align: center; font-weight: 700; font-size: 0.92rem; color: #94a3b8;
          border: none; background: transparent; cursor: pointer; transition: all 0.2s;
        }
        .auth-tab.active {
          color: #38bdf8; background: rgba(56,189,248,0.1); border-bottom: 2px solid #38bdf8;
        }
        .auth-input-group { margin-bottom: 14px; text-align: left; }
        .auth-input-group label { display: block; font-size: 0.82rem; font-weight: 600; color: #cbd5e1; margin-bottom: 6px; }
        .auth-input-group input {
          width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.18);
          border-radius: 8px; padding: 10px 14px; color: #fff; font-size: 0.95rem; box-sizing: border-box; outline: none;
        }
        .auth-input-group input:focus { border-color: #38bdf8; box-shadow: 0 0 10px rgba(56,189,248,0.3); }
        .auth-btn-primary {
          width: 100%; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #fff;
          border: none; padding: 12px; border-radius: 8px; font-weight: 700; font-size: 0.95rem; cursor: pointer;
          box-shadow: 0 4px 14px rgba(2,132,199,0.4); transition: all 0.2s;
        }
        .auth-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(2,132,199,0.6); }
        @keyframes authPopIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `;
      document.head.appendChild(styleEl);

      // 1. Citizen Login / Register Modal
      var authModal = document.createElement('div');
      authModal.id = 'emudra-citizen-auth-modal';
      authModal.className = 'auth-modal-overlay no-print';
      authModal.innerHTML = `
        <div class="auth-modal-card">
          <div style="padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08);">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 36px; height: 36px; background: rgba(56,189,248,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #38bdf8;">
                <i class="fa-solid fa-user-shield"></i>
              </div>
              <h3 style="margin: 0; font-size: 1.1rem; color: #fff;">नागरिक / वापरकर्ता प्रवेश</h3>
            </div>
            <button type="button" onclick="UserAuth.closeLoginModal()" style="background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="auth-tabs-row">
            <button type="button" id="auth-tab-login" class="auth-tab active" onclick="UserAuth.switchAuthTab('login')">
              <i class="fa-solid fa-right-to-bracket"></i> लॉगिन करा
            </button>
            <button type="button" id="auth-tab-register" class="auth-tab" onclick="UserAuth.switchAuthTab('register')">
              <i class="fa-solid fa-user-plus"></i> नवीन नोंदणी
            </button>
          </div>

          <div style="padding: 20px;">
            <div id="auth-error-msg" style="display: none; background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.4); color: #fca5a5; padding: 8px 12px; border-radius: 6px; font-size: 0.84rem; margin-bottom: 14px;"></div>

            <!-- Login Form -->
            <form id="auth-section-login" onsubmit="event.preventDefault(); UserAuth.handleLoginSubmit();">
              <div class="auth-input-group">
                <label><i class="fa-solid fa-mobile-screen"></i> १० अंकी मोबाईल नंबर</label>
                <input type="tel" id="auth_login_mobile" placeholder="उदा. 9876543210" maxlength="10" required autofocus>
              </div>
              <div class="auth-input-group">
                <label><i class="fa-solid fa-key"></i> ४ अंकी सुरक्षा पिन (PIN)</label>
                <input type="password" id="auth_login_pin" placeholder="••••" maxlength="6" required>
              </div>
              <button type="submit" class="auth-btn-primary" style="margin-top: 10px;">
                <i class="fa-solid fa-right-to-bracket"></i> लॉगिन करा
              </button>
              <p style="text-align: center; color: #94a3b8; font-size: 0.8rem; margin-top: 12px;">
                खाते नाही? <a href="javascript:void(0)" onclick="UserAuth.switchAuthTab('register')" style="color: #38bdf8; font-weight: 700;">येथे नवीन नोंदणी करा</a>
              </p>
            </form>

            <!-- Register Form -->
            <form id="auth-section-register" style="display: none;" onsubmit="event.preventDefault(); UserAuth.handleRegisterSubmit();">
              <div class="auth-input-group">
                <label><i class="fa-solid fa-user"></i> पूर्ण नाव (Full Name)</label>
                <input type="text" id="auth_reg_name" placeholder="उदा. गणेश रमेश पवार" required>
              </div>
              <div class="auth-input-group">
                <label><i class="fa-solid fa-mobile-screen"></i> १० अंकी मोबाईल नंबर</label>
                <input type="tel" id="auth_reg_mobile" placeholder="उदा. 9876543210" maxlength="10" required>
              </div>
              <div class="auth-input-group">
                <label><i class="fa-solid fa-key"></i> नवीन सुरक्षा पिन (४-६ अंक तयार करा)</label>
                <input type="password" id="auth_reg_pin" placeholder="उदा. 1234" maxlength="6" required>
              </div>
              <button type="submit" class="auth-btn-primary" style="margin-top: 10px; background: linear-gradient(135deg, #059669 0%, #047857 100%);">
                <i class="fa-solid fa-user-plus"></i> नोंदणी पूर्ण करा
              </button>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(authModal);

      // 2. "माझे भरलेले अर्ज" (My Applications Dashboard) Modal
      var appsModal = document.createElement('div');
      appsModal.id = 'emudra-my-apps-modal';
      appsModal.className = 'auth-modal-overlay no-print';
      appsModal.innerHTML = `
        <div class="auth-modal-card" style="max-width: 820px; max-height: 90vh; display: flex; flex-direction: column;">
          <!-- Top Header -->
          <div style="padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); background: #0f172a; flex-shrink: 0;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 42px; height: 42px; background: rgba(16,185,129,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #34d399; font-size: 1.3rem;">
                <i class="fa-solid fa-folder-tree"></i>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 1.15rem; color: #fff;">माझे भरलेले अर्ज (My Applications)</h3>
                <div style="color: #94a3b8; font-size: 0.8rem; margin-top: 2px;">
                  वापरकर्ता: <strong id="my-apps-user-name" style="color: #38bdf8;">-</strong> • मोबाईल: <span id="my-apps-user-mobile">-</span>
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: rgba(56,189,248,0.15); border: 1px solid rgba(56,189,248,0.3); color: #38bdf8; font-size: 0.82rem; font-weight: 700; padding: 4px 10px; border-radius: 20px;">
                एकूण अर्ज: <span id="my-apps-count">0</span>
              </span>
              <button type="button" onclick="UserAuth.closeMyApplicationsModal()" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; width: 32px; height: 32px; border-radius: 8px; cursor: pointer;">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          <!-- Search Toolbar -->
          <div style="padding: 12px 20px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0;">
            <div style="position: relative;">
              <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 12px; top: 11px; color: #64748b;"></i>
              <input type="text" placeholder="अर्ज क्र. किंवा फॉर्मच्या नावाने शोधा..." oninput="UserAuth.renderApplicationsList(this.value)" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 8px 12px 8px 36px; color: #fff; font-size: 0.88rem; box-sizing: border-box; outline: none;">
            </div>
          </div>

          <!-- Content List -->
          <div id="my-apps-list-content" style="padding: 20px; overflow-y: auto; flex: 1;">
            <!-- Applications injected here -->
          </div>

          <!-- Modal Footer -->
          <div style="padding: 12px 20px; background: #0f172a; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; color: #94a3b8; flex-shrink: 0;">
            <span><i class="fa-solid fa-circle-info" style="color: #38bdf8;"></i> अर्जात बदल करण्यासाठी <strong>'बदल करा'</strong> आणि त्वरित प्रिंटसाठी <strong>'पुन्हा प्रिंट'</strong> वर क्लिक करा.</span>
            <button type="button" onclick="UserAuth.closeMyApplicationsModal()" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 5px 14px; border-radius: 6px; font-weight: 600; cursor: pointer;">
              बंद करा
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(appsModal);
    },

    onAuthSuccess: function (user, isNewReg) {
      UserAuth.closeLoginModal();
      UserAuth.updateHeaderUI();

      var path = window.location.pathname;
      var slug = path.substring(path.lastIndexOf('/') + 1).replace(/\.html$/i, '').toLowerCase() || 'index';
      var isFormPage = slug !== 'index' && slug !== 'aadhar-kendra' && slug !== 'digital-dalan' && slug !== 'digital-wall' && slug !== 'book-wall' && slug !== 'logo-wall' && slug !== 'news_paper';

      if (isFormPage) {
        var gate = document.getElementById('emudra-mandatory-gate');
        if (gate) gate.remove();

        var msg = isNewReg
          ? 'नोंदणी यशस्वी! स्वागत आहे, ' + user.name + '. आता आपण अर्ज भरू शकता.'
          : 'स्वागत आहे, ' + user.name + '! लॉगिन यशस्वी. आता आपण अर्ज भरू शकता.';
        if (typeof showToast === 'function') {
          showToast(msg, 'success');
        } else {
          alert(msg);
        }

        // Auto-fill applicant name or phone if present and blank
        try {
          var nameInput = document.getElementById('applicant_name') || document.getElementById('old_name') || document.getElementById('in_applicant_name');
          if (nameInput && !nameInput.value.trim()) nameInput.value = user.name;
          var mobInput = document.getElementById('in_mobile') || document.getElementById('mobile') || document.getElementById('applicant_mobile');
          if (mobInput && !mobInput.value.trim()) mobInput.value = user.mobile;
        } catch (e) {}
      } else {
        var defaultMsg = isNewReg
          ? 'नोंदणी यशस्वी! स्वागत आहे, ' + user.name
          : 'स्वागत आहे, ' + user.name + '! लॉगिन यशस्वी.';
        if (typeof showToast === 'function') {
          showToast(defaultMsg, 'success');
        }
        UserAuth.openMyApplicationsModal();
      }
    },

    handleLoginSubmit: async function () {
      var btn = document.querySelector('#auth-section-login button[type="submit"]');
      var origContent = btn ? btn.innerHTML : '';
      var mobile = (document.getElementById('auth_login_mobile')?.value || '').trim();
      var pin = (document.getElementById('auth_login_pin')?.value || '').trim();
      var errBox = document.getElementById('auth-error-msg');
      if (errBox) errBox.style.display = 'none';

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> लॉगिन तपासत आहे...';
      }

      try {
        var res = await UserAuth.login(mobile, pin);
        if (res.success) {
          UserAuth.onAuthSuccess(res.user, false);
        } else {
          if (errBox) {
            errBox.textContent = res.message;
            errBox.style.display = 'block';
          }
        }
      } catch (err) {
        if (errBox) {
          errBox.textContent = 'लॉगिन करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.';
          errBox.style.display = 'block';
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = origContent;
        }
      }
    },

    handleRegisterSubmit: async function () {
      var btn = document.querySelector('#auth-section-register button[type="submit"]');
      var origContent = btn ? btn.innerHTML : '';
      var name = (document.getElementById('auth_reg_name')?.value || '').trim();
      var mobile = (document.getElementById('auth_reg_mobile')?.value || '').trim();
      var pin = (document.getElementById('auth_reg_pin')?.value || '').trim();
      var errBox = document.getElementById('auth-error-msg');
      if (errBox) errBox.style.display = 'none';

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> सर्व्हरवर सेव्ह करत आहे...';
      }

      try {
        var res = await UserAuth.register({ name: name, mobile: mobile, pin: pin });
        if (res.success) {
          UserAuth.onAuthSuccess(res.user, true);
        } else {
          if (errBox) {
            errBox.textContent = res.message;
            errBox.style.display = 'block';
          }
        }
      } catch (err) {
        if (errBox) {
          errBox.textContent = 'नोंदणी करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.';
          errBox.style.display = 'block';
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = origContent;
        }
      }
    }
  };

  // Close citizen profile dropdown on outside click
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.citizen-user-dropdown-wrap')) {
      UserAuth.closeUserDropdown();
    }
  });

  // Expose globally
  window.UserAuth = UserAuth;

  // Auto initialize on DOMContentLoaded
  window.addEventListener('DOMContentLoaded', function () {
    UserAuth.createAuthModals();
    setTimeout(UserAuth.updateHeaderUI, 200);
    setTimeout(UserAuth.syncUsersFromServer, 400);

    var path = window.location.pathname;
    var slug = path.substring(path.lastIndexOf('/') + 1).replace(/\.html$/i, '').toLowerCase() || 'index';
    var isFormPage = slug !== 'index' && slug !== 'aadhar-kendra' && slug !== 'digital-dalan' && slug !== 'digital-wall' && slug !== 'book-wall' && slug !== 'logo-wall' && slug !== 'news_paper';

    if (isFormPage) {
      setTimeout(function () {
        UserAuth.enforceMandatoryFormLogin();
      }, 150);
    }
  });

})();
