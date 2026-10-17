"""Mini-moteur de pixel art pour les props : on assemble des volumes (cylindres, boîtes, ellipsoïdes, tubes, polygones),
chacun avec des normales analytiques ; le rendu applique une lumière unique (haut-gauche), un éclairage de rebond,
des rampes de couleurs à teinte décalée, un bruit de grain, un léger tramage, un liseré de lumière et un contour sélectif.
Résultat : un relief cohérent d'un sprite à l'autre, sans dessin à la main."""
import math
import numpy as np
from PIL import Image, ImageDraw

TILT = 1.0   # visibilité des faces du dessus : 1 = caméra d'exploration (40°), ~0,58 = caméra de duel (22°)
PITCH = {'hi': 40.0, 'lo': 22.0}


def set_pitch(name):
    """Choisit l'inclinaison de caméra pour laquelle on dessine : les dessus (cuvettes, toits, chapiteaux) s'amincissent quand la caméra descend."""
    global TILT
    TILT = math.sin(math.radians(PITCH[name])) / math.sin(math.radians(PITCH['hi']))


LIGHT = np.array([-0.52, -0.70, 0.50]); LIGHT /= np.linalg.norm(LIGHT)
BOUNCE = np.array([0.55, 0.55, 0.35]); BOUNCE /= np.linalg.norm(BOUNCE)
BAYER = (np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) + 0.5) / 16 - 0.5


def hexrgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


class Mat:
    """Une matière = une rampe de n tons (ombre froide -> lumière chaude) + paramètres de rendu."""
    def __init__(self, base, n=5, grain=0.0, dither=0.0, shadow=(28, 22, 54), light=(255, 240, 200), dark=0.70, lite=0.55, rim=1, emissive=False, ramp=None, gscale=2.0):
        base = hexrgb(base) if isinstance(base, str) else tuple(base)
        if ramp:
            self.ramp = [hexrgb(c) if isinstance(c, str) else tuple(c) for c in ramp]
        else:
            d = mix(base, shadow, dark); l = mix(base, light, lite); self.ramp = []
            for i in range(n):
                t = i / (n - 1)
                self.ramp.append(mix(d, base, t / 0.5) if t <= 0.5 else mix(base, l, (t - 0.5) / 0.5))
        self.n = len(self.ramp); self.grain = grain; self.dither = dither; self.rim = rim; self.emissive = emissive; self.gscale = gscale


def _noise(w, h, scale, seed):
    r = np.random.RandomState(seed)
    gw, gh = int(w / scale) + 3, int(h / scale) + 3; g = r.rand(gh, gw)
    ys, xs = np.mgrid[0:h, 0:w]; gx = xs / scale; gy = ys / scale; x0 = gx.astype(int); y0 = gy.astype(int); fx = gx - x0; fy = gy - y0
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy)
    a = g[y0, x0]; b = g[y0, x0 + 1]; c = g[y0 + 1, x0]; d = g[y0 + 1, x0 + 1]
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy


class Canvas:
    def __init__(self, w, h, seed=1):
        self.w, self.h, self.seed = w, h, seed
        self.X, self.Y = np.meshgrid(np.arange(w) + 0.5, np.arange(h) + 0.5)
        self.mat = np.full((h, w), -1, int); self.n = np.zeros((h, w, 3)); self.emit = np.zeros((h, w)); self.add = np.zeros((h, w)); self.ao = np.ones((h, w))
        self.mats = []; self.rng = np.random.RandomState(seed); self.over = {}   # over : pixels peints directement (x, y) -> rgba

    # ---- registre et dépôt ----
    def mid(self, m):
        for i, k in enumerate(self.mats):
            if k is m: return i
        self.mats.append(m); return len(self.mats) - 1

    def put(self, mask, n, m, emit=None):
        i = self.mid(m); mask = mask & (self.X >= 0)
        self.mat[mask] = i
        if np.ndim(n) == 1: self.n[mask] = n
        else: self.n[mask] = n[mask]
        self.emit[mask] = 0 if emit is None else (emit[mask] if np.ndim(emit) else emit)
        self.add[mask] = 0
        return mask

    def noise(self, scale=3.0, seed=0): return _noise(self.w, self.h, scale, self.seed * 131 + seed)

    # ---- volumes ----
    def rect(self, x0, y0, x1, y1, m, n=(0, 0, 1), emit=None):
        return self.put((self.X >= x0) & (self.X < x1) & (self.Y >= y0) & (self.Y < y1), np.array(n, float), m, emit)

    def ellipsoid(self, cx, cy, rx, ry, m, emit=None, flat=0.0):
        u = (self.X - cx) / rx; v = (self.Y - cy) / ry; r2 = u * u + v * v; mask = r2 <= 1.0
        nz = np.sqrt(np.clip(1 - r2, 0, 1)); n = np.stack([u, v, nz], -1)
        if flat: n = n * (1 - flat) + np.array([0, 0, 1.0]) * flat
        return self.put(mask, n, m, emit)

    def cylinder(self, cx, ytop, ybot, r, m, cap=None, cap_ry=None, r_bot=None, cap_up=(0, -0.82, 0.57)):
        """Cylindre vertical (ou tronc de cône si r_bot) ; le dessus est une ellipse qui regarde vers le haut."""
        r_bot = r if r_bot is None else r_bot; cap_ry = (r * 0.42 if cap_ry is None else cap_ry) * TILT
        t = np.clip((self.Y - ytop) / max(1e-6, (ybot - ytop)), 0, 1); rr = r + (r_bot - r) * t
        u = (self.X - cx) / np.maximum(rr, 0.5); inside = np.abs(u) <= 1.0
        bulge = cap_ry * (r_bot / r if r else 1) * np.sqrt(np.clip(1 - u * u, 0, 1))
        mask = inside & (self.Y >= ytop) & (self.Y <= ybot + bulge)
        n = np.stack([u * 0.95, np.zeros_like(u) + 0.0, np.sqrt(np.clip(1 - u * u, 0, 1))], -1)
        self.put(mask, n, m)
        if cap is not False:
            cm = cap or m; uu = (self.X - cx) / r; vv = (self.Y - ytop) / cap_ry; mk = uu * uu + vv * vv <= 1.0
            self.put(mk, np.array(cap_up), cm)
        return mask

    def poly(self, pts, m, n=(0, 0, 1), nfn=None, emit=None):
        im = Image.new('L', (self.w, self.h), 0); ImageDraw.Draw(im).polygon([(float(x), float(y)) for x, y in pts], fill=255)
        mask = np.array(im) > 0
        if nfn is not None: nn = nfn(self.X, self.Y)
        else: nn = np.array(n, float)
        return self.put(mask, nn, m, emit)

    def box(self, x, y, w, h, d, m, top=None, side=None, dx=0.62, dy=-0.5, emit=None):
        """Boîte en projection oblique : face avant (x,y,w,h), dessus et flanc droit de profondeur d."""
        ox, oy = d * dx, d * dy * TILT
        front = self.rect(x, y, x + w, y + h, m, (0, 0, 1), emit)
        if d > 0:
            self.poly([(x, y), (x + w, y), (x + w + ox, y + oy), (x + ox, y + oy)], top or m, (0, -0.84, 0.54))
            self.poly([(x + w, y), (x + w + ox, y + oy), (x + w + ox, y + h + oy), (x + w, y + h)], side or m, (0.9, 0.08, 0.42))
        return front

    def line(self, p0, p1, wdt, m, emit=None, taper=1.0):
        (x0, y0), (x1, y1) = p0, p1; dx, dy = x1 - x0, y1 - y0; L2 = dx * dx + dy * dy or 1e-6
        t = np.clip(((self.X - x0) * dx + (self.Y - y0) * dy) / L2, 0, 1)
        px = x0 + dx * t; py = y0 + dy * t; r = wdt / 2 * (1 + (taper - 1) * t)
        d = np.hypot(self.X - px, self.Y - py); mask = d <= np.maximum(r, 0.45)
        L = math.sqrt(L2); perp = np.array([-dy / L, dx / L])
        sd = ((self.X - px) * perp[0] + (self.Y - py) * perp[1]) / np.maximum(r, 0.5)
        n = np.stack([perp[0] * sd, perp[1] * sd, np.sqrt(np.clip(1 - sd * sd, 0, 1))], -1)
        return self.put(mask, n, m, emit)

    def pix(self, x, y, color, a=255):
        """Pixel peint directement (étincelles, reflets, lueurs), hors éclairage."""
        if 0 <= x < self.w and 0 <= y < self.h: self.over[(int(x), int(y))] = (*(color if not isinstance(color, str) else hexrgb(color)), a)

    # ---- modifications ----
    def shade_mod(self, mask, dv): self.add[mask] += dv
    def recolor(self, mask, m): self.mat[mask & (self.mat >= 0)] = self.mid(m)
    def occlude(self, y0, y1, k=0.35):
        """Assombrit le pied de l'objet (occlusion ambiante) entre y0 et y1."""
        t = np.clip((self.Y - y0) / max(1e-6, (y1 - y0)), 0, 1); self.ao *= 1 - k * t * t
    def crack(self, pts, dv=-0.4):
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            for i in range(int(max(abs(x1 - x0), abs(y1 - y0))) + 1):
                t = i / max(1, int(max(abs(x1 - x0), abs(y1 - y0)))); x = int(x0 + (x1 - x0) * t); y = int(y0 + (y1 - y0) * t)
                if 0 <= x < self.w and 0 <= y < self.h and self.mat[y, x] >= 0: self.add[y, x] += dv

    # ---- rendu ----
    def render(self, outline=True, outline_dark=0.55):
        h, w = self.h, self.w; opaque = self.mat >= 0
        nn = self.n / np.maximum(np.linalg.norm(self.n, axis=2, keepdims=True), 1e-6)
        diff = np.clip(nn @ LIGHT, 0, 1); bnc = np.clip(nn @ BOUNCE, 0, 1)
        v = 0.10 + 0.92 * diff + 0.12 * bnc; v = v * self.ao + self.add
        img = np.zeros((h, w, 4), np.uint8); idxmap = np.zeros((h, w), int)
        up = np.zeros_like(opaque); up[1:] = ~opaque[:-1]; up[0] = True
        lf = np.zeros_like(opaque); lf[:, 1:] = ~opaque[:, :-1]; lf[:, 0] = True
        dn = np.zeros_like(opaque); dn[:-1] = ~opaque[1:]; dn[-1] = True
        rt = np.zeros_like(opaque); rt[:, :-1] = ~opaque[:, 1:]; rt[:, -1] = True
        for mi, m in enumerate(self.mats):
            mk = self.mat == mi
            if not mk.any(): continue
            vv = np.where(self.emit > 0, self.emit, v)[mk] if m.emissive else v[mk]
            if m.grain: vv = vv + m.grain * (_noise(w, h, m.gscale, self.seed + mi)[mk] - 0.5) * 2
            pos = vv * (m.n - 1) + 0.0 + m.dither * BAYER[np.nonzero(mk)[0] % 4, np.nonzero(mk)[1] % 4] * 1.4
            idx = np.clip(np.floor(pos + 0.5), 0, m.n - 1).astype(int)
            if m.rim and not m.emissive:
                ys, xs = np.nonzero(mk); e_tl = (up | lf)[ys, xs]; e_br = (dn | rt)[ys, xs]
                idx = np.clip(idx + np.where(e_tl, m.rim, 0) - np.where(e_br, m.rim, 0), 0, m.n - 1)
            ramp = np.array(m.ramp, np.uint8); ys, xs = np.nonzero(mk)
            img[ys, xs, :3] = ramp[idx]; img[ys, xs, 3] = 255
        for (x, y), c in self.over.items(): img[y, x] = c
        if outline:
            alpha = img[:, :, 3] > 0; out = img.copy()
            for y in range(h):
                for x in range(w):
                    if alpha[y, x]: continue
                    best = None
                    for dy, dx in ((1, 0), (0, 1), (0, -1), (-1, 0)):   # voisin vers le bas d'abord : contour plus sombre sous l'objet
                        yy, xx = y + dy, x + dx
                        if 0 <= yy < h and 0 <= xx < w and alpha[yy, xx] and self.mat[yy, xx] >= 0 and not self.mats[self.mat[yy, xx]].emissive:
                            best = (yy, xx); break
                    if best:
                        m = self.mats[self.mat[best]]; c = mix(m.ramp[0], (10, 8, 20), 0.45)
                        out[y, x] = (*[int(k * outline_dark / 0.55) if False else int(k) for k in c], 255)
            img = out
        return Image.fromarray(img, 'RGBA')


def sheet_preview(frames, scale=6, bg=(66, 62, 74), pad=6, label=None):
    """Planche de contrôle : frames côte à côte sur fond neutre, agrandies au plus proche."""
    w = sum(f.width for f in frames) + pad * (len(frames) + 1); h = max(f.height for f in frames) + pad * 2
    im = Image.new('RGBA', (w, h), (*bg, 255)); x = pad
    for f in frames: im.alpha_composite(f, (x, h - pad - f.height)); x += f.width + pad
    return im.resize((im.width * scale, im.height * scale), Image.NEAREST)
