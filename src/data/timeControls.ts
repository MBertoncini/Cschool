export interface TimeControl {
  minutes: number; // 0 = no clock
  increment: number; // seconds added after each move
}

export const NO_CLOCK: TimeControl = { minutes: 0, increment: 0 };

export const DURATION_OPTIONS = [0, 1, 3, 5, 10, 15, 30];
export const INCREMENT_OPTIONS = [0, 1, 2, 3, 5, 10];

export const isTimed = (tc: TimeControl): boolean => tc.minutes > 0;
