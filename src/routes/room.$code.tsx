import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, Crown, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { MapBackground } from "@/components/MapBackground";
import { LeaderBadge } from "@/components/LeaderBadge";
import { supabase } from "@/lib/supabase";
import { dealMultiplayerGame } from "@/lib/multiplayer-engine";
import type { Room, RoomPlayer } from "@/lib/multiplayer-types";
import { LEADERS, type LeaderId } from "@/lib/leaders";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/room/$code")({
  head: () => ({ meta: [{ title: "Sala de Espera · Oráculo das Nações" }] }),
  component: WaitingRoom,
});

function WaitingRoom() {
  const { code } = Route.useParams();
  const navigate = useNavigate();

  const playerId = sessionStorage.getItem("mp_player_id") ?? "";
  const isHost = sessionStorage.getItem("mp_is_host") === "true";

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [name, setName] = useState("");
  const [leaderId, setLeaderId] = useState<LeaderId>("archer");
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  // Load room + subscribe to realtime
  useEffect(() => {
    async function load() {
      const { data: roomData } = await supabase
        .from("rooms").select("*").eq("code", code).single();
      if (!roomData) { navigate({ to: "/lobby" }); return; }
      setRoom(roomData);

      const { data: playersData } = await supabase
        .from("room_players").select("*").eq("room_id", roomData.id);
      setPlayers(playersData ?? []);

      // Already joined?
      const me = (playersData ?? []).find((p: RoomPlayer) => p.player_id === playerId);
      if (me) setJoined(true);
    }
    load();

    const channel = supabase
      .channel(`room-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players" },
        async () => {
          const { data: roomData } = await supabase.from("rooms").select("id").eq("code", code).single();
          if (!roomData) return;
          const { data } = await supabase.from("room_players").select("*").eq("room_id", roomData.id);
          setPlayers(data ?? []);
        }
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${code}` },
        (payload) => {
          const updated = payload.new as Room;
          setRoom(updated);
          if (updated.status === "playing") {
            navigate({ to: "/multiplayer/$code", params: { code } });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [code, playerId, navigate]);

  async function joinRoom() {
    if (!name.trim() || !room) return;
    await supabase.from("room_players").insert({
      room_id: room.id,
      player_id: playerId,
      name: name.trim(),
      leader_id: leaderId,
      is_ready: false,
      is_host: isHost,
    });
    setJoined(true);
  }

  async function toggleReady() {
    if (!room) return;
    const me = players.find((p) => p.player_id === playerId);
    if (!me) return;
    await supabase.from("room_players").update({ is_ready: !me.is_ready }).eq("id", me.id);
  }

  async function startGame() {
    if (!room) return;
    setStarting(true);
    const readyPlayers = players.filter((p) => p.is_ready || p.is_host);
    const gameState = dealMultiplayerGame(readyPlayers);
    await supabase.from("rooms").update({ status: "playing", game_state: gameState }).eq("id", room.id);
  }

  function copyCode() {
    navigator.clipboard.writeText(`${window.location.origin}/room/${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const me = players.find((p) => p.player_id === playerId);
  const allReady = players.length > 1 && players.every((p) => p.is_ready || p.is_host);

  if (!room) return null;

  return (
    <>
      <MapBackground />
      <main className="relative mx-auto flex h-screen max-w-lg flex-col px-4 pt-8 pb-6 gap-5 overflow-hidden">

        {/* Header */}
        <div className="text-center shrink-0">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Código da Sala</div>
          <div className="flex items-center justify-center gap-3">
            <span className="font-display text-5xl tracking-[0.4em] text-gold-gradient">{code}</span>
          </div>

          {/* Shareable link */}
          <div className="mt-3 flex items-center gap-2 rounded-xl glass-panel px-3 py-2 max-w-sm mx-auto">
            <span className="flex-1 truncate text-xs text-muted-foreground font-mono">
              {window.location.origin}/room/{code}
            </span>
            <button
              onClick={copyCode}
              className="shrink-0 flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-gold hover:text-gold/80 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado!" : "Copiar link"}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Compartilhe o link ou o código com os outros líderes</p>
        </div>

        {/* Join form */}
        <AnimatePresence>
          {!joined && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl glass-panel p-4 shrink-0"
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Seu nome e líder</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                maxLength={18}
                className="w-full rounded-lg border border-gold/30 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none mb-3"
              />
              <div className="grid grid-cols-4 gap-2 mb-3">
                {LEADERS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLeaderId(l.id)}
                    className={cn("rounded-xl p-1.5 transition", leaderId === l.id ? "ring-2 ring-gold bg-gold/10" : "glass-panel")}
                  >
                    <img src={l.portrait} alt={l.name} className="h-10 w-10 rounded-full object-cover mx-auto" />
                    <div className="text-[9px] text-center mt-1 text-muted-foreground truncate">{l.name}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={joinRoom}
                disabled={!name.trim()}
                className="w-full rounded-xl bg-gradient-to-b from-gold to-gold-soft py-2.5 font-sans text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50 hover:brightness-110 transition"
              >
                Entrar na Sala
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Players list */}
        <div className="rounded-2xl glass-panel p-4 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-gold mb-3 shrink-0">
            <Users className="h-3.5 w-3.5" /> Jogadores ({players.length})
          </div>
          <div className="space-y-2 overflow-y-auto flex-1">
            <AnimatePresence>
              {players.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl p-2.5",
                    p.player_id === playerId ? "bg-gold/10 ring-1 ring-gold/40" : "bg-background/30",
                  )}
                >
                  <LeaderBadge leaderId={p.leader_id} size="sm" showName={false} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {p.is_host && <Crown className="h-3 w-3 text-gold shrink-0" />}
                      <span className="font-sans text-sm font-semibold text-foreground truncate">{p.name}</span>
                      {p.player_id === playerId && <span className="text-[9px] text-gold/60 uppercase tracking-widest shrink-0">Você</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{p.leader_id}</div>
                  </div>
                  <div className={cn(
                    "rounded-full px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold",
                    p.is_ready || p.is_host ? "bg-positive/20 text-positive" : "bg-muted/20 text-muted-foreground",
                  )}>
                    {p.is_host ? "Anfitrião" : p.is_ready ? "Pronto" : "Aguardando"}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {players.length === 0 && (
              <p className="text-center text-xs text-muted-foreground/50 py-4">Nenhum jogador ainda…</p>
            )}
          </div>
        </div>

        {/* Actions */}
        {joined && (
          <div className="shrink-0 flex gap-3">
            {!isHost && (
              <button
                onClick={toggleReady}
                className={cn(
                  "flex-1 rounded-xl py-3.5 font-sans text-sm font-bold uppercase tracking-widest transition",
                  me?.is_ready
                    ? "bg-positive/20 border border-positive/50 text-positive"
                    : "bg-gradient-to-b from-gold to-gold-soft text-primary-foreground hover:brightness-110",
                )}
              >
                {me?.is_ready ? "✓ Pronto" : "Marcar Pronto"}
              </button>
            )}
            {isHost && (
              <button
                onClick={startGame}
                disabled={!allReady || starting || players.length < 2}
                className="flex-1 rounded-xl bg-gradient-to-b from-gold to-gold-soft py-3.5 font-sans text-sm font-bold uppercase tracking-widest text-primary-foreground hover:brightness-110 transition disabled:opacity-40"
              >
                {starting ? "Iniciando…" : players.length < 2 ? "Aguardando jogadores" : allReady ? "Iniciar Partida" : "Aguardando prontos"}
              </button>
            )}
          </div>
        )}
      </main>
    </>
  );
}
