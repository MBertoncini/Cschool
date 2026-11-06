import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { ChessPiece } from './ChessPieces';

interface ChessBoardProps {
  game: Chess;
  onMove?: (move: { from: Square; to: Square; promotion?: string }) => boolean | void;
  orientation?: 'white' | 'black';
  interactive?: boolean;
  highlightSquares?: Square[];
  arrow?: { from: Square; to: Square; color?: string } | null;
  lastMove?: { from: Square; to: Square } | null;
  customSquareStyles?: Record<string, string>;
  disabled?: boolean;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  game,
  onMove,
  orientation = 'white',
  interactive = true,
  highlightSquares = [],
  arrow = null,
  lastMove = null,
  customSquareStyles = {},
  disabled = false,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Re-calculate legal moves when selectedSquare or game changes
  useEffect(() => {
    if (!selectedSquare || disabled || !interactive) {
      setLegalMoves([]);
      return;
    }

    try {
      const moves = game.moves({ square: selectedSquare, verbose: true }) as Move[];
      setLegalMoves(moves);
    } catch {
      setLegalMoves([]);
    }
  }, [selectedSquare, game, disabled, interactive]);

  // Handle square click
  const handleSquareClick = (square: Square) => {
    if (disabled || !interactive) return;

    // If pending promotion is open, ignore clicks
    if (pendingPromotion) return;

    // If a piece is already selected
    if (selectedSquare) {
      // If clicking the same square, deselect
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      // Check if clicking another piece of the same color
      const clickedPiece = game.get(square);
      const selectedPiece = game.get(selectedSquare);

      if (clickedPiece && selectedPiece && clickedPiece.color === selectedPiece.color) {
        setSelectedSquare(square);
        return;
      }

      // Check if this move is legal
      const targetMove = legalMoves.find((m) => m.to === square);

      if (targetMove) {
        // Check for pawn promotion
        const isPromotion =
          selectedPiece?.type === 'p' &&
          ((selectedPiece.color === 'w' && square[1] === '8') ||
            (selectedPiece.color === 'b' && square[1] === '1'));

        if (isPromotion) {
          setPendingPromotion({ from: selectedSquare, to: square });
          return;
        }

        // Execute regular move
        if (onMove) {
          onMove({ from: selectedSquare, to: square });
        }
        setSelectedSquare(null);
        return;
      }

      // If clicked square is not legal and not own piece, deselect
      setSelectedSquare(null);
      return;
    }

    // No piece currently selected: select piece if it belongs to side to move
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
    }
  };

  const handlePromotionSelect = (promotionPiece: 'q' | 'r' | 'b' | 'n') => {
    if (!pendingPromotion) return;
    if (onMove) {
      onMove({
        from: pendingPromotion.from,
        to: pendingPromotion.to,
        promotion: promotionPiece,
      });
    }
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
        if (p && p.type === 'k' && p.color === turn) {
          return p.square as Square;
        }
      }
    }
    return null;
  })();

  // Files and ranks ordering based on orientation
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayedFiles = orientation === 'white' ? files : [...files].reverse();
  const displayedRanks = orientation === 'white' ? ranks : [...ranks].reverse();

  // Helper to calculate square center coordinates for SVG arrows
  const getSquareCoordinates = (square: Square) => {
    const file = square[0];
    const rank = square[1];
    const colIdx = displayedFiles.indexOf(file);
    const rowIdx = displayedRanks.indexOf(rank);

    const x = colIdx * 12.5 + 6.25;
    const y = rowIdx * 12.5 + 6.25;
    return { x, y };
  };

  return (
    <div className="relative select-none w-full max-w-[540px] aspect-square rounded-xl shadow-2xl p-2.5 bg-[#2b2723] border border-[#3f3b35]">
      {/* Chessboard Grid */}
      <div
        ref={boardRef}
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

            // Check if this square is a legal destination for selected piece
            const legalMove = legalMoves.find((m) => m.to === square);
            const isLegalDestination = Boolean(legalMove);
            const isCapture = Boolean(legalMove && (piece || legalMove.flags.includes('e')));

            // Background color classes
            let bgClass = isLight ? 'bg-[#eeeed2]' : 'bg-[#769656]';
            if (isLastMove) {
              bgClass = isLight ? 'bg-[#f7ec7d]' : 'bg-[#baca44]';
            }
            if (isSelected) {
              bgClass = 'bg-[#bbd871]';
            }
            if (isCheck) {
              bgClass = 'bg-rose-600/90 animate-pulse';
            }

            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors duration-100 ${bgClass} ${
                  customSquareStyles[square] || ''
                }`}
              >
                {/* External Highlight pulse for lesson guidance */}
                {isHighlighted && !isSelected && (
                  <div className="absolute inset-0 bg-yellow-400/35 ring-4 ring-yellow-400 ring-inset z-10 animate-pulse pointer-events-none rounded-sm" />
                )}

                {/* Coordinate labels on border squares */}
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

                {/* The Piece */}
                {piece && (
                  <div className="w-[84%] h-[84%] flex items-center justify-center z-10 transform transition-transform duration-75 hover:scale-105 active:scale-95">
                    <ChessPiece type={piece.type} color={piece.color} />
                  </div>
                )}

                {/* Legal Move Indicators */}
                {isLegalDestination && !isCapture && (
                  <div className="absolute z-20 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-black/25 pointer-events-none" />
                )}
                {isLegalDestination && isCapture && (
                  <div className="absolute z-20 inset-0 m-0.5 sm:m-1 rounded-full border-4 sm:border-[5px] border-black/30 pointer-events-none" />
                )}
              </div>
            );
          })
        )}

        {/* SVG Overlay for Arrows (Threats, Lessons, GM Plans) */}
        {arrow && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-30"
            viewBox="0 0 100 100"
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="6"
                markerHeight="6"
                refX="4"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 6 3, 0 6"
                  fill={arrow.color || '#f59e0b'}
                />
              </marker>
            </defs>
            {(() => {
              const start = getSquareCoordinates(arrow.from);
              const end = getSquareCoordinates(arrow.to);
              return (
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={arrow.color || '#f59e0b'}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  opacity="0.88"
                  markerEnd="url(#arrowhead)"
                />
              );
            })()}
          </svg>
        )}

        {/* Promotion Dialog Modal */}
        {pendingPromotion && (
          <div className="absolute inset-0 bg-black/75 z-40 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#262421] border border-amber-600/40 rounded-xl p-4 shadow-2xl text-center max-w-xs">
              <h4 className="text-sm font-semibold text-amber-300 mb-3 tracking-wide uppercase">
                Promote Pawn to:
              </h4>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
