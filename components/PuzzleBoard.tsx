
import React, { useState, useEffect } from 'react';
import { GridSize } from '../types';

interface PuzzleBoardProps {
  board: number[];
  gridSize: GridSize;
  imageUrl: string;
  onTileClick: (index: number) => void;
  spacing: number;
  spacingColor: string;
  showNumbers: boolean;
  highlightedTile: number | null;
  clueTile: number | null;
}

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({ 
  board, 
  gridSize, 
  imageUrl, 
  onTileClick, 
  spacing,
  spacingColor,
  showNumbers,
  highlightedTile,
  clueTile
}) => {
  const [containerWidth, setContainerWidth] = useState(360);

  useEffect(() => {
    const updateSize = () => {
      // Fit to screen width with padding, but cap at 500
      const width = Math.min(window.innerWidth - 48, 500);
      setContainerWidth(width);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const tileWidth = (containerWidth - (gridSize.cols - 1) * spacing) / gridSize.cols;
  const tileHeight = tileWidth; 

  const boardStyle = {
    width: containerWidth + 16,
    height: (tileHeight * gridSize.rows) + (spacing * (gridSize.rows - 1)) + 16,
    backgroundColor: spacingColor === 'auto' ? 'rgba(255,255,255,0.05)' : spacingColor
  };

  return (
    <div 
      className="relative p-2 rounded-xl shadow-inner border border-white/5 overflow-hidden transition-all duration-500 ease-out"
      style={boardStyle}
    >
      {board.map((tileValue, currentIndex) => {
        if (tileValue === board.length - 1) return null;

        const row = Math.floor(currentIndex / gridSize.cols);
        const col = currentIndex % gridSize.cols;

        const originalRow = Math.floor(tileValue / gridSize.cols);
        const originalCol = tileValue % gridSize.cols;

        const posX = col * (tileWidth + spacing);
        const posY = row * (tileHeight + spacing);

        const bgPosX = (originalCol / (gridSize.cols - 1)) * 100;
        const bgPosY = (originalRow / (gridSize.rows - 1)) * 100;

        const isHighlighted = highlightedTile === currentIndex;
        const isClue = clueTile === currentIndex;

        return (
          <div
            key={tileValue}
            onClick={() => onTileClick(currentIndex)}
            className="absolute puzzle-tile-transition cursor-pointer rounded-lg overflow-hidden group shadow-lg"
            style={{
              width: tileWidth,
              height: tileHeight,
              left: posX + 8,
              top: posY + 8,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: `${gridSize.cols * 100}% ${gridSize.rows * 100}%`,
              backgroundPosition: `${bgPosX}% ${bgPosY}%`,
            }}
          >
            <div className="absolute inset-0 border border-white/10 group-hover:border-white/30 transition-colors" />
            
            {showNumbers && (
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/40 backdrop-blur-sm rounded text-[10px] font-bold text-white border border-white/10 select-none">
                {tileValue + 1}
              </div>
            )}

            {isHighlighted && (
              <div className="absolute inset-0 flex items-center justify-center bg-yellow-400/20">
                <div className="w-12 h-12 rounded-full border-4 border-yellow-400 animate-ping opacity-75" />
                <div className="w-8 h-8 rounded-full bg-yellow-400 absolute shadow-2xl" />
              </div>
            )}

            {isClue && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)] clue-dot" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PuzzleBoard;
