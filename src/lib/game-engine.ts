import { ATTRIBUTES, COUNTRIES, type Attribute, type Country } from "./countries";
import type { LeaderId } from "./leaders";

export interface Player {
  id: string;
  name: string;
  leaderId: LeaderId;
  isBot: boolean;
  deck: Country[]; // cards in hand (front = index 0)
  score: number; // round wins
}

export interface RoundResult {
  attribute: Attribute;
  reveals: { playerId: string; card: Country }[];
  winnerId: string | null; // null = tie
  tiePot: Country[]; // cards added to pot
}

export type Phase = "idle" | "choosing" | "revealing" | "resolving" | "ended";

export interface GameState {
  players: Player[];
  currentPlayerId: string;
  phase: Phase;
  pot: Country[]; // cards in dispute from previous tie
  lastRound: RoundResult | null;
  roundNumber: number;
  winnerId: string | null;
  revealAttribute: Attribute | null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function dealGame(players: Omit<Player, "deck" | "score">[]): GameState {
  const deck = shuffle(COUNTRIES);
  const perPlayer = Math.floor(deck.length / players.length);
  const dealt: Player[] = players.map((p, i) => ({
    ...p,
    deck: deck.slice(i * perPlayer, (i + 1) * perPlayer),
    score: 0,
  }));
  return {
    players: dealt,
    currentPlayerId: dealt[0].id,
    phase: "choosing",
    pot: [],
    lastRound: null,
    roundNumber: 1,
    winnerId: null,
    revealAttribute: null,
  };
}

export function compareAttribute(
  attribute: Attribute,
  players: Player[],
): { winnerId: string | null } {
  const alive = players.filter((p) => p.deck.length > 0);
  if (alive.length === 0) return { winnerId: null };
  // Super Trunfo wins automatically regardless of attribute
  const superTrunfos = alive.filter((p) => p.deck[0].isSuperTrunfo);
  if (superTrunfos.length === 1) return { winnerId: superTrunfos[0].id };
  if (superTrunfos.length > 1) return { winnerId: null }; // tie between super cards
  const attrDef = ATTRIBUTES.find((a) => a.key === attribute)!;
  const values = alive.map((p) => ({ id: p.id, v: p.deck[0][attribute] as number }));
  const best = attrDef.higherIsBetter
    ? Math.max(...values.map((x) => x.v))
    : Math.min(...values.map((x) => x.v));
  const winners = values.filter((x) => x.v === best);
  return { winnerId: winners.length === 1 ? winners[0].id : null };
}

export function playRound(state: GameState, attribute: Attribute): GameState {
  const alive = state.players.filter((p) => p.deck.length > 0);
  const reveals = alive.map((p) => ({ playerId: p.id, card: p.deck[0] }));
  const stakeCards = reveals.map((r) => r.card);
  const { winnerId } = compareAttribute(attribute, state.players);

  const newPlayers = state.players.map((p) => ({
    ...p,
    deck: p.deck.slice(1), // remove top card
  }));

  let newPot: Country[] = [];
  if (winnerId === null) {
    // tie: cards into pot
    newPot = [...state.pot, ...stakeCards];
  } else {
    // winner takes pot + revealed
    const taken = shuffle([...state.pot, ...stakeCards]);
    const w = newPlayers.find((p) => p.id === winnerId)!;
    w.deck = [...w.deck, ...taken];
    w.score += 1;
  }

  // determine next player
  const remainingPlayers = newPlayers.filter((p) => p.deck.length > 0);
  let nextId = state.currentPlayerId;
  if (winnerId && remainingPlayers.some((p) => p.id === winnerId)) {
    nextId = winnerId;
  } else if (!remainingPlayers.some((p) => p.id === nextId)) {
    nextId = remainingPlayers[0]?.id ?? state.currentPlayerId;
  }

  const gameWinner =
    remainingPlayers.length === 1 ? remainingPlayers[0].id : null;

  return {
    players: newPlayers,
    currentPlayerId: nextId,
    phase: gameWinner ? "ended" : "choosing",
    pot: newPot,
    lastRound: {
      attribute,
      reveals,
      winnerId,
      tiePot: winnerId === null ? newPot : [],
    },
    roundNumber: state.roundNumber + 1,
    winnerId: gameWinner,
    revealAttribute: null,
  };
}

/** Bot picks the attribute on which it has the best margin vs opponents. */
export function botPickAttribute(state: GameState, botId: string): Attribute {
  const bot = state.players.find((p) => p.id === botId)!;
  const myCard = bot.deck[0];
  if (!myCard) return "pib";
  const opponents = state.players.filter(
    (p) => p.id !== botId && p.deck.length > 0,
  );
  let bestAttr: Attribute = "pib";
  let bestScore = -Infinity;
  for (const a of ATTRIBUTES) {
    const myVal = myCard[a.key];
    const wins = opponents.filter((o) => {
      const ov = o.deck[0][a.key];
      return a.higherIsBetter ? myVal > ov : myVal < ov;
    }).length;
    const ties = opponents.filter((o) => o.deck[0][a.key] === myVal).length;
    const score = wins * 10 - ties * 2;
    if (score > bestScore) {
      bestScore = score;
      bestAttr = a.key;
    }
  }
  return bestAttr;
}