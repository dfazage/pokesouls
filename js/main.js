import { loadDb, loadPortraits, A } from './assets.js';
import { loadProps } from './props.js';
import { loadItemIcons, itemIconFile } from './items.js';
import { Input } from './input.js';
import { createPadNav } from './padnav.js';
import { unlockAudio } from './audio.js';
import { Game, W, H } from './game.js';
import { render } from './render.js';
import { createHud } from './hud.js';
import { createTutorialUi } from './tutorial.js';
import { showWorlds, showStarters, showDialogue, showReserve, showBonfireMenu, showBag, showTravel, showControls, showCredits, showPauseMenu, hideMenu } from './ui.js';
import { POOL } from './pool.js';
import { Music, directMusic } from './music.js';
import { loadFx } from './fx.js';
import { initTouch } from './touch.js';

const $ = s => document.querySelector(s);
const stage = $('#stage'), canvas = $('#game'), ctx = canvas.getContext('2d');
canvas.width = W; canvas.height = H;
let r3d = null; // rendu HD-2D (module chargé à la demande) ; null = rendu 2D classique
function fit() {
  const s = Math.min(innerWidth / 1280, innerHeight / 720); stage.style.transform = `translate(-50%,-50%) scale(${s})`;
  if (r3d) r3d.setScale(Math.min(2, Math.max(1, Math.round(s * (window.devicePixelRatio || 1) * 2) / 2)));
}
addEventListener('resize', fit); addEventListener('orientationchange', fit); fit();
// HD-2D par défaut ; ?2d force l'ancien rendu. En cas d'échec (WebGL2 absent, erreur), on retombe sur le rendu 2D.
async function initHD2D() {
  if (/[?&]2d\b/.test(location.search) || r3d) return;
  try { const mod = await import('./render3d.js'); r3d = new mod.HD2D(stage, canvas); document.body.classList.add('hd2d'); window.hd2d = r3d; fit(); }
  catch (e) { console.warn('HD-2D indisponible, rendu 2D classique :', e); r3d = null; document.body.classList.remove('hd2d'); }
}
function disableHD2D() { if (!r3d) return; try { r3d.destroy(); } catch (e) { /* ignoré */ } r3d = null; window.hd2d = null; document.body.classList.remove('hd2d'); }
loadFx(); // feuilles d'effets d'attaque, chargées en arrière-plan


// ---- téléphone / tablette : commandes tactiles, installation PWA ----
const qTouch = (location.search.match(/[?&]touch=([01])/) || [])[1];
const touchUi = initTouch(stage);
const setTouch = on => document.body.classList.toggle('touch', on);
setTouch(qTouch ? qTouch === '1' : matchMedia('(pointer: coarse)').matches);
if (!qTouch) addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && !document.body.classList.contains('touch')) setTouch(true); }, { capture: true, passive: true });
const isStandalone = () => matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
let installEvt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; const b = $('#btn-install'); if (b) b.hidden = false; });
addEventListener('appinstalled', () => { installEvt = null; const b = $('#btn-install'); if (b) b.hidden = true; });
if ('serviceWorker' in navigator && (location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(e => console.warn('Service worker :', e)));
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
}
// écran allumé pendant la partie
let wake = null;
const keepAwake = async () => { try { if ('wakeLock' in navigator && !wake && !document.hidden) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch (e) { wake = null; } };
addEventListener('pointerdown', keepAwake, { passive: true });

let game = null, hud = null, mode = 'loading', menuKind = null, last = 0;
const padNav = createPadNav();
let lastPadMode = false;
// braises de l'écran titre
(() => { const box = document.getElementById('embers'); if (!box) return; for (let i = 0; i < 28; i++) { const s = document.createElement('span'), z = 2 + Math.random() * 3.5; s.style.cssText = `left:${500 + Math.random() * 280 | 0}px;width:${z}px;height:${z}px;--dx:${(Math.random() - 0.5) * 260 | 0}px;animation-duration:${4 + Math.random() * 5}s;animation-delay:-${Math.random() * 9}s`; box.appendChild(s); } })();
const ui = { screen: 'title', controls: false, menuKind: null };
const openControls = back => { ui.controls = true; showControls(() => { ui.controls = false; back(); }); };

async function launch(g) {
  game = g; window.game = game;
  $('#title').classList.remove('show'); $('#loading').classList.add('show'); $('#load-t').textContent = 'Chargement de la carte…'; $('#load-bar').style.width = '60%';
  hud = createHud(game);
  game.tutUi = createTutorialUi($('#hud'), game);
  game.emit = (type, a, b, c) => {
    if (type === 'banner') hud.banner(a, b, c ? itemIconFile(c) : null);
    else if (type === 'toast') hud.toast(a, b ? itemIconFile(b) : null);
    else if (type === 'area') hud.area(a);
    else if (type === 'fade') hud.fade();
    else if (type === 'menu') openBonfire(a);
    else if (type === 'dialogue') openMenu('dialogue', () => showDialogue(a.lines, res => { closeMenu(); if (a.done) a.done(res); }));
    else if (type === 'jingle') Music.playJingle(a);
    else if (type === 'bossStart') hud.bossIntro(a);
    else if (type === 'bossPhase') hud.phaseScreen(a, b);
    else if (type === 'bossLine') hud.bossLine(a, b);
    else if (type === 'end' && a) { try { game.save(); } catch (e) { /* sauvegarde best-effort */ } setTimeout(() => { location.href = location.pathname + (game && game.dev ? '?dev' : ''); }, 400); }   // portail de Mew : retour direct à l'écran d'accueil
    else if (type === 'end') setTimeout(() => { const p = $('#end p'); if (p) p.innerHTML = a ? 'Mew est apaisé.<br>Le chapitre est bouclé, les générations suivantes arrivent.' : 'Mewtwo est tombé.<br>Un lieu secret est apparu sur la carte. Les générations suivantes arrivent.'; $('#end').classList.add('show'); }, 1500);
  };
  await game.start(); ui.screen = 'game';
  $('#loading').classList.remove('show'); mode = 'play'; Input.clear();
}
async function newGame(choice) {
  Game.wipe(); const g = new Game(); g.newGame(choice);
  await loadPortraits(g.team.flatMap(m => m.line));
  await launch(g);
}
async function resume() { const g = new Game(); if (!g.hasSave) return; await launch(g); }

function closeMenu() { Controls_stop(); hideMenu(); mode = 'play'; menuKind = null; ui.menuKind = null; Input.clear(); }
function Controls_stop() { /* l'écran des commandes arrête lui-même l'écoute */ }
function openMenu(kind, fn) { mode = 'menu'; menuKind = kind; ui.menuKind = kind; Input.clear(); fn(); }
function openBonfire(b) {
  openMenu('bonfire', () => showBonfireMenu(game, b, closeMenu, {
    bag: back => showBag(game, () => showBonfireMenu(game, b, closeMenu, ex(b))),
    reserve: () => showReserve(game, () => showBonfireMenu(game, b, closeMenu, ex(b))),
    travel: () => showTravel(game, () => showBonfireMenu(game, b, closeMenu, ex(b)), goTravel),
  }));
}
const ex = b => ({ bag: () => showBag(game, () => showBonfireMenu(game, b, closeMenu, ex(b))), reserve: () => showReserve(game, () => showBonfireMenu(game, b, closeMenu, ex(b))), travel: () => showTravel(game, () => showBonfireMenu(game, b, closeMenu, ex(b)), goTravel) });
function goTravel(i, id) { if (game.travel(i, id)) closeMenu(); else hud.toast('Voyage impossible pour le moment'); }
function openBag() { openMenu('bag', () => showBag(game, closeMenu)); }
function openTravel() { openMenu('travel', () => showTravel(game, closeMenu, goTravel)); }
function openPause() {
  mode = 'pause'; menuKind = 'pause'; Input.clear();
  const back = () => showPauseMenu(game, h);
  const h = { resume: closeMenu, bag: () => showBag(game, back), travel: () => showTravel(game, back, goTravel), keys: () => openControls(back), credits: () => showCredits(back), title: () => { closeMenu(); location.href = location.pathname + (game && game.dev ? '?dev' : ''); }, reset: () => { closeMenu(); newFromTitle(); } };
  back();
}
function newFromTitle() { Game.wipe(); location.href = location.pathname + (game && game.dev ? '?dev' : ''); }

function frame(now) {
  if (r3d) r3d.adapt(now - last);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  Input.poll();
  padNav.update(dt); // menus : navigation manette (avant la logique de mode pour qu'un retour « B » ne ferme pas tout le feu de camp)
  if (game && game.tut && !game.tut.done && (Input.pressed('skip') || Input.padEdge(8))) game.skipTutorial();   // Entrée / bouton Moins : passer le tutoriel
  { const pm = Input.usingPad(); if (pm !== lastPadMode) { lastPadMode = pm; if (game && game.tut) game.renderTut(); } } // le tuto réaffiche ses boutons quand on change de périphérique
  if (mode === 'play') {
    if (Input.pressed('pause')) openPause();
    else if (Input.pressed('bag') && game.state === 'play') openBag();
    else if (Input.pressed('map') && game.canTravel() && !game.tut) openTravel();
    else game.update(dt);
  } else if (mode === 'menu' || mode === 'pause') {
    if (Input.pressed('pause') || (menuKind === 'bag' && Input.pressed('bag')) || (menuKind === 'travel' && Input.pressed('map')) || (menuKind === 'bonfire' && Input.pressed('interact'))) closeMenu();
  }
  if (game && game.world) {
    if (r3d) { try { r3d.render(game); } catch (e) { console.error('HD-2D :', e); disableHD2D(); render(game, ctx); } }
    else render(game, ctx);
    hud.update(dt);
  }
  touchUi.update(mode);
  directMusic(game, ui, dt);
  Input.endFrame();
  requestAnimationFrame(frame);
}

document.addEventListener('visibilitychange', () => { if (document.hidden) { if (mode === 'play') openPause(); } else keepAwake(); });
matchMedia('(orientation: portrait)').addEventListener('change', e => { if (e.matches && document.body.classList.contains('touch') && mode === 'play') openPause(); });
addEventListener('keydown', e => { if (game && game.dev && /^F[1-9]$/.test(e.code) && !(e.shiftKey && e.code === 'F8')) { e.preventDefault(); game.devKey(e.code); } });
addEventListener('keydown', e => { if (e.shiftKey && e.code === 'F8') { e.preventDefault(); if (r3d) disableHD2D(); else initHD2D(); } }); // bascule 2D / HD-2D
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => { unlockAudio(); Music.unlock(); }, { passive: true }));

(async function boot() {
  const bar = $('#load-bar');
  try { await loadDb(); await loadProps(); await loadItemIcons(); bar.style.width = '50%'; await loadPortraits([...POOL.map(p => p.key), 'genesect']); bar.style.width = '100%'; }
  catch (e) { $('#load-t').textContent = 'Erreur de chargement : ' + e.message; throw e; }
  $('#loading').classList.remove('show');
  const has = Game.exists();
  $('#btn-continue').disabled = !has;
  $('#title').classList.add('show');
  const toTitle = () => { ui.screen = 'title'; $('#title').classList.add('show'); };
  const toWorlds = () => { ui.screen = 'worlds'; showWorlds(() => { ui.screen = 'starters'; showStarters(c => newGame(c), toWorlds); }, toTitle); };
  $('#btn-new').onclick = () => { $('#title').classList.remove('show'); toWorlds(); };
  $('#btn-continue').onclick = () => resume();
  $('#btn-keys').onclick = () => openControls(() => hideMenu());
  $('#btn-credits').onclick = () => showCredits(() => hideMenu());
  $('#end-close').onclick = () => $('#end').classList.remove('show');
  $('#btn-install').onclick = async () => { if (!installEvt) return; installEvt.prompt(); try { await installEvt.userChoice; } catch (e) { /* ignoré */ } installEvt = null; $('#btn-install').hidden = true; };
  if (document.body.classList.contains('touch')) {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    $('.hint').textContent = ios && !isStandalone() ? 'Pour jouer en plein écran : bouton Partager, puis « Sur l’écran d’accueil ». Stick à gauche, boutons à droite.' : 'Tactile : stick à gauche, boutons d’action à droite. Téléphone en mode paysage.';
  }
  await initHD2D();
  mode = 'title';
  if (/[?&]autostart/.test(location.search)) { if (has) resume(); else newGame(['charmander', 'squirtle', 'bulbasaur']); }
  requestAnimationFrame(t => { last = t; frame(t); });
})();
