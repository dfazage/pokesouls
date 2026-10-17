// Pool de 39 lignées (Onix retiré, Lixy ajouté) (GDD v3, section 6), rangées par gabarit : A = Assaut, R = Rempart, D = Distance, S = Soutien.
// key : stade 1 ; line : les trois stades (une lignée à 2 stades répète le dernier) ; gen : génération du stade 1.
// types : types de chaque forme (le premier de la famille donne l'élément des attaques).
import * as D from './data.js';

export const GABS = {
  A: { id: 'A', name: 'Assaut', desc: 'Mêlée rapide, coups dans le dos', mode: 'melee', hp: 92, speed: 86, range: 26, dmg: 9, light: 'Attack', heavy: 'Swing' },
  R: { id: 'R', name: 'Rempart', desc: 'Garde, poise élevée, contrôle de zone', mode: 'melee', hp: 130, speed: 70, range: 28, dmg: 7, light: 'Attack', heavy: 'Swing', guard: 0.2 },
  D: { id: 'D', name: 'Distance', desc: 'Tirs, pièges, sorts en zone', mode: 'ranged', hp: 80, speed: 78, range: 115, dmg: 7.5, light: 'Shoot', heavy: 'Shoot' },
  S: { id: 'S', name: 'Soutien', desc: 'Soin, purification, aura', mode: 'ranged', hp: 96, speed: 76, range: 100, dmg: 6, light: 'Shoot', heavy: 'Shoot' },
};

// [gabarit, stade 1, stade 2, stade 3, génération, types du stade 1, types éventuellement différents des stades suivants]
const ROWS = [
  // Assaut
  ['A', 'torchic', 'combusken', 'blaziken', 3], ['A', 'chimchar', 'monferno', 'infernape', 4], ['A', 'tepig', 'pignite', 'emboar', 5], ['A', 'treecko', 'grovyle', 'sceptile', 3], ['A', 'snivy', 'servine', 'serperior', 5],
  ['A', 'machop', 'machoke', 'machamp', 1], ['A', 'bagon', 'shelgon', 'salamence', 3], ['A', 'riolu', 'lucario', 'lucario', 4], ['A', 'meowth', 'persian', 'persian', 1], ['A', 'sneasel', 'weavile', 'weavile', 2], ['A', 'zorua', 'zoroark', 'zoroark', 5],
  // Rempart
  ['R', 'squirtle', 'wartortle', 'blastoise', 1], ['R', 'turtwig', 'grotle', 'torterra', 4], ['R', 'mudkip', 'marshtomp', 'swampert', 3], ['R', 'totodile', 'croconaw', 'feraligatr', 2],
  ['R', 'munchlax', 'snorlax', 'snorlax', 4], ['R', 'beldum', 'metang', 'metagross', 3], ['R', 'hippopotas', 'hippowdon', 'hippowdon', 4], ['R', 'scyther', 'scizor', 'scizor', 1],
  // Distance
  ['D', 'charmander', 'charmeleon', 'charizard', 1], ['D', 'cyndaquil', 'quilava', 'typhlosion', 2], ['D', 'piplup', 'prinplup', 'empoleon', 4], ['D', 'oshawott', 'dewott', 'samurott', 5],
  ['D', 'weedle', 'kakuna', 'beedrill', 1], ['D', 'remoraid', 'octillery', 'octillery', 2], ['D', 'starly', 'staravia', 'staraptor', 4], ['D', 'magnemite', 'magneton', 'magnezone', 1], ['D', 'abra', 'kadabra', 'alakazam', 1], ['D', 'pichu', 'pikachu', 'raichu', 2], ['D', 'litwick', 'lampent', 'chandelure', 5], ['D', 'shinx', 'luxio', 'luxray', 4], ['D', 'gastly', 'haunter', 'gengar', 1],
  // Soutien
  ['S', 'bulbasaur', 'ivysaur', 'venusaur', 1], ['S', 'chikorita', 'bayleef', 'meganium', 2], ['S', 'eevee', 'eevee', 'eevee', 1], ['S', 'happiny', 'chansey', 'blissey', 4], ['S', 'ralts', 'kirlia', 'gardevoir', 3], ['S', 'togepi', 'togetic', 'togekiss', 2], ['S', 'budew', 'roselia', 'roserade', 4],
];

export const FORM_TYPES = D.FORM_TYPES;

const STARTER_FAMILY = {}; // stade 1 -> type de famille (fire / water / grass)
for (const t of Object.keys(D.STARTERS)) for (const l of D.STARTERS[t]) STARTER_FAMILY[l[0]] = t;
const GEN_FIX = { eevee: 1 };

const familyOf = key => STARTER_FAMILY[key] || (FORM_TYPES[key] || ['normal'])[0];

// Fala (Genesect secret) : hors du pool de 39 lignées, sélectionnable seulement après sa quête (voir fala.js). L'élément vient de son Module.
export const FALA = { key: 'genesect', gab: 'D', line: ['genesect', 'genesect', 'genesect'], gen: 5, type: 'electric', starter: false, secret: true };
export const POOL = ROWS.map(([gab, a, b, c, gen]) => ({ key: a, gab, line: [a, b, c], gen: GEN_FIX[a] || gen, type: familyOf(a), starter: !!STARTER_FAMILY[a] }));
const byKey = Object.fromEntries(POOL.map(p => [p.key, p]));

// Les starters des générations 6 à 9 ne sont plus proposés, mais d'anciennes sauvegardes peuvent les contenir.
const LEGACY_GAB = { fire: 'D', water: 'R', grass: 'S' };
for (const t of Object.keys(D.STARTERS)) for (const l of D.STARTERS[t]) {
  if (!byKey[l[0]]) byKey[l[0]] = { key: l[0], gab: LEGACY_GAB[t], line: l, gen: D.GEN_OF[l[0]], type: t, starter: true, legacy: true };
}
// lignées retirées du pool (anciennes sauvegardes)
for (const [k, line, gen] of [['onix', ['onix', 'steelix', 'steelix'], 1]]) if (!byKey[k]) byKey[k] = { key: k, gab: 'R', line, gen, type: familyOf(k), starter: false, legacy: true };
byKey[FALA.key] = FALA;
export const poolEntry = key => byKey[key] || null;

// archétype d'un membre : stats du gabarit, couleurs du type
export const TYPE_COLOR = {
  fire: ['#ff7a30', '#ff9a40'], water: ['#4aa8ff', '#7fd0ff'], grass: ['#6cd84c', '#9cff8a'], electric: ['#ffd93a', '#fff07a'], psychic: ['#f070e8', '#ffa0ff'], fighting: ['#d0603a', '#ff9a70'],
  normal: ['#c8c0a8', '#efe8d0'], ghost: ['#8060c0', '#b090ff'], dark: ['#7a6a8a', '#a898c0'], dragon: ['#6a60e0', '#9a90ff'], steel: ['#9aa8b8', '#c8d4e0'], rock: ['#b8a070', '#e0c898'],
  ground: ['#c8a060', '#e8c080'], bug: ['#a8c830', '#d0f060'], flying: ['#8ab0f0', '#b8d0ff'], fairy: ['#f0a0c8', '#ffc8e0'], poison: ['#b060d0', '#d898f0'], ice: ['#90e0f0', '#c0f4ff'],
};
const START_TM = { fire: 'ct_flamethrower', water: 'ct_surf', grass: 'ct_megadrain', electric: 'ct_thunder', psychic: 'ct_psychic', fighting: 'ct_bodyslam', ground: 'ct_earthquake', steel: 'ct_bodyslam', dark: 'ct_bodyslam' };
const GAB_TM = { A: 'ct_bodyslam', R: 'ct_bodyslam', D: 'ct_swift', S: 'ct_softboiled' };
// CT de départ propre à chaque lignée (variété : chaque CT disponible au stade 1 sert à 2-4 Pokémon, jamais à tout un type)
const START_TM_BY = {
  torchic: 'ct_fireblast', chimchar: 'ct_flamethrower', tepig: 'ct_bodyslam', treecko: 'ct_solar', snivy: 'ct_teleport', machop: 'ct_bodyslam', bagon: 'ct_swift', riolu: 'ct_bodyslam', meowth: 'ct_teleport', sneasel: 'ct_icebeam', zorua: 'ct_psychic',
  squirtle: 'ct_surf', turtwig: 'ct_synthesis', mudkip: 'ct_aquaring', totodile: 'ct_hydro', munchlax: 'ct_swift', beldum: 'ct_swords', hippopotas: 'ct_swords', scyther: 'ct_swift',
  charmander: 'ct_fireblast', cyndaquil: 'ct_flamethrower', piplup: 'ct_icebeam', oshawott: 'ct_hydro', weedle: 'ct_swords', remoraid: 'ct_surf', starly: 'ct_thunder', magnemite: 'ct_swords', abra: 'ct_psychic', pichu: 'ct_thunder', shinx: 'ct_thunder', litwick: 'ct_fireblast', gastly: 'ct_psychic',
  bulbasaur: 'ct_megadrain', chikorita: 'ct_synthesis', eevee: 'ct_teleport', happiny: 'ct_teleport', ralts: 'ct_softboiled', togepi: 'ct_softboiled', budew: 'ct_megadrain',
};
export function startTm(entry) {
  for (const k of [START_TM_BY[entry.key], START_TM[entry.type], GAB_TM[entry.gab], 'ct_swift']) if (k && D.TMS[k] && D.tmCompat(k, entry.type, entry.key, 0).ok) return k;
  return 'ct_swift';
}
export function archOf(entry) {
  const g = GABS[entry.gab], tc = TYPE_COLOR[entry.type] || TYPE_COLOR.normal;
  return { ...g, cls: g.name, orb: tc[1], color: tc[0], typeName: D.TYPE_FR[entry.type] || entry.type, tm: startTm(entry) };
}
