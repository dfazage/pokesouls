"""Mini-peintre de tuiles pixel art (sol, murs, décors posés au sol).
Chaque tuile porte une carte de hauteur H, un albédo C, une opacité A et une couche émissive E/EA.
Le rendu éclaire H par une lumière haut-gauche (pentes), ajoute de l'occlusion ambiante dans les creux
(les interstices entre dalles deviennent sombres, leur lèvre haute accroche la lumière), puis quantifie
sur une rampe de teintes décalées avec un tramage de Bayer léger : même grammaire visuelle que les props."""
import numpy as np
from PIL import Image, ImageDraw

BAYER = (np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) + 0.5) / 16 - 0.5


def hexrgb(h):
    if not isinstance(h, str): return tuple(float(v) for v in h)
    h = h.lstrip('#'); return tuple(float(int(h[i:i + 2], 16)) for i in (0, 2, 4))


def mix(a, b, t):
    a = np.asarray(a, float); b = np.asarray(b, float)
    return a + (b - a) * t


def _vnoise(w, h, scale, seed):
    r = np.random.RandomState(seed)
    gw, gh = int(w / scale) + 3, int(h / scale) + 3; g = r.rand(gh, gw)
    ys, xs = np.mgrid[0:h, 0:w]; gx = xs / scale; gy = ys / scale; x0 = gx.astype(int); y0 = gy.astype(int); fx = gx - x0; fy = gy - y0
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy)
    a = g[y0, x0]; b = g[y0, x0 + 1]; c = g[y0 + 1, x0]; d = g[y0 + 1, x0 + 1]
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy


def _blur(a, r=2, mode='edge'):
    k = 2 * r + 1; p = np.pad(a, r, mode=mode); out = np.zeros_like(a)
    for dy in range(k):
        for dx in range(k): out += p[dy:dy + a.shape[0], dx:dx + a.shape[1]]
    return out / (k * k)


class Look:
    """Paramètres d'éclairage d'une matière / d'un thème."""
    def __init__(self, shadow=(22, 20, 44), light=(255, 238, 205), dark=0.58, lite=0.34, n=5, gain=1.0, ao=1.0, grain=0.035, dither=0.8, calm=1.0):
        self.shadow = shadow; self.light = light; self.dark = dark; self.lite = lite; self.n = n; self.gain = gain; self.ao = ao
        self.grain = grain; self.dither = dither; self.calm = calm


class Tile:
    def __init__(self, w=24, h=24, seed=1, base=None, opaque=True, wrap=True):
        self.w, self.h, self.seed, self.wrap = w, h, seed, wrap
        self.rng = np.random.RandomState(seed)
        self.H = np.zeros((h, w)); self.C = np.zeros((h, w, 3)); self.A = np.ones((h, w)) if opaque else np.zeros((h, w))
        self.E = np.zeros((h, w, 3)); self.EA = np.zeros((h, w)); self.dv = np.zeros((h, w))
        self.X, self.Y = np.meshgrid(np.arange(w), np.arange(h))
        if base is not None: self.C[:] = hexrgb(base)

    # ---- masques ----
    def m_rect(self, x0, y0, x1, y1):
        m = np.zeros((self.h, self.w), bool); m[max(0, int(y0)):max(0, int(y1)), max(0, int(x0)):max(0, int(x1))] = True; return m

    def _draw(self, fn):
        im = Image.new('L', (self.w, self.h), 0); fn(ImageDraw.Draw(im)); return np.array(im) > 0

    def m_line(self, pts, wd=1):
        return self._draw(lambda d: d.line([(int(round(x)), int(round(y))) for x, y in pts], fill=255, width=wd))

    def m_poly(self, pts): return self._draw(lambda d: d.polygon([(float(x), float(y)) for x, y in pts], fill=255))

    def m_ell(self, cx, cy, rx, ry):
        m = ((self.X + 0.5 - cx) / max(rx, 0.3)) ** 2 + ((self.Y + 0.5 - cy) / max(ry, 0.3)) ** 2 <= 1.0; return m

    def m_noise(self, thr, scale=3.0, seed=0, base=None):
        n = _vnoise(self.w, self.h, scale, self.seed * 977 + seed); m = n > thr
        return m if base is None else m & base

    # ---- écriture ----
    def set(self, m, h=None, c=None, e=None, ea=1.0, dv=None, a=None, hadd=None):
        if h is not None: self.H[m] = h
        if hadd is not None: self.H[m] += hadd
        if c is not None: self.C[m] = hexrgb(c)
        if e is not None: self.E[m] = hexrgb(e); self.EA[m] = ea
        if dv is not None: self.dv[m] += dv
        if a is not None: self.A[m] = a
        return m

    def shade_color(self, m, k, hshift=None):
        c = self.C[m] * k
        if hshift is not None: c = mix(c, hshift, 0.25)
        self.C[m] = np.clip(c, 0, 255)

    def tint(self, m, col, t):
        self.C[m] = mix(self.C[m], hexrgb(col), t)

    def rect(self, x0, y0, x1, y1, **k): return self.set(self.m_rect(x0, y0, x1, y1), **k)
    def line(self, pts, wd=1, **k): return self.set(self.m_line(pts, wd), **k)
    def poly(self, pts, **k): return self.set(self.m_poly(pts), **k)
    def ell(self, cx, cy, rx, ry, **k): return self.set(self.m_ell(cx, cy, rx, ry), **k)

    def px(self, x, y, **k):
        if 0 <= x < self.w and 0 <= y < self.h:
            m = np.zeros((self.h, self.w), bool); m[int(y), int(x)] = True; self.set(m, **k)

    def scatter(self, n, rng=None, area=None, **k):
        """n pixels aléatoires (x, y entiers) dans area=(x0,y0,x1,y1)."""
        r = rng or self.rng; x0, y0, x1, y1 = area or (0, 0, self.w, self.h)
        for _ in range(n): self.px(int(r.randint(x0, x1)), int(r.randint(y0, y1)), **k)

    def plate(self, x0, y0, x1, y1, h=0.0, bevel=0.22, c=None):
        """Dalle surélevée : cœur à la hauteur h, anneau d'un pixel plus bas (pente -> lumière à gauche/haut, ombre à droite/bas)."""
        self.rect(x0, y0, x1, y1, h=h - bevel, c=c)
        self.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, h=h)

    def gap(self, x0, y0, x1, y1, depth=-1.0, k=0.55):
        m = self.m_rect(x0, y0, x1, y1); self.H[m] = depth; self.C[m] *= k; return m

    def crack(self, pts, depth=-0.7, k=0.5, wd=1, e=None, ea=0.9):
        m = self.m_line(pts, wd); self.H[m] = depth; self.C[m] *= k
        if e is not None: self.E[m] = hexrgb(e); self.EA[m] = ea
        return m

    def grain(self, amt=6, seed=0):
        n = _vnoise(self.w, self.h, 1.5, self.seed * 31 + seed) - 0.5
        self.C = np.clip(self.C + n[..., None] * amt * 2, 0, 255)

    def mottle(self, amt=10, scale=5.0, seed=0):
        n = _vnoise(self.w, self.h, scale, self.seed * 53 + seed) - 0.5
        self.C = np.clip(self.C + n[..., None] * amt * 2, 0, 255)

    # ---- rendu ----
    def render(self, look=None):
        L = look or Look(); H = self.H
        pm = 'wrap' if self.wrap else 'edge'; Hp = np.pad(H, 1, mode=pm)
        hx = (Hp[1:-1, 2:] - Hp[1:-1, :-2]) / 2; hy = (Hp[2:, 1:-1] - Hp[:-2, 1:-1]) / 2
        sl = 0.50 * hx + 0.72 * hy
        ao = np.clip(_blur(H, 2, pm) - H, 0, 1.2)
        gn = (_vnoise(self.w, self.h, 1.2, self.seed * 7) - 0.5)
        v = 0.5 + L.gain * L.calm * sl * 1.25 - L.ao * L.calm * ao * 1.35 + self.dv * L.calm + gn * L.grain * 2
        # tramage de Bayer 4x4 : adoucit les transitions de la rampe
        by = BAYER[np.arange(self.h)[:, None] % 4, np.arange(self.w)[None, :] % 4]
        lv = np.clip(v, 0, 1) * (L.n - 1) + by * L.dither
        idx = np.clip(np.floor(lv + 0.5), 0, L.n - 1); t = (idx / (L.n - 1))[..., None]
        C = self.C
        dark = mix(C, L.shadow, L.dark); light = mix(C, L.light, L.lite)
        col = np.where(t < 0.5, mix(dark, C, t / 0.5), mix(C, light, (t - 0.5) / 0.5))
        ea = self.EA[..., None]
        col = mix(col, self.E, ea) if ea.any() else col
        rgba = np.concatenate([np.clip(col, 0, 255), (self.A * 255)[..., None]], -1).astype(np.uint8)
        em = np.zeros((self.h, self.w, 4), np.uint8)
        if self.EA.any():
            em[..., :3] = np.clip(self.E, 0, 255).astype(np.uint8); em[..., 3] = np.clip(self.EA * 255, 0, 255).astype(np.uint8)
        return Image.fromarray(rgba, 'RGBA'), Image.fromarray(em, 'RGBA')
