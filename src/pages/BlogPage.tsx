import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { Link } from "react-router-dom";
import PageShell from "@/components/PageShell";

const posts = [
  {
    slug: "how-to-price-cleaning-services-uk",
    category: "Pricing",
    title: "How to price your cleaning services in the UK (2025 guide)",
    excerpt: "A practical breakdown of hourly rates, per-room pricing, and how to stay competitive without undercharging.",
    readTime: "6 min read",
  },
  {
    slug: "cleaning-businesses-lose-money",
    category: "Operations",
    title: "5 ways cleaning businesses lose money without realising it",
    excerpt: "From no-shows to unbilled travel time — here are the leaks draining your profit margins.",
    readTime: "5 min read",
  },
  {
    slug: "first-10-clients-cleaning-company",
    category: "Growth",
    title: "How to get your first 10 clients as a new cleaning company",
    excerpt: "Practical, no-fluff strategies for landing your first paying customers within 30 days.",
    readTime: "7 min read",
  },
  {
    slug: "domestic-vs-commercial-cleaning-software",
    category: "Software",
    title: "The difference between domestic and commercial cleaning software",
    excerpt: "Not all tools are built the same. Here's how to choose the right one for your operation.",
    readTime: "4 min read",
  },
  {
    slug: "london-cleaning-company-doubled-bookings",
    category: "Case Study",
    title: "How one London cleaning company doubled bookings in 3 months",
    excerpt: "A real story about streamlining operations and letting clients book online 24/7.",
    readTime: "5 min read",
  },
  {
    slug: "gdpr-basics-cleaning-businesses",
    category: "Compliance",
    title: "GDPR basics every UK cleaning business owner should know",
    excerpt: "You're handling client data every day. Here's how to stay compliant without the legal jargon.",
    readTime: "6 min read",
  },
];

const BlogPage = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <PageShell title="Blog | Sparkline — Resources for Cleaning Businesses" description="Practical guides, tips, and insights to help UK cleaning business owners grow their companies.">
      <section className="pt-32 pb-16 px-6" ref={ref}>
        <div className="content-container max-w-[720px] text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            Resources for cleaning business owners
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Practical guides, tips, and insights to help you grow.
          </motion.p>
        </div>
      </section>

      <section className="section-padding pt-0">
        <div className="content-container max-w-[960px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post, i) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                whileHover={{ scale: 1.02, borderColor: "hsl(var(--primary))" }}
                className="rounded-2xl border border-border bg-card p-6 flex flex-col transition-colors"
              >
                <span className="text-[10px] uppercase tracking-[0.1em] text-primary font-semibold mb-3">
                  {post.category}
                </span>
                <h3 className="font-heading text-base font-semibold text-foreground mb-2 leading-snug">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{post.readTime}</span>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="text-xs font-medium text-foreground hover:underline"
                  >
                    Read article →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
};

export default BlogPage;
