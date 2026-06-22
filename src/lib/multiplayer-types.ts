import type { Attribute, Country } from "./countries";
import type { LeaderId } from "./leaders";

export interface RoomPlayer {
  id: string;            // uuid
  room_id: string;
  player_id: string;     // client-generated id
  name: string;
  leader_id: LeaderId;
  is_ready: boolean;
  is_host: boolean;
  joined_at: string;
}

export interface MPPlayer {
  playerId: string;
  name: string;
  leaderId: LeaderId;
  deckIds: number[];     // country IDs (order = hand order)
  score: number;
}

export interface MPRoundResult {
  attribute: Attribute;
  reveals: { playerId: string; cardId: number }[];
  winnerId: string | null;
}

export interface MPGameState {
  phase: "choosing" | "revealing" | "finished";
  currentPlayerId: string;
  roundNumber: number;
  players: MPPlayer[];
  pot: number[];           // country IDs in pot
  lastRound: MPRoundResult | null;
  winnerId: string | null;
  revealAttribute: Attribute | null;
}

export interface Room {
  id: string;
  code: string;
  host_id: string;
  status: "lobby" | "playing" | "finished";
  game_state: MPGameState | null;
  created_at: string;
}
