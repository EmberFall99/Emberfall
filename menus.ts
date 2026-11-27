// ---------------------------------------------------------------- equipment menu
// pushScene() freezes the whole game; popScene() brings it back exactly as it was.
// Weapons are a scrolling list (3 rows show at a time); the amulet slot sits underneath.
// To add a weapon: add it to itemNames/itemTap/itemHold/itemHint/itemIcon and to owns().
let itemNames = ["SWORD", "SWORD & SHIELD", "BOW", "KATANA", "RUSTED DAGGER"]
let itemTap = ["Tap A: 3-hit combo", "Tap A: 3-hit combo", "Tap A: shoot", "Tap A: quick cuts", "Tap A: nimble stabs"]
let itemHold = ["Hold A: heavy attack", "Hold A: raise shield", "Hold A: power shot", "Hold A: sheathed dash", "Hold A: leaping stab"]
let itemHint = ["", "Defeat the knight in the woods.", "Defeat an archer to claim it.", "It lies at the bottom of the crypt.", "Carried by the Red Hand."]
// which picture in `icons` each weapon uses
let itemIcon = [0, 1, 2, 5, 6]
// Charlie's item descriptions (press right in the menu to read them)
let itemDesc = ["A knight's sword. Well made from fine steel.",
    "The shield bears the crest of the Ninth Order.",
    "A wooden yeoman's bow.",
    "Shimmers with the glow of meteorite steel. As sharp as the day it was forged.",
    "Once a fine dagger, embellished with engravings. The pommel still bears the symbol of the Shadowed Men."]
let menuTop = 0
// 0 = the list, 1 = the selected item's description, 2 = key items
let menuPage = 0
let WEAPON_ROWS = 3
function owns(item: number): boolean {
    return item == 0 || item == 1 && hasShield || item == 2 && hasBow || item == 3 && hasKatana || item == 4 && hasDagger
}
function openMenu() {
    if (gameState != "play" || !(isFree())) {
        return
    }
    let snapshot = image.screenImage().clone()
    game.pushScene()
    scene.setBackgroundImage(snapshot)
    menuSel = loadout
    menuPage = 0
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
    controller.right.onEvent(ControllerButtonEvent.Pressed, function () {
        menuPage = (menuPage + 1) % 3
        music.play(music.melodyPlayable(music.footstep), music.PlaybackMode.InBackground)
        drawMenu()
    })
    controller.left.onEvent(ControllerButtonEvent.Pressed, function () {
        menuPage = (menuPage + 2) % 3
        music.play(music.melodyPlayable(music.footstep), music.PlaybackMode.InBackground)
        drawMenu()
    })
    controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
        if (menuPage != 0) {
            return
        }
        if (menuSel == itemNames.length) {
            // the amulet slot: one amulet at a time. A moves on to the next one you own (then none)
            if (anyAmulet()) {
                amulet = nextAmulet(amulet)
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
    if (menuPage == 1) {
        drawInfoPage()
        return
    } else if (menuPage == 2) {
        drawKeyItems()
        return
    }
    m.print("EQUIPMENT", 6, 4, 4)
    m.print("info >", 98, 4, 11)
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
    if (amulet > 0) {
        m.drawTransparentImage(icons[amuletIcon_[amulet]], 8, ay)
        m.print(amuletNames[amulet], 24, ay + 2, 1)
        m.print("E", 126, ay + 2, 7)
    } else if (anyAmulet()) {
        m.drawTransparentImage(icons[3], 8, ay)
        m.print("no amulet", 24, ay + 2, 11)
    } else {
        m.drawTransparentImage(icons[3], 8, ay)
        m.print("(amulet)", 24, ay + 2, 11)
    }
    // what the selection does
    if (menuSel == amuletRow) {
        if (amulet > 0) {
            m.print(amuletLine1[amulet], 6, 88, 13)
            m.print(amuletLine2[amulet], 6, 98, 13)
        } else if (anyAmulet()) {
            m.print("A: put one on.", 6, 88, 11)
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
// ---------------------------------------------------------------- amulets
// 0 none, 1 Farsight (parry), 2 Stalwart (no flinching; parried = half a hit), 3 Focus (a fast dash for a roll),
// 4 Brewer's (Cordials heal half as much again)
let amuletNames = ["", "FARSIGHT AMULET", "STALWART AMULET", "FOCUS AMULET", "BREWER'S AMULET"]
let amuletIcon_ = [3, 4, 7, 8, 9]
let amuletLine1 = ["", "Strike just as a foe", "No flinching. Parried?", "Your roll becomes a", "Cordials heal half"]
let amuletLine2 = ["", "attacks to parry it.", "Half a hit, no stun.", "fast dash.", "as much again."]
function ownsAmulet(a: number): boolean {
    return a == 1 && hasFarsight || a == 2 && hasStalwart || a == 3 && hasFocus || a == 4 && hasBrewer
}
// the next amulet you own after `a`, wrapping round through "none"
function nextAmulet(a: number): number {
    for (let step = 1; step <= 5; step++) {
        let n = (a + step) % 5
        if (n == 0 || ownsAmulet(n)) {
            return n
        }
    }
    return 0
}

let amuletDesc = ["",
    "Bestows the wearer with the ability to see attacks coming. Plagues the wearer with confusing clairvoyant visions.",
    "The wearer becomes immovable, unshakeable. They cannot be stunned, not even by a well placed parry.",
    "Focuses the wearer's spatial awareness, boosting their speed. Makes reading at night difficult.",
    "Spices the Cordial in your flask, increasing its efficacy and improving its flavour."]
let HORN_DESC = "A battle horn, taken from a mountain goat. It looks dusty inside."
// (wrapText() lives in story.ts - the dialogue box uses it too)
function printLines(t: string, y: number, col: number) {
    let lines = wrapText(t, 22)
    for (let l = 0; l <= lines.length - 1; l++) {
        menuPanel.image.print(lines[l], 6, y + l * 10, col)
    }
}
// the selected weapon's or amulet's description
function drawInfoPage() {
    let m = menuPanel.image
    m.print("< info >", 46, 4, 11)
    let amuletRow = itemNames.length
    if (menuSel < amuletRow) {
        if (owns(menuSel)) {
            m.drawTransparentImage(icons[itemIcon[menuSel]], 6, 16)
            m.print(itemNames[menuSel], 22, 18, 1)
            printLines(itemDesc[menuSel], 34, 13)
        } else {
            m.drawTransparentImage(icons[3], 6, 16)
            m.print("???", 22, 18, 11)
        }
    } else if (amulet > 0) {
        m.drawTransparentImage(icons[amuletIcon_[amulet]], 6, 16)
        m.print(amuletNames[amulet], 22, 18, 1)
        printLines(amuletDesc[amulet], 34, 13)
    } else {
        m.print("No amulet worn.", 6, 18, 11)
    }
}
function drawKeyItems() {
    let m = menuPanel.image
    m.print("< key items", 4, 4, 11)
    if (hasHorn) {
        m.drawTransparentImage(hornImg, 6, 18)
        m.print("THE RED HAND'S HORN", 22, 18, 1)
        printLines(HORN_DESC, 34, 13)
    } else {
        m.print("Nothing yet.", 6, 18, 11)
    }
}
function anyAmulet(): boolean {
    return ownsAmulet(1) || ownsAmulet(2) || ownsAmulet(3) || ownsAmulet(4)
}
