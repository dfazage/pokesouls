#!/usr/bin/env python3
"""Découpe et recolore les props Edo (automne pourpre) à partir des planches sources.
Usage : python3 -I build_edo.py SRC_DIR OUT_DIR"""
import sys, os, json, colorsys, numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import seg
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
F = {'c4': 'pokemon_tileset_from_public_tiles_by_chaoticcherrycake_d5xdb0y.png',
     'jh': 'dppt_and_hgss_tileset_by_justin8964_dg9nal7.png',
     'red': 'red_autumn_forest_tileset_pokemon_essentials_gen_3_by_certifieddontheshark_dl706n1.png'}
A = {k: seg.load(os.path.join(SRC, v)) for k, v in F.items()}

def rgb2hsv(a):
    r, g, b = [a[..., i].astype(np.float32) / 255 for i in range(3)]
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b); d = mx - mn
    h = np.zeros_like(mx); nz = d > 1e-6
    rc = (mx == r) & nz; gc = (mx == g) & nz & ~rc; bc = nz & ~rc & ~gc
    h[rc] = ((g - b)[rc] / d[rc]) % 6; h[gc] = (b - r)[gc] / d[gc] + 2; h[bc] = (r - g)[bc] / d[bc] + 4
    return h * 60, np.where(mx > 0, d / np.maximum(mx, 1e-6), 0), mx
def hsv2rgb(h, s, v):
    h = (h % 360) / 60; i = np.floor(h).astype(int) % 6; f = h - np.floor(h)
    p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
    r = np.choose(i, [v, q, p, p, t, v]); g = np.choose(i, [t, v, v, q, p, p]); b = np.choose(i, [p, p, t, v, v, q])
    return np.stack([r, g, b], -1)
def recolor(a, lo, hi, target, keep=0.3, sat=1.0, val=1.0, smin=0.12):
    """Teintes lo..hi -> target (en conservant keep de l'écart de teinte, donc les nuances d'ombre/lumière)."""
    h, s, v = rgb2hsv(a); m = (h >= lo) & (h <= hi) & (s >= smin) & (a[..., 3] > 0)
    c = (lo + hi) / 2; h2 = np.where(m, target + (h - c) * keep, h)
    s2 = np.where(m, np.clip(s * sat, 0, 1), s); v2 = np.where(m, np.clip(v * val, 0, 1), v)
    o = a.copy(); o[..., :3] = (hsv2rgb(h2, s2, v2) * 255 + .5).astype(np.uint8); return o
def trim(a):
    ys, xs = np.where(a[..., 3] > 0); return a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
from scipy import ndimage as ndi
def unchecker(a):
    # faux damier de la planche Gen 5 : gris exacts (220) et (167), supprimés par remplissage depuis le bord
    m = np.isin(a[..., 0], (220, 167)) & (a[..., 0] == a[..., 1]) & (a[..., 1] == a[..., 2])
    lab, n = ndi.label(m); border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border)); a = a.copy(); a[bg] = 0; return a
def biggest(a, dil=1):
    lab, n = ndi.label(ndi.binary_dilation(a[..., 3] > 0, iterations=dil), structure=np.ones((3, 3)))
    if n < 2: return a
    sizes = ndi.sum(a[..., 3] > 0, lab, range(1, n + 1)); keep = lab == (1 + int(np.argmax(sizes)))
    o = a.copy(); o[~keep] = 0; return o
def crop(k, box, clean=False):
    c = A[k][box[1]:box[3], box[0]:box[2]].copy()
    if k == 'jh': c = unchecker(c)
    if clean: c = biggest(c)
    return trim(c)
GREEN = (45, 175)
def trunk(a, rows=10):
    # troncs gris-rose de certains feuillus : on les ramène à un brun chaud pour qu'ils tiennent avec le feuillage rouge
    h, sat, v = rgb2hsv(a); y = np.arange(a.shape[0])[:, None] >= a.shape[0] - rows
    m = y & (a[..., 3] > 0) & ~(((h >= 325) | (h <= 45)) & (sat > .3))
    h2 = np.where(m, 20, h); s2 = np.where(m, np.maximum(sat, 0.0) * 0 + 0.42, sat); v2 = np.where(m, np.clip(v * 1.15, 0, 1), v)
    o = a.copy(); o[..., :3] = (hsv2rgb(h2, s2, v2) * 255 + .5).astype(np.uint8); return o
def carmin(a): return recolor(a, 255, 330, 350, keep=0.4, sat=1.1, val=1.0)
S = {}   # nom -> (array, note)
def add(name, arr, note=''): S[name] = (arr, note)

# ---------- arbres (planche Gen 4) : feuillage vert -> érables cramoisis, prune, violet ----------
# érables / momiji : les feuillus à feuilles en étoile de la planche Gen 4, teinte poussée du doré au carmin (keep élevé = les nuances de lumière virent à l'orange)
add('momiji_gold', trunk(recolor(crop('c4', (404, 66, 460, 125), True), *GREEN, 34, keep=0.55, sat=2.0, val=1.45, smin=0.03)), 'momiji doré')
add('momiji_vermilion', trunk(recolor(crop('c4', (468, 66, 524, 125), True), *GREEN, 12, keep=0.55, sat=2.0, val=1.45, smin=0.03)), 'momiji vermillon')
add('momiji_red',      trunk(recolor(crop('c4', (532, 66, 588, 125), True), *GREEN, 356, keep=0.5, sat=3.2, val=1.3, smin=0.03)), 'momiji rouge')
add('momiji_carmine',  trunk(recolor(crop('c4', (596, 66, 652, 125), True), *GREEN, 348, keep=0.5, sat=3.0, val=1.75, smin=0.03)), 'momiji carmin sombre')
add('momiji_big',      recolor(crop('c4', (1135, 148, 1218, 257), True), *GREEN, 14, keep=0.45, sat=1.5, val=1.15, smin=0.03), 'grand momiji vermillon')
add('momiji_big2',     recolor(crop('c4', (1423, 148, 1496, 257), True), *GREEN, 356, keep=0.45, sat=1.5, val=1.1, smin=0.03), 'grand momiji carmin')
add('tree_cypress',    recolor(crop('c4', (212, 63, 267, 127), True), *GREEN, 348, keep=0.5, sat=1.1, val=0.85), 'cyprès vin sombre')
for i, (x0, x1) in enumerate([(1456, 1502), (1504, 1550)]):
    c = crop('c4', (x0, 0, x1 + 1, 49)); add(f'tree_autumn{i}', recolor(c, 0, 360, 0, keep=1.0, smin=2) if False else c, 'érable natif')
add('tree_red_a', crop('red', (30, 226, 128, 322), True), 'pack automne : arbre rond')
add('tree_red_b', crop('red', (162, 222, 256, 322), True), 'pack automne : arbre dôme')
add('bush_red_a', crop('red', (0, 335, 96, 384), True), 'pack automne : buisson')
add('bush_red_b', crop('red', (100, 335, 193, 384), True), 'pack automne : buisson 2')
# ---------- bâtiments ----------
add('pagoda_purple', carmin(crop('jh', (2947, 1025, 3054, 1216), True)), 'pagode pourpre 3 étages (Gen 5)')
add('temple_purple', carmin(crop('jh', (2785, 1032, 2928, 1120), True)), 'temple long à toit pourpre')
add('house_purple',  carmin(crop('jh', (2720, 1049, 2785, 1120), True)), 'maison à pignon pourpre')
add('hut_thatch',    crop('jh', (2800, 1207, 2865, 1280), True), 'hutte de chaume')
pb = crop('c4', (539, 2037, 628, 2207), True); add('pagoda_blue', recolor(pb, 190, 270, 350, keep=0.5, sat=1.1), 'pagode bleue -> violet')
add('pagoda_5f',   crop('c4', (320, 1968, 431, 2193), True), 'pagode à 5 étages, toit ardoise')
add('roof_slate',  crop('c4', (208, 1983, 318, 2092), True), 'grand toit ardoise')
add('shrine_red',  crop('c4', (206, 2109, 306, 2193), True), 'bâtiment laqué rouge')
add('hut_small',   crop('c4', (464, 1983, 516, 2049), True), 'petite hutte de bambou')
# ---------- clôtures, piliers, pont ----------
add('fence_log',    crop('c4', (498, 872, 562, 945)), 'palissade en rondins')
add('fence_picket', crop('c4', (562, 893, 606, 946)), 'clôture à piquets')
add('fence_slat',   crop('c4', (607, 893, 659, 946)), 'clôture à lattes')
add('ruin_pillar_a', crop('c4', (864, 893, 897, 960)), 'pilier brisé')
add('ruin_pillar_b', crop('c4', (864, 960, 897, 1026)), 'pilier brisé haut')
add('bridge_red',   crop('c4', (10, 1170, 530, 1350)), 'pont rouge en arc')

# ---------- planche de contrôle ----------
names = list(S); cols = 6; sc = 2; pad = 10
cw = max(max(S[n][0].shape[1] for n in names), 120) * sc + pad; ch = 0
hs = [S[n][0].shape[0] for n in names]
rows = [names[i:i + cols] for i in range(0, len(names), cols)]
rh = [max(S[n][0].shape[0] for n in r) * sc + 34 for r in rows]
W = cols * 300; H = sum(rh) + 20
sheet = Image.new('RGBA', (W, H), (38, 26, 44, 255)); d = ImageDraw.Draw(sheet); y = 10; idx = 0
for r, hgt in zip(rows, rh):
    for j, n in enumerate(r):
        arr, note = S[n]; im = Image.fromarray(arr); sx = j * 300 + 10
        k = sc if arr.shape[1] * sc < 280 else 1
        if k == 1 and arr.shape[1] > 280: im = im.resize((280, int(arr.shape[0] * 280 / arr.shape[1])), Image.NEAREST)
        else: im = im.resize((im.width * k, im.height * k), Image.NEAREST)
        sheet.alpha_composite(im, (sx, y + 16)); d.text((sx, y), f'{idx:02d} {n}  {arr.shape[1]}x{arr.shape[0]}', fill=(255, 226, 170, 255)); idx += 1
    y += hgt
sheet.save(os.path.join(OUT, 'edo_control.png'))
os.makedirs(os.path.join(OUT, 'sprites'), exist_ok=True)
for n, (arr, note) in S.items(): Image.fromarray(arr).save(os.path.join(OUT, 'sprites', n + '.png'))
json.dump({n: {'w': int(S[n][0].shape[1]), 'h': int(S[n][0].shape[0]), 'note': S[n][1]} for n in S}, open(os.path.join(OUT, 'sprites.json'), 'w'), ensure_ascii=False, indent=1)
print(len(S), 'sprites', sheet.size)

# ---------- feuille de jeu : arbres de la Tour Carillon (props.json -> tree_bell) ----------
if len(sys.argv) > 3:
    PACK = [('momiji_gold', 1), ('momiji_vermilion', 1), ('momiji_red', 1), ('momiji_carmine', 1), ('tree_autumn0', 1), ('tree_autumn1', 1),
            ('tree_red_a', .5), ('tree_red_b', .5), ('momiji_big', .5), ('momiji_big2', .5), ('tree_cypress', 1)]   # (sprite, échelle) : l'empreinte d'un arbre fait 2x2 cases (48 px)
    CW, CH = 56, 64; COLS = 6; rows_n = (len(PACK) + COLS - 1) // COLS
    sheet2 = Image.new('RGBA', (CW * COLS, CH * rows_n), (0, 0, 0, 0))
    for i, (n, k) in enumerate(PACK):
        im = Image.fromarray(S[n][0])
        if k != 1: im = im.convert('RGBa').resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS).convert('RGBA')
        assert im.width <= CW and im.height <= CH, (n, im.size)
        sheet2.alpha_composite(im, ((i % COLS) * CW + (CW - im.width) // 2, (i // COLS) * CH + CH - im.height))   # centré, pieds en bas
    sheet2.save(sys.argv[3]); print('arbres', sheet2.size, 'frames', len(PACK), 'cellule', CW, CH)
