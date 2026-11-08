import { PieceSetId } from '../types/chess';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

/** One piece, drawn in a 100x100 box. */
interface PieceDrawing {
  shapes: string[]; // silhouette: overlapping filled paths
  lines?: string[]; // stroked details (grooves, mane, mitre cut)
  dots?: [number, number, number][]; // cx, cy, r (eyes)
  facet?: string; // area painted with the shade colour; defaults to the right half
}

interface PiecePalette {
  gradient?: [string, string, string]; // horizontal body gradient, used instead of `fill`
  fill?: string;
  shade?: string;
  outline: string;
  detail: string;
}

export interface PieceSet {
  id: PieceSetId;
  name: string;
  outlineWidth: number;
  drawings: Record<PieceType, PieceDrawing>;
  w: PiecePalette;
  b: PiecePalette;
}

const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 -${r} ${r}h-${w - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}v-${h - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}z`;
const circle = (x: number, y: number, r: number) =>
  `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 -${2 * r} 0z`;

// ── Bottega: carved Staunton in boxwood and ebony ─────────────────────────────
const bottegaBase = (w: number) => [rr(50 - w, 83, 2 * w, 9, 3.5), rr(50 - w + 5, 76, 2 * w - 10, 8, 2.5)];
const bottegaGroove = (w: number) => `M${50 - w + 6} 83.5H${50 + w - 6}`;
const bottegaRoyalBody = 'M42 55C42 64 37 71 29 77H71C63 71 58 64 58 55Z';

const BOTTEGA: PieceSet = {
  id: 'bottega',
  name: 'Bottega',
  outlineWidth: 3.2,
  w: { gradient: ['#fff1d2', '#ecd09a', '#b98a4c'], outline: '#3f2612', detail: '#7a5228' },
  b: { gradient: ['#6f4a33', '#38231a', '#150c08'], outline: '#0b0604', detail: '#9a7350' },
  drawings: {
    p: {
      shapes: [circle(50, 25, 13), rr(36, 37, 28, 6.5, 3), 'M41.5 42C41.5 57 37 67 31 77H69C63 67 58.5 57 58.5 42Z', ...bottegaBase(24)],
      lines: [bottegaGroove(24), 'M38 40.2H62'],
    },
    r: {
      shapes: ['M29 13h10v8h6.5v-8h9v8h6.5v-8h10v18l-6 7H35l-6-7z', rr(33, 37, 34, 6, 2.5), 'M38 42C38 56 35 67 30 77H70C65 67 62 56 62 42Z', ...bottegaBase(26)],
      lines: [bottegaGroove(26), 'M36 40H64', 'M33 31H67'],
    },
    b: {
      shapes: [circle(50, 10, 4.8), 'M50 13C60 23 67 33 63 42C61 47 56 49 50 49C44 49 39 47 37 42C33 33 40 23 50 13Z', rr(35, 47.5, 30, 6, 3), 'M43 53C43 63 38 71 31 77H69C62 71 57 63 57 53Z', ...bottegaBase(25)],
      lines: [bottegaGroove(25), 'M38 50.5H62', 'M56.5 23L47.5 36'],
    },
    q: {
      shapes: ['M22 25L35 51H65L78 25L63 40L64 17L54.5 38L50 13L45.5 38L36 17L37 40Z', circle(22, 23, 4.2), circle(36, 15, 4.2), circle(50, 10.5, 4.6), circle(64, 15, 4.2), circle(78, 23, 4.2), rr(33, 49.5, 34, 6, 3), bottegaRoyalBody, ...bottegaBase(27)],
      lines: [bottegaGroove(27), 'M36 52.5H64', 'M36 46H64'],
    },
    k: {
      shapes: [rr(47.2, 2.5, 5.6, 19, 1.5), rr(41.5, 7.2, 17, 5.4, 1.5), 'M32 31C31 21 44 18 50 25C56 18 69 21 68 31C67 39 62 44 60 51H40C38 44 33 39 32 31Z', rr(33, 49.5, 34, 6, 3), bottegaRoyalBody, ...bottegaBase(27)],
      lines: [bottegaGroove(27), 'M36 52.5H64', 'M38 45H62', 'M50 25V45'],
    },
    n: {
      shapes: ['M57 15L55 6L47 13.5C33 15 24 24 20 35L12.5 50C10.5 56 14 61 20 61C25 61 27 57.5 32 55.5C38 53 43 50 46 46C45 56 37 66 31 77H72C77 56 76 29 57 15Z', ...bottegaBase(25)],
      lines: [bottegaGroove(25), 'M18.5 52L24 50', 'M60 22C68 34 70 54 67 72', 'M53 25C60 38 62 56 58 72'],
      dots: [[36, 29, 2.6]],
    },
  },
};

// ── Bauhaus: pure geometry ────────────────────────────────────────────────────
const bauhausBase = rr(23, 82, 54, 9, 1);

const BAUHAUS: PieceSet = {
  id: 'bauhaus',
  name: 'Bauhaus',
  outlineWidth: 2.4,
  w: { fill: '#f8f2e6', outline: '#2a2019', detail: '#c0392b' },
  b: { fill: '#1d1a18', outline: '#0a0807', detail: '#d4a359' },
  drawings: {
    p: { shapes: [circle(50, 33, 14), 'M50 42L71 82H29Z', bauhausBase] },
    r: { shapes: ['M27 16h12v9h5.5v-9h11v9h5.5v-9h12v26H27z', 'M33 42H67V82H33Z', bauhausBase] },
    b: { shapes: [circle(50, 30, 16), circle(50, 9, 4), 'M50 46L68 82H32Z', bauhausBase], lines: ['M42 40L60 20'] },
    q: { shapes: ['M26 16A24 30 0 0 0 74 16L62 28L50 12L38 28Z', circle(50, 8, 4.5), 'M50 44L73 82H27Z', bauhausBase] },
    k: { shapes: [rr(30, 22, 40, 24, 1), 'M46 2H54V10H62V18H54V22H46V18H38V10H46Z', 'M50 44L73 82H27Z', bauhausBase] },
    n: { shapes: ['M72 82V16H54L22 44L31 58L47 48L33 82Z', bauhausBase], dots: [[50, 31, 3.6]] },
  },
};

// ── Tondo: chunky and rounded ─────────────────────────────────────────────────
const tondoBase = rr(21, 79, 58, 13, 6.5);
const tondoBody = 'M40 56C40 68 34 74 30 81H70C66 74 60 68 60 56Z';

const TONDO: PieceSet = {
  id: 'tondo',
  name: 'Tondo',
  outlineWidth: 5,
  w: { fill: '#fff8ea', shade: '#e6d2b0', outline: '#33241a', detail: '#33241a' },
  b: { fill: '#46403b', shade: '#2e2925', outline: '#120e0b', detail: '#d9c8ae' },
  drawings: {
    p: { shapes: [circle(50, 32, 17), rr(33, 46, 34, 8, 4), 'M39 52C39 66 34 73 30 81H70C66 73 61 66 61 52Z', tondoBase] },
    r: { shapes: ['M27 13h12v9h5.5v-9h11v9h5.5v-9h12v26a5 5 0 0 1-5 5H32a5 5 0 0 1-5-5z', 'M34 44H66L70 81H30Z', tondoBase] },
    b: { shapes: [circle(50, 10, 5.5), 'M50 11C66 23 71 36 65 46C61 53 39 53 35 46C29 36 34 23 50 11Z', rr(33, 49, 34, 8, 4), tondoBody, tondoBase], lines: ['M57 26L49 37'] },
    q: { shapes: ['M23 24L34 53H66L77 24L63 35L50 14L37 35Z', circle(23, 21, 6), circle(50, 12, 6.5), circle(77, 21, 6), rr(32, 50, 36, 8, 4), tondoBody, tondoBase] },
    k: { shapes: [rr(45, 3, 10, 25, 2.5), rr(38, 8.5, 24, 9.5, 2.5), rr(30, 25, 40, 28, 11), rr(32, 50, 36, 8, 4), tondoBody, tondoBase] },
    n: { shapes: ['M60 15L55 5L46 13.5C31 15 20 27 16 41C13 52 18 60 26 58C33 56 38 52 45 49C43 60 35 70 30 81H74C80 55 77 27 60 15Z', tondoBase], dots: [[37, 29, 3.4]] },
  },
};

// ── Déco: tall faceted silhouettes on stepped plinths ─────────────────────────
const decoBase = ['M25 86H75V93H25Z', 'M31 80H69V86H31Z', 'M36 74H64V80H36Z'];
const decoCollar = (y: number) => `M35 ${y}H65L60 ${y + 6}H40Z`;
const decoShaft = (y: number) => `M44 ${y}H56L62 74H38Z`;

const DECO: PieceSet = {
  id: 'deco',
  name: 'Déco',
  outlineWidth: 2.6,
  w: { fill: '#f5f0e4', shade: '#c2b79f', outline: '#3b2c1c', detail: '#3b2c1c' },
  b: { fill: '#474d57', shade: '#272b32', outline: '#0b0d10', detail: '#c9a35e' },
  drawings: {
    p: { shapes: ['M50 16L61 25V37L50 45L39 37V25Z', decoCollar(46), decoShaft(52), ...decoBase] },
    r: { shapes: ['M29 11H40V19H45V11H55V19H60V11H71V30L62 38H38L29 30Z', 'M40 38H60L64 74H36Z', ...decoBase] },
    b: { shapes: ['M50 4L64 27L56 46H44L36 27Z', decoCollar(47), decoShaft(53), ...decoBase], lines: ['M57 20L47 33'] },
    q: { shapes: ['M24 10L39 46H61L76 10L63 28L57 5L50 26L43 5L37 28Z', decoCollar(47), decoShaft(53), ...decoBase] },
    k: { shapes: ['M46.5 3H53.5V9H60V15H53.5V23H46.5V15H40V9H46.5Z', 'M30 23H70L60 46H40Z', decoCollar(47), decoShaft(53), ...decoBase] },
    n: {
      shapes: ['M59 13L55 3L46 12L28 23L14 46L21 56L34 52L45 45L36 74H71L74 40Z', ...decoBase],
      facet: 'M59 13L74 40L71 74H53L54 38Z',
      dots: [[38, 28, 2.8]],
    },
  },
};

export const PIECE_SET_LIST: PieceSet[] = [BOTTEGA, BAUHAUS, TONDO, DECO];
export const DEFAULT_PIECE_SET: PieceSetId = 'bottega';

/** Falls back to the default for missing or unknown ids (e.g. written by a newer version). */
export function getPieceSet(id?: string): PieceSet {
  return PIECE_SET_LIST.find((s) => s.id === id) ?? BOTTEGA;
}
