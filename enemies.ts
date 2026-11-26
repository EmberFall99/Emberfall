// ---------------------------------------------------------------- enemies
// returns true if the attack connected (even if it was blocked)
function hitEnemy(i: number, dmg: number, heavy: boolean, fromX: number): boolean {
    if (eState[i] == "dying") {
        return false
    }
    let s = eSprites[i]
    // the skeleton knight blocks anything from the front unless it is mid-attack or hit by a heavy:
    // bait its swing, then punish the recovery - or get behind it
    if (eType[i] == "knight" && eDir[i] == sign(fromX - eX[i]) && !(heavy) && (eState[i] == "idle" || eState[i] == "chase" || eState[i] == "windup")) {
        music.play(music.melodyPlayable(music.smallCrash), music.PlaybackMode.InBackground)
        if (Math.abs(fromX - px) < 30) {
            px += sign(px - eX[i]) * 3
        }
        return true
    }
    eHP[i] = eHP[i] - dmg
    music.play(music.melodyPlayable(music.zapped), music.PlaybackMode.InBackground)
    eKb[i] = sign(eX[i] - fromX)
    if (heavy) {
        eKb[i] = eKb[i] * 2.2
    }
    if (eHP[i] <= 0) {
        eState[i] = "dying"
        eFrame[i] = 0
        souls += eSouls[i]
        info.setScore(souls)
        s.startEffect(effects.disintegrate, 500)
        if (eType[i] == "knight" && !(hasShield) && !(shieldDropped)) {
            // the skeleton knight drops its shield
            shieldDropped = true
            shieldItem.setPosition(eX[i], 0)
            shieldItem.bottom = GROUND - eH[i]
            shieldArea = area
        }
        if (eType[i] == "archer" && !(hasBow) && !(bowDropped)) {
            // archers drop their bow
            bowDropped = true
            bowItem.setPosition(eX[i], 0)
            bowItem.bottom = GROUND - eH[i]
            bowArea = area
        }
    } else if (heavy || eType[i] == "archer") {
        eState[i] = "stagger"
        eFrame[i] = 0
    }
    return true
}
function enemyThink(i: number) {
    eFrame[i] = eFrame[i] + 1
    let dist = px - eX[i]
    // was I hit by the player's sword?
    if (atkActive && eLast[i] != atkID && Math.abs(eX[i] - atkX) < atkRange + 5 && Math.abs(py - eH[i]) < 15) {
        eLast[i] = atkID
        hitEnemy(i, atkDmg, atkHeavy, px)
    }
    eX[i] = eX[i] + eKb[i]
    eKb[i] = eKb[i] * 0.75
    let im = sIdle
    if (eType[i] == "archer") {
        im = archerThink(i, dist)
    } else {
        im = meleeThink(i, dist)
    }
    if (eState[i] == "dying") {
        if (eType[i] == "skel") {
            im = sDead
        }
        if (eFrame[i] == 18) {
            // once the body has crumbled, its embers rise out of the remains
            spawnEmbers(eX[i], GROUND - eH[i] - 8, Math.min(10, Math.idiv(eSouls[i], 15)))
        }
        if (eFrame[i] > 20) {
            eAlive[i] = 0
            eSprites[i].setFlag(SpriteFlag.Invisible, true)
        }
    }
    if (eH[i] > 0) {
        eX[i] = Math.min(Math.max(eX[i], platX1[0] + 4), platX2[0] - 4)
    } else {
        eX[i] = Math.min(Math.max(eX[i], 4), 156)
    }
    eSprites[i].setImage(faced(im, eDir[i]))
    eSprites[i].x = eX[i]
    eSprites[i].bottom = GROUND - eH[i]
}
// skeletons and skeleton knights: chase, wind up, strike
function meleeThink(i: number, dist: number): Image {
    let isKnight = eType[i] == "knight"
    let im = sIdle
    if (isKnight) {
        im = knIdle
    }
    if (eState[i] == "idle") {
        if (Math.abs(dist) < 57 && Math.abs(py - eH[i]) < 30) {
            eState[i] = "chase"
        }
    } else if (eState[i] == "chase") {
        eDir[i] = sign(dist)
        if (Math.abs(dist) > 15) {
            if (isKnight) {
                eX[i] = eX[i] + eDir[i] * 0.45
                im = knWalk[Math.idiv(animT, 9) % 2]
            } else {
                eX[i] = eX[i] + eDir[i] * 0.6
                im = sWalk[Math.idiv(animT, 8) % 2]
            }
        } else {
            eState[i] = "windup"
            eFrame[i] = 0
        }
    } else if (eState[i] == "windup") {
        // the long wind-up is your warning: roll!
        if (isKnight) {
            im = knRaise
        } else {
            im = sRaise
        }
        if (eFrame[i] > 20 || isKnight && eFrame[i] > 26) {
            eState[i] = "strike"
            eFrame[i] = 0
            music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
        }
    } else if (eState[i] == "strike") {
        if (isKnight) {
            im = knStrike
        } else {
            im = sStrike
        }
        if (eFrame[i] == 2) {
            if (Math.abs(px - (eX[i] + eDir[i] * 10)) < 11 && Math.abs(py - eH[i]) < 13) {
                if (isKnight) {
                    dmgIn += 22
                } else {
                    dmgIn += 16
                }
                dmgDir = eDir[i]
            }
        }
        if (eFrame[i] > 22 || isKnight && eFrame[i] > 30) {
            eState[i] = "chase"
        }
    } else if (eState[i] == "stagger") {
        if (isKnight) {
            im = knHurt
        } else {
            im = sHurt
        }
        if (eFrame[i] > 22) {
            eState[i] = "chase"
        }
    } else if (eState[i] == "dying") {
        if (isKnight) {
            im = knHurt
        }
    }
    return im
}
// archers keep their distance and shoot
function archerThink(i: number, dist: number): Image {
    let im = arIdle
    if (eState[i] != "dying" && eState[i] != "stagger") {
        eDir[i] = sign(dist)
    }
    if (eState[i] == "idle") {
        if (Math.abs(dist) < 32 && eH[i] == 0 && Math.abs(py) < 20) {
            // too close: back away
            eX[i] = eX[i] - eDir[i] * 0.7
            im = arWalk[Math.idiv(animT, 8) % 2]
        }
        if (Math.abs(dist) < 125 && eFrame[i] > 45) {
            eState[i] = "draw"
            eFrame[i] = 0
        }
    } else if (eState[i] == "draw") {
        im = arDraw
        if (eFrame[i] > 26) {
            shootEnemyArrow(i)
            eState[i] = "loose"
            eFrame[i] = 0
        }
    } else if (eState[i] == "loose") {
        im = arLoose
        if (eFrame[i] > 10) {
            eState[i] = "idle"
            eFrame[i] = 0
        }
    } else if (eState[i] == "stagger") {
        im = arHurt
        if (eFrame[i] > 16) {
            eState[i] = "idle"
            eFrame[i] = 0
        }
    } else if (eState[i] == "dying") {
        im = arHurt
    }
    return im
}
function shootEnemyArrow(i: number) {
    let sx = eX[i] + eDir[i] * 6
    let sy = GROUND - eH[i] - 12
    let dx = px - sx
    let dy = GROUND - py - 10 - sy
    let d = Math.max(1, Math.sqrt(dx * dx + dy * dy))
    let a: Sprite = null
    if (Math.abs(dy) < Math.abs(dx) * 0.35) {
        a = sprites.create(faced(arrowFlat, sign(dx)), SpriteKind.EnemyArrow)
    } else {
        let diag = faced(arrowDiag, sign(dx))
        if (dy < 0) {
            diag = diag.clone()
            diag.flipY()
        }
        a = sprites.create(diag, SpriteKind.EnemyArrow)
    }
    a.setPosition(sx, sy)
    a.vx = dx / d * 95
    a.vy = dy / d * 95
    a.setFlag(SpriteFlag.AutoDestroy, true)
    music.play(music.melodyPlayable(music.pewPew), music.PlaybackMode.InBackground)
}
function updateProjectiles() {
    for (let ea of sprites.allOfKind(SpriteKind.EnemyArrow)) {
        if (Math.abs(ea.x - px) < 5 && Math.abs(ea.y - (GROUND - py - 9)) < 9) {
            dmgIn += 14
            dmgDir = sign(ea.vx)
            ea.destroy()
        } else if (ea.y > GROUND) {
            ea.destroy()
        }
    }
    for (let pa of sprites.allOfKind(SpriteKind.PlayerArrow)) {
        if (arrowHits(pa, 10, false)) {
            pa.destroy()
        }
    }
    for (let pw of sprites.allOfKind(SpriteKind.PowerArrow)) {
        if (arrowHits(pw, 24, true)) {
            pw.destroy()
        }
    }
    for (let w of sprites.allOfKind(SpriteKind.FireWave)) {
        if (Math.abs(w.x - px) < 6 && py < 9) {
            dmgIn += 18
            dmgDir = sign(w.vx)
            w.destroy()
        }
    }
}
function arrowHits(a: Sprite, baseDmg: number, power: boolean): boolean {
    let dmg = Math.round(baseDmg * rangedMul())
    for (let e = 0; e <= eType.length - 1; e++) {
        if (eArea[e] == area && eAlive[e] == 1 && eState[e] != "dying") {
            if (Math.abs(a.x - eX[e]) < 6 && Math.abs(a.y - (GROUND - eH[e] - 10)) < 11) {
                return hitEnemy(e, dmg, power, a.x - sign(a.vx) * 10)
            }
        }
    }
    if (area == 5 && bossActive && Math.abs(a.x - bx) < 14 && a.y > GROUND - 50) {
        damageBoss(dmg)
        return true
    }
    return false
}
