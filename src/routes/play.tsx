import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Eye, Timer, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CardBack, CountryCard } from "@/components/CountryCard";
import { LeaderBadge } from "@/components/LeaderBadge";
import { MapBackground } from "@/components/MapBackground";
import { Particles } from "@/components/Particles";
import { ATTRIBUTES, type Attribute, type Country } from "@/lib/countries";
import {
  playButtonClick,
  playCardReveal,
  playGameLose,
  playGameWin,
  playLoseRound,
  playWinRound,
  useAudio,
} from "@/lib/audio";
import type { Phase, Player, RoundResult } from "@/lib/game-engine";
import { useGame, useProfile } from "@/lib/game-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [{ title: "Partida · Oráculo das Nações" }],
  }),
  component: Play,
});

/**
 * Clock-angle: 0° = 12 o'clock, CW positive. Human at 6 o'clock (bottom).
 * r=46% keeps seats just inside the oval border for any aspect ratio.
 */
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

// ── Main component ────────────────────────────────────────────────────────────
function Play() {
  const state = useGame((s) => s.state);
  const play = useGame((s) => s.play);
  const resetGame = useGame((s) => s.reset);
  const navigate = useNavigate();
  const addResult = useProfile((s) => s.addResult);
  const { muted, toggle: toggleMute } = useAudio();

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [reactions, setReactions] = useState<{ id: number; emoji: string; from: string; x: number }[]>([]);
  const reactionIdRef = useRef(0);
  const prevRoundNumberRef = useRef<number | undefined>(undefined);
  const prevPhaseRef = useRef<string | undefined>(undefined);
  const prevRoundWinnerRef = useRef<string | null | undefined>(undefined);
  const gameEndFiredRef = useRef(false);

  const pushReaction = useCallback((emoji: string, from: string) => {
    const id = ++reactionIdRef.current;
    const x = 10 + Math.random() * 80;
    setReactions((r) => [...r, { id, emoji, from, x }]);
    setTimeout(() => setReactions((r) => r.filter((r) => r.id !== id)), 2800);
  }, []);

  useEffect(() => {
    if (!state) navigate({ to: "/avatar-select" });
  }, [state, navigate]);

  useEffect(() => {
    if (!state) return;
    if (state.phase === "revealing" && prevPhaseRef.current === "choosing") {
      playCardReveal();
    }
    prevPhaseRef.current = state.phase;
  }, [state?.phase]);

  useEffect(() => {
    if (!state?.lastRound) return;
    const w = state.lastRound.winnerId;
    if (w === prevRoundWinnerRef.current) return;
    prevRoundWinnerRef.current = w;
    if (w === null) return;
    if (w === "human") playWinRound();
    else playLoseRound();
  }, [state?.lastRound?.winnerId, state?.roundNumber]);

  // Bot auto-reactions after each round
  useEffect(() => {
    if (!state?.lastRound || state.roundNumber === prevRoundNumberRef.current) return;
    prevRoundNumberRef.current = state.roundNumber;
    const winner = state.lastRound.winnerId;
    const bots = state.players.filter((p) => p.id !== "human");
    const reactor = bots[Math.floor(Math.random() * bots.length)];
    if (!reactor) return;
    const delay = 600 + Math.random() * 600;
    const t = setTimeout(() => {
      if (winner === "human") {
        pushReaction(["😤", "💀", "😱", "🤯"][Math.floor(Math.random() * 4)], reactor.name);
      } else if (winner === null) {
        pushReaction(["🤝", "😐", "🙃"][Math.floor(Math.random() * 3)], reactor.name);
      } else {
        pushReaction(["👑", "🔥", "😏", "⚡"][Math.floor(Math.random() * 4)], reactor.name);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [state?.roundNumber, state?.lastRound, pushReaction]);

  useEffect(() => {
    if (!state?.winnerId || gameEndFiredRef.current) return;
    gameEndFiredRef.current = true;
    const won = state.winnerId === "human";
    addResult(won, won ? 50 : 15);
    if (won) playGameWin();
    else playGameLose();
    const t = setTimeout(() => navigate({ to: "/result" }), 2400);
    return () => clearTimeout(t);
  }, [state?.winnerId, addResult, navigate]);

  if (!state) return null;

  const human = state.players.find((p) => p.id === "human")!;
  const bots = state.players.filter((p) => p.id !== "human");
  const isMyTurn = state.currentPlayerId === "human";
  const current = state.players.find((p) => p.id === state.currentPlayerId)!;
  const botPositions = getBotPositions(bots.length);
  const isSpectating = human.deck.length === 0 && !state.winnerId;

  const handlePlay = (a: Attribute) => { playButtonClick(); play(a); };
  const handleExit = () => {
    if (isSpectating) { resetGame(); navigate({ to: "/" }); }
    else setShowExitConfirm(true);
  };
  const confirmExit = () => { resetGame(); navigate({ to: "/" }); };

  const ovalWidth = "min(98vw, calc((100dvh - 300px) * 2.8))";

  return (
    <div className="relative h-screen overflow-hidden flex flex-col select-none">
      <MapBackground />

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="relative z-20 flex items-center justify-between px-4 pt-3 pb-2 shrink-0 h-12">
        <div className="flex items-center gap-2">
          <button
            onClick={handleExit}
            className="flex items-center gap-1.5 text-[11px] font-sans uppercase tracking-widest text-muted-foreground hover:text-gold transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Sair
          </button>
          <ReactionPanel onReact={(emoji) => pushReaction(emoji, "Você")} />
        </div>
        <div className="flex items-center gap-2">
          <LeaderBoard players={state.players} />
          <TurnTimer
            key={state.currentPlayerId + "-" + state.roundNumber}
            active={state.phase === "choosing" && !isSpectating}
          />
          <button
            onClick={toggleMute}
            className="rounded-full glass-panel p-1.5 text-muted-foreground hover:text-gold transition-colors"
            title={muted ? "Ligar som" : "Silenciar"}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      {/* ── Game area ───────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 min-h-0 flex items-center justify-center pt-2 pb-[72px]">

        <div className="relative" style={{ width: ovalWidth, aspectRatio: "2.8 / 1" }}>
          {/* Oval felt + border */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: "50%",
              background: "radial-gradient(ellipse at 50% 50%, oklch(0.22 0.07 255 / 0.48), oklch(0.14 0.05 255 / 0.06))",
              border: "1.5px solid oklch(0.80 0.14 85 / 0.35)",
              boxShadow: "0 0 0 3px oklch(0.80 0.14 85 / 0.06), inset 0 0 80px -30px oklch(0.80 0.14 85 / 0.10)",
            }}
          />

          {/* Game name watermark — same style as home screen title */}
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

          {/* ── Bot seats — badge + face-down card (hand) ── */}
          {bots.map((bot, i) => {
            const pos = botPositions[i];
            const eliminated = bot.deck.length === 0 && !state.winnerId;
            const isActive = state.currentPlayerId === bot.id;
            return (
              <div
                key={bot.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
              >
                <BotBlock
                  player={bot}
                  isActive={isActive}
                  eliminated={eliminated}
                  gameWinnerId={state.winnerId}
                  size={bots.length <= 4 ? "lg" : "md"}
                />
              </div>
            );
          })}

          {/* ── Human seat — absolute inside oval, hangs 38% below bottom edge ── */}
          {/* z-index intentionally below center area (z-20) so comparison cards */}
          {/* always render on top when the two regions physically overlap.       */}
          <div
            className="absolute left-1/2 z-10"
            style={{ bottom: 0, transform: "translateX(-50%) translateY(58%)" }}
          >
            <HumanBlock
              player={human}
              isMyTurn={isMyTurn}
              phase={state.phase}
              gameWinnerId={state.winnerId}
              onSelectAttribute={handlePlay}
              isSpectating={isSpectating}
            />
          </div>

          {/* ── Center table — comparison cards OR info ── */}
          {/* z-20 keeps this above the human block (z-10) on every screen size. */}
          <div className="absolute inset-x-[20%] inset-y-[5%] z-20 flex flex-col items-center justify-center gap-2 pointer-events-none">
            <AnimatePresence mode="wait">
              {state.phase === "revealing" && state.revealAttribute ? (
                /* Current round being revealed — show all players' top cards */
                <motion.div
                  key={"rev-" + state.roundNumber}
                  initial={{ opacity: 0, scale: 0.88, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.75, transition: { duration: 0.28 } }}
                  transition={{ type: "spring", stiffness: 240, damping: 22 }}
                  className="flex flex-col items-center gap-1.5 w-full"
                >
                  {(() => {
                    const alive = state.players.filter((p) => p.deck.length > 0);
                    const n = alive.length;
                    const ovalPx = Math.min(
                      window.innerWidth * 0.98,
                      (window.innerHeight - 300) * 2.8,
                    );
                    const centerW = ovalPx * 0.60;
                    const neededW = n * 130 + (n - 1) * 6;
                    const scale = Math.min(1, centerW / neededW);
                    return (
                      <div style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
                        <div className="flex flex-nowrap items-end justify-center gap-1.5">
                          {alive.map((p, idx) => (
                            <CountryCard
                              key={p.id}
                              country={p.deck[0]}
                              highlightedAttr={state.revealAttribute}
                              size="sm"
                              flipIn
                              revealDelay={0.08 * idx}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  {state.pot.length > 0 && (
                    <div className="text-[9px] font-sans uppercase tracking-widest text-gold/70">
                      Pote · {state.pot.length}
                    </div>
                  )}
                </motion.div>
              ) : state.lastRound ? (
                /* Comparison cards — result from the last round */
                <motion.div
                  key={"cmp-" + state.roundNumber}
                  initial={{ opacity: 0, scale: 0.88, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.75, transition: { duration: 0.28 } }}
                  transition={{ type: "spring", stiffness: 240, damping: 22 }}
                  className="flex flex-col items-center gap-1.5 w-full"
                >
                  {(() => {
                    const reveals = state.lastRound.reveals;
                    const n = reveals.length;
                    const ovalPx = Math.min(
                      window.innerWidth * 0.98,
                      (window.innerHeight - 300) * 2.8,
                    );
                    const centerW = ovalPx * 0.60;
                    const neededW = n * 130 + (n - 1) * 6;
                    const scale = Math.min(1, centerW / neededW);
                    return (
                      <div
                        style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
                      >
                        <div className="flex flex-nowrap items-end justify-center gap-1.5">
                          {reveals.map((r, idx) => {
                            const isW = r.playerId === state.lastRound!.winnerId;
                            const isL = state.lastRound!.winnerId !== null && !isW;
                            return (
                              <CountryCard
                                key={r.playerId}
                                country={r.card}
                                highlightedAttr={state.lastRound!.attribute}
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
                  {/* Pot below cards */}
                  {state.pot.length > 0 && (
                    <div className="text-[9px] font-sans uppercase tracking-widest text-gold/70">
                      Pote · {state.pot.length}
                    </div>
                  )}
                </motion.div>
              ) : (
                /* No active round — pot + turn hint */
                <motion.div
                  key="info"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2"
                >
                  {state.pot.length > 0 && (
                    <div className="flex items-center gap-1.5 rounded-full glass-panel px-3 py-1 text-[10px] font-sans uppercase tracking-widest text-gold/80">
                      Pote · {state.pot.length}
                    </div>
                  )}
                  {isSpectating && (
                    <button
                      className="pointer-events-auto rounded-lg bg-accent/20 border border-accent/40 px-4 py-1.5 text-xs font-sans uppercase tracking-widest text-accent hover:bg-accent/30 transition-colors"
                      onClick={confirmExit}
                    >
                      Voltar ao início
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Particles ── */}
          {state.lastRound?.winnerId && state.phase === "choosing" && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <Particles
                count={28}
                color={state.lastRound.winnerId === "human" ? "positive" : "negative"}
              />
            </div>
          )}

        </div>
      </div>

      {/* ── Floating reactions ──────────────────────────────── */}
      <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {reactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -180, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 2.4, ease: "easeOut" }}
              className="absolute bottom-24 flex flex-col items-center gap-0.5"
              style={{ left: `${r.x}%` }}
            >
              <span className="text-3xl drop-shadow-lg">{r.emoji}</span>
              <span className="text-[9px] font-sans uppercase tracking-widest text-white/60 whitespace-nowrap">
                {r.from}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Round result — bottom left ──────────────────────── */}
      <AnimatePresence>
        {state.lastRound && state.phase === "choosing" && (
          <motion.div
            key={"result-" + state.roundNumber}
            initial={{ opacity: 0, x: -16, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -16, transition: { duration: 0.22 } }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed bottom-6 left-5 z-30 pointer-events-none"
          >
            <div
              className={cn(
                "rounded-2xl px-5 py-2.5 backdrop-blur-md border",
                state.lastRound.winnerId === "human"
                  ? "bg-positive/20 border-positive/50 text-positive"
                  : state.lastRound.winnerId === null
                    ? "bg-accent/20 border-accent/50 text-accent"
                    : "bg-negative/20 border-negative/50 text-negative",
              )}
            >
              <div className="font-sans text-base font-bold tracking-wide">
                {state.lastRound.winnerId === null
                  ? "Empate"
                  : state.lastRound.winnerId === "human"
                    ? "Você venceu!"
                    : `${state.players.find((p) => p.id === state.lastRound!.winnerId)?.name} venceu`}
              </div>
              {state.lastRound.winnerId === null && state.pot.length > 0 && (
                <div className="mt-0.5 text-xs font-sans opacity-80">
                  {state.pot.length} cartas no pote
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Turn hint — bottom right ────────────────────────── */}
      <AnimatePresence>
        {state.phase === "choosing" && !state.winnerId && !isSpectating && (
          <motion.div
            key={isMyTurn ? "my-turn" : "bot-turn"}
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
              {isMyTurn ? "Escolha um atributo" : `Vez de ${current.name}`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Exit confirmation modal ──────────────────────────── */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setShowExitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl glass-panel p-6 text-center"
            >
              <h2 className="font-sans text-base font-semibold text-foreground">
                Sair da partida?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                O progresso desta partida será perdido.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 rounded-xl glass-panel py-2.5 text-sm font-sans font-semibold uppercase tracking-widest text-foreground hover:text-gold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmExit}
                  className="flex-1 rounded-xl bg-negative/80 py-2.5 text-sm font-sans font-semibold uppercase tracking-widest text-white hover:bg-negative transition-colors"
                >
                  Sair
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── BotBlock ─────────────────────────────────────────────────────────────────
// Shows avatar (glow via LeaderBadge.active) + face-down card (hand).
// Revealed/comparison cards appear in the table center, not here.
function BotBlock({
  player,
  isActive,
  eliminated,
  gameWinnerId,
  size,
}: {
  player: Player;
  isActive: boolean;
  eliminated: boolean;
  gameWinnerId: string | null;
  size: "sm" | "md" | "lg";
}) {
  const hasCard = !eliminated && player.deck.length > 0;

  return (
    <div className={cn("flex flex-col items-center gap-1", eliminated && "opacity-40")}>
      <LeaderBadge
        leaderId={player.leaderId}
        name={player.name}
        cardsLeft={player.deck.length}
        active={isActive}
        winner={gameWinnerId === player.id}
        size={size}
      />
      {/* Face-down card represents bot's current hand */}
      {hasCard && (
        <AnimatePresence mode="wait">
          <motion.div
            key={player.deck.length > 0 ? "has" : "empty"}
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

// ── HumanBlock ───────────────────────────────────────────────────────────────
// Horizontal layout: [avatar + "Sua vez"] beside [pile + selectable card].
// Glow is on the avatar circle via LeaderBadge.active.
function HumanBlock({
  player,
  isMyTurn,
  phase,
  gameWinnerId,
  onSelectAttribute,
  isSpectating,
}: {
  player: Player;
  isMyTurn: boolean;
  phase: Phase;
  gameWinnerId: string | null;
  onSelectAttribute: (a: Attribute) => void;
  isSpectating: boolean;
}) {
  const hasCard = player.deck.length > 0;
  const canPlay = isMyTurn && phase === "choosing" && !gameWinnerId && !isSpectating;

  return (
    <div className={cn("flex flex-row items-end gap-3", isSpectating && "opacity-50")}>
      {/* Left — avatar + "Sua vez" label */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <LeaderBadge
          leaderId={player.leaderId}
          name={player.name}
          cardsLeft={player.deck.length}
          active={isMyTurn && !isSpectating}
          winner={gameWinnerId === "human"}
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

      {/* Right — deck pile + face-up selectable card */}
      {hasCard && (
        <div className="flex items-end gap-2">
          {/* Stacked CardBacks (remaining deck) */}
          {player.deck.length > 1 && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-sans uppercase tracking-widest text-gold/60">
                +{player.deck.length - 1}
              </span>
              <div className="relative" style={{ width: 52, height: 76 }}>
                {Array.from({ length: Math.min(3, player.deck.length - 1) }).map((_, i) => (
                  <div key={i} className="absolute" style={{ bottom: i * 3, left: i * 2 }}>
                    <CardBack size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active card — face up, selectable */}
          <AnimatePresence mode="wait">
            <motion.div
              key={player.deck[0].id}
              initial={{ y: 24, opacity: 0, scale: 0.92 }}
              animate={{ y: 0, opacity: 1, scale: 0.90 }}
              exit={{ y: -14, opacity: 0, scale: 0.82 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              style={{ transformOrigin: "bottom center" }}
            >
              <CountryCard
                country={player.deck[0]}
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

// ── ReactionPanel ─────────────────────────────────────────────────────────────
const REACTIONS = ["🔥", "👑", "⚡", "😤", "💀", "🤝", "😱", "🎯"];

function ReactionPanel({ onReact }: { onReact: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full glass-panel px-2.5 py-1 text-base leading-none hover:scale-110 transition-transform"
        title="Reações"
      >
        😄
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="absolute top-full left-0 mt-2 z-50 flex flex-wrap gap-1.5 rounded-2xl glass-panel p-2.5 w-[130px]"
          >
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { onReact(emoji); setOpen(false); }}
                className="text-xl hover:scale-125 transition-transform active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── LeaderBoard ───────────────────────────────────────────────────────────────
function LeaderBoard({ players }: { players: Player[] }) {
  const sorted = [...players].sort((a, b) => b.deck.length - a.deck.length);

  return (
    <div className="flex items-center gap-1 rounded-xl glass-panel px-2.5 py-1">
      <Crown className="h-3 w-3 text-gold shrink-0 mr-0.5" />
      {sorted.map((p, i) => {
        const isHuman = p.id === "human";
        const isLeader = i === 0;
        const label = isHuman ? "Você" : p.name.split(" ")[0];
        return (
          <AnimatePresence key={p.id} mode="wait">
            <motion.span
              key={p.id + "-" + p.deck.length}
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 3 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex items-center gap-1 font-sans text-[10px] tabular-nums",
                i < sorted.length - 1 && "after:content-['·'] after:mx-1 after:text-muted-foreground/40",
                isLeader ? (isHuman ? "text-gold font-bold" : "text-foreground font-bold") : "text-muted-foreground",
              )}
            >
              <span className="truncate max-w-[52px]">{label}</span>
              <span className={cn("font-bold", isLeader ? "text-gold" : "text-muted-foreground/70")}>
                {p.deck.length}
              </span>
            </motion.span>
          </AnimatePresence>
        );
      })}
    </div>
  );
}

// ── TurnTimer ─────────────────────────────────────────────────────────────────
function TurnTimer({ active }: { active: boolean }) {
  const [t, setT] = useState(30);
  useEffect(() => {
    if (!active) return;
    setT(30);
    const iv = setInterval(() => setT((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(iv);
  }, [active]);
  return (
    <div className="flex items-center gap-1.5 rounded-full glass-panel px-2.5 py-1">
      <Timer className="h-3 w-3 text-gold" />
      <span className="font-sans text-sm font-bold tabular-nums text-foreground">
        {String(t).padStart(2, "0")}s
      </span>
    </div>
  );
}
