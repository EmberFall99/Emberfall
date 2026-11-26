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
let estus = 3
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
let maxEstus = 3
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
let visited = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
let bannerT = 0
let deadT = 0
// ladders and ledges, one slot per ladder / ledge
let ladArea = [2, 4, 15]
let ladX = [120, 92, 120]
let ladTop = [96, 44, 86]
let platArea = [4]
let platX1 = [96]
let platX2 = [140]
let platH = [44]
// enemies: one slot in each list per enemy
// (slots 6-7: the corrupted bandits who ambush you inside the first house in Ashen Forde;
//  slots 8-9: the two waiting under the great tree)
let eType = ["skel", "skel", "skel", "knight", "archer", "archer", "bandit", "bandit", "bandit", "bandit"]
let eArea = [1, 2, 2, 3, 3, 4, 10, 10, 15, 15]
let eHome = [117, 55, 88, 70, 138, 126, 30, 142, 92, 146]
let eH = [0, 0, 0, 0, 0, 44, 0, 0, 0, 0]
let eMaxHP = [40, 40, 40, 70, 30, 30, 120, 120, 120, 120]
let eSouls = [50, 50, 50, 120, 80, 80, 150, 150, 150, 150]
let eAlive = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
let eX = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
let eHP = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
let eState = ["idle", "idle", "idle", "idle", "idle", "idle", "idle", "idle", "idle", "idle"]
let eFrame = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
let eDir = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
let eLast = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
let eKb = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
// how long each bandit waits before its next attack (re-rolled after every attack)
let eWait = [0, 0, 0, 0, 0, 0, 40, 55, 30, 50]
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
let bossTune = music.stringPlayable("D4 D4 F4 D4 A4 G4 F4 E4 ", 260)
