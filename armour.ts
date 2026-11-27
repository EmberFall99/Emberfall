// ---------------------------------------------------------------- the Indentured General's Armour
// The samurai kneels at the crypt altar, still wearing it. He was an indentured general, bound by contract to
// kill the Red Hand; he fell into the crypt hunting him, and his blade wasn't magic, so he never got out.
// Put it on and his contract becomes yours. You can't take it off: only the Justicar can pardon you, and only
// once the contract is fulfilled (the Shrine of the Justicar comes later in the game).
// The curse: half health and half healing, but you move, roll and jump faster, and below 30% health you hit
// 20% harder. Hold B to stand with your arms out and let it feed on you - a way to reach that threshold on purpose.
let SAMURAI_X = 73
let armourOn = false
let ARMOUR_DESC = "Prison armour of the indentured warrior. The Justicar empowers the wearer, but they are a slave to their contract."
let ARMOUR_ASK = "Are you sure? This action can only be undone with a pardon."
let bHeld = 0
let offerT = 0
// ---------------------------------------------------------------- the numbers
function computeMaxHP(): number {
    let base = 100 + 12 * lvCon
    if (armourOn) {
        return Math.idiv(base, 2)
    }
    return base
}
function walkSpeed(): number {
    if (armourOn) {
        return 1.43
    }
    return 1.1
}
// a snappier jump: the same height and the same reach at the faster walking speed, just quicker
function jumpPower(): number {
    if (armourOn) {
        return 4.82
    }
    return 3.7
}
function gravity(): number {
    if (armourOn) {
        return 0.459
    }
    return 0.27
}
// below 30% health the armour makes you hit 20% harder
function curseActive(): boolean {
    return armourOn && hp < maxHP * 0.3
}
function curseMul(): number {
    if (curseActive()) {
        return 1.2
    }
    return 1
}
// the contract: inherited from the General. Fulfilled once the Red Hand is dead.
function contractFulfilled(): boolean {
    return redHandDead
}
// ---------------------------------------------------------------- putting it on
function armourScene() {
    pDir = sign(SAMURAI_X - px)
    if (choose("", ARMOUR_ASK, "A: Equip   B: Leave it")) {
        armourOn = true
        maxHP = computeMaxHP()
        hp = Math.min(hp, maxHP)
        music.play(music.melodyPlayable(music.bigCrash), music.PlaybackMode.InBackground)
        scene.cameraShake(3, 600)
        fadeOut(false)
        pause(500)
        fadeIn(false)
        if (contractFulfilled()) {
            say("Contract", "THE RED HAND. Fulfilled.")
        } else {
            say("Contract", "THE RED HAND.")
        }
        saveGame()
    }
    gameState = "play"
    waitRelease = true
}
// a question in the dialogue box, answered with A (yes) or B (no)
// (tests set forceChoice: 1 = A, 2 = B - the test harness can't wait for a button)
let forceChoice = 0
function choose(name: string, text: string, options: string): boolean {
    let lines = wrapText(text, 24)
    lines.push(options)
    dialogue.setFlag(SpriteFlag.Invisible, false)
    let total = 0
    for (let l of lines) {
        total += l.length
    }
    drawDialogue(name, lines, total, false)
    if (forceChoice > 0) {
        dialogue.setFlag(SpriteFlag.Invisible, true)
        return forceChoice == 1
    }
    pauseUntil(() => !(controller.A.isPressed()) && !(controller.B.isPressed()))
    pauseUntil(() => controller.A.isPressed() || controller.B.isPressed())
    let yes = controller.A.isPressed()
    music.play(music.melodyPlayable(music.footstep), music.PlaybackMode.InBackground)
    pauseUntil(() => !(controller.A.isPressed()) && !(controller.B.isPressed()))
    dialogue.setFlag(SpriteFlag.Invisible, true)
    bWas = true
    bHeld = 99
    return yes
}
// ---------------------------------------------------------------- the blood offering (hold B while armoured)
function doOffering() {
    // arms out: the curse feeds on you, a point of health every other tick, never below 1
    if (pFrame % 2 == 0 && hp > 1) {
        hp += -1
    }
    if (pFrame % 4 == 0) {
        let d = sprites.create(bloodSparks[randint(0, 1)], SpriteKind.Smoulder)
        d.setPosition(px + randint(-8, 8), GROUND - py - randint(6, 18))
        d.vx = randint(-4, 4)
        d.vy = randint(-26, -14)
        d.lifespan = randint(500, 900)
        d.z = 12
    }
    if (pFrame % 20 == 1) {
        music.play(music.melodyPlayable(music.thump), music.PlaybackMode.InBackground)
    }
}
// ---------------------------------------------------------------- the look: the General's own armour
// Every knight frame has a twin drawn in the samurai armour (kabuto with the gold crescent crest, gold-banded
// lacquer cuirass, plated shoulders and skirt) - the ks* lists in art.ts. These two lists line up frame for frame.
let samuraiFrom: Image[] = kIdle1.concat(kIdle2).concat(kJump).concat(kDrink).concat(kHurt).concat(kWalk)
    .concat(kWindup).concat(kSlash).concat(kWindup2).concat(kSlash2).concat(kWindup3).concat(kThrust)
    .concat([kHeavyUp, kHeavySlash, kBlock, kDraw, kLoose, kIai, kIaiDash, kIaiEnd, kLeapUp, kLeap]).concat(kOffer).concat(kClimb)
let samuraiTo: Image[] = ksIdle1.concat(ksIdle2).concat(ksJump).concat(ksDrink).concat(ksHurt).concat(ksWalk)
    .concat(ksWindup).concat(ksSlash).concat(ksWindup2).concat(ksSlash2).concat(ksWindup3).concat(ksThrust)
    .concat([ksHeavyUp, ksHeavySlash, ksBlock, ksDraw, ksLoose, ksIai, ksIaiDash, ksIaiEnd, ksLeapUp, ksLeap]).concat(ksOffer).concat(ksClimb)
// anything without a twin (the roll, death) is just recoloured: white plate -> dark lacquer, grey -> brown, plume -> gold
let armFrom = [1, 11, 4]
let armTo = [12, 14, 5]
let armCacheSrc: Image[] = []
let armCacheDst: Image[] = []
function armoured(im: Image): Image {
    let t = samuraiFrom.indexOf(im)
    if (t >= 0) {
        return samuraiTo[t]
    }
    let k = armCacheSrc.indexOf(im)
    if (k >= 0) {
        return armCacheDst[k]
    }
    let c = im.clone()
    for (let q = 0; q <= armFrom.length - 1; q++) {
        c.replace(armFrom[q], armTo[q])
    }
    armCacheSrc.push(im)
    armCacheDst.push(c)
    return c
}
function recoloured(im: Image, from: number[], to: number[]): Image {
    let c = im.clone()
    for (let q = 0; q <= from.length - 1; q++) {
        c.replace(from[q], to[q])
    }
    return c
}
let bloodSparks = [recoloured(sparkImgs[0], [5, 4], [2, 2]), recoloured(sparkImgs[1], [4, 2], [2, 14])]
let redAuraImgs = [recoloured(auraImgs[0], [4, 5], [2, 3]), recoloured(auraImgs[1], [4, 5], [2, 3]), recoloured(auraImgs[2], [4, 5], [2, 3])]
function updateArmourLook() {
    // a faint red glow while the curse's damage bonus is on
    redAura.setFlag(SpriteFlag.Invisible, !(curseActive()) || gameState == "title")
    redAura.setImage(faced(redAuraImgs[Math.idiv(animT, 4) % 3], pDir))
    redAura.x = px
    redAura.bottom = GROUND - py
    // the samurai at the altar, until you take his armour
    samurai.setFlag(SpriteFlag.Invisible, area != 28 || armourOn)
}
