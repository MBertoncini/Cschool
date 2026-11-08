// Full-game analysis: runs Stockfish on every position, classifies each move and
// produces the coach's explanations (why it was good/bad, what was better, named patterns).
import { Chess, Color, Move, Square } from 'chess.js';
import { EngineLine, EngineScore, GameAnalysis, MotifInfo, MoveClass, PlyAnalysis } from '../types/chess';
import { getEngine, RawLine } from './stockfish';
import { detectMotifs, hangingPieces, isEnPrise, materialOf, PIECE_NAME, PIECE_VALUE } from './motifs';
import { detectOpening, lookupBook } from './openingBook';
import { explainMove } from './botEngine';

export const ANALYSIS_VERSION = 1;
const PV_PLIES = 10;
export const MATED_CP = 100000;

// ─── Move classes ──────────────────────────────────────────────────────────

export const MOVE_CLASS_INFO: Record<MoveClass, { label: string; symbol: string; color: string; text: string }> = {
  genial: { label: 'Genial', symbol: '!!', color: '#1baca6', text: 'text-teal-300' },
  super: { label: 'Super good', symbol: '!', color: '#5c8bb0', text: 'text-sky-300' },
  good: { label: 'Good', symbol: '✓', color: '#81b64c', text: 'text-lime-300' },
  book: { label: 'Book', symbol: 'BK', color: '#a88865', text: 'text-amber-200' },
  bad: { label: 'Bad', symbol: '?', color: '#e6912c', text: 'text-orange-300' },
  blunder: { label: 'Blunder', symbol: '??', color: '#ca3431', text: 'text-rose-400' },
};

export const MOVE_CLASS_ORDER: MoveClass[] = ['genial', 'super', 'good', 'book', 'bad', 'blunder'];

// ─── Score helpers ─────────────────────────────────────────────────────────

/** Winning chances 0..100 for White (Lichess model). */
export function winPercent(s: EngineScore): number {
  if (s.mate !== undefined) return s.mate > 0 ? 100 : s.mate < 0 ? 0 : 50;
  const cp = Math.max(-1500, Math.min(1500, s.cp ?? 0));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

export function formatScore(s: EngineScore | undefined): string {
  if (!s) return '…';
  if (s.mate !== undefined) return s.mate === 0 ? '#' : `${s.mate > 0 ? '' : '-'}M${Math.abs(s.mate)}`;
  if (Math.abs(s.cp ?? 0) >= MATED_CP) return (s.cp ?? 0) > 0 ? '1-0' : '0-1';
  const v = (s.cp ?? 0) / 100;
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}`;
}

/** Score in pawns clamped to ±10 for the eval bar. */
export function barScore(s: EngineScore | undefined): number {
  if (!s) return 0;
  if (s.mate !== undefined) return s.mate > 0 ? 10 : s.mate < 0 ? -10 : 0;
  return Math.max(-10, Math.min(10, (s.cp ?? 0) / 100));
}

const povWin = (s: EngineScore, c: Color) => (c === 'w' ? winPercent(s) : 100 - winPercent(s));

function moveAccuracy(winLoss: number): number {
  return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * winLoss) - 3.1669));
}

// ─── Engine plumbing ───────────────────────────────────────────────────────

function uciToSanLine(fen: string, uci: string[], max = PV_PLIES): string[] {
  const g = new Chess(fen);
  const out: string[] = [];
  for (const u of uci.slice(0, max)) {
    try {
      const m = g.move({ from: u.slice(0, 2) as Square, to: u.slice(2, 4) as Square, promotion: u[4] });
      out.push(m.san);
    } catch {
      break;
    }
  }
  return out;
}

export function rawToLine(fen: string, raw: RawLine, stm: Color): EngineLine {
  const flip = stm === 'b' ? -1 : 1;
  const score: EngineScore = raw.mate !== undefined ? { mate: raw.mate * flip } : { cp: (raw.cp ?? 0) * flip };
  return { score, san: uciToSanLine(fen, raw.pv) };
}

interface PositionEval {
  fen: string;
  lines: EngineLine[];
  bestUci: string | null;
}

async function evaluatePosition(fen: string, depth: number, multiPv: number): Promise<PositionEval> {
  const g = new Chess(fen);
  // Final checkmate: encoded as a huge centipawn score for the winner (mate "in 0" has no sign)
  if (g.isCheckmate()) return { fen, lines: [{ score: { cp: g.turn() === 'w' ? -MATED_CP : MATED_CP }, san: [] }], bestUci: null };
  if (g.isDraw() || g.isStalemate()) return { fen, lines: [{ score: { cp: 0 }, san: [] }], bestUci: null };
  const res = await getEngine('batch').analyze(fen, { depth, multiPv });
  const lines = res.lines.filter((l) => l.pv.length).map((l) => rawToLine(fen, l, g.turn()));
  return { fen, lines: lines.length ? lines : [{ score: { cp: 0 }, san: [] }], bestUci: res.bestmove };
}

function sanToUci(fen: string, san: string): string {
  try {
    const m = new Chess(fen).move(san);
    return m.from + m.to + (m.promotion ?? '');
  } catch {
    return '';
  }
}

// ─── Classification ────────────────────────────────────────────────────────

/** Did the move leave the moved piece (or more) en prise for nothing, while still being the best? */
function isSacrifice(fenBefore: string, uci: string): boolean {
  const g = new Chess(fenBefore);
  let m: Move;
  try {
    m = g.move({ from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square, promotion: uci[4] });
  } catch {
    return false;
  }
  if (g.isCheckmate()) return false;
  const movedVal = PIECE_VALUE[m.promotion ?? m.piece];
  const gained = m.captured ? PIECE_VALUE[m.captured] : 0;
  if (m.piece !== 'k' && movedVal - gained >= 2 && isEnPrise(g, m.to)) return true;
  // Or the move left another piece hanging (e.g. ignoring an attack on the queen to go for mate)
  const loose = hangingPieces(g, m.color).filter((h) => h.square !== m.to);
  return loose.some((h) => PIECE_VALUE[h.type] - gained >= 3);
}

function classify(params: {
  fenBefore: string;
  uci: string;
  bestUci: string;
  color: Color;
  before: PositionEval;
  after: PositionEval;
  isBook: boolean;
}): { cls: MoveClass; winLoss: number } {
  const { fenBefore, uci, bestUci, color, before, after, isBook } = params;
  const bestScore = before.lines[0].score;
  const playedScore = after.lines[0].score;
  const playedIsBest = uci === bestUci;
  const wBefore = povWin(bestScore, color);
  const wAfter = povWin(playedScore, color);
  const winLoss = playedIsBest ? 0 : Math.max(0, wBefore - wAfter);

  if (isBook && winLoss < 6) return { cls: 'book', winLoss };

  let cls: MoveClass;
  if (winLoss <= 2) cls = 'super';
  else if (winLoss <= 6) cls = 'good';
  else if (winLoss <= 15) cls = 'bad';
  else cls = 'blunder';

  // Missing a short forced mate is never "super good"
  const mover = color === 'w' ? 1 : -1;
  const hadMate = bestScore.mate !== undefined && bestScore.mate * mover > 0;
  const keepsMate = playedScore.mate !== undefined && playedScore.mate * mover > 0;
  if (hadMate && !keepsMate && cls === 'super') cls = Math.abs(bestScore.mate!) <= 3 ? 'bad' : 'good';

  // Walking into a forced mate that wasn't there before
  const allowsMate = playedScore.mate !== undefined && playedScore.mate * mover < 0;
  const wasMated = bestScore.mate !== undefined && bestScore.mate * mover < 0;
  if (allowsMate && !wasMated) cls = 'blunder';

  // Genial: best move that is a real sacrifice, or the only move that keeps the result
  if (cls === 'super' && (playedIsBest || winLoss < 1) && wAfter > 30) {
    const second = before.lines[1];
    const onlyMove = second && povWin(second.score, color) < wAfter - 20 && wBefore < 97;
    if ((isSacrifice(fenBefore, uci) && wBefore < 97) || onlyMove) cls = 'genial';
  }
  return { cls, winLoss };
}

// ─── Full-game analysis ────────────────────────────────────────────────────

export interface AnalysisProgress {
  done: number;
  total: number;
  partial: PlyAnalysis[];
}

export async function analyzeGame(
  moves: string[],
  opts: { depth?: number; onProgress?: (p: AnalysisProgress) => void; isCancelled?: () => boolean } = {}
): Promise<GameAnalysis> {
  const depth = opts.depth ?? 14;
  const g = new Chess();
  const fens = [g.fen()];
  const verbose: Move[] = [];
  for (const san of moves) {
    verbose.push(g.move(san));
    fens.push(g.fen());
  }

  getEngine('batch').newGame();
  const evals: PositionEval[] = [];
  const plies: PlyAnalysis[] = [];
  const total = fens.length;

  for (let i = 0; i < fens.length; i++) {
    if (opts.isCancelled?.()) throw new Error('cancelled');
    evals.push(await evaluatePosition(fens[i], depth, 3));
    if (i > 0) {
      plies.push(buildPly(i, verbose[i - 1], evals[i - 1], evals[i]));
    }
    opts.onProgress?.({ done: i + 1, total, partial: [...plies] });
  }

  const acc = (c: Color) => {
    const mine = plies.filter((p) => p.color === c);
    if (!mine.length) return 0;
    return Math.round((mine.reduce((s, p) => s + p.accuracy, 0) / mine.length) * 10) / 10;
  };

  return {
    version: ANALYSIS_VERSION,
    depth,
    analyzedAt: new Date().toISOString(),
    plies,
    accuracy: { w: acc('w'), b: acc('b') },
    opening: detectOpening(moves)?.name,
  };
}

function buildPly(ply: number, mv: Move, before: PositionEval, after: PositionEval): PlyAnalysis {
  const uci = mv.from + mv.to + (mv.promotion ?? '');
  const bestSan = before.lines[0].san[0] ?? mv.san;
  const bestUci = before.bestUci ?? sanToUci(before.fen, bestSan);
  const isBook = Boolean(lookupBook(after.fen)) && ply <= 30;
  const { cls, winLoss } = classify({
    fenBefore: before.fen,
    uci,
    bestUci,
    color: mv.color,
    before,
    after,
    isBook,
  });
  return {
    ply,
    san: mv.san,
    uci,
    color: mv.color,
    evalBefore: before.lines[0].score,
    evalAfter: after.lines[0].score,
    bestSan,
    bestUci,
    lines: before.lines.slice(0, 3),
    reply: after.lines[0]?.san.length ? after.lines[0] : null,
    classification: cls,
    winLoss: Math.round(winLoss * 10) / 10,
    accuracy: Math.round(moveAccuracy(winLoss) * 10) / 10,
  };
}

// ─── Coach ─────────────────────────────────────────────────────────────────

export interface CoachNotes {
  headline: string;
  paragraphs: string[];
  motifs: MotifInfo[]; // created by the played move
  bestMotifs: MotifInfo[]; // the better move's patterns (only when different from played)
  threats: MotifInfo[]; // what the opponent's reply exploits
  opening?: string;
}

function lineAfter(fen: string, sans: string[], plies: number): { g: Chess; played: string[] } {
  const g = new Chess(fen);
  const played: string[] = [];
  for (const s of sans.slice(0, plies)) {
    try {
      g.move(s);
      played.push(s);
    } catch {
      break;
    }
  }
  return { g, played };
}

/** Material swing for `color` along a line (positive = color gains). */
function materialSwing(fen: string, sans: string[], color: Color, plies = 8): number {
  const start = new Chess(fen);
  const opp: Color = color === 'w' ? 'b' : 'w';
  const base = materialOf(start, color) - materialOf(start, opp);
  // Stop at an even number of plies after our move when possible, so recaptures are counted
  const { g } = lineAfter(fen, sans, plies);
  return materialOf(g, color) - materialOf(g, opp) - base;
}

export function formatLine(fenStart: string, sans: string[], max = 8): string {
  const g = new Chess(fenStart);
  let moveNo = g.moveNumber();
  let turn = g.turn();
  const parts: string[] = [];
  sans.slice(0, max).forEach((s, i) => {
    if (turn === 'w') parts.push(`${moveNo}.${s}`);
    else parts.push(i === 0 ? `${moveNo}...${s}` : s);
    if (turn === 'b') moveNo++;
    turn = turn === 'w' ? 'b' : 'w';
  });
  return parts.join(' ');
}

const pts = (n: number) => `${n} point${Math.abs(n) === 1 ? '' : 's'}`;

function describeScoreForMover(s: EngineScore, c: Color): string {
  const w = povWin(s, c);
  if (s.mate !== undefined) {
    const mine = (s.mate > 0) === (c === 'w');
    return mine ? `a forced mate in ${Math.abs(s.mate)}` : `getting mated in ${Math.abs(s.mate)}`;
  }
  if (w >= 90) return 'a winning position';
  if (w >= 70) return 'a clear advantage';
  if (w >= 57) return 'a slight edge';
  if (w > 43) return 'roughly equal chances';
  if (w > 30) return 'a slightly worse position';
  if (w > 10) return 'a clearly worse position';
  return 'a losing position';
}

export function coachNotes(p: PlyAnalysis, fenBefore: string, fenAfter: string): CoachNotes {
  const color = p.color;
  const motifs = detectMotifs(fenBefore, p.uci);
  const isBest = p.uci === p.bestUci;
  const bestMotifs = isBest ? [] : detectMotifs(fenBefore, p.bestUci || p.bestSan);
  const replySan = p.reply?.san ?? [];
  const threats = replySan.length ? detectMotifs(fenAfter, replySan[0]) : [];
  const book = lookupBook(fenAfter);
  const paragraphs: string[] = [];
  const info = MOVE_CLASS_INFO[p.classification];

  const motifSentence = (ms: MotifInfo[]) => ms.map((m) => `${m.name}: ${m.detail}`).join(' ');

  // Played move: what does it do?
  let mvObj: Move | null = null;
  try {
    mvObj = new Chess(fenBefore).move(p.san);
  } catch {
    mvObj = null;
  }

  let headline = `${p.san} is ${info.label.toLowerCase()}.`;

  if (p.classification === 'book') {
    headline = `${p.san} is a book move.`;
    paragraphs.push(
      `This is known opening theory${book ? ` — ${book.name}` : ''}. Strong players have tested this position for decades; following principles here (develop, fight for the centre, castle) is exactly right.`
    );
    if (motifs.length) paragraphs.push(motifSentence(motifs));
    return { headline, paragraphs, motifs, bestMotifs: [], threats: [], opening: book?.name };
  }

  if (isBest || p.classification === 'super' || p.classification === 'genial') {
    if (p.classification === 'genial') {
      const sac = isSacrifice(fenBefore, p.uci);
      headline = `${p.san}!! — a genial move.`;
      paragraphs.push(
        sac
          ? `A real sacrifice: the material can be taken, but the engine confirms it pays off. ${replySan.length ? `If the opponent accepts, the main line goes ${formatLine(fenAfter, replySan, 6)}.` : ''}`
          : `The only move that keeps ${describeScoreForMover(p.evalAfter, color)}. Every alternative is clearly worse${p.lines[1] ? ` (e.g. ${p.lines[1].san[0]} would give ${formatScore(p.lines[1].score)})` : ''}.`
      );
    } else if (isBest) {
      headline = `${p.san} is the engine's top choice.`;
    } else {
      headline = `${p.san} is super good — practically as strong as the top move ${p.bestSan}.`;
    }
    if (motifs.length) paragraphs.push(motifSentence(motifs));
    else if (mvObj) paragraphs.push(explainMove(new Chess(fenBefore), mvObj));
    paragraphs.push(`After it you have ${describeScoreForMover(p.evalAfter, color)} (${formatScore(p.evalAfter)}).`);
    return { headline, paragraphs, motifs, bestMotifs, threats: [], opening: book?.name };
  }

  // ── A worse move than the best one ──
  headline =
    p.classification === 'good'
      ? `${p.san} is good, but ${p.bestSan} was more accurate.`
      : p.classification === 'bad'
        ? `${p.san} is a bad move — ${p.bestSan} was much stronger.`
        : `${p.san} is a blunder! ${p.bestSan} was the move.`;

  paragraphs.push(
    `You played ${p.san} (${formatScore(p.evalAfter)}). The most accurate move was ${p.bestSan} (${formatScore(p.evalBefore)}), keeping ${describeScoreForMover(p.evalBefore, color)}. You gave away ${p.winLoss.toFixed(0)}% of your winning chances.`
  );

  // Why the played move is worse
  const why: string[] = [];
  const mover = color === 'w' ? 1 : -1;
  if (p.evalAfter.mate !== undefined && p.evalAfter.mate * mover < 0) {
    why.push(`It allows a forced mate in ${Math.abs(p.evalAfter.mate)}: ${formatLine(fenAfter, replySan, 8)}.`);
  }
  if (mvObj) {
    const afterG = new Chess(fenAfter);
    if (mvObj.piece !== 'k' && isEnPrise(afterG, mvObj.to) && replySan[0]) {
      const replyMove = (() => {
        try {
          return new Chess(fenAfter).move(replySan[0]);
        } catch {
          return null;
        }
      })();
      if (replyMove && replyMove.to === mvObj.to) {
        why.push(`Your ${PIECE_NAME[mvObj.piece]} on ${mvObj.to} is left en prise — ${replySan[0]} simply takes it.`);
      }
    }
    const loose = hangingPieces(afterG, color).filter((h) => h.square !== mvObj!.to);
    if (loose.length && !why.length) {
      why.push(`It leaves your ${PIECE_NAME[loose[0].type]} on ${loose[0].square} unprotected.`);
    }
  }
  const tacticalThreats = threats.filter((t) => !['Kingside Castling', 'Queenside Castling', 'Promotion'].includes(t.name));
  if (tacticalThreats.length) {
    why.push(`It allows ${replySan[0]} — ${tacticalThreats.map((t) => `${t.name.toLowerCase()}: ${t.detail}`).join(' ')}`);
  }
  const lossAlongLine = materialSwing(fenAfter, replySan, color, 8);
  if (lossAlongLine <= -2 && !why.some((w) => w.includes('en prise'))) {
    why.push(`Along the critical line ${formatLine(fenAfter, replySan, 6)} you end up ${pts(-lossAlongLine)} of material down.`);
  }
  if (!why.length) {
    why.push(
      p.classification === 'good'
        ? `No tactical problem — it's just a less precise move. After it the position is ${describeScoreForMover(p.evalAfter, color)}.`
        : `It doesn't lose material immediately, but it hands the initiative to your opponent: the engine's reply ${replySan[0] ?? ''} improves their position and you drop to ${describeScoreForMover(p.evalAfter, color)}.`
    );
  }
  paragraphs.push(why.join(' '));

  // Why the best move is better
  const best: string[] = [];
  const bestLine = p.lines[0]?.san ?? [];
  if (p.evalBefore.mate !== undefined && p.evalBefore.mate * mover > 0) {
    best.push(`${p.bestSan} starts a forced mate in ${Math.abs(p.evalBefore.mate)}: ${formatLine(fenBefore, bestLine, 9)}.`);
  } else {
    if (bestMotifs.length) best.push(`${p.bestSan} — ${motifSentence(bestMotifs)}`);
    const gain = materialSwing(fenBefore, bestLine, color, 8);
    if (gain >= 2) best.push(`It wins ${pts(gain)} of material: ${formatLine(fenBefore, bestLine, 7)}.`);
    if (!best.length) {
      try {
        const g0 = new Chess(fenBefore);
        const bm = g0.move(p.bestSan);
        g0.undo();
        best.push(`${p.bestSan}: ${explainMove(g0, bm)}`);
      } catch {
        // ignore
      }
    }
  }
  if (best.length) paragraphs.push(best.join(' '));

  if (p.classification === 'blunder') {
    paragraphs.push('Blunder check before every move: what are ALL the checks, captures and threats your opponent has after it?');
  }

  return { headline, paragraphs, motifs, bestMotifs, threats: tacticalThreats, opening: book?.name };
}

/** The 3 biggest swings in the game for one side (for the "key moments" list). */
export function keyMoments(a: GameAnalysis, color: Color, n = 3): PlyAnalysis[] {
  return a.plies
    .filter((p) => p.color === color && (p.classification === 'blunder' || p.classification === 'bad' || p.classification === 'genial'))
    .sort((x, y) => (y.classification === 'genial' ? 100 : y.winLoss) - (x.classification === 'genial' ? 100 : x.winLoss))
    .slice(0, n)
    .sort((x, y) => x.ply - y.ply);
}

export function countClasses(a: GameAnalysis, color: Color): Record<MoveClass, number> {
  const out: Record<MoveClass, number> = { genial: 0, super: 0, good: 0, book: 0, bad: 0, blunder: 0 };
  a.plies.filter((p) => p.color === color).forEach((p) => out[p.classification]++);
  return out;
}
