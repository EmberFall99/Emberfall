// ---------------------------------------------------------------- the merchant (Ashen Forde, area 14)
// Asleep on the job until you blow the Red Hand's horn at her. Then she trades: amulets for souls.
let MERCHANT_TALK_X = 108
let shopSel = 0
let shopPanel: Sprite = null
let shopNames = ["STALWART AMULET", "FOCUS AMULET"]
let shopLine1 = ["If parried, no stun:", "Roll becomes a fast"]
let shopLine2 = ["take half a hit.", "dash. Same i-frames."]
function shopOwns(n: number): boolean {
    return n == 0 && hasStalwart || n == 1 && hasFocus
}
// A: blow the horn. She wakes with a start.
function hornScene() {
    pDir = 1
    music.play(music.stringPlayable("C3 C3 G3 G3 C4 C4 C4 C4 ", 140), music.PlaybackMode.InBackground)
    scene.cameraShake(3, 900)
    pause(1300)
    merchantAwake = true
    merchant.setImage(faced(merchantAwakeImg, -1))
    music.play(music.melodyPlayable(music.magicWand), music.PlaybackMode.InBackground)
    pause(700)
    saveGame()
    gameState = "play"
    waitRelease = true
}
function openShop() {
    let snapshot = image.screenImage().clone()
    game.pushScene()
    scene.setBackgroundImage(snapshot)
    shopSel = 0
    shopPanel = sprites.create(image.create(140, 92), SpriteKind.Scenery)
    shopPanel.setPosition(80, 54)
    drawShop()
    controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
        shopSel = (shopSel + 2) % 3
        music.play(music.melodyPlayable(music.footstep), music.PlaybackMode.InBackground)
        drawShop()
    })
    controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
        shopSel = (shopSel + 1) % 3
        music.play(music.melodyPlayable(music.footstep), music.PlaybackMode.InBackground)
        drawShop()
    })
    controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
        if (shopSel == 2) {
            closeShop()
            return
        }
        if (shopOwns(shopSel) || souls < AMULET_PRICE) {
            music.play(music.melodyPlayable(music.buzzer), music.PlaybackMode.InBackground)
        } else {
            souls += 0 - AMULET_PRICE
            info.setScore(souls)
            if (shopSel == 0) {
                hasStalwart = true
            } else {
                hasFocus = true
            }
            music.play(music.melodyPlayable(music.powerUp), music.PlaybackMode.InBackground)
            saveGame()
        }
        drawShop()
    })
    controller.B.onEvent(ControllerButtonEvent.Pressed, closeShop)
    controller.menu.onEvent(ControllerButtonEvent.Pressed, closeShop)
}
function closeShop() {
    game.popScene()
    waitRelease = true
    aHeld = 0
    bWas = true
}
function drawShop() {
    let m = shopPanel.image
    m.fill(15)
    m.drawRect(0, 0, 140, 92, 9)
    m.drawRect(1, 1, 138, 90, 8)
    m.print("AMULETS", 4, 4, 9)
    m.print("Souls " + souls, 136 - ("Souls " + souls).length * 6, 4, 5)
    for (let r = 0; r <= 2; r++) {
        let y = 16 + r * 16
        if (r == shopSel) {
            m.fillRect(4, y - 2, 132, 14, 12)
            m.drawRect(4, y - 2, 132, 14, 9)
        }
        if (r == 2) {
            m.print("Leave", 8, y + 1, 1)
        } else {
            m.drawTransparentImage(icons[7 + r], 6, y - 1)
            m.print(shopNames[r], 20, y + 1, 1)
            if (shopOwns(r)) {
                m.print("SOLD", 112, y + 1, 7)
            } else {
                m.print("" + AMULET_PRICE, 112, y + 1, souls >= AMULET_PRICE ? 5 : 2)
            }
        }
    }
    if (shopSel < 2) {
        m.print(shopLine1[shopSel], 4, 68, 13)
        m.print(shopLine2[shopSel], 4, 78, 13)
    } else {
        m.print("She bows her head.", 4, 68, 11)
    }
}
