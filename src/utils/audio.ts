/**
 * Native synthesizer using the Web Audio API
 * Prevents loading external assets, providing immediate and robust audios.
 */

let globalAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  
  if (!globalAudioCtx) {
    globalAudioCtx = new AudioContextClass();
  }
  return globalAudioCtx;
}

export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume if suspended by browser auto-play policy
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
    osc1.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.08); // C6

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc2.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12); // G5

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();

    osc1.stop(ctx.currentTime + 0.35);
    osc2.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.log("Audio play blocked by browser permissions until user interaction");
  }
}

export function playJoinSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    // Slide frequency upwards to denote "appearing"
    osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
    osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.25); // E5

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.log("Audio play blocked by browser permissions");
  }
}

export function playMessageSentSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    // Soft quick mechanical chime
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.05); // D6

    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.log("Audio play blocked");
  }
}

export function playSoundcast(soundType: string) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    if (soundType === "shiver") {
      // Vibrato rapid frequencies
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(600, now);
      
      // Setup a subtle LFO vibrato
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 16; // 16 Hz rapid shake
      lfoGain.gain.value = 45; // Pitch deviation amount
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      
      gainNode.gain.setValueAtTime(0.03, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      lfo.start(now);
      osc.start(now);
      
      lfo.stop(now + 0.6);
      osc.stop(now + 0.6);
    } else if (soundType === "bell") {
      // Metallic deep cathedral gong using multiple oscillators
      const frequencies = [110, 165, 220, 329]; // Sub-harmonics of A
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      gainNode.connect(ctx.destination);

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, now);
        
        // Slightly detune to make it more metallic/eerie
        osc.detune.setValueAtTime(idx * 8 - 12, now);
        
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.25, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        
        osc.connect(oscGain);
        oscGain.connect(gainNode);
        
        osc.start(now);
        osc.stop(now + 1.5);
      });
    } else if (soundType === "flutter") {
      // Flying bats fluttering wings sound
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.5);
      
      // Connect to auto-modulate the gain (wings batting)
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 18; // Flutter speed
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.05;
      
      lfo.connect(lfoGain);
      gainNode.gain.setValueAtTime(0.02, now);
      
      // Mix LFO on volume
      const mixNode = ctx.createGain();
      mixNode.gain.setValueAtTime(0.08, now);
      mixNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      
      osc.connect(gainNode);
      lfoGain.connect(gainNode.gain);
      gainNode.connect(mixNode);
      mixNode.connect(ctx.destination);
      
      lfo.start(now);
      osc.start(now);
      
      lfo.stop(now + 0.5);
      osc.stop(now + 0.5);
    } else if (soundType === "theremin") {
      // Classic vintage theremin sweep
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(380, now);
      // Sweeping glide up and down
      osc.frequency.exponentialRampToValueAtTime(760, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(290, now + 0.8);
      
      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.linearRampToValueAtTime(0.06, now + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.9);
    }
  } catch (e) {
    console.log("Audio play blocked");
  }
}

