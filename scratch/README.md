# Emberfall (Scratch version)

The first version of Emberfall, built in Scratch as a showcase. Open `Emberfall.sb3` at scratch.mit.edu
(File → Load from your computer). It's finished and not developed further; the main game is the MakeCode Arcade project at the root of this repo.

`tools/` holds the Python that generated the project: `game.py` (all scripts), `art.py` (vector art),
`sounds.py` (synthesised sound effects and music) and `sb3gen.py` (a small compiler from Python to Scratch blocks).
Run `python3 tools/game.py` to rebuild `Emberfall.sb3` (needs Python 3 with numpy, scipy and fontTools).
