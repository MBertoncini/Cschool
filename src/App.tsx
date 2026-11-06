import React, { useState } from 'react';
import { TabType } from './types/chess';
import { ProgressProvider, useProgress } from './context/ProgressContext';
import { Navigation } from './components/Navigation';
import { DashboardView } from './views/DashboardView';
import { LessonsView } from './views/LessonsView';
import { OpeningsView } from './views/OpeningsView';
import { GMDecoderView } from './views/GMDecoderView';
import { PuzzlesView } from './views/PuzzlesView';
import { PlayBotView } from './views/PlayBotView';
import { ProfileView } from './views/ProfileView';
import { Sparkles, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const { recentToast, clearToast } = useProgress();

  return (
    <div className="min-h-screen flex flex-col bg-[#161412] text-gray-100">
      {/* Navigation Header */}
      <Navigation currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Floating Toast Notification */}
      {recentToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="bg-[#2a2621] border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl flex items-center gap-3.5 max-w-sm">
            <span className="text-3xl shrink-0">{recentToast.icon || '🏆'}</span>
            <div className="flex-1">
              <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                {recentToast.title}
              </h4>
              <p className="text-sm font-bold text-white mt-0.5">{recentToast.message}</p>
            </div>
            <button
              onClick={clearToast}
              className="text-stone-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main View Body */}
      <main className="flex-1 pb-16">
        {currentTab === 'dashboard' && <DashboardView onSelectTab={setCurrentTab} />}
        {currentTab === 'lessons' && <LessonsView />}
        {currentTab === 'openings' && <OpeningsView />}
        {currentTab === 'gm-decoder' && <GMDecoderView />}
        {currentTab === 'puzzles' && <PuzzlesView />}
        {currentTab === 'play-bot' && <PlayBotView />}
        {currentTab === 'profile' && <ProfileView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800/80 py-6 text-center text-xs text-stone-500 bg-[#12110f]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-300">ChessMaster Academy</span>
            <span>—</span>
            <span>Designed for GitHub Pages & Offline Play</span>
          </div>
          <div className="flex items-center gap-4 text-stone-400">
            <button onClick={() => setCurrentTab('gm-decoder')} className="hover:text-amber-400 transition">
              GM Decoder
            </button>
            <button onClick={() => setCurrentTab('lessons')} className="hover:text-amber-400 transition">
              Academy
            </button>
            <button onClick={() => setCurrentTab('play-bot')} className="hover:text-amber-400 transition">
              Bots
            </button>
            <button onClick={() => setCurrentTab('puzzles')} className="hover:text-amber-400 transition">
              Puzzles
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ProgressProvider>
      <AppContent />
    </ProgressProvider>
  );
};

export default App;
