
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GridSize, Difficulty, StatsEntry } from './types';
import { isAdjacent, getMovableIndices, isSolved, getManhattanDistance } from './services/puzzleLogic';
import PuzzleBoard from './components/PuzzleBoard';
import Controls from './components/Controls';
import Menu from './components/Menu';

const DEFAULT_IMAGE = 'https://picsum.photos/800/800?random=42';

const App: React.FC = () => {
  const [board, setBoard] = useState<number[]>([]);
  const [gridSize, setGridSize] = useState<GridSize>({ rows: 4, cols: 4 });
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [spacing, setSpacing] = useState(2);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [movingTileIdx, setMovingTileIdx] = useState<number | null>(null);
  const [clueTileIdx, setClueTileIdx] = useState<number | null>(null);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  
  const historyRef = useRef<number[][]>([]);
  const timerRef = useRef<number | null>(null);
  const abortSolvingRef = useRef(false);

  const initBoard = useCallback((size: GridSize) => {
    const newBoard = Array.from({ length: size.rows * size.cols }, (_, i) => i);
    setBoard(newBoard);
    setMoves(0);
    setSeconds(0);
    setDistance(0);
    historyRef.current = [];
    setIsGameFinished(false);
    setClueTileIdx(null);
    setMovingTileIdx(null);
    setIsSolving(false);
    abortSolvingRef.current = false;
  }, []);

  useEffect(() => {
    const storedHistory = localStorage.getItem('puzzle_image_history');
    if (storedHistory) setImageHistory(JSON.parse(storedHistory));
    
    const lastState = localStorage.getItem('puzzle_current_state');
    if (lastState) {
        try {
            const parsed = JSON.parse(lastState);
            setBoard(parsed.board);
            setMoves(parsed.moves);
            setSeconds(parsed.seconds);
            setImageUrl(parsed.imageUrl);
            setGridSize(parsed.gridSize);
            historyRef.current = parsed.history || [];
            setDifficulty(parsed.difficulty || 'Medium');
            setSpacing(parsed.spacing || 2);
            setDistance(getManhattanDistance(parsed.board, parsed.gridSize));
        } catch(e) {
            initBoard(gridSize);
        }
    } else {
        initBoard(gridSize);
    }
  }, []);

  useEffect(() => {
    if (board.length > 0) {
      const stateToSave = { board, moves, seconds, imageUrl, gridSize, history: historyRef.current, difficulty, spacing };
      localStorage.setItem('puzzle_current_state', JSON.stringify(stateToSave));
    }
    setDistance(getManhattanDistance(board, gridSize));
  }, [board, moves, seconds, imageUrl, gridSize, difficulty, spacing]);

  useEffect(() => {
    if (moves > 0 && !isGameFinished && !isSolving) {
      if (!timerRef.current) {
        timerRef.current = window.setInterval(() => setSeconds(s => s + 1), 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [moves, isGameFinished, isSolving]);

  const handleMove = (index: number, silent = false) => {
    if (isSolving && !silent) return;
    const emptyIdx = board.indexOf(board.length - 1);
    if (isAdjacent(index, emptyIdx, gridSize)) {
      historyRef.current.push([...board]);
      const newBoard = [...board];
      [newBoard[index], newBoard[emptyIdx]] = [newBoard[emptyIdx], newBoard[index]];
      setBoard(newBoard);
      setMoves(m => m + 1);
      setClueTileIdx(null);

      if (!silent && isSolved(newBoard)) {
        setIsGameFinished(true);
        saveStats(moves + 1, seconds, gridSize);
      }
    }
  };

  const saveStats = (m: number, t: number, s: GridSize) => {
    const stats: StatsEntry[] = JSON.parse(localStorage.getItem('puzzle_stats') || '[]');
    const entry: StatsEntry = { date: new Date().toLocaleDateString(), moves: m, time: t, gridSize: `${s.rows}x${s.cols}` };
    const updated = [entry, ...stats].slice(0, 10);
    localStorage.setItem('puzzle_stats', JSON.stringify(updated));
  };

  const shuffle = () => {
    if (isSolving) return;
    let curr = Array.from({ length: gridSize.rows * gridSize.cols }, (_, i) => i);
    const shuffleCount = difficulty === 'Easy' ? 20 : difficulty === 'Medium' ? 50 : 150;
    let lastEmpty = -1;
    historyRef.current = [];

    for (let i = 0; i < shuffleCount; i++) {
      const emptyIdx = curr.indexOf(curr.length - 1);
      const movables = getMovableIndices(emptyIdx, gridSize).filter(idx => idx !== lastEmpty);
      const move = movables[Math.floor(Math.random() * movables.length)];
      historyRef.current.push([...curr]);
      [curr[emptyIdx], curr[move]] = [curr[move], curr[emptyIdx]];
      lastEmpty = emptyIdx;
    }
    setBoard(curr);
    setMoves(0);
    setSeconds(0);
    setIsGameFinished(false);
    setClueTileIdx(null);
  };

  const undo = () => {
    if (isSolving || historyRef.current.length === 0) return;
    const last = historyRef.current.pop();
    if (last) {
      setBoard(last);
      setMoves(m => Math.max(0, m - 1));
      setClueTileIdx(null);
    }
  };

  const getClue = () => {
    if (isSolving || isGameFinished) return;
    const emptyIdx = board.indexOf(board.length - 1);
    const movables = getMovableIndices(emptyIdx, gridSize);
    // Simple clue: show a valid move
    const target = movables[Math.floor(Math.random() * movables.length)];
    setClueTileIdx(target);
  };

  const solve = async () => {
    if (isSolving) {
      abortSolvingRef.current = true;
      return;
    }
    if (isSolved(board)) return;
    setIsSolving(true);
    abortSolvingRef.current = false;
    
    // Reverse the history to solve
    const steps = [...historyRef.current].reverse();
    for (const step of steps) {
      if (abortSolvingRef.current) break;
      const targetEmpty = step.indexOf(board.length - 1);
      const movingTileValue = board[targetEmpty];
      const movingTileCurrentIdx = board.indexOf(movingTileValue);
      setMovingTileIdx(movingTileCurrentIdx);
      await new Promise(r => setTimeout(r, 1000));
      if (abortSolvingRef.current) break;
      setBoard(step);
      setMoves(m => m + 1);
      setMovingTileIdx(null);
      if (isSolved(step)) break;
    }
    setIsSolving(false);
    if (isSolved(board)) setIsGameFinished(true);
  };

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setImageUrl(url);
        const updated = [url, ...imageHistory.filter(x => x !== url)].slice(0, 10);
        setImageHistory(updated);
        localStorage.setItem('puzzle_image_history', JSON.stringify(updated));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-full w-full py-2 px-4 bg-slate-950 overflow-hidden">
      <button 
        onClick={() => setIsMenuOpen(true)}
        className="absolute top-4 left-4 p-3 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors z-40 shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </button>

      <div className="text-center mt-2">
        <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tighter mb-1">PUZZLE MASTER</h1>
        <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest justify-center">
            <div className="flex flex-col items-center">
                <span className="text-white text-base">{moves}</span>
                <span>Moves</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-white text-base">{Math.floor(seconds/60)}:{(seconds%60).toString().padStart(2,'0')}</span>
                <span>Time</span>
            </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center w-full min-h-0 py-2">
        <PuzzleBoard 
          board={board} 
          gridSize={gridSize} 
          imageUrl={imageUrl} 
          onTileClick={handleMove}
          spacing={spacing}
          movingTileIdx={movingTileIdx}
          clueTileIdx={clueTileIdx}
        />
      </div>

      <div className="w-full max-w-sm mb-2">
        <Controls 
          onShuffle={shuffle}
          onSolve={solve}
          onClue={getClue}
          onUndo={undo}
          isSolving={isSolving}
        />
      </div>

      {isGameFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl text-center max-w-xs mx-auto">
                <h2 className="text-2xl font-bold mb-2">Victory!</h2>
                <p className="text-slate-400 mb-6">Do you want to play again?</p>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => { initBoard(gridSize); shuffle(); }}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold shadow-lg transition-all"
                    >
                        PLAY AGAIN
                    </button>
                    <button 
                        onClick={() => setIsGameFinished(false)}
                        className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold text-slate-300 transition-all"
                    >
                        CLOSE
                    </button>
                </div>
            </div>
        </div>
      )}

      <Menu 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        gridSize={gridSize}
        setGridSize={(s) => { setGridSize(s); initBoard(s); }}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        spacing={spacing}
        setSpacing={setSpacing}
        imageHistory={imageHistory}
        onSelectHistoryImage={setImageUrl}
        onPickImage={pickImage}
      />
    </div>
  );
};

export default App;
