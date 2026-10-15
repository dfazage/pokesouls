// Effets visuels d'attaque : planches d'animation jouées par-dessus le jeu. Source principale : effets pixel art de PMDCollab / Pokémon Mystery Dungeon (m.px dans fx.json),
// repli sur Dämmerlicht BFX (KotatsuAkira), PIPO Fire et Anton Chi pour les clés non remplacées. Les planches px sont affichées au plus proche voisin, à une échelle entière (≈ 64 px par unité d échelle), sans fusion additive.
// Les feuilles sont décrites dans assets/fx.json (fichier, taille d'une frame, colonnes, nombre de frames) et chargées en arrière-plan :
// tant qu'une feuille n'est pas arrivée, l'effet est simplement ignoré (le jeu garde ses éclats et anneaux d'origine).

export const FXS = { man: {}, img: {}, ready: false };
// Les planches PMD ont des frames de 16 à 160 px (Dämmerlicht : 192) : on les agrandit par pas entiers pour garder une taille à l'écran comparable.
const pxScale = m => m.sc || Math.min(4, Math.max(1, Math.round(64 / Math.max(m.fw, m.fh))));

export async function loadFx() {
  try { FXS.man = await (await fetch('assets/fx.json')).json(); } catch (e) { FXS.man = {}; return; }
  const keys = Object.keys(FXS.man);
  await Promise.all(keys.map(k => new Promise(res => { const i = new Image(); i.onload = () => { FXS.img[k] = i; res(); }; i.onerror = res; i.src = 'assets/' + FXS.man[k].file; })));
  FXS.ready = true;
}

// ---------------------------------------------------------------- tables d'association
// Éclat au point d'impact, par élément (clé, échelle).
const HIT = {
  normal: ['tackle', 0.55], fire: ['ember', 0.6], water: ['brine', 0.6], grass: ['leafblade', 0.7], electric: ['spark', 0.5], psychic: ['confusion', 0.4],
  ground: ['dig', 0.5], ghost: ['shadowclaw', 0.55], dark: ['feintattack', 0.4], fighting: ['machpunch', 0.6], steel: ['metalclaw', 0.55], poison: ['crosspoison', 0.6],
  flying: ['aircutter', 0.55], bug: ['xscissor', 0.5], fairy: ['astonish', 0.6], dragon: ['darkblade', 0.55], rock: ['skullbash', 0.5], ice: ['frostbone', 0.55],
};
// Statuts : effet qui suit la créature tant que le statut dure.
const STAT = {
  burn: ['firespin', 0.5, 10, true], poison: ['poisonpowder', 0.6, 16, false], freeze: ['iceball', 0.65, 12, true], para: ['thunderwave', 0.5, 10, true], confuse: ['confusion', 0.38, 30, true],
};
// Capacités (CT) : self = sur le lanceur, front = devant lui, trail/boom = sur le projectile, beam = le long d'un rayon, team = sur chaque soigné, ring = autour.
// [clé, échelle, options]
const TMFX = {
  ct_flamethrower: { front: [['flamethrower', 0.8, { dist: 22, dur: 0.55, glow: '#ff8a30' }], ['flamethrower', 0.85, { dist: 42, delay: 0.06, dur: 0.55 }], ['flamethrower', 0.9, { dist: 62, delay: 0.12, dur: 0.55 }], ['ember', 0.8, { dist: 36, add: true }]] },
  ct_fireblast: { self: [['ember', 0.6, { add: true }]], trail: ['pipofire', 0.42, { loop: true, glow: '#ff6a30' }], boom: ['fireblast', 0.95, { add: true, dur: 0.6, glow: '#ff6a30' }] },
  ct_surf: { self: [['whirlpool', 1.25, { ground: true, dur: 0.7, glow: '#5ab8ff' }], ['brine', 1.5, { add: true, dur: 0.6 }]] },
  ct_hydro: { beamSheet: ['watercannon', 0.85] },
  ct_icebeam: { beam: ['frostbone', 0.5, 6, { add: true }], self: [['iceball', 0.55, { add: true }]] },
  ct_megadrain: { self: [['vinewhip', 0.6, { add: true }]], trail: ['leafblade', 0.5, { loop: true }], boom: ['vinewhip', 0.7, { add: true }] },
  ct_solar: { self: [['moonlight', 0.8, { add: true, dur: 0.5, glow: '#d4ff6a' }]], beam: ['spark', 0.45, 6, { add: true }] },
  ct_bodyslam: { front: [['bodyslam', 0.95, { dist: 20, add: true, glow: '#ffe27a' }]] },
  ct_earthquake: { self: [['dig', 1.7, { ground: true, dur: 0.7 }]], ring: ['earthpower', 0.6, 6, 0.55] },
  ct_swift: { front: [['headbutt', 0.6, { dist: 18, add: true }]] },
  ct_thunder: { self: [['charge', 0.5, { add: true }]], trail: ['electroball', 0.42, { loop: true, add: true, glow: '#ffe84a' }], boom: ['thunderbolt', 1.0, { add: true, dur: 0.5, glow: '#ffe84a' }] },
  ct_psychic: { self: [['cosmicpower', 0.55, { add: true }]], trail: ['extrasensory', 0.4, { loop: true, add: true, glow: '#ff9aff' }], boom: ['extrasensory', 1.0, { add: true, dur: 0.55, glow: '#ff9aff' }] },
  ct_teleport: { self: [['teleport', 0.8, { add: true, dur: 0.45 }]] },
  ct_swords: { self: [['swordsdance', 0.9, { add: true, dur: 0.7 }]] },
  ct_hyper: { self: [['flashcannon', 0.7, { add: true, dur: 0.6 }]], beam: ['plasmaburst', 0.55, 6, { add: true }] },
  ct_softboiled: { team: [['recover', 1.0, { add: true, dur: 0.7 }]], self: [['healingwish', 0.9, { add: true, dur: 0.8, glow: '#ffb0d8' }]] },
  ct_synthesis: { team: [['ingrain', 0.9, { add: true, dur: 0.7 }]], self: [['aromatherapy', 0.9, { add: true, dur: 0.8, glow: '#9cff8a' }]] },
  ct_aquaring: { follow: ['aquaring', 0.8, 8] },
  ct_healbell: { team: [['aromatherapy', 0.8, { add: true, dur: 0.8 }]], self: [['safeguard', 0.8, { add: true, dur: 0.7, glow: '#ffe9a0' }]] },
};
// Repli par nature de capacité si la CT n'a pas sa propre entrée.
const KINDFX = {
  flame: TMFX.ct_flamethrower, burst: TMFX.ct_fireblast, shock: TMFX.ct_earthquake, beam: TMFX.ct_hyper, lunge: TMFX.ct_bodyslam, haste: TMFX.ct_swords,
  heal: TMFX.ct_softboiled, cleanse: TMFX.ct_healbell, regen: TMFX.ct_aquaring, smoke: TMFX.ct_teleport, volley: TMFX.ct_swift, leech: TMFX.ct_megadrain,
};
// Attaques signature (extras.js), par genre puis par type de starter.
const SIGTYPE = { fire: 'firespin', water: 'whirlpool', grass: 'razorwind' };

// ---------------------------------------------------------------- installation sur la classe Game
export function installFx(Game, { D }) {
  const P = Game.prototype;
  let tmIds = null;
  const tmId = tm => { if (!tmIds) { tmIds = new Map(); for (const [id, t] of Object.entries(D.TMS)) tmIds.set(t, id); } return tmIds.get(tm); };

  // Lance un effet. Options : scale, rot, z (hauteur), add (fusion lumineuse), alpha, dur (secondes pour toute l'animation), fps, delay, loop,
  // life (durée max d'une boucle), follow (objet suivi), cond (arrêt quand faux), hue (degrés), flip, anchor 'l' (origine à gauche), ground (sous les entités), glow (couleur de lueur).
  P.fx = function (key, x, y, o = {}) {
    const m = FXS.man[key]; if (!m || !FXS.img[key]) return null;
    if (m.px) o = { ...o, add: false, scale: (o.scale || 0.6) * pxScale(m) };
    if (!this.fxs) this.fxs = [];
    if (this.fxs.length > 70) return null;
    const fps = o.fps || (o.dur ? m.n / o.dur : 26);
    const f = { k: key, x, y, z: o.z != null ? o.z : 10, t: -(o.delay || 0), fps, n: m.n, scale: o.scale || 0.6, rot: o.rot || 0, add: !!o.add, alpha: o.alpha != null ? o.alpha : 1,
      loop: !!o.loop, life: o.life || 6, follow: o.follow || null, cond: o.cond || null, hue: o.hue || 0, flip: o.flip ? -1 : 1, anchor: o.anchor || null, ground: !!o.ground, glow: o.glow || null, tag: o.tag || null, ox: o.ox || 0, oy: o.oy || 0 };
    this.fxs.push(f); return f;
  };
  P.updateFxs = function (dt) {
    const L = this.fxs; if (!L || !L.length) return;
    for (const f of L) {
      f.t += dt;
      if (f.follow) { if (f.follow.dead || f.follow.exh) f.done = true; else { f.x = f.follow.x + f.ox; f.y = f.follow.y + f.oy; } }
      if (f.cond && !f.cond()) f.done = true;
      if (f.loop ? f.t > f.life : f.t * f.fps >= f.n) f.done = true;
    }
    this.fxs = L.filter(f => !f.done);
  };
  // éclat à l'impact d'un coup sur un ennemi
  P.fxHit = function (e, src, o, crit) {
    if (!this.fxs) return;
    if (this.fxs.some(f => f.tag === e && f.t < 0.08 && f.t >= 0)) return; // un seul éclat par coup d'une même salve
    const el = o.elem || this.curElem || 'normal', h = HIT[el] || HIT.normal;
    const big = o.sig ? 1.5 : o.heavy ? 1.2 : 1, bs = e.boss ? 1.35 : 1;
    this.fx(h[0], e.x, e.y, { scale: h[1] * big * bs * (crit ? 1.2 : 1), z: 14, add: true, tag: e, rot: el === 'normal' ? 0 : Math.random() * 6.28, flip: Math.random() < 0.5, dur: 0.35 });
  };
  // la créature touchée porte l'effet de son statut
  P.fxStatus = function (ent, k) {
    const s = STAT[k]; if (!s) return;
    if (this.fxs && this.fxs.some(f => f.follow === ent && f.sk === k)) return;
    const f = this.fx(s[0], ent.x, ent.y, { scale: s[1], z: s[2], loop: true, add: s[3], follow: ent, life: 30, fps: 20, cond: () => !ent.dead && ent.fx && ent.fx.k === k });
    if (f) f.sk = k;
  };
  // coup de base : entaille devant l'attaquant
  P.fxSwing = function (m, aim, range, heavy) {
    this.swingN = ((this.swingN || 0) + 1) % 3;
    const key = heavy ? 'crosschop' : ['scratch', 'slash', 'furyswipes'][this.swingN];
    this.fx(key, m.x + aim.x * range * 0.7, m.y + aim.y * range * 0.7, { scale: heavy ? 0.75 : 0.6, z: 12, add: true, flip: aim.x < 0, dur: 0.28 });
  };
  // capacité de CT : appelée après la capacité (np = nombre de projectiles avant le tir)
  P.fxAbility = function (m, tm, aim, ang, np) {
    const S = TMFX[tmId(tm)] || KINDFX[tm.kind]; if (!S) return;
    const rad = tm.radius || 60;
    if (S.self) for (const [k, sc, o] of S.self) this.fx(k, m.x, m.y, { scale: o.ground ? sc * (tm.kind === 'shock' ? rad / 62 : 1) : sc, z: o.ground ? 0 : 12, ...o });
    if (S.front) for (const [k, sc, o] of S.front) this.fx(k, m.x + aim.x * (o.dist || 20), m.y + aim.y * (o.dist || 20), { scale: sc, z: 10, ...o });
    if (S.ring) { const [k, sc, n, rr] = S.ring; for (let i = 0; i < n; i++) { const a = i / n * 6.283; this.fx(k, m.x + Math.cos(a) * rad * rr, m.y + Math.sin(a) * rad * rr * 0.7, { scale: sc, z: 4, delay: i * 0.04, add: true, dur: 0.5 }); } }
    if (S.beam) { const [k, sc, n, o] = S.beam; for (let i = 1; i <= n; i++) this.fx(k, m.x + aim.x * 200 * i / n, m.y - 6 + aim.y * 200 * i / n, { scale: sc, z: 6, delay: i * 0.03, dur: 0.4, ...o }); }
    if (S.beamSheet) { const [k, sc] = S.beamSheet; this.fx(k, m.x + aim.x * 8, m.y - 6 + aim.y * 8, { scale: sc, z: 6, rot: ang, anchor: 'l', dur: 0.4, flip: false }); }
    if (S.team) for (const q of this.team) { if (q.exh) continue; for (const [k, sc, o] of S.team) this.fx(k, q.x, q.y, { scale: sc, z: 10, ...o }); }
    if (S.follow) { const [k, sc, life] = S.follow; this.fx(k, m.x, m.y, { scale: sc, z: 4, loop: true, life, follow: m, add: true, alpha: 0.85, fps: 18, cond: () => m.regen && m.regen.t > 0 }); }
    if ((S.trail || S.boom) && np != null) for (let i = np; i < this.projs.length; i++) {
      const p = this.projs[i]; if (S.boom) p.fxBoom = S.boom;
      if (S.trail && i - np < 3) { const [k, sc, o] = S.trail; this.fx(k, p.x, p.y, { scale: sc, z: 8, follow: p, life: 3, fps: 24, ...o }); }
    }
  };
  // explosion d'un projectile
  P.fxBoom = function (p) {
    const b = p.fxBoom || (p.team === 'p' ? ['fireblast', 0.7, { add: true, dur: 0.5, glow: '#ff8a30' }] : ['selfdestruct', 0.55, { add: true, dur: 0.5 }]);
    this.fx(b[0], p.x, p.y, { scale: b[1], z: 8, ...b[2] });
  };
  // attaque signature (starters)
  P.fxSig = function (m, a, sg) {
    const aim = a.aim, ang = Math.atan2(aim.y, aim.x), T = m.type, add = { add: true };
    switch (sg.kind) {
      case 'cross':
        this.fx('crosschop', m.x + aim.x * 26, m.y + aim.y * 26, { scale: 0.95, z: 12, dur: 0.35, glow: sg.color, ...add });
        this.fx('xscissor', m.x + aim.x * 26, m.y + aim.y * 26, { scale: 1.0, z: 12, delay: 0.14, dur: 0.35, ...add }); break;
      case 'whirl':
        this.fx(SIGTYPE[T] || 'firespin', m.x, m.y, { scale: sg.radius / 38, z: 12, dur: 0.6, glow: sg.color, ...add });
        this.fx('whirlpool', m.x, m.y, { scale: sg.radius / 50, z: 0, ground: true, dur: 0.6, ...add }); break;
      case 'blast':
        for (let i = 0; i < 3; i++) this.fx('ember', m.x + aim.x * (14 + i * 16), m.y + aim.y * (14 + i * 16), { scale: 0.8, z: 10, delay: i * 0.05, ...add });
        for (let i = 0; i < this.projs.length; i++) { const p = this.projs[i]; if (p.sig && p.explode && !p.fxBoom) { p.fxBoom = ['fireblast', 0.8, { add: true, dur: 0.55, glow: sg.color }]; if (i % 2 === 0) this.fx('pipofire', p.x, p.y, { scale: 0.4, z: 8, loop: true, follow: p, life: 3, fps: 24, glow: sg.color }); } }
        break;
      case 'rush':
        for (let i = 0; i < 6; i++) this.fx('brine', m.x + aim.x * i * 17, m.y - 4 + aim.y * i * 17, { scale: 0.7, z: 8, delay: i * 0.03, dur: 0.35, ...add });
        this.fx('aerialace', m.x + aim.x * 48, m.y + aim.y * 48, { scale: 1.4, z: 8, rot: ang, dur: 0.3, ...add }); break;
      case 'fan':
        this.fx('vinewhip', m.x + aim.x * 22, m.y + aim.y * 22, { scale: 0.7, z: 10, dur: 0.35, ...add });
        this.fx('leafblade', m.x + aim.x * 40, m.y + aim.y * 40, { scale: 0.8, z: 10, delay: 0.12, dur: 0.35, ...add }); break;
      case 'leaves':
        for (let i = 0; i < 6; i++) { const q = i / 6 * 6.283; this.fx('leafblade', m.x + Math.cos(q) * 24, m.y + Math.sin(q) * 17, { scale: 0.6, z: 10, delay: i * 0.03, dur: 0.4, ...add }); }
        this.fx('razorwind', m.x, m.y, { scale: 1.0, z: 12, dur: 0.5, glow: sg.color, ...add }); break;
      case 'sun':
        this.fx('moonlight', m.x, m.y, { scale: 1.0, z: 12, dur: 0.5, glow: sg.color, ...add });
        for (let i = 1; i <= 7; i++) this.fx('spark', m.x + aim.x * 230 * i / 7, m.y - 6 + aim.y * 230 * i / 7, { scale: 0.55, z: 6, delay: i * 0.03, dur: 0.4, ...add }); break;
      case 'storm': break; // les impacts jouent leurs effets dans leur rappel différé (extras.js)
      default: break;
    }
  };
  // touche de développement : F8 fait défiler tous les effets devant le chef (Maj+F8 : en arrière)
  P.fxCycle = function (back) {
    const ks = Object.keys(FXS.man).filter(k => FXS.img[k]); if (!ks.length) { this.emit('toast', 'Effets non chargés'); return; }
    this.fxIdx = ((this.fxIdx == null ? -1 : this.fxIdx) + (back ? -1 : 1) + ks.length) % ks.length;
    const k = ks[this.fxIdx], c = this.chief();
    this.fx(k, c.x + c.face.x * 46, c.y + c.face.y * 46, { scale: FXS.man[k].fw > 192 ? 0.85 : 0.9, z: 14, add: true, dur: 0.9, rot: 0 });
    this.emit('toast', 'FX ' + (this.fxIdx + 1) + '/' + ks.length + ' : ' + k);
  };
}

// ---------------------------------------------------------------- dessin
// hook (rendu HD-2D) : { ctxFor(f) -> contexte cible, place(ctx, f) -> false pour ignorer l'effet (sinon positionne le contexte) }
export function drawFxs(g, ctx0, ground, hook) {
  const L = g.fxs; if (!L || !L.length) return;
  if (!hook) { ctx0.save(); }
  for (const f of L) {
    if (f.t < 0 || !!f.ground !== ground) continue;
    const img = FXS.img[f.k], m = FXS.man[f.k]; if (!img) continue;
    let i = Math.floor(f.t * f.fps); if (f.loop) i %= f.n; else if (i >= f.n) continue;
    const c = i % m.cols, r = (i / m.cols) | 0;
    let a = f.alpha; if (f.loop) a *= Math.min(1, f.t / 0.12);
    const ctx = hook ? hook.ctxFor(f) : ctx0;
    ctx.save(); ctx.imageSmoothingEnabled = !m.px;
    ctx.globalAlpha = a; ctx.globalCompositeOperation = hook ? 'source-over' : f.add ? 'lighter' : 'source-over';
    ctx.filter = f.hue ? `hue-rotate(${f.hue}deg)` : 'none';
    if (hook) { if (!hook.place(ctx, f)) { ctx.restore(); continue; } } else ctx.translate(Math.round(f.x), Math.round(f.y - f.z));
    if (f.rot) ctx.rotate(f.rot); ctx.scale(f.scale * f.flip, f.scale);
    ctx.drawImage(img, c * m.fw, r * m.fh, m.fw, m.fh, f.anchor === 'l' ? 0 : -m.fw / 2, -m.fh / 2, m.fw, m.fh);
    ctx.restore();
  }
  if (!hook) ctx0.restore();
}
// lueurs additives des effets (utilisées par l'éclairage)
export function fxLights(g) {
  const out = [];
  if (g.fxs) for (const f of g.fxs) if (f.glow && f.t >= 0) {
    const life = f.loop ? 1 : f.n / f.fps, k = f.loop ? 1 : Math.max(0, 1 - f.t / life);
    out.push({ x: f.x, y: f.y - f.z, r: 28 + f.scale * 60, c: f.glow, a: 0.8 * k });
  }
  return out;
}
