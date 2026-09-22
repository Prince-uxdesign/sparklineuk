import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"request" | "update">("request");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Check if this is a recovery redirect
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setMode("update");
    }
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("rate limit")) {
        toast.error("Too many attempts. Please try again later.");
      } else {
        toast.error("Unable to send reset email. Please try again.");
      }
    } else {
      toast.success("Check your email for a reset link.");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("same password") || msg.includes("different")) {
        toast.error("New password must be different from your current one.");
      } else {
        toast.error("Unable to update password. Please try again.");
      }
    } else {
      toast.success("Password updated successfully.");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[400px]"
      >
        <a href="/" className="font-heading text-xl font-bold text-foreground inline-block mb-10">
          Sparkline
        </a>

        {mode === "request" ? (
          <>
            <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
              Reset your password
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              Enter your email and we'll send you a reset link.
            </p>
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                  className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
                  placeholder="jane@sparkle.com"
                />
              </div>
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className="w-full h-[44px] rounded-[12px] bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send reset link"}
              </motion.button>
            </form>
          </>
        ) : (
          <>
            <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
              Set new password
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              Enter your new password below.
            </p>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
                  placeholder="Min. 6 characters"
                />
              </div>
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className="w-full h-[44px] rounded-[12px] bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Updating…" : "Update password"}
              </motion.button>
            </form>
          </>
        )}

        <p className="text-sm text-muted-foreground text-center mt-6">
          <Link to="/login" className="text-foreground font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
