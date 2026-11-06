import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square, Move } from 'chess.js';
import {
  Bot,
  RotateCcw,
  Lightbulb,
  Flag,
  Swords,
  Sparkles,
  Trophy,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { BotPersonality } from '../types/chess';
import { BOTS } from '../data/bots';
import { ChessBoard } from '../components/ChessBoard';
import { EvaluationBar } from '../components/EvaluationBar';
import { findBotMove, getEvalBarScore } from '../engine/botEngine';
import { useProgress } from '../context/ProgressContext';
import { sounds } from '../engine/sound';

export const PlayBotView: React.FC = () => {
  const { progress, recordBotGame } = useProgress();

  const [selectedBot, setSelectedBot] = useState<BotPersonality>(BOTS[0]);
  const [game, setGame] = useState<Chess>(new Chess());
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);
  const [evalScore, setEvalScore] = useState<number>(0);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  // Coach hint
  const [coachHint, setCoachHint] = useState<{ move: string; explanation: string } | null>(null);

  // Bot speech
  const [botSpeech, setBotSpeech] = useState<string>(selectedBot.quotes.start[0]);

  // Match state
  const [gameResult, setGameResult] = useState<{
    over: boolean;
    winner: 'player' | 'bot' | 'draw' | null;
    reason: string;
  }>({ over: false, winner: null, reason: '' });

  // Reset or start match
  const startNewMatch = (bot: BotPersonality = selectedBot, color: 'w' | 'b' = playerColor) => {
    const newG = new Chess();
    setGame(newG);
    setSelectedBot(bot);
    setPlayerColor(color);
    setEvalScore(0);
    setMoveHistory([]);
    setLastMove(null);
    setCoachHint(null);
    setGameResult({ over: false, winner: null, reason: '' });

    const quote = bot.quotes.start[Math.floor(Math.random() * bot.quotes.start.length)];
    setBotSpeech(quote);

    // If bot plays White, bot moves first
    if (color === 'b') {
      setTimeout(() => triggerBotTurn(newG, bot), 600);
    }
  };

  const triggerBotTurn = (currentGame: Chess, bot: BotPersonality) => {
    if (currentGame.isGameOver()) return;

    setIsBotThinking(true);

    setTimeout(() => {
      try {
        const botDecision = findBotMove(currentGame, bot.depth, bot.blunderRate);
        if (botDecision) {
          const moveRes = currentGame.move({
            from: botDecision.from,
            to: botDecision.to,
            promotion: botDecision.promotion || 'q',
          });

          if (moveRes) {
            setLastMove({ from: botDecision.from, to: botDecision.to });
            setGame(new Chess(currentGame.fen()));
            setMoveHistory(currentGame.history());
            setEvalScore(getEvalBarScore(currentGame));

            if (moveRes.captured) {
              sounds.playCapture();
              const quote = bot.quotes.onCapture[Math.floor(Math.random() * bot.quotes.onCapture.length)];
              if (quote) setBotSpeech(quote);
            } else if (currentGame.inCheck()) {
              sounds.playCheck();
              const quote = bot.quotes.onCheck[Math.floor(Math.random() * bot.quotes.onCheck.length)];
              if (quote) setBotSpeech(quote);
            } else {
              sounds.playMove();
            }

            checkGameEnd(currentGame, bot);
          }
        }
      } catch (e) {
        console.error('Bot move failed', e);
      } finally {
        setIsBotThinking(false);
      }
    }, 450 + Math.random() * 350);
  };

  const checkGameEnd = (currentGame: Chess, bot: BotPersonality) => {
    if (currentGame.isCheckmate()) {
      const winner = currentGame.turn() === playerColor ? 'bot' : 'player';
      const reason = winner === 'player' ? 'Checkmate! You win!' : 'Checkmate! Bot wins!';
      setGameResult({ over: true, winner, reason });

      if (winner === 'player') {
        sounds.playSuccess();
        recordBotGame(bot.id, 'win');
        setBotSpeech(bot.quotes.onLoss[0] || 'Well played!');
      } else {
        sounds.playMistake();
        recordBotGame(bot.id, 'loss');
        setBotSpeech(bot.quotes.onWin[0] || 'Checkmate!');
      }
    } else if (currentGame.isDraw()) {
      let reason = 'Draw by Stalemate';
      if (currentGame.isThreefoldRepetition()) reason = 'Draw by Threefold Repetition';
      if (currentGame.isInsufficientMaterial()) reason = 'Draw by Insufficient Material';

      setGameResult({ over: true, winner: 'draw', reason });
      recordBotGame(bot.id, 'draw');
      setBotSpeech('A hard-fought draw! Excellent defense.');
    }
  };

  const handlePlayerMove = (move: { from: Square; to: Square; promotion?: string }) => {
    if (isBotThinking || gameResult.over || game.turn() !== playerColor) return;

    try {
      const moveRes = game.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q',
      });

      if (!moveRes) {
        sounds.playMistake();
        return;
      }

      setLastMove({ from: move.from, to: move.to });
      const nextGame = new Chess(game.fen());
      setGame(nextGame);
      setMoveHistory(nextGame.history());
      setEvalScore(getEvalBarScore(nextGame));
      setCoachHint(null);

      if (moveRes.captured) {
        sounds.playCapture();
      } else if (nextGame.inCheck()) {
        sounds.playCheck();
      } else {
        sounds.playMove();
      }

      if (nextGame.isGameOver()) {
        checkGameEnd(nextGame, selectedBot);
        return;
      }

      // Trigger bot response
      triggerBotTurn(nextGame, selectedBot);
    } catch {
      sounds.playMistake();
    }
  };

  // Undo move (undoes bot's move and player's move)
  const handleUndo = () => {
    if (isBotThinking || moveHistory.length === 0) return;

    const g = new Chess(game.fen());
    g.undo(); // undo bot
    if (g.turn() !== playerColor) {
      g.undo(); // undo player
    }
    setGame(g);
    setMoveHistory(g.history());
    setEvalScore(getEvalBarScore(g));
    setCoachHint(null);
    setGameResult({ over: false, winner: null, reason: '' });
  };

  // Request Coach Hint
  const handleAskCoach = () => {
    if (game.isGameOver() || isBotThinking) return;
    const best = findBotMove(game, 3, 0);
    if (best) {
      setCoachHint({
        move: `${best.from.toUpperCase()} to ${best.to.toUpperCase()}`,
        explanation: best.explanation,
      });
      sounds.playSuccess();
    }
  };

  // Resign
  const handleResign = () => {
    if (gameResult.over) return;
    setGameResult({ over: true, winner: 'bot', reason: 'You resigned.' });
    recordBotGame(selectedBot.id, 'loss');
    setBotSpeech(selectedBot.quotes.onWin[0] || 'Good game!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      {/* Bot Selector Carousel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {BOTS.map((b) => {
          const isSelected = selectedBot.id === b.id;
          const isDefeated = progress.botRecord.defeatedBots.includes(b.id);
          return (
            <div
              key={b.id}
              onClick={() => startNewMatch(b, playerColor)}
              className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500 shadow-md scale-[1.02]'
                  : 'bg-[#24211d] border-stone-800 hover:border-stone-700 hover:bg-[#2c2823]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{b.avatar}</span>
                {isDefeated && (
                  <span title="Defeated" className="text-xs">
                    🏆
                  </span>
                )}
              </div>
              <div className="mt-2">
                <div className="text-xs font-black text-white">{b.name}</div>
                <div className="text-[11px] text-amber-400 font-semibold font-mono">
                  Elo {b.elo}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Match Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Eval Bar + ChessBoard + Bot Speech */}
        <div className="lg:col-span-8 flex flex-col items-center">
          {/* Bot Profile Header with Speech Bubble */}
          <div className="w-full max-w-[580px] mb-3 flex items-center justify-between bg-[#24211d] border border-stone-800 rounded-xl p-3 shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedBot.avatar}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{selectedBot.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-amber-400">
                    Elo {selectedBot.elo}
                  </span>
                </div>
                <span className="text-xs text-stone-400 font-medium">{selectedBot.style}</span>
              </div>
            </div>

            {/* In-character speech bubble */}
            <div className="hidden sm:flex items-center gap-2 bg-[#1b1916] border border-stone-700/60 rounded-xl px-3 py-1.5 max-w-xs text-xs text-stone-300 italic shadow-inner">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="line-clamp-2">{botSpeech}</span>
            </div>
          </div>

          {/* Chessboard with Eval Bar side-by-side */}
          <div className="flex items-stretch justify-center gap-3 w-full max-w-[580px]">
            {/* Visual Eval Bar */}
            <EvaluationBar
              score={evalScore}
              orientation={playerColor === 'w' ? 'white' : 'black'}
            />

            {/* The Chess Board */}
            <div className="flex-1">
              <ChessBoard
                game={game}
                onMove={handlePlayerMove}
                orientation={playerColor === 'w' ? 'white' : 'black'}
                interactive={!isBotThinking && !gameResult.over}
                lastMove={lastMove}
              />
            </div>
          </div>

          {/* Player Bar */}
          <div className="w-full max-w-[580px] mt-3 flex items-center justify-between bg-[#24211d] border border-stone-800 rounded-xl p-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                You
              </div>
              <div>
                <span className="font-bold text-white text-xs block">
                  You ({playerColor === 'w' ? 'White' : 'Black'})
                </span>
                <span className="text-[11px] text-stone-400">
                  {game.turn() === playerColor ? (
                    <span className="text-emerald-400 font-bold animate-pulse">Your Turn</span>
                  ) : (
                    <span className="text-stone-400">Bot is calculating...</span>
                  )}
                </span>
              </div>
            </div>

            {/* Quick in-match controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAskCoach}
                disabled={isBotThinking || gameResult.over}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition flex items-center gap-1.5 disabled:opacity-40"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Coach Hint</span>
              </button>

              <button
                onClick={handleUndo}
                disabled={isBotThinking || moveHistory.length === 0}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 disabled:opacity-30"
                title="Undo Move"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: History, Coach Hints & Game Over Alert */}
        <div className="lg:col-span-4 space-y-4">
          {/* Game Over Banner */}
          {gameResult.over && (
            <div
              className={`p-5 rounded-xl border text-center space-y-3 shadow-2xl animate-in fade-in ${
                gameResult.winner === 'player'
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                  : 'bg-stone-900 border-amber-500/40 text-stone-200'
              }`}
            >
              <Trophy
                className={`w-10 h-10 mx-auto ${
                  gameResult.winner === 'player' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              />
              <h3 className="text-lg font-black">{gameResult.reason}</h3>
              <p className="text-xs opacity-80">
                {gameResult.winner === 'player'
                  ? 'Victory logged in your profile (+100 XP)!'
                  : 'Great effort! Analyze mistakes and challenge again.'}
              </p>
              <button
                onClick={() => startNewMatch()}
                className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow transition"
              >
                Play Rematch
              </button>
            </div>
          )}

          {/* Coach Advice Box */}
          {coachHint && (
            <div className="bg-amber-950/30 border border-amber-500/50 rounded-xl p-4 space-y-2 shadow-lg animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Grandmaster Coach Recommends:</span>
              </div>
              <div className="text-base font-black text-white font-mono">{coachHint.move}</div>
              <p className="text-xs text-stone-200 leading-relaxed font-medium">
                {coachHint.explanation}
              </p>
            </div>
          )}

          {/* Move History Panel */}
          <div className="bg-[#24211d] border border-stone-800 rounded-xl p-4 shadow-lg space-y-3">
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Move History
            </h4>

            <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs pr-2 scrollbar-thin">
              {moveHistory.length === 0 ? (
                <span className="text-stone-500 text-xs italic">No moves yet. Make your first move!</span>
              ) : (
                Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-0.5 px-2 rounded hover:bg-stone-800/60"
                  >
                    <span className="text-stone-500 w-8">{i + 1}.</span>
                    <span className="text-stone-200 font-bold flex-1">{moveHistory[i * 2]}</span>
                    <span className="text-stone-400 flex-1">
                      {moveHistory[i * 2 + 1] || ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Match Settings & Options */}
          <div className="bg-[#1e1c18] border border-stone-800 rounded-xl p-4 space-y-3 shadow-md text-xs">
            <div className="flex items-center justify-between">
              <span className="text-stone-400 font-medium">Color:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startNewMatch(selectedBot, 'w')}
                  className={`px-2.5 py-1 rounded font-bold transition ${
                    playerColor === 'w' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-300'
                  }`}
                >
                  White
                </button>
                <button
                  onClick={() => startNewMatch(selectedBot, 'b')}
                  className={`px-2.5 py-1 rounded font-bold transition ${
                    playerColor === 'b' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-300'
                  }`}
                >
                  Black
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => startNewMatch()}
                className="flex-1 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>New Match</span>
              </button>

              <button
                onClick={handleResign}
                disabled={gameResult.over}
                className="py-2 px-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-900/50 font-semibold transition disabled:opacity-30"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
