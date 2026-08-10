/* ===================== Theme toggle ===================== */
(function initTheme(){
  const saved = localStorage.getItem('mj-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      if (next === 'dark') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('mj-theme', next);
    });
  });
})();

/* ===================== Header scroll + mobile menu ===================== */
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  if (header){
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const mobilePanel = document.querySelector('.mobile-panel');
  const mobileClose = document.querySelector('.mobile-panel-close');
  if (mobileBtn && mobilePanel){
    mobileBtn.addEventListener('click', () => mobilePanel.classList.add('open'));
    mobileClose?.addEventListener('click', () => mobilePanel.classList.remove('open'));
    mobilePanel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobilePanel.classList.remove('open')));
  }

  /* ===================== Magnetic buttons (desktop only) ===================== */
  if (window.matchMedia('(hover:hover)').matches){
    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.25;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = 'translate(0,0)'; });
    });
  }

  /* ===================== Scroll reveal ===================== */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ===================== Animated counters ===================== */
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.getAttribute('data-count'), 10);
    let started = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !started){
          started = true;
          const duration = 1400;
          const start = performance.now();
          function tick(now){
            const p = Math.min(1, (now - start) / duration);
            el.textContent = Math.floor(p * target) + (el.dataset.suffix || '');
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = target + (el.dataset.suffix || '');
          }
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.4 });
    io.observe(el);
  });

  /* ===================== Service explorer ===================== */
  const serviceItems = document.querySelectorAll('.service-item');
  const serviceDetail = document.getElementById('service-detail-body');
  if (serviceItems.length && serviceDetail && window.SERVICES){
    function renderService(key){
      const s = window.SERVICES[key];
      if (!s) return;
      serviceDetail.innerHTML = `
        <span class="eyebrow">${s.eyebrow}</span>
        <h3>${s.title}</h3>
        <p>${s.description}</p>
        <div class="service-tags">${s.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <p class="complexity">Best for: ${s.bestFor} &nbsp;•&nbsp; Typical complexity: ${s.complexity}</p>
        <div class="service-cta">
          <a href="/login?intent=start&service=${encodeURIComponent(s.title)}" class="btn btn-primary magnetic">Discuss this project <span class="arrow">→</span></a>
        </div>`;
    }
    serviceItems.forEach(item => {
      item.addEventListener('click', () => {
        serviceItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        renderService(item.dataset.service);
      });
    });
    const firstKey = serviceItems[0]?.dataset.service;
    if (firstKey) renderService(firstKey);
  }

  /* ===================== Project fit checker ===================== */
  const fitPanel = document.querySelector('.fit-panel');
  if (fitPanel){
    const options = fitPanel.querySelectorAll('.fit-option');
    const resultBox = fitPanel.querySelector('.fit-result');
    const fitMap = {
      website: { service: 'Custom Website', step: 'Share pages needed + reference sites', complexity: 'Low–Medium' },
      webapp: { service: 'Custom Web App', step: 'Outline core features + user roles', complexity: 'Medium–High' },
      bot: { service: 'Discord / Telegram Bot', step: 'List commands + platform + integrations', complexity: 'Medium' },
      automation: { service: 'Automation System', step: 'Describe the manual process to automate', complexity: 'Medium' },
      dashboard: { service: 'Custom Dashboard / Admin Panel', step: 'Share data sources + who needs access', complexity: 'Medium–High' },
      unsure: { service: 'Discovery Call', step: 'Send a short brief — we\'ll shape it together', complexity: 'To be scoped' }
    };
    options.forEach(opt => {
      opt.addEventListener('click', () => {
        options.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const data = fitMap[opt.dataset.fit];
        if (data && resultBox){
          resultBox.innerHTML = `
            <span class="eyebrow">Suggested path</span>
            <h4 style="margin:10px 0 6px;">${data.service}</h4>
            <p class="mono" style="font-size:13px;">Next step: ${data.step}</p>
            <p class="complexity">Approximate complexity: ${data.complexity}</p>
            <a href="/login?intent=start" class="btn btn-primary magnetic" style="margin-top:10px;">Send a brief <span class="arrow">→</span></a>`;
          resultBox.classList.add('show');
        }
      });
    });
  }

  /* ===================== Process timeline ===================== */
  const steps = document.querySelectorAll('.timeline-step');
  const progress = document.querySelector('.timeline-progress');
  if (steps.length){
    function activate(idx){
      steps.forEach((s, i) => s.classList.toggle('active', i === idx));
      if (progress){
        const target = steps[idx];
        const h = target.offsetTop + target.querySelector('.step-marker').offsetHeight / 2;
        progress.style.height = h + 'px';
      }
    }
    steps.forEach((s, i) => s.addEventListener('click', () => activate(i)));
    activate(0);
  }

  /* ===================== Legal modals ===================== */
  document.querySelectorAll('[data-modal-target]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = document.querySelector(trigger.dataset.modalTarget);
      modal?.classList.add('open');
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
    overlay.querySelector('.modal-close')?.addEventListener('click', () => overlay.classList.remove('open'));
  });
});

/* ===================== Firebase (loaded on pages that need auth) ===================== */
window.initFirebaseAuth = function initFirebaseAuth(){
  const cfg = window.__FIREBASE_CONFIG__;
  if (!cfg || !window.firebase) return null;
  if (!firebase.apps?.length) firebase.initializeApp(cfg);
  return firebase;
};
