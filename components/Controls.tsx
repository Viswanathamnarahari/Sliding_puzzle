
import React from 'react';

interface ControlsProps {
  onShuffle: () => void;
  onSolve: () => void;
  onClue: () => void;
  onUndo: () => void;
  isSolving: boolean;
}

const Controls: React.FC<ControlsProps> = ({ onShuffle, onSolve, onClue, onUndo, isSolving }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <button
        onClick={onShuffle}
        disabled={isSolving}
        className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 transition-all active:scale-95 disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/></svg>
        <span className="text-xs font-bold uppercase tracking-widest">Shuffle</span>
      </button>

      <button
        onClick={onSolve}
        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95 ${
          isSolving 
          ? 'bg-red-600/80 border-red-400/20 hover:bg-red-500/80 text-white' 
          : 'bg-indigo-600/80 border-indigo-400/20 hover:bg-indigo-500/80 text-white'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
          {isSolving ? (
            <rect x="6" y="6" width="12" height="12" />
          ) : (
            <path d="m12 14 4-4" />
          )}
          {!isSolving && <path d="M3.34 19a10 10 0 1 1 17.32 0" />}
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest">{isSolving ? 'Stop' : 'Solve'}</span>
      </button>

      <button
        onClick={onClue}
        disabled={isSolving}
        className="flex flex-col items-center justify-center p-4 rounded-2xl bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-400/20 text-yellow-400 transition-all active:scale-95 disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span className="text-xs font-bold uppercase tracking-widest">Clue</span>
      </button>

      <button
        onClick={onUndo}
        disabled={isSolving}
        className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 transition-all active:scale-95 disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M3 10h10a8 8 0 0 1 8 8v2"/><path d="m3 10 7-7"/><path d="m3 10 7 7"/></svg>
        <span className="text-xs font-bold uppercase tracking-widest">Undo</span>
      </button>
    </div>
  );
};

export default Controls;
