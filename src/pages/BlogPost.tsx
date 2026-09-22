import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const title = slug
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "Blog Post";

  return (
    <PageShell title={`${title} | Sparkline Blog`} description={`Read "${title}" on the Sparkline blog.`}>
      <article className="pt-32 pb-16 px-6">
        <div className="max-w-[720px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 block">
              ← Back to blog
            </Link>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              {title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-10">
              <span>By Sparkline Team</span>
              <span>•</span>
              <span>February 2025</span>
              <span>•</span>
              <span>5 min read</span>
            </div>
            <div className="prose-sm text-muted-foreground leading-relaxed space-y-4">
              <p>
                Full article coming soon. We're working on creating in-depth, practical content to help UK cleaning business owners grow their companies.
              </p>
              <p>
                In the meantime, if you have questions about this topic, feel free to{" "}
                <Link to="/contact" className="text-foreground underline">get in touch</Link>
                . We'd love to help.
              </p>
            </div>
          </motion.div>
        </div>
      </article>
    </PageShell>
  );
};

export default BlogPost;
