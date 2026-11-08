import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Color, Move, Square } from 'chess.js';
import { ArrowUpDown, Flag, Handshake, History, RefreshCw, RotateCcw, Trophy, Users } from 'lucide-react';
import { GameResult } from '../types/chess';
import { ChessBoard } from '../components/ChessBoard';
import { ChessPiece } from '../components/ChessPieces';
import { ClockFace, TimeControlPicker } from '../components/ChessClock';
import { PieceSetPicker } from '../components/PieceSetPicker';
import { EvaluationBar } from '../components/EvaluationBar';
import { NO_CLOCK, TimeControl, isTimed } from '../data/timeControls';
import { buildGame, canStillMate, drawReason } from '../engine/botEngine';
import { barScore, formatScore } from '../engine/gameAnalysis';
import { sounds } from '../engine/sound';
import { newGameId, useGames } from '../context/GamesContext';
import { useChessClock } from '../hooks/useChessClock';
import { useLiveEval } from '../hooks/useLiveEval';

interface LocalGameViewProps {
  onReviewGame?: (gameId: string) => void;
}

interface Outcome {
  result: GameResult;
  reason: string;
}

const COLOR_NAME: Record<Color, string> = { w: 'White', b: 'Black' };
const winResult = (winner: Color): GameResult => (winner === 'w' ? '1-0' : '0-1');
const newMatchIdentity = () => ({ id: newGameId(), createdAt: new Date().toISOString() });

/** Two players sharing one device: free play, with an optional clock. */
export const LocalGameView: React.FC<LocalGameViewProps> = ({ onReviewGame }) => {
  const { upsertGame } = useGames();

  const [timeControl, setTimeControl] = useState<TimeControl>(NO_CLOCK);
  const [moves, setMoves] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [autoFlip, setAutoFlip] = useState(false);
  const matchRef = useRef(newMatchIdentity());

  const game = useMemo(() => buildGame(moves), [moves]);
  const turn = game.turn();
  const timed = isTimed(timeControl);
  const score = useLiveEval(game.fen());

  const lastMove = useMemo(() => {
    const history = game.history({ verbose: true }) as Move[];
    const m = history[history.length - 1];
    return m ? { from: m.from, to: m.to } : null;
  }, [game]);

  const handleFlag = (loser: Color) => {
    const winner: Color = loser === 'w' ? 'b' : 'w';
    if (canStillMate(game, winner)) {
      sounds.playSuccess();
      setOutcome({ result: winResult(winner), reason: `${COLOR_NAME[loser]} ran out of time. ${COLOR_NAME[winner]} wins!` });
    } else {
      setOutcome({ result: '1/2-1/2', reason: `Draw: ${COLOR_NAME[loser]} ran out of time, but ${COLOR_NAME[winner]} cannot mate.` });
    }
  };

  const clock = useChessClock(timeControl, handleFlag);

  // Archive the game (it can be reviewed with Stockfish like any other match)
  useEffect(() => {
    if (moves.length === 0) return;
    upsertGame({
      ...matchRef.current,
      white: COLOR_NAME.w,
      black: COLOR_NAME.b,
      playerColor: 'w',
      moves,
      result: outcome?.result ?? '*',
      termination: outcome?.reason,
    });
  }, [moves, outcome, upsertGame]);

  const startNewGame = (tc: TimeControl = timeControl) => {
    matchRef.current = newMatchIdentity();
    setTimeControl(tc);
    setMoves([]);
    setOutcome(null);
    clock.reset(tc);
  };

  const finish = (result: Outcome) => {
    clock.stop();
    setOutcome(result);
  };

  const handleMove = (move: { from: Square; to: Square; promotion?: string }): boolean => {
    if (outcome) return false;
    const next = buildGame(moves);
    let played: Move;
    try {
      played = next.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
    } catch {
      return false;
    }
    setMoves([...moves, played.san]);

    if (played.captured) sounds.playCapture();
    else if (next.inCheck()) sounds.playCheck();
    else sounds.playMove();

    if (next.isCheckmate()) {
      sounds.playSuccess();
      finish({ result: winResult(played.color), reason: `Checkmate! ${COLOR_NAME[played.color]} wins!` });
    } else if (next.isDraw()) {
      finish({ result: '1/2-1/2', reason: drawReason(next) });
    } else if (timed) {
      clock.press(played.color);
    }
    return true;
  };

  const handleUndo = () => {
    if (moves.length === 0 || timed) return;
    setMoves(moves.slice(0, -1));
    setOutcome(null);
  };

  const handleResign = () => {
    if (outcome) return;
    const winner: Color = turn === 'w' ? 'b' : 'w';
    finish({ result: winResult(winner), reason: `${COLOR_NAME[turn]} resigned. ${COLOR_NAME[winner]} wins!` });
  };

  const orientation = (autoFlip ? turn === 'b' : flipped) ? 'black' : 'white';
  const topColor: Color = orientation === 'white' ? 'b' : 'w';
  const bottomColor: Color = topColor === 'w' ? 'b' : 'w';

  const renderPlayerBar = (color: Color) => (
    <div className="w-full max-w-[580px] flex items-center justify-between wood-panel border border-wood-700 rounded-xl p-2.5 shadow-wood-raised">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#b58a5a] border border-wood-650 p-1 shadow-wood-inset">
          <ChessPiece type="k" color={color} />
        </div>
        <div>
          <span className="font-serif font-bold text-wood-100 text-xs block">{COLOR_NAME[color]}</span>
          <span className="text-[11px] text-brass font-bold">{!outcome && turn === color ? 'To move' : ' '}</span>
        </div>
      </div>
      {timed && <ClockFace ms={clock.view[color]} running={clock.view.active === color} />}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      <div className="pb-4 border-b border-wood-750">
        <div className="inline-flex items-center gap-1.5 text-xs font-serif font-bold text-brass uppercase tracking-widest mb-1">
          <Users className="w-4 h-4" />
          <span>Two Players, One Board</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-wood-100">Free Play Duel</h1>
        <p className="text-wood-400 text-xs sm:text-sm mt-1 font-sans">
          Take turns on this device, with or without a clock. Every game is saved to your Archives.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 flex flex-col items-center gap-3">
          {renderPlayerBar(topColor)}

          <div className="flex items-stretch justify-center gap-3.5 w-full max-w-[580px]">
            <EvaluationBar score={barScore(score)} orientation={orientation} label={formatScore(score)} />
            <div className="flex-1">
              <ChessBoard
                game={game}
                onMove={handleMove}
                orientation={orientation}
                interactive={!outcome}
                lastMove={lastMove}
              />
            </div>
          </div>

          {renderPlayerBar(bottomColor)}
        </div>

        <div className="lg:col-span-4 space-y-4">
          {outcome && (
            <div className="p-5 rounded-xl border border-brass/70 text-center space-y-3 wood-panel-raised shadow-wood-raised-lg animate-in fade-in">
              <Trophy className="w-10 h-10 mx-auto text-brass" />
              <h3 className="font-serif text-lg font-bold text-wood-100">{outcome.reason}</h3>
              <div className="flex gap-2 pt-1">
                {onReviewGame && moves.length > 0 && (
                  <button
                    onClick={() => onReviewGame(matchRef.current.id)}
                    className="flex-1 py-2.5 rounded-lg wood-btn-brass text-wood-950 font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
                  >
                    <History className="w-3.5 h-3.5 text-wood-950" />
                    Review Game
                  </button>
                )}
                <button
                  onClick={() => startNewGame()}
                  className="flex-1 py-2.5 rounded-lg wood-btn text-wood-100 font-bold text-xs border border-wood-650 shadow transition"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}

          <div className="wood-panel border border-wood-700 rounded-xl p-4 shadow-wood-raised space-y-3">
            <h4 className="text-[11px] font-serif font-bold text-wood-400 uppercase tracking-wider">Move Notation</h4>
            <div className="wood-well rounded-lg p-2 max-h-48 overflow-y-auto space-y-1 font-mono text-xs pr-2 border border-wood-850">
              {moves.length === 0 ? (
                <span className="text-wood-500 text-xs italic">White to make the first move...</span>
              ) : (
                Array.from({ length: Math.ceil(moves.length / 2) }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-0.5 px-2 rounded hover:bg-wood-800/60">
                    <span className="text-wood-500 w-8">{i + 1}.</span>
                    <span className="text-wood-200 font-bold flex-1">{moves[i * 2]}</span>
                    <span className="text-wood-400 flex-1">{moves[i * 2 + 1] || ''}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="wood-panel border border-wood-700 rounded-xl p-4 space-y-3 shadow-wood-raised text-xs">
            <div className="space-y-1.5">
              <span className="text-wood-400 font-medium">Time control:</span>
              <TimeControlPicker value={timeControl} onChange={startNewGame} />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-wood-750">
              <span className="text-wood-400 font-medium">Pieces:</span>
              <PieceSetPicker />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-wood-750">
              <label className="flex items-center gap-2 text-wood-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoFlip}
                  onChange={(e) => setAutoFlip(e.target.checked)}
                  className="accent-[#d4a359]"
                />
                <span>Rotate board each turn</span>
              </label>
              <button
                onClick={() => setFlipped((f) => !f)}
                disabled={autoFlip}
                className="px-2.5 py-1.5 rounded-lg wood-btn text-wood-300 font-semibold transition flex items-center gap-1.5 disabled:opacity-30"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Flip</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-wood-750">
              <button
                onClick={() => startNewGame()}
                className="flex-1 py-2 rounded-lg wood-btn text-wood-200 font-semibold text-xs transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>New Game</span>
              </button>
              <button
                onClick={handleUndo}
                disabled={moves.length === 0 || timed}
                title={timed ? 'Undo is not available in timed games' : 'Undo last move'}
                className="py-2 px-3 rounded-lg wood-btn text-wood-300 transition disabled:opacity-30"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => !outcome && finish({ result: '1/2-1/2', reason: 'Draw by agreement.' })}
                disabled={Boolean(outcome) || moves.length === 0}
                title="Agree to a draw"
                className="py-2 px-3 rounded-lg wood-btn text-wood-300 transition disabled:opacity-30"
              >
                <Handshake className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResign}
                disabled={Boolean(outcome) || moves.length === 0}
                title={`${COLOR_NAME[turn]} resigns`}
                className="py-2 px-3 rounded-lg wood-btn text-rose-300 border border-rose-900/40 transition disabled:opacity-30"
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
