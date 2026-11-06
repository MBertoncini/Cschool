import { Square, PieceSymbol, Color } from 'chess.js';

export type TabType = 'dashboard' | 'lessons' | 'openings' | 'gm-decoder' | 'puzzles' | 'play-bot' | 'profile';

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
}
