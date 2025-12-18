
import { GridSize } from '../types';

export const isAdjacent = (idx1: number, idx2: number, size: GridSize): boolean => {
  const r1 = Math.floor(idx1 / size.cols);
  const c1 = idx1 % size.cols;
  const r2 = Math.floor(idx2 / size.cols);
  const c2 = idx2 % size.cols;
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
};

export const getMovableIndices = (emptyIdx: number, size: GridSize): number[] => {
  const movables: number[] = [];
  const r = Math.floor(emptyIdx / size.cols);
  const c = emptyIdx % size.cols;

  if (r > 0) movables.push(emptyIdx - size.cols);
  if (r < size.rows - 1) movables.push(emptyIdx + size.cols);
  if (c > 0) movables.push(emptyIdx - 1);
  if (c < size.cols - 1) movables.push(emptyIdx + 1);

  return movables;
};

export const isSolved = (board: number[]): boolean => {
  for (let i = 0; i < board.length - 1; i++) {
    if (board[i] !== i) return false;
  }
  return true;
};

// Simple Manhattan distance heuristic for A* (limited search for performance)
export const getManhattanDistance = (board: number[], size: GridSize): number => {
  let distance = 0;
  for (let i = 0; i < board.length; i++) {
    const val = board[i];
    if (val === board.length - 1) continue; // Skip empty tile
    const currentR = Math.floor(i / size.cols);
    const currentC = i % size.cols;
    const targetR = Math.floor(val / size.cols);
    const targetC = val % size.cols;
    distance += Math.abs(currentR - targetR) + Math.abs(currentC - targetC);
  }
  return distance;
};

// Since full A* for 15-puzzle (4x4) is computationally expensive in JS for a single frame,
// we often use IDA* or simply store the shuffle path. 
// For this app, to provide a "Solve" button that moves one by one, 
// we will implement a simple Greedy Best-First Search for small depths 
// or rely on a recorded shuffle history to reverse.
