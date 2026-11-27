// ---------------------------------------------------------------- scenery, items + HUD
let bowArea = 0
function updateScenery() {
    nearFire = hasBonfire() && gameState == "play" && Math.abs(px - fireX) < 12 && py == 0 && isFree()
    bonfire.setFlag(SpriteFlag.Invisible, !(hasBonfire()) || gameState == "title")
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
    // the cell: the fallen key and the cell door
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
    // the Warden's key ring and the prison gate behind him
    keyRingItem.setFlag(SpriteFlag.Invisible, !(area == 5 && keyRingDropped && !(hasKeyRing)))
    if (area == 5 && keyRingDropped && !(hasKeyRing) && Math.abs(px - keyRingItem.x) < 8 && py < 10 && gameState == "play") {
        hasKeyRing = true
        music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.InBackground)
        showBanner(bnKeyRing, 70)
        saveGame()
    }
    prisonGate.setFlag(SpriteFlag.Invisible, area != 5)
    if (gateOpen) {
        prisonGate.setImage(gateOpenImg)
    } else {
        prisonGate.setImage(gateClosedImg)
    }
    if (area == 5 && hasKeyRing && !(gateOpen) && px > 128 && gameState == "play") {
        gateOpen = true
        music.play(music.melodyPlayable(music.beamUp), music.PlaybackMode.InBackground)
        scene.cameraShake(2, 400)
        saveGame()
    }
    // the frozen field: tattered flags, and a man in the stocks
    for (let fl = 0; fl <= flags.length - 1; fl++) {
        flags[fl].setFlag(SpriteFlag.Invisible, area != 6)
        flags[fl].setImage(flagImgs[(Math.idiv(animT, 5) + fl) % 3])
    }
    stocksSprite.setFlag(SpriteFlag.Invisible, area != 6)
    glargon.setFlag(SpriteFlag.Invisible, area != 6 || gameState != "cutscene")
    // the lake: Glargon's note
    note.setFlag(SpriteFlag.Invisible, area != 7)
    // Ashen Forde: the uncorrupted bandit (church, then the treehouse) and the veiled merchant
    friend.setFlag(SpriteFlag.Invisible, !(area == 12 && !(banditMet) || area == 16 && banditMet && !(banditGone)))
    if (area == 12) {
        if (gameState != "cutscene") {
            friend.setImage(friendLeanL)
        }
        friend.x = FRIEND_CHURCH_X
    } else {
        if (gameState != "cutscene") {
            friend.setImage(friendTalkL)
        }
        friend.x = FRIEND_TREE_X
    }
    friend.bottom = GROUND
    merchant.setFlag(SpriteFlag.Invisible, area != 14)
    note2.setFlag(SpriteFlag.Invisible, area != 30)
    if (merchantAwake) {
        merchant.setImage(merchantAwakeL)
    } else {
        merchant.setImage(merchantAsleepL)
    }
    updateRedHandScenery()
    talkTarget = ""
    if (gameState == "play" && isFree() && py == 0) {
        if (area == 6 && !(glargonFreed) && Math.abs(px - 112) < 18) {
            talkTarget = "glargon"
        } else if (area == 7 && Math.abs(px - note.x) < 10) {
            talkTarget = "note"
        } else if ((area == 9 || area == 11 || area == 13) && Math.abs(px - DOOR_X) < 8) {
            talkTarget = "enter"
        } else if (area == 30 && Math.abs(px - NOTE2_X) < 10) {
            talkTarget = "note2"
        } else if (area == 18 && Math.abs(px - HOLE_X) < 10) {
            talkTarget = "descend"
        } else if (area == 23 && !(campGateOpen) && px > 132) {
            talkTarget = "lift"
        } else if (area == 14 && Math.abs(px - MERCHANT_TALK_X) < 14 && merchantAwake) {
            talkTarget = "trade"
        } else if (area == 14 && Math.abs(px - MERCHANT_TALK_X) < 14 && hasHorn) {
            talkTarget = "horn"
        } else if (area == 12 && !(banditMet) && Math.abs(px - FRIEND_CHURCH_X) < 18) {
            talkTarget = "bandit"
        } else if (area == 16 && banditMet && !(banditGone) && Math.abs(px - FRIEND_TREE_X) < 18) {
            talkTarget = "friend"
        }
    }
    talkPrompt.setFlag(SpriteFlag.Invisible, talkTarget == "")
    if (talkTarget == "glargon") {
        talkPrompt.setImage(txtTalk)
        talkPrompt.setPosition(112, 64)
    } else if (talkTarget == "note") {
        talkPrompt.setImage(txtRead)
        talkPrompt.setPosition(note.x, 86)
    } else if (talkTarget == "enter") {
        talkPrompt.setImage(txtEnter)
        talkPrompt.setPosition(DOOR_X, GROUND - 36)
    } else if (talkTarget == "note2") {
        talkPrompt.setImage(txtRead)
        talkPrompt.setPosition(NOTE2_X, 86)
    } else if (talkTarget == "lift") {
        talkPrompt.setImage(txtLift)
        talkPrompt.setPosition(136, GROUND - 52)
    } else if (talkTarget == "trade" || talkTarget == "horn") {
        if (talkTarget == "trade") {
            talkPrompt.setImage(txtTrade)
        } else {
            talkPrompt.setImage(txtHorn)
        }
        talkPrompt.setPosition(116, GROUND - 40)
    } else if (talkTarget == "descend") {
        talkPrompt.setImage(txtDescend)
        talkPrompt.setPosition(HOLE_X, GROUND - 26)
    } else if (talkTarget == "bandit") {
        talkPrompt.setImage(txtTalk)
        talkPrompt.setPosition(FRIEND_CHURCH_X, GROUND - 32)
    } else if (talkTarget == "friend") {
        talkPrompt.setImage(txtTalk)
        talkPrompt.setPosition(FRIEND_TREE_X, GROUND - 32)
    }
    // the key, the door and the dropped bow
    keyItem.setFlag(SpriteFlag.Invisible, !(area == 3 && !(hasKey)))
    if (area == 3 && !(hasKey) && Math.abs(px - keyItem.x) < 8 && py < 10 && gameState == "play") {
        hasKey = true
        music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.InBackground)
        showBanner(bnKey, 50)
        saveGame()
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
            saveGame()
        } else {
            lockedPrompt.setFlag(SpriteFlag.Invisible, false)
        }
    }
    shieldItem.setFlag(SpriteFlag.Invisible, !(shieldDropped && !(hasShield) && area == shieldArea))
    if (shieldDropped && !(hasShield) && area == shieldArea && Math.abs(px - shieldItem.x) < 8 && Math.abs(GROUND - py - shieldItem.bottom) < 10) {
        hasShield = true
        music.play(music.melodyPlayable(music.powerUp), music.PlaybackMode.InBackground)
        showBanner(bnShield, 70)
        saveGame()
    }
    bowItem.setFlag(SpriteFlag.Invisible, !(bowDropped && !(hasBow) && area == bowArea))
    if (bowDropped && !(hasBow) && area == bowArea && Math.abs(px - bowItem.x) < 8 && Math.abs(GROUND - py - bowItem.bottom) < 10) {
        hasBow = true
        music.play(music.melodyPlayable(music.powerUp), music.PlaybackMode.InBackground)
        showBanner(bnBow, 70)
        saveGame()
    }
    farsightItem.setFlag(SpriteFlag.Invisible, !(farsightDropped && !(hasFarsight) && area == farsightArea))
    if (farsightDropped && !(hasFarsight) && area == farsightArea && Math.abs(px - farsightItem.x) < 8 && Math.abs(GROUND - py - farsightItem.bottom) < 10 && gameState == "play") {
        hasFarsight = true
        music.play(music.melodyPlayable(music.powerUp), music.PlaybackMode.InBackground)
        showBanner(bnFarsight, 80)
        saveGame()
    }
    // the Katana, on the altar at the bottom of the crypt
    katanaItem.setFlag(SpriteFlag.Invisible, hasKatana || area != 28)
    if (!(hasKatana) && area == 28 && Math.abs(px - KATANA_X) < 10 && py == 0 && gameState == "play") {
        hasKatana = true
        music.play(music.melodyPlayable(music.powerUp), music.PlaybackMode.InBackground)
        showBanner(bnKatana, 80)
        saveGame()
    }
    // your lost souls wait where you died
    stain.setFlag(SpriteFlag.Invisible, !(stainSouls > 0 && area == stainArea && gameState != "title"))
    stain.x = stainX
    stain.bottom = GROUND - stainH
    if (stainSouls > 0 && area == stainArea && gameState != "title") {
        // your lost souls smoulder where you fell, sparks rising off them
        stain.setImage(stainImgs[Math.idiv(animT, 4) % 3])
        if (animT % 3 == 0) {
            let sp = sprites.create(sparkImgs[randint(0, 1)], SpriteKind.Smoulder)
            sp.setPosition(stainX + randint(-5, 5), GROUND - stainH - 2)
            sp.vx = randint(-5, 5)
            sp.vy = randint(-24, -12)
            sp.lifespan = randint(700, 1500)
            sp.z = 3
        }
    }
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
    // Cordials
    for (let f = 0; f <= maxCordials - 1; f++) {
        h.fillRect(f * 6, 16, 5, 6, 15)
        if (f < cordials) {
            h.fillRect(f * 6 + 1, 17, 3, 4, 4)
        } else {
            h.fillRect(f * 6 + 1, 17, 3, 4, 12)
        }
    }
    hud.setFlag(SpriteFlag.Invisible, gameState == "title")
    weaponIcon.setImage(icons[itemIcon[loadout]])
    weaponIcon.setFlag(SpriteFlag.Invisible, gameState == "title")
    keyIcon.setFlag(SpriteFlag.Invisible, !(hasKey) || gameState == "title")
    amuletIcon.setFlag(SpriteFlag.Invisible, amulet == 0 || gameState == "title")
    amuletIcon.setImage(icons[amuletIcon_[amulet]])
    let bb = bossBar.image
    bb.fill(0)
    bb.fillRect(0, 0, 104, 5, 15)
    bb.fillRect(1, 1, 102, 3, 14)
    if (redHandActive()) {
        bb.fillRect(1, 1, Math.round(102 * Math.max(0, eHP[RH]) / eMaxHP[RH]), 3, 2)
        bossName.setImage(txtRedName)
    } else {
        bb.fillRect(1, 1, Math.round(102 * bossHP / 280), 3, 4)
        bossName.setImage(txtBossName)
    }
    bossBar.setFlag(SpriteFlag.Invisible, !(bossActive || redHandActive()))
    bossName.setFlag(SpriteFlag.Invisible, !(bossActive || redHandActive()))
}
let FRIEND_CHURCH_X = 120
let friendLeanL = faced(friendLeanImg, -1)
let friendTalkL = faced(friendTalkImg, -1)
let FRIEND_TREE_X = 142
let merchantAsleepL = faced(merchantImg, -1)
let merchantAwakeL = faced(merchantAwakeImg, -1)
