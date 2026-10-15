// Données de jeu : équipe de six classes, ennemis, formules (valeurs de départ, à équilibrer).
export const START_LEVEL = 10;
export const levelCost = n => Math.round(80 * Math.pow(1.13, n)); // GDD section 11
export const hpMult = lvl => 1 + 0.07 * (lvl - START_LEVEL);
export const dmgMult = lvl => 1 + 0.05 * (lvl - START_LEVEL);

export const TEAM = [
  { id: 'lucario', name: 'Lucario', cls: 'Guerrier', hp: 220, speed: 80, mode: 'melee', range: 30, dmg: 16, light: 'Attack', heavy: 'Swing',
    ability: { kind: 'lunge', name: "Charge d'Aura", cost: 18, mult: 2.2, anim: 'Attack' } },
  { id: 'blastoise', name: 'Tortank', cls: 'Gardien', hp: 330, speed: 68, mode: 'melee', range: 28, dmg: 12, light: 'Attack', heavy: 'Swing', guard: 0.18,
    ability: { kind: 'shock', name: 'Onde de choc', cost: 18, mult: 1.6, anim: 'Swing' } },
  { id: 'zoroark', name: 'Zoroark', cls: 'Voleur', hp: 170, speed: 94, mode: 'melee', range: 26, dmg: 10, light: 'Attack', heavy: 'Swing', back: 1.25,
    ability: { kind: 'smoke', name: 'Pas de fumée', cost: 18, mult: 1.9, anim: 'Attack' } },
  { id: 'decidueye', name: 'Dardargnan', cls: 'Rôdeur', hp: 160, speed: 82, mode: 'ranged', range: 120, dmg: 11, light: 'Shoot', heavy: 'Shoot',
    ability: { kind: 'volley', name: 'Volée', cost: 18, mult: 0.85, anim: 'Shoot' } },
  { id: 'alakazam', name: 'Alakazam', cls: 'Mage', hp: 130, speed: 76, mode: 'ranged', range: 130, dmg: 14, light: 'Shoot', heavy: 'Shoot', orb: '#e8a0ff',
    ability: { kind: 'burst', name: 'Psyko', cost: 18, mult: 2.4, anim: 'Shoot' } },
  { id: 'gardevoir', name: 'Gardevoir', cls: 'Clerc', hp: 150, speed: 76, mode: 'ranged', range: 110, dmg: 8, light: 'Shoot', heavy: 'Shoot', orb: '#ffb0d8',
    ability: { kind: 'heal', name: 'Soin de zone', cost: 18, mult: 0.35, anim: 'Shoot' } },
];
export const TEAM_BY_ID = Object.fromEntries(TEAM.map(t => [t.id, t]));

export const ENEMIES = {
  magnemite: { name: 'Magnéti', lv: 28, hp: 42, r: 6, speed: 40, essence: 38, kind: 'ranged', sight: 130, range: 100, windup: 0.62, anim: 'Shoot', dmg: 15, proj: 105, fly: true, color: '#8ef0ff', rec: 1.3 },
  koffing: { name: 'Smogo', lv: 29, hp: 78, r: 7, speed: 46, essence: 52, kind: 'melee', sight: 120, range: 22, windup: 0.5, anim: 'Attack', dmg: 20, fly: true, lunge: 150, rec: 0.9 },
  voltorb: { name: 'Voltorbe', lv: 30, hp: 32, r: 6, speed: 98, essence: 45, kind: 'bomb', sight: 60, range: 18, windup: 0.75, anim: 'Attack', dmg: 34, blast: 46, dormant: true },
  electrode: { name: 'Électrode Alpha', lv: 33, hp: 520, r: 10, scale: 1.7, speed: 62, essence: 650, kind: 'roller', sight: 150, range: 70, windup: 0.7, anim: 'Attack', dmg: 36, mini: true, elite: true, armor: true },
  porygon: { name: 'Porygon', lv: 33, hp: 190, r: 7, speed: 56, essence: 190, kind: 'ranged3', sight: 150, range: 105, windup: 0.66, anim: 'Shoot', dmg: 13, proj: 120, elite: true, armor: true, color: '#ff9acb', rec: 1.0 },
  clone: { name: 'Clone de Mewtwo', lv: 36, hp: 30, r: 7, speed: 0, essence: 0, kind: 'ranged', sight: 400, range: 400, windup: 0.9, anim: 'Shoot', dmg: 20, proj: 120, color: '#c070ff', rec: 2.4, clone: true },
};
export const BOSS = { name: 'MEWTWO', sub: 'Le Cloné', hp: 1800, r: 9, speed: 52, essence: 4000, thresholds: [0.6, 0.25] };
