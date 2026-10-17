#!/usr/bin/env python3
"""Atlas de textures des maisons d'Edo (modèles 3D instanciés de hd2d_world.js › geoEdoHouse).
Sorties : assets/props/house.png (RGB, albédo) et assets/props/house_e.png (R = émission des vitres, G = masque « plâtre », teinté par instance).
Un pixel = 1/24 de tuile, comme le sol. Disposition (px, atlas 96 × 96) — à garder identique dans HOUSE_ATLAS (js/hd2d_shaders.js) :
  (0,0)  façade rez A 48×24      (0,24) façade rez B 48×24 (porte, noren)
  (0,48) façade étage A 48×24    (0,72) façade étage B 48×24 (balcon)
  (48,0) tuiles de toit 24×24 (gris : rampe sombre → clair, teintée par uRoofA/B)   (72,0) bois 24×24
  (48,24) soubassement de pierre 24×24      (72,24) tuiles de toit abîmées 24×24
Usage : python3 tools/props_gen/house_tex.py"""
import os
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
W = H = 96
img = np.zeros((H, W, 3), np.uint8); emi = np.zeros((H, W, 3), np.uint8)
rng = np.random.RandomState(7)

WOOD = [(34, 22, 16), (52, 34, 24), (74, 50, 34), (98, 68, 46)]       # sombre → clair
GLASS = [(22, 30, 46), (34, 46, 66)]
PLA = [200, 222, 240, 255]                                              # multiplicateurs de plâtre (× teinte d'instance)


def px(x, y, c, plaster=False, e=0):
    if 0 <= x < W and 0 <= y < H:
        img[y, x] = c; emi[y, x] = (e, 255 if plaster else 0, 0)


def rect(x0, y0, x1, y1, c, **k):
    for y in range(y0, y1):
        for x in range(x0, x1): px(x, y, c, **k)


def plaster(ox, oy, w, h):
    for y in range(h):
        for x in range(w):
            v = PLA[int(np.clip(2 + rng.randn() * 0.55, 0, 3))]
            if y % 6 == 5 and rng.rand() < .35: v = PLA[0]                       # fines fissures horizontales
            px(ox + x, oy + y, (v, v, v), plaster=True)


def post(ox, oy, x, w, h):                                                     # poteau : arête claire à gauche, ombre à droite
    for i in range(w):
        c = WOOD[3] if i == 0 else WOOD[2] if i < w - 1 else WOOD[0]
        rect(ox + x + i, oy, ox + x + i + 1, oy + h, c)
    for y in range(0, h, 5): px(ox + x + 1, oy + y, WOOD[1])                  # veinure


def beam(ox, oy, w, y, t=2):
    rect(ox, oy + y, ox + w, oy + y + 1, WOOD[3]); rect(ox, oy + y + 1, ox + w, oy + y + t, WOOD[1]); rect(ox, oy + y + t, ox + w, oy + y + t + 1, WOOD[0])


def shoji(ox, oy, x0, y0, x1, y1, slats=3, lit=True):
    rect(ox + x0, oy + y0, ox + x1, oy + y1, WOOD[0])                          # cadre
    for y in range(y0 + 1, y1 - 1):
        for x in range(x0 + 1, x1 - 1):
            px(ox + x, oy + y, GLASS[1] if (x + y) % 5 else GLASS[0], e=255 if lit else 0)
    for x in range(x0 + 1 + slats, x1 - 1, slats + 1): rect(ox + x, oy + y0 + 1, ox + x + 1, oy + y1 - 1, WOOD[1])   # treillis (koshi)
    my = (y0 + y1) // 2; rect(ox + x0 + 1, oy + my, ox + x1 - 1, oy + my + 1, WOOD[1])
    rect(ox + x0, oy + y0, ox + x1, oy + y0 + 1, WOOD[3])                      # arête haute éclairée


def wainscot(ox, oy, x0, x1, y0, y1):                                           # soubassement de planches noircies
    for x in range(x0, x1):
        for y in range(y0, y1): px(ox + x, oy + y, WOOD[1] if (x - x0) % 3 else WOOD[0])
    rect(ox + x0, oy + y0, ox + x1, oy + y0 + 1, WOOD[3])


def facade(ox, oy, kind, upper):
    plaster(ox, oy, 48, 24)
    beam(ox, oy, 48, 0, 3)                                                    # linteau
    for x in (0, 22, 45): post(ox, oy, x, 3 if x != 22 else 4, 24)
    if not upper:
        wainscot(ox, oy, 3, 22, 18, 24); wainscot(ox, oy, 26, 45, 18, 24)
        if kind == 0:
            shoji(ox, oy, 5, 5, 20, 17); shoji(ox, oy, 28, 5, 43, 17)
        else:                                                                  # porte coulissante + noren rouge
            rect(ox + 28, oy + 4, ox + 43, oy + 24, WOOD[1])
            for x in range(29, 43, 4): rect(ox + x, oy + 4, ox + x + 1, oy + 24, WOOD[0])
            for y in range(4, 14):
                for x in range(29, 42): px(ox + x, oy + y, (150, 44, 36) if (x // 4 + y // 5) % 5 else (112, 30, 26))
            for x in range(29, 42, 4): rect(ox + x, oy + 4, ox + x + 1, oy + 14, (190, 70, 52))
            rect(ox + 28, oy + 4, ox + 43, oy + 5, WOOD[3])
            shoji(ox, oy, 5, 5, 20, 17)
    else:
        rect(ox + 3, oy + 19, ox + 45, oy + 21, WOOD[2]); rect(ox + 3, oy + 21, ox + 45, oy + 22, WOOD[0])    # garde-corps
        for x in range(4, 45, 3): rect(ox + x, oy + 21, ox + x + 1, oy + 24, WOOD[1])
        if kind == 0:
            shoji(ox, oy, 5, 4, 20, 17, slats=2); shoji(ox, oy, 28, 4, 43, 17, slats=2)
        else:
            shoji(ox, oy, 5, 4, 20, 17, slats=2)
            for y in range(6, 15):
                for x in range(30, 41): px(ox + x, oy + y, (240, 240, 240), plaster=True)
            rect(ox + 36, oy + 7, ox + 38, oy + 14, (150, 44, 36)); rect(ox + 31, oy + 9, ox + 40, oy + 10, (150, 44, 36))   # blason


def roof(ox, oy, worn):
    g = np.zeros((24, 24))
    for r in range(4):
        off = 3 * (r % 2)
        for x in range(24):
            tx = (x + off) % 6
            for y in range(6):
                v = 0.42 + 0.10 * y / 5 + (0.12 if tx in (1, 2) else 0.0) - (0.28 if tx == 5 else 0.0)   # tuile bombée : crête claire, joint sombre
                if y == 5: v -= 0.26                                              # ombre du recouvrement
                if y == 0: v += 0.12
                g[r * 6 + y, x] = v
    g += rng.randn(24, 24) * 0.03
    if worn:
        for _ in range(7):
            x, y = rng.randint(0, 22), rng.randint(0, 22); g[y:y + 2, x:x + rng.randint(2, 5)] = 0.04          # tuiles manquantes
        g -= (rng.rand(24, 24) > .8) * 0.12
    g = np.clip(g, 0, 1)
    for y in range(24):
        for x in range(24): v = int(g[y, x] * 255); px(ox + x, oy + y, (v, v, v))


def wood_tile(ox, oy):
    for y in range(24):
        for x in range(24):
            c = WOOD[1]
            if y % 6 == 0: c = WOOD[3]
            elif y % 6 == 5: c = WOOD[0]
            elif ((x + (y // 6) * 7) % 11) == 0: c = WOOD[0]
            px(ox + x, oy + y, c)


def stone(ox, oy):
    base = [(70, 66, 62), (88, 84, 78), (104, 100, 92), (52, 49, 48)]
    for by in range(3):
        off = 6 if by % 2 else 0
        for y in range(by * 8, by * 8 + 8):
            for x in range(24):
                c = base[1] if rng.rand() > .25 else base[0]
                if y == by * 8: c = base[2]
                elif y == by * 8 + 7 or (x + off) % 12 == 11: c = base[3]
                px(ox + x, oy + y, c)
    for _ in range(14): px(ox + rng.randint(24), oy + rng.randint(24), base[3])


def main():
    facade(0, 0, 0, False); facade(0, 24, 1, False); facade(0, 48, 0, True); facade(0, 72, 1, True)
    roof(48, 0, False); wood_tile(72, 0); stone(48, 24); roof(72, 24, True)
    out = os.path.join(ROOT, 'assets', 'props')
    Image.fromarray(img, 'RGB').save(os.path.join(out, 'house.png'), optimize=True)
    Image.fromarray(emi, 'RGB').save(os.path.join(out, 'house_e.png'), optimize=True)
    prev = Image.fromarray(img, 'RGB').resize((W * 6, H * 6), Image.NEAREST); prev.save('/tmp/house_prev.png')
    print('ok', W, H)


if __name__ == '__main__':
    main()
