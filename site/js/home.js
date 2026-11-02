// Home: one scroll-driven three.js scene. Posters move between five layouts:
// cloud (hero) → ring → spiral (with dial) → wall (drag) → out, then the cup's locker finale.
import { THREE, makeRenderer, envMap, canvasTex, makeTrophy, makeLocker } from './kit3d.js';
import { BRAND, POSTERS } from './data.js';
import { fontsReady, blurred, jerseyIcon, MARK_SVG, rng } from './art.js';
import { $, $$, h, clamp, lerp, isTouch, chromeText, mountChrome, makeDetail, posterCanvas, goTo, yieldToBrowser } from './ui.js';
import { sound } from './sound.js';

const N = POSTERS.length;
const EXTRA = 14;
const TOTAL = N + EXTRA;
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

$('.loader .ld-mark').innerHTML = MARK_SVG;
mountChrome({
  page: 'home', marquee: false,
  right: `<a class="pill gold-pill wi-enter" href="lockers.html"><span>Enter<span class="we-l"> the lockers</span></span><span class="ms">arrow_outward</span></a>`,
});
$('.wi-enter').addEventListener('click', (e) => { e.preventDefault(); goTo('lockers.html', 'The lockers'); });
$$('[data-enter]').forEach((b) => (b.onclick = () => goTo('lockers.html', 'The lockers')));

// ---------- DOM titles ----------
const word = (txt, el) => { [...txt].forEach((c, i) => { const s = h(`<span class="ht-c">${chromeText(c)}</span>`); s.style.transitionDelay = 0.15 + i * 0.06 + 's'; el.append(s); }); };
const [evL, evR] = BRAND.event.split(' ');
word(evL, $('.ht-l')); word(evR, $('.ht-r'));
const ringWord = 'INKED IN GLORY';
const rtH = $('.rt-h');
[...ringWord].forEach((c, j) => {
  const a = (j - (ringWord.length - 1) / 2) * 7.4;
  const s = h(`<span class="ch">${c === ' ' ? '&nbsp;' : chromeText(c)}</span>`);
  s.style.transform = `translateX(-50%) rotateY(${a}deg) translateZ(7em)`;
  rtH.append(s);
});

// ---------- three ----------
const canvas = $('#gl');
const renderer = makeRenderer(canvas, { alpha: true });
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
scene.environment = envMap(renderer);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 9);
scene.add(new THREE.AmbientLight(0xffe6c8, 0.5));
const key = new THREE.SpotLight(0xffe0b0, 60, 30, 0.5, 0.6); key.position.set(0, 7, 5); scene.add(key);
const rim = new THREE.PointLight(0xff9a50, 25, 20); rim.position.set(-4, 1, -3); scene.add(rim);

const trophy = makeTrophy();
scene.add(trophy);

// finale: the cup's locker with its own trophy
const cupLocker = makeLocker({ kind: 'cup', plateTop: '★', plateBottom: 'The cup' });
const lockTrophy = makeTrophy(); lockTrophy.scale.setScalar(0.6); lockTrophy.position.set(0, 0.1, -0.04); cupLocker.add(lockTrophy);
const beam = new THREE.Mesh(new THREE.ConeGeometry(0.26, 1.5, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
beam.position.set(0, 0.86, 0); cupLocker.add(beam);
const lockLight = new THREE.PointLight(0xffc888, 0, 3); lockLight.position.set(0, 1.45, 0.1); cupLocker.add(lockLight);
const dust = (() => {
  const g = new THREE.BufferGeometry(); const n = 140; const a = new Float32Array(n * 3); const r = rng(5);
  for (let i = 0; i < n; i++) { a[i * 3] = (r() - 0.5) * 0.45; a[i * 3 + 1] = 0.1 + r() * 1.5; a[i * 3 + 2] = (r() - 0.5) * 0.35; }
  g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffe2b0, size: 0.012, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
})();
cupLocker.add(dust);
cupLocker.visible = false;
scene.add(cupLocker);

// posters
const PW = 0.9, PH = PW * 1.406;
const pGeo = new THREE.PlaneGeometry(PW, PH);
const backMat = new THREE.MeshBasicMaterial({ color: 0x2a1f17, toneMapped: false });
const posters = [];
const R = rng(2026);
const cloud = [];
for (let i = 0; i < TOTAL; i++) {
  const a = (i / TOTAL) * Math.PI * 2 + (R() - 0.5) * 0.5;
  let x = Math.cos(a) * (2.0 + R() * 2.8), y = Math.sin(a) * (1.2 + R() * 1.5) - 0.5;
  if (Math.abs(x) < 1.3 && y > -2.2) x = Math.sign(x || 1) * (1.35 + R() * 1.2); // keep the trophy clear
  if (y > 0.9 && Math.abs(x) < 3.4) y = 0.9 - R() * 0.6; // keep the headline clear
  cloud.push({ x, y, z: -5 + R() * 7.2, rz: (R() - 0.5) * 0.5, ry: (R() - 0.5) * 0.7, s: 0.8 + R() * 0.35 });
}

// ---------- detail viewer ----------
const detail = makeDetail(POSTERS, { onCta: () => goTo('lockers.html', 'The lockers') });

// ---------- loading ----------
const loaderBar = $('.loader i b');
async function load() {
  await fontsReady();
  for (let i = 0; i < TOTAL; i++) {
    const P = POSTERS[i % N];
    const c = posterCanvas(P);
    const sharp = canvasTex(c); const soft = canvasTex(blurred(c, 9));
    const mat = new THREE.MeshBasicMaterial({ map: sharp, transparent: true, toneMapped: false });
    const m = new THREE.Mesh(pGeo, mat);
    const back = new THREE.Mesh(pGeo, backMat); back.rotation.y = Math.PI; m.add(back); // paper back, not a mirror image
    m.userData = { i, poster: P, sharp, soft, cur: new THREE.Vector3(), cloud: cloud[i] };
    posters.push(m); scene.add(m);
    loaderBar.style.transform = `scaleX(${(i + 1) / TOTAL})`;
    if (i % 4 === 3) await yieldToBrowser();
  }
  buildDial();
  $('.loader').classList.add('gone');
  document.body.classList.add('loaded');
}

// ---------- layouts ----------
const SEG = [
  { name: 'cloud', a: 0, b: 0.08 },
  { name: 'ring', a: 0.18, b: 0.35 },
  { name: 'spiral', a: 0.44, b: 0.62 },
  { name: 'wall', a: 0.7, b: 0.82 },
  { name: 'out', a: 0.89, b: 1.01 },
];
function segAt(p) {
  for (let s = SEG.length - 1; s >= 0; s--) {
    if (p >= SEG[s].a) {
      if (p <= SEG[s].b || s === SEG.length - 1) return [SEG[s], SEG[s], 0];
      return [SEG[s], SEG[s + 1], smooth((p - SEG[s].b) / (SEG[s + 1].a - SEG[s].b))];
    }
  }
  return [SEG[0], SEG[0], 0];
}
const narrow = () => innerWidth / innerHeight < 0.9;
const ringRot = (p) => (p - 0.13) * 7;
const spiralK = (p) => clamp((p - 0.44) / 0.18, 0, 1) * (N - 1);

const st = { p: 0, pt: 0, t: 0, wallOff: 0, wallVel: 0, hover: -1, open: 0, openT: 0, mx: 0, my: 0 };

function layout(name, m, p, o) {
  const { i, cloud: c } = m.userData;
  o.b = 1; o.o = 1; o.rx = 0; o.ry = 0; o.rz = 0; o.s = 1; o.blur = 0;
  if (name === 'cloud') {
    const sx = narrow() ? 0.55 : 1;
    o.x = c.x * sx; o.y = c.y + Math.sin(st.t * 0.6 + i) * 0.06; o.z = c.z; o.ry = c.ry; o.rz = c.rz + Math.sin(st.t * 0.4 + i) * 0.02; o.s = c.s;
    o.blur = c.z > 1.4 || c.z < -3 ? 1 : 0; o.b = 0.55 + 0.45 * clamp((c.z + 5) / 6, 0, 1);
    return o;
  }
  if (i >= N) { // cloud-only extras fly past the camera
    o.x = c.x * 2.4; o.y = c.y * 2.4; o.z = c.z + 7; o.ry = c.ry; o.rz = c.rz; o.o = 0; return o;
  }
  if (name === 'ring') {
    const th = (i / N) * Math.PI * 2 + ringRot(p); const Rr = narrow() ? 2.4 : 3.9;
    o.x = Math.sin(th) * Rr; o.z = Math.cos(th) * Rr - 1.6; o.y = -0.55 - Math.cos(th) * 0.45; o.ry = th;
    o.b = 0.3 + 0.7 * (Math.cos(th) + 1) / 2; o.s = 0.95;
    return o;
  }
  if (name === 'spiral') {
    const j = i - spiralK(p); const th = j * 0.6; const Rs = narrow() ? 1.6 : 2.0; const cx = narrow() ? 0 : -2.1;
    o.x = cx + Math.sin(th) * Rs; o.z = Math.cos(th) * Rs - 1.1; o.y = -j * 0.44 + (narrow() ? 0.7 : 0); o.ry = th;
    o.b = 0.25 + 0.75 * (Math.cos(th) + 1) / 2; o.o = clamp(1.6 - Math.abs(j) / 5, 0, 1);
    if (Math.abs(j) < 0.5 && st.hover === i) o.s = 1.05;
    return o;
  }
  if (name === 'wall' || name === 'out') {
    const cols = narrow() ? 4 : 8; const col = i % cols, row = Math.floor(i / cols); const rows = Math.ceil(N / cols);
    const gx = narrow() ? 1.0 : 1.12, gy = 1.48;
    const pan = lerp(1, -1, clamp((p - 0.66) / 0.2, 0, 1)) * (narrow() ? 0.4 : 1.1);
    o.x = (col - (cols - 1) / 2) * gx + st.wallOff + pan; o.y = ((rows - 1) / 2 - row) * gy - 0.15; o.z = 0.4;
    o.ry = clamp(st.wallVel * -2, -0.5, 0.5); o.s = narrow() ? 0.82 : 1;
    if (st.hover === i) { o.z += 0.35; o.s *= 1.06; }
    if (name === 'out') { o.x *= 2.6; o.y *= 2.4; o.z += 6.5; o.o = 0; }
    return o;
  }
  return o;
}

const A = {}, B = {};
function placePosters(p) {
  const [sa, sb, t] = segAt(p);
  for (const m of posters) {
    layout(sa.name, m, p, A); layout(sb.name, m, p, B);
    const x = lerp(A.x, B.x, t), y = lerp(A.y, B.y, t), z = lerp(A.z, B.z, t);
    const k = 1 - Math.pow(0.0008, 1 / 60); // gentle per-frame follow
    const u = m.userData.cur;
    if (!u.init) { u.set(x, y, z); u.init = true; }
    u.x += (x - u.x) * Math.min(1, k * 9); u.y += (y - u.y) * Math.min(1, k * 9); u.z += (z - u.z) * Math.min(1, k * 9);
    m.position.copy(u);
    m.rotation.set(lerp(A.rx, B.rx, t), lerp(A.ry, B.ry, t), lerp(A.rz, B.rz, t));
    m.scale.setScalar(lerp(A.s, B.s, t));
    const o = lerp(A.o, B.o, t); const bright = lerp(A.b, B.b, t); const bl = lerp(A.blur, B.blur, t);
    m.material.opacity = o; m.visible = o > 0.01;
    m.material.color.setScalar(bright);
    const want = bl > 0.5 ? m.userData.soft : m.userData.sharp;
    if (m.material.map !== want) { m.material.map = want; m.material.needsUpdate = true; }
  }
  // trophy
  const tw = { cloud: [0, -2.05, 0.8, 1.32], ring: [0, -1.5, -1.6, 0.95], spiral: [0, -7, -2, 0.6], wall: [0, -7, -2, 0.6], out: [0, -7, -2, 0.6] };
  const ta = tw[sa.name], tb = tw[sb.name];
  trophy.position.set(lerp(ta[0], tb[0], t) + st.mx * 0.1, lerp(ta[1], tb[1], t), lerp(ta[2], tb[2], t));
  trophy.scale.setScalar(lerp(ta[3], tb[3], t) * (narrow() ? 0.75 : 1));
  trophy.rotation.y = st.t * 0.35 + st.mx * 0.4;
  trophy.visible = trophy.position.y > -5;

  // locker finale
  const f = smooth((p - 0.84) / 0.07);
  cupLocker.visible = f > 0.001;
  const lx = narrow() ? 0 : 1.7, ly = narrow() ? -0.2 : -1.75, ls = narrow() ? 1.15 : 1.6;
  cupLocker.position.set(lx, lerp(-9, ly, f), lerp(-3, 0, f));
  cupLocker.scale.setScalar(ls);
  cupLocker.rotation.y = lerp(-0.6, -0.12, f) + st.mx * 0.06;
}

// ---------- DOM per-frame ----------
const heroT = $('.hero-t'), ringT = $('.ring-t'), sp = $('.sp'), fin = $('.fin'), hint = $('.home-hint'), glow = $('.glow');
const wcur = $('.wcur'), turn = $('#turnhint');
function vis(el, o) { el.style.opacity = o; el.style.visibility = o > 0.01 ? 'visible' : 'hidden'; }
let lastActive = -1;
function domFrame(p) {
  // hero title splits apart
  const sTitle = smooth((p - 0.03) / 0.12);
  $('.ht-l').style.transform = `translate3d(${-sTitle * 38}vw,0,0)`; $('.ht-r').style.transform = `translate3d(${sTitle * 38}vw,0,0)`;
  $('.ht-l').style.filter = $('.ht-r').style.filter = `blur(${sTitle * 10}px)`;
  $('.ht-k', heroT).style.opacity = 1 - sTitle * 1.4;
  vis(heroT, 1 - smooth((p - 0.1) / 0.06));
  // ring title
  const rIn = smooth((p - 0.15) / 0.05) * (1 - smooth((p - 0.37) / 0.05));
  vis(ringT, rIn);
  rtH.style.transform = `translateZ(-7em) rotateY(${(-ringRot(p) + ringRot(0.265)) * 14}deg)`;
  // spiral dial
  const sIn = smooth((p - 0.41) / 0.04) * (1 - smooth((p - 0.63) / 0.04));
  vis(sp, sIn); sp.style.pointerEvents = sIn > 0.5 ? '' : 'none';
  if (sIn > 0) dialFrame(spiralK(p));
  // finale
  fin.classList.toggle('on', p > 0.88);
  // hints
  const msg = p < 0.06 ? 'Scroll to continue' : p > 0.2 && p < 0.34 ? 'Tap a poster to see it up close' : p > 0.46 && p < 0.6 ? 'Turn the dial, or keep scrolling' : p > 0.71 && p < 0.81 ? 'Drag the wall · tap a poster' : '';
  if (hint.dataset.m !== msg) { hint.dataset.m = msg; hint.lastChild.textContent = msg; }
  hint.style.opacity = msg ? 1 : 0;
  glow.style.opacity = 1 - smooth((p - 0.1) / 0.2) * 0.55 + smooth((p - 0.86) / 0.1) * 0.3;
  const inWall = p > 0.68 && p < 0.84 && !isTouch;
  wcur.classList.toggle('on', inWall && st.overCanvas && st.hover < 0 && !detail.isOpen);
}

// ---------- dial ----------
const STEP = 12; let names = [];
function buildDial() {
  const rotor = $('.dial-rotor');
  for (let i = 0; i < 120; i++) { const t = h(`<i class="${i % 5 ? '' : 'mj'}"></i>`); t.style.transform = `rotate(${i * 3}deg) translateX(-250px)`; rotor.append(t); }
  const box = $('.dial-names');
  names = POSTERS.map((P, i) => {
    const b = h(`<button type="button"><span>${P.player.name}</span><b>${P.kind === 'coach' ? 'HC' : P.player.no}</b></button>`);
    b.onclick = () => (i === lastActive ? detail.open(i) : scrollToK(i));
    box.append(b); return b;
  });
  $('.dial-knob').onclick = () => detail.open(Math.round(spiralK(st.p)));
  // drag the dial (vertical) to turn the spiral
  const dial = $('.dial'); let drag = null;
  dial.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; drag = { y: e.clientY, x: e.clientX }; dial.setPointerCapture(e.pointerId); });
  dial.addEventListener('pointermove', (e) => {
    if (!drag) return; const d = narrow() ? -(e.clientX - drag.x) : e.clientY - drag.y; drag = { y: e.clientY, x: e.clientX };
    scrollByK(-d / 38);
  });
  dial.addEventListener('pointerup', () => { drag = null; scrollToK(Math.round(spiralK(st.pt))); });
}
const scrollMax = () => document.documentElement.scrollHeight - innerHeight;
function scrollByK(dk) { window.scrollBy(0, (dk * 0.18 / (N - 1)) * scrollMax()); }
function scrollToK(k) { window.scrollTo({ top: (0.44 + (k / (N - 1)) * 0.18) * scrollMax(), behavior: 'smooth' }); }
function dialFrame(k) {
  const R = 228;
  $('.dial-rotor').style.transform = `rotate(${-k * STEP}deg)`;
  const active = Math.round(k);
  names.forEach((b, i) => {
    const d = i - k; const a = Math.PI + (d * STEP * Math.PI) / 180;
    const x = 260 + Math.cos(a) * R - 14, y = 260 + Math.sin(a) * R;
    b.style.transform = `translate(${x - 260}px, ${y - 260}px) translate(-100%, -50%) rotate(${d * STEP}deg)`;
    b.style.transformOrigin = '100% 50%';
    b.style.opacity = clamp(1 - Math.abs(d) / 6.5, 0, 1);
    b.classList.toggle('on', i === active);
  });
  if (active !== lastActive) {
    lastActive = active; const P = POSTERS[active]; sound.tick();
    const c = $('.dial-knob canvas'); const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(jerseyIcon(P.player.no || 'C', P.player.pos === 'GK' ? 'gk' : 'home', 60), 0, 0, c.width, c.height);
    $('.sp-by').innerHTML = `Poster by <b>${P.artist.name}</b>`;
  }
}

// ---------- pointer ----------
const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
let down = null;
addEventListener('pointermove', (e) => {
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  st.mx = ndc.x; st.my = ndc.y;
  st.overCanvas = e.target === canvas;
  wcur.style.transform = `translate(${e.clientX}px, ${e.clientY}px) ${wcur.classList.contains('on') ? 'scale(1)' : 'scale(.6)'}`;
  turn.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  if (down && down.wall) {
    const dx = (e.clientX - down.x) / innerWidth * 9; down.x = e.clientX; down.moved += Math.abs(dx);
    st.wallOff = clamp(st.wallOff + dx, -4, 4); st.wallVel = dx;
  }
});
canvas.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY, moved: 0, wall: st.p > 0.68 && st.p < 0.84 };
  wcur.classList.add('down'); if (down.wall) canvas.setPointerCapture(e.pointerId);
});
addEventListener('pointerup', (e) => {
  wcur.classList.remove('down');
  if (!down) return; const moved = down.moved > 0.05 || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6; down = null;
  if (moved || e.target !== canvas) return;
  const hit = pick();
  if (hit) {
    if (hit.kind === 'locker') { toggleLocker(); return; }
    const i = hit.i;
    const seg = segAt(st.p)[0].name;
    if (seg === 'spiral' && i !== Math.round(spiralK(st.p))) scrollToK(i); else { sound.click(); detail.open(i); }
  }
});
function pick() {
  ray.setFromCamera(ndc, camera);
  if (cupLocker.visible && st.p > 0.86) {
    const hits = ray.intersectObject(cupLocker, true);
    if (hits.length) return { kind: 'locker' };
  }
  const list = posters.filter((m) => m.visible && m.material.opacity > 0.5 && m.userData.i < N);
  const hits = ray.intersectObjects(list, false);
  return hits.length ? { kind: 'poster', i: hits[0].object.userData.i } : null;
}

// ---------- the cup's locker ----------
function toggleLocker() {
  st.openT = st.openT ? 0 : 1;
  fin.classList.toggle('opened', !!st.openT);
  st.openT ? sound.door() : sound.shut();
  if (st.openT) setTimeout(() => sound.chime(), 500);
}
$('.fin-open').onclick = toggleLocker;

// ---------- loop ----------
function onScroll() { st.pt = clamp(scrollY / Math.max(1, scrollMax()), 0, 1); }
addEventListener('scroll', onScroll, { passive: true }); onScroll();
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); onScroll(); });

let last = performance.now(), hoverT = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; st.t += dt;
  st.p += (st.pt - st.p) * Math.min(1, dt * 6);
  if (Math.abs(st.pt - st.p) < 0.00005) st.p = st.pt;
  st.wallVel *= 0.9;
  camera.position.x = lerp(camera.position.x, st.mx * 0.3, 0.05); camera.position.y = lerp(camera.position.y, st.my * 0.18, 0.05);
  camera.lookAt(0, 0, 0);
  if (posters.length) {
    if ((hoverT += dt) > 0.05) {
      hoverT = 0;
      const hit = !isTouch && st.overCanvas && !detail.isOpen ? pick() : null;
      const hv = hit?.kind === 'poster' ? hit.i : -1;
      if (hv !== st.hover && hv >= 0) sound.hover();
      st.hover = hv;
      canvas.style.cursor = hit ? 'pointer' : '';
      turn.classList.toggle('on', hit?.kind === 'locker' && !st.openT);
    }
    placePosters(st.p);
    domFrame(st.p);
  }
  // locker door + light
  st.open += (st.openT - st.open) * Math.min(1, dt * 3.5);
  const ud = cupLocker.userData; ud.hinge.rotation.y = -st.open * 1.95;
  beam.material.opacity = st.open * 0.16; dust.material.opacity = st.open * 0.85; lockLight.intensity = st.open * 6;
  dust.rotation.y += dt * 0.15;
  lockTrophy.rotation.y = st.t * 0.5;
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
load();
