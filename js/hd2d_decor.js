// Décors 3D d'Edo : lanternes de pierre, torii, cloches et arbres, en modèles instanciés texturés en pixel art (atlas assets/props/decor3d.png).
// Ils remplacent les sprites (billboards) de ces décors dans les cartes de Johto : la rotation de la caméra reste cohérente.
// Collisions et emprises restent celles de la grille (maps.js › FOOT / COLBOX) ; les lumières restent celles de decorLight (carte de lumière du jeu).
import * as THREE from './vendor/three.module.min.js';
import * as S from './hd2d_shaders.js';
import { FLOOR } from './props.js';
import { geoForest, houseTex } from './hd2d_world.js';

const KINDS = new Set(['lantern', 'torii', 'bell', 'tree']);
// teintes par thème : pierre, laque (torii), bronze (cloche)
const LOOK = {
  bell:   { stone: [.74, .74, .78], lacq: [.80, .22, .17], bronze: [.7, .52, .28] },
  ember:  { stone: [.4, .37, .35],  lacq: [.42, .15, .1],  bronze: [.5, .38, .28] },
  mirror: { stone: [.6, .69, .8],   lacq: [.58, .2, .22],  bronze: [.4, .62, .55] },
  ilex:   { stone: [.56, .72, .58],   lacq: [.62, .22, .15], bronze: [.55, .55, .3] },
};
export const decor3dOn = key => !!(FLOOR.d3img && FLOOR.fimg && LOOK[key]);

// ---------- petit constructeur de maillage (non indexé, normales plates ; aUV = (u, 0, v) en tuiles, v mesuré depuis le haut de la face) ----------
class MB {
  constructor() { this.P = []; this.N = []; this.M = []; this.U = []; }
  tri(a, b, c, mat, ua, ub, uc) {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]]; const l = Math.hypot(...n) || 1; n = n.map(v => v / l);
    for (const [p, u] of [[a, ua], [b, ub], [c, uc]]) { this.P.push(...p); this.N.push(...n); this.M.push(mat); this.U.push(u[0], 0, u[1]); }
  }
  quad(a, b, c, d, mat, ua, ub, uc, ud) { this.tri(a, b, c, mat, ua, ub, uc); this.tri(a, c, d, mat, ua, uc, ud); }   // a,b,c,d dans le sens trigonométrique vu de dehors
  box(x0, y0, z0, x1, y1, z1, mat, uo = 0) {
    const q = (a, b, c, d, ua, ub, uc, ud) => this.quad(a, b, c, d, mat, ua, ub, uc, ud);
    q([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [x0 + uo, y1 - y0], [x1 + uo, y1 - y0], [x1 + uo, 0], [x0 + uo, 0]);                         // +z
    q([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1 + uo, y1 - y0], [x0 + uo, y1 - y0], [x0 + uo, 0], [x1 + uo, 0]);                         // -z
    q([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [z1 + uo, y1 - y0], [z0 + uo, y1 - y0], [z0 + uo, 0], [z1 + uo, 0]);                         // +x
    q([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [z0 + uo, y1 - y0], [z1 + uo, y1 - y0], [z1 + uo, 0], [z0 + uo, 0]);                         // -x
    q([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [x0 + uo, z1], [x1 + uo, z1], [x1 + uo, z0], [x0 + uo, z0]);                                 // dessus
    q([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, z0], [x1, z0], [x1, z1], [x0, z1]);                                                     // dessous
  }
  // tronc de cône (r0 en bas, r1 en haut) ; wrap : u = fraction du tour (une répétition par tour), sinon longueur d'arc ; caps : bouchon du dessus
  cyl(cx, cz, y0, y1, r0, r1, seg, mat, { wrap = false, cap = true, ax = 'y', len = 0 } = {}) {
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const u0 = wrap ? i / seg : a0 * (r0 + r1) / 2, u1 = wrap ? (i + 1) / seg : a1 * (r0 + r1) / 2, h = y1 - y0;
      this.quad([cx + c1 * r0, y0, cz + s1 * r0], [cx + c0 * r0, y0, cz + s0 * r0], [cx + c0 * r1, y1, cz + s0 * r1], [cx + c1 * r1, y1, cz + s1 * r1], mat, [u1, h], [u0, h], [u0, 0], [u1, 0]);
      if (cap) this.tri([cx, y1, cz], [cx + c1 * r1, y1, cz + s1 * r1], [cx + c0 * r1, y1, cz + s0 * r1], mat, [cx, cz], [cx + c1 * r1, cz + s1 * r1], [cx + c0 * r1, cz + s0 * r1]);
    }
  }
  // toit en croupe : base rectangulaire (±bx, ±bz à y0) vers le sommet (±tx, ±tz à y1)
  hip(cx, cz, y0, y1, bx, bz, tx, tz, mat) {
    const B = [[-bx, -bz], [bx, -bz], [bx, bz], [-bx, bz]].map(([x, z]) => [cx + x, y0, cz + z]), T = [[-tx, -tz], [tx, -tz], [tx, tz], [-tx, tz]].map(([x, z]) => [cx + x, y1, cz + z]);
    const sl = Math.hypot(y1 - y0, bz - tz), sx = Math.hypot(y1 - y0, bx - tx);
    this.quad(B[3], B[2], T[2], T[3], mat, [cx - bx, sl], [cx + bx, sl], [cx + tx, 0], [cx - tx, 0]);         // +z
    this.quad(B[1], B[0], T[0], T[1], mat, [cx - bx, sl], [cx + bx, sl], [cx + tx, 0], [cx - tx, 0]);         // -z
    this.quad(B[2], B[1], T[1], T[2], mat, [cz - bz, sx], [cz + bz, sx], [cz + tz, 0], [cz - tz, 0]);         // +x
    this.quad(B[0], B[3], T[3], T[0], mat, [cz - bz, sx], [cz + bz, sx], [cz + tz, 0], [cz - tz, 0]);         // -x
    this.quad(T[3], T[2], T[1], T[0], mat, [0, 0], [1, 0], [1, 1], [0, 1]);
    this.quad(B[0], B[1], B[2], B[3], mat, [0, 0], [1, 0], [1, 1], [0, 1]);
  }
  // prisme : polygone convexe du plan xy (sens trigonométrique) extrudé de z0 à z1
  prism(pts, z0, z1, mat) {
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      this.quad([b[0], b[1], z1], [a[0], a[1], z1], [a[0], a[1], z0], [b[0], b[1], z0], mat, [b[0], 0], [a[0], 0], [a[0], z1 - z0], [b[0], z1 - z0]);
    }
    for (let i = 1; i < n - 1; i++) {
      this.tri([pts[0][0], pts[0][1], z1], [pts[i][0], pts[i][1], z1], [pts[i + 1][0], pts[i + 1][1], z1], mat, [pts[0][0], pts[0][1]], [pts[i][0], pts[i][1]], [pts[i + 1][0], pts[i + 1][1]]);
      this.tri([pts[0][0], pts[0][1], z0], [pts[i + 1][0], pts[i + 1][1], z0], [pts[i][0], pts[i][1], z0], mat, [pts[0][0], pts[0][1]], [pts[i + 1][0], pts[i + 1][1]], [pts[i][0], pts[i][1]]);
    }
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute('aMat', new THREE.Float32BufferAttribute(this.M, 1)); g.setAttribute('aUV', new THREE.Float32BufferAttribute(this.U, 3));
    return g;
  }
}

// tōrō : lanterne de pierre (≈ 1,5 tuile de haut) — socle, fût, plateau, lanterne à fenêtres de flamme, toit en croupe, joyau
function geoLantern() {
  const m = new MB(), F = .1875;
  m.cyl(0, 0, 0, .11, .32, .3, 8, 0);
  m.cyl(0, 0, .11, .66, .09, .08, 8, 0);
  m.cyl(0, 0, .66, .76, .27, .24, 8, 0);
  m.box(-F, .76, -F, F, 1.0933, F, 0);
  // quatre faces de flamme (cellule 5 : cadre de pierre + ouverture), posées juste devant la pierre
  const e = .004, y0 = .76, y1 = 1.0933;
  m.quad([-F, y0, F + e], [F, y0, F + e], [F, y1, F + e], [-F, y1, F + e], 5, [0, y1 - y0], [2 * F, y1 - y0], [2 * F, 0], [0, 0]);
  m.quad([F, y0, -F - e], [-F, y0, -F - e], [-F, y1, -F - e], [F, y1, -F - e], 5, [0, y1 - y0], [2 * F, y1 - y0], [2 * F, 0], [0, 0]);
  m.quad([F + e, y0, F], [F + e, y0, -F], [F + e, y1, -F], [F + e, y1, F], 5, [0, y1 - y0], [2 * F, y1 - y0], [2 * F, 0], [0, 0]);
  m.quad([-F - e, y0, -F], [-F - e, y0, F], [-F - e, y1, F], [-F - e, y1, -F], 5, [0, y1 - y0], [2 * F, y1 - y0], [2 * F, 0], [0, 0]);
  m.hip(0, 0, 1.0933, 1.3, .47, .47, .1, .1, 0);
  m.cyl(0, 0, 1.3, 1.36, .13, .1, 8, 0);
  m.cyl(0, 0, 1.36, 1.5, .07, .02, 8, 0);
  return m.geo();
}

// torii : portique de sanctuaire (≈ 2,3 tuiles de haut, 2 de large) — poteaux laqués effilés, socles noirs, nuki, shimaki et kasagi aux bouts relevés
function geoTorii() {
  const m = new MB(), X = .78;
  for (const s of [-1, 1]) {
    m.cyl(s * X, 0, .14, 2.0, .1, .085, 10, 1, { wrap: true });
    m.cyl(s * X, 0, 0, .14, .135, .125, 10, 2, { cap: true });                 // kamebara noir
  }
  m.box(-X - .2, 1.55, -.05, X + .2, 1.67, .05, 1);                                 // nuki
  m.box(-X - .12, 1.9, -.06, X + .12, 2.04, .06, 1);                                // shimaki (rouge)
  m.box(-.13, 1.68, -.04, .13, 1.9, .04, 2, .3);                                    // gakuzuka (plaque centrale)
  m.box(-1.0, 2.04, -.115, 1.0, 2.15, .115, 2);                                     // kasagi, partie droite
  for (const s of [-1, 1]) m.prism(s > 0 ? [[1.0, 2.04], [1.12, 2.04], [1.26, 2.18], [1.22, 2.27], [1.0, 2.2]] : [[-1.0, 2.2], [-1.22, 2.27], [-1.26, 2.18], [-1.12, 2.04], [-1.0, 2.04]], -.115, .115, 2);
  m.box(-1.0, 2.15, -.115, 1.0, 2.2, .115, 2);
  return m.geo();
}

// bonshō : cloche de bronze sous sa charpente de bois (≈ 2,5 tuiles de haut) — la cloche (mat 6) oscille dans le vertex shader autour de y = 2.2
function geoBell() {
  const m = new MB();
  m.box(-.98, 0, -.62, .98, .12, .62, 4);                                           // plancher
  for (const s of [-1, 1]) { m.box(s * .8 - .1, .12, -.1, s * .8 + .1, 2.2, .1, 4); m.box(s * .8 - .13, .12, -.5, s * .8 + .13, .22, .5, 4, .4); }   // poteaux et patins
  m.box(-.95, 2.2, -.12, .95, 2.34, .12, 2);                                        // poutre
  m.hip(0, 0, 2.34, 2.62, 1.12, .56, .24, .1, 2);                                  // petit toit
  m.box(-.04, 2.1, -.04, .04, 2.2, .04, 6);                                         // anneau de suspension
  m.cyl(0, 0, 1.92, 2.1, .1, .08, 8, 6);                                            // ryūzu
  m.cyl(0, 0, 1.55, 1.92, .31, .12, 10, 6, { wrap: true });                         // épaule
  m.cyl(0, 0, 1.18, 1.55, .38, .31, 10, 6, { wrap: true, cap: false });             // panse
  m.cyl(0, 0, 1.12, 1.18, .44, .38, 10, 6, { wrap: true, cap: false });             // lèvre
  // shumoku : poutre de frappe suspendue devant la cloche (horizontale, selon z), deux cordes
  m.box(-.07, .94, .1, .07, 1.08, .78, 4, .2); m.box(-.05, 1.08, .24, -.03, 2.2, .26, 2); m.box(.03, 1.08, .24, .05, 2.2, .26, 2);
  return m.geo();
}

const geoTree = () => geoForest(false);

export function buildDecor3d(world, key, shared) {
  if (!decor3dOn(key)) return null;
  const th = world.theme, look = LOOK[key], per = { lantern: [], torii: [], bell: [], tree: [] };
  for (const d of world.decor) if (KINDS.has(d.kind)) per[d.kind].push(d);
  const leaves = (th.leaf || ['#9a2e28', '#c0452a', '#d8662e', '#7e2624']).map(c => new THREE.Color(c));   // repli : érables, comme l'ancien sprite
  const base = {
    uTime: shared.uTime, uFog: shared.uFog, uFogD: shared.uFogD, uMist: shared.uMist, uCam: shared.uCam, uLight: shared.uLight, uReg: shared.uReg, uGain: shared.uGain,
    uTex: { value: houseTex(FLOOR.d3img) }, uEmi: { value: houseTex(FLOOR.d3eimg) }, uTexF: { value: houseTex(FLOOR.fimg) },
    uStone: { value: new THREE.Vector3(...look.stone) }, uLacq: { value: new THREE.Vector3(...look.lacq) }, uBronze: { value: new THREE.Vector3(...look.bronze) },
    uEmisCol: { value: new THREE.Vector3(...(th.accent || [255, 225, 130]).map(v => v / 255)) }, uSwing: { value: 0.045 },
  };
  const mk = tree => new THREE.ShaderMaterial({ vertexShader: S.DECOR_VERT, fragmentShader: S.DECOR_FRAG, uniforms: { ...base, uTree: { value: tree ? 1 : 0 } } });
  const matProp = mk(false), matTree = mk(true), group = new THREE.Group(), shadows = [], kinds = new Set();
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), yAx = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
  // placement : centre de l'emprise en x ; z = là où le sprite posait ses pieds (pieds ≈ 2 px sous le bas de l'emprise ; collision resserrée de l'arbre et de la lanterne)
  const PLACE = {
    lantern: d => [d.tx + .5, d.ty + .78, 8], torii: d => [d.tx + 1, d.ty + .8, 26], bell: d => [d.tx + 1, d.ty + 1.5, 24], tree: d => [d.tx + 1, d.ty + 1.75, 20],
  };
  for (const kind of Object.keys(per)) {
    const list = per[kind]; if (!list.length) continue;
    kinds.add(kind);
    const geo = kind === 'lantern' ? geoLantern() : kind === 'torii' ? geoTorii() : kind === 'bell' ? geoBell() : geoTree();
    const mesh = new THREE.InstancedMesh(geo, kind === 'tree' ? matTree : matProp, list.length);
    list.forEach((d, i) => {
      const [x, z, sh] = PLACE[kind](d), r = (d.seed % 7) / 7, s = kind === 'tree' ? 1.85 + r * .5 : 1;
      const rot = kind === 'lantern' || kind === 'tree' ? Math.floor(r * 4) * Math.PI / 2 : 0;
      m4.compose(new THREE.Vector3(x, 0, z), q.setFromAxisAngle(yAx, rot), new THREE.Vector3(s, kind === 'tree' ? 2.3 + r * .6 : 1, s));
      mesh.setMatrixAt(i, m4);
      if (kind === 'tree') col.copy(leaves[(d.seed + i) % leaves.length]).multiplyScalar(.6 + r * .22); else { const k = .88 + ((d.seed * 7) % 13) / 13 * .22; col.setRGB(k, k, k); }
      mesh.setColorAt(i, col);
      shadows.push([x * 24, z * 24 + 2, sh]);
    });
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; mesh.frustumCulled = false;
    group.add(mesh);
  }
  if (!kinds.size) return null;
  return { group, kinds, shadows };
}
