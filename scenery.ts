// ---------------------------------------------------------------- scenery, items + HUD
let bowArea = 0
function updateScenery() {
    nearFire = (area == 1 || area == 3) && gameState == "play" && Math.abs(px - fireX) < 12 && py == 0 && isFree()
    bonfire.setFlag(SpriteFlag.Invisible, !(area == 1 || area == 3) || gameState == "title")
    bonfire.setImage(fireImgs[Math.idiv(animT, 4) % 3])
    bonfire.x = fireX
    bonfire.bottom = GROUND
    restPrompt.x = fireX
    restPrompt.setFlag(SpriteFlag.Invisible, !(nearFire))
    // fog closes behind you in the boss arena
    fog.setImage(fogImgs[Math.idiv(animT, 10) % 2])
    fog.x = 4
    fog.bottom = GROUND
    fog.setFlag(SpriteFlag.Invisible, !(area == 5 && bossActive))
    // the cell: the fallen key, the cell door, and a few quiet hints
    cellKey.setFlag(SpriteFlag.Invisible, !(area == 0 && !(hasCellKey)))
    if (area == 0 && !(hasCellKey) && Math.abs(px - cellKey.x) < 7 && py < 8 && gameState == "play") {
        hasCellKey = true
        music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.InBackground)
    }
    cellDoor.setFlag(SpriteFlag.Invisible, area != 0)
    if (cellOpen) {
        cellDoor.setImage(cellDoorOpenImg)
    } else {
        cellDoor.setImage(cellDoorClosedImg)
    }
    if (area == 0 && hasCellKey && !(cellOpen) && px > 128) {
        cellOpen = true
        music.play(music.melodyPlayable(music.beamUp), music.PlaybackMode.InBackground)
    }
    hint.setFlag(SpriteFlag.Invisible, area != 0 || pState == "waking" || gameState != "play")
    if (area == 0) {
        let hi = hint.image
        hi.fill(0)
        if (!(hasCellKey)) {
            hi.printCenter("Left / Right: move", 1, 11)
        } else if (!(cellOpen)) {
            hi.printCenter("The key fits the cell door.", 1, 11)
        } else {
            hi.printCenter("B: roll   Up: jump   A: attack", 1, 11)
        }
    }
    // the key, the door and the dropped bow
    keyItem.setFlag(SpriteFlag.Invisible, !(area == 3 && !(hasKey)))
    if (area == 3 && !(hasKey) && Math.abs(px - keyItem.x) < 8 && py < 10 && gameState == "play") {
        hasKey = true
        music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.InBackground)
        showBanner(bnKey, 50)
    }
    door.setFlag(SpriteFlag.Invisible, area != 4)
    if (doorOpen) {
        door.setImage(doorOpenImg)
    } else {
        door.setImage(doorClosedImg)
    }
    lockedPrompt.setFlag(SpriteFlag.Invisible, true)
    if (area == 4 && !(doorOpen) && px > 136 && py < 10) {
        if (hasKey) {
            doorOpen = true
            music.play(music.melodyPlayable(music.beamUp), music.PlaybackMode.InBackground)
            showBanner(bnDoor, 50)
        } else {
            lockedPrompt.setFlag(SpriteFlag.Invisible, false)
        }
    }
    shieldItem.setFlag(SpriteFlag.Invisible, !(shieldDropped && !(hasShield) && area == shieldArea))
    if (shieldDropped && !(hasShield) && area == shieldArea && Math.abs(px - shieldItem.x) < 8 && Math.abs(GROUND - py - shieldItem.bottom) < 10) {
        hasShield = true
        music.play(music.melodyPlayable(music.powerUp), music.PlaybackMode.InBackground)
        showBanner(bnShield, 70)
    }
    bowItem.setFlag(SpriteFlag.Invisible, !(bowDropped && !(hasBow) && area == bowArea))
    if (bowDropped && !(hasBow) && area == bowArea && Math.abs(px - bowItem.x) < 8 && Math.abs(GROUND - py - bowItem.bottom) < 10) {
        hasBow = true
        music.play(music.melodyPlayable(music.powerUp), music.PlaybackMode.InBackground)
        showBanner(bnBow, 70)
    }
    // your lost souls wait where you died
    stain.setFlag(SpriteFlag.Invisible, !(stainSouls > 0 && area == stainArea && gameState != "title"))
    stain.x = stainX
    stain.bottom = GROUND - stainH
    if (gameState == "play" && stainSouls > 0 && area == stainArea && Math.abs(px - stainX) < 7 && Math.abs(py - stainH) < 7) {
        souls += stainSouls
        stainSouls = 0
        info.setScore(souls)
        music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.InBackground)
    }
}
function drawHud() {
    let h = hud.image
    h.fill(0)
    // health and stamina bars grow as you level them
    let hw = Math.min(100, Math.round(56 * maxHP / 100))
    let sw = Math.min(100, Math.round(42 * maxSta / 100))
    h.fillRect(0, 0, hw + 2, 6, 15)
    h.fillRect(1, 1, hw, 4, 14)
    h.fillRect(1, 1, Math.round(hw * hp / maxHP), 4, 2)
    h.fillRect(0, 7, sw + 2, 4, 15)
    h.fillRect(1, 8, sw, 2, 12)
    h.fillRect(1, 8, Math.round(sw * stamina / maxSta), 2, 7)
    // ember bar: how close your souls are to buying the next level
    h.fillRect(0, 12, 44, 3, 15)
    h.fillRect(1, 13, Math.round(42 * Math.min(1, souls / levelCost())), 1, 4)
    if (embered && Math.idiv(animT, 4) % 2 == 0) {
        h.fillRect(1, 13, 42, 1, 5)
    }
    // flasks
    for (let f = 0; f <= maxEstus - 1; f++) {
        h.fillRect(f * 6, 16, 5, 6, 15)
        if (f < estus) {
            h.fillRect(f * 6 + 1, 17, 3, 4, 4)
        } else {
            h.fillRect(f * 6 + 1, 17, 3, 4, 12)
        }
    }
    hud.setFlag(SpriteFlag.Invisible, gameState == "title")
    weaponIcon.setImage(icons[loadout])
    weaponIcon.setFlag(SpriteFlag.Invisible, gameState == "title")
    keyIcon.setFlag(SpriteFlag.Invisible, !(hasKey) || gameState == "title")
    let bb = bossBar.image
    bb.fill(0)
    bb.fillRect(0, 0, 104, 5, 15)
    bb.fillRect(1, 1, 102, 3, 14)
    bb.fillRect(1, 1, Math.round(102 * bossHP / 280), 3, 4)
    bossBar.setFlag(SpriteFlag.Invisible, !(bossActive))
    bossName.setFlag(SpriteFlag.Invisible, !(bossActive))
}
