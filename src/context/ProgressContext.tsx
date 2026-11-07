import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProgress, Achievement } from '../types/chess';
import { sounds } from '../engine/sound';

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'first_move',
    title: 'First Step',
    description: 'Completed your very first interactive chess lesson.',
    icon: 'target',
  },
  {
    id: 'tactics_apprentice',
    title: 'Tactics Apprentice',
    description: 'Mastered the Fork and Pin tactics in the academy.',
    icon: 'swords',
  },
  {
    id: 'puzzle_solver_5',
    title: 'Sharpshooter',
    description: 'Solved 5 tactical puzzles successfully.',
    icon: 'puzzle',
  },
  {
    id: 'bot_slayer_1',
    title: 'Bot Tamer',
    description: 'Defeated your first chess bot.',
    icon: 'bot',
  },
  {
    id: 'opening_scholar',
    title: 'Repertoire Explorer',
    description: 'Studied 3 classic chess openings in depth.',
    icon: 'book',
  },
  {
    id: 'gm_decoder_master',
    title: 'Grandmaster Mind',
    description: 'Completed an entire legendary Grandmaster game breakdown.',
    icon: 'crown',
  },
  {
    id: 'endgame_wizard',
    title: 'Endgame Virtuoso',
    description: 'Learned key endgame techniques: King Opposition & Rook Cut-offs.',
    icon: 'shield',
  },
  {
    id: 'rating_1200',
    title: 'Rising Star',
    description: 'Reached a tactical rating of 1200+ in the Puzzle Arena.',
    icon: 'star',
  },
];

const INITIAL_PROGRESS: UserProgress = {
  xp: 0,
  level: 1,
  tacticsRating: 1000,
  completedLessons: [],
  solvedPuzzles: [],
  studiedOpenings: [],
  studiedMasterGames: [],
  botRecord: {
    wins: 0,
    losses: 0,
    draws: 0,
    defeatedBots: [],
  },
  achievements: [],
  streakDays: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
};

const STORAGE_KEY = 'cschool_user_progress_v1';

interface ProgressContextType {
  progress: UserProgress;
  addXp: (amount: number, reason?: string) => void;
  completeLesson: (lessonId: string, xpReward: number) => void;
  recordPuzzleResult: (puzzleId: string, success: boolean, ratingChange: number) => void;
  studyOpening: (openingId: string) => void;
  studyMasterGame: (gameId: string) => void;
  recordBotGame: (botId: string, result: 'win' | 'loss' | 'draw') => void;
  resetProgress: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  recentToast: { title: string; message: string; icon?: string } | null;
  clearToast: () => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Calculate streak
        const today = new Date().toISOString().split('T')[0];
        const lastDate = parsed.lastActiveDate || today;

        if (today !== lastDate) {
          const diffDays = Math.floor(
            (new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 3600 * 24)
          );
          if (diffDays === 1) {
            parsed.streakDays = (parsed.streakDays || 1) + 1;
          } else if (diffDays > 1) {
            parsed.streakDays = 1;
          }
          parsed.lastActiveDate = today;
        }
        return { ...INITIAL_PROGRESS, ...parsed };
      }
    } catch {
      // fallback
    }
    return INITIAL_PROGRESS;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const pref = localStorage.getItem('cschool_sound_pref');
    return pref !== null ? pref === 'true' : true;
  });

  const [recentToast, setRecentToast] = useState<{
    title: string;
    message: string;
    icon?: string;
  } | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore
    }
  }, [progress]);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    sounds.setEnabled(nextVal);
    localStorage.setItem('cschool_sound_pref', String(nextVal));
  };

  const showToast = (title: string, message: string, icon: string = 'award') => {
    setRecentToast({ title, message, icon });
    setTimeout(() => {
      setRecentToast(null);
    }, 4500);
  };

  const triggerAchievement = (achievementId: string) => {
    setProgress((prev) => {
      if (prev.achievements.includes(achievementId)) return prev;
      const ach = ACHIEVEMENTS_LIST.find((a) => a.id === achievementId);
      if (ach) {
        showToast('Achievement Unlocked', ach.title, ach.icon);
        sounds.playSuccess();
      }
      return {
        ...prev,
        achievements: [...prev.achievements, achievementId],
        xp: prev.xp + 100,
      };
    });
  };

  const calculateLevel = (xp: number) => {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  };

  const addXp = (amount: number, _reason?: string) => {
    setProgress((prev) => {
      const newXp = prev.xp + amount;
      const newLevel = calculateLevel(newXp);

      if (newLevel > prev.level) {
        showToast('Level Up', `Congratulations! You reached Level ${newLevel}!`, 'crown');
        sounds.playSuccess();
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
      };
    });
  };

  const completeLesson = (lessonId: string, xpReward: number) => {
    setProgress((prev) => {
      const alreadyDone = prev.completedLessons.includes(lessonId);
      const newCompleted = alreadyDone ? prev.completedLessons : [...prev.completedLessons, lessonId];
      const xpEarned = alreadyDone ? Math.floor(xpReward / 3) : xpReward;
      const newXp = prev.xp + xpEarned;
      const newLevel = calculateLevel(newXp);

      return {
        ...prev,
        completedLessons: newCompleted,
        xp: newXp,
        level: newLevel,
      };
    });

    triggerAchievement('first_move');
    if (lessonId === 'fork-tactic' || lessonId === 'pin-tactic') {
      setTimeout(() => {
        triggerAchievement('tactics_apprentice');
      }, 500);
    }
    if (lessonId === 'king-opposition' || lessonId === 'rook-cutoff') {
      setTimeout(() => {
        triggerAchievement('endgame_wizard');
      }, 500);
    }
  };

  const recordPuzzleResult = (puzzleId: string, success: boolean, ratingChange: number) => {
    setProgress((prev) => {
      const alreadySolved = prev.solvedPuzzles.includes(puzzleId);
      const newSolved = success && !alreadySolved ? [...prev.solvedPuzzles, puzzleId] : prev.solvedPuzzles;
      const newRating = Math.max(400, prev.tacticsRating + ratingChange);
      const newXp = success ? prev.xp + 25 : Math.max(0, prev.xp + 5);
      const newLevel = calculateLevel(newXp);

      if (newSolved.length >= 5) {
        setTimeout(() => triggerAchievement('puzzle_solver_5'), 400);
      }
      if (newRating >= 1200) {
        setTimeout(() => triggerAchievement('rating_1200'), 400);
      }

      return {
        ...prev,
        tacticsRating: newRating,
        solvedPuzzles: newSolved,
        xp: newXp,
        level: newLevel,
      };
    });
  };

  const studyOpening = (openingId: string) => {
    setProgress((prev) => {
      if (prev.studiedOpenings.includes(openingId)) return prev;
      const updated = [...prev.studiedOpenings, openingId];
      if (updated.length >= 3) {
        setTimeout(() => triggerAchievement('opening_scholar'), 500);
      }
      return {
        ...prev,
        studiedOpenings: updated,
        xp: prev.xp + 50,
      };
    });
  };

  const studyMasterGame = (gameId: string) => {
    setProgress((prev) => {
      if (prev.studiedMasterGames.includes(gameId)) return prev;
      const updated = [...prev.studiedMasterGames, gameId];
      setTimeout(() => triggerAchievement('gm_decoder_master'), 500);
      return {
        ...prev,
        studiedMasterGames: updated,
        xp: prev.xp + 75,
      };
    });
  };

  const recordBotGame = (botId: string, result: 'win' | 'loss' | 'draw') => {
    setProgress((prev) => {
      const current = prev.botRecord;
      const newWins = result === 'win' ? current.wins + 1 : current.wins;
      const newLosses = result === 'loss' ? current.losses + 1 : current.losses;
      const newDraws = result === 'draw' ? current.draws + 1 : current.draws;
      const defeated =
        result === 'win' && !current.defeatedBots.includes(botId)
          ? [...current.defeatedBots, botId]
          : current.defeatedBots;

      if (result === 'win') {
        setTimeout(() => triggerAchievement('bot_slayer_1'), 400);
      }

      return {
        ...prev,
        botRecord: {
          wins: newWins,
          losses: newLosses,
          draws: newDraws,
          defeatedBots: defeated,
        },
        xp: prev.xp + (result === 'win' ? 60 : result === 'draw' ? 30 : 15),
      };
    });
  };

  const resetProgress = () => {
    if (window.confirm('Are you sure you want to reset your academy rating and progress?')) {
      setProgress(INITIAL_PROGRESS);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      showToast('Progress Reset', 'Your academy record has been restored to factory baseline.', 'rotate-ccw');
    }
  };

  return (
    <ProgressContext.Provider
      value={{
        progress,
        addXp,
        completeLesson,
        recordPuzzleResult,
        studyOpening,
        studyMasterGame,
        recordBotGame,
        resetProgress,
        soundEnabled,
        toggleSound,
        recentToast,
        clearToast: () => setRecentToast(null),
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};
