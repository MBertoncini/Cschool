import { Chess, Move, Square } from 'chess.js';

// Piece baseline values
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square Tables (White perspective, flipped for Black)
const PAWN_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_PST = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_PST = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const ROOK_PST = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_PST = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_MID_PST = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
];

export function evaluatePosition(game: Chess): number {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -99999 : 99999;
  }
  if (game.isDraw()) {
    return 0;
  }

  let score = 0;
  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const pieceVal = PIECE_VALUES[piece.type] || 0;
      let posVal = 0;
      const index = piece.color === 'w' ? r * 8 + c : (7 - r) * 8 + c;

      switch (piece.type) {
        case 'p':
          posVal = PAWN_PST[index];
          break;
        case 'n':
          posVal = KNIGHT_PST[index];
          break;
        case 'b':
          posVal = BISHOP_PST[index];
          break;
        case 'r':
          posVal = ROOK_PST[index];
          break;
        case 'q':
          posVal = QUEEN_PST[index];
          break;
        case 'k':
          posVal = KING_MID_PST[index];
          break;
      }

      const totalVal = pieceVal + posVal;
      score += piece.color === 'w' ? totalVal : -totalVal;
    }
  }

  return score;
}

// Convert score to -10 to +10 range for visual Eval Bar
export function getEvalBarScore(game: Chess): number {
  const score = evaluatePosition(game);
  if (score > 10000) return 10;
  if (score < -10000) return -10;
  // Convert centipawns to pawns
  const pawns = score / 100;
  return Math.max(-10, Math.min(10, Number(pawns.toFixed(1))));
}

// Order moves to optimize alpha-beta pruning (captures and checks first)
function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (a.captured) {
      scoreA += (PIECE_VALUES[a.captured] || 0) * 10 - (PIECE_VALUES[a.piece] || 0);
    }
    if (b.captured) {
      scoreB += (PIECE_VALUES[b.captured] || 0) * 10 - (PIECE_VALUES[b.piece] || 0);
    }
    if (a.flags.includes('p')) scoreA += 800; // Promotion
    if (b.flags.includes('p')) scoreB += 800;

    return scoreB - scoreA;
  });
}

// Minimax with Alpha-Beta Pruning
function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || game.isGameOver()) {
    return evaluatePosition(game);
  }

  const rawMoves = game.moves({ verbose: true }) as Move[];
  const moves = orderMoves(rawMoves);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break; // Beta cutoff
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break; // Alpha cutoff
    }
    return minEval;
  }
}

export interface BestMoveResult {
  from: Square;
  to: Square;
  promotion?: string;
  evaluation: number;
  explanation: string;
}

// Find best move for the current bot level
export function findBotMove(
  game: Chess,
  depth: number = 3,
  blunderRate: number = 0.0
): BestMoveResult | null {
  const rawMoves = game.moves({ verbose: true }) as Move[];
  if (movesRemaining(rawMoves) === 0) return null;

  // Bot blunders on purpose based on blunderRate
  if (Math.random() < blunderRate && rawMoves.length > 1) {
    // Pick a random legal move, or sub-optimal move
    const randomMove = rawMoves[Math.floor(Math.random() * rawMoves.length)];
    return {
      from: randomMove.from,
      to: randomMove.to,
      promotion: randomMove.promotion,
      evaluation: 0,
      explanation: 'Plays casually without deep calculation.',
    };
  }

  const isWhite = game.turn() === 'w';
  const moves = orderMoves(rawMoves);

  let bestMove: Move = moves[0];
  let bestScore = isWhite ? -Infinity : Infinity;

  // Effective search depth
  const searchDepth = Math.max(1, depth);

  for (const move of moves) {
    game.move(move);
    const score = minimax(
      game,
      searchDepth - 1,
      -Infinity,
      Infinity,
      !isWhite
    );
    game.undo();

    if (isWhite) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  // Generate educational explanation for this move
  const explanation = explainMove(game, bestMove);

  return {
    from: bestMove.from,
    to: bestMove.to,
    promotion: bestMove.promotion,
    evaluation: bestScore,
    explanation,
  };
}

function movesRemaining(moves: Move[]): number {
  return moves.length;
}

// Generates educational explanation for any move (used for Coach Hint button)
export function explainMove(game: Chess, move: Move): string {
  const pieceNames: Record<string, string> = {
    p: 'pawn',
    n: 'knight',
    b: 'bishop',
    r: 'rook',
    q: 'queen',
    k: 'king',
  };

  const pieceName = pieceNames[move.piece] || 'piece';

  // Checkmate
  game.move(move);
  const isMate = game.isCheckmate();
  const isCheck = game.inCheck();
  game.undo();

  if (isMate) {
    return `Delivers checkmate! The opposing king has no escape squares.`;
  }

  if (move.captured) {
    const capturedName = pieceNames[move.captured] || 'piece';
    if (isCheck) {
      return `Captures the ${capturedName} on ${move.to} with check, winning material and forcing a response!`;
    }
    return `Wins the ${capturedName} on ${move.to}, increasing material advantage.`;
  }

  if (move.flags.includes('k') || move.flags.includes('q')) {
    return `Castles to safety! Protects the king behind a pawn shield and connects the rooks.`;
  }

  if (isCheck) {
    return `Moves ${pieceName} to ${move.to} to deliver check, putting immense pressure on the king!`;
  }

  // Pawn center moves
  if (move.piece === 'p' && (move.to === 'd4' || move.to === 'e4' || move.to === 'd5' || move.to === 'e5')) {
    return `Controls key central squares with the pawn, gaining valuable territory and space.`;
  }

  // Knight development
  if (move.piece === 'n' && (move.to === 'f3' || move.to === 'c3' || move.to === 'f6' || move.to === 'c6')) {
    return `Develops the knight toward the center, eyeing key outpost squares.`;
  }

  // Bishop development
  if (move.piece === 'b') {
    return `Develops the bishop along an active diagonal to control lines across the board.`;
  }

  // Rook moves to open/semi-open files
  if (move.piece === 'r' && (move.to[0] === 'd' || move.to[0] === 'e' || move.to[0] === 'c')) {
    return `Places the rook on an active central file to support upcoming breakthroughs.`;
  }

  return `Improves piece activity on ${move.to} while maintaining solid structure.`;
}
