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
    <div className="relative select-none w-full max-w-[540px] aspect-square rounded-xl shadow-2xl p-2.5 bg-[#2b2723] border border-[#3f3b35]">
      {/* Chessboard Grid */}
      <div
        ref={boardRef}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => finishDrag(e)}
        onPointerCancel={(e) => finishDrag(e, true)}
        style={{ touchAction: canInteract ? 'none' : undefined }}
        className="relative w-full h-full grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden border border-black/30 shadow-inner"
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

            let bgClass = isLight ? 'bg-[#eeeed2]' : 'bg-[#769656]';
            if (isLastMove) bgClass = isLight ? 'bg-[#f7ec7d]' : 'bg-[#baca44]';
            if (isSelected) bgClass = 'bg-[#bbd871]';
            if (isCheck) bgClass = 'bg-rose-600/90 animate-pulse';

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
                  <div className="absolute inset-0 bg-yellow-400/35 ring-4 ring-yellow-400 ring-inset z-10 animate-pulse pointer-events-none rounded-sm" />
                )}
                {isDropTarget && (
                  <div className="absolute inset-0 ring-4 ring-inset ring-white/70 z-10 pointer-events-none" />
                )}

                {colIdx === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 text-[10px] sm:text-xs font-bold leading-none pointer-events-none ${
                      isLight ? 'text-[#769656]' : 'text-[#eeeed2]'
                    }`}
                  >
                    {rank}
                  </span>
                )}
                {rowIdx === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[10px] sm:text-xs font-bold leading-none pointer-events-none ${
                      isLight ? 'text-[#769656]' : 'text-[#eeeed2]'
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

                {isLegalDestination && !isCapture && (
                  <div className="absolute z-20 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-black/25 pointer-events-none" />
                )}
                {isLegalDestination && isCapture && (
                  <div className="absolute z-20 inset-0 m-0.5 sm:m-1 rounded-full border-4 sm:border-[5px] border-black/30 pointer-events-none" />
                )}

                {badge && badge.square === square && (
                  <div
                    className="absolute -top-0.5 -right-0.5 z-30 min-w-[42%] h-[42%] px-0.5 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black text-white shadow-lg border-2 border-white/90 pointer-events-none"
                    style={{ backgroundColor: badge.color }}
                  >
                    {badge.label}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* SVG Overlay for Arrows */}
        {allArrows.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" viewBox="0 0 100 100">
            <defs>
              {allArrows.map((a, i) => (
                <marker key={i} id={`arrowhead-${i}`} markerWidth="4" markerHeight="4" refX="2.2" refY="2" orient="auto">
                  <polygon points="0 0, 4 2, 0 4" fill={a.color || '#f59e0b'} />
                </marker>
              ))}
            </defs>
            {allArrows.map((a, i) => {
              const start = getSquareCoordinates(a.from);
              const end = getSquareCoordinates(a.to);
              // Shorten the line a bit so the head sits inside the target square
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
                  stroke={a.color || '#f59e0b'}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeDasharray={a.dashed ? '3 2.2' : undefined}
                  opacity="0.85"
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

        {/* Promotion Dialog Modal */}
        {pendingPromotion && (
          <div className="absolute inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#262421] border border-amber-600/40 rounded-xl p-4 shadow-2xl text-center max-w-xs">
              <h4 className="text-sm font-semibold text-amber-300 mb-3 tracking-wide uppercase">Promote Pawn to:</h4>
              <div className="grid grid-cols-4 gap-2">
                {(['q', 'n', 'r', 'b'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePromotionSelect(p)}
                    className="w-14 h-14 bg-[#34312d] hover:bg-[#4a4640] border border-stone-600 rounded-lg flex items-center justify-center p-2 transition hover:scale-110 active:scale-95 shadow"
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
                className="mt-3 text-xs text-stone-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
