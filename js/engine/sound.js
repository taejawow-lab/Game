// Sound Engine
// Web Audio API based retro sound effects - no external files needed

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.initialized = false;
    }

    // Must be called from a user gesture (click/tap) to unlock audio
    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            this.enabled = false;
        }
    }

    // Resume audio context if suspended (mobile browser requirement)
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Play a tone with given parameters
    playTone(freq, duration, type = 'square', volume = 0.15, ramp = true) {
        if (!this.enabled || !this.ctx) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);

        if (ramp) {
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        }

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    // Play a frequency sweep
    playSweep(startFreq, endFreq, duration, type = 'square', volume = 0.12) {
        if (!this.enabled || !this.ctx) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    // --- Game Sound Effects ---

    // Player moves left/right
    move() {
        this.playTone(220, 0.05, 'square', 0.06, false);
    }

    // Step sound (walking rhythm)
    step() {
        this.playTone(150 + Math.random() * 30, 0.06, 'triangle', 0.08);
    }

    // Collision / Game Over
    gameOver() {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        // Descending tones
        setTimeout(() => this.playTone(440, 0.15, 'square', 0.2), 0);
        setTimeout(() => this.playTone(330, 0.15, 'square', 0.18), 150);
        setTimeout(() => this.playTone(220, 0.15, 'square', 0.16), 300);
        setTimeout(() => this.playTone(110, 0.4, 'sawtooth', 0.15), 450);
    }

    // Stage Clear - victory jingle
    stageClear() {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const notes = [523, 587, 659, 784, 659, 784, 1047];
        const durations = [0.1, 0.1, 0.1, 0.15, 0.1, 0.15, 0.3];
        let time = 0;
        for (let i = 0; i < notes.length; i++) {
            setTimeout(() => this.playTone(notes[i], durations[i] + 0.1, 'square', 0.15), time * 1000);
            time += durations[i] + 0.02;
        }
    }

    // Menu select / button press
    select() {
        this.playTone(660, 0.08, 'square', 0.12);
        setTimeout(() => this.playTone(880, 0.1, 'square', 0.1), 80);
    }

    // Stage start
    stageStart() {
        this.playSweep(330, 660, 0.3, 'square', 0.12);
    }

    // Obstacle nearby warning (subtle)
    warning() {
        this.playTone(200, 0.1, 'sine', 0.05);
    }

    // Soccer ball kick
    kick() {
        this.playSweep(200, 600, 0.1, 'triangle', 0.1);
    }

    // Motorcycle passing
    motorPass() {
        this.playSweep(80, 120, 0.3, 'sawtooth', 0.06);
    }

    // Bicycle bell
    bicycleBell() {
        this.playTone(1200, 0.08, 'sine', 0.08);
        setTimeout(() => this.playTone(1400, 0.1, 'sine', 0.06), 100);
    }

    // Toggle sound on/off
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// Global sound instance
const Sound = new SoundEngine();
