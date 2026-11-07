import React from 'react';
import { EngineScore, PlyAnalysis } from '../types/chess';
import { MOVE_CLASS_INFO, winPercent } from '../engine/gameAnalysis';

interface EvalGraphProps {
  plies: PlyAnalysis[];
  startEval?: EngineScore;
  currentPly: number;
  onSelectPly: (ply: number) => void;
  totalPlies: number; // to draw the x-axis even while analysis is partial
}

/** White's winning chances over the game; click anywhere to jump to that move. */
export const EvalGraph: React.FC<EvalGraphProps> = ({ plies, startEval, currentPly, onSelectPly, totalPlies }) => {
  const W = 600;
  const H = 110;
  const n = Math.max(totalPlies, 1);
  const x = (ply: number) => (ply / n) * W;
  const y = (w: number) => H - (w / 100) * H;

  const points: [number, number][] = [[0, y(winPercent(startEval ?? { cp: 20 }))]];
  plies.forEach((p) => points.push([x(p.ply), y(winPercent(p.evalAfter))]));
  const lastX = points[points.length - 1][0];
  const area = `M0,${H} ${points.map(([px, py]) => `L${px.toFixed(1)},${py.toFixed(1)}`).join(' ')} L${lastX.toFixed(1)},${H} Z`;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSelectPly(Math.max(0, Math.min(totalPlies, Math.round(ratio * n))));
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto block rounded-xl cursor-pointer bg-[#201712] border border-wood-700/80 shadow-wood-inset"
      onClick={handleClick}
      role="img"
      aria-label="Evaluation graph"
    >
      <path d={area} fill="#ded2bf" opacity="0.9" />
      <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="#856345" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
      {plies
        .filter((p) => p.classification === 'blunder' || p.classification === 'bad' || p.classification === 'genial')
        .map((p) => (
          <circle
            key={p.ply}
            cx={x(p.ply)}
            cy={y(winPercent(p.evalAfter))}
            r="4.5"
            fill={MOVE_CLASS_INFO[p.classification].color}
            stroke="#201712"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      <line x1={x(currentPly)} y1="0" x2={x(currentPly)} y2={H} stroke="#d4a359" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};
