import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  quote: string;
  author: string;
  role: string;
}

const features = [
  "Smart booking & scheduling",
  "Automated invoicing",
  "Client CRM & analytics",
];

const AuthLayout = ({ children, quote, author, role }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground flex-col justify-between p-12 xl:p-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <a href="/" className="font-heading text-xl font-bold text-primary-foreground">
            Sparkline
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-md"
        >
          <p className="text-2xl xl:text-3xl font-heading font-semibold leading-snug mb-8">
            "{quote}"
          </p>
          <div>
            <p className="text-sm font-medium text-primary-foreground">{author}</p>
            <p className="text-sm text-primary-foreground/50">{role}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col gap-2"
        >
          {features.map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-primary-foreground/50">
              <div className="w-1 h-1 rounded-full bg-primary-foreground/30" />
              {f}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-card p-6 sm:p-10 lg:p-16 min-h-screen lg:min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <a href="/" className="font-heading text-xl font-bold text-foreground">
              Sparkline
            </a>
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
