import { useCallback, useEffect, useRef, useState } from 'react';
import { Color } from 'chess.js';
import { TimeControl } from '../data/timeControls';

export interface ClockView {
  w: number; // ms remaining
  b: number;
  active: Color | null; // whose clock is running
}

interface LiveClock extends ClockView {
  since: number; // timestamp of the last settlement of the active clock
  increment: number; // ms
}

const TICK_MS = 100;
const SHOW_TENTHS_BELOW_MS = 20_000;

const freshClock = (tc: TimeControl): LiveClock => {
  const ms = tc.minutes * 60_000;
  return { w: ms, b: ms, active: null, since: 0, increment: tc.increment * 1000 };
};

/** Value actually drawn on screen: re-rendering is only needed when this changes. */
const shownValue = (ms: number) =>
  ms < SHOW_TENTHS_BELOW_MS ? Math.ceil(ms / 100) : Math.ceil(ms / 1000) * 10;

/**
 * Two-sided chess clock. Time is derived from timestamps, so it stays correct when the
 * main thread is busy (bot search) or the tab is throttled in the background.
 * The clock starts when White completes the first move.
 */
export function useChessClock(initial: TimeControl, onFlag: (loser: Color) => void) {
  const live = useRef<LiveClock>(freshClock(initial));
  const [view, setView] = useState<ClockView>(() => ({ w: live.current.w, b: live.current.b, active: null }));
  const onFlagRef = useRef(onFlag);
  onFlagRef.current = onFlag;

  const publish = useCallback(() => {
    const { w, b, active } = live.current;
    setView({ w, b, active });
  }, []);

  /** Charges the time elapsed since the last settlement to the running clock. */
  const settle = useCallback(() => {
    const c = live.current;
    if (!c.active) return;
    const now = Date.now();
    c[c.active] = Math.max(0, c[c.active] - (now - c.since));
    c.since = now;
  }, []);

  const reset = useCallback(
    (tc: TimeControl) => {
      live.current = freshClock(tc);
      publish();
    },
    [publish]
  );

  /** Call right after `mover` completed a move: stops their clock and starts the opponent's. */
  const press = useCallback(
    (mover: Color) => {
      settle();
      const c = live.current;
      if (c.active === mover) c[mover] += c.increment;
      c.active = mover === 'w' ? 'b' : 'w';
      c.since = Date.now();
      publish();
    },
    [publish, settle]
  );

  const stop = useCallback(() => {
    settle();
    live.current.active = null;
    publish();
  }, [publish, settle]);

  useEffect(() => {
    if (!view.active) return;
    const id = window.setInterval(() => {
      const c = live.current;
      if (!c.active) return;
      const running = c.active;
      const before = shownValue(c[running]);
      settle();
      if (c[running] <= 0) {
        c.active = null;
        publish();
        onFlagRef.current(running);
      } else if (shownValue(c[running]) !== before) {
        publish();
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [view.active, publish, settle]);

  return { view, reset, press, stop };
}
