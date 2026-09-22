import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, LayoutGrid, FileText, Users, UserCog, BarChart3 } from "lucide-react";
import PageShell from "@/components/PageShell";

const features = [
  {
    icon: CalendarCheck,
    title: "Smart Booking",
    desc: "Give clients a booking link they can use 24/7. No phone calls, no back and forth. They pick a service, choose a time, and you get notified instantly.",
    mockup: "booking",
  },
  {
    icon: LayoutGrid,
    title: "Job Scheduling",
    desc: "A drag-and-drop weekly calendar built for cleaning teams. See every job, every cleaner, every day at a glance.",
    mockup: "calendar",
  },
  {
    icon: FileText,
    title: "Automated Invoicing",
    desc: "Invoices generate and send the moment a job is marked complete. Get paid faster without lifting a finger.",
    mockup: "invoice",
  },
  {
    icon: Users,
    title: "Client CRM",
    desc: "Every client's full history, preferences, notes, and invoices in one place. Never lose context again.",
    mockup: "crm",
  },
  {
    icon: UserCog,
    title: "Team Management",
    desc: "Add cleaners, assign jobs, track hours, and manage roles without WhatsApp chaos.",
    mockup: "team",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Know your revenue, busiest days, top clients, and growth trends at a glance.",
    mockup: "analytics",
  },
];

const mockups: Record<string, React.ReactNode> = {
  booking: (
    <div className="space-y-3">
      {["Deep Clean", "Regular Clean", "Move-out Clean"].map((s) => (
        <div key={s} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
          <span className="text-sm text-foreground">{s}</span>
          <span className="text-xs text-muted-foreground">from £65</span>
        </div>
      ))}
    </div>
  ),
  calendar: (
    <div className="grid grid-cols-5 gap-1">
      {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
        <div key={d} className="text-center">
          <p className="text-[10px] text-muted-foreground mb-1">{d}</p>
          <div className={`h-14 rounded-lg border border-border ${d === "Wed" ? "bg-primary/10 border-primary" : "bg-background"}`} />
        </div>
      ))}
    </div>
  ),
  invoice: (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>INV-1042</span><span>£320.00</span>
      </div>
      <div className="h-px bg-border" />
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Subtotal</span><span className="text-foreground font-mono">£266.67</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">VAT (20%)</span><span className="text-foreground font-mono">£53.33</span>
      </div>
      <div className="flex justify-between text-sm font-medium pt-1 border-t border-border">
        <span className="text-foreground">Total</span><span className="text-foreground font-mono">£320.00</span>
      </div>
    </div>
  ),
  crm: (
    <div className="space-y-3">
      {[
        { name: "Sarah Johnson", tag: "Regular" },
        { name: "TechHub Office", tag: "Commercial" },
      ].map((c) => (
        <div key={c.name} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium text-muted-foreground">
            {c.name.split(" ").map((w) => w[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">{c.name}</p>
          </div>
          <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-md text-muted-foreground">{c.tag}</span>
        </div>
      ))}
    </div>
  ),
  team: (
    <div className="space-y-2">
      {["Maria S. — Cleaner", "James L. — Cleaner", "Ava R. — Manager"].map((m) => (
        <div key={m} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-background">
          <div className="w-6 h-6 rounded-full bg-secondary" />
          <span className="text-xs text-foreground">{m}</span>
        </div>
      ))}
    </div>
  ),
  analytics: (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {[
          { l: "Revenue", v: "£18,240" },
          { l: "Jobs", v: "342" },
        ].map((s) => (
          <div key={s.l} className="p-3 rounded-lg border border-border bg-background">
            <p className="text-[10px] text-muted-foreground">{s.l}</p>
            <p className="font-mono text-sm font-semibold text-foreground">{s.v}</p>
          </div>
        ))}
      </div>
      <div className="h-16 rounded-lg border border-border bg-background flex items-end p-2 gap-1">
        {[40, 60, 35, 80, 65, 90, 70].map((h, i) => (
          <div key={i} className="flex-1 bg-primary/20 rounded-sm" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  ),
};

const FeatureSection = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reversed = index % 2 === 1;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`flex flex-col ${reversed ? "md:flex-row-reverse" : "md:flex-row"} gap-10 md:gap-16 items-center`}
    >
      <div className="flex-1 space-y-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <feature.icon className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-heading text-2xl font-bold text-foreground">{feature.title}</h3>
        <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
      </div>
      <div className="flex-1 w-full">
        <div className="rounded-2xl border border-border bg-card p-6">
          {mockups[feature.mockup]}
        </div>
      </div>
    </motion.div>
  );
};

const FeaturesPage = () => {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <PageShell title="Features | Sparkline — Cleaning Business Software UK" description="Explore Sparkline's features: smart booking, job scheduling, automated invoicing, client CRM, team management and analytics for UK cleaning businesses.">
      <section className="pt-32 pb-16 px-6" ref={heroRef}>
        <div className="content-container max-w-[720px] text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="section-label mb-4"
          >
            FEATURES
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            Built for how cleaning businesses actually work.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-muted-foreground"
          >
            Every tool you need to run your operation — without the complexity you don't.
          </motion.p>
        </div>
      </section>

      <section className="section-padding">
        <div className="content-container max-w-[960px] space-y-24">
          {features.map((f, i) => (
            <FeatureSection key={f.title} feature={f} index={i} />
          ))}
        </div>
      </section>

      <section className="section-padding">
        <div className="content-container text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-border bg-card p-12 md:p-16 max-w-[720px] mx-auto"
          >
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to see it in action?
            </h2>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center h-[48px] px-7 bg-primary text-primary-foreground text-sm font-medium rounded-[12px] hover:opacity-90 transition-opacity"
              >
                Start free trial
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </PageShell>
  );
};

export default FeaturesPage;
