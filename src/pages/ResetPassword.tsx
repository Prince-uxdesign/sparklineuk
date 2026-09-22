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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = (pw: string) => {
    const errors: string[] = [];
    if (pw.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(pw)) errors.push("One uppercase letter");
    if (!/[0-9]/.test(pw)) errors.push("One number");
    if (!/[^A-Za-z0-9]/.test(pw)) errors.push("One special character");
    return errors;
  };

  useEffect(() => {
    // Support both legacy hash flow and PKCE ?code= flow
    const hash = window.location.hash;
    const search = new URLSearchParams(window.location.search);
    if (hash.includes("type=recovery") || search.has("code")) {
      setMode("update");
      const code = search.get("code");
      if (code) {
        supabase.auth.exchangeCodeForSession(code).catch(() => {
          toast.error("Reset link expired. Please request a new one.");
        });
      }
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
    const pwErrors = validatePassword(password);
    if (pwErrors.length > 0) {
      toast.error(`Password requirements: ${pwErrors.join(", ")}.`);
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
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
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    maxLength={128}
                    className="w-full h-[44px] px-3.5 pr-16 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
                    placeholder="Min. 8 chars, upper, number, special"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  maxLength={128}
                  className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
                  placeholder="Repeat new password"
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
