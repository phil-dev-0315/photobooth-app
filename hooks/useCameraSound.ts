"use client";

import { useCallback, useRef, useEffect } from "react";

interface UseCameraSoundOptions {
  volume?: number; // 0 to 1
  enabled?: boolean;
}

export function useCameraSound(options: UseCameraSoundOptions = {}) {
  const { volume = 0.5, enabled = true } = options;
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext on first user interaction
  useEffect(() => {
    const initAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };

    // Initialize on any user interaction
    const events = ["click", "touchstart", "keydown"];
    events.forEach((event) => {
      document.addEventListener(event, initAudioContext, { once: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, initAudioContext);
      });
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Generate a realistic camera shutter sound using Web Audio API
  const playShutterSound = useCallback(() => {
    if (!enabled) return;

    // Create or resume audio context
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;

    // Resume if suspended (required for some browsers)
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Master gain for volume control
    const masterGain = ctx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(ctx.destination);

    // === Part 1: Initial mechanical click (shutter opening) ===
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    const clickFilter = ctx.createBiquadFilter();

    clickOsc.type = "square";
    clickOsc.frequency.setValueAtTime(1200, now);
    clickOsc.frequency.exponentialRampToValueAtTime(200, now + 0.02);

    clickFilter.type = "highpass";
    clickFilter.frequency.value = 800;

    clickGain.gain.setValueAtTime(0.8, now);
    clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

    clickOsc.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(masterGain);

    clickOsc.start(now);
    clickOsc.stop(now + 0.03);

    // === Part 2: Mechanical resonance ===
    const resonanceOsc = ctx.createOscillator();
    const resonanceGain = ctx.createGain();

    resonanceOsc.type = "sine";
    resonanceOsc.frequency.setValueAtTime(180, now);
    resonanceOsc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    resonanceGain.gain.setValueAtTime(0.3, now);
    resonanceGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    resonanceOsc.connect(resonanceGain);
    resonanceGain.connect(masterGain);

    resonanceOsc.start(now);
    resonanceOsc.stop(now + 0.08);

    // === Part 3: White noise burst (adds texture) ===
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noiseSource = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();

    noiseSource.buffer = noiseBuffer;

    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 2000;
    noiseFilter.Q.value = 1;

    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    noiseSource.start(now);

    // === Part 4: Second click (shutter closing) ===
    const click2Osc = ctx.createOscillator();
    const click2Gain = ctx.createGain();
    const click2Filter = ctx.createBiquadFilter();

    click2Osc.type = "square";
    click2Osc.frequency.setValueAtTime(800, now + 0.06);
    click2Osc.frequency.exponentialRampToValueAtTime(150, now + 0.09);

    click2Filter.type = "highpass";
    click2Filter.frequency.value = 600;

    click2Gain.gain.setValueAtTime(0, now);
    click2Gain.gain.setValueAtTime(0.6, now + 0.06);
    click2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    click2Osc.connect(click2Filter);
    click2Filter.connect(click2Gain);
    click2Gain.connect(masterGain);

    click2Osc.start(now + 0.06);
    click2Osc.stop(now + 0.1);

  }, [enabled, volume]);

  // Play a countdown beep sound
  const playBeepSound = useCallback((isLastBeep = false) => {
    if (!enabled) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = isLastBeep ? 880 : 660; // Higher pitch for last beep

    gain.gain.setValueAtTime(volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + (isLastBeep ? 0.15 : 0.1));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + (isLastBeep ? 0.15 : 0.1));
  }, [enabled, volume]);

  return {
    playShutterSound,
    playBeepSound,
  };
}
