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
const qy = (location.search.match(/[?&]yt=([01])/) || [])[1];
// lecture YouTube (lecteur intégré officiel, aucun fichier copié) : active partout par défaut ; ?yt=0 la coupe
export const USE_YOUTUBE = qy ? qy === '1' : true;
let MAP = {};
export const musicMap = () => MAP;
const mapReady = fetch('assets/audio/music_map.json').then(r => r.json()).then(j => { MAP = j; }).catch(() => {});
const FREE = id => `assets/audio/music/${(MAP[id] && MAP[id].fallback_audio) || id.toLowerCase() + '.ogg'}`, PERSO = id => `assets/audio/music_perso/${id.toLowerCase()}.ogg`;
const fetchOgg = url => fetch(url).then(r => { if (!r.ok) throw new Error('absent'); return r.arrayBuffer(); });
const bossy = id => !!id && /^(BOSS_|SUBBOSS_)/.test(id);

let ac = null, master = null, volume = 0.7;
try { const o = JSON.parse(localStorage.getItem(STORE) || 'null'); if (o && typeof o.music === 'number') volume = Math.max(0, Math.min(1, o.music)); } catch (e) { /* défaut */ }
const bufs = {};            // id → AudioBuffer | 'fail' | 'loading'
let cur = null;             // { id, src, gain } ou { id, yt: true, idx }
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


// ---------- lecteurs YouTube A / B (fondus enchaînés) ----------
const yt = { ready: false, started: false, players: [], act: 0, dock: null, pend: null, fail: {} };
const YT_CORNERS = ['br', 'bl', 'tr', 'tl'];
let ytCorner = 'br';
try { const o = JSON.parse(localStorage.getItem(STORE) || 'null'); if (o && YT_CORNERS.includes(o.ytCorner)) ytCorner = o.ytCorner; } catch (e) { /* défaut */ }
function placeDock() {
  const d = yt.dock; if (!d) return; d.style.top = d.style.bottom = d.style.left = d.style.right = 'auto';
  d.style[ytCorner[0] === 'b' ? 'bottom' : 'top'] = '8px'; d.style[ytCorner[1] === 'r' ? 'right' : 'left'] = '8px';
}
function initYT() {
  if (!USE_YOUTUBE || yt.started) return; yt.started = true;
  const d = yt.dock = document.createElement('div'); d.id = 'ytdock';
  d.style.cssText = 'position:fixed;z-index:50;display:flex;flex-direction:column;gap:4px;background:rgba(5,6,16,.92);border:1px solid #3a4468;padding:4px;font:11px ui-monospace,monospace;color:#9aa4c8';
  d.innerHTML = '<div style="display:flex;gap:6px;align-items:center"><span id="ytnow" style="flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:380px">♪ lecteur YouTube</span><button id="ytmove" title="Changer de coin" style="all:unset;cursor:pointer;padding:0 6px;border:1px solid #3a4468">⇄</button></div><div style="display:flex;gap:4px"><div id="yta"></div><div id="ytb"></div></div>';
  document.body.appendChild(d); placeDock();
  d.querySelector('#ytmove').onclick = () => { ytCorner = YT_CORNERS[(YT_CORNERS.indexOf(ytCorner) + 1) % 4]; placeDock(); try { const o = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; o.ytCorner = ytCorner; localStorage.setItem(STORE, JSON.stringify(o)); } catch (e) { /* rien */ } };
  const giveUp = why => { console.warn('[music] YouTube indisponible, repli sur les pistes libres :', why); yt.ready = false; if (yt.dock) yt.dock.remove(); yt.dock = null; yt.dead = true; };
  window.onYouTubeIframeAPIReady = () => {
    let n = 0;
    ['yta', 'ytb'].forEach((id, i) => {
      yt.players[i] = { p: new YT.Player(id, { width: 200, height: 200, playerVars: { playsinline: 1, rel: 0, disablekb: 1, modestbranding: 1 }, events: {
        onReady: () => { if (++n === 2) yt.ready = true; },
        onStateChange: e => ytState(i, e.data),
        onError: e => ytError(i, e.data) } }), v: 0, goal: 0, rate: 1, stop: false };
    });
  };
  const sc = document.createElement('script'); sc.src = 'https://www.youtube.com/iframe_api'; sc.onerror = () => giveUp('API injoignable'); document.head.appendChild(sc);
  setTimeout(() => { if (!yt.ready && !yt.dead) giveUp('délai dépassé'); }, 10000);
  let last = performance.now();
  setInterval(() => {
    const now = performance.now(), dt = (now - last) / 1000; last = now;
    for (const pl of yt.players) {
      if (!pl || !pl.p || !pl.p.setVolume) continue;
      if (pl.v !== pl.goal) { pl.v = pl.v < pl.goal ? Math.min(pl.goal, pl.v + pl.rate * dt) : Math.max(pl.goal, pl.v - pl.rate * dt); }
      try { pl.p.setVolume(Math.round(100 * pl.v * volume)); if (pl.stop && pl.v === 0) { pl.stop = false; pl.p.stopVideo(); } } catch (e) { /* lecteur pas prêt */ }
    }
    if (yt.pend && now - yt.pend.t0 > 7000) { ytFailId(yt.pend.id, 'délai'); try { yt.players[yt.pend.idx].p.stopVideo(); } catch (e) { /* rien */ } yt.pend = null; }
  }, 50);
}
function ytFade(i, goal, sec) { const pl = yt.players[i]; if (!pl) return; pl.goal = goal; pl.rate = 1 / Math.max(0.05, sec); pl.stop = goal === 0; }
function ytFailId(id, why) { yt.fail[id] = true; console.warn('[music] vidéo YouTube indisponible :', id, MAP[id] && MAP[id].youtube, why); }
function ytError(i, code) {
  if (yt.pend && yt.pend.idx === i) { ytFailId(yt.pend.id, 'erreur ' + code); yt.pend = null; }
  else if (cur && cur.yt && cur.idx === i) { ytFailId(cur.id, 'erreur ' + code); cur = null; }
}
function ytState(i, st) {
  const pl = yt.players[i]; if (!pl) return;
  if (st === 1 && yt.pend && yt.pend.idx === i) { // lecture démarrée : fondu enchaîné
    const id = yt.pend.id, fade = bossy(id) || bossy(cur && cur.id) ? 0.5 : 1.0; yt.pend = null;
    stopCur(fade); cur = { id, yt: true, idx: i }; yt.act = i; pl.v = 0; ytFade(i, 1, fade);
    const t = document.getElementById('ytnow'); if (t) t.textContent = '♪ ' + ((MAP[id] && MAP[id].title) || id);
  } else if (st === 0 && cur && cur.yt && cur.idx === i) { // fin de vidéo : retour à start
    const c = MAP[cur.id] || {}; try { pl.p.seekTo(c.start || 0, true); pl.p.playVideo(); } catch (e) { /* rien */ }
  }
}
function ytUsable(id) { const c = MAP[id]; return USE_YOUTUBE && yt.ready && c && c.youtube && !yt.fail[id]; }
function ytPlay(id) {
  const c = MAP[id], idx = 1 - yt.act; if (yt.pend && yt.pend.id === id) return;
  if (yt.pend) { try { yt.players[yt.pend.idx].p.stopVideo(); } catch (e) { /* rien */ } }
  yt.pend = { id, idx, t0: performance.now() };
  const pl = yt.players[idx]; pl.v = 0; pl.goal = 0; pl.stop = false;
  try { pl.p.setVolume(0); pl.p.loadVideoById({ videoId: c.youtube, startSeconds: c.start || 0, endSeconds: c.end || undefined }); } catch (e) { ytFailId(id, 'loadVideoById'); yt.pend = null; }
}
function stopCur(fade) {
  if (!cur) return;
  if (cur.yt) ytFade(cur.idx, 0, fade); else fadeOut(cur, fade);
  cur = null;
}

export const Music = {
  unlock() { ensure(); initYT(); },
  getVolume: () => volume,
  setVolume(v) {
    volume = Math.max(0, Math.min(1, v)); if (master) master.gain.value = volume;
    try { const o = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; o.music = volume; localStorage.setItem(STORE, JSON.stringify(o)); } catch (e) { /* rien */ }
  },
  prefetch(ids) {
    if (!ensure()) return; ids.forEach(load);
    const y = ids.filter(i => ytUsable(i)).pop(); // piste YouTube suivante : mise en file dans le lecteur inactif
    if (y && !yt.pend && !(cur && cur.id === y)) { try { yt.players[1 - yt.act].p.cueVideoById({ videoId: MAP[y].youtube, startSeconds: MAP[y].start || 0 }); } catch (e) { /* rien */ } }
  },
  // piste voulue par le contexte ; appelée à chaque image
  direct(id, tempo = 1) {
    want = id; wantTempo = tempo;
    if (!ensure() || jingle) return;
    if (cur && cur.id === id) { if (cur.src && cur.src.playbackRate.value !== tempo) cur.src.playbackRate.setTargetAtTime(tempo, ac.currentTime, 0.3); return; }
    if (!id) { stopCur(1); return; }
    if (ytUsable(id)) return ytPlay(id);
    if (yt.pend && yt.pend.id !== id) { try { yt.players[yt.pend.idx].p.stopVideo(); } catch (e) { /* rien */ } yt.pend = null; }
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
      stopCur(0.25); if (yt.pend) { try { yt.players[yt.pend.idx].p.stopVideo(); } catch (e) { /* rien */ } yt.pend = null; }
      if (jingle) { try { jingle.src.stop(); } catch (e) { /* rien */ } }
      const j = startSrc(id, 0.02, 1, false); jingle = j;
      j.src.onended = () => { if (jingle === j) jingle = null; };
    };
    if (bufs[id] instanceof AudioBuffer) go(); else if (bufs[id] === 'loading') { const t = setInterval(() => { if (bufs[id] !== 'loading') { clearInterval(t); go(); } }, 50); setTimeout(() => clearInterval(t), 1500); }
  },
  state: () => ({ cur: cur && cur.id, yt: !!(cur && cur.yt), ytReady: yt.ready, fail: Object.keys(yt.fail), jingle: !!jingle, want, vol: volume }),
};

// ---------- chef d'orchestre : choisit la piste selon le contexte (BOSS > MINIBOSS > MAP > HUB > MENU) ----------
let miniOn = false, miniOff = 0, miniAlt = false, miniId = 'MINIBOSS_A', lastMap = -1;
const BOSS_TRACK = { articuno: 'SUBBOSS_BIRDS', zapdos: 'SUBBOSS_BIRDS', moltres: 'SUBBOSS_BIRDS', dragonite: 'SUBBOSS_KINGS', mewtwo: 'BOSS_MEWTWO_P1', mew: 'BOSS_MEW' };
export function directMusic(g, ui, dt) {
  if (ui.screen === 'starters') return Music.direct('MENU_STARTER');
  if (ui.screen === 'title' && !ui.controls) return Music.direct('INTRO_TITLE'); // intro : boucle jusqu'à « Nouvelle partie » / « Continuer »
  if (ui.controls || !g || !g.world) return Music.direct('HUB_MAIN');
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
