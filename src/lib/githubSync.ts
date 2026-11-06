// Cross-device game history stored in a private (secret) GitHub Gist owned by the user.
// The app is a static site, so it talks to the GitHub REST API directly from the browser
// with a personal access token that only needs the `gist` scope.

import { SavedGame } from '../types/chess';

const API = 'https://api.github.com';
export const GIST_FILENAME = 'cschool-games.json';
const GIST_DESCRIPTION = 'ChessMaster Academy — game history (synced automatically)';

export const TOKEN_HELP_URL =
  'https://github.com/settings/tokens/new?scopes=gist&description=ChessMaster%20Academy%20sync';

export interface GitHubUser {
  login: string;
  avatarUrl: string;
  name?: string;
}

export interface RemoteStore {
  version: 1;
  updatedAt: string;
  games: SavedGame[];
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
  const empty: RemoteStore = { version: 1, updatedAt: new Date().toISOString(), games: [] };
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
  if (!file) return { version: 1, updatedAt: new Date(0).toISOString(), games: [] };
  let content = file.content ?? '';
  // The API truncates files larger than ~1MB; the raw URL always has the full content.
  if (file.truncated && file.raw_url) {
    const raw = await fetch(file.raw_url);
    content = await raw.text();
  }
  try {
    const parsed = JSON.parse(content) as RemoteStore;
    return { version: 1, updatedAt: parsed.updatedAt, games: Array.isArray(parsed.games) ? parsed.games : [] };
  } catch {
    throw new GitHubError('The history gist contains invalid JSON. Fix or delete it on gist.github.com.');
  }
}

export async function writeGist(token: string, gistId: string, games: SavedGame[]): Promise<void> {
  const store: RemoteStore = { version: 1, updatedAt: new Date().toISOString(), games };
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
