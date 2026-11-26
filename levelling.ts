// ---------------------------------------------------------------- levelling + embers
function levelCost(): number {
    return 100 + 50 * totalLv
}
function statCost(stat: number): number {
    // attunement (extra flasks) costs double
    if (stat == 4) {
        return levelCost() * 2
    }
    return levelCost()
}
function statLevel(stat: number): number {
    if (stat == 0) {
        return lvSta
    } else if (stat == 1) {
        return lvCon
    } else if (stat == 2) {
        return lvStr
    } else if (stat == 3) {
        return lvDex
    }
    return lvAtt
}
function statMaxed(stat: number): boolean {
    // attunement is capped at 5 flasks (2 levels) for now; other stats at level 10
    if (stat == 4) {
        return lvAtt >= 2
    }
    return statLevel(stat) >= 10
}
function emberMul(): number {
    if (embered) {
        return 1.2
    }
    return 1
}
function meleeMul(): number {
    return (1 + 0.08 * lvStr) * emberMul()
}
function rangedMul(): number {
    return (1 + 0.1 * lvDex) * emberMul()
}
function buyStat(stat: number) {
    let cost = statCost(stat)
    if (statMaxed(stat) || souls < cost) {
        music.play(music.melodyPlayable(music.buzzer), music.PlaybackMode.InBackground)
        return
    }
    souls += 0 - cost
    info.setScore(souls)
    totalLv += 1
    if (stat == 0) {
        lvSta += 1
        maxSta = 100 + 10 * lvSta
        stamina = maxSta
    } else if (stat == 1) {
        lvCon += 1
        maxHP = 100 + 12 * lvCon
        hp = maxHP
    } else if (stat == 2) {
        lvStr += 1
    } else if (stat == 3) {
        lvDex += 1
    } else {
        lvAtt += 1
        maxEstus = 3 + lvAtt
        estus = maxEstus
    }
    music.play(music.melodyPlayable(music.powerUp), music.PlaybackMode.InBackground)
}
function updateEmbered() {
    let was = embered
    embered = gameState == "play" && souls >= EMBER_AT * levelCost()
    if (embered && !(was)) {
        music.play(music.melodyPlayable(music.magicWand), music.PlaybackMode.InBackground)
    }
    aura.setFlag(SpriteFlag.Invisible, !(embered))
    aura.setImage(faced(auraImgs[Math.idiv(animT, 4) % 3], pDir))
    aura.x = px
    aura.bottom = GROUND - py
}
// the embers of whatever you kill drift into you
function spawnEmbers(x: number, y: number, n: number) {
    for (let k = 0; k <= n - 1; k++) {
        let em = sprites.create(emberImg, SpriteKind.Ember)
        em.setPosition(x + randint(-6, 6), y + randint(-8, 4))
        em.vx = randint(-15, 15)
        em.vy = randint(-30, -10)
        em.lifespan = 3500
    }
}
function updateEmbers() {
    for (let em2 of sprites.allOfKind(SpriteKind.Ember)) {
        let dx = px - em2.x
        let dy = GROUND - py - 10 - em2.y
        let d = Math.max(1, Math.sqrt(dx * dx + dy * dy))
        if (em2.lifespan > 3000) {
            // first half a second: float gently upwards out of the remains
            em2.vx = em2.vx * 0.9
            em2.vy = em2.vy * 0.95
        } else if (d < 5) {
            em2.destroy()
        } else {
            em2.vx = em2.vx * 0.9 + dx / d * 14
            em2.vy = em2.vy * 0.9 + dy / d * 14
        }
    }
}
// the bonfire menu: spend souls on stats (the world is frozen with pushScene, like the equipment menu)
function openLevelMenu() {
    let snap = image.screenImage().clone()
    game.pushScene()
    scene.setBackgroundImage(snap)
    lvSel = 0
    lvPanel = sprites.create(image.create(150, 108), SpriteKind.Scenery)
    lvPanel.setPosition(80, 60)
    drawLevelMenu()
    controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
        lvSel = (lvSel + 5) % 6
        drawLevelMenu()
    })
    controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
        lvSel = (lvSel + 1) % 6
        drawLevelMenu()
    })
    controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
        if (lvSel == 5) {
            closeMenu()
        } else {
            buyStat(lvSel)
            drawLevelMenu()
        }
    })
    controller.B.onEvent(ControllerButtonEvent.Pressed, closeMenu)
}
let statNames = ["Stamina", "Constitution", "Strength", "Dexterity", "Attunement"]
let statInfo = ["+10 max stamina", "+12 max health", "+8% melee, cheaper block", "+10% bow, faster aim", "+1 flask (max 5)"]
function drawLevelMenu() {
    let m2 = lvPanel.image
    m2.fill(15)
    m2.drawRect(0, 0, 150, 108, 4)
    m2.drawRect(1, 1, 148, 106, 14)
    m2.print("BONFIRE", 6, 4, 4)
    m2.print("Souls " + souls, 76, 4, 5)
    for (let r2 = 0; r2 <= 5; r2++) {
        let y2 = 18 + r2 * 12
        if (r2 == lvSel) {
            m2.fillRect(3, y2 - 2, 144, 11, 12)
        }
        if (r2 == 5) {
            m2.print("Leave", 6, y2, 1)
        } else {
            m2.print(statNames[r2], 6, y2, 1)
            m2.print("" + statLevel(r2), 88, y2, 13)
            if (statMaxed(r2)) {
                m2.print("MAX", 112, y2, 11)
            } else if (souls >= statCost(r2)) {
                m2.print("" + statCost(r2), 112, y2, 7)
            } else {
                m2.print("" + statCost(r2), 112, y2, 2)
            }
        }
    }
    if (lvSel < 5) {
        m2.print(statInfo[lvSel], 6, 94, 13)
    } else {
        m2.print("A: buy   B: leave", 6, 94, 13)
    }
}
