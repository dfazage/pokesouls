// Vent partagé : le même souffle pousse les feuilles de l'écran, celles du sol et les traînées de vent (px/s, vers la droite).
export const gustAt = tt => 26 + 38 * Math.sin(tt * 0.31) + 22 * Math.sin(tt * 0.83 + 1.7) + 14 * Math.sin(tt * 2.1) * Math.max(0, Math.sin(tt * 0.17));
export const windNow = () => gustAt(performance.now() / 1000);
export const LEAF_COLS = ['#b3121f', '#c91e2a', '#d1262b', '#e2502a', '#e2502a', '#ec8a2e', '#e9b43a'];
// Tour Brûlée : plus de momiji, de la suie, de la cendre et des braises (mêmes rafales que les feuilles)
export const ASH_COLS = ['#1c1917', '#2a2624', '#3a3430', '#4a443e', '#6a645c', '#8c867c', '#b4aea2', '#d8d2c6'];
export const EMBER_COLS = ['#ff5a1c', '#ff8a2a', '#ffb43c', '#ffd66a'];
