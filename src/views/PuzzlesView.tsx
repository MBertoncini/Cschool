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
  Award,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Tactical Puzzle Arena</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Sharp Tactical Calculation
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm mt-1">
            Build pattern recognition for forks, pins, skewers, and back-rank checkmates.
          </p>
        </div>

        {/* Rating and Streak Badges */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-[#24211d] border border-stone-800 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-bold block leading-none">
                Puzzle Rating
              </span>
              <span className="text-base font-black text-white">{progress.tacticsRating}</span>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <div>
              <span className="text-[10px] text-orange-300 uppercase font-bold block leading-none">
                Streak
              </span>
              <span className="text-base font-black text-orange-400">{puzzleStreak}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
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
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition ${
              activeTheme === t.id
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
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

          <div className="w-full max-w-[540px] mt-4 flex items-center justify-between text-xs text-stone-400">
            <span>
              Puzzle {currentIdx + 1} of {filteredPuzzles.length}
            </span>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Board</span>
            </button>
          </div>
        </div>

        {/* Right: Puzzle Objective & Solution Info */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#24211d] border border-stone-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {currentPuzzle.theme} • Rating {currentPuzzle.rating}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                {currentPuzzle.turn === 'w' ? 'White to Move' : 'Black to Move'}
              </span>
            </div>

            <h2 className="text-xl font-black text-white">{currentPuzzle.title}</h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-medium">
              {currentPuzzle.description}
            </p>
          </div>

          {/* Outcome Feedback */}
          {isSolved && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-600/50 text-emerald-200 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span>Puzzle Solved! (+15 Rating, +25 XP)</span>
              </div>
              <p className="text-xs leading-relaxed text-emerald-200/90 font-medium">
                {currentPuzzle.explanation}
              </p>
              <button
                onClick={handleNextPuzzle}
                className="w-full mt-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
              >
                <span>Next Puzzle</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {isFailed && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-600/50 text-rose-200 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-400">
                <XCircle className="w-5 h-5" />
                <span>That move wasn't best (-10 Rating)</span>
              </div>
              <p className="text-xs text-rose-300">
                Don't worry! Try calculating again or click <b>"Need a Hint?"</b> below.
              </p>
            </div>
          )}

          {/* Hint Card */}
          {showHint && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-600/40 text-xs text-amber-200 space-y-1 animate-in fade-in">
              <div className="font-bold flex items-center gap-1.5 text-amber-400">
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
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-bold border border-stone-700 transition flex items-center justify-center gap-1.5"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Need a Hint?</span>
              </button>

              <button
                onClick={handleNextPuzzle}
                className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-700 transition"
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
