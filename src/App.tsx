/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Board, Tetromino, TetrominoType, Point } from './types';
import { BrickGameScreen } from './components/BrickGameScreen';
import { Keypad } from './components/Keypad';
import { soundEffects, getMuted, setMuted } from './utils/audio';
import { 
  Gamepad2, 
  Settings, 
  Volume2, 
  VolumeX, 
  Play, 
  RotateCcw, 
  LogOut, 
  Pause, 
  Info, 
  Sparkles,
  Award
} from 'lucide-react';

const SHAPES: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

const PIECE_TYPES: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

const SHAPE_COLORS: Record<TetrominoType, number> = {
  I: 1,
  O: 2,
  T: 3,
  S: 4,
  Z: 5,
  J: 6,
  L: 7,
};

const createEmptyBoard = (): Board =>
  Array(20)
    .fill(null)
    .map(() => Array(10).fill(0));

export default function App() {
  // Game states
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<Tetromino | null>(null);
  const [nextPiece, setNextPiece] = useState<Tetromino>(() => {
    const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
    return {
      type,
      matrix: SHAPES[type],
      position: { x: Math.floor((10 - SHAPES[type][0].length) / 2), y: type === 'I' ? -1 : 0 },
    };
  });
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('retro_tetris_highscore');
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });
  const [level, setLevel] = useState<number>(1);
  const [lines, setLines] = useState<number>(0);
  const [startingLevel, setStartingLevel] = useState<number>(1);
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [isMuted, setIsMuted] = useState<boolean>(getMuted());
  const [showSettingsView, setShowSettingsView] = useState<boolean>(false);

  // Refs for tracking mutable states inside timer triggers
  const boardRef = useRef<Board>(board);
  const currentPieceRef = useRef<Tetromino | null>(currentPiece);
  const gameStateRef = useRef<GameState>(gameState);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    currentPieceRef.current = currentPiece;
  }, [currentPiece]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Sync mute state initially
  useEffect(() => {
    const storedMute = localStorage.getItem('retro_tetris_mute') === 'true';
    setIsMuted(storedMute);
    setMuted(storedMute);
  }, []);

  // Helper sound function
  const playSound = (effect: keyof typeof soundEffects) => {
    if (!isMuted) {
      soundEffects[effect]();
    }
  };

  // Helper score updater
  const updateScore = useCallback(
    (cleared: number) => {
      let points = 0;
      switch (cleared) {
        case 1:
          points = 100 * level;
          break;
        case 2:
          points = 300 * level;
          break;
        case 3:
          points = 600 * level;
          break;
        case 4:
          points = 1000 * level; // Modern Tetris jackpot!
          break;
        default:
          break;
      }

      if (points > 0) {
        setScore((prev) => {
          const newScore = prev + points;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('retro_tetris_highscore', newScore.toString());
          }
          return newScore;
        });
        playSound('clear');
      }
    },
    [level, highScore, isMuted]
  );

  // Helper Collision Checker
  const checkCollision = useCallback((piece: Tetromino, currentBoard: Board, offset: Point): boolean => {
    const { matrix, position } = piece;
    const targetX = position.x + offset.x;
    const targetY = position.y + offset.y;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const boardX = targetX + c;
          const boardY = targetY + r;

          // Horizontal bounds check
          if (boardX < 0 || boardX >= 10) {
            return true;
          }

          // Bottom bound check
          if (boardY >= 20) {
            return true;
          }

          // Existing blocks check
          if (boardY >= 0) {
            if (currentBoard[boardY][boardX] !== 0) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }, []);

  // Soft/Hard spawn helper
  const spawnNext = useCallback(
    (currentBoard: Board) => {
      const activePiece = { ...nextPiece };

      // Generate next random piece
      const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
      const nextSpawn: Tetromino = {
        type,
        matrix: SHAPES[type],
        position: { x: Math.floor((10 - SHAPES[type][0].length) / 2), y: type === 'I' ? -1 : 0 },
      };

      setNextPiece(nextSpawn);

      // Check collision on spawn
      if (checkCollision(activePiece, currentBoard, { x: 0, y: 0 })) {
        setGameState('GAME_OVER');
        playSound('gameOver');
      } else {
        setCurrentPiece(activePiece);
      }
    },
    [nextPiece, checkCollision]
  );

  // Game Logic Action: Rotate Piece
  const handleRotate = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING' || !currentPieceRef.current) return;

    const piece = currentPieceRef.current;
    const n = piece.matrix.length;
    // Transpose and reverse rows to rotate clockwise
    const rotatedMatrix = Array(n)
      .fill(null)
      .map(() => Array(n).fill(0));

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        rotatedMatrix[c][n - 1 - r] = piece.matrix[r][c];
      }
    }

    const rotatedPiece: Tetromino = {
      ...piece,
      matrix: rotatedMatrix,
    };

    // Standard try
    if (!checkCollision(rotatedPiece, boardRef.current, { x: 0, y: 0 })) {
      setCurrentPiece(rotatedPiece);
      playSound('rotate');
      return;
    }

    // Wall kicks left/right to prevent rotation jams near walls
    if (!checkCollision(rotatedPiece, boardRef.current, { x: -1, y: 0 })) {
      setCurrentPiece({
        ...rotatedPiece,
        position: { x: rotatedPiece.position.x - 1, y: rotatedPiece.position.y },
      });
      playSound('rotate');
      return;
    }

    if (!checkCollision(rotatedPiece, boardRef.current, { x: 1, y: 0 })) {
      setCurrentPiece({
        ...rotatedPiece,
        position: { x: rotatedPiece.position.x + 1, y: rotatedPiece.position.y },
      });
      playSound('rotate');
      return;
    }
  }, [checkCollision, isMuted]);

  // Lock Piece Function
  const lockPiece = useCallback(
    (piece: Tetromino, currentBoard: Board) => {
      const nextBoard = currentBoard.map((row) => [...row]);
      const { matrix, position } = piece;

      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c] !== 0) {
            const boardY = position.y + r;
            const boardX = position.x + c;
            if (boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
              nextBoard[boardY][boardX] = SHAPE_COLORS[piece.type];
            }
          }
        }
      }

      // Check lines
      let clearedRowsCount = 0;
      const filteredBoard = nextBoard.filter((row) => {
        const isFull = row.every((cell) => cell !== 0);
        if (isFull) clearedRowsCount++;
        return !isFull;
      });

      // Prepend cleared rows with empty rows
      while (filteredBoard.length < 20) {
        filteredBoard.unshift(Array(10).fill(0));
      }

      setBoard(filteredBoard);

      if (clearedRowsCount > 0) {
        setLines((prev) => {
          const totalLines = prev + clearedRowsCount;
          const calculatedLevel = Math.floor(totalLines / 10) + startingLevel;
          if (calculatedLevel > level) {
            setLevel(calculatedLevel);
            playSound('levelUp');
          }
          return totalLines;
        });
        updateScore(clearedRowsCount);
      } else {
        playSound('land');
      }

      spawnNext(filteredBoard);
    },
    [spawnNext, updateScore, level, startingLevel, isMuted]
  );

  // Game Logic Action: Move Down (Gravity Tick & Soft Drop)
  const handleMoveDown = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING' || !currentPieceRef.current) return;

    const piece = currentPieceRef.current;
    const currentBoard = boardRef.current;

    if (!checkCollision(piece, currentBoard, { x: 0, y: 1 })) {
      setCurrentPiece({
        ...piece,
        position: { x: piece.position.x, y: piece.position.y + 1 },
      });
    } else {
      lockPiece(piece, currentBoard);
    }
  }, [checkCollision, lockPiece]);

  // Game Logic Action: Move Left
  const handleMoveLeft = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING' || !currentPieceRef.current) return;

    const piece = currentPieceRef.current;
    if (!checkCollision(piece, boardRef.current, { x: -1, y: 0 })) {
      setCurrentPiece({
        ...piece,
        position: { x: piece.position.x - 1, y: piece.position.y },
      });
      playSound('move');
    }
  }, [checkCollision, isMuted]);

  // Game Logic Action: Move Right
  const handleMoveRight = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING' || !currentPieceRef.current) return;

    const piece = currentPieceRef.current;
    if (!checkCollision(piece, boardRef.current, { x: 1, y: 0 })) {
      setCurrentPiece({
        ...piece,
        position: { x: piece.position.x + 1, y: piece.position.y },
      });
      playSound('move');
    }
  }, [checkCollision, isMuted]);

  // Game Logic Action: Hard Drop (Instantly drops piece to bottom)
  const handleDrop = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING' || !currentPieceRef.current) return;

    let piece = currentPieceRef.current;
    const currentBoard = boardRef.current;
    let offset = 0;

    // Shift down until collision occurs
    while (!checkCollision(piece, currentBoard, { x: 0, y: offset + 1 })) {
      offset++;
    }

    if (offset > 0) {
      const droppedPiece = {
        ...piece,
        position: { x: piece.position.x, y: piece.position.y + offset },
      };
      // Lock it directly at computed bottom
      lockPiece(droppedPiece, currentBoard);
    }
  }, [checkCollision, lockPiece]);

  // Game Logic Action: Reset / New Game
  const handleReset = useCallback(() => {
    setBoard(createEmptyBoard());
    setScore(0);
    setLevel(startingLevel);
    setLines(0);

    // Re-spawn random piece
    const type1 = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
    const activeSpawn = {
      type: type1,
      matrix: SHAPES[type1],
      position: { x: Math.floor((10 - SHAPES[type1][0].length) / 2), y: type1 === 'I' ? -1 : 0 },
    };

    const type2 = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
    const nextSpawn = {
      type: type2,
      matrix: SHAPES[type2],
      position: { x: Math.floor((10 - SHAPES[type2][0].length) / 2), y: type2 === 'I' ? -1 : 0 },
    };

    setCurrentPiece(activeSpawn);
    setNextPiece(nextSpawn);
    setGameState('PLAYING');
    playSound('levelUp');
  }, [startingLevel, isMuted]);

  // State trigger: play from menu
  const handleStartGame = () => {
    handleReset();
  };

  // Game Logic Action: Toggle Pause State
  const handlePauseToggle = useCallback(() => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
      playSound('move');
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
      playSound('move');
    }
  }, [gameState, isMuted]);

  // Game Logic Action: Sound Toggle
  const handleSoundToggle = useCallback(() => {
    setIsMuted((prev) => {
      const activeState = !prev;
      setMuted(activeState);
      localStorage.setItem('retro_tetris_mute', activeState.toString());
      return activeState;
    });
  }, []);

  // Return to menu
  const handleExitToMenu = () => {
    setGameState('IDLE');
    playSound('move');
  };

  // Set up standard gravity timer loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    // Speed increases exponentially as level increases
    const delay = Math.max(65, 800 - (level - 1) * 75);
    const interval = setInterval(() => {
      handleMoveDown();
    }, delay);

    return () => clearInterval(interval);
  }, [gameState, level, handleMoveDown]);

  // Keyboard desktop listener binds
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid screen scrolling on direction keys when browser has focus
      const blockedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          handleMoveLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          handleMoveRight();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          handleMoveDown();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          handleRotate();
          break;
        case ' ': // Spacebar
          handleDrop();
          break;
        case 'Enter':
          if (gameState === 'PLAYING') {
            handlePauseToggle();
          } else if (gameState === 'IDLE' || gameState === 'GAME_OVER') {
            handleStartGame();
          }
          break;
        case 'Escape':
          if (gameState === 'PLAYING') {
            handleExitToMenu();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, handleMoveLeft, handleMoveRight, handleMoveDown, handleRotate, handleDrop, handlePauseToggle, handleReset]);

  return (
    <main
      id="retro-app-container"
      className="min-h-screen bg-[#07090e] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-[#0a0d14] to-[#040508] py-6 px-4 flex flex-col items-center justify-center text-slate-100 font-sans overflow-x-hidden"
    >
      {/* Dynamic Background Glowing Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Main Container Wrapper */}
      <div className="relative w-full max-w-sm flex flex-col items-center">
        
        {/* --- STATE 1: GİRİŞ SAYFASI SİSTEMİ (IDLE) --- */}
        {gameState === 'IDLE' && (
          <div
            id="main-entry-screen"
            className="w-full flex flex-col gap-6 bg-[#0f1422]/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8),_inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl relative overflow-hidden transition-all duration-300"
          >
            {/* Gloss reflection overlay */}
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            {/* Glowing top line */}
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            {/* Title Block Blast Style header */}
            <header className="flex flex-col items-center text-center mt-3 relative z-10">
              <div className="inline-flex items-center justify-center bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full text-cyan-400 text-[10px] font-black tracking-widest uppercase mb-3 animate-pulse">
                🏆 MODERN ARCADE TETRIS
              </div>
              
              {/* 3D Gradient Text Title */}
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-amber-300 to-fuchsia-500 uppercase drop-shadow">
                TETRIS BLAST
              </h1>
            </header>

            {/* High Score Panel Banner */}
            <div className="bg-[#151d30]/65 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between px-4 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Award size={18} className="fill-amber-400/10" />
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 font-extrabold tracking-widest uppercase">EN YÜKSEK SKOR</div>
                  <div className="text-sm font-black text-slate-200 mt-0.5 font-mono">{highScore.toLocaleString()}</div>
                </div>
              </div>
              <span className="text-[10px] text-cyan-400/80 bg-cyan-400/10 border border-cyan-400/20 rounded px-1.5 py-0.5 font-bold">
                PRO PLAYER
              </span>
            </div>

            {/* Navigation Selector for Settings / Play */}
            <div className="flex flex-col gap-4 relative z-10">
              
              {/* Expandable/Collapse Configurable Settings Option Card */}
              <div className="bg-[#121826]/40 border border-slate-800/50 p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-2.5">
                  <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                    <Settings size={13} className="text-cyan-400" />
                    <span>OYUN AYARLARI</span>
                  </span>
                  <button
                    onClick={handleSoundToggle}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-white transition-colors uppercase bg-slate-900/60 leading-none py-1.5 px-2.5 rounded border border-slate-800 cursor-pointer"
                  >
                    {isMuted ? (
                      <>
                        <VolumeX size={12} className="text-red-400" />
                        <span>SES: KAPALI</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={12} className="text-emerald-400" />
                        <span>SES: AÇIK</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Level / Starting Speed Selection */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline text-xs pb-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Başlangıç Seviyesi (Hız)</span>
                    <span className="text-cyan-400 font-black font-mono text-sm bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded">
                      Level {startingLevel}
                    </span>
                  </div>
                  
                  {/* Grid of level button pills */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {Array.from({ length: 10 }).map((_, idx) => {
                      const value = idx + 1;
                      const isActive = startingLevel === value;
                      return (
                        <button
                          key={`starting-level-${value}`}
                          onClick={() => {
                            setStartingLevel(value);
                            playSound('move');
                          }}
                          className={`
                            py-1.5 px-1 text-xs font-black rounded-lg transition-all border cursor-pointer
                            ${
                              isActive
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-cyan-300 shadow-[0_2px_8px_rgba(6,182,212,0.3)] scale-[1.05]'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800/80 hover:text-slate-200'
                            }
                          `}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-normal mt-1">
                    Seviye yükseldikçe bloklar daha hızlı düşer.
                  </p>
                </div>
              </div>

              {/* MASSIVE PULSING OYUNA BAŞLA PLAY BUTTON */}
              <button
                id="main-play-btn"
                onClick={handleStartGame}
                className="w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:via-blue-400 hover:to-indigo-500 text-white font-extrabold text-[15px] sm:text-base tracking-widest py-4 rounded-2xl shadow-[0_8px_24px_rgba(6,182,212,0.45),_inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all hover:-translate-y-0.5 active:translate-y-0 hover:shadow-[0_12px_28px_rgba(6,182,212,0.55)] cursor-pointer hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 uppercase"
              >
                <Play size={16} className="fill-white" />
                <span>OYUNA BAŞLA</span>
              </button>
            </div>

            {/* Footer with game details */}
            <footer className="flex flex-col items-center mt-2 pt-2 border-t border-slate-800/40 opacity-50 relative z-10 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                VER. 2.5.0 • PORTABLE MOBILE ARCHITECTURE
              </span>
            </footer>
          </div>
        )}

        {/* --- STATE 2: PLAYING / PAUSED / GAME OVER ACTIVE STAGES --- */}
        {gameState !== 'IDLE' && (
          <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
            
            {/* Action Top bar for gameplay stats/exits */}
            <div id="gameplay-top-actionbar" className="w-full flex justify-between items-center px-2 py-1 bg-slate-900/45 border border-slate-800/55 rounded-xl backdrop-blur-md">
              <button
                onClick={handleExitToMenu}
                className="flex items-center gap-1.5 text-xs font-extrabold text-slate-400 hover:text-red-400 transition-colors uppercase bg-slate-950/60 border border-slate-800/80 py-1.5 px-3 rounded-lg cursor-pointer"
                title="Ana Menüye Dön"
              >
                <LogOut size={13} className="text-red-400" />
                <span>ÇIK</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleSoundToggle}
                  className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Sesi Aç/Kapat"
                >
                  {isMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} className="text-cyan-400" />}
                </button>

                <button
                  onClick={handlePauseToggle}
                  className="flex items-center gap-1 text-xs font-extrabold text-slate-400 hover:text-amber-400 transition-colors uppercase bg-slate-950/60 border border-slate-800/80 py-1.5 px-3 rounded-lg cursor-pointer animate-none"
                  title="Pause / Resume"
                >
                  {gameState === 'PAUSED' ? (
                    <>
                      <Play size={12} className="fill-emerald-400 text-emerald-400 animate-pulse" />
                      <span className="text-emerald-400">DEVAM</span>
                    </>
                  ) : (
                    <>
                      <Pause size={12} className="fill-amber-400 text-amber-400" />
                      <span>DURAKLAT</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Premium Glistening Gameplay Board Frame */}
            <BrickGameScreen
              board={board}
              currentPiece={currentPiece}
              nextPiece={nextPiece}
              score={score}
              highScore={highScore}
              level={level}
              lines={lines}
              gameState={gameState}
              isMuted={isMuted}
            />

            {/* ONLY Left, Right, Up, and Down keypad controls on the console */}
            <Keypad
              onMoveLeft={handleMoveLeft}
              onMoveRight={handleMoveRight}
              onMoveDown={handleDrop}
              onRotate={handleRotate}
            />

            {/* Quick Helper Button if Game Over occurred to quickly play again or exit */}
            {gameState === 'GAME_OVER' && (
              <div className="w-full grid grid-cols-2 gap-3 mt-1.5 z-20">
                <button
                  onClick={handleReset}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold text-xs tracking-wider py-3.5 px-3 rounded-xl shadow-md uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
                >
                  <RotateCcw size={14} />
                  <span>Yeniden</span>
                </button>
                <button
                  onClick={handleExitToMenu}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-xs tracking-wider py-3.5 px-3 rounded-xl border border-slate-700 uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
                >
                  <LogOut size={14} />
                  <span>MENÜYE DÖN</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
