// ---------------------------------------------------------------- equipment menu
// pushScene() freezes the whole game; popScene() brings it back exactly as it was
function openMenu() {
    if (gameState != "play" || !(isFree())) {
        return
    }
    let snapshot = image.screenImage().clone()
    game.pushScene()
    scene.setBackgroundImage(snapshot)
    menuSel = loadout
    menuPanel = sprites.create(image.create(140, 110), SpriteKind.Scenery)
    menuPanel.setPosition(80, 60)
    drawMenu()
    controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
        menuSel = (menuSel + 3) % 4
        music.play(music.melodyPlayable(music.footstep), music.PlaybackMode.InBackground)
        drawMenu()
    })
    controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
        menuSel = (menuSel + 1) % 4
        music.play(music.melodyPlayable(music.footstep), music.PlaybackMode.InBackground)
        drawMenu()
    })
    controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
        if (menuSel == 3) {
            // the amulet slot: one amulet at a time, A puts it on or takes it off
            if (hasFarsight) {
                amulet = 1 - amulet
                music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.InBackground)
            } else {
                music.play(music.melodyPlayable(music.buzzer), music.PlaybackMode.InBackground)
            }
        } else if (owns(menuSel)) {
            loadout = menuSel
            music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.InBackground)
        } else {
            music.play(music.melodyPlayable(music.buzzer), music.PlaybackMode.InBackground)
        }
        drawMenu()
    })
    controller.B.onEvent(ControllerButtonEvent.Pressed, closeMenu)
    controller.menu.onEvent(ControllerButtonEvent.Pressed, closeMenu)
}
function owns(item: number): boolean {
    return item == 0 || item == 1 && hasShield || item == 2 && hasBow
}
function closeMenu() {
    game.popScene()
    waitRelease = true
    aHeld = 0
    bWas = true
}
function drawMenu() {
    let m = menuPanel.image
    m.fill(15)
    m.drawRect(0, 0, 140, 110, 4)
    m.drawRect(1, 1, 138, 108, 14)
    m.print("EQUIPMENT", 43, 4, 4)
    for (let r = 0; r <= 3; r++) {
        let y = 16 + r * 18
        if (r == 3) {
            // a thin line between the weapons and the amulet slot
            m.fillRect(8, y - 4, 124, 1, 12)
        }
        if (r == menuSel) {
            m.fillRect(4, y - 2, 132, 16, 12)
            m.drawRect(4, y - 2, 132, 16, 5)
        }
        if (r == 3) {
            if (hasFarsight) {
                m.drawTransparentImage(icons[4], 8, y)
                m.print("FARSIGHT AMULET", 24, y + 2, 1)
            } else {
                m.drawTransparentImage(icons[3], 8, y)
                m.print("(amulet)", 24, y + 2, 11)
            }
            if (amulet == 1) {
                m.print("E", 126, y + 2, 7)
            }
        } else if (owns(r)) {
            m.drawTransparentImage(icons[r], 8, y)
            m.print(itemNames[r], 24, y + 2, 1)
        } else {
            m.drawTransparentImage(icons[3], 8, y)
            m.print("???", 24, y + 2, 11)
        }
        if (r == loadout) {
            m.print("E", 126, y + 2, 7)
        }
    }
    if (menuSel == 3) {
        if (hasFarsight) {
            m.print("Strike just as a foe", 6, 88, 13)
            m.print("attacks to parry it.", 6, 98, 13)
        } else {
            m.print("No amulet.", 6, 88, 11)
        }
    } else if (owns(menuSel)) {
        m.print(itemTap[menuSel], 6, 88, 13)
        m.print(itemHold[menuSel], 6, 98, 13)
    } else if (menuSel == 1) {
        m.print("Defeat the knight", 6, 88, 11)
        m.print("in the woods.", 6, 98, 11)
    } else {
        m.print("Defeat an archer", 6, 88, 11)
        m.print("to claim this.", 6, 98, 11)
    }
}
let itemNames = ["SWORD", "SWORD & SHIELD", "BOW"]
let itemTap = ["Tap A: 3-hit combo", "Tap A: 3-hit combo", "Tap A: shoot"]
let itemHold = ["Hold A: heavy attack", "Hold A: raise shield", "Hold A: power shot"]
