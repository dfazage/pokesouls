// Attaques d'entrée du relais : une par famille de starter (clé = stade 1). Valeurs de départ à équilibrer.
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
};
// familles sans attaque propre (générations 6 à 9) : frappe circulaire de base
export const RELAY_DEFAULT = { name: 'Frappe de relais', gab: 'A', shape: 'ring', mult: 1.0, range: 46, stagger: 0.7, knock: 90 };
export const relayOf = n => (n.line && RELAY[n.line[0]]) || RELAY_DEFAULT;
