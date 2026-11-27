// ---------------------------------------------------------------- equipment menu
// pushScene() freezes the whole game; popScene() brings it back exactly as it was.
// Weapons are a scrolling list (3 rows show at a time); the amulet slot sits underneath.
// To add a weapon: add it to itemNames/itemTap/itemHold/itemHint/itemIcon and to owns().
let itemNames = ["SWORD", "SWORD & SHIELD", "BOW", "KATANA"]
let itemTap = ["Tap A: 3-hit combo", "Tap A: 3-hit combo", "Tap A: shoot", "Tap A: quick cuts"]
let itemHold = ["Hold A: heavy attack", "Hold A: raise shield", "Hold A: power shot", "Hold A: sheathed dash"]
let itemHint = ["", "Defeat the knight in the woods.", "Defeat an archer to claim it.", "It lies at the bottom of the crypt."]
// which picture in `icons` each weapon uses
let itemIcon = [0, 1, 2, 5]
let menuTop = 0
let WEAPON_ROWS = 3
function owns(item: number): boolean {
    return item == 0 || item == 1 && hasShield || item == 2 && hasBow || item == 3 && hasKatana
}
function openMenu() {
    if (gameState != "play" || !(isFree())) {
        return
    }
    let snapshot = image.screenImage().clone()
    game.pushScene()
    scene.setBackgroundImage(snapshot)
    menuSel = loadout
    menuTop = Math.max(0, Math.min(menuSel - 1, itemNames.length - WEAPON_ROWS))
    menuPanel = sprites.create(image.create(140, 110), SpriteKind.Scenery)
    menuPanel.setPosition(80, 60)
    drawMenu()
    // up/down move through the weapons, then on down to the amulet slot (and wrap round)
    controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
        menuSel = (menuSel + itemNames.length) % (itemNames.length + 1)
        music.play(music.melodyPlayable(music.footstep), music.PlaybackMode.InBackground)
        drawMenu()
    })
    controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
        menuSel = (menuSel + 1) % (itemNames.length + 1)
        music.play(music.melodyPlayable(music.footstep), music.PlaybackMode.InBackground)
        drawMenu()
    })
    controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
        if (menuSel == itemNames.length) {
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
function closeMenu() {
    game.popScene()
    waitRelease = true
    aHeld = 0
    bWas = true
}
function menuRow(y: number, selected: boolean) {
    if (selected) {
        menuPanel.image.fillRect(4, y - 2, 132, 16, 12)
        menuPanel.image.drawRect(4, y - 2, 132, 16, 5)
    }
}
function drawMenu() {
    let m = menuPanel.image
    let amuletRow = itemNames.length
    // keep the selected weapon in view
    if (menuSel < amuletRow) {
        if (menuSel < menuTop) {
            menuTop = menuSel
        }
        if (menuSel > menuTop + WEAPON_ROWS - 1) {
            menuTop = menuSel - WEAPON_ROWS + 1
        }
    }
    m.fill(15)
    m.drawRect(0, 0, 140, 110, 4)
    m.drawRect(1, 1, 138, 108, 14)
    m.print("EQUIPMENT", 43, 4, 4)
    for (let r = 0; r <= WEAPON_ROWS - 1; r++) {
        let w = menuTop + r
        let y = 16 + r * 18
        menuRow(y, w == menuSel)
        if (owns(w)) {
            m.drawTransparentImage(icons[itemIcon[w]], 8, y)
            m.print(itemNames[w], 24, y + 2, 1)
        } else {
            m.drawTransparentImage(icons[3], 8, y)
            m.print("???", 24, y + 2, 11)
        }
        if (w == loadout) {
            m.print("E", 126, y + 2, 7)
        }
    }
    // scroll arrows when there are more weapons above or below
    if (menuTop > 0) {
        m.fillRect(132, 13, 1, 1, 5)
        m.fillRect(131, 14, 3, 1, 5)
    }
    if (menuTop + WEAPON_ROWS < itemNames.length) {
        m.fillRect(131, 64, 3, 1, 5)
        m.fillRect(132, 65, 1, 1, 5)
    }
    // the amulet slot
    let ay = 16 + WEAPON_ROWS * 18
    m.fillRect(8, ay - 4, 124, 1, 12)
    menuRow(ay, menuSel == amuletRow)
    if (hasFarsight) {
        m.drawTransparentImage(icons[4], 8, ay)
        m.print("FARSIGHT AMULET", 24, ay + 2, 1)
    } else {
        m.drawTransparentImage(icons[3], 8, ay)
        m.print("(amulet)", 24, ay + 2, 11)
    }
    if (amulet == 1) {
        m.print("E", 126, ay + 2, 7)
    }
    // what the selection does
    if (menuSel == amuletRow) {
        if (hasFarsight) {
            m.print("Strike just as a foe", 6, 88, 13)
            m.print("attacks to parry it.", 6, 98, 13)
        } else {
            m.print("No amulet.", 6, 88, 11)
        }
    } else if (owns(menuSel)) {
        m.print(itemTap[menuSel], 6, 88, 13)
        m.print(itemHold[menuSel], 6, 98, 13)
    } else {
        menuHint(itemHint[menuSel])
    }
}
// a hint about where to find a weapon, split over two lines at a space
function menuHint(t: string) {
    let cut = t.length
    for (let c = 0; c <= t.length - 1; c++) {
        if (t.charAt(c) == " " && c <= 21) {
            cut = c
        }
    }
    if (t.length <= 21) {
        cut = t.length
    }
    menuPanel.image.print(t.substr(0, cut), 6, 88, 11)
    if (cut < t.length) {
        menuPanel.image.print(t.substr(cut + 1, t.length), 6, 98, 11)
    }
}
