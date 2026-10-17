// Attaques d'entrée du relais : une par lignée du pool (clé = stade 1). Valeurs de départ à équilibrer.
// Le relais se déclenche en changeant de Pokémon juste après une esquive juste ou une parade (voir elements.js, tryRelay).
// gab : gabarit du GDD (A = Assaut, R = Rempart, D = Distance, S = Soutien), il fixe la fonction de l'attaque.
// shape : arc (frappe devant), ring (onde autour), shot (projectile explosif), fan (éventail), leech (projectile qui soigne)
// healOut : part des PV max rendue au Pokémon qui vient de sortir ; cure : guérit aussi ses altérations.
export const RELAY = {
  // Feu
  charmander: { name: 'Boule de feu', gab: 'D', shape: 'shot', mult: 1.0, explode: 30, status: ['burn', 0.5] },
  cyndaquil: { name: 'Éruption', gab: 'D', shape: 'shot', mult: 1.15, explode: 42, status: ['burn', 0.35] },
  torchic: { name: 'Coup de pied sauté', gab: 'A', shape: 'arc', mult: 1.1, range: 54, cos: 0.2, stagger: 0.9, knock: 110 },
  chimchar: { name: 'Roue de flammes', gab: 'A', shape: 'ring', mult: 0.95, range: 52, stagger: 0.6, knock: 80, status: ['burn', 0.4] },
  tepig: { name: 'Écrasement', gab: 'A', shape: 'ring', mult: 1.2, range: 48, stagger: 1.2, knock: 60 },
  // Eau
  squirtle: { name: 'Vague repoussante', gab: 'R', shape: 'ring', mult: 0.9, range: 66, stagger: 0.8, knock: 170 },
  totodile: { name: 'Morsure', gab: 'R', shape: 'arc', mult: 1.1, range: 40, cos: 0.1, stagger: 1.4, knock: 40 },
  mudkip: { name: 'Séisme', gab: 'R', shape: 'ring', mult: 1.0, range: 56, stagger: 1.0, knock: 120 },
  piplup: { name: 'Jet d’eau', gab: 'D', shape: 'shot', mult: 1.0, explode: 0, speed: 300 },
  oshawott: { name: 'Coquilame', gab: 'D', shape: 'fan', mult: 0.55, count: 3, spread: 0.2 },
  // Plante
  bulbasaur: { name: 'Vampigraine', gab: 'S', shape: 'leech', mult: 0.6, healOut: 0.25 },
  chikorita: { name: 'Aromathérapie', gab: 'S', shape: 'ring', mult: 0.5, range: 44, stagger: 0.4, knock: 40, healOut: 0.2, cure: true },
  treecko: { name: 'Lame-feuille', gab: 'A', shape: 'arc', mult: 1.15, range: 50, cos: 0.1, stagger: 0.6, knock: 70 },
  turtwig: { name: 'Bélier racine', gab: 'R', shape: 'ring', mult: 1.0, range: 52, stagger: 1.0, knock: 150 },
  snivy: { name: 'Fouet-liane', gab: 'A', shape: 'fan', mult: 0.6, count: 3, spread: 0.14 },
  // Assaut
  machop: { name: 'Saisie', gab: 'A', shape: 'arc', mult: 1.1, range: 40, cos: 0.1, stagger: 1.6, knock: 30 },
  bagon: { name: 'Draco-griffe', gab: 'A', shape: 'arc', mult: 1.15, range: 50, cos: 0.1, stagger: 0.7, knock: 80 },
  riolu: { name: 'Vitesse extrême', gab: 'A', shape: 'arc', mult: 1.0, range: 62, cos: 0.4, stagger: 0.5, knock: 90 },
  meowth: { name: 'Jackpot', gab: 'A', shape: 'arc', mult: 1.05, range: 44, cos: 0.2, stagger: 0.5, knock: 60 },
  sneasel: { name: 'Tranche-glace', gab: 'A', shape: 'arc', mult: 1.1, range: 46, cos: 0.2, stagger: 0.6, knock: 60, status: ['freeze', 0.3] },
  zorua: { name: 'Leurre', gab: 'A', shape: 'ring', mult: 0.85, range: 56, stagger: 1.0, knock: 40, status: ['confuse', 0.5] },
  // Charbambin : l'attaque d'entrée dépend de l'armure choisie (clé = forme), voir relayOf
  charcadet: { name: 'Coup de braise', gab: 'A', shape: 'arc', mult: 1.0, range: 46, cos: 0.2, stagger: 0.6, knock: 70, status: ['burn', 0.4] },
  armarouge: { name: 'Canon Armure', gab: 'D', shape: 'shot', mult: 1.1, explode: 30, speed: 280, status: ['burn', 0.4] },
  ceruledge: { name: 'Lame Maudite', gab: 'A', shape: 'arc', mult: 1.2, range: 56, cos: 0.1, stagger: 0.7, knock: 70, status: ['burn', 0.3] },
  // Rempart
  munchlax: { name: 'Plaquage', gab: 'R', shape: 'ring', mult: 1.1, range: 52, stagger: 1.3, knock: 100, status: ['para', 0.25] },
  beldum: { name: 'Tête de fer', gab: 'R', shape: 'arc', mult: 1.1, range: 44, cos: 0.1, stagger: 1.4, knock: 90 },
  hippopotas: { name: 'Piétinement', gab: 'R', shape: 'ring', mult: 1.0, range: 54, stagger: 0.9, knock: 110 },
  scyther: { name: 'Coupe-vent', gab: 'R', shape: 'arc', mult: 1.2, range: 52, cos: 0.0, stagger: 0.8, knock: 70 },
  // Distance
  weedle: { name: 'Dard-venin', gab: 'D', shape: 'shot', mult: 0.9, explode: 0, speed: 260, status: ['poison', 0.5] },
  remoraid: { name: 'Pistolet à O', gab: 'D', shape: 'shot', mult: 0.9, explode: 20, speed: 250 },
  starly: { name: 'Tornade', gab: 'D', shape: 'fan', mult: 0.5, count: 3, spread: 0.3 },
  magnemite: { name: 'Éclair', gab: 'D', shape: 'shot', mult: 1.0, explode: 24, status: ['para', 0.4] },
  abra: { name: 'Téléportation', gab: 'D', shape: 'ring', mult: 0.6, range: 40, stagger: 0.4, knock: 20, status: ['confuse', 0.4] },
  pichu: { name: 'Étincelle', gab: 'D', shape: 'shot', mult: 0.9, explode: 22, speed: 280, status: ['para', 0.45] },
  shinx: { name: 'Crocs éclair', gab: 'D', shape: 'shot', mult: 1.0, explode: 24, speed: 270, status: ['para', 0.4] },
  litwick: { name: 'Flammèche', gab: 'D', shape: 'shot', mult: 0.95, explode: 26, status: ['burn', 0.45] },
  gastly: { name: 'Léchouille', gab: 'D', shape: 'shot', mult: 1.0, explode: 24, status: ['para', 0.35] },
  // Secret : Fala (Genesect). Canon techno ; l'élément (et donc la marque posée) vient du Module équipé.
  genesect: { name: 'Canon techno', gab: 'D', shape: 'shot', mult: 1.1, explode: 26, speed: 270 },
  // Soutien
  eevee: { name: 'Charme', gab: 'S', shape: 'ring', mult: 0.4, range: 40, stagger: 0.3, knock: 30, healOut: 0.2 },
  happiny: { name: 'Soin', gab: 'S', shape: 'ring', mult: 0.3, range: 36, stagger: 0.2, knock: 20, healOut: 0.3, cure: true },
  ralts: { name: 'Choc mental', gab: 'S', shape: 'shot', mult: 0.7, explode: 18, healOut: 0.15, status: ['confuse', 0.35] },
  togepi: { name: 'Vœu soin', gab: 'S', shape: 'ring', mult: 0.4, range: 42, stagger: 0.3, knock: 30, healOut: 0.25 },
  budew: { name: 'Poudre dodo', gab: 'S', shape: 'ring', mult: 0.4, range: 44, stagger: 0.3, knock: 30, healOut: 0.15, status: ['poison', 0.4] },
};
// lignées sans attaque propre (starters des générations 6 à 9, anciennes sauvegardes) : frappe circulaire de base
export const RELAY_DEFAULT = { name: 'Frappe de relais', gab: 'A', shape: 'ring', mult: 1.0, range: 46, stagger: 0.7, knock: 90 };
export const relayOf = n => (n.branch && RELAY[n.branch]) || (n.line && RELAY[n.line[0]]) || RELAY_DEFAULT;   // branch : forme choisie d'une lignée à embranchement

// Libellés pour l'écran de choix des starters
const GAB = { A: 'Assaut', R: 'Rempart', D: 'Distance', S: 'Soutien' };
const SHAPE = { arc: 'frappe devant', ring: 'onde autour', shot: 'tir explosif', fan: 'éventail de projectiles', leech: 'projectile qui soigne' };
const STATUS_FR = { burn: 'brûle', para: 'paralyse', freeze: 'gèle', poison: 'empoisonne' };
export function relayInfo(line) {
  const R = relayOf({ line });
  const bits = [SHAPE[R.shape] || 'frappe'];
  if (R.status) bits.push((STATUS_FR[R.status[0]] || 'altère') + ' parfois');
  if (R.healOut) bits.push('soigne le Pokémon sorti');
  if (R.cure) bits.push('guérit ses altérations');
  if (R.knock >= 120) bits.push('repousse fort');
  return { name: R.name, gab: GAB[R.gab], text: bits.join(' · '), own: !!(line && RELAY[line[0]]) };
}
