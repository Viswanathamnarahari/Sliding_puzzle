
export type GridSize = {
  rows: number;
  cols: number;
};

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface GameState {
  board: number[];
  moves: number;
  seconds: number;
  imageUrl: string;
  gridSize: GridSize;
  history: number[][];
  difficulty: Difficulty;
  spacing: number;
}

export interface StatsEntry {
  date: string;
  moves: number;
  time: number;
  gridSize: string;
}

export interface PuzzleContextType {
  state: GameState;
  isSolved: boolean;
  isSolving: boolean;
  highlightedTile: number | null;
  clueTile: number | null;
  moveTile: (index: number) => void;
  shuffle: () => void;
  solve: () => void;
  clue: () => void;
  undo: () => void;
  updateGrid: (rows: number, cols: number) => void;
  updateImageUrl: (url: string) => void;
  updateDifficulty: (d: Difficulty) => void;
  updateSpacing: (s: number) => void;
  resetGame: () => void;
  loadSavedGame: () => void;
  saveGame: () => void;
}
