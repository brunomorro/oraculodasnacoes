import { AnimatePresence, motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { ATTRIBUTES, formatAttr, type Attribute, type Country } from "@/lib/countries";
import { cn } from "@/lib/utils";

interface Props {
  country: Country;
  highlightedAttr?: Attribute | null;
  isWinner?: boolean;
  isLoser?: boolean;
  selectable?: boolean;
  onSelectAttribute?: (a: Attribute) => void;
  size?: "sm" | "md" | "lg";
  revealDelay?: number;
  flipIn?: boolean;
}

export function CountryCard({
  country,
  highlightedAttr,
  isWinner,
  isLoser,
  selectable,
  onSelectAttribute,
  size = "md",
  revealDelay = 0,
  flipIn = false,
}: Props) {
  const isLg = size === "lg";
  const isSm = size === "sm";

  const cardW = isLg ? "w-[220px]" : isSm ? "w-[130px]" : "w-[168px]";
  const flagH = isLg ? "h-[110px]" : isSm ? "h-[64px]" : "h-[84px]";
  const flagSlug = isSm ? "w320" : "w640";
  const flagUrl = `https://flagcdn.com/${flagSlug}/${country.code.toLowerCase()}.png`;

  const highlightedValue = highlightedAttr ? formatAttr(country, highlightedAttr) : null;
  const highlightedDef = highlightedAttr
    ? ATTRIBUTES.find((a) => a.key === highlightedAttr)
    : null;

  return (
    <motion.div
      layout
      initial={
        flipIn
          ? { opacity: 0, rotateY: 180, y: -10, scale: 0.85 }
          : { opacity: 0, y: 20, rotateY: -20 }
      }
      animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: revealDelay,
      }}
      style={{ transformStyle: "preserve-3d", perspective: 800 }}
      className={cn(
        "relative shrink-0 flex flex-col overflow-hidden rounded-2xl",
        country.isSuperTrunfo
          ? "bg-gradient-to-b from-[oklch(0.26_0.09_75)] to-[oklch(0.18_0.07_75)]"
          : "bg-gradient-to-b from-[oklch(0.24_0.07_258)] to-[oklch(0.17_0.05_256)]",
        country.isSuperTrunfo
          ? "border-2 border-[oklch(0.82_0.15_85/0.9)] shadow-[0_0_0_2px_oklch(0.82_0.15_85/0.25),0_0_32px_-4px_oklch(0.82_0.15_85/0.5),0_8px_32px_-8px_oklch(0_0_0/0.7)]"
          : "border border-[oklch(0.80_0.14_85/0.35)] shadow-[0_0_0_1px_oklch(0.80_0.14_85/0.12),0_8px_32px_-8px_oklch(0_0_0/0.7)]",
        cardW,
        isWinner &&
          "ring-2 ring-[oklch(0.74_0.18_150)] shadow-[0_0_24px_-4px_oklch(0.74_0.18_150/0.6)] animate-pulse-gold",
        isLoser && "opacity-50 grayscale",
      )}
    >
      {/* Top accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[oklch(0.82_0.15_85)] to-transparent opacity-70" />

      {/* Card number + code */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <span className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-[oklch(0.82_0.15_85/0.7)]">
          Nº {String(country.id).padStart(2, "0")}
        </span>
        <span className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-[oklch(0.72_0.03_255/0.8)]">
          {country.code}
        </span>
      </div>

      {/* Flag banner */}
      <div className={cn("relative w-full overflow-hidden", flagH)}>
        <img
          src={flagUrl}
          alt={`Bandeira ${country.name}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.17_0.05_256)] via-[oklch(0.17_0.05_256/0.15)] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.17_0.05_256/0.3)] to-transparent" />
      </div>

      {/* Country name */}
      <div className="px-3 pt-1.5 pb-1 border-b border-[oklch(0.80_0.14_85/0.18)]">
        <h3
          className={cn(
            "text-center font-display font-semibold tracking-wide leading-tight",
            country.isSuperTrunfo ? "text-[oklch(0.92_0.14_85)]" : "text-[oklch(0.96_0.01_250)]",
            isLg ? "text-xl" : isSm ? "text-sm" : "text-base",
          )}
        >
          {country.name}
        </h3>
        {country.isSuperTrunfo && (
          <div className={cn(
            "mt-0.5 text-center font-sans font-bold uppercase tracking-[0.18em] text-[oklch(0.82_0.15_85)]",
            isSm ? "text-[7px]" : "text-[8px]",
          )}>
            ✦ Super Trunfo ✦
          </div>
        )}
      </div>

      {/* Highlighted attribute callout — animates glow on reveal */}
      <AnimatePresence>
        {highlightedAttr && highlightedValue && highlightedDef && (
          <motion.div
            initial={{
              boxShadow:
                "0 0 0 2px oklch(0.82 0.15 85 / 0.9), 0 0 20px 4px oklch(0.82 0.15 85 / 0.55)",
            }}
            animate={{
              boxShadow:
                "0 0 0 1px oklch(0.82 0.15 85 / 0.45), 0 0 0px 0px oklch(0.82 0.15 85 / 0)",
            }}
            transition={{ duration: 0.55, delay: revealDelay + 0.25, ease: "easeOut" }}
            className="mx-3 mt-2 mb-1 flex items-center justify-between rounded-lg bg-[oklch(0.82_0.15_85/0.12)] border border-[oklch(0.82_0.15_85/0.45)] px-2.5 py-1.5"
          >
            <span className="flex items-center gap-1 text-[9px] font-sans font-semibold uppercase tracking-[0.15em] text-[oklch(0.82_0.15_85/0.9)]">
              {highlightedDef.higherIsBetter ? (
                <TrendingUp className="h-3 w-3 text-[oklch(0.74_0.18_150)]" />
              ) : (
                <TrendingDown className="h-3 w-3 text-[oklch(0.65_0.22_25)]" />
              )}
              {highlightedDef.short}
            </span>
            <span
              className={cn(
                "font-sans font-bold tabular-nums text-[oklch(0.92_0.14_90)]",
                isLg ? "text-xl" : isSm ? "text-sm" : "text-lg",
              )}
            >
              {highlightedValue}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attributes list */}
      <div
        className={cn(
          "flex flex-col gap-0.5 pb-2",
          isSm ? "px-1.5" : "px-2",
          highlightedAttr ? "pt-0.5" : "pt-1.5",
        )}
      >
        {ATTRIBUTES.map((attr) => {
          const isHi = highlightedAttr === attr.key;
          const value = formatAttr(country, attr.key);
          return (
            <button
              key={attr.key}
              type="button"
              disabled={!selectable}
              onClick={() => onSelectAttribute?.(attr.key)}
              className={cn(
                "group flex w-full items-center justify-between rounded-md text-left transition-all",
                isSm ? "px-1.5 py-1" : "px-2 py-1.5",
                selectable &&
                  !isHi &&
                  "cursor-pointer hover:bg-[oklch(0.82_0.15_85/0.10)] hover:ring-1 hover:ring-[oklch(0.82_0.15_85/0.35)]",
                isHi ? "opacity-0 h-0 py-0 overflow-hidden" : "opacity-100",
              )}
            >
              <span
                className={cn(
                  "flex items-center font-sans font-semibold uppercase text-[oklch(0.65_0.03_255)]",
                  isSm ? "gap-1 text-[8px] tracking-[0.10em]" : "gap-1.5 text-[9px] tracking-[0.14em]",
                )}
              >
                {attr.higherIsBetter ? (
                  <TrendingUp className="h-2.5 w-2.5 shrink-0 text-[oklch(0.74_0.18_150/0.7)]" />
                ) : (
                  <TrendingDown className="h-2.5 w-2.5 shrink-0 text-[oklch(0.65_0.22_25/0.7)]" />
                )}
                {attr.short}
              </span>
              <span
                className={cn(
                  "font-sans font-bold tabular-nums text-[oklch(0.92_0.06_255)]",
                  isLg ? "text-sm" : isSm ? "text-[11px]" : "text-xs",
                )}
              >
                {value}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom accent line */}
      <div className="mt-auto h-[2px] w-full bg-gradient-to-r from-transparent via-[oklch(0.82_0.15_85/0.4)] to-transparent" />

      {/* Shimmer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute inset-y-0 -inset-x-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-[oklch(0.82_0.15_85/0.07)] to-transparent animate-shimmer" />
      </div>
    </motion.div>
  );
}

export function CardBack({ size = "md" }: { size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-[52px] h-[76px]" : "w-[88px] h-[128px]";
  return (
    <div className={cn("card-back relative shrink-0 rounded-xl", sz)}>
      <div className="absolute inset-2 rounded-lg border border-[oklch(0.82_0.15_85/0.4)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-sans text-lg text-[oklch(0.82_0.15_85/0.65)]">✦</span>
      </div>
    </div>
  );
}
