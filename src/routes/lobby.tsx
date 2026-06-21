import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Globe2, Plus, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapBackground } from "@/components/MapBackground";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/game-store";

export const Route = createFileRoute("/lobby")({
  head: () => ({ meta: [{ title: "Multiplayer · Oráculo das Nações" }] }),
  component: Lobby,
});

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function Lobby() {
  const navigate = useNavigate();
  const { playerName } = useProfile();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState("");

  async function createRoom() {
    setLoading("create");
    setError("");
    const code = generateCode();
    const hostId = crypto.randomUUID();

    const { error: roomErr } = await supabase.from("rooms").insert({
      code,
      host_id: hostId,
      status: "lobby",
    });

    if (roomErr) { setError("Erro ao criar sala. Tente novamente."); setLoading(null); return; }

    // Save host identity to sessionStorage
    sessionStorage.setItem("mp_player_id", hostId);
    sessionStorage.setItem("mp_is_host", "true");

    navigate({ to: "/room/$code", params: { code } });
  }

  async function joinRoom() {
    setLoading("join");
    setError("");
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 4) { setError("Código deve ter 4 caracteres."); setLoading(null); return; }

    const { data, error: roomErr } = await supabase
      .from("rooms")
      .select("id, status")
      .eq("code", code)
      .single();

    if (roomErr || !data) { setError("Sala não encontrada."); setLoading(null); return; }
    if (data.status !== "lobby") { setError("Esta sala já iniciou ou encerrou."); setLoading(null); return; }

    const playerId = crypto.randomUUID();
    sessionStorage.setItem("mp_player_id", playerId);
    sessionStorage.setItem("mp_is_host", "false");

    navigate({ to: "/room/$code", params: { code } });
  }

  return (
    <>
      <MapBackground />
      <main className="relative mx-auto flex h-screen max-w-lg flex-col items-center justify-center px-4 gap-6 overflow-hidden">
        <Link to="/" className="absolute top-5 left-5 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Globe2 className="mx-auto h-10 w-10 text-gold mb-3" />
          <h1 className="font-display text-4xl text-gold-gradient">Multiplayer</h1>
          <p className="mt-2 text-sm text-muted-foreground">Jogue com turmas inteiras em tempo real</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full space-y-4"
        >
          {/* Criar sala */}
          <div className="rounded-2xl glass-panel p-5">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-sans uppercase tracking-[0.25em] text-gold">
              <Plus className="h-3.5 w-3.5" /> Criar Sala (Anfitrião)
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Crie uma sala e compartilhe o código com sua turma.
            </p>
            <button
              onClick={createRoom}
              disabled={loading !== null}
              className="w-full rounded-xl bg-gradient-to-b from-gold to-gold-soft py-3.5 font-sans text-sm font-bold uppercase tracking-widest text-primary-foreground hover:brightness-110 transition disabled:opacity-50"
            >
              {loading === "create" ? "Criando..." : "Criar Nova Sala"}
            </button>
          </div>

          {/* Entrar em sala */}
          <div className="rounded-2xl glass-panel p-5">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-sans uppercase tracking-[0.25em] text-gold">
              <Users className="h-3.5 w-3.5" /> Entrar em Sala (Aluno)
            </div>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={4}
              placeholder="Código da sala (ex: XKQR)"
              className="w-full rounded-lg border border-gold/30 bg-background/40 px-3 py-2.5 text-center text-lg font-bold uppercase tracking-[0.4em] text-foreground placeholder:text-muted-foreground/40 focus:border-gold focus:outline-none mb-3"
            />
            <button
              onClick={joinRoom}
              disabled={loading !== null || joinCode.length !== 4}
              className="w-full rounded-xl glass-panel py-3.5 font-sans text-sm font-semibold uppercase tracking-widest text-foreground hover:text-gold transition disabled:opacity-50"
            >
              {loading === "join" ? "Entrando..." : "Entrar na Sala"}
            </button>
          </div>

          {error && (
            <p className="text-center text-sm text-negative">{error}</p>
          )}
        </motion.div>
      </main>
    </>
  );
}
