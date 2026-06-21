import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { MapBackground } from "@/components/MapBackground";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações · Oráculo das Nações" }] }),
  component: Settings,
});

function Settings() {
  const [sound, setSound] = useState(80);
  const [music, setMusic] = useState(60);
  const [fx, setFx] = useState(90);
  const [lang, setLang] = useState("pt-BR");

  return (
    <>
      <MapBackground />
      <main className="relative mx-auto min-h-screen max-w-2xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <h1 className="font-sans text-lg uppercase tracking-[0.3em] text-gold">Configurações</h1>
          <div className="w-16" />
        </header>
        <section className="space-y-5 rounded-3xl glass-panel p-6">
          <Slider label="Som" value={sound} onChange={setSound} />
          <Slider label="Música" value={music} onChange={setMusic} />
          <Slider label="Efeitos" value={fx} onChange={setFx} />
          <div>
            <div className="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">Idioma</div>
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full rounded-lg border border-gold/30 bg-background/40 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none">
              <option value="pt-BR">Português (BR)</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
          <div className="text-[11px] text-muted-foreground">As preferências são salvas localmente neste dispositivo.</div>
        </section>
      </main>
    </>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        <span className="text-gold">{value}</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-gold" />
    </label>
  );
}