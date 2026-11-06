import React from 'react';
import {
  GraduationCap,
  Crown,
  BookOpen,
  Sparkles,
  Bot,
  ArrowRight,
  CheckCircle2,
  Award,
  Zap,
} from 'lucide-react';
import { TabType } from '../types/chess';
import { useProgress } from '../context/ProgressContext';
import { LESSONS } from '../data/lessons';
import { PUZZLES } from '../data/puzzles';

interface DashboardViewProps {
  onSelectTab: (tab: TabType) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onSelectTab }) => {
  const { progress } = useProgress();

  const completedCount = progress.completedLessons.length;
  const totalLessons = LESSONS.length;
  const completedPercent = Math.round((completedCount / totalLessons) * 100);

  // XP Progress towards next level
  const nextLevelXp = Math.pow(progress.level, 2) * 100;
  const currentLevelBaseXp = Math.pow(progress.level - 1, 2) * 100;
  const xpInCurrentLevel = Math.max(0, progress.xp - currentLevelBaseXp);
  const xpNeededForLevel = Math.max(100, nextLevelXp - currentLevelBaseXp);
  const levelProgressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-[#27231e] to-stone-900 border border-stone-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-12 -top-12 text-9xl opacity-5 select-none pointer-events-none">
          ♚
        </div>

        <div className="max-w-2xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Designed for Beginners Learning Master Chess
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Understand What Grandmasters <span className="text-amber-400">Really Think</span>
          </h1>

          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            Ever watched a grandmaster game and wondered: <i>"Why did they play that pawn move? Why did they sacrifice their queen?"</i>
            Here, every move is explained in plain language — helping you upgrade your chess intuition, tactical vision, and winning technique.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onSelectTab('gm-decoder')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Crown className="w-4 h-4" />
              <span>Explore The GM Decoder</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => onSelectTab('lessons')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-semibold text-sm border border-stone-700 transition"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Interactive Academy</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress & Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Level & XP */}
        <div className="bg-[#24211d] border border-stone-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-bold text-stone-400 tracking-wider">Academy Rank</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm">
              {progress.level}
            </div>
          </div>
          <div className="text-2xl font-black text-white">Level {progress.level}</div>
          <div className="text-xs text-stone-400 mb-3">{progress.xp} Total XP</div>
          {/* Progress bar */}
          <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden border border-stone-700">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${levelProgressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-stone-500 mt-1.5 font-medium">
            <span>{xpInCurrentLevel} XP</span>
            <span>Next: Level {progress.level + 1}</span>
          </div>
        </div>

        {/* Tactics Rating */}
        <div className="bg-[#24211d] border border-stone-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-bold text-stone-400 tracking-wider">Tactics Rating</span>
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{progress.tacticsRating}</div>
          <div className="text-xs text-emerald-400 mt-1 font-semibold">
            {progress.solvedPuzzles.length} Puzzles Solved
          </div>
          <button
            onClick={() => onSelectTab('puzzles')}
            className="mt-3 text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 group"
          >
            Solve Next Puzzle
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Curriculum Progress */}
        <div className="bg-[#24211d] border border-stone-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-bold text-stone-400 tracking-wider">Curriculum</span>
            <GraduationCap className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {completedCount} <span className="text-sm font-normal text-stone-400">/ {totalLessons}</span>
          </div>
          <div className="text-xs text-blue-400 mt-1 font-semibold">{completedPercent}% Completed</div>
          <button
            onClick={() => onSelectTab('lessons')}
            className="mt-3 text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 group"
          >
            Continue Learning
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Bot Battles Record */}
        <div className="bg-[#24211d] border border-stone-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-bold text-stone-400 tracking-wider">Bot Matches</span>
            <Bot className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {progress.botRecord.wins}W <span className="text-stone-500 font-light">-</span> {progress.botRecord.losses}L
          </div>
          <div className="text-xs text-purple-400 mt-1 font-semibold">
            {progress.botRecord.defeatedBots.length} Bots Defeated
          </div>
          <button
            onClick={() => onSelectTab('play-bot')}
            className="mt-3 text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 group"
          >
            Play a Match
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* The GM Secret Decoder Insight Box */}
      <div className="bg-[#211e1a] border border-amber-900/30 rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider">
              <Crown className="w-4 h-4" />
              <span>Beginner Mystery Solved</span>
            </div>
            <h3 className="text-xl font-bold text-white">
              Why do Grandmasters make moves that look like nothing is happening?
            </h3>
            <p className="text-stone-300 text-sm leading-relaxed">
              Beginners play with direct attacks: <i>"I attack your queen, you move it."</i> 
              Grandmasters play <b>Prophylaxis</b>: they see what move you WANT to play two turns from now, and silently prevent it beforehand!
              Check out our interactive game studies to watch this secret in action.
            </p>
          </div>

          <button
            onClick={() => onSelectTab('gm-decoder')}
            className="shrink-0 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-md transition flex items-center gap-2"
          >
            <span>Study Paul Morphy's Opera Game</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Core Learning Tracks */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <span>Your Mastery Path</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-800 text-stone-400">
            Structured Roadmap
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div
            onClick={() => onSelectTab('lessons')}
            className="bg-[#24211d] hover:bg-[#2c2823] border border-stone-800 hover:border-emerald-600/50 rounded-xl p-5 cursor-pointer transition group shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                Stage 1
              </span>
              <span className="text-xl">⚔️</span>
            </div>
            <h3 className="font-bold text-white group-hover:text-amber-400 transition mb-1">
              Tactics Fundamentals
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed mb-4">
              Learn the Fork, Pin, Skewer, and Discovered Attack so you never fall for cheap tricks.
            </p>
            <div className="flex items-center text-xs font-semibold text-emerald-400 gap-1">
              <span>Start Lessons</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => onSelectTab('openings')}
            className="bg-[#24211d] hover:bg-[#2c2823] border border-stone-800 hover:border-amber-600/50 rounded-xl p-5 cursor-pointer transition group shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                Stage 2
              </span>
              <span className="text-xl">📖</span>
            </div>
            <h3 className="font-bold text-white group-hover:text-amber-400 transition mb-1">
              Opening Principles
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed mb-4">
              Stop memorizing lines blindly. Understand WHY moves are played in the Italian, Ruy Lopez, and Sicilian.
            </p>
            <div className="flex items-center text-xs font-semibold text-amber-400 gap-1">
              <span>Explore Openings</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => onSelectTab('gm-decoder')}
            className="bg-[#24211d] hover:bg-[#2c2823] border border-stone-800 hover:border-blue-600/50 rounded-xl p-5 cursor-pointer transition group shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                Stage 3
              </span>
              <span className="text-xl">👑</span>
            </div>
            <h3 className="font-bold text-white group-hover:text-amber-400 transition mb-1">
              GM Game Decoder
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed mb-4">
              Interactive move-by-move breakdown of legendary games from Morphy, Fischer, and Kasparov.
            </p>
            <div className="flex items-center text-xs font-semibold text-blue-400 gap-1">
              <span>Decode Games</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Step 4 */}
          <div
            onClick={() => onSelectTab('play-bot')}
            className="bg-[#24211d] hover:bg-[#2c2823] border border-stone-800 hover:border-purple-600/50 rounded-xl p-5 cursor-pointer transition group shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                Stage 4
              </span>
              <span className="text-xl">🤖</span>
            </div>
            <h3 className="font-bold text-white group-hover:text-amber-400 transition mb-1">
              Bot Arena & Coaching
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed mb-4">
              Put your new skills to the test against 5 bots ranging from Elo 400 (Beginner) to 2100+ (Master).
            </p>
            <div className="flex items-center text-xs font-semibold text-purple-400 gap-1">
              <span>Battle Bots</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
