export function BreathingCircle() {
  return (
    <div
      className="breathing-circle breathing-orb grid size-36 place-items-center rounded-full bg-cyan-soft shadow-soft ring-8 ring-card/70 sm:size-40"
      style={{
        animationName: "breathing-478",
        animationDuration: "19s",
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
      }}
      aria-label="Círculo de respiración 4-7-8"
      role="img"
    >
      <div
        className="breathing-circle-core breathing-orb-core size-20 rounded-full bg-teal/55"
        style={{
          animationName: "breathing-478-opacity",
          animationDuration: "19s",
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
        }}
      />
    </div>
  );
}

export const BreathingCircleFallback = BreathingCircle;

export function BreathingSphereView() {
  return <BreathingCircle />;
}
