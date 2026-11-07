# ChessMaster Academy — Classical Mastery & Grandmaster Intuition

ChessMaster Academy is a client-side chess learning and analysis application designed for offline use and static hosting (such as GitHub Pages). It features an interactive Grandmaster Game Decoder, structured curriculum lessons, opening repertoire explorer, tactical puzzle arena, Stockfish engine review, and calibrated sparring engines.

---

## Architectural Features

### 1. The Grandmaster Decoder ("Why GMs Play What They Play")
* Move-by-move interactive breakdown of historical master games (Morphy's Opera Game, Byrne vs Fischer, Kasparov vs Topalov).
* Plain-language tactical commentary explaining *why* the grandmaster played a move instead of an instinctive beginner choice.
* Highlights calculated threats, prophylaxis, and critical turning points.

### 2. Interactive Academy & Skill Tree
* Guided hands-on board exercises across 4 tiers:
  1. Foundational tactics (Forks, Pins, Skewers, Discovered Attacks)
  2. Intermediate tactics (Deflection, Decoy, Overloading, Trapping)
  3. Strategic principles (Weak squares, Pawn structures, Good vs Bad Bishops)
  4. Essential endgames (King opposition, Rook cut-offs, Lucena & Philidor concepts)
* Instant feedback, progressive hints, and XP mastery tracking.

### 3. Openings Repertoire & Trainer
* Interactive studies of foundational openings (Italian Game, Ruy Lopez, Sicilian Defense, Queen's Gambit, French Defense).
* Interactive Memory Trainer where you play opening moves from memory and receive immediate verification.

### 4. Tactical Puzzle Arena
* Calibrated tactical puzzles filtered by motif (Forks, Pins, Skewers, Back-Rank Mates, Discovered Attacks).
* Adaptive tactics rating tracking with streak recording.

### 5. Sparring Engines (Elo 400 to 2100+)
* Five distinct personalities:
  * **Pawn Pal (Elo 400)**: Casual beginner, leaves pieces en prise, perfect for foundational practice.
  * **Coffeehouse Tactician (Elo 800)**: Swashbuckling gambler, sacrifices material, neglects king security.
  * **Shield Sentinel (Elo 1200)**: Disciplined defender, castles early, punishes tactical lapses.
  * **Professor Lasker (Elo 1600)**: Positional strategist, targets color complexes and pawn weaknesses.
  * **Grandmaster Magnus (Elo 2100+)**: Minimax calculation with alpha-beta pruning and deep endgame technique.

### 6. Local & Cloud Sync
* Complete progress and match archives stored locally in browser `localStorage`.
* Optional private GitHub Gist sync for cross-device match history.

### 7. Synthesized Sound Effects
* Procedural Web Audio API sound synthesis with zero external audio assets required.

---

## Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build production bundle
npm run build
```

## Design System
* **Craftsman Wooden Palette**: Handcrafted walnut and boxwood board, dark timber backgrounds, and polished brass inlays.
* **Neuromorphic Tactile Controls**: Debossed wells, convex extruded buttons, dual-shadow ambient lighting, and beveled chamfers.
