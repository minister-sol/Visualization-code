/* CodeLens interactive starfield, adapted from Gemini's background.html. */
(() => {
  const canvas = document.getElementById('viewportBackground');
  const picker = document.getElementById('backgroundStyle');
  const ctx = canvas?.getContext('2d', { alpha: false });
  if (!ctx || !picker) return;

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const tau = 2 * Math.PI;
  const interactiveContent = 'header, footer, .hero, .setup, .workspace-switch, .panel, .playback, #fsOverlay';
  const palettes = {
    nebula: {
      light: { base: '#EEF3F9', clouds: ['207,226,247', '221,215,244'], stars: ['35,100,195', '72,76,192', '110,65,177', '38,119,164'], accent: '37,99,235' },
      dark: { base: '#05070E', clouds: ['15,37,71', '27,19,59'], stars: ['115,188,255', '151,158,250', '186,141,242', '105,204,224'], accent: '147,197,253' },
    },
    aurora: {
      light: { base: '#EAF0F8', stars: ['9,82,104', '48,52,148'], accent: '9,82,104' },
      dark: { base: '#040810', clouds: ['8,46,54', '20,23,64'], stars: ['82,240,219', '157,168,255'], accent: '45,212,191' },
    },
    constellation: {
      light: { base: '#EFF2F8', clouds: ['220,231,247', '231,226,246'], stars: ['32,98,188', '32,120,159', '63,87,188', '90,76,177'], accent: '37,99,235' },
      dark: { base: '#060812', clouds: ['16,34,66', '29,21,61'], stars: ['108,184,249', '99,204,218', '141,164,250', '170,151,240'], accent: '196,181,253' },
    },
  };

  let width, height, stars, particles;
  let scheme = picker.value;
  let palette = palettes[scheme].light;
  let dark = false;
  let frame = null;
  let lastDraw = 0;
  let paper = null;
  const pulses = [];
  const rgba = (rgb, opacity) => `rgba(${rgb},${opacity})`;

  function redrawBase(time) {
    ctx.fillStyle = palette.base;
    ctx.fillRect(0, 0, width, height);
    if (scheme === 'aurora' && !dark) return;
    if (scheme === 'constellation') {
      const prism = ctx.createLinearGradient(0, 0, width, height);
      prism.addColorStop(0, rgba(palette.clouds[0], 0));
      prism.addColorStop(.35, rgba(palette.clouds[0], .7));
      prism.addColorStop(.65, rgba(palette.clouds[1], .6));
      prism.addColorStop(1, rgba(palette.clouds[1], 0));
      ctx.fillStyle = prism;
      ctx.fillRect(0, 0, width, height);
      return;
    }
    const driftX = Math.sin(time * .00025) * width * .06;
    const driftY = Math.cos(time * .0002) * height * .06;
    for (const [i, [x, y]] of [[.22, .25], [.78, .75]].entries()) {
      const left = x * width + (i === 0 ? driftX : -driftX);
      const top = y * height + (i === 0 ? driftY : -driftY);
      const radius = Math.max(width, height) * .55;
      const cloud = ctx.createRadialGradient(left, top, 0, left, top, radius);
      cloud.addColorStop(0, rgba(palette.clouds[i], .9));
      cloud.addColorStop(1, rgba(palette.clouds[i], 0));
      ctx.fillStyle = cloud;
      ctx.fillRect(0, 0, width, height);
    }
  }

  function resetBackground() {
    dark = document.body.dataset.theme === 'dark';
    palette = palettes[scheme][dark ? 'dark' : 'light'];
    // Aurora needs a stable base behind its trails, including in light mode.
    if (scheme === 'aurora') {
      redrawBase(0);
      paper = document.createElement('canvas');
      paper.width = canvas.width;
      paper.height = canvas.height;
      paper.getContext('2d').drawImage(canvas, 0, 0);
    } else {
      paper = null;
    }
    pulses.length = 0;
    for (const star of stars) {
      star.x = star.homeX;
      star.y = star.homeY;
      star.vx = star.vy = star.boost = 0;
    }
    draw(0, 0);
  }

  function resize() {
    width = Math.max(1, canvas.clientWidth);
    height = Math.max(1, canvas.clientHeight);
    const scale = Math.min(devicePixelRatio || 1, 2, Math.sqrt(2200000 / (width * height)));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);

    const narrow = width < 640;
    stars = Array.from({ length: narrow ? 100 : 190 }, (_, i) => ({
      homeX: Math.random() * width, homeY: Math.random() * height,
      radius: Math.random() < .14 ? 1.7 + Math.random() * 1.1 : .6 + Math.random() * .9,
      phase: Math.random() * tau, hue: i,
      speed: .008 + Math.random() * .015,
    }));
    particles = Array.from({ length: narrow ? 80 : 150 }, (_, i) => ({
      x: Math.random() * width, y: Math.random() * height,
      speed: .95 + Math.random() * 1.05, alpha: .5 + Math.random() * .38, hue: i % 2,
    }));
    resetBackground();
  }

  function drawStars(time, ticks) {
    const linked = [];
    for (const star of stars) {
      let glow;
      if (scheme === 'nebula') {
        const angle = time * .00065 + star.phase;
        const orbitX = star.homeX + 29 * Math.cos(angle);
        const orbitY = star.homeY + 18 * Math.sin(angle * 1.3);
        star.x += (star.vx + (orbitX - star.x) * .045) * ticks;
        star.y += (star.vy + (orbitY - star.y) * .045) * ticks;
        star.vx *= .92 ** ticks;
        star.vy *= .92 ** ticks;
        star.boost *= .96 ** ticks;
        glow = star.boost;
      } else {
        star.x = star.homeX + Math.sin(time * .00085 + star.phase) * 22;
        star.y = star.homeY + Math.cos(time * .00072 + star.phase) * 18;
        glow = 0;
        for (const pulse of pulses) {
          const distance = Math.hypot(star.x - pulse.x, star.y - pulse.y);
          if (distance < pulse.radius) glow = Math.max(glow, pulse.alpha * (1 - distance / 250));
        }
        if (glow > .12 || star.hue % 2 === 0) linked.push({ x: star.x, y: star.y, glow });
      }
      const twinkle = .72 + .19 * Math.sin(time * star.speed * .08 + star.phase);
      const opacity = Math.min(1, twinkle * (dark ? .96 : .92) + glow * .75);
      ctx.fillStyle = rgba(palette.stars[star.hue % palette.stars.length], opacity);
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius * 1.35 + glow * 1.7, 0, tau);
      ctx.fill();
    }
    ctx.lineWidth = 1.25;
    for (let i = 0; i < linked.length; i++) {
      const a = linked[i];
      for (let j = i + 1; j < linked.length; j++) {
        const b = linked[j];
        const activation = Math.min(a.glow, b.glow);
        const reach = activation > .12 ? 145 : 105;
        const dx = a.x - b.x, dy = a.y - b.y;
        if (Math.abs(dx) >= reach || Math.abs(dy) >= reach) continue;
        const distance = Math.hypot(dx, dy);
        if (distance >= reach) continue;
        ctx.strokeStyle = rgba(palette.accent, (.37 + .62 * activation) * (1 - distance / reach));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  function drawAurora(time, ticks) {
    ctx.globalAlpha = ticks ? 1 - .93 ** ticks : 1;
    ctx.drawImage(paper, 0, 0, width, height);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.6;
    for (const p of particles) {
      const angle = Math.sin(p.x * .003 + time * .00025) * 1.6 + Math.cos(p.y * .003 - time * .0002) * 1.6;
      let vx = Math.cos(angle) * p.speed;
      let vy = Math.sin(angle) * p.speed;
      for (const pulse of pulses) {
        const dx = pulse.x - p.x, dy = pulse.y - p.y;
        const distance = Math.hypot(dx, dy);
        if (distance <= 6 || distance >= 260) continue;
        const pull = (1 - distance / 260) * 1.8 * pulse.alpha;
        vx += (-dy + .45 * dx) / distance * pull;
        vy += (dx + .45 * dy) / distance * pull;
      }
      const nextX = p.x + vx * Math.max(1, ticks);
      const nextY = p.y + vy * Math.max(1, ticks);
      const color = palette.stars[p.hue];
      ctx.strokeStyle = rgba(color, p.alpha * .82);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nextX, nextY);
      ctx.stroke();
      ctx.fillStyle = rgba(color, p.alpha);
      ctx.beginPath();
      ctx.arc(nextX, nextY, 1.2, 0, tau);
      ctx.fill();
      if (!ticks) continue;
      p.x = nextX < 0 || nextX > width ? Math.random() * width : nextX;
      p.y = nextY < 0 || nextY > height ? Math.random() * height : nextY;
    }
  }

  function draw(time, ticks) {
    if (scheme === 'aurora') drawAurora(time, ticks);
    else {
      redrawBase(time);
      drawStars(time, ticks);
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.radius = Math.min(p.limit, p.radius + (scheme === 'constellation' ? 4.2 : 3.2) * ticks);
      p.alpha *= (scheme === 'constellation' ? .986 : .966) ** ticks;
      if (scheme !== 'constellation' || p.radius < p.limit) {
        ctx.lineWidth = scheme === 'constellation' ? 2.4 : 1.35;
        ctx.strokeStyle = rgba(palette.accent, p.alpha * .7 * (scheme === 'constellation' ? 1 - p.radius / p.limit : 1));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, tau);
        ctx.stroke();
      }
      if (p.alpha < .025 || (scheme !== 'constellation' && p.radius >= p.limit)) pulses.splice(i, 1);
    }
  }

  function animate(time) {
    if (!lastDraw || time - lastDraw >= 30) {
      draw(time, lastDraw ? Math.min(3, (time - lastDraw) / (1000 / 60)) : 1);
      lastDraw = time;
    }
    frame = requestAnimationFrame(animate);
  }

  function updateMotion() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    lastDraw = 0;
    if (document.hidden) return;
    if (motion.matches) resetBackground();
    else frame = requestAnimationFrame(animate);
  }

  document.addEventListener('pointerdown', event => {
    if (event.button !== 0 || motion.matches || document.body.classList.contains('fs-open') ||
        (event.target instanceof Element && event.target.closest(interactiveContent))) return;
    const { clientX: x, clientY: y } = event;
    if (pulses.length >= 4) pulses.shift();
    pulses.push({ x, y, radius: 4, alpha: 1, limit: scheme === 'aurora' ? 180 : 250 });
    if (scheme !== 'nebula') return;
    for (const s of stars) {
      const dx = s.x - x, dy = s.y - y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 1 || distance >= 220) continue;
      const strength = (1 - distance / 220) * 2.4 / distance;
      s.vx += dx * strength;
      s.vy += dy * strength;
      s.boost = 1;
    }
  }, { passive: true });

  picker.addEventListener('change', () => {
    scheme = picker.value;
    resetBackground();
  });
  new MutationObserver(resetBackground).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
  window.addEventListener('resize', resize);
  motion.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  resize();
  updateMotion();
})();
