import { BotPersonality } from '../types/chess';

export const BOTS: BotPersonality[] = [
  {
    id: 'pawn-pal',
    name: 'Pawn Pal',
    title: 'Curious Beginner',
    avatar: '🧸',
    elo: 400,
    difficulty: 'Beginner',
    description: 'Just learned how pieces move! Plays casually and often hangs pieces. Perfect for your first win!',
    style: 'Playful & Unpredictable',
    color: 'emerald',
    depth: 1,
    blunderRate: 0.65,
    quotes: {
      start: [
        'Hi there! Can we play a friendly game? I hope I remember how the knight moves!',
        'Let\'s play! I like pushing pawns the most!',
      ],
      onBlunder: [
        'Oops! Did I leave that piece there by mistake?',
        'Oh no, I didn\'t see you could take that!',
      ],
      onCapture: [
        'Yay, I got one of your pieces!',
        'Look what I found on the board!',
      ],
      onCheck: [
        'Wait, is my king in trouble?',
        'Check?! I better move my king somewhere safe!',
      ],
      onLoss: [
        'Good game! You\'re getting really good at this!',
        'Wow, checkmate! You taught me a good lesson today!',
      ],
      onWin: [
        'I won?! Wow, Beginner\'s luck is real!',
        'Great game, friend! Let\'s play again soon!',
      ],
    },
  },
  {
    id: 'coffeehouse-cat',
    name: 'Coffeehouse Cat',
    title: 'Aggressive Gambler',
    avatar: '🐱',
    elo: 800,
    difficulty: 'Casual',
    description: 'Loves fast attacks, early queen maneuvers, and grabbing free pawns. Ignores defense!',
    style: 'Sharp & Aggressive',
    color: 'amber',
    depth: 2,
    blunderRate: 0.28,
    quotes: {
      start: [
        'Meow! Fast attacks are the only way to play chess!',
        'Castling is for cowards! Let\'s attack!',
      ],
      onBlunder: [
        'Hiss! That was a tactical mouse-slip!',
        'You tricked me! I was too focused on attacking!',
      ],
      onCapture: [
        'Nom nom, another piece captured!',
        'Delicious material! Mine now!',
      ],
      onCheck: [
        'Check? Just a temporary scratch!',
        'Watch your own king while you check mine!',
      ],
      onLoss: [
        'Purr... okay, you got me this time. Well played!',
        'I should have castled... my coach was right!',
      ],
      onWin: [
        'Victory claws! My attack broke through!',
        'Meow-hahaha! The king hunt succeeded!',
      ],
    },
  },
  {
    id: 'shield-knight',
    name: 'Shield Knight',
    title: 'Solid Defender',
    avatar: '🛡️',
    elo: 1200,
    difficulty: 'Club',
    description: 'Disciplined club player. Castles early, guards weak points, and punishes obvious blunders.',
    style: 'Solid & Principled',
    color: 'blue',
    depth: 3,
    blunderRate: 0.08,
    quotes: {
      start: [
        'A good game of chess begins with solid fundamentals. Shall we?',
        'King safety and central control: let us see who maintains them better.',
      ],
      onBlunder: [
        'A tactical oversight on my part. Impressive calculation!',
        'You spotted the flaw in my defensive wall.',
      ],
      onCapture: [
        'A calculated trade to solidify my advantage.',
        'Material equality restored.',
      ],
      onCheck: [
        'Parrying the check. My defense remains intact.',
        'A sharp thrust, but I have defensive resources.',
      ],
      onLoss: [
        'Resigned with honor. You outplayed my defenses decisively!',
        'Exceptional play! Your tactical vision was superior today.',
      ],
      onWin: [
        'Patience and solid defense won the day. Good match!',
        'Remember to secure your king before attacking!',
      ],
    },
  },
  {
    id: 'professor-bishop',
    name: 'Professor Bishop',
    title: 'Positional Tactician',
    avatar: '🦉',
    elo: 1600,
    difficulty: 'Expert',
    description: 'Calculates deeply, targets outposts, controls diagonals, and exploits isolated pawns.',
    style: 'Positional & Strategic',
    color: 'indigo',
    depth: 3,
    blunderRate: 0.0,
    quotes: {
      start: [
        'Welcome to my study. Let us explore the nuances of pawn structures.',
        'Remember: tactics flow from a superior position.',
      ],
      onBlunder: [
        'Fascinating... I did not foresee that counter-dynamic.',
        'A brilliant refutation! You have studied your classics.',
      ],
      onCapture: [
        'Positional liquidation according to plan.',
        'Weakening your pawn structure systematically.',
      ],
      onCheck: [
        'An inquisitive check, but my king position is solid.',
        'Evading the diagonal with precision.',
      ],
      onLoss: [
        'A masterclass in technique! My compliments to your strategic mind.',
        'You played with grandmaster clarity. Outstanding victory!',
      ],
      onWin: [
        'The accumulated micro-advantages proved decisive. Keep studying!',
        'Checkmate. Notice how the open file determined the outcome.',
      ],
    },
  },
  {
    id: 'gm-magnus-bot',
    name: 'Grandmaster Magnus',
    title: 'Ruthless Master',
    avatar: '🦁',
    elo: 2100,
    difficulty: 'Master',
    description: 'Deep minimax search with alpha-beta pruning. Grinds the smallest endgame advantage into victory.',
    style: 'Universal & Relentless',
    color: 'purple',
    depth: 4,
    blunderRate: 0.0,
    quotes: {
      start: [
        'Let\'s see how well you understand the true nature of the game.',
        'Every single tempo matters. Show me no fear.',
      ],
      onBlunder: [
        'Incredible. You found the only move that maintains equality.',
        'A masterstroke! That complicates things considerably.',
      ],
      onCapture: [
        'The conversion process begins.',
        'One step closer to an easily won endgame.',
      ],
      onCheck: [
        'Checked, but my king is an active fighting piece.',
        'Calculated 5 moves ago.',
      ],
      onLoss: [
        'Unbelievable! You have conquered the Grandmaster bot! All hail the new champion!',
        'Flawless play from start to finish. You belong on the grandmaster stage!',
      ],
      onWin: [
        'Checkmate. Relentless technique always prevails. Analyze your mistakes to grow!',
        'A valiant effort, but endgames demand absolute perfection.',
      ],
    },
  },
];
