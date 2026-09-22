import { motion } from "framer-motion";

import type { Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.1 },
  }),
};

const avatars = [
  "SJ", "MK", "AL", "RP", "TW"
];

const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center section-padding pt-[140px]">
      <div className="content-container">
        <div className="max-w-[800px] mx-auto text-center">
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex items-center justify-center gap-2 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium">
              Trusted by 2,000+ cleaning professionals across the UK
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-bold text-foreground leading-[1.05] mb-6"
          >
            The #1 cleaning business software UK companies trust.
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-lg md:text-xl text-muted-foreground max-w-[600px] mx-auto mb-10"
          >
            Booking, scheduling, invoicing, and client management — unified in one beautifully simple platform.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex items-center justify-center gap-4 mb-12"
          >
            <motion.a
              href="#pricing"
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center justify-center h-[48px] px-7 bg-primary text-primary-foreground text-sm font-medium rounded-[12px] hover:opacity-90 transition-opacity"
            >
              Start for free
            </motion.a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center h-[48px] px-4 text-sm font-medium text-foreground hover:underline transition-all"
            >
              See how it works →
            </a>
          </motion.div>

          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex items-center justify-center gap-3"
          >
            <div className="flex -space-x-2">
              {avatars.map((initials, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] font-medium text-muted-foreground"
                >
                  {initials}
                </div>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              Join 2,000+ businesses already on Sparkline
            </span>
          </motion.div>
        </div>

        {/* Browser Mockup */}
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-16 md:mt-20 max-w-[960px] mx-auto"
        >
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] rotate-[-0.5deg]">
            {/* Browser Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-border"></div>
                <div className="w-3 h-3 rounded-full bg-border"></div>
                <div className="w-3 h-3 rounded-full bg-border"></div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-background rounded-md px-4 py-1 text-xs text-muted-foreground border border-border">
                  app.sparkline.co.uk/dashboard
                </div>
              </div>
            </div>
            {/* Dashboard Content */}
            <div className="p-6 md:p-8 bg-card min-h-[300px] md:min-h-[400px]">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Revenue", value: "£24,580", change: "+12.5%" },
                  { label: "Bookings", value: "342", change: "+8.2%" },
                  { label: "Clients", value: "189", change: "+5.1%" },
                ].map((stat) => (
                  <div key={stat.label} className="p-4 rounded-xl border border-border bg-background">
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className="font-mono text-xl font-semibold text-foreground">{stat.value}</p>
                    <p className="text-xs text-success font-medium mt-1">{stat.change}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-foreground">Upcoming Jobs</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
                {[
                  { time: "9:00 AM", client: "Sarah Johnson", service: "Deep Clean" },
                  { time: "11:30 AM", client: "Mark Davis", service: "Regular Clean" },
                  { time: "2:00 PM", client: "Emily Chen", service: "Move-out Clean" },
                ].map((job) => (
                  <div key={job.time} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground w-16">{job.time}</span>
                      <span className="text-sm text-foreground">{job.client}</span>
                    </div>
                    <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">{job.service}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
