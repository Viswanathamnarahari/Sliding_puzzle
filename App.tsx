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
  const [requiredMoves, setRequiredMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [spacing, setSpacing] = useState(2);
  const [showNumbers, setShowNumbers] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [movingTileIdx, setMovingTileIdx] = useState<number | null>(null);
  const [clueTileIdx, setClueTileIdx] = useState<number | null>(null);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  const [bestMoves, setBestMoves] = useState<number | null>(null);
  const [hasShuffled, setHasShuffled] = useState(false);
  
  const historyRef = useRef<number[][]>([]);
  const timerRef = useRef<number | null>(null);
  const abortSolvingRef = useRef(false);

  const updateBestMoves = useCallback(() => {
    try {
      const rawStats = localStorage.getItem('puzzle_stats');
      if (!rawStats) {
        setBestMoves(null);
        return;
      }
      const stats: StatsEntry[] = JSON.parse(rawStats);
      const gridKey = `${gridSize.rows}x${gridSize.cols}`;
      const relevant = stats.filter(s => s.gridSize === gridKey);
      if (relevant.length > 0) {
        const min = Math.min(...relevant.map(r => r.moves));
        setBestMoves(min);
      } else {
        setBestMoves(null);
      }
    } catch (e) {
      setBestMoves(null);
    }
  }, [gridSize]);

  const initBoard = useCallback((size: GridSize) => {
    const newBoard = Array.from({ length: size.rows * size.cols }, (_, i) => i);
    setBoard(newBoard);
    setMoves(0);
    setRequiredMoves(0);
    setSeconds(0);
    setDistance(0);
    setHasShuffled(false);
    historyRef.current = [];
    setIsGameFinished(false);
    setClueTileIdx(null);
    setMovingTileIdx(null);
    setIsSolving(false);
    abortSolvingRef.current = false;
    updateBestMoves();
  }, [updateBestMoves]);

  const loadSavedState = useCallback(() => {
    const lastState = localStorage.getItem('puzzle_current_state');
    if (lastState) {
        try {
            const parsed = JSON.parse(lastState);
            setBoard(parsed.board);
            setMoves(parsed.moves);
            setRequiredMoves(parsed.requiredMoves || 0);
            setSeconds(parsed.seconds);
            setImageUrl(parsed.imageUrl);
            setGridSize(parsed.gridSize);
            historyRef.current = parsed.history || [];
            setDifficulty(parsed.difficulty || 'Medium');
            setSpacing(parsed.spacing || 2);
            setShowNumbers(parsed.showNumbers ?? true);
            setHasShuffled(parsed.hasShuffled ?? false);
            setDistance(getManhattanDistance(parsed.board, parsed.gridSize));
            setIsGameFinished(isSolved(parsed.board) && parsed.hasShuffled && parsed.moves > 0);
        } catch(e) {
            initBoard(gridSize);
        }
    } else {
        initBoard(gridSize);
    }
    updateBestMoves();
  }, [gridSize, initBoard, updateBestMoves]);

  useEffect(() => {
    const storedHistory = localStorage.getItem('puzzle_image_history');
    if (storedHistory) {
      try {
        setImageHistory(JSON.parse(storedHistory));
      } catch (e) {
        setImageHistory([]);
      }
    }
    loadSavedState();
  }, []);

  useEffect(() => {
    if (board.length > 0) {
      const stateToSave = { 
        board, moves, requiredMoves, seconds, imageUrl, gridSize, 
        history: historyRef.current, difficulty, spacing, 
        showNumbers, hasShuffled 
      };
      try {
        localStorage.setItem('puzzle_current_state', JSON.stringify(stateToSave));
      } catch (e) {
        localStorage.removeItem('puzzle_image_history');
      }
    }
    setDistance(getManhattanDistance(board, gridSize));
  }, [board, moves, requiredMoves, seconds, imageUrl, gridSize, difficulty, spacing, showNumbers, hasShuffled]);

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

  const saveStats = useCallback((m: number, t: number, s: GridSize) => {
    const stats: StatsEntry[] = JSON.parse(localStorage.getItem('puzzle_stats') || '[]');
    const entry: StatsEntry = { 
      date: new Date().toLocaleDateString(), 
      moves: m, 
      time: t, 
      gridSize: `${s.rows}x${s.cols}` 
    };
    const updated = [entry, ...stats].sort((a,b) => a.moves - b.moves).slice(0, 50);
    localStorage.setItem('puzzle_stats', JSON.stringify(updated));
    updateBestMoves();
  }, [updateBestMoves]);

  const handleMove = (index: number, silent = false) => {
    if (isSolving && !silent) return;
    const emptyIdx = board.indexOf(board.length - 1);
    
    if (isAdjacent(index, emptyIdx, gridSize)) {
      const currentBoard = [...board];
      const nextBoard = [...board];
      [nextBoard[index], nextBoard[emptyIdx]] = [nextBoard[emptyIdx], nextBoard[index]];
      
      // Determine if this move is backtracking along the known path
      const previousState = historyRef.current[historyRef.current.length - 1];
      const isBacktracking = previousState && previousState.every((val, i) => val === nextBoard[i]);

      if (isBacktracking) {
        historyRef.current.pop();
      } else {
        historyRef.current.push(currentBoard);
      }

      setBoard(nextBoard);
      
      if (!silent) {
        const nextMoves = moves + 1;
        setMoves(nextMoves);
        setClueTileIdx(null);
        if (isSolved(nextBoard) && hasShuffled && nextMoves > 0) {
          setIsGameFinished(true);
          saveStats(nextMoves, seconds, gridSize);
        }
      }
    }
  };

  const shuffle = () => {
    if (isSolving) return;
    setIsGameFinished(false);
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
    setRequiredMoves(shuffleCount);
    setSeconds(0);
    setClueTileIdx(null);
    setHasShuffled(true);
  };

  const undo = () => {
    if (isSolving || historyRef.current.length === 0) return;
    const last = historyRef.current.pop();
    if (last) {
      setBoard(last);
      setMoves(m => m + 1); // Undo is still a move action
      setClueTileIdx(null);
      setIsGameFinished(false);
    }
  };

  const getClue = () => {
    if (isSolving || isGameFinished || !hasShuffled || historyRef.current.length === 0) return;
    
    // Suggest the move that leads back to the previous state in our history
    const previousState = historyRef.current[historyRef.current.length - 1];
    const emptyIdxInPrevious = previousState.indexOf(board.length - 1);
    
    // The tile currently at the 'old' empty index is the one that needs to move
    setClueTileIdx(emptyIdxInPrevious);
  };

  const solve = async () => {
    if (isSolving) {
      abortSolvingRef.current = true;
      return;
    }
    if (isSolved(board) || !hasShuffled) return;
    
    setIsSolving(true);
    abortSolvingRef.current = false;
    
    while (historyRef.current.length > 0 && !abortSolvingRef.current) {
      const previousState = historyRef.current[historyRef.current.length - 1];
      const emptyIdxInPrevious = previousState.indexOf(board.length - 1);
      
      setMovingTileIdx(emptyIdxInPrevious);
      await new Promise(r => setTimeout(r, 1000));
      
      if (abortSolvingRef.current) break;
      
      const nextBoard = [...previousState];
      setBoard(nextBoard);
      historyRef.current.pop();
      setMoves(m => m + 1);
      setMovingTileIdx(null);
      
      if (isSolved(nextBoard)) {
          setIsGameFinished(true);
          saveStats(moves + 1, seconds, gridSize);
          break;
      }
    }
    setIsSolving(false);
  };

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 700;
            let width = img.width;
            let height = img.height;
            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              try {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                setImageUrl(dataUrl);
                const updated = [dataUrl, ...imageHistory.filter(x => x !== dataUrl)].slice(0, 3);
                setImageHistory(updated);
                localStorage.setItem('puzzle_image_history', JSON.stringify(updated));
              } catch (err) {
                localStorage.removeItem('puzzle_image_history');
              }
            }
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col items-center justify-between h-full w-full py-2 px-4 bg-slate-950 overflow-hidden relative">
      <button 
        onClick={() => setIsMenuOpen(true)}
        className="absolute top-4 left-4 p-3 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors z-40 shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </button>

      <div className="text-center mt-2 flex flex-col items-center">
        <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tighter mb-1 uppercase">Puzzle Master</h1>
        <div className="flex gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest justify-center">
            <div className="flex flex-col items-center px-1">
                <span className="text-white text-base leading-none mb-1">{moves}</span>
                <span>Moves</span>
            </div>
            <div className="flex flex-col items-center px-1">
                <span className="text-emerald-400 text-base leading-none mb-1 font-black">{requiredMoves > 0 ? requiredMoves : '--'}</span>
                <span>Target</span>
            </div>
            <div className="flex flex-col items-center px-1">
                <span className="text-blue-400 text-base leading-none mb-1 font-black">{bestMoves !== null ? bestMoves : '--'}</span>
                <span>Best</span>
            </div>
            <div className="flex flex-col items-center px-1">
                <span className="text-white text-base leading-none mb-1">{distance}</span>
                <span>Distance</span>
            </div>
            <div className="flex flex-col items-center px-1">
                <span className="text-white text-base leading-none mb-1">{Math.floor(seconds/60)}:{(seconds%60).toString().padStart(2,'0')}</span>
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
          showNumbers={showNumbers}
        />
      </div>

      <div className="w-full max-sm mb-4">
        <Controls 
          onShuffle={shuffle}
          onSolve={solve}
          onClue={getClue}
          onUndo={undo}
          isSolving={isSolving}
        />
      </div>

      {isGameFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl text-center w-full max-w-xs animate-menu">
                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                </div>
                <h2 className="text-2xl font-black mb-2 text-white uppercase tracking-tighter">Solved!</h2>
                <p className="text-slate-400 text-sm mb-2">Excellent work! You finished in {moves} moves.</p>
                <p className="text-blue-400 text-xs font-bold mb-6 uppercase tracking-widest">Do you want to play again?</p>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => { shuffle(); }}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-sm tracking-widest transition-all shadow-lg active:scale-95"
                    >
                        PLAY AGAIN
                    </button>
                    <button 
                        onClick={() => setIsGameFinished(false)}
                        className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold text-sm text-slate-300 tracking-widest transition-all active:scale-95"
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
        showNumbers={showNumbers}
        setShowNumbers={setShowNumbers}
        imageHistory={imageHistory}
        onSelectHistoryImage={setImageUrl}
        onPickImage={pickImage}
        onLoadSaved={loadSavedState}
      />
    </div>
  );
};

export default App;