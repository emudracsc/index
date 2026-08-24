/**
 * ई-मुद्रा आपले सरकार केंद्र - Master Interactive Engine
 * 3D Physics, Particle Canvas, Clock, QR Modal, Search & Audio Feedback
 */

// ==========================================
// 1. Interactive Ambient Particle Canvas
// ==========================================
class AmbientCanvas {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'ambient-canvas';
    document.body.prepend(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    this.particles = [];
    this.numParticles = window.innerWidth < 768 ? 35 : 70;
    this.mouse = { x: null, y: null, radius: 150 };
    
    this.resize();
    this.initParticles();
    this.addEventListeners();
    this.animate();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2.5 + 0.8,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        opacity: Math.random() * 0.6 + 0.2,
        color: Math.random() > 0.6 ? '#f97316' : (Math.random() > 0.5 ? '#ffd166' : '#60a5fa')
      });
    }
  }

  addEventListeners() {
    window.addEventListener('resize', () => {
      this.resize();
      this.initParticles();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.x += p.speedX;
      p.y += p.speedY;

      if (p.x < 0 || p.x > this.width) p.speedX *= -1;
      if (p.y < 0 || p.y > this.height) p.speedY *= -1;

      // Mouse interactive force
      if (this.mouse.x != null && this.mouse.y != null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          p.x += (dx / dist) * force * 3;
          p.y += (dy / dist) * force * 3;
        }
      }

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.opacity;
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = p.color;
      this.ctx.fill();

      // Connect particles
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 110) {
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = '#ffd166';
          this.ctx.globalAlpha = (1 - dist / 110) * 0.15;
          this.ctx.lineWidth = 0.8;
          this.ctx.stroke();
        }
      }
    }

    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
    requestAnimationFrame(() => this.animate());
  }
}

// ==========================================
// 2. 3D Card Tilt Physics
// ==========================================
function init3DCardTilt() {
  const cards = document.querySelectorAll('.digital-service-card, .revenue-card, .hub-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1, 1, 1)';
    });
  });
}

// ==========================================
// 3. Live Marathi/English Clock & Greeting
// ==========================================
function initLiveClock() {
  const clockEl = document.getElementById('live-clock-text');
  const greetingEl = document.getElementById('live-greeting-text');
  if (!clockEl) return;

  function update() {
    const now = new Date();
    
    // Time format (12h)
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    
    clockEl.textContent = `${hours12}:${minutes}:${seconds} ${ampm}`;

    // Greeting logic
    if (greetingEl) {
      let greeting = 'नमस्कार!';
      if (hours >= 5 && hours < 12) {
        greeting = '🌅 शुभ प्रभात';
      } else if (hours >= 12 && hours < 17) {
        greeting = '☀️ शुभ दुपार';
      } else if (hours >= 17 && hours < 21) {
        greeting = '🌇 शुभ संध्याकाळ';
      } else {
        greeting = '🌙 शुभ रात्री';
      }
      greetingEl.textContent = greeting;
    }
  }

  update();
  setInterval(update, 1000);
}

// ==========================================
// 4. Global QR Lightbox Modal & Actions
// ==========================================
let globalModalOverlay = null;

function ensureModal() {
  if (document.getElementById('global-qr-modal')) return;

  const modalHtml = `
    <div id="global-qr-modal" class="modal-overlay">
      <div class="modal-dialog">
        <button class="modal-close-btn" onclick="closeQRModal()" aria-label="Close">
          <i class="fas fa-times"></i>
        </button>
        <div class="modal-qr-frame">
          <img id="modal-qr-image" src="" alt="QR Code" />
        </div>
        <h3 id="modal-service-title" class="modal-title">सेवा शीर्षक</h3>
        <p id="modal-service-desc" class="modal-subtitle">मोबाईल कॅमेरा किंवा QR स्कॅनरने स्कॅन करा</p>
        <div class="modal-actions">
          <a id="modal-visit-btn" href="#" target="_blank" class="modal-btn-visit" onclick="playClickSound()">
            <i class="fas fa-external-link-alt"></i> थेट पोर्टल उघडा
          </a>
          <button id="modal-copy-btn" class="modal-btn-copy" onclick="copyServiceUrl()">
            <i class="fas fa-copy"></i> लिंक कॉपी
          </button>
        </div>
      </div>
    </div>
    <div id="toast-notice" class="toast-notice">
      <i class="fas fa-check-circle" style="color:#10b981;"></i>
      <span id="toast-text">यशस्वीरित्या कॉपी केले!</span>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  globalModalOverlay = document.getElementById('global-qr-modal');

  globalModalOverlay.addEventListener('click', (e) => {
    if (e.target === globalModalOverlay) closeQRModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeQRModal();
  });
}

let currentActiveUrl = '';

function openQRModal(title, desc, imgSrc, targetUrl) {
  ensureModal();
  playClickSound();

  document.getElementById('modal-service-title').textContent = title || 'ई-सेवा';
  document.getElementById('modal-service-desc').textContent = desc || 'पोर्टलवर जाण्यासाठी QR कोड स्कॅन करा किंवा खालील बटणावर क्लिक करा.';
  document.getElementById('modal-qr-image').src = imgSrc;
  
  const visitBtn = document.getElementById('modal-visit-btn');
  visitBtn.href = targetUrl || '#';
  currentActiveUrl = targetUrl || '';

  const modal = document.getElementById('global-qr-modal');
  modal.classList.add('active');
}

function closeQRModal() {
  const modal = document.getElementById('global-qr-modal');
  if (modal) modal.classList.remove('active');
}

function copyServiceUrl(urlToCopy) {
  const target = urlToCopy || currentActiveUrl;
  if (!target) return;

  navigator.clipboard.writeText(target).then(() => {
    showToast('पोर्टल लिंक कॉपी झाली!');
  }).catch(() => {
    showToast('लिंक: ' + target);
  });
}

function showToast(msg) {
  const toast = document.getElementById('toast-notice');
  const toastText = document.getElementById('toast-text');
  if (!toast) return;

  toastText.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// ==========================================
// 5. Live Search & Category Filter Engine
// ==========================================
function initSearchAndFilter() {
  const searchInput = document.getElementById('portal-search-input');
  const filterPills = document.querySelectorAll('.filter-pill');
  const countBadge = document.getElementById('results-count-badge');
  const items = document.querySelectorAll('.searchable-item');

  if (!items.length) return;

  function filterItems() {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const activePill = document.querySelector('.filter-pill.active');
    const activeCategory = activePill ? activePill.getAttribute('data-category') : 'all';

    let visibleCount = 0;

    items.forEach(item => {
      const title = (item.getAttribute('data-title') || item.textContent).toLowerCase();
      const desc = (item.getAttribute('data-desc') || '').toLowerCase();
      const category = item.getAttribute('data-category') || 'all';

      const matchesQuery = query === '' || title.includes(query) || desc.includes(query);
      const matchesCategory = activeCategory === 'all' || category === activeCategory;

      if (matchesQuery && matchesCategory) {
        item.style.display = '';
        item.style.opacity = '1';
        item.style.transform = 'scale(1)';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });

    if (countBadge) {
      countBadge.textContent = `${visibleCount} सेवा उपलब्ध`;
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterItems);
  }

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      playClickSound();
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      filterItems();
    });
  });
}

// ==========================================
// 6. Sound Effects Synthesizer (Web Audio API)
// ==========================================
let audioContext = null;
let soundEnabled = true;

function playClickSound() {
  if (!soundEnabled) return;
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start();
    osc.stop(audioContext.currentTime + 0.08);
  } catch (e) {
    // Audio unsupported or restricted
  }
}

function toggleAudioFeedback() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById('audio-toggle-btn');
  if (btn) {
    btn.innerHTML = soundEnabled 
      ? '<i class="fas fa-volume-up"></i> ध्वनी चालू' 
      : '<i class="fas fa-volume-mute"></i> ध्वनी बंद';
  }
  showToast(soundEnabled ? 'ध्वनी इफेक्ट्स चालू केले!' : 'ध्वनी इफेक्ट्स बंद केले!');
}

// ==========================================
// 7. Navigation & Mobile Menu Setup
// ==========================================
function initNavigation() {
  const navToggle = document.getElementById('mobile-nav-toggle');
  const navLinks = document.getElementById('main-nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const isOpen = navLinks.classList.contains('active');
      navToggle.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });
  }

  // Highlight active page
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// Helper wrapper functions
function openService(url, title, desc, qrImg) {
  if (qrImg) {
    openQRModal(title, desc, qrImg, url);
  } else {
    playClickSound();
    window.open(url, '_blank');
  }
}

function navigateToPage(page) {
  playClickSound();
  window.location.href = page;
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  new AmbientCanvas();
  init3DCardTilt();
  initLiveClock();
  ensureModal();
  initSearchAndFilter();
  initNavigation();
});
