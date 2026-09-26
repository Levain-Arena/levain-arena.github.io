// Levain Arena hero painting: a yeast culture (levain is a culture of wild yeast).
// A budding mother cell, placed like Josef Albers' nested squares, with two small budding daughter cells beside it.
// A pencil underdrawing appears, then everything is brushed in stroke by stroke: the navy cell wall, the vacuole,
// the gold nucleus. Navy (expert review) and gold (the budget) never change; the vacuole is repainted in each
// agent's colour in turn, again stroke by stroke over the old colour. The culture lives without bubbling: granules
// stream slowly through the mother's cytoplasm, the two daughter cells travel slowly round the mother on paths of
// different curvature (passing behind it on the far side), and the culture breathes slowly.
// The agents' names, topics, colours and logos are read from the agents list further down the page.
// With reduced motion the finished painting is shown and changes only when a swatch is pressed.

(() => {
  const figure = document.querySelector('.hero-art');
  const holder = figure && figure.querySelector('.painting');
  const canvas = holder && holder.querySelector('canvas');
  const ctx = canvas && canvas.getContext('2d');
  if (!ctx) return;

  const NAVY = '#1D5468', GOLD = '#E5B44F', ARENA = '#498D76', RAW = '#EAE4D8', PENCIL = '#3F3A33', GRANULE = '#4F8FA3';
  const HOLD = 3800, REPAINT = 1500;
  const ENTER = {pencil: [0, 500], O: [350, 1750], M: [1350, 2350], I: [2000, 2700], D: [2450, 3150]};
  const pinned = new URLSearchParams(location.search).get('paint');
  const still = pinned !== null || matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- frames: the arena first, then every agent in the list below
  const frames = [{name: 'Levain Arena', title: 'AI agents, each with 100 million tokens', color: ARENA, logo: 'assets/logo/mark.png', pending: false}];
  document.querySelectorAll('#agents .plates > li').forEach(li => {
    const img = li.querySelector('.plate .mlogo');
    const pending = li.classList.contains('pending');
    frames.push({
      name: (li.querySelector('h3')?.textContent || '').trim(),
      title: li.querySelector('.work')?.innerHTML || '',
      color: pending ? RAW : li.style.getPropertyValue('--c').trim() || ARENA,
      logo: img ? img.getAttribute('src') : null,
      pending,
    });
  });

  const label = figure.querySelector('.label-now');
  const nameEl = figure.querySelector('.label-name');
  const titleEl = figure.querySelector('.label-title');
  const countEl = figure.querySelector('.label-count');
  const logoEl = figure.querySelector('.label-logo');
  const swatchBox = figure.querySelector('.swatches');

  const buttons = frames.map((f, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sw-b' + (f.pending ? ' pending' : '');
    if (!f.pending) b.style.setProperty('--c', f.color);
    b.setAttribute('aria-label', 'Show ' + f.name);
    b.setAttribute('aria-pressed', String(i === 0));
    b.addEventListener('click', () => go(i, true));
    swatchBox.appendChild(b);
    return b;
  });
  const play = document.createElement('button');
  play.type = 'button';
  play.className = 'play';
  play.addEventListener('click', () => setAuto(!auto));
  if (!still) swatchBox.appendChild(play);

  // --- seeded randomness and smooth 1-D noise
  function rng(a) {
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function wave(seed) {
    const r = rng(seed);
    const parts = [0, 1, 2, 3].map(k => ({f: (.006 + r() * .01) * (1 + k * 1.9), p: r() * 6.283, a: 1 / (1 + k)}));
    const sum = parts.reduce((s, q) => s + q.a, 0);
    return x => parts.reduce((s, q) => s + q.a * Math.sin(x * q.f * 6.283 + q.p), 0) / sum;
  }
  const easeOut = x => x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3);
  // a colour lightened (k > 0) or darkened (k < 0) by a fraction, for the bristles of a brush
  function tone(hex, k) {
    const v = parseInt(hex.slice(1), 16), c = [v >> 16 & 255, v >> 8 & 255, v & 255], to = k < 0 ? 0 : 255, f = Math.abs(k);
    return `rgb(${c.map(x => Math.round(x + (to - x) * f)).join(',')})`;
  }

  // --- the cast shadow (drawn once per size) under the painting
  const shadeCv = document.createElement('canvas');
  shadeCv.className = 'shade';
  shadeCv.setAttribute('aria-hidden', 'true');
  holder.insertBefore(shadeCv, canvas);

  // --- size, geometry and textures (rebuilt when the painting changes size)
  let S = 0, dpr = 1, geo = null, tex = null, base = null, bctx = null, flat = null, fctx = null, lay = null;
  function layout() {
    const w = Math.round(holder.clientWidth);
    if (w < 4) return false; // not laid out yet (hidden tab or pane)
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    if (geo && w === S && ratio === dpr) return true;
    const first = !geo;
    S = w; dpr = ratio;
    const px = Math.round(S * dpr);
    canvas.width = px; canvas.height = px;
    base = document.createElement('canvas');
    base.width = px; base.height = px;
    bctx = base.getContext('2d');
    flat = document.createElement('canvas');   // all the paint that has dried
    flat.width = px; flat.height = px;
    fctx = flat.getContext('2d');
    lay = {};                                     // the daughter cells dry on their own sheets, so they can drift
    for (const k of ['d1', 'd2']) {
      const c = document.createElement('canvas');
      c.width = px; c.height = px;
      lay[k] = {c, g: c.getContext('2d')};
    }
    // the mother: a slightly irregular oval, long axis tilted up to the right, a bud at that end.
    // Albers' placement: the vacuole sits low in the cell and the nucleus low in the vacuole.
    const O = cell(.455, .565, .405, .362, -55, 11, .022);
    const tip = O.edgeAt(-50 * Math.PI / 180), rb = .09, ua = Math.cos(-50 * Math.PI / 180), va = Math.sin(-50 * Math.PI / 180);
    const bud = cell(tip[0] / S + ua * rb * .55, tip[1] / S + va * rb * .55, rb, rb * .9, -40, 41, .03);
    const M = cell(.44, .625, .262, .236, -40, 23, .026);
    const I = cell(.43, .695, .142, .128, -25, 37, .03);
    // two daughter cells, each budding
    const D1 = cell(.895, .835, .06, .052, -30, 51, .04), D1b = daughterBud(D1, -70, .45, 61);
    const D2 = cell(.13, .165, .048, .042, 30, 71, .05), D2b = daughterBud(D2, -20, .5, 81);
    const wall = union(O.path, bud.path), d1 = union(D1.path, D1b.path), d2 = union(D2.path, D2b.path);
    const vac = new Path2D();                     // the vacuole without the nucleus, so a repaint leaves the gold alone
    vac.addPath(M.path); vac.addPath(I.path);
    const outside = new Path2D();                 // everything but the mother (with 'evenodd'): where a far daughter shows
    outside.rect(-S, -S, 3 * S, 3 * S); outside.addPath(wall);
    // each daughter's path round the mother: both along the long diagonal through where they are painted, one flat and
    // one rounder, so that they curve differently; they go round in opposite directions, a lap in 70 and 95 seconds
    const paths = {d1: path(D1, .495, .505, 45, .35, 1 / 70000), d2: path(D2, .495, .505, 45, .6, -1 / 95000)};
    geo = {O, bud, M, I, D1, D1b, D2, D2b, wall, d1, d2, vac, outside, paths};
    geo.granules = granuleSet();
    tex = {O: swirl(O, 5, px), M: swirl(M, 9, px), I: swirl(I, 17, px), raw: weave(13, px)};
    drawShade();
    if (!first) settle();                          // after a resize, show the finished painting at once
    return true;
  }
  function union(a, b) { const p = new Path2D(); p.addPath(a); p.addPath(b); return p; }
  // an elliptical path round the point (cx, cy), tilted and with the given flatness, through the centre of cell c
  function path(c, cx, cy, tiltDeg, ratio, turns) {
    const tilt = tiltDeg * Math.PI / 180, ct = Math.cos(tilt), st = Math.sin(tilt), dx = c.cx - cx * S, dy = c.cy - cy * S;
    const u = dx * ct + dy * st, v = -dx * st + dy * ct, a = Math.hypot(u, v / ratio), b = a * ratio;
    return {turns, from: Math.atan2(v / b, u / a), at: th => [cx * S + a * Math.cos(th) * ct - b * Math.sin(th) * st, cy * S + a * Math.cos(th) * st + b * Math.sin(th) * ct]};
  }
  function daughterBud(c, angDeg, size, seed) {
    const ang = angDeg * Math.PI / 180, tip = c.edgeAt(ang), rb = c.a / S * size;
    return cell(tip[0] / S + Math.cos(ang) * rb * .5, tip[1] / S + Math.sin(ang) * rb * .5, rb, rb * .92, angDeg, seed, .03);
  }
  // a hand-painted oval: a few slow lobes and a faint tremor on an ellipse, so no two are alike and none is exact
  function cell(cx, cy, a, b, tiltDeg, seed, lob) {
    const r = rng(seed), tilt = tiltDeg * Math.PI / 180, ct = Math.cos(tilt), st = Math.sin(tilt);
    const harm = [2, 3, 4, 6].map(k => ({k, amp: (r() * 2 - 1) * lob / Math.sqrt(k - 1), ph: r() * 6.283}));
    const tremor = wave(seed + 5), N = 240;
    const radius = t => 1 + harm.reduce((sum, h) => sum + h.amp * Math.cos(h.k * t + h.ph), 0);
    const pts = [];
    for (let k = 0; k < N; k++) {
      const t = k / N * 2 * Math.PI, f = radius(t) + tremor(k * 11) * .0035;
      const ex = a * S * Math.cos(t) * f, ey = b * S * Math.sin(t) * f;
      pts.push([cx * S + ex * ct - ey * st, cy * S + ex * st + ey * ct]);
    }
    const c = {cx: cx * S, cy: cy * S, a: a * S, b: b * S, tilt, path: smooth(pts)};
    // the point on the edge in a given direction from the centre, and a point part of the way there
    c.edgeAt = ang => {
      const u = ang - tilt, rr = (a * b * S) / Math.hypot(b * Math.cos(u), a * Math.sin(u)) * radius(Math.atan2(a * Math.sin(u), b * Math.cos(u)));
      return [c.cx + rr * Math.cos(ang), c.cy + rr * Math.sin(ang)];
    };
    c.at = (ang, rho) => { const e = c.edgeAt(ang); return [c.cx + (e[0] - c.cx) * rho, c.cy + (e[1] - c.cy) * rho]; };
    return c;
  }
  // a closed curve through the midpoints of the samples, so the edge stays smooth
  function smooth(pts) {
    const p = new Path2D(), n = pts.length;
    const mid = k => [(pts[k][0] + pts[(k + 1) % n][0]) / 2, (pts[k][1] + pts[(k + 1) % n][1]) / 2];
    const m = mid(n - 1);
    p.moveTo(m[0], m[1]);
    for (let k = 0; k < n; k++) { const q = mid(k); p.quadraticCurveTo(pts[k][0], pts[k][1], q[0], q[1]); }
    p.closePath();
    return p;
  }
  // fine brush marks that follow the cell round, like the circular strokes in the logo; used with 'overlay'
  function swirl(c, seed, W) {
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = W;
    const g = cv.getContext('2d'), r = rng(seed);
    g.fillStyle = '#808080';
    g.fillRect(0, 0, W, W);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.translate(c.cx, c.cy);
    g.rotate(c.tilt);
    g.scale(1, c.b / c.a);
    const R = c.a * 1.45, count = Math.round(R * R * dpr * dpr / 160);
    for (let k = 0; k < count; k++) {
      const rr = Math.sqrt(r()) * R, a0 = r() * 6.283, len = (18 + r() * 60) / Math.max(rr, 14);
      const al = .025 + r() * .06;
      g.beginPath();
      g.arc(0, 0, rr, a0, a0 + len);
      g.lineWidth = .5 + r() * 2.2;
      g.strokeStyle = r() < .5 ? `rgba(255,255,255,${al})` : `rgba(0,0,0,${al})`;
      g.stroke();
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    grain(g, W, r, 18);
    return cv;
  }
  // raw canvas: a fine weave
  function weave(seed, W) {
    const c = document.createElement('canvas');
    c.width = W; c.height = W;
    const g = c.getContext('2d'), r = rng(seed), step = Math.max(2, Math.round(2.2 * dpr));
    g.fillStyle = '#808080';
    g.fillRect(0, 0, W, W);
    for (let y = 0; y < W; y += step) { g.fillStyle = `rgba(0,0,0,${.03 + r() * .05})`; g.fillRect(0, y, W, 1); }
    for (let x = 0; x < W; x += step) { g.fillStyle = `rgba(255,255,255,${.03 + r() * .05})`; g.fillRect(x, 0, 1, W); }
    grain(g, W, r, 26);
    return c;
  }
  function grain(g, W, r, amount) {
    const img = g.getImageData(0, 0, W, W), d = img.data;
    for (let k = 0; k < d.length; k += 4) {
      const v = (r() - .5) * amount;
      d[k] += v; d[k + 1] += v; d[k + 2] += v;
    }
    g.putImageData(img, 0, 0);
  }
  // the shadow the mother casts on the wall: only the shadow lands on the canvas (the shape is drawn far to the left)
  function drawShade() {
    const pad = .14, W = Math.round(S * (1 + 2 * pad) * dpr), far = 4000;
    shadeCv.width = W; shadeCv.height = W;
    const g = shadeCv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, (S * pad - far) * dpr, S * pad * dpr);
    g.fillStyle = '#000';
    g.shadowOffsetX = far * dpr;
    g.shadowColor = 'rgba(27,39,51,.30)'; g.shadowBlur = 34 * dpr; g.shadowOffsetY = 24 * dpr; g.fill(geo.wall);
    g.shadowColor = 'rgba(27,39,51,.16)'; g.shadowBlur = 5 * dpr; g.shadowOffsetY = 2 * dpr; g.fill(geo.wall);
  }
  // a small cell's shadow, dropped into the painting when the cell is painted
  function dropShadow(g, path) {
    const far = 4000;
    g.save();
    g.setTransform(dpr, 0, 0, dpr, -far * dpr, 0);
    g.fillStyle = '#000';
    g.shadowOffsetX = far * dpr;
    g.shadowColor = 'rgba(27,39,51,.26)'; g.shadowBlur = 12 * dpr; g.shadowOffsetY = 8 * dpr; g.fill(path);
    g.shadowColor = 'rgba(27,39,51,.14)'; g.shadowBlur = 3 * dpr; g.shadowOffsetY = 1.5 * dpr; g.fill(path);
    g.restore();
  }

  // --- brushwork
  // One brush stroke: a band that follows the shape round at a given fraction of its radius, carrying a dozen
  // bristles that streak lighter and darker.
  function stroke(c, r, rho, a0, span, width, color) {
    const N = 42, pts = [], ct = Math.cos(c.tilt), st = Math.sin(c.tilt);
    {
      const wob = wave(Math.floor(r() * 1e6));
      for (let k = 0; k < N; k++) {
        const th = a0 + span * k / (N - 1), f = rho * (1 + wob(k * 9) * .035);
        const ex = c.a * f * Math.cos(th), ey = c.b * f * Math.sin(th);
        const dx = -c.a * Math.sin(th), dy = c.b * Math.cos(th);
        const tx = dx * ct - dy * st, ty = dx * st + dy * ct, L = Math.hypot(tx, ty) || 1;
        pts.push([c.cx + ex * ct - ey * st, c.cy + ex * st + ey * ct, -ty / L, tx / L]);
      }
    }
    const bristles = [], nb = 13;
    for (let k = 0; k < nb; k++) {
      bristles.push({
        off: (k / (nb - 1) - .5) * width * (.92 + r() * .14),
        alpha: .2 + r() * .42,
        lw: width / nb * (1.1 + r() * 1.4),
        col: tone(color, (r() - .5) * .18),
        s: r() * .07, e: .88 + r() * .12,
      });
    }
    return {pts, w: width, bristles, dur: 190 + r() * 120, t0: 0};
  }
  // all the strokes that cover a shape: rings following its outline from the outside in, then a small turn at the centre
  function strokesFor(c, seed, rings, color) {
    const r = rng(seed), list = [], gap = rings.length > 1 ? rings[0] - rings[1] : .5;
    const width = gap * 1.95 * c.a;
    rings.forEach(rho => {
      const start = r() * 2 * Math.PI, dir = r() < .5 ? 1 : -1;
      for (let h = 0; h < 2; h++) list.push(stroke(c, r, rho + (r() - .5) * .06, start + h * Math.PI + (r() - .5) * .7, dir * (Math.PI * 1.15 + r() * .6), width, color));
    });
    list.push(stroke(c, r, Math.min(.12, rings[rings.length - 1] * .5), r() * 6.283, (r() < .5 ? 1 : -1) * Math.PI * 2.1, width, color));
    return list;
  }
  // a painting job: strokes laid down one after another, clipped to a shape; when all are down it dries into `flat`
  function job(parts, color, clip, rule, t0, dur, texture, after) {
    const strokes = [];
    parts.forEach(([c, seed, rings]) => strokesFor(c, seed, rings, color).forEach(s => strokes.push(s)));
    const longest = Math.max(...strokes.map(s => s.dur));
    const step = Math.max(10, (dur - longest) / Math.max(1, strokes.length - 1));
    strokes.forEach((s, k) => { s.t0 = t0 + k * step; });
    return {strokes, color, clip, rule, texture, after, end: t0 + (strokes.length - 1) * step + longest};
  }
  function drawJob(g, J, now) {
    g.save();
    g.clip(J.clip, J.rule);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const s of J.strokes) {
      const q = now === Infinity ? 1 : easeOut((now - s.t0) / s.dur);
      if (q > 0) drawStroke(g, s, q, J.color);
    }
    g.restore();
  }
  function drawStroke(g, s, q, color) {
    const N = s.pts.length, m = Math.max(2, Math.ceil(N * q));
    g.globalAlpha = 1;
    g.strokeStyle = color;
    g.lineWidth = s.w * .8;
    g.beginPath();
    for (let k = 0; k < m; k++) { const p = s.pts[k]; if (k) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }
    g.stroke();
    for (const b of s.bristles) {
      const a = Math.floor(b.s * N), e = Math.min(m, Math.ceil(b.e * N));
      if (e - a < 2) continue;
      g.globalAlpha = b.alpha;
      g.strokeStyle = b.col;
      g.lineWidth = b.lw;
      g.beginPath();
      for (let k = a; k < e; k++) {
        const p = s.pts[k], x = p[0] + p[2] * b.off, y = p[1] + p[3] * b.off;
        if (k > a) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.stroke();
    }
    g.globalAlpha = 1;
  }
  // a finished job dries: its strokes go into `flat`, with the fine marks over them
  function dry(J) {
    const g = J.layer ? lay[J.layer].g : fctx;
    if (J.shadow) dropShadow(g, J.clip);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawJob(g, J, Infinity);
    if (J.texture) {
      g.save();
      g.clip(J.clip, J.rule);
      g.globalCompositeOperation = 'overlay';
      g.globalAlpha = J.texture === tex.raw ? .7 : .42;
      g.drawImage(J.texture, 0, 0, S, S);
      g.restore();
    }
    if (J.after) J.after(g);
  }
  // granules in the mother's cytoplasm: placed once, then drawn every frame, drifting along the upper cytoplasm
  function granuleSet() {
    const r = rng(97), list = [];
    for (let k = 0; k < 9; k++) {
      list.push({
        ang: -Math.PI * (.08 + r() * .84) - .35, rho: .72 + r() * .2, rr: (2.2 + r() * 3.8) * S / 560,
        alpha: .35 + r() * .35, color: r() < .7 ? GRANULE : tone(NAVY, -.25), squash: .75 + r() * .3, tilt: r() * 3,
        wa: wave(300 + k * 7), wr: wave(400 + k * 11), spin: (r() - .5) * .0004,
      });
    }
    return list;
  }
  function drawGranules(g, now, fade, move) {
    if (fade <= 0) return;
    const O = geo.O, x = now / 110, flow = Math.sin(now / 9000) * .05;
    g.save();
    g.clip(geo.wall);
    for (const q of geo.granules) {
      const ang = q.ang + move * (flow + q.wa(x) * .15), rho = q.rho + move * q.wr(x * 1.3) * .035;
      const [cx, cy] = O.at(ang, rho);
      g.globalAlpha = q.alpha * fade;
      g.fillStyle = q.color;
      g.beginPath();
      g.ellipse(cx, cy, q.rr, q.rr * q.squash, q.tilt + move * now * q.spin, 0, 2 * Math.PI);
      g.fill();
    }
    g.restore();
  }
  // The daughter cells, each travelling its path round the mother and turning a little as it goes. On the far half of
  // its path a cell passes behind the mother (drawn only outside her) and is slightly smaller; it starts where it was
  // painted, easing into its pace as the painting comes to life.
  const turnOf = {d1: wave(503), d2: wave(603)};
  function drawDaughters(g, now, amt, part) {
    const t = Math.max(0, now - lifeFrom), run = still ? 0 : t < 3000 ? t * t / 6000 : t - 1500;
    for (const [k, c] of [['d1', geo.D1], ['d2', geo.D2]]) {
      const p = geo.paths[k], th = p.from + 2 * Math.PI * p.turns * run, near = Math.sin(th) >= 0;
      if ((part === 'front') !== near) continue;
      const [x, y] = p.at(th), size = (1 + .1 * Math.sin(th)) / (1 + .1 * Math.sin(p.from)), rot = amt * turnOf[k](now / 180) * .06;
      g.save();
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!near) g.clip(geo.outside, 'evenodd');
      g.translate(x, y);
      g.rotate(rot);
      g.scale(size, size);
      g.translate(-c.cx, -c.cy);
      g.drawImage(lay[k].c, 0, 0, S, S);
      g.restore();
    }
  }
  function vacuoleJob(f, t0, dur, seed) {
    const c = f.pending ? RAW : f.color;
    return job([[geo.M, seed, [1.04, .84, .64, .44, .24]]], c, geo.vac, 'evenodd', t0, dur, f.pending ? tex.raw : tex.M,
      f.pending ? g => pencil(g, [geo.M.path], .55) : null);
  }
  function entranceJobs(t0) {
    return [
      job([[geo.O, 101, [1.07, .92, .77, .62, .47, .32, .17]]], NAVY, geo.O.path, 'nonzero', t0 + ENTER.O[0], ENTER.O[1] - ENTER.O[0] - 250, tex.O),
      job([[geo.bud, 103, [1.05, .55]]], NAVY, geo.bud.path, 'nonzero', t0 + ENTER.O[1] - 450, 450, tex.O),
      vacuoleJob(frames[shown], t0 + ENTER.M[0], ENTER.M[1] - ENTER.M[0], 107),
      job([[geo.I, 109, [1.03, .7, .38]]], GOLD, geo.I.path, 'nonzero', t0 + ENTER.I[0], ENTER.I[1] - ENTER.I[0], tex.I),
      Object.assign(job([[geo.D1, 111, [1.02, .5]], [geo.D1b, 113, [1.0]]], NAVY, geo.d1, 'nonzero', t0 + ENTER.D[0], 420, tex.O), {shadow: true, layer: 'd1'}),
      Object.assign(job([[geo.D2, 117, [1.02, .5]], [geo.D2b, 119, [1.0]]], ARENA, geo.d2, 'nonzero', t0 + ENTER.D[0] + 220, 420, tex.M), {shadow: true, layer: 'd2'}),
    ];
  }
  function pencil(g, paths, alpha) {
    if (alpha <= 0) return;
    g.save();
    g.globalAlpha = alpha;
    g.strokeStyle = PENCIL;
    g.lineWidth = .8;
    for (const p of paths) g.stroke(p);
    g.restore();
  }
  // the finished painting, all at once (reduced motion, a pinned frame, or after a resize)
  function settle() {
    active = [];
    fctx.setTransform(1, 0, 0, 1, 0, 0);
    fctx.clearRect(0, 0, flat.width, flat.height);
    for (const k in lay) { lay[k].g.setTransform(1, 0, 0, 1, 0, 0); lay[k].g.clearRect(0, 0, flat.width, flat.height); }
    if (lifeFrom === Infinity) lifeFrom = performance.now();
    grainsAt = 0;
    const target = next >= 0 ? next : shown;
    if (next >= 0) { shown = next; next = -1; }
    const keep = shown;
    shown = 0;
    entranceJobs(0).forEach(dry);
    shown = keep;
    if (target !== 0) dry(vacuoleJob(frames[target], 0, 10, 131));
    settled = true;
    dirty = true;
  }
  // gallery light: warm near the lamp, falling into shade across the cell
  function light(x, y) {
    ctx.save();
    ctx.clip(geo.wall);
    ctx.globalCompositeOperation = 'soft-light';
    const warm = ctx.createRadialGradient(x, y, 0, x, y, S * .9);
    warm.addColorStop(0, 'rgba(255,248,232,.36)');
    warm.addColorStop(.5, 'rgba(255,248,232,.1)');
    warm.addColorStop(1, 'rgba(255,248,232,0)');
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, S, S);
    const shade = ctx.createRadialGradient(x, y, S * .45, x, y, S * 1.6);
    shade.addColorStop(0, 'rgba(16,20,28,0)');
    shade.addColorStop(1, 'rgba(16,20,28,.24)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, S, S);
    ctx.restore();
  }

  // --- state
  let start = 0, last = 0, shown = 0, next = -1, turn = 0, active = [], settled = false, dirty = true;
  let lifeFrom = Infinity, grainsAt = 0;   // when the daughters set off; when the granules have been dabbed in
  let nextAt = Infinity, auto = false, hovering = false, holdUntil = 0, labelTimer = 0;

  function go(i, byHand) {
    if (i === (next >= 0 ? next : shown)) return;
    const now = performance.now();
    if (next >= 0) {                                         // a repaint in progress dries at once
      const J = active.find(j => j.vacuole);
      if (J) { dry(J); active = active.filter(j => j !== J); }
      shown = next;
      next = -1;
    }
    if (settled) {
      const J = vacuoleJob(frames[i], now, REPAINT, 200 + turn++);
      J.vacuole = true;
      if (still) { dry(J); shown = i; dirty = true; }
      else { active.push(J); next = i; }
    } else {
      next = i;                                              // painted once the entrance has finished
    }
    if (byHand) holdUntil = now + 9000;
    buttons.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    setLabel(frames[i], i);
    wake();
  }
  function setLabel(f, i) {
    label.classList.add('swap');
    clearTimeout(labelTimer);
    labelTimer = setTimeout(() => {
      nameEl.textContent = f.name;
      label.style.setProperty('--c', f.color);             // the topic is brushed in this agent's colour
      titleEl.innerHTML = f.title.includes('class="hl"') ? f.title : `<span class="hl">${f.title}</span>`;
      countEl.textContent = i === 0 ? '' : `${i} / ${frames.length - 1}`;
      logoEl.textContent = '';
      if (f.logo) {
        const img = new Image();
        img.alt = '';
        img.src = f.logo;
        logoEl.appendChild(img);
      }
      label.classList.remove('swap');
    }, still ? 0 : 240);
  }
  function setAuto(on) {
    auto = on && !still;
    play.textContent = auto ? 'Pause' : 'Play';
    play.setAttribute('aria-label', auto ? 'Pause the painting' : 'Play the painting');
    if (auto) nextAt = Math.max(nextAt === Infinity ? 0 : nextAt, performance.now() + 1500);
  }
  figure.addEventListener('pointerenter', () => { hovering = true; });
  figure.addEventListener('pointerleave', () => { hovering = false; });
  figure.addEventListener('focusin', () => { hovering = true; });
  figure.addEventListener('focusout', () => { hovering = false; });

  // the lamp follows a mouse anywhere over the hero, and drifts on its own otherwise
  const lamp = {x: 0, y: 0, tx: 0, ty: 0, seen: -1e9, placed: false};
  const hero = document.querySelector('.hero') || figure;
  hero.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || still) return;
    const r = canvas.getBoundingClientRect();
    lamp.tx = e.clientX - r.left;
    lamp.ty = e.clientY - r.top;
    lamp.seen = performance.now();
  });

  // --- loop: runs only while the painting is on screen
  let visible = true, raf = 0;
  function wake() { if (!raf) raf = requestAnimationFrame(frame); }
  function frame(now) {
    raf = 0;
    if (!layout()) return;
    if (!start) {
      start = now;
      setAuto(true);
      if (still) settle();
      else { active = entranceJobs(now); grainsAt = active[0].end; }
      nextAt = still ? Infinity : now + ENTER.D[1] + HOLD;
      if (pinned !== null && frames[+pinned]) go(+pinned, false);
    }
    if (last && now - last > 400) nextAt = Math.max(nextAt, now + 1500); // back from a hidden tab
    last = now;
    const t = now - start;

    // jobs whose last stroke has landed dry into the painting
    for (const J of active.filter(j => now >= j.end)) {
      dry(J);
      if (J.vacuole) { shown = next; next = -1; nextAt = now + HOLD; }
    }
    active = active.filter(j => now < j.end);
    if (!settled && !still && t >= ENTER.D[1] + 450) {
      settled = true;
      lifeFrom = now;
      dirty = true;                                                  // redraw once without the pencil underdrawing
      if (next >= 0) { const i = next; next = -1; go(i, false); }   // a swatch pressed during the entrance
    }

    if (settled && next < 0 && auto && !hovering && now >= holdUntil && now >= nextAt) go((shown + 1) % frames.length, false);

    const busy = active.length > 0 || (!settled && !still);
    if (busy || dirty) {
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.globalCompositeOperation = 'source-over';
      bctx.globalAlpha = 1;
      bctx.clearRect(0, 0, S, S);
      if (!settled) pencil(bctx, [geo.wall, geo.M.path, geo.I.path, geo.d1, geo.d2], .55 * easeOut((t - ENTER.pencil[0]) / (ENTER.pencil[1] - ENTER.pencil[0])));
      bctx.setTransform(1, 0, 0, 1, 0, 0);
      bctx.drawImage(flat, 0, 0);
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const J of active) drawJob(bctx, J, now);
      shadeCv.style.opacity = settled ? '1' : easeOut((t - ENTER.O[0]) / (ENTER.O[1] - ENTER.O[0])).toFixed(3);
      dirty = false;
    }

    if (!still && now - lamp.seen > 2500) {
      lamp.tx = S * (.36 + .24 * Math.sin(now / 6100));
      lamp.ty = S * (.28 + .2 * Math.cos(now / 8300));
    }
    if (!lamp.placed) { lamp.x = still ? S * .35 : lamp.tx; lamp.y = still ? S * .28 : lamp.ty; lamp.placed = true; }
    lamp.x += (lamp.tx - lamp.x) * .06;
    lamp.y += (lamp.ty - lamp.y) * .06;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(base, 0, 0);
    // the living parts, drawn fresh each frame: daughters on the far side of their paths (behind the mother), the
    // granules, then daughters on the near side; the daughters stay put until the entrance is over
    const life = still ? 0 : easeOut((now - lifeFrom) / 2500);
    drawDaughters(ctx, now, life, 'back');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGranules(ctx, now, still ? 1 : easeOut((now - grainsAt) / 600), still ? 0 : 1);
    drawDaughters(ctx, now, life, 'front');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    light(lamp.x, lamp.y);
    holder.classList.add('live');

    if (visible && !document.hidden && !(still && !busy)) raf = requestAnimationFrame(frame);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) wake();
    }).observe(holder);
  }
  if ('ResizeObserver' in window) new ResizeObserver(() => { dirty = true; wake(); }).observe(holder);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  wake();
})();
