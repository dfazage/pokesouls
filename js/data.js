// Données de jeu du Chapitre Génération 1 : starters, CT, objets, ennemis, boss, formules.
// Tous les chiffres sont des valeurs de départ à équilibrer.
export const START_LEVEL = 5, MAX_LEVEL = 50;
export const EVOLVE_AT = [16, 36]; // niveaux d'évolution (stade 2, stade 3)
export const hpMult = lvl => 1 + 0.10 * (lvl - START_LEVEL);
export const dmgMult = lvl => 1 + 0.06 * (lvl - START_LEVEL);
export const levelCost = n => Math.round(60 * Math.pow(1.115, n - START_LEVEL));
export const STAGE_HP = [1, 1.35, 1.8], STAGE_DMG = [1, 1.3, 1.7];
// Essence lâchée : proportionnelle au coût d'un niveau au niveau de l'ennemi (ESS_RATE × coût × k). Une carte entière rapporte ~18 niveaux-équipe à la même cadence que les cartes d'avant,
// ce qui garde l'équipe à peu près au niveau de la carte (±3) au lieu de la dépasser de 8-10 niveaux. Un seul réglage : ESS_RATE.
export const ESS_RATE = 0.18;
export const essenceOf = (lv, k) => Math.max(1, Math.round(ESS_RATE * levelCost(lv) * k));

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
  magnemite: 'Magnéti', magneton: 'Magnéton', voltorb: 'Voltorbe', electrode: 'Électrode', electrodeA: 'Électrode Alpha', dragoniteK: 'Dracolosse', electabuzz: 'Élektek', pikachu: 'Pikachu', raichu: 'Raichu', zapdos: 'Électhor',
  growlithe: 'Caninos', arcanine: 'Arcanin', ponyta: 'Ponyta', rapidash: 'Galopa', magmar: 'Magmar', vulpix: 'Goupix', ninetales: 'Feunard', moltres: 'Sulfura',
  machop: 'Machoc', machoke: 'Machopeur', machamp: 'Mackogneur', geodude: 'Racaillou', graveler: 'Gravalanch', golem: 'Grolem', onix: 'Onix', rhyhorn: 'Rhinocorne', rhydon: 'Rhinoféros', dragonite: 'Dracolosse', dragonair: 'Draco', snorlax: 'Ronflex',
  koffing: 'Smogo', weezing: 'Smogogo', porygon: 'Porygon', mewtwo: 'Mewtwo', exeggcute: 'Noeunoeuf', exeggutor: 'Noadkoko', abra: 'Abra', kadabra: 'Kadabra', haunter: 'Spectrum', gengar: 'Ectoplasma', mrmime: 'M. Mime', chansey: 'Leveinard', mew: 'Mew', clone: 'Clone', decoy: 'Mirage',
};
Object.assign(NAMES_FR, { raikou: 'Raikou', entei: 'Entei', suicune: 'Suicune', lugia: 'Lugia', celebi: 'Celebi', mareep: 'Wattouat', flaaffy: 'Lainergie', ampharos: 'Pharamp', chinchou: 'Loupio', lanturn: 'Lanturn', slugma: 'Limagma', magcargo: 'Volcaropod', houndour: 'Malosse', houndoom: 'Démolosse', magby: 'Magby', marill: 'Marill', azumarill: 'Azumarill', wooper: 'Axoloto', quagsire: 'Maraiste', horsea: 'Hypotrempe', seadra: 'Hypocéan', tentacool: 'Tentacool', tentacruel: 'Tentacruel', mantine: 'Démanta', kingdra: 'Hyporoi', hoppip: 'Granivol', skiploom: 'Floravol', sunkern: 'Tournegrin', sunflora: 'Héliatronc', pineco: 'Pomdepik', forretress: 'Foretress' });   // Johto (chapitre II)
NAMES_FR.genesect = 'Fala';   // Genesect secret, débloqué par sa quête dans la Centrale
// noms des espèces du pool jouable (GDD v3)
Object.assign(NAMES_FR, { tyranitarK: 'Tyranocif', salamenceK: 'Drattak', garchompK: 'Carchacrok', goodraK: 'Muplodocus', houndoomA: 'Démolosse Alpha', mantineB: 'Démanta', kingdraB: 'Hyporoi', meganiumB: 'Méganium', magmarJ: 'Magmar', reflet: 'Reflet', reve: 'Rêve', metagrossK: 'Métalosse', bagon: 'Draby', shelgon: 'Drackhaus', salamence: 'Drattak', riolu: 'Riolu', lucario: 'Lucario', meowth: 'Miaouss', persian: 'Persian', sneasel: 'Farfuret', weavile: 'Dimoret', zorua: 'Zorua', zoroark: 'Zoroark', munchlax: 'Goinfrex', steelix: 'Steelix', beldum: 'Terhal', metang: 'Métang', metagross: 'Métalosse', hippopotas: 'Hippopotas', hippowdon: 'Hippodocus', scyther: 'Insécateur', scizor: 'Cizayox', weedle: 'Aspicot', kakuna: 'Coconfort', beedrill: 'Dardargnan', remoraid: 'Rémoraid', octillery: 'Octillery', starly: 'Étourmi', staravia: 'Étourvol', staraptor: 'Étouraptor', magnezone: 'Magnézone', alakazam: 'Alakazam', pichu: 'Pichu', litwick: 'Lugulabre', lampent: 'Funécire', chandelure: 'Chandelure', gastly: 'Fantominus', eevee: 'Évoli', happiny: 'Ptiravi', blissey: 'Leuphorya', ralts: 'Tarsal', kirlia: 'Kirlia', gardevoir: 'Gardevoir', togepi: 'Togepi', togetic: 'Togetic', togekiss: 'Togekiss', budew: 'Rozbouton', roselia: 'Rosélia', roserade: 'Roserade' });
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
FORM_TYPES.genesect = ['bug', 'steel'];   // Fala (secret) : défense Insecte/Acier ; l'élément offensif vient du Module équipé

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
  pichu: ['para', 0.2], mareep: ['para', 0.25], chinchou: ['para', 0.25], flaaffy: ['para', 0.3], lanturn: ['para', 0.3], togetic: ['confuse', 0.2], ampharos: ['para', 0.4],
  houndour: ['burn', 0.2], slugma: ['burn', 0.2], magby: ['burn', 0.25], houndoom: ['burn', 0.3], magcargo: ['burn', 0.3], magmarJ: ['burn', 0.35], houndoomA: ['burn', 0.4],
  remoraid: ['freeze', 0.15], octillery: ['freeze', 0.2], mantineB: ['freeze', 0.3], tentacool: ['poison', 0.3], tentacruel: ['poison', 0.35], seadra: ['poison', 0.2], mantine: ['freeze', 0.2], kingdraB: ['freeze', 0.3],
  skiploom: ['poison', 0.2], sunflora: ['para', 0.2], pineco: ['poison', 0.2], meganiumB: ['poison', 0.3], reflet: ['freeze', 0.2], reve: ['confuse', 0.2],
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
  // Mini-boss de Mont Braise : Dracolosse, roi de Kanto
  dragoniteK: E('big', 'slam', { range: 115, anim: 'Attack', blast: 52, scale: 1.25, hp: 420, sprite: 'dragonite' }),
  // Anciens mobs de la Route Victoire
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
  // Johto · Tour Carillon
  pichu: E('mini', 'melee', { lunge: 170, range: 20, anim: 'Attack', speed: 64, hp: 20 }),
  mareep: E('mini', 'ranged', { range: 100, proj: 105, anim: 'Shoot', color: '#ffe84a', hp: 24, speed: 44 }),
  chinchou: E('mini', 'ranged', { range: 100, proj: 100, anim: 'Shoot', color: '#8ef0ff', fly: true, hp: 22 }),
  flaaffy: E('mid', 'ranged3', { range: 110, proj: 120, anim: 'Shoot', color: '#ffe84a' }),
  lanturn: E('mid', 'slam', { range: 105, anim: 'Shoot', color: '#8ef0ff', blast: 36, hp: 90 }),
  togetic: E('mid', 'melee', { lunge: 190, range: 24, anim: 'Attack', fly: true, dmg: 11, hp: 80 }),
  ampharos: E('big', 'slam', { range: 115, anim: 'Shoot', color: '#ffe84a', blast: 46, scale: 1.25 }),

  // ----- Johto : Tour Brûlée (feu, meutes) -----
  houndour: E('mini', 'melee', { lunge: 190, range: 20, anim: 'Attack', speed: 70, hp: 24 }),
  slugma: E('mini', 'ranged', { range: 85, proj: 90, anim: 'Shoot', color: '#ff7a30', hp: 30, speed: 30 }),
  magby: E('mini', 'ranged', { range: 100, proj: 110, anim: 'Shoot', color: '#ff8a40', hp: 22, speed: 46 }),
  houndoom: E('mid', 'melee', { lunge: 215, range: 24, anim: 'Attack', speed: 68, dmg: 12, hp: 82 }),
  magcargo: E('mid', 'slam', { range: 100, anim: 'Attack', blast: 36, windup: 0.95, hp: 105, speed: 34 }),
  magmarJ: E('mid', 'ranged3', { range: 108, proj: 120, anim: 'Shoot', color: '#ff6a30', sprite: 'magmar', hp: 85 }),
  houndoomA: E('big', 'roller', { range: 95, anim: 'Attack', scale: 1.5, hp: 360, sprite: 'houndoom' }),
  tyranitarK: E('big', 'slam', { range: 130, anim: 'Attack', color: '#a8b070', blast: 62, scale: 1.6, hp: 760, dmg: 21, windup: 0.7, speed: 42, k: 24, sprite: 'tyranitar', pseudo: true }),
  // ----- Johto : Lac du Miroir (eau, apparitions depuis le bord) -----
  marill: E('mini', 'melee', { lunge: 150, range: 20, anim: 'Attack', speed: 54, hp: 26 }),
  wooper: E('mini', 'melee', { lunge: 130, range: 22, anim: 'Attack', speed: 46, hp: 30 }),
  remoraid: E('mini', 'ranged', { range: 105, proj: 120, anim: 'Shoot', color: '#9fe8ff', hp: 22, speed: 48 }),
  azumarill: E('mid', 'melee', { lunge: 190, range: 24, anim: 'Attack', speed: 58, dmg: 12, hp: 92 }),
  quagsire: E('mid', 'slam', { range: 100, anim: 'Attack', blast: 38, windup: 0.9, hp: 110, speed: 40 }),
  octillery: E('mid', 'ranged3', { range: 112, proj: 125, anim: 'Shoot', color: '#9fd8ff', hp: 84 }),
  mantineB: E('big', 'slam', { range: 120, anim: 'Shoot', color: '#7fd0ff', blast: 50, scale: 1.4, hp: 390, fly: true, sprite: 'mantine' }),
  salamenceK: E('big', 'slam', { range: 135, anim: 'Attack', color: '#ff9a70', blast: 64, scale: 1.55, hp: 900, dmg: 24, windup: 0.65, speed: 54, k: 28, sprite: 'salamence', fly: true, pseudo: true }),
  // ----- Johto : Îles Tourbillon (mer, poisons et courants) -----
  horsea: E('mini', 'ranged', { range: 100, proj: 115, anim: 'Shoot', color: '#9fe8ff', hp: 24, speed: 46 }),
  tentacool: E('mini', 'ranged', { range: 90, proj: 95, anim: 'Shoot', color: '#c070ff', hp: 28, speed: 36 }),
  seadra: E('mid', 'ranged3', { range: 112, proj: 130, anim: 'Shoot', color: '#7fd0ff', hp: 90 }),
  tentacruel: E('mid', 'slam', { range: 110, anim: 'Shoot', color: '#c070ff', blast: 40, windup: 0.9, hp: 110, speed: 42 }),
  mantine: E('mid', 'ranged3', { range: 115, proj: 125, anim: 'Shoot', color: '#9fe8ff', fly: true, hp: 100 }),
  kingdraB: E('big', 'slam', { range: 125, anim: 'Shoot', color: '#7fd0ff', blast: 54, scale: 1.4, hp: 460, sprite: 'kingdra' }),
  garchompK: E('big', 'slam', { range: 135, anim: 'Attack', color: '#9ab0e0', blast: 66, scale: 1.55, hp: 1100, dmg: 27, windup: 0.6, speed: 60, k: 32, sprite: 'garchomp', pseudo: true }),
  // ----- Johto : Forêt d'Ilex (plantes, spores) -----
  hoppip: E('mini', 'ranged', { range: 95, proj: 100, anim: 'Shoot', color: '#ffb0d8', hp: 20, speed: 50, fly: true }),
  sunkern: E('mini', 'ranged', { range: 100, proj: 105, anim: 'Shoot', color: '#ffe84a', hp: 22, speed: 40 }),
  pineco: E('mini', 'bomb', { blast: 44, range: 18, speed: 85, windup: 0.8, anim: 'Attack', dormant: true, sight: 60, hp: 28, dmg: 13 }),
  skiploom: E('mid', 'ranged3', { range: 108, proj: 115, anim: 'Shoot', color: '#ffb0d8', fly: true, hp: 86 }),
  sunflora: E('mid', 'ranged3', { range: 112, proj: 120, anim: 'Shoot', color: '#ffe84a', hp: 95 }),
  forretress: E('mid', 'slam', { range: 100, anim: 'Attack', blast: 40, windup: 0.9, hp: 125, speed: 38 }),
  meganiumB: E('big', 'slam', { range: 125, anim: 'Shoot', color: '#9be86a', blast: 52, scale: 1.4, hp: 480, sprite: 'meganium' }),
  goodraK: E('big', 'slam', { range: 135, anim: 'Attack', color: '#d8a0ff', blast: 66, scale: 1.55, hp: 1250, dmg: 29, windup: 0.65, speed: 50, k: 36, sprite: 'goodra', pseudo: true }),
  // mini-boss optionnel (pseudo-légendaire) : une seule fois par carte, gros bloc d'acier qui martèle le sol
  metagrossK: E('big', 'slam', { range: 130, anim: 'Attack', color: '#a8c0e0', blast: 60, scale: 1.55, hp: 700, dmg: 20, windup: 0.7, speed: 44, k: 22, sprite: 'metagross', pseudo: true }),
  // Invocations de boss
  clone: { tier: 'mini', kind: 'ranged', hp: 30, dmg: 10, speed: 0, sight: 400, range: 400, windup: 0.9, anim: 'Shoot', proj: 120, color: '#c070ff', rec: 2.4, clone: true, k: 0, sprite: 'mewtwo' },
  reflet: { tier: 'mini', kind: 'ranged', hp: 34, dmg: 8, speed: 56, sight: 400, range: 220, windup: 0.8, anim: 'Shoot', proj: 120, color: '#9fe8ff', rec: 1.6, clone: true, k: 0, sprite: 'suicune' },
  reve: { tier: 'mini', kind: 'ranged', hp: 34, dmg: 8, speed: 50, sight: 400, range: 220, windup: 0.8, anim: 'Shoot', proj: 110, color: '#b8ffb0', rec: 1.6, clone: true, k: 0, sprite: 'celebi', fly: true },
  decoy: { tier: 'mini', kind: 'ranged', hp: 34, dmg: 8, speed: 50, sight: 400, range: 220, windup: 0.8, anim: 'Shoot', proj: 110, color: '#ffb0d8', rec: 1.6, clone: true, k: 0, sprite: 'mew', fly: true },
};
export const spriteOfEnemy = t => (ENEMIES[t] && ENEMIES[t].sprite) || t;

// ---------- boss ----------
// moves[phase-1] : liste [attaque, poids] ; attaques : ball, volley, nova, swing, pulse, dash, rain, beam, summon
// (repli : chaque boss a aussi des `combos` écrits, définis plus bas, qui prennent le relais dans bossChoose)
export const BOSSES = {
  articuno: { sprite: 'articuno', phases: ['Le blizzard se lève', 'Zéro absolu'], status: ['freeze', 0.25], name: 'ARTIKODIN', sub: 'L’oiseau des glaces', scale: 2.3, hp: 380, dmg: 13, r: 19, speed: 56, color: '#9fe8ff', glow: [140, 220, 255], hover: true, rainColor: '#bfeaff',
    moves: [[['ball', 3], ['volley', 2], ['rain', 2]], [['ball', 2], ['volley', 2], ['rain', 3], ['nova', 2], ['dash', 1]], [['volley', 2], ['rain', 3], ['nova', 3], ['dash', 2]]] },
  zapdos: { sprite: 'zapdos', phases: ['L’orage gronde', 'Foudre déchaînée'], status: ['para', 0.3], name: 'ÉLECTHOR', sub: 'L’oiseau de la foudre', scale: 2.3, hp: 480, dmg: 14, r: 18, speed: 62, color: '#ffe84a', glow: [255, 235, 90], hover: true, rainColor: '#fff58a',
    moves: [[['ball', 2], ['rain', 3], ['dash', 2]], [['volley', 2], ['rain', 3], ['dash', 2], ['nova', 2]], [['rain', 4], ['nova', 3], ['dash', 3], ['beam', 2]]] },
  moltres: { sprite: 'moltres', phases: ['Les braises s’embrasent', 'Renaissance ardente'], status: ['burn', 0.3], name: 'SULFURA', sub: 'L’oiseau des flammes', scale: 2.3, hp: 600, dmg: 15, r: 19, speed: 58, color: '#ff8a30', glow: [255, 140, 60], hover: true, rainColor: '#ff9a50',
    moves: [[['ball', 3], ['volley', 2], ['swing', 2]], [['pulse', 3], ['volley', 2], ['dash', 2], ['ball', 2]], [['pulse', 3], ['nova', 3], ['rain', 3], ['dash', 2]]] },
  dragonite: { sprite: 'dragonite', phases: ['Le roi s’éveille', 'Colère du dragon'], status: ['para', 0.2], name: 'DRACOLOSSE', sub: 'Roi de Kanto', scale: 2.3, hp: 760, dmg: 17, r: 19, speed: 60, color: '#ffb060', glow: [255, 180, 90], rainColor: '#ffc080',
    moves: [[['swing', 3], ['dash', 2], ['ball', 2]], [['swing', 2], ['beam', 3], ['volley', 2], ['dash', 2]], [['beam', 3], ['rain', 3], ['nova', 2], ['dash', 3], ['swing', 2]]] },
  mewtwo: { sprite: 'mewtwo', phases: ['L’esprit s’ouvre', 'Clones psychiques'], status: ['confuse', 0.25], name: 'MEWTWO', sub: 'Le Cloné', scale: 2.3, hp: 950, dmg: 18, r: 14, speed: 66, want: 54, color: '#d89aff', glow: [180, 100, 255], hover: true, rainColor: '#e0a0ff', summon: 'clone',
    // le rythme « Elden Ring » de Mewtwo (anticipations brèves, enchaînements, téléportations) passe désormais par ses combos écrits (voir plus bas) ; `moves` ne sert plus que de repli
    moves: [[['ball', 3], ['swing', 3]], [['ball', 3], ['swing', 2], ['pulse', 3]], [['ball', 3], ['swing', 2], ['pulse', 3], ['summon', 2]]] },
  mew: { sprite: 'mew', phases: ['Le mythe s’éveille', 'Tous les possibles'], status: ['confuse', 0.25], name: 'MEW', sub: 'Le Mythe', scale: 1.15, hp: 1000, dmg: 18, r: 8, speed: 66, color: '#ffb0e8', glow: [255, 150, 220], hover: true, rainColor: '#ffc0f0', summon: 'decoy', blink: true,
    moves: [[['volley', 3], ['ball', 2], ['rain', 2]], [['volley', 2], ['nova', 3], ['rain', 3], ['summon', 2]], [['volley', 2], ['nova', 3], ['rain', 3], ['pulse', 2], ['summon', 2]]] },
  // ----- Johto -----
  entei: { sprite: 'entei', phases: ['Le volcan se réveille', 'Colère de la cendre'], status: ['burn', 0.3], name: 'ENTEI', sub: 'Le Volcan', scale: 2.3, hp: 560, dmg: 14, r: 18, speed: 60, color: '#e8602a', glow: [255, 120, 50], rainColor: '#ff9a50',
    moves: [[['dash', 3], ['swing', 2], ['ball', 2]], [['dash', 2], ['swing', 2], ['pulse', 3], ['volley', 2]], [['dash', 3], ['pulse', 3], ['nova', 3], ['rain', 3], ['beam', 2]]] },
  suicune: { sprite: 'suicune', phases: ['L’eau s’éveille', 'Le reflet se brise'], status: ['freeze', 0.2], name: 'SUICUNE', sub: 'Le Miroir', scale: 2.3, hp: 700, dmg: 15, r: 18, speed: 72, color: '#5ac8f0', glow: [110, 210, 255], rainColor: '#bfeaff', summon: 'reflet',
    moves: [[['geyser', 3], ['mirror', 3], ['dash', 2]], [['geyser', 3], ['mirror', 3], ['dash', 1], ['summon', 2]], [['geyser', 3], ['mirror', 3], ['nova', 2], ['beam', 2], ['summon', 2]]] },
  lugia: { sprite: 'lugia', phases: ['La tempête gronde', 'Le souffle des abysses'], status: ['confuse', 0.25], name: 'LUGIA', sub: 'Gardien des mers', scale: 2.07, hp: 900, dmg: 17, r: 19, speed: 58, color: '#cfe2ff', glow: [190, 215, 255], hover: true, rainColor: '#dcecff',
    moves: [[['whirl', 3], ['wall', 3], ['ball', 2]], [['wall', 3], ['whirl', 3], ['beam', 2], ['rain', 2]], [['wall', 3], ['whirl', 3], ['nova', 2], ['beam', 3], ['pulse', 2]]] },
  celebi: { sprite: 'celebi', phases: ['Le temps vacille', 'Tous les printemps'], status: ['confuse', 0.25], name: 'CELEBI', sub: 'Le Voyageur du temps', scale: 1.15, hp: 960, dmg: 17, r: 8, speed: 64, color: '#8ae88a', glow: [140, 255, 150], hover: true, rainColor: '#c8ffb0', summon: 'reve', blink: true,
    moves: [[['volley', 3], ['ball', 2], ['rain', 2]], [['volley', 2], ['nova', 3], ['rain', 3], ['summon', 2]], [['volley', 2], ['nova', 3], ['rain', 3], ['pulse', 2], ['summon', 2]]] },
  raikou: { sprite: 'raikou', phases: ['Le tonnerre approche', 'Foudre de bronze'], status: ['para', 0.3], name: 'RAIKOU', sub: 'Le Tonnerre', scale: 2.3, hp: 420, dmg: 13, r: 18, speed: 68, color: '#f2c84a', glow: [255, 205, 80], rainColor: '#fff0a0',
    moves: [[['dash', 3], ['ball', 2], ['rain', 2]], [['dash', 2], ['volley', 2], ['rain', 3], ['nova', 2]], [['dash', 3], ['rain', 3], ['nova', 3], ['beam', 2]]] },
};

// ---------- combos écrits (style souls-like) ----------
// Chaque boss a un style (Duelliste, Poursuivant, Maître du terrain, Illusionniste, Colosse, Seigneur du ciel, Transformé) et, par phase, une liste de combos nommés et appris par cœur.
// cb(nom, bande, poids, étapes, ouverture, every)
//   bande : 'near' | 'mid' | 'far' (ou plusieurs séparées par une espace, ou 'any'). Seuil en px de monde : `bands` du boss (défaut [64, 150], 1 LC = 24 px).
//   étape : [attaque, préparation (s), pause avant l'étape suivante (s), retard du coup (s)]. Attaques : ball volley nova swing pulse dash rain beam summon wall whirl geyser mirror,
//           plus `tp` (téléportation dans le dos : image rémanente pendant la préparation, puis coup) et `feint` (même signal, aucun coup).
//   ouverture : secondes sans menace après le dernier coup du combo (le joueur la mérite en esquivant tout le combo).
//   every : N = combo « temps fort » de la phase, lancé une fois sur N dans un ordre fixe, quelle que soit la distance.
// Règles : jamais le même combo deux fois de suite ; un retard (+0,3 s environ) n'est jamais sans signal (pose tenue + lueur fixe) ; une parade brise le combo.
const cb = (name, band, w, steps, open, every) => ({ name, band, w, steps, open, every });
const STYLES = {
  articuno: { style: 'Seigneur du ciel', want: 96, bands: [72, 170], combos: [
    [cb('Battement', 'near', 3, [['swing', .55, .5], ['swing', .55]], 1.6),
     cb('Plongeon givrant', 'mid far', 3, [['dash', .95]], 2.0),
     cb('Rafale', 'mid far', 3, [['volley', .7, .4], ['volley', .7]], 1.6)],
    [cb('Battement', 'near', 2, [['swing', .5, .4], ['swing', .5, .4], ['swing', .5, 0, .3]], 1.5),
     cb('Plongeon double', 'mid far', 3, [['dash', .9, .4], ['dash', .75]], 2.0),
     cb('Rafale', 'mid', 2, [['volley', .7, .4], ['volley', .7, .4], ['volley', .7, 0, .3]], 1.7),
     cb('Grêle', 'far', 2, [['rain', .75, .45], ['rain', .7]], 1.8)],
    [cb('Battement', 'near', 2, [['swing', .5, .35], ['swing', .5, .35], ['swing', .5, 0, .3]], 1.5),
     cb('Plongeon double', 'mid', 2, [['dash', .85, .35], ['dash', .7]], 1.9),
     cb('Rafale', 'far', 2, [['volley', .65, .35], ['volley', .65, .35], ['volley', .65, 0, .3]], 1.6),
     cb('Blizzard', 'any', 1, [['nova', .8, .3], ['rain', .7, .25], ['rain', .7, .25], ['nova', .8, 0, .3]], 2.5, 3)]] },
  zapdos: { style: 'Poursuivant', want: 80, bands: [64, 150], combos: [
    [cb('Patte', 'near', 3, [['swing', .5, .4], ['swing', .5]], 1.5),
     cb('Course-éclair', 'mid far', 3, [['dash', .85, .35], ['swing', .5]], 1.6),
     cb('Étincelles', 'far', 2, [['ball', .6, .4], ['ball', .6]], 1.5)],
    [cb('Patte', 'near', 2, [['swing', .5, .4], ['swing', .5, .35], ['swing', .5, 0, .3]], 1.5),
     cb('Course-éclair', 'mid', 3, [['dash', .8, .3], ['swing', .45, .3], ['swing', .45, 0, .3]], 1.5),
     cb('Double charge', 'far', 2, [['dash', .85, .45], ['dash', .75]], 1.8),
     cb('Foudroiement', 'mid far', 2, [['rain', .7, .4], ['volley', .7]], 1.6)],
    [cb('Patte', 'near', 2, [['swing', .5, .3], ['swing', .5, .3], ['swing', .5, 0, .3]], 1.4),
     cb('Course-éclair', 'mid', 2, [['dash', .8, .25], ['swing', .45, .25], ['swing', .45, 0, .3]], 1.4),
     cb('Double charge', 'far', 2, [['dash', .8, .35], ['dash', .7]], 1.7),
     cb('Orage', 'any', 1, [['rain', .7, .25], ['dash', .8, .25], ['rain', .7, .2], ['nova', .8, 0, .3]], 2.5, 3)]] },
  moltres: { style: 'Transformé', want: 90, bands: [70, 160], combos: [
    [cb('Serres', 'near', 3, [['swing', .55, .45], ['swing', .55]], 1.5),
     cb('Rase-mottes', 'mid far', 3, [['dash', .95]], 2.0),
     cb('Trois boules', 'mid far', 3, [['ball', .65, .4], ['ball', .65, .4], ['ball', .65]], 1.6)],
    [cb('Onde ardente', 'near', 2, [['swing', .5, .35], ['pulse', .8, 0, .25]], 1.5),
     cb('Rase-mottes', 'mid', 3, [['dash', .9, .35], ['dash', .8]], 1.9),
     cb('Trois boules', 'far', 2, [['ball', .65, .4], ['ball', .65, .4], ['ball', .65, 0, .3]], 1.6),
     cb('Éruption', 'mid far', 2, [['pulse', .9, 0, .3]], 1.8)],
    // phase 3 « Renaissance » : le phénix devient un Poursuivant (charges enchaînées, peu de pauses) mais ses ouvertures restent de 2 s
    [cb('Serres', 'near', 2, [['swing', .5, .3], ['swing', .5, .3], ['pulse', .75, 0, .3]], 1.8),
     cb('Course ardente', 'mid far', 3, [['dash', .8, .3], ['dash', .75, .3], ['swing', .45, .25], ['pulse', .7, 0, .3]], 2.0),
     cb('Trois boules', 'mid far', 2, [['ball', .6, .3], ['ball', .6, .3], ['ball', .6, 0, .3]], 1.8),
     cb('Renaissance', 'any', 1, [['nova', .85, .35], ['dash', .8, .25], ['dash', .75, .25], ['pulse', .7, 0, .3]], 2.5, 3)]] },
  dragonite: { style: 'Colosse', want: 60, bands: [60, 130], combos: [
    [cb('Coup de queue', 'near', 3, [['swing', .8, .6], ['swing', .8]], 2.5),
     cb('Charge du roi', 'mid far', 3, [['dash', 1.0]], 2.5),
     cb('Souffle draconique', 'far', 2, [['ball', .9, .6], ['ball', .9]], 2.0)],
    [cb('Coup de queue', 'near', 3, [['swing', .75, .5], ['swing', .75, 0, .3]], 2.5),
     cb('Charge du roi', 'mid', 3, [['dash', .95]], 2.5),
     cb('Rayon', 'mid far', 2, [['beam', 1.1]], 2.2)],
    [cb('Piétinement', 'near', 3, [['swing', .7, .5], ['pulse', .9, 0, .2]], 2.5),
     cb('Charge du roi', 'mid', 2, [['dash', .9, .4], ['dash', .85]], 2.3),
     cb('Rayon', 'far', 2, [['beam', 1.1, .5], ['ball', .8]], 2.2),
     cb('Colère du dragon', 'any', 1, [['beam', 1.1, .4], ['dash', .9, .4], ['pulse', .9, 0, .3]], 2.8, 3)]] },
  mewtwo: { style: 'Duelliste', want: 54, bands: [64, 150], combos: [
    [cb('Lame psy', 'near', 3, [['swing', .5, .4], ['swing', .5, .4], ['swing', .5, .5], ['pulse', .7, 0, .3]], 1.5),
     cb('Pulse psy', 'near', 2, [['swing', .5, .35], ['pulse', .7, 0, .3]], 1.4),
     cb('Éclat double', 'mid', 3, [['ball', .7, .4], ['ball', .7, .3], ['tp', .4]], 1.4),
     cb('Boule psy', 'mid far', 2, [['ball', .7, .5], ['ball', .7]], 1.3),
     cb('Téléfrappe', 'far', 3, [['tp', .4]], 1.5)],
    // phase 2 : le combo s'allonge et se pare de feintes
    [cb('Lame psy', 'near', 3, [['swing', .5, .4], ['swing', .5, .4], ['feint', .6, .25], ['swing', .5, .5], ['pulse', .7, 0, .3]], 1.4),
     cb('Pulse psy', 'near', 2, [['swing', .5, .3], ['feint', .55, .25], ['pulse', .7, 0, .35]], 1.4),
     cb('Éclat double', 'mid', 3, [['ball', .65, .3], ['ball', .65, .3], ['tp', .4, .3], ['swing', .45]], 1.3),
     cb('Boule psy', 'mid far', 2, [['ball', .65, .4], ['ball', .65, .3], ['ball', .65]], 1.3),
     cb('Téléfrappe', 'far', 3, [['tp', .4, .3], ['swing', .45]], 1.4)],
    // phase 3 : la grande danse psychique (≈ 3,5 s) n'offre qu'une seule vraie ouverture, à la fin
    [cb('Lame psy', 'near', 2, [['swing', .45, .35], ['swing', .45, .35], ['feint', .55, .2], ['swing', .45, .4], ['pulse', .65, 0, .3]], 1.3),
     cb('Éclat double', 'mid', 2, [['ball', .6, .25], ['ball', .6, .25], ['tp', .4, .25], ['swing', .45]], 1.3),
     cb('Téléfrappe', 'far', 2, [['tp', .4, .25], ['swing', .45]], 1.3),
     cb('Grande danse psychique', 'any', 1, [['tp', .4, .2], ['swing', .45, .2], ['pulse', .6, .15], ['tp', .4, .15], ['pulse', .7, 0, .3]], 2.5, 3)]] },
  mew: { style: 'Illusionniste', want: 60, bands: [56, 130], combos: [   // version nerveuse : leurres vifs, ouvertures courtes
    [cb('Éclats', 'near', 3, [['swing', .45, .3], ['swing', .45]], 1.2),
     cb('Pirouette', 'mid far', 3, [['ball', .55, .25], ['ball', .55, .25], ['tp', .4]], 1.3),
     cb('Éventail', 'far', 2, [['volley', .6, .3], ['volley', .6, 0, .3]], 1.3)],
    [cb('Éclats', 'near', 2, [['swing', .45, .3], ['swing', .45, .3], ['feint', .5, .2], ['swing', .45]], 1.2),
     cb('Pirouette', 'mid', 3, [['ball', .55, .25], ['tp', .4, .25], ['swing', .45]], 1.3),
     cb('Tour de passe-passe', 'far', 3, [['summon', .8, .3], ['volley', .6, .3], ['tp', .4]], 1.3)],
    [cb('Éclats', 'near', 2, [['swing', .45, .25], ['swing', .45, .25], ['pulse', .65, 0, .3]], 1.2),
     cb('Pirouette', 'mid', 2, [['ball', .5, .2], ['ball', .5, .2], ['tp', .4, .2], ['swing', .4]], 1.2),
     cb('Tour de passe-passe', 'far', 2, [['summon', .8, .3], ['volley', .55, .25], ['tp', .4]], 1.2),
     cb('Tous les possibles', 'any', 1, [['summon', .8, .3], ['tp', .4, .2], ['volley', .6, .2], ['tp', .4, .15], ['pulse', .7, 0, .3]], 1.4, 3)]] },
  celebi: { style: 'Illusionniste', want: 60, bands: [56, 130], combos: [   // Illusionniste + Duelliste : l'« écho du temps » rejoue une attaque avec un long retard
    [cb('Fleurs', 'near', 3, [['swing', .45, .3], ['pulse', .7, 0, .3]], 1.2),
     cb('Pas dérobé', 'mid far', 3, [['tp', .4, .3], ['swing', .45, .3], ['swing', .45]], 1.3),
     cb('Écho du temps', 'far', 2, [['ball', .6, .5], ['ball', .6, 0, .5]], 1.3)],
    [cb('Fleurs', 'near', 2, [['swing', .45, .3], ['feint', .5, .2], ['swing', .45, 0, .3]], 1.2),
     cb('Pas dérobé', 'mid', 3, [['tp', .4, .3], ['swing', .45, .3], ['feint', .5, .2], ['swing', .45, 0, .3]], 1.2),
     cb('Écho du temps', 'far', 2, [['ball', .6, .4], ['ball', .6, .25, .45], ['ball', .6]], 1.3),
     cb('Rêve', 'mid far', 2, [['summon', .8, .3], ['volley', .6]], 1.3)],
    [cb('Fleurs', 'near', 2, [['swing', .45, .25], ['pulse', .65, 0, .3]], 1.2),
     cb('Pas dérobé', 'mid', 2, [['tp', .4, .25], ['swing', .45, .25], ['swing', .45, 0, .3]], 1.2),
     cb('Écho du temps', 'far', 2, [['ball', .55, .3], ['ball', .55, .2, .45], ['ball', .55]], 1.2),
     cb('Tous les printemps', 'any', 1, [['summon', .8, .25], ['ball', .55, .25], ['ball', .55, .15, .4], ['tp', .4, .15], ['swing', .45, 0, .3]], 1.4, 3)]] },
  raikou: { style: 'Poursuivant', want: 80, bands: [64, 150], combos: [   // les pylônes de terrain restent gérés par extras.js
    [cb('Patte', 'near', 3, [['swing', .5, .4], ['swing', .5]], 1.6),
     cb('Ruée-foudre', 'mid far', 3, [['dash', .85, .35], ['swing', .5]], 1.7),
     cb('Éclair', 'far', 2, [['ball', .6, .4], ['ball', .6]], 1.5)],
    [cb('Patte', 'near', 2, [['swing', .5, .4], ['swing', .5, .35], ['swing', .5, 0, .3]], 1.6),
     cb('Ruée-foudre', 'mid', 3, [['dash', .85, .3], ['swing', .5, .3], ['pulse', .8, 0, .3]], 1.6),
     cb('Quatre éclairs', 'mid far', 3, [['rain', .7, .4], ['rain', .7, .4], ['volley', .7, 0, .3]], 1.7)],
    [cb('Patte', 'near', 2, [['swing', .5, .3], ['swing', .5, .3], ['swing', .5, 0, .3]], 1.5),
     cb('Ruée-foudre', 'mid', 2, [['dash', .8, .25], ['swing', .45, .25], ['pulse', .75, 0, .3]], 1.5),
     cb('Quatre éclairs', 'far', 2, [['rain', .7, .3], ['rain', .7, .3], ['volley', .7, 0, .3]], 1.6),
     cb('Foudre de bronze', 'any', 1, [['dash', .8, .25], ['rain', .7, .2], ['dash', .75, .2], ['nova', .8, 0, .3]], 2.5, 3)]] },
  entei: { style: 'Maître du terrain', want: 84, bands: [64, 150], combos: [   // braises et brasiers : extras.js ; rythme lourd, préparations lisibles
    [cb('Griffe', 'near', 3, [['swing', .6, .45], ['swing', .6]], 1.8),
     cb('Ruée de braise', 'mid far', 3, [['dash', .9, .35], ['swing', .5]], 1.8),
     cb('Boule de feu', 'far', 2, [['ball', .7, .5], ['ball', .7]], 1.6)],
    [cb('Griffe', 'near', 2, [['swing', .6, .4], ['swing', .6, .35], ['pulse', 1.0, 0, .3]], 1.7),
     cb('Ruée de braise', 'mid', 3, [['dash', .9, .3], ['swing', .6, .35], ['pulse', 1.0, 0, .3]], 1.7),
     cb('Volée ardente', 'mid far', 3, [['volley', .8, .4], ['volley', .8, .4], ['volley', .8, 0, .3]], 1.6)],
    [cb('Griffe', 'near', 2, [['swing', .6, .3], ['swing', .6, .3], ['pulse', .95, 0, .3]], 1.6),
     cb('Ruée de braise', 'mid', 2, [['dash', .85, .25], ['swing', .55, .3], ['pulse', .95, 0, .3]], 1.6),
     cb('Pluie de cendres', 'far', 2, [['rain', 1.0, .5], ['rain', 1.0]], 1.8),
     cb('Colère de la cendre', 'any', 1, [['dash', .9, .3], ['swing', .6, .3], ['volley', .8, .4, .4], ['nova', 1.4]], 2.5, 3)]] },
  suicune: { style: 'Illusionniste', want: 80, bands: [64, 150], combos: [   // version « lecture lente » : l'épreuve est de reconnaître le vrai, pas de survivre à la cadence
    [cb('Coup de mer', 'near', 2, [['swing', .55, .4], ['swing', .55]], 1.5),
     cb('Marée montante', 'mid far', 3, [['geyser', .8, .5], ['geyser', .8]], 1.8),
     cb('Reflet', 'mid far', 3, [['mirror', .75, .5], ['dash', .85]], 1.8)],
    [cb('Coup de mer', 'near', 2, [['swing', .55, .35], ['swing', .55, 0, .3]], 1.5),
     cb('Marée montante', 'mid', 2, [['geyser', .8, .4], ['geyser', .8]], 1.7),
     cb('Danse des reflets', 'mid far', 3, [['summon', .8, .35], ['mirror', .75, .4], ['geyser', .8, 0, .3]], 1.8)],
    [cb('Coup de mer', 'near', 2, [['swing', .5, .3], ['swing', .5, 0, .3]], 1.4),
     cb('Marée montante', 'mid', 2, [['geyser', .75, .3], ['geyser', .75]], 1.6),
     cb('Danse des reflets', 'far', 2, [['summon', .8, .3], ['mirror', .7, .3], ['geyser', .75]], 1.7),
     cb('Aurore', 'any', 1, [['mirror', .7, .3], ['geyser', .8, .25], ['mirror', .7, .25], ['beam', 1.1, 0, .3]], 2.5, 3)]] },
  lugia: { style: 'Seigneur du ciel', want: 96, bands: [72, 170], combos: [   // phase 3 « ciel dégagé » : le combat change de nature
    [cb('Battement', 'near', 2, [['swing', .6, .5], ['swing', .6]], 1.8),
     cb('Aéropique', 'mid far', 3, [['wall', 1.0, .5], ['wall', 1.0]], 2.0),
     cb('Tourbillon', 'mid far', 3, [['whirl', .9]], 2.0)],
    [cb('Battement', 'near', 2, [['swing', .55, .4], ['swing', .55, 0, .3]], 1.7),
     cb('Aéropique', 'mid', 3, [['wall', 1.0, .4], ['whirl', .9, .4], ['wall', 1.0, 0, .3]], 2.0),
     cb('Tourbillon', 'far', 2, [['whirl', .9, .5], ['ball', .7]], 1.9),
     cb('Rayon des abysses', 'mid far', 2, [['beam', 1.1, .5], ['ball', .7]], 1.9)],
    [cb('Battement', 'near', 2, [['swing', .5, .3], ['swing', .5, 0, .3]], 1.6),
     cb('Aéropique', 'mid', 2, [['wall', .95, .3], ['whirl', .85, .3], ['wall', .95, 0, .3]], 1.9),
     cb('Rayon des abysses', 'far', 2, [['beam', 1.0, .4], ['ball', .65]], 1.8),
     cb('Grand Aéropique', 'any', 1, [['wall', .9, .25], ['whirl', .85, .2], ['beam', 1.0, .2], ['nova', .8, 0, .3]], 2.5, 3)]] },
};
for (const k in STYLES) Object.assign(BOSSES[k], STYLES[k]);
export const BOSS_STYLES = STYLES;

export const BOSS_THRESHOLDS = [0.6, 0.25];
export const BOSS_HP_MULT = 1.15;   // léger surplus de PV : parades, liens et combos abattaient les boss trop vite
// Les dégâts du joueur montent de 6 % par niveau (et ×1,7 au stade final) alors que les PV d'un boss étaient fixes : Mewtwo tombait en moins d'une minute en phase 1 à 36.
// Au-delà du niveau 22 (Suicune), les PV des boss suivent donc le niveau de leur carte : +6 % par niveau (Mewtwo ×1,96, Lugia ×1,84, Mew ×2,4). Avant : inchangé.
export const BOSS_HP_FROM = 22, BOSS_HP_PER_LV = 0.06;
export const bossHpLv = lv => 1 + BOSS_HP_PER_LV * Math.max(0, lv - BOSS_HP_FROM);
