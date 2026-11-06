import React, { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import {
  GraduationCap,
  Lightbulb,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  ChevronLeft,
} from 'lucide-react';
import { Lesson, LessonCategory } from '../types/chess';
import { LESSONS } from '../data/lessons';
import { ChessBoard } from '../components/ChessBoard';
import { useProgress } from '../context/ProgressContext';
import { sounds } from '../engine/sound';

export const LessonsView: React.FC = () => {
  const { progress, completeLesson } = useProgress();

  const [activeCategory, setActiveCategory] = useState<LessonCategory | 'all'>('all');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);

  // Board state
  const [game, setGame] = useState<Chess>(new Chess());
  const [showHint, setShowHint] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | null; message: string }>({
    type: null,
    message: '',
  });
  const [stepSolved, setStepSolved] = useState<boolean>(false);

  // Load lesson
  useEffect(() => {
    if (selectedLesson) {
      setCurrentStepIdx(0);
      loadStep(selectedLesson, 0);
    }
  }, [selectedLesson]);

  const loadStep = (lesson: Lesson, stepIdx: number) => {
    const step = lesson.steps[stepIdx];
    if (!step) return;

    try {
      const g = new Chess(step.fen);
      setGame(g);
    } catch {
      setGame(new Chess());
    }
    setShowHint(false);
    setStepSolved(false);
    setFeedback({ type: null, message: '' });
  };

  const currentStep = selectedLesson ? selectedLesson.steps[currentStepIdx] : null;

  const handleUserMove = (move: { from: Square; to: Square; promotion?: string }) => {
    if (!selectedLesson || !currentStep || stepSolved) return;

    const expected = currentStep.expectedMove;
    const isCorrect =
      move.from === expected.from &&
      move.to === expected.to &&
      (!expected.promotion || move.promotion === expected.promotion);

    // Try making the move on the board
    try {
      const nextGame = new Chess(game.fen());
      const res = nextGame.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q',
      });

      if (!res) {
        sounds.playMistake();
        return;
      }

      if (isCorrect) {
        sounds.playSuccess();
        setGame(nextGame);
        setStepSolved(true);
        setFeedback({
          type: 'correct',
          message: currentStep.explanation,
        });

        // Check if there is an opponent automated reply or follow-up in this step
        if (currentStep.followUpStep) {
          setTimeout(() => {
            try {
              const followUpGame = new Chess(currentStep.followUpStep!.fen);
              setGame(followUpGame);
              setStepSolved(false);
              setFeedback({
                type: null,
                message: currentStep.followUpStep!.instruction,
              });
            } catch {
              // ignore
            }
          }, 1200);
        }
      } else {
        sounds.playMistake();
        setFeedback({
          type: 'wrong',
          message: 'Not quite the best move here. Think about the lesson goal or click "Need a Hint"!',
        });
      }
    } catch {
      sounds.playMistake();
    }
  };

  const handleNextStep = () => {
    if (!selectedLesson) return;

    const nextIdx = currentStepIdx + 1;
    if (nextIdx < selectedLesson.steps.length) {
      setCurrentStepIdx(nextIdx);
      loadStep(selectedLesson, nextIdx);
    } else {
      // Completed all steps of this lesson!
      completeLesson(selectedLesson.id, selectedLesson.xpReward);
      sounds.playSuccess();
      setFeedback({
        type: 'correct',
        message: `Outstanding! You have mastered "${selectedLesson.title}" and earned +${selectedLesson.xpReward} XP!`,
      });
    }
  };

  const handleResetStep = () => {
    if (selectedLesson) {
      loadStep(selectedLesson, currentStepIdx);
    }
  };

  const filteredLessons = LESSONS.filter(
    (l) => activeCategory === 'all' || l.category === activeCategory
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-amber-400" />
            <span>Chess Academy</span>
          </h1>
          <p className="text-stone-400 text-sm mt-1">
            Master essential tactics, positional strategy, and crucial endgame techniques through hands-on board practice.
          </p>
        </div>

        {selectedLesson && (
          <button
            onClick={() => setSelectedLesson(null)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>All Lessons</span>
          </button>
        )}
      </div>

      {/* Main Content: Either Lesson Catalog or Interactive Lesson View */}
      {!selectedLesson ? (
        <div className="space-y-6">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Lessons' },
              { id: 'tactics-basics', label: '1. Basic Tactics' },
              { id: 'tactics-intermediate', label: '2. Intermediate Tactics' },
              { id: 'strategy', label: '3. Strategy & Principles' },
              { id: 'endgames', label: '4. Essential Endgames' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as LessonCategory | 'all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  activeCategory === tab.id
                    ? 'bg-amber-500 text-stone-950 shadow'
                    : 'bg-stone-800/80 hover:bg-stone-700 text-stone-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Lessons Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLessons.map((lesson) => {
              const isDone = progress.completedLessons.includes(lesson.id);
              return (
                <div
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  className={`bg-[#24211d] border rounded-xl p-5 cursor-pointer transition-all hover:scale-[1.01] hover:border-amber-500/50 shadow-lg flex flex-col justify-between ${
                    isDone ? 'border-emerald-600/40 bg-emerald-950/10' : 'border-stone-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-stone-800 text-stone-300 uppercase tracking-wider">
                        {lesson.difficulty}
                      </span>
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mastered</span>
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-400">
                          +{lesson.xpReward} XP
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400">
                      {lesson.title}
                    </h3>

                    <p className="text-xs text-stone-400 leading-relaxed line-clamp-3">
                      {lesson.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-800 mt-4 flex items-center justify-between text-xs font-bold text-amber-400">
                    <span>{lesson.steps.length} Board Exercises</span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      {isDone ? 'Practice Again' : 'Start Lesson'} &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Active Interactive Lesson View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: The ChessBoard */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <ChessBoard
              game={game}
              onMove={handleUserMove}
              interactive={!stepSolved}
              highlightSquares={
                showHint && currentStep?.highlightSquares ? currentStep.highlightSquares : []
              }
              arrow={showHint && currentStep?.arrow ? currentStep.arrow : null}
            />

            {/* Step Controls Bar */}
            <div className="w-full max-w-[540px] mt-4 flex items-center justify-between px-2 text-xs">
              <span className="text-stone-400 font-medium">
                Exercise {currentStepIdx + 1} of {selectedLesson.steps.length}
              </span>
              <button
                onClick={handleResetStep}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-medium transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Position</span>
              </button>
            </div>
          </div>

          {/* Right: Theory, Instructions, Feedback & Hints */}
          <div className="lg:col-span-5 space-y-5">
            {/* Lesson Title & Concept Box */}
            <div className="bg-[#24211d] border border-stone-800 rounded-xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {selectedLesson.difficulty} • Step {currentStepIdx + 1}/{selectedLesson.steps.length}
                </span>
                <span className="text-xs font-semibold text-stone-400">
                  +{selectedLesson.xpReward} XP
                </span>
              </div>

              <h2 className="text-xl font-black text-white">{selectedLesson.title}</h2>

              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                {selectedLesson.conceptIntro}
              </p>

              {/* Golden Rule Callout */}
              <div className="p-3 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Grandmaster Rule</span>
                </div>
                <p className="text-xs text-stone-200 font-medium italic">
                  "{selectedLesson.keyRule}"
                </p>
              </div>
            </div>

            {/* Task Instruction Box */}
            <div className="bg-[#1e1c18] border border-stone-800 rounded-xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center gap-2 text-stone-400 text-xs uppercase font-bold tracking-wider">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Your Objective</span>
              </div>

              <p className="text-sm font-semibold text-white leading-relaxed">
                {currentStep?.instruction}
              </p>

              {/* Feedback Alert if move was attempted */}
              {feedback.type && (
                <div
                  className={`p-3.5 rounded-lg border text-xs leading-relaxed animate-in fade-in ${
                    feedback.type === 'correct'
                      ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-600/50 text-rose-200'
                  }`}
                >
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    {feedback.type === 'correct' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Move Found!</span>
                      </>
                    ) : (
                      <span>Keep calculating!</span>
                    )}
                  </div>
                  <div>{feedback.message}</div>
                </div>
              )}

              {/* Hint Box */}
              {showHint && currentStep?.hint && (
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-600/40 text-xs text-amber-200 space-y-1 animate-in fade-in">
                  <span className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Coach Hint:
                  </span>
                  <p>{currentStep.hint}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {!stepSolved ? (
                  <button
                    onClick={() => setShowHint(true)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-xs border border-stone-700 flex items-center justify-center gap-1.5 transition"
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>Need a Hint?</span>
                  </button>
                ) : (
                  <button
                    onClick={handleNextStep}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 font-bold text-xs shadow-lg transition flex items-center justify-center gap-1.5"
                  >
                    <span>
                      {currentStepIdx + 1 < selectedLesson.steps.length
                        ? 'Next Exercise'
                        : 'Complete Lesson & Collect XP'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
