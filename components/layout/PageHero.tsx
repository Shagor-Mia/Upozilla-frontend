export function PageHero({ title, description }: { title: string; description: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-primary p-8 text-on-primary shadow-sm">
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative z-10 max-w-2xl">
        <h1 className="text-headline-lg md:text-display-hero mb-2">{title}</h1>
        <p className="text-body-md text-inverse-primary/90">{description}</p>
      </div>
    </div>
  );
}
