import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Shield, Clock } from "lucide-react";
import PageShell from "@/components/PageShell";

const values = [
  { icon: Sparkles, title: "Simplicity", desc: "We obsess over making the complex feel effortless. If it takes more than two clicks, we redesign it." },
  { icon: Shield, title: "Reliability", desc: "Your business runs on Sparkline. Uptime, data safety, and trust aren't features — they're foundations." },
  { icon: Clock, title: "Respect for your time", desc: "Every feature we build is measured by one question: does this save a cleaning business owner time?" },
];

const team = [
  { name: "Alex Reed", role: "Co-founder & CEO", bio: "Former ops lead at a cleaning franchise. Knows the pain firsthand.", initials: "AR" },
  { name: "Priya Sharma", role: "Co-founder & CTO", bio: "Ex-Monzo engineer. Believes great software should feel invisible.", initials: "PS" },
  { name: "Daniel Osei", role: "Head of Product", bio: "Previously at Housekeep. Obsessed with workflow optimisation.", initials: "DO" },
];

const AboutPage = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <PageShell title="About | Sparkline — Cleaning Business Software UK" description="We built Sparkline because cleaning businesses deserve better tools. Learn about our mission, values and team.">
      <section className="pt-32 pb-16 px-6" ref={ref}>
        <div className="content-container max-w-[720px]">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-8 text-center"
          >
            We built Sparkline because cleaning businesses deserve better tools.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-6 text-muted-foreground leading-relaxed"
          >
            <p>
              Cleaning business owners are incredible at what they do. They build trust with clients, manage teams across multiple sites, and deliver results every single day. But behind the scenes, they're buried in spreadsheets, WhatsApp threads, and manual invoicing. We've seen it. We've lived it.
            </p>
            <p>
              So we built Sparkline — the simplest, most complete management tool designed specifically for UK cleaning companies. No bloated enterprise features. No confusing dashboards. Just the tools you actually need: booking, scheduling, invoicing, and client management, all in one place.
            </p>
            <p>
              Our mission is to help 10,000 cleaning businesses run smarter by 2027. We believe that when you spend less time on admin, you spend more time growing — and that's what excites us most.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding">
        <div className="content-container max-w-[960px]">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-heading text-2xl md:text-3xl font-bold text-foreground text-center mb-10"
          >
            Our values
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-2xl border border-border bg-card"
              >
                <v.icon className="w-6 h-6 text-primary mb-4" />
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding">
        <div className="content-container max-w-[960px]">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-heading text-2xl md:text-3xl font-bold text-foreground text-center mb-10"
          >
            The team behind Sparkline
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {team.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-2xl border border-border bg-card text-center"
              >
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <span className="font-heading text-lg font-semibold text-muted-foreground">{m.initials}</span>
                </div>
                <h3 className="font-heading text-base font-semibold text-foreground">{m.name}</h3>
                <p className="text-xs text-primary font-medium mb-2">{m.role}</p>
                <p className="text-sm text-muted-foreground">{m.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="content-container text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-lg text-muted-foreground mb-4">Want to work with us?</p>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Link
                to="/careers"
                className="inline-flex items-center justify-center h-[44px] px-6 bg-foreground text-background text-sm font-medium rounded-[12px] hover:opacity-90 transition-opacity"
              >
                View open roles
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </PageShell>
  );
};

export default AboutPage;
