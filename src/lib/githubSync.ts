// Cross-device profile progress and game history stored in a private (secret) GitHub Gist.
// The app is a static site, so it talks to the GitHub REST API directly from the browser
// with a personal access token that only needs the `gist` scope.

import { SavedGame, UserProgress } from '../types/chess';

const API = 'https://api.github.com';
export const GIST_FILENAME = 'cschool-games.json';
const GIST_DESCRIPTION = 'ChessMaster Academy — profile progress & match history (synced automatically)';

export const TOKEN_HELP_URL =
  'https://github.com/settings/tokens/new?scopes=gist&description=ChessMaster%20Academy%20sync';

export interface GitHubUser {
  login: string;
  avatarUrl: string;
  name?: string;
}

export interface RemoteStore {
  version: number;
  updatedAt: string;
  games: SavedGame[];
  progress?: UserProgress;
}

export class GitHubError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

async function gh<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path.startsWith('http') ? path : `${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = `GitHub API error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) msg = `${msg}: ${body.message}`;
    } catch {
      // ignore
    }
    if (res.status === 401) msg = 'The token was rejected by GitHub (expired or revoked).';
    if (res.status === 403 || res.status === 404) {
      msg += ' — make sure the token has the "gist" scope (or Gists: read & write).';
    }
    throw new GitHubError(msg, res.status);
  }
  return (await res.json()) as T;
}

export async function fetchUser(token: string): Promise<GitHubUser> {
  const u = await gh<{ login: string; avatar_url: string; name?: string }>(token, '/user');
  return { login: u.login, avatarUrl: u.avatar_url, name: u.name || undefined };
}

interface GistFile {
  filename: string;
  content?: string;
  truncated?: boolean;
  raw_url?: string;
}
interface Gist {
  id: string;
  html_url: string;
  files: Record<string, GistFile>;
}

/** Finds the user's history gist, creating it if it doesn't exist yet. */
export async function findOrCreateGist(token: string, knownId?: string | null): Promise<string> {
  if (knownId) {
    try {
      const g = await gh<Gist>(token, `/gists/${knownId}`);
      if (g.files[GIST_FILENAME]) return g.id;
    } catch (e) {
      if (!(e instanceof GitHubError && e.status === 404)) throw e;
    }
  }
  for (let page = 1; page <= 10; page++) {
    const list = await gh<Gist[]>(token, `/gists?per_page=100&page=${page}`);
    const hit = list.find((g) => g.files && g.files[GIST_FILENAME]);
    if (hit) return hit.id;
    if (list.length < 100) break;
  }
  const empty: RemoteStore = { version: 2, updatedAt: new Date().toISOString(), games: [] };
  const created = await gh<Gist>(token, '/gists', {
    method: 'POST',
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(empty) } },
    }),
  });
  return created.id;
}

export async function readGist(token: string, gistId: string): Promise<RemoteStore> {
  const g = await gh<Gist>(token, `/gists/${gistId}`);
  const file = g.files[GIST_FILENAME];
  if (!file) return { version: 2, updatedAt: new Date(0).toISOString(), games: [] };
  let content = file.content ?? '';
  // The API truncates files larger than ~1MB; the raw URL always has the full content.
  if (file.truncated && file.raw_url) {
    const raw = await fetch(file.raw_url);
    content = await raw.text();
  }
  try {
    const parsed = JSON.parse(content) as RemoteStore;
    return {
      version: parsed.version || 1,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      games: Array.isArray(parsed.games) ? parsed.games : [],
      progress: parsed.progress,
    };
  } catch {
    throw new GitHubError('The history gist contains invalid JSON. Fix or delete it on gist.github.com.');
  }
}

export async function writeGist(
  token: string,
  gistId: string,
  games: SavedGame[],
  progress?: UserProgress
): Promise<void> {
  const store: RemoteStore = {
    version: 2,
    updatedAt: new Date().toISOString(),
    games,
    progress,
  };
  await gh<Gist>(token, `/gists/${gistId}`, {
    method: 'PATCH',
    body: JSON.stringify({ files: { [GIST_FILENAME]: { content: JSON.stringify(store) } } }),
  });
}

/** Union of both sides by id; for the same game the most recently updated copy wins. */
export function mergeGames(a: SavedGame[], b: SavedGame[]): SavedGame[] {
  const map = new Map<string, SavedGame>();
  for (const g of [...a, ...b]) {
    const prev = map.get(g.id);
    if (!prev || g.updatedAt > prev.updatedAt) map.set(g.id, g);
    // Keep the analysis if the newer copy doesn't have one but the older one matches the same moves
    else if (prev && !prev.analysis && g.analysis && g.moves.join(' ') === prev.moves.join(' ')) {
      map.set(g.id, { ...prev, analysis: g.analysis });
    }
  }
  return [...map.values()].sort((x, y) => y.createdAt.localeCompare(x.createdAt));
}

export function sameGames(a: SavedGame[], b: SavedGame[]): boolean {
  if (a.length !== b.length) return false;
  const idx = new Map(b.map((g) => [g.id, g.updatedAt + (g.analysis ? 'A' : '')]));
  return a.every((g) => idx.get(g.id) === g.updatedAt + (g.analysis ? 'A' : ''));
}

export function isDefaultProgress(p?: UserProgress | null): boolean {
  if (!p) return true;
  return (
    (p.xp || 0) === 0 &&
    (p.level || 1) <= 1 &&
    (!p.completedLessons || p.completedLessons.length === 0) &&
    (!p.solvedPuzzles || p.solvedPuzzles.length === 0) &&
    (!p.studiedOpenings || p.studiedOpenings.length === 0) &&
    (!p.studiedMasterGames || p.studiedMasterGames.length === 0) &&
    (!p.achievements || p.achievements.length === 0) &&
    (!p.botRecord ||
      ((p.botRecord.wins || 0) === 0 &&
        (p.botRecord.losses || 0) === 0 &&
        (p.botRecord.draws || 0) === 0 &&
        (!p.botRecord.defeatedBots || p.botRecord.defeatedBots.length === 0)))
  );
}

export function mergeProgress(local: UserProgress, remote?: UserProgress | null): UserProgress {
  if (!remote) return local;
  // A preference is not progress: the latest choice wins whichever side has the better stats
  const latest = (remote.pieceSetUpdatedAt || '') > (local.pieceSetUpdatedAt || '') ? remote : local;
  return {
    ...mergeStats(local, remote),
    pieceSet: latest.pieceSet,
    pieceSetUpdatedAt: latest.pieceSetUpdatedAt,
  };
}

function mergeStats(local: UserProgress, remote: UserProgress): UserProgress {
  if (isDefaultProgress(local) && !isDefaultProgress(remote)) return remote;
  if (isDefaultProgress(remote) && !isDefaultProgress(local)) return local;

  const union = (a?: string[], b?: string[]) =>
    Array.from(new Set([...(a || []), ...(b || [])]));

  const achievements = union(local.achievements, remote.achievements);
  const completedLessons = union(local.completedLessons, remote.completedLessons);
  const solvedPuzzles = union(local.solvedPuzzles, remote.solvedPuzzles);
  const studiedOpenings = union(local.studiedOpenings, remote.studiedOpenings);
  const studiedMasterGames = union(local.studiedMasterGames, remote.studiedMasterGames);

  const localBot = local.botRecord || { wins: 0, losses: 0, draws: 0, defeatedBots: [] };
  const remoteBot = remote.botRecord || { wins: 0, losses: 0, draws: 0, defeatedBots: [] };
  const defeatedBots = union(localBot.defeatedBots, remoteBot.defeatedBots);

  const botRecord = {
    wins: Math.max(localBot.wins || 0, remoteBot.wins || 0),
    losses: Math.max(localBot.losses || 0, remoteBot.losses || 0),
    draws: Math.max(localBot.draws || 0, remoteBot.draws || 0),
    defeatedBots,
  };

  const xp = Math.max(local.xp || 0, remote.xp || 0);
  const level = Math.max(
    local.level || 1,
    remote.level || 1,
    Math.floor(Math.sqrt(xp / 100)) + 1
  );

  // Tactics rating: pick the one from the more recent update, or the non-default one
  let tacticsRating = local.tacticsRating || 1000;
  if (remote.updatedAt && local.updatedAt) {
    tacticsRating =
      remote.updatedAt > local.updatedAt
        ? remote.tacticsRating || 1000
        : local.tacticsRating || 1000;
  } else if (
    (local.tacticsRating === 1000 || !local.tacticsRating) &&
    remote.tacticsRating &&
    remote.tacticsRating !== 1000
  ) {
    tacticsRating = remote.tacticsRating;
  } else if (remote.tacticsRating) {
    tacticsRating = Math.max(local.tacticsRating || 1000, remote.tacticsRating);
  }

  // Streak & activity: pick latest date
  let streakDays = Math.max(local.streakDays || 1, remote.streakDays || 1);
  let lastActiveDate = local.lastActiveDate || new Date().toISOString().split('T')[0];
  if (remote.lastActiveDate) {
    if (!local.lastActiveDate || remote.lastActiveDate > local.lastActiveDate) {
      lastActiveDate = remote.lastActiveDate;
      streakDays = remote.streakDays || streakDays;
    }
  }

  const updatedAt =
    local.updatedAt && remote.updatedAt
      ? local.updatedAt > remote.updatedAt
        ? local.updatedAt
        : remote.updatedAt
      : local.updatedAt || remote.updatedAt || new Date().toISOString();

  return {
    xp,
    level,
    tacticsRating,
    completedLessons,
    solvedPuzzles,
    studiedOpenings,
    studiedMasterGames,
    botRecord,
    achievements,
    streakDays,
    lastActiveDate,
    updatedAt,
  };
}

export function sameProgress(a?: UserProgress | null, b?: UserProgress | null): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if ((a.xp || 0) !== (b.xp || 0)) return false;
  if ((a.level || 1) !== (b.level || 1)) return false;
  if ((a.tacticsRating || 1000) !== (b.tacticsRating || 1000)) return false;
  if ((a.streakDays || 1) !== (b.streakDays || 1)) return false;
  if (a.lastActiveDate !== b.lastActiveDate) return false;
  if (a.pieceSet !== b.pieceSet || a.pieceSetUpdatedAt !== b.pieceSetUpdatedAt) return false;

  const aBot = a.botRecord || { wins: 0, losses: 0, draws: 0, defeatedBots: [] };
  const bBot = b.botRecord || { wins: 0, losses: 0, draws: 0, defeatedBots: [] };
  if ((aBot.wins || 0) !== (bBot.wins || 0)) return false;
  if ((aBot.losses || 0) !== (bBot.losses || 0)) return false;
  if ((aBot.draws || 0) !== (bBot.draws || 0)) return false;

  const sameSet = (arr1: string[] = [], arr2: string[] = []) => {
    if (arr1.length !== arr2.length) return false;
    const s = new Set(arr1);
    return arr2.every((x) => s.has(x));
  };

  if (!sameSet(a.completedLessons, b.completedLessons)) return false;
  if (!sameSet(a.solvedPuzzles, b.solvedPuzzles)) return false;
  if (!sameSet(a.studiedOpenings, b.studiedOpenings)) return false;
  if (!sameSet(a.studiedMasterGames, b.studiedMasterGames)) return false;
  if (!sameSet(a.achievements, b.achievements)) return false;
  if (!sameSet(aBot.defeatedBots, bBot.defeatedBots)) return false;

  return true;
}
