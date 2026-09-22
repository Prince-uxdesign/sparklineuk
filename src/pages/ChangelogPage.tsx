import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import PageShell from "@/components/PageShell";

const entries = [
  {
    version: "v1.4.0",
    date: "February 2025",
    title: "VAT invoicing",
    desc: "Invoices now automatically calculate and display VAT at 20%. You can override the rate per invoice.",
    isNew: true,
  },
  {
    version: "v1.3.2",
    date: "January 2025",
    title: "Scheduler performance",
    desc: "The weekly calendar now loads 3x faster on mobile devices.",
    isNew: true,
  },
  {
    version: "v1.3.0",
    date: "December 2024",
    title: "Client portal beta",
    desc: "Clients can now log in to view their booking history and download invoices.",
    isNew: false,
  },
  {
    version: "v1.2.1",
    date: "November 2024",
    title: "Invoice totals bug fix",
    desc: "Fixed an issue where invoices sent via email would sometimes show incorrect totals.",
    isNew: false,
  },
  {
    version: "v1.2.0",
    date: "October 2024",
    title: "Team roles",
    desc: "You can now assign Admin, Cleaner, or Manager roles to team members with different permission levels.",
    isNew: false,
  },
  {
    version: "v1.1.0",
    date: "September 2024",
    title: "Public launch",
    desc: "Sparkline officially launched for UK cleaning businesses.",
    isNew: false,
  },
];

const ChangelogPage = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <PageShell title="Changelog | Sparkline — Cleaning Business Software UK" description="See what's new in Sparkline. We ship every week — here's what's changed.">
      <section className="pt-32 pb-16 px-6" ref={ref}>
        <div className="content-container max-w-[720px] text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            What's new in Sparkline
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            We ship every week. Here's what's changed.
          </motion.p>
        </div>
      </section>

      <section className="section-padding pt-0">
        <div className="content-container max-w-[720px]">
          <div className="space-y-0">
            {entries.map((entry, i) => (
              <motion.div
                key={entry.version}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="flex gap-6 md:gap-10"
              >
                {/* Timeline */}
                <div className="flex flex-col items-center flex-shrink-0 w-24 md:w-32">
                  <div className={`w-3 h-3 rounded-full mt-1.5 ${i === 0 ? "bg-primary" : "bg-border"}`} />
                  {i < entries.length - 1 && <div className="w-px flex-1 bg-border" />}
                </div>

                <div className="pb-10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-medium text-foreground bg-secondary px-2 py-0.5 rounded-md">
                      {entry.version}
                    </span>
                    {entry.isNew && (
                      <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{entry.date}</p>
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-1">{entry.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{entry.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
};

export default ChangelogPage;
