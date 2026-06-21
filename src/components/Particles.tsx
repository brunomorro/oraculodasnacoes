import { motion } from "framer-motion";
import { useMemo } from "react";

interface Props {
  count?: number;
  color?: "gold" | "positive" | "negative";
}

/** Burst of particles radiating from the center. */
export function Particles({ count = 28, color = "gold" }: Props) {
  const colorVar =
    color === "positive"
      ? "var(--positive)"
      : color === "negative"
        ? "var(--negative)"
        : "var(--gold)";

  const seeds = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const distance = 90 + Math.random() * 140;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          size: 3 + Math.random() * 5,
          delay: Math.random() * 0.15,
          duration: 0.9 + Math.random() * 0.7,
        };
      }),
    [count],
  );

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      {seeds.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: [0, 1, 1, 0],
            scale: [0.4, 1.1, 0.9, 0.2],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: colorVar,
            boxShadow: `0 0 12px ${colorVar}`,
          }}
        />
      ))}
    </div>
  );
}