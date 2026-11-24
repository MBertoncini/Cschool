import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Chess, DEFAULT_POSITION, Move, Square, validateFen } from 'chess.js';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardPaste,
  Copy,
  Cpu,
  FlipVertical2,
  Loader2,
  Microscope,
  Pin,
  RefreshCw,
  Target,
  Undo2,
} from 'lucide-react';
import { ChessBoard, BoardArrow } from '../components/ChessBoard';
import { EvaluationBar } from '../components/EvaluationBar';
import { PieceSetPicker } from '../components/PieceSetPicker';
import { EngineLine } from '../types/chess';
import { barScore, formatScore, rawToLine } from '../engine/gameAnalysis';
import { drawReason } from '../engine/botEngine';
import { RawLine, getEngine } from '../engine/stockfish';
import { sounds } from '../engine/sound';

// ─── State & persistence ───────────────────────────────────────────────────

/** A reference line (e.g. the game being followed) that explored variations can return to. */
interface GameLine {
  startFen: string;
  moves: string[];
  white?: string;
  black?: string;
}

interface BoardState {
  startFen: string;
  moves: string[]; // SAN, from startFen
  idx: number; // number of moves applied to reach the shown position
  game: GameLine | null;
}

interface EngineSettings {
  depth: number;
  multiPv: number;
  enabled: boolean;
  arrows: boolean;
}

const STORAGE_KEY = 'cschool.analysis.v1';
const MIN_DEPTH = 6;
const MAX_DEPTH = 30;
const BEST_ARROW = '#d4a359';
const ALT_ARROW = '#688db5';

const INITIAL_BOARD: BoardState = { startFen: DEFAULT_POSITION, moves: [], idx: 0, game: null };
const INITIAL_SETTINGS: EngineSettings = { depth: 18, multiPv: 3, enabled: true, arrows: true };

function loadSaved(): { board: BoardState; settings: EngineSettings; flipped: boolean } {
  const fallback = { board: INITIAL_BOARD, settings: INITIAL_SETTINGS, flipped: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const saved = JSON.parse(raw);
    const board: BoardState = { ...INITIAL_BOARD, ...saved.board };
    // Drop anything that no longer replays cleanly
    const { moves } = replay(board.startFen, board.moves);
    board.moves = moves.map((m) => m.san);
    board.idx = Math.max(0, Math.min(board.moves.length, board.idx));
    return { board, settings: { ...INITIAL_SETTINGS, ...saved.settings }, flipped: Boolean(saved.flipped) };
  } catch {
    return fallback;
  }
}

/** Plays `sans` from `startFen`, stopping at the first illegal move. */
function replay(startFen: string, sans: string[]): { moves: Move[]; game: Chess } {
  const game = new Chess(startFen);
  const moves: Move[] = [];
  for (const san of sans) {
    try {
      moves.push(game.move(san));
    } catch {
      break;
    }
  }
  return { moves, game };
}

/** Game with history up to `n` moves, so repetitions and the 50-move rule are tracked. */
function gameAt(startFen: string, sans: string[], n: number): Chess {
  return replay(startFen, sans.slice(0, n)).game;
}

/** Accepts a FEN, a full PGN (headers, comments and clocks included) or a bare move list. */
function parseImport(text: string): GameLine | string {
  const input = text.trim();
  if (!input) return 'Paste a FEN or a PGN first.';
  if (validateFen(input).ok) return { startFen: input, moves: [] };
  const g = new Chess();
  try {
    g.loadPgn(input);
  } catch {
    const fenError = validateFen(input).error;
    return `Not a valid PGN${input.split('/').length === 8 ? ` or FEN (${fenError})` : ''}.`;
  }
  const history = g.history({ verbose: true });
  const headers = g.getHeaders();
  return {
    startFen: history[0]?.before ?? g.fen(),
    moves: history.map((m) => m.san),
    white: headers.White && headers.White !== '?' ? headers.White : undefined,
    black: headers.Black && headers.Black !== '?' ? headers.Black : undefined,
  };
}

// ─── Small formatting helpers ──────────────────────────────────────────────

/** Move-number labels for the SAN at position i of a line starting at `fen`. */
function moveLabels(fen: string, count: number): string[] {
  const g = new Chess(fen);
  let no = g.moveNumber();
  let turn = g.turn();
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(turn === 'w' ? `${no}.` : i === 0 ? `${no}...` : '');
    if (turn === 'b') no++;
    turn = turn === 'w' ? 'b' : 'w';
  }
  return out;
}

function commonPrefix(a: string[], b: string[]): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

// ─── View ──────────────────────────────────────────────────────────────────

interface EngineView {
  fen: string;
  lines: EngineLine[];
  depth: number;
  thinking: boolean;
  error?: string;
}

/** Free analysis board: both sides move, Stockfish suggests the next move at a chosen depth. */
export const AnalysisBoardView: React.FC = () => {
  const [saved] = useState(loadSaved);
  const [board, setBoard] = useState<BoardState>(saved.board);
  const [settings, setSettings] = useState<EngineSettings>(saved.settings);
  const [flipped, setFlipped] = useState(saved.flipped);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [engine, setEngine] = useState<EngineView | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ board, settings, flipped }));
    } catch {
      // storage full or unavailable: the board still works, it just won't be restored
    }
  }, [board, settings, flipped]);

  const { startFen, moves, idx, game: gameLine } = board;
  const position = useMemo(() => gameAt(startFen, moves, idx), [startFen, moves, idx]);
  const fen = position.fen();
  const verboseMoves = useMemo(() => replay(startFen, moves).moves, [startFen, moves]);
  const lastMove = idx > 0 ? { from: verboseMoves[idx - 1].from, to: verboseMoves[idx - 1].to } : null;
  const labels = useMemo(() => moveLabels(startFen, moves.length), [startFen, moves]);
  const onGameLine = gameLine && gameLine.startFen === startFen ? commonPrefix(moves, gameLine.moves) : 0;
  const atGamePosition =
    gameLine !== null && gameLine.startFen === startFen && idx === gameLine.moves.length && onGameLine >= idx;

  // ── Engine ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!settings.enabled) {
      setEngine(null);
      return;
    }
    const g = new Chess(fen);
    if (g.isGameOver()) {
      setEngine({ fen, lines: [], depth: 0, thinking: false });
      return;
    }
    let alive = true;
    const stm = g.turn();
    const sf = getEngine('live');
    sf.stop();
    setEngine({ fen, lines: [], depth: 0, thinking: true });
    const toView = (raws: RawLine[], thinking: boolean) => {
      const withPv = raws.filter((r) => r.pv.length > 0);
      if (!withPv.length) return;
      setEngine({
        fen,
        lines: withPv.map((r) => rawToLine(fen, r, stm)),
        depth: withPv[0].depth,
        thinking,
      });
    };
    sf.analyze(fen, {
      depth: settings.depth,
      multiPv: settings.multiPv,
      onUpdate: (raws) => alive && toView(raws, true),
    })
      .then((res) => {
        if (!alive) return;
        toView(res.lines, false);
        setEngine((e) => (e && e.fen === fen ? { ...e, thinking: false } : e));
      })
      .catch((e) => {
        if (!alive) return;
        setEngine({ fen, lines: [], depth: 0, thinking: false, error: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      alive = false;
      sf.stop();
    };
  }, [fen, settings.enabled, settings.depth, settings.multiPv]);

  const lines = engine && engine.fen === fen ? engine.lines : [];
  const best = lines[0];

  // ── Moves & navigation ──────────────────────────────────────────────────
  /** Appends SAN moves after the shown position, keeping the existing continuation when it matches. */
  const playMoves = useCallback(
    (sans: string[]) => {
      setBoard((b) => {
        const g = gameAt(b.startFen, b.moves, b.idx);
        const played: string[] = [];
        for (const san of sans) {
          try {
            played.push(g.move(san).san);
          } catch {
            break;
          }
        }
        if (!played.length) return b;
        const continuation = b.moves.slice(b.idx, b.idx + played.length);
        const keepTail = continuation.length === played.length && continuation.every((m, i) => m === played[i]);
        const newMoves = keepTail ? b.moves : [...b.moves.slice(0, b.idx), ...played];
        return { ...b, moves: newMoves, idx: b.idx + played.length };
      });
    },
    []
  );

  const handleBoardMove = (mv: { from: Square; to: Square; promotion?: string }): boolean => {
    const g = gameAt(startFen, moves, idx);
    let played: Move;
    try {
      played = g.move({ from: mv.from, to: mv.to, promotion: mv.promotion || 'q' });
    } catch {
      return false;
    }
    if (played.captured) sounds.playCapture();
    else if (g.inCheck()) sounds.playCheck();
    else sounds.playMove();
    playMoves([played.san]);
    return true;
  };

  const goTo = useCallback((n: number) => setBoard((b) => ({ ...b, idx: Math.max(0, Math.min(b.moves.length, n)) })), []);
  const prev = useCallback(() => setBoard((b) => ({ ...b, idx: Math.max(0, b.idx - 1) })), []);
  const next = useCallback(() => setBoard((b) => ({ ...b, idx: Math.min(b.moves.length, b.idx + 1) })), []);
  const first = useCallback(() => goTo(0), [goTo]);
  const last = useCallback(() => setBoard((b) => ({ ...b, idx: b.moves.length })), []);

  const backToGame = useCallback(() => {
    setBoard((b) => (b.game ? { ...b, startFen: b.game.startFen, moves: b.game.moves, idx: b.game.moves.length } : b));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowUp' || e.key === 'Home') first();
      else if (e.key === 'ArrowDown' || e.key === 'End') last();
      else if (e.key === 'Escape') backToGame();
      else if (e.key === 'f') setFlipped((f) => !f);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, first, last, backToGame]);

  // ── Import / export ─────────────────────────────────────────────────────
  const handleImport = () => {
    const parsed = parseImport(importText);
    if (typeof parsed === 'string') {
      setImportError(parsed);
      return;
    }
    setImportError(null);
    setImportText('');
    setBoard({ startFen: parsed.startFen, moves: parsed.moves, idx: parsed.moves.length, game: parsed });
  };

  const pinAsGame = () => {
    setBoard((b) => ({
      ...b,
      moves: b.moves.slice(0, b.idx),
      game: { ...(b.game ?? {}), startFen: b.startFen, moves: b.moves.slice(0, b.idx) },
    }));
  };

  const newBoard = () => {
    setBoard(INITIAL_BOARD);
    setFlipped(false);
  };

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied('Copy failed');
    }
  };

  const exportPgn = () => {
    const g = new Chess(startFen);
    if (gameLine?.white) g.setHeader('White', gameLine.white);
    if (gameLine?.black) g.setHeader('Black', gameLine.black);
    for (const m of moves) g.move(m);
    return g.pgn();
  };

  // ── Board decorations ───────────────────────────────────────────────────
  const arrows: BoardArrow[] = [];
  if (settings.arrows) {
    lines.forEach((line, i) => {
      const san = line.san[0];
      if (!san) return;
      try {
        const m = new Chess(fen).move(san);
        arrows.push(i === 0 ? { from: m.from, to: m.to, color: BEST_ARROW } : { from: m.from, to: m.to, color: ALT_ARROW, dashed: true });
      } catch {
        // stale line for a previous position
      }
    });
    arrows.reverse(); // best arrow drawn last, on top
  }

  const orientation = flipped ? 'black' : 'white';
  const terminal = position.isCheckmate() ? (position.turn() === 'w' ? '0-1' : '1-0') : undefined;
  const evalScore = best?.score;
  const sideToMove = position.turn() === 'w' ? 'White' : 'Black';
  const topName = orientation === 'white' ? gameLine?.black ?? 'Black' : gameLine?.white ?? 'White';
  const bottomName = orientation === 'white' ? gameLine?.white ?? 'White' : gameLine?.black ?? 'Black';

  let status: string;
  if (position.isCheckmate()) status = `Checkmate — ${position.turn() === 'w' ? 'Black' : 'White'} wins`;
  else if (position.isDraw() || position.isStalemate()) status = drawReason(position);
  else status = `${sideToMove} to move${position.inCheck() ? ' (check)' : ''}`;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      <div className="pb-4 border-b border-wood-750">
        <div className="inline-flex items-center gap-1.5 text-xs font-serif font-bold text-brass uppercase tracking-widest mb-1">
          <Microscope className="w-4 h-4" />
          <span>Analysis Board</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-wood-100">Explore Any Position</h1>
        <p className="text-wood-400 text-xs sm:text-sm mt-1 font-sans">
          Move both sides freely and let Stockfish suggest the next move. Paste a live game's PGN or FEN to try your own
          variations while you wait for the players.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: board */}
        <div className="lg:col-span-7 flex flex-col items-center gap-3">
          <div className="w-full max-w-[580px] flex items-center justify-between text-xs px-1 font-serif">
            <span className="font-bold text-wood-200 truncate">{topName}</span>
            {gameLine && !atGamePosition && (
              <button
                onClick={backToGame}
                title="Return to the game position (Esc)"
                className="flex items-center gap-1.5 text-[10px] font-bold text-wood-100 wood-btn border border-brass/40 px-2 py-0.5 rounded-md shrink-0"
              >
                <Undo2 className="w-3 h-3 text-brass" /> Back to game position
              </button>
            )}
          </div>

          <div className="flex items-stretch justify-center gap-3.5 w-full max-w-[580px]">
            <EvaluationBar
              score={terminal ? (terminal === '1-0' ? 10 : -10) : barScore(evalScore)}
              orientation={orientation}
              label={terminal ?? (settings.enabled ? (evalScore ? formatScore(evalScore) : '…') : '–')}
            />
            <div className="flex-1">
              <ChessBoard
                game={position}
                onMove={handleBoardMove}
                orientation={orientation}
                interactive
                lastMove={lastMove}
                arrows={arrows}
              />
            </div>
          </div>

          <div className="w-full max-w-[580px] flex items-center justify-between text-xs px-1 font-serif">
            <span className="font-bold text-wood-200 truncate">{bottomName}</span>
            <span className="text-[10px] text-wood-500 font-sans hidden sm:inline">
              ← → navigate · ↑ ↓ start/end · F flip · Esc back to game
            </span>
          </div>

          <div className="w-full max-w-[580px] grid grid-cols-6 gap-2">
            {[
              { icon: <ChevronsLeft className="w-4 h-4" />, onClick: first, title: 'Start' },
              { icon: <ChevronLeft className="w-4 h-4" />, onClick: prev, title: 'Previous move' },
              { icon: <ChevronRight className="w-4 h-4" />, onClick: next, title: 'Next move' },
              { icon: <ChevronsRight className="w-4 h-4" />, onClick: last, title: 'End' },
              { icon: <FlipVertical2 className="w-4 h-4" />, onClick: () => setFlipped((f) => !f), title: 'Flip board' },
              {
                icon: <Target className={`w-4 h-4 ${settings.arrows ? 'text-brass' : ''}`} />,
                onClick: () => setSettings((s) => ({ ...s, arrows: !s.arrows })),
                title: settings.arrows ? 'Hide engine arrows' : 'Show engine arrows',
              },
            ].map((b, i) => (
              <button
                key={i}
                onClick={b.onClick}
                title={b.title}
                className="py-2.5 rounded-xl wood-btn text-wood-200 flex items-center justify-center transition border border-wood-700/80"
              >
                {b.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Right: engine, moves, import */}
        <div className="lg:col-span-5 space-y-4">
          {/* Engine panel */}
          <div className="wood-panel border border-wood-700 rounded-xl p-4 shadow-wood-raised space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-serif font-bold text-wood-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-brass" /> Stockfish
              </h4>
              <label className="flex items-center gap-2 text-xs text-wood-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
                  className="accent-[#d4a359]"
                />
                <span>Engine on</span>
              </label>
            </div>

            <div className="text-xs text-wood-300 font-sans">{status}</div>

            {settings.enabled && !position.isGameOver() && (
              <>
                <div className="wood-well rounded-lg p-3 border border-wood-850">
                  <div className="text-[10px] uppercase tracking-wider text-wood-500 font-bold">Suggested move</div>
                  <div className="flex items-baseline justify-between gap-2 mt-0.5">
                    {best?.san[0] ? (
                      <button
                        onClick={() => playMoves([best.san[0]])}
                        title="Play this move"
                        className="font-serif text-2xl font-bold text-brass hover:underline"
                      >
                        {moveLabels(fen, 1)[0]}
                        {best.san[0]}
                      </button>
                    ) : (
                      <span className="font-serif text-2xl font-bold text-wood-500">…</span>
                    )}
                    <span className="font-mono text-sm text-wood-200">{best ? formatScore(best.score) : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-wood-500 mt-1 font-mono">
                    {engine?.thinking && <Loader2 className="w-3 h-3 animate-spin text-brass" />}
                    <span>
                      depth {engine?.depth ?? 0}/{settings.depth}
                      {engine && !engine.thinking && engine.depth > 0 ? ' · done' : ''}
                    </span>
                  </div>
                  {engine?.error && <div className="text-xs text-rose-300 mt-1">Engine error: {engine.error}</div>}
                </div>

                {/* Candidate lines */}
                <div className="space-y-1.5">
                  {lines.map((line, i) => {
                    const lineLabels = moveLabels(fen, line.san.length);
                    return (
                      <div key={i} className="flex items-start gap-2 text-xs font-mono">
                        <span
                          className={`shrink-0 w-14 text-center py-0.5 rounded-md font-bold ${
                            i === 0 ? 'wood-btn-brass text-wood-950' : 'wood-well text-wood-200 border border-wood-750'
                          }`}
                        >
                          {formatScore(line.score)}
                        </span>
                        <span className="leading-relaxed text-wood-300">
                          {line.san.map((san, j) => (
                            <button
                              key={j}
                              onClick={() => playMoves(line.san.slice(0, j + 1))}
                              title="Play the line up to this move"
                              className={`mr-1 hover:text-brass ${j === 0 ? 'font-bold text-wood-100' : ''}`}
                            >
                              {lineLabels[j]}
                              {san}
                            </button>
                          ))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="space-y-2 pt-2 border-t border-wood-750 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-wood-400 font-medium">Depth</span>
                <span className="font-mono text-brass font-bold">{settings.depth}</span>
              </div>
              <input
                type="range"
                min={MIN_DEPTH}
                max={MAX_DEPTH}
                value={settings.depth}
                onChange={(e) => setSettings((s) => ({ ...s, depth: Number(e.target.value) }))}
                className="w-full accent-[#d4a359]"
              />
              <div className="flex justify-between text-[10px] text-wood-500 font-sans">
                <span>{MIN_DEPTH} · fast</span>
                <span>{MAX_DEPTH} · deep, can take minutes</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-wood-400 font-medium">Candidate lines</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setSettings((s) => ({ ...s, multiPv: n }))}
                      className={`w-7 py-1 rounded-md font-bold transition ${
                        settings.multiPv === n ? 'wood-btn-brass text-wood-950' : 'wood-btn text-wood-300'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Move list */}
          <div className="wood-panel border border-wood-700 rounded-xl p-4 shadow-wood-raised space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[11px] font-serif font-bold text-wood-400 uppercase tracking-wider">Moves</h4>
              <button
                onClick={pinAsGame}
                title="Make the shown position the game position (e.g. after the players move). Later moves are dropped."
                className="flex items-center gap-1 px-2 py-1 rounded-md wood-btn text-[11px] text-wood-300 font-semibold"
              >
                <Pin className="w-3 h-3 text-brass" /> Set as game position
              </button>
            </div>
            <div className="wood-well rounded-lg p-2 max-h-56 overflow-y-auto font-mono text-xs border border-wood-850 leading-relaxed">
              <button
                onClick={first}
                className={`px-1 rounded ${idx === 0 ? 'bg-wood-700 text-brass font-bold' : 'text-wood-500 hover:text-wood-200'}`}
              >
                Start
              </button>{' '}
              {moves.length === 0 ? (
                <span className="text-wood-500 italic">Move a piece on the board to begin.</span>
              ) : (
                moves.map((san, i) => {
                  const inGame = gameLine !== null && i < onGameLine;
                  const active = i + 1 === idx;
                  return (
                    <React.Fragment key={i}>
                      {labels[i] && <span className="text-wood-500">{labels[i]}</span>}
                      <button
                        onClick={() => goTo(i + 1)}
                        className={`px-1 mr-0.5 rounded transition ${
                          active
                            ? `bg-wood-700 text-brass font-bold ${inGame || !gameLine ? '' : 'italic'}`
                            : inGame || !gameLine
                            ? 'text-wood-200 hover:bg-wood-800'
                            : 'text-sky-300/90 italic hover:bg-wood-800'
                        }`}
                      >
                        {san}
                      </button>
                    </React.Fragment>
                  );
                })
              )}
            </div>
            {gameLine && (
              <p className="text-[11px] text-wood-500 font-sans">
                Game moves in plain text, <span className="text-sky-300/90 italic">your variation in italics</span>.
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => copy('FEN', fen)}
                className="flex-1 py-2 rounded-lg wood-btn text-wood-200 font-semibold flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-brass" /> {copied === 'FEN' ? 'Copied!' : 'Copy FEN'}
              </button>
              <button
                onClick={() => copy('PGN', exportPgn())}
                className="flex-1 py-2 rounded-lg wood-btn text-wood-200 font-semibold flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-brass" /> {copied === 'PGN' ? 'Copied!' : 'Copy PGN'}
              </button>
              <button
                onClick={newBoard}
                title="Clear the board and start from the initial position"
                className="flex-1 py-2 rounded-lg wood-btn text-wood-200 font-semibold flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> New board
              </button>
            </div>
          </div>

          {/* Import */}
          <div className="wood-panel border border-wood-700 rounded-xl p-4 shadow-wood-raised space-y-2.5 text-xs">
            <h4 className="text-[11px] font-serif font-bold text-wood-400 uppercase tracking-wider">Load a position</h4>
            <textarea
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setImportError(null);
              }}
              rows={4}
              placeholder={'Paste a PGN (e.g. from a live broadcast) or a FEN\n1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 …'}
              className="w-full wood-well rounded-lg p-2 font-mono text-xs text-wood-100 placeholder:text-wood-600 border border-wood-850 focus:outline-none focus:border-brass/60 resize-y"
            />
            {importError && <div className="text-rose-300">{importError}</div>}
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="w-full py-2 rounded-lg wood-btn-brass text-wood-950 font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-wood-950" /> Load as game position
            </button>
            <p className="text-[11px] text-wood-500 font-sans leading-snug">
              When the players make a new move, go back to the game position, play it on the board and press{' '}
              <span className="text-wood-300">Set as game position</span> — or paste the updated PGN.
            </p>
          </div>

          <div className="wood-panel border border-wood-700 rounded-xl p-4 shadow-wood-raised space-y-1.5 text-xs">
            <span className="text-wood-400 font-medium">Pieces:</span>
            <PieceSetPicker />
          </div>
        </div>
      </div>
    </div>
  );
};
