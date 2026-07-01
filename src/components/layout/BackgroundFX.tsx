export function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void">
      <div className="absolute inset-0 bg-noise" />
      <div
        className="absolute -top-40 left-[8%] h-[560px] w-[560px] rounded-full bg-grad-radial-violet blur-3xl animate-drift"
        aria-hidden
      />
      <div
        className="absolute top-1/3 right-[4%] h-[480px] w-[480px] rounded-full bg-grad-radial-cyan blur-3xl animate-drift"
        style={{ animationDelay: "-6s" }}
        aria-hidden
      />
      <div
        className="absolute bottom-[-10%] left-1/3 h-[420px] w-[420px] rounded-full bg-grad-radial-violet blur-3xl animate-drift"
        style={{ animationDelay: "-11s" }}
        aria-hidden
      />
      {/* Faint orderbook-style grid to ground the "trading terminal" feel */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.035]" aria-hidden>
        <defs>
          <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M 44 0 L 0 0 0 44" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-void" />
    </div>
  );
}
