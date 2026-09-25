// Levain Arena: mobile menu, current-section underline, scroll reveals, co-author interest form.
// The hero painting lives in painting.js.

// Where the interest form posts (for example a Formspree or Web3Forms endpoint).
// Empty means no inbox is connected yet, and the form says so instead of sending.
const FORM_ENDPOINT = '';

(() => {
  const menuButton = document.querySelector('.menu-btn');
  const nav = document.getElementById('site-nav');
  if (menuButton && nav) {
    const setOpen = open => {
      nav.classList.toggle('open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.textContent = open ? 'Close' : 'Menu';
    };
    menuButton.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    nav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); menuButton.focus(); }
    });
  }

  // Underline the nav link of the section crossing the middle of the screen.
  const links = [...document.querySelectorAll('.site-nav ul a')];
  if ('IntersectionObserver' in window && links.length) {
    let current = null;
    const show = id => links.forEach(a => a.classList.toggle('is-current', a.hash === '#' + id));
    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) current = entry.target.id;
        else if (current === entry.target.id) current = null;
      }
      show(current);
    }, {rootMargin: '-45% 0px -50% 0px'});
    links.forEach(a => { const section = document.querySelector(a.hash); if (section) io.observe(section); });
  }

  // Fade content in as it scrolls into view; the process band paints its circles in, and the footer logo
  // plays its entrance when it comes into view. Everything is shown at once when motion is reduced
  // or the page cannot observe scrolling.
  const reveal = [...document.querySelectorAll('.reveal, .steps, .lockup .logo')];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || !('IntersectionObserver' in window)) {
    reveal.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      }
    }, {rootMargin: '0px 0px -4% 0px'});
    reveal.forEach(el => io.observe(el));
  }

  const form = document.getElementById('interest');
  if (form) {
    const status = form.querySelector('.form-status');
    const button = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (form.elements.company.value) return; // honeypot: only bots fill the hidden field
      if (!FORM_ENDPOINT) {
        status.textContent = 'This form is not connected to an inbox yet.';
        return;
      }
      button.disabled = true;
      status.textContent = 'Sending…';
      try {
        const res = await fetch(FORM_ENDPOINT, {method: 'POST', body: new FormData(form), headers: {Accept: 'application/json'}});
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        status.textContent = 'Thank you. We will reply by email.';
      } catch {
        status.textContent = 'Sorry, your message could not be sent. Please try again later.';
      } finally {
        button.disabled = false;
      }
    });
  }
})();
