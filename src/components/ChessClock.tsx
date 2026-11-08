import React from 'react';
import { DURATION_OPTIONS, INCREMENT_OPTIONS, TimeControl, isTimed } from '../data/timeControls';

const LOW_TIME_MS = 30_000;

function formatClock(ms: number): string {
  if (ms < 20_000) return (Math.ceil(ms / 100) / 10).toFixed(1);
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const ClockFace: React.FC<{ ms: number; running: boolean }> = ({ ms, running }) => {
  const tone =
    running && ms < LOW_TIME_MS
      ? 'bg-rose-800 text-rose-50 border-rose-500'
      : running
        ? 'wood-btn-brass text-wood-950 border-brass'
        : 'wood-well text-wood-300 border-wood-700';

  return (
    <div
      role="timer"
      className={`shrink-0 min-w-[68px] px-2.5 py-1 rounded-lg border text-center font-mono font-bold text-base tabular-nums shadow-wood-inset ${tone}`}
    >
      {formatClock(ms)}
    </div>
  );
};

interface TimeControlPickerProps {
  value: TimeControl;
  onChange: (tc: TimeControl) => void;
}

const chipClass = (selected: boolean) =>
  `px-1 py-1.5 rounded-lg text-[11px] font-serif font-bold transition ${
    selected ? 'wood-btn-brass text-wood-950' : 'wood-btn text-wood-300'
  }`;

export const TimeControlPicker: React.FC<TimeControlPickerProps> = ({ value, onChange }) => (
  <div className="space-y-2.5">
    <div className="grid grid-cols-4 gap-1.5">
      {DURATION_OPTIONS.map((minutes) => (
        <button
          key={minutes}
          onClick={() => onChange({ minutes, increment: minutes === 0 ? 0 : value.increment })}
          className={chipClass(value.minutes === minutes)}
        >
          {minutes === 0 ? 'No clock' : `${minutes} min`}
        </button>
      ))}
    </div>

    {isTimed(value) && (
      <div className="space-y-1.5">
        <span className="text-wood-400 font-medium">Increment per move:</span>
        <div className="grid grid-cols-6 gap-1.5">
          {INCREMENT_OPTIONS.map((increment) => (
            <button
              key={increment}
              onClick={() => onChange({ minutes: value.minutes, increment })}
              className={chipClass(value.increment === increment)}
            >
              {increment === 0 ? 'None' : `+${increment}s`}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
);
