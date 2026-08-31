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
const chips = document.querySelectorAll('.chip');
const srPath = document.getElementById('srPath');
const srMsg = document.getElementById('srMsg');
const srScroll = document.getElementById('srScroll');
const srUptime = document.getElementById('srUptime');

// Motion comes from html[data-motion] (set by the inline head script), not
// straight from the OS query. Full motion is the default everywhere; the nav
// toggle lets anyone opt out and the choice persists.
const prefersReducedMotion = document.documentElement.getAttribute('data-motion') === 'reduced';
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Confirms to the head script that the motion layer is alive; without this it
// removes .js-ready again so nothing stays hidden.
window.__motionReady = true;

// Motion toggle. Reloading is the honest way to apply it: split text, the
// marquee clones and the observers are all built differently per mode.
const motionToggle = document.getElementById('motionToggle');
motionToggle?.setAttribute('aria-pressed', String(prefersReducedMotion));
motionToggle?.addEventListener('click', () => {
    const next = prefersReducedMotion ? 'full' : 'reduced';
    try { localStorage.setItem('motion', next); } catch (e) {}
    document.documentElement.setAttribute('data-motion', next);
    location.reload();
});

/* ---------------------------------------------------------------------
   Page loader — counts to 100, then lifts the curtain
   ------------------------------------------------------------------ */
const pageLoader = document.getElementById('pageLoader');
const loaderFill = document.getElementById('loaderFill');
const bootStages = document.getElementById('bootStages');
const bootLog = document.getElementById('bootLog');

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

/* The load screen is a deploy. Each stage runs, logs, and passes; the last one
   ships the page. Log lines are cosmetic but they use this site's real stack. */
const BOOT = [
    { stage: 'checkout', ms: 260, log: ['fetching origin/main', 'HEAD at 96feaf3'] },
    { stage: 'plan', ms: 340, log: ['reading tfstate', '12 to add, 0 to destroy'] },
    { stage: 'build', ms: 380, log: ['layer 3/5 cached', 'image sha256:8f21c4'] },
    { stage: 'scan', ms: 320, log: ['0 critical, 0 high', 'policy gate passed'] },
    { stage: 'deploy', ms: 300, log: ['uploading assets', 'live on ahmedsaiyed.site'] }
];

if (!pageLoader || prefersReducedMotion) {
    document.body.classList.remove('is-loading');
    window.addEventListener('load', finishLoading, { once: true });
} else {
    const rows = Array.from(bootStages?.querySelectorAll('li') || []);
    const lines = [];

    const pushLog = (text) => {
        lines.push(text);
        if (lines.length > 3) lines.shift();
        if (bootLog) bootLog.innerHTML = lines.map(l => `<b>&rsaquo;</b> ${l}`).join('\n');
    };

    const runStage = (index) => {
        if (index >= BOOT.length) {
            setTimeout(finishLoading, 180);
            return;
        }

        const { ms, log } = BOOT[index];
        const row = rows[index];
        row?.setAttribute('data-state', 'run');
        if (row) row.querySelector('i').textContent = 'running';
        pushLog(log[0]);

        setTimeout(() => pushLog(log[1]), ms * 0.55);
        setTimeout(() => {
            row?.setAttribute('data-state', 'pass');
            if (row) row.querySelector('i').textContent = 'passed';
            if (loaderFill) loaderFill.style.width = `${((index + 1) / BOOT.length) * 100}%`;
            runStage(index + 1);
        }, ms);
    };

    runStage(0);

    // Safety net: never trap the page behind the loader.
    setTimeout(() => {
        if (document.body.classList.contains('is-loading')) finishLoading();
    }, 6000);
}

/* ---------------------------------------------------------------------
   Cycling role word
   ------------------------------------------------------------------ */
const roleCycle = document.getElementById('roleCycle');

if (roleCycle && !prefersReducedMotion) {
    const words = roleCycle.querySelectorAll('.role-word');
    const track = roleCycle.querySelector('.role-track');
    let roleIndex = 0;

    // Width follows the current word so the box hugs it instead of jumping.
    // Measured with getBoundingClientRect for sub-pixel accuracy, plus a 1px
    // buffer, otherwise the last glyph gets shaved off.
    // Grow instantly, shrink late. If the box merely transitioned to the new
    // width, it would still be at the previous (narrower) width while the
    // incoming word slides in, shaving glyphs off for half a second.
    let shrinkTimer;

    const sizeToWord = (immediate) => {
        const next = Math.ceil(words[roleIndex % words.length].getBoundingClientRect().width) + 1;
        const current = roleCycle.getBoundingClientRect().width;
        clearTimeout(shrinkTimer);

        if (immediate || next >= current) {
            roleCycle.style.transition = 'none';
            roleCycle.style.width = `${next}px`;
            void roleCycle.offsetWidth;          // commit before restoring easing
            roleCycle.style.transition = '';
        } else {
            shrinkTimer = setTimeout(() => {
                roleCycle.style.width = `${next}px`;
            }, 720);                              // after the word has landed
        }
    };

    // Measuring before the webfonts land gives fallback metrics and a box that
    // clips the word, so wait for the real faces first.
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => sizeToWord(true));
    }
    setTimeout(() => sizeToWord(true), 400);
    window.addEventListener('resize', () => sizeToWord(true));
    window.addEventListener('load', () => sizeToWord(true));

    setInterval(() => {
        roleIndex += 1;
        track.style.setProperty('--role', roleIndex % words.length);
        sizeToWord();
    }, 2200);
}

/* ---------------------------------------------------------------------
   Scramble-in headings — the subject's own vernacular, decoded
   ------------------------------------------------------------------ */
const SCRAMBLE_CHARS = '$_/<>[]{}#*01';

function scrambleIn(element) {
    if (element.dataset.scrambled) return;
    element.dataset.scrambled = 'true';

    const text = element.textContent;
    const start = performance.now();
    const duration = 620 + text.length * 34;

    const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const settled = Math.floor(progress * text.length);
        let out = '';

        for (let i = 0; i < text.length; i += 1) {
            if (i < settled || text[i] === ' ') {
                out += text[i];
            } else {
                out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            }
        }

        element.textContent = out;
        if (progress < 1) requestAnimationFrame(tick);
        else element.textContent = text;
    };

    requestAnimationFrame(tick);
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
        if (entry.target.hasAttribute('data-scramble')) scrambleIn(entry.target);
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

document.querySelectorAll('[data-scramble]').forEach(element => {
    if (!prefersReducedMotion) revealObserver.observe(element);
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
   Tech stack ticker — same loop as the marquee, two rows, opposite ways
   ------------------------------------------------------------------ */
document.querySelectorAll('.stack-row').forEach((row, index) => {
    if (prefersReducedMotion) return;

    const group = row.querySelector('.stack-group');
    if (!group) return;

    let offset = index === 0 ? 0 : -200;   // stagger so rows do not line up
    let groupWidth = 0;

    const build = () => {
        row.querySelectorAll('.stack-group').forEach((node, i) => { if (i > 0) node.remove(); });
        groupWidth = group.getBoundingClientRect().width;
        if (!groupWidth) return;
        const copies = Math.ceil(window.innerWidth / groupWidth) + 1;
        for (let i = 0; i < copies; i += 1) row.appendChild(group.cloneNode(true));
    };

    build();
    window.addEventListener('resize', build);

    const dir = Number(row.dataset.dir || 1);
    const render = () => {
        // Scroll velocity nudges the rows, so they feel tied to the page.
        const speed = 0.45 + Math.min(Math.abs(scrollVelocity) * 0.035, 3.2);
        offset -= speed * dir;

        if (groupWidth) {
            if (offset <= -groupWidth) offset += groupWidth;
            if (offset > 0) offset -= groupWidth;
        }

        row.style.setProperty('--tx', `${offset.toFixed(1)}px`);
        requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
});

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
        const suffix = element.dataset.suffix !== undefined ? element.dataset.suffix : '+';
        element.textContent = `${Math.floor(eased * target)}${suffix}`;

        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            element.textContent = `${target}${suffix}`;
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
        const isActive = scrollY >= sectionTop && scrollY < sectionBottom;
        link?.classList.toggle('active', isActive);
        if (isActive) updateRail(section.id);
    });

    if (timeline) {
        const rect = timeline.getBoundingClientRect();
        const progress = clamp((window.innerHeight * 0.75 - rect.top) / rect.height, 0, 1);
        timeline.style.setProperty('--spine', prefersReducedMotion ? 1 : progress);
    }

    updateDeployHistory();

    if (srScroll) {
        const limit = maxScroll();
        srScroll.textContent = `${Math.round(limit > 0 ? clamp(scrollY / limit, 0, 1) * 100 : 0)}%`;
    }

    if (prefersReducedMotion) {
        if (scrollVelocity !== 0) requestTick();
        return;
    }

    chips.forEach(chip => {
        const depth = Number(chip.dataset.depth || 20);
        chip.style.setProperty('--cx', `${((latestMouseX - 0.5) * depth).toFixed(1)}px`);
        chip.style.setProperty('--cy', `${((latestMouseY - 0.5) * depth - scrollY * depth * 0.004).toFixed(1)}px`);
    });

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

/* ---------------------------------------------------------------------
   Status rail — reports where you are, in the subject's own idiom
   ------------------------------------------------------------------ */
const RAIL_COPY = {
    home: ['~/home', 'all systems operational'],
    about: ['~/about', 'reading profile'],
    experience: ['~/experience', 'deploy history: 3 roles'],
    skills: ['~/skills', 'capability matrix loaded'],
    education: ['~/education', 'certifications verified'],
    contact: ['~/contact', 'accepting connections']
};

let railSection = '';

function updateRail(id) {
    if (!srPath || id === railSection) return;
    railSection = id;
    const entry = RAIL_COPY[id] || [`~/${id}`, 'ready'];
    srPath.textContent = entry[0];
    if (srMsg) srMsg.textContent = entry[1];
}

if (srUptime) {
    const bootedAt = Date.now();
    setInterval(() => {
        const secs = Math.floor((Date.now() - bootedAt) / 1000);
        const mm = String(Math.floor(secs / 60)).padStart(2, '0');
        const ss = String(secs % 60).padStart(2, '0');
        srUptime.textContent = `${mm}:${ss}`;
    }, 1000);
}

/* ---------------------------------------------------------------------
   Deploy history — pin the section and drive the runs horizontally
   ------------------------------------------------------------------ */
const dhSection = document.querySelector('.deploy-history');
const dhTrack = document.getElementById('dhTrack');
const dhProgress = document.getElementById('dhProgress');
const dhRuns = document.querySelectorAll('.dh-run');

// Bullets stagger in per run.
dhRuns.forEach(run => {
    run.querySelectorAll('.dh-log li').forEach((li, i) => li.style.setProperty('--i', i));
});

// The pin only applies where the layout actually pins; below the breakpoint
// the section is a normal stack and must not be transformed.
const dhPinned = () => window.matchMedia('(min-width: 981px)').matches;

function updateDeployHistory() {
    if (!dhSection || !dhTrack) return;

    if (!dhPinned()) {
        dhRuns.forEach(run => run.classList.add('is-active'));
        return;
    }

    const rect = dhSection.getBoundingClientRect();
    const distance = dhSection.offsetHeight - window.innerHeight;
    const progress = clamp(-rect.top / (distance || 1), 0, 1);

    // Travel far enough that the LAST run reaches the same arrival point the
    // first one started at. Using the track's overflow instead would stop as
    // soon as its right edge met the viewport, leaving the earliest run stuck
    // half off-screen and never active.
    const first = dhRuns[0];
    const last = dhRuns[dhRuns.length - 1];
    const travel = Math.max(0, last.offsetLeft - first.offsetLeft);
    dhTrack.style.setProperty('--dh-x', (progress * travel).toFixed(1));
    dhProgress?.parentElement.style.setProperty('--dh', progress.toFixed(3));

    // Whichever run is nearest the viewport centre is the live one.
    const centre = window.innerWidth / 2;
    let best = 0;
    let bestGap = Infinity;
    dhRuns.forEach((run, i) => {
        const r = run.getBoundingClientRect();
        const gap = Math.abs(r.left + r.width / 2 - centre);
        if (gap < bestGap) { bestGap = gap; best = i; }
    });
    dhRuns.forEach((run, i) => run.classList.toggle('is-active', i === best));
}

const footerYear = document.querySelector('.footer-content p');
if (footerYear) {
    footerYear.innerHTML = footerYear.innerHTML.replace('2026', new Date().getFullYear());
}
