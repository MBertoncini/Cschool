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
import { LocalGameView } from './views/LocalGameView';
import { MyGamesView } from './views/MyGamesView';
import { GameReviewView } from './views/GameReviewView';
import { ProfileView } from './views/ProfileView';
import { AchievementIcon } from './components/ChessIcons';
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
    <div className="min-h-screen flex flex-col bg-wood-900 text-wood-100 font-sans">
      {/* Navigation Header */}
      <Navigation currentTab={currentTab} onSelectTab={handleSelectTab} />

      {/* Floating Neuromorphic Wood Toast Notification */}
      {recentToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="wood-panel-raised border border-brass/50 rounded-2xl p-4 shadow-wood-raised-lg flex items-center gap-3.5 max-w-sm">
            <div className="w-10 h-10 rounded-xl wood-well flex items-center justify-center shrink-0 border border-brass/40 shadow-wood-inset">
              <AchievementIcon name={recentToast.icon || 'award'} className="w-5 h-5 text-brass" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-brass font-serif">
                {recentToast.title}
              </h4>
              <p className="text-xs font-semibold text-wood-100 mt-0.5 leading-snug">{recentToast.message}</p>
            </div>
            <button
              onClick={clearToast}
              className="text-wood-400 hover:text-wood-100 p-1 rounded-lg transition"
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
        {currentTab === 'local-game' && <LocalGameView onReviewGame={handleReviewGame} />}
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
      <footer className="border-t border-wood-700/60 py-6 text-center text-xs text-wood-400 bg-wood-950/80">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-wood-200 tracking-wide">ChessMaster Academy</span>
            <span className="text-wood-600">—</span>
            <span className="text-wood-400">Handcrafted Chess Architecture</span>
          </div>
          <div className="flex items-center gap-4 text-wood-400 text-xs">
            <button onClick={() => handleSelectTab('gm-decoder')} className="hover:text-brass transition">
              GM Decoder
            </button>
            <button onClick={() => handleSelectTab('lessons')} className="hover:text-brass transition">
              Academy
            </button>
            <button onClick={() => handleSelectTab('play-bot')} className="hover:text-brass transition">
              Bots
            </button>
            <button onClick={() => handleSelectTab('my-games')} className="hover:text-brass transition">
              Matches
            </button>
            <button onClick={() => handleSelectTab('puzzles')} className="hover:text-brass transition">
              Tactics
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
