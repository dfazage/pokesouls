// Interface en DOM (conception 1280×720, mise à l'échelle par CSS).
import { A } from './assets.js';
import { TEAM, BOSS, levelCost, hpMult } from './data.js';
import * as M from './map.js';

const $ = (s, r = document) => r.querySelector(s);
const ORDERS = { focus: 'Focus', garde: 'Garde', repli: 'Repli' };
const portrait = id => 'assets/' + A.db[id].portrait;

export function createHud(game) {
  const root = $('#hud');
  root.innerHTML = `
    <div id="chief"><img id="chief-p" alt=""><div class="cinfo"><div class="cname"><b id="chief-n"></b> <span id="chief-c"></span> <i id="chief-l"></i></div>
      <div class="bar hp"><div class="fill" id="chief-hp"></div><span id="chief-hpt"></span></div><div class="bar st"><div class="fill" id="chief-st"></div></div></div></div>
    <div id="party">${TEAM.map((t, i) => `<div class="slot" data-i="${i}"><img src="${portrait(t.id)}" alt=""><em>${i + 1}</em><div class="sbar"><div class="fill"></div></div></div>`).join('')}</div>
    <div id="skills"><div class="skill"><kbd>L</kbd><b id="ab-n"></b><div class="cd"><div class="fill" id="ab-cd"></div></div></div><div class="berries"><kbd>R</kbd>Baies <b id="berries"></b></div></div>
    <div id="right"><div id="essence"><span>Essence</span> <b id="ess"></b></div><div id="order"><kbd>C</kbd> Ordre : <b id="ord"></b></div></div>
    <div id="boss"><div class="bname"><b>${BOSS.name}</b> <span>${BOSS.sub}</span></div><div class="bbar"><div class="fill" id="boss-hp"></div>${BOSS.thresholds.map(t => `<i style="left:${t * 100}%"></i>`).join('')}</div></div>
    <div id="prompt"><kbd>E</kbd> <span id="prompt-t"></span></div>
    <div id="toast"></div><div id="area"></div>
    <div id="compass"><div id="arrow">➤</div><span>Sanctuaire</span></div>
    <div id="banner"></div><div id="fade"></div>`;
  const E = {};
  for (const id of ['chief-p', 'chief-n', 'chief-c', 'chief-l', 'chief-hp', 'chief-hpt', 'chief-st', 'ab-n', 'ab-cd', 'berries', 'ess', 'ord', 'boss', 'boss-hp', 'prompt', 'prompt-t', 'toast', 'area', 'compass', 'arrow', 'banner', 'fade']) E[id] = document.getElementById(id);
  const slots = [...root.querySelectorAll('.slot')];
  slots.forEach(s => s.addEventListener('click', () => game.switchTo(+s.dataset.i)));
  let lastChief = -1, toastT = 0, bannerT = 0, areaT = 0;
  const arena = M.BONFIRES[0];

  const hud = {
    update(dt) {
      const c = game.chief(), i = c.i;
      if (i !== lastChief) { lastChief = i; E['chief-p'].src = portrait(c.def.id); E['chief-n'].textContent = c.def.name; E['chief-c'].textContent = c.def.cls; E['ab-n'].textContent = c.def.ability.name; }
      E['chief-l'].textContent = 'Niv. ' + c.lvl;
      E['chief-hp'].style.width = (100 * c.hp / c.maxhp) + '%'; E['chief-hpt'].textContent = Math.ceil(c.hp) + ' / ' + c.maxhp;
      E['chief-st'].style.width = (100 * game.stam / game.maxStam) + '%';
      E['ab-cd'].style.width = (100 * (1 - Math.max(0, c.cd) / 4.5)) + '%';
      E['berries'].textContent = '×' + game.berries; E['ess'].textContent = game.essence; E['ord'].textContent = ORDERS[game.order];
      slots.forEach((s, k) => { const m = game.team[k]; s.classList.toggle('on', k === i); s.classList.toggle('down', m.exh); s.querySelector('.fill').style.width = (100 * m.hp / m.maxhp) + '%'; });
      const b = game.bossActive && game.boss && !game.boss.dead ? game.boss : null;
      E.boss.classList.toggle('show', !!b); if (b) E['boss-hp'].style.width = (100 * Math.max(0, b.hp) / b.maxhp) + '%';
      const p = game.prompt; E.prompt.classList.toggle('show', !!p); if (p) E['prompt-t'].textContent = p.text;
      // boussole vers le sanctuaire
      const a = game.world.arena, dx = a.cx * M.TS - c.x, dy = a.cy * M.TS - c.y, near = Math.hypot(dx, dy) < 420;
      E.compass.classList.toggle('show', !near && game.lit.size > 0); E.arrow.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
      if (toastT > 0 && (toastT -= dt) <= 0) E.toast.classList.remove('show');
      if (bannerT > 0 && (bannerT -= dt) <= 0) E.banner.className = '';
      if (areaT > 0 && (areaT -= dt) <= 0) E.area.classList.remove('show');
    },
    toast(t) { E.toast.textContent = t; E.toast.classList.add('show'); toastT = 2.2; },
    banner(t, kind) { E.banner.textContent = t; E.banner.className = 'show ' + (kind || ''); void E.banner.offsetWidth; E.banner.style.animation = 'none'; void E.banner.offsetWidth; E.banner.style.animation = ''; bannerT = kind === 'death' ? 5 : 3.4; },
    area(z) { E.area.innerHTML = `<small>${z.zone}</small>${z.area}`; E.area.classList.add('show'); areaT = 3.2; },
    fade() { E.fade.classList.add('on'); setTimeout(() => E.fade.classList.remove('on'), 250); },
  };
  return hud;
}

// --- menus (feu de camp, pause) ---
export function showBonfireMenu(game, bonfire, onClose) {
  const m = $('#menu'); m.classList.add('show');
  const render = () => {
    m.innerHTML = `<div class="panel"><h2>${bonfire.name}</h2><p class="sub">Le feu vous accueille. Se reposer soigne l'équipe, recharge les baies et fait revenir les ennemis.</p>
      <div class="essl">Essence : <b>${game.essence}</b></div>
      <div class="lv">${game.team.map((t, i) => { const c = levelCost(t.lvl), ok = game.essence >= c; return `<div class="row"><img src="${portrait(t.def.id)}" alt=""><div><b>${t.def.name}</b> <span>${t.def.cls}</span><small>Niv. ${t.lvl} · PV ${t.maxhp} → ${Math.round(t.def.hp * hpMult(t.lvl + 1))}</small></div><button data-up="${i}" ${ok ? '' : 'disabled'}>Monter · ${c}</button></div>`; }).join('')}</div>
      <div class="act"><button id="m-rest">Se reposer</button><button id="m-close">Repartir</button></div></div>`;
    m.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { game.levelUp(+b.dataset.up); render(); });
    $('#m-rest').onclick = () => { game.rest(); game.last = bonfire.id; game.hudToast('L’équipe se repose'); onClose(); };
    $('#m-close').onclick = onClose;
  };
  render();
}
export function showPauseMenu(game, onResume, onReset) {
  const m = $('#menu'); m.classList.add('show');
  m.innerHTML = `<div class="panel"><h2>Pause</h2>
    <div class="keys"><div><kbd>WASD / ZQSD / flèches</kbd> Déplacement</div><div><kbd>Maj</kbd> Courir</div><div><kbd>Espace</kbd> Esquive</div><div><kbd>J</kbd> / clic gauche Attaque légère</div><div><kbd>K</kbd> / clic droit Attaque lourde</div><div><kbd>L</kbd> Capacité</div><div><kbd>H</kbd> Garde (parade juste après l'appui)</div><div><kbd>E</kbd> Interagir</div><div><kbd>R</kbd> Baie</div><div><kbd>T</kbd> Verrouillage</div><div><kbd>Tab</kbd> / <kbd>1-6</kbd> Changer de chef</div><div><kbd>C</kbd> Ordre des suiveurs</div></div>
    <div class="act"><button id="m-res">Reprendre</button><button id="m-reset" class="warn">Effacer la sauvegarde</button></div></div>`;
  $('#m-res').onclick = onResume; $('#m-reset').onclick = () => { if (confirm('Effacer la sauvegarde et recommencer ?')) onReset(); };
}
export function hideMenu() { const m = $('#menu'); m.classList.remove('show'); m.innerHTML = ''; }
