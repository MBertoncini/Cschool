import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GameAnalysis, SavedGame } from '../types/chess';
import {
  fetchUser,
  findOrCreateGist,
  GitHubError,
  GitHubUser,
  RemoteStore,
  mergeGames,
  readGist,
  sameGames,
  writeGist,
} from '../lib/githubSync';

const GAMES_KEY = 'cschool_games_v1';
const TOKEN_KEY = 'cschool_github_token';
const GIST_KEY = 'cschool_github_gist';
const USER_KEY = 'cschool_github_user';

export type SyncStatus = 'disconnected' | 'connecting' | 'syncing' | 'synced' | 'error';

interface GamesContextType {
  games: SavedGame[]; // newest first, without deleted ones
  getGame: (id: string) => SavedGame | undefined;
  upsertGame: (game: Omit<SavedGame, 'updatedAt'>) => void;
  saveAnalysis: (id: string, analysis: GameAnalysis) => void;
  deleteGame: (id: string) => void;
  sync: {
    status: SyncStatus;
    user: GitHubUser | null;
    error: string | null;
    lastSync: string | null;
    gistId: string | null;
  };
  connectGitHub: (token: string) => Promise<void>;
  disconnectGitHub: () => void;
  syncNow: () => void;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function loadGames(): SavedGame[] {
  try {
    const raw = localStorage.getItem(GAMES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.games)) return parsed.games;
    }
  } catch (e) {
    console.warn('Could not load game history', e);
  }
  return [];
}

function persistGames(games: SavedGame[]) {
  try {
    localStorage.setItem(GAMES_KEY, JSON.stringify({ version: 1, games }));
  } catch {
    // Quota exceeded: keep analyses only for the 25 newest games locally.
    // (Everything is still in the GitHub gist when sync is on, and analyses can be recomputed.)
    try {
      const slim = games.map((g, i) => (i < 25 ? g : { ...g, analysis: undefined }));
      localStorage.setItem(GAMES_KEY, JSON.stringify({ version: 1, games: slim }));
    } catch (e) {
      console.warn('Could not save game history', e);
    }
  }
}

export const GamesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allGames, setAllGames] = useState<SavedGame[]>(loadGames);
  const gamesRef = useRef(allGames);
  gamesRef.current = allGames;

  const [token, setToken] = useState<string | null>(() => safeGet(TOKEN_KEY));
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const gistIdRef = useRef<string | null>(safeGet(GIST_KEY));

  const [status, setStatus] = useState<SyncStatus>(token ? 'syncing' : 'disconnected');
  const [user, setUser] = useState<GitHubUser | null>(() => {
    try {
      const raw = safeGet(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [gistId, setGistId] = useState<string | null>(gistIdRef.current);

  const syncingRef = useRef(false);
  const pendingRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    persistGames(allGames);
  }, [allGames]);

  const runSync = useCallback(async () => {
    const tk = tokenRef.current;
    if (!tk) return;
    if (syncingRef.current) {
      pendingRef.current = true;
      return;
    }
    syncingRef.current = true;
    setStatus('syncing');
    try {
      let id = gistIdRef.current;
      let remote: RemoteStore | null = null;
      if (id) {
        try {
          remote = await readGist(tk, id);
        } catch (e) {
          if (!(e instanceof GitHubError && e.status === 404)) throw e;
          id = null; // gist was deleted on GitHub → look for / create another one
        }
      }
      if (!id || !remote) {
        id = await findOrCreateGist(tk, null);
        remote = await readGist(tk, id);
        gistIdRef.current = id;
        setGistId(id);
        safeSet(GIST_KEY, id);
      }
      const merged = mergeGames(gamesRef.current, remote.games);
      if (!sameGames(merged, remote.games)) await writeGist(tk, id, merged);
      // Local edits made while we were talking to GitHub are kept (and trigger another sync).
      setAllGames((cur) => {
        const next = mergeGames(cur, merged);
        return sameGames(next, cur) ? cur : next;
      });
      setError(null);
      setStatus('synced');
      setLastSync(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    } finally {
      syncingRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        void runSync();
      }
    }
  }, []);

  const scheduleSync = useCallback(
    (delay = 2500) => {
      if (!tokenRef.current) return;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        void runSync();
      }, delay);
    },
    [runSync]
  );

  // Initial sync + re-sync when coming back to the tab (e.g. after playing on another device)
  useEffect(() => {
    if (!token) return;
    void runSync();
    let last = Date.now();
    const onFocus = () => {
      if (document.visibilityState === 'visible' && Date.now() - last > 20000) {
        last = Date.now();
        void runSync();
      }
    };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [token, runSync]);

  const mutate = useCallback(
    (fn: (games: SavedGame[]) => SavedGame[]) => {
      setAllGames((cur) => fn(cur));
      scheduleSync();
    },
    [scheduleSync]
  );

  const upsertGame = useCallback(
    (game: Omit<SavedGame, 'updatedAt'>) => {
      mutate((cur) => {
        const now = new Date().toISOString();
        const prev = cur.find((g) => g.id === game.id);
        // Moves changed (e.g. undo) → the old analysis no longer applies
        const keepAnalysis =
          prev?.analysis && prev.moves.join(' ') === game.moves.join(' ') ? prev.analysis : undefined;
        const next: SavedGame = { ...prev, ...game, analysis: game.analysis ?? keepAnalysis, updatedAt: now };
        const rest = cur.filter((g) => g.id !== game.id);
        return [next, ...rest].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      });
    },
    [mutate]
  );

  const saveAnalysis = useCallback(
    (id: string, analysis: GameAnalysis) => {
      mutate((cur) =>
        cur.map((g) => (g.id === id ? { ...g, analysis, updatedAt: new Date().toISOString() } : g))
      );
    },
    [mutate]
  );

  const deleteGame = useCallback(
    (id: string) => {
      mutate((cur) =>
        cur.map((g) =>
          g.id === id
            ? { ...g, deleted: true, analysis: undefined, moves: [], updatedAt: new Date().toISOString() }
            : g
        )
      );
    },
    [mutate]
  );

  const connectGitHub = useCallback(
    async (rawToken: string) => {
      const tk = rawToken.trim();
      setStatus('connecting');
      setError(null);
      try {
        const u = await fetchUser(tk);
        // A different account → forget the gist id of the previous one
        if (user && user.login !== u.login) {
          gistIdRef.current = null;
          setGistId(null);
          safeSet(GIST_KEY, null);
        }
        safeSet(TOKEN_KEY, tk);
        safeSet(USER_KEY, JSON.stringify(u));
        setUser(u);
        tokenRef.current = tk;
        setToken(tk); // triggers the initial sync effect
      } catch (e) {
        setStatus(tokenRef.current ? 'error' : 'disconnected');
        setError(e instanceof Error ? e.message : String(e));
        throw e;
      }
    },
    [user]
  );

  const disconnectGitHub = useCallback(() => {
    safeSet(TOKEN_KEY, null);
    safeSet(USER_KEY, null);
    safeSet(GIST_KEY, null);
    gistIdRef.current = null;
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    setGistId(null);
    setStatus('disconnected');
    setError(null);
  }, []);

  const games = useMemo(() => allGames.filter((g) => !g.deleted), [allGames]);
  const getGame = useCallback((id: string) => games.find((g) => g.id === id), [games]);

  return (
    <GamesContext.Provider
      value={{
        games,
        getGame,
        upsertGame,
        saveAnalysis,
        deleteGame,
        sync: { status, user, error, lastSync, gistId },
        connectGitHub,
        disconnectGitHub,
        syncNow: () => void runSync(),
      }}
    >
      {children}
    </GamesContext.Provider>
  );
};

export const useGames = () => {
  const ctx = useContext(GamesContext);
  if (!ctx) throw new Error('useGames must be used within a GamesProvider');
  return ctx;
};

export function newGameId(): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${Date.now().toString(36)}-${rnd}`;
}
