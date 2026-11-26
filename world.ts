// ---------------------------------------------------------------- world flow
function respawn() {
    hp = maxHP
    stamina = maxSta
    stamDelay = 0
    estus = maxEstus
    px = spawnX + 18
    py = 0
    vy = 0
    pDir = 1
    pState = "idle"
    pFrame = 0
    dmgIn = 0
    invuln = 30
    atkActive = false
    riposteOn = -1
    bossActive = false
    sprites.destroyAllSpritesOfKind(SpriteKind.FireWave)
    sprites.destroyAllSpritesOfKind(SpriteKind.EnemyArrow)
    sprites.destroyAllSpritesOfKind(SpriteKind.PlayerArrow)
    sprites.destroyAllSpritesOfKind(SpriteKind.PowerArrow)
    resetWorld()
    goToArea(spawnArea)
    gameState = "play"
    knight.setFlag(SpriteFlag.Invisible, false)
    saveGame()
}
// Resting or dying brings every enemy back - the souls-like rule
function resetWorld() {
    for (let i = 0; i <= eType.length - 1; i++) {
        eAlive[i] = 1
    }
    if (!(bossDead)) {
        bossHP = 280
        bx = 120
        bState = "stalk"
        bFrame = 0
        bDir = -1
        bLast = atkID
        bPhase = 1
    }
    for (let j = 0; j <= eType.length - 1; j++) {
        setupEnemy(j)
    }
}
function goToArea(n: number) {
    area = n
    sprites.destroyAllSpritesOfKind(SpriteKind.EnemyArrow)
    sprites.destroyAllSpritesOfKind(SpriteKind.PlayerArrow)
    sprites.destroyAllSpritesOfKind(SpriteKind.PowerArrow)
    if (area == 0) {
        scene.setBackgroundImage(bgCell)
    } else if (area == 1) {
        scene.setBackgroundImage(bgGate)
    } else if (area == 2) {
        scene.setBackgroundImage(bgHall)
    } else if (area == 3) {
        scene.setBackgroundImage(bgWoods)
    } else if (area == 4) {
        scene.setBackgroundImage(bgRampart)
    } else if (area == 5) {
        scene.setBackgroundImage(bgArena)
    } else if (area == 6) {
        scene.setBackgroundImage(bgField)
    } else if (area == 7) {
        scene.setBackgroundImage(bgLake)
    } else if (area == 8) {
        scene.setBackgroundImage(bgRoad)
    } else if (area == 9) {
        scene.setBackgroundImage(bgForde1)
    } else if (area == 10) {
        scene.setBackgroundImage(bgHouseIn)
    } else if (area == 11) {
        scene.setBackgroundImage(bgForde2)
    } else if (area == 12) {
        scene.setBackgroundImage(bgChurchIn)
    } else if (area == 13) {
        scene.setBackgroundImage(bgForde3)
    } else if (area == 14) {
        scene.setBackgroundImage(bgShopIn)
    } else if (area == 15) {
        scene.setBackgroundImage(bgTree)
    } else {
        scene.setBackgroundImage(bgTreehouse)
    }
    // snow only falls on the frozen field
    if (area == 6) {
        effects.blizzard.startScreenEffect()
    } else {
        effects.blizzard.endScreenEffect()
    }
    if (area == 1) {
        fireX = 22
    } else if (area == 7) {
        fireX = 40
    } else if (area == 16) {
        fireX = 50
    } else {
        fireX = 30
    }
    for (let k = 0; k <= eType.length - 1; k++) {
        setupEnemy(k)
    }
    if (!(visited[area])) {
        visited[area] = true
        if (area == 1) {
            showBanner(bnGate, 45)
        } else if (area == 2) {
            showBanner(bnHall, 45)
        } else if (area == 3) {
            showBanner(bnWoods, 45)
        } else if (area == 4) {
            showBanner(bnRampart, 45)
        } else if (area == 6) {
            showBanner(bnField, 45)
        } else if (area == 7) {
            showBanner(bnLake, 60)
        } else if (area == 9) {
            showBanner(bnForde, 60)
        }
    }
    if (area == 5 && !(bossDead) && !(bossActive)) {
        bossActive = true
        bState = "roar"
        bFrame = 0
        bDir = -1
        showBanner(bnBoss, 75)
        music.play(bossTune, music.PlaybackMode.LoopingInBackground)
    }
}
function setupEnemy(i: number) {
    if (eArea[i] == area && eAlive[i] == 1) {
        eX[i] = eHome[i]
        eHP[i] = eMaxHP[i]
        eState[i] = "idle"
        eFrame[i] = 0
        eDir[i] = -1
        eLast[i] = atkID
        eKb[i] = 0
        eSprites[i].setFlag(SpriteFlag.Invisible, false)
        if (eType[i] == "bandit") {
            // the bandits wait in the shadows until you're halfway into the house
            eState[i] = "hidden"
            eSprites[i].setFlag(SpriteFlag.Invisible, true)
        }
    } else {
        eSprites[i].setFlag(SpriteFlag.Invisible, true)
    }
}
function hasBonfire(): boolean {
    return area == 1 || area == 3 || area == 7 || area == 16
}
function rest() {
    hp = maxHP
    estus = maxEstus
    stamina = maxSta
    spawnArea = area
    spawnX = fireX
    music.play(music.melodyPlayable(music.magicWand), music.PlaybackMode.InBackground)
    resetWorld()
    showBanner(bnRest, 50)
    saveGame()
}
function die() {
    pState = "dead"
    gameState = "dead"
    deadT = 0
    // all your souls are left where you fell
    stainSouls = souls
    stainArea = area
    stainX = px
    stainH = supportAt(px, py)
    souls = 0
    info.setScore(0)
    music.stopAllSounds()
    music.play(music.melodyPlayable(music.wawawawaa), music.PlaybackMode.InBackground)
}
