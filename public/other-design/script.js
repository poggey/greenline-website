/* ============================================================
   GREENLINE HSE — interactions
   ============================================================ */
(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav scrolled state + progress line ---------- */
  const nav = document.getElementById('nav');
  const progressFill = document.getElementById('progressFill');

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressFill.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    updateStepsLine();
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile menu ---------- */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  const setMenu = (open) => {
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    mobileMenu.classList.toggle('open', open);
    mobileMenu.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!burger.classList.contains('open')));
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ---------- count-up numbers ---------- */
  const fmt = new Intl.NumberFormat('en-AU');
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      countObserver.unobserve(e.target);
      const el = e.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      if (prefersReduced) { el.textContent = fmt.format(target) + suffix; return; }
      const dur = 1800;
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt.format(Math.round(target * eased)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el));

  /* ---------- services accordion ---------- */
  document.querySelectorAll('.svc').forEach(svc => {
    svc.addEventListener('click', () => {
      const open = svc.classList.toggle('open');
      svc.setAttribute('aria-expanded', open);
    });
  });
  // draw icons in as they enter view
  const iconObserver = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('icon-in'), (i % 6) * 90);
        iconObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.svc').forEach(el => iconObserver.observe(el));

  /* ---------- process: green line fills with scroll ---------- */
  const steps = document.getElementById('steps');
  const stepsFill = document.getElementById('stepsFill');
  const stepEls = steps ? [...steps.querySelectorAll('.step')] : [];

  function updateStepsLine() {
    if (!steps) return;
    const rect = steps.getBoundingClientRect();
    const trigger = window.innerHeight * 0.62;
    const progress = Math.min(Math.max((trigger - rect.top) / rect.height, 0), 1);
    stepsFill.style.height = (progress * 100) + '%';
    stepEls.forEach(step => {
      const nodeRect = step.querySelector('.step-node').getBoundingClientRect();
      step.classList.toggle('lit', nodeRect.top + nodeRect.height / 2 < trigger);
    });
  }

  /* ---------- living-ground scene: parallax + safety hotspots ---------- */
  const scene = document.getElementById('scene');
  if (scene) {
    const layerBack = scene.querySelector('.layer-back');
    const layerFront = scene.querySelector('.layer-front');

    if (!prefersReduced && matchMedia('(pointer:fine)').matches) {
      const hero = document.querySelector('.hero');
      hero.addEventListener('mousemove', (ev) => {
        const dx = (ev.clientX / window.innerWidth - 0.5);
        layerBack.style.transform = `translateX(${dx * 26}px)`;
        layerFront.style.transform = `translateX(${dx * -14}px)`;
      });
      hero.addEventListener('mouseleave', () => {
        layerBack.style.transform = '';
        layerFront.style.transform = '';
      });
    }

    const tipEl = document.getElementById('sceneTip');
    const tipTitle = document.getElementById('tipTitle');
    const tipText = document.getElementById('tipText');
    let pinned = null;

    const showTip = (hs) => {
      tipTitle.textContent = hs.dataset.title;
      tipText.textContent = hs.dataset.text;
      tipEl.hidden = false;
      const r = hs.getBoundingClientRect();
      const s = scene.getBoundingClientRect();
      const tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
      let x = r.left - s.left + scene.scrollLeft + r.width / 2 - tw / 2;
      x = Math.max(10, Math.min(x, scene.scrollLeft + scene.clientWidth - tw - 10));
      let y = r.top - s.top - th - 14;
      if (y < 4) y = r.top - s.top + r.height + 14;
      tipEl.style.left = x + 'px';
      tipEl.style.top = y + 'px';
      tipEl.classList.add('show');
    };
    const hideTip = (force) => {
      if (pinned && !force) return;
      tipEl.classList.remove('show');
    };

    scene.querySelectorAll('.hs').forEach(hs => {
      hs.addEventListener('mouseenter', () => { if (!pinned) showTip(hs); });
      hs.addEventListener('mouseleave', () => hideTip(false));
      hs.addEventListener('focus', () => showTip(hs));
      hs.addEventListener('blur', () => { pinned = null; hideTip(true); });
      hs.addEventListener('click', (e) => {
        e.stopPropagation();
        if (pinned === hs) { pinned = null; hideTip(true); }
        else { pinned = hs; showTip(hs); }
      });
      hs.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hs.dispatchEvent(new Event('click')); }
      });
    });
    document.addEventListener('click', (e) => {
      if (pinned && !e.target.closest('.hs')) { pinned = null; hideTip(true); }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { pinned = null; hideTip(true); }
    });
    scene.addEventListener('scroll', () => { pinned = null; hideTip(true); }, { passive: true });
  }

  /* ---------- magnetic buttons ---------- */
  if (!prefersReduced && matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      btn.addEventListener('mousemove', (ev) => {
        const r = btn.getBoundingClientRect();
        const x = ev.clientX - r.left - r.width / 2;
        const y = ev.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Mayo → Australia travelling dot ---------- */
  const journeyPath = document.getElementById('journeyPath');
  const journeyDot = document.querySelector('.journey-dot');
  if (journeyPath && journeyDot && !prefersReduced) {
    const len = journeyPath.getTotalLength();
    let start = null;
    const DURATION = 5200;
    const move = (t) => {
      if (start === null) start = t;
      const p = ((t - start) % DURATION) / DURATION;
      // ease in-out, pause briefly at the end
      const eased = p < 0.9 ? (0.5 - 0.5 * Math.cos((p / 0.9) * Math.PI)) : 1;
      const pt = journeyPath.getPointAtLength(len * eased);
      journeyDot.setAttribute('cx', pt.x);
      journeyDot.setAttribute('cy', pt.y);
      requestAnimationFrame(move);
    };
    requestAnimationFrame(move);
  }

  onScroll();
})();
