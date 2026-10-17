// Réserve du feu : les Pokémon « bonus » recrutés pendant la partie (un par carte, via une quête secondaire)
// attendent à la réserve. À chaque feu de camp on peut en échanger un contre un compagnon de l'équipe (gratuit).
// Celui qui sort garde son niveau, ses vitamines et sa CT. Tout est dans la sauvegarde de la partie : une nouvelle partie repart de zéro.
import { loadSpecies } from './assets.js';
import { poolEntry, startTm, spriteLine } from './pool.js';

export const EXTRA_BY_MAP = { 1: 'genesect' };   // carte (indice) -> Pokémon bonus ; les autres cartes viendront plus tard

export function installReserve(Game, { D, stageOf }) {
  const P = Game.prototype;
  P.hasMember = function (key) { return this.team.some(m => m.key === key) || this.bench.some(m => m.key === key); };
  // CT équipée incompatible (changement d'élément) : retour à la CT de départ
  P.fixTm = function (m) {
    const st = stageOf(m.lvl, m);
    if (!D.TMS[m.tm] || !D.tmCompat(m.tm, m.type, m.line[st], st).ok) m.tm = startTm({ ...poolEntry(m.key), type: m.type });
  };
  // recrute un Pokémon bonus à la réserve : niveau moyen de l'équipe
  P.recruit = function (key) {
    if (this.hasMember(key)) return null;
    const avg = Math.round(this.team.reduce((s, m) => s + m.lvl, 0) / Math.max(1, this.team.length));
    const m = this.makeMember(key, -1); m.lvl = Math.max(D.START_LEVEL, avg);
    this.computeDef(m); m.maxhp = m.hp = m.def.hp; this.bench.push(m);
    this.save(); return m;
  };
  // échange l'équipier ti contre le Pokémon bi de la réserve (au feu de camp)
  P.swapMember = async function (ti, bi) {
    const inn = this.bench[bi], out = this.team[ti]; if (!inn || !out) return false;
    await loadSpecies(spriteLine(inn), null, true);   // sprites de l'arrivant (la carte ne les a peut-être pas chargés)
    Object.assign(inn, { i: ti, x: out.x, y: out.y, face: { ...out.face }, dir: out.dir, anim: 'Idle', at: 0, loop: true, atk: null, dodge: null, fx: null, regen: null, exh: false, hurtT: 0, inv: 0, flash: 0, cd: 0, kx: 0, ky: 0, drink: 0, dash: null, deadT: 0, appear: 0 });
    this.team[ti] = inn; this.bench[bi] = out; out.i = -1;
    this.picks = this.team.map(m => m.key);
    this.applyLevels(false); inn.hp = inn.maxhp;   // il attendait au feu : en pleine forme
    this.save(); return true;
  };
}
