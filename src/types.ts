/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface Point {
  x: number;
  y: number;
}

export type Board = number[][]; // 10x20 grid. 0 = empty, 1 = filled block.

export interface Tetromino {
  type: TetrominoType;
  matrix: number[][];
  position: Point;
}
