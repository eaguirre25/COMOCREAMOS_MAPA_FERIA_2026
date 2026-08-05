(() => {
  'use strict';

  let leavingPostaOne = false;

  const style = document.createElement('style');
  style.textContent = `
    .hud-title { left: 22% !important; top: 18px !important; width: min(31vw, 520px) !important; }
    .hud-timer-container { top: 20px !important; left: 55% !important; right: auto !important; bottom: auto !important; transform: scale(.72) !important; transform-origin: top left !important; padding: 6px 8px 6px 82px !important; z-index: 90 !important; }
    .train-container.train-stopped .spin-wheel,
    .train-container.train-stopped .smoke-effect,
    .bus-stopped .smoke-effect { animation-play-state: paused !important; }
    body.embedded-modal-open #btn-fullscreen { display: none !important; }

    /* Posiciones distintas para el depósito inicial y el final. */
    img[src*="deposito_animado"], img[src*="depot_animado"] {
      position: relative !important;
      top: 52px !important;
      z-index: 3 !important;
    }
    img[src*="deposito_tren_final"] {
      position: relative !important;
      top: -34px !important;
      z-index: 3 !important;
    }

    @media (max-width: 932px) {
      .hud-title { left: calc(8px + env(safe-area-inset-left, 0px)) !important; top: calc(8px + env(safe-area-inset-top, 0px)) !important; width: min(45vw, 250px) !important; }
      .hud-timer-container { display: flex !important; top: calc(7px + env(safe-area-inset-top, 0px)) !important; left: 48vw !important; transform: scale(.42) !important; transform-origin: top left !important; }
      #btn-close-modal { top: calc(10px + env(safe-area-inset-top, 0px)) !important; right: calc(10px + env(safe-area-inset-right, 0px)) !important; z-index: 15001 !important; }
      img[src*="deposito_animado"], img[src*="depot_animado"] { top: 64px !important; }
      img[src*="deposito_tren_final"] { top: -46px !important; }
    }
  `;
  document.head.appendChild(style);

  const railImageTokens = [
    'deposito_animado', 'depot_animado', 'deposito_tren_final',
    'miguelete.gif', 'san_martin.gif', 'san_andres.gif',
    'villa_ballester.gif', 'malaver.gif', 'chilavert.gif',
    'jose_l_suarez.gif'
  ];

  function sceneryNodes() {
    const nodes = new Set();
    document.querySelectorAll('img').forEach((img) => {
      const src = (img.getAttribute('src') || '').toLowerCase();
      if (!railImageTokens.some((token) => src.includes(token))) return;
      nodes.add(img.closest('.maplibregl-marker') || img.parentElement || img);
    });
    [window.depot3MarkerEl, window.depot10MarkerEl, window.migueletMarkerEl, window.jlsMarkerEl]
      .forEach((el) => { if (el) nodes.add(el.closest?.('.maplibregl-marker') || el); });
    if (Array.isArray(window.localityGifEls)) {
      window.localityGifEls.forEach((el) => { if (el) nodes.add(el.closest?.('.maplibregl-marker') || el); });
    }
    return [...nodes];
  }

  function isAtPostaOne() {
    const label = document.querySelector('.posta-screen.visible');
    return Boolean(label && /^Posta\s*1\b/i.test(label.textContent.trim()));
  }

  function hideInitialRailScenery() {
    if (!isAtPostaOne() || leavingPostaOne) return;
    sceneryNodes().forEach((node) => {
      node.dataset.hiddenAtPostaOne = 'true';
      node.style.setProperty('display', 'none', 'important');
      node.style.setProperty('visibility', 'hidden', 'important');
      node.classList.remove('visible');
    });
  }

  function revealRailScenery() {
    sceneryNodes().forEach((node) => {
      if (node.dataset.hiddenAtPostaOne !== 'true') return;
      node.style.removeProperty('display');
      node.style.removeProperty('visibility');
      delete node.dataset.hiddenAtPostaOne;
    });
  }

  function pauseGif(img) {
    if (!img || img.dataset.stationPaused === 'true') return;
    if (!img.dataset.animSrc) img.dataset.animSrc = img.currentSrc || img.src;
    if (!img.complete || !img.naturalWidth) { img.addEventListener('load', () => pauseGif(img), { once: true }); return; }
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
    } catch (error) { console.warn('No se pudo detener el GIF del tren.', error); }
  }

  function resumeTrainGif(img) {
    if (!img) return;
    const source = new URL('tren_animado.gif', window.location.href);
    source.searchParams.set('play', String(Date.now()));
    img.dataset.animSrc = source.href;
    img.dataset.stationPaused = 'false';
    img.closest('.train-container')?.classList.remove('train-stopped');
    img.src = source.href;
  }

  function resumeBusBeforeTravel() {
    const bus = document.querySelector('.bus-image');
    if (!bus) return;
    const source = new URL('colectivo_animado.gif', window.location.href);
    source.searchParams.set('play', String(Date.now()));
    delete bus.dataset.pausedSrc;
    delete bus.dataset.stationFrame;
    bus.dataset.animSrc = source.href;
    bus.dataset.stationPaused = 'false';
    bus.src = source.href;
    bus.closest('#pinwheel-marker, .maplibregl-marker')?.classList.remove('bus-stopped');
  }

  function pauseTrainAtStation() {
    const train = document.querySelector('.train-gif-target');
    const stopLabel = document.querySelector('.posta-screen.visible');
    if (train && stopLabel) pauseGif(train);
  }

  function resumeVehiclesBeforeTravel() {
    if (isAtPostaOne()) leavingPostaOne = true;
    revealRailScenery();
    const train = document.querySelector('.train-gif-target');
    if (train) resumeTrainGif(train);
    resumeBusBeforeTravel();
  }

  function syncModalControls() {
    const modal = document.getElementById('embedded-modal');
    document.body.classList.toggle('embedded-modal-open', Boolean(modal && !modal.classList.contains('hidden')));
  }

  function syncExperience() {
    if (!isAtPostaOne()) leavingPostaOne = false;
    pauseTrainAtStation();
    hideInitialRailScenery();
    syncModalControls();
  }

  function initialise() {
    ['btn-next-3', 'btn-prev-3', 'btn-skip-3'].forEach((id) => {
      document.getElementById(id)?.addEventListener('click', resumeVehiclesBeforeTravel, true);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') resumeVehiclesBeforeTravel();
    }, true);
    const observer = new MutationObserver(() => window.requestAnimationFrame(syncExperience));
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'src', 'style'] });
    syncExperience();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise, { once: true });
  else initialise();
})();
