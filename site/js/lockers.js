// The Lockers: a 3D room with a row of 26 lockers (23 players, the coach, the cup, and yours).
import { Reflector } from 'three/addons/objects/Reflector.js';
import { THREE, makeRenderer, envMap, canvasTex, makeTrophy, makeLocker, makeShirt, makeHanger, setShirt, LOCKER, CHROME } from './kit3d.js';
import { POSTERS, POS, BRAND, lockerOrder, posterFor } from './data.js';
import { fontsReady, jerseyIcon, makeFloorTex, makeSlatsTex, makeBallTex, rng, roundRect } from './art.js';
import { $, $$, h, clamp, lerp, isTouch, mountChrome, makeDetail, makeTour, makeLoader, posterCanvas, goTo, yieldToBrowser } from './ui.js';
import { sound } from './sound.js';
import { openGame, loadFan } from './games.js';

const S = LOCKER.w + LOCKER.gap;
const order = [...lockerOrder(), { kind: 'fan' }];
const CUP = order.findIndex((e) => e.kind === 'cup');
const X = (i) => (i - CUP) * S;
const narrow = () => innerWidth / innerHeight < 0.9;

// ---------- chrome ----------
const views = `<div class="seg views" role="group" aria-label="Camera"><button data-v="front">Front</button><button data-v="wide" class="on">Wide</button><button data-v="angle">Angle</button></div>`;
const chrome = mountChrome({
  page: 'lockers', right: views, brandButton: true, play: true, light: true,
  tour: () => tour.start(true),
  onPlay: (g) => openGame(g, { onFan: applyFan }),
  onLight: (m) => setLight(m),
});
$('.brand').onclick = () => { closeLocker(); setView('wide'); walkTo(CUP); };
$$('[data-v]').forEach((b) => (b.onclick = () => setView(b.dataset.v)));
$('#xlink').addEventListener('click', (e) => { e.preventDefault(); goTo('rail.html', 'The rail'); });

const detail = makeDetail(POSTERS, { cta: 'Back to the room', onCta: () => detail.close() });

// ---------- three ----------
const canvas = $('#gl');
const renderer = makeRenderer(canvas, { shadows: true });
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0907);
scene.fog = new THREE.Fog(0x0d0907, 9, 22);
scene.environment = envMap(renderer);
scene.environmentIntensity = 0.3;
renderer.toneMappingExposure = 0.88;
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 60);
camera.position.set(0, 1.6, 5);

// lights
const hemi = new THREE.HemisphereLight(0xffe2c0, 0x2a1a10, 0.7); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffb070, 2.4);
sun.position.set(-7, 7, 5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 6, bottom: -4, near: 1, far: 30 }); sun.shadow.bias = -0.0005;
scene.add(sun); scene.add(sun.target);
const lamps = [];
for (let i = -5; i <= 5; i++) {
  const sp = new THREE.SpotLight(0xffe4c2, 0, 9, 0.75, 0.65, 1.3); sp.position.set(i * 2.4, 3.9, 1.2); sp.target.position.set(i * 2.4, 0, 0.4);
  scene.add(sp, sp.target); lamps.push(sp);
}
const inner = new THREE.PointLight(0xffd29a, 0, 1.6, 1.5); scene.add(inner);

// ---------- room ----------
const floorTex = canvasTex(makeFloorTex(), { repeat: [10, 4] });
// polished concrete: a real reflection under a slightly see-through floor, like the original's glossy floor
const mirror = new Reflector(new THREE.PlaneGeometry(40, 16), { textureWidth: Math.round(innerWidth * 0.6), textureHeight: Math.round(innerHeight * 0.6), color: 0x6f6660, clipBias: 0.003 });
mirror.rotation.x = -Math.PI / 2; mirror.position.set(0, -0.002, 6); scene.add(mirror);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), new THREE.MeshStandardMaterial({ map: floorTex, color: 0x8a776a, roughness: 0.5, metalness: 0.1, transparent: true, opacity: 0.84 }));
floor.rotation.x = -Math.PI / 2; floor.position.z = 6; floor.receiveShadow = true; scene.add(floor);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 6), new THREE.MeshStandardMaterial({ map: canvasTex(makeSlatsTex(512, 512, '#1f150f'), { repeat: [24, 2] }), roughness: 0.85 }));
wall.position.set(0, 3, -0.27); wall.receiveShadow = true; scene.add(wall);
const cornice = new THREE.Mesh(new THREE.BoxGeometry(40, 0.28, 0.7), new THREE.MeshStandardMaterial({ color: 0x1a120d, roughness: 0.7 }));
cornice.position.set(0, 2.16, 0.05); cornice.castShadow = true; scene.add(cornice);
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), new THREE.MeshStandardMaterial({ color: 0x120d0a, roughness: 1 }));
ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 4.2, 6); scene.add(ceil);
// high windows and lamp fixtures
const winMat = new THREE.MeshBasicMaterial({ color: 0xffd9a8, fog: false });
const winFrame = new THREE.MeshStandardMaterial({ color: 0x15100c, roughness: 0.6 });
// ceiling beams running front to back
for (let i = -8; i <= 8; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.34, 16), winFrame); b.position.set(i * 2.6, 4.03, 6); scene.add(b); }
const fixMat = new THREE.MeshStandardMaterial({ color: 0x222, emissive: 0xffe2b8, emissiveIntensity: 0 });
lamps.forEach((l) => { const f = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.18), fixMat); f.position.set(l.position.x, 4.15, 1.2); scene.add(f); });
// sun shafts
const shaftTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 256); const g2 = x.createLinearGradient(0, 0, 64, 0); g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(0.3, 'rgba(0,0,0,0)'); g2.addColorStop(0.7, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,1)'); x.globalCompositeOperation = 'destination-out'; x.fillStyle = g2; x.fillRect(0, 0, 64, 256); return canvasTex(c); })();
const shaftMat = new THREE.MeshBasicMaterial({ map: shaftTex, color: 0xffa860, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const shafts = [];
for (let i = -6; i <= 6; i += 3) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 9), shaftMat); m.position.set(i * 2.6 + 2.2, 1.7, 1.8); m.rotation.set(-0.35, 0.2, 0.62); scene.add(m); shafts.push(m);
}

// props: foosball table, ball, tactics board
function foosball() {
  const g = new THREE.Group(); const blk = new THREE.MeshStandardMaterial({ color: 0x111, roughness: 0.35, metalness: 0.5 }); const chrome = CHROME();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.28, 0.85), blk); body.position.y = 0.86; body.castShadow = true; g.add(body);
  const field = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.72), new THREE.MeshStandardMaterial({ color: 0x1f5a35, roughness: 0.8 })); field.rotation.x = -Math.PI / 2; field.position.y = 0.93; g.add(field);
  [[-0.68, -0.36], [0.68, -0.36], [-0.68, 0.36], [0.68, 0.36]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.75, 0.07), blk); l.position.set(x, 0.38, z); l.castShadow = true; g.add(l); });
  for (let r = 0; r < 8; r++) {
    const x = -0.6 + r * 0.17; const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.25), chrome); rod.rotation.x = Math.PI / 2; rod.position.set(x, 1.0, 0); g.add(rod);
    const men = [1, 2, 5, 3, 3, 5, 2, 1][r]; const mat = new THREE.MeshStandardMaterial({ color: r % 2 ? 0x2f5d8a : 0xc23b28, roughness: 0.5 });
    for (let k = 0; k < men; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.05), mat); m.position.set(x, 0.97, (k - (men - 1) / 2) * 0.14); g.add(m); }
    const hnd = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1), blk); hnd.rotation.x = Math.PI / 2; hnd.position.set(x, 1.0, r % 2 ? -0.67 : 0.67); g.add(hnd);
  }
  return g;
}
const table = foosball(); table.position.set(-2.7, 0, 5.0); table.rotation.y = 0.3; scene.add(table);
const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 32, 24), new THREE.MeshStandardMaterial({ map: canvasTex(makeBallTex()), roughness: 0.45 }));
ball.position.set(-1.75, 0.11, 5.55); ball.castShadow = true; scene.add(ball);
function board() {
  const g = new THREE.Group(); const c = document.createElement('canvas'); c.width = 512; c.height = 360; const x = c.getContext('2d');
  x.fillStyle = '#ecebe6'; x.fillRect(0, 0, 512, 360); x.strokeStyle = '#2d6a3e'; x.lineWidth = 4; x.strokeRect(20, 20, 472, 320); x.beginPath(); x.moveTo(256, 20); x.lineTo(256, 340); x.stroke(); x.beginPath(); x.arc(256, 180, 46, 0, Math.PI * 2); x.stroke();
  const dots = [[60, 180], [130, 80], [130, 150], [130, 210], [130, 280], [200, 120], [200, 240], [230, 180], [300, 100], [310, 260], [370, 180]];
  dots.forEach(([a, b]) => { x.fillStyle = '#c23b28'; x.beginPath(); x.arc(a, b, 11, 0, Math.PI * 2); x.fill(); });
  x.strokeStyle = '#1f2a44'; x.lineWidth = 3; x.setLineDash([10, 8]); x.beginPath(); x.moveTo(230, 180); x.quadraticCurveTo(320, 120, 420, 170); x.stroke(); x.setLineDash([]);
  x.fillStyle = '#1f2a44'; x.font = '700 26px Caveat, cursive'; x.fillText('final · 4-3-3', 300, 330);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.84), new THREE.MeshStandardMaterial({ map: canvasTex(c), roughness: 0.4 })); face.position.y = 1.35; g.add(face);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.9, 0.03), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.6, roughness: 0.3 })); frame.position.set(0, 1.35, -0.02); g.add(frame);
  [-0.5, 0.5].forEach((lx) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.8), CHROME()); l.position.set(lx, 0.9, -0.05); l.rotation.x = lx > 0 ? 0.08 : 0.08; g.add(l); });
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
const tactics = board(); tactics.position.set(9.9, 0, 1.3); tactics.rotation.y = -0.85; tactics.scale.setScalar(0.85); scene.add(tactics);

// ---------- lockers ----------
const lockers = []; let fan = loadFan();
const row = new THREE.Group(); scene.add(row);
let cupTrophy = null;
const dust = (() => {
  const g = new THREE.BufferGeometry(); const n = 90; const a = new Float32Array(n * 3); const r = rng(9);
  for (let i = 0; i < n; i++) { a[i * 3] = (r() - 0.5) * 0.45; a[i * 3 + 1] = 0.15 + r() * 1.4; a[i * 3 + 2] = (r() - 0.5) * 0.3; }
  g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffe2b0, size: 0.01, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
})();

function buildLocker(e, i) {
  const pl = e.player;
  const kind = e.kind;
  const poster = kind === 'player' ? posterFor(pl.no) : kind === 'coach' ? POSTERS[23] : null;
  const posterTex = poster ? canvasTex(posterCanvas(poster)) : null;
  const top = kind === 'cup' ? '★' : kind === 'coach' ? 'HC' : kind === 'fan' ? (fan?.number ?? '12') : pl.no;
  const bottom = kind === 'cup' ? 'The cup' : kind === 'fan' ? 'Fans' : pl.last;
  const L = makeLocker({ kind: kind === 'fan' ? 'player' : kind, plateTop: top, plateBottom: bottom, posterTex });
  L.position.x = X(i);
  Object.assign(L.userData, { idx: i, entry: e, posterObj: poster });
  if (kind === 'cup') {
    cupTrophy = makeTrophy(); cupTrophy.scale.setScalar(0.58); cupTrophy.position.set(0, 0.1, -0.03); L.add(cupTrophy);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.45, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.set(0, 0.85, 0); L.add(beam); L.add(dust); L.userData.beam = beam;
  } else {
    const hanger = makeHanger(0.4); hanger.position.set(0, 1.3, -0.06); L.add(hanger);
    const kit = kind === 'coach' ? 'coach' : kind === 'fan' ? 'fan' : pl.pos === 'GK' ? 'gk' : 'home';
    const name = kind === 'fan' ? (fan?.name || 'YOU') : kind === 'coach' ? 'HARTONO' : pl.last;
    const num = kind === 'fan' ? (fan?.number ?? '12') : kind === 'coach' ? '' : pl.no;
    const shirt = makeShirt({ name, number: num, kit, w: 0.48, h: 0.53, drape: 0.6 });
    shirt.position.set(0, 1.08, -0.06); L.add(shirt); L.userData.shirt = shirt;
    if (kind === 'fan' && !fan) shirt.visible = false;
  }
  row.add(L); lockers.push(L);
}

// ---------- state ----------
const st = { tx: 0, x: 0, focus: CUP, open: -1, mode: 'walk', view: 'wide', light: 0, lightT: 0, t: 0, hover: -1, trophySpin: 0, trophyVel: 0 };
const camPos = new THREE.Vector3(0, 1.6, 5), camLook = new THREE.Vector3(0, 1.1, 0);

function desired() {
  const far = narrow() ? 1.75 : 1, farW = narrow() ? 1.2 : 1;
  if (st.mode === 'close' && st.open >= 0) {
    const lx = X(st.open);
    return lockers[st.open].userData.kind === 'cup'
      ? { pos: [lx, 1.05, 1.5 * far], look: [lx, 0.85, 0], fov: 40 }
      : { pos: [lx + 0.22, 1.2, 1.38 * far], look: [lx - 0.1, 1.1, -0.05], fov: 44 };
  }
  const x = st.x;
  if (st.view === 'front') return { pos: [x, 1.2, 3.0 * far], look: [x, 1.05, 0], fov: 46 };
  if (st.view === 'angle') return { pos: [x - 2.3, 1.5, 3.3 * far], look: [x + 0.35, 1.0, 0], fov: 50 };
  return { pos: [x, 1.45, 9.4 * farW], look: [x, 0.5, 0], fov: 50 };
}

function setView(v) {
  st.view = v; $$('[data-v]').forEach((b) => b.classList.toggle('on', b.dataset.v === v)); sound.click();
  if (st.mode === 'close') st.mode = 'open';
}
function walkTo(i) {
  i = clamp(i, 0, order.length - 1);
  if (i !== st.open) closeLocker(true);
  st.tx = X(i); setFocus(i);
}
function setFocus(i) {
  if (i === st.focus && $('#label h2 span').textContent) return;
  st.focus = i; renderStrip(); renderLabel(); sound.tick();
}
function openLocker(i) {
  const e = order[i];
  if (e.kind === 'fan' && !fan) { walkTo(i); openGame('shirt', { onFan: applyFan }); return; }
  if (st.open >= 0 && st.open !== i) lockers[st.open].userData.target = 0;
  st.open = i; st.mode = 'open'; lockers[i].userData.target = 1; walkTo(i); st.open = i;
  sound.door(); if (e.kind === 'cup') setTimeout(() => sound.chime(), 450);
  renderHint();
}
function closeLocker(silent) {
  if (st.open < 0) return;
  lockers[st.open].userData.target = 0; st.open = -1; st.mode = 'walk';
  if (!silent) sound.shut(); renderHint();
}

// ---------- strip + label + hint ----------
const track = $('.st-track');
order.forEach((e, i) => {
  const icon = e.kind === 'cup' ? '<span class="ms">trophy</span>' : e.kind === 'coach' ? '<span class="ms">sports</span>' : e.kind === 'fan' ? '<span class="ms">apparel</span>' : e.player.no;
  const label = e.kind === 'cup' ? 'The cup' : e.kind === 'coach' ? `${e.player.name} · Head coach` : e.kind === 'fan' ? 'Your locker' : `${e.player.no} ${e.player.name}`;
  const b = h(`<button type="button" class="${e.kind}" aria-label="${label}">${icon}</button>`);
  b.onclick = () => walkTo(i); track.append(b);
});
$('.st-prev').onclick = () => walkTo(st.focus - 1);
$('.st-next').onclick = () => walkTo(st.focus + 1);
function renderStrip() {
  $$('button', track).forEach((b, i) => b.classList.toggle('on', i === st.focus));
  track.style.transform = `translateX(${-(st.focus * 38 + 19)}px)`;
}
function renderLabel() {
  const e = order[st.focus]; const b = $('#label h2 b'), s = $('#label h2 span'), k = $('#label p');
  if (e.kind === 'player') { b.textContent = e.player.no; s.textContent = e.player.name; k.textContent = `${POS[e.player.pos].long} · ${e.player.club}`; }
  else if (e.kind === 'coach') { b.textContent = ''; s.textContent = e.player.name; k.textContent = 'Head coach'; }
  else if (e.kind === 'cup') { b.textContent = ''; s.textContent = BRAND.cup; k.textContent = 'The winners’ trophy'; }
  else { b.textContent = fan ? fan.number : ''; s.textContent = fan ? fan.name : 'Your locker'; k.textContent = fan ? 'Your shirt · in the champions’ room' : 'Make a shirt and hang it here'; }
}
function renderHint() {
  const e = st.open >= 0 ? order[st.open] : null;
  const m = st.mode === 'walk' ? 'Drag to walk along the lockers · tap a door to open it'
    : st.mode === 'open' ? 'Tap inside to look closer · tap anywhere else to close it'
      : e?.kind === 'cup' ? 'Drag to turn the trophy · tap outside to close' : 'Tap the poster on the door · tap outside to close';
  $('.room-hint').textContent = m;
}

// ---------- day / night ----------
function setLight(m) {
  st.lightT = m === 'night' ? 1 : 0; chrome.setLight(m);
  $('#ambBtn .ms').textContent = m === 'night' ? 'dark_mode' : 'light_mode'; sound.click();
}
$('#ambBtn').onclick = () => setLight(st.lightT ? 'day' : 'night');

// ---------- your shirt ----------
function applyFan(f) {
  fan = f; const i = order.length - 1; const L = lockers[i];
  if (L?.userData.shirt) { setShirt(L.userData.shirt, f.name, f.number, 'fan'); L.userData.shirt.visible = true; }
  $('#fanChip').hidden = false; renderLabel();
  walkTo(i); setTimeout(() => openLocker(i), 700);
}
$('[data-go-fan]').onclick = () => { walkTo(order.length - 1); setTimeout(() => openLocker(order.length - 1), 600); };

// ---------- pointer ----------
const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
let down = null;
function hitLocker(e) {
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(lockers, true)[0];
  if (!hit) return null;
  let o = hit.object; while (o && o.userData.idx === undefined) o = o.parent;
  return o ? { idx: o.userData.idx, obj: hit.object } : null;
}
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, sx: e.clientX, moved: 0 }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  if (!down) {
    if (isTouch) return;
    const hl = hitLocker(e); const hv = hl ? hl.idx : -1;
    if (hv !== st.hover) { st.hover = hv; if (hv >= 0 && hv !== st.open) sound.hover(); }
    canvas.style.cursor = hl ? 'pointer' : 'grab';
    return;
  }
  const dx = e.clientX - down.x; down.x = e.clientX; down.moved += Math.abs(dx);
  if (st.mode === 'close' && order[st.open]?.kind === 'cup') { st.trophyVel = dx * 0.012; st.trophySpin += dx * 0.012; return; }
  if (st.mode === 'close') return;
  if (down.moved > 6) {
    if (st.open >= 0) closeLocker();
    const k = (st.view === 'wide' ? 0.0065 : 0.0045) * (narrow() ? 1.4 : 1) * (1000 / innerWidth);
    st.tx = clamp(st.tx - dx * k, X(0), X(order.length - 1));
    const f = clamp(Math.round(st.tx / S + CUP), 0, order.length - 1); if (f !== st.focus) setFocus(f);
    canvas.style.cursor = 'grabbing';
  }
});
canvas.addEventListener('pointerup', (e) => {
  if (!down) return; const moved = down.moved; down = null; canvas.style.cursor = '';
  if (moved > 6) { if (st.mode === 'walk') st.tx = X(st.focus); return; }
  const hl = hitLocker(e);
  if (!hl) { closeLocker(); return; }
  const L = lockers[hl.idx];
  if (hl.idx !== st.open) { openLocker(hl.idx); return; }
  if (st.mode === 'open') { st.mode = 'close'; renderHint(); sound.whoosh(); return; }
  if (st.mode === 'close' && L.userData.posterObj && (hl.obj === L.userData.poster || hl.obj === L.userData.door)) detail.open(L.userData.posterObj.id);
});
canvas.addEventListener('wheel', (e) => {
  if (st.mode === 'close') return; if (st.open >= 0) closeLocker(true);
  st.tx = clamp(st.tx + (e.deltaX + e.deltaY) * 0.004, X(0), X(order.length - 1));
  const f = clamp(Math.round(st.tx / S + CUP), 0, order.length - 1); if (f !== st.focus) setFocus(f);
  clearTimeout(st.wt); st.wt = setTimeout(() => (st.tx = X(st.focus)), 220);
}, { passive: true });
$('.look-btn').onclick = () => { st.mode = 'close'; renderHint(); sound.whoosh(); };
addEventListener('keydown', (e) => {
  if (detail.isOpen || document.querySelector('.modal.open, .game.open')) return;
  if (e.key === 'ArrowRight') walkTo(st.focus + 1);
  if (e.key === 'ArrowLeft') walkTo(st.focus - 1);
  if (e.key === 'Enter') st.open === st.focus ? (st.mode = 'close', renderHint()) : openLocker(st.focus);
  if (e.key === 'Escape') closeLocker();
});

// ---------- next-door card ----------
async function drawCard() {
  await fontsReady();
  const c = $('#xlink canvas'); const x = c.getContext('2d');
  x.fillStyle = '#20160f'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#5a4030'; x.fillRect(0, 26, c.width, 4);
  [9, 4, 10, 7, 23].forEach((n, i) => x.drawImage(jerseyIcon(n, 'home', 30), 6 + i * 44, 30, 60, 66));
}

// ---------- tour ----------
const lockerRect = () => {
  const L = lockers[st.focus]; if (!L) return null;
  const a = new THREE.Vector3(X(st.focus) - LOCKER.w / 2, LOCKER.h, 0.25).project(camera), b = new THREE.Vector3(X(st.focus) + LOCKER.w / 2, 0, 0.25).project(camera);
  const r = { left: (a.x + 1) / 2 * innerWidth, top: (1 - a.y) / 2 * innerHeight, right: (b.x + 1) / 2 * innerWidth, bottom: (1 - b.y) / 2 * innerHeight };
  return { getBoundingClientRect: () => ({ left: r.left, top: r.top, width: r.right - r.left, height: r.bottom - r.top }) };
};
const tour = makeTour('loker.tour.lockers', [
  { el: '#strip', title: 'Walk the row', body: 'Drag across the room, or pick a number to walk straight to that locker.' },
  { el: lockerRect, title: 'Open a door', body: 'Tap a locker to open it. Tap inside to get closer, then tap the poster on the door.' },
  { el: '.views', title: 'Three cameras', body: 'Front, Wide or Angle: pick how you see the room.' },
  { el: '.brand', title: 'Start over', body: 'Tap the title any time to see the whole room again.' },
  { el: '#ambBtn', title: 'Day or night', body: 'Let the afternoon sun in, or switch the lamps on.' },
  { el: '.dock .snd', title: 'Sound', body: 'Room tone, a far-off crowd and the clank of the doors. On or off.' },
  { el: '.mn-btn', title: 'Menu', body: 'The other pages, the mini-games, your own shirt, and this tour again.' },
]);

// ---------- loader ----------
const loader = makeLoader({
  count: order.length - 1,
  numbers: order.slice(0, -1).map((e) => (e.kind === 'cup' ? '★' : e.kind === 'coach' ? 'C' : e.player.no)),
  statuses: ['Unlocking the doors', 'Ironing the shirts', 'Hanging the posters', 'Polishing the trophy', 'Switching the lights on'],
  gate: `<h2>Welcome to the champions’ room.</h2>
    <p class="k">A tribute from <span class="gold">${BRAND.name}</span> &amp; <span class="gold">24 artists</span></p>
    <div class="row"><button class="pill gold-pill" data-in="1"><span class="ms">volume_up</span>Enter with sound</button><button class="pill" data-in="0"><span class="ms">volume_off</span>Muted</button></div>
    <p class="k" style="font-size:9.5px;color:var(--dim)">Best with headphones</p>`,
});

async function load() {
  await loader.build(jerseyIcon);
  for (let i = 0; i < order.length; i++) {
    buildLocker(order[i], i);
    loader.progress((i + 1) / order.length);
    if (i % 3 === 2) await yieldToBrowser();
  }
  drawCard(); renderStrip(); renderLabel(); renderHint();
  if (fan) $('#fanChip').hidden = false;
  renderer.compile(scene, camera);
  loader.ready();
  $$('[data-in]', loader.el).forEach((b) => (b.onclick = () => {
    sound.set(b.dataset.in === '1'); loader.hide();
    setTimeout(() => tour.start(), 900);
  }));
}

// ---------- loop ----------
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
const look = $('#look'); const tmp = new THREE.Vector3();
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; st.t += dt;
  st.x += (st.tx - st.x) * Math.min(1, dt * 4);
  const d = desired();
  const k = Math.min(1, dt * 3.2);
  camPos.lerp(tmp.set(...d.pos), k); camLook.lerp(tmp.set(...d.look), k);
  camera.position.copy(camPos); camera.lookAt(camLook);
  if (Math.abs(camera.fov - d.fov) > 0.01) { camera.fov += (d.fov - camera.fov) * k; camera.updateProjectionMatrix(); }

  // doors
  lockers.forEach((L, i) => {
    const u = L.userData; const want = u.target || (i === st.hover && st.open < 0 && !isTouch ? 0.05 : 0);
    u.open += (want - u.open) * Math.min(1, dt * (want > u.open ? 3.6 : 5));
    u.hinge.rotation.y = -u.open * 1.95;
    if (u.strip) u.strip.visible = u.open > 0.2;
    if (u.beam) { u.beam.material.opacity = u.open * 0.15; dust.material.opacity = u.open * 0.8; }
  });
  if (st.open >= 0) { inner.position.set(X(st.open), 1.5, 0.25); inner.intensity = lockers[st.open].userData.open * 2.2; } else inner.intensity *= 0.9;
  dust.rotation.y += dt * 0.12;
  if (cupTrophy) { st.trophyVel *= 0.95; cupTrophy.rotation.y = st.t * 0.3 + st.trophySpin; }

  // light mode
  st.light += (st.lightT - st.light) * Math.min(1, dt * 2.5);
  const n = st.light;
  sun.intensity = lerp(2.1, 0, n); hemi.intensity = lerp(0.42, 0.18, n);
  hemi.color.setRGB(lerp(1, 0.55, n), lerp(0.89, 0.62, n), lerp(0.75, 0.78, n));
  lamps.forEach((l) => (l.intensity = lerp(0, 16, n))); fixMat.emissiveIntensity = lerp(0, 2.2, n);
  shaftMat.opacity = lerp(0.2, 0, n); winMat.color.setRGB(lerp(0.85, 0.08, n), lerp(0.62, 0.1, n), lerp(0.4, 0.18, n));
  renderer.toneMappingExposure = lerp(1.0, 0.95, n);

  // look-closer chip
  const showLook = st.mode === 'open' && st.open >= 0 && lockers[st.open].userData.open > 0.85;
  look.classList.toggle('on', showLook);
  if (showLook) {
    tmp.set(X(st.open) + 0.05, 1.15, 0.1).project(camera);
    look.style.transform = `translate(${(tmp.x + 1) / 2 * innerWidth - 6}px, ${(1 - tmp.y) / 2 * innerHeight - 17}px)`;
  }
  $('#label').style.opacity = st.mode === 'close' ? 0 : 1;
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
load();
