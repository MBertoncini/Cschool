import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import {
  RotateCcw,
  Lightbulb,
  Flag,
  Swords,
  Sparkles,
  Trophy,
  RefreshCw,
  MessageSquare,
  History,
  Award,
} from 'lucide-react';
import { BotPersonality } from '../types/chess';
import { BOTS } from '../data/bots';
import { ChessBoard } from '../components/ChessBoard';
import { EvaluationBar } from '../components/EvaluationBar';
import { BotAvatar } from '../components/BotAvatar';
import { ClockFace, TimeControlPicker } from '../components/ChessClock';
import { PieceSetPicker } from '../components/PieceSetPicker';
import { NO_CLOCK, TimeControl, isTimed } from '../data/timeControls';
import { buildGame, canStillMate, drawReason, findBotMove } from '../engine/botEngine';
import { barScore, formatScore } from '../engine/gameAnalysis';
import { useProgress } from '../context/ProgressContext';
import { sounds } from '../engine/sound';
import { useGames, newGameId } from '../context/GamesContext';
import { GameResult } from '../types/chess';
import { useChessClock } from '../hooks/useChessClock';
import { useLiveEval } from '../hooks/useLiveEval';

interface PlayBotViewProps {
  onReviewGame?: (gameId: string) => void;
}

export const PlayBotView: React.FC<PlayBotViewProps> = ({ onReviewGame }) => {
  const { progress, recordBotGame } = useProgress();
  const { upsertGame } = useGames();

  const [selectedBot, setSelectedBot] = useState<BotPersonality>(BOTS[0]);
  const [moves, setMoves] = useState<string[]>([]);
  const game = useMemo(() => buildGame(moves), [moves]);
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);
  const evalScore = useLiveEval(game.fen());
  const [timeControl, setTimeControl] = useState<TimeControl>(NO_CLOCK);
  const timed = isTimed(timeControl);
  const moveHistory = moves;
  const lastMove = useMemo(() => {
    const h = game.history({ verbose: true }) as Move[];
    const m = h[h.length - 1];
    return m ? { from: m.from, to: m.to } : null;
  }, [game]);

  // Identity of the current match: guards against stale bot timeouts after "New Match"
  const matchRef = useRef<{ id: string; createdAt: string; bot: BotPersonality; color: 'w' | 'b' }>({
    id: newGameId(),
    createdAt: new Date().toISOString(),
    bot: BOTS[0],
    color: 'w',
  });

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

  // Lets a pending bot move notice that the game ended while it was "thinking"
  const gameOverRef = useRef(false);
  gameOverRef.current = gameResult.over;

  const handleFlag = (loser: 'w' | 'b') => {
    if (gameOverRef.current) return;
    setIsBotThinking(false);
    const playerLost = loser === playerColor;

    if (!canStillMate(game, loser === 'w' ? 'b' : 'w')) {
      recordBotGame(selectedBot.id, 'draw');
      setGameResult({ over: true, winner: 'draw', reason: 'Draw: time ran out, but the opponent cannot mate.' });
      return;
    }

    const quotes = playerLost ? selectedBot.quotes.onWin : selectedBot.quotes.onLoss;
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    if (quote) setBotSpeech(quote);

    if (playerLost) sounds.playMistake();
    else sounds.playSuccess();
    recordBotGame(selectedBot.id, playerLost ? 'loss' : 'win');
    setGameResult({
      over: true,
      winner: playerLost ? 'bot' : 'player',
      reason: playerLost ? 'You ran out of time.' : `${selectedBot.name} ran out of time. You won!`,
    });
  };

  const clock = useChessClock(timeControl, handleFlag);

  // Persist the game (synced to GitHub when connected) every time it changes
  useEffect(() => {
    if (moves.length === 0) return;
    const m = matchRef.current;
    let result: GameResult = '*';
    if (gameResult.over) {
      if (gameResult.winner === 'draw') result = '1/2-1/2';
      else {
        const whiteWon = (gameResult.winner === 'player') === (m.color === 'w');
        result = whiteWon ? '1-0' : '0-1';
      }
    }
    upsertGame({
      id: m.id,
      createdAt: m.createdAt,
      white: m.color === 'w' ? 'You' : m.bot.name,
      black: m.color === 'b' ? 'You' : m.bot.name,
      playerColor: m.color,
      botId: m.bot.id,
      botName: m.bot.name,
      botElo: m.bot.elo,
      botAvatar: m.bot.avatar,
      moves,
      result,
      termination: gameResult.over ? gameResult.reason : undefined,
    });
  }, [moves, gameResult, upsertGame]);

  // Reset or start match
  const startNewMatch = (
    bot: BotPersonality = selectedBot,
    color: 'w' | 'b' = playerColor,
    tc: TimeControl = timeControl
  ) => {
    matchRef.current = { id: newGameId(), createdAt: new Date().toISOString(), bot, color };
    setMoves([]);
    setSelectedBot(bot);
    setPlayerColor(color);
    setTimeControl(tc);
    clock.reset(tc);
    setCoachHint(null);
    setIsBotThinking(false);
    setGameResult({ over: false, winner: null, reason: '' });

    const quote = bot.quotes.start[Math.floor(Math.random() * bot.quotes.start.length)];
    setBotSpeech(quote);

    // If bot plays White, bot moves first
    if (color === 'b') {
      triggerBotTurn([], bot, isTimed(tc));
    }
  };

  const checkGameEnd = (currentG: Chess): boolean => {
    if (currentG.isGameOver()) {
      clock.stop();
      let winner: 'player' | 'bot' | 'draw' = 'draw';
      let reason = 'Draw.';

      if (currentG.isCheckmate()) {
        const turn = currentG.turn();
        const winningColor = turn === 'w' ? 'b' : 'w';
        const playerWon = winningColor === playerColor;
        winner = playerWon ? 'player' : 'bot';
        reason = `Checkmate! ${playerWon ? 'You won!' : selectedBot.name + ' won!'}`;

        if (playerWon) {
          sounds.playSuccess();
          recordBotGame(selectedBot.id, 'win');
          const lossQuote = selectedBot.quotes.onLoss[Math.floor(Math.random() * selectedBot.quotes.onLoss.length)];
          setBotSpeech(lossQuote);
        } else {
          sounds.playMistake();
          recordBotGame(selectedBot.id, 'loss');
          const winQuote = selectedBot.quotes.onWin[Math.floor(Math.random() * selectedBot.quotes.onWin.length)];
          setBotSpeech(winQuote);
        }
      } else if (currentG.isDraw()) {
        reason = drawReason(currentG);
        recordBotGame(selectedBot.id, 'draw');
      }

      setGameResult({ over: true, winner, reason });
      return true;
    }
    return false;
  };

  // Bot makes a move
  const triggerBotTurn = (currentMoves: string[], bot: BotPersonality = selectedBot, withClock: boolean = timed) => {
    setIsBotThinking(true);
    const thisMatchId = matchRef.current.id;

    // On the clock the bot must not burn its time on a theatrical pause
    const thinkTime = withClock ? 100 + Math.random() * 200 : 400 + Math.random() * 500;

    setTimeout(() => {
      // Guard against stale matches and games that ended in the meantime (flag, resignation)
      if (matchRef.current.id !== thisMatchId || gameOverRef.current) return;

      const g = buildGame(currentMoves);
      const botMove = findBotMove(g, bot.depth, bot.blunderRate);

      if (!botMove) {
        setIsBotThinking(false);
        checkGameEnd(g);
        return;
      }

      try {
        const res = g.move(botMove);
        if (!res) {
          setIsBotThinking(false);
          return;
        }

        const newMoves = [...currentMoves, res.san];
        setMoves(newMoves);
        setIsBotThinking(false);

        // Sound effect
        if (res.captured) sounds.playCapture();
        else if (g.inCheck()) sounds.playCheck();
        else sounds.playMove();

        // Dialogue trigger
        if (g.inCheck()) {
          const q = bot.quotes.onCheck[Math.floor(Math.random() * bot.quotes.onCheck.length)];
          if (q) setBotSpeech(q);
        } else if (res.captured) {
          const q = bot.quotes.onCapture[Math.floor(Math.random() * bot.quotes.onCapture.length)];
          if (q) setBotSpeech(q);
        }

        if (!checkGameEnd(g) && withClock) clock.press(res.color);
      } catch {
        setIsBotThinking(false);
      }
    }, thinkTime);
  };

  // Player makes a move
  const handlePlayerMove = (move: { from: Square; to: Square; promotion?: string }): boolean => {
    if (isBotThinking || gameResult.over) return false;
    if (game.turn() !== playerColor) return false;

    try {
      const testGame = buildGame(moves);
      const res = testGame.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q',
      });

      if (!res) return false;

      const newMoves = [...moves, res.san];
      setMoves(newMoves);
      setCoachHint(null);

      // Sound
      if (res.captured) sounds.playCapture();
      else if (testGame.inCheck()) sounds.playCheck();
      else sounds.playMove();

      // Check if player's move ended the game
      if (checkGameEnd(testGame)) return true;
      if (timed) clock.press(res.color);

      // Trigger bot reply
      triggerBotTurn(newMoves, selectedBot);
      return true;
    } catch {
      return false;
    }
  };

  const handleUndo = () => {
    if (moves.length === 0 || isBotThinking || timed) return;
    // Undo 2 plies if bot has already moved, or 1 if it's currently bot's turn
    const isPlayersTurn = game.turn() === playerColor;
    const undoCount = isPlayersTurn ? 2 : 1;
    const newMoves = moves.slice(0, Math.max(0, moves.length - undoCount));
    setMoves(newMoves);
    setGameResult({ over: false, winner: null, reason: '' });
    setCoachHint(null);
  };

  const handleAskCoach = () => {
    if (gameResult.over || isBotThinking) return;
    // Compute best move using master depth
    const masterBot: BotPersonality = {
      ...BOTS[4],
      depth: 4,
      blunderRate: 0,
    };
    const bestMove = findBotMove(game, masterBot.depth, masterBot.blunderRate);
    if (!bestMove) return;

    try {
      const g = buildGame(moves);
      const res = g.move(bestMove);
      if (res) {
        setCoachHint({
          move: res.san,
          explanation: `Notice how ${res.san} exerts pressure on the center while keeping your structure sound.`,
        });
      }
    } catch {
      // ignore
    }
  };

  const handleResign = () => {
    if (gameResult.over) return;
    clock.stop();
    setIsBotThinking(false);
    setGameResult({ over: true, winner: 'bot', reason: 'You resigned.' });
    recordBotGame(selectedBot.id, 'loss');
    setBotSpeech(selectedBot.quotes.onWin[0] || 'A hard fought game. Honor to your struggle.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      {/* Bot Selector Carousel: Tactile Wooden Opponents */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {BOTS.map((b) => {
          const isSelected = selectedBot.id === b.id;
          const isDefeated = progress.botRecord.defeatedBots.includes(b.id);
          return (
            <div
              key={b.id}
              onClick={() => startNewMatch(b, playerColor)}
              className={`p-3.5 rounded-xl cursor-pointer transition flex flex-col justify-between ${
                isSelected
                  ? 'wood-panel-raised border-2 border-brass shadow-wood-raised-lg scale-[1.02]'
                  : 'wood-panel border border-wood-700/70 hover:border-wood-600 shadow-wood-raised'
              }`}
            >
              <div className="flex items-center justify-between">
                <BotAvatar avatarKey={b.avatar} size="sm" />
                {isDefeated && (
                  <div className="p-1 rounded-md wood-well border border-brass/30" title="Defeated">
                    <Award className="w-3.5 h-3.5 text-brass" />
                  </div>
                )}
              </div>
              <div className="mt-2.5">
                <div className="text-xs font-serif font-bold text-wood-100">{b.name}</div>
                <div className="text-[11px] text-brass font-mono font-bold">
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
          <div className="w-full max-w-[580px] mb-3 flex items-center justify-between wood-panel border border-wood-700 rounded-xl p-3 shadow-wood-raised">
            <div className="flex items-center gap-3">
              <BotAvatar avatarKey={selectedBot.avatar} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-wood-100 text-sm">{selectedBot.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded wood-well border border-wood-750 text-brass">
                    Elo {selectedBot.elo}
                  </span>
                </div>
                <span className="text-[11px] text-wood-400 font-medium">{selectedBot.style}</span>
              </div>
            </div>

            {/* In-character speech bubble: Tactile Inset Tray */}
            <div className="hidden sm:flex items-center gap-2 wood-well border border-wood-750 rounded-xl px-3 py-1.5 max-w-xs min-w-0 mx-2 text-xs text-wood-300 italic shadow-wood-inset">
              <MessageSquare className="w-3.5 h-3.5 text-brass shrink-0" />
              <span className="line-clamp-2">{botSpeech}</span>
            </div>

            {timed && (
              <ClockFace
                ms={clock.view[playerColor === 'w' ? 'b' : 'w']}
                running={clock.view.active === (playerColor === 'w' ? 'b' : 'w')}
              />
            )}
          </div>

          {/* Chessboard with Eval Bar side-by-side */}
          <div className="flex items-stretch justify-center gap-3.5 w-full max-w-[580px]">
            {/* Visual Eval Bar */}
            <EvaluationBar
              score={barScore(evalScore)}
              label={formatScore(evalScore)}
              orientation={playerColor === 'w' ? 'white' : 'black'}
            />

            {/* The Handcrafted Chess Board */}
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
          <div className="w-full max-w-[580px] mt-3 flex items-center justify-between wood-panel border border-wood-700 rounded-xl p-3 shadow-wood-raised">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg wood-well border border-wood-650 flex items-center justify-center font-serif font-bold text-xs text-brass shadow-wood-inset">
                You
              </div>
              <div>
                <span className="font-serif font-bold text-wood-100 text-xs block">
                  You ({playerColor === 'w' ? 'White' : 'Black'})
                </span>
                <span className="text-[11px] text-wood-400">
                  {game.turn() === playerColor ? (
                    <span className="text-brass font-bold">Your Turn</span>
                  ) : (
                    <span className="text-wood-400">Opponent is calculating...</span>
                  )}
                </span>
              </div>
            </div>

            {/* Quick in-match controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAskCoach}
                disabled={isBotThinking || gameResult.over}
                className="px-3 py-1.5 rounded-lg wood-btn text-brass font-serif font-bold text-xs border border-brass/40 transition flex items-center gap-1.5 disabled:opacity-30"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span className={timed ? 'hidden sm:inline' : ''}>Coach Hint</span>
              </button>

              <button
                onClick={handleUndo}
                disabled={isBotThinking || moveHistory.length === 0 || timed}
                className="p-1.5 rounded-lg wood-btn text-wood-300 disabled:opacity-30"
                title={timed ? 'Undo is not available in timed games' : 'Undo Move'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {timed && <ClockFace ms={clock.view[playerColor]} running={clock.view.active === playerColor} />}
            </div>
          </div>
        </div>

        {/* Right: History, Coach Hints & Game Over Alert */}
        <div className="lg:col-span-4 space-y-4">
          {/* Game Over Banner */}
          {gameResult.over && (
            <div
              className={`p-5 rounded-xl border text-center space-y-3 wood-panel-raised shadow-wood-raised-lg animate-in fade-in ${
                gameResult.winner === 'player'
                  ? 'border-brass/70 text-wood-100'
                  : 'border-wood-700 text-wood-200'
              }`}
            >
              <Trophy
                className={`w-10 h-10 mx-auto ${
                  gameResult.winner === 'player' ? 'text-brass' : 'text-wood-400'
                }`}
              />
              <h3 className="font-serif text-lg font-bold">{gameResult.reason}</h3>
              <p className="text-xs text-wood-300">
                {gameResult.winner === 'player'
                  ? 'Victory logged in your academy record (+100 XP)!'
                  : 'Valuable practice! Review mistakes to refine your technique.'}
              </p>
              <div className="flex gap-2 pt-1">
                {onReviewGame && moves.length > 0 && (
                  <button
                    onClick={() => onReviewGame(matchRef.current.id)}
                    className="flex-1 py-2.5 rounded-lg wood-btn-brass text-wood-950 font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
                  >
                    <History className="w-3.5 h-3.5 text-wood-950" />
                    Review Match
                  </button>
                )}
                <button
                  onClick={() => startNewMatch()}
                  className="flex-1 py-2.5 rounded-lg wood-btn text-wood-100 font-bold text-xs border border-wood-650 shadow transition"
                >
                  Play Rematch
                </button>
              </div>
            </div>
          )}

          {/* Coach Advice Box */}
          {coachHint && (
            <div className="wood-panel border border-brass/50 rounded-xl p-4 space-y-2 shadow-wood-raised animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-brass uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Coach Recommendation:</span>
              </div>
              <div className="text-base font-black text-wood-100 font-mono">{coachHint.move}</div>
              <p className="text-xs text-wood-300 leading-relaxed font-sans">
                {coachHint.explanation}
              </p>
            </div>
          )}

          {/* Move History Panel: Tactile Inset Well */}
          <div className="wood-panel border border-wood-700 rounded-xl p-4 shadow-wood-raised space-y-3">
            <h4 className="text-[11px] font-serif font-bold text-wood-400 uppercase tracking-wider">
              Move Notation
            </h4>

            <div className="wood-well rounded-lg p-2 max-h-48 overflow-y-auto space-y-1 font-mono text-xs pr-2 border border-wood-850">
              {moveHistory.length === 0 ? (
                <span className="text-wood-500 text-xs italic">Awaiting opening move...</span>
              ) : (
                Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-0.5 px-2 rounded hover:bg-wood-800/60"
                  >
                    <span className="text-wood-500 w-8">{i + 1}.</span>
                    <span className="text-wood-200 font-bold flex-1">{moveHistory[i * 2]}</span>
                    <span className="text-wood-400 flex-1">
                      {moveHistory[i * 2 + 1] || ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Match Settings & Options */}
          <div className="wood-panel border border-wood-700 rounded-xl p-4 space-y-3 shadow-wood-raised text-xs">
            <div className="flex items-center justify-between">
              <span className="text-wood-400 font-medium">Side:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => startNewMatch(selectedBot, 'w')}
                  className={`px-3 py-1 rounded-lg text-xs font-serif font-bold transition ${
                    playerColor === 'w' ? 'wood-btn-brass text-wood-950' : 'wood-btn text-wood-300'
                  }`}
                >
                  White
                </button>
                <button
                  onClick={() => startNewMatch(selectedBot, 'b')}
                  className={`px-3 py-1 rounded-lg text-xs font-serif font-bold transition ${
                    playerColor === 'b' ? 'wood-btn-brass text-wood-950' : 'wood-btn text-wood-300'
                  }`}
                >
                  Black
                </button>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-wood-750">
              <span className="text-wood-400 font-medium">Time control:</span>
              <TimeControlPicker
                value={timeControl}
                onChange={(tc) => startNewMatch(selectedBot, playerColor, tc)}
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-wood-750">
              <span className="text-wood-400 font-medium">Pieces:</span>
              <PieceSetPicker />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-wood-750">
              <button
                onClick={() => startNewMatch()}
                className="flex-1 py-2 rounded-lg wood-btn text-wood-200 font-semibold text-xs transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>New Match</span>
              </button>

              <button
                onClick={handleResign}
                disabled={gameResult.over}
                className="py-2 px-3 rounded-lg wood-btn text-rose-300 border border-rose-900/40 font-semibold transition disabled:opacity-30"
                title="Resign Match"
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
