// ---------------------------------------------------------------- the prologue
// each line fades up out of the dark, holds, and fades away. "|" splits a line in two.
let introLines = ["The past is the past.", "Whatever happened before,|it is done now.", "The King is dead.", "The fire is dying.", "The embers fall on|desecrated soil.", "All you can do is|march onwards.", "To your inexorable end."]
let introSkipped = false
function introPause(ms: number) {
    let waited = 0
    while (waited < ms && !(introSkipped)) {
        pause(20)
        waited += 20
        if (controller.A.isPressed()) {
            introSkipped = true
        }
    }
}
function drawIntroLine(text: string, colour: number) {
    let ti = introText.image
    ti.fill(0)
    let parts = text.split("|")
    let top = 12 - parts.length * 6
    for (let li = 0; li <= parts.length - 1; li++) {
        ti.printCenter(parts[li], top + li * 12, colour)
    }
}
function playIntro() {
    scene.setBackgroundImage(image.create(160, 120))
    scene.setBackgroundColor(15)
    introSkipped = false
    // dark purple -> grey -> pale -> white: a fade made of palette colours
    let rampUp = [12, 11, 13, 1]
    for (let n2 = 0; n2 <= introLines.length - 1; n2++) {
        let last = n2 == introLines.length - 1
        for (let c of rampUp) {
            if (last && c == 1) {
                c = 4
            }
            drawIntroLine(introLines[n2], c)
            introPause(110)
        }
        if (last) {
            introPause(2800)
        } else {
            introPause(1700)
        }
        for (let c2 = 2; c2 >= 0; c2--) {
            drawIntroLine(introLines[n2], rampUp[c2])
            introPause(110)
        }
        introText.image.fill(0)
        introPause(350)
        if (introSkipped) {
            break
        }
    }
    introText.image.fill(0)
    if (!(introSkipped)) {
        // a key falls out of the dark
        let fallingKey = sprites.create(keyImg, SpriteKind.Scenery)
        fallingKey.setPosition(80, -10)
        fallingKey.ay = 420
        pauseUntil(() => fallingKey.y >= 98)
        fallingKey.y = 98
        fallingKey.vy = -60
        music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
        pauseUntil(() => fallingKey.vy > 0 && fallingKey.y >= 98)
        fallingKey.y = 98
        fallingKey.vy = 0
        fallingKey.ay = 0
        music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
        introPause(1600)
        fallingKey.destroy()
    }
}
function startNewGame() {
    respawn()
    // respawn() passes through the Ashen Gate; forget that so its title card shows when you really arrive
    visited[1] = false
    bannerT = 0
    banner.setFlag(SpriteFlag.Invisible, true)
    goToArea(0)
    px = 30
    pDir = 1
    pState = "waking"
    pFrame = 0
    invuln = 0
}
