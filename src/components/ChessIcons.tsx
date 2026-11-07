import React from 'react';
import {
  Target,
  Swords,
  Sparkles,
  Bot,
  BookOpen,
  Crown,
  Shield,
  Star,
  Award,
  RotateCcw,
  CheckCircle2,
  Trophy,
} from 'lucide-react';

interface AchievementIconProps {
  name: string;
  className?: string;
}

export const AchievementIcon: React.FC<AchievementIconProps> = ({ name, className = 'w-5 h-5 text-brass' }) => {
  switch (name) {
    case 'target':
      return <Target className={className} />;
    case 'swords':
      return <Swords className={className} />;
    case 'puzzle':
      return <Sparkles className={className} />;
    case 'bot':
      return <Bot className={className} />;
    case 'book':
      return <BookOpen className={className} />;
    case 'crown':
      return <Crown className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'trophy':
      return <Trophy className={className} />;
    case 'rotate-ccw':
      return <RotateCcw className={className} />;
    case 'award':
    default:
      return <Award className={className} />;
  }
};
