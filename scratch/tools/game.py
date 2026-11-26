import os
from sb3gen import *
import art, sounds

GY = -120  # ground line (feet)
V = Var

def is_(v, val): return eq(V(v), val)
def sign_to(var, expr):  # var = 1 if expr > 0 else -1
    return if_else(gt(expr, 0), [set_(var, 1)], [set_(var, -1)])

def add_costumes(t, d):
    for name, (s, cx, cy) in d.items():
        t.costumes.append(svg_costume(name, s, cx, cy))

_snd = {k: f() for k, f in sounds.ALL.items()}
def add_sounds(t, *names):
    for n in names:
        data, cnt = _snd[n]
        t.sounds.append(wav_sound(n, data, sounds.R, cnt))

# ============================================================== STAGE
stage = Target('Stage', is_stage=True)
for n, v in dict(gameState='title', area=1, px=-120, py=0, vy=0, pDir=1, pState='idle', pFrame=0, hp=100,
                 stamina=100, stamDelay=0, estus=3, souls=0, dmgIn=0, dmgDir=1, invuln=0, atkActive=0, atkID=0,
                 atkX=0, atkY=0, atkRange=0, atkDmg=0, atkHeavy=0, bossHP=280, bossActive=0, bossDead=0,
                 stainSouls=0, stainArea=1, stainX=0, bannerCostume='gate', bannerHold=1, nearFire=0,
                 visited2=0, waveX=0).items():
    stage.var(n, v)
for name, fn in [('title', art.title_bg), ('area1', art.area1), ('area2', art.area2), ('area3', art.area3)]:
    stage.costumes.append(svg_costume(name, fn(), 240, 180))
add_sounds(stage, 'ambient', 'boss_theme', 'toll', 'kindle', 'victory')

stage.add(
    when_flag(
        set_('gameState', 'title'), backdrop('title'),
        set_('hp', 100), set_('stamina', 100), set_('estus', 3), set_('bossActive', 0), set_('nearFire', 0),
        broadcast('title'),
        wait(0.4),
        wait_until(key('space')),
        set_('souls', 0), set_('stainSouls', 0), set_('bossDead', 0), set_('visited2', 0),
        broadcast('respawn'),
        comment='EMBERFALL - a souls-like made in Scratch.\n\nThe Stage is the "game director": it owns the '
                'global variables and decides what happens when you die, rest or enter the boss arena. '
                'Every sprite runs its own forever loop and only acts while gameState = play.'),
    when_receive('respawn',
        set_('hp', 100), set_('stamina', 100), set_('stamDelay', 0), set_('estus', 3), set_('area', 1),
        set_('px', -120), set_('py', 0), set_('vy', 0), set_('pDir', 1), set_('pState', 'idle'), set_('pFrame', 0),
        set_('dmgIn', 0), set_('invuln', 30), set_('atkActive', 0), set_('bossActive', 0), set_('bossHP', 280),
        backdrop('area1'),
        broadcast_wait('reset world'),
        set_('gameState', 'play'),
        set_('bannerCostume', 'gate'), set_('bannerHold', 1.5), broadcast('banner'),
        comment='Respawning always sends you back to the bonfire with full health and flasks. '
                '"reset world" tells every enemy to come back to life - just like resting.'),
    when_receive('areaChanged',
        backdrop(join('area', V('area'))),
        if_(AND(is_('area', 2), is_('visited2', 0)),
            set_('visited2', 1), set_('bannerCostume', 'hall'), set_('bannerHold', 1.5), broadcast('banner')),
        if_(AND(is_('area', 3), is_('bossDead', 0), is_('bossActive', 0)),
            set_('bossActive', 1), stop_sounds(),
            set_('bannerCostume', 'boss'), set_('bannerHold', 2.5), broadcast('banner'), broadcast('bossWake')),
        comment='Walking off the edge of the screen changes area. Area 3 is the boss arena: '
                'entering it locks the fog gate behind you.'),
    when_receive('playerDied',
        set_('gameState', 'dead'), stop_sounds(),
        set_('stainSouls', V('souls')), set_('stainArea', V('area')), set_('stainX', V('px')), set_('souls', 0),
        play('toll'), wait(0.8),
        set_('bannerCostume', 'youdied'), set_('bannerHold', 2.6), broadcast('banner'),
        wait(4.6),
        broadcast('respawn'),
        comment='The classic souls rule: when you die, ALL your souls are left in a bloodstain where you fell. '
                'Get back there without dying again, or they are gone forever.'),
    when_receive('rest',
        set_('hp', 100), set_('estus', 3), set_('stamina', 100), play('kindle'),
        set_('bannerCostume', 'rested'), set_('bannerHold', 1.8), broadcast('banner'),
        broadcast('reset world')),
    when_receive('bossDied',
        set_('bossActive', 0), set_('bossDead', 1), stop_sounds(), change('souls', 2000), play('victory'),
        wait(1.2), set_('bannerCostume', 'felled'), set_('bannerHold', 5), broadcast('banner')),
    when_flag(
        forever(if_else(is_('gameState', 'play'),
                        [if_else(is_('bossActive', 1), [play_wait('boss_theme')],
                                 [if_else(is_('bossDead', 1), [wait(0.5)], [play_wait('ambient')])])],
                        [wait(0.1)])),
        comment='Music: a dark ambient drone, swapped for drums when the boss is awake.'),
)

# ============================================================== KNIGHT (player)
P = Target('Knight', x=-120, y=GY, rot='left-right', layer=6, size=115)
add_costumes(P, art.knight_costumes())
add_sounds(P, 'swing', 'heavy', 'roll', 'hurt', 'heal')
for v in ['zWas', 'xWas', 'cWas', 'spWas', 'upWas', 'bufT', 'kb', 'walkT', 'idleT']:
    P.var(v, 0)
P.var('buf', '')

def press(k, was, action):
    return if_else(key(k), [if_(is_(was, 0), set_('buf', action), set_('bufT', 8)), set_(was, 1)], [set_(was, 0)])

free = lambda: OR(is_('pState', 'idle'), is_('pState', 'walk'))

P.add(
    when_flag(
        rot_style('left-right'), hide(),
        forever(if_else(is_('gameState', 'play'), [call('tick')],
                        [if_(is_('gameState', 'title'), hide())])),
        comment='The player runs one "tick" every frame (30 times a second). Each step is its own custom '
                'block so you can read them one at a time.'),
    define('tick', [], show(), call('take damage'), call('read input'), call('do action'), call('physics'),
           call('animate')),
    define('take damage', [],
        if_(gt(V('invuln'), 0), change('invuln', -1)),
        if_(gt(V('dmgIn'), 0),
            if_(NOT(OR(AND(is_('pState', 'roll'), lt(V('pFrame'), 13)), gt(V('invuln'), 0), is_('pState', 'dead'))),
                change('hp', 0 - V('dmgIn')), set_('invuln', 30), set_('atkActive', 0), play('hurt'),
                set_('kb', V('dmgDir') * 5),
                if_else(lt(V('hp'), 1),
                        [set_('hp', 0), set_('pState', 'dead'), set_('pFrame', 0), set_effect('GHOST', 0),
                         costume('dead'), broadcast('playerDied')],
                        [set_('pState', 'hurt'), set_('pFrame', 0)])),
            set_('dmgIn', 0)),
        comment='Enemies never touch your health directly - they add to dmgIn. Here we decide if it lands. '
                'The first 12 frames of a roll are "i-frames": damage is simply ignored.'),
    define('read input', [],
        press('z', 'zWas', 'light'), press('x', 'xWas', 'heavy'), press('space', 'spWas', 'roll'),
        press('c', 'cWas', 'heal'), press('up arrow', 'upWas', 'jump'),
        if_else(gt(V('bufT'), 0), [change('bufT', -1)], [set_('buf', '')]),
        if_(free(),
            set_('pState', 'idle'),
            if_(key('right arrow'), set_('pDir', 1), change('px', 3.2), set_('pState', 'walk')),
            if_(key('left arrow'), set_('pDir', -1), change('px', -3.2), set_('pState', 'walk')),
            if_(NOT(is_('buf', '')), call('start action')),
            if_else(gt(V('stamDelay'), 0), [change('stamDelay', -1)], [change('stamina', 1.8)]),
            if_(gt(V('stamina'), 100), set_('stamina', 100))),
        comment='Input buffering: a key press is remembered for 8 frames, so pressing attack slightly '
                'early still works. This is a big part of why the controls feel good.'),
    define('start action', [],
        if_(AND(is_('buf', 'roll'), gt(V('stamina'), 0)),
            set_('pState', 'roll'), set_('pFrame', 0), change('stamina', -20), set_('stamDelay', 30),
            play('roll'), set_('buf', ''),
            if_(key('right arrow'), set_('pDir', 1)), if_(key('left arrow'), set_('pDir', -1))),
        if_(AND(is_('buf', 'light'), gt(V('stamina'), 0)),
            set_('pState', 'light'), set_('pFrame', 0), change('stamina', -14), set_('stamDelay', 30), set_('buf', '')),
        if_(AND(is_('buf', 'heavy'), gt(V('stamina'), 0)),
            set_('pState', 'heavy'), set_('pFrame', 0), change('stamina', -26), set_('stamDelay', 35), set_('buf', '')),
        if_(is_('buf', 'heal'),
            if_(gt(V('estus'), 0), set_('pState', 'heal'), set_('pFrame', 0), change('estus', -1)),
            set_('buf', '')),
        if_(is_('buf', 'jump'),
            if_(AND(is_('py', 0), gt(V('stamina'), 0)),
                set_('vy', 11), change('stamina', -10), set_('stamDelay', 20)),
            set_('buf', '')),
        if_(lt(V('stamina'), 0), set_('stamina', 0)),
        comment='Every action costs stamina. If you have none left, the action waits in the buffer.'),
    define('do action', [],
        change('pFrame', 1),
        if_(is_('pState', 'light'),
            if_(lt(V('pFrame'), 8), change('px', V('pDir') * 1)),
            if_(is_('pFrame', 5),
                play('swing'), change('atkID', 1), set_('atkX', V('px') + V('pDir') * 36), set_('atkRange', 30),
                set_('atkDmg', 12), set_('atkHeavy', 0), set_('atkY', V('py')), set_('atkActive', 1)),
            if_(is_('pFrame', 9), set_('atkActive', 0)),
            if_(gt(V('pFrame'), 17), set_('pState', 'idle'))),
        if_(is_('pState', 'heavy'),
            if_(AND(gt(V('pFrame'), 11), lt(V('pFrame'), 18)), change('px', V('pDir') * 2.5)),
            if_(is_('pFrame', 14),
                play('heavy'), change('atkID', 1), set_('atkX', V('px') + V('pDir') * 42), set_('atkRange', 38),
                set_('atkDmg', 28), set_('atkHeavy', 1), set_('atkY', V('py')), set_('atkActive', 1)),
            if_(is_('pFrame', 19), set_('atkActive', 0)),
            if_(gt(V('pFrame'), 33), set_('pState', 'idle'))),
        if_(is_('pState', 'roll'),
            if_(lt(V('pFrame'), 15), change('px', V('pDir') * 6.5)),
            if_(gt(V('pFrame'), 19), set_('pState', 'idle'))),
        if_(is_('pState', 'heal'),
            if_(is_('pFrame', 20), change('hp', 45), play('heal'), if_(gt(V('hp'), 100), set_('hp', 100))),
            if_(gt(V('pFrame'), 36), set_('pState', 'idle'))),
        if_(is_('pState', 'hurt'),
            change('px', V('kb')), set_('kb', V('kb') * 0.8),
            if_(gt(V('pFrame'), 14), set_('pState', 'idle'))),
        comment='Attacks have three phases: wind-up, active and recovery. The hitbox only exists during '
                'the active frames. Heavy attacks are slower but stagger enemies.'),
    define('physics', [],
        if_(OR(gt(V('py'), 0), gt(V('vy'), 0)),
            change('vy', -0.8), change('py', V('vy')),
            if_(lt(V('py'), 0), set_('py', 0), set_('vy', 0))),
        if_(gt(V('px'), 228),
            if_else(lt(V('area'), 3), [change('area', 1), set_('px', -222), broadcast('areaChanged')],
                    [set_('px', 228)])),
        if_(lt(V('px'), -228),
            if_else(AND(gt(V('area'), 1), is_('bossActive', 0)),
                    [change('area', -1), set_('px', 222), broadcast('areaChanged')], [set_('px', -228)]))),
    define('animate', [],
        goto_xy(V('px'), V('py') + GY), point(V('pDir') * 90),
        if_(free(),
            if_else(gt(V('py'), 0), [costume('jump')],
                    [if_else(is_('pState', 'walk'),
                             [change('walkT', 1), costume(join('walk', floor_(V('walkT') / 5) % 4 + 1))],
                             [change('idleT', 1), costume(join('idle', floor_(V('idleT') / 20) % 2 + 1))])])),
        if_(is_('pState', 'light'),
            if_else(lt(V('pFrame'), 5), [costume('windup')],
                    [if_else(lt(V('pFrame'), 11), [costume('slash')], [costume('recover')])])),
        if_(is_('pState', 'heavy'),
            if_else(lt(V('pFrame'), 14), [costume('heavyup')],
                    [if_else(lt(V('pFrame'), 24), [costume('heavyslash')], [costume('recover')])])),
        if_(is_('pState', 'roll'),
            if_else(lt(V('pFrame'), 16), [costume(join('roll', floor_(V('pFrame') / 4) % 4 + 1))], [costume('idle1')])),
        if_(is_('pState', 'heal'), costume('drink')),
        if_(is_('pState', 'hurt'), costume('hurt')),
        if_else(AND(gt(V('invuln'), 0), NOT(is_('pState', 'roll'))),
                [if_else(lt(V('invuln') % 6, 3), [set_effect('GHOST', 60)], [set_effect('GHOST', 0)])],
                [set_effect('GHOST', 0)])),
)
# rename idle -> idle1 for the costume cycle
for c in P.costumes:
    if c.name == 'idle': c.name = 'idle1'

# ============================================================== SKELETONS (clones)
SK = Target('Skeleton', rot='left-right', layer=4, size=115)
add_costumes(SK, art.skeleton_costumes())
add_sounds(SK, 'hit', 'bones', 'swing')
for v in ['sx', 'sHome', 'sArea', 'sHP', 'sFrame', 'sDir', 'sLast', 'isClone', 'sAlive', 'sKb', 'sFlash',
          'dist', 'adist', 'sWalk']:
    SK.var(v, 0)
SK.var('sState', 'idle')

SK.add(
    when_flag(
        hide(), rot_style('left-right'), set_('isClone', 1),
        set_('sHome', 110), set_('sArea', 1), clone(),
        set_('sHome', -30), set_('sArea', 2), clone(),
        set_('sHome', 150), set_('sArea', 2), clone(),
        set_('isClone', 0),
        comment='One sprite, three skeletons: each clone gets its own copy of the "for this sprite only" '
                'variables (sx, sHP, sState...). That is how every skeleton can think independently.'),
    when_clone(
        call('reset me'),
        forever(if_else(AND(is_('sArea', V('area')), is_('sAlive', 1), NOT(is_('gameState', 'title'))),
                        [show(), if_(is_('gameState', 'play'), call('think'))], [hide()]))),
    when_receive('reset world', if_(is_('isClone', 1), call('reset me'))),
    define('reset me', [],
        set_('sHP', 40), set_('sAlive', 1), set_('sx', V('sHome')), set_('sState', 'idle'), set_('sFrame', 0),
        set_('sLast', V('atkID')), set_('sKb', 0), set_('sFlash', 0), set_('sDir', -1), clear_effects(),
        costume('s_idle'), goto_xy(V('sx'), GY)),
    define('think', [],
        change('sFrame', 1),
        set_('dist', V('px') - V('sx')), set_('adist', abs_(V('dist'))),
        if_(AND(is_('atkActive', 1), NOT(is_('sLast', V('atkID'))), lt(abs_(V('sx') - V('atkX')), V('atkRange') + 14),
                lt(V('atkY'), 45), NOT(is_('sState', 'dying'))),
            set_('sLast', V('atkID')), change('sHP', 0 - V('atkDmg')), play('hit'),
            set_effect('BRIGHTNESS', 70), set_('sFlash', 4),
            if_else(gt(V('dist'), 0), [set_('sKb', -3)], [set_('sKb', 3)]),
            if_(is_('atkHeavy', 1), set_('sKb', V('sKb') * 2.2)),
            if_else(lt(V('sHP'), 1),
                    [set_('sState', 'dying'), set_('sFrame', 0), change('souls', 50), play('bones')],
                    [if_(is_('atkHeavy', 1), set_('sState', 'stagger'), set_('sFrame', 0))])),
        if_(gt(V('sFlash'), 0), change('sFlash', -1), if_(is_('sFlash', 0), set_effect('BRIGHTNESS', 0))),
        change('sx', V('sKb')), set_('sKb', V('sKb') * 0.75),
        if_(is_('sState', 'idle'), costume('s_idle'), if_(lt(V('adist'), 170), set_('sState', 'chase'))),
        if_(is_('sState', 'chase'),
            sign_to('sDir', V('dist')),
            if_else(gt(V('adist'), 46),
                    [change('sx', V('sDir') * 1.7), change('sWalk', 1),
                     costume(join('s_walk', floor_(V('sWalk') / 8) % 2 + 1))],
                    [set_('sState', 'windup'), set_('sFrame', 0)])),
        if_(is_('sState', 'windup'), costume('s_raise'),
            if_(gt(V('sFrame'), 20), set_('sState', 'strike'), set_('sFrame', 0), play('swing'))),
        if_(is_('sState', 'strike'),
            if_else(lt(V('sFrame'), 5), [costume('s_strike')], [costume('s_recover')]),
            if_(is_('sFrame', 2),
                if_(AND(lt(abs_(V('px') - (V('sx') + V('sDir') * 30)), 32), lt(V('py'), 40)),
                    change('dmgIn', 16), set_('dmgDir', V('sDir')))),
            if_(gt(V('sFrame'), 22), set_('sState', 'chase'))),
        if_(is_('sState', 'stagger'), costume('s_hurt'), if_(gt(V('sFrame'), 22), set_('sState', 'chase'))),
        if_(is_('sState', 'dying'), costume('s_dead'), change_effect('GHOST', 4),
            if_(gt(V('sFrame'), 25), set_('sAlive', 0), hide(), clear_effects())),
        if_(gt(V('sx'), 225), set_('sx', 225)), if_(lt(V('sx'), -225), set_('sx', -225)),
        goto_xy(V('sx'), GY), point(V('sDir') * 90),
        comment='A "state machine": the skeleton is always in exactly one state (idle, chase, windup, strike, '
                'stagger, dying) and each state decides what happens next. The long wind-up is the '
                'warning - it gives you time to roll.'),
)

# ============================================================== BOSS
BO = Target('Warden', x=150, y=GY, rot='left-right', layer=5)
add_costumes(BO, art.boss_costumes())
add_sounds(BO, 'hit', 'slam', 'roar', 'heavy')
for v in ['bx', 'bFrame', 'bDir', 'bLast', 'bPhase', 'bFlash', 'bDashHit', 'bVisible', 'dist', 'adist', 'bWalk',
          'wMul', 'wUp', 'bPick']:
    BO.var(v, 0)
BO.var('bState', 'stalk')

BO.add(
    when_flag(hide(), rot_style('left-right'), set_('bVisible', 0),
        forever(if_else(AND(is_('area', 3), is_('bVisible', 1), NOT(is_('gameState', 'title'))),
                        [show(),
                         if_(AND(is_('gameState', 'play'), OR(is_('bossActive', 1), is_('bState', 'dying'))),
                             call('boss think')),
                         goto_xy(V('bx'), GY), point(V('bDir') * 90)],
                        [hide()])),
        comment='THE HOLLOW WARDEN. Three attacks: a slow overhead SLAM (roll through it), a low SWEEP '
                '(jump over it) and a CHARGE from range. Below half health he enters phase 2: faster, '
                'and his slam sends out fire waves.'),
    when_receive('reset world',
        if_else(is_('bossDead', 0),
                [set_('bx', 150), set_('bState', 'stalk'), set_('bFrame', 0), set_('bDir', -1),
                 set_('bLast', V('atkID')), set_('bPhase', 1), set_('bVisible', 1), set_('bFlash', 0),
                 clear_effects(), costume('b_idle'), set_('bossHP', 280)],
                [set_('bVisible', 0)])),
    when_receive('bossWake', set_('bState', 'roar'), set_('bFrame', 0), set_('bDir', -1)),
    define('boss think', [],
        change('bFrame', 1),
        set_('dist', V('px') - V('bx')), set_('adist', abs_(V('dist'))),
        if_else(is_('bPhase', 2), [set_('wMul', 0.7)], [set_('wMul', 1)]),
        if_(AND(is_('atkActive', 1), NOT(is_('bLast', V('atkID'))), lt(abs_(V('bx') - V('atkX')), V('atkRange') + 30),
                lt(V('atkY'), 90), NOT(is_('bState', 'dying'))),
            set_('bLast', V('atkID')), change('bossHP', 0 - V('atkDmg')), play('hit'),
            set_effect('BRIGHTNESS', 50), set_('bFlash', 4),
            if_else(lt(V('bossHP'), 1),
                    [set_('bossHP', 0), set_('bState', 'dying'), set_('bFrame', 0), play('roar'), broadcast('bossDied')],
                    [if_(AND(is_('bPhase', 1), lt(V('bossHP'), 141)),
                         set_('bPhase', 2), set_('bState', 'roar'), set_('bFrame', 0),
                         set_('bannerCostume', 'phase2'), set_('bannerHold', 1.2), broadcast('banner'))])),
        if_(gt(V('bFlash'), 0), change('bFlash', -1), if_(is_('bFlash', 0), set_effect('BRIGHTNESS', 0))),
        call('stalk'), call('slam'), call('sweep'), call('charge'),
        if_(is_('bState', 'roar'), costume('b_roar'),
            if_(is_('bFrame', 2), play('roar')),
            if_(gt(V('bFrame'), 55), set_('bState', 'stalk'), set_('bFrame', 0))),
        if_(is_('bState', 'dying'), costume('b_dead'), change_effect('GHOST', 1.5),
            if_(gt(V('bFrame'), 80), set_('bVisible', 0), hide(), clear_effects())),
        if_(gt(V('bx'), 210), set_('bx', 210)), if_(lt(V('bx'), -210), set_('bx', -210))),
    define('stalk', [],
        if_(is_('bState', 'stalk'),
            sign_to('bDir', V('dist')),
            if_else(gt(V('adist'), 90),
                    [change('bx', V('bDir') * (0.9 + V('bPhase') * 0.5)), change('bWalk', 1),
                     costume(join('b_walk', floor_(V('bWalk') / 10) % 2 + 1))],
                    [costume('b_idle')]),
            if_(gt(V('bFrame'), 40 - V('bPhase') * 12),
                if_else(lt(V('adist'), 125),
                        [set_('bPick', rand(1, 2)), set_('bFrame', 0),
                         if_else(is_('bPick', 1), [set_('bState', 'slam')], [set_('bState', 'sweep')])],
                        [if_(AND(gt(V('adist'), 170), OR(eq(rand(1, 40), 1), gt(V('bFrame'), 110))),
                             set_('bState', 'charge'), set_('bFrame', 0), set_('bDashHit', 0))]))),
        comment='Between attacks the Warden walks towards you. When you are close he picks slam or sweep at random; '
                'if you keep your distance he will charge.'),
    define('slam', [],
        if_(is_('bState', 'slam'),
            set_('wUp', round_(V('wMul') * 32)),
            if_else(lt(V('bFrame'), V('wUp')), [costume('b_raise')], [costume('b_slam')]),
            if_(is_('bFrame', V('wUp')),
                play('slam'),
                if_(AND(gt((V('px') - V('bx')) * V('bDir'), -10), lt((V('px') - V('bx')) * V('bDir'), 125), lt(V('py'), 70)),
                    change('dmgIn', 34), set_('dmgDir', V('bDir'))),
                if_(is_('bPhase', 2), set_('waveX', V('bx') + V('bDir') * 95), broadcast('quake'))),
            if_(gt(V('bFrame'), V('wUp') + 34), set_('bState', 'stalk'), set_('bFrame', 0)))),
    define('sweep', [],
        if_(is_('bState', 'sweep'),
            set_('wUp', round_(V('wMul') * 22)),
            if_else(lt(V('bFrame'), V('wUp')), [costume('b_sweepup')],
                    [if_else(lt(V('bFrame'), V('wUp') + 12), [costume('b_sweep')], [costume('b_idle')])]),
            if_(is_('bFrame', V('wUp') + 2),
                play('heavy'),
                if_(AND(lt(abs_(V('px') - (V('bx') + V('bDir') * 55)), 80), lt(V('py'), 22)),
                    change('dmgIn', 24), set_('dmgDir', V('bDir')))),
            if_(gt(V('bFrame'), V('wUp') + 26), set_('bState', 'stalk'), set_('bFrame', 0)))),
    define('charge', [],
        if_(is_('bState', 'charge'),
            set_('wUp', round_(V('wMul') * 28)),
            if_else(lt(V('bFrame'), V('wUp')), [costume('b_crouch')],
                    [if_(is_('bFrame', V('wUp')), play('heavy')),
                     if_else(lt(V('bFrame'), V('wUp') + 36),
                             [costume('b_charge'), change('bx', V('bDir') * (8 + V('bPhase'))),
                              if_(AND(is_('bDashHit', 0), lt(abs_(V('px') - V('bx')), 40), lt(V('py'), 60)),
                                  change('dmgIn', 28), set_('dmgDir', V('bDir')), set_('bDashHit', 1)),
                              if_(gt(abs_(V('bx')), 205), set_('bFrame', V('wUp') + 36))],
                             [costume('b_idle')])]),
            if_(gt(V('bFrame'), V('wUp') + 60), set_('bState', 'stalk'), set_('bFrame', 0)))),
)

# ============================================================== SHOCKWAVE
SW = Target('Fire Wave', rot='left-right', layer=7)
add_costumes(SW, art.shockwave_costumes())
for v in ['swX', 'swDir', 'swLife', 'isClone']:
    SW.var(v, 0)
SW.add(
    when_flag(hide(), set_('isClone', 0)),
    when_receive('quake',
        if_(is_('isClone', 0),
            set_('isClone', 1), set_('swX', V('waveX')),
            set_('swDir', 1), clone(), set_('swDir', -1), clone(), set_('isClone', 0))),
    when_clone(
        set_('swLife', 0), goto_xy(V('swX'), GY), show(),
        repeat_until(OR(gt(abs_(V('swX')), 245), NOT(is_('gameState', 'play'))),
            change('swX', V('swDir') * 5.5), goto_xy(V('swX'), GY),
            costume(join('wave', floor_(V('swLife') / 3) % 2 + 1)), change('swLife', 1),
            if_(AND(lt(abs_(V('px') - V('swX')), 16), lt(V('py'), 26)),
                change('dmgIn', 18), set_('dmgDir', V('swDir')), delete_clone())),
        delete_clone(),
        comment='Phase 2 fire waves travel along the floor. Jump over them or roll through them.'),
)

# ============================================================== BONFIRE
BF = Target('Bonfire', x=-175, y=GY, layer=2)
add_costumes(BF, art.bonfire_costumes())
BF.var('fT', 0)
BF.add(when_flag(
    hide(), goto_xy(-175, GY),
    forever(if_else(AND(is_('area', 1), NOT(is_('gameState', 'title'))),
                    [show(), change('fT', 1), costume(join('fire', floor_(V('fT') / 4) % 3 + 1)),
                     if_else(AND(is_('gameState', 'play'), lt(abs_(V('px') + 175), 34), is_('py', 0), free()),
                             [set_('nearFire', 1),
                              if_(key('down arrow'), broadcast('rest'), wait_until(NOT(key('down arrow'))))],
                             [set_('nearFire', 0)])],
                    [hide(), set_('nearFire', 0)])),
    comment='Resting at the bonfire refills health and flasks... but every enemy comes back.'))

# ============================================================== FOG GATE
FG = Target('Fog Gate', layer=8)
add_costumes(FG, art.fog_costumes())
FG.var('fogT', 0)
FG.add(when_flag(
    hide(),
    forever(
        change('fogT', 1), costume(join('fog', floor_(V('fogT') / 12) % 2 + 1)),
        if_else(AND(is_('area', 2), is_('bossDead', 0), NOT(is_('gameState', 'title'))),
                [goto_xy(232, GY), show()],
                [if_else(AND(is_('area', 3), is_('bossActive', 1)), [goto_xy(-236, GY), show()], [hide()])]))))

# ============================================================== BLOODSTAIN
BS = Target('Bloodstain', layer=3)
add_costumes(BS, art.stain_costumes())
add_sounds(BS, 'souls')
BS.var('stT', 0)
BS.add(when_flag(
    hide(),
    forever(if_else(AND(is_('gameState', 'play'), gt(V('stainSouls'), 0), is_('area', V('stainArea'))),
                    [goto_xy(V('stainX'), GY), show(), change('stT', 1),
                     set_effect('GHOST', abs_(V('stT') % 40 - 20) * 2),
                     if_(AND(lt(abs_(V('px') - V('stainX')), 20), lt(V('py'), 20)),
                         change('souls', V('stainSouls')), set_('stainSouls', 0), play('souls'))],
                    [hide()])),
    comment='Your lost souls glow green where you died. Touch it to get them back.'))

# ============================================================== BANNER + TITLE PROMPT
BN = Target('Banner', layer=9)
add_costumes(BN, {k: v for k, v in art.banner_costumes().items() if k != 'press'})
BN.add(
    when_flag(hide()),
    when_receive('banner',
        costume(V('bannerCostume')), goto_xy(0, 40), front(), set_effect('GHOST', 100), show(),
        repeat(15, change_effect('GHOST', -6.67)), set_effect('GHOST', 0),
        wait(V('bannerHold')),
        repeat(20, change_effect('GHOST', 5)), hide()))

PR = Target('Title Prompt', layer=10)
PR.costumes.append(svg_costume('press', *art.banner_costumes()['press']))
PR.add(
    when_flag(hide()),
    when_receive('title',
        goto_xy(0, -150), show(),
        repeat_until(NOT(is_('gameState', 'title')),
            set_effect('GHOST', 0), wait(0.6), set_effect('GHOST', 75), wait(0.4)),
        hide()))

# ============================================================== HUD (pen)
HU = Target('HUD', layer=1)
add_costumes(HU, art.hud_costumes())
for v in ['i', 'n']:
    HU.var(v, 0)

def bar(x, y, w, h, c): return call('bar', x, y, w, h, c)
A = Arg
HU.add(
    when_flag(hide(), forever(call('draw hud')),
        comment='The HUD is drawn with the Pen extension, cleared and redrawn every frame. '
                '"Run without screen refresh" means you never see it half-drawn.'),
    define('draw hud', [],
        pen_clear(),
        if_(NOT(is_('gameState', 'title')),
            bar(-229, 162, 164, 14, '#000000'), bar(-227, 162, 160, 10, '#3a0c0e'),
            bar(-227, 162, V('hp') * 1.6, 10, '#c0262d'),
            bar(-229, 146, 124, 10, '#000000'), bar(-227, 146, 120, 6, '#12301a'),
            bar(-227, 146, V('stamina') * 1.2, 6, '#4fbf5f'),
            set_('i', 1),
            repeat(3,
                if_else(gt(V('i'), V('estus')), [costume('flask_empty')], [costume('flask')]),
                goto_xy(-221 + (V('i') - 1) * 17, 124), stamp(), change('i', 1)),
            set_('n', length(V('souls'))), set_('i', 1),
            repeat(V('n'),
                costume(join('d', letter(V('i'), V('souls')))),
                goto_xy(226 - (V('n') - V('i')) * 13, -164), stamp(), change('i', 1)),
            costume('soul'), goto_xy(222 - V('n') * 13, -164), stamp(),
            if_(is_('bossActive', 1),
                costume('bossname'), goto_xy(0, -133), stamp(),
                bar(-152, -150, 304, 12, '#000000'), bar(-150, -150, 300, 8, '#2a0c08'),
                bar(-150, -150, V('bossHP') / 280 * 300, 8, '#d0461c')),
            if_(is_('nearFire', 1), costume('prompt'), goto_xy(-140, -20), stamp())),
        warp=True),
    define('bar', ['x', 'y', 'w', 'h', 'c'],
        if_(gt(A('w'), 0),
            pen_up(), pen_color(A('c')),
            if_else(lt(A('w'), A('h')),
                    [pen_size(A('w')), goto_xy(A('x') + A('w') / 2, A('y')), pen_down(), pen_up()],
                    [pen_size(A('h')), goto_xy(A('x') + A('h') / 2, A('y')), pen_down(),
                     goto_xy(A('x') + A('w') - A('h') / 2, A('y')), pen_up()])),
        warp=True),
)

sprites = [P, SK, BO, SW, BF, BS, FG, BN, PR, HU]
if __name__ == '__main__':
    build(stage, sprites, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'Emberfall.sb3'))
    print('built')
