"""Chunk 4 art: the Red Hand (a big, tough rival with a tattered cloak streaming in the wind), his throne room,
the camp gate opened and its bonfire, the merchant awake, the horn, the Rusted Dagger and its ghost dagger,
and the Stalwart and Focus amulet icons."""
import math, random
from pixrig import G, P, slash_arc, GROUND, bg_base
import pixrig2 as Q
import pixrig4 as W
import pixrig5 as V
import textart as T

# ---------------------------------------------------------------- the Red Hand (64x56, feet at 32,55)
# He's built like the player knight, only twice the size and far more dangerous:
# dark leather and blackened mail, a deep hood, a falchion, a hand painted red to the wrist,
# and a long crimson cloak, torn to ribbons, that never stops moving.
RED, RED_D = '2', 'e'

def cloak(g, top, phase, lift=0.0, length=30, sx=0):
    """the cloak hangs from the shoulders and streams out behind (to the left), rippling with `phase`"""
    x0, y0 = top
    pts_top, pts_bot = [], []
    n = 12
    for k in range(n + 1):
        t = k / n
        # it flies back and lifts more the further from the shoulders it is
        x = x0 - 3 - t * length * (0.75 + 0.25 * lift)
        wave = math.sin(t * 5.5 - phase * 2.1) * (1.5 + 3.5 * t)
        y_up = y0 + 2 + t * (22 - 12 * lift) + wave - t * 4
        y_dn = y_up + 7 + 10 * (1 - t) + 2 * math.sin(t * 9 + phase * 2.1)
        pts_top.append((x, y_up)); pts_bot.append((x, y_dn))
    poly = pts_top + list(reversed(pts_bot))
    g.poly(poly, RED)
    # inner shadow along the top edge, lighter fold through the middle
    for k in range(n):
        g.line(pts_top[k], pts_top[k + 1], RED_D)
    for k in range(2, n, 2):
        (xa, ya), (xb, yb) = pts_top[k], pts_bot[k]
        g.line(((xa + xb) / 2, (ya + yb) / 2), ((xa + xb) / 2 - 2, (ya + yb) / 2 + 1), '3')
    # tattered: notches torn out of the trailing edge, ribbons trailing off the end
    r = random.Random(7 + int(phase * 10))
    for k in range(3, n + 1):
        if k % 2 == 0:
            (xb, yb) = pts_bot[k]
            for d in range(r.randint(2, 4)):
                g.set(xb, yb - d, '.')
                g.set(xb + 1, yb - d, '.')
    tail = pts_top[-1]
    for j, dy in enumerate((2, 6, 10)):
        g.line((tail[0], tail[1] + dy), (tail[0] - 4 - j, tail[1] + dy + math.sin(phase * 2 + j) * 2), RED)

def red_hand(lean=0, crouch=0, legs=((5, 0), (-5, 0)), knees=None, arm=-50, blade=40, back_arm=-110,
             phase=0, lift=0.0, sit=False, fx=None, eyes=True, cordial=False, throw=False, roll=None, blade_out=True):
    g = G(64, 56, 32, 55)
    if roll is not None:
        return red_roll(roll, phase)
    hip = (lean * 0.5, -20 + crouch)
    sh = (lean, -34 + crouch)
    # the cloak first, so everything else is in front of it
    cloak(g, (sh[0] - 1, sh[1] - 1), phase, lift)
    # back leg
    if sit:
        g.thick((hip[0] - 1, hip[1]), (hip[0] + 9, hip[1] + 1), 'c', 4)
        g.thick((hip[0] + 9, hip[1] + 1), (hip[0] + 10, 0), 'c', 4)
    else:
        bk = knees[1] if knees else ((hip[0] + legs[1][0]) / 2 - 1, hip[1] + 10)
        g.thick((hip[0] - 1, hip[1]), bk, 'c', 4); g.thick(bk, legs[1], 'c', 4)
        g.rect(legs[1][0] - 3, -1, legs[1][0] + 2, 0, 'f')
    # back arm
    bsh = (sh[0] - 2, sh[1] + 2)
    bhand = P(bsh, back_arm, 11)
    g.thick(bsh, bhand, 'c', 3)
    if cordial:
        pass
    # torso: blackened mail under a leather jerkin, a red sash
    g.poly([(sh[0] - 6, sh[1]), (sh[0] + 6, sh[1]), (hip[0] + 5, hip[1]), (hip[0] - 5, hip[1])], 'c')
    g.poly([(sh[0] - 4, sh[1] + 2), (sh[0] + 4, sh[1] + 2), (hip[0] + 3, hip[1] - 2), (hip[0] - 3, hip[1] - 2)], 'e')
    for yy in range(int(sh[1]) + 3, int(hip[1]) - 2, 3):
        g.set(sh[0] - 1 + (yy - sh[1]) * lean / 40, yy, 'f')
    g.line((hip[0] - 5, hip[1] - 2), (hip[0] + 5, hip[1] - 1), RED)
    g.line((hip[0] - 5, hip[1] - 1), (hip[0] + 5, hip[1]), RED)
    g.set(hip[0] + 1, hip[1] - 1, '5')
    # pauldrons
    g.rect(sh[0] - 7, sh[1] - 1, sh[0] - 3, sh[1] + 2, 'b'); g.rect(sh[0] + 3, sh[1] - 1, sh[0] + 7, sh[1] + 2, 'b')
    # front leg
    if sit:
        g.thick((hip[0] + 1, hip[1] + 1), (hip[0] + 12, hip[1] + 2), 'b', 4)
        g.thick((hip[0] + 12, hip[1] + 2), (hip[0] + 13, 0), 'b', 4)
        g.rect(hip[0] + 11, -1, hip[0] + 16, 0, 'f')
    else:
        fk = knees[0] if knees else ((hip[0] + legs[0][0]) / 2 + 1, hip[1] + 10)
        g.thick((hip[0] + 1, hip[1]), fk, 'b', 4); g.thick(fk, legs[0], 'b', 4)
        g.rect(legs[0][0] - 2, -1, legs[0][0] + 3, 0, 'f')
    # head: a deep hood with a pale, scarred face in shadow
    hx, hy = sh[0] + 1, sh[1] - 6
    g.rect(hx - 4, hy - 6, hx + 4, hy + 2, 'f')
    g.rect(hx - 5, hy - 5, hx - 4, hy + 3, RED_D)
    g.rect(hx - 3, hy - 7, hx + 3, hy - 6, RED_D)
    g.rect(hx, hy - 3, hx + 4, hy + 1, 'c')
    if eyes:
        g.set(hx + 2, hy - 2, '1'); g.set(hx + 3, hy - 2, '1')
    g.line((hx + 1, hy + 1), (hx + 4, hy - 1), '2')       # a red stripe painted across the face
    # front arm and the falchion
    fsh = (sh[0] + 2, sh[1] + 2)
    hand = P(fsh, arm, 11)
    g.thick(fsh, hand, 'b', 3)
    g.rect(hand[0] - 1, hand[1] - 1, hand[0] + 1, hand[1] + 1, RED)     # the red hand
    if cordial:
        g.rect(hand[0] - 1, hand[1] - 4, hand[0] + 1, hand[1] - 2, '4')
        g.set(hand[0], hand[1] - 5, '5')
    elif throw:
        g.line(P(hand, arm, 1), P(hand, arm, 5), '1')
    elif blade_out:
        g.set(*P(hand, blade, -2), 'e'); g.set(*P(hand, blade, -3), 'e')
        g.line(P(hand, blade + 90, 3), P(hand, blade - 90, 3), '5')
        # a broad, slightly curved blade: two pixels wide, widening towards the tip
        for k in range(2, 20):
            c = P(hand, blade, k)
            g.set(*c, '1')
            g.set(*P(c, blade - 90, 1), 'd' if k < 15 else '1')
            if k > 12:
                g.set(*P(c, blade - 90, 2), 'd')
        g.set(*P(hand, blade, 20), '1')
    if fx:
        fx(g)
    g.outline(skip=('9',))
    return g

def red_roll(k, phase):
    """a heavy roll, cloak whipping round him"""
    g = G(64, 56, 32, 55)
    cx, cy = 0, -12
    ang = k * 90
    g.poly([P((cx, cy), ang + a, 13) for a in range(0, 360, 30)], RED)
    for a in range(0, 360, 30):
        if a % 60 == 0: g.set(*P((cx, cy), ang + a, 13), '.')
    g.poly([P((cx, cy), ang + a, 9) for a in range(0, 360, 30)], 'c')
    g.rect(*P((cx, cy), ang + 40, 4), *[v + 2 for v in P((cx, cy), ang + 40, 4)], 'f')
    g.line(P((cx, cy), ang + 200, 4), P((cx, cy), ang + 200, 9), 'b')
    g.line(P((cx, cy), ang + 120, 5), P((cx, cy), ang + 150, 18), '1')
    for i in range(3):
        g.line((-18 - i * 3, -20 + i * 6), (-26 - i * 3, -20 + i * 6), '9')
    g.outline(skip=('9',))
    return g

def red_frames():
    f = {}
    for p in range(3):
        f[f'idle{p}'] = red_hand(lean=1, crouch=1, arm=-40, blade=-30, back_arm=-100, phase=p, legs=((6, 0), (-6, 0)))
    f['sit0'] = red_hand(sit=True, crouch=8, lean=-1, arm=-80, blade=-90, back_arm=-70, phase=0, lift=0.0)
    f['sit1'] = red_hand(sit=True, crouch=8, lean=-1, arm=-80, blade=-90, back_arm=-70, phase=1, lift=0.0)
    f['rise'] = red_hand(lean=-1, crouch=5, arm=-60, blade=-60, back_arm=-110, phase=2, legs=((8, 0), (-6, 0)))
    for i, (lf, lb) in enumerate([((10, 0), (-8, 0)), ((3, -2), (-2, 0)), ((-6, 0), (8, 0)), ((0, 0), (2, -2))]):
        f[f'run{i}'] = red_hand(lean=4, crouch=1 if i % 2 else 0, legs=(lf, lb), arm=-60, blade=-150, back_arm=-130,
                                phase=i * 0.75, lift=0.6)
    # a 3-hit chain like yours: a rising cut, a falling cut, a driving thrust
    f['windup1'] = red_hand(lean=-2, crouch=2, arm=-130, blade=-150, back_arm=-160, phase=1, legs=((7, 0), (-7, 0)))
    f['cut1'] = red_hand(lean=4, crouch=1, arm=40, blade=55, back_arm=-160, phase=2, lift=0.3, legs=((9, 0), (-6, 0)),
                         fx=slash_arc(6, -30, 24, -60, 80))
    f['windup2'] = red_hand(lean=2, crouch=1, arm=110, blade=130, back_arm=-150, phase=0, legs=((8, 0), (-6, 0)))
    f['cut2'] = red_hand(lean=4, crouch=3, arm=-45, blade=-60, back_arm=-140, phase=1, lift=0.3, legs=((9, 0), (-6, 0)),
                         fx=slash_arc(6, -30, 24, 100, -60))
    f['windup3'] = red_hand(lean=-3, crouch=3, arm=175, blade=0, back_arm=-50, phase=2, legs=((8, 0), (-8, 0)))
    def thrust(g):
        for i, y in enumerate((-30, -26, -34)): g.line((-12 - i * 2, y), (-24 - i * 2, y), '9')
    f['thrust'] = red_hand(lean=8, crouch=3, arm=0, blade=0, back_arm=-160, phase=0, lift=0.8, legs=((12, 0), (-9, 0)), fx=thrust)
    def dash(g):
        for y in (-40, -32, -24, -16): g.line((-22, y), (-30, y), '9')
    f['lungeUp'] = red_hand(lean=-3, crouch=6, arm=160, blade=175, back_arm=-40, phase=1, legs=((9, 0), (-10, 0)))
    f['lunge'] = red_hand(lean=9, crouch=5, arm=-10, blade=-15, back_arm=-170, phase=2, lift=1.0, legs=((13, 0), (-11, 0)), fx=dash)
    f['throwUp'] = red_hand(lean=-3, crouch=2, arm=160, back_arm=-60, throw=True, blade_out=False, phase=0, legs=((7, 0), (-7, 0)))
    f['throw'] = red_hand(lean=5, crouch=1, arm=-10, back_arm=-160, blade_out=False, phase=1, lift=0.4, legs=((9, 0), (-6, 0)))
    def sparks(g):
        for a in range(0, 360, 45): g.set(*P((18, -34), a, 4 if a % 90 == 0 else 3), '5')
        g.set(18, -34, '1')
    f['parry'] = red_hand(lean=-1, crouch=1, arm=50, blade=95, back_arm=-130, phase=2, legs=((6, 0), (-7, 0)), fx=sparks)
    f['drink0'] = red_hand(lean=0, crouch=2, arm=125, back_arm=-100, cordial=True, phase=0, legs=((6, 0), (-6, 0)))
    f['drink1'] = red_hand(lean=0, crouch=2, arm=135, back_arm=-100, cordial=True, phase=1, legs=((6, 0), (-6, 0)))
    f['hurt'] = red_hand(lean=-4, crouch=2, arm=-150, blade=-170, back_arm=170, phase=1, legs=((5, 0), (-8, 0)))
    f['stunned'] = red_hand(lean=-5, crouch=6, arm=-120, blade=-100, back_arm=-110, phase=2, legs=((6, 0), (-8, 0)), eyes=False)
    f['dead'] = red_hand(lean=-2, crouch=14, arm=-110, blade=-95, back_arm=-80, phase=0, legs=((7, 0), (-9, 0)),
                         knees=((10, -4), (-4, -2)), eyes=False)
    for k in range(4):
        f[f'roll{k}'] = red_roll(k, k)
    return f

# ---------------------------------------------------------------- his throne room (area 24)
THRONE_X = 128

def bg_throne():
    g = bg_base(lambda y: 'c' if y < 40 else 'b')
    W.dither(g, 0, 40, '8', 'c')
    r = random.Random(241)
    for _ in range(12): g.p[r.randint(0, 34)][r.randint(0, 159)] = '1'
    for x in range(160):   # treetops falling away behind, in deep red evening light
        h = 34 + int(8 * math.sin(x / 10 + 3)) + int(4 * math.sin(x / 4))
        for y in range(GROUND - h, GROUND):
            g.p[y][x] = 'f' if r.random() < .25 else ('c' if (x // 2 + y) % 5 else 'e')
    W.plank_floor(g, 242, top='d', mid='e', gap='f', rot=0.2)
    # a ring of planted spears around the dais, with the dead slumped against them
    for x in list(range(16, 60, 9)):
        for y in range(GROUND - 36, GROUND): g.p[y][x] = 'e'
        g.p[GROUND - 37][x] = '1'; g.p[GROUND - 38][x] = '1'; g.p[GROUND - 36][x - 1] = 'b'; g.p[GROUND - 36][x + 1] = 'b'
    # the dais and the throne: lashed timber, antlers, skulls
    for y in range(GROUND - 6, GROUND):
        for x in range(THRONE_X - 26, THRONE_X + 27): g.p[y][x] = 'e' if y > GROUND - 6 else 'd'
    tx = THRONE_X
    for y in range(GROUND - 44, GROUND - 6):
        for x in range(tx - 12, tx + 13):
            edge = x in (tx - 12, tx + 12) or y == GROUND - 44
            g.p[y][x] = 'f' if edge else ('e' if (x + y) % 5 else 'c')
    for y in range(GROUND - 22, GROUND - 18):   # the seat
        for x in range(tx - 14, tx + 15): g.p[y][x] = 'd' if y == GROUND - 22 else 'e'
    for i in range(10):     # antlers sprouting from the throne's back
        for side in (-1, 1):
            x = tx + side * (8 + i); y = GROUND - 44 - i
            g.p[y][x] = 'd'
            if i in (3, 6): g.p[y - 2][x - side] = 'd'; g.p[y - 3][x - side] = 'd'
    for sx_ in (tx - 9, tx, tx + 9):   # skulls along the top
        for (dx, dy, c) in ((0, 0, 'd'), (1, 0, 'd'), (-1, 0, 'd'), (0, 1, 'f'), (-1, -1, 'd'), (0, -1, 'd'), (1, -1, 'd')):
            g.p[GROUND - 46 + dy][sx_ + dx] = c
    # bodies heaped around the dais, and blood soaked into the boards
    def body(x, y, flip=1, col='c'):
        for (dx, dy) in ((0, 0), (1, 0), (2, 0), (3, 0), (4, 0), (5, 0), (6, -1), (7, -1), (1, -1), (2, -1), (3, -1), (4, -1),
                         (8, -2), (9, -2), (8, -1), (9, -1)):
            xx = x + dx * flip
            if 0 <= xx < 160: g.p[y + dy][xx] = col
        hx_ = x + 10 * flip
        if 0 <= hx_ < 160: g.p[y - 2][hx_] = 'd'; g.p[y - 1][hx_] = 'd'
        for k in range(4):
            xx = x + (2 + k) * flip
            if 0 <= xx < 160: g.p[y + 1][xx] = '2'
    for (x, flip, col) in ((80, 1, 'c'), (96, -1, 'e'), (152, -1, 'c'), (108, 1, 'b'), (66, -1, 'e'), (88, 1, 'f')):
        body(x, GROUND - 1 - (6 if THRONE_X - 26 <= x <= THRONE_X + 26 else 0), flip, col)
    for (x, flip) in ((22, 1), (40, -1)):
        body(x, GROUND - 14, flip, 'c')     # slumped against the spears
    for _ in range(90):
        x, y = r.randint(60, 158), r.randint(GROUND, GROUND + 5)
        g.p[y][x] = '2' if r.random() < .7 else 'e'
    for x in range(THRONE_X - 20, THRONE_X + 20):     # a pool spreading from under the dais
        for y in range(GROUND, GROUND + 3):
            if abs(x - THRONE_X) < 20 - (y - GROUND) * 4 and r.random() < .8: g.p[y][x] = '2'
    # the entrance on the left: the gate you came through, standing open
    for y in range(GROUND - 44, GROUND):
        for x in range(0, 6): g.p[y][x] = 'f' if x == 5 else ('e' if y % 4 else 'c')
    return g

def flag_frames():
    """a flag streaming in the wind, 3 frames, 18x12 (planted on a pole the background provides)"""
    out = []
    for p in range(3):
        g = G(18, 12, 0, 0)
        for x in range(1, 18):
            w = math.sin(x / 3 - p * 2.1) * 1.6
            top = 2 + w + x * 0.12; bot = 9 + w - x * 0.1
            for y in range(int(top), int(bot) + 1):
                if 0 <= y < 12:
                    g.p[y][x] = RED if (x + y) % 6 else RED_D
            if x > 14 and x % 2 == 0:
                for y in range(int(top) + 2, int(bot) - 1):
                    if 0 <= y < 12: g.p[y][x] = '.'
        for y in range(12): g.p[y][0] = 'e'
        out.append(g)
    return out

FLAG_POLES = [(74, GROUND - 56), (100, GROUND - 60), (156, GROUND - 58)]

def bg_throne_with_poles():
    g = bg_throne()
    for (x, top) in FLAG_POLES:
        for y in range(top, GROUND): g.p[y][x] = 'e'
        g.p[top - 1][x] = '1'
    return g

# ---------------------------------------------------------------- the camp approach, gate open, with a bonfire spot
CAMP_FIRE_X = 64

def bg_camp3_open():
    g = V.bg_camp3()
    # the bar lifted, the gate swung inward: just the dark gap and the posts
    for x in range(150, 160):
        for y in range(GROUND - 44, GROUND):
            g.p[y][x] = 'f' if x in (150, 151) else ('c' if (x + y) % 7 else 'f')
    for y in range(GROUND - 46, GROUND - 14):    # the bar, leaning against the post
        g.p[y][147 - (y - (GROUND - 46)) // 10] = 'b'
    return g

# ---------------------------------------------------------------- the merchant, awake
def merchant_awake():
    g = G(22, 32, 11, 31)
    g.poly([(-4, -20), (4, -20), (7, 0), (-7, 0)], 'c')
    g.line((0, -18), (0, 0), 'f')
    g.rect(-3, -29, 3, -20, 'f')
    g.rect(-2, -27, 3, -21, 'd')
    g.set(1, -25, '8'); g.set(3, -25, '8')         # eyes open, pale blue
    g.set(2, -23, 'e')
    g.line((-3, -30), (2, -30), 'f')
    for (x, y, c) in ((-3, -17, '5'), (-1, -16, '4'), (1, -16, '6'), (3, -17, '2'), (0, -14, '7'),
                      (-2, -13, '3'), (2, -13, 'a'), (-4, -15, '5'), (4, -15, '4')):
        g.set(x, y, c)
    g.line((-4, -19), (0, -17), 'b'); g.line((0, -17), (4, -19), 'b')
    g.outline()
    g.p = g.p[:18]; g.h = 18
    return g

# ---------------------------------------------------------------- items and icons
def horn_pickup():
    g = G(14, 10, 7, 9)
    for k in range(9):
        x = -5 + k; y = -2 - int(3 * math.sin(k / 8 * math.pi))
        for d in range(max(1, k // 3)):
            g.set(x, y + d, 'd' if k < 7 else 'b')
    g.set(4, -6, '5'); g.set(4, -5, '5'); g.set(5, -6, 'e')
    g.line((-5, -2), (-3, 1), RED)
    g.outline()
    return g

def dagger_pickup():
    g = G(14, 8, 7, 7)
    g.line((-6, -2), (-3, -2), 'e')
    g.set(-2, -3, 'c'); g.set(-2, -1, 'c'); g.set(-2, -2, 'c')
    g.line((-1, -2), (5, -3), '4'); g.set(3, -3, 'e'); g.set(6, -3, 'd')
    g.outline()
    return g

def dagger_icon():
    g = G(12, 12, 0, 0)
    for i in range(6): g.p[8 - i][4 + i] = '4'
    g.p[5][6] = 'e'; g.p[3][9] = 'd'
    g.p[9][2] = 'c'; g.p[10][3] = 'c'; g.p[8][3] = 'c'; g.p[9][3] = 'c'
    g.p[10][1] = 'e'; g.p[11][0] = 'e'
    return g

def ghost_dagger_frames():
    """the Rusted Dagger's ghost: pale orange and glowing, spinning"""
    out = []
    for k in range(4):
        g = G(11, 11, 5, 5)
        a = k * 45
        for d in range(-4, 5):
            g.set(*P((0, 0), a, d), '5' if abs(d) < 2 else '4')
        g.set(*P((0, 0), a + 90, 1), '4'); g.set(*P((0, 0), a - 90, 1), '4')
        for b in range(0, 360, 60):
            c = P((0, 0), b + a, 5)
            if g.get(int(round(5 + c[0])), int(round(5 + c[1]))) == '.': g.set(*c, 'd')
        out.append(g)
    return out

def stalwart_icon():
    g = G(12, 12, 0, 0)
    for x in range(3, 9): g.p[1][x] = 'b'
    g.p[2][2] = 'b'; g.p[2][9] = 'b'; g.p[3][2] = 'b'; g.p[3][9] = 'b'; g.p[4][3] = 'b'; g.p[4][8] = 'b'
    for y in range(5, 11):
        for x in range(3, 9):
            g.p[y][x] = 'e' if (x in (3, 8) or y in (5, 10)) else 'b'
    for y in range(6, 10): g.p[y][5] = '1'; g.p[y][6] = '1'
    g.p[7][4] = '1'; g.p[7][7] = '1'
    return g

def focus_icon():
    g = G(12, 12, 0, 0)
    for x in range(3, 9): g.p[1][x] = 'b'
    g.p[2][2] = 'b'; g.p[2][9] = 'b'; g.p[3][2] = 'b'; g.p[3][9] = 'b'; g.p[4][3] = 'b'; g.p[4][8] = 'b'
    for y in range(5, 11):
        for x in range(3, 9):
            d = abs(x - 5.5) + abs(y - 7.5)
            if d < 3.6: g.p[y][x] = '7' if d < 2 else '6'
    g.p[7][5] = '1'; g.p[7][6] = '1'
    return g

def dagger_frames():
    """the knight with the Rusted Dagger: low, quick, always moving forward"""
    k = lambda **kw: Q.knight('dagger', **kw)
    f = {}
    f['idle1'] = k(arm=-40, sword=-10, crouch=1)
    f['idle2'] = k(arm=-40, sword=-15, crouch=2)
    for i, (lg, ln) in enumerate([((4, 0), (-3, 0)), ((1, 0), (0, 0)), ((-2, 0), (4, 0)), ((0, 0), (1, 0))]):
        f[f'walk{i+1}'] = k(legs=(lg, ln), lean=2, arm=-40, sword=-10, crouch=0 if i % 2 else 1)
    f['jump'] = k(legs=((2, -3), (-3, -2)), knees=((3, -6), (-1, -6)), arm=-20, sword=0)
    f['drink'] = Q.knight('dagger', arm=120, flask=True, back_arm=-100)
    f['hurt'] = k(lean=-2, arm=-140, sword=-150, back_arm=170, legs=((2, 0), (-3, 0)))
    f['windup'] = k(lean=1, crouch=2, arm=-150, sword=180, legs=((4, 0), (-4, 0)), back_arm=-120)
    f['slash'] = k(lean=4, crouch=2, arm=-5, sword=0, legs=((6, 0), (-4, 0)), back_arm=-160, fx=Q.thrust_fx)
    f['windup2'] = k(lean=2, crouch=1, arm=100, sword=140, legs=((5, 0), (-4, 0)), back_arm=-150)
    f['slash2'] = k(lean=4, crouch=2, arm=-50, sword=-60, legs=((6, 0), (-4, 0)), back_arm=-140, fx=slash_arc(3, -13, 9, 80, -50))
    f['windup3'] = k(lean=-2, crouch=3, arm=180, sword=0, legs=((5, 0), (-5, 0)), back_arm=-60)
    f['thrust'] = k(lean=6, crouch=2, arm=0, sword=0, legs=((7, 0), (-5, 0)), back_arm=-150, fx=Q.thrust_fx)
    f['leapUp'] = k(lean=-1, crouch=4, arm=-160, sword=170, legs=((5, 0), (-6, 0)), back_arm=-110)
    f['leap'] = k(lean=5, crouch=-2, arm=-30, sword=-40, legs=((4, -3), (-6, -1)), knees=((5, -6), (-3, -5)), back_arm=-170,
                  fx=slash_arc(3, -12, 10, 60, -70))
    return f

# ---------------------------------------------------------------- your dropped souls: a smouldering heap of embers
def smoulder_frames():
    """3 frames of a low heap of embers, glowing and flickering (16x7, sits on the ground)"""
    out = []
    shape = [(-6, 0), (-5, 0), (-4, 0), (-3, 0), (-2, 0), (-1, 0), (0, 0), (1, 0), (2, 0), (3, 0), (4, 0), (5, 0),
             (-4, -1), (-3, -1), (-2, -1), (-1, -1), (0, -1), (1, -1), (2, -1), (3, -1),
             (-2, -2), (-1, -2), (0, -2), (1, -2), (-1, -3), (0, -3)]
    for k in range(3):
        g = G(16, 7, 8, 6)
        r = random.Random(60 + k)
        for (x, y) in shape:
            hot = r.random()
            c = '5' if hot < .25 else ('4' if hot < .6 else ('2' if hot < .85 else 'e'))
            if y == 0 and abs(x) > 3: c = 'e' if hot < .6 else '2'
            g.set(x, y, c)
        g.set(0, -4 - (k % 2), '5' if k != 1 else '4')     # a lick of flame on top
        if k == 2: g.set(-1, -4, '4')
        out.append(g)
    return out

def smoulder_sparks():
    """tiny sparks that rise off the heap"""
    a, b = G(1, 2, 0, 0), G(1, 2, 0, 0)
    a.p = [['5'], ['4']]; b.p = [['4'], ['2']]
    return [a, b]

def brewer_icon():
    """the Brewer's Amulet: a little amber flask on a chain"""
    g = G(12, 12, 0, 0)
    for x in range(3, 9): g.p[1][x] = 'b'
    g.p[2][2] = 'b'; g.p[2][9] = 'b'; g.p[3][2] = 'b'; g.p[3][9] = 'b'; g.p[4][3] = 'b'; g.p[4][8] = 'b'
    g.p[4][5] = 'e'; g.p[4][6] = 'e'; g.p[5][5] = 'd'; g.p[5][6] = 'd'
    for y in range(6, 11):
        for x in range(3, 9):
            if not (y == 6 and x in (3, 8)) and not (y == 10 and x in (3, 8)):
                g.p[y][x] = '4' if y > 7 else 'd'
    g.p[8][4] = '5'; g.p[9][4] = '5'
    return g
