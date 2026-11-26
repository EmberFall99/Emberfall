// ---------------------------------------------------------------- the boss
function damageBoss(dmg: number) {
    bossHP += 0 - dmg
    music.play(music.melodyPlayable(music.zapped), music.PlaybackMode.InBackground)
    if (bossHP <= 0) {
        bossHP = 0
        bState = "dying"
        bFrame = 0
        bossDead = true
        bossActive = false
        music.stopAllSounds()
        music.play(music.melodyPlayable(music.bigCrash), music.PlaybackMode.InBackground)
        boss.startEffect(effects.ashes, 2500)
        souls += 2000
        info.setScore(souls)
        showBanner(bnFelled, 150)
    } else if (bPhase == 1 && bossHP <= 140) {
        // phase 2: faster attacks, and the slam sends out fire waves
        bPhase = 2
        bState = "roar"
        bFrame = 0
        showBanner(bnRage, 40)
    }
}
function bossThink() {
    bFrame += 1
    let dist = px - bx
    let wMul = 1
    if (bPhase == 2) {
        wMul = 0.7
    }
    if (atkActive && bLast != atkID && Math.abs(bx - atkX) < atkRange + 10 && py < 30 && bState != "dying") {
        bLast = atkID
        damageBoss(atkDmg)
    }
    let im = bf(bIdle)
    if (bState == "stalk") {
        bDir = sign(dist)
        if (Math.abs(dist) > 30) {
            bx += bDir * (0.3 + bPhase * 0.17)
            if (Math.idiv(animT, 10) % 2 == 0) {
                im = bf(bWalkA)
            } else {
                im = bf(bWalkB)
            }
        }
        if (bFrame > 40 - bPhase * 12) {
            if (Math.abs(dist) < 42) {
                bPick = randint(1, 2)
                bFrame = 0
                if (bPick == 1) {
                    bState = "slam"
                } else {
                    bState = "sweep"
                }
            } else if (Math.abs(dist) > 57 && (randint(1, 40) == 1 || bFrame > 110)) {
                bState = "charge"
                bFrame = 0
                bDashHit = false
            }
        }
    } else if (bState == "slam") {
        // slow overhead slam: roll through it
        wUp = Math.round(32 * wMul)
        if (bFrame < wUp) {
            im = bf(bRaise)
        } else {
            im = bf(bSlam)
        }
        if (bFrame == wUp) {
            music.play(music.melodyPlayable(music.bigCrash), music.PlaybackMode.InBackground)
            scene.cameraShake(4, 300)
            if ((px - bx) * bDir > -3 && (px - bx) * bDir < 42 && py < 23) {
                dmgIn += 34
                dmgDir = bDir
            }
            if (bPhase == 2) {
                spawnFireWave(bx + bDir * 30, 1)
                spawnFireWave(bx + bDir * 30, -1)
            }
        }
        if (bFrame > wUp + 34) {
            bState = "stalk"
            bFrame = 0
        }
    } else if (bState == "sweep") {
        // low sweep: jump over it
        wUp = Math.round(22 * wMul)
        if (bFrame < wUp) {
            im = bf(bSweepUp)
        } else if (bFrame < wUp + 12) {
            im = bf(bSweep)
        }
        if (bFrame == wUp + 2) {
            music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
            if (Math.abs(px - (bx + bDir * 18)) < 27 && py < 7) {
                dmgIn += 24
                dmgDir = bDir
            }
        }
        if (bFrame > wUp + 26) {
            bState = "stalk"
            bFrame = 0
        }
    } else if (bState == "charge") {
        // keep your distance and he charges
        wUp = Math.round(28 * wMul)
        if (bFrame < wUp) {
            im = bf(bCrouch)
        } else if (bFrame < wUp + 36) {
            im = bf(bCharge)
            if (bFrame == wUp) {
                music.play(music.melodyPlayable(music.thump), music.PlaybackMode.InBackground)
            }
            bx += bDir * (2.7 + bPhase * 0.3)
            if (!(bDashHit) && Math.abs(px - bx) < 13 && py < 20) {
                dmgIn += 28
                dmgDir = bDir
                bDashHit = true
            }
            if (bx < 12 || bx > 148) {
                bFrame = wUp + 36
            }
        }
        if (bFrame > wUp + 60) {
            bState = "stalk"
            bFrame = 0
        }
    } else if (bState == "roar") {
        im = bf(bRoar)
        if (bFrame == 2) {
            music.play(music.melodyPlayable(music.spooky), music.PlaybackMode.InBackground)
            scene.cameraShake(3, 600)
        }
        if (bFrame > 55) {
            bState = "stalk"
            bFrame = 0
        }
    } else if (bState == "dying") {
        // the fire inside goes out as he dies, and his embers pour out as he fades
        im = bDead[0]
        if (bFrame == 55) {
            spawnEmbers(bx, GROUND - 30, 30)
        }
    }
    bx = Math.min(Math.max(bx, 12), 148)
    boss.setImage(faced(im, bDir))
}
// once enraged, the Warden glows from within: flick between two "hot" versions of each frame
function bf(frames: Image[]): Image {
    if (bPhase == 1) {
        return frames[0]
    }
    return frames[1 + Math.idiv(animT, 6) % 2]
}
function spawnFireWave(x: number, dir: number) {
    let fw = sprites.create(waveImgs[0], SpriteKind.FireWave)
    fw.x = x
    fw.bottom = GROUND
    fw.vx = dir * 55
    fw.setFlag(SpriteFlag.AutoDestroy, true)
    animation.runImageAnimation(fw, waveImgs, 100, true)
}
function updateBoss() {
    if (area == 5 && (bossActive || bState == "dying")) {
        bossThink()
    }
    boss.x = bx
    boss.bottom = GROUND
    boss.setFlag(SpriteFlag.Invisible, !(area == 5 && gameState != "title" && (!(bossDead) || bState == "dying" && bFrame < 70)))
}
