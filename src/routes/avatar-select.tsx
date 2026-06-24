import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, ChevronDown, Users } from "lucide-react";
import { useState } from "react";
import { MapBackground } from "@/components/MapBackground";
import { useGame, useProfile } from "@/lib/game-store";
import { LEADERS, type LeaderId } from "@/lib/leaders";
import { useIsMobile } from "@/lib/use-is-mobile";
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const navigate = useNavigate();
  const startGame = useGame((s) => s.startGame);
  const isMobile = useIsMobile();

  function confirm() {
    profile.setProfile({ playerName: name, leaderId: selected });
    startGame(name, selected, botCount);
    navigate({ to: "/play" });
  }

  function selectLeader(id: LeaderId) {
    setSelected(id);
    if (isMobile) setSheetOpen(true);
  }

  const leader = LEADERS.find((l) => l.id === selected)!;

  return (
    <>
      <MapBackground />

      {/* ── MOBILE LAYOUT ─────────────────────────────── */}
      {isMobile ? (
        <main className="relative h-screen flex flex-col overflow-hidden">
          {/* Header */}
          <header className="relative z-10 flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
            <Link to="/" className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
            <h1 className="font-display text-xl tracking-wide text-gold">Escolha seu Líder</h1>
            <div className="w-16" />
          </header>

          {/* Grid — scrollable, takes all remaining height */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-2">
            <div className="grid grid-cols-3 gap-2">
              {LEADERS.map((l) => {
                const active = l.id === selected;
                return (
                  <motion.button
                    key={l.id}
                    onClick={() => selectLeader(l.id)}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "relative rounded-2xl glass-panel p-2 text-center transition-all",
                      active && "ring-2 ring-gold glow-gold",
                    )}
                  >
                    <div className="relative mx-auto w-fit">
                      <div
                        className="h-16 w-16 overflow-hidden rounded-full p-[3px]"
                        style={{ background: `linear-gradient(135deg, ${l.frameColor}, oklch(0.30 0.05 260))` }}
                      >
                        <img src={l.portrait} alt={l.name} width={128} height={128} loading="lazy"
                          className="h-full w-full rounded-full object-cover" />
                      </div>
                      {active && (
                        <div className="absolute -top-1 -right-1 rounded-full bg-gold p-0.5">
                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="mt-1.5 font-display text-[11px] font-semibold text-foreground leading-tight line-clamp-2">
                      {l.name}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Bottom bar — always visible with selected leader + start */}
          <div className="shrink-0 border-t border-gold/20 bg-background/60 backdrop-blur-md px-4 pt-3 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <img src={leader.portrait} alt={leader.name}
                className="h-10 w-10 rounded-full border border-gold/50 object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-display text-sm font-semibold text-gold-gradient truncate">{leader.name}</div>
                <div className="text-[10px] text-muted-foreground line-clamp-1">{leader.bio.replace(/ — /g, " ").slice(0, 60)}…</div>
              </div>
              <button onClick={() => setSheetOpen(true)}
                className="text-muted-foreground hover:text-gold transition-colors shrink-0">
                <ChevronDown className="h-4 w-4 rotate-180" />
              </button>
            </div>
            <div className="flex gap-2 mb-3">
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={18}
                placeholder="Seu nome"
                className="flex-1 rounded-lg border border-gold/30 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none" />
              <div className="flex items-center gap-1 rounded-lg border border-gold/30 bg-background/30 px-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <select value={botCount} onChange={(e) => setBotCount(Number(e.target.value))}
                  className="bg-transparent text-sm text-foreground focus:outline-none pr-1">
                  {[2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <button onClick={confirm}
              className="w-full rounded-xl bg-gradient-to-b from-gold to-gold-soft py-3 font-sans text-sm font-bold uppercase tracking-widest text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.80_0.14_85/0.6)] transition hover:brightness-110">
              Iniciar Partida
            </button>
          </div>

          {/* Leader detail sheet */}
          <AnimatePresence>
            {sheetOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                  onClick={() => setSheetOpen(false)}
                />
                <motion.div
                  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl glass-panel p-5"
                >
                  <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-gold/30" />
                  <div className="flex items-center gap-4 mb-4">
                    <img src={leader.portrait} alt={leader.name}
                      style={{ background: `linear-gradient(135deg, ${leader.frameColor}, oklch(0.30 0.05 260))` }}
                      className="h-20 w-20 rounded-2xl border-2 border-gold/50 object-cover glow-gold shrink-0" />
                    <div>
                      <div className="font-display text-2xl text-gold-gradient">{leader.name}</div>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/85 mb-5">
                    {leader.bio.replace(/ — /g, " ")}
                  </p>
                  <button onClick={() => setSheetOpen(false)}
                    className="w-full rounded-xl bg-gradient-to-b from-gold to-gold-soft py-3 font-sans text-sm font-bold uppercase tracking-widest text-primary-foreground transition hover:brightness-110">
                    Confirmar {leader.name}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </main>

      ) : (

        /* ── DESKTOP LAYOUT (unchanged) ───────────────── */
        <main className="relative mx-auto h-screen max-w-6xl px-4 pt-5 pb-4 flex flex-col overflow-hidden">
          <header className="mb-4 flex items-center justify-between shrink-0">
            <Link to="/" className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
            <h1 className="font-display text-2xl tracking-wide text-gold">Selecione seu Líder</h1>
            <div className="w-16" />
          </header>

          <div className="grid gap-5 lg:grid-cols-[1fr_300px] flex-1 min-h-0">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 content-start overflow-y-auto px-1 pt-1 pb-2">
              {LEADERS.map((l) => {
                const active = l.id === selected;
                return (
                  <motion.button key={l.id} onClick={() => setSelected(l.id)}
                    whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                    className={cn("group relative overflow-hidden rounded-2xl glass-panel p-2.5 text-left transition-all", active && "ring-2 ring-gold glow-gold")}>
                    <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full p-[3px] sm:h-24 sm:w-24"
                      style={{ background: `linear-gradient(135deg, ${l.frameColor}, oklch(0.30 0.05 260))` }}>
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

            <aside className="flex flex-col gap-3 rounded-2xl glass-panel p-4 min-h-0 overflow-hidden">
              <div className="text-center shrink-0">
                <img src={leader.portrait} alt={leader.name} width={400} height={400}
                  className="mx-auto h-28 w-28 rounded-2xl border-2 border-gold/50 object-cover glow-gold" />
                <div className="mt-2 font-display text-2xl text-gold-gradient">{leader.name}</div>
              </div>
              <p className="text-xs leading-relaxed text-foreground/85 overflow-y-auto flex-1 min-h-0">
                {leader.bio.replace(/ — /g, " ")}
              </p>
              <div className="shrink-0 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-sans uppercase tracking-widest text-muted-foreground">Seu nome</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={18}
                    className="w-full rounded-lg border border-gold/30 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none" />
                </label>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[10px] font-sans uppercase tracking-widest text-muted-foreground">
                    <span><Users className="mr-1 inline h-3 w-3" /> Bots</span>
                    <span className="text-gold">{botCount}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {[2,3,4,5,6,7].map((n) => (
                      <button key={n} onClick={() => setBotCount(n)}
                        className={cn("rounded-md py-1.5 text-xs font-sans font-bold transition",
                          botCount === n ? "bg-gold text-primary-foreground" : "border border-gold/30 bg-background/30 text-muted-foreground hover:border-gold")}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={confirm}
                  className="w-full rounded-xl bg-gradient-to-b from-gold to-gold-soft px-4 py-2.5 font-sans text-sm font-bold uppercase tracking-widest text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.80_0.14_85/0.6)] transition hover:brightness-110">
                  Iniciar Partida
                </button>
              </div>
            </aside>
          </div>
        </main>
      )}
    </>
  );
}
