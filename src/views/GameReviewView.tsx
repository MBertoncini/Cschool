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
      className={`inline-flex items-center justify-center rounded-md font-mono font-bold text-white shrink-0 shadow-sm ${
        size === 'sm' ? 'min-w-[18px] h-4 px-1 text-[9px]' : 'min-w-[24px] h-6 px-1.5 text-xs'
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
      <div className="text-[10px] font-serif font-bold uppercase tracking-wider text-wood-400">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {motifs.map((m, i) => (
          <span key={i} title={m.detail} className={`px-2 py-0.5 rounded-md text-[11px] font-medium border cursor-help ${tone}`}>
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

  // Moving a piece on the board explores a variation
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
      arrows.push({ from: plyInfo.bestUci.slice(0, 2) as Square, to: plyInfo.bestUci.slice(2, 4) as Square, color: '#d4a359' });
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
        arrows.push({ from: m.from, to: m.to, color: '#688db5', dashed: true });
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
        <p className="text-wood-300 font-sans">This game is not in your history.</p>
        <button onClick={onBack} className="px-4 py-2 rounded-xl wood-btn-brass text-wood-950 font-bold text-sm">
          Back to Archives
        </button>
      </div>
    );
  }

  const orientation = flipped ? 'black' : 'white';
  const topName = flipped ? saved.white : saved.black;
  const bottomName = flipped ? saved.black : saved.white;
  const youColor = saved.playerColor;

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
          active ? 'wood-well text-brass font-bold ring-1 ring-brass/50' : 'hover:bg-wood-800 text-wood-200'
        } ${isYou ? 'font-bold' : 'font-medium'}`}
      >
        {a ? <ClassBadge cls={a.classification} /> : <span className="w-4 h-4 shrink-0" />}
        <span className="font-mono text-xs">{m.san}</span>
        {a && (a.classification === 'blunder' || a.classification === 'bad') && (
          <span className="ml-auto text-[10px] text-wood-500 font-mono">{formatScore(a.evalAfter)}</span>
        )}
      </button>
    );
  };

  const counts = analysis ? { w: countClasses(analysis, 'w'), b: countClasses(analysis, 'b') } : null;
  const moments = analysis ? keyMoments(analysis, youColor) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between pb-4 border-b border-wood-750">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="p-2 rounded-xl wood-btn text-wood-200" title="Back to Archives">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-wood-100 truncate">
              {saved.white} <span className="text-wood-500 font-sans font-normal text-xs">vs</span> {saved.black}
              <span className="ml-2 text-brass font-mono text-sm">{saved.result === '*' ? 'in progress' : saved.result}</span>
            </h2>
            <p className="text-xs text-wood-400 truncate font-sans">
              {new Date(saved.createdAt).toLocaleDateString()} · {N} plies
              {opening && <> · <span className="text-wood-200 font-serif">{opening.name}</span></>}
              {saved.termination && <> · {saved.termination}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyPgn}
            className="px-3.5 py-1.5 rounded-xl wood-btn text-wood-200 text-xs font-serif font-bold flex items-center gap-1.5 border border-wood-650"
          >
            <Copy className="w-3.5 h-3.5 text-brass" /> {copied ? 'Copied PGN' : 'Export PGN'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Board & Replay controls */}
        <div className="lg:col-span-7 flex flex-col items-center gap-3">
          <div className="w-full max-w-[580px] flex items-center justify-between text-xs px-1 font-serif">
            <span className="font-bold text-wood-200">{topName}</span>
            {variation && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-wood-100 wood-well border border-brass/40 px-2 py-0.5 rounded-md shadow-wood-inset">
                <GitBranch className="w-3 h-3 text-brass" /> Alternate Variation
              </span>
            )}
          </div>
          <div className="flex items-stretch justify-center gap-3.5 w-full max-w-[580px]">
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
          <div className="w-full max-w-[580px] flex items-center justify-between text-xs px-1 font-serif">
            <span className="font-bold text-wood-200">{bottomName}</span>
            <span className="text-[10px] text-wood-500 font-sans hidden sm:inline">← → navigate · ↑ ↓ start/end · drag pieces to explore lines</span>
          </div>

          {/* Navigation controls: Tactile Wood Buttons */}
          <div className="w-full max-w-[580px] grid grid-cols-6 gap-2">
            {[
              { icon: <ChevronsLeft className="w-4 h-4" />, onClick: first, title: 'Start' },
              { icon: <ChevronLeft className="w-4 h-4" />, onClick: prev, title: 'Previous' },
              { icon: <ChevronRight className="w-4 h-4" />, onClick: next, title: 'Next' },
              { icon: <ChevronsRight className="w-4 h-4" />, onClick: last, title: 'End' },
              { icon: <FlipVertical2 className="w-4 h-4" />, onClick: () => setFlipped((f) => !f), title: 'Flip board' },
              {
                icon: <Target className={`w-4 h-4 ${showEngineArrow ? 'text-brass' : ''}`} />,
                onClick: () => setShowEngineArrow((s) => !s),
                title: 'Show engine candidate arrow',
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

          {/* Eval graph */}
          <div className="w-full max-w-[580px] space-y-1.5">
            <EvalGraph plies={plies} startEval={plies[0]?.evalBefore} currentPly={variation ? variation.base : ply} onSelectPly={goTo} totalPlies={N} />
            {progress && (
              <div className="flex items-center gap-2 text-xs text-wood-400 font-sans">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brass" />
                <span>
                  Stockfish evaluating position… {progress.done}/{progress.total}
                </span>
                <div className="flex-1 h-1.5 rounded-full wood-well overflow-hidden">
                  <div className="h-full bg-brass transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
                </div>
              </div>
            )}
            {analysisError && (
              <div className="text-xs text-rose-300 wood-well border border-rose-900/50 rounded-xl p-2.5">
                Evaluation failed: {analysisError}
              </div>
            )}
          </div>
        </div>

        {/* Right: Coach, lines, moves, summary */}
        <div className="lg:col-span-5 space-y-4">
          {/* Coach card */}
          <div className="wood-panel border border-wood-700 rounded-xl p-5 shadow-wood-raised space-y-3">
            <div className="flex items-center gap-2 text-xs font-serif font-bold text-brass uppercase tracking-wider">
              <GraduationCap className="w-4 h-4" /> Grandmaster Analysis
            </div>

            {variation ? (
              <div className="space-y-3">
                <p className="text-xs text-wood-200 font-sans">
                  Exploring custom continuation from move {Math.floor(variation.base / 2) + 1}. Move any piece on the board to test ideas against the engine.
                </p>
                <div className="flex flex-wrap gap-1 font-mono text-xs">
                  {variation.moves.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setVariation({ ...variation, idx: i + 1 })}
                      className={`px-2 py-0.5 rounded text-xs ${
                        variation.idx === i + 1 ? 'wood-btn-brass text-wood-950 font-bold' : 'wood-btn text-wood-300'
                      }`}
                    >
                      {formatLine(main.fens[variation.base], variation.moves.slice(0, i + 1)).split(' ').pop()}
                    </button>
                  ))}
                </div>
                <div className="rounded-xl wood-well border border-wood-800 p-3 space-y-1.5 text-xs shadow-wood-inset">
                  <div className="flex items-center gap-2 text-wood-400 font-serif font-bold uppercase tracking-wider text-[10px]">
                    <Cpu className="w-3.5 h-3.5 text-brass" /> Engine Evaluation
                    {live?.thinking && <Loader2 className="w-3 h-3 animate-spin text-brass" />}
                  </div>
                  {terminal || boardGame.isGameOver() ? (
                    <div className="text-wood-100 font-serif font-bold">{boardGame.isCheckmate() ? 'Checkmate!' : 'Drawn position.'}</div>
                  ) : live?.line ? (
                    <div className="space-y-1">
                      <div className="text-brass font-bold font-mono">{formatScore(live.line.score)}</div>
                      <button
                        className="text-left text-wood-300 font-mono hover:text-wood-100 text-xs"
                        onClick={() =>
                          setVariation({
                            ...variation,
                            moves: [...variation.moves.slice(0, variation.idx), ...live.line!.san],
                            idx: variation.idx + 1,
                          })
                        }
                        title="Play engine continuation"
                      >
                        Best: {formatLine(currentFen, live.line.san, 8)}
                      </button>
                    </div>
                  ) : (
                    <div className="text-wood-500 font-sans">Evaluating position…</div>
                  )}
                </div>
                <MotifChips title="Patterns in played move" motifs={variationMotifs} tone="wood-well text-wood-200 border-wood-750" />
                <button
                  onClick={exitVariation}
                  className="w-full py-2 rounded-xl wood-btn text-wood-200 text-xs font-serif font-bold flex items-center justify-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" /> Return to Game (Esc)
                </button>
              </div>
            ) : ply === 0 ? (
              <p className="text-xs text-wood-300 leading-relaxed font-sans">
                {N === 0
                  ? 'No moves recorded in this match.'
                  : analysis
                    ? `Use the arrow buttons to step through the moves. Stockfish evaluates every positional shift, identifies tactical motifs, and recommends alternative lines.`
                    : 'Evaluating your match with Stockfish — you can already browse the moves.'}
              </p>
            ) : !plyInfo ? (
              <p className="text-xs text-wood-400 flex items-center gap-2 font-sans">
                <Loader2 className="w-4 h-4 animate-spin text-brass" /> Evaluating move {Math.ceil(ply / 2)}…
              </p>
            ) : notes ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <ClassBadge cls={plyInfo.classification} size="md" />
                  <div>
                    <div className={`text-xs font-bold font-serif ${MOVE_CLASS_INFO[plyInfo.classification].text}`}>
                      {MOVE_CLASS_INFO[plyInfo.classification].label}
                      <span className="ml-2 text-wood-400 font-mono text-[11px]">
                        {formatScore(plyInfo.evalBefore)} → {formatScore(plyInfo.evalAfter)}
                      </span>
                    </div>
                    <div className="text-sm font-serif font-bold text-wood-100">{notes.headline}</div>
                  </div>
                </div>
                {notes.paragraphs.map((t, i) => (
                  <p key={i} className="text-xs text-wood-300 leading-relaxed font-sans">
                    {t}
                  </p>
                ))}
                <MotifChips title="Tactical motifs detected" motifs={notes.motifs} tone="wood-well text-wood-200 border-wood-750" />
                <MotifChips title={`Motifs in recommended ${plyInfo.bestSan}`} motifs={notes.bestMotifs} tone="wood-well text-brass border-brass/30" />
                <MotifChips title="Tactical concessions" motifs={notes.threats} tone="wood-well text-rose-300 border-rose-900/40" />
                <div className="flex flex-wrap gap-2 pt-1">
                  {plyInfo.uci !== plyInfo.bestUci && plyInfo.lines[0] && (
                    <button
                      onClick={() => loadLine(ply - 1, plyInfo.lines[0].san)}
                      className="px-3 py-1.5 rounded-lg wood-btn text-brass text-xs font-serif font-bold flex items-center gap-1.5 border border-brass/30"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Show {plyInfo.bestSan} Line
                    </button>
                  )}
                  {plyInfo.reply && plyInfo.reply.san.length > 0 && (
                    <button
                      onClick={() => loadLine(ply, plyInfo.reply!.san)}
                      className="px-3 py-1.5 rounded-lg wood-btn text-wood-300 text-xs font-serif font-medium flex items-center gap-1.5"
                    >
                      <GitBranch className="w-3.5 h-3.5" /> Refutation Line
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Alternatives (engine lines) */}
          {!variation && plyInfo && plyInfo.lines.length > 0 && (
            <div className="wood-panel border border-wood-700 rounded-xl p-4 shadow-wood-raised space-y-2">
              <h4 className="text-[10px] font-serif font-bold text-wood-400 uppercase tracking-wider">Candidate lines instead of {plyInfo.san}</h4>
              {plyInfo.lines.map((l, i) => (
                <button
                  key={i}
                  onClick={() => loadLine(ply - 1, l.san)}
                  className="w-full text-left flex items-start gap-2 p-2 rounded-lg wood-well hover:wood-panel border border-wood-800 transition"
                  title="Play this line on the board"
                >
                  <span
                    className={`shrink-0 w-14 text-center font-mono text-xs font-bold rounded px-1 py-0.5 ${
                      barScore(l.score) >= 0 ? 'wood-btn-brass text-wood-950' : 'wood-well text-wood-100 border border-wood-700'
                    }`}
                  >
                    {formatScore(l.score)}
                  </span>
                  <span className="font-mono text-xs text-wood-300 leading-relaxed">
                    {formatLine(main.fens[ply - 1], l.san, 10)}
                    {l.san[0] === plyInfo.san && <span className="ml-1 text-brass font-serif font-bold">(played)</span>}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Move list: Tactile Move Box */}
          <div className="wood-panel border border-wood-700 rounded-xl p-3.5 shadow-wood-raised">
            <div className="flex items-center justify-between mb-2 px-1">
              <h4 className="text-[10px] font-serif font-bold text-wood-400 uppercase tracking-wider">Notation</h4>
              {!progress && (
                <div className="flex items-center gap-1">
                  {DEPTHS.map((d) => (
                    <button
                      key={d.depth}
                      onClick={() => setDepth(d.depth)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        depth === d.depth ? 'wood-btn-brass text-wood-950' : 'wood-btn text-wood-400'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                  <button
                    onClick={() => runAnalysis(depth)}
                    className="ml-1 px-2.5 py-0.5 rounded-lg wood-btn text-wood-200 text-[10px] font-serif font-bold flex items-center gap-1"
                    title="Re-run engine analysis"
                  >
                    <RefreshCw className="w-3 h-3 text-brass" /> {analysis ? 'Re-analyse' : 'Analyse'}
                  </button>
                </div>
              )}
            </div>
            <div ref={listRef} className="relative max-h-72 overflow-y-auto space-y-0.5 font-mono text-xs pr-1 wood-well p-2 rounded-xl border border-wood-850 shadow-wood-inset">
              <button
                data-active={!variation && ply === 0}
                onClick={() => goTo(0)}
                className={`w-full text-left px-2 py-1 rounded text-[11px] ${
                  !variation && ply === 0 ? 'wood-btn-brass text-wood-950 font-bold' : 'text-wood-500 hover:bg-wood-800'
                }`}
              >
                Starting Position
              </button>
              {moveRows.map((i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="text-wood-500 w-7 text-right pr-1 font-mono">{i + 1}.</span>
                  <MoveCell index={i * 2} />
                  <MoveCell index={i * 2 + 1} />
                </div>
              ))}
            </div>
          </div>

          {/* Game Report Summary */}
          {analysis && counts && (
            <div className="wood-panel border border-wood-700 rounded-xl p-5 shadow-wood-raised space-y-3">
              <h4 className="text-[10px] font-serif font-bold text-wood-400 uppercase tracking-wider">Evaluation Report</h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div />
                <div className="font-serif font-bold text-wood-200">{saved.white}</div>
                <div className="font-serif font-bold text-wood-200">{saved.black}</div>
                <div className="text-left font-serif text-wood-400">Accuracy</div>
                <div className="text-base font-bold text-wood-100 font-mono">{analysis.accuracy.w.toFixed(1)}%</div>
                <div className="text-base font-bold text-wood-100 font-mono">{analysis.accuracy.b.toFixed(1)}%</div>
                {MOVE_CLASS_ORDER.map((c) => (
                  <React.Fragment key={c}>
                    <div className="text-left text-wood-300 flex items-center gap-1.5 font-mono">
                      <ClassBadge cls={c} /> {MOVE_CLASS_INFO[c].label}
                    </div>
                    <div className={`font-bold font-mono ${MOVE_CLASS_INFO[c].text}`}>{counts.w[c]}</div>
                    <div className={`font-bold font-mono ${MOVE_CLASS_INFO[c].text}`}>{counts.b[c]}</div>
                  </React.Fragment>
                ))}
              </div>
              {moments.length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-wood-750">
                  <div className="text-[10px] font-serif font-bold uppercase tracking-wider text-wood-400">Key Moments</div>
                  {moments.map((m) => (
                    <button
                      key={m.ply}
                      onClick={() => goTo(m.ply)}
                      className="w-full flex items-center gap-2 text-left text-xs p-1.5 rounded-lg wood-well hover:wood-panel border border-wood-800 transition"
                    >
                      <ClassBadge cls={m.classification} />
                      <span className="font-mono text-wood-200">
                        {Math.ceil(m.ply / 2)}
                        {m.color === 'w' ? '.' : '...'}
                        {m.san}
                      </span>
                      <span className="text-wood-400 text-[11px] font-sans">
                        {m.classification === 'genial' ? 'exceptional move' : `preferred ${m.bestSan} (−${m.winLoss.toFixed(0)}%)`}
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
