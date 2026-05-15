/**
 * Tiny synthesised "ding" for the live-page inject-arrival modal. Uses
 * the Web Audio API so we don't have to ship an asset. Browsers gate
 * AudioContext on a user gesture — this is fine because the chime is
 * triggered from a poll-driven state change AFTER the user has clicked
 * around (in practice after they've claimed a seat / joined the room).
 *
 * Opt-out via a localStorage flag: snapfix-arrival-chime = "off".
 */

const KEY = "snapfix-arrival-chime";

export function isChimeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setChimeEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // ignore
  }
}

export function playArrivalChime(kind: "INJECT" | "EVENT" = "INJECT"): void {
  if (typeof window === "undefined") return;
  if (!isChimeEnabled()) return;
  try {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtor) return;
    const ctx = new AudioCtor();

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);

    // Two-tone bell — inject gets a higher, urgent pair; event a calmer one.
    const tones = kind === "INJECT" ? [880, 1320] : [660, 880];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.22);
    });

    // Quick attack / decay envelope.
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    // Cleanup
    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        // ignore
      }
    }, 600);
  } catch {
    // ignore — audio is non-essential
  }
}
