// ---------------------------------------------------------------- helpers
function faced(im: Image, dir: number): Image {
    if (dir < 0) {
        let flipped = im.clone()
        flipped.flipX()
        return flipped
    }
    return im
}
function queueAction(a: string) {
    buf = a
    bufT = 8
}
function showBanner(im: Image, ticks: number) {
    banner.setImage(im)
    banner.setPosition(80, 40)
    banner.setFlag(SpriteFlag.Invisible, false)
    bannerT = ticks
}
function isFree(): boolean {
    return pState == "idle" || pState == "walk"
}
// how high is the ground under x, for something standing at height h?
function supportAt(x: number, h: number): number {
    let best = 0
    for (let q = 0; q <= platArea.length - 1; q++) {
        if (platArea[q] == area && x >= platX1[q] && x <= platX2[q] && h >= platH[q] - 1) {
            best = Math.max(best, platH[q])
        }
    }
    return best
}
function sign(n: number): number {
    if (n < 0) {
        return -1
    }
    return 1
}
