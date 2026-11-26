"""Chunk 2 art: Ashen Forde (the road, the village, the interiors, the tree and treehouse),
the corrupted bandits, the uncorrupted bandit, the veiled merchant and the Farsight Amulet."""
import math, random
from pixrig import G, P, slash_arc, GROUND, bg_base
import pixrig as R
import textart as T

# ---------------------------------------------------------------- bandits (30x24, feet at 15,23)
def bandit(corrupt=True, lean=0, legs=((2, 0), (-2, 0)), arm=-40, blade=20, crouch=0, back_arm=-120,
           fx=None, sit=False, eyes=True):
    g = G(30, 24, 15, 23)
    hy = -7 + crouch; sx = lean
    cloak, cloak_d, trim = ('c', 'f', 'a') if corrupt else ('e', 'c', '7')
    leg_b, leg_f = ('f', 'c') if corrupt else ('c', 'b')
    # back leg + back arm
    g.line((-1, hy), ((legs[1][0] - 1) / 2, hy + 3), leg_b); g.line(((legs[1][0] - 1) / 2, hy + 3), legs[1], leg_b)
    g.line((sx - 1, hy - 5), P((sx - 1, hy - 5), back_arm, 4), cloak_d)
    # ragged cloak hanging behind
    g.poly([(sx - 1, hy - 8), (sx - 5, hy - 3), (-6, hy + 3), (-4, hy + 1), (-3, hy + 4), (-1, hy + 1), (sx + 1, hy - 6)], cloak)
    g.line((sx - 5, hy - 3), (-6, hy + 3), trim)
    # torso, wrapped
    g.rect(sx - 2, hy - 6, sx + 2, hy - 1, cloak)
    g.line((sx - 1, hy - 5), (sx + 2, hy - 2), trim)
    g.rect(-2, hy, 2, hy, 'e')
    # front leg
    g.line((1, hy), ((legs[0][0] + 1) / 2, hy + 3), leg_f); g.line(((legs[0][0] + 1) / 2, hy + 3), legs[0], leg_f)
    # deep hood
    hx, hyy = sx + 1, hy - 8
    g.rect(hx - 3, hyy - 5, hx + 2, hyy, cloak)
    g.set(hx - 3, hyy - 6, cloak); g.set(hx - 4, hyy - 5, cloak); g.set(hx - 4, hyy - 4, cloak)
    g.rect(hx, hyy - 3, hx + 2, hyy - 1, 'f')          # shadowed face
    if eyes:
        if corrupt:
            g.set(hx + 1, hyy - 2, '3'); g.set(hx + 2, hyy - 2, 'a')
        else:
            g.set(hx + 1, hyy - 2, 'd')
    if corrupt:   # the rot creeping through the cloth
        for (x, y) in ((hx - 2, hyy - 4), (sx - 1, hy - 3), (-4, hy + 1), (hx - 1, hyy - 1)):
            g.set(x, y, 'a')
    else:
        g.line((hx - 3, hyy), (hx + 2, hyy), '7')         # green scarf
    # front arm + curved dagger
    sh = (sx + 1, hy - 5); hand = P(sh, arm, 4)
    g.line(sh, hand, cloak_d if corrupt else 'd')
    if blade is not None:
        g.line(P(hand, blade, 1), P(hand, blade, 6), '1')
        g.set(*P(P(hand, blade, 6), blade + 60, 1), '1')
        g.set(*P(hand, blade, -1), 'e')
    if fx: fx(g)
    g.outline(skip=('3', '9', '5'))
    return g

def sparks(cx, cy, col='5'):
    def f(g):
        for a in range(0, 360, 45):
            g.set(*P((cx, cy), a, 3 if a % 90 == 0 else 2), col)
        g.set(cx, cy, '1')
    return f

def dash_lines(g):
    for y in (-14, -10, -6):
        g.line((-14, y), (-8, y), 'b')

def bandit_frames():
    f = {}
    f['idle'] = bandit(lean=1, crouch=2, arm=-30, blade=10, legs=((3, 0), (-3, 0)))
    f['walk1'] = bandit(lean=2, crouch=2, arm=-30, blade=10, legs=((5, 0), (-4, 0)))
    f['walk2'] = bandit(lean=2, crouch=1, arm=-30, blade=10, legs=((0, 0), (1, 0)))
    f['windup'] = bandit(lean=-1, crouch=3, arm=150, blade=170, back_arm=-60, legs=((4, 0), (-5, 0)))
    f['lunge'] = bandit(lean=4, crouch=2, arm=-5, blade=-5, back_arm=-160, legs=((6, 0), (-6, 0)), fx=dash_lines)
    f['slash'] = bandit(lean=3, crouch=1, arm=-60, blade=-80, back_arm=-160, legs=((5, 0), (-4, 0)),
                        fx=slash_arc(3, -12, 11, 110, -60, 'a'))
    f['parry'] = bandit(lean=-1, crouch=1, arm=60, blade=95, back_arm=-130, legs=((3, 0), (-4, 0)), fx=sparks(8, -15))
    f['dodge'] = bandit(lean=-4, crouch=6, arm=-120, blade=-150, back_arm=-170, legs=((6, 0), (-7, 0)))
    f['hurt'] = bandit(lean=-2, crouch=1, arm=-150, blade=200, back_arm=160, legs=((2, 0), (-3, 0)))
    f['stunned'] = bandit(lean=-3, crouch=4, arm=-110, blade=-100, back_arm=-100, legs=((3, 0), (-4, 0)), eyes=False)
    f['dead'] = bandit(lean=-5, crouch=6, arm=-170, blade=None, back_arm=-160, legs=((4, 0), (-6, 0)), eyes=False)
    return f

def friend_frames():
    """The uncorrupted bandit: same cut of cloth, but earth and green, and nothing in his eyes but tiredness."""
    lean_wall = bandit(corrupt=False, lean=-1, crouch=0, arm=-100, blade=None, back_arm=-100, legs=((2, 0), (-3, 0)))
    talk = bandit(corrupt=False, lean=0, crouch=0, arm=-40, blade=None, back_arm=-100, legs=((2, 0), (-3, 0)))
    return lean_wall, talk

# ---------------------------------------------------------------- the veiled merchant (behind her counter)
def merchant():
    """the merchant, unveiled now, and fast asleep on her feet: head bowed, eyes shut"""
    g = G(22, 32, 11, 31)
    # long dark robe
    g.poly([(-4, -20), (4, -20), (7, 0), (-7, 0)], 'c')
    g.line((0, -18), (0, 0), 'f')
    # long dark hair falling either side of a bowed head
    g.rect(-3, -28, 3, -19, 'f')
    g.rect(-2, -26, 3, -21, 'd')                     # her face, tipped forward
    g.line((0, -24), (1, -24), 'c'); g.line((2, -24), (3, -24), 'c')    # eyes shut
    g.set(2, -22, 'e')
    g.line((-3, -29), (2, -29), 'f')
    # many amulets, strung across her chest
    for (x, y, c) in ((-3, -17, '5'), (-1, -16, '4'), (1, -16, '6'), (3, -17, '2'), (0, -14, '7'),
                      (-2, -13, '3'), (2, -13, 'a'), (-4, -15, '5'), (4, -15, '4')):
        g.set(x, y, c)
    g.line((-4, -19), (0, -17), 'b'); g.line((0, -17), (4, -19), 'b')
    g.outline()
    # z z z
    for (x, y) in ((6, -30), (7, -30), (7, -29), (6, -28), (7, -28), (9, -27), (10, -27), (9, -25), (10, -25), (10, -26)):
        g.set(x, y, '1')
    return g

# ---------------------------------------------------------------- Farsight Amulet
def amulet_pickup():
    g = G(10, 12, 5, 11)
    for a in range(200, 341, 20): g.set(*P((0, -6), a, 4), 'b')      # the chain
    g.rect(-2, -4, 2, 0, '6'); g.rect(-1, -3, 1, -1, '9'); g.set(0, -2, '1')
    g.set(-3, -2, '5'); g.set(3, -2, '5')
    g.outline()
    return g

def amulet_icon():
    g = G(12, 12, 0, 0)
    for x in range(3, 9): g.p[1][x] = 'b'
    g.p[2][2] = 'b'; g.p[2][9] = 'b'; g.p[3][2] = 'b'; g.p[3][9] = 'b'; g.p[4][3] = 'b'; g.p[4][8] = 'b'
    for y in range(5, 11):
        for x in range(3, 9): g.p[y][x] = '6'
    for y in range(6, 10):
        for x in range(4, 8): g.p[y][x] = '9'
    g.p[7][5] = '1'; g.p[7][6] = '1'; g.p[8][5] = '8'; g.p[8][6] = '8'
    for (x, y) in ((2, 7), (9, 7)): g.p[y][x] = '5'
    return g

# ---------------------------------------------------------------- shared scenery helpers
def dither(g, y0, y1, c0, c1, seed=0):
    bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
    for y in range(y0, y1):
        t = (y - y0) / max(1, y1 - y0)
        for x in range(160):
            g.p[y][x] = c1 if bayer[y % 4][x % 4] / 16 < t else c0

def grass_floor(g, seed, top='7', soil='e', speck='c', path=None):
    r = random.Random(seed)
    for y in range(GROUND, 120):
        for x in range(160): g.p[y][x] = soil
    for x in range(160):
        g.p[GROUND][x] = top if r.random() < .7 else soil
        if r.random() < .3: g.p[GROUND - 1][x] = top
    for _ in range(45): g.p[r.randint(GROUND + 2, 119)][r.randint(0, 159)] = speck
    if path:   # a worn dirt track
        for y in range(GROUND, 120):
            for x in range(160):
                if r.random() < .6: g.p[y][x] = path
        for x in range(160):
            if r.random() < .5: g.p[GROUND][x] = path

def plank_floor(g, seed, top='e', mid='e', gap='f', rot=0.0):
    r = random.Random(seed)
    for y in range(GROUND, 120):
        for x in range(160): g.p[y][x] = mid
    for x in range(160): g.p[GROUND][x] = 'd' if r.random() < .4 else top
    for y in range(GROUND + 1, 120, 4):
        for x in range(160): g.p[y][x] = gap
        x = r.randint(0, 20)
        while x < 160:
            for yy in range(y, min(120, y + 4)): g.p[yy][x] = gap
            x += r.randint(14, 30)
    for _ in range(int(rot * 40)):
        x, y = r.randint(0, 150), r.randint(GROUND + 2, 116)
        for yy in range(y, y + 2):
            for xx in range(x, x + r.randint(3, 8)):
                if xx < 160 and yy < 120: g.p[yy][xx] = 'f'

def tree_line(g, seed, far='c', near_trunk='e', leaf='6', leaf2='7', trunks=(10, 54, 150), top=12):
    r = random.Random(seed)
    for tx in range(-4, 165, 12):
        h = r.randint(28, 46)
        for y in range(h, GROUND):
            w = 3 if y > h + 10 else 1 + (y - h) // 4
            for x in range(tx - w, tx + w + 1):
                if 0 <= x < 160: g.p[y][x] = far
    for tx in trunks:
        for y in range(0, GROUND):
            for x in range(tx - 3, tx + 4):
                if 0 <= x < 160: g.p[y][x] = near_trunk if abs(x - tx) < 2 else 'f'
            if y % 6 == 0 and 0 <= tx - 1 < 160: g.p[y][tx - 1] = 'f'
        for y in range(0, top + 12):
            for x in range(tx - 13, tx + 14):
                if 0 <= x < 160 and (x - tx) ** 2 / 169 + (y - top + 4) ** 2 / 180 < 1 and r.random() < .85:
                    g.p[y][x] = leaf2 if r.random() < .25 else leaf

def wood_wall(g, x0, x1, y0, y1, seed, c='e', joint='f', rot=0.0, holes=0, sky='c'):
    """vertical boards; rot = chance of a missing chunk, holes show 'sky' behind"""
    r = random.Random(seed)
    for x in range(x0, x1):
        board = (x - x0) % 6 == 0
        for y in range(y0, y1):
            if 0 <= x < 160 and 0 <= y < 120:
                g.p[y][x] = joint if board else c
        if not board and r.random() < .25:
            y = r.randint(y0, y1 - 1)
            if 0 <= x < 160: g.p[y][x] = 'c' if c == 'e' else 'b'
    for _ in range(holes):
        hx, hy = r.randint(x0 + 2, x1 - 6), r.randint(y0 + 2, y1 - 8)
        w, h = r.randint(2, 4), r.randint(3, 7)
        for y in range(hy, hy + h):
            for x in range(hx, hx + w):
                if 0 <= x < 160 and r.random() < .85: g.p[y][x] = sky

def doorway(g, cx, w=14, h=26, dark='f', frame='c', broken=False):
    for y in range(GROUND - h, GROUND):
        for x in range(cx - w // 2, cx + w // 2):
            g.p[y][x] = dark
    for y in range(GROUND - h - 1, GROUND):
        g.p[y][cx - w // 2 - 1] = frame; g.p[y][cx + w // 2] = frame
    for x in range(cx - w // 2 - 1, cx + w // 2 + 1): g.p[GROUND - h - 1][x] = frame
    if broken:   # a door hanging off one hinge
        for i in range(h - 4):
            for x in range(4):
                xx = cx + w // 2 - 2 - x + i // 5
                yy = GROUND - h + 2 + i
                if xx < 160: g.p[yy][xx] = 'e' if x else 'f'

def window(g, x, y, w=6, h=6, lit=False, broken=False):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            g.p[yy][xx] = ('4' if (xx + yy) % 2 else '5') if lit else 'f'
    for xx in range(x - 1, x + w + 1): g.p[y - 1][xx] = 'c'; g.p[y + h][xx] = 'c'
    for yy in range(y - 1, y + h + 1): g.p[yy][x - 1] = 'c'; g.p[yy][x + w] = 'c'
    if broken:
        g.p[y + 1][x + 1] = 'c'; g.p[y + 2][x + 2] = 'c'; g.p[y + h - 2][x + w - 2] = 'c'

def roof(g, x0, x1, y_top, y_eave, c='c', c2='f', sag=0, holes=0, seed=0, sky_rows=None):
    r = random.Random(seed)
    mid = (x0 + x1) / 2
    for x in range(x0, x1 + 1):
        t = abs(x - mid) / ((x1 - x0) / 2)
        top = int(y_top + (y_eave - y_top) * t + sag * math.sin(math.pi * (x - x0) / (x1 - x0)) * (1 - t))
        for y in range(top, y_eave + 2):
            if 0 <= x < 160 and 0 <= y < 120:
                g.p[y][x] = c2 if (y - top) % 3 == 0 else c
    for _ in range(holes):
        hx = r.randint(x0 + 6, x1 - 8)
        t = abs(hx - mid) / ((x1 - x0) / 2)
        hy = int(y_top + (y_eave - y_top) * t) + 2
        for y in range(hy, hy + r.randint(3, 6)):
            for x in range(hx, hx + r.randint(3, 6)):
                if 0 <= x < 160 and y < 120 and sky_rows: g.p[y][x] = sky_rows(y)

def dusk_sky(y):
    return '8' if y < 22 else ('c' if y < 60 else 'b')

def dusk(g, seed=0):
    dither(g, 0, 26, '8', 'c'); dither(g, 26, 62, 'c', 'b')
    r = random.Random(seed)
    for _ in range(14): g.p[r.randint(0, 20)][r.randint(0, 159)] = '1'

# ---------------------------------------------------------------- area 8: the road, the sign, the gate
def bg_road():
    g = bg_base(dusk_sky); dusk(g, 1)
    tree_line(g, 81, trunks=(8,), top=10)
    grass_floor(g, 82, path='b')
    # a leaning wooden signpost, its arm pointing right
    sx = 26
    for y in range(GROUND - 34, GROUND):
        g.p[y][sx] = 'e'; g.p[y][sx + 1] = 'e'; g.p[y][sx - 1] = 'f'; g.p[y][sx + 2] = 'f'
    sign = T.text_grid('ASHEN FORDE', 8, 'f', font=T.SANS, spacing=0, shadow='.')
    sw, sh = len(sign[0]), len(sign)
    bx0, by0 = sx - 4, GROUND - 34
    for y in range(by0 - 1, by0 + sh + 1):
        for x in range(bx0 - 1, bx0 + sw + 5):
            g.p[y][x] = 'f'
    for y in range(by0, by0 + sh):
        for x in range(bx0, bx0 + sw + 4):
            g.p[y][x] = 'd' if (x * 3 + y) % 11 else 'b'
    tip0 = bx0 + sw + 5                 # pointed end, pointing the way into the village
    half = sh // 2 + 1
    for i in range(half + 1):
        for yy in range(by0 - 1 + i, by0 + sh + 1 - i):
            g.p[yy][tip0 + i] = 'f' if (yy in (by0 - 1 + i, by0 + sh - i)) else 'd'
    for y in range(sh):
        for x in range(sw):
            if sign[y][x] == 'f': g.p[by0 + y][bx0 + 2 + x] = 'f'
    # the village palisade: sharpened stakes, an open gateway, a crooked lintel
    for x in range(112, 160):
        if 128 <= x < 146: continue
        top = 44 + (x * 7) % 5
        for y in range(top, GROUND):
            g.p[y][x] = 'f' if x % 5 == 0 else ('e' if y > top + 2 else 'b')
        g.p[top - 1][x] = 'f' if x % 5 in (2, 3) else g.p[top - 1][x]
    for y in range(36, GROUND):
        for x in (126, 127, 146, 147): g.p[y][x] = 'e' if x in (126, 146) else 'f'
    for x in range(122, 152):
        y = 36 + (x - 122) // 10
        g.p[y][x] = 'e'; g.p[y + 1][x] = 'e'; g.p[y + 2][x] = 'f'
    for y in range(39, 46): g.p[y][136] = 'b'          # a rope with something tied to it
    g.p[46][135] = 'd'; g.p[46][136] = 'd'; g.p[47][136] = 'd'
    return g

# ---------------------------------------------------------------- village street backdrop
def village_base(seed):
    g = bg_base(dusk_sky); dusk(g, seed)
    r = random.Random(seed)
    # far rooftops and smokeless chimneys
    for bx in range(-6, 166, 26):
        w = r.randint(16, 22); top = r.randint(44, 54)
        for y in range(top, GROUND):
            for x in range(bx, bx + w):
                if 0 <= x < 160: g.p[y][x] = 'f'
        for x in range(bx - 2, bx + w + 2):
            for y in range(top - 6 + abs(x - bx - w // 2) // 2, top):
                if 0 <= x < 160 and y > top - 8: g.p[y][x] = 'f'
    grass_floor(g, seed + 1, top='7', soil='e', path='b')
    # a fence along the back of the street
    for x in range(0, 160):
        if x % 7 == 0:
            for y in range(GROUND - 12, GROUND): g.p[y][x] = 'e'
        elif x % 7 in (1,):
            for y in range(GROUND - 12, GROUND): g.p[y][x] = 'f'
    for y in (GROUND - 9, GROUND - 4):
        for x in range(160):
            if r.random() < .85: g.p[y][x] = 'e'
    return g

DOOR_X = {9: 80, 11: 80, 13: 80}   # where the doorways stand in each street

def bg_village1():
    """a dilapidated house: a sagging roof with holes, boards missing, a broken door"""
    g = village_base(91)
    wood_wall(g, 52, 110, 58, GROUND, 92, rot=.2, holes=5, sky='f')
    roof(g, 46, 116, 34, 58, sag=6, holes=3, seed=93, sky_rows=dusk_sky)
    window(g, 60, 70, broken=True); window(g, 98, 70, broken=True)
    doorway(g, DOOR_X[9], broken=True)
    # a cart wheel and a rain barrel
    for a in range(0, 360, 30): g.p[int(GROUND - 6 - 5 * math.sin(math.radians(a)))][int(30 + 5 * math.cos(math.radians(a)))] = 'e'
    for y in range(GROUND - 10, GROUND):
        for x in range(128, 136): g.p[y][x] = 'e' if (y % 4) else 'f'
    return g

def bg_village2():
    """the church: very nearly a ruin, steeple snapped, the roof half gone"""
    g = village_base(101)
    wood_wall(g, 46, 116, 50, GROUND, 102, c='e', rot=.5, holes=10, sky='f')
    roof(g, 40, 122, 26, 50, sag=10, holes=6, seed=103, sky_rows=dusk_sky)
    # half the roof gone: the rafters show against the sky
    for x in range(86, 122):
        for y in range(26, 52):
            if g.p[y][x] in ('c', 'f') and y < 26 + (x - 86) * 0.7 + 6:
                g.p[y][x] = dusk_sky(y)
    for x in range(90, 122, 6):
        for y in range(28 + (x - 86) // 2, 50): g.p[y][x] = 'f'
    # the snapped steeple, leaning
    for i in range(30):
        y = 36 - i
        x0 = 68 + i // 4
        for x in range(x0 - 4, x0 + 5):
            if y >= 0: g.p[y][x] = 'f' if abs(x - x0) == 4 else 'e'
    for y in range(6, 12):
        for x in range(70, 80): g.p[y][x] = dusk_sky(y)
    # a crooked cross, still nailed to the broken tip
    for y in range(4, 14): g.p[y][69] = 'b'
    for x in range(66, 73): g.p[7][x] = 'b'
    # tall arched windows, glass long gone
    for wx in (56, 100):
        for y in range(62, 82):
            for x in range(wx, wx + 6):
                if y > 63 or x in (wx + 1, wx + 2, wx + 3, wx + 4): g.p[y][x] = 'f'
    doorway(g, DOOR_X[11], w=16, h=30, broken=False)
    # gravestones
    for gx in (16, 28, 136, 148):
        for y in range(GROUND - 8, GROUND):
            for x in range(gx, gx + 5):
                if not (y == GROUND - 8 and x in (gx, gx + 4)): g.p[y][x] = 'b' if x < gx + 4 else 'c'
    return g

def bg_village3():
    """a house someone has kept: patched, but whole, with a warm light inside"""
    g = village_base(111)
    wood_wall(g, 54, 108, 60, GROUND, 112, c='e', rot=.05, holes=0)
    roof(g, 48, 114, 38, 60, sag=1, holes=0, seed=113)
    for (x, y) in ((70, 46), (92, 50)):    # patches on the roof
        for yy in range(y, y + 3):
            for xx in range(x, x + 5): g.p[yy][xx] = 'b'
    window(g, 62, 72, lit=True); window(g, 96, 72, lit=True)
    doorway(g, DOOR_X[13], dark='c')
    # a hanging sign with an eye painted on it
    for y in range(62, 66): g.p[y][96] = 'b'
    for y in range(66, 72):
        for x in range(90, 102): g.p[y][x] = 'd'
    for x in range(93, 99): g.p[68][x] = '8'; g.p[69][x] = '8'
    g.p[68][95] = '9'; g.p[68][96] = '9'; g.p[69][95] = 'f'; g.p[69][96] = 'f'
    # a lantern by the door
    g.p[GROUND - 22][71] = '5'; g.p[GROUND - 21][71] = '4'; g.p[GROUND - 23][71] = 'f'
    return g

# ---------------------------------------------------------------- interiors (door on the left)
def interior_base(seed, wall='e', rot=0.0, holes=0, beam_light=False):
    g = bg_base(lambda y: 'f')
    wood_wall(g, 0, 160, 0, GROUND, seed, c=wall, rot=rot, holes=holes, sky='c')
    # rafters
    for y in (8, 9, 10):
        for x in range(160): g.p[y][x] = 'f' if y == 10 else 'c'
    for x in range(0, 160, 32):
        for y in range(0, 10):
            g.p[y][x] = 'c'; g.p[y][x + 1] = 'f'
    plank_floor(g, seed + 1, rot=rot)
    # the way out, on the left
    for y in range(GROUND - 26, GROUND):
        for x in range(2, 14): g.p[y][x] = 'c'
    for y in range(GROUND - 27, GROUND):
        g.p[y][1] = 'b'; g.p[y][14] = 'b'
    for x in range(1, 15): g.p[GROUND - 27][x] = 'b'
    return g

def bg_house_inside():
    g = interior_base(121, rot=.4, holes=8)
    r = random.Random(122)
    # an overturned table, broken chairs, a collapsed shelf
    for y in range(GROUND - 8, GROUND):
        for x in range(54, 76): g.p[y][x] = 'e' if y > GROUND - 7 else 'b'
    for x in (56, 73):
        for y in range(GROUND - 16, GROUND - 8): g.p[y][x] = 'e'
    for i in range(10): g.p[GROUND - 1 - i // 2][110 + i] = 'b'
    for x in range(124, 150):
        g.p[50 + (x - 124) // 3][x] = 'b'; g.p[51 + (x - 124) // 3][x] = 'f'
    # light falling through the holes in the roof, in dusty shafts
    for sx in (40, 92, 134):
        for y in range(11, GROUND):
            x = sx + (y - 11) // 4
            for xx in (x, x + 2):
                if xx < 160 and (xx + y) % 3 == 0: g.p[y][xx] = 'b'
    # something dark has dragged itself across the floor
    for x in range(30, 130):
        if r.random() < .5: g.p[GROUND + 1][x] = 'a'
    return g

def bg_church_inside():
    g = interior_base(131, wall='e', rot=.6, holes=14)
    # broken pews in rows
    for px_ in (34, 62, 104, 132):
        for y in range(GROUND - 9, GROUND):
            for x in range(px_, px_ + 16):
                if y == GROUND - 9 or x in (px_, px_ + 15): g.p[y][x] = 'e'
                elif y == GROUND - 5: g.p[y][x] = 'b'
        g.p[GROUND - 9][px_ + 7] = '.' if False else 'f'
    # the altar at the far end, and a great round window above it, shattered
    for y in range(GROUND - 12, GROUND):
        for x in range(140, 158): g.p[y][x] = 'b' if y == GROUND - 12 else 'c'
    cx, cy = 148, 40
    for y in range(cy - 14, cy + 15):
        for x in range(cx - 14, cx + 15):
            d = (x - cx) ** 2 + (y - cy) ** 2
            if d < 14 ** 2 and x < 160:
                g.p[y][x] = 'c' if d > 12 ** 2 else ('8' if (x + y) % 3 else '9')
    for a in range(0, 360, 45):
        for i in range(12): g.p[int(cy - math.sin(math.radians(a)) * i)][int(cx + math.cos(math.radians(a)) * i)] = 'f'
    for (x, y) in ((144, 34), (146, 35), (151, 44), (152, 45), (150, 46)): g.p[y][x] = 'f'
    # light pouring across the floor from the window
    for y in range(54, GROUND):
        for x in range(60 + (GROUND - y), 140 - (y - 54) // 3):
            if (x + y) % 4 == 0 and 0 <= x < 160: g.p[y][x] = '8'
    return g

def bg_shop_inside():
    g = interior_base(141, wall='e', rot=.05, holes=0)
    # shelves of bottles and trinkets
    for sy in (40, 58):
        for x in range(24, 70): g.p[sy][x] = 'b'; g.p[sy + 1][x] = 'f'
        for x in range(26, 68, 4):
            c = '6879a5'[(x // 4 + sy) % 6]
            g.p[sy - 1][x] = c; g.p[sy - 2][x] = c; g.p[sy - 3][x + 1 if x % 8 else x] = 'b'
    # her wares: amulets pegged to a board on the wall, hidden behind a translucent blue veil
    for y in range(20, 56):
        for x in range(80, 154):
            g.p[y][x] = 'c' if (x in (80, 153) or y in (20, 55)) else 'e'
    for row, y in enumerate((26, 36, 46)):
        for x in range(86, 150, 9):
            c = '54627a3'[(x // 9 + row) % 7]
            g.p[y - 2][x] = 'b'; g.p[y - 1][x - 1] = 'b'; g.p[y - 1][x + 1] = 'b'
            for yy in range(y, y + 3):
                for xx in range(x - 1, x + 2): g.p[yy][xx] = c
            g.p[y + 1][x] = '1'
    for x in range(78, 156): g.p[17][x] = 'b'; g.p[18][x] = '8'          # the veil's rail
    for y in range(19, 60):
        sway = int(1.5 * math.sin(y / 5))
        for x in range(78 + sway, 156 + sway):
            if 0 <= x < 160 and (x + y) % 2 == 0 and y % 2 == 0: g.p[y][x] = '9'
        if 0 <= 77 + sway < 160: g.p[y][77 + sway] = '9'
    # a counter she stands behind
    for y in range(GROUND - 14, GROUND):
        for x in range(96, 150): g.p[y][x] = 'd' if y == GROUND - 14 else ('e' if (x - 96) % 9 else 'f')
    # two candles on the counter
    for cx in (100, 144):
        g.p[GROUND - 15][cx] = '1'; g.p[GROUND - 16][cx] = '1'; g.p[GROUND - 17][cx] = '5'; g.p[GROUND - 18][cx] = '4'
    return g

# ---------------------------------------------------------------- area 15: the great tree; area 16: the treehouse
TREE_X = 120

def bg_tree():
    g = bg_base(lambda y: '8' if y < 30 else ('6' if y < 70 else 'c'))
    r = random.Random(151)
    for y in range(20, 70):
        for x in range(160):
            if (x + y) % 2 == 0 and r.random() < (y - 20) / 60: g.p[y][x] = '6' if y < 50 else 'c'
    tree_line(g, 152, trunks=(14, 56), top=8)
    grass_floor(g, 153)
    # the great tree: a wide trunk with the ladder nailed to it, vanishing into the canopy
    for y in range(0, GROUND):
        flare = max(0, (y - 88) // 2)
        for x in range(TREE_X - 12 - flare, TREE_X + 13 + flare):
            if 0 <= x < 160:
                edge = min(x - (TREE_X - 12 - flare), TREE_X + 12 + flare - x)
                g.p[y][x] = 'f' if edge < 1 else ('c' if edge < 3 or (x + y // 3) % 7 == 0 else 'e')
    for y in range(0, 16):
        for x in range(80, 160):
            if r.random() < .9: g.p[y][x] = '7' if r.random() < .25 else '6'
    for x in range(TREE_X - 20, TREE_X + 21):     # the underside of the treehouse floor
        for y in (14, 15, 16): g.p[y][x] = 'e' if y < 16 else 'f'
    from pixrig2 import draw_ladder
    draw_ladder(g, TREE_X, 17, GROUND - 1)
    # fireflies
    for _ in range(12): g.p[r.randint(30, 95)][r.randint(0, 100)] = '5'
    return g

def bg_treehouse():
    g = bg_base(lambda y: 'f')
    wood_wall(g, 0, 160, 0, GROUND, 161, c='e', rot=.1, holes=0)
    # a wide window onto the canopy and the evening
    for y in range(30, 70):
        for x in range(20, 64):
            g.p[y][x] = '8' if y < 44 else ('6' if (x + y) % 3 else '7')
    for x in range(19, 65): g.p[29][x] = 'c'; g.p[70][x] = 'c'
    for y in range(29, 71): g.p[y][19] = 'c'; g.p[y][64] = 'c'; g.p[y][42] = 'c'
    for _ in range(6): g.p[random.Random(_).randint(31, 42)][random.Random(_ + 9).randint(21, 62)] = '1'
    # bedroll, a pack, a coil of rope
    for y in range(GROUND - 3, GROUND):
        for x in range(76, 100): g.p[y][x] = '7' if y == GROUND - 3 else 'e'
    for y in range(GROUND - 7, GROUND):
        for x in range(140, 150): g.p[y][x] = 'b' if (x + y) % 4 else 'e'
    for a in range(0, 360, 30):
        g.p[int(GROUND - 4 - 3 * math.sin(math.radians(a)))][int(66 + 4 * math.cos(math.radians(a)))] = 'd'
    plank_floor(g, 162)
    # the hatch down
    for y in range(GROUND, 120):
        for x in range(TREE_X - 6, TREE_X + 7): g.p[y][x] = 'f'
    from pixrig2 import draw_ladder
    draw_ladder(g, TREE_X, GROUND, 119)
    for x in range(TREE_X - 7, TREE_X + 8): g.p[GROUND][x] = 'b'
    return g

def merchant_behind_counter():
    """only the part of her that shows above the counter (the counter is in the background)"""
    g = merchant()
    g.p = g.p[:18]
    g.h = 18
    return g
