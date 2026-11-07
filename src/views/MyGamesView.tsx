import React, { useState } from 'react';
import {
  History,
  Play,
  RotateCcw,
  Search,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Trash2,
  Cloud,
} from 'lucide-react';
import { useGames } from '../context/GamesContext';
import { SavedGame, GameResult } from '../types/chess';
import { countClasses, MOVE_CLASS_INFO } from '../engine/gameAnalysis';
import { BotAvatar } from '../components/BotAvatar';
import { ChessPiece } from '../components/ChessPieces';
import { SyncModal } from '../components/SyncModal';

interface MyGamesViewProps {
  onSelectGame: (gameId: string) => void;
  onNavigateTab: (tab: 'play-bot' | 'dashboard' | 'lessons') => void;
}

export const MyGamesView: React.FC<MyGamesViewProps> = ({ onSelectGame, onNavigateTab }) => {
  const { games, sync, connectGitHub, disconnectGitHub, syncNow, deleteGame } = useGames();

  const [filterResult, setFilterResult] = useState<'all' | 'win' | 'loss' | 'draw'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);

  const filteredGames = games.filter((g) => {
    // Filter by outcome
    if (filterResult !== 'all') {
      const isWhite = g.playerColor === 'w';
      const won = (g.result === '1-0' && isWhite) || (g.result === '0-1' && !isWhite);
      const lost = (g.result === '0-1' && isWhite) || (g.result === '1-0' && !isWhite);
      const drew = g.result === '1/2-1/2';

      if (filterResult === 'win' && !won) return false;
      if (filterResult === 'loss' && !lost) return false;
      if (filterResult === 'draw' && !drew) return false;
    }

    // Filter by query (bot name or opening)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchBot = g.botName?.toLowerCase().includes(q) || false;
      const matchOpening = g.analysis?.opening?.toLowerCase().includes(q) || false;
      const matchPlayers =
        g.white.toLowerCase().includes(q) || g.black.toLowerCase().includes(q);
      if (!matchBot && !matchOpening && !matchPlayers) return false;
    }

    return true;
  });

  const getResultBadge = (game: SavedGame) => {
    if (game.result === '*') {
      return (
        <span className="text-[10px] font-serif font-bold uppercase tracking-wider px-2 py-0.5 rounded wood-well text-brass border border-brass/30">
          In Progress
        </span>
      );
    }
    const isWhite = game.playerColor === 'w';
    const won = (game.result === '1-0' && isWhite) || (game.result === '0-1' && !isWhite);
    const lost = (game.result === '0-1' && isWhite) || (game.result === '1-0' && !isWhite);

    if (won) {
      return (
        <span className="text-[10px] font-serif font-bold uppercase tracking-wider px-2 py-0.5 rounded wood-well text-brass border border-brass/40">
          Victory
        </span>
      );
    }
    if (lost) {
      return (
        <span className="text-[10px] font-serif font-bold uppercase tracking-wider px-2 py-0.5 rounded wood-well text-wood-400 border border-wood-700">
          Defeat
        </span>
      );
    }
    return (
      <span className="text-[10px] font-serif font-bold uppercase tracking-wider px-2 py-0.5 rounded wood-well text-wood-300 border border-wood-700">
        Draw
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      {/* Top Header & Sync controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-wood-750">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-serif font-bold text-brass uppercase tracking-widest mb-1">
            <History className="w-4 h-4" />
            <span>Match Archives</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-wood-100">
            Recorded Games & Analysis
          </h1>
          <p className="text-xs text-wood-400 mt-1 font-sans">
            Every match is preserved locally and can be deeply evaluated with Stockfish.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {sync.user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => syncNow()}
                disabled={sync.status === 'syncing'}
                title="Sync with GitHub Gist now"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl wood-btn text-xs font-medium border border-wood-650"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${sync.status === 'syncing' ? 'animate-spin text-brass' : ''}`} />
                <span className="hidden sm:inline">Sync Now</span>
              </button>

              <button
                onClick={disconnectGitHub}
                title={`Connected as @${sync.user.login}. Click to disconnect.`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl wood-well border border-wood-700 text-xs font-mono text-wood-300 hover:text-wood-100"
              >
                <img
                  src={sync.user.avatarUrl}
                  alt={sync.user.login}
                  className="w-4 h-4 rounded-full"
                />
                <span className="max-w-[100px] truncate">@{sync.user.login}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSyncModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl wood-btn text-xs font-serif font-bold tracking-wide border border-wood-650 text-wood-200 hover:text-wood-100"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Sync with GitHub</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab('play-bot')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl wood-btn-brass text-wood-950 text-xs font-serif font-bold uppercase tracking-wider shadow-brass-raised"
          >
            <Play className="w-3.5 h-3.5 fill-wood-950" />
            <span>Play Match</span>
          </button>
        </div>
      </div>

      {/* Reusable Sync Modal */}
      <SyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onConnect={connectGitHub}
      />

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 wood-panel border border-wood-700 rounded-xl p-2.5 shadow-wood-raised">
        <div className="flex items-center gap-1 wood-well p-1 rounded-lg">
          {(
            [
              { id: 'all', label: 'All Games' },
              { id: 'win', label: 'Victories' },
              { id: 'loss', label: 'Defeats' },
              { id: 'draw', label: 'Draws' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterResult(f.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-serif font-bold transition ${
                filterResult === f.id
                  ? 'wood-tab-active text-brass font-bold'
                  : 'text-wood-400 hover:text-wood-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-wood-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search opponent or opening..."
            className="w-full wood-well border border-wood-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-wood-100 placeholder-wood-500 focus:outline-none focus:border-brass shadow-wood-inset"
          />
        </div>
      </div>

      {/* Games list */}
      {games.length === 0 ? (
        <div className="wood-panel border border-wood-700 rounded-2xl p-12 text-center space-y-4 shadow-wood-raised">
          <div className="w-16 h-16 rounded-2xl wood-well border border-wood-650 flex items-center justify-center p-3.5 mx-auto shadow-wood-inset">
            <ChessPiece type="k" color="w" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-serif text-lg font-bold text-wood-100">No matches archived yet</h3>
            <p className="text-xs text-wood-400 leading-relaxed font-sans">
              Play your first match against one of our chess sparring bots. Your games will be recorded here
              automatically and can be reviewed with Stockfish anytime.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('play-bot')}
            className="px-5 py-2.5 rounded-xl wood-btn-brass text-wood-950 font-serif font-bold text-xs uppercase tracking-wider shadow-brass-raised transition"
          >
            Play a Match Now
          </button>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="wood-panel border border-wood-700 rounded-xl p-8 text-center text-wood-400 text-xs shadow-wood-raised">
          No matches match your current filter or search criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGames.map((game) => {
            const hasAnalysis = Boolean(game.analysis);
            const userCounts =
              hasAnalysis && game.analysis
                ? countClasses(game.analysis, game.playerColor)
                : null;
            const accuracy =
              hasAnalysis && game.analysis
                ? game.playerColor === 'w'
                  ? game.analysis.accuracy.w
                  : game.analysis.accuracy.b
                : null;

            return (
              <div
                key={game.id}
                className="wood-panel hover:wood-panel-raised border border-wood-700 hover:border-wood-600 rounded-2xl p-4 sm:p-5 transition shadow-wood-raised flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
              >
                {/* Left: Bot avatar & match details */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <BotAvatar avatarKey={game.botAvatar} size="md" />

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-serif text-base font-bold text-wood-100 truncate">
                        {game.white} <span className="text-wood-500 font-sans font-normal text-xs">vs</span>{' '}
                        {game.black}
                      </span>
                      {getResultBadge(game)}
                      <span className="text-xs font-mono font-bold text-brass">
                        {game.result === '*' ? 'In progress' : game.result}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-wood-400">
                      <span className="flex items-center gap-1 text-[11px] font-mono">
                        <Calendar className="w-3 h-3 text-wood-500" />
                        {new Date(game.createdAt).toLocaleDateString()}{' '}
                        {new Date(game.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-[11px] font-mono">
                        <Layers className="w-3 h-3 text-wood-500" />
                        {Math.ceil(game.moves.length / 2)} moves ({game.moves.length} plies)
                      </span>
                      {game.analysis?.opening && (
                        <>
                          <span>·</span>
                          <span className="text-wood-300 font-serif font-medium text-[11px]">
                            {game.analysis.opening}
                          </span>
                        </>
                      )}
                      {game.termination && (
                        <>
                          <span>·</span>
                          <span className="text-wood-400 text-[11px]">{game.termination}</span>
                        </>
                      )}
                    </div>

                    {/* Analysis move breakdown pills if analyzed */}
                    {hasAnalysis && userCounts && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <div className="flex items-center gap-1 text-[11px] text-wood-400 font-mono">
                          <TrendingUp className="w-3 h-3 text-brass" />
                          <span>Accuracy:</span>
                          <span className="font-bold text-wood-100 font-mono">{accuracy}%</span>
                        </div>
                        <span className="text-wood-700">|</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold">
                          {userCounts.genial > 0 && (
                            <span className="px-1.5 py-0.2 rounded wood-well text-teal-300 border border-teal-500/30">
                              !! {userCounts.genial}
                            </span>
                          )}
                          {userCounts.super > 0 && (
                            <span className="px-1.5 py-0.2 rounded wood-well text-sky-300 border border-sky-500/30">
                              ! {userCounts.super}
                            </span>
                          )}
                          {userCounts.book > 0 && (
                            <span className="px-1.5 py-0.2 rounded wood-well text-amber-200 border border-amber-500/30">
                              BK {userCounts.book}
                            </span>
                          )}
                          {userCounts.blunder > 0 && (
                            <span className="px-1.5 py-0.2 rounded wood-well text-rose-400 border border-rose-500/30">
                              ?? {userCounts.blunder}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-0 border-wood-800">
                  <button
                    onClick={() => deleteGame(game.id)}
                    title="Delete Match"
                    className="p-2 rounded-lg wood-btn text-wood-500 hover:text-rose-400 border border-wood-700/60 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSelectGame(game.id)}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl wood-btn text-wood-100 hover:text-wood-50 text-xs font-serif font-bold uppercase tracking-wider border border-wood-650 group-hover:border-brass/60 shadow-wood-raised transition"
                  >
                    <span>{hasAnalysis ? 'Review Analysis' : 'Evaluate Game'}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-brass group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
