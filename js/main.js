import { loadAssets } from './assets.js';
import { Input } from './input.js';
import { unlockAudio } from './audio.js';
import { Game, W, H } from './game.js';
import { render } from './render.js';
import { createHud, showBonfireMenu, showPauseMenu, hideMenu } from './hud.js';

const $ = s => document.querySelector(s);
const stage = $('#stage'), canvas = $('#game'), ctx = canvas.getContext('2d');
canvas.width = W; canvas.height = H;
function fit() { const s = Math.min(innerWidth / 1280, innerHeight / 720); stage.style.transform = `translate(-50%,-50%) scale(${s})`; }
addEventListener('resize', fit); fit();

let game = null, hud = null, mode = 'loading', last = 0;

function startGame(fresh) {
  if (fresh) Game.wipe();
  game = new Game(); window.game = game;
  hud = createHud(game);
  game.hudToast = t => hud.toast(t);
  game.emit = (type, a, b) => {
    if (type === 'banner') hud.banner(a, b);
    else if (type === 'toast') hud.toast(a);
    else if (type === 'area') hud.area(a);
    else if (type === 'fade') hud.fade();
    else if (type === 'menu') openMenu(a);
    else if (type === 'bossStart') hud.banner('MEWTWO', 'boss');
    else if (type === 'end') setTimeout(() => $('#end').classList.add('show'), 2500);
  };
  $('#title').classList.remove('show');
  mode = 'play'; game.lastArea = null;
  game.emit('area', { zone: 'Lisière', area: 'Laboratoire oublié' });
}
function openMenu(b) { mode = 'menu'; Input.clear(); showBonfireMenu(game, b, closeMenu); }
function closeMenu() { hideMenu(); mode = 'play'; Input.clear(); }

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  Input.poll();
  if (mode === 'play') {
    if (Input.pressed('pause')) { mode = 'pause'; Input.clear(); showPauseMenu(game, () => { hideMenu(); mode = 'play'; Input.clear(); }, () => { hideMenu(); startGame(true); }); }
    else { game.update(dt); }
  } else if (mode === 'menu') {
    if (Input.pressed('pause') || Input.pressed('interact')) closeMenu();
  } else if (mode === 'pause') {
    if (Input.pressed('pause')) { hideMenu(); mode = 'play'; Input.clear(); }
  }
  if (game) { render(game, ctx); hud.update(dt); }
  Input.endFrame();
  requestAnimationFrame(frame);
}

addEventListener('keydown', e => { if (game && game.dev && /^F[1-5]$/.test(e.code)) { e.preventDefault(); game.devKey(e.code); } });
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => unlockAudio(), { passive: true }));

(async function boot() {
  const bar = $('#load-bar');
  try {
    await loadAssets(p => { bar.style.width = (p * 100) + '%'; });
  } catch (e) { $('#load-t').textContent = 'Erreur de chargement : ' + e.message; throw e; }
  $('#loading').classList.remove('show');
  const probe = (() => { try { return !!localStorage.getItem('pokesouls.mewtwo.v1'); } catch (e) { return false; } })();
  $('#btn-continue').disabled = !probe;
  $('#title').classList.add('show');
  $('#btn-new').onclick = () => startGame(true);
  $('#btn-continue').onclick = () => startGame(false);
  $('#end-close').onclick = () => $('#end').classList.remove('show');
  mode = 'title';
  if (/[?&]autostart/.test(location.search)) startGame(!probe);
  requestAnimationFrame(t => { last = t; frame(t); });
})();
