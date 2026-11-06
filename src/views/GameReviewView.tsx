import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, Move, Square } from 'chess.js';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Cpu,
  FlipVertical2,
  GitBranch,
  GraduationCap,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { ChessBoard, BoardArrow } from '../components/ChessBoard';
import { EvaluationBar } from '../components/EvaluationBar';
import { EvalGraph } from '../components/EvalGraph';
import { useGames } from '../context/GamesContext';
import { EngineLine, GameAnalysis, MotifInfo, MoveClass, PlyAnalysis } from '../types/chess';
import {
  analyzeGame,
  ANALYSIS_VERSION,
  barScore,
  coachNotes,
  countClasses,
  formatLine,
  formatScore,
  keyMoments,
  MOVE_CLASS_INFO,
  MOVE_CLASS_ORDER,
  rawToLine,
} from '../engine/gameAnalysis';
import { CancelledError, getEngine } from '../engine/stockfish';
import { detectMotifs } from '../engine/motifs';
import { detectOpening } from '../engine/openingBook';
import { sounds } from '../engine/sound';

interface Variation {
  base: number; // main-line ply the variation branches from (position after `base` moves)
  moves: string[];
  idx: number; // how many variation moves are currently applied (0 = base position)
}

const DEPTHS = [
  { label: 'Fast', depth: 11 },
  { label: 'Normal', depth: 14 },
  { label: 'Deep', depth: 18 },
];

function replay(fen: string, sans: string[]): { fens: string[]; moves: Move[] } {
  const g = new Chess(fen);
  const fens = [g.fen()];
  const moves: Move[] = [];
  for (const s of sans) {
    try {
      moves.push(g.move(s));
      fens.push(g.fen());
    } catch {
      break;
    }
  }
  return { fens, moves };
}

const START_FEN = new Chess().fen();

const ClassBadge: React.FC<{ cls: MoveClass; size?: 'sm' | 'md' }> = ({ cls, size = 'sm' }) => {
  const info = MOVE_CLASS_INFO[cls];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-black text-white shrink-0 ${
        size === 'sm' ? 'w-4 h-4 text-[8px]' : 'w-6 h-6 text-[11px]'
      }`}
      style={{ backgroundColor: info.color }}
      title={info.label}
    >
      {info.symbol}
    </span>
  );
};

const MotifChips: React.FC<{ title: string; motifs: MotifInfo[]; tone: string }> = ({ title, motifs, tone }) => {
  if (!motifs.length) return null;
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {motifs.map((m, i) => (
          <span key={i} title={m.detail} className={`px-2 py-0.5 rounded-full text-[11px] font-bold border cursor-help ${tone}`}>
            {m.name}
          </span>
        ))}
      </div>
    </div>
  );
};

interface GameReviewViewProps {
  gameId: string;
  onBack: () => void;
}

export const GameReviewView: React.FC<GameReviewViewProps> = ({ gameId, onBack }) => {
  const { getGame, saveAnalysis } = useGames();
  const saved = getGame(gameId);
  const moves = saved?.moves ?? [];
  const movesKey = moves.join(' ');

  const main = useMemo(() => replay(START_FEN, moves), [movesKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const N = main.moves.length;

  const [ply, setPly] = useState(0);
  const [variation, setVariation] = useState<Variation | null>(null);
  const [flipped, setFlipped] = useState(saved?.playerColor === 'b');
  const [showEngineArrow, setShowEngineArrow] = useState(false);
  const [depth, setDepth] = useState(14);
  const [copied, setCopied] = useState(false);

  // ── Analysis ────────────────────────────────────────────────────────────
  const storedOk = saved?.analysis && saved.analysis.version === ANALYSIS_VERSION && saved.analysis.plies.length === N;
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(storedOk ? saved!.analysis! : null);
  const [partial, setPartial] = useState<PlyAnalysis[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const runIdRef = useRef(0);

  const runAnalysis = useCallback(
    async (d: number) => {
      if (!N) return;
      const runId = ++runIdRef.current;
      setAnalysisError(null);
      setPartial([]);
      setProgress({ done: 0, total: N + 1 });
      try {
        const result = await analyzeGame(moves, {
          depth: d,
          isCancelled: () => runIdRef.current !== runId,
          onProgress: (p) => {
            if (runIdRef.current !== runId) return;
            setProgress({ done: p.done, total: p.total });
            setPartial(p.partial);
          },
        });
        if (runIdRef.current !== runId) return;
        setAnalysis(result);
        saveAnalysis(gameId, result);
      } catch (e) {
        if (runIdRef.current !== runId || e instanceof CancelledError) return;
        setAnalysisError(e instanceof Error ? e.message : String(e));
      } finally {
        if (runIdRef.current === runId) setProgress(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [movesKey, gameId, saveAnalysis, N]
  );

  // Analyse automatically the first time a game is opened
  useEffect(() => {
    if (!analysis && N > 0) void runAnalysis(depth);
    return () => {
      runIdRef.current++;
      getEngine('batch').stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  const plies: PlyAnalysis[] = analysis?.plies ?? partial;
  const plyInfo = ply > 0 ? plies[ply - 1] : undefined;

  // ── Current position ────────────────────────────────────────────────────
  const varData = useMemo(() => (variation ? replay(main.fens[variation.base], variation.moves) : null), [variation, main]);
  const currentFen = variation && varData ? varData.fens[variation.idx] : main.fens[ply];
  const boardGame = useMemo(() => new Chess(currentFen), [currentFen]);
  const lastMoveObj: Move | undefined =
    variation && varData ? (variation.idx > 0 ? varData.moves[variation.idx - 1] : main.moves[variation.base - 1]) : main.moves[ply - 1];
  const lastMove = lastMoveObj ? { from: lastMoveObj.from, to: lastMoveObj.to } : null;

  // ── Live engine for variations ──────────────────────────────────────────
  const [live, setLive] = useState<{ fen: string; line: EngineLine | null; thinking: boolean } | null>(null);
  useEffect(() => {
    if (!variation) {
      setLive(null);
      return;
    }
    const fen = currentFen;
    const g = new Chess(fen);
    if (g.isGameOver()) {
      setLive({ fen, line: null, thinking: false });
      return;
    }
    let alive = true;
    const engine = getEngine('live');
    engine.stop();
    setLive({ fen, line: null, thinking: true });
    engine
      .analyze(fen, { depth: 16, multiPv: 1 })
      .then((res) => {
        if (!alive || !res.lines[0]) return;
        setLive({ fen, line: rawToLine(fen, res.lines[0], g.turn()), thinking: false });
      })
      .catch(() => {
        /* cancelled */
      });
    return () => {
      alive = false;
    };
  }, [variation ? currentFen : null]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation ──────────────────────────────────────────────────────────
  const exitVariation = useCallback(() => setVariation(null), []);
  const goTo = useCallback(
    (p: number) => {
      setVariation(null);
      setPly(Math.max(0, Math.min(N, p)));
    },
    [N]
  );
  const prev = useCallback(() => {
    if (variation) {
      if (variation.idx > 0) setVariation({ ...variation, idx: variation.idx - 1 });
      else setVariation(null);
    } else setPly((p) => Math.max(0, p - 1));
  }, [variation]);
  const next = useCallback(() => {
    if (variation) setVariation({ ...variation, idx: Math.min(variation.moves.length, variation.idx + 1) });
    else setPly((p) => Math.min(N, p + 1));
  }, [variation, N]);
  const first = useCallback(() => goTo(0), [goTo]);
  const last = useCallback(() => {
    if (variation) setVariation({ ...variation, idx: variation.moves.length });
    else goTo(N);
  }, [variation, goTo, N]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowUp' || e.key === 'Home') first();
      else if (e.key === 'ArrowDown' || e.key === 'End') last();
      else if (e.key === 'Escape') exitVariation();
      else if (e.key === 'f') setFlipped((f) => !f);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, first, last, exitVariation]);

  // Moving a piece on the board explores a variation (or follows the game if it's the move played)
  const handleBoardMove = (mv: { from: Square; to: Square; promotion?: string }) => {
    let played: Move;
    try {
      played = new Chess(currentFen).move(mv);
    } catch {
      return false;
    }
    if (played.captured) sounds.playCapture();
    else sounds.playMove();
    if (!variation) {
      if (ply < N && main.moves[ply].san === played.san) {
        setPly(ply + 1);
        return true;
      }
      setVariation({ base: ply, moves: [played.san], idx: 1 });
      return true;
    }
    if (variation.moves[variation.idx] === played.san) {
      setVariation({ ...variation, idx: variation.idx + 1 });
    } else {
      setVariation({ ...variation, moves: [...variation.moves.slice(0, variation.idx), played.san], idx: variation.idx + 1 });
    }
    return true;
  };

  const loadLine = (base: number, sans: string[], idx = 1) => {
    if (!sans.length) return;
    setVariation({ base, moves: sans, idx: Math.min(idx, sans.length) });
  };

  // ── Move list auto-scroll ───────────────────────────────────────────────
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = listRef.current;
    const el = box?.querySelector<HTMLElement>('[data-active="true"]');
    if (box && el) box.scrollTop = el.offsetTop - box.clientHeight / 2;
  }, [ply]);

  // ── Board decorations ───────────────────────────────────────────────────
  const arrows: BoardArrow[] = [];
  let badge = null;
  if (!variation && plyInfo) {
    if (plyInfo.uci !== plyInfo.bestUci && ['good', 'bad', 'blunder'].includes(plyInfo.classification) && plyInfo.bestUci) {
      arrows.push({ from: plyInfo.bestUci.slice(0, 2) as Square, to: plyInfo.bestUci.slice(2, 4) as Square, color: '#22c55e' });
    }
    badge = {
      square: main.moves[ply - 1].to,
      label: MOVE_CLASS_INFO[plyInfo.classification].symbol,
      color: MOVE_CLASS_INFO[plyInfo.classification].color,
    };
  }
  if (showEngineArrow) {
    const nextBest = variation ? live?.line?.san[0] : plies[ply]?.bestSan;
    if (nextBest) {
      try {
        const m = new Chess(currentFen).move(nextBest);
        arrows.push({ from: m.from, to: m.to, color: '#3b82f6', dashed: true });
      } catch {
        // ignore
      }
    }
  }

  // ── Eval for the bar ────────────────────────────────────────────────────
  const currentEval = variation ? live?.line?.score : ply === 0 ? plies[0]?.evalBefore : plyInfo?.evalAfter;
  const terminal = boardGame.isCheckmate() ? (boardGame.turn() === 'w' ? '0-1' : '1-0') : undefined;

  // ── Coach notes ─────────────────────────────────────────────────────────
  const notes = useMemo(() => {
    if (variation || !plyInfo) return null;
    try {
      return coachNotes(plyInfo, main.fens[ply - 1], main.fens[ply]);
    } catch (e) {
      console.warn('coach failed', e);
      return null;
    }
  }, [plyInfo, ply, variation, main]);

  const variationMotifs = useMemo(() => {
    if (!variation || !varData || variation.idx === 0) return [];
    return detectMotifs(varData.fens[variation.idx - 1], variation.moves[variation.idx - 1]);
  }, [variation, varData]);

  const opening = useMemo(() => detectOpening(moves), [movesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── PGN export ──────────────────────────────────────────────────────────
  const copyPgn = async () => {
    if (!saved) return;
    const g = new Chess();
    g.setHeader('Event', 'ChessMaster Academy');
    g.setHeader('Date', saved.createdAt.slice(0, 10).replace(/-/g, '.'));
    g.setHeader('White', saved.white);
    g.setHeader('Black', saved.black);
    g.setHeader('Result', saved.result);
    if (opening) g.setHeader('Opening', opening.name);
    saved.moves.forEach((m, i) => {
      g.move(m);
      const a = plies[i];
      if (a) {
        const info = MOVE_CLASS_INFO[a.classification];
        const extra = a.uci !== a.bestUci && ['good', 'bad', 'blunder'].includes(a.classification) ? ` Best: ${a.bestSan}.` : '';
        g.setComment(`${info.label} (${formatScore(a.evalAfter)}).${extra}`);
      }
    });
    try {
      await navigator.clipboard.writeText(g.pgn());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy the PGN:', g.pgn());
    }
  };

  if (!saved) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-stone-300">This game is not in your history (it may have been deleted on another device).</p>
        <button onClick={onBack} className="px-4 py-2 rounded-lg bg-amber-500 text-stone-950 font-bold text-sm">
          Back to My Games
        </button>
      </div>
    );
  }

  const orientation = flipped ? 'black' : 'white';
  const topName = flipped ? saved.white : saved.black;
  const bottomName = flipped ? saved.black : saved.white;
  const youColor = saved.playerColor;

  // ── Render ──────────────────────────────────────────────────────────────
  const moveRows = Array.from({ length: Math.ceil(N / 2) }, (_, i) => i);

  const MoveCell: React.FC<{ index: number }> = ({ index }) => {
    const m = main.moves[index];
    if (!m) return <span className="flex-1" />;
    const a = plies[index];
    const active = !variation && ply === index + 1;
    const isYou = m.color === youColor;
    return (
      <button
        data-active={active}
        onClick={() => goTo(index + 1)}
        className={`flex-1 flex items-center gap-1.5 px-2 py-1 rounded text-left transition ${
          active ? 'bg-amber-500/25 text-white ring-1 ring-amber-500/60' : 'hover:bg-stone-800 text-stone-200'
        } ${isYou ? 'font-bold' : 'font-medium'}`}
      >
        {a ? <ClassBadge cls={a.classification} /> : <span className="w-4 h-4 shrink-0" />}
        <span>{m.san}</span>
        {a && (a.classification === 'blunder' || a.classification === 'bad') && (
          <span className="ml-auto text-[10px] text-stone-500 font-mono">{formatScore(a.evalAfter)}</span>
        )}
      </button>
    );
  };

  const counts = analysis ? { w: countClasses(analysis, 'w'), b: countClasses(analysis, 'b') } : null;
  const moments = analysis ? keyMoments(analysis, youColor) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200" title="Back to My Games">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-white truncate">
              {saved.white} <span className="text-stone-500 font-medium">vs</span> {saved.black}
              <span className="ml-2 text-amber-400 font-mono">{saved.result === '*' ? 'unfinished' : saved.result}</span>
            </h2>
            <p className="text-xs text-stone-400 truncate">
              {new Date(saved.createdAt).toLocaleString()} · {N} plies
              {opening && <> · <span className="text-amber-200">{opening.name}</span></>}
              {saved.termination && <> · {saved.termination}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyPgn}
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy PGN'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: board */}
        <div className="lg:col-span-7 flex flex-col items-center gap-3">
          <div className="w-full max-w-[580px] flex items-center justify-between text-sm px-1">
            <span className="font-bold text-stone-200">{topName}</span>
            {variation && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-sky-300 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded-full">
                <GitBranch className="w-3.5 h-3.5" /> Exploring a variation
              </span>
            )}
          </div>
          <div className="flex items-stretch justify-center gap-3 w-full max-w-[580px]">
            <EvaluationBar
              score={terminal ? (terminal === '1-0' ? 10 : -10) : barScore(currentEval)}
              orientation={orientation}
              label={terminal ?? (currentEval ? formatScore(currentEval) : '…')}
            />
            <div className="flex-1">
              <ChessBoard
                game={boardGame}
                onMove={handleBoardMove}
                orientation={orientation}
                interactive
                lastMove={lastMove}
                arrows={arrows}
                badge={badge}
              />
            </div>
          </div>
          <div className="w-full max-w-[580px] flex items-center justify-between text-sm px-1">
            <span className="font-bold text-stone-200">{bottomName}</span>
            <span className="text-[11px] text-stone-500 hidden sm:inline">← → to move · ↑ ↓ start/end · drag pieces to try ideas</span>
          </div>

          {/* Navigation controls */}
          <div className="w-full max-w-[580px] grid grid-cols-6 gap-2">
            {[
              { icon: <ChevronsLeft className="w-5 h-5" />, onClick: first, title: 'Start (↑)' },
              { icon: <ChevronLeft className="w-5 h-5" />, onClick: prev, title: 'Previous (←)' },
              { icon: <ChevronRight className="w-5 h-5" />, onClick: next, title: 'Next (→)' },
              { icon: <ChevronsRight className="w-5 h-5" />, onClick: last, title: 'End (↓)' },
              { icon: <FlipVertical2 className="w-5 h-5" />, onClick: () => setFlipped((f) => !f), title: 'Flip board (F)' },
              {
                icon: <Target className={`w-5 h-5 ${showEngineArrow ? 'text-sky-400' : ''}`} />,
                onClick: () => setShowEngineArrow((s) => !s),
                title: 'Show the engine move for this position',
              },
            ].map((b, i) => (
              <button
                key={i}
                onClick={b.onClick}
                title={b.title}
                className="py-2.5 rounded-lg bg-[#2a2622] hover:bg-[#38332d] border border-stone-700 text-stone-200 flex items-center justify-center transition active:scale-95"
              >
                {b.icon}
              </button>
            ))}
          </div>

          {/* Eval graph */}
          <div className="w-full max-w-[580px] space-y-1.5">
            <EvalGraph plies={plies} startEval={plies[0]?.evalBefore} currentPly={variation ? variation.base : ply} onSelectPly={goTo} totalPlies={N} />
            {progress && (
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>
                  Stockfish is analysing your game… {progress.done}/{progress.total}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-stone-800 overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
                </div>
              </div>
            )}
            {analysisError && (
              <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-900/50 rounded-lg p-2">
                Analysis failed: {analysisError}
              </div>
            )}
          </div>
        </div>

        {/* Right: coach, lines, moves, summary */}
        <div className="lg:col-span-5 space-y-4">
          {/* Coach card */}
          <div className="bg-[#24211d] border border-stone-800 rounded-xl p-4 shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <GraduationCap className="w-4 h-4" /> Coach
            </div>

            {variation ? (
              <div className="space-y-3">
                <p className="text-sm text-stone-200">
                  You're exploring your own idea from move {Math.floor(variation.base / 2) + 1}. Keep moving pieces on the board — the engine
                  evaluates every position.
                </p>
                <div className="flex flex-wrap gap-1 font-mono text-xs">
                  {variation.moves.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setVariation({ ...variation, idx: i + 1 })}
                      className={`px-1.5 py-0.5 rounded ${
                        variation.idx === i + 1 ? 'bg-sky-500/30 text-white' : 'text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      {formatLine(main.fens[variation.base], variation.moves.slice(0, i + 1)).split(' ').pop()}
                    </button>
                  ))}
                </div>
                <div className="rounded-lg bg-[#1b1916] border border-stone-800 p-3 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                    <Cpu className="w-3.5 h-3.5" /> Engine
                    {live?.thinking && <Loader2 className="w-3 h-3 animate-spin" />}
                  </div>
                  {terminal || boardGame.isGameOver() ? (
                    <div className="text-stone-200 font-bold">{boardGame.isCheckmate() ? 'Checkmate!' : 'Game over (draw).'}</div>
                  ) : live?.line ? (
                    <div className="space-y-1">
                      <div className="text-white font-black font-mono">{formatScore(live.line.score)}</div>
                      <button
                        className="text-left text-stone-300 font-mono hover:text-sky-300"
                        onClick={() =>
                          setVariation({
                            ...variation,
                            moves: [...variation.moves.slice(0, variation.idx), ...live.line!.san],
                            idx: variation.idx + 1,
                          })
                        }
                        title="Play the engine line on the board"
                      >
                        Best: {formatLine(currentFen, live.line.san, 8)}
                      </button>
                    </div>
                  ) : (
                    <div className="text-stone-500">Thinking…</div>
                  )}
                </div>
                <MotifChips title="Patterns in the last move" motifs={variationMotifs} tone="bg-sky-500/10 text-sky-200 border-sky-500/30" />
                {variationMotifs.map((m, i) => (
                  <p key={i} className="text-xs text-stone-300">
                    <b className="text-sky-200">{m.name}:</b> {m.detail}
                  </p>
                ))}
                <button
                  onClick={exitVariation}
                  className="w-full py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" /> Back to the game (Esc)
                </button>
              </div>
            ) : ply === 0 ? (
              <p className="text-sm text-stone-300 leading-relaxed">
                {N === 0
                  ? 'No moves in this game.'
                  : analysis
                    ? `Use the arrows (or ← →) to replay the game. I'll explain every move: what it did, whether there was something better, and the patterns behind it.`
                    : 'Analysing your game with Stockfish — you can already step through the moves.'}
              </p>
            ) : !plyInfo ? (
              <p className="text-sm text-stone-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Waiting for the engine to reach move {Math.ceil(ply / 2)}…
              </p>
            ) : notes ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <ClassBadge cls={plyInfo.classification} size="md" />
                  <div>
                    <div className={`text-sm font-black ${MOVE_CLASS_INFO[plyInfo.classification].text}`}>
                      {MOVE_CLASS_INFO[plyInfo.classification].label}
                      <span className="ml-2 text-stone-500 font-mono text-xs">
                        {formatScore(plyInfo.evalBefore)} → {formatScore(plyInfo.evalAfter)}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white">{notes.headline}</div>
                  </div>
                </div>
                {notes.paragraphs.map((t, i) => (
                  <p key={i} className="text-[13px] text-stone-300 leading-relaxed">
                    {t}
                  </p>
                ))}
                <MotifChips title="Patterns in your move" motifs={notes.motifs} tone="bg-emerald-500/10 text-emerald-200 border-emerald-500/30" />
                <MotifChips title={`Patterns in ${plyInfo.bestSan}`} motifs={notes.bestMotifs} tone="bg-lime-500/10 text-lime-200 border-lime-500/30" />
                <MotifChips title="What it allows" motifs={notes.threats} tone="bg-rose-500/10 text-rose-200 border-rose-500/30" />
                <div className="flex flex-wrap gap-2 pt-1">
                  {plyInfo.uci !== plyInfo.bestUci && plyInfo.lines[0] && (
                    <button
                      onClick={() => loadLine(ply - 1, plyInfo.lines[0].san)}
                      className="px-2.5 py-1.5 rounded-lg bg-lime-600/20 hover:bg-lime-600/30 border border-lime-600/40 text-lime-200 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Show {plyInfo.bestSan} line
                    </button>
                  )}
                  {plyInfo.reply && plyInfo.reply.san.length > 0 && (
                    <button
                      onClick={() => loadLine(ply, plyInfo.reply!.san)}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5"
                    >
                      <GitBranch className="w-3.5 h-3.5" /> What happens after {plyInfo.san}
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Alternatives (engine lines) */}
          {!variation && plyInfo && plyInfo.lines.length > 0 && (
            <div className="bg-[#24211d] border border-stone-800 rounded-xl p-4 shadow-lg space-y-2">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Engine lines instead of {plyInfo.san}</h4>
              {plyInfo.lines.map((l, i) => (
                <button
                  key={i}
                  onClick={() => loadLine(ply - 1, l.san)}
                  className="w-full text-left flex items-start gap-2 p-2 rounded-lg bg-[#1b1916] hover:bg-[#2c2823] border border-stone-800 transition"
                  title="Play this line on the board"
                >
                  <span
                    className={`shrink-0 w-14 text-center font-mono text-xs font-black rounded px-1 py-0.5 ${
                      barScore(l.score) >= 0 ? 'bg-stone-100 text-stone-900' : 'bg-stone-900 text-stone-100 border border-stone-700'
                    }`}
                  >
                    {formatScore(l.score)}
                  </span>
                  <span className="font-mono text-xs text-stone-300 leading-relaxed">
                    {formatLine(main.fens[ply - 1], l.san, 10)}
                    {l.san[0] === plyInfo.san && <span className="ml-1 text-emerald-400 font-sans font-bold">(your move)</span>}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Move list */}
          <div className="bg-[#24211d] border border-stone-800 rounded-xl p-3 shadow-lg">
            <div className="flex items-center justify-between mb-2 px-1">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Moves</h4>
              {!progress && (
                <div className="flex items-center gap-1">
                  {DEPTHS.map((d) => (
                    <button
                      key={d.depth}
                      onClick={() => setDepth(d.depth)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        depth === d.depth ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                  <button
                    onClick={() => runAnalysis(depth)}
                    className="ml-1 px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-bold flex items-center gap-1"
                    title="Run the analysis again at the selected depth"
                  >
                    <RefreshCw className="w-3 h-3" /> {analysis ? 'Re-analyse' : 'Analyse'}
                  </button>
                </div>
              )}
            </div>
            <div ref={listRef} className="relative max-h-72 overflow-y-auto space-y-0.5 font-mono text-xs pr-1">
              <button
                data-active={!variation && ply === 0}
                onClick={() => goTo(0)}
                className={`w-full text-left px-2 py-1 rounded text-[11px] ${
                  !variation && ply === 0 ? 'bg-amber-500/25 text-white' : 'text-stone-500 hover:bg-stone-800'
                }`}
              >
                Start position
              </button>
              {moveRows.map((i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="text-stone-500 w-7 text-right pr-1">{i + 1}.</span>
                  <MoveCell index={i * 2} />
                  <MoveCell index={i * 2 + 1} />
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          {analysis && counts && (
            <div className="bg-[#24211d] border border-stone-800 rounded-xl p-4 shadow-lg space-y-3">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Game report</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div />
                <div className="text-xs font-bold text-stone-300">{saved.white}</div>
                <div className="text-xs font-bold text-stone-300">{saved.black}</div>
                <div className="text-left text-xs text-stone-400">Accuracy</div>
                <div className="text-lg font-black text-white">{analysis.accuracy.w.toFixed(1)}</div>
                <div className="text-lg font-black text-white">{analysis.accuracy.b.toFixed(1)}</div>
                {MOVE_CLASS_ORDER.map((c) => (
                  <React.Fragment key={c}>
                    <div className="text-left text-xs text-stone-300 flex items-center gap-1.5">
                      <ClassBadge cls={c} /> {MOVE_CLASS_INFO[c].label}
                    </div>
                    <div className={`text-sm font-bold ${MOVE_CLASS_INFO[c].text}`}>{counts.w[c]}</div>
                    <div className={`text-sm font-bold ${MOVE_CLASS_INFO[c].text}`}>{counts.b[c]}</div>
                  </React.Fragment>
                ))}
              </div>
              {moments.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-stone-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Your key moments</div>
                  {moments.map((m) => (
                    <button
                      key={m.ply}
                      onClick={() => goTo(m.ply)}
                      className="w-full flex items-center gap-2 text-left text-xs p-1.5 rounded hover:bg-stone-800"
                    >
                      <ClassBadge cls={m.classification} />
                      <span className="font-mono text-stone-200">
                        {Math.ceil(m.ply / 2)}
                        {m.color === 'w' ? '.' : '...'}
                        {m.san}
                      </span>
                      <span className="text-stone-400">
                        {m.classification === 'genial' ? 'brilliant find' : `best was ${m.bestSan} (−${m.winLoss.toFixed(0)}%)`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
