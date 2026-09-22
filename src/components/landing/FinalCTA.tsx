import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const FinalCTA = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="bg-primary text-primary-foreground py-[120px] md:py-[160px] px-6">
      <div className="content-container text-center">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="font-heading text-3xl md:text-5xl font-bold mb-5"
        >
          Your competitors are already moving faster.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="text-lg text-primary-foreground/70 mb-10 max-w-[500px] mx-auto"
        >
          Start your 14-day free trial. No credit card required.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        >
          <motion.a
            href="#pricing"
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center justify-center h-[48px] px-8 bg-card text-foreground text-sm font-medium rounded-[12px] hover:bg-card/90 transition-colors"
          >
            Get started free
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
