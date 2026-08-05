(() => {
  'use strict';

  const style = document.createElement('style');
  style.textContent = `
    /* Contador alineado al lado del cartel principal */
    .hud-title {
      left: 22% !important;
      top: 18px !important;
      width: min(31vw, 520px) !important;
    }

    .hud-timer-container {
      top: 20px !important;
      left: 55% !important;
      right: auto !important;
      bottom: auto !important;
      transform: scale(.72) !important;
      transform-origin: top left !important;
      padding: 6px 8px 6px 82px !important;
      z-index: 90 !important;
    }

    .train-container.train-stopped .spin-wheel,
    .train-container.train-stopped .smoke-effect {
      animation-play-state: paused !important;
    }

    @media (max-width: 932px) {
      .hud-title {
        left: calc(8px + env(safe-area-inset-left, 0px)) !important;
        top: calc(8px + env(safe-area-inset-top, 0px)) !important;
        width: min(45vw, 250px) !important;
      }

      .hud-timer-container {
        display: flex !important;
        top: calc(7px + env(safe-area-inset-top, 0px)) !important;
        left: 48vw !important;
        transform: scale(.42) !important;
        transform-origin: top left !important;
      }
    }
  `;
  document.head.appendChild(style);

  function pauseGif(img) {
    if (!img || img.dataset.stationPaused === 'true') return;
    if (!img.dataset.animSrc) img.dataset.animSrc = img.currentSrc || img.src;

    if (!img.complete || !img.naturalWidth) {
      img.addEventListener('load', () => pauseGif(img), { once: true });
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width || 1;
    canvas.height = img.naturalHeight || img.height || 1;

    try {
      const context = canvas.getContext('2d');
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.dataset.stationFrame = canvas.toDataURL('image/png');
      img.dataset.stationPaused = 'true';
      img.src = img.dataset.stationFrame;
      img.closest('.train-container')?.classList.add('train-stopped');
    } catch (error) {
      console.warn('No se pudo detener el GIF del tren.', error);
    }
  }

  function resumeGif(img) {
    if (!img) return;
    const source = img.dataset.animSrc || new URL('tren_animado.gif', window.location.href).href;
    img.dataset.animSrc = source;
    img.dataset.stationPaused = 'false';
    img.closest('.train-container')?.classList.remove('train-stopped');
    img.src = source;
  }

  function pauseTrainAtStation() {
    const train = document.querySelector('.train-gif-target');
    const stopLabel = document.querySelector('.posta-screen.visible');
    if (train && stopLabel) pauseGif(train);
  }

  function resumeTrainBeforeTravel() {
    const train = document.querySelector('.train-gif-target');
    if (train) resumeGif(train);
  }

  function initialise() {
    ['btn-next-3', 'btn-prev-3', 'btn-skip-3'].forEach((id) => {
      document.getElementById(id)?.addEventListener('click', resumeTrainBeforeTravel, true);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        resumeTrainBeforeTravel();
      }
    }, true);

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(pauseTrainAtStation);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    pauseTrainAtStation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialise, { once: true });
  } else {
    initialise();
  }
})();
