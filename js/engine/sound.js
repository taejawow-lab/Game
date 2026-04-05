// Sound Engine with BGM
// Web Audio API - retro sound effects + cheerful background music

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.initialized = false;
        this.bgmPlaying = false;
        this.bgmGain = null;
        this.bgmTimeout = null;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.value = 0.08;
            this.bgmGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            this.enabled = false;
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, duration, type, volume, ramp) {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type || 'square';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(volume || 0.12, this.ctx.currentTime);
            if (ramp !== false) {
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            }
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) { /* ignore */ }
    }

    // Schedule a tone at an exact audio time (avoids setTimeout drift)
    playToneAt(freq, duration, type, volume, atTime) {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type || 'square';
            osc.frequency.setValueAtTime(freq, atTime);
            gain.gain.setValueAtTime(volume || 0.12, atTime);
            gain.gain.exponentialRampToValueAtTime(0.001, atTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(atTime);
            osc.stop(atTime + duration);
        } catch (e) { /* ignore */ }
    }

    playSweep(startFreq, endFreq, duration, type, volume) {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type || 'square';
            osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
            gain.gain.setValueAtTime(volume || 0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) { /* ignore */ }
    }

    // --- BGM: Cheerful chiptune melody using Web Audio scheduling ---
    startBGM() {
        if (!this.enabled || !this.ctx || this.bgmPlaying) return;
        this.bgmPlaying = true;
        this.resume();

        const C4=262, D4=294, E4=330, F4=349, G4=392, A4=440, B4=494;
        const C5=523, D5=587, E5=659, G5=784;

        const melody = [
            C5, E5, G5, E5, C5, D5, E5, C5,
            G4, A4, B4, C5, D5, C5, B4, A4,
            C5, E5, G5, E5, D5, E5, C5, G4,
            A4, B4, C5, D5, E5, D5, C5, C5,
        ];
        const bass = [
            C4, C4, G4, G4, F4, F4, C4, C4,
            E4, E4, G4, G4, A4, A4, G4, G4,
            C4, C4, G4, G4, F4, F4, C4, C4,
            A4, A4, G4, G4, C4, C4, C4, C4,
        ];

        const noteDuration = 0.18;
        const batchSize = melody.length; // schedule one full loop at a time
        let nextNoteTime = this.ctx.currentTime;
        let noteIndex = 0;

        const scheduleBatch = () => {
            if (!this.bgmPlaying || !this.enabled) return;
            try {
                // Schedule a full loop of notes ahead
                for (let i = 0; i < batchSize; i++) {
                    const t = nextNoteTime;
                    // Melody
                    const osc1 = this.ctx.createOscillator();
                    const g1 = this.ctx.createGain();
                    osc1.type = 'square';
                    osc1.frequency.setValueAtTime(melody[(noteIndex + i) % melody.length], t);
                    g1.gain.setValueAtTime(0.06, t);
                    g1.gain.exponentialRampToValueAtTime(0.001, t + noteDuration * 0.9);
                    osc1.connect(g1);
                    g1.connect(this.bgmGain);
                    osc1.start(t);
                    osc1.stop(t + noteDuration);

                    // Bass
                    const osc2 = this.ctx.createOscillator();
                    const g2 = this.ctx.createGain();
                    osc2.type = 'triangle';
                    osc2.frequency.setValueAtTime(bass[(noteIndex + i) % bass.length] / 2, t);
                    g2.gain.setValueAtTime(0.05, t);
                    g2.gain.exponentialRampToValueAtTime(0.001, t + noteDuration * 0.9);
                    osc2.connect(g2);
                    g2.connect(this.bgmGain);
                    osc2.start(t);
                    osc2.stop(t + noteDuration);

                    nextNoteTime += noteDuration;
                }
                noteIndex += batchSize;
            } catch (e) { /* ignore */ }

            // Schedule next batch slightly before current batch ends
            const batchDuration = batchSize * noteDuration * 1000;
            this.bgmTimeout = setTimeout(scheduleBatch, batchDuration - 100);
        };

        scheduleBatch();
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimeout) {
            clearTimeout(this.bgmTimeout);
            this.bgmTimeout = null;
        }
    }

    // --- Sound Effects (use Web Audio scheduling instead of setTimeout) ---
    move() { this.playTone(220, 0.04, 'square', 0.04, false); }

    step() { this.playTone(140 + Math.random() * 30, 0.05, 'triangle', 0.06); }

    gameOver() {
        this.stopBGM();
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        this.playToneAt(440, 0.15, 'square', 0.15, t);
        this.playToneAt(330, 0.15, 'square', 0.13, t + 0.15);
        this.playToneAt(220, 0.15, 'square', 0.11, t + 0.3);
        this.playToneAt(110, 0.4, 'sawtooth', 0.1, t + 0.45);
    }

    stageClear() {
        this.stopBGM();
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        const notes = [523, 587, 659, 784, 659, 784, 1047];
        for (let i = 0; i < notes.length; i++) {
            this.playToneAt(notes[i], 0.2, 'square', 0.12, t + i * 0.12);
        }
    }

    select() {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        this.playToneAt(660, 0.07, 'square', 0.1, t);
        this.playToneAt(880, 0.09, 'square', 0.08, t + 0.07);
    }

    stageStart() { this.playSweep(330, 660, 0.25, 'square', 0.1); }

    kick() { this.playSweep(200, 600, 0.08, 'triangle', 0.08); }

    motorPass() { this.playSweep(80, 120, 0.25, 'sawtooth', 0.04); }

    bicycleBell() {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        this.playToneAt(1200, 0.07, 'sine', 0.06, t);
        this.playToneAt(1400, 0.09, 'sine', 0.04, t + 0.08);
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) this.stopBGM();
        return this.enabled;
    }
}

const Sound = new SoundEngine();
