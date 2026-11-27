"""Extra pixel art for Emberfall v2: loadouts, new enemies, items, new areas."""
import math, random
from pixrig import G, P, slash_arc, GROUND, floor, bg_base
import pixrig as R

# ---------------------------------------------------------------- knight with loadouts
def knight(weapon='sword', lean=0, legs=((2, 0), (-2, 0)), knees=None, arm=-60, sword=60, crouch=0, fx=None,
           back_arm=-110, block=False, bow_draw=0, flask=False, sheathed=False):
    g = G(30, 24, 15, 23)
    hy = -7 + crouch
    sx = lean
    g.poly([(sx - 1, hy - 6), (sx - 5, hy - 2), (-5, hy + 3), (-3, hy + 2), (-2, hy + 4), (0, hy)], '2')
    g.line((sx - 4, hy - 2), (-4, hy + 3), 'e')
    k2 = knees[1] if knees else ((legs[1][0] - 1) / 2, hy + 3)
    g.line((-1, hy), k2, 'c'); g.line(k2, legs[1], 'c')
    g.set(legs[1][0] - 1, 0, 'c')
    bsh = (sx - 1, hy - 5)
    bhand = P(bsh, back_arm, 3)
    g.line(bsh, bhand, 'c')
    if weapon == 'shield' and not block:   # shield carried on the back arm
        g.rect(bhand[0] - 2, bhand[1] - 3, bhand[0] + 1, bhand[1] + 3, 'e')
        g.line((bhand[0] - 2, bhand[1] - 3), (bhand[0] - 2, bhand[1] + 3), 'b')
        g.set(bhand[0], bhand[1], '5')
    g.rect(sx - 2, hy - 6, sx + 2, hy - 1, 'b')
    g.line((sx - 2, hy - 6), (sx - 2, hy - 1), 'c')
    g.line((sx + 1, hy - 6), (sx + 1, hy - 3), '1')
    g.rect(-2, hy, 2, hy, 'e')
    k1 = knees[0] if knees else ((legs[0][0] + 1) / 2, hy + 3)
    g.line((1, hy), k1, 'b'); g.line(k1, legs[0], 'b')
    g.set(legs[0][0] + 1, 0, 'b')
    hx, hyy = sx, hy - 8
    g.set(hx, hy - 7, 'c')
    g.rect(hx - 2, hyy - 4, hx + 2, hyy, '1')
    g.line((hx - 2, hyy - 3), (hx - 2, hyy), 'b')
    g.line((hx, hyy - 2), (hx + 2, hyy - 2), 'f')
    g.set(hx + 1, hyy - 1, 'f')
    g.set(hx - 2, hyy - 4, 'c'); g.set(hx - 2, hyy, 'c')
    g.line((hx - 1, hyy - 5), (hx - 3, hyy - 6), '4'); g.set(hx - 4, hyy - 5, '4'); g.set(hx - 4, hyy - 4, '2')
    sh = (sx + 1, hy - 5)
    hand = P(sh, arm, 3)
    g.line(sh, hand, 'b')
    if flask:
        g.set(hand[0], hand[1] - 1, '4'); g.set(hand[0], hand[1], '4'); g.set(hand[0] + 1, hand[1] - 1, '5')
    elif weapon in ('sword', 'shield'):
        g.set(*P(hand, sword, -1), 'e')
        g.line(P(hand, sword, 1), P(hand, sword, 9), '1')
        g.line(P(hand, sword + 90, 1), P(hand, sword - 90, 1), '5')
    elif weapon == 'dagger':
        # a short, rust-eaten dagger
        g.set(*P(hand, sword, -1), 'e')
        g.line(P(hand, sword, 1), P(hand, sword, 5), '4')
        g.set(*P(hand, sword, 5), 'd')
        g.set(*P(hand, sword, 3), 'e')
        g.line(P(hand, sword + 90, 1), P(hand, sword - 90, 1), 'c')
    elif weapon == 'katana' and sheathed:
        # blade in its scabbard at the hip, hand on the hilt
        g.line((sx - 1, hy - 1), (sx - 10, hy + 2), 'f')
        g.line((sx - 1, hy - 2), (sx - 9, hy + 1), 'c')
        g.line((sx, hy - 2), hand, 'e')
        g.set(sx, hy - 1, '5')
    elif weapon == 'katana':
        # a long, thin, faintly curved blade with a small round guard
        g.set(*P(hand, sword, -1), 'e'); g.set(*P(hand, sword, -2), 'e')
        base = P(hand, sword, 1)
        g.line(base, P(hand, sword, 7), '1')
        g.line(P(hand, sword, 7), P(P(hand, sword, 7), sword - 12, 5), '1')
        g.set(*P(P(hand, sword, 7), sword - 12, 5), '9')
        g.set(*base, 'f')
        if weapon == 'katana':      # the empty scabbard stays on the hip
            g.line((sx - 1, hy - 1), (sx - 9, hy + 2), 'f')
    elif weapon == 'bow':
        # bow held upright in the front hand, bulging forward
        hx2, hy2 = hand
        tips = []
        for i in range(-6, 7):
            bx = hx2 + 2 * math.cos(i / 6 * math.pi / 2)
            g.set(bx, hy2 + i, 'e')
        top, bot = (hx2, hy2 - 6), (hx2, hy2 + 6)
        pull = (hx2 - bow_draw, hy2)
        g.line(top, pull, 'd'); g.line(pull, bot, 'd')
        if bow_draw:
            g.line(pull, (hx2 + 6, hy2), '1'); g.set(hx2 + 7, hy2, 'b')
    if weapon == 'shield' and block:   # shield raised in front
        cx, cy = sx + 4, hy - 7
        g.rect(cx, cy - 4, cx + 2, cy + 4, 'e')
        g.line((cx + 2, cy - 4), (cx + 2, cy + 4), 'b')
        g.set(cx + 1, cy, '5'); g.set(cx + 1, cy - 1, '5')
    if fx:
        fx(g)
    g.outline(skip=('9',))
    return g

def thrust_fx(g):
    for i, y in enumerate((-13, -11, -15)):
        g.line((-4 - i, y), (-9 - i, y), '9')

def loadout_frames(w):
    """frames shared by every loadout, drawn with that loadout's weapon"""
    f = {}
    rest_sword = 60 if w != 'bow' else 0
    arm0 = -60 if w != 'bow' else -20
    f['idle1'] = knight(w, arm=arm0, sword=rest_sword)
    f['idle2'] = knight(w, crouch=1, arm=arm0, sword=rest_sword - 5)
    for i, (lg, ln) in enumerate([((4, 0), (-3, 0)), ((1, 0), (0, 0)), ((-2, 0), (4, 0)), ((0, 0), (1, 0))]):
        f[f'walk{i+1}'] = knight(w, legs=(lg, ln), lean=1, arm=arm0, sword=rest_sword - 10, crouch=-1 if i % 2 else 0)
    f['jump'] = knight(w, legs=((2, -3), (-3, -2)), knees=((3, -6), (-1, -6)), arm=-20 if w != 'bow' else 10, sword=60)
    f['drink'] = knight(w, arm=120, flask=True, back_arm=-100)
    f['hurt'] = knight(w, lean=-2, arm=-140, sword=-150, back_arm=170, legs=((2, 0), (-3, 0)))
    f['climb1'] = knight('none', arm=95, back_arm=60, legs=((2, -2), (-2, 0)), knees=((3, -5), (-2, -4)))
    f['climb2'] = knight('none', arm=60, back_arm=95, legs=((2, 0), (-2, -2)), knees=((2, -4), (-3, -5)))
    if w in ('sword', 'shield'):
        f['windup'] = knight(w, lean=-1, arm=140, sword=160, legs=((3, 0), (-3, 0)), back_arm=-150)
        f['slash'] = knight(w, lean=2, arm=0, sword=-5, legs=((4, 0), (-3, 0)), back_arm=-160,
                            fx=slash_arc(2, -13, 11, 100, -40))
        f['windup2'] = knight(w, lean=1, arm=-40, sword=-35, legs=((4, 0), (-3, 0)), back_arm=-150)
        f['slash2'] = knight(w, lean=1, arm=70, sword=80, legs=((3, 0), (-3, 0)), back_arm=-140,
                             fx=slash_arc(2, -13, 11, -35, 95))
        f['windup3'] = knight(w, lean=-2, arm=180, sword=0, crouch=1, legs=((4, 0), (-4, 0)), back_arm=-60)
        f['thrust'] = knight(w, lean=4, arm=0, sword=0, crouch=1, legs=((6, 0), (-4, 0)), back_arm=-150, fx=thrust_fx)
    if w == 'sword':
        f['heavyup'] = knight(w, lean=-1, arm=95, sword=92, crouch=1, legs=((3, 0), (-3, 0)), back_arm=100)
        f['heavy'] = knight(w, lean=3, arm=-30, sword=-50, crouch=2, legs=((5, 0), (-4, 0)), back_arm=-40,
                            fx=slash_arc(3, -12, 12, 95, -70))
    if w == 'shield':
        f['block'] = knight(w, block=True, lean=-1, crouch=1, arm=-80, sword=-100, legs=((3, 0), (-3, 0)))
    if w == 'bow':
        f['draw'] = knight(w, arm=0, back_arm=-10, bow_draw=4, legs=((3, 0), (-3, 0)))
        f['loose'] = knight(w, arm=0, back_arm=-150, legs=((3, 0), (-3, 0)))
    return f

# ---------------------------------------------------------------- skeleton knight + archer
def skel2(kind, lean=0, legs=((2, 0), (-2, 0)), arm=-60, sword=40, crouch=0, fx=None, back_arm=-110,
          guard=True, bow_draw=0):
    g = G(30, 24, 15, 23)
    hy = -7 + crouch; sx = lean
    bone = 'd'
    g.line((-1, hy), ((legs[1][0] - 1) / 2, hy + 3), 'b'); g.line(((legs[1][0] - 1) / 2, hy + 3), legs[1], 'b')
    bsh = (sx - 1, hy - 5); bhand = P(bsh, back_arm, 4)
    g.line(bsh, bhand, 'b')
    if kind == 'archer':   # tattered hood/cloak
        g.poly([(sx - 3, hy - 13), (sx + 2, hy - 13), (sx + 3, hy - 6), (-4, hy + 2), (-4, hy - 6)], '6')
        g.line((-4, hy - 6), (-4, hy + 2), '8')
    g.line((0, hy), (sx, hy - 6), bone)
    for i in range(3):
        y = hy - 2 - i * 2
        g.line((sx - 2, y), (sx + 2, y), bone)
    if kind == 'knight':   # rusty breastplate
        g.rect(sx - 2, hy - 6, sx + 2, hy - 2, 'e'); g.line((sx + 1, hy - 6), (sx + 1, hy - 3), '4')
    g.rect(-2, hy, 2, hy, bone)
    g.line((1, hy), ((legs[0][0] + 1) / 2, hy + 3), bone); g.line(((legs[0][0] + 1) / 2, hy + 3), legs[0], bone)
    hx, hyy = sx + 1, hy - 7
    g.rect(hx - 2, hyy - 4, hx + 2, hyy - 1, bone); g.rect(hx - 1, hyy, hx + 1, hyy, bone)
    g.set(hx + 1, hyy - 2, '2'); g.set(hx - 1, hyy - 2, 'f'); g.set(hx, hyy, 'f')
    if kind == 'knight':   # helm
        g.rect(hx - 3, hyy - 5, hx + 2, hyy - 4, 'c'); g.line((hx - 3, hyy - 4), (hx - 3, hyy - 1), 'c')
        g.set(hx - 1, hyy - 6, '2'); g.set(hx - 2, hyy - 7, '2')
    if kind == 'archer':
        g.line((hx - 3, hyy - 5), (hx + 2, hyy - 5), '6'); g.line((hx - 3, hyy - 4), (hx - 3, hyy), '6')
    sh = (sx + 1, hy - 5); hand = P(sh, arm, 4)
    g.line(sh, hand, bone)
    if kind == 'knight':
        g.line(P(hand, sword, 1), P(hand, sword, 9), 'b'); g.set(*P(hand, sword, 9), '1')
        g.line(P(hand, sword + 90, 1), P(hand, sword - 90, 1), 'e')
        if guard:   # big shield in front
            cx, cy = sx + 4, hy - 6
            g.rect(cx, cy - 4, cx + 2, cy + 5, 'c'); g.line((cx + 2, cy - 4), (cx + 2, cy + 5), 'b')
            g.set(cx + 1, cy, '2')
        else:
            g.rect(bhand[0] - 2, bhand[1] - 3, bhand[0] + 1, bhand[1] + 3, 'c')
    if kind == 'archer':
        hx2, hy2 = hand
        for i in range(-6, 7):
            g.set(hx2 + 2 * math.cos(i / 6 * math.pi / 2), hy2 + i, 'e')
        pull = (hx2 - bow_draw, hy2)
        g.line((hx2, hy2 - 6), pull, '1'); g.line(pull, (hx2, hy2 + 6), '1')
        if bow_draw:
            g.line(pull, (hx2 + 6, hy2), 'd'); g.set(hx2 + 7, hy2, '1')
    if fx: fx(g)
    g.outline(skip=('2', '9'))
    return g

def knight_skel_frames():
    f = {}
    f['k_idle'] = skel2('knight', lean=1, crouch=1, arm=-40, sword=30)
    f['k_walk1'] = skel2('knight', lean=1, legs=((4, 0), (-3, 0)), arm=-40, sword=30)
    f['k_walk2'] = skel2('knight', lean=1, legs=((0, 0), (1, 0)), crouch=-1, arm=-40, sword=30)
    f['k_raise'] = skel2('knight', lean=-1, arm=130, sword=150, legs=((3, 0), (-3, 0)), guard=False, back_arm=-150)
    f['k_strike'] = skel2('knight', lean=3, arm=-10, sword=-25, legs=((5, 0), (-3, 0)), guard=False,
                          fx=slash_arc(2, -13, 11, 110, -50, '3'))
    f['k_hurt'] = skel2('knight', lean=-2, arm=-150, sword=200, legs=((2, 0), (-3, 0)), guard=False, back_arm=160)
    return f

def archer_frames():
    f = {}
    f['a_idle'] = skel2('archer', arm=-30, crouch=1)
    f['a_walk1'] = skel2('archer', arm=-30, legs=((4, 0), (-3, 0)))
    f['a_walk2'] = skel2('archer', arm=-30, legs=((0, 0), (1, 0)), crouch=-1)
    f['a_draw'] = skel2('archer', arm=0, back_arm=-10, bow_draw=4, legs=((3, 0), (-3, 0)))
    f['a_loose'] = skel2('archer', arm=0, back_arm=-150, legs=((3, 0), (-3, 0)))
    f['a_hurt'] = skel2('archer', lean=-2, arm=-150, back_arm=160, legs=((2, 0), (-3, 0)))
    return f

# ---------------------------------------------------------------- items
def arrow_imgs(col='d', head='1'):
    flat = G(10, 3, 0, 0)
    for x in range(0, 8): flat.p[1][x] = col
    flat.p[0][0] = '2'; flat.p[2][0] = '2'; flat.p[1][8] = head; flat.p[1][9] = head; flat.p[0][8] = head; flat.p[2][8] = head
    diag = G(8, 8, 0, 0)
    for i in range(6): diag.p[i][i] = col
    diag.p[6][6] = head; diag.p[7][7] = head; diag.p[6][7] = head; diag.p[7][6] = head; diag.p[0][1] = '2'; diag.p[1][0] = '2'
    return flat, diag

def bow_pickup():
    g = G(12, 14, 6, 13)
    for i in range(-6, 7):
        g.set(2 * math.cos(i / 6 * math.pi / 2) - 1, -7 + i, 'e')
    g.line((-1, -13), (-1, -1), '1')
    g.outline()
    return g

def key_img():
    g = G(12, 8, 0, 0)
    g.p = [list(r) for r in ['..ff........', '.f55f.......', 'f5..5fffffff', 'f5..55555555', '.f55ffff5f5f', '..ff....f.f.', '............', '............']]
    return g

def door_imgs():
    closed = G(16, 28, 8, 27)
    closed.rect(-7, -27, 6, 0, 'e')
    for y in range(-27, 1, 1):
        for x in (-4, -1, 2):
            closed.set(x, y, 'c')
    for y in (-22, -6):
        closed.line((-7, y), (6, y), 'b')
    closed.set(3, -13, '5'); closed.set(3, -12, '5')
    closed.p[0] = ['.'] * 3 + closed.p[0][3:13] + ['.'] * 3
    closed.outline()
    open_ = G(16, 28, 8, 27)
    open_.rect(-7, -27, 6, 0, 'f')
    open_.line((-7, -27), (-7, 0), 'e'); open_.line((-6, -27), (-6, 0), 'e')
    open_.outline('c')
    return closed, open_

def icon(kind):
    g = G(12, 12, 0, 0)
    if kind in ('sword', 'shield'):
        for i in range(8): g.p[9 - i][2 + i] = '1'
        g.p[8][1] = '5'; g.p[10][3] = '5'; g.p[10][1] = 'e'; g.p[11][0] = 'e'
    if kind == 'shield':
        for y in range(4, 12):
            for x in range(6, 12):
                if not (y > 9 and (x == 6 or x == 11)): g.p[y][x] = 'e'
        for y in range(4, 11): g.p[y][11] = 'b'
        g.p[7][8] = '5'
    if kind == 'bow':
        for i in range(12):
            x = 3 + int(round(4 * math.sin(i / 11 * math.pi)))
            g.p[i][x] = 'e'
        for i in range(12): g.p[i][3] = '1' if g.p[i][3] == '.' else g.p[i][3]
        for x in range(2, 11): g.p[6][x] = 'd'
        g.p[5][10] = '1'; g.p[7][10] = '1'; g.p[6][11] = '1'
    if kind == 'lock':
        for x in range(3, 9): g.p[2][x] = 'b' if x in (3, 8) else '.'
        for y in range(2, 6): g.p[y][3] = 'b'; g.p[y][8] = 'b'
        for x in range(4, 8): g.p[1][x] = 'b'
        for y in range(5, 11):
            for x in range(2, 10): g.p[y][x] = 'c'
        g.p[7][5] = 'f'; g.p[7][6] = 'f'; g.p[8][5] = 'f'
    return g

# ---------------------------------------------------------------- new backgrounds
LADDER_X = {2: 120, 3: 120, 4: 92}

def draw_ladder(g, x, y0, y1):
    for y in range(y0, y1 + 1):
        g.p[y][x - 3] = 'e'; g.p[y][x + 3] = 'e'
        g.p[y][x - 4] = 'f'; g.p[y][x + 4] = 'f'
        if (y - y0) % 4 == 0:
            for xx in range(x - 2, x + 3): g.p[y][xx] = 'd'

def bg_hall2():
    g = R.bg_hall()
    # opening in the ceiling + ladder up to the woods
    for y in range(0, 6):
        for x in range(112, 129): g.p[y][x] = '7' if (x + y) % 3 == 0 else '6'
    draw_ladder(g, 120, 0, GROUND - 1)
    return g

def bg_forest():
    g = bg_base(lambda y: '8' if y < 30 else ('6' if y < 70 else 'c'))
    r = random.Random(9)
    for y in range(20, 70):
        for x in range(160):
            if (x + y) % 2 == 0 and r.random() < (y - 20) / 60: g.p[y][x] = '6' if y < 50 else 'c'
    for _ in range(20): g.p[r.randint(0, 25)][r.randint(0, 159)] = '9'
    # far trees
    for tx in range(-4, 165, 14):
        h = r.randint(30, 45)
        for y in range(h, GROUND):
            w = 3 if y > h + 10 else 1 + (y - h) // 4
            for x in range(tx - w, tx + w + 1):
                if 0 <= x < 160: g.p[y][x] = 'c'
    # near trees
    for tx in (14, 58, 96, 146):
        for y in range(0, GROUND):
            for x in range(tx - 4, tx + 5):
                if 0 <= x < 160: g.p[y][x] = 'e' if abs(x - tx) < 3 else 'f'
            if y % 7 == 0 and 0 <= tx - 2 < 160: g.p[y][tx - 2] = 'f'
        for y in range(0, 22):
            for x in range(tx - 14, tx + 15):
                if 0 <= x < 160 and (x - tx) ** 2 / 196 + (y - 8) ** 2 / 200 < 1 and r.random() < .85:
                    g.p[y][x] = '7' if r.random() < .25 else '6'
    # grass floor
    for y in range(GROUND, 120):
        for x in range(160): g.p[y][x] = 'e' if y > GROUND + 3 else '7'
    for x in range(160):
        if r.random() < .3: g.p[GROUND - 1][x] = '7'
    for _ in range(40): g.p[r.randint(GROUND + 4, 119)][r.randint(0, 159)] = 'c'
    # hatch down to the hall
    for y in range(GROUND, 120):
        for x in range(114, 127): g.p[y][x] = 'f'
    draw_ladder(g, 120, GROUND, 119)
    for x in range(113, 128): g.p[GROUND][x] = 'b'
    # fireflies
    for _ in range(14): g.p[r.randint(30, 95)][r.randint(0, 159)] = '5'
    return g

PLAT_H = 44   # rampart ledge height above the floor
PLAT_X1, PLAT_X2 = 96, 140
def bg_rampart():
    g = bg_base(lambda y: 'c' if y < 40 else 'f')
    r = random.Random(10)
    for y in range(20, 60):
        for x in range(160):
            if (x + y) % 2 == 0 and r.random() < (y - 20) / 40: g.p[y][x] = 'f'
    for _ in range(20): g.p[r.randint(0, 35)][r.randint(0, 159)] = '1'
    # castle wall with battlements
    for y in range(34, GROUND):
        for x in range(160):
            g.p[y][x] = 'c' if (y % 6 and (x + (3 if (y // 6) % 2 else 0)) % 12) else 'f'
    for x in range(0, 160, 12):
        for y in range(28, 34):
            for xx in range(x, min(160, x + 6)): g.p[y][xx] = 'c'
    # arrow slits + banners
    for x in (30, 70):
        for y in range(50, 62): g.p[y][x] = 'f'
    for x0 in (40, 60):
        for y in range(40, 64):
            for x in range(x0, x0 + 6):
                if y < 62 or x == x0 + 2 or x == x0 + 3: g.p[y][x] = '2' if x not in (x0, x0 + 5) else 'e'
    # floating stone ledge (top surface at GROUND-PLAT_H), held up by a pillar
    top = GROUND - PLAT_H
    for y in range(top, top + 6):
        for x in range(PLAT_X1, PLAT_X2 + 1): g.p[y][x] = 'd' if y == top else ('b' if y < top + 4 else 'c')
    for x in range(PLAT_X1, PLAT_X2 + 1): g.p[top + 6][x] = 'f'
    for y in range(top + 7, GROUND):
        for x in range(116, 124): g.p[y][x] = 'c' if x in (116, 123) else 'b'
        if y % 6 == 0:
            for x in range(116, 124): g.p[y][x] = 'c'
    # stone archway around the door on the far right
    for y in range(70, GROUND):
        for x in range(143, 160):
            if x < 145 or x > 157 or y < 74: g.p[y][x] = 'c'
    draw_ladder(g, 92, top, GROUND - 1)
    floor(g, seed=5)
    return g

def shield_pickup():
    g = G(10, 12, 5, 11)
    g.rect(-3, -10, 2, -3, 'e'); g.rect(-2, -2, 1, -1, 'e'); g.line((2, -10), (2, -3), 'b')
    g.set(0, -7, '5'); g.set(-1, -7, '5'); g.set(0, -6, '5')
    g.outline()
    return g

def ember_aura_frames():
    out = []
    for i in range(3):
        r = random.Random(40 + i)
        g = G(30, 24, 15, 23)
        # faint warm halo hugging the body, plus drifting sparks
        for y in range(-20, 0):
            for x in (-7, 7):
                if r.random() < .35: g.set(x + r.choice((-1, 0, 1)), y, '4' if r.random() < .7 else '2')
        for _ in range(10):
            g.set(r.randint(-9, 9), r.randint(-23, -2), '5' if r.random() < .4 else '4')
        out.append(g)
    return out

def ember_particle():
    g = G(3, 3, 0, 0)
    g.p = [list('.4.'), list('454'), list('.4.')]
    return g

def bg_cell():
    g = bg_base(lambda y: 'f')
    r = random.Random(77)
    # rough stone blocks, lit only by the moon: darker the further from the window's beam
    for y in range(0, GROUND):
        for x in range(160):
            row = y // 9
            off = 7 if row % 2 else 0
            edge = (y % 9 == 0) or ((x + off) % 14 == 0)
            beam = 35 + (y - 30) * 0.9
            light = max(0.15, 1 - abs(x - beam) / 70) * (0.55 + 0.45 * (1 - y / GROUND))
            if edge:
                g.p[y][x] = 'f'
            elif r.random() < light:
                g.p[y][x] = 'c' if r.random() < .93 else 'b'
            else:
                g.p[y][x] = 'f'
    # barred window high on the left, with a moonbeam falling across the floor
    for y in range(14, 30):
        for x in range(26, 44):
            g.p[y][x] = '8' if (x * 3 + y) % 11 else '9'
    for x in (30, 34, 38):
        for y in range(14, 30): g.p[y][x] = 'b'
    for x in range(25, 45): g.p[13][x] = 'b'; g.p[30][x] = 'b'
    for y in range(31, GROUND):
        t = (y - 31) / (GROUND - 31)
        x0 = int(26 + t * 46); x1 = int(44 + t * 60)
        for x in range(x0, x1):
            if (x + y) % 4 == 0: g.p[y][x] = 'b' if g.p[y][x] == 'c' else 'c'
    # shackles on the wall
    for cx in (88, 100):
        for y in range(36, 52):
            if y % 2 == 0: g.p[y][cx] = 'b'
        g.p[52][cx - 1] = 'b'; g.p[52][cx + 1] = 'b'; g.p[53][cx] = 'b'
    # door frame on the right
    for y in range(66, GROUND):
        for x in range(141, 160):
            if x < 143 or y < 70: g.p[y][x] = 'b' if (x + y) % 4 else 'c'
    # floor: damp flagstones + straw
    floor(g, top='b', mid='c', joint='f', seed=7)
    for _ in range(60):
        x = r.randint(4, 40); y = r.randint(GROUND - 4, GROUND - 1)
        g.p[y][x] = '5' if r.random() < .5 else '4'
    for x in range(118, 126):   # a bucket
        for y in range(GROUND - 7, GROUND): g.p[y][x] = 'e' if x not in (118, 125) else 'f'
    return g

def cell_door_imgs():
    closed = G(14, 34, 7, 33)
    for x in (-6, -3, 0, 3, 6):
        for y in range(-33, 1): closed.set(x, y, 'b')
    for y in (-31, -16, -2):
        closed.line((-6, y), (6, y), 'c')
    closed.set(5, -16, '5'); closed.set(5, -15, '5')
    closed.outline()
    open_ = G(14, 34, 7, 33)
    for y in range(-33, 1): open_.set(-6, y, 'b'); open_.set(-5, y, 'c')
    open_.outline()
    return closed, open_
