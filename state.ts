// ---------------------------------------------------------------- game state
let GROUND = 104
let gameState = "title"
let area = 1
// player
let px = 40
let py = 0
let vy = 0
let pDir = 1
let pState = "idle"
let pFrame = 0
let combo = 0
let hp = 100
let stamina = 100
let stamDelay = 0
let cordials = 3
let invuln = 0
let kb = 0
let animT = 0
let ladder = -1

// ---------------- levelling: souls buy stat levels at bonfires
// carrying at least this fraction of the next level's cost makes you glow with embers (+20%)
let EMBER_AT = 1
let lvSta = 0
let lvCon = 0
let lvStr = 0
let lvDex = 0
let lvAtt = 0
let totalLv = 0
let maxHP = 100
let maxSta = 100
let maxCordials = 3
let embered = false
let lvSel = 0
let lvPanel: Sprite = null
// equipment: 0 = sword, 1 = sword & shield, 2 = bow
let loadout = 0
let hasShield = false
let shieldDropped = false
let shieldArea = 0
let hasBow = false
let bowDropped = false
let hasKey = false
// the prologue: you wake in a cell, and a key has fallen from somewhere above
let hasCellKey = false
let cellOpen = false
// after the Warden: his key ring opens the prison gate behind him
let hasKeyRing = false
let keyRingDropped = false
let gateOpen = false
let glargonFreed = false
let teleported = false
// "glargon" or "note" when you're close enough to press A
let talkTarget = ""
let doorOpen = false
let menuSel = 0
let menuPanel: Sprite = null
// damage the player is about to take (enemies add to this, the player decides if it lands)
let dmgIn = 0
let dmgDir = 1
// input
let buf = ""
let bufT = 0
let aHeld = 0
let waitRelease = false
let bWas = false
let upWas = false
let downWas = false
// the player's sword hitbox
let atkActive = false
let atkID = 0
let atkX = 0
let atkRange = 0
let atkDmg = 0
let atkHeavy = false
// souls and the bloodstain you leave when you die
let souls = 0
let stainSouls = 0
let stainArea = 1
let stainX = 0
let stainH = 0
// world
let spawnArea = 1
let spawnX = 40
let nearFire = false
let fireX = 22
let visited: boolean[] = []
for (let v = 0; v <= 28; v++) {
    visited.push(false)
}
let bannerT = 0
let deadT = 0
// ladders and ledges, one slot per ladder / ledge
// ladUpTo: the area the top of the ladder leads up into (-1 = it just ends on a ledge);
// coming back, you climb down through a hatch at the same x in that area
let ladArea = [2, 4, 15, 18]
let ladX = [120, 92, 120, 130]
let ladTop = [96, 44, 86, 96]
let ladUpTo = [3, -1, 16, 21]
// platforms you can stand on (one-way: you can jump up through them)
let platArea = [4, 18, 19, 21, 22, 22, 23, 26, 26, 26]
let platX1 = [96, 52, 110, 20, 40, 82, 116, 34, 70, 104]
let platX2 = [140, 92, 150, 60, 68, 126, 156, 58, 94, 130]
let platH = [44, 20, 20, 18, 0, 0, 20, 12, 24, 12]
// pits: gaps in the ground. Fall in and you die. (Kept in step with tools/art/pixrig5.py)
let pitArea = [22, 25, 26, 27, 27]
let pitX1 = [40, 88, 30, 48, 110]
let pitX2 = [126, 108, 136, 70, 128]
// enemies: one slot in each list per enemy
// slots 6-7: the corrupted bandits who ambush you inside the first house in Ashen Forde; 8-9: under the great tree;
// 10-13: the Warren; 14-20: the abandoned camp; 21-27: the crypt (their skeletons get back up - eRevive);
// 28: the Red Hand, on his throne (area 24). (The hollow, by the bonfire, has no enemy - Charlie's call.)
let eType = ["skel", "skel", "skel", "knight", "archer", "archer", "bandit", "bandit", "bandit", "bandit", "bandit", "bandit", "bandit", "thrower", "bandit", "thrower", "bandit", "thrower", "bandit", "bandit", "thrower", "skel", "skel", "skel", "skel", "skel", "skel", "skel", "redhand"]
let eArea = [1, 2, 2, 3, 3, 4, 10, 10, 15, 15, 17, 19, 19, 19, 21, 21, 22, 22, 23, 23, 23, 25, 25, 26, 26, 27, 27, 27, 24]
let eHome = [117, 55, 88, 70, 138, 126, 30, 142, 92, 146, 110, 60, 100, 130, 80, 40, 20, 146, 50, 96, 136, 60, 130, 82, 148, 30, 90, 146, 128]
let eH = [0, 0, 0, 0, 0, 44, 0, 0, 0, 0, 0, 0, 0, 20, 0, 18, 0, 0, 0, 0, 20, 0, 0, 24, 0, 0, 0, 0, 0]
let eMaxHP = [40, 40, 40, 70, 30, 30, 120, 120, 120, 120, 120, 120, 120, 70, 120, 70, 120, 70, 120, 120, 70, 40, 40, 40, 40, 40, 40, 40, 400]
let eSouls = [50, 50, 50, 120, 80, 80, 150, 150, 150, 150, 150, 150, 150, 120, 150, 120, 150, 120, 150, 150, 120, 50, 50, 50, 50, 50, 50, 50, 1500]
let eRevive = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0]
let eAlive: number[] = []
let eX: number[] = []
let eHP: number[] = []
let eState: string[] = []
let eFrame: number[] = []
let eDir: number[] = []
let eLast: number[] = []
let eKb: number[] = []
// how far each enemy can roam (its platform, or its stretch of ground between pits) - set in setupEnemy()
let eMin: number[] = []
let eMax: number[] = []
// how long each bandit waits before its next attack (re-rolled after every attack)
let eWait = [0, 0, 0, 0, 0, 0, 30, 50, 40, 55, 30, 40, 55, 0, 50, 0, 55, 0, 50, 40, 0, 0, 0, 0, 0, 0, 0, 0, 40]
// thrown knives: one shared pool for the knife throwers, the Red Hand and the Rusted Dagger's ghost dagger.
// knOwner: the enemy slot that threw it, -1 = the player's ghost dagger, -2 = free
let KNIVES = 8
let knOwner: number[] = []
let knT: number[] = []
let knTime: number[] = []
let knX: number[] = []
let knY: number[] = []
let knUx: number[] = []
let knUy: number[] = []
let knR: number[] = []
let knHit: boolean[] = []
let knId: number[] = []
let knSpr: Sprite[] = []
let ghostID = 500000
for (let kk = 0; kk <= KNIVES - 1; kk++) {
    knOwner.push(-2)
    knT.push(0)
    knTime.push(46)
    knX.push(0)
    knY.push(0)
    knUx.push(0)
    knUy.push(0)
    knR.push(0)
    knHit.push(false)
    knId.push(0)
}
for (let n = 0; n <= eType.length - 1; n++) {
    eAlive.push(1)
    eX.push(0)
    eHP.push(0)
    eState.push("idle")
    eFrame.push(0)
    eDir.push(-1)
    eLast.push(0)
    eKb.push(0)
    eMin.push(4)
    eMax.push(156)
}
let eSprites: Sprite[] = []
// the boss
let bossActive = false
let bossDead = false
let bossHP = 280
let bx = 120
let bState = "stalk"
let bFrame = 0
let bDir = -1
let bLast = 0
let bPhase = 1
let bDashHit = false
let bPick = 0
let wUp = 0
// ---------------- Ashen Forde (chunk 2)
// areas: 8 the road, 9-13 the village streets (10, 12, 14 are the insides of their buildings),
// 15 the great tree, 16 the treehouse
let DOOR_X = 80
// amulets: 0 = none, 1 = Farsight (lets you parry). Only one can be worn at a time.
let amulet = 0
let hasFarsight = false
let farsightDropped = false
let farsightArea = 0
// the uncorrupted bandit: met in the church, waits later in the treehouse
let banditMet = false
// ...and after his words in the treehouse he's gone from there too
let banditGone = false
// the d6 the corrupted bandits roll when your hit would land. Tests set forceRoll to pick the result.
let forceRoll = 0
// riposte: which enemy you're running through
let riposteOn = -1
// which background track is playing ("" = none)
let curMusic = ""
// ---------------------------------------------------------------- the Warren (chunk 3)
// areas: 17 entrance, 18 the hollow (bonfire, ladder up, stair down), 19 deeper woods, 20 the edge (to Folkewood);
// up: 21-23 the abandoned camp; down: 25-28 the crypt. (24 is kept for the Red Hand's throne.)
let HOLE_X = 30
let KATANA_X = 112
let hasKatana = false
// ---------------------------------------------------------------- the Red Hand (chunk 4)
// area 24: his throne room, through the camp gate (lift the bar to open it). He fights like a player:
// combos, rolls, a lunge, thrown knives, parries your third hit, and drinks Cordials when he's hurt.
let RH = eType.indexOf("redhand")
let THRONE_X = 128
let CAMP_FIRE_X = 64
let campGateOpen = false
let redHandDead = false
let rhCordials = 3
let rhPoise = 0
let rhStep = 1
let rhFired = false
let rhRollDir = 1
let hasHorn = false
let hasDagger = false
let merchantAwake = false
// amulets you own (Farsight is hasFarsight); `amulet` is the one you wear: 0 none, 1 Farsight, 2 Stalwart, 3 Focus
let hasStalwart = false
let hasFocus = false
let hasBrewer = false
let AMULET_PRICE = 1500
let bossTune = music.stringPlayable("D4 D4 F4 D4 A4 G4 F4 E4 ", 260)
