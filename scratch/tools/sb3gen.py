"""Tiny DSL that compiles Python-described scripts into Scratch 3 project.json blocks."""
import json, hashlib, zipfile, re

# ---------------------------------------------------------------- expressions
class Expr:
    def __add__(s, o): return Op('operator_add', s, o)
    def __radd__(s, o): return Op('operator_add', o, s)
    def __sub__(s, o): return Op('operator_subtract', s, o)
    def __rsub__(s, o): return Op('operator_subtract', o, s)
    def __mul__(s, o): return Op('operator_multiply', s, o)
    def __rmul__(s, o): return Op('operator_multiply', o, s)
    def __truediv__(s, o): return Op('operator_divide', s, o)
    def __rtruediv__(s, o): return Op('operator_divide', o, s)
    def __mod__(s, o): return Op('operator_mod', s, o)

class Var(Expr):
    def __init__(s, name): s.name = name

class Arg(Expr):
    def __init__(s, name): s.name = name

class Rep(Expr):
    """generic reporter / boolean block: opcode, inputs {name:(value,kind)}, fields"""
    def __init__(s, opcode, inputs=None, fields=None):
        s.opcode, s.inputs, s.fields = opcode, inputs or {}, fields or {}

def Op(opc, a, b):
    if opc == 'operator_mod':
        return Rep(opc, {'NUM1': (a, 'num'), 'NUM2': (b, 'num')})
    return Rep(opc, {'NUM1': (a, 'num'), 'NUM2': (b, 'num')})

def eq(a, b): return Rep('operator_equals', {'OPERAND1': (a, 'text'), 'OPERAND2': (b, 'text')})
def lt(a, b): return Rep('operator_lt', {'OPERAND1': (a, 'text'), 'OPERAND2': (b, 'text')})
def gt(a, b): return Rep('operator_gt', {'OPERAND1': (a, 'text'), 'OPERAND2': (b, 'text')})
def AND(a, b, *more):
    r = Rep('operator_and', {'OPERAND1': (a, 'bool'), 'OPERAND2': (b, 'bool')})
    for m in more: r = AND(r, m)
    return r
def OR(a, b, *more):
    r = Rep('operator_or', {'OPERAND1': (a, 'bool'), 'OPERAND2': (b, 'bool')})
    for m in more: r = OR(r, m)
    return r
def NOT(a): return Rep('operator_not', {'OPERAND': (a, 'bool')})
def rand(a, b): return Rep('operator_random', {'FROM': (a, 'num'), 'TO': (b, 'num')})
def join(a, b): return Rep('operator_join', {'STRING1': (a, 'text'), 'STRING2': (b, 'text')})
def letter(i, s): return Rep('operator_letter_of', {'LETTER': (i, 'pos'), 'STRING': (s, 'text')})
def length(s): return Rep('operator_length', {'STRING': (s, 'text')})
def round_(x): return Rep('operator_round', {'NUM': (x, 'num')})
def mathop(op, x): return Rep('operator_mathop', {'NUM': (x, 'num')}, {'OPERATOR': [op, None]})
def abs_(x): return mathop('abs', x)
def floor_(x): return mathop('floor', x)
def key(k): return Rep('sensing_keypressed', {'KEY_OPTION': (k, 'menu:sensing_keyoptions:KEY_OPTION')})
def xpos(): return Rep('motion_xposition')
def costume_name(): return Rep('looks_costumenumbername', fields={'NUMBER_NAME': ['name', None]})

# ---------------------------------------------------------------- statements
class St:
    def __init__(s, opcode, inputs=None, fields=None, mutation=None):
        s.opcode, s.inputs, s.fields, s.mutation = opcode, inputs or {}, fields or {}, mutation

def set_(v, val): return St('data_setvariableto', {'VALUE': (val, 'text')}, {'VARIABLE': ('VAR', v)})
def change(v, val): return St('data_changevariableby', {'VALUE': (val, 'num')}, {'VARIABLE': ('VAR', v)})
def if_(c, *body): return St('control_if', {'CONDITION': (c, 'bool'), 'SUBSTACK': (list(body), 'stack')})
def if_else(c, body, other):
    return St('control_if_else', {'CONDITION': (c, 'bool'), 'SUBSTACK': (list(body), 'stack'),
                                  'SUBSTACK2': (list(other), 'stack')})
def forever(*body): return St('control_forever', {'SUBSTACK': (list(body), 'stack')})
def repeat(n, *body): return St('control_repeat', {'TIMES': (n, 'int'), 'SUBSTACK': (list(body), 'stack')})
def repeat_until(c, *body):
    return St('control_repeat_until', {'CONDITION': (c, 'bool'), 'SUBSTACK': (list(body), 'stack')})
def wait(s): return St('control_wait', {'DURATION': (s, 'pos')})
def wait_until(c): return St('control_wait_until', {'CONDITION': (c, 'bool')})
def stop(opt):
    return St('control_stop', fields={'STOP_OPTION': [opt, None]},
              mutation={'tagName': 'mutation', 'children': [],
                        'hasnext': 'true' if opt == 'other scripts in sprite' else 'false'})
def broadcast(name): return St('event_broadcast', {'BROADCAST_INPUT': (name, 'broadcast')})
def broadcast_wait(name): return St('event_broadcastandwait', {'BROADCAST_INPUT': (name, 'broadcast')})
def goto_xy(x, y): return St('motion_gotoxy', {'X': (x, 'num'), 'Y': (y, 'num')})
def set_x(x): return St('motion_setx', {'X': (x, 'num')})
def change_x(x): return St('motion_changexby', {'DX': (x, 'num')})
def point(d): return St('motion_pointindirection', {'DIRECTION': (d, 'angle')})
def rot_style(s): return St('motion_setrotationstyle', fields={'STYLE': [s, None]})
def costume(c): return St('looks_switchcostumeto', {'COSTUME': (c, 'menu:looks_costume:COSTUME')})
def backdrop(c): return St('looks_switchbackdropto', {'BACKDROP': (c, 'menu:looks_backdrops:BACKDROP')})
def show(): return St('looks_show')
def hide(): return St('looks_hide')
def set_size(n): return St('looks_setsizeto', {'SIZE': (n, 'num')})
def set_effect(e, v): return St('looks_seteffectto', {'VALUE': (v, 'num')}, {'EFFECT': [e, None]})
def change_effect(e, v): return St('looks_changeeffectby', {'CHANGE': (v, 'num')}, {'EFFECT': [e, None]})
def clear_effects(): return St('looks_cleargraphiceffects')
def front(): return St('looks_gotofrontback', fields={'FRONT_BACK': ['front', None]})
def back(): return St('looks_gotofrontback', fields={'FRONT_BACK': ['back', None]})
def play(snd): return St('sound_play', {'SOUND_MENU': (snd, 'menu:sound_sounds_menu:SOUND_MENU')})
def play_wait(snd): return St('sound_playuntildone', {'SOUND_MENU': (snd, 'menu:sound_sounds_menu:SOUND_MENU')})
def stop_sounds(): return St('sound_stopallsounds')
def set_volume(v): return St('sound_setvolumeto', {'VOLUME': (v, 'num')})
def clone(): return St('control_create_clone_of', {'CLONE_OPTION': ('_myself_', 'menu:control_create_clone_of_menu:CLONE_OPTION')})
def delete_clone(): return St('control_delete_this_clone')
def pen_clear(): return St('pen_clear')
def pen_down(): return St('pen_penDown')
def pen_up(): return St('pen_penUp')
def stamp(): return St('pen_stamp')
def pen_size(n): return St('pen_setPenSizeTo', {'SIZE': (n, 'num')})
def pen_color(c): return St('pen_setPenColorToColor', {'COLOR': (c, 'color')})
def call(proc, *args): return St('procedures_call', mutation={'proc': proc, 'args': args})

# ---------------------------------------------------------------- scripts
class Script:
    def __init__(s, hat, body, comment=None):
        s.hat, s.body, s.comment = hat, body, comment

def when_flag(*body, comment=None): return Script(('flag',), list(body), comment)
def when_receive(name, *body, comment=None): return Script(('receive', name), list(body), comment)
def when_clone(*body, comment=None): return Script(('clone',), list(body), comment)
def define(name, args, *body, warp=False, comment=None):
    return Script(('define', name, list(args), warp), list(body), comment)

# ---------------------------------------------------------------- compiler
PRIM = {'num': 4, 'pos': 5, 'int': 7, 'text': 10, 'angle': 8, 'color': 9}

def lit(v):
    if isinstance(v, bool): return 'true' if v else 'false'
    if isinstance(v, float) and v.is_integer(): v = int(v)
    if isinstance(v, float): return repr(round(v, 4))
    return str(v)

def slug(s): return re.sub(r'[^A-Za-z0-9]', '_', s)

class Compiler:
    def __init__(s, prefix, local_vars, global_vars, broadcasts, procs):
        s.p, s.n = prefix, 0
        s.blocks, s.comments = {}, {}
        s.lv, s.gv, s.bc, s.procs = local_vars, global_vars, broadcasts, procs
        s.count = 0

    def nid(s):
        s.n += 1
        return f'{s.p}{s.n}'

    def varref(s, name):
        if name in s.lv: return [name, s.lv[name]]
        if name in s.gv: return [name, s.gv[name]]
        raise KeyError(f'unknown variable {name} in {s.p}')

    def bcref(s, name):
        if name not in s.bc: s.bc[name] = 'bc_' + slug(name)
        return s.bc[name]

    def add(s, opcode, parent, inputs=None, fields=None, shadow=False, top=False, mutation=None):
        bid = s.nid()
        b = {'opcode': opcode, 'next': None, 'parent': parent, 'inputs': inputs or {},
             'fields': fields or {}, 'shadow': shadow, 'topLevel': top}
        if mutation: b['mutation'] = mutation
        s.blocks[bid] = b
        s.count += 1
        return bid

    def fields(s, f):
        out = {}
        for k, v in f.items():
            if isinstance(v, tuple) and v[0] == 'VAR':
                out[k] = s.varref(v[1])
            else:
                out[k] = v
        return out

    def inp(s, val, kind, parent):
        if kind == 'stack':
            first = s.stmts(val, parent)
            return [2, first] if first else None
        if kind == 'bool':
            return [2, s.expr(val, parent)]
        if kind == 'broadcast':
            return [1, [11, val, s.bcref(val)]]
        if kind.startswith('menu:'):
            _, opc, field = kind.split(':')
            if isinstance(val, Expr):
                sid = s.add(opc, parent, fields={field: ['', None]}, shadow=True)
                bid = s.expr(val, parent)
                return [3, bid, sid]
            sid = s.add(opc, parent, fields={field: [lit(val), None]}, shadow=True)
            return [1, sid]
        prim = PRIM[kind]
        default = '#000000' if kind == 'color' else ''
        if isinstance(val, Var):
            return [3, [12] + s.varref(val.name), [prim, default]]
        if isinstance(val, Expr):
            return [3, s.expr(val, parent), [prim, default]]
        return [1, [prim, lit(val)]]

    def expr(s, e, parent):
        if isinstance(e, Var):
            # a bare variable used as a boolean slot: compare against 1
            return s.expr(eq(e, 1), parent)
        if isinstance(e, Arg):
            return s.add('argument_reporter_string_number', parent, fields={'VALUE': [e.name, None]})
        bid = s.add(e.opcode, parent, fields=s.fields(e.fields))
        s.blocks[bid]['inputs'] = {k: s.inp(v, kd, bid) for k, (v, kd) in e.inputs.items()}
        return bid

    def stmt(s, st, parent):
        if st.opcode == 'procedures_call':
            proc = st.mutation['proc']
            argnames, warp = s.procs[proc]
            ids = [f'{slug(proc)}__{slug(a)}' for a in argnames]
            assert len(st.mutation['args']) == len(argnames), proc
            mut = {'tagName': 'mutation', 'children': [], 'proccode': proccode(proc, argnames),
                   'argumentids': json.dumps(ids), 'warp': 'true' if warp else 'false'}
            bid = s.add('procedures_call', parent, mutation=mut)
            s.blocks[bid]['inputs'] = {i: s.inp(v, 'text', bid) for i, v in zip(ids, st.mutation['args'])}
            return bid
        bid = s.add(st.opcode, parent, fields=s.fields(st.fields), mutation=st.mutation)
        ins = {}
        for k, (v, kd) in st.inputs.items():
            r = s.inp(v, kd, bid)
            if r is not None: ins[k] = r
        s.blocks[bid]['inputs'] = ins
        return bid

    def stmts(s, lst, parent):
        first = prev = None
        for st in lst:
            if st is None: continue
            bid = s.stmt(st, prev or parent)
            if prev: s.blocks[prev]['next'] = bid
            else: first = bid
            prev = bid
        return first

    def script(s, sc, x, y):
        h = sc.hat
        if h[0] == 'flag':
            hid = s.add('event_whenflagclicked', None, top=True)
        elif h[0] == 'receive':
            hid = s.add('event_whenbroadcastreceived', None, top=True,
                        fields={'BROADCAST_OPTION': [h[1], s.bcref(h[1])]})
        elif h[0] == 'clone':
            hid = s.add('control_start_as_clone', None, top=True)
        elif h[0] == 'define':
            _, name, args, warp = h
            hid = s.add('procedures_definition', None, top=True)
            ids = [f'{slug(name)}__{slug(a)}' for a in args]
            mut = {'tagName': 'mutation', 'children': [], 'proccode': proccode(name, args),
                   'argumentids': json.dumps(ids), 'argumentnames': json.dumps(args),
                   'argumentdefaults': json.dumps([''] * len(args)), 'warp': 'true' if warp else 'false'}
            pid = s.add('procedures_prototype', hid, shadow=True, mutation=mut)
            pins = {}
            for i, a in zip(ids, args):
                rid = s.add('argument_reporter_string_number', pid, fields={'VALUE': [a, None]}, shadow=True)
                pins[i] = [1, rid]
            s.blocks[pid]['inputs'] = pins
            s.blocks[hid]['inputs'] = {'custom_block': [1, pid]}
        s.blocks[hid]['x'], s.blocks[hid]['y'] = x, y
        before = s.count
        first = s.stmts(sc.body, hid)
        s.blocks[hid]['next'] = first
        if sc.comment:
            cid = f'{s.p}c{len(s.comments)}'
            lines = max(2, len(sc.comment) // 38 + sc.comment.count('\n') + 1)
            s.comments[cid] = {'blockId': hid, 'x': x + 640, 'y': y, 'width': 320,
                               'height': 30 + lines * 18, 'minimized': False, 'text': sc.comment}
            s.blocks[hid]['comment'] = cid
        return s.count - before

def script_height(stmts):
    """rough on-screen height (px) of a stack in the Scratch editor"""
    h = 0
    for st in stmts:
        if st is None: continue
        h += 48
        for k, (v, kind) in st.inputs.items():
            if kind == 'stack':
                h += script_height(v) + 24
    return h

def proccode(name, args):
    return name + ''.join(' %s' for _ in args)

# ---------------------------------------------------------------- assets / project
class Asset:
    def __init__(s, name, data, ext, **kw):
        s.name, s.data, s.ext, s.kw = name, data, ext, kw
        s.md5 = hashlib.md5(data).hexdigest()

def svg_costume(name, svg_text, cx, cy):
    return Asset(name, svg_text.encode(), 'svg', cx=cx, cy=cy)

def wav_sound(name, data, rate, count):
    return Asset(name, data, 'wav', rate=rate, count=count)

class Target:
    def __init__(s, name, is_stage=False, x=0, y=0, size=100, visible=False, rot='all around', layer=1):
        s.name, s.is_stage = name, is_stage
        s.x, s.y, s.size, s.visible, s.rot, s.layer = x, y, size, visible, rot, layer
        s.vars = {}      # name -> initial
        s.costumes, s.sounds, s.scripts = [], [], []
        s.procs = {}     # name -> (args, warp)

    def var(s, name, init=0): s.vars[name] = init
    def add(s, *scripts):
        for sc in scripts:
            if sc.hat[0] == 'define':
                s.procs[sc.hat[1]] = (sc.hat[2], sc.hat[3])
            s.scripts.append(sc)

def build(stage, sprites, path, extensions=('pen',)):
    gv = {n: 'gv_' + slug(n) for n in stage.vars}
    broadcasts = {}
    targets, assets = [], []
    for t in [stage] + sprites:
        lv = {} if t.is_stage else {n: f'lv_{slug(t.name)}_{slug(n)}' for n in t.vars}
        comp = Compiler(slug(t.name)[:6] + '_', lv if not t.is_stage else {}, gv, broadcasts, t.procs)
        for i, sc in enumerate(t.scripts):
            comp.script(sc, i * 1000, 0)
        d = {
            'isStage': t.is_stage, 'name': t.name,
            'variables': ({gv[n]: [n, v] for n, v in t.vars.items()} if t.is_stage
                          else {lv[n]: [n, v] for n, v in t.vars.items()}),
            'lists': {}, 'broadcasts': {}, 'blocks': comp.blocks, 'comments': comp.comments,
            'currentCostume': 0,
            'costumes': [{'name': c.name, 'bitmapResolution': 1, 'dataFormat': c.ext, 'assetId': c.md5,
                          'md5ext': f'{c.md5}.{c.ext}', 'rotationCenterX': c.kw['cx'],
                          'rotationCenterY': c.kw['cy']} for c in t.costumes],
            'sounds': [{'name': a.name, 'assetId': a.md5, 'dataFormat': a.ext, 'format': '',
                        'rate': a.kw['rate'], 'sampleCount': a.kw['count'], 'md5ext': f'{a.md5}.{a.ext}'}
                       for a in t.sounds],
            'volume': 100, 'layerOrder': 0 if t.is_stage else t.layer,
        }
        if t.is_stage:
            d.update({'tempo': 60, 'videoTransparency': 50, 'videoState': 'on', 'textToSpeechLanguage': None})
        else:
            d.update({'visible': t.visible, 'x': t.x, 'y': t.y, 'size': t.size, 'direction': 90,
                      'draggable': False, 'rotationStyle': t.rot})
        targets.append(d)
        assets += t.costumes + t.sounds
    targets[0]['broadcasts'] = {v: k for k, v in broadcasts.items()}
    proj = {'targets': targets, 'monitors': [], 'extensions': list(extensions),
            'meta': {'semver': '3.0.0', 'vm': '0.2.0', 'agent': 'Emberfall generator'}}
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('project.json', json.dumps(proj))
        seen = set()
        for a in assets:
            fn = f'{a.md5}.{a.ext}'
            if fn not in seen:
                z.writestr(fn, a.data); seen.add(fn)
    return proj
