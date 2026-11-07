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
          message: 'Not quite the optimal continuation. Look for the most forcing, high-impact square.',
        });
      }
    } catch {
      sounds.playMistake();
    }
  };

  const handleNextStep = () => {
    if (!selectedLesson) return;

    if (currentStepIdx + 1 < selectedLesson.steps.length) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      loadStep(selectedLesson, nextIdx);
    } else {
      // Completed entire lesson
      completeLesson(selectedLesson.id, selectedLesson.xpReward);
      setSelectedLesson(null);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-wood-750">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-wood-100 flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-brass" />
            <span>Chess Academy</span>
          </h1>
          <p className="text-wood-400 text-xs sm:text-sm mt-1 font-sans">
            Master tactical patterns, positional geometry, and crucial endgame techniques through tactile board study.
          </p>
        </div>

        {selectedLesson && (
          <button
            onClick={() => setSelectedLesson(null)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl wood-btn text-wood-200 text-xs font-serif font-bold tracking-wide border border-wood-650 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>All Lessons</span>
          </button>
        )}
      </div>

      {/* Main Content: Either Lesson Catalog or Interactive Lesson View */}
      {!selectedLesson ? (
        <div className="space-y-6">
          {/* Category Tabs: Tactile Wells */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 wood-well rounded-xl border border-wood-850">
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-serif font-bold whitespace-nowrap transition ${
                  activeCategory === tab.id
                    ? 'wood-tab-active text-brass font-bold'
                    : 'text-wood-400 hover:text-wood-200'
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
                  className={`wood-panel hover:wood-panel-raised rounded-2xl p-5 cursor-pointer transition-all border shadow-wood-raised flex flex-col justify-between ${
                    isDone ? 'border-brass/40' : 'border-wood-700/70 hover:border-brass/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-serif font-bold px-2 py-0.5 rounded wood-well text-wood-300 border border-wood-750 uppercase tracking-wider">
                        {lesson.difficulty}
                      </span>
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 text-brass text-xs font-serif font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brass" />
                          <span>Mastered</span>
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-bold text-brass">
                          +{lesson.xpReward} XP
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-lg font-bold text-wood-100 group-hover:text-brass transition">
                      {lesson.title}
                    </h3>

                    <p className="text-xs text-wood-400 leading-relaxed font-sans line-clamp-3">
                      {lesson.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-wood-750 mt-4 flex items-center justify-between text-xs font-serif font-bold text-brass">
                    <span className="font-mono text-wood-400 font-normal">{lesson.steps.length} Board Exercises</span>
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
              <span className="font-serif text-wood-400 font-medium">
                Exercise {currentStepIdx + 1} of {selectedLesson.steps.length}
              </span>
              <button
                onClick={handleResetStep}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg wood-btn text-wood-300 hover:text-wood-100 text-xs font-medium transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Position</span>
              </button>
            </div>
          </div>

          {/* Right: Theory, Instructions, Feedback & Hints */}
          <div className="lg:col-span-5 space-y-4">
            {/* Lesson Title & Concept Box */}
            <div className="wood-panel border border-wood-700 rounded-xl p-5 shadow-wood-raised space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-serif font-bold text-brass uppercase tracking-wider">
                  {selectedLesson.difficulty} • Step {currentStepIdx + 1}/{selectedLesson.steps.length}
                </span>
                <span className="text-xs font-mono font-bold text-wood-400">
                  +{selectedLesson.xpReward} XP
                </span>
              </div>

              <h2 className="font-serif text-xl font-bold text-wood-100">{selectedLesson.title}</h2>

              <p className="text-xs sm:text-sm text-wood-300 leading-relaxed font-sans">
                {selectedLesson.conceptIntro}
              </p>

              {/* Golden Rule Callout */}
              <div className="p-3.5 wood-well border-l-4 border-brass rounded-r-xl border border-wood-800 shadow-wood-inset">
                <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-brass uppercase tracking-wider mb-1">
                  <Lightbulb className="w-3.5 h-3.5 text-brass" />
                  <span>Grandmaster Maxim</span>
                </div>
                <p className="text-xs text-wood-200 font-serif italic">
                  "{selectedLesson.keyRule}"
                </p>
              </div>
            </div>

            {/* Task Instruction Box */}
            <div className="wood-panel-raised border border-wood-650 rounded-xl p-5 space-y-4 shadow-wood-raised-lg">
              <div className="flex items-center gap-2 text-wood-400 text-xs font-serif uppercase font-bold tracking-wider">
                <BookOpen className="w-4 h-4 text-brass" />
                <span>Your Objective</span>
              </div>

              <p className="text-sm font-serif font-bold text-wood-100 leading-relaxed">
                {currentStep?.instruction}
              </p>

              {/* Feedback Alert if move was attempted */}
              {feedback.type && (
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed wood-well shadow-wood-inset animate-in fade-in ${
                    feedback.type === 'correct'
                      ? 'border-brass/50 text-wood-100'
                      : 'border-rose-900/50 text-rose-200'
                  }`}
                >
                  <div className="font-serif font-bold mb-1 flex items-center gap-1.5">
                    {feedback.type === 'correct' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-brass" />
                        <span>Move Found!</span>
                      </>
                    ) : (
                      <span>Keep calculating!</span>
                    )}
                  </div>
                  <div className="font-sans">{feedback.message}</div>
                </div>
              )}

              {/* Hint Box */}
              {showHint && currentStep?.hint && (
                <div className="p-3.5 rounded-xl wood-well border border-brass/40 text-xs text-brass space-y-1 shadow-wood-inset animate-in fade-in font-sans">
                  <span className="font-serif font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-brass" /> Coach Hint:
                  </span>
                  <p>{currentStep.hint}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {!stepSolved ? (
                  <button
                    onClick={() => setShowHint(true)}
                    className="flex-1 py-2.5 px-4 rounded-xl wood-btn text-brass font-serif font-bold text-xs border border-brass/30 flex items-center justify-center gap-1.5 transition"
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>Need a Hint?</span>
                  </button>
                ) : (
                  <button
                    onClick={handleNextStep}
                    className="flex-1 py-2.5 px-4 rounded-xl wood-btn-brass text-wood-950 font-serif font-bold text-xs uppercase tracking-wider shadow-brass-raised transition flex items-center justify-center gap-1.5"
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
