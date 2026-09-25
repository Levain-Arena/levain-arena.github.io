// The agents' plates: the Bake AI bread meets each company's logo, and every agent gets its own little scene.
// The bread is the mascot image cut into pieces (assets/bread/: arm, body, face, eyes, hat); nothing is redrawn.
// The logos only move and change size, never rotate or change colour, so each company's mark stays as published.
// The scenes play by themselves: every plate on screen replays its scene every few seconds, the plates taking turns,
// and between scenes the bread blinks now and then. Plates off screen, and a hidden tab, wait.
// With reduced motion nothing moves.
(() => {
  const plates = [...document.querySelectorAll('#agents .plates > li[data-act]')];
  if (!plates.length || !('animate' in Element.prototype) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const OUT = 'cubic-bezier(.22, 1, .36, 1)', IN = 'cubic-bezier(.55, 0, 1, .45)', IO = 'cubic-bezier(.65, 0, .35, 1)', SOFT = 'ease-in-out';
  // keyframes from rows [offset, ...values, easing?]; a row without values repeats the previous one
  const rows = (list, make, n) => {
    let prev = null;
    return list.map(r => {
      const vals = r.slice(1, 1 + n).filter(v => typeof v === 'number');
      const easing = typeof r[r.length - 1] === 'string' ? r[r.length - 1] : undefined;
      const k = vals.length ? make(...vals) : prev;
      prev = k;
      return Object.assign({offset: r[0]}, k, easing ? {easing} : {});
    });
  };
  // the parts: whole bread (translate %, rotate deg, scale x, y), hat (translate, rotate, scale), arm (rotate),
  // face (translate %), eyes (vertical scale), floor shadow (shift %, scale, opacity), logo (translate %, scale, opacity)
  const B = (x = 0, y = 0, r = 0, sx = 1, sy = sx) => ({transform: `translate(${x}%, ${y}%) rotate(${r}deg) scale(${sx}, ${sy})`});
  const HAT = (x = 0, y = 0, r = 0, sx = 1, sy = sx) => ({transform: `translate(${x}%, ${y}%) rotate(${r}deg) scale(${sx}, ${sy})`});
  const ARM = (r = 0) => ({transform: `rotate(${r}deg)`});
  const FACE = (x = 0, y = 0) => ({transform: `translate(${x}%, ${y}%)`});
  const EYES = (s = 1) => ({transform: `scale(1, ${s})`});
  const FLOOR = (x = 0, s = 1, o = 1) => ({transform: `translateX(${x}%) scale(${s})`, opacity: o});
  const LOGO = (x = 0, y = 0, s = 1, o = 1) => ({transform: `translate(${x}%, ${y}%) scale(${s})`, opacity: o});
  const blink = at => [[0, 1], [at, 1], [at + .03, .1], [at + .07, 1], [1, 1]];

  const ACTS = {
    // Kimi (Moonshot): a jump for the moon; the hat lifts at the top and the moon bobs
    moon: {dur: 2800, front: false, parts: {
      bread: [[0, 0, 0, 0, 1, 1], [.1, 0, 0, 0, 1.05, .9, OUT], [.28, 4, -13, 0, .95, 1.07, OUT], [.42, 6, -16, 0, 1, 1, IN],
        [.58, 1, 0, 0, 1.07, .9, OUT], [.7, 0, 0, 0, .98, 1.03, SOFT], [.82, 0, 0, 0, 1, 1], [1]],
      floor: [[0, 0, 1, 1], [.1, 0, 1.08, 1], [.42, 4, .55, .45], [.58, 0, 1.1, 1], [.82, 0, 1, 1], [1]],
      hat: [[0, 0, 0, 0], [.28, 0, -3, -4], [.44, 2, -9, -10, SOFT], [.58, 0, -4, 6], [.66, 0, 0, -2], [.74, 0, 0, 0], [1]],
      arm: [[0, 0], [.16, -6], [.32, 42, OUT], [.5, 38], [.64, 10], [.74, 0], [1]],
      face: [[0, 0, 0], [.12, 1.1, -.9, OUT], [.66, 1.1, -.9], [.8, 0, 0], [1]],
      eyes: blink(.57),
      logo: [[0, 0, 0, 1, 1], [.4, 0, 0, 1, 1], [.47, 0, -12, 1.06, 1, OUT], [.6, 0, 4, 1, 1], [.7, 0, 0, 1, 1], [1]],
    }},
    // MiniMax: dancing to the waveform, four beats
    dance: {dur: 3000, front: false, parts: {
      logo: [[0, 0, 0, 1, 1], [.04, 0, 0, 1.12, 1, OUT], [.18, 0, 0, 1, 1], [.25], [.29, 0, 0, 1.12, 1, OUT], [.43, 0, 0, 1, 1], [.5],
        [.54, 0, 0, 1.12, 1, OUT], [.68, 0, 0, 1, 1], [.75], [.79, 0, 0, 1.14, 1, OUT], [.93, 0, 0, 1, 1], [1]],
      bread: [[0, 0, 0, 0], [.1, 0, -3, -6, 1, 1, SOFT], [.25, 0, 0, -4], [.35, 0, -3, 6], [.5, 0, 0, 4], [.6, 0, -3, -6], [.75, 0, 0, -4],
        [.85, 0, -4, 5], [1, 0, 0, 0]],
      arm: [[0, 0], [.1, 30], [.2, 8], [.35, 32], [.45, 8], [.6, 30], [.7, 8], [.85, 34], [.95, 0], [1]],
      hat: [[0, 0, 0, 0], [.12, 0, -2, 5], [.37, 0, -2, -5], [.62, 0, -2, 5], [.87, 0, -3, -6], [1, 0, 0, 0]],
      face: [[0, 0, 0], [.1, -1, 0], [.35, 1, 0], [.6, -1, 0], [.85, 1, 0], [1, 0, 0]],
      eyes: blink(.5),
      floor: [[0, 0, 1, 1], [.1, 0, .92, 1], [.25, 0, 1, 1], [.35, 0, .92, 1], [.5, 0, 1, 1], [.6, 0, .92, 1], [.75, 0, 1, 1], [.85, 0, .9, 1], [1, 0, 1, 1]],
    }},
    // DeepSeek: the whale dives, swims past behind the bread and lifts it, the bread waves it off; it swims back
    whale: {dur: 3600, front: false, parts: {
      logo: [[0, 0, 0, 1, 1], [.12, 10, 70, 1, 1, IO], [.45, -250, 70, 1, 1, SOFT], [.58, -340, 60, 1, 1], [.6, -340, 60, 1, 0],
        [.61, 130, 0, 1, 0], [.66, 105, 0, 1, 1, OUT], [.86, 0, 0, 1, 1], [1]],
      bread: [[0, 0, 0, 0], [.22, 0, 0, 0], [.3, 0, -9, -5, 1, 1, OUT], [.38, 0, -11, 4, 1, 1, SOFT], [.46, 0, -4, -2], [.54, 0, 0, 0, 1, 1, SOFT], [1]],
      face: [[0, 0, 0], [.1, 1.1, .8], [.3, 0, .9], [.5, -1.1, .5], [.62, -1.1, 0], [.8, 1, 0], [.92, 0, 0], [1]],
      eyes: blink(.47),
      arm: [[0, 0], [.5, 0], [.56, 30], [.62, 8], [.68, 30], [.76, 0], [1]],
      hat: [[0, 0, 0, 0], [.28, 0, 0, 0], [.34, 0, -5, -6], [.42, 0, -3, 5], [.52, 0, 0, 0], [1]],
      floor: [[0, 0, 1, 1], [.22, 0, 1, 1], [.32, 0, .7, .6], [.46, 0, .9, .9], [.54, 0, 1, 1], [1]],
    }},
    // GLM (Z.ai): three hops that trace a Z
    zigzag: {dur: 3000, front: false, parts: {
      bread: [[0, 0, 0, 0, 1, 1], [.06, 0, 0, 0, 1.05, .92, OUT], [.17, 9, -11, 4, .96, 1.05, IN], [.27, 16, 0, 0, 1.06, .92, OUT],
        [.33, 16, 0, 0, 1.05, .93, OUT], [.45, 4, -12, -4, .96, 1.05, IN], [.55, -8, 0, 0, 1.06, .92, OUT], [.61, -8, 0, 0, 1.05, .93, OUT],
        [.73, 0, -10, 3, .96, 1.05, IN], [.83, 6, 0, 0, 1.05, .93, OUT], [.92, 0, 0, 0, .99, 1.02, SOFT], [1, 0, 0, 0, 1, 1]],
      floor: [[0, 0, 1, 1], [.06, 0, 1.06, 1], [.17, 12, .65, .5], [.27, 21, 1.08, 1], [.33, 21, 1.05, 1], [.45, 5, .6, .5], [.55, -10, 1.08, 1],
        [.61, -10, 1.05, 1], [.73, 0, .66, .5], [.83, 8, 1.06, 1], [.92, 0, 1, 1], [1]],
      logo: [[0, 0, 0, 1, 1], [.27, 0, 0, 1, 1], [.29, 0, 0, 1.08, 1, OUT], [.35, 0, 0, 1, 1], [.55], [.57, 0, 0, 1.08, 1, OUT],
        [.63, 0, 0, 1, 1], [.83], [.85, 0, 0, 1.08, 1, OUT], [.91, 0, 0, 1, 1], [1]],
      hat: [[0, 0, 0, 0], [.17, 0, -4, -6], [.27, 0, 0, 4], [.45, 0, -5, 6], [.55, 0, 0, -4], [.73, 0, -5, -5], [.83, 0, 0, 3], [.92, 0, 0, 0], [1]],
      face: [[0, 0, 0], [.1, 1, 0], [.3, -1, 0], [.6, 1, 0], [.9, 0, 0], [1]],
      eyes: blink(.56),
      arm: [[0, 0], [.17, 20], [.27, 0], [.45, 25], [.55, 0], [.73, 18], [.83, 0], [1]],
    }},
    // Grok: the mark swoops over, the bread ducks and its hat is blown off, then falls back on
    duck: {dur: 2800, front: true, parts: {
      logo: [[0, 0, 0, 1, 1], [.14, 18, -30, 1, 1, OUT], [.36, -150, -60, 1, 1, IN], [.48, -380, -70, 1, 1], [.49, -380, -70, 1, 0],
        [.5, 120, 0, 1, 0], [.56, 90, 0, 1, 1, OUT], [.78, 0, 0, 1, 1], [1]],
      bread: [[0, 0, 0, 0, 1, 1], [.24], [.3, 0, 0, 0, 1.08, .84, OUT], [.46, 0, 0, 0, 1.07, .85, OUT], [.54, 0, -3, 0, .97, 1.05, OUT],
        [.62, 0, 0, 0, 1, 1], [1]],
      hat: [[0, 0, 0, 0], [.3, 0, 0, 0, 1, 1, OUT], [.38, -18, -14, -28, 1, 1], [.5, -14, -18, -38, 1, 1, IN], [.62, -2, -5, 10], [.68, 0, 0, -4], [.74, 0, 0, 0], [1]],
      eyes: [[0, 1], [.26, 1], [.29, .1], [.5, .1], [.54, 1], [1, 1]],
      face: [[0, 0, 0], [.2, 0, 0], [.28, 0, 1], [.5, 0, 1], [.56, -1, -.5], [.7, -1, -.5], [.8, 0, 0], [1]],
      arm: [[0, 0], [.24, 0], [.3, 36], [.5, 36], [.6, 0], [1]],
      floor: [[0, 0, 1, 1], [.24], [.3, 0, 1.08, 1], [.46], [.54, 0, .95, 1], [.62, 0, 1, 1], [1]],
    }},
    // Gemini: the sparkle floats over and settles on top of the chef's hat; the bread wriggles with delight
    sparkle: {dur: 3200, front: true, parts: {
      logo: [[0, 0, 0, 1, 1], [.1, -20, -30, 1.08, 1, OUT], [.34, -162, -100, .42, 1, IO], [.62, -162, -100, .42, 1], [.7, -160, -110, .5, 1, IO],
        [.9, 0, 0, 1, 1], [1]],
      bread: [[0, 0, 0, 0], [.34, 0, 0, 0], [.38, 0, 0, -3], [.44, 0, 0, 3], [.5, 0, 0, -2], [.56, 0, 0, 0], [1]],
      hat: [[0, 0, 0, 0, 1, 1], [.33, 0, 0, 0, 1, 1], [.37, 0, 1, 0, 1.04, .95], [.43, 0, 0, 0, 1, 1], [1]],
      eyes: [[0, 1], [.4, 1], [.43, .1], [.52, .1], [.56, 1], [1, 1]],
      face: [[0, 0, 0], [.1, 0, -1], [.6, 0, -1], [.8, 0, 0], [1]],
      arm: [[0, 0], [.36, 0], [.44, 32], [.52, 10], [.6, 32], [.7, 0], [1]],
    }},
    // GPT-6 Astra: the bread tosses the logo like a round of dough, twice
    toss: {dur: 3400, front: true, parts: {
      logo: [[0, 0, 0, 1, 1], [.16, -262, 26, .5, 1, OUT], [.28, -254, -92, .5, 1, IN], [.4, -262, 26, .5, 1, OUT], [.52, -250, -104, .5, 1, IN],
        [.64, -262, 26, .5, 1, IO], [.84, 0, 0, 1, 1], [1]],
      arm: [[0, 0], [.12, 56, OUT], [.4, 56], [.43, 46], [.46, 56], [.64, 56], [.67, 46], [.72, 56], [.84, 56], [.92, 0], [1]],
      bread: [[0, 0, 0, 0, 1, 1], [.4], [.43, 0, 0, 0, 1.03, .96], [.47, 0, 0, 0, 1, 1], [.64], [.67, 0, 0, 0, 1.03, .96], [.71, 0, 0, 0, 1, 1], [1]],
      face: [[0, 0, 0], [.1, -1, 0], [.28, -1, -1], [.4, -1, 0], [.52, -1, -1], [.64, -1, 0], [.86, 0, 0], [1]],
      eyes: blink(.9),
      hat: [[0, 0, 0, 0], [.28, 0, -2, -4], [.4, 0, 0, 0], [.52, 0, -2, -4], [.64, 0, 0, 0], [1]],
    }},
    // GPT-5.6 Sol: the logo sets and rises again like the sun; the bread rises with it, stretching in the warmth
    sunrise: {dur: 3800, front: false, parts: {
      logo: [[0, 0, 0, 1, 1], [.12, 0, 120, 1, 1, IN], [.14, 0, 150, 1, 0], [.15, -30, 170, 1, 0], [.2, -30, 150, 1, 0, OUT], [.34, -30, 40, 1.06, 1, OUT],
        [.55, -20, -66, 1.12, 1], [.8, -20, -66, 1.12, 1, IO], [1, 0, 0, 1, 1]],
      bread: [[0, 0, 0, 0, 1, 1], [.3], [.48, 0, -1, 0, .96, 1.07, OUT], [.78, 0, -1, 0, .96, 1.07], [.9, 0, 0, 0, 1, 1, OUT], [1]],
      arm: [[0, 0], [.34, 0], [.48, 44, OUT], [.78, 44], [.9, 0], [1]],
      eyes: [[0, 1], [.46, 1], [.5, .12], [.78, .12], [.82, 1], [1, 1]],
      hat: [[0, 0, 0, 0], [.46, 0, 0, 0], [.52, 0, -3, -6], [.78, 0, -3, -6], [.88, 0, 0, 0], [1]],
      face: [[0, 0, 0], [.4, 0, 0], [.5, .6, -1], [.8, .6, -1], [.9, 0, 0], [1]],
      floor: [[0, 0, 1, 1], [.3], [.48, 0, .94, 1], [.78, 0, .94, 1], [.9, 0, 1, 1], [1]],
    }},
    // GPT-6 Sol: the sun crosses the sky over the bread like a sundial's; the shadow swings, the bread follows it
    // and shades its eyes at noon
    sundial: {dur: 4000, front: false, parts: {
      logo: [[0, 0, 0, 1, 1], [.14, -38, -81, .62, 1, SOFT], [.34, -115, -106, .6, 1, SOFT], [.54, -208, -92, .6, 1, SOFT],
        [.66, -262, -25, .6, 1], [.68, -262, -25, .6, 0], [.7, 0, 0, 1, 0], [.8, 0, 0, 1, 1, OUT], [1]],
      floor: [[0, 0, 1, 1], [.14, -12, 1.15, .9, SOFT], [.34, 0, .85, 1, SOFT], [.54, 10, 1.1, .9, SOFT], [.66, 16, 1.25, .8],
        [.8, 0, 1, 1, SOFT], [1]],
      bread: [[0, 0, 0, 0], [.14, 0, 0, 2, 1, 1, SOFT], [.34, 0, -1, 0, 1, 1, SOFT], [.54, 0, 0, -2, 1, 1, SOFT], [.66, 0, 0, -2.5], [.8, 0, 0, 0, 1, 1, SOFT], [1]],
      face: [[0, 0, 0], [.1, 1.1, -.6], [.34, 0, -1], [.54, -1.1, -.6], [.66, -1.1, 0], [.8, 0, 0], [1]],
      eyes: [[0, 1], [.28, 1], [.32, .45], [.4, .45], [.44, 1], [.72, 1], [.75, .1], [.79, 1], [1, 1]],
      hat: [[0, 0, 0, 0], [.14, 0, 0, 4], [.34, 0, -2, 0], [.54, 0, 0, -4], [.7, 0, 0, 0], [1]],
      arm: [[0, 0], [.24, 0], [.3, 50, OUT], [.42, 50], [.5, 0], [1]],
    }},
  };
  const MAKERS = {bread: [B, 5], hat: [HAT, 5], arm: [ARM, 1], face: [FACE, 2], eyes: [EYES, 1], floor: [FLOOR, 3], logo: [LOGO, 4]};

  const state = new Map();
  for (const li of plates) {
    const stage = li.querySelector('.stage');
    const el = {
      bread: stage.querySelector('.bread'), hat: stage.querySelector('.b-hat'), arm: stage.querySelector('.b-arm'),
      face: stage.querySelector('.b-face'), eyes: stage.querySelector('.b-eyes'), floor: stage.querySelector('.floor'),
      logo: stage.querySelector('.mlogo'),
    };
    state.set(li, {stage, el, running: [], until: 0, visible: false, nextPlay: 0, blinkAt: 0});
  }

  function play(li) {
    const s = state.get(li), act = ACTS[li.dataset.act];
    if (!act) return;
    s.running.forEach(a => a.cancel());
    s.stage.classList.toggle('front', act.front);
    s.running = Object.entries(act.parts).filter(([part]) => s.el[part]).map(([part, list]) => {
      const [make, n] = MAKERS[part];
      return s.el[part].animate(rows(list, make, n), {duration: act.dur, easing: 'linear'});
    });
    s.until = performance.now() + act.dur;
  }

  // on screen = at least a third of the plate showing; a plate coming into view starts its scene shortly after
  const REST = [2500, 4500];      // pause between two scenes of the same plate, ms
  const SPACING = 700;            // at least this long between any two scenes starting, so the plates take turns
  let lastStart = -1e9;
  const io = new IntersectionObserver(entries => {
    const now = performance.now();
    for (const e of entries) {
      const s = state.get(e.target), was = s.visible;
      s.visible = e.isIntersecting && e.intersectionRatio >= .35;
      if (s.visible && !was && s.nextPlay < now) s.nextPlay = now + 200 + Math.random() * 900;
    }
  }, {threshold: [0, .35]});
  plates.forEach(li => io.observe(li));

  function tick() {
    if (document.hidden) return;
    const now = performance.now();
    for (const [li, s] of state) {
      if (!s.visible || now < s.until) continue;
      if (ACTS[li.dataset.act] && now >= s.nextPlay && now - lastStart >= SPACING) {
        play(li);
        lastStart = now;
        s.nextPlay = s.until + REST[0] + Math.random() * (REST[1] - REST[0]);
        continue;
      }
      // a blink now and then between scenes (the unfinished ninth bread only blinks)
      if (now >= s.blinkAt) {
        if (s.blinkAt) s.el.eyes.animate([EYES(1), Object.assign(EYES(.1), {offset: .45}), EYES(1)], {duration: 220, easing: SOFT});
        s.blinkAt = now + 3200 + Math.random() * 5000;
      }
    }
  }
  setInterval(tick, 200);
})();
