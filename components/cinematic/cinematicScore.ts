"use client";

import * as Tone from "tone";

/**
 * CinematicScore — programmatic Tone.js composition for the autoplay
 * intro film. Built around a Cmin → Abmaj7 → Bbsus4 → Ebmaj9 progression
 * with sub-drone, kicks on each headline impact, white-noise riser, and
 * a final fortissimo stab.
 *
 * No audio assets shipped — every voice is synthesized at play time so
 * the bundle stays light and the score stays in lockstep with the
 * visual timeline (timestamps in `play()` are the SOURCE OF TRUTH the
 * visual GSAP timeline mirrors).
 *
 * `start()` requires a user gesture — Tone.start() resumes the
 * AudioContext which all evergreen browsers gate behind interaction.
 */
export class CinematicScore {
  private nodes: Array<{ dispose?: () => void; stop?: (t?: number) => void }> = [];
  private started = false;

  /** Beat timestamps (in seconds from t=0) the visual timeline syncs to. */
  static readonly BEATS = {
    droneStart: 0,
    padIn: 1.0,
    impact1: 3.0, // "I"
    impact2: 3.4, // "build"
    impact3: 3.9, // "products" sweep
    chordChange1: 5.0, // Abmaj7
    impact4: 6.5, // line break / dolly
    impact5: 8.0, // "use." stab
    chordChange2: 9.5, // Bbsus4
    domain1: 10.5, // "AI"
    domain2: 11.2, // "health"
    domain3: 11.9, // "consumer"
    riserStart: 12.5,
    finalImpact: 14.0, // "Siddharth Agrawal"
    chordChange3: 14.0, // Ebmaj9 swell
    decay: 17.0,
    end: 22.0,
  };

  async start() {
    if (this.started) return;
    this.started = true;
    await Tone.start();

    const ctxNow = Tone.now();
    const t0 = ctxNow + 0.05;

    // Master reverb — long cinematic tail.
    const reverb = new Tone.Reverb({ decay: 9, wet: 0.45 }).toDestination();
    await reverb.generate();
    this.nodes.push(reverb);

    // Master compressor + limiter to keep the swell safe.
    const limiter = new Tone.Limiter(-1).connect(reverb);
    const comp = new Tone.Compressor(-18, 3).connect(limiter);
    this.nodes.push(limiter, comp);

    // -- Sub drone (55 Hz sine, fades in) ---------------------------------
    const drone = new Tone.Oscillator(55, "sine").connect(comp);
    drone.volume.value = -60;
    drone.start(t0);
    drone.volume.setValueAtTime(-60, t0);
    drone.volume.linearRampToValueAtTime(-22, t0 + 2);
    drone.volume.linearRampToValueAtTime(-18, t0 + CinematicScore.BEATS.finalImpact);
    drone.volume.linearRampToValueAtTime(-60, t0 + CinematicScore.BEATS.end);
    drone.stop(t0 + CinematicScore.BEATS.end + 0.2);
    this.nodes.push(drone);

    // -- Pad (PolySynth, slow attack/release) -----------------------------
    const pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 1.2, decay: 0.4, sustain: 0.7, release: 4.5 },
    }).connect(comp);
    pad.volume.value = -16;
    this.nodes.push(pad);

    // Cmin → Abmaj7 → Bbsus4 → Ebmaj9
    pad.triggerAttackRelease(["C3", "Eb3", "G3"], 4, t0 + CinematicScore.BEATS.padIn);
    pad.triggerAttackRelease(
      ["Ab2", "C3", "Eb3", "G3"],
      4,
      t0 + CinematicScore.BEATS.chordChange1,
    );
    pad.triggerAttackRelease(
      ["Bb2", "Eb3", "F3"],
      3.5,
      t0 + CinematicScore.BEATS.chordChange2,
    );
    pad.triggerAttackRelease(
      ["Eb2", "G2", "Bb2", "D3", "F3"],
      6,
      t0 + CinematicScore.BEATS.chordChange3,
    );

    // -- Kick / impact (MembraneSynth) ------------------------------------
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      envelope: { attack: 0.001, decay: 0.45, sustain: 0.0, release: 1.4, attackCurve: "exponential" },
    }).connect(comp);
    kick.volume.value = -4;
    this.nodes.push(kick);

    const kickAt = (when: number, note: string = "C2") => {
      kick.triggerAttackRelease(note, "8n", t0 + when);
    };
    kickAt(CinematicScore.BEATS.impact1, "C2");
    kickAt(CinematicScore.BEATS.impact2, "C2");
    kickAt(CinematicScore.BEATS.impact3, "G1");
    kickAt(CinematicScore.BEATS.impact4, "C2");
    kickAt(CinematicScore.BEATS.impact5, "F1");
    kickAt(CinematicScore.BEATS.domain1, "Eb2");
    kickAt(CinematicScore.BEATS.domain2, "G2");
    kickAt(CinematicScore.BEATS.domain3, "Bb1");

    // -- White-noise riser into the final impact --------------------------
    const noise = new Tone.Noise("white");
    const noiseFilter = new Tone.Filter(200, "bandpass");
    const noiseGain = new Tone.Gain(0).connect(comp);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noise.start(t0 + CinematicScore.BEATS.riserStart);
    noiseFilter.frequency.setValueAtTime(200, t0 + CinematicScore.BEATS.riserStart);
    noiseFilter.frequency.exponentialRampToValueAtTime(
      8000,
      t0 + CinematicScore.BEATS.finalImpact,
    );
    noiseGain.gain.setValueAtTime(0, t0 + CinematicScore.BEATS.riserStart);
    noiseGain.gain.linearRampToValueAtTime(0.18, t0 + CinematicScore.BEATS.finalImpact - 0.05);
    noiseGain.gain.linearRampToValueAtTime(0, t0 + CinematicScore.BEATS.finalImpact + 0.4);
    noise.stop(t0 + CinematicScore.BEATS.finalImpact + 0.5);
    this.nodes.push(noise, noiseFilter, noiseGain);

    // -- Final stab (AMSynth chord) ---------------------------------------
    const stab = new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 1.5,
      envelope: { attack: 0.005, decay: 1.5, sustain: 0.4, release: 5 },
      modulationEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 4 },
    }).connect(comp);
    stab.volume.value = -8;
    stab.triggerAttackRelease(
      ["Eb2", "Bb2", "Eb3", "G3", "D4"],
      5,
      t0 + CinematicScore.BEATS.finalImpact,
    );
    this.nodes.push(stab);

    // -- Soft hi-hat ticks under the domain words -------------------------
    const tick = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.08, release: 0.05 },
      harmonicity: 5.1,
      modulationIndex: 12,
      resonance: 4000,
      octaves: 1.2,
    }).connect(comp);
    tick.volume.value = -28;
    [10.5, 10.85, 11.2, 11.55, 11.9, 12.25].forEach((t) => {
      tick.triggerAttackRelease("16n", t0 + t);
    });
    this.nodes.push(tick);
  }

  /** Stop everything immediately and dispose. Idempotent. */
  stop() {
    if (!this.started) return;
    const now = Tone.now();
    this.nodes.forEach((n) => {
      try {
        n.stop?.(now);
      } catch {
        // ignore
      }
    });
    // Defer dispose so trailing reverb tails finish cleanly.
    setTimeout(() => {
      this.nodes.forEach((n) => {
        try {
          n.dispose?.();
        } catch {
          // ignore
        }
      });
      this.nodes = [];
    }, 200);
    this.started = false;
  }
}
