(() => {
    'use strict';

    const mobileQuery = window.matchMedia('(max-width: 932px)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
    const requestedDevice = new URLSearchParams(window.location.search).get('device');

    function updateDeviceClasses() {
        const root = document.documentElement;
        const selectedMobile = requestedDevice === 'mobile';
        const lowPowerMode = selectedMobile || mobileQuery.matches || reducedMotionQuery.matches || coarsePointerQuery.matches;
        root.dataset.experienceMode = requestedDevice === 'desktop' ? 'desktop' : 'mobile';
        root.classList.toggle('mobile-layout', selectedMobile || mobileQuery.matches);
        root.classList.toggle('reduced-motion', reducedMotionQuery.matches);
        root.classList.toggle('low-power-mode', lowPowerMode);
    }

    updateDeviceClasses();
    mobileQuery.addEventListener?.('change', updateDeviceClasses);
    reducedMotionQuery.addEventListener?.('change', updateDeviceClasses);
    coarsePointerQuery.addEventListener?.('change', updateDeviceClasses);

    function updateViewportHeight() {
        document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    }

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight, { passive: true });
    window.addEventListener('orientationchange', () => {
        window.setTimeout(updateViewportHeight, 120);
        window.setTimeout(() => window.dispatchEvent(new Event('resize')), 250);
    }, { passive: true });

    function enhanceAccessibility() {
        document.documentElement.lang = 'es';

        const labels = {
            'btn-next-1': 'Comenzar el recorrido',
            'btn-prev-1': 'Volver',
            'btn-next-2': 'Ir al mapa interactivo',
            'btn-prev-2': 'Volver a la portada',
            'btn-next-3': 'Continuar el recorrido',
            'btn-prev-3': 'Volver a la posta anterior',
            'btn-skip-3': 'Saltar esta posta',
            'btn-fullscreen': 'Alternar pantalla completa',
            'btn-close-modal': 'Cerrar información de la posta',
            'btn-show-restart': 'Abrir opciones para reiniciar o revisitar postas'
        };

        Object.entries(labels).forEach(([id, label]) => {
            const element = document.getElementById(id);
            if (!element) return;
            element.setAttribute('aria-label', label);
            if (id === 'btn-fullscreen') element.setAttribute('title', label);
        });

        document.querySelectorAll('.screen').forEach((screen) => {
            screen.setAttribute('role', 'region');
            screen.setAttribute('aria-hidden', screen.classList.contains('active') ? 'false' : 'true');
        });

        const modal = document.getElementById('embedded-modal');
        if (modal) {
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'modal-title');
        }

        const restartPanel = document.getElementById('restart-panel');
        if (restartPanel) {
            restartPanel.setAttribute('role', 'dialog');
            restartPanel.setAttribute('aria-modal', 'true');
            restartPanel.setAttribute('aria-labelledby', 'restart-title');
        }
    }

    function observeInterfaceState() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type !== 'attributes' || mutation.attributeName !== 'class') continue;
                const element = mutation.target;

                if (element.classList.contains('screen')) {
                    element.setAttribute('aria-hidden', element.classList.contains('active') ? 'false' : 'true');
                }

                if (element.id === 'embedded-modal' || element.id === 'restart-panel') {
                    element.setAttribute('aria-hidden', element.classList.contains('hidden') ? 'true' : 'false');
                }
            }
        });

        document.querySelectorAll('.screen, #embedded-modal, #restart-panel').forEach((element) => {
            observer.observe(element, { attributes: true, attributeFilter: ['class'] });
        });
    }

    function limitDecorativeDomOnMobile() {
        if (!document.documentElement.classList.contains('low-power-mode')) return;

        const MAX_PARTICLES = 90;
        const particleSelectors = '.confetti-particle, .magic-sparkle, .magic-bus-sparkle';
        let cleanupQueued = false;

        const cleanup = () => {
            cleanupQueued = false;
            const particles = document.querySelectorAll(particleSelectors);
            if (particles.length <= MAX_PARTICLES) return;
            const excess = particles.length - MAX_PARTICLES;
            for (let index = 0; index < excess; index += 1) {
                particles[index]?.remove();
            }
        };

        const particleObserver = new MutationObserver(() => {
            if (cleanupQueued) return;
            cleanupQueued = true;
            requestAnimationFrame(cleanup);
        });
        particleObserver.observe(document.body, { childList: true, subtree: true });
    }

    function makeDynamicMarkersKeyboardAccessible() {
        const improveMarker = (element) => {
            if (!(element instanceof HTMLElement)) return;

            if (element.matches('.cyan-pin-marker, .posta-screen')) {
                if (!element.hasAttribute('tabindex')) element.tabIndex = 0;
                if (!element.hasAttribute('role')) element.setAttribute('role', 'button');
                if (!element.hasAttribute('aria-label')) {
                    element.setAttribute('aria-label', element.textContent?.trim() || 'Abrir posta');
                }
                if (element.dataset.keyboardReady !== 'true') {
                    element.dataset.keyboardReady = 'true';
                    element.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            element.click();
                        }
                    });
                }
            }

            element.querySelectorAll?.('.cyan-pin-marker, .posta-screen').forEach(improveMarker);
        };

        document.querySelectorAll('.cyan-pin-marker, .posta-screen').forEach(improveMarker);
        const markerObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => mutation.addedNodes.forEach(improveMarker));
        });
        markerObserver.observe(document.body, { childList: true, subtree: true });
    }

    function loadScriptOnce(src, marker) {
        if (document.querySelector(`script[${marker}]`)) return;
        const script = document.createElement('script');
        script.src = src;
        script.setAttribute(marker, 'true');
        document.body.appendChild(script);
    }

    function loadMagicBusTrail() {
        loadScriptOnce('magic-bus-trail.js?v=2', 'data-magic-bus-trail');
    }

    function init() {
        enhanceAccessibility();
        observeInterfaceState();
        limitDecorativeDomOnMobile();
        makeDynamicMarkersKeyboardAccessible();
        loadMagicBusTrail();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
