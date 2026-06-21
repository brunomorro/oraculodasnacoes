import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Users } from "lucide-react";
import { useState } from "react";
import { MapBackground } from "@/components/MapBackground";
import { useGame, useProfile } from "@/lib/game-store";
import { LEADERS, type LeaderId } from "@/lib/leaders";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/avatar-select")({
  head: () => ({
    meta: [
      { title: "Selecione seu Líder · Oráculo das Nações" },
      { name: "description", content: "Escolha um líder político fictício para representar você nas disputas." },
    ],
  }),
  component: AvatarSelect,
});

function AvatarSelect() {
  const profile = useProfile();
  const [selected, setSelected] = useState<LeaderId>(LEADERS[0].id);
  const [botCount, setBotCount] = useState(3);
  const [name, setName] = useState(profile.playerName);
  const navigate = useNavigate();
  const startGame = useGame((s) => s.startGame);

  function confirm() {
    profile.setProfile({ playerName: name, leaderId: selected });
    startGame(name, selected, botCount);
    navigate({ to: "/play" });
  }

  const leader = LEADERS.find((l) => l.id === selected)!;

  return (
    <>
      <MapBackground />
      <main className="relative mx-auto h-screen max-w-6xl px-4 pt-5 pb-4 flex flex-col overflow-hidden">
        <header className="mb-4 flex items-center justify-between shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <h1 className="font-display text-2xl tracking-wide text-gold">
            Selecione seu Líder
          </h1>
          <div className="w-16" />
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_300px] flex-1 min-h-0">
          {/* Grid de líderes */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 content-start overflow-y-auto px-1 pt-1 pb-2">
            {LEADERS.map((l) => {
              const active = l.id === selected;
              return (
                <motion.button
                  key={l.id}
                  onClick={() => setSelected(l.id)}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl glass-panel p-2.5 text-left transition-all",
                    active && "ring-2 ring-gold glow-gold",
                  )}
                >
                  <div
                    className="relative mx-auto h-20 w-20 overflow-hidden rounded-full p-[3px] sm:h-24 sm:w-24"
                    style={{
                      background: `linear-gradient(135deg, ${l.frameColor}, oklch(0.30 0.05 260))`,
                    }}
                  >
                    <img
                      src={l.portrait}
                      alt={l.name}
                      width={256}
                      height={256}
                      loading="lazy"
                      className="h-full w-full rounded-full object-cover"
                    />
                    {active && (
                      <div className="absolute -top-1 -right-1 rounded-full bg-gold p-1">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className="font-display text-base font-semibold text-foreground leading-tight">
                      {l.name}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Painel de detalhes */}
          <aside className="flex flex-col gap-3 rounded-2xl glass-panel p-4 min-h-0 overflow-hidden">
            <div className="text-center shrink-0">
              <img
                src={leader.portrait}
                alt={leader.name}
                width={400}
                height={400}
                className="mx-auto h-28 w-28 rounded-2xl border-2 border-gold/50 object-cover glow-gold"
              />
              <div className="mt-2 font-display text-2xl text-gold-gradient">
                {leader.name}
              </div>
            </div>

            <p className="text-xs leading-relaxed text-foreground/85 overflow-y-auto flex-1 min-h-0">
              {leader.bio.replace(/ — /g, " ")}
            </p>

            <div className="shrink-0 space-y-3">
              <label className="block">
                <span className="mb-1 block text-[10px] font-sans uppercase tracking-widest text-muted-foreground">
                  Seu nome
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={18}
                  className="w-full rounded-lg border border-gold/30 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                />
              </label>

              <div>
                <div className="mb-1 flex items-center justify-between text-[10px] font-sans uppercase tracking-widest text-muted-foreground">
                  <span><Users className="mr-1 inline h-3 w-3" /> Bots</span>
                  <span className="text-gold">{botCount}</span>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {[2, 3, 4, 5, 6, 7].map((n) => (
                    <button
                      key={n}
                      onClick={() => setBotCount(n)}
                      className={cn(
                        "rounded-md py-1.5 text-xs font-sans font-bold transition",
                        botCount === n
                          ? "bg-gold text-primary-foreground"
                          : "border border-gold/30 bg-background/30 text-muted-foreground hover:border-gold",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={confirm}
                className="w-full rounded-xl bg-gradient-to-b from-gold to-gold-soft px-4 py-2.5 font-sans text-sm font-bold uppercase tracking-widest text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.80_0.14_85/0.6)] transition hover:brightness-110"
              >
                Iniciar Partida
              </button>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
