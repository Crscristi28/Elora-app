// main.js - Interactive functionality for Omnia landing page

document.addEventListener('DOMContentLoaded', function() {
    // Initialize language system
    initializeLanguageSystem();

    // Initialize mobile menu
    initializeMobileMenu();

    // Initialize smooth scrolling
    initializeSmoothScrolling();

    // Initialize animations
    initializeAnimations();

    // Initialize GDPR cookie consent
    initializeCookieConsent();
});

// Language System
function initializeLanguageSystem() {
    let currentLanguage = localStorage.getItem('omnia-lang') || 'en';

    // Apply translations on page load
    applyTranslations(currentLanguage);
    updateLanguageDisplay(currentLanguage);

    // Header language selector
    const langBtn = document.getElementById('langBtn');
    const langDropdown = document.getElementById('langDropdown');

    if (langBtn && langDropdown) {
        langBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            langDropdown.classList.toggle('active');
        });

        // Language option clicks
        const langOptions = document.querySelectorAll('.lang-option');
        langOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                const newLang = this.dataset.lang;
                changeLanguage(newLang);
                langDropdown.classList.remove('active');
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!langBtn.contains(e.target) && !langDropdown.contains(e.target)) {
                langDropdown.classList.remove('active');
            }
        });
    }

    // Footer language selector
    const footerLangSelect = document.getElementById('footerLangSelect');
    if (footerLangSelect) {
        footerLangSelect.value = currentLanguage;
        footerLangSelect.addEventListener('change', function() {
            changeLanguage(this.value);
        });
    }

    function changeLanguage(newLang) {
        currentLanguage = newLang;
        localStorage.setItem('omnia-lang', newLang);
        applyTranslations(newLang);
        updateLanguageDisplay(newLang);

        // Update footer selector
        if (footerLangSelect) {
            footerLangSelect.value = newLang;
        }
    }

    function applyTranslations(lang) {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = getTranslation(lang, key);
            element.textContent = translation;
        });

        // Update Terms and Privacy links to correct language
        updateLegalLinks(lang);
    }

    function updateLegalLinks(lang) {
        // Update Terms of Service links
        const termsLinks = document.querySelectorAll('a[href*="terms"]');
        termsLinks.forEach(link => {
            if (lang === 'en') {
                link.href = 'terms.html';
            } else {
                link.href = `terms-${lang}.html`;
            }
        });

        // Update Privacy Policy links
        const privacyLinks = document.querySelectorAll('a[href*="privacy"]');
        privacyLinks.forEach(link => {
            if (lang === 'en') {
                link.href = 'privacy.html';
            } else {
                link.href = `privacy-${lang}.html`;
            }
        });
    }

    function updateLanguageDisplay(lang) {
        const currentLangElement = document.getElementById('currentLang');
        if (currentLangElement) {
            currentLangElement.textContent = getLanguageFlag(lang);
        }
    }

    // Translation functions
    function getTranslation(lang, key) {
        if (window.translations && window.translations.getTranslation) {
            return window.translations.getTranslation(lang, key);
        }
        console.error('❌ Translations not available for:', lang, key);
        return key; // Fallback to key name
    }

    function getLanguageFlag(lang) {
        if (window.translations && window.translations.getLanguageFlag) {
            return window.translations.getLanguageFlag(lang);
        }
        // Fallback flags
        const flags = {
            en: '🇺🇸', cs: '🇨🇿', ro: '🇷🇴', de: '🇩🇪',
            ru: '🇷🇺', pl: '🇵🇱', fr: '🇫🇷', es: '🇪🇸', it: '🇮🇹'
        };
        return flags[lang] || '🌍';
    }
}

// Mobile Menu
function initializeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');

    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('mobile-open');
            document.body.classList.toggle('menu-open');
        });

        // Close mobile menu when clicking on nav links
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenuToggle.classList.remove('active');
                navMenu.classList.remove('mobile-open');
                document.body.classList.remove('menu-open');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileMenuToggle.contains(e.target) && !navMenu.contains(e.target)) {
                mobileMenuToggle.classList.remove('active');
                navMenu.classList.remove('mobile-open');
                document.body.classList.remove('menu-open');
            }
        });
    }
}

// Smooth Scrolling
function initializeSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            // Skip if href is just "#"
            if (href === '#') {
                e.preventDefault();
                return;
            }

            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                e.preventDefault();

                // Calculate offset for fixed navbar
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Update active nav link
                updateActiveNavLink(href);
            }
        });
    });

    function updateActiveNavLink(activeHref) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === activeHref) {
                link.classList.add('active');
            }
        });
    }

    // Update active nav on scroll
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        const navbarHeight = document.querySelector('.navbar').offsetHeight;
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 100;
            const sectionHeight = section.offsetHeight;

            if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
                current = '#' + section.getAttribute('id');
            }
        });

        if (current) {
            updateActiveNavLink(current);
        }
    });
}

// Animations
function initializeAnimations() {
    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');

    function updateNavbar() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', updateNavbar);
    updateNavbar(); // Initial call

    // Typing animation for demo chat
    initializeTypingAnimation();

    // Intersection Observer for fade-in animations
    initializeFadeInAnimations();
}

// Typing Animation
function initializeTypingAnimation() {
    const typingIndicator = document.querySelector('.typing-indicator');

    if (typingIndicator) {
        // Add CSS class to control animation
        typingIndicator.classList.add('active');

        // Optional: Add periodic pulse to typing dots
        setInterval(() => {
            if (typingIndicator) {
                typingIndicator.classList.remove('active');
                setTimeout(() => {
                    if (typingIndicator) {
                        typingIndicator.classList.add('active');
                    }
                }, 100);
            }
        }, 3000);
    }
}

// Fade-in Animations
function initializeFadeInAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe sections for fade-in animation
    const sections = document.querySelectorAll('.features, .how-it-works, .pricing');
    sections.forEach(section => {
        section.classList.add('animate-fade');
        observer.observe(section);
    });

    // Observe cards for stagger animation
    const cards = document.querySelectorAll('.feature-card, .step, .pricing-card');
    cards.forEach((card, index) => {
        card.classList.add('animate-fade');
        card.style.animationDelay = `${index * 0.1}s`;
        observer.observe(card);
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Feature Modal Functions
function openFeatureModal(featureType) {
    const modal = document.getElementById('featureModal');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');

    // Get current language
    const currentLanguage = localStorage.getItem('omnia-lang') || 'en';

    // Feature data mapping
    const featureData = {
        speed: {
            icon: '⚡',
            titleKey: 'feature_speed_title',
            descKey: 'feature_speed_detailed'
        },
        memory: {
            icon: '🧠',
            titleKey: 'feature_memory_title',
            descKey: 'feature_memory_detailed'
        },
        privacy: {
            icon: '🔒',
            titleKey: 'feature_privacy_title',
            descKey: 'feature_privacy_detailed'
        },
        versatile: {
            icon: '📚',
            titleKey: 'feature_versatile_title',
            descKey: 'feature_versatile_detailed'
        },
        unified: {
            icon: '🗣️',
            titleKey: 'feature_unified_title',
            descKey: 'feature_unified_detailed'
        },
        design: {
            icon: '💎',
            titleKey: 'feature_design_title',
            descKey: 'feature_design_detailed'
        }
    };

    const feature = featureData[featureType];
    if (!feature) return;

    // Set modal content
    modalIcon.textContent = feature.icon;
    modalTitle.textContent = getTranslation(currentLanguage, feature.titleKey);
    modalDescription.textContent = getTranslation(currentLanguage, feature.descKey);

    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Add animation class after display
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function closeFeatureModal() {
    const modal = document.getElementById('featureModal');
    modal.classList.remove('show');

    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300);
}

// Close modal on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeFeatureModal();
    }
});

// Initialize performance optimizations
(function() {
    // Debounce scroll events
    const debouncedScroll = debounce(() => {
        // Any heavy scroll operations go here
    }, 16); // ~60fps

    window.addEventListener('scroll', debouncedScroll, { passive: true });

    // Preload critical images
    const criticalImages = [
        // Add any critical image URLs here if needed
    ];

    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
})();

// GDPR Cookie Consent System
function initializeCookieConsent() {
    const consent = localStorage.getItem('omnia-cookie-consent');

    if (!consent) {
        showCookieConsent();
    }
}

function showCookieConsent() {
    const banner = document.getElementById('cookieConsent');
    if (banner) {
        setTimeout(() => {
            banner.classList.add('show');
        }, 1000); // Show after 1 second
    }
}

function hideCookieConsent() {
    const banner = document.getElementById('cookieConsent');
    if (banner) {
        banner.classList.remove('show');
        setTimeout(() => {
            banner.style.display = 'none';
        }, 400);
    }
}

function acceptEssentialCookies() {
    // Set essential cookies consent
    localStorage.setItem('omnia-cookie-consent', 'essential');
    localStorage.setItem('omnia-analytics-consent', 'false');

    // Hide banner
    hideCookieConsent();

    console.log('Essential cookies accepted');
}

function acceptAllCookies() {
    // Set all cookies consent
    localStorage.setItem('omnia-cookie-consent', 'all');
    localStorage.setItem('omnia-analytics-consent', 'true');

    // Enable analytics (if you add analytics later)
    enableAnalytics();

    // Hide banner
    hideCookieConsent();

    console.log('All cookies accepted');
}

function enableAnalytics() {
    // This function will enable analytics when you implement them
    // For now, just log that analytics would be enabled
    console.log('Analytics enabled (placeholder)');

    // Future: Initialize Google Analytics, Vercel Analytics, etc.
    // if (window.gtag) {
    //     gtag('consent', 'update', {
    //         'analytics_storage': 'granted'
    //     });
    // }
}

// Check if analytics consent is given
function hasAnalyticsConsent() {
    return localStorage.getItem('omnia-analytics-consent') === 'true';
}

// Utility function to check specific cookie consent
function hasCookieConsent(type = 'any') {
    const consent = localStorage.getItem('omnia-cookie-consent');

    if (type === 'essential') {
        return consent === 'essential' || consent === 'all';
    }

    if (type === 'analytics') {
        return consent === 'all';
    }

    return consent !== null;
}