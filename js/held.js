// Objets tenus (équipables) : un par Pokémon, jamais consommés (fiche objets_equipables.md).
// Inventaire `helds` : les objets possédés (un exemplaire chacun). Le porteur est noté dans `m.held` ; tout est dans la sauvegarde.
// Effets de cette première série : chance de drop, essence, dégâts d'un élément, régénération, fenêtre de relais.
// Les effets « de chance » et la régénération ne comptent que pour le Pokémon actif.
export const RELAY_WIN = 1.3, RELAY_WIN_BAND = 1.6;     // fenêtre de relais (s), sans et avec le Bandeau Relais
export const ORB_MULT = 1.15, ORB_RECOIL = 0.02, ORB_GAP = 0.15;   // Orbe Vie : +15 % de dégâts, 2 % des PV max perdus par coup (au plus un coût toutes les 0,15 s, pour ne pas punir les zones à répétition)
export const ELEM_BOOST = 1.1, LEFTOVERS_RATE = 0.005, LEFTOVERS_DELAY = 5;   // +10 % de dégâts ; 0,5 % des PV max par seconde, après 5 s sans coup reçu

export function installHeld(Game, { D, hyp, SFX }) {
  const P = Game.prototype;
  // le Pokémon actif porte-t-il cet objet ?
  P.chiefHeld = function (k) { const c = this.chief(); return !!c && c.held === k; };
  P.ownsHeld = function (k) { return this.helds.includes(k); };
  P.holderOf = function (k) { return this.team.concat(this.bench).find(m => m.held === k) || null; };
  // objets possédés que le tirage des rares peut encore donner (gros mobs)
  P.heldMissing = function () { return Object.keys(D.HELD).filter(k => !this.helds.includes(k)); };
  // combat en cours : un ennemi actif près du Pokémon, ou un boss réveillé
  P.inCombat = function () {
    const c = this.chief(); if (!c) return false;
    if (this.boss && !this.boss.dead && this.boss.state !== 'dormant' && this.boss.state !== 'idle') return true;
    return this.enemies.some(e => !e.dead && !e.tutDummy && e.state !== 'idle' && e.state !== 'dormant' && hyp(e.x - c.x, e.y - c.y) < 320);
  };
  // changement d'objet : au feu de camp, ou hors combat (jamais en plein combat, puisque la coop ne met aucun menu en pause)
  P.canSwapHeld = function () { return !!this.hubAt || !this.inCombat(); };
  P.canHold = function (m) { return !!m && !m.mod; };   // Fala : son emplacement est occupé par son Module
  P.equipHeld = function (i, k) {
    const m = this.team[i]; if (!m || m.mod || !D.HELD[k] || !this.ownsHeld(k) || !this.canSwapHeld()) return false;
    const other = this.holderOf(k); if (other && other !== m) other.held = null;   // l'objet est unique : il change de porteur
    m.held = k; this.save(); SFX.pick(); return true;
  };
  P.unequipHeld = function (i) {
    const m = this.team[i]; if (!m || !m.held || !this.canSwapHeld()) return false;
    m.held = null; this.save(); SFX.pick(); return true;
  };
  // à chaque image : fenêtre de relais et régénération des Restes
  P.updateHeld = function (dt) {
    this.relayWin = this.chiefHeld('band') ? RELAY_WIN_BAND : RELAY_WIN;
    const c = this.chief();
    if (c && c.held === 'leftovers' && !c.exh && c.hp > 0 && c.hp < c.maxhp && this.t - (c.hitAt ?? -99) > LEFTOVERS_DELAY) c.hp = Math.min(c.maxhp, c.hp + c.maxhp * LEFTOVERS_RATE * dt);
  };
  // Orbe Vie : multiplicateur de dégâts du porteur, puis coût en PV de chaque coup porté (jamais sous 1 PV)
  P.orbMult = function (src) { return src && src.held === 'orb' && !src.summoned ? ORB_MULT : 1; };
  P.orbCost = function (src, o) {
    if (!src || src.held !== 'orb' || src.summoned || src !== this.chief() || (o && o.react) || src.exh || src.hp <= 1 || this.t - (src.orbAt ?? -9) < ORB_GAP) return;
    src.orbAt = this.t; src.hp = Math.max(1, src.hp - src.maxhp * ORB_RECOIL); src.hitAt = this.t;
  };
  // Ceinture Force : un coup mortel laisse le porteur à 1 PV, une fois par feu de camp. Renvoie les dégâts à appliquer.
  P.beltSave = function (m, dmg) {
    if (m.held !== 'belt' || m.beltUsed || dmg < m.hp) return dmg;
    m.beltUsed = true; this.floatText(m.x, m.y - 34, 'CEINTURE FORCE !', '#ffe27a'); this.burst(m.x, m.y - 6, '#ffe27a', 10);
    return Math.max(0, m.hp - 1);
  };
  // le feu de camp (ou la réapparition) recharge la Ceinture Force
  P.resetHeld = function () { for (const m of this.team.concat(this.bench)) m.beltUsed = false; };
  // bonus de dégâts d'un élément (Charbon, Eau Mystique, Graine Miracle) : appelé par le calcul des dégâts
  P.heldElemMult = function (src, el) { const h = src && src.held && D.HELD[src.held]; return h && h.elem && h.elem === el ? ELEM_BOOST : 1; };
}
