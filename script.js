const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');
const shapes = document.querySelectorAll('.shape');
const cards = document.querySelectorAll('.glass-card');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Profile image fallback
window.addEventListener('DOMContentLoaded', () => {
    const profileImg = document.querySelector('.profile-img');

    if (!profileImg) return;

    profileImg.addEventListener('error', function() {
        this.parentElement.style.background = 'linear-gradient(135deg, #0f766e, #2563eb)';
        this.style.display = 'none';
    });
});

// Mobile menu
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

        window.scrollTo({
            top: target.offsetTop - 76,
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
    });
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navMenu?.classList.contains('active')) {
        hamburger?.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// Counters
const animateCounter = (element, target) => {
    if (element.dataset.done) return;

    element.dataset.done = 'true';
    const duration = prefersReducedMotion ? 1 : 1400;
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

// Skill bars
const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.style.width = `${entry.target.dataset.progress}%`;
        skillObserver.unobserve(entry.target);
    });
}, { threshold: 0.35 });

document.querySelectorAll('.skill-progress').forEach(bar => skillObserver.observe(bar));

// Smooth scroll-driven experience slideshow
const experience = document.querySelector('.experience');
const timelineItems = Array.from(document.querySelectorAll('.timeline-item'));
const timeline = document.querySelector('.timeline');

if (timeline && timelineItems.length) {
    const nav = document.createElement('div');
    nav.className = 'timeline-nav';

    timelineItems.forEach((item, index) => {
        item.style.setProperty('--slide-index', index);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'timeline-nav-dot';
        button.setAttribute('aria-label', `Show experience ${index + 1}`);
        button.addEventListener('click', () => {
            if (!experience) return;
            const maxIndex = Math.max(timelineItems.length - 1, 1);
            const targetTop = experience.offsetTop + (experience.offsetHeight - window.innerHeight) * (index / maxIndex);
            window.scrollTo({
                top: targetTop,
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });
        });
        nav.appendChild(button);
    });

    timeline.appendChild(nav);
}

let activeExperienceIndex = 0;

const setActiveExperience = (index) => {
    if (!timelineItems.length || index === activeExperienceIndex && timelineItems[index]?.classList.contains('active')) return;

    activeExperienceIndex = index;
    timelineItems.forEach((item, itemIndex) => {
        item.classList.toggle('active', itemIndex === index);
        item.classList.toggle('previous', itemIndex < index);
    });

    document.querySelectorAll('.timeline-nav-dot').forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === index);
    });
};

setActiveExperience(0);

// Contact form handling
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

// Card light tracking
cards.forEach(card => {
    card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
    });
});

// One smooth render loop for scroll and subtle parallax
let latestMouseX = 0.5;
let latestMouseY = 0.5;
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

    navbar?.classList.toggle('scrolled', scrollY > 80);

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 110;
        const sectionBottom = sectionTop + section.offsetHeight;
        const link = document.querySelector(`.nav-link[href="#${section.id}"]`);
        link?.classList.toggle('active', scrollY >= sectionTop && scrollY < sectionBottom);
    });

    if (experience && timelineItems.length) {
        const scrollable = Math.max(experience.offsetHeight - window.innerHeight, 1);
        const progress = Math.min(Math.max((scrollY - experience.offsetTop) / scrollable, 0), 1);
        const index = Math.min(timelineItems.length - 1, Math.round(progress * (timelineItems.length - 1)));
        setActiveExperience(index);
    }

    if (!prefersReducedMotion) {
        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 7;
            const x = (latestMouseX - 0.5) * speed;
            const y = (latestMouseY - 0.5) * speed;
            shape.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        });
    }
}

window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    requestTick();
});

const footerYear = document.querySelector('.footer-content p');
if (footerYear) {
    footerYear.innerHTML = footerYear.innerHTML.replace('2026', new Date().getFullYear());
}
