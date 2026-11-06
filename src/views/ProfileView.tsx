import React from 'react';
import {
  Award,
  Zap,
  GraduationCap,
  BookOpen,
  Crown,
  Bot,
  RotateCcw,
  CheckCircle2,
  Lock,
  Flame,
  Globe,
  History,
  Check,
} from 'lucide-react';
import { useProgress, ACHIEVEMENTS_LIST } from '../context/ProgressContext';
import { useGames } from '../context/GamesContext';
import { LESSONS } from '../data/lessons';
import { OPENINGS } from '../data/openings';
import { MASTER_GAMES } from '../data/masterGames';

export const ProfileView: React.FC = () => {
  const { progress, resetProgress } = useProgress();
  const { games, sync } = useGames();

  const getRankTitle = (lvl: number) => {
    if (lvl <= 1) return 'Pawn Novice';
    if (lvl === 2) return 'Knight Squire';
    if (lvl === 3) return 'Bishop Tactician';
    if (lvl === 4) return 'Rook Strategist';
    if (lvl === 5) return 'Queen Prodigy';
    return 'Grandmaster Scholar';
  };

  const nextLevelXp = Math.pow(progress.level, 2) * 100;
  const currentBaseXp = Math.pow(progress.level - 1, 2) * 100;
  const xpCurrent = Math.max(0, progress.xp - currentBaseXp);
  const xpNeeded = Math.max(100, nextLevelXp - currentBaseXp);
  const progressPercent = Math.min(100, Math.round((xpCurrent / xpNeeded) * 100));

  const analyzedCount = games.filter((g) => Boolean(g.analysis)).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in">
      {/* User Header Profile Card */}
      <div className="bg-[#24211d] border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-3xl shadow-xl border border-amber-400/30">
              ♟️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">Chess Student</h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Level {progress.level}
                </span>
              </div>
              <p className="text-stone-400 text-sm font-semibold">{getRankTitle(progress.level)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-center">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">Tactics Rating</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{progress.tacticsRating}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
              <span className="text-[10px] text-orange-400 uppercase font-bold block">Streak</span>
              <span className="text-lg font-black text-orange-400">{progress.streakDays} Days</span>
            </div>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="mt-6 pt-6 border-t border-stone-800/80">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-stone-300">Experience Points: {progress.xp} XP</span>
            <span className="text-amber-400">Next Level: {nextLevelXp} XP</span>
          </div>
          <div className="w-full bg-stone-900 rounded-full h-3 overflow-hidden border border-stone-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-[#24211d] border border-stone-800 rounded-xl p-4 text-center">
          <GraduationCap className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <div className="text-2xl font-black text-white">
            {progress.completedLessons.length} <span className="text-xs text-stone-500">/ {LESSONS.length}</span>
          </div>
          <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider block mt-1">
            Lessons Mastered
          </span>
        </div>

        <div className="bg-[#24211d] border border-stone-800 rounded-xl p-4 text-center">
          <Zap className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <div className="text-2xl font-black text-white">{progress.solvedPuzzles.length}</div>
          <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider block mt-1">
            Puzzles Solved
          </span>
        </div>

        <div className="bg-[#24211d] border border-stone-800 rounded-xl p-4 text-center">
          <BookOpen className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <div className="text-2xl font-black text-white">
            {progress.studiedOpenings.length} <span className="text-xs text-stone-500">/ {OPENINGS.length}</span>
          </div>
          <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider block mt-1">
            Openings Explored
          </span>
        </div>

        <div className="bg-[#24211d] border border-stone-800 rounded-xl p-4 text-center">
          <Bot className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-black text-white">
            {progress.botRecord.wins}W - {progress.botRecord.losses}L
          </div>
          <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider block mt-1">
            Bot Record
          </span>
        </div>

        <div className="bg-[#24211d] border border-stone-800 rounded-xl p-4 text-center col-span-2 sm:col-span-1">
          <History className="w-6 h-6 text-teal-400 mx-auto mb-2" />
          <div className="text-2xl font-black text-white">
            {games.length}{' '}
            <span className="text-xs text-stone-500 font-normal">({analyzedCount} analyzed)</span>
          </div>
          <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider block mt-1">
            Saved Matches
          </span>
        </div>
      </div>

      {/* GitHub Sync Status Card */}
      <div className="bg-[#24211d] border border-stone-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-700 flex items-center justify-center text-xl">
            {sync.user ? (
              <img
                src={sync.user.avatarUrl}
                alt={sync.user.login}
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              '☁️'
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Cross-Device Match Sync (GitHub)</span>
              {sync.user ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                  Connected as @{sync.user.login}
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-700 font-bold">
                  Offline / Local
                </span>
              )}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {sync.user
                ? 'Your match history and coach reviews are synchronized across all your devices via a private GitHub Gist.'
                : 'Connect your GitHub account in the My Games tab to synchronize matches between desktop, laptop, and phone.'}
            </p>
          </div>
        </div>

        {sync.lastSync && (
          <span className="text-[11px] text-stone-500 font-medium shrink-0">
            Last synced: {new Date(sync.lastSync).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Badges & Achievements Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Achievements & Badges</span>
          </h2>
          <span className="text-xs font-bold text-stone-400">
            {progress.achievements.length} / {ACHIEVEMENTS_LIST.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ACHIEVEMENTS_LIST.map((ach) => {
            const isUnlocked = progress.achievements.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`p-4 rounded-xl border transition-all ${
                  isUnlocked
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-lg'
                    : 'bg-[#1e1c18]/50 border-stone-800/80 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{ach.icon}</span>
                  {isUnlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-stone-600" />
                  )}
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{ach.title}</h4>
                <p className="text-xs text-stone-400 leading-relaxed">{ach.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Management & GitHub Pages Deployment Info */}
      <div className="bg-[#1e1c18] border border-stone-800 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-xs font-bold text-stone-300 block">
            Offline & Static Storage (localStorage)
          </span>
          <p className="text-xs text-stone-500">
            Your progress is securely remembered locally in your browser. Fully functional on GitHub Pages with no server needed!
          </p>
        </div>

        <button
          onClick={resetProgress}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-900/50 text-xs font-semibold transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Progress</span>
        </button>
      </div>
    </div>
  );
};
