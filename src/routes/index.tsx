import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Crown, Globe2, Play, Settings, Trophy, User, Wifi, X } from "lucide-react";
import { useState } from "react";
import { MapBackground } from "@/components/MapBackground";
import { useProfile } from "@/lib/game-store";
import { LEADERS } from "@/lib/leaders";

const RULES = [
  "Cada jogador recebe um baralho com cartas de nações do mundo, cada uma com 4 atributos econômicos.",
  "Na sua vez, escolha um atributo da sua carta — PIB, Juros, Inflação ou Dívida. Todos revelam suas cartas.",
  "Quem tiver o valor mais alto (ou mais baixo, dependendo do atributo) vence a rodada e leva todas as cartas.",
  "Empate? As cartas vão para o pote — quem vencer a próxima rodada leva tudo.",
  "O último jogador com cartas vence o jogo.",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oráculo das Nações" },
      { name: "description", content: "Jogo de cartas de macroeconomia — dispute PIB, juros, inflação e dívida das maiores economias do mundo." },
      { property: "og:title", content: "Oráculo das Nações" },
      { property: "og:description", content: "Cartas econômicas das nações do mundo. Solo contra bots, online em breve." },
    ],
  }),
  component: Index,
});

function Index() {
  const { playerName, leaderId, xp, wins, losses } = useProfile();
  const leader = LEADERS.find((l) => l.id === leaderId) ?? LEADERS[0];
  const [showRules, setShowRules] = useState(false);

  return (
    <>
      <MapBackground />
      <main className="relative mx-auto flex h-screen max-w-6xl flex-col items-center justify-center px-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center gap-2 rounded-full border border-gold/40 glass-panel px-4 py-1.5 text-[11px] uppercase tracking-[0.3em] text-gold"
        >
          <Globe2 className="h-3.5 w-3.5" /> Mesa Global · Temporada 1
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center font-display text-5xl font-semibold leading-tight tracking-wide md:text-7xl"
        >
          <span className="text-gold-gradient">Oráculo das Nações</span>
        </motion.h1>

        <p className="mt-4 max-w-xl text-center text-sm text-muted-foreground md:text-base">
          52 nações. 4 atributos econômicos. Uma mesa para definir quem manda no mundo.
        </p>

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex w-full max-w-md items-center gap-4 rounded-2xl glass-panel p-4"
        >
          <img
            src={leader.portrait}
            alt={leader.name}
            className="h-14 w-14 rounded-full border-2 border-gold/60 object-cover"
            width={64}
            height={64}
          />
          <div className="min-w-0 flex-1">
            <div className="font-sans text-sm font-semibold text-foreground">
              {playerName}
            </div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {leader.name} · XP {xp}
            </div>
          </div>
          <div className="flex gap-3 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
            <div>
              <div className="font-sans text-base text-positive">{wins}</div>
              <div>Vit.</div>
            </div>
            <div>
              <div className="font-sans text-base text-negative">{losses}</div>
              <div>Der.</div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="mt-6 flex w-full max-w-md flex-col gap-3">
          <PrimaryAction to="/avatar-select" icon={<Play className="h-5 w-5" />} label="Jogar Solo" featured />
          <PrimaryAction to="/lobby" icon={<Wifi className="h-5 w-5" />} label="Multiplayer" featured />
          <div className="grid grid-cols-2 gap-3">
            <PrimaryAction to="/ranking" icon={<Trophy className="h-5 w-5" />} label="Ranking" />
            <PrimaryAction to="/profile" icon={<User className="h-5 w-5" />} label="Perfil" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <PrimaryAction to="/settings" icon={<Settings className="h-5 w-5" />} label="Configurações" />
            <button
              onClick={() => setShowRules(true)}
              className="flex items-center justify-center gap-2 rounded-xl glass-panel px-4 py-3.5 font-sans text-sm font-semibold uppercase tracking-widest text-foreground/90 transition hover:border-gold hover:text-gold"
            >
              <BookOpen className="h-5 w-5" /> Regras
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
          <Crown className="h-3 w-3 text-gold/70" />
          Multiplayer · Torneios · em breve
        </div>
      </main>

      {/* Modal de regras */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setShowRules(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl glass-panel p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[11px] font-sans uppercase tracking-[0.25em] text-gold">
                  <BookOpen className="h-3.5 w-3.5" /> Como Jogar
                </div>
                <button onClick={() => setShowRules(false)} className="text-muted-foreground hover:text-gold transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ol className="space-y-3">
                {RULES.map((rule, i) => (
                  <li key={i} className="flex gap-3 text-sm text-foreground/85 leading-relaxed">
                    <span className="text-gold font-bold shrink-0">{i + 1}.</span>
                    {rule}
                  </li>
                ))}
              </ol>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function PrimaryAction({
  to,
  icon,
  label,
  featured,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  featured?: boolean;
}) {
  return (
    <Link
      to={to}
      className={
        featured
          ? "col-span-2 flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-b from-gold to-gold-soft px-5 py-4 font-sans text-base font-bold uppercase tracking-widest text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.80_0.14_85/0.6)] transition hover:brightness-110"
          : "flex items-center justify-center gap-2 rounded-xl glass-panel px-4 py-3.5 font-sans text-sm font-semibold uppercase tracking-widest text-foreground/90 transition hover:border-gold hover:text-gold"
      }
    >
      {icon}
      {label}
    </Link>
  );
}
