"""Chunk 5 art: Folkewood, part one - the road in, the palisade gate, the street before and after the dragon,
and the ice dragon itself (only ever partly on screen: a wing, a shadow, a head and its breath)."""
import math, random
from pixrig import G, P, GROUND, bg_base
import pixrig4 as W
import pixrig5 as V
import textart as T
import pixrig2 as Q

NOTE_X = 24        # Glargon's note, just inside the gate (area 30)
GATE_X = 140       # the palisade gate at the end of the road (area 29)

def frost_sky(y):
    return '8' if y < 20 else ('b' if y < 60 else 'd')

# ---------------------------------------------------------------- area 29: the road to Folkewood, first frost
def bg_folke_road():
    g = bg_base(frost_sky)
    W.dither(g, 0, 30, '8', 'c'); W.dither(g, 30, 64, 'c', 'b')
    W.tree_line(g, 291, far='c', trunks=(10, 58), top=8)
    W.grass_floor(g, 292, top='7', soil='e', speck='c', path='b')
    r = random.Random(293)
    # frost creeping in from the east: white on the grass, rime on the trunks, more the further right
    for x in range(160):
        chance = max(0, (x - 40) / 160)
        for y in range(GROUND - 2, GROUND + 3):
            if r.random() < chance: g.p[y][x] = '1' if r.random() < .6 else '9'
    for y in range(0, GROUND):
        for x in (58 + 3, 58 + 4):
            if r.random() < .3: g.p[y][x] = '9'
    # Folkewood's palisade: taller and sturdier than Ashen Forde's, with an open gate on the right
    for x in range(112, 160):
        if GATE_X - 8 <= x < GATE_X + 10: continue
        top = 30 + (x * 5) % 4
        for y in range(top, GROUND):
            g.p[y][x] = 'f' if x % 6 == 0 else ('e' if y > top + 2 else 'b')
        if r.random() < .5: g.p[top][x] = '1'
    for y in range(22, GROUND):
        for x in (GATE_X - 10, GATE_X - 9, GATE_X + 10, GATE_X + 11): g.p[y][x] = 'e' if x in (GATE_X - 10, GATE_X + 10) else 'f'
    for x in range(GATE_X - 14, GATE_X + 16):
        g.p[22][x] = 'e'; g.p[23][x] = 'e'; g.p[24][x] = 'f'
    sign = T.text_grid('FOLKEWOOD', 8, 'd', font=T.SANS, spacing=0, shadow='.')
    sw = len(sign[0])
    sx0 = min(GATE_X - sw // 2, 157 - sw)
    for y in range(len(sign)):
        for x in range(sw):
            if sign[y][x] == 'd': g.p[10 + y][sx0 + x] = 'd'
    for x in range(sx0 - 2, min(160, sx0 + sw + 2)):
        g.p[9][x] = 'e'; g.p[10 + len(sign)][x] = 'e'
    # icicles on the lintel
    for x in range(GATE_X - 13, GATE_X + 15, 3):
        for d in range(r.randint(1, 4)): g.p[25 + d][x] = '9'
    return g

# ---------------------------------------------------------------- area 30: Folkewood's street
def folke_house(g, x0, x1, seed, frozen, tall=34):
    W.wood_wall(g, x0, x1, GROUND - tall, GROUND, seed, c='e', rot=.15, holes=1, sky='f')
    W.roof(g, x0 - 4, x1 + 4, GROUND - tall - 18, GROUND - tall, c='c', c2='f', sag=1, holes=0, seed=seed + 1)
    cx = (x0 + x1) // 2
    for y in range(GROUND - 18, GROUND):
        for x in range(cx - 4, cx + 4): g.p[y][x] = 'f'
    W.window(g, x0 + 4, GROUND - tall + 8, w=5, h=5, lit=not frozen)
    if frozen:
        # snow heaped on the roof, icicles along the eaves, rime up the walls
        for x in range(x0 - 4, x1 + 5):
            mid = (x0 + x1) / 2
            t = abs(x - mid) / ((x1 - x0) / 2 + 4)
            top = int(GROUND - tall - 18 + 18 * t)
            for y in range(top - 2, top + 1):
                if 0 <= y < 120 and 0 <= x < 160: g.p[y][x] = '1'
        r = random.Random(seed + 9)
        for x in range(x0 - 3, x1 + 4, 2):
            for d in range(r.randint(1, 5)):
                if 0 <= x < 160: g.p[GROUND - tall + 1 + d][x] = '9'
        for y in range(GROUND - tall, GROUND):
            for x in range(x0, x1):
                if r.random() < .12: g.p[y][x] = '9' if r.random() < .5 else '1'

def bg_folke_street(frozen=False):
    sky = (lambda y: '9' if y < 30 else ('1' if y < 60 else 'd')) if frozen else frost_sky
    g = bg_base(sky)
    if frozen:
        W.dither(g, 0, 40, 'b', '9')
    else:
        W.dither(g, 0, 30, '8', 'c'); W.dither(g, 30, 64, 'c', 'b')
    r = random.Random(301)
    # far roofs
    for bx in range(-8, 168, 22):
        top = r.randint(44, 54)
        for y in range(top, GROUND - 20):
            for x in range(bx, bx + 18):
                if 0 <= x < 160: g.p[y][x] = 'c' if not frozen else ('d' if (x + y) % 5 else '1')
    folke_house(g, 40, 82, 302, frozen)
    folke_house(g, 104, 150, 303, frozen, tall=40)
    if frozen:
        for y in range(GROUND, 120):
            for x in range(160):
                g.p[y][x] = '1' if r.random() < .7 else ('9' if r.random() < .6 else 'd')
        for x in range(160):
            g.p[GROUND][x] = '1'
            if r.random() < .5: g.p[GROUND - 1][x] = '1'
        # a spike of ice where the breath struck hardest
        for (cx, h) in ((92, 22), (96, 14), (88, 10)):
            for y in range(GROUND - h, GROUND):
                w = (y - (GROUND - h)) // 4
                for x in range(cx - w, cx + w + 1): g.p[y][x] = '9' if x < cx else '1'
    else:
        W.grass_floor(g, 304, top='7', soil='e', speck='c', path='b')
        # the bandits' camp in the street: fire barrels, a torn purple banner
        for bx in (30, 98):
            for y in range(GROUND - 9, GROUND):
                for x in range(bx, bx + 6): g.p[y][x] = 'e' if y % 3 else 'f'
            g.p[GROUND - 10][bx + 2] = '4'; g.p[GROUND - 11][bx + 3] = '5'; g.p[GROUND - 10][bx + 3] = '2'
        for y in range(GROUND - 52, GROUND): g.p[y][90] = 'e'
        for y in range(GROUND - 50, GROUND - 38):
            for x in range(91, 100 - abs(y - (GROUND - 44)) // 2): g.p[y][x] = 'a' if (x + y) % 4 else 'f'
    # the gate behind you on the left
    for y in range(26, GROUND):
        for x in range(0, 4): g.p[y][x] = 'f' if x == 3 else ('e' if y % 4 else 'c')
    return g

# ---------------------------------------------------------------- the ice dragon (never fully on screen)
def dragon_wing():
    """one vast wing, seen from below as it passes over the top of the screen (150x46)"""
    g = G(150, 46, 0, 0)
    # the arm: shoulder off the left edge, sweeping out to a clawed tip
    bones = [(0, 6), (40, 2), (78, 8), (112, 4), (146, 10)]
    for i in range(len(bones) - 1):
        g.thick(bones[i], bones[i + 1], 'd', 3)
    # finger bones fanning down, with the membrane between them
    tips = [(30, 40), (62, 44), (92, 42), (122, 34), (146, 24)]
    roots = [(30, 3), (60, 5), (90, 7), (118, 6), (144, 9)]
    for k in range(len(tips)):
        a = roots[k]; b = tips[k]
        prev_b = tips[k - 1] if k else (0, 30)
        prev_a = roots[k - 1] if k else (0, 6)
        g.poly([prev_a, a, b, (int((b[0] + prev_b[0]) / 2), b[1] - 8), prev_b], '6')
    for k in range(len(tips)):
        g.line(roots[k], tips[k], 'd')
        g.set(*tips[k], '1')
    # light catching the membrane, frost on the bone
    r = random.Random(5)
    for _ in range(140):
        x, y = r.randint(0, 149), r.randint(0, 45)
        if g.p[y][x] == '6': g.p[y][x] = '9'
        elif g.p[y][x] == 'd' and r.random() < .5: g.p[y][x] = '1'
    g.outline()
    return g

def dragon_head(open_jaw=False):
    """head and neck dipping in from the top of the screen (64x64; the neck runs off the top-right edge)"""
    g = G(64, 64, 0, 0)
    # the neck: a thick curve coming down from the top-right
    for t in range(0, 41):
        x = 54 - t * 0.55 - 6 * math.sin(t / 14)
        y = t * 0.9
        w = 7 - t // 12
        for d in range(-w, w + 1):
            g.set(x + d, y, '8' if d < -w + 2 else ('6' if d < w - 1 else '9'))
        if t % 4 == 0: g.set(x + w - 1, y, '1')        # spines down its back
    # the head, snout pointing down-left
    hx, hy = 30, 40
    g.poly([(hx - 2, hy - 8), (hx + 10, hy - 6), (hx + 8, hy + 6), (hx - 12, hy + 12), (hx - 20, hy + 10), (hx - 8, hy)], '6')
    g.poly([(hx - 2, hy - 8), (hx + 10, hy - 6), (hx + 4, hy - 2), (hx - 8, hy)], '8')
    # horns sweeping back
    g.line((hx + 6, hy - 7), (hx + 18, hy - 18), 'd'); g.line((hx + 7, hy - 6), (hx + 20, hy - 15), 'd')
    g.line((hx + 1, hy - 8), (hx + 8, hy - 20), 'd')
    # eye: cold white
    g.set(hx + 2, hy - 2, '1'); g.set(hx + 3, hy - 2, '1'); g.set(hx + 3, hy - 3, '9')
    # the jaw
    if open_jaw:
        g.poly([(hx - 6, hy + 8), (hx + 6, hy + 6), (hx - 2, hy + 18), (hx - 18, hy + 20)], '8')
        g.poly([(hx - 16, hy + 12), (hx - 2, hy + 9), (hx - 6, hy + 15), (hx - 16, hy + 17)], 'f')
        for x in range(-16, -2, 3): g.set(hx + x, hy + 12, '1'); g.set(hx + x, hy + 16, '1')
        for (x, y) in ((-18, 16), (-20, 18), (-17, 19)): g.set(hx + x, hy + y, '9')
    else:
        g.line((hx - 18, hy + 11), (hx + 6, hy + 7), 'f')
    g.outline()
    return g

def breath_frames():
    """the breath: a column of ice and freezing mist from the mouth down to the ground (18x76), 2 frames"""
    out = []
    for k in range(2):
        g = G(18, 76, 0, 0)
        r = random.Random(70 + k)
        for y in range(76):
            w = 2 + y // 10
            for x in range(9 - w, 9 + w + 1):
                if 0 <= x < 18 and r.random() < .75:
                    g.p[y][x] = '1' if r.random() < .45 else ('9' if r.random() < .7 else '6')
        for _ in range(12):     # ice shards at the base
            x = r.randint(1, 16); y = r.randint(66, 75)
            g.p[y][x] = '1'
        out.append(g)
    return out

def shadow_frame():
    """the dragon's shadow racing across the ground (60x6)"""
    g = G(60, 6, 0, 0)
    for y in range(6):
        for x in range(60):
            edge = min(x, 59 - x)
            if (x + y) % 2 == 0 and (edge > 6 or (x + y) % 4 == 0) and abs(y - 3) < 3 - (1 if edge < 3 else 0):
                g.p[y][x] = 'f'
    return g

# ---------------------------------------------------------------- the Indentured General's Armour
SAMURAI_X = 73      # the kneeling body at the crypt altar (area 28)

def samurai_kneeling():
    """the general, long dead, kneeling before the altar in the armour he couldn't take off (30x26)"""
    g = G(30, 26, 15, 25)
    LAC, GOLD, CORD = 'c', '5', '2'
    # folded legs: shin flat on the ground, thigh angled up
    g.thick((-6, -1), (4, -1), LAC, 2)
    g.thick((-4, -2), (2, -7), LAC, 3)
    # skirt plates (kusazuri) with gold lacing
    g.poly([(-4, -8), (4, -8), (5, -3), (-6, -3)], LAC)
    for x in range(-4, 5, 2): g.set(x, -5, GOLD)
    # the cuirass, bowed forward
    g.poly([(-3, -16), (4, -15), (5, -8), (-4, -8)], LAC)
    g.line((-3, -13), (4, -12), GOLD); g.line((-4, -10), (5, -9), GOLD)
    g.set(0, -11, CORD); g.set(1, -11, CORD)
    # shoulder guards
    g.rect(-5, -16, -3, -12, LAC); g.rect(4, -15, 6, -11, LAC)
    g.line((-5, -13), (-3, -13), GOLD); g.line((4, -12), (6, -12), GOLD)
    # arms resting on the thighs, bony hands
    g.line((5, -12), (7, -7), LAC); g.set(8, -6, 'd'); g.set(8, -5, 'd')
    # the helmet with its crescent crest, a skull underneath, head bowed
    g.rect(4, -21, 9, -16, LAC)
    g.rect(6, -18, 9, -16, 'd'); g.set(8, -17, 'f'); g.set(7, -16, 'f')
    g.line((3, -22), (5, -26), GOLD); g.line((10, -22), (8, -26), GOLD); g.line((5, -22), (8, -22), GOLD)
    g.line((3, -16), (2, -14), LAC); g.line((10, -16), (11, -14), LAC)
    # a red contract cord tied around the waist, trailing
    g.line((-4, -9), (-8, -4), CORD)
    g.outline()
    return g

def offering_frames():
    """arms flung out to the sides, head back: the curse feeding (one per loadout weapon)"""
    out = []
    for w in ('sword', 'shield', 'bow', 'katana', 'dagger'):
        def drops(g):
            for (x, y) in ((-10, -16), (9, -18), (-7, -21), (6, -10)):
                g.set(x, y, '2')
        out.append(Q.knight(w, arm=-15, sword=-95, back_arm=195, crouch=-1, lean=-1,
                            legs=((4, 0), (-4, 0)), fx=drops))
    return out

def prompt_two_lines(a, b):
    """a two-line prompt (for "A: Equip Indentured General's Armour")"""
    ga = T.text_grid(a, 8, '5', font=T.SANS)
    gb = T.text_grid(b, 8, '5', font=T.SANS)
    w = max(len(ga[0]), len(gb[0]))
    pad = lambda grid: [row + ['.'] * (w - len(row)) for row in grid]
    return pad(ga) + pad(gb)
