// The Rail: all 23 shirts on one rail, grouped by position. Filter, slide, take one down.
import { THREE, makeRenderer, envMap, canvasTex, makeShirt, makeHanger, CHROME } from './kit3d.js';
import { SQUAD, POS, RUN, BRAND } from './data.js';
import { fontsReady, jerseyIcon, makeSlatsTex, makeFloorTex } from './art.js';
import { $, $$, h, clamp, lerp, isTouch, mountChrome, makeTour, makeLoader, goTo, yieldToBrowser } from './ui.js';
import { sound } from './sound.js';

const GROUPS = ['GK', 'DEF', 'MID', 'FWD'];
const squad = GROUPS.flatMap((g) => SQUAD.filter((p) => p.pos === g).sort((a, b) => a.no - b.no));
const count = (g) => SQUAD.filter((p) => p.pos === g).length;
const narrow = () => innerWidth / innerHeight < 0.9;

const filters = `<div class="seg filt" role="group" aria-label="Filter"><button data-f="ALL" class="on">All<sup>${SQUAD.length}</sup></button>${GROUPS.map((g) => `<button data-f="${g}">${g}<sup>${count(g)}</sup></button>`).join('')}</div>
  <button class="round rst" type="button" aria-label="Reset the rail"><span class="ms">restart_alt</span></button>`;
mountChrome({ page: 'rail', right: filters, tour: () => tour.start(true) });
$('#xlink').addEventListener('click', (e) => { e.preventDefault(); goTo('lockers.html', 'The lockers'); });

// ---------- three ----------
const canvas = $('#gl');
const renderer = makeRenderer(canvas, { shadows: true });
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0605);
scene.fog = new THREE.Fog(0x0a0605, 6, 14);
scene.environment = envMap(renderer); scene.environmentIntensity = 0.3;
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.05, 50);

renderer.toneMappingExposure = 0.82;
scene.add(new THREE.HemisphereLight(0xffe6cc, 0x120a06, 0.22));
const keyL = new THREE.SpotLight(0xffeedc, 30, 12, 0.85, 0.8, 1.3); keyL.position.set(0, 3.9, 3.2); keyL.target.position.set(0, 1.7, 0); keyL.castShadow = true; keyL.shadow.mapSize.set(1024, 1024); keyL.shadow.bias = -0.0004;
scene.add(keyL, keyL.target);
[-3.4, 3.4].forEach((x) => { const s = new THREE.SpotLight(0xffd6ac, 14, 10, 0.8, 0.9, 1.4); s.position.set(x, 3.6, 2.6); s.target.position.set(x, 1.6, 0); scene.add(s, s.target); });
const front = new THREE.DirectionalLight(0xfff2e4, 0.3); front.position.set(0, 1.6, 6); scene.add(front);
// warm LED line under the top shelf washes down over the shirts
const ledL = new THREE.PointLight(0xffb870, 1.6, 5, 1.6); ledL.position.set(0, 2.55, 0.9); scene.add(ledL);

// dark timber cabinets behind the rail
const wood = (base, rep) => new THREE.MeshStandardMaterial({ map: canvasTex(makeSlatsTex(512, 512, base), { repeat: rep }), roughness: 0.62, metalness: 0.05 });
const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 6), wood('#1d120b', [22, 2])); wall.position.set(0, 2.5, -0.75); wall.receiveShadow = true; scene.add(wall);
const dark = new THREE.MeshStandardMaterial({ color: 0x120b07, roughness: 0.55, metalness: 0.1 });
for (let x = -14.45; x <= 14; x += 1.7) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.2, 0.22), dark); post.position.set(x, 1.6, -0.64); post.receiveShadow = true; scene.add(post); }
const shelf = new THREE.Mesh(new THREE.BoxGeometry(30, 1.4, 1.1), new THREE.MeshStandardMaterial({ color: 0x0c0705, roughness: 0.9 })); shelf.position.set(0, 3.61, -0.2); scene.add(shelf);
const strip = new THREE.Mesh(new THREE.BoxGeometry(30, 0.018, 0.018), new THREE.MeshBasicMaterial({ color: 0xffd09a })); strip.position.set(0, 2.9, 0.33); scene.add(strip);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), new THREE.MeshStandardMaterial({ map: canvasTex(makeFloorTex(), { repeat: [8, 3] }), color: 0x4a3a30, roughness: 0.3, metalness: 0.2 }));
floor.rotation.x = -Math.PI / 2; floor.position.z = 4; floor.receiveShadow = true; scene.add(floor);
const bench = new THREE.Mesh(new THREE.BoxGeometry(30, 0.1, 0.6), new THREE.MeshStandardMaterial({ color: 0x24140d, roughness: 0.4, metalness: 0.05 })); bench.position.set(0, 0.5, 0.1); bench.castShadow = bench.receiveShadow = true; scene.add(bench);
const benchBase = new THREE.Mesh(new THREE.BoxGeometry(30, 0.45, 0.5), dark); benchBase.position.set(0, 0.225, 0); scene.add(benchBase);
const RAIL_Y = 2.45;
const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 30, 16), CHROME()); rail.rotation.z = Math.PI / 2; rail.position.set(0, RAIL_Y, 0); scene.add(rail);
for (let x = -13.6; x <= 14; x += 3.4) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.62), CHROME()); b.position.set(x, RAIL_Y + 0.22, -0.24); b.rotation.x = 1.1; scene.add(b); }

// ---------- shirts ----------
// shirts hang almost side-on like a real clothes rail; hovering turns one towards you
const SW = 1.0, SH = 1.1, STEP = 0.135, GAP = 0.17, REST = -1.3;
const shirts = [];
function buildShirt(p, i) {
  const pivot = new THREE.Group();
  const hanger = makeHanger(0.78); hanger.position.y = -0.24; pivot.add(hanger);
  const shirt = makeShirt({ name: p.last, number: p.no, kit: p.pos === 'GK' ? 'gk' : 'home', w: SW, h: SH, drape: 0.9 });
  shirt.position.y = -0.24 - SH / 2 + 0.07; pivot.add(shirt);
  pivot.traverse((o) => { if (o.isMesh) o.userData.shirtIdx = i; });
  pivot.userData = { p, i, x: 0, tx: 0, y: RAIL_Y, ty: RAIL_Y, lift: 0, ry: REST, sway: 0, swayV: 0, spin: 0, hidden: false };
  pivot.position.set(0, RAIL_Y, 0);
  scene.add(pivot); shirts.push(pivot);
}

// ---------- state ----------
const st = { filter: 'ALL', off: 0, offT: 0, vel: 0, hover: -1, taken: -1, t: 0, spinV: 0, width: 0 };
let groupX = {};
function layoutRail() {
  const vis = shirts.filter((s) => st.filter === 'ALL' || s.userData.p.pos === st.filter);
  let x = 0, prev = null; groupX = {};
  vis.forEach((s) => {
    const g = s.userData.p.pos; if (prev && g !== prev) x += GAP; prev = g;
    s.userData.tx = x; (groupX[g] ||= []).push(x); x += STEP;
  });
  const width = x - STEP; vis.forEach((s) => (s.userData.tx -= width / 2));
  Object.keys(groupX).forEach((g) => (groupX[g] = groupX[g].map((v) => v - width / 2)));
  shirts.forEach((s) => { s.userData.hidden = !vis.includes(s); });
  st.width = width; st.offT = 0;
  renderGroups();
}

// group labels
const groupsEl = $('#groups');
GROUPS.forEach((g) => groupsEl.append(h(`<span data-g="${g}">${POS[g].group} <b>${count(g)}</b></span>`)));
function renderGroups() { $$('span', groupsEl).forEach((s) => (s.style.opacity = groupX[s.dataset.g] && st.taken < 0 ? 1 : 0)); }
const v3 = new THREE.Vector3();
function placeGroups() {
  $$('span', groupsEl).forEach((s) => {
    const xs = groupX[s.dataset.g]; if (!xs) return;
    v3.set((xs[0] + xs[xs.length - 1]) / 2 + st.off, RAIL_Y + 0.1, 0).project(camera);
    s.style.transform = `translate(${(v3.x + 1) / 2 * innerWidth}px, ${(1 - v3.y) / 2 * innerHeight}px) translate(-50%, -50%)`;
  });
}

// ---------- filters / reset ----------
function setFilter(f) {
  if (st.taken >= 0) putBack();
  st.filter = f; $$('[data-f]').forEach((b) => b.classList.toggle('on', b.dataset.f === f)); sound.whoosh(); layoutRail();
}
$$('[data-f]').forEach((b) => (b.onclick = () => setFilter(b.dataset.f)));
$('.rst').onclick = () => { setFilter('ALL'); shirts.forEach((s) => { s.userData.spin = 0; s.userData.swayV += (Math.random() - 0.5) * 0.06; }); };

// ---------- take down / sheet ----------
const HINT = isTouch ? 'Tap a shirt to take it down · drag to slide the rail' : 'Hover a shirt · drag to slide the rail · click to take it down';
$('.rail-hint').textContent = HINT;
const sheet = $('#sheet');
const age = (born) => { const d = new Date(born); return Math.floor((new Date('2026-10-18') - d) / 3.15576e10); };
function takeDown(i) {
  if (st.taken >= 0 && st.taken !== i) shirts[st.taken].userData.spin = 0;
  st.taken = i; const p = shirts[i].userData.p; shirts[i].userData.spin = 0;
  const vis = shirts.filter((s) => !s.userData.hidden); const k = vis.indexOf(shirts[i]);
  $('.ix', sheet).textContent = `${String(k + 1).padStart(2, '0')} / ${vis.length}`;
  $('.sh-pos', sheet).textContent = POS[p.pos].long; $('.sh-no', sheet).textContent = p.no;
  $('.sh-nm', sheet).innerHTML = `${p.first} <b>${p.last}</b>`;
  $('.sh-rows', sheet).innerHTML = [['Club', p.club], ['Caps', `${p.caps} · ${p.goals} goal${p.goals === 1 ? '' : 's'}`], ['Born', `${p.born} · ${age(p.born)}`], ['Birthplace', p.place], ['Height', `${p.height} cm`]]
    .map(([a, b]) => `<div><span>${a}</span><i></i><b>${b}</b></div>`).join('');
  $('.sh-ms', sheet).innerHTML = RUN.map((m, j) => {
    const mins = p.mins[j]; const note = !mins ? 'Unused substitute' : mins >= 90 ? (mins > 90 ? 'Played 120 minutes' : 'Full match') : j && p.mins[j] < 46 ? `Came on · ${mins}’` : `Played ${mins}’`;
    return `<div class="sh-m"><p>vs <b>${m.vs} ${m.score.split(' ')[0]}</b><br>${m.date}</p><div class="bar"><i data-w="${(mins / 120) * 100}"></i></div><small>${note}</small></div>`;
  }).join('');
  requestAnimationFrame(() => $$('.sh-m .bar i', sheet).forEach((b) => (b.style.width = b.dataset.w + '%')));
  sheet.classList.add('open'); sheet.removeAttribute('aria-hidden'); document.body.classList.add('taken');
  $('.rail-hint').textContent = 'Drag the shirt to turn it · tap outside to put it back';
  renderGroups(); sound.whoosh();
}
function putBack() {
  if (st.taken < 0) return; shirts[st.taken].userData.spin = 0; shirts[st.taken].userData.swayV = 0.05;
  st.taken = -1; sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); document.body.classList.remove('taken');
  $('.rail-hint').textContent = HINT; renderGroups(); sound.click();
}
const step = (d) => { const vis = shirts.filter((s) => !s.userData.hidden); const k = vis.indexOf(shirts[st.taken]); takeDown(vis[(k + d + vis.length) % vis.length].userData.i); };
$('.sh-back').onclick = putBack; $('.sh-prev').onclick = () => step(-1); $('.sh-next').onclick = () => step(1);
addEventListener('keydown', (e) => {
  if (st.taken < 0) return;
  if (e.key === 'Escape') putBack(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1);
});

// ---------- pointer ----------
const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(); const tip = $('#tip');
let down = null;
function hit(e) {
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const list = shirts.filter((s) => !s.userData.hidden).flatMap((s) => [s.children[1].userData.back, s.children[1].userData.front]);
  const hh = ray.intersectObjects(list, false);
  // skip transparent cut-outs: test the texture alpha at the hit uv
  for (const x of hh) { if (alphaAt(x)) return x.object.userData.shirtIdx ?? x.object.parent.parent.userData.i; }
  return -1;
}
const alphaCache = new Map();
function alphaAt(x) {
  const img = x.object.material.map?.image; if (!img || !x.uv) return true;
  let data = alphaCache.get(img); if (!data) { const c = document.createElement('canvas'); c.width = 64; c.height = 70; c.getContext('2d').drawImage(img, 0, 0, 64, 70); data = c.getContext('2d').getImageData(0, 0, 64, 70).data; alphaCache.set(img, data); }
  const px = Math.floor(x.uv.x * 63), py = Math.floor((1 - x.uv.y) * 69); return data[(py * 64 + px) * 4 + 3] > 100;
}
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, sx: e.clientX, sy: e.clientY, moved: 0 }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  if (down) {
    const dx = e.clientX - down.x; down.x = e.clientX; down.moved += Math.abs(dx);
    if (st.taken >= 0) { st.spinV = dx * 0.012; shirts[st.taken].userData.spin += dx * 0.012; return; }
    if (down.moved > 4) { const k = viewW() / innerWidth, lim = railLimit() + 0.25; st.offT = clamp(st.offT + dx * k, -lim, lim); st.vel = dx * k; canvas.style.cursor = 'grabbing'; tip.classList.remove('on'); }
    return;
  }
  if (isTouch || st.taken >= 0) return;
  const i = hit(e);
  if (i !== st.hover) {
    if (i >= 0) { sound.hover(); shirts[i].userData.swayV += 0.02; }
    st.hover = i;
  }
  canvas.style.cursor = i >= 0 ? 'pointer' : 'grab';
  if (i >= 0) {
    const p = shirts[i].userData.p; $('b', tip).innerHTML = `<em>${p.no}</em>${p.name}`; $('small', tip).textContent = `${POS[p.pos].long} · ${p.club}`;
    tip.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; tip.classList.add('on');
  } else tip.classList.remove('on');
});
canvas.addEventListener('pointerup', (e) => {
  if (!down) return; const moved = down.moved; down = null; canvas.style.cursor = '';
  if (moved > 6) return;
  const i = hit(e);
  if (st.taken >= 0) { if (i !== st.taken) putBack(); return; }
  if (i >= 0) { tip.classList.remove('on'); takeDown(i); }
});
canvas.addEventListener('pointerleave', () => { st.hover = -1; tip.classList.remove('on'); });
// no wheel: like the original, the page wheel never slides the rail, only a drag does

// ---------- next door card ----------
async function drawCard() {
  await fontsReady(); const c = $('#xlink canvas'); const x = c.getContext('2d');
  x.fillStyle = '#20160f'; x.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 4; i++) { x.fillStyle = '#b4472b'; x.fillRect(8 + i * 54, 14, 50, 136); x.fillStyle = '#2a120b'; for (let k = 0; k < 3; k++) x.fillRect(16 + i * 54, 34 + k * 8, 34, 3); x.fillStyle = '#e9e1d2'; x.fillRect(22 + i * 54, 20, 22, 9); }
}

// ---------- tour ----------
const railRect = () => ({ getBoundingClientRect: () => ({ left: innerWidth * 0.08, top: innerHeight * 0.18, width: innerWidth * 0.84, height: innerHeight * 0.5 }) });
const tour = makeTour('loker.tour.rail', [
  { el: railRect, title: 'Browse the shirts', body: 'Point at a shirt to see whose it is, drag to slide the rail, click to take one down.' },
  { el: '.filt', title: 'Filter', body: 'Everyone, or just the keepers, defenders, midfielders or forwards.' },
  { el: '.rst', title: 'Reset', body: 'Put every shirt back on the rail.' },
  { el: '#xlink', title: 'The Lockers', body: 'Walk into the locker room next door.' },
  { el: '.dock .snd', title: 'Sound', body: 'Turn the room’s sound on or off.' },
  { el: '.mn-btn', title: 'Menu', body: 'The other pages, our socials, the sound, and this tour again.' },
]);

// ---------- loader ----------
const loader = makeLoader({
  count: squad.length, numbers: squad.map((p) => p.no),
  statuses: ['Printing the kits', 'Pressing the numbers', 'Steaming the shirts', 'Hanging them up'],
  gate: `<h2>Every shirt from the cup run.</h2>
    <p class="k">A tribute from <span class="gold">${BRAND.name}</span> &amp; <span class="gold">24 artists</span></p>
    <div class="row"><button class="pill gold-pill" data-in="1"><span class="ms">volume_up</span>Enter with sound</button><button class="pill" data-in="0"><span class="ms">volume_off</span>Muted</button></div>
    <p class="k" style="font-size:9.5px;color:var(--dim)">Best with headphones</p>`,
});
async function load() {
  await loader.build(jerseyIcon);
  for (let i = 0; i < squad.length; i++) { buildShirt(squad[i], i); loader.progress((i + 1) / squad.length); if (i % 3 === 2) await yieldToBrowser(); }
  layoutRail(); shirts.forEach((s) => (s.userData.x = s.userData.tx)); drawCard();
  renderer.compile(scene, camera); loader.ready();
  $$('[data-in]', loader.el).forEach((b) => (b.onclick = () => { sound.set(b.dataset.in === '1'); loader.hide(); setTimeout(() => tour.start(), 900); }));
}

// ---------- loop ----------
const CAM = { z: 3.6, y: 1.7 };
const viewW = () => 2 * CAM.z * Math.tan(THREE.MathUtils.degToRad(21)) * camera.aspect;
// how far the rail may slide: none when it already fits, just enough to reach both ends when it doesn't
const railLimit = () => Math.max(0, (st.width + 0.5 - viewW()) / 2);
function placeCamera() {
  const a = innerWidth / innerHeight;
  // fit the whole rail across the screen when it can, without the shirts getting oversized
  const fit = ((SQUAD.length - 1) * STEP + 3 * GAP + 0.9) / a / (2 * Math.tan(THREE.MathUtils.degToRad(21)));
  CAM.z = clamp(fit, 3.3, 4.05); CAM.y = RAIL_Y - 0.19 * CAM.z;
  camera.position.set(0, CAM.y + 0.06, CAM.z); camera.lookAt(0, CAM.y, 0); camera.aspect = a; camera.updateProjectionMatrix();
}
// where the taken-down shirt sits: left half on wide screens, top centre on narrow ones
const TAKEN_Z = 2.0;
function takenPose() {
  const d = CAM.z - TAKEN_Z, vh = 2 * d * Math.tan(THREE.MathUtils.degToRad(21)), vw = vh * camera.aspect;
  return innerWidth <= 760 ? { x: 0, y: CAM.y + vh * 0.37, s: (vh * 0.31) / (SH + 0.3) } : { x: -vw * 0.25, y: CAM.y + vh * 0.43, s: (vh * 1.02) / (SH + 0.3) };
}
placeCamera();
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight, false); placeCamera(); });
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; st.t += dt;
  if (!shirts.length) { renderer.render(scene, camera); requestAnimationFrame(frame); return; }
  if (!down) { const lim = railLimit(); st.offT += st.vel; st.vel *= 0.9; if (Math.abs(st.offT) > lim) { st.offT += (clamp(st.offT, -lim, lim) - st.offT) * Math.min(1, dt * 7); st.vel *= 0.6; } }
  const prevOff = st.off; st.off += (st.offT - st.off) * Math.min(1, dt * 8);
  const railVel = (st.off - prevOff) / Math.max(dt, 0.001);
  const tp = takenPose();
  shirts.forEach((s) => {
    const u = s.userData; const k = Math.min(1, dt * 6);
    const isTaken = st.taken === u.i; const hov = st.hover === u.i && st.taken < 0;
    // neighbours make room for the hovered shirt
    let push = 0; if (st.hover >= 0 && st.taken < 0 && !hov && !u.hidden) { const d = u.tx - shirts[st.hover].userData.tx; if (Math.abs(d) < 0.7) push = Math.sign(d) * 0.24 * (1 - Math.abs(d) / 0.7); }
    const tx = isTaken ? tp.x : u.tx + st.off + push;
    const ty = isTaken ? tp.y : u.hidden ? RAIL_Y + 3.2 : RAIL_Y + (hov ? 0.04 : 0);
    const tz = isTaken ? TAKEN_Z : (hov ? 0.1 : 0) + u.i * 0.002;
    u.x += (tx - u.x) * k; s.position.set(u.x, lerp(s.position.y, ty, k), lerp(s.position.z, tz, k));
    const tRy = isTaken ? u.spin + Math.sin(st.t * 0.8) * 0.05 : (hov ? -0.55 : REST) + Math.atan2(-u.x, CAM.z); // same hang angle from the camera across the whole rail
    s.rotation.y = lerp(s.rotation.y, tRy, isTaken ? Math.min(1, dt * 10) : k);
    s.scale.setScalar(lerp(s.scale.x, isTaken ? tp.s : 1, k));
    // sway like cloth on a hook
    u.swayV += (-u.sway * 18 - u.swayV * 3.2 - railVel * 0.06) * dt; u.sway += u.swayV * dt * 6;
    s.rotation.z = isTaken ? 0 : u.sway * 0.4;
  });
  if (st.taken >= 0) { st.spinV *= 0.94; if (!down) shirts[st.taken].userData.spin += st.spinV; }
  placeGroups();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
load();
