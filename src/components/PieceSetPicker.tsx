import React from 'react';
import { DEFAULT_PIECE_SET, PIECE_SET_LIST } from '../data/pieceSets';
import { useProgress } from '../context/ProgressContext';
import { ChessPiece } from './ChessPieces';

export const PieceSetPicker: React.FC = () => {
  const { progress, setPieceSet } = useProgress();
  const current = progress.pieceSet ?? DEFAULT_PIECE_SET;

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {PIECE_SET_LIST.map((set) => {
        const selected = set.id === current;
        return (
          <button
            key={set.id}
            onClick={() => setPieceSet(set.id)}
            aria-pressed={selected}
            className={`rounded-lg p-1 transition border ${
              selected ? 'border-brass wood-panel-raised' : 'border-wood-700 wood-btn opacity-80 hover:opacity-100'
            }`}
          >
            <div className="grid grid-cols-2 rounded overflow-hidden">
              <div className="aspect-square bg-[#895228] p-0.5">
                <ChessPiece type="n" color="w" setId={set.id} />
              </div>
              <div className="aspect-square bg-[#e8d7b7] p-0.5">
                <ChessPiece type="n" color="b" setId={set.id} />
              </div>
            </div>
            <span className={`block mt-1 text-[11px] font-serif font-bold ${selected ? 'text-brass' : 'text-wood-300'}`}>
              {set.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};
