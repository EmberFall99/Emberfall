// ---------------------------------------------------------------- version
// shown on the title screen; bump it with every update
let VERSION = "v0.7.0"

// ---------------------------------------------------------------- the main loop
game.onUpdateInterval(33, function () {
    if (gameState == "title") {
        pressText.setFlag(SpriteFlag.Invisible, Math.idiv(animT, 15) % 2 == 1)
        animT += 1
    } else if (gameState == "play") {
        takeDamage()
        if (gameState == "play") {
            readInput()
            doAction()
            physics()
            for (let m = 0; m <= eType.length - 1; m++) {
                if (eArea[m] == area && eAlive[m] == 1) {
                    enemyThink(m)
                }
            }
            updateBoss()
            updateProjectiles()
            updateEmbers()
        }
        animateKnight()
    } else if (gameState == "cutscene") {
        animateKnight()
    } else if (gameState == "dead") {
        deadT += 1
        if (deadT == 20) {
            showBanner(bnDied, 90)
        }
        if (deadT > 120) {
            respawn()
        }
        animateKnight()
    }
    if (gameState != "title") {
        updateScenery()
    }
    updateMusic()
    updateEmbered()
    drawHud()
    if (bannerT > 0) {
        bannerT += -1
        if (bannerT == 0) {
            banner.setFlag(SpriteFlag.Invisible, true)
        }
    }
})

// ---------------------------------------------------------------- on start
scene.setBackgroundImage(bgTitle)
let bonfire = sprites.create(fireImgs[0], SpriteKind.Scenery)
bonfire.setFlag(SpriteFlag.Invisible, true)
let restPrompt = sprites.create(txtRest, SpriteKind.Scenery)
restPrompt.setPosition(22, 66)
restPrompt.setFlag(SpriteFlag.Invisible, true)
let stain = sprites.create(stainImg, SpriteKind.Scenery)
stain.setFlag(SpriteFlag.Invisible, true)
let fog = sprites.create(fogImgs[0], SpriteKind.Scenery)
fog.setFlag(SpriteFlag.Invisible, true)
fog.z = 20
let keyItem = sprites.create(keyImg, SpriteKind.Scenery)
keyItem.setPosition(150, GROUND - 6)
keyItem.setFlag(SpriteFlag.Invisible, true)
let door = sprites.create(doorClosedImg, SpriteKind.Scenery)
door.x = 151
door.bottom = GROUND
door.setFlag(SpriteFlag.Invisible, true)
let lockedPrompt = sprites.create(txtLocked, SpriteKind.Scenery)
lockedPrompt.setPosition(140, 68)
lockedPrompt.z = 50
lockedPrompt.setFlag(SpriteFlag.Invisible, true)
let shieldItem = sprites.create(shieldPickupImg, SpriteKind.Scenery)
shieldItem.setFlag(SpriteFlag.Invisible, true)
let bowItem = sprites.create(bowPickupImg, SpriteKind.Scenery)
bowItem.setFlag(SpriteFlag.Invisible, true)
for (let n = 0; n <= eType.length - 1; n++) {
    let en = sprites.create(sIdle, SpriteKind.Enemy)
    en.setFlag(SpriteFlag.Invisible, true)
    en.z = 5
    eSprites.push(en)
    // each knife thrower's knife (unused by everyone else)
    let kn = sprites.create(knifeImgs[0], SpriteKind.Scenery)
    kn.setFlag(SpriteFlag.Invisible, true)
    kn.z = 6
    eKnifeSpr.push(kn)
}
let katanaItem = sprites.create(katanaImg, SpriteKind.Scenery)
katanaItem.x = KATANA_X
katanaItem.bottom = GROUND - 10
katanaItem.setFlag(SpriteFlag.Invisible, true)
let boss = sprites.create(bIdle[0], SpriteKind.Boss)
boss.setFlag(SpriteFlag.Invisible, true)
boss.z = 6
let aura = sprites.create(auraImgs[0], SpriteKind.Scenery)
aura.setFlag(SpriteFlag.Invisible, true)
aura.z = 11
let knight = sprites.create(kIdle1[0], SpriteKind.Player)
knight.setFlag(SpriteFlag.Invisible, true)
knight.z = 10
let hud = sprites.create(image.create(104, 24), SpriteKind.Scenery)
hud.setPosition(53, 13)
hud.z = 100
let weaponIcon = sprites.create(icons[0], SpriteKind.Scenery)
weaponIcon.setPosition(40, 19)
weaponIcon.z = 100
let keyIcon = sprites.create(keyImg, SpriteKind.Scenery)
keyIcon.setPosition(68, 19)
keyIcon.z = 100
keyIcon.setFlag(SpriteFlag.Invisible, true)
let amuletIcon = sprites.create(icons[4], SpriteKind.Scenery)
amuletIcon.setPosition(54, 19)
amuletIcon.z = 100
amuletIcon.setFlag(SpriteFlag.Invisible, true)
let farsightItem = sprites.create(farsightImg, SpriteKind.Scenery)
farsightItem.setFlag(SpriteFlag.Invisible, true)
let friend = sprites.create(friendLeanImg, SpriteKind.Scenery)
friend.z = 4
friend.setFlag(SpriteFlag.Invisible, true)
let merchant = sprites.create(faced(merchantImg, -1), SpriteKind.Scenery)
merchant.x = 124
merchant.bottom = GROUND - 14
merchant.z = 4
merchant.setFlag(SpriteFlag.Invisible, true)
let bossBar = sprites.create(image.create(104, 5), SpriteKind.Scenery)
bossBar.setPosition(80, 114)
bossBar.z = 100
bossBar.setFlag(SpriteFlag.Invisible, true)
let bossName = sprites.create(txtBossName, SpriteKind.Scenery)
bossName.setPosition(80, 106)
bossName.z = 100
bossName.setFlag(SpriteFlag.Invisible, true)
let banner = sprites.create(bnGate, SpriteKind.Scenery)
banner.z = 200
banner.setFlag(SpriteFlag.Invisible, true)
let titleText = sprites.create(txtTitle, SpriteKind.Scenery)
titleText.setPosition(80, 22)
let subText = sprites.create(txtSub, SpriteKind.Scenery)
subText.setPosition(80, 38)
let pressText = sprites.create(txtPress, SpriteKind.Scenery)
pressText.setPosition(80, 104)
let controlsText = sprites.create(image.create(160, 8), SpriteKind.Scenery)
controlsText.image.printCenter("B: controls", 0, 11)
controlsText.setPosition(80, 115)
let versionText = sprites.create(image.create(40, 8), SpriteKind.Scenery)
versionText.image.print(VERSION, 0, 0, 11)
versionText.left = 2
versionText.bottom = 119
let titleMenu = sprites.create(image.create(160, 20), SpriteKind.Scenery)
titleMenu.setPosition(80, 100)
let introText = sprites.create(image.create(160, 24), SpriteKind.Scenery)
introText.setPosition(80, 56)
introText.z = 300
let keyRingItem = sprites.create(keyRingImg, SpriteKind.Scenery)
keyRingItem.setFlag(SpriteFlag.Invisible, true)
let prisonGate = sprites.create(gateClosedImg, SpriteKind.Scenery)
prisonGate.x = 150
prisonGate.bottom = GROUND
prisonGate.setFlag(SpriteFlag.Invisible, true)
let flags: Sprite[] = []
for (let fx2 of [34, 92, 146]) {
    let flg = sprites.create(flagImgs[0], SpriteKind.Scenery)
    flg.x = fx2
    flg.bottom = GROUND
    flg.setFlag(SpriteFlag.Invisible, true)
    flags.push(flg)
}
let stocksSprite = sprites.create(stocksClosedImg, SpriteKind.Scenery)
stocksSprite.x = 112
stocksSprite.bottom = GROUND
stocksSprite.setFlag(SpriteFlag.Invisible, true)
let glargon = sprites.create(image.create(1, 1), SpriteKind.Scenery)
glargon.setFlag(SpriteFlag.Invisible, true)
let note = sprites.create(noteImg, SpriteKind.Scenery)
note.x = 66
note.bottom = GROUND
note.setFlag(SpriteFlag.Invisible, true)
let talkPrompt = sprites.create(txtTalk, SpriteKind.Scenery)
talkPrompt.z = 150
talkPrompt.setFlag(SpriteFlag.Invisible, true)
let dialogue = sprites.create(image.create(156, 50), SpriteKind.Scenery)
dialogue.setPosition(80, 52)
dialogue.z = 260
dialogue.setFlag(SpriteFlag.Invisible, true)
let overlay = sprites.create(image.create(160, 120), SpriteKind.Scenery)
overlay.setPosition(80, 60)
overlay.z = 280
overlay.setFlag(SpriteFlag.Invisible, true)
let cellKey = sprites.create(keyImg, SpriteKind.Scenery)
cellKey.setPosition(80, 100)
cellKey.setFlag(SpriteFlag.Invisible, true)
let cellDoor = sprites.create(cellDoorClosedImg, SpriteKind.Scenery)
cellDoor.x = 150
cellDoor.bottom = GROUND
cellDoor.setFlag(SpriteFlag.Invisible, true)
// title screen: Continue / New Game (if there's a save), B for the controls
let titleSel = 0
let saved = hasSave()
if (saved) {
    pressText.setFlag(SpriteFlag.Invisible, true)
}
function drawTitleMenu() {
    let tm = titleMenu.image
    tm.fill(0)
    if (saved) {
        if (titleSel == 0) {
            tm.printCenter("> Continue <", 0, 5)
            tm.printCenter("New Game", 10, 11)
        } else {
            tm.printCenter("Continue", 0, 11)
            tm.printCenter("> New Game <", 10, 5)
        }
    }
}
drawTitleMenu()
while (!(controller.A.isPressed())) {
    if (saved && (controller.up.isPressed() || controller.down.isPressed())) {
        titleSel = 1 - titleSel
        drawTitleMenu()
        pauseUntil(() => !(controller.up.isPressed()) && !(controller.down.isPressed()))
    }
    if (controller.B.isPressed()) {
        game.showLongText("CONTROLS\nLeft/Right: move\nUp: jump, climb\nDown: climb, flask\nDown at bonfire: rest\nB: roll (dodge)\nTap A: attack / combo\nHold A: heavy/block/aim\nA near someone: talk\nMENU: equipment", DialogLayout.Full)
        pauseUntil(() => !(controller.A.isPressed()) && !(controller.B.isPressed()))
    }
    pause(20)
}
pauseUntil(() => !(controller.A.isPressed()))
titleText.destroy()
subText.destroy()
pressText.destroy()
controlsText.destroy()
titleMenu.destroy()
versionText.destroy()
for (let fl3 = 1; fl3 <= 4; fl3++) {
    fadeBlack.push(makeFade(fl3, 15))
    fadeWhite.push(makeFade(fl3, 1))
}
controller.menu.onEvent(ControllerButtonEvent.Pressed, openMenu)
if (saved && titleSel == 0) {
    loadGame()
    respawn()
} else {
    settings.writeNumber("ef_saved", 0)
    playIntro()
    pauseUntil(() => !(controller.A.isPressed()))
    info.setScore(0)
    startNewGame()
}
