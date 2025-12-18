import React from 'react';
import { GridSize, Difficulty, StatsEntry } from '../types';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  gridSize: GridSize;
  setGridSize: (s: GridSize) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  spacing: number;
  setSpacing: (v: number) => void;
  imageHistory: string[];
  onSelectHistoryImage: (url: string) => void;
  onPickImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadSaved: () => void;
}

const Menu: React.FC<MenuProps> = ({
  isOpen, onClose, gridSize, setGridSize, difficulty, setDifficulty,
  spacing, setSpacing, imageHistory, onSelectHistoryImage, onPickImage, onLoadSaved
}) => {
  if (!isOpen) return null;

  const stats: StatsEntry[] = JSON.parse(localStorage.getItem('puzzle_stats') || '[]');
  const bestStats = [...stats].sort((a, b) => a.moves - b.moves).slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-80 h-full bg-slate-900 shadow-2xl p-6 flex flex-col gap-6 animate-menu border-r border-white/5 overflow-y-auto">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tighter text-white">GAME MENU</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>

        {/* Persistence */}
        <section>
            <button 
                onClick={() => { onLoadSaved(); onClose(); }}
                className="w-full py-3 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600/30 transition-all"
            >
                Load Saved State
            </button>
        </section>

        {/* Pick Picture */}
        <section>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Pick Picture</h3>
            <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-slate-700 rounded-2xl hover:bg-slate-800 transition-colors cursor-pointer group mb-3">
                <span className="text-xs text-slate-500 font-bold group-hover:text-blue-400">From Gallery</span>
                <input type="file" accept="image/*" onChange={(e) => { onPickImage(e); onClose(); }} className="hidden" />
            </label>
            {imageHistory.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {imageHistory.map((url, i) => (
                        <button 
                            key={i} 
                            onClick={() => onSelectHistoryImage(url)}
                            className="flex-shrink-0 w-12 h-12 rounded-lg bg-cover bg-center border border-slate-700 active:scale-90 transition-transform"
                            style={{ backgroundImage: `url(${url})` }}
                        />
                    ))}
                </div>
            )}
        </section>

        {/* Grid Selection */}
        <section>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Select Grid</h3>
            <div className="grid grid-cols-3 gap-2">
                {[ {r:3, c:3}, {r:4, c:4}, {r:5, c:4} ].map((g, i) => (
                    <button 
                        key={i} 
                        onClick={() => { setGridSize({rows: g.r, cols: g.c}); onClose(); }}
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
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Difficulty</h3>
            <div className="flex gap-2">
                {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                    <button 
                        key={d} 
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${
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
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Tile Spacing</h3>
                <span className="text-xs font-bold text-blue-400">{spacing}px</span>
            </div>
            <input 
                type="range" min="0" max="10" value={spacing} 
                onChange={(e) => setSpacing(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
        </section>

        {/* Stats Display */}
        <section className="mt-auto border-t border-white/5 pt-6 pb-4">
            <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-4">Hall of Fame (Best 10)</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {bestStats.length === 0 ? (
                    <p className="text-[10px] text-slate-600 italic text-center py-4">No records yet. Win a game to show up here!</p>
                ) : (
                    bestStats.map((s, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-800/40 p-3 rounded-xl text-[10px] border border-white/5">
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-300 uppercase">{s.gridSize} Grid</span>
                                <span className="text-slate-600">{s.date}</span>
                            </div>
                            <div className="text-right">
                                <div className="text-blue-400 font-black">{s.moves} moves</div>
                                <div className="text-slate-500">{s.time}s</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
      </div>
    </div>
  );
};

export default Menu;