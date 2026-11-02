// Shared UI: header, menu, manifesto, marquee, tour, poster detail, page transitions.
import { BRAND, MARQUEE, MANIFESTO, POS, RUN } from './data.js';
import { MARK_SVG, makePoster, blurred, fontsReady } from './art.js';
import { sound } from './sound.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const isTouch = matchMedia('(hover: none)').matches;
// let the loader repaint between build steps; unlike requestAnimationFrame this is not paused in background tabs
const yc = new MessageChannel(); const yq = []; yc.port1.onmessage = () => yq.shift()?.();
export const yieldToBrowser = () => new Promise((r) => { yq.push(r); yc.port2.postMessage(0); });

export function chromeText(text, cls = '') {
  return `<span class="chrome ${cls}" aria-label="${text}"><span class="c-gold" aria-hidden="true">${text}</span><span class="c-face" aria-hidden="true">${text}</span></span>`;
}

const PAGES = [
  { id: 'home', n: '01', t: 'Home', href: 'index.html', icon: 'home' },
  { id: 'lockers', n: '02', t: 'The Lockers', href: 'lockers.html', icon: 'door_front' },
  { id: 'rail', n: '03', t: 'The Rail', href: 'rail.html', icon: 'checkroom' },
];

// ---------- header + menu + manifesto + marquee ----------
export function mountChrome({ page, right = '', brandButton = false, marquee = true, play = false, light = false, tour = null, onPlay, onLight, onShirt }) {
  const header = h(`
    <header class="top">
      <a class="logo" href="index.html" aria-label="${BRAND.name}, home">${MARK_SVG}<b>${BRAND.name}</b></a>
      <${brandButton ? 'button type="button"' : 'div'} class="brand" ${brandButton ? 'aria-label="See the whole room"' : ''}>
        <p class="bk">${BRAND.cup}</p>
        <p>${chromeText(BRAND.title.toUpperCase())}</p>
      </${brandButton ? 'button' : 'div'}>
      <span class="nav">${right}<span style="width:44px;flex:none"></span></span>
    </header>`);
  document.body.prepend(header);

  const here = PAGES.find((p) => p.id === page);
  const menu = h(`
    <div class="mn" id="menu">
      <div class="mn-scrim"></div>
      <nav class="mn-panel" role="dialog" aria-modal="true" aria-label="Menu">
        <p class="k mn-k">Explore</p>
        ${PAGES.map((p) => `<a class="mn-go ${p.id === page ? 'here' : ''}" href="${p.href}" ${p.id === page ? 'aria-current="page"' : ''} data-go="${p.id}"><span class="n">${p.n}</span><span>${p.t}${p.id === page ? '<span class="you">You’re here</span>' : ''}</span><span class="ms">${p.icon}</span></a>`).join('')}
        <a class="mn-go" href="#manifesto" data-mf><span class="n">04</span><span>Manifesto</span><span class="ms">history_edu</span></a>
        ${play ? `<hr><p class="k mn-k">Play</p>
          <button class="mn-play" data-play="final"><span class="ms">scoreboard</span><b>The final</b><small>Replay it minute by minute</small></button>
          <button class="mn-play" data-play="penalty"><span class="ms">sports</span><b>Penalty</b><small>Five kicks for the cup</small></button>
          <button class="mn-play" data-play="foos"><span class="ms">sports_esports</span><b>Foosball</b><small>Beat Arkan, first to 5</small></button>
          <button class="mn-play" data-play="shirt"><span class="ms">apparel</span><b>Your shirt</b><small>Hang your own in the room</small></button>` : ''}
        <hr>
        ${light ? `<div class="mn-row"><span>Light</span><div class="seg" role="group" aria-label="Light"><button data-light="day" class="on">Day</button><button data-light="night">Night</button></div></div>` : ''}
        <div class="mn-row"><span>Sound</span><button class="round snd-m" aria-label="Sound"><span class="ms">volume_off</span></button></div>
        ${tour ? `<div class="mn-row"><span>Tour</span><button class="pill" data-tour><span class="ms">explore</span>Show me</button></div>` : ''}
        <hr>
        <p class="k mn-k">Follow</p>
        <a class="mn-out" href="${BRAND.instagram}" target="_blank" rel="noopener">Instagram <span class="ms">arrow_outward</span></a>
        <a class="mn-out" href="${BRAND.behance}" target="_blank" rel="noopener">Behance <span class="ms">arrow_outward</span></a>
        <div class="mn-foot"><span>Crafted by ${BRAND.name}</span><a href="#" data-privacy>Privacy</a></div>
      </nav>
    </div>`);
  const menuBtn = h(`<button class="round mn-btn" type="button" aria-label="Menu" aria-expanded="false"><span class="ms m">menu</span><span class="ms x">close</span></button>`);
  document.body.append(menu, menuBtn);

  const setMenu = (open) => {
    menu.classList.toggle('open', open); document.documentElement.classList.toggle('mn-open', open);
    menuBtn.setAttribute('aria-expanded', open); sound.whoosh();
  };
  menuBtn.onclick = () => setMenu(!menu.classList.contains('open'));
  $('.mn-scrim', menu).onclick = () => setMenu(false);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });
  $$('[data-go]', menu).forEach((a) => a.addEventListener('click', (e) => {
    if (a.classList.contains('here')) return;
    e.preventDefault(); goTo(a.getAttribute('href'), PAGES.find((p) => p.id === a.dataset.go).t);
  }));
  $$('[data-play]', menu).forEach((b) => (b.onclick = () => { setMenu(false); onPlay?.(b.dataset.play); }));
  $$('[data-light]', menu).forEach((b) => (b.onclick = () => onLight?.(b.dataset.light)));
  $('[data-tour]', menu) && ($('[data-tour]', menu).onclick = () => { setMenu(false); setTimeout(() => tour?.(), 400); });
  $('[data-privacy]', menu).onclick = (e) => { e.preventDefault(); alert('Nothing you do here is tracked. Your shirt (if you make one) stays on this device.'); };

  const mf = mountManifesto();
  $('[data-mf]', menu).onclick = (e) => { e.preventDefault(); setMenu(false); mf.open(); };
  if (location.hash === '#manifesto') setTimeout(() => mf.open(), 600);

  if (marquee) {
    const items = [...MARQUEE, ...MARQUEE].map((t) => `<span>${t}</span>`).join('');
    document.body.append(h(`<footer class="marquee" aria-hidden="true"><div class="mq-track">${items}${items}</div></footer>`));
  }

  bindSoundButtons();
  return { header, menu, setMenu, manifesto: mf, setLight: (m) => $$('[data-light]', menu).forEach((b) => b.classList.toggle('on', b.dataset.light === m)) };
}

export function bindSoundButtons() {
  const sync = () => $$('.snd-m, .snd').forEach((b) => {
    b.classList.toggle('off', !sound.on);
    $('.ms', b).textContent = sound.on ? 'volume_up' : 'volume_off';
    b.setAttribute('aria-label', sound.on ? 'Sound off' : 'Sound on');
  });
  $$('.snd-m, .snd').forEach((b) => { if (!b.dataset.bound) { b.dataset.bound = 1; b.addEventListener('click', () => sound.toggle()); } });
  sound.addEventListener('change', sync); sync();
}

function mountManifesto() {
  const m = h(`
    <div class="modal mf" id="manifesto" aria-hidden="true">
      <div class="scrim"></div>
      <section class="panel" role="dialog" aria-modal="true" aria-labelledby="mfTitle">
        <div class="mf-scroll">
          <figure class="mf-door"><canvas></canvas><figcaption class="k mf-cap">24 artists · 24 signatures</figcaption></figure>
          <div class="mf-seal">${MARK_SVG}</div>
          <article class="mf-words">
            <div class="mf-head"><p class="k">Manifesto</p>
              <div class="seg" role="group" aria-label="Language"><button data-l="id">Bahasa</button><button data-l="en" class="on">English</button></div></div>
            <h2 id="mfTitle"></h2><div class="mf-body"></div>
          </article>
        </div>
        <button class="round x-btn" aria-label="Close the manifesto"><span class="ms">close</span></button>
      </section>
    </div>`);
  document.body.append(m);
  const render = (l) => {
    const c = MANIFESTO[l];
    $('#mfTitle', m).textContent = c.title;
    $('.mf-body', m).innerHTML = c.body.map((p) => `<p class="body">${p}</p>`).join('') + `<blockquote>${c.pull}</blockquote><p class="body">${c.end}</p>`;
    $$('[data-l]', m).forEach((b) => b.classList.toggle('on', b.dataset.l === l));
  };
  render('en');
  $$('[data-l]', m).forEach((b) => (b.onclick = () => render(b.dataset.l)));
  const drawWall = async () => {
    await fontsReady();
    const cv = $('canvas', m); const r = cv.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio);
    cv.width = r.width * dpr; cv.height = r.height * dpr; const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const { ARTISTS } = await import('./data.js');
    ctx.fillStyle = 'rgba(246,220,147,.85)'; ctx.textAlign = 'center';
    ARTISTS.forEach((a, i) => {
      const col = i % 8, row = Math.floor(i / 8);
      ctx.save(); ctx.translate((col + 0.5) * (r.width / 8) + (row % 2 ? 14 : -10), 50 + row * 58); ctx.rotate(((i * 37) % 11 - 5) / 60);
      ctx.font = `700 ${22 + (i % 3) * 3}px Caveat, cursive`; ctx.fillText(a.name.split(' ')[0].toLowerCase(), 0, 0); ctx.restore();
    });
  };
  const open = () => { m.classList.add('open'); m.removeAttribute('aria-hidden'); document.body.classList.add('lock'); sound.whoosh(); requestAnimationFrame(drawWall); };
  const close = () => { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); document.body.classList.remove('lock'); };
  $('.scrim', m).onclick = close; $('.x-btn', m).onclick = close;
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && m.classList.contains('open')) close(); });
  return { open, close };
}

// ---------- page transition ----------
export function goTo(href, label = 'The lockers') {
  let g = $('.going');
  if (!g) { g = h(`<div class="going"><p class="k">Entering</p><b></b></div>`); document.body.append(g); }
  $('b', g).textContent = label;
  sound.whoosh();
  requestAnimationFrame(() => g.classList.add('on'));
  setTimeout(() => (location.href = href), 750);
}
addEventListener('pageshow', () => $('.going')?.classList.remove('on'));

// ---------- tour ----------
export function makeTour(key, steps) {
  const el = h(`<div class="tr" aria-live="polite"><div class="tr-ring"></div>
    <div class="tr-card" role="dialog" aria-label="Tour"><div class="tr-top"><span class="tr-n"></span><button class="tr-skip">Skip</button></div>
    <h3></h3><p></p><div class="tr-bot"><div class="tr-dots">${steps.map(() => '<i></i>').join('')}</div>
    <button class="tr-back" aria-label="Back"><span class="ms">arrow_back</span></button><button class="tr-next"><span class="t">Next</span><span class="ms">arrow_forward</span></button></div></div></div>`);
  document.body.append(el);
  const ring = $('.tr-ring', el), card = $('.tr-card', el);
  let i = 0, done = null;
  const place = () => {
    const s = steps[i]; const t = typeof s.el === 'function' ? s.el() : $(s.el);
    $('.tr-n', el).textContent = `${i + 1} / ${steps.length}`; $('h3', el).textContent = s.title; $('p', el).textContent = s.body;
    $$('.tr-dots i', el).forEach((d, k) => d.classList.toggle('on', k === i));
    $('.tr-back', el).style.display = i ? '' : 'none'; $('.tr-next .t', el).textContent = i === steps.length - 1 ? 'Done' : 'Next';
    const r = t ? t.getBoundingClientRect() : { left: innerWidth / 2 - 100, top: innerHeight / 2 - 60, width: 200, height: 120 };
    const pad = s.pad ?? 8;
    Object.assign(ring.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
    const cw = 250, ch = card.offsetHeight || 180;
    let x = clamp(r.left + r.width / 2 - cw / 2, 12, innerWidth - cw - 12);
    let y = r.top + r.height / 2 > innerHeight / 2 ? r.top - ch - pad - 16 : r.top + r.height + pad + 16;
    y = clamp(y, 12, innerHeight - ch - 12);
    Object.assign(card.style, { left: x + 'px', top: y + 'px' });
  };
  const end = () => { el.classList.remove('on'); try { localStorage.setItem(key, '1'); } catch { /* ignore */ } done?.(); };
  $('.tr-next', el).onclick = () => { sound.click(); if (i < steps.length - 1) { i++; place(); } else end(); };
  $('.tr-back', el).onclick = () => { sound.click(); i = Math.max(0, i - 1); place(); };
  $('.tr-skip', el).onclick = end;
  addEventListener('resize', () => el.classList.contains('on') && place());
  return {
    start(force = false) {
      try { if (!force && localStorage.getItem(key)) return Promise.resolve(); } catch { /* ignore */ }
      i = 0; el.classList.add('on'); place(); requestAnimationFrame(place);
      return new Promise((r) => (done = r));
    },
  };
}

// ---------- posters as images (cached) ----------
const posterCache = new Map();
export function posterCanvas(p) {
  if (!posterCache.has(p.id)) posterCache.set(p.id, makePoster(p));
  return posterCache.get(p.id);
}
const urlCache = new Map();
export function posterURL(p, small = false) {
  const k = p.id + (small ? 's' : '');
  if (!urlCache.has(k)) {
    const c = posterCanvas(p);
    if (small) { const s = document.createElement('canvas'); s.width = 128; s.height = 180; s.getContext('2d').drawImage(c, 0, 0, 128, 180); urlCache.set(k, s.toDataURL('image/jpeg', 0.8)); }
    else urlCache.set(k, c.toDataURL('image/jpeg', 0.92));
  }
  return urlCache.get(k);
}
export function posterBlurURL(p) {
  const k = p.id + 'b';
  if (!urlCache.has(k)) urlCache.set(k, blurred(posterCanvas(p), 8).toDataURL('image/jpeg', 0.7));
  return urlCache.get(k);
}

// ---------- poster detail ----------
export function makeDetail(posters, { cta = 'Enter the lockers', onCta } = {}) {
  const el = h(`
    <div class="detail" role="dialog" aria-modal="true" aria-label="Poster" aria-hidden="true">
      <div class="dt-amb" aria-hidden="true"><img alt=""></div>
      <div class="dt-head dt-in"><p class="k dt-kick"></p><h2 class="dt-name"></h2></div>
      <button class="round dt-close" type="button" aria-label="Close"><span class="ms">close</span></button>
      <div class="dt-left dt-in"><p class="k">Story</p><p class="dt-story"></p><div class="dt-facts"></div><p class="k dt-k2">At the cup</p><div class="dt-rows"></div></div>
      <div class="dt-frame"><img class="dt-big" alt=""></div>
      <div class="dt-right dt-in"><p class="k">Poster by</p><div class="dt-sig"></div>
        <div class="dt-who"><p class="nm"></p><p class="hd"></p><a class="pill dt-work" target="_blank" rel="noopener">Follow <span class="ms">arrow_outward</span></a></div></div>
      <div class="dt-rail dt-in"><button class="round dt-prev" aria-label="Previous poster"><span class="ms">chevron_left</span></button><div class="dt-ticks"></div><button class="round dt-next" aria-label="Next poster"><span class="ms">chevron_right</span></button>
        <div class="dt-peek" aria-hidden="true"><img alt=""><span></span></div></div>
      <div class="dt-bar dt-in"><button class="btn solid dt-cta"><span>${cta}</span><span class="ms">arrow_forward</span></button></div>
    </div>`);
  document.body.append(el);
  const ticks = $('.dt-ticks', el);
  posters.forEach((p, i) => { const b = h(`<button class="dt-tick" aria-label="${p.player.name}"><i></i></button>`); b.onclick = () => show(i); b.onmouseenter = () => peek(i, b); b.onmouseleave = () => $('.dt-peek', el).classList.remove('on'); ticks.append(b); });
  let idx = 0, onClose = null;
  const peek = (i, b) => {
    const pk = $('.dt-peek', el); $('img', pk).src = posterURL(posters[i], true); $('span', pk).textContent = posters[i].player.name;
    const r = b.getBoundingClientRect(), pr = $('.dt-rail', el).getBoundingClientRect(); pk.style.left = r.left - pr.left + r.width / 2 + 'px'; pk.classList.add('on');
  };
  const show = (i) => {
    idx = (i + posters.length) % posters.length; const p = posters[idx]; const pl = p.player;
    $('.dt-big', el).src = posterURL(p); $('.dt-amb img', el).src = posterBlurURL(p);
    $('.dt-kick', el).innerHTML = pl.pos === 'COACH' ? `<b class="gold">Coach</b> · Poster ${idx + 1} of ${posters.length}` : `<b class="gold">No. ${pl.no}</b> · ${POS[pl.pos].long} · ${idx + 1} of ${posters.length}`;
    $('.dt-name', el).textContent = pl.name;
    $('.dt-story', el).textContent = pl.story;
    $('.dt-facts', el).innerHTML = pl.pos === 'COACH' ? '' : [['Club', pl.club], ['Caps', pl.caps], ['Goals', pl.goals], ['Height', pl.height + ' cm']].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
    $('.dt-k2', el).style.display = pl.mins ? '' : 'none';
    $('.dt-rows', el).innerHTML = pl.mins ? RUN.map((m, k) => `<div class="dt-row"><span>vs <b>${m.vs}</b></span><i style="--w:${(pl.mins[k] / 120) * 100}%"></i><em>${pl.mins[k] ? pl.mins[k] + '’' : '—'}</em></div>`).join('') : '';
    $('.dt-sig', el).textContent = p.artist.name.split(' ')[0].toLowerCase();
    $('.nm', el).textContent = p.artist.name; $('.hd', el).textContent = '@' + p.artist.handle; $('.dt-work', el).href = p.artist.link;
    $$('.dt-tick', el).forEach((t, k) => t.classList.toggle('on', k === idx));
    el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap');
    sound.tick();
  };
  const frame = $('.dt-frame', el);
  el.addEventListener('pointermove', (e) => {
    if (isTouch) return; const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
    frame.style.transform = `perspective(1200px) rotateY(${x * 8}deg) rotateX(${-y * 6}deg)`;
  });
  const close = () => { el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); document.body.classList.remove('lock'); onClose?.(); };
  $('.dt-close', el).onclick = close;
  $('.dt-prev', el).onclick = () => show(idx - 1);
  $('.dt-next', el).onclick = () => show(idx + 1);
  $('.dt-cta', el).onclick = () => onCta ? onCta(posters[idx]) : close();
  addEventListener('keydown', (e) => {
    if (!el.classList.contains('open')) return;
    if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') show(idx + 1); if (e.key === 'ArrowLeft') show(idx - 1);
  });
  return {
    open(i, cb) { onClose = cb; show(i); el.classList.add('open'); el.removeAttribute('aria-hidden'); document.body.classList.add('lock'); sound.whoosh(); },
    close, get isOpen() { return el.classList.contains('open'); }, el,
  };
}

// ---------- loader with jersey strip (lockers + rail) ----------
export function makeLoader({ count = 25, numbers = [], statuses = [], gate }) {
  const el = h(`<div class="ld"><div class="ld-in">
    <div class="ld-mark">${MARK_SVG}</div><p class="k">Interactive 3D locker room</p>
    <div class="ld-strip"><div class="ld-shirts"></div></div>
    <div class="ld-meta"><b class="pc">000</b><span class="st"></span></div>
    <div class="ld-gate">${gate || ''}</div></div>
    <p class="credit ld-foot">Crafted by ${BRAND.name} · <a href="#" onclick="return false">Privacy</a></p></div>`);
  document.body.append(el);
  return {
    el,
    async build(jerseyIcon) {
      await fontsReady();
      const box = $('.ld-shirts', el);
      for (let i = 0; i < count; i++) { const n = numbers[i] ?? i + 1; const c = jerseyIcon(n, [1, 12, 13].includes(n) ? 'gk' : 'home', 18); box.append(c); }
    },
    progress(p) {
      const n = Math.round(p * 100); $('.pc', el).textContent = String(n).padStart(3, '0');
      $('.st', el).textContent = statuses[Math.min(statuses.length - 1, Math.floor(p * statuses.length))] || '';
      $$('.ld-shirts canvas', el).forEach((c, i, a) => c.classList.toggle('on', i / a.length < p));
    },
    ready() { el.classList.add('ready'); },
    hide() { el.classList.add('gone'); },
  };
}
