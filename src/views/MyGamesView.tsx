import React, { useState, useMemo } from 'react';
import {
  History,
  Sparkles,
  Trash2,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bot,
  Play,
  Filter,
  ChevronRight,
  Award,
  Calendar,
  Layers,
  ArrowRight,
  LogOut,
  KeyRound,
  Search,
} from 'lucide-react';

const GitHubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);
import { useGames } from '../context/GamesContext';
import { SavedGame, TabType } from '../types/chess';
import { MOVE_CLASS_INFO, countClasses } from '../engine/gameAnalysis';
import { TOKEN_HELP_URL } from '../lib/githubSync';

interface MyGamesViewProps {
  onSelectGame: (gameId: string) => void;
  onNavigateTab: (tab: TabType) => void;
}

export const MyGamesView: React.FC<MyGamesViewProps> = ({ onSelectGame, onNavigateTab }) => {
  const { games, deleteGame, sync, connectGitHub, disconnectGitHub, syncNow } = useGames();

  // Filters & Search
  const [filterResult, setFilterResult] = useState<'all' | 'win' | 'loss' | 'draw'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [patToken, setPatToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      // Filter by result
      if (filterResult === 'win') {
        const isWin =
          (game.result === '1-0' && game.playerColor === 'w') ||
          (game.result === '0-1' && game.playerColor === 'b');
        if (!isWin) return false;
      } else if (filterResult === 'loss') {
        const isLoss =
          (game.result === '1-0' && game.playerColor === 'b') ||
          (game.result === '0-1' && game.playerColor === 'w');
        if (!isLoss) return false;
      } else if (filterResult === 'draw') {
        if (game.result !== '1/2-1/2') return false;
      }

      // Filter by search query (opponent bot name or opening)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const botMatch = game.botName?.toLowerCase().includes(q) || false;
        const openingMatch = game.analysis?.opening?.toLowerCase().includes(q) || false;
        const whiteMatch = game.white.toLowerCase().includes(q);
        const blackMatch = game.black.toLowerCase().includes(q);
        if (!botMatch && !openingMatch && !whiteMatch && !blackMatch) return false;
      }

      return true;
    });
  }, [games, filterResult, searchQuery]);

  const handleConnectToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patToken.trim()) return;
    setIsConnecting(true);
    setSyncErrorMsg(null);
    try {
      await connectGitHub(patToken.trim());
      setShowSyncModal(false);
      setPatToken('');
    } catch (err) {
      setSyncErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsConnecting(false);
    }
  };

  const getResultBadge = (game: SavedGame) => {
    if (game.result === '*') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-800 text-stone-300 border border-stone-700">
          In Progress
        </span>
      );
    }
    const isPlayerWhite = game.playerColor === 'w';
    const isWin =
      (game.result === '1-0' && isPlayerWhite) || (game.result === '0-1' && !isPlayerWhite);
    const isLoss =
      (game.result === '0-1' && isPlayerWhite) || (game.result === '1-0' && !isPlayerWhite);

    if (isWin) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
          Victory
        </span>
      );
    }
    if (isLoss) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40">
          Defeat
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
        Draw
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-md">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Match History</h1>
              <p className="text-xs text-stone-400 font-medium">
                Rewatch every game with Stockfish eval, move classification & coach feedback
              </p>
            </div>
          </div>
        </div>

        {/* GitHub Sync Status Card / Button */}
        <div className="flex items-center gap-2">
          {sync.user ? (
            <div className="flex items-center gap-2 bg-[#24211d] border border-stone-700/80 rounded-xl p-1.5 pr-3 shadow-md">
              <img
                src={sync.user.avatarUrl}
                alt={sync.user.login}
                className="w-7 h-7 rounded-lg border border-amber-500/40"
              />
              <div className="text-left text-xs leading-tight">
                <span className="font-bold text-stone-200 block truncate max-w-[100px]">
                  @{sync.user.login}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  {sync.status === 'syncing' ? (
                    <>
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> Syncing...
                    </>
                  ) : sync.status === 'error' ? (
                    <span className="text-rose-400">Sync error</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-2.5 h-2.5" /> Synced
                    </>
                  )}
                </span>
              </div>
              <button
                onClick={syncNow}
                title="Sync now with GitHub Gist"
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition ml-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sync.status === 'syncing' ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={disconnectGitHub}
                title="Disconnect GitHub account"
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950/40 text-stone-400 hover:text-rose-400 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSyncModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#24211d] hover:bg-[#2c2823] border border-stone-700 text-xs font-bold text-stone-200 hover:text-white shadow-md transition"
            >
              <GitHubIcon className="w-4 h-4 text-white" />
              <span>Sync with GitHub</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab('play-bot')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black shadow-md transition hover:scale-[1.02] active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-stone-950" />
            <span>Play Match</span>
          </button>
        </div>
      </div>

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#24211d] border border-stone-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-white font-black text-lg">
                <GitHubIcon className="w-6 h-6 text-amber-400" />
                <span>Sync Games with GitHub</span>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Store your match history in a private secret GitHub Gist on your account. Wherever
              you open ChessMaster Academy (PC, laptop, smartphone), your full games and coach
              evaluations stay seamlessly in sync.
            </p>

            <form onSubmit={handleConnectToken} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider mb-1">
                  Personal Access Token (classic or fine-grained with Gist permission)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
                  <input
                    type="password"
                    value={patToken}
                    onChange={(e) => setPatToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-[#181614] border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {syncErrorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-900 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{syncErrorMsg}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <a
                  href={TOKEN_HELP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Generate token on GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="submit"
                  disabled={isConnecting || !patToken.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 text-xs font-black shadow transition flex items-center gap-1.5"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting...
                    </>
                  ) : (
                    'Connect & Sync'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#24211d] border border-stone-800 rounded-xl p-2.5 shadow-md">
        <div className="flex items-center gap-1">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterResult === f.id
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bot or opening..."
            className="w-full bg-[#191715] border border-stone-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Games list */}
      {games.length === 0 ? (
        <div className="bg-[#24211d] border border-stone-800 rounded-2xl p-12 text-center space-y-4 shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-stone-800/80 border border-stone-700 flex items-center justify-center text-3xl mx-auto">
            ♟️
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-black text-white">No matches played yet</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Play your first match against one of our chess bots! Your moves will be saved here
              automatically and you can review them with the coach anytime.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('play-bot')}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-lg transition"
          >
            Play a Bot Now
          </button>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="bg-[#24211d] border border-stone-800 rounded-xl p-8 text-center text-stone-400 text-xs">
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
                className="bg-[#24211d] hover:bg-[#2a2622] border border-stone-800 hover:border-stone-700 rounded-2xl p-4 sm:p-5 transition shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
              >
                {/* Left: Bot avatar & match details */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-stone-900 border border-stone-700 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                    {game.botAvatar || '🤖'}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-black text-white truncate">
                        {game.white} <span className="text-stone-500 font-normal text-xs">vs</span>{' '}
                        {game.black}
                      </span>
                      {getResultBadge(game)}
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {game.result === '*' ? 'In progress' : game.result}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-stone-500" />
                        {new Date(game.createdAt).toLocaleDateString()}{' '}
                        {new Date(game.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Layers className="w-3 h-3 text-stone-500" />
                        {Math.ceil(game.moves.length / 2)} moves ({game.moves.length} plies)
                      </span>
                      {game.analysis?.opening && (
                        <>
                          <span>·</span>
                          <span className="text-amber-200/90 font-medium text-[11px]">
                            {game.analysis.opening}
                          </span>
                        </>
                      )}
                      {game.termination && (
                        <>
                          <span>·</span>
                          <span className="text-stone-400 text-[11px]">{game.termination}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Center / Right: Accuracy & Move classification chips */}
                <div className="flex flex-wrap items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
                  {hasAnalysis && userCounts && accuracy !== null ? (
                    <div className="flex items-center gap-3 bg-[#1a1815] border border-stone-800 rounded-xl px-3 py-2">
                      <div className="text-center pr-2 border-r border-stone-800">
                        <span className="text-[9px] uppercase font-bold text-stone-500 block">
                          Accuracy
                        </span>
                        <span className="text-sm font-black text-emerald-400 font-mono">
                          {accuracy.toFixed(1)}%
                        </span>
                      </div>

                      {/* Move breakdown pills */}
                      <div className="flex items-center gap-1.5 text-xs">
                        {userCounts.genial > 0 && (
                          <span
                            title="Genial moves"
                            className="px-1.5 py-0.5 rounded text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/40"
                          >
                            !! {userCounts.genial}
                          </span>
                        )}
                        {userCounts.super > 0 && (
                          <span
                            title="Super good moves"
                            className="px-1.5 py-0.5 rounded text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/40"
                          >
                            ! {userCounts.super}
                          </span>
                        )}
                        {userCounts.blunder > 0 && (
                          <span
                            title="Blunders"
                            className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40"
                          >
                            ?? {userCounts.blunder}
                          </span>
                        )}
                        {userCounts.bad > 0 && (
                          <span
                            title="Mistakes"
                            className="px-1.5 py-0.5 rounded text-[10px] font-black bg-orange-500/20 text-orange-300 border border-orange-500/40"
                          >
                            ? {userCounts.bad}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-stone-500 italic">Not analysed yet</div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectGame(game.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition flex items-center gap-1.5 group-hover:scale-105"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Review with Coach</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm('Delete this match from your history?')) {
                          deleteGame(game.id);
                        }
                      }}
                      title="Delete game"
                      className="p-2 rounded-xl bg-stone-800/80 hover:bg-rose-950/40 text-stone-400 hover:text-rose-400 transition border border-transparent hover:border-rose-900/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
