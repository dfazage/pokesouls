"""Props du laboratoire et de la centrale : cuves de clonage, consoles, miroir de téléportation, générateur."""
import math
import numpy as np
import engine
from engine import Canvas, Mat, hexrgb, mix


def tank(broken=False, t=0.0, seed=1):
    """Cuve de clonage de 2x2 cases (46x76) : socle métallique, verre, liquide vert avec bulles, silhouette d'un clone."""
    c = Canvas(46, 78, seed); cx = 23; TL = engine.TILT
    metal = Mat('#56628a', 5, grain=0.05, dither=0.1); metal_d = Mat('#2e3656', 5, grain=0.04); metal_l = Mat('#8a98c0', 5, grain=0.04)
    glass_back = Mat('#0f3a46', 5, grain=0.03); fluid = Mat('#38d8c0', 6, grain=0.04, dither=0.35, light=(230, 255, 245))
    clone = Mat('#1a8a86', 5, grain=0.05)
    led_on = Mat('#6cf0e0', 3, emissive=True, ramp=['#1a7a74', '#4acaba', '#b8fff4'])
    # socle
    c.box(3, 66, 38, 9, 4, metal, top=metal_l)
    c.rect(5, 70, 41, 71, metal_d); 
    for i in range(5): c.rect(7 + i * 7, 72, 11 + i * 7, 73.5, led_on if (i + int(t * 4)) % 3 else metal_d, emit=0.8)
    c.cylinder(cx, 62, 67, 17, metal_d, cap=metal, cap_ry=3.2, r_bot=18)
    # verre : cylindre ; liquide à l'intérieur
    top = 14; bot = 62; R = 15.2
    c.cylinder(cx, top, bot, R, glass_back, cap=glass_back, cap_ry=4.2, r_bot=R)
    liq_top = top + 8 if not broken else 46
    mask_body = (np.abs(c.X - cx) <= R - 1.2) & (c.Y >= liq_top) & (c.Y <= bot + 1)
    u = (c.X - cx) / (R - 1.2); n = np.stack([u * 0.9, 0 * u + 0.05, np.sqrt(np.clip(1 - u * u, 0, 1))], -1)
    c.put(mask_body, n, fluid)
    # surface du liquide
    sy = liq_top; uu = (c.X - cx) / (R - 1.2); vv = (c.Y - sy) / (3.4 * TL); c.put(uu * uu + vv * vv <= 1, np.array([0, -0.8, 0.6]), fluid)
    # silhouette du clone (forme humanoïde sombre flottante)
    if not broken:
        c.ellipsoid(cx, 33, 4.2, 4.6, clone); c.ellipsoid(cx, 43, 5.4, 8, clone); c.line((cx - 6, 40), (cx - 8, 52), 3.4, clone, taper=0.6); c.line((cx + 6, 40), (cx + 8, 52), 3.4, clone, taper=0.6)
        c.line((cx - 2, 49), (cx - 3, 59), 3.2, clone, taper=0.6); c.line((cx + 2, 49), (cx + 3, 59), 3.2, clone, taper=0.6)
        c.ellipsoid(cx, 37.5, 2.8, 3.4, clone)
        c.rect(cx - 2.4, 31.5, cx - 0.6, 33, led_on, emit=0.5); c.rect(cx + 0.8, 31.5, cx + 2.6, 33, led_on, emit=0.5)
        c.recolor((c.mat == c.mid(clone)), clone)
        nzz = c.noise(2.6, 2); c.shade_mod((c.mat == c.mid(clone)) & (nzz > 0.55), -0.15)
    # reflets verticaux et bulles
    c.shade_mod((np.abs(c.X - (cx - 10.5)) < 1.2) & (c.Y > liq_top + 2) & (c.Y < bot - 3) & (c.mat == c.mid(fluid)), 0.35)
    c.shade_mod((np.abs(c.X - (cx + 11)) < 1.4) & (c.Y > liq_top + 2) & (c.Y < bot - 3) & (c.mat == c.mid(fluid)), -0.25)
    if not broken:
        for k in range(6):
            ph = (t * 1.0 + k * 0.17) % 1; x = cx - 11 + k * 4.5 + math.sin(ph * 6 + k) * 1.4; y = 60 - ph * (60 - liq_top - 3)
            c.pix(int(x), int(y), '#e8fffa'); 
            if k % 2: c.pix(int(x) + 1, int(y) - 1, '#b8fff4', 200)
    # montants métalliques et couvercle
    for dx in (-15.5, 15.5): c.rect(cx + dx - 1.2, top + 1, cx + dx + 1.2, bot, metal, (0.2 if dx < 0 else 0.7, 0, 0.9))
    c.cylinder(cx, 8, 14, 17.8, metal, cap=metal_l, cap_ry=4.8, r_bot=17.4)
    c.cylinder(cx, 4, 8.5, 9, metal_d, cap=metal, cap_ry=2.6)
    c.rect(cx - 1, 0, cx + 1.4, 4, metal_d)                    # antenne / tuyau
    c.line((cx + 12, 9), (cx + 20, 4), 1.8, metal); c.line((cx + 20, 4), (cx + 20, 0), 1.8, metal)
    # tuyaux latéraux
    c.line((cx - 18, 18), (cx - 23, 24), 2.4, metal); c.line((cx - 23, 24), (cx - 23, 62), 2.4, metal); c.line((cx - 23, 62), (cx - 18, 64), 2.4, metal)
    if broken:
        # verre brisé : fissures en étoile, éclats, liquide qui s'écoule
        c.crack([(cx + 6, 20), (cx + 2, 28), (cx + 5, 36), (cx - 1, 46)], -0.5); c.crack([(cx + 2, 28), (cx - 5, 31), (cx - 9, 40)], -0.5); c.crack([(cx + 5, 36), (cx + 11, 42)], -0.5)
        hole = (np.hypot(c.X - (cx - 4), c.Y - 34) < 6.4) & (c.mat >= 0) & (c.Y < 47) & (c.Y > 20); c.mat[hole & (c.X < cx - 1) & (c.Y < 44)] = -1
        for i in range(7): c.poly([(cx - 4 + i * 3, 21 + (i % 2) * 2), (cx - 2 + i * 3, 21 + 2), (cx - 3 + i * 3, 26)], glass_back)
        for k, (x, y) in enumerate(((cx - 14, 74), (cx + 12, 73.5), (cx - 6, 76), (cx + 3, 75))): c.poly([(x, y), (x + 3, y - 2), (x + 4, y + 0.5)], Mat('#7ad8e8', 4, grain=0.03, light=(255, 255, 255)))
        for k in range(3):   # gouttes
            ph = (t + k / 3) % 1; c.pix(int(cx - 8 + k * 0.5), int(48 + ph * 22), '#9ff4e4'); c.pix(int(cx - 8 + k * 0.5), int(49 + ph * 22), '#38d8c0', 200)
        c.mat[(c.mat == c.mid(led_on)) & (np.random.RandomState(4).rand(*c.mat.shape) > 0.5)] = c.mid(metal_d)
        if int(t * 6) % 3 == 0: c.pix(cx + 9, 11, '#fff2a0'); c.pix(cx + 10, 12, '#ffd070'); c.pix(cx + 8, 12, '#ffd070')   # court-circuit
    c.occlude(66, 76, 0.28)
    return c.render()


def console(pal='lab', t=0.0, seed=1):
    """Console de 2x1 case (46x44) : pupitre incliné, écran qui défile, voyants clignotants."""
    c = Canvas(46, 46, seed); TL = engine.TILT
    amber = pal == 'plant'
    body = Mat('#3e4668', 5, grain=0.05, dither=0.1); body_l = Mat('#6a76a0', 5, grain=0.04); body_d = Mat('#222744', 4, grain=0.04)
    scr_c = ('#ffc040', '#ff8a20', '#4a2808') if amber else ('#6cf0b0', '#2ac880', '#0c3a2c')
    screen = Mat(scr_c[1], 5, emissive=True, ramp=[scr_c[2], scr_c[2], scr_c[1], scr_c[0], '#ffffff'])
    key = Mat('#a8b0d0', 4, grain=0.03)
    # pied
    c.box(5, 36, 36, 9, 4, body, top=body_l)
    c.box(3, 33, 40, 4, 3, body_d, top=body_l)
    # pupitre avec clavier incliné
    c.poly([(3, 33), (43, 33), (41, 25 + (1 - TL) * 3), (5, 25 + (1 - TL) * 3)], body_l, nfn=lambda X, Y: np.stack([0 * X, -0.6 + 0 * X, 0.8 + 0 * X], -1))
    for j in range(2):
        for i in range(10): c.rect(8 + i * 3.4, 27.5 + j * 2.6, 10.4 + i * 3.4, 29.2 + j * 2.6, key if (i * 3 + j + int(t * 3)) % 7 else body_d, (0, -0.3, 0.9))
    # écran
    c.box(8, 3, 30, 20, 3, body_d, top=body)
    c.rect(10.2, 5.2, 35.8, 20.8, Mat('#0a1a18' if not amber else '#1a1006', 3), (0, 0, 1))
    for i in range(7):   # lignes de texte qui défilent
        y = 6.6 + ((i * 2.3 + t * 14) % 14.8); w_ = 6 + ((i * 7 + 3) % 5) * 4
        if 6.2 < y < 20.2: c.rect(11.5, y, 11.5 + w_, y + 1, screen, emit=0.75)
    c.rect(11.5, 19.2, 14, 20.2, screen, emit=0.95 if int(t * 4) % 2 == 0 else 0.3)   # curseur
    c.rect(10.2, 5.2, 35.8, 6.2, screen, emit=0.28)    # reflet haut
    # voyants
    for k, (x, col) in enumerate(((36, '#ff5a4a'), (38.8, '#ffd04a'), (41.6, '#5affc0'))):
        on = (int(t * 4) + k) % 3 != 0; c.rect(x - 0.8, 30.3, x + 1, 32, Mat(col, 3, emissive=True, ramp=['#3a1a1a', col, '#ffffff']), emit=0.8 if on else 0.15)
    c.rect(16, 3.6, 17.5, 4.8, key); c.line((38, 3), (41, -1.2), 1.4, body_d)   # antenne
    c.occlude(38, 45, 0.3)
    return c.render()


def mirror(t=0.0, seed=1):
    """Portail-miroir (28x58) : cadre métallique, vitre bleue profonde avec reflet qui balaie, base lumineuse."""
    c = Canvas(30, 60, seed); cx = 15
    frame = Mat('#4a5280', 5, grain=0.05, dither=0.1); frame_l = Mat('#8a96c8', 5, grain=0.04); frame_d = Mat('#222744', 4, grain=0.04)
    glass = Mat('#3a58b0', 5, grain=0.03, dither=0.35, light=(200, 230, 255))
    glow = Mat('#9ac8ff', 4, emissive=True, ramp=['#2a3a90', '#5a88e0', '#a0d0ff', '#ffffff'])
    c.box(2, 54, 26, 5, 4, frame, top=frame_l)
    c.box(3, 4, 24, 50, 3, frame, top=frame_l)
    c.rect(6, 7, 24, 51, glass, (0, 0, 1))
    g_ = (c.Y - 7) / 44; mk = (c.X >= 6) & (c.X < 24) & (c.Y >= 7) & (c.Y < 51)
    c.shade_mod(mk, (0.18 - 0.55 * g_)[mk])
    # reflet diagonal qui balaie
    sweep = ((t * 52) - 14); band = np.abs((c.X - 6) + (c.Y - 7) * 0.45 - sweep) < 2.4; c.shade_mod(mk & band, 0.55); band2 = np.abs((c.X - 6) + (c.Y - 7) * 0.45 - sweep + 6) < 1.0; c.shade_mod(mk & band2, 0.3)
    # silhouette de reflet (une forme bleutée dans la vitre, comme un autre monde)
    c.ellipsoid(cx, 24, 4.6, 5.2, glow, emit=0.22 + 0.08 * math.sin(2 * math.pi * t)); c.ellipsoid(cx, 40, 7, 9, glow, emit=0.2 + 0.08 * math.sin(2 * math.pi * t))
    for k in range(4): c.pix(8 + int((k * 5 + t * 12) % 14), 12 + k * 8, '#ffffff')
    c.rect(3, 4, 27, 6, frame_d); c.rect(3, 51, 27, 54, frame_d)
    for x in (4.5, 25.5): c.rect(x - 0.8, 8, x + 0.8, 50, frame_l)
    c.rect(cx - 3, 0, cx + 3, 4, frame_d); c.rect(cx - 1.2, 1, cx + 1.2, 3, glow, emit=0.7 + 0.2 * math.sin(2 * math.pi * t))
    c.occlude(52, 59, 0.3)
    return c.render()


def generator(t=0.0, seed=1):
    """Générateur de 2x2 cases (46x58) : bloc, bobine, voyants, arc électrique animé."""
    c = Canvas(46, 60, seed); cx = 23; TL = engine.TILT
    body = Mat('#4a4a62', 5, grain=0.06, dither=0.1); body_l = Mat('#7a7a9c', 5, grain=0.05); body_d = Mat('#26263a', 4, grain=0.04)
    yel = Mat('#e8c040', 5, grain=0.05); copper = Mat('#c87848', 5, grain=0.06, dither=0.2)
    arc = Mat('#fff8b0', 4, emissive=True, ramp=['#8a6a10', '#ffd040', '#fff8b0', '#ffffff'])
    cyan = Mat('#7af2e4', 4, emissive=True, ramp=['#1a5a58', '#3ab8aa', '#9ff8ee', '#ffffff'])
    c.box(3, 24, 40, 33, 5, body, top=body_l)
    c.rect(5, 26, 41, 29, body_d)
    for i in range(6): c.rect(5 + i * 6.4, 52, 8 + i * 6.4, 55, yel if i % 2 else body_d)    # chevrons de sécurité
    c.rect(6, 31, 26, 47, body_d)
    for i in range(7): c.rect(7.5, 33 + i * 2, 24.5, 33.9 + i * 2, body, (0, 0, 1))        # grille d'aération
    # voyants
    for k, col in enumerate(('#5affc0', '#ffd04a', '#ff5a4a')):
        on = (int(t * 4) + k) % 4 != 0; c.ellipsoid(32 + k * 4, 36, 1.6, 1.6, Mat(col, 3, emissive=True, ramp=['#2a1a1a', col, '#ffffff']), emit=0.85 if on else 0.15)
    c.rect(30, 42, 42, 48, body_d); c.rect(31, 43, 41, 47, cyan, emit=0.5 + 0.3 * math.sin(2 * math.pi * t))
    # bobine de Tesla : tore de cuivre + électrode
    c.cylinder(cx, 12, 25, 9, copper, cap=copper, cap_ry=3.4, r_bot=11)
    for y in (14, 17.5, 21): c.shade_mod((c.Y >= y) & (c.Y < y + 1.2) & (c.mat == c.mid(copper)), -0.3)
    c.ellipsoid(cx, 9, 8.2, 3.2 * TL + 1, body_l); c.ellipsoid(cx, 6.5, 4.4, 4.4, body_l)
    # arc électrique
    r = np.random.RandomState(int(t * 8) % 5 + 1); px, py = cx + 3, 6
    for seg in range(7):
        nx = px + r.uniform(-4.5, 5.5); ny = py - 5 + r.uniform(-1, 2) if seg < 4 else py - 4
        for i in range(8):
            x = int(px + (nx - px) * i / 8); y = int(py + (ny - py) * i / 8)
            if 0 <= x < 46 and 0 <= y < 60: c.pix(x, y, '#fff8b0'); c.pix(x + 1, y, '#ffd040', 150)
        px, py = nx, ny
        if py < 1: break
    c.pix(cx + 3, 5, '#ffffff'); c.pix(cx + 4, 5, '#ffd040')
    c.line((cx - 6, 27), (cx - 19, 40), 3, body_d); c.line((cx - 19, 40), (cx - 19, 55), 3, body_d)   # câble
    c.occlude(50, 59, 0.3)
    return c.render()
