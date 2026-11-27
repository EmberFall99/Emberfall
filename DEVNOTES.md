# Emberfall – developer notes

Everything needed to pick this project up again, including in a fresh Claude conversation.
**If you're a new session: read this whole file before changing anything.**

Current version: **v0.7.1** (shown bottom-left of the title screen; the `VERSION` constant in `main.ts`).

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
- **Music is generated from code too**: `node tools/make_music.js` composes the background tracks and writes
  `music.ts` (songs in the Music editor's own format, encoded with pxt-core's encoder). Four loops:
  `songDark` (title, cell → Warden's arena), `songWind` (Frostbitten Field: wind only), `songLake` (Still Lake:
  mystical), `songTown` (Ashen Forde and the Warren's main path), `songTrees` (the abandoned camp: no music, just
  wind in the trees – Charlie's request) and `songCrypt` (a low drone and dripping water). `updateMusic()` in `world.ts` picks one each tick via
  `musicFor()`; the boss fight swaps in `bossTune`; death is silent until you respawn. If Charlie edits a song
  in Arcade's Music editor, that edit lives in `music.ts` – re-running the script would overwrite it.
- **Use the JavaScript view.** The project is too large and multi-file for Blocks, and the Python view's
  automatic conversion breaks on globals shared across files (it shows "cannot find variables" errors).
  `pxt.json` sets `preferredEditor: tsprj`.
- **Bump `VERSION` in `main.ts` on every push**, and tell Charlie the number – he checks it on the title
  screen to confirm a pull worked. In Arcade, updates arrive via the GitHub button → *Pull changes*.

### Before every push
```
(cd tools && npm install)          # first time only
bash tools/compile_check.sh        # Microsoft's Arcade compiler: must say "Compiled OK" (runs pxt-core from tools/node_modules; no global `pxt` needed)
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
| `tools/art/pixrig4.py` | Chunk 2 art: Ashen Forde backgrounds, bandits, the uncorrupted bandit, the merchant, the Farsight Amulet |
| `tools/art/pixrig5.py` | Chunk 3 art: the Warren, the abandoned camp, the crypt, the knife thrower, the Katana. **Its `PLATS`/`PITS` tables are the layout** – `state.ts` mirrors them and the smoke test checks they match |
| `tools/make_music.js` | Composes the background music into `music.ts` |
| `helpers.ts` | `faced()`, `queueAction()`, `showBanner()`, `isFree()`, `supportAt()`, `sign()` |
| `world.ts` | `respawn()`, `resetWorld()`, `goToArea()`, `setupEnemy()`, `rest()`, `die()`, `hasBonfire()` |
| `player.ts` | Damage intake, input, combo, heavy, shield block, bow, roll, heal, climbing, physics/area edges, animation, doors (`enterBuilding`/`leaveBuilding`), the riposte |
| `enemies.ts` | `hitEnemy()` (incl. the bandit d6), `enemyThink()`, `meleeThink()` (skeleton + skeleton knight), `archerThink()`, `banditThink()`, arrows, Farsight parrying (`inParryWindow`, `parryEnemy`, `reelingThink`) |
| `boss.ts` | The Hollow Warden: stalk/slam/sweep/charge/roar, phase 2 (enrage glow + fire waves), death + key ring |
| `scenery.ts` | Bonfires, items, doors/gates, flags, stocks, note, the bandit + merchant NPCs, talk/enter prompts, Farsight pickup, bloodstain, HUD |
| `menus.ts` | Equipment menu: 3 weapon rows + the amulet slot – uses `game.pushScene()` to freeze the world |
| `levelling.ts` | Stats, costs, bonfire level-up menu, ember particles and the ember glow buff |
| `prologue.ts` | Intro text, falling key, `startNewGame()` |
| `story.ts` | Dialogue box (`say()`), fades, `startScene()`, Glargon's scene, the note, `banditScene()` |
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
  **Ashen Forde** (chunk 2), east of the lake: 7 → 8 the road (signpost, palisade gate) → 9 street 1 → 11 street 2
  → 13 street 3 → 15 the great tree (ladder up to 16, the treehouse: bonfire). East of 15 is closed for now.
  Buildings: each street has a doorway at `DOOR_X` (80); A enters area+1 (10 the ambush house, 12 the church,
  14 the merchant's house). Walking off the left edge of an interior goes back out of the door.
  The treehouse is reached like the Whispering Woods: climb ladder slot 2 in area 15; down the hatch at x 120.
  **The Warren** (chunk 3), east of the great tree: 15 → 17 entrance → 18 the hollow (bonfire at x 100) → 19 deeper
  woods → 20 the edge (Folkewood signpost; east is closed, px clamped at 136).
  Up from the hollow: ladder slot 3 (x 130) → **the abandoned camp** 21 (walled on the left) → 22 the rope bridge
  (a long pit with two plank platforms at height 0 and a gap to jump) → 23 the approach (the throne gate is barred,
  px clamped at 146; **area 24 is kept for the Red Hand's throne**).
  Down from the hollow: A at the broken stair (`HOLE_X` 30, prompt "A: Descend") → **the crypt** 25 → 26 → 27 → 28
  (the Katana on the altar at `KATANA_X`). Walking off the left of 25 climbs back out into the hollow.
  Straight runs use `eastOf()`/`westOf()` in `player.ts`. Ladders: `ladUpTo[l]` is the area the top leads into
  (-1 = ends on a ledge); `hatchHere()` takes you back down through the hatch at the same x.
- **Pits** (`pitArea/pitX1/pitX2`): `supportAt()` returns -999 over a pit unless a platform is there. Falling below
  py -24 over a pit calls `fallDeath()`: you die and your souls are left at the pit's nearer edge.
- **Platforms** are one-way (you can jump up through them). Jump height is ~25px and jump distance ~30px, so
  platforms are at most 20 high (12 apart in the crypt) and gaps at most 22 wide.
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
  Types: `skel`, `knight` (blocks front hits in idle/chase/windup; heavies break it), `archer`, `bandit`, `thrower`.
  Bandits also use `eWait` (ticks before their next attack). The roster is generated in `state.ts` (types, areas,
  homes, heights, HP, souls, `eRevive`); the per-enemy working lists are filled by a loop.
  `setRoam()` (world.ts) gives each enemy `eMin/eMax`: its own platform, or its stretch of ground between pits.
- **Crypt skeletons** (`eRevive` = 1, slots 22–28): when one dies it lies as bones (`bones`, ~170 ticks), then
  `rising`, then fights again at full HP. They give souls every time. (A future magic weapon could stop this.)
- **Knife throwers** (`thrower`, 70 HP, 120 souls): keep their distance and throw a spinning knife that flies out
  along the line to you, past you, and curves back (`throwKnife`/`updateKnives`; `eKnife*` lists, one sprite per
  enemy in `eKnifeSpr`). 22 damage, and it can hit **twice** – once going out, once coming back. Coming back it
  hits you from behind, so the shield blocks the throw but not the return. They can't throw again until it's back.
  Up close (< 22px) they either `hop` backwards (untouchable while hopping) or `slashUp` → `slash` (14 dmg).
  Not part of the d6. Light hits don't stagger them; heavies do. (Toughened in v0.7.1 – Charlie found them too weak.)
- **Corrupted bandits** (slots 6 and 7, area 10): state `hidden` until the player passes x 70, then they appear
  on both sides (the ambush). Slots 8 and 9 wait under the great tree (area 15): `idle` until you're within 90px. States: stalk (circle at ~22–44px, fast), windup → lunge (20 dmg), slashUp → slash
  (16 dmg), recover (the opening), dodge, hurt, parry → riposte (34 dmg), stunned, parried, riposted, dying.
  120 HP, 150 souls. Every non-heavy hit that would land rolls `d6()`: **1** parries (melee: you go into `pState`
  `parried` for 30 ticks and it ripostes; arrows: batted away), **2** dodges (the hit misses), **3–6** lands.
  Heavies (sword heavy, power shot) skip the roll and stun it. Hits on a stunned/parried bandit skip the roll.
  Tests set `forceRoll` to choose the d6. The first bandit killed drops the Farsight Amulet.
- **Amulets** (`amulet`: 0 none, 1 Farsight; one at a time, chosen in the menu's 4th row).
  **Farsight:** the parry is judged **the moment you press attack** (`pressParry()`, from `startLight`, heavy and
  the katana dash): an enemy within 30px in front of you that is inside `inParryWindow()` (the last frames of its
  wind-up, or the start of its strike/lunge) is parried and goes `parried` for 55 ticks. A swing that reaches an
  enemy in the window also still parries. (v0.7.0 widened the windows and moved the check to the press – Charlie
  found the old timing laggy.)
  **Riposte:** attacking (light or heavy, any melee loadout – `isMelee()`) within 26px of a `parried` enemy starts
  `pState = "riposte"`: lunge (0–7), blade through at frame 8 for 54 × melee multiplier, hold, pull free, done at 36.
  You're untouchable during it. A riposte also cuts into the end of a combo/heavy. Heavy-stunned enemies can't be
  riposted. The boss can't be parried.
- **Loadouts** (`loadout`): 0 sword (tap = 3-hit combo, hold = heavy), 1 sword & shield (hold = block;
  dropped by the skeleton knight), 2 bow (tap = arrow, hold = power shot; dropped by the first archer killed),
  3 **Katana** (at the bottom of the crypt): tap = a faster 3-hit chain (10/10/15); hold = `iai`, the sheathed
  charge (up to 36 ticks), release = `iaiDash`: a dash of 8–17 ticks × 4.2px that hits everything it passes
  once, as a heavy (stuns bandits), for (20 + 0.7 × charge) × `katanaMul()`. Invincible while dashing; you can
  dash off a ledge into a pit. Scales with **Dex** (`katanaMul()`; `weaponMul()` picks by loadout).
  Knight art lists are indexed by loadout (walk frames: `loadout * 4 + n`); the melee swing lists have the
  sword's frames in the bow's slot (index 2) so the katana can sit at index 3.
- **Weapon menu:** a scrolling list (`WEAPON_ROWS` = 3 visible, `menuTop`) with the amulet slot underneath.
  To add a weapon: extend `itemNames/itemTap/itemHold/itemHint/itemIcon` and `owns()` in `menus.ts`.
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
  Since v0.6.3: `ef_stats` += `amulet`; `ef_flags` += `hasFarsight, banditMet`, then (v0.6.4) `banditGone`,
  (v0.7.0) `hasKatana`; `loadGame()` checks the lengths.
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

**The uncorrupted bandit** (???), in the church (area 12) – after this he fades out and `banditMet` is set:
"You're late. I'd tell you how long I've been waiting here for you, but I can't remember. Did you find Glargon? Good. It's best we make our way there. My legs feel a little numb. We're not Kindlings, brother. We are destined for more. Our adventure finally begins. I will stick to the shadows. You brave the beaten path."
He then waits in the treehouse (area 16) – only if you spoke to him in the church. There he says (then fades out; `banditGone`):
"You've got the farsight amulet I see. Amulets are rare. There's a woman selling them in the shop, but she's asleep on the job. No idea how to wake her. Down the road from here is another village, Folkewood. Crawling with my fallen brothers. I'm going to press on. See you there."

**The merchant** (area 14): unveiled, asleep on her feet behind the counter. Her amulets hang on the wall behind a translucent veil (in the background art). Waking her is still to be designed.

Lore thread: the player is mistaken for a "kindling" – but is "something else". The uncorrupted bandit echoes it.

## 6. Roadmap (agreed with Charlie)

### Chunk 2 – Ashen Forde *(done, v0.6.3)*
The road and signpost, three village streets (ambush house, church, merchant's house), the great tree and the
treehouse; corrupted bandits with the d6; the uncorrupted bandit; the amulet slot, Farsight parrying and the
riposte. The merchant is a placeholder (asleep behind her counter, no interaction yet).
v0.6.4: two more bandits under the great tree, bandit HP 75 → 120, the treehouse speech + fade.

### Chunk 3 – The Warren *(done, v0.7.0)*
The main path to Folkewood (bandits, knife throwers up trees, the hollow bonfire), the abandoned camp above (huts,
the rope bridge, the barred throne gate), the crypt below (pits, ledges, skeletons that get back up, the Katana),
knife throwers, the Katana, the scrolling weapon menu, parrying judged on the press, camp and crypt soundscapes.

### Chunk 4 – The Red Hand *(next)*
- Optional boss in area 24, behind the barred gate at the end of the camp (open the gate in this chunk).
  He sits on a throne surrounded by bodies (blood is fine – this is Charlie's own project now), spears and
  flowing flags, and rises when you approach. About twice the player's size. **One phase.**
- Fast, like the bandits: he dodges, throws knives (like the knife throwers' boomerang knives) and **parries
  the third hit of a combo** (so you can't just combo him). Parrying him with Farsight, then riposting, should be
  the best way to kill him. Several heavies stun him (not every one).
- Drops **1,500 souls** (enough for one amulet), **the horn** and **the Rusted Dagger**.
- **The horn:** at the sleeping merchant, "A: Blow the horn" wakes her; from then on "A: Trade". Charlie may want
  to reuse the horn later.
- **The Rusted Dagger:** a new weapon in the menu. Its attacks always cost stamina, and each one carries you a
  little further forward than other weapons, so it feels nimble. While you carry enough souls for a level-up,
  every attack works as normal **and also** throws a pale orange, glowing ghost dagger that spins forward, cleaves
  through enemies and returns (like the knife throwers' knives). The souls are never spent by this.
- Charlie plans to collect many weapons suited to different stats – the menu already scrolls.

### Then – the remaining amulets, the shop
- **Stalwart Amulet:** when an enemy parries you, you're not stunned; you take the damage of a normal hit,
  reduced by 50%, instead of the stun + riposte.
- **Focus Amulet:** the roll becomes a much faster dash, same invincibility window.
- **Shop:** the merchant's house in Ashen Forde (area 14, already placed). A silent merchant – a woman behind a translucent blue veil, wearing many amulets.
  Press A to open her menu. Stalwart and Focus cost **1,500 souls** each.

### Later
- Glargon at the top of the mountain (the glass of wine). A way back to earlier areas later (like Dark Souls' crow).
- An item that lifts the 5-flask Attunement cap.

## 7. Known limits / gotchas

- MakeCode's long-text dialog miscounts blank lines – never put `\n\n` in `game.showLongText`.
- Arcade font is 6px per character: 26 characters max across the screen, 24 in the dialogue box.
- Static TypeScript: keep to simple JS (no classes needed); ternaries, `for…of` and closures are fine.
- Big images are fine in the browser; this game won't fit on cheap Arcade handheld hardware.
