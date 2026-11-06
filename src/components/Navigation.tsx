import React from 'react';
import {
  GraduationCap,
  BookOpen,
  Crown,
  Sparkles,
  Bot,
  User,
  Volume2,
  VolumeX,
  Flame,
  LayoutDashboard,
} from 'lucide-react';
import { TabType } from '../types/chess';
import { useProgress } from '../context/ProgressContext';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  const { progress, soundEnabled, toggleSound } = useProgress();

  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'lessons', label: 'Academy', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'openings', label: 'Openings', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'gm-decoder', label: 'GM Decoder', icon: <Crown className="w-4 h-4 text-amber-400" />, badge: 'Key' },
    { id: 'puzzles', label: 'Puzzles', icon: <Sparkles className="w-4 h-4 text-emerald-400" /> },
    { id: 'play-bot', label: 'Play Bots', icon: <Bot className="w-4 h-4" /> },
    { id: 'profile', label: 'My Progress', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#1e1c18]/95 backdrop-blur-md border-b border-stone-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand / Logo */}
        <div
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <span className="text-xl">♟️</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                ChessMaster
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">
                Academy
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium hidden sm:block">
              From Beginner to Grandmaster Thinking
            </p>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all relative ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] uppercase font-bold px-1 rounded bg-amber-500 text-stone-900 leading-none py-0.5">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Info: Streak, Level, Sound, Profile Button */}
        <div className="flex items-center gap-3 select-none">
          {/* Daily Streak */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold">
            <Flame className="w-3.5 h-3.5 fill-orange-400" />
            <span>{progress.streakDays}d Streak</span>
          </div>

          {/* User Level & XP */}
          <button
            onClick={() => onSelectTab('profile')}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-stone-800/80 hover:bg-stone-700/80 border border-stone-700 text-xs transition"
          >
            <div className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-black flex items-center justify-center text-[10px]">
              {progress.level}
            </div>
            <div className="text-left hidden md:block">
              <span className="font-bold text-stone-200">Lvl {progress.level}</span>
              <span className="text-[10px] text-stone-400 block -mt-0.5 font-medium">
                {progress.xp} XP
              </span>
            </div>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            className="p-2 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-stone-500" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden flex items-center justify-around bg-[#181614] border-t border-stone-800 py-2 px-1 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition shrink-0 ${
                isActive ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
