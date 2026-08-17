/* =====================================================================
   Portfolio motion layer
   Vanilla JS only — no build step, no CDN, GitHub Pages friendly.
   ===================================================================== */

const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');
const shapes = document.querySelectorAll('.shape');
const cards = document.querySelectorAll('.glass-card');
const hero = document.querySelector('.hero');
const heroContent = document.querySelector('.hero-content');
const heroBackground = document.querySelector('.hero-background');
const timeline = document.querySelector('.timeline');
const progressBar = document.querySelector('#scrollProgress i');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Marks that the script is alive, so CSS can safely hide things it will reveal.
document.body.classList.add('js-ready');

/* ---------------------------------------------------------------------
   Page loader — counts to 100, then lifts the curtain
   ------------------------------------------------------------------ */
const pageLoader = document.getElementById('pageLoader');
const loaderCount = document.getElementById('loaderCount');
const loaderFill = document.getElementById('loaderFill');

if (pageLoader && !prefersReducedMotion) document.body.style.overflow = 'hidden';

let heroIntroPlayed = false;

function finishLoading() {
    if (heroIntroPlayed) return;
    heroIntroPlayed = true;

    document.body.classList.remove('is-loading');
    document.body.style.overflow = '';
    pageLoader?.classList.add('done');
    document.body.classList.add('loaded');

    // Hold the hero entrance until the curtain has started lifting, otherwise
    // the whole reveal plays behind it and the page just appears fully formed.
    setTimeout(playHeroIntro, prefersReducedMotion ? 0 : 280);
    requestTick();
}

if (!pageLoader || prefersReducedMotion) {
    document.body.classList.remove('is-loading');
    window.addEventListener('load', finishLoading, { once: true });
} else {
    let shown = 0;
    let pageReady = false;
    window.addEventListener('load', () => { pageReady = true; }, { once: true });

    const start = performance.now();
    const step = (now) => {
        const elapsed = now - start;
        // Ease toward 92% on a timer; the last 8% waits for window load.
        const ceiling = pageReady ? 100 : 92;
        const target = Math.min(ceiling, (1 - Math.pow(1 - Math.min(elapsed / 900, 1), 2)) * 100);
        shown = Math.max(shown, target);

        loaderCount.textContent = Math.round(shown);
        loaderFill.style.width = `${shown}%`;

        if (shown < 100) {
            requestAnimationFrame(step);
        } else {
            setTimeout(finishLoading, 140);
        }
    };
    requestAnimationFrame(step);

    // Safety net: never trap the page behind the loader.
    setTimeout(() => {
        if (document.body.classList.contains('is-loading')) finishLoading();
    }, 5000);
}

/* ---------------------------------------------------------------------
   Split text — words or characters, each masked and staggered
   ------------------------------------------------------------------ */
function splitText(element, mode) {
    const text = element.textContent.replace(/\s+/g, ' ').trim();
    const line = document.createElement('span');
    line.className = 'split-line';
    let index = 0;

    text.split(' ').forEach((word, wordIndex, words) => {
        const wordEl = document.createElement('span');
        wordEl.className = 'split-word';

        const pieces = mode === 'char' ? Array.from(word) : [word];
        pieces.forEach(piece => {
            const unit = document.createElement('span');
            unit.className = 'split-unit';
            unit.style.setProperty('--i', index++);
            unit.textContent = piece;
            wordEl.appendChild(unit);
        });

        line.appendChild(wordEl);
        if (wordIndex < words.length - 1) {
            line.appendChild(document.createTextNode(' '));
        }
    });

    element.textContent = '';
    element.setAttribute('aria-label', text);
    line.setAttribute('aria-hidden', 'true');
    element.appendChild(line);
    element.classList.add('split-ready');
    element.style.setProperty('--split-delay', `${element.dataset.delay || 0}s`);
}

const splitTargets = document.querySelectorAll('[data-split]');

if (!prefersReducedMotion) {
    splitTargets.forEach(element => splitText(element, element.dataset.split));
} else {
    splitTargets.forEach(element => element.classList.add('split-in'));
}

/* ---------------------------------------------------------------------
   Reveal on scroll
   ------------------------------------------------------------------ */
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible', 'in', 'split-in', 'stagger-in');
        revealObserver.unobserve(entry.target);
    });
}, {
    // threshold 0, not a fraction: cards here can be a full viewport tall, and
    // a fractional threshold lets such an element sit on screen without ever
    // reaching the ratio, leaving it stuck invisible.
    threshold: 0,
    rootMargin: '0px 0px -60px 0px'
});

document.querySelectorAll('.glass-card, .timeline-item, .skill-category, .education-card, .highlight-card, .section-title')
    .forEach(element => {
        element.classList.add('fade-in');
        revealObserver.observe(element);
    });

// Anything explicitly tagged, plus split blocks outside the hero.
document.querySelectorAll('[data-anim]').forEach(element => {
    element.style.setProperty('--anim-delay', `${element.dataset.delay || 0}s`);
    if (!hero?.contains(element)) revealObserver.observe(element);
});

splitTargets.forEach(element => {
    if (!hero?.contains(element)) revealObserver.observe(element);
});

// Staggered children inside grids and tag clouds.
document.querySelectorAll('.skill-tags, .contact-links, .about-stats, .certifications').forEach(group => {
    Array.from(group.children).forEach((child, index) => {
        child.classList.add('stagger-child');
        child.style.setProperty('--i', index);
    });
    revealObserver.observe(group);
});

/* Hero content animates on load rather than on scroll. */
function playHeroIntro() {
    hero?.querySelectorAll('[data-anim], [data-split]').forEach(element => {
        element.classList.add('in', 'split-in');
    });
}

/* ---------------------------------------------------------------------
   Custom cursor
   ------------------------------------------------------------------ */
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');

if (finePointer && !prefersReducedMotion && cursorDot && cursorRing) {
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;

    window.addEventListener('pointermove', (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        document.body.classList.add('cursor-ready');
    }, { passive: true });

    document.addEventListener('pointerleave', () => document.body.classList.remove('cursor-ready'));

    const renderCursor = () => {
        ringX += (pointerX - ringX) * 0.16;
        ringY += (pointerY - ringY) * 0.16;
        cursorDot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
        cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
        requestAnimationFrame(renderCursor);
    };
    requestAnimationFrame(renderCursor);

    document.querySelectorAll('a, button, .skill-tag, .tilt-3d, input, textarea').forEach(element => {
        element.addEventListener('pointerenter', () => document.body.classList.add('cursor-hover'));
        element.addEventListener('pointerleave', () => document.body.classList.remove('cursor-hover'));
    });
}

/* ---------------------------------------------------------------------
   3D tilt cards
   ------------------------------------------------------------------ */
if (finePointer && !prefersReducedMotion) {
    document.querySelectorAll('.tilt-3d').forEach(card => {
        const layers = card.querySelectorAll('[data-tilt-layer]');

        card.addEventListener('pointerenter', () => {
            card.classList.add('tilting');
            layers.forEach(layer => layer.style.setProperty('--depth', layer.dataset.tiltLayer));
        });

        card.addEventListener('pointermove', (event) => {
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            card.style.setProperty('--ry', `${x * 14}deg`);
            card.style.setProperty('--rx', `${-y * 14}deg`);
        });

        card.addEventListener('pointerleave', () => {
            card.classList.remove('tilting');
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
            layers.forEach(layer => layer.style.setProperty('--depth', 0));
        });
    });
}

/* ---------------------------------------------------------------------
   Magnetic buttons
   ------------------------------------------------------------------ */
if (finePointer && !prefersReducedMotion) {
    document.querySelectorAll('.btn, .magnetic').forEach(button => {
        button.classList.add('magnetized');

        button.addEventListener('pointermove', (event) => {
            const rect = button.getBoundingClientRect();
            const x = event.clientX - rect.left - rect.width / 2;
            const y = event.clientY - rect.top - rect.height / 2;
            button.style.transform = `translate3d(${x * 0.28}px, ${y * 0.42}px, 0)`;
        });

        button.addEventListener('pointerleave', () => {
            button.style.transform = '';
        });
    });
}

/* ---------------------------------------------------------------------
   Nav link roll-over labels
   ------------------------------------------------------------------ */
navLinks.forEach(link => {
    const label = link.textContent.trim();
    link.innerHTML = `<span class="roll"><span>${label}</span><span aria-hidden="true">${label}</span></span>`;
});

/* ---------------------------------------------------------------------
   Marquee — loops forever, nudged by scroll velocity
   ------------------------------------------------------------------ */
const marqueeTrack = document.getElementById('marqueeTrack');
let marqueeOffset = 0;
let marqueeGroupWidth = 0;
let scrollVelocity = 0;

if (marqueeTrack && !prefersReducedMotion) {
    const group = marqueeTrack.querySelector('.marquee-group');

    const buildMarquee = () => {
        marqueeTrack.querySelectorAll('.marquee-group').forEach((node, index) => {
            if (index > 0) node.remove();
        });
        marqueeGroupWidth = group.getBoundingClientRect().width;
        const copies = Math.ceil(window.innerWidth / marqueeGroupWidth) + 1;
        for (let i = 0; i < copies; i += 1) {
            marqueeTrack.appendChild(group.cloneNode(true));
        }
    };

    buildMarquee();
    window.addEventListener('resize', buildMarquee);

    const renderMarquee = () => {
        marqueeOffset -= 0.85 + Math.min(Math.abs(scrollVelocity) * 0.06, 5);
        if (marqueeGroupWidth && marqueeOffset <= -marqueeGroupWidth) {
            marqueeOffset += marqueeGroupWidth;
        }
        marqueeTrack.style.transform = `translate3d(${marqueeOffset}px, 0, 0)`;
        requestAnimationFrame(renderMarquee);
    };
    requestAnimationFrame(renderMarquee);
}

/* ---------------------------------------------------------------------
   Smooth (lerped) scrolling — desktop wheel only, native everywhere else
   ------------------------------------------------------------------ */
const smoothScroll = {
    enabled: finePointer && !prefersReducedMotion,
    target: window.scrollY,
    current: window.scrollY,
    running: false
};

const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

if (smoothScroll.enabled) {
    document.documentElement.style.scrollBehavior = 'auto';

    const runSmooth = () => {
        smoothScroll.current += (smoothScroll.target - smoothScroll.current) * 0.11;

        if (Math.abs(smoothScroll.target - smoothScroll.current) < 0.4) {
            smoothScroll.current = smoothScroll.target;
            smoothScroll.running = false;
        }

        window.scrollTo(0, smoothScroll.current);
        if (smoothScroll.running) requestAnimationFrame(runSmooth);
    };

    const startSmooth = () => {
        if (smoothScroll.running) return;
        smoothScroll.running = true;
        requestAnimationFrame(runSmooth);
    };

    window.addEventListener('wheel', (event) => {
        // Leave pinch-zoom and genuinely scrollable children (textarea) alone.
        if (event.ctrlKey || event.target.closest?.('textarea')) return;
        event.preventDefault();
        if (!smoothScroll.running) smoothScroll.current = window.scrollY;
        smoothScroll.target = clamp(smoothScroll.target + event.deltaY, 0, maxScroll());
        startSmooth();
    }, { passive: false });

    // Keyboard, touch and anchor jumps stay native — resync so they don't fight.
    ['keydown', 'touchstart', 'mousedown'].forEach(type => {
        window.addEventListener(type, () => {
            smoothScroll.running = false;
            smoothScroll.target = window.scrollY;
            smoothScroll.current = window.scrollY;
        }, { passive: true });
    });

    smoothScroll.scrollTo = (position) => {
        smoothScroll.target = clamp(position, 0, maxScroll());
        smoothScroll.current = window.scrollY;
        startSmooth();
    };
}

/* ---------------------------------------------------------------------
   Navigation
   ------------------------------------------------------------------ */
hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        hamburger?.classList.remove('active');
        navMenu?.classList.remove('active');

        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;

        const top = target.getBoundingClientRect().top + window.scrollY - 76;

        if (smoothScroll.enabled) {
            smoothScroll.scrollTo(top);
        } else {
            window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        }
    });
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navMenu?.classList.contains('active')) {
        hamburger?.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

/* ---------------------------------------------------------------------
   Counters and skill bars
   ------------------------------------------------------------------ */
const animateCounter = (element, target) => {
    if (element.dataset.done) return;

    element.dataset.done = 'true';
    const duration = prefersReducedMotion ? 1 : 1600;
    const start = performance.now();

    const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = `${Math.floor(eased * target)}+`;

        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            element.textContent = `${target}+`;
        }
    };

    requestAnimationFrame(tick);
};

const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target, Number(entry.target.dataset.target || 0));
        statObserver.unobserve(entry.target);
    });
}, { threshold: 0.45 });

document.querySelectorAll('.stat-number').forEach(stat => statObserver.observe(stat));

const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.style.width = `${entry.target.dataset.progress}%`;
        skillObserver.unobserve(entry.target);
    });
}, { threshold: 0.35 });

document.querySelectorAll('.skill-progress').forEach(bar => skillObserver.observe(bar));

/* ---------------------------------------------------------------------
   Contact form
   ------------------------------------------------------------------ */
const contactForm = document.getElementById('contactForm');

contactForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    submitBtn.innerHTML = '<span>Sending...</span>';
    submitBtn.disabled = true;

    setTimeout(() => {
        submitBtn.innerHTML = '<span>Message Sent</span>';
        submitBtn.style.background = 'linear-gradient(135deg, #0f766e, #2563eb)';

        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.style.background = '';
            submitBtn.disabled = false;
            contactForm.reset();
        }, 1800);
    }, 900);
});

/* ---------------------------------------------------------------------
   Card light tracking + profile image fallback
   ------------------------------------------------------------------ */
cards.forEach(card => {
    card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
    });
});

const profileImg = document.querySelector('.profile-img');
profileImg?.addEventListener('error', function () {
    this.parentElement.style.background = 'linear-gradient(135deg, #0f766e, #2563eb)';
    this.style.display = 'none';
});

/* ---------------------------------------------------------------------
   Single render loop: nav state, progress, parallax, hero depth
   ------------------------------------------------------------------ */
let latestMouseX = 0.5;
let latestMouseY = 0.5;
let lastScrollY = window.scrollY;
let ticking = false;

window.addEventListener('pointermove', (event) => {
    latestMouseX = event.clientX / window.innerWidth;
    latestMouseY = event.clientY / window.innerHeight;
    requestTick();
}, { passive: true });

window.addEventListener('scroll', requestTick, { passive: true });
window.addEventListener('resize', requestTick);

function requestTick() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updatePageState);
}

function updatePageState() {
    ticking = false;
    const scrollY = window.scrollY;
    scrollVelocity = scrollY - lastScrollY;
    lastScrollY = scrollY;

    navbar?.classList.toggle('scrolled', scrollY > 80);

    if (progressBar) {
        const limit = maxScroll();
        progressBar.style.transform = `scaleX(${limit > 0 ? clamp(scrollY / limit, 0, 1) : 0})`;
    }

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 110;
        const sectionBottom = sectionTop + section.offsetHeight;
        const link = document.querySelector(`.nav-link[href="#${section.id}"]`);
        link?.classList.toggle('active', scrollY >= sectionTop && scrollY < sectionBottom);
    });

    if (timeline) {
        const rect = timeline.getBoundingClientRect();
        const progress = clamp((window.innerHeight * 0.75 - rect.top) / rect.height, 0, 1);
        timeline.style.setProperty('--spine', prefersReducedMotion ? 1 : progress);
    }

    if (prefersReducedMotion) {
        if (scrollVelocity !== 0) requestTick();
        return;
    }

    // Hero drifts away with depth as you leave it.
    if (hero && heroContent) {
        const heroProgress = clamp(scrollY / (hero.offsetHeight || 1), 0, 1);
        heroContent.style.setProperty('--hero-shift', (heroProgress * 90).toFixed(2));
        heroContent.style.setProperty('--hero-fade', (1 - heroProgress * 1.15).toFixed(3));
        heroBackground?.style.setProperty('--hero-zoom', (1 + heroProgress * 0.12).toFixed(3));
        heroBackground?.style.setProperty('--hero-bg', (heroProgress * 60).toFixed(2));
    }

    shapes.forEach((shape, index) => {
        const speed = (index + 1) * 9;
        const x = (latestMouseX - 0.5) * speed;
        const y = (latestMouseY - 0.5) * speed - scrollY * 0.04 * (index + 1);
        shape.style.setProperty('--px', `${x.toFixed(2)}px`);
        shape.style.setProperty('--py', `${y.toFixed(2)}px`);
    });

    if (scrollVelocity !== 0) requestTick();
}

window.addEventListener('load', () => {
    requestTick();
    if (!pageLoader || prefersReducedMotion) playHeroIntro();
});

const footerYear = document.querySelector('.footer-content p');
if (footerYear) {
    footerYear.innerHTML = footerYear.innerHTML.replace('2026', new Date().getFullYear());
}
