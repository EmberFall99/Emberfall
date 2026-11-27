"""Chunk 3 art: The Warren (the woods before Folkewood), the abandoned bandit camp up in the trees,
the crypt below, the knife thrower, and the Katana."""
import math, random
from pixrig import G, P, slash_arc, GROUND, bg_base
import pixrig2 as Q
from pixrig2 import draw_ladder
import pixrig4 as W
import textart as T

# ---------------------------------------------------------------- the layout (mirrored in state.ts:
# platArea/platX1/platX2/platH and pitArea/pitX1/pitX2 - tools/test/smoke_test.js checks they match)
PLATS = {   # area: [(x1, x2, height above the ground)]
    18: [(52, 92, 20)],
    19: [(110, 150, 20)],
    21: [(20, 60, 18)],
    22: [(40, 68, 0), (82, 126, 0)],
    23: [(116, 156, 20)],
    26: [(34, 58, 12), (70, 94, 24), (104, 130, 12)],
}
PITS = {    # area: [(x1, x2)] - open drops; fall in and you die
    22: [(40, 126)],
    25: [(88, 108)],
    26: [(30, 136)],
    27: [(48, 70), (110, 128)],
}
HOLE_X = 30        # the broken stair down into the crypt, in the hollow (area 18)
UP_LADDER_X = 130  # the rope ladder up to the camp, in the hollow (and its hatch in area 21)
KATANA_X = 112

# ---------------------------------------------------------------- shared bits
def sky_dim(y):
    return 'f' if y < 6 else ('c' if y < 50 else 'b')

def canopy(g, seed, y1=18, dense=0.9, leaf='6', leaf2='7', dark='c'):
    r = random.Random(seed)
    for y in range(0, y1):
        for x in range(160):
            edge = y1 - 3 + int(3 * math.sin(x / 9 + seed))
            if y < edge and r.random() < dense:
                g.p[y][x] = leaf2 if r.random() < .15 else (leaf if r.random() < .7 else dark)

def trunk(g, cx, w, y0=0, y1=GROUND, c='e', shade='c', edge='f'):
    for y in range(y0, y1):
        for x in range(cx - w, cx + w + 1):
            if 0 <= x < 160:
                d = abs(x - cx)
                g.p[y][x] = edge if d == w else (shade if d >= w - 1 or (x + y // 4) % 6 == 0 else c)

def roots_floor(g, seed):
    W.grass_floor(g, seed, top='7', soil='e', speck='c', path='b')
    r = random.Random(seed + 7)
    for _ in range(6):   # roots crossing the path
        x0 = r.randint(0, 150)
        for i in range(r.randint(8, 18)):
            x = x0 + i
            if x < 160: g.p[GROUND + (i // 5) % 2][x] = 'c'

def draw_plat_wood(g, x1, x2, h, posts=True):
    top = GROUND - h
    for x in range(x1, x2 + 1):
        g.p[top][x] = 'd'; g.p[top + 1][x] = 'e'; g.p[top + 2][x] = 'e' if x % 5 else 'f'; g.p[top + 3][x] = 'f'
    if posts and h > 4:
        for px in (x1 + 2, x2 - 2):
            for y in range(top + 4, GROUND):
                g.p[y][px] = 'e'; g.p[y][px + 1] = 'f'

def draw_pit(g, x1, x2, deep='f'):
    for y in range(GROUND, 120):
        for x in range(x1, x2):
            g.p[y][x] = deep
    for y in range(GROUND, 120):    # crumbling edges
        g.p[y][x1] = 'c'; g.p[y][x2 - 1] = 'c'

def warren_holes(g, seed, n=5):
    """burrows in the banks: the reason it's called the Warren"""
    r = random.Random(seed)
    for _ in range(n):
        cx, cy = r.randint(10, 150), r.randint(GROUND - 14, GROUND - 6)
        for y in range(cy - 3, cy + 3):
            for x in range(cx - 4, cx + 5):
                if (x - cx) ** 2 / 16 + (y - cy) ** 2 / 9 < 1 and 0 <= x < 160:
                    g.p[y][x] = 'f'
        for x in range(cx - 5, cx + 6):
            if 0 <= x < 160: g.p[cy + 3][x] = 'e'

def woods_base(seed, far='c'):
    g = bg_base(sky_dim)
    W.dither(g, 0, 50, 'f', 'c'); W.dither(g, 50, 80, 'c', 'b')
    W.tree_line(g, seed, far=far, trunks=(), top=8)
    # a bank of earth along the back of the path
    for x in range(160):
        h = 16 + int(5 * math.sin(x / 13 + seed)) + int(3 * math.sin(x / 5))
        for y in range(GROUND - h, GROUND):
            g.p[y][x] = 'e' if (x * 3 + y) % 9 else 'c'
        g.p[GROUND - h][x] = '7'; g.p[GROUND - h - 1][x] = '6' if x % 3 else '7'
    canopy(g, seed + 1)
    roots_floor(g, seed + 2)
    return g

# ---------------------------------------------------------------- the main path: 17 -> 20
def bg_warren1():
    g = woods_base(171)
    trunk(g, 22, 5); trunk(g, 140, 6)
    warren_holes(g, 172, 6)
    # bones of something big, half buried
    for i, x in enumerate(range(60, 96, 6)):
        for y in range(GROUND - 6 + abs(i - 3), GROUND):
            g.p[y][x] = 'd'; g.p[y][x + 1] = 'b'
    return g

def bg_hollow():
    g = woods_base(181)
    trunk(g, 50, 4); trunk(g, 96, 4)
    for x1, x2, h in PLATS[18]: draw_plat_wood(g, x1, x2, h, posts=False)
    # the great old tree with the rope ladder up into the camp
    trunk(g, UP_LADDER_X, 9, 0, GROUND)
    draw_ladder(g, UP_LADDER_X, 0, GROUND - 1)
    for y in range(0, 6):     # the rope ladder disappears into a hatch in the canopy platform
        for x in range(UP_LADDER_X - 14, UP_LADDER_X + 15): g.p[y][x] = 'e' if y < 4 else 'f'
    # the broken stair down into the crypt: a stone mouth in the ground
    for y in range(GROUND - 18, GROUND):
        for x in range(HOLE_X - 13, HOLE_X + 14):
            d = abs(x - HOLE_X)
            if y > GROUND - 18 + max(0, d - 8) * 2:
                g.p[y][x] = 'b' if d > 9 else 'f'
    for i in range(4):        # steps going down into the dark
        y = GROUND - 4 + i
        for x in range(HOLE_X - 7 + i, HOLE_X + 8 - i):
            if y < 120: g.p[y][x] = 'c'
    for y in range(GROUND, 120):
        for x in range(HOLE_X - 6, HOLE_X + 7): g.p[y][x] = 'f' if y > GROUND + 3 else g.p[y][x]
    g.p[GROUND - 15][HOLE_X - 1] = 'd'; g.p[GROUND - 15][HOLE_X] = 'd'   # a skull on the lintel
    g.p[GROUND - 14][HOLE_X - 1] = 'f'; g.p[GROUND - 14][HOLE_X] = 'd'
    return g

def bg_warren2():
    g = woods_base(191)
    trunk(g, 104, 4); trunk(g, 156, 4); trunk(g, 30, 6)
    for x1, x2, h in PLATS[19]: draw_plat_wood(g, x1, x2, h, posts=False)
    warren_holes(g, 192, 4)
    # a spear stuck in the ground with a rag on it
    for y in range(GROUND - 26, GROUND): g.p[y][70] = 'e'
    g.p[GROUND - 27][70] = '1'; g.p[GROUND - 28][70] = '1'
    for y in range(GROUND - 24, GROUND - 18):
        for x in range(71, 71 + (GROUND - 18 - y) // 2 + 2): g.p[y][x] = '2'
    return g

def bg_warren_edge(blocked=False):
    g = woods_base(201)
    trunk(g, 16, 5); trunk(g, 70, 3)
    sign = T.text_grid('FOLKEWOOD', 8, 'f', font=T.SANS, spacing=0, shadow='.')
    sw, sh = len(sign[0]), len(sign)
    sx, top = 96, GROUND - 34
    for y in range(top, GROUND):
        g.p[y][sx] = 'e'; g.p[y][sx + 1] = 'e'; g.p[y][sx - 1] = 'f'
    bx0 = sx - 6
    for y in range(top - 1, top + sh + 1):
        for x in range(bx0 - 1, bx0 + sw + 4):
            g.p[y][x] = 'f'
    for y in range(top, top + sh):
        for x in range(bx0, bx0 + sw + 3):
            g.p[y][x] = 'd'
    tip0 = bx0 + sw + 4
    for i in range(sh // 2 + 2):
        for yy in range(top - 1 + i, top + sh + 1 - i):
            if tip0 + i < 160: g.p[yy][tip0 + i] = 'f' if yy in (top - 1 + i, top + sh - i) else 'd'
    for y in range(sh):
        for x in range(sw):
            if sign[y][x] == 'f': g.p[top + y][bx0 + 1 + x] = 'f'
    # (a fallen tree used to block the way on; Folkewood is open now)
    for x in (range(140, 160) if blocked else []):
        for y in range(GROUND - 16, GROUND):
            if (x - 150) ** 2 / 100 + (y - GROUND + 8) ** 2 / 64 < 1: g.p[y][x] = 'e' if (x + y) % 4 else 'c'
    return g

# ---------------------------------------------------------------- up: the abandoned camp in the canopy (21-23)
def camp_base(seed):
    g = bg_base(lambda y: 'c' if y < 40 else 'b')
    W.dither(g, 0, 40, '8', 'c')
    r = random.Random(seed)
    for _ in range(10): g.p[r.randint(0, 30)][r.randint(0, 159)] = '1'
    # other treetops below and behind
    for x in range(160):
        h = 30 + int(8 * math.sin(x / 11 + seed)) + int(4 * math.sin(x / 4))
        for y in range(GROUND - h, GROUND):
            g.p[y][x] = '6' if r.random() < .5 else ('c' if r.random() < .5 else '7')
    # the walkway of lashed planks the camp is built on
    W.plank_floor(g, seed + 1, top='d', mid='e', gap='f', rot=0.3)
    for y in range(GROUND + 6, 120):
        for x in range(160):
            if (x // 3 + y) % 7 == 0: g.p[y][x] = 'c'
    return g

def hut(g, x0, x1, base_y, seed, rot=0.4):
    W.wood_wall(g, x0, x1, base_y - 26, base_y, seed, c='e', rot=rot, holes=3, sky='f')
    W.roof(g, x0 - 5, x1 + 5, base_y - 40, base_y - 26, c='c', c2='f', sag=4, holes=2, seed=seed + 1,
           sky_rows=lambda y: 'c')
    for y in range(base_y - 16, base_y):
        for x in range((x0 + x1) // 2 - 4, (x0 + x1) // 2 + 4): g.p[y][x] = 'f'

def flag(g, x, y_top, h=26, colour='2'):
    for y in range(y_top, y_top + h): g.p[y][x] = 'e'
    for y in range(y_top + 1, y_top + 8):
        for xx in range(x + 1, x + 1 + 9 - abs(y - y_top - 4)):
            if xx < 160: g.p[y][xx] = colour if (xx + y) % 5 else 'f'

def bg_camp1():
    g = camp_base(211)
    hut(g, 76, 122, GROUND, 212)
    for x1, x2, h in PLATS[21]:
        draw_plat_wood(g, x1, x2, h)
    for y in range(GROUND - 18 - 22, GROUND - 18):   # a lean-to on the porch
        for x in range(22, 58):
            if y > GROUND - 40 + (58 - x) // 3: g.p[y][x] = 'c' if x % 4 else 'f'
    flag(g, 150, GROUND - 46)
    # the hatch the ladder comes up through
    for x in range(UP_LADDER_X - 7, UP_LADDER_X + 8): g.p[GROUND][x] = 'b'
    for y in range(GROUND + 1, 120):
        for x in range(UP_LADDER_X - 6, UP_LADDER_X + 7): g.p[y][x] = 'f'
    draw_ladder(g, UP_LADDER_X, GROUND + 1, 119)
    # a wall on the left: the camp is closed on that side
    for y in range(20, GROUND):
        for x in range(0, 6): g.p[y][x] = 'f' if x == 5 else ('e' if (y // 3 + x) % 4 else 'c')
    return g

def bg_camp2():
    """the rope bridge: plank by plank across a long drop"""
    g = camp_base(221)
    for x1, x2 in PITS[22]:
        for y in range(GROUND, 120):
            for x in range(x1, x2):
                g.p[y][x] = '6' if (x + y) % 5 == 0 else ('c' if y < 110 else 'f')
    # the bridge: plank segments with a broken gap, ropes either side
    for x1, x2, h in PLATS[22]:
        for x in range(x1, x2 + 1):
            g.p[GROUND][x] = 'd' if x % 3 else 'e'; g.p[GROUND + 1][x] = 'e'; g.p[GROUND + 2][x] = 'f'
    for x in range(36, 132):
        sag = int(6 * math.sin(math.pi * (x - 36) / 96))
        g.p[GROUND - 12 + sag][x] = 'b'
        if x % 8 == 0:
            for y in range(GROUND - 12 + sag, GROUND): g.p[y][x] = 'b' if y % 2 else '.' if False else 'b'
    for x in (36, 130):
        for y in range(GROUND - 20, GROUND + 3): g.p[y][x] = 'e'; g.p[y][x + 1] = 'f'
    # dangling broken planks in the gap
    g.p[GROUND + 3][70] = 'e'; g.p[GROUND + 4][71] = 'e'; g.p[GROUND + 6][80] = 'e'
    flag(g, 12, GROUND - 40, colour='2'); flag(g, 150, GROUND - 36, colour='2')
    return g

def bg_camp3():
    """the approach to the throne: spears, flags, the barred gate"""
    g = camp_base(231)
    hut(g, 20, 60, GROUND, 232, rot=.6)
    for x1, x2, h in PLATS[23]:
        draw_plat_wood(g, x1, x2, h)
    # a row of spears planted along the walkway
    for x in range(72, 112, 7):
        for y in range(GROUND - 30, GROUND): g.p[y][x] = 'e'
        g.p[GROUND - 31][x] = '1'; g.p[GROUND - 32][x] = '1'; g.p[GROUND - 30][x - 1] = 'b'; g.p[GROUND - 30][x + 1] = 'b'
    flag(g, 66, GROUND - 52); flag(g, 114, GROUND - 56)
    # the barred gate on the right: the way to the throne (closed for now)
    for x in range(150, 160):
        for y in range(GROUND - 44, GROUND):
            g.p[y][x] = 'f' if x % 3 == 0 else 'e'
    for y in (GROUND - 34, GROUND - 14):
        for x in range(146, 160): g.p[y][x] = 'b'; g.p[y + 1][x] = 'f'
    # a red handprint smeared on the gate
    for (x, y) in ((154, -26), (155, -26), (153, -25), (154, -25), (155, -25), (156, -24), (154, -24), (155, -24),
                   (153, -27), (155, -28), (154, -28), (156, -27)):
        g.p[GROUND + y][x] = '2'
    return g

# ---------------------------------------------------------------- down: the crypt (25-28)
def crypt_base(seed, area):
    g = bg_base(lambda y: 'f')
    r = random.Random(seed)
    # stone block walls, darker towards the top
    for y in range(0, GROUND):
        for x in range(160):
            row = y // 6
            off = 5 if row % 2 else 0
            joint = (y % 6 == 0) or ((x + off) % 12 == 0)
            g.p[y][x] = 'f' if joint else ('b' if y > 60 and r.random() < .12 else 'c')
    W.dither(g, 0, 30, 'f', 'c')
    # niches with skulls
    for nx in range(14, 146, 34):
        for y in range(34, 48):
            for x in range(nx, nx + 12): g.p[y][x] = 'f'
        for (x, y) in ((nx + 3, 44), (nx + 4, 44), (nx + 7, 45), (nx + 8, 45)):
            g.p[y][x] = 'd'
        g.p[45][nx + 3] = 'f'
    # floor
    for y in range(GROUND, 120):
        for x in range(160):
            g.p[y][x] = 'b' if y == GROUND else ('c' if (x + (y // 4) * 5) % 10 and y < GROUND + 6 else 'f')
    for x1, x2 in PITS.get(area, []):
        draw_pit(g, x1, x2)
    for x1, x2, h in PLATS.get(area, []):
        top = GROUND - h
        for x in range(x1, x2 + 1):
            g.p[top][x] = 'b'; g.p[top + 1][x] = 'c'; g.p[top + 2][x] = 'c' if x % 6 else 'f'; g.p[top + 3][x] = 'f'
        if h > 0:     # a crumbling pillar holding it up from the dark
            cx = (x1 + x2) // 2
            for y in range(top + 4, 120):
                for x in range(cx - 3, cx + 4): g.p[y][x] = 'c' if abs(x - cx) < 3 else 'f'
    # water dripping in thin lines
    for _ in range(5):
        x = r.randint(4, 156)
        for y in range(0, r.randint(10, 30)):
            if y % 3: g.p[y][x] = '8'
    return g

def bg_crypt1():
    g = crypt_base(251, 25)
    # the stair coming down from the hollow, on the left
    for i in range(10):
        for x in range(0, 6 + i * 2):
            y = 40 + i * 6
            for yy in range(y, min(GROUND, y + 6)): g.p[yy][x] = 'c' if yy > y else 'b'
    return g

def bg_crypt2():
    return crypt_base(261, 26)

def bg_crypt3():
    return crypt_base(271, 27)

def bg_crypt4():
    """the katana's resting place"""
    g = crypt_base(281, 28)
    # a stone altar, lit from a crack far above
    for y in range(GROUND - 10, GROUND):
        for x in range(KATANA_X - 14, KATANA_X + 15): g.p[y][x] = 'b' if y == GROUND - 10 else 'c'
    for y in range(0, GROUND - 10):
        w = 3 + y // 10
        for x in range(KATANA_X - w, KATANA_X + w + 1):
            if (x + y) % 3 == 0 and 0 <= x < 160: g.p[y][x] = '9' if y > 60 else '8'
    # a kneeling skeleton facing the altar, long dead
    for (x, y) in ((70, -2), (71, -2), (72, -3), (72, -4), (72, -5), (73, -6), (73, -7), (74, -8), (74, -9), (75, -9),
                   (73, -9), (74, -10), (75, -10), (76, -5), (77, -4), (71, -1), (69, -1)):
        g.p[GROUND + y][x] = 'd'
    return g

# ---------------------------------------------------------------- the knife thrower (30x24, feet at 15,23)
def thrower(lean=0, legs=((2, 0), (-2, 0)), arm=-40, crouch=0, back_arm=-120, knife=True, fx=None, eyes=True):
    # a lean bandit with a red scarf and a bandolier of knives
    g = W.bandit(corrupt=True, lean=lean, legs=legs, arm=arm, blade=None, crouch=crouch, back_arm=back_arm, eyes=eyes)
    hy = -7 + crouch; sx = lean
    for i in range(4):
        g.set(sx - 2 + i, hy - 6 + i, '1')          # knives across the chest
    g.line((sx - 2, hy - 7), (sx + 3, hy - 7), '2')  # red scarf
    g.set(sx - 3, hy - 6, '2'); g.set(sx - 4, hy - 5, '2')
    if knife:
        hand = P((sx + 1, hy - 5), arm, 4)
        g.line(P(hand, arm, 1), P(hand, arm, 3), '1'); g.set(*hand, 'e')
    if fx: fx(g)
    g.outline(skip=('3', '9', '5'))
    return g

def thrower_frames():
    f = {}
    f['idle'] = thrower(lean=1, crouch=1, arm=-20, legs=((3, 0), (-3, 0)))
    f['walk1'] = thrower(lean=1, crouch=1, arm=-20, legs=((4, 0), (-4, 0)))
    f['walk2'] = thrower(lean=1, arm=-20, legs=((0, 0), (1, 0)))
    f['wind'] = thrower(lean=-2, crouch=2, arm=170, back_arm=-40, legs=((4, 0), (-5, 0)))
    f['throw'] = thrower(lean=3, crouch=1, arm=-10, back_arm=-160, knife=False, legs=((5, 0), (-4, 0)))
    f['empty'] = thrower(lean=0, crouch=1, arm=-60, knife=False, legs=((3, 0), (-3, 0)))
    f['hurt'] = thrower(lean=-2, arm=-150, back_arm=160, knife=False, legs=((2, 0), (-3, 0)))
    f['dead'] = thrower(lean=-5, crouch=6, arm=-170, back_arm=-160, knife=False, legs=((4, 0), (-6, 0)), eyes=False)
    return f

def knife_frames():
    """a spinning throwing knife, 4 frames, 9x9"""
    out = []
    for k in range(4):
        g = G(9, 9, 4, 4)
        a = k * 45
        g.line(P((0, 0), a, -3), P((0, 0), a, 3), '1')
        g.set(*P((0, 0), a, 4), '9')
        g.set(*P((0, 0), a, -3), 'e'); g.set(*P((0, 0), a, -2), 'e')
        out.append(g)
    return out

# ---------------------------------------------------------------- the Katana
def katana_frames():
    k = lambda **kw: Q.knight('katana', **kw)
    f = {}
    f['idle1'] = k(arm=-60, sword=60)
    f['idle2'] = k(crouch=1, arm=-60, sword=55)
    for i, (lg, ln) in enumerate([((4, 0), (-3, 0)), ((1, 0), (0, 0)), ((-2, 0), (4, 0)), ((0, 0), (1, 0))]):
        f[f'walk{i+1}'] = k(legs=(lg, ln), lean=1, arm=-60, sword=50, crouch=-1 if i % 2 else 0)
    f['jump'] = k(legs=((2, -3), (-3, -2)), knees=((3, -6), (-1, -6)), arm=-20, sword=60)
    f['drink'] = Q.knight('katana', arm=120, flask=True, back_arm=-100)
    f['hurt'] = k(lean=-2, arm=-140, sword=-150, back_arm=170, legs=((2, 0), (-3, 0)))
    # quick cuts: a rising diagonal, a falling one, then a straight lunge
    f['windup'] = k(lean=-1, arm=-120, sword=-140, legs=((3, 0), (-3, 0)), back_arm=-150)
    f['slash'] = k(lean=2, arm=40, sword=50, legs=((4, 0), (-3, 0)), back_arm=-160, fx=slash_arc(2, -13, 12, -60, 70))
    f['windup2'] = k(lean=1, arm=120, sword=140, legs=((4, 0), (-3, 0)), back_arm=-150)
    f['slash2'] = k(lean=2, arm=-40, sword=-50, legs=((3, 0), (-3, 0)), back_arm=-140, fx=slash_arc(2, -13, 12, 80, -50))
    f['windup3'] = k(lean=-2, arm=180, sword=0, crouch=1, legs=((4, 0), (-4, 0)), back_arm=-60)
    f['thrust'] = k(lean=4, arm=0, sword=0, crouch=1, legs=((6, 0), (-4, 0)), back_arm=-150, fx=Q.thrust_fx)
    # the sheathed charge and the dash
    f['iai'] = Q.knight('katana', sheathed=True, lean=-1, crouch=3, arm=-120, back_arm=-130, legs=((5, 0), (-6, 0)))
    def streaks(g):
        for y in (-16, -12, -8, -4):
            g.line((-14, y), (-6, y), '9')
    f['iaiDash'] = k(lean=5, crouch=3, arm=-170, sword=-175, back_arm=-160, legs=((7, 0), (-7, 0)), fx=streaks)
    f['iaiEnd'] = k(lean=3, crouch=2, arm=-20, sword=-10, back_arm=-160, legs=((6, 0), (-6, 0)),
                    fx=slash_arc(0, -12, 13, 120, -20))
    return f

def katana_icon():
    g = G(12, 12, 0, 0)
    for i in range(9):
        x, y = 2 + i, 10 - i
        g.p[y][x] = '1'
        if i > 5: g.p[y][x + 1] = '9' if i == 8 else '1'
    g.p[9][1] = 'e'; g.p[10][0] = 'e'; g.p[11][0] = 'f'
    g.p[8][2] = 'f'; g.p[9][3] = 'f'; g.p[8][3] = 'f'
    return g

def katana_pickup():
    g = G(20, 8, 10, 7)
    g.line((-8, -2), (-4, -2), 'e')
    g.set(-3, -2, 'f'); g.set(-3, -3, 'f'); g.set(-3, -1, 'f')
    g.line((-2, -2), (7, -3), '1'); g.set(8, -3, '9')
    g.outline()
    return g

def bone_pile():
    """a crypt skeleton's bones, still twitching"""
    g = G(30, 24, 15, 23)
    for (x, y, c) in ((-6, 0, 'd'), (-5, 0, 'd'), (-4, -1, 'd'), (-2, 0, 'd'), (0, 0, 'b'), (1, -1, 'd'), (2, 0, 'd'),
                      (4, 0, 'd'), (5, -1, 'd'), (6, -2, 'd'), (7, -2, 'd'), (6, -3, 'd'), (7, -3, 'd'), (7, -1, 'f'),
                      (-1, -1, 'd'), (3, -1, 'b'), (8, -2, '2')):
        g.set(x, y, c)
    g.outline()
    return g
