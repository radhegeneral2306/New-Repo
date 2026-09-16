// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  if (isOpen) {
    Object.assign(navLinks.style, {
      display: 'flex',
      flexDirection: 'column',
      position: 'absolute',
      top: '72px',
      left: '0',
      right: '0',
      background: '#000',
      padding: '24px',
      gap: '18px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    });
  } else {
    navLinks.style.display = '';
  }
});
navLinks?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navLinks.style.display = '';
  });
});

// FAQ accordion
document.querySelectorAll('.faq-question').forEach((btn) => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isActive = item.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach((el) => el.classList.remove('active'));
    if (!isActive) item.classList.add('active');
  });
});

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== Hero constellation — animated field of tiny triangular particles =====
(function constellation() {
  const canvas = document.getElementById('constellation');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const palette = ['#8052ff', '#ffb829', '#15846e', '#bdbdbd', '#6a5acd', '#4a7fd6', '#b085ff'];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let particles = [];
  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildParticles();
  }

  function buildParticles() {
    particles = [];
    const cx = width / 2;
    const cy = height / 2;
    const coreCount = 180;
    const ambientCount = 90;

    // Dense cluster forming an organic blob (two overlapping lobes, brain-like)
    for (let i = 0; i < coreCount; i++) {
      const lobe = Math.random() < 0.5 ? -1 : 1;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.pow(Math.random(), 0.5) * (width * 0.28);
      const x = cx + lobe * width * 0.1 + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius * 0.85;
      particles.push(makeParticle(x, y));
    }
    // Ambient scattered particles across the full canvas, lower opacity
    for (let i = 0; i < ambientCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      particles.push(makeParticle(x, y, true));
    }
  }

  function makeParticle(x, y, ambient) {
    return {
      x, y,
      baseX: x, baseY: y,
      size: ambient ? 2 + Math.random() * 3 : 3 + Math.random() * 5,
      color: palette[(Math.random() * palette.length) | 0],
      opacity: ambient ? 0.15 + Math.random() * 0.2 : 0.5 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.6,
      drift: ambient ? 6 : 3 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
    };
  }

  function drawTriangle(p, t) {
    const dx = Math.cos(p.phase + t * p.speed) * p.drift;
    const dy = Math.sin(p.phase + t * p.speed * 0.8) * p.drift;
    const x = p.baseX + dx;
    const y = p.baseY + dy;
    const s = p.size;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(p.rotation + t * 0.05);
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.87, s * 0.5);
    ctx.lineTo(-s * 0.87, s * 0.5);
    ctx.closePath();
    ctx.strokeStyle = p.color;
    ctx.globalAlpha = p.opacity;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  function render(t) {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => drawTriangle(p, t));
  }

  resize();
  window.addEventListener('resize', resize);

  if (reducedMotion) {
    render(0);
  } else {
    requestAnimationFrame(function loop(ts) {
      render(ts / 1000);
      requestAnimationFrame(loop);
    });
  }
})();
