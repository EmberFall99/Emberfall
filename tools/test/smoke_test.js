// Plays through the main beats of the game with simulated buttons and checks each one.
// Run from the repo root:  node tools/test/smoke_test.js
const { load } = require('./harness');
let failures = 0;
function check(name, ok, detail) { console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  (' + detail + ')' : '')); if (!ok) failures++; }

// ---- new game: the intro plays, you wake in the cell, take the key, open the door
let G = load({});
check('intro shows its last line', G.printed.includes('To your inexorable end.'));
check('new game starts in the cell, waking', G.get('area') == 0 && G.get('pState') == 'waking');
G.run(70); G.run(60, ['right']);
check('picking up the fallen key', G.get('hasCellKey'));
G.run(90, ['right']);
check('cell door opens and leads to the Ashen Gate', G.get('cellOpen') && G.get('area') == 1);

// ---- combat: the 3-hit combo, a skeleton kill, embers flying in
G.set('px', 58); G.set('pState', 'idle'); G.set('invuln', 1e9);
const seq = []; G.run(2, ['A']); for (let i = 0; i < 70; i++) { if (i == 10 || i == 19) G.run(2, ['A']); else G.tick(); const c = G.get('pState') + G.get('combo'); if (seq[seq.length - 1] !== c) seq.push(c); }
check('A A A combo chains slash > backswing > thrust', seq.join(',').startsWith('light1,light2,light3'), seq.join(' > '));
for (let k = 0; k < 15 && G.get('eAlive')[0] == 1; k++) { G.set('px', G.get('eX')[0] - 14); G.set('pDir', 1); G.set('pState', 'idle'); G.set('stamina', 100); G.run(2, ['A']); G.run(25); }
check('first skeleton dies and gives 50 souls', G.get('eAlive')[0] == 0 && G.get('souls') == 50);

// ---- levelling at the bonfire
G.set('souls', 300); G.set('px', 22); G.run(3); G.run(2, ['down']);
check('resting opens the level-up menu', G.paused());
G.press('down'); G.press('A'); G.press('B'); G.run(2);
check('buying Constitution raises max health', G.get('maxHP') == 112 && G.get('souls') == 200);

// ---- the Warden, his key ring, the gate, Glargon, the lake
G.set('doorOpen', true); G.get('goToArea(4)'); G.set('px', 150); G.set('pState', 'idle'); G.run(20, ['right']); G.run(60);
check('the boss wakes in his arena', G.get('area') == 5 && G.get('bossActive'));
for (let i = 0; i < 15 && !G.get('bossDead'); i++) { G.set('invuln', 1e9); G.set('bossHP', 5); G.set('px', G.get('bx') - 14); G.set('pDir', 1); G.set('pState', 'idle'); G.run(2, ['A']); G.run(25); }
G.run(80);
check('the Warden dies and drops his key ring', G.get('bossDead') && G.get('keyRingDropped'));
G.set('px', G.get('keyRingItem').x - 8); G.run(15, ['right']); G.run(90, ['right']);
check('key ring opens the prison gate into the Frostbitten Field', G.get('gateOpen') && G.get('area') == 6 && G.snow());
G.set('px', 105); G.set('pState', 'idle'); G.run(3);
check('A: Talk appears by the stocks', G.get('talkTarget') == 'glargon');
G.keys.add('A'); G.tick(); G.keys.delete('A'); G.run(70);
check("Glargon's scene ends at the Still Lake", G.get('area') == 7 && G.get('teleported') && G.get('spawnArea') == 7);
G.set('px', 60); G.run(3); G.keys.add('A'); G.tick(); G.keys.delete('A'); G.run(3);
check("Glargon's note can be read", G.printed.some(t => t.indexOf('Glargon Jones') >= 0));

// ---- saving and Continue
const saved = JSON.parse(JSON.stringify(G.store));
const H = load(saved);
check('Continue loads back at the lake with progress kept', H.get('area') == 7 && H.get('bossDead') && H.get('glargonFreed') && H.get('maxHP') == 112);

console.log(failures ? failures + ' check(s) FAILED' : 'All checks passed');
process.exit(failures ? 1 : 0);
