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

const out = `// Background music – GENERATED by tools/make_music.js (node tools/make_music.js). Don't edit by hand:
// change the composition in the script and run it again. (They also open in MakeCode's Music editor.)
let songDark = music.createSong(hex\`${dark}\`)
let songWind = music.createSong(hex\`${wind}\`)
let songLake = music.createSong(hex\`${lake}\`)
let songTown = music.createSong(hex\`${town}\`)
`;
fs.writeFileSync(path.join(__dirname, '..', 'music.ts'), out);
console.log('music.ts written:', [dark, wind, lake, town].map(h => h.length / 2 + ' bytes').join(', '));
