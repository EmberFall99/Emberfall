"""Chunk 1 art: prison gate, key ring, the frozen battlefield, Glargon, the lake."""
import math, random
from pixrig import G, P, GROUND, floor, bg_base

def prison_gate_imgs():
    closed = G(18, 56, 9, 55)
    for x in range(-8, 9, 3):
        for y in range(-55, 1): closed.set(x, y, 'b')
    for y in (-53, -36, -19, -3):
        closed.line((-8, y), (8, y), 'c')
    for x in range(-8, 9, 3): closed.set(x, -55, '1')
    closed.set(6, -27, '5'); closed.set(6, -26, '5'); closed.set(5, -27, 'e')
    closed.outline()
    open_ = G(18, 56, 9, 55)
    for y in range(-55, -44):   # raised portcullis: only the spiked bottom edge shows at the top
        for x in range(-8, 9, 3): open_.set(x, y, 'b')
    open_.line((-8, -45), (8, -45), 'c')
    for x in range(-8, 9, 3): open_.set(x, -44, '1')
    open_.outline()
    return closed, open_

def key_ring():
    g = G(16, 14, 8, 13)
    for a in range(0, 360, 20):
        g.set(*P((0, -9), a, 4), '4')
    for i, ang in enumerate((-110, -80, -50)):
        base = P((0, -9), ang, 4)
        tip = P(base, ang, 6)
        g.line(base, tip, 'b'); g.set(*tip, 'd')
        g.set(*P(tip, ang + 90, 1), 'd')
    g.outline()
    return g

def bg_battlefield():
    # overcast sky fading into snow haze
    g = bg_base(lambda y: 'b' if y < 18 else ('d' if y < 40 else '1'))
    r = random.Random(61)
    for y in range(8, 48):
        for x in range(160):
            if (x + y) % 2 == 0 and r.random() < .5: g.p[y][x] = 'b' if y < 28 else 'd'
    # far ridge, then a long rolling snowfield
    for x in range(160):
        ridge = 50 + int(4 * math.sin(x / 11) + 2 * math.sin(x / 3.7))
        for y in range(ridge, ridge + 5): g.p[y][x] = 'c' if y < ridge + 3 else 'b'
        for y in range(ridge + 5, GROUND):
            depth = (y - ridge) / (GROUND - ridge)
            g.p[y][x] = '1' if r.random() < .55 + depth * .4 else 'd'
    # two ruined towers, jagged where they broke
    for tx, w, top in ((18, 9, 30), (126, 12, 24)):
        for x in range(tx, tx + w):
            t = top + (r.randint(0, 6) if x not in (tx, tx + w - 1) else 0)
            for y in range(t, 70): g.p[y][x] = 'c' if (x - tx) % 4 else 'f'
        for y in range(top + 10, 70, 9):
            g.p[y][tx + w // 2] = 'f'
    # heaps of rusted armour scattered across the field: smaller and duller further away
    def armour_pile(cx, base, size):
        w, h = int(7 * size), int(5 * size)
        for yy in range(-h, 1):
            half = int(w * (1 - (abs(yy) / (h + 1)) ** 1.6))
            for xx in range(-half, half + 1):
                X, Y = cx + xx, base + yy
                if 0 <= X < 160 and 0 <= Y < 120:
                    n = r.random()
                    g.p[Y][X] = 'c' if n < .35 else ('e' if n < .75 else ('4' if n < .9 else 'b'))
        # a few readable shapes on top: helmet domes, a shield rim, a sword hilt
        for _ in range(int(2 * size)):
            hx = cx + r.randint(-w // 2, w // 2); hy = base - h + r.randint(0, max(1, h // 2))
            for xx in range(-1, 2):
                if 0 <= hx + xx < 160 and 0 <= hy < 120: g.p[hy][hx + xx] = 'b'
            if 0 <= hx < 160 and 0 <= hy + 1 < 120: g.p[hy + 1][hx] = 'f'
        sx = cx + r.randint(-w // 2, w // 2)
        for yy in range(base - h - int(4 * size), base - h + 1):
            if 0 <= sx < 160 and 0 <= yy < 120: g.p[yy][sx] = 'b'
        if 0 <= sx - 1 and sx + 1 < 160:
            g.p[base - h - int(2 * size)][sx - 1] = 'e'; g.p[base - h - int(2 * size)][sx + 1] = 'e'
    def blood(cx, cy, size):
        for _ in range(int(14 * size)):
            ang = r.random() * 6.28; d = r.random() ** 1.5 * 6 * size
            X, Y = int(cx + math.cos(ang) * d * 1.6), int(cy + math.sin(ang) * d * .45)
            if 0 <= X < 160 and 0 <= Y < 120:
                g.p[Y][X] = '2' if d < 3 * size else 'e'
    for cx, base, size in ((46, 67, 1.0), (100, 65, .9), (66, 82, 1.5), (138, 80, 1.4)):
        blood(cx, base + 1, size * 1.3)
        armour_pile(cx, base, size)
    # snow ground
    for y in range(GROUND, 120):
        for x in range(160): g.p[y][x] = '1' if (y - GROUND) < 3 or r.random() < .75 else 'd'
    for x in range(160):
        if r.random() < .3: g.p[GROUND - 1][x] = '1'
    for cx in (30, 58, 118):
        blood(cx, GROUND + 4, 1.8)
    for cx, size in ((10, 2.0), (86, 1.7), (150, 2.1)):
        blood(cx, GROUND + 3, size * 1.4)
        armour_pile(cx, GROUND - 1, size)
    # battlefield debris: spears and broken swords, rusted helmets and shields
    for _ in range(9):
        x = r.randint(4, 150); lean = r.choice((-1, 1)); h = r.randint(8, 20)
        for i in range(h):
            yy, xx = GROUND - 1 - i, x + lean * (i // 4)
            if 0 <= xx < 160: g.p[yy][xx] = 'e' if i < h - 2 else 'b'
    for _ in range(8):
        x = r.randint(4, 150)
        if r.random() < .5:
            for yy in range(GROUND - 4, GROUND):
                for xx in range(x, x + 5): g.p[yy][xx] = 'e' if (xx + yy) % 3 else '4'
            g.p[GROUND - 2][x + 3] = 'f'
        else:
            for yy in range(-3, 4):
                for xx in range(-3, 4):
                    if xx * xx + yy * yy <= 10: g.p[GROUND - 3 + yy][x + xx] = 'e' if xx * xx + yy * yy > 3 else '4'
    return g

def flag_frames():
    out = []
    for i in range(3):
        g = G(16, 34, 2, 33)
        g.line((0, 0), (0, -32), 'e')
        for x in range(1, 13):
            wave = int(round(1.6 * math.sin((x + i * 4) / 2.2)))
            for y in range(-31, -23):
                if not (x > 9 and (y + x) % 3 == 0):   # tattered edge
                    g.set(x, y + wave, '2' if y > -29 else 'e')
        g.outline()
        out.append(g)
    return out

# ---- the man in the stocks, and his transformation
SKIN, PANTS, HAIR = 'd', 'e', 'b'

def stocks(with_man=True):
    g = G(34, 30, 17, 29)
    # posts + board
    g.rect(-12, -18, -11, 0, 'e'); g.rect(11, -18, 12, 0, 'e')
    g.rect(-14, -20, 14, -15, 'e'); g.line((-14, -17), (14, -17), 'f')
    if with_man:
        # bent over: head and hands through the board
        g.rect(-3, -21, 1, -17, SKIN); g.set(-1, -19, 'f'); g.set(0, -19, 'f')     # head (eyes)
        g.line((-4, -22), (2, -22), HAIR)
        g.set(-8, -18, SKIN); g.set(-7, -18, SKIN); g.set(5, -18, SKIN); g.set(6, -18, SKIN)  # hands
        g.rect(-2, -14, 6, -10, SKIN)            # bent back
        g.rect(3, -9, 6, 0, PANTS); g.rect(-1, -9, 1, -1, PANTS)   # legs
        g.set(-1, 0, 'f'); g.set(6, 0, 'f')
    else:
        g.rect(-14, -24, 14, -21, 'e')          # top board lifted
        g.line((-14, -22), (14, -22), 'f')
    g.outline()
    return g

def man(pose):
    g = G(24, 30, 12, 29)
    if pose in ('stand', 'stretch'):
        g.rect(-2, -9, -1, 0, PANTS); g.rect(1, -9, 2, 0, PANTS)
        g.rect(-2, -11, 2, -9, PANTS)
        g.rect(-3, -18, 3, -12, SKIN); g.line((-1, -16), (1, -16), 'b')   # thin pale chest
        g.rect(-2, -24, 2, -20, SKIN); g.set(1, -22, 'f'); g.set(2, -22, 'f')
        g.line((-3, -25), (2, -25), HAIR); g.set(-3, -24, HAIR); g.set(-3, -23, HAIR)
        g.set(0, -19, SKIN)
        if pose == 'stand':
            g.line((-4, -17), (-4, -11), SKIN); g.line((4, -17), (4, -11), SKIN)
        else:
            g.line((-4, -18), (-6, -27), SKIN); g.line((4, -18), (6, -27), SKIN)
            g.set(-6, -28, SKIN); g.set(6, -28, SKIN)
    g.outline()
    return g

def wizard(cast=False, glow=False):
    g = G(28, 40, 14, 39)
    robe, robe_d = '8', 'c'
    # robe (flared)
    g.poly([(-3, -19), (3, -19), (6, 0), (-6, 0)], robe)
    g.line((-3, -19), (-6, 0), robe_d); g.line((0, -14), (0, 0), robe_d)
    g.line((-6, 0), (6, 0), robe_d)
    # face + beard
    g.rect(-2, -24, 2, -20, 'd'); g.set(1, -22, 'f'); g.set(2, -22, 'f')
    g.poly([(-2, -20), (3, -20), (1, -14), (-1, -15)], '1')
    # very pointy hat with a droop
    g.poly([(-5, -24), (5, -24), (1, -36)], robe)
    g.line((-5, -24), (5, -24), '5')
    g.line((1, -36), (4, -38), robe); g.set(5, -38, robe)
    g.set(-1, -30, '5'); g.set(1, -28, '5')
    # staff + book
    if cast:
        g.line((4, -20), (9, -30), 'b'); g.line((9, -30), (11, -38), 'e')
        for a in range(0, 360, 45): g.set(*P((11, -38), a, 2), '9')
        g.set(11, -38, '1')
    else:
        g.line((7, -1), (7, -30), 'e'); g.set(7, -31, '5'); g.set(7, -32, '9')
        g.line((3, -16), (7, -16), robe)
    g.rect(-7, -14, -4, -10, '2'); g.line((-7, -12), (-4, -12), '5')   # book
    g.outline(skip=('9',))
    if glow:
        g.outline('9', skip=('5',))
    return g

def man_glow():
    g = man('stretch')
    g.outline('9')
    g.outline('1', skip=('f', '9'))
    return g

# ---- the lake
def bg_lake():
    g = bg_base(lambda y: '8')
    r = random.Random(71)
    bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
    for y in range(0, 76):
        t = y / 75 * 2           # 0..2 across the three sky colours
        lo, hi = ('8', '6') if t < 1 else ('6', '9')
        f = t if t < 1 else t - 1
        for x in range(160):
            g.p[y][x] = hi if bayer[y % 4][x % 4] / 16 < f else lo
    for _ in range(25): g.p[r.randint(0, 22)][r.randint(0, 159)] = '1'
    # mountains: the tall one on the right is where Glargon waits. lit faces left, shadow right
    peaks = [(20, 52, 26), (60, 46, 30), (128, 14, 40), (100, 40, 24), (150, 48, 20)]
    for x in range(160):
        top, face = 75, 'b'
        for px_, py_, w in peaks:
            if abs(x - px_) < w:
                t = py_ + abs(x - px_) * (75 - py_) / w
                if t < top:
                    top, face = t, ('b' if x < px_ else 'c')
        top = int(top)
        for y in range(top, 76):
            g.p[y][x] = '1' if (y - top) < 3 and top < 62 else face
    g.p[13][128] = '5'; g.p[12][128] = '4'      # a tiny warm light at the summit
    # the lake: still water with a few long highlights, and the mountains' reflection
    for y in range(76, 92):
        for x in range(160):
            g.p[y][x] = '8'
    for _ in range(14):
        y = r.randint(77, 91); x = r.randint(0, 150)
        for xx in range(x, min(160, x + r.randint(4, 12))): g.p[y][xx] = '6'
    for x in range(110, 146):
        if (x % 3) == 0: g.p[78 + abs(x - 128) // 6][x] = 'c'
    # pebbled shore
    for y in range(92, GROUND):
        for x in range(160): g.p[y][x] = 'd' if (y - 92) < 4 and r.random() < .35 else 'b' if r.random() < .3 else 'e'
    for y in range(GROUND, 120):
        for x in range(160): g.p[y][x] = 'e' if r.random() < .7 else 'c'
    for x in range(160): g.p[GROUND][x] = '7' if r.random() < .6 else 'e'
    for _ in range(30):
        x = r.randint(0, 159); g.p[GROUND - 1][x] = '7'
    return g

def note_img():
    g = G(10, 8, 5, 7)
    g.rect(-4, -5, 3, -1, '1'); g.line((-4, -1), (3, -1), 'd')
    for y in (-4, -2): g.line((-3, y), (1, y), 'b')
    g.set(3, -5, 'd')
    g.outline()
    return g
