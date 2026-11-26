// ---------------------------------------------------------------- player
function takeDamage() {
    if (invuln > 0) {
        invuln += -1
    }
    if (dmgIn > 0) {
        if (embered) {
            dmgIn = Math.round(dmgIn * 0.8)
        }
        // the first 12 ticks of a roll are invincible ("i-frames")
        // (and you can't be touched mid-riposte)
        if (!((pState == "roll" && pFrame < 13) || invuln > 0 || pState == "riposte")) {
            if (pState == "block" && dmgDir == 0 - pDir) {
                // blocked by the shield: costs stamina instead of health
                stamina += 0 - dmgIn * 1.3 * (1 - 0.05 * lvStr)
                stamDelay = 25
                invuln = 8
                kb = dmgDir * 0.8
                music.play(music.melodyPlayable(music.smallCrash), music.PlaybackMode.InBackground)
                if (stamina <= 0) {
                    // guard broken!
                    stamina = 0
                    hp += 0 - Math.idiv(dmgIn, 2)
                    pState = "hurt"
                    pFrame = 0
                    kb = dmgDir * 1.7
                }
            } else {
                hp += 0 - dmgIn
                invuln = 30
                atkActive = false
                kb = dmgDir * 1.7
                scene.cameraShake(2, 150)
                music.play(music.melodyPlayable(music.thump), music.PlaybackMode.InBackground)
                pState = "hurt"
                pFrame = 0
            }
            if (hp <= 0) {
                hp = 0
                die()
            }
        }
        dmgIn = 0
    }
}
function canClimbUp(): number {
    for (let l = 0; l <= ladArea.length - 1; l++) {
        if (ladArea[l] == area && Math.abs(px - ladX[l]) < 5 && py < ladTop[l] - 1) {
            return l
        }
    }
    return -1
}
function canClimbDown(): number {
    for (let l2 = 0; l2 <= ladArea.length - 1; l2++) {
        if (ladArea[l2] == area && Math.abs(px - ladX[l2]) < 9 && py == ladTop[l2]) {
            return l2
        }
    }
    return -1
}
function readInput() {
    if (talkTarget != "" && controller.A.isPressed() && aHeld == 0 && !(waitRelease)) {
        if (talkTarget == "enter") {
            enterBuilding()
        } else {
            startScene(talkTarget)
        }
        return
    }
    // A: tap = attack. Holding A does something different with each loadout.
    if (waitRelease) {
        if (!(controller.A.isPressed())) {
            waitRelease = false
        }
    } else if (controller.A.isPressed()) {
        aHeld += 1
        if (loadout == 0 && aHeld == 9) {
            queueAction("heavy")
        }
        if (loadout == 1 && aHeld >= 4 && isFree() && py == supportAt(px, py)) {
            pState = "block"
            pFrame = 0
        }
        if (loadout == 2 && aHeld == 9 && isFree()) {
            pState = "aim"
            pFrame = 0
        }
    } else {
        if (loadout == 1) {
            if (aHeld > 0 && aHeld < 4) {
                queueAction("light")
            }
        } else if (aHeld > 0 && aHeld < 9) {
            if (loadout == 0) {
                queueAction("light")
            } else {
                queueAction("shoot")
            }
        }
        if (pState == "block") {
            pState = "idle"
        }
        if (pState == "aim") {
            fireArrow(pFrame >= Math.max(8, 15 - lvDex))
            pState = "loose"
            pFrame = 0
        }
        aHeld = 0
    }
    if (controller.B.isPressed()) {
        if (!(bWas)) {
            queueAction("roll")
        }
        bWas = true
    } else {
        bWas = false
    }
    if (controller.up.isPressed()) {
        if (!(upWas) && isFree()) {
            if (canClimbUp() >= 0) {
                ladder = canClimbUp()
                pState = "climb"
            } else {
                queueAction("jump")
            }
        }
        upWas = true
    } else {
        upWas = false
    }
    if (controller.down.isPressed()) {
        if (!(downWas) && isFree()) {
            if (nearFire) {
                rest()
                openLevelMenu()
            } else if (area == 3 && Math.abs(px - 120) < 5 && py == 0) {
                // down the hatch, back to the hall
                goToArea(2)
                ladder = 0
                px = 120
                py = 88
                pState = "climb"
            } else if (area == 16 && Math.abs(px - 120) < 5 && py == 0) {
                // down the hatch, back down the tree
                goToArea(15)
                ladder = 2
                px = 120
                py = 84
                pState = "climb"
            } else if (canClimbDown() >= 0) {
                ladder = canClimbDown()
                pState = "climb"
                py += -1
            } else {
                queueAction("heal")
            }
        }
        downWas = true
    } else {
        downWas = false
    }
    if (bufT > 0) {
        bufT += -1
    } else {
        buf = ""
    }
    if (isFree()) {
        pState = "idle"
        if (controller.right.isPressed()) {
            pDir = 1
            px += 1.1
            pState = "walk"
        }
        if (controller.left.isPressed()) {
            pDir = -1
            px += -1.1
            pState = "walk"
        }
        if (buf != "") {
            startAction()
        }
    }
    if (pState == "block") {
        if (controller.right.isPressed()) {
            pDir = 1
        }
        if (controller.left.isPressed()) {
            pDir = -1
        }
    }
    if (isFree() || pState == "block") {
        if (stamDelay > 0) {
            stamDelay += -1
        } else if (pState == "block") {
            stamina = Math.min(maxSta, stamina + 0.4)
        } else {
            stamina = Math.min(maxSta, stamina + 1.8 * emberMul())
        }
    }
}
function startLight(step: number) {
    pState = "light"
    pFrame = 0
    combo = step
    stamina += -12
    stamDelay = 30
    buf = ""
}
// attacking an enemy you've just parried runs it through instead (sword only, not the bow)
function tryRiposte(): boolean {
    if ((buf == "light" || buf == "heavy") && loadout <= 1 && stamina > 0 && riposteFoe() >= 0) {
        riposteOn = riposteFoe()
        pState = "riposte"
        pFrame = 0
        pDir = sign(eX[riposteOn] - px)
        eState[riposteOn] = "riposted"
        eFrame[riposteOn] = 0
        atkActive = false
        stamina += -12
        stamDelay = 30
        buf = ""
        return true
    }
    return false
}
// every action costs stamina - with none left, the action waits in the buffer
function startAction() {
    tryRiposte()
    if (buf == "roll" && stamina > 0) {
        pState = "roll"
        pFrame = 0
        stamina += -20
        stamDelay = 30
        buf = ""
        music.play(music.melodyPlayable(music.footstep), music.PlaybackMode.InBackground)
        if (controller.right.isPressed()) {
            pDir = 1
        }
        if (controller.left.isPressed()) {
            pDir = -1
        }
    }
    if (buf == "light" && stamina > 0) {
        startLight(1)
    }
    if (buf == "heavy" && stamina > 0) {
        pState = "heavy"
        pFrame = 0
        stamina += -26
        stamDelay = 35
        buf = ""
    }
    if (buf == "shoot" && stamina > 0) {
        pState = "shoot"
        pFrame = 0
        buf = ""
    }
    if (buf == "heal") {
        if (estus > 0) {
            pState = "heal"
            pFrame = 0
            estus += -1
        }
        buf = ""
    }
    if (buf == "jump") {
        if (py == supportAt(px, py) && stamina > 0) {
            vy = 3.7
            stamina += -10
            stamDelay = 20
            music.play(music.melodyPlayable(music.jumpUp), music.PlaybackMode.InBackground)
        }
        buf = ""
    }
    stamina = Math.max(0, stamina)
}
function swingHitbox(reach: number, range: number, dmg: number, heavy: boolean) {
    atkID += 1
    atkX = px + pDir * reach
    atkRange = range
    atkDmg = Math.round(dmg * meleeMul())
    atkHeavy = heavy
    atkActive = true
}
function fireArrow(power: boolean) {
    let arrow: Sprite = null
    if (power) {
        arrow = sprites.create(faced(arrowPower, pDir), SpriteKind.PowerArrow)
        arrow.vx = pDir * 190
        stamina += -20
        music.play(music.melodyPlayable(music.pewPew), music.PlaybackMode.InBackground)
    } else {
        arrow = sprites.create(faced(arrowFlat, pDir), SpriteKind.PlayerArrow)
        arrow.vx = pDir * 140
        stamina += -8
        music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
    }
    stamina = Math.max(0, stamina)
    stamDelay = 25
    arrow.setPosition(px + pDir * 8, GROUND - py - 11)
    arrow.setFlag(SpriteFlag.AutoDestroy, true)
}
// attacks have a wind-up, a few active frames, then recovery
function doAction() {
    pFrame += 1
    // a parried enemy takes priority over the next swing of a combo
    if ((pState == "light" && pFrame >= 8 || pState == "heavy" && pFrame >= 19) && tryRiposte()) {
        pFrame = 1
    }
    if (pState == "light") {
        // the 3-hit combo: tap A again during the recovery to chain the next swing
        if (combo == 1) {
            if (pFrame < 8) {
                px += pDir * 0.35
            }
            if (pFrame == 5) {
                music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
                swingHitbox(12, 10, 12, false)
            }
            if (pFrame == 9) {
                atkActive = false
            }
            if (pFrame >= 9 && buf == "light" && stamina > 0) {
                startLight(2)
            } else if (pFrame > 17) {
                pState = "idle"
            }
        } else if (combo == 2) {
            if (pFrame < 6) {
                px += pDir * 0.35
            }
            if (pFrame == 4) {
                music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
                swingHitbox(12, 10, 12, false)
            }
            if (pFrame == 8) {
                atkActive = false
            }
            if (pFrame >= 8 && buf == "light" && stamina > 0) {
                startLight(3)
                stamina += -4
            } else if (pFrame > 16) {
                pState = "idle"
            }
        } else {
            // finisher: a lunging thrust with longer reach
            if (pFrame > 5 && pFrame < 11) {
                px += pDir * 2
            }
            if (pFrame == 8) {
                music.play(music.melodyPlayable(music.smallCrash), music.PlaybackMode.InBackground)
                swingHitbox(16, 12, 18, false)
            }
            if (pFrame == 13) {
                atkActive = false
            }
            if (pFrame > 24) {
                pState = "idle"
            }
        }
    }
    if (pState == "heavy") {
        if (pFrame > 11 && pFrame < 18) {
            px += pDir * 0.8
        }
        if (pFrame == 14) {
            music.play(music.melodyPlayable(music.smallCrash), music.PlaybackMode.InBackground)
            swingHitbox(14, 13, 28, true)
        }
        if (pFrame == 19) {
            atkActive = false
        }
        if (pFrame > 33) {
            pState = "idle"
        }
    }
    if (pState == "shoot") {
        if (pFrame == 4) {
            fireArrow(false)
        }
        if (pFrame > 13) {
            pState = "idle"
        }
    }
    if (pState == "loose") {
        if (pFrame > 10) {
            pState = "idle"
        }
    }
    if (pState == "roll") {
        if (pFrame < 15) {
            px += pDir * 2.2
        }
        if (pFrame > 19) {
            pState = "idle"
        }
    }
    if (pState == "heal") {
        if (pFrame == 20) {
            hp = Math.min(maxHP, hp + 45)
            music.play(music.melodyPlayable(music.powerUp), music.PlaybackMode.InBackground)
        }
        if (pFrame > 36) {
            pState = "idle"
        }
    }
    if (pState == "hurt" || pState == "block") {
        px += kb
        kb = kb * 0.8
        if (pState == "hurt" && pFrame > 14) {
            pState = "idle"
        }
    }
    if (pState == "parried") {
        // a bandit turned your blade aside: you reel, wide open
        px += kb
        kb = kb * 0.8
        if (pFrame > 30) {
            pState = "idle"
        }
    }
    if (pState == "riposte") {
        doRiposte()
    }
    if (pState == "waking") {
        if (pFrame > 54) {
            pState = "idle"
        }
    }
    if (pState == "climb") {
        px = ladX[ladder]
        if (controller.up.isPressed()) {
            py += 0.9
        }
        if (controller.down.isPressed()) {
            py += -0.9
        }
        if (py >= ladTop[ladder]) {
            if (area == 2) {
                // up through the ceiling into the woods
                goToArea(3)
                px = 128
                py = 0
            } else if (area == 15) {
                // up the great tree, into the treehouse
                goToArea(16)
                px = 128
                py = 0
            } else {
                // step off the top of the ladder onto the ledge
                py = ladTop[ladder]
                px = ladX[ladder] + 5
            }
            pState = "idle"
        }
        if (py <= 0) {
            py = 0
            pState = "idle"
        }
    }
}
function physics() {
    if (pState != "climb") {
        let sup = supportAt(px, py)
        vy += -0.27
        py += vy
        if (py <= sup) {
            py = sup
            vy = 0
        }
    }
    let walkingRight = (pState == "walk" || pState == "roll") && pDir == 1
    let walkingLeft = (pState == "walk" || pState == "roll") && pDir == -1
    // the locked doors
    if (area == 4 && !(doorOpen) && py < 30 && px > 143) {
        px = 143
    }
    if (area == 0 && !(cellOpen) && px > 141) {
        px = 141
    }
    if (area == 5 && !(gateOpen) && px > 141) {
        px = 141
    }
    if (px > 156) {
        if (walkingRight && area == 0) {
            px = 6
            goToArea(1)
        } else if (walkingRight && area == 1) {
            px = 6
            goToArea(2)
        } else if (walkingRight && area == 2) {
            px = 6
            goToArea(4)
        } else if (walkingRight && area == 4 && py < 10) {
            px = 6
            goToArea(5)
        } else if (walkingRight && area == 5 && gateOpen) {
            px = 6
            goToArea(6)
        } else if (walkingRight && (area == 7 || area == 8 || area == 9 || area == 11 || area == 13)) {
            // east from the lake: the road, through the gate, down the village street, out to the great tree
            px = 6
            if (area == 7) {
                goToArea(8)
            } else if (area == 8) {
                goToArea(9)
            } else if (area == 9) {
                goToArea(11)
            } else if (area == 11) {
                goToArea(13)
            } else {
                goToArea(15)
            }
        } else {
            px = 156
        }
    }
    if (px < 4) {
        if (walkingLeft && area == 1) {
            px = 154
            goToArea(0)
        } else if (walkingLeft && area == 2) {
            px = 154
            goToArea(1)
        } else if (walkingLeft && area == 4) {
            px = 154
            goToArea(2)
        } else if (walkingLeft && area == 5 && !(bossActive)) {
            px = 150
            goToArea(4)
        } else if (walkingLeft && area == 6 && !(teleported)) {
            px = 136
            goToArea(5)
        } else if (walkingLeft && (area == 8 || area == 9 || area == 11 || area == 13 || area == 15)) {
            px = 154
            if (area == 8) {
                goToArea(7)
            } else if (area == 9) {
                goToArea(8)
            } else if (area == 11) {
                goToArea(9)
            } else if (area == 13) {
                goToArea(11)
            } else {
                goToArea(13)
            }
        } else if (walkingLeft && (area == 10 || area == 12 || area == 14)) {
            // out of the door you came in by
            leaveBuilding()
        } else {
            px = 4
        }
    }
}
function animateKnight() {
    let im = kIdle1[loadout]
    animT += 1
    if (isFree()) {
        if (py > supportAt(px, py)) {
            im = kJump[loadout]
        } else if (pState == "walk") {
            im = kWalk[loadout * 4 + Math.idiv(animT, 5) % 4]
        } else if (Math.idiv(animT, 20) % 2 == 1) {
            im = kIdle2[loadout]
        }
    } else if (pState == "light") {
        if (combo == 1) {
            if (pFrame < 5) {
                im = kWindup[loadout]
            } else if (pFrame < 11) {
                im = kSlash[loadout]
            } else {
                im = kWindup2[loadout]
            }
        } else if (combo == 2) {
            if (pFrame < 4) {
                im = kWindup2[loadout]
            } else {
                im = kSlash2[loadout]
            }
        } else if (pFrame < 7) {
            im = kWindup3[loadout]
        } else {
            im = kThrust[loadout]
        }
    } else if (pState == "heavy") {
        if (pFrame < 14) {
            im = kHeavyUp
        } else {
            im = kHeavySlash
        }
    } else if (pState == "block") {
        im = kBlock
    } else if (pState == "aim" || pState == "shoot" && pFrame < 4) {
        im = kDraw
    } else if (pState == "shoot" || pState == "loose") {
        im = kLoose
    } else if (pState == "roll") {
        im = kRoll[Math.idiv(pFrame, 4) % 4]
    } else if (pState == "climb") {
        im = kClimb[Math.idiv(Math.round(py), 4) % 2]
    } else if (pState == "heal") {
        im = kDrink[loadout]
    } else if (pState == "hurt" || pState == "parried") {
        im = kHurt[loadout]
    } else if (pState == "riposte") {
        if (pFrame < 8) {
            im = kWindup3[loadout]
        } else if (pFrame < 26) {
            im = kThrust[loadout]
        } else {
            im = kWindup2[loadout]
        }
    } else if (pState == "dead") {
        im = kDead
    } else if (pState == "waking") {
        if (pFrame < 34) {
            im = kDead
        } else {
            im = kHurt[loadout]
        }
    }
    knight.setImage(faced(im, pDir))
    knight.x = px
    knight.bottom = GROUND - py
    // flicker while invincible after a hit
    knight.setFlag(SpriteFlag.Invisible, gameState == "title" || (invuln > 8 && pState != "roll" && invuln % 6 < 3))
}

// ---------------------------------------------------------------- doors (Ashen Forde)
function enterBuilding() {
    waitRelease = true
    music.play(music.melodyPlayable(music.footstep), music.PlaybackMode.InBackground)
    goToArea(area + 1)
    px = 22
    py = 0
    pDir = 1
    pState = "idle"
}
function leaveBuilding() {
    goToArea(area - 1)
    px = DOOR_X
    py = 0
    pDir = -1
    pState = "idle"
}
// ---------------------------------------------------------------- the riposte
// an enemy you've parried, close enough and in front of you
function riposteFoe(): number {
    for (let r = 0; r <= eType.length - 1; r++) {
        if (eArea[r] == area && eAlive[r] == 1 && eState[r] == "parried" && Math.abs(eX[r] - px) < 26 && Math.abs(py - eH[r]) < 10) {
            return r
        }
    }
    return -1
}
// lunge, blade through, hold, pull free
function doRiposte() {
    let t = riposteOn
    if (t < 0) {
        pState = "idle"
        return
    }
    if (pFrame < 8) {
        let stand = eX[t] - pDir * 11
        px += Math.max(-2.5, Math.min(2.5, stand - px))
    }
    if (pFrame == 8) {
        music.play(music.melodyPlayable(music.bigCrash), music.PlaybackMode.InBackground)
        scene.cameraShake(3, 250)
        eLast[t] = atkID
        hitEnemy(t, Math.round(54 * meleeMul()), false, px)
        eKb[t] = 0
        if (eState[t] != "dying") {
            eState[t] = "riposted"
        }
    }
    if (pFrame > 25 && pFrame < 34) {
        px += 0 - pDir * 0.6
    }
    if (pFrame > 36) {
        pState = "idle"
        if (eState[t] == "riposted") {
            // it staggers back to its feet
            eState[t] = "stunned"
            eFrame[t] = 25
        }
        riposteOn = -1
    }
}
