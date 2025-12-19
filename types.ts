
export type GridSize = {
  rows: number;
  cols: number;
};

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type TileShape = 'rounded' | 'square';

export interface GameState {
  board: number[];
  moves: number;
  seconds: number;
  imageUrl: string;
  gridSize: GridSize;
  history: number[][];
  difficulty: Difficulty;
  spacing: number;
  showNumbers: boolean;
  tileShape: TileShape;
}

export interface StatsEntry {
  date: string;
  moves: number;
  time: number;
  gridSize: string;
}