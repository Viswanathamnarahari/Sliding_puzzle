import React, { useState } from 'react';
import { GridSize, Difficulty, StatsEntry, TileShape } from '../types';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  gridSize: GridSize;
  setGridSize: (s: GridSize) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  spacing: number;
  setSpacing: (v: number) => void;
  showNumbers: boolean;
  setShowNumbers: (v: boolean) => void;
  tileShape: TileShape;
  setTileShape: (s: TileShape) => void;
  imageHistory: string[];
  onSelectHistoryImage: (url: string) => void;
  onPickImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadSaved: () => void;
}

const Menu: React.FC<MenuProps> = ({
  isOpen, onClose, gridSize, setGridSize, difficulty, setDifficulty,
  spacing, setSpacing, showNumbers, setShowNumbers, tileShape, setTileShape,
  imageHistory, onSelectHistoryImage, onPickImage, onLoadSaved
}) => {
  const [activeSubView, setActiveSubView] = useState<'main' | 'instructions' | 'about'>('main');

  if (!isOpen) return null;

  const stats: StatsEntry[] = JSON.parse(localStorage.getItem('puzzle_stats') || '[]');
  const bestStats = [...stats].sort((a, b) => a.moves - b.moves).slice(0, 10);

  const handleClose = () => {
    setActiveSubView('main');
    onClose();
  };

  const renderInstructions = () => (
    <div className="flex flex-col h-full animate-pop">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setActiveSubView('main')}
          className="p-2 hover:bg-slate-800 rounded-lg text-blue-400 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-xl font-black tracking-tighter text-white uppercase">How to Play</h2>
      </div>
      
      <div className="space-y-6 text-[12px] leading-relaxed text-slate-400 overflow-y-auto pr-2">
          <p><span className="text-blue-400 font-black block mb-1 uppercase tracking-wider">01. START</span> Hit <span className="text-white font-bold">Shuffle</span> to scramble the tiles. The timer and move counter begin on your first move.</p>
          <p><span className="text-blue-400 font-black block mb-1 uppercase tracking-wider">02. NAVIGATION</span> Tap tiles next to the empty space to move them. Toggle <span className="text-white font-bold">Show Numbers</span> if the image is too difficult.</p>
          <p><span className="text-blue-400 font-black block mb-1 uppercase tracking-wider">03. PERSONALIZE</span> Change <span className="text-white font-bold">Tile Spacing</span> for a cleaner look or switch between <span className="text-white font-bold">Square</span> and <span className="text-white font-bold">Rounded</span> tile shapes.</p>
          <p><span className="text-blue-400 font-black block mb-1 uppercase tracking-wider">04. DATA PERSISTENCE</span> Your state is auto-cached. Use <span className="text-white font-bold">"Load Saved State"</span> to resume a previous session if you close the app.</p>
          <p><span className="text-blue-400 font-black block mb-1 uppercase tracking-wider">05. DIFFICULTY</span> Adjust complexity levels (Easy/Medium/Hard) to change the initial number of shuffles.</p>
          <p><span className="text-blue-400 font-black block mb-1 uppercase tracking-wider">06. HALL OF FAME</span> Your lowest move counts are saved locally for each grid size. Try to beat your best!</p>
      </div>
      
      <button 
        onClick={() => setActiveSubView('main')}
        className="mt-auto py-4 bg-slate-800 hover:bg-slate-750 text-white rounded-xl font-black text-[10px] tracking-[0.2em] transition-all uppercase"
      >
        Back to Menu
      </button>
    </div>
  );

  const renderAbout = () => (
    <div className="flex flex-col h-full animate-pop">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setActiveSubView('main')}
          className="p-2 hover:bg-slate-800 rounded-lg text-blue-400 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-xl font-black tracking-tighter text-white uppercase">About</h2>
      </div>
      
      <div className="flex flex-col items-center justify-center flex-1 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center border border-blue-500/20 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v19"/><path d="M5 8h14"/><path d="M15 21a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6Z"/></svg>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">R3AL PUZZLE</h1>
          <p className="text-blue-400 font-bold tracking-widest text-[10px] uppercase">For grand kids</p>
          <div className="w-8 h-px bg-slate-800 my-4" />
          <p className="text-slate-400 text-xs font-medium">Viswanatham@gmail.com</p>
          <p className="text-slate-600 text-[10px] font-black tracking-[0.2em] mt-8 uppercase">251224.2</p>
      </div>
      
      <button 
        onClick={() => setActiveSubView('main')}
        className="mt-auto py-4 bg-slate-800 hover:bg-slate-750 text-white rounded-xl font-black text-[10px] tracking-[0.2em] transition-all uppercase"
      >
        Back to Menu
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-80 h-full bg-slate-900 shadow-2xl pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(1.5rem,env(safe-area-inset-left))] pr-6 flex flex-col gap-6 animate-menu border-r border-white/5 overflow-y-auto">
        
        {activeSubView === 'instructions' ? renderInstructions() : 
         activeSubView === 'about' ? renderAbout() : (
          <>
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black tracking-tighter text-white">GAME MENU</h2>
                <button onClick={handleClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>

            {/* Persistence Actions */}
            <section>
                <button 
                    onClick={() => { onLoadSaved(); handleClose(); }}
                    className="w-full py-4 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600/30 transition-all active:scale-95"
                >
                    LOAD SAVED STATE
                </button>
            </section>

            {/* Pick Picture */}
            <section>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">PICK PICTURE</h3>
                <label className="flex flex-col items-center justify-center w-full h-20 bg-slate-800 border-2 border-slate-700 border-dashed rounded-2xl hover:bg-slate-750 transition-all cursor-pointer group mb-4 active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2 text-slate-500 group-hover:text-blue-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span className="text-xs text-slate-400 font-black group-hover:text-blue-400 tracking-tighter uppercase">Gallery Upload</span>
                    <input type="file" accept="image/*" onChange={(e) => { onPickImage(e); handleClose(); }} className="hidden" />
                </label>
                {imageHistory.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {imageHistory.map((url, i) => (
                            <button 
                                key={i} 
                                onClick={() => { onSelectHistoryImage(url); handleClose(); }}
                                className="flex-shrink-0 w-12 h-12 rounded-lg bg-cover bg-center border-2 border-slate-700 active:scale-90 transition-all hover:border-blue-500"
                                style={{ backgroundImage: `url(${url})` }}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Toggles */}
            <section className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-white/5">
                <span className="text-xs font-black text-slate-300 tracking-tight uppercase">SHOW NUMBERS</span>
                <button 
                    onClick={() => setShowNumbers(!showNumbers)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${showNumbers ? 'bg-blue-600' : 'bg-slate-700'}`}
                >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showNumbers ? 'left-7' : 'left-1'}`} />
                </button>
            </section>

            {/* Tile Shape Selection */}
            <section>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">TILE SHAPE</h3>
                <div className="flex gap-2">
                    {(['square', 'rounded'] as TileShape[]).map(s => (
                        <button 
                            key={s} 
                            onClick={() => setTileShape(s)}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border uppercase tracking-widest ${
                                tileShape === s 
                                ? 'bg-blue-600 border-blue-400 text-white shadow-lg' 
                                : 'bg-slate-800 border-white/5 text-slate-400'
                            }`}
                        >
                            {s.toUpperCase()}
                        </button>
                    ))}
                </div>
            </section>

            {/* Grid Selection */}
            <section>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">SELECT GRID</h3>
                <div className="grid grid-cols-3 gap-2">
                    {[ {r:3, c:3}, {r:4, c:4}, {r:5, c:5} ].map((g, i) => (
                        <button 
                            key={i} 
                            onClick={() => { setGridSize({rows: g.r, cols: g.c}); handleClose(); }}
                            className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                                gridSize.rows === g.r && gridSize.cols === g.c 
                                ? 'bg-blue-600 border-blue-400 text-white shadow-lg' 
                                : 'bg-slate-800 border-white/5 text-slate-400'
                            }`}
                        >
                            {g.r}x{g.c}
                        </button>
                    ))}
                </div>
            </section>

            {/* Difficulty Setting */}
            <section>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">DIFFICULTY</h3>
                <div className="flex gap-2">
                    {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                        <button 
                            key={d} 
                            onClick={() => setDifficulty(d)}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border uppercase tracking-widest ${
                                difficulty === d 
                                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' 
                                : 'bg-slate-800 border-white/5 text-slate-400'
                            }`}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </section>

            {/* Spacing Setting */}
            <section>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">TILE SPACING</h3>
                    <span className="text-xs font-bold text-blue-400">{spacing}px</span>
                </div>
                <input 
                    type="range" min="0" max="10" value={spacing} 
                    onChange={(e) => setSpacing(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </section>

            {/* Footer Menu Actions */}
            <section className="pt-2 flex flex-col gap-2">
                <button 
                    onClick={() => setActiveSubView('about')}
                    className="w-full py-4 bg-slate-800 border border-white/5 text-slate-300 rounded-xl font-bold text-[9px] uppercase tracking-[0.2em] hover:bg-slate-750 transition-all flex items-center justify-center gap-2.5 group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 group-hover:scale-110 transition-transform"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    ABOUT
                </button>
                <button 
                    onClick={() => setActiveSubView('instructions')}
                    className="w-full py-4 bg-slate-800 border border-white/5 text-slate-300 rounded-xl font-bold text-[9px] uppercase tracking-[0.2em] hover:bg-slate-750 transition-all flex items-center justify-center gap-2.5 group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 group-hover:scale-110 transition-transform"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    HOW TO PLAY
                </button>
            </section>

            {/* Stats Display */}
            <section className="mt-auto border-t border-white/5 pt-6 pb-4">
                <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-4">HALL OF FAME</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {bestStats.length === 0 ? (
                        <p className="text-[10px] text-slate-600 italic text-center py-4">No records yet. Win a game to show up here!</p>
                    ) : (
                        bestStats.map((s, i) => (
                            <div key={i} className="flex justify-between items-center bg-slate-800/40 p-3 rounded-xl text-[10px] border border-white/5">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-300 uppercase">{s.gridSize} GRID</span>
                                    <span className="text-slate-600 uppercase">{s.date}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-blue-400 font-black uppercase">{s.moves} MOVES</div>
                                    <div className="text-slate-500 uppercase">{s.time}S</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Menu;