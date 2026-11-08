import React, { useId } from 'react';
import { PieceSetId } from '../types/chess';
import { PieceType, getPieceSet } from '../data/pieceSets';
import { useProgress } from '../context/ProgressContext';

interface PieceProps {
  type: PieceType;
  color: 'w' | 'b';
  className?: string;
  setId?: PieceSetId; // overrides the user's chosen set (used by the picker previews)
}

export const ChessPiece: React.FC<PieceProps> = ({
  type,
  color,
  className = 'w-full h-full select-none pointer-events-none drop-shadow-md',
  setId,
}) => {
  const { progress } = useProgress();
  // SVG ids are document-global: each instance needs its own
  const uid = useId().replace(/\W/g, '');

  const set = getPieceSet(setId ?? progress.pieceSet);
  const drawing = set.drawings[type];
  const palette = set[color];
  const gradientId = `piece-gradient-${uid}`;
  const clipId = `piece-clip-${uid}`;
  const shapes = drawing.shapes.map((d, i) => <path key={i} d={d} />);

  return (
    <svg viewBox="0 0 100 100" overflow="visible" className={className}>
      {palette.gradient && (
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="22" x2="78" y1="0" y2="0">
          <stop offset="0" stopColor={palette.gradient[0]} />
          <stop offset="0.45" stopColor={palette.gradient[1]} />
          <stop offset="1" stopColor={palette.gradient[2]} />
        </linearGradient>
      )}

      {/* The outline is the silhouette drawn fatter underneath, so overlapping parts read as one body */}
      <g fill={palette.outline} stroke={palette.outline} strokeWidth={set.outlineWidth * 2} strokeLinejoin="round">
        {shapes}
      </g>
      <g fill={palette.gradient ? `url(#${gradientId})` : palette.fill}>{shapes}</g>

      {palette.shade && (
        <>
          <clipPath id={clipId}>
            {drawing.facet ? <path d={drawing.facet} /> : <rect x="50" y="0" width="50" height="100" />}
          </clipPath>
          <g fill={palette.shade} clipPath={`url(#${clipId})`}>
            {shapes}
          </g>
        </>
      )}

      {drawing.lines?.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={palette.detail} strokeWidth="2.2" strokeLinecap="round" />
      ))}
      {drawing.dots?.map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill={palette.detail} />)}
    </svg>
  );
};
