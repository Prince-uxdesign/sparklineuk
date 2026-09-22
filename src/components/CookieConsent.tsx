import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const COOKIE_KEY = "sparkline_cookie_consent";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_KEY, "all");
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_KEY, "essential");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="max-w-[600px] mx-auto rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-lg">
            <p className="text-sm text-foreground font-medium mb-1">We use cookies</p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              We use essential cookies to make Sparkline work. We'd also like to use analytics cookies to understand how you use our platform and improve it.{" "}
              <Link to="/privacy" className="underline hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                className="h-[36px] px-4 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Reject Non-Essential
              </button>
              <button
                onClick={handleAccept}
                className="h-[36px] px-4 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
