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

// ---- chunk 2: the road east, Ashen Forde, the ambush, the d6, the Farsight Amulet, parry + riposte
function tapA() { G.keys.add('A'); G.tick(); G.keys.delete('A'); }
function edge(dir) { G.set('pState', 'idle'); G.set('px', dir == 'right' ? 150 : 10); G.set('py', 0); G.run(12, [dir]); }
edge('right');
check('east of the lake is the road with the Ashen Forde sign', G.get('area') == 8);
edge('right');
check('through the gate into Ashen Forde (title card)', G.get('area') == 9 && G.get('visited')[9]);
G.set('px', 80); G.run(3);
check('A: Enter shows at the first house', G.get('talkTarget') == 'enter');
tapA(); G.run(2);
check('entering the house', G.get('area') == 10 && G.get('px') < 30);
check('the bandits are hidden at first', G.get('eState')[6] == 'hidden' && G.get('eState')[7] == 'hidden');
G.run(50, ['right']);
check('reaching the middle springs the ambush', G.get('eState')[6] != 'hidden' && G.get('eState')[7] != 'hidden' && G.get('px') > 70);
// park bandit 7 out of the way so each test faces one bandit
G.set('eX[7]', 150); G.set('eState[7]', 'recover'); G.set('eWait[7]', 1e9);
function faceBandit(st) { G.set('pState', 'idle'); G.set('pDir', 1); G.set('stamina', 100); G.set('invuln', 0); G.set('px', 80); G.set('eX[6]', 94); G.set('eDir[6]', -1); if (G.get('eState')[6] != 'dying') { G.set('eState[6]', st || 'recover'); G.set('eFrame[6]', 0); } G.set('eWait[6]', 1e9); G.set('atkActive', false); }
faceBandit(); G.set('hp', 100); G.set('forceRoll', 1); tapA(); G.run(8);
check('d6 = 1: the bandit parries and you are stunned', G.get('pState') == 'parried' || G.get('eState')[6] == 'riposte');
G.run(25);
check('...and its riposte hits hard', G.get('hp') <= 75, 'hp ' + G.get('hp'));
G.run(40); faceBandit(); G.set('forceRoll', 2); const hp6 = G.get('eHP')[6]; tapA(); G.run(8);
check('d6 = 2: the bandit dodges away', G.get('eState')[6] == 'dodge' && G.get('eHP')[6] == hp6);
G.run(20); faceBandit(); G.set('forceRoll', 1); G.run(12, ['A']); G.run(14);
check('a heavy attack stuns it, whatever the d6', G.get('eState')[6] == 'stunned' && G.get('eHP')[6] < hp6, G.get('eState')[6]);
G.set('forceRoll', 3); const souls0 = G.get('souls');
for (let k = 0; k < 20 && G.get('eAlive')[6] == 1; k++) { faceBandit(); tapA(); G.run(22); }
G.run(25);
check('d6 = 3-6: hits land; the bandit dies for 150 souls', G.get('eAlive')[6] == 0 && G.get('souls') - souls0 == 150, 'souls +' + (G.get('souls') - souls0));
check('the first bandit killed drops the Farsight Amulet', G.get('farsightDropped') && G.get('farsightArea') == 10);
G.set('pState', 'idle'); G.set('px', G.get('farsightItem').x); G.run(3);
check('picking up the Farsight Amulet', G.get('hasFarsight'));
G.set('pState', 'idle'); G.press('menu'); G.press('down'); G.press('down'); G.press('down'); G.press('A'); G.press('B'); G.run(2);
check('equipping it in the amulet slot', G.get('amulet') == 1 && G.get('loadout') == 0);
// parry: strike as the second bandit is about to lunge
G.set('forceRoll', 6); G.set('pState', 'idle'); G.set('pDir', 1); G.set('stamina', 100); G.set('invuln', 0); G.set('hp', 100);
G.set('px', 80); G.set('eX[7]', 96); G.set('eDir[7]', -1); G.set('eState[7]', 'windup'); G.set('eFrame[7]', 5);
tapA(); G.run(6);
check('Farsight: hitting the bandit as it attacks parries it', G.get('eState')[7] == 'parried' && G.get('hp') == 100, G.get('eState')[7]);
G.run(6); const hp7 = G.get('eHP')[7]; tapA(); G.run(3);
check('attacking a parried enemy starts a riposte', G.get('pState') == 'riposte');
G.run(45);
check('the riposte runs it through for heavy damage', G.get('eAlive')[7] == 0 || hp7 - G.get('eHP')[7] >= 50, 'hp ' + hp7 + ' -> ' + G.get('eHP')[7]);
G.set('amulet', 0); G.set('px', 80); G.set('pState', 'idle'); G.set('eState[7]', 'windup'); G.set('eAlive[7]', 1); G.set('eFrame[7]', 5); G.set('eX[7]', 96); G.set('eHP[7]', 75);
tapA(); G.run(6);
check('without the amulet the same timing does not parry', G.get('eState')[7] != 'parried');
G.set('eAlive[7]', 0); G.set('amulet', 1); G.set('invuln', 0);
// a skeleton can be parried too
G.get('goToArea(1)'); G.set('eState[0]', 'windup'); G.set('eFrame[0]', 12); G.set('eX[0]', 96); G.set('eDir[0]', -1); G.set('px', 82); G.set('pDir', 1); G.set('pState', 'idle'); G.set('hp', 100);
tapA(); G.run(5);
check('Farsight parries a skeleton\'s swing too', G.get('eState')[0] == 'parried', G.get('eState')[0]);
G.get('goToArea(10)');
edge('left');
check('walking out of the door back to the street', G.get('area') == 9);
edge('right');
check('the second street, with the church', G.get('area') == 11);
G.set('px', 80); G.run(3); tapA(); G.run(2);
check('into the church', G.get('area') == 12);
G.set('px', 104); G.set('pState', 'idle'); G.run(3);
check('A: Talk by the uncorrupted bandit', G.get('talkTarget') == 'bandit');
tapA(); G.run(5);
check('he speaks, then he is gone', G.printed.some(t => t.indexOf('Kindlings') >= 0 || t.indexOf('late.') >= 0) && G.get('banditMet') && G.get('gameState') == 'play' && G.get('friend').flags.inv);
edge('left'); edge('right');
check('the third street, with the merchant\'s house', G.get('area') == 13);
G.set('px', 80); G.run(3); tapA(); G.run(2);
check('inside, the veiled merchant waits behind her counter', G.get('area') == 14 && !G.get('merchant').flags.inv);
edge('left'); edge('right');
check('out past the village to the great tree', G.get('area') == 15);
check('two corrupted bandits wait under the tree (120 HP)', G.get('eAlive')[8] == 1 && G.get('eAlive')[9] == 1 && G.get('eState')[8] != 'hidden' && G.get('eMaxHP')[8] == 120);
G.set('invuln', 1e9); G.set('px', 40); G.set('pState', 'idle'); G.run(20);
check('...and come for you when you get close', G.get('eState')[8] != 'idle');
edge('right');
check('...and no further east for now', G.get('area') == 15);
G.set('px', 120); G.set('pState', 'idle'); G.run(2, ['up']); G.run(120, ['up']);
check('climbing the tree into the treehouse', G.get('area') == 16);
G.set('px', G.get('FRIEND_TREE_X') - 6); G.set('pState', 'idle'); G.run(3);
check('the bandit is waiting in the treehouse', G.get('talkTarget') == 'friend' && !G.get('friend').flags.inv);
tapA(); G.run(5);
check('he talks about Folkewood, then fades away', G.printed.some(t => t.indexOf('Folkewood') >= 0) && G.get('banditGone') && G.get('gameState') == 'play' && G.get('friend').flags.inv);
G.set('px', 50); G.set('pState', 'idle'); G.run(3); G.run(2, ['down']);
check('resting at the treehouse bonfire', G.paused() && G.get('spawnArea') == 16);
G.press('B'); G.run(2);
G.set('px', 120); G.set('pState', 'idle'); G.run(2); G.run(2, ['down']);
check('down the hatch to the foot of the tree', G.get('area') == 15 && G.get('pState') == 'climb');
G.run(120, ['down']);

// ---- saving and Continue
const saved = JSON.parse(JSON.stringify(G.store));
const H = load(saved);
check('Continue loads back at the treehouse with progress kept', H.get('area') == 16 && H.get('bossDead') && H.get('glargonFreed') && H.get('maxHP') == 112 && H.get('hasFarsight') && H.get('banditMet') && H.get('banditGone') && H.get('amulet') == 1);
// a save from before this update (shorter lists) still loads
const old = JSON.parse(JSON.stringify(G.store));
old.ef_stats = old.ef_stats.slice(0, 13); old.ef_flags = old.ef_flags.slice(0, 11); old.ef_visited = old.ef_visited.slice(0, 8); old.ef_stats[6] = 7; old.ef_stats[7] = 40;
const O = load(old);
check('an older save still loads', O.get('area') == 7 && O.get('amulet') == 0 && !O.get('hasFarsight'));

console.log(failures ? failures + ' check(s) FAILED' : 'All checks passed');
process.exit(failures ? 1 : 0);
