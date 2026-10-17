// Fin de combat des boss finaux et secrets : le boss s'affaisse et s'accroupit, dialogue, désagrégation en cendres, puis écran de fin
// (boss final : choix « Suivre l'appel » / « Rester » ; boss secret : épilogue, écran FIN, retour au menu principal).
// Le jeu est verrouillé (barres de cinéma) pendant toute la séquence ; le dialogue passe par l'événement 'dialogue' (le monde est alors figé).
import { ENDINGS } from './endings.js';

const FALL = 2.6;          // chute + posture accroupie avant de parler
const ASH_WAIT = 3.4;      // désagrégation complète avant la bannière

export function installBossOutro(Game, d) {
  const { ASH, setAnim, hasAnim, SFX, M, TS, vw, H, clamp, bossCamOf } = d;
  const P = Game.prototype;

  P.endingOf = function (b) { return ENDINGS[b.sprite] || null; };

  P.startOutro = function (b, end) {
    this.outro = { b, end, t: 0, phase: 'fall', lock: true, bars: 0 };
    b.hold = true; b.st = 99; b.invuln = 99;
    this.projs = this.projs.filter(p => p.team !== 'e'); this.rings = []; this.zones = [];
    this.enemies.forEach(e => { if (e !== b && !e.dead) { e.dead = true; e.deadT = 0.2; } });
    this.team.forEach(m => { m.atk = null; m.dodge = null; });
  };

  // avance la séquence ; renvoie true tant que le joueur n'a pas la main
  P.updateOutro = function (dt) {
    const o = this.outro; if (!o) return false;
    const b = o.b, c = this.chief();
    o.t += dt; o.bars = Math.min(1, o.bars + dt * 1.5);
    for (const m of this.team) this.tickMember(m, dt);
    this.stamTick(dt, false); setAnim(c, 'Idle'); c.at += dt;
    this.outroCam(o);
    if (o.phase === 'fall') {
      if (o.t > 0.25 && !o.cried) { o.cried = true; SFX.death(); this.shake = 6; }
      if (o.t >= FALL) {
        o.phase = 'talk';
        this.emit('dialogue', { lines: o.end.lines.map(l => ({ ...l })), done: () => { o.phase = 'ash'; o.t = 0; b.hold = false; } });
      }
    } else if (o.phase === 'ash') {
      if (o.t >= ASH_WAIT && !o.banner) {
        o.banner = true; this.emit('jingle', 'JINGLE_VICTORY'); this.emit('banner', b.def.name + ' VAINCU', 'victory');
      }
      if (o.t >= ASH_WAIT + 2.2) this.finishOutro();
    }
    return true;
  };

  // caméra de cinéma : plan serré et bas sur le boss accroupi
  P.outroCam = function (o) {
    const b = o.b, c = this.chief(), bc = bossCamOf(b), foc = 0.9, k = Math.min(1, o.t / 1.2);
    this.camFx = { pitch: 40 + (16 - 40) * k, dist: bc.dist + (bc.dist * 0.8 - bc.dist) * k, fov: bc.fov, look: 0.5 + (1.6 - 0.5) * k };
    const fx = c.x + (b.x - c.x) * foc, fy = c.y + (b.y - c.y) * foc - 6 * (1 - foc);
    const W = vw(), tx = clamp(fx - W / 2, 0, M.MW * TS - W), ty = clamp(fy - H / 2, 0, M.MH * TS - H);
    this.cam.x += (tx - this.cam.x) * 0.12; this.cam.y += (ty - this.cam.y) * 0.12;
  };

  P.finishOutro = function () {
    const o = this.outro; if (!o) return;
    const end = o.end; this.outro = null; this.camFx = null;
    this.endingsDone = this.endingsDone || {}; this.endingsDone[o.b.sprite] = true;
    this.buildItems();      // portail / récompense restent disponibles ensuite
    this.save();
    this.emit('outroEnd', end, o.b.sprite);
  };

  // « Suivre l'appel » : on entre dans la carte secrète
  P.followCall = function () { this.enterMap(this.mapIdx + 1, 'start'); };
}
