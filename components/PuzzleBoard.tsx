import React, { useState, useEffect } from 'react';
import { GridSize, TileShape, NumberSize } from '../types';

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
  numberSize: NumberSize;
}

const PuzzleBoard: React.FC<PuzzleBoardProps> = React.memo(({ 
  board, gridSize, imageUrl, onTileClick, spacing, movingTileIdx, clueTileIdx, showNumbers, tileShape, numberSize 
}) => {
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });

  useEffect(() => {
    const handleResize = () => {
      const maxW = window.innerWidth - 32;
      const maxH = window.innerHeight - 360;
      const targetWidthLimit = Math.min(maxW, 420);
      const tileS = Math.floor((targetWidthLimit - (gridSize.cols - 1) * spacing) / gridSize.cols);
      let calculatedHeight = tileS * gridSize.rows + (gridSize.rows - 1) * spacing;
      let calculatedWidth = tileS * gridSize.cols + (gridSize.cols - 1) * spacing;

      if (calculatedHeight > maxH) {
          const scaledTileS = Math.floor((maxH - (gridSize.rows - 1) * spacing) / gridSize.rows);
          calculatedWidth = scaledTileS * gridSize.cols + (gridSize.cols - 1) * spacing;
          calculatedHeight = scaledTileS * gridSize.rows + (gridSize.rows - 1) * spacing;
      }
      setDimensions({ width: calculatedWidth, height: calculatedHeight });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gridSize.cols, gridSize.rows, spacing]);

  const { width: boardWidth, height: boardHeight } = dimensions;
  const tileW = (boardWidth - (gridSize.cols - 1) * spacing) / gridSize.cols;
  const tileH = (boardHeight - (gridSize.rows - 1) * spacing) / gridSize.rows;
  const borderRadius = tileShape === 'rounded' ? '12px' : '0px';

  return (
    <div className={`p-1.5 border-2 border-white/20 bg-[#0a0a0c]/50 ${tileShape === 'rounded' ? 'rounded-[1.5rem]' : 'rounded-xl'}`}>
      <div 
        className="relative select-none"
        style={{ 
          width: Math.round(boardWidth), 
          height: Math.round(boardHeight),
          perspective: '1200px',
          transformStyle: 'preserve-3d',
          touchAction: 'none'
        }}
      >
      {board.map((val, idx) => {
        const row = Math.floor(idx / gridSize.cols);
        const col = idx % gridSize.cols;
        const left = Math.round(col * (tileW + spacing));
        const top = Math.round(row * (tileH + spacing));

        if (val === board.length - 1) {
          return (
            <div
              key="empty"
              className="absolute flex items-center justify-center pointer-events-none overflow-hidden"
              style={{
                width: Math.round(tileW),
                height: Math.round(tileH),
                transform: `translate3d(${left}px, ${top}px, 0)`,
                borderRadius: borderRadius,
                background: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Bright Large X */}
                <div className="absolute w-[85%] h-[3px] bg-white/40 rotate-45 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.3)]" />
                <div className="absolute w-[85%] h-[3px] bg-white/40 -rotate-45 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.3)]" />
              </div>
            </div>
          );
        }

        const origRow = Math.floor(val / gridSize.cols);
        const origCol = val % gridSize.cols;
        
        const isMoving = movingTileIdx === idx;
        const isClue = clueTileIdx === idx;
        const bgX = gridSize.cols > 1 ? (origCol / (gridSize.cols - 1)) * 100 : 0;
        const bgY = gridSize.rows > 1 ? (origRow / (gridSize.rows - 1)) * 100 : 0;

        return (
          <div
            key={val}
            onClick={() => onTileClick(idx)}
            className="absolute puzzle-tile-transition cursor-pointer overflow-hidden border border-white/20 shadow-lg group active:brightness-125 touch-manipulation"
            style={{
              width: Math.round(tileW),
              height: Math.round(tileH),
              transform: `translate3d(${left}px, ${top}px, 0) translateZ(0)`,
              borderRadius: borderRadius,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: `${gridSize.cols * 100}% ${gridSize.rows * 100}%`,
              backgroundPosition: `${bgX}% ${bgY}%`,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              willChange: 'transform'
            }}
          >
            {showNumbers && (
              <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-md rounded-md px-1.5 py-0.5 min-w-[1.2rem] text-center border border-white/10 pointer-events-none">
                <span className={`${numberSize === 'Big' ? 'text-[14px]' : 'text-[10px]'} font-black text-white/95`}>{val + 1}</span>
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
    </div>
  );
});

export default PuzzleBoard;