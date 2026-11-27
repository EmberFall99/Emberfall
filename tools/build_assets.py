"""Rebuild Emberfall's art: draws every sprite/background from code and writes
images.g.jres, images.g.ts and art.ts in the repo root. Never touches game code.

Usage (from the repo root):  python3 tools/build_assets.py
Needs: Python 3 with Pillow + fontTools, Node.js, and pxt-core installed in tools/
(cd tools && npm install pxt-core). Fonts: Liberation Serif Bold, DejaVu Sans Bold.
"""
import json, os, sys, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(HERE, 'art'))
import pixrig as R, pixrig2 as Q, pixrig3 as Z, pixrig4 as W, pixrig5 as V, pixrig6 as X, textart as T

def grid(g): return g.p if hasattr(g, 'p') else g
def fit(t, size, font, spacing, room=152):
    """the biggest font size (up to `size`) at which the text fits across the screen"""
    while size > 6 and len(T.text_grid(t, size, '1', font=font, spacing=spacing)[0]) > room:
        size -= 1
    return size

def banner(t, col, big=False, sub=None):
    if big:
        g = T.text_grid(t, fit(t, 20, T.SERIF, 1), col, band=True, width=160)
    else:
        g = T.text_grid(t, fit(t, 10, T.SANS, 1), col, font=T.SANS, band=True, width=160)
    if sub:
        lines = [sub]
        if fit(sub, 8, T.SANS, 0) < 8:
            # too long for one line at a readable size: break it in two, at the space nearest the middle
            spaces = [i for i, c in enumerate(sub) if c == ' ']
            cut = min(spaces, key=lambda i: abs(i - len(sub) / 2))
            lines = [sub[:cut], sub[cut + 1:]]
        for line in lines:
            g = g + T.text_grid(line, fit(line, 8, T.SANS, 0), '1', font=T.SANS, band=True, width=160, spacing=0)
    return g

BR = [R.boss_frames(r) for r in (0, 1, 2)]
LO = [Q.loadout_frames(w) for w in ('sword', 'shield', 'bow')] + [V.katana_frames(), X.dagger_frames()]
LN = ['Sword', 'Shield', 'Bow', 'Katana', 'Dagger']
KN, AR, S = Q.knight_skel_frames(), Q.archer_frames(), R.skel_frames()
KF = R.knight_frames()
fl, dg = Q.arrow_imgs(); pfl, _ = Q.arrow_imgs('4', '5')
dc, do = Q.door_imgs()
cdc, cdo = Q.cell_door_imgs()
gc, go = Z.prison_gate_imgs()

images = {}       # asset name -> grid
animations = {}   # asset name -> (frames, interval ms)
code_single = {}  # code variable -> asset name
code_array = {}   # code variable -> TS expression

def img(name, g):
    images[name] = grid(g)
    return f'assets.image`{name}`'

def single(var, name, g):
    code_single[var] = img(name, g)

def array(var, pairs):
    code_array[var] = '[' + ', '.join(img(n, g) for n, g in pairs) + ']'

def anim(var, name, frames, interval=100):
    animations[name] = ([grid(f) for f in frames], interval)
    code_array[var] = f'assets.animation`{name}`'

# ---- player
for key, base in [('idle1', 'knightIdle'), ('idle2', 'knightBreathe'), ('jump', 'knightJump'), ('drink', 'knightDrink'), ('hurt', 'knightHurt')]:
    var = {'idle1': 'kIdle1', 'idle2': 'kIdle2', 'jump': 'kJump', 'drink': 'kDrink', 'hurt': 'kHurt'}[key]
    array(var, [(base + LN[i], LO[i][key]) for i in range(5)])
for i in range(5):
    animations['knightWalk' + LN[i]] = ([grid(LO[i][f'walk{n}']) for n in range(1, 5)], 150)
code_array['kWalk'] = 'assets.animation`knightWalkSword`.concat(assets.animation`knightWalkShield`).concat(assets.animation`knightWalkBow`).concat(assets.animation`knightWalkKatana`).concat(assets.animation`knightWalkDagger`)'
for key, var, base in [('windup', 'kWindup', 'knightWindup'), ('slash', 'kSlash', 'knightSlash'), ('windup2', 'kWindup2', 'knightBackswingWindup'),
                       ('slash2', 'kSlash2', 'knightBackswing'), ('windup3', 'kWindup3', 'knightThrustWindup'), ('thrust', 'kThrust', 'knightThrust')]:
    array(var, [(base + LN[i], LO[i][key]) for i in range(2)] + [(base + 'Sword', LO[0][key]), (base + 'Katana', LO[3][key]), (base + 'Dagger', LO[4][key])])
single('kHeavyUp', 'knightHeavyWindup', LO[0]['heavyup'])
single('kHeavySlash', 'knightHeavy', LO[0]['heavy'])
single('kBlock', 'knightBlock', LO[1]['block'])
single('kDraw', 'knightBowDraw', LO[2]['draw'])
single('kLoose', 'knightBowLoose', LO[2]['loose'])
single('kDead', 'knightDead', KF['dead'])
anim('kRoll', 'knightRoll', [KF[f'roll{i}'] for i in range(1, 5)], 130)
anim('kClimb', 'knightClimb', [LO[0]['climb1'], LO[0]['climb2']], 130)
anim('auraImgs', 'emberAura', Q.ember_aura_frames(), 130)
single('emberImg', 'emberSpark', Q.ember_particle())
# ---- enemies
for var, name, key in [('sIdle', 'skeletonIdle', 's_idle'), ('sRaise', 'skeletonWindup', 's_raise'), ('sStrike', 'skeletonStrike', 's_strike'),
                       ('sHurt', 'skeletonHurt', 's_hurt'), ('sDead', 'skeletonBones', 's_dead')]:
    single(var, name, S[key])
anim('sWalk', 'skeletonWalk', [S['s_walk1'], S['s_walk2']], 260)
for var, name, key in [('knIdle', 'skeletonKnightIdle', 'k_idle'), ('knRaise', 'skeletonKnightWindup', 'k_raise'),
                       ('knStrike', 'skeletonKnightStrike', 'k_strike'), ('knHurt', 'skeletonKnightHurt', 'k_hurt')]:
    single(var, name, KN[key])
anim('knWalk', 'skeletonKnightWalk', [KN['k_walk1'], KN['k_walk2']], 300)
for var, name, key in [('arIdle', 'archerIdle', 'a_idle'), ('arDraw', 'archerDraw', 'a_draw'), ('arLoose', 'archerLoose', 'a_loose'), ('arHurt', 'archerHurt', 'a_hurt')]:
    single(var, name, AR[key])
anim('arWalk', 'archerWalk', [AR['a_walk1'], AR['a_walk2']], 260)
# ---- chunk 2: corrupted bandits, the uncorrupted bandit, the merchant, the Farsight Amulet
BD = W.bandit_frames()
for var, name, key in [('bdIdle', 'banditIdle', 'idle'), ('bdWindup', 'banditWindup', 'windup'), ('bdLunge', 'banditLunge', 'lunge'),
                       ('bdSlash', 'banditSlash', 'slash'), ('bdParry', 'banditParry', 'parry'), ('bdDodge', 'banditDodge', 'dodge'),
                       ('bdHurt', 'banditHurt', 'hurt'), ('bdStun', 'banditStunned', 'stunned'), ('bdDead', 'banditDead', 'dead')]:
    single(var, name, BD[key])
anim('bdWalk', 'banditWalk', [BD['walk1'], BD['walk2']], 200)
FL, FT = W.friend_frames()
single('friendLeanImg', 'uncorruptedBandit', FL)
single('friendTalkImg', 'uncorruptedBanditTalking', FT)
single('merchantImg', 'veiledMerchant', W.merchant_behind_counter())
single('farsightImg', 'farsightAmulet', W.amulet_pickup())
# ---- chunk 3: the knife thrower, its knife, the Katana, crypt bones
TH = V.thrower_frames()
for var, name, key in [('thIdle', 'throwerIdle', 'idle'), ('thWind', 'throwerWindup', 'wind'), ('thThrow', 'throwerThrow', 'throw'),
                       ('thEmpty', 'throwerEmptyHanded', 'empty'), ('thHurt', 'throwerHurt', 'hurt'), ('thDead', 'throwerDead', 'dead')]:
    single(var, name, TH[key])
anim('thWalk', 'throwerWalk', [TH['walk1'], TH['walk2']], 200)
anim('knifeImgs', 'thrownKnife', V.knife_frames(), 60)
single('kIai', 'knightKatanaSheathedCharge', LO[3]['iai'])
single('kIaiDash', 'knightKatanaDash', LO[3]['iaiDash'])
single('kIaiEnd', 'knightKatanaDashFinish', LO[3]['iaiEnd'])
single('katanaImg', 'katanaPickup', V.katana_pickup())
single('boneImg', 'cryptBones', V.bone_pile())
# ---- chunk 4: the Red Hand, the Rusted Dagger, the horn, the merchant awake, flags
RH = X.red_frames()
for var, name, key in [('rhRise', 'redHandRise', 'rise'), ('rhWindup1', 'redHandWindup1', 'windup1'), ('rhCut1', 'redHandCut1', 'cut1'),
                       ('rhWindup2', 'redHandWindup2', 'windup2'), ('rhCut2', 'redHandCut2', 'cut2'), ('rhWindup3', 'redHandWindup3', 'windup3'),
                       ('rhThrust', 'redHandThrust', 'thrust'), ('rhLungeUp', 'redHandLungeWindup', 'lungeUp'), ('rhLunge', 'redHandLunge', 'lunge'),
                       ('rhThrowUp', 'redHandThrowWindup', 'throwUp'), ('rhThrow', 'redHandThrow', 'throw'), ('rhParry', 'redHandParry', 'parry'),
                       ('rhHurt', 'redHandHurt', 'hurt'), ('rhStun', 'redHandStunned', 'stunned'), ('rhDead', 'redHandDead', 'dead')]:
    single(var, name, RH[key])
anim('rhIdle', 'redHandIdle', [RH[f'idle{p}'] for p in range(3)], 150)
anim('rhSit', 'redHandSeated', [RH['sit0'], RH['sit1']], 300)
anim('rhRun', 'redHandRun', [RH[f'run{i}'] for i in range(4)], 100)
anim('rhDrink', 'redHandDrinkCordial', [RH['drink0'], RH['drink1']], 200)
anim('rhRoll', 'redHandRoll', [RH[f'roll{k}'] for k in range(4)], 80)
anim('rhFlagImgs', 'redHandFlag', X.flag_frames(), 150)
anim('ghostImgs', 'ghostDagger', X.ghost_dagger_frames(), 60)
single('merchantAwakeImg', 'merchantAwake', X.merchant_awake())
single('hornImg', 'hornPickup', X.horn_pickup())
single('daggerImg', 'rustedDaggerPickup', X.dagger_pickup())
anim('stainImgs', 'smoulderingEmbers', X.smoulder_frames(), 120)
anim('sparkImgs', 'smoulderSpark', X.smoulder_sparks(), 120)
single('kLeapUp', 'knightDaggerLeapWindup', LO[4]['leapUp'])
single('kLeap', 'knightDaggerLeap', LO[4]['leap'])
# ---- boss: [normal, enraged dim, enraged bright]
for var, base, key in [('bIdle', 'wardenIdle', 'b_idle'), ('bRaise', 'wardenSlamWindup', 'b_raise'), ('bSlam', 'wardenSlam', 'b_slam'),
                       ('bSweepUp', 'wardenSweepWindup', 'b_sweepup'), ('bSweep', 'wardenSweep', 'b_sweep'), ('bCrouch', 'wardenChargeWindup', 'b_crouch'),
                       ('bCharge', 'wardenCharge', 'b_charge'), ('bRoar', 'wardenRoar', 'b_roar'), ('bDead', 'wardenDeath', 'b_dead'),
                       ('bWalkA', 'wardenWalkA', 'b_walk1'), ('bWalkB', 'wardenWalkB', 'b_walk2')]:
    array(var, [(base, BR[0][key]), (base + 'Enraged', BR[1][key]), (base + 'EnragedHot', BR[2][key])])
# ---- props, items, effects
anim('fireImgs', 'bonfire', R.bonfire_frames(), 130)
anim('waveImgs', 'fireWave', R.wave_frames(), 100)
anim('flagImgs', 'tatteredFlag', Z.flag_frames(), 160)
anim('fogImgs', 'fogWall', [R.fog_frame(0), R.fog_frame(1)], 330)
for var, name, g in [('arrowFlat', 'arrow', fl), ('arrowDiag', 'arrowDiagonal', dg), ('arrowPower', 'arrowPower', pfl),
                     ('bowPickupImg', 'bowPickup', Q.bow_pickup()), ('shieldPickupImg', 'shieldPickup', Q.shield_pickup()),
                     ('keyImg', 'rampartKey', Q.key_img()), ('doorClosedImg', 'doorClosed', dc), ('doorOpenImg', 'doorOpen', do),
                     ('stainImg', 'bloodstain', R.stain_frame()), ('cellDoorClosedImg', 'cellDoorClosed', cdc), ('cellDoorOpenImg', 'cellDoorOpen', cdo),
                     ('gateClosedImg', 'prisonGateClosed', gc), ('gateOpenImg', 'prisonGateOpen', go), ('keyRingImg', 'wardenKeyRing', Z.key_ring()),
                     ('stocksClosedImg', 'stocksWithPrisoner', Z.stocks(True)), ('stocksOpenImg', 'stocksOpen', Z.stocks(False)),
                     ('manStandImg', 'prisonerStanding', Z.man('stand')), ('manStretchImg', 'prisonerStretching', Z.man('stretch')),
                     ('manGlowImg', 'prisonerTransforming', Z.man_glow()), ('wizardImg', 'glargon', Z.wizard()),
                     ('wizardCastImg', 'glargonCasting', Z.wizard(cast=True, glow=True)), ('noteImg', 'glargonsNote', Z.note_img())]:
    single(var, name, g)
array('icons', [('iconSword', Q.icon('sword')), ('iconSwordShield', Q.icon('shield')), ('iconBow', Q.icon('bow')), ('iconLocked', Q.icon('lock')), ('iconAmulet', W.amulet_icon()), ('iconKatana', V.katana_icon()), ('iconDagger', X.dagger_icon()), ('iconStalwart', X.stalwart_icon()), ('iconFocus', X.focus_icon())])
# ---- backgrounds
for var, name, g in [('bgField', 'bgFrostbittenField', Z.bg_battlefield()), ('bgLake', 'bgStillLake', Z.bg_lake()), ('bgCell', 'bgCell', Q.bg_cell()), ('bgTitle', 'bgTitle', R.bg_title()), ('bgGate', 'bgAshenGate', R.bg_gate()), ('bgHall', 'bgSunkenHall', Q.bg_hall2()),
                     ('bgWoods', 'bgWhisperingWoods', Q.bg_forest()), ('bgRampart', 'bgArchersRampart', Q.bg_rampart()), ('bgArena', 'bgWardenArena', R.bg_arena()),
                     ('bgRoad', 'bgFordeRoad', W.bg_road()), ('bgForde1', 'bgFordeStreetHouse', W.bg_village1()),
                     ('bgForde2', 'bgFordeStreetChurch', W.bg_village2()), ('bgForde3', 'bgFordeStreetShop', W.bg_village3()),
                     ('bgHouseIn', 'bgFordeHouseInside', W.bg_house_inside()), ('bgChurchIn', 'bgFordeChurchInside', W.bg_church_inside()),
                     ('bgShopIn', 'bgFordeShopInside', W.bg_shop_inside()), ('bgTree', 'bgGreatTree', W.bg_tree()),
                     ('bgTreehouse', 'bgTreehouse', W.bg_treehouse()),
                     ('bgWarren1', 'bgWarrenEntrance', V.bg_warren1()), ('bgHollow', 'bgWarrenHollow', V.bg_hollow()),
                     ('bgWarren2', 'bgWarrenDeep', V.bg_warren2()), ('bgWarrenEdge', 'bgWarrenEdge', V.bg_warren_edge()),
                     ('bgCamp1', 'bgCampHuts', V.bg_camp1()), ('bgCamp2', 'bgCampBridge', V.bg_camp2()), ('bgCamp3', 'bgCampApproach', V.bg_camp3()),
                     ('bgCrypt1', 'bgCryptStair', V.bg_crypt1()), ('bgCrypt2', 'bgCryptPillars', V.bg_crypt2()),
                     ('bgCrypt3', 'bgCryptPits', V.bg_crypt3()), ('bgCrypt4', 'bgCryptAltar', V.bg_crypt4()),
                     ('bgThrone', 'bgRedHandThrone', X.bg_throne_with_poles()), ('bgCamp3Open', 'bgCampApproachOpen', X.bg_camp3_open())]:
    single(var, name, g)
# ---- text
for var, name, g in [
    ('txtTitle', 'textTitle', T.text_grid('EMBERFALL', 22, '4')),
    ('txtSub', 'textSubtitle', T.text_grid('a souls-like in MakeCode Arcade', 8, 'd', font=T.SANS, spacing=0)),
    ('txtPress', 'textPressA', T.text_grid('Press A to begin', 10, '1', font=T.SANS)),
    ('txtRest', 'textRest', T.text_grid('REST', 8, '5', font=T.SANS)),
    ('txtLocked', 'textLocked', T.text_grid('LOCKED', 8, '2', font=T.SANS)),
    ('txtTalk', 'textTalk', T.text_grid('A: Talk', 8, '5', font=T.SANS)),
    ('txtRead', 'textRead', T.text_grid('A: Read', 8, '5', font=T.SANS)),
    ('bnField', 'bannerFrostbittenField', banner('THE FROSTBITTEN FIELD', '9')),
    ('bnLake', 'bannerStillLake', banner('THE STILL LAKE', '9')),
    ('bnKeyRing', 'bannerKeyRing', banner('KEY RING ACQUIRED', '5', sub="Heavy iron keys. The Warden's own.")),
    ('txtBossName', 'textBossName', T.text_grid('THE HOLLOW WARDEN', 8, 'd', font=T.SANS, spacing=0)),
    ('bnDied', 'bannerYouDied', banner('YOU DIED', '2', big=True)),
    ('bnRest', 'bannerRest', banner('EMBER REKINDLED', '5')),
    ('bnGate', 'bannerAshenGate', banner('THE ASHEN GATE', 'd')),
    ('bnHall', 'bannerSunkenHall', banner('THE SUNKEN HALL', 'd')),
    ('bnWoods', 'bannerWhisperingWoods', banner('THE WHISPERING WOODS', '7')),
    ('bnRampart', 'bannerArchersRampart', banner("THE ARCHERS' RAMPART", 'd')),
    ('bnBoss', 'bannerWarden', banner('THE HOLLOW WARDEN', '1')),
    ('bnRage', 'bannerEnraged', banner('THE WARDEN ENRAGES', '4')),
    ('bnFelled', 'bannerWardenFelled', banner('WARDEN FELLED', '5', big=True)),
    ('bnKey', 'bannerKey', banner('KEY ACQUIRED', '5', sub='It must open something...')),
    ('bnBow', 'bannerBow', banner('BOW ACQUIRED', '5', sub='Press MENU to equip it')),
    ('bnShield', 'bannerShield', banner('SHIELD ACQUIRED', '5', sub='Press MENU to equip it')),
    ('bnDoor', 'bannerDoorUnlocked', banner('DOOR UNLOCKED', '5')),
    ('bnForde', 'bannerAshenForde', banner('ASHEN FORDE', 'd')),
    ('bnWarren', 'bannerTheWarren', banner('THE WARREN', '7')),
    ('bnCamp', 'bannerAbandonedCamp', banner('THE ABANDONED CAMP', '2')),
    ('bnCrypt', 'bannerTheCrypt', banner('THE CRYPT', 'b')),
    ('bnKatana', 'bannerKatana', banner('KATANA', '1', sub='Press MENU to equip it')),
    ('txtDescend', 'textDescend', T.text_grid('A: Descend', 8, '5', font=T.SANS)),
    ('bnRedHand', 'bannerRedHand', banner('THE RED HAND', '2')),
    ('bnRedFelled', 'bannerRedHandFelled', banner('RED HAND FELLED', '5', big=True)),
    ('bnHorn', 'bannerHorn', banner("THE RED HAND'S HORN", '5', sub='Loud enough to wake anyone')),
    ('bnDagger', 'bannerRustedDagger', banner('RUSTED DAGGER', '4', sub='Press MENU to equip it')),
    ('txtRedName', 'textRedHandName', T.text_grid('THE RED HAND', 8, '1', font=T.SANS, spacing=0)),
    ('txtLift', 'textLiftTheBar', T.text_grid('A: Lift the bar', 8, '5', font=T.SANS)),
    ('txtHorn', 'textBlowHorn', T.text_grid('A: Blow the horn', 8, '5', font=T.SANS)),
    ('txtTrade', 'textTrade', T.text_grid('A: Trade', 8, '5', font=T.SANS)),
    ('bnFarsight', 'bannerFarsight', banner('FARSIGHT AMULET', '5', sub='Press MENU to equip it')),
    ('txtEnter', 'textEnter', T.text_grid('A: Enter', 8, '5', font=T.SANS))]:
    single(var, name, g)

# ================================================================ encode with pxt's own functions
def literal(g):
    return 'img`\n' + '\n'.join(' '.join(r) for r in g) + '\n`'

payload = {'images': {k: literal(v) for k, v in images.items()},
           'animations': {k: ([literal(f) for f in fr], iv) for k, (fr, iv) in animations.items()}}
tmp = tempfile.mkdtemp()
json.dump(payload, open(os.path.join(tmp, 'assets_in.json'), 'w'))
subprocess.run(['node', os.path.join(HERE, 'encode_assets.js'), tmp], check=True)
jres = json.load(open(os.path.join(tmp, 'images.g.jres')))
images_ts = open(os.path.join(tmp, 'images.g.ts')).read()


art_ts = ['// Every sprite, background and animation lives in the Assets tab.',
          '// These lines just collect them into variables (and lists) for the game code.',
          '// Generated by tools/build_assets.py - edit the generators, not this file.', '']
for var, ref in code_single.items():
    art_ts.append(f'let {var} = {ref}')
for var, ref in code_array.items():
    art_ts.append(f'let {var}: Image[] = {ref}')
open(os.path.join(OUT, 'art.ts'), 'w').write('\n'.join(art_ts) + '\n')
open(os.path.join(OUT, 'images.g.jres'), 'w').write(json.dumps(jres, indent=4))
open(os.path.join(OUT, 'images.g.ts'), 'w').write(images_ts)
print(len(images), 'images and', len(animations), 'animations written to', OUT)
