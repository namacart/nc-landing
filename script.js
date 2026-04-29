// ── Nav ──
function toggleMenu() {
  document.getElementById('nav-links').classList.toggle('open');
  document.querySelector('.nav-hamburger').classList.toggle('active');
}
function closeMenu() {
  document.getElementById('nav-links').classList.remove('open');
  document.querySelector('.nav-hamburger').classList.remove('active');
}

// ── Tab switcher ──
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.form-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + tab));
}

// ── Scroll helpers ──
function scrollToHero(tab) {
  switchTab(tab);
  document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
}

function scrollToRegister() {
  document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
}

// ── Form submission ──
async function submitForm(type, btn) {
  // Field validation
  const required = {
    customer: ['c-name', 'c-phone', 'c-email', 'c-area'],
    vendor:   ['v-name', 'v-phone', 'v-shopname', 'v-type', 'v-address']
  };

  let valid = true;
  required[type].forEach(id => {
    const el = document.getElementById(id);
    if (!el || !el.value.trim()) {
      valid = false;
      el.style.borderColor = 'var(--orange)';
      el.style.boxShadow   = '0 0 0 3px rgba(255,107,43,0.15)';
    } else {
      el.style.borderColor = '';
      el.style.boxShadow   = '';
    }
  });

  if (!valid) {
    const firstInvalid = required[type].find(id => {
      const el = document.getElementById(id);
      return !el || !el.value.trim();
    });
    if (firstInvalid) document.getElementById(firstInvalid).focus();
    return;
  }

  // Loading state
  btn.disabled = true;
  btn.querySelector('.spinner').style.display = 'inline-block';
  btn.querySelector('.btn-text').style.opacity = '0.5';

  // Collect form data
  const entry = { type, timestamp: new Date().toISOString() };
  if (type === 'customer') {
    entry.data = {
      name:  document.getElementById('c-name').value,
      phone: document.getElementById('c-phone').value,
      email: document.getElementById('c-email').value,
      area:  document.getElementById('c-area').value,
      lang:  document.getElementById('c-lang').value
    };
    entry.whatsappOptIn = document.getElementById('c-notify').checked;
  } else {
    entry.data = {
      name:      document.getElementById('v-name').value,
      phone:     document.getElementById('v-phone').value,
      shopname:  document.getElementById('v-shopname').value,
      shoptype:  document.getElementById('v-type').value,
      address:   document.getElementById('v-address').value,
      customers: document.getElementById('v-customers').value,
      lang:      document.getElementById('v-lang').value
    };
    entry.whatsappOptIn = document.getElementById('v-notify').checked;
  }

  try {
    // Attempt API submission
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Server error');
    }
  } catch (err) {
    // Silently fall through — localStorage is the source of truth for now
    console.warn('API unavailable, using local fallback:', err.message);
  } finally {
    // Always persist locally and show success
    persistToLocalStorage(entry);
    updateCounters();

    document.getElementById('form-body-' + type).style.display = 'none';
    document.getElementById('success-' + type).style.display   = 'block';
    launchConfetti();

    // Reset button state
    btn.disabled = false;
    btn.querySelector('.spinner').style.display = 'none';
    btn.querySelector('.btn-text').style.opacity = '1';
  }
}

// ── Local storage persistence ──
function persistToLocalStorage(entry) {
  try {
    const all = JSON.parse(localStorage.getItem('nc_registrations') || '[]');
    all.push(entry);
    localStorage.setItem('nc_registrations', JSON.stringify(all));
  } catch (e) {
    console.error('localStorage write failed:', e);
  }
}

// ── Counter update ──
function updateCounters() {
  try {
    const all   = JSON.parse(localStorage.getItem('nc_registrations') || '[]');
    const base  = { customer: 47, vendor: 12 };
    const count = { customer: 0, vendor: 0 };
    all.forEach(e => { count[e.type] = (count[e.type] || 0) + 1; });
    animateCounter('counter-customers', base.customer + count.customer);
    animateCounter('counter-shops',     base.vendor   + count.vendor);
  } catch (e) {}
}

// ── Animated counter ──
function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const dur   = 800;
  const s     = Date.now();
  const tick  = () => {
    const p = Math.min((Date.now() - s) / dur, 1);
    el.textContent = Math.round(start + (target - start) * p);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ── Confetti ──
function launchConfetti() {
  const colors = ['#FF6B2B', '#13C47A', '#fff', '#FFD700', '#0D1B2A'];
  for (let i = 0; i < 70; i++) {
    const el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:20%',
      `left:${20 + Math.random() * 60}%`,
      `width:${6 + Math.random() * 6}px`,
      `height:${6 + Math.random() * 6}px`,
      `border-radius:${Math.random() > 0.5 ? '50%' : '3px'}`,
      `background:${colors[Math.floor(Math.random() * colors.length)]}`,
      'pointer-events:none',
      'z-index:9999',
      `transition:transform ${0.6 + Math.random() * 0.8}s ease,opacity ${0.5 + Math.random() * 0.8}s ease`
    ].join(';');
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = `translate(${(Math.random() - 0.5) * 360}px, ${200 + Math.random() * 250}px) rotate(${Math.random() * 360}deg)`;
      el.style.opacity   = '0';
    });
    setTimeout(() => el.remove(), 2000);
  }
}

// ── Scroll reveal ──
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// ── Cycling hero language highlight ──
const langs = document.querySelectorAll('.hero-lang');
let langIdx = 0;
setInterval(() => {
  langs.forEach(l => l.classList.remove('active'));
  langIdx = (langIdx + 1) % langs.length;
  langs[langIdx].classList.add('active');
}, 2200);

// ── Init ──
updateCounters();