/* SLGS static interactions: scroll reveal, active nav, hero parallax, and mailto form */

(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal on scroll
  if (!prefersReduced) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add('in');
        }
      },
      { threshold: 0.14 }
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
  }

  // Active section highlight
  const navLinks = [...document.querySelectorAll('[data-nav]')];
  const targetIds = [...new Set(navLinks.map((a) => (a.getAttribute('href') || '').replace('#', '')).filter(Boolean))];
  const sectionById = new Map(targetIds.map((id) => [id, document.getElementById(id)]).filter(([, el]) => !!el));

  function setActive(id) {
    navLinks.forEach((a) => a.setAttribute('data-active', a.getAttribute('href') === `#${id}` ? 'true' : 'false'));
  }

  if (navLinks.length) {
    const activeIO = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible && visible.target && visible.target.id) setActive(visible.target.id);
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0.12, 0.18, 0.25] }
    );

    sectionById.forEach((section) => activeIO.observe(section));

    // On hash change / initial load
    const initialId = (location.hash || '#home').slice(1);
    if (sectionById.has(initialId)) {
      setActive(initialId);
    } else if (targetIds.length) {
      setActive(targetIds[0]);
    }
  }

  // Hero parallax-like effect
  const hero = document.querySelector('[data-hero]');
  const atmos = document.querySelector('.atmos');

  if (!prefersReduced) {
    window.addEventListener(
      'mousemove',
      (e) => {
        if (!hero || !atmos) return;
        const x = (e.clientX / window.innerWidth - 0.5) * 10;
        const y = (e.clientY / window.innerHeight - 0.5) * 10;
        hero.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      },
      { passive: true }
    );

    window.addEventListener(
      'scroll',
      () => {
        if (!atmos) return;
        const s = window.scrollY;
        atmos.style.transform = `translate3d(0, ${Math.min(s * 0.03, 18)}px, 0)`;
      },
      { passive: true }
    );
  }

  // Join / Contact form -> mailto (static-friendly)
  const form = document.querySelector('[data-mailto-form]');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.getAttribute('data-to') || 'slgsunimelb@gmail.com';

      const name = (form.querySelector('[name="name"]')?.value || '').trim();
      const subject = (form.querySelector('[name="subject"]')?.value || 'SLGS Enquiry').trim();
      const message = (form.querySelector('[name="message"]')?.value || '').trim();

      const body = [
        name ? `Name: ${name}` : null,
        '',
        message,
        '',
        '—',
        'Sent from slgs website'
      ]
        .filter(Boolean)
        .join('\n');

      const url = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = url;
    });
  }

  // Shared header loader
  const headerHost = document.querySelector('[data-header]');
  if (headerHost) {
    const base = location.pathname.includes('/pages/') ? '../..' : '.';
    const headerUrl = `${base}/assets/partials/header.html`;

    fetch(headerUrl)
      .then((res) => (res.ok ? res.text() : Promise.reject(res.status)))
      .then((html) => {
        const resolved = html.split('{{BASE}}').join(base);

        headerHost.outerHTML = resolved;

        const current = headerHost.getAttribute('data-header-page');
        if (current) {
          const link = document.querySelector(`[data-page="${current}"]`);
          if (link) link.setAttribute('aria-current', 'page');
        }
      })
      .catch(() => {
        // Fail silently for static-only environments.
      });
  }

  // Shared footer loader
  const footerHost = document.querySelector('[data-footer]');
  if (footerHost) {
    const base = location.pathname.includes('/pages/') ? '../..' : '.';
    const footerUrl = `${base}/assets/partials/footer.html`;

    fetch(footerUrl)
      .then((res) => (res.ok ? res.text() : Promise.reject(res.status)))
      .then((html) => {
        const resolved = html.split('{{BASE}}').join(base);
        footerHost.outerHTML = resolved;
      })
      .catch(() => {
        // Fail silently for static-only environments.
      });
  }
})();
