// Système de musique : une piste par contexte, boucles sans coupure (Web Audio), fondus enchaînés, jingles à lecture unique.
// Écran titre : INTRO_TITLE ; le fondu de 1 s vers MENU_STARTER / la carte se fait via direct().
// Les fichiers sont dans assets/audio/music/<id en minuscules>.ogg ; une piste absente ou illisible est ignorée sans erreur.
export const TRACKS = {
  INTRO_TITLE: { title: 'LOVE STORY X GOLDEN BROWN (Epic Orchestral Version)', author: 'Sam B Music', license: 'tous droits réservés, repris pour ce fan game non commercial', url: 'https://www.youtube.com/watch?v=s9NMV-k6Jcc', use: 'Écran titre' },
  HUB_MAIN: { title: 'Dark Shrine Loop', author: 'qubodup', license: 'CC0', url: 'https://opengameart.org/content/dark-shrine-loop', use: 'Feu de camp, commandes' },
  MENU_STARTER: { title: 'The Hope', author: 'TAD', license: 'CC0', url: 'https://opengameart.org/content/the-hope', use: 'Choix du starter' },
  MAP_1: { title: 'Laments of the War', author: 'Cethiel', license: 'CC0', url: 'https://opengameart.org/content/laments-of-the-war', use: 'Carte 1' },
  MAP_2: { title: 'Mysterious', author: 'nene', license: 'CC0', url: 'https://opengameart.org/content/mysterious', use: 'Carte 2' },
  MAP_3: { title: 'Forgoten Tomb Ambience', author: 'kindland', license: 'CC0', url: 'https://opengameart.org/content/forgoten-tomb-ambience', use: 'Carte 3' },
  MAP_4: { title: 'Dark Theme', author: 'JaggedStone', license: 'CC0', url: 'https://opengameart.org/content/dark-theme', use: 'Carte 4' },
  MAP_5: { title: 'Horror Atmosphere', author: 'SubspaceAudio', license: 'CC0', url: 'https://opengameart.org/content/horror-atmosphere', use: 'Carte 5' },
  MAP_6: { title: 'Fantasy Choir (3 orchestral pieces)', author: 'cesisco', license: 'CC0', url: 'https://opengameart.org/content/fantasy-choir-3-orchestral-pieces', use: 'Carte 6' },
  MINIBOSS_A: { title: 'Sinister Boss Appears', author: 'cynicmusic', license: 'CC0', url: 'https://opengameart.org/content/sinister-boss-appears', use: 'Gros mob' },
  MINIBOSS_B: { title: 'Dramatic Boss Encounter', author: 'cynicmusic', license: 'CC0', url: 'https://opengameart.org/content/dramatic-boss-encounter', use: 'Gros mob (alternance)' },
  SUBBOSS_BIRDS: { title: 'Boss Battle 2 (Symphonic Metal)', author: 'nene', license: 'CC0', url: 'https://opengameart.org/content/boss-battle-2-symphonic-metal', use: 'Artikodin, Électhor, Sulfura' },
  SUBBOSS_KINGS: { title: 'Boss Battle Music', author: 'SubspaceAudio', license: 'CC0', url: 'https://opengameart.org/content/boss-battle-music', use: 'Rois de Kanto' },
  SUBBOSS_KINGS_ALT: { title: 'Ancient Power of Serpents', author: 'josepharaoh99', license: 'CC0', url: 'https://opengameart.org/content/ancient-power-of-serpents', use: 'Rois de Kanto (variante)' },
  BOSS_MEWTWO_P1: { title: 'Colossal Boss Battle Theme', author: 'Matthew Pablo (http://www.matthewpablo.com)', license: 'CC-BY 3.0 (crédit obligatoire)', url: 'https://opengameart.org/content/colossal-boss-battle-theme', use: 'Mewtwo, phase 1' },
  BOSS_MEWTWO_P2: { title: 'Dark Descent (extended cut)', author: 'Matthew Pablo (http://www.matthewpablo.com)', license: 'CC-BY 3.0 (crédit obligatoire)', url: 'https://opengameart.org/content/dark-descent-extended-cut', use: 'Mewtwo, phase 2' },
  BOSS_MEW: { title: 'Epic Endgame Cinematic', author: 'cynicmusic', license: 'CC0', url: 'https://opengameart.org/content/epic-endgame-cinematic', use: 'Mew' },
  JINGLE_CAMPFIRE: { title: 'Cunning plan (provisoire)', author: 'congusbongus', license: 'CC0', url: 'https://opengameart.org/content/cunning-plan-short-seamless-loop', use: 'Feu allumé', jingle: true },
  JINGLE_DEATH: { title: 'Better luck next time', author: 'congusbongus', license: 'CC0', url: 'https://opengameart.org/node/143357', use: 'Mort', jingle: true },
  JINGLE_VICTORY: { title: 'Victory sting', author: 'congusbongus', license: 'CC0', url: 'https://opengameart.org/content/victory-sting', use: 'Boss vaincu', jingle: true },
};
const STORE = 'pokesouls.options.v1';
// Couche perso (reprises, usage privé) : active en local, coupée sur le site publié ; ?perso=0 ou ?perso=1 force le choix.
const qp = (location.search.match(/[?&]perso=([01])/) || [])[1];
export const USE_PERSONAL_MUSIC = qp ? qp === '1' : /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname);
let MAP = {};
export const musicMap = () => MAP;
const mapReady = fetch('assets/audio/music_map.json').then(r => r.json()).then(j => { MAP = j; }).catch(() => {});
const FREE = id => `assets/audio/music/${(MAP[id] && MAP[id].fallback_audio) || id.toLowerCase() + '.ogg'}`, PERSO = id => `assets/audio/music_perso/${id.toLowerCase()}.ogg`;
const fetchOgg = url => fetch(url).then(r => { if (!r.ok) throw new Error('absent'); return r.arrayBuffer(); });
const bossy = id => !!id && /^(BOSS_|SUBBOSS_)/.test(id);

let ac = null, master = null, volume = 0.7;
try { const o = JSON.parse(localStorage.getItem(STORE) || 'null'); if (o && typeof o.music === 'number') volume = Math.max(0, Math.min(1, o.music)); } catch (e) { /* défaut */ }
const bufs = {};            // id → AudioBuffer | 'fail' | 'loading'
let cur = null;             
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
  mapReady.then(() => (USE_PERSONAL_MUSIC ? fetchOgg(PERSO(id)).catch(() => fetchOgg(FREE(id))) : fetchOgg(FREE(id)))
    .then(a => new Promise((res, rej) => ac.decodeAudioData(a, res, rej)))
    .then(b => { bufs[id] = b; }).catch(() => { bufs[id] = 'fail'; }));
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


function stopCur(fade) {
  if (!cur) return;
  fadeOut(cur, fade);
  cur = null;
}

export const Music = {
  unlock() { ensure(); },
  getVolume: () => volume,
  setVolume(v) {
    volume = Math.max(0, Math.min(1, v)); if (master) master.gain.value = volume;
    try { const o = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; o.music = volume; localStorage.setItem(STORE, JSON.stringify(o)); } catch (e) { /* rien */ }
  },
  prefetch(ids) {
    if (!ensure()) return; ids.forEach(load);
  },
  // piste voulue par le contexte ; appelée à chaque image
  direct(id, tempo = 1) {
    want = id; wantTempo = tempo;
    if (!ensure() || jingle) return;
    if (cur && cur.id === id) { if (cur.src && cur.src.playbackRate.value !== tempo) cur.src.playbackRate.setTargetAtTime(tempo, ac.currentTime, 0.3); return; }
    if (!id) { stopCur(1); return; }
    load(id);
    if (bufs[id] === 'fail') { stopCur(1); return; } // piste absente : silence
    if (!(bufs[id] instanceof AudioBuffer)) return; // en cours de chargement : l'ancienne piste continue
    const fade = bossy(id) || bossy(cur && cur.id) ? 0.5 : 1.0;
    stopCur(fade); cur = startSrc(id, fade, tempo, true);
  },
  // jingle : coupe la musique, une seule lecture, puis la musique voulue repart en fondu
  playJingle(id) {
    if (!ensure()) return;
    load(id);
    const go = () => {
      if (!(bufs[id] instanceof AudioBuffer)) return;
      stopCur(0.25);
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
  if (ui.screen === 'title' && !ui.controls) return Music.direct('INTRO_TITLE'); // intro : boucle jusqu'à « Nouvelle partie » / « Continuer »
  if (ui.controls || !g || !g.world) return Music.direct('HUB_MAIN');
  if (g.mapIdx !== lastMap) { lastMap = g.mapIdx; Music.prefetch([`MAP_${g.world.def.mus || g.mapIdx + 1}`, BOSS_TRACK[g.world.def.boss], g.world.def.boss === 'mewtwo' ? 'BOSS_MEWTWO_P2' : null, 'MINIBOSS_A', 'MINIBOSS_B'].filter(Boolean)); }
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
  return Music.direct(`MAP_${g.world.def.mus || g.mapIdx + 1}`);
}
