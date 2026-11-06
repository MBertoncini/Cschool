import React, { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import {
  Crown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BookOpen,
  Sparkles,
  Award,
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
        // If move fails, keep previous
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
            <Crown className="w-4 h-4" />
            <span>Masterclass Game Breakdown</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            The Grandmaster Decoder
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm mt-1">
            Move-by-move explanations demystifying why the world's greatest players played each move.
          </p>
        </div>

        {/* Game Switcher dropdown / buttons */}
        <div className="flex items-center gap-2">
          {MASTER_GAMES.map((mg) => (
            <button
              key={mg.id}
              onClick={() => setSelectedGame(mg)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedGame.id === mg.id
                  ? 'bg-amber-500 text-stone-950 shadow-lg'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white border border-stone-700'
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

          {/* Navigation Controls */}
          <div className="w-full max-w-[540px] mt-4 flex items-center justify-between bg-[#24211d] border border-stone-800 rounded-xl p-2.5 shadow-md">
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPly(0)}
                disabled={currentPly === 0}
                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:pointer-events-none text-stone-200"
                title="First Move"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handlePrev}
                disabled={currentPly === 0}
                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:pointer-events-none text-stone-200"
                title="Previous Move"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center font-bold text-xs text-stone-300">
              {currentPly === 0 ? (
                <span className="text-stone-400">Starting Position</span>
              ) : (
                <span>
                  Move {currentAnnotation?.moveNumber} ({currentAnnotation?.color === 'w' ? 'White' : 'Black'}:{' '}
                  <span className="text-amber-400 text-sm">{currentAnnotation?.san}</span>)
                </span>
              )}
              <span className="block text-[10px] text-stone-500 font-medium">
                Ply {currentPly} / {selectedGame.moves.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleNext}
                disabled={currentPly >= selectedGame.moves.length}
                className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:pointer-events-none text-stone-950 font-bold"
                title="Next Move"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToPly(selectedGame.moves.length)}
                disabled={currentPly >= selectedGame.moves.length}
                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:pointer-events-none text-stone-200"
                title="Last Move"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Move Sequence Strip */}
          <div className="w-full max-w-[540px] mt-3 bg-[#1e1c18] border border-stone-800 rounded-lg p-2 overflow-x-auto flex items-center gap-1.5 scrollbar-thin">
            {selectedGame.moves.map((m, idx) => {
              const plyIdx = idx + 1;
              const isSelected = currentPly === plyIdx;
              return (
                <button
                  key={m.ply}
                  onClick={() => goToPly(plyIdx)}
                  className={`px-2 py-1 rounded text-[11px] font-mono shrink-0 transition ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 font-black scale-105'
                      : m.isCritical
                      ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60'
                      : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-white'
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
          <div className="bg-[#24211d] border border-stone-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-400 border-b border-stone-800 pb-2">
              <span className="font-semibold text-amber-400">{selectedGame.event}</span>
              <span>{selectedGame.year}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-stone-800/60 border border-stone-700/50">
                <span className="text-[10px] text-stone-400 block uppercase font-bold">White</span>
                <span className="font-bold text-white text-sm">{selectedGame.white.name}</span>
                <span className="text-[10px] text-stone-400 block">{selectedGame.white.title}</span>
              </div>
              <div className="p-2 rounded bg-stone-800/60 border border-stone-700/50">
                <span className="text-[10px] text-stone-400 block uppercase font-bold">Black</span>
                <span className="font-bold text-white text-sm">{selectedGame.black.name}</span>
                <span className="text-[10px] text-stone-400 block">{selectedGame.black.title}</span>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              {selectedGame.description}
            </p>
          </div>

          {/* Current Move Explanation Box */}
          <div className="bg-[#1e1c18] border border-stone-800 rounded-xl p-5 shadow-xl space-y-4">
            {currentPly === 0 ? (
              <div className="text-center py-6 space-y-3">
                <Crown className="w-10 h-10 text-amber-400 mx-auto opacity-70" />
                <h3 className="text-base font-bold text-white">Ready to study this masterpiece?</h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
                  Click <b>"Next Move"</b> or use the arrow controls below the board to follow the game move-by-move.
                </p>
                <button
                  onClick={() => goToPly(1)}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow transition"
                >
                  Start Game &rarr;
                </button>
              </div>
            ) : currentAnnotation ? (
              <div className="space-y-4 animate-in fade-in">
                {/* Move Header */}
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      {currentAnnotation.moveNumber}. {currentAnnotation.san}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                      {currentAnnotation.color === 'w' ? 'White' : 'Black'}
                    </span>
                  </div>

                  {currentAnnotation.isCritical && (
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-rose-500 text-white shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Critical Brilliant Move
                    </span>
                  )}
                </div>

                {/* Plain English "WHY" */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Why was this move played?</span>
                  </h4>
                  <p className="text-sm font-medium text-white leading-relaxed">
                    {currentAnnotation.whyPlayed}
                  </p>
                </div>

                {/* Beginner Trap / Alternative Instinct */}
                {currentAnnotation.beginnerTrapAvoided && (
                  <div className="p-3 bg-rose-950/30 border border-rose-900/40 rounded-lg space-y-1">
                    <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Why Not The Beginner Move?</span>
                    </div>
                    <p className="text-xs text-rose-200/90 leading-relaxed">
                      {currentAnnotation.beginnerTrapAvoided}
                    </p>
                  </div>
                )}

                {/* Core Chess Principle */}
                <div className="p-3 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg space-y-1">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Key Lesson / Principle</span>
                  </div>
                  <p className="text-xs text-stone-200 font-semibold italic">
                    "{currentAnnotation.principle}"
                  </p>
                </div>

                {/* Quick Next Move button */}
                <button
                  onClick={handleNext}
                  disabled={currentPly >= selectedGame.moves.length}
                  className="w-full py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <span>See Next Grandmaster Move</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
