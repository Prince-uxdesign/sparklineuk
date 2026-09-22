import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What is the best software for cleaning businesses in the UK?",
    a: "Sparkline is purpose-built for UK cleaning businesses, offering online booking, automated invoicing, scheduling, and client management in one platform with pricing in GBP.",
  },
  {
    q: "How much does cleaning business software cost in the UK?",
    a: "Sparkline offers three plans starting from £39/month for solo cleaners, £79/month for growing teams, and £159/month for large operations. All plans include a 14-day free trial.",
  },
  {
    q: "Can clients book cleaning appointments online?",
    a: "Yes. Every Sparkline account comes with a custom public booking page where your clients can book and pay for services 24/7 without calling you.",
  },
  {
    q: "Does Sparkline work for both domestic and commercial cleaning?",
    a: "Yes. Sparkline supports domestic cleaning companies, commercial office cleaners, end-of-tenancy specialists, and post-construction cleaning teams.",
  },
  {
    q: "Is there a free trial?",
    a: "Absolutely. Every plan comes with a 14-day free trial — no credit card required. You can explore all features before committing.",
  },
  {
    q: "Can I manage my team with Sparkline?",
    a: "Yes. Assign cleaners to jobs, track hours, manage availability, and monitor team performance — all from one dashboard.",
  },
];

const FAQ = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="section-padding" ref={ref}>
      <div className="content-container max-w-[720px]">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-14"
        >
          <p className="section-label mb-4">FAQ</p>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground">
            Frequently asked questions
          </h2>
        </motion.div>

        <div className="space-y-2">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.06 }}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-sm font-medium text-foreground">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
