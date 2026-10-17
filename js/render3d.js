// Rendu HD-2D : le jeu (inchangé) est projeté dans un décor 3D vu de haut en perspective.
//  - sol et murs extrudés en 3D (textures du moteur 2D), abîme thématique en fond ;
//  - sprites = billboards (chaque objet est dessiné par les fonctions 2D existantes dans un atlas) ;
//  - éclairage : la carte de lumière du moteur 2D est projetée au sol, sur les murs et sur les sprites ;
//  - post-traitement : tilt-shift, bloom, étalonnage par thème, vignette.
// Le gameplay, les collisions et les entrées ne changent pas : la caméra est fixe, orientée nord (haut de l'écran = nord).
import * as THREE from './vendor/three.module.min.js';
import * as M from './maps.js';
import { A } from './assets.js';
import { W, H, setViewW } from './game.js';
import { collectDrawList, groundFx, buildLights, radial, setShadowSink } from './render.js';
import { drawFxs } from './fx.js';
import * as S from './hd2d_shaders.js';
import * as WD from './hd2d_world.js';
import { itemImage } from './items.js';

const { TS } = M;
let SW = 1280; const SH = 720;                       // taille logique de la scène (la page est mise à l'échelle en CSS)
export const CFG = { pitch: 40, dist: 13.5, fov: 36, look: 0.5, camPitchMin: 20, camPitchMax: 75 };   // camPitchMin / Max : bornes de l'inclinaison réglable au stick droit (degrés)
const CAM_YAW_MAX = 45;   // pivot maximal à gauche / droite (degrés) ; garder aligné sur CAM_YAW de game.js
// Tilt-shift : rayon de flou maximal (px) à 100 %. Réglage joueur 0 à 150 % (0 = désactivé, saute aussi la boucle de flou du shader).
const TILT_BASE = 4.2, OPT_KEY = 'pokesouls.options.v1';
const tiltPct = () => { try { const o = JSON.parse(localStorage.getItem(OPT_KEY) || 'null'); if (o && typeof o.tilt === 'number') return Math.max(0, Math.min(150, o.tilt)); } catch (e) { /* défaut */ } return 100; };

// ---------- lot de billboards : un atlas de cellules + une géométrie mise à jour à chaque image ----------
class Batch {
  constructor(cell, cols, rows, footY, order, shared, bias) {
    this.cell = cell; this.cols = cols; this.rows = rows; this.foot = footY; this.max = cols * rows; this.n = 0;
    this.canvas = document.createElement('canvas'); this.canvas.width = cols * cell; this.canvas.height = rows * cell;
    this.ctx = this.canvas.getContext('2d'); this.ctx.imageSmoothingEnabled = false;
    this.tex = WD.canvasTex(this.canvas);
    const m = this.max;
    this.pos = new Float32Array(m * 12); this.uv = new Float32Array(m * 8); this.ft = new Float32Array(m * 8);
    const idx = new Uint16Array(m * 6); for (let i = 0; i < m; i++) { const b = i * 4; idx.set([b, b + 1, b + 2, b, b + 2, b + 3], i * 6); }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('uv', new THREE.BufferAttribute(this.uv, 2).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aFoot', new THREE.BufferAttribute(this.ft, 2).setUsage(THREE.DynamicDrawUsage));
    this.geo.setIndex(new THREE.BufferAttribute(idx, 1));
    this.geo.setDrawRange(0, 0);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: S.BILL_VERT, fragmentShader: S.BILL_FRAG, transparent: true, depthWrite: true, depthTest: true, side: THREE.DoubleSide,
      uniforms: {
        uMap: { value: this.tex }, uMapSize: { value: new THREE.Vector2(this.canvas.width, this.canvas.height) },
        uLight: shared.uLight, uReg: shared.uReg, uGain: shared.uGain, uTime: shared.uTime, uBias: { value: bias },
        uFog: shared.uFog, uFogD: shared.uFogD, uMist: shared.uMist, uCam: shared.uCam, uCamF: shared.uCamF,
      },
    });
    this.mesh = new THREE.Mesh(this.geo, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = order;
  }
  begin() { this.n = 0; this.ctx.setTransform(1, 0, 0, 1, 0, 0); this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
  // dessine un objet dans la prochaine cellule libre ; renvoie false si l'atlas est plein
  add(item, cosP, sinP, cy = 1, sy = 0) {
    if (this.n >= this.max) return false;
    const i = this.n++, cs = this.cell, c = this.ctx, col = i % this.cols, row = (i / this.cols) | 0, x0 = col * cs, y0 = row * cs;
    c.save(); c.beginPath(); c.rect(x0, y0, cs, cs); c.clip();
    c.translate(x0 + cs / 2 - Math.round(item.x), y0 + this.foot - Math.round(item.y));
    item.f(c); c.restore();
    const aw = this.canvas.width, ah = this.canvas.height, e = 0.5;
    const u0 = (x0 + e) / aw, u1 = (x0 + cs - e) / aw, v0 = (y0 + e) / ah, v1 = (y0 + cs - e) / ah;
    const fx = item.x / TS, fz = item.y / TS, hw = cs / 2 / TS, top = this.foot / TS, bot = -(cs - this.foot) / TS;
    const P = this.pos, o = i * 12, U = this.uv, uo = i * 8, F = this.ft;
    // le billboard fait face à la caméra : « droite » = (cy, -sy), « loin de la caméra » = (-sy, -cy) dans le plan du sol (cy = 1, sy = 0 sans pivot)
    const corner = (k, u, v, tu, tv) => { P[o + k * 3] = fx + u * cy - v * sinP * sy; P[o + k * 3 + 1] = v * cosP; P[o + k * 3 + 2] = fz - u * sy - v * sinP * cy; U[uo + k * 2] = tu; U[uo + k * 2 + 1] = tv; F[uo + k * 2] = fx; F[uo + k * 2 + 1] = fz; };
    corner(0, -hw, top, u0, v0); corner(1, hw, top, u1, v0); corner(2, hw, bot, u1, v1); corner(3, -hw, bot, u0, v1);
    return true;
  }
  end() {
    this.geo.setDrawRange(0, this.n * 6);
    for (const a of ['position', 'uv', 'aFoot']) this.geo.attributes[a].needsUpdate = true;
    if (this.n) this.tex.needsUpdate = true;
    this.mesh.visible = this.n > 0;
  }
}

export class HD2D {
  constructor(stage, canvas2d) {
    const cv = document.createElement('canvas'); cv.id = 'game3d'; cv.width = SW; cv.height = SH;
    stage.insertBefore(cv, canvas2d);
    this.canvas = cv; this.failed = false;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false });
    if (!r.capabilities.isWebGL2) { cv.remove(); throw new Error('WebGL2 requis'); }
    r.setPixelRatio(1); r.outputColorSpace = THREE.LinearSRGBColorSpace; r.autoClear = false;
    this.scale = 0; this.q = 0; this.baseScale = 1;
    this.camera = new THREE.PerspectiveCamera(CFG.fov, SW / SH, 0.1, 160);
    this.scene = new THREE.Scene();
    this.pitch = CFG.pitch * Math.PI / 180;
    this.curPitch = this.pitch; this.curYaw = 0; this.curDist = CFG.dist; this.curLook = CFG.look; this.curFov = CFG.fov;   // modifiés par les cinématiques (g.camFx)
    this.sh = {
      uTime: { value: 0 }, uFog: { value: new THREE.Vector3(.05, .05, .1) }, uFogD: { value: .02 }, uMist: { value: .5 }, uCam: { value: new THREE.Vector3() },
      uLight: { value: null }, uOvN: { value: null }, uOvA: { value: null }, uReg: { value: new THREE.Vector4() }, uGain: { value: 1.12 },
      uCenter: { value: new THREE.Vector3() }, uPointScale: { value: 1 },
      uPl: { value: new THREE.Vector3(9, 9, 0) }, uPlP: { value: new THREE.Vector3() }, uCamF: { value: new THREE.Vector3() }, uResS: { value: new THREE.Vector2(SW, SH) }, uCut: { value: new THREE.Vector2(0.15, 0.27) },
    };
    this.computeRegion();
    this.initOverlays();
    this.initBatches();
    this.initAir();
    this.initPost();
    this.world = null; this.group = null; this.sig = '';
    this.setScale(1);
    this.v3 = new THREE.Vector3();
  }

  // largeur logique de la scène (hauteur fixe 720) : suit le ratio de l'écran, sans bandes noires
  resize(w) {
    w = Math.round(w); if (w === SW) return;
    SW = w; this.canvas.width = SW; this.camera.aspect = SW / SH; this.camera.updateProjectionMatrix();
    setViewW(Math.round(225 * SW / SH));
    for (const t of [this.sh.uLight.value, this.sh.uOvN.value, this.sh.uOvA.value]) t && t.dispose();
    this.computeRegion(); this.initOverlays();
    for (const a of [this.airN, this.airA]) { a.mesh.material.uniforms.uMap.value.dispose(); }
    for (const c of [this.airNC, this.airAC]) { c.width = SW; c.height = SH; }
    this.scale = 0; this.applyScale();
  }

  // ----- région du sol visible (en tuiles, relative à la cible) : sert de zone pour la carte de lumière et les décalques -----
  computeRegion() {
    const c = this.camera, keepP = this.curPitch, keepY = this.curYaw;
    const ray = new THREE.Vector3(); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    // union des régions vues sous tous les angles que le joueur peut prendre (pivot ±CAM_YAW_MAX° et inclinaison bornée)
    const Y = CAM_YAW_MAX * Math.PI / 180, rad = d => d * Math.PI / 180;
    for (const yw of [-Y, 0, Y]) for (const pd of [CFG.camPitchMin, CFG.pitch, CFG.camPitchMax]) {
      this.curPitch = rad(pd); this.curYaw = yw; this.placeCamera(0, 0, 0, 0);
      const pos = c.position.clone();
      for (const [nx, ny] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 1], [0, -1]]) {
        ray.set(nx, ny, 0.5).unproject(c).sub(pos).normalize();
        const t = Math.min(34, ray.y < -0.03 ? -pos.y / ray.y : 40);
        const px = pos.x + ray.x * t, pz = pos.z + ray.z * t;
        x0 = Math.min(x0, px); x1 = Math.max(x1, px); z0 = Math.min(z0, pz); z1 = Math.max(z1, pz);
      }
    }
    this.curPitch = keepP; this.curYaw = keepY; this.placeCamera(0, 0, 0, 0);
    const m = 2;
    const rw = Math.ceil((x1 - x0 + 2 * m) * TS / 16) * 16, rh = Math.ceil((z1 - z0 + 2 * m) * TS / 16) * 16;
    this.reg = { relX: (x0 - m) * TS, relY: (z0 - m) * TS, w: rw, h: rh, ox: 0, oy: 0 };
  }
  placeCamera(cx, cz, shx, shy) {
    const c = this.camera, p = this.curPitch, L = this.curLook, D = this.curDist;
    const yw = this.curYaw || 0;   // pivot autour de la cible : yw > 0 amène la caméra vers la droite de l'écran
    c.position.set(cx + shx + D * Math.cos(p) * Math.sin(yw), L + D * Math.sin(p), cz + shy + D * Math.cos(p) * Math.cos(yw));
    c.lookAt(cx + shx, L, cz + shy);
    c.updateMatrixWorld(true);
  }

  initOverlays() {
    const { w, h } = this.reg, mk = (cw, ch) => { const c = document.createElement('canvas'); c.width = cw; c.height = ch; return c; };
    this.lightC = mk(w >> 1, h >> 1); this.ovNC = mk(w, h); this.ovAC = mk(w >> 1, h >> 1);
    this.lightX = this.lightC.getContext('2d'); this.ovNX = this.ovNC.getContext('2d'); this.ovAX = this.ovAC.getContext('2d');
    const t = c => { const x = WD.canvasTex(c); return x; };
    this.sh.uLight.value = t(this.lightC); this.sh.uOvN.value = t(this.ovNC); this.sh.uOvA.value = t(this.ovAC);
  }
  initBatches() {
    this.batchS = new Batch(128, 8, 8, 112, 5, this.sh, 0.0015);
    this.batchL = new Batch(256, 4, 4, 200, 6, this.sh, 0.0015);
    this.scene.add(this.batchS.mesh, this.batchL.mesh);
  }
  initAir() {
    const mk = () => { const c = document.createElement('canvas'); c.width = SW; c.height = SH; return c; };
    this.airNC = mk(); this.airAC = mk(); this.airNX = this.airNC.getContext('2d'); this.airAX = this.airAC.getContext('2d');
    const geo = new THREE.PlaneGeometry(2, 2);
    const mkMesh = (c, add, order) => {
      const tex = WD.canvasTex(c);
      const m = new THREE.ShaderMaterial({
        vertexShader: S.AIR_VERT, fragmentShader: S.AIR_FRAG, transparent: true, depthTest: false, depthWrite: false,
        blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: { uMap: { value: tex }, uAdd: { value: add ? 1 : 0 } },
      });
      const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; mesh.renderOrder = order; this.scene.add(mesh); return { mesh, tex };
    };
    this.airN = mkMesh(this.airNC, false, 100); this.airA = mkMesh(this.airAC, true, 101);
  }

  // ----- post-traitement -----
  initPost() {
    const half = THREE.HalfFloatType, hasF = this.renderer.extensions.has('EXT_color_buffer_float') || this.renderer.extensions.has('EXT_color_buffer_half_float');
    this.rtType = hasF ? half : THREE.UnsignedByteType;
    this.postScene = new THREE.Scene(); this.postCam = new THREE.Camera();
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial()); this.quad.frustumCulled = false; this.postScene.add(this.quad);
    const mk = (frag, uniforms) => new THREE.ShaderMaterial({ vertexShader: S.FULL_VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
    this.mBright = mk(S.BRIGHT_FRAG, { tMap: { value: null }, uThr: { value: 0.78 } });
    this.mBlur = mk(S.BLUR_FRAG, { tMap: { value: null }, uDir: { value: new THREE.Vector2() } });
    this.mFinal = mk(S.FINAL_FRAG, {
      tScene: { value: null }, tBloomA: { value: null }, tBloomB: { value: null }, uRes: { value: new THREE.Vector2(SW, SH) },
      uFocus: { value: 0.5 }, uBand: { value: 0.13 }, uBlur: { value: TILT_BASE * tiltPct() / 100 }, uBloom: { value: 0.5 }, uSat: { value: 1.08 }, uCon: { value: 1.06 }, uVig: { value: 0.4 },
      uTime: { value: 0 }, uGrain: { value: 0.022 }, uFlash: { value: 0 }, uDark: { value: 0 },
      uTintS: { value: new THREE.Vector3(1, 1, 1) }, uTintH: { value: new THREE.Vector3(1, 1, 1) },
    });
    this.rt = {};
  }
  // intensité du tilt-shift en % (0 à 150), appelée par le curseur « Flou » des réglages
  setTilt(pct) { this.mFinal.uniforms.uBlur.value = TILT_BASE * Math.max(0, Math.min(150, pct)) / 100; }
  buildTargets() {
    const w = Math.round(SW * this.scale), h = Math.round(SH * this.scale);
    for (const k of Object.keys(this.rt)) this.rt[k].dispose();
    const opt = { type: this.rtType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, colorSpace: THREE.NoColorSpace };
    this.rt.scene = new THREE.WebGLRenderTarget(w, h, { ...opt, depthBuffer: true, samples: 4 });
    const q = (d) => new THREE.WebGLRenderTarget(Math.max(2, w >> d), Math.max(2, h >> d), opt);
    this.rt.a1 = q(2); this.rt.a2 = q(2); this.rt.b1 = q(3); this.rt.b2 = q(3);
  }
  // échelle de rendu demandée par la page (devicePixelRatio × zoom) ; la qualité adaptative peut la réduire
  setScale(s) { this.baseScale = Math.max(1, Math.min(2, s)); this.applyScale(); }
  applyScale() {
    const s = Math.max(0.5, this.baseScale * [1, 0.75, 0.6][this.q || 0]);
    if (this.rt.scene && Math.abs(s - this.scale) < 1e-3) return;
    this.scale = s; this.renderer.setSize(Math.round(SW * s), Math.round(SH * s), false); this.mFinal.uniforms.uRes.value.set(SW * s, SH * s); this.sh.uResS.value.set(SW * s, SH * s);
    this.canvas.style.width = SW + 'px'; this.canvas.style.height = SH + 'px';
    this.buildTargets();
    this.pointK = SH * s; this.sh.uPointScale.value = this.pointK / (2 * Math.tan(this.curFov * Math.PI / 360));
  }
  // qualité adaptative : si l'image dépasse durablement ~24 ms, on réduit la résolution de rendu (jamais l'inverse, pour éviter les oscillations)
  adapt(dtMs) {
    if (dtMs > 250 || document.hidden) return;
    this.fe = (this.fe || 16.7) * 0.97 + dtMs * 0.03; this.fc = (this.fc || 0) + 1;
    if (this.fc > 150 && this.fe > 24 && (this.q || 0) < 2) { this.q = (this.q || 0) + 1; this.fc = 0; this.fe = 16.7; this.applyScale(); }
  }
  pass(mat, target) {
    this.quad.material = mat; this.renderer.setRenderTarget(target); this.renderer.render(this.postScene, this.postCam);
  }
  blur(src, tmp, dirScale) {
    const m = this.mBlur, d = m.uniforms.uDir.value;
    m.uniforms.tMap.value = src.texture; d.set(dirScale / src.width, 0); this.pass(m, tmp);
    m.uniforms.tMap.value = tmp.texture; d.set(0, dirScale / src.height); this.pass(m, src);
  }

  // ----- monde (une carte) -----
  setWorld(g) {
    this.disposeWorld();
    const w = g.world, key = WD.THEME_KEY(w.theme), cfg = WD.HD[key], sh = this.sh;
    this.world = w; this.key = key; this.cfg = cfg;
    const grp = this.group = new THREE.Group();
    const floorTex = WD.canvasTex(g.floor), emis = g.floor.emis || document.createElement('canvas');
    const emisTex = WD.canvasTex(emis);
    const tx = WD.makeWallTextures(w.theme, key);
    const T_ = c => WD.canvasTex(c, { repeatY: true });
    this.tex = [floorTex, emisTex, T_(tx.side), T_(tx.sideE), WD.canvasTex(tx.top, { repeatY: true }), WD.canvasTex(tx.topE, { repeatY: true })];
    const [fT, eT, sT, sE, tT, tE] = this.tex;
    const tint = cfg.emisTint, pulse = (key === 'lava' || key === 'lab' || key === 'mystic' || key === 'bell') ? 1 : 0.4;
    this.mats = {
      ground: WD.terrainMaterial(sh, fT, [g.floor.width, g.floor.height], eT, [emis.width || 1, emis.height || 1], 0, { emisK: cfg.emisK, tint }),
      side: WD.terrainMaterial(sh, sT, [tx.side.width, tx.side.height], sE, [tx.sideE.width, tx.sideE.height], 1, { emisK: cfg.emisK * 1.1, tint, pulse }),
      top: WD.terrainMaterial(sh, tT, [tx.top.width, tx.top.height], tE, [tx.topE.width, tx.topE.height], 1, { emisK: cfg.emisK, tint, pulse }),
      mist: WD.mistMaterial(sh, [.78, .5, 1.]),
    };
    grp.add(new THREE.Mesh(WD.buildGround(w), this.mats.ground));
    const wl = WD.buildWalls(w);
    if (!cfg.open) grp.add(new THREE.Mesh(wl.top, this.mats.top), new THREE.Mesh(wl.side, this.mats.side));
    this.doorMeshes = [null, null]; this.mistMesh = null; this.sig = '';
    this.abyss = WD.buildAbyss(key, sh); grp.add(this.abyss);
    this.props = WD.buildProps(w, key, w.idx * 7 + 3, sh); grp.add(this.props);
    this.parts = WD.buildParticles(key, sh); grp.add(this.parts);
    this.scene.add(grp);
    // brouillard, étalonnage
    sh.uFog.value.set(...cfg.fog); sh.uFogD.value = cfg.fogD; sh.uMist.value = cfg.mist;
    const gr = cfg.grade, f = this.mFinal.uniforms;
    f.uTintS.value.set(...gr.ts); f.uTintH.value.set(...gr.th); f.uSat.value = gr.sat; f.uCon.value = gr.con; f.uBloom.value = gr.bloom; f.uVig.value = gr.vig;
    this.renderer.setClearColor(new THREE.Color(...cfg.fog), 1);
  }
  disposeWorld() {
    if (!this.group) return;
    this.scene.remove(this.group);
    this.group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o !== this.props) o.material.dispose?.(); });
    if (this.props) { this.props.material.dispose(); this.props.dispose?.(); }
    for (const t of this.tex || []) t.dispose();
    for (const m of this.doorMeshes || []) if (m) { this.scene.remove(m); m.geometry.dispose(); }
    if (this.mistMesh) { this.scene.remove(this.mistMesh); this.mistMesh.geometry.dispose(); }
    this.group = null;
  }
  // portes et brume de boss : reconstruites quand leur état change (porte ouverte, brouillard dissipé)
  syncGates(w) {
    let nd = 0, nf = 0;
    if (w.door) for (const [tx, ty] of w.door.tiles) if (w.grid[ty * M.MW + tx] === M.T.DOOR) nd++;
    if (w.fog) for (const [tx, ty] of w.fog.tiles) if (w.grid[ty * M.MW + tx] === M.T.FOG) nf++;
    const sig = nd + ':' + nf; if (sig === this.sig) return; this.sig = sig;
    for (const m of this.doorMeshes) if (m) { this.scene.remove(m); m.geometry.dispose(); }
    if (this.mistMesh) { this.scene.remove(this.mistMesh); this.mistMesh.geometry.dispose(); this.mistMesh = null; }
    this.doorMeshes = [null, null];
    if (nd) { const d = WD.buildDoors(w); this.doorMeshes = [new THREE.Mesh(d.top, this.mats.top), new THREE.Mesh(d.side, this.mats.side)]; this.doorMeshes.forEach(m => this.scene.add(m)); }
    if (nf) { this.mistMesh = new THREE.Mesh(WD.buildMist(w, this.pitch), this.mats.mist); this.mistMesh.renderOrder = 8; this.mistMesh.frustumCulled = false; this.scene.add(this.mistMesh); }
  }

  // projette un point du monde (pixels du jeu, hauteur z en pixels) vers l'écran logique 1280×720
  proj(x, y, z) {
    const v = this.v3.set(x / TS, z / TS, y / TS).applyMatrix4(this.camera.matrixWorldInverse);
    const depth = -v.z; if (depth < 0.2) return null;
    v.applyMatrix4(this.camera.projectionMatrix);
    return { sx: (v.x * 0.5 + 0.5) * SW, sy: (1 - (v.y * 0.5 + 0.5)) * SH, s: this.ppu / depth / TS, nx: v.x, ny: v.y };
  }

  render(g) {
    if (!g.world || !g.floor) return;
    const t0 = performance.now();
    if (g.world !== this.world) this.setWorld(g);
    this.syncGates(g.world);
    const sh = this.sh, R = this.reg, t = g.t;
    { // paramètres de caméra : par défaut ceux du jeu, sinon ceux de la cinématique en cours
      const fx = g.camFx;
      // pivot du joueur (stick droit) : inclinaison bornée, ignoré pendant une cinématique
      this.curPitch = (fx ? fx.pitch : Math.max(CFG.camPitchMin, Math.min(CFG.camPitchMax, CFG.pitch + (g.camTilt || 0)))) * Math.PI / 180; this.curYaw = fx ? 0 : (g.camYaw || 0) * Math.PI / 180; this.curDist = fx ? fx.dist : CFG.dist; this.curLook = fx ? fx.look : CFG.look;
      const fov = fx ? fx.fov : CFG.fov;
      if (Math.abs(fov - this.curFov) > 1e-3) { this.curFov = fov; this.camera.fov = fov; this.camera.updateProjectionMatrix(); }
      if (this.pointK) this.sh.uPointScale.value = this.pointK / (2 * Math.tan(this.curFov * Math.PI / 360));
    }
    this.ppu = SH / (2 * Math.tan(this.curFov * Math.PI / 360));
    // caméra : centre de l'ancienne vue 2D (déjà lissée et bornée à la carte)
    const shx = g.shake ? (Math.random() - 0.5) * g.shake : 0, shy = g.shake ? (Math.random() - 0.5) * g.shake : 0;
    const cx = (Math.max(0, Math.min(M.MW * TS - W, g.cam.x)) + W / 2 + shx) / TS, cz = (Math.max(0, Math.min(M.MH * TS - H, g.cam.y)) + H / 2 + shy) / TS;
    this.placeCamera(cx, cz, 0, 0);
    R.ox = Math.round(cx * TS + R.relX); R.oy = Math.round(cz * TS + R.relY);
    sh.uReg.value.set(R.ox / TS, R.oy / TS, TS / R.w, TS / R.h);
    { // position du chef à l'écran (pour la découpe des murs qui le masquent)
      const c = g.chief(), q = this.proj(c.x, c.y, 14);
      this.camera.getWorldDirection(sh.uCamF.value);
      if (q) { sh.uPl.value.set(q.nx, q.ny, c.y / TS); sh.uPlP.value.set(c.x / TS, 14 / TS, c.y / TS); }
    }
    sh.uTime.value = t; sh.uCam.value.copy(this.camera.position); sh.uCenter.value.set(cx, 0, cz);
    this.cfg && (this.mFinal.uniforms.uTime.value = t);

    const P = this.prof || (this.prof = {}), tk = (k, a) => { const n = performance.now(); P[k] = (P[k] || 0) * 0.95 + (n - a) * 0.05; return n; };
    let tp = performance.now();
    const { amb, lights } = buildLights(g);
    // --- carte de lumière (demi-résolution) ---
    const L = this.lightX; L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'source-over'; L.fillStyle = `rgb(${amb})`; L.fillRect(0, 0, this.lightC.width, this.lightC.height);
    L.setTransform(0.5, 0, 0, 0.5, -R.ox * 0.5, -R.oy * 0.5); L.globalCompositeOperation = 'lighter';
    const inReg = (l, pad = 0) => l.x + l.r + pad > R.ox && l.x - l.r - pad < R.ox + R.w && l.y + l.r + pad > R.oy && l.y - l.r - pad < R.oy + R.h;
    for (const l of lights) if (inReg(l)) radial(L, l.x, l.y, l.r, l.c, l.a);
    // --- décalques au sol (opaques/alpha) et lueurs additives ---
    const N = this.ovNX, Ad = this.ovAX;
    N.setTransform(1, 0, 0, 1, 0, 0); N.clearRect(0, 0, R.w, R.h);
    Ad.setTransform(1, 0, 0, 1, 0, 0); Ad.globalCompositeOperation = 'source-over'; Ad.fillStyle = '#000'; Ad.fillRect(0, 0, this.ovAC.width, this.ovAC.height);
    N.setTransform(1, 0, 0, 1, -R.ox, -R.oy);
    Ad.setTransform(0.5, 0, 0, 0.5, -R.ox * 0.5, -R.oy * 0.5);
    Ad.globalCompositeOperation = 'lighter';
    for (const l of lights) if (inReg(l)) radial(Ad, l.x, l.y, l.r * 0.7, l.c, l.a * 0.16);
    N.imageSmoothingEnabled = false;
    setShadowSink((x, y, rx, a) => { N.fillStyle = `rgba(0,0,0,${a})`; N.beginPath(); N.ellipse(x, y, rx, rx * 0.4, 0, 0, 7); N.fill(); });

    tp = tk('lumiere', tp);
    // --- sprites ---
    const cosP = Math.cos(this.curPitch), sinP = Math.sin(this.curPitch), cyw = Math.cos(this.curYaw), syw = Math.sin(this.curYaw);
    const inView = (x, y, pad = 60) => {
      if (!(x > R.ox - pad && x < R.ox + R.w + pad && y > R.oy - pad && y < R.oy + R.h + pad)) return false;
      const p = this.proj(x, y, 0); return !!p && p.nx > -1.35 && p.nx < 1.35 && p.ny > -1.5 && p.ny < 1.5;
    };
    const list = collectDrawList(g, inView);
    // les objets hors champ ajoutés sans test (objets au sol, chef, alliés) sont filtrés ici
    // tri du plus loin au plus près de la caméra (sans pivot : par y croissant)
    const vis = list.filter(o => inView(o.x, o.y, 90)).sort((a, b) => (b.x * -syw + b.y * -cyw) - (a.x * -syw + a.y * -cyw));
    this.batchS.begin(); this.batchL.begin();
    for (const o of vis) (o.big ? this.batchL : this.batchS).add(o, cosP, sinP, cyw, syw);
    this.batchS.end(); this.batchL.end();
    setShadowSink(null);
    tp = tk('sprites', tp);

    // --- effets au sol (flaques, télégraphes, anneaux, faisceaux, ombres de projectiles) ---
    const hook = {
      ctxFor: f => f.add ? Ad : N,
      place: (ctx, f) => { ctx.globalCompositeOperation = f.add ? 'lighter' : 'source-over'; ctx.translate(Math.round(f.x), Math.round(f.y - f.z)); return true; },
    };
    N.save(); groundFx(N, g, hook); N.restore();
    for (const b of g.beams) { const k = 1 - b.t / b.max; N.save(); N.translate(b.x, b.y); N.rotate(b.ang); N.globalAlpha = k; N.fillStyle = b.color; N.fillRect(0, -b.w / 2, b.len, b.w); N.fillStyle = '#fff'; N.fillRect(0, -b.w / 5, b.len, b.w * 0.4); N.restore(); }
    for (const p of g.projs) { N.fillStyle = 'rgba(0,0,0,.25)'; N.beginPath(); N.ellipse(p.x, p.y + 2, 3, 1.2, 0, 0, 7); N.fill(); }
    for (const q of g.beams) { Ad.save(); Ad.translate(q.x, q.y); Ad.rotate(q.ang); Ad.globalAlpha = (1 - q.t / q.max) * 0.5; Ad.fillStyle = q.color; Ad.fillRect(0, -q.w * 0.9, q.len, q.w * 1.8); Ad.restore(); }
    N.setTransform(1, 0, 0, 1, 0, 0); Ad.setTransform(1, 0, 0, 1, 0, 0);

    tp = tk('sol', tp);
    this.drawAir(g);
    tp = tk('air', tp);
    for (const tex of [sh.uLight.value, sh.uOvN.value, sh.uOvA.value]) tex.needsUpdate = true;

    // --- brume des portes, flash, etc. ---
    const f = this.mFinal.uniforms;
    f.uDark.value = g.state === 'dead' ? Math.min(0.7, g.deadT * 0.5) : 0;
    this.parts.visible = true;

    tp = tk('upload', tp);
    // --- rendu : scène -> bloom -> composition ---
    const r = this.renderer;
    r.setRenderTarget(this.rt.scene); r.clear(true, true, true);
    r.render(this.scene, this.camera);
    this.mBright.uniforms.tMap.value = this.rt.scene.texture; this.pass(this.mBright, this.rt.a1);
    this.blur(this.rt.a1, this.rt.a2, 1); this.blur(this.rt.a1, this.rt.a2, 2.2);
    this.mBlur.uniforms.tMap.value = this.rt.a1.texture; this.mBlur.uniforms.uDir.value.set(0, 0); this.pass(this.mBlur, this.rt.b1);
    this.blur(this.rt.b1, this.rt.b2, 1); this.blur(this.rt.b1, this.rt.b2, 2.2);
    f.tScene.value = this.rt.scene.texture; f.tBloomA.value = this.rt.a1.texture; f.tBloomB.value = this.rt.b1.texture;
    this.pass(this.mFinal, null);
    tk('gl', tp);
    this.ms = (this.ms || 0) * 0.95 + (performance.now() - t0) * 0.05;   // coût CPU moyen d'une image (ms)
  }

  // ----- éléments aériens : projectiles, particules, effets d'attaque, textes, verrouillage (calque écran) -----
  drawAir(g) {
    const N = this.airNX, Ad = this.airAX;
    N.setTransform(1, 0, 0, 1, 0, 0); N.clearRect(0, 0, SW, SH);
    Ad.setTransform(1, 0, 0, 1, 0, 0); Ad.globalCompositeOperation = 'source-over'; Ad.fillStyle = '#000'; Ad.fillRect(0, 0, SW, SH); Ad.globalCompositeOperation = 'lighter';
    N.imageSmoothingEnabled = false;
    // effets d'attaque non posés au sol
    drawFxs(g, null, false, {
      ctxFor: f => f.add ? Ad : N,
      place: (ctx, f) => { const p = this.proj(f.x, f.y, f.z); if (!p) return false; ctx.globalCompositeOperation = f.add ? 'lighter' : 'source-over'; ctx.translate(Math.round(p.sx), Math.round(p.sy)); ctx.scale(p.s, p.s); return true; },
    });
    // projectiles
    for (const p of g.projs) {
      const q = this.proj(p.x, p.y, 8); if (!q) continue;
      const r = ((p.big ? 5 : p.r > 3.4 ? 4 : 3) + Math.sin(g.t * 30) * 0.5) * q.s;
      N.fillStyle = p.color; N.beginPath(); N.arc(q.sx, q.sy, r, 0, 7); N.fill();
      N.fillStyle = '#fff'; N.beginPath(); N.arc(q.sx, q.sy, r * 0.5, 0, 7); N.fill();
      const gr = Ad.createRadialGradient(q.sx, q.sy, 0, q.sx, q.sy, r * 2.6); gr.addColorStop(0, p.color); gr.addColorStop(1, 'rgba(0,0,0,0)');
      Ad.globalAlpha = 0.5; Ad.fillStyle = gr; Ad.fillRect(q.sx - r * 2.6, q.sy - r * 2.6, r * 5.2, r * 5.2); Ad.globalAlpha = 1;
    }
    // particules
    for (const p of g.parts) {
      const q = this.proj(p.x, p.y, p.z); if (!q) continue;
      const sz = Math.max(2, p.size * q.s);
      N.globalAlpha = Math.max(0, p.life / p.max); N.fillStyle = p.c; N.fillRect(Math.round(q.sx - sz / 2), Math.round(q.sy - sz / 2), Math.round(sz), Math.round(sz));
    }
    N.globalAlpha = 1;
    // textes flottants (dégâts, parades…)
    N.textAlign = 'center'; N.lineJoin = 'round';
    for (const t of g.texts) {
      const q = this.proj(t.x, t.y, 12); if (!q) continue;
      N.globalAlpha = Math.min(1, (0.9 - t.t) * 3);
      N.font = `bold ${Math.round(8.5 * q.s)}px monospace`;
      N.lineWidth = Math.max(2, q.s * 1.4); N.strokeStyle = '#000'; N.strokeText(t.s, Math.round(q.sx), Math.round(q.sy));
      N.fillStyle = t.c; N.fillText(t.s, Math.round(q.sx), Math.round(q.sy));
    }
    N.globalAlpha = 1;
    // bulle d'objet qui sort du coffre (icône, ancrée par le bas)
    for (const p of g.pops || []) {
      if (p.t < 0) continue; const img = itemImage(p.key); if (!img) continue;
      const k = Math.min(1, p.t / 0.45), e = 1 - (1 - k) * (1 - k), q = this.proj(p.x, p.y, 6 + 26 * e + (p.t > 0.45 ? Math.sin((p.t - 0.45) * 5) * 1.5 : 0)); if (!q) continue;
      const sz = 30 * (0.5 + 0.4 * e) * q.s;
      N.globalAlpha = p.t > 1.4 ? Math.max(0, (1.8 - p.t) / 0.4) : 1;
      N.drawImage(img, Math.round(q.sx - sz / 2), Math.round(q.sy - sz), Math.round(sz), Math.round(sz));
    }
    N.globalAlpha = 1;
    // marqueur de verrouillage
    if (g.lock && !g.lock.dead) {
      const e = g.lock, h = A.db[e.sprite].anchor.h * (e.def.scale || 1) + 10 + Math.sin(g.t * 6) * 1.5, q = this.proj(e.x, e.y, h);
      if (q) { const s = q.s; N.fillStyle = '#ff5a5a'; N.strokeStyle = '#300'; N.lineWidth = s * 0.6; N.beginPath(); N.moveTo(q.sx, q.sy + 5 * s); N.lineTo(q.sx - 4 * s, q.sy); N.lineTo(q.sx, q.sy - 5 * s); N.lineTo(q.sx + 4 * s, q.sy); N.closePath(); N.stroke(); N.fill(); }
    }
    this.airN.tex.needsUpdate = true; this.airA.tex.needsUpdate = true;
  }

  destroy() {
    try { this.disposeWorld(); this.renderer.dispose(); } catch (e) { /* ignoré */ }
    this.canvas.remove();
  }
}
