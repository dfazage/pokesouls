// Bâtiments en 3D low-poly (OBJ) : remplacent les sprites de certains décors en mode HD-2D.
import * as THREE from './vendor/three.module.min.js';
import * as S from './hd2d_shaders.js';

// matériau OBJ -> [couleur de base, émission]. Palette Johto : toits lie-de-vin, bois sombre, papier des shōji chaud.
const PAL = {
  wine: { _278: ['#8a3a52'], _280: ['#6a2c42'], _274: ['#4a3238'] },
  slate: { _278: ['#5a6190'], _280: ['#454b74'], _274: ['#3a3d52'] },
};
const COMMON = {
  _273: ['#a18c78'], Material2603: ['#4a3326'], _276: ['#d9c08a', 0.18], _281: ['#4a3022'],
  _277: ['#e0c88e', 0.28], _279: ['#f0b868', 0.5], _275: null,
};

export function parseObj(txt) {
  const V = [], N = [], groups = {}; let cur = null;
  for (const line of txt.split('\n')) {
    const p = line.trim().split(/\s+/);
    if (p[0] === 'v') V.push(p.slice(1, 4).map(Number));
    else if (p[0] === 'vn') N.push(p.slice(1, 4).map(Number));
    else if (p[0] === 'usemtl') cur = groups[p[1]] ||= { pos: [], nor: [] };
    else if (p[0] === 'f' && cur) {
      const ix = p.slice(1).map(t => { const a = t.split('/'); return [+a[0] - 1, a[2] ? +a[2] - 1 : -1]; });
      for (let i = 1; i < ix.length - 1; i++) {
        const tri = [ix[0], ix[i], ix[i + 1]], a = V[tri[0][0]], b = V[tri[1][0]], c = V[tri[2][0]];
        const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        let fn = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; const l = Math.hypot(...fn) || 1; fn = fn.map(v => v / l);
        for (const [vi, ni] of tri) { cur.pos.push(...V[vi]); cur.nor.push(...(ni >= 0 ? N[ni] : fn)); }
      }
    }
  }
  return groups;
}

const cache = {};
export const loadObj = url => cache[url] ||= fetch(url).then(r => r.text()).then(parseObj);

// géométrie fusionnée colorée ; (sx, sy, sz) : échelle monde ; renvoie aussi la profondeur utile
export function buildGeo(groups, pal, sx, sy, sz) {
  const pos = [], nor = [], col = [], emi = [], c = new THREE.Color();
  for (const [m, g] of Object.entries(groups)) {
    const def = (pal[m] !== undefined ? pal[m] : COMMON[m]); if (!def) continue;
    c.set(def[0]).convertLinearToSRGB();
    for (let i = 0; i < g.pos.length; i += 3) {
      pos.push(g.pos[i] * sx, g.pos[i + 1] * sy, g.pos[i + 2] * sz); nor.push(g.nor[i], g.nor[i + 1], g.nor[i + 2]);
      col.push(c.r, c.g, c.b); emi.push(def[1] || 0);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setAttribute('aEmi', new THREE.Float32BufferAttribute(emi, 1));
  return geo;
}

const VERT = /* glsl */`
attribute float aEmi; varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying float vE;
void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal); vCol = color; vE = aEmi; gl_Position = projectionMatrix*viewMatrix*w; }`;
const FRAG = /* glsl */`
uniform float uTime; varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying float vE;
${S.FOG_FRAG}
void main(){
  vec3 n = normalize(vN);
  float dif = max(dot(n, normalize(vec3(-.35, .8, .5))), 0.);
  float side = max(dot(n, normalize(vec3(.5, .2, .8))), 0.);
  vec3 col = vCol*(.46 + .62*dif + .18*side);
  col += vCol*vE*(.55 + .1*sin(uTime*1.7 + vW.x*3.));
  gl_FragColor = vec4(applyFog(col, vW), 1.);
}`;
export function buildingMaterial(shared) {
  return new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, vertexColors: true, uniforms: { uTime: shared.uTime, uFog: shared.uFog, uFogD: shared.uFogD, uMist: shared.uMist, uCam: shared.uCam } });
}

// décor -> modèle : largeur visée en tuiles = d.w * k
const MODELS = {
  shrine: { url: 'assets/models/japanese_home.obj', pal: 'wine', k: 1.0 },
  chapel: { url: 'assets/models/japanese_home.obj', pal: 'slate', k: 1.0 },
};
export const MODEL_KINDS = new Set(Object.keys(MODELS));

// ajoute au groupe un mesh par décor concerné (chargement asynchrone)
export function addBuildings(grp, w, shared, alive) {
  const mat = buildingMaterial(shared), W0 = 19, D0 = 11, Z = 0.9;   // emprise du modèle : 19 de large, corps 11 de profondeur
  for (const d of w.decor) {
    const cfg = MODELS[d.kind]; if (!cfg) continue;
    loadObj(cfg.url).then(groups => {
      if (!alive()) return;
      const kx = d.w * cfg.k / W0, geo = buildGeo(groups, PAL[cfg.pal], kx, kx, kx * Z);
      const m = new THREE.Mesh(geo, mat); m.frustumCulled = false;
      m.position.set(d.tx + d.w / 2, 0, d.ty + d.h - 0.05 - 5.5 * kx * Z);
      grp.add(m);
    });
  }
}
