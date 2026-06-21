import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Award, Star } from "lucide-react";
import { MapBackground } from "@/components/MapBackground";
import { useProfile } from "@/lib/game-store";
import { getLeader } from "@/lib/leaders";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Perfil · Oráculo das Nações" }] }),
  component: Profile,
});

function Profile() {
  const { playerName, leaderId, xp, wins, losses } = useProfile();
  const leader = getLeader(leaderId);
  const level = Math.floor(xp / 200) + 1;
  const nextXp = level * 200;
  const pct = ((xp % 200) / 200) * 100;

  return (
    <>
      <MapBackground />
      <main className="relative mx-auto min-h-screen max-w-2xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <h1 className="font-sans text-lg uppercase tracking-[0.3em] text-gold">Perfil</h1>
          <div className="w-16" />
        </header>
        <section className="rounded-3xl glass-panel p-6">
          <div className="flex items-center gap-4">
            <img src={leader.portrait} alt={leader.name} className="h-20 w-20 rounded-2xl border-2 border-gold object-cover glow-gold" width={160} height={160} />
            <div className="min-w-0">
              <div className="font-sans text-2xl text-gold-gradient">{playerName}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{leader.name}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{leader.bio}</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Nível {level}</span>
              <span>{xp} / {nextXp} XP</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-background/60">
              <div className="h-full bg-gradient-to-r from-gold to-gold-soft" style={{ width: pct + "%" }} />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <Stat label="Vitórias" value={wins} accent="text-positive" />
            <Stat label="Derrotas" value={losses} accent="text-negative" />
            <Stat label="Taxa Vit." value={`${wins + losses === 0 ? 0 : Math.round((wins / (wins + losses)) * 100)}%`} accent="text-gold" />
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Award className="h-3 w-3" /> Conquistas
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["Primeira Vitória", "Estrategista", "Diplomata"].map((a, i) => (
                <div key={a} className={"flex flex-col items-center gap-1 rounded-xl border border-gold/30 bg-background/30 p-3 " + (wins > i ? "" : "opacity-40")}>
                  <Star className={"h-5 w-5 " + (wins > i ? "text-gold fill-gold" : "text-muted-foreground")} />
                  <span className="text-[10px] text-center text-muted-foreground">{a}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="rounded-xl border border-gold/20 bg-background/30 p-3">
      <div className={"font-sans text-2xl " + accent}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}