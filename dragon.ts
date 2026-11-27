// ---------------------------------------------------------------- Folkewood: the dragon
// Just inside Folkewood's gate lies a note: "Dragon. - Glargon Jones". Read it (or press on into the street)
// and the ice dragon comes: a roar, its shadow racing over, a vast wing across the sky, then its head dips
// in and sweeps a column of freezing breath down the street. Every bandit it touches becomes ice for good -
// no souls, no damage, they just stand there. It kills you too, unless you roll through it at the right
// moment (the roll's invincible frames) or get back out through the gate. It only ever happens once.
let NOTE2_X = 24
let NOTE2_TEXT = "Dragon.\n- Glargon Jones"
let dragonDone = false
let dragonT = -1
let breathX = 0
let frozenDeath = false
let iceFrom = [12, 10, 14, 15, 2, 3, 13, 11, 4, 5, 7]
let iceTo = [9, 9, 6, 8, 9, 1, 1, 1, 9, 1, 9]
// a frozen copy of a picture: everything turned to ice blues and white
function iced(im: Image): Image {
    let c = im.clone()
    for (let k = 0; k <= iceFrom.length - 1; k++) {
        c.replace(iceFrom[k], iceTo[k])
    }
    return c
}
let bdIced = iced(bdIdle)
// the timings of the event, in ticks
let DR_SHADOW_END = 40
let DR_WING_START = 20
let DR_WING_END = 78
let DR_HEAD_START = 78
let DR_BREATH_START = 98
let DR_BREATH_END = 160
let DR_END = 195
let BREATH_FROM = 158
function startDragon() {
    if (dragonDone || dragonT >= 0) {
        return
    }
    dragonT = 0
    music.stopAllSounds()
    curMusic = "silence"
    music.play(music.stringPlayable("C3 B2 A2 G2 F2 E2 D2 C2 ", 300), music.PlaybackMode.InBackground)
    music.play(music.melodyPlayable(music.bigCrash), music.PlaybackMode.InBackground)
    scene.cameraShake(3, 1200)
}
function updateDragon() {
    if (dragonT < 0) {
        return
    }
    if (area != 30) {
        // you got back out through the gate: it happens without you
        finishDragon()
        return
    }
    dragonT += 1
    let t = dragonT
    // its shadow races across the ground
    dragonShadow.setFlag(SpriteFlag.Invisible, t > DR_SHADOW_END)
    dragonShadow.left = -60 + t * 5.5
    dragonShadow.bottom = GROUND + 2
    // the wing sweeps over the top of the screen
    dragonWing.setFlag(SpriteFlag.Invisible, t < DR_WING_START || t > DR_WING_END)
    dragonWing.left = -150 + (t - DR_WING_START) * 5.4
    dragonWing.top = -16 + Math.round(3 * Math.sin(t / 5))
    if (t == DR_WING_START) {
        music.play(music.stringPlayable("E2 - E2 - ", 200), music.PlaybackMode.InBackground)
    }
    // then the head dips in from the top right
    let headOn = t >= DR_HEAD_START && t <= DR_END - 8
    dragonHead.setFlag(SpriteFlag.Invisible, !(headOn))
    if (t < DR_BREATH_START) {
        dragonHead.setImage(dragonHeadImg)
        breathX = BREATH_FROM
        dragonHead.left = breathX - 10
        dragonHead.top = -64 + Math.min(56, (t - DR_HEAD_START) * 3)
    } else if (t <= DR_BREATH_END) {
        // the breath: a column of ice sweeping down the street, right to left
        if (t == DR_BREATH_START) {
            music.play(music.melodyPlayable(music.magicWand), music.PlaybackMode.InBackground)
        }
        dragonHead.setImage(dragonJawImg)
        // from the right-hand edge all the way across, so nobody in the street is missed
        breathX = BREATH_FROM - (t - DR_BREATH_START) * 2.6
        dragonHead.left = breathX - 10
        dragonHead.top = -8
        breath.setFlag(SpriteFlag.Invisible, false)
        breath.setImage(breathImgs[Math.idiv(t, 3) % 2])
        breath.left = breathX - 9
        breath.bottom = GROUND + 2
        scene.cameraShake(1, 60)
        freezeInBreath()
    } else {
        // it rears up and is gone
        breath.setFlag(SpriteFlag.Invisible, true)
        dragonHead.setImage(dragonHeadImg)
        dragonHead.top = -8 - (t - DR_BREATH_END) * 3
    }
    if (t >= DR_END) {
        finishDragon()
    }
}
function freezeInBreath() {
    for (let i = 0; i <= eType.length - 1; i++) {
        if (eArea[i] == 30 && eAlive[i] == 1 && eState[i] != "frozen" && Math.abs(eX[i] - breathX) < 9) {
            eState[i] = "frozen"
            eFrame[i] = 0
        }
    }
    let rolling = pState == "roll" && pFrame < 13
    if (gameState == "play" && Math.abs(px - breathX) < 7 && py < 60 && !(rolling)) {
        // caught in it
        frozenDeath = true
        frozenKnight = iced(kIdle1[loadout])
        die()
    }
}
function finishDragon() {
    dragonT = -1
    dragonDone = true
    dragonShadow.setFlag(SpriteFlag.Invisible, true)
    dragonWing.setFlag(SpriteFlag.Invisible, true)
    dragonHead.setFlag(SpriteFlag.Invisible, true)
    breath.setFlag(SpriteFlag.Invisible, true)
    for (let i = 0; i <= eType.length - 1; i++) {
        if (eArea[i] == 30) {
            eState[i] = "frozen"
        }
    }
    if (area == 30) {
        scene.setBackgroundImage(bgFolkeFrozen)
    }
    curMusic = ""
    saveGame()
}
// the note, and the street: whichever comes first brings it
function dragonTrigger() {
    if (area == 30 && !(dragonDone) && dragonT < 0 && px > 44 && gameState == "play") {
        startDragon()
    }
}
let frozenKnight = bdIced
