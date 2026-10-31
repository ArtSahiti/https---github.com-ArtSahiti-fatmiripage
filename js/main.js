(() => {
  const body = document.body;
  body.classList.add('loading');

  // Split hero title into words for the staggered reveal
  document.querySelectorAll('.split').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words
      .map((w, i) => `<span class="word"><span style="--i:${i}">${w}</span></span>`)
      .join(' ');
  });

  // Preloader
  const finishLoading = () => {
    document.getElementById('preloader').classList.add('done');
    body.classList.remove('loading');
    body.classList.add('ready');
    document.querySelectorAll('.hero .reveal').forEach((el) => el.classList.add('in'));
  };
  window.addEventListener('load', () => setTimeout(finishLoading, 500));
  setTimeout(finishLoading, 3000); // fallback if an asset hangs

  // Scroll reveals
  const pending = new Set(document.querySelectorAll('.reveal:not(.hero .reveal), .img-reveal, .process-line'));
  const revealEl = (el) => {
    if (!pending.delete(el)) return;
    el.classList.add('in');
    // Drop the reveal styles once done so the element's own hover transitions take over
    if (el.classList.contains('reveal')) {
      setTimeout(() => el.classList.remove('reveal', 'in'), 1800);
    }
  };
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealEl(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0, rootMargin: '0px 0px -60px 0px' }
  );
  pending.forEach((el) => io.observe(el));

  // Safety net: reveal anything already scrolled into or past the viewport
  const sweep = () => {
    pending.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) revealEl(el);
    });
  };
  window.addEventListener('scroll', () => requestAnimationFrame(sweep), { passive: true });
  window.addEventListener('load', sweep);

  // Header: shadow on scroll, hide on scroll down, show on scroll up
  const header = document.getElementById('header');
  const nav = document.getElementById('nav');
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 60);
    const menuOpen = nav.classList.contains('open');
    header.classList.toggle('hidden', !menuOpen && y > 400 && y > lastY);
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Active nav link
  const links = [...nav.querySelectorAll('a[href^="#"]:not(.btn)')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const navIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
        }
      });
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  sections.forEach((s) => navIO.observe(s));

  // Mobile menu
  const burger = document.getElementById('burger');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  });
  nav.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', false);
    })
  );

  // Hero parallax
  const parallax = document.querySelectorAll('[data-parallax]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && parallax.length) {
    let ticking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          parallax.forEach((el) => {
            const speed = parseFloat(el.dataset.parallax);
            el.style.transform = `translate3d(0, ${window.scrollY * speed}px, 0)`;
          });
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  // Gallery filters
  const items = [...document.querySelectorAll('.g-item')];
  document.querySelectorAll('.filter').forEach((btn) =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter').forEach((b) => b.classList.toggle('active', b === btn));
      const f = btn.dataset.filter;
      items.forEach((item) => {
        const show = f === 'all' || item.dataset.cat === f;
        if (show) {
          item.classList.remove('hide');
          item.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], {
            duration: 500,
            easing: 'cubic-bezier(.22,1,.36,1)',
          });
        } else {
          item.classList.add('hide');
        }
      });
    })
  );

  // Lightbox
  const lb = document.getElementById('lightbox');
  const lbImg = lb.querySelector('img');
  const lbCap = lb.querySelector('.lb-caption');
  let current = 0;
  const visible = () => items.filter((i) => !i.classList.contains('hide'));
  const show = (idx) => {
    const list = visible();
    current = (idx + list.length) % list.length;
    const img = list[current].querySelector('img');
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = list[current].querySelector('b').textContent;
  };
  items.forEach((item) =>
    item.addEventListener('click', () => {
      show(visible().indexOf(item));
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
    })
  );
  const close = () => {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
  };
  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', (e) => { e.stopPropagation(); show(current - 1); });
  lb.querySelector('.lb-next').addEventListener('click', (e) => { e.stopPropagation(); show(current + 1); });
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  // FAQ: keep one item open at a time
  const accs = document.querySelectorAll('.acc');
  accs.forEach((d) =>
    d.addEventListener('toggle', () => {
      if (d.open) accs.forEach((o) => { if (o !== d) o.open = false; });
    })
  );

  // Contact form -> pre-filled email
  document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const subject = `Demande de devis – ${f.objet.value}`;
    const text = [
      `Nom : ${f.nom.value}`,
      `E-mail : ${f.email.value}`,
      `Téléphone : ${f.tel.value}`,
      `Objet : ${f.objet.value}`,
      '',
      f.message.value,
    ].join('\n');
    window.location.href = `mailto:sahiti.carrelage@outlook.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  });

  // Cursor follower
  const dot = document.querySelector('.cursor-dot');
  if (window.matchMedia('(hover: hover)').matches && !reduceMotion) {
    let x = 0, y = 0, cx = 0, cy = 0;
    document.addEventListener('mousemove', (e) => {
      x = e.clientX;
      y = e.clientY;
      dot.classList.add('show');
    });
    document.addEventListener('mouseleave', () => dot.classList.remove('show'));
    const loop = () => {
      cx += (x - cx) * 0.18;
      cy += (y - cy) * 0.18;
      dot.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.querySelectorAll('a, button, .g-item, summary').forEach((el) => {
      el.addEventListener('mouseenter', () => dot.classList.add('grow'));
      el.addEventListener('mouseleave', () => dot.classList.remove('grow'));
    });
  }

  document.getElementById('year').textContent = new Date().getFullYear();
})();
