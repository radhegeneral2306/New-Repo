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

