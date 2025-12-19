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
  const [boardWidth, setBoardWidth] = useState(300);
  const [boardHeight, setBoardHeight] = useState(300);

  useEffect(() => {
    const resize = () => {
      // Use standard margins for mobile/desktop layouts
      const maxW = window.innerWidth - 32;
      const maxH = window.innerHeight - 360; // Extra room for controls and stats
      
      const targetWidthLimit = Math.min(maxW, 420);
      
      // Calculate individual tile size to ensure they stay square
      const tileS = (targetWidthLimit - (gridSize.cols - 1) * spacing) / gridSize.cols;
      let calculatedHeight = tileS * gridSize.rows + (gridSize.rows - 1) * spacing;
      let calculatedWidth = targetWidthLimit;

      // If calculated height exceeds screen constraints, re-scale everything based on height
      if (calculatedHeight > maxH) {
          const scaledTileS = (maxH - (gridSize.rows - 1) * spacing) / gridSize.rows;
          calculatedWidth = scaledTileS * gridSize.cols + (gridSize.cols - 1) * spacing;
          calculatedHeight = maxH;
      }
      
      setBoardWidth(calculatedWidth);
      setBoardHeight(calculatedHeight);
    };
    
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [gridSize, spacing]);

  const tileW = (boardWidth - (gridSize.cols - 1) * spacing) / gridSize.cols;
  const tileH = (boardHeight - (gridSize.rows - 1) * spacing) / gridSize.rows;

  const borderRadius = tileShape === 'rounded' ? '12px' : '0px';

  return (
    <div 
      className="relative select-none"
      style={{ width: boardWidth, height: boardHeight }}
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
            className="absolute puzzle-tile-transition cursor-pointer overflow-hidden border border-white/10 shadow-lg group active:brightness-125 touch-manipulation"
            style={{
              width: tileW,
              height: tileH,
              transform: `translate3d(${left}px, ${top}px, 0)`,
              borderRadius: borderRadius,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: `${gridSize.cols * 100}% ${gridSize.rows * 100}%`,
              // Precise background positioning for CSS percentage logic
              backgroundPosition: `${(origCol / (gridSize.cols - 1)) * 100}% ${(origRow / (gridSize.rows - 1)) * 100}%`,
            }}
          >
            {showNumbers && (
              <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-md rounded-md px-1.5 py-0.5 min-w-[1.2rem] text-center border border-white/10 pointer-events-none">
                <span className="text-[10px] font-black text-white/90">{val + 1}</span>
              </div>
            )}

            {isClue && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-amber-400/20">
                <div className="w-5 h-5 rounded-full bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,1)] border-2 border-white clue-dot" />
              </div>
            )}
            
            {isMoving && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-400/30 border-2 border-blue-400 pointer-events-none">
                <div className="w-full h-full border-2 border-blue-400 animate-ping opacity-50" />
              </div>
            )}

            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 active:bg-white/10 transition-colors pointer-events-none" />
          </div>
        );
      })}
    </div>
  );
};

export default PuzzleBoard;