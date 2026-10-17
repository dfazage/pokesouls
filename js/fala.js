// Quête secrète de Fala, le Genesect de la Centrale abandonnée (carte 2).
// - Récompense : Fala rejoint la réserve du feu (voir reserve.js) et peut être échangé contre un compagnon à chaque feu de camp, dans la partie en cours.
// - État de la quête dans la sauvegarde de la partie : prog[carte].fala = { helped, mods (ramassés), given (rapportés), done }.
// - Salle secrète derrière un faux mur (généré dans maps.js), quatre Modules dans les salles de la carte, dialogues.
import { A, drawSprite, TICK } from './assets.js';

// ---------- Modules : l'élément du Module équipé donne celui de l'attaque de relais de Fala ----------
export const MODULES = {
  aqua: { name: 'Aqua', type: 'water', color: '#5db4ff', reward: 'berrypack', line: 'Ça coule en moi. Je me souviens d’une pluie. Pas de laquelle.' },
  pyro: { name: 'Pyro', type: 'fire', color: '#ff8a5c', reward: 'etherpack', line: 'Chaleur... C’est étrange. Ça fait du bien.' },
  cryo: { name: 'Cryo', type: 'ice', color: '#9fe3f2', reward: 'hpup', line: 'Froid... calme. Comme un chant, au loin.' },
  choc: { name: 'Choc', type: 'electric', color: '#ffd23f', reward: 'candy', line: 'Ha ! Mon cœur de métal se rappelle comment battre.' },
};
export const MOD_ORDER = ['aqua', 'pyro', 'cryo', 'choc'];
export const FALA_KEY = 'genesect';

export const DEFAULT_MODULE = 'choc';   // Module équipé par défaut quand Fala rejoint la réserve

// ---------- dialogues (Fala parle par phrases courtes et hésitantes) ----------
const L = (who, text, extra) => ({ who, text, ...extra });
const scene3 = [
  L('Fala', 'Quatre Modules. Pyro, Aqua, Choc, Cryo. Ma plaque chauffera quand tu t’approcheras.'),
  L('Fala', 'Rapporte-les-moi, et je te suivrai de feu en feu.'),
];
const ask = () => L('Fala', 'Mon canon est vide. Mes Modules ont été arrachés. Ils sont éparpillés dans les salles de cette centrale.', {
  choices: [
    { label: 'Je t’aide.', key: 'help', then: [L('Fala', '...Merci. C’est la première fois qu’on me dit ça.'), ...scene3] },
    { label: 'Pourquoi moi ?', key: 'why', again: true, then: [L('Fala', 'Tu es entré ici. Personne ne rentre ici.')] },
    { label: '(Sortir sans rien dire)', key: 'leave', then: [L('Fala', '...Je reste là. Je sais attendre.')] },
  ],
});
export const SCRIPTS = {
  meet: () => [
    L('???', '...Systèmes... en veille prolongée...'),
    L('???', '...Présence détectée. Espèce inconnue. Hostilité : faible.'),
    L('Fala', '...Ne pars pas. Je crois que je m’appelle Fala. C’est écrit sur ma plaque. Quelqu’un l’a gravé. Je ne me souviens plus qui.'),
    L('Fala', 'Ils m’ont réveillé il y a longtemps. Puis ils sont partis. Ils ont oublié de m’éteindre... ou ils ne voulaient pas.'),
    ask(),
  ],
  ask: () => [ask()],
  waiting: n => [L('Fala', n ? `${n} sur 4. Ma plaque chauffera quand tu t’approcheras.` : 'Quatre Modules. Pyro, Aqua, Choc, Cryo. Ma plaque chauffera quand tu t’approcheras.')],
  deliver: ids => ids.map(id => L('Fala', MODULES[id].line, { module: id })),
  finale: () => [
    L('Fala', 'Tous les quatre. Je suis... presque entier.'),
    L('Fala', 'Je ne sais pas ce que j’étais avant eux. Mais je sais ce que je veux être : celui qui reste.'),
    L('Fala', 'Va. Tu mourras, tu reviendras. Moi, je serai là, à chaque feu.'),
  ],
  // explications affichées juste après la quête : comment utiliser les compagnons de la réserve
  tuto: () => [
    L('Réserve du feu', 'Fala rejoint la réserve du feu. Les Pokémon bonus que tu recrutes y attendent, à l’abri.', { system: true }),
    L('Réserve du feu', 'À chaque feu de camp, ouvre « Réserve » pour l’échanger contre l’un de tes trois compagnons. C’est gratuit.', { system: true }),
    L('Réserve du feu', 'Celui qui sort garde son niveau, ses vitamines et sa CT. Il reste à la réserve et peut revenir au feu suivant.', { system: true }),
    L('Réserve du feu', 'Fala change d’élément avec ses Modules : Aqua, Pyro, Cryo ou Choc. Choisis-en un dans la Réserve ou au feu de camp.', { system: true }),
  ],
  done: () => [L('Fala', 'Va. Quand tu reviendras, je serai là.')],
  together: () => [L('Fala', 'Je suis avec toi. Où que tu ailles, je reste.')],
};

// ---------- rendu (liste de dessin partagée 2D / HD-2D) ----------
const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
function drawModule(ctx, g, mod, x, y) {
  const M = MODULES[mod.id], [r, gr, b] = hexRgb(M.color), t = g.t, bob = Math.sin(t * 3 + mod.tx) * 2, cy = y - 12 + bob;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x, y, 7 - bob * 0.3, 3, 0, 0, 7); ctx.fill();
  ctx.fillStyle = `rgba(${r},${gr},${b},.22)`; ctx.beginPath(); ctx.ellipse(x, cy, 11, 11, 0, 0, 7); ctx.fill();
  ctx.fillStyle = M.color; ctx.beginPath(); ctx.moveTo(x, cy - 8); ctx.lineTo(x + 5, cy); ctx.lineTo(x, cy + 8); ctx.lineTo(x - 5, cy); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.moveTo(x, cy - 8); ctx.lineTo(x + 2, cy - 1); ctx.lineTo(x - 1, cy + 1); ctx.lineTo(x - 5, cy); ctx.closePath(); ctx.fill();
}
function drawFala(ctx, g, x, y) {
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(x, y, 10, 4, 0, 0, 7); ctx.fill();
  if (A.db[FALA_KEY]) drawSprite(ctx, FALA_KEY, 'Idle', g.t / TICK, true, 0, x, y, {});
  // plaque : s'allume de la couleur des Modules déjà rapportés
  const q = g.falaQ(), n = q.given.length; if (n) { const M = MODULES[q.given[(Math.floor(g.t * 0.8)) % n]]; ctx.fillStyle = M.color; ctx.globalAlpha = 0.6 + 0.3 * Math.sin(g.t * 4); ctx.fillRect(x - 2, y - 14, 4, 3); ctx.globalAlpha = 1; }
}

// repère de quête flottant : « ! » quête à prendre, « ? » mystère / quête à rendre
function drawMark(ctx, g, x, y, ch, color) {
  const bob = Math.sin(g.t * 4) * 3, cy = y - 46 + bob, pulse = 0.5 + 0.5 * Math.sin(g.t * 5);
  ctx.fillStyle = `rgba(0,0,0,.3)`; ctx.beginPath(); ctx.ellipse(x, y, 5, 2, 0, 0, 7); ctx.fill();
  const [r, gr, b] = hexRgb(color);
  ctx.fillStyle = `rgba(${r},${gr},${b},${0.18 + 0.18 * pulse})`; ctx.beginPath(); ctx.arc(x, cy, 15 + 2 * pulse, 0, 7); ctx.fill();
  ctx.fillStyle = '#0b0e24'; ctx.beginPath(); ctx.arc(x, cy, 10, 0, 7); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
  ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(ch, x, cy + 1); ctx.textBaseline = 'alphabetic';
}
const HINTS = {
  aqua: 'Dans la salle voisine de la cachette de Fala.',
  pyro: 'Là où les générateurs tournaient encore, il y a longtemps.',
  cryo: 'Près des commandes, dans la pièce qui garde le froid.',
  choc: 'Juste avant le cœur de la centrale, là où le courant gronde.',
};

// ---------- mixin Game ----------
export function installFala(Game, { M, TS, SFX, hyp }) {
  const P = Game.prototype;
  P.falaProg = function () { return this.prog[this.mapIdx]; };
  P.falaQ = function () {
    const pr = this.prog[1]; // la quête n'existe que dans le monde d'Électhor
    if (!pr) return { helped: false, wall: false, done: false, mods: [], given: [] };   // chapitre sans cette carte (Johto) : quête inerte
    const q = pr.fala || (pr.fala = {});
    q.helped = !!q.helped; q.wall = !!q.wall; q.done = !!q.done; q.mods = q.mods || []; q.given = q.given || [];
    return q;
  };
  P.hasFala = function () { return !!(this.world && this.world.def.fala); };
  // restaure l'état de la carte à l'entrée (salle secrète déjà ouverte)
  P.falaEnter = function () {
    this.falaHinted = new Set();
    if (!this.hasFala()) return;
    const q = this.falaQ(); if (q.wall) M.openSecret(this.world);
    if (q.done && !this.hasMember(FALA_KEY)) this.recruit(FALA_KEY);   // parties déjà terminées avant la réserve du feu
  };

  P.breakSecret = function () {
    if (!this.world.secret || !M.openSecret(this.world)) return;
    this.falaQ().wall = true;
    this.floors[this.mapIdx] = this.floor = M.bakeFloor(this.world);
    this.world = { ...this.world };     // nouvelle référence : le rendu HD-2D reconstruit murs et sol
    SFX.door(); this.shake && this.shake(3, 0.3);
    this.emit('toast', 'Un mur illusoire se dissipe'); this.save();
  };
  P.falaNpcPos = function () { const s = this.world.secret; return s && s.opened && !this.falaQ().done ? { x: (s.npc.tx + 0.5) * TS, y: (s.npc.ty + 0.5) * TS } : null; };

  P.updateFala = function (dt) {
    if (!this.hasFala()) return;
    const w = this.world, c = this.chief(), q = this.falaQ(), s = w.secret;
    // faux mur : un coup porté à proximité le dissipe ; il scintille quand on s'en approche
    if (s && !s.opened) {
      const gx = (s.gap[0][0] + s.gap[1][0] + 1) / 2 * TS, gy = (s.gap[0][1] + s.gap[1][1] + 1) / 2 * TS, d = hyp(gx - c.x, gy - c.y);
      if (d < 230) {
        this.falaT = (this.falaT || 0) - dt;
        if (this.falaT <= 0) { this.falaT = 0.14; const t = s.gap[Math.floor(Math.random() * 2)]; this.parts.push({ x: (t[0] + Math.random()) * TS, y: (t[1] + 0.3 + Math.random() * 0.7) * TS, z: 4 + Math.random() * 10, vx: 0, vy: 0, vz: 10, life: 0.9, max: 0.9, c: '#7fe0c0', size: 1 }); }
      }
      if (d < 46 && c.atk) this.breakSecret();
    }
    // Fala
    const np = this.falaNpcPos();
    if (np && hyp(np.x - c.x, np.y - c.y) < 44) this.prompt = { text: 'Parler à Fala', act: () => this.talkFala() };
    // Modules : visibles et ramassables une fois la quête acceptée
    if (q.helped) for (const m of w.modules) {
      if (q.mods.includes(m.id)) continue;
      const mx = (m.tx + 0.5) * TS, my = (m.ty + 0.5) * TS, d = hyp(mx - c.x, my - c.y);
      if (d < 150 && !this.falaHinted.has(m.id)) { this.falaHinted.add(m.id); this.emit('toast', 'La plaque de Fala chauffe...'); }
      if (d < 30) this.prompt = { text: `Ramasser le Module ${MODULES[m.id].name}`, act: () => this.takeModule(m) };
    }
  };
  P.takeModule = function (m) {
    const q = this.falaQ(); if (q.mods.includes(m.id)) return;
    q.mods.push(m.id); SFX.pick(); this.floatText && this.floatText(this.chief().x, this.chief().y - 30, MODULES[m.id].name, MODULES[m.id].color);
    this.emit('toast', `Module ${MODULES[m.id].name} récupéré · à rapporter à Fala (${q.given.length}/4 rapportés)`); this.save();
  };

  P.talkFala = function () {
    const q = this.falaQ();
    const open = (lines, done) => this.emit('dialogue', { lines, done });
    if (q.done) return open(this.team.some(m => m.key === FALA_KEY) ? SCRIPTS.together() : SCRIPTS.done());
    if (!q.helped) {
      const first = !q.met; q.met = true;
      return open(first ? SCRIPTS.meet() : SCRIPTS.ask(), res => { if (res === 'help') { q.helped = true; this.emit('toast', 'Nouvelle quête : Les Modules de Fala (0/4)'); } this.save(); });
    }
    const carried = q.mods.filter(id => !q.given.includes(id));
    if (!carried.length) return open(SCRIPTS.waiting(q.given.length));
    // remise des Modules rapportés, un dialogue court par Module
    const finishing = q.given.length + carried.length >= 4;
    const lines = SCRIPTS.deliver(carried); if (finishing) lines.push(...SCRIPTS.finale());
    open(lines, () => {
      for (const id of carried) { q.given.push(id); const name = this.give(MODULES[id].reward); this.emit('toast', `${MODULES[id].name} remis · ${name} · ${q.given.length}/4`); }
      if (finishing) {
        q.done = true; this.recruit(FALA_KEY); SFX.pick(); this.emit('jingle', 'JINGLE_CAMPFIRE'); this.emit('banner', 'FALA REJOINT LA RÉSERVE', 'fire'); this.emit('dialogue', { lines: SCRIPTS.tuto() });
      }
      this.save();
    });
  };

  // Module équipé : change l'élément de Fala (gratuit, au feu de camp ou à la réserve)
  P.setModuleOf = function (m, id) {
    if (!m || m.key !== FALA_KEY || !MODULES[id]) return;
    m.mod = id; m.type = MODULES[id].type;
    this.fixTm(m);
    this.applyLevels(false); this.save();
  };
  P.setModule = function (i, id) { this.setModuleOf(this.team[i], id); };

  // dessin et lumières
  P.falaDraw = function (inView) {
    const out = [];
    if (!this.hasFala()) return out;
    const q = this.falaQ(), np = this.falaNpcPos();
    if (np && inView(np.x, np.y)) {
      out.push({ x: np.x, y: np.y, f: c => drawFala(c, this, np.x, np.y) });
      const carried = q.mods.some(id => !q.given.includes(id));
      const ch = q.done ? null : !q.helped ? '!' : carried ? '?' : null;
      if (ch) out.push({ x: np.x, y: np.y + 1, f: c => drawMark(c, this, np.x, np.y - 22, ch, '#ffd23f') });
    }
    // faux mur : repère « ? » visible de loin
    const s = this.world.secret;
    if (s && !s.opened) {
      const gx = (s.gap[0][0] + s.gap[1][0] + 1) / 2 * TS, gy = (s.gap[0][1] + s.gap[1][1] + 1) / 2 * TS, n = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[s.side];
      const fx = gx + n[0] * TS * 0.9, fy = gy + n[1] * TS * 0.9, c = this.chief();
      if (hyp(fx - c.x, fy - c.y) < 380 && inView(fx, fy, 120)) out.push({ x: fx, y: fy, f: ctx => drawMark(ctx, this, fx, fy, '?', '#7fe0c0') });
    }
    if (q.helped) for (const m of this.world.modules) {
      if (q.mods.includes(m.id)) continue;
      const x = (m.tx + 0.5) * TS, y = (m.ty + 0.5) * TS; if (inView(x, y)) out.push({ x, y, f: c => drawModule(c, this, m, x, y) });
    }
    return out;
  };
  // journal de quêtes (onglet Quêtes du menu Équipe)
  P.questLog = function () {
    const q = this.falaQ(); if (!q.helped) return [];
    const steps = MOD_ORDER.map(id => ({ id, name: 'Module ' + MODULES[id].name, color: MODULES[id].color, state: q.given.includes(id) ? 'given' : q.mods.includes(id) ? 'carried' : 'missing', hint: HINTS[id] }));
    const carried = q.mods.filter(id => !q.given.includes(id)).length;
    return [{ id: 'fala', title: 'Les Modules de Fala', zone: 'Centrale abandonnée', status: q.done ? 'done' : 'active', progress: `${q.given.length}/4`, steps,
      summary: q.done ? 'Fala t’attend à la réserve du feu.' : carried ? `${carried} Module${carried > 1 ? 's' : ''} à rapporter à Fala.` : 'Retrouve les Modules arrachés à Fala.',
      reward: 'Fala rejoint la réserve du feu (échangeable à chaque feu de camp) · un objet par Module' }];
  };
  P.falaLights = function () {
    const out = [];
    if (!this.hasFala()) return out;
    const q = this.falaQ(), np = this.falaNpcPos(), c = this.chief();
    if (np) out.push({ x: np.x, y: np.y - 10, r: 70, c: [127, 224, 192], a: 0.55 });
    if (q.helped) for (const m of this.world.modules) {
      if (q.mods.includes(m.id)) continue;
      const x = (m.tx + 0.5) * TS, y = (m.ty + 0.5) * TS, d = hyp(x - c.x, y - c.y), k = Math.max(0, 1 - d / 240);   // la lueur grandit quand on s'approche
      out.push({ x, y: y - 10, r: 28 + 40 * k + 4 * Math.sin(this.t * 6), c: hexRgb(MODULES[m.id].color), a: 0.3 + 0.6 * k });
    }
    return out;
  };
}
