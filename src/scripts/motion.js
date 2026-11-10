/* =================================================================
   Greenline HSE — Motion & interaction (§11)
   ALL motion is GSAP-driven and wrapped in gsap.matchMedia() so it can
   be dialled fully off. Everything must still look finished with motion
   off (prefers-reduced-motion). UI behaviour (nav, form) runs regardless.
   ================================================================= */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// SplitText shipped free in the gsap package, but guard the import so a
// missing build artefact can never break the page.
let SplitText = null;
try {
  ({ SplitText } = await import('gsap/SplitText'));
} catch (_) {
  /* fall back to whole-headline reveal */
}

// Shared so the back-to-top button can scroll smoothly when motion is on.
let lenis = null;

gsap.registerPlugin(ScrollTrigger);
if (SplitText) gsap.registerPlugin(SplitText);

/* -----------------------------------------------------------------
   Helpers
   ----------------------------------------------------------------- */
const setDash = (el) => {
  const len = el.getTotalLength();
  gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
  return len;
};

const formatNumber = (n, decimals) => {
  const fixed = Number(n).toFixed(decimals);
  // group thousands on the integer part only
  const [int, dec] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec ? `${grouped}.${dec}` : grouped;
};

/* =================================================================
   1. UI behaviour — always on (not motion-dependent)
   ================================================================= */
function initUI() {
  const header = document.querySelector('[data-header]');
  const toTop = document.querySelector('[data-to-top]');
  const onScroll = () => {
    // Header: shadow/border once scrolled
    if (header) {
      if (window.scrollY > 20) header.setAttribute('data-scrolled', '');
      else header.removeAttribute('data-scrolled');
    }
    // Back-to-top: reveal after the user is past the first screen
    if (toTop) toTop.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.6);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Back-to-top: smooth via Lenis when motion is on, native otherwise
  if (toTop) {
    toTop.addEventListener('click', () => {
      if (lenis) lenis.scrollTo(0, { duration: 1 });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Mobile nav toggle
  const toggle = document.querySelector('[data-nav-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');
  if (toggle && mobileNav) {
    const close = () => {
      toggle.setAttribute('aria-expanded', 'false');
      mobileNav.hidden = true;
    };
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      mobileNav.hidden = open;
    });
    mobileNav.querySelectorAll('[data-mobile-link]').forEach((a) => a.addEventListener('click', close));
  }
}

/* -----------------------------------------------------------------
   Services prev/next arrows — replace the old numbered cards.
   Works in both modes: when the section is pinned (desktop, motion on)
   horizontal travel is mapped 1:1 to vertical scroll, so we nudge the page;
   otherwise the track is a normal overflow-x row, so we scrollBy on it.
   ----------------------------------------------------------------- */
function initServicesArrows() {
  const trackOuter = document.querySelector('[data-track-outer]');
  const track = document.querySelector('[data-track]');
  const prev = document.querySelector('[data-services-prev]');
  const next = document.querySelector('[data-services-next]');
  if (!trackOuter || !track || !prev || !next) return;

  // One card plus the column gap — how far a single arrow press travels.
  const step = () => {
    const card = track.children[0];
    if (!card) return 320;
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap) || 0;
    return card.offsetWidth + gap;
  };

  const go = (dir) => {
    if (trackOuter.hasAttribute('data-pinned')) {
      // Pinned desktop: advance the page; the ScrollTrigger scrub moves the track.
      const target = window.scrollY + dir * step();
      if (lenis) lenis.scrollTo(target, { duration: 0.6 });
      else window.scrollTo({ top: target, behavior: 'smooth' });
    } else {
      trackOuter.scrollBy({ left: dir * step(), behavior: 'smooth' });
    }
  };

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
}

/* =================================================================
   2. Motion — wrapped in matchMedia (§11 non-negotiable)
   ================================================================= */
function initMotion() {
  const mm = gsap.matchMedia();

  /* ---------- FULL MOTION ----------
     Both conditions bake in `prefers-reduced-motion: no-preference`, so this
     callback runs ONLY when motion is allowed (and `isDesktop` just branches
     desktop-only behaviour like the pin/cursor). Under reduced motion neither
     query matches, so no Lenis / no scroll animation is created. */
  mm.add(
    {
      isDesktop: '(min-width: 901px) and (prefers-reduced-motion: no-preference)',
      isMobile: '(max-width: 900px) and (prefers-reduced-motion: no-preference)',
    },
    (ctx) => {
      const { isDesktop } = ctx.conditions;
      document.documentElement.classList.add('js-motion');

      // Lenis smooth scroll, driven by GSAP ticker
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
      lenis.on('scroll', ScrollTrigger.update);
      const tick = (time) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      // Keep anchor links smooth through Lenis
      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
          const id = a.getAttribute('href');
          if (id.length < 2) return;
          const target = document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          lenis.scrollTo(target, { offset: -72 });
        });
      });

      // --- 5. SplitText headline reveals ---
      document.querySelectorAll('[data-split]').forEach((el) => {
        if (SplitText) {
          const split = new SplitText(el, { type: 'words,lines', linesClass: 'split-line' });
          // Mask each line so words rise from behind it. The padding/negative
          // margin keeps glyph descenders inside the clip during the reveal;
          // overflow is restored on complete so nothing stays clipped.
          split.lines.forEach((l) => {
            l.style.overflow = 'hidden';
            l.style.paddingBottom = '0.15em';
            l.style.marginBottom = '-0.15em';
          });
          gsap.from(split.words, {
            yPercent: 110,
            opacity: 0,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.06,
            scrollTrigger: { trigger: el, start: 'top 85%' },
            onComplete: () => split.lines.forEach((l) => (l.style.overflow = 'visible')),
          });
        } else {
          gsap.from(el, {
            opacity: 0,
            y: 28,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%' },
          });
        }
      });

      // --- generic data-reveal fades ---
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
      });

      // --- kinetic word-swap hero (alt3): cycle one word in the headline ---
      const swap = document.querySelector('[data-word-swap]');
      if (swap) {
        let words = [];
        try {
          words = JSON.parse(swap.dataset.words || '[]');
        } catch (_) {
          words = [];
        }
        if (words.length > 1) {
          // First word is already in the HTML and visible immediately; the
          // timeline only starts swapping after the initial hold.
          const tl = gsap.timeline({ repeat: -1 });
          words.forEach((_, i) => {
            const next = words[(i + 1) % words.length];
            tl.to(swap, { yPercent: -45, opacity: 0, duration: 0.32, ease: 'power2.in', delay: 1.8 });
            tl.add(() => {
              swap.textContent = next;
            });
            tl.fromTo(
              swap,
              { yPercent: 45, opacity: 0 },
              { yPercent: 0, opacity: 1, duration: 0.42, ease: 'power2.out', immediateRender: false }
            );
          });
        }
      }

      // --- editorial gallery hero (alt): cards rise in, then gently parallax ---
      const galleryCards = gsap.utils.toArray('[data-card]');
      if (galleryCards.length) {
        gsap.from(galleryCards, {
          yPercent: 22,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
          stagger: 0.09,
          delay: 0.25,
        });
        galleryCards.forEach((c, i) => {
          gsap.to(c, {
            yPercent: -6 - (i % 2 === 0 ? 0 : 6),
            ease: 'none',
            scrollTrigger: { trigger: '[data-hero-gallery]', start: 'top 80%', end: 'bottom top', scrub: true },
          });
        });
      }

      // --- 1. The through-line: a progress rail that fills with scroll ---
      const throughFill = document.querySelector('[data-through-fill]');
      if (throughFill) {
        gsap.fromTo(
          throughFill,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: document.documentElement,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.4,
            },
          }
        );
      }

      // --- hero line draws on load, then nudges on scroll (the horizon) ---
      const heroPath = document.querySelector('[data-hero-path]');
      if (heroPath) {
        setDash(heroPath);
        gsap.to(heroPath, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', delay: 0.2 });
      }
      // --- 2. horizon shift: the land/horizon parallaxes gently as hero leaves ---
      const heroHorizon = document.querySelector('.hero__horizon');
      if (heroHorizon) {
        gsap.to(heroHorizon, {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true },
        });
      }
      // --- 6. clip-path wipe for the dark stat band ---
      const band = document.querySelector('[data-stat-band]');
      if (band) {
        gsap.fromTo(
          band,
          { clipPath: 'inset(0 100% 0 0)' },
          {
            clipPath: 'inset(0 0% 0 0)',
            ease: 'power2.out',
            duration: 1,
            scrollTrigger: { trigger: band, start: 'top 80%' },
          }
        );
      }

      // --- 3. count-up stats ---
      gsap.utils.toArray('[data-count]').forEach((el) => {
        const end = parseFloat(el.dataset.count);
        const decimals = parseInt(el.dataset.decimals || '0', 10);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const obj = { val: 0 };
        gsap.to(obj, {
          val: end,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%' },
          onUpdate: () => {
            el.textContent = prefix + formatNumber(obj.val, decimals) + suffix;
          },
        });
      });

      // --- thin Hi-Vis baselines under stat groups draw in (CSS scaleX) ---
      gsap.utils.toArray('.stat-band__list').forEach((grp) => {
        ScrollTrigger.create({
          trigger: grp,
          start: 'top 80%',
          onEnter: () => grp.classList.add('is-drawn'),
        });
      });

      // --- 4. pinned horizontal services scroll (desktop only) ---
      // Pin the WHOLE section so the kicker + heading + lede stay on screen
      // while the cards travel sideways beneath them.
      const servicesSection = document.querySelector('[data-services]');
      const trackOuter = document.querySelector('[data-track-outer]');
      const track = document.querySelector('[data-track]');
      if (isDesktop && servicesSection && trackOuter && track) {
        trackOuter.setAttribute('data-pinned', '');
        const cards = track.children;
        const lastCard = cards[cards.length - 1];
        // Stop so the last card's right edge lands one gutter in from the
        // viewport edge (a bit of padding on the right), not flush against it.
        const getDistance = () => {
          const gutter = parseFloat(getComputedStyle(track).paddingRight) || 0;
          const cardRight = lastCard.offsetLeft + lastCard.offsetWidth;
          return Math.max(0, cardRight + gutter - trackOuter.clientWidth);
        };
        gsap.to(track, {
          x: () => -getDistance(),
          ease: 'none',
          scrollTrigger: {
            trigger: servicesSection,
            start: 'top top',
            end: () => '+=' + getDistance(),
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
      }

      // --- 8. parallax on image placeholders / flagship slots ---
      gsap.utils.toArray('.placeholder').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 24 },
          {
            y: -24,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
          }
        );
      });

      // --- 7. magnetic CTAs (desktop, fine pointer) ---
      if (isDesktop && window.matchMedia('(pointer: fine)').matches) {
        document.querySelectorAll('[data-magnetic]').forEach((btn) => {
          const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
          const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
          btn.addEventListener('mousemove', (e) => {
            const r = btn.getBoundingClientRect();
            xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
            yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
          });
          btn.addEventListener('mouseleave', () => {
            xTo(0);
            yTo(0);
          });
        });
      }

      ScrollTrigger.refresh();

      return () => {
        // cleanup when this media query no longer matches
        gsap.ticker.remove(tick);
        lenis.destroy();
        lenis = null;
        document.documentElement.classList.remove('js-motion');
        if (trackOuter) trackOuter.removeAttribute('data-pinned');
      };
    }
  );

  /* ---------- REDUCED MOTION: ensure everything is visible & static ---------- */
  mm.add('(prefers-reduced-motion: reduce)', () => {
    document.documentElement.classList.remove('js-motion');
    // draw all lines instantly (no animation), reveal all content
    document.querySelectorAll('[data-hero-path]')
      .forEach((el) => gsap.set(el, { strokeDasharray: 'none', strokeDashoffset: 0 }));
    // progress rail sits empty when motion is off
    gsap.set('[data-reveal]', { opacity: 1, y: 0 });
    // fill in final stat values without counting
    document.querySelectorAll('[data-count]').forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      el.textContent = (el.dataset.prefix || '') + formatNumber(end, decimals) + (el.dataset.suffix || '');
    });
    return () => {};
  });
}

/* ----------------------------------------------------------------- */
initUI();
initServicesArrows();
initMotion();
