import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  botPickAttribute,
  dealGame,
  playRound,
  type GameState,
  type Player,
} from "./game-engine";
import type { Attribute } from "./countries";
import { LEADERS, type LeaderId } from "./leaders";

interface ProfileState {
  playerName: string;
  leaderId: LeaderId;
  xp: number;
  wins: number;
  losses: number;
  setProfile: (p: Partial<Pick<ProfileState, "playerName" | "leaderId">>) => void;
  addResult: (won: boolean, xp: number) => void;
}

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      playerName: "Você",
      leaderId: "archer",
      xp: 0,
      wins: 0,
      losses: 0,
      setProfile: (p) => set(p),
      addResult: (won, xp) =>
        set((s) => ({
          xp: s.xp + xp,
          wins: s.wins + (won ? 1 : 0),
          losses: s.losses + (won ? 0 : 1),
        })),
    }),
    {
      name: "macro-trunfo-profile",
      onRehydrateStorage: () => (state) => {
        if (state && !LEADERS.find((l) => l.id === state.leaderId)) {
          state.leaderId = "archer";
        }
      },
    },
  ),
);

interface GameStore {
  state: GameState | null;
  startGame: (
    humanName: string,
    humanLeader: LeaderId,
    botCount: number,
  ) => void;
  play: (attribute: Attribute) => void;
  reset: () => void;
}

const BOT_NAMES = [
  "Voss",
  "Wei",
  "Mercier",
  "Volkov",
  "Solano",
  "Tanaka",
  "Hale",
];

// Incremented on every startGame/reset to invalidate stale async callbacks
// from the previous game (play's 3800ms timeout + maybeBotTurn's 400ms timeout).
let _gameGen = 0;

export const useGame = create<GameStore>((set, get) => ({
  state: null,
  startGame: (humanName, humanLeader, botCount) => {
    _gameGen++; // invalidate any pending timeouts from the previous game
    const usedLeaders = new Set<LeaderId>([humanLeader]);
    const botLeaderPool = LEADERS.filter((l) => l.id !== humanLeader);
    const players: Omit<Player, "deck" | "score">[] = [
      {
        id: "human",
        name: humanName || "Você",
        leaderId: humanLeader,
        isBot: false,
      },
    ];
    for (let i = 0; i < botCount; i++) {
      const l = botLeaderPool[i % botLeaderPool.length];
      usedLeaders.add(l.id);
      players.push({
        id: `bot-${i}`,
        name: BOT_NAMES[i % BOT_NAMES.length],
        leaderId: l.id,
        isBot: true,
      });
    }
    set({ state: dealGame(players) });
  },
  play: (attribute) => {
    const s = get().state;
    if (!s) return;
    set({ state: { ...s, phase: "revealing" } });
    const gen = _gameGen;
    setTimeout(() => {
      if (_gameGen !== gen) return; // game was reset or restarted — discard
      const next = playRound(s, attribute);
      set({ state: next });
      maybeBotTurn(gen);
    }, 3800);
  },
  reset: () => {
    _gameGen++;
    set({ state: null });
  },
}));

function maybeBotTurn(gen = _gameGen) {
  setTimeout(() => {
    if (_gameGen !== gen) return; // game was reset or restarted — discard
    const s = useGame.getState().state;
    if (!s || s.phase !== "choosing" || s.winnerId) return;
    const current = s.players.find((p) => p.id === s.currentPlayerId);
    if (!current?.isBot) return;
    const attr = botPickAttribute(s, current.id);
    useGame.getState().play(attr);
  }, 400);
}

export { maybeBotTurn };