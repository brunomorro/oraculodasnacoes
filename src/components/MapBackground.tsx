import mapBg from "@/assets/world-map-bg.jpg";

export function MapBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <img
        src={mapBg}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover opacity-40"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,oklch(0.14_0.05_255/0.45)_70%,oklch(0.10_0.04_255/0.75)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.80_0.14_85/0.06)_0%,transparent_60%)]" />
    </div>
  );
}