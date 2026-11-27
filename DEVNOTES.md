# Emberfall – developer notes

Everything needed to pick this project up again, including in a fresh Claude conversation.
**If you're a new session: read this whole file before changing anything.**

Current version: **v0.10.0** (shown bottom-left of the title screen; the `VERSION` constant in `main.ts`).

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
  wind in the trees – Charlie's request; also his throne room once he's dead), `songCrypt` (a low drone and
  dripping water) and `songRedHand` (132 bpm, E minor: war drums, pulsing bass, stabs, a climbing lead). `updateMusic()` in `world.ts` picks one each tick via
  `musicFor()`; the boss fight swaps in `bossTune`; death is silent until you respawn. If Charlie edits a song
  in Arcade's Music editor, that edit lives in `music.ts` – re-running the script would overwrite it.
- **Never keep a `main.py`.** Opening Arcade's Python tab writes one (a Python copy of the code at that moment) and
  adds it to `pxt.json`; it then goes stale and can be converted back over the real code. Remove it if it appears.
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
| `tools/art/pixrig6.py` | Chunk 4 art: the Red Hand (64×56, cloak animated by `phase`), his throne room, the open camp gate, the merchant awake, the horn, the Rusted Dagger + ghost dagger, Stalwart/Focus icons |
| `tools/make_music.js` | Composes the background music into `music.ts` (now with MakeCode's drum kit for the Red Hand) |
| `redhand.ts` | The Red Hand: his AI, his hit rules, his death and drops, the camp gate, his flags |
| `shop.ts` | The merchant: the horn scene and her amulet shop |
| `armour.ts` | The Indentured General's Armour: equip + contract, the curse's numbers, the blood offering, the recolour, `choose()` (A/B question) |
| `dragon.ts` | Folkewood's ice dragon set piece, frozen bandits, `iced()` (recolour any picture to ice) |
| `tools/art/pixrig7.py` | Chunk 5 art: the road to Folkewood, Folkewood's street (before/after), the dragon's wing, head, breath, shadow |
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
  The hollow has no enemies (v0.8.2: Charlie removed its knife thrower – fighting it after every respawn was tedious).
  **Folkewood** (chunk 5): 20 → 29 the road (first frost, Folkewood's palisade gate) → 30 Folkewood's street (seven
  bandits, slots 29–35, `milling`). East of 30 is closed until part two.
- **The dragon** (`dragon.ts`): Glargon's second note lies just inside the gate (`NOTE2_X` 24): "Dragon. – Glargon
  Jones". Reading it, or walking past x 44, starts it (`startDragon`, `dragonT` counts ticks): the music stops, a roar,
  the shadow races over (0–40), a wing sweeps across the top (20–78), the head dips in (78–98), then the breath – a
  column of ice under the head – sweeps right to left down the street from the screen edge (98–160, `breathX` from `BREATH_FROM` 158). Bandits it touches become
  `frozen` (ice-recoloured, untouchable, no souls, for good). It kills you (`frozenDeath`: you're left as an ice
  statue) unless you're mid-roll (i-frames) or you've gone back through the gate (leaving area 30 finishes it without
  you). After: `dragonDone` (saved), the street is buried in frost (`bgFolkeFrozen`), and the music is just wind.
  The dragon is only ever partly on screen. (It's the same ice that froze the Frostbitten Field; Glargon survived it
  in the stocks because he's immune to magic.)
  Up from the hollow: ladder slot 3 (x 130) → **the abandoned camp** 21 (walled on the left) → 22 the rope bridge
  (a long pit with two plank platforms at height 0 and a gap to jump) → 23 the approach (the throne gate is barred,
  until you lift the bar – "A: Lift the bar", `campGateOpen`, saved) → **24 the Red Hand's throne room**.
  A bonfire stands just outside his gate in area 23 (`CAMP_FIRE_X` 64).
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
- **Crypt skeletons** (`eRevive` = 1, slots 21–27): when one dies it lies as bones (`bones`, ~170 ticks), then
  `rising`, then fights again at full HP. They give souls every time. (A future magic weapon could stop this.)
- **Thrown knives** are one shared pool (`kn*` lists in `state.ts`, `KNIVES` = 8 sprites): `launchKnife(owner, …)`,
  `knivesOut(owner)`, `updateKnives()`, `dropAllKnives()` (on every area change and respawn). Owner = the enemy slot,
  or -1 for the Rusted Dagger's ghost dagger. A knife flies out along its line, turns at the half-way point and
  homes back on its thrower's hand. Enemy knives hit you once each way (22); the ghost cuts each foe once each way.
- **Knife throwers** (`thrower`, 70 HP, 120 souls): keep their distance and throw a spinning knife that flies out
  along the line to you, past you, and curves back. 22 damage, and it can hit **twice** – once going out, once coming back. Coming back it
  hits you from behind, so the shield blocks the throw but not the return. They can't throw again until it's back.
  Up close (< 22px) they either `hop` backwards (untouchable while hopping) or `slashUp` → `slash` (14 dmg).
  Not part of the d6. Any hit staggers them (v0.8.1: Charlie's playtests wanted light hits to stun them again;
  the rest of the v0.7.1 toughening stays).
- **Corrupted bandits** (slots 6 and 7, area 10): state `hidden` until the player passes x 70, then they appear
  on both sides (the ambush). Slots 8 and 9 wait under the great tree (area 15): `idle` until you're within 90px. States: stalk (circle at ~22–44px, fast), windup → lunge (20 dmg), slashUp → slash
  (16 dmg), recover (the opening), dodge, hurt, parry → riposte (34 dmg), stunned, parried, riposted, dying.
  120 HP, 150 souls. Every non-heavy hit that would land rolls `d6()`: **1** parries (melee: you go into `pState`
  `parried` for 30 ticks and it ripostes; arrows: batted away), **2** dodges (the hit misses), **3–6** lands.
  Heavies (sword heavy, power shot) skip the roll and stun it. Hits on a stunned/parried bandit skip the roll.
  Tests set `forceRoll` to choose the d6. The first bandit killed drops the Farsight Amulet.
- **The Red Hand** (`redhand`, slot `RH` = 28, area 24, 400 HP, 1,500 souls, `redhand.ts`). Built to feel like a
  bigger, better player, not a monster. Sits on his throne (`throne`) until you pass x 40, then `rise` → `stalk`.
  Moves: a 3-hit chain (`windup`/`cut` with `rhStep` 1–3: 20, 20, 28 dmg), `lungeUp` → `lunge` (26), `throwUp` →
  `throw` (one knife, or a fan of three when you're at range), `roll` (untouchable), `recover` (the opening).
  Below 45% HP with Cordials left (`rhCordials`, 3 per fight) he rolls clear and `drink`s: +25% HP at frame 32;
  hitting him mid-drink wastes it (`hurt`). His rules for being hit are in `redHandHit()`: untouchable on the throne,
  rising or rolling; **he parries the third hit of your combo** (→ you `parried`, his `riposte` does 40; with
  Stalwart you take half a hit instead); 1 in 5 non-heavy hits while he's idle he rolls away; every 3 heavies
  (`rhPoise`) he's `stunned`. He can be Farsight-parried in the end of each wind-up/lunge, and ripostes are the
  best damage. One phase. While the fight is on you can't leave left, his bar shows, and `songRedHand` plays.
  He drops **the horn** and **the Rusted Dagger** where he falls (`redHandDead`, `hasHorn`, `hasDagger`), and
  stays dead after rests. His body is 2× size: `bodyW()`/`bodyH()` widen hit checks for him.
- **The merchant** (area 14, `shop.ts`): asleep until you have the horn – "A: Blow the horn" (`hornScene`,
  `merchantAwake`), then "A: Trade" opens her shop: Stalwart and Focus amulets at `AMULET_PRICE` (1,500) each.
- **Amulets** (`amulet`: 0 none, 1 Farsight, 2 Stalwart, 3 Focus, 4 Brewer's; one at a time. In the menu's amulet slot, A cycles
  through the ones you own and then none – `nextAmulet()`).
  **Stalwart:** ordinary hits don't make you flinch or knock you back (you still take the damage), and being
  parried doesn't stun you – you take half the attacker's normal hit (`stalwartHit`). **Brewer's:** Cordials heal
  68 instead of 45 (`cordialHeal()`). The merchant sells Focus, Brewer's and Stalwart (1,500 each). **Focus:** the roll becomes a dash: 3.8px/tick for 10 ticks, done at 13 (same i-frames).
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
  4 **Rusted Dagger** (from the Red Hand): tap = quick stabs (9/9/13) that carry you ~0.9px/tick forward (the
  finisher 1.8); hold = a leaping stab (22, heavy). Scales with Dex. While `embered` (souls for a level-up), each
  attack also throws a pale orange **ghost dagger** (`ghostDagger()`: out 72px and back, 8 × Dex mult. per foe each
  way, at most 2 out). Souls are never spent.
  Knight art lists are indexed by loadout (walk frames: `loadout * 4 + n`); the melee swing lists have the
  sword's frames in the bow's slot (index 2) so the katana can sit at index 3.
- **Weapon menu:** a scrolling list (`WEAPON_ROWS` = 3 visible, `menuTop`) with the amulet slot underneath.
  To add a weapon: extend `itemNames/itemTap/itemHold/itemHint/itemIcon` and `owns()` in `menus.ts`.
- **Levelling:** `lvSta/lvCon/lvStr/lvDex/lvAtt`; cost `100 + 50 × totalLv`; Attunement costs double and is
  capped at 2 levels (5 Cordials) via `statMaxed()` – a future item should lift that cap.
  Ember glow: carrying ≥ `EMBER_AT` (1.0) × next level cost → +20% damage, −20% damage taken, +20% stamina regen.
- **Souls-like rules:** resting or dying respawns every enemy (`resetWorld()`); dying drops all souls as a
  bloodstain (`stainSouls/stainArea/stainX/stainH`) – drawn as a smouldering heap of embers (`stainImgs`) with
  sparks rising off it (`SpriteKind.Smoulder`, cleared on area change); items, keys, doors and the boss stay done.
- **Cutscenes:** `startScene()` sets `gameState = "cutscene"` and runs a script with `control.runInParallel`,
  using `say(name, text)` (typed text, 24 chars × 4 lines per page, A to advance), `fadeOut/fadeIn(white)`
  and plain `pause()`s. Unknown characters speak as **???** until named.
- **Saving** (`saving.ts`, Arcade `settings`): keys `ef_saved` (1/0), `ef_stats` `[lvSta, lvCon, lvStr, lvDex,
  lvAtt, souls, spawnArea, spawnX, loadout, stainSouls, stainArea, stainX, stainH]`, `ef_flags` `[hasShield,
  hasBow, hasKey, doorOpen, hasCellKey, cellOpen, bossDead, hasKeyRing, gateOpen, glargonFreed, teleported]`,
  `ef_visited` (per area). **Only ever append to these arrays** so old saves keep loading.
  Since v0.6.3: `ef_stats` += `amulet`; `ef_flags` += `hasFarsight, banditMet`, then (v0.6.4) `banditGone`,
  (v0.7.0) `hasKatana`, (v0.8.0) `campGateOpen, redHandDead, hasHorn, merchantAwake, hasDagger, hasStalwart,
  hasFocus`, (v0.8.3) `hasBrewer`, (v0.9.0) `dragonDone`; `loadGame()` checks the lengths.
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

### Item descriptions (Charlie's, exact text – in `menus.ts`; press right in the menu to read them)
- **Sword:** A knight's sword. Well made from fine steel.
- **Sword & Shield:** The shield bears the crest of the Ninth Order.
- **Bow:** A wooden yeoman's bow.
- **Katana:** Shimmers with the glow of meteorite steel. As sharp as the day it was forged.
- **Rusted Dagger:** Once a fine dagger, embellished with engravings. The pommel still bears the symbol of the Shadowed Men.
- **Farsight Amulet:** Bestows the wearer with the ability to see attacks coming. Plagues the wearer with confusing clairvoyant visions. *(flavour only)*
- **Stalwart Amulet:** The wearer becomes immovable, unshakeable. They cannot be stunned, not even by a well placed parry.
- **Focus Amulet:** Focuses the wearer's spatial awareness, boosting their speed. Makes reading at night difficult.
- **Brewer's Amulet:** Spices the Cordial in your flask, increasing its efficacy and improving its flavour.
- **The Red Hand's horn** (key items page): A battle horn, taken from a mountain goat. It looks dusty inside. *(never blown before – may be reused)*
- *Not in the game yet:* **Indentured General's Armour:** Prison armour of the indentured warrior. The Justicar empowers the wearer, but they are a slave to their contract.
  **Fine Amulet:** The wearer gains the ability to appreciate the finer things in life, increasing their handling skills and bolstering their dexterity.
  **Granite Amulet:** The strength of igneous rock bestows the wearer with great strength and constitution. But the wearer becomes groggy, slow even.

### Lore threads (Charlie's)
- **The samurai** (the kneeling skeleton at the crypt altar): an indentured general, bound to do the bidding of another
  faction's ruler, who wanted the Red Hand dead. Searching for him, he fell into the crypt; his katana wasn't magic, so
  the skeletons kept rising, and he never got out. (That's *why* crypt skeletons revive.)
- **The Justicar:** the god of contracts – empowers the indentured, and pardons them at the **Shrine of the Justicar**
  (later in the game) once their contract is fulfilled.
- **The Shadowed Men:** their symbol is on the Rusted Dagger's pommel. The uncorrupted bandit: "I will stick to the shadows."

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

### Chunk 4 – The Red Hand *(done, v0.8.0)*
The camp gate (lift the bar) and a bonfire outside it; the Red Hand's throne room (bodies, blood, spears, flags
in the wind); the Red Hand himself (see §4); the horn wakes the merchant; her shop (Stalwart, Focus); the Rusted
Dagger with its ghost dagger; Estus renamed **Cordial** everywhere; his own drum-driven music.

### Chunk 5 – Folkewood, part one *(done, v0.9.0)*
The road in, the palisade gate, Glargon's note, the dragon, the frozen street.

### Next – Folkewood, part two (agreed)
- Through the frozen street: a section where **cultists on a rooftop** throw ice balls down at you, and a **cultist
  warrior** on the ground whose successive hits freeze you (a **frost meter**, like Dark Souls' frostbite: fills with
  frost attacks; full = frozen for a moment + extra damage). Dragon cultists wear dragon-horn helmets.
- On the roof: **the cultist talisman** – the key to the boss fight.
- Beyond: a **bonfire**, and **your friend**. A: talk –
  "I told you we were more than Kindlings. That dagger was once used to slay my men. But it is rightfully ours. The
  fingers of the red hand owe their success to the Shadowed Men, before they betrayed us. And we owe you an honorary
  membership."  **A = Accept, B = Do not accept.**
  - A: "Take one of our cloaks. Our men are loyal, we watch each other's backs. What's left of us anyway. I'm going to
    keep pushing on, you rest here and I'll find you at the foot of the mountain. Glargon is waiting."
  - B: "No? Well, no matter. You're still one of us in spirit. But you might regret not taking it when we hike that
    mountain. It's very warm I'll have you know. I'll see you there, old friend. Glargon is waiting."
  Then he disappears (fade, as before). He still doesn't give his name.
- **The Shadowed Men covenant** (accepting): a hidden stat, never named in game, like Dark Souls covenants. It
  permanently replaces your cloak until another offer is made – **your red cape changes colour** (recolour the knight
  at runtime). Effects: no damage from ranged attacks that hit you **from behind**; **frost stun duration halved**.
  Consequence: enemies of the Shadowed Men (not yet written) will know you later. Tied to accepting.

### Chunk 6 – the Indentured General's Armour *(done, v0.10.0)*
Built as agreed: the armoured samurai kneels at the crypt altar (`SAMURAI_X` 73, area 28) – "A: Equip Indentured
General's Armour" → `choose()`: "Are you sure? This action can only be undone with a pardon." (A: Equip, B: Leave it).
Equipping (`armourOn`, saved) shows the contract: "THE RED HAND." (or "...Fulfilled." if he's dead – `contractFulfilled()`).
It can't be removed yet. The curse (`armour.ts`): `computeMaxHP()` halves max HP; `cordialHeal()` halves healing;
`walkSpeed()` 1.43 (+30%); roll 2.9px/tick for 11 ticks, done at 15 (same i-frames; Focus still wins);
`jumpPower()` 4.82 / `gravity()` 0.459 = the same height (~25px) and reach at the faster walk, in ~21 ticks;
`curseMul()` ×1.2 to all damage below 30% HP (a red aura shows it; stacks with the ember glow).
**Blood offering:** while armoured, tap B = roll on release; hold B (9 ticks, standing on the ground) = `offering`:
arms out (`kOffer`), −1 HP every 2 ticks (never below 1), red drops rising; let go to stop. Hits interrupt it.
**Look:** `armoured()` recolours every knight frame at runtime (white plate → dark lacquer, grey → deep brown,
plume → gold; the red cape stays – the Shadowed Men covenant will recolour it). The menu gains an armour page.
`forceChoice` (1 = A, 2 = B) is a test hook, like `forceRoll`.

### Later – the pardon and the second contract (agreed)
- **The Shrine of the Justicar** pardons you once your contract is fulfilled; the armour comes off (and halved
  health ends). **Re-equipping** needs a new contract: **the uncorrupted bandit, your friend** – the first place his
  real name may appear (or an optional earlier way to learn it). If he's dead, it can never be worn again.

### Then – Folkewood's cultist boss and the Dragon Tail Glaive (agreed)
- The boss is beyond the friend's bonfire, behind the door the talisman opens. He wields the Glaive.
- **The Dragon Tail Glaive** – the first magic weapon (so crypt skeletons killed with it stay dead). Heavy,
  Strength-based, also scales with **Attunement**. Combo: two cleaving swings and a big thrust. Special (hold): spend a
  Cordial to slam the ground and freeze enemies around you; roll to cancel during the wind-up (no Cordial used if
  cancelled or interrupted). Killing an enemy with the slam gives the Cordial back (one per slam).
- **Attunement rework:** start with 3 Cordials; levels 1–2 add a Cordial each (to 5); levels 3–10 instead make each
  Cordial heal more – about 45 → 65 (4) → 85 (6) → 100 = a full base bar (8) → 220 = a full max-Constitution bar (10).
  Expensive (levels 3–10 cost triple). Brewer's still adds half again; the armour halves it.

### Later
- Glargon at the top of the mountain (the glass of wine). A way back to earlier areas later (like Dark Souls' crow).
- The Shrine of the Justicar (the pardon; your friend's name). Enemies of the Shadowed Men.
- The foot of the mountain, and Glargon at the top (the glass of wine). Maybe reuse the horn.

## 7. Known limits / gotchas

- MakeCode's long-text dialog miscounts blank lines – never put `\n\n` in `game.showLongText`.
- Arcade font is 6px per character: 26 characters max across the screen, 24 in the dialogue box.
- Static TypeScript: keep to simple JS (no classes needed); ternaries, `for…of` and closures are fine.
- Big images are fine in the browser; this game won't fit on cheap Arcade handheld hardware.
