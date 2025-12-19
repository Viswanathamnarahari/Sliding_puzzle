import React, { useState, useEffect } from 'react';
import { GridSize, TileShape } from '../types';

interface PuzzleBoardProps {
  board: number[];
  gridSize: GridSize;
  imageUrl: string;
  onTileClick: (index: number) => void;
  spacing: number;
  movingTileIdx: number | null;
  clueTileIdx: number | null;
  showNumbers: boolean;
  tileShape: TileShape;
}

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({ 
  board, gridSize, imageUrl, onTileClick, spacing, movingTileIdx, clueTileIdx, showNumbers, tileShape 
}) => {
  const [boardSize, setBoardSize] = useState(300);

  useEffect(() => {
    const resize = () => {
      // Fit within tray well boundaries
      const size = Math.min(window.innerWidth - 80, window.innerHeight * 0.45, 380);
      setBoardSize(size);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const tileW = (boardSize - (gridSize.cols - 1) * spacing) / gridSize.cols;
  const tileH = (boardSize - (gridSize.rows - 1) * spacing) / gridSize.rows;

  // Determine border radius based on tileShape
  const borderRadius = tileShape === 'rounded' ? '0.75rem' : '0px';

  return (
    <div 
      className="relative overflow-hidden"
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
            className="absolute puzzle-tile-transition cursor-pointer overflow-hidden border border-white/10 shadow-lg group"
            style={{
              width: tileW,
              height: tileH,
              transform: `translate(${left}px, ${top}px)`,
              borderRadius: borderRadius,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: `${gridSize.cols * 100}% ${gridSize.rows * 100}%`,
              backgroundPosition: `${(origCol / (gridSize.cols - 1)) * 100}% ${(origRow / (gridSize.rows - 1)) * 100}%`,
            }}
          >
            {/* Number Overlay */}
            {showNumbers && (
              <div className="absolute top-1.5 left-1.5 bg-black/50 backdrop-blur-md rounded-lg px-2 py-0.5 min-w-[1.4rem] text-center border border-white/10">
                <span className="text-[10px] font-black text-white/90">{val + 1}</span>
              </div>
            )}

            {/* Clue indicator */}
            {isClue && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-amber-400/20">
                <div className="w-4 h-4 rounded-full bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,1)] border-2 border-white clue-dot" />
              </div>
            )}
            
            {/* Moving indicator */}
            {isMoving && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-400/30 border-2 border-blue-400">
                <div className="w-full h-full border-2 border-blue-400 animate-ping opacity-50" />
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
          </div>
        );
      })}
    </div>
  );
};

export default PuzzleBoard;