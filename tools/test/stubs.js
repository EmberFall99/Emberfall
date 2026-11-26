// Fake versions of the MakeCode Arcade APIs the game uses, just enough to run the
// game logic in Node without a screen. Time doesn't pass for real: pause() returns
// at once, and each call to tick() is one 33ms game tick.
var __keys = new Set(['A']); var __log = []; var __sprites = []; var __update = null; var __bg = null;
function __mkImg(w, h, rows) {
  const im = { width: w, height: h, rows: rows || Array.from({length: h}, () => Array(w).fill('.')),
    clone() { return __mkImg(w, h, this.rows.map(r => r.slice())); },
    flipX() { this.rows = this.rows.map(r => r.slice().reverse()); }, flipY() { this.rows = this.rows.slice().reverse(); }, drawRect() {}, print(t) { __printed.push(t); }, printCenter(t) { __printed.push(t); }, setPixel() {}, drawTransparentImage() {},
    fill(c) {}, fillRect(x, y, ww, hh, c) { if (isNaN(ww) || isNaN(x)) throw new Error('NaN fillRect'); } };
  return im;
}
function img(strs) { const rows = strs.raw.join('').trim().split('\n').map(r => { r = r.trim(); return r.includes(' ') ? r.split(/\s+/) : r.split(''); }); return __mkImg(rows[0].length, rows.length, rows); }
var __printed = []; var image = { create: (w, h) => __mkImg(w, h), screenImage: () => __mkImg(160, 120) };
var SpriteKind = { Player: 1, Projectile: 2, Food: 3, Enemy: 4, _n: 10, create() { return this._n++; } };
var SpriteFlag = { Invisible: 'inv', AutoDestroy: 'auto' };
class __Sprite { constructor(im, kind) { this.image = im; this.kind = kind; this.x = 0; this.y = 0; this.vx = 0; this.flags = {}; this.z = 0; this.alive = true; }
  setImage(im) { this.image = im; } get bottom() { return this.y + this.image.height / 2; } set bottom(v) { this.y = v - this.image.height / 2; }
  setPosition(x, y) { this.x = x; this.y = y; } setFlag(f, v) { this.flags[f] = v; } startEffect(e, t) { __log.push('effect ' + e); }
  destroy() { this.alive = false; __sprites = __sprites.filter(s => s !== this); } }
var sprites = { create(im, k) { const s = new __Sprite(im, k); __sprites.push(s); return s; },
  allOfKind(k) { return __sprites.filter(s => s.kind === k); }, destroyAllSpritesOfKind(k) { __sprites.filter(s => s.kind === k).forEach(s => s.destroy()); } };
var __handlers = {}; var __paused = false;
const __btn = n => ({ isPressed: () => __keys.has(n), onEvent(ev, f) { __handlers[n] = f; } });
var ControllerButtonEvent = { Pressed: 1 };
var controller = { A: __btn('A'), B: __btn('B'), up: __btn('up'), down: __btn('down'), left: __btn('left'), right: __btn('right'), menu: __btn('menu') };
var scene = { setBackgroundImage(b) { __bg = b; }, setBackgroundColor() {}, cameraShake() {} };
var music = { PlaybackMode: { InBackground: 0, LoopingInBackground: 1 }, play(p, m) { __log.push('sound ' + p); },
  melodyPlayable: m => m, stringPlayable: (s) => 'tune', stopAllSounds() { __log.push('stop'); },
  createSong: (b) => 'song', sequencer: { _stopAllSongs() { __log.push('stop songs'); } } };
['pewPew','beamUp','buzzer','sonar','jumpDown','powerDown','siren','baDing','wawawawaa','jumpUp','powerUp','magicWand','knock','footstep','thump','smallCrash','bigCrash','zapped','spooky'].forEach(n => music[n] = n);
var hex = (s) => s.raw.join('');
var info = { score: 0, setScore(v) { this.score = v; } };
var __snow = false; var effects = { disintegrate: 'disintegrate', ashes: 'ashes', halo: 'halo', coolRadial: 'coolRadial', blizzard: { startScreenEffect() { __snow = true; }, endScreenEffect() { __snow = false; } } };
var animation = { runImageAnimation() {} };
var __mainHandlers = null; var game = { onUpdateInterval(ms, f) { __update = f; }, showLongText() {}, pushScene() { __paused = true; __mainHandlers = __handlers; __handlers = {}; }, popScene() { __paused = false; __handlers = __mainHandlers; } };
var DialogLayout = { Full: 0 };
function pauseUntil(c) {} function pause(ms) { __keys.delete('A'); }
function randint(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
Math.idiv = (a, b) => Math.trunc(a / b); Math.constrain = (v, a, b) => Math.min(b, Math.max(a, v));

var __fac = {}; var helpers = { _registerFactory(k, f) { __fac[k] = f; }, stringTrim: s => s.trim() };
var assets = { image: (s) => { const r = __fac.image(s.raw.join('')); if (!r) throw new Error('missing image ' + s.raw.join('')); return r; },
               animation: (s) => { const r = __fac.animation(s.raw.join('')); if (!r) throw new Error('missing anim ' + s.raw.join('')); return r; } };
var __store = global.__STORE || {}; var settings = { writeNumber(k, v) { __store[k] = v; }, readNumber(k) { return __store[k]; }, writeNumberArray(k, v) { __store[k] = v.slice(); }, readNumberArray(k) { return __store[k].slice(); }, exists(k) { return k in __store; } };
var control = { runInParallel(f) { f(); } };
