import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    monthly: 39,
    annual: 33,
    highlighted: false,
    features: [
      "1 team member",
      "50 bookings/mo",
      "Basic analytics",
      "Invoicing",
      "Email support",
    ],
  },
  {
    name: "Growth",
    monthly: 79,
    annual: 66,
    highlighted: true,
    badge: "Most Popular",
    features: [
      "5 team members",
      "Unlimited bookings",
      "Advanced analytics",
      "Invoicing + auto-reminders",
      "Priority support",
    ],
  },
  {
    name: "Pro",
    monthly: 159,
    annual: 133,
    highlighted: false,
    features: [
      "Unlimited team",
      "Unlimited bookings",
      "Custom reports",
      "White-label client portal",
      "Dedicated account manager",
    ],
  },
];

const Pricing = () => {
  const [annual, setAnnual] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" className="section-padding" ref={ref}>
      <div className="content-container">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-14"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
            Simple, transparent pricing.
          </h2>
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm ${!annual ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                annual ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-card rounded-full transition-transform duration-200 ${
                  annual ? "translate-x-6" : ""
                }`}
              />
            </button>
            <span className={`text-sm ${annual ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              Annual
            </span>
            {annual && (
              <span className="text-xs text-success font-medium bg-success/10 px-2 py-0.5 rounded-full">
                Save 2 months
              </span>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[960px] mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
              className={`relative p-8 rounded-2xl border transition-colors ${
                plan.highlighted
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-card-foreground border-border"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-medium bg-accent text-accent-foreground px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              <h3 className="font-heading text-lg font-semibold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-mono text-4xl font-bold">
                  £{annual ? plan.annual : plan.monthly}
                </span>
                <span className={`text-sm ${plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  /mo
                </span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm">
                    <Check className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                    <span className={plan.highlighted ? "text-primary-foreground/90" : ""}>{feature}</span>
                  </li>
                ))}
              </ul>
              <motion.button
                whileTap={{ scale: 0.97 }}
                className={`w-full h-[44px] rounded-[12px] text-sm font-medium transition-colors ${
                  plan.highlighted
                    ? "bg-card text-foreground hover:bg-card/90"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                Get started
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
