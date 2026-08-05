(() => {
  'use strict';

  let leavingPostaOne = false;
  let vehicleTraveling = false;
  let travelStartedAt = 0;

  const style = document.createElement('style');
  style.textContent = `
    .hud-title { left: 22% !important; top: 18px !important; width: min(31vw, 520px) !important; }

    .hud-timer-container {
      top: 20px !important;
      left: 55% !important;
      right: auto !important;
      bottom: auto !important;
      transform: scale(.72) !important;
      transform-origin: top left !important;
      padding: 14px 18px !important;
      z-index: 90 !important;
      background: rgba(255,255,255,.82) !important;
      border-radius: 16px !important;
      box-shadow: 0 6px 20px rgba(0,0,0,.28) !important;
      backdrop-filter: blur(3px) !important;
    }
    .hud-aspas { display: none !important; }
    .hud-timer, .timer-label, .timer-target, .time-sub, .colon { color: #111 !important; text-shadow: none !important; }

    /* Cartel activo: se mantiene grande, excepto en Posta 1. */
    .posta-screen {
      font-size: clamp(52px, 5vw, 76px) !important;
      line-height: 1.12 !important;
      padding: 34px 46px !important;
      min-width: min(72vw, 900px) !important;
      max-width: 88vw !important;
      border-width: 5px !important;
      border-radius: 24px !important;
      text-align: center !important;
      box-shadow: 0 0 32px currentColor, 0 12px 34px rgba(0,0,0,.65) !important;
      white-space: normal !important;
    }
    .posta-screen.hide-at-posta-one {
      display: none !important;
    }

    /* Etiquetas permanentes del mapa: aproximadamente el doble y desplazadas. */
    .enhanced-posta-label {
      position: relative !important;
      font-size: 2em !important;
      line-height: 1.05 !important;
      padding: .65em .9em !important;
      min-width: max-content !important;
      border-width: 3px !important;
      border-radius: 10px !important;
      transform: translate(26px, -28px) !important;
      box-shadow: 0 0 14px rgba(0,255,255,.8), 0 6px 14px rgba(0,0,0,.55) !important;
      z-index: 220 !important;
      overflow: visible !important;
    }
    .enhanced-posta-label:nth-of-type(even) {
      transform: translate(-34px, 30px) !important;
    }
    .enhanced-posta-label::before {
      content: '';
      position: absolute;
      width: 42px;
      height: 1.5px;
      left: -34px;
      bottom: -13px;
      background: rgba(255,255,255,.9);
      box-shadow: 0 0 4px rgba(0,255,255,.9);
      transform: rotate(38deg);
      transform-origin: right center;
      pointer-events: none;
    }
    .enhanced-posta-label:nth-of-type(even)::before {
      left: auto;
      right: -34px;
      top: -12px;
      bottom: auto;
      transform: rotate(38deg);
      transform-origin: left center;
    }

    .train-container.train-stopped .spin-wheel,
    .train-container.train-stopped .smoke-effect,
    .bus-stopped .smoke-effect { animation-play-state: paused !important; }
    body.embedded-modal-open #btn-fullscreen { display: none !important; }

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
      .hud-timer-container {
        display: flex !important;
        top: calc(7px + env(safe-area-inset-top, 0px)) !important;
        left: 48vw !important;
        transform: scale(.42) !important;
        transform-origin: top left !important;
        padding: 14px 18px !important;
      }
      .posta-screen {
        font-size: clamp(38px, 10vw, 58px) !important;
        padding: 28px 30px !important;
        min-width: min(84vw, 620px) !important;
        max-width: 90vw !important;
        border-width: 4px !important;
      }
      .enhanced-posta-label {
        font-size: 1.85em !important;
        padding: .6em .8em !important;
        transform: translate(22px, -24px) !important;
      }
      .enhanced-posta-label:nth-of-type(even) {
        transform: translate(-28px, 26px) !important;
      }
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

  function currentPostaLabel() {
    return document.querySelector('.posta-screen.visible');
  }

  function isAtPostaOne() {
    const label = currentPostaLabel();
    return Boolean(label && /^Posta\s*1\b/i.test(label.textContent.trim()));
  }

  function hidePostaOneActiveCard() {
    const label = currentPostaLabel();
    if (!label) return;
    label.classList.toggle('hide-at-posta-one', /^Posta\s*1\b/i.test(label.textContent.trim()));
  }

  function enlargeBus() {
    const bus = document.querySelector('.bus-image');
    if (!bus || bus.dataset.doubleSizeApplied === 'true') return;
    const inlineWidth = parseFloat(bus.style.width);
    const renderedWidth = bus.getBoundingClientRect().width;
    const baseWidth = Number.isFinite(inlineWidth) && inlineWidth > 0 ? inlineWidth : renderedWidth;
    if (!baseWidth) return;
    bus.dataset.doubleSizeApplied = 'true';
    bus.style.width = `${Math.round(baseWidth * 2)}px`;
  }

  function enhanceMapLabels() {
    const labels = new Set();
    if (Array.isArray(window.postaLabels)) window.postaLabels.forEach((label) => label && labels.add(label));
    document.querySelectorAll('.posta-label, .posta-label-marker, [class*="posta-label"]').forEach((label) => labels.add(label));
    labels.forEach((label, index) => {
      const element = label instanceof HTMLElement ? label : label?.getElement?.();
      if (!(element instanceof HTMLElement)) return;
      element.classList.add('enhanced-posta-label');
      element.dataset.postaLabelIndex = String(index + 1);
    });
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
    enlargeBus();
  }

  function pauseTrainAtStation() {
    const train = document.querySelector('.train-gif-target');
    const stopLabel = currentPostaLabel();
    const destination = document.getElementById('dest-ui');
    const destinationActive = Boolean(destination && destination.classList.contains('active'));

    if (vehicleTraveling) {
      const graceElapsed = Date.now() - travelStartedAt > 900;
      if (graceElapsed && stopLabel && !destinationActive) vehicleTraveling = false;
      else return;
    }

    if (train && stopLabel && !destinationActive) pauseGif(train);
  }

  function resumeVehiclesBeforeTravel() {
    vehicleTraveling = true;
    travelStartedAt = Date.now();
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
    hidePostaOneActiveCard();
    hideInitialRailScenery();
    enlargeBus();
    enhanceMapLabels();
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
