// Interface en jeu (DOM, conception 1280×720, mise à l'échelle par CSS).
import { A } from './assets.js';
import { BOSS_THRESHOLDS, NAMES_FR, STATUS } from './data.js';
import * as M from './maps.js';
import { Controls, keyLabel } from './input.js';

const $ = (s, r = document) => r.querySelector(s);
export const portrait = id => 'assets/' + A.db[id].portrait;
export const kl = a => keyLabel(Controls.get(a)[0]);

export function createHud(game) {
  const root = $('#hud');
  root.innerHTML = `
    <div id="chief"><img id="chief-p" alt=""><div class="cinfo"><div class="cname"><b id="chief-n"></b> <span id="chief-c"></span> <i id="chief-l"></i></div>
      <div class="bar hp"><div class="fill" id="chief-hp"></div><span id="chief-hpt"></span></div><div class="bar st"><div class="fill" id="chief-st"></div></div></div></div>
    <div id="party">${game.team.map((t, i) => `<div class="slot t-${t.type}" data-i="${i}"><img alt=""><em>${i + 1}</em><div class="sbar"><div class="fill"></div></div></div>`).join('')}</div>
    <div id="skills"><div class="skill"><kbd id="k-ab"></kbd><b id="ab-n"></b><span id="buff"></span><span id="sbadge"></span><div class="cd"><div class="fill" id="ab-cd"></div></div></div><div class="berries"><kbd id="k-berry"></kbd>Baies <b id="berries"></b></div><div class="berries"><kbd id="k-ether"></kbd>Huile <b id="ethers"></b></div></div>
    <div id="right"><div id="essence"><span>Essence</span> <b id="ess"></b></div><div id="hints"></div></div>
    <div id="boss"><div class="bname"><b id="boss-n"></b> <span id="boss-s"></span></div><div class="bbar"><div class="fill" id="boss-hp"></div>${BOSS_THRESHOLDS.map(t => `<i class="th" style="left:${t * 100}%"></i>`).join('')}</div></div>
    <div id="prompt"><kbd id="k-int"></kbd> <span id="prompt-t"></span></div>
    <div id="toast"></div><div id="area"></div>
    <div id="compass"><div id="arrow">➤</div><span>Sanctuaire</span></div>
    <div id="banner"></div><div id="fade"></div>`;
  const E = {};
  for (const id of ['chief-p', 'chief-n', 'chief-c', 'chief-l', 'chief-hp', 'chief-hpt', 'chief-st', 'ab-n', 'ab-cd', 'buff', 'berries', 'ess', 'ethers', 'sbadge', 'boss', 'boss-n', 'boss-s', 'boss-hp', 'prompt', 'prompt-t', 'toast', 'area', 'compass', 'arrow', 'banner', 'fade', 'k-ab', 'k-berry', 'k-ether', 'k-int', 'hints']) E[id] = document.getElementById(id);
  const slots = [...root.querySelectorAll('.slot')];
  slots.forEach(s => s.addEventListener('click', () => game.switchTo(+s.dataset.i)));
  let lastChief = -1, toastT = 0, bannerT = 0, areaT = 0, keyT = 0, bossName = '';

  const hud = {
    update(dt) {
      const c = game.chief(), i = c.i;
      if (i !== lastChief || E['chief-p'].dataset.id !== c.id) { lastChief = i; E['chief-p'].dataset.id = c.id; E['chief-p'].src = portrait(c.id); E['chief-n'].textContent = c.def.name; E['chief-c'].textContent = c.def.typeName + ' · ' + c.def.cls; E['ab-n'].textContent = c.def.ability.name; }
      E['chief-l'].textContent = 'Niv. ' + c.lvl;
      E['chief-hp'].style.width = (100 * c.hp / c.maxhp) + '%'; E['chief-hpt'].textContent = Math.ceil(c.hp) + ' / ' + c.maxhp;
      E['chief-st'].style.width = (100 * game.stam / game.maxStam) + '%';
      E['ab-cd'].style.width = (100 * (1 - Math.max(0, c.cd) / c.def.ability.cd)) + '%';
      E.buff.textContent = game.buffT > 0 ? '⚔ ' + Math.ceil(game.buffT) + ' s' : '';
      E.berries.textContent = '×' + game.berries + ' / ' + game.maxBerries + (game.bag.candy ? '  ·  Bonbons ×' + game.bag.candy : ''); E.ess.textContent = game.essence;
      E.ethers.textContent = '×' + game.ethers + ' / ' + game.maxEthers;
      { const fx = c.fx ? STATUS[c.fx.k] : null; E.sbadge.textContent = fx ? fx.name.toUpperCase() : ''; E.sbadge.style.background = fx ? fx.color : 'transparent'; }
      slots.forEach((s, k) => { const m = game.team[k]; const im = s.querySelector('img'); if (im.dataset.id !== m.id) { im.dataset.id = m.id; im.src = portrait(m.id); } s.classList.toggle('on', k === i); s.classList.toggle('down', m.exh); s.classList.toggle('cool', game.swapCd > 0 && k !== i); s.querySelector('.fill').style.width = (100 * m.hp / m.maxhp) + '%'; });
      let b = game.bossActive && game.boss && !game.boss.dead ? game.boss : null, mini = false;
      if (!b) { b = game.enemies.find(e => e.big && !e.dead && e.state !== 'idle' && e.state !== 'dormant' && e.state !== 'return' && Math.hypot(e.x - c.x, e.y - c.y) < 230) || null; mini = !!b; }
      E.boss.classList.toggle('show', !!b); E.boss.classList.toggle('mini', mini);
      if (b) { const nm = mini ? NAMES_FR[b.type].toUpperCase() : b.def.name; if (nm !== bossName) { bossName = nm; E['boss-n'].textContent = nm; E['boss-s'].textContent = mini ? 'Gros Pokémon' : b.def.sub; } E['boss-hp'].style.width = (100 * Math.max(0, b.hp) / b.maxhp) + '%'; }
      const p = game.prompt; E.prompt.classList.toggle('show', !!p); if (p) E['prompt-t'].textContent = p.text;
      const a = game.world.arena, dx = a.cx * M.TS - c.x, dy = a.cy * M.TS - c.y, near = Math.hypot(dx, dy) < 420;
      E.compass.classList.toggle('show', !near && game.lit.size > 0 && !game.prog[game.mapIdx].bossDead); E.arrow.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
      if ((keyT -= dt) <= 0) { keyT = 0.5; E['k-ab'].textContent = kl('ability'); E['k-berry'].textContent = kl('berry'); E['k-ether'].textContent = kl('ether'); E['k-int'].textContent = kl('interact'); E.hints.textContent = `${kl('map')} Carte · ${kl('bag')} Sac · ${kl('pause')} Pause / Commandes`; }
      if (toastT > 0 && (toastT -= dt) <= 0) E.toast.classList.remove('show');
      if (bannerT > 0 && (bannerT -= dt) <= 0) E.banner.className = '';
      if (areaT > 0 && (areaT -= dt) <= 0) E.area.classList.remove('show');
    },
    toast(t) { E.toast.textContent = t; E.toast.classList.add('show'); toastT = 2.6; },
    banner(t, kind) { E.banner.textContent = t; E.banner.className = 'show ' + (kind || ''); void E.banner.offsetWidth; E.banner.style.animation = 'none'; void E.banner.offsetWidth; E.banner.style.animation = ''; bannerT = kind === 'death' ? 5 : 3.4; },
    area(z) { E.area.innerHTML = `<small>${z.zone}</small>${z.area}`; E.area.classList.add('show'); areaT = 3.2; },
    fade() { E.fade.classList.add('on'); setTimeout(() => E.fade.classList.remove('on'), 250); },
  };
  return hud;
}
