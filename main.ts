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
}
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
keyIcon.setPosition(56, 19)
keyIcon.z = 100
keyIcon.setFlag(SpriteFlag.Invisible, true)
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
pressText.setPosition(80, 112)
pauseUntil(() => controller.A.isPressed())
pauseUntil(() => !(controller.A.isPressed()))
titleText.destroy()
subText.destroy()
pressText.destroy()
game.showLongText("CONTROLS\nLeft/Right: move\nUp: jump, climb\nDown: climb, flask\nDown at bonfire: rest\nB: roll (dodge)\nTap A: attack / combo\nHold A: heavy/block/aim\nMENU: equipment", DialogLayout.Full)
pauseUntil(() => !(controller.A.isPressed()))
game.showLongText("Every action costs stamina. Rolling makes you briefly invincible. Die, and your souls stay where you fell.", DialogLayout.Center)
pauseUntil(() => !(controller.A.isPressed()))
controller.menu.onEvent(ControllerButtonEvent.Pressed, openMenu)
info.setScore(0)
respawn()
