/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';

interface KeypadProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onMoveDown: () => void;
  onRotate: () => void;
}

export const Keypad: React.FC<KeypadProps> = ({
  onMoveLeft,
  onMoveRight,
  onMoveDown,
  onRotate,
}) => {
  // Safe helper to handle touch/mouse triggering without zoom or focus issues
  const createButtonTrigger = (handler: () => void) => {
    return (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      handler();
    };
  };

  return (
    <div
      id="modern-touch-controls"
      className="relative flex flex-col items-center justify-center bg-[#111318]/90 p-4 sm:p-5 rounded-2xl w-full max-w-[340px] sm:max-w-[380px] shadow-[0_12px_24px_rgba(0,0,0,0.5),_inset_0_1px_1px_rgba(255,255,255,0.05)] border border-slate-800/80 backdrop-blur"
    >
      {/* Visual branding decor line */}
      <div className="w-12 h-1 bg-slate-800 rounded-full mb-5 opacity-40" />

      {/* Aligned gaming D-pad diamond controller */}
      <div className="relative w-48 h-48 flex items-center justify-center select-none">
        {/* Sleek backing glossy circle panel */}
        <div className="absolute w-[180px] h-[180px] rounded-full bg-gradient-to-b from-slate-900 via-slate-950 to-[#0c0d10] border border-slate-800/60 shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)]" />

        {/* Central glowing core decoration */}
        <div className="absolute w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center z-10 pointer-events-none shadow-lg">
          <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4] animate-pulse" />
        </div>

        {/* UP BUTTON (ROTATE / DÖNDÜR) */}
        <button
          id="dpad-up"
          onMouseDown={createButtonTrigger(onRotate)}
          onTouchStart={createButtonTrigger(onRotate)}
          className="absolute top-0 w-14 h-14 rounded-xl bg-gradient-to-b from-[#222733] to-[#151922] border border-slate-700/50 shadow-[0_4px_10px_rgba(0,0,0,0.4),_inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-95 active:from-cyan-900 active:to-cyan-950 active:border-cyan-500/50 transition-all flex flex-col items-center justify-center text-slate-300 active:text-cyan-400 group cursor-pointer"
          aria-label="Rotate / Döndür"
        >
          <ChevronUp className="w-6 h-6 transition-transform group-active:translate-y-[-2px]" />
          <span className="text-[8px] font-black tracking-widest leading-none mt-0.5 uppercase opacity-60">DÖNDÜR</span>
        </button>

        {/* LEFT BUTTON (SOLA TAŞI) */}
        <button
          id="dpad-left"
          onMouseDown={createButtonTrigger(onMoveLeft)}
          onTouchStart={createButtonTrigger(onMoveLeft)}
          className="absolute left-0 w-14 h-14 rounded-xl bg-gradient-to-b from-[#222733] to-[#151922] border border-slate-700/50 shadow-[0_4px_10px_rgba(0,0,0,0.4),_inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-95 active:from-cyan-900 active:to-cyan-950 active:border-cyan-500/50 transition-all flex flex-col items-center justify-center text-slate-300 active:text-cyan-400 group cursor-pointer"
          aria-label="Move Left / Sola"
        >
          <ChevronLeft className="w-6 h-6 transition-transform group-active:translate-x-[-2px]" />
          <span className="text-[8px] font-black tracking-widest leading-none mt-0.5 uppercase opacity-60">SOL</span>
        </button>

        {/* RIGHT BUTTON (SAĞA TAŞI) */}
        <button
          id="dpad-right"
          onMouseDown={createButtonTrigger(onMoveRight)}
          onTouchStart={createButtonTrigger(onMoveRight)}
          className="absolute right-0 w-14 h-14 rounded-xl bg-gradient-to-b from-[#222733] to-[#151922] border border-slate-700/50 shadow-[0_4px_10px_rgba(0,0,0,0.4),_inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-95 active:from-cyan-900 active:to-cyan-950 active:border-cyan-500/50 transition-all flex flex-col items-center justify-center text-slate-300 active:text-cyan-400 group cursor-pointer"
          aria-label="Move Right / Sağa"
        >
          <ChevronRight className="w-6 h-6 transition-transform group-active:translate-x-[2px]" />
          <span className="text-[8px] font-black tracking-widest leading-none mt-0.5 uppercase opacity-60">SAĞ</span>
        </button>

        {/* DOWN BUTTON (AŞAĞI HIZLANDIR) */}
        <button
          id="dpad-down"
          onMouseDown={createButtonTrigger(onMoveDown)}
          onTouchStart={createButtonTrigger(onMoveDown)}
          className="absolute bottom-0 w-14 h-14 rounded-xl bg-gradient-to-b from-[#222733] to-[#151922] border border-slate-700/50 shadow-[0_4px_10px_rgba(0,0,0,0.4),_inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-95 active:from-cyan-900 active:to-cyan-950 active:border-cyan-500/50 transition-all flex flex-col items-center justify-center text-slate-300 active:text-cyan-400 group cursor-pointer"
          aria-label="Move Down / Aşağı"
        >
          <ChevronDown className="w-6 h-6 transition-transform group-active:translate-y-[2px]" />
          <span className="text-[8px] font-black tracking-widest leading-none mt-0.5 uppercase opacity-60">AŞAĞI</span>
        </button>
      </div>

      {/* Soft indicator of controls */}
      <span className="text-[9px] text-slate-500 tracking-wider uppercase font-extrabold mt-4 select-none opacity-40">
        Özel Mobil Dokunmatik Kumanda
      </span>
    </div>
  );
};
