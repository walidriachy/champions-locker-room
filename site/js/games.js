// Mini-games and the shirt maker: penalty, foosball, the final replay, your shirt.
import { RUN, SQUAD } from './data.js';
import { makeJersey, fontsReady, roundRect } from './art.js';
import { $, $$, h, clamp } from './ui.js';
import { sound } from './sound.js';

const FAN_KEY = 'loker.fan';
export function loadFan() { try { return JSON.parse(localStorage.getItem(FAN_KEY)) || null; } catch { return null; } }
function saveFan(f) { try { localStorage.setItem(FAN_KEY, JSON.stringify(f)); } catch { /* ignore */ } }

function shell(id, title, body, foot = '') {
  let el = document.getElementById(id);
  if (el) return el;
  el = h(`<div class="modal game" id="${id}" aria-hidden="true"><div class="scrim"></div>
    <section class="panel g-panel" role="dialog" aria-modal="true" aria-label="${title}">
      <header class="g-head"><p class="k">${title}</p></header>${body}<footer class="g-foot">${foot}</footer>
      <button class="round x-btn" aria-label="Close"><span class="ms">close</span></button></section></div>`);
  document.body.append(el);
  const close = () => { el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); el.dispatchEvent(new Event('close')); };
  $('.scrim', el).onclick = close; $('.x-btn', el).onclick = close;
  el.close = close;
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && el.classList.contains('open')) close(); });
  return el;
}
function show(el) { el.classList.add('open'); el.removeAttribute('aria-hidden'); sound.whoosh(); }

export function openGame(name, ctx = {}) {
  if (name === 'shirt') return shirtMaker(ctx);
  if (name === 'penalty') return penalty();
  if (name === 'foos') return foosball();
  if (name === 'final') return finalReplay();
}

// ---------------------------------------------------------------- your shirt
function shirtMaker({ onFan }) {
  const el = shell('gShirt', 'Your shirt', `
    <div class="sm">
      <div class="sm-prev"><canvas width="512" height="560"></canvas></div>
      <form class="sm-form" autocomplete="off">
        <h3>Hang your own shirt in the champions’ room</h3>
        <label><span class="k">Name on the back</span><input name="name" maxlength="12" placeholder="YOUR NAME" required></label>
        <label><span class="k">Number</span><input name="number" type="number" min="1" max="99" value="12" required></label>
        <p class="sm-note">12 belongs to the fans: the twelfth player. Up to 12 letters.</p>
        <div class="sm-row"><button type="button" class="btn" data-cancel>Cancel</button><button class="btn solid" type="submit"><span class="ms">checkroom</span>Hang it</button></div>
        <div class="sm-done"><button type="button" class="btn" data-save><span class="ms">download</span>Save for story</button><button type="button" class="btn" data-change>Change</button></div>
        <p class="sm-note dim">Made on your device. Nothing is sent or kept anywhere else.</p>
      </form>
    </div>`);
  const form = $('form', el); const cv = $('canvas', el);
  const cur = loadFan();
  if (cur) { form.name.value = cur.name; form.number.value = cur.number; }
  el.classList.toggle('hung', !!cur);
  const draw = async () => {
    await fontsReady();
    const name = (form.name.value || 'YOUR NAME').toUpperCase().slice(0, 12); const num = clamp(parseInt(form.number.value) || 12, 1, 99);
    const j = makeJersey({ name, number: num, kit: 'fan', side: 'back' }); const x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); x.drawImage(j, 0, 0);
  };
  form.oninput = () => { form.name.value = form.name.value.toUpperCase().replace(/[^A-Z0-9 .'-]/g, ''); draw(); };
  form.onsubmit = (e) => {
    e.preventDefault();
    const f = { name: form.name.value.trim().toUpperCase().slice(0, 12) || 'FAN', number: clamp(parseInt(form.number.value) || 12, 1, 99) };
    saveFan(f); el.classList.add('hung'); sound.chime(); onFan?.(f); setTimeout(() => el.close(), 500);
  };
  $('[data-cancel]', el).onclick = () => el.close();
  $('[data-change]', el).onclick = () => el.classList.remove('hung');
  $('[data-save]', el).onclick = () => saveStory(loadFan() || { name: form.name.value || 'FAN', number: form.number.value || 12 });
  draw(); show(el); setTimeout(() => form.name.focus(), 300);
}

async function saveStory(f) {
  await fontsReady();
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; const x = c.getContext('2d');
  const g = x.createRadialGradient(540, 820, 50, 540, 820, 1100); g.addColorStop(0, '#4a2c18'); g.addColorStop(1, '#0b0806');
  x.fillStyle = g; x.fillRect(0, 0, 1080, 1920);
  x.fillStyle = '#a69a8b'; x.font = '500 30px "Geist Mono", monospace'; x.textAlign = 'center'; x.fillText('I HUNG MY SHIRT IN THE', 540, 260);
  x.fillStyle = '#f6dc93'; x.font = '84px Boldonse, sans-serif'; x.fillText('CHAMPIONS’', 540, 380); x.fillText('ROOM', 540, 490);
  x.drawImage(makeJersey({ name: f.name, number: f.number, kit: 'fan', side: 'back', W: 820, H: 900 }), 130, 600);
  x.fillStyle = '#a69a8b'; x.font = '500 28px "Geist Mono", monospace'; x.fillText('GARUDA 2026 · THE LOCKER ROOM', 540, 1720);
  const a = document.createElement('a'); a.download = `my-shirt-${f.number}.png`; a.href = c.toDataURL('image/png'); a.click();
}

// ---------------------------------------------------------------- penalty
function penalty() {
  const el = shell('gPen', 'Penalty · five kicks for the cup', `
    <div class="pen"><canvas width="900" height="560"></canvas>
      <div class="pen-hud"><div class="pen-score"></div><div class="seg pen-type" role="group" aria-label="Shot"><button data-s="low" class="on">Low curve</button><button data-s="fin">Finesse</button></div></div>
      <p class="pen-hint k">Point where it goes · hold for power · let go</p>
      <div class="pen-say"></div></div>`, `<button class="btn" data-again hidden>Play again</button><button class="btn solid" data-done hidden>Done</button>`);
  const cv = $('canvas', el); const x = cv.getContext('2d'); const W = cv.width, H = cv.height;
  const goal = { x: 210, y: 120, w: 480, h: 200 };
  let s; const reset = () => { s = { kicks: [], aim: { x: W / 2, y: 230 }, power: 0, charging: false, shot: null, keeper: { x: W / 2, dive: 0, dir: 0 }, type: 'low', over: false }; render(); };
  const say = (t, good) => { const p = $('.pen-say', el); p.textContent = t; p.className = 'pen-say on ' + (good ? 'good' : ''); setTimeout(() => (p.className = 'pen-say'), 1100); };
  $$('[data-s]', el).forEach((b) => (b.onclick = () => { s.type = b.dataset.s; $$('[data-s]', el).forEach((o) => o.classList.toggle('on', o === b)); }));
  const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; };
  cv.onpointermove = (e) => { if (!s.shot && !s.over) s.aim = pos(e); };
  cv.onpointerdown = (e) => { if (s.shot || s.over) return; s.aim = pos(e); s.charging = true; s.power = 0; cv.setPointerCapture(e.pointerId); };
  cv.onpointerup = () => {
    if (!s.charging) return; s.charging = false; sound.kick();
    const keeperGuess = Math.random() < 0.42 ? Math.sign(s.aim.x - W / 2) : [-1, 0, 1][Math.floor(Math.random() * 3)];
    s.keeper.dir = keeperGuess; s.shot = { t: 0, from: { x: W / 2, y: 500 }, to: { ...s.aim }, power: s.power, curve: s.type === 'low' ? 60 : -40 };
  };
  let raf;
  const loop = () => {
    if (!el.classList.contains('open')) return;
    if (s.charging) s.power = Math.min(1.15, s.power + 0.018);
    if (s.shot) {
      s.shot.t += 0.035; s.keeper.dive = Math.min(1, s.keeper.dive + 0.06);
      if (s.shot.t >= 1) resolve();
    }
    render(); raf = requestAnimationFrame(loop);
  };
  const resolve = () => {
    const sh = s.shot; s.shot = null;
    const tx = sh.to.x, ty = sh.to.y - (sh.power > 1 ? (sh.power - 1) * 600 : 0) + (sh.power < 0.35 ? 40 : 0);
    const inGoal = tx > goal.x + 8 && tx < goal.x + goal.w - 8 && ty > goal.y + 6 && ty < goal.y + goal.h;
    const kx = W / 2 + s.keeper.dir * 170; const reach = sh.power < 0.55 ? 150 : 105;
    const saved = inGoal && Math.abs(tx - kx) < reach && ty > goal.y + 30;
    const res = !inGoal ? 'miss' : saved ? 'saved' : 'goal';
    s.kicks.push(res);
    if (res === 'goal') { say('Goal!', true); sound.cheer(); } else say(res === 'saved' ? 'Saved' : 'Miss', false);
    setTimeout(() => { s.keeper = { x: W / 2, dive: 0, dir: 0 }; if (s.kicks.length >= 5) end(); }, 900);
  };
  const end = () => {
    s.over = true; const g = s.kicks.filter((k) => k === 'goal').length;
    say(g >= 4 ? `${g}/5 · Cup winner` : g >= 3 ? `${g}/5 · Into sudden death` : `${g}/5 · Next time`, g >= 3);
    $('[data-again]', el).hidden = $('[data-done]', el).hidden = false;
  };
  $('[data-again]', el).onclick = () => { $('[data-again]', el).hidden = $('[data-done]', el).hidden = true; reset(); };
  $('[data-done]', el).onclick = () => el.close();
  function render() {
    x.clearRect(0, 0, W, H);
    const sky = x.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0f1a12'); sky.addColorStop(0.45, '#183823'); sky.addColorStop(1, '#245a34'); x.fillStyle = sky; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.05)'; x.fillRect(0, 320 + i * 30, W, 30); }
    x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 3; x.beginPath(); x.moveTo(60, 330); x.lineTo(W - 60, 330); x.stroke();
    x.beginPath(); x.ellipse(W / 2, 505, 6, 3, 0, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill();
    // net + frame
    x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 1;
    for (let i = 0; i <= 24; i++) { x.beginPath(); x.moveTo(goal.x + (i / 24) * goal.w, goal.y); x.lineTo(goal.x + 20 + (i / 24) * (goal.w - 40), goal.y + goal.h + 10); x.stroke(); }
    for (let j = 0; j <= 10; j++) { x.beginPath(); x.moveTo(goal.x + j * 2, goal.y + (j / 10) * goal.h); x.lineTo(goal.x + goal.w - j * 2, goal.y + (j / 10) * goal.h); x.stroke(); }
    x.strokeStyle = '#f4ede4'; x.lineWidth = 9; x.beginPath(); x.moveTo(goal.x, goal.y + goal.h + 10); x.lineTo(goal.x, goal.y); x.lineTo(goal.x + goal.w, goal.y); x.lineTo(goal.x + goal.w, goal.y + goal.h + 10); x.stroke();
    // keeper
    const kd = s.keeper.dive; const kx = W / 2 + s.keeper.dir * 170 * kd; const ky = goal.y + goal.h - 70 + Math.abs(s.keeper.dir) * kd * 30;
    x.save(); x.translate(kx, ky); x.rotate(s.keeper.dir * kd * 1.1);
    x.fillStyle = '#e8c060'; roundRect(x, -24, -40, 48, 70, 12); x.fill();
    x.strokeStyle = '#e8c060'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(-22, -30); x.lineTo(-50, -70); x.moveTo(22, -30); x.lineTo(50, -70); x.stroke();
    x.fillStyle = '#7a4a2f'; x.beginPath(); x.arc(0, -56, 15, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#111'; x.fillRect(-20, 28, 14, 40); x.fillRect(6, 28, 14, 40); x.restore();
    // aim reticle
    if (!s.shot && !s.over) { x.strokeStyle = '#e8c060'; x.lineWidth = 2; x.beginPath(); x.arc(s.aim.x, s.aim.y, 16, 0, Math.PI * 2); x.moveTo(s.aim.x - 24, s.aim.y); x.lineTo(s.aim.x + 24, s.aim.y); x.moveTo(s.aim.x, s.aim.y - 24); x.lineTo(s.aim.x, s.aim.y + 24); x.stroke(); }
    // ball
    let bx = W / 2, by = 495, br = 14;
    if (s.shot) { const t = s.shot.t; const sh = s.shot; const ty = sh.to.y - (sh.power > 1 ? (sh.power - 1) * 600 : 0); bx = sh.from.x + (sh.to.x - sh.from.x) * t + Math.sin(t * Math.PI) * sh.curve * Math.sign(sh.to.x - W / 2 || 1); by = sh.from.y + (ty - sh.from.y) * t - Math.sin(t * Math.PI) * 40; br = 14 - t * 7; }
    x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(bx, Math.max(by + br, 330) + 4, br, br * 0.35, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#f4f1ea'; x.beginPath(); x.arc(bx, by, br, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#c23b28'; x.lineWidth = 3; x.beginPath(); x.arc(bx, by, br * 0.55, 0.3, 2.6); x.stroke();
    // power bar
    if (s.charging || s.power) { x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(W - 60, 300, 18, 200); const p = Math.min(1, s.power / 1.15); x.fillStyle = s.power > 1 ? '#e8402d' : '#e8c060'; x.fillRect(W - 60, 500 - p * 200, 18, p * 200); x.fillStyle = 'rgba(255,255,255,.6)'; x.fillRect(W - 64, 500 - (1 / 1.15) * 200, 26, 2); }
    $('.pen-score', el).innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${s.kicks[i] || ''}"></i>`).join('');
  }
  reset(); show(el); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  el.addEventListener('close', () => cancelAnimationFrame(raf), { once: true });
}

// ---------------------------------------------------------------- foosball
function foosball() {
  const el = shell('gFoos', 'Foosball · first to 5', `
    <div class="fz"><div class="fz-score"><span>LOK</span><b class="a">0</b><i>:</i><b class="b">0</b><span>ARK</span></div>
    <canvas width="900" height="520"></canvas><p class="k fz-hint">Move up and down to slide your rods · red is you</p><div class="pen-say"></div></div>`,
  `<button class="btn" data-again hidden>Play again</button><button class="btn solid" data-done hidden>Done</button>`);
  const cv = $('canvas', el); const x = cv.getContext('2d'); const W = cv.width, H = cv.height; const M = 40;
  // rods: x position, men count, side ('me' | 'ai')
  const RODS = [[90, 1, 'me'], [180, 2, 'me'], [290, 3, 'ai'], [390, 5, 'me'], [510, 5, 'ai'], [610, 3, 'me'], [720, 2, 'ai'], [810, 1, 'ai']];
  let s, raf;
  const reset = () => { s = { a: 0, b: 0, myY: H / 2, aiY: H / 2, ball: null, over: false, t: 0 }; serve(1); };
  const serve = (dir) => { s.ball = { x: W / 2, y: H / 2, vx: dir * (3 + Math.random()), vy: (Math.random() - 0.5) * 5 }; };
  const say = (t, good) => { const p = $('.pen-say', el); p.textContent = t; p.className = 'pen-say on ' + (good ? 'good' : ''); setTimeout(() => (p.className = 'pen-say'), 900); };
  cv.onpointermove = (e) => { const r = cv.getBoundingClientRect(); s.myY = clamp((e.clientY - r.top) * (H / r.height), M, H - M); };
  const menYs = (count, center) => { const span = H - 2 * M; const gap = span / (count + 1); const off = center - H / 2; return Array.from({ length: count }, (_, k) => clamp(M + gap * (k + 1) + off * (count === 1 ? 1 : 0.5), M + 14, H - M - 14)); };
  const loop = () => {
    if (!el.classList.contains('open')) return;
    if (!s.over) step();
    draw(); raf = requestAnimationFrame(loop);
  };
  function step() {
    const b = s.ball; s.aiY += clamp(b.y - s.aiY, -4.2, 4.2);
    b.x += b.vx; b.y += b.vy; b.vx *= 0.999; b.vy *= 0.999;
    if (b.y < M + 8 || b.y > H - M - 8) { b.vy *= -1; b.y = clamp(b.y, M + 8, H - M - 8); }
    const gTop = H / 2 - 70, gBot = H / 2 + 70;
    if (b.x < M + 8) { if (b.y > gTop && b.y < gBot) return score('b'); b.vx = Math.abs(b.vx); }
    if (b.x > W - M - 8) { if (b.y > gTop && b.y < gBot) return score('a'); b.vx = -Math.abs(b.vx); }
    RODS.forEach(([rx, n, side]) => {
      menYs(n, side === 'me' ? s.myY : s.aiY).forEach((my) => {
        const dx = b.x - rx, dy = b.y - my;
        if (Math.abs(dx) < 16 && Math.abs(dy) < 20) {
          const dir = side === 'me' ? 1 : -1; b.vx = dir * (6 + Math.random() * 3); b.vy = dy * 0.25 + (Math.random() - 0.5) * 2; b.x = rx + dir * 17; sound.kick();
        }
      });
    });
    if (Math.abs(b.vx) < 1.2) b.vx = Math.sign(b.vx || 1) * 1.2;
  }
  function score(who) {
    s[who]++; $('.fz-score .a', el).textContent = s.a; $('.fz-score .b', el).textContent = s.b;
    if (who === 'a') { sound.cheer(); say('Goal!', true); } else say('Arkan score', false);
    if (s.a >= 5 || s.b >= 5) { s.over = true; setTimeout(() => say(s.a >= 5 ? 'Full time · you win' : 'Full time · Arkan win', s.a >= 5), 900); $('[data-again]', el).hidden = $('[data-done]', el).hidden = false; }
    serve(who === 'a' ? -1 : 1);
  }
  function draw() {
    x.fillStyle = '#1f5a35'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 10; i++) { x.fillStyle = i % 2 ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.04)'; x.fillRect(M + i * ((W - 2 * M) / 10), M, (W - 2 * M) / 10, H - 2 * M); }
    x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 3; x.strokeRect(M, M, W - 2 * M, H - 2 * M);
    x.beginPath(); x.moveTo(W / 2, M); x.lineTo(W / 2, H - M); x.stroke(); x.beginPath(); x.arc(W / 2, H / 2, 60, 0, Math.PI * 2); x.stroke();
    x.fillStyle = '#0a0806'; x.fillRect(M - 18, H / 2 - 70, 18, 140); x.fillRect(W - M, H / 2 - 70, 18, 140);
    RODS.forEach(([rx, n, side]) => {
      x.fillStyle = '#c9c4ba'; x.fillRect(rx - 3, 0, 6, H);
      menYs(n, side === 'me' ? s.myY : s.aiY).forEach((my) => { x.fillStyle = side === 'me' ? '#c23b28' : '#2f5d8a'; roundRect(x, rx - 11, my - 18, 22, 36, 7); x.fill(); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(rx - 11, my + 6, 22, 5); });
    });
    const b = s.ball; x.fillStyle = '#f4f1ea'; x.beginPath(); x.arc(b.x, b.y, 9, 0, Math.PI * 2); x.fill();
  }
  $('[data-again]', el).onclick = () => { $('[data-again]', el).hidden = $('[data-done]', el).hidden = true; $('.fz-score .a', el).textContent = $('.fz-score .b', el).textContent = 0; reset(); };
  $('[data-done]', el).onclick = () => el.close();
  reset(); show(el); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  el.addEventListener('close', () => cancelAnimationFrame(raf), { once: true });
}

// ---------------------------------------------------------------- the final, replayed
const EVENTS = [
  [0, 'ko', 'Kick-off. The stadium is shaking.'], [11, 'chance', 'Aditya curls one just wide.'], [23, 'goal-b', 'Arkan score from a corner. 0–1.'],
  [38, 'card', 'Yellow for Kusuma after a late tackle.'], [45, 'ht', 'Half-time. 0–1.'], [52, 'goal-a', 'Saputro heads in Gunawan’s cross. 1–1.'],
  [67, 'sub', 'Anggara on for Setiawan.'], [78, 'goal-a', 'Aditya from the edge of the box. 2–1!'], [88, 'goal-b', 'Arkan equalise with a deflection. 2–2.'],
  [90, 'ft', 'Full time. 2–2. Extra time.'], [104, 'sub', 'Maulana on for Kusuma.'], [120, 'et', 'Still 2–2 after 120 minutes. Penalties.'],
  [121, 'pen-a', 'Aditya scores. 1–0'], [122, 'pen-b', 'Arkan score. 1–1'], [123, 'pen-a', 'Gunawan scores. 2–1'], [124, 'save', 'Wicaksana saves! 2–1'],
  [125, 'pen-a', 'Saputro scores. 3–1'], [126, 'pen-b', 'Arkan score. 3–2'], [127, 'pen-a', 'Maulana scores. 4–2'], [128, 'pen-b', 'Arkan score. 4–3'],
  [129, 'save', 'Wicaksana saves again!'], [130, 'pen-a', 'Aditya… wait, Suryadi steps up. Scores. 5–4. Champions!'],
];
function finalReplay() {
  const el = shell('gFinal', 'The final · replayed', `
    <div class="fr"><div class="fr-board"><span class="t">LOK</span><b class="sa">0</b><span class="clock">0’</span><b class="sb">0</b><span class="t">ARK</span></div>
      <div class="fr-pens"></div>
      <div class="fr-line"><i class="fr-fill"></i>${[['KO', 0], ['HT', 45], ['FT', 90], ['ET', 120], ['PENS', 130]].map(([l, m]) => `<span style="left:${(m / 130) * 100}%">${l}</span>`).join('')}</div>
      <ol class="fr-feed"></ol></div>`,
  `<button class="round fr-play" aria-label="Play"><span class="ms">pause</span></button><div class="seg fr-speed"><button data-x="1" class="on">1×</button><button data-x="2">2×</button><button data-x="4">4×</button></div>`);
  let m = 0, speed = 1, playing = true, shown = 0, raf, last = performance.now();
  const feed = $('.fr-feed', el);
  const reset = () => { m = 0; shown = 0; feed.innerHTML = ''; $('.sa', el).textContent = '0'; $('.sb', el).textContent = '0'; $('.fr-pens', el).textContent = ''; };
  const apply = (ev) => {
    const [min, type, text] = ev; const li = h(`<li class="${type}"><b>${min > 120 ? 'P' : min + '’'}</b><span>${text}</span></li>`); feed.prepend(li);
    if (type === 'goal-a') { $('.sa', el).textContent = +$('.sa', el).textContent + 1; sound.cheer(); }
    if (type === 'goal-b') $('.sb', el).textContent = +$('.sb', el).textContent + 1;
    if (type.startsWith('pen') || type === 'save') { const p = $('.fr-pens', el); p.innerHTML += `<i class="${type}"></i>`; }
    if (min === 130) { sound.chime(); el.classList.add('won'); }
    sound.tick();
  };
  const loop = (now) => {
    if (!el.classList.contains('open')) return;
    const dt = (now - last) / 1000; last = now;
    if (playing && m < 130) m = Math.min(130, m + dt * 3 * speed);
    while (shown < EVENTS.length && EVENTS[shown][0] <= m) apply(EVENTS[shown++]);
    $('.clock', el).textContent = m > 120 ? 'PENS' : Math.floor(m) + '’';
    $('.fr-fill', el).style.width = (m / 130) * 100 + '%';
    raf = requestAnimationFrame(loop);
  };
  $('.fr-play', el).onclick = () => { if (m >= 130) { reset(); el.classList.remove('won'); playing = true; } else playing = !playing; $('.fr-play .ms', el).textContent = playing ? 'pause' : 'play_arrow'; };
  $$('[data-x]', el).forEach((b) => (b.onclick = () => { speed = +b.dataset.x; $$('[data-x]', el).forEach((o) => o.classList.toggle('on', o === b)); }));
  reset(); el.classList.remove('won'); playing = true; show(el); last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  el.addEventListener('close', () => cancelAnimationFrame(raf), { once: true });
}
