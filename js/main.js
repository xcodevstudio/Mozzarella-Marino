/* ================================================================
   Mozzarella Marino — landing page interactivity
   ================================================================ */

(() => {
  'use strict';

  /* ---------- Year stamp in footer ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Lock viewport: block pinch-zoom on iOS Safari
     (which ignores user-scalable=no since iOS 10).
     Use ONLY gesture* events — NOT touchmove — because a non-passive touchmove
     listener disables compositor-thread scrolling and makes the page feel laggy.
     touch-action: pan-y in CSS already handles pinch on iOS 14+. */
  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

  // Block desktop ctrl+wheel zoom
  document.addEventListener('wheel', (e) => {
    if (e.ctrlKey) e.preventDefault();
  }, { passive: false });

  /* ---------- Force autoplay on every <video> on the page ----
     iOS Safari and some Android browsers refuse autoplay without a user
     gesture OR strict muted+playsinline. We force every flag and then
     retry play() on every conceivable event until the videos are playing. */
  const autoplayVideos = Array.from(document.querySelectorAll('.hero-video, .mascot-video'));
  if (autoplayVideos.length) {
    autoplayVideos.forEach(v => {
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.controls = false;
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.setAttribute('autoplay', '');
      v.removeAttribute('controls');
      // Force a reload so the new source order (mp4 first) takes effect on iOS
      try { v.load(); } catch (e) {}
    });

    const heroSection = document.querySelector('.hero');
    const markHeroPlaying = () => { if (heroSection) heroSection.classList.add('is-playing'); };

    const tryPlayAll = () => {
      autoplayVideos.forEach(v => {
        v.muted = true;
        if (v.paused || v.ended) {
          const p = v.play();
          if (p && typeof p.then === 'function') {
            p.then(() => {
              if (v.classList.contains('hero-video')) markHeroPlaying();
            }).catch(() => {});
          } else if (!v.paused && v.classList.contains('hero-video')) {
            markHeroPlaying();
          }
        } else if (v.classList.contains('hero-video')) {
          markHeroPlaying();
        }
      });
    };

    // When the hero video genuinely starts playing, fade out the poster overlay
    const heroVideo = autoplayVideos.find(v => v.classList.contains('hero-video'));
    if (heroVideo) {
      ['playing', 'timeupdate'].forEach(ev => {
        heroVideo.addEventListener(ev, markHeroPlaying);
      });
    }

    tryPlayAll();
    autoplayVideos.forEach(v => {
      ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'pause', 'stalled', 'suspend', 'emptied'].forEach(ev => {
        v.addEventListener(ev, tryPlayAll);
      });
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) tryPlayAll();
    });
    window.addEventListener('pageshow', tryPlayAll);
    window.addEventListener('focus', tryPlayAll);
    window.addEventListener('orientationchange', tryPlayAll);

    // First user interaction triggers a play attempt — required when iOS Low Power Mode
    // blocked autoplay. Single-shot to avoid scroll-time work.
    const firstGesture = () => {
      tryPlayAll();
      ['touchstart', 'pointerdown', 'click'].forEach(ev => {
        document.removeEventListener(ev, firstGesture);
      });
    };
    ['touchstart', 'pointerdown', 'click'].forEach(ev => {
      document.addEventListener(ev, firstGesture, { passive: true, once: false });
    });

    // Stop the heartbeat early once all videos are playing — running every 500ms
    // forever was contributing to perceived lag on mobile.
    let ticks = 0;
    const heartbeat = setInterval(() => {
      tryPlayAll();
      ticks++;
      const allPlaying = autoplayVideos.every(v => !v.paused);
      if (allPlaying || ticks >= 20) clearInterval(heartbeat);
    }, 600);
  }

  /* ---------- Contact section reveal (photos fly in from outside) ---------- */
  const contactSection = document.querySelector('#contact');
  if (contactSection && 'IntersectionObserver' in window) {
    const contactIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          contactIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    contactIO.observe(contactSection);
  } else if (contactSection) {
    contactSection.classList.add('in-view');
  }

  /* ---------- Scroll-driven upward drift + subtle scale on floats ----
     Motion starts once the section has entered the viewport by ~25%
     (section.top crosses 75% of viewport height from the top).
     Items also gain a small amount of size (0.88 → 1.0) for life. */
  const wraps = Array.from(document.querySelectorAll('.float-wrap')).map(el => ({
    el,
    section: el.closest('section'),
    rot: parseFloat(el.dataset.rot || '0'),
    speed: parseFloat(el.dataset.speed || '0.4'),
    lastShift: -1,
  })).filter(w => w.section);

  if (wraps.length) {
    // Promote each float to its own GPU compositing layer so transform updates
    // don't repaint surrounding content — biggest single mobile-scroll perf win.
    wraps.forEach(w => {
      w.el.style.willChange = 'transform';
      w.el.style.backfaceVisibility = 'hidden';
    });

    let raf = null;
    const update = () => {
      raf = null;
      const vh = window.innerHeight;
      const trigger = vh * 0.75;
      for (const w of wraps) {
        // Cheap visibility check via the parent section before forcing layout on the float itself
        const sRect = w.section.getBoundingClientRect();
        if (sRect.bottom < -vh || sRect.top > vh * 2) continue;
        const rect = w.el.getBoundingClientRect();
        const scrolledPast = Math.max(0, trigger - rect.top);
        // Skip the style write if the transform hasn't meaningfully changed
        if (Math.abs(scrolledPast - w.lastShift) < 0.5) continue;
        w.lastShift = scrolledPast;
        const upShift = scrolledPast * w.speed;
        const t = Math.min(1, scrolledPast / (vh * 0.9));
        const eased = 1 - Math.pow(1 - t, 3);
        const scale = 0.92 + eased * 0.08;
        w.el.style.transform = `translate3d(0, ${-upShift}px, 0) rotate(${w.rot}deg) scale(${scale})`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }


  /* ---------- Mobile menu ---------- */
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuToggle && mobileMenu) {
    mobileMenu.hidden = false;

    const closeMenu = () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.dataset.open = 'false';
    };
    const openMenu = () => {
      menuToggle.setAttribute('aria-expanded', 'true');
      mobileMenu.dataset.open = 'true';
    };

    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      expanded ? closeMenu() : openMenu();
    });

    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', (e) => {
      if (menuToggle.getAttribute('aria-expanded') === 'true' &&
          !mobileMenu.contains(e.target) &&
          !menuToggle.contains(e.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
      }
    });
  }

  /* ---------- Contact form ---------- */
  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitBtn = form.querySelector('.form-submit');
  const statusEl = form.querySelector('.form-status');

  const setStatus = (message, state) => {
    statusEl.textContent = message;
    if (state) statusEl.dataset.state = state;
    else delete statusEl.dataset.state;
  };

  const setLoading = (loading) => {
    submitBtn.disabled = loading;
    submitBtn.dataset.loading = loading ? 'true' : 'false';
  };

  const validate = (data) => {
    const errors = {};
    if (!data.name || data.name.trim().length < 2) errors.name = 'Please enter your name.';
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Please enter a valid email.';
    if (!data.message || data.message.trim().length < 10) errors.message = 'Please enter a message (10+ characters).';
    return errors;
  };

  const markFieldInvalid = (name, invalid) => {
    const field = form.querySelector(`[name="${name}"]`);
    if (field) field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {
      name: (formData.get('name') || '').toString().trim(),
      email: (formData.get('email') || '').toString().trim(),
      phone: (formData.get('phone') || '').toString().trim(),
      message: (formData.get('message') || '').toString().trim(),
      website: (formData.get('website') || '').toString(), // honeypot
    };

    ['name', 'email', 'message'].forEach(n => markFieldInvalid(n, false));

    const errors = validate(data);
    if (Object.keys(errors).length) {
      Object.keys(errors).forEach(n => markFieldInvalid(n, true));
      setStatus(Object.values(errors)[0], 'error');
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Silently drop bot submissions
    if (data.website) {
      setStatus('Thanks — your message has been sent.', 'success');
      form.reset();
      return;
    }

    setLoading(true);
    setStatus('Sending…', null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.error || 'Something went wrong. Please try again.');
      }

      setStatus('Thanks — your message has been sent. We will be in touch soon.', 'success');
      form.reset();
    } catch (err) {
      setStatus(err.message || 'Could not send your message. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  });
})();
