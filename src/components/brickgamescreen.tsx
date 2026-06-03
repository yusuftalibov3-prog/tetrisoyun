/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Board, Tetromino, GameState, TetrominoType } from '../types';
import { Volume2, VolumeX, Pause, RefreshCw, Trophy } from 'lucide-react';

interface BrickGameScreenProps {
  board: Board;
  currentPiece: Tetromino | null;
  nextPiece: Tetromino;
  score: number;
  highScore: number;
  level: number;
  lines: number;
  gameState: GameState;
  isMuted: boolean;
}

const SHAPE_COLORS: Record<TetrominoType, number> = {
  I: 1,
  O: 2,
  T: 3,
  S: 4,
  Z: 5,
  J: 6,
  L: 7,
};

const BLOCK_STYLES: Record<number, { outer: string; inner: string }> = {
  0: { outer: 'bg-[#151922] border border-slate-800/30 shadow-[inset_0px_1px_2px_rgba(0,0,0,0.4)]', inner: '' },
  1: {
    outer: 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_2px_6px_rgba(34,211,238,0.4),_inset_1px_1px_0px_rgba(255,255,255,0.4)] border border-cyan-300',
    inner: 'bg-gradient-to-tr from-white/10 to-transparent'
  },
  2: {
    outer: 'bg-gradient-to-br from-amber-300 to-yellow-500 shadow-[0_2px_6px_rgba(245,158,11,0.4),_inset_1px_1px_0px_rgba(255,255,255,0.4)] border border-amber-200',
    inner: 'bg-gradient-to-tr from-white/10 to-transparent'
  },
  3: {
    outer: 'bg-gradient-to-br from-fuchsia-400 to-purple-600 shadow-[0_2px_6px_rgba(168,85,247,0.4),_inset_1px_1px_0px_rgba(255,255,255,0.4)] border border-fuchsia-300',
    inner: 'bg-gradient-to-tr from-white/10 to-transparent'
  },
  4: {
    outer: 'bg-gradient-to-br from-emerald-400 to-green-650 shadow-[0_2px_6px_rgba(16,185,129,0.4),_inset_1px_1px_0px_rgba(255,255,255,0.4)] border border-emerald-300',
    inner: 'bg-gradient-to-tr from-white/10 to-transparent'
  },
  5: {
    outer: 'bg-gradient-to-br from-rose-400 to-red-600 shadow-[0_2px_6px_rgba(244,63,94,0.4),_inset_1px_1px_0px_rgba(255,255,255,0.4)] border border-rose-300',
    inner: 'bg-gradient-to-tr from-white/10 to-transparent'
  },
  6: {
    outer: 'bg-gradient-to-br from-blue-400 to-indigo-650 shadow-[0_2px_6px_rgba(59,130,246,0.4),_inset_1px_1px_0px_rgba(255,255,255,0.4)] border border-blue-300',
    inner: 'bg-gradient-to-tr from-white/10 to-transparent'
  },
  7: {
    outer: 'bg-gradient-to-br from-orange-400 to-amber-600 shadow-[0_2px_6px_rgba(249,115,22,0.4),_inset_1px_1px_0px_rgba(255,255,255,0.4)] border border-orange-300',
    inner: 'bg-gradient-to-tr from-white/10 to-transparent'
  },
};

export const BrickGameScreen: React.FC<BrickGameScreenProps> = ({
  board,
  currentPiece,
  nextPiece,
  score,
  highScore,
  level,
  lines,
  gameState,
  isMuted,
}) => {
  // Create a combined rendering grid: board + active piece
  const renderGrid = (): number[][] => {
    // Clone standard board
    const grid = board.map((row) => [...row]);

    // Override active piece points
    if (currentPiece && gameState === 'PLAYING') {
      const { matrix, position } = currentPiece;
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c] !== 0) {
            const boardY = position.y + r;
            const boardX = position.x + c;
            if (boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
              grid[boardY][boardX] = SHAPE_COLORS[currentPiece.type];
            }
          }
        }
      }
    }
    return grid;
  };

  const gridToRender = renderGrid();

  // Next piece preview grid (typically 4x4)
  const renderNextPreview = (): number[][] => {
    const previewGrid = Array(4)
      .fill(null)
      .map(() => Array(4).fill(0));

    const { matrix } = nextPiece;
    const matrixRows = matrix.length;
    const matrixCols = matrix[0]?.length || 0;

    // Center the matrix inside our 4x4 preview
    const offsetY = Math.floor((4 - matrixRows) / 2);
    const offsetX = Math.floor((4 - matrixCols) / 2);

    for (let r = 0; r < matrixRows; r++) {
      for (let c = 0; c < matrixCols; c++) {
        if (matrix[r][c] !== 0) {
          const py = r + offsetY;
          const px = c + offsetX;
          if (py >= 0 && py < 4 && px >= 0 && px < 4) {
            previewGrid[py][px] = SHAPE_COLORS[nextPiece.type];
          }
        }
      }
    }
    return previewGrid;
  };

  const nextPreview = renderNextPreview();

  return (
    <div
      id="modern-screen-bezel"
      className="relative p-2 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-700/50 shadow-[0_20px_40px_rgba(0,0,0,0.6),_inset_0_1px_2px_rgba(255,255,255,0.1)] w-full max-w-[340px] sm:max-w-[380px] flex flex-col justify-start overflow-hidden backdrop-blur-xl"
    >
      {/* Dynamic diagonal shiny overlay */}
      <div className="absolute top-0 left-0 w-full h-[150%] bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-y-1/2 pointer-events-none skew-y-12" />

      {/* Primary Display Screen Frame */}
      <div
        id="arcade-digital-display"
        className="bg-[#0b0f19] text-slate-100 font-sans select-none p-3.5 rounded-xl flex gap-3 sm:gap-4 relative overflow-hidden border border-slate-800 shadow-[inset_0_4px_16px_rgba(0,0,0,0.9)]"
      >
        {/* Subtly glowing grid backdrop lines */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)] pointer-events-none" />

        {/* --- MAIN GAME MATRIX STYLING (10 x 20) --- */}
        <div
          id="tetris-active-grid-area"
          className="relative border border-slate-700/40 p-1 bg-[#090d16] rounded-lg shadow-inner flex-shrink-0"
        >
          {gameState === 'GAME_OVER' && (
            <div className="absolute inset-x-0 top-1/3 z-10 flex flex-col items-center justify-center bg-slate-950/95 border-y border-red-500/20 py-4 scale-100 px-2 rounded backdrop-blur shadow-2xl">
              <span className="font-black text-lg tracking-wider text-red-500 uppercase animate-pulse">OYUN BİTTİ</span>
              <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest leading-none">Skorun: {score}</span>
              <span className="text-[10px] animate-bounce bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded mt-3 leading-tight font-extrabold uppercase text-center">
                Yeniden Dene
              </span>
            </div>
          )}

          {gameState === 'PAUSED' && (
            <div className="absolute inset-x-0 top-1/3 z-10 flex flex-col items-center justify-center bg-slate-950/95 border-y border-dashed border-amber-500/20 py-4 rounded backdrop-blur shadow-lg">
              <span className="font-extrabold text-sm tracking-widest text-amber-500 uppercase">DURAKLATILDI</span>
              <span className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Devam etmek için dokunun</span>
            </div>
          )}

          {/* Actual Blocks Grid with Modern Rounded 3D Block Blast Style */}
          <div className="grid grid-cols-10 gap-[1.5px] bg-[#07090f]/70">
            {gridToRender.map((row, rIndex) =>
              row.map((cell, cIndex) => {
                const style = BLOCK_STYLES[cell] || BLOCK_STYLES[0];
                return (
                  <div
                    key={`cell-${rIndex}-${cIndex}`}
                    className={`
                      w-[16px] h-[16px] sm:w-[21px] sm:h-[21px] transition-all duration-100 relative rounded-[3px]
                      ${style.outer}
                    `}
                  >
                    {/* Interior glisten overlay for block blast feel */}
                    {cell !== 0 && (
                      <div className={`absolute inset-[1px] rounded-[2px] ${style.inner}`} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* --- STATUS PANEL / SIDEBAR (Right Hand Side) --- */}
        <div id="digit-status-panel" className="flex-1 flex flex-col justify-between font-bold leading-none select-none">
          {/* Top segment: High Score / Score */}
          <div className="space-y-3 pt-1">
            {/* Score box */}
            <div className="bg-[#121824] px-2.5 py-2.5 rounded-lg border border-slate-800 shadow-sm">
              <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">SKOR</div>
              <div className="text-sm sm:text-[17px] tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400 font-mono font-black text-right pr-0.5">
                {score.toLocaleString()}
              </div>
            </div>

            {/* High score box */}
            <div className="bg-[#121824]/50 px-2.5 py-2.5 rounded-lg border border-slate-800 shadow-sm">
              <div className="flex items-center gap-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                <Trophy size={9} className="text-yellow-400 fill-yellow-400/20" />
                <span>EN YÜKSEK</span>
              </div>
              <div className="text-xs sm:text-[14px] tracking-wider text-slate-300 font-mono font-black text-right pr-0.5">
                {highScore.toLocaleString()}
              </div>
            </div>

            {/* Next Piece box */}
            <div className="bg-[#121824] p-2.5 rounded-lg border border-slate-800 shadow-sm flex flex-col items-center">
              <div className="text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-widest mb-1.5 self-start">SIRADAKİ</div>
              <div className="bg-[#0b0f19] p-1.5 border border-slate-800/80 rounded-md">
                <div className="grid grid-cols-4 gap-[1px]">
                  {nextPreview.map((row, rIdx) =>
                    row.map((cell, cIdx) => {
                      const style = BLOCK_STYLES[cell] || BLOCK_STYLES[0];
                      return (
                        <div
                          key={`next-${rIdx}-${cIdx}`}
                          className={`
                            w-3.5 h-3.5 relative rounded-[2px]
                            ${style.outer}
                          `}
                        >
                          {cell !== 0 && (
                            <div className={`absolute inset-[0.5px] rounded-[1px] ${style.inner}`} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom segment: stats */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
            {/* Level */}
            <div className="flex justify-between items-center bg-[#121824]/40 px-2 py-1.5 rounded-md border border-slate-800/40">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">SEVİYE</span>
              <span className="text-sm font-black text-cyan-400 font-mono">{level}</span>
            </div>

            {/* Lines */}
            <div className="flex justify-between items-center bg-[#121824]/40 px-2 py-1.5 rounded-md border border-slate-800/40">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">SATIR</span>
              <span className="text-sm font-black text-emerald-400 font-mono">{lines}</span>
            </div>

            {/* Audio Indicator */}
            <div className="flex gap-2 items-center justify-end px-1 pt-1 opacity-70">
              {isMuted ? (
                <VolumeX size={13} className="text-slate-500" />
              ) : (
                <Volume2 size={13} className="text-cyan-400" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
