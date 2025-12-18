
import React, { useState } from 'react';
import { GridSize, Difficulty, StatsEntry } from '../types';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  gridSize: GridSize;
  setGridSize: (g: GridSize) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  spacing: number;
  setSpacing: (s: number) => void;
  spacingColor: string;
  setSpacingColor: (c: string) => void;
  showNumbers: boolean;
  setShowNumbers: (b: boolean) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imageHistory: string[];
  onSelectHistoryImage: (url: string) => void;
  onSave: () => void;
  onLoad: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateAI: (prompt: string) => void;
  isGenerating: boolean;
}

const COLORS = [
  { name: 'None', value: 'transparent' },
  { name: 'Auto', value: 'auto' },
  { name: 'Dark', value: '#0f172a' },
  { name: 'Blue', value: '#1e3a8a' },
  { name: 'Amber', value: '#78350f' },
  { name: 'Emerald', value: '#064e3b' },
  { name: 'Rose', value: '#4c0519' },
];

const Menu: React.FC<MenuProps> = ({
  isOpen, onClose, gridSize, setGridSize, difficulty, setDifficulty, 
  spacing, setSpacing, spacingColor, setSpacingColor, showNumbers, setShowNumbers,
  onImageUpload, imageHistory, onSelectHistoryImage,
  onSave, onLoad, onExport, onImport, onGenerateAI, isGenerating
}) => {
  const [aiPrompt, setAiPrompt] = useState('');

  if (!isOpen) return null;

  const stats: StatsEntry[] = JSON.parse(localStorage.getItem('puzzle_stats') || '[]');

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-slate-900 border-r border-white/10 h-full overflow-y-auto p-8 shadow-2xl flex flex-col space-y-8 animate-slide-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* State Management */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Storage & Backup</h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onSave} className="py-2 bg-blue-600/20 border border-blue-400/30 text-blue-400 rounded-lg text-sm hover:bg-blue-600/30 transition-colors">Save Game</button>
            <button onClick={onLoad} className="py-2 bg-slate-800 border border-white/10 text-white rounded-lg text-sm hover:bg-slate-700 transition-colors">Load Game</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onExport} className="py-2 bg-emerald-600/20 border border-emerald-400/30 text-emerald-400 rounded-lg text-xs hover:bg-emerald-600/30 transition-colors">Export Backup</button>
            <label className="py-2 bg-slate-800 border border-white/10 text-white rounded-lg text-xs hover:bg-slate-700 transition-colors cursor-pointer text-center">
              Import Backup
              <input type="file" className="hidden" accept=".json" onChange={onImport} />
            </label>
          </div>
        </section>

        {/* Visual Settings */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Visuals</h3>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-white/5">
            <span className="text-sm font-medium">Show Tile Numbers</span>
            <button 
              onClick={() => setShowNumbers(!showNumbers)}
              className={`w-12 h-6 rounded-full transition-colors relative ${showNumbers ? 'bg-blue-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${showNumbers ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </section>

        {/* AI Generation */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            Generate with Gemini
          </h3>
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder="E.g. Neon cyber-cat in space"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 text-white"
            />
            <button 
              onClick={() => onGenerateAI(aiPrompt)}
              disabled={isGenerating || !aiPrompt}
              className={`w-full py-2 rounded-lg text-sm font-bold transition-all ${
                isGenerating ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
              }`}
            >
              {isGenerating ? 'Generating...' : 'Generate Image'}
            </button>
          </div>
        </section>

        {/* Grid & Difficulty */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Grid Selection</h3>
          <div className="grid grid-cols-3 gap-2">
            {[ {r:3, c:3}, {r:4, c:4}, {r:5, c:4} ].map(g => (
              <button 
                key={`${g.r}x${g.c}`}
                onClick={() => setGridSize({rows: g.r, cols: g.c})}
                className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                  gridSize.rows === g.r && gridSize.cols === g.c 
                  ? 'bg-blue-600 border-blue-400 text-white' 
                  : 'bg-slate-800 border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {g.r}x{g.c}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Difficulty (Shuffle Moves)</h3>
          <div className="flex space-x-2">
            {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
              <button 
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                  difficulty === d 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'bg-slate-800 text-slate-400'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </section>

        {/* Spacing & Color */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tile Spacing</h3>
            <span className="text-xs text-blue-400 font-mono">{spacing}px</span>
          </div>
          <input 
            type="range" min="0" max="15" step="1" 
            value={spacing} onChange={(e) => setSpacing(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </section>

        {/* Images */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Custom Gallery</h3>
          <label className="block">
            <input type="file" onChange={onImageUpload} accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600/10 file:text-blue-400 hover:file:bg-blue-600/20 cursor-pointer"/>
          </label>
          
          {imageHistory.length > 0 && (
            <div className="pt-2">
              <h4 className="text-[10px] font-bold text-slate-600 uppercase mb-2">Recently Used</h4>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {imageHistory.map((url, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => onSelectHistoryImage(url)}
                    className="w-14 h-14 rounded-lg bg-cover bg-center shrink-0 border border-white/10 hover:border-blue-500 transition-colors shadow-lg"
                    style={{ backgroundImage: `url(${url})` }}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Stats */}
        <section className="space-y-4 pb-12">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Best Games (Last 10)</h3>
          <div className="space-y-2">
            {stats.length === 0 ? (
              <p className="text-xs text-slate-600 italic">No games finished yet.</p>
            ) : (
              stats.map((s, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] p-2 rounded-lg bg-slate-800/30 border border-white/5">
                  <span className="text-slate-500">{s.date}</span>
                  <span className="font-bold text-indigo-400">{s.gridSize}</span>
                  <span className="text-white font-mono">{s.moves} moves</span>
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
