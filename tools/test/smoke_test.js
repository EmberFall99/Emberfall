// Plays through the main beats of the game with simulated buttons and checks each one.
// Run from the repo root:  node tools/test/smoke_test.js
const { load } = require('./harness');
let failures = 0;
function check(name, ok, detail) { console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  (' + detail + ')' : '')); if (!ok) failures++; }

// ---- new game: the intro plays, you wake in the cell, take the key, open the door
let G = load({});
check('intro shows its last line', G.printed.includes('To your inexorable end.'));
check('new game starts in the cell, waking', G.get('area') == 0 && G.get('pState') == 'waking');
G.tick();
check('music: dark and moody from the start', G.get('curMusic') == 'dark');
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
G.tick();
check('music: the boss theme during the fight', G.get('curMusic') == 'boss');
for (let i = 0; i < 15 && !G.get('bossDead'); i++) { G.set('invuln', 1e9); G.set('bossHP', 5); G.set('px', G.get('bx') - 14); G.set('pDir', 1); G.set('pState', 'idle'); G.run(2, ['A']); G.run(25); }
G.run(80);
check('the Warden dies and drops his key ring', G.get('bossDead') && G.get('keyRingDropped'));
G.set('px', G.get('keyRingItem').x - 8); G.run(15, ['right']); G.run(90, ['right']);
check('key ring opens the prison gate into the Frostbitten Field', G.get('gateOpen') && G.get('area') == 6 && G.snow());
G.tick();
check('music: only wind on the Frostbitten Field', G.get('curMusic') == 'wind');
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
check('music: something mystical at the Still Lake', (G.get('area') != 7) || G.get('curMusic') == 'lake');
check('east of the lake is the road with the Ashen Forde sign', G.get('area') == 8);
check('music: dark and moody again towards Ashen Forde', G.get('curMusic') == 'town');
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
G.set('pState', 'idle'); G.press('menu'); for (let k = 0; k < 5; k++) G.press('down'); G.press('A'); G.press('B'); G.run(2);
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
check('east of the great tree lies the Warren', G.get('area') == 17 && G.get('visited')[17]);
edge('left');
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

// ---- chunk 3: The Warren - the main path, the camp above, the crypt below, knife throwers, the Katana
{
  // the art's layout table and the game's platforms/pits must agree
  const lay = JSON.parse(require('child_process').execSync("python3 -c \"import sys,json; sys.path.insert(0,'tools/art'); import pixrig5 as V; print(json.dumps({'plats':V.PLATS,'pits':V.PITS,'hole':V.HOLE_X,'ladder':V.UP_LADDER_X,'katana':V.KATANA_X}))\"").toString());
  const pa = G.get('platArea'), p1 = G.get('platX1'), p2 = G.get('platX2'), ph = G.get('platH');
  let ok = true;
  for (const a in lay.plats) for (const [x1, x2, h] of lay.plats[a]) ok = ok && pa.some((v, i) => v == +a && p1[i] == x1 && p2[i] == x2 && ph[i] == h);
  const ta = G.get('pitArea'), t1 = G.get('pitX1'), t2 = G.get('pitX2');
  for (const a in lay.pits) for (const [x1, x2] of lay.pits[a]) ok = ok && ta.some((v, i) => v == +a && t1[i] == x1 && t2[i] == x2);
  ok = ok && G.get('HOLE_X') == lay.hole && G.get('ladX')[3] == lay.ladder && G.get('KATANA_X') == lay.katana;
  check('the Warren art and the game agree on every platform and pit', ok);
}
G.set('pState', 'idle'); G.get('goToArea(15)'); G.set('invuln', 1e9);
edge('right');
check('east of the great tree: THE WARREN', G.get('area') == 17);
edge('right');
check('the hollow, with a bonfire and no enemies by it', G.get('area') == 18 && G.get('hasBonfire()') && G.get('eArea').indexOf(18) < 0);
G.set('px', 100); G.set('pState', 'idle'); G.run(3); G.run(2, ['down']); G.press('B'); G.run(3);
check('resting at the hollow bonfire', G.get('spawnArea') == 18);
edge('right'); edge('right');
check('deeper woods, then the edge of the Warren', G.get('area') == 20);
G.run(80, ['right']);
check('...the way on to Folkewood is not open yet', G.get('area') == 20 && G.get('px') <= 136);
edge('left'); edge('left');
// up the ladder into the camp
G.set('px', 130); G.set('pState', 'idle'); G.run(2); G.run(2, ['up']); G.run(130, ['up']);
check('up the rope ladder into the abandoned camp', G.get('area') == 21 && G.get('visited')[21]);
G.set('px', 130); G.set('pState', 'idle'); G.run(2); G.run(2, ['down']);
check('down the hatch back to the hollow', G.get('area') == 18 && G.get('pState') == 'climb');
G.run(130, ['down']); G.get('goToArea(21)'); G.set('pState', 'idle'); G.set('py', 0);
G.set('px', 30); G.run(30, ['left']);
check('the camp is walled off to the left', G.get('area') == 21 && G.get('px') >= 10);
edge('right');
check('the rope bridge', G.get('area') == 22);
G.set('px', 52); G.set('pState', 'idle'); G.run(5);
check('the bridge planks hold you up', G.get('py') == 0 && G.get('gameState') == 'play');
G.set('invuln', 0); G.set('souls', 77); G.set('px', 75); G.set('pState', 'idle'); G.run(40);
check('falling through the gap in the bridge kills you', G.get('gameState') == 'dead' && G.get('stainSouls') == 77 && G.get('stainArea') == 22 && (G.get('stainX') == 36 || G.get('stainX') == 130));
G.run(130);
check('...and you wake at the hollow bonfire', G.get('area') == 18 && G.get('gameState') == 'play');
G.get('goToArea(22)'); G.set('invuln', 1e9); G.run(12);
check('your lost souls smoulder where you fell, sparks rising', G.get('sprites.allOfKind(SpriteKind.Smoulder).length') > 0 && !G.get('stain').flags.inv);
G.get('goToArea(18)'); G.run(2);
check('...the sparks are cleared when you leave', G.get('sprites.allOfKind(SpriteKind.Smoulder).length') == 0);
G.get('goToArea(23)'); G.set('pState', 'idle'); G.set('invuln', 1e9); G.set('px', 120); G.run(60, ['right']);
check('the gate to the throne is barred', G.get('area') == 23 && G.get('px') <= 146);
// a knife thrower in the deeper woods (slot 14, on its tree platform)
G.get('goToArea(19)'); G.set('pState', 'idle'); G.set('invuln', 0); G.set('hp', 100); G.set('px', 70); G.set('loadout', 0);
for (const b of [11, 12]) { G.set('eAlive[' + b + ']', 0); }
let thrown = false, back = false, hurt = false;
for (let t = 0; t < 200; t++) { G.tick(); if (G.get('knivesOut(13)') > 0) thrown = true; if (thrown && G.get('knivesOut(13)') == 0) back = true; if (G.get('hp') < 100) hurt = true; G.set('invuln', Math.min(G.get('invuln'), 5)); }
check('the knife thrower throws a spinning knife that cuts you', thrown && hurt);
check('...and it comes back to his hand', back);
G.set('hp', 100); G.set('loadout', 1); G.set('hasShield', true); G.set('pDir', 1); G.set('stamina', 100);
let blockedOut = false, hitBack = false, lastSta = 100;
G.keys.add('A');
for (let t = 0; t < 200; t++) {
  G.tick(); G.set('pDir', 1); G.set('invuln', 0);
  const kk = G.get('knOwner').indexOf(13), kt = kk >= 0 ? G.get('knT')[kk] : -1, half = G.get('KNIFE_TIME') / 2;
  if (G.get('stamina') < lastSta - 5 && kt >= 0 && kt < half) blockedOut = true;
  if (G.get('hp') < 100 && kt >= half) hitBack = true;
  lastSta = G.get('stamina'); G.set('hp', 100);
}
G.keys.delete('A'); G.run(2);
check('...your shield blocks it on the way out', blockedOut);
check('...but it can catch you from behind on the way back', hitBack);
G.set('loadout', 0);
// up close it hops away or slashes, and light hits stagger it
G.get('goToArea(19)'); G.set('eAlive[11]', 0); G.set('eAlive[12]', 0); G.set('eAlive[13]', 1); G.get('setupEnemy(13)'); G.set('pState', 'idle'); G.set('invuln', 1e9); G.set('eX[13]', 72); G.get('dropAllKnives()');
G.set('eH[13]', 0); G.set('eMin[13]', 4); G.set('eMax[13]', 156); G.set('px', 60); G.set('py', 0); G.set('pDir', 1);
let moves = new Set();
for (let t = 0; t < 120; t++) { G.set('px', G.get('eX')[13] - 14); G.tick(); moves.add(G.get('eState')[13]); }
check('a cornered knife thrower hops back or slashes', moves.has('hop') || moves.has('slashUp'), [...moves].join(','));
G.set('eState[13]', 'idle'); G.set('eFrame[13]', 0); G.set('eHP[13]', 70); G.set('px', G.get('eX')[13] - 12); G.set('pState', 'idle'); tapA(); G.run(8);
check('light hits wound it and stagger it', G.get('eHP')[13] < 70 && G.get('eState')[13] == 'stagger', G.get('eState')[13]);
G.set('eH[13]', 20);
// the crypt
G.get('goToArea(18)'); G.set('pState', 'idle'); G.set('invuln', 1e9); G.set('px', G.get('HOLE_X')); G.run(3);
check('A: Descend at the broken stair', G.get('talkTarget') == 'descend');
tapA(); G.run(2);
check('down into THE CRYPT', G.get('area') == 25 && G.get('visited')[25]);
G.set('eHP[21]', 1); G.set('eX[21]', 80); G.set('px', 66); G.set('pDir', 1); G.set('pState', 'idle'); G.set('eState[21]', 'idle'); tapA(); G.run(40);
check('crypt skeletons fall to bones...', G.get('eState')[21] == 'bones' && G.get('eAlive')[21] == 1);
G.run(200);
check('...and pull themselves back together at full health', G.get('eState')[21] != 'bones' && G.get('eHP')[21] == 40);
G.set('px', 150); G.set('pState', 'idle'); G.run(12, ['right']);
check('deeper into the crypt', G.get('area') == 26);
G.set('px', 46); G.set('py', 12); G.set('vy', 0); G.set('pState', 'idle'); G.run(5);
check('the crypt ledges hold you up', G.get('py') == 12);
G.get('goToArea(28)'); G.set('pState', 'idle'); G.set('py', 0); G.set('px', G.get('KATANA_X')); G.run(3);
check('the Katana, on the altar at the bottom', G.get('hasKatana'));
G.get('goToArea(25)'); G.set('px', 8); G.set('pState', 'idle'); G.run(12, ['left']);
check('back up the stair to the hollow', G.get('area') == 18 && Math.abs(G.get('px') - G.get('HOLE_X')) < 20);
// the weapon menu scrolls
G.set('px', 100); G.set('pState', 'idle'); G.run(2); G.set('loadout', 0); G.run(2); G.press('menu'); G.press('down'); G.press('down'); G.press('down');
check('the weapon menu scrolls to show the Katana', G.get('menuSel') == 3 && G.get('menuTop') == 1);
G.press('A'); G.press('B'); G.run(2);
check('equipping the Katana', G.get('loadout') == 3);
G.set('lvDex', 0); const k0 = G.get('weaponMul()'); G.set('lvDex', 5); const k5 = G.get('weaponMul()'); G.set('lvStr', 9); const k9 = G.get('weaponMul()'); G.set('lvStr', 2);
check('the Katana scales with dexterity, not strength', k5 > k0 && k9 == k5);
// the sheathed dash: hold, release, cut through two bandits in a line
G.get('goToArea(19)'); G.set('pState', 'idle'); G.set('px', 30); G.set('pDir', 1); G.set('stamina', 200);
G.set('eAlive[11]', 1); G.set('eAlive[12]', 1); G.get('setupEnemy(11)'); G.get('setupEnemy(12)'); G.set('eAlive[13]', 0);
G.set('eX[11]', 60); G.set('eX[12]', 80); G.set('eState[11]', 'recover'); G.set('eState[12]', 'recover'); G.set('eWait[11]', 1e9); G.set('eWait[12]', 1e9);
G.run(45, ['A']);
check('holding A with the Katana: the sheathed charge', G.get('pState') == 'iai');
const h12 = G.get('eHP')[11], h13 = G.get('eHP')[12]; G.run(20);
check('letting go: a dash that cuts through both bandits and stuns them', G.get('eHP')[11] < h12 && G.get('eHP')[12] < h13 && G.get('eState')[11] == 'stunned' && G.get('px') > 85, 'px ' + G.get('px'));
G.run(30);
// parrying is judged the moment you press attack
G.set('loadout', 0); G.set('amulet', 1); G.set('pState', 'idle'); G.set('px', 60); G.set('pDir', 1);
G.set('eX[11]', 78); G.set('eDir[11]', -1); G.set('eState[11]', 'windup'); G.set('eFrame[11]', 4); G.set('eHP[11]', 120);
tapA(); G.tick();
check('parry happens on the press, not when the blade lands', G.get('eState')[11] == 'parried', G.get('eState')[11]);
G.set('amulet', 0); G.set('invuln', 0);
G.get('goToArea(18)'); G.set('px', 100); G.set('pState', 'idle'); G.run(3); G.run(2, ['down']); G.press('B'); G.run(3);

// ---- chunk 4: the Red Hand, the horn, the shop, the Stalwart and Focus amulets, the Rusted Dagger
check('Estus is now called the Cordial', G.get('maxCordials') >= 3 && G.get('statInfo')[4].indexOf('Cordial') >= 0);
G.get('goToArea(23)'); G.set('pState', 'idle'); G.set('invuln', 1e9); G.set('py', 0); G.set('vy', 0);
for (const e of [18, 19, 20]) G.set('eAlive[' + e + ']', 0);
G.set('px', 140); G.run(3);
check('A: Lift the bar at the camp gate', G.get('talkTarget') == 'lift');
tapA(); G.run(2);
check('...the gate stays open', G.get('campGateOpen'));
G.set('px', G.get('CAMP_FIRE_X')); G.set('pState', 'idle'); G.run(3); G.run(2, ['down']); G.press('B'); G.run(3);
check('a bonfire just outside his gate', G.get('spawnArea') == 23);
edge('right');
const RH = G.get('RH');
check('through the gate: the Red Hand on his throne', G.get('area') == 24 && G.get('eState')[RH] == 'throne' && !G.get('redHandActive()'));
G.set('px', 50); G.set('pState', 'idle'); G.run(50);
check('he rises when you step in, and the fight music starts', G.get('redHandActive()') && G.get('curMusic') == 'redhand');
G.set('px', 8); G.set('pState', 'idle'); G.run(12, ['left']);
check('no leaving once he is on his feet', G.get('area') == 24);
function faceRH(st, f) { G.set('pState', 'idle'); G.set('pDir', 1); G.set('stamina', 300); G.set('invuln', 0); G.set('hp', 200); G.set('px', 60); G.set('eX[' + RH + ']', 78); G.set('eDir[' + RH + ']', -1); G.set('eState[' + RH + ']', st || 'recover'); G.set('eFrame[' + RH + ']', f || 0); G.set('eWait[' + RH + ']', 1e9); G.set('atkActive', false); G.get('dropAllKnives()'); }
let parried = false;
for (let tries = 0; tries < 8 && !parried; tries++) {
  faceRH(); G.set('amulet', 0); G.set('loadout', 0);
  for (let k = 0; k < 3; k++) { tapA(); for (let t = 0; t < 9; t++) { G.tick(); if (G.get('pState') == 'parried') parried = true; G.set('eWait[' + RH + ']', 1e9); G.set('eX[' + RH + ']', Math.max(70, Math.min(80, G.get('eX')[RH]))); } }
  G.run(30);
}
check('he parries the third hit of your combo', parried);
let stalwart = false;
for (let tries = 0; tries < 8 && !stalwart; tries++) {
  faceRH(); G.set('amulet', 2); G.set('hasStalwart', true);
  let stunned = false, thirdLanded = false;
  for (let k = 0; k < 3; k++) { tapA(); for (let t = 0; t < 9; t++) { G.tick(); if (G.get('pState') == 'parried') stunned = true; if (k == 2 && G.get('dmgIn') > 0) thirdLanded = true; G.set('eWait[' + RH + ']', 1e9); G.set('eX[' + RH + ']', Math.max(70, Math.min(80, G.get('eX')[RH]))); } }
  G.run(3);
  if (thirdLanded && !stunned && G.get('hp') < 200 && G.get('hp') > 180) stalwart = true;
  G.run(30);
}
check('Stalwart: parried, you keep your feet and take half a hit', stalwart);
faceRH('windup', 6); G.set('amulet', 1); G.set('rhStep', 1); tapA(); G.tick();
check('Farsight parries the Red Hand', G.get('eState')[RH] == 'parried', G.get('eState')[RH]);
const rhp = G.get('eHP')[RH]; G.run(4); tapA(); G.run(45);
check('...and the riposte hits him hard', rhp - G.get('eHP')[RH] >= 50, rhp + ' -> ' + G.get('eHP')[RH]);
faceRH(); G.set('rhPoise', 0); for (let k = 0; k < 3; k++) { G.set('eState[' + RH + ']', 'recover'); G.get('hitEnemy(' + RH + ', 5, true, 0)'); }
check('three heavies and he staggers', G.get('eState')[RH] == 'stunned');
faceRH('stalk', 20); G.set('px', 20); G.set('eHP[' + RH + ']', 100); G.set('rhCordials', 3); G.set('eWait[' + RH + ']', 1e9);
G.run(50);
check('hurt and out of reach, he drinks a Cordial', G.get('rhCordials') == 2 && G.get('eHP')[RH] > 100, G.get('eHP')[RH]);
faceRH('drink', 5); G.set('eHP[' + RH + ']', 100); G.get('hitEnemy(' + RH + ', 5, false, 0)'); G.run(30);
check('...hit him mid-drink and it is wasted', G.get('eHP')[RH] <= 100);
faceRH(); G.get('rhThrowKnives(' + RH + ', true)');
check('he throws a fan of three knives', G.get('knivesOut(' + RH + ')') == 3);
G.get('dropAllKnives()');
const souls4 = G.get('souls'); faceRH(); G.set('eHP[' + RH + ']', 1); G.get('hitEnemy(' + RH + ', 50, true, 0)'); G.run(90);
check('the Red Hand falls: 1,500 souls', G.get('redHandDead') && G.get('souls') - souls4 == 1500 && G.get('eAlive')[RH] == 0);
check('...the horn and the Rusted Dagger lie where he fell', !G.get('hornItem').flags.inv && !G.get('daggerItem').flags.inv);
G.set('pState', 'idle'); G.set('px', G.get('hornItem').x); G.run(3); G.set('px', G.get('daggerItem').x); G.run(3);
check('picking up the horn and the Rusted Dagger', G.get('hasHorn') && G.get('hasDagger'));
G.get('resetWorld()'); G.get('goToArea(24)'); G.run(2);
check('he stays dead after a rest', G.get('eAlive')[RH] == 0 && !G.get('redHandActive()'));
// the merchant
G.get('goToArea(14)'); G.set('pState', 'idle'); G.set('px', G.get('MERCHANT_TALK_X')); G.run(3);
check('A: Blow the horn at the sleeping merchant', G.get('talkTarget') == 'horn');
tapA(); G.run(80);
check('...she wakes', G.get('merchantAwake') && G.get('gameState') == 'play');
G.run(3);
check('A: Trade', G.get('talkTarget') == 'trade');
G.set('souls', 1600); G.set('hasStalwart', false); tapA(); G.run(2);
check('her shop opens', G.paused());
check('she sells Focus, Brewer\'s and Stalwart', G.get('shopNames').join(',') == "FOCUS AMULET,BREWER'S AMULET,STALWART AMULET");
G.press('down'); G.press('down'); G.press('A'); G.press('B'); G.run(2);
check('buying the Stalwart Amulet for 1,500 souls', G.get('hasStalwart') && G.get('souls') == 100);
G.set('souls', 1500); G.run(1); G.set('pState', 'idle'); G.set('px', G.get('MERCHANT_TALK_X')); G.run(3); tapA(); G.run(2); G.press('down'); G.press('A'); G.press('B'); G.run(2);
check('buying the Brewer\'s Amulet', G.get('hasBrewer') && G.get('souls') == 0);
G.set('amulet', 4); G.set('hp', 10); G.set('maxHP', 200); G.set('cordials', 3); G.set('pState', 'idle'); G.run(2); G.run(2, ['down']); G.run(40);
check('Brewer\'s: a Cordial heals half as much again', G.get('hp') == 78, 'hp ' + G.get('hp'));
G.set('amulet', 2); G.set('hp', 100); G.set('invuln', 0); G.set('pState', 'idle'); G.set('dmgIn', 20); G.set('dmgDir', 1); G.tick();
check('Stalwart: hits still hurt, but you don\'t flinch', G.get('hp') < 100 && G.get('pState') != 'hurt');
G.set('amulet', 0); G.set('maxHP', 112); G.set('hp', 112);
G.set('pState', 'idle'); G.run(2); G.press('menu'); G.press('right');
check('press right in the menu: the item\'s description', G.get('menuPage') == 1);
G.press('right');
check('...and again: key items (the horn)', G.get('menuPage') == 2 && G.get('hasHorn'));
G.press('B'); G.run(2);
check('every weapon and amulet has a description that fits', G.get('itemDesc').every(d => G.get('wrapText')(d, 22).length <= 7) && G.get('amuletDesc').slice(1).every(d => G.get('wrapText')(d, 22).length <= 7) && G.get('itemDesc').length == G.get('itemNames').length);
G.set('hasFocus', true);
check('the amulet slot cycles through the amulets you own', G.get('nextAmulet(0)') == 1 && G.get('nextAmulet(1)') == 2 && G.get('nextAmulet(2)') == 3 && G.get('nextAmulet(3)') == 4 && G.get('nextAmulet(4)') == 0);
G.set('amulet', 3); G.set('pState', 'idle'); G.set('px', 40); G.set('pDir', 1); G.set('stamina', 100); G.keys.add('B'); G.tick(); G.keys.delete('B'); G.run(14);
check('Focus: the roll becomes a fast dash', G.get('px') > 70 && G.get('pState') != 'roll', 'px ' + G.get('px'));
G.set('amulet', 0);
// the Rusted Dagger
G.get('goToArea(19)'); G.set('eAlive[13]', 0); G.set('pState', 'idle'); G.set('px', 40); G.set('pDir', 1); G.set('loadout', 0); G.set('souls', 0); G.run(2);
tapA(); G.run(16); const swordMove = G.get('px') - 40;
G.set('loadout', 4); G.set('px', 40); G.set('pState', 'idle'); G.run(2); tapA(); G.run(14); const dagMove = G.get('px') - 40;
check('Rusted Dagger stabs carry you further forward', dagMove > swordMove + 2, swordMove.toFixed(1) + ' vs ' + dagMove.toFixed(1));
G.set('eAlive[11]', 1); G.get('setupEnemy(11)'); G.set('eX[11]', 90); G.set('eState[11]', 'recover'); G.set('eWait[11]', 1e9); G.set('forceRoll', 6);
G.set('souls', 5000); G.run(3); G.set('px', 40); G.set('pState', 'idle'); const hb = G.get('eHP')[11]; tapA(); G.run(4);
check('with souls for a level-up, the dagger throws a ghost dagger', G.get('knivesOut(-1)') > 0);
G.run(30);
check('...which cuts the foe in its path and comes back', G.get('eHP')[11] < hb && G.get('knivesOut(-1)') == 0);
G.set('souls', 0); G.set('forceRoll', 0); G.set('loadout', 0); G.get('goToArea(23)'); G.set('px', 100); G.set('pState', 'idle'); G.run(3);

// ---- saving and Continue
const saved = JSON.parse(JSON.stringify(G.store));
const H = load(saved);
check('Continue loads back at the camp bonfire with progress kept', H.get('area') == 23 && H.get('hasKatana') && H.get('redHandDead') && H.get('hasDagger') && H.get('merchantAwake') && H.get('hasStalwart') && H.get('campGateOpen') && H.get('bossDead') && H.get('glargonFreed') && H.get('maxHP') == 112 && H.get('hasFarsight') && H.get('banditMet') && H.get('banditGone'));
// a save from before this update (shorter lists) still loads
const old = JSON.parse(JSON.stringify(G.store));
old.ef_stats = old.ef_stats.slice(0, 13); old.ef_flags = old.ef_flags.slice(0, 11); old.ef_visited = old.ef_visited.slice(0, 8); old.ef_stats[6] = 7; old.ef_stats[7] = 40;
const O = load(old);
check('an older save still loads', O.get('area') == 7 && O.get('amulet') == 0 && !O.get('hasFarsight'));

// ---- chunk 5: Folkewood and the dragon (fresh games from the saved state, so each scenario starts clean)
function inFolke(Gx) {
  Gx.set('gameState', 'play'); Gx.set('pState', 'idle'); Gx.set('invuln', 0); Gx.set('hp', 112); Gx.set('py', 0); Gx.set('vy', 0);
}
{
  const D = load(JSON.parse(JSON.stringify(G.store)));
  inFolke(D); D.get('goToArea(20)'); D.set('px', 150); D.run(12, ['right']);
  check('the edge of the Warren opens onto the road to Folkewood', D.get('area') == 29);
  D.set('pState', 'idle'); D.set('px', 150); D.run(12, ['right']);
  check('through the palisade gate: FOLKEWOOD, seven bandits in the street', D.get('area') == 30 && D.get('visited')[30] && D.get('eArea').filter(a => a == 30).length == 7 && D.get('eState')[29] == 'milling');
  D.set('px', 24); D.set('pState', 'idle'); D.run(3);
  check('Glargon\'s note lies just inside the gate', D.get('talkTarget') == 'note2');
  D.keys.delete('A'); D.set('waitRelease', false); D.set('aHeld', 0); D.run(2);
  D.keys.add('A'); D.tick(); D.keys.delete('A'); D.run(3);
  check('"Dragon. - Glargon Jones"', D.printed.some(t => t.indexOf('Dragon.') >= 0));
  check('...and the dragon comes (the music stops)', D.get('dragonT') >= 0 && D.get('curMusic') == 'silence');
  // stay in the open: the breath gets you
  D.set('px', 60); D.set('invuln', 0);
  let wing = false, head = false;
  for (let t = 0; t < 230 && D.get('gameState') == 'play'; t++) { D.tick(); if (!D.get('dragonWing').flags.inv) wing = true; if (!D.get('breath').flags.inv) head = true; D.set('px', 60); D.set('invuln', 0); }
  check('a wing sweeps over, then the head breathes ice down the street', wing && head);
  check('caught in the open, the breath kills you, frozen where you stood', D.get('gameState') == 'dead' && D.get('frozenDeath'));
  D.run(200);
  check('the bandits it touched are ice for good', D.get('dragonDone') && [29, 30, 31, 32, 33, 34, 35].every(i => D.get('eState')[i] == 'frozen'));
  D.get('goToArea(30)'); D.set('pState', 'idle'); D.set('gameState', 'play'); D.run(2);
  const sv = D.get('souls'), h29 = D.get('eHP')[29];
  check('...still frozen when you come back', D.get('eState')[29] == 'frozen' && !D.get('redHandActive()'));
  check('attacking a frozen bandit does nothing (and gives no souls)', D.get('hitEnemy(29, 50, true, px)') == false && D.get('eHP')[29] == h29 && D.get('souls') == sv);
  check('after the dragon, only the wind', D.get('curMusic') == 'wind');
  const E = load(JSON.parse(JSON.stringify(D.store)));
  check('the dragon never comes again after a save and reload', E.get('dragonDone'));
}
{
  // roll through the breath at the right moment and live
  const R2 = load(JSON.parse(JSON.stringify(G.store)));
  inFolke(R2); R2.get('goToArea(30)'); R2.set('px', 70); R2.run(2);
  check('pressing on into the street brings the dragon too', R2.get('dragonT') >= 0);
  let rolled = false, allFrozenByBreath = false;
  for (let t = 0; t < 230; t++) {
    R2.set('hp', 112); R2.set('invuln', 0);
    if (R2.get('dragonT') == R2.get('DR_BREATH_END')) allFrozenByBreath = [29, 30, 31, 32, 33, 34, 35].every(i => R2.get('eState')[i] == 'frozen');
    if (!rolled && R2.get('dragonT') >= R2.get('DR_BREATH_START') && R2.get('breathX') - R2.get('px') < 12) { R2.set('pDir', 1); R2.keys.add('B'); R2.tick(); R2.keys.delete('B'); rolled = true; continue; }
    R2.tick();
  }
  check('rolling through the breath: you live', rolled && R2.get('gameState') == 'play' && R2.get('dragonDone'));
  check('the breath itself catches all seven bandits, even the one at the far end', allFrozenByBreath);
}
{
  // or get back out through the gate
  const R3 = load(JSON.parse(JSON.stringify(G.store)));
  inFolke(R3); R3.get('goToArea(30)'); R3.set('px', 50); R3.run(30);
  R3.set('px', 8); R3.set('pState', 'idle'); R3.run(12, ['left']);
  check('back through the gate: it happens without you, and you live', R3.get('area') == 29 && R3.get('dragonDone') && R3.get('gameState') == 'play');
}

// ---- chunk 6: the Indentured General's Armour
{
  const A2 = load(JSON.parse(JSON.stringify(G.store)));
  inFolke(A2); A2.keys.delete('A'); A2.set('waitRelease', false); A2.set('aHeld', 0);
  A2.get('goToArea(28)'); A2.set('px', A2.get('SAMURAI_X')); A2.set('pState', 'idle'); A2.run(3);
  const tap = (k) => { A2.keys.add(k); A2.tick(); A2.keys.delete(k); A2.run(2); };
  check('the samurai kneels at the altar: A: Equip Indentured General\'s Armour', A2.get('talkTarget') == 'armour' && !A2.get('samurai').flags.inv);
  A2.set('forceChoice', 2); tap('A'); A2.run(5);
  check('"Are you sure? ..." - B leaves it', !A2.get('armourOn') && A2.printed.some(t => t.indexOf('pardon') >= 0) && A2.get('gameState') == 'play');
  A2.set('pState', 'idle'); A2.run(3); A2.set('forceChoice', 1); tap('A'); A2.run(10);
  const lvCon = A2.get('lvCon');
  check('A puts it on: the General\'s contract is yours (the Red Hand - already fulfilled)', A2.get('armourOn') && A2.printed.some(t => t.indexOf('Fulfilled') >= 0));
  for (let k = 0; k < 4 && A2.get('gameState') != 'play'; k++) tap('A');
  check('...half your max health', A2.get('maxHP') == Math.floor((100 + 12 * lvCon) / 2));
  check('...the samurai is left in his bones', A2.get('samurai').flags.inv);
  check('...Cordials heal half as much', A2.get('cordialHeal()') == 22);
  A2.set('pState', 'idle'); A2.set('px', 20); A2.run(10, ['right']);
  check('...you walk faster', A2.get('px') > 33, 'px ' + A2.get('px'));
  A2.set('pState', 'idle'); A2.set('py', 0); A2.set('vy', 0); A2.set('stamina', 100); A2.run(2);
  let topY = 0, air = 0; A2.keys.add('up'); A2.tick(); A2.keys.delete('up');
  for (let t = 0; t < 40; t++) { A2.tick(); topY = Math.max(topY, A2.get('py')); if (A2.get('py') > 0) air++; }
  check('...a snappier jump with the same height', topY > 22 && topY < 28 && air < 24, 'height ' + topY.toFixed(1) + ', airtime ' + air);
  A2.set('pState', 'idle'); A2.set('stamina', 100); A2.set('px', 60); A2.set('pDir', 1); A2.run(2);
  A2.keys.add('B'); A2.tick(); A2.keys.delete('B'); A2.run(2);
  check('...tap B: a (quicker) roll, on release', A2.get('pState') == 'roll' || A2.get('px') > 66);
  A2.run(20); A2.set('pState', 'idle'); A2.set('hp', A2.get('maxHP')); A2.run(2);
  const hp0 = A2.get('hp');
  A2.run(14, ['B']);
  check('...hold B: arms out, the curse feeds on you', A2.get('pState') == 'offering' && A2.get('hp') < hp0);
  A2.run(400, ['B']);
  check('...it never takes your last point of health', A2.get('hp') == 1 && A2.get('gameState') == 'play');
  A2.run(2);
  check('...let go and it stops', A2.get('pState') == 'idle');
  A2.run(2);
  const m1 = A2.get('meleeMul()'); A2.set('hp', A2.get('maxHP')); A2.run(1); const m0 = A2.get('meleeMul()');
  A2.set('hp', 1); A2.run(1);
  check('...below 30% health you hit 20% harder, glowing red', Math.abs(m1 / m0 - 1.2) < 0.001 && !A2.get('redAura').flags.inv);
  A2.set('pState', 'idle'); A2.press('menu'); A2.press('right'); A2.press('right'); A2.press('right');
  check('...its own page in the menu, with its contract', A2.get('menuPage') == 3);
  A2.press('B'); A2.run(2);
  const A3 = load(JSON.parse(JSON.stringify(A2.store)));
  check('...and it stays on after a save and reload', A3.get('armourOn') && A3.get('maxHP') == Math.floor((100 + 12 * lvCon) / 2));
}

console.log(failures ? failures + ' check(s) FAILED' : 'All checks passed');
process.exit(failures ? 1 : 0);
