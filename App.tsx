
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, GridSize, Difficulty, StatsEntry } from './types';
import { isAdjacent, getMovableIndices, isSolved, getManhattanDistance } from './services/puzzleLogic';
import PuzzleBoard from './components/PuzzleBoard';
import Controls from './components/Controls';
import Menu from './components/Menu';

const DEFAULT_IMAGE = 'https://picsum.photos/800/800?random=1';

const App: React.FC = () => {
  const [board, setBoard] = useState<number[]>([]);
  const [gridSize, setGridSize] = useState<GridSize>({ rows: 4, cols: 4 });
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [minMoves, setMinMoves] = useState(0);
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [spacing, setSpacing] = useState(2);
  const [spacingColor, setSpacingColor] = useState('transparent');
  const [showNumbers, setShowNumbers] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [highlightedTile, setHighlightedTile] = useState<number | null>(null);
  const [clueTile, setClueTile] = useState<number | null>(null);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [history, setHistory] = useState<number[][]>([]);
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  
  const timerRef = useRef<number | null>(null);
  const abortSolvingRef = useRef(false);

  const initBoard = useCallback((size: GridSize) => {
    const newBoard = Array.from({ length: size.rows * size.cols }, (_, i) => i);
    setBoard(newBoard);
    setMoves(0);
    setSeconds(0);
    setMinMoves(0);
    setHistory([]);
    setIsGameFinished(false);
    setClueTile(null);
    setHighlightedTile(null);
    setIsSolving(false);
    abortSolvingRef.current = false;
  }, []);

  useEffect(() => {
    initBoard(gridSize);
    const storedHistory = localStorage.getItem('puzzle_image_history');
    if (storedHistory) setImageHistory(JSON.parse(storedHistory));
  }, [gridSize, initBoard]);

  useEffect(() => {
    if (moves > 0 && !isGameFinished && !isSolving) {
      timerRef.current = window.setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [moves, isGameFinished, isSolving]);

  const moveTile = (index: number, silent = false) => {
    if (isSolving && !silent) return;
    const emptyIdx = board.indexOf(board.length - 1);
    if (isAdjacent(index, emptyIdx, gridSize)) {
      const currentBoardState = [...board];
      const newBoard = [...board];
      [newBoard[index], newBoard[emptyIdx]] = [newBoard[emptyIdx], newBoard[index]];
      
      setHistory(prev => [...prev, currentBoardState]);
      setBoard(newBoard);
      setMoves(prev => prev + 1);
      setClueTile(null);

      if (!silent && isSolved(newBoard)) {
        setIsGameFinished(true);
        saveToStats(moves + 1, seconds, gridSize);
      }
    }
  };

  const saveToStats = (moves: number, time: number, size: GridSize) => {
    const stats: StatsEntry[] = JSON.parse(localStorage.getItem('puzzle_stats') || '[]');
    const newEntry: StatsEntry = {
      date: new Date().toLocaleDateString(),
      moves,
      time,
      gridSize: `${size.rows}x${size.cols}`
    };
    const updatedStats = [newEntry, ...stats].slice(0, 10);
    localStorage.setItem('puzzle_stats', JSON.stringify(updatedStats));
  };

  const shuffle = () => {
    if (isSolving) return;
    let currentBoard = Array.from({ length: gridSize.rows * gridSize.cols }, (_, i) => i);
    let shuffleCount = difficulty === 'Easy' ? 15 : difficulty === 'Medium' ? 40 : 100;
    let lastEmpty = -1;
    let tempHistory: number[][] = [];

    for (let i = 0; i < shuffleCount; i++) {
      const emptyIdx = currentBoard.indexOf(currentBoard.length - 1);
      const movables = getMovableIndices(emptyIdx, gridSize).filter(idx => idx !== lastEmpty);
      const move = movables[Math.floor(Math.random() * movables.length)];
      
      tempHistory.push([...currentBoard]);
      [currentBoard[emptyIdx], currentBoard[move]] = [currentBoard[move], currentBoard[emptyIdx]];
      lastEmpty = emptyIdx;
    }

    setBoard(currentBoard);
    setMoves(0);
    setSeconds(0);
    // Set min moves benchmark based on this specific shuffle
    setMinMoves(getManhattanDistance(currentBoard, gridSize));
    setHistory(tempHistory);
    setIsGameFinished(false);
    setClueTile(null);
    setHighlightedTile(null);
  };

  const undo = () => {
    if (history.length === 0 || isSolving) return;
    const prevBoard = history[history.length - 1];
    setBoard(prevBoard);
    setHistory(prev => prev.slice(0, -1));
    setMoves(prev => Math.max(0, prev - 1));
    setClueTile(null);
  };

  const clue = () => {
    if (isSolving || isGameFinished) return;
    const emptyIdx = board.indexOf(board.length - 1);
    const movables = getMovableIndices(emptyIdx, gridSize);
    
    let lastMovedValue = -1;
    if (history.length > 0) {
      const prevBoard = history[history.length - 1];
      lastMovedValue = prevBoard[emptyIdx];
    }

    const validClues = movables.filter(idx => board[idx] !== lastMovedValue);
    
    const targetIdx = validClues.length > 0 
      ? validClues[Math.floor(Math.random() * validClues.length)]
      : movables[Math.floor(Math.random() * movables.length)];
      
    setClueTile(targetIdx);
  };

  const solve = async () => {
    if (isSolving) {
      abortSolvingRef.current = true;
      return;
    }

    if (isSolved(board)) {
      setIsGameFinished(true);
      return;
    }
    
    setIsSolving(true);
    abortSolvingRef.current = false;
    setClueTile(null);
    
    const path = [...history].reverse();
    let currentSimulatedBoard = [...board];
    
    for (const stepBoard of path) {
      if (abortSolvingRef.current) {
        break;
      }

      const targetEmptyIdx = stepBoard.indexOf(stepBoard.length - 1);
      
      setHighlightedTile(targetEmptyIdx);
      await new Promise(r => setTimeout(r, 1000));
      
      if (abortSolvingRef.current) {
        setHighlightedTile(null);
        break;
      }

      setBoard(stepBoard);
      currentSimulatedBoard = stepBoard;
      setMoves(prev => prev + 1);
      setHighlightedTile(null);

      if (isSolved(stepBoard)) break;
    }
    
    setIsSolving(false);
    const wasAborted = abortSolvingRef.current;
    abortSolvingRef.current = false;

    if (!wasAborted && isSolved(currentSimulatedBoard)) {
      setIsGameFinished(true);
    }
  };

  const saveGame = () => {
    const data = { board, moves, seconds, minMoves, imageUrl, gridSize, history, difficulty, spacing, spacingColor, showNumbers };
    localStorage.setItem('puzzle_saved_game', JSON.stringify(data));
    alert('Game Saved!');
  };

  const loadSavedGame = () => {
    const data = localStorage.getItem('puzzle_saved_game');
    if (data) {
      const parsed = JSON.parse(data);
      setBoard(parsed.board);
      setMoves(parsed.moves);
      setSeconds(parsed.seconds);
      setMinMoves(parsed.minMoves || getManhattanDistance(parsed.board, parsed.gridSize));
      setImageUrl(parsed.imageUrl);
      setGridSize(parsed.gridSize);
      setHistory(parsed.history);
      setDifficulty(parsed.difficulty);
      setSpacing(parsed.spacing);
      setSpacingColor(parsed.spacingColor || 'transparent');
      setShowNumbers(parsed.showNumbers || false);
      setIsMenuOpen(false);
      setIsGameFinished(false);
      setIsSolving(false);
      abortSolvingRef.current = false;
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setImageUrl(url);
        const newHistory = [url, ...imageHistory.filter(i => i !== url)].slice(0, 5);
        setImageHistory(newHistory);
        localStorage.setItem('puzzle_image_history', JSON.stringify(newHistory));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-slate-950 text-white overflow-hidden">
      <button 
        onClick={() => setIsMenuOpen(true)}
        className="absolute top-6 left-6 p-2 rounded-full bg-slate-800/50 hover:bg-slate-700 transition-colors z-40"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </button>

      <div className="mb-6 flex space-x-8 text-sm font-medium tracking-wider uppercase text-slate-400">
        <div className="flex flex-col items-center min-w-[80px]">
          <span className="text-2xl text-white font-bold">{moves}</span>
          <span>Moves</span>
        </div>
        <div className="flex flex-col items-center min-w-[80px]">
          <span className="text-2xl text-white font-bold">
            {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
          </span>
          <span>Time</span>
        </div>
        <div className="flex flex-col items-center min-w-[80px]">
          <span className="text-2xl text-blue-400 font-bold">{minMoves}</span>
          <span className="whitespace-nowrap">Min Moves</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center w-full max-w-2xl">
        <PuzzleBoard 
          board={board} 
          gridSize={gridSize} 
          imageUrl={imageUrl} 
          onTileClick={moveTile} 
          spacing={spacing}
          spacingColor={spacingColor}
          showNumbers={showNumbers}
          highlightedTile={highlightedTile}
          clueTile={clueTile}
        />
      </div>

      <div className="mt-8 w-full max-w-lg">
        <Controls 
          onShuffle={shuffle}
          onSolve={solve}
          onClue={clue}
          onUndo={undo}
          isSolving={isSolving}
        />
      </div>

      {isGameFinished && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-3xl font-bold mb-2">Solved!</h2>
            <p className="text-slate-400 mb-6">You finished in {moves} moves and {seconds} seconds.</p>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  initBoard(gridSize);
                  shuffle();
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors shadow-lg shadow-blue-500/20"
              >
                Play Again
              </button>
              <button 
                onClick={() => setIsGameFinished(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Menu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        gridSize={gridSize}
        setGridSize={setGridSize}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        spacing={spacing}
        setSpacing={setSpacing}
        spacingColor={spacingColor}
        setSpacingColor={setSpacingColor}
        showNumbers={showNumbers}
        setShowNumbers={setShowNumbers}
        onImageUpload={handleImageUpload}
        imageHistory={imageHistory}
        onSelectHistoryImage={setImageUrl}
        onSave={saveGame}
        onLoad={loadSavedGame}
      />
    </div>
  );
};

export default App;
