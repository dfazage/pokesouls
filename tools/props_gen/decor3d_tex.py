#!/usr/bin/env python3
"""Atlas de textures des décors 3D d'Edo (lanterne, torii, cloche… : js/hd2d_decor.js).
Sorties : assets/props/decor3d.png (RGB, albédo) et assets/props/decor3d_e.png (R = émission de la flamme).
Un pixel = 1/24 de tuile, comme le sol. Cellules de 24 × 24 px, de gauche à droite (atlas 144 × 24) — à garder identique dans js/hd2d_shaders.js (DECOR_FRAG) :
  0 pierre (gris, teintée par le thème)     1 laque (gris, teintée : rouge du torii)    2 bois sombre / laque noire
  3 bronze (gris, teinté)                    4 bois clair (charpente de la cloche)       5 lanterne : cadre de pierre + ouverture de la flamme (zone 0..9 × 0..8 px)
Usage : python3 tools/props_gen/decor3d_tex.py"""
import os
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
W, H = 144, 24
img = np.zeros((H, W, 3), np.uint8); emi = np.zeros((H, W, 3), np.uint8)
rng = np.random.RandomState(11)


def px(x, y, c, e=0):
    if 0 <= x < W and 0 <= y < H:
        img[y, x] = c; emi[y, x] = (e, 0, 0)


def gray(v): v = int(np.clip(v, 0, 255)); return (v, v, v)


def stone(ox):                                   # granit : assises décalées, joints sombres, grain
    for by in range(3):
        off = 7 if by % 2 else 0
        for y in range(8):
            for x in range(24):
                v = [128, 150, 168, 140][int(np.clip(1.4 + rng.randn() * .7, 0, 3))]
                if y == 0: v += 26                               # arête haute éclairée
                if y == 7 or (x + off) % 12 == 11: v = 78       # joints
                px(ox + x, by * 8 + y, gray(v))
    for _ in range(10): px(ox + rng.randint(24), rng.randint(24), gray(205))   # éclats
    for _ in range(10): px(ox + rng.randint(24), rng.randint(24), gray(96))


def lacquer(ox):                                  # laque : reflet à gauche, ombre à droite (la colonne tourne autour du poteau), fils verticaux et écaillures
    for x in range(24):
        v = 178
        if 5 <= x <= 8: v = 228
        elif 9 <= x <= 11: v = 200
        elif x >= 18: v = 128
        elif x >= 21: v = 100
        for y in range(24):
            w = v + (rng.randn() * 5 if rng.rand() < .35 else 0)
            if (x * 7 + y // 6 * 3) % 11 == 0: w -= 14
            px(ox + x, y, gray(w))
    for _ in range(14):                           # laque écaillée
        x, y = rng.randint(24), rng.randint(24); px(ox + x, y, gray(70)); px(ox + x, min(23, y + 1), gray(90))


def dark_wood(ox):
    base = [(26, 20, 18), (38, 29, 25), (52, 40, 33), (70, 55, 44)]
    for y in range(24):
        for x in range(24):
            c = base[1]
            if y % 6 == 0: c = base[3]
            elif y % 6 == 5: c = base[0]
            elif ((x + (y // 6) * 9) % 13) == 0: c = base[0]
            elif rng.rand() < .12: c = base[2]
            px(ox + x, y, c)


def bronze(ox):                                   # bronze : bandes horizontales, patine en taches
    for y in range(24):
        for x in range(24):
            v = 150 + 22 * np.sin(y * .5) + rng.randn() * 8
            if x < 5: v += 40
            elif x > 18: v -= 36
            if y % 8 == 0: v -= 40
            px(ox + x, y, gray(v))
    for _ in range(12):
        x, y = rng.randint(22), rng.randint(22)
        for dx in range(2):
            for dy in range(2): px(ox + x + dx, y + dy, gray(110))


def wood(ox):
    W_ = [(60, 40, 28), (82, 56, 38), (108, 76, 52), (132, 96, 66)]
    for y in range(24):
        for x in range(24):
            c = W_[1]
            if y % 6 == 0: c = W_[3]
            elif y % 6 == 5: c = W_[0]
            elif ((x + (y // 6) * 7) % 11) == 0: c = W_[0]
            elif rng.rand() < .15: c = W_[2]
            px(ox + x, y, c)


def lantern_box(ox):                              # face de la lanterne (9 × 8 px = 3/8 × 1/3 de tuile) : cadre de pierre + ouverture + flamme
    for y in range(24):
        for x in range(24): px(ox + x, y, gray(140 + (18 if y == 0 else 0)))
    for y in range(8):
        for x in range(9):
            if x in (0, 8) or y in (0, 7): px(ox + x, y, gray(110 if x == 8 or y == 7 else 170))
    for y in range(1, 7):
        for x in range(1, 8):
            core = abs(x - 4) <= 1 and 2 <= y <= 5
            c = (255, 232, 140) if core else (255, 150, 52) if (abs(x - 4) <= 2 and 1 <= y <= 6) else (150, 60, 24)
            px(ox + x, y, c, e=255 if core else 190)


def main():
    stone(0); lacquer(24); dark_wood(48); bronze(72); wood(96); lantern_box(120)
    out = os.path.join(ROOT, 'assets', 'props')
    Image.fromarray(img, 'RGB').save(os.path.join(out, 'decor3d.png'), optimize=True)
    Image.fromarray(emi, 'RGB').save(os.path.join(out, 'decor3d_e.png'), optimize=True)
    Image.fromarray(img, 'RGB').resize((W * 6, H * 6), Image.NEAREST).save('/tmp/decor3d_prev.png')
    print('ok', W, H)


if __name__ == '__main__':
    main()
