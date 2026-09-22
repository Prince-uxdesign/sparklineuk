import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Mail, MapPin } from "lucide-react";
import PageShell from "@/components/PageShell";

const subjects = [
  "General enquiry",
  "Book a demo",
  "Billing question",
  "Technical support",
  "Partnership",
  "Press",
];

const ContactPage = () => {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submit
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
  };

  return (
    <PageShell title="Contact | Sparkline — Get in Touch" description="Get in touch with the Sparkline team. We reply to every message within one business day.">
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-[560px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-3">
              Get in touch
            </h1>
            <p className="text-muted-foreground">
              We reply to every message within one business day.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-center py-16"
              >
                <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-success" />
                </div>
                <h2 className="font-heading text-xl font-bold text-foreground mb-2">Message sent.</h2>
                <p className="text-sm text-muted-foreground">
                  We'll be in touch within one business day.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Full Name *</label>
                  <input
                    name="name"
                    type="text"
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={handleChange}
                    className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email Address *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    value={form.email}
                    onChange={handleChange}
                    className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
                    placeholder="you@company.co.uk"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Company Name</label>
                  <input
                    name="company"
                    type="text"
                    maxLength={100}
                    value={form.company}
                    onChange={handleChange}
                    className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">What can we help with? *</label>
                  <select
                    name="subject"
                    required
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors appearance-none"
                  >
                    <option value="" disabled>Select a topic</option>
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Message *</label>
                  <textarea
                    name="message"
                    required
                    maxLength={1000}
                    value={form.message}
                    onChange={handleChange}
                    className="w-full min-h-[140px] px-3.5 py-3 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors resize-none"
                    placeholder="Tell us what you need…"
                  />
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    {form.message.length}/1000
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full h-[48px] bg-foreground text-background text-sm font-medium rounded-[12px] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Sending…" : "Send message"}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Contact details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 space-y-2 text-center"
          >
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" /> hello@sparkline.co.uk
            </p>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" /> London, United Kingdom
            </p>
          </motion.div>
        </div>
      </section>
    </PageShell>
  );
};

export default ContactPage;
