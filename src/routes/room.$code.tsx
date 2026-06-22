import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Crown, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/lib/use-is-mobile";
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

  // Generate player ID if arriving via direct link (skipping lobby)
  const playerId = (() => {
    let id = sessionStorage.getItem("mp_player_id");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("mp_player_id", id);
      sessionStorage.setItem("mp_is_host", "false");
    }
    return id;
  })();
  const isHost = sessionStorage.getItem("mp_is_host") === "true";

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [name, setName] = useState("");
  const [leaderId, setLeaderId] = useState<LeaderId>(LEADERS[0].id);
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sheetLeader, setSheetLeader] = useState<LeaderId | null>(null);
  const [startError, setStartError] = useState("");

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
    setStartError("");
    try {
      // Fetch fresh player list to avoid stale state
      const { data: freshPlayers, error: fetchErr } = await supabase
        .from("room_players").select("*").eq("room_id", room.id);
      if (fetchErr || !freshPlayers?.length) {
        setStartError("Erro ao buscar jogadores. Tente novamente.");
        setStarting(false);
        return;
      }
      const readyPlayers = freshPlayers.filter((p) => p.is_ready || p.is_host);
      if (readyPlayers.length < 2) {
        setStartError("Precisam de pelo menos 2 líderes prontos.");
        setStarting(false);
        return;
      }
      const gameState = dealMultiplayerGame(readyPlayers);
      const { error: updateErr } = await supabase
        .from("rooms").update({ status: "playing", game_state: gameState }).eq("id", room.id);
      if (updateErr) {
        setStartError("Erro ao iniciar: " + updateErr.message);
        setStarting(false);
      }
    } catch (e: unknown) {
      setStartError("Erro inesperado. Tente novamente.");
      setStarting(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(`${window.location.origin}/room/${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isMobile = useIsMobile();
  const me = players.find((p) => p.player_id === playerId);
  const allReady = players.length > 1 && players.every((p) => p.is_ready || p.is_host);
  const sheetLeaderData = sheetLeader ? LEADERS.find(l => l.id === sheetLeader) : null;

  if (!room) return null;

  return (
    <>
      <MapBackground />
      <main className="relative mx-auto flex h-screen max-w-5xl flex-col px-4 pt-6 pb-6 gap-4 overflow-hidden">

        {/* Header — código da sala */}
        <div className="text-center shrink-0">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Código da Sala</div>
          <div className="font-display text-5xl tracking-[0.4em] text-gold-gradient">{code}</div>

          {/* Link + copy */}
          <div className="mt-3 max-w-sm mx-auto rounded-xl glass-panel px-3 py-2 flex items-center gap-2">
            <span className="flex-1 truncate text-[11px] text-muted-foreground font-mono">
              {typeof window !== "undefined" ? window.location.origin : ""}/room/{code}
            </span>
            <button onClick={copyCode}
              className="shrink-0 flex items-center gap-1 text-[10px] uppercase tracking-widest font-semibold text-gold hover:text-gold/80 transition-colors">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>

        {/* Join form — seleção de líder e nome */}
        <AnimatePresence>
          {!joined && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-4 flex-1 min-h-0"
            >
              {/* Two-column on desktop, stacked on mobile */}
              <div className="grid gap-4 lg:grid-cols-[1fr_300px] flex-1 min-h-0">

                {/* Left: leader grid */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 content-start overflow-y-auto px-1 pt-1 pb-2">
                  {LEADERS.map((l) => {
                    const active = l.id === leaderId;
                    return (
                      <motion.button
                        key={l.id}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setLeaderId(l.id); if (isMobile) setSheetLeader(l.id); }}
                        className={cn(
                          "group relative overflow-hidden rounded-2xl glass-panel p-2.5 text-left transition-all",
                          active && "ring-2 ring-gold glow-gold",
                        )}
                      >
                        <div
                          className="relative mx-auto h-20 w-20 overflow-hidden rounded-full p-[3px] sm:h-24 sm:w-24"
                          style={{ background: `linear-gradient(135deg, ${l.frameColor}, oklch(0.30 0.05 260))` }}
                        >
                          <img src={l.portrait} alt={l.name} width={256} height={256} loading="lazy"
                            className="h-full w-full rounded-full object-cover" />
                          {active && (
                            <div className="absolute -top-1 -right-1 rounded-full bg-gold p-1">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-center">
                          <div className="font-display text-base font-semibold text-foreground leading-tight">{l.name}</div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Right: detail panel (desktop only) */}
                <aside className="hidden lg:flex flex-col gap-3 rounded-2xl glass-panel p-4 min-h-0 overflow-hidden">
                  <div className="text-center shrink-0">
                    <img
                      src={LEADERS.find(l => l.id === leaderId)!.portrait}
                      alt={LEADERS.find(l => l.id === leaderId)!.name}
                      width={400} height={400}
                      className="mx-auto h-28 w-28 rounded-2xl border-2 border-gold/50 object-cover glow-gold"
                    />
                    <div className="mt-2 font-display text-2xl text-gold-gradient">
                      {LEADERS.find(l => l.id === leaderId)!.name}
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground/85 overflow-y-auto flex-1 min-h-0">
                    {LEADERS.find(l => l.id === leaderId)!.bio.replace(/ — /g, " ")}
                  </p>
                  <div className="shrink-0 space-y-3">
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-sans uppercase tracking-widest text-muted-foreground">Seu nome</span>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={18}
                        placeholder="Como quer ser chamado?"
                        className="w-full rounded-lg border border-gold/30 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                      />
                    </label>
                    <button
                      onClick={joinRoom}
                      disabled={!name.trim()}
                      className="w-full rounded-xl bg-gradient-to-b from-gold to-gold-soft px-4 py-2.5 font-sans text-sm font-bold uppercase tracking-widest text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.80_0.14_85/0.6)] disabled:opacity-50 hover:brightness-110 transition"
                    >
                      Entrar na Sala
                    </button>
                  </div>
                </aside>
              </div>

              {/* Mobile bottom bar */}
              <div className="lg:hidden shrink-0 flex items-center gap-2 rounded-xl glass-panel px-3 py-2.5">
                <img
                  src={LEADERS.find(l => l.id === leaderId)!.portrait}
                  alt={LEADERS.find(l => l.id === leaderId)!.name}
                  className="h-10 w-10 rounded-full border border-gold/50 object-cover shrink-0"
                />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  maxLength={18}
                  className="flex-1 min-w-0 rounded-lg border border-gold/30 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                />
                <button
                  onClick={joinRoom}
                  disabled={!name.trim()}
                  className="shrink-0 rounded-xl bg-gradient-to-b from-gold to-gold-soft px-4 py-2.5 font-sans text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50 hover:brightness-110 transition"
                >
                  Entrar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de jogadores (depois de entrar) */}
        {joined && (
          <div className="rounded-2xl glass-panel p-4 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-gold mb-3 shrink-0">
              <Users className="h-3.5 w-3.5" /> Líderes na Sala ({players.length})
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
                        {p.player_id === playerId && (
                          <span className="text-[9px] text-gold/60 uppercase tracking-widest shrink-0">Você</span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {LEADERS.find(l => l.id === p.leader_id)?.name}
                      </div>
                    </div>
                    <div className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold shrink-0",
                      p.is_ready || p.is_host ? "bg-positive/20 text-positive" : "bg-muted/20 text-muted-foreground",
                    )}>
                      {p.is_host ? "Anfitrião" : p.is_ready ? "Pronto" : "Aguardando"}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {players.length === 0 && (
                <p className="text-center text-xs text-muted-foreground/50 py-4">Nenhum líder ainda…</p>
              )}
            </div>
          </div>
        )}

        {/* Ações */}
        {joined && (
          <div className="shrink-0 flex flex-col gap-2">
            {startError && (
              <p className="text-center text-sm text-negative">{startError}</p>
            )}
            {!isHost && (
              <button
                onClick={toggleReady}
                className={cn(
                  "w-full rounded-xl py-3.5 font-sans text-sm font-bold uppercase tracking-widest transition",
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
                className="w-full rounded-xl bg-gradient-to-b from-gold to-gold-soft py-3.5 font-sans text-sm font-bold uppercase tracking-widest text-primary-foreground hover:brightness-110 transition disabled:opacity-40"
              >
                {starting ? "Iniciando…" : players.length < 2 ? "Aguardando líderes" : allReady ? "Iniciar Partida" : "Aguardando prontos"}
              </button>
            )}
          </div>
        )}
      </main>

      {/* Bottom sheet — bio do líder */}
      <AnimatePresence>
        {sheetLeader && sheetLeaderData && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setSheetLeader(null)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl glass-panel p-5 max-w-lg mx-auto"
            >
              <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-gold/30" />
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="h-20 w-20 rounded-2xl overflow-hidden shrink-0 border-2 border-gold/50 glow-gold"
                  style={{ background: `linear-gradient(135deg, ${sheetLeaderData.frameColor}, oklch(0.30 0.05 260))` }}
                >
                  <img src={sheetLeaderData.portrait} alt={sheetLeaderData.name}
                    className="h-full w-full object-cover" />
                </div>
                <div>
                  <div className="font-display text-2xl text-gold-gradient">{sheetLeaderData.name}</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-foreground/85 mb-5">
                {sheetLeaderData.bio.replace(/ — /g, " ")}
              </p>
              <button
                onClick={() => setSheetLeader(null)}
                className="w-full rounded-xl bg-gradient-to-b from-gold to-gold-soft py-3 font-sans text-sm font-bold uppercase tracking-widest text-primary-foreground transition hover:brightness-110"
              >
                Confirmar {sheetLeaderData.name}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
