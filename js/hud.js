// Interface en jeu (DOM, conception 1280×720, mise à l'échelle par CSS).
import { A } from './assets.js';
import { BOSS_THRESHOLDS, NAMES_FR, STATUS } from './data.js';
import * as M from './maps.js';
import { Controls, keyLabel } from './input.js';

const $ = (s, r = document) => r.querySelector(s);
export const portrait = id => 'assets/' + A.db[id].portrait;

const ROMAN = ['', 'I', 'II', 'III'];
// motifs des écrans de phase (un par boss)
const MOTIF = {
  articuno: '<g stroke="currentColor" stroke-width="5" stroke-linecap="round" fill="none"><path d="M0-90V90M-78-45L78 45M-78 45L78-45"/><path d="M-14-70L0-52L14-70M-14 70L0 52L14 70M-66-22L-46-30L-50-52M66 22L46 30L50 52M-66 22L-46 30L-50 52M66-22L46-30L50-52"/></g><circle r="14" fill="currentColor"/>',
  zapdos: '<path d="M18-92L-40 6H-4L-20 92L44-12H8Z" fill="currentColor"/>',
  moltres: '<path d="M0 92C-62 80-60 20-22-24C-18 8 8 8 4-52C52-14 76 36 62 70C54 88 30 92 0 92Z" fill="currentColor"/><path d="M0 84C-26 78-26 44-8 22C-4 38 12 36 10 6C30 28 36 54 28 70Z" fill="#fff" fill-opacity=".55"/>',
  dragonite: '<g fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"><polygon points="0,-92 80,-46 80,46 0,92 -80,46 -80,-46"/><polygon points="0,-58 50,-29 50,29 0,58 -50,29 -50,-29" stroke-opacity=".6"/></g><path d="M-26 28C-14-34-4-58 0-74C4-58 14-34 26 28C14 14 8 10 0 16C-8 10-14 14-26 28Z" fill="currentColor"/>',
  mewtwo: '<path d="M-96 0C-48-56 48-56 96 0C48 56-48 56-96 0Z" fill="#12081e" stroke="currentColor" stroke-width="5"/><circle r="30" fill="currentColor"/><circle r="15" fill="#fff"/><ellipse rx="5" ry="22" fill="#2a1050"/>',
  mew: '<g fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round"><circle r="86"/><circle r="56" stroke-dasharray="1 9"/></g><circle r="38" fill="currentColor"/><circle r="22" fill="#fff" fill-opacity=".7"/><circle cx="-12" cy="-4" r="5" fill="#2a1050"/><circle cx="12" cy="-4" r="5" fill="#2a1050"/>',
};
export const kl = a => keyLabel(Controls.get(a)[0]);

export function createHud(game) {
  const root = $('#hud');
  root.innerHTML = `
    <div id="chief"><img id="chief-p" alt=""><div class="cinfo"><div class="cname"><b id="chief-n"></b> <span id="chief-c"></span> <i id="chief-l"></i></div>
      <div class="bar hp"><div class="fill" id="chief-hp"></div><span id="chief-hpt"></span></div><div class="bar st"><div class="fill" id="chief-st"></div></div><div id="combo"><i></i><i></i><b id="combo-t">▸</b></div></div></div>
    <div id="party">${game.team.map((t, i) => `<div class="slot t-${t.type}" data-i="${i}"><img alt=""><em>${i + 1}</em><div class="sbar"><div class="fill"></div></div><b class="mu"></b></div>`).join('')}</div>
    <div id="skills"><div class="skill"><kbd id="k-ab"></kbd><b id="ab-n"></b><span id="buff"></span><span id="sbadge"></span><div class="cd"><div class="fill" id="ab-cd"></div></div></div><div class="berries"><kbd id="k-berry"></kbd>Baies <b id="berries"></b></div><div class="berries"><kbd id="k-ether"></kbd>Huile <b id="ethers"></b></div><div class="berries" id="linkbox"><kbd id="k-link"></kbd>Lien <div class="lbar"><div class="fill" id="link-f"></div></div><b id="link-t"></b></div></div>
    <div id="right"><div id="essence"><span>Essence</span> <b id="ess"></b></div><div id="hints"></div></div>
    <div id="boss"><div class="bname"><b id="boss-n"></b> <span id="boss-s"></span></div><div class="bbar"><div class="fill" id="boss-hp"></div>${BOSS_THRESHOLDS.map(t => `<i class="th" style="left:${t * 100}%"></i>`).join('')}</div></div>
    <div id="prompt"><kbd id="k-int"></kbd> <span id="prompt-t"></span></div>
    <div id="toast"></div><div id="area"></div>
    <div id="compass"><div id="arrow">➤</div><span>Sanctuaire</span></div>
    <div id="phasescreen"><div class="pf"></div><div class="pr a"></div><div class="pr b"></div><svg class="pm" viewBox="-100 -100 200 200"></svg><div class="txt"><div class="sub"></div><div class="nm"></div></div><div class="bar t"></div><div class="bar b"></div></div>
    <div id="bossintro"><div class="veil"></div><div class="txt"><div class="sub"></div><div class="nm"></div><div class="ln"></div></div><div class="bar t"></div><div class="bar b"></div></div><div id="banner"></div><div id="fade"></div>`;
  const E = {};
  for (const id of ['chief-p', 'chief-n', 'chief-c', 'chief-l', 'chief-hp', 'chief-hpt', 'chief-st', 'ab-n', 'ab-cd', 'buff', 'berries', 'ess', 'ethers', 'sbadge', 'boss', 'boss-n', 'boss-s', 'boss-hp', 'prompt', 'prompt-t', 'toast', 'area', 'compass', 'arrow', 'banner', 'fade', 'k-ab', 'k-berry', 'k-ether', 'k-link', 'link-f', 'link-t', 'linkbox', 'combo', 'combo-t', 'k-int', 'hints']) E[id] = document.getElementById(id);
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
      { const lk = game.linkT > 0; E['link-f'].style.width = (lk ? 100 * game.linkT / 8 : game.link) + '%'; E.linkbox.classList.toggle('ready', !lk && game.link >= 100); E.linkbox.classList.toggle('on', lk); E['link-t'].textContent = lk ? Math.ceil(game.linkT) + ' s' : game.link >= 100 ? 'PRÊT' : Math.floor(game.link) + ' %'; root.classList.toggle('linking', lk);
        const cb = game.comboN > 0 && game.t - game.comboAt <= 0.5; E.combo.classList.toggle('on', cb || game.comboN > 0 && game.chief().atk); E.combo.dataset.n = game.comboN; E['combo-t'].textContent = game.comboN >= 2 ? 'LOURD !' : ''; }
      { const fx = c.fx ? STATUS[c.fx.k] : null; E.sbadge.textContent = fx ? fx.name.toUpperCase() : ''; E.sbadge.style.background = fx ? fx.color : 'transparent'; }
      slots.forEach((s, k) => { const m = game.team[k]; const im = s.querySelector('img'); if (im.dataset.id !== m.id) { im.dataset.id = m.id; im.src = portrait(m.id); } s.classList.toggle('on', k === i); s.classList.toggle('down', m.exh); s.classList.toggle('cool', game.swapCd > 0 && k !== i); s.querySelector('.fill').style.width = (100 * m.hp / m.maxhp) + '%'; });
      { const mu = game.matchups(); slots.forEach((s2, k) => { const q = mu && mu[k], el = s2.querySelector('.mu'); const t = q ? (q.mult > 1 ? '▲' : q.mult < 1 ? '▼' : '') : ''; if (el.textContent !== t) { el.textContent = t; el.className = 'mu ' + (q && q.mult > 1 ? 'up' : 'dn'); } s2.classList.toggle('react', !!(q && q.react)); }); }
      let b = game.bossActive && game.boss && !game.boss.dead ? game.boss : null, mini = false;
      if (!b) { b = game.enemies.find(e => e.big && !e.dead && e.state !== 'idle' && e.state !== 'dormant' && e.state !== 'return' && Math.hypot(e.x - c.x, e.y - c.y) < 230) || null; mini = !!b; }
      E.boss.classList.toggle('show', !!b); E.boss.classList.toggle('mini', mini);
      if (b) { const nm = mini ? NAMES_FR[b.type].toUpperCase() : b.def.name; if (nm !== bossName) { bossName = nm; E['boss-n'].textContent = nm; E['boss-s'].textContent = mini ? 'Gros Pokémon' : b.def.sub; } E['boss-hp'].style.width = (100 * Math.max(0, b.hp) / b.maxhp) + '%'; }
      const p = game.prompt; E.prompt.classList.toggle('show', !!p); if (p) E['prompt-t'].textContent = p.text;
      const a = game.world.arena, dx = a.cx * M.TS - c.x, dy = a.cy * M.TS - c.y, near = Math.hypot(dx, dy) < 420;
      E.compass.classList.toggle('show', !near && game.lit.size > 0 && !game.prog[game.mapIdx].bossDead); E.arrow.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
      if ((keyT -= dt) <= 0) { keyT = 0.5; E['k-ab'].textContent = kl('ability'); E['k-berry'].textContent = kl('berry'); E['k-ether'].textContent = kl('ether'); E['k-link'].textContent = kl('link'); E['k-int'].textContent = kl('interact'); E.hints.textContent = `${kl('map')} Carte · ${kl('bag')} Sac · ${kl('pause')} Pause / Commandes`; }
      if (toastT > 0 && (toastT -= dt) <= 0) E.toast.classList.remove('show');
      if (bannerT > 0 && (bannerT -= dt) <= 0) E.banner.className = '';
      if (areaT > 0 && (areaT -= dt) <= 0) E.area.classList.remove('show');
    },
    toast(t) { E.toast.textContent = t; E.toast.classList.add('show'); toastT = 2.6; },
    banner(t, kind) { E.banner.textContent = t; E.banner.className = 'show ' + (kind || ''); void E.banner.offsetWidth; E.banner.style.animation = 'none'; void E.banner.offsetWidth; E.banner.style.animation = ''; bannerT = kind === 'death' ? 5 : 3.4; },
    area(z) { E.area.innerHTML = `<small>${z.zone}</small>${z.area}`; E.area.classList.add('show'); areaT = 3.2; },
    bossIntro(b) {
      const el = $('#bossintro', root); el.style.setProperty('--bc', b.def.color || '#e0b0ff'); $('.sub', el).textContent = b.def.sub; $('.nm', el).textContent = b.def.name;
      el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); clearTimeout(hud._bi); hud._bi = setTimeout(() => el.classList.remove('show'), 2900);
    },
    phaseScreen(b, ph) {
      const el = $('#phasescreen', root), col = b.def.color || '#e0b0ff', g = b.def.glow || [255, 255, 255];
      el.style.setProperty('--bc', col); el.style.setProperty('--gl', g.join(','));
      $('.pm', el).innerHTML = MOTIF[b.sprite] || ''; el.dataset.ph = ph;
      $('.sub', el).textContent = 'PHASE ' + ROMAN[ph]; $('.nm', el).textContent = (b.def.phases && b.def.phases[ph - 2]) || '';
      el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); clearTimeout(hud._ps); hud._ps = setTimeout(() => el.classList.remove('show'), 2500);
    },
    fade() { E.fade.classList.add('on'); setTimeout(() => E.fade.classList.remove('on'), 250); },
  };
  return hud;
}
