// ---------------------------------------------------------------- saving
// resting at a bonfire (and big story moments) saves; "Continue" on the title loads
function bit(b: boolean): number {
    if (b) {
        return 1
    }
    return 0
}
function saveGame() {
    settings.writeNumber("ef_saved", 1)
    // only ever add to the END of these lists, so older saves still load
    settings.writeNumberArray("ef_stats", [lvSta, lvCon, lvStr, lvDex, lvAtt, souls, spawnArea, spawnX, loadout, stainSouls, stainArea, stainX, stainH, amulet])
    settings.writeNumberArray("ef_flags", [bit(hasShield), bit(hasBow), bit(hasKey), bit(doorOpen), bit(hasCellKey), bit(cellOpen), bit(bossDead), bit(hasKeyRing), bit(gateOpen), bit(glargonFreed), bit(teleported), bit(hasFarsight), bit(banditMet), bit(banditGone), bit(hasKatana), bit(campGateOpen), bit(redHandDead), bit(hasHorn), bit(merchantAwake), bit(hasDagger), bit(hasStalwart), bit(hasFocus), bit(hasBrewer), bit(dragonDone)])
    let vis: number[] = []
    for (let v of visited) {
        vis.push(bit(v))
    }
    settings.writeNumberArray("ef_visited", vis)
}
function hasSave(): boolean {
    return settings.exists("ef_saved") && settings.readNumber("ef_saved") == 1
}
function loadGame() {
    let st = settings.readNumberArray("ef_stats")
    lvSta = st[0]
    lvCon = st[1]
    lvStr = st[2]
    lvDex = st[3]
    lvAtt = st[4]
    souls = st[5]
    spawnArea = st[6]
    spawnX = st[7]
    loadout = st[8]
    stainSouls = st[9]
    stainArea = st[10]
    stainX = st[11]
    stainH = st[12]
    if (st.length > 13) {
        amulet = st[13]
    }
    totalLv = lvSta + lvCon + lvStr + lvDex + lvAtt
    maxSta = 100 + 10 * lvSta
    maxHP = 100 + 12 * lvCon
    maxCordials = 3 + lvAtt
    let fl2 = settings.readNumberArray("ef_flags")
    hasShield = fl2[0] == 1
    hasBow = fl2[1] == 1
    hasKey = fl2[2] == 1
    doorOpen = fl2[3] == 1
    hasCellKey = fl2[4] == 1
    cellOpen = fl2[5] == 1
    bossDead = fl2[6] == 1
    hasKeyRing = fl2[7] == 1
    gateOpen = fl2[8] == 1
    glargonFreed = fl2[9] == 1
    teleported = fl2[10] == 1
    if (fl2.length > 12) {
        hasFarsight = fl2[11] == 1
        banditMet = fl2[12] == 1
    }
    if (fl2.length > 13) {
        banditGone = fl2[13] == 1
    }
    if (fl2.length > 14) {
        hasKatana = fl2[14] == 1
    }
    if (fl2.length > 21) {
        campGateOpen = fl2[15] == 1
        redHandDead = fl2[16] == 1
        hasHorn = fl2[17] == 1
        merchantAwake = fl2[18] == 1
        hasDagger = fl2[19] == 1
        hasStalwart = fl2[20] == 1
        hasFocus = fl2[21] == 1
    }
    if (fl2.length > 22) {
        hasBrewer = fl2[22] == 1
    }
    if (fl2.length > 23) {
        dragonDone = fl2[23] == 1
    }
    let vis2 = settings.readNumberArray("ef_visited")
    for (let vi = 0; vi <= vis2.length - 1; vi++) {
        visited[vi] = vis2[vi] == 1
    }
    if (bossDead) {
        bState = "dead"
        if (!(hasKeyRing)) {
            keyRingDropped = true
            keyRingItem.x = 80
            keyRingItem.bottom = GROUND
        }
    }
    info.setScore(souls)
}
