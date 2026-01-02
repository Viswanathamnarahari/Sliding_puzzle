import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GridSize, Difficulty, StatsEntry, TileShape } from './types';
import { isAdjacent, getMovableIndices, isSolved } from './services/puzzleLogic';
import PuzzleBoard from './components/PuzzleBoard';
import Controls from './components/Controls';
import Menu from './components/Menu';

const DEFAULT_IMAGE = 'https://picsum.photos/id/237/800/800';

interface UndoStep {
  board: number[];
  history: number[][];
}

const App: React.FC = () => {
  const [board, setBoard] = useState<number[]>([]);
  // Defaulting to 3x3 as requested
  const [gridSize, setGridSize] = useState<GridSize>({ rows: 3, cols: 3 });
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
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
  const [history, setHistory] = useState<number[][]>([]);
  const [undoStack, setUndoStack] = useState<UndoStep[]>([]);
  
  const timerRef = useRef<number | null>(null);
  const secondsRef = useRef(0);
  const abortSolvingRef = useRef(false);
  const isInitialLoadDone = useRef(false);

  useEffect(() => { secondsRef.current = seconds; }, [seconds]);

  // Derive target moves directly for perfect synchronization
  const currentTarget = useMemo(() => hasShuffled ? history.length : null, [hasShuffled, history.length]);

  const updateBestMoves = useCallback((size: GridSize) => {
    try {
      const rawStats = localStorage.getItem('puzzle_stats');
      if (!rawStats) {
        setBestMoves(null);
        return;
      }
      const stats: StatsEntry[] = JSON.parse(rawStats);
      const gridKey = `${size.rows}x${size.cols}`;
      const relevant = stats.filter(s => s.gridSize === gridKey);
      if (relevant.length > 0) {
        const min = Math.min(...relevant.map(r => r.moves));
        setBestMoves(min);
      } else {
        setBestMoves(null);
      }
    } catch (e) { setBestMoves(null); }
  }, []);

  const initBoard = useCallback((size: GridSize) => {
    const newBoard = Array.from({ length: size.rows * size.cols }, (_, i) => i);
    setBoard(newBoard);
    setMoves(0);
    setSeconds(0);
    setHasShuffled(false);
    setHistory([]);
    setUndoStack([]); 
    setIsGameFinished(false);
    setClueTileIdx(null);
    setMovingTileIdx(null);
    setIsSolving(false);
    abortSolvingRef.current = false;
    updateBestMoves(size);
  }, [updateBestMoves]);

  const loadSavedState = useCallback(() => {
    const lastData = localStorage.getItem('puzzle_current_state_data');
    const lastSeconds = localStorage.getItem('puzzle_current_seconds');
    if (lastData) {
        try {
            const parsed = JSON.parse(lastData);
            setBoard(parsed.board);
            setMoves(parsed.moves);
            setSeconds(lastSeconds ? parseInt(lastSeconds, 10) : 0);
            setImageUrl(parsed.imageUrl || DEFAULT_IMAGE);
            setGridSize(parsed.gridSize);
            setHistory(parsed.history || []);
            setUndoStack(parsed.undoStack || []);
            setDifficulty(parsed.difficulty || 'Easy');
            setSpacing(parsed.spacing || 2);
            setShowNumbers(parsed.showNumbers ?? true);
            setTileShape(parsed.tileShape || 'square');
            setHasShuffled(parsed.hasShuffled ?? false);
            updateBestMoves(parsed.gridSize);
            setIsGameFinished(isSolved(parsed.board) && parsed.hasShuffled && parsed.moves > 0);
        } catch(e) { initBoard({ rows: 3, cols: 3 }); }
    } else { initBoard({ rows: 3, cols: 3 }); }
  }, [initBoard, updateBestMoves]);

  useEffect(() => {
    if (!isInitialLoadDone.current) {
      const storedHistory = localStorage.getItem('puzzle_image_history');
      if (storedHistory) {
        try { setImageHistory(JSON.parse(storedHistory)); } catch (e) { setImageHistory([]); }
      }
      loadSavedState();
      isInitialLoadDone.current = true;
    }
  }, [loadSavedState]);

  useEffect(() => {
    if (isInitialLoadDone.current && board.length > 0) {
      const stateToSave = { 
        board, moves, imageUrl, gridSize, 
        history, undoStack, difficulty, spacing, showNumbers, tileShape, hasShuffled 
      };
      try { localStorage.setItem('puzzle_current_state_data', JSON.stringify(stateToSave)); } catch (e) {}
    }
  }, [board, moves, imageUrl, gridSize, difficulty, spacing, showNumbers, tileShape, hasShuffled, history, undoStack]);

  useEffect(() => {
    if (seconds > 0 && !isGameFinished) {
      try { localStorage.setItem('puzzle_current_seconds', seconds.toString()); } catch (e) {}
    }
  }, [seconds, isGameFinished]);

  const isTimerActive = moves > 0 && !isGameFinished && !isSolving;
  useEffect(() => {
    if (isTimerActive) {
      if (!timerRef.current) {
        timerRef.current = window.setInterval(() => setSeconds(s => s + 1), 1000);
      }
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerActive]);

  const saveStats = useCallback((m: number, t: number, s: GridSize) => {
    try {
      const stats: StatsEntry[] = JSON.parse(localStorage.getItem('puzzle_stats') || '[]');
      const entry: StatsEntry = { 
        date: new Date().toLocaleDateString(), 
        moves: m, 
        time: t, 
        gridSize: `${s.rows}x${s.cols}` 
      };
      const updated = [entry, ...stats].sort((a,b) => a.moves - b.moves).slice(0, 50);
      localStorage.setItem('puzzle_stats', JSON.stringify(updated));
    } catch (e) {}
    updateBestMoves(s);
  }, [updateBestMoves]);

  const handleMove = useCallback((index: number, silent = false) => {
    if (isSolving && !silent) return;

    const emptyIdx = board.indexOf(board.length - 1);
    if (!isAdjacent(index, emptyIdx, gridSize)) return;

    // Snapshot current state for undo stack before making the move
    if (!silent) {
      setUndoStack(prev => [...prev, { board: [...board], history: [...history] }]);
    }

    const nextBoard = [...board];
    [nextBoard[index], nextBoard[emptyIdx]] = [nextBoard[emptyIdx], nextBoard[index]];
    setBoard(nextBoard);

    setHistory(prevHistory => {
      const previousState = prevHistory[prevHistory.length - 1];
      const isCorrectBacktrack = previousState && previousState.every((val, i) => val === nextBoard[i]);
      return isCorrectBacktrack ? prevHistory.slice(0, -1) : [...prevHistory, board];
    });

    if (!silent) {
      setMoves(m => {
        const nextMoves = m + 1;
        if (isSolved(nextBoard) && hasShuffled && nextMoves > 0) {
          setIsGameFinished(true);
          saveStats(nextMoves, secondsRef.current, gridSize);
        }
        return nextMoves;
      });
      setClueTileIdx(null);
    }
  }, [gridSize, isSolving, hasShuffled, saveStats, board, history]);

  const shuffle = useCallback(() => {
    if (isSolving) return;
    setIsGameFinished(false);
    let curr = Array.from({ length: gridSize.rows * gridSize.cols }, (_, i) => i);
    const shuffleCount = difficulty === 'Easy' ? 20 : difficulty === 'Medium' ? 50 : 150;
    let lastEmpty = -1;
    const newHistory: number[][] = [];

    for (let i = 0; i < shuffleCount; i++) {
      const emptyIdx = curr.indexOf(curr.length - 1);
      const movables = getMovableIndices(emptyIdx, gridSize).filter(idx => idx !== lastEmpty);
      const move = movables[Math.floor(Math.random() * movables.length)];
      newHistory.push([...curr]);
      [curr[emptyIdx], curr[move]] = [curr[move], curr[emptyIdx]];
      lastEmpty = emptyIdx;
    }
    
    setHistory(newHistory);
    setUndoStack([]); 
    setBoard(curr);
    setMoves(0);
    setSeconds(0);
    setClueTileIdx(null);
    setHasShuffled(true);
  }, [gridSize, difficulty, isSolving]);

  const undo = useCallback(() => {
    if (isSolving || undoStack.length === 0) return;
    
    const lastStep = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setBoard(lastStep.board);
    setHistory(lastStep.history);
    setMoves(m => Math.max(0, m - 1));
    setClueTileIdx(null);
    setIsGameFinished(false);
  }, [isSolving, undoStack]);

  const getClue = useCallback(() => {
    if (isSolving || isGameFinished || !hasShuffled || history.length === 0) return;
    const previousState = history[history.length - 1];
    const emptyIdxInPrevious = previousState.indexOf(board.length - 1);
    setClueTileIdx(emptyIdxInPrevious);
  }, [isSolving, isGameFinished, hasShuffled, history, board.length]);

  const solve = useCallback(async () => {
    if (isSolving) { abortSolvingRef.current = true; return; }
    if (isSolved(board) || !hasShuffled) return;
    
    setIsSolving(true);
    abortSolvingRef.current = false;
    
    let currentHistory = [...history];
    let moveCounter = moves;

    while (currentHistory.length > 0 && !abortSolvingRef.current) {
      const previousState = currentHistory[currentHistory.length - 1];
      const emptyIdxInPrevious = previousState.indexOf(board.length - 1);
      setMovingTileIdx(emptyIdxInPrevious);
      await new Promise(r => setTimeout(r, 600));
      if (abortSolvingRef.current) break;
      
      const nextBoard = [...previousState];
      setBoard(nextBoard);
      currentHistory.pop();
      setHistory([...currentHistory]);
      
      moveCounter++;
      setMoves(moveCounter);
      setMovingTileIdx(null);
      
      if (isSolved(nextBoard)) {
          setIsGameFinished(true);
          saveStats(moveCounter, secondsRef.current, gridSize);
          break;
      }
    }
    setIsSolving(false);
  }, [board, hasShuffled, history, moves, gridSize, isSolving, saveStats]);

  const pickImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const targetAspect = gridSize.cols / gridSize.rows;
            const imgAspect = img.width / img.height;
            let cropWidth, cropHeight, offsetX, offsetY;
            if (imgAspect > targetAspect) {
                cropHeight = img.height;
                cropWidth = img.height * targetAspect;
                offsetX = (img.width - cropWidth) / 2;
                offsetY = 0;
            } else {
                cropWidth = img.width;
                cropHeight = img.width / targetAspect;
                offsetX = 0;
                offsetY = (img.height - cropHeight) / 2;
            }
            const BASE_SIZE = 800;
            canvas.width = BASE_SIZE * targetAspect;
            canvas.height = BASE_SIZE;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, offsetX, offsetY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
              try {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                setImageUrl(dataUrl);
                const updated = [dataUrl, ...imageHistory.filter(x => x !== dataUrl)].slice(0, 5);
                setImageHistory(updated);
                localStorage.setItem('puzzle_image_history', JSON.stringify(updated));
              } catch (err) { localStorage.removeItem('puzzle_image_history'); }
            }
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, [gridSize, imageHistory]);

  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-start overflow-y-auto overflow-x-hidden pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] md:p-12"
      style={{
        paddingTop: 'calc(max(5rem, env(safe-area-inset-top)) + 2rem)'
      }}
    >
      <div className="w-full max-w-[420px] mb-8 flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-8">
            <div className="flex items-center gap-2">
                <button onClick={() => setIsMenuOpen(true)} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all shadow-xl active:scale-90"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg></button>
                <label className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all shadow-xl active:scale-90 cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><input type="file" accept="image/*" onChange={pickImage} className="hidden" /></label>
            </div>
            <h1 className="text-2xl font-black text-white/95 tracking-tighter uppercase flex items-center gap-2"><span className="opacity-30">R3AL</span><span className="text-blue-500 drop-shadow-[0_0_12px_rgba(59,130,246,0.4)]">PUZZLE</span></h1>
            <div className="flex items-center">
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="bg-slate-800/80 border border-white/10 rounded-xl px-2.5 py-2 text-[9px] font-black uppercase text-blue-400 outline-none appearance-none cursor-pointer hover:bg-slate-700 transition-colors shadow-lg min-w-[70px] text-center">
                <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
              </select>
            </div>
        </div>
        <div className="grid grid-cols-4 w-full gap-2.5">
            {[
                { label: 'Moves', val: moves, color: 'text-white' },
                { label: 'Target', val: currentTarget !== null ? currentTarget : '--', color: 'text-emerald-400' },
                { label: 'Best', val: bestMoves || '--', color: 'text-blue-400' },
                { label: 'Time', val: `${Math.floor(seconds/60)}:${(seconds%60).toString().padStart(2,'0')}`, color: 'text-white' }
            ].map((stat, i) => (
                <div key={i} className="stat-card flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl">
                    <span className={`text-xs font-black leading-none mb-1.5 ${stat.color}`}>{stat.val}</span>
                    <span className="text-[6px] uppercase font-black text-slate-500 tracking-[0.15em]">{stat.label}</span>
                </div>
            ))}
        </div>
      </div>
      <div className="flex items-center justify-center mb-10">
          <PuzzleBoard board={board} gridSize={gridSize} imageUrl={imageUrl} onTileClick={handleMove} spacing={spacing} movingTileIdx={movingTileIdx} clueTileIdx={clueTileIdx} showNumbers={showNumbers} tileShape={tileShape} />
      </div>
      <div className="w-full max-w-[420px] pb-12">
          <Controls onShuffle={shuffle} onSolve={solve} onClue={getClue} onUndo={undo} isSolving={isSolving} canUndo={!isSolving && undoStack.length > 0} />
      </div>
      {isGameFinished && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
            <div className="bg-slate-900 border border-slate-700/50 p-10 rounded-[3rem] shadow-2xl text-center w-full max-w-sm animate-pop relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500" />
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-blue-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                </div>
                <h2 className="text-2xl font-black mb-3 text-white uppercase tracking-tighter">Mission AccomplISHED</h2>
                <p className="text-slate-400 text-xs mb-10 font-medium">Completed in <span className="text-white font-bold">{moves}</span> moves.</p>
                <div className="flex flex-col gap-3">
                    <button onClick={shuffle} className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all shadow-xl active:scale-95 text-white">RESTART MATRIX</button>
                    <button onClick={() => setIsGameFinished(false)} className="w-full py-5 bg-slate-800 hover:bg-slate-750 rounded-2xl font-bold text-[10px] text-slate-400 tracking-[0.2em] transition-all active:scale-95 uppercase">Dismiss</button>
                    <p className="text-[9px] text-slate-500 font-medium tracking-tight mt-2 opacity-50">viswanatham@gmail.com</p>
                </div>
            </div>
        </div>
      )}
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} gridSize={gridSize} setGridSize={(s) => { setGridSize(s); initBoard(s); }} difficulty={difficulty} setDifficulty={setDifficulty} spacing={spacing} setSpacing={setSpacing} showNumbers={showNumbers} setShowNumbers={setShowNumbers} tileShape={tileShape} setTileShape={setTileShape} imageHistory={imageHistory} onSelectHistoryImage={setImageUrl} onPickImage={pickImage} onLoadSaved={loadSavedState} />
    </div>
  );
};

export default App;