import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UserProgress, Achievement } from '../types/chess';
import { sounds } from '../engine/sound';

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'first_move',
    title: 'First Step',
    description: 'Completed your very first interactive chess lesson.',
    icon: '🎯',
  },
  {
    id: 'tactics_apprentice',
    title: 'Tactics Apprentice',
    description: 'Mastered the Fork and Pin tactics in the academy.',
    icon: '⚔️',
  },
  {
    id: 'puzzle_solver_5',
    title: 'Sharpshooter',
    description: 'Solved 5 tactical puzzles successfully.',
    icon: '🧩',
  },
  {
    id: 'bot_slayer_1',
    title: 'Bot Tamer',
    description: 'Defeated your first chess bot.',
    icon: '🤖',
  },
  {
    id: 'opening_scholar',
    title: 'Repertoire Explorer',
    description: 'Studied 3 classic chess openings in depth.',
    icon: '📖',
  },
  {
    id: 'gm_decoder_master',
    title: 'Grandmaster Mind',
    description: 'Completed an entire legendary Grandmaster game breakdown.',
    icon: '👑',
  },
  {
    id: 'endgame_wizard',
    title: 'Endgame Virtuoso',
    description: 'Learned key endgame techniques: King Opposition & Rook Cut-offs.',
    icon: '♟️',
  },
  {
    id: 'rating_1200',
    title: 'Rising Star',
    description: 'Reached a tactical rating of 1200+ in the Puzzle Arena.',
    icon: '⭐',
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
  recordPuzzleResult: (puzzleId: string, isCorrect: boolean, ratingDelta: number) => void;
  studyOpening: (openingId: string) => void;
  studyMasterGame: (gameId: string) => void;
  recordBotGame: (botId: string, result: 'win' | 'loss' | 'draw') => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  recentToast: { title: string; message: string; icon?: string } | null;
  clearToast: () => void;
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...INITIAL_PROGRESS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not load progress from localStorage:', e);
    }
    return INITIAL_PROGRESS;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('cschool_sound_pref');
    return saved !== null ? saved === 'true' : true;
  });

  const [recentToast, setRecentToast] = useState<{ title: string; message: string; icon?: string } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.warn('Could not save progress:', e);
    }
  }, [progress]);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    sounds.setEnabled(nextVal);
    localStorage.setItem('cschool_sound_pref', String(nextVal));
  };

  const showToast = (title: string, message: string, icon: string = '✨') => {
    setRecentToast({ title, message, icon });
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }
    setTimeout(() => {
      setRecentToast(null);
    }, 4500);
  };

  const triggerAchievement = (achievementId: string) => {
    setProgress((prev) => {
      if (prev.achievements.includes(achievementId)) return prev;
      const ach = ACHIEVEMENTS_LIST.find((a) => a.id === achievementId);
      if (ach) {
        showToast(`Achievement Unlocked!`, ach.title, ach.icon);
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
    // 0-200: Level 1, 201-500: Level 2, 501-1000: Level 3, 1001-2000: Level 4, etc.
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  };

  const addXp = (amount: number, reason?: string) => {
    setProgress((prev) => {
      const newXp = prev.xp + amount;
      const newLevel = calculateLevel(newXp);

      if (newLevel > prev.level) {
        showToast('Level Up!', `Congratulations! You reached Level ${newLevel}!`, '🚀');
        sounds.playSuccess();
      } else if (reason) {
        // Optional mini feedback
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

    // Check achievement triggers
    triggerAchievement('first_move');
    if (lessonId.includes('fork') || lessonId.includes('pin')) {
      triggerAchievement('tactics_apprentice');
    }
    if (lessonId.includes('endgame')) {
      triggerAchievement('endgame_wizard');
    }
  };

  const recordPuzzleResult = (puzzleId: string, isCorrect: boolean, ratingDelta: number) => {
    setProgress((prev) => {
      const alreadySolved = prev.solvedPuzzles.includes(puzzleId);
      const newSolved = isCorrect && !alreadySolved ? [...prev.solvedPuzzles, puzzleId] : prev.solvedPuzzles;
      const newRating = Math.max(400, prev.tacticsRating + ratingDelta);
      const xpGain = isCorrect ? 25 : 5;
      const newXp = prev.xp + xpGain;

      return {
        ...prev,
        solvedPuzzles: newSolved,
        tacticsRating: newRating,
        xp: newXp,
        level: calculateLevel(newXp),
      };
    });

    if (isCorrect) {
      sounds.playSuccess();
      if (progress.solvedPuzzles.length + 1 >= 5) {
        triggerAchievement('puzzle_solver_5');
      }
      if (progress.tacticsRating + ratingDelta >= 1200) {
        triggerAchievement('rating_1200');
      }
    } else {
      sounds.playMistake();
    }
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
        xp: prev.xp + 40,
      };
    });
  };

  const studyMasterGame = (gameId: string) => {
    setProgress((prev) => {
      if (prev.studiedMasterGames.includes(gameId)) return prev;
      setTimeout(() => triggerAchievement('gm_decoder_master'), 500);
      return {
        ...prev,
        studiedMasterGames: [...prev.studiedMasterGames, gameId],
        xp: prev.xp + 75,
      };
    });
  };

  const recordBotGame = (botId: string, result: 'win' | 'loss' | 'draw') => {
    setProgress((prev) => {
      const isWin = result === 'win';
      const isDraw = result === 'draw';
      const defeated = isWin && !prev.botRecord.defeatedBots.includes(botId)
        ? [...prev.botRecord.defeatedBots, botId]
        : prev.botRecord.defeatedBots;

      const xpGain = isWin ? 100 : isDraw ? 40 : 20;

      return {
        ...prev,
        botRecord: {
          wins: prev.botRecord.wins + (isWin ? 1 : 0),
          losses: prev.botRecord.losses + (!isWin && !isDraw ? 1 : 0),
          draws: prev.botRecord.draws + (isDraw ? 1 : 0),
          defeatedBots: defeated,
        },
        xp: prev.xp + xpGain,
        level: calculateLevel(prev.xp + xpGain),
      };
    });

    if (result === 'win') {
      triggerAchievement('bot_slayer_1');
    }
  };

  const resetProgress = () => {
    if (window.confirm('Are you sure you want to reset your chess learning progress?')) {
      setProgress(INITIAL_PROGRESS);
      localStorage.removeItem(STORAGE_KEY);
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
        soundEnabled,
        toggleSound,
        recentToast,
        clearToast: () => setRecentToast(null),
        resetProgress,
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
