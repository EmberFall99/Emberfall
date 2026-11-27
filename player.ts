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
        if (!((pState == "roll" && pFrame < 13) || invuln > 0 || pState == "riposte" || pState == "iaiDash")) {
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
            } else if (amulet == 2) {
                // Stalwart: immovable. You take the hit but don't flinch or get knocked back
                hp += 0 - dmgIn
                invuln = 30
                scene.cameraShake(1, 100)
                music.play(music.melodyPlayable(music.thump), music.PlaybackMode.InBackground)
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
        } else if (talkTarget == "descend") {
            descendToCrypt()
        } else if (talkTarget == "lift") {
            liftTheBar()
        } else if (talkTarget == "trade") {
            openShop()
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
        if ((loadout == 0 || loadout == 4) && aHeld == 9) {
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
        if (loadout == 3 && aHeld == 9 && isFree() && py == supportAt(px, py) && stamina > 0) {
            // katana: hand on the hilt, blade in the sheath, charging
            pState = "iai"
            pFrame = 0
        }
    } else {
        if (loadout == 1) {
            if (aHeld > 0 && aHeld < 4) {
                queueAction("light")
            }
        } else if (aHeld > 0 && aHeld < 9) {
            if (loadout == 0 || loadout == 3 || loadout == 4) {
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
        if (pState == "iai") {
            startIaiDash()
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
            } else if (hatchHere() >= 0) {
                // down through the hatch, back down the ladder you came up
                ladder = hatchHere()
                goToArea(ladArea[ladder])
                px = ladX[ladder]
                py = ladTop[ladder] - 8
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
    pressParry()
}
// with the Farsight Amulet, the parry is judged the moment you press attack (not when the blade lands),
// so it feels as responsive as a dodge
function pressParry() {
    if (amulet != 1 || !(isMelee())) {
        return
    }
    for (let q = 0; q <= eType.length - 1; q++) {
        if (eArea[q] == area && eAlive[q] == 1 && inParryWindow(q) && Math.abs(py - eH[q]) < 15) {
            let d = eX[q] - px
            if (Math.abs(d) < 30 && (sign(d) == pDir || Math.abs(d) < 8)) {
                parryEnemy(q)
                // the swing that's starting won't also hit it
                eLast[q] = atkID + 1
            }
        }
    }
}
// attacking an enemy you've just parried runs it through instead (sword only, not the bow)
function tryRiposte(): boolean {
    if ((buf == "light" || buf == "heavy") && isMelee() && stamina > 0 && riposteFoe() >= 0) {
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
        pressParry()
    }
    if (buf == "shoot" && stamina > 0) {
        pState = "shoot"
        pFrame = 0
        buf = ""
    }
    if (buf == "heal") {
        if (cordials > 0) {
            pState = "heal"
            pFrame = 0
            cordials += -1
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
    atkDmg = Math.round(dmg * weaponMul())
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
    if ((pState == "light" && pFrame >= (loadout == 3 ? 6 : 8) || pState == "heavy" && pFrame >= 19) && tryRiposte()) {
        pFrame = 1
    }
    if (pState == "light" && loadout == 3) {
        katanaLight()
    } else if (pState == "light" && loadout == 4) {
        daggerLight()
    } else if (pState == "light") {
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
    if (pState == "heavy" && loadout == 4) {
        daggerHeavy()
    } else if (pState == "heavy") {
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
    if (pState == "roll" && amulet == 3) {
        // Focus Amulet: a much faster dash, with the same invincible frames
        if (pFrame < 10) {
            px += pDir * 3.8
        }
        if (pFrame > 13) {
            pState = "idle"
        }
    } else if (pState == "roll") {
        if (pFrame < 15) {
            px += pDir * 2.2
        }
        if (pFrame > 19) {
            pState = "idle"
        }
    }
    if (pState == "heal") {
        if (pFrame == 20) {
            hp = Math.min(maxHP, hp + cordialHeal())
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
    if (pState == "iai") {
        // charging: stamina doesn't come back while you hold it
        stamDelay = 20
        if (pFrame == 12 || pFrame == 36) {
            music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
        }
    }
    if (pState == "iaiDash") {
        // the draw: a blur across the ground, cutting everything in the way (each foe once)
        px += pDir * 4.2
        atkX = px
        atkActive = true
        if (pFrame >= iaiLen) {
            atkActive = false
            pState = "iaiEnd"
            pFrame = 0
        }
    }
    if (pState == "iaiEnd") {
        if (pFrame > 14) {
            pState = "idle"
        }
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
            if (ladUpTo[ladder] >= 0) {
                // up through the hatch into the area above (the woods, the treehouse, the camp)
                px = ladX[ladder] + 8
                goToArea(ladUpTo[ladder])
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
    // fell into a pit
    if (py < -24 && overPit(px)) {
        fallDeath()
        return
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
    // the Warren: the way on to Folkewood isn't open yet, the camp's throne gate is barred,
    // and the camp is walled off on its left
    if (area == 20 && px > 136) {
        px = 136
    }
    if (area == 23 && px > 146 && !(campGateOpen)) {
        px = 146
    }
    if (area == 21 && px < 10) {
        px = 10
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
        } else if (walkingRight && eastOf(area) >= 0) {
            px = 6
            goToArea(eastOf(area))
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
        } else if (walkingLeft && area == 24 && redHandActive()) {
            // no leaving once he's on his feet
            px = 4
        } else if (walkingLeft && area == 25) {
            // back up the stair into the hollow
            goToArea(18)
            px = HOLE_X + 14
            pDir = 1
        } else if (walkingLeft && westOf(area) >= 0) {
            px = 154
            goToArea(westOf(area))
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
    } else if (pState == "heavy" && loadout == 4) {
        if (pFrame < 7) {
            im = kLeapUp
        } else {
            im = kLeap
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
    } else if (pState == "iai") {
        im = kIai
    } else if (pState == "iaiDash") {
        im = kIaiDash
    } else if (pState == "iaiEnd") {
        im = kIaiEnd
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

// ---------------------------------------------------------------- the Katana
let iaiLen = 10
// quick cuts: the same three-hit chain as the sword, but faster and a touch lighter
function katanaLight() {
    if (combo == 1 || combo == 2) {
        if (pFrame < 5) {
            px += pDir * 0.3
        }
        if (pFrame == 3) {
            music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
            swingHitbox(13, 11, 10, false)
        }
        if (pFrame == 6) {
            atkActive = false
        }
        if (pFrame >= 6 && buf == "light" && stamina > 0) {
            startLight(combo + 1)
        } else if (pFrame > 12) {
            pState = "idle"
        }
    } else {
        if (pFrame > 2 && pFrame < 8) {
            px += pDir * 2
        }
        if (pFrame == 5) {
            music.play(music.melodyPlayable(music.smallCrash), music.PlaybackMode.InBackground)
            swingHitbox(17, 12, 15, false)
        }
        if (pFrame == 9) {
            atkActive = false
        }
        if (pFrame > 18) {
            pState = "idle"
        }
    }
}
// let go of A: the blade leaves the sheath in a dash. The longer the charge, the further and harder.
function startIaiDash() {
    let charge = Math.min(pFrame, 36)
    iaiLen = 8 + Math.idiv(charge, 4)
    pState = "iaiDash"
    pFrame = 0
    atkID += 1
    atkX = px
    atkRange = 10
    atkDmg = Math.round((20 + charge * 0.7) * katanaMul())
    atkHeavy = true
    atkActive = true
    stamina = Math.max(0, stamina - 30)
    stamDelay = 35
    music.play(music.melodyPlayable(music.smallCrash), music.PlaybackMode.InBackground)
    pressParry()
}
// ---------------------------------------------------------------- the Warren's routes
// the next area east / west along a straight run, or -1
function eastOf(a: number): number {
    if (a == 15) {
        return 17
    } else if (a == 17 || a == 18 || a == 19 || a == 21 || a == 22 || a == 25 || a == 26 || a == 27) {
        return a + 1
    } else if (a == 23 && campGateOpen) {
        return 24
    }
    return -1
}
function westOf(a: number): number {
    if (a == 17) {
        return 15
    } else if (a == 18 || a == 19 || a == 20 || a == 22 || a == 23 || a == 24 || a == 26 || a == 27 || a == 28) {
        return a - 1
    }
    return -1
}
// standing on the hatch at the top of a ladder?
function hatchHere(): number {
    for (let h = 0; h <= ladArea.length - 1; h++) {
        if (ladUpTo[h] == area && Math.abs(px - ladX[h]) < 5 && py == 0) {
            return h
        }
    }
    return -1
}
function descendToCrypt() {
    waitRelease = true
    music.play(music.melodyPlayable(music.footstep), music.PlaybackMode.InBackground)
    goToArea(25)
    px = 16
    py = 0
    pDir = 1
    pState = "idle"
}
// the drop takes you; your souls stay at the edge you fell from
function fallDeath() {
    for (let q = 0; q <= pitArea.length - 1; q++) {
        if (pitArea[q] == area && px > pitX1[q] && px < pitX2[q]) {
            if (px - pitX1[q] < pitX2[q] - px) {
                px = pitX1[q] - 4
            } else {
                px = pitX2[q] + 4
            }
        }
    }
    py = 0
    vy = 0
    die()
}

// ---------------------------------------------------------------- the Rusted Dagger
// quick stabs that carry you forward, so it feels nimble. Every attack costs stamina as usual.
// While you carry enough souls to level up (embered), each attack also throws a ghost dagger:
// pale orange, spinning, it cuts through everything in its path and comes back to your hand.
function daggerLight() {
    if (combo == 1 || combo == 2) {
        if (pFrame < 6) {
            px += pDir * 0.9
        }
        if (pFrame == 3) {
            music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
            swingHitbox(11, 10, 9, false)
            ghostDagger()
        }
        if (pFrame == 6) {
            atkActive = false
        }
        if (pFrame >= 6 && buf == "light" && stamina > 0) {
            startLight(combo + 1)
        } else if (pFrame > 11) {
            pState = "idle"
        }
    } else {
        if (pFrame < 8) {
            px += pDir * 1.8
        }
        if (pFrame == 5) {
            music.play(music.melodyPlayable(music.smallCrash), music.PlaybackMode.InBackground)
            swingHitbox(14, 11, 13, false)
            ghostDagger()
        }
        if (pFrame == 9) {
            atkActive = false
        }
        if (pFrame > 16) {
            pState = "idle"
        }
    }
}
// hold A: a leaping stab
function daggerHeavy() {
    if (pFrame > 6 && pFrame < 16) {
        px += pDir * 1.7
    }
    if (pFrame == 11) {
        music.play(music.melodyPlayable(music.smallCrash), music.PlaybackMode.InBackground)
        swingHitbox(13, 12, 22, true)
        ghostDagger()
    }
    if (pFrame == 16) {
        atkActive = false
    }
    if (pFrame > 26) {
        pState = "idle"
    }
}
function ghostDagger() {
    if (embered && knivesOut(-1) < 2) {
        launchKnife(-1, px + pDir * 6, GROUND - py - 12, pDir, 0, 72, 32)
        music.play(music.melodyPlayable(music.magicWand), music.PlaybackMode.InBackground)
    }
}

// how much a Cordial heals (the Brewer's Amulet spices it up: half as much again)
function cordialHeal(): number {
    if (amulet == 4) {
        return 68
    }
    return 45
}
