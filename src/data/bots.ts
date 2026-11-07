import { BotPersonality } from '../types/chess';

export const BOTS: BotPersonality[] = [
  {
    id: 'pawn-pal',
    name: 'Pawn Pal',
    title: 'Woodpusher Trainee',
    avatar: 'pawn',
    elo: 400,
    difficulty: 'Beginner',
    description: 'Just learned the moves! Often pushes pawns without backup and leaves pieces en prise. Perfect for your foundational practice.',
    style: 'Direct & Uncautious',
    color: 'emerald',
    depth: 1,
    blunderRate: 0.65,
    quotes: {
      start: [
        'Welcome! Every grandmaster once began by pushing their first pawn. Shall we play?',
        'Let us play a friendly game! I enjoy advancing my central pawns.',
      ],
      onBlunder: [
        'Ah, I left that piece unguarded. Good eye!',
        'A tactical oversight on my part — you saw right through it.',
      ],
      onCapture: [
        'I managed to win one of your pieces!',
        'An open capture! The position is shifting.',
      ],
      onCheck: [
        'My king is under fire! Time to find safe haven.',
        'Check! I must parry this attack immediately.',
      ],
      onLoss: [
        'Well played! You calculated cleanly and deserved the victory.',
        'Checkmate. A well-earned win; every match is a valuable lesson.',
      ],
      onWin: [
        'A hard-fought game! Reset the board and let us play another.',
        'Good effort! With more tactical alertness, you will soon prevail.',
      ],
    },
  },
  {
    id: 'coffeehouse-cat',
    name: 'Coffeehouse Tactician',
    title: 'Romantic Gambler',
    avatar: 'knight',
    elo: 800,
    difficulty: 'Casual',
    description: 'Loves rapid piece development, gambits, and early tactical skirmishes. Aggressive forward play while neglecting king safety.',
    style: 'Sharp & Swashbuckling',
    color: 'amber',
    depth: 2,
    blunderRate: 0.28,
    quotes: {
      start: [
        'A quiet match? Never! The initiative and open diagonals belong to the bold!',
        'Calculated risks make chess an art form. Let us see who strikes first.',
      ],
      onBlunder: [
        'A fierce counter-stroke! I was too focused on attacking your flank.',
        'You parried my sortie and punished my reckless charge!',
      ],
      onCapture: [
        'Material won, and the offensive continues!',
        'The bishop slice opens lines for my pieces!',
      ],
      onCheck: [
        'A check on my king? Just a tactical inconvenience!',
        'Keep an eye on your own defenses while pursuing mine!',
      ],
      onLoss: [
        'Splendid refutation! You withstood my storm and struck the decisive blow.',
        'I overextended my assault. Honor to your defensive precision.',
      ],
      onWin: [
        'The attack broke through the fortress! Romantic tactics reign supreme.',
        'The mating net has snapped shut! Never surrender the initiative.',
      ],
    },
  },
  {
    id: 'shield-knight',
    name: 'Shield Sentinel',
    title: 'Solid Defender',
    avatar: 'rook',
    elo: 1200,
    difficulty: 'Club',
    description: 'Disciplined club player. Castles promptly, controls key central squares, guards weaknesses, and exploits blunders cleanly.',
    style: 'Principled & Resilient',
    color: 'blue',
    depth: 3,
    blunderRate: 0.08,
    quotes: {
      start: [
        'Sound fundamentals build invincible positions. May the more disciplined player prevail.',
        'Central control and king security: let us test whose structure endures.',
      ],
      onBlunder: [
        'An inaccurate calculation by my defenses. Splendid vision on your part.',
        'You spotted the subtle fracture in my defensive perimeter.',
      ],
      onCapture: [
        'A favorable exchange to solidify my central outpost.',
        'Harmonic material balance maintained according to plan.',
      ],
      onCheck: [
        'Parrying the check. My fortress holds firm.',
        'A sharp thrust, yet my defensive resources are well coordinated.',
      ],
      onLoss: [
        'Resigned with respect. Your tactical execution systematically dismantled my guard.',
        'Exceptional play! Your spatial mastery proved decisive today.',
      ],
      onWin: [
        'Patience and structural harmony carried the match. A fine contest!',
        'Always secure your king and complete development before launching an assault.',
      ],
    },
  },
  {
    id: 'professor-bishop',
    name: 'Professor Lasker',
    title: 'Positional Strategist',
    avatar: 'bishop',
    elo: 1600,
    difficulty: 'Expert',
    description: 'Calculates deep candidate moves, maneuvers against pawn weaknesses, restricts counterplay, and controls the color complexes.',
    style: 'Deep & Positional',
    color: 'indigo',
    depth: 3,
    blunderRate: 0.0,
    quotes: {
      start: [
        'Welcome to my study. Let us examine the subtle dynamics of pawn geometry.',
        'Remember Lasker\'s maxim: when you see a good move, look for a better one.',
      ],
      onBlunder: [
        'Fascinating... an unforeseen dynamic counter-play. Splendid calculation.',
        'A classical refutation! You have studied the tournament archives well.',
      ],
      onCapture: [
        'Strategic liquidation into a favorable simplified ending.',
        'Targeting the backward pawn on the half-open file systematically.',
      ],
      onCheck: [
        'A probing check, but my king tucks securely behind the pawn shield.',
        'Repositioning to an optimal diagonal with minimal disturbance.',
      ],
      onLoss: [
        'A masterclass in technique. My deepest compliments to your analytical depth.',
        'You conducted this struggle with grandmaster clarity. A memorable defeat for me.',
      ],
      onWin: [
        'The accumulated micro-advantages finally matured into victory. Keep studying!',
        'Checkmate. Notice how control of the critical outpost predetermined the endgame.',
      ],
    },
  },
  {
    id: 'gm-magnus-bot',
    name: 'Grandmaster Magnus',
    title: 'Universal Virtuoso',
    avatar: 'king',
    elo: 2100,
    difficulty: 'Master',
    description: 'Deep minimax search with alpha-beta pruning. Grinds the smallest endgame nuance with relentless precision.',
    style: 'Universal & Relentless',
    color: 'purple',
    depth: 4,
    blunderRate: 0.0,
    quotes: {
      start: [
        'Let us discover how deeply you comprehend the harmony of the pieces.',
        'In chess, every single tempo is irreplaceable. Play without fear.',
      ],
      onBlunder: [
        'Remarkable. You identified the only candidate move that preserves balance.',
        'A masterstroke. That introduces intricate tactical complications.',
      ],
      onCapture: [
        'The technical conversion phase begins.',
        'Another step closer to a mathematically won endgame.',
      ],
      onCheck: [
        'Check parried. In the endgame, the king becomes a potent fighting piece.',
        'Anticipated several plies in advance.',
      ],
      onLoss: [
        'Stunning! You have outplayed the Grandmaster engine. Flawless technique from first move to last.',
        'You played with supreme precision. You belong on the tournament stage.',
      ],
      onWin: [
        'Checkmate. Relentless positional pressure always tells in the end. Study your games to ascend.',
        'A formidable contest, but the endgame tolerates no structural inaccuracy.',
      ],
    },
  },
];
