// Système de musique : une piste par contexte, boucles sans coupure (Web Audio), fondus enchaînés, jingles à lecture unique.
// Les fichiers sont dans assets/audio/music/<id en minuscules>.ogg ; une piste absente ou illisible est ignorée sans erreur.
export const TRACKS = {
  HUB_MAIN: { title: 'Slow Melancholic Theme C64 Style', author: 'skrjablin', license: 'CC-BY 3.0 / CC0', url: 'https://opengameart.org/node/18078', use: 'Feu de camp, écran titre, commandes' },
  MENU_STARTER: { title: 'sadville', author: 'Bobjt', license: 'CC0', url: 'https://opengameart.org/node/87933', use: 'Choix du starter' },
  MAP_1: { title: 'Chiptune: Exploration', author: 'ansimuz', license: 'CC0', url: 'https://opengameart.org/content/chiptune-exploration', use: 'Carte 1' },
  MAP_2: { title: 'Nintendo Style - Dungeon Music Loop 02', author: 'PlayOnLoop', license: 'CC-BY 4.0', url: 'https://opengameart.org/node/111300', use: 'Carte 2' },
  MAP_3: { title: 'Spooky Dungeon', author: 'Memoraphile', license: 'CC0', url: 'https://opengameart.org/node/87564', use: 'Carte 3' },
  MAP_4: { title: 'Possible Dungeon', author: 'davididev', license: 'CC-BY 4.0', url: 'https://opengameart.org/node/95325', use: 'Carte 4' },
  MAP_5: { title: 'Underground Storm', author: 'axtoncrolley', license: 'CC-BY-SA 3.0', url: 'https://opengameart.org/node/32900', use: 'Carte 5' },
  MAP_6: { title: '8-bit Dungeon', author: 'Tsorthan Grove', license: 'CC-BY 4.0', url: 'https://opengameart.org/node/137421', use: 'Carte 6' },
  MINIBOSS_A: { title: 'Zelda Style 8-bit Boss Theme', author: 'HydroGene', license: 'CC0', url: 'https://opengameart.org/node/140852', use: 'Gros mob' },
  MINIBOSS_B: { title: '8-bit Theme - Intensity', author: 'Wolfgang_', license: 'CC-BY 3.0', url: 'https://opengameart.org/node/86839', use: 'Gros mob (alternance)' },
  SUBBOSS_BIRDS: { title: '16-bit - Battle Theme I', author: 'HydroGene', license: 'CC0', url: 'https://opengameart.org/node/178920', use: 'Artikodin, Électhor, Sulfura' },
  SUBBOSS_KINGS: { title: 'Phantasy Boss Battle Encounter', author: 'ansimuz', license: 'CC0', url: 'https://opengameart.org/node/137167', use: 'Rois de Kanto' },
  SUBBOSS_KINGS_ALT: { title: 'Retro Chiptune (Action)', author: 'PeakMusic', license: 'CC0', url: 'https://opengameart.org/node/100781', use: 'Rois de Kanto (variante)' },
  BOSS_MEWTWO_P1: { title: 'Final Boss Appearance Dark Fantasy', author: 'SOUND AIRYLUVS by ISAo (https://airyluvs.com/)', license: 'OGA-BY 3.0 (crédit obligatoire)', url: 'https://opengameart.org/node/114175', use: 'Mewtwo, phase 1' },
  BOSS_MEWTWO_P2: { title: '16bit Boss Battle Loop', author: '3xBlast', license: 'CC-BY-SA 3.0', url: 'https://opengameart.org/node/69034', use: 'Mewtwo, phase 2' },
  BOSS_MEW: { title: 'Final Stand', author: 'Centurion_of_war', license: 'CC0', url: 'https://opengameart.org/content/final-stand-0', use: 'Mew' },
  JINGLE_CAMPFIRE: { title: 'Cunning plan (provisoire)', author: 'congusbongus', license: 'CC0', url: 'https://opengameart.org/content/cunning-plan-short-seamless-loop', use: 'Feu allumé', jingle: true },
  JINGLE_DEATH: { title: 'Better luck next time', author: 'congusbongus', license: 'CC0', url: 'https://opengameart.org/node/143357', use: 'Mort', jingle: true },
  JINGLE_VICTORY: { title: 'Victory sting', author: 'congusbongus', license: 'CC0', url: 'https://opengameart.org/content/victory-sting', use: 'Boss vaincu', jingle: true },
};
const STORE = 'pokesouls.options.v1';
// Couche perso (reprises, usage privé) : active en local, coupée sur le site publié ; ?perso=0 ou ?perso=1 force le choix.
const qp = (location.search.match(/[?&]perso=([01])/) || [])[1];
export const USE_PERSONAL_MUSIC = qp ? qp === '1' : /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname);
const FREE = id => `assets/audio/music/${id.toLowerCase()}.ogg`, PERSO = id => `assets/audio/music_perso/${id.toLowerCase()}.ogg`;
const fetchOgg = url => fetch(url).then(r => { if (!r.ok) throw new Error('absent'); return r.arrayBuffer(); });
const bossy = id => !!id && /^(BOSS_|SUBBOSS_)/.test(id);

let ac = null, master = null, volume = 0.7;
try { const o = JSON.parse(localStorage.getItem(STORE) || 'null'); if (o && typeof o.music === 'number') volume = Math.max(0, Math.min(1, o.music)); } catch (e) { /* défaut */ }
const bufs = {};            // id → AudioBuffer | 'fail' | 'loading'
let cur = null;             // { id, src, gain }
let jingle = null;          // { src } pendant la lecture d'un jingle
let want = null, wantTempo = 1;

function ensure() {
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = volume; master.connect(ac.destination); } catch (e) { ac = null; } }
  if (ac && ac.state === 'suspended') ac.resume();
  return !!ac;
}
function load(id) {
  if (bufs[id]) return;
  bufs[id] = 'loading';
  (USE_PERSONAL_MUSIC ? fetchOgg(PERSO(id)).catch(() => fetchOgg(FREE(id))) : fetchOgg(FREE(id)))
    .then(a => new Promise((res, rej) => ac.decodeAudioData(a, res, rej)))
    .then(b => { bufs[id] = b; }).catch(() => { bufs[id] = 'fail'; });
}
function startSrc(id, fade, tempo, loop) {
  const g = ac.createGain(), s = ac.createBufferSource();
  s.buffer = bufs[id]; s.loop = loop; s.playbackRate.value = tempo;
  g.gain.value = 0; g.gain.linearRampToValueAtTime(1, ac.currentTime + Math.max(0.02, fade));
  s.connect(g); g.connect(master); s.start();
  return { id, src: s, gain: g };
}
function fadeOut(t, fade) {
  if (!t) return;
  const now = ac.currentTime; t.gain.gain.cancelScheduledValues(now); t.gain.gain.setValueAtTime(t.gain.gain.value, now); t.gain.gain.linearRampToValueAtTime(0, now + Math.max(0.02, fade));
  try { t.src.stop(now + fade + 0.05); } catch (e) { /* déjà arrêtée */ }
}

export const Music = {
  unlock() { ensure(); },
  getVolume: () => volume,
  setVolume(v) {
    volume = Math.max(0, Math.min(1, v)); if (master) master.gain.value = volume;
    try { const o = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; o.music = volume; localStorage.setItem(STORE, JSON.stringify(o)); } catch (e) { /* rien */ }
  },
  prefetch(ids) { if (ensure()) ids.forEach(load); },
  // piste voulue par le contexte ; appelée à chaque image
  direct(id, tempo = 1) {
    want = id; wantTempo = tempo;
    if (!ensure() || jingle) return;
    if (cur && cur.id === id) { if (cur.src.playbackRate.value !== tempo) cur.src.playbackRate.setTargetAtTime(tempo, ac.currentTime, 0.3); return; }
    if (!id) { if (cur) { fadeOut(cur, 1); cur = null; } return; }
    load(id);
    if (bufs[id] === 'fail') { if (cur) { fadeOut(cur, 1); cur = null; } return; } // piste absente : silence
    if (!(bufs[id] instanceof AudioBuffer)) return; // en cours de chargement : l'ancienne piste continue
    const fade = bossy(id) || bossy(cur && cur.id) ? 0.5 : 1.0;
    fadeOut(cur, fade); cur = startSrc(id, fade, tempo, true);
  },
  // jingle : coupe la musique, une seule lecture, puis la musique voulue repart en fondu
  playJingle(id) {
    if (!ensure()) return;
    load(id);
    const go = () => {
      if (!(bufs[id] instanceof AudioBuffer)) return;
      fadeOut(cur, 0.25); cur = null;
      if (jingle) { try { jingle.src.stop(); } catch (e) { /* rien */ } }
      const j = startSrc(id, 0.02, 1, false); jingle = j;
      j.src.onended = () => { if (jingle === j) jingle = null; };
    };
    if (bufs[id] instanceof AudioBuffer) go(); else if (bufs[id] === 'loading') { const t = setInterval(() => { if (bufs[id] !== 'loading') { clearInterval(t); go(); } }, 50); setTimeout(() => clearInterval(t), 1500); }
  },
  state: () => ({ cur: cur && cur.id, jingle: !!jingle, want, vol: volume }),
};

// ---------- chef d'orchestre : choisit la piste selon le contexte (BOSS > MINIBOSS > MAP > HUB > MENU) ----------
let miniOn = false, miniOff = 0, miniAlt = false, miniId = 'MINIBOSS_A', lastMap = -1;
const BOSS_TRACK = { articuno: 'SUBBOSS_BIRDS', zapdos: 'SUBBOSS_BIRDS', moltres: 'SUBBOSS_BIRDS', dragonite: 'SUBBOSS_KINGS', mewtwo: 'BOSS_MEWTWO_P1', mew: 'BOSS_MEW' };
export function directMusic(g, ui, dt) {
  if (ui.screen === 'starters') return Music.direct('MENU_STARTER');
  if (ui.screen === 'title' || ui.controls || !g || !g.world) return Music.direct('HUB_MAIN');
  if (g.mapIdx !== lastMap) { lastMap = g.mapIdx; Music.prefetch([`MAP_${g.mapIdx + 1}`, BOSS_TRACK[g.world.def.boss], g.world.def.boss === 'mewtwo' ? 'BOSS_MEWTWO_P2' : null, 'MINIBOSS_A', 'MINIBOSS_B'].filter(Boolean)); }
  const b = g.bossActive && g.boss && !g.boss.dead ? g.boss : null;
  if (b) {
    const key = g.world.def.boss, ratio = b.hp / b.maxhp; let id = BOSS_TRACK[key], tempo = 1;
    if (key === 'mewtwo' && ratio < 0.5) id = 'BOSS_MEWTWO_P2';
    if (key === 'mew' && ratio < 0.5) tempo = 1.08;
    miniOn = false; return Music.direct(id, tempo);
  }
  const c = g.chief();
  const engaged = g.enemies.some(e => e.big && !e.dead && e.state !== 'idle' && e.state !== 'dormant' && e.state !== 'return' && Math.hypot(e.x - c.x, e.y - c.y) < 230);
  if (engaged) { if (!miniOn) { miniOn = true; miniAlt = !miniAlt; miniId = miniAlt ? 'MINIBOSS_A' : 'MINIBOSS_B'; } miniOff = 3; } else if (miniOn && (miniOff -= dt) <= 0) miniOn = false;
  if (miniOn) return Music.direct(miniId);
  if (ui.menuKind === 'bonfire') return Music.direct('HUB_MAIN');
  if (g.hubAt) { if (Math.hypot(g.hubAt.x - c.x, g.hubAt.y - c.y) < 140) return Music.direct('HUB_MAIN'); g.hubAt = null; }
  return Music.direct(`MAP_${g.mapIdx + 1}`);
}
