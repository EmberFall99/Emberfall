"""Hand-built pixel art for the Arcade version, drawn straight onto palette grids."""
import math, random

class G:
    def __init__(s, w, h, ox, oy):
        s.w, s.h, s.ox, s.oy = w, h, ox, oy  # origin = feet
        s.p = [['.'] * w for _ in range(h)]
    def set(s, x, y, c):
        X, Y = int(round(s.ox + x)), int(round(s.oy + y))
        if 0 <= X < s.w and 0 <= Y < s.h: s.p[Y][X] = c
    def get(s, X, Y): return s.p[Y][X] if 0 <= X < s.w and 0 <= Y < s.h else '.'
    def rect(s, x0, y0, x1, y1, c):
        for y in range(int(y0), int(y1) + 1):
            for x in range(int(x0), int(x1) + 1): s.set(x, y, c)
    def thick(s, a, b, c, w=3):
        for d in range(w):
            s.line((a[0] + d - w // 2, a[1]), (b[0] + d - w // 2, b[1]), c)
    def line(s, a, b, c, w=1):
        (x0, y0), (x1, y1) = a, b
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1):
            t = i / max(n, 1); x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            s.set(x, y, c)
            if w == 2: s.set(x + (1 if abs(y1 - y0) >= abs(x1 - x0) else 0), y + (0 if abs(y1 - y0) >= abs(x1 - x0) else 1), c)
    def poly(s, pts, c):
        ys = [p[1] for p in pts]
        for y in range(int(min(ys)), int(max(ys)) + 1):
            xs = []
            for i in range(len(pts)):
                (x0, y0), (x1, y1) = pts[i], pts[(i + 1) % len(pts)]
                if (y0 <= y < y1) or (y1 <= y < y0):
                    xs.append(x0 + (y - y0) * (x1 - x0) / (y1 - y0))
            xs.sort()
            for i in range(0, len(xs) - 1, 2):
                for x in range(int(round(xs[i])), int(round(xs[i + 1])) + 1): s.set(x, y, c)
    def outline(s, c='f', skip=()):
        q = [r[:] for r in s.p]
        for Y in range(s.h):
            for X in range(s.w):
                if s.p[Y][X] == '.':
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        v = s.get(X + dx, Y + dy)
                        if v not in ('.', c) and v not in skip:
                            q[Y][X] = c; break
        s.p = q
    def flipx(s):
        s.p = [r[::-1] for r in s.p]
    def text(s): return '\n'.join(' '.join(r) for r in s.p)

def P(o, ang, ln):
    a = math.radians(ang); return (o[0] + math.cos(a) * ln, o[1] - math.sin(a) * ln)

# ---------------------------------------------------------------- knight 28x22, feet at (13,21)
def knight(lean=0, legs=((2, 0), (-2, 0)), knees=None, arm=-60, sword=60, crouch=0, flask=False, fx=None,
           back_arm=-110):
    g = G(30, 24, 15, 23)
    hy = -7 + crouch
    sx = lean
    # cape
    g.poly([(sx - 1, hy - 6), (sx - 5, hy - 2), (-5, hy + 3), (-3, hy + 2), (-2, hy + 4), (0, hy)], '2')
    g.line((sx - 4, hy - 2), (-4, hy + 3), 'e')
    # back leg + back arm
    k2 = knees[1] if knees else ((legs[1][0] - 1) / 2, hy + 3)
    g.line((-1, hy), k2, 'c'); g.line(k2, legs[1], 'c')
    g.set(legs[1][0] - 1, 0, 'c')
    g.line((sx - 1, hy - 5), P((sx - 1, hy - 5), back_arm, 3), 'c')
    # torso
    g.rect(sx - 2, hy - 6, sx + 2, hy - 1, 'b')
    g.line((sx - 2, hy - 6), (sx - 2, hy - 1), 'c')
    g.line((sx + 1, hy - 6), (sx + 1, hy - 3), '1')
    g.rect(-2, hy, 2, hy, 'e')  # belt
    # front leg
    k1 = knees[0] if knees else ((legs[0][0] + 1) / 2, hy + 3)
    g.line((1, hy), k1, 'b'); g.line(k1, legs[0], 'b')
    g.set(legs[0][0] + 1, 0, 'b')
    # helmet
    hx, hyy = sx, hy - 8
    g.set(hx, hy - 7, 'c')
    g.rect(hx - 2, hyy - 4, hx + 2, hyy, '1')
    g.line((hx - 2, hyy - 3), (hx - 2, hyy), 'b')
    g.line((hx, hyy - 2), (hx + 2, hyy - 2), 'f')
    g.set(hx + 1, hyy - 1, 'f')
    g.set(hx - 2, hyy - 4, 'c'); g.set(hx - 2, hyy, 'c')
    g.line((hx - 1, hyy - 5), (hx - 3, hyy - 6), '4'); g.set(hx - 4, hyy - 5, '4'); g.set(hx - 4, hyy - 4, '2')
    # front arm + sword
    sh = (sx + 1, hy - 5)
    hand = P(sh, arm, 3)
    g.line(sh, hand, 'b')
    if flask:
        g.set(hand[0], hand[1] - 1, '4'); g.set(hand[0], hand[1], '4'); g.set(hand[0] + 1, hand[1] - 1, '5')
    else:
        g.set(*P(hand, sword, -1), 'e')
        g.line(P(hand, sword, 1), P(hand, sword, 9), '1')
        g.line(P(hand, sword + 90, 1), P(hand, sword - 90, 1), '5')
    if fx:
        fx(g)
    g.outline(skip=('9',))
    return g

def slash_arc(cx, cy, r, a0, a1, c='9'):
    def f(g):
        steps = int(abs(a1 - a0) / 6) + 1
        for i in range(steps + 1):
            a = a0 + (a1 - a0) * i / steps
            g.set(*P((cx, cy), a, r), c)
            if i % 2 == 0: g.set(*P((cx, cy), a, r - 1), '1')
    return f

def knight_frames():
    f = {}
    f['idle1'] = knight()
    f['idle2'] = knight(crouch=1, sword=55)
    f['walk1'] = knight(legs=((4, 0), (-3, 0)), lean=1)
    f['walk2'] = knight(legs=((1, 0), (0, 0)), lean=1, crouch=-1)
    f['walk3'] = knight(legs=((-2, 0), (4, 0)), lean=1)
    f['walk4'] = knight(legs=((0, 0), (1, 0)), lean=1, crouch=-1)
    f['windup'] = knight(lean=-1, arm=140, sword=160, legs=((3, 0), (-3, 0)), back_arm=-150)
    f['slash'] = knight(lean=2, arm=0, sword=-5, legs=((4, 0), (-3, 0)), back_arm=-160,
                        fx=slash_arc(2, -13, 11, 100, -40))
    f['heavyup'] = knight(lean=-1, arm=95, sword=92, crouch=1, legs=((3, 0), (-3, 0)), back_arm=100)
    f['heavy'] = knight(lean=3, arm=-30, sword=-50, crouch=2, legs=((5, 0), (-4, 0)), back_arm=-40,
                        fx=slash_arc(3, -12, 12, 95, -70))
    f['jump'] = knight(legs=((2, -3), (-3, -2)), knees=((3, -6), (-1, -6)), arm=-20, sword=60)
    f['drink'] = knight(arm=120, flask=True, back_arm=-100)
    f['hurt'] = knight(lean=-2, arm=-140, sword=-150, back_arm=170, legs=((2, 0), (-3, 0)))
    # roll ball
    for i in range(4):
        g = G(30, 24, 15, 23)
        cx, cy, r = 0, -6, 6
        for y in range(-r, r + 1):
            for x in range(-r, r + 1):
                if x * x + y * y <= r * r + 2: g.set(cx + x, cy + y, '2' if (x * math.cos(i * 1.57) + y * math.sin(i * 1.57)) < 1 else 'e')
        hp = P((cx, cy), 90 - i * 90 + 30, 4)
        g.rect(hp[0] - 1, hp[1] - 1, hp[0] + 1, hp[1] + 1, 'b'); g.set(hp[0], hp[1] - 1, '1')
        g.line(P((cx, cy), 200 - i * 90, 2), P((cx, cy), 200 - i * 90, 9), '1')
        g.outline()
        f[f'roll{i+1}'] = g
    # dead: lying down
    g = G(30, 24, 15, 23)
    g.rect(-9, -3, 1, -1, 'b'); g.line((-9, -3), (1, -3), '1'); g.rect(2, -3, 6, -1, 'c')
    g.rect(-14, -4, -10, -1, 'b'); g.line((-12, -2), (-10, -2), 'f')
    g.poly([(-9, -1), (-2, 0), (2, 0)], '2')
    g.line((3, -4), (11, -6), '1'); g.line((4, -2), (4, -5), '5')
    g.outline(); f['dead'] = g
    return f

# ---------------------------------------------------------------- skeleton 26x22
def skel(lean=0, legs=((2, 0), (-2, 0)), arm=-60, sword=40, crouch=0, fx=None, back_arm=-110):
    g = G(30, 24, 15, 23)
    hy = -7 + crouch; sx = lean
    g.line((-1, hy), ((legs[1][0] - 1) / 2, hy + 3), 'b'); g.line(((legs[1][0] - 1) / 2, hy + 3), legs[1], 'b')
    g.line((sx - 1, hy - 5), P((sx - 1, hy - 5), back_arm, 4), 'b')
    g.line((0, hy), (sx, hy - 6), 'd')  # spine
    for i in range(3):
        y = hy - 2 - i * 2
        g.line((sx - 2 + i * 0, y), (sx + 2, y), 'd')
    g.rect(-2, hy, 2, hy, 'd')
    g.line((1, hy), ((legs[0][0] + 1) / 2, hy + 3), 'd'); g.line(((legs[0][0] + 1) / 2, hy + 3), legs[0], 'd')
    # skull
    hx, hyy = sx + 1, hy - 7
    g.rect(hx - 2, hyy - 4, hx + 2, hyy - 1, 'd'); g.rect(hx - 1, hyy, hx + 1, hyy, 'd')
    g.set(hx + 1, hyy - 2, '2'); g.set(hx - 1, hyy - 2, 'f'); g.set(hx, hyy, 'f')
    sh = (sx + 1, hy - 5); hand = P(sh, arm, 4)
    g.line(sh, hand, 'd')
    g.line(P(hand, sword, 1), P(hand, sword, 8), 'e')
    g.set(*P(hand, sword, 8), '4')
    if fx: fx(g)
    g.outline(skip=('2', '9'))
    return g

def skel_frames():
    f = {}
    f['s_idle'] = skel(lean=1, crouch=1)
    f['s_walk1'] = skel(lean=1, legs=((4, 0), (-3, 0)))
    f['s_walk2'] = skel(lean=1, legs=((0, 0), (1, 0)), crouch=-1)
    f['s_raise'] = skel(lean=-1, arm=130, sword=150, legs=((3, 0), (-3, 0)))
    f['s_strike'] = skel(lean=2, arm=0, sword=-10, legs=((4, 0), (-3, 0)), fx=slash_arc(2, -13, 10, 100, -40, '3'))
    f['s_hurt'] = skel(lean=-2, arm=-150, sword=200, legs=((2, 0), (-3, 0)))
    g = G(30, 24, 15, 23)
    g.line((-8, -1), (0, -1), 'd'); g.line((-3, -2), (5, -1), 'd'); g.line((3, -1), (9, -3), 'e')
    g.rect(-12, -4, -9, -1, 'd'); g.set(-10, -3, 'f'); g.outline(); f['s_dead'] = g
    return f

# ---------------------------------------------------------------- boss 56x48
def boss(lean=0, legs=((5, 0), (-5, 0)), arm=-70, weapon=60, crouch=0, head_drop=0, fx=None, back_arm=-100,
         eyes=True, rage=0):
    g = G(72, 62, 36, 61)
    hy = -16 + crouch; sx = lean
    # cloak
    g.poly([(sx - 6, hy - 14), (sx - 14, hy - 6), (-13, hy + 12), (-10, hy + 9), (-8, hy + 13), (-5, hy + 9),
            (-2, hy + 12), (1, hy)], 'c')
    for x in (-12, -8, -4): g.set(x, hy + 10, 'f')
    # back leg / arm
    k2 = ((legs[1][0] - 2) / 2, hy + 8)
    g.thick((-3, hy), k2, 'c'); g.thick(k2, legs[1], 'c')
    g.rect(legs[1][0] - 3, -1, legs[1][0] + 1, 0, 'c')
    g.line((sx - 5, hy - 12), P((sx - 5, hy - 12), back_arm, 8), 'c', 2)
    # torso
    g.poly([(-6, hy + 1), (6, hy + 1), (sx + 9, hy - 12), (sx + 6, hy - 15), (sx - 7, hy - 15), (sx - 9, hy - 12)], 'b')
    g.line((sx - 7, hy - 13), (-5, hy), 'c')
    g.line((sx + 4, hy - 13), (4, hy - 2), '1')
    g.rect(-6, hy - 1, 6, hy, 'e')
    g.rect(sx - 10, hy - 16, sx - 4, hy - 12, 'c')  # pauldron
    g.line((sx - 9, hy - 16), (sx - 5, hy - 16), 'b')
    # front leg
    k1 = ((legs[0][0] + 2) / 2, hy + 8)
    g.thick((3, hy), k1, 'b'); g.thick(k1, legs[0], 'b')
    g.rect(legs[0][0] - 1, -1, legs[0][0] + 3, 0, 'b')
    # head + horns
    hx, hh = sx + 2, hy - 17 + head_drop
    g.rect(hx - 4, hh - 5, hx + 4, hh + 1, 'b'); g.line((hx - 2, hh - 4), (hx + 2, hh - 4), '1')
    g.line((hx - 2, hh - 1), (hx + 3, hh - 1), 'f')
    if eyes: g.set(hx + 2, hh - 1, '4'); g.set(hx + 1, hh - 1, '5')
    g.line((hx - 3, hh - 4), (hx - 6, hh - 8), 'd'); g.set(hx - 7, hh - 8, 'd'); g.set(hx - 6, hh - 9, 'd')
    g.line((hx + 3, hh - 4), (hx + 5, hh - 8), 'd'); g.set(hx + 6, hh - 9, 'd')
    # arm + hammer
    sh = (sx + 5, hy - 12)
    el = P(sh, arm, 5); hand = P(el, arm + 15, 5)
    g.thick(sh, el, 'b'); g.thick(el, hand, 'b')
    end = P(hand, weapon, 17)
    g.line(P(hand, weapon, -4), end, 'e', 2)
    h1, h2 = P(end, weapon + 90, 5), P(end, weapon - 90, 4)
    g.poly([h1, h2, P(h2, weapon, 6), P(h1, weapon, 6)], 'c')
    g.line(P(h1, weapon, 3), P(h2, weapon, 3), 'e')
    if fx: fx(g)
    if rage:
        # molten cracks: the fire inside breaking through the armour
        hot, core = ('2', '4') if rage == 1 else ('4', '5')
        tx, ty = sx, hy
        for a, b in [((tx - 5, ty - 13), (tx - 2, ty - 9)), ((tx - 2, ty - 9), (tx - 4, ty - 5)),
                     ((tx - 4, ty - 5), (tx - 1, ty - 1)), ((tx + 4, ty - 12), (tx + 1, ty - 8)),
                     ((tx + 1, ty - 8), (tx + 3, ty - 4))]:
            g.line(a, b, hot)
        g.rect(tx - 1, ty - 10, tx + 1, ty - 8, core); g.set(tx, ty - 11, hot); g.set(tx, ty - 7, hot)
        g.set(hx + 1, hh - 1, '5'); g.set(hx + 2, hh - 1, '1' if rage == 2 else '5'); g.set(hx + 3, hh - 1, '4')
    g.outline(skip=('4', '5', '9', '3'))
    if rage:
        # a heat-haze outline that pulses between dark and bright red
        g.outline('e' if rage == 1 else '2', skip=('9', '3'))
    return g

def boss_frames(rage=0):
    f = {}
    f['b_idle'] = boss(rage=rage, lean=1, crouch=1)
    f['b_walk1'] = boss(rage=rage, lean=2, crouch=1, legs=((8, 0), (-4, 0)))
    f['b_walk2'] = boss(rage=rage, lean=2, crouch=2, legs=((2, 0), (0, 0)), arm=-65)
    f['b_raise'] = boss(rage=rage, lean=-2, arm=110, back_arm=130, weapon=115, legs=((6, 0), (-6, 0)))
    def dust(g):
        for dx in (-6, -3, 3, 6): g.set(26 + dx, -3 - abs(dx) // 3, 'd')
    f['b_slam'] = boss(rage=rage, lean=5, arm=-10, back_arm=-30, weapon=-80, crouch=3, head_drop=2,
                       legs=((9, 0), (-7, 0)), fx=dust)
    f['b_sweepup'] = boss(rage=rage, lean=-3, arm=170, back_arm=-120, weapon=185, crouch=2, legs=((6, 0), (-6, 0)))
    def streak(g):
        for x in range(-14, 26, 2): g.set(x, -6 - (x // 8), '9')
    f['b_sweep'] = boss(rage=rage, lean=4, arm=-10, back_arm=-150, weapon=-12, crouch=3, legs=((8, 0), (-7, 0)), fx=streak)
    f['b_crouch'] = boss(rage=rage, lean=6, arm=-100, weapon=-165, crouch=5, head_drop=3, legs=((8, 0), (-8, 0)))
    def lines(g):
        for i in range(4): g.line((-18 - i, -24 + i * 6), (-26 - i, -24 + i * 6), 'b')
    f['b_charge'] = boss(rage=rage, lean=8, arm=-120, weapon=-170, crouch=4, head_drop=4, legs=((10, 0), (-10, 0)), fx=lines)
    def rings(g):
        for a in range(0, 360, 20): g.set(*P((2, -38), a, 12), '4')
    f['b_roar'] = boss(rage=rage, lean=-3, arm=60, back_arm=150, weapon=100, fx=rings)
    f['b_dead'] = boss(rage=rage, lean=4, arm=-90, weapon=-170, crouch=8, head_drop=5, legs=((6, 0), (-10, 0)), eyes=False)
    return f

# ---------------------------------------------------------------- props
def bonfire_frames():
    out = []
    for i in range(3):
        r = random.Random(i)
        g = G(24, 28, 12, 27)
        for x in (-6, -3, 0, 3, 6): g.rect(x - 1, -1, x + 1, 0, 'c')
        g.line((0, -2), (-1, -20), 'b'); g.line((-3, -18), (2, -18), 'e'); g.line((-1, -19), (-1, -22), 'e')
        for j in range(9):
            x = -4 + j; h = int(4 + r.randint(0, 5) * (1 - abs(j - 4) / 5))
            g.line((x, -2), (x, -2 - h), '4' if j % 3 else '2')
            g.line((x, -2), (x, -2 - h // 2), '5')
        for _ in range(3): g.set(r.randint(-5, 5), r.randint(-16, -10), '4')
        g.outline(skip=('4', '5', '2'))
        out.append(g)
    return out

def wave_frames():
    out = []
    for i in range(2):
        r = random.Random(i + 7); g = G(16, 12, 8, 11)
        for x in range(-6, 7):
            h = int(3 + r.randint(0, 6) * (1 - abs(x) / 7))
            g.line((x, 0), (x, -h), '2' if (x + i) % 3 == 0 else '4'); g.line((x, 0), (x, -h // 2), '5')
        out.append(g)
    return out

def stain_frame():
    g = G(14, 6, 7, 5)
    g.rect(-5, -1, 4, 0, '2'); g.rect(-3, -2, 2, -2, '2'); g.set(0, -3, '7'); g.set(0, -4, '1'); g.set(-1, -3, '7'); g.set(1, -3, '7')
    return g

def fog_frame(i):
    r = random.Random(30 + i); g = G(12, 96, 6, 95)
    for y in range(-95, 1):
        for x in range(-5, 6):
            if r.random() < 0.38 - abs(x) * 0.07: g.set(x, y, '1' if r.random() < .4 else 'd')
    return g

def flask_icons():
    full, empty = G(5, 7, 0, 0), G(5, 7, 0, 0)
    for g, c in ((full, '4'), (empty, 'c')):
        g.p = [list(r) for r in ['.fff.', '.fef.', 'f' + c * 3 + 'f', 'f' + c * 3 + 'f', 'f' + c * 3 + 'f', '.fff.', '.....']]
    return full, empty

# ---------------------------------------------------------------- backgrounds 160x120 (ground top at y=104)
GROUND = 104
def bg_base(sky_rows):
    g = G(160, 120, 0, 0)
    for y in range(120):
        c = sky_rows(y)
        for x in range(160): g.p[y][x] = c
    return g

def floor(g, top='b', mid='c', joint='f', seed=0):
    r = random.Random(seed)
    for y in range(GROUND, 120):
        for x in range(160): g.p[y][x] = mid
    for x in range(160): g.p[GROUND][x] = top
    for y0 in (GROUND + 5, GROUND + 10):
        for x in range(160): g.p[y0][x] = joint
    for y0, y1 in ((GROUND + 1, GROUND + 4), (GROUND + 6, GROUND + 9), (GROUND + 11, 119)):
        x = -r.randint(0, 12)
        while x < 160:
            x += r.randint(10, 20)
            for y in range(y0, y1 + 1):
                if 0 <= x < 160: g.p[y][x] = joint

def bg_gate():
    g = bg_base(lambda y: 'f' if y < 40 else ('c' if y < 80 else 'c'))
    r = random.Random(1)
    for y in range(30, 80):  # dither band
        for x in range(160):
            if (x + y) % 2 == 0 and r.random() < (y - 30) / 60: g.p[y][x] = 'c'
            elif y < 50 and (x + y) % 2 == 0: g.p[y][x] = 'f'
    for _ in range(25):
        g.p[r.randint(0, 45)][r.randint(0, 159)] = '1' if r.random() < .5 else 'd'
    for y in range(-8, 9):  # moon
        for x in range(-8, 9):
            if x * x + y * y <= 64: g.p[22 + y][122 + x] = 'd' if x * x + y * y > 30 or (x, y) in ((-2, -1), (3, 2)) else '1'
    # castle silhouette
    sil = 'f'
    for x in range(160):
        h = 70 + int(4 * math.sin(x / 9))
        if 18 <= x <= 22: h = 48
        if 50 <= x <= 56: h = 38
        if 84 <= x <= 88: h = 55
        for y in range(h, GROUND): g.p[y][x] = sil
    for x in (20, 53, 86): g.p[52 if x != 53 else 44][x] = '4'
    # ruined arch pillars
    for px in (50, 102):
        for y in range(46, GROUND):
            for x in range(px, px + 8): g.p[y][x] = 'b' if x not in (px, px + 7) else 'c'
            if y % 6 == 0:
                for x in range(px, px + 8): g.p[y][x] = 'c'
    for x in range(58, 102):
        y = int(48 - 14 * math.sin((x - 58) / 44 * math.pi))
        for yy in range(y, y + 5): g.p[yy][x] = 'b' if yy < y + 4 else 'c'
    # dead tree
    for y in range(70, GROUND): g.p[y][20] = 'f'; g.p[y][21] = 'f'
    for i in range(10): g.p[78 - i][21 + i] = 'f'; g.p[74 - i // 2][20 - i] = 'f'
    for _ in range(30): g.p[r.randint(40, 100)][r.randint(0, 159)] = '4'
    floor(g, seed=1)
    return g

def bg_hall():
    g = bg_base(lambda y: 'f')
    for y in range(0, GROUND):
        for x in range(160):
            if y % 8 == 0 or (x + (8 if (y // 8) % 2 else 0)) % 16 == 0: g.p[y][x] = 'c' if y > 20 else 'f'
    for px in (8, 76, 146):
        for y in range(0, GROUND):
            for x in range(px - 6, px + 7): g.p[y][x] = 'b' if abs(x - px) < 5 else 'c'
            g.p[y][px - 2] = 'c'
    for tx in (42, 112):
        for y in range(-14, 15):
            for x in range(-14, 15):
                d = x * x + y * y
                if d < 196 and (x + y) % 2 == 0 and g.p[50 + y][tx + x] in 'fc': g.p[50 + y][tx + x] = 'e' if d < 80 else 'c'
        for y in range(50, 56): g.p[y][tx] = 'e'
        for y, c in ((49, '4'), (48, '4'), (47, '5'), (46, '4'), (45, '2')): g.p[y][tx] = c
        g.p[48][tx - 1] = '4'; g.p[48][tx + 1] = '4'
    for cx in (58, 100, 104):
        for y in range(0, 30 + cx % 13): g.p[y][cx] = 'b' if y % 3 else 'f'
    floor(g, top='b', mid='f', joint='c', seed=2)
    for x in range(30, 60): g.p[112][x] = '8'
    for x in range(100, 125): g.p[114][x] = '8'
    return g

def bg_arena():
    g = bg_base(lambda y: 'f')
    r = random.Random(3)
    for y in range(0, 40):
        for x in range(30, 130):
            edge = 20 + 12 * math.sin((x - 30) / 100 * math.pi * 3) * 0.3 + (40 - abs(x - 80)) * .35
            if y < edge:
                g.p[y][x] = '2' if y > edge - 6 and (x + y) % 2 else ('e' if y > edge - 12 else ('2' if (x + y) % 3 == 0 else 'e'))
    for x in range(160):
        top = 40 - int(10 * math.sin(x / 160 * math.pi))
        for y in range(top, GROUND): g.p[y][x] = 'c'
        g.p[top][x] = 'b'
    for i in range(7):
        x0 = 4 + i * 23
        for y in range(62, GROUND):
            for x in range(x0, x0 + 14):
                if y > 66 or abs(x - x0 - 7) < (y - 58): g.p[y][x] = 'f'
    for y in range(50, GROUND):  # throne
        w = 10 if y > 80 else 7
        for x in range(80 - w, 80 + w): g.p[y][x] = 'b' if y > 80 else 'c'
    for i in range(8): g.p[50 - i][73 - i // 2] = 'c'; g.p[50 - i][87 + i // 2] = 'c'
    for _ in range(40): g.p[r.randint(5, 100)][r.randint(0, 159)] = '4'
    floor(g, top='e', mid='c', joint='f', seed=3)
    return g

def bg_title():
    g = bg_base(lambda y: 'f' if y < 60 else 'c')
    r = random.Random(4)
    for y in range(40, 80):
        for x in range(160):
            if (x + y) % 2 == 0 and r.random() < (y - 40) / 40: g.p[y][x] = 'c'
    for x in range(160):
        h = 92 - int(6 * math.sin(x / 11)) - (20 if 72 <= x <= 88 else 0)
        for y in range(h, 120): g.p[y][x] = 'f'
    for y in range(70, 100): g.p[y][80] = '1'; g.p[y][81] = 'b'
    for x in range(75, 87): g.p[72][x] = 'e'
    for y in range(64, 72): g.p[y][80] = 'e'
    for y in range(-10, 1):
        for x in range(-12, 13):
            if r.random() < .3 + y * .02 and abs(x) < 12 + y: g.p[100 + y][80 + x] = '4' if r.random() < .6 else '2'
    for _ in range(40): g.p[r.randint(40, 118)][r.randint(0, 159)] = '4'
    return g
