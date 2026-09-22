import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "We went from sticky notes and group texts to a fully automated system. Sparkline saved us 15 hours a week on admin alone.",
    name: "Jessica Moore",
    company: "CleanSlate Services",
    initials: "JM",
  },
  {
    quote: "Our no-show rate dropped 40% after switching to Sparkline's automated reminders. The invoicing alone pays for itself.",
    name: "David Park",
    company: "BrightSide Cleaning Co.",
    initials: "DP",
  },
  {
    quote: "I was managing 12 cleaners with spreadsheets. Now I manage 30 with less effort. Sparkline is the backbone of our operation.",
    name: "Maria Santos",
    company: "PureTouch Pro",
    initials: "MS",
  },
];

const Testimonials = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="section-padding bg-secondary/50" ref={ref}>
      <div className="content-container">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="font-heading text-3xl md:text-5xl font-bold text-foreground text-center mb-16"
        >
          What cleaning businesses say about us.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
              className="p-8 rounded-2xl border border-border bg-card"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-foreground text-foreground" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-6">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
