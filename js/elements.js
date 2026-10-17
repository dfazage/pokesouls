// Moteur d'éléments : marques élémentaires (2 maximum par cible), réactions, table des types, surfaces de terrain, relais, traits de boss.
// installElements() ajoute ces méthodes à la classe Game (même principe que extras.js).
// Tous les chiffres sont des valeurs de départ à équilibrer.

import { relayOf } from './relay.js';

// ---------- table des types ----------
// [fort contre, faible contre] ; le multiplicateur reste modéré : x1,25 / x1 / x0,8 (jamais de x0 ni x2)
const chart = (s, w) => ({ s: s.split(' ').filter(Boolean), w: w.split(' ').filter(Boolean) });
export const TYPE_CHART = {
  fire: chart('grass ice bug steel', 'water fire rock dragon'),
  water: chart('fire ground rock', 'water grass dragon'),
  grass: chart('water ground rock', 'fire grass poison flying bug dragon steel'),
  electric: chart('water flying', 'electric grass ground dragon'),
  ice: chart('grass ground flying dragon', 'fire water ice steel'),
  ground: chart('fire electric poison rock steel', 'grass bug flying'),
  rock: chart('fire ice flying bug', 'fighting ground steel'),
  fighting: chart('normal ice rock dark steel', 'flying poison psychic bug fairy ghost'),
  psychic: chart('fighting poison', 'psychic steel dark'),
  poison: chart('grass fairy', 'poison ground rock ghost'),
  flying: chart('grass fighting bug', 'electric rock steel'),
  ghost: chart('psychic ghost', 'dark normal'),
  dark: chart('psychic ghost', 'fighting dark fairy'),
  dragon: chart('dragon', 'steel fairy'),
  steel: chart('ice rock fairy', 'fire water electric steel'),
  fairy: chart('fighting dragon dark', 'fire poison steel'),
  normal: chart('', 'rock steel ghost'),
};
export function typeMult(att, defTypes) {
  const c = TYPE_CHART[att]; if (!c || !defTypes) return 1;
  let n = 0; for (const t of defTypes) { if (c.s.includes(t)) n++; if (c.w.includes(t)) n--; }
  return n > 0 ? 1.25 : n < 0 ? 0.8 : 1;
}

// types des ennemis (le premier est celui de leurs attaques)
export const ENEMY_TYPES = {
  seel: ['water'], shellder: ['water'], krabby: ['water'], dewgong: ['water', 'ice'], starmie: ['water', 'psychic'], cloyster: ['water', 'ice'], lapras: ['water', 'ice'],
  magnemite: ['electric', 'steel'], voltorb: ['electric'], pikachu: ['electric'], magneton: ['electric', 'steel'], electrode: ['electric'], raichu: ['electric'], electabuzz: ['electric'],
  vulpix: ['fire'], growlithe: ['fire'], ponyta: ['fire'], ninetales: ['fire'], rapidash: ['fire'], arcanine: ['fire'], magmar: ['fire'],
  machop: ['fighting'], geodude: ['rock', 'ground'], rhyhorn: ['ground', 'rock'], machoke: ['fighting'], graveler: ['rock', 'ground'], dragonair: ['dragon'], rhydon: ['ground', 'rock'], snorlax: ['normal'],
  koffing: ['poison'], porygon: ['normal'], weezing: ['poison'], electrodeA: ['electric'], dragoniteK: ['dragon', 'flying'],
  exeggcute: ['grass', 'psychic'], abra: ['psychic'], haunter: ['ghost', 'poison'], kadabra: ['psychic'], gengar: ['ghost', 'poison'], mrmime: ['psychic', 'fairy'], exeggutor: ['grass', 'psychic'],
  clone: ['psychic'], decoy: ['psychic', 'fairy'],
  houndour: ['dark', 'fire'], slugma: ['fire'], magby: ['fire'], houndoom: ['dark', 'fire'], magcargo: ['fire', 'rock'], magmarJ: ['fire'], houndoomA: ['dark', 'fire'], tyranitarK: ['rock', 'dark'],
  marill: ['water', 'fairy'], wooper: ['water', 'ground'], remoraid: ['water'], azumarill: ['water', 'fairy'], quagsire: ['water', 'ground'], octillery: ['water'], mantineB: ['water', 'flying'], salamenceK: ['dragon', 'flying'], reflet: ['water'],
  horsea: ['water'], tentacool: ['water', 'poison'], seadra: ['water'], tentacruel: ['water', 'poison'], mantine: ['water', 'flying'], kingdraB: ['water', 'dragon'], garchompK: ['dragon', 'ground'],
  hoppip: ['grass', 'flying'], sunkern: ['grass'], pineco: ['bug'], skiploom: ['grass', 'flying'], sunflora: ['grass'], forretress: ['bug', 'steel'], meganiumB: ['grass'], goodraK: ['dragon'], reve: ['psychic', 'grass'],
  metagrossK: ['steel', 'psychic'], pichu: ['electric'], mareep: ['electric'], flaaffy: ['electric'], ampharos: ['electric'], chinchou: ['water', 'electric'], lanturn: ['water', 'electric'], togetic: ['fairy', 'flying'],
};
export const BOSS_TYPES = { articuno: ['ice', 'flying'], zapdos: ['electric', 'flying'], moltres: ['fire', 'flying'], dragonite: ['dragon', 'flying'], mewtwo: ['psychic'], mew: ['psychic'], raikou: ['electric'], entei: ['fire'], suicune: ['water'], lugia: ['psychic', 'flying'], celebi: ['psychic', 'grass'] };

// indices de lore affichés à l'entrée du boss (jamais l'explication, seulement l'indice)
export const BOSS_LORE = {
  articuno: '« Il ne daigne se poser que lorsqu’on le brûle. »',
  zapdos: '« La foudre dort dans sa plume. La terre l’apaise, l’eau l’attire. »',
  moltres: '« Seule l’eau éteint ce qui renaît de ses cendres. »',
  dragonite: '« Ses écailles ne cèdent qu’au gel suivi d’un choc. »',
  mewtwo: '« Un esprit ne craint que l’ombre. »',
  mew: '« Les ronces craignent la flamme. L’ombre trouble les rêves. »',
  raikou: '« Le bronze appelle la foudre. La terre et la pierre l’étouffent. »',
  entei: '« Les braises oublient tout ce que l’eau a touché. »',
  suicune: '« Le reflet se dissipe, le vrai ne ment pas. La foudre et les plantes l’ébranlent. »',
  lugia: '« La tempête a une faille : ce qui gronde plie devant la foudre et la glace. »',
  celebi: '« Le temps craint le feu et l’ombre. Ce qui pousse ne rit jamais longtemps. »',
};

// répliques de boss : intro (carte-titre), changement de phase (2, 3) et mort ; une phrase chacune
export const BOSS_LINES = {
  articuno:  { intro: '« Le silence est ma demeure. Pourquoi la troubler ? »', p2: '« Le froid ne pardonne pas. »', p3: '« Tout se fige. Tout. »', death: '« …que la glace… se brise… »' },
  zapdos:    { intro: '« Entends-tu gronder le ciel ? C’est moi. »', p2: '« L’orage m’obéit ! »', p3: '« Que la foudre te juge ! »', death: '« La tempête… s’éloigne. »' },
  moltres:   { intro: '« Je suis le feu qui renaît. Viens te consumer. »', p2: '« Mes braises ne s’éteignent jamais. »', p3: '« De mes cendres, je me relève ! »', death: '« Les flammes… retournent à la terre. »' },
  dragonite: { intro: '« Un prétendant de plus. Prouve que tu mérites ma couronne. »', p2: '« Tu tiens debout. Bien. »', p3: '« Assez ! Voici la colère du roi ! »', death: '« Digne… Kanto est à toi. »' },
  mewtwo:    { intro: '« Te voilà enfin. J’ai été créé pour combattre, pas pour être aimé. »', p2: '« Ton esprit s’ouvre. Le mien aussi. »', p3: '« Je ne suis pas seul. Je ne l’ai jamais été. »', death: '« …enfin… le silence. »' },
  mew:       { intro: '« Hihi ! Tu es venu jusqu’ici ? Alors jouons. »', p2: '« Et si tout était possible ? »', p3: '« Tous les possibles… même ta défaite. »', death: '« C’était… un beau jeu. À bientôt. »' },
  entei:     { intro: '« Ici, tout a brûlé. Pas moi. »', p2: '« Sens-tu la cendre sous tes pas ? »', p3: '« Que tout redevienne braise ! »', death: '« …la flamme… se souviendra… »' },
  suicune:   { intro: '« Regarde-toi dans l’eau, voyageur. »', p2: '« Lequel de nous est le vrai ? »', p3: '« Que le lac t’éprouve. »', death: '« …l’aurore… se lève… »' },
  lugia:     { intro: '« Les abysses m’ont éveillé. Qui ose troubler la mer ? »', p2: '« Entends-tu le vent hurler ? »', p3: '« Que l’océan t’engloutisse ! »', death: '« …la mer… se calme… »' },
  celebi:    { intro: '« Tu es venu de loin, voyageur. Reste un peu. »', p2: '« Le temps coule dans les deux sens. »', p3: '« Tous les printemps, tous les automnes… »', death: '« …à une autre saison… »' },
  raikou:    { intro: '« La cloche a sonné. Le tonnerre répond. »', p2: '« Entends-tu le bronze gronder ? »', p3: '« Que le ciel te frappe, voyageur ! »', death: '« …le tonnerre… s’éteint… »' },
};

// ---------- marques (états élémentaires) ----------
export const MARKS = {
  wet: { name: 'Trempé', tag: 'EAU', color: '#4aa8ff' },
  flame: { name: 'Enflammé', tag: 'FEU', color: '#ff7a30' },
  frost: { name: 'Givré', tag: 'GIV', color: '#9fe8ff' },
  charge: { name: 'Chargé', tag: 'ÉLEC', color: '#ffe84a' },
  root: { name: 'Enraciné', tag: 'RAC', color: '#6cd84c' },
  toxin: { name: 'Toxique', tag: 'TOX', color: '#c070ff' },
};
export const ELEM_MARK = { water: 'wet', fire: 'flame', ice: 'frost', electric: 'charge', grass: 'root' };
const MARK_DUR = 7, MARK_DUR_BIG = 5, MARK_DUR_BOSS = 3.5, MARK_DUR_TEAM = 5, REACT_CD = 2.0;

// ---------- réactions ----------
// mark : marque présente sur la cible ; on : éléments (ou types de coup) qui la déclenchent ; k : coefficient de dégâts (par rapport au coup qui déclenche)
export const REACTIONS = [
  { id: 'conduction', name: 'CONDUCTION', mark: 'wet', on: ['electric'], k: 2.2, color: '#ffe84a' },
  { id: 'conduction', name: 'CONDUCTION', mark: 'charge', on: ['water'], k: 2.2, color: '#ffe84a' },
  { id: 'isolation', name: 'ISOLÉ', mark: 'charge', on: ['ground', 'rock'], k: 0.6, color: '#c8a070' },
  { id: 'gelnet', name: 'GEL NET', mark: 'wet', on: ['ice'], k: 0.8, color: '#bfeaff' },
  { id: 'vapeur', name: 'VAPEUR', mark: 'flame', on: ['water'], k: 0.6, color: '#e8f4ff' },
  { id: 'embrasement', name: 'EMBRASEMENT', mark: 'root', on: ['fire'], k: 0.5, color: '#ff7a30' },
  { id: 'fumees', name: 'FUMÉES', mark: 'toxin', on: ['fire'], k: 0.4, color: '#c070ff' },
  { id: 'fonte', name: 'FONTE', mark: 'frost', on: ['fire'], k: 1.0, color: '#ffb070' },
  { id: 'fragilisation', name: 'FRAGILISATION', mark: 'frost', on: ['ground', 'rock', 'fighting'], k: 1.5, color: '#cfe6ff' },
];
export const REACTION_HELP = {
  conduction: 'Trempé + Électrik (ou Chargé + Eau) : gros dégâts de zone, paralysie.',
  isolation: 'Chargé + Sol/Roche : coupe l’aura électrique 6 s.',
  gelnet: 'Trempé + Glace : gel net, dégâts subis ×1,3.',
  vapeur: 'Enflammé + Eau : nuage qui aveugle, étourdit les boss.',
  embrasement: 'Enraciné + Feu : zone brûlante qui détruit les ronces.',
  fumees: 'Toxique + Feu : nuage de poison.',
  fonte: 'Givré + Feu : brise la glace et la carapace, laisse une flaque.',
  fragilisation: 'Givré + Sol/Roche/Combat : poise brisée, dégâts subis ×1,3.',
};
// quels boss ont une aura permanente (marque entretenue) ; articuno : carapace de glace
const BOSS_AURA = { entei: 'flame', suicune: 'frost', raikou: 'charge', zapdos: 'charge', moltres: 'flame', articuno: 'frost' };
const SHELL_HP = 70, SHELL_REGEN = 14;

export function installElements(G, d) {
  const { rand, hyp, unit, SFX, M, D, TS } = d;
  const P = G.prototype;
  const REV = Object.fromEntries(Object.entries(D.TYPE_FR).map(([k, v]) => [v, k]));
  const typesOfEnemy = e => (e.boss ? BOSS_TYPES[e.sprite] : ENEMY_TYPES[e.type]) || null;

  P.initElements = function () { this.surf = []; this.lastParry = -9; this.focusT = 0; this.focus = null; };

  // ======================= marques =======================
  P.hasMark = function (o, k) { return !!(o && o.el && o.el.some(m => m.k === k)); };
  P.addMark = function (o, k, dur) {
    if (!o || o.dead || o.exh) return;
    if (dur == null) dur = o.vit ? MARK_DUR_TEAM : o.boss ? MARK_DUR_BOSS : o.def && o.def.armor ? MARK_DUR_BIG : MARK_DUR;
    if (!o.el) o.el = [];
    const f = o.el.find(m => m.k === k); if (f) { f.t = dur; f.max = dur; return; }
    if (o.el.length >= 2) o.el.shift();
    o.el.push({ k, t: dur, max: dur });
    this.burst(o.x, o.y - 10, MARKS[k].color, 4);
  };
  P.delMark = function (o, k) { if (o && o.el) o.el = o.el.filter(m => m.k !== k); };
  P.markSpeed = function (e) { let s = 1; if (this.hasMark(e, 'frost')) s *= 0.7; if (this.hasMark(e, 'root')) s *= 0.75; return e.boss ? 1 : s; };
  P.typesOfTeam = function (m) { return D.typesOf(m.type, m.id); };

  // élément du coup en cours et éléments « déclencheurs » (un coup lourd d'un Pokémon Combat/Sol/Roche déclenche aussi ces réactions)
  P.trigOf = function (m, a) {
    const el = this.elemOf(m, a), out = [el];
    if (a && (a.kind === 'heavy' || a.kind === 'sig' || a.kind === 'ability' || a.kind === 'relay')) {
      const sec = this.typesOfTeam(m)[1]; if (sec && ['fighting', 'ground', 'rock'].includes(sec) && !out.includes(sec)) out.push(sec);
    }
    return out;
  };

  // multiplicateur de dégâts infligés à un ennemi (type, trempé vs feu, vulnérabilité, carapace)
  P.elemMult = function (e, o, src) {
    let m = 1;
    if (e.vuln > 0) m *= e.vulnM || 1.3;
    if (o.noElem) return m;
    const el = o.elem || this.curElem;
    if (src && src.def && el) m *= typeMult(el, typesOfEnemy(e));
    if (el && src && src.held) m *= this.heldElemMult(src, el);   // objet tenu : Charbon, Eau Mystique, Graine Miracle
    if (el === 'fire' && this.hasMark(e, 'wet')) m *= 0.75;
    if (e.shell && e.shell.hp > 0) m *= 0.6;
    return m;
  };
  // multiplicateur de dégâts subis par un membre de l'équipe
  P.elemDefMult = function (m, o, src) {
    const ow = o.owner || (src && src.def ? src : null); if (!ow || !ow.def) return 1;
    const att = (typesOfEnemy(ow) || [])[0]; if (!att) return 1;
    let k = typeMult(att, this.typesOfTeam(m));
    if (att === 'fire' && this.hasMark(m, 'wet')) k *= 0.75;
    return k;
  };

  // un membre touché : l'eau le trempe, l'électricité frappe plus fort un membre trempé (symétrique des réactions du joueur)
  P.elemOnHurt = function (m, dmg, o, src) {
    const ow = o.owner || (src && src.def ? src : null); if (!ow || !ow.def || m.exh) return;
    const att = (typesOfEnemy(ow) || [])[0];
    if (att === 'water') this.addMark(m, 'wet', 4);
    else if (att === 'electric' && this.hasMark(m, 'wet')) {
      this.delMark(m, 'wet'); this.floatText(m.x, m.y - 34, 'CONDUCTION', '#ffe84a');
      m.hp -= Math.round(dmg * 0.5); if (Math.random() < 0.5) this.inflict(m, 'para');
    } else if (att === 'fire' && this.hasMark(m, 'wet')) this.delMark(m, 'wet');
    else if (att === 'ice') this.addMark(m, 'frost', 3);
  };

  // ======================= application d'un coup élémentaire =======================
  P.elemApply = function (e, dmg, src, o) {
    if (o.noElem || e.dead) return;
    const el = o.elem || this.curElem, trig = o.trig || this.curTrig || [el];
    // carapace d'Artikodin
    if (e.shell && e.shell.hp > 0) this.shellHit(e, dmg * (el === 'fire' ? 3 : 1) / 0.6 * 0.6);
    // une réaction par coup, dans l'ordre de la table
    for (const r of REACTIONS) {
      if (!this.hasMark(e, r.mark) || !r.on.some(x => trig.includes(x))) continue;
      if ((e.rcd && e.rcd[r.id] > this.t)) continue;
      (e.rcd = e.rcd || {})[r.id] = this.t + REACT_CD;
      this.delMark(e, r.mark);
      this.react(r, e, dmg, src, o);
      return;
    }
    if (el === 'fire' && this.hasMark(e, 'wet')) { this.delMark(e, 'wet'); this.floatText(e.x, e.y - 34, 'Séché', '#cfe6ff'); return; }
    const mk = ELEM_MARK[el];
    if (mk && !(mk === 'charge' && e.iso > 0)) this.addMark(e, mk);
    // un ennemi Chargé relaie parfois l'éclair à un voisin
    if (this.hasMark(e, 'charge') && Math.random() < 0.25) {
      const n = this.enemies.find(q => q !== e && !q.dead && !q.boss && hyp(q.x - e.x, q.y - e.y) < 46);
      if (n) { this.beams.push({ x: e.x, y: e.y - 8, ang: Math.atan2(n.y - e.y, n.x - e.x), len: hyp(n.x - e.x, n.y - e.y), t: 0, max: 0.2, color: '#ffe84a', w: 3 }); this.reactDmg(n, dmg * 0.4, src); }
    }
  };
  // dégâts de réaction : passent par damageEnemy (phases de boss, mort) sans relancer le moteur d'éléments ; plafonnés sur les boss
  P.reactDmg = function (e, amt, src, stagger = 0.4) {
    if (!e || e.dead || amt <= 0) return;
    if (e.boss) amt = Math.min(amt, e.maxhp * 0.05);
    this.damageEnemy(e, amt, src, { noElem: true, react: true, stagger, knock: 30 });
  };
  P.stunBoss = function (b, t) {
    if (!b.boss || b.dead || (b.stunCd || 0) > this.t) return false;
    if (b.state !== 'move' && b.state !== 'windup') return false;
    b.stunCd = this.t + 9; b.state = 'recover'; b.st = t; b.tele = false; b.cd = Math.max(b.cd, 0.6); setAnimSafe(b, 'Hurt');
    return true;
  };
  function setAnimSafe(o, n) { try { d.setAnim(o, n, false); } catch (x) { /* rien */ } }

  P.react = function (r, e, dmg, src, o) {
    const base = Math.max(1, dmg), x = e.x, y = e.y, col = r.color;
    this.tutEvent('react'); this.floatText(x, y - 38, r.name, col); this.ringFx(x, y, 22, col); this.burst(x, y - 8, col, 12); this.shake = Math.max(this.shake, 2.5);
    const chief = this.chief(); if (src === chief || (src && src.def)) this.addLink(5);
    const near = (rad, fn) => { for (const q of this.enemies) if (!q.dead && q !== e && hyp(q.x - x, q.y - y) < rad + q.r) fn(q); };
    switch (r.id) {
      case 'conduction': {
        SFX.boom(); this.ringFx(x, y, 38, '#ffe84a');
        this.reactDmg(e, base * r.k, src, 0.8);
        near(38, q => { this.reactDmg(q, base * r.k * 0.5, src, 0.5); if (!q.boss) this.inflictEnemy(q, 'para'); });
        if (!e.boss) this.inflictEnemy(e, 'para');
        if (e.boss && chief && !chief.exh && hyp(chief.x - x, chief.y - y) < 58) this.dotMember(chief, e.dmg * 0.5, ['para', 0.5]);
        break;
      }
      case 'isolation': {
        e.iso = 6; this.reactDmg(e, base * r.k, src, 0.3); this.floatText(x, y - 28, 'Aura coupée', '#c8a070');
        break;
      }
      case 'gelnet': {
        this.reactDmg(e, base * r.k, src, 0.5);
        if (e.boss || (e.def && e.def.armor)) { e.vuln = 3; e.vulnM = 1.3; } else this.inflictEnemy(e, 'freeze');
        break;
      }
      case 'vapeur': {
        this.reactDmg(e, base * r.k, src, 0.3); this.addSurf('steam', x, y, 30, 4);
        e.blind = 3;
        if (e.boss) this.stunBoss(e, 1.2);
        break;
      }
      case 'embrasement': {
        this.reactDmg(e, base * r.k, src, 0.3); this.addSurf('fire', x, y, 26, 6, base);
        near(34, q => { if (this.hasMark(q, 'root')) { this.delMark(q, 'root'); this.addMark(q, 'flame'); this.reactDmg(q, base * 0.4, src, 0.3); } });
        this.hitObs(x, y, 28, base * 2, 'fire');
        break;
      }
      case 'fumees': {
        this.reactDmg(e, base * r.k, src, 0.2); this.addSurf('toxic', x, y, 30, 5, base);
        break;
      }
      case 'fonte': {
        this.reactDmg(e, base * r.k, src, 0.4); this.addSurf('puddle', x, y, 22, 8);
        if (e.shell && e.shell.hp > 0) this.shellHit(e, e.shell.hp + 1);
        this.hitObs(x, y, 24, base * 2, 'fire');
        break;
      }
      case 'fragilisation': {
        this.reactDmg(e, base * r.k, src, 1.0);
        if (e.boss) { e.vuln = 4; e.vulnM = 1.3; this.stunBoss(e, 1.2); if (e.shell && e.shell.hp > 0) this.shellHit(e, 40); }
        else { e.vuln = 4; e.vulnM = 1.3; if (!e.dead) { e.state = 'stagger'; e.st = 1.2; e.tele = false; } }
        this.floatText(x, y - 28, 'Poise brisée', '#cfe6ff');
        break;
      }
    }
  };
  P.shellHit = function (e, amt) {
    const s = e.shell; if (!s || s.hp <= 0) return;
    s.hp -= amt;
    if (s.hp <= 0) { s.hp = 0; s.regen = 0; this.floatText(e.x, e.y - 44, 'CARAPACE BRISÉE', '#e8faff'); this.ringFx(e.x, e.y, 30, '#e8faff'); this.burst(e.x, e.y - 10, '#bfeaff', 22); SFX.boom(); this.shake = Math.max(this.shake, 4); this.hitstop = Math.max(this.hitstop, 0.06); }
  };

  // ======================= surfaces de terrain =======================
  // kind : fire (brûle, s'éteint à l'eau/glace), puddle (mouille, conduit), steam (aveugle les ennemis), toxic (empoisonne)
  P.addSurf = function (kind, x, y, r, life, ref) {
    if (this.surf.length > 40) return;
    this.surf.push({ kind, x, y, r, life, t: 0, tk: 0, ref: ref || 10, shock: 0, dead: false, seed: Math.random() * 100 });
  };
  P.surfTouch = function (x, y, r, elem) {
    if (!elem || !this.surf.length) return;
    for (const s of this.surf) {
      if (s.dead || hyp(s.x - x, s.y - y) > r + s.r * 0.7) continue;
      if (s.kind === 'fire' && (elem === 'water' || elem === 'ice')) { s.dead = true; this.floatText(s.x, s.y - 10, 'Éteint', '#bfeaff'); this.addSurf('steam', s.x, s.y, 22, 2.5); }
      else if (s.kind === 'puddle' && elem === 'fire') { s.dead = true; this.addSurf('steam', s.x, s.y, 22, 2.5); }
      else if (s.kind === 'puddle' && elem === 'electric') { s.shock = 3; this.floatText(s.x, s.y - 10, 'Électrifié', '#ffe84a'); }
    }
  };
  P.updateElements = function (dt) {
    const c = this.chief();
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.el && e.el.length) e.el = e.el.filter(m => (m.t -= dt) > 0);
      if (e.vuln > 0) e.vuln -= dt; if (e.blind > 0) e.blind -= dt; if (e.iso > 0) e.iso -= dt;
      if (e.boss) this.bossTrait(e, dt);
    }
    for (const m of this.team) if (m.el && m.el.length) m.el = m.el.filter(k => (k.t -= dt) > 0);
    for (const s of this.surf) {
      s.t += dt; s.tk -= dt; if (s.shock > 0) s.shock -= dt;
      if (s.t >= s.life) { s.dead = true; continue; }
      const inC = !c.exh && hyp(c.x - s.x, c.y - s.y) < s.r;
      if (s.tk > 0) continue;
      if (s.kind === 'fire') {
        s.tk = 0.5; const dm = Math.max(1, s.ref * 0.22);
        for (const e of this.enemies) if (!e.dead && hyp(e.x - s.x, e.y - s.y) < s.r + e.r) { this.reactDmg(e, dm, c, 0); if (!e.dead) this.addMark(e, 'flame'); }
        if (inC) this.dotMember(c, Math.max(2, s.ref * 0.3), ['burn', 0.3]);
        this.hitObs(s.x, s.y, s.r, dm, 'fire');
      } else if (s.kind === 'puddle') {
        s.tk = 0.8;
        for (const e of this.enemies) if (!e.dead && hyp(e.x - s.x, e.y - s.y) < s.r + e.r) { if (!this.hasMark(e, 'wet')) this.addMark(e, 'wet'); if (s.shock > 0) this.reactDmg(e, Math.max(1, s.ref * 0.3), c, 0.2); }
        if (inC) { this.addMark(c, 'wet'); if (s.shock > 0) this.dotMember(c, Math.max(2, 5), ['para', 0.3]); }
      } else if (s.kind === 'steam') {
        s.tk = 0.4;
        for (const e of this.enemies) if (!e.dead && hyp(e.x - s.x, e.y - s.y) < s.r + e.r) e.blind = Math.max(e.blind || 0, 0.8);
      } else if (s.kind === 'toxic') {
        s.tk = 0.6;
        for (const e of this.enemies) if (!e.dead && hyp(e.x - s.x, e.y - s.y) < s.r + e.r) { if (!e.boss) this.inflictEnemy(e, 'poison'); this.addMark(e, 'toxin'); }
        if (inC) this.dotMember(c, 2, ['poison', 0.5]);
      }
    }
    this.surf = this.surf.filter(s => !s.dead);
    this.updateFocus(dt);
  };

  // ======================= traits de boss =======================
  P.bossTrait = function (b, dt) {
    const aura = BOSS_AURA[b.sprite]; if (!aura) return;
    if (!b.eInit) { b.eInit = true; if (b.sprite === 'articuno') b.shell = { hp: SHELL_HP, max: SHELL_HP, regen: 0 }; }
    if (b.state === 'intro') return;
    if (b.shell) {
      if (b.shell.hp <= 0) { b.shell.regen += dt; if (b.shell.regen >= SHELL_REGEN) { b.shell.hp = SHELL_HP * 0.5; b.shell.regen = 0; this.floatText(b.x, b.y - 44, 'Carapace reformée', '#bfeaff'); } }
      else if (!this.hasMark(b, 'frost')) this.addMark(b, 'frost', 3.5);
      return;
    }
    if (b.iso > 0 && aura === 'charge') return;
    const mk = (b.el || []).find(m => m.k === aura);
    if (!mk) this.addMark(b, aura, 3.5); else if (mk.t < 1.2) mk.t = 3.5;
  };

  // ======================= relais, focus, indices =======================
  // changer de Pokémon juste après une esquive juste ou une parade : le nouveau venu frappe tout de suite avec son élément
  P.tryRelay = function (n, o) {
    if (this.t - this.lastPD > this.relayWin && this.t - this.lastParry > this.relayWin) return false;
    const R = relayOf(n), st = n.stage || 0, sc = 1 + 0.15 * st, aim = n.face, reson = !!(o && o.type === n.type), dmg = this.powerOf(n, { kind: 'heavy' }) * R.mult * (reson ? 1.25 : 1);
    this.curElem = n.type; this.curTrig = this.trigOf(n, { kind: 'relay' });
    this.ringFx(n.x, n.y, 46, n.def.color); this.floatText(n.x, n.y - 38, R.name.toUpperCase() + (reson ? ' · RÉSONANCE' : ''), reson ? '#ffffff' : '#ffe27a'); SFX.boom(); this.shake = Math.max(this.shake, 3);
    const base = { heavy: true, stagger: R.stagger || 0.7, knock: R.knock || 90, status: R.status, elem: n.type, trig: this.curTrig };
    const ang = Math.atan2(aim.y, aim.x), proj = (a, extra) => this.fireProj({ x: n.x, y: n.y, ang: a, speed: R.speed || 230, dmg, r: 4, life: 1.0, team: 'p', color: n.def.color, owner: n, status: R.status, heavy: true, ...extra });
    if (R.shape === 'arc') this.meleeArc(n, aim, (R.range || 46) * sc, R.cos == null ? 0.35 : R.cos, dmg, base);
    else if (R.shape === 'ring') this.meleeArc(n, aim, (R.range || 46) * sc, -2, dmg, base);
    else if (R.shape === 'shot') { proj(ang, { r: 5, explode: R.explode ? Math.round(R.explode * sc) : 0 }); SFX.shoot(); }
    else if (R.shape === 'fan') { const c = (R.count || 3) + (st >= 2 ? 2 : 0); for (let i = 0; i < c; i++) proj(ang + (i - (c - 1) / 2) * (R.spread || 0.18)); SFX.shoot(); }
    else if (R.shape === 'leech') { proj(ang, { leech: true }); SFX.shoot(); }
    if (R.healOut && o && !o.exh && o.hp > 0) {
      o.hp = Math.min(o.maxhp, o.hp + o.maxhp * R.healOut * (1 + 0.25 * st));
      if (R.cure) o.fx = null;
      this.healFx(o);
    }
    this.lastPD = -9; this.lastParry = -9; this.addLink(8); this.tutEvent('relay');
    return true;
  };
  P.focusEnemy = function () {
    const c = this.chief(); if (this.lock && !this.lock.dead) return this.lock;
    if (this.bossActive && this.boss && !this.boss.dead) return this.boss;
    let best = null, bd = 190;
    for (const e of this.enemies) { if (e.dead || e.state === 'dormant' || e.state === 'idle') continue; const dd = hyp(e.x - c.x, e.y - c.y); if (dd < bd) { bd = dd; best = e; } }
    return best;
  };
  P.updateFocus = function (dt) { this.focusT -= dt; if (this.focusT <= 0) { this.focusT = 0.15; this.focus = this.focusEnemy(); } };
  // pour le HUD : x1,25 / x1 / x0,8 de chaque membre contre la cible, et réaction possible
  P.matchups = function () {
    const f = this.focus; if (!f || f.dead) return null;
    const types = typesOfEnemy(f);
    return this.team.map(m => {
      const el = m.type, trig = [el]; const sec = this.typesOfTeam(m)[1]; if (sec && ['fighting', 'ground', 'rock'].includes(sec)) trig.push(sec);
      const ab = m.def && m.def.ability ? REV[m.def.ability.type] : null; if (ab && !trig.includes(ab)) trig.push(ab);
      const react = REACTIONS.some(r => this.hasMark(f, r.mark) && r.on.some(x => trig.includes(x)));
      return { mult: typeMult(el, types), react };
    });
  };
}
