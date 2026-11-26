// Builds the game (every .ts file listed in pxt.json, in order) into one Node module
// that runs on top of stubs.js. Returns helpers to press buttons, step ticks and peek at variables.
const fs = require('fs'), path = require('path'), os = require('os');
const ROOT = path.join(__dirname, '..', '..');
function load(store) {
    const esbuild = require(require.resolve('esbuild', { paths: [path.join(__dirname, '..'), process.cwd()] }));
    const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'pxt.json'), 'utf8'));
    const ts = cfg.files.filter(f => f.endsWith('.ts')).map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
    const js = esbuild.transformSync(ts, { loader: 'ts' }).code;
    const out = path.join(os.tmpdir(), 'emberfall_game_' + Date.now() + Math.random() + '.js');
    fs.writeFileSync(out, fs.readFileSync(path.join(__dirname, 'stubs.js'), 'utf8') + '\n' + js + `
;module.exports = { tick: () => { if (__paused) return; __update(); for (const s of __sprites.slice()) { if (s.lifespan !== undefined) { s.lifespan -= 33; if (s.lifespan <= 0) { s.destroy(); continue; } } if (s.vx || s.vy) { s.x += (s.vx||0) * 0.033; s.y += (s.vy||0) * 0.033; if (s.flags.auto && (s.x < -20 || s.x > 180 || s.y > 140 || s.y < -20)) s.destroy(); } } },
  keys: __keys, press: (n) => __handlers[n] && __handlers[n](), get: (n) => eval(n), set: (n, v) => eval(n + ' = ' + JSON.stringify(v)), sprites: () => __sprites, paused: () => __paused, printed: __printed, store: __store, snow: () => __snow };`);
    global.__STORE = store || {};
    const G = require(out);
    G.run = (n, keys = []) => { keys.forEach(k => G.keys.add(k)); for (let i = 0; i < n; i++) G.tick(); keys.forEach(k => G.keys.delete(k)); };
    return G;
}
module.exports = { load };
