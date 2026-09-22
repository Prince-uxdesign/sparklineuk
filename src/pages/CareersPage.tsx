import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, Briefcase } from "lucide-react";
import PageShell from "@/components/PageShell";

const perks = ["Remote-first", "Competitive salary", "Equity options", "Flexible hours"];

const roles = [
  {
    title: "Full-Stack Engineer",
    location: "Remote",
    type: "Full-time",
    desc: "Build and ship product features across the entire stack. You'll own projects end-to-end and work closely with design and customers.",
  },
  {
    title: "Customer Success Manager (UK)",
    location: "Remote",
    type: "Full-time",
    desc: "Help cleaning business owners get the most out of Sparkline. Onboard new customers, gather feedback, and champion their needs internally.",
  },
  {
    title: "Growth & Partnerships Lead",
    location: "Remote",
    type: "Full-time",
    desc: "Drive user acquisition through partnerships, content, and strategic channels. Own the growth funnel from awareness to activation.",
  },
];

const CareersPage = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <PageShell title="Careers | Sparkline — Join Our Team" description="Join the Sparkline team. We're remote-first, move fast, and care deeply about building tools cleaners actually love.">
      <section className="pt-32 pb-16 px-6" ref={ref}>
        <div className="content-container max-w-[720px] text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            Join us in building something cleaners actually love.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            We're a small, remote-first team. We move fast and care deeply.
          </motion.p>
        </div>
      </section>

      {/* Perks */}
      <section className="px-6 pb-16">
        <div className="content-container max-w-[720px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {perks.map((p) => (
              <span key={p} className="text-sm font-medium text-foreground bg-secondary px-4 py-2 rounded-full">
                {p}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Roles */}
      <section className="section-padding pt-0">
        <div className="content-container max-w-[720px]">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-heading text-2xl md:text-3xl font-bold text-foreground text-center mb-10"
          >
            Open roles
          </motion.h2>
          <div className="space-y-4">
            {roles.map((role, i) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-border bg-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <h3 className="font-heading text-lg font-semibold text-foreground">{role.title}</h3>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
                      <MapPin className="w-3 h-3" />{role.location}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
                      <Briefcase className="w-3 h-3" />{role.type}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{role.desc}</p>
                <Link
                  to="/contact"
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  Apply now →
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section-padding">
        <div className="content-container text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-muted-foreground mb-2">Don't see your role?</p>
            <p className="text-sm text-muted-foreground">
              Send us your CV anyway:{" "}
              <a href="mailto:careers@sparkline.co.uk" className="text-foreground underline">
                careers@sparkline.co.uk
              </a>
            </p>
          </motion.div>
        </div>
      </section>
    </PageShell>
  );
};

export default CareersPage;
