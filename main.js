/* ═══════════════════════════════════════
   DAVEM — main.js
   ═══════════════════════════════════════ */

/* ── Header scroll ─────────────────────── */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
});

/* ── Mobile menu ────────────────────────── */
const hamburger = document.getElementById('hamburger');
const nav       = document.getElementById('nav');
hamburger.addEventListener('click', () => nav.classList.toggle('open'));
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

/* ── Hero Slider ────────────────────────── */
const slides   = Array.from(document.querySelectorAll('.slide'));
const dots     = Array.from(document.querySelectorAll('.dot'));
let current    = 0;
let autoTimer  = null;

function goTo(index) {
  slides[current].classList.remove('active');
  dots[current].classList.remove('active');
  current = (index + slides.length) % slides.length;
  slides[current].classList.add('active');
  dots[current].classList.add('active');
}

function startAuto() {
  clearInterval(autoTimer);
  autoTimer = setInterval(() => goTo(current + 1), 5500);
}

document.getElementById('nextSlide').addEventListener('click', () => { goTo(current + 1); startAuto(); });
document.getElementById('prevSlide').addEventListener('click', () => { goTo(current - 1); startAuto(); });
dots.forEach(d => d.addEventListener('click', () => { goTo(+d.dataset.index); startAuto(); }));

/* touch swipe */
let touchX = 0;
const hero = document.querySelector('.hero');
hero.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
hero.addEventListener('touchend', e => {
  const diff = touchX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 40) { goTo(diff > 0 ? current + 1 : current - 1); startAuto(); }
}, { passive: true });

startAuto();

/* ── Counter animation ──────────────────── */
function animateCount(el) {
  const target   = +el.dataset.target;
  const duration = 1800;
  const step     = target / (duration / 16);
  let   val      = 0;
  const tick = () => {
    val = Math.min(val + step, target);
    el.textContent = Math.floor(val).toLocaleString('pt-BR');
    if (val < target) requestAnimationFrame(tick);
  };
  tick();
}

const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.count').forEach(animateCount);
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });

document.querySelectorAll('.stats-bar').forEach(el => statsObserver.observe(el));

/* ── AOS (Animate on Scroll) ────────────── */
const aosObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('aos-visible');
      aosObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('[data-aos]').forEach((el, i) => {
  el.style.transitionDelay = `${i * 0.08}s`;
  aosObserver.observe(el);
});

/* ── Services Tabs ──────────────────────── */
document.querySelectorAll('.srv-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const index = tab.dataset.tab;
    document.querySelectorAll('.srv-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.srv-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`.srv-panel[data-panel="${index}"]`).classList.add('active');
  });
});

/* ── Galeria dinâmica (editável pelo painel) ── */
const GALERIA_CATEGORIAS = ['guardacorpo', 'corrimao', 'box', 'portao', 'moveis', 'cobertura'];

function renderGaleria(itens) {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  grid.innerHTML = itens.map(it => {
    const src = encodeURI(it.imagem);
    const alt = (it.titulo || '').replace(/"/g, '&quot;');
    return `
      <div class="gallery-item" data-cat="${it.categoria}">
        <div class="gallery-img" data-src="${src}">
          <img src="${src}" alt="${alt}" loading="lazy" />
          <div class="gallery-overlay">
            <span>${it.titulo || ''}</span>
            <small>${it.subtitulo || ''}</small>
          </div>
        </div>
      </div>`;
  }).join('');
}

const cacheBust = '?v=' + Date.now();
Promise.all(
  GALERIA_CATEGORIAS.map(cat =>
    fetch(`galeria/${cat}.json${cacheBust}`)
      .then(r => (r.ok ? r.json() : { itens: [] }))
      .then(data => (data.itens || []).map(it => ({ ...it, categoria: cat })))
      .catch(() => [])
  )
).then(grupos => renderGaleria(grupos.flat()));

/* ── Goto Gallery with filter ───────────── */
document.querySelectorAll('.goto-gallery').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    const filter = btn.dataset.filter;
    const gallerySection = document.getElementById('galeria');
    const offset = document.getElementById('header').offsetHeight + 8;

    window.scrollTo({ top: gallerySection.offsetTop - offset, behavior: 'smooth' });

    setTimeout(() => {
      const targetBtn = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
      if (targetBtn) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        targetBtn.classList.add('active');
        document.querySelectorAll('.gallery-item').forEach(item => {
          if (item.dataset.cat === filter) {
            item.classList.remove('hidden');
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          } else {
            item.classList.add('hidden');
          }
        });
        buildLightboxItems();
      }
    }, 600);
  });
});

/* ── Gallery filter ─────────────────────── */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('.gallery-item').forEach(item => {
      const match = filter === 'all' || item.dataset.cat === filter;
      item.style.transition = 'opacity .3s, transform .3s';
      if (match) {
        item.classList.remove('hidden');
        item.style.opacity = '1';
        item.style.transform = 'scale(1)';
      } else {
        item.style.opacity = '0';
        item.style.transform = 'scale(.95)';
        setTimeout(() => item.classList.add('hidden'), 320);
      }
    });
  });
});

/* ── Contact form ───────────────────────── */
const form        = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

form.addEventListener('submit', e => {
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  btn.textContent = 'Enviando...';
  btn.disabled    = true;
  /* Simulate send — replace with real fetch/action */
  setTimeout(() => {
    formSuccess.classList.add('visible');
    form.reset();
    btn.textContent = 'Enviar Mensagem';
    btn.disabled    = false;
    setTimeout(() => formSuccess.classList.remove('visible'), 6000);
  }, 1200);
});

/* ── Lightbox ───────────────────────────── */
const lightbox      = document.getElementById('lightbox');
const lightboxImg   = document.getElementById('lightboxImg');
const lightboxCap   = document.getElementById('lightboxCaption');
let   lbItems       = [];
let   lbIndex       = 0;

function openLightbox(index) {
  lbIndex = index;
  const item = lbItems[lbIndex];
  lightboxImg.src = item.src;
  lightboxImg.alt = item.alt;
  lightboxCap.textContent = item.caption;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}
function lbNext() { openLightbox((lbIndex + 1) % lbItems.length); }
function lbPrev() { openLightbox((lbIndex - 1 + lbItems.length) % lbItems.length); }

function buildLightboxItems() {
  lbItems = Array.from(document.querySelectorAll('.gallery-item:not(.hidden) .gallery-img'))
    .map(el => ({
      src:     el.dataset.src,
      alt:     el.querySelector('img')?.alt || '',
      caption: (el.querySelector('.gallery-overlay span')?.textContent || '') +
               ' — ' +
               (el.querySelector('.gallery-overlay small')?.textContent || '')
    }));
}

document.addEventListener('click', e => {
  const el = e.target.closest('.gallery-img');
  if (!el) return;
  buildLightboxItems();
  const src = el.dataset.src;
  const idx = lbItems.findIndex(i => i.src === src);
  openLightbox(idx >= 0 ? idx : 0);
});

document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightboxNext').addEventListener('click', lbNext);
document.getElementById('lightboxPrev').addEventListener('click', lbPrev);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowRight')  lbNext();
  if (e.key === 'ArrowLeft')   lbPrev();
});

/* ── Phone mask ─────────────────────────── */
const telInput = document.getElementById('telefone');
if (telInput) {
  telInput.addEventListener('input', () => {
    let v = telInput.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    telInput.value = v;
  });
}

/* ── Smooth scroll for hash links ────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = header.offsetHeight + 8;
    window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
  });
});
