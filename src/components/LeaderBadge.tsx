import { AnimatePresence, motion } from "framer-motion";
import { Crown, Star } from "lucide-react";
import { getLeader, type LeaderId } from "@/lib/leaders";
import { cn } from "@/lib/utils";

interface Props {
  leaderId: LeaderId;
  name?: string;
  cardsLeft?: number;
  active?: boolean;
  winner?: boolean;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

export function LeaderBadge({
  leaderId,
  name,
  cardsLeft,
  active,
  winner,
  size = "md",
  showName = true,
}: Props) {
  const leader = getLeader(leaderId);
  const dim =
    size === "lg" ? "h-24 w-24" : size === "sm" ? "h-12 w-12" : "h-16 w-16";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.div
        animate={
          active
            ? {
                scale: [1, 1.06, 1],
                boxShadow: [
                  "0 0 0px 0px oklch(0.82 0.15 85 / 0)",
                  "0 0 20px 8px oklch(0.82 0.15 85 / 0.70)",
                  "0 0 0px 0px oklch(0.82 0.15 85 / 0)",
                ],
              }
            : { scale: 1, boxShadow: "0 0 0px 0px oklch(0.82 0.15 85 / 0)" }
        }
        transition={{ duration: 1.4, repeat: active ? Infinity : 0, ease: "easeInOut" }}
        className={cn(
          "relative rounded-full p-[3px]",
          active && "animate-pulse-gold",
        )}
        style={{
          background: active
            ? `conic-gradient(from 0deg, ${leader.frameColor}, var(--gold), ${leader.frameColor})`
            : `linear-gradient(135deg, ${leader.frameColor}, oklch(0.30 0.05 260))`,
        }}
      >
        <div className={cn("overflow-hidden rounded-full bg-background", dim)}>
          <img
            src={leader.portrait}
            alt={leader.name}
            loading="lazy"
            width={256}
            height={256}
            className="h-full w-full object-cover"
          />
        </div>
        {winner && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-gold p-1 text-primary-foreground">
            <Crown className="h-3.5 w-3.5" />
          </div>
        )}
        {cardsLeft !== undefined && (
          <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 rounded-full border border-gold/60 bg-background px-1.5 py-0.5 text-[10px] font-sans font-bold text-gold overflow-hidden">
            <Star className="h-2.5 w-2.5 fill-gold shrink-0" />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={cardsLeft}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="tabular-nums"
              >
                {cardsLeft}
              </motion.span>
            </AnimatePresence>
          </div>
        )}
      </motion.div>
      {showName && (
        <div className="text-center max-w-[88px]">
          <div className="text-[11px] font-display font-semibold text-foreground leading-tight truncate">
            {name ?? leader.name}
          </div>
        </div>
      )}
    </div>
  );
}
