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
  Cloud,
} from 'lucide-react';
import { useProgress, ACHIEVEMENTS_LIST } from '../context/ProgressContext';
import { useGames } from '../context/GamesContext';
import { LESSONS } from '../data/lessons';
import { OPENINGS } from '../data/openings';
import { MASTER_GAMES } from '../data/masterGames';
import { ChessPiece } from '../components/ChessPieces';
import { AchievementIcon } from '../components/ChessIcons';

export const ProfileView: React.FC = () => {
  const { progress, resetProgress } = useProgress();
  const { games, sync } = useGames();

  const getRankTitle = (lvl: number) => {
    if (lvl <= 1) return 'Pawn Novice';
    if (lvl === 2) return 'Knight Apprentice';
    if (lvl === 3) return 'Bishop Tactician';
    if (lvl === 4) return 'Rook Strategist';
    if (lvl === 5) return 'Queen Master';
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
      <div className="wood-panel-raised rounded-2xl p-6 sm:p-8 shadow-wood-raised-lg border border-wood-650 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl wood-well p-2.5 flex items-center justify-center shadow-wood-inset border border-wood-650">
              <div className="w-full h-full flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                <ChessPiece type="k" color="w" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-serif text-2xl font-bold text-wood-100">Chess Practitioner</h1>
                <span className="text-xs font-serif font-bold px-2 py-0.5 rounded wood-well text-brass border border-brass/30">
                  Tier {progress.level}
                </span>
              </div>
              <p className="text-wood-400 text-sm font-serif font-medium mt-0.5">{getRankTitle(progress.level)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl wood-well border border-wood-750 text-center shadow-wood-inset">
              <span className="text-[10px] text-wood-400 uppercase font-serif font-bold block">Tactics Rating</span>
              <span className="text-lg font-bold text-brass font-mono">{progress.tacticsRating}</span>
            </div>
            <div className="px-4 py-2 rounded-xl wood-well border border-wood-750 text-center shadow-wood-inset">
              <span className="text-[10px] text-wood-400 uppercase font-serif font-bold block">Streak</span>
              <span className="text-lg font-bold text-wood-100 font-mono">{progress.streakDays} Days</span>
            </div>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="mt-6 pt-6 border-t border-wood-750">
          <div className="flex justify-between text-xs font-mono font-medium mb-2">
            <span className="text-wood-300">Experience Points: {progress.xp} XP</span>
            <span className="text-brass">Next Tier: {nextLevelXp} XP</span>
          </div>
          <div className="w-full wood-well rounded-full h-3 overflow-hidden border border-wood-750 p-0.5 shadow-wood-inset">
            <div
              className="bg-brass h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="wood-panel rounded-xl p-4 text-center border border-wood-700/70 shadow-wood-raised">
          <GraduationCap className="w-5 h-5 text-brass mx-auto mb-2" />
          <div className="font-serif text-2xl font-bold text-wood-100">
            {progress.completedLessons.length} <span className="text-xs font-sans text-wood-400 font-normal">/ {LESSONS.length}</span>
          </div>
          <span className="text-[10px] text-wood-400 font-serif font-bold uppercase tracking-wider block mt-1">
            Lessons Mastered
          </span>
        </div>

        <div className="wood-panel rounded-xl p-4 text-center border border-wood-700/70 shadow-wood-raised">
          <Zap className="w-5 h-5 text-brass mx-auto mb-2" />
          <div className="font-serif text-2xl font-bold text-wood-100 font-mono">{progress.solvedPuzzles.length}</div>
          <span className="text-[10px] text-wood-400 font-serif font-bold uppercase tracking-wider block mt-1">
            Tactics Solved
          </span>
        </div>

        <div className="wood-panel rounded-xl p-4 text-center border border-wood-700/70 shadow-wood-raised">
          <BookOpen className="w-5 h-5 text-brass mx-auto mb-2" />
          <div className="font-serif text-2xl font-bold text-wood-100">
            {progress.studiedOpenings.length} <span className="text-xs font-sans text-wood-400 font-normal">/ {OPENINGS.length}</span>
          </div>
          <span className="text-[10px] text-wood-400 font-serif font-bold uppercase tracking-wider block mt-1">
            Openings Studied
          </span>
        </div>

        <div className="wood-panel rounded-xl p-4 text-center border border-wood-700/70 shadow-wood-raised">
          <Bot className="w-5 h-5 text-brass mx-auto mb-2" />
          <div className="font-serif text-2xl font-bold text-wood-100 font-mono">
            {progress.botRecord.wins}W - {progress.botRecord.losses}L
          </div>
          <span className="text-[10px] text-wood-400 font-serif font-bold uppercase tracking-wider block mt-1">
            Sparring Record
          </span>
        </div>

        <div className="wood-panel rounded-xl p-4 text-center border border-wood-700/70 shadow-wood-raised col-span-2 sm:col-span-1">
          <History className="w-5 h-5 text-brass mx-auto mb-2" />
          <div className="font-serif text-2xl font-bold text-wood-100 font-mono">
            {games.length}{' '}
            <span className="text-xs font-sans text-wood-400 font-normal">({analyzedCount})</span>
          </div>
          <span className="text-[10px] text-wood-400 font-serif font-bold uppercase tracking-wider block mt-1">
            Archived Matches
          </span>
        </div>
      </div>

      {/* GitHub Sync Status Card */}
      <div className="wood-panel rounded-2xl p-5 shadow-wood-raised border border-wood-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl wood-well border border-wood-650 flex items-center justify-center text-brass shadow-wood-inset">
            {sync.user ? (
              <img
                src={sync.user.avatarUrl}
                alt={sync.user.login}
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              <Cloud className="w-5 h-5 text-wood-400" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-serif font-bold text-wood-100 flex items-center gap-2">
              <span>Cross-Device Match Sync (GitHub)</span>
              {sync.user ? (
                <span className="text-[10px] px-2 py-0.5 rounded-md wood-well text-brass border border-brass/30 font-mono">
                  @{sync.user.login}
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-md wood-well text-wood-400 border border-wood-750 font-mono">
                  Local / Offline
                </span>
              )}
            </h3>
            <p className="text-xs text-wood-400 mt-0.5">
              {sync.user
                ? 'Your match history and coach evaluations are synchronized across your devices via a private GitHub Gist.'
                : 'Connect your GitHub token in the Archives tab to synchronize matches between desktop, laptop, and mobile.'}
            </p>
          </div>
        </div>

        {sync.lastSync && (
          <span className="text-[11px] font-mono text-wood-400 shrink-0">
            Last synced: {new Date(sync.lastSync).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Badges & Achievements Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-wood-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-brass" />
            <span>Achievements & Classical Honors</span>
          </h2>
          <span className="text-xs font-mono font-bold text-wood-400">
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
                    ? 'wood-panel-raised border-brass/50 shadow-wood-raised'
                    : 'wood-panel border-wood-800/80 opacity-55'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg wood-well border border-wood-700 flex items-center justify-center shadow-wood-inset">
                    <AchievementIcon name={ach.icon} className={`w-4 h-4 ${isUnlocked ? 'text-brass' : 'text-wood-500'}`} />
                  </div>
                  {isUnlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-brass" />
                  ) : (
                    <Lock className="w-4 h-4 text-wood-600" />
                  )}
                </div>
                <h4 className="font-serif text-sm font-bold text-wood-100 mb-1">{ach.title}</h4>
                <p className="text-xs text-wood-400 leading-relaxed font-sans">{ach.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Management & Static Storage Info */}
      <div className="wood-panel border border-wood-700 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-wood-raised">
        <div className="space-y-1 text-center sm:text-left">
          <span className="font-serif text-xs font-bold text-wood-200 block uppercase tracking-wider">
            Offline & Local Browser Storage
          </span>
          <p className="text-xs text-wood-400">
            Your progress is securely recorded in your browser localStorage. Fully functional offline with zero servers required.
          </p>
        </div>

        <button
          onClick={resetProgress}
          className="shrink-0 px-3.5 py-1.5 rounded-lg wood-btn text-rose-300 border border-rose-900/40 text-xs font-semibold transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Record</span>
        </button>
      </div>
    </div>
  );
};
