
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
}

const Menu: React.FC<MenuProps> = ({
  isOpen, onClose, gridSize, setGridSize, difficulty, setDifficulty,
  spacing, setSpacing, imageHistory, onSelectHistoryImage, onPickImage
}) => {
  if (!isOpen) return null;

  const stats: StatsEntry[] = JSON.parse(localStorage.getItem('puzzle_stats') || '[]');
  const bestStats = [...stats].sort((a, b) => a.moves - b.moves).slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-80 h-full bg-slate-900 shadow-2xl p-6 flex flex-col gap-8 animate-menu border-r border-white/5 overflow-y-auto">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tighter">SETTINGS</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>

        {/* Pick Picture */}
        <section>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Pick Picture</h3>
            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-slate-700 rounded-2xl hover:bg-slate-800 transition-colors cursor-pointer group">
                <span className="text-xs text-slate-500 font-bold group-hover:text-blue-400">From Gallery</span>
                <input type="file" accept="image/*" onChange={(e) => { onPickImage(e); onClose(); }} className="hidden" />
            </label>
            {imageHistory.length > 0 && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                    {imageHistory.map((url, i) => (
                        <button 
                            key={i} 
                            onClick={() => onSelectHistoryImage(url)}
                            className="w-10 h-10 rounded-md bg-cover bg-center border border-slate-700"
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
                            ? 'bg-blue-600 border-blue-400' 
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
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Shuffle Difficulty</h3>
            <div className="flex gap-2">
                {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                    <button 
                        key={d} 
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${
                            difficulty === d 
                            ? 'bg-indigo-600 border-indigo-400' 
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
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Tile Spacing</h3>
            <input 
                type="range" min="0" max="10" value={spacing} 
                onChange={(e) => setSpacing(parseInt(e.target.value))}
                className="w-full accent-blue-500"
            />
        </section>

        {/* Stats Display */}
        <section className="mt-auto border-t border-white/5 pt-6 pb-6">
            <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-3">Best 10 Games</h3>
            <div className="space-y-2">
                {bestStats.length === 0 ? (
                    <p className="text-[10px] text-slate-600 italic">No games completed yet.</p>
                ) : (
                    bestStats.map((s, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-800/40 p-2 rounded-lg text-[10px]">
                            <span className="font-bold text-slate-300">{s.gridSize}</span>
                            <span className="text-blue-400 font-bold">{s.moves} moves</span>
                            <span className="text-slate-600">{s.time}s</span>
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
