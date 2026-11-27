// Composes Emberfall's background music and writes it to music.ts as MakeCode songs
// (the same format the Music editor saves, so they also open in the editor if you click them).
//     node tools/make_music.js
// Each track is a list of [start beat, length in beats, note(s)]. Notes are names like "D3", "Bb4", "F#5".
const fs = require('fs');
const path = require('path');
require(path.join(__dirname, 'node_modules/pxt-core/built/pxt.js'));
const M = global.pxt.assets.music;

// waveforms (see pxt-common-packages/libs/mixer/melody.h)
const TRIANGLE = 1, SAWTOOTH = 2, SINE = 3, TUNED_NOISE = 4, NOISE = 5;

const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
// MakeCode note numbers start at B0 = 0, so C4 (middle C) = 37
function noteNum(name) {
    const m = /^([A-G])(#|b)?(\d)$/.exec(name);
    if (!m) throw new Error('bad note ' + name);
    const midi = 12 * (+m[3] + 1) + PC[m[1]] + (m[2] == '#' ? 1 : m[2] == 'b' ? -1 : 0);
    return { n: midi - 23, spell: m[2] == '#' ? 'sharp' : m[2] == 'b' ? 'flat' : 'normal' };
}

function instrument(wave, amp, opts) {
    opts = opts || {};
    return {
        waveform: wave,
        octave: 4,
        ampEnvelope: { attack: opts.attack || 10, decay: opts.decay || 100, sustain: opts.sustain === undefined ? 1024 : opts.sustain,
            release: opts.release || 200, amplitude: amp },
        pitchEnvelope: { attack: 0, decay: 0, sustain: 0, release: 0, amplitude: 0 },
        ampLFO: { frequency: opts.ampLfoHz || 0, amplitude: opts.ampLfo || 0 },
        pitchLFO: { frequency: opts.vibHz || 0, amplitude: opts.vib || 0 },
    };
}

function song(bpm, measures, tracks) {
    const TPB = 8;
    const s = { ticksPerBeat: TPB, beatsPerMeasure: 4, beatsPerMinute: bpm, measures, tracks: [] };
    tracks.forEach(([name, inst, events], id) => {
        if (inst === 'DRUMS') {
            // MakeCode's own drum kit (the Music editor's): 2 booming kick, 3 snare, 5 hat, 11-13 toms, 20 crash
            const kit = M.getEmptySong(1).tracks.find(t => t.drums);
            const notes = events.map(([start, len, ns]) => ({
                startTick: Math.round(start * TPB), endTick: Math.round((start + len) * TPB),
                notes: (Array.isArray(ns) ? ns : [ns]).map(d => ({ note: d, enharmonicSpelling: 'normal' })),
            })).sort((a, b) => a.startTick - b.startTick);
            s.tracks.push({ id, name, notes, drums: kit.drums, instrument: kit.instrument, iconURI: kit.iconURI });
            return;
        }
        const notes = events.map(([start, len, ns]) => ({
            startTick: Math.round(start * TPB),
            endTick: Math.min(measures * 4 * TPB, Math.round((start + len) * TPB)),
            notes: (Array.isArray(ns) ? ns : [ns]).map(noteNum).map(x => ({ note: x.n, enharmonicSpelling: x.spell })),
        }));
        // pick the instrument octave so every note fits in the 6 bits the format allows
        const all = [].concat(...notes.map(e => e.notes.map(x => x.note)));
        const lo = Math.min(...all), hi = Math.max(...all);
        inst.octave = 2 + Math.floor(lo / 12);
        if (hi - (inst.octave - 2) * 12 > 63) throw new Error(name + ': range too wide');
        notes.sort((a, b) => a.startTick - b.startTick);
        s.tracks.push({ id, name, notes, instrument: inst });
    });
    return M.encodeSongToHex(s);
}

// helpers for writing parts
const chord = (s) => s.split(' ');
function arp(start, len, notes, step) {        // broken chord: notes in turn, `step` beats apart
    const out = [];
    for (let i = 0; i * step < len; i++) out.push([start + i * step, step * 1.5, notes[i % notes.length]]);
    return out;
}

// ------------------------------------------------------------------ 1. EMBERS: the cell, the gate, the hall, the woods
// D minor, slow. A low drone, a swelling pad, a distant tolling note on each bar, and a sparse bell melody.
const dark = song(56, 8, [
    ['drone', instrument(TRIANGLE, 300, { attack: 1500, release: 2000 }),
        [[0, 16, 'D2'], [16, 16, 'D2']]],
    ['pad', instrument(SINE, 200, { attack: 1400, release: 1400, ampLfoHz: 1, ampLfo: 60 }),
        [[0, 8, chord('D3 F3 A3')], [8, 8, chord('D3 F3 Bb3')], [16, 8, chord('D3 G3 Bb3')], [24, 8, chord('C#3 E3 A3')]]],
    ['toll', instrument(TRIANGLE, 260, { attack: 5, decay: 900, sustain: 0, release: 700 }),
        [[0, 2, 'D3'], [4, 2, 'D3'], [8, 2, 'Bb2'], [12, 2, 'Bb2'], [16, 2, 'G2'], [20, 2, 'G2'], [24, 2, 'A2'], [28, 2, 'A2']]],
    ['bell', instrument(TRIANGLE, 330, { attack: 5, decay: 1600, sustain: 0, release: 900, vibHz: 4, vib: 2 }),
        [[0, 3, 'A4'], [3, 1, 'F4'], [4, 2, 'E4'], [6, 2, 'D4'],
         [8, 3, 'F4'], [11, 1, 'D4'], [12, 3, 'C4'],
         [16, 3, 'D4'], [19, 1, 'G4'], [20, 2, 'A4'], [22, 2, 'Bb4'],
         [24, 3, 'A4'], [27, 1, 'C#5'], [28, 4, 'E4']]],
]);

// ------------------------------------------------------------------ 2. WIND: the Frostbitten Field. Nothing but the wind.
const wind = song(60, 8, [
    ['air', instrument(NOISE, 170, { attack: 2500, release: 2500, ampLfoHz: 1, ampLfo: 110 }),
        [[0, 17, 'C4'], [16, 17, 'C4']]],
    ['gusts', instrument(TUNED_NOISE, 210, { attack: 1800, release: 2200, vibHz: 1, vib: 40 }),
        [[1, 6, 'E4'], [9, 4, 'A4'], [14, 7, 'D4'], [23, 5, 'G4'], [28, 4, 'C4']]],
    ['howl', instrument(TUNED_NOISE, 120, { attack: 2500, release: 3000, vibHz: 1, vib: 60 }),
        [[5, 8, 'B4'], [20, 9, 'F#4']]],
]);

// ------------------------------------------------------------------ 3. THE STILL LAKE: mystical. E lydian, a slow shimmer.
const lake = song(66, 8, [
    ['pad', instrument(SINE, 180, { attack: 1600, release: 1800, ampLfoHz: 1, ampLfo: 50 }),
        [[0, 8, chord('E3 G#3 B3 D#4')], [8, 8, chord('E3 F#3 A#3 C#4')], [16, 8, chord('G#3 B3 D#4 F#4')], [24, 8, chord('F#3 A#3 C#4 E4')]]],
    ['harp', instrument(SINE, 240, { attack: 3, decay: 1000, sustain: 0, release: 700, vibHz: 5, vib: 2 }),
        [].concat(arp(0, 8, chord('E4 B4 D#5 F#5 G#5 F#5 D#5 B4'), 0.5),
                  arp(8, 8, chord('F#4 C#5 E5 A#5 C#6 A#5 E5 C#5'), 0.5),
                  arp(16, 8, chord('G#4 D#5 F#5 B5 D#6 B5 F#5 D#5'), 0.5),
                  arp(24, 8, chord('F#4 C#5 E5 A#5 C#6 A#5 G#5 E5'), 0.5))],
    ['stars', instrument(SINE, 140, { attack: 300, decay: 2200, sustain: 0, release: 1500, vibHz: 6, vib: 4 }),
        [[2, 4, 'B5'], [7, 3, 'A#5'], [13, 4, 'G#5'], [18, 4, 'D#6'], [26, 4, 'A#5'], [30, 2, 'G#5']]],
]);

// ------------------------------------------------------------------ 4. ASHEN FORDE: dark and moody again. A phrygian,
// a low bowed line, a drone, and the cracked church bell tolling somewhere in the village.
const town = song(50, 8, [
    ['drone', instrument(SAWTOOTH, 110, { attack: 2000, release: 2000 }),
        [[0, 16, 'A1'], [16, 16, 'A1']]],
    ['pad', instrument(SINE, 150, { attack: 1500, release: 1500 }),
        [[0, 8, chord('A2 C3 E3')], [8, 8, chord('Bb2 D3 F3')], [16, 8, chord('F2 A2 C3')], [24, 8, chord('E2 G#2 B2')]]],
    ['cello', instrument(SAWTOOTH, 230, { attack: 350, decay: 300, sustain: 800, release: 700, vibHz: 5, vib: 3 }),
        [[0, 4, 'A2'], [4, 2, 'Bb2'], [6, 2, 'C3'],
         [8, 6, 'Bb2'], [14, 2, 'A2'],
         [16, 4, 'F2'], [20, 2, 'G2'], [22, 2, 'A2'],
         [24, 6, 'E2'], [30, 2, 'F2']]],
    ['bell', instrument(TRIANGLE, 210, { attack: 3, decay: 2400, sustain: 0, release: 1600 }),
        [[0, 3, chord('A4 E5')], [8, 3, 'F4'], [16, 3, chord('A4 E5')], [24, 3, 'E4']]],
]);

// ------------------------------------------------------------------ 5. THE ABANDONED CAMP: no music, just wind in the trees.
// A soft, steady rush of air, leaves rustling in quick shivers, gusts that swell through, and the odd creak of a branch.
const trees = song(60, 8, [
    ['air', instrument(NOISE, 120, { attack: 2500, release: 2500, ampLfoHz: 1, ampLfo: 70 }),
        [[0, 17, 'C4'], [16, 17, 'C4']]],
    ['leaves', instrument(NOISE, 110, { attack: 600, release: 900, ampLfoHz: 9, ampLfo: 90 }),
        [[2, 3, 'C4'], [7, 2, 'C4'], [11, 4, 'C4'], [18, 2, 'C4'], [21, 3, 'C4'], [27, 4, 'C4']]],
    ['gusts', instrument(TUNED_NOISE, 150, { attack: 1600, release: 2000, vibHz: 1, vib: 50 }),
        [[4, 6, 'B5'], [15, 5, 'E6'], [24, 6, 'A5']]],
    ['creak', instrument(TUNED_NOISE, 140, { attack: 200, decay: 400, sustain: 300, release: 300, vibHz: 3, vib: 8 }),
        [[9, 1, 'D3'], [9.5, 1, 'E3'], [29, 1, 'C3']]],
]);

// ------------------------------------------------------------------ 6. THE CRYPT: a low, cold drone, water dripping in the dark,
// and something heavy shifting far below.
const crypt = song(54, 8, [
    ['drone', instrument(SINE, 200, { attack: 2500, release: 2500, ampLfoHz: 1, ampLfo: 40 }),
        [[0, 16, chord('A1 E2')], [16, 16, chord('Bb1 E2')]]],
    ['drips', instrument(SINE, 190, { attack: 2, decay: 250, sustain: 0, release: 200 }),
        [[1, 0.5, 'E6'], [3.5, 0.5, 'C6'], [6, 0.5, 'E6'], [10.5, 0.5, 'G6'], [13, 0.5, 'D6'], [17.5, 0.5, 'E6'],
         [19, 0.5, 'B5'], [23, 0.5, 'F6'], [26.5, 0.5, 'C6'], [29, 0.5, 'E6'], [30.5, 0.5, 'G6']]],
    ['echo', instrument(SINE, 70, { attack: 2, decay: 400, sustain: 0, release: 300 }),
        [[1.75, 0.5, 'E6'], [6.75, 0.5, 'E6'], [13.75, 0.5, 'D6'], [23.75, 0.5, 'F6'], [29.75, 0.5, 'E6']]],
    ['rumble', instrument(TUNED_NOISE, 120, { attack: 1500, release: 2500, vibHz: 1, vib: 6 }),
        [[8, 6, 'A1'], [24, 5, 'G1']]],
]);

// ------------------------------------------------------------------ 7. THE RED HAND: tense, with drums.
// E minor, driving. A pulsing low bass, war drums, stabbing chords and a cold, climbing lead.
const KICK = 2, SNARE = 3, HAT = 5, TOM_LO = 11, TOM_MID = 12, TOM_HI = 13, CRASH = 20;
function drumBar(b, fill) {
    const t = b * 4, ev = [];
    ev.push([t, 0.5, KICK], [t + 1.5, 0.5, KICK], [t + 2, 0.5, KICK], [t + 1, 0.5, SNARE], [t + 3, 0.5, SNARE]);
    for (let h = 0; h < 8; h++) if (h % 2 == 1) ev.push([t + h / 2, 0.25, HAT]);
    if (fill) ev.push([t + 3, 0.25, TOM_HI], [t + 3.25, 0.25, TOM_MID], [t + 3.5, 0.25, TOM_LO], [t + 3.75, 0.25, TOM_LO]);
    return ev;
}
const BASS_ROOTS = ['E2', 'E2', 'C2', 'C2', 'D2', 'D2', 'B1', 'B1'];
const BASS_TURN = { E2: 'F2', C2: 'D2', D2: 'E2', B1: 'C2' };
const bassLine = [];
BASS_ROOTS.forEach((r, b) => {
    for (let e = 0; e < 8; e++) bassLine.push([b * 4 + e / 2, 0.4, e == 7 ? BASS_TURN[r] : r]);
});
const drums = [];
for (let b = 0; b < 8; b++) drums.push(...drumBar(b, b == 3 || b == 7));
drums.push([0, 1, CRASH], [16, 1, CRASH]);
const redHand = song(132, 8, [
    ['drums', 'DRUMS', drums],
    ['bass', instrument(SAWTOOTH, 260, { attack: 3, decay: 120, sustain: 500, release: 60 }), bassLine],
    ['stabs', instrument(SAWTOOTH, 170, { attack: 5, decay: 300, sustain: 300, release: 200 }),
        [[0, 1.5, chord('E3 G3 B3')], [2.5, 1, chord('E3 G3 B3')], [8, 1.5, chord('C3 E3 G3')], [10.5, 1, chord('C3 E3 G3')],
         [16, 1.5, chord('D3 F#3 A3')], [18.5, 1, chord('D3 F#3 A3')], [24, 1.5, chord('B2 D#3 F#3')], [26.5, 1, chord('B2 D#3 F#3')],
         [4, 1.5, chord('E3 G3 B3')], [12, 1.5, chord('C3 E3 G3')], [20, 1.5, chord('D3 F#3 A3')], [28, 1.5, chord('B2 D#3 F#3')]]],
    ['lead', instrument(TRIANGLE, 240, { attack: 10, decay: 200, sustain: 700, release: 300, vibHz: 6, vib: 3 }),
        [[0, 1.5, 'B4'], [1.5, 0.5, 'C5'], [2, 2, 'B4'], [4, 1, 'G4'], [5, 1, 'A4'], [6, 2, 'B4'],
         [8, 1.5, 'C5'], [9.5, 0.5, 'D5'], [10, 2, 'C5'], [12, 1, 'B4'], [13, 1, 'A4'], [14, 2, 'G4'],
         [16, 1.5, 'A4'], [17.5, 0.5, 'B4'], [18, 2, 'A4'], [20, 1, 'F#4'], [21, 1, 'G4'], [22, 2, 'A4'],
         [24, 1, 'B4'], [25, 1, 'D#5'], [26, 2, 'F#5'], [28, 1, 'E5'], [29, 1, 'D#5'], [30, 2, 'B4']]],
]);

const out = `// Background music – GENERATED by tools/make_music.js (node tools/make_music.js). Don't edit by hand:
// change the composition in the script and run it again. (They also open in MakeCode's Music editor.)
let songDark = music.createSong(hex\`${dark}\`)
let songWind = music.createSong(hex\`${wind}\`)
let songLake = music.createSong(hex\`${lake}\`)
let songTown = music.createSong(hex\`${town}\`)
let songTrees = music.createSong(hex\`${trees}\`)
let songCrypt = music.createSong(hex\`${crypt}\`)
let songRedHand = music.createSong(hex\`${redHand}\`)
`;
fs.writeFileSync(path.join(__dirname, '..', 'music.ts'), out);
console.log('music.ts written:', [dark, wind, lake, town, trees, crypt, redHand].map(h => h.length / 2 + ' bytes').join(', '));
