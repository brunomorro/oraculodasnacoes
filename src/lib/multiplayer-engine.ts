import { ATTRIBUTES, COUNTRIES, type Attribute } from "./countries";
import type { MPGameState, MPPlayer, RoomPlayer } from "./multiplayer-types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function dealMultiplayerGame(roomPlayers: RoomPlayer[]): MPGameState {
  const ids = shuffle(COUNTRIES.map((c) => c.id));
  const n = roomPlayers.length;
  const perPlayer = Math.floor(ids.length / n);

  const players: MPPlayer[] = roomPlayers.map((rp, i) => ({
    playerId: rp.player_id,
    name: rp.name,
    leaderId: rp.leader_id,
    deckIds: ids.slice(i * perPlayer, (i + 1) * perPlayer),
    score: 0,
  }));

  return {
    phase: "choosing",
    currentPlayerId: players[0].playerId,
    roundNumber: 1,
    players,
    pot: [],
    lastRound: null,
    winnerId: null,
    revealAttribute: null,
  };
}

export function resolveRound(state: MPGameState, attribute: Attribute): MPGameState {
  const attrDef = ATTRIBUTES.find((a) => a.key === attribute)!;
  const alive = state.players.filter((p) => p.deckIds.length > 0);

  const reveals = alive.map((p) => ({
    playerId: p.playerId,
    cardId: p.deckIds[0],
  }));

  // Super Trunfo wins automatically
  const superTrunfos = reveals.filter((r) => COUNTRIES.find((c) => c.id === r.cardId)?.isSuperTrunfo);
  let winnerId: string | null;
  if (superTrunfos.length === 1) {
    winnerId = superTrunfos[0].playerId;
  } else if (superTrunfos.length > 1) {
    winnerId = null;
  } else {
    const values = reveals.map((r) => ({
      playerId: r.playerId,
      v: COUNTRIES.find((c) => c.id === r.cardId)![attribute] as number,
    }));
    const best = attrDef.higherIsBetter
      ? Math.max(...values.map((x) => x.v))
      : Math.min(...values.map((x) => x.v));
    const winners = values.filter((x) => x.v === best);
    winnerId = winners.length === 1 ? winners[0].playerId : null;
  }

  const stakeIds = reveals.map((r) => r.cardId);
  const newPot = [...state.pot, ...stakeIds];

  const newPlayers = state.players.map((p) => {
    const played = alive.find((a) => a.playerId === p.playerId);
    if (!played) return p;
    const withoutTop = p.deckIds.slice(1);
    if (winnerId === p.playerId) {
      return { ...p, deckIds: [...withoutTop, ...newPot], score: p.score + 1 };
    }
    return { ...p, deckIds: withoutTop };
  });

  const stillAlive = newPlayers.filter((p) => p.deckIds.length > 0);
  const gameWinnerId = stillAlive.length === 1 ? stillAlive[0].playerId : null;

  // Next player: find next alive after current
  const currentIndex = newPlayers.findIndex((p) => p.playerId === state.currentPlayerId);
  let nextPlayerId = state.currentPlayerId;
  for (let i = 1; i <= newPlayers.length; i++) {
    const candidate = newPlayers[(currentIndex + i) % newPlayers.length];
    if (candidate.deckIds.length > 0) {
      nextPlayerId = candidate.playerId;
      break;
    }
  }

  return {
    phase: gameWinnerId ? "finished" : "choosing",
    currentPlayerId: nextPlayerId,
    roundNumber: state.roundNumber + 1,
    players: newPlayers,
    pot: winnerId ? [] : newPot,
    lastRound: { attribute, reveals, winnerId },
    winnerId: gameWinnerId,
    revealAttribute: null,
  };
}
