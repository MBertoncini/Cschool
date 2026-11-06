// Named opening lines. Positions (not move orders) are matched, so transpositions are recognised.
import { Chess } from 'chess.js';
import { OPENINGS } from '../data/openings';

const LINES: [string, string][] = [
  // 1.e4 e5
  ["King's Pawn Opening", 'e4'],
  ['Open Game', 'e4 e5'],
  ["King's Knight Opening", 'e4 e5 Nf3'],
  ["King's Knight Opening: Normal Variation", 'e4 e5 Nf3 Nc6'],
  ['Ruy Lopez (Spanish Game)', 'e4 e5 Nf3 Nc6 Bb5'],
  ['Ruy Lopez: Morphy Defense', 'e4 e5 Nf3 Nc6 Bb5 a6'],
  ['Ruy Lopez: Exchange Variation', 'e4 e5 Nf3 Nc6 Bb5 a6 Bxc6'],
  ['Ruy Lopez: Morphy Defense, Main Line', 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6'],
  ['Ruy Lopez: Closed', 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7'],
  ['Ruy Lopez: Open Variation', 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Nxe4'],
  ['Ruy Lopez: Marshall Attack', 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3 d5'],
  ['Ruy Lopez: Berlin Defense', 'e4 e5 Nf3 Nc6 Bb5 Nf6'],
  ['Ruy Lopez: Steinitz Defense', 'e4 e5 Nf3 Nc6 Bb5 d6'],
  ['Ruy Lopez: Classical Defense', 'e4 e5 Nf3 Nc6 Bb5 Bc5'],
  ['Ruy Lopez: Schliemann Gambit', 'e4 e5 Nf3 Nc6 Bb5 f5'],
  ['Ruy Lopez: Bird Defense', 'e4 e5 Nf3 Nc6 Bb5 Nd4'],
  ['Italian Game', 'e4 e5 Nf3 Nc6 Bc4'],
  ['Italian Game: Giuoco Piano', 'e4 e5 Nf3 Nc6 Bc4 Bc5'],
  ['Italian Game: Giuoco Piano, Main Line', 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3'],
  ['Italian Game: Giuoco Pianissimo', 'e4 e5 Nf3 Nc6 Bc4 Bc5 d3'],
  ['Italian Game: Evans Gambit', 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4'],
  ['Italian Game: Two Knights Defense', 'e4 e5 Nf3 Nc6 Bc4 Nf6'],
  ['Two Knights Defense: Knight Attack', 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5'],
  ['Two Knights Defense: Traxler Counterattack', 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 Bc5'],
  ['Two Knights Defense: Polerio Defense', 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Na5'],
  ['Two Knights Defense: Fried Liver Attack', 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7'],
  ['Italian Game: Hungarian Defense', 'e4 e5 Nf3 Nc6 Bc4 Be7'],
  ['Italian Game: Blackburne Shilling Gambit', 'e4 e5 Nf3 Nc6 Bc4 Nd4'],
  ['Scotch Game', 'e4 e5 Nf3 Nc6 d4'],
  ['Scotch Game: Main Line', 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4'],
  ['Scotch Gambit', 'e4 e5 Nf3 Nc6 d4 exd4 Bc4'],
  ['Three Knights Opening', 'e4 e5 Nf3 Nc6 Nc3'],
  ['Four Knights Game', 'e4 e5 Nf3 Nc6 Nc3 Nf6'],
  ['Ponziani Opening', 'e4 e5 Nf3 Nc6 c3'],
  ["Petrov's Defense", 'e4 e5 Nf3 Nf6'],
  ['Philidor Defense', 'e4 e5 Nf3 d6'],
  ['Latvian Gambit', 'e4 e5 Nf3 f5'],
  ['Elephant Gambit', 'e4 e5 Nf3 d5'],
  ["King's Gambit", 'e4 e5 f4'],
  ["King's Gambit Accepted", 'e4 e5 f4 exf4'],
  ["King's Gambit Declined: Classical", 'e4 e5 f4 Bc5'],
  ['Vienna Game', 'e4 e5 Nc3'],
  ['Vienna Gambit', 'e4 e5 Nc3 Nf6 f4'],
  ['Vienna Gambit', 'e4 e5 Nc3 Nc6 f4'],
  ["Bishop's Opening", 'e4 e5 Bc4'],
  ['Center Game', 'e4 e5 d4 exd4 Qxd4'],
  ['Danish Gambit', 'e4 e5 d4 exd4 c3'],
  ['Wayward Queen Attack', 'e4 e5 Qh5'],
  ["Scholar's Mate Attempt", 'e4 e5 Qh5 Nc6 Bc4'],
  ["Scholar's Mate Attempt", 'e4 e5 Bc4 Nc6 Qh5'],
  // Sicilian
  ['Sicilian Defense', 'e4 c5'],
  ['Sicilian Defense: Open', 'e4 c5 Nf3 d6 d4 cxd4 Nxd4'],
  ['Sicilian Defense: Najdorf Variation', 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6'],
  ['Sicilian Defense: Dragon Variation', 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6'],
  ['Sicilian Defense: Scheveningen Variation', 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 e6'],
  ['Sicilian Defense: Classical Variation', 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 Nc6'],
  ['Sicilian Defense: Sveshnikov Variation', 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5'],
  ['Sicilian Defense: Accelerated Dragon', 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 g6'],
  ['Sicilian Defense: French Variation', 'e4 c5 Nf3 e6'],
  ['Sicilian Defense: Kan Variation', 'e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6'],
  ['Sicilian Defense: Taimanov Variation', 'e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6'],
  ['Sicilian Defense: Rossolimo Variation', 'e4 c5 Nf3 Nc6 Bb5'],
  ['Sicilian Defense: Moscow Variation', 'e4 c5 Nf3 d6 Bb5+'],
  ['Sicilian Defense: Closed', 'e4 c5 Nc3'],
  ['Sicilian Defense: Grand Prix Attack', 'e4 c5 Nc3 Nc6 f4'],
  ['Sicilian Defense: Alapin Variation', 'e4 c5 c3'],
  ['Sicilian Defense: Smith-Morra Gambit', 'e4 c5 d4 cxd4 c3'],
  // Other 1.e4 defenses
  ['French Defense', 'e4 e6'],
  ['French Defense: Normal Variation', 'e4 e6 d4 d5'],
  ['French Defense: Advance Variation', 'e4 e6 d4 d5 e5'],
  ['French Defense: Exchange Variation', 'e4 e6 d4 d5 exd5'],
  ['French Defense: Tarrasch Variation', 'e4 e6 d4 d5 Nd2'],
  ['French Defense: Winawer Variation', 'e4 e6 d4 d5 Nc3 Bb4'],
  ['French Defense: Classical Variation', 'e4 e6 d4 d5 Nc3 Nf6'],
  ['French Defense: Rubinstein Variation', 'e4 e6 d4 d5 Nc3 dxe4'],
  ['Caro-Kann Defense', 'e4 c6'],
  ['Caro-Kann Defense: Advance Variation', 'e4 c6 d4 d5 e5'],
  ['Caro-Kann Defense: Exchange Variation', 'e4 c6 d4 d5 exd5 cxd5'],
  ['Caro-Kann Defense: Panov-Botvinnik Attack', 'e4 c6 d4 d5 exd5 cxd5 c4'],
  ['Caro-Kann Defense: Classical Variation', 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5'],
  ['Caro-Kann Defense: Karpov Variation', 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nd7'],
  ['Scandinavian Defense', 'e4 d5'],
  ['Scandinavian Defense: Main Line', 'e4 d5 exd5 Qxd5'],
  ['Scandinavian Defense: Mieses-Kotroc Variation', 'e4 d5 exd5 Qxd5 Nc3 Qa5'],
  ['Scandinavian Defense: Modern Variation', 'e4 d5 exd5 Nf6'],
  ["Alekhine's Defense", 'e4 Nf6'],
  ['Pirc Defense', 'e4 d6'],
  ['Pirc Defense: Main Line', 'e4 d6 d4 Nf6 Nc3 g6'],
  ['Modern Defense', 'e4 g6'],
  ['Nimzowitsch Defense', 'e4 Nc6'],
  ["Owen's Defense", 'e4 b6'],
  ['St. George Defense', 'e4 a6'],
  // 1.d4
  ["Queen's Pawn Opening", 'd4'],
  ["Queen's Pawn Game", 'd4 d5'],
  ["Queen's Gambit", 'd4 d5 c4'],
  ["Queen's Gambit Accepted", 'd4 d5 c4 dxc4'],
  ["Queen's Gambit Accepted: Central Variation", 'd4 d5 c4 dxc4 e4'],
  ["Queen's Gambit Declined", 'd4 d5 c4 e6'],
  ["Queen's Gambit Declined: Classical", 'd4 d5 c4 e6 Nc3 Nf6 Bg5'],
  ['Tarrasch Defense', 'd4 d5 c4 e6 Nc3 c5'],
  ['Slav Defense', 'd4 d5 c4 c6'],
  ['Slav Defense: Main Line', 'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4'],
  ['Semi-Slav Defense', 'd4 d5 c4 c6 Nf3 Nf6 Nc3 e6'],
  ['Chigorin Defense', 'd4 d5 c4 Nc6'],
  ['Albin Countergambit', 'd4 d5 c4 e5'],
  ['Catalan Opening', 'd4 Nf6 c4 e6 g3'],
  ['Catalan Opening', 'd4 d5 c4 e6 Nf3 Nf6 g3'],
  ['London System', 'd4 d5 Bf4'],
  ['London System', 'd4 Nf6 Bf4'],
  ['London System', 'd4 d5 Nf3 Nf6 Bf4'],
  ['London System', 'd4 Nf6 Nf3 d5 Bf4'],
  ['Colle System', 'd4 d5 Nf3 Nf6 e3'],
  ['Trompowsky Attack', 'd4 Nf6 Bg5'],
  ['Indian Defense', 'd4 Nf6'],
  ['Indian Defense: Normal Variation', 'd4 Nf6 c4'],
  ['Nimzo-Indian Defense', 'd4 Nf6 c4 e6 Nc3 Bb4'],
  ["Queen's Indian Defense", 'd4 Nf6 c4 e6 Nf3 b6'],
  ['Bogo-Indian Defense', 'd4 Nf6 c4 e6 Nf3 Bb4+'],
  ["King's Indian Defense", 'd4 Nf6 c4 g6'],
  ["King's Indian Defense: Main Line", 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6'],
  ['Grünfeld Defense', 'd4 Nf6 c4 g6 Nc3 d5'],
  ['Benoni Defense', 'd4 Nf6 c4 c5'],
  ['Modern Benoni', 'd4 Nf6 c4 c5 d5 e6 Nc3 exd5 cxd5 d6'],
  ['Benko Gambit', 'd4 Nf6 c4 c5 d5 b5'],
  ['Budapest Gambit', 'd4 Nf6 c4 e5'],
  ['Old Indian Defense', 'd4 Nf6 c4 d6'],
  ['Old Benoni Defense', 'd4 c5'],
  ['Dutch Defense', 'd4 f5'],
  ['Englund Gambit', 'd4 e5'],
  // Flank openings
  ['English Opening', 'c4'],
  ['English Opening: Reversed Sicilian', 'c4 e5'],
  ['English Opening: Symmetrical Variation', 'c4 c5'],
  ['English Opening: Anglo-Indian Defense', 'c4 Nf6'],
  ['Zukertort Opening', 'Nf3'],
  ['Réti Opening', 'Nf3 d5 c4'],
  ["King's Indian Attack", 'Nf3 d5 g3'],
  ["Bird's Opening", 'f4'],
  ['Nimzo-Larsen Attack', 'b3'],
  ['Hungarian Opening', 'g3'],
  ['Van Geet Opening', 'Nc3'],
  ['Polish Opening', 'b4'],
];

interface BookEntry {
  name: string; // name of this exact position, or inherited from the closest named ancestor
  named: boolean;
}

let book: Map<string, BookEntry> | null = null;

export function positionKey(fen: string): string {
  return fen.split(' ').slice(0, 3).join(' ');
}

function buildBook(): Map<string, BookEntry> {
  const map = new Map<string, BookEntry>();
  const add = (name: string, sans: string[]) => {
    const g = new Chess();
    let inherited = name;
    sans.forEach((san, i) => {
      try {
        g.move(san);
      } catch {
        return;
      }
      const key = positionKey(g.fen());
      const isLast = i === sans.length - 1;
      const existing = map.get(key);
      if (isLast) {
        if (!existing || !existing.named) map.set(key, { name, named: true });
      } else if (!existing) {
        map.set(key, { name: inherited, named: false });
      } else {
        inherited = existing.name;
      }
    });
  };
  // Shorter lines first so prefixes get their proper names before deeper lines inherit them
  [...LINES].sort((a, b) => a[1].split(' ').length - b[1].split(' ').length).forEach(([n, l]) => add(n, l.split(' ')));
  // Also the repertoire taught in the Openings tab
  OPENINGS.forEach((o) => add(o.name, o.moves.map((m) => m.san)));
  return map;
}

export function lookupBook(fen: string): BookEntry | undefined {
  if (!book) book = buildBook();
  return book.get(positionKey(fen));
}

/** Name of the opening reached by a game (deepest recognised position in the first 30 plies). */
export function detectOpening(movesSan: string[]): { name: string; lastBookPly: number } | null {
  const g = new Chess();
  let found: { name: string; lastBookPly: number } | null = null;
  for (let i = 0; i < Math.min(movesSan.length, 30); i++) {
    try {
      g.move(movesSan[i]);
    } catch {
      break;
    }
    const entry = lookupBook(g.fen());
    if (entry) found = { name: entry.name, lastBookPly: i + 1 };
  }
  return found;
}
