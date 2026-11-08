import { useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import { EngineScore } from '../types/chess';
import { getEvalBarScore } from '../engine/botEngine';
import { MATED_CP } from '../engine/gameAnalysis';
import { CancelledError, getEngine } from '../engine/stockfish';

const LIVE_DEPTH = 14;
const LIVE_MOVETIME_MS = 700;

/**
 * Stockfish score (White's point of view) of the given position, refreshed after every move.
 * The previous score stays on screen while the new one is computed; if the engine
 * cannot run, it falls back to the static material evaluation.
 */
export function useLiveEval(fen: string): EngineScore {
  const [score, setScore] = useState<EngineScore>({ cp: 0 });

  useEffect(() => {
    const position = new Chess(fen);
    if (position.isCheckmate()) {
      setScore({ cp: position.turn() === 'w' ? -MATED_CP : MATED_CP });
      return;
    }
    if (position.isStalemate() || position.isInsufficientMaterial()) {
      setScore({ cp: 0 });
      return;
    }

    let stale = false;
    const engine = getEngine('live');
    engine.stop();
    engine
      .analyze(fen, { depth: LIVE_DEPTH, movetime: LIVE_MOVETIME_MS })
      .then((res) => {
        const line = res.lines.find((l) => l.pv.length > 0);
        if (stale || !line) return;
        const flip = position.turn() === 'w' ? 1 : -1;
        setScore(line.mate !== undefined ? { mate: line.mate * flip } : { cp: (line.cp ?? 0) * flip });
      })
      .catch((e) => {
        if (stale || e instanceof CancelledError) return;
        setScore({ cp: getEvalBarScore(position) * 100 });
      });

    return () => {
      stale = true;
      engine.stop();
    };
  }, [fen]);

  return score;
}
