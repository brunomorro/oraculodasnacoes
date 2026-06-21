import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Crown, Home, RotateCw, Skull, Trophy } from "lucide-react";
import { useEffect } from "react";
import { LeaderBadge } from "@/components/LeaderBadge";
import { MapBackground } from "@/components/MapBackground";
import { useGame } from "@/lib/game-store";

export const Route = createFileRoute("/result")({
  head: () => ({ meta: [{ title: "Resultado · Oráculo das Nações" }] }),
  component: Result,
});

const MEDAL = ["🥇", "🥈", "🥉"];

function Result() {
  const state = useGame((s) => s.state);
  const navigate = useNavigate();

  useEffect(() => {
    if (!state) navigate({ to: "/" });
  }, [state, navigate]);
  if (!state) return null;

  const youWon = state.winnerId === "human";
  const winner = state.players.find((p) => p.id === state.winnerId)!;

  // Top 3 by score (rounds won), ties broken by deck size
  const top3 = [...state.players]
    .sort((a, b) => b.score - a.score || b.deck.length - a.deck.length)
    .slice(0, 3);

  return (
    <>
      <MapBackground />
      <main className="relative mx-auto flex h-screen max-w-lg flex-col items-center justify-center px-4 py-8 overflow-hidden gap-6">

        {/* Header */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="text-center"
        >
          {youWon ? (
            <Crown className="mx-auto h-14 w-14 text-gold drop-shadow-[0_0_24px_oklch(0.80_0.14_85/0.8)]" />
          ) : (
            <Skull className="mx-auto h-14 w-14 text-negative drop-shadow-[0_0_20px_oklch(0.65_0.22_25/0.6)]" />
          )}

          <div className={`mt-3 text-[11px] uppercase tracking-[0.4em] ${youWon ? "text-gold" : "text-negative"}`}>
            {youWon ? "Vitória" : "Você foi eliminado"}
          </div>

          <h1 className="mt-1 font-display text-5xl font-semibold text-gold-gradient">
            {youWon ? "Você venceu!" : winner.name + " venceu"}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {youWon
              ? `+50 XP — você dominou a mesa em ${state.roundNumber} rodadas.`
              : `+15 XP — boa partida. Você pode melhorar!`}
          </p>
        </motion.div>

        {/* Top 3 */}
        <section className="w-full rounded-3xl glass-panel p-5">
          <h2 className="mb-3 flex items-center gap-2 font-sans text-xs uppercase tracking-[0.3em] text-gold">
            <Trophy className="h-3.5 w-3.5" /> Top 3 da Partida
          </h2>
          <ol className="space-y-2">
            {top3.map((p, i) => {
              const isYou = p.id === "human";
              return (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className={`flex items-center gap-3 rounded-xl p-2.5 ${isYou ? "bg-gold/15 ring-1 ring-gold" : "bg-background/40"}`}
                >
                  <span className="text-xl shrink-0">{MEDAL[i]}</span>
                  <LeaderBadge leaderId={p.leaderId} size="sm" showName={false} />
                  <span className="flex-1 truncate font-sans text-sm font-semibold text-foreground">
                    {p.name}
                    {isYou && <span className="ml-2 text-[10px] text-gold/70 uppercase tracking-widest">Você</span>}
                  </span>
                  <div className="text-right shrink-0">
                    <div className="font-sans text-sm font-bold tabular-nums text-gold">{p.score} rod.</div>
                    <div className="text-[10px] text-muted-foreground">{p.deck.length} cartas</div>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </section>

        {/* Actions */}
        <div className="flex w-full gap-3">
          {youWon ? (
            <>
              <Link
                to="/avatar-select"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold to-gold-soft px-5 py-3.5 font-sans text-sm font-bold uppercase tracking-widest text-primary-foreground hover:brightness-110 transition"
              >
                <RotateCw className="h-4 w-4" /> Nova Partida
              </Link>
              <Link
                to="/"
                className="flex items-center justify-center gap-2 rounded-xl glass-panel px-5 py-3.5 font-sans text-sm font-semibold uppercase tracking-widest text-foreground hover:text-gold transition"
              >
                <Home className="h-4 w-4" /> Início
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-negative/80 to-negative px-5 py-3.5 font-sans text-sm font-bold uppercase tracking-widest text-white hover:brightness-110 transition"
              >
                <Home className="h-4 w-4" /> Sair da Sala
              </Link>
              <Link
                to="/avatar-select"
                className="flex items-center justify-center gap-2 rounded-xl glass-panel px-5 py-3.5 font-sans text-sm font-semibold uppercase tracking-widest text-foreground hover:text-gold transition"
              >
                <RotateCw className="h-4 w-4" /> Tentar Novamente
              </Link>
            </>
          )}
        </div>
      </main>
    </>
  );
}
