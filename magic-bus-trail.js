(() => {
  'use strict';

  if (window.__magicBusTrailLoaded) return;
  window.__magicBusTrailLoaded = true;

  const style = document.createElement('style');
  style.textContent = `
    .magic-bus-sparkle {
      position: fixed;
      width: var(--spark-size, 8px);
      height: var(--spark-size, 8px);
      left: 0;
      top: 0;
      border-radius: 50%;
      pointer-events: none;
      z-index: 4900;
      opacity: 0;
      background: var(--spark-color, #00ffff);
      box-shadow:
        0 0 6px var(--spark-color, #00ffff),
        0 0 14px var(--spark-color, #00ffff),
        0 0 24px rgba(255,255,255,.7);
      transform: translate(-50%, -50%) scale(.35);
      animation: magicBusSparkle var(--spark-life, 850ms) ease-out forwards;
      will-change: transform, opacity;
    }

    .magic-bus-sparkle::before,
    .magic-bus-sparkle::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 50%;
      width: 180%;
      height: 2px;
      background: currentColor;
      transform: translate(-50%, -50%);
      opacity: .75;
      border-radius: 999px;
    }

    .magic-bus-sparkle::after {
      transform: translate(-50%, -50%) rotate(90deg);
    }

    @keyframes magicBusSparkle {
      0% {
        opacity: .95;
        transform: translate(-50%, -50%) scale(.35) rotate(0deg);
      }
      45% {
        opacity: .9;
      }
      100% {
        opacity: 0;
        transform:
          translate(
            calc(-50% + var(--spark-drift-x, -30px)),
            calc(-50% + var(--spark-drift-y, 24px))
          )
          scale(1.35)
          rotate(170deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .magic-bus-sparkle { display: none !important; }
    }
  `;
  document.head.appendChild(style);

  const colors = ['#00ffff', '#ff3cac', '#ffe84a', '#7dff5b', '#7a5cff', '#ff8a35'];
  const mobile = window.matchMedia('(max-width: 932px), (pointer: coarse)');
  let lastPosition = null;
  let lastEmission = 0;

  function isBusTraveling() {
    const bus = document.querySelector('.bus-image');
    const destination = document.getElementById('dest-ui');
    if (!bus || !destination?.classList.contains('active')) return false;
    const rect = bus.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function createSparkle(x, y) {
    const particle = document.createElement('span');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = (mobile.matches ? 5 : 7) + Math.random() * (mobile.matches ? 5 : 8);
    const driftX = -18 - Math.random() * (mobile.matches ? 34 : 55);
    const driftY = -18 + Math.random() * 50;

    particle.className = 'magic-bus-sparkle';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.color = color;
    particle.style.setProperty('--spark-color', color);
    particle.style.setProperty('--spark-size', `${size}px`);
    particle.style.setProperty('--spark-drift-x', `${driftX}px`);
    particle.style.setProperty('--spark-drift-y', `${driftY}px`);
    particle.style.setProperty('--spark-life', `${650 + Math.random() * 420}ms`);
    document.body.appendChild(particle);
    particle.addEventListener('animationend', () => particle.remove(), { once: true });
  }

  function emitTrail(busRect) {
    const count = mobile.matches ? 1 : 2;
    const originX = busRect.left + busRect.width * .16;
    const originY = busRect.top + busRect.height * (.48 + Math.random() * .26);
    for (let i = 0; i < count; i += 1) {
      createSparkle(
        originX + (Math.random() - .5) * Math.min(44, busRect.width * .12),
        originY + (Math.random() - .5) * Math.min(34, busRect.height * .18)
      );
    }
  }

  function animate(now) {
    const bus = document.querySelector('.bus-image');
    if (bus && isBusTraveling()) {
      const rect = bus.getBoundingClientRect();
      const position = `${Math.round(rect.left)}:${Math.round(rect.top)}`;
      const moved = position !== lastPosition;
      const interval = mobile.matches ? 125 : 75;
      if (moved && now - lastEmission >= interval) {
        emitTrail(rect);
        lastEmission = now;
      }
      lastPosition = position;
    } else {
      lastPosition = null;
    }
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();
