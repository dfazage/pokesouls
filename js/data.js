// Données de jeu du Chapitre Génération 1 : starters, CT, objets, ennemis, boss, formules.
// Tous les chiffres sont des valeurs de départ à équilibrer.
export const START_LEVEL = 5, MAX_LEVEL = 50;
export const EVOLVE_AT = [16, 36]; // niveaux d'évolution (stade 2, stade 3)
export const hpMult = lvl => 1 + 0.10 * (lvl - START_LEVEL);
export const dmgMult = lvl => 1 + 0.06 * (lvl - START_LEVEL);
export const levelCost = n => Math.round(60 * Math.pow(1.115, n - START_LEVEL));
export const STAGE_HP = [1, 1.35, 1.8], STAGE_DMG = [1, 1.3, 1.7];
export const essenceOf = (lv, k) => Math.round(1.4 * Math.pow(lv, 1.6) * k);

// ---------- starters (27 familles, 3 stades) ----------
export const STARTERS = {
  fire: [['charmander', 'charmeleon', 'charizard'], ['cyndaquil', 'quilava', 'typhlosion'], ['torchic', 'combusken', 'blaziken'], ['chimchar', 'monferno', 'infernape'], ['tepig', 'pignite', 'emboar'], ['fennekin', 'braixen', 'delphox'], ['litten', 'torracat', 'incineroar'], ['scorbunny', 'raboot', 'cinderace'], ['fuecoco', 'crocalor', 'skeledirge']],
  water: [['squirtle', 'wartortle', 'blastoise'], ['totodile', 'croconaw', 'feraligatr'], ['mudkip', 'marshtomp', 'swampert'], ['piplup', 'prinplup', 'empoleon'], ['oshawott', 'dewott', 'samurott'], ['froakie', 'frogadier', 'greninja'], ['popplio', 'brionne', 'primarina'], ['sobble', 'drizzile', 'inteleon'], ['quaxly', 'quaxwell', 'quaquaval']],
  grass: [['bulbasaur', 'ivysaur', 'venusaur'], ['chikorita', 'bayleef', 'meganium'], ['treecko', 'grovyle', 'sceptile'], ['turtwig', 'grotle', 'torterra'], ['snivy', 'servine', 'serperior'], ['chespin', 'quilladin', 'chesnaught'], ['rowlet', 'dartrix', 'decidueye'], ['grookey', 'thwackey', 'rillaboom'], ['sprigatito', 'floragato', 'meowscarada']],
};
export const GEN_OF = { charmander: 1, cyndaquil: 2, torchic: 3, chimchar: 4, tepig: 5, fennekin: 6, litten: 7, scorbunny: 8, fuecoco: 9, squirtle: 1, totodile: 2, mudkip: 3, piplup: 4, oshawott: 5, froakie: 6, popplio: 7, sobble: 8, quaxly: 9, bulbasaur: 1, chikorita: 2, treecko: 3, turtwig: 4, snivy: 5, chespin: 6, rowlet: 7, grookey: 8, sprigatito: 9 };
export const NAMES_FR = {
  charmander: 'Salamèche', charmeleon: 'Reptincel', charizard: 'Dracaufeu', cyndaquil: 'Héricendre', quilava: 'Feurisson', typhlosion: 'Typhlosion', torchic: 'Poussifeu', combusken: 'Galifeu', blaziken: 'Braségali', chimchar: 'Ouisticram', monferno: 'Chimpenfeu', infernape: 'Simiabraz', tepig: 'Gruikui', pignite: 'Grotichon', emboar: 'Roitiflam', fennekin: 'Feunnec', braixen: 'Roussil', delphox: 'Goupelin', litten: 'Flamiaou', torracat: 'Matoufeu', incineroar: 'Félinferno', scorbunny: 'Flambino', raboot: 'Lapyro', cinderace: 'Pyrobut', fuecoco: 'Chochodile', crocalor: 'Crocalor', skeledirge: 'Flâmigator',
  squirtle: 'Carapuce', wartortle: 'Carabaffe', blastoise: 'Tortank', totodile: 'Kaiminus', croconaw: 'Crocrodil', feraligatr: 'Aligatueur', mudkip: 'Gobou', marshtomp: 'Flobio', swampert: 'Laggron', piplup: 'Tiplouf', prinplup: 'Prinplouf', empoleon: 'Pingoléon', oshawott: 'Moustillon', dewott: 'Mateloutre', samurott: 'Clamiral', froakie: 'Grenousse', frogadier: 'Croâporal', greninja: 'Amphinobi', popplio: 'Otaquin', brionne: 'Otarlette', primarina: 'Oratoria', sobble: 'Larméléon', drizzile: 'Lézargus', inteleon: 'Intéléon', quaxly: 'Coiffeton', quaxwell: 'Canarbello', quaquaval: 'Palmaval',
  bulbasaur: 'Bulbizarre', ivysaur: 'Herbizarre', venusaur: 'Florizarre', chikorita: 'Germignon', bayleef: 'Macronium', meganium: 'Méganium', treecko: 'Arcko', grovyle: 'Massko', sceptile: 'Jungko', turtwig: 'Tortipouss', grotle: 'Boskara', torterra: 'Torterra', snivy: 'Vipélierre', servine: 'Lianaja', serperior: 'Majaspic', chespin: 'Marisson', quilladin: 'Boguérisse', chesnaught: 'Blindépique', rowlet: 'Brindibou', dartrix: 'Efflèche', decidueye: 'Archéduc', grookey: 'Ouistempo', thwackey: 'Badabouin', rillaboom: 'Gorythmic', sprigatito: 'Poussacha', floragato: 'Matourgeon', meowscarada: 'Miascarade',
  seel: 'Otaria', dewgong: 'Lamantine', shellder: 'Kokiyas', cloyster: 'Crustabri', krabby: 'Krabby', kingler: 'Krabboss', lapras: 'Lokhlass', staryu: 'Stari', starmie: 'Staross', articuno: 'Artikodin',
  magnemite: 'Magnéti', magneton: 'Magnéton', voltorb: 'Voltorbe', electrode: 'Électrode', electrodeA: 'Électrode Alpha', electabuzz: 'Élektek', pikachu: 'Pikachu', raichu: 'Raichu', zapdos: 'Électhor',
  growlithe: 'Caninos', arcanine: 'Arcanin', ponyta: 'Ponyta', rapidash: 'Galopa', magmar: 'Magmar', vulpix: 'Goupix', ninetales: 'Feunard', moltres: 'Sulfura',
  machop: 'Machoc', machoke: 'Machopeur', machamp: 'Mackogneur', geodude: 'Racaillou', graveler: 'Gravalanch', golem: 'Grolem', onix: 'Onix', rhyhorn: 'Rhinocorne', rhydon: 'Rhinoféros', dragonite: 'Dracolosse', dragonair: 'Draco', snorlax: 'Ronflex',
  koffing: 'Smogo', weezing: 'Smogogo', porygon: 'Porygon', mewtwo: 'Mewtwo', exeggcute: 'Noeunoeuf', exeggutor: 'Noadkoko', abra: 'Abra', kadabra: 'Kadabra', haunter: 'Spectrum', gengar: 'Ectoplasma', mrmime: 'M. Mime', chansey: 'Leveinard', mew: 'Mew', clone: 'Clone', decoy: 'Mirage',
};
// noms des espèces du pool jouable (GDD v3)
Object.assign(NAMES_FR, { bagon: 'Draby', shelgon: 'Drackhaus', salamence: 'Drattak', riolu: 'Riolu', lucario: 'Lucario', meowth: 'Miaouss', persian: 'Persian', sneasel: 'Farfuret', weavile: 'Dimoret', zorua: 'Zorua', zoroark: 'Zoroark', munchlax: 'Goinfrex', steelix: 'Steelix', beldum: 'Terhal', metang: 'Métang', metagross: 'Métalosse', hippopotas: 'Hippopotas', hippowdon: 'Hippodocus', scyther: 'Insécateur', scizor: 'Cizayox', weedle: 'Aspicot', kakuna: 'Coconfort', beedrill: 'Dardargnan', remoraid: 'Rémoraid', octillery: 'Octillery', starly: 'Étourmi', staravia: 'Étourvol', staraptor: 'Étouraptor', magnezone: 'Magnézone', alakazam: 'Alakazam', pichu: 'Pichu', litwick: 'Lugulabre', lampent: 'Funécire', chandelure: 'Chandelure', gastly: 'Fantominus', eevee: 'Évoli', happiny: 'Ptiravi', blissey: 'Leuphorya', ralts: 'Tarsal', kirlia: 'Kirlia', gardevoir: 'Gardevoir', togepi: 'Togepi', togetic: 'Togetic', togekiss: 'Togekiss', budew: 'Rozbouton', roselia: 'Rosélia', roserade: 'Roserade' });
// Archétypes par type (stade 1, niveau 5)
export const ARCH = {
  fire: { cls: 'Brûleur', mode: 'melee', hp: 90, speed: 84, range: 26, dmg: 9, light: 'Attack', heavy: 'Swing', orb: '#ff9a40', color: '#ff7a30', typeName: 'Feu', tm: 'ct_flamethrower' },
  water: { cls: 'Gardien', mode: 'melee', hp: 130, speed: 70, range: 28, dmg: 7, light: 'Attack', heavy: 'Swing', guard: 0.2, orb: '#7fd0ff', color: '#4aa8ff', typeName: 'Eau', tm: 'ct_surf' },
  grass: { cls: 'Rôdeur', mode: 'ranged', hp: 80, speed: 78, range: 115, dmg: 7, light: 'Shoot', heavy: 'Shoot', orb: '#9cff8a', color: '#6cd84c', typeName: 'Plante', tm: 'ct_megadrain' },
};

// ---------- CT (capacités spéciales) ----------
// kind : lunge, shock, volley, burst, heal (équipe entière), regen, cleanse, beam, leech, haste, smoke, flame
// types : types de Pokémon pouvant l'apprendre ('all' = tous) ; minStage : stade d'évolution minimal (0, 1, 2)
// anims : animations du sprite, par ordre de préférence (PMDCollab) ; status : [effet, probabilité]
const ALL = 'all';
export const TMS = {
  ct_flamethrower: { name: 'Lance-Flammes', type: 'Feu', kind: 'flame', cost: 18, cd: 4.5, mult: 0.9, anims: ['Shoot', 'SpAttack', 'Charge'], color: '#ff8a30', types: ['fire'], status: ['burn', 0.3], desc: 'Jet de flammes court et large. Peut brûler.' },
  ct_fireblast: { name: 'Déflagration', type: 'Feu', kind: 'burst', cost: 24, cd: 6.5, mult: 2.8, anims: ['Shoot', 'SpAttack', 'Charge'], color: '#ff6a30', types: ['fire'], status: ['burn', 0.4], desc: 'Boule de feu explosive. Peut brûler.' },
  ct_surf: { name: 'Surf', type: 'Eau', kind: 'shock', cost: 20, cd: 5, mult: 1.6, anims: ['Rotate', 'Swing'], color: '#5ab8ff', radius: 62, types: ['water'], desc: 'Vague circulaire qui repousse.' },
  ct_hydro: { name: 'Hydrocanon', type: 'Eau', kind: 'beam', cost: 26, cd: 7, mult: 2.4, anims: ['Shoot', 'SpAttack', 'Charge'], color: '#4ab0ff', types: ['water'], desc: 'Jet d’eau en ligne droite.' },
  ct_icebeam: { name: 'Laser Glace', type: 'Glace', kind: 'beam', cost: 22, cd: 6, mult: 2.0, anims: ['Shoot', 'SpAttack', 'Charge'], color: '#b0f0ff', types: ['water', 'ice'], status: ['freeze', 0.25], desc: 'Rayon glacé en ligne. Peut geler.' },
  ct_megadrain: { name: 'Méga-Sangsue', type: 'Plante', kind: 'leech', cost: 18, cd: 5, mult: 1.2, anims: ['Shoot', 'SpAttack', 'Charge'], color: '#7bff7b', types: ['grass'], desc: 'Frappe à distance et soigne le lanceur.' },
  ct_solar: { name: 'Lance-Soleil', type: 'Plante', kind: 'beam', cost: 26, cd: 7, mult: 2.6, anims: ['Shoot', 'SpAttack', 'Charge'], color: '#d4ff6a', types: ['grass'], desc: 'Rayon de lumière en ligne.' },
  ct_bodyslam: { name: 'Plaquage', type: 'Normal', kind: 'lunge', cost: 18, cd: 4.5, mult: 2.0, anims: ['Attack', 'Strike'], color: '#ffe27a', types: ['fire', 'water', 'grass', 'fighting', 'ground', 'steel', 'dark', 'poison'], status: ['para', 0.2], desc: 'Charge puissante vers l’avant. Peut paralyser.' },
  ct_earthquake: { name: 'Séisme', type: 'Sol', kind: 'shock', cost: 24, cd: 7, mult: 2.0, anims: ['Hop', 'Rotate', 'Swing'], color: '#c8a070', radius: 70, types: [ALL], minStage: 1, desc: 'Saut et secousse autour de soi.' },
  ct_swift: { name: 'Météores', type: 'Normal', kind: 'volley', cost: 18, cd: 5, mult: 0.8, anims: ['Shoot', 'SpAttack', 'Charge'], color: '#fff2a0', types: [ALL], desc: 'Gerbe de cinq étoiles.' },
  ct_thunder: { name: 'Tonnerre', type: 'Électrik', kind: 'burst', cost: 22, cd: 6, mult: 2.4, anims: ['Shoot', 'SpAttack', 'Charge'], color: '#ffe84a', types: ['electric', 'steel', 'fairy', 'psychic', 'flying', 'dark'], status: ['para', 0.35], desc: 'Décharge explosive. Peut paralyser.' },
  ct_psychic: { name: 'Psyko', type: 'Psy', kind: 'burst', cost: 24, cd: 6.5, mult: 2.6, anims: ['Shoot', 'SpAttack', 'Charge'], color: '#ff9aff', types: ['psychic', 'ghost', 'dark', 'fairy'], status: ['confuse', 0.3], desc: 'Onde psychique explosive. Peut rendre confus.' },
  ct_teleport: { name: 'Double Équipe', type: 'Normal', kind: 'smoke', cost: 16, cd: 5, mult: 1.9, anims: ['Double', 'Attack'], color: '#9a8cc0', types: [ALL], desc: 'Passe dans le dos de la cible et frappe.' },
  ct_swords: { name: 'Danse-Lames', type: 'Normal', kind: 'haste', cost: 16, cd: 14, mult: 1.5, anims: ['Rotate', 'Shake', 'Charge'], color: '#ff9a9a', types: ['fire', 'water', 'grass', 'fighting', 'dark', 'steel', 'ground', 'poison'], desc: 'Dégâts ×1,5 pendant 10 s.' },
  ct_hyper: { name: 'Ultralaser', type: 'Normal', kind: 'beam', cost: 32, cd: 9, mult: 3.4, anims: ['Shoot', 'SpAttack', 'Charge'], color: '#fff0c0', types: [ALL], minStage: 2, desc: 'Rayon dévastateur (formes finales).' },
  // soins de zone : toute l'équipe, y compris les Pokémon au repos
  ct_softboiled: { name: 'Soin', type: 'Normal', kind: 'heal', cost: 20, cd: 9, mult: 0.3, anims: ['Charge', 'Shake'], color: '#ffb0d8', radius: 110, types: ['grass', 'water', 'psychic', 'fairy'], desc: 'Soigne 30 % des PV de toute l’équipe.' },
  ct_synthesis: { name: 'Synthèse', type: 'Plante', kind: 'heal', cost: 22, cd: 10, mult: 0.35, anims: ['Shake', 'Charge'], color: '#9cff8a', radius: 120, types: ['grass'], cure: true, desc: 'Soigne 35 % des PV de toute l’équipe et guérit les altérations.' },
  ct_aquaring: { name: 'Anneau Hydro', type: 'Eau', kind: 'regen', cost: 18, cd: 12, mult: 0.045, anims: ['Charge', 'Shake'], color: '#7fd0ff', radius: 80, types: ['water'], desc: 'Régénère les PV du lanceur pendant 8 s.' },
  ct_healbell: { name: 'Glas de Soin', type: 'Normal', kind: 'cleanse', cost: 20, cd: 12, mult: 0.15, anims: ['Shake', 'Charge'], color: '#ffe9a0', radius: 130, types: [ALL], minStage: 1, desc: 'Guérit les altérations et soigne 15 % des PV de toute l’équipe.' },
};
// types des espèces à partir du stade 2 (le premier type est celui de la famille : Feu, Eau ou Plante)
export const SECOND_TYPE = { charizard: 'flying', combusken: 'fighting', blaziken: 'fighting', monferno: 'fighting', infernape: 'fighting', pignite: 'fighting', emboar: 'fighting', delphox: 'psychic', skeledirge: 'ghost', crocalor: 'ghost', incineroar: 'dark',
  marshtomp: 'ground', swampert: 'ground', empoleon: 'steel', greninja: 'dark', primarina: 'fairy', brionne: 'fairy', quaquaval: 'fighting', quaxwell: 'fighting',
  bulbasaur: 'poison', ivysaur: 'poison', venusaur: 'poison', torterra: 'ground', grotle: 'ground', chesnaught: 'fighting', quilladin: 'fighting', rowlet: 'flying', dartrix: 'flying', decidueye: 'ghost', meowscarada: 'dark', floragato: 'dark' };
export const TYPE_FR = { bug: 'Insecte', rock: 'Roche', fire: 'Feu', water: 'Eau', grass: 'Plante', flying: 'Vol', fighting: 'Combat', psychic: 'Psy', ghost: 'Spectre', dark: 'Ténèbres', ground: 'Sol', steel: 'Acier', fairy: 'Fée', poison: 'Poison', electric: 'Électrik', ice: 'Glace', normal: 'Normal' };
// types complets des formes hors starters (les starters gardent la table SECOND_TYPE de data.js)
export const FORM_TYPES = {
  machop: ['fighting'], machoke: ['fighting'], machamp: ['fighting'], bagon: ['dragon'], shelgon: ['dragon'], salamence: ['dragon', 'flying'], riolu: ['fighting'], lucario: ['fighting', 'steel'],
  meowth: ['normal'], persian: ['normal'], sneasel: ['dark', 'ice'], weavile: ['dark', 'ice'], zorua: ['dark'], zoroark: ['dark'],
  munchlax: ['normal'], snorlax: ['normal'], onix: ['rock', 'ground'], steelix: ['steel', 'ground'], beldum: ['steel', 'psychic'], metang: ['steel', 'psychic'], metagross: ['steel', 'psychic'], hippopotas: ['ground'], hippowdon: ['ground'], scyther: ['bug', 'flying'], scizor: ['bug', 'steel'],
  weedle: ['bug', 'poison'], kakuna: ['bug', 'poison'], beedrill: ['bug', 'poison'], remoraid: ['water'], octillery: ['water'], starly: ['normal', 'flying'], staravia: ['normal', 'flying'], staraptor: ['normal', 'flying'],
  magnemite: ['electric', 'steel'], magneton: ['electric', 'steel'], magnezone: ['electric', 'steel'], abra: ['psychic'], kadabra: ['psychic'], alakazam: ['psychic'], pichu: ['electric'], pikachu: ['electric'], raichu: ['electric'],
  litwick: ['ghost', 'fire'], lampent: ['ghost', 'fire'], chandelure: ['ghost', 'fire'], gastly: ['ghost', 'poison'], haunter: ['ghost', 'poison'], gengar: ['ghost', 'poison'],
  eevee: ['normal'], happiny: ['normal'], chansey: ['normal'], blissey: ['normal'], ralts: ['psychic', 'fairy'], kirlia: ['psychic', 'fairy'], gardevoir: ['psychic', 'fairy'],
  togepi: ['fairy'], togetic: ['fairy', 'flying'], togekiss: ['fairy', 'flying'], budew: ['grass', 'poison'], roselia: ['grass', 'poison'], roserade: ['grass', 'poison'],
};

export const typesOf = (family, id) => FORM_TYPES[id] || (SECOND_TYPE[id] ? [family, SECOND_TYPE[id]] : [family]);
export function tmCompat(tmKey, family, id, stage) {
  const t = TMS[tmKey]; if (!t) return { ok: false, why: 'CT inconnue' };
  if ((t.minStage || 0) > stage) return { ok: false, why: 'Nécessite le stade ' + (t.minStage + 1) + ' d’évolution' };
  if (t.types.includes('all')) return { ok: true };
  const mine = typesOf(family, id);
  if (mine.some(x => t.types.includes(x))) return { ok: true };
  return { ok: false, why: 'Réservée aux types : ' + t.types.map(x => TYPE_FR[x]).join(', ') };
}

// ---------- altérations d'état ----------
export const STATUS = {
  burn: { name: 'Brûlure', tag: 'BRÛ', color: '#ff7a30', dur: 6, dot: 0.03 },
  poison: { name: 'Poison', tag: 'POI', color: '#c070ff', dur: 8, dot: 0.02 },
  freeze: { name: 'Gel', tag: 'GEL', color: '#9fe8ff', dur: 1.8 },
  para: { name: 'Paralysie', tag: 'PAR', color: '#ffe84a', dur: 7 },
  confuse: { name: 'Confusion', tag: 'CON', color: '#ff9aff', dur: 5 },
};
// altération infligée par un ennemi [effet, probabilité par coup]
export const ENEMY_STATUS = {
  seel: ['freeze', 0.15], shellder: ['freeze', 0.2], dewgong: ['freeze', 0.25], cloyster: ['freeze', 0.25], starmie: ['confuse', 0.2], lapras: ['freeze', 0.3],
  magnemite: ['para', 0.25], voltorb: ['para', 0.3], pikachu: ['para', 0.2], magneton: ['para', 0.3], electrode: ['para', 0.3], raichu: ['para', 0.3], electabuzz: ['para', 0.4],
  vulpix: ['burn', 0.25], growlithe: ['burn', 0.2], ponyta: ['burn', 0.2], ninetales: ['burn', 0.3], rapidash: ['burn', 0.3], arcanine: ['burn', 0.3], magmar: ['burn', 0.4],
  koffing: ['poison', 0.3], weezing: ['poison', 0.35], porygon: ['para', 0.2], electrodeA: ['para', 0.4],
  exeggcute: ['confuse', 0.2], abra: ['confuse', 0.25], haunter: ['confuse', 0.25], kadabra: ['confuse', 0.3], gengar: ['poison', 0.3], mrmime: ['confuse', 0.3], exeggutor: ['confuse', 0.35],
  machoke: null, dragonair: ['para', 0.2], clone: ['confuse', 0.3], decoy: ['confuse', 0.3],
};

// ---------- objets ----------
export const VITAMINS = {
  hpup: { name: 'PV Plus', desc: 'PV max +8 % (jusqu’à 5 fois)' },
  protein: { name: 'Protéine', desc: 'Dégâts +6 % (5 fois)' },
  iron: { name: 'Fer', desc: 'Dégâts reçus −4 % (5 fois)' },
  calcium: { name: 'Calcium', desc: 'Dégâts des CT +8 % (5 fois)' },
  carbos: { name: 'Carbone', desc: 'Vitesse +3 % (5 fois)' },
  zinc: { name: 'Zinc', desc: 'Endurance max +6 (5 fois)' },
};
export const ITEM_NAMES = { candy: 'Super Bonbon', berrypack: 'Baies ×2', maxberry: 'Baie Oran Plus', etherpack: 'Huile', maxether: 'Huile Max', revive: 'Rappel', ...Object.fromEntries(Object.entries(VITAMINS).map(([k, v]) => [k, v.name])), ...Object.fromEntries(Object.entries(TMS).map(([k, v]) => [k, 'CT : ' + v.name])) };

// ---------- ennemis ----------
// tier : mini | mid | big ; kind : melee | ranged | ranged3 | bomb | roller | slam
const TIER = {
  mini: { hp: 26, dmg: 6, speed: 52, sight: 120, windup: 0.55, k: 1 },
  mid: { hp: 70, dmg: 10, speed: 50, sight: 140, windup: 0.65, k: 2.6, elite: true },
  big: { hp: 300, dmg: 16, speed: 48, sight: 150, windup: 0.8, k: 9, elite: true, armor: true, mini: true, scale: 1.35 },
};
const E = (tier, kind, o = {}) => ({ tier, kind, ...TIER[tier], ...o });
export const ENEMIES = {
  // mannequin du tutoriel (ne meurt pas, frappe faiblement et lentement)
  dummy: E('mini', 'melee', { lunge: 90, range: 22, anim: 'Attack', sprite: 'seel', hp: 9000, dmg: 2, speed: 34, windup: 0.95 }),
  // Îles Écume
  seel: E('mini', 'melee', { lunge: 140, range: 22, anim: 'Attack' }),
  shellder: E('mini', 'ranged', { range: 100, proj: 100, anim: 'Shoot', color: '#9fe8ff', hp: 22, speed: 40 }),
  krabby: E('mini', 'melee', { lunge: 170, range: 22, anim: 'Attack', speed: 60, hp: 24 }),
  dewgong: E('mid', 'ranged3', { range: 105, proj: 115, anim: 'Shoot', color: '#bfeaff' }),
  starmie: E('mid', 'ranged', { range: 110, proj: 150, anim: 'Shoot', color: '#d8a0ff', dmg: 9, speed: 62, windup: 0.5 }),
  cloyster: E('mid', 'slam', { range: 110, anim: 'Shoot', color: '#9fe8ff', blast: 34, windup: 0.9, hp: 90 }),
  lapras: E('big', 'slam', { range: 120, anim: 'Shoot', color: '#7fd0ff', blast: 46, windup: 0.9, scale: 1.0 }),
  // Centrale
  magnemite: E('mini', 'ranged', { range: 100, proj: 105, anim: 'Shoot', color: '#8ef0ff', fly: true, hp: 22 }),
  voltorb: E('mini', 'bomb', { blast: 42, range: 18, speed: 95, windup: 0.75, anim: 'Attack', dormant: true, sight: 60, hp: 20, dmg: 12 }),
  pikachu: E('mini', 'melee', { lunge: 180, range: 20, anim: 'Attack', speed: 64, hp: 22 }),
  magneton: E('mid', 'ranged3', { range: 110, proj: 120, anim: 'Shoot', color: '#8ef0ff', fly: true }),
  electrode: E('mid', 'roller', { range: 70, anim: 'Attack', hp: 80 }),
  raichu: E('mid', 'melee', { lunge: 200, range: 24, anim: 'Attack', speed: 62, dmg: 12, hp: 80 }),
  electabuzz: E('big', 'slam', { range: 110, anim: 'Shoot', color: '#ffe84a', blast: 44, scale: 1.3 }),
  // Mont Braise
  vulpix: E('mini', 'ranged', { range: 100, proj: 110, anim: 'Shoot', color: '#ff9a40', hp: 22 }),
  growlithe: E('mini', 'melee', { lunge: 170, range: 22, anim: 'Attack', speed: 60 }),
  ponyta: E('mini', 'melee', { lunge: 220, range: 22, anim: 'Attack', speed: 70, hp: 24 }),
  ninetales: E('mid', 'ranged3', { range: 110, proj: 120, anim: 'Shoot', color: '#ff7a30' }),
  rapidash: E('mid', 'roller', { range: 80, anim: 'Attack', hp: 80 }),
  arcanine: E('mid', 'melee', { lunge: 210, range: 26, anim: 'Attack', speed: 64, dmg: 13, hp: 95 }),
  magmar: E('big', 'slam', { range: 110, anim: 'Shoot', color: '#ff6a30', blast: 46, scale: 1.35 }),
  // Route Victoire
  machop: E('mini', 'melee', { lunge: 150, range: 24, anim: 'Attack', hp: 30 }),
  geodude: E('mini', 'melee', { lunge: 110, range: 22, anim: 'Attack', speed: 38, hp: 40 }),
  rhyhorn: E('mini', 'roller', { range: 65, anim: 'Attack', hp: 36, dmg: 9 }),
  machoke: E('mid', 'melee', { lunge: 170, range: 26, anim: 'Attack', dmg: 14, hp: 100 }),
  graveler: E('mid', 'slam', { range: 100, anim: 'Attack', blast: 36, hp: 100 }),
  dragonair: E('mid', 'ranged3', { range: 115, proj: 125, anim: 'Shoot', color: '#9ab0ff' }),
  rhydon: E('mid', 'roller', { range: 80, anim: 'Attack', hp: 110, dmg: 14 }),
  snorlax: E('big', 'slam', { range: 100, anim: 'Attack', blast: 52, scale: 1.3, hp: 360 }),
  // Laboratoire
  koffing: E('mini', 'melee', { lunge: 150, range: 22, anim: 'Attack', fly: true, hp: 28 }),
  porygon: E('mid', 'ranged3', { range: 105, proj: 120, anim: 'Shoot', color: '#ff9acb', fly: true }),
  weezing: E('mid', 'slam', { range: 105, anim: 'Shoot', color: '#c070ff', blast: 38, fly: true, hp: 95 }),
  electrodeA: E('big', 'roller', { range: 90, anim: 'Attack', scale: 1.7, sprite: 'electrode' }),
  // Île Mystère
  exeggcute: E('mini', 'ranged', { range: 100, proj: 95, anim: 'Shoot', color: '#ffb0d8', hp: 26, speed: 44 }),
  abra: E('mini', 'ranged', { range: 110, proj: 150, anim: 'Shoot', color: '#e8a0ff', hp: 20, speed: 66, windup: 0.45 }),
  haunter: E('mini', 'melee', { lunge: 170, range: 22, anim: 'Attack', fly: true, hp: 28 }),
  kadabra: E('mid', 'ranged3', { range: 115, proj: 135, anim: 'Shoot', color: '#e8a0ff' }),
  gengar: E('mid', 'melee', { lunge: 220, range: 26, anim: 'Attack', dmg: 13, hp: 90, speed: 62 }),
  mrmime: E('mid', 'slam', { range: 105, anim: 'Shoot', color: '#ff9aff', blast: 38, hp: 90 }),
  exeggutor: E('big', 'slam', { range: 115, anim: 'Shoot', color: '#ffb0d8', blast: 48, scale: 1.15 }),
  // Invocations de boss
  clone: { tier: 'mini', kind: 'ranged', hp: 30, dmg: 10, speed: 0, sight: 400, range: 400, windup: 0.9, anim: 'Shoot', proj: 120, color: '#c070ff', rec: 2.4, clone: true, k: 0, sprite: 'mewtwo' },
  decoy: { tier: 'mini', kind: 'ranged', hp: 34, dmg: 8, speed: 50, sight: 400, range: 220, windup: 0.8, anim: 'Shoot', proj: 110, color: '#ffb0d8', rec: 1.6, clone: true, k: 0, sprite: 'mew', fly: true },
};
export const spriteOfEnemy = t => (ENEMIES[t] && ENEMIES[t].sprite) || t;

// ---------- boss ----------
// moves[phase-1] : liste [attaque, poids] ; attaques : ball, volley, nova, swing, pulse, dash, rain, beam, summon
export const BOSSES = {
  articuno: { sprite: 'articuno', phases: ['Le blizzard se lève', 'Zéro absolu'], status: ['freeze', 0.25], name: 'ARTIKODIN', sub: 'L’oiseau des glaces', hp: 380, dmg: 13, r: 12, speed: 56, color: '#9fe8ff', glow: [140, 220, 255], hover: true, rainColor: '#bfeaff',
    moves: [[['ball', 3], ['volley', 2], ['rain', 2]], [['ball', 2], ['volley', 2], ['rain', 3], ['nova', 2], ['dash', 1]], [['volley', 2], ['rain', 3], ['nova', 3], ['dash', 2]]] },
  zapdos: { sprite: 'zapdos', phases: ['L’orage gronde', 'Foudre déchaînée'], status: ['para', 0.3], name: 'ÉLECTHOR', sub: 'L’oiseau de la foudre', hp: 480, dmg: 14, r: 11, speed: 62, color: '#ffe84a', glow: [255, 235, 90], hover: true, rainColor: '#fff58a',
    moves: [[['ball', 2], ['rain', 3], ['dash', 2]], [['volley', 2], ['rain', 3], ['dash', 2], ['nova', 2]], [['rain', 4], ['nova', 3], ['dash', 3], ['beam', 2]]] },
  moltres: { sprite: 'moltres', phases: ['Les braises s’embrasent', 'Renaissance ardente'], status: ['burn', 0.3], name: 'SULFURA', sub: 'L’oiseau des flammes', hp: 600, dmg: 15, r: 12, speed: 58, color: '#ff8a30', glow: [255, 140, 60], hover: true, rainColor: '#ff9a50',
    moves: [[['ball', 3], ['volley', 2], ['swing', 2]], [['pulse', 3], ['volley', 2], ['dash', 2], ['ball', 2]], [['pulse', 3], ['nova', 3], ['rain', 3], ['dash', 2]]] },
  dragonite: { sprite: 'dragonite', phases: ['Le roi s’éveille', 'Colère du dragon'], status: ['para', 0.2], name: 'DRACOLOSSE', sub: 'Roi de Kanto', hp: 760, dmg: 17, r: 12, speed: 60, color: '#ffb060', glow: [255, 180, 90], rainColor: '#ffc080',
    moves: [[['swing', 3], ['dash', 2], ['ball', 2]], [['swing', 2], ['beam', 3], ['volley', 2], ['dash', 2]], [['beam', 3], ['rain', 3], ['nova', 2], ['dash', 3], ['swing', 2]]] },
  mewtwo: { sprite: 'mewtwo', phases: ['L’esprit s’ouvre', 'Clones psychiques'], status: ['confuse', 0.25], name: 'MEWTWO', sub: 'Le Cloné', hp: 950, dmg: 18, r: 9, speed: 54, color: '#d89aff', glow: [180, 100, 255], hover: true, rainColor: '#e0a0ff', summon: 'clone',
    moves: [[['ball', 3], ['swing', 3]], [['ball', 3], ['swing', 2], ['pulse', 3]], [['ball', 3], ['swing', 2], ['pulse', 3], ['summon', 2]]] },
  mew: { sprite: 'mew', phases: ['Le mythe s’éveille', 'Tous les possibles'], status: ['confuse', 0.25], name: 'MEW', sub: 'Le Mythe', hp: 1000, dmg: 18, r: 8, speed: 66, color: '#ffb0e8', glow: [255, 150, 220], hover: true, rainColor: '#ffc0f0', summon: 'decoy', blink: true,
    moves: [[['volley', 3], ['ball', 2], ['rain', 2]], [['volley', 2], ['nova', 3], ['rain', 3], ['summon', 2]], [['volley', 2], ['nova', 3], ['rain', 3], ['pulse', 2], ['summon', 2]]] },
};
export const BOSS_THRESHOLDS = [0.6, 0.25];
