// ---------------------------------------------------------------- story: dialogue, cutscenes, fades
let G1 = "Good heavens. Is that - a kindling? No, something else. Where did you get those embers? Surely you didn't slay the Warden? No matter. Let me out will you, old chap? I dread to think how long it's been."
let G2 = "Much better. What a state it is around here. You know, for the longest time there was a horrible smell. Anyway, you wouldn't want to stay much longer around here. Come. We'll go together."
let BANDIT1 = "You're late. I'd tell you how long I've been waiting here for you, but I can't remember. Did you find Glargon? Good. It's best we make our way there. My legs feel a little numb. We're not Kindlings, brother. We are destined for more. Our adventure finally begins. I will stick to the shadows. You brave the beaten path."
let BANDIT2 = "You've got the farsight amulet I see. Amulets are rare. There's a woman selling them in the shop, but she's asleep on the job. No idea how to wake her. Down the road from here is another village, Folkewood. Crawling with my fallen brothers. I'm going to press on. See you there."
let NOTE_TEXT = "Fancy a glass of wine? Find me at the top of that mountain. I owe you a drink at least, friend.\n- Glargon Jones"
// split text into lines that fit the dialogue box ("\n" forces a new line)
function wrapText(text: string, maxChars: number): string[] {
    let lines: string[] = []
    for (let para of text.split("\n")) {
        let line = ""
        for (let word of para.split(" ")) {
            if (line == "") {
                line = word
            } else if (line.length + 1 + word.length > maxChars) {
                lines.push(line)
                line = word
            } else {
                line = line + " " + word
            }
        }
        lines.push(line)
    }
    return lines
}
function drawDialogue(name: string, page: string[], shown: number, done: boolean) {
    let d = dialogue.image
    d.fill(15)
    d.drawRect(0, 0, 156, 50, 11)
    d.drawRect(1, 1, 154, 48, 12)
    if (name != "") {
        d.print(name, 6, 4, 4)
    }
    let left = shown
    for (let k2 = 0; k2 <= page.length - 1; k2++) {
        if (left > 0) {
            let ln = page[k2]
            d.print(ln.substr(0, Math.min(ln.length, left)), 6, 14 + k2 * 9, 1)
            left += 0 - ln.length
        }
    }
    if (done) {
        d.fillRect(146, 42, 5, 1, 13)
        d.fillRect(147, 43, 3, 1, 13)
        d.fillRect(148, 44, 1, 1, 13)
    }
}
// show a speech box, typing the text out; A finishes the page, then A turns it
function say(name: string, text: string) {
    let lines2 = wrapText(text, 24)
    dialogue.setFlag(SpriteFlag.Invisible, false)
    let start = 0
    while (start < lines2.length) {
        let page2 = lines2.slice(start, start + 4)
        let total = 0
        for (let pl of page2) {
            total += pl.length
        }
        pauseUntil(() => !(controller.A.isPressed()))
        let shown2 = 0
        while (shown2 < total) {
            shown2 += 1
            drawDialogue(name, page2, shown2, false)
            pause(25)
            if (controller.A.isPressed()) {
                shown2 = total
            }
        }
        drawDialogue(name, page2, total, true)
        pauseUntil(() => !(controller.A.isPressed()))
        pauseUntil(() => controller.A.isPressed())
        music.play(music.melodyPlayable(music.footstep), music.PlaybackMode.InBackground)
        start += 4
    }
    pauseUntil(() => !(controller.A.isPressed()))
    dialogue.setFlag(SpriteFlag.Invisible, true)
}
// fades: a full-screen sprite that fills in with a pixel pattern, step by step
let fadeBlack: Image[] = []
let fadeWhite: Image[] = []
function makeFade(level: number, colour: number): Image {
    let im2 = image.create(160, 120)
    let bayer = [0, 2, 3, 1]
    for (let fy = 0; fy <= 119; fy++) {
        for (let fx = 0; fx <= 159; fx++) {
            if (bayer[(fy % 2) * 2 + fx % 2] < level) {
                im2.setPixel(fx, fy, colour)
            }
        }
    }
    return im2
}
function fadeOut(white: boolean) {
    overlay.setFlag(SpriteFlag.Invisible, false)
    for (let f2 = 0; f2 <= 3; f2++) {
        if (white) {
            overlay.setImage(fadeWhite[f2])
        } else {
            overlay.setImage(fadeBlack[f2])
        }
        pause(90)
    }
}
function fadeIn(white: boolean) {
    for (let f3 = 3; f3 >= 0; f3--) {
        if (white) {
            overlay.setImage(fadeWhite[f3])
        } else {
            overlay.setImage(fadeBlack[f3])
        }
        pause(90)
    }
    overlay.setFlag(SpriteFlag.Invisible, true)
}
function startScene(target: string) {
    gameState = "cutscene"
    pState = "idle"
    waitRelease = true
    talkPrompt.setFlag(SpriteFlag.Invisible, true)
    control.runInParallel(function () {
        if (target == "glargon") {
            glargonScene()
        } else if (target == "bandit") {
            banditScene()
        } else if (target == "friend") {
            banditTreeScene()
        } else if (target == "horn") {
            hornScene()
        } else if (target == "note2") {
            say("A note", NOTE2_TEXT)
            gameState = "play"
            waitRelease = true
            startDragon()
        } else {
            say("A note", NOTE_TEXT)
            gameState = "play"
            waitRelease = true
        }
    })
}
function glargonScene() {
    pDir = sign(112 - px)
    say("???", G1)
    // the stocks spring open and he climbs out
    music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
    stocksSprite.setImage(stocksOpenImg)
    glargon.setImage(manStandImg)
    glargon.x = 128
    glargon.bottom = GROUND
    pause(700)
    glargon.setImage(manStretchImg)
    music.play(music.melodyPlayable(music.jumpUp), music.PlaybackMode.InBackground)
    pause(1100)
    // ...and becomes someone else entirely
    glargon.setImage(manGlowImg)
    glargon.startEffect(effects.halo, 900)
    music.play(music.melodyPlayable(music.magicWand), music.PlaybackMode.InBackground)
    for (let flash = 0; flash <= 1; flash++) {
        overlay.setImage(fadeWhite[1])
        overlay.setFlag(SpriteFlag.Invisible, false)
        pause(80)
        overlay.setFlag(SpriteFlag.Invisible, true)
        pause(120)
    }
    glargon.setImage(wizardImg)
    glargon.bottom = GROUND
    pause(900)
    say("???", G2)
    // he raises his staff, and the world folds away
    glargon.setImage(wizardCastImg)
    glargon.bottom = GROUND
    music.play(music.melodyPlayable(music.beamUp), music.PlaybackMode.InBackground)
    glargon.startEffect(effects.coolRadial, 1400)
    knight.startEffect(effects.coolRadial, 1400)
    pause(1300)
    fadeOut(true)
    pause(400)
    fadeOut(false)
    glargonFreed = true
    teleported = true
    goToArea(7)
    px = 60
    py = 0
    pDir = 1
    spawnArea = 7
    spawnX = 40
    pState = "waking"
    pFrame = 0
    saveGame()
    gameState = "play"
    pause(500)
    fadeIn(false)
}
// the uncorrupted bandit, waiting in the church: a few words, then he's gone
function banditScene() {
    pDir = sign(FRIEND_CHURCH_X - px)
    friend.setImage(friendTalkL)
    say("???", BANDIT1)
    fadeOut(false)
    banditMet = true
    pause(900)
    saveGame()
    gameState = "play"
    waitRelease = true
    fadeIn(false)
}
// ...and in the treehouse: his news, then he's gone again
function banditTreeScene() {
    pDir = sign(FRIEND_TREE_X - px)
    say("???", BANDIT2)
    fadeOut(false)
    banditGone = true
    pause(900)
    saveGame()
    gameState = "play"
    waitRelease = true
    fadeIn(false)
}
