# Emberfall

A low-budget souls-like built in [Microsoft MakeCode Arcade](https://arcade.makecode.com).

Fight through the Ashen Gate, the Sunken Hall, the Whispering Woods and the Archers' Rampart, then face the Hollow Warden.

## Open it in MakeCode Arcade

1. Go to <https://arcade.makecode.com>.
2. Click **Import**, then **Import URL**, and paste this repository's URL.
3. To save your changes back here, sign in to GitHub inside MakeCode and use the GitHub button to commit.

## Controls

| Button | Action |
| --- | --- |
| Left / Right | Move |
| Up | Jump, climb |
| Down | Climb, drink a flask, rest at a bonfire |
| B | Roll (invincible for a moment) |
| A (tap) | Attack. Tap A A A for the sword combo |
| A (hold) | Heavy attack / raise shield / power shot, depending on loadout |
| Menu | Equipment |

## Where things are

| File | What's in it |
| --- | --- |
| `images.g.jres` | All the art. Edit it in the **Assets** tab, not by hand |
| `art.ts` | Collects the assets into variables the code uses |
| `state.ts` | Every game variable: player, enemies, levels, world |
| `world.ts` | Areas, respawning, resting, dying |
| `player.ts` | Input, combo, shield, bow, climbing, physics, animation |
| `enemies.ts` | Skeletons, the skeleton knight and archers |
| `boss.ts` | The Hollow Warden |
| `scenery.ts` | Bonfires, key, door, item drops, bloodstain, HUD |
| `menus.ts` | Equipment menu |
| `levelling.ts` | Stats, bonfire level-up menu, embers |
| `main.ts` | The main loop and game start |
