import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Swords } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CardBack, CountryCard } from "@/components/CountryCard";
import { LeaderBadge } from "@/components/LeaderBadge";
import { MapBackground } from "@/components/MapBackground";
import { COUNTRIES, ATTRIBUTES, type Attribute } from "@/lib/countries";
import { supabase } from "@/lib/supabase";
import { resolveRound } from "@/lib/multiplayer-engine";
import type { MPGameState, MPPlayer, Room } from "@/lib/multiplayer-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/multiplayer/$code")({
  head: () => ({ meta: [{ title: "Partida Online · Oráculo das Nações" }] }),
  component: MultiplayerGame,
});

function MultiplayerGame() {
  const { code } = Route.useParams();
  const navigate = useNavigate();

  const playerId = sessionStorage.getItem("mp_player_id") ?? "";
  const [room, setRoom] = useState<Room | null>(null);
  const [gs, setGs] = useState<MPGameState | null>(null);
  const [revealing, setRevealing] = useState(false);
  const revealTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("rooms").select("*").eq("code", code).single();
      if (!data) { navigate({ to: "/" }); return; }
      setRoom(data);
      if (data.game_state) setGs(data.game_state);
    }
    load();

    const channel = supabase
      .channel(`mp-game-${code}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${code}` },
        (payload) => {
          const updated = payload.new as Room;
          setRoom(updated);
          if (updated.game_state) {
            setGs(updated.game_state);
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

  async function pickAttribute(attr: Attribute) {
    if (!gs || !room || gs.currentPlayerId !== playerId) return;
    // Set to revealing immediately
    const revealingState: MPGameState = { ...gs, phase: "revealing" };
    await supabase.from("rooms").update({ game_state: revealingState }).eq("id", room.id);

    // Resolve after delay
    setTimeout(async () => {
      const next = resolveRound(gs, attr);
      const status = next.winnerId ? "finished" : "playing";
      await supabase.from("rooms").update({ game_state: next, status }).eq("id", room.id);
    }, 3000);
  }

  if (!gs) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-gold font-display text-2xl animate-pulse">Conectando…</div>
    </div>
  );

  const me = gs.players.find((p) => p.playerId === playerId);
  const others = gs.players.filter((p) => p.playerId !== playerId);
  const isMyTurn = gs.currentPlayerId === playerId;
  const myCard = me && me.deckIds.length > 0 ? COUNTRIES.find((c) => c.id === me.deckIds[0]) : null;
  const canPlay = isMyTurn && gs.phase === "choosing" && !gs.winnerId;

  const currentPlayer = gs.players.find((p) => p.playerId === gs.currentPlayerId);

  return (
    <>
      <MapBackground />
      <div className="relative h-screen overflow-hidden flex flex-col select-none">

        {/* Header */}
        <header className="relative z-20 flex items-center justify-between px-4 pt-3 pb-2 shrink-0 h-12">
          <div className="flex items-center gap-1.5 text-[11px] font-sans uppercase tracking-widest text-gold">
            <Swords className="h-3 w-3" /> Sala {code}
          </div>
          {/* Mini scoreboard */}
          <div className="flex items-center gap-3">
            {[...gs.players].sort((a, b) => b.score - a.score).slice(0, 3).map((p) => (
              <div key={p.playerId} className={cn("flex items-center gap-1 text-[10px]", p.playerId === playerId ? "text-gold" : "text-muted-foreground")}>
                <span className="font-semibold truncate max-w-[60px]">{p.playerId === playerId ? "Você" : p.name.split(" ")[0]}</span>
                <span className="tabular-nums font-bold">{p.deckIds.length}✦</span>
              </div>
            ))}
          </div>
        </header>

        {/* Other players */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex flex-wrap justify-center gap-4 px-4 pt-4 pb-2">
            {others.map((p) => (
              <OtherPlayer key={p.playerId} player={p} isActive={gs.currentPlayerId === p.playerId} />
            ))}
          </div>

          {/* Center — comparison cards */}
          <div className="flex-1 flex items-center justify-center px-4">
            <AnimatePresence mode="wait">
              {gs.lastRound && (revealing || gs.phase === "revealing") ? (
                <motion.div
                  key={"reveal-" + gs.roundNumber}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.75 }}
                  transition={{ type: "spring", stiffness: 240, damping: 22 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="flex flex-wrap justify-center gap-2">
                    {gs.lastRound.reveals.map((r) => {
                      const country = COUNTRIES.find((c) => c.id === r.cardId)!;
                      const isW = r.playerId === gs.lastRound!.winnerId;
                      const isL = gs.lastRound!.winnerId !== null && !isW;
                      const pName = gs.players.find((p) => p.playerId === r.playerId)?.name ?? "";
                      return (
                        <div key={r.playerId} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest truncate max-w-[130px]">
                            {r.playerId === playerId ? "Você" : pName}
                          </span>
                          <CountryCard
                            country={country}
                            highlightedAttr={gs.lastRound!.attribute}
                            isWinner={isW}
                            isLoser={isL}
                            size="sm"
                            flipIn
                            revealDelay={0}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {gs.lastRound.winnerId && (
                    <div className={cn(
                      "rounded-2xl px-6 py-2 text-sm font-bold backdrop-blur-md border",
                      gs.lastRound.winnerId === playerId
                        ? "bg-positive/20 border-positive/50 text-positive"
                        : "bg-negative/20 border-negative/50 text-negative",
                    )}>
                      {gs.lastRound.winnerId === playerId
                        ? "Você venceu a rodada!"
                        : `${gs.players.find((p) => p.playerId === gs.lastRound!.winnerId)?.name} venceu`}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  {gs.winnerId ? (
                    <div className="flex flex-col items-center gap-2">
                      <Crown className="h-12 w-12 text-gold" />
                      <div className="font-display text-3xl text-gold-gradient">
                        {gs.winnerId === playerId ? "Você venceu!" : `${gs.players.find(p => p.playerId === gs.winnerId)?.name} venceu!`}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground/60 uppercase tracking-widest">
                      {isMyTurn ? "Escolha um atributo" : `Vez de ${currentPlayer?.name}`}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* My card */}
        <div className="shrink-0 flex justify-center pb-4 px-4">
          {me && me.deckIds.length > 0 && myCard ? (
            <div className="flex items-end gap-3">
              <LeaderBadge leaderId={me.leaderId} name="Você" cardsLeft={me.deckIds.length} active={isMyTurn} size="md" />
              <div style={{ transform: "scale(0.88)", transformOrigin: "bottom center" }}>
                <CountryCard
                  country={myCard}
                  selectable={canPlay}
                  onSelectAttribute={pickAttribute}
                  size="sm"
                />
              </div>
            </div>
          ) : (
            me && me.deckIds.length === 0 && !gs.winnerId && (
              <div className="text-sm text-muted-foreground/60 uppercase tracking-widest">Você foi eliminado — assistindo</div>
            )
          )}
        </div>
      </div>
    </>
  );
}

function OtherPlayer({ player, isActive }: { player: MPPlayer; isActive: boolean }) {
  const hasCard = player.deckIds.length > 0;
  return (
    <div className={cn("flex flex-col items-center gap-1.5", !hasCard && "opacity-40")}>
      <LeaderBadge leaderId={player.leaderId} name={player.name} cardsLeft={player.deckIds.length} active={isActive} size="md" />
      {hasCard && <CardBack size="sm" />}
    </div>
  );
}
