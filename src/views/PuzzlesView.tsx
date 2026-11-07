import React, { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import {
  Sparkles,
  Zap,
  RotateCcw,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { TacticalPuzzle } from '../types/chess';
import { PUZZLES } from '../data/puzzles';
import { ChessBoard } from '../components/ChessBoard';
import { useProgress } from '../context/ProgressContext';
import { sounds } from '../engine/sound';

export const PuzzlesView: React.FC = () => {
  const { progress, recordPuzzleResult } = useProgress();

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [activeTheme, setActiveTheme] = useState<string>('all');
  const [game, setGame] = useState<Chess>(new Chess());
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [isFailed, setIsFailed] = useState<boolean>(false);
  const [puzzleStreak, setPuzzleStreak] = useState<number>(0);

  const filteredPuzzles = PUZZLES.filter(
    (p) => activeTheme === 'all' || p.themeCategory === activeTheme
  );

  const currentPuzzle: TacticalPuzzle = filteredPuzzles[currentIdx] || PUZZLES[0];

  useEffect(() => {
    loadPuzzle(currentPuzzle);
  }, [currentPuzzle]);

  const loadPuzzle = (puz: TacticalPuzzle) => {
    try {
      const g = new Chess(puz.fen);
      setGame(g);
    } catch {
      setGame(new Chess());
    }
    setShowHint(false);
    setIsSolved(false);
    setIsFailed(false);
  };

  const handleMove = (move: { from: Square; to: Square; promotion?: string }) => {
    if (isSolved) return;

    const expected = currentPuzzle.solutionMoves[0];
    const isCorrect = move.from === expected.from && move.to === expected.to;

    try {
      const nextGame = new Chess(game.fen());
      const res = nextGame.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q',
      });

      if (!res) return;

      if (isCorrect) {
        setGame(nextGame);
        setIsSolved(true);
        setIsFailed(false);
        setPuzzleStreak((s) => s + 1);
        recordPuzzleResult(currentPuzzle.id, true, 15);
      } else {
        sounds.playMistake();
        setIsFailed(true);
        setPuzzleStreak(0);
        recordPuzzleResult(currentPuzzle.id, false, -10);
      }
    } catch {
      sounds.playMistake();
      setIsFailed(true);
    }
  };

  const handleNextPuzzle = () => {
    const nextIdx = (currentIdx + 1) % filteredPuzzles.length;
    setCurrentIdx(nextIdx);
  };

  const handleReset = () => {
    loadPuzzle(currentPuzzle);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      {/* Top Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-wood-750">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-serif font-bold text-brass uppercase tracking-widest mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Tactical Training Arena</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-wood-100">
            Sharp Tactical Calculation
          </h1>
          <p className="text-wood-400 text-xs sm:text-sm mt-1 font-sans">
            Build decisive pattern recognition for forks, pins, skewers, and back-rank checkmates.
          </p>
        </div>

        {/* Rating and Streak Badges */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl wood-panel border border-wood-700/80 flex items-center gap-2.5 shadow-wood-raised">
            <Zap className="w-4 h-4 text-brass" />
            <div>
              <span className="text-[10px] text-wood-400 font-serif uppercase font-bold block leading-none">
                Tactics Rating
              </span>
              <span className="text-base font-bold text-wood-100 font-mono">{progress.tacticsRating}</span>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl wood-panel border border-wood-700/80 flex items-center gap-2.5 shadow-wood-raised">
            <Flame className="w-4 h-4 text-brass" />
            <div>
              <span className="text-[10px] text-wood-400 font-serif uppercase font-bold block leading-none">
                Streak
              </span>
              <span className="text-base font-bold text-brass font-mono">{puzzleStreak}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1 wood-well rounded-xl border border-wood-850">
        {[
          { id: 'all', label: 'All Motifs' },
          { id: 'fork', label: 'Forks' },
          { id: 'pin', label: 'Pins' },
          { id: 'skewer', label: 'Skewers' },
          { id: 'back-rank', label: 'Back-Rank Mates' },
          { id: 'discovered-attack', label: 'Discovered Attacks' },
          { id: 'endgame', label: 'Endgames' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTheme(t.id);
              setCurrentIdx(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold shrink-0 transition ${
              activeTheme === t.id
                ? 'wood-tab-active text-brass font-bold'
                : 'text-wood-400 hover:text-wood-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Board & Puzzle Solve Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: The ChessBoard */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <ChessBoard
            game={game}
            onMove={handleMove}
            orientation={currentPuzzle.turn === 'w' ? 'white' : 'black'}
            interactive={!isSolved}
            highlightSquares={
              showHint && currentPuzzle.solutionMoves[0]
                ? [currentPuzzle.solutionMoves[0].from]
                : []
            }
          />

          <div className="w-full max-w-[540px] mt-4 flex items-center justify-between text-xs text-wood-400 font-mono">
            <span>
              Position {currentIdx + 1} of {filteredPuzzles.length}
            </span>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg wood-btn text-wood-300 hover:text-wood-100 text-xs font-serif font-medium transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Position</span>
            </button>
          </div>
        </div>

        {/* Right: Puzzle Objective & Solution Info */}
        <div className="lg:col-span-5 space-y-4">
          <div className="wood-panel border border-wood-700 rounded-xl p-5 shadow-wood-raised space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-serif font-bold text-brass uppercase tracking-wider">
                {currentPuzzle.theme} • Rating {currentPuzzle.rating}
              </span>
              <span className="text-[11px] font-serif font-bold px-2 py-0.5 rounded wood-well text-wood-300 border border-wood-750">
                {currentPuzzle.turn === 'w' ? 'White to Move' : 'Black to Move'}
              </span>
            </div>

            <h2 className="font-serif text-xl font-bold text-wood-100">{currentPuzzle.title}</h2>
            <p className="text-xs sm:text-sm text-wood-300 leading-relaxed font-sans font-medium">
              {currentPuzzle.description}
            </p>
          </div>

          {/* Outcome Feedback */}
          {isSolved && (
            <div className="p-4 rounded-xl wood-well border border-brass/50 text-wood-100 space-y-2 shadow-wood-inset animate-in fade-in">
              <div className="flex items-center gap-2 font-serif font-bold text-sm text-brass">
                <CheckCircle2 className="w-5 h-5 text-brass" />
                <span>Tactical Solution Found! (+15 Rating, +25 XP)</span>
              </div>
              <p className="text-xs leading-relaxed text-wood-200 font-sans">
                {currentPuzzle.explanation}
              </p>
              <button
                onClick={handleNextPuzzle}
                className="w-full mt-2 py-2.5 rounded-xl wood-btn-brass text-wood-950 font-serif font-bold text-xs uppercase tracking-wider shadow-brass-raised transition flex items-center justify-center gap-1.5"
              >
                <span>Next Tactical Problem</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {isFailed && (
            <div className="p-4 rounded-xl wood-well border border-rose-900/50 text-rose-200 space-y-2 shadow-wood-inset animate-in fade-in">
              <div className="flex items-center gap-2 font-serif font-bold text-sm text-rose-400">
                <XCircle className="w-5 h-5" />
                <span>Sub-optimal line played (-10 Rating)</span>
              </div>
              <p className="text-xs text-wood-300 font-sans">
                Review candidate moves carefully or click <b>"Need a Hint?"</b> to spot the motif.
              </p>
            </div>
          )}

          {/* Hint Card */}
          {showHint && (
            <div className="p-3.5 rounded-xl wood-well border border-brass/35 text-xs text-brass space-y-1 shadow-wood-inset animate-in fade-in font-sans">
              <div className="font-serif font-bold flex items-center gap-1.5 text-brass">
                <Lightbulb className="w-4 h-4" />
                <span>Tactical Hint</span>
              </div>
              <p className="leading-relaxed">{currentPuzzle.hint}</p>
            </div>
          )}

          {/* Actions */}
          {!isSolved && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHint(true)}
                className="flex-1 py-2.5 rounded-xl wood-btn text-brass text-xs font-serif font-bold border border-brass/30 transition flex items-center justify-center gap-1.5"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Need a Hint?</span>
              </button>

              <button
                onClick={handleNextPuzzle}
                className="py-2.5 px-4 rounded-xl wood-btn text-wood-300 hover:text-wood-100 text-xs font-serif font-semibold border border-wood-700 transition"
              >
                Skip &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
