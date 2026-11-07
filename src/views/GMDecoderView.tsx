import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import {
  Crown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { MasterGame, GameMoveAnnotation } from '../types/chess';
import { MASTER_GAMES } from '../data/masterGames';
import { ChessBoard } from '../components/ChessBoard';
import { useProgress } from '../context/ProgressContext';
import { sounds } from '../engine/sound';

export const GMDecoderView: React.FC = () => {
  const { studyMasterGame } = useProgress();

  const [selectedGame, setSelectedGame] = useState<MasterGame>(MASTER_GAMES[0]);
  const [currentPly, setCurrentPly] = useState<number>(0);
  const [game, setGame] = useState<Chess>(new Chess());
  const [boardHistory, setBoardHistory] = useState<string[]>([new Chess().fen()]);

  // When selected game changes, rebuild history
  useEffect(() => {
    if (!selectedGame) return;

    const g = new Chess(selectedGame.startingFen || undefined);
    const history: string[] = [g.fen()];

    for (const m of selectedGame.moves) {
      try {
        g.move({ from: m.from, to: m.to });
        history.push(g.fen());
      } catch {
        history.push(g.fen());
      }
    }

    setBoardHistory(history);
    setCurrentPly(0);
    setGame(new Chess(history[0]));

    // Record study
    studyMasterGame(selectedGame.id);
  }, [selectedGame]);

  // Jump to specific ply
  const goToPly = (ply: number) => {
    if (ply < 0 || ply >= boardHistory.length) return;
    setCurrentPly(ply);
    const newGame = new Chess(boardHistory[ply]);
    setGame(newGame);

    // Play appropriate sound
    if (ply > 0) {
      const move = selectedGame.moves[ply - 1];
      if (move?.san?.includes('x')) {
        sounds.playCapture();
      } else if (move?.san?.includes('+') || move?.san?.includes('#')) {
        sounds.playCheck();
      } else {
        sounds.playMove();
      }
    }
  };

  const handleNext = () => {
    if (currentPly < selectedGame.moves.length) {
      goToPly(currentPly + 1);
    }
  };

  const handlePrev = () => {
    if (currentPly > 0) {
      goToPly(currentPly - 1);
    }
  };

  const currentAnnotation: GameMoveAnnotation | null =
    currentPly > 0 ? selectedGame.moves[currentPly - 1] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-wood-750">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-serif font-bold text-brass uppercase tracking-widest mb-1">
            <Crown className="w-4 h-4" />
            <span>Grandmaster Study Arena</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-wood-100">
            The Grandmaster Decoder
          </h1>
          <p className="text-wood-400 text-xs sm:text-sm mt-1 font-sans">
            Move-by-move explanations demystifying why history's greatest champions played each move.
          </p>
        </div>

        {/* Game Switcher dropdown / buttons */}
        <div className="flex items-center gap-2">
          {MASTER_GAMES.map((mg) => (
            <button
              key={mg.id}
              onClick={() => setSelectedGame(mg)}
              className={`px-3 py-2 rounded-xl text-xs font-serif font-bold tracking-wide transition flex items-center gap-1.5 ${
                selectedGame.id === mg.id
                  ? 'wood-btn-brass text-wood-950 shadow-brass-raised'
                  : 'wood-btn text-wood-300 border border-wood-700/80'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{mg.title.split(':')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Study Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Chess Board */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <ChessBoard
            game={game}
            interactive={false}
            arrow={currentAnnotation?.arrow || null}
            lastMove={
              currentAnnotation ? { from: currentAnnotation.from, to: currentAnnotation.to } : null
            }
          />

          {/* Navigation Controls: Tactile Replay Bar */}
          <div className="w-full max-w-[540px] mt-4 flex items-center justify-between wood-panel border border-wood-700 rounded-xl p-2.5 shadow-wood-raised">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToPly(0)}
                disabled={currentPly === 0}
                className="p-2 rounded-lg wood-btn disabled:opacity-30 disabled:pointer-events-none text-wood-200"
                title="First Move"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handlePrev}
                disabled={currentPly === 0}
                className="p-2 rounded-lg wood-btn disabled:opacity-30 disabled:pointer-events-none text-wood-200"
                title="Previous Move"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center font-bold text-xs text-wood-300">
              {currentPly === 0 ? (
                <span className="text-wood-400 font-serif">Starting Position</span>
              ) : (
                <span className="font-serif">
                  Move {currentAnnotation?.moveNumber} ({currentAnnotation?.color === 'w' ? 'White' : 'Black'}:{' '}
                  <span className="text-brass font-mono font-bold text-sm">{currentAnnotation?.san}</span>)
                </span>
              )}
              <span className="block text-[10px] text-wood-500 font-mono mt-0.5">
                Ply {currentPly} / {selectedGame.moves.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleNext}
                disabled={currentPly >= selectedGame.moves.length}
                className="p-2 rounded-lg wood-btn-brass disabled:opacity-30 disabled:pointer-events-none text-wood-950 font-bold"
                title="Next Move"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToPly(selectedGame.moves.length)}
                disabled={currentPly >= selectedGame.moves.length}
                className="p-2 rounded-lg wood-btn disabled:opacity-30 disabled:pointer-events-none text-wood-200"
                title="Last Move"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Move Sequence Strip: Inset Wooden Tray */}
          <div className="w-full max-w-[540px] mt-3 wood-well border border-wood-850 rounded-xl p-2 overflow-x-auto flex items-center gap-1.5 shadow-wood-inset">
            {selectedGame.moves.map((m, idx) => {
              const plyIdx = idx + 1;
              const isSelected = currentPly === plyIdx;
              return (
                <button
                  key={m.ply}
                  onClick={() => goToPly(plyIdx)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono shrink-0 transition ${
                    isSelected
                      ? 'wood-btn-brass text-wood-950 font-bold scale-105'
                      : m.isCritical
                      ? 'wood-well border border-brass/50 text-brass hover:text-wood-50'
                      : 'wood-btn text-wood-300 hover:text-wood-100'
                  }`}
                >
                  {m.color === 'w' && `${m.moveNumber}.`} {m.san}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: The Grandmaster "WHY" Commentary Panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* Game Overview Card */}
          <div className="wood-panel border border-wood-700 rounded-xl p-5 shadow-wood-raised space-y-3">
            <div className="flex items-center justify-between text-xs text-wood-400 border-b border-wood-750 pb-2">
              <span className="font-serif font-bold text-brass">{selectedGame.event}</span>
              <span className="font-mono">{selectedGame.year}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg wood-well border border-wood-800">
                <span className="text-[10px] text-wood-500 block uppercase font-serif font-bold">White</span>
                <span className="font-serif font-bold text-wood-100 text-sm">{selectedGame.white.name}</span>
                <span className="text-[10px] text-wood-400 block font-mono">{selectedGame.white.title}</span>
              </div>
              <div className="p-2.5 rounded-lg wood-well border border-wood-800">
                <span className="text-[10px] text-wood-500 block uppercase font-serif font-bold">Black</span>
                <span className="font-serif font-bold text-wood-100 text-sm">{selectedGame.black.name}</span>
                <span className="text-[10px] text-wood-400 block font-mono">{selectedGame.black.title}</span>
              </div>
            </div>

            <p className="text-xs text-wood-300 leading-relaxed font-sans">
              {selectedGame.description}
            </p>
          </div>

          {/* Current Move Explanation Box */}
          <div className="wood-panel-raised border border-wood-650 rounded-xl p-5 shadow-wood-raised-lg space-y-4">
            {currentPly === 0 ? (
              <div className="text-center py-6 space-y-3">
                <Crown className="w-9 h-9 text-brass mx-auto opacity-80" />
                <h3 className="font-serif text-base font-bold text-wood-100">Ready to examine this classical gem?</h3>
                <p className="text-xs text-wood-400 max-w-sm mx-auto leading-relaxed font-sans">
                  Use the navigation controls below the board or press the <b>Next Move</b> button to uncover each tactical insight step-by-step.
                </p>
                <button
                  onClick={handleNext}
                  className="px-5 py-2 rounded-xl wood-btn-brass text-wood-950 font-serif font-bold text-xs uppercase tracking-wider shadow-brass-raised transition"
                >
                  Begin Game Analysis
                </button>
              </div>
            ) : (
              currentAnnotation && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-wood-750 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg wood-well border border-wood-650 flex items-center justify-center font-mono font-bold text-brass text-sm shadow-wood-inset">
                        {currentAnnotation.san}
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-wood-100">
                          {currentAnnotation.color === 'w' ? 'White' : 'Black'} played {currentAnnotation.san}
                        </h4>
                        <span className="text-[10px] font-mono text-wood-400">
                          Square: {currentAnnotation.from} → {currentAnnotation.to}
                        </span>
                      </div>
                    </div>

                    {currentAnnotation.isCritical && (
                      <span className="px-2 py-0.5 rounded wood-well text-brass border border-brass/40 font-serif font-bold text-[10px] uppercase tracking-wider">
                        Key Turning Point
                      </span>
                    )}
                  </div>

                  {/* Why this move was played */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-serif uppercase tracking-wider text-wood-400 font-bold block">
                      Grandmaster Thinking
                    </span>
                    <p className="text-xs text-wood-200 leading-relaxed font-sans">
                      {currentAnnotation.whyPlayed}
                    </p>
                  </div>

                  {/* Plain Language GM Logic / Trap Avoided */}
                  {currentAnnotation.beginnerTrapAvoided && (
                    <div className="wood-well rounded-xl p-3.5 border border-brass/30 space-y-1.5 shadow-wood-inset">
                      <div className="flex items-center gap-1.5 text-brass font-serif font-bold text-[11px] uppercase tracking-wider">
                        <Lightbulb className="w-3.5 h-3.5 text-brass shrink-0" />
                        <span>Beginner Instinct vs Master Calculation</span>
                      </div>
                      <p className="text-xs text-wood-100 leading-relaxed font-sans">
                        {currentAnnotation.beginnerTrapAvoided}
                      </p>
                    </div>
                  )}

                  {/* Core Chess Principle */}
                  {currentAnnotation.principle && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-serif uppercase tracking-wider text-wood-400 font-bold block">
                        Classical Principle
                      </span>
                      <p className="text-xs text-wood-300 leading-relaxed flex items-start gap-1.5 font-sans">
                        <AlertCircle className="w-3.5 h-3.5 text-brass shrink-0 mt-0.5" />
                        <span>{currentAnnotation.principle}</span>
                      </p>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* Key Lesson Takeaway Card */}
          <div className="wood-panel border border-wood-700/80 rounded-xl p-4 shadow-wood-raised">
            <div className="flex items-center gap-2 text-brass font-serif font-bold text-xs uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brass" />
              <span>Timeless Principle</span>
            </div>
            <p className="text-xs text-wood-300 leading-relaxed italic font-serif">
              "{selectedGame.keyTakeaway}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
