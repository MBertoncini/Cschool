import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { ChessPiece } from './ChessPieces';

export interface BoardArrow {
  from: Square;
  to: Square;
  color?: string;
  dashed?: boolean;
}

export interface SquareBadge {
  square: Square;
  label: string; // short text/icon, e.g. "??" or "!!"
  color: string; // background color
}

interface ChessBoardProps {
  game: Chess;
  onMove?: (move: { from: Square; to: Square; promotion?: string }) => boolean | void;
  orientation?: 'white' | 'black';
  interactive?: boolean;
  highlightSquares?: Square[];
  arrow?: BoardArrow | null;
  arrows?: BoardArrow[];
  lastMove?: { from: Square; to: Square } | null;
  customSquareStyles?: Record<string, string>;
  disabled?: boolean;
  badge?: SquareBadge | null;
}

interface DragState {
  from: Square;
  x: number; // pointer position relative to the board grid, in px
  y: number;
  moved: boolean; // pointer travelled far enough to count as a drag (vs. a click)
  wasSelected: boolean; // the square was already selected before this press
  pointerId: number;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export const ChessBoard: React.FC<ChessBoardProps> = ({
  game,
  onMove,
  orientation = 'white',
  interactive = true,
  highlightSquares = [],
  arrow = null,
  arrows = [],
  lastMove = null,
  customSquareStyles = {},
  disabled = false,
  badge = null,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverSquare, setHoverSquare] = useState<Square | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const canInteract = interactive && !disabled;

  // Position changed (new move, navigation…) → drop any stale selection
  const fen = game.fen();
  useEffect(() => {
    setSelectedSquare(null);
    setPendingPromotion(null);
    setDrag(null);
  }, [fen]);

  // Re-calculate legal moves when selectedSquare or game changes
  useEffect(() => {
    if (!selectedSquare || !canInteract) {
      setLegalMoves([]);
      return;
    }
    try {
      setLegalMoves(game.moves({ square: selectedSquare, verbose: true }) as Move[]);
    } catch {
      setLegalMoves([]);
    }
  }, [selectedSquare, game, canInteract]);

  const displayedFiles = orientation === 'white' ? FILES : [...FILES].reverse();
  const displayedRanks = orientation === 'white' ? RANKS : [...RANKS].reverse();

  const squareFromPoint = (clientX: number, clientY: number): Square | null => {
    const el = boardRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const col = Math.floor(((clientX - rect.left) / rect.width) * 8);
    const row = Math.floor(((clientY - rect.top) / rect.height) * 8);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    return `${displayedFiles[col]}${displayedRanks[row]}` as Square;
  };

  /** Tries to play from → to. Returns true when the move was legal (or is waiting for promotion choice). */
  const tryMove = (from: Square, to: Square): boolean => {
    let moves: Move[] = [];
    try {
      moves = game.moves({ square: from, verbose: true }) as Move[];
    } catch {
      return false;
    }
    const candidate = moves.find((m) => m.to === to);
    if (!candidate) return false;
    if (candidate.promotion) {
      setPendingPromotion({ from, to });
      return true;
    }
    onMove?.({ from, to });
    setSelectedSquare(null);
    return true;
  };

  const handlePointerDown = (e: React.PointerEvent, square: Square) => {
    if (!canInteract || pendingPromotion) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Click-to-move: a piece is selected and this square is a legal destination
    if (selectedSquare && selectedSquare !== square && legalMoves.some((m) => m.to === square)) {
      tryMove(selectedSquare, square);
      return;
    }

    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      e.preventDefault();
      const rect = boardRef.current!.getBoundingClientRect();
      boardRef.current!.setPointerCapture(e.pointerId);
      setDrag({
        from: square,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        moved: false,
        wasSelected: selectedSquare === square,
        pointerId: e.pointerId,
      });
      setSelectedSquare(square);
      setHoverSquare(square);
      return;
    }

    setSelectedSquare(null);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const rect = boardRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const moved = drag.moved || Math.hypot(x - drag.x, y - drag.y) > 4;
    setDrag({ ...drag, x, y, moved });
    setHoverSquare(squareFromPoint(e.clientX, e.clientY));
  };

  const finishDrag = (e: React.PointerEvent, cancelled = false) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const current = drag;
    setDrag(null);
    setHoverSquare(null);
    try {
      boardRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (cancelled) return;

    const target = squareFromPoint(e.clientX, e.clientY);
    if (!target || target === current.from) {
      // A plain click on an already selected piece toggles the selection off
      if (!current.moved && current.wasSelected) setSelectedSquare(null);
      return;
    }
    if (!tryMove(current.from, target)) {
      // Illegal drop: piece snaps back, keep it selected so the dots stay visible
      setSelectedSquare(current.from);
    }
  };

  const handlePromotionSelect = (promotionPiece: 'q' | 'r' | 'b' | 'n') => {
    if (!pendingPromotion) return;
    onMove?.({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: promotionPiece });
    setPendingPromotion(null);
    setSelectedSquare(null);
  };

  // Find King square if in check
  const inCheckSquare: Square | null = (() => {
    if (!game.inCheck()) return null;
    const turn = game.turn();
    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) return p.square as Square;
      }
    }
    return null;
  })();

  const getSquareCoordinates = (square: Square) => {
    const colIdx = displayedFiles.indexOf(square[0]);
    const rowIdx = displayedRanks.indexOf(square[1]);
    return { x: colIdx * 12.5 + 6.25, y: rowIdx * 12.5 + 6.25 };
  };

  const allArrows = [...(arrow ? [arrow] : []), ...arrows];
  const draggedPiece = drag?.moved ? game.get(drag.from) : null;

  return (
    <div className="relative select-none w-full max-w-[540px] aspect-square rounded-2xl wood-board-bezel p-3 sm:p-3.5 transition-all">
      {/* Subtle Routed Inset Rim */}
      <div className="w-full h-full p-1 rounded-xl wood-well border border-wood-850">
        {/* Chessboard Grid */}
        <div
          ref={boardRef}
          onPointerMove={handlePointerMove}
          onPointerUp={(e) => finishDrag(e)}
          onPointerCancel={(e) => finishDrag(e, true)}
          style={{ touchAction: canInteract ? 'none' : undefined }}
          className="relative w-full h-full grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden shadow-inner border border-[#2b1b11]"
        >
          {displayedRanks.map((rank, rowIdx) =>
            displayedFiles.map((file, colIdx) => {
              const square = `${file}${rank}` as Square;
              const isLight = (colIdx + rowIdx) % 2 === 0;
              const piece = game.get(square);
              const isSelected = selectedSquare === square;
              const isHighlighted = highlightSquares.includes(square);
              const isLastMove = lastMove?.from === square || lastMove?.to === square;
              const isCheck = inCheckSquare === square;
              const isDragOrigin = drag?.moved && drag.from === square;

              const legalMove = legalMoves.find((m) => m.to === square);
              const isLegalDestination = Boolean(legalMove);
              const isCapture = Boolean(legalMove && (piece || legalMove.flags.includes('e')));
              const isDropTarget = drag?.moved && hoverSquare === square && isLegalDestination;

              // Handcrafted Walnut & Boxwood Wood Tones
              let bgClass = isLight ? 'bg-[#e8d7b7]' : 'bg-[#895228]';
              if (isLastMove) bgClass = isLight ? 'bg-[#e0b457]' : 'bg-[#ab7834]';
              if (isSelected) bgClass = 'bg-[#c79948]';
              if (isCheck) bgClass = 'bg-[#8f2424]';

              const pieceInteractive = canInteract && piece && piece.color === game.turn();

              return (
                <div
                  key={square}
                  onPointerDown={(e) => handlePointerDown(e, square)}
                  className={`relative flex items-center justify-center transition-colors duration-100 ${bgClass} ${
                    pieceInteractive ? (drag ? 'cursor-grabbing' : 'cursor-grab') : canInteract ? 'cursor-pointer' : ''
                  } ${customSquareStyles[square] || ''}`}
                >
                  {isHighlighted && !isSelected && (
                    <div className="absolute inset-0 bg-[#d4a359]/35 ring-4 ring-[#d4a359] ring-inset z-10 pointer-events-none rounded-sm" />
                  )}
                  {isDropTarget && (
                    <div className="absolute inset-0 ring-4 ring-inset ring-brass/80 z-10 pointer-events-none" />
                  )}

                  {/* Rank labels on left file */}
                  {colIdx === 0 && (
                    <span
                      className={`absolute top-0.5 left-1 text-[10px] sm:text-xs font-serif font-bold leading-none pointer-events-none ${
                        isLight ? 'text-[#7d4e2a]' : 'text-[#eedfc2]'
                      }`}
                    >
                      {rank}
                    </span>
                  )}
                  {/* File labels on bottom rank */}
                  {rowIdx === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[10px] sm:text-xs font-serif font-bold leading-none pointer-events-none ${
                        isLight ? 'text-[#7d4e2a]' : 'text-[#eedfc2]'
                      }`}
                    >
                      {file}
                    </span>
                  )}

                  {piece && (
                    <div
                      className={`w-[84%] h-[84%] flex items-center justify-center z-10 pointer-events-none transition-opacity ${
                        isDragOrigin ? 'opacity-30' : ''
                      }`}
                    >
                      <ChessPiece type={piece.type} color={piece.color} />
                    </div>
                  )}

                  {/* Tactile debossed destination dots */}
                  {isLegalDestination && !isCapture && (
                    <div className="absolute z-20 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#1c120a]/35 shadow-inner pointer-events-none" />
                  )}
                  {isLegalDestination && isCapture && (
                    <div className="absolute z-20 inset-0 m-0.5 sm:m-1 rounded-full border-4 sm:border-[5px] border-[#1c120a]/40 pointer-events-none" />
                  )}

                  {badge && badge.square === square && (
                    <div
                      className="absolute -top-0.5 -right-0.5 z-30 min-w-[42%] h-[42%] px-1 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-mono font-black text-white shadow-md border border-white/80 pointer-events-none"
                      style={{ backgroundColor: badge.color }}
                    >
                      {badge.label}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* SVG Overlay for Handcrafted Brass Arrows */}
          {allArrows.length > 0 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" viewBox="0 0 100 100">
              <defs>
                {allArrows.map((a, i) => (
                  <marker key={i} id={`arrowhead-${i}`} markerWidth="4" markerHeight="4" refX="2.2" refY="2" orient="auto">
                    <polygon points="0 0, 4 2, 0 4" fill={a.color || '#d4a359'} />
                  </marker>
                ))}
              </defs>
              {allArrows.map((a, i) => {
                const start = getSquareCoordinates(a.from);
                const end = getSquareCoordinates(a.to);
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const len = Math.hypot(dx, dy) || 1;
                const shrink = 3.2;
                return (
                  <line
                    key={i}
                    x1={start.x}
                    y1={start.y}
                    x2={end.x - (dx / len) * shrink}
                    y2={end.y - (dy / len) * shrink}
                    stroke={a.color || '#d4a359'}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeDasharray={a.dashed ? '3 2.2' : undefined}
                    opacity="0.9"
                    markerEnd={`url(#arrowhead-${i})`}
                  />
                );
              })}
            </svg>
          )}

          {/* Piece following the pointer while dragging */}
          {drag?.moved && draggedPiece && (
            <div
              className="absolute z-40 pointer-events-none drop-shadow-2xl"
              style={{
                width: '12.5%',
                height: '12.5%',
                left: `${drag.x}px`,
                top: `${drag.y}px`,
                transform: 'translate(-50%, -50%) scale(1.12)',
              }}
            >
              <ChessPiece type={draggedPiece.type} color={draggedPiece.color} />
            </div>
          )}

          {/* Promotion Dialog Modal: Handcrafted Wooden Box */}
          {pendingPromotion && (
            <div className="absolute inset-0 bg-wood-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="wood-panel-raised border border-brass/50 rounded-2xl p-5 shadow-wood-raised-lg text-center max-w-xs">
                <h4 className="text-xs font-serif font-bold text-brass mb-3 tracking-widest uppercase">Promote Pawn</h4>
                <div className="grid grid-cols-4 gap-2.5">
                  {(['q', 'n', 'r', 'b'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePromotionSelect(p)}
                      className="w-14 h-14 wood-btn rounded-xl flex items-center justify-center p-2.5 border border-wood-650 hover:border-brass transition"
                    >
                      <ChessPiece type={p} color={game.turn()} />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setPendingPromotion(null);
                    setSelectedSquare(null);
                  }}
                  className="mt-3 text-xs text-wood-400 hover:text-wood-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
