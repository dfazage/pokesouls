// Les six cartes du Chapitre Génération 1 : définition, génération des salles, collisions et rendu du décor.
// Cartes 1, 2, 3, 4 et 6 : disposition générée (graine fixe). Carte 5 (Laboratoire oublié) : dessinée à la main.
export const TS = 24, MW = 124, MH = 64, FACE = 10;
export const T = { VOID: 0, FLOOR: 1, DOOR: 2, FOG: 3, SOLID: 4 };

const rgb = a => `rgb(${a[0]},${a[1]},${a[2]})`;
export const THEMES = {
  lab: { floor: [34, 40, 62], floorLab: [28, 40, 58], arena: [38, 30, 62], wallA: '#2c3452', wallB: '#2a3150', face: '#1c2038', faceTop: '#3a4468', accent: [80, 220, 200], accent2: [200, 140, 255], fx: 'circuit', amb: [150, 158, 200], ambArena: [115, 100, 160], decor: ['pillar', 'tank', 'console'] },
  ice: { floor: [64, 92, 130], arena: [70, 96, 150], wallA: '#5b7fa8', wallB: '#56799f', face: '#33507a', faceTop: '#9fc4e8', accent: [190, 240, 255], accent2: [140, 200, 255], fx: 'ice', amb: [170, 190, 235], ambArena: [140, 165, 235], decor: ['crystal', 'rock', 'pillar'] },
  plant: { floor: [58, 58, 70], arena: [66, 60, 56], wallA: '#444458', wallB: '#40405a', face: '#27273a', faceTop: '#62627c', accent: [255, 232, 80], accent2: [120, 230, 255], fx: 'circuit', amb: [160, 160, 180], ambArena: [150, 140, 150], decor: ['generator', 'pillar', 'console'] },
  lava: { floor: [66, 40, 38], arena: [78, 42, 34], wallA: '#5a3430', wallB: '#56302c', face: '#321a18', faceTop: '#8a5040', accent: [255, 130, 50], accent2: [255, 200, 90], fx: 'lava', amb: [200, 150, 130], ambArena: [210, 130, 100], decor: ['brazier', 'rock', 'crystal'] },
  rock: { floor: [72, 64, 58], arena: [86, 72, 52], wallA: '#5e5248', wallB: '#5a4e44', face: '#38302a', faceTop: '#8a7a68', accent: [255, 200, 110], accent2: [200, 170, 120], fx: 'stone', amb: [175, 165, 155], ambArena: [185, 160, 120], decor: ['rock', 'pillar', 'brazier'] },
  mystic: { floor: [36, 68, 62], arena: [52, 50, 86], wallA: '#27494a', wallB: '#244446', face: '#142a2c', faceTop: '#3e7a76', accent: [255, 170, 230], accent2: [160, 255, 220], fx: 'moss', amb: [150, 180, 175], ambArena: [150, 130, 200], decor: ['tree', 'crystal', 'statue'] },
};

// ---------- définitions des cartes ----------
export const MAPS = [
  { id: 'm1', name: 'Îles Écume', sub: 'Grottes gelées', theme: 'ice', lv: 8, seed: 11, boss: 'articuno',
    path: [[0, 2], [1, 2], [2, 2], [2, 1], [1, 1], [0, 1], [0, 0], [1, 0]],
    areas: ['Rivage gelé', 'Grotte des phoques', 'Bassin glacé', 'Galerie de givre', 'Caverne de cristal', 'Lac souterrain', 'Antichambre du blizzard'], sanctuary: "Nid d'Artikodin",
    mobs: { mini: ['seel', 'shellder', 'krabby'], mid: ['dewgong', 'starmie', 'cloyster'], big: 'lapras' },
    loot: ['candy', 'berrypack', 'hpup', 'ct_swift', 'protein'], reward: ['ct_icebeam', 'candy'] },
  { id: 'm2', name: 'Centrale abandonnée', sub: 'Sous haute tension', theme: 'plant', lv: 15, seed: 23, boss: 'zapdos',
    path: [[3, 2], [2, 2], [1, 2], [1, 1], [2, 1], [3, 1], [3, 0], [2, 0]],
    areas: ['Hall des turbines', 'Salle des câbles', 'Atelier rouillé', 'Salle des générateurs', 'Couloir des relais', 'Poste de commande', 'Antichambre du transformateur'], sanctuary: "Cœur de la Centrale",
    mobs: { mini: ['magnemite', 'voltorb', 'pikachu'], mid: ['magneton', 'electrode', 'raichu'], big: 'electabuzz' },
    loot: ['candy', 'iron', 'ct_bodyslam', 'berrypack', 'calcium', 'maxberry'], reward: ['ct_thunder', 'candy'] },
  { id: 'm3', name: 'Mont Braise', sub: 'Le volcan vivant', theme: 'lava', lv: 22, seed: 37, boss: 'moltres',
    path: [[0, 0], [1, 0], [2, 0], [2, 1], [1, 1], [0, 1], [0, 2], [1, 2]],
    areas: ['Flanc du volcan', 'Tunnel de lave', 'Caverne de braise', 'Pont de basalte', 'Forge abandonnée', 'Grotte des cendres', 'Antichambre du magma'], sanctuary: "Cratère de Sulfura",
    mobs: { mini: ['vulpix', 'growlithe', 'ponyta'], mid: ['ninetales', 'rapidash', 'arcanine'], big: 'magmar' },
    loot: ['candy', 'carbos', 'ct_hydro', 'berrypack', 'hpup', 'zinc'], reward: ['ct_fireblast', 'candy'] },
  { id: 'm4', name: 'Route Victoire', sub: 'Le chemin des rois', theme: 'rock', lv: 30, seed: 41, boss: 'dragonite',
    path: [[1, 2], [0, 2], [0, 1], [1, 1], [2, 1], [2, 2], [3, 2], [3, 1]],
    areas: ['Pied de la route', 'Éboulis', 'Gorge des échos', 'Plateau des rochers', 'Arène des rois', 'Pont de pierre', 'Porte de la Ligue'], sanctuary: "Sommet des rois",
    mobs: { mini: ['machop', 'geodude', 'rhyhorn'], mid: ['machoke', 'graveler', 'dragonair', 'rhydon'], big: 'snorlax' },
    loot: ['candy', 'protein', 'ct_earthquake', 'berrypack', 'iron', 'maxberry'], reward: ['ct_swords', 'candy', 'candy'] },
  { id: 'm5', name: 'Laboratoire oublié', sub: 'Là où Mewtwo est né', theme: 'lab', lv: 38, seed: 5, boss: 'mewtwo', manual: true,
    areas: [], sanctuary: 'Sanctuaire de Mewtwo',
    mobs: { mini: ['magnemite', 'koffing', 'voltorb'], mid: ['porygon', 'weezing'], big: 'electrodeA' },
    loot: ['candy', 'calcium', 'ct_psychic', 'berrypack', 'hpup', 'ct_teleport'], reward: ['ct_solar', 'candy'] },
  { id: 'm6', name: 'Île Mystère', sub: 'Le refuge de Mew', theme: 'mystic', lv: 45, seed: 59, boss: 'mew',
    path: [[3, 0], [2, 0], [1, 0], [1, 1], [2, 1], [3, 1], [3, 2], [2, 2]],
    areas: ['Plage secrète', 'Bosquet lumineux', 'Clairière des rêves', 'Ruines couvertes de lierre', 'Jardin suspendu', 'Source scintillante', 'Antichambre du mythe'], sanctuary: 'Cœur de l’île',
    mobs: { mini: ['exeggcute', 'abra', 'haunter'], mid: ['kadabra', 'gengar', 'mrmime'], big: 'exeggutor' },
    loot: ['candy', 'protein', 'ct_softboiled', 'hpup', 'berrypack', 'maxberry'], reward: ['ct_hyper', 'candy', 'candy'] },
];

// ---------- aléatoire à graine ----------
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const rnd = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

const FOOT = { tank: [2, 2], tankbroken: [2, 2], pillar: [1, 1], mirror: [1, 1], console: [2, 1], rock: [1, 1], crystal: [1, 1], brazier: [1, 1], generator: [2, 2], tree: [2, 2], statue: [1, 1], chest: [1, 1] };

// ---------- carte du laboratoire (dessinée à la main) ----------
const LAB = (() => {
  const DY = 4;
  const R = [
    ['R0', 3, 38, 12, 9, 'Lisière', "Hall d'entrée"], ['C0', 15, 41, 9, 3, 'Lisière', null], ['R1', 24, 36, 11, 12, 'Lisière', "Salle d'observation"],
    ['C1', 28, 29, 3, 7, 'Cœur', null], ['R2', 20, 12, 30, 17, 'Cœur', 'Salle des cuves'], ['C2v', 9, 26, 3, 12, 'Cœur', null], ['C2h', 12, 26, 8, 3, 'Cœur', null],
    ['C3', 50, 19, 4, 3, 'Cœur', null], ['R3', 54, 15, 9, 10, 'Cœur', 'Salle de contrôle'], ['C5', 33, 8, 3, 4, 'Cœur', null], ['R4', 28, 0, 14, 8, 'Cœur', 'Chambre de clonage'],
    ['C4', 63, 18, 8, 3, 'Approche', null], ['R5', 71, 10, 16, 18, 'Approche', 'Galerie des miroirs'], ['C6', 87, 17, 4, 3, 'Approche', null], ['R7', 91, 12, 9, 10, 'Approche', 'Antichambre'], ['C7', 100, 16, 3, 3, 'Sanctuaire', null],
  ].map(r => ({ id: r[0], x: r[1], y: r[2] + DY, w: r[3], h: r[4], zone: r[5], name: r[6] }));
  const decor = [['tank', 26, 15], ['tank', 26, 23], ['tank', 32, 19], ['tank', 38, 15], ['tank', 38, 23], ['tank', 44, 19], ['pillar', 27, 39], ['pillar', 32, 39], ['pillar', 27, 45], ['pillar', 32, 45],
    ['pillar', 6, 40], ['pillar', 12, 40], ['pillar', 6, 45], ['pillar', 12, 45], ['mirror', 75, 14], ['mirror', 75, 22], ['mirror', 82, 14], ['mirror', 82, 22], ['mirror', 79, 18],
    ['console', 57, 17], ['console', 59, 22], ['tankbroken', 31, 3], ['tankbroken', 37, 3], ['pillar', 29, 6], ['pillar', 40, 6], ['pillar', 93, 14], ['pillar', 98, 14], ['pillar', 93, 20], ['pillar', 98, 20]]
    .map(([kind, x, y]) => ({ kind, tx: x, ty: y + DY }));
  const spawns = [['magnemite', 28, 41], ['magnemite', 32, 44], ['koffing', 30, 38], ['koffing', 28, 18], ['koffing', 41, 21], ['koffing', 34, 27], ['voltorb', 24, 20], ['voltorb', 46, 25], ['voltorb', 31, 13], ['magnemite', 45, 14],
    ['koffing', 57, 21], ['koffing', 60, 17], ['electrodeA', 35, 4], ['porygon', 77, 18], ['porygon', 83, 19], ['weezing', 79, 12], ['magnemite', 84, 25], ['magnemite', 73, 25], ['koffing', 80, 22]]
    .map(([type, x, y]) => ({ type, tx: x, ty: y + DY }));
  return {
    rooms: R, decor, spawns, arena: { cx: 113, cy: 17 + DY, r: 10 },
    door: { tiles: [[9, 31 + DY], [10, 31 + DY], [11, 31 + DY]], dir: { x: 0, y: 1 } }, // s'ouvre depuis le côté nord
    fog: { tiles: [[101, 16 + DY], [101, 17 + DY], [101, 18 + DY]], dir: { x: 1, y: 0 } },
    bonfires: [{ id: 'b1', name: "Hall d'entrée", tx: 8, ty: 42 + DY }, { id: 'b2', name: 'Salle de contrôle', tx: 58, ty: 20 + DY }, { id: 'b3', name: 'Antichambre', tx: 95, ty: 17 + DY }],
    start: { tx: 8, ty: 44 + DY },
    chests: [[5, 41], [40, 2], [61, 22], [84, 14], [96, 12], [22, 26]].map(([x, y]) => ({ tx: x, ty: y + DY })),
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
    const x = ox + 2 + ri(0, cw - 4 - w), y = oy + 2 + ri(0, ch - 4 - h);
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
  return { rooms, decor, spawns, chests, arena, door, fog, bonfires, start, grid, roomOf };
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
    const g = generate({ ...def, decorKinds: th.decor });
    L = g;
    for (const d of L.decor) { const [w, h] = FOOT[d.kind]; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) L.grid[(d.ty + j) * MW + d.tx + i] = T.SOLID; }
  }
  for (const c of L.chests) L.grid[c.ty * MW + c.tx] = T.SOLID;
  for (const d of L.decor) { const [w, h] = FOOT[d.kind]; d.w = w; d.h = h; d.seed = (d.tx * 31 + d.ty * 17) % 97; }
  Object.assign(world, { grid: L.grid, roomOf: L.roomOf, rooms: L.rooms, decor: L.decor, spawns: L.spawns, arena: L.arena, door: L.door, fog: L.fog, bonfires: L.bonfires, start: L.start, chests: L.chests.map((c, i) => ({ ...c, id: i })) });
  // masque de murs : vide adjacent (8 voisins) à du sol
  const wall = new Uint8Array(MW * MH), g = world.grid;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (g[y * MW + x] !== T.VOID) continue;
    let near = false;
    for (let j = -1; j <= 1 && !near; j++) for (let i = -1; i <= 1; i++) { const nx = x + i, ny = y + j; if (nx >= 0 && ny >= 0 && nx < MW && ny < MH && g[ny * MW + nx] !== T.VOID) { near = true; break; } }
    wall[y * MW + x] = near ? 1 : 0;
  }
  world.wall = wall;
  return world;
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
    g.fillStyle = `rgb(${base[0] + k + r * 6 | 0},${base[1] + k + r * 6 | 0},${base[2] + k + r * 8 | 0})`;
    g.fillRect(x, y, TS, TS);
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x, y + TS - 1, TS, 1); g.fillRect(x + TS - 1, y, 1, TS);
    g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x, y, TS, 1); g.fillRect(x, y, 1, TS);
    const fx = th.fx;
    if (fx === 'circuit') {
      if (r > 0.82) { g.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 3; i < TS - 3; i += 4) g.fillRect(x + 4, y + i, TS - 8, 1); }
      if (r < 0.14) { g.strokeStyle = inA ? 'rgba(190,120,255,.55)' : `rgba(${th.accent},.45)`; g.lineWidth = 1; g.beginPath(); const aa = 4 + (r * 100 % 12) | 0; g.moveTo(x, y + aa); g.lineTo(x + 10, y + aa); g.lineTo(x + 10, y + 16); g.lineTo(x + TS, y + 16); g.stroke(); g.fillStyle = inA ? '#d0a0ff' : ac; g.fillRect(x + 9, y + aa - 1, 3, 3); }
      if (r > 0.6 && r < 0.64) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(x + 6, y + 8, 10, 6); }
    } else if (fx === 'ice') {
      if (r < 0.22) { g.strokeStyle = 'rgba(220,245,255,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 3, y + 4 + r * 20); g.lineTo(x + 12, y + 12); g.lineTo(x + 20, y + 8 + r * 10); g.stroke(); }
      if (r > 0.9) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 6 + r * 10 % 10, y + 6, 2, 2); }
      if (r > 0.5 && r < 0.56) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 3, y + 3, TS - 6, TS - 6); }
    } else if (fx === 'lava') {
      if (r < 0.2) { g.strokeStyle = `rgba(${th.accent},.7)`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + 2, y + 6 + r * 30); g.lineTo(x + 9, y + 12); g.lineTo(x + 14, y + 10 + r * 20); g.lineTo(x + 22, y + 16); g.stroke(); }
      if (r > 0.88) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 4 + r * 8 % 8, y + 8, 6, 4); }
    } else if (fx === 'stone') {
      if (r < 0.3) { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x + 3 + r * 30 % 12, y + 5, 5, 3); g.fillRect(x + 12, y + 14 + r * 10 % 6, 4, 3); }
      if (r > 0.9) { g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(x + 6, y + 10, 8, 2); }
    } else if (fx === 'moss') {
      if (r < 0.3) { g.fillStyle = 'rgba(90,200,120,.25)'; g.fillRect(x + 4 + r * 40 % 10, y + 6, 6, 4); g.fillRect(x + 14, y + 14, 5, 3); }
      if (r > 0.92) { g.fillStyle = ac; g.fillRect(x + 8 + r * 20 % 8, y + 8, 2, 2); }
    }
  }
  // anneaux de l'arène
  const A = world.arena; g.save(); g.translate(A.cx * TS, A.cy * TS);
  for (const [rad, col, lw] of [[A.r * TS - 6, th.accent2, 2], [A.r * TS * 0.62, th.accent2, 1], [A.r * TS * 0.3, th.accent, 1]]) { g.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},.5)`; g.lineWidth = lw; g.beginPath(); g.arc(0, 0, rad, 0, Math.PI * 2); g.stroke(); }
  g.strokeStyle = `rgba(${th.accent2[0]},${th.accent2[1]},${th.accent2[2]},.25)`; g.lineWidth = 1;
  for (let i = 0; i < 12; i++) { const an = i * Math.PI / 6; g.beginPath(); g.moveTo(Math.cos(an) * A.r * TS * 0.3, Math.sin(an) * A.r * TS * 0.3); g.lineTo(Math.cos(an) * (A.r * TS - 6), Math.sin(an) * (A.r * TS - 6)); g.stroke(); }
  g.restore();
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
    const lite = th.fx === 'ice' ? ['#9cc4e8', '#c8e4ff', '#7aa0c8'] : th.fx === 'stone' ? ['#8a7a68', '#a89a86', '#6a5c4c'] : th.fx === 'lava' ? ['#6a3e38', '#8a5a4e', '#4a2a26'] : th.fx === 'moss' ? ['#4a7a6a', '#6aa08c', '#365a4e'] : ['#7e89ad', '#9aa5c6', '#4d5780'];
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
  } else if (K === 'generator') {
    ctx.fillStyle = '#3a3a4c'; ctx.fillRect(x + 3, base - 36, w - 6, 32); ctx.fillStyle = '#5a5a74'; ctx.fillRect(x + 3, base - 36, w - 6, 3);
    ctx.fillStyle = '#26263a'; ctx.fillRect(x + 8, base - 28, w - 16, 14);
    const on = ((time * 3 + d.seed) | 0) % 4 !== 0; ctx.fillStyle = on ? ac : '#444'; ctx.fillRect(x + 11, base - 25, 6, 3); ctx.fillStyle = on ? '#6cf0e0' : '#444'; ctx.fillRect(x + 21, base - 25, 6, 3);
    ctx.strokeStyle = ac; ctx.lineWidth = 1.5; ctx.beginPath(); const zz = (time * 40 + d.seed) % 20; ctx.moveTo(x + 12, base - 20); ctx.lineTo(x + 18, base - 17 + zz % 3); ctx.lineTo(x + 24, base - 21); ctx.lineTo(x + 32, base - 17); ctx.stroke();
    ctx.fillStyle = '#26263a'; ctx.fillRect(x + w / 2 - 3, base - 46, 6, 10); ctx.fillStyle = on ? ac : '#555'; ctx.fillRect(x + w / 2 - 2, base - 48, 4, 3);
  } else if (K === 'tree') {
    ctx.fillStyle = '#4a3828'; ctx.fillRect(x + w / 2 - 4, base - 28, 8, 24); ctx.fillStyle = '#3a2a1e'; ctx.fillRect(x + w / 2 + 1, base - 28, 3, 24);
    for (const [ox, oy, rr, c] of [[-10, -42, 13, '#2e7a5e'], [8, -46, 14, '#3a9a72'], [0, -56, 13, '#4ab08a'], [-4, -36, 11, '#2a6a52']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + w / 2 + ox, base + oy, rr, 0, 7); ctx.fill(); }
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
  if (d.kind === 'generator') return { x: (d.tx + 1) * TS, y: (d.ty + 0.3) * TS, r: 50, c: A };
  if (d.kind === 'tree') return { x: (d.tx + 1) * TS, y: (d.ty + 0.2) * TS, r: 56, c: A };
  if (d.kind === 'statue') return { x: (d.tx + 0.5) * TS, y: (d.ty + 0.3) * TS, r: 28, c: th.accent2 };
  if (d.kind === 'chest' && !opened) return { x: (d.tx + 0.5) * TS, y: (d.ty + 0.4) * TS, r: 30, c: [255, 220, 120] };
  return null;
}
