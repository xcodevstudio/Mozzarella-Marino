/* ================================================================
   Mozzarella Marino — landing page interactivity
   ================================================================ */

(() => {
  'use strict';

  /* ---------- Year stamp in footer ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Scroll-driven upward drift + subtle scale on floats ----
     Motion starts once the section has entered the viewport by ~25%
     (section.top crosses 75% of viewport height from the top).
     Items also gain a small amount of size (0.88 → 1.0) for life. */
  const wraps = Array.from(document.querySelectorAll('.float-wrap')).map(el => ({
    el,
    section: el.closest('section'),
    rot: parseFloat(el.dataset.rot || '0'),
    speed: parseFloat(el.dataset.speed || '0.4'),
  })).filter(w => w.section);

  if (wraps.length) {
    let raf = null;
    const update = () => {
      raf = null;
      const vh = window.innerHeight;
      const trigger = vh * 0.75; // each item starts moving when ITS OWN top crosses this line
      for (const w of wraps) {
        const rect = w.el.getBoundingClientRect();
        const scrolledPast = Math.max(0, trigger - rect.top);
        const upShift = scrolledPast * w.speed;
        // Subtle grow: 0.92 → 1.0 over a longer scroll distance, eased for organic feel
        const t = Math.min(1, scrolledPast / (vh * 0.9));
        const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
        const scale = 0.92 + eased * 0.08;
        w.el.style.transform = `translateY(${-upShift}px) rotate(${w.rot}deg) scale(${scale})`;
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
