import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    number: "01",
    title: "Create your account",
    description: "Sign up in under 2 minutes. No credit card required.",
  },
  {
    number: "02",
    title: "Add your services & team",
    description: "Customize your service menu, pricing, and team members.",
  },
  {
    number: "03",
    title: "Share your booking link",
    description: "Clients book directly. You earn. It's that simple.",
  },
];

const HowItWorks = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="section-padding bg-secondary/50" ref={ref}>
      <div className="content-container">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="font-heading text-3xl md:text-5xl font-bold text-foreground text-center mb-20"
        >
          Set up in 15 minutes. Run forever.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
              className="relative text-center md:text-left"
            >
              <span className="font-mono text-[120px] md:text-[160px] font-bold text-border/50 leading-none absolute -top-8 md:-top-12 left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0 select-none pointer-events-none">
                {step.number}
              </span>
              <div className="relative pt-20 md:pt-28">
                <h3 className="font-heading text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
