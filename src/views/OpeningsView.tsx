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
      sounds.playSuccess();
      const nextPly = currentPly + 1;
      goToPly(nextPly);

      if (nextPly >= selectedOpening.moves.length) {
        setPracticeSuccess(true);
        sounds.playSuccess();
        return;
      }

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-wood-750">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-serif font-bold text-brass uppercase tracking-widest mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Opening Principles & Plans</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-wood-100">
            Master Opening Architecture
          </h1>
          <p className="text-wood-400 text-xs sm:text-sm mt-1 font-sans">
            Comprehend the grandmaster motives and pawn structures behind each opening rather than memorizing blind notation.
          </p>
        </div>

        {/* Practice Mode Toggle */}
        <button
          onClick={() => {
            setIsPracticeMode(!isPracticeMode);
            goToPly(0);
            setPracticeSuccess(false);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-serif font-bold uppercase tracking-wider transition flex items-center gap-2 border ${
            isPracticeMode
              ? 'wood-btn-brass text-wood-950 shadow-brass-raised'
              : 'wood-btn text-wood-200 border-wood-650'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{isPracticeMode ? 'Exit Trainer' : 'Test Memory'}</span>
        </button>
      </div>

      {/* Opening Selector Carousel/Pills */}
      <div className="flex items-center gap-2 overflow-x-auto p-1 wood-well rounded-xl border border-wood-850">
        {OPENINGS.map((op) => (
          <button
            key={op.id}
            onClick={() => setSelectedOpening(op)}
            className={`px-3.5 py-2 rounded-lg text-xs font-serif font-bold shrink-0 transition flex items-center gap-2 ${
              selectedOpening.id === op.id
                ? 'wood-tab-active text-brass font-bold'
                : 'text-wood-400 hover:text-wood-200'
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
            <div className="w-full max-w-[540px] mt-4 flex items-center justify-between wood-panel border border-wood-700 rounded-xl p-2.5 shadow-wood-raised">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => goToPly(0)}
                  disabled={currentPly === 0}
                  className="p-2 rounded-lg wood-btn disabled:opacity-30 text-wood-200"
                  title="First Move"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handlePrev}
                  disabled={currentPly === 0}
                  className="p-2 rounded-lg wood-btn disabled:opacity-30 text-wood-200"
                  title="Previous Move"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center font-bold text-xs text-wood-300">
                {currentPly === 0 ? (
                  <span className="font-serif text-wood-400">Starting Position</span>
                ) : (
                  <span className="font-serif">
                    Move {Math.ceil(currentPly / 2)} ({currentPly % 2 === 1 ? 'White' : 'Black'}:{' '}
                    <span className="text-brass font-mono font-bold text-sm">{currentMoveAnnotation?.san}</span>)
                  </span>
                )}
                <span className="block text-[10px] text-wood-500 font-mono mt-0.5">
                  Ply {currentPly} / {selectedOpening.moves.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleNext}
                  disabled={currentPly >= selectedOpening.moves.length}
                  className="p-2 rounded-lg wood-btn-brass disabled:opacity-30 text-wood-950 font-bold"
                  title="Next Move"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => goToPly(selectedOpening.moves.length)}
                  disabled={currentPly >= selectedOpening.moves.length}
                  className="p-2 rounded-lg wood-btn disabled:opacity-30 text-wood-200"
                  title="Last Move"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Practice Feedback Bar */
            <div className="w-full max-w-[540px] mt-4 wood-panel border border-wood-700 rounded-xl p-4 shadow-wood-raised text-center">
              {practiceSuccess ? (
                <div className="space-y-2 animate-in zoom-in-95">
                  <div className="w-10 h-10 rounded-full wood-well border border-brass flex items-center justify-center text-brass mx-auto shadow-wood-inset">
                    <CheckCircle2 className="w-5 h-5 text-brass" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-wood-100">
                    Opening Sequence Mastered!
                  </h3>
                  <p className="text-xs text-wood-400">
                    You accurately recalled all theoretical moves of the {selectedOpening.name}.
                  </p>
                  <button
                    onClick={() => {
                      goToPly(0);
                      setPracticeSuccess(false);
                    }}
                    className="mt-2 px-4 py-2 rounded-xl wood-btn text-xs font-serif font-bold text-brass border border-brass/30 inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Train Again</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-xs font-serif font-bold text-brass uppercase tracking-wider block">
                    Interactive Recall Mode
                  </span>
                  <p className="text-xs text-wood-300">
                    Play the next theoretical move on the board from memory!
                  </p>
                  <span className="text-[10px] text-wood-500 font-mono block">
                    Progress: {currentPly} / {selectedOpening.moves.length} plies
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Opening Principles & Move Analysis */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Theory & Overview Box */}
          <div className="wood-panel border border-wood-700 rounded-xl p-5 shadow-wood-raised space-y-3">
            <div className="flex items-center justify-between border-b border-wood-750 pb-2">
              <span className="font-serif font-bold text-base text-wood-100">{selectedOpening.name}</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded wood-well text-brass border border-wood-750">
                {selectedOpening.eco}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-wood-300 leading-relaxed font-sans">
              {selectedOpening.overview}
            </p>

            {/* Strategic Plans Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="wood-well p-3 rounded-lg border border-wood-800 space-y-1 shadow-wood-inset">
                <span className="font-serif font-bold text-wood-200 flex items-center gap-1">
                  <Swords className="w-3.5 h-3.5 text-brass" /> White Plan:
                </span>
                <ul className="text-[11px] text-wood-400 space-y-1 list-disc list-inside">
                  {selectedOpening.whiteMainPlan.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>

              <div className="wood-well p-3 rounded-lg border border-wood-800 space-y-1 shadow-wood-inset">
                <span className="font-serif font-bold text-wood-200 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-wood-400" /> Black Plan:
                </span>
                <ul className="text-[11px] text-wood-400 space-y-1 list-disc list-inside">
                  {selectedOpening.blackMainPlan.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Current Move Annotation Box */}
          <div className="wood-panel-raised border border-wood-650 rounded-xl p-5 shadow-wood-raised-lg space-y-3">
            <div className="flex items-center justify-between border-b border-wood-750 pb-2">
              <span className="text-[10px] font-serif font-bold uppercase tracking-wider text-wood-400">
                Move {currentPly > 0 ? Math.ceil(currentPly / 2) : 0} Analysis
              </span>
              {currentMoveAnnotation && (
                <span className="font-mono text-xs font-bold text-brass">
                  {currentMoveAnnotation.san}
                </span>
              )}
            </div>

            {currentMoveAnnotation ? (
              <div className="space-y-3 animate-in fade-in">
                <p className="text-xs text-wood-200 leading-relaxed font-sans">
                  {currentMoveAnnotation.commentary}
                </p>

                <div className="wood-well p-3.5 rounded-xl border border-brass/30 space-y-1 shadow-wood-inset">
                  <div className="flex items-center gap-1.5 text-brass font-serif font-bold text-[11px] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-brass" />
                    <span>Grandmaster Architecture:</span>
                  </div>
                  <p className="text-xs text-wood-100 leading-relaxed font-sans">
                    {currentMoveAnnotation.grandmasterLogic}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-wood-400 italic font-serif">
                Select a move using the arrows under the board to inspect its theoretical motive.
              </p>
            )}
          </div>

          {/* Common Pitfalls Box */}
          {selectedOpening.commonMistakes && selectedOpening.commonMistakes.length > 0 && (
            <div className="wood-panel border border-wood-700/80 rounded-xl p-4 shadow-wood-raised space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-wood-300 uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-brass" />
                <span>Common Pitfalls</span>
              </div>
              <ul className="text-xs text-wood-400 space-y-1 list-disc list-inside font-sans">
                {selectedOpening.commonMistakes.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
