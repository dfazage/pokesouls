// Évolution à embranchement (Charbambin → Carmadura ou Malvalame).
// Au niveau EVOLVE_AT[0], le menu Équipe propose une armure par forme (voir EVO dans pool.js) ; l'utiliser fait évoluer le Pokémon et le choix est définitif.
// Tant qu'aucune armure n'est choisie, le Pokémon reste au stade 1 (voir stageOf dans game.js). Le gabarit et l'attaque d'entrée du relais suivent la forme choisie.
import { loadSpecies } from './assets.js';

// Applique la forme choisie au membre (sans effet de bord : sert aussi au chargement d'une sauvegarde). Faux si la forme n'existe pas pour sa lignée.
export function setBranch(m, id) {
  const f = m.evo && m.evo.find(e => e.id === id);
  if (!f) return false;
  m.branch = id; m.line = [m.line[0], id, id]; m.gab = f.gab;
  return true;
}

export function installBranch(Game, { D, stageOf, SFX }) {
  const P = Game.prototype;
  // l'armure peut être revêtue : lignée à embranchement, choix non fait, niveau atteint, Pokémon debout
  P.canBranch = function (m) { return !!(m && m.evo && !m.branch && m.lvl >= D.EVOLVE_AT[0] && !m.exh); };
  P.chooseBranch = async function (i, id) {
    const m = this.team[i];
    if (!this.canBranch(m) || !m.evo.some(e => e.id === id)) return false;
    const from = m.def.name;
    await loadSpecies([id], null, true);   // les sprites de la forme ne sont pas forcément chargés par la carte
    if (!this.canBranch(m)) return false;   // un double clic pendant le chargement ne doit pas évoluer deux fois
    setBranch(m, id); this.fixTm(m);
    this.applyLevels(false); m.hp = m.maxhp;   // comme toute évolution : pleine forme
    m.def.ability = D.TMS[m.tm];
    if (this.ringFx && m.x) this.ringFx(m.x, m.y, 18, '#ffd7a0');
    this.emit('banner', from.toUpperCase() + ' ÉVOLUE !', 'item');
    this.emit('toast', from + ' évolue en ' + D.NAMES_FR[id]);
    this.save(); SFX.pick(); return true;
  };
}
