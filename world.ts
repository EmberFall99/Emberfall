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
    bossActive = false
    sprites.destroyAllSpritesOfKind(SpriteKind.FireWave)
    sprites.destroyAllSpritesOfKind(SpriteKind.EnemyArrow)
    sprites.destroyAllSpritesOfKind(SpriteKind.PlayerArrow)
    sprites.destroyAllSpritesOfKind(SpriteKind.PowerArrow)
    resetWorld()
    goToArea(spawnArea)
    gameState = "play"
    knight.setFlag(SpriteFlag.Invisible, false)
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
    if (area == 1) {
        scene.setBackgroundImage(bgGate)
    } else if (area == 2) {
        scene.setBackgroundImage(bgHall)
    } else if (area == 3) {
        scene.setBackgroundImage(bgWoods)
    } else if (area == 4) {
        scene.setBackgroundImage(bgRampart)
    } else {
        scene.setBackgroundImage(bgArena)
    }
    if (area == 1) {
        fireX = 22
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
    } else {
        eSprites[i].setFlag(SpriteFlag.Invisible, true)
    }
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
