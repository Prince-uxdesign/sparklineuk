const logos = ["CleanCo", "BrightHomes", "PureSpace", "SwiftMaids", "NeatNest", "GlossGroup"];

const LogosSection = () => {
  return (
    <section className="py-16 border-y border-border overflow-hidden">
      <p className="text-center text-sm text-muted-foreground mb-10">
        Trusted by teams at
      </p>
      <div className="relative">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...logos, ...logos].map((name, i) => (
            <span
              key={i}
              className="mx-10 md:mx-16 text-2xl md:text-3xl font-heading font-semibold text-border select-none"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogosSection;
