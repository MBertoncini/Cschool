import { Lesson } from '../types/chess';

export const LESSONS: Lesson[] = [
  // ================= TIER 1: TACTICS BASICS =================
  {
    id: 'lesson-fork',
    title: 'The Fork: Attacking Two Pieces at Once',
    category: 'tactics-basics',
    tier: 1,
    difficulty: 'Beginner',
    summary: 'A single piece attacks two or more enemy targets at the exact same time.',
    conceptIntro: `A "Fork" occurs when one piece (frequently a Knight or Pawn) attacks two or more enemy pieces simultaneously. 
Since chess only allows your opponent to make one move per turn, they usually cannot save both pieces!
The Knight is especially famous for forks because it can jump over other pieces and moves in an L-shape that cannot be blocked.`,
    keyRule: 'Always scan for "geometric alignments" where an enemy King and high-value piece (Queen/Rook) are within a Knight hop of each other.',
    xpReward: 50,
    steps: [
      {
        fen: '4k3/8/8/3q4/8/5N2/8/4K3 w - - 0 1',
        instruction: 'Find the devastating Knight jump that attacks both the Black King and Queen!',
        explanation: 'Moving the Knight to e5 attacks both the King on e8 and the Queen on d5. Since the King is in check, Black MUST move their King, leaving the Queen ripe for capture!',
        expectedMove: { from: 'f3', to: 'e5' },
        hint: 'Look for a square where the Knight can deliver check to the King on e8 while pointing at d5.',
        arrow: { from: 'f3', to: 'e5', color: '#10b981' },
        highlightSquares: ['e5'],
        followUpStep: {
          fen: '4k3/8/8/3qN3/8/8/8/4K3 b - - 1 1',
          instruction: 'Black king moves to safety on d8. Now complete the fork combination!',
          explanation: 'Black had to address the check. You win the Queen for free!',
          expectedMove: { from: 'e5', to: 'd5' },
        },
      },
      {
        fen: 'r3k3/8/8/8/3n4/8/2P1P3/4K3 w - - 0 1',
        instruction: 'Pawns can fork too! Use your central pawn to attack two Black minor pieces.',
        explanation: 'Playing c3 or e3? Wait, look closely: playing e4 or c3 attacks the knight on d4 and takes away its retreat squares. Even better, in positions with pawns side by side, pushing a pawn between two enemy pieces wins one cleanly!',
        expectedMove: { from: 'c2', to: 'c3' },
        hint: 'Push the c2 pawn forward one square to kick the knight.',
        highlightSquares: ['c3'],
      },
    ],
  },
  {
    id: 'lesson-pin',
    title: 'The Pin: Freezing Enemy Pieces',
    category: 'tactics-basics',
    tier: 1,
    difficulty: 'Beginner',
    summary: 'A piece cannot move because doing so would expose a more valuable piece behind it.',
    conceptIntro: `There are two types of pins:
1. **Absolute Pin**: The piece behind is the King. Moving the pinned piece is illegal under chess rules!
2. **Relative Pin**: The piece behind is a valuable piece like the Queen or Rook. Moving is legal, but catastrophic.
Long-range pieces (Bishops, Rooks, Queens) deliver pins. When an opponent's piece is pinned, pile up attackers on it!`,
    keyRule: 'Rule of thumb: "Put pressure on the pinned piece!" It cannot run away, so attack it with a cheaper piece (like a pawn).',
    xpReward: 50,
    steps: [
      {
        fen: '4k3/4r3/8/8/8/8/8/4R1K1 w - - 0 1',
        instruction: 'The Black Rook on e7 is pinned against the Black King. White can exploit this. How?',
        explanation: 'The Black Rook on e7 cannot move away because it would place the King on e8 into check (Absolute Pin). White can directly capture it or maintain pressure.',
        expectedMove: { from: 'e1', to: 'e7' },
        hint: 'Take the immobilized Rook on e7 with your Rook!',
        arrow: { from: 'e1', to: 'e7', color: '#10b981' },
        highlightSquares: ['e7'],
      },
      {
        fen: 'r1bqk2r/pppp1ppp/2n5/4p3/1b2P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 1 6',
        instruction: 'Black bishop on b4 has pinned our knight on c3 against our King on e1. How should White resolve or neutralize this pressure?',
        explanation: 'Developing the Bishop to d2 defends the knight, breaks the pin, and prepares kingside development or castling.',
        expectedMove: { from: 'c1', to: 'd2' },
        hint: 'Place your bishop between the pinned knight and your king or support c3.',
        arrow: { from: 'c1', to: 'd2', color: '#3b82f6' },
        highlightSquares: ['d2'],
      },
    ],
  },
  {
    id: 'lesson-skewer',
    title: 'The Skewer: Reversing the Pin',
    category: 'tactics-basics',
    tier: 1,
    difficulty: 'Beginner',
    summary: 'A high-value piece is attacked in front, forced to move, exposing a piece behind it.',
    conceptIntro: `A "Skewer" is often called a "reverse pin".
Unlike a pin (where the less valuable piece is in front of the King or Queen), in a skewer, the MORE valuable piece is in the front!
When the King is checked or the Queen is attacked by a long-range slider, it is forced to move aside, allowing you to capture whatever was hiding behind it.`,
    keyRule: 'Look for enemy Kings and Queens aligned on the same open file, rank, or diagonal as your Rooks and Bishops.',
    xpReward: 50,
    steps: [
      {
        fen: '4k2r/8/8/8/8/8/8/R3K3 w Qk - 0 1',
        instruction: 'White Rook on a1 can deliver a deadly skewer across the 8th rank. Where does it go?',
        explanation: 'Ra8+ checks the King on e8! The King MUST step away, exposing the unprotected Rook on h8 to immediate capture.',
        expectedMove: { from: 'a1', to: 'a8' },
        hint: 'Slide your Rook all the way to the 8th rank to deliver check.',
        arrow: { from: 'a1', to: 'a8', color: '#10b981' },
        highlightSquares: ['a8'],
        followUpStep: {
          fen: 'R3k2r/8/8/4K3/8/8/8/8 b - - 1 1',
          instruction: 'Black King retreats to d7. Now win the prize!',
          explanation: 'The King stepped aside, leaving the h8 Rook completely defenseless. Captured!',
          expectedMove: { from: 'a8', to: 'h8' },
        },
      },
    ],
  },
  {
    id: 'lesson-discovered-attack',
    title: 'Discovered Attacks & Discovered Check',
    category: 'tactics-basics',
    tier: 1,
    difficulty: 'Novice',
    summary: 'Moving one piece reveals a surprise attack from a piece waiting behind it.',
    conceptIntro: `A discovered attack happens when a piece moves out of the way, uncorking an attack from a friendly Queen, Rook, or Bishop behind it.
Because the moving piece can land anywhere it pleases (even on an undefended square), it can create a dual threat that is impossible to meet.
When the discovered attack checks the King, it is called a "Discovered Check" — the most dangerous tactical weapon in chess!`,
    keyRule: 'The piece that moves can be used as a kamikaze or capture free material while the opponent is forced to answer the discovered check.',
    xpReward: 60,
    steps: [
      {
        fen: '4k3/8/8/3b4/8/3B4/8/4R1K1 w - - 0 1',
        instruction: 'White has a Rook on e1 aligned with Black\'s King on e8. Move the Bishop to unleash a discovered check!',
        explanation: 'Bb5+ delivers check from the Rook on e1 while the Bishop is completely safe! Even better, moving the Bishop to c4 or b5 with check wins time.',
        expectedMove: { from: 'd3', to: 'b5' },
        hint: 'Move the Bishop off the e-file with check to unleash the Rook behind it.',
        arrow: { from: 'd3', to: 'b5', color: '#10b981' },
        highlightSquares: ['b5'],
      },
    ],
  },

  // ================= TIER 2: INTERMEDIATE TACTICS =================
  {
    id: 'lesson-back-rank',
    title: 'Back-Rank Mate: Exploiting King Imprisonment',
    category: 'tactics-intermediate',
    tier: 2,
    difficulty: 'Novice',
    summary: 'A king trapped behind its own defensive pawns is checkmated by a rook or queen on the back rank.',
    conceptIntro: `When a player castles, their King is usually shielded by pawns on f7, g7, and h7 (or f2, g2, h2).
While this protects the King from frontal assault, it can turn into a deadly prison if the back rank is not defended!
If an enemy Rook or Queen penetrates to the 8th rank, the King cannot step forward because of its own pawns. This is called the "Back-Rank Checkmate".
To prevent this, grandmasters often play **h3** or **h6** (creating "Luft", German for air/breathing room).`,
    keyRule: 'Always ensure your back rank is safeguarded by a piece, or create a flight square (Luft) with a pawn push before launching an attack.',
    xpReward: 70,
    steps: [
      {
        fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
        instruction: 'Deliver the classic back-rank checkmate!',
        explanation: 'Ra8# is checkmate! The Black King cannot move to f7, g7, or h7 because its own pawns block those squares, and no piece can block the check.',
        expectedMove: { from: 'a1', to: 'a8' },
        hint: 'Send the Rook straight to the 8th rank.',
        arrow: { from: 'a1', to: 'a8', color: '#ef4444' },
        highlightSquares: ['a8'],
      },
    ],
  },
  {
    id: 'lesson-deflection',
    title: 'Deflection & Decoy: Luring Guards Away',
    category: 'tactics-intermediate',
    tier: 2,
    difficulty: 'Intermediate',
    summary: 'Forcing a key defensive piece off the square it is currently protecting.',
    conceptIntro: `When an enemy piece is doing an important defensive job (like protecting the King or preventing a checkmate), you do not always attack it directly.
Instead, you can "Deflect" it by offering a sacrifice or threat that it cannot resist or refuse!
Once the defender moves, the square or piece it was guarding falls into your hands.`,
    keyRule: 'Identify what an enemy piece is guarding. If that piece is overworked, distract it!',
    xpReward: 75,
    steps: [
      {
        fen: '5rk1/5ppp/8/8/8/8/5PPP/1Q4K1 w - - 0 1',
        instruction: 'Black\'s Rook on f8 guards the back rank. How can White advance?',
        explanation: 'Wait, in this simplified diagram, White Queen on b1 can infiltrate or pin. But when deflection occurs, sacrificing a piece on an adjacent square pulls the guard away.',
        expectedMove: { from: 'b1', to: 'b8' },
        hint: 'Invade the back rank with Qb8, threatening mate or deflection.',
        arrow: { from: 'b1', to: 'b8', color: '#10b981' },
      },
    ],
  },

  // ================= TIER 3: STRATEGY & POSITIONAL MASTERY =================
  {
    id: 'lesson-opening-principles',
    title: 'The 3 Golden Opening Principles',
    category: 'strategy',
    tier: 3,
    difficulty: 'Beginner',
    summary: 'The universal foundations of every good chess opening: Center, Development, King Safety.',
    conceptIntro: `Beginners often ask: "Which opening move is best? Why does Magnus Carlsen play e4 or d4?"
The answer lies in the **3 Golden Principles**:
1. **Control the Center (e4, d4, e5, d5)**: The center is the high ground of the chessboard. From the center, pieces can strike in all directions twice as fast.
2. **Develop Minor Pieces (Knights & Bishops)**: Bring your pieces out to active squares. Do not move the same piece twice unless necessary, and do not bring the Queen out too early where it can get chased!
3. **King Safety (Castle Early)**: Get your King away from the explosive center behind a wall of pawns, and activate your Rook toward the central files.`,
    keyRule: 'Every opening move should do at least one of three things: fight for the center, develop a new piece, or safeguard the King.',
    xpReward: 60,
    steps: [
      {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        instruction: 'Stake an immediate claim on the center and open diagonals for your Queen and Bishop!',
        explanation: '1. e4 controls the critical d5 and f5 squares and allows both the light-squared bishop and the queen to breathe immediately.',
        expectedMove: { from: 'e2', to: 'e4' },
        hint: 'Push your King pawn two squares forward.',
        arrow: { from: 'e2', to: 'e4', color: '#10b981' },
        highlightSquares: ['e4', 'd5'],
      },
      {
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
        instruction: 'Black responded with 1...e5. Now develop a piece toward the center while attacking Black\'s e5 pawn!',
        explanation: '2. Nf3 develops a knight toward the center, attacks Black\'s e5 pawn, and prepares kingside castling. Perfect execution of opening principles!',
        expectedMove: { from: 'g1', to: 'f3' },
        hint: 'Bring your kingside knight out to f3.',
        arrow: { from: 'g1', to: 'f3', color: '#10b981' },
        highlightSquares: ['f3'],
      },
    ],
  },
  {
    id: 'lesson-outposts',
    title: 'Knight Outposts: The Monster in the Center',
    category: 'strategy',
    tier: 3,
    difficulty: 'Intermediate',
    summary: 'Placing a knight on a hole in the enemy position where enemy pawns can never chase it away.',
    conceptIntro: `An "Outpost" is a square (usually on the 4th, 5th, or 6th rank) that cannot be attacked by enemy pawns, and is protected by one of your own pawns.
A Knight anchored on an outpost is often described as worth as much as a Rook! It radiates power in 8 directions, paralyzing enemy pieces.
Grandmasters plan 10 moves ahead just to create an outpost square (by trading off defending pawns or forcing pawns to advance past it).`,
    keyRule: 'When you notice an opponent has pushed their c- and e-pawns, the d5/d4 square is a permanent "hole" (outpost) for your Knight!',
    xpReward: 80,
    steps: [
      {
        fen: 'r2q1rk1/pp2bppp/2n2n2/3p4/3N4/2N1B3/PPP2PPP/R2Q1RK1 w - - 0 11',
        instruction: 'White\'s Knight is already on d4, but can hop into the f5 outpost to menace the Black Kingside. Make the move!',
        explanation: 'Nf5 anchors the knight deep in Black\'s territory, targeting the weak dark squares and preparing kingside threats.',
        expectedMove: { from: 'd4', to: 'f5' },
        hint: 'Jump your d4 knight forward and right to f5.',
        arrow: { from: 'd4', to: 'f5', color: '#10b981' },
        highlightSquares: ['f5'],
      },
    ],
  },

  // ================= MORE ENDGAME & TACTICAL LESSONS =================
  {
    id: 'lesson-smothered-mate',
    title: 'Smothered Checkmate: Suffocated by Friends',
    category: 'tactics-intermediate',
    tier: 2,
    difficulty: 'Intermediate',
    summary: 'A king is checkmated by a single knight because its own pieces completely surround and trap it.',
    conceptIntro: `Smothered Mate is one of the most aesthetic and dramatic finishes in all of chess!
It happens when a King is completely boxed in by its own friendly pieces (usually rooks and pawns on the back rank) and cannot move.
A Knight hops in to deliver check. Because only a knight can jump over pieces, and the king has nowhere to step, it is instantaneous checkmate!`,
    keyRule: 'When you see a king trapped in the corner surrounded by its own pieces, look for a knight check or queen sacrifice to seal the trap.',
    xpReward: 85,
    steps: [
      {
        fen: '6rk/6pp/7N/8/8/8/8/7K w - - 0 1',
        instruction: 'Black king is surrounded by its rook on g8 and pawns on g7/h7. Deliver the famous smothered mate in one move!',
        explanation: 'Nf7# is checkmate! The Knight jumps to f7 and checks the King. The King cannot move anywhere because its own pawns and rook occupy every escape square.',
        expectedMove: { from: 'h6', to: 'f7' },
        hint: 'Jump the Knight from h6 into f7 right next to the King.',
        arrow: { from: 'h6', to: 'f7', color: '#ef4444' },
        highlightSquares: ['f7'],
      },
    ],
  },
  // ================= TIER 4: ESSENTIAL ENDGAMES =================
  {
    id: 'lesson-opposition',
    title: 'King Opposition: The Secret of Pawn Endgames',
    category: 'endgames',
    tier: 4,
    difficulty: 'Intermediate',
    summary: 'Standing exactly one square apart from the enemy king to force them to give way.',
    conceptIntro: `In endgames, the King transforms from a weakling that hides into an aggressive attacking piece!
The "Opposition" occurs when two kings face each other on the same rank, file, or diagonal with exactly one square between them.
The player who DOES NOT have to move is said to "have the opposition".
Why? Because the player whose turn it is must step aside, allowing the opponent's king to march forward and escort their pawn to queen!`,
    keyRule: 'Keep an odd number of squares between the kings. When you step into opposition, you force the opponent\'s king to step aside.',
    xpReward: 90,
    steps: [
      {
        fen: '8/4k3/8/8/4K3/4P3/8/8 w - - 0 1',
        instruction: 'White has the pawn on e3. Black just moved to e7. Advance your King to e5 to take the direct opposition!',
        explanation: 'By moving Ke5, White takes direct vertical opposition. Whichever square Black\'s King steps to (d7 or f7), White\'s King will advance to the opposite side (f6 or d6), escorting the e-pawn safely to the 8th rank!',
        expectedMove: { from: 'e4', to: 'e5' },
        hint: 'Step your King forward to e5, directly opposite the Black King.',
        arrow: { from: 'e4', to: 'e5', color: '#10b981' },
        highlightSquares: ['e5'],
      },
    ],
  },
  {
    id: 'lesson-lucena-bridge',
    title: 'The Lucena Position: Building the Bridge',
    category: 'endgames',
    tier: 4,
    difficulty: 'Advanced',
    summary: 'The ultimate technique to win any winning Rook and Pawn endgame by blocking checks with your rook.',
    conceptIntro: `Named after Luis Ramirez de Lucena in 1497, this is the single most important rook endgame technique ever discovered.
White has a pawn on the 7th rank (e7), but White's own King is stuck on e8 in front of the pawn!
Black's Rook cuts off the king from escaping to one side.
The winning technique is known as "Building the Bridge":
1. First, White places their Rook on the 4th rank (e.g., Rf4).
2. Then the King steps out to e7/f7.
3. When Black's Rook gives repeated checks, the White King marches down toward the 4th rank.
4. When the King reaches the 5th rank, White simply interposes their Rook (Rf4 to e4 or d4), blocking the check and guaranteeing promotion!`,
    keyRule: 'Place your rook on the 4th rank FIRST so your king has a shield to hide behind when escaping the 8th rank.',
    xpReward: 100,
    steps: [
      {
        fen: '1K6/1P1k4/8/8/8/8/r7/2R5 w - - 0 1',
        instruction: 'Prepare the bridge! Move the Rook to the 4th rank (c4) to prepare the shield for your King.',
        explanation: 'Rc4! This sets up the bridge. Once the King emerges from b8, Black\'s rook will deliver checks, and White\'s rook on the 4th rank will step in to block them!',
        expectedMove: { from: 'c1', to: 'c4' },
        hint: 'Slide the Rook along the c-file down to c4.',
        arrow: { from: 'c1', to: 'c4', color: '#10b981' },
        highlightSquares: ['c4'],
      },
    ],
  },
];
