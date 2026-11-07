import React from 'react';
import {
  GraduationCap,
  Crown,
  BookOpen,
  Sparkles,
  Bot,
  ArrowRight,
  Zap,
  Swords,
  Award,
  Shield,
} from 'lucide-react';
import { TabType } from '../types/chess';
import { useProgress } from '../context/ProgressContext';
import { LESSONS } from '../data/lessons';
import { ChessPiece } from '../components/ChessPieces';

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
      {/* Welcome Hero Banner: Handcrafted Wood & Brass Inlay */}
      <div className="relative overflow-hidden rounded-2xl wood-panel-raised border border-wood-650 p-6 sm:p-9 shadow-wood-raised-lg">
        {/* Subtle Watermark Silhouette */}
        <div className="absolute -right-8 -top-8 w-64 h-64 opacity-5 pointer-events-none select-none text-wood-100 flex items-center justify-center">
          <ChessPiece type="k" color="w" />
        </div>

        <div className="max-w-2xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-lg wood-well border border-brass/30 text-brass text-xs font-serif font-bold uppercase tracking-widest shadow-wood-inset">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Classical Study & Grandmaster Intuition</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-wood-50 tracking-wide leading-tight">
            Understand What Grandmasters <span className="text-brass">Really Think</span>
          </h1>

          <p className="text-wood-300 text-sm sm:text-base leading-relaxed font-sans">
            Every classical victory is guided by profound logic. Stop guessing mysterious moves and sacrifices.
            Here, key ideas are decoded in clear language — elevating your tactical awareness, positional structure, and endgame execution.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              onClick={() => onSelectTab('gm-decoder')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl wood-btn-brass text-wood-950 font-bold text-xs uppercase tracking-wider shadow-brass-raised transition"
            >
              <Crown className="w-4 h-4 text-wood-950" />
              <span>Study GM Decoder</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>

            <button
              onClick={() => onSelectTab('lessons')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl wood-btn text-wood-200 font-semibold text-xs tracking-wider border border-wood-650 transition"
            >
              <GraduationCap className="w-4 h-4 text-brass" />
              <span>Tactics Curriculum</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress & Stat Cards Grid: Neuromorphic Tactile Wooden Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tier & XP */}
        <div className="wood-panel rounded-xl p-5 shadow-wood-raised border border-wood-700/70 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-serif uppercase font-bold text-wood-400 tracking-wider">Academy Rank</span>
              <div className="w-7 h-7 rounded-lg wood-well text-brass border border-brass/30 flex items-center justify-center font-mono font-bold text-xs shadow-wood-inset">
                {progress.level}
              </div>
            </div>
            <div className="font-serif text-2xl font-bold text-wood-100">Tier {progress.level}</div>
            <div className="text-xs font-mono text-wood-400 mb-3">{progress.xp} Total XP</div>
          </div>
          <div>
            {/* Progress bar */}
            <div className="w-full wood-well rounded-full h-2 overflow-hidden border border-wood-750 p-0.5 shadow-wood-inset">
              <div
                className="bg-brass h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${levelProgressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-wood-400 mt-2 font-medium">
              <span>{xpInCurrentLevel} XP</span>
              <span>Next: Tier {progress.level + 1}</span>
            </div>
          </div>
        </div>

        {/* Tactics Rating */}
        <div className="wood-panel rounded-xl p-5 shadow-wood-raised border border-wood-700/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-serif uppercase font-bold text-wood-400 tracking-wider">Tactics Rating</span>
              <div className="p-1 rounded-md wood-well border border-wood-750">
                <Zap className="w-4 h-4 text-brass" />
              </div>
            </div>
            <div className="font-serif text-2xl font-bold text-wood-100 font-mono">{progress.tacticsRating}</div>
            <div className="text-xs text-brass font-medium mt-1 font-mono">
              {progress.solvedPuzzles.length} Puzzles Solved
            </div>
          </div>
          <button
            onClick={() => onSelectTab('puzzles')}
            className="mt-4 text-xs font-serif text-brass hover:text-wood-100 font-bold flex items-center gap-1 group transition"
          >
            <span>Solve Next Position</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Curriculum Progress */}
        <div className="wood-panel rounded-xl p-5 shadow-wood-raised border border-wood-700/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-serif uppercase font-bold text-wood-400 tracking-wider">Curriculum</span>
              <div className="p-1 rounded-md wood-well border border-wood-750">
                <GraduationCap className="w-4 h-4 text-wood-300" />
              </div>
            </div>
            <div className="font-serif text-2xl font-bold text-wood-100">
              {completedCount} <span className="text-sm font-sans font-normal text-wood-400">/ {totalLessons}</span>
            </div>
            <div className="text-xs text-wood-300 mt-1 font-mono">{completedPercent}% Completed</div>
          </div>
          <button
            onClick={() => onSelectTab('lessons')}
            className="mt-4 text-xs font-serif text-brass hover:text-wood-100 font-bold flex items-center gap-1 group transition"
          >
            <span>Continue Curriculum</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Sparring Record */}
        <div className="wood-panel rounded-xl p-5 shadow-wood-raised border border-wood-700/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-serif uppercase font-bold text-wood-400 tracking-wider">Sparring Record</span>
              <div className="p-1 rounded-md wood-well border border-wood-750">
                <Bot className="w-4 h-4 text-brass" />
              </div>
            </div>
            <div className="font-serif text-2xl font-bold text-wood-100 font-mono">
              {progress.botRecord.wins}W <span className="text-wood-500 font-light">-</span> {progress.botRecord.losses}L
            </div>
            <div className="text-xs text-wood-300 mt-1 font-mono">
              {progress.botRecord.defeatedBots.length} Engines Bested
            </div>
          </div>
          <div className="flex items-center gap-2.5 mt-4">
            <button
              onClick={() => onSelectTab('play-bot')}
              className="text-xs font-serif text-brass hover:text-wood-100 font-bold flex items-center gap-1 group transition"
            >
              <span>Spar Now</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-wood-600">·</span>
            <button
              onClick={() => onSelectTab('my-games')}
              className="text-xs text-wood-400 hover:text-wood-200 font-medium"
            >
              Archives
            </button>
          </div>
        </div>
      </div>

      {/* The GM Secret Decoder Insight Box: Tactile Study Panel */}
      <div className="wood-panel rounded-2xl p-6 sm:p-7 border border-wood-700 relative overflow-hidden shadow-wood-raised">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-brass font-serif font-bold text-xs uppercase tracking-widest">
              <Crown className="w-4 h-4" />
              <span>Classical Principle Revealed</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-wood-100">
              Why do Grandmasters play moves that appear to do nothing?
            </h3>
            <p className="text-wood-300 text-sm leading-relaxed font-sans">
              Amateurs attack directly: <i className="text-wood-200">"I threaten your piece, you retreat."</i> 
              Grandmasters practice <b>Prophylaxis</b>: they deduce what move your plan requires two turns ahead, and calmly disarm it before you can execute.
              Step inside our interactive studies to observe this mastery in classic matches.
            </p>
          </div>

          <button
            onClick={() => onSelectTab('gm-decoder')}
            className="shrink-0 px-5 py-3 rounded-xl wood-btn-brass text-wood-950 font-bold text-xs uppercase tracking-wider shadow-brass-raised transition flex items-center gap-2"
          >
            <span>Study Morphy's Opera Game</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Core Learning Tracks: 4 Tactile Wooden Pillars */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-wood-100 tracking-wide flex items-center gap-2">
            <span>Your Mastery Curriculum</span>
          </h2>
          <span className="text-[11px] font-serif font-bold px-2.5 py-0.5 rounded-md wood-well text-wood-300 border border-wood-700 uppercase tracking-wider">
            Structured Path
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div
            onClick={() => onSelectTab('lessons')}
            className="wood-panel hover:wood-panel-raised rounded-xl p-5 cursor-pointer transition group border border-wood-700/70 hover:border-brass/50 shadow-wood-raised flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-serif font-bold text-brass wood-well px-2 py-0.5 rounded border border-brass/30 uppercase tracking-widest">
                  Stage 1
                </span>
                <div className="w-8 h-8 rounded-lg wood-well border border-wood-700 flex items-center justify-center text-brass shadow-wood-inset">
                  <Swords className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-serif font-bold text-wood-100 group-hover:text-brass transition mb-1.5 text-base">
                Tactical Foundations
              </h3>
              <p className="text-xs text-wood-400 leading-relaxed mb-4">
                Master the Fork, Pin, Skewer, and Discovered Attack to recognize decisive geometry on instinct.
              </p>
            </div>
            <div className="flex items-center text-xs font-serif font-bold text-brass gap-1">
              <span>Enter Academy</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => onSelectTab('openings')}
            className="wood-panel hover:wood-panel-raised rounded-xl p-5 cursor-pointer transition group border border-wood-700/70 hover:border-brass/50 shadow-wood-raised flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-serif font-bold text-brass wood-well px-2 py-0.5 rounded border border-brass/30 uppercase tracking-widest">
                  Stage 2
                </span>
                <div className="w-8 h-8 rounded-lg wood-well border border-wood-700 flex items-center justify-center text-brass shadow-wood-inset">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-serif font-bold text-wood-100 group-hover:text-brass transition mb-1.5 text-base">
                Opening Principles
              </h3>
              <p className="text-xs text-wood-400 leading-relaxed mb-4">
                Replace memorization with architectural comprehension. Understand WHY moves are played in the Italian, Ruy Lopez, and Sicilian.
              </p>
            </div>
            <div className="flex items-center text-xs font-serif font-bold text-brass gap-1">
              <span>Explore Repertoires</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => onSelectTab('gm-decoder')}
            className="wood-panel hover:wood-panel-raised rounded-xl p-5 cursor-pointer transition group border border-wood-700/70 hover:border-brass/50 shadow-wood-raised flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-serif font-bold text-brass wood-well px-2 py-0.5 rounded border border-brass/30 uppercase tracking-widest">
                  Stage 3
                </span>
                <div className="w-8 h-8 rounded-lg wood-well border border-wood-700 flex items-center justify-center text-brass shadow-wood-inset">
                  <Crown className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-serif font-bold text-wood-100 group-hover:text-brass transition mb-1.5 text-base">
                Grandmaster Decoder
              </h3>
              <p className="text-xs text-wood-400 leading-relaxed mb-4">
                Move-by-move dissection of immortals from Morphy, Capablanca, Fischer, and Kasparov with clear commentary.
              </p>
            </div>
            <div className="flex items-center text-xs font-serif font-bold text-brass gap-1">
              <span>Decode Classics</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Step 4 */}
          <div
            onClick={() => onSelectTab('play-bot')}
            className="wood-panel hover:wood-panel-raised rounded-xl p-5 cursor-pointer transition group border border-wood-700/70 hover:border-brass/50 shadow-wood-raised flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-serif font-bold text-brass wood-well px-2 py-0.5 rounded border border-brass/30 uppercase tracking-widest">
                  Stage 4
                </span>
                <div className="w-8 h-8 rounded-lg wood-well border border-wood-700 flex items-center justify-center text-brass shadow-wood-inset">
                  <Bot className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-serif font-bold text-wood-100 group-hover:text-brass transition mb-1.5 text-base">
                Sparring Arena
              </h3>
              <p className="text-xs text-wood-400 leading-relaxed mb-4">
                Test your newly acquired understanding against 5 calibrated sparring engines ranging from Elo 400 to 2100+.
              </p>
            </div>
            <div className="flex items-center text-xs font-serif font-bold text-brass gap-1">
              <span>Begin Match</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
