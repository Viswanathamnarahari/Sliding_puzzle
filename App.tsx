import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GridSize, Difficulty, StatsEntry, TileShape } from './types';
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
  const [tileShape, setTileShape] = useState<TileShape>('square');
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
            setTileShape(parsed.tileShape || 'square');
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
        showNumbers, tileShape, hasShuffled 
      };
      try {
        localStorage.setItem('puzzle_current_state', JSON.stringify(stateToSave));
      } catch (e) {
        localStorage.removeItem('puzzle_image_history');
      }
    }
    setDistance(getManhattanDistance(board, gridSize));
  }, [board, moves, requiredMoves, seconds, imageUrl, gridSize, difficulty, spacing, showNumbers, tileShape, hasShuffled]);

  const isTimerActive = moves > 0 && !isGameFinished && !isSolving;
  useEffect(() => {
    if (isTimerActive) {
      if (!timerRef.current) {
        timerRef.current = window.setInterval(() => setSeconds(s => s + 1), 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {};
  }, [isTimerActive]);

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
      
      const previousState = historyRef.current[historyRef.current.length - 1];
      const isCorrectBacktrack = previousState && previousState.every((val, i) => val === nextBoard[i]);

      if (isCorrectBacktrack) {
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
      setMoves(m => m + 1);
      setClueTileIdx(null);
      setIsGameFinished(false);
    }
  };

  const getClue = () => {
    if (isSolving || isGameFinished || !hasShuffled || historyRef.current.length === 0) return;
    const previousState = historyRef.current[historyRef.current.length - 1];
    const emptyIdxInPrevious = previousState.indexOf(board.length - 1);
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
    
    let moveCounter = moves;
    while (historyRef.current.length > 0 && !abortSolvingRef.current) {
      const previousState = historyRef.current[historyRef.current.length - 1];
      const emptyIdxInPrevious = previousState.indexOf(board.length - 1);
      
      setMovingTileIdx(emptyIdxInPrevious);
      await new Promise(r => setTimeout(r, 600));
      
      if (abortSolvingRef.current) break;
      
      const nextBoard = [...previousState];
      setBoard(nextBoard);
      historyRef.current.pop();
      moveCounter++;
      setMoves(moveCounter);
      setMovingTileIdx(null);
      
      if (isSolved(nextBoard)) {
          setIsGameFinished(true);
          saveStats(moveCounter, seconds, gridSize);
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
                const updated = [dataUrl, ...imageHistory.filter(x => x !== dataUrl)].slice(0, 5);
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
    <div className="w-full h-full flex items-center justify-center p-4">
      {/* THE MAIN TRAY CONSOLE */}
      <div className="tray-container w-full max-w-[460px] flex flex-col p-8 gap-8 relative overflow-hidden">
        
        {/* Subtle Ambient Glow inside tray */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent blur-sm" />

        {/* Menu Toggle (Locked to top-left) */}
        <button 
            onClick={() => setIsMenuOpen(true)}
            className="absolute top-7 left-7 p-2.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-white/50 hover:text-white transition-all z-20 shadow-lg active:scale-90"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>

        {/* TRAY HEADER: Branding & Dashboard HUD */}
        <div className="flex flex-col items-center">
            <h1 className="text-3xl font-black text-white/95 tracking-tighter uppercase mb-6 flex items-center gap-2">
                <span className="opacity-40">LUMINA</span> 
                <span className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">PUZZLE</span>
            </h1>
            
            <div className="grid grid-cols-5 w-full gap-3">
                {[
                    { label: 'Moves', val: moves, color: 'text-white' },
                    { label: 'Target', val: requiredMoves || '--', color: 'text-emerald-400' },
                    { label: 'Best', val: bestMoves || '--', color: 'text-blue-400' },
                    { label: 'Dist', val: distance, color: 'text-white/50' },
                    { label: 'Time', val: `${Math.floor(seconds/60)}:${(seconds%60).toString().padStart(2,'0')}`, color: 'text-white' }
                ].map((stat, i) => (
                    <div key={i} className="stat-card flex flex-col items-center justify-center p-3 rounded-2xl">
                        <span className={`text-sm font-black leading-none mb-1.5 ${stat.color}`}>{stat.val}</span>
                        <span className="text-[7px] uppercase font-extrabold text-slate-500 tracking-[0.15em]">{stat.label}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* TRAY WELL: The Recessed Playing Field */}
        <div className="tray-well p-6 flex items-center justify-center shadow-inner">
            <PuzzleBoard 
              board={board} 
              gridSize={gridSize} 
              imageUrl={imageUrl} 
              onTileClick={handleMove}
              spacing={spacing}
              movingTileIdx={movingTileIdx}
              clueTileIdx={clueTileIdx}
              showNumbers={showNumbers}
              tileShape={tileShape}
            />
        </div>

        {/* TRAY FOOTER: Control Interface */}
        <div className="w-full">
            <Controls 
              onShuffle={shuffle}
              onSolve={solve}
              onClue={getClue}
              onUndo={undo}
              isSolving={isSolving}
            />
        </div>
      </div>

      {/* Win Modal Overlay */}
      {isGameFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6">
            <div className="bg-slate-900 border border-slate-700/50 p-10 rounded-[3rem] shadow-2xl text-center w-full max-w-sm animate-pop relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500" />
                <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                </div>
                <h2 className="text-3xl font-black mb-3 text-white uppercase tracking-tighter">Mission Accomplished</h2>
                <p className="text-slate-400 text-sm mb-8 font-medium">You navigated the grid in <span className="text-white font-bold">{moves}</span> moves.</p>
                <div className="flex flex-col gap-3">
                    <button onClick={() => shuffle()} className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-3xl font-black text-xs tracking-[0.2em] transition-all shadow-[0_10px_20px_rgba(37,99,235,0.3)] active:scale-95 text-white">RESTART MATRIX</button>
                    <button onClick={() => setIsGameFinished(false)} className="w-full py-5 bg-slate-800 hover:bg-slate-750 rounded-3xl font-bold text-xs text-slate-400 tracking-[0.2em] transition-all active:scale-95">CONTINUE VIEWING</button>
                </div>
            </div>
        </div>
      )}

      {/* Menu Sidebar */}
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
        tileShape={tileShape}
        setTileShape={setTileShape}
        imageHistory={imageHistory}
        onSelectHistoryImage={setImageUrl}
        onPickImage={pickImage}
        onLoadSaved={loadSavedState}
      />
    </div>
  );
};

export default App;