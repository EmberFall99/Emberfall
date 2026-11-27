// ---------------------------------------------------------------- enemies
// returns true if the attack connected (even if it was blocked)
function hitEnemy(i: number, dmg: number, heavy: boolean, fromX: number): boolean {
    if (eState[i] == "dying" || eState[i] == "hidden" || eState[i] == "bones" || eState[i] == "rising" || eState[i] == "hop" || eState[i] == "frozen") {
        // (frozen by the dragon: your blade just skids off the ice)
        return false
    }
    let s = eSprites[i]
    if (eType[i] == "redhand") {
        let r = redHandHit(i, heavy, fromX)
        if (r == 0) {
            return false
        } else if (r == 1) {
            return true
        }
    }
    // corrupted bandits: any heavy (sword heavy, power shot) stuns them outright.
    // Anything else that would land rolls a d6: 1 = it parries you, 2 = it dodges, 3-6 = the hit lands.
    let banditDown = eState[i] == "stunned" || eState[i] == "parried" || eState[i] == "riposted" || eState[i] == "dodge"
    if (eType[i] == "bandit" && eState[i] == "dodge") {
        return false
    }
    if (eType[i] == "bandit" && !(banditDown) && !(heavy)) {
        let roll = d6()
        let melee = fromX == px
        if (roll == 1) {
            eDir[i] = sign(fromX - eX[i])
            eState[i] = "parry"
            eFrame[i] = 0
            music.play(music.melodyPlayable(music.smallCrash), music.PlaybackMode.InBackground)
            if (melee && amulet == 2) {
                // Stalwart: you keep your feet. It still cuts you - half a normal hit - but there's no riposte
                stalwartHit(16, eDir[i])
                banditRecover(i, 16)
            } else if (melee) {
                // your blade is turned aside: you're stunned, and it's coming for you
                pState = "parried"
                pFrame = 0
                atkActive = false
                invuln = 0
                kb = 0 - eDir[i] * 1.2
            } else {
                // it bats the arrow out of the air
                eState[i] = "stalk"
                eWait[i] = 10
            }
            return true
        } else if (roll == 2) {
            eDir[i] = sign(fromX - eX[i])
            eState[i] = "dodge"
            eFrame[i] = 0
            music.play(music.melodyPlayable(music.footstep), music.PlaybackMode.InBackground)
            return false
        }
    }
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
        if (eType[i] == "redhand") {
            redHandFalls(i)
        }
        if (eType[i] == "bandit" && !(hasFarsight) && !(farsightDropped)) {
            // the first bandit you kill drops the Farsight Amulet
            farsightDropped = true
            farsightItem.setPosition(eX[i], 0)
            farsightItem.bottom = GROUND - eH[i]
            farsightArea = area
        }
    } else if (eType[i] == "bandit") {
        if (heavy) {
            eState[i] = "stunned"
            eFrame[i] = 0
        } else if (eState[i] != "stunned" && eState[i] != "parried" && eState[i] != "riposted") {
            eState[i] = "hurt"
            eFrame[i] = 0
        }
    } else if (eState[i] == "parried" || eState[i] == "riposted" || eState[i] == "stunned") {
        // already reeling: stay that way
    } else if (eType[i] == "redhand") {
        // he takes it and keeps coming (his own rules - poise, rolls, parries - are in redHandHit)
    } else if (heavy || eType[i] == "archer" || eType[i] == "thrower") {
        eState[i] = "stagger"
        eFrame[i] = 0
    }
    return true
}
function enemyThink(i: number) {
    eFrame[i] = eFrame[i] + 1
    let dist = px - eX[i]
    // was I hit by the player's sword?
    if (atkActive && eLast[i] != atkID && eState[i] != "hidden" && Math.abs(eX[i] - atkX) < atkRange + 5 + bodyW(i) && Math.abs(py - eH[i]) < 15) {
        eLast[i] = atkID
        if (amulet == 1 && isMelee() && inParryWindow(i)) {
            parryEnemy(i)
        } else {
            hitEnemy(i, atkDmg, atkHeavy, px)
        }
    }
    eX[i] = eX[i] + eKb[i]
    eKb[i] = eKb[i] * 0.75
    let im = sIdle
    if (eState[i] == "frozen") {
        im = bdIced
    } else if (eState[i] == "bones" || eState[i] == "rising") {
        im = boneThink(i)
    } else if (eState[i] == "parried" || eState[i] == "riposted" || eState[i] == "stunned") {
        im = reelingThink(i)
    } else if (eType[i] == "thrower") {
        im = throwerThink(i, dist)
    } else if (eType[i] == "redhand") {
        im = redHandThink(i, dist)
    } else if (eType[i] == "archer") {
        im = archerThink(i, dist)
    } else if (eType[i] == "bandit") {
        im = banditThink(i, dist)
    } else {
        im = meleeThink(i, dist)
    }
    if (eState[i] == "dying") {
        if (eType[i] == "skel") {
            im = sDead
        }
        if (eType[i] == "bandit") {
            im = bdDead
        }
        if (eType[i] == "thrower") {
            im = thDead
        }
        if (eType[i] == "redhand") {
            im = rhDead
        }
        if (eFrame[i] == 18) {
            // once the body has crumbled, its embers rise out of the remains
            spawnEmbers(eX[i], GROUND - eH[i] - 8, Math.min(10, Math.idiv(eSouls[i], 15)))
        }
        if (eFrame[i] > 20 && !(eType[i] == "redhand" && eFrame[i] < 70)) {
            if (eRevive[i] == 1) {
                // crypt skeletons don't stay down: the bones lie there, then pull themselves back together
                eState[i] = "bones"
                eFrame[i] = 0
            } else {
                eAlive[i] = 0
                eSprites[i].setFlag(SpriteFlag.Invisible, true)
            }
        }
    }
    // stay on your own platform / your own stretch of ground (never walk off into a pit)
    eX[i] = Math.min(Math.max(eX[i], eMin[i]), eMax[i])
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
    updateKnives()
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
            if (Math.abs(a.x - eX[e]) < 6 + bodyW(e) && Math.abs(a.y - (GROUND - eH[e] - bodyH(e) / 2)) < bodyH(e) / 2 + 1) {
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

// ---------------------------------------------------------------- parrying (Farsight Amulet), and reeling enemies
function d6(): number {
    if (forceRoll > 0) {
        return forceRoll
    }
    return randint(1, 6)
}
// the moment just before an enemy's blow lands: strike then and you parry it
function inParryWindow(i: number): boolean {
    let t = eType[i]
    let st = eState[i]
    let f = eFrame[i]
    if (t == "skel") {
        return st == "windup" && f >= 9 || st == "strike" && f <= 3
    } else if (t == "knight") {
        return st == "windup" && f >= 15 || st == "strike" && f <= 3
    } else if (t == "redhand") {
        return st == "windup" && f >= 5 || st == "cut" && f <= 1 || st == "lungeUp" && f >= 8 || st == "lunge" && f <= 5 || st == "riposte" && f <= 5
    } else if (t == "bandit") {
        return st == "windup" && f >= 4 || st == "lunge" && f <= 7 || st == "slashUp" && f >= 2 || st == "riposte" && f <= 6
    }
    return false
}
function parryEnemy(i: number) {
    eState[i] = "parried"
    eFrame[i] = 0
    eKb[i] = sign(eX[i] - px) * 1.5
    music.play(music.melodyPlayable(music.smallCrash), music.PlaybackMode.InBackground)
    music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
    scene.cameraShake(2, 150)
    eSprites[i].startEffect(effects.halo, 300)
    atkActive = false
}
function hurtImg(i: number): Image {
    if (eType[i] == "knight") {
        return knHurt
    } else if (eType[i] == "archer") {
        return arHurt
    } else if (eType[i] == "bandit") {
        return bdStun
    } else if (eType[i] == "thrower") {
        return thHurt
    } else if (eType[i] == "redhand") {
        return rhStun
    }
    return sHurt
}
// parried (open to a riposte), being run through, or stunned (by a heavy, or after a riposte)
function reelingThink(i: number): Image {
    if (eState[i] == "parried" && eFrame[i] > 55 || eState[i] == "stunned" && eFrame[i] > 45) {
        eFrame[i] = 0
        if (eType[i] == "bandit" || eType[i] == "redhand") {
            eState[i] = "stalk"
            eWait[i] = 20
        } else {
            eState[i] = "chase"
        }
    }
    return hurtImg(i)
}
// ---------------------------------------------------------------- corrupted bandits
// fast and slippery: they circle at a distance, then lunge in or slash up close
function banditThink(i: number, dist: number): Image {
    let im = bdIdle
    let st = eState[i]
    if (st == "hidden") {
        eSprites[i].setFlag(SpriteFlag.Invisible, true)
        if (area == 10 && px > 70 && gameState == "play") {
            // the ambush: they drop out of the rafters on both sides of you
            eState[i] = "stalk"
            eFrame[i] = 0
            eDir[i] = sign(dist)
            eSprites[i].setFlag(SpriteFlag.Invisible, false)
            eSprites[i].startEffect(effects.ashes, 400)
            music.play(music.melodyPlayable(music.spooky), music.PlaybackMode.InBackground)
        }
        return im
    }
    if (st == "milling") {
        // Folkewood: loitering in the street, not looking your way
        im = bdIdle
    } else if (st == "idle") {
        // the ones under the tree: they come for you once you're close
        im = bdIdle
        if (Math.abs(dist) < 90 && Math.abs(py - eH[i]) < 20) {
            eState[i] = "stalk"
            eFrame[i] = 0
        }
    } else if (st == "stalk") {
        eDir[i] = sign(dist)
        let d = Math.abs(dist)
        if (d > 44) {
            eX[i] = eX[i] + eDir[i] * 1.3
            im = bdWalk[Math.idiv(animT, 4) % 2]
        } else if (d < 22 && eFrame[i] < eWait[i] - 10) {
            eX[i] = eX[i] - eDir[i] * 0.9
            im = bdWalk[Math.idiv(animT, 5) % 2]
        }
        if (eFrame[i] > eWait[i] && Math.abs(py - eH[i]) < 20) {
            eFrame[i] = 0
            if (d < 20) {
                eState[i] = "slashUp"
            } else if (d < 64) {
                eState[i] = "windup"
            }
        }
    } else if (st == "windup") {
        // the tell: it crouches and draws the blade back
        im = bdWindup
        if (eFrame[i] > 12) {
            eState[i] = "lunge"
            eFrame[i] = 0
            music.play(music.melodyPlayable(music.footstep), music.PlaybackMode.InBackground)
        }
    } else if (st == "lunge") {
        im = bdLunge
        eX[i] = eX[i] + eDir[i] * 2.8
        if (eFrame[i] >= 2 && Math.abs(px - (eX[i] + eDir[i] * 6)) < 9 && Math.abs(py - eH[i]) < 13) {
            dmgIn += 20
            dmgDir = eDir[i]
            banditRecover(i, 22)
        } else if (eFrame[i] > 9) {
            banditRecover(i, 22)
        }
    } else if (st == "slashUp") {
        im = bdWindup
        if (eFrame[i] > 7) {
            eState[i] = "slash"
            eFrame[i] = 0
            music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
        }
    } else if (st == "slash") {
        im = bdSlash
        if (eFrame[i] == 1 && Math.abs(px - (eX[i] + eDir[i] * 9)) < 11 && Math.abs(py - eH[i]) < 13) {
            dmgIn += 16
            dmgDir = eDir[i]
        }
        if (eFrame[i] > 8) {
            banditRecover(i, 14)
        }
    } else if (st == "recover") {
        // the opening after an attack
        im = bdIdle
        if (eFrame[i] > eWait[i]) {
            eState[i] = "stalk"
            eFrame[i] = 0
            eWait[i] = randint(22, 48)
        }
    } else if (st == "parry") {
        // it turned your blade: now the riposte
        im = bdParry
        if (eFrame[i] > 6) {
            eState[i] = "riposte"
            eFrame[i] = 0
        }
    } else if (st == "riposte") {
        im = bdLunge
        if (Math.abs(dist) > 10 && eFrame[i] < 6) {
            eX[i] = eX[i] + eDir[i] * 1.6
        }
        if (eFrame[i] == 6) {
            music.play(music.melodyPlayable(music.smallCrash), music.PlaybackMode.InBackground)
            if (Math.abs(px - eX[i]) < 18 && Math.abs(py - eH[i]) < 13) {
                dmgIn += 34
                dmgDir = eDir[i]
            }
        }
        if (eFrame[i] > 6) {
            im = bdSlash
        }
        if (eFrame[i] > 24) {
            banditRecover(i, 10)
        }
    } else if (st == "dodge") {
        // a quick dash backwards, out of reach
        im = bdDodge
        if (eFrame[i] < 10) {
            eX[i] = eX[i] - eDir[i] * 2.4
        }
        if (eFrame[i] > 13) {
            eState[i] = "stalk"
            eFrame[i] = 0
            eWait[i] = 12
        }
    } else if (st == "hurt") {
        im = bdHurt
        if (eFrame[i] > 8) {
            // half the time it slips straight back out of reach
            if (randint(1, 2) == 1) {
                eState[i] = "dodge"
            } else {
                eState[i] = "stalk"
                eWait[i] = 18
            }
            eFrame[i] = 0
        }
    } else if (st == "dying") {
        im = bdStun
    }
    return im
}
function banditRecover(i: number, ticks: number) {
    eState[i] = "recover"
    eFrame[i] = 0
    eWait[i] = ticks
}

// ---------------------------------------------------------------- crypt skeletons getting back up
function boneThink(i: number): Image {
    if (eState[i] == "bones") {
        if (eFrame[i] > 170) {
            eState[i] = "rising"
            eFrame[i] = 0
            eSprites[i].startEffect(effects.ashes, 300)
            music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
        }
        return boneImg
    }
    if (eFrame[i] > 18) {
        eHP[i] = eMaxHP[i]
        eState[i] = "chase"
        eFrame[i] = 0
    }
    return sHurt
}
// ---------------------------------------------------------------- knife throwers
// a ranged bandit: keeps its distance, throws a spinning knife that flies out, cuts, and curves back to its hand.
// It can't throw again until the knife is back - that's your moment.
function throwerThink(i: number, dist: number): Image {
    let im = thIdle
    if (eState[i] != "dying" && eState[i] != "stagger") {
        eDir[i] = sign(dist)
    }
    let st = eState[i]
    let knifeOut = knivesOut(i) > 0
    if (st == "idle") {
        if (knifeOut) {
            im = thEmpty
        }
        if (Math.abs(dist) < 34 && Math.abs(py - eH[i]) < 20) {
            // too close: back away
            eX[i] = eX[i] - eDir[i] * 0.8
            im = thWalk[Math.idiv(animT, 6) % 2]
        }
        if (Math.abs(dist) < 22 && Math.abs(py - eH[i]) < 14 && eFrame[i] > 12) {
            // right on top of it: hop back out of reach, or slash with a spare knife
            eFrame[i] = 0
            if (randint(1, 2) == 1) {
                eState[i] = "hop"
                music.play(music.melodyPlayable(music.footstep), music.PlaybackMode.InBackground)
            } else {
                eState[i] = "slashUp"
            }
        } else if (!(knifeOut) && Math.abs(dist) < 120 && eFrame[i] > 25) {
            eState[i] = "wind"
            eFrame[i] = 0
        }
    } else if (st == "hop") {
        // a quick backwards hop: untouchable while in the air
        im = thWalk[1]
        if (eFrame[i] < 10) {
            eX[i] = eX[i] - eDir[i] * 2.4
        }
        if (eFrame[i] > 12) {
            eState[i] = "idle"
            eFrame[i] = 20
        }
    } else if (st == "slashUp") {
        im = thWind
        if (eFrame[i] > 7) {
            eState[i] = "slash"
            eFrame[i] = 0
            music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
        }
    } else if (st == "slash") {
        im = thThrow
        if (eFrame[i] == 1 && Math.abs(px - (eX[i] + eDir[i] * 8)) < 11 && Math.abs(py - eH[i]) < 13) {
            dmgIn += 14
            dmgDir = eDir[i]
        }
        if (eFrame[i] > 12) {
            eState[i] = "idle"
            eFrame[i] = 15
        }
    } else if (st == "wind") {
        im = thWind
        if (eFrame[i] > 12) {
            throwKnife(i)
            eState[i] = "throw"
            eFrame[i] = 0
        }
    } else if (st == "throw") {
        im = thThrow
        if (eFrame[i] > 8) {
            eState[i] = "idle"
            eFrame[i] = 0
        }
    } else if (st == "stagger") {
        im = thHurt
        if (eFrame[i] > 16) {
            eState[i] = "idle"
            eFrame[i] = 0
        }
    } else if (st == "dying") {
        im = thHurt
    }
    return im
}
let KNIFE_TIME = 46
// how many knives this owner has in the air (-1 = the player's ghost daggers)
function knivesOut(owner: number): number {
    let n = 0
    for (let k = 0; k <= KNIVES - 1; k++) {
        if (knOwner[k] == owner) {
            n += 1
        }
    }
    return n
}
// send a knife out along (ux, uy) for `reach` pixels; it spins there and curves back to whoever threw it
function launchKnife(owner: number, x: number, y: number, ux: number, uy: number, reach: number, time: number) {
    for (let k = 0; k <= KNIVES - 1; k++) {
        if (knOwner[k] == -2) {
            knOwner[k] = owner
            knT[k] = 0
            knTime[k] = time
            knX[k] = x
            knY[k] = y
            knUx[k] = ux
            knUy[k] = uy
            knR[k] = reach
            knHit[k] = false
            ghostID += 1
            knId[k] = ghostID
            knSpr[k].setFlag(SpriteFlag.Invisible, false)
            return
        }
    }
}
function dropKnife(k: number) {
    knOwner[k] = -2
    knSpr[k].setFlag(SpriteFlag.Invisible, true)
}
function dropAllKnives() {
    for (let k = 0; k <= KNIVES - 1; k++) {
        dropKnife(k)
    }
}
// a knife thrower's throw: straight at you
function throwKnife(i: number) {
    let sx = eX[i] + eDir[i] * 6
    let sy = GROUND - eH[i] - 12
    let dx = px - sx
    let dy = GROUND - py - 10 - sy
    let d = Math.max(1, Math.sqrt(dx * dx + dy * dy))
    launchKnife(i, sx, sy, dx / d, dy / d, Math.min(140, d + 28), KNIFE_TIME)
    music.play(music.melodyPlayable(music.pewPew), music.PlaybackMode.InBackground)
}
// out along its line and back again, spinning. On the way back it homes on its thrower's hand.
// Enemy knives can hit you once going out and once coming back; your ghost dagger cuts each foe once each way.
function updateKnives() {
    for (let k = 0; k <= KNIVES - 1; k++) {
        let o = knOwner[k]
        if (o == -2) {
            continue
        }
        if (o >= 0 && (eArea[o] != area || eAlive[o] == 0 || eState[o] == "dying")) {
            // the thrower's gone (or you've left): the knife drops
            dropKnife(k)
            continue
        }
        knT[k] = knT[k] + 1
        let half = Math.idiv(knTime[k], 2)
        if (knT[k] == half) {
            // it turns
            knHit[k] = false
            ghostID += 1
            knId[k] = ghostID
        }
        if (knT[k] > half) {
            // coming back to the hand that threw it
            if (o >= 0) {
                knX[k] = eX[o] + eDir[o] * 6
            } else {
                knX[k] = px + pDir * 6
                knY[k] = GROUND - py - 12
            }
        }
        let reach = knR[k] * Math.sin(Math.PI * knT[k] / knTime[k])
        let kx = knX[k] + knUx[k] * reach
        let ky = knY[k] + knUy[k] * reach
        let goingOut = knT[k] < half
        let s = knSpr[k]
        if (o >= 0) {
            s.setImage(knifeImgs[Math.idiv(knT[k], 2) % 4])
            if (!(knHit[k]) && Math.abs(kx - px) < 6 && Math.abs(ky - (GROUND - py - 9)) < 9) {
                knHit[k] = true
                dmgIn += 22
                if (goingOut) {
                    dmgDir = sign(knUx[k])
                } else {
                    dmgDir = 0 - sign(knUx[k])
                }
            }
        } else {
            s.setImage(ghostImgs[Math.idiv(knT[k], 2) % 4])
            for (let e = 0; e <= eType.length - 1; e++) {
                if (eArea[e] == area && eAlive[e] == 1 && eLast[e] != knId[k] && Math.abs(kx - eX[e]) < 6 + bodyW(e) && Math.abs(ky - (GROUND - eH[e] - bodyH(e) / 2)) < bodyH(e) / 2 + 4) {
                    eLast[e] = knId[k]
                    hitEnemy(e, Math.round(8 * katanaMul()), false, kx - sign(knUx[k]) * 10)
                }
            }
            if (area == 5 && bossActive && bLast != knId[k] && Math.abs(kx - bx) < 14 && ky > GROUND - 50) {
                bLast = knId[k]
                damageBoss(Math.round(8 * katanaMul()))
            }
        }
        s.setPosition(kx, ky)
        if (knT[k] >= knTime[k]) {
            // caught
            dropKnife(k)
            if (o >= 0 && eType[o] == "thrower") {
                eFrame[o] = 0
            }
        }
    }
}
// how wide / tall an enemy's body is, for hits (the Red Hand is twice your size)
function bodyW(i: number): number {
    if (eType[i] == "redhand") {
        return 10
    }
    return 0
}
function bodyH(i: number): number {
    if (eType[i] == "redhand") {
        return 44
    }
    return 20
}

// Stalwart Amulet: when you're parried you aren't stunned - you take half of a normal hit instead
function stalwartHit(normalDmg: number, dir: number) {
    atkActive = false
    invuln = 0
    dmgIn += Math.round(normalDmg / 2)
    dmgDir = dir
}
