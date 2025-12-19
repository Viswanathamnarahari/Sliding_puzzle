import React, { useState, useEffect } from 'react';
import { GridSize } from '../types';

interface PuzzleBoardProps {
  board: number[];
  gridSize: GridSize;
  imageUrl: string;
  onTileClick: (index: number) => void;
  spacing: number;
  movingTileIdx: number | null;
  clueTileIdx: number | null;
  showNumbers: boolean;
}

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({ 
  board, gridSize, imageUrl, onTileClick, spacing, movingTileIdx, clueTileIdx, showNumbers 
}) => {
  const [boardSize, setBoardSize] = useState(300);

  useEffect(() => {
    const resize = () => {
      const size = Math.min(window.innerWidth - 40, window.innerHeight * 0.5, 450);
      setBoardSize(size);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const tileW = (boardSize - (gridSize.cols - 1) * spacing) / gridSize.cols;
  const tileH = (boardSize - (gridSize.rows - 1) * spacing) / gridSize.rows;

  return (
    <div 
      className="relative bg-slate-900/50 rounded-2xl shadow-inner border border-white/5 overflow-hidden"
      style={{ width: boardSize, height: boardSize }}
    >
      {board.map((val, idx) => {
        if (val === board.length - 1) return null;

        const row = Math.floor(idx / gridSize.cols);
        const col = idx % gridSize.cols;
        const origRow = Math.floor(val / gridSize.cols);
        const origCol = val % gridSize.cols;

        const left = col * (tileW + spacing);
        const top = row * (tileH + spacing);

        const isMoving = movingTileIdx === idx;
        const isClue = clueTileIdx === idx;

        return (
          <div
            key={val}
            onClick={() => onTileClick(idx)}
            className="absolute puzzle-tile-transition cursor-pointer rounded-lg overflow-hidden border border-white/10 shadow-md group"
            style={{
              width: tileW,
              height: tileH,
              transform: `translate(${left}px, ${top}px)`,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: `${gridSize.cols * 100}% ${gridSize.rows * 100}%`,
              backgroundPosition: `${(origCol / (gridSize.cols - 1)) * 100}% ${(origRow / (gridSize.rows - 1)) * 100}%`,
            }}
          >
            {/* Number Overlay */}
            {showNumbers && (
              <div className="absolute top-1 left-1 bg-black/40 backdrop-blur-sm rounded-md px-1.5 py-0.5 min-w-[1.2rem] text-center">
                <span className="text-[10px] font-black text-white">{val + 1}</span>
              </div>
            )}

            {/* Clue indicator: yellow dot */}
            {isClue && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-yellow-400/10">
                <div className="w-5 h-5 rounded-full bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,1)] border-2 border-white clue-dot" />
              </div>
            )}
            
            {/* Moving indicator: yellow circle */}
            {isMoving && (
              <div className="absolute inset-0 flex items-center justify-center bg-yellow-400/20 border-4 border-yellow-400">
                <div className="w-12 h-12 rounded-full border-2 border-yellow-400 animate-ping" />
              </div>
            )}

            {/* Hover/Active overlay */}
            <div className="absolute inset-0 bg-white/0 group-active:bg-white/20 transition-colors" />
          </div>
        );
      })}
    </div>
  );
};

export default PuzzleBoard;