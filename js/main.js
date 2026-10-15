import { loadDb, loadPortraits, A } from './assets.js';
import { Input } from './input.js';
import { unlockAudio } from './audio.js';
import { Game, W, H } from './game.js';
import { render } from './render.js';
import { createHud } from './hud.js';
import { showStarters, showBonfireMenu, showBag, showTravel, showControls, showPauseMenu, hideMenu } from './ui.js';
import { STARTERS } from './data.js';

const $ = s => document.querySelector(s);
const stage = $('#stage'), canvas = $('#game'), ctx = canvas.getContext('2d');
canvas.width = W; canvas.height = H;
function fit() { const s = Math.min(innerWidth / 1280, innerHeight / 720); stage.style.transform = `translate(-50%,-50%) scale(${s})`; }
addEventListener('resize', fit); fit();

let game = null, hud = null, mode = 'loading', menuKind = null, last = 0;

async function launch(g) {
  game = g; window.game = game;
  $('#title').classList.remove('show'); $('#loading').classList.add('show'); $('#load-t').textContent = 'Chargement de la carte…'; $('#load-bar').style.width = '60%';
  hud = createHud(game);
  game.emit = (type, a, b) => {
    if (type === 'banner') hud.banner(a, b);
    else if (type === 'toast') hud.toast(a);
    else if (type === 'area') hud.area(a);
    else if (type === 'fade') hud.fade();
    else if (type === 'menu') openBonfire(a);
    else if (type === 'bossStart') hud.banner(a.def.name, 'boss');
    else if (type === 'end') setTimeout(() => $('#end').classList.add('show'), 1500);
  };
  await game.start();
  $('#loading').classList.remove('show'); mode = 'play'; Input.clear();
}
async function newGame(choice) {
  Game.wipe(); const g = new Game(); g.newGame(choice);
  await loadPortraits(g.team.flatMap(m => m.line));
  await launch(g);
}
async function resume() { const g = new Game(); if (!g.hasSave) return; await launch(g); }

function closeMenu() { Controls_stop(); hideMenu(); mode = 'play'; menuKind = null; Input.clear(); }
function Controls_stop() { /* l'écran des commandes arrête lui-même l'écoute */ }
function openMenu(kind, fn) { mode = 'menu'; menuKind = kind; Input.clear(); fn(); }
function openBonfire(b) {
  openMenu('bonfire', () => showBonfireMenu(game, b, closeMenu, {
    bag: back => showBag(game, () => showBonfireMenu(game, b, closeMenu, ex(b))),
    travel: () => showTravel(game, () => showBonfireMenu(game, b, closeMenu, ex(b)), goTravel),
  }));
}
const ex = b => ({ bag: () => showBag(game, () => showBonfireMenu(game, b, closeMenu, ex(b))), travel: () => showTravel(game, () => showBonfireMenu(game, b, closeMenu, ex(b)), goTravel) });
function goTravel(i, id) { if (game.travel(i, id)) closeMenu(); else hud.toast('Voyage impossible pour le moment'); }
function openBag() { openMenu('bag', () => showBag(game, closeMenu)); }
function openTravel() { openMenu('travel', () => showTravel(game, closeMenu, goTravel)); }
function openPause() {
  mode = 'pause'; menuKind = 'pause'; Input.clear();
  const back = () => showPauseMenu(game, h);
  const h = { resume: closeMenu, bag: () => showBag(game, back), travel: () => showTravel(game, back, goTravel), keys: () => showControls(back), reset: () => { closeMenu(); newFromTitle(); } };
  back();
}
function newFromTitle() { Game.wipe(); location.href = location.pathname + (game && game.dev ? '?dev' : ''); }

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  Input.poll();
  if (mode === 'play') {
    if (Input.pressed('pause')) openPause();
    else if (Input.pressed('bag') && game.state === 'play') openBag();
    else if (Input.pressed('map') && game.canTravel()) openTravel();
    else game.update(dt);
  } else if (mode === 'menu' || mode === 'pause') {
    if (Input.pressed('pause') || (menuKind === 'bag' && Input.pressed('bag')) || (menuKind === 'travel' && Input.pressed('map')) || (menuKind === 'bonfire' && Input.pressed('interact'))) closeMenu();
  }
  if (game && game.world) { render(game, ctx); hud.update(dt); }
  Input.endFrame();
  requestAnimationFrame(frame);
}

addEventListener('keydown', e => { if (game && game.dev && /^F[1-6]$/.test(e.code)) { e.preventDefault(); game.devKey(e.code); } });
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => unlockAudio(), { passive: true }));

(async function boot() {
  const bar = $('#load-bar');
  try { await loadDb(); bar.style.width = '50%'; await loadPortraits(['fire', 'water', 'grass'].flatMap(t => STARTERS[t].map(l => l[0]))); bar.style.width = '100%'; }
  catch (e) { $('#load-t').textContent = 'Erreur de chargement : ' + e.message; throw e; }
  $('#loading').classList.remove('show');
  const has = Game.exists();
  $('#btn-continue').disabled = !has;
  $('#title').classList.add('show');
  $('#btn-new').onclick = () => { $('#title').classList.remove('show'); showStarters(c => newGame(c)); };
  $('#btn-continue').onclick = () => resume();
  $('#btn-keys').onclick = () => { menu_keys(); };
  $('#end-close').onclick = () => $('#end').classList.remove('show');
  mode = 'title';
  if (/[?&]autostart/.test(location.search)) { if (has) resume(); else newGame({ fire: 0, water: 0, grass: 0 }); }
  requestAnimationFrame(t => { last = t; frame(t); });
})();
function menu_keys() { showControls(() => hideMenu()); }
