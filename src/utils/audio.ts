/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple Audio Engine using Web Audio API to create authentic retro 8-bit sounds.
let audioCtx: AudioContext | null = null;
let isMutedGlobal = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // Avoid checking constructor in a way that crashes on old browsers
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export const setMuted = (muted: boolean) => {
  isMutedGlobal = muted;
};

export const getMuted = (): boolean => {
  return isMutedGlobal;
};

function playTone(freqStart: number, freqEnd: number, duration: number, type: OscillatorType = 'square') {
  if (isMutedGlobal) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Ensure state is running
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
    }

    // Set gain curve to avoid clicks and simulate 8-bit decay
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error('Failed to play tone:', e);
  }
}

export const soundEffects = {
  move: () => {
    // Elegant short beep
    playTone(880, 880, 0.04, 'square');
  },
  rotate: () => {
    // Chirp up
    playTone(600, 1000, 0.08, 'square');
  },
  land: () => {
    // Downwards thud
    playTone(150, 80, 0.1, 'triangle');
  },
  clear: () => {
    // Twin tone success
    playTone(440, 880, 0.15, 'square');
    setTimeout(() => {
      playTone(554, 1109, 0.15, 'square');
    }, 100);
  },
  levelUp: () => {
    const tones = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    tones.forEach((freq, idx) => {
      setTimeout(() => {
        playTone(freq, freq, 0.12, 'square');
      }, idx * 100);
    });
  },
  gameOver: () => {
    // Sad slow slide
    playTone(300, 50, 0.6, 'sawtooth');
  },
};
