import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { Link } from "react-router-dom";
import PageShell from "@/components/PageShell";

const integrations = [
  { name: "Stripe", desc: "Accept online payments seamlessly" },
  { name: "Xero", desc: "Sync invoices with your accounting" },
  { name: "QuickBooks", desc: "Automated bookkeeping and reports" },
  { name: "Google Calendar", desc: "Two-way scheduling sync" },
  { name: "Outlook Calendar", desc: "Keep your Microsoft calendar updated" },
  { name: "Zapier", desc: "Connect 5,000+ apps with automations" },
  { name: "Slack", desc: "Instant team notifications" },
  { name: "WhatsApp Business", desc: "Message clients directly" },
  { name: "Mailchimp", desc: "Email marketing campaigns" },
  { name: "Google Maps", desc: "Address lookup and route planning" },
  { name: "Twilio", desc: "Automated SMS reminders" },
  { name: "GoCardless", desc: "UK direct debit payments" },
];

const IntegrationsPage = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <PageShell title="Integrations | Sparkline — Cleaning Business Software UK" description="Sparkline integrates with Stripe, Xero, QuickBooks, Google Calendar, Zapier and more. Connect your favourite tools in minutes.">
      <section className="pt-32 pb-16 px-6" ref={ref}>
        <div className="content-container max-w-[720px] text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            Sparkline plays well with the tools you already use.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Connect your favourite apps in minutes.
          </motion.p>
        </div>
      </section>

      <section className="section-padding pt-0">
        <div className="content-container max-w-[960px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((int, i) => (
              <motion.div
                key={int.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
                whileHover={{ borderColor: "hsl(var(--primary))" }}
                className="p-6 rounded-2xl border border-border bg-card transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <span className="text-xs font-bold text-muted-foreground">{int.name.slice(0, 2).toUpperCase()}</span>
                </div>
                <h3 className="font-heading text-sm font-semibold text-foreground mb-1">{int.name}</h3>
                <p className="text-xs text-muted-foreground">{int.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="content-container text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-lg text-muted-foreground mb-4">Don't see your tool?</p>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center h-[44px] px-6 bg-foreground text-background text-sm font-medium rounded-[12px] hover:opacity-90 transition-opacity"
              >
                Request an integration
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </PageShell>
  );
};

export default IntegrationsPage;
