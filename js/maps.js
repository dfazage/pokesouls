// Les cinq cartes du Chapitre Génération 1 (quatre cartes + une carte secrète) : définition, génération des salles, collisions et rendu du décor.
// Cartes 1, 2, 3, 4 et 6 : disposition générée (graine fixe). Carte 5 (Laboratoire oublié) : dessinée à la main.
// Dans toutes les cartes, l'arène du boss est au nord de la dernière salle : on y entre par le sud, le boss attend en face (arrivée frontale).
import { pickProp, drawProp } from './props.js';
export const TS = 24, MW = 124, MH = 64, FACE = 10;
export const T = { VOID: 0, FLOOR: 1, DOOR: 2, FOG: 3, SOLID: 4 };

const rgb = a => `rgb(${a[0]},${a[1]},${a[2]})`;
export const THEMES = {
  lab: { floor: [34, 40, 62], floorLab: [28, 40, 58], arena: [38, 30, 62], wallA: '#2c3452', wallB: '#2a3150', face: '#1c2038', faceTop: '#3a4468', accent: [80, 220, 200], accent2: [200, 140, 255], fx: 'circuit', amb: [150, 158, 200], ambArena: [115, 100, 160], decor: ['pillar', 'tank', 'console'] },
  ice: { floor: [64, 92, 130], arena: [70, 96, 150], wallA: '#5b7fa8', wallB: '#56799f', face: '#33507a', faceTop: '#9fc4e8', accent: [190, 240, 255], accent2: [140, 200, 255], fx: 'ice', amb: [170, 190, 235], ambArena: [140, 165, 235], decor: ['crystal', 'rock', 'pillar'] },
  plant: { floor: [58, 58, 70], arena: [66, 60, 56], wallA: '#444458', wallB: '#40405a', face: '#27273a', faceTop: '#62627c', accent: [255, 232, 80], accent2: [120, 230, 255], fx: 'circuit', amb: [160, 160, 180], ambArena: [150, 140, 150], decor: ['generator', 'pillar', 'console'] },
  lava: { floor: [66, 40, 38], arena: [78, 42, 34], wallA: '#5a3430', wallB: '#56302c', face: '#321a18', faceTop: '#8a5040', accent: [255, 130, 50], accent2: [255, 200, 90], fx: 'lava', amb: [200, 150, 130], ambArena: [210, 130, 100], decor: ['brazier', 'rock', 'crystal'] },
  rock: { floor: [72, 64, 58], arena: [86, 72, 52], wallA: '#5e5248', wallB: '#5a4e44', face: '#38302a', faceTop: '#8a7a68', accent: [255, 200, 110], accent2: [200, 170, 120], fx: 'stone', amb: [175, 165, 155], ambArena: [185, 160, 120], decor: ['rock', 'pillar', 'brazier'] },
  // Johto : Japon d'Edo (bois sombre, papier, laque, lanternes). Tour Carillon : jardins et cours d'un temple en plein air, sous l'orage
  bell: { floor: [112, 104, 92], arena: [138, 128, 110], wallA: '#6e675c', wallB: '#675f55', face: '#3a342e', faceTop: '#9a9080', accent: [255, 206, 96], accent2: [130, 200, 255], fx: 'garden', open: true, amb: [196, 184, 182], ambArena: [214, 190, 160], decor: ['lantern', 'tree', 'bell', 'torii', 'tree'] },
  mystic: { floor: [36, 68, 62], arena: [52, 50, 86], wallA: '#27494a', wallB: '#244446', face: '#142a2c', faceTop: '#3e7a76', accent: [255, 170, 230], accent2: [160, 255, 220], fx: 'moss', amb: [150, 180, 175], ambArena: [150, 130, 200], decor: ['tree', 'crystal', 'statue'] },
};

// ---------- définitions des cartes ----------
const KANTO = [
  { id: 'm1', name: 'Îles Écume', sub: 'Grottes gelées', theme: 'ice', mus: 1, lv: 8, seed: 11, boss: 'articuno',
    path: [[0, 2], [1, 2], [2, 2], [3, 2], [3, 1], [2, 1], [1, 1], [1, 0]],
    areas: ['Rivage gelé', 'Grotte des phoques', 'Bassin glacé', 'Galerie de givre', 'Caverne de cristal', 'Lac souterrain', 'Antichambre du blizzard'], sanctuary: "Nid d'Artikodin",
    mobs: { mini: ['seel', 'shellder', 'krabby'], mid: ['dewgong', 'starmie', 'cloyster'], big: 'lapras' },
    loot: ['candy', 'berrypack', 'hpup', 'ct_swift', 'protein', 'etherpack', 'ct_aquaring'], reward: ['ct_icebeam', 'candy'] },
  { id: 'm2', name: 'Centrale abandonnée', sub: 'Sous haute tension', theme: 'plant', mus: 2, lv: 15, seed: 23, boss: 'zapdos',
    path: [[3, 2], [2, 2], [1, 2], [0, 2], [0, 1], [1, 1], [2, 1], [2, 0]],
    areas: ['Hall des turbines', 'Salle des câbles', 'Atelier rouillé', 'Salle des générateurs', 'Couloir des relais', 'Poste de commande', 'Antichambre du transformateur'], sanctuary: "Cœur de la Centrale",
    mobs: { mini: ['magnemite', 'voltorb', 'pikachu'], mid: ['magneton', 'electrode', 'raichu'], big: 'electabuzz' },
    loot: ['candy', 'iron', 'ct_bodyslam', 'berrypack', 'calcium', 'maxberry', 'etherpack', 'ct_synthesis'], reward: ['ct_thunder', 'candy'], fala: { modules: { aqua: 1, pyro: 3, cryo: 5, choc: 6 }, hub: [1, 0] } },
  { id: 'm3', name: 'Mont Braise', sub: 'Le volcan vivant', theme: 'lava', mus: 3, lv: 22, seed: 37, boss: 'moltres',
    path: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2], [2, 1], [3, 1], [3, 0]],
    areas: ['Flanc du volcan', 'Tunnel de lave', 'Caverne de braise', 'Pont de basalte', 'Forge abandonnée', 'Grotte des cendres', 'Antichambre du magma'], sanctuary: "Cratère de Sulfura",
    mobs: { mini: ['vulpix', 'growlithe', 'ponyta'], mid: ['ninetales', 'rapidash', 'arcanine'], big: 'dragoniteK' },
    loot: ['candy', 'carbos', 'ct_hydro', 'berrypack', 'hpup', 'zinc', 'etherpack', 'revive'], reward: ['ct_fireblast', 'candy'] },
  { id: 'm5', name: 'Laboratoire oublié', sub: 'Là où Mewtwo est né', theme: 'lab', mus: 5, lv: 38, seed: 5, boss: 'mewtwo', manual: true, final: true,
    areas: [], sanctuary: 'Sanctuaire de Mewtwo',
    mobs: { mini: ['magnemite', 'koffing', 'voltorb'], mid: ['porygon', 'weezing'], big: 'electrodeA' },
    loot: ['candy', 'calcium', 'ct_psychic', 'etherpack', 'hpup', 'ct_teleport'], reward: ['ct_solar', 'candy'] },
  { id: 'm6', name: 'Île Mystère', sub: 'Le refuge de Mew', theme: 'mystic', mus: 6, lv: 45, seed: 59, boss: 'mew', secret: true,
    path: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [1, 1], [1, 0]],
    areas: ['Plage secrète', 'Bosquet lumineux', 'Clairière des rêves', 'Ruines couvertes de lierre', 'Jardin suspendu', 'Source scintillante', 'Antichambre du mythe'], sanctuary: 'Cœur de l’île',
    mobs: { mini: ['exeggcute', 'abra', 'haunter'], mid: ['kadabra', 'gengar', 'mrmime'], big: 'exeggutor' },
    loot: ['candy', 'protein', 'ct_softboiled', 'hpup', 'berrypack', 'maxberry', 'maxether', 'revive'], reward: ['ct_hyper', 'candy', 'candy'] },
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
      ].map((z, i) => i === 7 ? { ...z, zone: 'Lisière' } : z),
      links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 5], [5, 6], [0, 7]],
      door: [1, 6], arena: { cell: [1, 0], from: 6 }, bonfires: [0, 2, 6], big: 4, chests: [1, 2, 3, 4, 5, 7, 3],
    },
    areas: ['Escalier des lanternes', 'Cour des cloches', 'Jardin des ex-voto', 'Esplanade des tatamis', 'Allée de laque', 'Parvis du carillon', 'Antichambre du tonnerre'], sanctuary: 'Sanctuaire de Raikou',
    mobs: { mini: ['pichu', 'mareep', 'chinchou'], mid: ['flaaffy', 'lanturn', 'togetic'], big: 'ampharos' },
    loot: ['candy', 'berrypack', 'hpup', 'ct_swift', 'protein', 'etherpack', 'ct_earthquake'], reward: ['ct_thunder', 'candy'] },
];
export const CHAPTER_MAPS = { kanto: KANTO, johto: JOHTO };
export const CHAPTER_INFO = {
  kanto: { n: 'I', name: 'Kanto', gen: 1, sub: 'Quatre cartes et un secret, jusqu’à Mewtwo', world: 'assets/ui/worldmap.jpg', nodes: [[11.5, 58], [26, 23], [50.5, 63], [63, 38.5], [86, 18]] },
  johto: { n: 'II', name: 'Johto', gen: 2, sub: 'Trois bêtes, un sanctuaire marin et un temple hors du temps', world: 'assets/ui/worldmap.jpg', nodes: [[14, 62], [34, 28], [56, 66], [74, 36], [88, 14]] },
};
export const MAPS = [];
export let CHAPTER = 'kanto';
export function setChapter(id) { if (!CHAPTER_MAPS[id]) id = 'kanto'; CHAPTER = id; MAPS.length = 0; MAPS.push(...CHAPTER_MAPS[id]); return id; }
setChapter('kanto');

// ---------- aléatoire à graine ----------
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const rnd = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

const FOOT = { tank: [2, 2], tankbroken: [2, 2], pillar: [1, 1], mirror: [1, 1], console: [2, 1], rock: [1, 1], crystal: [1, 1], brazier: [1, 1], generator: [2, 2], tree: [2, 2], statue: [1, 1], chest: [1, 1], lantern: [1, 1], bell: [2, 2], torii: [2, 1] };

// ---------- carte du laboratoire (dessinée à la main) ----------
const LAB = (() => {
  const DY = 4;
  const R = [
    ['R0', 3, 38, 12, 9, 'Lisière', "Hall d'entrée"], ['C0', 15, 41, 9, 3, 'Lisière', null], ['R1', 24, 36, 11, 12, 'Lisière', "Salle d'observation"],
    ['C1', 28, 29, 3, 7, 'Cœur', null], ['R2', 20, 12, 30, 17, 'Cœur', 'Salle des cuves'], ['C2v', 9, 26, 3, 12, 'Cœur', null], ['C2h', 12, 26, 8, 3, 'Cœur', null],
    ['C3', 50, 19, 4, 3, 'Cœur', null], ['R3', 54, 15, 9, 10, 'Cœur', 'Salle de contrôle'], ['C5', 33, 8, 3, 4, 'Cœur', null], ['R4', 28, 0, 14, 8, 'Cœur', 'Chambre de clonage'],
    ['C4', 63, 18, 8, 3, 'Approche', null], ['R5', 71, 10, 16, 18, 'Approche', 'Galerie des miroirs'], ['C6v', 80, 28, 3, 11, 'Approche', null], ['C6h', 80, 36, 30, 3, 'Approche', null], ['R7', 109, 30, 9, 10, 'Approche', 'Antichambre'], ['C7', 112, 24, 3, 7, 'Sanctuaire', null],
  ].map(r => ({ id: r[0], x: r[1], y: r[2] + DY, w: r[3], h: r[4], zone: r[5], name: r[6] }));
  const decor = [['tank', 26, 15], ['tank', 26, 23], ['tank', 32, 19], ['tank', 38, 15], ['tank', 38, 23], ['tank', 44, 19], ['pillar', 27, 39], ['pillar', 32, 39], ['pillar', 27, 45], ['pillar', 32, 45],
    ['pillar', 6, 40], ['pillar', 12, 40], ['pillar', 6, 45], ['pillar', 12, 45], ['mirror', 75, 14], ['mirror', 75, 22], ['mirror', 82, 14], ['mirror', 82, 22], ['mirror', 79, 18],
    ['console', 57, 17], ['console', 59, 22], ['tankbroken', 31, 3], ['tankbroken', 37, 3], ['pillar', 29, 6], ['pillar', 40, 6], ['pillar', 111, 31], ['pillar', 116, 31], ['pillar', 111, 34], ['pillar', 116, 34]]
    .map(([kind, x, y]) => ({ kind, tx: x, ty: y + DY }));
  const spawns = [['magnemite', 28, 41], ['magnemite', 32, 44], ['koffing', 30, 38], ['koffing', 28, 18], ['koffing', 41, 21], ['koffing', 34, 27], ['voltorb', 24, 20], ['voltorb', 46, 25], ['voltorb', 31, 13], ['magnemite', 45, 14],
    ['koffing', 57, 21], ['koffing', 60, 17], ['electrodeA', 35, 4], ['porygon', 77, 18], ['porygon', 83, 19], ['weezing', 79, 12], ['magnemite', 84, 25], ['magnemite', 73, 25], ['koffing', 80, 22]]
    .map(([type, x, y]) => ({ type, tx: x, ty: y + DY }));
  return {
    rooms: R, decor, spawns, arena: { cx: 113, cy: 14 + DY, r: 10 }, // l'arène est au nord de l'antichambre : on y entre par le sud
    door: { tiles: [[9, 31 + DY], [10, 31 + DY], [11, 31 + DY]], dir: { x: 0, y: 1 } }, // s'ouvre depuis le côté nord
    fog: { tiles: [[112, 26 + DY], [113, 26 + DY], [114, 26 + DY]], dir: { x: 0, y: -1 } },
    bonfires: [{ id: 'b1', name: "Hall d'entrée", tx: 8, ty: 42 + DY }, { id: 'b2', name: 'Salle de contrôle', tx: 58, ty: 20 + DY }, { id: 'b3', name: 'Antichambre', tx: 113, ty: 34 + DY }],
    start: { tx: 8, ty: 44 + DY },
    chests: [[5, 41], [40, 2], [61, 22], [84, 14], [114, 32], [22, 26]].map(([x, y]) => ({ tx: x, ty: y + DY })),
  };
})();

// ---------- génération des cartes à salles ----------
function generate(def) {
  const R = rng(def.seed);
  const cw = 31, ch = 21, ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const rooms = [];
  const path = def.path;
  for (let i = 0; i < 7; i++) {
    const [cx, cy] = path[i], ox = cx * cw, oy = cy * ch;
    let w = i === 0 ? ri(12, 15) : i === 6 ? ri(13, 17) : ri(14, 24), h = i === 0 ? ri(9, 11) : ri(10, 15);
    w = Math.min(w, cw - 4); h = Math.min(h, ch - 4);
    let x = ox + 2 + ri(0, cw - 4 - w); const y = oy + 2 + ri(0, ch - 4 - h);
    if (i === 6) x = ox + 15 - Math.floor(w / 2); // antichambre centrée sous l'arène : l'arrivée est frontale (vers le nord)
    const zone = i < 2 ? 'Lisière' : i < 6 ? 'Cœur' : 'Approche';
    rooms.push({ id: 'G' + i, x, y, w, h, zone, name: def.areas[i] });
  }
  const [ax, ay] = path[7];
  const arena = { cx: ax * cw + 15, cy: ay * ch + 10, r: 9 };
  const mid = r => ({ x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y + r.h / 2) });
  // couloirs : segments [x, y, w, h] (L : horizontal puis vertical), largeur 3
  const corrs = [];
  const link = (a, b) => {
    const segs = [];
    const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
    segs.push({ x: x0 - 1, y: a.y - 1, w: x1 - x0 + 3, h: 3, o: 'h' });
    segs.push({ x: b.x - 1, y: y0 - 1, w: 3, h: y1 - y0 + 3, o: 'v' });
    return segs;
  };
  const centers = rooms.map(mid); centers.push({ x: arena.cx, y: arena.cy });
  const mainLinks = [];
  for (let i = 0; i < 7; i++) { const s = link(centers[i], centers[i + 1]); mainLinks.push(s); s.forEach(g => corrs.push(g)); }
  // raccourci : cherche deux salles éloignées dans le parcours mais voisines sur la grille
  let shortcut = null;
  for (let i = 0; i < 6 && !shortcut; i++) for (let j = i + 3; j < 7; j++) {
    const d = Math.abs(path[i][0] - path[j][0]) + Math.abs(path[i][1] - path[j][1]);
    if (d === 1) { shortcut = { i, j, segs: link(centers[i], centers[j]) }; break; }
  }
  const grid = new Uint8Array(MW * MH), roomOf = new Int16Array(MW * MH).fill(-1);
  const fill = (x, y, w, h, v) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i > 0 && j > 0 && i < MW - 1 && j < MH - 1) grid[j * MW + i] = v; };
  rooms.forEach((r, k) => { fill(r.x, r.y, r.w, r.h, T.FLOOR); });
  corrs.forEach(s => fill(s.x, s.y, s.w, s.h, T.FLOOR));
  if (shortcut) shortcut.segs.forEach(s => fill(s.x, s.y, s.w, s.h, T.FLOOR));
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const dx = x + 0.5 - arena.cx, dy = y + 0.5 - arena.cy; if (dx * dx + dy * dy <= arena.r * arena.r) grid[y * MW + x] = T.FLOOR; }
  // salles : indice par tuile (les salles nommées l'emportent sur les couloirs)
  rooms.forEach((r, k) => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) roomOf[y * MW + x] = k; });
  const inAnyRoom = (x, y) => rooms.some(r => x >= r.x - 1 && x < r.x + r.w + 1 && y >= r.y - 1 && y < r.y + r.h + 1);
  const inArena = (x, y) => (x + 0.5 - arena.cx) ** 2 + (y + 0.5 - arena.cy) ** 2 <= (arena.r + 2) ** 2;
  // zone des couloirs : prend le nom de la zone de la salle d'origine
  // porte du raccourci
  let door = null;
  if (shortcut) {
    const cand = shortcut.segs.map(s => {
      const pts = [];
      if (s.o === 'h') { const cy = s.y + 1; for (let x = s.x + 3; x < s.x + s.w - 3; x++) pts.push({ x, y: cy, o: 'h' }); }
      else { const cx = s.x + 1; for (let y = s.y + 3; y < s.y + s.h - 3; y++) pts.push({ x: cx, y, o: 'v' }); }
      return pts;
    }).flat().filter(p => {
      const t = p.o === 'h' ? [[p.x, p.y - 1], [p.x, p.y], [p.x, p.y + 1]] : [[p.x - 1, p.y], [p.x, p.y], [p.x + 1, p.y]];
      return t.every(([x, y]) => !inAnyRoom(x, y) && !inArena(x, y) && grid[y * MW + x] === T.FLOOR);
    });
    if (cand.length) {
      const p = cand[Math.floor(cand.length / 2)];
      const tiles = p.o === 'h' ? [[p.x, p.y - 1], [p.x, p.y], [p.x, p.y + 1]] : [[p.x - 1, p.y], [p.x, p.y], [p.x + 1, p.y]];
      // le côté d'ouverture est celui de la salle la plus tardive (j)
      const cj = centers[shortcut.j], dirv = p.o === 'h' ? { x: cj.x > p.x ? -1 : 1, y: 0 } : { x: 0, y: cj.y > p.y ? -1 : 1 };
      door = { tiles, dir: dirv };
      tiles.forEach(([x, y]) => { grid[y * MW + x] = T.DOOR; });
    }
  }
  // brume : dernier tronçon vers l'arène
  const last = mainLinks[6]; let fog = null;
  {
    const a = centers[6], b = centers[7];
    // marche de a vers b le long du L, trouve le premier point proche de l'arène
    const pts = []; const sx = Math.sign(b.x - a.x) || 1, sy = Math.sign(b.y - a.y) || 1;
    for (let x = a.x; x !== b.x; x += sx) pts.push({ x, y: a.y, dx: sx, dy: 0 });
    for (let y = a.y; y !== b.y; y += sy) pts.push({ x: b.x, y, dx: 0, dy: sy });
    const p = pts.find(q => (q.x + 0.5 - arena.cx) ** 2 + (q.y + 0.5 - arena.cy) ** 2 <= (arena.r + 3) ** 2 && !inAnyRoom(q.x, q.y)) || pts[pts.length - 1];
    const tiles = p.dx ? [[p.x, p.y - 1], [p.x, p.y], [p.x, p.y + 1]] : [[p.x - 1, p.y], [p.x, p.y], [p.x + 1, p.y]];
    fog = { tiles, dir: { x: p.dx, y: p.dy } };
    tiles.forEach(([x, y]) => { grid[y * MW + x] = T.FOG; });
  }
  // zones des tuiles de couloir (pour les bannières)
  const zoneCorr = new Int16Array(MW * MH).fill(-1);
  // décors, coffres, feux, ennemis
  const occ = new Uint8Array(MW * MH); // tuiles réservées (voies de circulation)
  const lane = (x, y) => { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const k = (y + j) * MW + x + i; if (k >= 0 && k < occ.length) occ[k] = 1; } };
  corrs.forEach(s => { for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) lane(x, y); });
  if (shortcut) shortcut.segs.forEach(s => { for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) lane(x, y); });
  const free = (x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = (y + j) * MW + x + i; if (occ[k] || grid[k] !== T.FLOOR) return false; } return true; };
  const reserve = (x, y, w, h, pad = 0) => { for (let j = -pad; j < h + pad; j++) for (let i = -pad; i < w + pad; i++) { const k = (y + j) * MW + x + i; if (k >= 0 && k < occ.length) occ[k] = 1; } };
  const bonfires = [];
  [[0, 'b1'], [3, 'b2'], [6, 'b3']].forEach(([ri_, id]) => {
    const r = rooms[ri_], c = mid(r); let bx = c.x, by = ri_ === 0 ? c.y - 2 : c.y - 3;
    for (let t = 0; t < 30 && !free(bx, by, 1, 1); t++) { bx = r.x + 2 + Math.floor(R() * (r.w - 4)); by = r.y + 2 + Math.floor(R() * (r.h - 4)); }
    reserve(bx, by, 1, 1, 1); bonfires.push({ id, name: r.name, tx: bx, ty: by });
  });
  const startRoom = rooms[0]; const start = { tx: bonfires[0].tx, ty: bonfires[0].ty + 2 };
  const decor = [], chests = [], spawns = [];
  rooms.forEach((r, k) => {
    const n = Math.floor(r.w * r.h / 42);
    for (let t = 0; t < n * 4 && decor.filter(d => d.room === k).length < n; t++) {
      const kind = def.decorKinds[Math.floor(R() * def.decorKinds.length)], [w, h] = FOOT[kind];
      const x = r.x + 1 + Math.floor(R() * (r.w - 2 - w + 1)), y = r.y + 1 + Math.floor(R() * (r.h - 2 - h + 1));
      if (!free(x, y, w, h)) continue; reserve(x, y, w, h, 1); decor.push({ kind, tx: x, ty: y, room: k });
    }
  });
  // coffres dans des salles du cœur
  const chestRooms = [1, 2, 3, 4, 5, 6, 2, 4];
  def.loot.forEach((item, ci) => {
    const r = rooms[chestRooms[ci % chestRooms.length]];
    for (let t = 0; t < 60; t++) {
      const x = r.x + 1 + Math.floor(R() * (r.w - 2)), y = r.y + 1 + Math.floor(R() * (r.h - 2));
      if (!free(x, y, 1, 1)) continue; reserve(x, y, 1, 1, 1); chests.push({ tx: x, ty: y, item }); break;
    }
  });
  // ennemis : paquets par salle
  const tiers = def.mobs;
  const pick = a => a[Math.floor(R() * a.length)];
  const place = (r, type, k) => { for (let t = 0; t < 60; t++) { const x = r.x + 2 + Math.floor(R() * (r.w - 4)), y = r.y + 2 + Math.floor(R() * (r.h - 4)); if (!free(x, y, 1, 1)) continue; reserve(x, y, 1, 1, 0); spawns.push({ type, tx: x, ty: y, room: k }); return; } };
  rooms.forEach((r, k) => {
    if (k === 0) return;
    const nm = k === 6 ? 2 : 2 + (k % 3); for (let i = 0; i < nm; i++) place(r, pick(tiers.mini), k);
    if (k >= 2) { const nd = k === 6 ? 2 : 1 + (k % 2); for (let i = 0; i < nd; i++) place(r, pick(tiers.mid), k); }
    if (k === 4) place(r, tiers.big, k);
  });
  // le gros mob (mini-boss) doit exister : si la salle 4 n'a pas pu l'accueillir, balayage déterministe des autres salles (sans tirage aléatoire)
  if (!spawns.some(sp => sp.type === tiers.big)) {
    scan: for (const k of [4, 5, 3, 6, 2, 1]) {
      const r = rooms[k]; if (!r) continue;
      for (let y = r.y + 2; y < r.y + r.h - 2; y++) for (let x = r.x + 2; x < r.x + r.w - 2; x++) {
        if (!free(x, y, 1, 1)) continue; reserve(x, y, 1, 1, 0); spawns.push({ type: tiers.big, tx: x, ty: y, room: k }); break scan;
      }
    }
  }
  // quête de Fala : salle secrète voisine de la Lisière et emplacement des Modules.
  // Calculé après tout le reste et sans toucher à la grille : la carte du reste du jeu est inchangée.
  let secret = null; const modules = [];
  if (def.fala) {
    const SWd = 9, SHt = 7, PAD = 2;
    const voidBox = (x0, y0, x1, y1) => { for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) { if (i < 2 || j < 2 || i >= MW - 2 || j >= MH - 2 || grid[j * MW + i] !== T.VOID) return false; } return true; };
    search: for (const ri_ of def.fala.hub) {
      const r = rooms[ri_];
      for (const side of ['N', 'E', 'W', 'S']) for (const off of [0, 1, -1, 2, -2, 3, -3, 4, -4]) {
        let sx, sy, gap;
        if (side === 'N' || side === 'S') {
          sx = r.x + Math.floor((r.w - SWd) / 2) + off; sy = side === 'N' ? r.y - 1 - SHt : r.y + r.h + 1;
          const gx = sx + Math.floor(SWd / 2) - 1, gy = side === 'N' ? r.y - 1 : r.y + r.h;
          if (gx < r.x || gx + 1 >= r.x + r.w) continue; gap = [[gx, gy], [gx + 1, gy]];
        } else {
          sy = r.y + Math.floor((r.h - SHt) / 2) + off; sx = side === 'W' ? r.x - 1 - SWd : r.x + r.w + 1;
          const gy = sy + Math.floor(SHt / 2) - 1, gx = side === 'W' ? r.x - 1 : r.x + r.w;
          if (gy < r.y || gy + 1 >= r.y + r.h) continue; gap = [[gx, gy], [gx, gy + 1]];
        }
        // marge de 2 tuiles de vide autour de la salle (hors côté de l'entrée, où il ne reste que la tuile du faux mur)
        const x0 = sx - (side === 'E' ? 1 : PAD), x1 = sx + SWd - 1 + (side === 'W' ? 1 : PAD), y0 = sy - (side === 'S' ? 1 : PAD), y1 = sy + SHt - 1 + (side === 'N' ? 1 : PAD);
        if (!voidBox(x0, y0, x1, y1)) continue;
        const tiles = []; for (let j = sy; j < sy + SHt; j++) for (let i = sx; i < sx + SWd; i++) tiles.push([i, j]); gap.forEach(g_ => tiles.push(g_));
        const far = { N: [sx + 1, sy + 1], S: [sx + 1, sy + SHt - 2], W: [sx + 1, sy + 1], E: [sx + SWd - 3, sy + 1] }[side];
        const far2 = { N: [sx + SWd - 3, sy + 1], S: [sx + SWd - 3, sy + SHt - 2], W: [sx + 1, sy + SHt - 2], E: [sx + SWd - 3, sy + SHt - 2] }[side];
        secret = { side, x: sx, y: sy, w: SWd, h: SHt, gap, tiles, name: 'Cellule de maintenance', npc: { tx: sx + Math.floor(SWd / 2), ty: sy + Math.floor(SHt / 2) }, decor: [{ kind: 'console', tx: far[0], ty: far[1] }, { kind: 'console', tx: far2[0], ty: far2[1] }] };
        break search;
      }
    }
    for (const [id, ri_] of Object.entries(def.fala.modules)) {
      const r = rooms[ri_];
      for (let t = 0; t < 200; t++) {
        const x = r.x + 1 + Math.floor(R() * (r.w - 2)), y = r.y + 1 + Math.floor(R() * (r.h - 2));
        if (!free(x, y, 1, 1)) continue; reserve(x, y, 1, 1, 1); modules.push({ id, tx: x, ty: y, room: ri_ }); break;
      }
    }
  }
  return { rooms, decor, spawns, chests, arena, door, fog, bonfires, start, grid, roomOf, secret, modules };
}

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
  const zones = F.zones.map((z, k) => ({ ...z, k, cx: z.cell[0] * cw + 15 + ri(-2, 2), cy: z.cell[1] * ch + 10 + ri(-3, 2), rx: z.rx || ri(11, 12), ry: z.ry || ri(7, 8), zone: z.zone || (k === 0 ? 'Lisière' : k === last ? 'Approche' : 'Cœur') }));
  // l'arène et la zone qui y mène, puis le raccourci : on écarte les zones pour garder du vide (3 cases au moins) où poser la brume et la porte
  const AC = F.arena.cell, arena = { cx: AC[0] * cw + 15, cy: AC[1] * ch + 10, r: 9 };
  const zf = zones[F.arena.from], vert = Math.abs(arena.cy - zf.cy) >= Math.abs(arena.cx - zf.cx);
  const sx = Math.sign(arena.cx - zf.cx) || 1, sy = Math.sign(arena.cy - zf.cy) || 1;
  if (vert) { zf.ry = Math.min(zf.ry, 7); const e = arena.cy - sy * (arena.r + 4 + zf.ry); if ((zf.cy - e) * -sy < 0) zf.cy = e; }
  else { zf.rx = Math.min(zf.rx, 10); const e = arena.cx - sx * (arena.r + 4 + zf.rx); if ((zf.cx - e) * -sx < 0) zf.cx = e; }
  if (F.door) {
    const I = zones[F.door[0]], J = zones[F.door[1]], v2 = Math.abs(J.cy - I.cy) >= Math.abs(J.cx - I.cx), sg2 = v2 ? (Math.sign(J.cy - I.cy) || 1) : (Math.sign(J.cx - I.cx) || 1);
    if (v2) { I.ry = Math.min(I.ry, 7); J.ry = Math.min(J.ry, 7); const gp = Math.abs(J.cy - I.cy) - I.ry - J.ry; if (gp < 5) I.cy -= sg2 * (5 - gp); }
    else { I.rx = Math.min(I.rx, 10); J.rx = Math.min(J.rx, 10); const gp = Math.abs(J.cx - I.cx) - I.rx - J.rx; if (gp < 5) I.cx -= sg2 * (5 - gp); }
  }
  const zdist = (z, x, y) => { const dx = Math.abs(x + 0.5 - z.cx) / z.rx, dy = Math.abs(y + 0.5 - z.cy) / z.ry; return dx ** 2.8 + dy ** 2.8 + (nz(x, y, 5, z.k + 1) - 0.5) * 0.55; };
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
  zones.forEach(z => {
    const n = Math.floor(Math.PI * z.rx * z.ry / 24);
    for (let t = 0; t < n * 5 && decor.filter(d => d.room === z.k).length < n; t++) {
      const kind = def.decorKinds[Math.floor(R() * def.decorKinds.length)], [w, h] = FOOT[kind];
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
  const place = (k, type) => { const p = spot(k, 120, farFromFire); if (p) { reserve(p[0], p[1], 1, 1, 1); spawns.push({ type, tx: p[0], ty: p[1], room: k }); } };
  const bigZ = F.big ?? 4;
  zones.forEach(z => {
    const k = z.k; if (k === 0) return;
    const nm = k === last ? 2 : 2 + (k % 3); for (let i = 0; i < nm; i++) place(k, pick(tiers.mini));
    if (k >= 2) { const nd = k === last ? 2 : 1 + (k % 2); for (let i = 0; i < nd; i++) place(k, pick(tiers.mid)); }
    if (k === bigZ) place(k, tiers.big);
  });
  if (!spawns.some(sp => sp.type === tiers.big)) for (const k of [bigZ, 5, 3, 2, 1]) { if (!zones[k]) continue; const p = spot(k, 400); if (p) { spawns.push({ type: tiers.big, tx: p[0], ty: p[1], room: k }); break; } }
  const rooms = zones.map(z => ({ id: 'G' + z.k, x: z.cx - z.rx, y: z.cy - z.ry, w: 2 * z.rx, h: 2 * z.ry, zone: z.zone, name: z.name }));
  return { rooms, decor, spawns, chests, arena, door, fog, bonfires, start, grid, roomOf, secret: null, modules: [] };
}

// ---------- monde ----------
export function buildWorld(idx) {
  const def = MAPS[idx], th = THEMES[def.theme];
  const world = { idx, def, theme: th, name: def.name };
  let L;
  if (def.manual) {
    const grid = new Uint8Array(MW * MH), roomOf = new Int16Array(MW * MH).fill(-1);
    LAB.rooms.forEach((r, i) => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) { grid[y * MW + x] = T.FLOOR; if (roomOf[y * MW + x] < 0 || r.name) roomOf[y * MW + x] = i; } });
    const a = LAB.arena;
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const dx = x + 0.5 - a.cx, dy = y + 0.5 - a.cy; if (dx * dx + dy * dy <= a.r * a.r) grid[y * MW + x] = T.FLOOR; }
    L = { ...LAB, grid, roomOf, decor: LAB.decor.map(d => ({ ...d })), chests: LAB.chests.map((c, i) => ({ ...c, item: def.loot[i % def.loot.length] })) };
    for (const d of L.decor) { const [w, h] = FOOT[d.kind]; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) grid[(d.ty + j) * MW + d.tx + i] = T.SOLID; }
    LAB.door.tiles.forEach(([x, y]) => { grid[y * MW + x] = T.DOOR; }); LAB.fog.tiles.forEach(([x, y]) => { grid[y * MW + x] = T.FOG; });
  } else {
    const g = (def.free ? generateFree : generate)({ ...def, decorKinds: th.decor });
    L = g;
    for (const d of L.decor) { const [w, h] = FOOT[d.kind]; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) L.grid[(d.ty + j) * MW + d.tx + i] = T.SOLID; }
  }
  for (const c of L.chests) L.grid[c.ty * MW + c.tx] = T.SOLID;
  for (const d of L.decor) { const [w, h] = FOOT[d.kind]; d.w = w; d.h = h; d.seed = (d.tx * 31 + d.ty * 17) % 97; }
  Object.assign(world, { grid: L.grid, roomOf: L.roomOf, rooms: L.rooms, decor: L.decor, spawns: L.spawns, arena: L.arena, door: L.door, fog: L.fog, bonfires: L.bonfires, start: L.start, chests: L.chests.map((c, i) => ({ ...c, id: i })), secret: L.secret ? { ...L.secret, opened: false } : null, modules: L.modules || [] });
  computeWall(world);
  return world;
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
    const lab = th.floorLab && ri >= 0 && world.rooms[ri] && (world.rooms[ri].id === 'R2' || world.rooms[ri].id === 'R4');
    const base = inA ? th.arena : lab ? th.floorLab : th.floor;
    const k = ((tx + ty) & 1) ? 6 : 0;
    const vn = (px, py) => { const ix = Math.floor(px), iy = Math.floor(py), fx0 = px - ix, fy0 = py - iy, sm = t => t * t * (3 - 2 * t), a0 = rnd(ix, iy), b0 = rnd(ix + 1, iy), c0 = rnd(ix, iy + 1), d0 = rnd(ix + 1, iy + 1), top = a0 + (b0 - a0) * sm(fx0), bot = c0 + (d0 - c0) * sm(fx0); return top + (bot - top) * sm(fy0); };
    // ville d'Edo : dalles de pierre, briques et planchers de bois répartis en grandes plaques
    const edo = th.fx === 'garden' && !inA;
    const et = edo ? (() => { const z = vn(tx / 6 + 3, ty / 6) * 0.75 + vn(tx / 2.4, ty / 2.4 + 5) * 0.25; return z < 0.48 ? 0 : z < 0.72 ? 1 : 2; })() : 0;
    const ebase = edo ? [[120, 112, 100], [128, 94, 78], [122, 88, 58]][et] : null;
    const fb = ebase || base;
    g.fillStyle = `rgb(${fb[0] + k + r * 6 | 0},${fb[1] + k + r * 6 | 0},${fb[2] + k + r * 8 | 0})`;
    g.fillRect(x, y, TS, TS);
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x, y + TS - 1, TS, 1); g.fillRect(x + TS - 1, y, 1, TS);
    g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x, y, TS, 1); g.fillRect(x, y, 1, TS);
    const fx = th.fx;
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
      if (!inA && et === 0) {   // grandes dalles de pierre, joints décalés, mousse, fissures
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
  g.restore(); ge.restore();
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
  const pk = K === 'chest' ? pickProp(opened ? 'chest_open' : 'chest_closed', 'chest') : pickProp(K + '_' + world.def.theme, K + '_' + th.fx, K);   // clé par thème (ex. pillar_plant), puis par effet, puis générique
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
    for (const [ox, oy, rr, c] of (th.open ? [[-10, -42, 13, '#9a2e28'], [8, -46, 14, '#c0452a'], [0, -56, 13, '#d8662e'], [-4, -36, 11, '#7e2624']] : [[-10, -42, 13, '#2e7a5e'], [8, -46, 14, '#3a9a72'], [0, -56, 13, '#4ab08a'], [-4, -36, 11, '#2a6a52']])) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + w / 2 + ox, base + oy, rr, 0, 7); ctx.fill(); }
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
