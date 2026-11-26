"""Original vector art for Emberfall. Every costume is drawn from code."""
import math, random
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

SERIF = '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'
SANS = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
_fonts = {}

def _font(p):
    if p not in _fonts:
        f = TTFont(p)
        _fonts[p] = (f, f.getGlyphSet(), f.getBestCmap(), f['head'].unitsPerEm, f['hmtx'])
    return _fonts[p]

def text(t, x, y, size, fill, font=SERIF, spacing=0.0, anchor='middle', stroke=None, sw=0, opacity=1):
    f, gs, cmap, upm, hmtx = _font(font)
    sc = size / upm
    names = [cmap.get(ord(c), cmap[ord('?')]) for c in t]
    widths = [hmtx[n][0] * sc + spacing * size for n in names]
    total = sum(widths) - (spacing * size if t else 0)
    cx = x - total / 2 if anchor == 'middle' else (x - total if anchor == 'end' else x)
    pen = SVGPathPen(gs)
    for n, w in zip(names, widths):
        gs[n].draw(TransformPen(pen, (sc, 0, 0, -sc, cx, y)))
        cx += w
    st = f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round" paint-order="stroke"' if stroke else ''
    return f'<path d="{pen.getCommands()}" fill="{fill}" opacity="{opacity}"{st}/>'

def svg(w, h, body, defs=''):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'<defs>{defs}</defs>{body}</svg>')

def P(o, ang, ln):
    a = math.radians(ang)
    return (o[0] + math.cos(a) * ln, o[1] - math.sin(a) * ln)

def line(a, b, col, w, cap='round', op=1):
    return (f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{col}" '
            f'stroke-width="{w}" stroke-linecap="{cap}" opacity="{op}"/>')

def poly(pts, fill, stroke=None, sw=0, op=1):
    s = ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts)
    st = f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"' if stroke else ''
    return f'<polygon points="{s}" fill="{fill}" opacity="{op}"{st}/>'

def limb(pts, col, w, outline='#0d0c10'):
    d = 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts)
    return (f'<path d="{d}" fill="none" stroke="{outline}" stroke-width="{w + 2.4}" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>')

def arc(c, r, a0, a1, col, w, op):
    p0, p1 = P(c, a0, r), P(c, a1, r)
    large = 1 if abs(a1 - a0) > 180 else 0
    sweep = 1 if a1 < a0 else 0
    return (f'<path d="M{p0[0]:.1f},{p0[1]:.1f} A{r},{r} 0 {large} {sweep} {p1[0]:.1f},{p1[1]:.1f}" fill="none" '
            f'stroke="{col}" stroke-width="{w}" stroke-linecap="round" opacity="{op}"/>')

def slash_fx(c, r, a0, a1):
    return (arc(c, r, a0, a1, '#ffffff', 7, 0.18) + arc(c, r, a0, a1, '#fff3d6', 3.5, 0.55)
            + arc(c, r - 3, a0, a1, '#ffffff', 1.2, 0.9))

# ================================================================== KNIGHT (player)
K = dict(steel='#9aa1ab', dark='#5a606b', cape='#7a1c1f', capeD='#4d1013', ol='#0d0c10',
         blade='#e3e7ec', hilt='#7a5a2e', visor='#120f12', plume='#c9a24a')

def knight_pose(hip=(0, -20), sh=None, lean=0, legs=None, arm=-60, arm2=-110, sword=55, fx='',
                flask=False, crouch=0):
    hx, hy = hip[0], hip[1] + crouch
    sx, sy = (hx + lean, hy - 16) if sh is None else sh
    if legs is None:
        legs = [((hx + 3, hy + 10), (5, 0)), ((hx - 3, hy + 10), (-5, 0))]
    o = []
    # cape
    o.append(poly([(sx - 4, sy + 1), (sx - 15 - lean * .3, sy + 12), (hx - 15, hy + 11), (hx - 10, hy + 7),
                   (hx - 7, hy + 12), (hx - 2, hy + 4)], K['cape'], K['ol'], 1.6))
    # back leg / back arm
    (k2, f2) = legs[1]
    o.append(limb([(hx - 2, hy), k2, f2], K['dark'], 5.5))
    o.append(limb([(sx - 3, sy + 2), P((sx - 3, sy + 2), arm2, 10)], K['dark'], 4.5))
    # torso
    o.append(poly([(hx - 6, hy + 1), (hx + 6, hy + 1), (sx + 7, sy), (sx - 7, sy)], K['steel'], K['ol'], 1.6))
    o.append(line((hx - 6, hy - 1), (hx + 6, hy - 1), '#4a3420', 2.5, 'butt'))
    o.append(line((sx - 4, sy + 4), (hx - 3, hy - 3), '#c3c9d1', 1.2, 'round', .6))
    # head
    hc = (sx + 1, sy - 7)
    o.append(f'<rect x="{hc[0]-6:.1f}" y="{hc[1]-7:.1f}" width="12" height="13" rx="4" fill="{K["steel"]}" stroke="{K["ol"]}" stroke-width="1.6"/>')
    o.append(line((hc[0] - 1, hc[1] - 1), (hc[0] + 6, hc[1] - 1), K['visor'], 2.2, 'butt'))
    o.append(line((hc[0] + 2, hc[1] - 1), (hc[0] + 2, hc[1] + 4), K['visor'], 1.4, 'butt'))
    o.append(f'<path d="M{hc[0]-2:.1f},{hc[1]-7:.1f} q-6,-6 -12,-2" stroke="{K["plume"]}" stroke-width="3" fill="none" stroke-linecap="round"/>')
    # front leg
    (k1, f1) = legs[0]
    o.append(limb([(hx + 2, hy), k1, f1], K['steel'], 5.5))
    # front arm + sword
    shp = (sx + 3, sy + 2)
    hand = P(shp, arm, 10)
    o.append(limb([shp, hand], K['steel'], 4.5))
    if flask:
        o.append(f'<circle cx="{hand[0]:.1f}" cy="{hand[1]:.1f}" r="7" fill="#ffb347" opacity=".35"/>')
        o.append(f'<rect x="{hand[0]-2.5:.1f}" y="{hand[1]-5:.1f}" width="5" height="8" rx="2" fill="#f08a24" stroke="{K["ol"]}" stroke-width="1"/>')
    else:
        tip = P(hand, sword, 27)
        base = P(hand, sword, 3)
        o.append(line(P(hand, sword, -3), base, K['hilt'], 3))
        o.append(line(base, tip, K['ol'], 5.2))
        o.append(line(base, tip, K['blade'], 3.2))
        g1, g2 = P(base, sword + 90, 4.5), P(base, sword - 90, 4.5)
        o.append(line(g1, g2, '#8c6a32', 2.6))
    o.append(fx)
    return ''.join(o)

def knight_costumes():
    W, H, CX, CY = 150, 100, 75, 88
    def wrap(body, rot=None):
        g = f'<g transform="translate({CX},{CY})">' + (f'<g transform="rotate({rot[0]} {rot[1]} {rot[2]})">' if rot else '')
        shadow = f'<ellipse cx="{CX}" cy="{CY+1}" rx="13" ry="2.5" fill="#000" opacity=".35"/>'
        return svg(W, H, shadow + g + body + ('</g>' if rot else '') + '</g>')
    c = {}
    c['idle'] = knight_pose()
    c['idle2'] = knight_pose(crouch=1, sword=52)
    for i, (a, b) in enumerate([(7, -4), (3, 0), (-4, 7), (0, 3)]):
        legs = [((a * .6 + 1, -9 - (2 if i % 2 else 0)), (a, 0)), ((b * .6 - 1, -9), (b, 0))]
        c[f'walk{i+1}'] = knight_pose(legs=legs, lean=1, arm=-60 + (5 if i < 2 else -5), sword=50, crouch=-.5 if i % 2 else 0)
    c['windup'] = knight_pose(lean=-2, arm=130, arm2=-150, sword=165, legs=[((5, -10), (8, 0)), ((-4, -9), (-7, 0))])
    c['slash'] = knight_pose(lean=4, arm=5, arm2=-160, sword=-8, legs=[((7, -9), (11, 0)), ((-4, -8), (-8, 0))],
                             fx=slash_fx((3, -34), 34, 110, -45))
    c['recover'] = knight_pose(lean=3, arm=-35, sword=-30, legs=[((7, -9), (10, 0)), ((-4, -8), (-7, 0))])
    c['heavyup'] = knight_pose(lean=-3, arm=100, arm2=110, sword=95, crouch=1,
                               legs=[((6, -9), (9, 0)), ((-5, -9), (-9, 0))])
    c['heavyslash'] = knight_pose(lean=7, arm=-25, arm2=-40, sword=-50, crouch=4,
                                  legs=[((10, -8), (14, 0)), ((-6, -7), (-11, 0))],
                                  fx=slash_fx((6, -30), 38, 100, -70) + slash_fx((6, -30), 30, 95, -60))
    c['jump'] = knight_pose(legs=[((6, -12), (2, -5)), ((-2, -11), (-7, -4))], arm=-20, sword=60, lean=1)
    c['drink'] = knight_pose(arm=125, arm2=-100, flask=True, lean=-1)
    c['hurt'] = knight_pose(lean=-5, arm=-130, arm2=170, sword=-150, legs=[((3, -9), (6, 0)), ((-6, -9), (-6, 0))])
    # roll: curled ball
    ball = (f'<circle cx="0" cy="-13" r="13" fill="{K["capeD"]}" stroke="{K["ol"]}" stroke-width="1.8"/>'
            f'<path d="M-12,-13 A12,12 0 0 1 9,-21 L4,-13 Z" fill="{K["cape"]}"/>'
            f'<rect x="1" y="-26" width="11" height="11" rx="4" fill="{K["steel"]}" stroke="{K["ol"]}" stroke-width="1.5"/>'
            f'<line x1="5" y1="-21" x2="11" y2="-21" stroke="{K["visor"]}" stroke-width="2"/>'
            f'<path d="M-8,-4 Q0,2 8,-5" stroke="{K["steel"]}" stroke-width="5" fill="none" stroke-linecap="round"/>'
            f'<line x1="-6" y1="-8" x2="-16" y2="-22" stroke="{K["blade"]}" stroke-width="3" stroke-linecap="round"/>')
    for i in range(4):
        c[f'roll{i+1}'] = (ball, (i * 90, 0, -13))
    dead = knight_pose(legs=[((3, -9), (6, 0)), ((-3, -9), (-4, 0))], arm=-80, sword=-85)
    c['dead'] = f'<g transform="translate(22,-8) rotate(-90)">{dead}</g>'
    return {k: (wrap(v[0], v[1]) if isinstance(v, tuple) else wrap(v), CX, CY) for k, v in c.items()}

# ================================================================== SKELETON
S = dict(bone='#dcd3bb', boneD='#a59c84', ol='#120f0c', rust='#9a6a44', eye='#ff4a2a')

def skel_pose(hip=(0, -21), lean=0, legs=None, arm=-70, arm2=-110, sword=40, fx='', crouch=0):
    hx, hy = hip[0], hip[1] + crouch
    sx, sy = hx + lean, hy - 16
    if legs is None:
        legs = [((hx + 3, hy + 10), (5, 0)), ((hx - 3, hy + 10), (-5, 0))]
    o = []
    (k2, f2), (k1, f1) = legs[1], legs[0]
    o.append(limb([(hx - 2, hy), k2, f2], S['boneD'], 2.6))
    o.append(limb([(sx - 3, sy + 2), P((sx - 3, sy + 2), arm2, 6), P(P((sx - 3, sy + 2), arm2, 6), arm2 + 25, 6)], S['boneD'], 2.4))
    # pelvis + spine + ribs
    o.append(f'<ellipse cx="{hx}" cy="{hy}" rx="6" ry="3" fill="{S["bone"]}" stroke="{S["ol"]}" stroke-width="1.4"/>')
    o.append(line((hx, hy), (sx, sy), S['ol'], 4.4))
    o.append(line((hx, hy), (sx, sy), S['bone'], 2.4))
    for i in range(4):
        t = .25 + i * .18
        cx, cy = hx + (sx - hx) * t, hy + (sy - hy) * t
        w = 6 - abs(i - 2) * .8
        o.append(f'<path d="M{cx-w:.1f},{cy+1:.1f} Q{cx:.1f},{cy-3:.1f} {cx+w:.1f},{cy+1:.1f}" stroke="{S["ol"]}" stroke-width="3.4" fill="none"/>')
        o.append(f'<path d="M{cx-w:.1f},{cy+1:.1f} Q{cx:.1f},{cy-3:.1f} {cx+w:.1f},{cy+1:.1f}" stroke="{S["bone"]}" stroke-width="1.6" fill="none"/>')
    # skull
    hc = (sx + 2, sy - 7)
    o.append(f'<path d="M{hc[0]-6:.1f},{hc[1]+1:.1f} a6.5,6.5 0 1 1 13,0 l-1,4 h-3 v2 h-5 v-2 h-3 Z" fill="{S["bone"]}" stroke="{S["ol"]}" stroke-width="1.5"/>')
    o.append(f'<circle cx="{hc[0]+3:.1f}" cy="{hc[1]:.1f}" r="2.2" fill="{S["ol"]}"/><circle cx="{hc[0]+3:.1f}" cy="{hc[1]:.1f}" r="1" fill="{S["eye"]}"/>')
    o.append(f'<circle cx="{hc[0]-1.5:.1f}" cy="{hc[1]:.1f}" r="1.8" fill="{S["ol"]}"/>')
    o.append(limb([(hx + 2, hy), k1, f1], S['bone'], 2.8))
    shp = (sx + 2, sy + 2)
    elbow = P(shp, arm, 6)
    hand = P(elbow, arm + 20, 6)
    o.append(limb([shp, elbow, hand], S['bone'], 2.6))
    tip = P(hand, sword, 22)
    o.append(line(P(hand, sword, -3), tip, S['ol'], 4.6))
    o.append(line(P(hand, sword, 1), tip, S['rust'], 2.8))
    o.append(line(P(hand, sword + 90, 3), P(hand, sword - 90, 3), '#5a3a22', 2.2))
    o.append(fx)
    return ''.join(o)

def skeleton_costumes():
    W, H, CX, CY = 130, 90, 65, 80
    def wrap(body):
        return svg(W, H, f'<ellipse cx="{CX}" cy="{CY+1}" rx="12" ry="2.5" fill="#000" opacity=".35"/>'
                         f'<g transform="translate({CX},{CY})">{body}</g>')
    c = {}
    c['s_idle'] = skel_pose(lean=1, crouch=1)
    c['s_walk1'] = skel_pose(lean=2, legs=[((5, -10), (7, 0)), ((-3, -9), (-5, 0))])
    c['s_walk2'] = skel_pose(lean=2, legs=[((1, -10), (-3, 0)), ((2, -10), (4, 0))], crouch=-1)
    c['s_raise'] = skel_pose(lean=-3, arm=120, sword=150, legs=[((4, -10), (7, 0)), ((-4, -9), (-8, 0))])
    c['s_strike'] = skel_pose(lean=5, arm=0, sword=-10, legs=[((8, -9), (12, 0)), ((-4, -8), (-8, 0))],
                              fx=arc((4, -34), 30, 100, -40, '#ff9a7a', 3, .55))
    c['s_recover'] = skel_pose(lean=3, arm=-50, sword=-40, legs=[((7, -9), (10, 0)), ((-4, -8), (-7, 0))])
    c['s_hurt'] = skel_pose(lean=-6, arm=-150, sword=200, legs=[((3, -9), (5, 0)), ((-5, -9), (-7, 0))])
    bones = (f'<g stroke-linecap="round">' + line((-14, -2), (2, -3), S['ol'], 4.4) + line((-14, -2), (2, -3), S['bone'], 2.4)
             + line((-4, -1), (12, -2), S['ol'], 4.4) + line((-4, -1), (12, -2), S['bone'], 2.4)
             + line((6, -2), (18, -6), S['ol'], 4.4) + line((6, -2), (18, -6), S['rust'], 2.6)
             + f'<ellipse cx="-2" cy="-4" rx="7" ry="3" fill="{S["boneD"]}" stroke="{S["ol"]}" stroke-width="1.3"/>'
             + f'<path d="M-20,-5 a6,6 0 1 1 11,0 l-1,4 h-9 Z" fill="{S["bone"]}" stroke="{S["ol"]}" stroke-width="1.4"/>'
             + f'<circle cx="-12" cy="-7" r="1.8" fill="{S["ol"]}"/></g>')
    c['s_dead'] = bones
    return {k: (wrap(v), CX, CY) for k, v in c.items()}

# ================================================================== BOSS: THE HOLLOW WARDEN
B = dict(iron='#4a4550', ironL='#6d6774', ironD='#2c2930', ol='#0a090b', cloak='#3b3530', cloakD='#24201c',
         eye='#ff8a1e', rust='#7d4a2c', wood='#4a3424')

def boss_pose(lean=0, legs=None, arm=-70, arm2=-100, weapon=60, crouch=0, fx='', head_drop=0, eyes=True, kneel=False):
    hx, hy = 0, -21 + crouch
    sx, sy = hx + lean, hy - 19
    if legs is None:
        legs = [((5, -10), (8, 0)), ((-5, -10), (-8, 0))]
    o = []
    # tattered cloak
    o.append(poly([(sx - 8, sy - 2), (sx - 20, sy + 10), (hx - 19, hy + 16), (hx - 14, hy + 12), (hx - 11, hy + 19),
                   (hx - 6, hy + 13), (hx - 1, hy + 18), (hx + 2, hy + 4)], B['cloakD'], B['ol'], 1.4))
    (k2, f2), (k1, f1) = legs[1], legs[0]
    o.append(limb([(hx - 3, hy), k2, f2], B['ironD'], 7))
    o.append(limb([(sx - 6, sy + 3), P((sx - 6, sy + 3), arm2, 9), P(P((sx - 6, sy + 3), arm2, 9), arm2 + 20, 8)], B['ironD'], 6))
    # torso: hulking plate
    o.append(poly([(hx - 8, hy + 2), (hx + 8, hy + 2), (sx + 12, sy + 1), (sx + 8, sy - 4), (sx - 9, sy - 4), (sx - 12, sy + 1)],
                  B['iron'], B['ol'], 1.4))
    o.append(line((hx - 7, hy), (hx + 7, hy), B['rust'], 3, 'butt'))
    o.append(line((sx - 6, sy + 3), (sx + 6, sy + 3), B['ironL'], 1, 'butt', .7))
    # pauldrons
    o.append(f'<ellipse cx="{sx-8:.1f}" cy="{sy-1:.1f}" rx="7" ry="5" fill="{B["ironD"]}" stroke="{B["ol"]}" stroke-width="1.3"/>')
    # head + horns (sunk low, hunched)
    hc = (sx + 4, sy - 5 + head_drop)
    o.append(f'<path d="M{hc[0]-2:.1f},{hc[1]-4:.1f} q-4,-10 -12,-11 q6,4 7,12 Z" fill="#cfc6b0" stroke="{B["ol"]}" stroke-width="1.2"/>')
    o.append(f'<path d="M{hc[0]+4:.1f},{hc[1]-4:.1f} q3,-9 11,-11 q-4,5 -5,13 Z" fill="#cfc6b0" stroke="{B["ol"]}" stroke-width="1.2"/>')
    o.append(f'<rect x="{hc[0]-6:.1f}" y="{hc[1]-6:.1f}" width="13" height="12" rx="3" fill="{B["ironL"]}" stroke="{B["ol"]}" stroke-width="1.4"/>')
    o.append(line((hc[0] - 4, hc[1] + 1), (hc[0] + 7, hc[1] + 1), B['ol'], 2.6, 'butt'))
    if eyes:
        o.append(f'<circle cx="{hc[0]+4:.1f}" cy="{hc[1]+1:.1f}" r="3" fill="{B["eye"]}" opacity=".35"/>')
        o.append(f'<circle cx="{hc[0]+4:.1f}" cy="{hc[1]+1:.1f}" r="1.2" fill="#ffe2a0"/>')
    o.append(limb([(hx + 3, hy), k1, f1], B['iron'], 7))
    # weapon arm: great hammer
    shp = (sx + 6, sy + 2)
    elbow = P(shp, arm, 9)
    hand = P(elbow, arm + 15, 8)
    o.append(limb([shp, elbow, hand], B['iron'], 6))
    end = P(hand, weapon, 30)
    o.append(line(P(hand, weapon, -8), end, B['ol'], 4.6))
    o.append(line(P(hand, weapon, -8), end, B['wood'], 2.8))
    hp1, hp2 = P(end, weapon + 90, 8), P(end, weapon - 90, 6)
    hp3, hp4 = P(hp2, weapon, 9), P(hp1, weapon, 9)
    o.append(poly([hp1, hp2, hp3, hp4], B['ironD'], B['ol'], 1.4))
    o.append(line(P(hp1, weapon, 4.5), P(hp2, weapon, 4.5), B['rust'], 1.4, 'butt'))
    o.append(fx)
    return ''.join(o)

def boss_costumes():
    SC = 2.9
    W, H, CX, CY = 420, 300, 210, 285
    def wrap(body, op=1):
        return svg(W, H, f'<ellipse cx="{CX}" cy="{CY+2}" rx="45" ry="6" fill="#000" opacity=".4"/>'
                         f'<g transform="translate({CX},{CY}) scale({SC})" opacity="{op}">{body}</g>')
    c = {}
    c['b_idle'] = boss_pose(lean=3, crouch=2)
    c['b_walk1'] = boss_pose(lean=4, crouch=2, legs=[((8, -10), (12, 0)), ((-4, -9), (-8, 0))])
    c['b_walk2'] = boss_pose(lean=4, crouch=3, legs=[((3, -10), (0, 0)), ((0, -10), (3, 0))], arm=-65)
    c['b_raise'] = boss_pose(lean=-4, arm=110, arm2=130, weapon=120, legs=[((7, -10), (11, 0)), ((-6, -10), (-11, 0))])
    c['b_slam'] = boss_pose(lean=9, arm=-10, arm2=-30, weapon=-75, crouch=6, head_drop=2,
                            legs=[((12, -9), (16, 0)), ((-7, -8), (-13, 0))],
                            fx=f'<ellipse cx="41" cy="-1" rx="16" ry="3" fill="#ffb060" opacity=".45"/>'
                               + ''.join(line((41 + dx, -2), (41 + dx * 1.6, -9 - abs(dx) * .2), '#d9cbb0', 1.4, 'round', .8)
                                         for dx in (-10, -5, 4, 9)))
    c['b_sweepup'] = boss_pose(lean=-5, arm=170, arm2=-120, weapon=190, crouch=3,
                               legs=[((6, -10), (12, 0)), ((-6, -9), (-11, 0))])
    c['b_sweep'] = boss_pose(lean=6, arm=-10, arm2=-150, weapon=-15, crouch=5,
                             legs=[((10, -9), (15, 0)), ((-6, -8), (-12, 0))],
                             fx='<path d="M-30,-8 Q10,-22 52,-10" stroke="#ffd9a0" stroke-width="4" fill="none" opacity=".45" stroke-linecap="round"/>'+'<path d="M-20,-4 Q14,-14 48,-5" stroke="#fff" stroke-width="1.5" fill="none" opacity=".6" stroke-linecap="round"/>')
    c['b_crouch'] = boss_pose(lean=10, arm=-100, weapon=-160, crouch=7, head_drop=5,
                              legs=[((9, -8), (14, 0)), ((-9, -7), (-15, 0))])
    c['b_charge'] = boss_pose(lean=13, arm=-120, weapon=-170, crouch=6, head_drop=6,
                              legs=[((14, -8), (18, 0)), ((-10, -6), (-18, -1))],
                              fx=''.join(line((-25 - i * 4, -28 + i * 9), (-38 - i * 5, -28 + i * 9), '#bfb7a8', 1.2, 'round', .5)
                                         for i in range(4)))
    c['b_roar'] = boss_pose(lean=-6, arm=60, arm2=150, weapon=100, crouch=-1,
                            fx=f'<circle cx="0" cy="-48" r="24" fill="none" stroke="#ff8a1e" stroke-width="1.2" opacity=".5"/>'
                               f'<circle cx="0" cy="-48" r="32" fill="none" stroke="#ff8a1e" stroke-width=".8" opacity=".3"/>')
    c['b_dead'] = boss_pose(lean=6, arm=-90, arm2=-100, weapon=-170, crouch=12, head_drop=7, eyes=False,
                            legs=[((10, -6), (10, 0)), ((-8, -2), (-18, 0))])
    return {k: (wrap(v), CX, CY) for k, v in c.items()}

# ================================================================== props
def shockwave_costumes():
    W, H, CX, CY = 60, 50, 30, 46
    out = {}
    for i in range(2):
        r = random.Random(i)
        flames = ''
        for j in range(6):
            x = -14 + j * 5.5 + r.uniform(-1, 1)
            h = 14 + r.uniform(0, 14) * (1 - abs(j - 2.5) / 3.5)
            flames += f'<path d="M{x-4:.1f},0 Q{x+r.uniform(-3,3):.1f},{-h*.6:.1f} {x+1:.1f},{-h:.1f} Q{x+3:.1f},{-h*.5:.1f} {x+4:.1f},0 Z" fill="#ff7a1a" opacity=".85"/>'
            flames += f'<path d="M{x-2:.1f},0 Q{x:.1f},{-h*.4:.1f} {x+1:.1f},{-h*.65:.1f} Q{x+2:.1f},{-h*.3:.1f} {x+2.5:.1f},0 Z" fill="#ffe08a"/>'
        body = (f'<ellipse cx="0" cy="-6" rx="24" ry="14" fill="#ff5a10" opacity=".25"/>{flames}'
                f'<ellipse cx="0" cy="0" rx="20" ry="3" fill="#ffd27a" opacity=".7"/>')
        out[f'wave{i+1}'] = (svg(W, H, f'<g transform="translate({CX},{CY})">{body}</g>'), CX, CY)
    return out

def bonfire_costumes():
    W, H, CX, CY = 100, 110, 50, 100
    out = {}
    base = (f'<ellipse cx="0" cy="-2" rx="22" ry="5" fill="#16120f"/>'
            + ''.join(f'<ellipse cx="{x}" cy="{y}" rx="6" ry="4" fill="#4a4440" stroke="#0d0c0b" stroke-width="1.2"/>'
                      for x, y in [(-16, -3), (-6, -1), (6, -1), (16, -3), (-11, -6), (11, -6)])
            + f'<path d="M-6,-6 L4,-20 M4,-6 L-6,-18" stroke="#2a1d12" stroke-width="4" stroke-linecap="round"/>')
    sword = (line((1, -8), (-2, -60), '#0d0c10', 5) + line((1, -8), (-2, -58), '#8b8f96', 3)
             + line((-9, -55), (6, -54), '#5c4423', 3) + line((-2, -56), (-2.5, -66), '#5c4423', 3))
    for i in range(3):
        r = random.Random(10 + i)
        fl = ''
        for j in range(7):
            x = -12 + j * 4 + r.uniform(-1.5, 1.5)
            h = 14 + r.uniform(4, 20) * (1 - abs(j - 3) / 4.5)
            fl += (f'<path d="M{x-5:.1f},-6 Q{x+r.uniform(-4,4):.1f},{-6-h*.6:.1f} {x+r.uniform(-2,2):.1f},{-6-h:.1f} '
                   f'Q{x+4:.1f},{-6-h*.4:.1f} {x+5:.1f},-6 Z" fill="#ff6a14" opacity=".9"/>')
        for j in range(5):
            x = -7 + j * 3.5 + r.uniform(-1, 1)
            h = 8 + r.uniform(2, 10) * (1 - abs(j - 2) / 3)
            fl += f'<path d="M{x-3:.1f},-6 Q{x:.1f},{-6-h:.1f} {x+.5:.1f},{-6-h:.1f} Q{x+2:.1f},{-6-h*.4:.1f} {x+3:.1f},-6 Z" fill="#ffe29a"/>'
        embers = ''.join(f'<circle cx="{r.uniform(-14,14):.1f}" cy="{r.uniform(-60,-30):.1f}" r="{r.uniform(.6,1.4):.1f}" fill="#ffb347" opacity="{r.uniform(.4,.9):.2f}"/>' for _ in range(6))
        glow = f'<circle cx="0" cy="-16" r="38" fill="url(#g)"/>'
        defs = '<radialGradient id="g"><stop offset="0" stop-color="#ff9a3a" stop-opacity=".45"/><stop offset="1" stop-color="#ff6a14" stop-opacity="0"/></radialGradient>'
        out[f'fire{i+1}'] = (svg(W, H, f'<g transform="translate({CX},{CY})">{glow}{base}{sword}{fl}{embers}</g>', defs), CX, CY)
    return out

def fog_costumes():
    W, H, CX, CY = 70, 250, 35, 245
    out = {}
    for i in range(2):
        r = random.Random(20 + i)
        wisps = ''.join(f'<ellipse cx="{r.uniform(-14,14):.1f}" cy="{r.uniform(-230,-10):.1f}" rx="{r.uniform(6,14):.1f}" '
                        f'ry="{r.uniform(14,34):.1f}" fill="#f2efe6" opacity="{r.uniform(.12,.3):.2f}"/>' for _ in range(16))
        defs = ('<linearGradient id="f" x1="0" x2="1"><stop offset="0" stop-color="#e8e4da" stop-opacity="0"/>'
                '<stop offset=".5" stop-color="#e8e4da" stop-opacity=".55"/><stop offset="1" stop-color="#e8e4da" stop-opacity="0"/></linearGradient>')
        out[f'fog{i+1}'] = (svg(W, H, f'<g transform="translate({CX},{CY})"><rect x="-32" y="-245" width="64" height="245" fill="url(#f)"/>{wisps}</g>', defs), CX, CY)
    return out

def stain_costumes():
    W, H, CX, CY = 60, 40, 30, 32
    defs = '<radialGradient id="s"><stop offset="0" stop-color="#7dffb0" stop-opacity=".7"/><stop offset="1" stop-color="#2aff7a" stop-opacity="0"/></radialGradient>'
    body = (f'<ellipse cx="0" cy="-8" rx="24" ry="16" fill="url(#s)"/>'
            f'<path d="M-16,0 q4,-5 10,-3 q5,-4 11,-1 q7,-2 9,2 q-6,3 -14,2 q-9,2 -16,0 Z" fill="#5a0d10" stroke="#2a0507" stroke-width="1"/>'
            f'<circle cx="0" cy="-9" r="2.2" fill="#d6ffe6"/>')
    return {'stain': (svg(W, H, f'<g transform="translate({CX},{CY})">{body}</g>', defs), CX, CY)}

# ================================================================== HUD
def hud_costumes():
    out = {}
    def small(name, body, w, h, cx, cy):
        out[name] = (svg(w, h, body), cx, cy)
    flask = ('<rect x="5" y="1" width="6" height="4" rx="1" fill="#6b4a2a" stroke="#0d0c10" stroke-width="1"/>'
             '<path d="M4,5 h8 v3 q4,3 4,8 q0,6 -8,6 q-8,0 -8,-6 q0,-5 4,-8 Z" fill="{f}" stroke="#0d0c10" stroke-width="1.4"/>'
             '<path d="M3,16 q0,4 5,4" stroke="#fff" stroke-width="1.2" fill="none" opacity=".5"/>')
    small('flask', '<circle cx="8" cy="14" r="9" fill="#ffae3a" opacity=".3"/>' + flask.replace('{f}', '#f08a24'), 16, 24, 8, 12)
    small('flask_empty', flask.replace('{f}', '#3a3a40'), 16, 24, 8, 12)
    for d in range(10):
        small(f'd{d}', text(str(d), 7, 17, 19, '#e9dfc6', stroke='#000', sw=3), 14, 22, 7, 11)
    small('soul', '<circle cx="9" cy="10" r="8" fill="#9fffd0" opacity=".25"/><path d="M9,3 q5,6 3,10 q-1,4 -3,4 q-4,0 -4,-4 q0,-4 4,-10 Z" fill="#d6ffe6"/>', 18, 20, 9, 10)
    small('bossname', text('THE HOLLOW WARDEN', 160, 14, 14, '#e9dfc6', spacing=.12, stroke='#000', sw=3), 320, 20, 160, 10)
    small('label_hp', text('HP', 0, 10, 10, '#d8c9a8', font=SANS, anchor='start', stroke='#000', sw=2), 20, 12, 0, 6)
    small('prompt', '<rect x="1" y="1" width="138" height="22" rx="4" fill="#000" opacity=".65" stroke="#d9b26a" stroke-width="1"/>'
          + text('↓', 16, 17, 14, '#d9b26a', font=SANS) + text('Rest at bonfire', 76, 17, 14, '#efe6d0'), 140, 24, 70, 12)
    return out

# ================================================================== banners
def banner(title, colour, sub=None, size=46):
    W, H = 480, 120
    defs = ('<linearGradient id="b" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/>'
            '<stop offset=".25" stop-color="#000" stop-opacity=".78"/><stop offset=".75" stop-color="#000" stop-opacity=".78"/>'
            '<stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>')
    body = f'<rect x="0" y="22" width="480" height="76" fill="url(#b)"/>'
    body += text(title, 240, 60 + size * .32, size, colour, spacing=.08, stroke='#000', sw=2)
    if sub:
        body += text(sub, 240, 92, 13, '#cbbfa5', spacing=.15)
    return (svg(W, H, body, defs), 240, 60)

def banner_costumes():
    out = {
        'youdied': banner('YOU DIED', '#a3161b', size=58),
        'rested': banner('EMBER REKINDLED', '#e2b55e', 'Enemies have returned', size=36),
        'boss': banner('THE HOLLOW WARDEN', '#e9dfc6', 'Keeper of the Ashen Throne', size=34),
        'felled': banner('WARDEN FELLED', '#e2b55e', 'Thank you for playing', size=44),
        'phase2': banner('THE WARDEN ENRAGES', '#ff8a2e', size=34),
        'hall': banner('THE SUNKEN HALL', '#d8ccb2', size=30),
        'gate': banner('THE ASHEN GATE', '#d8ccb2', size=30),
    }
    out['press'] = (svg(480, 40, text('Press SPACE to begin', 240, 27, 20, '#e9dfc6', spacing=.12, stroke='#000', sw=3)), 240, 20)
    return out

# ================================================================== backdrops (480x360, floor top at y=300)
def stone_floor(r, top='#4a423c', base='#2a2624', joint='#171514'):
    o = [f'<rect x="0" y="300" width="480" height="60" fill="{base}"/>', line((0, 300.5), (480, 300.5), top, 2, 'butt')]
    for row, (y0, h) in enumerate([(301, 18), (319, 20), (339, 21)]):
        o.append(line((0, y0 + h), (480, y0 + h), joint, 1.5, 'butt'))
        x = -r.uniform(0, 50)
        while x < 480:
            w = r.uniform(40, 80)
            shade = r.uniform(-.06, .06)
            o.append(f'<rect x="{x:.1f}" y="{y0}" width="{w:.1f}" height="{h}" fill="{"#fff" if shade > 0 else "#000"}" opacity="{abs(shade):.2f}"/>')
            o.append(line((x, y0), (x, y0 + h), joint, 1.5, 'butt'))
            x += w
    return ''.join(o)

def embers(r, n, y0=0, y1=300):
    return ''.join(f'<circle cx="{r.uniform(0,480):.1f}" cy="{r.uniform(y0,y1):.1f}" r="{r.uniform(.6,1.8):.1f}" '
                   f'fill="#ffa040" opacity="{r.uniform(.3,.85):.2f}"/>' for _ in range(n))

def area1():
    r = random.Random(1)
    defs = ('<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14121f"/>'
            '<stop offset=".6" stop-color="#3a2838"/><stop offset="1" stop-color="#6b3a2c"/></linearGradient>'
            '<radialGradient id="moon"><stop offset=".55" stop-color="#efe6d2" stop-opacity=".25"/><stop offset="1" stop-color="#efe6d2" stop-opacity="0"/></radialGradient>')
    o = ['<rect width="480" height="300" fill="url(#sky)"/>',
         '<circle cx="370" cy="72" r="70" fill="url(#moon)"/><circle cx="370" cy="72" r="28" fill="#ece3cf"/>',
         '<circle cx="361" cy="66" r="5" fill="#d8ceb8"/><circle cx="378" cy="82" r="3.5" fill="#d8ceb8"/>']
    # distant castle
    o.append(poly([(0, 230), (40, 215), (60, 220), (60, 160), (68, 150), (76, 160), (76, 205), (120, 200), (140, 120), (148, 108),
                   (156, 120), (166, 200), (230, 210), (250, 170), (262, 170), (262, 205), (330, 215), (420, 205), (480, 220),
                   (480, 300), (0, 300)], '#221b27'))
    for x in (64, 144, 252):
        o.append(f'<rect x="{x+2}" y="{r.randint(170,185)}" width="3" height="5" fill="#ffb060" opacity=".7"/>')
    # ruined gate arch (mid)
    o.append(poly([(150, 300), (150, 150), (162, 140), (174, 150), (174, 300)], '#2f2733', '#120f14', 2))
    o.append(poly([(306, 300), (306, 165), (318, 155), (330, 165), (330, 300)], '#2f2733', '#120f14', 2))
    o.append(f'<path d="M174,175 Q240,105 306,180 L306,192 Q240,125 174,188 Z" fill="#2f2733" stroke="#120f14" stroke-width="2"/>')
    for x in (150, 306):
        for y in range(160, 300, 22):
            o.append(line((x, y), (x + 24, y), '#1d1820', 1.4, 'butt'))
    # dead tree
    o.append('<path d="M60,300 C62,260 58,240 66,210 M64,240 C50,225 40,222 30,212 M66,225 C80,210 90,208 100,196 M64,214 C66,200 70,190 64,178" '
             'stroke="#120f14" stroke-width="5" fill="none" stroke-linecap="round"/>')
    o.append(embers(r, 26, 80, 295))
    o.append(stone_floor(r))
    o.append('<rect y="300" width="480" height="60" fill="#ff6a14" opacity=".05"/>')
    return svg(480, 360, ''.join(o), defs)

def area2():
    r = random.Random(2)
    defs = ('<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f0e13"/><stop offset="1" stop-color="#26222b"/></linearGradient>'
            '<radialGradient id="torch"><stop offset="0" stop-color="#ffb050" stop-opacity=".55"/><stop offset="1" stop-color="#ff7a20" stop-opacity="0"/></radialGradient>')
    o = ['<rect width="480" height="300" fill="url(#wall)"/>']
    for y in range(20, 300, 24):
        off = (y // 24) % 2 * 30
        o.append(line((0, y), (480, y), '#16141a', 1.4, 'butt'))
        for x in range(-off, 480, 60):
            o.append(line((x, y), (x, y + 24), '#16141a', 1.4, 'butt'))
    for tx in (120, 360):
        o.append(f'<circle cx="{tx}" cy="150" r="80" fill="url(#torch)"/>')
        o.append(f'<rect x="{tx-3}" y="152" width="6" height="16" fill="#3a2a1c" stroke="#0d0b09" stroke-width="1"/>')
        o.append(f'<path d="M{tx-6},152 Q{tx-4},136 {tx},128 Q{tx+5},138 {tx+6},152 Z" fill="#ff7a1a"/><path d="M{tx-3},152 Q{tx},140 {tx+1},136 Q{tx+3},144 {tx+3},152 Z" fill="#ffe29a"/>')
    for px in (30, 230, 440):
        o.append(f'<rect x="{px-18}" y="0" width="36" height="300" fill="#2c2832" stroke="#0e0c10" stroke-width="2"/>')
        o.append(f'<rect x="{px-24}" y="270" width="48" height="30" fill="#332e39" stroke="#0e0c10" stroke-width="2"/>')
        o.append(f'<rect x="{px-24}" y="0" width="48" height="26" fill="#332e39" stroke="#0e0c10" stroke-width="2"/>')
        o.append(line((px - 10, 28), (px - 10, 268), '#3b3642', 3, 'butt'))
    for cx in (170, 300, 330):
        ln = r.randint(60, 130)
        o.append(f'<path d="M{cx},0 L{cx},{ln}" stroke="#1a171d" stroke-width="3" stroke-dasharray="5 2"/>')
    o.append('<path d="M300,0 Q315,90 330,0" stroke="#1a171d" stroke-width="3" fill="none" stroke-dasharray="5 2"/>')
    o.append(stone_floor(r, top='#3b3540', base='#1f1c22', joint='#121014'))
    for x, w in ((80, 70), (280, 90)):
        o.append(f'<ellipse cx="{x}" cy="{315 + r.randint(0,20)}" rx="{w/2}" ry="5" fill="#5a6a8a" opacity=".18"/>')
    return svg(480, 360, ''.join(o), defs)

def area3():
    r = random.Random(3)
    defs = ('<linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0c0c"/><stop offset="1" stop-color="#6a2412"/></linearGradient>'
            '<radialGradient id="hole"><stop offset="0" stop-color="#ff7a30" stop-opacity=".35"/><stop offset="1" stop-color="#ff7a30" stop-opacity="0"/></radialGradient>')
    o = ['<rect width="480" height="300" fill="#140f12"/>',
         '<path d="M90,0 L130,70 L170,55 L210,95 L260,80 L300,100 L340,60 L390,0 Z" fill="url(#sky3)"/>',
         '<circle cx="240" cy="40" r="140" fill="url(#hole)"/>']
    # arena wall with arches
    o.append('<path d="M0,120 Q240,80 480,120 L480,300 L0,300 Z" fill="#221b22" stroke="#0c090c" stroke-width="2"/>')
    for i in range(7):
        x = 20 + i * 70
        o.append(f'<path d="M{x},300 L{x},190 Q{x+25},160 {x+50},190 L{x+50},300 Z" fill="#120d11"/>')
    # throne
    o.append('<path d="M205,300 L205,170 L222,150 L240,135 L258,150 L275,170 L275,300 Z" fill="#2e252c" stroke="#0c090c" stroke-width="2"/>')
    o.append('<rect x="195" y="240" width="90" height="60" fill="#3a2f36" stroke="#0c090c" stroke-width="2"/>')
    o.append(line((240, 150), (240, 230), '#0c090c', 2))
    o.append(poly([(222, 150), (215, 120), (230, 145)], '#2e252c', '#0c090c', 1.5))
    o.append(poly([(258, 150), (266, 118), (250, 145)], '#2e252c', '#0c090c', 1.5))
    # rubble & chains
    for _ in range(9):
        x = r.uniform(0, 480); s = r.uniform(5, 14)
        o.append(poly([(x, 300), (x + s * .3, 300 - s), (x + s, 300 - s * .7), (x + s * 1.3, 300)], '#2a2228', '#0c090c', 1.2))
    o.append(embers(r, 40, 20, 295))
    o.append(stone_floor(r, top='#4a3236', base='#221a1c', joint='#120c0e'))
    o.append('<ellipse cx="240" cy="330" rx="200" ry="22" fill="none" stroke="#5a2a20" stroke-width="2" opacity=".5"/>')
    return svg(480, 360, ''.join(o), defs)

def title_bg():
    r = random.Random(4)
    defs = ('<linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07060a"/><stop offset=".7" stop-color="#2a0f0e"/><stop offset="1" stop-color="#4a1a0e"/></linearGradient>'
            '<radialGradient id="tg"><stop offset="0" stop-color="#ff8a30" stop-opacity=".5"/><stop offset="1" stop-color="#ff5a10" stop-opacity="0"/></radialGradient>')
    o = ['<rect width="480" height="360" fill="url(#t)"/>',
         poly([(0, 300), (60, 280), (80, 230), (90, 230), (100, 270), (180, 262), (200, 200), (212, 186), (224, 200),
               (240, 255), (330, 265), (350, 215), (362, 215), (372, 268), (480, 290), (480, 360), (0, 360)], '#0d0a0d'),
         '<circle cx="240" cy="300" r="120" fill="url(#tg)"/>']
    # sword in ground
    o.append(line((240, 305), (240, 225), '#0d0c10', 7) + line((240, 303), (240, 227), '#a7acb4', 4)
             + line((226, 230), (254, 230), '#6b4f2a', 4) + line((240, 228), (240, 210), '#6b4f2a', 4)
             + '<circle cx="240" cy="207" r="4" fill="#d9b26a"/>')
    o.append(f'<ellipse cx="240" cy="306" rx="60" ry="6" fill="#000" opacity=".6"/>')
    o.append(embers(r, 60, 120, 330))
    o.append(text('EMBERFALL', 240, 90, 54, '#d9b26a', spacing=.12, stroke='#000', sw=4))
    o.append(line((110, 108), (370, 108), '#d9b26a', 1, 'butt', .6))
    o.append(text('a souls-like, made entirely in Scratch', 240, 128, 15, '#cbbfa5', spacing=.08))
    ctrl = [('← →', 'Move'), ('↑', 'Jump'), ('SPACE', 'Roll'), ('Z', 'Light attack'),
            ('X', 'Heavy attack'), ('C', 'Drink flask'), ('↓', 'Rest at bonfire')]
    o.append('<rect x="20" y="146" width="150" height="150" rx="6" fill="#000" opacity=".55" stroke="#5a4630" stroke-width="1"/>')
    for i, (k, d) in enumerate(ctrl):
        y = 168 + i * 19
        o.append(text(k, 70, y, 12, '#d9b26a', font=SANS, anchor='end'))
        o.append(text(d, 80, y, 13, '#e9dfc6', anchor='start'))
    o.append('<rect x="310" y="146" width="150" height="150" rx="6" fill="#000" opacity=".55" stroke="#5a4630" stroke-width="1"/>')
    tips = ['Every action costs', 'stamina. Watch the bar.', '', 'Rolling makes you', 'briefly invincible.', '',
            'Die, and your souls', 'stay where you fell.']
    for i, t in enumerate(tips):
        o.append(text(t, 385, 168 + i * 16, 12.5, '#e9dfc6'))
    return svg(480, 360, ''.join(o), defs)
