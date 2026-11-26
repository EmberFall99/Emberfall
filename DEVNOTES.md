# Emberfall – developer notes

Everything needed to pick this project up again, including in a fresh Claude conversation.
**If you're a new session: read this whole file before changing anything.**

Current version: **v0.6.2** (shown bottom-left of the title screen; the `VERSION` constant in `main.ts`).

---

## 1. What it is

A slow, resource-managing souls-like for **MakeCode Arcade** (160×120, 16-colour palette).
Originally conceived by Charlie under the title *To My Inexorable End*. Began as a Year 7 showcase;
now a personal project. A separate, earlier **Scratch** version lives in `scratch/` (finished, not developed further).

Tone: bleak and quiet, punctured by occasional oddball characters (Glargon). Mechanics are discovered by
playing; no tutorials. Dark Souls is the reference point throughout.

## 2. Working on it

- **The repo's `.ts` files are the master copy of the code.** Edit them directly (in Arcade or by hand).
  Charlie may commit from Arcade, so always **pull before changing anything**.
- **Art is generated from code** (`tools/art/*.py`) and written into `images.g.jres` / `images.g.ts` / `art.ts`
  by `python3 tools/build_assets.py`. Never hand-edit `images.g.ts` (Arcade regenerates it) or `art.ts`.
  Charlie can also edit any image in Arcade's Assets tab; if he does, those edits live only in
  `images.g.jres` – re-running `build_assets.py` would overwrite them, so check with him first.
- **Use the JavaScript view.** The project is too large and multi-file for Blocks, and the Python view's
  automatic conversion breaks on globals shared across files (it shows "cannot find variables" errors).
  `pxt.json` sets `preferredEditor: tsprj`.
- **Bump `VERSION` in `main.ts` on every push**, and tell Charlie the number – he checks it on the title
  screen to confirm a pull worked. In Arcade, updates arrive via the GitHub button → *Pull changes*.

### Before every push
```
(cd tools && npm install)          # first time only
bash tools/compile_check.sh        # Microsoft's Arcade compiler: must say "Compiled OK"
node tools/test/smoke_test.js      # simulated play-through: must say "All checks passed"
```
Add checks to `smoke_test.js` for every new feature. The harness (`tools/test/harness.js` + `stubs.js`)
fakes the Arcade APIs; if new code uses an API the stubs lack, add it to `stubs.js`.
Neither tool can show what the game *looks* like or how it *feels* – Charlie play-tests that.

## 3. Project layout

| File | Contents |
| --- | --- |
| `kinds.ts` | Header comment + custom `SpriteKind`s |
| `images.g.jres`, `images.g.ts`, `art.ts` | Art (generated – see above) |
| `state.ts` | Every global variable: player, input, combat, souls/bloodstain, world, ladders/ledges, enemy tables, boss, levelling, story flags |
| `helpers.ts` | `faced()`, `queueAction()`, `showBanner()`, `isFree()`, `supportAt()`, `sign()` |
| `world.ts` | `respawn()`, `resetWorld()`, `goToArea()`, `setupEnemy()`, `rest()`, `die()`, `hasBonfire()` |
| `player.ts` | Damage intake, input, combo, heavy, shield block, bow, roll, heal, climbing, physics/area edges, animation |
| `enemies.ts` | `hitEnemy()`, `enemyThink()`, `meleeThink()` (skeleton + skeleton knight), `archerThink()`, arrows |
| `boss.ts` | The Hollow Warden: stalk/slam/sweep/charge/roar, phase 2 (enrage glow + fire waves), death + key ring |
| `scenery.ts` | Bonfires, items, doors/gates, flags, stocks, note, talk prompts, bloodstain, HUD |
| `menus.ts` | Equipment (loadout) menu – uses `game.pushScene()` to freeze the world |
| `levelling.ts` | Stats, costs, bonfire level-up menu, ember particles and the ember glow buff |
| `prologue.ts` | Intro text, falling key, `startNewGame()` |
| `story.ts` | Dialogue box (`say()`), fades, `startScene()`, Glargon's scene, the note |
| `saving.ts` | `saveGame()`, `loadGame()`, `hasSave()` |
| `main.ts` | `VERSION`, the main tick loop, sprite creation, title screen |
| `tools/` | Art generators, asset builder, compile check, play-test harness (Arcade ignores this folder) |
| `scratch/` | The Scratch version (`Emberfall.sb3`) and the Python that generated it |

## 4. How the game works

- **One tick = 33ms** (`game.onUpdateInterval(33, …)` in `main.ts`). `gameState` is `"title"`, `"play"`,
  `"dead"` or `"cutscene"`. All game logic runs inside the tick; nothing uses Arcade physics/overlaps except
  projectiles' `vx`/`vy`.
- **Positions:** `px` is the player's x; `py` is height above the floor (`GROUND = 104`), *not* screen y.
  Ledges: `platArea/platX1/platX2/platH`; ladders: `ladArea/ladX/ladTop`. `supportAt(x, h)` gives ground height.
- **Areas** (single screens, `goToArea(n)`):
  0 Cell → 1 Ashen Gate (bonfire) → 2 Sunken Hall (ladder up to 3) → 4 Archers' Rampart (ledge, locked door)
  → 5 Warden's arena (prison gate) → 6 Frostbitten Field (Glargon) → *teleport* → 7 Still Lake (bonfire, note).
  3 Whispering Woods (bonfire, key, skeleton knight, archer) sits above 2 via ladder/hatch.
  Area edges are handled in `physics()`; only walking/rolling towards an edge changes area.
- **Player states** (`pState`): idle, walk, light (with `combo` 1–3), heavy, block, aim, shoot, loose, roll,
  heal, hurt, climb, waking, dead. `isFree()` = idle/walk. Inputs are buffered for 8 ticks (`buf`).
- **Damage:** enemies never touch `hp`; they add to `dmgIn` and set `dmgDir` (attacker's facing). `takeDamage()`
  applies roll i-frames (first 12 ticks), shield block (front only, costs stamina, can guard-break),
  ember glow (−20%).
- **Player attacks:** `swingHitbox()` sets `atkActive/atkX/atkRange/atkDmg/atkHeavy` and bumps `atkID`;
  each enemy remembers the last `atkID` that hit it (`eLast`), so one swing hits once.
  Bow arrows are sprites (`PlayerArrow`/`PowerArrow`) checked in `arrowHits()`.
- **Enemies** are parallel lists indexed by slot (`eType, eArea, eHome, eH, eMaxHP, eSouls, eAlive, eX, eHP,
  eState, eFrame, eDir, eLast, eKb, eSprites`). To add one: append to every list in `state.ts`.
  Types: `skel`, `knight` (blocks front hits in idle/chase/windup; heavies break it), `archer`.
- **Loadouts** (`loadout`): 0 sword (tap = 3-hit combo, hold = heavy), 1 sword & shield (hold = block;
  dropped by the skeleton knight), 2 bow (tap = arrow, hold = power shot; dropped by the first archer killed).
  Knight art lists are indexed by loadout (walk frames: `loadout * 4 + n`).
- **Levelling:** `lvSta/lvCon/lvStr/lvDex/lvAtt`; cost `100 + 50 × totalLv`; Attunement costs double and is
  capped at 2 levels (5 flasks) via `statMaxed()` – a future item should lift that cap.
  Ember glow: carrying ≥ `EMBER_AT` (1.0) × next level cost → +20% damage, −20% damage taken, +20% stamina regen.
- **Souls-like rules:** resting or dying respawns every enemy (`resetWorld()`); dying drops all souls as a
  bloodstain (`stainSouls/stainArea/stainX/stainH`); items, keys, doors and the boss stay done.
- **Cutscenes:** `startScene()` sets `gameState = "cutscene"` and runs a script with `control.runInParallel`,
  using `say(name, text)` (typed text, 24 chars × 4 lines per page, A to advance), `fadeOut/fadeIn(white)`
  and plain `pause()`s. Unknown characters speak as **???** until named.
- **Saving** (`saving.ts`, Arcade `settings`): keys `ef_saved` (1/0), `ef_stats` `[lvSta, lvCon, lvStr, lvDex,
  lvAtt, souls, spawnArea, spawnX, loadout, stainSouls, stainArea, stainX, stainH]`, `ef_flags` `[hasShield,
  hasBow, hasKey, doorOpen, hasCellKey, cellOpen, bossDead, hasKeyRing, gateOpen, glargonFreed, teleported]`,
  `ef_visited` (per area). **Only ever append to these arrays** so old saves keep loading.
  Saves happen on rest, respawn, pickups, doors and story moments.

## 5. Story so far (exact text)

**Intro** (each line fades in/out; `|` = line break on screen):
The past is the past. / Whatever happened before, it is done now. / The King is dead. / The fire is dying. /
The embers fall on desecrated soil. / All you can do is march onwards. / To your inexorable end.
Then a key falls; you wake in a cell.

**The man in the stocks** (??? → Glargon Jones), Frostbitten Field:
1. "Good heavens. Is that - a kindling? No, something else. Where did you get those embers? Surely you didn't slay the Warden? No matter. Let me out will you, old chap? I dread to think how long it's been."
2. (stocks open, he stretches, transforms into a wizard) "Much better. What a state it is around here. You know, for the longest time there was a horrible smell. Anyway, you wouldn't want to stay much longer around here. Come. We'll go together."
3. He teleports you both; you wake alone at the Still Lake.

**Note** (re-readable): "Fancy a glass of wine? Find me at the top of that mountain. I owe you a drink at least, friend. - Glargon Jones"

Lore thread: the player is mistaken for a "kindling" – but is "something else". The uncorrupted bandit echoes it.

## 6. Roadmap (agreed with Charlie)

### Chunk 2 – the village and the corrupted bandits *(next)*
- East of the Still Lake: a ramshackle village of a few buildings. Doors lead into interior rooms (separate screens).
- **Building 1:** empty until you reach the middle, then **2 corrupted bandits** spawn (an ambush).
- **Building 2:** the **uncorrupted bandit** (speaks as ???). Brief dialogue, then fade to black → he's gone → fade back. His words:
  "You're late. I'd tell you how long I've been waiting here for you, but I can't remember. Did you find Glargon? Good. It's best we make our way there. My legs feel a little numb. We're not Kindlings, brother. We are destined for more. Our adventure finally begins. I will stick to the shadows. You brave the beaten path."
- **Corrupted bandit** (new mob, assassin type): high mobility. On each of your hits that would land, roll a d6:
  **1 = it parries you, 2 = it dashes away and dodges, 3–6 = the hit lands.** Any heavy attack (sword heavy,
  bow power shot) stuns it. ~150 souls each. **The first bandit killed drops the Farsight Amulet.**
- Being parried (until Stalwart exists): you're stunned ~1s and the bandit ripostes for heavy damage.

### Chunk 3 – parrying, amulets, the shop
- **Amulet slot:** one amulet equipped at a time; add it to the equipment menu.
- **Farsight Amulet** (bandit drop): lets you parry – if your attack lands during an enemy attack's
  about-to-hit window, you parry instead of trading blows and the enemy is stunned.
- **Riposte:** only after a *parry* (not heavy-stuns). Your next melee attack on the stunned enemy becomes a
  unique run-through animation (lunge, blade through, pause, pull free), about 3× damage. Not possible with the bow.
- **Stalwart Amulet:** when an enemy parries you, no stun; the riposte becomes a normal hit at 50% damage.
- **Focus Amulet:** the roll becomes a much faster dash, same invincibility window.
- **Shop:** past the village. A silent merchant – a woman behind a translucent blue veil, wearing many amulets.
  Press A to open her menu. Stalwart and Focus cost **1,500 souls** each.

### Later
- Glargon at the top of the mountain (the glass of wine). A way back to earlier areas later (like Dark Souls' crow).
- An item that lifts the 5-flask Attunement cap.

## 7. Known limits / gotchas

- MakeCode's long-text dialog miscounts blank lines – never put `\n\n` in `game.showLongText`.
- Arcade font is 6px per character: 26 characters max across the screen, 24 in the dialogue box.
- Static TypeScript: no ternaries are needed, but keep to simple JS (no classes required); `for…of` and closures are fine.
- Big images are fine in the browser; this game won't fit on cheap Arcade handheld hardware.
