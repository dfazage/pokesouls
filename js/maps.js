// Les cinq cartes du Chapitre Génération 1 (quatre cartes + une carte secrète) : définition, génération des salles, collisions et rendu du décor.
// Toutes les cartes : zones libres générées avec une graine fixe (voir generateFree).
// Dans toutes les cartes, l'arène du boss est au nord de la dernière salle : on y entre par le sud, le boss attend en face (arrivée frontale).
import { pickProp, drawProp, FLOOR } from './props.js';
import { zoneStyle, zoneDecor } from './zones.js';
// PADY : rangées ajoutées en haut de la carte pour que l'arène du boss (rayon ×1,5) s'étende vers le nord sans toucher au reste : son bord sud, l'antichambre et l'entrée de face restent où ils étaient
export const TS = 24, MW = 124, MH = 73, PADY = 9, ARENA_R = 12.15, FACE = 10;
export const T = { VOID: 0, FLOOR: 1, DOOR: 2, FOG: 3, SOLID: 4 };

const rgb = a => `rgb(${a[0]},${a[1]},${a[2]})`;
export const THEMES = {
  lab: { floor: [34, 40, 62], floorLab: [28, 40, 58], arena: [38, 30, 62], wallA: '#2c3452', wallB: '#2a3150', face: '#1c2038', faceTop: '#3a4468', accent: [80, 220, 200], accent2: [200, 140, 255], fx: 'circuit', amb: [150, 158, 200], ambArena: [115, 100, 160], decor: ['pillar', 'tank', 'console'] },
  ice: { floor: [64, 92, 130], arena: [70, 96, 150], wallA: '#5b7fa8', wallB: '#56799f', face: '#33507a', faceTop: '#9fc4e8', accent: [190, 240, 255], accent2: [140, 200, 255], fx: 'ice', amb: [170, 190, 235], ambArena: [140, 165, 235], decor: ['crystal', 'rock', 'pillar'] },
  plant: { floor: [58, 58, 70], arena: [66, 60, 56], wallA: '#444458', wallB: '#40405a', face: '#27273a', faceTop: '#62627c', accent: [255, 232, 80], accent2: [120, 230, 255], fx: 'circuit', amb: [160, 160, 180], ambArena: [150, 140, 150], decor: ['generator', 'pillar', 'console'] },
  lava: { floor: [66, 40, 38], arena: [78, 42, 34], wallA: '#5a3430', wallB: '#56302c', face: '#321a18', faceTop: '#8a5040', accent: [255, 130, 50], accent2: [255, 200, 90], fx: 'lava', amb: [200, 150, 130], ambArena: [210, 130, 100], decor: ['brazier', 'rock', 'crystal'] },
  rock: { floor: [72, 64, 58], arena: [86, 72, 52], wallA: '#5e5248', wallB: '#5a4e44', face: '#38302a', faceTop: '#8a7a68', accent: [255, 200, 110], accent2: [200, 170, 120], fx: 'stone', amb: [175, 165, 155], ambArena: [185, 160, 120], decor: ['rock', 'pillar', 'brazier'] },
  // Johto : Japon d'Edo (bois sombre, papier, laque, lanternes). Tour Carillon : jardins et cours d'un temple en plein air, sous l'orage
  bell: { floor: [112, 104, 92], arena: [138, 128, 110], wallA: '#6e675c', wallB: '#675f55', face: '#3a342e', faceTop: '#9a9080', accent: [255, 206, 96], accent2: [130, 200, 255], fx: 'garden', open: true, amb: [150, 140, 142], ambArena: [180, 158, 134], decor: ['lantern', 'tree', 'bell', 'torii', 'tree'] },
  // Tour Brûlée : pagode d'Écorcia calcinée, automne et cendres au couchant
  ember: { floor: [96, 88, 82], arena: [118, 96, 82], wallA: '#4a3a34', wallB: '#46362f', face: '#251a16', faceTop: '#7a5a48', accent: [255, 140, 60], accent2: [255, 205, 110], fx: 'garden', open: true, bridgeCol: [136, 96, 60], scorch: true, edge: 'ruin', leaf: ['#4a1a14', '#7a2a1a', '#b04a1e', '#34140f'],
    edo: [[104, 96, 90], [118, 78, 62], [88, 66, 50]], amb: [190, 150, 128], ambArena: [214, 128, 96], decor: ['lantern', 'tree', 'bell', 'torii', 'brazier'] },
  // Lac du Miroir : temple sur l'eau à l'aube de printemps ; le vide est de l'eau, les passages sont des ponts
  mirror: { glowy: true, floor: [140, 158, 166], arena: [104, 138, 158], wallA: '#9fb4bc', wallB: '#98aeb6', face: '#6a8088', faceTop: '#d8e6ea', accent: [150, 225, 255], accent2: [255, 190, 210], fx: 'garden', open: true, water: true, edge: 'water', bridgeCol: [176, 142, 100], leaf: ['#e8a0b8', '#f4c0d0', '#fbd8e2', '#c97a96'],
    edo: [[138, 156, 164], [120, 142, 152], [176, 142, 100]], amb: [150, 180, 206], ambArena: [140, 178, 206], decor: ['lantern', 'tree', 'torii', 'rock', 'lantern'] },
  // Îles Tourbillon : archipel battu par la tempête, courants et tourbillons
  storm: { abyss: true, propSet: 'ice', floor: [52, 74, 88], arena: [66, 92, 108], wallA: '#3c5868', wallB: '#385464', face: '#1a2c38', faceTop: '#5e8a9c', accent: [110, 220, 245], accent2: [80, 170, 230], fx: 'garden', open: true, water: true, edge: 'water', bridgeCol: [110, 90, 68], leaf: ['#5a7a6a', '#6a8a7a', '#7a9a8a', '#4a6a5a'],
    edo: [[52, 74, 88], [60, 82, 92], [84, 76, 64]], amb: [120, 160, 196], ambArena: [150, 190, 225], decor: ['crystal', 'rock', 'pillar', 'rock', 'statue'] },
  // Forêt d'Ilex (secrète) : sanctuaire hors du temps, clairières et sous-bois dorés
  ilex: { floor: [96, 110, 86], arena: [128, 138, 108], wallA: '#27494a', wallB: '#244446', face: '#142a2c', faceTop: '#3e7a76', accent: [255, 225, 130], accent2: [160, 255, 200], fx: 'garden', open: true, meadow: true, edge: 'forest', leaf: ['#2e7a5e', '#3a9a72', '#4ab08a', '#2a6a52'],
    edo: [[96, 110, 88], [74, 112, 62], [112, 92, 62]], amb: [180, 200, 170], ambArena: [210, 215, 160], decor: ['tree', 'statue', 'lantern', 'tree', 'torii'] },
  mystic: { floor: [36, 68, 62], arena: [52, 50, 86], wallA: '#27494a', wallB: '#244446', face: '#142a2c', faceTop: '#3e7a76', accent: [255, 170, 230], accent2: [160, 255, 220], fx: 'moss', amb: [150, 180, 175], ambArena: [150, 130, 200], decor: ['tree', 'crystal', 'statue'] },
};

// ---------- définitions des cartes ----------
// forme d'une zone libre : [décalage x, décalage y, rayon x, rayon y] par zone ; sert à sortir du quadrillage des cellules
const shape = a => (z, i) => ({ ...z, ox: a[i][0], oy: a[i][1], rx: a[i][2], ry: a[i][3] });
const KANTO = [
  { id: 'm1', name: 'Îles Écume', sub: 'Grottes gelées', theme: 'ice', mus: 1, lv: 8, seed: 11, boss: 'articuno',
    // zones libres : le rivage (0) s'ouvre vers les phoques (1) et la crevasse (7) ; deux routes mènent au lac (5) ; la porte relie la grotte des phoques à l'antichambre (6)
    free: {
      zones: [
        { cell: [0, 2], name: 'Rivage gelé' }, { cell: [1, 2], name: 'Grotte des phoques' }, { cell: [2, 2], name: 'Bassin glacé' },
        { cell: [3, 2], name: 'Galerie de givre' }, { cell: [3, 1], name: 'Caverne de cristal' }, { cell: [2, 1], name: 'Lac souterrain' },
        { cell: [1, 1], name: 'Antichambre du blizzard' }, { cell: [0, 1], name: 'Crevasse bleue' }, { cell: [0, 0], name: 'Grotte du givre caché' }, { cell: [2, 0], name: 'Pic de cristal' },
      ].map((z, i) => i < 2 ? { ...z, zone: 'Lisière' } : i === 6 ? { ...z, zone: 'Approche' } : i > 6 ? { ...z, zone: 'Cœur' } : z)
        .map(shape([[3, -2, 13, 7], [-2, 3, 11, 8], [4, -1, 13, 9], [-4, 3, 10, 7], [-3, -2, 9, 9], [-3, 2, 13, 9], [2, 0, 10, 6], [2, -1, 10, 8], [3, 2, 9, 6], [3, 2, 9, 6]])),
      pow: 2.1, noise: 1.0,
      links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [2, 5], [0, 7], [7, 8], [5, 9]], thin: 0.9,
      canyons: [{ z: 3, ax: 'h', off: 1 }, { z: 4, off: -2 }],
      door: [1, 6], arena: { cell: [1, 0], from: 6 }, bonfires: [0, 5, 6], big: 4, chests: [1, 2, 3, 7, 8, 9, 4],
    },
    areas: ['Rivage gelé', 'Grotte des phoques', 'Bassin glacé', 'Galerie de givre', 'Caverne de cristal', 'Lac souterrain', 'Antichambre du blizzard'], sanctuary: "Nid d'Artikodin",
    mobs: { mini: ['seel', 'shellder', 'krabby'], mid: ['dewgong', 'starmie', 'cloyster'], big: 'lapras' },
    loot: ['candy', 'hpup', 'ct_swift', 'protein', 'ct_aquaring'], reward: ['ct_icebeam', 'candy', 'mystic'] },
  { id: 'm2', name: 'Centrale abandonnée', sub: 'Sous haute tension', theme: 'plant', mus: 2, lv: 15, seed: 23, boss: 'zapdos',
    // zones libres : le hall (0) donne sur les câbles (1) et la sous-station (7) ; deux routes mènent au poste de commande (5) ; la porte relie les câbles à l'antichambre (6)
    free: {
      zones: [
        { cell: [3, 2], name: 'Hall des turbines' }, { cell: [2, 2], name: 'Salle des câbles' }, { cell: [1, 2], name: 'Atelier rouillé' },
        { cell: [0, 2], name: 'Salle des générateurs' }, { cell: [0, 1], name: 'Couloir des relais' }, { cell: [1, 1], name: 'Poste de commande' },
        { cell: [2, 1], name: 'Antichambre du transformateur' }, { cell: [3, 1], name: 'Sous-station' }, { cell: [0, 0], name: 'Salle des cuves' }, { cell: [1, 0], name: 'Passerelle haute' },
      ].map((z, i) => i < 2 ? { ...z, zone: 'Lisière' } : i === 6 ? { ...z, zone: 'Approche' } : i > 6 ? { ...z, zone: 'Cœur' } : z)
        .map(shape([[-3, -2, 12, 7], [3, 3, 11, 8], [-3, -1, 12, 8], [3, 2, 10, 8], [3, -2, 9, 9], [-3, 3, 13, 8], [2, 0, 10, 6], [-1, 3, 9, 7], [3, 2, 9, 6], [-2, 3, 11, 6]])),
      pow: 2.3, noise: 0.8,
      links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [2, 5], [0, 7], [4, 8], [5, 9]], thin: 0.9,
      canyons: [{ z: 2, ax: 'h', off: -1 }, { z: 5, off: 3 }],
      door: [1, 6], arena: { cell: [2, 0], from: 6 }, bonfires: [0, 3, 6], big: 4, chests: [2, 3, 7, 8, 9, 5, 4, 1],
    },
    areas: ['Hall des turbines', 'Salle des câbles', 'Atelier rouillé', 'Salle des générateurs', 'Couloir des relais', 'Poste de commande', 'Antichambre du transformateur'], sanctuary: "Cœur de la Centrale",
    mobs: { mini: ['magnemite', 'voltorb', 'pikachu'], mid: ['magneton', 'electrode', 'raichu'], big: 'electabuzz' },
    loot: ['candy', 'iron', 'ct_bodyslam', 'calcium', 'maxberry', 'ct_synthesis'], reward: ['ct_thunder', 'candy', 'band'], fala: { modules: { aqua: 1, pyro: 3, cryo: 5, choc: 6 }, hub: [1, 0, 2] } },
  { id: 'm3', name: 'Mont Braise', sub: 'Le volcan vivant', theme: 'lava', mus: 3, lv: 22, seed: 37, boss: 'moltres',
    // zones libres : le flanc (0) descend vers le tunnel (1) ; trois routes se croisent au carrefour (2) ; la porte relie la caverne (2) au pont de basalte (5)
    free: {
      zones: [
        { cell: [0, 0], name: 'Flanc du volcan' }, { cell: [0, 1], name: 'Tunnel de lave' }, { cell: [1, 1], name: 'Caverne de braise' },
        { cell: [1, 2], name: 'Pont de basalte' }, { cell: [2, 2], name: 'Forge abandonnée' }, { cell: [2, 1], name: 'Grotte des cendres' },
        { cell: [3, 1], name: 'Antichambre du magma' }, { cell: [1, 0], name: 'Fumerolles' }, { cell: [0, 2], name: 'Galerie des scories' }, { cell: [3, 2], name: 'Coulée figée' },
      ].map((z, i) => i < 2 ? { ...z, zone: 'Lisière' } : i === 6 ? { ...z, zone: 'Approche' } : i > 6 ? { ...z, zone: 'Cœur' } : z)
        .map(shape([[3, 3, 12, 7], [-2, -2, 10, 9], [-3, -3, 13, 8], [4, 2, 12, 8], [-3, 3, 12, 8], [3, -2, 10, 9], [0, 0, 10, 6], [3, 3, 10, 6], [3, 0, 9, 7], [-1, 3, 9, 6]])),
      pow: 2.0, noise: 1.1,
      links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [2, 7], [3, 8], [4, 9], [0, 7]], thin: 0.9,
      canyons: [{ z: 3, off: 1 }, { z: 1, ax: 'h', off: 2 }, { z: 4, off: -2 }],
      door: [2, 5], arena: { cell: [3, 0], from: 6 }, bonfires: [0, 3, 6], big: 4, chests: [1, 2, 3, 7, 8, 9, 4, 5],
    },
    areas: ['Flanc du volcan', 'Tunnel de lave', 'Caverne de braise', 'Pont de basalte', 'Forge abandonnée', 'Grotte des cendres', 'Antichambre du magma'], sanctuary: "Cratère de Sulfura",
    mobs: { mini: ['vulpix', 'growlithe', 'ponyta'], mid: ['ninetales', 'rapidash', 'arcanine'], big: 'dragoniteK' },
    loot: ['candy', 'carbos', 'ct_hydro', 'hpup', 'zinc', 'revive'], reward: ['ct_fireblast', 'candy', 'charcoal'] },
  { id: 'm5', name: 'Laboratoire oublié', sub: 'Là où Mewtwo est né', theme: 'lab', mus: 5, lv: 38, seed: 5, boss: 'mewtwo', final: true,
    // zones libres : le hall (0) s'ouvre sur l'observation (1) et les archives (7) ; les cuves (2) mènent au poste de contrôle (3), puis à l'antichambre (5) ; la porte relie l'observation à la galerie des miroirs (4), qu'on atteint aussi par le quai (9)
    free: {
      zones: [
        { cell: [0, 2], name: "Hall d'entrée" }, { cell: [1, 2], name: "Salle d'observation" }, { cell: [1, 1], name: 'Salle des cuves' },
        { cell: [2, 1], name: 'Salle de contrôle' }, { cell: [2, 2], name: 'Galerie des miroirs' }, { cell: [3, 1], name: 'Antichambre' },
        { cell: [1, 0], name: 'Chambre de clonage', decor: ['tankbroken', 'pillar', 'tankbroken'] }, { cell: [0, 1], name: 'Archives effacées' }, { cell: [2, 0], name: 'Laboratoire annexe' }, { cell: [3, 2], name: 'Quai de maintenance' },
      ].map((z, i) => i === 2 ? { ...z, decor: ['tank', 'tank', 'pillar'] } : i === 3 ? { ...z, decor: ['console', 'console', 'pillar'] } : i === 4 ? { ...z, decor: ['mirror', 'mirror', 'pillar'] } : z)
        .map((z, i) => i < 2 ? { ...z, zone: 'Lisière' } : i === 5 ? { ...z, zone: 'Approche' } : i === 4 || i === 9 ? { ...z, zone: 'Approche' } : { ...z, zone: 'Cœur' })
        .map(shape([[3, -1, 11, 7], [-2, 2, 12, 8], [-2, -1, 13, 8], [-3, 2, 12, 8], [3, 1, 12, 8], [0, 0, 10, 6], [-3, 3, 11, 6], [2, -2, 9, 8], [3, 3, 11, 6], [-2, 2, 9, 6]])),
      links: [[0, 1], [1, 2], [2, 3], [3, 5], [2, 6], [0, 7], [3, 8], [4, 9], [9, 5]], pow: 2.1, noise: 0.9, thin: 0.9,
      door: [1, 4], arena: { cell: [3, 0], from: 5 }, bonfires: [0, 3, 5], big: 6, chests: [2, 3, 6, 8, 7, 4],
    },
    areas: [], sanctuary: 'Sanctuaire de Mewtwo',
    mobs: { mini: ['magnemite', 'koffing', 'voltorb'], mid: ['porygon', 'weezing'], big: 'electrodeA' },
    loot: ['candy', 'calcium', 'ct_psychic', 'hpup', 'ct_teleport'], reward: ['ct_solar', 'candy', 'leftovers'] },
  { id: 'm6', name: 'Île Mystère', sub: 'Le refuge de Mew', theme: 'mystic', mus: 6, lv: 45, seed: 59, boss: 'mew', secret: true,
    // zones libres : la plage (0) descend le long de l'île ; deux routes mènent aux ruines (5) ; la porte relie le bosquet (1) à l'antichambre (6)
    free: {
      zones: [
        { cell: [0, 0], name: 'Plage secrète', rx: 10 }, { cell: [0, 1], name: 'Bosquet lumineux' }, { cell: [0, 2], name: 'Clairière des rêves' },
        { cell: [1, 2], name: 'Ruines couvertes de lierre' }, { cell: [2, 2], name: 'Jardin suspendu' }, { cell: [2, 1], name: 'Source scintillante' },
        { cell: [1, 1], name: 'Antichambre du mythe' }, { cell: [3, 2], name: 'Crique des songes' }, { cell: [3, 1], name: 'Bosquet lunaire' }, { cell: [2, 0], name: 'Falaise des songes' },
      ].map((z, i) => i < 2 ? { ...z, zone: 'Lisière' } : i === 6 ? { ...z, zone: 'Approche' } : i > 6 ? { ...z, zone: 'Cœur' } : z)
        .map(shape([[0, 2, 10, 6], [2, -2, 11, 8], [-2, 2, 12, 8], [3, -2, 12, 8], [-2, 2, 12, 8], [-3, 2, 10, 9], [2, 0, 10, 6], [-3, -2, 9, 8], [2, 3, 10, 7], [3, 2, 9, 6]])),
      pow: 2.0, noise: 1.2,
      links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [4, 7], [7, 8], [5, 9]], thin: 0.9,
      door: [1, 6], arena: { cell: [1, 0], from: 6 }, bonfires: [0, 3, 6], big: 4, chests: [1, 2, 3, 7, 8, 9, 4, 5],
    },
    areas: ['Plage secrète', 'Bosquet lumineux', 'Clairière des rêves', 'Ruines couvertes de lierre', 'Jardin suspendu', 'Source scintillante', 'Antichambre du mythe'], sanctuary: 'Cœur de l’île',
    mobs: { mini: ['exeggcute', 'abra', 'haunter'], mid: ['kadabra', 'gengar', 'mrmime'], big: 'exeggutor' },
    loot: ['candy', 'protein', 'ct_softboiled', 'hpup', 'maxberry', 'maxether', 'revive'], reward: ['ct_hyper', 'candy', 'candy', 'coin'] },
];

// ---------- chapitres : chaque génération a ses cartes ; MAPS contient celles du chapitre actif (remplacées sur place, toutes les références la voient) ----------
const JOHTO = [
  { id: 'j1', name: 'Tour Carillon', sub: 'Où gronde la foudre', theme: 'bell', mus: 'J1', lv: 8, seed: 71, boss: 'raikou',
    // zones libres : hub (0) ouvert vers l'est et le nord ; le carrefour (2) mène au parvis (5) par le chemin direct, ou par l'esplanade et l'allée (3, 4) en détour ; porte-raccourci de la cour (1) vers l'antichambre (6)
    free: {
      zones: [
        { cell: [0, 2], name: 'Escalier des lanternes' }, { cell: [1, 2], name: 'Cour des cloches' }, { cell: [2, 2], name: 'Jardin des ex-voto' },
        { cell: [3, 2], name: 'Esplanade des tatamis' }, { cell: [3, 1], name: 'Allée de laque' }, { cell: [2, 1], name: 'Parvis du carillon' },
        { cell: [1, 1], name: 'Antichambre du tonnerre' }, { cell: [0, 1], name: 'Terrasse des ex-voto' },
        { cell: [3, 0], name: 'Pavillon des offrandes' }, { cell: [0, 0], name: 'Jardin caché' }, { cell: [2, 0], name: 'Belvédère des cloches' },
      ].map((z, i) => i === 7 ? { ...z, zone: 'Lisière' } : i > 7 ? { ...z, zone: 'Cœur' } : z),
      // pas de raccourci direct 2→5 : il faut faire tout le détour par l'esplanade et l'allée ; trois culs-de-sac (8, 9, 10) à explorer avant l'antichambre
      links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [0, 7], [4, 8], [7, 9], [5, 10]],
      door: [1, 6], arena: { cell: [1, 0], from: 6 }, bonfires: [0, 2, 6], big: 4, pseudo: 9, chests: [2, 3, 8, 7, 9, 10, 5],
    },
    areas: ['Escalier des lanternes', 'Cour des cloches', 'Jardin des ex-voto', 'Esplanade des tatamis', 'Allée de laque', 'Parvis du carillon', 'Antichambre du tonnerre'], sanctuary: 'Sanctuaire de Raikou',
    mobs: { mini: ['pichu', 'mareep', 'chinchou'], mid: ['flaaffy', 'lanturn', 'togetic'], big: 'ampharos', pseudo: 'metagrossK' },
    loot: ['candy', 'hpup', 'ct_swift', 'protein', 'ct_earthquake'], reward: ['ct_thunder', 'candy', 'seed'] },
  // ---------- Tour Brûlée : pagode calcinée. Trois ouvertures depuis le parvis (ouest : jardin, nord : allée, est : cour des tuiles) ; la porte de l'escalier rouvre les remparts, d'où l'on redescend vers le parvis
  { id: 'j2', name: 'Tour Brûlée', sub: 'Ce que le feu a épargné', theme: 'ember', mus: 'J2', lv: 15, seed: 83, boss: 'entei',
    free: {
      zones: [
        { cell: [1, 2], name: 'Parvis calciné' }, { cell: [0, 2], name: 'Jardin des érables' }, { cell: [1, 1], name: 'Allée des cendres' },
        { cell: [3, 2], name: 'Remparts effondrés' }, { cell: [2, 1], name: 'Cour du temple effondré' }, { cell: [3, 1], name: 'Escalier de la tour' },
        { cell: [2, 0], name: 'Étage effondré' }, { cell: [2, 2], name: 'Cour des tuiles' }, { cell: [0, 1], name: 'Chapelle des cloches' }, { cell: [1, 0], name: 'Belvédère calciné' },
      ].map((z, i) => ({ ...z, rx: 14, ry: 9, ...(i === 0 || i === 1 ? { zone: 'Lisière' } : i > 7 ? { zone: 'Cœur' } : {}) })),
      links: [[0, 1], [0, 2], [0, 7], [7, 3], [2, 4], [4, 5], [5, 6], [1, 8], [2, 9], [7, 4], [8, 2], [9, 4]],
      canyons: [{ z: 1, off: 4 }, { z: 2, ax: 'h', off: -3 }, { z: 4, off: -3, w: 4, gap: -2 }, { z: 7, off: 3 }, { z: 3, ax: 'h', off: 2 }, { z: 8, off: -2 }],
      door: [3, 5], arena: { cell: [3, 0], from: 5 }, bonfires: [0, 4, 6], big: 5, pseudo: 8, chests: [1, 2, 3, 4, 8, 9, 7, 5],
    },
    areas: ['Parvis calciné', 'Allée des cendres', 'Cour du temple effondré', 'Escalier de la tour', 'Étage effondré'], sanctuary: "Sanctuaire d'Entei",
    mobs: { mini: ['houndour', 'slugma', 'magby'], mid: ['houndoom', 'magcargo', 'magmarJ'], big: 'houndoomA', pseudo: 'tyranitarK' },
    loot: ['candy', 'hpup', 'ct_swift', 'protein', 'ct_aquaring', 'zinc'], reward: ['ct_flamethrower', 'candy', 'egg'] },
  // ---------- Lac du Miroir : archipel de zones reliées par des ponts ; l'arène se voit depuis le ponton d'arrivée
  { id: 'j3', name: 'Lac du Miroir', sub: 'Là où le ciel se regarde', theme: 'mirror', mus: 'J3', lv: 22, seed: 97, boss: 'suicune',
    free: {
      zones: [
        { cell: [0, 2], name: 'Débarcadère' }, { cell: [0, 1], name: 'Jardin de lotus' }, { cell: [1, 2], name: 'Ponts en zigzag' },
        { cell: [1, 1], name: 'Île des cerisiers' }, { cell: [2, 1], name: 'Pavillon flottant' }, { cell: [2, 2], name: 'Îlot des pêcheurs' },
        { cell: [3, 1], name: 'Gradins du lac' }, { cell: [2, 0], name: "Antichambre de l'aurore" }, { cell: [3, 2], name: 'Ponton des lanternes' },
        { cell: [0, 0], name: 'Récif du dragon' }, { cell: [1, 0], name: 'Rocher du pêcheur' },
      ].map((z, i) => i === 0 || i === 1 ? { ...z, zone: 'Lisière' } : i > 7 ? { ...z, zone: 'Cœur' } : z),
      links: [[0, 1], [0, 2], [2, 3], [3, 4], [4, 5], [4, 6], [6, 7], [6, 8], [1, 9], [3, 10]], passW: 6,
      door: [2, 5], arena: { cell: [3, 0], from: 6 }, bonfires: [0, 3, 7], big: 6, pseudo: 9, pits: 2, chests: [1, 3, 5, 8, 9, 10, 4, 6],
    },
    areas: ['Débarcadère', 'Ponts en zigzag', 'Île des cerisiers', 'Pavillon flottant', 'Gradins du lac'], sanctuary: 'Sanctuaire de Suicune',
    mobs: { mini: ['marill', 'wooper', 'remoraid'], mid: ['azumarill', 'quagsire', 'octillery'], big: 'mantineB', pseudo: 'salamenceK' },
    loot: ['candy', 'hpup', 'ct_swift', 'protein', 'ct_healbell', 'maxberry'], reward: ['ct_surf', 'candy', 'belt'] },
  // ---------- Îles Tourbillon : archipel de tempête ; le phare commande le détour vers l'antichambre de Lugia
  { id: 'j4', name: 'Îles Tourbillon', sub: 'Au cœur de la tempête', theme: 'storm', mus: 'J4', lv: 36, seed: 113, boss: 'lugia', final: true,
    free: {
      zones: [
        { cell: [0, 1], name: 'Rivage naufragé' }, { cell: [0, 2], name: 'Épave échouée' }, { cell: [1, 1], name: 'Atoll des cormorans' },
        { cell: [1, 2], name: 'Banc de corail' }, { cell: [2, 1], name: 'Île du phare' }, { cell: [2, 2], name: 'Récif des raies' },
        { cell: [2, 0], name: 'Arche de pierre' }, { cell: [3, 1], name: 'Antichambre du tourbillon' }, { cell: [3, 2], name: 'Écueil des brumes' },
      ].map((z, i) => i < 2 ? { ...z, zone: 'Lisière' } : i > 7 ? { ...z, zone: 'Cœur' } : z),
      links: [[0, 1], [0, 2], [2, 3], [2, 4], [4, 5], [4, 6], [4, 7], [7, 8]], passW: 6,
      door: [3, 5], arena: { cell: [3, 0], from: 7 }, bonfires: [0, 4, 7], big: 2, pseudo: 6, pits: 2, chests: [1, 3, 5, 6, 8, 2, 4],
    },
    areas: ['Rivage naufragé', 'Atoll des cormorans', 'Île du phare', 'Antichambre du tourbillon'], sanctuary: 'Sanctuaire de Lugia',
    mobs: { mini: ['horsea', 'tentacool', 'remoraid'], mid: ['seadra', 'tentacruel', 'mantine'], big: 'kingdraB', pseudo: 'garchompK' },
    loot: ['candy', 'hpup', 'ct_hydro', 'protein', 'ct_icebeam', 'revive'], reward: ['ct_psychic', 'candy', 'orb'] },
  // ---------- Forêt d'Ilex (secrète, ouverte après Lugia) : clairières et sous-bois ; la porte relie la clairière des rêves au bosquet d'entrée
  { id: 'j5', name: "Forêt d'Ilex", sub: 'Le temple hors du temps', theme: 'ilex', mus: 'J5', lv: 42, seed: 131, boss: 'celebi', secret: true,
    free: {
      zones: [
        { cell: [0, 2], name: "Entrée du sanctuaire" }, { cell: [1, 2], name: 'Bosquet doré' }, { cell: [1, 1], name: 'Clairière des rêves' },
        { cell: [2, 2], name: 'Souche millénaire' }, { cell: [2, 1], name: 'Sentier de lierre' }, { cell: [3, 2], name: 'Source du temps' },
        { cell: [0, 1], name: 'Verger perdu' }, { cell: [3, 1], name: 'Antichambre du printemps' }, { cell: [1, 0], name: 'Tronc creux' },
      ].map((z, i) => i < 2 || i === 6 ? { ...z, zone: 'Lisière' } : i > 7 ? { ...z, zone: 'Cœur' } : z),
      links: [[0, 1], [1, 3], [3, 4], [3, 5], [2, 4], [2, 8], [4, 7], [0, 6]],
      door: [1, 2], arena: { cell: [3, 0], from: 7 }, bonfires: [0, 4, 7], big: 5, pseudo: 8, chests: [1, 2, 3, 5, 6, 8, 4, 7],
    },
    areas: ["Entrée du sanctuaire", 'Bosquet doré', 'Sentier de lierre', 'Antichambre du printemps'], sanctuary: 'Cœur de la forêt',
    mobs: { mini: ['hoppip', 'sunkern', 'pineco'], mid: ['skiploom', 'sunflora', 'forretress'], big: 'meganiumB', pseudo: 'goodraK' },
    loot: ['candy', 'hpup', 'ct_synthesis', 'protein', 'maxether', 'ct_softboiled', 'revive'], reward: ['ct_swords', 'candy', 'candy'] },
];
export const CHAPTER_MAPS = { kanto: KANTO, johto: JOHTO };
export const CHAPTER_INFO = {
  kanto: { n: 'I', name: 'Kanto', gen: 1, sub: 'Quatre cartes et un secret, jusqu’à Mewtwo', world: 'assets/ui/worldmap.jpg', nodes: [[11.5, 58], [26, 23], [50.5, 63], [63, 38.5], [86, 18]] },
  johto: { n: 'II', name: 'Johto', gen: 2, sub: 'Trois bêtes, un sanctuaire marin et un temple hors du temps', world: 'assets/ui/worldmap-johto.jpg', nodes: [[30, 41], [54, 24], [52.5, 54], [65, 78], [28, 74]] },
};
export const MAPS = [];
export let CHAPTER = 'kanto';
export function setChapter(id) { if (!CHAPTER_MAPS[id]) id = 'kanto'; CHAPTER = id; MAPS.length = 0; MAPS.push(...CHAPTER_MAPS[id]); return id; }
setChapter('kanto');

// ---------- aléatoire à graine ----------
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const rnd = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

const FOOT = { tank: [2, 2], tankbroken: [2, 2], pillar: [1, 1], mirror: [1, 1], console: [2, 1], rock: [1, 1], crystal: [1, 1], brazier: [1, 1], generator: [2, 2], tree: [2, 2], statue: [1, 1], chest: [1, 1], lantern: [1, 1], bell: [2, 2], torii: [2, 1] };

// Collision resserrée des décors dont le sprite est bien plus étroit que leur emprise (placement et espacement inchangés) :
// au lieu de bloquer toute l'emprise en cases (invisible : l'arbre bloquait 48×48 px pour un tronc de ~14 px), seul le pied compte.
// Boîtes [cx, cy, hw, hh] en px depuis le coin haut-gauche de l'emprise ; le sprite pose ses pieds à ~2 px sous le bas de l'emprise.
const COLBOX = { tree: [[24, 39, 9, 7]], lantern: [[12, 16, 8, 6]] };

// ---------- génération « zones libres » ----------
// Au lieu de salles reliées par des couloirs : de grandes zones ouvertes (formes organiques) posées sur la grille de cellules,
// reliées par de larges passages, avec un raccourci verrouillé (porte qui s'ouvre de l'autre côté) et un seul passage de brume (arène).
// Le graphe est déclaré par la carte : def.free = { zones: [{ cell, name, zone?, rx?, ry? }], links: [[a, b]], door: [i, j], arena: { cell, from }, bonfires: [a, b, c], big, chests }
function generateFree(def) {
  const R = rng(def.seed), F = def.free, cw = 31, ch = 21, ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const grid = new Uint8Array(MW * MH), roomOf = new Int16Array(MW * MH).fill(-1), zd = new Float32Array(MW * MH).fill(9);
  const inMap = (x, y) => x > 1 && y > 1 && x < MW - 2 && y < MH - 2;
  const sm = t => t * t * (3 - 2 * t);
  const nz = (x, y, sc, s) => {   // bruit de valeur lissé, propre à la carte
    const gx = x / sc, gy = y / sc, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0, v = (i, j) => rnd(x0 + i, y0 + j, def.seed + s);
    const a = v(0, 0) + (v(1, 0) - v(0, 0)) * sm(fx), b = v(0, 1) + (v(1, 1) - v(0, 1)) * sm(fx); return a + (b - a) * sm(fy);
  };
  const last = F.zones.length - 1;
  const zones = F.zones.map((z, k) => ({ ...z, k, cx: z.cell[0] * cw + 15 + ri(-2, 2) + (z.ox || 0), cy: z.cell[1] * ch + 10 + PADY + ri(-3, 2) + (z.oy || 0), rx: z.rx || ri(11, 12), ry: z.ry || ri(7, 8), zone: z.zone || (k === 0 ? 'Lisière' : k === last ? 'Approche' : 'Cœur') }));
  // l'arène et la zone qui y mène, puis le raccourci : on écarte les zones pour garder du vide (3 cases au moins) où poser la brume et la porte
  const AC = F.arena.cell, arena = { cx: AC[0] * cw + 15, cy: AC[1] * ch + 10 + PADY - Math.ceil(ARENA_R - 9), r: ARENA_R };
  const zf = zones[F.arena.from], vert = Math.abs(arena.cy - zf.cy) >= Math.abs(arena.cx - zf.cx);
  const sx = Math.sign(arena.cx - zf.cx) || 1, sy = Math.sign(arena.cy - zf.cy) || 1;
  if (vert) { zf.ry = Math.min(zf.ry, 7); const e = Math.round(arena.cy - sy * (arena.r + 4 + zf.ry)); if ((zf.cy - e) * -sy < 0) zf.cy = e; }
  else { zf.rx = Math.min(zf.rx, 10); const e = Math.round(arena.cx - sx * (arena.r + 4 + zf.rx)); if ((zf.cx - e) * -sx < 0) zf.cx = e; }
  if (F.door) {
    const I = zones[F.door[0]], J = zones[F.door[1]], v2 = Math.abs(J.cy - I.cy) >= Math.abs(J.cx - I.cx), sg2 = v2 ? (Math.sign(J.cy - I.cy) || 1) : (Math.sign(J.cx - I.cx) || 1);
    if (v2) { I.ry = Math.min(I.ry, 7); J.ry = Math.min(J.ry, 7); const gp = Math.abs(J.cy - I.cy) - I.ry - J.ry; if (gp < 5) I.cy -= sg2 * (5 - gp); }
    else { I.rx = Math.min(I.rx, 10); J.rx = Math.min(J.rx, 10); const gp = Math.abs(J.cx - I.cx) - I.rx - J.rx; if (gp < 5) I.cx -= sg2 * (5 - gp); }
  }
  const PW = F.pow ?? 2.8, NZ = F.noise ?? 0.55;   // pow : 2,8 = cours carrées (Johto) ; ~2 = ellipses ; noise : irrégularité des bords (grottes)
  const zdist = (z, x, y) => { const dx = Math.abs(x + 0.5 - z.cx) / z.rx, dy = Math.abs(y + 0.5 - z.cy) / z.ry; return dx ** PW + dy ** PW + (nz(x, y, F.nsc ?? 5, z.k + 1) - 0.5) * NZ; };
  const inZone = (x, y) => zones.some(z => zdist(z, x, y) <= 1);
  // 1. zones : formes organiques (super-ellipse + bruit)
  for (const z of zones) for (let y = z.cy - z.ry - 2; y <= z.cy + z.ry + 2; y++) for (let x = z.cx - z.rx - 2; x <= z.cx + z.rx + 2; x++) {
    if (!inMap(x, y)) continue; const d = zdist(z, x, y);
    if (d <= 1) { grid[y * MW + x] = T.FLOOR; if (d < zd[y * MW + x]) { zd[y * MW + x] = d; roomOf[y * MW + x] = z.k; } }
  }
  // 2. passages larges entre zones voisines
  const segs = [], segD = (px, py, s_) => { const [ax, ay, bx, by] = s_, vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1, t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l2)); return Math.hypot(px - (ax + vx * t), py - (ay + vy * t)); };
  const passW = F.passW || 8;
  for (const [a, b] of F.links) {
    const A = zones[a], B = zones[b], sg = [A.cx, A.cy, B.cx, B.cy, passW / 2]; segs.push(sg);
    for (let y = Math.min(A.cy, B.cy) - 7; y <= Math.max(A.cy, B.cy) + 7; y++) for (let x = Math.min(A.cx, B.cx) - 7; x <= Math.max(A.cx, B.cx) + 7; x++) {
      if (!inMap(x, y)) continue;
      const hw = passW / 2 + (nz(x, y, 6, 50 + a * 7 + b) - 0.5) * 2.2;
      if (segD(x + 0.5, y + 0.5, sg) <= hw) { if (grid[y * MW + x] === T.VOID) { grid[y * MW + x] = T.FLOOR; roomOf[y * MW + x] = Math.hypot(x - A.cx, y - A.cy) < Math.hypot(x - B.cx, y - B.cy) ? a : b; } }
    }
  }
  // 3. arène + court couloir de 3 cases fermé par la brume
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const dx = x + 0.5 - arena.cx, dy = y + 0.5 - arena.cy; if (dx * dx + dy * dy <= arena.r * arena.r) grid[y * MW + x] = T.FLOOR; }
  const fpts = [];
  if (vert) for (let y = zf.cy; y !== arena.cy; y += sy) fpts.push({ x: arena.cx, y, dx: 0, dy: sy });
  else for (let x = zf.cx; x !== arena.cx; x += sx) fpts.push({ x, y: arena.cy, dx: sx, dy: 0 });
  for (const q of fpts) for (let o = -1; o <= 1; o++) { const x = q.x + (vert ? o : 0), y = q.y + (vert ? 0 : o); if (inMap(x, y) && grid[y * MW + x] === T.VOID) grid[y * MW + x] = T.FLOOR; }
  let fi = fpts.findIndex(q => !inZone(q.x, q.y) && (q.x + 0.5 - arena.cx) ** 2 + (q.y + 0.5 - arena.cy) ** 2 > arena.r * arena.r); if (fi < 0) fi = fpts.length - 1;
  fi = Math.min(fpts.length - 1, fi + 1);
  const fp = fpts[fi], fogTiles = [-1, 0, 1].map(o => vert ? [fp.x + o, fp.y] : [fp.x, fp.y + o]), fog = { tiles: fogTiles, dir: { x: fp.dx, y: fp.dy } };
  // 4. raccourci : couloir de 3 cases entre deux zones voisines, porte au milieu du vide qui les sépare ; elle s'ouvre depuis la zone la plus tardive (j)
  let door = null;
  if (F.door) {
    const I = zones[F.door[0]], J = zones[F.door[1]], v2 = Math.abs(J.cy - I.cy) >= Math.abs(J.cx - I.cx), sgn = v2 ? (Math.sign(J.cy - I.cy) || 1) : (Math.sign(J.cx - I.cx) || 1);
    const mx = Math.round((I.cx + J.cx) / 2), my = Math.round((I.cy + J.cy) / 2), pts = [];
    if (v2) for (let y = I.cy; y !== J.cy; y += sgn) pts.push({ x: mx, y }); else for (let x = I.cx; x !== J.cx; x += sgn) pts.push({ x, y: my });
    for (const q of pts) for (let o = -1; o <= 1; o++) { const x = q.x + (v2 ? o : 0), y = q.y + (v2 ? 0 : o); if (inMap(x, y) && grid[y * MW + x] === T.VOID) grid[y * MW + x] = T.FLOOR; }
    const gap = pts.filter(q => !inZone(q.x, q.y)), g0 = gap[Math.floor(gap.length / 2)] || pts[Math.floor(pts.length / 2)];
    const tiles = [-1, 0, 1].map(o => v2 ? [g0.x + o, g0.y] : [g0.x, g0.y + o]);
    door = { tiles, dir: v2 ? { x: 0, y: -sgn } : { x: -sgn, y: 0 } };
    tiles.forEach(([x, y]) => { grid[y * MW + x] = T.DOOR; });
  }
  {   // l'arène ne communique qu'avec son couloir : on dégage une couronne de vide autour d'elle
    const corr = new Set(); for (const q of fpts) for (let o = -1; o <= 1; o++) corr.add((vert ? q.y : q.y + o) * MW + (vert ? q.x + o : q.x));
    for (let y = Math.floor(arena.cy - arena.r - 4); y <= Math.ceil(arena.cy + arena.r + 4); y++) for (let x = Math.floor(arena.cx - arena.r - 4); x <= Math.ceil(arena.cx + arena.r + 4); x++) {
      if (!inMap(x, y)) continue; const d2 = (x + 0.5 - arena.cx) ** 2 + (y + 0.5 - arena.cy) ** 2;
      if (d2 > arena.r * arena.r && d2 <= (arena.r + 2.5) ** 2 && !corr.has(y * MW + x) && grid[y * MW + x] !== T.VOID && grid[y * MW + x] !== T.DOOR) { grid[y * MW + x] = T.VOID; roomOf[y * MW + x] = -1; }
    }
  }
  // couloir de brume : du vide de chaque côté depuis la brume jusqu'à l'arène (une zone voisine ne doit pas le contourner)
  for (let i = fi; i < fpts.length; i++) { const q = fpts[i]; for (const o of [-3, -2, 2, 3]) { const x = q.x + (vert ? o : 0), y = q.y + (vert ? 0 : o); if (inMap(x, y) && (x + 0.5 - arena.cx) ** 2 + (y + 0.5 - arena.cy) ** 2 > arena.r * arena.r && grid[y * MW + x] !== T.DOOR) { grid[y * MW + x] = T.VOID; roomOf[y * MW + x] = -1; } } }
  for (const [x, y] of fogTiles) grid[y * MW + x] = T.FOG;
  // 5. fosses : trous dans les grandes zones (jamais sur un passage ni près du centre)
  const pits = [];
  if (F.pits !== 0) for (const z of zones) {
    if (z.k === 0 || z.k === last || z.nopit) continue;
    for (let n = 0, made = 0; n < 60 && made < (z.pits ?? 3); n++) {
      const px = z.cx + ri(-z.rx + 4, z.rx - 4), py = z.cy + ri(-z.ry + 3, z.ry - 3), pr = 2.2 + R() * 2.2;
      if (zdist(z, px, py) > 0.55) continue;
      if (segs.some(sg => segD(px + 0.5, py + 0.5, sg) < sg[4] * 0.6 + pr + 0.5) || pits.some(q => Math.hypot(q[0] - px, q[1] - py) < q[2] + pr + 4)) continue;
      if (door && door.tiles.some(([x, y]) => Math.hypot(x - px, y - py) < pr + 5)) continue;
      for (let y = Math.floor(py - pr - 1); y <= Math.ceil(py + pr + 1); y++) for (let x = Math.floor(px - pr - 1); x <= Math.ceil(px + pr + 1); x++) {
        if (inMap(x, y) && grid[y * MW + x] === T.FLOOR && Math.hypot(x - px, y - py) + (nz(x, y, 3, 90) - 0.5) * 1.2 <= pr) grid[y * MW + x] = T.VOID;
      }
      pits.push([px, py, pr]); made++;
    }
  }
  // 5b. gouffres : tranchées qui traversent une zone, franchissables par un pont de planches (carte « monde ouvert »)
  const forced = new Uint8Array(MW * MH), chasm = new Uint8Array(MW * MH);
  for (const cn of F.canyons || []) {
    const z = zones[cn.z], vt = cn.ax !== 'h', half = (cn.w || 3) / 2, gc = (vt ? z.cy : z.cx) + (cn.gap || 0), gw = (cn.gapW || 5) / 2, c0 = (vt ? z.cx : z.cy) + (cn.off || 0);
    for (let y = z.cy - z.ry - 3; y <= z.cy + z.ry + 3; y++) for (let x = z.cx - z.rx - 3; x <= z.cx + z.rx + 3; x++) {
      if (!inMap(x, y) || grid[y * MW + x] !== T.FLOOR) continue;
      const al = vt ? y : x, ac = vt ? x : y, wob = (nz(x, y, 4, 70 + z.k) - 0.5) * 2.4;
      if (Math.abs(ac + 0.5 - c0 - wob) > half) continue;
      if ((x + 0.5 - arena.cx) ** 2 + (y + 0.5 - arena.cy) ** 2 < (arena.r + 5) ** 2) continue;
      if (fpts.some(q => Math.hypot(q.x - x, q.y - y) < 5) || (door && door.tiles.some(([dx, dy]) => Math.hypot(dx - x, dy - y) < 6))) continue;
      if (Math.abs(al + 0.5 - gc) <= gw) { forced[y * MW + x] = 1; continue; }
      grid[y * MW + x] = T.VOID; roomOf[y * MW + x] = -1; chasm[y * MW + x] = 1;
    }
  }
  // 6. élagage : toute tuile de sol non reliée au départ (poches, îlots isolés) redevient vide
  {
    const st = zones[F.bonfires[0]], q = [[st.cx, st.cy + 2]], seen = new Uint8Array(MW * MH); let sx0 = st.cx, sy0 = st.cy + 2;
    for (let t = 0; t < 40 && grid[sy0 * MW + sx0] === T.VOID; t++) { sy0 = st.cy + 2 + (t % 7) - 3; sx0 = st.cx + ((t * 3) % 9) - 4; } q[0] = [sx0, sy0];
    seen[sy0 * MW + sx0] = 1;
    while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = ny * MW + nx; if (nx > 0 && ny > 0 && nx < MW - 1 && ny < MH - 1 && !seen[k] && grid[k] !== T.VOID) { seen[k] = 1; q.push([nx, ny]); } } }
    for (let i = 0; i < grid.length; i++) if (grid[i] !== T.VOID && !seen[i]) { grid[i] = T.VOID; roomOf[i] = -1; }
  }
  // 7. décors, coffres, feux, ennemis (voies de passage réservées)
  const occ = new Uint8Array(MW * MH);
  const reserve = (x, y, w, h, pad = 0) => { for (let j = -pad; j < h + pad; j++) for (let i = -pad; i < w + pad; i++) { const k = (y + j) * MW + x + i; if (k >= 0 && k < occ.length) occ[k] = 1; } };
  for (const sg of segs) for (let y = Math.min(sg[1], sg[3]) - 6; y <= Math.max(sg[1], sg[3]) + 6; y++) for (let x = Math.min(sg[0], sg[2]) - 6; x <= Math.max(sg[0], sg[2]) + 6; x++) if (inMap(x, y) && segD(x + 0.5, y + 0.5, sg) <= sg[4] + 1) occ[y * MW + x] = 1;
  for (const q of fpts) reserve(q.x - 2, q.y - 2, 5, 5, 0);
  if (door) for (const [x, y] of door.tiles) reserve(x - 3, y - 3, 7, 7, 0);
  const free = (x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = (y + j) * MW + x + i; if (occ[k] || grid[k] !== T.FLOOR) return false; } return true; };
  const inZ = (k, x, y) => roomOf[y * MW + x] === k;
  let reach = null;   // tuiles atteignables depuis le départ une fois le décor posé : coffres et ennemis n'y échouent jamais dans une poche fermée
  const spot = (k, tries, ok) => { const z = zones[k]; for (let t = 0; t < tries; t++) { const x = z.cx + ri(-z.rx + 2, z.rx - 2), y = z.cy + ri(-z.ry + 2, z.ry - 2); if (inMap(x, y) && inZ(k, x, y) && free(x, y, 1, 1) && (!reach || reach[y * MW + x]) && (!ok || ok(x, y))) return [x, y]; } return null; };
  const bonfires = [];
  F.bonfires.forEach((k, bi) => {
    const z = zones[k]; let bx = z.cx, by = bi === 0 ? z.cy - 2 : z.cy - 3;
    if (!free(bx, by, 1, 1)) { const p = spot(k, 80, (x, y) => free(x - 1, y - 1, 3, 3)); if (p) [bx, by] = p; }
    reserve(bx, by, 1, 1, 2); bonfires.push({ id: 'b' + (bi + 1), name: z.name, tx: bx, ty: by });
  });
  const b0 = bonfires[0]; let start = { tx: b0.tx, ty: b0.ty + 2 };
  for (const [ox, oy] of [[0, 2], [0, -2], [2, 0], [-2, 0], [0, 3], [3, 0], [-3, 0], [0, -3], [1, 1], [-1, 1], [2, 2], [-2, 2]]) if (grid[(b0.ty + oy) * MW + b0.tx + ox] === T.FLOOR) { start = { tx: b0.tx + ox, ty: b0.ty + oy }; break; }
  reserve(start.tx, start.ty, 1, 1, 1);
  const farFromFire = (x, y) => bonfires.every(b => Math.hypot(b.tx - x, b.ty - y) > 7);
  const decor = [], chests = [], spawns = [];
  // mini-boss (pseudo-légendaire) : il apparaît au centre de sa zone, dans une clairière dégagée de 7×7 cases (sol plein, ni gouffre, ni décor, ni feu),
  // posée AVANT le décor : un point tiré au hasard le coinçait contre un mur, une fosse ou un décor
  if (def.mobs.pseudo) {
    const pk = F.pseudo ?? 9, pz = zones[pk];
    if (pz) {
      const clear = (x, y) => { for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (!inMap(x + i, y + j) || grid[(y + j) * MW + x + i] !== T.FLOOR) return false; return bonfires.every(b => Math.hypot(b.tx - x, b.ty - y) > 7); };
      let at = null;
      for (let r = 0; r <= 14 && !at; r++) for (let dy = -r; dy <= r && !at; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = pz.cx + dx, y = pz.cy + dy; if (inZ(pk, x, y) && clear(x, y)) { at = [x, y]; break; }
      }
      if (at) { reserve(at[0] - 3, at[1] - 3, 7, 7, 0); spawns.push({ type: def.mobs.pseudo, tx: at[0], ty: at[1], room: pk }); }
    }
  }
  zones.forEach(z => {
    const n = Math.floor(Math.PI * z.rx * z.ry / 24);
    for (let t = 0; t < n * 5 && decor.filter(d => d.room === z.k).length < n; t++) {
      const dk = z.decor || def.decorKinds, kind = dk[Math.floor(R() * dk.length)], [w, h] = FOOT[kind];
      const x = z.cx + ri(-z.rx + 1, z.rx - 2), y = z.cy + ri(-z.ry + 1, z.ry - 2);
      if (!inMap(x, y) || !inZ(z.k, x, y) || !free(x, y, w, h) || !inZ(z.k, x + w - 1, y + h - 1)) continue; reserve(x, y, w, h, 1); decor.push({ kind, tx: x, ty: y, room: z.k });
    }
  });
  const computeReach = () => {   // atteignabilité depuis le départ, décor et coffres solides exclus
    const blocked = new Uint8Array(MW * MH); for (const d of decor) { const [w, h] = FOOT[d.kind]; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) blocked[(d.ty + j) * MW + d.tx + i] = 1; }
    for (const c of chests) blocked[c.ty * MW + c.tx] = 1;
    reach = new Uint8Array(MW * MH); const q = [[start.tx, start.ty]]; reach[start.ty * MW + start.tx] = 1;
    while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = ny * MW + nx; if (!reach[k] && grid[k] === T.FLOOR && !blocked[k]) { reach[k] = 1; q.push([nx, ny]); } } }
  };
  computeReach();
  const chestZ = F.chests || zones.map((_, k) => k).filter(k => k > 0);
  def.loot.forEach((item, ci) => { let p = spot(chestZ[ci % chestZ.length], 120); for (let k = 1; !p && k < zones.length; k++) p = spot(k, 200); if (p) { reserve(p[0], p[1], 1, 1, 1); chests.push({ tx: p[0], ty: p[1], item }); } });
  computeReach();
  const tiers = def.mobs, pick = a => a[Math.floor(R() * a.length)];
  const place = (k, type, up = 0) => { const p = spot(k, 120, farFromFire); if (p) { reserve(p[0], p[1], 1, 1, 1); spawns.push({ type, tx: p[0], ty: p[1], room: k, ...(up ? { up } : {}) }); } };
  const bigZ = F.big ?? 4;
  // Tiers de mobs par zone : BAS (petites espèces, niveau de la carte), MOYEN (mélange, +1 pour les espèces moyennes), HAUT (espèces moyennes « élites » à +3 niveaux).
  // Le tier n'est pas linéaire : il dépend de la profondeur dans le graphe de zones, des culs-de-sac (plus dangereux, mais ce sont eux qui gardent les coffres) et d'un aléa fixe par carte
  // (hachage de la graine, sans toucher au tirage R : la géométrie des cartes ne bouge pas). La zone qui mène à l'arène est toujours au moins MOYEN.
  const adj = zones.map(() => []); for (const [a, b] of F.links || zones.slice(1).map((_, i) => [i, i + 1])) { adj[a].push(b); adj[b].push(a); }
  const depth = zones.map(() => -1); depth[0] = 0; for (const q = [0]; q.length;) { const a = q.shift(); for (const b of adj[a]) if (depth[b] < 0) { depth[b] = depth[a] + 1; q.push(b); } }
  const maxD = Math.max(1, ...depth), hsh = k => { let h = (Math.imul(def.seed | 0, 2654435761) + Math.imul(k + 1, 40503)) >>> 0; h ^= h >>> 13; h = Math.imul(h, 1274126177) >>> 0; return (h & 1023) / 1023; };
  const danger = zones.map((_, k) => { let d = 0.15 + 0.5 * Math.max(0, depth[k]) / maxD + (adj[k].length === 1 && k !== 0 ? 0.3 : 0) + (hsh(k) - 0.5) * 0.5; if (k === F.arena.from) d = Math.max(d, 0.5); if (k === 1) d = Math.min(d, 0.3); return d; });
  const tierOf = k => danger[k] < 0.38 ? 0 : danger[k] < 0.68 ? 1 : 2;
  zones.forEach(z => z.tier = z.k === 0 ? -1 : tierOf(z.k));
  zones.forEach(z => {
    const k = z.k; if (k === 0) return;
    const th_ = F.thin ?? 1, cnt = n => Math.max(1, Math.round(n * th_));   // thin : cartes plus vastes, rencontres moins serrées
    const t = z.tier, ex = k === last ? 1 : 0;
    if (t === 0) { for (let i = 0; i < cnt(3 + (k % 2) + ex); i++) place(k, pick(tiers.mini)); }
    else if (t === 1) { for (let i = 0; i < cnt(2 + ex); i++) place(k, pick(tiers.mini)); for (let i = 0; i < cnt(1 + (k % 2) + ex); i++) place(k, pick(tiers.mid)); }
    else { for (let i = 0; i < cnt(1 + ex); i++) place(k, pick(tiers.mini)); for (let i = 0; i < cnt(1); i++) place(k, pick(tiers.mid)); for (let i = 0; i < cnt(1 + (k % 2) + ex); i++) place(k, pick(tiers.mid), 3); }
    if (k === bigZ) place(k, tiers.big);
  });
  if (!spawns.some(sp => sp.type === tiers.big)) for (const k of [bigZ, 5, 3, 2, 1]) { if (!zones[k]) continue; const p = spot(k, 400); if (p) { spawns.push({ type: tiers.big, tx: p[0], ty: p[1], room: k }); break; } }
  if (tiers.pseudo && !spawns.some(sp => sp.type === tiers.pseudo)) for (const k of [F.pseudo ?? 9, 3, 5, 1, 2]) { if (!zones[k]) continue; const p = spot(k, 400); if (p) { spawns.push({ type: tiers.pseudo, tx: p[0], ty: p[1], room: k }); break; } }
  // quête de Fala : cellule secrète collée au bord d'une zone « hub » (deux tuiles de faux mur qui s'ouvrent) et emplacement des Modules
  let secret = null; const modules = [];
  if (def.fala) {
    const SWd = 9, SHt = 7, PAD = 2, DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
    const voidBox = (x0, y0, x1, y1) => { for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) { if (i < 2 || j < 2 || i >= MW - 2 || j >= MH - 2 || grid[j * MW + i] !== T.VOID) return false; } return true; };
    search: for (const hk of def.fala.hub) for (const side of ['N', 'E', 'W', 'S']) {
      const [dx, dy] = DIRS[side], px = Math.abs(dy), py = Math.abs(dx), z = zones[hk], cand = [];
      for (let y = z.cy - z.ry - 1; y <= z.cy + z.ry + 1; y++) for (let x = z.cx - z.rx - 1; x <= z.cx + z.rx + 1; x++) {
        const at = (a, b) => inMap(a, b) && roomOf[b * MW + a] === hk && grid[b * MW + a] === T.FLOOR && !occ[b * MW + a], out = (a, b) => grid[b * MW + a] === T.VOID;
        if (at(x, y) && at(x + px, y + py) && out(x + dx, y + dy) && out(x + px + dx, y + py + dy)) cand.push([x, y]);
      }
      cand.sort((a, b) => Math.hypot(a[0] - z.cx, a[1] - z.cy) - Math.hypot(b[0] - z.cx, b[1] - z.cy));
      for (const [x, y] of cand) for (const off of [0, 1, -1, 2, -2]) {
        const gap = [[x + dx, y + dy], [x + px + dx, y + py + dy]]; let sx, sy;
        if (side === 'N' || side === 'S') { sx = x - (Math.floor(SWd / 2) - 1) + off; sy = side === 'N' ? y - 1 - SHt : y + 2; }
        else { sy = y - (Math.floor(SHt / 2) - 1) + off; sx = side === 'W' ? x - 1 - SWd : x + 2; }
        const x0 = sx - (side === 'E' ? 1 : PAD), x1 = sx + SWd - 1 + (side === 'W' ? 1 : PAD), y0 = sy - (side === 'S' ? 1 : PAD), y1 = sy + SHt - 1 + (side === 'N' ? 1 : PAD);
        if (!voidBox(x0, y0, x1, y1)) continue;
        const tiles = []; for (let j = sy; j < sy + SHt; j++) for (let i = sx; i < sx + SWd; i++) tiles.push([i, j]); gap.forEach(g_ => tiles.push(g_));
        const far = { N: [sx + 1, sy + 1], S: [sx + 1, sy + SHt - 2], W: [sx + 1, sy + 1], E: [sx + SWd - 3, sy + 1] }[side];
        const far2 = { N: [sx + SWd - 3, sy + 1], S: [sx + SWd - 3, sy + SHt - 2], W: [sx + 1, sy + SHt - 2], E: [sx + SWd - 3, sy + SHt - 2] }[side];
        secret = { side, x: sx, y: sy, w: SWd, h: SHt, gap, tiles, name: 'Cellule de maintenance', npc: { tx: sx + Math.floor(SWd / 2), ty: sy + Math.floor(SHt / 2) }, decor: [{ kind: 'console', tx: far[0], ty: far[1] }, { kind: 'console', tx: far2[0], ty: far2[1] }] };
        break search;
      }
    }
    for (const [id, zk] of Object.entries(def.fala.modules)) {   // la zone voulue d'abord, puis les autres : un Module ne doit jamais manquer
      let p = null, pk = zk; for (const k of [zk, ...zones.map((_, i) => i).filter(i => i !== zk && i !== last)]) { p = spot(k, k === zk ? 300 : 120); if (p) { pk = k; break; } }
      if (p) { reserve(p[0], p[1], 1, 1, 1); modules.push({ id, tx: p[0], ty: p[1], room: pk }); }
    }
  }
  const rooms = zones.map(z => ({ id: 'G' + z.k, x: z.cx - z.rx, y: z.cy - z.ry, w: 2 * z.rx, h: 2 * z.ry, zone: z.zone, name: z.name }));
  const bridge = new Uint8Array(MW * MH);   // tuiles de passage (hors des zones et de l'arène) : ponts sur l'eau
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (grid[y * MW + x] !== T.VOID && !inZone(x, y) && (x + 0.5 - arena.cx) ** 2 + (y + 0.5 - arena.cy) ** 2 > arena.r * arena.r) bridge[y * MW + x] = 1;
  if (F.canyons) bridge.fill(0);   // monde ouvert : seuls les ponts de gouffre sont en planches
  for (let i = 0; i < forced.length; i++) if (forced[i] && grid[i] !== T.VOID) bridge[i] = 1;
  return { rooms, decor, spawns, chests, arena, door, fog, bonfires, start, grid, roomOf, bridge, chasm, secret, modules };
}

// ---------- monde ----------
export function buildWorld(idx) {
  const def = MAPS[idx], th = THEMES[def.theme];
  const world = { idx, def, theme: th, name: def.name };
  const L = generateFree({ ...def, decorKinds: th.decor, free: { ...def.free, zones: def.free.zones.map(z => z.decor ? z : (zoneDecor(def.id, z.name) ? { ...z, decor: zoneDecor(def.id, z.name) } : z)) } });
  const cbox = new Map();   // collisions resserrées : index de tuile -> boîtes [cx, cy, hw, hh] (px) qui la touchent
  for (const d of L.decor) {
    const [w, h] = FOOT[d.kind], cb = COLBOX[d.kind];
    if (cb) {
      for (const [bx, by, hw, hh] of cb) {
        const cx = d.tx * TS + bx, cy = d.ty * TS + by, b = [cx, cy, hw, hh];
        for (let ty = Math.floor((cy - hh) / TS); ty <= Math.floor((cy + hh - 0.001) / TS); ty++) for (let tx = Math.floor((cx - hw) / TS); tx <= Math.floor((cx + hw - 0.001) / TS); tx++) { const k = ty * MW + tx; (cbox.get(k) || cbox.set(k, []).get(k)).push(b); }
      }
      continue;
    }
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) L.grid[(d.ty + j) * MW + d.tx + i] = T.SOLID;
  }
  for (const c of L.chests) L.grid[c.ty * MW + c.tx] = T.SOLID;
  for (const d of L.decor) { const [w, h] = FOOT[d.kind]; d.w = w; d.h = h; d.seed = (d.tx * 31 + d.ty * 17) % 97; }
  world.cbox = cbox;
  Object.assign(world, { grid: L.grid, roomOf: L.roomOf, bridge: L.bridge || null, chasm: L.chasm || null, rooms: L.rooms, decor: L.decor, spawns: L.spawns, arena: L.arena, door: L.door, fog: L.fog, bonfires: L.bonfires, start: L.start, chests: L.chests.map((c, i) => ({ ...c, id: i })), secret: L.secret ? { ...L.secret, opened: false } : null, modules: L.modules || [] });
  computeWall(world);
  markArenaRing(world);
  return world;
}
// Arène ronde : le bord de l'arène suit un vrai cercle de rayon rc, au rendu (HD-2D) comme aux collisions.
// flag 1 : sol d'arène gouverné par le cercle ; flag 2 : vide de l'anneau autour (franchissable à l'intérieur du cercle).
// L'entrée (sol du couloir et ses voisins) garde les règles de la grille.
export const ARENA_RC = 0.25;   // le cercle passe à r + 0,25 tuile : même surface jouable que l'arène en cases
function markArenaRing(world) {
  const a = world.arena; if (!a) { world.arenaRing = null; return; }
  const g = world.grid, rc = a.r + ARENA_RC, flag = new Uint8Array(MW * MH);
  const inMap = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
  const dc = (x, y) => Math.hypot(x + 0.5 - a.cx, y + 0.5 - a.cy);
  const walk = (x, y) => inMap(x, y) && !isSolidTile(world, x, y);
  const corr = (x, y) => walk(x, y) && dc(x, y) > a.r;   // sol hors du cercle : le couloir d'entrée
  const nearCorr = (x, y) => { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (corr(x + i, y + j)) return true; return false; };
  const y0 = Math.max(0, Math.floor(a.cy - a.r - 4)), y1 = Math.min(MH - 1, Math.ceil(a.cy + a.r + 4)), x0 = Math.max(0, Math.floor(a.cx - a.r - 4)), x1 = Math.min(MW - 1, Math.ceil(a.cx + a.r + 4));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const d = dc(x, y), v = g[y * MW + x];
    if (d <= a.r && walk(x, y) && !nearCorr(x, y)) flag[y * MW + x] = 1;
    else if (v === T.VOID && d > a.r && d < a.r + 2.6 && !nearCorr(x, y) && !(world.chasm && world.chasm[y * MW + x])) flag[y * MW + x] = 2;
  }
  world.arenaRing = { rc, flag };
}
// masque de murs : vide adjacent (8 voisins) à du sol
function computeWall(world) {
  const wall = new Uint8Array(MW * MH), g = world.grid;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (g[y * MW + x] !== T.VOID) continue;
    let near = false;
    for (let j = -1; j <= 1 && !near; j++) for (let i = -1; i <= 1; i++) { const nx = x + i, ny = y + j; if (nx >= 0 && ny >= 0 && nx < MW && ny < MH && g[ny * MW + nx] !== T.VOID) { near = true; break; } }
    wall[y * MW + x] = near ? 1 : 0;
  }
  world.wall = wall;
}
// Quête de Fala : brise le faux mur, la salle secrète apparaît (sol, décor, nom de zone). Renvoie false si déjà ouverte ou absente.
export function openSecret(world) {
  const s = world.secret; if (!s || s.opened) return false; s.opened = true;
  for (const [x, y] of s.tiles) world.grid[y * MW + x] = T.FLOOR;
  const ri = world.rooms.length; world.rooms.push({ id: 'SF', x: s.x, y: s.y, w: s.w, h: s.h, zone: 'Lisière', name: s.name });
  for (const [x, y] of s.tiles) world.roomOf[y * MW + x] = ri;
  for (const d of s.decor) { const [w, h] = FOOT[d.kind]; world.decor.push({ kind: d.kind, tx: d.tx, ty: d.ty, w, h, room: ri, seed: (d.tx * 31 + d.ty * 17) % 97 }); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) world.grid[(d.ty + j) * MW + d.tx + i] = T.SOLID; }
  computeWall(world);
  return true;
}

// couloirs sans nom : on cherche la salle nommée la plus proche pour la bannière
export function zoneAt(world, px, py) {
  const tx = Math.floor(px / TS), ty = Math.floor(py / TS);
  if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return null;
  const a = world.arena;
  if ((tx + 0.5 - a.cx) ** 2 + (ty + 0.5 - a.cy) ** 2 <= a.r * a.r) return { zone: 'Sanctuaire', area: world.def.sanctuary };
  const ri = world.roomOf[ty * MW + tx];
  if (ri < 0) return null;
  const r = world.rooms[ri];
  return r.name ? { zone: r.zone, area: r.name } : null;
}
export function inArena(world, px, py) { const dx = px / TS - world.arena.cx, dy = py / TS - world.arena.cy; return dx * dx + dy * dy <= world.arena.r * world.arena.r; }

function isSolidTile(world, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return true;
  const g = world.grid[ty * MW + tx];
  return g === T.VOID || g === T.SOLID || g === T.DOOR || g === T.FOG;
}
// Collision d'un point (en pixels), y compris la face avant des murs
export function solidAt(world, px, py) {
  const ob = world.obs;
  if (ob) for (let i = 0; i < ob.length; i++) { const o = ob[i]; if (o.on && o.solid && !o.dead && Math.abs(px - o.x) < o.hw && Math.abs(py - o.y) < o.hh) return true; }
  const tx = Math.floor(px / TS), ty = Math.floor(py / TS);
  const cb = world.cbox && world.cbox.get(ty * MW + tx);   // décors à collision resserrée (tronc, pied de lanterne)
  if (cb) for (let i = 0; i < cb.length; i++) { const b = cb[i]; if (Math.abs(px - b[0]) < b[2] && Math.abs(py - b[1]) < b[3]) return true; }
  const ar = world.arenaRing;
  if (ar && tx >= 0 && ty >= 0 && tx < MW && ty < MH && ar.flag[ty * MW + tx]) { const dx = px / TS - world.arena.cx, dy = py / TS - world.arena.cy; return dx * dx + dy * dy > ar.rc * ar.rc; }   // arène : vrai cercle
  if (isSolidTile(world, tx, ty)) return true;
  const ly = py - ty * TS;
  if (ly < FACE && ty > 0 && world.grid[(ty - 1) * MW + tx] === T.VOID) return true;
  return false;
}
export function boxFree(world, x, y, hw, hh) { return !(solidAt(world, x - hw, y - hh) || solidAt(world, x + hw, y - hh) || solidAt(world, x - hw, y + hh) || solidAt(world, x + hw, y + hh)); }
export function lineClear(world, x0, y0, x1, y1) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 8);
  for (let i = 1; i < n; i++) { const t = i / n; if (solidAt(world, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false; }
  return true;
}

// ---------- rendu du sol (mis en cache) ----------
// Tuile de sol pixel art : clé '<thème>:<rôle>' (arena, lab, floor ; s0 dalles, s1 briques/prairie, s2 planches, br pont pour les jardins).
// ---------- identité des zones (js/zones.js) ----------
// profil de la zone d'une case (null hors zone nommée), mis en cache par monde
function zoneAt2(world, tx, ty) {
  if (!world._zs) world._zs = world.rooms.map(r => zoneStyle(world.def.id, r.name));
  const ri = world.roomOf[ty * MW + tx]; return ri >= 0 ? world._zs[ri] : null;
}
// tirage d'une variante de tuile avec les facteurs de la zone (st.t), poids cumulés mis en cache par profil et par jeu de tuiles
function zonePick(m, st, q) {
  const c = st._pk || (st._pk = {});
  let e = c[m.i0];
  if (!e) {
    const cnt = {}; for (const j of m.pick) cnt[j] = (cnt[j] || 0) + 1;
    const idx = [], cum = []; let tot = 0;
    for (const j of Object.keys(cnt)) { const w = cnt[j] * (st.t[m.names[j]] ?? 1); if (w <= 0) continue; tot += w; idx.push(+j); cum.push(tot); }
    e = c[m.i0] = { idx, cum, tot };
  }
  if (!e.idx.length) return m.pick[0];
  const v = q * e.tot; let k = 0; while (k < e.idx.length - 1 && v > e.cum[k]) k++;
  return e.idx[k];
}
// voile de teinte par zone : une image d'une case par pixel, agrandie en lissé pour fondre les frontières entre zones
function tintZones(g, world) {
  let any = false; const c = document.createElement('canvas'); c.width = MW; c.height = MH; const cg = c.getContext('2d'), im = cg.createImageData(MW, MH), a = world.arena;
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    if (world.grid[ty * MW + tx] === T.VOID) continue;
    if ((tx + 0.5 - a.cx) ** 2 + (ty + 0.5 - a.cy) ** 2 <= (a.r + 1) ** 2) continue;
    const st = zoneAt2(world, tx, ty); if (!st || !st.tint) continue;
    const o = (ty * MW + tx) * 4, t = st.tint; im.data[o] = t[0]; im.data[o + 1] = t[1]; im.data[o + 2] = t[2]; im.data[o + 3] = t[3] * 255; any = true;
  }
  if (!any) return;
  cg.putImageData(im, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(c, 0, 0, MW * TS, MH * TS);
}

function drawFloorTile(g, ge, world, th, tx, ty, x, y, inA, lab, edo, et, isBr) {
  const db = FLOOR.db; if (!db || !FLOOR.img) return false;
  const key = world.def.theme;
  let role = inA ? 'arena' : edo ? (isBr ? 'br' : 's' + et) : lab ? 'lab' : 'floor';
  let m = db.tiles[key + ':' + role]; if (!m && role === 'br') m = db.tiles[key + ':s2'];
  if (!m) return false;
  const st = zoneAt2(world, tx, ty), i = m.i0 + (st && st.t && !inA ? zonePick(m, st, rnd(tx, ty, 501)) : m.pick[Math.floor(rnd(tx, ty, 501) * m.pick.length) % m.pick.length]), sx = (i % db.cols) * db.ts, sy = Math.floor(i / db.cols) * db.ts;
  g.imageSmoothingEnabled = false; g.drawImage(FLOOR.img, sx, sy, db.ts, db.ts, x, y, TS, TS);
  if (FLOOR.eimg) { ge.imageSmoothingEnabled = true; ge.drawImage(FLOOR.eimg, sx, sy, db.ts, db.ts, x, y, TS, TS); }
  return true;
}

// Décors de sol pixel art (assets/floor.json : decals, runs) : débris, flaques, os, pétales… tirés par graine fixe, jamais sous un décor, un coffre, l'arène ni un pont ; câbles continus (labo, centrale).
function stampFloorDecals(g, ge, world, th) {
  const db = FLOOR.db, key = world.def.theme; if (!db || !FLOOR.dimg) return;
  const list = (db.decals || {})[key] || [], runs = (db.runs || {})[key], A = world.arena;
  const used = new Uint8Array(MW * MH);
  for (const d of world.decor || []) for (let j = 0; j < d.h; j++) for (let i = 0; i < d.w; i++) used[(d.ty + j) * MW + d.tx + i] = 1;
  for (const c of world.chests || []) used[c.ty * MW + c.tx] = 1;
  for (const b of world.bonfires || []) used[(b.ty | 0) * MW + (b.tx | 0)] = 1;
  const ok = (tx, ty) => tx > 0 && ty > 0 && tx < MW - 1 && ty < MH - 1 && world.grid[ty * MW + tx] === T.FLOOR && !used[ty * MW + tx] && !(world.bridge && world.bridge[ty * MW + tx]) && (tx + 0.5 - A.cx) ** 2 + (ty + 0.5 - A.cy) ** 2 > (A.r + 0.5) ** 2;
  const nearWall = (tx, ty) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const v = world.grid[(ty + dy) * MW + tx + dx]; return v === T.VOID || v === T.SOLID; });
  const blit = (r, x, y) => { g.imageSmoothingEnabled = false; g.drawImage(FLOOR.dimg, r[0], r[1], r[2], r[3], x | 0, y | 0, r[2], r[3]); if (FLOOR.deimg) { ge.imageSmoothingEnabled = true; ge.drawImage(FLOOR.deimg, r[0], r[1], r[2], r[3], x | 0, y | 0, r[2], r[3]); } };
  // câbles continus : tronçons rectilignes entre deux orifices, sur des tuiles libres consécutives
  if (runs) {
    const ncol = Math.max(...Object.keys(runs).map(k => +k.split(':')[0])) + 1;
    for (let ty = 2; ty < MH - 2; ty++) for (let tx = 2; tx < MW - 2; tx++) {
      for (const vert of [false, true]) {
        const zs = zoneAt2(world, tx, ty); if (rnd(tx, ty, vert ? 641 : 631) > 0.012 * (zs && zs.runs || 1)) continue;
        const len = 3 + Math.floor(rnd(tx, ty, 651) * 6), col = Math.floor(rnd(tx, ty, 661) * ncol), o = 6 + Math.floor(rnd(tx, ty, 671) * 12), tag = vert ? 'v' : 'h';
        let good = true; for (let i = 0; i < len; i++) { const a = vert ? tx : tx + i, b = vert ? ty + i : ty; if (!ok(a, b)) { good = false; break; } }
        if (!good) continue;
        for (let i = 0; i < len; i++) {
          const a = vert ? tx : tx + i, b = vert ? ty + i : ty; used[b * MW + a] = 1;
          const part = i === 0 ? (vert ? 'endR' : 'endL') : i === len - 1 ? (vert ? 'endL' : 'endR') : 'mid';   // vertical : la pièce droite devient le haut après rotation
          const r = runs[`${col}:${tag}:${part}`]; if (r) blit(r, a * TS + (vert ? o - r[2] / 2 : 0), b * TS + (vert ? 0 : o - r[3] / 2));
        }
      }
    }
  }
  if (!list.length) return;
  for (let ty = 1; ty < MH - 1; ty++) for (let tx = 1; tx < MW - 1; tx++) {
    if (!ok(tx, ty)) continue;
    const nw = nearWall(tx, ty);
    const st = zoneAt2(world, tx, ty);
    if (rnd(tx, ty, 601) > (nw ? 0.16 : 0.05) * (st && st.dens || 1)) continue;
    const zd = st && st.d; let tot = 0; const ws = list.map(d => { const f = zd ? (zd[d.n.replace(/\d+$/, '')] ?? 1) : 1, w = f * (d.near === 2 ? (nw ? d.w * 2 : 0) : d.near === 1 ? (nw ? d.w * 3 : d.w * 0.4) : d.w); tot += w; return w; });
    if (tot <= 0) continue;
    let q = rnd(tx, ty, 611) * tot, k = 0; while (k < ws.length - 1 && q > ws[k]) { q -= ws[k]; k++; }
    const r = list[k].r, x = tx * TS + (TS - r[2]) / 2 + (rnd(tx, ty, 621) - 0.5) * Math.max(0, 14 - r[2] / 2), y = ty * TS + (TS - r[3]) / 2 + (rnd(tx, ty, 622) - 0.5) * Math.max(0, 14 - r[3] / 2);
    const x0 = Math.floor(x / TS), x1 = Math.floor((x + r[2] - 1) / TS), y0 = Math.floor(y / TS), y1 = Math.floor((y + r[3] - 1) / TS);
    if (!ok(x0, y0) || !ok(x1, y0) || !ok(x0, y1) || !ok(x1, y1)) continue;
    blit(r, x, y); if (r[2] > 14 || r[3] > 14) used[ty * MW + tx] = 1;
  }
}

export function bakeFloor(world) {
  const th = world.theme, c = document.createElement('canvas'); c.width = MW * TS; c.height = MH * TS;
  const g = c.getContext('2d');
  // masque d'émission (demi-résolution) : lignes de circuit, veines de lave, anneaux d'arène… utilisé par le rendu HD-2D
  const ec = document.createElement('canvas'); ec.width = MW * TS / 2; ec.height = MH * TS / 2; const ge = ec.getContext('2d'); ge.scale(0.5, 0.5); c.emis = ec;
  g.fillStyle = '#05060c'; g.fillRect(0, 0, c.width, c.height);
  const ac = rgb(th.accent), ac2 = rgb(th.accent2);
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    const v = world.grid[ty * MW + tx];
    if (v === T.VOID) continue;
    const x = tx * TS, y = ty * TS, r = rnd(tx, ty);
    const a = world.arena, inA = (tx + 0.5 - a.cx) ** 2 + (ty + 0.5 - a.cy) ** 2 <= a.r * a.r;
    const ri = world.roomOf[ty * MW + tx];
    const lab = th.floorLab && ri >= 0 && world.rooms[ri] && (world.rooms[ri].id === 'G2' || world.rooms[ri].id === 'G6');
    const base = inA ? th.arena : lab ? th.floorLab : th.floor;
    const k = ((tx + ty) & 1) ? 6 : 0;
    const vn = (px, py) => { const ix = Math.floor(px), iy = Math.floor(py), fx0 = px - ix, fy0 = py - iy, sm = t => t * t * (3 - 2 * t), a0 = rnd(ix, iy), b0 = rnd(ix + 1, iy), c0 = rnd(ix, iy + 1), d0 = rnd(ix + 1, iy + 1), top = a0 + (b0 - a0) * sm(fx0), bot = c0 + (d0 - c0) * sm(fx0); return top + (bot - top) * sm(fy0); };
    // ville d'Edo : dalles de pierre, briques et planchers de bois répartis en grandes plaques
    const edo = th.fx === 'garden' && !inA;
    const et0 = edo ? (() => { const z = vn(tx / 6 + 3, ty / 6) * 0.75 + vn(tx / 2.4, ty / 2.4 + 5) * 0.25; return z < 0.48 ? 0 : z < 0.72 ? 1 : 2; })() : 0;
    const isBr = !!(edo && th.bridgeCol && world.bridge && world.bridge[ty * MW + tx]);
    const et = isBr ? 2 : et0;
    const ebase = edo ? (isBr ? th.bridgeCol : (th.edo || [[120, 112, 100], [128, 94, 78], [122, 88, 58]])[et]) : null;
    const fb = ebase || base;
    // tuile pixel art (assets/floor.json) : joints, plaques, grilles, mousse… ; sinon repli sur le dessin procédural ci-dessous
    const drew = drawFloorTile(g, ge, world, th, tx, ty, x, y, inA, lab, edo, et, isBr);
    if (!drew) {
      g.fillStyle = `rgb(${fb[0] + k + r * 6 | 0},${fb[1] + k + r * 6 | 0},${fb[2] + k + r * 8 | 0})`;
      g.fillRect(x, y, TS, TS);
      g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x, y + TS - 1, TS, 1); g.fillRect(x + TS - 1, y, 1, TS);
      g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x, y, TS, 1); g.fillRect(x, y, 1, TS);
    }
    const fx = drew ? null : th.fx;
    if (fx === 'circuit') {
      if (r > 0.82) { g.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 3; i < TS - 3; i += 4) g.fillRect(x + 4, y + i, TS - 8, 1); }
      if (r < 0.14) { g.strokeStyle = inA ? 'rgba(190,120,255,.55)' : `rgba(${th.accent},.45)`; g.lineWidth = 1; g.beginPath(); const aa = 4 + (r * 100 % 12) | 0; g.moveTo(x, y + aa); g.lineTo(x + 10, y + aa); g.lineTo(x + 10, y + 16); g.lineTo(x + TS, y + 16); g.stroke(); g.fillStyle = inA ? '#d0a0ff' : ac; g.fillRect(x + 9, y + aa - 1, 3, 3);
        ge.strokeStyle = inA ? '#d0a0ff' : ac; ge.lineWidth = 1; ge.beginPath(); ge.moveTo(x, y + aa); ge.lineTo(x + 10, y + aa); ge.lineTo(x + 10, y + 16); ge.lineTo(x + TS, y + 16); ge.stroke(); ge.fillStyle = '#fff'; ge.fillRect(x + 9, y + aa - 1, 3, 3); }
      if (r > 0.6 && r < 0.64) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(x + 6, y + 8, 10, 6); }
    } else if (fx === 'ice') {
      if (r < 0.22) { g.strokeStyle = 'rgba(220,245,255,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 3, y + 4 + r * 20); g.lineTo(x + 12, y + 12); g.lineTo(x + 20, y + 8 + r * 10); g.stroke(); }
      if (r > 0.9) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 6 + r * 10 % 10, y + 6, 2, 2); ge.fillStyle = '#9fe8ff'; ge.fillRect(x + 6 + r * 10 % 10, y + 6, 2, 2); }
      if (r > 0.5 && r < 0.56) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 3, y + 3, TS - 6, TS - 6); }
    } else if (fx === 'lava') {
      if (r < 0.2) { g.strokeStyle = `rgba(${th.accent},.7)`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + 2, y + 6 + r * 30); g.lineTo(x + 9, y + 12); g.lineTo(x + 14, y + 10 + r * 20); g.lineTo(x + 22, y + 16); g.stroke();
        ge.strokeStyle = ac; ge.lineWidth = 1.5; ge.beginPath(); ge.moveTo(x + 2, y + 6 + r * 30); ge.lineTo(x + 9, y + 12); ge.lineTo(x + 14, y + 10 + r * 20); ge.lineTo(x + 22, y + 16); ge.stroke(); }
      if (r > 0.88) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 4 + r * 8 % 8, y + 8, 6, 4); }
    } else if (fx === 'stone') {
      if (r < 0.3) { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x + 3 + r * 30 % 12, y + 5, 5, 3); g.fillRect(x + 12, y + 14 + r * 10 % 6, 4, 3); }
      if (r > 0.9) { g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(x + 6, y + 10, 8, 2); }
    } else if (fx === 'wood') {   // lattes de bois : joints décalés, clous, brûlures de foudre
      g.fillStyle = 'rgba(0,0,0,.30)'; g.fillRect(x, y + 8, TS, 1); g.fillRect(x, y + 16, TS, 1);
      g.fillStyle = 'rgba(0,0,0,.26)'; g.fillRect(x + 6 + (((tx * 7 + ty * 3) % 3) * 5), y, 1, 8); g.fillRect(x + 14 - (((tx + ty * 5) % 3) * 4), y + 9, 1, 7); g.fillRect(x + 4 + (((tx * 5 + ty) % 4) * 4), y + 17, 1, 7);
      g.fillStyle = 'rgba(255,225,170,.06)'; g.fillRect(x, y + 1, TS, 1); g.fillRect(x, y + 9, TS, 1);
      if (r > 0.86) { g.fillStyle = 'rgba(210,170,90,.5)'; g.fillRect(x + 3, y + 3, 1, 1); g.fillRect(x + TS - 4, y + 12, 1, 1); }
      if (r < 0.07) { g.strokeStyle = 'rgba(120,200,255,.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 4, y + 3); g.lineTo(x + 10, y + 10); g.lineTo(x + 8, y + 13); g.lineTo(x + 17, y + 21); g.stroke(); ge.strokeStyle = '#8fd0ff'; ge.lineWidth = 1; ge.beginPath(); ge.moveTo(x + 4, y + 3); ge.lineTo(x + 10, y + 10); ge.lineTo(x + 8, y + 13); ge.lineTo(x + 17, y + 21); ge.stroke(); }
    } else if (fx === 'garden') {   // l'arène est un lit de gravier ratissé ; ailleurs : dalles, briques ou planches
      if (th.meadow && !inA && et === 1) {   // clairière : herbe, fleurs et lucioles
        const pv = vn(tx / 3.2 + 11, ty / 3.2) * 18 + r * 5; g.fillStyle = `rgb(${64 + pv * 0.7 | 0},${100 + pv | 0},${50 + pv * 0.4 | 0})`; g.fillRect(x, y, TS, TS);
        for (let n = 0; n < 7; n++) { const q = rnd(tx * 7 + n, ty * 3 + n * 5); g.fillStyle = q < 0.5 ? 'rgba(36,74,34,.5)' : 'rgba(160,200,100,.4)'; g.fillRect(x + (q * 977 % 1) * (TS - 2), y + (q * 313 % 1) * (TS - 4), 1, 2 + (q * 51 % 2) | 0); }
        if (r > 0.955) { g.fillStyle = r > 0.98 ? '#f4eadc' : '#f2c860'; g.fillRect(x + 6 + r * 90 % 12, y + 6 + r * 70 % 12, 2, 2); }
      } else if (!inA && et === 0) {   // grandes dalles de pierre, joints décalés, mousse, fissures
        g.fillStyle = 'rgba(0,0,0,.30)'; g.fillRect(x, y + 12, TS, 1); g.fillRect(x + (((tx + ty) & 1) ? 7 : 16), y, 1, 12); g.fillRect(x + (((tx + ty) & 1) ? 17 : 6), y + 13, 1, 11);
        g.fillStyle = 'rgba(255,250,235,.08)'; g.fillRect(x, y + 1, TS, 1); g.fillRect(x, y + 13, TS, 1);
        if (r < 0.22) { g.fillStyle = 'rgba(86,128,64,.4)'; g.beginPath(); g.ellipse(x + 5 + r * 40 % 14, y + 8 + r * 25 % 10, 5, 3, 0, 0, 7); g.fill(); }
        if (r > 0.86 && r < 0.92) { g.strokeStyle = 'rgba(0,0,0,.38)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 3, y + 6); g.lineTo(x + 10, y + 11); g.lineTo(x + 14, y + 9); g.lineTo(x + 21, y + 17); g.stroke(); }
      } else if (!inA && et === 1) {   // briques en appareil décalé
        const o = ((tx + ty) & 1) ? 0 : 6;
        g.fillStyle = 'rgba(30,18,12,.42)'; g.fillRect(x, y + 7, TS, 1); g.fillRect(x, y + 15, TS, 1); g.fillRect(x, y + 23, TS, 1);
        for (const [ry, off] of [[0, o], [8, o + 6], [16, o]]) for (let bx = off - 12; bx < TS; bx += 12) if (bx >= 0) g.fillRect(x + bx, y + ry, 1, 7);
        g.fillStyle = 'rgba(255,225,190,.09)'; g.fillRect(x, y + 8, TS, 1); g.fillRect(x, y + 16, TS, 1); g.fillRect(x, y, TS, 1);
        if (r > 0.7) { g.fillStyle = r > 0.85 ? 'rgba(0,0,0,.14)' : 'rgba(255,200,150,.1)'; g.fillRect(x + (r * 91 % 2 | 0) * 12 + 1, y + 8 * (r * 33 % 3 | 0), 11, 7); }
      } else if (!inA) {   // plancher de bois (engawa) : lattes, nœuds
        g.fillStyle = 'rgba(0,0,0,.32)'; g.fillRect(x, y + 8, TS, 1); g.fillRect(x, y + 16, TS, 1);
        g.fillRect(x + 6 + (((tx * 7 + ty * 3) % 3) * 5), y, 1, 8); g.fillRect(x + 14 - (((tx + ty * 5) % 3) * 4), y + 9, 1, 7); g.fillRect(x + 4 + (((tx * 5 + ty) % 4) * 4), y + 17, 1, 7);
        g.fillStyle = 'rgba(255,225,170,.07)'; g.fillRect(x, y + 1, TS, 1); g.fillRect(x, y + 9, TS, 1); g.fillRect(x, y + 17, TS, 1);
        if (r > 0.88) { g.fillStyle = 'rgba(40,24,12,.4)'; g.beginPath(); g.ellipse(x + 8 + r * 30 % 10, y + 12, 2.5, 1.6, 0, 0, 7); g.fill(); }
      } else if (r > 0.7) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + r * 50 % 20, y + r * 70 % 20, 2, 1); }
      if (th.scorch && !inA && !isBr) {   // suie et fissures de braise
        if (r < 0.28) { g.fillStyle = 'rgba(0,0,0,.26)'; g.beginPath(); g.ellipse(x + 6 + r * 50 % 12, y + 8 + r * 33 % 8, 8, 5, 0, 0, 7); g.fill(); }
        else if (r > 0.3 && r < 0.335) { g.strokeStyle = 'rgba(255,120,40,.65)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + 3, y + 7 + r * 30 % 6); g.lineTo(x + 10, y + 12); g.lineTo(x + 15, y + 10); g.lineTo(x + 22, y + 17); g.stroke(); ge.strokeStyle = '#ff7a2a'; ge.lineWidth = 1.2; ge.beginPath(); ge.moveTo(x + 3, y + 7 + r * 30 % 6); ge.lineTo(x + 10, y + 12); ge.lineTo(x + 15, y + 10); ge.lineTo(x + 22, y + 17); ge.stroke(); }
      }
      if (th.water && isBr) { g.fillStyle = 'rgba(40,24,12,.35)'; g.fillRect(x, y + 11, TS, 1); }
      if (th.water && th.abyss) {   // Îles Tourbillon : ruines englouties — pierre sombre, algues, coraux, runes bleues discrètes (le sol reste sombre pour que les télégraphes se lisent)
        g.fillStyle = 'rgba(6,18,34,.32)'; g.fillRect(x, y, TS, TS);
        if (!isBr && !inA) {
          if (r < 0.3) { g.fillStyle = 'rgba(30,96,84,.45)'; g.beginPath(); g.ellipse(x + 6 + r * 50 % 14, y + 16 + r * 20 % 6, 7, 3, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(80,170,130,.3)'; for (let n = 0; n < 4; n++) g.fillRect(x + 3 + n * 5 + r * 9 % 3, y + 12 + (n & 1) * 2, 1, 5); }   // algues
          if (r > 0.38 && r < 0.43) { for (let n = 0; n < 5; n++) { g.fillStyle = n & 1 ? 'rgba(220,120,110,.75)' : 'rgba(240,170,140,.7)'; g.fillRect(x + 6 + n * 3, y + 14 - (n % 3) * 3, 2, 5 + (n % 3) * 3); } }   // corail
          if (r > 0.9 && r < 0.925) { g.strokeStyle = 'rgba(70,200,230,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 4, y + 12); g.lineTo(x + 12, y + 12); g.lineTo(x + 12, y + 6); g.moveTo(x + 12, y + 12); g.lineTo(x + 20, y + 18); g.stroke(); ge.strokeStyle = 'rgba(60,190,230,.5)'; ge.lineWidth = 1.2; ge.beginPath(); ge.moveTo(x + 4, y + 12); ge.lineTo(x + 12, y + 12); ge.lineTo(x + 12, y + 6); ge.moveTo(x + 12, y + 12); ge.lineTo(x + 20, y + 18); ge.stroke(); }   // glyphes atlantes
          if (r > 0.5 && r < 0.56) { g.fillStyle = 'rgba(210,230,220,.5)'; for (let n = 0; n < 3; n++) g.fillRect(x + 4 + (r * 100 + n * 7) % 16, y + 4 + (r * 70 + n * 5) % 16, 2, 1); }   // balanes
        }
        if (inA) { g.fillStyle = 'rgba(0,10,24,.18)'; g.fillRect(x, y, TS, TS); if (r > 0.93) { g.strokeStyle = 'rgba(70,200,230,.55)'; g.beginPath(); g.moveTo(x + 4, y + 12); g.lineTo(x + 20, y + 12); g.stroke(); ge.strokeStyle = 'rgba(60,190,230,.4)'; ge.beginPath(); ge.moveTo(x + 4, y + 12); ge.lineTo(x + 20, y + 12); ge.stroke(); } }
      }
      if (th.water && th.glowy) {   // Lac du Miroir : dalles mouillées, runes d'aube lumineuses, pétales et gouttes de rosée qui brillent
        if (!isBr && !inA) {
          const wet = g.createLinearGradient(x, y, x + TS, y + TS); wet.addColorStop(0, 'rgba(120,200,230,.16)'); wet.addColorStop(0.5, 'rgba(255,255,255,0)'); wet.addColorStop(1, 'rgba(90,170,210,.14)'); g.fillStyle = wet; g.fillRect(x, y, TS, TS);
          if (r < 0.2) { g.fillStyle = 'rgba(52,120,104,.38)'; g.beginPath(); g.ellipse(x + 5 + r * 60 % 14, y + 18 + r * 25 % 5, 6, 2.5, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(140,220,170,.22)'; g.fillRect(x + 4 + r * 60 % 14, y + 17, 5, 1); }   // algues et mousse humide
          if (r > 0.9 && r < 0.935) { g.strokeStyle = 'rgba(150,235,255,.85)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 4, y + 8); g.lineTo(x + 11, y + 12); g.lineTo(x + 14, y + 9); g.lineTo(x + 21, y + 16); g.stroke();
            ge.strokeStyle = '#7fe6ff'; ge.lineWidth = 1.6; ge.beginPath(); ge.moveTo(x + 4, y + 8); ge.lineTo(x + 11, y + 12); ge.lineTo(x + 14, y + 9); ge.lineTo(x + 21, y + 16); ge.stroke(); }   // veines d'eau lumineuses dans la pierre
          if (r > 0.935 && r < 0.95) { const cx0 = x + 12, cy0 = y + 12; for (const [rr, al] of [[8, .5], [5, .8]]) { g.strokeStyle = `rgba(160,235,255,${al * 0.7})`; g.lineWidth = 1; g.beginPath(); g.ellipse(cx0, cy0, rr, rr * 0.55, 0, 0, 7); g.stroke(); ge.strokeStyle = `rgba(130,225,255,${al})`; ge.beginPath(); ge.ellipse(cx0, cy0, rr, rr * 0.55, 0, 0, 7); ge.stroke(); } }   // ondes concentriques
          if (r > 0.6 && r < 0.64) { const px = x + 5 + r * 300 % 14, py = y + 6 + r * 170 % 12; g.fillStyle = 'rgba(250,190,212,.92)'; g.beginPath(); g.ellipse(px, py, 2.6, 1.5, r * 20, 0, 7); g.fill(); ge.fillStyle = 'rgba(255,170,205,.55)'; ge.beginPath(); ge.ellipse(px, py, 3.4, 2.2, r * 20, 0, 7); ge.fill(); }   // pétales de cerisier
        }
        if (!inA && r > 0.72 && r < 0.78) { const px = x + 4 + r * 211 % 16, py = y + 4 + r * 137 % 16; g.fillStyle = 'rgba(225,248,255,.8)'; g.fillRect(px, py, 2, 2); ge.fillStyle = 'rgba(170,235,250,.6)'; ge.beginPath(); ge.arc(px + 1, py + 1, 1.5, 0, 7); ge.fill(); }   // gouttes de rosée
      }
      if (!inA && r > 0.975) { g.fillStyle = 'rgba(232,184,84,.5)'; g.fillRect(x + 11, y + 11, 2, 2); ge.fillStyle = 'rgba(232,184,84,.6)'; ge.fillRect(x + 10.5, y + 10.5, 3, 3); }   // clous dorés qui accrochent la lumière des lanternes
    } else if (fx === 'moss') {
      if (r < 0.3) { g.fillStyle = 'rgba(90,200,120,.25)'; g.fillRect(x + 4 + r * 40 % 10, y + 6, 6, 4); g.fillRect(x + 14, y + 14, 5, 3); }
      if (r > 0.92) { g.fillStyle = ac; g.fillRect(x + 8 + r * 20 % 8, y + 8, 2, 2); ge.fillStyle = ac; ge.fillRect(x + 7.5 + r * 20 % 8, y + 7.5, 3, 3); }
    }
  }
  // anneaux de l'arène
  const A = world.arena; g.save(); g.translate(A.cx * TS, A.cy * TS); ge.save(); ge.translate(A.cx * TS, A.cy * TS);
  if (th.fx !== 'garden') for (const [rad, col, lw] of [[A.r * TS - 6, th.accent2, 2], [A.r * TS * 0.62, th.accent2, 1], [A.r * TS * 0.3, th.accent, 1]]) { g.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},.5)`; g.lineWidth = lw; g.beginPath(); g.arc(0, 0, rad, 0, Math.PI * 2); g.stroke(); ge.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},.5)`; ge.lineWidth = lw; ge.beginPath(); ge.arc(0, 0, rad, 0, Math.PI * 2); ge.stroke(); }
  g.strokeStyle = `rgba(${th.accent2[0]},${th.accent2[1]},${th.accent2[2]},.25)`; g.lineWidth = 1;
  if (th.fx !== 'garden') for (let i = 0; i < 12; i++) { const an = i * Math.PI / 6; g.beginPath(); g.moveTo(Math.cos(an) * A.r * TS * 0.3, Math.sin(an) * A.r * TS * 0.3); g.lineTo(Math.cos(an) * (A.r * TS - 6), Math.sin(an) * (A.r * TS - 6)); g.stroke(); }
  if (th.fx === 'garden') { g.strokeStyle = 'rgba(40,34,28,.55)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, A.r * TS - 5, 0, Math.PI * 2); g.stroke(); g.strokeStyle = 'rgba(255,250,235,.16)'; g.lineWidth = 1; g.lineWidth = 1; for (let k = 1; k < 10; k++) { g.beginPath(); g.arc(0, 0, k * (A.r * TS - 8) / 10, 0, Math.PI * 2); g.stroke(); } }
  if (th.glowy) {   // Lac du Miroir : disque de pierre gravé — dégradé de profondeur, anneaux biseautés, lotus aux huit pétales, reflets
    const R = A.r * TS, gr = g.createRadialGradient(0, 0, R * 0.1, 0, 0, R); gr.addColorStop(0, 'rgba(210,240,255,.16)'); gr.addColorStop(0.55, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,20,40,.42)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, 7); g.fill();
    for (const [rad, lw] of [[R - 4, 5], [R * 0.74, 3], [R * 0.46, 3]]) { g.strokeStyle = 'rgba(8,30,48,.55)'; g.lineWidth = lw; g.beginPath(); g.arc(0, 0, rad, 0, 7); g.stroke(); g.strokeStyle = 'rgba(200,235,250,.28)'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, rad - lw / 2 - 1, 0, 7); g.stroke(); g.strokeStyle = 'rgba(4,16,30,.5)'; g.beginPath(); g.arc(0, 0, rad + lw / 2 + 1, 0, 7); g.stroke(); }
    for (let i = 0; i < 8; i++) for (const [c, fill, rr, dd] of [[g, 'rgba(244,190,214,.22)', 1, 1]]) { c.save(); c.rotate(i * Math.PI / 4); c.fillStyle = fill; c.strokeStyle = c === g ? 'rgba(255,230,240,.4)' : 'rgba(255,190,225,.04)'; c.lineWidth = 1; c.beginPath(); c.ellipse(R * 0.3, 0, R * 0.17, R * 0.065, 0, 0, 7); c.fill(); c.stroke(); c.restore(); }
    g.fillStyle = 'rgba(210,245,255,.3)'; g.beginPath(); g.arc(0, 0, R * 0.08, 0, 7); g.fill(); ge.fillStyle = 'rgba(150,230,255,.05)'; ge.beginPath(); ge.arc(0, 0, R * 0.08, 0, 7); ge.fill();
    for (let i = 0; i < 24; i++) { const an = i * Math.PI / 12 + 0.1, d0 = R * (0.5 + (i % 3) * 0.14); g.fillStyle = 'rgba(60,130,110,.35)'; g.beginPath(); g.ellipse(Math.cos(an) * (R - 8), Math.sin(an) * (R - 8), 6, 3, an, 0, 7); g.fill(); }   // mousse au bord
  }
  if (th.abyss) {   // mosaïque atlante : anneaux, tridents et vagues gravés ; la lueur reste faible
    for (const [rad, lw, al] of [[A.r * TS - 5, 3, .32], [A.r * TS * 0.78, 2, .2], [A.r * TS * 0.5, 2, .22], [A.r * TS * 0.22, 2, .26]]) { g.strokeStyle = `rgba(90,210,235,${al})`; g.lineWidth = lw; g.beginPath(); g.arc(0, 0, rad, 0, Math.PI * 2); g.stroke(); ge.strokeStyle = `rgba(60,190,230,${al * 0.1})`; ge.lineWidth = lw; ge.beginPath(); ge.arc(0, 0, rad, 0, Math.PI * 2); ge.stroke(); }
    for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; for (const [c, w] of [[g, .5], [ge, .1]]) { c.save(); c.rotate(an); c.strokeStyle = `rgba(90,210,235,${w * 0.6})`; c.lineWidth = 2; c.beginPath(); c.moveTo(A.r * TS * 0.22, 0); c.lineTo(A.r * TS * 0.78, 0); c.moveTo(A.r * TS * 0.66, 0); c.lineTo(A.r * TS * 0.7, -9); c.moveTo(A.r * TS * 0.66, 0); c.lineTo(A.r * TS * 0.7, 9); c.stroke(); c.restore(); } }
  }
  g.restore(); ge.restore();
  tintZones(g, world);
  stampFloorDecals(g, ge, world, th);
  // ombres au pied des murs
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    if (world.grid[ty * MW + tx] === T.VOID) continue;
    const x = tx * TS, y = ty * TS;
    const up = ty > 0 && world.grid[(ty - 1) * MW + tx] === T.VOID;
    if (up) { const gr = g.createLinearGradient(0, y, 0, y + 18); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x, y, TS, 18); }
    const lf = tx > 0 && world.grid[ty * MW + tx - 1] === T.VOID, rt = tx < MW - 1 && world.grid[ty * MW + tx + 1] === T.VOID, dn = ty < MH - 1 && world.grid[(ty + 1) * MW + tx] === T.VOID;
    if (lf) { const gr = g.createLinearGradient(x, 0, x + 8, 0); gr.addColorStop(0, 'rgba(0,0,0,.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x, y, 8, TS); }
    if (rt) { const gr = g.createLinearGradient(x + TS, 0, x + TS - 8, 0); gr.addColorStop(0, 'rgba(0,0,0,.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x + TS - 8, y, 8, TS); }
    if (dn) { const gr = g.createLinearGradient(0, y + TS, 0, y + TS - 8); gr.addColorStop(0, 'rgba(0,0,0,.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x, y + TS - 8, TS, 8); }
  }
  // feuilles de momiji tombées au sol (quartier d'Edo) : par tas, surtout au pied des murs et des arbres ; les emplacements servent aussi aux rafales de vent
  if (th.fx === 'garden' && !th.water && !th.meadow) {
    const ember = world.def.theme === 'ember';   // Tour Brûlée : pas de momiji, des tas de suie, de cendre et de braises
    const LEAF = ['..#..', '#####', '.###.', '..#..', '..#..'], LC = ember ? ['#1c1917', '#2a2624', '#3a3430', '#524c46', '#7a746a', '#a8a296'] : ['#9e1019', '#b3121f', '#bf2a22', '#cc4a24', '#d9792a', '#d9a636'];
    const spots = []; world.leafSpots = spots;
    const near = (tx, ty) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const v = world.grid[(ty + dy) * MW + tx + dx]; return v === T.VOID || v === T.SOLID; });
    for (let ty = 1; ty < MH - 1; ty++) for (let tx = 1; tx < MW - 1; tx++) {
      if (world.grid[ty * MW + tx] !== T.FLOOR) continue;
      if (rnd(tx, ty, 811) > (near(tx, ty) ? 0.1 : 0.022)) continue;
      const cx = tx * TS + 4 + rnd(tx, ty, 812) * (TS - 8), cy = ty * TS + 4 + rnd(tx, ty, 813) * (TS - 8), n = 3 + Math.floor(rnd(tx, ty, 814) * 5);
      spots.push({ x: cx, y: cy });
      for (let i = 0; i < n; i++) {
        const lx = Math.round(cx + (rnd(tx, ty, 820 + i) - 0.5) * 22), ly = Math.round(cy + (rnd(tx, ty, 840 + i) - 0.5) * 14), col = LC[Math.floor(rnd(tx, ty, 860 + i) * LC.length)], fl = rnd(tx, ty, 880 + i);
        const small = rnd(tx, ty, 900 + i) < 0.35, rot = Math.floor(rnd(tx, ty, 920 + i) * 4);
        g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(lx + 1, ly + 3, small ? 3 : 4, 1);
        g.fillStyle = col; g.globalAlpha = 0.92;
        if (ember) {   // flocon de suie ou de cendre (3 × 3), parfois une braise qui couve
          const FL = [['.#.', '###', '.#.'], ['##.', '###', '.##'], ['#..', '###', '..#']][Math.floor(fl * 3) % 3];
          for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 3; xx++) if (FL[yy][xx] === '#' && !(small && xx === 2)) g.fillRect(lx + xx, ly + yy, 1, 1);
          if (rnd(tx, ty, 940 + i) < 0.16) { g.fillStyle = rnd(tx, ty, 960 + i) < 0.5 ? '#ff8a2a' : '#ffc24a'; g.fillRect(lx + 1, ly + 1, 1, 1); ge.fillStyle = '#ff7a1c'; ge.fillRect(lx, ly, 3, 3); g.fillStyle = col; }
        } else
        for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) if (LEAF[yy][xx] === '#' && !(small && (xx === 0 || xx === 4 || yy === 4))) {
          const ax = rot & 1 ? 4 - xx : xx, ay = rot & 2 ? 4 - yy : yy;
          g.fillRect(lx + (fl < 0.5 ? ax : ay), ly + (fl < 0.5 ? ay : ax), 1, 1);
        }
        g.globalAlpha = 1;
      }
    }
  }
  return c;
}

// ---------- murs (dessinés à chaque image, tuiles visibles seulement) ----------
export function drawWalls(ctx, world, cam, w, h, time) {
  const th = world.theme, ac = rgb(th.accent), ac2 = rgb(th.accent2);
  const x0 = Math.max(0, Math.floor(cam.x / TS) - 1), x1 = Math.min(MW - 1, Math.floor((cam.x + w) / TS) + 1);
  const y0 = Math.max(0, Math.floor(cam.y / TS) - 1), y1 = Math.min(MH - 1, Math.floor((cam.y + h) / TS) + 1);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const i = ty * MW + tx;
    if (!world.wall[i]) continue;
    const x = tx * TS, y = ty * TS, r = rnd(tx, ty, 3);
    ctx.fillStyle = r > 0.5 ? th.wallA : th.wallB; ctx.fillRect(x, y, TS, TS);
    ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(x, y, TS, 1);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x + TS - 1, y, 1, TS); ctx.fillRect(x, y + TS - 1, TS, 1);
    if (r < 0.2) { ctx.fillStyle = `rgba(${th.accent},.18)`; ctx.fillRect(x + 4, y + 10, TS - 8, 2); }
    const south = ty < MH - 1 ? world.grid[(ty + 1) * MW + tx] : T.VOID;
    if (south !== T.VOID) {
      const fy = y + TS;
      ctx.fillStyle = th.face; ctx.fillRect(x, fy, TS, FACE);
      ctx.fillStyle = th.faceTop; ctx.fillRect(x, fy, TS, 1);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x, fy + FACE - 2, TS, 2);
      const rr = rnd(tx, ty, 9);
      if (rr < 0.28) { const on = ((time * 2 + rr * 10) | 0) % 5 !== 0; ctx.fillStyle = on ? (rr < 0.12 ? ac : ac2) : 'rgba(0,0,0,.4)'; ctx.fillRect(x + 8, fy + 3, 8, 3); }
      else if (rr < 0.4) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x + 4, fy + 3, TS - 8, 1); ctx.fillRect(x + 4, fy + 6, TS - 8, 1); }
    }
  }
}

// ---------- décors (sprites procéduraux, triés par profondeur) ----------
export function decorBaseline(d) { return (d.ty + d.h) * TS; }
export function drawDecor(ctx, world, d, time, opened) {
  const th = world.theme, x = d.tx * TS, base = (d.ty + d.h) * TS, w = d.w * TS, ac = rgb(th.accent), ac2 = rgb(th.accent2);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x + w / 2, base - 3, w * 0.5, 5, 0, 0, 7); ctx.fill();
  const K = d.kind;
  // sprite du manifeste (assets/props.json) : clé par thème (ex. pillar_ice), puis clé générique ; chests : chest_open / chest_closed
  const pk = K === 'chest' ? pickProp(opened ? 'chest_open' : 'chest_closed', 'chest') : pickProp(K + '_' + world.def.theme, K + '_' + (th.propSet || th.fx), K);   // clé par thème (ex. pillar_plant), puis par effet, puis générique
  if (pk && drawProp(ctx, pk, x + w / 2, base - 2, time, d.seed * 0.37, d.seed || 0)) return;
  if (K === 'tank' || K === 'tankbroken') {
    const broken = K === 'tankbroken';
    ctx.fillStyle = '#4a5578'; ctx.fillRect(x + 4, base - 10, w - 8, 8); ctx.fillStyle = '#6a7699'; ctx.fillRect(x + 4, base - 10, w - 8, 2);
    const gx = x + 8, gw = w - 16, gy = base - 62;
    ctx.fillStyle = broken ? '#10182a' : '#134a58'; ctx.fillRect(gx, gy, gw, 52);
    if (!broken) {
      const g = ctx.createLinearGradient(gx, 0, gx + gw, 0); g.addColorStop(0, '#1d8b9c'); g.addColorStop(0.35, '#7af2e4'); g.addColorStop(1, '#136a7a');
      ctx.fillStyle = g; ctx.fillRect(gx + 1, gy + 6, gw - 2, 46);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(gx + 4, gy + 4, 2, 44);
      for (let i = 0; i < 4; i++) { const t = (time * 14 + i * 13 + d.seed) % 44; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(gx + 6 + (i * 9 + d.seed) % (gw - 12), gy + 50 - t, 2, 2); }
      ctx.fillStyle = 'rgba(40,120,140,.8)'; ctx.fillRect(gx, gy + 3, gw, 3);
    } else { ctx.strokeStyle = '#6a7699'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx + 6, gy); ctx.lineTo(gx + 14, gy + 20); ctx.lineTo(gx + 8, gy + 34); ctx.lineTo(gx + 20, gy + 52); ctx.stroke(); ctx.fillStyle = 'rgba(122,242,228,.25)'; ctx.fillRect(gx + 2, gy + 44, gw - 4, 8); }
    ctx.fillStyle = '#6a7699'; ctx.fillRect(x + 6, gy - 5, w - 12, 6); ctx.fillStyle = '#8b97b8'; ctx.fillRect(x + 6, gy - 5, w - 12, 2); ctx.fillStyle = '#34405e'; ctx.fillRect(x + 20, gy - 12, 8, 8);
  } else if (K === 'pillar') {
    const lite = th.fx === 'ice' ? ['#9cc4e8', '#c8e4ff', '#7aa0c8'] : th.fx === 'stone' ? ['#8a7a68', '#a89a86', '#6a5c4c'] : th.fx === 'lava' ? ['#6a3e38', '#8a5a4e', '#4a2a26'] : th.fx === 'moss' ? ['#4a7a6a', '#6aa08c', '#365a4e'] : th.fx === 'wood' ? ['#6a4a3a', '#8a6650', '#46302a'] : ['#7e89ad', '#9aa5c6', '#4d5780'];
    ctx.fillStyle = '#5a6488'; ctx.globalAlpha = 0.6; ctx.fillRect(x + 3, base - 6, w - 6, 6); ctx.globalAlpha = 1;
    ctx.fillStyle = lite[0]; ctx.fillRect(x + 6, base - 38, w - 12, 34); ctx.fillStyle = lite[1]; ctx.fillRect(x + 6, base - 38, 3, 34); ctx.fillStyle = lite[2]; ctx.fillRect(x + w - 10, base - 38, 4, 34);
    ctx.fillStyle = lite[2]; ctx.fillRect(x + 3, base - 42, w - 6, 6);
    const on = ((time * 1.5 + d.seed) | 0) % 6 !== 0; ctx.fillStyle = on ? ac2 : 'rgba(0,0,0,.4)'; ctx.fillRect(x + w / 2 - 1, base - 30, 2, 18);
  } else if (K === 'mirror') {
    ctx.fillStyle = '#3d4668'; ctx.fillRect(x + 1, base - 50, w - 2, 46); ctx.fillStyle = '#8b97b8'; ctx.fillRect(x + 1, base - 50, w - 2, 2);
    const g = ctx.createLinearGradient(x, base - 48, x + w, base - 6); g.addColorStop(0, '#273a6a'); g.addColorStop(0.5, '#6b8cd8'); g.addColorStop(1, '#2b2f66');
    ctx.fillStyle = g; ctx.fillRect(x + 4, base - 46, w - 8, 38);
    const gl = ((time * 20 + d.seed * 7) % 80) - 20; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x + 4 + (gl > 0 && gl < w - 10 ? gl : -50), base - 46, 3, 38);
    ctx.fillStyle = '#4d5780'; ctx.fillRect(x + 6, base - 4, w - 12, 4);
  } else if (K === 'console') {
    ctx.fillStyle = '#3d4668'; ctx.fillRect(x + 2, base - 14, w - 4, 12); ctx.fillStyle = '#6a7699'; ctx.fillRect(x + 2, base - 14, w - 4, 2);
    ctx.fillStyle = '#10142a'; ctx.fillRect(x + 6, base - 32, w - 12, 18); ctx.fillStyle = '#4dffa0'; for (let i = 0; i < 4; i++) ctx.fillRect(x + 9, base - 29 + i * 4, 6 + ((time * 6 + i * 3 + d.seed) | 0) % 18, 2);
  } else if (K === 'rock') {
    const c1 = th.fx === 'ice' ? ['#8fb4d8', '#bfe0ff', '#6a8cb0'] : th.fx === 'lava' ? ['#4a2c28', '#6a423a', '#2e1a18'] : ['#7a6e62', '#9a8c7c', '#54483e'];
    ctx.fillStyle = c1[2]; ctx.beginPath(); ctx.moveTo(x + 2, base - 3); ctx.lineTo(x + 5, base - 20); ctx.lineTo(x + 12, base - 27); ctx.lineTo(x + 19, base - 18); ctx.lineTo(x + 22, base - 3); ctx.fill();
    ctx.fillStyle = c1[0]; ctx.beginPath(); ctx.moveTo(x + 5, base - 4); ctx.lineTo(x + 7, base - 19); ctx.lineTo(x + 12, base - 25); ctx.lineTo(x + 13, base - 4); ctx.fill();
    ctx.fillStyle = c1[1]; ctx.fillRect(x + 8, base - 22, 3, 2);
  } else if (K === 'crystal') {
    const pulse = 0.7 + 0.3 * Math.sin(time * 2 + d.seed);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x + 4, base - 5, w - 8, 4);
    ctx.fillStyle = `rgba(${th.accent},${0.55 * pulse + 0.3})`; ctx.beginPath(); ctx.moveTo(x + 12, base - 44); ctx.lineTo(x + 18, base - 20); ctx.lineTo(x + 15, base - 4); ctx.lineTo(x + 8, base - 4); ctx.lineTo(x + 6, base - 22); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(x + 12, base - 44); ctx.lineTo(x + 10, base - 22); ctx.lineTo(x + 8, base - 8); ctx.lineTo(x + 11, base - 22); ctx.fill();
    ctx.fillStyle = `rgba(${th.accent2},.5)`; ctx.beginPath(); ctx.moveTo(x + 18, base - 24); ctx.lineTo(x + 22, base - 12); ctx.lineTo(x + 18, base - 4); ctx.fill();
  } else if (K === 'brazier') {
    ctx.fillStyle = '#3a2c28'; ctx.fillRect(x + 7, base - 16, 10, 14); ctx.fillStyle = '#5a463e'; ctx.fillRect(x + 4, base - 22, 16, 6); ctx.fillStyle = '#2a1e1a'; ctx.fillRect(x + 4, base - 4, 16, 3);
    for (let i = 0; i < 4; i++) { const t = time * 7 + i * 1.9 + d.seed, hh = 8 + Math.sin(t) * 3; ctx.fillStyle = i % 2 ? '#ff9a2e' : '#ffd36a'; ctx.beginPath(); ctx.ellipse(x + 8 + i * 3, base - 26 - hh / 2, 2.2, hh / 2, 0, 0, 7); ctx.fill(); }
  } else if (K === 'lantern') {   // tōrō : lanterne de pierre
    ctx.fillStyle = '#5c5a60'; ctx.fillRect(x + 5, base - 5, 14, 5); ctx.fillStyle = '#74727a'; ctx.fillRect(x + 5, base - 5, 14, 1);
    ctx.fillStyle = '#66646c'; ctx.fillRect(x + 9, base - 17, 6, 12); ctx.fillStyle = '#7e7c84'; ctx.fillRect(x + 9, base - 17, 2, 12);
    ctx.fillStyle = '#4c4a52'; ctx.fillRect(x + 6, base - 20, 12, 3);
    ctx.fillStyle = '#58565e'; ctx.fillRect(x + 6, base - 29, 12, 9);
    const fl = 0.75 + 0.25 * Math.sin(time * 9 + d.seed); ctx.fillStyle = `rgba(255,${190 + 30 * fl | 0},90,${0.85 + 0.15 * fl})`; ctx.fillRect(x + 9, base - 27, 6, 5);
    ctx.fillStyle = '#4a484f'; ctx.beginPath(); ctx.moveTo(x + 2, base - 29); ctx.lineTo(x + 22, base - 29); ctx.lineTo(x + 17, base - 36); ctx.lineTo(x + 7, base - 36); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6a6870'; ctx.fillRect(x + 7, base - 36, 10, 1); ctx.fillStyle = '#5c5a60'; ctx.fillRect(x + 11, base - 39, 2, 3);
  } else if (K === 'bell') {   // bonshō : cloche de bronze sous sa charpente
    ctx.fillStyle = '#4a3024'; ctx.fillRect(x + 3, base - 58, 5, 56); ctx.fillRect(x + w - 8, base - 58, 5, 56); ctx.fillStyle = '#6a4a38'; ctx.fillRect(x + 3, base - 58, 1, 56); ctx.fillRect(x + w - 8, base - 58, 1, 56);
    ctx.fillStyle = '#3a261c'; ctx.fillRect(x, base - 62, w, 6); ctx.fillStyle = '#6a4a38'; ctx.fillRect(x, base - 62, w, 1);
    ctx.fillStyle = '#2a1c14'; ctx.fillRect(x + w / 2 - 1, base - 56, 2, 6);
    const sw = Math.sin(time * 1.4 + d.seed) * 1.5, cx = x + w / 2 + sw;
    ctx.fillStyle = '#7c6034'; ctx.beginPath(); ctx.moveTo(cx - 6, base - 50); ctx.lineTo(cx + 6, base - 50); ctx.lineTo(cx + 11, base - 22); ctx.lineTo(cx - 11, base - 22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9a7a44'; ctx.fillRect(cx - 5, base - 49, 2, 26); ctx.fillStyle = '#56421f'; ctx.fillRect(cx + 5, base - 49, 2, 26);
    ctx.fillStyle = '#6a502a'; ctx.fillRect(cx - 12, base - 24, 24, 3); ctx.fillStyle = '#b08a4a'; ctx.fillRect(cx - 12, base - 24, 24, 1);
    ctx.fillStyle = '#4a361c'; for (const yy of [-40, -33]) ctx.fillRect(cx - 8, base + yy, 16, 1);
    ctx.fillStyle = '#5a3a28'; ctx.fillRect(x + 2, base - 12, w - 4, 3); ctx.fillStyle = '#3a261c'; ctx.fillRect(x + w / 2 - 3, base - 20, 6, 10);
    if (((time * 2 + d.seed) | 0) % 7 === 0) { ctx.strokeStyle = ac2; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - 3, base - 24); ctx.lineTo(cx, base - 30); ctx.lineTo(cx - 2, base - 33); ctx.lineTo(cx + 3, base - 40); ctx.stroke(); }
  } else if (K === 'torii') {   // portique de sanctuaire (laque rouge passée)
    const red = '#8f3a30', redH = '#b0503f', blk = '#241c1a';
    ctx.fillStyle = red; ctx.fillRect(x + 5, base - 46, 6, 44); ctx.fillRect(x + w - 11, base - 46, 6, 44);
    ctx.fillStyle = redH; ctx.fillRect(x + 5, base - 46, 1, 44); ctx.fillRect(x + w - 11, base - 46, 1, 44);
    ctx.fillStyle = blk; ctx.fillRect(x + 3, base - 4, 10, 3); ctx.fillRect(x + w - 13, base - 4, 10, 3);
    ctx.fillStyle = red; ctx.fillRect(x + 8, base - 36, w - 16, 4);
    ctx.fillStyle = blk; ctx.fillRect(x - 3, base - 52, w + 6, 4); ctx.fillStyle = '#3a2e2a'; ctx.fillRect(x - 6, base - 55, w + 12, 3); ctx.fillRect(x - 6, base - 58, 4, 3); ctx.fillRect(x + w + 2, base - 58, 4, 3);
    ctx.fillStyle = red; ctx.fillRect(x + w / 2 - 3, base - 48, 6, 12); ctx.fillStyle = '#d8b050'; ctx.fillRect(x + w / 2 - 2, base - 45, 4, 6);
  } else if (K === 'generator') {
    ctx.fillStyle = '#3a3a4c'; ctx.fillRect(x + 3, base - 36, w - 6, 32); ctx.fillStyle = '#5a5a74'; ctx.fillRect(x + 3, base - 36, w - 6, 3);
    ctx.fillStyle = '#26263a'; ctx.fillRect(x + 8, base - 28, w - 16, 14);
    const on = ((time * 3 + d.seed) | 0) % 4 !== 0; ctx.fillStyle = on ? ac : '#444'; ctx.fillRect(x + 11, base - 25, 6, 3); ctx.fillStyle = on ? '#6cf0e0' : '#444'; ctx.fillRect(x + 21, base - 25, 6, 3);
    ctx.strokeStyle = ac; ctx.lineWidth = 1.5; ctx.beginPath(); const zz = (time * 40 + d.seed) % 20; ctx.moveTo(x + 12, base - 20); ctx.lineTo(x + 18, base - 17 + zz % 3); ctx.lineTo(x + 24, base - 21); ctx.lineTo(x + 32, base - 17); ctx.stroke();
    ctx.fillStyle = '#26263a'; ctx.fillRect(x + w / 2 - 3, base - 46, 6, 10); ctx.fillStyle = on ? ac : '#555'; ctx.fillRect(x + w / 2 - 2, base - 48, 4, 3);
  } else if (K === 'tree') {
    ctx.fillStyle = '#4a3828'; ctx.fillRect(x + w / 2 - 4, base - 28, 8, 24); ctx.fillStyle = '#3a2a1e'; ctx.fillRect(x + w / 2 + 1, base - 28, 3, 24);
    for (const [ox, oy, rr, c] of (th.open ? [[-10, -42, 13, (th.leaf || [])[0] || '#9a2e28'], [8, -46, 14, (th.leaf || [])[1] || '#c0452a'], [0, -56, 13, (th.leaf || [])[2] || '#d8662e'], [-4, -36, 11, (th.leaf || [])[3] || '#7e2624']] : [[-10, -42, 13, '#2e7a5e'], [8, -46, 14, '#3a9a72'], [0, -56, 13, '#4ab08a'], [-4, -36, 11, '#2a6a52']])) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + w / 2 + ox, base + oy, rr, 0, 7); ctx.fill(); }
    const tw = 0.5 + 0.5 * Math.sin(time * 2 + d.seed); ctx.fillStyle = `rgba(${th.accent},${0.5 + 0.4 * tw})`; for (let i = 0; i < 4; i++) ctx.fillRect(x + 8 + i * 9 + d.seed % 5, base - 46 - (i % 2) * 8, 2, 2);
  } else if (K === 'statue') {
    ctx.fillStyle = '#5a7a76'; ctx.fillRect(x + 4, base - 8, w - 8, 8); ctx.fillStyle = '#7a9a96'; ctx.fillRect(x + 7, base - 34, w - 14, 28); ctx.fillStyle = '#9ab8b4'; ctx.fillRect(x + 7, base - 34, 3, 28);
    ctx.fillStyle = '#7a9a96'; ctx.beginPath(); ctx.arc(x + w / 2, base - 38, 6, 0, 7); ctx.fill(); ctx.fillStyle = ac; ctx.fillRect(x + w / 2 - 3, base - 40, 2, 2); ctx.fillRect(x + w / 2 + 1, base - 40, 2, 2);
  } else if (K === 'chest') {
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(x + 3, base - 16, w - 6, 13); ctx.fillStyle = '#7a5230'; ctx.fillRect(x + 3, base - 16, w - 6, 4);
    ctx.fillStyle = '#c8a440'; ctx.fillRect(x + 3, base - 12, w - 6, 2); ctx.fillRect(x + w / 2 - 2, base - 13, 4, 5);
    if (opened) { ctx.fillStyle = '#3a2412'; ctx.fillRect(x + 3, base - 24, w - 6, 8); ctx.fillStyle = 'rgba(255,230,140,.8)'; ctx.fillRect(x + 6, base - 18, w - 12, 3); }
    else { const gl = 0.5 + 0.5 * Math.sin(time * 3 + d.tx); ctx.fillStyle = `rgba(255,230,140,${0.35 * gl})`; ctx.fillRect(x + 2, base - 18, w - 4, 2); }
  }
}
export function decorLight(world, d, opened) {
  const th = world.theme; const A = th.accent;
  if (d.kind === 'tank') return { x: (d.tx + 1) * TS, y: (d.ty + 0.4) * TS, r: 62, c: [40, 190, 190] };
  if (d.kind === 'mirror') return { x: (d.tx + 0.5) * TS, y: (d.ty + 0.2) * TS, r: 36, c: [80, 110, 220] };
  if (d.kind === 'console') return { x: (d.tx + 1) * TS, y: (d.ty + 0.2) * TS, r: 36, c: [50, 200, 120] };
  if (d.kind === 'pillar') return { x: (d.tx + 0.5) * TS, y: (d.ty + 0.2) * TS, r: 26, c: th.accent2.map(v => v * 0.6 | 0) };
  if (d.kind === 'crystal') return { x: (d.tx + 0.5) * TS, y: (d.ty + 0.1) * TS, r: 54, c: A };
  if (d.kind === 'brazier') return { x: (d.tx + 0.5) * TS, y: (d.ty + 0.1) * TS, r: 70, c: [255, 150, 60] };
  if (d.kind === 'lantern') return { x: (d.tx + 0.5) * TS, y: (d.ty + 0.1) * TS, r: 74, c: [255, 190, 90] };
  if (d.kind === 'bell') return { x: (d.tx + 1) * TS, y: (d.ty + 0.4) * TS, r: 48, c: [130, 180, 255] };
  if (d.kind === 'generator') return { x: (d.tx + 1) * TS, y: (d.ty + 0.3) * TS, r: 50, c: A };
  if (d.kind === 'tree') return { x: (d.tx + 1) * TS, y: (d.ty + 0.2) * TS, r: 56, c: A };
  if (d.kind === 'statue') return { x: (d.tx + 0.5) * TS, y: (d.ty + 0.3) * TS, r: 28, c: th.accent2 };
  if (d.kind === 'chest' && !opened) return { x: (d.tx + 0.5) * TS, y: (d.ty + 0.4) * TS, r: 30, c: [255, 220, 120] };
  return null;
}
