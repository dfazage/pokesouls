#!/usr/bin/env python3
"""Génère assets/props/pokeball.png : Poké Ball classique en pixel art (stand-in), 2 frames de 16x20 :
frame 0 = fermée, frame 1 = ouverte (calotte soulevée, lueur). Remplaçable par la feuille de Spriters Resource
sans toucher au code : garder fw/fh/frames dans assets/props.json."""
import math, json, os
from PIL import Image
OUT, FW, FH = os.path.join(os.path.dirname(__file__), '..', 'assets', 'props'), 16, 20
LINE=(24,16,32,255); RED=(216,48,48,255); RED_L=(248,112,96,255); RED_D=(152,24,40,255)
WHT=(248,248,248,255); WHT_S=(204,212,228,255); WHT_D=(148,156,180,255); GLOW=(255,236,150,255); GLOW2=(255,255,230,255)
CX, CY, R = 7.5, 11.5, 6.9

def ball_px(im, ox, oy, half, dy=0):
    """half = 'top' | 'bottom' | 'both' ; dy = décalage vertical de la moitié dessinée"""
    for y in range(FH):
        for x in range(FW):
            dx, dyy = x - CX, y - CY
            d = math.hypot(dx, dyy)
            if d > R: continue
            top = dyy < -0.5; bot = dyy > 0.5; band = not top and not bot
            if half == 'top' and not (top or band and False): 
                if not top: continue
            if half == 'bottom' and not bot: continue
            yy = y + dy
            if not 0 <= yy < FH: continue
            if d > R - 1.0 or band: c = LINE
            elif top: c = RED_L if (dx + dyy < -7.2) else (RED_D if (dx - dyy > 7.5) else RED)
            else: c = WHT_D if (dx - dyy > 5.2 and dx > 2.5) else (WHT_S if dx + dyy > 3.2 else WHT)
            im.putpixel((ox + x, yy), c)
    # bouton central (fermée seulement, géré par l'appelant)

def button(im, ox, oy=0):
    for y in range(FH):
        for x in range(FW):
            d = math.hypot(x - CX, y - CY)
            if d <= 2.6: im.putpixel((ox + x, y), LINE)
            if d <= 1.5: im.putpixel((ox + x, y), WHT if d > 0.8 or x < 7 else WHT_S)
    im.putpixel((ox + 7, 11), WHT); im.putpixel((ox + 6, 10), (255, 255, 255, 255))

im = Image.new('RGBA', (FW * 2, FH), (0, 0, 0, 0))
# frame 0 : fermée
ball_px(im, 0, 0, 'both'); button(im, 0)
# frame 1 : ouverte — coupe blanche en bas, lueur, calotte rouge soulevée de 6 px
ball_px(im, FW, 0, 'bottom')
for x in range(FW):
    for y in (11, 12):
        if math.hypot(x - CX, y - CY) <= R - 1.0: im.putpixel((FW + x, y), GLOW if y == 12 else GLOW2)
for x in range(1, 15):                      # bord de la coupe
    if math.hypot(x - CX, 12 - CY) <= R and math.hypot(x - CX, 12 - CY) > R - 1.0: im.putpixel((FW + x, 12), LINE)
for (x, y) in [(3, 7), (7, 8), (11, 7), (5, 9), (9, 9), (7, 6)]: im.putpixel((FW + x, y), GLOW2)   # étincelles
ball_px(im, FW, 0, 'top', dy=-6)
im.save(os.path.join(OUT, 'pokeball.png'))
print('ok', im.size)
