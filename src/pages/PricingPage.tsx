import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown } from "lucide-react";
import PageShell from "@/components/PageShell";

const plans = [
  {
    name: "Starter",
    monthly: 39,
    annual: 33,
    highlighted: false,
    features: ["1 team member", "50 bookings/mo", "Basic analytics", "Invoicing", "Email support"],
  },
  {
    name: "Growth",
    monthly: 79,
    annual: 66,
    highlighted: true,
    badge: "Most Popular",
    features: ["5 team members", "Unlimited bookings", "Advanced analytics", "Invoicing + auto-reminders", "Priority support"],
  },
  {
    name: "Pro",
    monthly: 159,
    annual: 133,
    highlighted: false,
    features: ["Unlimited team", "Unlimited bookings", "Custom reports", "White-label client portal", "Dedicated account manager"],
  },
];

const faqs = [
  { q: "Can I change plans later?", a: "Yes, upgrade or downgrade any time." },
  { q: "What happens after the free trial?", a: "You'll be asked to choose a plan. We won't charge you automatically." },
  { q: "Is there a contract?", a: "No. Monthly plans cancel any time." },
  { q: "Do you offer refunds?", a: "Yes, within 14 days of any charge, no questions asked." },
  { q: "Can I add more team members?", a: "Yes, additional seats available on Growth and Pro plans." },
];

const PricingPage = () => {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <PageShell title="Pricing | Sparkline — Cleaning Business Software UK" description="Simple, transparent pricing for UK cleaning businesses. Start free for 14 days. Plans from £39/month.">
      <section className="pt-32 pb-16 px-6" ref={ref}>
        <div className="content-container text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            Honest pricing. No surprises.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-muted-foreground mb-10"
          >
            Start free for 14 days. No credit card required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center gap-3 mb-14"
          >
            <span className={`text-sm ${!annual ? "text-foreground font-medium" : "text-muted-foreground"}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${annual ? "bg-primary" : "bg-border"}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-card rounded-full transition-transform duration-200 ${annual ? "translate-x-6" : ""}`} />
            </button>
            <span className={`text-sm ${annual ? "text-foreground font-medium" : "text-muted-foreground"}`}>Annual</span>
            {annual && (
              <span className="text-xs text-success font-medium bg-success/10 px-2 py-0.5 rounded-full">Save 2 months</span>
            )}
          </motion.div>
        </div>

        <div className="content-container grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[960px] mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
              className={`relative p-8 rounded-2xl border transition-colors ${
                plan.highlighted ? "bg-primary text-primary-foreground border-primary" : "bg-card text-card-foreground border-border"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-medium bg-accent text-accent-foreground px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              <h3 className="font-heading text-lg font-semibold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-mono text-4xl font-bold">£{annual ? plan.annual : plan.monthly}</span>
                <span className={`text-sm ${plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                    <span className={plan.highlighted ? "text-primary-foreground/90" : ""}>{f}</span>
                  </li>
                ))}
              </ul>
              <motion.div whileTap={{ scale: 0.97 }}>
                <Link
                  to="/signup"
                  className={`w-full h-[44px] rounded-[12px] text-sm font-medium transition-colors flex items-center justify-center ${
                    plan.highlighted ? "bg-card text-foreground hover:bg-card/90" : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                >
                  Get started
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding">
        <div className="content-container max-w-[720px]">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-heading text-2xl md:text-3xl font-bold text-foreground text-center mb-10"
          >
            Common questions
          </motion.h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-sm font-medium text-foreground">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </motion.div>
                </motion.div>
              );
            })}
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
            <p className="text-lg text-muted-foreground mb-4">Still unsure?</p>
            <Link
              to="/contact"
              className="text-foreground font-medium underline hover:no-underline text-sm"
            >
              Talk to us →
            </Link>
          </motion.div>
        </div>
      </section>
    </PageShell>
  );
};

export default PricingPage;
