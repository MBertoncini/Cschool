import React, { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Shield,
  Swords,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { Opening, OpeningMoveAnnotation } from '../types/chess';
import { OPENINGS } from '../data/openings';
import { ChessBoard } from '../components/ChessBoard';
import { useProgress } from '../context/ProgressContext';
import { sounds } from '../engine/sound';

export const OpeningsView: React.FC = () => {
  const { studyOpening } = useProgress();

  const [selectedOpening, setSelectedOpening] = useState<Opening>(OPENINGS[0]);
  const [currentPly, setCurrentPly] = useState<number>(0);
  const [game, setGame] = useState<Chess>(new Chess());
  const [historyFens, setHistoryFens] = useState<string[]>([new Chess().fen()]);

  // Practice / Test memory mode
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);
  const [practiceSuccess, setPracticeSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedOpening) return;

    const g = new Chess();
    const fens: string[] = [g.fen()];

    for (const m of selectedOpening.moves) {
      try {
        g.move({ from: m.from, to: m.to });
        fens.push(g.fen());
      } catch {
        fens.push(g.fen());
      }
    }

    setHistoryFens(fens);
    setCurrentPly(0);
    setGame(new Chess(fens[0]));
    setIsPracticeMode(false);
    setPracticeSuccess(false);

    studyOpening(selectedOpening.id);
  }, [selectedOpening]);

  const goToPly = (ply: number) => {
    if (ply < 0 || ply >= historyFens.length) return;
    setCurrentPly(ply);
    setGame(new Chess(historyFens[ply]));

    if (ply > 0) {
      const move = selectedOpening.moves[ply - 1];
      if (move?.san?.includes('x')) {
        sounds.playCapture();
      } else {
        sounds.playMove();
      }
    }
  };

  const handleNext = () => {
    if (currentPly < selectedOpening.moves.length) {
      goToPly(currentPly + 1);
    }
  };

  const handlePrev = () => {
    if (currentPly > 0) {
      goToPly(currentPly - 1);
    }
  };

  // Practice Move handler (User plays opening from memory)
  const handlePracticeMove = (move: { from: Square; to: Square; promotion?: string }) => {
    if (!isPracticeMode || practiceSuccess) return;

    const expectedMove = selectedOpening.moves[currentPly];
    if (!expectedMove) return;

    if (move.from === expectedMove.from && move.to === expectedMove.to) {
      // User made the correct theoretical move!
      sounds.playSuccess();
      const nextPly = currentPly + 1;
      goToPly(nextPly);

      // Check if opening sequence finished
      if (nextPly >= selectedOpening.moves.length) {
        setPracticeSuccess(true);
        sounds.playSuccess();
        return;
      }

      // If next move is opponent's move, play it automatically after a brief delay
      const opponentMove = selectedOpening.moves[nextPly];
      if (opponentMove) {
        setTimeout(() => {
          goToPly(nextPly + 1);
          if (nextPly + 1 >= selectedOpening.moves.length) {
            setPracticeSuccess(true);
            sounds.playSuccess();
          }
        }, 500);
      }
    } else {
      sounds.playMistake();
    }
  };

  const currentMoveAnnotation: OpeningMoveAnnotation | null =
    currentPly > 0 ? selectedOpening.moves[currentPly - 1] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Openings Repertoire & Trainer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Master Every Opening Idea
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm mt-1">
            Learn the strategic plans and the "why" behind each move instead of blindly memorizing notation.
          </p>
        </div>

        {/* Practice Mode Toggle */}
        <button
          onClick={() => {
            setIsPracticeMode(!isPracticeMode);
            goToPly(0);
            setPracticeSuccess(false);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
            isPracticeMode
              ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
              : 'bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{isPracticeMode ? 'Exit Trainer' : 'Test Your Memory'}</span>
        </button>
      </div>

      {/* Opening Selector Carousel/Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {OPENINGS.map((op) => (
          <button
            key={op.id}
            onClick={() => setSelectedOpening(op)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-2 ${
              selectedOpening.id === op.id
                ? 'bg-amber-500 text-stone-950 shadow-md scale-105'
                : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700 border border-stone-700'
            }`}
          >
            <span>{op.name}</span>
            <span className="text-[10px] opacity-75 font-mono">({op.eco})</span>
          </button>
        ))}
      </div>

      {/* Main Board & Theory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Chess Board */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <ChessBoard
            game={game}
            interactive={isPracticeMode}
            onMove={isPracticeMode ? handlePracticeMove : undefined}
            arrow={!isPracticeMode && currentMoveAnnotation?.arrow ? currentMoveAnnotation.arrow : null}
            lastMove={
              currentMoveAnnotation
                ? { from: currentMoveAnnotation.from, to: currentMoveAnnotation.to }
                : null
            }
          />

          {/* Stepper Controls */}
          {!isPracticeMode ? (
            <div className="w-full max-w-[540px] mt-4 flex items-center justify-between bg-[#24211d] border border-stone-800 rounded-xl p-2.5 shadow-md">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPly(0)}
                  disabled={currentPly === 0}
                  className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-200"
                  title="First Move"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handlePrev}
                  disabled={currentPly === 0}
                  className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-200"
                  title="Previous Move"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center font-bold text-xs text-stone-300">
                {currentPly === 0 ? (
                  <span>Starting Position</span>
                ) : (
                  <span>
                    Move {Math.ceil(currentPly / 2)} ({currentPly % 2 === 1 ? 'White' : 'Black'}:{' '}
                    <span className="text-amber-400 font-mono text-sm">{currentMoveAnnotation?.san}</span>)
                  </span>
                )}
                <span className="block text-[10px] text-stone-500 font-medium">
                  Ply {currentPly} / {selectedOpening.moves.length}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleNext}
                  disabled={currentPly >= selectedOpening.moves.length}
                  className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-stone-950 font-bold"
                  title="Next Move"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => goToPly(selectedOpening.moves.length)}
                  disabled={currentPly >= selectedOpening.moves.length}
                  className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-200"
                  title="Last Move"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Practice Mode Banner */
            <div className="w-full max-w-[540px] mt-4 p-3 rounded-xl bg-[#24211d] border border-stone-800 text-center space-y-2">
              {practiceSuccess ? (
                <div className="text-emerald-400 font-bold text-sm flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Flawless! You played the full theoretical line from memory!</span>
                </div>
              ) : (
                <div className="text-xs text-stone-300">
                  Play the theoretical moves on the board! Move {Math.ceil((currentPly + 1) / 2)} (
                  {currentPly % 2 === 0 ? 'White' : 'Black'}).
                </div>
              )}
              <button
                onClick={() => {
                  goToPly(0);
                  setPracticeSuccess(false);
                }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
              >
                <RotateCcw className="w-3 h-3" /> Reset Practice
              </button>
            </div>
          )}
        </div>

        {/* Right: Theory & Strategic Plans */}
        <div className="lg:col-span-5 space-y-4">
          {/* Opening Header */}
          <div className="bg-[#24211d] border border-stone-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                {selectedOpening.eco} • {selectedOpening.difficulty}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                Plays as: {selectedOpening.side}
              </span>
            </div>

            <h2 className="text-xl font-black text-white">{selectedOpening.name}</h2>
            <p className="text-xs text-stone-300 leading-relaxed">{selectedOpening.overview}</p>
          </div>

          {/* Move Annotation */}
          {currentMoveAnnotation && !isPracticeMode && (
            <div className="bg-[#1e1c18] border border-stone-800 rounded-xl p-5 space-y-3 shadow-xl animate-in fade-in">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="text-lg font-black text-amber-400 font-mono">
                  {currentMoveAnnotation.san}
                </span>
                <span className="text-xs text-stone-400">
                  {currentPly % 2 === 1 ? 'White move' : 'Black response'}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                  Why play this move?
                </h4>
                <p className="text-xs text-stone-200 leading-relaxed font-medium">
                  {currentMoveAnnotation.commentary}
                </p>
              </div>

              <div className="p-3 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-0.5">
                  Grandmaster Logic
                </div>
                <p className="text-xs text-stone-200 italic">
                  "{currentMoveAnnotation.grandmasterLogic}"
                </p>
              </div>

              {currentMoveAnnotation.whiteThreat && (
                <div className="text-xs text-rose-300 bg-rose-950/30 p-2 rounded border border-rose-900/40">
                  <b>Threat:</b> {currentMoveAnnotation.whiteThreat}
                </div>
              )}
            </div>
          )}

          {/* Master Plans for White and Black */}
          <div className="bg-[#24211d] border border-stone-800 rounded-xl p-5 space-y-4 shadow-lg">
            {/* White Plan */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5" />
                <span>White's Strategic Plan</span>
              </h4>
              <ul className="text-xs text-stone-300 space-y-1 pl-4 list-disc marker:text-emerald-500">
                {selectedOpening.whiteMainPlan.map((plan, i) => (
                  <li key={i}>{plan}</li>
                ))}
              </ul>
            </div>

            {/* Black Plan */}
            <div className="space-y-1.5 pt-2 border-t border-stone-800">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Black's Counter Plan</span>
              </h4>
              <ul className="text-xs text-stone-300 space-y-1 pl-4 list-disc marker:text-blue-500">
                {selectedOpening.blackMainPlan.map((plan, i) => (
                  <li key={i}>{plan}</li>
                ))}
              </ul>
            </div>

            {/* Pitfalls */}
            <div className="space-y-1.5 pt-2 border-t border-stone-800">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Common Beginner Mistakes</span>
              </h4>
              <ul className="text-xs text-stone-300 space-y-1 pl-4 list-disc marker:text-rose-500">
                {selectedOpening.commonMistakes.map((mistake, i) => (
                  <li key={i}>{mistake}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
