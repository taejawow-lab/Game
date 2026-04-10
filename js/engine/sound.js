// Sound Engine with BGM
// Web Audio API - retro sound effects + cheerful background music

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.initialized = false;
        this.bgmPlaying = false;
        this.bgmGain = null;
        this.bgmInterval = null;
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

    // --- BGM: Stage-based chiptune melodies ---
    startBGM(stageIndex) {
        if (!this.enabled || !this.ctx || this.bgmPlaying) return;
        this.bgmPlaying = true;
        this.resume();

        const C4=262, D4=294, E4=330, F4=349, G4=392, A4=440, B4=494;
        const C5=523, D5=587, E5=659, F5=698, G5=784, A5=880;

        // Stage group BGM definitions
        const bgmData = this._getBGMData(stageIndex || 0, C4,D4,E4,F4,G4,A4,B4,C5,D5,E5,F5,G5,A5);
        const melody = bgmData.melody;
        const bass = bgmData.bass;
        const noteDuration = bgmData.noteDuration;

        let noteIndex = 0;

        const playNext = () => {
            if (!this.bgmPlaying || !this.enabled) return;
            try {
                const t = this.ctx.currentTime;
                // Melody
                const osc1 = this.ctx.createOscillator();
                const g1 = this.ctx.createGain();
                osc1.type = 'square';
                osc1.frequency.setValueAtTime(melody[noteIndex % melody.length], t);
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
                osc2.frequency.setValueAtTime(bass[noteIndex % bass.length] / 2, t);
                g2.gain.setValueAtTime(0.05, t);
                g2.gain.exponentialRampToValueAtTime(0.001, t + noteDuration * 0.9);
                osc2.connect(g2);
                g2.connect(this.bgmGain);
                osc2.start(t);
                osc2.stop(t + noteDuration);

                noteIndex++;
            } catch (e) { /* ignore */ }
        };

        this.bgmInterval = setInterval(playNext, noteDuration * 1000);
        playNext();
    }

    _getBGMData(stageIndex, C4,D4,E4,F4,G4,A4,B4,C5,D5,E5,F5,G5,A5) {
        const group = Math.floor(stageIndex / 2);
        switch (group) {
            case 0: // Stage 0-1: Relaxed alley walk
                return {
                    noteDuration: 0.22,
                    melody: [
                        C5, E5, G5, E5, C5, D5, E5, C5,
                        G4, A4, B4, C5, D5, C5, B4, A4,
                        C5, E5, G5, E5, D5, E5, C5, G4,
                        A4, B4, C5, D5, E5, D5, C5, C5,
                    ],
                    bass: [
                        C4, C4, G4, G4, F4, F4, C4, C4,
                        E4, E4, G4, G4, A4, A4, G4, G4,
                        C4, C4, G4, G4, F4, F4, C4, C4,
                        A4, A4, G4, G4, C4, C4, C4, C4,
                    ],
                };
            case 1: // Stage 2-3: Bright playground
                return {
                    noteDuration: 0.18,
                    melody: [
                        E5, G5, A5, G5, E5, D5, E5, G5,
                        C5, D5, E5, G5, A5, G5, E5, D5,
                        G5, E5, D5, C5, D5, E5, G5, A5,
                        E5, D5, C5, D5, E5, G5, E5, C5,
                    ],
                    bass: [
                        C4, C4, E4, E4, G4, G4, C4, C4,
                        A4, A4, G4, G4, F4, F4, E4, E4,
                        C4, C4, E4, E4, G4, G4, A4, A4,
                        F4, F4, G4, G4, C4, C4, C4, C4,
                    ],
                };
            case 2: // Stage 4-5: Bicycle tension
                return {
                    noteDuration: 0.15,
                    melody: [
                        E5, E5, G5, A5, G5, E5, D5, C5,
                        D5, E5, G5, E5, D5, C5, D5, E5,
                        A5, G5, E5, D5, E5, G5, A5, G5,
                        C5, D5, E5, D5, C5, B4, C5, C5,
                    ],
                    bass: [
                        A4, A4, E4, E4, F4, F4, G4, G4,
                        A4, A4, G4, G4, F4, F4, E4, E4,
                        A4, A4, E4, E4, F4, F4, G4, G4,
                        C4, C4, G4, G4, A4, A4, A4, A4,
                    ],
                };
            case 3: // Stage 6-7: Busy downtown
                return {
                    noteDuration: 0.13,
                    melody: [
                        G5, A5, G5, E5, G5, A5, G5, E5,
                        D5, E5, G5, A5, G5, E5, D5, C5,
                        E5, G5, A5, G5, E5, D5, E5, G5,
                        A5, G5, E5, D5, C5, D5, E5, E5,
                    ],
                    bass: [
                        C4, E4, G4, C4, E4, G4, A4, G4,
                        F4, G4, A4, G4, F4, E4, D4, C4,
                        C4, E4, G4, C4, E4, G4, A4, G4,
                        F4, E4, D4, C4, G4, G4, C4, C4,
                    ],
                };
            case 4: // Stage 8-9: Rush hour urgency
            default:
                return {
                    noteDuration: 0.11,
                    melody: [
                        A5, G5, E5, G5, A5, G5, E5, D5,
                        E5, G5, A5, G5, E5, D5, C5, D5,
                        E5, G5, A5, G5, A5, G5, E5, D5,
                        C5, D5, E5, D5, C5, B4, A4, A4,
                    ],
                    bass: [
                        A4, A4, E4, E4, A4, A4, G4, G4,
                        F4, F4, E4, E4, D4, D4, C4, C4,
                        A4, A4, E4, E4, A4, A4, G4, G4,
                        F4, F4, E4, E4, A4, A4, A4, A4,
                    ],
                };
        }
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }

    // --- Sound Effects ---
    move() { this.playTone(220, 0.04, 'square', 0.04, false); }

    step() { this.playTone(140 + Math.random() * 30, 0.05, 'triangle', 0.06); }

    gameOver() {
        this.stopBGM();
        if (!this.enabled || !this.ctx) return;
        setTimeout(() => this.playTone(440, 0.15, 'square', 0.15), 0);
        setTimeout(() => this.playTone(330, 0.15, 'square', 0.13), 150);
        setTimeout(() => this.playTone(220, 0.15, 'square', 0.11), 300);
        setTimeout(() => this.playTone(110, 0.4, 'sawtooth', 0.1), 450);
    }

    stageClear() {
        this.stopBGM();
        if (!this.enabled || !this.ctx) return;
        const notes = [523, 587, 659, 784, 659, 784, 1047];
        let time = 0;
        for (const note of notes) {
            setTimeout(() => this.playTone(note, 0.2, 'square', 0.12), time);
            time += 120;
        }
    }

    select() {
        this.playTone(660, 0.07, 'square', 0.1);
        setTimeout(() => this.playTone(880, 0.09, 'square', 0.08), 70);
    }

    stageStart() { this.playSweep(330, 660, 0.25, 'square', 0.1); }

    kick() { this.playSweep(200, 600, 0.08, 'triangle', 0.08); }

    motorPass() { this.playSweep(80, 120, 0.25, 'sawtooth', 0.04); }

    bicycleBell() {
        this.playTone(1200, 0.07, 'sine', 0.06);
        setTimeout(() => this.playTone(1400, 0.09, 'sine', 0.04), 80);
    }

    bombHit() {
        if (!this.enabled || !this.ctx) return;
        this.playSweep(400, 100, 0.2, 'sawtooth', 0.12);
        setTimeout(() => this.playTone(80, 0.15, 'square', 0.1), 100);
    }

    starGet() {
        if (!this.enabled || !this.ctx) return;
        this.playTone(880, 0.08, 'square', 0.1);
        setTimeout(() => this.playTone(1100, 0.08, 'square', 0.08), 80);
        setTimeout(() => this.playTone(1320, 0.1, 'square', 0.08), 160);
        setTimeout(() => this.playTone(1760, 0.15, 'sine', 0.06), 240);
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) this.stopBGM();
        return this.enabled;
    }
}

const Sound = new SoundEngine();
