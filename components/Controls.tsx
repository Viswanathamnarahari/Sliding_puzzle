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
    <div className="grid grid-cols-2 gap-3">
      <button 
        onClick={onShuffle} 
        disabled={isSolving}
        className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/5 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-white/70 hover:bg-white/10 hover:text-white active:scale-95 transition-all disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
        Shuffle
      </button>
      
      <button 
        onClick={onClue}
        disabled={isSolving}
        className="flex items-center justify-center gap-2 py-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        Clue
      </button>

      <button 
        onClick={onUndo}
        disabled={isSolving}
        className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/5 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-white/70 hover:bg-white/10 hover:text-white active:scale-95 transition-all disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10h10a8 8 0 0 1 8 8v2"/><path d="m3 10 7-7"/><path d="m3 10 7 7"/></svg>
        Undo
      </button>

      <button 
        onClick={onSolve}
        className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-xl ${
            isSolving 
            ? 'bg-red-600/20 border border-red-500/30 text-red-500' 
            : 'bg-blue-600 border border-blue-400 text-white'
        }`}
      >
        {isSolving ? (
            <>
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                Stop
            </>
        ) : (
            <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
                Solve
            </>
        )}
      </button>
    </div>
  );
};

export default Controls;