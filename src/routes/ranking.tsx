import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BookOpen, Trophy, X } from "lucide-react";
import { useState } from "react";
import { LeaderBadge } from "@/components/LeaderBadge";
import { MapBackground } from "@/components/MapBackground";
import { LEADERS } from "@/lib/leaders";
import { useProfile } from "@/lib/game-store";

export const Route = createFileRoute("/ranking")({
  head: () => ({ meta: [{ title: "Ranking · Oráculo das Nações" }] }),
  component: Ranking,
});

const RULES = [
  "Cada jogador recebe um baralho com cartas de nações do mundo, cada uma com 4 atributos econômicos.",
  "Na sua vez, escolha um atributo da sua carta — PIB, Juros, Inflação ou Dívida. Todos revelam suas cartas.",
  "Quem tiver o valor mais alto (ou mais baixo, dependendo do atributo) vence a rodada e leva todas as cartas.",
  "Empate? As cartas vão para o pote — quem vencer a próxima rodada leva tudo.",
  "O último jogador com cartas vence o jogo.",
];

function Ranking() {
  const { playerName, leaderId, xp, wins } = useProfile();
  const [showRules, setShowRules] = useState(false);

  const others = [
    { name: "A Bruxa",     leaderId: "witch"      as const, xp: 4820, wins: 87 },
    { name: "O Gladiador", leaderId: "gladiator"  as const, xp: 4120, wins: 79 },
    { name: "O Cavaleiro", leaderId: "knight"     as const, xp: 3640, wins: 71 },
    { name: "O Tirano",    leaderId: "tyrant"     as const, xp: 3290, wins: 65 },
    { name: "O Ferreiro",  leaderId: "blacksmith" as const, xp: 2980, wins: 58 },
    { name: "A Oráculo",   leaderId: "oracle"     as const, xp: 2510, wins: 49 },
  ];

  const all = [...others, { name: playerName, leaderId, xp, wins, you: true }]
    .sort((a, b) => b.xp - a.xp);

  return (
    <>
      <MapBackground />
      <main className="relative mx-auto h-screen max-w-3xl px-4 pt-6 pb-4 flex flex-col overflow-hidden">
        <header className="mb-4 flex items-center justify-between shrink-0">
          <Link to="/" className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <h1 className="flex items-center gap-2 font-sans text-lg uppercase tracking-[0.3em] text-gold">
            <Trophy className="h-4 w-4" /> Ranking Global
          </h1>
          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold transition-colors"
          >
            <BookOpen className="h-4 w-4" /> Regras
          </button>
        </header>

        <ol className="space-y-2 rounded-3xl glass-panel p-4 flex-1 min-h-0 overflow-hidden flex flex-col">
          {all.map((p, i) => {
            const lid = p.leaderId ?? LEADERS[0].id;
            const you = "you" in p && p.you;
            return (
              <li
                key={i}
                className={
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 flex-1 min-h-0 " +
                  (you ? "bg-gold/15 ring-1 ring-gold" : "bg-background/30")
                }
              >
                <span className="w-6 text-center font-sans text-lg text-gold shrink-0">{i + 1}</span>
                <LeaderBadge leaderId={lid} size="sm" showName={false} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-sans text-sm font-semibold text-foreground">
                    {p.name}{you && <span className="ml-2 text-[10px] text-gold/70 uppercase tracking-widest">Você</span>}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{p.wins} vitórias</div>
                </div>
                <span className="font-sans text-base font-bold tabular-nums text-gold shrink-0">{p.xp} XP</span>
              </li>
            );
          })}
        </ol>
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
