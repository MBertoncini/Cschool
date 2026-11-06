import React, { useState } from 'react';
import { TabType } from './types/chess';
import { ProgressProvider, useProgress } from './context/ProgressContext';
import { GamesProvider } from './context/GamesContext';
import { Navigation } from './components/Navigation';
import { DashboardView } from './views/DashboardView';
import { LessonsView } from './views/LessonsView';
import { OpeningsView } from './views/OpeningsView';
import { GMDecoderView } from './views/GMDecoderView';
import { PuzzlesView } from './views/PuzzlesView';
import { PlayBotView } from './views/PlayBotView';
import { MyGamesView } from './views/MyGamesView';
import { GameReviewView } from './views/GameReviewView';
import { ProfileView } from './views/ProfileView';
import { X } from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [reviewGameId, setReviewGameId] = useState<string | null>(null);
  const { recentToast, clearToast } = useProgress();

  const handleSelectTab = (tab: TabType) => {
    if (tab === 'my-games') {
      // If user clicks "My Games" tab directly, show the games list
      setReviewGameId(null);
    }
    setCurrentTab(tab);
  };

  const handleReviewGame = (gameId: string) => {
    setReviewGameId(gameId);
    setCurrentTab('my-games');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#161412] text-gray-100">
      {/* Navigation Header */}
      <Navigation currentTab={currentTab} onSelectTab={handleSelectTab} />

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
        {currentTab === 'dashboard' && <DashboardView onSelectTab={handleSelectTab} />}
        {currentTab === 'lessons' && <LessonsView />}
        {currentTab === 'openings' && <OpeningsView />}
        {currentTab === 'gm-decoder' && <GMDecoderView />}
        {currentTab === 'puzzles' && <PuzzlesView />}
        {currentTab === 'play-bot' && <PlayBotView onReviewGame={handleReviewGame} />}
        {currentTab === 'my-games' &&
          (reviewGameId ? (
            <GameReviewView
              gameId={reviewGameId}
              onBack={() => setReviewGameId(null)}
            />
          ) : (
            <MyGamesView
              onSelectGame={handleReviewGame}
              onNavigateTab={handleSelectTab}
            />
          ))}
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
            <button onClick={() => handleSelectTab('gm-decoder')} className="hover:text-amber-400 transition">
              GM Decoder
            </button>
            <button onClick={() => handleSelectTab('lessons')} className="hover:text-amber-400 transition">
              Academy
            </button>
            <button onClick={() => handleSelectTab('play-bot')} className="hover:text-amber-400 transition">
              Bots
            </button>
            <button onClick={() => handleSelectTab('my-games')} className="hover:text-amber-400 transition">
              My Games
            </button>
            <button onClick={() => handleSelectTab('puzzles')} className="hover:text-amber-400 transition">
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
      <GamesProvider>
        <AppContent />
      </GamesProvider>
    </ProgressProvider>
  );
};

export default App;
