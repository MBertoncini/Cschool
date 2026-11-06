# ♟️ ChessMaster Academy — Learn Chess from Beginner to Grandmaster

> **Designed specifically for beginners who know how the pieces move, but want to understand *why* Grandmasters make the moves they make.**

An interactive, responsive chess learning platform built to run 100% client-side with zero external server dependencies, perfectly suited for **GitHub Pages**.

---

## 🌟 Key Features

### 👑 1. The Grandmaster Decoder ("Why GMs Play What They Play")
* Move-by-move interactive breakdown of legendary masterpieces:
  * **The Opera Game (1858)** — Paul Morphy's masterclass in piece development, initiative, and sacrificing material for checkmate.
  * **Fischer vs Spassky (1972, Game 6)** — Bobby Fischer's legendary English Opening surprise and positional squeeze.
* Every move features:
  * **Plain-English explanation** answering: *"Why was this move played?"*
  * **Beginner Instinct Trap**: Explains why tempting beginner moves (e.g. greedily grabbing a pawn or moving the same piece twice) would fail.
  * **Core Principle**: Identifies the lasting chess principle illustrated on the board.
  * Visual threat and target arrows.

### 🎓 2. Interactive Academy & Skill Tree
* **Tier 1: Basic Tactics** — The Fork, The Pin, The Skewer, Discovered Attacks.
* **Tier 2: Intermediate Motifs** — Back-Rank Checkmates, Deflection & Decoys, Smothered Mate.
* **Tier 3: Positional Strategy** — The 3 Golden Opening Principles, Knight Outposts, Open Files.
* **Tier 4: Essential Endgames** — King Opposition, The Lucena Position ("Building the Bridge").
* Hands-on board exercises with move validation, coach hints, and instant feedback.

### 📖 3. Openings Repertoire & Trainer
* Deep strategic plans for classic openings: **Ruy Lopez (Spanish)**, **Italian Game (Giuoco Piano)**, **Sicilian Defense**, and **Queen's Gambit**.
* Detailed **White's Plan**, **Black's Plan**, and **Common Pitfalls**.
* **Memory Trainer Mode**: The app plays the theoretical responses while you play the correct moves from memory.

### 🧩 4. Tactical Puzzle Arena
* Puzzles graded by difficulty and categorized by tactical motif.
* Dynamic **Tactics Rating** and **Streak Counter**.
* Hints that guide your calculation without spoiling the answer.

### 🤖 5. Play Against 5 AI Bots (Elo 400 to 2100+)
* 🧸 **Pawn Pal (Elo 400)**: Casual beginner, hangs pieces, perfect for your first wins.
* 🐱 **Coffeehouse Cat (Elo 800)**: Aggressive gambler, loves early attacks, forgets king safety.
* 🛡️ **Shield Knight (Elo 1200)**: Solid club player, castles early, punishes tactical mistakes.
* 🦉 **Professor Bishop (Elo 1600)**: Expert positional player, exploits pawn weaknesses.
* 🦁 **Grandmaster Magnus (Elo 2100+)**: Minimax calculation with alpha-beta pruning and positional piece-square evaluation.
* Features: **Live Coach Hints ("Why is this good?")**, **Undo**, **Visual Evaluation Bar (-10 to +10)**, and funny in-character bot commentary.

### 📊 6. Progress Memory (localStorage)
* Automatically remembers your progress in your browser without requiring a backend account:
  * User Level & XP
  * Completed lessons & mastered concepts
  * Solved puzzles & tactical rating
  * Win/loss records against each bot
  * 8 Unlockable Achievements & Badges

### 🔊 7. Synthesized Sound Effects (Zero External Asset Dependency)
* Pure Web Audio API synthesis for wooden piece moves, captures, check alerts, and victory fanfares.
* 100% reliable offline and over GitHub Pages (no broken audio links).

---

## 🚀 How to Deploy to GitHub Pages

### Automatic Deployment (Recommended):
1. Create a repository on GitHub (e.g. `cschool` or `chessmaster`).
2. Push this project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of ChessMaster Academy"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
3. In your GitHub repository:
   * Go to **Settings** > **Pages**.
   * Under **Build and deployment** > **Source**, choose **GitHub Actions**.
4. The included `.github/workflows/deploy.yml` workflow will automatically build and publish your app. Your site will be live at:
   `https://<your-username>.github.io/<your-repo-name>/`

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Build for production (outputs to /dist)
npm run build
```

---

## 🛠️ Built With
* [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* [Vite](https://vite.dev/) (fast bundler with relative base paths for static hosting)
* [Chess.js](https://github.com/jhlywa/chess.js) (rules engine, legal move calculation, FEN/PGN)
* [Tailwind CSS](https://tailwindcss.com/) (modern responsive UI styling)
* [Lucide React](https://lucide.dev/) (clean vector icons)
* [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) (celebratory particle effects)
* Web Audio API (native browser sound synthesis)
