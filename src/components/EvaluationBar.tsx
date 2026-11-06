import React from 'react';

interface EvaluationBarProps {
  score: number; // Centipawns or -10 to +10
  orientation?: 'white' | 'black';
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({ score, orientation = 'white' }) => {
  // Normalize score between -10 and 10 to a 0% to 100% white advantage percentage
  const clamped = Math.max(-10, Math.min(10, score));
  // 0 -> 50%, +10 -> 98%, -10 -> 2%
  const whitePercent = 50 + (clamped / 10) * 48;
  const isWhiteFlipped = orientation === 'black';

  const displayScore = score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1);

  return (
    <div className="flex flex-col items-center gap-1.5 select-none h-full min-h-[300px] w-8 sm:w-10">
      <div className="relative w-full flex-1 bg-stone-900 rounded-lg overflow-hidden border border-stone-700 shadow-md flex flex-col justify-end">
        {/* White portion of the bar */}
        <div
          className="w-full bg-gradient-to-t from-gray-100 to-white transition-all duration-300 ease-out flex items-center justify-center"
          style={{
            height: isWhiteFlipped ? `${100 - whitePercent}%` : `${whitePercent}%`,
          }}
        />

        {/* Numeric score badge */}
        <div
          className={`absolute inset-x-0 flex items-center justify-center font-bold text-[11px] leading-tight px-0.5 pointer-events-none drop-shadow ${
            score >= 0 ? 'bottom-2 text-stone-900' : 'top-2 text-white'
          }`}
        >
          {displayScore}
        </div>
      </div>
      <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider">
        Eval
      </span>
    </div>
  );
};
