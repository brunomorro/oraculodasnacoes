import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Eye, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CardBack, CountryCard } from "@/components/CountryCard";
import { LeaderBadge } from "@/components/LeaderBadge";
import { MapBackground } from "@/components/MapBackground";
import { COUNTRIES, type Attribute } from "@/lib/countries";
import { supabase } from "@/lib/supabase";
import { resolveRound } from "@/lib/multiplayer-engine";
import type { MPGameState, MPPlayer, Room } from "@/lib/multiplayer-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/multiplayer/$code")({
  head: () => ({ meta: [{ title: "Partida Online · Oráculo das Nações" }] }),
  component: MultiplayerGame,
});

function getBotPositions(n: number): { left: number; top: number }[] {
  const gap = n <= 3 ? 90 : n <= 5 ? 70 : 50;
  const startClock = 180 + gap;
  const totalArc = 360 - 2 * gap;
  const r = 46;
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const deg = startClock + t * totalArc;
    const rad = (deg * Math.PI) / 180;
    return { left: 50 + r * Math.sin(rad), top: 50 - r * Math.cos(rad) };
  });
}

function MultiplayerGame() {
  const { code } = Route.useParams();
  const navigate = useNavigate();

  const playerId = sessionStorage.getItem("mp_player_id") ?? "";
  const [room, setRoom] = useState<Room | null>(null);
  const [gs, setGs] = useState<MPGameState | null>(null);
  const [revealing, setRevealing] = useState(false);

  // Refs to prevent double-pick and stale closure bugs
  const gsRef = useRef<MPGameState | null>(null);
  const roomRef = useRef<Room | null>(null);
  const pickedRef = useRef(false);
  const revealTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("rooms").select("*").eq("code", code).single();
      if (!data) { navigate({ to: "/" }); return; }
      setRoom(data);
      roomRef.current = data;
      if (data.game_state) {
        setGs(data.game_state);
        gsRef.current = data.game_state;
      }
    }
    load();

    const channel = supabase
      .channel(`mp-game-${code}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${code}` },
        (payload) => {
          const updated = payload.new as Room;
          setRoom(updated);
          roomRef.current = updated;
          if (updated.game_state) {
            setGs(updated.game_state);
            gsRef.current = updated.game_state;
            // Reset pick lock when new round starts
            if (updated.game_state.phase === "choosing") {
              pickedRef.current = false;
            }
            if (updated.game_state.phase === "revealing") {
              setRevealing(true);
              if (revealTimeout.current) clearTimeout(revealTimeout.current);
              revealTimeout.current = setTimeout(() => setRevealing(false), 3200);
            }
          }
          if (updated.status === "finished") {
            setTimeout(() => navigate({ to: "/" }), 4000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (revealTimeout.current) clearTimeout(revealTimeout.current);
    };
  }, [code, navigate]);

  const pickAttribute = useCallback(async (attr: Attribute) => {
    const currentGs = gsRef.current;
    const currentRoom = roomRef.current;
    if (!currentGs || !currentRoom) return;
    if (currentGs.currentPlayerId !== playerId) return;
    if (currentGs.phase !== "choosing") return;
    if (pickedRef.current) return; // prevent double-fire
    pickedRef.current = true;

    // Write revealing phase immediately so all players see it
    const revealingState: MPGameState = { ...currentGs, phase: "revealing" };
    await supabase.from("rooms").update({ game_state: revealingState }).eq("id", currentRoom.id);

    // Resolve after delay
    setTimeout(async () => {
      const next = resolveRound(currentGs, attr);
      const status = next.winnerId ? "finished" : "playing";
      await supabase.from("rooms").update({ game_state: next, status }).eq("id", currentRoom.id);
    }, 3000);
  }, [playerId]);

  if (!gs) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-gold font-display text-2xl animate-pulse">Conectando…</div>
    </div>
  );

  const me = gs.players.find((p) => p.playerId === playerId);
  const others = gs.players.filter((p) => p.playerId !== playerId);
  const isMyTurn = gs.currentPlayerId === playerId;
  const myCard = me && me.deckIds.length > 0 ? COUNTRIES.find((c) => c.id === me.deckIds[0]) : null;
  const canPlay = isMyTurn && gs.phase === "choosing" && !gs.winnerId && !pickedRef.current;
  const isSpectating = me ? me.deckIds.length === 0 && !gs.winnerId : false;
  const currentPlayer = gs.players.find((p) => p.playerId === gs.currentPlayerId);
  const otherPositions = getBotPositions(others.length);
  const ovalWidth = "min(98vw, calc((100dvh - 300px) * 2.8))";

  return (
    <div className="relative h-screen overflow-hidden flex flex-col select-none">
      <MapBackground />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-4 pt-3 pb-2 shrink-0 h-12">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate({ to: "/" })}
            className="flex items-center gap-1.5 text-[11px] font-sans uppercase tracking-widest text-muted-foreground hover:text-gold transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Sair
          </button>
        </div>
        <div className="flex items-center gap-2">
          <MPLeaderBoard players={gs.players} myPlayerId={playerId} />
        </div>
      </header>

      {/* Game area */}
      <div className="relative z-10 flex-1 min-h-0 flex items-center justify-center pt-2 pb-[72px]">
        <div className="relative" style={{ width: ovalWidth, aspectRatio: "2.8 / 1" }}>

          {/* Oval */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: "50%",
              background: "radial-gradient(ellipse at 50% 50%, oklch(0.22 0.07 255 / 0.48), oklch(0.14 0.05 255 / 0.06))",
              border: "1.5px solid oklch(0.80 0.14 85 / 0.35)",
              boxShadow: "0 0 0 3px oklch(0.80 0.14 85 / 0.06), inset 0 0 80px -30px oklch(0.80 0.14 85 / 0.10)",
            }}
          />

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span
              className="font-display font-semibold leading-tight tracking-wide text-gold-gradient whitespace-nowrap"
              style={{ fontSize: "clamp(12px, 2.4vw, 28px)", opacity: 0.45 }}
            >
              Oráculo das Nações
            </span>
          </div>

          {/* Spectator banner */}
          <AnimatePresence>
            {isSpectating && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-[8%] left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-accent/25 border border-accent/50 px-4 py-1.5 text-[11px] font-sans uppercase tracking-widest text-accent backdrop-blur-sm whitespace-nowrap"
              >
                <Eye className="h-3 w-3" /> Você foi eliminado — Assistindo
              </motion.div>
            )}
          </AnimatePresence>

          {/* Other players around the oval */}
          {others.map((player, i) => {
            const pos = otherPositions[i];
            const eliminated = player.deckIds.length === 0 && !gs.winnerId;
            const isActive = gs.currentPlayerId === player.playerId;
            return (
              <div
                key={player.playerId}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
              >
                <OtherPlayerBlock
                  player={player}
                  isActive={isActive}
                  eliminated={eliminated}
                  gameWinnerId={gs.winnerId ?? null}
                  size={others.length <= 4 ? "lg" : "md"}
                />
              </div>
            );
          })}

          {/* My seat — bottom, same style as HumanBlock in play.tsx */}
          {me && (
            <div
              className="absolute left-1/2 z-10"
              style={{ bottom: 0, transform: "translateX(-50%) translateY(58%)" }}
            >
              <MyBlock
                player={me}
                isMyTurn={isMyTurn}
                phase={gs.phase}
                gameWinnerId={gs.winnerId ?? null}
                onSelectAttribute={pickAttribute}
                isSpectating={isSpectating}
              />
            </div>
          )}

          {/* Center — comparison cards */}
          <div className="absolute inset-[20%] z-20 flex flex-col items-center justify-center gap-2 pointer-events-none overflow-hidden">
            <AnimatePresence mode="wait">
              {gs.lastRound && (revealing || gs.phase === "revealing") ? (
                <motion.div
                  key={"cmp-" + gs.roundNumber}
                  initial={{ opacity: 0, scale: 0.88, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.75, transition: { duration: 0.28 } }}
                  transition={{ type: "spring", stiffness: 240, damping: 22 }}
                  className="flex flex-col items-center gap-1.5 w-full"
                >
                  {(() => {
                    const reveals = gs.lastRound!.reveals;
                    const n = reveals.length;
                    const ovalPx = Math.min(window.innerWidth * 0.98, (window.innerHeight - 300) * 2.8);
                    const centerW = ovalPx * 0.60;
                    const neededW = n * 130 + (n - 1) * 6;
                    const scale = Math.min(1, centerW / neededW);
                    return (
                      <div style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
                        <div className="flex flex-nowrap items-end justify-center gap-1.5">
                          {reveals.map((r, idx) => {
                            const country = COUNTRIES.find((c) => c.id === r.cardId)!;
                            const isW = r.playerId === gs.lastRound!.winnerId;
                            const isL = gs.lastRound!.winnerId !== null && !isW;
                            return (
                              <CountryCard
                                key={r.playerId}
                                country={country}
                                highlightedAttr={gs.lastRound!.attribute}
                                isWinner={isW}
                                isLoser={isL}
                                size="sm"
                                flipIn
                                revealDelay={0.08 * idx}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              ) : (
                <motion.div
                  key="info"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2"
                >
                  {gs.winnerId && (
                    <div className="flex flex-col items-center gap-2">
                      <Crown className="h-10 w-10 text-gold" />
                      <div className="font-display text-2xl text-gold-gradient">
                        {gs.winnerId === playerId
                          ? "Você venceu!"
                          : `${gs.players.find((p) => p.playerId === gs.winnerId)?.name} venceu!`}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Round result — bottom left */}
      <AnimatePresence>
        {gs.lastRound && gs.phase === "choosing" && (
          <motion.div
            key={"result-" + gs.roundNumber}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16, transition: { duration: 0.22 } }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed bottom-6 left-5 z-30 pointer-events-none"
          >
            <div className={cn(
              "rounded-2xl px-5 py-2.5 backdrop-blur-md border font-sans text-base font-bold tracking-wide",
              gs.lastRound.winnerId === playerId
                ? "bg-positive/20 border-positive/50 text-positive"
                : gs.lastRound.winnerId === null
                  ? "bg-accent/20 border-accent/50 text-accent"
                  : "bg-negative/20 border-negative/50 text-negative",
            )}>
              {gs.lastRound.winnerId === null
                ? "Empate"
                : gs.lastRound.winnerId === playerId
                  ? "Você venceu!"
                  : `${gs.players.find((p) => p.playerId === gs.lastRound!.winnerId)?.name} venceu`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Turn hint — bottom right */}
      <AnimatePresence>
        {gs.phase === "choosing" && !gs.winnerId && !isSpectating && (
          <motion.div
            key={isMyTurn ? "my-turn" : "other-turn"}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-5 z-30 pointer-events-none"
          >
            <div className={cn(
              "rounded-2xl px-5 py-2.5 backdrop-blur-md border font-sans text-base font-bold tracking-wide",
              isMyTurn
                ? "bg-gold/15 border-gold/50 text-gold"
                : "bg-muted/10 border-muted/30 text-muted-foreground/60",
            )}>
              {isMyTurn ? "Escolha um atributo" : `Vez de ${currentPlayer?.name}`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Other player seat — same as BotBlock in play.tsx
function OtherPlayerBlock({
  player,
  isActive,
  eliminated,
  gameWinnerId,
  size,
}: {
  player: MPPlayer;
  isActive: boolean;
  eliminated: boolean;
  gameWinnerId: string | null;
  size: "sm" | "md" | "lg";
}) {
  const hasCard = !eliminated && player.deckIds.length > 0;
  return (
    <div className={cn("flex flex-col items-center gap-1", eliminated && "opacity-40")}>
      <LeaderBadge
        leaderId={player.leaderId}
        name={player.name}
        cardsLeft={player.deckIds.length}
        active={isActive}
        winner={gameWinnerId === player.playerId}
        size={size}
      />
      {hasCard && (
        <AnimatePresence mode="wait">
          <motion.div
            key={player.deckIds.length > 0 ? "has" : "empty"}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardBack size="sm" />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// My seat — same as HumanBlock in play.tsx
function MyBlock({
  player,
  isMyTurn,
  phase,
  gameWinnerId,
  onSelectAttribute,
  isSpectating,
}: {
  player: MPPlayer;
  isMyTurn: boolean;
  phase: string;
  gameWinnerId: string | null;
  onSelectAttribute: (a: Attribute) => void;
  isSpectating: boolean;
}) {
  const hasCard = player.deckIds.length > 0;
  const myCard = hasCard ? COUNTRIES.find((c) => c.id === player.deckIds[0]) : null;
  const canPlay = isMyTurn && phase === "choosing" && !gameWinnerId && !isSpectating;

  return (
    <div className={cn("flex flex-row items-end gap-3", isSpectating && "opacity-50")}>
      {/* Avatar */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <LeaderBadge
          leaderId={player.leaderId}
          name={player.name}
          cardsLeft={player.deckIds.length}
          active={isMyTurn && !isSpectating}
          winner={gameWinnerId === player.playerId}
          size="md"
        />
        <AnimatePresence>
          {isMyTurn && !isSpectating && (
            <motion.div
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 3 }}
              className="rounded-full bg-gold/15 border border-gold/40 px-3 py-0.5 text-[10px] font-sans uppercase tracking-[0.3em] text-gold whitespace-nowrap"
            >
              Sua vez
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Deck + active card */}
      {hasCard && myCard && (
        <div className="flex items-end gap-2">
          {player.deckIds.length > 1 && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-sans uppercase tracking-widest text-gold/60">
                +{player.deckIds.length - 1}
              </span>
              <div className="relative" style={{ width: 52, height: 76 }}>
                {Array.from({ length: Math.min(3, player.deckIds.length - 1) }).map((_, i) => (
                  <div key={i} className="absolute" style={{ bottom: i * 3, left: i * 2 }}>
                    <CardBack size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={player.deckIds[0]}
              initial={{ y: 24, opacity: 0, scale: 0.92 }}
              animate={{ y: 0, opacity: 1, scale: 0.90 }}
              exit={{ y: -14, opacity: 0, scale: 0.82 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              style={{ transformOrigin: "bottom center" }}
            >
              <CountryCard
                country={myCard}
                selectable={canPlay}
                onSelectAttribute={onSelectAttribute}
                size="sm"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// Leaderboard — same as in play.tsx but with playerId instead of "human"
function MPLeaderBoard({ players, myPlayerId }: { players: MPPlayer[]; myPlayerId: string }) {
  const sorted = [...players].sort((a, b) => b.deckIds.length - a.deckIds.length);
  return (
    <div className="flex items-center gap-1 rounded-xl glass-panel px-2.5 py-1">
      <Crown className="h-3 w-3 text-gold shrink-0 mr-0.5" />
      {sorted.map((p, i) => {
        const isMe = p.playerId === myPlayerId;
        const isLeader = i === 0;
        const label = isMe ? "Você" : p.name.split(" ")[0];
        return (
          <AnimatePresence key={p.playerId} mode="wait">
            <motion.span
              key={p.playerId + "-" + p.deckIds.length}
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 3 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex items-center gap-1 font-sans text-[10px] tabular-nums",
                i < sorted.length - 1 && "after:content-['·'] after:mx-1 after:text-muted-foreground/40",
                isLeader ? (isMe ? "text-gold font-bold" : "text-foreground font-bold") : "text-muted-foreground",
              )}
            >
              <span className="truncate max-w-[52px]">{label}</span>
              <span className={cn("font-bold", isLeader ? "text-gold" : "text-muted-foreground/70")}>
                {p.deckIds.length}
              </span>
            </motion.span>
          </AnimatePresence>
        );
      })}
    </div>
  );
}
