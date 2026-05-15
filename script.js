/* ========================================
   Sami Abdelkhalek — Portfolio JS
   ======================================== */
document.addEventListener('DOMContentLoaded', () => {

  /* --- Particle Constellation Background --- */
  const canvas = document.getElementById('particle-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let orbs = [];
    const PARTICLE_COUNT = 70;
    const ORB_COUNT = 5;
    const CONNECT_DIST = 160;
    const SPEED = 0.2;
    const MOUSE_RADIUS = 180;

    // Track mouse position relative to page
    let mouse = { x: -9999, y: -9999 };
    document.addEventListener('mousemove', (e) => {
      mouse.x = e.pageX;
      mouse.y = e.pageY;
    });
    document.addEventListener('mouseleave', () => {
      mouse.x = -9999; mouse.y = -9999;
    });

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(document.documentElement.scrollHeight, window.innerHeight);
    }
    window.addEventListener('resize', resize);
    resize();
    let resizeTimer;
    const lazyResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 300); };
    window.addEventListener('scroll', lazyResize);

    // --- Ambient floating orbs (large, blurry, slow) ---
    class Orb {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.r = Math.random() * 200 + 100;
        this.vx = (Math.random() - 0.5) * 0.08;
        this.vy = (Math.random() - 0.5) * 0.08;
        this.hue = Math.random() > 0.5 ? 0 : 355; // red hues
        this.alpha = Math.random() * 0.03 + 0.015;
        this.pulseSpeed = Math.random() * 0.002 + 0.001;
        this.pulsePhase = Math.random() * Math.PI * 2;
      }
      update(time) {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < -this.r) this.x = canvas.width + this.r;
        if (this.x > canvas.width + this.r) this.x = -this.r;
        if (this.y < -this.r) this.y = canvas.height + this.r;
        if (this.y > canvas.height + this.r) this.y = -this.r;
        this.currentAlpha = this.alpha + Math.sin(time * this.pulseSpeed + this.pulsePhase) * 0.008;
      }
      draw() {
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
        grad.addColorStop(0, `rgba(230, 57, 70, ${this.currentAlpha})`);
        grad.addColorStop(0.5, `rgba(193, 18, 31, ${this.currentAlpha * 0.4})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // --- Particles with glow + mouse repulsion ---
    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * SPEED;
        this.vy = (Math.random() - 0.5) * SPEED;
        this.r = Math.random() * 2 + 0.5;
        this.baseAlpha = Math.random() * 0.5 + 0.15;
        this.alpha = this.baseAlpha;
        this.pulseSpeed = Math.random() * 0.003 + 0.001;
        this.pulsePhase = Math.random() * Math.PI * 2;
      }
      update(time) {
        // Subtle pulsing
        this.alpha = this.baseAlpha + Math.sin(time * this.pulseSpeed + this.pulsePhase) * 0.1;

        // Mouse repulsion
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (1 - dist / MOUSE_RADIUS) * 0.8;
          this.vx += (dx / dist) * force;
          this.vy += (dy / dist) * force;
        }

        // Dampen velocity
        this.vx *= 0.99;
        this.vy *= 0.99;

        // Clamp speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 1.5) {
          this.vx = (this.vx / speed) * 1.5;
          this.vy = (this.vy / speed) * 1.5;
        }

        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }
      draw() {
        // Glow
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 4);
        glow.addColorStop(0, `rgba(230, 57, 70, ${this.alpha * 0.4})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 4, 0, Math.PI * 2);
        ctx.fill();
        // Core
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230, 57, 70, ${this.alpha})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < ORB_COUNT; i++) orbs.push(new Orb());
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    function animate(time) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw orbs first (behind particles)
      orbs.forEach(o => { o.update(time); o.draw(); });

      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const opacity = (1 - dist / CONNECT_DIST) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(230, 57, 70, ${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      particles.forEach(p => { p.update(time); p.draw(); });
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  /* --- 3D Tilt on hero image --- */
  const heroImg = document.querySelector('.hero-image-wrapper');
  if (heroImg) {
    heroImg.style.transition = 'transform 0.15s ease';
    heroImg.addEventListener('mousemove', (e) => {
      const rect = heroImg.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      heroImg.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.03)`;
    });
    heroImg.addEventListener('mouseleave', () => {
      heroImg.style.transform = 'perspective(600px) rotateY(0) rotateX(0) scale(1)';
    });
  }

  /* --- Nav scroll effect --- */
  const nav = document.querySelector('.nav');
  const handleScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', handleScroll);
  handleScroll();

  /* --- Mobile menu --- */
  const toggle = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      toggle.classList.toggle('open');
    });
    mobileMenu.querySelectorAll('a').forEach(link =>
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        toggle.classList.remove('open');
      })
    );
  }

  /* --- Active nav link tracking --- */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const updateActiveLink = () => {
    const scrollY = window.scrollY + 120;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(l => l.classList.remove('active'));
        document.querySelectorAll(`.nav-link[href="#${id}"]`).forEach(l => l.classList.add('active'));
      }
    });
  };
  window.addEventListener('scroll', updateActiveLink);

  /* --- Smooth scroll for all anchor links --- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
      }
    });
  });

  /* --- Scroll reveal animation --- */
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
  revealElements.forEach(el => revealObserver.observe(el));

  /* --- Skill bars animation --- */
  const skillFills = document.querySelectorAll('.skill-fill');
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.width = entry.target.dataset.width;
        skillObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  skillFills.forEach(el => skillObserver.observe(el));

  /* --- Typing effect for hero title --- */
  const typingEl = document.getElementById('typing-text');
  if (typingEl) {
    const titles = [
      'ICT Engineer',
      'Systems Architect',
      'AI Workflow Builder',
      'Security Specialist'
    ];
    let titleIdx = 0, charIdx = 0, deleting = false;
    const typeSpeed = 80, deleteSpeed = 40, pauseTime = 2200;

    function typeLoop() {
      const current = titles[titleIdx];
      if (!deleting) {
        typingEl.textContent = current.substring(0, charIdx + 1);
        charIdx++;
        if (charIdx === current.length) {
          setTimeout(() => { deleting = true; typeLoop(); }, pauseTime);
          return;
        }
        setTimeout(typeLoop, typeSpeed);
      } else {
        typingEl.textContent = current.substring(0, charIdx - 1);
        charIdx--;
        if (charIdx === 0) {
          deleting = false;
          titleIdx = (titleIdx + 1) % titles.length;
          setTimeout(typeLoop, 400);
          return;
        }
        setTimeout(typeLoop, deleteSpeed);
      }
    }
    typeLoop();
  }

  /* --- Contact form handler (frontend only) --- */
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
      btn.style.background = 'var(--accent)';
      btn.style.color = 'var(--bg-primary)';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.style.color = '';
        form.reset();
      }, 3000);
    });
  }

  /* --- Counter animation for hero stats --- */
  const counters = document.querySelectorAll('.counter');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        const duration = 1800;
        const start = performance.now();
        function animate(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(eased * target) + suffix;
          if (progress < 1) requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(el => counterObserver.observe(el));

});

/* --- Modal Handler --- */
window.openModal = function(type, url, title) {
  const modal = document.getElementById('preview-modal');
  const modalBody = document.getElementById('modal-body');
  document.getElementById('modal-title').textContent = title;
  
  modalBody.innerHTML = '<div style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--accent)"></i></div>';
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  if (type === 'pdf') {
    modalBody.innerHTML = `<iframe src="${url}#toolbar=0" title="${title}"></iframe>`;
  } else if (type === 'video') {
    modalBody.innerHTML = `<video controls autoplay style="background:#000; width:100%; max-height: 70vh;"><source src="${url}" type="video/mp4">Your browser does not support the video tag.</video>`;
  } else if (type === 'md') {
    fetch(url)
      .then(res => res.text())
      .then(text => {
        if (window.marked) {
          modalBody.innerHTML = `<div class="modal-markdown">${marked.parse(text)}</div>`;
        } else {
          modalBody.innerHTML = `<pre style="white-space:pre-wrap;font-family:inherit">${text}</pre>`;
        }
      })
      .catch(err => {
        modalBody.innerHTML = `<p style="color:var(--accent)">Error loading content.</p>`;
      });
  }
};

window.closeModal = function() {
  const modal = document.getElementById('preview-modal');
  const modalBody = document.getElementById('modal-body');
  modal.classList.remove('open');
  document.body.style.overflow = '';
  // Clear body to stop videos from playing in background
  setTimeout(() => { modalBody.innerHTML = ''; }, 300);
};

// Close on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('preview-modal').classList.contains('open')) {
    closeModal();
  }
});
