import React from 'react';
import { ChessPiece } from './ChessPieces';

interface BotAvatarProps {
  avatarKey?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const BotAvatar: React.FC<BotAvatarProps> = ({ avatarKey = 'pawn', size = 'md', className = '' }) => {
  // Normalize emoji or legacy keys into a chess piece type
  let pieceType: 'p' | 'n' | 'r' | 'b' | 'k' = 'p';
  let pieceColor: 'w' | 'b' = 'w';

  const key = (avatarKey || '').toLowerCase();
  if (key.includes('knight') || key.includes('cat') || key.includes('swords') || key === 'n') {
    pieceType = 'n';
    pieceColor = 'w';
  } else if (key.includes('shield') || key.includes('rook') || key === 'r') {
    pieceType = 'r';
    pieceColor = 'w';
  } else if (key.includes('bishop') || key.includes('owl') || key.includes('prof') || key === 'b') {
    pieceType = 'b';
    pieceColor = 'w';
  } else if (key.includes('king') || key.includes('magnus') || key.includes('lion') || key.includes('gm') || key === 'k') {
    pieceType = 'k';
    pieceColor = 'w';
  } else {
    // default pawn
    pieceType = 'p';
    pieceColor = 'w';
  }

  const sizeClasses = {
    sm: 'w-7 h-7 p-1 text-xs',
    md: 'w-10 h-10 p-1.5 text-sm',
    lg: 'w-12 h-12 p-2 text-base',
    xl: 'w-16 h-16 p-2.5 text-xl',
  }[size];

  return (
    <div
      className={`relative rounded-xl shrink-0 flex items-center justify-center select-none ${sizeClasses} ${className}`}
      style={{
        background: 'linear-gradient(145deg, #38271e 0%, #1e1510 100%)',
        border: '1.5px solid #543b2b',
        boxShadow:
          '3px 4px 8px rgba(4, 3, 2, 0.75), -1px -1px 3px rgba(255, 235, 215, 0.05), inset 1px 1px 2px rgba(255, 235, 215, 0.1)',
      }}
      title={`Piece: ${pieceType.toUpperCase()}`}
    >
      {/* Routed concentric inner groove */}
      <div className="absolute inset-0.5 rounded-[9px] border border-black/30 pointer-events-none" />
      <div className="w-full h-full flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
        <ChessPiece type={pieceType} color={pieceColor} />
      </div>
    </div>
  );
};
