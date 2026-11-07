import React from 'react';

interface EvaluationBarProps {
  score: number; // Centipawns or -10 to +10
  orientation?: 'white' | 'black';
  label?: string; // overrides the numeric text, e.g. "M3"
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({ score, orientation = 'white', label }) => {
  // Normalize score between -10 and 10 to a 0% to 100% white advantage percentage
  const clamped = Math.max(-10, Math.min(10, score));
  // 0 -> 50%, +10 -> 98%, -10 -> 2%
  const whitePercent = 50 + (clamped / 10) * 48;
  const isWhiteFlipped = orientation === 'black';

  const displayScore = label ?? (score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1));

  return (
    <div className="flex flex-col items-center gap-1.5 select-none h-full min-h-[300px] w-8 sm:w-10">
      <div className="relative w-full flex-1 wood-well rounded-xl overflow-hidden border border-wood-700/80 shadow-wood-inset flex flex-col justify-end p-0.5">
        {/* White portion of the bar: Warm Ivory */}
        <div
          className="w-full bg-gradient-to-t from-[#ded0bc] to-[#f4ede1] rounded-b-lg transition-all duration-300 ease-out flex items-center justify-center shadow-inner"
          style={{
            height: isWhiteFlipped ? `${100 - whitePercent}%` : `${whitePercent}%`,
          }}
        />

        {/* Center balance line in brass */}
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-brass/40 pointer-events-none" />

        {/* Numeric score badge */}
        <div
          className={`absolute inset-x-0 flex items-center justify-center font-mono font-bold text-[11px] leading-tight px-0.5 pointer-events-none ${
            score >= 0 ? 'bottom-2 text-wood-950' : 'top-2 text-wood-100 drop-shadow'
          }`}
        >
          {displayScore}
        </div>
      </div>
      <span className="text-[10px] uppercase font-serif font-bold text-wood-400 tracking-wider">
        Eval
      </span>
    </div>
  );
};
