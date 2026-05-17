/* ================================================================
   Mozzarella Marino — landing page interactivity
   ================================================================ */

(() => {
  'use strict';

  /* ---------- Year stamp in footer ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Scroll-triggered reveal ---------- */
  const revealTargets = document.querySelectorAll('.about');
  if (revealTargets.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('in-view'));
  }

  /* ---------- Mobile menu ---------- */
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuToggle && mobileMenu) {
    const closeMenu = () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.dataset.open = 'false';
      mobileMenu.hidden = true;
    };
    const openMenu = () => {
      menuToggle.setAttribute('aria-expanded', 'true');
      mobileMenu.dataset.open = 'true';
      mobileMenu.hidden = false;
    };

    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      expanded ? closeMenu() : openMenu();
    });

    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) closeMenu();
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
