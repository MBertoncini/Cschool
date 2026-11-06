// Thin promise-based wrapper around the Stockfish WASM web worker (UCI protocol).
// Jobs run one at a time; `stop()` aborts the running search and drops queued jobs.

export interface RawLine {
  multipv: number;
  depth: number;
  cp?: number; // from side-to-move POV
  mate?: number; // from side-to-move POV
  pv: string[]; // UCI moves
}

export interface AnalyzeResult {
  bestmove: string | null;
  lines: RawLine[]; // sorted by multipv
}

export interface AnalyzeOptions {
  depth?: number;
  multiPv?: number;
  movetime?: number; // ms cap
}

interface Job {
  fen: string;
  opts: AnalyzeOptions;
  resolve: (r: AnalyzeResult) => void;
  reject: (e: Error) => void;
}

export class CancelledError extends Error {
  constructor() {
    super('Analysis cancelled');
  }
}

class StockfishEngine {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private queue: Job[] = [];
  private current: { job: Job; lines: Map<number, RawLine> } | null = null;
  private listeners: ((line: string) => void)[] = [];

  private boot(): Promise<void> {
    if (this.ready) return this.ready;
    this.ready = new Promise<void>((resolve, reject) => {
      try {
        const url = new URL('stockfish/stockfish-18-lite-single.js', document.baseURI).href;
        this.worker = new Worker(url);
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
        return;
      }
      this.worker.onmessage = (ev: MessageEvent) => {
        const line = typeof ev.data === 'string' ? ev.data : '';
        this.listeners.forEach((l) => l(line));
        this.handleLine(line);
      };
      this.worker.onerror = (ev) => {
        reject(new Error(ev.message || 'Stockfish failed to load'));
      };
      const onBoot = (line: string) => {
        if (line === 'uciok') {
          this.send('setoption name Hash value 32');
          this.send('isready');
        } else if (line === 'readyok') {
          this.listeners = this.listeners.filter((l) => l !== onBoot);
          resolve();
        }
      };
      this.listeners.push(onBoot);
      this.send('uci');
    });
    return this.ready;
  }

  private send(cmd: string) {
    this.worker?.postMessage(cmd);
  }

  private handleLine(line: string) {
    if (!this.current) return;
    if (line.startsWith('info ') && line.includes(' pv ')) {
      if (line.includes(' lowerbound') || line.includes(' upperbound')) return;
      const tokens = line.split(' ');
      const get = (k: string) => {
        const i = tokens.indexOf(k);
        return i >= 0 ? tokens[i + 1] : undefined;
      };
      const multipv = Number(get('multipv') ?? 1);
      const depth = Number(get('depth') ?? 0);
      const scoreIdx = tokens.indexOf('score');
      const pvIdx = tokens.indexOf('pv');
      if (scoreIdx < 0 || pvIdx < 0) return;
      const kind = tokens[scoreIdx + 1];
      const val = Number(tokens[scoreIdx + 2]);
      const raw: RawLine = { multipv, depth, pv: tokens.slice(pvIdx + 1).filter(Boolean) };
      if (kind === 'mate') raw.mate = val;
      else raw.cp = val;
      this.current.lines.set(multipv, raw);
    } else if (line.startsWith('bestmove')) {
      const { job, lines } = this.current;
      this.current = null;
      const best = line.split(' ')[1];
      job.resolve({
        bestmove: best && best !== '(none)' ? best : null,
        lines: [...lines.values()].sort((a, b) => a.multipv - b.multipv),
      });
      this.pump();
    }
  }

  private pump() {
    if (this.current || this.queue.length === 0) return;
    const job = this.queue.shift()!;
    this.current = { job, lines: new Map() };
    const { depth = 14, multiPv = 1, movetime } = job.opts;
    this.send(`setoption name MultiPV value ${multiPv}`);
    this.send(`position fen ${job.fen}`);
    this.send(`go depth ${depth}${movetime ? ` movetime ${movetime}` : ''}`);
  }

  async analyze(fen: string, opts: AnalyzeOptions = {}): Promise<AnalyzeResult> {
    await this.boot();
    return new Promise<AnalyzeResult>((resolve, reject) => {
      this.queue.push({ fen, opts, resolve, reject });
      this.pump();
    });
  }

  /** Abort the running search (it resolves with what it found) and cancel queued jobs. */
  stop() {
    const dropped = this.queue.splice(0);
    dropped.forEach((j) => j.reject(new CancelledError()));
    if (this.current) this.send('stop');
  }

  newGame() {
    if (this.worker) this.send('ucinewgame');
  }
}

// Two independent workers: "batch" for full-game analysis, "live" for exploring
// variations on the board, so one never cancels the other.
const engines = new Map<string, StockfishEngine>();
export function getEngine(kind: 'batch' | 'live' = 'batch'): StockfishEngine {
  let e = engines.get(kind);
  if (!e) {
    e = new StockfishEngine();
    engines.set(kind, e);
  }
  return e;
}
