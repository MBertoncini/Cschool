import React, { useState } from 'react';
import { KeyRound, ExternalLink, AlertCircle, Loader2, X, Cloud, ShieldCheck, Check } from 'lucide-react';
import { TOKEN_HELP_URL } from '../lib/githubSync';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (token: string) => Promise<void>;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tokenInput.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await onConnect(trimmed);
      setTokenInput('');
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to connect token. Check permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-wood-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="wood-panel-raised border border-wood-650 rounded-2xl p-6 max-w-lg w-full shadow-wood-raised-lg space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-wood-750">
          <div className="flex items-center gap-2.5 text-wood-100 font-serif font-bold text-lg">
            <Cloud className="w-5 h-5 text-brass" />
            <span>Sync Profile & Matches with GitHub</span>
          </div>
          <button
            onClick={onClose}
            className="text-wood-400 hover:text-wood-100 p-1 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-wood-300 leading-relaxed font-sans">
          Store your entire academy journey in a private, secret GitHub Gist on your own account.
          Zero external servers required — your browser talks directly and securely to GitHub.
        </p>

        {/* What gets synced highlights */}
        <div className="wood-well rounded-xl p-3.5 border border-wood-750 text-xs space-y-2">
          <span className="font-serif font-bold text-wood-200 uppercase tracking-wider text-[10px] block">
            Synchronized Across All Devices
          </span>
          <div className="grid grid-cols-2 gap-2 text-wood-300 text-[11px]">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-brass shrink-0" />
              <span>Tier Level & Total XP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-brass shrink-0" />
              <span>Unlocked Achievements</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-brass shrink-0" />
              <span>Tactics Rating & Puzzles</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-brass shrink-0" />
              <span>Academy Lessons & Openings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-brass shrink-0" />
              <span>Bot Sparring Win/Loss Record</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-brass shrink-0" />
              <span>Archived Games & Analysis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-brass shrink-0" />
              <span>Piece Style</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-serif font-bold text-wood-400 uppercase tracking-wider mb-1.5">
              GitHub Personal Access Token (Classic or Fine-grained with &quot;gist&quot; scope)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-wood-500" />
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full wood-well border border-wood-700 rounded-xl pl-9 pr-3 py-2 text-xs text-wood-100 placeholder-wood-600 focus:outline-none focus:border-brass font-mono shadow-wood-inset"
                autoFocus
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg wood-well border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <a
              href={TOKEN_HELP_URL}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brass hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Generate token on GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl wood-btn text-wood-300 hover:text-wood-100 text-xs font-serif font-bold tracking-wide border border-wood-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !tokenInput.trim()}
                className="px-4 py-2 rounded-xl wood-btn-brass disabled:opacity-40 text-wood-950 text-xs font-serif font-bold uppercase tracking-wider shadow transition flex items-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Connect & Sync</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
