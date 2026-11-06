// Detects named tactical/strategic patterns created by a single move.
import { Chess, Color, Move, PieceSymbol, Square } from 'chess.js';
import { MotifInfo } from '../types/chess';

export const PIECE_VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
export const PIECE_NAME: Record<PieceSymbol, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const other = (c: Color): Color => (c === 'w' ? 'b' : 'w');

const ALL_SQUARES: Square[] = (() => {
  const out: Square[] = [];
  for (const r of '87654321') for (const f of 'abcdefgh') out.push(`${f}${r}` as Square);
  return out;
})();

function sq(file: number, rank: number): Square | null {
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return `${'abcdefgh'[file]}${rank + 1}` as Square;
}
function coords(s: Square): [number, number] {
  return ['abcdefgh'.indexOf(s[0]), Number(s[1]) - 1];
}

export function findKing(g: Chess, color: Color): Square | null {
  for (const s of ALL_SQUARES) {
    const p = g.get(s);
    if (p && p.type === 'k' && p.color === color) return s;
  }
  return null;
}

/** Squares of `color` pieces attacking `target` (chess.js handles x-ray-free attacks). */
function attackersOf(g: Chess, target: Square, color: Color): Square[] {
  try {
    return g.attackers(target, color);
  } catch {
    return [];
  }
}

/** Enemy pieces attacked by the piece standing on `from`. */
function attackedBy(g: Chess, from: Square): { square: Square; type: PieceSymbol }[] {
  const me = g.get(from);
  if (!me) return [];
  const out: { square: Square; type: PieceSymbol }[] = [];
  for (const s of ALL_SQUARES) {
    const p = g.get(s);
    if (!p || p.color === me.color) continue;
    if (attackersOf(g, s, me.color).includes(from)) out.push({ square: s, type: p.type });
  }
  return out;
}

export function materialOf(g: Chess, color: Color): number {
  let total = 0;
  for (const s of ALL_SQUARES) {
    const p = g.get(s);
    if (p && p.color === color && p.type !== 'k') total += PIECE_VALUE[p.type];
  }
  return total;
}

/** Is the piece on `s` loose: attacked and either undefended or attacked by something cheaper? */
export function isEnPrise(g: Chess, s: Square): boolean {
  const p = g.get(s);
  if (!p || p.type === 'k') return false;
  const attackers = attackersOf(g, s, other(p.color));
  if (attackers.length === 0) return false;
  const defenders = attackersOf(g, s, p.color);
  if (defenders.length === 0) return true;
  const cheapest = Math.min(...attackers.map((a) => PIECE_VALUE[g.get(a)!.type]));
  return cheapest < PIECE_VALUE[p.type];
}

const ROOK_DIRS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const BISHOP_DIRS: [number, number][] = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

function lineDirs(t: PieceSymbol): [number, number][] {
  if (t === 'r') return ROOK_DIRS;
  if (t === 'b') return BISHOP_DIRS;
  if (t === 'q') return [...ROOK_DIRS, ...BISHOP_DIRS];
  return [];
}

/** Pins and skewers along the lines of the line-piece on `from`. */
function linesThrough(g: Chess, from: Square): MotifInfo[] {
  const me = g.get(from);
  if (!me) return [];
  const out: MotifInfo[] = [];
  const [f0, r0] = coords(from);
  for (const [df, dr] of lineDirs(me.type)) {
    let first: { s: Square; t: PieceSymbol; c: Color } | null = null;
    for (let k = 1; k < 8; k++) {
      const s = sq(f0 + df * k, r0 + dr * k);
      if (!s) break;
      const p = g.get(s);
      if (!p) continue;
      if (!first) {
        if (p.color === me.color) break;
        first = { s, t: p.type, c: p.color };
        continue;
      }
      if (p.color === me.color) break;
      const frontVal = PIECE_VALUE[first.t];
      const backVal = PIECE_VALUE[p.type];
      const mover = `${cap(PIECE_NAME[me.type])} on ${from}`;
      if (p.type === 'k' && first.t !== 'k') {
        out.push({
          name: 'Absolute Pin',
          detail: `The ${mover} pins the ${PIECE_NAME[first.t]} on ${first.s} to the king — it is illegal for it to move.`,
        });
      } else if (backVal > frontVal && (first.t !== 'p' || backVal >= 5)) {
        out.push({
          name: 'Pin',
          detail: `The ${mover} pins the ${PIECE_NAME[first.t]} on ${first.s} to the ${PIECE_NAME[p.type]} on ${s}: if it moves, the ${PIECE_NAME[p.type]} is lost.`,
        });
      } else if (frontVal > backVal && (first.t === 'k' || first.t === 'q' || frontVal - backVal >= 2) && p.type !== 'p') {
        out.push({
          name: 'Skewer',
          detail: `The ${mover} skewers the ${PIECE_NAME[first.t]} on ${first.s}: once it steps aside, the ${PIECE_NAME[p.type]} on ${s} behind it falls.`,
        });
      }
      break;
    }
  }
  return out;
}

function nullMoveFen(fen: string): string | null {
  const parts = fen.split(' ');
  parts[1] = parts[1] === 'w' ? 'b' : 'w';
  parts[3] = '-';
  return parts.join(' ');
}

/** Moves for `color` that would mate immediately if it were their turn (threat detection). */
function mateThreats(g: Chess): string[] {
  const fen = nullMoveFen(g.fen());
  if (!fen) return [];
  let h: Chess;
  try {
    h = new Chess(fen);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const m of h.moves({ verbose: true }) as Move[]) {
    h.move(m);
    if (h.isCheckmate()) out.push(m.san);
    h.undo();
    if (out.length) break;
  }
  return out;
}

/** All recognised patterns for playing `uci` (or SAN) from `fenBefore`. */
export function detectMotifs(fenBefore: string, moveStr: string): MotifInfo[] {
  const before = new Chess(fenBefore);
  let move: Move;
  try {
    move =
      /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(moveStr)
        ? before.move({ from: moveStr.slice(0, 2) as Square, to: moveStr.slice(2, 4) as Square, promotion: moveStr[4] })
        : before.move(moveStr);
  } catch {
    return [];
  }
  const after = new Chess(before.fen());
  before.undo();

  const me = move.color;
  const opp = other(me);
  const out: MotifInfo[] = [];
  const pieceName = PIECE_NAME[move.piece];

  // ── Checkmates ──
  if (after.isCheckmate()) {
    const ksq = findKing(after, opp)!;
    const [kf, kr] = coords(ksq);
    const neighbours: Square[] = [];
    for (let df = -1; df <= 1; df++)
      for (let dr = -1; dr <= 1; dr++) {
        if (!df && !dr) continue;
        const s = sq(kf + df, kr + dr);
        if (s) neighbours.push(s);
      }
    const ownBlocked = neighbours.every((s) => {
      const p = after.get(s);
      return p && p.color === opp;
    });
    const backRank = opp === 'w' ? 0 : 7;
    if (move.piece === 'n' && ownBlocked) {
      out.push({ name: 'Smothered Mate', detail: `The knight mates a king that is trapped by its own pieces — nothing can escape or block a knight check.` });
    } else if ((move.piece === 'r' || move.piece === 'q') && kr === backRank && move.to[1] === ksq[1]) {
      out.push({ name: 'Back-Rank Mate', detail: `The ${pieceName} delivers mate along the back rank: the king is walled in by its own pawns.` });
    } else if (move.piece === 'q' && (move.to === 'f7' || move.to === 'f2') && after.moveNumber() <= 6) {
      out.push({ name: "Scholar's Mate", detail: 'The queen, supported by the bishop, mates on the weak f7/f2 square.' });
    } else {
      out.push({ name: 'Checkmate', detail: `${move.san} is checkmate — the king has no legal move.` });
    }
    return out;
  }

  // ── Checks: double / discovered ──
  if (after.inCheck()) {
    const ksq = findKing(after, opp)!;
    const checkers = attackersOf(after, ksq, me);
    if (checkers.length >= 2) {
      out.push({ name: 'Double Check', detail: 'Two pieces give check at once — the only defence is to move the king.' });
    } else if (checkers.length === 1 && checkers[0] !== move.to && !move.flags.includes('k') && !move.flags.includes('q')) {
      const cp = after.get(checkers[0])!;
      out.push({
        name: 'Discovered Check',
        detail: `Moving the ${pieceName} uncovers a check from the ${PIECE_NAME[cp.type]} on ${checkers[0]}.`,
      });
    }
  }

  // ── Fork ──
  const targets = attackedBy(after, move.to).filter(({ square, type }) => {
    if (type === 'k') return true;
    if (type === 'p') return false;
    return PIECE_VALUE[type] > PIECE_VALUE[move.piece] || attackersOf(after, square, opp).length === 0;
  });
  const moverSafe = !isEnPrise(after, move.to) || after.inCheck();
  if (targets.length >= 2 && moverSafe) {
    const types = targets.map((t) => t.type);
    let name = `${cap(pieceName)} Fork`;
    if (move.piece === 'n' && types.includes('k') && types.includes('q')) name = types.includes('r') ? 'Family Fork' : 'Royal Fork';
    out.push({
      name,
      detail: `The ${pieceName} on ${move.to} attacks ${targets.map((t) => `the ${PIECE_NAME[t.type]} on ${t.square}`).join(' and ')} at the same time.`,
    });
  }

  // ── Pins & skewers created by the moved piece ──
  if (['b', 'r', 'q'].includes(move.piece)) out.push(...linesThrough(after, move.to));

  // ── Discovered attack: another line-piece of ours now hits something valuable ──
  for (const s of ALL_SQUARES) {
    if (s === move.to) continue;
    const p = after.get(s);
    if (!p || p.color !== me || !['b', 'r', 'q'].includes(p.type)) continue;
    const nowHits = attackedBy(after, s).filter(
      (t) => t.type !== 'k' && t.type !== 'p' && (PIECE_VALUE[t.type] > PIECE_VALUE[p.type] || attackersOf(after, t.square, opp).length === 0)
    );
    const before_ = attackedBy(before, s).map((t) => t.square);
    const fresh = nowHits.filter((t) => !before_.includes(t.square));
    if (fresh.length && !out.some((m) => m.name === 'Discovered Check')) {
      out.push({
        name: 'Discovered Attack',
        detail: `Moving the ${pieceName} opens the line of the ${PIECE_NAME[p.type]} on ${s}, which now attacks the ${PIECE_NAME[fresh[0].type]} on ${fresh[0].square}.`,
      });
      break;
    }
  }

  // ── Captures ──
  if (move.captured) {
    const capturedSquare = move.flags.includes('e') ? (`${move.to[0]}${move.from[1]}` as Square) : move.to;
    const defenders = attackersOf(before, capturedSquare, opp);
    if (defenders.length === 0 && move.captured !== 'p') {
      out.push({ name: 'Hanging Piece', detail: `The ${PIECE_NAME[move.captured]} on ${capturedSquare} was undefended — free material.` });
    }
    // Removing the defender: the captured piece was the only guard of another attacked piece
    const guarded = ALL_SQUARES.filter((s) => {
      const p = before.get(s);
      return (
        p &&
        p.color === opp &&
        p.type !== 'k' &&
        PIECE_VALUE[p.type] >= 3 &&
        s !== capturedSquare &&
        attackersOf(before, s, opp).includes(capturedSquare)
      );
    });
    for (const s of guarded) {
      if (attackersOf(after, s, opp).length === 0 && attackersOf(after, s, me).length > 0) {
        out.push({
          name: 'Removing the Defender',
          detail: `Capturing on ${capturedSquare} removes the only defender of the ${PIECE_NAME[after.get(s)!.type]} on ${s}.`,
        });
        break;
      }
    }
  }

  // ── Special moves ──
  if (move.flags.includes('e')) out.push({ name: 'En Passant', detail: 'The pawn captures "in passing" a pawn that just made a two-square jump.' });
  if (move.promotion) {
    out.push(
      move.promotion === 'q'
        ? { name: 'Promotion', detail: 'The pawn reaches the last rank and becomes a queen.' }
        : { name: 'Underpromotion', detail: `The pawn becomes a ${PIECE_NAME[move.promotion]} instead of a queen — usually to avoid stalemate or to give a key check.` }
    );
  }
  if (move.flags.includes('k') || move.flags.includes('q')) {
    out.push({
      name: move.flags.includes('k') ? 'Kingside Castling' : 'Queenside Castling',
      detail: 'The king steps to safety behind its pawns and the rook joins the game.',
    });
  }

  // ── Mate threat ──
  if (!after.inCheck()) {
    const threats = mateThreats(after);
    if (threats.length) out.push({ name: 'Mate Threat', detail: `Threatens ${threats[0]} with checkmate next move.` });
  }

  return out;
}

/** Pieces of `color` that are hanging (en prise) in this position. */
export function hangingPieces(g: Chess, color: Color): { square: Square; type: PieceSymbol }[] {
  const out: { square: Square; type: PieceSymbol }[] = [];
  for (const s of ALL_SQUARES) {
    const p = g.get(s);
    if (p && p.color === color && p.type !== 'p' && p.type !== 'k' && isEnPrise(g, s)) out.push({ square: s, type: p.type });
  }
  return out;
}
