// Procedural artwork: posters, jerseys, plates, ball, room surfaces.
// Everything is drawn on <canvas> at runtime, so the site ships with no image assets.
import { BRAND } from './data.js';

let fontsPromise;
export function fontsReady() {
  fontsPromise ||= (async () => {
    const faces = ['400 40px "Bebas Neue"', '400 40px Boldonse', '700 40px Caveat', '600 40px Geist', '500 40px "Geist Mono"', '800 40px Geist'];
    try { await Promise.race([Promise.all(faces.map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 2500))]); } catch { /* fall back to system fonts */ }
  })();
  return fontsPromise;
}

export function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

function grain(ctx, w, h, amt = 18, seed = 1) {
  const r = rng(seed);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amt;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

function fitText(ctx, text, font, maxW, size) {
  let s = size;
  ctx.font = font.replace('{s}', s);
  while (ctx.measureText(text).width > maxW && s > 8) { s -= 2; ctx.font = font.replace('{s}', s); }
  return s;
}

// ---------- the figure: an original, simple celebrating footballer ----------
const SKIN = ['#8d5a3b', '#a86b45', '#7a4a2f', '#b97c52', '#6e4128', '#9c6342'];

function drawFigure(ctx, cx, cy, s, pose, col, num) {
  const P = (x, y) => [cx + x * s, cy + y * s];
  const limb = (pts, w, c) => {
    ctx.strokeStyle = c; ctx.lineWidth = w * s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(...P(...pts[0])); for (let i = 1; i < pts.length; i++) ctx.lineTo(...P(...pts[i])); ctx.stroke();
  };
  const arms = [
    [[[-0.36, -1.18], [-0.62, -1.62], [-0.72, -2.12]], [[0.36, -1.18], [0.62, -1.62], [0.72, -2.12]]], // both up
    [[[-0.36, -1.18], [-0.55, -0.78], [-0.42, -0.42]], [[0.36, -1.18], [0.58, -1.65], [0.52, -2.18]]], // one fist
    [[[-0.36, -1.18], [-0.78, -1.0], [-1.08, -1.18]], [[0.36, -1.18], [0.74, -1.02], [1.02, -0.8]]], // airplane
    [[[-0.36, -1.18], [-0.3, -0.72], [0.12, -0.9]], [[0.36, -1.18], [0.3, -0.72], [-0.1, -0.86]]], // arms crossed
  ][pose % 4];
  const legs = [
    [[[-0.2, -0.32], [-0.3, 0.32], [-0.34, 0.95]], [[0.2, -0.32], [0.3, 0.32], [0.34, 0.95]]],
    [[[-0.2, -0.32], [-0.26, 0.34], [-0.3, 0.96]], [[0.2, -0.32], [0.46, 0.18], [0.58, 0.78]]],
    [[[-0.2, -0.32], [-0.5, 0.2], [-0.78, 0.66]], [[0.2, -0.32], [0.42, 0.3], [0.38, 0.96]]],
    [[[-0.2, -0.32], [-0.22, 0.34], [-0.24, 0.96]], [[0.2, -0.32], [0.22, 0.34], [0.24, 0.96]]],
  ][pose % 4];
  // legs: skin, then socks
  legs.forEach((l) => { limb(l, 0.2, col.skin); limb([l[1], l[2]], 0.22, col.sock); limb([l[2], [l[2][0] + 0.08, l[2][1] + 0.02]], 0.2, col.boot); });
  // shorts
  ctx.fillStyle = col.shorts;
  ctx.beginPath(); ctx.moveTo(...P(-0.34, -0.42)); ctx.lineTo(...P(0.34, -0.42)); ctx.lineTo(...P(0.4, 0.02)); ctx.lineTo(...P(0.04, 0.04)); ctx.lineTo(0 + cx, cy - 0.12 * s); ctx.lineTo(...P(-0.04, 0.04)); ctx.lineTo(...P(-0.4, 0.02)); ctx.closePath(); ctx.fill();
  // arms: skin + sleeve
  arms.forEach((a) => { limb(a, 0.18, col.skin); limb([a[0], [(a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2]], 0.27, col.shirt); });
  // torso
  ctx.fillStyle = col.shirt;
  ctx.beginPath(); ctx.moveTo(...P(-0.46, -1.24)); ctx.quadraticCurveTo(...P(0, -1.34), ...P(0.46, -1.24)); ctx.lineTo(...P(0.36, -0.36)); ctx.lineTo(...P(-0.36, -0.36)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = col.trim; ctx.fillRect(cx - 0.36 * s, cy - 0.44 * s, 0.72 * s, 0.06 * s);
  // collar
  ctx.strokeStyle = col.trim; ctx.lineWidth = 0.06 * s; ctx.beginPath(); ctx.moveTo(...P(-0.14, -1.3)); ctx.lineTo(...P(0, -1.16)); ctx.lineTo(...P(0.14, -1.3)); ctx.stroke();
  if (num != null) {
    ctx.fillStyle = col.trim; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${0.46 * s}px "Bebas Neue", Impact, sans-serif`; ctx.fillText(String(num), cx, cy - 0.78 * s);
  }
  // head + hair
  ctx.fillStyle = col.skin; ctx.beginPath(); ctx.arc(cx, cy - 1.56 * s, 0.24 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = col.hair; ctx.beginPath(); ctx.arc(cx, cy - 1.62 * s, 0.25 * s, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
}

// ---------- posters ----------
const STYLES = [
  { bg: '#c8361f', a: '#e2532f', ink: '#fff3e0', acc: '#f2c14e', shirt: '#fff3e0', trim: '#c8361f' },
  { bg: '#f1e6d2', a: '#1f2a44', ink: '#1f2a44', acc: '#d8432b', shirt: '#d8432b', trim: '#f1e6d2' },
  { bg: '#ece7df', a: '#141414', ink: '#141414', acc: '#d9372a', shirt: '#d9372a', trim: '#ffffff' },
  { bg: '#f4efe6', a: '#ff4f7b', ink: '#2e5bff', acc: '#ff4f7b', shirt: '#ff4f7b', trim: '#f4efe6' },
  { bg: '#ffd23f', a: '#111111', ink: '#111111', acc: '#e8402d', shirt: '#e8402d', trim: '#ffffff' },
  { bg: '#1c3d2e', a: '#23503b', ink: '#f6eedd', acc: '#e9b949', shirt: '#c9372b', trim: '#f6eedd' },
  { bg: '#0f1630', a: '#1b2650', ink: '#f0e6d0', acc: '#e7c06a', shirt: '#c33a2a', trim: '#f0e6d0' },
  { bg: '#e9dfcb', a: '#2b1d16', ink: '#2b1d16', acc: '#b8342a', shirt: '#b8342a', trim: '#e9dfcb' },
];
const SHOUT = ['MENANG!', 'GOL!', 'HEBAT!', 'JAWARA', 'AYO!', 'BANGGA'];

export function makePoster(poster, W = 512, H = 720) {
  const c = mk(W, H); const ctx = c.getContext('2d');
  const st = STYLES[poster.style % STYLES.length];
  const pl = poster.player; const r = rng(poster.id * 97 + 13);
  const col = { skin: SKIN[poster.id % SKIN.length], hair: '#1a1210', shirt: st.shirt, trim: st.trim, shorts: st.ink === '#f6eedd' || st.ink === '#f0e6d0' ? '#f6eedd' : '#ffffff', sock: st.shirt, boot: '#111' };
  if (pl.pos === 'GK') { col.shirt = '#3c7a9a'; col.sock = '#3c7a9a'; }
  const pose = poster.id % 4; const surname = (pl.last || '').toUpperCase(); const num = pl.no || null;
  ctx.fillStyle = st.bg; ctx.fillRect(0, 0, W, H);

  switch (poster.style % 8) {
    case 0: { // sunburst
      ctx.save(); ctx.translate(W / 2, H * 0.52); ctx.fillStyle = st.a;
      for (let i = 0; i < 24; i += 2) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, H, (i / 24) * Math.PI * 2, ((i + 1) / 24) * Math.PI * 2); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = st.acc; ctx.beginPath(); ctx.arc(W / 2, H * 0.5, W * 0.33, 0, Math.PI * 2); ctx.fill();
      drawFigure(ctx, W / 2, H * 0.74, W * 0.17, pose, col, num);
      ctx.fillStyle = st.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      fitText(ctx, surname, '{s}px Boldonse, sans-serif', W * 0.86, 64); ctx.fillText(surname, W / 2, H * 0.13);
      ctx.font = '500 15px "Geist Mono", monospace'; ctx.fillText(`${BRAND.cup.toUpperCase()} · CHAMPIONS`, W / 2, H * 0.18);
      break;
    }
    case 1: { // halftone duotone
      for (let y = 0; y < H; y += 12) for (let x = 0; x < W; x += 12) {
        const d = Math.hypot(x - W * 0.7, y - H * 0.3) / (W * 0.9); const rad = Math.max(0, 5.2 * (1 - d));
        ctx.fillStyle = st.acc; ctx.beginPath(); ctx.arc(x + ((y / 12) % 2) * 6, y, rad, 0, Math.PI * 2); ctx.fill();
      }
      drawFigure(ctx, W * 0.5, H * 0.78, W * 0.18, pose, col, num);
      ctx.save(); ctx.translate(W * 0.1, H * 0.94); ctx.rotate(-Math.PI / 2); ctx.fillStyle = st.ink; ctx.textAlign = 'left';
      fitText(ctx, surname, '{s}px Boldonse, sans-serif', H * 0.8, 70); ctx.fillText(surname, 0, 0); ctx.restore();
      ctx.fillStyle = st.ink; ctx.font = '96px "Bebas Neue", sans-serif'; ctx.textAlign = 'right'; ctx.fillText(String(num ?? '★'), W * 0.94, H * 0.16);
      break;
    }
    case 2: { // swiss grid
      ctx.fillStyle = st.acc; ctx.fillRect(0, H * 0.58, W, H * 0.42);
      ctx.strokeStyle = 'rgba(0,0,0,.14)'; ctx.lineWidth = 1;
      for (let x = 32; x < W; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      ctx.fillStyle = st.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = '230px "Bebas Neue", sans-serif'; ctx.fillText(String(num ?? 'C'), 28, 10);
      fitText(ctx, surname, '800 {s}px Geist, sans-serif', W * 0.88, 72); ctx.fillText(surname, 30, H * 0.4);
      ctx.font = '500 14px "Geist Mono", monospace'; ctx.fillText((pl.first || '').toUpperCase() + ' — ' + (pl.pos || ''), 32, H * 0.52);
      drawFigure(ctx, W * 0.68, H * 0.9, W * 0.15, pose, { ...col, shirt: '#141414', sock: '#141414', trim: '#fff' }, num);
      break;
    }
    case 3: { // risograph circles
      ctx.globalCompositeOperation = 'multiply';
      for (let i = 0; i < 7; i++) { ctx.fillStyle = i % 2 ? 'rgba(46,91,255,.55)' : 'rgba(255,79,123,.6)'; ctx.beginPath(); ctx.arc(r() * W, r() * H * 0.8, 50 + r() * 140, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
      drawFigure(ctx, W / 2, H * 0.76, W * 0.17, pose, { ...col, shirt: '#2e5bff', sock: '#2e5bff' }, num);
      ctx.fillStyle = st.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      fitText(ctx, surname, '{s}px Boldonse, sans-serif', W * 0.86, 60); ctx.fillText(surname, W / 2, H * 0.94);
      ctx.fillStyle = st.acc; ctx.font = '140px "Bebas Neue", sans-serif'; ctx.fillText(String(num ?? '★'), W / 2, H * 0.24);
      break;
    }
    case 4: { // comic burst
      ctx.fillStyle = '#fff'; ctx.beginPath();
      for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; const rr = i % 2 ? 150 : 230; ctx.lineTo(W / 2 + Math.cos(a) * rr, H * 0.42 + Math.sin(a) * rr); }
      ctx.closePath(); ctx.fill(); ctx.strokeStyle = st.ink; ctx.lineWidth = 6; ctx.stroke();
      drawFigure(ctx, W / 2, H * 0.72, W * 0.17, pose, col, num);
      ctx.strokeStyle = st.ink; ctx.lineWidth = 8; ctx.strokeRect(12, 12, W - 24, H - 24);
      ctx.save(); ctx.translate(W * 0.26, H * 0.16); ctx.rotate(-0.12); ctx.fillStyle = st.acc; ctx.font = '72px Boldonse, sans-serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 10; ctx.strokeStyle = st.ink; const sh = SHOUT[poster.id % SHOUT.length]; ctx.strokeText(sh, 0, 0); ctx.fillText(sh, 0, 0); ctx.restore();
      ctx.fillStyle = st.ink; ctx.fillRect(12, H - 92, W - 24, 80); ctx.fillStyle = st.bg; ctx.textAlign = 'center';
      fitText(ctx, surname, '{s}px Boldonse, sans-serif', W * 0.8, 44); ctx.fillText(surname, W / 2, H - 38);
      break;
    }
    case 5: { // stripes
      for (let x = 0; x < W; x += 48) { ctx.fillStyle = st.a; ctx.fillRect(x, 0, 24, H); }
      ctx.strokeStyle = st.acc; ctx.lineWidth = 4; ctx.font = '360px "Bebas Neue", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeText(String(num ?? 'C'), W / 2, H * 0.42);
      drawFigure(ctx, W / 2, H * 0.8, W * 0.17, pose, col, num);
      ctx.fillStyle = st.ink; ctx.textBaseline = 'alphabetic'; fitText(ctx, surname, '{s}px Boldonse, sans-serif', W * 0.86, 52); ctx.fillText(surname, W / 2, H * 0.12);
      break;
    }
    case 6: { // night + stars + cup glyph
      for (let i = 0; i < 160; i++) { ctx.fillStyle = `rgba(255,240,210,${0.2 + r() * 0.7})`; ctx.fillRect(r() * W, r() * H * 0.7, 1.5 + r() * 1.5, 1.5 + r() * 1.5); }
      const g = ctx.createRadialGradient(W / 2, H * 0.36, 10, W / 2, H * 0.36, W * 0.6); g.addColorStop(0, 'rgba(231,192,106,.55)'); g.addColorStop(1, 'rgba(231,192,106,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = st.acc; ctx.beginPath(); ctx.arc(W / 2, H * 0.3, 44, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(W / 2 - 8, H * 0.3, 16, 70); ctx.fillRect(W / 2 - 40, H * 0.3 + 66, 80, 18);
      drawFigure(ctx, W / 2, H * 0.84, W * 0.16, pose, col, num);
      ctx.fillStyle = st.ink; ctx.textAlign = 'center'; fitText(ctx, surname, '{s}px Boldonse, sans-serif', W * 0.86, 48); ctx.fillText(surname, W / 2, H * 0.1);
      ctx.font = '500 14px "Geist Mono", monospace'; ctx.fillStyle = st.acc; ctx.fillText(pl.pos === 'COACH' ? 'HEAD COACH' : `NO. ${num}`, W / 2, H * 0.14);
      break;
    }
    default: { // linocut
      ctx.strokeStyle = st.ink; ctx.lineWidth = 3;
      for (let y = 0; y < H; y += 14) { ctx.beginPath(); for (let x = 0; x <= W; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.03 + y * 0.05) * 5); ctx.stroke(); }
      ctx.fillStyle = st.bg; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.55, W * 0.4, H * 0.36, 0, 0, Math.PI * 2); ctx.fill();
      drawFigure(ctx, W / 2, H * 0.78, W * 0.17, pose, { ...col, shirt: st.acc, sock: st.acc }, num);
      ctx.fillStyle = st.ink; ctx.fillRect(0, 0, W, 104); ctx.fillStyle = st.bg; ctx.textAlign = 'center';
      fitText(ctx, surname, '{s}px Boldonse, sans-serif', W * 0.86, 50); ctx.fillText(surname, W / 2, 70);
    }
  }
  // signature + frame
  ctx.fillStyle = ['#fff3e0', '#f6eedd', '#f0e6d0'].includes(st.ink) ? st.ink : st.ink;
  ctx.font = '700 30px Caveat, cursive'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = 0.85; ctx.fillText(poster.artist.name.split(' ')[0].toLowerCase(), W - 24, H - (poster.style % 8 === 4 ? 104 : 22)); ctx.globalAlpha = 1;
  grain(ctx, W, H, 16, poster.id + 3);
  return c;
}

// cheap blur that works everywhere: shrink then upscale
export function blurred(src, k = 10) {
  const s = mk(Math.max(2, src.width / k), Math.max(2, src.height / k));
  const sc = s.getContext('2d'); sc.imageSmoothingQuality = 'high'; sc.drawImage(src, 0, 0, s.width, s.height);
  const out = mk(src.width / 2, src.height / 2); const oc = out.getContext('2d'); oc.imageSmoothingQuality = 'high';
  oc.drawImage(s, 0, 0, out.width, out.height); return out;
}

// ---------- jerseys ----------
// Shirt outline in 0..1 space (x right, y down). Shared by the texture and the 3D alpha mask.
export const SHIRT = [[0.5, 0.075], [0.6, 0.03], [0.79, 0.075], [0.995, 0.3], [0.885, 0.405], [0.785, 0.31], [0.79, 0.985], [0.5, 1.0], [0.21, 0.985], [0.215, 0.31], [0.115, 0.405], [0.005, 0.3], [0.21, 0.075], [0.4, 0.03]];
export const KITS = {
  home: { base: '#981f17', dark: '#6c150f', trim: '#f1e9df', ink: '#f1e9df' },
  gk: { base: '#2d5677', dark: '#1e3d57', trim: '#e9f1f4', ink: '#e9f1f4' },
  fan: { base: '#981f17', dark: '#6c150f', trim: '#e8c060', ink: '#f6e2a6' },
  coach: { base: '#22262b', dark: '#15181b', trim: '#e8c060', ink: '#e8c060' },
};

function shirtPath(ctx, W, H, front) {
  ctx.beginPath();
  SHIRT.forEach(([x, y], i) => {
    let yy = y;
    if (front && i === 0) yy = 0.13;
    i ? ctx.lineTo(x * W, yy * H) : ctx.moveTo(x * W, yy * H);
  });
  ctx.closePath();
}

export function makeJersey({ name = '', number = '', kit = 'home', side = 'back', W = 512, H = 560 }) {
  const c = mk(W, H); const ctx = c.getContext('2d'); const k = KITS[kit] || KITS.home; const front = side === 'front';
  const s = W / 512; // everything below is authored at 512px wide
  ctx.save(); shirtPath(ctx, W, H, front); ctx.clip();
  ctx.fillStyle = k.base; ctx.fillRect(0, 0, W, H);
  // tonal chevrons
  ctx.strokeStyle = k.dark; ctx.globalAlpha = 0.35; ctx.lineWidth = 14 * s;
  for (let y = -H; y < H * 2; y += 46 * s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W / 2, y + 60 * s); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.globalAlpha = 1;
  // side panels + shading
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(0.25, 'rgba(0,0,0,0)'); g.addColorStop(0.75, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.35)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const v = ctx.createLinearGradient(0, 0, 0, H); v.addColorStop(0, 'rgba(255,255,255,.08)'); v.addColorStop(1, 'rgba(0,0,0,.25)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  // cuffs
  ctx.strokeStyle = k.trim; ctx.lineWidth = 9 * s;
  ctx.beginPath(); ctx.moveTo(0.965 * W, 0.335 * H); ctx.lineTo(0.865 * W, 0.425 * H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0.035 * W, 0.335 * H); ctx.lineTo(0.135 * W, 0.425 * H); ctx.stroke();
  // hem bands
  ctx.fillStyle = k.trim; ctx.fillRect(0, 0.9 * H, W, 7 * s); ctx.fillRect(0, 0.925 * H, W, 4 * s);
  ctx.restore();
  // collar
  ctx.strokeStyle = k.trim; ctx.lineWidth = 10 * s; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0.4 * W, 0.035 * H); ctx.quadraticCurveTo(0.5 * W, (front ? 0.16 : 0.1) * H, 0.6 * W, 0.035 * H); ctx.stroke();
  ctx.fillStyle = k.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  if (front) {
    // crest: simple shield with a star (original)
    const cx = 0.66 * W, cy = 0.27 * H, q = 22 * s;
    ctx.beginPath(); ctx.moveTo(cx - q, cy - q * 1.2); ctx.lineTo(cx + q, cy - q * 1.2); ctx.lineTo(cx + q, cy + q * 0.2); ctx.quadraticCurveTo(cx, cy + q * 1.4, cx - q, cy + q * 0.2); ctx.closePath();
    ctx.fillStyle = k.trim; ctx.fill(); ctx.fillStyle = k.base; star(ctx, cx, cy - 4 * s, 11 * s, 5);
    ctx.fillStyle = k.ink;
    if (s > 0.4) { ctx.font = `600 ${20 * s}px "Geist Mono", monospace`; ctx.fillText('L/26', 0.34 * W, 0.28 * H); }
    ctx.font = `${120 * s}px "Bebas Neue", Impact, sans-serif`; ctx.fillText(String(number), 0.5 * W, 0.62 * H);
  } else {
    // flag patch, name, number
    ctx.fillStyle = '#d4362a'; ctx.fillRect(0.5 * W - 22 * s, 0.11 * H, 44 * s, 13 * s); ctx.fillStyle = '#f4ede4'; ctx.fillRect(0.5 * W - 22 * s, 0.11 * H + 13 * s, 44 * s, 13 * s);
    ctx.fillStyle = k.ink;
    const nm = String(name).toUpperCase();
    fitText(ctx, nm, '{s}px "Bebas Neue", Impact, sans-serif', 0.5 * W, 64 * s);
    ctx.fillText(nm, 0.5 * W, 0.31 * H);
    ctx.font = `${250 * s}px "Bebas Neue", Impact, sans-serif`;
    ctx.lineWidth = 6 * s; ctx.strokeStyle = k.dark; ctx.strokeText(String(number), 0.5 * W, 0.8 * H);
    ctx.fillText(String(number), 0.5 * W, 0.8 * H);
  }
  if (s > 0.4) grain(ctx, W, H, 10, Number(number) || 7);
  return c;
}

function star(ctx, x, y, r, n) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2; const rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill();
}

// small 2D jersey icon used by loaders, strip and cards
export function jerseyIcon(number, kit = 'home', size = 56) {
  return makeJersey({ name: '', number, kit, side: 'front', W: size * 2, H: size * 2.2 });
}

// ---------- room surfaces ----------
export function makeDoorTex(W = 256, H = 768) {
  const c = mk(W, H); const ctx = c.getContext('2d');
  ctx.fillStyle = '#a63c24'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(0,0,0,.18)'); g.addColorStop(0.5, 'rgba(255,255,255,.04)'); g.addColorStop(1, 'rgba(0,0,0,.22)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3; ctx.strokeRect(10, 10, W - 20, H - 20);
  const vents = (y0) => { for (let i = 0; i < 5; i++) { ctx.fillStyle = '#2a120b'; roundRect(ctx, 46, y0 + i * 16, W - 92, 7, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(46, y0 + i * 16 + 7, W - 92, 1.5); } };
  vents(110); vents(H - 120);
  ctx.fillStyle = '#2d2d2d'; roundRect(ctx, W - 54, H * 0.48, 16, 70, 6); ctx.fill();
  ctx.fillStyle = '#9a9a9a'; roundRect(ctx, W - 51, H * 0.48 + 6, 10, 58, 4); ctx.fill();
  grain(ctx, W, H, 22, 9);
  // scuffs
  const r = rng(4); ctx.strokeStyle = 'rgba(255,220,200,.08)'; ctx.lineWidth = 1;
  for (let i = 0; i < 40; i++) { const x = r() * W, y = r() * H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r() * 20 - 10, y + r() * 6); ctx.stroke(); }
  return c;
}

export function makePlateTex(top, bottom, W = 256, H = 112) {
  const c = mk(W, H); const ctx = c.getContext('2d');
  ctx.fillStyle = '#e9e1d2'; roundRect(ctx, 0, 0, W, H, 10); ctx.fill();
  ctx.strokeStyle = '#8b8172'; ctx.lineWidth = 4; roundRect(ctx, 4, 4, W - 8, H - 8, 8); ctx.stroke();
  ctx.fillStyle = '#1c1714'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '62px "Bebas Neue", Impact, sans-serif'; ctx.fillText(String(top), W / 2, H * 0.42);
  ctx.font = '600 18px "Geist Mono", monospace'; fitText(ctx, String(bottom).toUpperCase(), '600 {s}px "Geist Mono", monospace', W - 30, 18); ctx.fillText(String(bottom).toUpperCase(), W / 2, H * 0.8);
  return c;
}

export function makeFloorTex(W = 1024) {
  const c = mk(W, W); const ctx = c.getContext('2d');
  ctx.fillStyle = '#2a211b'; ctx.fillRect(0, 0, W, W);
  const r = rng(11);
  for (let i = 0; i < 900; i++) { ctx.fillStyle = `rgba(${r() > 0.5 ? '255,230,200' : '0,0,0'},${r() * 0.05})`; ctx.beginPath(); ctx.arc(r() * W, r() * W, r() * 30, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2;
  for (let x = 0; x <= W; x += W / 4) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, W); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(W, x); ctx.stroke(); }
  grain(ctx, W, W, 14, 5);
  return c;
}

export function makeSlatsTex(W = 512, H = 512, base = '#3a281c') {
  const c = mk(W, H); const ctx = c.getContext('2d');
  ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 32) {
    const g = ctx.createLinearGradient(x, 0, x + 32, 0); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(0.15, 'rgba(255,220,180,.06)'); g.addColorStop(0.85, 'rgba(0,0,0,.05)'); g.addColorStop(1, 'rgba(0,0,0,.4)');
    ctx.fillStyle = g; ctx.fillRect(x, 0, 32, H);
  }
  grain(ctx, W, H, 18, 2);
  return c;
}

export function makeBallTex(W = 512, H = 256) {
  const c = mk(W, H); const ctx = c.getContext('2d');
  ctx.fillStyle = '#f2efe9'; ctx.fillRect(0, 0, W, H);
  ctx.lineWidth = 16;
  for (let k = 0; k < 3; k++) {
    ctx.strokeStyle = k === 1 ? '#151515' : '#c23b28';
    ctx.beginPath(); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, H / 2 + Math.sin((x / W) * Math.PI * 4 + k * 2.1) * H * 0.28); ctx.stroke();
  }
  return c;
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// the brand mark as inline SVG (original monogram)
export const MARK_SVG = `<svg viewBox="0 0 40 46" fill="none" aria-hidden="true"><path d="M3 3h34v24c0 9-8 14-17 16C11 41 3 36 3 27V3Z" stroke="currentColor" stroke-width="3"/><path d="M13 11v20h14" stroke="currentColor" stroke-width="4" stroke-linecap="square"/><path d="M21 11h6" stroke="currentColor" stroke-width="4"/></svg>`;
