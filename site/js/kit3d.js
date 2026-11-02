// Shared three.js building blocks: renderer, trophy, shirts, lockers, textures.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SHIRT, makeJersey, makeDoorTex, makePlateTex } from './art.js';

export { THREE };

export function makeRenderer(canvas, { alpha = false, shadows = false } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  r.setSize(innerWidth, innerHeight, false);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.0;
  if (shadows) { r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; }
  return r;
}

export function envMap(renderer) {
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();
  return tex;
}

export function canvasTex(c, { repeat, srgb = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

export const GOLD = () => new THREE.MeshStandardMaterial({ color: 0xe0b45a, metalness: 1, roughness: 0.22 });
export const CHROME = () => new THREE.MeshStandardMaterial({ color: 0xdedad2, metalness: 1, roughness: 0.12 });

// ---------- the trophy (original design: winged stand holding an orb, on a black plinth) ----------
export function makeTrophy() {
  const g = new THREE.Group();
  const gold = GOLD(), chrome = CHROME();
  const black = new THREE.MeshStandardMaterial({ color: 0x0c0b0a, metalness: 0.4, roughness: 0.25 });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.34, 64), black); plinth.position.y = 0.17; g.add(plinth);
  [0.04, 0.3].forEach((y) => { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.44 + (y < 0.1 ? 0.03 : 0), 0.012, 12, 96), gold); ring.rotation.x = Math.PI / 2; ring.position.y = y; g.add(ring); });

  // stem: lathe profile
  const pts = [[0, 0], [0.3, 0], [0.3, 0.04], [0.16, 0.1], [0.1, 0.3], [0.075, 0.6], [0.11, 0.78], [0.16, 0.86], [0, 0.88]].map(([x, y]) => new THREE.Vector2(x, y));
  const stem = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), gold); stem.position.y = 0.34; g.add(stem);

  // wings: an extruded feathered curve, mirrored
  const w = new THREE.Shape();
  w.moveTo(0, 0); w.bezierCurveTo(0.18, 0.05, 0.42, 0.3, 0.44, 0.78);
  for (let i = 0; i < 4; i++) { const y = 0.78 - i * 0.16; w.lineTo(0.36 - i * 0.05, y - 0.06); w.lineTo(0.4 - i * 0.07, y - 0.14); }
  w.bezierCurveTo(0.2, 0.18, 0.1, 0.1, 0, 0.06); w.closePath();
  const wg = new THREE.ExtrudeGeometry(w, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 3, curveSegments: 24 });
  wg.translate(0, 0, -0.0175);
  [1, -1].forEach((s) => { const m = new THREE.Mesh(wg, gold); m.scale.x = s; m.position.set(0, 1.02, 0); m.rotation.y = s * 0.35; g.add(m); });

  // the orb with a gold equator and panel lines
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.34, 96, 64), chrome); orb.position.y = 1.58; g.add(orb);
  const eq = new THREE.Mesh(new THREE.TorusGeometry(0.345, 0.014, 12, 128), gold); eq.position.y = 1.58; eq.rotation.x = Math.PI / 2 + 0.25; g.add(eq);
  const mer = new THREE.Mesh(new THREE.TorusGeometry(0.343, 0.006, 8, 128), gold); mer.position.y = 1.58; mer.rotation.y = 0.6; g.add(mer);
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), gold); star.position.y = 1.97; star.scale.y = 1.6; g.add(star);
  g.userData.orb = orb;
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  return g;
}

// ---------- shirts ----------
// A real garment, not a cut-out: the outline is inflated into a puffy front and back
// that meet at a sealed seam, sleeves droop like a shirt on a hanger, and the cloth
// carries vertical folds. The kit artwork is mapped on and alphaTest trims the outline.
const shirtGeoCache = new Map();
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay; const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}
function inside(px, py) {
  let c = false;
  for (let i = 0, j = SHIRT.length - 1; i < SHIRT.length; j = i++) {
    const [xi, yi] = SHIRT[i], [xj, yj] = SHIRT[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function edgeDist(px, py) {
  let d = Infinity;
  for (let i = 0, j = SHIRT.length - 1; i < SHIRT.length; j = i++) d = Math.min(d, segDist(px, py, SHIRT[j][0], SHIRT[j][1], SHIRT[i][0], SHIRT[i][1]));
  return inside(px, py) ? d : 0;
}
export function shirtGeometry(w = 1, h = 1.1, drape = 1, side = 'back') {
  const key = `${w}|${h}|${drape}|${side}`;
  if (shirtGeoCache.has(key)) return shirtGeoCache.get(key);
  const NX = 64, NY = 72, sgn = side === 'back' ? 1 : -1;
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= NY; j++) {
    for (let i = 0; i <= NX; i++) {
      const u = i / NX, t = j / NY; // t: 0 top .. 1 bottom (texture space)
      const d = edgeDist(u, t);
      const q = Math.min(d / 0.13, 1), puff = q * q * (3 - 2 * q); // thin seam at the edge, full body inside
      const xn = u - 0.5, sleeve = Math.max(0, Math.abs(xn) - 0.27);
      const chest = Math.exp(-Math.pow((t - 0.42) / 0.38, 2)); // fuller at the chest than the hem
      let z = sgn * puff * (0.04 + 0.04 * chest) * w * (0.6 + 0.4 * drape);
      // folds move both faces together, so they read as cloth rather than thickness
      const fold = (Math.sin(xn * 24 + 1.3) * 0.6 + Math.sin(xn * 41 + 0.4) * 0.4) * Math.pow(t, 1.6) * 0.022 * w * drape
        + Math.sin(t * 10 + xn * 6) * sleeve * 0.06 * w * drape - xn * xn * 0.05 * w;
      z += fold;
      const y = (0.5 - t) * h - sleeve * sleeve * 2.2 * h * drape; // sleeves hang down
      const x = xn * w * (1 - sleeve * 0.35 * drape);
      pos.push(x, y, z);
      uv.push(side === 'back' ? u : 1 - u, 1 - t);
    }
  }
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, e = c + 1;
    side === 'back' ? idx.push(a, c, b, b, c, e) : idx.push(a, b, c, b, e, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  shirtGeoCache.set(key, geo);
  return geo;
}

const jerseyTexCache = new Map();
export function jerseyTextures(name, number, kit) {
  const key = `${name}|${number}|${kit}`;
  if (!jerseyTexCache.has(key)) {
    jerseyTexCache.set(key, {
      back: canvasTex(makeJersey({ name, number, kit, side: 'back' })),
      front: canvasTex(makeJersey({ name, number, kit, side: 'front' })),
    });
  }
  return jerseyTexCache.get(key);
}

export function makeShirt({ name, number, kit = 'home', w = 1, h = 1.1, drape = 1 }) {
  const g = new THREE.Group();
  const tex = jerseyTextures(name, number, kit);
  const mat = (map) => new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, roughness: 0.82, metalness: 0, side: THREE.FrontSide, envMapIntensity: 0.6 });
  // the back (name + number) faces +z, the front (crest) faces -z; the two meet at the seam
  const back = new THREE.Mesh(shirtGeometry(w, h, drape, 'back'), mat(tex.back));
  const front = new THREE.Mesh(shirtGeometry(w, h, drape, 'front'), mat(tex.front));
  back.castShadow = front.castShadow = true; back.receiveShadow = front.receiveShadow = true;
  g.add(back, front);
  g.userData = { back, front, name, number, kit };
  return g;
}

export function setShirt(shirt, name, number, kit = 'home') {
  const t = jerseyTextures(name, number, kit);
  shirt.userData.back.material.map = t.back; shirt.userData.front.material.map = t.front;
  shirt.userData.back.material.needsUpdate = shirt.userData.front.material.needsUpdate = true;
  Object.assign(shirt.userData, { name, number, kit });
}

export function makeHanger(width = 0.9) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x2b2420, metalness: 0.3, roughness: 0.45 });
  const metal = CHROME();
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-width / 2, 0, 0), new THREE.Vector3(-width / 4, 0.1, 0), new THREE.Vector3(0, 0.15, 0), new THREE.Vector3(width / 4, 0.1, 0), new THREE.Vector3(width / 2, 0, 0)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.018, 8), mat));
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 8, 24, Math.PI * 1.4), metal); hook.position.set(0, 0.22, 0); hook.rotation.z = -Math.PI * 0.2; g.add(hook);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.06), metal); neck.position.y = 0.17; g.add(neck);
  return g;
}

// ---------- lockers ----------
let doorTex, doorMat, bodyMat, innerMat, ventTex;
function lockerMats() {
  if (doorMat) return;
  doorTex = canvasTex(makeDoorTex());
  doorMat = new THREE.MeshStandardMaterial({ map: doorTex, roughness: 0.55, metalness: 0.35 });
  bodyMat = new THREE.MeshStandardMaterial({ color: 0x8e3520, roughness: 0.6, metalness: 0.3 });
  innerMat = new THREE.MeshStandardMaterial({ color: 0x1a110c, roughness: 0.9, metalness: 0.1 });
}

export const LOCKER = { w: 0.6, h: 2.0, d: 0.5, gap: 0.02 };

// kind: 'player' | 'coach' | 'cup' | 'fan'
export function makeLocker({ kind = 'player', plateTop = '', plateBottom = '', posterTex = null } = {}) {
  lockerMats();
  const { w, h, d } = LOCKER; const t = 0.025;
  const g = new THREE.Group();
  const box = (bw, bh, bd, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  const shell = kind === 'cup' ? new THREE.MeshStandardMaterial({ color: 0x1b1714, roughness: 0.35, metalness: 0.7 }) : bodyMat;
  box(w, h, t, innerMat, 0, h / 2, -d / 2 + t / 2); // back
  box(t, h, d, shell, -w / 2 + t / 2, h / 2, 0); box(t, h, d, shell, w / 2 - t / 2, h / 2, 0); // sides
  box(w, t, d, shell, 0, h - t / 2, 0); box(w, 0.1, d, shell, 0, 0.05, 0); // top, plinth
  box(w - 2 * t, 0.02, d - t, innerMat, 0, h - 0.42, 0); // shelf
  // inside light strip
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, 0.02), new THREE.MeshBasicMaterial({ color: 0xffd9a0 }));
  strip.position.set(0, h - 0.445, 0.05); strip.rotation.x = Math.PI / 2; strip.visible = false; g.add(strip);

  // door on a hinge (left edge)
  const hinge = new THREE.Group(); hinge.position.set(-w / 2, 0, d / 2); g.add(hinge);
  // the cup's door is smoked glass so the trophy shows through when shut
  const dmat = kind === 'cup' ? new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.08, metalness: 0.6, transparent: true, opacity: 0.32, depthWrite: false }) : doorMat;
  const door = new THREE.Mesh(new THREE.BoxGeometry(w - 0.01, h - 0.02, 0.022), [dmat, dmat, dmat, dmat, dmat, new THREE.MeshStandardMaterial({ color: 0x6c2a18, roughness: 0.7, metalness: 0.2 })]);
  door.position.set(w / 2, h / 2, 0.011); door.castShadow = true; hinge.add(door);
  if (kind === 'cup') {
    const gold = GOLD();
    // gold frame round the glass
    [[w - 0.04, 0.03, w / 2, 0.03], [w - 0.04, 0.03, w / 2, h - 0.04], [0.03, h - 0.06, 0.03, h / 2], [0.03, h - 0.06, w - 0.03, h / 2]].forEach(([bw, bh, x, y]) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.03), gold); b.position.set(x, y, 0.012); hinge.add(b);
    });
    const glow = new THREE.PointLight(0xffc888, 1.4, 1.8, 1.6); glow.position.set(0, h - 0.5, 0.05); g.add(glow);
  }
  // number plate
  if (plateTop !== '') {
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.096), new THREE.MeshStandardMaterial({ map: canvasTex(makePlateTex(plateTop, plateBottom)), roughness: 0.5 }));
    pm.position.set(w / 2, h - 0.2, 0.024); hinge.add(pm);
  }
  // poster on the inside of the door
  let poster = null;
  if (posterTex) {
    poster = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.72, w * 0.72 * 1.406), new THREE.MeshStandardMaterial({ map: posterTex, roughness: 0.6 }));
    poster.position.set(w / 2, h * 0.52, -0.002); poster.rotation.y = Math.PI; hinge.add(poster);
  }
  g.userData = { kind, hinge, door, poster, strip, open: 0, target: 0 };
  door.userData.locker = g; if (poster) poster.userData.locker = g;
  return g;
}
