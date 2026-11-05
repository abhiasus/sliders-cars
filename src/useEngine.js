import { useRef, useState, useCallback, useEffect } from "react";

// Synthesised engine rev with the Web Audio API, so no audio files are needed.
export default function useEngine() {
  const ctxRef = useRef(null);
  const stopRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const stop = useCallback(() => {
    if (stopRef.current) { stopRef.current(); stopRef.current = null; }
    setPlaying(false);
  }, []);

  const play = useCallback((profile) => {
    stop();
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = ctxRef.current || (ctxRef.current = new AC());
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const { idle, peak, grit } = profile;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.35, now + 0.15);
    master.gain.setValueAtTime(0.35, now + 2.6);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(2600, now + 2.2);
    filter.frequency.exponentialRampToValueAtTime(700, now + 3.8);
    filter.Q.value = 4;

    const dist = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = (i / 128) - 1; curve[i] = Math.tanh(x * (2 + grit * 4)); }
    dist.curve = curve;

    const o1 = ctx.createOscillator(); o1.type = "sawtooth";
    const o2 = ctx.createOscillator(); o2.type = "square";
    const o3 = ctx.createOscillator(); o3.type = "sawtooth";
    [o1, o2, o3].forEach((o, i) => {
      const m = [1, 0.5, 2][i];
      o.frequency.setValueAtTime(idle * m, now);
      o.frequency.exponentialRampToValueAtTime(peak * m, now + 2.2);
      o.frequency.exponentialRampToValueAtTime(idle * 2 * m, now + 3.8);
    });
    const g1 = ctx.createGain(); g1.gain.value = 0.5;
    const g2 = ctx.createGain(); g2.gain.value = 0.35;
    const g3 = ctx.createGain(); g3.gain.value = 0.15;

    // low rumble so the engine "chops" like cylinders firing
    const lfo = ctx.createOscillator(); lfo.frequency.value = idle / 4;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.25;
    const wob = ctx.createGain(); wob.gain.value = 0.75;
    lfo.connect(lfoGain); lfoGain.connect(wob.gain);

    o1.connect(g1); o2.connect(g2); o3.connect(g3);
    g1.connect(dist); g2.connect(dist); g3.connect(dist);
    dist.connect(filter); filter.connect(wob); wob.connect(master); master.connect(ctx.destination);

    [o1, o2, o3, lfo].forEach((o) => o.start(now));
    const end = now + 3.9;
    [o1, o2, o3, lfo].forEach((o) => o.stop(end));
    setPlaying(true);
    const timer = setTimeout(() => { stopRef.current = null; setPlaying(false); }, 3900);

    stopRef.current = () => {
      clearTimeout(timer);
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
      master.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      [o1, o2, o3, lfo].forEach((o) => { try { o.stop(t + 0.15); } catch (e) {} });
    };
  }, [stop]);

  useEffect(() => stop, [stop]);
  return { playing, play, stop };
}
