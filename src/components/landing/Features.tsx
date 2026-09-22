import { motion } from "framer-motion";
import { Calendar, Clock, FileText, Users, UserCog, BarChart3 } from "lucide-react";
import { useInView } from "framer-motion";
import { useRef } from "react";

const features = [
  {
    icon: Calendar,
    title: "Smart Booking",
    description: "Clients book 24/7 from your custom link. No phone tag, no back-and-forth.",
  },
  {
    icon: Clock,
    title: "Job Scheduling",
    description: "Drag-and-drop calendar for your entire team. See who's where at a glance.",
  },
  {
    icon: FileText,
    title: "Auto Invoicing",
    description: "Invoices sent automatically after job completion. Get paid faster, every time.",
  },
  {
    icon: Users,
    title: "Client CRM",
    description: "Full history, notes, and preferences per client. Never forget a detail.",
  },
  {
    icon: UserCog,
    title: "Team Management",
    description: "Assign cleaners, track hours, and manage roles from one dashboard.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Revenue, bookings, and growth metrics at a glance. Know your numbers.",
  },
];

const Features = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="section-padding" ref={ref}>
      <div className="content-container">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <p className="section-label mb-4">Features</p>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground">
            Everything your business needs.
            <br className="hidden md:block" /> Nothing it doesn't.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
              whileHover={{ scale: 1.01, borderColor: "hsl(217, 91%, 60%)" }}
              className="p-8 rounded-2xl border border-border bg-card transition-colors duration-200"
            >
              <feature.icon className="w-6 h-6 text-foreground mb-4" strokeWidth={1.5} />
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
