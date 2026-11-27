// ---------------------------------------------------------------- the Red Hand
// An optional boss on a throne of bodies at the end of the abandoned camp (area 24).
// He's meant to feel like a bigger, tougher player, not a monster: he chains a 3-hit combo, lunges, throws
// returning knives (sometimes three at once), rolls out of trouble, parries the third hit of YOUR combo,
// and when he's hurt he backs off to drink a Cordial (hit him mid-drink to waste it).
// The best way to kill him: parry him with the Farsight Amulet, then riposte. One phase. 400 HP.

// is the fight on? (he's off his throne and still alive)
function redHandActive(): boolean {
    return area == 24 && !(redHandDead) && eAlive[RH] == 1 && eState[RH] != "throne"
}
function redHandThink(i: number, dist: number): Image {
    let st = eState[i]
    let d = Math.abs(dist)
    let im = rhIdle[Math.idiv(animT, 5) % 3]
    if (st != "roll" && st != "lunge" && st != "dying" && st != "throne") {
        eDir[i] = sign(dist)
    }
    if (st == "throne") {
        // seated among the dead, sword planted, waiting
        eX[i] = THRONE_X
        eDir[i] = -1
        im = rhSit[Math.idiv(animT, 9) % 2]
        if (px > 40 && gameState == "play") {
            eState[i] = "rise"
            eFrame[i] = 0
            showBanner(bnRedHand, 75)
            music.play(music.melodyPlayable(music.bigCrash), music.PlaybackMode.InBackground)
        }
    } else if (st == "rise") {
        im = rhSit[0]
        if (eFrame[i] > 16) {
            im = rhRise
        }
        if (eFrame[i] > 40) {
            eState[i] = "stalk"
            eFrame[i] = 0
            eWait[i] = 20
        }
    } else if (st == "stalk") {
        let hurt = eHP[i] < eMaxHP[i] * 0.45 && rhCordials > 0
        if (hurt && d > 46 && eFrame[i] > 8) {
            // out of reach: drink
            eState[i] = "drink"
            eFrame[i] = 0
            return rhDrink[0]
        } else if (hurt && d <= 46 && eFrame[i] > 14) {
            // too close to drink: roll away first
            rhStartRoll(i, 0 - sign(dist))
            return rhRoll[0]
        }
        if (d > 52) {
            eX[i] = eX[i] + eDir[i] * 1.5
            im = rhRun[Math.idiv(animT, 3) % 4]
        } else if (d < 24) {
            eX[i] = eX[i] - eDir[i] * 0.8
            im = rhRun[3 - Math.idiv(animT, 4) % 4]
        }
        if (eFrame[i] > eWait[i] && Math.abs(py) < 30) {
            eFrame[i] = 0
            let pick = randint(1, 3)
            if (d < 34) {
                rhStep = 1
                eState[i] = "windup"
            } else if (d < 90 && pick == 1) {
                eState[i] = "lungeUp"
            } else if (d < 50 && pick == 2) {
                rhStep = 1
                eState[i] = "windup"
            } else {
                eState[i] = "throwUp"
            }
        }
    } else if (st == "windup") {
        if (rhStep == 1) {
            im = rhWindup1
        } else if (rhStep == 2) {
            im = rhWindup2
        } else {
            im = rhWindup3
        }
        if (eFrame[i] > 10 || rhStep == 3 && eFrame[i] > 12) {
            eState[i] = "cut"
            eFrame[i] = 0
            music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
        }
    } else if (st == "cut") {
        if (rhStep == 1) {
            im = rhCut1
        } else if (rhStep == 2) {
            im = rhCut2
        } else {
            im = rhThrust
            if (eFrame[i] < 5) {
                eX[i] = eX[i] + eDir[i] * 2.2
            }
        }
        if (eFrame[i] == 1 && Math.abs(px - (eX[i] + eDir[i] * 16)) < 18 && Math.abs(py - eH[i]) < 20) {
            if (rhStep == 3) {
                dmgIn += 28
            } else {
                dmgIn += 20
            }
            dmgDir = eDir[i]
        }
        if (eFrame[i] >= 8) {
            if (rhStep < 3 && d < 48) {
                // chain the next swing, quicker than the first
                rhStep += 1
                eState[i] = "windup"
                eFrame[i] = 4
            } else {
                rhRecover(i, 26)
            }
        }
    } else if (st == "lungeUp") {
        im = rhLungeUp
        if (eFrame[i] > 14) {
            eState[i] = "lunge"
            eFrame[i] = 0
            rhFired = false
            music.play(music.melodyPlayable(music.footstep), music.PlaybackMode.InBackground)
        }
    } else if (st == "lunge") {
        im = rhLunge
        eX[i] = eX[i] + eDir[i] * 3.6
        if (!(rhFired) && Math.abs(px - (eX[i] + eDir[i] * 14)) < 14 && Math.abs(py - eH[i]) < 20) {
            rhFired = true
            dmgIn += 26
            dmgDir = eDir[i]
        }
        if (eFrame[i] > 11) {
            rhRecover(i, 28)
        }
    } else if (st == "throwUp") {
        im = rhThrowUp
        if (eFrame[i] > 14) {
            rhThrowKnives(i, d > 40 && randint(1, 2) == 1)
            eState[i] = "throw"
            eFrame[i] = 0
        }
    } else if (st == "throw") {
        im = rhThrow
        if (eFrame[i] > 12) {
            rhRecover(i, 14)
        }
    } else if (st == "recover") {
        // the opening after an attack
        im = rhIdle[0]
        if (eFrame[i] > eWait[i]) {
            eState[i] = "stalk"
            eFrame[i] = 0
            eWait[i] = randint(14, 34)
        }
    } else if (st == "roll") {
        im = rhRoll[Math.idiv(eFrame[i], 3) % 4]
        if (eFrame[i] < 12) {
            eX[i] = eX[i] + rhRollDir * 3.2
        }
        if (eFrame[i] > 15) {
            eState[i] = "stalk"
            eFrame[i] = 0
            eWait[i] = 16
        }
    } else if (st == "drink") {
        // a Cordial, just like yours - and just as easy to interrupt
        im = rhDrink[Math.idiv(eFrame[i], 8) % 2]
        if (eFrame[i] == 1) {
            rhCordials += -1
        }
        if (eFrame[i] == 32) {
            eHP[i] = Math.min(eMaxHP[i], eHP[i] + Math.idiv(eMaxHP[i], 4))
            music.play(music.melodyPlayable(music.powerUp), music.PlaybackMode.InBackground)
        }
        if (eFrame[i] > 44) {
            eState[i] = "stalk"
            eFrame[i] = 0
            eWait[i] = 10
        }
    } else if (st == "hurt") {
        im = rhHurt
        if (eFrame[i] > 18) {
            eState[i] = "stalk"
            eFrame[i] = 0
            eWait[i] = 12
        }
    } else if (st == "parry") {
        // he turned your third swing aside
        im = rhParry
        if (eFrame[i] > 6) {
            eState[i] = "riposte"
            eFrame[i] = 0
        }
    } else if (st == "riposte") {
        im = rhThrust
        if (d > 14 && eFrame[i] < 6) {
            eX[i] = eX[i] + eDir[i] * 2
        }
        if (eFrame[i] == 6) {
            music.play(music.melodyPlayable(music.bigCrash), music.PlaybackMode.InBackground)
            if (d < 26 && Math.abs(py - eH[i]) < 20) {
                dmgIn += 40
                dmgDir = eDir[i]
            }
        }
        if (eFrame[i] > 26) {
            rhRecover(i, 16)
        }
    } else if (st == "dying") {
        im = rhDead
    }
    return im
}
function rhRecover(i: number, ticks: number) {
    eState[i] = "recover"
    eFrame[i] = 0
    eWait[i] = ticks
}
function rhStartRoll(i: number, dir: number) {
    rhRollDir = dir
    eState[i] = "roll"
    eFrame[i] = 0
    music.play(music.melodyPlayable(music.footstep), music.PlaybackMode.InBackground)
}
// one knife straight at you, or a fan of three
function rhThrowKnives(i: number, fan: boolean) {
    let sx = eX[i] + eDir[i] * 12
    let sy = GROUND - 34
    let dx = px - sx
    let dy = GROUND - py - 10 - sy
    let d = Math.max(1, Math.sqrt(dx * dx + dy * dy))
    let base = Math.atan2(dy, dx)
    let reach = Math.min(150, d + 30)
    if (fan) {
        for (let k = -1; k <= 1; k++) {
            let a = base + k * 0.22
            launchKnife(i, sx, sy, Math.cos(a), Math.sin(a), reach, 50)
        }
    } else {
        launchKnife(i, sx, sy, dx / d, dy / d, reach, 46)
    }
    music.play(music.melodyPlayable(music.pewPew), music.PlaybackMode.InBackground)
}
// his rules for being hit: 0 = it misses, 1 = it's dealt with here, -1 = carry on with the normal hit
function redHandHit(i: number, heavy: boolean, fromX: number): number {
    let st = eState[i]
    if (st == "throne" || st == "rise" || st == "roll") {
        return 0
    }
    let reeling = st == "parried" || st == "riposted" || st == "stunned"
    let melee = fromX == px
    if (melee && !(reeling) && pState == "light" && combo == 3) {
        // you can't just combo him: he parries the third hit
        eDir[i] = sign(px - eX[i])
        eState[i] = "parry"
        eFrame[i] = 0
        music.play(music.melodyPlayable(music.smallCrash), music.PlaybackMode.InBackground)
        if (amulet == 2) {
            stalwartHit(20, eDir[i])
            rhRecover(i, 14)
        } else {
            pState = "parried"
            pFrame = 0
            atkActive = false
            invuln = 0
            kb = 0 - eDir[i] * 1.4
        }
        return 1
    }
    if (!(reeling) && !(heavy) && (st == "stalk" || st == "recover") && randint(1, 5) == 1) {
        // sometimes he just isn't there
        rhStartRoll(i, sign(eX[i] - fromX))
        return 0
    }
    if (st == "drink") {
        // knocked out of his drink: the Cordial is wasted
        eState[i] = "hurt"
        eFrame[i] = 0
    }
    if (heavy && !(reeling)) {
        rhPoise += 1
        if (rhPoise >= 3) {
            // three heavies and he finally staggers
            rhPoise = 0
            eState[i] = "stunned"
            eFrame[i] = 0
        }
    }
    return -1
}
function redHandFalls(i: number) {
    redHandDead = true
    music.stopAllSounds()
    curMusic = ""
    music.play(music.melodyPlayable(music.bigCrash), music.PlaybackMode.InBackground)
    scene.cameraShake(4, 500)
    eSprites[i].startEffect(effects.ashes, 2000)
    showBanner(bnRedFelled, 150)
    dropAllKnives()
    hornItem.setPosition(eX[i] - 10, 0)
    hornItem.bottom = GROUND
    daggerItem.setPosition(eX[i] + 10, 0)
    daggerItem.bottom = GROUND
    saveGame()
}
// ---------------------------------------------------------------- the throne room, the camp gate, his drops
function updateRedHandScenery() {
    // the flags around his throne, streaming in the wind
    for (let f = 0; f <= rhFlags.length - 1; f++) {
        rhFlags[f].setFlag(SpriteFlag.Invisible, area != 24)
        rhFlags[f].setImage(rhFlagImgs[(Math.idiv(animT, 5) + f) % 3])
    }
    // his health bar while the fight is on
    // (drawn in updateScenery with the Warden's; see bossBarFor())
    // the horn and the Rusted Dagger, where he fell
    let showHorn = redHandDead && !(hasHorn) && area == 24
    let showDagger = redHandDead && !(hasDagger) && area == 24
    if (showHorn && hornItem.bottom != GROUND) {
        hornItem.setPosition(THRONE_X - 20, 0)
        hornItem.bottom = GROUND
    }
    if (showDagger && daggerItem.bottom != GROUND) {
        daggerItem.setPosition(THRONE_X, 0)
        daggerItem.bottom = GROUND
    }
    hornItem.setFlag(SpriteFlag.Invisible, !(showHorn))
    daggerItem.setFlag(SpriteFlag.Invisible, !(showDagger))
    if (gameState == "play" && py == 0) {
        if (showHorn && Math.abs(px - hornItem.x) < 8) {
            hasHorn = true
            music.play(music.melodyPlayable(music.powerUp), music.PlaybackMode.InBackground)
            showBanner(bnHorn, 90)
            saveGame()
        } else if (showDagger && Math.abs(px - daggerItem.x) < 8) {
            hasDagger = true
            music.play(music.melodyPlayable(music.powerUp), music.PlaybackMode.InBackground)
            showBanner(bnDagger, 90)
            saveGame()
        }
    }
}
// lifting the bar on the camp gate opens the way to the throne for good
function liftTheBar() {
    campGateOpen = true
    waitRelease = true
    music.play(music.melodyPlayable(music.bigCrash), music.PlaybackMode.InBackground)
    scene.cameraShake(2, 200)
    scene.setBackgroundImage(bgCamp3Open)
    saveGame()
}
