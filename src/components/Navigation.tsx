import React from 'react';
import {
  GraduationCap,
  BookOpen,
  Crown,
  Sparkles,
  Bot,
  User,
  Users,
  Volume2,
  VolumeX,
  Flame,
  LayoutDashboard,
  History,
} from 'lucide-react';
import { TabType } from '../types/chess';
import { useProgress } from '../context/ProgressContext';
import { ChessPiece } from './ChessPieces';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  const { progress, soundEnabled, toggleSound } = useProgress();

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Hall', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'lessons', label: 'Academy', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'openings', label: 'Openings', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'gm-decoder', label: 'GM Decoder', icon: <Crown className="w-4 h-4 text-brass" /> },
    { id: 'puzzles', label: 'Tactics', icon: <Sparkles className="w-4 h-4 text-wood-200" /> },
    { id: 'play-bot', label: 'Sparring', icon: <Bot className="w-4 h-4" /> },
    { id: 'local-game', label: 'Duel', icon: <Users className="w-4 h-4" /> },
    { id: 'my-games', label: 'Archives', icon: <History className="w-4 h-4 text-brass" /> },
    { id: 'profile', label: 'Record', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-wood-950/95 backdrop-blur-md border-b border-wood-700/60 shadow-wood-raised">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand / Logo */}
        <div
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-3.5 cursor-pointer group select-none"
        >
          {/* Handcrafted Wooden Knight Medallion */}
          <div className="w-10 h-10 rounded-xl wood-panel flex items-center justify-center p-1.5 border border-wood-650 group-hover:border-brass/70 group-hover:scale-[1.03] transition-all shadow-wood-raised">
            <div className="w-full h-full flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
              <ChessPiece type="n" color="w" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold tracking-wide text-wood-100 group-hover:text-brass transition-colors">
                ChessMaster
              </span>
              <span className="xl:hidden text-[10px] font-bold font-sans px-2 py-0.5 rounded-md wood-well text-brass border border-brass/30 uppercase tracking-widest">
                Academy
              </span>
            </div>
            <p className="text-[10px] text-wood-400 font-medium tracking-wide hidden sm:block">
              Classical Mastery & Intuition
            </p>
          </div>
        </div>

        {/* Center Navigation Links: Neuromorphic Wood Tabs */}
        <nav className="hidden xl:flex items-center gap-1 p-1 wood-well rounded-xl">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-all ${
                  isActive
                    ? 'wood-tab-active font-bold text-brass'
                    : 'wood-tab-inactive'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Info: Streak, Level, Sound, Profile Button */}
        <div className="flex items-center gap-2.5 select-none">
          {/* Daily Streak */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg wood-well border border-wood-700/60 text-brass text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-brass" />
            <span className="font-mono text-wood-200 whitespace-nowrap" title="Daily streak">
              {progress.streakDays}d<span className="xl:hidden"> Streak</span>
            </span>
          </div>

          {/* User Level & XP */}
          <button
            onClick={() => onSelectTab('profile')}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg wood-btn text-xs font-medium border border-wood-650"
          >
            <div className="w-5 h-5 rounded-md wood-btn-brass text-wood-950 font-black flex items-center justify-center text-[10px]">
              {progress.level}
            </div>
            <div className="text-left hidden md:block">
              <span className="font-serif font-bold text-wood-200 text-xs">Tier {progress.level}</span>
              <span className="text-[10px] text-wood-400 block -mt-0.5 font-mono">
                {progress.xp} XP
              </span>
            </div>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            className="p-2 rounded-lg wood-btn text-wood-300 hover:text-wood-100 transition"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-brass" />
            ) : (
              <VolumeX className="w-4 h-4 text-wood-500" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="xl:hidden flex items-center justify-around wood-well border-t border-wood-800 py-1.5 px-1 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs transition shrink-0 ${
                isActive ? 'text-brass font-bold wood-well border border-wood-700' : 'text-wood-400 hover:text-wood-200'
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
