import { Square, PieceSymbol, Color } from 'chess.js';

export type TabType = 'dashboard' | 'lessons' | 'openings' | 'gm-decoder' | 'puzzles' | 'play-bot' | 'local-game' | 'my-games' | 'profile';

export type LessonCategory = 'tactics-basics' | 'tactics-intermediate' | 'strategy' | 'endgames';

export interface LessonStep {
  fen: string;
  instruction: string;
  explanation: string;
  expectedMove: { from: Square; to: Square; promotion?: string };
  hint: string;
  opponentReply?: { from: Square; to: Square; promotion?: string; replyFen?: string };
  followUpStep?: {
    fen: string;
    instruction: string;
    explanation: string;
    expectedMove: { from: Square; to: Square; promotion?: string };
    hint?: string;
  };
  highlightSquares?: Square[];
  arrow?: { from: Square; to: Square; color?: string };
}

export interface Lesson {
  id: string;
  title: string;
  category: LessonCategory;
  tier: number;
  difficulty: 'Beginner' | 'Novice' | 'Intermediate' | 'Advanced';
  summary: string;
  conceptIntro: string;
  keyRule: string;
  xpReward: number;
  steps: LessonStep[];
}

export interface OpeningMoveAnnotation {
  ply: number;
  san: string;
  from: Square;
  to: Square;
  commentary: string;
  grandmasterLogic: string; // Plain English: why this move instead of a beginner's instinctive move
  whiteThreat?: string;
  blackThreat?: string;
  arrow?: { from: Square; to: Square; color?: string };
}

export interface Opening {
  id: string;
  name: string;
  eco: string;
  side: 'White' | 'Black' | 'Both';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description?: string;
  summary?: string;
  overview: string;
  whiteMainPlan: string[];
  blackMainPlan: string[];
  commonMistakes: string[];
  moves: OpeningMoveAnnotation[];
  startingFen?: string;
}

export interface GameMoveAnnotation {
  ply: number;
  moveNumber: number;
  color: 'w' | 'b';
  san: string;
  from: Square;
  to: Square;
  whyPlayed: string;
  beginnerTrapAvoided?: string;
  principle: string;
  isCritical?: boolean;
  quizPrompt?: string; // If present, user is challenged to find this move!
  arrow?: { from: Square; to: Square; color?: string };
}

export interface MasterGame {
  id: string;
  title: string;
  white: { name: string; title?: string };
  black: { name: string; title?: string };
  event: string;
  year: number;
  result: '1-0' | '0-1' | '1/2-1/2';
  theme: string;
  description: string;
  keyTakeaway: string;
  startingFen?: string;
  moves: GameMoveAnnotation[];
}

export interface TacticalPuzzle {
  id: string;
  title: string;
  fen: string;
  turn: 'w' | 'b';
  rating: number;
  theme: string;
  themeCategory: 'fork' | 'pin' | 'skewer' | 'discovered-attack' | 'back-rank' | 'deflection' | 'checkmate' | 'endgame';
  description: string;
  solutionMoves: { from: Square; to: Square; promotion?: string }[];
  explanation: string;
  hint: string;
}

export interface BotPersonality {
  id: string;
  name: string;
  title: string;
  avatar: string;
  elo: number;
  difficulty: 'Beginner' | 'Casual' | 'Club' | 'Expert' | 'Master';
  description: string;
  style: string;
  color: string;
  depth: number;
  blunderRate: number; // 0.0 to 1.0 probability of making an imperfect move
  quotes: {
    start: string[];
    onBlunder: string[];
    onCapture: string[];
    onCheck: string[];
    onLoss: string[];
    onWin: string[];
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export type PieceSetId = 'bottega' | 'bauhaus' | 'tondo' | 'deco';

export interface UserProgress {
  xp: number;
  level: number;
  tacticsRating: number;
  completedLessons: string[];
  solvedPuzzles: string[];
  studiedOpenings: string[];
  studiedMasterGames: string[];
  botRecord: {
    wins: number;
    losses: number;
    draws: number;
    defeatedBots: string[];
  };
  achievements: string[];
  streakDays: number;
  lastActiveDate: string;
  updatedAt?: string;
  pieceSet?: PieceSetId;
  // Separate from updatedAt: playing on another device must not overwrite a newer choice
  pieceSetUpdatedAt?: string;
}

// ─── Game history & review ────────────────────────────────────────────────

/** Move quality, from best to worst. "book" = known opening theory. */
export type MoveClass = 'book' | 'genial' | 'super' | 'good' | 'bad' | 'blunder';

/** Engine score from White's point of view: centipawns, or moves to mate (+ = White mates). */
export interface EngineScore {
  cp?: number;
  mate?: number;
}

export interface EngineLine {
  score: EngineScore; // White POV
  san: string[]; // principal variation in SAN, starting from the analysed position
}

export interface MotifInfo {
  name: string; // e.g. "Knight Fork", "Absolute Pin", "Back-Rank Mate"
  detail: string; // human sentence explaining it on this board
}

export interface PlyAnalysis {
  ply: number; // 1-based
  san: string;
  uci: string;
  color: 'w' | 'b';
  evalBefore: EngineScore; // best achievable before the move (White POV)
  evalAfter: EngineScore; // after the move that was played (White POV)
  bestSan: string;
  bestUci: string;
  lines: EngineLine[]; // top engine lines from the position BEFORE the move
  reply: EngineLine | null; // engine's expected continuation AFTER the played move
  classification: MoveClass;
  winLoss: number; // winning chances (0-100) the mover gave away
  accuracy: number; // 0-100
  // Coach text and pattern names are recomputed from this data at display time,
  // so the stored/synced analysis stays small and the coach can improve without re-analysing.
}

export interface GameAnalysis {
  version: number;
  depth: number;
  analyzedAt: string;
  plies: PlyAnalysis[];
  accuracy: { w: number; b: number };
  opening?: string;
}

export type GameResult = '1-0' | '0-1' | '1/2-1/2' | '*';

export interface SavedGame {
  id: string;
  createdAt: string;
  updatedAt: string;
  white: string;
  black: string;
  playerColor: 'w' | 'b';
  botId?: string;
  botName?: string;
  botElo?: number;
  botAvatar?: string;
  moves: string[]; // SAN
  result: GameResult;
  termination?: string;
  analysis?: GameAnalysis;
  deleted?: boolean; // tombstone so deletions sync across devices
}
