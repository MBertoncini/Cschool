import React from 'react';

interface EvaluationBarProps {
  score: number; // White's advantage in pawns, -10 to +10
  orientation?: 'white' | 'black';
  label?: string; // overrides the numeric text, e.g. "M3"
}

// Below this many pawns the position counts as balanced
const EVEN_THRESHOLD = 0.2;

/** Share of the bar owned by White. Non-linear so that small advantages are clearly visible. */
function whiteShare(pawns: number): number {
  const chances = 2 / (1 + Math.exp(-0.368208 * pawns)) - 1;
  return 50 + 50 * chances;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({ score, orientation = 'white', label }) => {
  const clamped = Math.max(-10, Math.min(10, score));
  const whitePercent = whiteShare(clamped);
  const whiteAtBottom = orientation === 'white';
  const whiteAhead = score >= 0;
  // The score sits at the end of the bar belonging to the side that is ahead
  const scoreAtBottom = whiteAhead === whiteAtBottom;

  const displayScore = label ?? (score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1));
  const leader = Math.abs(score) < EVEN_THRESHOLD ? 'Even' : whiteAhead ? 'White' : 'Black';

  return (
    <div
      className="flex flex-col items-center gap-1.5 select-none self-stretch shrink-0 min-h-[300px] w-9 sm:w-11"
      title={leader === 'Even' ? 'The position is balanced' : `${leader} is better (${displayScore})`}
    >
      <div className="relative w-full flex-1 rounded-xl overflow-hidden border border-wood-700/80 shadow-wood-inset bg-[#120c08]">
        {/* White's share: warm ivory, anchored to White's end of the bar */}
        <div
          className={`absolute inset-x-0 bg-gradient-to-t from-[#ded0bc] to-[#f4ede1] transition-[height] duration-500 ease-out ${
            whiteAtBottom ? 'bottom-0' : 'top-0'
          }`}
          style={{ height: `${whitePercent}%` }}
        />

        {/* Center balance line in brass */}
        <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-brass/70 pointer-events-none" />

        {/* Numeric score badge */}
        <div
          className={`absolute inset-x-0 flex items-center justify-center font-mono font-bold text-[11px] leading-tight px-0.5 pointer-events-none ${
            scoreAtBottom ? 'bottom-2' : 'top-2'
          } ${whiteAhead ? 'text-wood-950' : 'text-wood-100'}`}
        >
          {displayScore}
        </div>
      </div>

      {/* Who is better, in words */}
      <span
        className={`w-full text-center rounded text-[9px] sm:text-[10px] leading-4 uppercase font-serif font-bold tracking-tight ${
          leader === 'White'
            ? 'bg-[#f4ede1] text-wood-950'
            : leader === 'Black'
              ? 'bg-[#120c08] text-wood-100 border border-wood-650'
              : 'text-wood-400'
        }`}
      >
        {leader}
      </span>
    </div>
  );
};
