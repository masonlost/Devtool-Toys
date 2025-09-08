(() => {
  // Prevent duplicates
  if (window.__rainFX && window.__rainFX.stop) { window.__rainFX.stop(); }

  const state = {
    running: true,
    drops: [],
    density: 0.00012,     // raindrops per screen pixel
    wind: 0,              // horizontal drift (px/s)
    gravity: 1400,        // base fall speed (px/s)
    baseDim: 0.58,        // normal darkness [0..1] where 1 is fully black
    dpr: Math.max(1, Math.min(2, window.devicePixelRatio || 1)),
    flashTimer: 0,
    nextFlashIn: 0,
    flashPattern: [],
    flashIdx: 0,
    flashTarget: null,    // target opacity during flashes
    dimOpacity: 0,        // actual current dim value
    lastT: performance.now()
  };

  // DOM setup
  const root = document.createElement('div');
  root.style.cssText = `
    position:fixed; inset:0; pointer-events:none; z-index:2147483647; 
    contain:strict; isolation:isolate;`;
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d');
  const dim = document.createElement('div');
  dim.style.cssText = `
    position:absolute; inset:0; background:#000; opacity:${state.baseDim}; 
    transition:opacity 50ms linear;`;
  root.appendChild(cv);
  root.appendChild(dim);
  document.body.appendChild(root);

  // Sizing & drops
  function size() {
    const w = root.clientWidth, h = root.clientHeight;
    cv.width = Math.floor(w * state.dpr);
    cv.height = Math.floor(h * state.dpr);
    cv.style.width = w + 'px';
    cv.style.height = h + 'px';
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    seedDrops();
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function seedDrops() {
    const area = root.clientWidth * root.clientHeight;
    const target = Math.max(150, Math.floor(area * state.density));
    const drops = [];
    for (let i = 0; i < target; i++) {
      drops.push(makeDrop(true));
    }
    state.drops = drops;
  }

  function makeDrop(spawnAnywhere = false) {
    const w = root.clientWidth, h = root.clientHeight;
    const speed = rand(0.8, 1.2) * state.gravity;
    const len = rand(8, 16) * (speed / state.gravity);
    const thick = rand(0.75, 1.8);
    return {
      x: rand(-w * 0.1, w * 1.1),
      y: spawnAnywhere ? rand(-h, h) : rand(-h, -10),
      vx: state.wind + rand(-40, 40),
      vy: speed,
      len, thick, alpha: rand(0.35, 0.8)
    };
  }

  // Lightning scheduling
  function scheduleNextFlash() {
    // Random every 6–18 seconds, slight bias to “rare but noticeable”
    state.nextFlashIn = rand(6000, 18000);
    state.flashTimer = 0;
    state.flashPattern = []; // empty until triggered
    state.flashIdx = 0;
    state.flashTarget = null;
  }

  scheduleNextFlash();

  // Animation
  function loop(now) {
    if (!state.running) return;
    const dt = Math.min(50, now - state.lastT); // clamp dt to avoid big jumps
    state.lastT = now;

    // Update rain
    const w = root.clientWidth, h = root.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';

    for (let i = 0; i < state.drops.length; i++) {
      const d = state.drops[i];
      d.x += (d.vx) * dt / 1000;
      d.y += (d.vy) * dt / 1000;

      // recycle
      if (d.y - d.len > h || d.x < -50 || d.x > w + 50) {
        state.drops[i] = makeDrop(false);
        continue;
      }

      // draw
      ctx.globalAlpha = d.alpha;
      ctx.lineWidth = d.thick;
      ctx.strokeStyle = '#a8c1ff';
      ctx.beginPath();
      ctx.moveTo(d.x, d.y - d.len);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Lightning logic
    state.flashTimer += dt;
    if (state.flashPattern.length === 0 && state.flashTimer >= state.nextFlashIn) {
      // Build a flicker pattern: a few quick dips then a big flash
      // Each entry is [opacityTarget, durationMs]
      const base = state.baseDim;
      state.flashPattern = [
        [Math.max(0.10, base - 0.40), 60],
        [base, 90],
        [Math.max(0.06, base - 0.50), 70],
        [base, 110],
        [Math.max(0.02, base - 0.56), 120], // main flash
        [base, 260]
      ];
      state.flashIdx = 0;
      state.flashTimer = 0;
      state.flashTarget = state.flashPattern[0][0];
      dim.style.transitionDuration = state.flashPattern[0][1] + 'ms';
      dim.style.opacity = String(state.flashTarget);
    } else if (state.flashPattern.length > 0) {
      const step = state.flashPattern[state.flashIdx];
      if (state.flashTimer >= step[1]) {
        state.flashTimer = 0;
        state.flashIdx++;
        if (state.flashIdx >= state.flashPattern.length) {
          // Done flashing
          scheduleNextFlash();
          dim.style.transitionDuration = '80ms';
          dim.style.opacity = String(state.baseDim);
        } else {
          const [nextOpacity, dur] = state.flashPattern[state.flashIdx];
          dim.style.transitionDuration = dur + 'ms';
          dim.style.opacity = String(nextOpacity);
        }
      }
    } else {
      // Hold base dim when idle
      if (dim.style.opacity !== String(state.baseDim)) {
        dim.style.opacity = String(state.baseDim);
      }
    }

    requestAnimationFrame(loop);
  }

  // Kickoff
  size();
  state.dimOpacity = state.baseDim;
  window.addEventListener('resize', size, { passive: true });

  state.raf = requestAnimationFrame(loop);

  function stop() {
    state.running = false;
    cancelAnimationFrame(state.raf);
    window.removeEventListener('resize', size);
    root.remove();
  }
  function start() {
    if (state.running) return;
    state.running = true;
    state.lastT = performance.now();
    state.raf = requestAnimationFrame(loop);
  }
  function set(opts = {}) {
    if (typeof opts.density === 'number') {
      state.density = Math.max(0.00002, opts.density);
      seedDrops();
    }
    if (typeof opts.wind === 'number') state.wind = opts.wind;
    if (typeof opts.gravity === 'number') state.gravity = Math.max(300, opts.gravity);
    if (typeof opts.baseDim === 'number') {
      state.baseDim = Math.min(1, Math.max(0, opts.baseDim));
      dim.style.opacity = String(state.baseDim);
    }
  }

  window.__rainFX = { stop, start, set, root };
  // Handy console hints:
  console.log('%cRain on! ☔', 'font-weight:bold;');
  console.log('Tweak with __rainFX.set({ density, wind, gravity, baseDim })');
  console.log('Stop with __rainFX.stop()  |  Resume with __rainFX.start()');
})();
